#!/usr/bin/env python3
"""Forecast the next candles of any ticker with Kronos, the open-source foundation model
for financial candlesticks (https://github.com/shiyu-coder/Kronos, arXiv:2508.02739).

    python forecast.py NVDA                  # stock / ETF / index via yfinance, daily candles
    python forecast.py XAU                   # gold in USD (Yahoo has no spot XAU/USD -> GC=F futures)
    python forecast.py BTC/USDT              # crypto pair via ccxt (public data, no API keys)
    python forecast.py XAU --test            # hide the last candles, forecast them, score 20+ windows
    python forecast.py BTC/USDT --interval 1h --horizon 24 --model mini

For research and learning only. It never places trades or connects to a broker,
and nothing it prints or draws is financial advice.
"""
import argparse
import math
import os
import platform
import re
import shutil
import subprocess
import sys
import textwrap
import warnings
from datetime import datetime, timezone

import numpy as np
import pandas as pd

warnings.filterwarnings("ignore", category=FutureWarning)
warnings.filterwarnings("ignore", category=DeprecationWarning)  # pinned pandas 2.2.2 vs newer NumPy: harmless

HERE = os.path.dirname(os.path.abspath(__file__))
KRONOS_DIR = os.environ.get("KRONOS_DIR", os.path.join(HERE, "Kronos"))
CHART_DIR = os.path.join(HERE, "charts")

# "Model Zoo" table in the Kronos README: model, its matching tokenizer, max context length.
MODELS = {
    "mini": ("NeoQuasar/Kronos-mini", "NeoQuasar/Kronos-Tokenizer-2k", 2048),
    "small": ("NeoQuasar/Kronos-small", "NeoQuasar/Kronos-Tokenizer-base", 512),
    "base": ("NeoQuasar/Kronos-base", "NeoQuasar/Kronos-Tokenizer-base", 512),
}

# Yahoo has no spot XAU/USD or XAG/USD quote ("XAUUSD=X" -> "Quote not found"), so the metals map
# to COMEX front-month futures, priced in USD per troy ounce. (Yahoo's ^XAU is a gold-MINERS index.)
ALIASES = {"XAU": "GC=F", "XAUUSD": "GC=F", "XAU/USD": "GC=F", "XAUUSD=X": "GC=F",
           "XAG": "SI=F", "XAGUSD": "SI=F", "XAG/USD": "SI=F", "XAGUSD=X": "SI=F"}
NICE_NAMES = {"GC=F": "Gold (COMEX futures GC=F, USD/oz)", "SI=F": "Silver (COMEX futures SI=F, USD/oz)"}

# Crypto comes from public exchange endpoints via ccxt, created WITHOUT API keys: it can read
# prices but cannot see an account or place an order. "auto" tries these in order.
CRYPTO_EXCHANGES = ["binance", "okx", "coinbase", "kraken", "bybit", "upbit", "bithumb"]

YF_INTERVALS = ["1m", "2m", "5m", "15m", "30m", "60m", "90m", "1h", "1d", "1wk", "1mo"]
YF_PERIOD = {"1m": "7d", "2m": "60d", "5m": "60d", "15m": "60d", "30m": "60d", "90m": "60d",
             "60m": "730d", "1h": "730d"}  # Yahoo's intraday history limits; daily and up use "max"
INTERVAL_WORDS = {"1m": "1-minute", "2m": "2-minute", "3m": "3-minute", "5m": "5-minute",
                  "15m": "15-minute", "30m": "30-minute", "60m": "hourly", "1h": "hourly",
                  "90m": "90-minute", "2h": "2-hour", "4h": "4-hour", "6h": "6-hour", "12h": "12-hour",
                  "1d": "daily", "1wk": "weekly", "1w": "weekly", "1mo": "monthly", "1M": "monthly"}
CURRENCY_PREFIX = {"USD": "$", "EUR": "€", "GBP": "£", "JPY": "¥", "KRW": "₩"}

# Chart palette (light): neutral ink for real candles, one blue for everything Kronos generated.
SURFACE, INK, INK2, MUTED = "#fcfcfb", "#0b0b0b", "#52514e", "#898781"
GRID, BASELINE, BLUE = "#e1e0d9", "#c3c2b7", "#2a78d6"
GOOD, BAD = "#0ca30c", "#d03b3b"  # direction right / wrong, always shown with an icon and a word


# ----------------------------------------------------------------------------- market data

def resolve_symbol(raw):
    sym = raw.strip().upper()
    return ALIASES.get(sym, sym)


def interval_step(interval):
    """Length of one candle (Timedelta, or DateOffset for months)."""
    m = re.fullmatch(r"(\d+)(m|h|d|w|wk|mo|M)", interval)
    if not m:
        sys.exit(f"Unknown interval {interval!r}. Examples: 15m, 1h, 4h, 1d, 1wk.")
    n, unit = int(m.group(1)), m.group(2)
    if unit in ("mo", "M"):
        return pd.DateOffset(months=n)
    names = {"m": "minutes", "h": "hours", "d": "days", "w": "weeks", "wk": "weeks"}
    return pd.Timedelta(**{names[unit]: n})


def is_intraday(interval):
    step = interval_step(interval)
    return not isinstance(step, pd.DateOffset) and step < pd.Timedelta(days=1)


def utc(v):
    """A UTC Timestamp from epoch seconds or a datetime (yfinance versions differ)."""
    if isinstance(v, (int, float)):
        return pd.to_datetime(v, unit="s", utc=True)
    t = pd.Timestamp(v)
    return t.tz_localize("UTC") if t.tzinfo is None else t.tz_convert("UTC")


def clean(df):
    px = ["open", "high", "low", "close"]
    df = df.dropna(subset=px)
    df = df[(df[px] > 0).all(axis=1)].copy()
    df["volume"] = df["volume"].fillna(0.0).clip(lower=0)
    return df.drop_duplicates("timestamps", keep="last").sort_values("timestamps").reset_index(drop=True)


def load_yahoo(symbol, interval):
    import yfinance as yf

    if interval not in YF_INTERVALS:
        sys.exit(f"Yahoo Finance intervals: {', '.join(YF_INTERVALS)} (got {interval!r}).")
    tk = yf.Ticker(symbol)
    raw = tk.history(period=YF_PERIOD.get(interval, "max"), interval=interval, auto_adjust=True)
    if raw.empty:
        sys.exit(f"Yahoo Finance returned no {interval} candles for {symbol!r}. Check the symbol on "
                 "finance.yahoo.com (e.g. 005930.KS Samsung, ^GSPC S&P 500, GC=F gold, BTC-USD).")
    md = tk.history_metadata or {}
    tz = md.get("exchangeTimezoneName") or "UTC"
    idx = raw.index.tz_convert(tz) if raw.index.tz is not None else raw.index.tz_localize(tz)
    df = clean(pd.DataFrame({"timestamps": idx, "open": raw["Open"].to_numpy(), "high": raw["High"].to_numpy(),
                             "low": raw["Low"].to_numpy(), "close": raw["Close"].to_numpy(),
                             "volume": raw["Volume"].to_numpy(dtype=float)}))
    if df.empty:
        sys.exit(f"Yahoo Finance returned no usable {interval} candles for {symbol!r}.")

    # Leave out a candle that is still forming (e.g. today's daily bar while the market is open).
    now, last = pd.Timestamp.now(tz="UTC"), df["timestamps"].iloc[-1]
    regular = (md.get("currentTradingPeriod") or {}).get("regular") or {}
    if interval == "1d" and regular:
        start, end = utc(regular["start"]).tz_convert(tz), utc(regular["end"])
        forming = last.date() == start.date() and now < end
    elif interval == "1d":
        forming = last.date() >= now.tz_convert(tz).date()
    else:
        forming = now < last + interval_step(interval)
    dropped = None
    if forming:
        dropped, df = last, df.iloc[:-1]

    name = NICE_NAMES.get(symbol) or md.get("longName") or md.get("shortName") or symbol
    if symbol not in name:
        name = f"{name} ({symbol})"
    df = df.assign(timestamps=df["timestamps"].dt.tz_localize(None)).reset_index(drop=True)  # exchange-local time
    return {"df": df, "name": name, "currency": md.get("currency") or "", "source": "Yahoo Finance via yfinance",
            "dropped": dropped, "symbol": symbol}


def load_csv(path, extra=()):
    """Candles from a CSV such as TradingView's "Export chart data": a time column plus
    open/high/low/close. Volume is optional; other (indicator) columns are ignored unless
    named in `extra`, which are kept row-aligned (signal_check.py uses this for signal columns)."""
    raw = pd.read_csv(path)
    absent = [c for c in extra if c not in raw.columns]
    if absent:
        sys.exit(f"{path} has no column(s) {absent}. Its columns: {', '.join(map(str, raw.columns))}")
    cols = {c.strip().lower(): c for c in raw.columns}
    tcol = next((cols[c] for c in ("time", "timestamp", "timestamps", "date", "datetime") if c in cols), None)
    missing = [c for c in ("open", "high", "low", "close") if c not in cols] + ([] if tcol else ["time"])
    if missing:
        sys.exit(f"{path} is missing column(s): {', '.join(missing)}.")
    t = raw[tcol]
    if pd.api.types.is_numeric_dtype(t):  # UNIX time (TradingView's default export setting), in UTC
        ts = pd.to_datetime(t, unit="ms" if t.max() > 1e11 else "s")
    else:  # ISO text: keep the clock time it was written in (e.g. +09:00 stays KST)
        ts = pd.to_datetime(t)
        ts = ts.dt.tz_localize(None) if hasattr(ts, "dt") and ts.dt.tz is not None else pd.to_datetime(t, utc=True).dt.tz_localize(None)
    vol = raw[cols["volume"]].to_numpy(dtype=float) if "volume" in cols else 0.0
    df = clean(pd.DataFrame({"timestamps": ts, "open": raw[cols["open"]].to_numpy(dtype=float),
                             "high": raw[cols["high"]].to_numpy(dtype=float), "low": raw[cols["low"]].to_numpy(dtype=float),
                             "close": raw[cols["close"]].to_numpy(dtype=float), "volume": vol,
                             **{c: raw[c].to_numpy() for c in extra}}))
    if len(df) < 2:
        sys.exit(f"{path} has fewer than 2 usable candles.")
    if "volume" not in cols:
        print("No volume column in the CSV: Kronos gets prices only (add TradingView's Volume indicator "
              "to the chart before exporting to include it).")

    secs = int(df["timestamps"].diff().median().total_seconds())
    if secs < 60:
        sys.exit(f"{path}: candles {secs}s apart; the shortest supported interval is 1 minute.")
    interval = f"{secs // 86400}d" if secs % 86400 == 0 else f"{secs // 3600}h" if secs % 3600 == 0 else f"{secs // 60}m"

    # TradingView names exports like "BINANCE_XRPUSDT, 5.csv"; uploads may add a "1a2b3c4d-" prefix.
    stem = re.sub(r"^[0-9a-f]{8}-", "", os.path.splitext(os.path.basename(path))[0])
    m = re.match(r"([A-Z0-9]+)_([A-Z0-9.!]+)[,_ ]+\d", stem)
    symbol, name = (m.group(2), f"{m.group(2)} ({m.group(1)}, CSV)") if m else (stem, stem)
    currency = next((q for q in ("USDT", "USDC", "USD", "KRW", "EUR", "JPY", "GBP") if symbol.endswith(q)), "")
    return {"df": df, "name": name, "currency": currency, "source": f"CSV export {os.path.basename(path)}",
            "dropped": None, "symbol": symbol, "interval": interval}


def fetch_ccxt_ohlcv(ex, symbol, timeframe, need):
    """The latest `need` candles, paging backwards from now 100 at a time (exchanges cap each request)."""
    step = ex.parse_timeframe(timeframe) * 1000
    rows, end = {}, ex.milliseconds()
    for _ in range(500):
        batch = [r for r in ex.fetch_ohlcv(symbol, timeframe, since=end - 100 * step, limit=100) if r[0] < end]
        if not batch:  # nothing older, e.g. before the pair was listed
            break
        rows.update({r[0]: r for r in batch})
        end = batch[0][0]
        if len(rows) >= need:
            break
    df = pd.DataFrame(sorted(rows.values()), columns=["ts", "open", "high", "low", "close", "volume"])
    df.insert(0, "timestamps", pd.to_datetime(df.pop("ts"), unit="ms"))  # UTC
    return clean(df), step


def load_crypto(symbol, interval, need, exchange):
    import ccxt

    timeframe = {"1wk": "1w", "60m": "1h", "1mo": "1M"}.get(interval, interval)
    tried, best = [], None
    for ex_id in ([exchange] if exchange != "auto" else CRYPTO_EXCHANGES):
        try:
            # requests_trust_env: honour HTTP(S)_PROXY like other tools (ccxt ignores it by default)
            ex = getattr(ccxt, ex_id)({"enableRateLimit": True, "requests_trust_env": True})
            ex.load_markets()
            if symbol not in ex.symbols:
                tried.append(f"{ex_id}: no {symbol}")
                continue
            if timeframe not in (ex.timeframes or {}):
                tried.append(f"{ex_id}: no {timeframe} candles")
                continue
            df, step = fetch_ccxt_ohlcv(ex, symbol, timeframe, need + 1)
            if df.empty:
                tried.append(f"{ex_id}: no {timeframe} candles returned")
                continue
        except Exception as e:  # geo-blocks, outages, unknown exchange id...
            tried.append(f"{ex_id}: {type(e).__name__}")
            continue
        if best is None or len(df) > len(best[1]):
            best = (ex, df, step)
        if len(df) >= need + 1:
            break
    if best is None:
        sys.exit(f"Could not load {symbol} from a public exchange ({'; '.join(tried)}). "
                 "Crypto symbols look like BTC/USDT, ETH/USDT, BTC/KRW.")
    ex, df, step = best
    dropped = None
    if pd.Timestamp.now(tz="UTC").tz_localize(None) < df["timestamps"].iloc[-1] + pd.Timedelta(milliseconds=step):
        dropped, df = df["timestamps"].iloc[-1], df.iloc[:-1].reset_index(drop=True)
    return {"df": df, "name": f"{symbol} on {ex.name}", "currency": symbol.split("/")[1].split(":")[0],
            "source": f"{ex.name} public market data via ccxt", "dropped": dropped, "symbol": symbol,
            "interval": timeframe}


def future_timestamps(ts, n, interval):
    """Timestamps of the next n candles, following the market's own weekly rhythm: the
    weekday + time-of-day slots it traded in over the last 8 weeks. Holidays are not known."""
    step, last = interval_step(interval), ts.iloc[-1]
    if isinstance(step, pd.DateOffset) or step >= pd.Timedelta(weeks=1):
        return pd.Series([last + step * (i + 1) for i in range(n)])
    recent = ts[ts > last - pd.Timedelta(weeks=8)]
    slots = set(zip(recent.dt.weekday, recent.dt.time))
    out, t = [], last
    for _ in range(n * 20_000):
        t += step
        if (t.weekday(), t.time()) in slots:
            out.append(t)
            if len(out) == n:
                break
    while len(out) < n:  # irregular history: fall back to even spacing
        out.append((out[-1] if out else last) + step)
    return pd.Series(out)


# ----------------------------------------------------------------------------- Kronos

def load_predictor(size, device):
    if not os.path.isdir(os.path.join(KRONOS_DIR, "model")):
        sys.exit(f"Kronos source not found in {KRONOS_DIR}. Run ./setup.sh first (or set KRONOS_DIR).")
    sys.path.append(KRONOS_DIR)  # appended, so nothing in the clone can shadow installed packages
    from model import Kronos, KronosPredictor, KronosTokenizer

    model_id, tokenizer_id, max_context = MODELS[size]
    # .eval() as in the Kronos authors' own inference code (finetune/qlib_test.py, tests/):
    # huggingface_hub's safetensors loader leaves the modules in training mode, i.e. dropout on.
    tokenizer = KronosTokenizer.from_pretrained(tokenizer_id).eval()
    model = Kronos.from_pretrained(model_id).eval()
    return KronosPredictor(model, tokenizer, device=None if device == "auto" else device, max_context=max_context)


def sample_paths(predictor, hist, future_ts, n_paths, args, progress):
    """n_paths independent closing-price paths, shape (n_paths, horizon).

    predict(sample_count=k) returns the AVERAGE of k samples (one smooth line), so instead the same
    history goes through predict_batch n_paths times with sample_count=1: each row is its own path."""
    x_df = hist[["open", "high", "low", "close", "volume"]].reset_index(drop=True)
    x_ts = hist["timestamps"].reset_index(drop=True)
    y_ts = pd.Series(future_ts).reset_index(drop=True)
    preds = predictor.predict_batch([x_df] * n_paths, [x_ts] * n_paths, [y_ts] * n_paths, pred_len=len(y_ts),
                                    T=args.temperature, top_p=args.top_p, sample_count=1, verbose=progress)
    return np.stack([p["close"].to_numpy() for p in preds])


# ----------------------------------------------------------------------------- formatting

def money(v, prefix):
    if abs(v) < 1:
        return f"{prefix}{v:.6g}"
    # won and yen are quoted without decimals; otherwise keep ~5 significant digits (4,142.60 / 1.3784)
    dec = 0 if prefix in ("₩", "¥") else 2 if abs(v) >= 100 else 3 if abs(v) >= 10 else 4
    return f"{prefix}{v:,.{dec}f}"


def pct(a, b):
    return (a / b - 1) * 100


def day(ts, intraday):
    return f"{ts:%a %Y-%m-%d %H:%M}" if intraday else f"{ts:%a %Y-%m-%d}"


def wilson(k, n, z=1.96):
    """95% confidence interval for a hit rate of k out of n."""
    p, d = k / n, 1 + z * z / n
    c, m = (p + z * z / (2 * n)) / d, z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / d
    return c - m, c + m


# ----------------------------------------------------------------------------- charts

def setup_matplotlib():
    import matplotlib

    matplotlib.use("Agg")
    from matplotlib import font_manager

    installed = {f.name for f in font_manager.fontManager.ttflist}
    fonts = [f for f in ("Helvetica Neue", "Helvetica", "Arial", "Segoe UI") if f in installed]
    matplotlib.rcParams.update({
        "font.family": fonts + ["DejaVu Sans"],  # DejaVu (bundled) also covers glyphs like ✓ ✗
        "figure.facecolor": SURFACE, "axes.facecolor": SURFACE, "savefig.facecolor": SURFACE,
        "axes.edgecolor": BASELINE, "text.color": INK, "xtick.color": MUTED, "ytick.color": MUTED,
        "text.parse_math": False,  # "$4,100 and $4,200" is money, not math markup
    })


def time_ticks(ts, max_ticks=9):
    """Positions/labels where a new hour, day, week, month or year starts, as dense as fits."""
    ts = pd.Series(pd.to_datetime(ts)).reset_index(drop=True)
    monday = (ts - pd.to_timedelta(ts.dt.weekday, unit="D")).dt.normalize()
    units = [("hour", ts.dt.floor("h")), ("6h", ts.dt.floor("6h")), ("day", ts.dt.normalize()),
             ("week", monday), ("month", ts.dt.year * 12 + ts.dt.month),
             ("quarter", ts.dt.year * 4 + (ts.dt.month - 1) // 3), ("year", ts.dt.year)]
    found = [(kind, np.flatnonzero(key.ne(key.shift()).to_numpy())[1:]) for kind, key in units]
    fits = [(kind, pos) for kind, pos in found if 2 <= len(pos) <= max_ticks]
    crowded = [(kind, pos) for kind, pos in found if len(pos) > max_ticks]
    if fits:  # finest unit that fits
        kind, pos = fits[0]
    elif crowded:  # e.g. 10 hour-starts but only one day-start: keep every 2nd hour
        kind, pos = crowded[-1]
        pos = pos[:: math.ceil(len(pos) / max_ticks)]
    else:
        kind, pos = "day", np.array([], dtype=int)
    min_gap = len(ts) / (max_ticks * 1.6)
    kept = []
    for i in pos:
        if not kept or i - kept[-1] >= min_gap:
            kept.append(i)
    pos = np.array(kept, dtype=int)
    if len(pos) < 2:  # very short span: evenly spaced
        pos = np.linspace(0, len(ts) - 1, 6).astype(int)
        kind = "day" if (ts.dt.hour == 0).all() and (ts.dt.minute == 0).all() else "hour"
    labels, prev = [], None
    for i in pos:
        t = ts[i]
        if kind in ("hour", "6h"):
            labels.append(f"{t:%H:%M}" if prev is not None and t.date() == prev.date() else f"{t:%b} {t.day}\n{t:%H:%M}")
        elif kind in ("day", "week"):
            labels.append(f"{t:%b} {t.day}")
        elif kind in ("month", "quarter"):
            labels.append(f"{t:%b}\n{t.year}" if prev is None or t.year != prev.year else f"{t:%b}")
        else:
            labels.append(f"{t.year}")
        prev = t
    return pos, labels


def draw_candles(ax, x, c, ink, z=3, lw=0.8, width=0.62):
    """Monochrome candlesticks: hollow body = closed up, filled body = closed down."""
    o, h, lo, cl = (c[k].to_numpy(dtype=float) for k in ("open", "high", "low", "close"))
    ax.vlines(x, lo, h, color=ink, linewidth=lw, zorder=z)
    bottom = np.minimum(o, cl)
    body = np.maximum(np.abs(cl - o), (h.max() - lo.min()) * 0.0015)  # keep dojis visible
    up = cl >= o
    ax.bar(x[up], body[up], width, bottom=bottom[up], facecolor=SURFACE, edgecolor=ink, linewidth=lw, zorder=z + .1)
    ax.bar(x[~up], body[~up], width, bottom=bottom[~up], facecolor=ink, edgecolor=ink, linewidth=lw, zorder=z + .1)


def draw_fan(ax, x_last, last_close, paths, show_paths=True, lw=2.0):
    """Sampled paths + middle-50% and 80% bands + median, anchored at the last real close."""
    full = np.hstack([np.full((len(paths), 1), last_close), paths])
    xs = np.arange(x_last, x_last + full.shape[1])
    p10, p25, p50, p75, p90 = np.percentile(full, [10, 25, 50, 75, 90], axis=0)
    if show_paths:
        for row in full:
            ax.plot(xs, row, color=BLUE, alpha=0.22, linewidth=0.8, zorder=4)
    ax.fill_between(xs, p10, p90, color=BLUE, alpha=0.10, linewidth=0, zorder=2)
    ax.fill_between(xs, p25, p75, color=BLUE, alpha=0.14, linewidth=0, zorder=2)
    ax.plot(xs, p50, color=BLUE, linewidth=lw, solid_capstyle="round", solid_joinstyle="round", zorder=6)
    return xs, p10, p50, p90


def end_labels(ax, x, items):
    """Direct labels right of the last forecast candle; nudged apart (with a leader) if they'd overlap."""
    lo, hi = ax.get_ylim()
    gap = (hi - lo) * 0.055
    items = sorted(items, key=lambda it: it[0])
    ys = [it[0] for it in items]
    for i in range(1, len(ys)):
        ys[i] = max(ys[i], ys[i - 1] + gap)
    shift = max(0.0, ys[-1] - (hi - gap / 2)) if ys else 0.0
    ys = [y - shift for y in ys]
    for (y0, text, color, weight), y in zip(items, ys):
        arrow = dict(arrowstyle="-", color=BASELINE, lw=0.8) if abs(y - y0) > gap * 0.25 else None
        ax.annotate(text, xy=(x + 0.3, y0), xytext=(x + 1.6, y), fontsize=9.5, color=color, weight=weight,
                    va="center", ha="left", arrowprops=arrow, zorder=8)


def style_axes(ax, prefix):
    from matplotlib.ticker import FuncFormatter

    ax.yaxis.tick_right()
    ticks = ax.get_yticks()
    step = abs(ticks[1] - ticks[0]) if len(ticks) > 1 else 1
    dec = max(0, -int(math.floor(math.log10(step)))) if step > 0 else 2
    ax.yaxis.set_major_formatter(FuncFormatter(lambda v, _: f"{prefix}{v:,.{dec}f}"))
    ax.grid(axis="y", color=GRID, linewidth=0.8)
    ax.set_axisbelow(True)
    for side in ("top", "left", "right"):
        ax.spines[side].set_visible(False)
    ax.spines["bottom"].set_color(BASELINE)
    ax.tick_params(axis="both", length=0, labelsize=9, colors=MUTED, pad=6)


def legend_handles(n_paths, actual):
    from matplotlib.lines import Line2D
    from matplotlib.patches import Patch

    def candle(ink, fill):
        return Line2D([], [], color=ink, marker="s", markersize=7, markerfacecolor=fill, linestyle="none")

    handles = [((candle(INK2, SURFACE), candle(INK2, INK2)), "Past candles (hollow = up, filled = down)")]
    if actual:
        handles.append(((candle(INK, SURFACE), candle(INK, INK)), "What actually happened (hidden from Kronos)"))
    handles += [(Line2D([], [], color=BLUE, lw=2), "Median of sampled paths"),
                (Line2D([], [], color=BLUE, lw=0.8, alpha=0.5), f"Each of the {n_paths} sampled paths"),
                (Patch(color=BLUE, alpha=0.24, lw=0), "Middle 50% of paths"),
                (Patch(color=BLUE, alpha=0.10, lw=0), "80% of paths"),
                (Line2D([], [], color=BASELINE, lw=1), "Last close")]
    return handles


def header(fig, title, subtitle, footer, left):
    fig.text(left, 0.957, title, fontsize=15, weight="bold", color=INK, va="top")
    fig.text(left, 0.912, "\n".join(textwrap.wrap(subtitle, 160)), fontsize=10.5, color=INK2, va="top", linespacing=1.45)
    fig.text(left, 0.018, "\n".join(textwrap.wrap(footer, 200)), fontsize=8, color=MUTED, va="bottom", linespacing=1.5)


def plot_forecast(path, mk, hist, fut_ts, paths, title, subtitle, footer, actual=None, verdict=None):
    import matplotlib.pyplot as plt
    from matplotlib.legend_handler import HandlerTuple

    L, H = len(hist), paths.shape[1]
    prefix = CURRENCY_PREFIX.get(mk["currency"], "")
    fig, ax = plt.subplots(figsize=(13, 7.6), dpi=150)
    left = 0.045
    fig.subplots_adjust(left=left, right=0.925, top=0.735 if verdict else 0.765, bottom=0.14)

    last_close = float(hist["close"].iloc[-1])
    draw_candles(ax, np.arange(L), hist, INK2)
    xs, p10, p50, p90 = draw_fan(ax, L - 1, last_close, paths)
    ax.hlines(last_close, L - 1, L - 1 + H, color=BASELINE, linewidth=1, zorder=1)
    if actual is not None:
        draw_candles(ax, np.arange(L, L + H), actual, INK, z=5)
    ax.axvline(L - 0.5, color=BASELINE, linewidth=1, zorder=1)
    ax.text(L - 0.1, 0.985, "hidden from Kronos  →" if actual is not None else "forecast  →",
            transform=ax.get_xaxis_transform(), fontsize=9, color=MUTED, va="top", zorder=9,
            bbox=dict(facecolor=SURFACE, edgecolor="none", pad=1.5))

    lows = [hist["low"].min(), paths.min()] + ([actual["low"].min()] if actual is not None else [])
    highs = [hist["high"].max(), paths.max()] + ([actual["high"].max()] if actual is not None else [])
    pad = (max(highs) - min(lows)) * 0.07
    ax.set_ylim(min(lows) - pad, max(highs) + pad)
    ax.set_xlim(-1, L + H + max(16, 0.2 * (L + H)))

    labels = [(p50[-1], f"median {money(p50[-1], prefix)} ({pct(p50[-1], last_close):+.1f}%)", INK, "bold"),
              (p90[-1], f"90th pct {money(p90[-1], prefix)}", INK2, "normal"),
              (p10[-1], f"10th pct {money(p10[-1], prefix)}", INK2, "normal")]
    if actual is not None:
        a_end = float(actual["close"].iloc[-1])
        labels.append((a_end, f"actual {money(a_end, prefix)} ({pct(a_end, last_close):+.1f}%)", INK, "bold"))
    end_labels(ax, xs[-1], labels)
    ax.scatter([xs[-1]], [p50[-1]], s=46, color=BLUE, edgecolors=SURFACE, linewidths=2, zorder=7)

    pos, tick_labels = time_ticks(pd.concat([hist["timestamps"], pd.Series(fut_ts)], ignore_index=True))
    ax.set_xticks(pos, tick_labels)
    style_axes(ax, prefix)

    header(fig, title, subtitle, footer, left)
    handles = legend_handles(paths.shape[0], actual is not None)
    fig.legend([h for h, _ in handles], [t for _, t in handles], loc="upper left", bbox_to_anchor=(left - 0.006, 0.845),
               ncol=math.ceil(len(handles) / 2), frameon=False, fontsize=9, labelcolor=INK2,
               handler_map={tuple: HandlerTuple(ndivide=None)},
               columnspacing=1.6, handletextpad=0.6)
    if verdict is not None:
        ok, text = verdict
        fig.text(left, 0.765, "✓" if ok else "✗", fontsize=12, weight="bold", color=GOOD if ok else BAD, va="center")
        fig.text(left + 0.016, 0.765, text, fontsize=10.5, color=INK, va="center")
    fig.savefig(path)
    plt.close(fig)


def plot_windows(path, mk, windows, title, summary_lines, footer, intraday, context=40):
    import matplotlib.pyplot as plt
    from matplotlib.lines import Line2D
    from matplotlib.patches import Patch

    n = len(windows)
    cols = 5
    rows = math.ceil(n / cols)
    fig = plt.figure(figsize=(16, 3.0 + 2.25 * rows), dpi=130)
    hh = fig.get_figheight()  # layout below is in inches from the top / bottom edge
    gs = fig.add_gridspec(rows, cols, left=0.035, right=0.985, top=1 - 2.1 / hh, bottom=0.7 / hh,
                          hspace=0.55, wspace=0.10)
    span_fmt = "%m-%d %H:%M" if intraday else "%Y-%m-%d"
    for i, w in enumerate(windows):
        ax = fig.add_subplot(gs[i // cols, i % cols])
        ctx, act = w["context"].tail(context), w["actual"]
        L, H = len(ctx), len(act)
        ax.plot(np.arange(L), ctx["close"], color=INK2, linewidth=1.1, zorder=3)
        draw_fan(ax, L - 1, w["last_close"], w["paths"], show_paths=False, lw=1.6)
        ax.plot(np.arange(L - 1, L + H), np.r_[w["last_close"], act["close"].to_numpy()], color=INK, linewidth=1.5, zorder=5)
        ax.axvline(L - 0.5, color=BASELINE, linewidth=0.8, zorder=1)
        ax.set_xticks([])
        ax.set_yticks([])
        for side in ("top", "left", "right"):
            ax.spines[side].set_visible(False)
        ax.spines["bottom"].set_color(BASELINE)
        ok = w["direction_right"]
        ax.text(0, 1.12, "✓" if ok else "✗", transform=ax.transAxes, fontsize=10.5, weight="bold",
                color=GOOD if ok else BAD, va="bottom")
        same_day = w["first_hidden"].date() == w["last_hidden"].date()
        end_fmt = ("%H:%M" if same_day else "%m-%d %H:%M") if intraday else "%m-%d"
        ax.text(0.075, 1.12, f"{'right' if ok else 'wrong'} · hidden {w['first_hidden']:{span_fmt}} → "
                f"{w['last_hidden']:{end_fmt}}", transform=ax.transAxes, fontsize=8.5, color=INK, va="bottom")
        ax.text(0, 1.02, f"error {w['kronos_err']:.1f}% (no-change {w['naive_err']:.1f}%)",
                transform=ax.transAxes, fontsize=7.8, color=MUTED, va="bottom")

    fig.text(0.035, 1 - 0.28 / hh, title, fontsize=15, weight="bold", color=INK, va="top")
    for j, line in enumerate(summary_lines):
        fig.text(0.035, 1 - (0.68 + 0.25 * j) / hh, line, fontsize=10.5, color=INK2, va="top")
    handles = [(Line2D([], [], color=INK2, lw=1.1), f"Last {context} closes before the cutoff"),
               (Line2D([], [], color=BLUE, lw=1.6), "Median of sampled paths"),
               (Patch(color=BLUE, alpha=0.24, lw=0), "Middle 50% of paths"),
               (Patch(color=BLUE, alpha=0.10, lw=0), "80% of paths"),
               (Line2D([], [], color=INK, lw=1.5), "What actually happened")]
    fig.legend([h for h, _ in handles], [t for _, t in handles], loc="upper left",
               bbox_to_anchor=(0.03, 1 - (0.70 + 0.25 * len(summary_lines)) / hh), ncol=5, frameon=False,
               fontsize=9, labelcolor=INK2, columnspacing=1.6)
    fig.text(0.035, 0.12 / hh, "\n".join(textwrap.wrap(footer, 230)), fontsize=8, color=MUTED, va="bottom",
             linespacing=1.5)
    fig.savefig(path)
    plt.close(fig)


def open_file(path):
    """Show the chart in the system's default image viewer (best effort)."""
    try:
        if sys.platform == "darwin":
            subprocess.Popen(["open", path])
        elif os.name == "nt":
            os.startfile(path)  # noqa: S606 (Windows only)
        elif shutil.which("xdg-open") and (os.environ.get("DISPLAY") or os.environ.get("WAYLAND_DISPLAY")):
            subprocess.Popen(["xdg-open", path], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        else:
            print("(No desktop image viewer here - open the PNG above yourself.)")
            return
        print("Opened the first chart.")
    except Exception as e:  # never fail the run just because a viewer is missing
        print(f"(Could not open the chart automatically: {e})")


# ----------------------------------------------------------------------------- modes

def run_forecast(args, mk, predictor, df, lookback, word, intraday, model_label, stem, footer):
    hist = df.tail(lookback).reset_index(drop=True)
    fut_ts = future_timestamps(df["timestamps"], args.horizon, mk["interval"])
    print(f"Sampling {args.samples} paths x {args.horizon} candles from the last {len(hist)} candles ...")
    paths = sample_paths(predictor, hist, fut_ts, args.samples, args, progress=True)

    prefix = CURRENCY_PREFIX.get(mk["currency"], "")
    last_close, last_ts = float(hist["close"].iloc[-1]), hist["timestamps"].iloc[-1]
    ends = paths[:, -1]
    p10, p50, p90 = np.percentile(ends, [10, 50, 90])
    n_up = int((ends > last_close).sum())
    verb = "ends" if n_up == 1 else "end"
    unit = "" if prefix else f" (prices in {mk['currency']})"

    title = f"{mk['name']} · next {args.horizon} {word} candles"
    subtitle = (f"{model_label} read the last {len(hist)} candles (to {day(last_ts, intraday)}) and sampled {args.samples} "
                f"possible paths{unit}. After {args.horizon} candles the median path is at {money(p50, prefix)} "
                f"({pct(p50, last_close):+.1f}%); 80% of paths end between {money(p10, prefix)} and {money(p90, prefix)}. "
                f"{n_up} of {args.samples} paths {verb} higher than the last close.")
    chart = os.path.join(CHART_DIR, f"{stem}_forecast_{last_ts:%Y-%m-%d}.png")
    plot_forecast(chart, mk, hist.tail(args.show).reset_index(drop=True), fut_ts, paths, title, subtitle, footer)

    share = n_up / args.samples
    lean = ("most paths drift up" if share >= 0.7 else "most paths drift down" if share <= 0.3
            else "the paths are split, with no clear lean either way")
    lines = [
        f"{mk['name']} | {word} candles | {model_label} | {args.samples} sampled paths",
        f"Last close: {money(last_close, prefix)} on {day(last_ts, intraday)}" + unit
        + (f"  (left out the still-forming {day(mk['dropped'], intraday)} candle)" if mk["dropped"] is not None else ""),
        f"Next {args.horizon} candles (to about {day(fut_ts.iloc[-1], intraday)}):",
        f"  - Middle path ends at {money(p50, prefix)} ({pct(p50, last_close):+.1f}%)",
        f"  - 80% of paths end between {money(p10, prefix)} ({pct(p10, last_close):+.1f}%) "
        f"and {money(p90, prefix)} ({pct(p90, last_close):+.1f}%)",
        f"  - {n_up} of {args.samples} paths {verb} higher than the last close",
        f"In plain English: {lean}; 8 in 10 paths finish between {pct(p10, last_close):+.1f}% and "
        f"{pct(p90, last_close):+.1f}% from the last close. The spread is the message - the middle line is not a promise.",
        f"Chart: {os.path.relpath(chart)}",
        "Run the same command with --test to see how often this setup was right in the past.",
    ]
    return [chart], lines


def run_test(args, mk, predictor, df, lookback, word, intraday, model_label, stem, footer):
    from tqdm import tqdm

    H, W, n = args.horizon, args.windows, len(df)
    print(f"Test mode: {W} windows x {args.samples} paths x {H} candles. The bar shows the time left after "
          "the first window; --model mini or fewer --samples make it faster.")
    windows = []
    for k in tqdm(range(W - 1, -1, -1), desc="Windows", unit="win"):  # oldest first
        cut = n - (k + 1) * H  # first hidden candle
        hist = df.iloc[cut - lookback:cut].reset_index(drop=True)
        act = df.iloc[cut:cut + H].reset_index(drop=True)
        paths = sample_paths(predictor, hist, act["timestamps"], args.samples, args, progress=False)
        last_close = float(hist["close"].iloc[-1])
        a = act["close"].to_numpy(dtype=float)
        med = np.median(paths, axis=0)
        lo, hi = np.percentile(paths, [10, 90], axis=0)
        windows.append({
            "context": hist, "actual": act, "paths": paths, "last_close": last_close,
            "cutoff": hist["timestamps"].iloc[-1], "first_hidden": act["timestamps"].iloc[0],
            "last_hidden": act["timestamps"].iloc[-1], "actual_end": a[-1], "median_end": med[-1],
            "p10_end": lo[-1], "p90_end": hi[-1], "share_paths_up": float((paths[:, -1] > last_close).mean()),
            "forecast_up": med[-1] > last_close, "actual_up": a[-1] > last_close,
            "direction_right": (med[-1] > last_close) == (a[-1] > last_close),
            "kronos_err": float(np.mean(np.abs(med - a) / a) * 100),
            "naive_err": float(np.mean(np.abs(last_close - a) / a) * 100),
            "in_band": float(np.mean((a >= lo) & (a <= hi)) * 100),
        })

    hits = sum(w["direction_right"] for w in windows)
    ci_lo, ci_hi = wilson(hits, W)
    up_rate = np.mean([w["actual_up"] for w in windows])
    k_err, n_err = np.mean([w["kronos_err"] for w in windows]), np.mean([w["naive_err"] for w in windows])
    band = np.mean([w["in_band"] for w in windows])
    beat_dir = hits / W > max(0.5, up_rate) and ci_lo > 0.5
    beat_err = k_err < n_err
    if beat_dir and beat_err:
        verdict = ("Kronos beat both simple baselines here. Twenty windows is still a small sample, "
                   "so treat it as a hint, not proof.")
    elif beat_err:
        verdict = ("its paths were a little closer to reality than 'no change', but its up/down calls were "
                   "no better than the simple baselines.")
    elif beat_dir:
        verdict = "its up/down calls beat the baselines, but its price paths missed by more than 'no change' did."
    else:
        verdict = "no evidence of an edge: on this sample Kronos did not beat simple 'no change' / 'always up' baselines."

    latest = windows[-1]
    title = f"{mk['name']} · test mode: last {H} {word} candles hidden"
    subtitle = (f"{model_label} saw only the {lookback} candles up to {day(latest['cutoff'], intraday)} and sampled "
                f"{args.samples} paths for the next {H}. Black candles are what really happened. "
                f"Across all {W} test windows it called the direction right {hits}/{W} times.")
    ok = latest["direction_right"]
    vtext = (f"Direction {'right' if ok else 'wrong'} in this window: median said "
             f"{'up' if latest['forecast_up'] else 'down'} {pct(latest['median_end'], latest['last_close']):+.1f}%, "
             f"reality went {'up' if latest['actual_up'] else 'down'} {pct(latest['actual_end'], latest['last_close']):+.1f}%. "
             f"Average error {latest['kronos_err']:.1f}% vs {latest['naive_err']:.1f}% for 'no change'.")
    chart1 = os.path.join(CHART_DIR, f"{stem}_test_latest_{latest['last_hidden']:%Y-%m-%d}.png")
    shown = latest["context"].tail(max(args.show - H, 20)).reset_index(drop=True)
    plot_forecast(chart1, mk, shown, latest["actual"]["timestamps"], latest["paths"], title, subtitle, footer,
                  actual=latest["actual"], verdict=(ok, vtext))

    span = f"{windows[0]['first_hidden']:%Y-%m-%d} to {latest['last_hidden']:%Y-%m-%d}"
    summary = [f"Direction after {H} candles right in {hits}/{W} windows ({hits / W:.0%}, 95% range {ci_lo:.0%}-{ci_hi:.0%}). "
               f"Always guessing 'up' would have scored {up_rate:.0%}.",
               f"Average error of the median path {k_err:.1f}% vs {n_err:.1f}% for 'no change'. "
               f"The 80% band held {band:.0f}% of real closes (ideal ~80%). Windows cover {span}."]
    chart2 = os.path.join(CHART_DIR, f"{stem}_test_windows_{latest['last_hidden']:%Y-%m-%d}.png")
    grid = windows[-40:]  # a readable grid; the statistics above use every window
    shown_note = f" (latest {len(grid)} shown)" if len(grid) < W else ""
    plot_windows(chart2, mk, grid, f"{mk['name']} · {W} test windows of {H} hidden {word} candles · "
                 f"{model_label}{shown_note}", summary, footer, intraday)

    table = pd.DataFrame([{
        "cutoff": w["cutoff"], "first_hidden": w["first_hidden"], "last_hidden": w["last_hidden"],
        "last_close": w["last_close"], "actual_end": w["actual_end"], "median_end": w["median_end"],
        "p10_end": w["p10_end"], "p90_end": w["p90_end"], "share_paths_up": w["share_paths_up"],
        "forecast_dir": "up" if w["forecast_up"] else "down", "actual_dir": "up" if w["actual_up"] else "down",
        "direction_right": w["direction_right"], "kronos_err_pct": w["kronos_err"],
        "no_change_err_pct": w["naive_err"], "in_80pct_band_pct": w["in_band"]} for w in windows])
    csv = os.path.join(CHART_DIR, f"{stem}_test_windows_{latest['last_hidden']:%Y-%m-%d}.csv")
    table.round(4).to_csv(csv, index=False)

    lines = [
        f"{mk['name']} | {word} candles | {model_label} | {args.samples} paths per window",
        f"Test: {W} windows, each hiding {H} candles ({span}), each forecast from the {lookback} candles before it.",
        f"  - Direction after {H} candles: right {hits}/{W} ({hits / W:.0%}). With only {W} tries the honest "
        f"range is {ci_lo:.0%}-{ci_hi:.0%}; always guessing 'up' would have scored {up_rate:.0%}, a coin flip 50%.",
        f"  - Average error of the median path: {k_err:.1f}% of price, vs {n_err:.1f}% for simply assuming 'no change'.",
        f"  - The 80% band contained the real close {band:.0f}% of the time (a well-calibrated band would be ~80%).",
        f"In plain English: {verdict}",
        f"Charts: {os.path.relpath(chart1)}",
        f"        {os.path.relpath(chart2)}",
        f"Table:  {os.path.relpath(csv)}",
    ]
    return [chart1, chart2], lines


# ----------------------------------------------------------------------------- main

def main():
    try:  # a console that can't show a character prints "?" instead of crashing
        sys.stdout.reconfigure(errors="replace")
    except AttributeError:
        pass
    ap = argparse.ArgumentParser(
        description="Forecast the next candles of a ticker with Kronos (research/learning only, not advice).",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter)
    ap.add_argument("ticker", help="Yahoo ticker (NVDA, ^GSPC, 005930.KS, GC=F), XAU/XAG, crypto pair (BTC/USDT), "
                                   "or a CSV file such as a TradingView export")
    ap.add_argument("--interval", help="candle size: 15m, 1h, 4h (crypto), 1d (default), 1wk ...; "
                                       "a CSV uses its own spacing")
    ap.add_argument("--horizon", type=int, default=20, help="how many candles to forecast")
    ap.add_argument("--model", choices=list(MODELS), default="small", help="Kronos model size")
    ap.add_argument("--lookback", type=int, default=512, help="past candles fed to the model (capped at its context)")
    ap.add_argument("--samples", type=int, default=20, help="sampled paths (per window in test mode)")
    ap.add_argument("--test", action="store_true", help="test mode: hide the last candles, forecast them, score past windows")
    ap.add_argument("--windows", type=int, default=20, help="test windows (minimum 20)")
    ap.add_argument("--exchange", default="auto", help="crypto exchange id for ccxt, e.g. okx, upbit, kraken")
    ap.add_argument("--device", default="auto", help="auto (CUDA > Apple MPS > CPU), cpu, cuda, mps")
    ap.add_argument("--show", type=int, default=100, help="past candles drawn on the chart")
    ap.add_argument("--temperature", type=float, default=1.0, help="sampling temperature T (README default)")
    ap.add_argument("--top-p", type=float, default=0.9, help="nucleus sampling top_p (README default)")
    ap.add_argument("--seed", type=int, default=42, help="random seed, so the same command gives the same chart")
    ap.add_argument("--no-open", action="store_true", help="don't open the first chart when done")
    args = ap.parse_args()

    if args.test and args.windows < 20:
        print(f"Using 20 test windows (minimum), not {args.windows}.")
        args.windows = 20
    model_id, tokenizer_id, max_context = MODELS[args.model]
    lookback = min(args.lookback, max_context)
    if args.lookback > max_context:
        print(f"Lookback capped at {max_context} candles, the context limit of Kronos-{args.model}.")

    need = lookback + (args.windows * args.horizon if args.test else 0)
    if os.path.isfile(args.ticker):  # checked first: a path can contain "/" like a crypto pair
        print(f"Reading candles from {args.ticker} ...")
        mk = load_csv(args.ticker)
    else:
        symbol = resolve_symbol(args.ticker)
        if symbol != args.ticker.strip().upper():
            print(f"{args.ticker} -> {symbol}: Yahoo has no spot quote for it, so this uses COMEX futures "
                  "(USD per troy ounce), which track the spot price closely.")
        interval = args.interval or "1d"
        print(f"Downloading {interval} candles for {symbol} ...")
        if "/" in symbol:
            mk = load_crypto(symbol, interval, need, args.exchange)
        else:
            mk = load_yahoo(symbol, interval)
            mk["interval"] = interval
    df = mk["df"]
    intraday = is_intraday(mk["interval"])
    print(f"Got {len(df):,} candles from {mk['source']}: {day(df['timestamps'].iloc[0], intraday)} to "
          f"{day(df['timestamps'].iloc[-1], intraday)}.")
    if len(df) < need:
        short = lookback - (need - len(df))
        if short < 64:
            sys.exit(f"Not enough history: need {need} candles, have {len(df)}. Try a smaller --horizon, "
                     "a longer --interval, or (in test mode) the default number of windows.")
        print(f"Only {len(df)} candles available: using a lookback of {short} instead of {lookback}.")
        lookback = short

    import torch

    torch.manual_seed(args.seed)
    np.random.seed(args.seed)
    setup_matplotlib()
    print(f"Loading {model_id} + {tokenizer_id} ...")
    predictor = load_predictor(args.model, args.device)
    mps = hasattr(torch.backends, "mps") and torch.backends.mps.is_available()
    gpu = (f"NVIDIA {torch.cuda.get_device_name(0)}" if torch.cuda.is_available()
           else "Apple Silicon (MPS)" if mps else "none")
    print(f"Machine: {platform.system()} {platform.machine()} | Python {platform.python_version()} | "
          f"torch {torch.__version__} | GPU: {gpu} | running on: {predictor.device}")

    os.makedirs(CHART_DIR, exist_ok=True)
    word = INTERVAL_WORDS.get(mk["interval"], mk["interval"])
    model_label = f"Kronos-{args.model}"
    stem = re.sub(r"[^A-Za-z0-9.-]+", "_", mk["symbol"].replace("/", "-")).strip("_") + f"_{mk['interval']}_{args.model}"
    footer = (f"Data: {mk['source']}.  Model: {model_id} + {tokenizer_id} (Kronos, arXiv:2508.02739), "
              f"T={args.temperature}, top_p={args.top_p}, seed {args.seed}.  Future dates assume the market's usual "
              f"trading days.  Research and learning only - not financial advice.  "
              f"Made {datetime.now(timezone.utc):%Y-%m-%d %H:%M} UTC.")

    run = run_test if args.test else run_forecast
    charts, lines = run(args, mk, predictor, df, lookback, word, intraday, model_label, stem, footer)

    print("\n" + "=" * 100)
    print("\n".join(lines))
    print("Research and learning only. Not financial advice; this tool never trades or connects to a broker.")
    print("=" * 100)
    if not args.no_open:
        open_file(charts[0])


if __name__ == "__main__":
    main()
