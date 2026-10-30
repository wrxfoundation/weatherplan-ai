// 화면 위쪽 '데모 홈' 자리 — 테스트 계정으로 들어왔으면 누구로 로그인했는지와 저장 상태 점을 보여 주고
// 계정 화면(/login: 저장 위치 · 로그아웃)으로 보낸다. 폰 여러 대로 테스트할 때 지금 어느 계정인지
// 화면마다 알 수 있게 (2026-09-30 점검). 데모면 예전처럼 '데모 홈'.
import Link from "next/link";
import { useAuth } from "../lib/auth";
import { useSync } from "../lib/state";
import { AREAS, areaOfRole } from "../lib/centers";

// compact — 머리줄이 빽빽한 화면(컨시어지)에서는 이름 대신 '● 계정'만 (이름은 읽어 주는 이름표에 남긴다)
export default function ModeLink({ className = "", compact = false }) {
  const auth = useAuth();
  const sync = useSync();
  const u = auth.user;
  if (!u?.household) {
    return (
      <Link href="/" className={`${className} text-muted/50`}>
        데모 홈
      </Link>
    );
  }
  const ok = sync.mode === "server" && sync.status !== "error";
  return (
    // 자기 영역 입구의 계정 화면으로 — 컨시어지 · 영업은 현장 · 영업 로그인, 관제는 관제 로그인 (2026-10-06 UX 점검)
    <Link href={AREAS[areaOfRole(u.role)]?.login || "/login"} className={`${className} text-navy`} aria-label={`${u.name} · ${ok ? "서버에 저장 중" : "저장 확인 필요"} — 계정 보기`}>
      <span aria-hidden className={`mr-1.5 inline-block h-[8px] w-[8px] shrink-0 rounded-full ${ok ? "bg-green" : "bg-amber"}`} />
      {compact ? "계정" : u.name}
    </Link>
  );
}
