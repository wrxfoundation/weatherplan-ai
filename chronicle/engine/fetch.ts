/**
 * HTTP 호출: 재시도(지수 백오프+지터) · 타임아웃 · 레이트리밋 (PLAN.md §0 fetch.ts).
 *
 * transport를 주입할 수 있어 테스트에서는 실제 네트워크 없이 픽스처로 대체한다.
 */
import type { HttpClient } from "./types.js";

export interface HttpClientOptions {
  /** 실패 시 재시도 횟수 (첫 시도 제외). */
  retries?: number;
  /** 백오프 기준 지연(ms) — attempt마다 ×2, ±25% 지터. */
  baseDelayMs?: number;
  timeoutMs?: number;
  /** 이 클라이언트를 거치는 요청 간 최소 간격(ms) — 공공 API 예의. */
  minIntervalMs?: number;
  /** Retry-After 헤더를 존중하되 이 값(ms)을 상한으로 — 서버가 수 시간을 지시해도 무한정 잠들지 않는다. */
  maxRetryAfterMs?: number;
}

export type Transport = (url: string, init?: RequestInit) => Promise<Response>;

const RETRYABLE_STATUS = new Set([408, 429, 500, 502, 503, 504]);

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** undici의 "fetch failed"는 원인을 cause에 숨긴다 — 진단 가능하게 풀어쓴다. */
function describeError(error: unknown): string {
  if (error instanceof Error) {
    const cause = (error as { cause?: unknown }).cause;
    if (cause instanceof Error) return `${error.message} (원인: ${cause.message})`;
    if (cause) return `${error.message} (원인: ${String(cause)})`;
    return error.message;
  }
  return String(error);
}

export function createHttpClient(
  options: HttpClientOptions = {},
  transport: Transport = (url, init) => fetch(url, init),
): HttpClient {
  const retries = options.retries ?? 4;
  const baseDelayMs = options.baseDelayMs ?? 1000;
  const timeoutMs = options.timeoutMs ?? 30_000;
  const minIntervalMs = options.minIntervalMs ?? 0;
  const maxRetryAfterMs = options.maxRetryAfterMs ?? 60_000;

  let lastRequestAt = 0;

  async function rateGate(): Promise<void> {
    if (minIntervalMs <= 0) return;
    const wait = lastRequestAt + minIntervalMs - Date.now();
    if (wait > 0) await sleep(wait);
    lastRequestAt = Date.now();
  }

  async function request(url: string, init?: RequestInit): Promise<Response> {
    let lastError: unknown;
    for (let attempt = 0; attempt <= retries; attempt++) {
      if (attempt > 0) {
        const backoff = baseDelayMs * 2 ** (attempt - 1);
        const jitter = backoff * 0.25 * (Math.random() * 2 - 1);
        await sleep(Math.max(0, Math.round(backoff + jitter)));
      }
      await rateGate();
      try {
        const response = await transport(url, {
          ...init,
          signal: init?.signal ?? AbortSignal.timeout(timeoutMs),
        });
        if (response.ok) return response;
        if (RETRYABLE_STATUS.has(response.status) && attempt < retries) {
          const retryAfter = Number(response.headers.get("retry-after"));
          if (Number.isFinite(retryAfter) && retryAfter > 0) {
            await sleep(Math.min(retryAfter * 1000, maxRetryAfterMs));
          }
          lastError = new Error(`HTTP ${response.status} ${response.statusText} — ${url}`);
          continue;
        }
        const excerpt = (await response.text().catch(() => "")).slice(0, 300);
        throw new Error(`HTTP ${response.status} ${response.statusText} — ${url}\n${excerpt}`);
      } catch (error) {
        if (error instanceof Error && error.message.startsWith("HTTP ") && !RETRYABLE_STATUS.has(Number(error.message.slice(5, 8)))) {
          throw error; // 4xx 등 비재시도 오류는 그대로 전파
        }
        lastError = error;
        if (attempt === retries) break;
      }
    }
    throw new Error(`요청 실패 (${retries + 1}회 시도): ${url} — ${describeError(lastError)}`);
  }

  /**
   * probe: 파일/프로브형 계열용 — 4xx도 던지지 않고 최종 Response를 돌려준다.
   * 부재(404)·차단(403) 자체가 관측이기 때문. 네트워크 오류·5xx는 여전히 재시도.
   */
  async function probe(url: string, init?: RequestInit): Promise<Response> {
    let lastError: unknown;
    for (let attempt = 0; attempt <= retries; attempt++) {
      if (attempt > 0) {
        const backoff = baseDelayMs * 2 ** (attempt - 1);
        const jitter = backoff * 0.25 * (Math.random() * 2 - 1);
        await sleep(Math.max(0, Math.round(backoff + jitter)));
      }
      await rateGate();
      try {
        const response = await transport(url, { ...init, signal: init?.signal ?? AbortSignal.timeout(timeoutMs) });
        if (RETRYABLE_STATUS.has(response.status) && attempt < retries) {
          lastError = new Error(`HTTP ${response.status} — ${url}`);
          continue;
        }
        return response; // 2xx·3xx·4xx 모두 최종 관측으로 반환
      } catch (error) {
        lastError = error;
        if (attempt === retries) break;
      }
    }
    throw new Error(`프로브 실패 (${retries + 1}회 시도): ${url} — ${describeError(lastError)}`);
  }

  return {
    raw: request,
    probe,
    async json(url, init) {
      const response = await request(url, init);
      return response.json();
    },
    async text(url, init) {
      const response = await request(url, init);
      return response.text();
    },
  };
}
