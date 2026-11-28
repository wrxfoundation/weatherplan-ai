# 계정의 전체 거래 내역을 공개 노드에서 받아 한 줄에 한 건씩 저장한다.
import json, subprocess, sys, time, os
ENDPOINT = os.environ.get('XRPL_NODE', 'https://xrplcluster.com/')
acct, out = sys.argv[1], sys.argv[2]
LMIN = int(sys.argv[3]) if len(sys.argv) > 3 else -1
LMAX = int(sys.argv[4]) if len(sys.argv) > 4 else -1
marker = None; n = 0
with open(out, 'w') as f:
    while True:
        p = {"account": acct, "ledger_index_min": LMIN, "ledger_index_max": LMAX, "limit": 400, "forward": True}
        if marker: p["marker"] = marker
        body = json.dumps({"method": "account_tx", "params": [p]})
        for attempt in range(4):
            r = subprocess.run(['curl', '-sS', '-m', '60', '-H', 'Content-Type: application/json', '-d', body, ENDPOINT], capture_output=True, text=True)
            try:
                res = json.loads(r.stdout)['result']; break
            except Exception:
                time.sleep(2 * (attempt + 1)); res = None
        if res and res.get('error') == 'tooBusy':
            print('rate limit, wait', flush=True); time.sleep(20); continue
        if not res or res.get('status') != 'success':
            print('ERR', (r.stdout or r.stderr)[:200]); break
        for t in res['transactions']:
            f.write(json.dumps(t) + '\n'); n += 1
        marker = res.get('marker')
        time.sleep(0.3)
        if not marker: break
        if n % 4000 == 0: print(n, flush=True)
print(acct, 'total', n)
