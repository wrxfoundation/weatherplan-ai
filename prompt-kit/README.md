# 이미지 프롬프트 키트

한국요괴지도 도상 132장을 만들면서 정리된 것을 도메인에서 떼어낸 것이다.
요괴든 SF든 브랜드 캐릭터든 `direction.json`만 갈아끼운다.

```
prompt-kit/
├── direction.template.json     # 빈 양식 — 여기를 채운다
├── build-prompt.mjs            # 프롬프트 생성기 (도메인을 모른다)
└── examples/norse.*.json       # 다른 전승으로 옮긴 실제 예
```

```bash
node build-prompt.mjs my.direction.json my.items.json          # 프롬프트 목록
node build-prompt.mjs my.direction.json my.items.json --json   # API 요청 객체
node build-prompt.mjs my.direction.json --scene hero           # 풍경 컷
```

---

## 공통 프롬프트 골격

슬롯 순서가 이 키트의 핵심이다. 문장을 바꾸는 건 자유지만 **순서는 바꾸지 않는다.**

```
{도메인} — {이름} — {영문 시각 서술}.
{앵커 1}. {앵커 2}.
{지지체} + {안료} + {매체} + {광택} + {선질} + {화풍} + {질감 단서}.
NOT {이웃 A}: no …, no …, no ….
NOT {이웃 B}: no …, no …, no ….
{분류 수식 — 색 기조 + 도상 관습}.
{구도}.
no text, no letters, no signature, no watermark, no border frame, not photorealistic, not 3d render, not anime.
```

색은 문장에 쓰지 않는다. `colors` · `background_color` **파라미터로 넘긴다.**

---

## 규칙 8개

### 1. 장르 이름 말고 재료와 도구를 적는다

v1은 `Korean minhwa`라고만 썼다. 모델은 그 말을 듣고 **동아시아 평균값**을 그렸다 —
왜색과 중국풍이 섞인 것이 나왔다. v2에서 바꾼 건 스타일 이름이 아니라 **재료 명세**다.

> `Korean traditional painting on hanji mulberry paper, opaque mineral pigment in animal glue,`
> `matte non-glossy, even iron-wire brush outline, flat frontal Joseon minhwa manner, visible paper fiber`

`minhwa`라는 단어는 그대로 있는데 결과가 달라졌다. 바뀐 건 **지지체(한지) · 매체(아교) ·
광택(무광) · 선질(철선묘) · 질감 단서(종이 섬유)** 다섯 개가 들어간 것이다.

장르 이름은 모델이 이미 평균으로 뭉개 놓은 라벨이고, 재료는 뭉갤 수 없다.
사이버펑크면 `neon sign spill on wet asphalt, anamorphic lens flare, 35mm push-processed grain`,
목판화면 `end-grain boxwood block, single-pass oil ink, visible chisel burr`.

### 2. 배제문은 스타일 바로 뒤에 둔다

프롬프트가 길면 뒤가 잘린다. 배제문을 뒤에 두면 **제일 먼저 죽는다.**
그래서 `주어 → 앵커 → 스타일 → **배제** → 수식 → 구도 → 일반 금지` 순서다.

### 3. 앵커 — 매 컷에 최소 1개 강제

앵커는 **이 세계에만 있는 구체물**이다. 이게 없으면 모델은 반드시 평균값으로 떨어진다.

좋은 앵커는 **확대해야 보이는 디테일**까지 적는다.

> ❌ `hanbok`
> ✅ `short jeogori jacket with a white dongjeong collar strip and long goreum ribbon tie,
>     full chima skirt gathered high at the chest`

`hanbok`만 쓰면 모델은 한복이라고 우기는 기모노를 그린다. 동정과 옷고름을 적으면 못 그린다.
**검수도 같은 문장으로 한다** — "동정이 보이는가"는 예/아니오로 답할 수 있지만
"한복인가"는 답이 갈린다.

### 4. 배제문만으로는 실루엣이 안 막힌다 — 긍정 서술로 다시 그린다

금강역사 컷에 **도리이**가 나왔다. 배제문에 `no vermilion two-post gate with a straight lintel`이
**이미 있었는데도** 뚫렸다.

부정문은 모델에게 약하다. `no X`를 읽고도 X를 그린다.
막는 방법은 하나다 — **그 자리에 무엇이 있어야 하는지 긍정문으로 적는 것.**

> ❌ 배제문에 `no torii` 한 줄 더 추가
> ✅ `art_hint`를 고쳐서 "금강문은 프레임이 아니라 **지붕이 얹힌 건물**"이라고 서술

같은 자리가 두 번 뚫리면 배제문을 늘리지 말고 **주어를 다시 쓴다.**

### 5. 분류 기본값은 뭉툭하다 — 개체가 이길 수 있게

앵커를 분류 단위로만 주면 사고가 난다. 실제로 난 것들:

- 각시도깨비(여성)에 **갓과 바지**가 붙었다 — 도깨비 분류 기본 앵커가 남성 복식이라서
- 도깨비불(불꽃만 있는 컷)에 **사람이 끼어들었다** — 복식 앵커가 강제로 들어가서
- 남성 귀신에 **여성 머리**가 붙었다 — 혼령 수식어에 `long unbound hair`가 있어서

그래서 개체가 `anchors`를 직접 선언하면 분류 기본값을 이긴다.
사람이 없는 컷은 `"anchors": []`로 **비우는 것**이 정답이다.

### 6. 프롬프트를 손으로 고치지 않는다

한 장이 마음에 안 들어 손으로 고치면, 그 수정은 **다음 배치에서 되돌아간다.**
그리고 서른 장쯤에서 화풍이 갈라지기 시작하는데, 그때는 어느 장이 어떤 버전인지 아무도 모른다.

고칠 곳은 항상 `direction.json` 아니면 그 개체의 `hint`다.
**히어로·배너 같은 1회성 컷도 파일에 넣는다**(`scenes`) — 안 넣으면 아트디렉션을 바꿔도
히어로만 옛 버전으로 남는다.

### 7. 이웃을 이름으로 부른다

`authentic` · `culturally accurate` 같은 말은 아무것도 막지 못한다.
**헷갈리는 이웃을 이름으로 부르고 그 시각 마커를 하나씩 끊는다.**

| 만들려는 것 | 이름 불러 끊을 이웃 |
|---|---|
| 한국 전통 | 일본(기모노·오비·도리이·조리·다비·구마도리) · 중국(치파오·오조룡·홍등롱·년화 금박) |
| 북유럽 | **현대 대중문화**(뿔투구·크롬 판금·망토 히어로) · 켈트(매듭 십자가·토크) |
| 조선 후기 | 청나라(변발·마괘) · 현대 사극 판타지(무채색 가죽·과장된 어깨) |

**가장 큰 오염원이 인접 전통이 아니라 현대 대중문화인 경우가 많다.**
뿔 달린 바이킹 투구는 19세기 오페라 의상이지 유물이 아니다 —
뿔 달린 도깨비가 근대 학습물에서 들어온 것과 정확히 같은 문제다.
그래서 예제에서도 `pop`을 `celtic`보다 **먼저** 끊는다.

### 8. 검수는 확대해서 한다

축소 대지(contact sheet)에서는 신발과 깃이 안 보인다. 여기서 놓친 것들:

- 짚신인 줄 알았는데 **엄지발가락 사이에 끈**이 있었다(조리)
- 맨 얼굴에 붉은 곡선 줄무늬 = **가부키 구마도리**
- 북두칠성 자리에 **보름달** — 칠성신 컷에서 신앙의 대상 자체가 빠졌다

그리고 **반려한 파일은 지운다.** 빌드가 경로를 안 내면 화면에는 안 뜨지만,
배포하면 `/img/…/rejected.webp`로 그대로 접근된다. 화면에 안 뜬다는 이유로 남겨 둘 물건이 아니다.

---

## 운영 메모

- **429 `rate_limit_reached`가 생성 실패의 대부분이다.** 12장 동시 제출에서 났고 6장 배치로 나누면 사라진다.
  프롬프트를 고쳐서 "해결"하려 들지 말 것 — 프롬프트 문제가 아니다.
- **장당 8크레딧**(`recraft_v4_1` · 2k · standard, 2026-09 실측). 데이터보다 도상이 먼저 막힌다.
- `hint`(영문 시각 서술)가 없으면 **만들지 않는다.** 빌더가 건너뛰고 경고한다.
  한국어 설명은 이미지 모델이 해석하지 못하고, 엉뚱한 도상보다 없는 편이 낫다.

## 다른 도메인으로 옮길 때

`examples/norse.*.json`이 실제로 옮긴 예다. 바뀐 것은 `style` · `anchors` · `exclude` 세 곳뿐이고
구조·슬롯 순서·빌더는 건드리지 않았다.

```bash
cp direction.template.json my.direction.json
# style / anchors / exclude 세 곳을 채운다. 나머지는 그대로 둬도 돈다.
node build-prompt.mjs my.direction.json my.items.json --json
```
