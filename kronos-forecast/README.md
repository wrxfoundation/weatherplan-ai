# Kronos 캔들 예측 도구 (연구·학습용)

[Kronos](https://github.com/shiyu-coder/Kronos)(금융 캔들 전용 오픈소스 파운데이션 모델, [arXiv:2508.02739](https://arxiv.org/abs/2508.02739))로
원하는 티커의 다음 캔들을 **여러 개의 가능한 경로**로 예측합니다. 결과는 차트(PNG)와 짧은 영어 요약으로 나옵니다.
테스트 모드는 과거 구간을 가린 채 예측하고 실제 결과와 비교해서, 얼마나 자주 맞았는지 있는 그대로 보여줍니다.

> ⚠️ 연구·학습용입니다. 매매를 하지 않고, 브로커·거래소 계정에 연결하지 않으며, API 키도 쓰지 않습니다.
> 출력은 투자 조언이 아닙니다.

## 설치 (내 컴퓨터, 한 번만)

필요한 것: **Python 3.10–3.12**, git.
Kronos가 `pandas==2.2.2`를 고정하는데, 이 버전에는 Python 3.13용 설치 파일이 없어서 3.12 이하가 필요합니다.

**macOS / Linux**

```bash
cd kronos-forecast
./setup.sh
```

`setup.sh`가 하는 일은 다음과 같습니다.

1. OS, Python, GPU(NVIDIA / Apple Silicon)를 확인합니다.
2. 공식 Kronos 저장소를 `Kronos/`에 클론합니다. 테스트한 커밋으로 고정합니다.
3. `.venv` 가상환경을 만듭니다.
4. 공식 README대로 `pip install -r Kronos/requirements.txt`를 실행합니다.
5. 데이터용 `yfinance`와 `ccxt`를 설치합니다.

GPU가 없는 Linux에서는 공식 PyTorch CPU 빌드를 먼저 설치해서 약 3GB의 CUDA 파일을 받지 않습니다.

**Windows (PowerShell)**

```powershell
cd kronos-forecast
git clone https://github.com/shiyu-coder/Kronos.git Kronos
git -C Kronos checkout 67b630e67f6a18c9e9be918d9b4337c960db1e9a
py -3.12 -m venv .venv
.venv\Scripts\python -m pip install -r Kronos\requirements.txt
.venv\Scripts\python -m pip install yfinance ccxt
```

Windows에서 PyPI 기본 torch는 CPU 전용입니다. NVIDIA GPU를 쓰려면 위 설치 전에
[pytorch.org](https://pytorch.org/get-started/locally/)에서 안내하는 CUDA용 torch 설치 명령을 먼저 실행하세요.

처음 실행할 때 Hugging Face에서 모델을 내려받습니다(Kronos-small 약 100MB).

## 치트시트

macOS/Linux 기준입니다. Windows에서는 `.venv/bin/python` 대신 `.venv\Scripts\python`을 쓰세요.

| 하고 싶은 것 | 명령 |
|---|---|
| 금(XAU/USD) 예측 | `.venv/bin/python forecast.py XAU` |
| 새 티커 예측 | `.venv/bin/python forecast.py NVDA` (`TSLA`, `^GSPC` S&P 500, `005930.KS` 삼성전자, `GLD` 등) |
| 크립토 페어 | `.venv/bin/python forecast.py BTC/USDT` (`ETH/USDT`, `BTC/KRW` 업비트 등) |
| TradingView CSV로 예측 | `.venv/bin/python forecast.py "BINANCE_XRPUSDT, 5.csv" --horizon 24` (아래 CSV 메모 참고) |
| 내 신호에 Kronos 의견 붙여 채점 | `.venv/bin/python signal_check.py "BINANCE_XRPUSDT, 5.csv"` (아래 신호 검증 참고) |
| 테스트 모드 (과거 20개 구간 채점) | 위 명령 끝에 `--test` |
| 시간 프레임 바꾸기 | `--interval 1h` (기본 `1d`. 주식은 `5m 15m 30m 1h 1d 1wk 1mo`, 크립토는 `4h`도 가능) |
| 예측 길이 바꾸기 | `--horizon 10` (기본 20캔들) |
| 모델 크기 바꾸기 | `--model mini` (빠름, 4.1M) / `small` (기본, 24.7M) / `base` (느림, 102.3M) |
| 경로 개수 | `--samples 50` (기본 20) |
| 크립토 거래소 지정 | `--exchange upbit` (기본 `auto`: binance → okx → coinbase → kraken → bybit → upbit → bithumb 순서) |
| CPU 강제 | `--device cpu` (기본 auto: NVIDIA → Apple Silicon → CPU) |
| 차트 자동 열기 끄기 | `--no-open` |
| 전체 옵션 | `.venv/bin/python forecast.py --help` |

예를 들어 비트코인 1시간봉 다음 24개를 빠른 모델로 예측하고 테스트까지 하려면:

```bash
.venv/bin/python forecast.py BTC/USDT --interval 1h --horizon 24 --model mini --test
```

## CSV 입력 (TradingView "차트 데이터 내보내기")

- 티커 자리에 CSV 경로를 넣으면 됩니다. 실제로 매매하는 차트(XAUUSD 현물, SIL1! 등)를 그대로 쓸 수 있습니다.
- 필요한 열은 `time`, `open`, `high`, `low`, `close`이고, 나머지 지표 열은 무시합니다.
- 봉 간격(5분, 1시간 등)은 시간 열에서 자동으로 알아냅니다.
- 시간대는 내보낸 그대로 씁니다. 예를 들어 `+09:00`이면 KST로 표시됩니다.
- 거래량은 차트에 TradingView **Volume 지표를 켜고** 내보내야 포함됩니다. 없으면 가격만으로 예측합니다.
- 내보낸 시점의 마지막 봉이 아직 형성 중이었다면 그 봉도 그대로 들어갑니다.

## 신호 검증 (`signal_check.py`)

CSV에 들어 있는 내 신호 열마다 Kronos 의견을 붙여서 채점합니다. 기본 열 이름은 `GO LONG`, `GO SHORT`이고, 바꾸려면
`--long-col "Bullish Cross" --short-col "Bearish Cross"`처럼 지정합니다. 각 신호는 이렇게 처리합니다.

- Kronos는 그 신호 봉까지만 봅니다. 미래 데이터는 보지 않습니다.
- 결과는 신호 다음 `--hold 24`봉 보유, 그 사이 `--stop 1.0`% 하드스탑 규칙으로 계산합니다. 수수료는 넣지 않습니다.
- 다음 그룹들의 승률·평균 수익·PF를 비교합니다:
  - 전체 신호
  - Kronos 동의 / 반대
  - 거부권 적용(`--veto 0.25`: 경로의 75% 이상이 반대하면 제외)
  - 단순 추세 필터
  - LONG / SHORT
- 신호별 표는 `charts/<종목>_<봉>_<모델>_signals_*.csv`에 저장됩니다.

## 결과물 (`charts/` 폴더)

- `<티커>_<봉>_<모델>_forecast_<마지막캔들날짜>.png`: 과거 캔들, 샘플 경로 20개, 중간 50%·80% 범위, 중앙값.
- 테스트 모드:
  - `..._test_latest_*.png`: 가장 최근 구간의 예측과 실제 비교.
  - `..._test_windows_*.png`: 20개 구간 전체.
  - `..._test_windows_*.csv`: 구간별 수치.
- 터미널에는 짧은 영어 요약이 나오고, 첫 번째 차트가 자동으로 열립니다.

## 테스트 모드가 재는 것

마지막 N개(`--horizon`) 캔들을 가리고 예측한 뒤 실제와 비교합니다. 이것을 서로 겹치지 않는 과거 구간 20개 이상에서 반복합니다.

- **방향 적중률**: N캔들 뒤 중앙값 경로가 오를지 내릴지 맞혔는지. 시도가 20번뿐이라 95% 신뢰구간을 함께 보여주고,
  "항상 상승"으로 찍는 경우와 동전 던지기(50%)와 비교합니다.
- **평균 오차**: 중앙값 경로의 평균 절대 % 오차를, "변화 없음"(마지막 종가 유지) 예측의 오차와 비교합니다.
- **80% 범위 적중률**: 실제 종가가 80% 범위 안에 들어간 비율입니다. 잘 보정된 모델이라면 약 80%가 나와야 합니다.

## 금(XAU) 메모

- Yahoo Finance에는 현물 XAU/USD 시세가 없습니다(`XAUUSD=X` → "Quote not found").
  그래서 `XAU`, `XAUUSD`, `XAU/USD`는 **COMEX 금 선물 `GC=F`(USD/트로이온스)**로 연결됩니다.
  현물과의 차이는 작지만, 근월물이 바뀔 때(롤오버) 가격이 조금 튈 수 있습니다. 은도 같은 방식입니다(`XAG` → `SI=F`).
- `^XAU`는 금 가격이 아니라 **금광주 지수**(PHLX Gold/Silver Sector)이니 주의하세요.
- 대안: `GLD`(금 ETF), `PAXG/USDT`·`XAUT/USDT`(금 1온스 토큰, 24시간 거래).

## 소요 시간 (참고: 4코어 CPU, GPU 없음)

| | Kronos-mini | Kronos-small |
|---|---|---|
| 예측 (경로 20개 × 20캔들) | 23초 | 71초 |
| 테스트 (20구간 × 경로 20개 × 20캔들) | 약 6분 (추정) | 22분 |

데이터 다운로드와 모델 로딩 시간을 포함한 값입니다. NVIDIA GPU나 Apple Silicon에서는 훨씬 빠릅니다.
느리면 `--model mini`나 `--samples 10`을 쓰세요.

## 첫 실행 결과: 금 테스트 (2026-10-21, Kronos-small, 기본 설정)

2025-03 ~ 2026-10 사이 20개 구간(각 20거래일)을 채점했습니다.

- **방향 적중률 9/20 (45%)**: 95% 신뢰구간은 26–66%이고, "항상 상승"으로 찍어도 50%였습니다.
- **평균 오차 12.6%**: "변화 없음" 예측의 오차는 3.9%였습니다.
- **80% 범위 적중률 24%**: 잘 보정됐다면 약 80%가 나와야 합니다.

정리하면, 이 기간 금에서는 단순한 기준보다 나았다는 증거가 없습니다.

원인도 확인했습니다. 금이 2년 평균보다 크게 높았던 2025~2026년 초의 기록적 상승장 내내,
Kronos는 매번 한 달에 10–30%씩 급락하는 경로를 예측했습니다. 공식 `predict()` API로 직접 돌려도 같은 결과였고,
가격만 넣었을 때, 입력을 256개로 줄였을 때, mini/base 모델로 바꿨을 때도 마찬가지였습니다. 코드 버그가 아니라 모델의 성향입니다.
2026년 중반 이후 횡보 구간에서는 예측이 훨씬 현실적이었습니다.
다른 티커와 기간에서는 결과가 다를 수 있으니, 예측을 보기 전에 `--test`부터 돌려 보세요.

## CSV 첫 테스트: XRPUSDT 5분봉 (2026-08-13 ~ 08-21, Kronos-small, 24봉)

이 기간 XRP는 8일 동안 +36% 오른 강한 상승장이었습니다.

**테스트 모드** (77구간, 경로 11개):
- 방향 적중률 41/77 (53%, 95% 신뢰구간 42–64%)로, "항상 상승"으로 찍은 60%보다 낮았습니다.
- 평균 오차 0.7%로, "변화 없음" 0.6%보다 컸습니다.
- 80% 범위 적중률은 41%에 그쳤습니다.
- 원인: 큰 추세 직후 구간에서 Kronos 경로의 봉당 움직임이 실제보다 5–36배 작았습니다.
  그래서 Kronos의 경로 폭은 손절이나 포지션 크기 산정에 쓰면 안 됩니다.

**`Bullish/Bearish Cross` 27개 검증** (LONG/SHORT로 해석, 24봉 보유, −1% 스탑, 수수료 제외):

| 그룹 | 거래 수 | PF | 평균 수익 |
|---|---|---|---|
| 전체 | 27 | 0.96 | |
| 거부권 적용 | 14 | 1.42 | +0.04%/거래 |
| 단순 추세 필터 | 19 | 0.64 | |

거부권 결과는 숫자만 보면 좋아 보이지만 다음 이유로 아직 쓸 수 없습니다.

- Kronos 동의율이 LONG 0.71, SHORT 0.10이었습니다. 즉 거부권은 사실상 "상승장에서 숏 금지" 역할을 했습니다.
- 거래당 +0.04%는 왕복 수수료(약 0.1%)보다 작습니다.
- 거래 14개는 판단하기에 너무 적습니다.

결론: 아직 근거가 부족합니다. Volume 지표를 켜고 더 긴 기간, 실제 `GO LONG/SHORT` 신호가 나온 데이터로 다시 확인해야 합니다.

## 구현 메모

- 공식 README의 사용법(`KronosTokenizer` / `Kronos.from_pretrained` → `KronosPredictor`)을 그대로 따릅니다.
  모델 이름은 README의 Model Zoo 표에서 가져왔고, 실제로 내려받아 확인했습니다.
- `.eval()` 추가: Hugging Face의 safetensors 로더는 모델을 학습 모드(드롭아웃이 켜진 상태)로 남겨 둡니다.
  Kronos 저자들의 추론 코드(`finetune/qlib_test.py`, `tests/`)와 똑같이 `.eval()`을 붙였습니다.
  이 설정으로 공식 회귀 테스트(context 512)를 재현해 통과했습니다(최대 상대오차 6e-7, 허용치 1e-5).
- 경로 분포: `predict(sample_count=k)`는 k개 샘플의 **평균 한 줄**만 돌려줍니다.
  그래서 같은 입력을 `predict_batch`에 N번 넣어(`sample_count=1`) 독립된 경로 N개를 얻습니다.
- 입력 길이는 모델의 컨텍스트 한도(small/base 512, mini 2048) 안으로 맞춥니다.
  아직 만들어지는 중인 마지막 캔들(장중 일봉 등)은 빼고 예측합니다.
- 미래 날짜는 최근 8주 동안 실제로 거래가 있었던 요일과 시간대를 따라 만듭니다. 휴장일은 반영하지 않습니다.
- 같은 명령은 항상 같은 결과를 냅니다(`--seed 42`).
