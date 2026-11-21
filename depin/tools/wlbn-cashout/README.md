# WLBN 현금화 현황 — 계산 도구

대시보드(비공개): https://claude.ai/artifact/Jc7T4wgtdZ6nUXYTkCs21C
서우 11/21 요청 「일반사용자들이 얼마나 현금화 하는지 볼수있게 현황대시보드」.

공개 원장(XRPL)에서 WLBN 이 움직인 거래를 모두 읽어 지갑마다 수령 · 매도 · 매수 · 풀 예치를 더한다.
내부 현황용이다 — 숫자는 받은 시각의 사본이고, 대외 인용은 하지 않는다(발화 규칙은 `intel/playbook.md`).

## 파일

| 파일 | 하는 일 |
|---|---|
| `fetch_tx.py <계정> <출력.jsonl> [시작 원장] [끝 원장]` | 계정의 거래 내역 전체를 공개 노드에서 받는다. `XRPL_NODE` 로 노드 지정 |
| `metrics.py <작업 폴더> <출력 폴더> [-v]` | 대시보드가 읽는 JSON 다섯 개를 만든다. `-v` 는 검산 출력(`dl/lines.json` 이 있어야 한다) |

대시보드의 데이터 다섯 개(`summary` · `daily` · `wallets` · `groups` · `before`)는 `metrics.py` 가 만든 JSON 을 그대로 붙인 것이고,
각 파일의 `meta` 에 그때 돌린 `metrics.py` 본문이 들어 있다.

## 갱신 순서

```bash
S=<작업 폴더>; mkdir -p $S/dl $S/ext $S/data
export XRPL_NODE=https://s1.ripple.com/          # xrplcluster.com 은 시간당 한도에 걸린다(11/21)
T=depin/tools/wlbn-cashout
python3 $T/fetch_tx.py rDJz8WJhsKgydqJzSZXMpsJot3eRmSkR5 $S/dl/issuer_tx.jsonl      # 발행 계정 = WLBN 이 움직인 모든 거래
python3 $T/fetch_tx.py rpd3CDzqNRRkgJBMDwEKvzF4kKisbZLxVW $S/dl/amm_rlusd_tx.jsonl  # RLUSD 풀(가격 계산)
python3 $T/fetch_tx.py rpXbdqWU5RbCycRAcxinyX6cCsRnU5RXgm $S/dl/amm_xrp_tx.jsonl    # XRP 풀(가격 계산)
curl -sS https://wellbian.io/api/explorer  -o $S/ext/api_explorer.json
curl -sS https://wellbian.io/api/network   -o $S/ext/api_network.json
curl -sS https://wellbian.io/api/supply    -o $S/ext/api_supply.json
curl -sS https://wellbian.io/api/amm/fees  -o $S/ext/api_amm_fees.json
curl -sS https://api.dexscreener.com/latest/dex/pairs/xrpl/574C424E00000000000000000000000000000000.rDJz8WJhsKgydqJzSZXMpsJot3eRmSkR5_XRP -o $S/ext/dex.json
python3 -I $T/metrics.py $S $S/data
```

그다음 `data/*.json` 다섯 개를 대시보드에 다시 붙이고(파일 올리기 → 각 데이터의 파일 주소와 갱신 시각 교체) 화면 점검 결과를 읽는다.
화면(`index.html`)은 데이터 열 이름만 맞으면 그대로 둔다.

## 묶음 정의

- **회사 표시 계정** — wellbian.io `/api/explorer` 가 이름을 붙여 공개한 계정(treasury · operations · staking · seed · match · bot · kweather · 풀 두 곳).
  `kweather` 에는 10/24 까지 하루 약 9,500개씩 받던 지갑(`PRIOR_KW`)도 넣었다 — 10/27 같은 수량(408,325)이 kweather 표시 계정으로 재지급됐다.
- **일반 사용자 지갑** — 지급 계정(operations)에서 WLBN 을 받은 지갑과, 그 지갑에서 이체받은 지갑.
- **사고팔기만 한 지갑** — 수령 기록 없이 매수와 매도가 거의 같은 지갑(합 500개 초과 · 작은 쪽이 큰 쪽의 80% 이상).
- **그 밖의 지갑** — 나머지.
- 매도 = 거래 한 건에서 지갑의 WLBN 이 줄고 RLUSD · XRP 가 는 것. 한 거래 안의 경로 거래는 잔액이 안 바뀌므로 세지 않는다.
- 기간 — 이전 풀(10/2~10/24) / 지금(10/26 재지급 · 10/27 새 풀 이후). 경계는 `NOW_FROM`.

## 원장에서 확인된 것(11/21)

- 10/24 21시대(한국 시간) 지갑 39곳의 WLBN 606,608개가 한 주소(`SWEEP`)로 옮겨졌고, 그 주소가 이전 풀에서 팔아 89,461 RLUSD + 377 XRP 를 받았다.
  같은 날 23:46 이전 풀 인출, 10/26~27 지급 계정이 607,295개를 새 지갑으로 재지급, 10/27 새 풀 두 곳.
- 누가 한 일인지는 원장만으로 알 수 없다. 대시보드는 이 매도를 일반 사용자 지갑의 매도와 따로 적는다.

## 한계

- 지갑 주인은 모른다(한 사람이 여러 지갑을 쓸 수 있다). 원화로 바꿨는지 · 거래소로 보냈는지도 모른다.
- 수령에는 기기 보상 말고도 지급 계정이 지갑으로 보낸 모든 WLBN 이 들어 있다. 사이트의 claims 합계와 다르다(차이 원인 미확인).
- 원장 숫자와 사이트 · DexScreener 값은 받은 시각이 몇 분씩 다르다.
