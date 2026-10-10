/* 텔레그램 호출 한 곳. 웹훅과 대시보드가 같은 함수를 쓴다 —
   따로 두면 한쪽만 고쳐져서 "봇은 되는데 답장은 안 가는" 종류의 어긋남이 생긴다. */

const TOKEN = process.env.TG_BOT_TOKEN ?? "";
/* 기본은 텔레그램. 로컬에서 답장 경로를 실제로 확인하려면 목 서버를 가리키게 둔다 —
   보내지 못했을 때 상태를 바꾸지 않는 분기는 눈으로 봐야 믿을 수 있다. */
const BASE = process.env.TG_API_BASE ?? "https://api.telegram.org";

export const tgCall = async (method: string, body: unknown): Promise<boolean> => {
  if (!TOKEN) return false;
  try {
    const res = await fetch(`${BASE}/bot${TOKEN}/${method}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    return res.ok;
  } catch {
    return false;
  }
};
