"use client";
/**
 * 화면 어디서든 결과를 알리는 토스트.
 *
 * 왜 필요한가: 버튼을 눌러도 아무 반응이 없어 눌린 건지 안 눌린 건지 알 수 없다는
 * 신고가 반복됐다(2026-09-08). 서명 팝업이 뜨기 전 공백, 서버 왕복 중 정지, 성공했는데
 * 아무 말 없이 끝나는 경우가 섞여 있었다. 결과를 말하지 않는 화면은 사용자가 같은
 * 버튼을 여러 번 누르게 만들고, 그게 중복 트랜잭션으로 이어진다.
 *
 * 컴포넌트마다 상태를 들고 다니지 않도록 전역 이벤트로 띄운다 - 어떤 코드에서든
 * toast.ok("…") 한 줄이면 된다.
 */
import { useEffect, useState } from "react";

export type ToastKind = "ok" | "err" | "info";
interface Item { id: number; kind: ToastKind; text: string }

const EVENT = "wlbn-toast";
let seq = 0;

function emit(kind: ToastKind, text: string) {
  if (typeof window === "undefined" || !text) return;
  window.dispatchEvent(new CustomEvent<Item>(EVENT, { detail: { id: ++seq, kind, text } }));
}

export const toast = {
  ok: (text: string) => emit("ok", text),
  err: (text: string) => emit("err", text),
  info: (text: string) => emit("info", text),
};

const ICON: Record<ToastKind, string> = { ok: "✓", err: "!", info: "…" };

export default function ToastHost() {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    const on = (e: Event) => {
      const it = (e as CustomEvent<Item>).detail;
      setItems((v) => [...v, it]);
      /* 오류는 읽는 데 시간이 더 걸린다 - 성공보다 오래 남긴다. */
      const ms = it.kind === "err" ? 7000 : 3500;
      setTimeout(() => setItems((v) => v.filter((x) => x.id !== it.id)), ms);
    };
    window.addEventListener(EVENT, on);
    return () => window.removeEventListener(EVENT, on);
  }, []);

  if (!items.length) return null;
  return (
    <div className="toast-host" role="status" aria-live="polite">
      {items.map((it) => (
        <div key={it.id} className={`toast ${it.kind}`} onClick={() => setItems((v) => v.filter((x) => x.id !== it.id))}>
          <span className="toast-ico">{ICON[it.kind]}</span>
          <span>{it.text}</span>
        </div>
      ))}
    </div>
  );
}
