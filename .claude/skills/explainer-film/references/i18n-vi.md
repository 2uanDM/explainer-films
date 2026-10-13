# Localizing the player UI (Vietnamese example)

Set `lang` and paste a full `ui` block into FILM. Every string the player shows comes from here, so nothing English is left on a Vietnamese film. Fonts: the engine loads Be Vietnam Pro as a fallback for display and narration text, so Vietnamese diacritics render cleanly even where Unbounded lacks a glyph.

```js
const FILM = {
  id: 'quang-hop',
  title: 'Cây ăn gì để lớn?',
  brand: 'Bếp của cây',
  lang: 'vi',
  ui: {
    start: 'Bắt đầu ▸', scenes: 'Tất cả cảnh', resume: 'Xem tiếp từ', replay: 'Xem lại ▸',
    narrated: 'Phim có lời dẫn, hãy bật âm thanh.', voiceOffNote: 'Lời dẫn đang tắt.', mutes: 'để tắt tiếng.', unmutes: 'để bật lại.',
    tapToHear: 'Chạm vào màn hình để nghe lời dẫn', voiceRests: 'Lời dẫn tạm dừng khi tua trên 2×', voiceBack: 'Lời dẫn trở lại ở tốc độ 2× trở xuống',
    learned: 'Đã học', note: 'Ghi nhớ', quiz: 'Kiểm tra nhanh', recap: 'Tổng kết', challenge: 'Tự thực hành',
    menuTitle: 'Các cảnh', menuHint: 'Chọn bất kỳ cảnh nào. Mỗi cảnh tự dựng lại, nên bắt đầu ở đâu cũng được.', runtime: ' Xem trọn vẹn khoảng {m} phút ở tốc độ 1×.',
    close: 'Đóng', voice: 'Giọng', auto: 'Tự chạy', loading: 'Đang dựng sân khấu',
    fallback: 'Không tải được sân khấu 3D trên mạng này.<br>Bảng ghi chú và lời dẫn vẫn chạy bình thường.',
    keys: [['Space', 'phát / tạm dừng'], ['← →', 'cảnh trước / sau'], ['R', 'xem lại cảnh'], ['A', 'tự chuyển cảnh'], ['M', 'danh sách cảnh'], ['F', 'toàn màn hình'], ['[ ]', 'tốc độ'], ['V', 'giọng đọc']],
  },
  // …
};
```

Voice: `--voice vi-VN-HoaiMyNeural` (female) or `vi-VN-NamMinhNeural` (male).

Writing tips for Vietnamese narration:
- Write numbers in words when the reading matters ("sáu phân tử", not "6 phân tử") or add them to `lexicon`.
- Chemical formulas: keep `CO₂` in the subtitle and add `"CO₂": "C O hai"` to the lexicon.
- Keep each line under about 25 syllables; the voice sounds rushed with long lines.

For other languages, translate the same keys. Keep `{m}` in `runtime`, and keep the key names in `keys` (Space, R, …) unless the keyboard differs.
