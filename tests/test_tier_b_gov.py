"""Phase 2 Tier B — government sources (국가유산청→heritage · 심평원→medical · DART→company).

All three ship DORMANT (inert until a data.go.kr / opendart key lands) and are guarded so a wrong /
ambiguous match resolves to a MISS, never a wrong government badge. Parse + guard are pure and tested
offline against fixture responses; the live call only runs where the key is set (GitHub runners)."""

from __future__ import annotations

import asyncio

import pytest

from koreaapi.sources.dart import CORP_CODES, DARTSource, parse_dart
from koreaapi.sources.heritage import HERITAGE_KO, HeritageSource, parse_heritage
from koreaapi.sources.medical import HOSPITALS, MedicalSource, parse_medical

# ---------------------------------------------------------------- heritage (국가유산청 / KHS)

def _khs_xml(name="종묘제례", ccma="국가무형유산", kdcd="17", asno="0056", loc="서울특별시") -> str:
    return (
        "<result><totalCnt>1</totalCnt><item>"
        f"<ccmaName>{ccma}</ccmaName><ccbaMnm1>{name}</ccbaMnm1>"
        f"<ccbaKdcd>{kdcd}</ccbaKdcd><ccbaAsno>{asno}</ccbaAsno><ccsiName>{loc}</ccsiName>"
        "</item></result>"
    )


def test_heritage_parse_attaches_designation_badge():
    out = parse_heritage(_khs_xml(), "heritage:jongmyojerye", ("종묘제례",))
    assert out["name_ko"] == "종묘제례"
    assert out["official_designation"] == "국가무형유산"
    assert out["heritage_id"] == "17-0056"
    assert out["attrs"]["Designation"] == "국가무형유산"
    assert "국가유산청" in out["summary_ko"]


def test_heritage_contains_match_on_full_designation_name():
    # 팔만대장경 is designated as "합천 해인사 대장경판" — the token 대장경판 must match by substring.
    out = parse_heritage(_khs_xml(name="합천 해인사 대장경판", ccma="국보"),
                         "heritage:tripitakakoreana", HERITAGE_KO["heritage:tripitakakoreana"][1])
    assert out["official_designation"] == "국보"


def test_heritage_guard_rejects_unrelated_designation():
    with pytest.raises(ValueError):
        parse_heritage(_khs_xml(name="서울 숭례문"), "heritage:pansori", ("판소리",))


def test_heritage_inert_without_key_and_scoped(monkeypatch):
    monkeypatch.delenv("HERITAGE_API_KEY", raising=False)
    src = HeritageSource()
    with pytest.raises(ValueError, match="HERITAGE_API_KEY"):
        asyncio.run(src.fetch("heritage:pansori", "facts"))
    with pytest.raises(ValueError, match="heritage only"):
        asyncio.run(src.fetch("artist:bts", "facts"))


def test_heritage_every_mapped_entity_is_in_roster():
    from koreaapi.roster import HERITAGE
    assert set(HERITAGE_KO) <= set(HERITAGE)  # no dangling map entry


# ---------------------------------------------------------------- medical (심평원 / HIRA)

def _hira_xml(name="서울대학교병원", cl="상급종합", estb="19780101", addr="서울 종로구", ykiho="JDQ4") -> str:
    return (
        "<response><body><items><item>"
        f"<yadmNm>{name}</yadmNm><clCdNm>{cl}</clCdNm><estbDd>{estb}</estbDd>"
        f"<addr>{addr}</addr><ykiho>{ykiho}</ykiho>"
        "</item></items></body></response>"
    )


def test_medical_parse_attaches_registry_badge():
    out = parse_medical(_hira_xml(), "medical:snuh", ("서울대학교병원",))
    assert out["name_ko"] == "서울대학교병원"
    assert out["attrs"]["Institution type"] == "상급종합"
    assert out["attrs"]["Founded"] == "1978-01-01"
    assert out["hira_id"] == "JDQ4"
    assert "HIRA" in out["summary_en"] and "건강보험심사평가원" in out["summary_ko"]


def test_medical_exact_guard_rejects_sibling_hospital():
    # 강남세브란스병원 CONTAINS 세브란스병원 but must NOT be accepted for medical:severance (exact only).
    with pytest.raises(ValueError):
        parse_medical(_hira_xml(name="강남세브란스병원"), "medical:severance",
                      HOSPITALS["medical:severance"][1])


def test_medical_inert_without_key_and_scoped(monkeypatch):
    monkeypatch.delenv("MEDICAL_API_KEY", raising=False)
    src = MedicalSource()
    with pytest.raises(ValueError, match="MEDICAL_API_KEY"):
        asyncio.run(src.fetch("medical:snuh", "facts"))
    with pytest.raises(ValueError, match="medical only"):
        asyncio.run(src.fetch("place:namsan", "facts"))


def test_medical_every_mapped_entity_is_in_roster():
    from koreaapi.roster import MEDICAL
    assert set(HOSPITALS) <= set(MEDICAL)


# ---------------------------------------------------------------- company (DART / 전자공시)

def _dart_json(status="000", eng="SAMSUNG ELECTRONICS CO,.LTD", ko="삼성전자(주)",
               code="00126380", est="19690113", stock="005930") -> dict:
    return {"status": status, "message": "정상", "corp_code": code, "corp_name": ko,
            "corp_name_eng": eng, "stock_code": stock, "ceo_nm": "한종희",
            "est_dt": est, "adres": "경기도 수원시"}


def test_dart_parse_attaches_disclosure_badge():
    out = parse_dart(_dart_json(), "company:samsung")
    assert out["name_en_official"].startswith("SAMSUNG")
    assert out["dart_corp_code"] == "00126380"
    assert out["attrs"]["Founded"] == "1969-01-13"
    assert out["attrs"]["Stock code"] == "005930"
    assert "DART" in out["summary_en"]


def test_dart_guard_rejects_wrong_company():
    # a mistyped corp_code returns some OTHER firm -> the English-name guard refuses it (miss)
    with pytest.raises(ValueError):
        parse_dart(_dart_json(eng="LG ELECTRONICS INC.", ko="엘지전자(주)"), "company:samsung")


def test_dart_rejects_non_ok_status():
    with pytest.raises(ValueError):
        parse_dart(_dart_json(status="013"), "company:samsung")  # 013 = no data


def test_dart_inert_without_key_and_scoped(monkeypatch):
    monkeypatch.delenv("DART_API_KEY", raising=False)
    src = DARTSource()
    with pytest.raises(ValueError, match="DART_API_KEY"):
        asyncio.run(src.fetch("company:samsung", "facts"))
    with pytest.raises(ValueError, match="companies only"):
        asyncio.run(src.fetch("artist:bts", "facts"))


def test_dart_seed_codes_are_in_roster():
    from koreaapi.roster import COMPANIES
    assert set(CORP_CODES) <= set(COMPANIES)


if __name__ == "__main__":
    raise SystemExit(pytest.main([__file__, "-q"]))
