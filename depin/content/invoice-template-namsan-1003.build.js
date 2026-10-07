// 남산타워 조명 참여사 인보이스 — docx 생성 (빈 양식 · 채운 인보이스 공용)
// 빈 양식: NODE_PATH=<docx 가 설치된 node_modules> node invoice-template-namsan-1003.build.js
// 채운 판: NODE_PATH=<...> node invoice-template-namsan-1003.build.js <data.json> <out.docx>
// data.json(청구처 · 담당자 · 세금 번호 · 금액 · 지갑 · 해시)은 저장소 밖에 둔다 — 커밋하지 않는다.
// 통화 USD/USDT × 상태 PAID(받은 내역)/DUE(지급 안내). 대괄호 칸([...])은 노란 형광 — 채우면 형광이 빠진다.
const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType,
  AlignmentType, BorderStyle, ShadingType, Footer, VerticalAlign,
} = require("docx");

const data = process.argv[2] ? JSON.parse(fs.readFileSync(process.argv[2], "utf8")) : null;
const out = process.argv[3] || path.join(__dirname, "invoice-template-namsan-1003.docx");

// 발행 법인 — 싱가포르 등록 정보(공개 등기 사항)
const ISSUER = {
  name: "WELLBIAN LABS PTE. LTD.",
  lines: ["111 Somerset Road, #06-01W", "Singapore 238164"],
  reg: "UEN: 202604584N",
  contact: "admin@wellbianlabs.io  ·  wellbian.io",
};

const D = data || {};
const CUR = D.currency || "USDT";                    // "USD" | "USDT"
const DUE = (D.status || "PAID") === "DUE";
const NO = D.invoiceNo || "[WBL-2026-10-001]";
const INV_DATE = D.invoiceDate || "[DD Month YYYY]";
const AMT = D.amount || "[0.00]";
const BILL = D.billTo || { name: "[Customer legal name]", lines: ["[Address]"], attn: "Attn: [Name, title]  ·  [email]" };

const FONT = "Arial";
const INK = "1F2A44";      // headings
const BODY = "2B2F36";     // body text
const MUTED = "6B7280";    // labels
const RULE = "C9CED6";     // borders
const FILL = "EEF1F5";     // header fill
const PAID = "1E7B4F";     // status: paid
const OPEN = "B45309";     // status: due

// A4, 16mm margins → content width 11906 - 2*907 = 10092 DXA
const PAGE_W = 11906, PAGE_H = 16838, MARGIN = 907;
const CONTENT = PAGE_W - 2 * MARGIN;

const none = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const line = { style: BorderStyle.SINGLE, size: 4, color: RULE };
const noBorders = { top: none, bottom: none, left: none, right: none };
const tableNoBorders = { ...noBorders, insideHorizontal: none, insideVertical: none };

const isBlank = (t) => /\[[^\]]+\]/.test(t);
const run = (text, o = {}) => new TextRun({
  text, font: FONT, size: o.size || 19, bold: !!o.bold, color: o.color || BODY, allCaps: !!o.caps, characterSpacing: o.spacing,
  highlight: isBlank(text) ? "yellow" : undefined,
});
const para = (children, o = {}) => new Paragraph({
  children: Array.isArray(children) ? children : [children],
  alignment: o.align || AlignmentType.LEFT,
  spacing: { before: o.before || 0, after: o.after === undefined ? 40 : o.after, line: o.line || 252 },
  border: o.border,
});
const label = (t) => para(run(t, { size: 15, color: MUTED, bold: true, caps: true, spacing: 20 }), { after: 30 });

function cell(paragraphs, width, o = {}) {
  return new TableCell({
    children: paragraphs,
    width: { size: width, type: WidthType.DXA },
    borders: o.borders || noBorders,
    shading: o.fill ? { type: ShadingType.CLEAR, color: "auto", fill: o.fill } : undefined,
    margins: o.margins || { top: 60, bottom: 60, left: 100, right: 100 },
    verticalAlign: o.valign || VerticalAlign.TOP,
  });
}

// ---- 1. issuer + invoice meta (borderless, two columns)
const LEFT = 5400, RIGHT = CONTENT - LEFT;
const metaRow = (k, v, color) => para([run(k + "  ", { size: 17, color: MUTED }), run(v, { size: 17, bold: true, color: color || BODY })], { align: AlignmentType.RIGHT, after: 30 });
const meta = [
  metaRow("Invoice no.", NO),
  metaRow("Invoice date", INV_DATE),
  metaRow("Service date", "3 October 2026"),
  ...(DUE ? [metaRow("Payment terms", D.terms || "Due on receipt")] : []),
  metaRow("Status", DUE ? "DUE" : "PAID", DUE ? OPEN : PAID),
];
const top = new Table({
  width: { size: CONTENT, type: WidthType.DXA },
  columnWidths: [LEFT, RIGHT],
  borders: tableNoBorders,
  rows: [new TableRow({ children: [
    cell([
      para(run(ISSUER.name, { size: 26, bold: true, color: INK }), { after: 80 }),
      ...ISSUER.lines.map((l) => para(run(l, { size: 17 }), { after: 20 })),
      para(run(ISSUER.reg, { size: 17 }), { after: 20 }),
      para(run(ISSUER.contact, { size: 17 }), { after: 20 }),
    ], LEFT, { margins: { top: 0, bottom: 0, left: 0, right: 100 } }),
    cell([
      para(run("INVOICE", { size: 44, bold: true, color: INK, spacing: 40 }), { align: AlignmentType.RIGHT, after: 60 }),
      ...meta,
    ], RIGHT, { margins: { top: 0, bottom: 0, left: 100, right: 0 } }),
  ] })],
});

const rule = para(run(""), { before: 80, after: 120, border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: RULE, space: 1 } } });

// ---- 2. bill to
const billTo = [
  label("Bill to"),
  para(run(BILL.name, { size: 21, bold: true, color: INK }), { after: 40 }),
  ...BILL.lines.map((l) => para(run(l, { size: 18 }), { after: 20 })),
  ...(BILL.taxId ? [para(run(BILL.taxId, { size: 18 }), { after: 20 })] : []),
  ...(BILL.attn ? [para(run(BILL.attn, { size: 18 }), { after: 20 })] : []),
];

// ---- 3. line items
const W = [CONTENT - 900 - 1900 - 1900, 900, 1900, 1900];
const hdr = (t, w, align) => cell([para(run(t, { size: 16, bold: true, color: INK, caps: true, spacing: 10 }), { align, after: 0 })], w,
  { fill: FILL, borders: { top: line, bottom: line, left: none, right: none }, margins: { top: 90, bottom: 90, left: 120, right: 120 } });
const body = (paras, w) => cell(paras, w, { borders: { top: none, bottom: line, left: none, right: none }, margins: { top: 60, bottom: 60, left: 120, right: 120 } });
const num = (t, w) => body([para(run(t, { size: 19 }), { align: AlignmentType.RIGHT, after: 0 })], w);

const scope = data ? D.scope : "[Scope — e.g., name/logo display, time window]";
const items = new Table({
  width: { size: CONTENT, type: WidthType.DXA },
  columnWidths: W,
  borders: tableNoBorders,
  rows: [
    new TableRow({ tableHeader: true, children: [
      hdr("Description", W[0], AlignmentType.LEFT), hdr("Qty", W[1], AlignmentType.RIGHT),
      hdr(`Unit price (${CUR})`, W[2], AlignmentType.RIGHT), hdr(`Amount (${CUR})`, W[3], AlignmentType.RIGHT),
    ] }),
    new TableRow({ children: [
      body([
        para(run("Sponsorship — N Seoul Tower lighting display", { size: 19, bold: true, color: INK }), { after: 40 }),
        para(run("XRP SEOUL 2026 · 3 October 2026 · Seoul, Korea", { size: 17, color: MUTED }), { after: scope ? 20 : 0 }),
        ...(scope ? [para(run(scope, { size: 17, color: MUTED }), { after: 0 })] : []),
      ], W[0]),
      num("1", W[1]), num(AMT, W[2]), num(AMT, W[3]),
    ] }),
    ...(data ? [] : [new TableRow({ children: [
      body([para(run("[Additional item, if any]", { size: 19, color: MUTED }), { after: 0 })], W[0]),
      num("", W[1]), num("", W[2]), num("", W[3]),
    ] })]),
  ],
});

// ---- 4. totals (right-aligned block)
const TL = 2700, TV = 1900, TPAD = CONTENT - TL - TV;
const totRow = (k, v, strong, bold) => new TableRow({ children: [
  cell([para(run(""), { after: 0 })], TPAD),
  cell([para(run(k, { size: strong ? 19 : 18, bold: !!(strong || bold), color: strong || bold ? INK : MUTED }), { after: 0 })], TL,
    { borders: strong ? { top: line, bottom: none, left: none, right: none } : noBorders, margins: { top: 35, bottom: 35, left: 120, right: 120 } }),
  cell([para(run(v, { size: strong ? 21 : 19, bold: !!(strong || bold), color: strong || bold ? INK : BODY }), { align: AlignmentType.RIGHT, after: 0 })], TV,
    { borders: strong ? { top: line, bottom: none, left: none, right: none } : noBorders, margins: { top: 35, bottom: 35, left: 120, right: 120 } }),
] });
const totals = new Table({
  width: { size: CONTENT, type: WidthType.DXA },
  columnWidths: [TPAD, TL, TV],
  borders: tableNoBorders,
  rows: DUE ? [
    totRow(`Subtotal (${CUR})`, AMT),
    totRow("Tax", "N/A"),
    totRow(`Total (${CUR})`, AMT, true),
    totRow(`Balance due (${CUR})`, AMT, false, true),
  ] : [
    totRow(`Subtotal (${CUR})`, AMT),
    totRow("Tax", data ? "N/A" : "[N/A]"),
    totRow(`Total (${CUR})`, AMT, true),
    totRow(`Amount received (${CUR})`, AMT),
    totRow(`Balance due (${CUR})`, "0.00"),
  ],
});

// ---- 5. payment received (PAID) / payment instructions (DUE)
const defaultPayment = () => {
  if (DUE && CUR === "USDT") return [
    ["Currency", "USDT (Tether)"],
    ["Network", "[e.g., Ethereum (ERC-20) / Tron (TRC-20)]"],
    ["Send to (Wellbian Labs wallet)", "[wallet address]"],
    ["Amount", `${AMT} USDT`],
    ["Payment reference", NO],
  ];
  if (DUE) return [
    ["Bank name", "[Bank name]"],
    ["Account name", ISSUER.name],
    ["Account no.", "[Account number]"],
    ["SWIFT / BIC", "[SWIFT code]"],
    ["Amount", `${AMT} ${CUR}`],
    ["Payment reference", NO],
  ];
  if (CUR === "USD") return [
    ["Payment method", "Bank transfer (USD)"],
    ["Amount received", `${AMT} USD`],
    ["Date received", "[DD Month YYYY]"],
    ["Paid by", BILL.name],
    ["Bank reference", "[reference, if any]"],
  ];
  return [
    ["Payment method", "USDT (Tether)"],
    ["Network", "[e.g., Ethereum (ERC-20) / Tron (TRC-20)]"],
    ["Amount received", `${AMT} USDT`],
    ["Sent from (payer wallet)", "[wallet address]"],
    ["Received to (our wallet)", "[wallet address]"],
    ["Transaction hash", "[TxID]"],
    ["Date and time received (UTC)", "[YYYY-MM-DD hh:mm]"],
    ["Reference value", "[USD / KRW amount] at [rate] on [date], source: [rate source] — for accounting only"],
  ];
};
const PK = 3000, PV = CONTENT - PK;
const payRow = ([k, v]) => new TableRow({ children: [
  cell([para(run(k, { size: 17, color: MUTED }), { after: 0 })], PK, { borders: { top: none, bottom: line, left: none, right: none }, margins: { top: 40, bottom: 40, left: 120, right: 120 } }),
  cell([para(run(v, { size: 18 }), { after: 0 })], PV, { borders: { top: none, bottom: line, left: none, right: none }, margins: { top: 40, bottom: 40, left: 120, right: 120 } }),
] });
const payment = new Table({
  width: { size: CONTENT, type: WidthType.DXA },
  columnWidths: [PK, PV],
  borders: tableNoBorders,
  rows: (D.payment || defaultPayment()).map(payRow),
});

// ---- 6. notes + signature (side by side, so the invoice fits one page)
const defaultNotes = () => {
  if (DUE && CUR === "USDT") return [
    "Please send USDT on the network stated above only. Funds sent on any other network may not be recoverable.",
    "Network and transfer fees are borne by the payer, so that the full invoiced amount is received.",
    "We will confirm receipt by email, with the transaction hash.",
  ];
  if (DUE) return [
    "Please quote the invoice number as the payment reference.",
    "Bank charges are borne by the payer, so that the full invoiced amount is received.",
  ];
  const paid = "Payment has been received in full. This invoice is issued for the payer's records.";
  if (CUR === "USD") return [paid, "Amounts are stated in US dollars (USD)."];
  return [
    paid,
    "Amounts are stated in USDT. The reference value in fiat currency is shown for accounting purposes only.",
    ...(data ? [] : ["[Tax treatment note, if required]"]),
  ];
};
const notes = D.notes || defaultNotes();
const NOTE_W = 5300, SIG_W = CONTENT - NOTE_W;
const bottom = new Table({
  width: { size: CONTENT, type: WidthType.DXA },
  columnWidths: [NOTE_W, SIG_W],
  borders: tableNoBorders,
  rows: [new TableRow({ children: [
    cell([
      label("Notes"),
      ...notes.map((t, i) => para(run(t, { size: 17, color: isBlank(t) ? MUTED : BODY }), { after: i === notes.length - 1 ? 0 : 40 })),
    ], NOTE_W, { margins: { top: 0, bottom: 0, left: 0, right: 300 } }),
    cell([
      para(run("For and on behalf of", { size: 17, color: MUTED }), { after: 20 }),
      para(run(ISSUER.name, { size: 18, bold: true, color: INK }), { after: 320 }),
      para(run(""), { after: 40, border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: BODY, space: 1 } } }),
      para(run(`Name: ${(D.signer && D.signer.name) || "[Full name]"}`, { size: 17 }), { after: 20 }),
      para(run(`Title: ${(D.signer && D.signer.title) || "[Title]"}`, { size: 17 }), { after: 20 }),
      para(run(`Date: ${INV_DATE}`, { size: 17 }), { after: 60 }),
      para(run("Company stamp (if applicable)", { size: 15, color: MUTED }), { after: 0 }),
    ], SIG_W, { margins: { top: 0, bottom: 0, left: 200, right: 0 } }),
  ] })],
});

const doc = new Document({
  creator: "Wellbian Labs",
  title: `Invoice ${data ? NO + " " : ""}— N Seoul Tower lighting display (XRP SEOUL 2026)`,
  styles: { default: { document: { run: { font: FONT, size: 19, color: BODY } } } },
  sections: [{
    properties: { page: { size: { width: PAGE_W, height: PAGE_H }, margin: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN } } },
    footers: { default: new Footer({ children: [
      para(run(`${ISSUER.name}  ·  ${ISSUER.reg}  ·  ${ISSUER.contact}`, { size: 15, color: MUTED }), { align: AlignmentType.CENTER, after: 0 }),
    ] }) },
    children: [
      top, rule,
      ...billTo,
      para(run(""), { after: 100 }),
      items,
      para(run(""), { after: 60 }),
      totals,
      para(run(""), { after: 140 }),
      label(DUE ? "Payment instructions" : "Payment received"),
      payment,
      para(run(""), { after: 160 }),
      bottom,
    ],
  }],
});

Packer.toBuffer(doc).then((buf) => { fs.writeFileSync(out, buf); console.log("wrote", out, buf.length); });
