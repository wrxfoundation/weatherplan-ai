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
    "Balaji Srinivasan": ("The Network State", "n"),
    "Arjun Sethi": ("Kraken 공동 CEO", "n"),
    "SeonJoo Yoon": ("업비트(두나무) CBIO", "n"),
    "Kyoungsuk Oh": ("두나무(업비트) 대표", "n"),
    "Tom Schmidt": ("Dragonfly GP", "n"),
    "Michael Ippolito": ("Blockworks 공동창업자", "n"),
    "Yat Siu": ("Animoca Brands 회장", "n"),
    "Johann Kerbrat": ("Robinhood 크립토 총괄", "n"),
    "Marcin Kazmierczak": ("RedStone 공동창업자", "n"),
    "SungGuan Yun": ("한국은행 디지털화폐", "n"),
    "Frank Chaparro": ("GSR 콘텐츠", "n"),
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
    "Andrea Muttoni": ("Story Foundation 사장", "s"),
    "Chetan Karkhanis": ("Franklin Templeton SVP", "s"),
    "Ambre Soubiran": ("Kaiko CEO", "s"),
    "Wish Wu": ("Pharos Network CEO", "s"),
    "Ashutosh Sahoo": ("ZeruAI CEO", "s"),
    "Albert Castellana Lluís": ("GenLayer Labs CEO", "s"),
    "Burnt Banksy": ("Burnt · XION 창업자", "s"),
    "Jongwook Oh": ("웨이브릿지 대표", "s"),
    "Michael Dong": ("Brevis 공동창업자로 보임", "k"),
    "Dhawal Shah": ("Hey Elsa 로 보임", "k"),
    "Joe Lubin": ("Consensys", "k"),
    "Camila Russo": ("The Defiant", "k"),
    "Jing Wang": ("Optimism", "k"),
    "Keone Hon": ("Monad", "k"),
    "Eric Chen": ("Injective", "k"),
    "Tomer Weller": ("Stellar 개발재단", "k"),
    "Muneeb Ali": ("Stacks", "k"),
    "Amanda Cassatt": ("Serotonin", "k"),
    "Sam MacPherson": ("Phoenix Labs(Sky)", "k"),
    "Amanda Tuminelli": ("DeFi Education Fund", "k"),
    "Guy Young": ("Ethena", "k"),
    "Vladimir Novakovski": ("Lighter", "k"),
    "Paul Frambot": ("Morpho", "k"),
    "Austin Federa": ("DoubleZero", "k"),
    "Ed Felten": ("Offchain Labs", "k"),
    "Miles Jennings": ("a16z crypto", "k"),
    "Chris Brummer": ("조지타운대 로스쿨", "k"),
    "Eleanor Terrett": ("Crypto in America", "k"),
    "Lasse Clausen": ("1kx", "k"),
    "Kelvin Koh": ("Spartan Group", "k"),
    "Franklin Bi": ("Pantera Capital", "k"),
    "Alex Thorn": ("Galaxy 리서치", "k"),
    "Eliezer Ndinga": ("21Shares", "k"),
    "Jae Kwon": ("Gno.land(코스모스 창시자)", "k"),
    "Ben Fielding": ("Gensyn", "k"),
    "Sheila Warren": ("Crypto Council for Innovation", "k"),
    "Todd McDonald": ("R3", "k"),
    "Joseph Chalom": ("SharpLink", "k"),
    "Howard Wu": ("Aleo", "k"),
    "Ryan Watkins": ("Syncracy Capital", "k"),
    "Mike Silagadze": ("ether.fi", "k"),
    "Farooq Malik": ("Rain", "k"),
    "Raagulan Pathy": ("KAST", "k"),
    "Bill Zanker": ("$TRUMP 발행 측", "k"),
    "Akshat Vaidya": ("Maven 11", "k"),
    "Dryden Brown": ("Praxis", "k"),
    "Cody Carbone": ("The Digital Chamber", "k"),
    "Miller Whitehouse-Levine": ("Solana Policy Institute", "k"),
    "Katherine Dowling": ("Bitwise", "k"),
    "Hong Kim": ("Bitwise", "k"),
    "Jason Gottlieb": ("Morrison Cohen", "k"),
    "John D'Agostino": ("Coinbase", "k"),
    "John Darsie": ("SkyBridge", "k"),
    "Peter Chung": ("Presto Research", "k"),
    "Zaheer Ebtikar": ("Split Capital", "k"),
    "Harry Jung": ("Nxum", "k"),
    "Byoungdeok Min": ("국회의원(민병덕)", "k"),
    "Trevor Traina": ("전 주오스트리아 미국대사", "k"),
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
    "Andrea Muttoni": ("fit", "IP · 데이터 권리의 온체인화(Story) — AI 학습 데이터 권리, 측정 데이터가 쓰이는 판"),
    "Jongwook Oh": ("fit", "국내 x402 패널(웨이브릿지 대표) — 한국 기관 쪽 x402 대화 상대"),
    "Michael Heinrich": ("strat", "탈중앙 데이터 · AI 인프라(0G Labs) — 데이터 쪽 대화 후보"),
    "Caroline D. Pham": ("strat", "해외 구매자 RLUSD 온램프(MoonPay) — 해외 결제를 설계할 때 대화 상대"),
    "Guy Wuollet": ("strat", "DePIN 투자 관점(a16z crypto) — 실적을 들고 만날 상대"),
    "Tom Schmidt": ("strat", "DePIN 투자(Dragonfly) — 한 하우스에는 한 사람만 연다"),
    "Lasse Clausen": ("strat", "DePIN 을 다뤄 온 VC(1kx) — 대화는 1차 판매 실적 뒤"),
    "Akshat Vaidya": ("strat", "인프라 VC(Maven 11) — Firelight 8월 라운드 참여. 실적 뒤"),
    "SungGuan Yun": ("strat", "한국은행 디지털화폐 — 예금토큰 · 원화 결제 방향"),
    "Michael Ippolito": ("strat", "영문 미디어 · 리서치(Blockworks) — 10/3 시연 뒤 커버리지 후보"),
    "Frank Chaparro": ("strat", "미디어(GSR 콘텐츠) — 모더레이터 3세션"),
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
}

# XRP SEOUL — md 「우리와 결」 10명을 결 · 전략으로 나눈다 + 선
XS_FIT = {"Hugo Philion", "Connor Sullivan", "Chandler Fang", "Nathaniel T. Bradley", "Johnny Youn", "Marcin Kazmierczak"}
XS_STRAT = {"Crypto Eri", "Jake Ku", "Changhoon Moon", "Lacey Wisdom"}
XS_OURS = {"Sunghwan Kim"}
XS_LINE = {
    "Christina Chan": "리플 — 공개 직함까지",
    "Jinnie Lee": "리플 — 공개 직함까지",
    "Ayo Akinyele": "리플 — 공개 직함까지",
    "Tatsuya Kohrogi": "리플 — 공개 직함까지",
    "Pablo Che Leo": "리플 — 공개 직함까지",
    "Sabrina Tachdjian": "XRP 아시아(리플이 만든 조직) — 리플과 같은 선",
    "Leonard Hoh": "거래소 — 인사만",
    "Adam Oozeer": "크로스체인 — 우리 쪽 발화는 10/3 직전 다시 확인",
    "Fig": "크로스체인 — 우리 쪽 발화는 10/3 직전 다시 확인",
    "Aniket Jindal": "멀티체인 실행 — 우리 쪽 발화는 10/3 직전 다시 확인",
}

# 비밀번호 없는 페이지용 — md 결 근거 중 비공개 관계 · 계획이 든 칸은 공개 가능한 표현으로
XS_WHY = {
    "Crypto Eri": "기존 연결 — 일본 XRP 커뮤니티 · 12:05 패널 좌장 · X 확산",
    "Jake Ku": "기존 연결 — XRPL Korea(국내 커뮤니티 · 빌더 관문)",
    "Changhoon Moon": "9/5 Flare 워크숍 같은 무대 — 국내 XRP 리테일 창구",
    "Connor Sullivan": "Flare 생태계 보장 층 · 재보험 출신 — 리스크를 값으로 매기는 쪽",
    "Johnny Youn": "XRPL 구조화상품(KFIP 2026 1위) — 지수 · 파생 설계 역량",
}
XS_PE_DROP = [r"\s*휴고와 2019년부터 구면 · 이번 KBW 미디어 파트너\(9/23 미팅\)", r"\s*Eri 와 2019년부터 구면\(9/23 미팅\)",
              r"\.\s*$"]

KO = {
    "Charles Jansen": "찰스 얀센", "Ambre Soubiran": "앙브르 수비랑", "Andrea Muttoni": "안드레아 무토니", "Jongwook Oh": "오종욱",
    "Michael Heinrich": "마이클 하인리히", "Caroline D. Pham": "캐롤라인 팸", "Guy Wuollet": "가이 울렛", "Tom Schmidt": "톰 슈미트",
    "Lasse Clausen": "라세 클라우젠", "Akshat Vaidya": "악샷 바이디아", "Michael Ippolito": "마이클 이폴리토",
    "Frank Chaparro": "프랭크 차파로", "Kyoungsuk Oh": "오경석", "SeonJoo Yoon": "윤선주", "Arjun Sethi": "아르준 세티",
    "John D'Agostino": "존 다고스티노", "Mike Belshe": "마이크 벨시", "Byoungdeok Min": "민병덕",
}
# KBW 쪽 회사 · 인물 한 줄(표시된 사람만 — 공개 자료 기준)
KBW_DESC = {
    "Charles Jansen": ("S&P Global — 신용평가 · 지수(S&P 다우존스 지수) · 시장 데이터", "DeFi 전환 총괄. 10/1 「시장 데이터에서 등급으로」 패널"),
    "Ambre Soubiran": ("Kaiko — 크립토 시장 데이터 · 지수. 거래소 · DeFi 체결 데이터로 리스크 · 변동성 지표, Cometh 인수", "CEO. 10/1 「시장 데이터에서 등급으로」 패널"),
    "Andrea Muttoni": ("Story — 지식재산(IP)을 온체인에 등록 · 라이선스하는 L1, AI 학습 데이터 권리", "Story Foundation 사장. 9/30 「AI 붐 뒤의 데이터 레이스」 패널"),
    "Jongwook Oh": ("웨이브릿지 — 국내 디지털자산 금융 인프라", "대표. 9/30 「x402 · AI 결제 · 프라이버시」 패널"),
    "Michael Heinrich": ("0G Labs — 탈중앙 AI 인프라(데이터 가용성 · 저장 · 연산)", "공동창업자 겸 CEO. 9/30 「AI 에이전트 신뢰 층」 발표"),
    "Caroline D. Pham": ("MoonPay — 법정화폐 ↔ 크립토 온램프 · 결제", "전 CFTC 위원장 대행. 9/30 「토큰화가 월가를 바꾸는 법」 패널"),
    "Guy Wuollet": ("a16z crypto — 크립토 전문 VC", "GP. 9/30 「펀드 산업의 토큰화」 패널"),
    "Tom Schmidt": ("Dragonfly — 크립토 VC", "GP. 10/1 「자본이 그리는 다음 사이클」 패널"),
    "Lasse Clausen": ("1kx — 크립토 VC(추정)", "10/1 「자본이 그리는 다음 사이클」 패널"),
    "Akshat Vaidya": ("Maven 11 — 크립토 VC(추정). Firelight 8월 라운드 참여", "10/1 「초기 투자자들이 지금 거는 곳」 패널"),
    "SungGuan Yun": ("한국은행 — 디지털화폐(CBDC · 예금토큰)", "9/30 「디지털화폐와 한국의 다음 구조」"),
    "Michael Ippolito": ("Blockworks — 크립토 미디어 · 리서치 · 행사", "공동창업자. 10/1 「월가의 크립토 결산」 모더레이터"),
    "Frank Chaparro": ("미디어(GSR 콘텐츠)", "모더레이터 3세션(9/30 두 번 · 10/1)"),
    "Kyoungsuk Oh": ("두나무 — 업비트 운영사, KBW 메인 스폰서", "대표. 9/30 10:30 발표"),
    "SeonJoo Yoon": ("업비트(두나무)", "CBIO. 9/30 「CLARITY 이후 미국 시장」 모더레이터"),
    "Arjun Sethi": ("Kraken — 글로벌 거래소", "공동 CEO"),
    "John D'Agostino": ("Coinbase(추정)", "10/1 「월가의 크립토 결산」 패널"),
    "Mike Belshe": ("BitGo — 디지털자산 커스터디", "CEO. 9/30 「기관 크립토 시대의 보안」"),
}
# 중요도 — 제안 순위(0 = 우리, 1~5 최우선, 6~13 우선, 14~ 참고, 90~ 선). 둘째 값 = 순위 근거(공개 가능한 한 구절)
RANK = {
    "Sunghwan Kim": (0, "우리 키노트 14:50"),
    "Hugo Philion": (1, "기존 파트너 · 같은 날 13:30 키노트"),
    "Crypto Eri": (2, "기존 연결 · 12:05 좌장 · 일본 · X 확산"),
    "Chandler Fang": (3, "x402 결제 층 핵심 · 이번 주 서울"),
    "Marcin Kazmierczak": (4, "오라클 첫 대화 후보 · 두 행사"),
    "Lacey Wisdom": (5, "DePIN 투자사 · t54 투자사"),
    "Charles Jansen": (6, "지수 · 평가 기관 · KBW 10/1"),
    "Jake Ku": (7, "국내 XRPL 커뮤니티 관문"),
    "Changhoon Moon": (8, "국내 XRP 리테일 창구"),
    "Nathaniel T. Bradley": (9, "데이터 자산화 · 센서 데이터 제휴"),
    "Johnny Youn": (10, "XRPL 구조화상품 · KFIP 1위"),
    "Connor Sullivan": (11, "Flare 생태계 보장 층"),
    "Caroline D. Pham": (12, "해외 구매 온램프"),
    "Guy Wuollet": (13, "DePIN 투자(a16z crypto)"),
    "Michael Heinrich": (14, "데이터 · AI 인프라"),
    "Ambre Soubiran": (15, "시장 데이터 회사"),
    "Jongwook Oh": (16, "국내 x402 패널"),
    "Tom Schmidt": (17, "DePIN 투자(Dragonfly)"),
    "Lasse Clausen": (18, "DePIN VC"),
    "Akshat Vaidya": (19, "인프라 VC"),
    "Andrea Muttoni": (20, "데이터 권리"),
    "SungGuan Yun": (21, "한국은행 디지털화폐"),
    "Michael Ippolito": (22, "영문 미디어"),
    "Frank Chaparro": (23, "미디어"),
}
LINE_ORDER = ["Monica Long", "Kyoungsuk Oh", "SeonJoo Yoon", "Johann Kerbrat", "Leonard Hoh", "Arjun Sethi", "John D'Agostino",
              "Mike Belshe", "Christina Chan", "Jinnie Lee", "Sabrina Tachdjian", "Ayo Akinyele", "Tatsuya Kohrogi",
              "Pablo Che Leo", "Adam Oozeer", "Fig", "Aniket Jindal"]


def tier(rank):
    if rank is None:
        return ""
    return "ours" if rank == 0 else "top" if rank <= 5 else "high" if rank <= 13 else "ref" if rank < 90 else "line"


# ── 판정 — KBW 세션(제목 앞부분으로 찾는다) ─────────────────────────────────────────────
SMARK = {
    "x402, AI Payments": ("fit", "x402 = 우리 기계 고객 레인(정본 x402 단가). 카카오페이가 x402 재단 창립 멤버(국내 유일) — 한국 x402 흐름을 한자리에서"),
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
    "Friends and Family": ("strat", "초기 투자자들이 지금 거는 곳 — Maven 11(Firelight 투자 참여)"),
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
    "중요도 = 제안 순위(최우선 5 · 우선 8 · 참고 10, 선은 맨 뒤) — 기존 관계 · 레인 중심 · 10/3 동선 · 옆 사람으로 이어지는 정도로 매겼다.",
    "판정은 제안이다 — 「내 표시」로 바꾸면 이 기기에만 저장되고, 「내보내기」로 복사해 보내 주면 원본에 반영한다.",
    "결 = 우리 레인(검증 데이터 · x402 기계 고객 · DePIN · 보험/지수) · 전략 = 관계 · 자본 · 정책 · 미디어 · "
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
    t = t.replace("==", "")
    t = re.sub(r"\{\{(.+?)\}\}", r"\1", t)
    t = t.replace("[추론]", "(추론)")
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
            p["rank"], p["rwhy"] = RANK[k]
        elif k in LINE_ORDER:
            p["rank"], p["rwhy"] = 90 + LINE_ORDER.index(k), ""
        p["tier"] = tier(p.get("rank"))
    both = [k for k, p in people.items() if len(p["ev"]) > 1]
    return both


def data():
    kbw, people = parse_agenda()
    xs = parse_xrps(people)
    both = marks(people)
    for k in XS_FIT | XS_STRAT | set(XS_LINE) | XS_OURS | set(RANK) | set(KBW_DESC) | set(KO) | set(LINE_ORDER) | set(XS_WHY):
        assert k in people, ("이름 불일치", k)
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


def main():
    d = data()
    payload = json.dumps(d, ensure_ascii=False, separators=(",", ":"))
    n_s = sum(1 for s in d["sessions"] if s["kind"] != "break")
    n_p = len(d["people"])
    marked = {m: sum(1 for p in d["people"].values() if p["mark"] == m) for m in ("fit", "strat", "line", "ours")}
    print(f"sessions {n_s} · people {n_p} · marks {marked} · both {d['both']}")
    args = sys.argv[1:]
    tpl = (HERE / "page.html").read_text(encoding="utf-8")
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
