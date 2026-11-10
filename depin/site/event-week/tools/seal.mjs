// 표준 입력의 JSON 을 EVENT_PASS 로 잠근다 — PBKDF2-SHA256 → AES-256-GCM (브라우저 WebCrypto 로 연다).
// build.py 가 부른다. 비밀번호는 환경변수로만 받고 어디에도 쓰지 않는다.
import { pbkdf2Sync, randomBytes, createCipheriv } from "node:crypto";

const pass = process.env.EVENT_PASS || "";
if (pass.length < 10) {
  console.error("EVENT_PASS 가 너무 짧다");
  process.exit(1);
}
const chunks = [];
for await (const c of process.stdin) chunks.push(c);
const plain = Buffer.concat(chunks);

const it = 250000;
const salt = randomBytes(16);
const iv = randomBytes(12);
const key = pbkdf2Sync(Buffer.from(pass, "utf8"), salt, it, 32, "sha256");
const cipher = createCipheriv("aes-256-gcm", key, iv);
const ct = Buffer.concat([cipher.update(plain), cipher.final(), cipher.getAuthTag()]);

process.stdout.write(JSON.stringify({ v: 1, it, s: salt.toString("base64"), iv: iv.toString("base64"), ct: ct.toString("base64") }));
