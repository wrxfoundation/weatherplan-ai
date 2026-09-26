/* 랜딩 핵심 문구 5개 언어 (8/28 서우: 한국어·영어·일본어·중국어·스페인어)

   화면 코드 207곳이 `en ? A : B` 삼항으로 쓰여 있어 한 번에 다 옮기지 못한다.
   눈에 가장 먼저 닿는 자리부터 여기로 옮기고, 남은 자리는 i18n 의 `en` 폴백이
   영어를 내보낸다(한국어가 튀어나오지 않는다).

   발화 규칙 — 번역에서도 그대로 지킨다:
   · 수익을 약속하지 않는다. "월 ○원" 같은 표현 금지.
   · 보상은 "지급량·가치 비보장" 고지를 반드시 함께 둔다.
   · WLBN 은 토큰이다. coin / 코인 으로 옮기지 않는다.
   · 시세·가격 전망을 말하지 않는다. */
import type { Msg } from "./i18n";

const m = <T,>(v: Msg<T>) => v;

/* ── 히어로 · 공통 CTA ────────────────────────────────────────────────── */
export const D = {
  /* 8/28 서우: 선착순 사전예약 → 추첨제 "사전 구매응모". 예약(자리를 잡는다)이 아니라
     응모(추첨 대상이 된다)이므로 다섯 언어 모두 예약 어휘를 걷어냈다.
     en 은 reserve/pre-order 를 쓰지 않는다 — 확보를 약속하는 말로 읽힌다. */
  preorderCta: m({
    ko: "사전 구매응모하기",
    en: "Enter the draw",
    ja: "事前購入に応募する",
    zh: "申请预购",
    es: "Participar en el sorteo",
  }),
  preorderShort: m({
    ko: "응모하기",
    en: "Enter",
    ja: "応募",
    zh: "申请",
    es: "Participar",
  }),

  /* ── S2 우리가 만드는 것 ────────────────────────────────────────────── */
  howTitle: m({
    ko: "우리가 만드는 것",
    en: "What we're building",
    ja: "私たちがつくるもの",
    zh: "我们在构建什么",
    es: "Lo que estamos construyendo",
  }),
  /* 8/30 회의: "백서 안 봐도 이해되게" — 관측망·경제 구조 설명을 덜어내고
     개념 한 줄만 남긴다. 자세한 구조는 바로 아래 선순환 카드가 맡는다. */
  howLead: m({
    ko: "공기는 건물마다, 골목마다 다릅니다.\n내가 사는 공간에서 측정한 데이터가 토큰이 되고, 보상으로 돌아옵니다.",
    en: "Air differs building by building, street by street.\nData you measure where you live becomes tokens, and comes back as rewards.",
    ja: "空気は建物ごと、路地ごとに違います。\n自分が暮らす空間で計測したデータがトークンになり、報酬として戻ります。",
    zh: "空气因楼栋而异、因街巷而异。\n你在生活空间里测得的数据会生成代币，并作为奖励回到你手中。",
    es: "El aire cambia de edificio en edificio y de calle en calle.\nLos datos que mides donde vives se convierten en tokens y vuelven como recompensa.",
  }),
  /* 4단계 카드 — 제목은 번호(①~④)를 코드에서 붙인다.
     8/30 회의(대표 지시): 장표대로 세 단계만 남긴다 — 측정 · 채굴 · 보상.
     검증은 단계에서 빼되 사실은 ② 설명에 남긴다 — 검증이 있어야 데이터가 값을 갖는다.
     활용(데이터가 팔려 보상 재원이 되는 부분)은 바로 아래 선순환 카드가 이어받는다.
     지갑 전환은 넣지 않는다. 네 칸이 되면 장표와 어긋나고, 금액·수익 쪽으로 읽히기도 쉽다. */
  step1Title: m({ ko: "측정", en: "Measure", ja: "計測", zh: "测量", es: "Medir" }),
  step1Desc: m({
    ko: "우리 집 공기를 측정합니다.\nCO₂·미세먼지·온습도를 실시간으로",
    en: "Measure your home's air in real time.\nCO₂, particulates, temperature, humidity",
    ja: "自宅の空気を計測します。\nCO₂・微小粒子・温湿度をリアルタイムで",
    zh: "测量家中的空气。\nCO₂、颗粒物、温湿度，实时呈现",
    es: "Mide el aire de tu casa.\nCO₂, partículas, temperatura y humedad, en tiempo real",
  }),
  step2Title: m({ ko: "검증", en: "Verify", ja: "検証", zh: "验证", es: "Verificar" }),
  step2Desc: m({
    ko: "네트워크가 측정값을 확인합니다.\n검증을 통과해야 토큰이 됩니다",
    en: "The network checks each reading.\nOnly data that passes becomes tokens",
    ja: "ネットワークが計測値を確認します。\n検証を通ったデータだけがトークンになります",
    zh: "网络会核实每一条测量值。\n只有通过验证的数据才会生成代币",
    es: "La red comprueba cada medición.\nSolo los datos que la superan se convierten en tokens",
  }),
  step3Title: m({ ko: "보상", en: "Reward", ja: "報酬", zh: "奖励", es: "Recompensa" }),
  step3Desc: m({
    ko: "생성된 WLBN이 네트워크 원칙에 따라 내 몫으로 쌓입니다",
    en: "The WLBN generated accrues to you under network rules",
    ja: "生成された WLBN がネットワークの規則に従って自分の分として積み上がります",
    zh: "生成的 WLBN 按网络规则计入你的份额",
    es: "El WLBN generado se acumula a tu favor según las reglas de la red",
  }),
  /* ── 혜택 두 가지 (8/30 회의 대표 지시: 이미지·개념·혜택 3요소) ──────────
     "측정기만으로도 쓸모 있다" 를 앞에 세운다. 보상이 먼저 오면 토큰을 사러 온
     사람만 남고, 기기를 사러 온 사람이 설 자리가 없어진다. 보상은 두 번째다. */
  benefitTitle: m({
    ko: "측정기 하나로 두 가지",
    en: "One device, two returns",
    ja: "計測器ひとつで二つ",
    zh: "一台设备，两重收获",
    es: "Un solo dispositivo, dos beneficios",
  }),
  benefit1Title: m({
    ko: "공기가 보입니다",
    en: "You can see your air",
    ja: "空気が見えます",
    zh: "让空气可见",
    es: "Ves tu aire",
  }),
  benefit1Desc: m({
    ko: "CO₂가 오르면 알려 줍니다. 언제 환기해야 하는지, 내 방 공기가 지금 어떤지 숫자로 봅니다.",
    en: "It tells you when CO₂ climbs. See when to open a window, and what the air in your own room is like right now — in numbers.",
    ja: "CO₂ が上がれば知らせます。いつ換気すべきか、自分の部屋の空気が今どうなのかを数字で見ます。",
    zh: "CO₂ 升高时会提醒你。何时该开窗、自己房间此刻的空气如何，都以数字呈现。",
    es: "Te avisa cuando sube el CO₂. Ves cuándo ventilar y cómo está ahora el aire de tu propia habitación, en números.",
  }),
  benefit2Title: m({
    ko: "데이터가 보상이 됩니다",
    en: "Your data earns",
    ja: "データが報酬になります",
    zh: "数据带来奖励",
    es: "Tus datos generan recompensa",
  }),
  benefit2Desc: m({
    ko: "측정이 쌓이는 동안 네트워크 원칙에 따라 WLBN이 지급됩니다. 기기를 켜 두고 Wi-Fi를 제대로 연결하기만 하면 됩니다.",
    en: "As measurements accumulate, WLBN is paid out under network rules. All you do is keep the device on and its Wi-Fi properly connected.",
    ja: "計測が積み上がる間、ネットワークの規則に従って WLBN が支給されます。機器を動かし、Wi-Fi をきちんと接続しておくだけです。",
    zh: "在数据不断累积的同时，按网络规则发放 WLBN。你只需让设备保持开启，并接好 Wi-Fi。",
    es: "Mientras se acumulan las mediciones, se entrega WLBN según las reglas de la red. Basta con mantener el equipo encendido y su Wi-Fi bien conectado.",
  }),

  /* ── 선순환 ────────────────────────────────────────────────────────── */
  loopTitle: m({
    ko: "데이터가 흐를수록 단단해지는 선순환",
    en: "A loop that sustains itself",
    ja: "データが巡るほど強くなる好循環",
    zh: "数据流转越多，循环越稳固",
    es: "Un ciclo que se fortalece con cada vuelta",
  }),
  loopData: m({
    ko: "검증된 데이터",
    en: "Verified data",
    ja: "検証済みデータ",
    zh: "已验证数据",
    es: "Datos verificados",
  }),
  loopBuy: m({
    /* 8/28 서우: "기업이 구매" → "기업/기관 구매" (공공·연구기관 수요를 포함) */
    ko: "기업/기관 구매",
    en: "Businesses & institutions buy",
    ja: "企業・機関が購入",
    zh: "企业与机构购买",
    es: "Empresas e instituciones",
  }),
  loopFund: m({
    /* 8/28 서우: "대금이 보상 재원" → "보상 재원 확보" */
    ko: "보상 재원 확보",
    en: "Reward pool funded",
    ja: "報酬原資を確保",
    zh: "奖励来源到位",
    es: "Fondo de recompensas",
  }),
  loopGrow: m({
    ko: "측정망 확대",
    en: "Network grows",
    ja: "計測網の拡大",
    zh: "监测网扩大",
    es: "La red crece",
  }),
  loopReturn: m({
    ko: "촘촘해진 데이터가 다음 바퀴의 수요를 키웁니다",
    en: "Denser data makes the next round of demand bigger",
    ja: "密になったデータが次の周回の需要を広げます",
    zh: "更密集的数据带来下一轮更大的需求",
    es: "Datos más densos amplían la demanda de la siguiente vuelta",
  }),
  loopBody1: m({
    ko: "노드가 모은 공기질 데이터는 품질 검증을 거쳐 기업·API·AI 서비스로 유통됩니다.",
    en: "The air-quality data our nodes collect passes quality verification and flows to enterprises, APIs, and AI services.",
    ja: "ノードが集めた空気質データは品質検証を経て、企業・API・AI サービスへ流通します。",
    zh: "节点采集的空气质量数据经质量验证后，流向企业、API 与 AI 服务。",
    es: "Los datos de calidad del aire que recogen los nodos pasan una verificación y llegan a empresas, API y servicios de IA.",
  }),
  loopBody2: m({
    ko: "그 판매 대금이 다시 노드 보상의 재원이 되고, 보상이 노드를 늘리면 측정망이 촘촘해집니다.",
    en: "What those buyers pay funds the node reward pool, and rewards bring more nodes — making the measurement network denser.",
    ja: "その売上が再びノード報酬の原資となり、報酬がノードを増やすと計測網が密になります。",
    zh: "销售所得再次成为节点奖励的来源，奖励带来更多节点，监测网随之更密集。",
    es: "Esos ingresos vuelven a financiar las recompensas de los nodos, y más recompensas traen más nodos, densificando la red.",
  }),
  /* 8/28 서우 승인: 선순환 하단에서 뺀 비보장 고지를 보상을 실제로 말하는 자리(③ 보상 카드)로 옮긴다.
     랜딩 본문에 한 번은 노출돼야 한다는 법무 판단. 짧게, 카드 설명 아래 작은 글씨로. */
  rewardNotGuaranteed: m({
    ko: "지급량과 가치는 보장되지 않습니다",
    en: "Amounts and value are not guaranteed",
    ja: "支給量と価値は保証されません",
    zh: "发放数量与价值不作保证",
    es: "La cantidad y el valor no están garantizados",
  }),
  /* 8/28 서우: 보상 비보장 고지를 이 자리에서 빼고 개인정보 안심 문구로 교체.
     백서 정합성 리포트(0826) A9 "비식별화 · 구매 플로우 개인정보 제로화" 기준 —
     측정 대상이 사람이 아니라 공기라는 사실만 짧게 말한다. 없는 약속은 하지 않는다. */
  privacyNotice: m({
    ko: "측정값은 공기질 데이터뿐입니다 · 개인을 식별하는 정보는 수집하지 않습니다",
    en: "We measure air quality only — no personally identifiable information is collected.",
    ja: "計測するのは空気質データだけ・個人を識別する情報は収集しません",
    zh: "只测量空气质量数据 · 不收集可识别个人的信息",
    es: "Solo medimos datos de calidad del aire · no recopilamos información que identifique a personas",
  }),

  /* ── 실시간 현황판 · 스티키 ────────────────────────────────────────── */
  liveBoard: m({
    ko: "실시간 사전 구매응모 현황",
    en: "Live entry board",
    ja: "リアルタイム応募状況",
    zh: "实时申请动态",
    es: "Inscripciones en tiempo real",
  }),
  nowLabel: m({ ko: "현재", en: "Now", ja: "現在", zh: "当前", es: "Ahora" }),
  unitsPreordered: m({
    ko: "대 응모",
    en: " entered",
    ja: "台 応募",
    zh: "台 已申请",
    es: " inscritas",
  }),

  /* ── 제네시스 런치 (8/29 서우 확정) ────────────────────────────────────
     판매 대상이 기기에서 제네시스 멤버십 NFT 로 바뀌었다. 추첨은 폐기되고
     사전예매 → 바우처 수령 → 우선 구매 순서다. 날짜는 lib/schedule.ts 가 정본이고
     여기에는 라벨만 둔다 — 같은 날짜를 두 곳에 적으면 반드시 어긋난다. */
  launchName: m({
    ko: "제네시스 멤버십", en: "Genesis Membership", ja: "ジェネシスメンバーシップ",
    zh: "创世会员资格", es: "Membresía Genesis",
  }),
  launchLead: m({
    ko: "제네시스는 Weather XRPL DePIN의 첫 번째이자 마지막 초기 멤버십입니다. 단 한 번, 24시간 동안만 판매되고 다시는 발행되지 않으며, 이때 함께한 회원은 네트워크가 성장하는 내내 우선권 혜택을 받습니다.",
    en: "Genesis is the first and last early membership of Weather XRPL DePIN. It is sold once, for 24 hours only, and never minted again — members who join now keep priority benefits as the network grows.",
    ja: "ジェネシスは Weather XRPL DePIN の最初で最後の初期メンバーシップです。一度だけ、24時間のみ販売され、二度と発行されません。このとき参加した会員は、ネットワークが成長する間ずっと優先権を受けます。",
    zh: "创世是 Weather XRPL DePIN 第一个也是最后一个早期会员资格。仅发售一次、仅 24 小时，且不再增发；此时加入的会员将在网络成长过程中持续享有优先权。",
    es: "Genesis es la primera y última membresía inicial de Weather XRPL DePIN. Se vende una sola vez, durante 24 horas, y no se vuelve a emitir: quienes entren ahora conservan las ventajas de prioridad mientras la red crece.",
  }),
  scheduleTitle: m({
    ko: "판매 일정", en: "Sale schedule", ja: "販売スケジュール", zh: "销售日程", es: "Calendario de venta",
  }),
  msReserveOpen: m({
    ko: "사전예매 시작", en: "Reservations open", ja: "事前予約 開始", zh: "预约开始", es: "Apertura de reservas",
  }),
  msReserveClose: m({
    ko: "사전예매 접수 마감", en: "Reservations close", ja: "事前予約 受付終了", zh: "预约截止", es: "Cierre de reservas",
  }),
  msPriorityOpen: m({
    ko: "우선 구매창 (사전예매자)", en: "Priority window (reserved members)",
    ja: "優先購入枠（事前予約者）", zh: "优先购买窗口（已预约会员）", es: "Ventana prioritaria (con reserva)",
  }),
  msGeneralOpen: m({
    ko: "일반 구매창", en: "General window", ja: "一般購入枠", zh: "普通购买窗口", es: "Ventana general",
  }),
  msGeneralNote: m({
    ko: "예정 · 예매 물량이 먼저 소진되면 조기 오픈",
    en: "Scheduled — opens earlier if reserved units sell out first",
    ja: "予定 · 予約分が先に完売した場合は前倒しでオープン",
    zh: "预定 · 若预约数量先售罄则提前开放",
    es: "Previsto: se abre antes si se agotan las unidades reservadas",
  }),
  msSaleEnd: m({
    ko: "판매 종료", en: "Sale ends", ja: "販売終了", zh: "销售结束", es: "Fin de la venta",
  }),
  scheduleWhy: m({
    ko: "우선창과 일반창을 나눈 것은 트래픽과 온체인 트랜잭션 부하를 예측 가능하게 점검하고, 구매를 원하는 분들이 조급함 없이 편안하게 구매하실 수 있게 하기 위함입니다.",
    en: "The two windows exist so we can check traffic and on-chain transaction load predictably, and so buyers are not rushed.",
    ja: "枠を分けたのは、トラフィックとオンチェーン取引の負荷を予測可能な形で確認するため、そして購入を希望する方が焦らずに購入できるようにするためです。",
    zh: "分设两个窗口，是为了以可预测的方式检验流量与链上交易负载，并让希望购买的人不必仓促下单。",
    es: "Separamos las dos ventanas para comprobar el tráfico y la carga de transacciones on-chain de forma previsible, y para que nadie compre con prisas.",
  }),
  nextStepIn: m({
    ko: "다음 단계까지", en: "Next step in", ja: "次の段階まで", zh: "距下一阶段", es: "Próximo paso en",
  }),
  /* 단계 라벨 — lib/schedule.ts 의 LaunchPhase 와 1:1 */
  phaseBeforeReserve: m({
    ko: "사전예매 오픈 전", en: "Before reservations open", ja: "事前予約オープン前", zh: "预约开始前", es: "Antes de abrir reservas",
  }),
  phaseReserveOpen: m({
    ko: "사전예매 접수 중", en: "Reservations open now", ja: "事前予約 受付中", zh: "预约受理中", es: "Reservas abiertas",
  }),
  phaseReserveClosed: m({
    ko: "접수 마감 · 우선 구매창 대기", en: "Reservations closed — priority window next",
    ja: "受付終了・優先購入枠を待機", zh: "预约已截止 · 等待优先购买窗口", es: "Reservas cerradas: siguiente, la ventana prioritaria",
  }),
  phasePriorityWindow: m({
    ko: "우선 구매창 · 사전예매자만 구매할 수 있습니다",
    en: "Priority window — only reserved members can buy",
    ja: "優先購入枠 · 事前予約者のみ購入できます",
    zh: "优先购买窗口 · 仅已预约会员可购买",
    es: "Ventana prioritaria: solo compran los miembros con reserva",
  }),
  phaseGeneralWindow: m({
    ko: "일반 구매창 · 누구나 구매할 수 있습니다",
    en: "General window — open to everyone", ja: "一般購入枠 · どなたでも購入できます",
    zh: "普通购买窗口 · 任何人均可购买", es: "Ventana general: abierta a todos",
  }),
  phaseClosed: m({
    ko: "판매 종료", en: "Sale closed", ja: "販売終了", zh: "销售结束", es: "Venta cerrada",
  }),
  /* 8/29 서우: 예매는 순서이지 보장이 아니다. "확보·보장" 어휘를 쓰지 않는다. */
  reserveNotGuaranteed: m({
    ko: "사전예매는 결제가 아닙니다. 우선 구매창에서 신청하신 수량만큼 먼저 구매하실 수 있으며, 구매를 보장하지는 않습니다.",
    en: "A reservation is not a payment. It lets you buy your requested quantity first in the priority window; it does not guarantee purchase.",
    ja: "事前予約は決済ではありません。優先購入枠で申し込まれた数量を先に購入できますが、購入を保証するものではありません。",
    zh: "预约不是付款。您可在优先购买窗口按申请数量优先购买，但不保证一定能购得。",
    es: "Una reserva no es un pago. Te permite comprar antes la cantidad solicitada en la ventana prioritaria; no garantiza la compra.",
  }),
  capFive: m({
    ko: "1계정 최대 5개까지 신청할 수 있습니다.", en: "Up to 5 per account.",
    ja: "1アカウントにつき最大5個まで申し込めます。", zh: "每个账户最多可申请 5 个。",
    es: "Hasta 5 por cuenta.",
  }),
  /* 8/31 서우 — 9/15 판매분 450 RLUSD 확정. "공지 예정"은 이제 사실이 아니라서 버렸다.
     수량 문구도 같이 뺐다: 8/28 회의로 판매 수량을 스스로 정하지 않기로 해서 공지할 수량
     자체가 없어졌는데 문구만 남아 있었다.
     숫자는 자리표시자로 둔다 — 다섯 언어에 450·650 을 직접 적으면 정본 사본이 열 개가 된다.
     채우는 곳은 lib/data.ts 의 fillPrice() 한 곳뿐이다. */
  priceSet: m({
    ko: "9월 15일 판매분은 {first} RLUSD입니다. 2차 판매부터는 {later} RLUSD가 적용됩니다.",
    en: "The September 15 batch is {first} RLUSD. From the second batch it is {later} RLUSD.",
    ja: "9月15日の販売分は {first} RLUSD です。第2次販売からは {later} RLUSD が適用されます。",
    zh: "9 月 15 日发售批次为 {first} RLUSD。自第二批次起适用 {later} RLUSD。",
    es: "El lote del 15 de septiembre es de {first} RLUSD. Desde el segundo lote, {later} RLUSD.",
  }),
  /* 바우처 — 새 정책의 핵심 신규 개념. 발행(신청 시)과 수락(지갑에서)은 다른 사건이다. */
  voucherName: m({
    ko: "바우처(예매 확정 인증 NFT)", en: "voucher (reservation-confirmation NFT)",
    ja: "バウチャー（予約確定証明NFT）", zh: "凭证（预约确认 NFT）", es: "vale (NFT de confirmación de reserva)",
  }),
  noticeVoucher: m({
    ko: "사전예매를 신청하시면 바우처(예매 확정 인증 NFT)가 발행됩니다. 지갑에서 수락해야 우선 구매 자격이 확정됩니다.",
    en: "Reserving issues a voucher (reservation-confirmation NFT). Accept it in your wallet to confirm priority access.",
    ja: "事前予約を申し込むとバウチャー（予約確定証明NFT）が発行されます。ウォレットで承認すると優先購入資格が確定します。",
    zh: "申请预约后将发行凭证（预约确认 NFT）。在钱包中接受后，优先购买资格才算确定。",
    es: "Al reservar se emite un vale (NFT de confirmación de reserva). Acéptalo en tu monedero para confirmar el acceso prioritario.",
  }),
  voucherAccept: m({
    ko: "지갑에서 바우처를 수락해야 우선 구매 자격이 확정됩니다. 발행만으로는 확정되지 않습니다.",
    en: "You must accept the voucher in your wallet to confirm priority access. Issuance alone does not confirm it.",
    ja: "ウォレットでバウチャーを承認してはじめて優先購入資格が確定します。発行だけでは確定しません。",
    zh: "需在钱包中接受凭证，优先购买资格才算确定。仅发行并不代表已确定。",
    es: "Debes aceptar el vale en tu monedero para confirmar el acceso prioritario. Emitirlo no basta.",
  }),
  boostWalletCond: m({
    ko: "부스트는 최초 수령 지갑에서 보유 중일 때만 유효합니다. 다른 지갑으로 옮기면 유지되지 않습니다.",
    en: "The boost applies only while held in the wallet that first received it. Moving it to another wallet ends it.",
    ja: "ブーストは最初に受け取ったウォレットで保有している間のみ有効です。他のウォレットへ移すと維持されません。",
    zh: "加成仅在最初接收的钱包持有期间有效。转移到其他钱包即失效。",
    es: "El impulso solo se aplica mientras se conserva en el monedero que lo recibió primero. Si lo mueves, se pierde.",
  }),

  /* ── 판매 조건 * 주석 (8/29 서우: 히어로 하단 → 커뮤니티 패널 위로 이동) ─────
     문구도 이때 개정했다. 바뀐 지점 두 곳:
       · 오픈 시각을 "9월 15일 00시 KST(한국시간) 기준"으로 명시
       · 추첨 결과 통지(9/14 09시)는 이 블록에서 뺐다 — 응모 모달 3단계와 FAQ 에 남아 있다 */
  noticeDraw: m({
    ko: "추첨을 통해 9월 15일 00시 KST(한국시간) 기준, 오픈 당일 한정수량을 구매할 수 있는 권한을 드립니다.",
    en: "A draw grants the right to buy from the limited quantity on opening day, from 00:00 KST on Sept 15.",
    ja: "抽選により、9月15日00時KST（韓国時間）のオープン当日、限定数量を購入できる権利を差し上げます。",
    zh: "通过抽签，获得在9月15日00时KST（韩国时间）开售当日购买限量数量的权利。",
    es: "Un sorteo otorga el derecho a comprar la cantidad limitada el día de apertura, desde las 00:00 KST del 15 de septiembre.",
  }),
  noticeWinners: m({
    ko: "당첨된 분만 정해진 기간 내에 구매할 수 있으며, 구매하지 않으면 해당 수량은 일반 구매로 넘어갑니다.",
    en: "Winners buy within a set window — any unbought units are released to general sale.",
    ja: "当選された方のみ所定の期間内に購入でき、購入されない場合その数量は一般販売に回ります。",
    zh: "仅中签者可在规定期间内购买，未购买的数量将转为普通销售。",
    es: "Solo los ganadores compran dentro del plazo fijado; las unidades no compradas pasan a la venta general.",
  }),
  /* 8/29 서우: "당첨과 미당첨의 경우 커뮤니티 공지 및 지갑 연결후 알 수 있습니다."
     별도 통지일 없이 오픈 시각에 알게 되는 구조라 시각을 함께 못 박는다. */
  noticeResult: m({
    ko: "당첨·미당첨 여부는 9월 15일 00시(KST)부터 커뮤니티 공지와 지갑 연결로 확인하실 수 있습니다.",
    en: "Whether you won is shown from 00:00 KST on Sept 15 — in the community announcement, and once you connect your wallet.",
    ja: "当選・落選は9月15日0時（KST）から、コミュニティのお知らせとウォレット接続でご確認いただけます。",
    zh: "是否中签可自 9 月 15 日 00 时（KST）起，通过社区公告与连接钱包确认。",
    es: "Si has resultado ganador se muestra desde las 00:00 KST del 15 de septiembre, en el anuncio de la comunidad y al conectar tu monedero.",
  }),
  noticeGenesis: m({
    ko: "제네시스 넘버는 구매 시 랜덤 배정됩니다.",
    en: "Genesis Numbers are randomly assigned at purchase.",
    ja: "ジェネシスナンバーは購入時にランダムで割り当てられます。",
    zh: "创世编号在购买时随机分配。",
    es: "Los Genesis Numbers se asignan de forma aleatoria en la compra.",
  }),
  noticeTicket: m({
    ko: "판매 오픈 후, 디바이스 구매 시 'XRP SEOUL 2026' 무료 증정 (1대/1장, 10만원 상당)",
    en: "After sales open, buy a device and get 'XRP SEOUL 2026' free (one per device, \u20a9100,000 value)",
    ja: "販売オープン後、デバイス購入で「XRP SEOUL 2026」を無料進呈（1台につき1枚、10万ウォン相当）",
    zh: "开售后，购买设备即免费赠送 'XRP SEOUL 2026'（每台1张，价值10万韩元）",
    es: "Tras la apertura de ventas, compra un dispositivo y recibe 'XRP SEOUL 2026' gratis (una por dispositivo, valor de 100.000 KRW)",
  }),
  noticeShipping: m({
    ko: "배송 2주 전에 커뮤니티(텔레그램) · 공지(X)로 안내드립니다.",
    en: "Shipping is announced 2 weeks ahead in the community (Telegram) \u00b7 updates on X.",
    ja: "配送の2週間前にコミュニティ（テレグラム）・お知らせ（X）でご案内します。",
    zh: "发货前两周将通过社区（Telegram）与公告（X）通知。",
    es: "El envío se anuncia con 2 semanas de antelación en la comunidad (Telegram) y en X.",
  }),

  /* ── 푸터 · 커뮤니티 패널 (chrome.tsx) ─────────────────────────────── */
  footCta: m({
    ko: "Official 커뮤니티에서 소식을 받아보세요",
    en: "Get updates in the official community",
    ja: "公式コミュニティで最新情報を受け取る",
    zh: "在官方社区获取最新消息",
    es: "Recibe novedades en la comunidad oficial",
  }),
  footSub: m({
    ko: "발송 일정 · 연동 가이드 · 네트워크 업데이트를 가장 먼저 전합니다",
    en: "Shipping schedules, setup guides, and network updates — delivered first",
    ja: "発送スケジュール・接続ガイド・ネットワーク更新をいち早くお届けします",
    zh: "发货安排、连接指南与网络更新，第一时间送达",
    es: "Calendario de envíos, guías de conexión y novedades de la red, primero aquí",
  }),
  joinCommunity: m({
    ko: "커뮤니티 입장",
    en: "Join the community",
    ja: "コミュニティに参加",
    zh: "加入社区",
    es: "Unirse a la comunidad",
  }),
  followUpdates: m({
    ko: "소식 팔로우",
    en: "Follow for updates",
    ja: "最新情報をフォロー",
    zh: "关注动态",
    es: "Seguir novedades",
  }),
  /* 8/30 — FAQ 섹션 아래 봇 안내. "바로 답" 을 약속하지 않는다(정본에 없는 질문은 사람이 받는다) */
  askBot: m({
    ko: "텔레그램 봇에게 물어보기",
    en: "Ask our Telegram bot",
    ja: "Telegram ボットに質問する",
    zh: "向 Telegram 机器人提问",
    es: "Pregunta a nuestro bot de Telegram",
  }),
  askBotSub: m({
    ko: "같은 답을 1:1 대화창에서 언제든 찾아볼 수 있습니다",
    en: "The same answers, any time, in a one-to-one chat",
    ja: "同じ回答を 1:1 のチャットでいつでも確認できます",
    zh: "同样的答案，随时在一对一对话中查看",
    es: "Las mismas respuestas, cuando quieras, en un chat privado",
  }),
  newsChannel: m({
    ko: "공지 채널",
    en: "Announcements",
    ja: "お知らせチャンネル",
    zh: "公告频道",
    es: "Canal de anuncios",
  }),
  terms: m({
    ko: "이용약관",
    en: "Terms of Service",
    ja: "利用規約",
    zh: "服务条款",
    es: "Términos del servicio",
  }),
  /* 제품 정식명은 상표다 — ja/zh/es 를 비워 영문명으로 폴백시킨다(임의 번역 금지) */
  productName: m({
    ko: "날씨데이터토큰생성기™",
    en: "Weather Data Token Generator™",
  }),

  /* ── 사전 구매응모 모달 (PreOrderModal.tsx) ───────────────────────── */
  stepNames: m<string[]>({
    ko: ["로그인", "지갑 생성", "응모 대수", "완료"],
    en: ["Sign-in", "Wallet", "Quantity", "Done"],
    ja: ["ログイン", "ウォレット", "応募台数", "完了"],
    zh: ["登录", "钱包", "申请数量", "完成"],
    es: ["Acceso", "Billetera", "Cantidad", "Listo"],
  }),
  preorderLabel: m({ ko: "사전 구매응모", en: "Pre-purchase entry", ja: "事前購入応募", zh: "预购申请", es: "Inscripción de precompra" }),
  close: m({ ko: "닫기", en: "Close", ja: "閉じる", zh: "关闭", es: "Cerrar" }),
  signInTitle: m({
    ko: "구글 로그인으로 시작",
    en: "Start with Google",
    ja: "Google でログインして開始",
    zh: "使用 Google 登录开始",
    es: "Empieza con Google",
  }),
  continueGoogle: m({
    ko: "구글로 계속하기",
    en: "Continue with Google",
    ja: "Google で続ける",
    zh: "使用 Google 继续",
    es: "Continuar con Google",
  }),
  connecting: m({ ko: "연결 중…", en: "Connecting…", ja: "接続中…", zh: "连接中…", es: "Conectando…" }),
  walletReady: m({
    ko: "내 지갑이 만들어졌습니다",
    en: "Your wallet is ready",
    ja: "ウォレットが作成されました",
    zh: "你的钱包已创建",
    es: "Tu billetera está lista",
  }),
  nextQuantity: m({
    ko: "다음 — 응모 대수 설정",
    en: "Next — set quantity",
    ja: "次へ — 応募台数を設定",
    zh: "下一步 — 设置申请数量",
    es: "Siguiente: elegir cantidad",
  }),
  qtyTitle: m({
    ko: "응모 대수 설정",
    en: "Set your quantity",
    ja: "応募台数を設定",
    zh: "设置申请数量",
    es: "Elige la cantidad",
  }),
  decrease: m({ ko: "1대 빼기", en: "Decrease", ja: "1台減らす", zh: "减少 1 台", es: "Quitar una" }),
  increase: m({ ko: "1대 더하기", en: "Increase", ja: "1台増やす", zh: "增加 1 台", es: "Añadir una" }),
  /* 8/28 서우 지정 문안 — 추첨제. "선착순 걱정 없이"는 더 이상 사실이 아니다 */
  notCommitment: m({
    ko: "사전 구매응모는 결제가 아니며, 추첨을 통해 오픈 당일 한정수량을 구매할 수 있는 권한을 드립니다.",
    en: "An entry is not a payment. A draw grants the right to buy from the limited quantity on opening day.",
    ja: "事前購入応募は決済ではありません。抽選により、オープン当日の限定数量を購入できる権利をお渡しします。",
    zh: "预购申请不是付款。通过抽签，向中签者授予在开售当日购买限量数量的权利。",
    es: "La inscripción no es un pago. Un sorteo otorga el derecho a comprar la cantidad limitada el día de apertura.",
  }),
  perAccountCap: m({
    ko: "1계정 최대 100대까지 설정할 수 있습니다.",
    en: "Up to 100 units per account.",
    ja: "1アカウントにつき最大100台まで設定できます。",
    zh: "每个账户最多可设置 100 台。",
    es: "Hasta 100 unidades por cuenta.",
  }),
  /* ── 판매 계열(추첨 이후) — 8/28 서우: 판매·마감 화면도 추첨제에 맞춘다 ────────
     추첨을 도입했는데 판매 화면이 "지금 구매하기"만 말하면, 응모하지 않은 사람은
     그냥 살 수 있는 줄 알고 들어왔다가 막힌다. 상태를 화면이 먼저 말해야 한다. */
  saleWinnersOnly: m({
    ko: "추첨 당첨자 구매 기간입니다 · 커뮤니티 공지와 지갑 연결로 확인해 주세요",
    en: "Purchase window for draw winners — check the community announcement, or connect your wallet",
    ja: "抽選当選者の購入期間です・コミュニティのお知らせとウォレット接続でご確認ください",
    zh: "抽签中签者购买期间 · 请通过社区公告与连接钱包确认",
    es: "Periodo de compra para los ganadores del sorteo: consulta el anuncio de la comunidad o conecta tu monedero",
  }),
  saleLeftoverNote: m({
    ko: "당첨자가 기간 내에 구매하지 않은 수량은 일반 구매로 전환됩니다",
    en: "Units winners do not buy within the window are released to general sale",
    ja: "当選者が期間内に購入しなかった数量は一般販売に切り替わります",
    zh: "中签者未在期限内购买的数量将转为一般销售",
    es: "Las unidades no compradas dentro del plazo pasan a venta general",
  }),
  /* 8/29 서우: 추첨 결과 발표 일정(9/14)을 없앤다 — 당첨 여부는 9월 15일 00시 오픈과
     동시에 커뮤니티 공지·지갑 연결로 알게 된다. 별도 통지일을 두지 않는다. */
  ddayLead: m({
    ko: "9월 15일 00시(KST) 오픈 · 당첨 시 구매 가능",
    en: "Opens 00:00 KST on Sept 15 · winners can buy",
    ja: "9月15日0時（KST）オープン・当選なら購入できます",
    zh: "9 月 15 日 00 时（KST）开售 · 中签者可购买",
    es: "Apertura a las 00:00 KST del 15 de septiembre · los ganadores pueden comprar",
  }),
  soldOutSub: m({
    ko: "당첨자 구매분과 일반 구매 전환분이 모두 소진되었습니다",
    en: "Winner purchases and the units released to general sale are all gone",
    ja: "当選者の購入分と一般販売への切替分がすべて完売しました",
    zh: "中签者购买份额与转为一般销售的数量均已售罄",
    es: "Se agotaron las compras de ganadores y las unidades pasadas a venta general",
  }),
  /* drawResult(추첨 결과를 9/14 09시 KST 가입 메일로 통지) 는 8/29 서우 지시로 삭제했다 —
     * 주석 · FAQ · 응모 모달 3단계 · 완료 화면 네 곳에서 모두 뺐다. 통지 수단이 정해지면
     git 이력(211c9aa 이전)에서 5개 언어 그대로 되살릴 수 있다. */
  preorderDone: m({
    ko: "사전 구매응모가 완료되었습니다",
    en: "Your entry is in",
    ja: "事前購入応募が完了しました",
    zh: "预购申请已完成",
    es: "Tu inscripción está registrada",
  }),
  communityTg: m({
    ko: "커뮤니티(텔레그램)",
    en: "Community (Telegram)",
    ja: "コミュニティ（Telegram）",
    zh: "社区（Telegram）",
    es: "Comunidad (Telegram)",
  }),
  updatesX: m({ ko: "소식보기(X)", en: "Updates (X)", ja: "最新情報（X）", zh: "动态（X）", es: "Novedades (X)" }),
  back: m({ ko: "← 이전 단계", en: "← Back", ja: "← 前の手順", zh: "← 上一步", es: "← Atrás" }),
  /* 수량이 들어가는 문장은 함수로 — 언어마다 조사·복수형 규칙이 달라 문자열 조립을 맡긴다 */
  unitSuffix: m<(n: number) => string>({
    ko: () => "대",
    en: (n) => ` unit${n > 1 ? "s" : ""}`,
    ja: () => "台",
    zh: () => " 台",
    es: (n) => (n > 1 ? " unidades" : " unidad"),
  }),
  reserveCta: m<(n: number) => string>({
    ko: (n) => `${n}대 응모 완료하기`,
    en: (n) => `Enter for ${n} unit${n > 1 ? "s" : ""}`,
    ja: (n) => `${n}台の応募を完了する`,
    zh: (n) => `完成 ${n} 台申请`,
    es: (n) => `Participar por ${n} ${n > 1 ? "unidades" : "unidad"}`,
  }),
} as const;
