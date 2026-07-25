[bg bg_memory_abstract]
[bgm bgm_true]
N: 원고지 격자. 칸은 비어 있고, 나 혼자 서 있었다.
N: 셋이 언제 옆에 왔는지 나는 못 봤다.
[sfx sfx_static]
N: 격자 끝에서 검은 것이 일어섰다. 형태는 없었다.
haram(serious): …또 너냐.
censor(neutral): 보지 마.
N: 어디서 들은 목소리인지는 몰랐다.
[battle btl_true03 onWin=after_win onLose=after_lose]
censor(neutral): 보지 마.
N: 적의 HP바가 사라졌다. 그 자리가 비었다.
[set ui_strip_level 1]
haram(surprise): HP바가 없어졌는데.
N: 아무도 대답하지 않았다.
N: 격자 위로 커튼 무늬가 겹쳤다. 주름이 칸을 하나씩 덮었다.
censor(neutral): 네가 부탁했잖아.
N: 격자가 지워지고 흰 커튼만 남았다. 옆에 링거대가 서 있다. 이상하지 않았다.
[sfx sfx_iv_drop]
N: 커맨드 네 칸 중 세 칸이 회색으로 잠겼다.
haram(serious): 코피. 그거 네가 낸 게 아니지.
censor(neutral): …
haram(serious): 아무도 소리를 못 들었어. 여기서 나는 소리가 밖에 안 났으니까.
haram(serious): CCTV에 나 혼자 서 있었어. 각도 문제가 아니었어.
haram(neutral): 여기선 늘 소독약 냄새가 나. 이건 학교 냄새가 아니야.
haram(serious): 너는 내가 아는 말만 해. 새로운 건 한 번도 안 알려줬어. 왜냐면 —
censor(neutral): — 나는 너니까.
N: 검열자가 처음으로 내 문장을 끝냈다.
haram(serious): 잔상은 항상 마지막 1초에서 끊겼어. 끊은 건 너지.
censor(sad): 끊은 건 너야.
N: 늘 한 칸 모자랐던 단어를 찾았다.
haram(sad): …너는 없구나.
censor(neutral): 응.
N: 옆의 기척 셋이 소리 없이 빠졌다.
[set ui_strip_level 2]

N: 셋은 처음부터 여기에 없었다.

[bg bg_hospital]
[bgm none]
[sfx sfx_ekg]
[sfx sfx_iv_drop]
N: 반쯤 걷힌 커튼 안쪽 침대에 누군가 누워 있었다. 왼쪽 쇄골에 붕대가 감겨 있다.
N: 밴드를 만지던 손이 멈췄다.
N: 검열자가 형태를 가졌다. 어깨선이 낯익고, 넥타이만 조금 헐거웠다.
N: 이름표가 「검열자」에서 「???」로 바뀌었다. 내 것과 같은 글자였다.
censor(sad): 네가 맡겼잖아. 3년 전에. 이름을 부르면 네가 부서지니까, 부르지 말자고. 다 같이.
haram(surprise): …내가?
censor(neutral): 네가 제일 먼저.
N: 기억이 안 났다. 당연하지. 그걸 안 나게 하려고 한 거니까.
N: 커맨드 창이 다시 떴다. 네 칸 중 세 칸은 회색이고, 라벨도 툴팁도 「—」였다. 고를 수 있는 칸은 하나뿐이었다.
[choice]
- 내 이름을 말한다 => goto after_win
[/choice]
[fx whiteFlash]
[label after_win]
N: 입을 열었다. 소리가 안 나왔다.
N: 두 번째. 안 나왔다.
N: 세 번째도.
N: 네 번째에, 아주 작게.
haram(serious): " ————— "
N: 검열자가 커튼에 스미듯 흩어졌다.
censor(smile): …이제 네 차례야.
[set battle03_done true]
[set ui_strip_level 3]
[jump true1s05 after_win]
[label after_lose]
N: 끝내 아무것도 나오지 않았다.
N: 화면이 가장자리부터 어두워졌다.
censor(smile): 괜찮아. 아직 아니어도 돼.
N: 심전도 소리가 멀어지고, 소독약 냄새가 종이 냄새가 됐다.
N: 나는 보관소 바닥에서 눈을 떴다.
[set battle03_done true]
[set ui_strip_level 3]
[jump true1s05 after_lose]
