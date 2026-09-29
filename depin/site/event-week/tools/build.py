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
판정 = 결(우리 레인) · 전략(관계 · 자본 · 정책) · 선(규칙상 조심) · 우리. 근거는 intel/business-directions.md
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
# fit = 결(우리 레인) · strat = 전략(관계 · 자본 · 정책 · 미디어) · line = 선(규칙상 조심) · ours = 우리
PMARK = {
    # KBW
    "Charles Jansen": ("fit", "지수 · 평가 기관(S&P Global) — 합의 지수 방법론이 그대로 얹힌다. 사업 제안보다 사례 비교로 연다"),
    "Ambre Soubiran": ("fit", "시장 데이터 회사(Kaiko)가 기관 인프라가 되는 길 — 데이터 회사인 우리가 가는 같은 길"),
    "Andrea Muttoni": ("fit", "AI 학습 데이터의 출처 · 라이선스(The DATA Foundation, 구 Story) — 측정 데이터가 쓰이는 판"),
    "Jongwook Oh": ("fit", "국내 x402 패널(웨이브릿지 대표) — 한국 기관 쪽 x402 대화 상대"),
    "Michael Heinrich": ("strat", "탈중앙 데이터 · AI 인프라(0G Labs) — 데이터 쪽 대화 후보"),
    "Caroline D. Pham": ("strat", "해외 구매자 RLUSD 온램프(MoonPay) — 해외 결제를 설계할 때 대화 상대"),
    "Guy Wuollet": ("strat", "DePIN 투자 관점(a16z crypto) — 실적을 들고 만날 상대"),
    "Tom Schmidt": ("strat", "DePIN 투자(Dragonfly) — 한 하우스에는 한 사람만 연다"),
    "Lasse Clausen": ("strat", "DePIN 을 다뤄 온 VC(1kx) — 대화는 1차 판매 실적 뒤"),
    "Akshat Vaidya": ("strat", "Arthur Hayes 패밀리 오피스(Maelstrom) — 「AI 에이전트가 가장 과소평가된 기회」. 대화는 실적 뒤"),
    "SungGuan Yun": ("strat", "한국은행 디지털화폐 — 예금토큰 · 원화 결제 방향"),
    "Michael Ippolito": ("strat", "크립토 데이터 · 리서치 · 팟캐스트(Blockworks) — 10/3 시연 뒤 리서치 · 팟캐스트 후보"),
    "Frank Chaparro": ("strat", "미디어 · 콘텐츠(GSR) — 모더레이터 3세션"),
    "Kyoungsuk Oh": ("line", "거래소 · 메인 스폰서(업비트) — 인사만, 우리가 먼저 열지 않는다"),
    "SeonJoo Yoon": ("line", "거래소 · 메인 스폰서(업비트) — 인사만, 우리가 먼저 열지 않는다"),
    "Arjun Sethi": ("line", "거래소(Kraken) — 인사만, 사업 메시지는 먼저 열지 않는다"),
    "John D'Agostino": ("line", "거래소(Coinbase) — 인사만"),
    "Mike Belshe": ("line", "명함까지 — 커스터디 비교 대화는 열지 않는다"),
    # 두 행사 공통 · XRP SEOUL
    "Monica Long": ("line", "리플 — 공개 직함까지"),
    "Johann Kerbrat": ("line", "거래 · 브로커리지 — 인사만"),
    "Marcin Kazmierczak": ("fit", None),  # 근거는 md 결 칸 + 아래 덧붙임
}
PMARK_APPEND = {
    "Marcin Kazmierczak": "오라클 쪽 첫 대화 후보",
}
# 색 없이 붙이는 메모
PNOTE = {
    "Yat Siu": "X 답글로만 — 링크드인 · 대면은 따로 열지 않는다",
    "Balaji Srinivasan": "테제 글이 우리 레인에 닿을 때 1회. 상품 얘기 0",
    "Yuval Rooz": "JPM 토큰화 예금이 Canton — 우리 정산은 XRPL, 섞지 않는다",
    "Chetan Karkhanis": "프랭클린템플턴 = t54 시드 공동 주도사(2026.2)",
    "Asheesh Birla": "에버노스 SPAC 합병 표결 9/30 — 행사 전에 결과 확인",
}

# XRP SEOUL — md 「우리와 결」 10명을 결 · 전략으로 나눈다 + 선
XS_FIT = {"Hugo Philion", "Connor Sullivan", "Chandler Fang", "Nathaniel T. Bradley", "Johnny Youn", "Marcin Kazmierczak"}
XS_STRAT = {"Crypto Eri", "Jake Ku", "Changhoon Moon", "Lacey Wisdom", "Asheesh Birla"}  # 아시시 = 이전 XRP 컨퍼런스 인연(9/29 서우)
XS_OURS = {"Sunghwan Kim"}
XS_LINE = {
    "Christina Chan": "리플 — 공개 직함까지",
    "Jinnie Lee": "리플 — 공개 직함까지",
    "Ayo Akinyele": "리플 — 공개 직함까지",
    "Tatsuya Kohrogi": "리플 — 공개 직함까지",
    "Pablo Che Leo": "리플 — 공개 직함까지",
    "Sabrina Tachdjian": "XRP 아시아(리플이 만든 조직) — 리플과 같은 선",
    "Leonard Hoh": "거래소 — 인사만",
    "Adam Oozeer": "크로스체인 인프라 — 인사만",
    "Fig": "크로스체인 인프라 — 인사만",
    "Aniket Jindal": "크로스체인 인프라 — 인사만",
}

# 비밀번호 없는 페이지용 — md 결 근거 중 비공개 관계 · 계획이 든 칸은 공개 가능한 표현으로
XS_WHY = {
    "Crypto Eri": "기존 연결 — 일본 XRP 커뮤니티 · 12:05 패널 좌장 · X 확산",
    "Jake Ku": "기존 연결 — XRPL Korea(국내 커뮤니티 · 빌더 관문)",
    "Changhoon Moon": "9/5 Flare 워크숍 같은 무대 — 국내 XRP 리테일 창구",
    "Connor Sullivan": "Flare 생태계 XRP 보장 층 — 리스크를 값으로 매기려면 데이터를 믿을 수 있어야 한다",
    "Johnny Youn": "XRPL 구조화상품(KFIP 2026 1위) — 검증된 데이터가 기준값이 되는 상품 설계",
    "Asheesh Birla": "기존 연결 — 이전 XRP 컨퍼런스 인연. 에버노스(XRP 트레저리)",
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
# 중요도 — 제안 순위. 새로 열 관계가 먼저(최우선 5 · 우선 7 · 참고 7), 기존 연결은 후순위, 우리는 그 뒤, 선은 맨 끝
# (9/29 서우 「기존 연결은 후순위로 빼 — 아시시 비를라도 기존 연결자, 어차피 논의 대상인 우리도 뒤로」)
TIERS = [
    ("top", [("Chandler Fang", "x402 결제 층 핵심 · 이번 주 서울"),
             ("Marcin Kazmierczak", "오라클 첫 대화 후보 · 두 행사"),
             ("Lacey Wisdom", "DePIN 투자사 · t54 투자사"),
             ("Charles Jansen", "지수 · 평가 기관 · KBW 10/1"),
             ("Nathaniel T. Bradley", "데이터 자산화 · 센서 데이터 제휴")]),
    ("high", [("Johnny Youn", "XRPL 구조화상품 · KFIP 1위"),
              ("Connor Sullivan", "Flare 생태계 보장 층"),
              ("Caroline D. Pham", "해외 구매 온램프"),
              ("Guy Wuollet", "DePIN 투자(a16z crypto)"),
              ("Michael Heinrich", "데이터 · AI 인프라"),
              ("Ambre Soubiran", "시장 데이터 회사"),
              ("Jongwook Oh", "국내 x402 패널")]),
    ("ref", [("Tom Schmidt", "DePIN 투자(Dragonfly)"),
             ("Lasse Clausen", "DePIN VC"),
             ("Akshat Vaidya", "패밀리 오피스 · AI 에이전트"),
             ("Andrea Muttoni", "데이터 권리"),
             ("SungGuan Yun", "한국은행 디지털화폐"),
             ("Michael Ippolito", "데이터 · 리서치 미디어"),
             ("Frank Chaparro", "미디어")]),
    ("known", [("Hugo Philion", "기존 파트너 · 10/3 13:30 키노트"),
               ("Crypto Eri", "기존 연결 · 12:05 좌장"),
               ("Asheesh Birla", "기존 연결 · 이전 XRP 컨퍼런스"),
               ("Jake Ku", "기존 연결 · XRPL Korea"),
               ("Changhoon Moon", "기존 연결 · 9/5 워크숍")]),
    ("ours", [("Sunghwan Kim", "우리 키노트 14:50")]),
]
LINE_ORDER = ["Monica Long", "Kyoungsuk Oh", "SeonJoo Yoon", "Johann Kerbrat", "Leonard Hoh", "Arjun Sethi", "John D'Agostino",
              "Mike Belshe", "Christina Chan", "Jinnie Lee", "Sabrina Tachdjian", "Ayo Akinyele", "Tatsuya Kohrogi",
              "Pablo Che Leo", "Adam Oozeer", "Fig", "Aniket Jindal"]
BASE = {"top": 1, "high": 6, "ref": 13, "known": 50, "ours": 80}
RANK = {}
for t, people_ in TIERS:
    for i, (k, why) in enumerate(people_):
        RANK[k] = (BASE[t] + i, t, why)
for i, k in enumerate(LINE_ORDER):
    RANK[k] = (90 + i, "line", "")
assert [BASE["high"] - BASE["top"], BASE["ref"] - BASE["high"]] == [len(TIERS[0][1]), len(TIERS[1][1])]


# ── 인물 상세(이름을 누르면 여는 패널) ─────────────────────────────────────────────────
# 조사 = tools/profiles.json(공개 자료 검색 요약 — 9/29 여섯 갈래 조사 + 레이시는 서우 보고서 검증).
# 「우리와의 결」 = 아래 FIT(공개 가능한 사실만 — 페이지에 비밀번호가 없다).
PROFILES = HERE / "profiles.json"
FIT = {
    "Chandler Fang": ["AI 에이전트가 x402 로 데이터를 건당 산다 — 우리 측정 데이터는 x402 단가가 공개돼 있다(집계 · 코호트 · 리포트)",
                      "t54 의 에이전트 신원(KYA) · 결제 전 위험 검사는 「산 데이터가 진짜 측정값인가」와 짝이다 — 기기 NFT · 원장 기록",
                      "XRPL 위 RLUSD 정산 — 같은 원장에서 돈과 데이터가 오간다"],
    "Marcin Kazmierczak": ["오라클 = 값을 체인에 넣는 층 — 측정 · 날씨 데이터도 체인 위 값이 될 수 있다(기술 통합이 아니라 대화)",
                           "Credora 인수(데이터 → 등급) — 측정 데이터에 품질 점수를 매기는 방향과 같다",
                           "KBW 9/30 12:00 · XRP SEOUL 10/3 16:55 — 두 번 볼 수 있다"],
    "Lacey Wisdom": ["날씨 DePIN(WeatherXM)을 이미 포트폴리오로 안다 — 차별점부터: 실내 공기질 · 케이웨더 30년 관측 · 기업 고객 4,000곳+",
                     "t54(XRPL x402) 시드 공동 주도 — 우리 x402 데이터 판매와 바로 이어지는 화제",
                     "기기 1대 = NFT 1개(위조 방지) — 기고에서 짚은 허위 위치 · 부정 방지 논점과 맞닿는다"],
    "Charles Jansen": ["여러 출처를 합의해 기준값을 내는 방식(우리 날씨 11개 출처 합의)은 지수 방법론과 같은 문법이다",
                       "데이터 회사가 온체인으로 가는 사례 — 「30년 데이터 회사의 DePIN」이 통하는 청중"],
    "Nathaniel T. Bradley": ["데이터를 자산으로 가치평가 · 토큰화 — 측정 데이터의 값을 매기는 같은 테제",
                             "AgSensor 제휴(농업 센서 데이터) — 센서 데이터 선례, 실내 공기질은 옆 칸",
                             "XRPL 무대 단골(XRP Tokyo 2026 · XRP Seoul 2025)"],
    "Johnny Youn": ["XRPL 위 구조화상품 — 검증된 측정 · 날씨 데이터가 상품의 기준값이 되는 구조를 이야기할 상대",
                    "국내 XRPL 빌더(KFIP 2026 1위) — 한국 XRPL 판에서 계속 이어질 사람"],
    "Connor Sullivan": ["Flare 생태계의 XRP 보장 층 — 케이웨더 × Flare 공개 파트너십과 같은 판",
                        "리스크를 값으로 매기는 쪽은 데이터를 믿을 수 있어야 한다 — 검증된 측정 데이터 이야기"],
    "Caroline D. Pham": ["해외 구매자가 RLUSD 로 들어오는 온램프 — 해외 판매 결제 경로",
                         "전 CFTC 위원장 대행 — 토큰화 담보 · 파생 규제 감각"],
    "Guy Wuollet": ["DePIN · 인프라 투자 관점 — 가동 기기 · 데이터 판매 실적을 들고 만날 상대"],
    "Michael Heinrich": ["AI 가 쓰는 데이터의 출처 · 무결성 — 우리 측정 데이터 검증과 같은 질문"],
    "Ambre Soubiran": ["시장 데이터 회사가 규제 벤치마크 · 기관 인프라가 된 길 — 날씨 데이터 회사가 가는 방향의 선례"],
    "Jongwook Oh": ["국내 x402 패널 — 한국 기관 쪽이 에이전트 결제를 어떻게 보는지 들을 자리"],
    "Tom Schmidt": ["DePIN 투자사 — 같은 회사는 한 사람만 연다"],
    "Lasse Clausen": ["DePIN 을 다뤄 온 VC — 실적 뒤 대화"],
    "Akshat Vaidya": ["「AI 에이전트가 가장 과소평가된 기회」(2025.8) — 에이전트가 데이터를 사는 x402 레인과 같은 방향",
                      "초기 투자자 패널(10/1) — 대화는 판매 실적 뒤"],
    "Andrea Muttoni": ["측정 데이터가 AI 학습 데이터로 쓰일 때의 출처 · 라이선스 — The DATA Foundation 의 Trace 가 다루는 문제"],
    "SungGuan Yun": ["예금토큰 · 원화 결제 방향 — 국내 결제 · 정산 환경 파악(듣기만)"],
    "Michael Ippolito": ["데이터 · 리서치 · 팟캐스트(뉴스 부문은 2025.10 폐쇄) — 10/3 시연 뒤 리서치 · 팟캐스트 소개 후보"],
    "Frank Chaparro": ["미디어 — 모더레이터 3세션, 인터뷰 · 콘텐츠 창구"],
    "Hugo Philion": ["케이웨더 × Flare 파트너십(2026.9.5 공개 무대) — 데이터 검증 층",
                     "10/3 13:30 키노트 → 우리 14:50 키노트 — 같은 날 두 무대"],
    "Crypto Eri": ["일본 XRP 커뮤니티 · 영상 채널 — 12:05 패널 좌장", "X · 짧은 영상 확산 창구"],
    "Asheesh Birla": ["이전 XRP 컨퍼런스 인연 — 인사 · 근황", "XRP 를 굴리는 트레저리 — RLUSD 를 XRP 디파이 진입로로 쓰는 전략(공개)"],
    "Jake Ku": ["국내 XRPL 커뮤니티 · 빌더 관문 — KFIP · 해커톤 운영"],
    "Changhoon Moon": ["국내 XRP 리테일 청중(장기 보유자 층)", "2026.9.5 Flare 워크숍 같은 무대"],
}


# ── 판정 — KBW 세션(제목 앞부분으로 찾는다) ─────────────────────────────────────────────
SMARK = {
    "x402, AI Payments": ("fit", "x402 = 우리 기계 고객 레인(정본 x402 단가). 카카오페이는 x402 재단 창립 멤버(4월 발족 때 국내 유일, 지금 국내 회원사 4곳) — 한국 x402 흐름을 한자리에서"),
    "The Trillion-Dollar Agentic Economy": ("fit", "AI 에이전트 신뢰 층 — t54 와 같은 문제(에이전트가 데이터를 살 때 무엇을 믿나)"),
    "The Data Race Behind the AI Boom": ("fit", "AI 의 원자재는 데이터 — 측정 데이터 공급자 자리에서 들을 세션"),
    "Putting Real-World Value to Work": ("fit", "실물 가치 × 에이전트 — 「1막 금융 → 2막 실물」 서사와 같은 말(Pharos · RWA L1)"),
    "Agentic Payments: Making the New Internet": ("fit", "에이전트 결제 = 기계 고객 레인"),
    "From Market Data to Ratings": ("fit", "데이터 → 등급 → 기관 인프라. S&P Global · Kaiko · 프랭클린템플턴(t54 시드 공동 주도사)"),
    "Your Next Customer Is an AI Agent": ("fit", "기계 고객 테제 그대로 — 우리 원글 5c 「에이전트는 입력을 산다」"),
    "The Ceiling on the Agent Economy": ("fit", "에이전트 경제의 천장 — 반대 논리도 우리 레인"),
    "Verifiable Computing in the Age of AI": ("fit", "검증 가능한 연산 — 측정 → 검증 층과 같은 문제"),
    "Programmable Machine Needs Programmable Money": ("fit", "기계가 돈을 쓴다 — 기계 고객 레인"),
    "When AI Agents Meet Onchain Money": ("fit", "에이전트 × 온체인 결제 — GenLayer · XION"),
    "Sovereignty by Design": ("fit", "데이터 소유 · 주권 — 가정 측정 데이터의 주인은 누구인가"),
    "Trust Oracles in Onchain Economies": ("fit", "가격 오라클 다음은 신뢰 오라클 — 측정 데이터의 신뢰가 우리 상품"),
    "How Capital Is Mapping Crypto's Next Cycle": ("strat", "DePIN · 인프라 자본 지도 — Dragonfly · 1kx · Spartan. 대화는 판매 실적 뒤"),
    "Friends and Family": ("strat", "초기 투자자들이 지금 거는 곳 — Maelstrom(Arthur Hayes 패밀리 오피스) 등"),
    "Korea's Digital Asset Policy Moment": ("strat", "국내 규제 — 보상 · 포인트 · DEX 게이트 판단의 전제. 듣기만"),
    "A New Era for Digital Assets in Korea": ("strat", "국내 규제 — 보상 · 포인트 · DEX 게이트 판단의 전제. 듣기만"),
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

NOTES = [
    "9/29 은 업비트 공동 비공개 기관 포럼(초청제) — 이 지도에 없다. 본 컨퍼런스는 9/30 · 10/1.",
    "지난 사이드: 9/28 「Agentic Payments Onchain」(리플 · t54 · Tenity · Bloom, KBW 공식 사이드) — t54 가 KBW 주간에 서울에 있다. 10/3 챈들러 팡 동선에 참고.",
    "두 행사에 다 나오는 사람은 KBW 에서 먼저 볼 수 있다 — 마르친(RedStone) 9/30 12:00 → 10/3 16:55.",
    "소속 칸: 「추정」 = 알려진 정보라 재확인 전. 빈 칸은 붙여 넣은 아젠다에 소속이 없어서다 — KBW 연사 페이지에서 확인.",
    "중요도 = 제안 순위 — 새로 열 관계(최우선 5 · 우선 7 · 참고 7)가 먼저, 기존 연결 5는 후순위, 우리는 그 뒤, 선은 맨 끝. 새 관계 안에서는 레인 중심 · 10/3 동선 · 옆 사람으로 이어지는 정도로 매겼다.",
    "판정은 제안이다 — 「내 표시」로 바꾸면 이 기기에만 저장되고, 「내보내기」로 복사해 보내 주면 원본에 반영한다.",
    "결 = 우리 레인(검증 데이터 · x402 기계 고객 · DePIN · 데이터 → 등급) · 전략 = 관계 · 자본 · 정책 · 미디어 · "
    "선 = 말할 때 조심(공개 직함까지 · 인사만) · 우리 = 김성환 대표 키노트.",
]
FOOT = [
    "출처 — KBW2026 공식 아젠다(9/29 붙여 넣은 전문) · XRP SEOUL 2026 주최 프로그램 이미지 + 9/29 공개 자료 검색 요약"
    "(reports/XRP SEOUL 2026 연사 프로필.md) · 판정 = 우리 내부 기록.",
    "설명은 검색 요약 기준이다 — 대외 인용 전 원출처를 연다. 이 페이지와 링크는 밖으로 돌리지 않는다.",
]


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
        if k in PROF:
            p["prof"] = {**PROF[k], "fit": FIT.get(k, [])}
    both = [k for k, p in people.items() if len(p["ev"]) > 1]
    return both


def data():
    kbw, people = parse_agenda()
    xs = parse_xrps(people)
    both = marks(people)
    for k in XS_FIT | XS_STRAT | set(XS_LINE) | XS_OURS | set(RANK) | set(KBW_DESC) | set(KO) | set(LINE_ORDER) | set(XS_WHY):
        assert k in people, ("이름 불일치", k)
    for k in list(PROF) + list(FIT):
        assert k in people, ("상세 이름 불일치", k)
    unranked = [k for k, p in people.items() if p["mark"] and "rank" not in p]
    assert not unranked, ("표시됐는데 순위 없음", unranked)
    blocks = []
    for ln in MD.read_text(encoding="utf-8").splitlines():
        m = re.match(r"## (\d\d:\d\d)–(\d\d:\d\d) · (.+)", ln)
        if m:
            blocks.append({"id": block_of(m.group(1)), "start": m.group(1), "end": m.group(2),
                           "title": m.group(3).replace("!!", "")})
    return {
        "updated": "2026-09-29",
        "days": DAYS,
        "blocks": blocks,
        "sessions": kbw + xs,
        "people": people,
        "both": sorted(both),
        "notes": NOTES,
        "foot": FOOT,
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
    if hits:
        sys.exit("인물 상세에 성별 표현: " + ", ".join(hits))


HANJA = str.maketrans({"前": "전", "美": "미", "韓": "한", "人": "인", "中": "중", "日": "일", "北": "북", "英": "영", "新": "신", "大": "대"})


def main():
    d = data()
    payload = json.dumps(d, ensure_ascii=False, separators=(",", ":")).translate(HANJA)
    assert not re.search(r"[\u3400-\u4dbf\u4e00-\u9fff]", payload), ("한자 남음", re.findall(r".{12}[\u4e00-\u9fff].{12}", payload)[:5])
    n_s = sum(1 for s in d["sessions"] if s["kind"] != "break")
    n_p = len(d["people"])
    marked = {m: sum(1 for p in d["people"].values() if p["mark"] == m) for m in ("fit", "strat", "line", "ours")}
    print(f"sessions {n_s} · people {n_p} · marks {marked} · both {d['both']}")
    args = sys.argv[1:]
    tpl = (HERE / "page.html").read_text(encoding="utf-8")
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
        return
    if len(pw) < 10:
        sys.exit("EVENT_PASS 는 10자 이상 — 저장소 · 로그에 남기지 않는다")
    sealed = subprocess.run(["node", str(HERE / "seal.mjs")], input=payload.encode(), capture_output=True,
                            env={**os.environ, "EVENT_PASS": pw}, check=True).stdout.decode()
    out.write_text(tpl.replace("/*__PLAIN__*/null", "null").replace("/*__SEALED__*/null", sealed), encoding="utf-8")
    print("wrote sealed", out, len(out.read_bytes()), "bytes")


if __name__ == "__main__":
    main()
