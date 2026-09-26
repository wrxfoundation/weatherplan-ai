/* 검사 스크립트 실행 진입점 (9/8)

   node 22 에서 `--import ./tools/ts-resolve.mjs` 는 훅을 등록하지 않는다 — 모듈을 실행만
   한다. 그래서 lib/report.ts 안의 "./cs" 같은 확장자 없는 임포트가 풀리지 않아
   report-check 만 ERR_MODULE_NOT_FOUND 로 죽었다(ask-check 는 .ts 를 직접 적어서 살았다).
   `--loader` 는 되지만 폐기 예고 상태라, 여기서 register() 로 정식 등록한다.

     node --import ./tools/ts-hooks.mjs tools/report-check.mts
     npm run check   (셋 다) */
import { register } from "node:module";
register("./ts-resolve.mjs", import.meta.url);
