"""Phase 2 Tier C — extra cross-check sources (RAWG→game · TheSportsDB→sports · AniList→webtoon)
and the Wiktionary→proverb NEW vertical.

RAWG is dormant (free key); the rest are keyless always-on (like MusicBrainz/Wikipedia), each self-
scoped to its vertical and identity-guarded so a wrong/foreign match resolves to a MISS. Wiktionary
anchors the deliberately single-source `proverb:` vertical on LEXICAL EXISTENCE (등재 항목만). Parse +
guard are pure and tested offline against fixture responses."""

from __future__ import annotations

import asyncio

import pytest

from koreaapi.sources.anilist import AniListSource, parse_anilist
from koreaapi.sources.rawg import RAWGSource, parse_rawg
from koreaapi.sources.sportsdb import SportsDBSource, parse_sportsdb
from koreaapi.sources.wiktionary import WiktionarySource, parse_wiktionary

# ---------------------------------------------------------------- RAWG (game, dormant)

def test_rawg_parse_matches_and_stamps_release():
    raw = {"results": [{"id": 58175, "name": "Lost Ark", "released": "2018-11-07"}]}
    out = parse_rawg(raw, "Lost Ark")
    assert out["name_en_official"] == "Lost Ark"
    assert out["attrs"]["Released"] == "2018-11-07"
    assert out["rawg_id"] == 58175


def test_rawg_guard_rejects_wrong_title():
    raw = {"results": [{"id": 1, "name": "Some Other Game"}]}
    with pytest.raises(ValueError):
        parse_rawg(raw, "Lost Ark")


def test_rawg_inert_without_key_and_scoped(monkeypatch):
    monkeypatch.delenv("RAWG_API_KEY", raising=False)
    src = RAWGSource()
    with pytest.raises(ValueError, match="RAWG_API_KEY"):
        asyncio.run(src.fetch("game:lostark", "facts"))
    with pytest.raises(ValueError, match="games only"):
        asyncio.run(src.fetch("artist:bts", "facts"))


# ---------------------------------------------------------------- TheSportsDB (sports, keyless)

def test_sportsdb_parse_matches_korean_athlete():
    raw = {"player": [{"idPlayer": "34", "strPlayer": "Son Heung-min",
                       "strSport": "Soccer", "strTeam": "Tottenham", "strNationality": "South Korea"}]}
    out = parse_sportsdb(raw, "Son Heung-min")
    assert out["attrs"]["Sport"] == "Soccer"
    assert out["attrs"]["Nationality"] == "South Korea"
    assert out["sportsdb_id"] == "34"


def test_sportsdb_guard_rejects_same_name_foreigner():
    raw = {"player": [{"idPlayer": "9", "strPlayer": "Son Heung-min", "strNationality": "Japan"}]}
    with pytest.raises(ValueError):
        parse_sportsdb(raw, "Son Heung-min")  # non-Korea nationality -> refuse


def test_sportsdb_scoped_to_sports():
    src = SportsDBSource()
    with pytest.raises(ValueError, match="sports only"):
        asyncio.run(src.fetch("artist:bts", "facts"))


# ---------------------------------------------------------------- AniList (webtoon, keyless GraphQL)

def test_anilist_parse_adds_korean_native_title():
    raw = {"data": {"Media": {"id": 105398, "countryOfOrigin": "KR",
                              "title": {"english": "Solo Leveling", "romaji": "Na Honjaman Level Up",
                                        "native": "나 혼자만 레벨업"},
                              "startDate": {"year": 2018}, "format": "MANGA"}}}
    out = parse_anilist(raw, "Solo Leveling")
    assert out["name_ko"] == "나 혼자만 레벨업"  # native Korean title -> real bilingual boost
    assert out["name_en_official"] == "Solo Leveling"
    assert out["attrs"]["First published"] == "2018"


def test_anilist_guard_rejects_non_kr_origin():
    raw = {"data": {"Media": {"id": 1, "countryOfOrigin": "JP",
                              "title": {"english": "Solo Leveling", "romaji": "", "native": "俺だけレベルアップ"}}}}
    with pytest.raises(ValueError):
        parse_anilist(raw, "Solo Leveling")  # JP origin -> refuse a same-title Japanese manga


def test_anilist_scoped_to_webtoons():
    src = AniListSource()
    with pytest.raises(ValueError, match="webtoons only"):
        asyncio.run(src.fetch("artist:bts", "facts"))


# ---------------------------------------------------------------- Wiktionary (proverb, keyless)

def _wik(title="티끌 모아 태산", extract="작은 것도 모으면 큰 것이 된다는 말.", missing=False) -> dict:
    page = {"title": title} if missing else {"title": title, "extract": extract}
    if missing:
        page["missing"] = ""
    return {"query": {"pages": {"123": page}}}


def test_wiktionary_ingests_listed_proverb_with_gloss():
    out = parse_wiktionary(_wik(), "티끌 모아 태산")
    assert out["name_ko"] == "티끌 모아 태산"
    assert out["attrs"]["Meaning (뜻)"].startswith("작은 것도")
    assert "위키낱말사전" in out["summary_ko"]


def test_wiktionary_misses_unlisted_term():
    # 등재 항목만 — a term with no entry (missing) is refused, never an unsourced saying
    with pytest.raises(ValueError):
        parse_wiktionary(_wik(missing=True), "티끌 모아 태산")


def test_wiktionary_guard_rejects_redirected_other_page():
    with pytest.raises(ValueError):
        parse_wiktionary(_wik(title="다른 표제어"), "티끌 모아 태산")


def test_wiktionary_scoped_to_proverbs():
    src = WiktionarySource()
    with pytest.raises(ValueError, match="proverbs only"):
        asyncio.run(src.fetch("artist:bts", "facts"))


def test_wiktionary_every_seed_proverb_resolves_to_itself():
    from koreaapi.roster import PROVERBS
    # the canonical name IS the Wiktionary headword -> a listed-entry response guard-matches it
    for eid, proverb in PROVERBS.items():
        out = parse_wiktionary(_wik(title=proverb), proverb)
        assert out["name_ko"] == proverb


if __name__ == "__main__":
    raise SystemExit(pytest.main([__file__, "-q"]))
