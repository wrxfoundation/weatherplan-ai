# WLBN 현금화 현황 — 공개 원장(XRPL)에서 WLBN 이 움직인 모든 거래와 wellbian.io · DexScreener 공개 값으로 집계한다.
# 입력: 발행 계정의 거래 내역(= WLBN 잔액이 바뀐 모든 거래), 현재 풀 두 곳의 거래 내역(가격 계산용), 사이트 공개 API 응답.
# 날짜는 한국 시간. 지갑마다 거래 한 건에서 WLBN 이 줄고 RLUSD · XRP 가 늘면 매도, 반대면 매수로 센다.
# 한 거래 안에서 사고파는 경로 거래(지갑 잔액이 안 바뀜)는 매도 · 매수에 넣지 않는다.
import json, sys, datetime, collections, os, bisect
D = sys.argv[1]; OUT = sys.argv[2]
WL = '574C424E00000000000000000000000000000000'; RL = '524C555344000000000000000000000000000000'
ISSUER = 'rDJz8WJhsKgydqJzSZXMpsJot3eRmSkR5'; RL_ISSUER = 'rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De'
AMM_R = 'rpd3CDzqNRRkgJBMDwEKvzF4kKisbZLxVW'; AMM_X = 'rpXbdqWU5RbCycRAcxinyX6cCsRnU5RXgm'
OPS = 'rhTTtx8YyKzcmPDsoroYXuHdGMThrnweb1'          # 사이트 표시: operations (보상 지급 계정)
SWEEP = 'rajm3n7GwwFhvqUAVAWPQnB35njZaJ4y93'         # 10/24 밤 지갑 수십 곳의 잔액이 모인 주소
NOW_FROM = '2026-10-26'                              # 이 날짜부터 「지금 기간」(10/26 재지급, 10/27 새 풀)
EPOCH = datetime.datetime(2000, 1, 1); KST = datetime.timedelta(hours=9)
kday = lambda sec: (EPOCH + datetime.timedelta(seconds=sec) + KST).strftime('%Y-%m-%d')
ld = lambda f: json.load(open(os.path.join(D, f)))
ex, net, sup, fees, dex = ld('ext/api_explorer.json'), ld('ext/api_network.json'), ld('ext/api_supply.json'), ld('ext/api_amm_fees.json'), ld('ext/dex.json')['pairs'][0]
LABEL = {r['account']: r['label'] for r in ex['richList'] if r.get('label')}
for o in net.get('topOperators', []) + net.get('topEarners', []):
    if o.get('known') and o['known'] not in LABEL: LABEL[o['known']] = 'kweather'
LABEL[ISSUER] = 'issuer'
PRIOR_KW = 'rVDBQ8i1HjkkvtVpmCGqaYEmRuvaNevUG'           # 10/24 까지 하루 약 9,500개씩 받던 지갑. 10/27 같은 수량(408,325)이 kweather 표시 계정으로 재지급됨
LABEL[PRIOR_KW] = 'kweather'

def txs(f):
    seen = set()
    for line in open(os.path.join(D, f)):
        t = json.loads(line); tx = t.get('tx') or t.get('tx_json'); meta = t.get('meta')
        h = tx.get('hash') or t.get('hash')
        if h in seen or not meta or meta.get('TransactionResult') != 'tesSUCCESS': continue
        seen.add(h); yield tx, meta

def deltas(tx, meta):
    """거래 한 건이 지갑마다 바꾼 잔액: W(WLBN) · R(RLUSD) · X(XRP, 수수료 제외)."""
    d = collections.defaultdict(lambda: [0.0, 0.0, 0.0]); amms = set()
    for n in meta.get('AffectedNodes', []):
        kind = next(iter(n)); node = n[kind]; t = node.get('LedgerEntryType')
        fin = node.get('FinalFields') or node.get('NewFields') or {}; prev = node.get('PreviousFields') or {}
        if t == 'AccountRoot':
            a = fin.get('Account')
            if fin.get('AMMID'): amms.add(a)
            if kind == 'CreatedNode': d[a][2] += int(fin.get('Balance', 0)) / 1e6
            elif 'Balance' in prev: d[a][2] += (int(fin.get('Balance', 0)) - int(prev['Balance'])) / 1e6
        elif t == 'RippleState':
            cur = fin.get('Balance', {}).get('currency'); lo = fin.get('LowLimit', {}).get('issuer'); hi = fin.get('HighLimit', {}).get('issuer')
            if cur == WL and ISSUER in (lo, hi): i, iss = 0, ISSUER
            elif cur == RL and RL_ISSUER in (lo, hi): i, iss = 1, RL_ISSUER
            else: continue
            f = float(fin.get('Balance', {}).get('value', 0))
            if kind == 'CreatedNode': p = 0.0
            elif 'Balance' in prev: p = float(prev['Balance']['value'])
            else: continue
            if kind == 'DeletedNode': f = 0.0
            holder = hi if lo == iss else lo
            d[holder][i] += (f - p) * (1 if holder == lo else -1)
    d[tx['Account']][2] += int(tx.get('Fee', 0)) / 1e6
    return d, amms

# 1) 현재 풀 두 곳의 가격 흐름 (RLUSD 풀: WLBN 1개당 RLUSD, XRP 풀: WLBN 1개당 XRP → XRP 1개당 RLUSD)
def pool_series(f, amm, qi):
    w = q = 0.0; out = []
    for tx, meta in sorted(txs(f), key=lambda x: (x[0]['ledger_index'], x[0]['date'])):
        d, _ = deltas(tx, meta); v = d.get(amm)
        if not v: continue
        w += v[0]; q += v[qi] - (int(tx.get('Fee', 0)) / 1e6 if (qi == 2 and tx['Account'] == amm) else 0)
        if w > 0 and q > 0: out.append((tx['date'], q / w, w, q))
    return out
SR = pool_series('dl/amm_rlusd_tx.jsonl', AMM_R, 1); SX = pool_series('dl/amm_xrp_tx.jsonl', AMM_X, 2)
tR = [s[0] for s in SR]; tX = [s[0] for s in SX]
def pR(sec): return SR[max(bisect.bisect_right(tR, sec) - 1, 0)][1]
def xrp_rate(sec): return pR(sec) / SX[max(bisect.bisect_right(tX, sec) - 1, 0)][1]

# 2) 모든 거래를 지갑별 흐름으로
EPS = 1e-7
def P(): return collections.defaultdict(float)
st = {p: {k: P() for k in ('sold', 'bought', 'cash', 'cash_r', 'cash_x', 'spent', 'lpw', 'lpq', 'paid', 'paidco', 'tin', 'tout', 'esc', 'burn')} for p in ('before', 'now')}
last_sell = {}; edges = collections.defaultdict(set); bal = P(); AMMS = set(); paid_n = collections.Counter()
day = collections.defaultdict(lambda: collections.defaultdict(float)); day_sellers = collections.defaultdict(set); ev = []
asof = 0
for tx, meta in sorted(txs('dl/issuer_tx.jsonl'), key=lambda x: (x[0]['ledger_index'], x[0]['date'])):
    d, amms = deltas(tx, meta); AMMS |= amms; sec = tx['date']; k = kday(sec); per = 'now' if k >= NOW_FROM else 'before'; S = st[per]; ty = tx['TransactionType']
    asof = max(asof, sec)
    mv = {a: v for a, v in d.items() if abs(v[0]) > EPS and a != ISSUER}
    for a, v in mv.items(): bal[a] += v[0]
    if not mv: continue
    if ty.startswith('AMM'):
        for a, v in mv.items():
            if a in AMMS: continue
            S['lpw'][a] += -v[0]
            q = v[1] + v[2] * (xrp_rate(sec) if per == 'now' else 0)
            S['lpq'][a] += q; ev.append((k, a, 'lp', -v[0], q))
        continue
    if ty.startswith('Escrow'):
        for a, v in mv.items(): S['esc'][a] += -v[0]
        continue
    trade = any((v[0] > EPS and (v[2] < -1e-5 or v[1] < -EPS)) or (v[0] < -EPS and (v[2] > 1e-5 or v[1] > EPS)) for v in d.values())
    if not trade:
        neg = [(a, -v[0]) for a, v in mv.items() if v[0] < 0]; pos = [(a, v[0]) for a, v in mv.items() if v[0] > 0]
        src = neg[0][0] if len(neg) == 1 else None
        if not pos and src and tx.get('Destination') == ISSUER: S['burn'][src] += neg[0][1]
        for a, w in pos:
            if src == OPS and a not in LABEL: S['paid'][a] += w; paid_n[(per, a)] += 1; ev.append((k, a, 'paid', w, 0))
            else:
                S['tin'][a] += w
                if src == OPS: S['paidco'][a] += w
            if src: edges[src].add(a)
        for a, w in neg:
            if a != OPS or any(b in LABEL for b, _ in pos): S['tout'][a] += w
        continue
    for a, v in mv.items():
        if a in AMMS: continue
        if v[0] < 0:
            w = -v[0]; got = v[1] + v[2] * (xrp_rate(sec) if per == 'now' else 0)
            val = got if (got > 0 or per == 'before') else w * pR(sec)
            S['sold'][a] += w; S['cash'][a] += max(val, 0); S['cash_r'][a] += max(v[1], 0); S['cash_x'][a] += max(v[2], 0); last_sell[a] = k
            ev.append((k, a, 'sell', w, max(val, 0)))
        else:
            cost = -(v[1] + v[2] * (xrp_rate(sec) if per == 'now' else 0))
            S['bought'][a] += v[0]; S['spent'][a] += max(cost, 0); ev.append((k, a, 'buy', v[0], max(cost, 0)))

# 3) 지갑 분류 — 회사 표시 계정 / 10·24 일괄 이동 주소 / 보상을 받은 지갑(과 거기서 이체받은 지갑) / 사고팔기만 한 지갑
allp = lambda key, a: st['before'][key].get(a, 0) + st['now'][key].get(a, 0)
users = {a for p in st for a in st[p]['paid'] if a not in LABEL and a not in AMMS and a != SWEEP}
front = list(users)
while front:
    a = front.pop()
    for b in edges.get(a, ()):
        if b in LABEL or b in AMMS or b == SWEEP or b in users: continue
        users.add(b); front.append(b)
accts = set(bal) - AMMS - {ISSUER}
def group(a):
    lab = LABEL.get(a)
    if lab: return {'bot': 'bot', 'kweather': 'kweather'}.get(lab, 'company')
    if a == SWEEP: return 'sweep'
    if a in users: return 'user'
    s, b = allp('sold', a), allp('bought', a)
    if s + b > 500 and min(s, b) >= 0.8 * max(s, b): return 'arb'
    return 'other'
G = {a: group(a) for a in accts}
GR = ('user', 'arb', 'other', 'bot', 'kweather', 'company')
NAME = {'user': '일반 사용자 지갑', 'arb': '사고팔기만 한 지갑', 'other': '그 밖의 지갑', 'bot': 'bot 표시 계정', 'kweather': 'kweather 표시 계정',
        'company': '그 밖의 회사 표시 계정', 'sweep': '10월 24일 잔액이 모인 주소'}

# 4) 날짜별 (지금 기간)
for k, a, kind, w, v in ev:
    if k < NOW_FROM: continue
    g = G.get(a, 'other'); m = day[k]
    if kind == 'sell':
        m['sell_' + g] += w; m['sell_total'] += w
        if g == 'user': m['cash_user'] += v; day_sellers[k].add(a)
    elif kind == 'buy':
        m['buy_' + g] += w; m['buy_total'] += w
        if g == 'user': m['spent_user'] += v
    elif kind == 'paid' and g == 'user': m['paid_user'] += w
    elif kind == 'lp' and g == 'user': m['lp_user'] += w
eod = {}
for sec, p, _, _ in SR: eod[kday(sec)] = p
last_day = kday(asof); d0 = datetime.date.fromisoformat(NOW_FROM); days = []
while d0.isoformat() <= last_day: days.append(d0.isoformat()); d0 += datetime.timedelta(days=1)
rows_daily = []; cp = cs = 0.0; lastp = None
for k in days:
    v = day[k]; cp += v['paid_user']; cs += v['sell_user'] - v['buy_user']; lastp = eod.get(k, lastp)
    r = {'date': k}
    for g in GR: r['sell_' + g] = round(v['sell_' + g]); r['buy_' + g] = round(v['buy_' + g])
    r.update(sell_total=round(v['sell_total']), buy_total=round(v['buy_total']), net_sell_total=round(v['sell_total'] - v['buy_total']),
             net_sell_user=round(v['sell_user'] - v['buy_user']), cash_user_rlusd=round(v['cash_user']), spent_user_rlusd=round(v['spent_user']),
             user_sellers=len(day_sellers[k]), paid_user=round(v['paid_user']), lp_user=round(v['lp_user']),
             cum_paid_user=round(cp), cum_net_sold_user=round(cs), price_rlusd=round(lastp, 4) if lastp else None, partial=(k == last_day))
    rows_daily.append(r)

# 5) 보상을 받은 지갑별 (지금 기간)
N = st['now']; rows_wallets = []
ul = sorted(a for a in accts if G[a] == 'user')
for a in ul:
    act = N['paid'].get(a, 0) + N['tin'].get(a, 0) + N['sold'].get(a, 0) + N['bought'].get(a, 0) + abs(N['lpw'].get(a, 0))
    if act < 0.01 and bal.get(a, 0) < 0.01: continue
    lpq = N['lpq'].get(a, 0)
    rows_wallets.append({'wallet': a[:6] + '…' + a[-4:], 'paid': round(N['paid'].get(a, 0)), 'payouts': paid_n[('now', a)], 'moved_in': round(N['tin'].get(a, 0)), 'moved_out': round(N['tout'].get(a, 0)),
                         'sold': round(N['sold'].get(a, 0)), 'bought': round(N['bought'].get(a, 0)), 'net_sold': round(N['sold'].get(a, 0) - N['bought'].get(a, 0)),
                         'cash_rlusd': round(N['cash'].get(a, 0)), 'pool_in': round(N['lpw'].get(a, 0)), 'pool_cash_rlusd': round(max(lpq, 0)),
                         'balance': round(max(bal.get(a, 0), 0)), 'last_sell': last_sell.get(a, '') if last_sell.get(a, '') >= NOW_FROM else '', 'address': a})
rows_wallets.sort(key=lambda r: (-r['sold'], -r['paid']))

# 6) 묶음별 합계 (지금 기간 · 이전 풀 기간)
def grp_rows(per, order):
    S = st[per]; out = []
    for g in order:
        aa = [a for a in accts if G[a] == g and a != OPS and (S['sold'].get(a, 0) + S['bought'].get(a, 0) + S['paid'].get(a, 0) + S['paidco'].get(a, 0) > 0)]
        r = {'group': NAME[g], 'key': g, 'wallets': len(aa), 'sold': round(sum(S['sold'].get(a, 0) for a in aa)), 'bought': round(sum(S['bought'].get(a, 0) for a in aa))}
        r['net_sold'] = r['sold'] - r['bought']; r['paid'] = round(sum(S['paid'].get(a, 0) + S['paidco'].get(a, 0) for a in aa))
        if per == 'now': r['cash_rlusd'] = round(sum(S['cash'].get(a, 0) for a in aa))
        else: r['got_rlusd'] = round(sum(S['cash_r'].get(a, 0) for a in aa)); r['got_xrp'] = round(sum(S['cash_x'].get(a, 0) for a in aa))
        if r['wallets']: out.append(r)
    return out
rows_groups = grp_rows('now', GR)
rows_before = grp_rows('before', ('user', 'sweep', 'arb', 'other', 'bot', 'kweather'))
B = st['before']; sweep_from = sorted(((w, a) for a, w in B['tout'].items() if SWEEP in edges.get(a, ())), reverse=True)

# 7) 보상을 받은 지갑 전체 합계 (지금 기간)
u_paid = sum(N['paid'].get(a, 0) for a in ul); u_sold = sum(N['sold'].get(a, 0) for a in ul); u_bought = sum(N['bought'].get(a, 0) for a in ul)
u_lp = sum(N['lpw'].get(a, 0) for a in ul); u_bal = sum(max(bal.get(a, 0), 0) for a in ul)

# 8) 요약 한 줄
full = [r for r in rows_daily if not r['partial'] and r['date'] >= '2026-10-27']; last7 = full[-7:]; prev7 = full[-14:-7]
avg = lambda rows, key: round(sum(r[key] for r in rows) / len(rows)) if rows else None
md = lambda k: str(int(k[5:7])) + '/' + str(int(k[8:10]))
tb = sum(v['buy_total'] for v in day.values()); ts = sum(v['sell_total'] for v in day.values())
bot_b = sum(N['bought'].get(a, 0) for a in accts if G[a] == 'bot'); kw = [a for a in accts if G[a] == 'kweather']
u_cash = sum(N['cash'].get(a, 0) for a in ul); u_spent = sum(N['spent'].get(a, 0) for a in ul); u_lpcash = sum(max(N['lpq'].get(a, 0), 0) for a in ul)
repay = sum(w for k, a, kind, w, v in ev if kind == 'paid' and k == NOW_FROM and G.get(a) == 'user')
sw = next(r for r in rows_before if r['key'] == 'sweep'); bu = next(r for r in rows_before if r['key'] == 'user')
s7, p7 = avg(last7, 'sell_user'), avg(prev7, 'sell_user') if len(prev7) == 7 else None
summary = {
    'as_of': (EPOCH + datetime.timedelta(seconds=asof) + KST).strftime('%Y-%m-%d %H:%M'), 'period_from': NOW_FROM, 'last_day': last_day,
    'wallets': sum(1 for a in ul if N['paid'].get(a, 0) > 0), 'wallets_sold': sum(1 for a in ul if N['sold'].get(a, 0) > 0), 'wallets_holding': sum(1 for a in ul if bal.get(a, 0) >= 1),
    'user_paid': round(u_paid), 'user_repaid_1026': round(repay), 'user_paid_after': round(u_paid) - round(repay),
    'user_sold': round(u_sold), 'user_bought': round(u_bought), 'user_net_sold': round(u_sold) - round(u_bought),
    'user_sold_share': round(u_sold / u_paid, 3) if u_paid else None, 'user_sold_vs_new_paid': round(u_sold / (u_paid - repay), 3) if u_paid > repay else None,
    'user_cash_rlusd': round(u_cash), 'user_spent_rlusd': round(u_spent), 'user_pool_cash_rlusd': round(u_lpcash), 'user_avg_sell_price': round(u_cash / u_sold, 3) if u_sold else None,
    'user_pool_in': round(u_lp), 'user_balance': round(u_bal),
    'win_from': md(last7[0]['date']), 'win_to': md(last7[-1]['date']), 'user_sell_7d_avg': s7, 'user_sell_prev7d_avg': p7,
    'user_sell_7d_change': round(s7 / p7 - 1, 3) if p7 else None, 'user_paid_7d_avg': avg(last7, 'paid_user'), 'user_cash_7d_avg': avg(last7, 'cash_user_rlusd'), 'user_sellers_7d_avg': avg(last7, 'user_sellers'),
    'sell_total': round(ts), 'buy_total': round(tb), 'net_bought_total': round(tb) - round(ts), 'bot_bought': round(bot_b), 'bot_buy_share': round(bot_b / tb, 3) if tb else None,
    'net_sold_ex_bot': round(ts) - (round(tb) - round(bot_b)),
    'kweather_paid': round(sum(N['paidco'].get(a, 0) for a in kw)), 'kweather_repaid_1027': round(B['tout'].get(PRIOR_KW, 0)), 'kweather_sold': round(sum(N['sold'].get(a, 0) for a in kw)),
    'price_rlusd': round(SR[-1][1], 4), 'price_usd_dex': round(float(dex['priceUsd']), 4), 'xrp_per_wlbn': round(SX[-1][1], 4), 'xrp_rate_rlusd': round(SR[-1][1] / SX[-1][1], 4),
    'pool_r_wlbn': round(SR[-1][2]), 'pool_r_rlusd': round(SR[-1][3]), 'pool_x_wlbn': round(SX[-1][2]), 'pool_x_xrp': round(SX[-1][3]),
    'pool_value_rlusd': round(fees['all']['valueRlusd']), 'dex_h24_buys': dex['txns']['h24']['buys'], 'dex_h24_sells': dex['txns']['h24']['sells'], 'dex_h24_volume_usd': round(dex['volume']['h24']),
    'dex_liquidity_usd': round(dex['liquidity']['usd']), 'holders': ex['holders'], 'trustlines': ex['trustlines'], 'devices_total': net['devices']['total'], 'devices_active': net['devices']['active'],
    'operators': net['devices']['operators'], 'kweather_devices': max((o['devices'] for o in net['topOperators'] if LABEL.get(o.get('known')) == 'kweather'), default=0), 'earners': net['earnersTotal'],
    'site_claims_total': round(ex['claims']['total']), 'site_claims_count': ex['claims']['count'], 'epoch_budget': net['epochs'][0]['budget'], 'epoch_distributed': round(net['epochs'][0]['distributed']),
    'epoch_date': md(net['epochs'][0]['date']), 'circulating': round(sup['circulating']),
    'before_user_sold': bu['sold'], 'before_user_bought': bu['bought'],
    'sweep_sold': sw['sold'], 'sweep_got_rlusd': sw['got_rlusd'], 'sweep_got_xrp': sw['got_xrp'], 'sweep_from_wallets': len(sweep_from), 'sweep_largest_source': round(sweep_from[0][0]) if sweep_from else None,
    'repaid_total': round(repay) + round(B['tout'].get(PRIOR_KW, 0)),
}
code = open(__file__, encoding='utf8').read()
def meta(extra=()):
    return [{'label': 'metrics.py', 'value': code, 'type': 'code', 'lang': 'python'},
            {'label': '입력', 'value': 'XRPL 공개 노드(발행 계정 거래 내역 = WLBN 이 움직인 모든 거래, 현재 풀 두 곳의 거래 내역) · wellbian.io 공개 API(explorer · network · supply · amm/fees) · DexScreener API'},
            {'label': '기준 시각(한국 시간)', 'value': summary['as_of']}] + list(extra)
def dump(name, rows, extra=()):
    json.dump({'rows': rows, 'meta': meta(extra)}, open(os.path.join(OUT, name), 'w'), ensure_ascii=False, allow_nan=False)
dump('summary.json', [summary]); dump('daily.json', rows_daily); dump('wallets.json', rows_wallets); dump('groups.json', rows_groups); dump('before.json', rows_before)
if '-v' in sys.argv:
    print(json.dumps(summary, ensure_ascii=False, indent=1))
    for r in rows_groups: print('now', r)
    for r in rows_before: print('before', r)
    print('wallet rows', len(rows_wallets)); [print(' ', {k: v for k, v in r.items() if k != 'address'}) for r in rows_wallets[:14]]
    print('daily'); [print(' ', {k: r[k] for k in ('date', 'sell_user', 'buy_user', 'paid_user', 'cash_user_rlusd', 'user_sellers', 'sell_arb', 'sell_other', 'buy_bot', 'sell_total', 'buy_total', 'cum_paid_user', 'cum_net_sold_user', 'price_rlusd')}) for r in rows_daily]
    lines = {l['account']: -float(l['balance']) for l in ld('dl/lines.json')}
    diff = sorted(((abs(bal.get(a, 0) - v), a, round(bal.get(a, 0), 2), round(v, 2)) for a, v in lines.items()), reverse=True)[:6]; print('balance check (largest gaps vs trust-line snapshot)', diff)
    print('sweep sources', [(round(w), a[:7]) for w, a in sweep_from[:6]], 'n', len(sweep_from))
