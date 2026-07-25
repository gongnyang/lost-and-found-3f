[bg bg_archive]
[bgm bgm_unease]
N: 문서고는 3층 끝, 창이 하나도 없는 방이다. 형광등이 다 켜지는 데 2초쯤 걸린다.
N: 먼지 냄새. 철제 선반이 벽 네 면을 다 먹었고, 연도별 회의록 바인더가 등을 맞대고 서 있다. 라벨은 전부 같은 서체, 같은 높이다.
haram(smile): 이거 누가 정리했어? 천재인데.
riwon(neutral): 나다.
haram(laugh): 아, 네.
N: 리원은 사다리 두 칸을 올라가 3년 전 칸에 손을 넣었다.
riwon(neutral): 7월. 8월. 9월.
N: 손이 멈췄다.
haram(surprise): …어라?
N: 9월 다음이 11월이다. 10월이 없다. 라벨 한 칸만 비어 있고, 그 자리 먼지도 옆 칸과 똑같이 쌓여 있다.
haram(serious): 10월 어디 갔어.
riwon(neutral): 결번이다.
haram(serious): 그러니까 왜.
riwon(neutral): 결번은 결번이야.
N: 목록 대장을 폈다. 결번 처리에는 사유서와 서명이 필요하다고 규정란에 적혀 있다.
N: 사유서 칸은 비어 있다. 그런데 서명란에는 서명이 있다. 백리원.
N: 획이 삐뚤고, 마지막 받침이 칸 밖으로 밀려나 있다. 어제 수첩 위쪽 종이에서 본 어린 글씨와 같은 손이다.
haram(serious): 너 그때 몇 살이었어.
riwon(sad): …열넷.
N: 결번. 사유서 없음. 서명 있음. 열네 살.
[choice]
- "네가 뭘 지웠는지 말해." => goto:riw02_a, aff_riwon+2, bond_riwon=true
- "…됐어. 안 물을게." => goto:riw02_b, aff_riwon+1
[/choice]
[label riw02_a]
N: 리원은 오래 대답하지 않았다. 검지가 안경 브릿지로 올라갔다가, 거기서 멈췄다. 벗지는 않았다.
riwon(worry): …언젠가는 말할게. 지금은 아니야.
haram(neutral): 접수됐습니다.
[jump riw02_join]
[label riw02_b]
N: 리원은 한 박자 쉬고 말했다.
riwon(neutral): …고맙다.
haram(surprise): 너 지금 고맙다고 했냐?
riwon(neutral): 기록하지 마.
[label riw02_join]
riwon(neutral): 확인은 끝났다. 내려가자.
haram(smile): 그럼 이건.
N: 대장 뒤쪽 2년 전 페이지를 펴서 내밀었다. 품명 「필기구 1점」. 등록자 서명 백리원.
N: 리원은 한 박자 쉬었다. 그 한 박자가 지나갔는데도 다음 말이 나오지 않았다.
haram(smile): 너도 잊고 싶은 게 있었네.
riwon(sad): …열지 마.
haram(neutral): 왜?
riwon(worry): 거긴 아무것도 없어. 진짜로.
N: D열 3층. 상자는 가볍다.
[sfx sfx_tape]
N: 안에는 볼펜 한 자루. 가운데가 부러져 있다. 심이 종이를 뚫을 만큼 눌린 자국이 남았다.
[fx blurMemory]
N: 손끝이 먼저 차가워졌다. 이번엔 냄새가 진했다. 소독약.
N: 그리고 어디선가 물방울이 규칙적으로 떨어지는 소리. 한 방울, 한 박자, 한 방울.
[sfx sfx_drip]
haram(neutral): …문서고 곰팡이 냄샌가.
[bg bg_memory_abstract]
N: 형광등 아래 긴 책상. 어른 여러 명의 목소리가 겹쳐서 뭉개진다. 종이 넘기는 소리.
N: 그리고 아주 작은 손이 펜을 쥐고 있다.
N: 어른 하나가 말했다. 「여기, 여기 서명.」
N: 거기까지였다.
[bgm bgm_battle]
censor(neutral): 그만 봐.
N: 리원의 윤곽이다. 단발선도, 안경 형태도, 겨드랑이의 바인더까지 전부 먹으로 칠해져 있다. 목소리까지 리원이다.
N: 리원이 자기 목소리를 듣고 그대로 굳었다. 바인더를 쥔 손만 조금 움직였다.
riwon(surprise): …뭐야, 저거.
N: 검열자는 늘 내가 아는 말만 한다. 새로운 건 하나도 안 알려준다. 내가 모르는 건 저쪽도 모르는 것 같다.
N: 리원은 한 박자 쉬고 말했다.
riwon(worry): 저건 네가 —
N: 말이 거기서 끊겼다. 리원은 바인더를 고쳐 안았다.
riwon(neutral): …아니야. 집중해.
[set clue_minutes_gap=true]
[set clue_censor_limit=true]
[battle btl_riw02]
[label win]
N: 먹으로 칠해진 형태가 가장자리부터 부스러졌다.
censor(sad): …미안해.
N: 리원의 목소리였다. 진짜 리원은 대답하지 않았다. 대답할 말이 없는 얼굴이었다.
N: 잔상이 다시 이어졌다. 작은 손, 펜, 종이 넘기는 소리, 물방울.
N: 마지막 1초에서, 툭.
N: 끊겼다.
[jump riw2s02:win]
[label lose]
N: 시야 가장자리부터 검은 ■가 차올랐다. 글자를 지우는 방식이었다.
N: 잔상은 7할쯤에서 잘렸다. 작은 손이 펜을 쥔 데까지. 그 손이 무엇을 썼는지는 보이지 않았다.
N: 무릎이 먼저 바닥에 닿았다. 팔꿈치를 누가 붙들었다.
riwon(worry): 일어나. 여기서 자면 규정 위반이야.
N: 목소리가 조금 떨렸다. 기록하지 않기로 했다.
[jump riw2s02:lose]
