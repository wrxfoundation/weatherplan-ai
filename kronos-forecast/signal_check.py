#!/usr/bin/env python3
"""Does Kronos agree with your signals, and does its agreement predict how they turn out?

Reads a CSV export (e.g. TradingView "Export chart data") that has signal columns, runs Kronos
at every signal seeing only the candles up to that signal, then scores each signal with a fixed
hold and a hard stop. Compares all signals with those Kronos agrees with, those a veto would keep,
and a plain trend filter, so you can see whether Kronos adds anything.

    python signal_check.py "BINANCE_XRPUSDT, 5.csv"                       # GO LONG / GO SHORT columns
    python signal_check.py export.csv --long-col "Bullish Cross" --short-col "Bearish Cross"

For research and learning only: no trades, no broker, not financial advice.
"""
import argparse
import os
import sys
import types

import numpy as np
import pandas as pd

import forecast as F


def score(group):
    """n, win rate, average return per trade (%), profit factor."""
    r = group["ret_pct"]
    if r.empty:
        return 0, float("nan"), float("nan"), float("nan")
    wins, losses = r[r > 0].sum(), -r[r < 0].sum()
    return len(r), (r > 0).mean(), r.mean(), wins / losses if losses > 0 else float("inf")


def main():
    try:
        sys.stdout.reconfigure(errors="replace")
    except AttributeError:
        pass
    ap = argparse.ArgumentParser(description="Score your signals with and without Kronos's opinion (research only).",
                                 formatter_class=argparse.ArgumentDefaultsHelpFormatter)
    ap.add_argument("csv", help="CSV export with time, open, high, low, close and signal columns")
    ap.add_argument("--long-col", default="GO LONG", help="column that is non-empty/non-zero on a long signal")
    ap.add_argument("--short-col", default="GO SHORT", help="column that is non-empty/non-zero on a short signal")
    ap.add_argument("--hold", type=int, default=24, help="candles held after each signal")
    ap.add_argument("--stop", type=float, default=1.0, help="hard stop in %% (hit anywhere in the hold = loss of this)")
    ap.add_argument("--veto", type=float, default=0.25, help="veto a signal when at most this share of paths agrees")
    ap.add_argument("--model", choices=list(F.MODELS), default="small", help="Kronos model size")
    ap.add_argument("--samples", type=int, default=11, help="sampled paths per signal (odd numbers avoid ties)")
    ap.add_argument("--lookback", type=int, default=512, help="candles Kronos sees before each signal")
    ap.add_argument("--device", default="auto", help="auto (CUDA > Apple MPS > CPU), cpu, cuda, mps")
    ap.add_argument("--seed", type=int, default=42, help="random seed, so reruns give the same table")
    args = ap.parse_args()

    mk = F.load_csv(args.csv, extra=(args.long_col, args.short_col))
    df, n = mk["df"], len(mk["df"])
    lookback, stop = min(args.lookback, F.MODELS[args.model][2]), args.stop / 100
    signals = sorted((i, side) for col, side in ((args.long_col, 1), (args.short_col, -1))
                     for i in np.flatnonzero(pd.to_numeric(df[col], errors="coerce").fillna(0).to_numpy() != 0))
    if not signals:
        sys.exit(f"No signals: {args.long_col!r} and {args.short_col!r} are empty or 0 on every row.")
    usable = [(i, side) for i, side in signals if lookback - 1 <= i < n - args.hold]
    if not usable:
        sys.exit(f"All {len(signals)} signals are within {lookback} candles of the start or {args.hold} of the end.")

    import torch

    torch.manual_seed(args.seed)
    np.random.seed(args.seed)
    print(f"Loading Kronos-{args.model} ...")
    predictor = F.load_predictor(args.model, args.device)
    sampling = types.SimpleNamespace(temperature=1.0, top_p=0.9)  # README defaults, as in forecast.py
    trend = df["close"].rolling(lookback).mean()

    from tqdm import tqdm

    rows = []
    for i, side in tqdm(usable, desc="Signals", unit="sig"):
        hist = df.iloc[i - lookback + 1:i + 1].reset_index(drop=True)  # up to and including the signal candle
        after = df.iloc[i + 1:i + 1 + args.hold].reset_index(drop=True)
        paths = F.sample_paths(predictor, hist, after["timestamps"], args.samples, sampling, progress=False)
        entry = float(hist["close"].iloc[-1])
        if side > 0:
            stopped = after["low"].min() <= entry * (1 - stop)
            mfe, mae = after["high"].max() / entry - 1, 1 - after["low"].min() / entry
        else:
            stopped = after["high"].max() >= entry * (1 + stop)
            mfe, mae = 1 - after["low"].min() / entry, after["high"].max() / entry - 1
        held = side * (after["close"].iloc[-1] / entry - 1)
        rows.append({"time": hist["timestamps"].iloc[-1], "side": "LONG" if side > 0 else "SHORT", "entry": entry,
                     "kronos_agree": float(np.mean(np.sign(paths[:, -1] - entry) == side)),
                     "kronos_median_ret_pct": side * (np.median(paths[:, -1]) / entry - 1) * 100,
                     "with_trend": bool((entry > trend.iloc[i]) == (side > 0)),
                     "stopped": bool(stopped), "ret_pct": (-stop if stopped else held) * 100,
                     "mfe_pct": mfe * 100, "mae_pct": mae * 100})
    res = pd.DataFrame(rows)

    groups = [("all signals", res),
              ("Kronos agrees (majority of paths)", res[res.kronos_agree > 0.5]),
              ("Kronos disagrees", res[res.kronos_agree < 0.5]),
              (f"veto: drop if <={args.veto:.0%} of paths agree", res[res.kronos_agree > args.veto]),
              (f"trend filter (vs {lookback}-candle average)", res[res.with_trend]),
              ("LONG only", res[res.side == "LONG"]),
              ("SHORT only", res[res.side == "SHORT"])]
    table = [(label, *score(g)) for label, g in groups]
    _, _, all_avg, all_pf = table[0][1:]
    _, _, kept_avg, kept_pf = table[3][1:]
    agree_by_side = res.groupby("side")["kronos_agree"].mean()

    os.makedirs(F.CHART_DIR, exist_ok=True)
    stem = f"{mk['symbol']}_{mk['interval']}_{args.model}"
    out = os.path.join(F.CHART_DIR, f"{stem}_signals_{df['timestamps'].iloc[-1]:%Y-%m-%d}.csv")
    res.round(4).to_csv(out, index=False)

    word = F.INTERVAL_WORDS.get(mk["interval"], mk["interval"])
    print("\n" + "=" * 100)
    print(f"{mk['name']} | {word} candles | Kronos-{args.model} | {args.samples} paths per signal")
    print(f"{len(signals)} signals in the file, {len(res)} scored ({len(signals) - len(res)} too close to the start "
          f"or end). Each: hold {args.hold} candles, -{args.stop:.1f}% hard stop, no fees or slippage.")
    print(f"  {'':44s}{'n':>4s}{'win':>7s}{'avg/trade':>12s}{'PF':>7s}")
    for label, cnt, win, avg, pf in table:
        print(f"  {label:44s}{cnt:4d}" + (f"{win:7.0%}{avg:+11.3f}%{pf:7.2f}" if cnt else ""))
    sides = ", ".join(f"{s} {v:.2f}" for s, v in agree_by_side.items())
    print(f"Average Kronos agreement by side: {sides}.")
    lopsided = len(agree_by_side) == 2 and abs(agree_by_side.max() - agree_by_side.min()) >= 0.4
    note = (" Kronos agreed with one side far more than the other, so the veto mostly acts as a direction filter."
            if lopsided else "")
    if table[3][1] < 30:
        verdict = f"the veto kept {table[3][1]} of {len(res)} signals - far too few to trust either way."
    elif kept_pf > all_pf and kept_avg > all_avg:
        verdict = "the veto improved these signals on this sample; confirm it on newer data before relying on it."
    else:
        verdict = "the veto did not improve these signals on this sample."
    print(f"In plain English: {verdict}{note} Fees are not included; a round trip often costs ~0.1% or more, "
          f"so compare that with the avg/trade column.")
    print(f"Table: {os.path.relpath(out)}")
    print("Research and learning only. Not financial advice.")
    print("=" * 100)


if __name__ == "__main__":
    main()
