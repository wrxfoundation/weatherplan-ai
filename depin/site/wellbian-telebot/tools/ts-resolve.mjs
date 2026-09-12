/* 확장자 없는 상대 임포트를 .ts 로 이어준다 — 원본을 그대로 시험하기 위해서다(사본 금지) */
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve as rp } from "node:path";
export async function resolve(spec, ctx, next) {
  if (spec.startsWith(".") && !/\.[a-z]+$/i.test(spec) && ctx.parentURL?.startsWith("file:")) {
    const p = rp(dirname(fileURLToPath(ctx.parentURL)), spec) + ".ts";
    if (existsSync(p)) return next(pathToFileURL(p).href, ctx);
  }
  return next(spec, ctx);
}
