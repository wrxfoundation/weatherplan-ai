/**
 * 테스트 공용 도우미 — odcloud(공공데이터포털) API 에뮬레이터.
 * 실제 네트워크 없이 페이지네이션·cond 필터·인증 헤더까지 흉내내
 * 어댑터와 파이프라인을 통째로 굴릴 수 있게 한다.
 */
import type { HttpClient } from "../engine/types.js";

/** pathname 마지막 조각(오퍼레이션명) → 전체 행 목록. */
export type OdcloudDatasets = Record<string, Record<string, unknown>[]>;

export function odcloudEmulator(datasets: () => OdcloudDatasets): HttpClient {
  async function json(url: string, init?: RequestInit): Promise<unknown> {
    const auth = new Headers(init?.headers).get("authorization");
    if (!auth || !auth.startsWith("Infuser ")) {
      throw new Error(`HTTP 401 Unauthorized — Infuser 키 없음: ${url}`);
    }
    const parsed = new URL(url);
    const operation = parsed.pathname.split("/").pop() ?? "";
    const rows = datasets()[operation];
    if (!rows) throw new Error(`HTTP 404 Not Found — 알 수 없는 오퍼레이션: ${operation}`);

    let filtered = rows;
    for (const [key, value] of parsed.searchParams.entries()) {
      const match = key.match(/^cond\[(.+)::(GTE|EQ)\]$/);
      if (!match) continue;
      const [, field, op] = match;
      filtered = filtered.filter((row) =>
        op === "GTE" ? String(row[field] ?? "") >= value : String(row[field] ?? "") === value,
      );
    }

    const page = Number(parsed.searchParams.get("page") ?? 1);
    const perPage = Number(parsed.searchParams.get("perPage") ?? 10);
    const data = filtered.slice((page - 1) * perPage, page * perPage);
    return {
      currentCount: data.length,
      data,
      // odcloud 실제 의미: matchCount = cond 필터 적용 후 건수,
      // totalCount = 필터 무관한 전체 데이터셋 크기.
      matchCount: filtered.length,
      page,
      perPage,
      totalCount: rows.length,
    };
  }

  return {
    json,
    text: async () => {
      throw new Error("odcloudEmulator: text()는 지원하지 않음");
    },
    raw: async () => {
      throw new Error("odcloudEmulator: raw()는 지원하지 않음");
    },
  };
}
