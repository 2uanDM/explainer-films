# Voices and narration audio

`scripts/build_vo.py` turns every narration line into `vo/<id>.mp3` and writes `vo.json`. The settings live in `<film>/voice.json`:

```json
{
  "provider": "edge",
  "voice": "en-US-AndrewMultilingualNeural",
  "rate": "+0%",
  "pitch": "+0Hz",
  "model": "",
  "instructions": "",
  "lexicon": { "CO₂": "C O two", "GPT": "G P T" }
}
```

CLI flags (`--provider --voice --rate --pitch --model --instructions`) override the file and are saved back into it. Changing any setting re-voices every line, because the settings are part of each clip's id. Rewriting one line re-voices only that line.

## Providers

| provider | cost / key | quality | notes |
|---|---|---|---|
| `edge` (default) | free, no key | good neural voices, 400+ voices in 100+ languages | runs `edge-tts` via `uv run`; the free endpoint throttles bursts, and the script retries with backoff. Use `--jobs 1` if it keeps failing |
| `openai` | `OPENAI_API_KEY` | very natural; steerable with `instructions` ("warm, unhurried teacher") | model `gpt-4o-mini-tts`; voices: alloy, ash, ballad, coral, echo, fable, nova, onyx, sage, shimmer, verse |
| `elevenlabs` | `ELEVENLABS_API_KEY` | most expressive | `voice` = a voice id from the user's ElevenLabs library; model `eleven_multilingual_v2` |
| `none` | – | – | subtitles only; the voice button is hidden |

Never print or store API keys. Read them only from the environment. If a key is missing, say so and offer `edge`.

## Recommended edge voices

List them all with `uvx edge-tts --list-voices` (add `| grep vi-VN` to filter).

| language | voices |
|---|---|
| English (US) | `en-US-AndrewMultilingualNeural` (warm male, default), `en-US-AvaMultilingualNeural` (expressive female), `en-US-BrianMultilingualNeural` (casual male), `en-US-EmmaMultilingualNeural` (cheerful female) |
| English (UK) | `en-GB-SoniaNeural`, `en-GB-RyanNeural` |
| Vietnamese | `vi-VN-HoaiMyNeural` (female), `vi-VN-NamMinhNeural` (male) |
| Japanese | `ja-JP-NanamiNeural`, `ja-JP-KeitaNeural` |
| Korean | `ko-KR-SunHiNeural`, `ko-KR-InJoonNeural` |
| Chinese (Mandarin) | `zh-CN-XiaoxiaoNeural`, `zh-CN-YunxiNeural` |
| French / Spanish / German | `fr-FR-DeniseNeural`, `es-ES-ElviraNeural`, `de-DE-KatjaNeural` |

The `*MultilingualNeural` voices can also read other languages, but a native voice sounds better.

Pace: teaching narration often sounds best at `--rate=-5%` for complex material, or `+5%` for light recap material. For young learners, use a slower rate and shorter lines.

## Pronunciation fixes

`lexicon` replaces whole words in the **spoken** text only; subtitles keep the original. Use it for symbols (CO₂, H₂O), acronyms the voice spells wrong or reads as words, product names, and Vietnamese loanwords the voice mispronounces. Longer keys apply first.

## How playback stays in sync

- vo.json maps each line's plain text to `[clip id, seconds, scene id]`.
- `N()` and `beat()` hold each line for the clip's length plus 0.45s, so visuals that follow wait for the voice.
- The engine keeps the audio on the scene clock: pausing pauses it, seeking jumps within the clip, and speed changes `playbackRate`. Above 2× the voice rests and lines hold for reading time instead.
- Browsers block sound until the first tap or key press. The engine primes both audio elements on that gesture and shows "Tap anywhere to hear the narrator" if it's still blocked.

## Re-voicing a film

Change the voice in voice.json (or pass `--voice`), then run build_vo.py, build.py and publish again. Old clips are pruned automatically. Publish the new `vo/*.mp3` files together with index.html, since the ids changed.
