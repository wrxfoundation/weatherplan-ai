#!/usr/bin/env python3
"""KBW2026 · XRP SEOUL 2026 연사 지도 — 데이터 조립 → 정적 페이지(www/index.html).

  python3 depin/site/event-week/tools/build.py                      # www/index.html (비밀번호 없음 — 9/29 서우 지시)
  EVENT_PASS=… python3 depin/site/event-week/tools/build.py         # 다시 잠글 때만(내용 암호화)
  python3 depin/site/event-week/tools/build.py --plain out.html     # 다른 경로로 평문 출력

비밀번호가 없으므로 주소를 아는 누구나 연다 — 근거 문구는 대외 금지 규칙(업비트 트랙 · 리플 채널 · 보험 레인 ·
멀티체인 · 미팅 일정 · 1촌 여부 · 파트너 클레임)에 걸리지 않게 쓴다. 자세한 내부 근거는 docx · intel 문서에.

정본
  XRP SEOUL 2026 = 저장소 루트 reports/XRP SEOUL 2026 연사 프로필.md (표 · 결 근거 · 추가 조사)
  KBW2026        = 아래 AGENDA(9/29 서우가 붙여 넣은 공식 아젠다 9/30 · 10/1) + ORG(소속 · 출처) + 판정(MARK)
판정 = 결(사업이 바로 엮이는 곳) · 전략(도와줄 사람 — 투자 · 정책 · 미디어 · 커뮤니티) · 리플 · 선(말할 때 조심) · 우리. 근거는 intel/business-directions.md
「KBW 2026 연사 컨택 우선순위(9/10)」 · 텔레봇 인맥 수첩(lib/network.ts, 9/21) · 9/29 검색.
페이지 안의 「내 표시」(브라우저 저장)는 여기 판정을 덮어쓸 뿐 이 파일을 바꾸지 않는다.
"""
import json
import os
import re
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
SITE = HERE.parent
REPO = SITE.parents[2]
MD = REPO / "reports" / "XRP SEOUL 2026 연사 프로필.md"

# ── KBW2026 공식 아젠다(9/30 · 10/1) — 날|시작|끝|제목|연사; 연사*=모더레이터 ─────────────────
AGENDA = """
9/30|10:00|10:30|Global Money, Local Rails: Stablecoins Go Mainstream|Yohei Wakita*; Daren Guo; Jakob Kronbichler; Halil Mirakhmed
9/30|10:00|10:20|What Professional Traders See That Retail Misses|Taha El-Magbri; Jason Atkins
9/30|10:15|10:30|The Next Chapter of Connection|Andrew Park
9/30|10:20|10:40|How to Make DeFi Great Again|Amanda Tuminelli; Katie Talati*; Sam MacPherson; Eugene Chen
9/30|10:30|11:00|From Hong Kong and Jakarta to Bangkok: The New Digital Asset Rulebook|Angelina Kwan; Hyobong Kim*; Kengkat Imsamrit; Uli Agustina
9/30|10:30|10:45|Beyond Trading: Building Financial Infrastructure for a More Connected Future|Kyoungsuk Oh
9/30|10:40|11:00|Beyond Tokenization: Markets, Not Chains|Viv Diwakar
9/30|10:45|11:00|FLOP: Bigger Than Bitcoin|Arthur Hayes
9/30|11:00|11:20|Next Million Chains|Jing Wang
9/30|11:00|11:20|How Hyperliquid Pilled Wall Street on 24/7 Trading|Christy Choi*; Jeff Yan
9/30|11:00|11:20|The Future of Banking: Upgrading Core Financial Infrastructure|Suhhee Han*; Sanghoon Jung; Woosup Lee; Hoon Seo
9/30|11:20|11:45|Ethereum's Wall Street Moment|Tom Lee
9/30|11:20|11:40|Kraken's Quest: From CEX to Global Financial Infrastructure|John Darsie*; Arjun Sethi
9/30|11:20|11:40|Trade Everything: Building the Unified Trading Platform for Global Markets|Edison Lim
9/30|11:40|12:00|Canton's Bet on Connected Capital Markets|Gerald Gallagher*; Yuval Rooz
9/30|11:40|12:00|Beyond Scale: What L1s Are for Now|Alex Jongkyu Lim*; Keone Hon; Eric Chen; Tomer Weller
9/30|11:45|12:05|MetaMask's Next Chapter: Making Money Open|Camila Russo*; Joe Lubin
9/30|12:00|12:30|From Staking to Stablecoins: The New Yield Stack|Youbin Kang*; Max Marcisiak; Thomas Sy; Hogun Lee; Marcin Kazmierczak
9/30|12:00|12:20|Digital Currency and the Future Monetary System: Korea's Next Architecture|Jonathan Kim*; SungGuan Yun
9/30|12:00|12:20|$50M Fund. Deploy on BOT Chain. The AI-Native Blockchain for the Agent Economy & RWA|
9/30|12:05|12:20|Securing the Institutional Crypto Era|Mike Belshe
9/30|12:20|12:40|x402, AI Payments, and Privacy: Building the Autonomous Transaction Layer|David Park*; Jongwook Oh; Junghoon Lee; Minsuk Choi; Juyoung Lim
9/30|12:20|12:40|Who Can Take the Money|
9/30|12:20|12:40|The Trillion-Dollar Agentic Economy: Building the Trust Layer for AI Agents|Michael Heinrich
9/30|12:30|13:40|네트워킹 점심|
9/30|12:40|13:00|Bringing Millions of Consumers Onchain|Alex Zverev
9/30|13:00|13:20|Sponsored Session: Shinzo Network|
9/30|13:20|13:40|From Silos to Superapp: The Future of DeFi|Taweh Beysolow II
9/30|13:30|13:50|A New Era for Digital Assets in Korea|Jung-Ho Park*; Gwang-suk Kim; Tae-Ik Jung; Do-Yun Kim
9/30|13:30|13:50|How Narratives Move Markets|Leeren Chang
9/30|13:40|14:00|Bitcoin's Next Frontier: From Store of Value to Productive Capital|Muneeb Ali
9/30|13:40|14:00|The Future of Digital Finance: The Programmable Economy Guide|Jungwha Lee
9/30|13:50|14:10|Who Wins When Intelligence Becomes Abundant?|Christy Choi*; Michael Figge; Yat Siu; Amanda Cassatt
9/30|13:50|14:10|Beyond CLARITY: What's Next for U.S. Crypto Markets|SeonJoo Yoon*; Brian Quintenz
9/30|14:00|14:20|Korea's Digital Asset Policy Moment|Byoungdeok Min
9/30|14:00|14:20|Defending DeFi: From Prevention to Coordinated Response|Jun Choi
9/30|14:10|14:35|The Data Race Behind the AI Boom|Laura Estefania*; Andrea Muttoni; Yijing Shi; Nate Holiday; Changhyun Cho
9/30|14:10|14:30|Stable: The First USD₮-Native Blockchain, Designed for Real-World Settlement|Brian Mehler
9/30|14:20|14:40|Tokenizing the Fund Industry: Bridging TradFi Asset Managers and RWA Protocols|Alvin Chia*; Min Lin; Goobin Park; Guy Wuollet
9/30|14:20|14:40|Tokenizing AI Models: A New Asset Class for Decentralised Intelligence|
9/30|14:30|14:50|From Diplomacy to Digital Ownership|Frank Chaparro*; Trevor Traina
9/30|14:35|14:55|The Stablecoin Paradox: Transparency vs. Privacy in Real-World Payments|Koki Sato
9/30|14:40|15:00|Lawyers, Liability and the Next US Crypto Regime|Dax Hansen; Lindsay Fraser*; Caroline Friedman; Jason Gottlieb
9/30|14:50|15:20|How Tokenization Is Rewiring Wall Street|Ian Fong*; Monica Long; Reid Simon; Hon. Caroline D. Pham
9/30|14:55|15:15|DeFi Is Dead, Long Live On-Chain Finance|Ran Hammer
9/30|15:00|15:20|How Industry and Regulators Can Work Together to Unlock the Institutional Future|Angelina Kwan*; Benjamin Stani; Dr. Huei Ching Wong; Aaron Gwak; Baylor Myers
9/30|15:15|15:35|Putting Real-World Value to Work: Agents, Assets and the New RealFi Economy|Wish Wu
9/30|15:20|15:50|Agentic Payments: Making the New Internet|Catrina Wang*; Catherine Porter; Joseph Chalom
9/30|15:20|15:40|The Rise of Crypto-Native Neobanks|Keli Callaghan*; Farooq Malik; Raafi Hossain; Mike Silagadze
9/30|15:30|17:00|ASX|
9/30|15:35|15:55|What Policymakers Need to Hear|Cody Carbone*; Mykolas Majauskas; Teresa Goody Guillén; John Lilic
9/30|15:40|16:00|More Assets, More Geos: How RWAs Are Eating the World|Francesco Fabracci; Chef Kids; Brian Smith
9/30|15:50|16:10|How Tether Became Global Financial Infrastructure|Lindsay Fraser*; Bo Hines
9/30|15:55|16:15|Can DeFi Beat Wall Street at Its Own Game?|Brett Hornung; Mark Lee
9/30|16:00|16:20|Culture, Collectibles and the Meme Economy|Gabriel Yang*; Kevin Kwong; Dominic Jang; Jordan Jefferson
9/30|16:10|16:40|Crypto Policy 2027: The Battles That Will Shape the Market|Eleanor Terrett*; Miles Jennings; Miller Whitehouse-Levine; Chris Brummer; Wai Lum Kwok
9/30|16:15|16:35|Can Permissionless Networks Thrive in the Institutional Crypto Era?|Alice Liu*; Michael Lewellen; Howard Wu; Justin Kim
9/30|16:20|16:40|Finding Alpha in the Hyperliquid Ecosystem|Michael Zhao*; Ryan Watkins; Hyunsu Jung
9/30|16:35|17:00|Leveraging AI for Financial Trading|Taishi Sato*; Taisuko Isono; June Morita; Goki Kato
9/30|16:40|16:55|Satoshi's Dream? Mission Possible|Junggeun Lee
9/30|16:40|17:05|The Road Ahead: Washington's Next Move on Digital Asset Regulation|Frank Chaparro*; Chris Land
10/1|10:00|10:15|From Online Tribes to Startup Societies|Balaji Srinivasan
10/1|10:00|10:25|What Institutions Need to Move Onchain|David Shengart*; Henson Orser; Melody He; Heejin Shin; Hitoshi Harada
10/1|10:00|10:20|Project Pangea: Rewiring Global FX|Joonhong Kim*; Jan-Oliver Sell; Jeffrey Choi; Niki Ariyasinghe
10/1|10:15|10:35|Fireside: Nxum's Harry Jung|Eleanor Terrett*; Harry Jung
10/1|10:20|10:40|Is the Bull Back? Understanding Today's Markets|Azfer Khan*; Enzo; Peter Chung; Will Au
10/1|10:25|10:45|Will Bitcoin's 4-Year Cycle Ever Die?|Itai Elizur*; Michelle Tankimovich; Alex Thorn; Luis Kim
10/1|10:30|12:30|SCAN|
10/1|10:35|10:55|US Tech Policy: Is DeFi on the Agenda?|Amanda Tuminelli*; Patrick Wilson; Ed Felten; Christopher Montagano
10/1|10:40|11:00|From Market Data to Ratings: Crypto's New Institutional Infrastructure|Sean Lee*; Chetan Karkhanis; Charles Jansen; Gene Fang; Ambre Soubiran
10/1|10:45|11:05|Your Next Customer Is an AI Agent: Make Your Products Easy for Agents to Find, Understand and Buy|Kevin Liu
10/1|10:55|11:15|Where Robinhood's Reach Meets Decentralized Trading|Camila Russo*; Johann Kerbrat; Eddie Zhang
10/1|11:00|11:20|Institutional Tokenization at Scale: Moving From Pilot to Production|Alvin Chia*; Franklin Bi; Eva Lawrence; Ryo Kato
10/1|11:05|11:25|Beyond Standard Tokens: Designing Compliant RWA Architectures for Institutional Adoption|Mackenzie Hom
10/1|11:15|11:35|The New DeFi Stack: Synthetic Dollars Meet High-Speed Trading|Jacquelyn Melinek*; Vladimir Novakovski; Guy Young
10/1|11:20|11:40|L2 Adoption Won. Did L2s?|Amal Moritz*; Matthew Dawson; Charles Lu; Kyle Jenke
10/1|11:25|11:45|The Ceiling on the Agent Economy|Mike Hanono
10/1|11:35|11:55|What TradFi Needs to Go Onchain|Danny Park*; Dan Kong; Insung An; Paul Frambot
10/1|11:40|12:00|Where AI Meets Blockchain, Unleashing Value in Tokens|Zhuoqun Bian
10/1|11:45|12:05|Why Your Money Still Lives in Too Many Places|Jake Salerno*; Taweh Beysolow II; Felix Fan
10/1|11:55|12:15|Onchain Finance's Speed Problem|Daniel Kim*; Halil Mirakhmed; Austin Federa; Annabelle Huang
10/1|12:00|12:20|Liquid Everything: How STOs Are Re-Architecting Korea's Capital Markets|Jonathan Kim*; Yongjae Lee; Insoo Choi; Kibeom Kang
10/1|12:05|12:30|Stablecoins, Securities, and the Frictionless Future|Sylvia To*; Ming Zhao; Lorenzo Romagnoli
10/1|12:15|12:40|Wall Street's Crypto Reckoning: Go All-In or Fold?|Michael Ippolito*; John Darsie; David Olsson; John D'Agostino; Michael Lau
10/1|12:20|12:40|The Self-Custodial Banking Stack Institutions Build On|John Lilic
10/1|12:30|13:40|네트워킹 점심|
10/1|13:30|13:50|Friends and Family: What Crypto's Earliest Investors Are Backing Now|Keli Callaghan; Steve Lee*; David Toh; Akshat Vaidya
10/1|13:30|14:30|GASOK Presentation|
10/1|13:40|14:00|Membership Has Its Privileges: Can Crypto Cards Compete?|Itai Elizur*; Raagulan Pathy; Jorge Selva
10/1|13:40|14:00|What's Next for the $TRUMP Coin|Bill Zanker
10/1|13:50|14:10|Verifiable Computing in the Age of AI|Michael Dong
10/1|14:00|14:20|The Problem Blockchain Doesn't Solve|Haan Junn
10/1|14:00|14:30|How Capital Is Mapping Crypto's Next Cycle|Camila Russo*; Robbie Nakarmi; Tom Schmidt; Lasse Clausen; Kelvin Koh
10/1|14:10|14:30|Programmable Machine Needs Programmable Money|Dhawal Shah
10/1|14:20|14:40|Inside the Institutions: What Policy, Infrastructure, and Law Say About Blockchain Now|Laura Estefania*; Yesha Yadav; Todd McDonald; Sunayna Tuteja
10/1|14:30|14:50|Inventing the Decentralized Future With Gno.land|Jae Kwon
10/1|14:30|14:50|The Internet of Privacy: Building Private Infrastructure for the Next Generation of Web3|Cris Blanco
10/1|14:40|15:00|Crypto ETFs: From Niche Product to Portfolio Staple?|Jongsub Lee*; Eliezer Ndinga; Hong Kim
10/1|14:50|15:10|When AI Agents Meet Onchain Money|Kyle Trimble*; Burnt Banksy; Albert Castellana Lluís; Dhawal Shah
10/1|14:50|15:10|Beyond the Game: Athletes Become Owners|Mickey Hardy*; Tristan Thompson
10/1|15:00|15:30|What's the Future of Non-USD Stablecoins?|Dongjoo Suh*; Haonan Li; Jan-Oliver Sell; Alex Cutler; Tianwei Liu
10/1|15:10|15:30|Sovereignty by Design: Where Data, AI, and Ownership Meet|Bella Park*; Azeem Khan; Dryden Brown
10/1|15:10|15:40|What Drives the Next Wave of Stablecoin Adoption?|Ann Chien*; Zaheer Ebtikar; Wonseok Baek; Andrey Lazorenko
10/1|15:30|15:50|Smarter Models, Harder Problems: Play, Training, and the Future of AI|Steve Chung*; Sheila Warren; Ben Fielding; Justin Waldron
10/1|15:30|16:00|On the Front Lines of Cybercrime: Intelligence, Security, and AML Compliance|Paul Kim*; Youngseok Kim; Jiyong Lee; Anna Yim
10/1|15:40|16:00|T.J. Miller Is Ready to Roast|Jarred Winn*; T.J. Miller
10/1|15:50|16:20|How DATCos Are Getting Creative|Toby Chapple*; David Schamis; Isidoros Passadis; Mark Wendland; Katherine Dowling
10/1|16:00|16:25|What the Market Data Is Really Saying|Ryan Yoon*; Thomas Uhm; CJ Fong; Vishal Gupta
10/1|16:00|16:20|Korea's Next Generation of Digital Asset Venues|Jaejin Kim*; Minkyu Kang; Myunggu Jin; Sunho Hwang
10/1|16:20|16:40|Memecoins Will Never Die|Frank Chaparro*; Se Yong Park; Ansem
10/1|16:25|16:45|Trust Oracles in Onchain Economies: Price Oracles Built DeFi, Trust Oracles Will Scale It|Ashutosh Sahoo
10/1|16:40|17:00|Sponsored Session: BTQ Technologies Corp.|Chris Tam
"""

# ── KBW 소속 — 출처 등급: n = 우리 수첩(9/10 판정 · 인맥 수첩 9/21) · s = 9/29 검색 · k = 알려진 정보(재확인 전) ──
ORG = {
    "Charles Jansen": ("S&P Global — DeFi 전환 총괄", "n"),
    "Caroline D. Pham": ("MoonPay(전 CFTC 위원장 대행)", "n"),
    "Guy Wuollet": ("a16z crypto GP", "n"),
    "Yuval Rooz": ("Digital Asset(Canton) CEO", "n"),
    "Mike Belshe": ("BitGo CEO", "n"),
    "Balaji Srinivasan": ("『The Network State』 저자 · Network School 창업자", "n"),
    "Arjun Sethi": ("Kraken 공동 CEO", "n"),
    "SeonJoo Yoon": ("업비트(두나무) CBIO", "n"),
    "Kyoungsuk Oh": ("두나무(업비트) 대표", "n"),
    "Tom Schmidt": ("Dragonfly GP", "n"),
    "Michael Ippolito": ("Blockworks 공동창업자", "n"),
    "Yat Siu": ("Animoca Brands 회장", "n"),
    "Johann Kerbrat": ("Robinhood 크립토 총괄", "n"),
    "Marcin Kazmierczak": ("RedStone 공동창업자", "n"),
    "SungGuan Yun": ("한국은행 디지털화폐실장", "n"),
    "Frank Chaparro": ("GSR 콘텐츠 · 전략커뮤니케이션", "n"),
    "Michael Heinrich": ("0G Labs CEO", "n"),
    "Monica Long": ("Ripple 사장", "n"),
    "Tom Lee": ("Fundstrat · BitMine", "s"),
    "Jeff Yan": ("Hyperliquid", "s"),
    "Arthur Hayes": ("Maelstrom", "s"),
    "Brian Quintenz": ("전 CFTC 위원", "s"),
    "Bo Hines": ("Tether USA CEO", "s"),
    "Brian Mehler": ("Stable", "s"),
    "John Lilic": ("Tria CSO", "s"),
    "Heejin Shin": ("교보증권 신사업담당 이사", "s"),
    "Andrea Muttoni": ("The DATA Foundation(구 Story) CEO", "n"),
    "Chetan Karkhanis": ("Franklin Templeton SVP", "s"),
    "Ambre Soubiran": ("Kaiko CEO", "s"),
    "Wish Wu": ("Pharos Network CEO", "s"),
    "Ashutosh Sahoo": ("ZeruAI CEO", "s"),
    "Albert Castellana Lluís": ("GenLayer Labs CEO", "s"),
    "Burnt Banksy": ("Burnt · XION 창업자", "s"),
    "Jongwook Oh": ("웨이브릿지 대표", "s"),
    "Michael Dong": ("Brevis 공동창업자로 보임", "k"),
    "Dhawal Shah": ("Hey Elsa 로 보임", "k"),
    "Joe Lubin": ("Consensys", "n"),
    "Camila Russo": ("The Defiant", "k"),
    "Jing Wang": ("Optimism", "k"),
    "Keone Hon": ("Monad", "k"),
    "Eric Chen": ("Injective", "k"),
    "Tomer Weller": ("Stellar 개발재단", "k"),
    "Muneeb Ali": ("Stacks", "k"),
    "Amanda Cassatt": ("Serotonin", "k"),
    "Sam MacPherson": ("Phoenix Labs CEO(Spark 개발사 · Sky 생태계)", "n"),
    "Amanda Tuminelli": ("DeFi Education Fund", "n"),
    "Guy Young": ("Ethena", "n"),
    "Vladimir Novakovski": ("Lighter", "n"),
    "Paul Frambot": ("Morpho", "n"),
    "Austin Federa": ("DoubleZero", "n"),
    "Ed Felten": ("Offchain Labs", "n"),
    "Miles Jennings": ("a16z crypto", "n"),
    "Chris Brummer": ("조지타운대 로스쿨 교수 · Bluprynt CEO", "n"),
    "Eleanor Terrett": ("Crypto in America", "n"),
    "Lasse Clausen": ("1kx", "n"),
    "Kelvin Koh": ("Spartan Group", "n"),
    "Franklin Bi": ("Pantera Capital", "n"),
    "Alex Thorn": ("Galaxy 리서치", "n"),
    "Eliezer Ndinga": ("21Shares", "n"),
    "Jae Kwon": ("Gno.land(코스모스 창시자)", "n"),
    "Ben Fielding": ("Gensyn", "n"),
    "Sheila Warren": ("Advanced AI Society 이사회 의장(전 CCI CEO)", "n"),
    "Todd McDonald": ("R3", "n"),
    "Joseph Chalom": ("SharpLink", "n"),
    "Howard Wu": ("Aleo 창업자 · Provable CEO", "n"),
    "Ryan Watkins": ("Syncracy Capital", "n"),
    "Mike Silagadze": ("ether.fi", "n"),
    "Farooq Malik": ("Rain", "n"),
    "Raagulan Pathy": ("KAST", "n"),
    "Bill Zanker": ("$TRUMP 발행 측", "n"),
    "Akshat Vaidya": ("Maelstrom 매니징 파트너", "n"),
    "Dryden Brown": ("Praxis", "n"),
    "Cody Carbone": ("The Digital Chamber", "n"),
    "Miller Whitehouse-Levine": ("Solana Policy Institute", "n"),
    "Katherine Dowling": ("Bitcoin Standard Treasury Co. 사장(전 Bitwise 법무총괄)", "n"),
    "Hong Kim": ("Bitwise", "n"),
    "Jason Gottlieb": ("Morrison Cohen", "n"),
    "John D'Agostino": ("Coinbase Institutional 전략 총괄", "n"),
    "John Darsie": ("SkyBridge · SALT", "n"),
    "Peter Chung": ("Presto Research", "n"),
    "Zaheer Ebtikar": ("Plasma CSO(전 Split Capital 창업자)", "n"),
    "Harry Jung": ("Nxum", "n"),
    "Byoungdeok Min": ("국회의원(민병덕)", "n"),
    "Trevor Traina": ("전 주오스트리아 미국대사 · Tools for Humanity(인물 DB 기준)", "n"),
    "Tristan Thompson": ("전 NBA 선수", "k"),
    "T.J. Miller": ("코미디언", "k"),
    "Ansem": ("크립토 트레이더", "k"),
    "Chris Tam": ("BTQ Technologies", "k"),
}

# ── 판정 — 사람(두 행사 공통 키 = 영문 이름) ─────────────────────────────────────────────
# fit = 결(사업이 바로 엮이는 곳) · strat = 전략(도와줄 사람 — 투자 · 정책 · 미디어 · 커뮤니티) · ripple = 리플(RLUSD 발행사 · XRPL 기여자,
# 공개 직함 · 공개 활동까지) · line = 선(말할 때 조심) · ours = 우리
# 근거 문장 = 「무엇을 하는 곳(공개 사실) — 그래서 우리에게 왜」. 사실은 tools/profiles.json · factcheck-0929.json 에서 확인된 것만.
PMARK = {
    # KBW
    "Charles Jansen": ("fit", "S&P Global Ratings DeFi 전환 총괄 — 스테이블코인 안정성 평가 · 토큰화 펀드 등급 · 지수. "
                              "여러 출처를 합쳐 기준값을 내는 방식이 우리 날씨 데이터(11개 출처 합의)와 같아, 데이터 신뢰를 평가받을 수 있는 곳"),
    "Ambre Soubiran": ("fit", "Kaiko = 시장 데이터 회사가 EU 인가 벤치마크 · S&P Kaiko 지수 · S&P 주도 투자로 기관 인프라가 된 사례 — "
                              "데이터 회사인 우리가 갈 길의 선례"),
    "Andrea Muttoni": ("fit", "The DATA Foundation(구 Story) — AI 학습 데이터의 출처 · 라이선스를 온체인에 기록(Trace). "
                              "측정 데이터가 AI 학습에 쓰일 때 권리 · 정산을 다루는 곳"),
    "Jongwook Oh": ("fit", "기존 연결 — 웨이브릿지(기관 수탁 · 프라임 브로커 · 스테이블코인 정산). "
                           "9/30 「x402 · AI 결제 · 프라이버시」 패널 — 국내 기관 쪽 x402 시각"),
    "Caroline D. Pham": ("strat", "MoonPay — 카드 · 계좌로 크립토를 사는 온램프 · 결제, MoonPay Institutional CEO(전 CFTC 위원장 대행). "
                                  "해외 구매 결제 경로를 설계할 때 대화 상대"),
    "Guy Wuollet": ("strat", "a16z crypto GP — DePIN 투자 테제를 쓴 사람, 가정 태양광 · 배터리 DePIN(Daylight) 투자 주도. "
                             "가정에 기기를 까는 DePIN 을 이미 아는 투자자"),
    "Tom Schmidt": ("strat", "Dragonfly GP — 스테이블코인 · 온체인 결제 · RWA 에 거는 VC, 「AI 에이전트 결제 레일」 테제. "
                             "에이전트가 데이터를 건당 사는 결제가 이 테제의 실사용 사례"),
    "Lasse Clausen": ("strat", "1kx — 온체인 매출로 크립토를 재는 VC(2025.10 보고서 — DePIN 을 6대 분류로, 「수수료 = 반복 효용」). "
                               "데이터 구매 수수료가 이 잣대에 그대로 맞는다"),
    "Akshat Vaidya": ("strat", "Maelstrom(Arthur Hayes 패밀리 오피스) — 「AI 에이전트가 크립토에서 가장 과소평가된 기회」(2025.8). "
                               "에이전트가 데이터를 사는 우리 구조와 같은 방향의 자본"),
    "SungGuan Yun": ("strat", "한국은행 디지털화폐실장 — 예금토큰(프로젝트 한강), 「2030년까지 국고금 4분의 1 을 디지털화폐로」 목표 언급. "
                              "국내 원화 결제 · 정산 방향을 듣는 자리"),
    "Michael Ippolito": ("strat", "Blockworks — 데이터 · 리서치 · 팟캐스트, 토큰 공시 표준(TTF, 2025.6). "
                                  "기관 투자자가 읽는 리서치 · 방송 창구"),
    "Frank Chaparro": ("strat", "GSR(마켓메이커) 전략커뮤니케이션 · 팟캐스트 The Crypto Tape — KBW 모더레이터 3세션. "
                                "시장 쪽 인터뷰 · 콘텐츠 창구"),
    # 9/29 밤 조사로 분야에 올림(KBW — 지금은 공개 판에서 숨김)
    "Albert Castellana Lluís": ("fit", "GenLayer = 여러 AI 모델이 합의로 AI 에이전트 사이 분쟁을 가르는 체인 — 에이전트가 산 데이터의 "
                                       "품질 다툼을 누가 가르나에 대한 답. KBW 10/1 14:50"),
    "Tianwei Liu": ("fit", "StraitsX = 싱가포르 달러 스테이블코인 XSGD 발행사 — 2025.5 XRPL 에 XSGD 출시(RLUSD 와 같은 원장). "
                           "동남아 구매자 결제 경로 후보. KBW 10/1 15:00"),
    "Jan-Oliver Sell": ("fit", "Qivalis = 유럽 은행 컨소시엄의 유로 스테이블코인 — 유로 ↔ 원화 스테이블코인 교환 정산 시범(Project Pangea). "
                               "유럽 판매 대금을 원화로 바꾸는 길 후보(초기 단계). KBW 10/1 15:00"),
    "Kyoungsuk Oh": ("line", "거래소 · 메인 스폰서(업비트) — 인사만, 우리가 먼저 열지 않는다"),
    "SeonJoo Yoon": ("line", "거래소 · 메인 스폰서(업비트) — 인사만, 우리가 먼저 열지 않는다"),
    "Arjun Sethi": ("line", "거래소(Kraken) — 인사만, 사업 메시지는 먼저 열지 않는다"),
    "John D'Agostino": ("line", "거래소(Coinbase) — 인사만"),
    "Mike Belshe": ("line", "명함까지 — 커스터디 비교 대화는 열지 않는다"),
    # 두 행사 공통 · XRP SEOUL
    "Monica Long": ("ripple", "리플 사장 — 사업 · 제품 · 엔지니어링 총괄. 10/3 12:55 「리플의 기관 금융 전략과 XRP」 · "
                              "KBW 9/30 14:50 토큰화 패널"),
    "Johann Kerbrat": ("line", "거래 · 브로커리지 — 인사만"),
}
PMARK_APPEND = {}
# 색 없이 붙이는 메모
PNOTE = {
    "Yat Siu": "X 답글로만 — 링크드인 · 대면은 따로 열지 않는다",
    "Balaji Srinivasan": "테제 글이 우리 사업과 닿을 때 X 답글 1회 — 상품 얘기 없이",
    "Yuval Rooz": "JPM 토큰화 예금이 Canton — 우리 정산은 XRPL, 섞지 않는다",
    "Chetan Karkhanis": "프랭클린템플턴 = t54 시드 공동 주도사(2026.2)",
}

# XRP SEOUL — md 「우리와 결」 을 결 · 전략으로 나눈다 + 리플(따로 묶음) + 선
XS_FIT = {"Hugo Philion", "Connor Sullivan", "Chandler Fang", "Nathaniel T. Bradley", "Johnny Youn",
          "John Lilic", "Jaehyuk Choi"}  # 9/29 밤 조사로 결제 분야에 올림
XS_STRAT = {"Crypto Eri", "Changhoon Moon", "Lacey Wisdom", "Asheesh Birla"}  # 아시시 = 이전 XRP 컨퍼런스 인연(9/29)
# 관련자에서 뺀다 — 우리 쪽 · 주최 측이라 만날 대상이 아니다(9/29 밤 서우 「제이크 구랑 XRP 카탈라이즈 인원은 빼」).
# 프로그램 연사로는 남는다(세션 카드 · 전체 연사의 「표시 없음」 맨 끝). 표시 · 순위 · 할 일 · 인물 상세 · 「두 행사」 표시 어디에도 다시 넣지 않는다.
NOT_TARGET = {"Jake Ku": "카탈라이즈(XRPL Korea) — 우리 쪽",
              "Marcin Kazmierczak": "RedStone — 후순위(9/29 밤 서우 「별로였어 — 아무 색 · 태그 없이 뒤로」)",
              "Michael Heinrich": "0G Labs — 뺌(9/29 밤 서우 「제로지 0g 빼」)",
              "Jake Salerno": "0G Labs(GTM 부사장, 9/29 조사) — 0G 와 같이 뺌"}
XS_OURS = {"Sunghwan Kim"}
# 리플 — 10/3 에 한 번은 인사할 사람. 공개 직함 · 공개 활동 · 세션만(관계 메모 0 · 협력 표현 0)
XS_RIPPLE = {
    "Christina Chan": "리플 생태계 성장 시니어 디렉터 — XRPL 그랜트 · 액셀러레이터 총괄, "
                      "XRPL AI 스타터 키트(2026.6 — 에이전트가 x402 로 XRP · RLUSD 결제). 12:35 · 14:15 두 세션",
    "Sabrina Tachdjian": "XRP Asia — 리플이 2026.2 공개한 아태 XRPL 빌더 지원 허브(현지 펀딩 배분 지향). 14:15 특별 발표",
    "Jinnie Lee": "리플 아태 세일즈 디렉터 — 리플의 RLUSD 무역금융 정산 시범(싱가포르 MAS 샌드박스, 2026.3). "
                  "13:45 「해외송금부터 예금토큰까지」",
    "Ayo Akinyele": "RippleX 엔지니어링 시니어 디렉터(암호학 박사) — XRPL 영지식증명 · 선택적 공개(기관 프라이버시). 14:35 「XRPL 대중화」",
    "Tatsuya Kohrogi": "리플 생태계 성장 시니어 매니저 — 리플의 일본 XRPL 스타트업 그랜트(2025.6, 프로젝트당 최대 20만 달러). "
                       "15:20 「XRPL 실사용 사례」",
    "Pablo Che Leo": "리플 그로스(프로그램 표기 — 공개 약력은 확인 전). 17:45 「금융권은 토큰화자산을 어떻게 준비하고 있나」",
}
XS_LINE = {
    "Leonard Hoh": "거래소 — 인사만",
    "Adam Oozeer": "크로스체인 인프라 — 인사만",
    "Fig": "크로스체인 인프라 — 인사만",
    "Aniket Jindal": "크로스체인 인프라 — 인사만",
}

# 비밀번호 없는 페이지용 — md 결 근거(비공개 관계 · 계획이 든 칸)는 싣지 않고 공개 가능한 근거로 바꾼다
XS_WHY = {
    "Chandler Fang": "t54 = XRPL x402 촉진자 · 에이전트 신원(KYA) — AI 에이전트가 XRPL 에서 x402 로 값을 치를 때 검증 · 정산하는 층. "
                     "우리 측정 데이터도 에이전트가 XRPL x402 로 산다. 10/3 12:35 · 13:15",
    "Lacey Wisdom": "PL Capital Crypto GP — DePIN 16곳 투자 · 날씨 DePIN(WeatherXM) 포트폴리오 · t54 시드 공동 리드(2026.2). "
                    "측정기 DePIN 과 XRPL 에이전트 결제를 둘 다 아는 투자자. 10/3 18:10",
    "Nathaniel T. Bradley": "Datavault AI(나스닥 DVLT) — 데이터를 점수화 · 가치평가해 토큰화 · 거래, 농업 센서 데이터 제휴(2026.4). "
                            "측정 데이터가 값 매겨진 자산이 되는 선례",
    "Johnny Youn": "SIVAX = ELS 구조를 XRPL 위로 옮긴 구조화상품, KFIP 2026 1위 — 국내에서 XRPL 실사용을 먼저 만든 빌더. 10/3 15:20",
    "Connor Sullivan": "Firelight = Flare 생태계의 XRP 담보 커버 프로토콜(DeFi 사고 보장) — 케이웨더 × Flare 공개 파트너십과 "
                       "같은 판에서 XRP 를 굴리는 쪽. 10/3 12:05",
    "Hugo Philion": "케이웨더 × Flare 파트너(2026.9.5 공개 무대) — 외부 데이터 증명(FDC) · 가격 오라클(FTSO)을 L1 에 내장한 체인. "
                    "10/3 12:05 · 13:30 → 14:50 우리 키노트",
    "Crypto Eri": "기존 연결 — 일본 XRP 커뮤니티 영상 채널(crypto Eri) · Onami Press. 10/3 12:05 패널 좌장 — 영상 · X 확산 창구",
    "Asheesh Birla": "기존 연결 — 이전 XRP 컨퍼런스 인연. 에버노스(XRP 트레저리) — 9/30 SPAC 합병 표결 사흘 뒤 무대",
    "John Lilic": "Tria = 자기수탁형 네오파이낸스 앱(카드 결제 · 거래 · 예치), 사람 · AI 에이전트용 결제를 내세운다 — 크립토 보유자가 "
                  "카드로 쓰는 결제 경로. ConsenSys 초기 멤버 · Polygon 출신. 10/3 16:10 · 18:10 두 세션",
    "Jaehyuk Choi": "케이뱅크 디지털자산TF장 — 2026.4 리플 디지털 월렛 기반 해외송금 기술검증(PoC) 보도. 국내 은행 쪽 스테이블코인 · "
                    "송금 흐름을 여는 실무자. 10/3 13:45",
    "Changhoon Moon": "기존 연결 — 9/5 Flare 워크숍 같은 무대. XRP 유튜브 · 저서(『리플 빅뱅』)로 국내 XRP 장기 보유자 청중에 닿는 창구",
}
# 시간대별 칸(세션 카드) 한 줄 — 9/29 밤 서우 「시간대별로 나오는 패널들 내용이 너무 장황하다, 읽기 쉽게」.
# 세션 카드에는 사람마다 이 한 줄 + 회사 · 인물 첫 줄만 싣고, 긴 근거 · 할 일은 관련자 표 · 인물 패널에 둔다.
# 위 근거(XS_WHY · XS_RIPPLE · PMARK)에서 줄인 말만 — 새 사실을 넣지 않는다. 없으면 순위 근거(TIERS) → 근거 순으로 쓴다.
BRIEF = {  # 회사 · 인물 첫 줄과 겹치지 않게 「우리에게 왜」 쪽으로. 리플 · 우리는 한 줄 없이(색 표시 · 회사 · 인물로 충분)
    "Lacey Wisdom": "측정기 DePIN(WeatherXM) · 에이전트 결제(t54) 둘 다 투자",
    "Nathaniel T. Bradley": "센서 데이터에 값을 매기는 선례 — 농업 센서 제휴(2026.4)",
    "Chandler Fang": "XRPL x402 촉진자 — 우리 데이터도 에이전트가 x402 로 산다",
    "John Lilic": "해외 구매자가 크립토 카드로 결제하는 경로",
    "Connor Sullivan": "Flare 생태계 — 케이웨더 × Flare 공개 파트너십과 같은 판",
    "Jaehyuk Choi": "국내 은행 쪽 스테이블코인 · 송금 실무자",
    "Johnny Youn": "국내에서 XRPL 실사용을 먼저 만든 빌더",
    "Hugo Philion": "케이웨더 × Flare 파트너 — 데이터 증명(FDC) · 오라클(FTSO)",
    "Crypto Eri": "기존 연결 — 이 패널 좌장 · 영상 · X 확산 창구",
    "Asheesh Birla": "기존 연결 — 이전 XRP 컨퍼런스 인연",
    "Changhoon Moon": "기존 연결 — 9/5 Flare 워크숍 같은 무대",
}
XS_CO_DROP = [r"\s*·\s*코스닥 상장"]  # 케이웨더 대외 표현은 「30년 · 4,000+」까지 — 상장 여부는 공개 판에 싣지 않는다
XS_PE_DROP = [r"\s*휴고와 2019년부터 구면 · 이번 KBW 미디어 파트너\(9/23 미팅\)", r"\s*Eri 와 2019년부터 구면\(9/23 미팅\)", r"\(서우 9/29\)",
              r"\.\s*$"]

KO = {
    "Charles Jansen": "찰스 얀센", "Ambre Soubiran": "앙브르 수비랑", "Andrea Muttoni": "안드레아 무토니", "Jongwook Oh": "오종욱",
    "Michael Heinrich": "마이클 하인리히", "Caroline D. Pham": "캐롤라인 팸", "Guy Wuollet": "가이 울렛", "Tom Schmidt": "톰 슈미트",
    "Lasse Clausen": "라세 클라우젠", "Akshat Vaidya": "악샷 바이디아", "Michael Ippolito": "마이클 이폴리토",
    "Frank Chaparro": "프랭크 차파로", "Kyoungsuk Oh": "오경석", "SeonJoo Yoon": "윤선주", "Arjun Sethi": "아르준 세티",
    "John D'Agostino": "존 다고스티노", "Mike Belshe": "마이크 벨시", "Byoungdeok Min": "민병덕", "SungGuan Yun": "윤성관",
}
# KBW 쪽 회사 · 인물 한 줄(표시된 사람만 — 공개 자료 기준)
KBW_DESC = {
    "Charles Jansen": ("S&P Global — 신용평가 · 지수(S&P 다우존스 지수) · 시장 데이터", "Ratings 매니징 디렉터 · DeFi 전환 총괄. 10/1 「시장 데이터에서 등급으로」 패널"),
    "Ambre Soubiran": ("Kaiko — 크립토 시장 데이터 · 지수. 거래소 · DeFi 체결 데이터로 리스크 · 변동성 지표, Cometh 인수", "CEO. 10/1 「시장 데이터에서 등급으로」 패널"),
    "Andrea Muttoni": ("The DATA Foundation — 2026.6 Story 에서 전환, AI 학습 데이터 소싱 · 검증 · 라이선스 인프라", "CEO(전 Story Foundation 사장). 9/30 「AI 붐 뒤의 데이터 레이스」 패널"),
    "Jongwook Oh": ("웨이브릿지 — 국내 디지털자산 금융 인프라", "대표. 9/30 「x402 · AI 결제 · 프라이버시」 패널"),
    "Michael Heinrich": ("0G Labs — 탈중앙 AI 인프라(데이터 가용성 · 저장 · 연산)", "공동창업자 겸 CEO. 9/30 「AI 에이전트 신뢰 층」 발표"),
    "Caroline D. Pham": ("MoonPay — 법정화폐 ↔ 크립토 온램프 · 결제", "최고법률책임자 · 최고행정책임자 겸 MoonPay Institutional CEO(전 CFTC 위원장 대행). 9/30 「토큰화가 월가를 바꾸는 법」 패널"),
    "Guy Wuollet": ("a16z crypto — 크립토 전문 VC", "GP. 9/30 「펀드 산업의 토큰화」 패널"),
    "Tom Schmidt": ("Dragonfly — 크립토 VC", "GP. 10/1 「자본이 그리는 다음 사이클」 패널"),
    "Lasse Clausen": ("1kx — 리서치 중심 크립토 VC(2018~, 160건+ 투자)", "공동창업자 · 파운딩 파트너. 10/1 「자본이 그리는 다음 사이클」 패널"),
    "Akshat Vaidya": ("Maelstrom — Arthur Hayes 패밀리 오피스(벤처 · 리퀴드 · 사모 · 공개시장)", "공동창업자 · 매니징 파트너(전 BitMEX). 10/1 「초기 투자자들이 지금 거는 곳」 패널"),
    "SungGuan Yun": ("한국은행 — 디지털화폐(CBDC · 예금토큰 · 프로젝트 한강)", "디지털화폐실장. 9/30 「디지털화폐와 한국의 다음 구조」"),
    "Michael Ippolito": ("Blockworks — 크립토 데이터 · 리서치 · 팟캐스트 · 행사(DAS). 2025.10 뉴스 부문 폐쇄", "공동창업자. 10/1 「월가의 크립토 결산」 모더레이터"),
    "Frank Chaparro": ("GSR — 크립토 마켓메이커(전 The Block 첫 기자)", "콘텐츠 · 전략커뮤니케이션 총괄(직함은 KBW 연사 카드로 확인) · 팟캐스트 The Crypto Tape. 모더레이터 3세션(9/30 두 번 · 10/1)"),
    "Kyoungsuk Oh": ("두나무 — 업비트 운영사, KBW 메인 스폰서", "대표. 9/30 10:30 발표"),
    "SeonJoo Yoon": ("업비트(두나무)", "CBIO. 9/30 「CLARITY 이후 미국 시장」 모더레이터"),
    "Arjun Sethi": ("Kraken — 글로벌 거래소", "공동 CEO"),
    "John D'Agostino": ("Coinbase — 미국 거래소", "Coinbase Institutional 전략 총괄. 10/1 「월가의 크립토 결산」 패널"),
    "Mike Belshe": ("BitGo — 디지털자산 커스터디", "CEO. 9/30 「기관 크립토 시대의 보안」"),
}
# 중요도 — 제안 순위. 우리에게 제일 중요한 세 분야 순서로 먼저: DePIN → AI 에이전트 → 결제(9/29 밤 서우 「depin 과 ai agent,
# 그리고 pay 결제 쪽을 우선순위 순서로 기본 보기에 — 순위도 그렇게, 그들이 제일 중요하다」) → 그 밖 새 관계 → 리플(따로 묶음) → 기존 연결 → 우리 → 선.
# (9/29 서우 「기존 연결은 후순위로」 · 「하인리히 · 오종욱은 기존 접촉 — 맨 뒤로」 · 「리플 인원은 따로 묶어」 — 분야와 겹쳐도 이 묶음이 먼저다)
TIERS = [
    ("depin", [("Lacey Wisdom", "DePIN 투자 16곳 · 날씨 DePIN 포트폴리오 · 10/3"),
               ("Nathaniel T. Bradley", "센서 데이터 자산화 · 농업 센서 제휴 · 10/3"),
               ("Guy Wuollet", "DePIN 투자 테제 · 가정 에너지 DePIN"),
               ("Lasse Clausen", "온체인 매출로 DePIN 을 재는 VC")]),
    ("agent", [("Chandler Fang", "XRPL x402 촉진자 · 이번 주 서울"),
               ("Albert Castellana Lluís", "에이전트 분쟁 판정 체인(조사 관련도 3)"),
               ("Akshat Vaidya", "「AI 에이전트가 가장 과소평가된 기회」"),
               ("Tom Schmidt", "「AI 에이전트 결제 레일」 테제"),
               ("Andrea Muttoni", "AI 학습 데이터 라이선스")]),
    ("pay", [("Caroline D. Pham", "해외 구매 온램프(MoonPay)"),
             ("John Lilic", "크립토 네오뱅크 · 카드 · 10/3 두 세션"),
             ("Tianwei Liu", "XRPL 위 XSGD · 동남아 결제(조사 관련도 3)"),
             ("Jan-Oliver Sell", "유로 스테이블코인 · 유로 → 원화 정산(조사 관련도 3)")]),
    ("ref", [("Charles Jansen", "지수 · 평가 기관 · KBW 10/1"),
             ("Ambre Soubiran", "시장 데이터 회사"),
             ("Connor Sullivan", "Flare 생태계"),
             ("Michael Ippolito", "데이터 · 리서치 미디어"),
             ("Frank Chaparro", "미디어")]),
    # 국내 = 한국 회사 · 기관 소속 — 분야가 겹쳐도 번호는 새 관계 끝(9/29 밤 서우 「한국 사람은 중요도 안에 있어도 후순위로」).
    # 묶음 안은 분야 순서(결제 → 그 밖), 할 일은 「현장」 칸만(같은 날 「이건 빼」 — 최재혁 · 조니 윤의 후속 칸)
    ("kr", [("Jaehyuk Choi", "케이뱅크 디지털자산TF · 해외송금 PoC · 10/3"),
            ("SungGuan Yun", "한국은행 디지털화폐 — 원화 결제 방향"),
            ("Johnny Youn", "XRPL 구조화상품 · KFIP 1위")]),
    ("ripple", [("Monica Long", "리플 사장 · 두 행사"),
                ("Christina Chan", "생태계 성장 · 두 세션"),
                ("Sabrina Tachdjian", "XRP Asia"),
                ("Jinnie Lee", "아태 세일즈"),
                ("Ayo Akinyele", "RippleX 엔지니어링"),
                ("Tatsuya Kohrogi", "생태계 성장(일본 그랜트)"),
                ("Pablo Che Leo", "그로스")]),
    ("known", [("Hugo Philion", "기존 파트너 · 10/3 13:30 키노트"),
               ("Crypto Eri", "기존 연결 · 12:05 좌장"),
               ("Asheesh Birla", "기존 연결 · 이전 XRP 컨퍼런스"),
               ("Changhoon Moon", "기존 연결 · 9/5 워크숍"),
               ("Jongwook Oh", "기존 접촉 · 9/30 x402 패널")]),
    ("ours", [("Sunghwan Kim", "우리 키노트 14:50")]),
]
NEW_TIERS = ("depin", "agent", "pay", "ref", "kr")  # 번호를 1부터 잇는 새 관계(국내는 끝)
KR_FIELD = {"Jaehyuk Choi": "pay", "SungGuan Yun": "pay", "Johnny Youn": "ref"}  # 국내 묶음 사람의 분야(표 · 패널에 「국내 · 결제」)
ONLY_MEET = ("kr",)  # 할 일이 「현장」 칸만인 묶음
LINE_ORDER = ["Johann Kerbrat", "Leonard Hoh", "Arjun Sethi", "John D'Agostino", "Mike Belshe",
              "Adam Oozeer", "Fig", "Aniket Jindal", "Kyoungsuk Oh", "SeonJoo Yoon"]  # 국내(두나무 · 업비트)는 끝
# 번호는 새 관계(DePIN → AI 에이전트 → 결제 → 그 밖)만 1부터 잇고, 리플 · 기존 연결 · 우리 · 선은 묶음 번호대(표에는 번호를 안 쓴다)
BASE = {"ripple": 30, "known": 50, "ours": 80}
_n = 1
for t, people_ in TIERS:
    if t in NEW_TIERS:
        BASE[t], _n = _n, _n + len(people_)
RANK = {}
for t, people_ in TIERS:
    for i, (k, why) in enumerate(people_):
        RANK[k] = (BASE[t] + i, t, why)
for i, k in enumerate(LINE_ORDER):
    RANK[k] = (90 + i, "line", "")
_len = {t: len(v) for t, v in TIERS}
assert _n <= BASE["ripple"] and BASE["ripple"] + _len["ripple"] <= BASE["known"] and BASE["known"] + _len["known"] <= BASE["ours"], _len
assert len(RANK) == sum(_len.values()) + len(LINE_ORDER), "순위표에 같은 이름이 두 번"

# ── 보이는 행사 — 9/29 밤 서우 「XRP SEOUL 만 넣자, KBW 는 숨김 처리」. KBW 판정 · 조사 · 아젠다는 이 파일에 그대로 두고
#    공개 판(www)에서만 뺀다. 다시 보이려면 ("KBW", "XRP SEOUL").
SHOW_EVENTS = ("XRP SEOUL",)
DAY_EVENT = {"d0930": "KBW", "d1001": "KBW", "d1003": "XRP SEOUL"}


# ── 판정 전 분야 연사 — AI 에이전트 · 결제 세션의 다른 연사(표시 · 할 일 없이 분야 묶음으로만, 관련자 뒤)
POOL_SESS = {
    "agent_s": ["x402, AI Payments", "The Trillion-Dollar Agentic Economy", "The Data Race Behind the AI Boom",
                "Putting Real-World Value to Work", "Agentic Payments: Making the New Internet", "Your Next Customer Is an AI Agent",
                "The Ceiling on the Agent Economy", "Verifiable Computing in the Age of AI", "Programmable Machine Needs Programmable Money",
                "When AI Agents Meet Onchain Money", "XRPL AI 에이전트 경제", "신뢰 기반 AI 에이전트 경제"],
    "pay_s": ["Global Money, Local Rails", "Digital Currency and the Future Monetary System", "Stable: The First USD",
              "The Stablecoin Paradox", "The Rise of Crypto-Native Neobanks", "Why Your Money Still Lives in Too Many Places",
              "Stablecoins, Securities, and the Frictionless Future", "Membership Has Its Privileges", "What's the Future of Non-USD Stablecoins",
              "What Drives the Next Wave of Stablecoin Adoption", "해외송금부터 예금토큰까지", "Tria 가 바라보는 XRP 네오뱅크",
              "스테이블코인, 일상 금융 속으로"],
}


# ── 할 일 — 두 칸(9/29 밤 서우 「현장은 어수선해서 준비해 발표하거나 협력을 바로 만들 수 없다 — 현장은 만남에 의의,
#    일은 메일이나 후속 미팅에서」 → 「한 줄 메모 시간도 없다 — 가급적 X 서로 팔로우하거나 텔레그램 추가하는 액션으로」)
#    현장 = 만남까지: 어디서 만나나 · 인사 · X 맞팔 · 텔레그램 추가. 메모 · 발표 · 제안 · 시연 준비는 하지 않는다.
#    후속 = 행사 뒤 메일 · 미팅에서 여는 일(무엇을 보내고 무엇을 묻나).
# 리플 · 기존 연결 묶음은 할 일 없음(9/29 밤 서우 「리플 쪽은 현장 · 후속 빼 — 의미 없다」 → 「기존 연결도 현장 · 후속 빼」) — 근거 한 줄만.
# 국내(한국 회사 · 기관) 묶음은 「현장」 칸만 — 후속 칸 없음(9/29 밤 서우 「이건 빼」).
# 거래소 · 인프라(선) · 한국은행은 X · 텔레그램 없이 인사 · 명함까지(공개 신호가 되지 않게).
# 공개 사실 · 공개 레인(x402 측정 데이터 정본 단가 · 데이터셋 협의 · 기기 NFT · 원장 지문 · 11개 출처 합의 · 케이웨더 × Flare 공개 파트너십)만.
MEET = "인사 · X 맞팔 · 텔레그램 추가"
ACT = {
    # DePIN
    "Lacey Wisdom": (f"10/3 18:10 세션 뒤 {MEET} — 그날 마지막 세션이라 놓치지 않게",
                     "메일 — 실외 관측(WeatherXM)과 다른 실내 측정 DePIN 소개 한 장 → 미팅(포트폴리오 t54 와 이어질 자리 포함)"),
    "Nathaniel T. Bradley": (f"10/3 15:05 · 17:45 세션 전후 {MEET}",
                             "메일 — 실내 공기질 측정 데이터를 DataScore 로 점수 매겨 보는 시범 제안(농업 센서 제휴처럼) → 미팅"),
    "Guy Wuollet": (f"KBW 9/30 14:20 패널 뒤 {MEET}",
                    "메일 — 10/3 키노트 영상 · 소개 한 장을 보내 측정 데이터형 DePIN(기기 NFT · 원장 기록) 소개 미팅 요청"),
    "Lasse Clausen": (f"KBW 10/1 14:00 패널 뒤 {MEET}(톰 슈미트와 같은 패널)",
                      "메일 — x402 데이터 구매 수수료를 1kx 온체인 매출 보고서의 DePIN 사례 후보로 건넨다"),
    # AI 에이전트
    "Chandler Fang": (f"10/3 12:35 · 13:15 세션 뒤 {MEET}",
                      "메일 — 우리 x402 측정 데이터 판매 창구를 t54 신뢰 점수(x402-Secure)에 올리는 조건 문의 → 화상 미팅"),
    "Akshat Vaidya": (f"KBW 10/1 13:30 패널 뒤 {MEET}",
                      "메일 — 「에이전트가 가장 과소평가된 기회」 테제에 맞춰 x402 데이터 구매 사례 소개"),
    "Tom Schmidt": (f"KBW 10/1 14:00 패널 뒤 {MEET}",
                    "메일 — 에이전트가 x402 로 측정 데이터를 건당 사는 실사용 사례(XRPL 메인넷)를 소개 한 장으로"),
    "Albert Castellana Lluís": (f"KBW 10/1 14:50 패널 뒤 {MEET}",
                                "메일 — 에이전트가 산 측정 데이터의 품질 다툼을 GenLayer 로 가르는 구조를 묻는 미팅 요청"),
    "Andrea Muttoni": (f"KBW 9/30 14:10 패널 뒤 {MEET}",
                       "메일 — 실내 공기질 시계열 데이터셋(정본 「데이터셋 협의」)을 AI 학습 데이터로 라이선스하는 조건 문의 → 미팅"),
    # 결제
    "Caroline D. Pham": (f"KBW 9/30 14:50 패널 뒤 {MEET}",
                         "메일 — 해외 구매자 결제 경로(카드 → 크립토 온램프)에 MoonPay 를 붙이는 조건 · 절차 문의 → 담당 팀 연결"),
    "John Lilic": (f"10/3 16:10 · 18:10 세션 뒤 {MEET}",
                   "메일 — 해외 구매자가 Tria 카드 · 지갑으로 RLUSD 결제에 들어오는 경로(XRPL 지원 여부부터) 문의 → 미팅"),
    "Tianwei Liu": (f"KBW 10/1 15:00 패널 뒤 {MEET}",
                    "메일 — 동남아 구매자가 XRPL 위 XSGD 로 결제하는 경로 문의 → 미팅"),
    "Jaehyuk Choi": ("10/3 13:45 세션 뒤 인사 · 명함",),  # 국내 — 현장만(9/29 밤 서우 「이건 빼」)
    "Jan-Oliver Sell": (f"KBW 10/1 15:00 패널 뒤 {MEET}(StraitsX 창업자와 같은 패널)",
                        "메일 — 유로 매출을 원화로 정산하는 Pangea 경로의 참여 조건 문의"),
    "SungGuan Yun": ("KBW 9/30 12:00 세션을 듣고 인사 · 명함까지",),  # 국내 — 현장만
    # 그 밖 새 관계
    "Charles Jansen": (f"KBW 10/1 10:40 패널 뒤 {MEET}",
                       "메일 — 날씨 데이터 11개 출처 합의 방법론 요약을 보내고, 데이터 공급자 품질 평가(SSA 같은 틀) 가능성으로 미팅 요청"),
    "Ambre Soubiran": (f"KBW 10/1 10:40 패널 뒤 {MEET}(찰스 얀센과 같은 패널)",
                       "메일 — 다출처 합의값(11개 출처)의 방법론 공개 · 관리를 Kaiko 레퍼런스 레이트 사례에 비춰 묻는 미팅 요청"),
    "Johnny Youn": (f"10/3 15:20 세션 뒤 {MEET}",),  # 국내 — 현장만(9/29 밤 서우 「이건 빼」)
    "Connor Sullivan": (f"10/3 12:05 패널 뒤 {MEET}",
                        "근황 메일까지 — Flare 생태계 소식을 주고받는 관계로"),
    "Michael Ippolito": (f"KBW 10/1 12:15 세션 뒤 {MEET}",
                         "메일 — 10/3 키노트 · 시연 자료를 보내 리서치 · 팟캐스트 소개 타진"),
    "Frank Chaparro": (f"KBW 모더레이터 세션(9/30 14:30 · 16:40 · 10/1 16:20) 뒤 {MEET}",
                       "메일 — 10/3 키노트 · 시연 자료를 보내 The Crypto Tape 인터뷰 거리로 제안"),
    # 우리
    "Sunghwan Kim": ("14:50 키노트 뒤 바로 부스 — 만난 사람과 그 자리에서 X 맞팔 · 텔레그램 추가(메모는 생략)",
                     "행사 뒤 — 이어진 X · 텔레그램으로 이 표 「후속」 칸대로 연락(메일 · 미팅)"),
    # 선 — 인사 · 명함까지, 먼저 연락하지 않는다
    "Kyoungsuk Oh": ("KBW 9/30 10:30 발표 — 자리가 되면 인사 · 명함까지", "먼저 연락하지 않는다(연락이 오면 받는다)"),
    "SeonJoo Yoon": ("KBW 9/30 13:50 세션(모더레이터) 뒤 인사 · 명함까지", "먼저 연락하지 않는다(연락이 오면 받는다)"),
    "Johann Kerbrat": ("KBW 10/1 10:55 · 10/3 17:25 세션 — 인사 · 명함까지", "먼저 연락하지 않는다(연락이 오면 받는다)"),
    "Leonard Hoh": ("10/3 17:25 세션 뒤 인사 · 명함까지", "먼저 연락하지 않는다(연락이 오면 받는다)"),
    "Arjun Sethi": ("KBW 9/30 11:20 발표 — 자리가 되면 인사까지", "먼저 연락하지 않는다(연락이 오면 받는다)"),
    "John D'Agostino": ("KBW 10/1 12:15 세션 뒤 인사 · 명함까지", "먼저 연락하지 않는다(연락이 오면 받는다)"),
    "Mike Belshe": ("KBW 9/30 12:05 세션 뒤 명함까지", "먼저 연락하지 않는다(연락이 오면 받는다)"),
    "Adam Oozeer": ("10/3 16:25 세션 뒤 인사 · 명함까지", "먼저 연락하지 않는다(연락이 오면 받는다)"),
    "Fig": ("10/3 18:10 세션 뒤 인사 · 명함까지", "먼저 연락하지 않는다(연락이 오면 받는다)"),
    "Aniket Jindal": ("10/3 16:25 세션 뒤 인사 · 명함까지", "먼저 연락하지 않는다(연락이 오면 받는다)"),
}


# ── 인물 상세(이름을 누르면 여는 패널) ─────────────────────────────────────────────────
# 조사 = tools/profiles.json(공개 자료 검색 요약 — 9/29 여섯 갈래 조사 + 레이시는 서우 보고서 검증).
# 「우리와의 결」 = 아래 FIT(공개 가능한 사실만 — 페이지에 비밀번호가 없다).
PROFILES = HERE / "profiles.json"
FIT = {
    "Chandler Fang": ["AI 에이전트가 x402 로 데이터를 건당 산다 — 우리 측정 데이터는 x402 단가가 공개돼 있다(집계 · 코호트 · 리포트)",
                      "t54 의 에이전트 신원(KYA) · 결제 전 위험 검사는 「산 데이터가 진짜 측정값인가」와 짝이다 — 기기 NFT · 원장 기록",
                      "XRPL 위 RLUSD 정산 — 같은 원장에서 돈과 데이터가 오간다"],
    "Lacey Wisdom": ["날씨 DePIN(WeatherXM)을 이미 포트폴리오로 안다 — 차별점부터: 실내 공기질 · 케이웨더 30년 관측 · 기업 고객 4,000곳+",
                     "t54(XRPL x402) 시드 공동 주도 — 우리 x402 데이터 판매와 바로 이어지는 화제",
                     "기기 1대 = NFT 1개(위조 방지) — 기고에서 짚은 허위 위치 · 부정 방지 논점과 맞닿는다"],
    "Charles Jansen": ["여러 출처를 합의해 기준값을 내는 방식(우리 날씨 11개 출처 합의)은 지수 방법론과 같은 문법이다",
                       "데이터 회사가 온체인으로 가는 사례 — 「30년 데이터 회사의 DePIN」이 통하는 청중"],
    "Nathaniel T. Bradley": ["데이터를 자산으로 가치평가 · 토큰화 — 측정 데이터의 값을 매기는 같은 테제",
                             "AgSensor 제휴(농업 센서 데이터) — 센서 데이터 선례, 실내 공기질은 옆 칸",
                             "XRPL 무대 단골(XRP Tokyo 2026 · XRP Seoul 2025)"],
    "Johnny Youn": ["XRPL 위 구조화상품(SIVAX) — 전통 금융 상품을 XRPL 로 옮긴 국내 실사용 사례",
                    "국내 XRPL 빌더(KFIP 2026 1위) — 한국 XRPL 판에서 계속 이어질 사람"],
    "Connor Sullivan": ["Flare 생태계의 XRP 보장 층 — 케이웨더 × Flare 공개 파트너십과 같은 판",
                        "10/3 12:05 「XRP 활용 · 자산 토큰화 전망」 — XRP 를 담보로 굴리는 구조를 가장 가까이서 보는 사람"],
    "Caroline D. Pham": ["해외 구매자가 카드 · 계좌로 크립토 결제에 들어오는 온램프 — 해외 판매 결제 경로",
                         "전 CFTC 위원장 대행 — 토큰화 담보 · 파생 규제 감각"],
    "Guy Wuollet": ["DePIN 투자 테제 · 가정 에너지 DePIN(Daylight) — 가정에 기기를 까는 모델을 이미 본 투자자"],
    "Ambre Soubiran": ["시장 데이터 회사가 규제 벤치마크 · 기관 인프라가 된 길 — 날씨 데이터 회사가 가는 방향의 선례"],
    "Jongwook Oh": ["기존 접촉 — 근황 · 인사부터", "국내 x402 패널 — 한국 기관 쪽이 에이전트 결제를 어떻게 보는지 들을 자리"],
    "Tom Schmidt": ["「AI 에이전트 결제 레일」 테제 — 에이전트가 데이터를 건당 사는 결제가 실사용 사례"],
    "Lasse Clausen": ["온체인 매출 · 수수료로 DePIN 을 잰다 — 데이터 구매 수수료가 그 잣대에 맞는다"],
    "Akshat Vaidya": ["「AI 에이전트가 가장 과소평가된 기회」(2025.8) — 에이전트가 데이터를 사는 x402 구조와 같은 방향",
                      "초기 투자자 패널(10/1) — 초기 자본이 지금 어디에 거는지 듣는 자리"],
    "Andrea Muttoni": ["측정 데이터가 AI 학습 데이터로 쓰일 때의 출처 · 라이선스 — The DATA Foundation 의 Trace 가 다루는 문제"],
    "SungGuan Yun": ["예금토큰 · 원화 결제 방향 — 국내 결제 · 정산 환경 파악(듣기만)"],
    "Michael Ippolito": ["데이터 · 리서치 · 팟캐스트(뉴스 부문은 2025.10 폐쇄) — 10/3 시연 뒤 리서치 · 팟캐스트 소개 후보"],
    "Frank Chaparro": ["미디어 — 모더레이터 3세션, 인터뷰 · 콘텐츠 창구"],
    "Hugo Philion": ["케이웨더 × Flare 파트너십(2026.9.5 공개 무대) — 데이터 검증 층",
                     "10/3 13:30 키노트 → 우리 14:50 키노트 — 같은 날 두 무대"],
    "Crypto Eri": ["일본 XRP 커뮤니티 · 영상 채널 — 12:05 패널 좌장", "X · 짧은 영상 확산 창구"],
    "Asheesh Birla": ["이전 XRP 컨퍼런스 인연 — 인사 · 근황", "XRP 를 굴리는 트레저리 — RLUSD 를 XRP 디파이 진입로로 쓰는 전략(공개)"],
    "Changhoon Moon": ["국내 XRP 리테일 청중(장기 보유자 층)", "2026.9.5 Flare 워크숍 같은 무대"],
}


# ── 판정 — KBW 세션(제목 앞부분으로 찾는다) ─────────────────────────────────────────────
SMARK = {
    "x402, AI Payments": ("fit", "x402 = AI 에이전트가 데이터를 건당 사는 결제 방식 — 우리 측정 데이터도 이 방식으로 판다(단가 공개). 카카오페이는 x402 재단 창립 멤버(4월 발족 때 국내 유일, 지금 국내 회원사 4곳) — 한국 x402 흐름을 한자리에서"),
    "The Trillion-Dollar Agentic Economy": ("fit", "AI 에이전트 신뢰 층 — t54 와 같은 문제(에이전트가 데이터를 살 때 무엇을 믿나)"),
    "The Data Race Behind the AI Boom": ("fit", "AI 의 원자재는 데이터 — 측정 데이터 공급자 자리에서 들을 세션"),
    "Putting Real-World Value to Work": ("fit", "실물 가치 × 에이전트 — 「금융 다음은 실물」, 우리 설명과 같은 말(Pharos · RWA L1)"),
    "Agentic Payments: Making the New Internet": ("fit", "에이전트 결제 — AI 가 스스로 값을 치르는 결제, 우리 데이터가 팔리는 방식"),
    "From Market Data to Ratings": ("fit", "데이터 → 등급 → 기관 인프라. S&P Global · Kaiko · 프랭클린템플턴(t54 시드 공동 주도사)"),
    "Your Next Customer Is an AI Agent": ("fit", "「다음 고객은 AI 에이전트」 — 에이전트가 데이터를 사는 우리 판매 구조와 같은 주장"),
    "The Ceiling on the Agent Economy": ("fit", "에이전트 경제의 천장 — 반대 논리도 알아 둘 세션"),
    "Verifiable Computing in the Age of AI": ("fit", "검증 가능한 연산 — 측정값을 검증하는 우리 문제와 같다"),
    "Programmable Machine Needs Programmable Money": ("fit", "기계가 스스로 돈을 쓴다 — 에이전트 결제와 같은 이야기"),
    "When AI Agents Meet Onchain Money": ("fit", "에이전트 × 온체인 결제 — GenLayer · XION"),
    "Sovereignty by Design": ("fit", "데이터 소유 · 주권 — 가정 측정 데이터의 주인은 누구인가"),
    "Trust Oracles in Onchain Economies": ("fit", "가격 오라클 다음은 신뢰 오라클 — 측정 데이터의 신뢰가 우리 상품"),
    "How Capital Is Mapping Crypto's Next Cycle": ("strat", "DePIN · 인프라 자본 지도 — Dragonfly · 1kx · Spartan"),
    "Friends and Family": ("strat", "초기 투자자들이 지금 거는 곳 — Maelstrom(Arthur Hayes 패밀리 오피스) 등"),
    "Korea's Digital Asset Policy Moment": ("strat", "국내 규제 — 보상 · 포인트 · DEX 이용 조건을 정할 때의 전제. 듣기만"),
    "A New Era for Digital Assets in Korea": ("strat", "국내 규제 — 보상 · 포인트 · DEX 이용 조건을 정할 때의 전제. 듣기만"),
    "Digital Currency and the Future Monetary System": ("strat", "한국은행 디지털화폐 — 예금토큰 · 원화 결제 방향"),
}

TAGS = [
    ("AI · 에이전트", r"\bAI\b|Agent|x402|Machine|Intelligence|Models"),
    ("데이터 · 검증", r"Data\b|Oracle|Ratings|Verifiable|Sovereignty|Shinzo"),
    ("스테이블 · 결제", r"Stablecoin|USD|Money|Payments|\bFX\b|Cards|Neobank|Banking|Tether|Currency"),
    ("토큰화 · RWA", r"Tokeniz|RWA|\bSTO|Real-World|Fund Industry|Capital Markets"),
    ("정책 · 규제", r"Polic|Regulat|CLARITY|Washington|Lawyers|Rulebook|Cybercrime|Institutions:"),
    ("거래 · 시장", r"Trad(?!itional)|Market(?!s,)|Hyperliquid|Kraken|Robinhood|Bull|Cycle|ETF|Memecoin|Narratives|Alpha|DATCo"),
    ("DeFi", r"DeFi|Yield"),
    ("한국", r"Korea"),
]

DAYS = [
    {"id": "d0930", "label": "9/30(수)", "event": "KBW2026", "place": "그랜드 워커힐 서울",
     "note": "본 컨퍼런스 1일차 · 무대 3개(아젠다에 무대 이름이 없어 시간순). 우리 부스 · 연사 없음 — 이 관객이 이틀 뒤 10/3 관객이다."},
    {"id": "d1001", "label": "10/1(목)", "event": "KBW2026", "place": "그랜드 워커힐 서울",
     "note": "2일차. 데이터 → 등급 · AI 에이전트 세션이 몰린 날."},
    {"id": "d1003", "label": "10/3(토)", "event": "XRP SEOUL 2026", "place": "그랜드 하얏트 서울",
     "note": "우리 무대 — 김성환 대표 키노트 14:50 · 플래티넘 스폰서 · 부스. 무대 하나라 시간이 곧 순서다."},
]

NOTES_KBW = [
    "9/29 은 업비트 공동 비공개 기관 포럼(초청제) — 이 지도에 없다. 본 컨퍼런스는 9/30 · 10/1.",
    "두 행사에 다 나오는 사람은 KBW 에서 먼저 볼 수 있다 — 한눈에 「두 행사에 다 나오는 사람」.",
]
NOTES = [
    "t54 는 9/28(공식 사이드 「Agentic Payments Onchain」)부터 서울에 있다 — 10/3 챈들러 팡 동선에 참고.",
    "소속 칸: 「추정」 = 알려진 정보라 재확인 전. 9/29 밤 추가 조사로 채운 칸은 인물 패널에 출처가 있다.",
    "__RANK_NOTE__",
    "관련자 표는 전체 연사가 기본 — 「대상 · 관련자만」을 누르면 표시된 사람만 남는다.",
    "★ = 즐겨찾기 — 이름 옆 ☆ 을 누르면 「★ 즐겨찾기」 탭에 모인다. 이 기기에만 저장되고, 「목록 링크 복사」로 다른 기기 · 대표님께 넘긴다.",
    "판정은 제안이다 — 「내 표시」로 바꾸면 이 기기에만 저장되고, 「내보내기」로 복사해 보내 주면 원본에 반영한다.",
    "결 = 사업이 바로 엮이는 곳 — 우리 측정 데이터를 사거나(AI 에이전트 결제) · 검증하거나(오라클 · 평가) · 비슷한 데이터 사업을 "
    "하는 회사 · 전략 = 도와줄 사람 — 투자 · 정책 · 미디어 · 커뮤니티 · 리플 = RLUSD · XRPL 을 만든 회사, 한 번은 인사(공개 직함 기준) · "
    "선 = 말할 때 조심 — 거래소 · 인프라, 인사만 · 우리 = 김성환 대표 키노트.",
    "사람마다 — 위는 왜 봐야 하나(무엇을 하는 곳 → 우리에게 왜), 아래 할 일은 두 칸. 「현장」 = 만남까지(어디서 만나 인사 · X 맞팔 · 텔레그램 추가 — "
    "메모할 시간은 없고, 발표 · 제안 · 협력을 그 자리에서 만들지 않는다) · 「후속」 = 행사 뒤 메일 · 미팅에서 여는 일. 리플 · 기존 연결 묶음은 할 일 칸 없이 근거만, 국내 묶음은 「현장」 칸만.",
]
FOOT = [
    "출처 — __SRC__XRP SEOUL 2026 주최 프로그램 이미지 + 9/29 공개 자료 검색 요약"
    "(reports/XRP SEOUL 2026 연사 프로필.md · 9/29 밤 추가 조사) · 판정 = 우리 내부 기록.",
    "설명은 검색 요약 기준이다 — 대외 인용 전 원출처를 연다. 이 페이지와 링크는 밖으로 돌리지 않는다.",
]

# ── KBW2026 프로그램 서브페이지(www/kbw.html) — 9/29 밤 서우 「kbw 는 다시 별도 서브페이지로. 다른 것 넣지 말고 어떤 행사인지와
#    프로그램 위주로 연사 소개만 간략히 — 우리가 그때 누구를 만나 무엇을 한다거나 후속 미팅 같은 건 절대 없다, 그냥 참여하는 거니까」.
#    싣는 것 = 행사 사실 · 시간순 세션 · 연사 이름 · 소속 · 직함 · 회사 한 줄. 표시 · 근거 · 할 일 · 순위 · 인물 상세 · 즐겨찾기는 없다.
KBW_TPL = HERE / "kbw.html"
KBW_RES = HERE / "kbw-speakers-0929.json"  # 9/29 밤 — 소속이 빈 KBW 연사 조사(네 갈래)
KBW_DAYS = [{"id": "d0930", "label": "9/30(수)", "nth": "1일차"}, {"id": "d1001", "label": "10/1(목)", "nth": "2일차"}]
KBW_FOOT = [
    "출처 — KBW2026 공개 아젠다(9/29 기준, 본 컨퍼런스 이틀) · 행사 소개는 파이낸셜뉴스 · 주최 보도자료 · 공식 사이트(위 링크).",
    "소속 · 직함은 공개 자료 검색 요약(9/29)이다. 「추정」은 재확인 전, 빈 칸은 아직 찾지 못한 연사 — 인용 전 원출처를 연다.",
    "세션 아래 한 줄은 제목을 한국어로 옮긴 것이고(발표 내용 요약이 아님), 그 아래 회색 한 구절은 보도 · 보도자료에서 옮겼다. "
    "주제는 제목 기준으로 하나씩 붙였다.",
    "핵심 · 주요는 공개 직함 · 회사 규모 · 주최 발표를 기준으로 한 편집 판단이다 — 핵심 = 업계 전반이 아는 이름(주요 거래소 · 프로토콜 · 기관의 "
    "대표 · 창업자, 전 · 현직 정책 결정자, 주최가 앞세운 연사), 주요 = 큰 회사 · 기관의 임원, 이름난 프로젝트 창업자, 정책 단체 · 미디어 대표, "
    "대중 인지도가 있는 인물.",
]
# 소속 · 회사 한 줄은 짧게 — 조사 문장의 메모성 괄호(보도 · 기준 · 확인 …) · 투자액 · 목표치 같은 뒷문장은 싣지 않는다.
KBW_NOTE = r"보도|기준|확인|추정|팩트체크|회사 발표|세션|모더레이터|소개|인물 DB"


def kbw_org(s):
    s = re.sub(r"\s*\([^()]*(?:%s)[^()]*\)" % KBW_NOTE, "", s)                    # 메모성 괄호
    s = re.sub(r"(?<=\S)\((?:[A-Za-z0-9][A-Za-z0-9 .,&'/+·-]*)\)", "", s)          # 영문 중복 괄호 (GP) · (Talus Labs)
    s = re.sub(r"\s+—\s+(.*)$", lambda m: "" if re.search(KBW_NOTE, m.group(1)) else " · " + m.group(1), s)
    return re.sub(r"\s{2,}", " ", s).strip(" ·")


def kbw_co(s, org, limit=50):
    if not s or s.startswith("소속 기업 없음"):
        return ""
    s = re.sub(r"\s*\([^()]*(?:%s)[^()]*\)" % KBW_NOTE, "", s)
    m = re.match(r"^([^—:：]{1,30}?)\s*(?:—|:)\s+(.+)$", s)                          # 「회사 — 설명」이면 회사 이름을 뗀다
    if m and (not re.search(r"[가-힣]", m.group(1)) or m.group(1).split("(")[0].strip() in org):
        s = m.group(2)
    s = re.split(r"\.\s+", s)[0].split(" — ")[0].strip().rstrip(".")
    if len(s) > limit:
        cut = max(s.rfind(" · ", 0, limit), s.rfind(", ", 0, limit), s.rfind("·", 0, limit))
        s = (s[:cut] if cut >= 18 else s[:limit]).rstrip(" ·,") + "…"
    bare = re.sub(r"\s", "", s).rstrip("…")
    return "" if bare and bare in re.sub(r"\s", "", org) else s


# 자동으로 줄이면 어색해지는 회사 한 줄 — 위 조사 문장에서 줄인 말(새 사실 0)
KBW_CO_FIX = {
    "Ann Chien": "Web3 게임 · DeFi · 인프라에 투자하는 벤처 펀드",
    "Burnt Banksy": "지갑 · 가스 같은 크립토 요소를 감춘 소비자용 레이어1",
    "Dhawal Shah": "자연어 · 음성 명령을 온체인 실행으로 바꾸는 AI 크립토 코파일럿",
    "Haonan Li": "스테이블코인 FX 전문 이더리움 L2",
    "Itai Elizur": "Web3 PR · 마케팅 에이전시(Chainwire = 업계 보도자료 배포 서비스)",
    "Jakob Kronbichler": "스테이블코인 결제 흐름을 금융하는 수익형 디지털 달러 프로토콜",
    "Jan-Oliver Sell": "유럽 은행 컨소시엄이 세운 MiCA 규제 유로 스테이블코인 발행사",
    "Jing Wang": "이더리움 L2 · 오픈소스 롤업 스택 OP Stack",
    "Lorenzo Romagnoli": "USDT 를 여러 체인으로 옮기는 옴니체인 유동성 레이어",
    "Michael Figge": "BAYC · CryptoPunks 를 보유한 NFT · 엔터테인먼트 기업",
    "Nate Holiday": "조회 결과에 ZK 증명(Proof of SQL)을 붙이는 검증형 데이터 웨어하우스",
    "Raafi Hossain": "신흥시장 대상 샤리아 준수 스테이블코인 네오뱅크",
    "Raagulan Pathy": "Visa 카드로 쓰는 스테이블코인 네오뱅크",
    "Sylvia To": "기관 중심 디지털자산 거래소 그룹(CoinDesk 모회사)",
    "Tristan Thompson": "NBA 선수를 토큰화한 온체인 판타지 농구",
    "Wish Wu": "실물자산 · 전통금융 자본을 온체인으로 옮기는 레이어1",
    "Andrey Lazorenko": "ZKsync 기반 ADI Chain 운영(아부다비 IHC 계열)",
    "Laura Estefania": "Web3 기업 대상 PR · 미디어 전략 자문사",
    "Wonseok Baek": "",
    "Andrew Park": "",  # 소속 줄에 「KBW 주최사」가 이미 있다
    "Jake Salerno": "탈중앙 AI 인프라(데이터 가용성 · 저장 · 연산)",  # 조사 문장의 「최초의 …를 표방」 대신 같은 회사 대표 줄과 같은 말
}
KBW_ORG_FIX = {"Taweh Beysolow II": "Bond Labs · CEO",
               "Harry Jung": "Nxum · 전 백악관 가상자산 자문위원회 부국장",                  # 파이낸셜뉴스 9/28(KBW2026 개막 기사)
               "Chetan Karkhanis": "프랭클린템플턴 · 디지털자산 고객전략 수석부사장"}         # 같은 기사

# 이 페이지에는 우리 쪽 판단 · 계획이 한 글자도 없어야 한다(공개 관문 PUBLIC_BAN 에 더해)
# (제3자 회사 설명의 「텔레그램 · TON」, 「분쟁을 판정하는」은 막지 않는다 — 우리 행동을 뜻하는 표현만)
KBW_BAN = [r"우리(?!은행|금융|카드|투자|자산|종금)", r"웰비안", r"(?i)wellbian", r"케이웨더", r"(?i)kweather", r"후속", r"미팅", r"할 일",
           r"현장", r"명함", r"맞팔", r"텔레그램 추가", r"관련자", r"판정 전|판정 기록|우리 판정", r"측정 데이터", r"(?<![가-힣])결(?![가-힣])",
           r"키노트 14:50"]

# ── 9/29 밤 서우 「중요 인물 · 연관 주제 · 인물 프로그램을 따로 볼 수 있게 필터 칩, 10/1 을 먼저 — 행사 소개 · 프로그램 소개가
#    부실하고 너무 나열식」. 페이지에는 분류 결과(표시)만 싣고, 이유 · 판단 근거는 싣지 않는다.
# 행사 소개 — 보도 · 주최 발표로 확인한 사실만(출처는 페이지 아래 링크로)
KBW_ABOUT = {
    "lead": "Korea Blockchain Week(KBW)는 팩트블록(FACTBLOCK)이 2018년부터 해마다 서울에서 여는 블록체인 컨퍼런스로, 올해가 9회째다. "
            "올해 이름은 「KBW2026 with Upbit」 — 업비트(두나무)가 프레젠팅 파트너로 붙어, 개인 투자자 중심이던 국내 논의를 "
            "기관 · 글로벌 금융까지 넓히는 것을 내걸었다.",
    "facts": [
        ("일정", "본 컨퍼런스 9/30(수) · 10/1(목)", "9/29 은 기관 · 금융권 대상 초청제 「업비트 인스티튜셔널 서밋」"),
        ("장소", "워커힐 호텔앤리조트(서울 광진구)", ""),
        ("스폰서", "두나무(업비트) · 0G · BRV · 비트고 · 스테이블 · 트리아", "주최가 9/9 에 밝힌 주요 스폰서"),
        ("주제", "기관 투자자의 시장 참여 · 금융 인프라 · 스테이블코인 · 실물자산(RWA) 토큰화 · AI × 블록체인 · 글로벌 규제 변화", ""),
        ("규모", "__SIZE__", "공개 아젠다 기준(무대 이름이 없어 시간순) · 공식 소개는 세션 100개+ · 연사 300명+"),
    ],
    # 주최 보도자료가 앞세운 연사(이름 · 보도 직함) — 페이지에서 누르면 그 세션으로 간다
    "head": [("Tom Lee", "BitMine 회장"), ("Arthur Hayes", "Maelstrom CIO"), ("Joe Lubin", "이더리움 공동창업자 · Consensys CEO"),
             ("Kyoungsuk Oh", "두나무(업비트) 대표"), ("Jeff Yan", "Hyperliquid Labs CEO"), ("Bo Hines", "Tether USA₮ CEO"),
             ("Harry Jung", "전 백악관 가상자산 자문위원회 부국장"), ("Brian Quintenz", "전 CFTC 위원"), ("Monica Long", "리플 사장")],
    "src": [("파이낸셜뉴스 9/9", "https://www.fnnews.com/news/202609090854147727"),
            ("파이낸셜뉴스 9/21", "https://www.fnnews.com/news/202609211904271582"),
            ("파이낸셜뉴스 9/28", "https://www.fnnews.com/news/202609281825215665"),
            ("주최 보도자료(연사)", "https://www.chainbits.com/press-releases/kbw2026-brings-global-finance-policy-and-crypto-leaders-to-seoul"),
            ("공식 사이트", "https://koreablockchainweek.com/")],
}
KBW_KO = {  # 소개 · 하이라이트에 나오는 연사 한글 이름(보도 표기가 있으면 그대로)
    "Tom Lee": "톰 리", "Arthur Hayes": "아서 헤이즈", "Joe Lubin": "조 루빈", "Jeff Yan": "제프 얀", "Bo Hines": "보 하인스",
    "Harry Jung": "해리 정", "Brian Quintenz": "브라이언 퀸텐즈", "Monica Long": "모니카 롱", "Balaji Srinivasan": "발라지 스리니바산",
    "Eleanor Terrett": "엘리너 테렛", "Gene Fang": "진 팡", "Chetan Karkhanis": "체탄 카르카니스", "Johann Kerbrat": "요한 케르브라",
    "Guy Young": "가이 영", "Yat Siu": "얏 시우",
}
# 주제 — 세션마다 하나(제목 기준). 순서 = 페이지 순서
KBW_THEMES = [
    ("open", "기조 발표", "주최 · 프레젠팅 파트너 대표 발표, 둘째 날 첫 시간대 단독 발표"),
    ("policy", "정책 · 규제", "미국 · 아시아 규제 당국 · 입법 · 정책 단체 · 법조 — 규칙이 어떻게 바뀌나"),
    ("inst", "기관 금융 · 토큰화", "은행 · 운용사 · 평가사가 온체인으로 옮겨 가는 길 — 토큰화 · RWA · 기관 인프라"),
    ("stable", "스테이블코인 · 결제", "스테이블코인 발행 · 결제 · 카드 · 외환 정산 · 지갑"),
    ("ai", "AI · 데이터", "AI 에이전트와 결제 · 검증 가능한 연산 · 데이터 소유 · 신뢰 오라클"),
    ("market", "시장 · 투자", "거래 · 사이클 · ETF · 트레저리 기업 · 벤처 자본의 흐름"),
    ("tech", "기술 · 인프라", "L1 · L2 · DeFi 스택 · 보안 · 프라이버시"),
    ("korea", "한국 시장", "한국은행 · 국회 · 증권 · 거래소 협의체 — 국내 제도와 시장"),
    ("culture", "문화 · 커뮤니티", "밈 · 수집품 · 스포츠 · 엔터테인먼트"),
    ("etc", "그 밖", "연사 표기 없는 발표"),
]
# 세션 → (주제, 한 줄 풀이). 한 줄 = 제목을 우리말로 푼 것(새 사실 0) — 판게아만 보도자료 한 구절을 붙인다
KBW_SESS = {
    # 9/30
    "Global Money, Local Rails": ("stable", "글로벌 돈, 로컬 결제망 — 스테이블코인이 주류로"),
    "What Professional Traders See": ("market", "전문 트레이더는 보고 개인 투자자는 놓치는 것"),
    "The Next Chapter of Connection": ("open", "연결의 다음 장 — 주최 팩트블록 대표 발표"),
    "How to Make DeFi Great Again": ("tech", "DeFi 를 다시 위대하게"),
    "From Hong Kong and Jakarta to Bangkok": ("policy", "홍콩 · 자카르타 · 방콕 — 아시아 디지털자산의 새 규칙"),
    "Beyond Trading: Building Financial Infrastructure": ("open", "거래를 넘어 — 더 연결된 미래를 위한 금융 인프라(두나무 대표 발표)"),
    "Beyond Tokenization: Markets, Not Chains": ("inst", "토큰화 너머 — 체인이 아니라 시장"),
    "FLOP: Bigger Than Bitcoin": ("market", "「FLOP: 비트코인보다 크다」 — 아서 헤이즈 단독 발표"),
    "Next Million Chains": ("tech", "다음 백만 개의 체인"),
    "How Hyperliquid Pilled Wall Street": ("market", "하이퍼리퀴드는 어떻게 월가를 24시간 거래로 끌어들였나"),
    "The Future of Banking": ("inst", "은행의 미래 — 핵심 금융 인프라 고도화"),
    "Ethereum's Wall Street Moment": ("market", "이더리움의 월가 순간"),
    "Kraken's Quest": ("market", "크라켄의 도전 — 거래소에서 글로벌 금융 인프라로"),
    "Trade Everything": ("market", "모든 것을 거래하다 — 글로벌 시장을 잇는 통합 거래 플랫폼"),
    "Canton's Bet on Connected Capital Markets": ("inst", "캔톤이 거는 곳 — 연결된 자본시장"),
    "Beyond Scale: What L1s Are for Now": ("tech", "확장성 너머 — 지금 L1 은 무엇을 위해 있나"),
    "MetaMask's Next Chapter": ("tech", "메타마스크의 다음 장 — 열린 돈"),
    "From Staking to Stablecoins": ("tech", "스테이킹에서 스테이블코인까지 — 새 수익 구조"),
    "Digital Currency and the Future Monetary System": ("korea", "디지털화폐와 미래 통화 체계 — 한국의 다음 설계"),
    "$50M Fund. Deploy on BOT Chain": ("ai", "$50M 펀드 — 에이전트 경제 · RWA 를 내건 AI 네이티브 블록체인 BOT Chain"),
    "Securing the Institutional Crypto Era": ("inst", "기관 크립토 시대의 보안"),
    "x402, AI Payments": ("ai", "x402 · AI 결제 · 프라이버시 — 스스로 거래하는 층 만들기"),
    "Who Can Take the Money": ("etc", "누가 돈을 가져가나"),
    "The Trillion-Dollar Agentic Economy": ("ai", "1조 달러 에이전트 경제 — AI 에이전트의 신뢰 층"),
    "Bringing Millions of Consumers Onchain": ("tech", "수백만 소비자를 온체인으로"),
    "Sponsored Session: Shinzo Network": ("etc", "후원 세션 — Shinzo Network"),
    "From Silos to Superapp": ("tech", "사일로에서 슈퍼앱으로 — DeFi 의 미래"),
    "A New Era for Digital Assets in Korea": ("korea", "한국 디지털자산의 새 시대"),
    "How Narratives Move Markets": ("market", "내러티브는 시장을 어떻게 움직이나"),
    "Bitcoin's Next Frontier": ("tech", "비트코인의 다음 개척지 — 가치 저장에서 생산적 자본으로"),
    "The Future of Digital Finance": ("inst", "디지털 금융의 미래 — 프로그래머블 경제 안내"),
    "Who Wins When Intelligence Becomes Abundant": ("ai", "지능이 넘쳐날 때 누가 이기나"),
    "Beyond CLARITY": ("policy", "CLARITY 법 이후 — 미국 크립토 시장의 다음 단계"),
    "Korea's Digital Asset Policy Moment": ("korea", "한국 디지털자산 정책의 결정적 순간"),
    "Defending DeFi": ("tech", "DeFi 지키기 — 예방에서 공동 대응까지"),
    "The Data Race Behind the AI Boom": ("ai", "AI 붐 뒤의 데이터 경쟁"),
    "Stable: The First USD₮-Native Blockchain": ("stable", "Stable — USD₮ 로 움직이는 실물 정산용 블록체인"),
    "Tokenizing the Fund Industry": ("inst", "펀드 산업의 토큰화 — 전통 운용사와 RWA 프로토콜 잇기"),
    "Tokenizing AI Models": ("ai", "AI 모델의 토큰화 — 탈중앙 지능이라는 새 자산군"),
    "From Diplomacy to Digital Ownership": ("policy", "외교에서 디지털 소유로"),
    "The Stablecoin Paradox": ("stable", "스테이블코인의 역설 — 실결제의 투명성과 프라이버시"),
    "Lawyers, Liability and the Next US Crypto Regime": ("policy", "변호사 · 책임 · 미국 크립토 규제의 다음 체제"),
    "How Tokenization Is Rewiring Wall Street": ("inst", "토큰화는 월가를 어떻게 다시 짜나"),
    "DeFi Is Dead, Long Live On-Chain Finance": ("tech", "DeFi 는 죽었다, 온체인 금융 만세"),
    "How Industry and Regulators Can Work Together": ("policy", "업계와 규제 당국이 함께 여는 기관 시대"),
    "Putting Real-World Value to Work": ("inst", "실물 가치를 일하게 하다 — 에이전트 · 자산 · 새 RealFi 경제"),
    "Agentic Payments: Making the New Internet": ("ai", "에이전트 결제 — 새 인터넷 만들기"),
    "The Rise of Crypto-Native Neobanks": ("stable", "크립토 네이티브 네오뱅크의 부상"),
    "ASX": ("etc", ""),
    "What Policymakers Need to Hear": ("policy", "정책 결정자가 들어야 할 말"),
    "More Assets, More Geos": ("inst", "더 많은 자산, 더 많은 지역 — RWA 가 세계로 번지는 법"),
    "How Tether Became Global Financial Infrastructure": ("stable", "테더는 어떻게 글로벌 금융 인프라가 됐나"),
    "Can DeFi Beat Wall Street": ("tech", "DeFi 는 월가를 월가의 방식으로 이길 수 있나"),
    "Culture, Collectibles and the Meme Economy": ("culture", "문화 · 수집품 · 밈 경제"),
    "Crypto Policy 2027": ("policy", "크립토 정책 2027 — 시장을 가를 싸움들"),
    "Can Permissionless Networks Thrive": ("tech", "기관 크립토 시대에도 무허가형 네트워크가 클 수 있나"),
    "Finding Alpha in the Hyperliquid Ecosystem": ("market", "하이퍼리퀴드 생태계에서 초과수익 찾기"),
    "Leveraging AI for Financial Trading": ("ai", "금융 트레이딩에 AI 쓰기"),
    "Satoshi's Dream? Mission Possible": ("culture", "사토시의 꿈? 미션 파서블"),
    "The Road Ahead: Washington's Next Move": ("policy", "앞으로의 길 — 워싱턴의 다음 디지털자산 규제"),
    # 10/1
    "From Online Tribes to Startup Societies": ("open", "온라인 부족에서 스타트업 사회로"),
    "What Institutions Need to Move Onchain": ("inst", "기관이 온체인으로 옮겨 가려면 무엇이 필요한가"),
    "Project Pangea: Rewiring Global FX": ("stable", "프로젝트 판게아 — 국제 외환(FX) 결제를 다시 잇다"),
    "Fireside: Nxum's Harry Jung": ("policy", "해리 정(Nxum) 대담"),
    "Is the Bull Back?": ("market", "강세장은 돌아왔나 — 지금 시장 읽기"),
    "Will Bitcoin's 4-Year Cycle Ever Die?": ("market", "비트코인 4년 주기는 끝날까"),
    "SCAN": ("etc", ""),
    "US Tech Policy: Is DeFi on the Agenda?": ("policy", "미국 기술 정책 — DeFi 도 의제에 올랐나"),
    "From Market Data to Ratings": ("inst", "시장 데이터에서 신용등급까지 — 크립토의 새 기관 인프라"),
    "Your Next Customer Is an AI Agent": ("ai", "다음 고객은 AI 에이전트 — 에이전트가 찾고 이해하고 살 수 있는 상품"),
    "Where Robinhood's Reach Meets Decentralized Trading": ("market", "로빈후드의 이용자 기반이 탈중앙 거래와 만나는 곳"),
    "Institutional Tokenization at Scale": ("inst", "기관 토큰화 — 시범 사업에서 실제 운영으로"),
    "Beyond Standard Tokens": ("inst", "표준 토큰 너머 — 기관이 쓸 수 있는 규정 준수형 RWA 설계"),
    "The New DeFi Stack": ("tech", "새 DeFi 스택 — 합성 달러와 초고속 거래의 만남"),
    "L2 Adoption Won. Did L2s?": ("tech", "L2 방식은 이겼다 — L2 들도 이겼나"),
    "The Ceiling on the Agent Economy": ("ai", "에이전트 경제의 천장은 어디인가"),
    "What TradFi Needs to Go Onchain": ("inst", "전통 금융이 온체인으로 가려면"),
    "Where AI Meets Blockchain": ("ai", "AI 와 블록체인이 만나는 곳 — 토큰에 담기는 가치"),
    "Why Your Money Still Lives in Too Many Places": ("stable", "돈은 왜 아직 너무 여러 곳에 흩어져 있나"),
    "Onchain Finance's Speed Problem": ("tech", "온체인 금융의 속도 문제"),
    "Liquid Everything": ("korea", "모든 것의 유동화 — 토큰증권(STO)이 바꾸는 한국 자본시장"),
    "Stablecoins, Securities, and the Frictionless Future": ("stable", "스테이블코인 · 증권 — 마찰 없는 미래"),
    "Wall Street's Crypto Reckoning": ("inst", "월가의 크립토 결단 — 올인인가, 접을 것인가"),
    "The Self-Custodial Banking Stack": ("stable", "기관이 올라탈 자기수탁형 뱅킹 스택"),
    "Friends and Family": ("market", "크립토 초기 투자자들은 지금 어디에 거나"),
    "GASOK Presentation": ("etc", "GASOK 발표"),
    "Membership Has Its Privileges": ("stable", "크립토 카드는 기존 카드와 겨룰 수 있나"),
    "What's Next for the $TRUMP Coin": ("culture", "$TRUMP 코인의 다음 단계"),
    "Verifiable Computing in the Age of AI": ("ai", "AI 시대의 검증 가능한 연산"),
    "The Problem Blockchain Doesn't Solve": ("tech", "블록체인이 풀지 못하는 문제"),
    "How Capital Is Mapping Crypto's Next Cycle": ("market", "자본은 크립토의 다음 사이클을 어떻게 그리나"),
    "Programmable Machine Needs Programmable Money": ("ai", "프로그래밍 가능한 기계에는 프로그래밍 가능한 돈이 필요하다"),
    "Inside the Institutions": ("policy", "기관 안에서 본 지금의 블록체인 — 정책 · 인프라 · 법"),
    "Inventing the Decentralized Future With Gno.land": ("tech", "Gno.land 로 짓는 탈중앙 미래"),
    "The Internet of Privacy": ("tech", "프라이버시 인터넷 — 차세대 웹3 의 사적 인프라"),
    "Crypto ETFs": ("market", "크립토 ETF — 틈새 상품에서 기본 편입 자산으로?"),
    "When AI Agents Meet Onchain Money": ("ai", "AI 에이전트가 온체인 돈을 만날 때"),
    "Beyond the Game: Athletes Become Owners": ("culture", "경기 너머 — 선수가 주인이 되다"),
    "What's the Future of Non-USD Stablecoins?": ("stable", "달러 밖 스테이블코인의 미래"),
    "Sovereignty by Design": ("ai", "설계된 주권 — 데이터 · AI · 소유가 만나는 곳"),
    "What Drives the Next Wave of Stablecoin Adoption?": ("stable", "스테이블코인 확산의 다음 물결은 무엇이 이끄나"),
    "Smarter Models, Harder Problems": ("ai", "더 똑똑한 모델, 더 어려운 문제 — 놀이 · 학습 · AI 의 미래"),
    "On the Front Lines of Cybercrime": ("policy", "사이버 범죄의 최전선 — 정보 · 보안 · 자금세탁방지"),
    "T.J. Miller Is Ready to Roast": ("culture", "코미디언 T.J. 밀러의 로스트(풍자) 무대"),
    "How DATCos Are Getting Creative": ("market", "디지털자산 트레저리 기업(DATCo)들의 새 전략"),
    "What the Market Data Is Really Saying": ("market", "시장 데이터가 실제로 말하는 것"),
    "Korea's Next Generation of Digital Asset Venues": ("korea", "한국의 차세대 디지털자산 거래 시장"),
    "Memecoins Will Never Die": ("culture", "밈코인은 죽지 않는다"),
    "Trust Oracles in Onchain Economies": ("ai", "신뢰 오라클 — 가격 오라클이 DeFi 를 만들었다면, 신뢰 오라클이 키운다"),
    "Sponsored Session: BTQ Technologies": ("tech", "후원 세션 — BTQ Technologies(양자내성 보안)"),
}
KBW_SESS_NOTE = {  # 제목만으로는 뜻이 닫히는 세션에 붙이는 보도 한 구절(출처 = KBW_ABOUT src 밖이면 여기 주석)
    "Project Pangea: Rewiring Global FX": "체인링크와 여러 나라 은행 컨소시엄이 추진하는 국제 외환 T+0 정산 틀 — 체인링크 보도자료",  # PR Newswire 2026 「Chainlink and Multinational Banking Consortia Launch Project Pangea」
    "Fireside: Nxum's Harry Jung": "전 백악관 가상자산 자문위원회 부국장 — 블록체인 정책의 현재와 미래를 다루는 대담(파이낸셜뉴스 9/28)",
}
# 업계 중요도 — 공개 직함 · 회사 규모 · 주최 발표 기준의 편집 판단(우리와의 관계와 무관)
KBW_IMP_A = {  # 핵심 — 업계 전반이 아는 이름
    "Kyoungsuk Oh", "Arjun Sethi", "Tom Lee", "Arthur Hayes", "Joe Lubin", "Jeff Yan", "Bo Hines", "Harry Jung", "Brian Quintenz",
    "Monica Long", "Balaji Srinivasan", "Caroline D. Pham", "Jing Wang", "Ed Felten", "Guy Young", "Paul Frambot", "Keone Hon",
    "Jae Kwon", "Yat Siu", "Yuval Rooz", "Mike Belshe", "Johann Kerbrat", "Muneeb Ali", "Byoungdeok Min", "SungGuan Yun",
}
KBW_IMP_B = {  # 주요 — 큰 회사 · 기관의 임원, 이름난 프로젝트 창업자 · CEO, 정책 단체 · 미디어 대표, 대중 인지도
    "Guy Wuollet", "Miles Jennings", "Tom Schmidt", "Franklin Bi", "Lasse Clausen", "Kelvin Koh", "Zhuoqun Bian",
    "Jaejin Kim", "Andrew Park", "SeonJoo Yoon",
    "Eleanor Terrett", "Camila Russo", "Frank Chaparro", "Michael Ippolito", "Michael Lau", "Steve Chung",
    "Sheila Warren", "Chris Brummer", "Lindsay Fraser", "Cody Carbone", "Miller Whitehouse-Levine", "Amanda Tuminelli", "Chris Land",
    "Wai Lum Kwok", "Uli Agustina", "Huei Ching Wong", "Trevor Traina", "Teresa Goody Guillén",
    "John D'Agostino", "John Darsie", "Chetan Karkhanis", "Gene Fang", "Charles Jansen", "Ambre Soubiran", "Alvin Chia",
    "Niki Ariyasinghe", "Jan-Oliver Sell", "Tianwei Liu", "Joseph Chalom", "David Schamis", "Katherine Dowling", "Alex Thorn", "Hong Kim",
    "Mike Silagadze", "Eric Chen", "Felix Fan", "Michael Heinrich", "Howard Wu", "Austin Federa", "Vladimir Novakovski",
    "Michael Figge", "Ben Fielding", "Todd McDonald", "Brian Mehler", "Sam MacPherson", "Alex Cutler",
    "Ansem", "T.J. Miller", "Tristan Thompson", "Bill Zanker", "Justin Waldron",
}
# 연관 — 표시가 붙은 연사(분야 · 전략 · 리플 · 기존 연결) + 연사 지도에서 뺐던 0G · RedStone + 9/29 조사 관련도 3. 페이지엔 이유를 싣지 않는다
KBW_REL_EXTRA = {"Yijing Shi", "Kevin Liu", "Wonseok Baek"}
# 10/1 을 먼저 — 하루 소개 · 놓치기 아까운 세션(업계 쪽 무게 기준)
KBW_DAY_INTRO = {
    "d1001": {
        "lead": "둘째 날 오전은 기관 금융 · 토큰화 세션이 가장 많고, 오후는 AI · 데이터와 시장 · 투자 세션이 몰린다 — 밈코인 · 스포츠 · "
                "코미디 같은 문화 무대도 끼어 있다. 10:00 발라지 스리니바산 발표와 함께 문을 열고, 10:15 에 해리 정 전 백악관 "
                "가상자산 자문위원회 부국장의 정책 대담이 이어진다.",
        "hl": [("From Online Tribes to Startup Societies", "첫 시간대 단독 발표 — 『The Network State』 저자 발라지 스리니바산"),
               ("Fireside: Nxum's Harry Jung", "전 백악관 가상자산 자문위원회 부국장 · 진행 엘리너 테렛"),
               ("From Market Data to Ratings", "무디스 레이팅스 · S&P Global · 프랭클린템플턴 · Kaiko 가 한 무대"),
               ("The New DeFi Stack", "Ethena 의 가이 영 · Lighter 의 블라디미르 노바코프스키"),
               ("Smarter Models, Harder Problems", "The Block CEO 진행 · Gensyn · play.fun · Advanced AI Society"),
               ("What's the Future of Non-USD Stablecoins?", "유로(Qivalis) · 싱가포르 달러(StraitsX) · 외환 L2(Codex)")],
    },
}


def key(name):
    n = re.sub(r"^(Hon\.|Dr\.)\s+", "", name.strip())
    return re.sub(r"\s+", " ", n)


def tags_for(title):
    out = [t for t, rx in TAGS if re.search(rx, title)]
    return out[:3]


def parse_agenda():
    sessions, people = [], {}
    for i, ln in enumerate([l for l in AGENDA.strip().splitlines() if l.strip()]):
        day, s, e, title, spk = (x.strip() for x in ln.split("|"))
        did = {"9/30": "d0930", "10/1": "d1001"}[day]
        sp = []
        for raw in [x.strip() for x in spk.split(";") if x.strip()]:
            mod = raw.endswith("*")
            nm = re.sub(r"\s+", " ", raw.rstrip("*").strip())
            k = key(nm)
            p = people.setdefault(k, {"name": nm, "org": "", "src": "", "ev": set()})
            p["ev"].add("KBW")
            sp.append({"p": k, "mod": mod})
        kind = "break" if title == "네트워킹 점심" else ("slot" if not sp else "session")
        mark, why = "", ""
        for pre, (m, w) in SMARK.items():
            if title.startswith(pre):
                mark, why = m, w
        sessions.append({"id": f"k{i:03d}", "day": did, "start": s, "end": e, "title": title,
                         "tags": tags_for(title) if kind != "break" else [], "kind": kind,
                         "mark": mark, "why": why, "sp": sp})
    for k, p in people.items():
        if k in ORG:
            p["org"], p["src"] = ORG[k]
    used = set(SMARK) - {pre for pre in SMARK if any(s["title"].startswith(pre) for s in sessions)}
    assert not used, ("SMARK 제목 불일치", used)
    missing = [k for k in ORG if k not in people]
    assert not missing, ("ORG 이름 불일치", missing)
    return sessions, people


def md_rows():
    s = MD.read_text(encoding="utf-8")
    rows = []
    for ln in s.splitlines():
        if not ln.startswith("|"):
            continue
        c = [x.strip() for x in ln.strip().strip("|").split("|")]
        if c[0] in ("연사 · 소속",) or re.fullmatch(r"-+", c[0]):
            continue
        rows.append(c)
    return rows


def clean(t):
    t = t.replace("==", "").replace("!!", "")
    t = re.sub(r"\{\{(.+?)\}\}", r"\1", t)
    t = t.replace("[추론]", "(추론)")
    t = t.replace("前 ", "전 ")  # Pretendard 에 한자 글리프가 없다 — PDF 서체가 섞이지 않게
    return t.strip()


def english(name):
    m = re.search(r"[A-Za-z][A-Za-z .'\-]*$", name)
    return m.group(0).strip() if m else name


def block_of(t):
    return "b1" if t < "13:45" else "b2" if t < "15:05" else "b3" if t < "16:25" else "b4"


def parse_xrps(people):
    sess = {}
    for c in md_rows():
        who, sessions_txt, co, pe, fit = (clean(x) for x in c[:5])
        name, _, org = who.partition(" · ")
        en = english(name)
        k = key(en)
        p = people.setdefault(k, {"name": en, "org": "", "src": "", "ev": set()})
        p["ev"].add("XRP SEOUL")
        p["ko"] = name[: len(name) - len(en)].strip()
        p["xorg"] = org
        p["co"] = [x.strip() for x in co.split("<br>")]
        p["pe"] = [x.strip() for x in pe.split("<br>")]
        if fit:
            p["xwhy"] = fit
        ours = "★ 우리 키노트" in sessions_txt
        for part in sessions_txt.split(" / "):
            part = part.replace("★ 우리 키노트", "").strip()
            t, _, title = part.partition(" ")
            s = sess.setdefault(t, {"titles": [], "sp": [], "ours": False})
            s["titles"].append(title.strip())
            s["sp"].append({"p": k, "mod": False})
            s["ours"] = s["ours"] or ours
    out = []
    for t in sorted(sess):
        s = sess[t]
        title = max(s["titles"], key=len)
        out.append({"id": f"x{t.replace(':', '')}", "day": "d1003", "start": t, "end": "", "title": title,
                    "tags": [], "kind": "session", "mark": "ours" if s["ours"] else "", "why": "",
                    "sp": s["sp"], "block": block_of(t)})
    return out


# 9/29 밤 추가 조사 — 판정 전 분야 연사 · 추정 소속 · DePIN 훑기. 사람마다 key · title_ko · org_line · person_line · lane · relevance(0~3) ·
# confidence · sources. confidence 가 high · medium 인 것만 소속 · 회사 · 인물 칸에 싣는다(low 는 싣지 않는다).
RESEARCH = HERE / "research-0929b.json"
RES = {r["key"]: r for r in json.loads(RESEARCH.read_text(encoding="utf-8"))} if RESEARCH.exists() else {}
RES_BAD_SRC = re.compile(r"linkedin|crunchbase|rocketreach|zoominfo|contactout|apollo\.io|theorg\.com|signalhire|//(?:www\.)?x\.com/|twitter\.com|facebook|instagram", re.I)  # x.com 은 도메인 자리만(podcastrex.com 은 통과)
def ref_title(x):
    """출처 제목(기사 제목)이 공개 판 규칙에 걸리면 제목 대신 사이트 이름만 — 링크는 그대로(예: 「리플과 파트너십」 · 「KOSDAQ-Listed」)."""
    t = str(x.get("t") or "")
    if not t or any(re.search(rx, t) for rx in PUBLIC_BAN) or re.search(r"(?i)kosdaq|상장", t):
        return re.sub(r"^https?://(?:www\.)?([^/]+).*$", r"\1", str(x["u"]))
    return t


PROF = {}
if PROFILES.exists():
    for _pr in json.loads(PROFILES.read_text(encoding="utf-8")):
        PROF[_pr["key"]] = {k: v for k, v in _pr.items() if k != "key"}


def marks(people):
    for k, p in people.items():
        m, why = "", ""
        if k in XS_FIT:
            m, why = "fit", XS_WHY.get(k, p.get("xwhy", ""))
        elif k in XS_STRAT:
            m, why = "strat", XS_WHY.get(k, p.get("xwhy", ""))
        elif k in XS_OURS:
            m, why = "ours", "우리 키노트 14:50"
        elif k in XS_RIPPLE:
            m, why = "ripple", XS_RIPPLE[k]
        elif k in XS_LINE:
            m, why = "line", XS_LINE[k]
        if k in PMARK:
            pm, pw = PMARK[k]
            m, why = pm, (pw if pw is not None else why)
        if k in PMARK_APPEND:
            why = f"{why}. {PMARK_APPEND[k]}" if why else PMARK_APPEND[k]
        p["mark"], p["why"] = m, why
        p.pop("xwhy", None)  # md 원문 근거(비공개 관계 · 계획 포함)는 페이지에 싣지 않는다 — 위에서 공개 가능한 why 로 바꿨다
        p["note"] = PNOTE.get(k, "")
        p["act"] = list(ACT.get(k, ()))  # [현장, 후속]
        p["quiet"] = k in NOT_TARGET  # 관련자에서 뺀 사람 — 표에서 맨 끝, 「두 행사」 표시도 없이
        p["net"] = False  # 비밀번호 없는 페이지 — 우리 수첩(1촌 · 판정 기록) 여부는 드러내지 않는다
        p["ev"] = sorted(p["ev"])
        if "co" in p:
            for rx in XS_CO_DROP:
                p["co"] = [re.sub(rx, "", x) for x in p["co"]]
        if "pe" in p:
            for rx in XS_PE_DROP:
                p["pe"] = [re.sub(rx, "", x) for x in p["pe"]]
            p["pe"] = [x for x in p["pe"] if x]
        if k in KO and not p.get("ko"):
            p["ko"] = KO[k]
        if k in KBW_DESC and "co" not in p:
            co, pe = KBW_DESC[k]
            p["co"], p["pe"] = [co], [pe]
        if k in RANK:
            p["rank"], p["tier"], p["rwhy"] = RANK[k]
        else:
            p["tier"] = ""
        if m:  # 시간대별 칸 한 줄(리플 · 우리는 없음)
            p["brief"] = BRIEF[k] if k in BRIEF else "" if m in ("ripple", "ours") else \
                (re.sub(r"\s*\(조사 관련도 \d\)", "", p.get("rwhy", "")).strip() or why)
        if k in PROF:
            p["prof"] = {**PROF[k], "fit": FIT.get(k, [])}
    both = [k for k, p in people.items() if len(p["ev"]) > 1 and k not in NOT_TARGET]
    return both


def kbw_data():
    """KBW2026 프로그램 서브페이지 데이터 — 세션 · 연사 이름 · 소속 · 회사 한 줄만(표시 · 근거 · 할 일 없음)."""
    kbw, people = parse_agenda()
    marks(people)
    for k, r in RES.items():  # 9/29 추가 조사 — 신뢰 high · medium 만 소속 · 회사 한 줄에
        if k not in people or r.get("confidence") not in ("high", "medium") or not r.get("title_ko") or "확인 못 함" in r["title_ko"]:
            continue
        pp = people[k]
        if not pp.get("xorg"):
            pp["org"], pp["src"] = r["title_ko"], "s"
        if not pp.get("co") and r.get("org_line") and "확인 못 함" not in r["org_line"]:
            pp["co"] = [r["org_line"]]
    kres = {r["key"]: r for r in json.loads(KBW_RES.read_text(encoding="utf-8"))} if KBW_RES.exists() else {}
    for k, r in kres.items():  # 소속이 빈 연사 조사 — high · medium 은 그대로, low 는 「추정」
        assert k in people, ("KBW 조사 이름 불일치", k)
        pp = people[k]
        if pp.get("xorg") or pp.get("org") or not r.get("org_ko") or r.get("confidence") not in ("high", "medium", "low"):
            continue
        pp["org"], pp["src"] = r["org_ko"], ("s" if r["confidence"] in ("high", "medium") else "k")
        if r.get("co_ko") and not pp.get("co"):
            pp["co"] = [r["co_ko"]]
    keys = sorted({x["p"] for s in kbw for x in s["sp"]})
    for name, group in (("핵심", KBW_IMP_A), ("주요", KBW_IMP_B), ("연관 더함", KBW_REL_EXTRA), ("한글 이름", set(KBW_KO))):
        miss = sorted(group - set(keys))
        assert not miss, (f"KBW {name} 이름 불일치", miss)
    assert not KBW_IMP_A & KBW_IMP_B, ("핵심 · 주요 겹침", KBW_IMP_A & KBW_IMP_B)
    ppl = {}
    for k in keys:
        pk = people[k]
        raw = pk.get("xorg") or pk.get("org", "")
        org = KBW_ORG_FIX.get(k) or kbw_org(raw)
        co = KBW_CO_FIX[k] if k in KBW_CO_FIX else kbw_co((pk.get("co") or [""])[0], org)
        est = (pk.get("src") == "k" and not pk.get("xorg")) or "인물 DB" in raw
        imp = "a" if k in KBW_IMP_A else "b" if k in KBW_IMP_B else ""
        rel = pk.get("mark") in ("fit", "strat", "ripple") or pk.get("tier") == "known" or k in NOT_TARGET or k in KBW_REL_EXTRA
        ppl[k] = {"name": pk["name"], "ko": pk.get("ko") or KBW_KO.get(k, ""), "org": org, "est": est, "co": co,
                  **({"imp": imp} if imp else {}), **({"rel": True} if rel else {})}
    for k in list(KBW_CO_FIX) + list(KBW_ORG_FIX):
        assert k in ppl, ("KBW 한 줄 고침 이름 불일치", k)
    themes = {t for t, _, _ in KBW_THEMES}
    used = set()

    def meta(title):
        hit = [pre for pre in KBW_SESS if title.startswith(pre)]
        assert len(hit) == 1, ("KBW 세션 주제 · 한 줄 없음(또는 둘 이상)", title, hit)
        used.add(hit[0])
        th, ko = KBW_SESS[hit[0]]
        assert th in themes, ("KBW 주제 이름 불일치", th)
        return th, ko, KBW_SESS_NOTE.get(hit[0], "")
    order = {"d0930": 0, "d1001": 1}
    sessions = []
    for s in sorted(kbw, key=lambda s: (order[s["day"]], s["start"], s["end"], s["id"])):
        row = {"id": s["id"], "day": s["day"], "start": s["start"], "end": s["end"], "title": s["title"], "kind": s["kind"],
               "sp": [{"p": x["p"], **({"mod": True} if x.get("mod") else {})} for x in s["sp"]]}
        if s["kind"] != "break":
            th, ko, note = meta(s["title"])
            row.update({"th": th, "ko": ko, **({"note": note} if note else {}), **({"rel": True} if s["mark"] in ("fit", "strat") else {})})
        sessions.append(row)
    assert used == set(KBW_SESS), ("KBW 세션 한 줄 — 아젠다에 없는 제목", set(KBW_SESS) - used)
    assert set(KBW_SESS_NOTE) <= set(KBW_SESS), ("KBW 세션 보도 구절 이름 불일치", set(KBW_SESS_NOTE) - set(KBW_SESS))
    n_s = sum(1 for s in sessions if s["kind"] != "break")
    by_title = {}
    for s in sessions:
        by_title.setdefault(s["day"], []).append(s)
    intro = {}
    for day, v in KBW_DAY_INTRO.items():
        hl = []
        for pre, why in v["hl"]:
            hit = [s["id"] for s in by_title[day] if s["title"].startswith(pre)]
            assert len(hit) == 1, ("KBW 하이라이트 세션 이름 불일치", day, pre)
            hl.append([hit[0], why])
        intro[day] = {"lead": v["lead"], "hl": hl}
    first = {}
    for s in sessions:
        for x in s["sp"]:
            first.setdefault(x["p"], s["id"])
    head = []
    for k, role in KBW_ABOUT["head"]:
        assert k in first, ("KBW 대표 연사 이름 불일치", k)
        head.append({"p": k, "role": role, "sid": first[k]})
    pos = {s["id"]: i for i, s in enumerate(sessions)}
    head.sort(key=lambda h: pos[h["sid"]])  # 페이지엔 시간순
    about = {"lead": KBW_ABOUT["lead"], "head": head, "src": KBW_ABOUT["src"],
             "facts": [(a, b.replace("__SIZE__", f"무대 3곳 · 세션 {n_s}개 · 연사 {len(keys)}명"), c) for a, b, c in KBW_ABOUT["facts"]]}
    hint = "핵심 · 주요 = 업계 중요도(공개 직함 · 회사 규모 · 주최 발표 기준) · 연관 = AI 에이전트 · 데이터 검증 · 결제 · 오라클 · " \
           "국내 정책 · 투자 흐름 · XRPL 과 맞닿은 세션 · 연사"
    return {"updated": "2026-09-29", "asof": "9/29", "days": KBW_DAYS, "firstDay": "d1001", "sessions": sessions, "people": ppl,
            "themes": [{"id": t, "name": n, "desc": d} for t, n, d in KBW_THEMES], "intro": intro, "about": about, "hint": hint,
            "foot": KBW_FOOT + [hint + "."]}


def kbw_gate(text, people):
    hits = [f"{rx!r} → …{text[max(0, m.start() - 30):m.end() + 30]}…" for rx in KBW_BAN for m in re.finditer(rx, text)]
    body = json.dumps([[p["org"], p["co"]] for p in people.values()], ensure_ascii=False)
    hits += [f"성별 표현 → {m.group(0)}" for m in re.finditer(PROF_GENDER + r"|그녀|그는 |그의 ", body)]
    if hits:
        sys.exit("KBW 페이지에 싣지 않는 말:\n  " + "\n  ".join(hits[:40]))


def data():
    kbw, people = parse_agenda()
    xs = parse_xrps(people)
    both = marks(people)
    for k in XS_FIT | XS_STRAT | set(XS_RIPPLE) | set(XS_LINE) | XS_OURS | set(RANK) | set(KBW_DESC) | set(KO) | set(LINE_ORDER) | set(XS_WHY) | set(ACT):
        assert k in people, ("이름 불일치", k)
    for k in list(PROF) + list(FIT):
        assert k in people, ("상세 이름 불일치", k)
    for k in BRIEF:
        assert k in people and people[k]["mark"], ("한 줄(BRIEF) 이름 불일치 · 표시 없음", k)
    unranked = [k for k, p in people.items() if p["mark"] and "rank" not in p]
    assert not unranked, ("표시됐는데 순위 없음", unranked)
    for k in NOT_TARGET:
        assert k in people and not people[k]["mark"] and not people[k]["tier"] and "prof" not in people[k] and k not in ACT, ("관련자에서 뺀 사람", k)
    for k, r in RES.items():
        assert k in people, ("조사 이름 불일치", k)
        pp = people[k]
        pp["refs"] = [{"t": ref_title(x), "u": x["u"]} for x in r.get("sources", [])
                      if isinstance(x, dict) and str(x.get("u", "")).startswith("http") and not RES_BAD_SRC.search(x["u"])][:4]
        pp["prel"] = int(r.get("relevance", 0))
        if not pp["mark"] and r.get("relevance_reason") and "확인 못 함" not in r["relevance_reason"][:6]:
            pp["pwhy"] = r["relevance_reason"]
        if r.get("confidence") not in ("high", "medium") or not r.get("title_ko") or "확인 못 함" in r["title_ko"]:
            continue
        if not pp.get("xorg"):
            pp["org"], pp["src"] = r["title_ko"], "s"
        if "co" not in pp:
            pp["co"] = [r["org_line"]] if r.get("org_line") and "확인 못 함" not in r["org_line"] else []
            pp["pe"] = [r["person_line"]] if r.get("person_line") and "확인 못 함" not in r["person_line"] else []
    pool = {}
    for k, r in RES.items():  # 조사로 찾은 DePIN 연사 — 세션 제목에 DePIN 이 없어도 분야 묶음으로
        pp = people[k]
        if r.get("lane") == "depin" and int(r.get("relevance", 0)) >= 2 and r.get("confidence") in ("high", "medium") \
                and not pp["mark"] and not pp["tier"] and k not in NOT_TARGET:
            pool[k] = "depin_s"
    for s_ in kbw + xs:
        for tier_, prefixes in POOL_SESS.items():
            if any(s_["title"].startswith(x) for x in prefixes):
                for x in s_["sp"]:
                    pp = people[x["p"]]
                    if not pp["mark"] and not pp["tier"] and x["p"] not in NOT_TARGET and pool.get(x["p"]) not in ("depin_s", "agent_s"):
                        pool[x["p"]] = tier_
    for k, t_ in pool.items():
        people[k]["tier"] = t_
        people[k]["rank"] = 200 + (3 - people[k].get("prel", 0)) * 10  # 분야 묶음 안에서 관련도 높은 사람이 위(번호는 쓰지 않는다)
    for prefixes in POOL_SESS.values():
        for x in prefixes:
            assert any(s_["title"].startswith(x) for s_ in kbw + xs), ("분야 세션 이름 불일치", x)
    NO_ACT = ("ripple", "known")  # 할 일 칸 없는 묶음
    extra_act = [k for k, p in people.items() if p["tier"] in NO_ACT and p["act"]]
    assert not extra_act, ("리플 · 기존 연결은 할 일 없음", extra_act)
    noact = [k for k, p in people.items() if p["mark"] and p["tier"] not in NO_ACT
             and not (len(p["act"]) == (1 if p["tier"] in ONLY_MEET else 2) and all(p["act"]))]
    assert not noact, ("표시됐는데 할 일(현장 · 후속, 국내는 현장만)이 어긋남", noact)
    assert set(KR_FIELD) == {k for k, p in people.items() if p["tier"] == "kr"}, "국내 묶음 분야 표 불일치"
    for k, f in KR_FIELD.items():
        assert f in NEW_TIERS and f != "kr"
        people[k]["field"] = f
    odd = [k for k, p in people.items() if (p["mark"] == "ripple") != (p["tier"] == "ripple")]
    assert not odd, ("리플 표시와 리플 묶음이 어긋남", odd)
    blocks = []
    for ln in MD.read_text(encoding="utf-8").splitlines():
        m = re.match(r"## (\d\d:\d\d)–(\d\d:\d\d) · (.+)", ln)
        if m:
            blocks.append({"id": block_of(m.group(1)), "start": m.group(1), "end": m.group(2),
                           "title": m.group(3).replace("!!", "")})
    sessions = kbw + xs
    days = DAYS
    if set(SHOW_EVENTS) != {"KBW", "XRP SEOUL"}:
        sessions = [s_ for s_ in sessions if DAY_EVENT[s_["day"]] in SHOW_EVENTS]
        days = [d_ for d_ in DAYS if DAY_EVENT[d_["id"]] in SHOW_EVENTS]
        people = {k: p for k, p in people.items() if set(p["ev"]) & set(SHOW_EVENTS)}
        for p in people.values():
            p["ev"] = [e for e in p["ev"] if e in SHOW_EVENTS]
            if "KBW" not in SHOW_EVENTS:  # 숨긴 KBW 세션을 가리키는 구절도 뺀다(모니카 롱 근거 · 요한 케르브라 현장 칸 등)
                if p.get("why"):
                    p["why"] = re.sub(r"\s*·\s*KBW \d+/\d+ \d+:\d+ [^·]*$", "", p["why"])
                if p.get("act"):
                    p["act"] = [re.sub(r"^KBW \d+/\d+ \d+:\d+ · ", "", a) for a in p["act"]]
        both = [k for k in both if k in people and len(people[k]["ev"]) > 1]
        blocks = [b_ for b_ in blocks] if "XRP SEOUL" in SHOW_EVENTS else []
    # 번호 — 보이는 새 관계만 1부터 다시(분야 순서 → 원래 순위)
    vis = sorted((k for k, p in people.items() if p.get("tier") in NEW_TIERS), key=lambda k: (NEW_TIERS.index(people[k]["tier"]), people[k]["rank"]))
    for i, k in enumerate(vis, 1):
        people[k]["rank"] = i
    cnt = {t: sum(1 for p in people.values() if p.get("tier") == t) for t in ("depin", "agent", "pay", "ref", "kr", "ripple", "known", "line", "depin_s", "agent_s", "pay_s")}
    lanes = " → ".join(f"{lb} {cnt[t]}" for t, lb in (("depin", "DePIN"), ("agent", "AI 에이전트"), ("pay", "결제")) if cnt[t])
    kr_note = f", 그다음 국내 {cnt['kr']}(한국 회사 · 기관 — 분야가 겹쳐도 번호는 뒤)" if cnt["kr"] else ""
    rank_note = (f"중요도 = 제안 순위 — 우리에게 제일 중요한 세 분야 순서로 먼저: {lanes}, 그 밖 새 관계 {cnt['ref']}{kr_note}(번호 1~{len(vis)}). "
                 f"리플 {cnt['ripple']}은 따로 묶고, 기존 연결 {cnt['known']} · 우리 · 선 {cnt['line']}은 뒤. "
                 "그다음 분야 세션의 다른 연사(9/29 조사, 표시 전)를 분야별로 관련도 높은 순으로 묶었다.")
    notes = (NOTES_KBW if "KBW" in SHOW_EVENTS else []) + [rank_note if n == "__RANK_NOTE__" else n for n in NOTES]
    foot = [f.replace("__SRC__", "KBW2026 공식 아젠다(9/29 붙여 넣은 전문) · " if "KBW" in SHOW_EVENTS else "") for f in FOOT]
    return {
        "updated": "2026-09-29",
        "events": list(SHOW_EVENTS),
        "days": days,
        "blocks": blocks,
        "sessions": sessions,
        "people": people,
        "both": sorted(both),
        "notes": notes,
        "foot": foot,
    }


# 비밀번호 없는 판의 마지막 관문 — 대외 금지 구절이 데이터 · 템플릿에 하나라도 있으면 쓰지 않고 멈춘다.
# (제3자의 공개 경력 · 사명은 막지 않는다: 「재보험 출신」은 되고 「보험 레인」은 안 된다.)
PUBLIC_BAN = [
    r"보험 레인", r"보험 ?/ ?지수", r"파라메트릭", r"(?i)parametric", r"보험 지급",
    r"업비트 트랙", r"11월 트랙", r"상장 트랙", r"리플 채널", r"별도 채널", r"\bNDA\b", r"크립토닷컴", r"(?i)(?<![a-z0-9])crypto\.com", r"(?i)(?<![a-z0-9])og\.com",
    r"1촌", r"수첩", r"멀티체인", r"판매 목표", r"5,000대", r"초기 바운티", r"(?i)connectx402", r"3만\+?\s*(?:개\s*)?(?:IoT|센서)",
    r"상장사(?:가|의)? ?(?:뒷받침|B2B)", r"코스닥", r"케이웨더 토큰", r"자회사", r"국내 ?(?:최대|1위)", r"(?i)WLBN\s*(?:코인|coin)",
    r"리플(?:과|와)? ?(?:협력|제휴|파트너)", r"(?i)ripple\s+(?:partnership|partner of)", r"(?:디센트|D'CENT)", r"타임레버리지(?:와|와의)? ?(?:파트너|제휴)",
    r"서우", r"주노", r"9/23", r"그녀", r"그는 ", r"그의 ",
    # 날씨 데이터 × x402 · 날씨 데이터의 XRPL 기록은 미공개 계획 · 미확정 — x402 는 측정 데이터(정본 단가)만
    # 예측시장 × 우리(날씨 · 케이웨더 · 웰비안) 연결은 대외 0 — 한국 쪽 규제 논쟁에 이름이 엮이지 않게
    r"(?:날씨|케이웨더|웰비안|wellbian)[^\n\"]{0,40}예측시장", r"예측시장[^\n\"]{0,40}(?:날씨|케이웨더|웰비안|wellbian)",
    r"(?:날씨|기온|강수)[^\n\"]{0,30}(?:정산 기준|판정)", r"(?:정산 기준|판정)[^\n\"]{0,30}(?:날씨|기온|강수)", r"날씨[^\n\"]{0,12}파생", r"청구 판정",
    # 9/29 「대화는 1차 판매 실적 뒤 · 사례 비교로 연다 — 제거」 · 「우리 레인이 무슨 말인지 모르겠다」
    r"실적 뒤", r"사례 비교로 연다", r"한 사람만 연다", r"때가 되면", r"(?<![가-힣])레인(?![가-힣]*보우)", r"기계 고객",
    r"날씨[^\n\"]{0,24}x402", r"x402[^\n\"]{0,24}날씨", r"XRPL[^\n\"]{0,12}(?:기록|남)[^\n\"]{0,6}날씨", r"날씨 데이터[^\n\"]{0,14}XRPL(?:에|에서|로)? ?(?:기록|남|앵커)",
]
PROF_GENDER = r"(?i)\b(?:she|her|hers|he|his|him)\b(?![-'])"


def public_gate(text):
    hits = []
    for rx in PUBLIC_BAN:
        for m in re.finditer(rx, text):
            hits.append(f"{rx!r} → …{text[max(0, m.start() - 40):m.end() + 40]}…")
    if hits:
        sys.exit("공개 판에 금지 구절:\n  " + "\n  ".join(hits[:40]))


def prof_gate(people):
    """인물 상세 본문(출처 제목 제외)에 성별 대명사가 있으면 멈춘다."""
    hits = []
    for k, p in people.items():
        pr = p.get("prof")
        if not pr:
            continue
        body = json.dumps({x: v for x, v in pr.items() if x != "sources"}, ensure_ascii=False)
        hits += [f"{k}: {m.group(0)}" for m in re.finditer(PROF_GENDER, body)]
    for k in RES:  # 추가 조사 칸(소속 · 회사 · 인물)도 같은 규칙 — 공개 판에 실린 사람만
        if k not in people:
            continue
        p = people[k]
        body = json.dumps([p.get("org", ""), p.get("co", []), p.get("pe", [])], ensure_ascii=False)
        hits += [f"{k}: {m.group(0)}" for m in re.finditer(PROF_GENDER + r"|그녀|그는 |그의 ", body)]
    if hits:
        sys.exit("인물 상세에 성별 표현: " + ", ".join(hits))


HANJA = str.maketrans({"前": "전", "美": "미", "韓": "한", "人": "인", "中": "중", "日": "일", "北": "북", "英": "영", "新": "신", "大": "대",
                       "銀": "은", "株": "주", "與": "여", "野": "야", "對": "대", "靑": "청", "協": "협"})  # 기사 제목 약자(우리銀 등)


def main():
    d = data()
    payload = json.dumps(d, ensure_ascii=False, separators=(",", ":")).translate(HANJA)
    assert not re.search(r"[\u3400-\u4dbf\u4e00-\u9fff]", payload), ("한자 남음", re.findall(r".{12}[\u4e00-\u9fff].{12}", payload)[:5])
    n_s = sum(1 for s in d["sessions"] if s["kind"] != "break")
    n_p = len(d["people"])
    marked = {m: sum(1 for p in d["people"].values() if p["mark"] == m) for m in ("fit", "strat", "ripple", "line", "ours")}
    tiers = {t: sum(1 for p in d["people"].values() if p.get("tier") == t) for t in ("depin", "agent", "pay", "ref", "kr", "ripple", "known", "ours", "line", "depin_s", "agent_s", "pay_s")}
    print(f"events {d['events']} · sessions {n_s} · people {n_p} · marks {marked} · tiers {tiers} · both {d['both']}")
    args = sys.argv[1:]
    tpl = (HERE / "page.html").read_text(encoding="utf-8")
    if tuple(SHOW_EVENTS) == ("XRP SEOUL",):
        for old, new, n in (("<title>KBW · XRP SEOUL 연사 지도</title>", "<title>XRP SEOUL 2026 연사 지도</title>", 1),
                            ("<h1>KBW · XRP SEOUL 연사 지도</h1>", "<h1>XRP SEOUL 2026 연사 지도</h1>", 2),
                            ("9/30 · 10/1 KBW2026 → 10/3 XRP SEOUL 2026. 누구를", "10/3 XRP SEOUL 2026 · 그랜드 하얏트 서울. 누구를", 1)):
            assert tpl.count(old) == n, ("머리글 치환 불일치", old)
            tpl = tpl.replace(old, new)
    if args[:1] == ["--plain"] or not os.environ.get("EVENT_PASS"):
        public_gate(payload + tpl)
        prof_gate(d["people"])
    if args[:1] == ["--plain"]:
        out = Path(args[1])
        out.write_text(tpl.replace("/*__PLAIN__*/null", payload).replace("/*__SEALED__*/null", "null"), encoding="utf-8")
        print("wrote plain", out)
        return
    pw = os.environ.get("EVENT_PASS", "")
    out = SITE / "www" / "index.html"
    if not pw:
        out.write_text(tpl.replace("/*__PLAIN__*/null", payload).replace("/*__SEALED__*/null", "null"), encoding="utf-8")
        print("wrote plain", out, len(out.read_bytes()), "bytes")
        write_kbw()
        return
    if len(pw) < 10:
        sys.exit("EVENT_PASS 는 10자 이상 — 저장소 · 로그에 남기지 않는다")
    sealed = subprocess.run(["node", str(HERE / "seal.mjs")], input=payload.encode(), capture_output=True,
                            env={**os.environ, "EVENT_PASS": pw}, check=True).stdout.decode()
    out.write_text(tpl.replace("/*__PLAIN__*/null", "null").replace("/*__SEALED__*/null", sealed), encoding="utf-8")
    print("wrote sealed", out, len(out.read_bytes()), "bytes")


def write_kbw():
    """www/kbw.html — KBW2026 프로그램(행사 소개 · 세션 · 연사 소속만). 공개 관문 + KBW 관문을 통과해야 쓴다."""
    k = kbw_data()
    payload = json.dumps(k, ensure_ascii=False, separators=(",", ":")).translate(HANJA)
    assert not re.search(r"[\u3400-\u4dbf\u4e00-\u9fff]", payload), ("KBW 한자 남음", re.findall(r".{12}[\u4e00-\u9fff].{12}", payload)[:5])
    tpl = KBW_TPL.read_text(encoding="utf-8")
    public_gate(payload + tpl)
    kbw_gate(payload + tpl, k["people"])
    out = SITE / "www" / "kbw.html"
    out.write_text(tpl.replace("/*__KBW__*/null", payload), encoding="utf-8")
    n_org = sum(1 for p in k["people"].values() if p["org"])
    print(f"wrote kbw {out} {len(out.read_bytes())} bytes · sessions {sum(1 for s in k['sessions'] if s['kind'] != 'break')} · "
          f"speakers {len(k['people'])} · with org {n_org} (추정 {sum(1 for p in k['people'].values() if p['est'])}) · blank {len(k['people']) - n_org}")


if __name__ == "__main__":
    main()
