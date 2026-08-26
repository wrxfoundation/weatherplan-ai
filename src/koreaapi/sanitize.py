"""Prompt-injection guard for SERVED text — the supply-chain hole a verified-data layer owns.

Our substance comes from sources anyone can edit (the Wikipedia lead, and the aliases/attrs an LLM
extracts *from* that lead). The grounding gate proves a value is literally in its source — it does
NOT prove the source is benign. So an editor could plant instruction-shaped text that our pipeline
faithfully carries into an agent's context. That matters more now that agent platforms wire the
same agents to trading and payment scopes: their controls bound the BLAST RADIUS (isolated
sub-accounts, blocked withdrawals); nobody else is bounding the INPUT. That is this layer's job.

Doctrine, identical to the rest of the pipeline:

- **Drop, never rewrite.** A flagged field is removed, not "cleaned" — a silently edited abstract
  would be exactly the wrong-record failure every other guard exists to prevent. Losing an abstract
  is a miss; serving a doctored one is a lie.
- **Guard at INGEST, never at serve.** The published `content_hash` covers `data`, so scrubbing on
  the way out would make served bytes disagree with the hash anyone re-verifies. Cleaning happens
  before the record is written; already-stored records are re-cleaned as `refresh` re-ingests them
  (the whole store cycles well inside the freshness TTL). `admin scancontent` audits the gap.
- **Flag honestly.** What was dropped is recorded on the record (`content_flags`), not hidden.
- **Korean and English.** Korean-language injection is under-covered by generic filters; the
  Korean surface is our differentiator, so it is a first-class pattern set here.

`scan` is pure and returns REASONS, so a caller can log, audit, or drop as it sees fit.
"""

from __future__ import annotations

import re

# Control / chat-format markers. None of these can legitimately occur in an encyclopedia lead or a
# name, so they need no imperative shape to be damning.
_MARKERS = (
    (re.compile(r"<\|[a-z_]+\|>", re.I), "chat control token"),
    (re.compile(r"\[/?INST\]|<</?SYS>>"), "instruction-format token"),
    (re.compile(r"#{2,}\s*(system|instruction)s?\b", re.I), "system-section header"),
    (re.compile(r"(?m)^\s*(system|assistant|user)\s*:", re.I), "role-labelled turn"),
    (re.compile(r"[​-‏⁠-⁤﻿]"), "zero-width character"),
    (re.compile(r"[‪-‮⁦-⁩]"), "bidirectional override"),
)

# Natural-language injection. Each pattern requires IMPERATIVE shape (a command aimed at a model),
# not a mere topical mention — an article may discuss system prompts; it does not issue one.
_PHRASES = (
    (re.compile(r"\bignore\s+(?:all\s+|any\s+)?(?:previous|prior|above|preceding|earlier)\s+"
                r"(?:instruction|prompt|rule|direction|message)", re.I), "override attempt (en)"),
    (re.compile(r"\bdisregard\s+(?:all\s+|any\s+|the\s+)?(?:previous|prior|above|preceding)", re.I),
     "override attempt (en)"),
    (re.compile(r"\bforget\s+(?:everything|all\s+(?:previous|prior)|your\s+instructions)", re.I),
     "override attempt (en)"),
    (re.compile(r"\byou\s+are\s+now\s+(?:a|an|the)\b", re.I), "role reassignment (en)"),
    (re.compile(r"\bnew\s+(?:instruction|system\s+prompt|rule)s?\s*:", re.I), "injected directive (en)"),
    (re.compile(r"\b(?:reveal|print|output|repeat|show)\s+(?:me\s+)?(?:your|the)\s+"
                r"(?:system\s+prompt|instructions|api[\s_-]?key|secret|credentials)", re.I),
     "secret exfiltration (en)"),
    (re.compile(r"\b(?:transfer|send|withdraw|move)\s+(?:all\s+)?(?:the\s+|your\s+|my\s+)?"
                r"(?:funds|money|balance|assets|holdings|usdt|usdc|btc|eth)\b", re.I),
     "funds-movement instruction (en)"),
    (re.compile(r"\bexecute\s+(?:the\s+)?following\s+(?:command|code|instruction)", re.I),
     "code execution (en)"),
    (re.compile(r"\bdo\s+not\s+(?:tell|inform|notify|mention\s+(?:this\s+)?to)\s+the\s+user", re.I),
     "user-concealment instruction (en)"),
    # --- Korean ---------------------------------------------------------------------------------
    (re.compile(r"(?:이전|위|앞)의?\s*(?:지시|명령|지침|프롬프트)[를을]?\s*(?:모두\s*)?(?:무시|잊)"),
     "override attempt (ko)"),
    (re.compile(r"시스템\s*프롬프트[를을]?\s*(?:출력|공개|알려|보여|말해)"), "secret exfiltration (ko)"),
    (re.compile(r"(?:당신|너)[은는]\s*이제\s"), "role reassignment (ko)"),
    (re.compile(r"새(?:로운)?\s*(?:지시|명령|지침)\s*[:：]"), "injected directive (ko)"),
    (re.compile(r"(?:자금|잔액|자산|코인|전액)[를을]?\s*(?:모두\s*)?(?:송금|이체|전송|출금)"),
     "funds-movement instruction (ko)"),
    (re.compile(r"다음\s*(?:명령|코드|지시)[를을]?\s*(?:실행|수행)"), "code execution (ko)"),
    (re.compile(r"사용자에게(?:는)?\s*(?:알리지|말하지|보고하지)\s*마"), "user-concealment instruction (ko)"),
    (re.compile(r"API\s*키[를을]?\s*(?:알려|출력|공개)", re.I), "secret exfiltration (ko)"),
)


def scan(text) -> list[str]:
    """Pure: the reasons `text` looks like injected instructions (empty list = clean).

    Non-strings scan clean — type-shaped junk is another guard's problem (reconcile.norm)."""
    if not isinstance(text, str) or not text:
        return []
    found: list[str] = []
    for rx, reason in _MARKERS + _PHRASES:
        if rx.search(text) and reason not in found:
            found.append(reason)
    return found


def is_safe(text) -> bool:
    return not scan(text)


def _clean_list(values, flags: list[str], label: str) -> list:
    out = []
    for v in values:
        reasons = scan(v)
        if reasons:
            flags.append(f"{label}: {reasons[0]}")
        else:
            out.append(v)
    return out


def scrub_payload(payload: dict) -> list[str]:
    """Drop every injection-flagged TEXT field from an ingest payload, in place.

    Returns the human-readable flags (what was dropped and why) for honest recording on the record.
    Names are NOT dropped here — an unsafe name means the whole identity is suspect, so `check_name`
    lets the caller refuse the record outright (a miss beats a poisoned entity).
    """
    flags: list[str] = []
    for field in ("abstract_en", "abstract_ko", "summary_en", "summary_ko"):
        reasons = scan(payload.get(field))
        if reasons:
            payload.pop(field, None)
            flags.append(f"{field}: {reasons[0]}")
    if isinstance(payload.get("aliases"), list):
        payload["aliases"] = _clean_list(payload["aliases"], flags, "alias")
        if not payload["aliases"]:
            payload.pop("aliases")
    if isinstance(payload.get("attrs"), dict):
        kept = {}
        for k, v in payload["attrs"].items():
            reasons = scan(k) or scan(v)
            if reasons:
                flags.append(f"attr {k if isinstance(k, str) else '?'}: {reasons[0]}")
            else:
                kept[k] = v
        payload["attrs"] = kept
        if not kept:
            payload.pop("attrs")
    # The stored grounded extracts are re-served verbatim on later builds (run-once carry-forward),
    # so they must be cleaned too — otherwise a flagged value would ride back in tomorrow.
    for marker in ("enrichment", "enrichment_ko"):
        block = payload.get(marker)
        if not isinstance(block, dict):
            continue
        if isinstance(block.get("aliases"), list):
            block["aliases"] = _clean_list(block["aliases"], flags, f"{marker} alias")
        if isinstance(block.get("attrs"), dict):
            block["attrs"] = {k: v for k, v in block["attrs"].items()
                              if not (scan(k) or scan(v))}
    return flags


def check_name(payload: dict) -> str | None:
    """The first injection reason found in any NAME field, else None. An identity that carries
    instructions is not an identity — the caller refuses the record."""
    for field in ("name_ko", "name_en_official", "name_romanized"):
        reasons = scan(payload.get(field))
        if reasons:
            return f"{field}: {reasons[0]}"
    return None
