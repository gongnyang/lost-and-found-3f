[bg bg_storage_inner]
[bgm bgm_unease]
N: 열람실 형광등이 한 번 깜빡이고 다시 붙었다. 대장 3권, 작년 가을 페이지.
sea(smile): 오빠 지금 그거 먼지 레벨 심각한데요? 마이크 갖다 대면 바로 지직거려요, 진짜.
N: 손가락이 한 줄에서 멈췄다. 품명 「SD카드 1점」. 서명란에 「문세아」.
N: 글씨가 지금보다 조금 더 동그랬다.
haram(neutral): 너 여기 뭐 맡겼더라.
N: 레코더를 만지작거리던 손이 멈췄다.
sea(worry): ...아, 그거요. 그거 그냥 여분 카드—
sea(serious): 열지 마세요.
N: 속사포가 사라졌다. 얘가 이렇게 말할 때는, 얘가 진심일 때다.
sea(serious): 그거 제 거예요.
sea(serious): 제가 맡긴 건 제가 잊으려고 맡긴 거잖아요.
haram(neutral): 근데 너 안 잊었잖아.
N: 세아는 대답 대신 숨을 한 번 삼켰다. 반박이 없다는 게 대답이었다.
haram(neutral): 그리고 어차피 네가 신청 안 하면 나도 못 열어. 여기 규칙이 그래.
N: 열쇠는 내 주머니에 있는데, 그걸 돌릴 권한은 늘 맡긴 사람 쪽에 있었다.
sea(serious): ...
sea(serious): 개봉 신청, 할게요.
N: 대장을 펴서 세아 앞으로 돌려놨다. 접수 당시 진술은 본인 앞에서 소리 내어 읽는다. 그게 순서다.
haram(neutral): 손님. 접수 당시 기록 먼저 읽어드릴게요. 『SD카드 1점. 안 듣기로 한 소리가 들어 있음. 제가 잊을 때까지 맡아 주세요.』 맞으시죠?
sea(serious): ...맞아요.
haram(neutral): 그럼 접수합니다.
haram(neutral): 이거, 어떻게 열까.
[choice]
- "네 앞에서 열게." => goto:sea02_a, aff_sea+2, bond_sea=true
- "혼자 볼게. 나가 있어." => goto:sea02_b, aff_sea+1
[/choice]
[label sea02_a]
sea(serious): ...네.
N: 반걸음 다가와 내 옆에 섰다. 도망칠 자리를 자기 손으로 지웠다.
sea(serious): 대신 끝까지 제 앞에서 여세요.
[goto sea02_join]
[label sea02_b]
sea(serious): 싫어요.
N: 세아는 문 쪽을 한 번 보더니, 문에서 오히려 더 멀어졌다.
sea(worry): ...오빠 혼자 두면 나중에 편집할 게 많아져서요.
[label sea02_join]
N: 상자를 열었다. SD카드 한 장. 라벨이 비어 있었다.
N: 얘는 여분 배터리에도 날짜를 써 붙이는 애인데.
[fx blurMemory]
N: 잔상이 들어오는데, 이번엔 냄새가 진했다. 소독약. 그리고 어디선가 물방울이 규칙적으로 떨어지는 소리.
N: 방송실 습기인가. 그 방 벽 아래는 늘 축축했으니까.
N: 남의 진술을 소리 내어 읽고 나면 늘 이런 그림이 붙는다. 방금 읽은 문장이 내 머릿속에서 제멋대로 재생되는 것뿐이다. 그럴 수도 있지 뭐.
N: 사람이 많다. 야외다. 스피커가 하울링하고, 누군가의 손이 내 등을 민다.
N: 거기까지였다.
[bg bg_memory_abstract]
[bgm bgm_battle]
N: 격자 사이에 검은 형체가 섰다. 낮은 트윈테일 윤곽, 목에 걸린 것의 형태까지 전부 먹으로 칠해져 있었다.
censor(serious): 그만 봐.
N: 목소리까지 세아였다.
sea(surprise): ...뭐예요, 저거.
N: 검열자는 늘 내가 아는 말만 한다. 새로운 건 하나도 안 알려준다.
N: 방어기제라는 게 원래 그런 건가. 그럼 저건 결국 내가 만든 거고, 그럼 됐다.
[set clue_censor_limit=true]
[battle btl_sea02]
censor(serious): 오빠, 듣지 마.
censor(serious): 너 다쳐.
[sfx sfx_drip]
[fx curtainOverlay]
N: 물방울 소리가 격자 안쪽에서 났다. 배경 어딘가에 커튼 무늬가 한 번 겹쳤다가 사라졌다.
censor(serious): 그 소리 나빠요.
sea(serious): ...나 저런 말 한 적 없는데.
censor(serious): 이건 네 거 아니야.
[label win]
censor(sad): ...미안해.
N: 검열자가 가장자리부터 흩어졌다. 마지막까지 세아 목소리였다.
N: 잔상이 다시 돌아간다. 하울링, 등을 미는 손, 그리고—
N: 마지막 1초에서 툭 끊겼다.
sea(worry): 오빠.
haram(smile): 응. 접수됐습니다.
[jump sea2s02:win]
[label lose]
N: 격자가 까맣게 덮인다. 시야가 ■로 가득 찼다.
N: 잔상은 70% 지점에서 멈췄다. 무릎이 바닥에 먼저 닿았다.
sea(serious): 잡아요. 놓지 말고.
N: 팔을 붙드는 손에 힘이 들어갔다. 떨리는 건 세아 쪽이었다.
[jump sea2s02:lose]
