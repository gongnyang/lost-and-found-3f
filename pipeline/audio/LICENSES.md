# 오디오 라이선스 대장 — 『분실물 보관소, 3층 D열』

최종 적재 위치: `app/public/assets/audio/{bgm,sfx}/` (전부 ogg vorbis, 볼륨 노멀라이즈 BGM -14 LUFS / SFX -16 LUFS 또는 피크 -1dB)
변환 스크립트: `pipeline/audio/scripts/build_audio.sh` (BGM q2, SFX q4)
총 용량: 약 12.2 MB

## BGM (7곡) — 전부 Kevin MacLeod, CC-BY 4.0 (크레딧 표기 필요)

출처: incompetech.com (직다운로드 URL 기재). 라이선스: [Creative Commons: By Attribution 4.0](https://creativecommons.org/licenses/by/4.0/)

| 파일 | 원곡 | 출처 URL | 길이 | 가공 |
|---|---|---|---|---|
| bgm/main-daily.ogg | "Carefree" | https://incompetech.com/music/royalty-free/mp3-royaltyfree/Carefree.mp3 | 3:25 | 원본 그대로 |
| bgm/theme-sea.ogg | "Fluffing a Duck" | https://incompetech.com/music/royalty-free/mp3-royaltyfree/Fluffing%20a%20Duck.mp3 | 2:15 | 원곡 1:07 × 2회 이어붙임(67s 지점이 루프 심) |
| bgm/theme-riwon.ogg | "Gymnopedie No 1" (Satie, MacLeod 연주) | https://incompetech.com/music/royalty-free/mp3-royaltyfree/Gymnopedie%20No%201.mp3 | 3:07 | 원본 그대로 |
| bgm/theme-yunseul.ogg | "Frost Waltz" | https://incompetech.com/music/royalty-free/mp3-royaltyfree/Frost%20Waltz.mp3 | 2:16 | 원본 그대로 |
| bgm/tension.ogg | "Long Note Two" | https://incompetech.com/music/royalty-free/mp3-royaltyfree/Long%20Note%20Two.mp3 | 2:20 | 원곡 7:42 중 앞 140초 + 3초 페이드아웃(앰비언트 드론이라 크로스페이드 루프 용이) |
| bgm/battle.ogg | "8bit Dungeon Boss" | https://incompetech.com/music/royalty-free/mp3-royaltyfree/8bit%20Dungeon%20Boss.mp3 | 2:52 | 원본 그대로(루프 전제로 작곡된 곡) |
| bgm/true-end.ogg | "Heartbreaking" | https://incompetech.com/music/royalty-free/mp3-royaltyfree/Heartbreaking.mp3 | 1:36 | 원본 그대로 |

### 필수 크레딧 문구 (게임 크레딧 화면에 포함할 것)

```
Music: "Carefree", "Fluffing a Duck", "Gymnopedie No 1", "Frost Waltz",
"Long Note Two", "8bit Dungeon Boss", "Heartbreaking"
by Kevin MacLeod (incompetech.com)
Licensed under Creative Commons: By Attribution 4.0
https://creativecommons.org/licenses/by/4.0/
```

## SFX (13종)

### A. media-use 스킬 번들 (원출처 Pixabay) — Pixabay Content License, 크레딧 불요

라이선스: https://pixabay.com/service/license-summary/ (상업 이용·수정·재배포 허용, 저작자표시 불요)
로컬 출처: `~/.claude/skills/media-use/audio/assets/sfx/` (CREDITS.md 참조)

| 파일 | 원본 | 용도 |
|---|---|---|
| sfx/typing-tick.ogg | key-press.mp3 | 대사 타이핑 틱 |
| sfx/choice-hover.ogg | click-soft.mp3 | 선택지 호버 |
| sfx/choice-confirm.ogg | click.mp3 | 선택지 확정 |
| sfx/save-confirm.ogg | chime.mp3 | 세이브 확인 |
| sfx/battle-sting.ogg | impact-bass-2.mp3 | 전투 진입 스팅(스웰+히트) |
| sfx/buff-heal.ogg | sparkle.mp3 | 버프/힐 |

### B. OpenGameArt — 전부 CC0 1.0 (크레딧 불요, 기록용 표기)

| 파일 | 출처 | 저작자 | 라이선스 |
|---|---|---|---|
| sfx/door.ogg | https://opengameart.org/content/door-open-door-close-set (montage-sfx-20121116@113925.ogg 0.45–2.45s 구간: 열림+닫힘) | qubodup | CC0 |
| sfx/heartbeat.ogg | https://opengameart.org/content/heartbeat-single-sound (heartbeat.mp3_.flac) | qubodup 제출 | CC0 |
| sfx/page-flip.ogg | https://opengameart.org/content/10-book-page-flips (book_flip.2.ogg) | StarNinjas | CC0 |
| sfx/victory-fanfare.ogg | https://opengameart.org/content/hyper-ultra-fanfare (sboe.wav) | Zane Little Music | CC0 |
| sfx/hit-1.ogg | https://opengameart.org/content/512-sound-effects-8-bit-style (General Sounds/Impacts/sfx_sounds_impact10.wav) | Juhani Junkala (SubspaceAudio) | CC0 |
| sfx/hit-2.ogg | 상동 (sfx_sounds_impact12.wav) | Juhani Junkala (SubspaceAudio) | CC0 |

### C. Freesound — CC0 (크레딧 불요, 기록용 표기)

| 파일 | 출처 | 저작자 | 라이선스 |
|---|---|---|---|
| sfx/school-chime.ogg | https://freesound.org/people/melokacool/sounds/662162/ ("School Bell Chime", HQ 프리뷰 mp3) | melokacool | CC0 |

## 루프 메모 (BGM)

- battle: 루프 전제 8비트 곡 — 끝→처음 이어붙여도 자연스러움.
- theme-sea: 파일 자체가 2회 반복본이므로 전체 루프 시 심리스에 가까움(내부 67s 심 동일).
- tension: 드론 성격 — 페이드아웃 후 재시작 or 1~2초 크로스페이드 권장.
- main-daily / theme-riwon / theme-yunseul / true-end: 종지형 곡 — 정확한 자연 루프 지점 없음, 재생 종료 후 1~2초 무음 두고 재시작 권장.

## 미확보/대체 내역

- heygen CLI 미설치로 media-use 카탈로그 경로 사용 불가 → 스킬 번들 SFX + 오픈 라이선스 카탈로그로 전량 확보 (실패 항목 없음).
