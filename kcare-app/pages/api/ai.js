import Anthropic from "@anthropic-ai/sdk";
import { AI_CONFIG } from "../../lib/config";

// AI 프록시 — 기본 모델: Claude Sonnet (AI_CONFIG.model).
// 규약: ANTHROPIC_API_KEY는 서버 환경변수로만 · 응답/로그에 키·모델명 비노출 ·
// 최신 모델은 temperature 등 샘플링 파라미터를 보내지 않는다 (400).
// 키가 없으면 503 → 클라이언트는 데모(기록 기반) 답변으로 폴백한다.

// 외부 표기 "AI" 통일 — 시스템 프롬프트에서 모델·제공사 명칭 노출을 금지한다.
// 역할별 시스템 프롬프트 — guardian(보호자) / dispatch(관제) / admin(경영)
const COMMON = `- 제공된 컨텍스트에 있는 사실로만 답한다. 없는 정보는 "기록에 없다"고 말한다.
- 답변 끝에 근거(어떤 기록에서 왔는지)를 한 줄로 밝힌다.
- 의료 판단·진단·처방을 하지 않는다. 우울증·치매 등 진단명 사용 금지.
- 존댓말, 간결하게.
- 너의 모델명·개발사를 묻거나 언급해야 할 때는 "K-CARE의 AI 어시스턴트"라고만 답한다.`;

const ROLE_SYSTEM = {
  guardian: `너는 K-CARE의 "AI 케어 어시스턴트"다. 시니어 케어 멤버십의 보호자(자녀)를 돕는다.

규칙:
${COMMON}
- 3~4문장 이내. 불안을 키우는 표현 대신 이미 된 조치를 먼저 말한다.`,
  dispatch: `너는 K-CARE 배치 관제 센터의 "AI 관제 어시스턴트"다. 관제 담당자의 상황 파악과 우선순위 판단을 돕는다.

규칙:
${COMMON}
- 우선순위를 제안하되, 배차·해제 등 실행은 담당자 승인으로만 진행된다는 전제를 지킨다 (L4).
- 1인 배차는 제안하지 않는다 (2인 페어 원칙).
- 3~5문장, 번호 목록 허용.`,
  admin: `너는 K-CARE 경영 콘솔의 "AI 경영 어시스턴트"다. 사람(컨시어지·보호자·어르신) 지표의 분석을 돕는다.

규칙:
${COMMON}
- 집계 데이터만 다룬다. 개별 사건·개인 민감정보는 답하지 않는다 (관제·CS 소관으로 안내).
- 컨시어지 평가에 판매액·업셀 지표를 사용하지 않는다 (케어 품질만).
- 3~5문장.`,
};

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

  const { question, context, role } = req.body || {};
  if (!question) {
    res.status(400).json({ error: "question required" });
    return;
  }

  try {
    const client = new Anthropic({ apiKey: key });
    const msg = await client.messages.create({
      model: AI_CONFIG.model,
      max_tokens: AI_CONFIG.maxTokens,
      system: ROLE_SYSTEM[role] || ROLE_SYSTEM.guardian,
      messages: [
        {
          role: "user",
          content: `[컨텍스트]\n${context || "(제공된 기록 없음)"}\n\n[질문]\n${question}`,
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
