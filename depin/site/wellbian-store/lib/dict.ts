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
  preorderCta: m({
    ko: "사전예약 신청하기",
    en: "Pre-order now",
    ja: "事前予約を申し込む",
    zh: "立即预约",
    es: "Reservar ahora",
  }),
  preorderShort: m({
    ko: "사전예약",
    en: "Pre-order",
    ja: "事前予約",
    zh: "预约",
    es: "Reservar",
  }),

  /* ── S2 우리가 만드는 것 ────────────────────────────────────────────── */
  howTitle: m({
    ko: "우리가 만드는 것",
    en: "What we're building",
    ja: "私たちがつくるもの",
    zh: "我们在构建什么",
    es: "Lo que estamos construyendo",
  }),
  howLead: m({
    ko: "공기는 건물마다, 골목마다 다릅니다 — 기존 관측망이 닿지 않는 곳이죠. 내가 생활하는 공간에서 측정한 데이터가 검증을 거쳐 보상으로 돌아오고, 쌓인 데이터는 서비스가 되는 경제를 구축해 나갑니다.",
    en: "Air differs building by building, street by street — beyond the reach of public weather stations. Data measured where you actually live comes back as rewards after verification, and as it accumulates, it builds an economy of services.",
    ja: "空気は建物ごと、路地ごとに違います — 既存の観測網が届かない場所です。自分が暮らす空間で計測したデータが検証を経て報酬として戻り、蓄積されたデータがサービスになる経済を築いていきます。",
    zh: "空气因楼栋而异、因街巷而异 —— 那是既有观测网触及不到的地方。在你生活的空间里测得的数据，经验证后化为奖励；累积的数据则构建起服务化的经济。",
    es: "El aire cambia de edificio en edificio y de calle en calle, más allá del alcance de las estaciones meteorológicas. Los datos medidos donde vives vuelven como recompensa tras verificarse y, al acumularse, construyen una economía de servicios.",
  }),

  /* 4단계 카드 — 제목은 번호(①~④)를 코드에서 붙인다 */
  step1Title: m({ ko: "측정", en: "Measure", ja: "計測", zh: "测量", es: "Medir" }),
  step1Desc: m({
    ko: "CO₂·미세먼지·온습도 등 실내 공기 데이터를 측정",
    en: "Indoor air data — CO₂, particulates, temperature, humidity",
    ja: "CO₂・微小粒子・温湿度など室内空気データを計測",
    zh: "测量 CO₂、颗粒物、温湿度等室内空气数据",
    es: "Datos del aire interior: CO₂, partículas, temperatura y humedad",
  }),
  step2Title: m({ ko: "검증", en: "Verify", ja: "検証", zh: "验证", es: "Verificar" }),
  step2Desc: m({
    ko: "네트워크가 데이터의 무결성을 검증",
    en: "The network verifies data integrity",
    ja: "ネットワークがデータの整合性を検証",
    zh: "网络验证数据完整性",
    es: "La red verifica la integridad de los datos",
  }),
  step3Title: m({ ko: "보상", en: "Reward", ja: "報酬", zh: "奖励", es: "Recompensar" }),
  step3Desc: m({
    ko: "검증된 데이터에 네트워크 원칙에 따라 WLBN이 지급",
    en: "Verified data earns WLBN under network rules",
    ja: "検証済みデータにネットワークの規則に従い WLBN を付与",
    zh: "按网络规则向已验证数据发放 WLBN",
    es: "Los datos verificados reciben WLBN según las reglas de la red",
  }),
  step4Title: m({ ko: "활용", en: "Utilize", ja: "活用", zh: "应用", es: "Utilizar" }),
  step4Desc: m({
    ko: "축적된 데이터는 API·AI·기상 서비스로 활용",
    en: "Accumulated data powers APIs, AI, weather services",
    ja: "蓄積データを API・AI・気象サービスに活用",
    zh: "累积数据用于 API、AI 与气象服务",
    es: "Los datos acumulados alimentan API, IA y servicios meteorológicos",
  }),

  /* ── 선순환 ────────────────────────────────────────────────────────── */
  loopTitle: m({
    ko: "데이터가 돌수록 단단해지는 선순환",
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
  /* 필수 고지 — 어느 언어에서도 빠지면 안 된다 */
  rewardNotice: m({
    ko: "보상 재원은 데이터 매출에 연동됩니다 · 지급량과 가치는 보장되지 않습니다",
    en: "The reward pool is tied to data sales — amounts and value are not guaranteed.",
    ja: "報酬原資はデータ売上に連動します・支給量と価値は保証されません",
    zh: "奖励来源与数据销售挂钩 · 发放数量与价值不作保证",
    es: "El fondo de recompensas depende de las ventas de datos · la cantidad y el valor no están garantizados",
  }),

  /* ── 실시간 현황판 · 스티키 ────────────────────────────────────────── */
  liveBoard: m({
    ko: "실시간 사전예약 현황",
    en: "Live pre-order board",
    ja: "リアルタイム事前予約状況",
    zh: "实时预约动态",
    es: "Reservas en tiempo real",
  }),
  nowLabel: m({ ko: "현재", en: "Now", ja: "現在", zh: "当前", es: "Ahora" }),
  unitsPreordered: m({
    ko: "대 예약",
    en: " pre-ordered",
    ja: "台 予約",
    zh: "台 已预约",
    es: " reservadas",
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
  terms: m({
    ko: "이용약관 (TERMS)",
    en: "Terms of Service (TERMS)",
    ja: "利用規約 (TERMS)",
    zh: "服务条款 (TERMS)",
    es: "Términos del servicio (TERMS)",
  }),
  /* 제품 정식명은 상표다 — ja/zh/es 를 비워 영문명으로 폴백시킨다(임의 번역 금지) */
  productName: m({
    ko: "날씨데이터토큰생성기™",
    en: "Weather Data Token Generator™",
  }),

  /* ── 사전예약 모달 (PreOrderModal.tsx) ─────────────────────────────── */
  stepNames: m<string[]>({
    ko: ["로그인", "지갑 생성", "예약 대수", "완료"],
    en: ["Sign-in", "Wallet", "Quantity", "Done"],
    ja: ["ログイン", "ウォレット", "予約台数", "完了"],
    zh: ["登录", "钱包", "预约数量", "完成"],
    es: ["Acceso", "Billetera", "Cantidad", "Listo"],
  }),
  preorderLabel: m({ ko: "사전예약", en: "Pre-order", ja: "事前予約", zh: "预约", es: "Reserva" }),
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
    ko: "다음 — 예약 대수 설정",
    en: "Next — set quantity",
    ja: "次へ — 予約台数を設定",
    zh: "下一步 — 设置预约数量",
    es: "Siguiente: elegir cantidad",
  }),
  qtyTitle: m({
    ko: "사전예약 대수 설정",
    en: "Set your quantity",
    ja: "事前予約の台数を設定",
    zh: "设置预约数量",
    es: "Elige la cantidad",
  }),
  decrease: m({ ko: "1대 빼기", en: "Decrease", ja: "1台減らす", zh: "减少 1 台", es: "Quitar una" }),
  increase: m({ ko: "1대 더하기", en: "Increase", ja: "1台増やす", zh: "增加 1 台", es: "Añadir una" }),
  notCommitment: m({
    ko: "확정이 아닙니다 — 실제 구매 수량은 오픈 때 자유롭게 정할 수 있습니다.",
    en: "Not a commitment — you decide the actual amount when sales open.",
    ja: "確定ではありません — 実際の購入台数はオープン時に自由に決められます。",
    zh: "并非最终确定 —— 实际购买数量可在开售时自由决定。",
    es: "No es un compromiso: decides la cantidad real cuando abran las ventas.",
  }),
  preorderDone: m({
    ko: "사전예약이 완료되었습니다",
    en: "Pre-order complete",
    ja: "事前予約が完了しました",
    zh: "预约已完成",
    es: "Reserva completada",
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
    ko: (n) => `${n}대 사전예약 완료하기`,
    en: (n) => `Reserve ${n} unit${n > 1 ? "s" : ""}`,
    ja: (n) => `${n}台の事前予約を完了する`,
    zh: (n) => `完成 ${n} 台预约`,
    es: (n) => `Reservar ${n} ${n > 1 ? "unidades" : "unidad"}`,
  }),
} as const;
