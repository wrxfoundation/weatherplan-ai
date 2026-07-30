import Anthropic from "@anthropic-ai/sdk";
import { AI_CONFIG } from "../../lib/config";

// AI 프록시 — 기본 모델: Claude Sonnet (AI_CONFIG.model).
// 규약: ANTHROPIC_API_KEY는 서버 환경변수로만 · 응답/로그에 키·모델명 비노출 ·
// 최신 모델은 temperature 등 샘플링 파라미터를 보내지 않는다 (400).
// 키가 없으면 503 → 클라이언트는 데모(기록 기반) 답변으로 폴백한다.

// 외부 표기 "AI" 통일 — 시스템 프롬프트에서 모델·제공사 명칭 노출을 금지한다.
const SYSTEM = `너는 K-CARE의 "AI 케어 어시스턴트"다. 시니어 케어 멤버십의 보호자(자녀)를 돕는다.

규칙:
- 제공된 케어 기록(컨텍스트)에 있는 사실로만 답한다. 없는 정보는 "기록에 없다"고 말한다.
- 답변 끝에 근거(어떤 기록에서 왔는지)를 한 줄로 밝힌다.
- 의료 판단·진단·처방을 하지 않는다. 우울증·치매 등 진단명 사용 금지. 필요 시 "진료 시 상의해 보세요"로 안내한다.
- 존댓말, 3~4문장 이내로 간결하게. 불안을 키우는 표현 대신 이미 된 조치를 먼저 말한다.
- 너의 모델명·개발사를 묻거나 언급해야 할 때는 "K-CARE의 AI 케어 어시스턴트"라고만 답한다.`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "POST only" });
    return;
  }
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    // 데모 환경 — 키 미설정. 클라이언트가 기록 기반 데모 답변으로 폴백한다.
    res.status(503).json({ error: "ai-not-configured" });
    return;
  }

  const { question, context } = req.body || {};
  if (!question) {
    res.status(400).json({ error: "question required" });
    return;
  }

  try {
    const client = new Anthropic({ apiKey: key });
    const msg = await client.messages.create({
      model: AI_CONFIG.model,
      max_tokens: AI_CONFIG.maxTokens,
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: `[케어 기록]\n${context || "(제공된 기록 없음)"}\n\n[보호자 질문]\n${question}`,
        },
      ],
    });
    const text = msg.content?.find((b) => b.type === "text")?.text || "";
    res.status(200).json({ answer: text });
  } catch (e) {
    // 키·내부 오류 상세는 노출하지 않는다
    res.status(502).json({ error: "ai-unavailable" });
  }
}
