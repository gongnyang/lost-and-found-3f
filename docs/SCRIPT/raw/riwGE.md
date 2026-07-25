[bg bg_council]
[bgm bgm_riwon]
N: 몇 주 뒤. 학생회실 형광등은 왼쪽 두 번째만 미세하게 떨린다.
riwon(neutral): 폐쇄 안건, 부결됐다.
haram(surprise): 어라? 진짜로?
riwon(neutral): 감사관 의견서에 존치 사유를 열두 줄 썼다. 반박이 없었다.
haram(smile): 야, 백리원. 너 보관소 좋아하는구나.
riwon(neutral): 절차대로다.
N: 그렇게 말하는 동안에도 리원의 펜은 멈추지 않았다.
N: 오늘 아침엔 내가 먼저 왔다. 8시 9분.
N: 리원은 한 박자 쉬고 말했다.
riwon(neutral): 관리인, 착석 08시 09분. 이례적임.
haram(worry): 그걸 왜 적어.
riwon(neutral): 이례적이니까 적는다. 학생회 규정 제41조 3항, 잡담은 기록에서 제외한다.
haram(smile): …그거 진짜 있는 조항이야?
N: 펜이 멈췄다. 처음으로, 리원이 대답했다.
riwon(neutral): …없어. 지금 만들었다.
haram(laugh): 야, 그건 반칙이지!
riwon(laugh): …웃지 마라.
N: 리원은 입을 가렸고 어깨만 흔들렸다. 소리는 나지 않았다.
N: 리원은 내 등교 시각을, 내가 붙인 라벨 개수를, 내가 마신 물 컵 수까지 적는다. 왜 그러냐고 물으면 「업무다」라고 한다.
N: 리원은 한 박자 쉬고 말했다.
riwon(neutral): 나는 네가 뭘 잊었는지는 몰라. 근데 네가 여기 있었다는 건 내가 다 기록해 둘게.
riwon(neutral): 기록은 사람이 죽어도 남아. 그게 기록의 유일한 장점이야.
N: 또 한 박자.
riwon(neutral): …혹시 네가 뭘 잊어도, 나한테 물어봐. 나는 안 잊어.
haram(laugh): 너 진짜 무섭다.
N: 리원이 회의록을 넘겼다. 안건 셋, 비고란, 그리고 비고란도 아닌 여백에 한 줄.
N: 「분실물 보관소 관리인, 오늘도 출근함.」
haram(surprise): …그거 안건 아니잖아.
riwon(neutral): …알아.
N: 그리고 지우지 않았다.
N: 리원이 규정에 없는 걸 쓴 걸 처음 봤다. 그게 왜 뭉클했는지는 모르겠다.
N: 리원이 바인더를 덮고 수첩을 꺼냈다.
haram(smile): 그거 오늘도 쓰냐.
riwon(neutral): 응.
[if bond_riwon eq true then ge_warm else ge_plain]
[label ge_warm]
N: 리원은 수첩을 내 쪽으로 조금 밀어 둔 채 폈다. 가리지 않았다. 나는 예의상 창밖을 봤다.
riwon(neutral): …안 봐?
haram(smile): 너 나중에 말해준다며.
riwon(smile): …그래.
N: 입꼬리가 3밀리쯤 올라갔다 돌아갔다.
[jump ge_end]
[label ge_plain]
N: 리원은 평소처럼 손등으로 덮고 썼다. 나는 옆에서 라벨을 붙였다.
N: 둘 다 말이 없었다. 펜이 종이를 긁는 소리와 라벨 프린터 소리만 번갈아 났다. 편안했다.
[label ge_end]
riwon(neutral): 내일도 8시 10분.
haram(smile): 알았어.
[ending ge_riwon]
