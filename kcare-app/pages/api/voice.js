// 목소리 저장 · 듣기 (2026-10-14) — 테스트 계정 · 회원으로 로그인했을 때만 (lib/voice-client.js 가 부른다).
//
//   POST /api/voice                 { mime, secs, data(base64) } → { id }
//   GET  /api/voice?id=vc_…         녹음 파일 (같은 가구 계정만) · &download=1 이면 내려받기
//
// 어느 가구인지는 로그인 세션에서만 정한다 — 다른 가구(센터)의 목소리는 id 를 알아도 받을 수 없다.
// 소리는 supabase/schema.sql 의 voice_clips 표에 둔다 (가구 상태에는 id 만). 30일이 지난 것은 지운다.
import crypto from "crypto";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import { authConfigured } from "../../lib/auth-server";
import { db, dbConfigured, dbErrorCode, ensureHousehold } from "../../lib/db";
import { memberStillValid } from "../../lib/members";
import { makeLimiter, sameSiteJson } from "../../lib/http";

export const config = { api: { bodyParser: { sizeLimit: "3mb" } } };

// 받는 소리 형식 — 브라우저 녹음기가 만드는 것만 (codecs 붙은 것 포함)
const MIME_RE = /^audio\/(webm|ogg|mp4|aac|mpeg|x-m4a|wav)(;\s*codecs="?[\w.,-]+"?)?$/i;
const ID_RE = /^vc_[A-Za-z0-9_-]{16,40}$/;
const B64_RE = /^[A-Za-z0-9+/]+={0,2}$/;
// 약 2MB — 녹음기는 32kbps 로 부탁하지만(1분 약 240KB) 그 값을 무시하는 브라우저(128kbps)의 2분 답장도 들어가게.
// Vercel 요청 본문 한도(4.5MB) 안이다.
const MAX_B64 = 2_700_000;
const MAX_SECS = 180;
const KEEP_DAYS = 30;
// 가구마다 40MB 까지 — 넘으면 오래된 것부터 지운다. 공용 테스트 비밀번호를 아는 누구든 올릴 수 있어서,
// 한 가구가 무료 Supabase(500MB)를 채워 모든 가구의 저장 · 가입이 멈추는 일을 막는다 (2026-10-14 점검)
const HOUSEHOLD_CAP_BYTES = 40 * 1024 * 1024;
const EXT = { webm: "webm", ogg: "ogg", mp4: "m4a", "x-m4a": "m4a", aac: "aac", mpeg: "mp3", wav: "wav" };

// 한 계정이 짧은 시간에 쏟아 넣지 못하게 — 10분에 40개 (서버 인스턴스마다)
const uploads = makeLimiter({ windowMs: 10 * 60 * 1000, max: 40 });

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (!authConfigured()) return res.status(401).json({ error: "login-required" });
  const session = await getServerSession(req, res, authOptions);
  const user = session?.user;
  if (!user?.household) return res.status(401).json({ error: "login-required" });
  if (!dbConfigured()) return res.status(503).json({ error: "db-not-configured" });

  try {
    // 관제가 정지하거나 역할을 바꾼 회원은 여기서 멈춘다 (가구 상태 저장과 같은 규칙)
    const still = await memberStillValid(user);
    if (!still.ok) return res.status(401).json({ error: still.reason });

    if (req.method === "GET") {
      const id = String(req.query.id || "");
      if (!ID_RE.test(id)) return res.status(400).json({ error: "bad-id" });
      const { data, error, status } = await db()
        .from("voice_clips")
        .select("mime, data")
        .eq("id", id)
        .eq("household_id", user.household)
        .maybeSingle();
      if (error) throw Object.assign(error, { status });
      if (!data) return res.status(404).json({ error: "not-found" });
      const buf = Buffer.from(data.data, "base64");
      const base = String(data.mime || "audio/webm").split(";")[0].trim().toLowerCase();
      res.setHeader("Content-Type", base);
      res.setHeader("Content-Length", String(buf.length));
      if (req.query.download === "1") {
        const ext = EXT[base.split("/")[1]] || "webm";
        res.setHeader("Content-Disposition", `attachment; filename="kcare-voice-${id.slice(3, 15)}.${ext}"`);
      }
      // res.send 는 버퍼를 통째로 글자로 바꿔 ETag 를 만든다 (2MB 녹음이면 수 MB) — 그대로 흘려보낸다
      res.statusCode = 200;
      return res.end(buf);
    }

    if (req.method === "POST") {
      if (!sameSiteJson(req)) return res.status(415).json({ error: "json-only" });
      if (uploads(String(user.id || user.email || "?"))) return res.status(429).json({ error: "too-many" });
      const { mime, secs, data } = req.body || {};
      const m = String(mime || "").trim();
      const s = Math.round(Number(secs));
      if (!MIME_RE.test(m) || !Number.isFinite(s) || s < 1 || s > MAX_SECS || typeof data !== "string") {
        return res.status(400).json({ error: "invalid-request" });
      }
      if (data.length > MAX_B64) return res.status(413).json({ error: "too-large" });
      if (!B64_RE.test(data)) return res.status(400).json({ error: "invalid-request" });
      const bytes = Buffer.byteLength(data, "base64");
      if (bytes < 200) return res.status(400).json({ error: "invalid-request" });

      const id = `vc_${crypto.randomBytes(16).toString("base64url")}`;
      const row = { id, household_id: user.household, account_id: String(user.id || "").slice(0, 120) || null, mime: m.slice(0, 60), secs: s, bytes, data };
      let ins = await db().from("voice_clips").insert(row);
      // 가구 행이 없다(관리자가 SQL 로 가구를 지운 뒤 켜 둔 폰) — 행을 다시 만들고 한 번 더
      if (ins.error && String(ins.error.code) === "23503") {
        await ensureHousehold(user.household);
        ins = await db().from("voice_clips").insert(row);
      }
      if (ins.error) throw Object.assign(ins.error, { status: ins.status });

      // 오래된 목소리 정리 — 30일 지난 것, 그리고 가구 한도(40MB)를 넘는 오래된 것. 실패해도 저장은 성공으로 답한다
      try {
        const cutoff = new Date(Date.now() - KEEP_DAYS * 86400000).toISOString();
        await db().from("voice_clips").delete().eq("household_id", user.household).lt("created_at", cutoff);
        const { data: rows } = await db()
          .from("voice_clips")
          .select("id, bytes")
          .eq("household_id", user.household)
          .order("created_at", { ascending: false })
          .limit(2000);
        let total = 0;
        const drop = [];
        for (const r of rows || []) {
          total += Number(r.bytes) || 0;
          if (total > HOUSEHOLD_CAP_BYTES && r.id !== id) drop.push(r.id);
        }
        if (drop.length) await db().from("voice_clips").delete().eq("household_id", user.household).in("id", drop.slice(0, 100)); // 주소 길이 때문에 한 번에 100개 — 남은 것은 다음 저장 때
      } catch (_) {
        /* 다음 저장 때 다시 지운다 */
      }
      return res.status(201).json({ id });
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "method-not-allowed" });
  } catch (e) {
    const code = dbErrorCode(e);
    console.error("[voice]", code);
    return res.status(code === "schema-missing" ? 503 : 502).json({ error: code });
  }
}
