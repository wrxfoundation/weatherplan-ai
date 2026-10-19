"""어필리에이트 컨택 리스트 xlsx (10/19).

정본은 intel/business-directions.md 의 「어필리에이트 회사 임직원 컨택 후보」(10/18) ·
「어필리에이트 네트워크 — 전 세계 유력 리스트」 · 「vCommission 묶음」 · Disha 절(10/19).
연락처(메일 · 전화 · 프로필 주소)는 넣지 않는다 — 공개 직함 · 소속 · 판정만.

    python3 depin/tools/build-affiliate-contacts-xlsx.py depin/content/affiliate-contacts-1019.xlsx
"""
import sys
from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.worksheet.datavalidation import DataValidation

OUT = sys.argv[1]
FONT = "Arial"
HEAD_FILL = PatternFill("solid", fgColor="1B1B48")
NOTE_FILL = PatternFill("solid", fgColor="FFF7D6")
THIN = Side(style="thin", color="C8C8DA")
BOX = Border(left=THIN, right=THIN, top=THIN, bottom=THIN)
STATUSES = ["진행 중", "1촌 대기", "미접촉", "보류", "제외", "완료", "미정", "확인 중"]

NETWORKS = [
    # 순위, 회사, 지역, 경로, 왜 유력, 걸리는 것, 찾을 직함, 상태, 다음 할 일
    (1, "impact.com", "전 세계", "플랫폼(우리 프로그램)",
     "크립토 브랜드 선례 — Kraken 이 매체 · 어필리에이트 트랙을 impact.com 에서 운영(법정화폐 지급). 나라 · 퍼블리셔를 우리가 고른다",
     "플랫폼 비용 · 크립토 연관 광고주 심사", "Partnerships / Strategic Accounts — APAC", "미접촉", "배송 국가 정한 뒤 데모 요청"),
    (2, "Involve Asia", "동남아(쿠알라룸푸르)", "네트워크",
     "Trezor(하드웨어 지갑) 프로그램이 이 네트워크로도 돈다 — 크립토 연관 하드웨어 선례",
     "동남아 배송 국가", "Head of Partnerships · Advertiser BD · Country Manager", "미접촉", "링크드인 직함 찾기"),
    (3, "vCommission", "인도 · 싱가포르 · UAE · 영국 · 미국", "네트워크",
     "성과형만 · 가입비 없음 · 크립토 업종 언급 · Adways 계열 · 퍼블리셔 쪽 직원(Disha)이 광고주 팀 연결 제안",
     "크립토 광고주 정책 문서 없음 · 인도 배송 · 정산 통화(기본 INR)", "Director · Advertiser BD", "진행 중",
     "Disha 메일 주소 받으면 광고주 정보 메일 발송(질문 5 포함)"),
    (4, "Optimise Media", "싱가포르 · 인도네시아 · 홍콩 · 베트남 · 필리핀 · 영국", "네트워크",
     "싱가포르 거점(우리 법인과 같은 도시) · 아시아 다국가", "크립토 정책 미확인 · 사무소 정보 2019 기준", "Client Partnerships · Advertiser Sales", "미접촉", "vCommission 결과 보고 2순위로"),
    (5, "ACCESSTRADE", "일본 · 동남아", "네트워크",
     "일본 · 말레이 · 베트남 · 인도네시아 강세 · 일본 확장 때 그대로", "일본은 전파법 인증(기기) 전 캠페인 0", "Global BD · Advertiser Sales", "미접촉", "일본 인증 상태 확인 뒤"),
    (6, "Awin · Commission Factory(APAC)", "유럽 · 미국 · 호주", "네트워크",
     "실물 상품 광고주에 강함 · 대형 퍼블리셔 풀", "크립토 연관 심사 보수적일 가능성 · 유럽 기기 인증(CE/RED)", "New Business — APAC / EU", "미접촉", "유럽 · 호주 배송 정한 뒤"),
    (7, "A8.net · ValueCommerce", "일본", "네트워크",
     "A8 광고주 대시보드 영문 · 광고주 2.7만(자체) · ValueCommerce 해외 광고주 일본 진출 이력", "일본 법인 · 세무 요건 미확인 · 전파법 인증", "Global / Overseas Sales", "미접촉", "일본 인증 상태 확인 뒤"),
    (8, "Admitad", "전 세계(인도 · 중동 · 동유럽)", "네트워크",
     "다국가 · 크립토 지갑 지급 옵션(디렉터리) · Rakshit 전 직장", "본사 정보 자료마다 다름 · 퍼블리셔 지급 지연 후기", "Advertiser BD · Country Manager", "미접촉", "보류 — vCommission 결과 뒤"),
    (9, "Ecomobi", "베트남 · 필리핀 · 태국 · 말레이 · 인니", "네트워크(크리에이터)",
     "크리에이터 · 퍼블리셔 100만+(자체) · 핀테크 확장 계획", "라자다 등 마켓 중심 — 자체 결제 · 지갑 결제와 결 약함", "Brand Partnerships", "미접촉", "후순위"),
    (10, "ArabClicks", "UAE · 사우디(GCC)", "네트워크",
     "두바이 성과형 · 판매 완료만 지급", "UAE 가상자산 마케팅 규정 · 배송", "Advertiser Partnerships", "미접촉", "후순위"),
    (11, "Fuul", "크립토(EVM · Solana)", "온체인 레퍼럴",
     "크립토 네이티브 레퍼럴 인프라 · 스텔라 확장 추진 이력 → XRPL 확장 대화 각도", "XRPL 미지원 — 지금 바로 못 씀", "Co-founder · BD", "미접촉", "XRPL 계획 물어보는 정도"),
    (12, "Galxe", "크립토", "퀘스트 · 커뮤니티",
     "지갑 온보딩 · 커뮤니티 퀘스트(판매 어필리에이트 아님)", "에어드롭 사냥 청중 — 기기 판매 전환 약함", "Partnerships · Ecosystem", "보류", "판매 경로 아님 — 커뮤니티 행사 때만"),
    (13, "링크프라이스", "국내", "네트워크",
     "국내 대표 CPS 네트워크 · 구조가 vCommission 과 같음(추적 링크 + 실적 전송)", "국내는 기기 · 데이터로만(보상 · 코인 0) · 가상자산 광고 규제 · 상장사(케이웨더) 평판", "제휴사업 · 광고주 영업", "미접촉", "국내 카드 결제분부터 검토"),
    (14, "애드픽(오드엠)", "국내", "성과형 인플루언서 커머스",
     "성과형 인플루언서 커머스 · 쇼핑메이트 연간 판매 1,200억(2023)", "링크프라이스와 같음", "커머스 · 광고주 제휴", "미접촉", "링크프라이스와 함께 검토"),
]

PEOPLE = [
    # 이름, 회사, 직함 · 레인, 지역, 촌수, 상태, 다음 할 일, 메모
    ("Disha Sharma", "vCommission", "어필리에이트(퍼블리셔) 쪽 팀 — 광고주 팀 연결 창구", "인도 솔란", "1촌", "진행 중",
     "메일 주소 받으면 광고주 정보 메일 발송",
     "10/17 첫 제안 → 10/19 서우 발송판에 ROI 문장 → 링크드인 답 · 메일에서 철회. 링크드인 경력란엔 소속 없음"),
    ("Rakshit Ahuja", "vCommission", "Director(2026-09~) — 광고주 쪽 결정권 레인 · 전 Admitad India 네트워크 총괄", "인도 구루그람", "2촌 · 팔로우 중", "1촌 대기",
     "1촌 요청(메모 298자) · 수락 시 「Disha 통해 광고주 팀과 이야기 중」 한 줄만",
     "통화 요청 후속은 보류 — 한 회사 두 창구 금지"),
    ("Himanshi Kasnia", "vCommission", "Executive(2026-09~) — 퍼블리셔 모집 · 온보딩", "인도 모할리", "2촌", "1촌 대기",
     "수락 시 1촌 인사 기본값만", "Disha 와 공통 1촌 · 사업 이야기는 광고주 경로가 열린 뒤"),
    ("Hamza Jangda", "개인 퍼블리셔(Awin · vCommission · PartnerBoost 등 등록)", "퍼블리셔", "UAE 두바이", "3촌", "보류",
     "네트워크에 들어가면 그쪽으로 따라옴", "개인 직접 계약 = 추적 · 부정 방지 · 지급 부담 · UAE 가상자산 마케팅 규정"),
]

PREP = [
    # 항목, 왜, 누가, 상태, 메모
    ("배송 국가 목록", "네트워크 순위가 이걸로 갈린다", "서우 · 경영진", "미정", "메일은 「주문 전 세계 · 나라별 배송 열리는 대로」로 씀"),
    ("판매 추적 — 클릭 ID → 포스트백(S2S)", "네트워크 퍼블리셔 수천 명 귀속(링크프라이스 실적 전송과 같은 작업)", "개발", "확인 중", "지금은 파트너별 결제 링크만"),
    ("쿠폰 코드 귀속", "30% 중 구매자 할인 몫을 나누려면 필요", "개발 · 네트워크", "확인 중", "vCommission 질문 4"),
    ("해외 카드 결제", "RLUSD 만이면 전환 낮음", "개발 · 경영진", "미정", ""),
    ("네트워크 정산 통화 · 주기", "네트워크는 보통 법정화폐 월 인보이스(vCommission 기본 INR)", "경영진", "확인 중", "vCommission 질문 3"),
    ("네트워크 수수료 포함 여부", "우리가 정한 요율 안에서 떼는지, 위에 붙는지 = 실제 비용", "네트워크", "확인 중", "vCommission 질문 1"),
    ("쿠키 기간 · 검증 기간", "환불 기간과 맞춰야 함(보통 쿠키 14~30일)", "서우", "미정", "메일엔 「협의」"),
    ("크리에이티브 가이드", "수익 · ROI · 회수 기간 · 토큰 가격 0 · 광고 표시 · 사전 승인", "서우", "완료", "vCommission 메일에 5개 조항"),
    ("미배송 국가 구매자 고지 · 환불/대체 원칙", "배송 전 NFT 적립만 남는 판매 = 적립권으로 읽힘", "경영진 · 카운슬", "미정", "결제 전 고지 문구 필요"),
    ("사업자 상한", "판매 1인 10장 vs 백서 사업자 50(정본 §7 S)", "경영진", "미정", ""),
    ("요율 기준", "순매출 최대 30% — 할인 · 커미션 유연 배분 + 판매량 구간 추가 예정", "서우", "완료", "10/19 결정 · KOL 에도 같은 기준인지 미정"),
    ("영문 랜딩 · 덱", "네트워크 심사 자료", "서우", "보류", "10/19 「당장은 wellbian.io 보라」"),
]

BENCH = [
    ("Airthings(공기질 측정기)", "25%", "자체 프로그램 · 집주인을 직접 만나는 점검 · 시공 업자 대상", "공식 페이지"),
    ("Ledger(하드웨어 지갑)", "약 10%", "자체 운영 · 크립토 지급", "디렉터리"),
    ("Trezor(하드웨어 지갑)", "12~15%", "자체 + Involve Asia", "디렉터리"),
    ("Kraken(거래소)", "최대 50%", "크리에이터 직접(USDC) + impact.com(법정화폐) — 거래소라 비교 대상 아님", "공식 페이지"),
    ("wellbian(우리)", "최대 30%", "할인 · 커미션 유연 배분 + 판매량 구간 추가 예정", "10/19 서우 결정"),
]


def style_sheet(ws, heads, widths, rows, title, note):
    ws["A1"] = title
    ws["A1"].font = Font(name=FONT, size=14, bold=True, color="1B1B48")
    ws["A2"] = note
    ws["A2"].font = Font(name=FONT, size=9, color="6B6B8C")
    ws["A2"].alignment = Alignment(wrap_text=False)
    hr = 4
    for c, (h, w) in enumerate(zip(heads, widths), start=1):
        cell = ws.cell(row=hr, column=c, value=h)
        cell.font = Font(name=FONT, size=10, bold=True, color="FFFFFF")
        cell.fill = HEAD_FILL
        cell.alignment = Alignment(vertical="center", wrap_text=True)
        cell.border = BOX
        ws.column_dimensions[cell.column_letter].width = w
    for r, row in enumerate(rows, start=hr + 1):
        for c, v in enumerate(row, start=1):
            cell = ws.cell(row=r, column=c, value=v)
            cell.font = Font(name=FONT, size=10)
            cell.alignment = Alignment(vertical="top", wrap_text=True)
            cell.border = BOX
    ws.page_setup.orientation = "landscape"
    ws.page_setup.paperSize = ws.PAPERSIZE_A4
    ws.sheet_properties.pageSetUpPr.fitToPage = True
    ws.page_setup.fitToWidth, ws.page_setup.fitToHeight = 1, 0
    ws.print_title_rows = f"{hr}:{hr}"
    ws.freeze_panes = ws.cell(row=hr + 1, column=2)
    ws.auto_filter.ref = f"A{hr}:{ws.cell(row=hr, column=len(heads)).column_letter}{hr + len(rows)}"
    return hr


def add_status_validation(ws, col_letter, first, last):
    dv = DataValidation(type="list", formula1='"' + ",".join(STATUSES) + '"', allow_blank=True)
    dv.add(f"{col_letter}{first}:{col_letter}{last}")
    ws.add_data_validation(dv)


wb = Workbook()

ws = wb.active
ws.title = "네트워크"
heads = ["순위", "회사", "지역", "경로", "왜 유력", "걸리는 것", "링크드인에서 찾을 직함", "상태", "다음 할 일"]
hr = style_sheet(ws, heads, [6, 24, 24, 16, 48, 40, 30, 11, 34], NETWORKS,
                 "어필리에이트 네트워크 컨택 리스트 (2026-10-19)",
                 "회사 자기소개 · 디렉터리 요약 기준 — 규모 · 크립토 정책은 원문 대조 전, 대외 인용 금지. 사람 이름 · 연락처는 넣지 않는다. 상태 칸은 목록에서 고른다.")
add_status_validation(ws, "H", hr + 1, hr + len(NETWORKS))
for r in range(hr + 1, hr + len(NETWORKS) + 1):
    ws.cell(row=r, column=1).alignment = Alignment(horizontal="center", vertical="top")
    if ws.cell(row=r, column=8).value == "진행 중":
        for c in range(1, len(heads) + 1):
            ws.cell(row=r, column=c).fill = NOTE_FILL

ws2 = wb.create_sheet("사람")
heads2 = ["이름", "회사", "직함 · 레인", "지역", "촌수", "상태", "다음 할 일", "메모"]
hr2 = style_sheet(ws2, heads2, [18, 26, 40, 16, 14, 11, 40, 48], PEOPLE,
                  "어필리에이트 쪽 사람 (2026-10-19)",
                  "공개 직함 · 소속 · 판정만. 메일 · 전화 · 프로필 주소는 적지 않는다. 회사당 레인이 다른 2명까지(playbook).")
add_status_validation(ws2, "F", hr2 + 1, hr2 + len(PEOPLE))

ws3 = wb.create_sheet("우리 준비")
heads3 = ["항목", "왜", "누가", "상태", "메모"]
hr3 = style_sheet(ws3, heads3, [34, 52, 18, 11, 44], PREP,
                  "네트워크에 가기 전 우리가 갖출 것",
                  "없으면 심사에서 떨어지거나 첫인상만 쓴다. vCommission 메일의 질문 1~5 와 짝.")
add_status_validation(ws3, "D", hr3 + 1, hr3 + len(PREP))

ws4 = wb.create_sheet("참고 요율")
heads4 = ["프로그램", "요율", "방식", "출처"]
style_sheet(ws4, heads4, [28, 12, 60, 16], BENCH,
            "참고 요율 — 컨택 대상 아님",
            "디렉터리 수치는 오래됐을 수 있다. 우리 30% 는 하드웨어 기준으로 낮지 않다.")

ws5 = wb.create_sheet("요약")
ws5["A1"] = "상태별 개수"
ws5["A1"].font = Font(name=FONT, size=14, bold=True, color="1B1B48")
for c, h in enumerate(["상태", "네트워크", "사람", "우리 준비"], start=1):
    cell = ws5.cell(row=3, column=c, value=h)
    cell.font = Font(name=FONT, size=10, bold=True, color="FFFFFF")
    cell.fill = HEAD_FILL
    cell.border = BOX
n_last, p_last, q_last = hr + len(NETWORKS), hr2 + len(PEOPLE), hr3 + len(PREP)
for i, st in enumerate(STATUSES, start=4):
    ws5.cell(row=i, column=1, value=st)
    ws5.cell(row=i, column=2, value=f"=COUNTIF('네트워크'!$H${hr + 1}:$H${n_last},$A{i})")
    ws5.cell(row=i, column=3, value=f"=COUNTIF('사람'!$F${hr2 + 1}:$F${p_last},$A{i})")
    ws5.cell(row=i, column=4, value=f"=COUNTIF('우리 준비'!$D${hr3 + 1}:$D${q_last},$A{i})")
tot = 4 + len(STATUSES)
ws5.cell(row=tot, column=1, value="합계")
for c, L in ((2, "B"), (3, "C"), (4, "D")):
    ws5.cell(row=tot, column=c, value=f"=SUM({L}4:{L}{tot - 1})")
for r in range(4, tot + 1):
    for c in range(1, 5):
        cell = ws5.cell(row=r, column=c)
        cell.font = Font(name=FONT, size=10, bold=(r == tot))
        cell.border = BOX
for L, w in (("A", 14), ("B", 12), ("C", 12), ("D", 12)):
    ws5.column_dimensions[L].width = w
ws5["A" + str(tot + 2)] = "상태 칸을 바꾸면 자동으로 다시 센다."
ws5["A" + str(tot + 2)].font = Font(name=FONT, size=9, color="6B6B8C")

wb.save(OUT)
print("saved", OUT)
