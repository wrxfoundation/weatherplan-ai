/* 최소 XLSX 작성기 (9/8 서우 — "csv 깨져서 나와서, 한글이랑 문자 export 잘 해줘")

   CSV 는 UTF-8 BOM 을 붙여도 여는 프로그램이 무시하면 한글이 깨진다. 엑셀 파일(.xlsx)은 안에 문자 인코딩이
   UTF-8 로 못 박혀 있어 어디서 열어도 같다. 라이브러리 없이 만든다 — xlsx 는 XML 몇 장을 ZIP 으로 묶은 것이고,
   ZIP 은 node:zlib 의 deflate 와 CRC32 표 하나면 쓸 수 있다.

   지원하는 것: 시트 여러 장, 문자열(inline string)·숫자 셀, 첫 행 굵게, 열 너비 자동. 그 이상은 필요 없다. */

import { deflateRawSync } from "node:zlib";

export type Cell = string | number;
export type Sheet = { name: string; rows: Cell[][] };

/* ── ZIP (deflate) ─────────────────────────────────────────────────── */
const CRC = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (b: Buffer) => {
  let c = 0xffffffff;
  for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const u16 = (n: number) => { const b = Buffer.alloc(2); b.writeUInt16LE(n); return b; };
const u32 = (n: number) => { const b = Buffer.alloc(4); b.writeUInt32LE(n >>> 0); return b; };

const zip = (files: { name: string; data: Buffer }[]): Buffer => {
  const parts: Buffer[] = [];
  const central: Buffer[] = [];
  let offset = 0;
  /* DOS 시각 — 고정값(2026-09-08 00:00). 파일마다 다를 이유가 없다. */
  const dosTime = u16(0), dosDate = u16(((2026 - 1980) << 9) | (9 << 5) | 8);
  for (const f of files) {
    const name = Buffer.from(f.name, "utf8");
    const raw = f.data;
    const comp = deflateRawSync(raw, { level: 6 });
    const crc = crc32(raw);
    const local = Buffer.concat([
      u32(0x04034b50), u16(20), u16(0x0800), u16(8), dosTime, dosDate,
      u32(crc), u32(comp.length), u32(raw.length), u16(name.length), u16(0), name, comp,
    ]);
    central.push(Buffer.concat([
      u32(0x02014b50), u16(20), u16(20), u16(0x0800), u16(8), dosTime, dosDate,
      u32(crc), u32(comp.length), u32(raw.length), u16(name.length), u16(0), u16(0), u16(0), u16(0),
      u32(0), u32(offset), name,
    ]));
    parts.push(local);
    offset += local.length;
  }
  const cd = Buffer.concat(central);
  const end = Buffer.concat([u32(0x06054b50), u16(0), u16(0), u16(files.length), u16(files.length), u32(cd.length), u32(offset), u16(0)]);
  return Buffer.concat([...parts, cd, end]);
};

/* ── XML ────────────────────────────────────────────────────────────── */
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
  /* 엑셀이 거부하는 제어 문자는 뺀다 */
  .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "");
const col = (i: number) => { let s = ""; for (let n = i + 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s; return s; };
/* 시트 이름 규칙 — 31자, [ ] : * ? / \ 금지 */
const sheetName = (s: string, i: number) => (s.replace(/[\[\]:*?/\\]/g, " ").trim() || `Sheet${i + 1}`).slice(0, 31);

const sheetXml = (rows: Cell[][]) => {
  const widths: number[] = [];
  const body = rows.map((r, ri) => {
    const cells = r.map((v, ci) => {
      const len = String(v).length;
      /* 한글은 두 칸 — 열 너비를 글자 수로 잡으면 한글 열이 잘린다 */
      const w = [...String(v)].reduce((a, ch) => a + (ch.charCodeAt(0) > 0x2e7f ? 2 : 1), 0);
      widths[ci] = Math.max(widths[ci] ?? 0, Math.min(60, w), len ? 4 : 0);
      const ref = `${col(ci)}${ri + 1}`;
      const st = ri === 0 ? ' s="1"' : "";
      return typeof v === "number" && Number.isFinite(v)
        ? `<c r="${ref}"${st}><v>${v}</v></c>`
        : `<c r="${ref}"${st} t="inlineStr"><is><t xml:space="preserve">${esc(String(v))}</t></is></c>`;
    }).join("");
    return `<row r="${ri + 1}">${cells}</row>`;
  }).join("");
  const cols = widths.length
    ? `<cols>${widths.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${Math.min(60, w + 2)}" customWidth="1"/>`).join("")}</cols>`
    : "";
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>${cols}<sheetData>${body}</sheetData></worksheet>`;
};

export const xlsx = (sheets: Sheet[]): Buffer => {
  const names = sheets.map((s, i) => sheetName(s.name, i));
  const files: { name: string; data: Buffer }[] = [];
  const put = (name: string, xml: string) => files.push({ name, data: Buffer.from(xml, "utf8") });

  put("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("")}</Types>`);
  put("_rels/.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`);
  put("xl/workbook.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${names.map((n, i) => `<sheet name="${esc(n)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join("")}</sheets></workbook>`);
  put("xl/_rels/workbook.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join("")}<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`);
  /* 스타일 0 = 기본, 1 = 굵게(머리 행). 글꼴은 맑은 고딕 — 한글 엑셀 기본 */
  put("xl/styles.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Malgun Gothic"/></font><font><b/><sz val="11"/><name val="Malgun Gothic"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`);
  sheets.forEach((s, i) => put(`xl/worksheets/sheet${i + 1}.xml`, sheetXml(s.rows)));
  return zip(files);
};
