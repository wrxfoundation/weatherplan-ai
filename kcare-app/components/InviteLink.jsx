// 가족 초대 링크 (2026-10-14 현장 '연동 확인' 4번) — 어르신 가족 탭 · 보호자 마이 탭이 같이 쓴다.
// 관제 센터에 회원으로 가입한 사람만 만들 수 있다 (pages/api/invite.js). 링크를 받은 자녀는 가입 코드 없이
// 그 센터에 보호자로 가입 신청하고, 센터 관제가 승인하면 로그인된다. 7일 · 링크 하나로 5명까지.
// 보내기는 휴대폰 공유창(카카오톡 · 문자)을 쓰고, 공유창이 없는 기기는 주소를 복사한다.
import { useState } from "react";
import { Line } from "./clay";
import { TONE, solid } from "./ds";

const ERR = {
  "not-member": "가입 코드로 회원 가입한 아이디에서만 초대 링크를 만들 수 있습니다.",
  "too-many": "잠시 뒤 다시 만들어 주세요.",
  "login-required": "로그인이 만료됐습니다. 다시 로그인해 주세요.",
};

export default function InviteLink({ variant = "guardian", fromName = "" }) {
  const elder = variant === "elder";
  const [state, setState] = useState("idle"); // idle | making | ready | error
  const [link, setLink] = useState(null); // { url, exp, uses }
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const make = async () => {
    setState("making");
    setError(null);
    try {
      const r = await fetch("/api/invite", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.url) throw Object.assign(new Error("invite"), { code: j.error || `http-${r.status}` });
      setLink(j);
      setState("ready");
    } catch (e) {
      setError(e.code || "network");
      setState("error");
    }
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (_) {
      // 복사가 막힌 브라우저 — 주소 칸을 골라 둔다 (길게 눌러 복사)
      document.getElementById("invite-url")?.select();
    }
  };
  const share = async () => {
    const text = `${fromName ? `${fromName} 님이 ` : ""}K-CARE 가족으로 초대합니다. 아래 링크에서 보호자로 가입해 주세요.`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "K-CARE 가족 초대", text, url: link.url });
        return;
      } catch (e) {
        if (e?.name === "AbortError") return; // 공유창을 닫았다
      }
    }
    copy();
  };

  // 2026-10-15 시안 — 초록 3D 버튼 (가족 화면 '부 보호자 초대 링크 만들기') · 흰 3D 보조 버튼
  const big = elder ? "text-[17px]" : "text-[15px]";
  const btn = elder
    ? "ds-press ds-btn3d flex w-full min-h-[64px] items-center justify-center gap-2 rounded-[22px] text-[19px]"
    : "ds-press ds-btn3d flex w-full min-h-[54px] items-center justify-center gap-1.5 rounded-[18px] text-[16px]";
  const white = { background: "#FFFFFF", boxShadow: "0 4px 0 #E3DED3", color: "#1B2340" };

  if (state === "ready" && link) {
    const until = new Date(link.exp).toLocaleDateString("ko-KR", { month: "long", day: "numeric" });
    return (
      <div>
        <label htmlFor="invite-url" className={`block font-extrabold ${elder ? "text-[17px]" : "text-[14px]"}`} style={{ color: TONE.green.fg }}>
          초대 링크 — {until}까지 · {link.uses}명까지
        </label>
        <input
          id="invite-url"
          readOnly
          value={link.url}
          onFocus={(e) => e.target.select()}
          className={`mt-1.5 w-full rounded-[14px] border-2 bg-white px-3 py-2.5 ${elder ? "text-[15px]" : "text-[13px]"}`}
          style={{ borderColor: "#E3DED3", color: "#1B2340" }}
        />
        {/* 어르신 화면은 버튼을 위아래로 — 옆으로 두 개면 큰 글씨가 두 줄로 꺾인다 */}
        <div className={`mt-2.5 grid gap-2 ${elder ? "grid-cols-1" : "grid-cols-2"}`}>
          <button type="button" onClick={share} className={btn} style={solid("green", 4)}>
            <Line name="chat" size={elder ? 22 : 18} />
            {elder ? "자녀에게 보내기" : "가족에게 보내기"}
          </button>
          <button type="button" onClick={copy} className={btn} style={white}>
            {copied ? "복사했습니다" : "주소 복사"}
          </button>
        </div>
        <p className={`mt-2 leading-[1.55] ${elder ? "text-[16px]" : "text-[13px]"}`} style={{ color: "#5E6270" }} role="status">
          {copied ? "복사했습니다 — 카카오톡이나 문자에 붙여 넣어 보내세요. " : ""}자녀가 링크에서 가입하면 관제가 확인한 뒤 함께 보실 수 있습니다.
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className={`leading-[1.6] ${big}`} style={{ color: "#3A3F50" }}>
        {elder
          ? "자녀에게 링크를 보내면, 자녀가 그 링크로 보호자 가입을 합니다. 가입 코드는 필요 없습니다."
          : "링크를 받은 가족은 가입 코드 없이 이 센터에 보호자로 가입 신청합니다 (관제 승인 뒤 사용)."}
      </p>
      <button
        type="button"
        onClick={make}
        disabled={state === "making"}
        className={`${btn} mt-3 disabled:opacity-60`}
        style={solid("green", 5)}
      >
        {state === "making" ? "만드는 중…" : elder ? "자녀 초대 링크 만들기" : "부 보호자 초대 링크 만들기"}
      </button>
      {state === "error" && (
        <p role="alert" className={`mt-2 font-bold leading-[1.55] ${elder ? "text-[17px]" : "text-[13px]"}`} style={{ color: TONE.gold.fg }}>
          {ERR[error] || "링크를 만들지 못했습니다. 잠시 뒤 다시 해 주세요."}
        </p>
      )}
    </div>
  );
}
