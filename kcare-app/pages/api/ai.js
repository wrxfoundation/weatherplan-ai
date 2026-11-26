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

const RATE = new Map(); // ip → timestamps (인스턴스 로컬)

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "POST only" });
    return;
  }
  // 입력 검증 — 신뢰할 수 없는 클라이언트 입력: 타입·길이·role 화이트리스트
  const { question, context, role } = req.body || {};
  if (typeof question !== "string" || !question.trim() || question.length > 600) {
    res.status(400).json({ error: "invalid-question" });
    return;
  }
  const safeContext = typeof context === "string" ? context.slice(0, 6000) : "";
  const safeRole = ["guardian", "dispatch", "admin"].includes(role) ? role : "guardian";

  // 레이트 리밋 — 인스턴스 로컬 (데모 수준: IP당 분당 20회)
  const ip = (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || req.socket?.remoteAddress || "?";
  const now = Date.now();
  const bucket = RATE.get(ip) || [];
  const recent = bucket.filter((t) => now - t < 60_000);
  if (recent.length >= 20) {
    res.status(429).json({ error: "rate-limited" });
    return;
  }
  recent.push(now);
  RATE.set(ip, recent);
  if (RATE.size > 500) RATE.clear(); // 메모리 상한 — 데모 안전장치

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    // 데모 환경 — 키 미설정. 클라이언트가 기록 기반 데모 답변으로 폴백한다.
    res.status(503).json({ error: "ai-not-configured" });
    return;
  }

  // 사고(thinking)는 끈다 — 답변이 3~5문장이라 얻는 게 없고,
  // 켜두면 max_tokens 예산을 사고가 먹어 답변이 잘린다.
  // 프롬프트 캐싱은 쓰지 않는다: 역할별 시스템 프롬프트가 캐시 최소 길이에
  // 한참 못 미쳐 cache_control을 붙여도 조용히 무시된다 (비용만 늘어남).
  const params = {
    model: AI_CONFIG.model,
    max_tokens: AI_CONFIG.maxTokens,
    thinking: { type: "disabled" },
    system: ROLE_SYSTEM[safeRole],
    messages: [
      {
        role: "user",
        content: `[컨텍스트]\n${safeContext || "(제공된 기록 없음)"}\n\n[질문]\n${question.slice(0, 600)}`,
      },
    ],
  };

  const client = new Anthropic({ apiKey: key });

  // 스트리밍 — 답변이 다 끝날 때까지 화면이 멈춰 있으면 시연에서 "죽은 것처럼" 보인다.
  // 첫 글자가 뜨는 시점을 앞당기는 게 목적. 실패 시 아래 비스트리밍 경로로 폴백한다.
  if (req.body?.stream) {
    let opened = false;
    try {
      const stream = client.messages.stream(params);
      for await (const ev of stream) {
        if (ev.type !== "content_block_delta" || ev.delta?.type !== "text_delta") continue;
        if (!opened) {
          opened = true;
          res.writeHead(200, {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-store, max-age=0",
            "X-Accel-Buffering": "no", // 프록시 버퍼링 방지 — 안 그러면 스트리밍이 무의미
          });
        }
        res.write(ev.delta.text);
      }
      if (!opened) {
        // 텍스트가 한 글자도 안 온 경우 — 헤더를 아직 안 보냈으니 오류로 처리
        res.status(502).json({ error: "ai-unavailable" });
        return;
      }
      res.end();
    } catch (e) {
      // 헤더를 이미 보냈으면 상태 코드를 바꿀 수 없다 — 끊고 클라이언트가 폴백하게 둔다
      if (opened) res.end();
      else res.status(502).json({ error: "ai-unavailable" });
    }
    return;
  }

  try {
    const msg = await client.messages.create(params);
    const text = msg.content?.find((b) => b.type === "text")?.text || "";
    res.status(200).json({ answer: text });
  } catch (e) {
    // 키·내부 오류 상세는 노출하지 않는다
    res.status(502).json({ error: "ai-unavailable" });
  }
}
