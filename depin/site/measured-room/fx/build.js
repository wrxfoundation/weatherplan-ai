// assets/fx.js 를 만든다:  cd fx && npm install --ignore-scripts && npm run build
const esbuild = require("esbuild"), fs = require("fs"), path = require("path");
const out = path.join(__dirname, "..", "assets", "fx.js");
const lic = (p) => fs.readFileSync(path.join(__dirname, "node_modules", p), "utf8").trim();
esbuild.buildSync({
  entryPoints: [path.join(__dirname, "fx.jsx")], bundle: true, minify: true, format: "iife", target: ["es2019"], jsx: "automatic",
  define: { "process.env.NODE_ENV": '"production"' }, legalComments: "none", outfile: out,
  banner: { js: "/* Measured Room fx — React 18 (MIT) + border-beam · thinking-orbs · distortion-waves · metal-fx (MIT, Jakub Antalik; metal-fx 는 Paper Shaders liquidMetal, Apache-2.0 포함). 전문: assets/fx.LICENSES.txt */" },
});
const pk = (n) => JSON.parse(fs.readFileSync(path.join(__dirname, "node_modules", n, "package.json"), "utf8"));
const parts = [];
for (const n of ["react", "react-dom", "scheduler", "border-beam", "thinking-orbs", "distortion-waves", "metal-fx"]) parts.push(`===== ${n} ${pk(n).version} (${pk(n).license}) =====\n` + lic(n + "/LICENSE"));
parts.push("===== metal-fx NOTICE =====\n" + lic("metal-fx/NOTICE") + "\n\nApache License 2.0 전문: https://www.apache.org/licenses/LICENSE-2.0");
fs.writeFileSync(path.join(__dirname, "..", "assets", "fx.LICENSES.txt"), parts.join("\n\n") + "\n");
const size = fs.statSync(out).size; console.log("assets/fx.js", size, "bytes", "gzip", require("zlib").gzipSync(fs.readFileSync(out)).length);
