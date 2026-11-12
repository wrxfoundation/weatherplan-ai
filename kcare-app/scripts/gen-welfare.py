#!/usr/bin/env python3
"""
복지혜택 정책 DB → lib/welfare-data.js

입력: 실무진이 준 'KCARE 복지혜택 DB 3.xlsx' (2026-09-04 검증본).
  01_정책마스터  정책 79건 (이름·지역·분류·지원내용·요건 원문·가치·신청 경로·출처·검증)
  02_지원자격    같은 79건의 매칭용 구조화 필드 (연령·소득·자격 플래그)
  04_정책분류    32개 분류
출력: lib/welfare-data.js — 손으로 옮기지 않는다. 시트가 바뀌면 이 스크립트를 다시 돌린다.

  python3 scripts/gen-welfare.py <xlsx 경로>

매칭 공식(06_고객매칭테스트)은 lib/welfare.js 에 코드로 옮겨 두었다 — 여기서는 데이터만 뽑는다.
"""
import json, sys, datetime, warnings
warnings.filterwarnings("ignore")
import openpyxl

src = sys.argv[1]
wb = openpyxl.load_workbook(src, data_only=True)

def rows(ws, header_row=1):
    rs = list(ws.iter_rows(values_only=True))
    hdr = [str(h).strip() if h is not None else "" for h in rs[header_row]]
    out = []
    for r in rs[header_row + 1:]:
        if not any(c is not None and str(c).strip() for c in r):
            continue
        out.append({hdr[i]: r[i] for i in range(len(hdr)) if hdr[i]})
    return out

def s(v):
    if v is None: return ""
    if isinstance(v, (datetime.datetime, datetime.date)): return v.strftime("%Y-%m-%d")
    if isinstance(v, float) and v.is_integer(): return str(int(v))
    return str(v).strip()

def yn(v):
    return s(v).upper() == "Y"

def num(v):
    v = s(v)
    return int(float(v)) if v else None

master = rows(wb["01_정책마스터"])
elig = {r["정책ID"]: r for r in rows(wb["02_지원자격"])}
cats = rows(wb["04_정책분류"])

sources = []
def src_idx(url):
    url = s(url)
    if url not in sources:
        sources.append(url)
    return sources.index(url)

policies = []
for i, m in enumerate(master):
    e = elig[m["정책ID"]]
    policies.append({
        "id": s(m["정책ID"]),
        "row": i,  # 시트 행 순서 — 정렬키 마지막 자리(ROW()/100000)에 쓴다
        "name": s(m["정책명"]),
        "level": s(m["정책수준"]),
        "sido": s(m["시도"]),
        "sigungu": s(m["시군구"]),
        "cat": s(m["대분류"]),
        "summary": s(m["지원내용 요약"]),
        "req": s(m["지원요건 원문"]),
        "value": s(m["지원금액·서비스가치"]),
        "apply": s(m["신청방법"]),
        "org": s(m["신청기관"]),
        "contact": s(m["연락처"]),
        "source": src_idx(m["공식출처"]),  # WELFARE_SOURCES 의 인덱스 — 같은 URL 이 49번 반복돼서
        "confidence": s(m["검증신뢰도"]),
        "free": s(m["무료여부"]),
        "elig": {
            "minAge": num(e["최소연령"]),
            "maxAge": num(e["최대연령"]),
            "incomePct": num(e["중위소득%이하"]),
            "basic": yn(e["기초수급"]),
            "nearPoor": yn(e["차상위"]),
            "pension": yn(e["기초연금"]),
            "alone": yn(e["독거"]),
            "couple": yn(e["노인부부"]),
            "disabled": yn(e["장애"]),
            "dementia": yn(e["치매"]),
            "ltc": yn(e["장기요양"]),
            "mobility": yn(e["거동불편"]),
            "noHome": yn(e["무주택"]),
            "ownHome": yn(e["주택보유"]),
            "residence": yn(e["거주지필수"]),
            "careNeed": yn(e["돌봄필요"]),
            "chronic": yn(e["만성질환"]),
            "crisis": yn(e["위기사유"]),
            "structured": s(e["판별완성도"]),
        },
    })

categories = [{"code": s(c["분류코드"]), "name": s(c["대분류"]), "path": s(c["우선연결 원칙"])} for c in cats]

def js(obj):
    return json.dumps(obj, ensure_ascii=False, indent=1)

verified = s(master[0]["최종검증일"])
recheck = s(master[0]["다음재확인일"])
out = f"""// 복지혜택 정책 DB — scripts/gen-welfare.py 가 만든 파일. 손으로 고치지 않는다.
// 출처: KCARE 복지혜택 DB 3 (실무진 · 최종검증일 {verified} · 다음 재확인 {recheck})
// 정책 {len(policies)}건 · 분류 {len(categories)}개 · 출처 URL {len(sources)}개. 매칭 공식은 lib/welfare.js.
//
// 신청기간 · 본인부담 · 지원기간 · 중복수혜 제한 · 수동확인필드 · 검증일은 79건 전부 같은
// 값이라 여기 넣지 않고 lib/welfare.js 의 WELFARE_COMMON 에 한 번만 둔다.
// source 는 WELFARE_SOURCES 의 인덱스다 (복지로 안내서 URL 하나가 49건에 반복된다).
/* eslint-disable */
export const WELFARE_POLICIES = {js(policies)};

export const WELFARE_CATEGORIES = {js(categories)};

export const WELFARE_SOURCES = {js(sources)};
"""
dst = "lib/welfare-data.js"
open(dst, "w").write(out)
print(f"{dst}: {len(policies)} policies, {len(categories)} categories, {len(out)} bytes")
