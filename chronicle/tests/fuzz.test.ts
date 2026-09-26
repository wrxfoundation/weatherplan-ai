/**
 * 시드 고정 퍼지 시뮬레이션 — 수십 일치 무작위 생성/변경/삭제를 돌리며
 * 매일 3가지 불변식을 검사한다:
 *
 *   1. 해시체인이 제네시스부터 전수 검증을 통과한다
 *   2. latest.json ≡ 원장 재생(replayRecords) — diff·머지·재생 경로의 일치
 *      (필드 삭제는 이벤트에서 after=null로 기록되므로 null≡부재로 정규화 비교)
 *   3. 같은 상태로 즉시 재실행하면 아무것도 쓰지 않는다 (수렴)
 *
 * 마지막으로 같은 시드로 처음부터 다시 돌려 산출물이 바이트 단위로 동일한지
 * (결정성) 확인한다. 값 풀에는 한글·이모지·제어문자·"__proto__" 필드명·중첩
 * 구조·특수 숫자·undefined를 섞는다.
 */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { verifyChainLines, type IntegrityState } from "../engine/integrity.js";
import { runOnce } from "../engine/pipeline.js";
import { replayRecords } from "../engine/recover.js";
import type { ChangeEvent, NormalizedRecord, SourceAdapter, SourceConfig } from "../engine/types.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FIELD_NAMES = ["HOUSE_NM", "PRICE", "__proto__", "constructor", "toString", "값", "nested", "arr"];
const VALUES: unknown[] = [
  "서울숲 리버뷰 자이",
  "한글과 emoji 🏠 조합",
  '태그<script>와 "따옴표\'',
  "제어문자포함",
  0,
  -0,
  1e21,
  123.456,
  null,
  undefined,
  true,
  { deep: { z: 1, a: [1, 2, { b: "c" }] } },
  ["가", 2, null],
  "",
];

function randomOf<T>(rand: () => number, pool: T[]): T {
  return pool[Math.floor(rand() * pool.length)];
}

function randomFields(rand: () => number): Record<string, unknown> {
  const fields: Record<string, unknown> = {};
  const count = 1 + Math.floor(rand() * 5);
  for (let i = 0; i < count; i++) {
    Object.defineProperty(fields, randomOf(rand, FIELD_NAMES), {
      value: randomOf(rand, VALUES),
      enumerable: true,
      writable: true,
      configurable: true,
    });
  }
  return fields;
}

/** null 값 필드와 부재 필드를 동일 취급하는 정규화 (재생 경로는 삭제를 null로 남긴다). */
function dropNulls(fields: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(fields).filter(([, value]) => value !== null));
}

function snapshotOf(map: Map<string, NormalizedRecord>): Map<string, Record<string, unknown>> {
  return new Map([...map.entries()].map(([id, record]) => [id, dropNulls(record.fields)]));
}

interface DayResult {
  changes: string;
  integrity: string;
  latest: string;
}

async function simulate(seed: number, days: number): Promise<DayResult> {
  const rand = mulberry32(seed);
  const dataDir = mkdtempSync(join(tmpdir(), `chronicle-fuzz-${seed}-`));
  const sourceDir = join(dataDir, "fuzz");
  const config: SourceConfig = { id: "fuzz", family: "api-records", title: "퍼지", max_removal_ratio: 1 };

  // 우주(universe): 소스의 "현재 진실" — 매일 무작위로 진화한다
  // (0일차부터 산출물이 존재하도록 레코드 하나로 시작)
  const universe = new Map<string, Record<string, unknown>>([["e:0", { HOUSE_NM: "시드" }]]);
  let nextId = 1;

  const adapter: SourceAdapter = {
    id: "fuzz",
    family: "api-records",
    collect: async () => ({
      raw: { size: universe.size },
      records: [...universe.entries()].map(([entityId, fields]) => ({
        entityId,
        sourceUrl: `https://example.com/${encodeURIComponent(entityId)}`,
        fields: { ...fields },
      })),
    }),
  };

  const run = (isoNow: string) =>
    runOnce({ sourceId: "fuzz", root, dataDir, adapter, config, now: () => new Date(isoNow), log: () => {} });

  for (let day = 0; day < days; day++) {
    // 우주 돌연변이: 생성 0~3, 변경 0~3, 삭제 0~2 (가끔 완전 무변경일)
    if (rand() > 0.15) {
      const adds = Math.floor(rand() * 4);
      for (let i = 0; i < adds; i++) universe.set(`e:${nextId++}`, randomFields(rand));
      const ids = [...universe.keys()];
      const updates = Math.floor(rand() * 4);
      for (let i = 0; i < updates && ids.length > 0; i++) {
        const id = randomOf(rand, ids);
        const fields = { ...universe.get(id)!, ...randomFields(rand) };
        universe.set(id, fields);
      }
      const removes = Math.floor(rand() * 3);
      for (let i = 0; i < removes && universe.size > 1; i++) {
        universe.delete(randomOf(rand, [...universe.keys()]));
      }
    }

    const isoNow = new Date(Date.UTC(2026, 6, 1 + day, 5)).toISOString();
    await run(isoNow);

    // 불변식 1: 체인 전수 검증
    const lines = readFileSync(join(sourceDir, "changes.jsonl"), "utf8")
      .split("\n")
      .filter((line) => line.trim() !== "");
    const integrity = JSON.parse(readFileSync(join(sourceDir, "integrity.json"), "utf8")) as IntegrityState;
    const verified = verifyChainLines(lines, integrity);
    assert.equal(verified.ok, true, `seed=${seed} day=${day}: ${verified.errors.join("; ")}`);

    // 불변식 2: latest ≡ 원장 재생
    const events = lines.map((line) => JSON.parse(line) as ChangeEvent);
    const latest = JSON.parse(readFileSync(join(sourceDir, "latest.json"), "utf8"));
    const fromLatest = new Map<string, Record<string, unknown>>(
      Object.entries(latest.records as Record<string, { fields: Record<string, unknown> }>).map(([id, r]) => [
        id,
        dropNulls(r.fields),
      ]),
    );
    assert.deepEqual(fromLatest, snapshotOf(replayRecords(events)), `seed=${seed} day=${day}: latest≠재생`);
    assert.equal(latest.record_count, universe.size, `seed=${seed} day=${day}: record_count`);

    // 불변식 3: 같은 상태 재실행은 무기록 (수렴 — undefined/Date 등 유령 이벤트 없음)
    const rerun = await run(new Date(Date.UTC(2026, 6, 1 + day, 6)).toISOString());
    assert.equal(rerun.wrote, false, `seed=${seed} day=${day}: 재실행이 유령 이벤트를 봉인함`);
  }

  return {
    changes: readFileSync(join(sourceDir, "changes.jsonl"), "utf8"),
    integrity: readFileSync(join(sourceDir, "integrity.json"), "utf8"),
    latest: readFileSync(join(sourceDir, "latest.json"), "utf8"),
  };
}

test("퍼지 30일 × 시드 3종: 체인·재생 일치·수렴 불변식", async () => {
  for (const seed of [1, 42, 20260709]) {
    await simulate(seed, 30);
  }
});

test("결정성: 같은 시드는 바이트 단위로 같은 산출물을 만든다", async () => {
  const first = await simulate(7, 12);
  const second = await simulate(7, 12);
  assert.equal(first.changes, second.changes);
  assert.equal(first.integrity, second.integrity);
  assert.equal(first.latest, second.latest);
});
