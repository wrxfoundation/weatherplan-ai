/* XRP SEOUL 2026 래플 - 경품 이름·설명의 언어별 표기 (2026-09-21 점검).
   설정(raffleState.config.prizes)의 이름은 한국어 정본이고, 화면(경품 카드·결제창·내 응모)·NFT 카드 이미지·티켓 페이지는
   이 표를 거쳐 언어별로 보여 준다. 표에 없는 이름은 그대로 쓴다. React 를 쓰지 않으므로 서버 라우트에서도 부른다.
   설명(note)은 한국어는 설정값을 그대로, 다른 언어는 같은 경품의 표 번역을 쓴다(자유 문장은 번역할 수 없다). */
export type PrizeLang = "ko" | "en" | "ja" | "zh" | "es";
export type PrizeKey = "invite" | "generator" | "umbrella" | "ecobag";

export function prizeKey(name: string): PrizeKey | null {
  if (name.includes("초대권") || /invit/i.test(name)) return "invite";
  if (/generator/i.test(name)) return "generator";
  if (name.includes("우산") || /umbrella/i.test(name)) return "umbrella";
  if (name.includes("에코백") || /eco ?bag/i.test(name)) return "ecobag";
  return null;
}

const LABEL: Record<PrizeKey, Record<PrizeLang, string>> = {
  invite: { ko: "XRP SEOUL 2026 초대권", en: "XRP SEOUL 2026 invitation", ja: "XRP SEOUL 2026 招待券", zh: "XRP SEOUL 2026 邀请函", es: "Invitación a XRP SEOUL 2026" },
  generator: { ko: "Weather Data Token Generator™", en: "Weather Data Token Generator™", ja: "Weather Data Token Generator™", zh: "Weather Data Token Generator™", es: "Weather Data Token Generator™" },
  umbrella: { ko: "wellbian 우산", en: "wellbian umbrella", ja: "wellbian 傘", zh: "wellbian 雨伞", es: "Paraguas wellbian" },
  ecobag: { ko: "wellbian 에코백", en: "wellbian eco bag", ja: "wellbian エコバッグ", zh: "wellbian 环保袋", es: "Bolsa ecológica wellbian" },
};
const BOOTH: Record<PrizeLang, string> = {
  ko: "행사 당일 'wellbian 플래티넘 부스' 현장수령", en: "Collected at the wellbian Platinum booth on the event day",
  ja: "イベント当日、wellbianプラチナブースで受取", zh: "活动当天于 wellbian 白金展位领取", es: "Se recoge en el stand Platinum de wellbian el día del evento",
};
const NOTE: Record<PrizeKey, Record<PrizeLang, string>> = {
  invite: { ko: "10월 3일 서울 · 행사장 입장권 · 당첨자 이메일로 발송", en: "3 October, Seoul · venue admission · sent to winners by email", ja: "10月3日 ソウル・会場入場券・当選者にメールで送付", zh: "10 月 3 日 首尔 · 会场入场券 · 通过邮件发送给中奖者", es: "3 de octubre, Seúl · entrada al recinto · se envía por correo a los ganadores" },
  generator: {
    ko: "제네시스 한정판, 실물 날씨데이터 토큰 생성기 1대 · 행사 당일 'wellbian 플래티넘 부스' 현장수령",
    en: "Genesis limited edition, one physical weather-data token generator · collected at the wellbian Platinum booth on the event day",
    ja: "ジェネシス限定版、実物の気象データトークン生成機1台・イベント当日、wellbianプラチナブースで受取",
    zh: "创世限定版，实物天气数据代币生成器 1 台 · 活动当天于 wellbian 白金展位领取",
    es: "Edición limitada Genesis, un generador físico de tokens de datos meteorológicos · se recoge en el stand Platinum de wellbian el día del evento",
  },
  umbrella: BOOTH,
  ecobag: BOOTH,
};

/** 경품 이름 - 언어별. 표에 없는 이름은 설정값 그대로. */
export function prizeLabel(name: string, lang: PrizeLang): string {
  const k = prizeKey(name);
  return k ? LABEL[k][lang] : name;
}

/** 경품 설명 - 한국어는 설정의 note 를 그대로, 다른 언어는 표 번역. 표에 없는 경품은 설정의 note(한국어) 를 그대로 보여 준다. */
export function prizeNote(p: { name: string; note?: string }, lang: PrizeLang): string | undefined {
  const k = prizeKey(p.name);
  if (lang === "ko") return p.note ?? (k ? NOTE[k].ko : undefined);
  return k ? NOTE[k][lang] : p.note;
}

/** 히어로·FAQ 의 한 줄 요약용 짧은 표기 - "초대권 290매" · "290 invitations". 모르는 이름은 "이름 수량". */
export function prizeWord(p: { name: string; qty: number }, lang: PrizeLang): string {
  const k = prizeKey(p.name); const q = p.qty; const n = p.name;
  if (!k) return lang === "ko" || lang === "ja" || lang === "zh" ? `${n} ${q}` : `${q} ${n}`;
  const W: Record<PrizeKey, Record<PrizeLang, string>> = {
    invite: { ko: `초대권 ${q}매`, en: `${q} invitations`, ja: `招待券${q}枚`, zh: `邀请函 ${q} 张`, es: `${q} invitaciones` },
    generator: { ko: `Weather Data Token Generator™ ${q}대`, en: `${q} Weather Data Token Generator™`, ja: `Weather Data Token Generator™ ${q}台`, zh: `Weather Data Token Generator™ ${q} 台`, es: `${q} Weather Data Token Generator™` },
    umbrella: { ko: `우산 ${q}개`, en: `${q} umbrellas`, ja: `傘${q}本`, zh: `雨伞 ${q} 把`, es: `${q} paraguas` },
    ecobag: { ko: `에코백 ${q}개`, en: `${q} eco bags`, ja: `エコバッグ${q}個`, zh: `环保袋 ${q} 个`, es: `${q} bolsas ecológicas` },
  };
  return W[k][lang];
}
