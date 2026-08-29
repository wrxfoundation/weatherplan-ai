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
    ko: "추첨 당첨자 구매 기간입니다 · 당첨 안내 메일을 확인해 주세요",
    en: "Purchase window for draw winners — check your result email",
    ja: "抽選当選者の購入期間です・当選案内メールをご確認ください",
    zh: "抽签中签者购买期间 · 请查看中签通知邮件",
    es: "Periodo de compra para los ganadores del sorteo: revisa tu correo de resultados",
  }),
  saleLeftoverNote: m({
    ko: "당첨자가 기간 내에 구매하지 않은 수량은 일반 구매로 전환됩니다",
    en: "Units winners do not buy within the window are released to general sale",
    ja: "当選者が期間内に購入しなかった数量は一般販売に切り替わります",
    zh: "中签者未在期限内购买的数量将转为一般销售",
    es: "Las unidades no compradas dentro del plazo pasan a venta general",
  }),
  ddayLead: m({
    ko: "추첨 결과 9월 14일 · 당첨 시 9월 15일 구매",
    en: "Draw results Sept 14 · winners buy Sept 15",
    ja: "抽選結果は9月14日・当選なら9月15日に購入",
    zh: "9 月 14 日公布抽签结果 · 中签者 9 月 15 日购买",
    es: "Resultados el 14 de septiembre · los ganadores compran el 15",
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
