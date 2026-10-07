// 남산타워 조명 참여사(USDT 수취분) 인보이스 양식 — docx 생성
// 실행: NODE_PATH=<docx 가 설치된 node_modules> node invoice-template-namsan-1003.build.js
// 금액 · 지갑 주소 · 트랜잭션 해시 · 상대 법인 정보는 양식에 넣지 않는다(대괄호 칸만).
const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType,
  AlignmentType, BorderStyle, ShadingType, Footer, VerticalAlign,
} = require("docx");

const FONT = "Arial";
const INK = "1F2A44";      // headings
const BODY = "2B2F36";     // body text
const MUTED = "6B7280";    // labels
const RULE = "C9CED6";     // borders
const FILL = "EEF1F5";     // header fill
const PAID = "1E7B4F";     // status

// A4, 16mm margins → content width 11906 - 2*907 = 10092 DXA
const PAGE_W = 11906, PAGE_H = 16838, MARGIN = 907;
const CONTENT = PAGE_W - 2 * MARGIN;

const none = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const line = { style: BorderStyle.SINGLE, size: 4, color: RULE };
const noBorders = { top: none, bottom: none, left: none, right: none };
const tableNoBorders = { ...noBorders, insideHorizontal: none, insideVertical: none };

const run = (text, o = {}) => new TextRun({ text, font: FONT, size: o.size || 19, bold: !!o.bold, color: o.color || BODY, allCaps: !!o.caps, characterSpacing: o.spacing });
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
const top = new Table({
  width: { size: CONTENT, type: WidthType.DXA },
  columnWidths: [LEFT, RIGHT],
  borders: tableNoBorders,
  rows: [new TableRow({ children: [
    cell([
      para(run("[Issuer legal name — Wellbian Labs]", { size: 26, bold: true, color: INK }), { after: 80 }),
      para(run("[Registered address, line 1]", { size: 17 }), { after: 20 }),
      para(run("[City, postcode, country]", { size: 17 }), { after: 20 }),
      para(run("Company reg. no.: [UEN / business registration no.]", { size: 17 }), { after: 20 }),
      para(run("[contact email]  ·  [website]", { size: 17 }), { after: 20 }),
    ], LEFT, { margins: { top: 0, bottom: 0, left: 0, right: 100 } }),
    cell([
      para(run("INVOICE", { size: 44, bold: true, color: INK, spacing: 40 }), { align: AlignmentType.RIGHT, after: 60 }),
      metaRow("Invoice no.", "[WBL-2026-10-001]"),
      metaRow("Invoice date", "[DD Month YYYY]"),
      metaRow("Service date", "3 October 2026"),
      metaRow("Status", "PAID", PAID),
    ], RIGHT, { margins: { top: 0, bottom: 0, left: 100, right: 0 } }),
  ] })],
});

const rule = para(run(""), { before: 80, after: 120, border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: RULE, space: 1 } } });

// ---- 2. bill to
const billTo = [
  label("Bill to"),
  para(run("[Customer legal name]", { size: 21, bold: true, color: INK }), { after: 40 }),
  para(run("[Address]", { size: 18 }), { after: 20 }),
  para(run("Attn: [Name, title]  ·  [email]", { size: 18 }), { after: 20 }),
];

// ---- 3. line items
const W = [CONTENT - 900 - 1900 - 1900, 900, 1900, 1900];
const hdr = (t, w, align) => cell([para(run(t, { size: 16, bold: true, color: INK, caps: true, spacing: 10 }), { align, after: 0 })], w,
  { fill: FILL, borders: { top: line, bottom: line, left: none, right: none }, margins: { top: 90, bottom: 90, left: 120, right: 120 } });
const body = (paras, w) => cell(paras, w, { borders: { top: none, bottom: line, left: none, right: none }, margins: { top: 60, bottom: 60, left: 120, right: 120 } });
const num = (t, w) => body([para(run(t, { size: 19 }), { align: AlignmentType.RIGHT, after: 0 })], w);

const items = new Table({
  width: { size: CONTENT, type: WidthType.DXA },
  columnWidths: W,
  borders: tableNoBorders,
  rows: [
    new TableRow({ tableHeader: true, children: [
      hdr("Description", W[0], AlignmentType.LEFT), hdr("Qty", W[1], AlignmentType.RIGHT),
      hdr("Unit price (USDT)", W[2], AlignmentType.RIGHT), hdr("Amount (USDT)", W[3], AlignmentType.RIGHT),
    ] }),
    new TableRow({ children: [
      body([
        para(run("Sponsorship — N Seoul Tower lighting display", { size: 19, bold: true, color: INK }), { after: 40 }),
        para(run("XRP SEOUL 2026 · 3 October 2026 · Seoul, Korea", { size: 17, color: MUTED }), { after: 20 }),
        para(run("[Scope — e.g., name/logo display, time window]", { size: 17, color: MUTED }), { after: 0 }),
      ], W[0]),
      num("1", W[1]), num("[0.00]", W[2]), num("[0.00]", W[3]),
    ] }),
    new TableRow({ children: [
      body([para(run("[Additional item, if any]", { size: 19, color: MUTED }), { after: 0 })], W[0]),
      num("", W[1]), num("", W[2]), num("", W[3]),
    ] }),
  ],
});

// ---- 4. totals (right-aligned block)
const TL = 2700, TV = 1900, TPAD = CONTENT - TL - TV;
const totRow = (k, v, strong) => new TableRow({ children: [
  cell([para(run(""), { after: 0 })], TPAD),
  cell([para(run(k, { size: strong ? 19 : 18, bold: !!strong, color: strong ? INK : MUTED }), { after: 0 })], TL,
    { borders: strong ? { top: line, bottom: none, left: none, right: none } : noBorders, margins: { top: 35, bottom: 35, left: 120, right: 120 } }),
  cell([para(run(v, { size: strong ? 21 : 19, bold: !!strong, color: strong ? INK : BODY }), { align: AlignmentType.RIGHT, after: 0 })], TV,
    { borders: strong ? { top: line, bottom: none, left: none, right: none } : noBorders, margins: { top: 35, bottom: 35, left: 120, right: 120 } }),
] });
const totals = new Table({
  width: { size: CONTENT, type: WidthType.DXA },
  columnWidths: [TPAD, TL, TV],
  borders: tableNoBorders,
  rows: [
    totRow("Subtotal (USDT)", "[0.00]"),
    totRow("Tax", "[N/A]"),
    totRow("Total (USDT)", "[0.00]", true),
    totRow("Amount received (USDT)", "[0.00]"),
    totRow("Balance due (USDT)", "0.00"),
  ],
});

// ---- 5. payment received
const PK = 3000, PV = CONTENT - PK;
const payRow = (k, v) => new TableRow({ children: [
  cell([para(run(k, { size: 17, color: MUTED }), { after: 0 })], PK, { borders: { top: none, bottom: line, left: none, right: none }, margins: { top: 40, bottom: 40, left: 120, right: 120 } }),
  cell([para(run(v, { size: 18 }), { after: 0 })], PV, { borders: { top: none, bottom: line, left: none, right: none }, margins: { top: 40, bottom: 40, left: 120, right: 120 } }),
] });
const payment = new Table({
  width: { size: CONTENT, type: WidthType.DXA },
  columnWidths: [PK, PV],
  borders: tableNoBorders,
  rows: [
    payRow("Payment method", "USDT (Tether)"),
    payRow("Network", "[e.g., Ethereum (ERC-20) / Tron (TRC-20)]"),
    payRow("Amount received", "[0.00] USDT"),
    payRow("Sent from (payer wallet)", "[wallet address]"),
    payRow("Received to (our wallet)", "[wallet address]"),
    payRow("Transaction hash", "[TxID]"),
    payRow("Date and time received (UTC)", "[YYYY-MM-DD hh:mm]"),
    payRow("Reference value", "[USD / KRW amount] at [rate] on [date], source: [rate source] — for accounting only"),
  ],
});

// ---- 6. notes + signature (side by side, so the invoice fits one page)
const NOTE_W = 5300, SIG_W = CONTENT - NOTE_W;
const bottom = new Table({
  width: { size: CONTENT, type: WidthType.DXA },
  columnWidths: [NOTE_W, SIG_W],
  borders: tableNoBorders,
  rows: [new TableRow({ children: [
    cell([
      label("Notes"),
      para(run("Payment has been received in full. This invoice is issued for the payer's records.", { size: 17 }), { after: 40 }),
      para(run("Amounts are stated in USDT. The reference value in fiat currency is shown for accounting purposes only.", { size: 17 }), { after: 40 }),
      para(run("[Tax treatment note, if required]", { size: 17, color: MUTED }), { after: 0 }),
    ], NOTE_W, { margins: { top: 0, bottom: 0, left: 0, right: 300 } }),
    cell([
      para(run("For and on behalf of", { size: 17, color: MUTED }), { after: 20 }),
      para(run("[Issuer legal name — Wellbian Labs]", { size: 18, bold: true, color: INK }), { after: 320 }),
      para(run(""), { after: 40, border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: BODY, space: 1 } } }),
      para(run("Name: [Full name]", { size: 17 }), { after: 20 }),
      para(run("Title: [Title]", { size: 17 }), { after: 20 }),
      para(run("Date: [DD Month YYYY]", { size: 17 }), { after: 60 }),
      para(run("Company stamp (if applicable)", { size: 15, color: MUTED }), { after: 0 }),
    ], SIG_W, { margins: { top: 0, bottom: 0, left: 200, right: 0 } }),
  ] })],
});

const doc = new Document({
  creator: "Wellbian Labs",
  title: "Invoice — N Seoul Tower lighting display (XRP SEOUL 2026)",
  styles: { default: { document: { run: { font: FONT, size: 19, color: BODY } } } },
  sections: [{
    properties: { page: { size: { width: PAGE_W, height: PAGE_H }, margin: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN } } },
    footers: { default: new Footer({ children: [
      para(run("[Issuer legal name — Wellbian Labs]  ·  [contact email]  ·  [website]", { size: 15, color: MUTED }), { align: AlignmentType.CENTER, after: 0 }),
    ] }) },
    children: [
      top, rule,
      ...billTo,
      para(run(""), { after: 100 }),
      items,
      para(run(""), { after: 60 }),
      totals,
      para(run(""), { after: 140 }),
      label("Payment received"),
      payment,
      para(run(""), { after: 160 }),
      bottom,
    ],
  }],
});

const out = path.join(__dirname, "invoice-template-namsan-1003.docx");
Packer.toBuffer(doc).then((buf) => { fs.writeFileSync(out, buf); console.log("wrote", out, buf.length); });
