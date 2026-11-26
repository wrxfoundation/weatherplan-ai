// 앱-도메인 연결 (Digital Asset Links) — https://kcarelife.com/.well-known/assetlinks.json 으로 나간다 (next.config.js rewrites).
// (2026-11-26 구글 플레이 준비) 구글 플레이 앱(TWA)은 이 파일로 "이 앱과 이 사이트의 주인이 같다"를 확인한다.
// 확인되면 주소창 없이 앱처럼 뜨고, 확인되지 않으면 주소창이 보이는 브라우저 탭으로 뜬다.
//
// 값은 환경변수로 넣는다 (Vercel → Settings → Environment Variables → 넣은 뒤 Redeploy):
//   ANDROID_PACKAGE_NAME          앱 패키지 이름 (예: com.kcarelife.app) — 앱을 만들 때 정한 것과 글자 하나까지 같아야 한다
//   ANDROID_SHA256_FINGERPRINTS   서명 인증서 SHA-256 지문. 여러 개면 쉼표나 줄바꿈으로 나눈다.
//                                 ① Play Console › 앱 무결성 › 앱 서명 › '앱 서명 키 인증서'의 SHA-256 (스토어에서 받은 앱이 쓰는 키 — 꼭 필요)
//                                 ② 업로드 키의 SHA-256 (직접 설치해 시험할 때)
// 비밀 값이 아니다 — 지문과 패키지 이름은 공개돼도 되는 값이다. 값이 없으면 404 로 답한다 (연결 전).
const PKG = /^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*)+$/;
const PRINT = /^([0-9A-F]{2}:){31}[0-9A-F]{2}$/;

export function assetLinks(env = process.env) {
  const pkg = String(env.ANDROID_PACKAGE_NAME || "").trim();
  const prints = [
    ...new Set(
      String(env.ANDROID_SHA256_FINGERPRINTS || "")
        .split(/[\s,;]+/)
        .map((s) => s.trim().toUpperCase())
        .filter((s) => PRINT.test(s))
    ),
  ];
  if (!PKG.test(pkg) || !prints.length) return null;
  return [
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: { namespace: "android_app", package_name: pkg, sha256_cert_fingerprints: prints },
    },
  ];
}

export default function handler(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    return res.status(405).json({ error: "method-not-allowed" });
  }
  const links = assetLinks();
  if (!links) return res.status(404).json({ error: "not-configured" });
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=300");
  return res.status(200).send(JSON.stringify(links));
}
