"""Machine-readable data license — reuse terms an agent/consumer can read in code, so the verified
layer can be used and CITED programmatically and attribution is enforceable.

The verified compilation + provenance/Skill Score are offered under CC-BY-4.0: free to use and cite
WITH attribution ("via KoreaAPI"). The underlying facts retain their own source licenses (each record
lists them in `provenance.sources`). CC-BY is deliberate — it makes the citation flywheel (free use in
exchange for attribution) a license term, not just a request.
"""

LICENSE = {
    "id": "CC-BY-4.0",
    "url": "https://creativecommons.org/licenses/by/4.0/",
    "attribution": "via KoreaAPI (https://aiagentlabs.co.kr)",
    "note": ("Verified compilation + provenance under CC-BY-4.0 — free to use and cite WITH "
             "attribution. Underlying facts keep their source licenses: each record's `sources` "
             "names its providers, and `SOURCE_LICENSES` (published in agents.json → licensing) "
             "gives the terms for each one."),
}

# Per-source upstream terms. The compilation licence above covers OUR work — the verification,
# provenance and Skill Score — not the facts underneath, and those terms differ in ways a reuser
# has to act on: CC0 asks nothing, CC BY-SA carries share-alike, and the Korean public APIs run on
# 공공누리 (KOGL), whose per-dataset type decides whether commercial use or derivatives are allowed
# at all. Telling a consumer to "see the sources" while publishing no terms anywhere was a promise
# the data did not keep. This keeps it.
#
# Honesty rule, the same one the dormant rails use for field shapes: where terms vary per dataset we
# say so instead of asserting a type we have not read. `verified: False` marks an entry a human must
# confirm with the provider before relying on it commercially.
_KOGL = ("공공누리 (KOGL) — the Korean public-works licence. Its TYPE (1–4, plus the AI유형 created "
         "in 2026-01 specifically to permit AI training) is chosen per dataset by the publishing "
         "agency, so read that dataset's own page: type 1 is attribution-only, the others restrict "
         "commercial use or derivatives.")

SOURCE_LICENSES = {
    "Wikidata": {"id": "CC0-1.0", "url": "https://creativecommons.org/publicdomain/zero/1.0/",
                 "attribution_required": False, "verified": True,
                 "note": "Wikidata content is dedicated to the public domain."},
    "Wikipedia": {"id": "CC-BY-SA-4.0", "url": "https://creativecommons.org/licenses/by-sa/4.0/",
                  "attribution_required": True, "share_alike": True, "verified": True,
                  "note": ("Wikipedia TEXT is share-alike, so prose reused from an abstract carries "
                           "that obligation; a plain fact such as a name or date is not "
                           "copyrightable and does not.")},
    "OpenStreetMap": {"id": "ODbL-1.0", "url": "https://opendatacommons.org/licenses/odbl/1-0/",
                      "attribution_required": True, "share_alike": True, "verified": True,
                      "note": "Coordinates via Nominatim — © OpenStreetMap contributors."},
    "MusicBrainz": {"id": "CC0-1.0 (core data)",
                    "url": "https://musicbrainz.org/doc/About/Data_License",
                    "attribution_required": False, "verified": True,
                    "note": ("Core identifiers and relationships are CC0; some supplementary data "
                             "is CC BY-NC-SA. We read core data only.")},
    "Open Library": {"id": "see provider terms", "url": "https://openlibrary.org/developers/api",
                     "attribution_required": True, "verified": False,
                     "note": "Internet Archive project — confirm current data terms before commercial reuse."},
    "TMDB": {"id": "proprietary (API terms)", "url": "https://www.themoviedb.org/api-terms-of-use",
             "attribution_required": True, "verified": True,
             "note": "Attribution to TMDB is required by their API terms; this is not an open licence."},
    "YouTube": {"id": "proprietary (API terms)",
                "url": "https://developers.google.com/youtube/terms/api-services-terms-of-service",
                "attribution_required": True, "verified": True,
                "note": "Public channel statistics via the Data API, under Google's API terms."},
    "Circle Chart": {"id": "CC-BY-SA-4.0 (read via Wikipedia)",
                     "url": "https://creativecommons.org/licenses/by-sa/4.0/",
                     "attribution_required": True, "share_alike": True, "verified": True,
                     "note": ("We read the settlement datum from Wikipedia's server-rendered list, "
                              "so it carries Wikipedia's terms; the chart itself is Circle Chart's.")},
    "KTO": {"id": "공공누리 (KOGL)", "url": "https://www.kogl.or.kr/", "attribution_required": True,
            "verified": False, "note": f"한국관광공사 TourAPI. {_KOGL}"},
    "KOSIS": {"id": "공공누리 (KOGL)", "url": "https://www.kogl.or.kr/", "attribution_required": True,
              "verified": False, "note": f"국가통계포털. {_KOGL}"},
    "KOPIS": {"id": "공공누리 (KOGL)", "url": "https://www.kogl.or.kr/", "attribution_required": True,
              "verified": False, "note": f"공연예술통합전산망. {_KOGL}"},
    "KHS": {"id": "공공누리 (KOGL)", "url": "https://www.kogl.or.kr/", "attribution_required": True,
            "verified": False, "note": f"국가유산청. {_KOGL}"},
    "KOBIS": {"id": "공공누리 (KOGL)", "url": "https://www.kogl.or.kr/", "attribution_required": True,
              "verified": False, "note": f"영화진흥위원회 영화관입장권통합전산망. {_KOGL}"},
}


def license_for(citation):
    """The upstream terms behind a published citation string, or None if the provider is unknown.

    A citation reads `"<provider> <id> <YYYY-MM-DD HH:MM UTC>"` and some providers are two words,
    so match the longest registered prefix rather than the first token."""
    if not isinstance(citation, str) or not citation:
        return None
    for name in sorted(SOURCE_LICENSES, key=len, reverse=True):
        if citation == name or citation.startswith(name + " "):
            return {"source": name, **SOURCE_LICENSES[name]}
    return None
