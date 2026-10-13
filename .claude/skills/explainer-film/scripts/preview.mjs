#!/usr/bin/env node
// Headless check of a built film: serves <film-dir>, opens index.html?dev in Chrome, and for each scene
// seeks the scene clock to a few moments, screenshots them, then runs the scene to its end to measure
// how long it really takes. Reports console errors, missing files and timing problems.
//
//   node <skill>/scripts/preview.mjs <film-dir> [--scenes id1,id2] [--at 3,0.5,0.9] [--mobile] [--out dir]
//
// --at  moments to capture: values <= 1 are fractions of the scene's dur, values > 1 are seconds.
// Needs Node 22+ (built-in WebSocket) and Chrome/Chromium (set CHROME=/path if not found).
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile, mkdtemp, rm, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve, extname } from 'node:path';
import { tmpdir } from 'node:os';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const film = resolve(args.find(a => !a.startsWith('--') && !['--scenes', '--at', '--out'].includes(args[args.indexOf(a) - 1])) || '.');
const only = opt('--scenes', '')?.split(',').filter(Boolean);
const at = (opt('--at', '0.3,0.8')).split(',').map(Number);
const mobile = args.includes('--mobile');
const outDir = resolve(opt('--out', join(film, 'preview' + (mobile ? '-mobile' : ''))));

if (!existsSync(join(film, 'index.html'))) { console.error(`no index.html in ${film}; run build.py first`); process.exit(1); }

// ---------- static server ----------
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mp3': 'audio/mpeg', '.json': 'application/json', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml' };
const notFound = [];
const server = createServer(async (req, res) => {
  const p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const f = join(film, p === '/' ? 'index.html' : p);
  if (!f.startsWith(film)) { res.writeHead(403).end(); return; }
  try { const b = await readFile(f); res.writeHead(200, { 'content-type': TYPES[extname(f)] || 'application/octet-stream' }).end(b); }
  catch { notFound.push(p); res.writeHead(404).end(); }
});
await new Promise((r) => {
  server.once('error', e => { console.error(`cannot start the local preview server (${e.code} on ${e.syscall}).` + (e.code === 'EPERM' || e.code === 'EACCES' ? ' A sandbox is blocking loopback sockets: rerun this command with sandbox approval/escalation, or skip the preview and say so.' : '')); process.exit(3); });
  server.listen(0, '127.0.0.1', r);
});
const port = server.address().port;

// ---------- chrome ----------
const candidates = [process.env.CHROME, 'google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].filter(Boolean);
const profile = await mkdtemp(join(tmpdir(), 'film-preview-'));
let chrome, wsUrl; const launchErrors = [];
for (const bin of candidates) {
  try {
    let errTail = '';
    chrome = spawn(bin, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--no-first-run', '--no-default-browser-check', '--mute-audio', '--autoplay-policy=no-user-gesture-required', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--hide-scrollbars', 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
    wsUrl = await new Promise((res, rej) => {
      let buf = '';
      const t = setTimeout(() => rej(new Error('timeout')), 15000);
      chrome.on('error', rej);
      chrome.on('exit', code => rej(new Error(`exited with code ${code}: ${errTail.trim().split('\n').slice(-3).join(' | ')}`)));
      chrome.stderr.on('data', d => { buf += d; errTail = (errTail + d).slice(-2000); const m = buf.match(/DevTools listening on (ws:\/\/\S+)/); if (m) { clearTimeout(t); res(m[1]); } });
    });
    break;
  } catch (e) { if (e.code !== 'ENOENT') launchErrors.push(`${bin}: ${e.message}`); chrome?.kill(); chrome = null; }
}
if (!chrome) {
  if (launchErrors.length) { console.error('Chrome is installed but failed to start:\n  ' + launchErrors.join('\n  ') + '\nIn a sandboxed agent this usually means the sandbox blocks it: rerun with approval/escalation, or skip the preview and say so.'); process.exit(3); }
  console.error('Chrome not found; set CHROME=/path/to/chrome'); process.exit(1);
}

// ---------- CDP ----------
const ws = new WebSocket(wsUrl);
await new Promise(r => ws.addEventListener('open', r));
let seq = 0; const pending = new Map(); const listeners = [];
ws.addEventListener('message', ev => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { const { res, rej } = pending.get(m.id); pending.delete(m.id); m.error ? rej(new Error(m.error.message)) : res(m.result); }
  else listeners.forEach(f => f(m));
});
const send = (method, params = {}, sessionId) => new Promise((res, rej) => { const id = ++seq; pending.set(id, { res, rej }); ws.send(JSON.stringify({ id, method, params, sessionId })); });
const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
const S = (m, p) => send(m, p, sessionId);
const problems = [];
listeners.push(m => {
  if (m.sessionId !== sessionId) return;
  if (m.method === 'Runtime.exceptionThrown') problems.push('exception: ' + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text).split('\n').slice(0, 3).join(' | '));
  if (m.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(m.params.type)) {
    const txt = m.params.args.map(a => a.value ?? a.description ?? '').join(' ');
    if (!/GPU stall|swiftshader|WebGL|THREE\.WebGLRenderer: Context Lost/i.test(txt)) problems.push(`console.${m.params.type}: ${txt.slice(0, 300)}`);
  }
  if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error' && !/favicon/.test(m.params.entry.url || '')) problems.push(`log: ${m.params.entry.text} ${m.params.entry.url || ''}`);
});
await S('Runtime.enable'); await S('Log.enable'); await S('Page.enable');
const W = mobile ? { width: 390, height: 844, deviceScaleFactor: 2, mobile: true } : { width: 1600, height: 900, deviceScaleFactor: 1, mobile: false };
await S('Emulation.setDeviceMetricsOverride', W);
const evaluate = async (expr) => { const r = await S('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text); return r.result.value; };
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function shot(name) {
  const { data } = await S('Page.captureScreenshot', { format: 'png', captureBeyondViewport: mobile });
  const f = join(outDir, name + '.png'); await writeFile(f, Buffer.from(data, 'base64')); return f;
}

await mkdir(outDir, { recursive: true });
await S('Page.navigate', { url: `http://127.0.0.1:${port}/index.html?dev` });
for (let i = 0; i < 120; i++) { if (await evaluate('!!window.__ready').catch(() => false)) break; await sleep(250); }
if (!(await evaluate('!!window.__ready').catch(() => false))) { console.error('film did not boot within 30s'); problems.forEach(p => console.error('  ' + p)); process.exit(1); }
const webgl = await evaluate('!!(window.W && window.W.ok)');
await evaluate('setAuto(true)');      // quizzes reveal themselves; auto-advance only fires while playing, and seek() pauses
const scenes = (await evaluate('sceneInfo()')).filter(s => !only?.length || only.includes(s.id));

const report = [];
for (const s of scenes) {
  await evaluate(`goScene(${JSON.stringify(s.id)})`);
  await sleep(500);
  const shots = [];
  for (const a of at) {
    const t = a <= 1 ? +(a * s.dur).toFixed(2) : a;
    await evaluate(`seek(${t})`);
    await sleep(800);   // let real frames render and CSS fades (subtitles, cards) settle
    shots.push(await shot(`${s.num}-${s.id}-${String(t).replace('.', '_')}s`));
    const ovf = await evaluate('(() => { const W = document.documentElement.clientWidth, sw = document.documentElement.scrollWidth; if (sw <= W + 1) return null; const bad = [...document.querySelectorAll("#app *")].filter(e => { const r = e.getBoundingClientRect(); return r.width && r.right > W + 1 && getComputedStyle(e).position !== "fixed"; }).slice(0, 4).map(e => "#" + (e.id || e.className || e.tagName)); return `page is ${sw - W}px wider than the screen at ${t}s (${bad.join(", ")})`; })()');
    if (ovf) problems.push(`${s.id}: ${ovf}`);
  }
  let end = null, busy = null;
  if (!s.hold) {
    const limit = (s.dur || 30) * 2 + 30;
    await evaluate(`seek(${limit})`);
    end = await evaluate('Show.done ? +Show.endAt.toFixed(1) : null');
    busy = await evaluate('+Narr.busy().toFixed(1)');
  }
  const r = { id: s.id, num: s.num, dur: s.dur, endsAt: end, narrationUntil: busy, shots };
  if (!s.hold && end == null) r.issue = `run() never finished within ${(s.dur || 30) * 2 + 30}s (an un-awaited loop, or a cue that never fires?)`;
  else if (!s.hold && Math.abs(Math.max(end, busy) - s.dur) > Math.max(4, s.dur * .15)) r.issue = `dur is ${s.dur}s but the scene really runs ${Math.max(end, busy).toFixed(1)}s; set dur to about ${Math.ceil(Math.max(end, busy))}`;
  report.push(r);
  console.log(`${s.num} ${s.id.padEnd(16)} dur ${String(s.dur).padStart(3)}s  ends ${end ?? (s.hold ? 'hold' : '—')}  voice until ${busy ?? '-'}${r.issue ? '  ⚠ ' + r.issue : ''}`);
}

const missing = [...new Set(notFound)].filter(p => !/favicon/.test(p));
const summary = { film, viewport: W, webgl, scenes: report, problems: [...new Set(problems)], missingFiles: missing };
await writeFile(join(outDir, 'report.json'), JSON.stringify(summary, null, 1));
console.log(`\nWebGL stage: ${webgl ? 'ok' : 'FAILED (fallback shown)'}`);
if (missing.length) console.log('missing files:', missing.join(', '));
if (summary.problems.length) { console.log('problems:'); summary.problems.forEach(p => console.log('  ' + p)); }
else console.log('no console errors');
console.log(`screenshots + report.json in ${outDir}`);

ws.close(); chrome.kill(); server.close();
await rm(profile, { recursive: true, force: true }).catch(() => {});
process.exit(summary.problems.length || missing.length ? 2 : 0);
