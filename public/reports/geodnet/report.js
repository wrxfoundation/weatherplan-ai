/* GEODNET 해부 · 케이스 스터디 — 차트/표 렌더러
 *
 * 데이터는 이 파일 상단 DATA 상수에 전부 들어 있습니다 (외부 fetch 없음).
 * 테마 토큰(--s1~--s8 등)은 report.css 에서 읽어오므로 색은 여기서 하드코딩하지 않습니다.
 * 의존성: vendor/chart.umd.min.js (Chart.js 4.4.1) — index.html 에서 먼저 로드됩니다.
 */
const DATA = {"weekly":[["2023-09-07",0.0411,25836,0.01],["2023-09-14",0.0385,26436,0.06],["2023-09-21",0.0376,26778,0.06],["2023-09-28",0.0389,26328,0.05],["2023-10-05",0.0488,27517,0.11],["2023-10-12",0.0508,27016,0.14],["2023-10-19",0.0504,28480,0.07],["2023-10-26",0.0499,34801,0.08],["2023-11-02",0.048,35883,0.07],["2023-11-09",0.0533,35394,0.1],["2023-11-16",0.0552,36248,0.13],["2023-11-23",0.0703,37315,0.17],["2023-11-30",0.0714,37531,0.12],["2023-12-07",0.07,43011,0.14],["2023-12-14",0.083,41620,0.36],["2023-12-21",0.1562,43175,1.25],["2023-12-28",0.1395,42820,1.09],["2024-01-04",0.104,42635,0.29],["2024-01-11",0.0933,48854,0.35],["2024-01-18",0.1346,42263,0.39],["2024-01-25",0.1069,39925,0.42],["2024-02-01",0.1117,42921,0.29],["2024-02-08",0.098,44894,0.12],["2024-02-15",0.0936,52771,0.28],["2024-02-22",0.1075,52027,0.32],["2024-02-29",0.1522,59277,0.52],["2024-03-07",0.1968,62793,1.67],["2024-03-14",0.311,73608,4.03],["2024-03-21",0.2347,68092,2.05],["2024-03-28",0.232,71530,1.3],["2024-04-04",0.2405,66904,0.68],["2024-04-11",0.1967,67590,0.53],["2024-04-18",0.2276,62520,1.09],["2024-04-25",0.3121,64207,1.97],["2024-05-02",0.2452,58369,1.96],["2024-05-09",0.2291,60746,0.75],["2024-05-16",0.2375,63553,0.57],["2024-05-23",0.2111,69841,0.86],["2024-05-30",0.1865,69473,0.5],["2024-06-06",0.1838,71007,0.55],["2024-06-13",0.2016,67368,0.64],["2024-06-20",0.1701,64693,0.47],["2024-06-27",0.1663,62358,1.34],["2024-07-04",0.1673,60634,1.17],["2024-07-11",0.1525,57882,0.71],["2024-07-18",0.1566,63253,0.66],["2024-07-25",0.1537,63509,0.53],["2024-08-01",0.163,65998,0.89],["2024-08-08",0.1423,56325,1.41],["2024-08-15",0.1373,56659,0.36],["2024-08-22",0.1396,60678,0.41],["2024-08-29",0.1379,61107,0.48],["2024-09-05",0.1456,57172,0.89],["2024-09-12",0.1525,55589,0.83],["2024-09-19",0.2,60145,1.74],["2024-09-26",0.2693,64277,2.95],["2024-10-03",0.2642,60078,4.45],["2024-10-10",0.2782,59017,2.79],["2024-10-17",0.2539,68274,1.37],["2024-10-24",0.2226,65270,0.54],["2024-10-31",0.227,71545,0.41],["2024-11-07",0.2189,75373,0.55],["2024-11-14",0.2397,91638,0.81],["2024-11-21",0.2461,93294,0.85],["2024-11-28",0.2469,94240,0.61],["2024-12-05",0.2512,103484,0.63],["2024-12-12",0.245,102497,1.42],["2024-12-19",0.2335,100279,0.8],["2024-12-26",0.2267,99436,1.83],["2025-01-02",0.2377,93972,1.45],["2025-01-09",0.2413,95482,0.8],["2025-01-16",0.3121,99536,4.1],["2025-01-23",0.3414,101276,2.5],["2025-01-30",0.3503,106208,2.59],["2025-02-06",0.2921,97754,1.65],["2025-02-13",0.2848,94336,2.41],["2025-02-20",0.2987,97458,0.99],["2025-02-27",0.28,85263,3.17],["2025-03-06",0.3401,92738,5.15],["2025-03-13",0.2594,84070,3.08],["2025-03-20",0.2517,84037,0.87],["2025-03-27",0.252,87317,1.82],["2025-04-03",0.2579,81308,1.22],["2025-04-10",0.1978,81027,3.53],["2025-04-17",0.1897,84574,1.95],["2025-04-24",0.2214,94384,1.37],["2025-05-01",0.2098,93092,1.13],["2025-05-08",0.2316,100035,1.39],["2025-05-15",0.2244,101547,1.74],["2025-05-22",0.2155,111924,1.23],["2025-05-29",0.1948,108271,2.15],["2025-06-05",0.1885,105241,1.98],["2025-06-12",0.2133,109374,1.81],["2025-06-19",0.1842,104648,2.15],["2025-06-26",0.1918,108245,4.73],["2025-07-03",0.1462,107734,7.42],["2025-07-10",0.1645,109365,4.63],["2025-07-17",0.1796,118602,5.11],["2025-07-24",0.1618,119444,2.71],["2025-07-31",0.1592,118867,2.03],["2025-08-07",0.1372,115877,4.09],["2025-08-14",0.1873,123566,7.21],["2025-08-21",0.1384,113710,2.48],["2025-08-28",0.1469,113323,0.84],["2025-09-04",0.1496,109376,1.08],["2025-09-11",0.1689,114238,2.34],["2025-09-18",0.1925,116304,2.13],["2025-09-25",0.1848,113921,2.3],["2025-10-02",0.1571,116136,1.81],["2025-10-09",0.1564,121786,2.08],["2025-10-16",0.1385,110084,3.82],["2025-10-23",0.1327,109395,1.87],["2025-10-30",0.1254,112279,1.23],["2025-11-06",0.1232,99013,2.14],["2025-11-13",0.167,101585,4.78],["2025-11-20",0.1424,90426,2.99],["2025-11-27",0.1452,91255,2.61],["2025-12-04",0.1464,94028,2.13],["2025-12-11",0.1461,94229,1.6],["2025-12-18",0.1367,90228,1.79],["2025-12-25",0.1403,87776,1.95],["2026-01-01",0.1402,87561,1.63],["2026-01-08",0.1557,89449,1.35],["2026-01-15",0.1586,95950,1.65],["2026-01-22",0.1417,87313,1.39],["2026-01-29",0.15,86822,1.02],["2026-02-05",0.1369,69061,1.44],["2026-02-12",0.1285,65296,1.16],["2026-02-19",0.1279,67291,0.92],["2026-02-26",0.1362,66612,0.88],["2026-03-05",0.1263,73499,0.92],["2026-03-12",0.1292,69260,1.2],["2026-03-19",0.1341,68912,1.03],["2026-03-26",0.1419,71952,1.9],["2026-04-02",0.1396,69220,1.4],["2026-04-09",0.1344,72590,4.76],["2026-04-16",0.1418,74717,4.24],["2026-04-23",0.1229,77922,5.59],["2026-04-30",0.1047,75425,8.54],["2026-05-07",0.1328,82769,1.12],["2026-05-14",0.1325,78759,0.76],["2026-05-21",0.1461,78130,0.78],["2026-05-28",0.151,72763,0.97],["2026-06-04",0.1888,63561,1.44],["2026-06-11",0.1608,60960,0.82],["2026-06-18",0.2182,65252,2.0],["2026-06-25",0.1979,61770,2.85],["2026-07-02",0.2165,61072,3.18],["2026-07-09",0.203,62783,2.74],["2026-07-16",0.2005,64364,1.33],["2026-07-23",0.1864,66054,1.42],["2026-07-30",0.2006,64101,45.28],["2026-08-06",0.181,64605,37.1],["2026-08-13",0.1782,63573,42.95],["2026-08-20",0.2292,71331,18.68],["2026-08-27",0.22,77656,31.77],["2026-09-03",0.2158,76428,8.05]],"cohorts":[{"cohort":"2022-07 (Pre-TGE 96/d)","start":"2022-07-01","tokens":66144,"sell_daily_usd":4664,"payback_sell_days":611,"payback_hold_days":433,"hold_value_now":14830,"hold_peak_usd":21520,"hold_peak_date":"2025-01-27","days_elapsed":1526},{"cohort":"2023-07 (48/d)","start":"2023-07-01","tokens":31104,"sell_daily_usd":4664,"payback_sell_days":246,"payback_hold_days":163,"hold_value_now":6974,"hold_peak_usd":8445,"hold_peak_date":"2025-01-27","days_elapsed":1161},{"cohort":"2023-09 TGE (48/d)","start":"2023-09-07","tokens":27840,"sell_daily_usd":4664,"payback_sell_days":178,"payback_hold_days":104,"hold_value_now":6242,"hold_peak_usd":7227,"hold_peak_date":"2025-01-27","days_elapsed":1093},{"cohort":"2024-01 (48/d)","start":"2024-01-01","tokens":22272,"sell_daily_usd":4306,"payback_sell_days":94,"payback_hold_days":68,"hold_value_now":4994,"hold_peak_usd":5350,"hold_peak_date":"2026-08-23","days_elapsed":977},{"cohort":"2024-07 (24/d)","start":"2024-07-01","tokens":13536,"sell_daily_usd":2718,"payback_sell_days":148,"payback_hold_days":96,"hold_value_now":3035,"hold_peak_usd":3245,"hold_peak_date":"2026-08-23","days_elapsed":795},{"cohort":"2025-01 ATH buyer (24/d)","start":"2025-01-25","tokens":8544,"sell_daily_usd":1654,"payback_sell_days":107,"payback_hold_days":137,"hold_value_now":1916,"hold_peak_usd":2042,"hold_peak_date":"2026-08-23","days_elapsed":587},{"cohort":"2025-07 (12/d)","start":"2025-07-01","tokens":4776,"sell_daily_usd":732,"payback_sell_days":402,"payback_hold_days":337,"hold_value_now":1071,"hold_peak_usd":1136,"hold_peak_date":"2026-09-01","days_elapsed":430},{"cohort":"2026-01 (12/d)","start":"2026-01-01","tokens":2568,"sell_daily_usd":397,"payback_sell_days":null,"payback_hold_days":null,"hold_value_now":576,"hold_peak_usd":609,"hold_peak_date":"2026-09-01","days_elapsed":246},{"cohort":"2026-07 (6/d)","start":"2026-07-01","tokens":396,"sell_daily_usd":82,"payback_sell_days":null,"payback_hold_days":null,"hold_value_now":89,"hold_peak_usd":90,"hold_peak_date":"2026-09-01","days_elapsed":65}],"ath":["2025-01-26",0.3731418054665675],"low":["2025-10-12",0.10265410169330258],"now":["2026-09-04",0.22421114612636003],"supply":[{"label":"2024-06","price":0.202,"inv":0.0,"team":0.0,"eco":2.08,"ven":0.75,"pub":0.0,"mine":8.57,"burn":0.3,"total":11.4,"cover":2.6},{"label":"2025-01","price":0.312,"inv":10.42,"team":0.0,"eco":2.08,"ven":0.75,"pub":0.0,"mine":6.73,"burn":0.64,"total":19.98,"cover":3.2},{"label":"2025-10","price":0.139,"inv":10.42,"team":5.21,"eco":2.08,"ven":0.75,"pub":0.0,"mine":6.27,"burn":2.71,"total":24.73,"cover":11.0},{"label":"2026-09","price":0.216,"inv":10.42,"team":5.21,"eco":2.08,"ven":0.75,"pub":1.67,"mine":3.44,"burn":2.26,"total":23.57,"cover":9.6}],"fund":[{"q":"Q4'24","stations":10000,"rev":null,"price":0.238,"i_st":71,"i_rev":null,"i_px":92},{"q":"Q1'25","stations":14000,"rev":812,"price":0.258,"i_st":100,"i_rev":100,"i_px":100},{"q":"Q2'25","stations":19000,"rev":963,"price":0.146,"i_st":136,"i_rev":119,"i_px":57},{"q":"Q3'25","stations":20500,"rev":1200,"price":0.157,"i_st":146,"i_rev":148,"i_px":61},{"q":"Q4'25","stations":21000,"rev":1240,"price":0.14,"i_st":150,"i_rev":153,"i_px":54},{"q":"Q1'26","stations":21500,"rev":1800,"price":0.14,"i_st":154,"i_rev":222,"i_px":54},{"q":"Q3'26","stations":22500,"rev":null,"price":0.216,"i_st":161,"i_rev":null,"i_px":84}]};
const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const charts = [];
function tokens(){ return {ink:css('--ink'),ink2:css('--ink-2'),muted:css('--muted'),grid:css('--grid'),axis:css('--axis'),surface:css('--surface'),
  s1:css('--s1'),s2:css('--s2'),s3:css('--s3'),s4:css('--s4'),s5:css('--s5'),s6:css('--s6'),s7:css('--s7'),s8:css('--s8')}; }
function fmtUsd(v){ return '$'+Number(v).toFixed(v<1?3:2); }

const EVENTS = [
  {d:'2023-09-07',l:'TGE',k:'d'},
  {d:'2024-06-30',l:'반감 48→24',k:'s'},
  {d:'2024-12-28',l:'투자자 언락 시작',k:'s'},
  {d:'2025-01-26',l:'ATH $0.373',k:'d'},
  {d:'2025-06-28',l:'팀 언락 시작 · 반감 24→12',k:'s'},
  {d:'2025-10-12',l:'저점 $0.103',k:'d'},
  {d:'2025-12-28',l:'퍼블릭 언락',k:'s'},
  {d:'2026-06-23',l:'코인베이스',k:'d'},
  {d:'2026-06-30',l:'반감 12→6',k:'s'},
  {d:'2026-07-27',l:'업비트·빗썸',k:'d'},
];
const eventPlugin = {
  id:'events',
  afterDatasetsDraw(chart){
    const {ctx, chartArea:{top,bottom}, scales:{x}} = chart; const t = tokens();
    const labels = chart.data.labels; if(!chart.options.showEvents) return;
    ctx.save(); ctx.font = '11px '+css('--mono'); ctx.textAlign='left';
    let lane=0;
    EVENTS.forEach(ev=>{
      let idx = labels.findIndex(l=>l>=ev.d); if(idx<0) return;
      const px = x.getPixelForValue(idx);
      const col = ev.k==='s'? t.s8 : t.s3;
      ctx.strokeStyle = col; ctx.globalAlpha = .55; ctx.setLineDash([3,3]); ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(px,top); ctx.lineTo(px,bottom); ctx.stroke(); ctx.setLineDash([]);
      ctx.globalAlpha = 1; ctx.fillStyle = t.ink2;
      const y = top + 12 + (lane%4)*14; lane++;
      const w = ctx.measureText(ev.l).width;
      const lx = (px + 6 + w > chart.chartArea.right) ? px - w - 6 : px + 6;
      ctx.fillStyle = t.surface; ctx.fillRect(lx-2, y-9, w+4, 12);
      ctx.fillStyle = t.ink2; ctx.fillText(ev.l, lx, y);
    });
    ctx.restore();
  }
};
Chart.register(eventPlugin);

function baseOpts(t, extra){
  return Object.assign({
    responsive:true, maintainAspectRatio:false, animation:false,
    interaction:{mode:'index',intersect:false},
    plugins:{legend:{display:false}, tooltip:{backgroundColor:t.surface,titleColor:t.ink,bodyColor:t.ink2,borderColor:t.axis,borderWidth:1,padding:10,titleFont:{family:css('--mono'),size:11},bodyFont:{family:css('--mono'),size:12}}},
    scales:{x:{grid:{display:false},border:{color:t.axis},ticks:{color:t.muted,font:{family:css('--mono'),size:11},maxRotation:0,autoSkip:true,maxTicksLimit:9}},
            y:{grid:{color:t.grid},border:{display:false},ticks:{color:t.muted,font:{family:css('--mono'),size:11}}}}
  }, extra||{});
}

function build(){
  charts.forEach(c=>c.destroy()); charts.length=0;
  const t = tokens(); Chart.defaults.font.family = css('--sans'); Chart.defaults.color = t.muted;
  const W = DATA.weekly; const labels = W.map(r=>r[0]);

  // 1. price with events
  charts.push(new Chart(document.getElementById('cPrice'), {type:'line',
    data:{labels, datasets:[{label:'GEOD',data:W.map(r=>r[1]),borderColor:t.s1,backgroundColor:t.s1+'22',fill:true,borderWidth:2,pointRadius:0,pointHoverRadius:4,tension:.15}]},
    options:baseOpts(t,{showEvents:true, plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>' '+fmtUsd(c.parsed.y)}}},
      scales:{x:{grid:{display:false},border:{color:t.axis},ticks:{color:t.muted,font:{family:css('--mono'),size:11},maxRotation:0,autoSkip:true,maxTicksLimit:9,callback:(v,i)=>labels[i].slice(0,7)}},
              y:{grid:{color:t.grid},border:{display:false},min:0,ticks:{color:t.muted,font:{family:css('--mono'),size:11},callback:v=>'$'+v.toFixed(2)}}}})
  }));

  // 2. fundamentals index
  const F = DATA.fund;
  charts.push(new Chart(document.getElementById('cFund'), {type:'line',
    data:{labels:F.map(f=>f.q), datasets:[
      {label:'활성 기기',data:F.map(f=>f.i_st),borderColor:t.s3,borderWidth:2,pointRadius:4,pointBackgroundColor:t.s3,tension:.2},
      {label:'분기 매출',data:F.map(f=>f.i_rev),borderColor:t.s2,borderWidth:2,pointRadius:4,pointBackgroundColor:t.s2,tension:.2,spanGaps:true},
      {label:'토큰 가격',data:F.map(f=>f.i_px),borderColor:t.s1,borderWidth:2,pointRadius:4,pointBackgroundColor:t.s1,tension:.2}]},
    options:baseOpts(t,{plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>' '+c.dataset.label+': '+(c.parsed.y==null?'—':c.parsed.y)}}},
      scales:{x:{grid:{display:false},border:{color:t.axis},ticks:{color:t.muted,font:{family:css('--mono'),size:11}}},y:{grid:{color:t.grid},border:{display:false},ticks:{color:t.muted,font:{family:css('--mono'),size:11}}}}})
  }));

  // 3. supply stacked vs burn
  const S = DATA.supply;
  charts.push(new Chart(document.getElementById('cSupply'), {type:'bar',
    data:{labels:S.map(s=>s.label), datasets:[
      {label:'투자자 언락',data:S.map(s=>s.inv),backgroundColor:t.s7,stack:'a'},
      {label:'팀 언락',data:S.map(s=>s.team),backgroundColor:t.s5,stack:'a'},
      {label:'생태계',data:S.map(s=>s.eco),backgroundColor:t.s4,stack:'a'},
      {label:'벤더·퍼블릭',data:S.map(s=>+(s.ven+s.pub).toFixed(2)),backgroundColor:t.s3,stack:'a'},
      {label:'채굴 방출',data:S.map(s=>s.mine),backgroundColor:t.s1,stack:'a',borderRadius:{topLeft:4,topRight:4},borderSkipped:false},
      {label:'소각',data:S.map(s=>s.burn),backgroundColor:t.s8,stack:'b',borderRadius:{topLeft:4,topRight:4},borderSkipped:false}]},
    options:baseOpts(t,{plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>' '+c.dataset.label+': '+c.parsed.y.toFixed(2)+'M',footer:items=>{const s=S[items[0].dataIndex];return '총 공급 '+s.total+'M · 소각 커버 '+s.cover+'% · 가격 $'+s.price;}}}},
      scales:{x:{grid:{display:false},border:{color:t.axis},ticks:{color:t.muted,font:{family:css('--mono'),size:11}},stacked:true},
              y:{grid:{color:t.grid},border:{display:false},stacked:true,ticks:{color:t.muted,font:{family:css('--mono'),size:11},callback:v=>v+'M'}}},
      datasets:{bar:{borderColor:t.surface,borderWidth:{top:2,bottom:0,left:0,right:0},barPercentage:.7,categoryPercentage:.7}}})
  }));

  // 4. cohorts
  const C = DATA.cohorts; const MAX = 700;
  const cohortLabelPlugin = {id:'clab', afterDatasetsDraw(chart){
    const {ctx, scales:{x,y}} = chart; const tt=tokens(); ctx.save(); ctx.font='11px '+css('--mono'); ctx.fillStyle=tt.ink2; ctx.textBaseline='middle';
    chart.data.datasets.forEach((ds,di)=>{ ds.raw.forEach((v,i)=>{ const meta=chart.getDatasetMeta(di); const bar=meta.data[i]; if(!bar) return;
      const txt = v==null ? '미회수 ('+ds.elapsed[i]+'일 경과)' : v+'일'; ctx.fillText(txt, bar.x+6, bar.y); }); });
    ctx.restore(); }};
  charts.push(new Chart(document.getElementById('cCohort'), {type:'bar', plugins:[cohortLabelPlugin],
    data:{labels:C.map(c=>c.cohort), datasets:[
      {label:'보유',raw:C.map(c=>c.payback_hold_days),elapsed:C.map(c=>c.days_elapsed),data:C.map(c=>c.payback_hold_days??0),backgroundColor:t.s1,borderRadius:{topRight:4,bottomRight:4},borderSkipped:false},
      {label:'매일 매도',raw:C.map(c=>c.payback_sell_days),elapsed:C.map(c=>c.days_elapsed),data:C.map(c=>c.payback_sell_days??0),backgroundColor:t.s2,borderRadius:{topRight:4,bottomRight:4},borderSkipped:false}]},
    options:baseOpts(t,{indexAxis:'y', plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>' '+c.dataset.label+': '+(c.dataset.raw[c.dataIndex]==null?'미회수':c.parsed.x+'일')}}},
      scales:{x:{grid:{color:t.grid},border:{display:false},max:MAX,ticks:{color:t.muted,font:{family:css('--mono'),size:11},callback:v=>v+'일'}},
              y:{grid:{display:false},border:{color:t.axis},ticks:{color:t.ink2,font:{family:css('--mono'),size:11.5}}}},
      datasets:{bar:{barPercentage:.8,categoryPercentage:.72,borderColor:t.surface,borderWidth:{right:0,left:0,top:1,bottom:1}}}})
  }));

  // 5. GEOD vs BTC indexed (log)
  const g0=W[0][1], b0=W[0][2];
  charts.push(new Chart(document.getElementById('cBtc'), {type:'line',
    data:{labels, datasets:[
      {label:'GEOD',data:W.map(r=>+(r[1]/g0*100).toFixed(1)),borderColor:t.s1,borderWidth:2,pointRadius:0,tension:.15},
      {label:'BTC',data:W.map(r=>+(r[2]/b0*100).toFixed(1)),borderColor:t.s2,borderWidth:2,pointRadius:0,tension:.15}]},
    options:baseOpts(t,{plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>' '+c.dataset.label+': '+c.parsed.y}}},
      scales:{x:{grid:{display:false},border:{color:t.axis},ticks:{color:t.muted,font:{family:css('--mono'),size:11},maxRotation:0,autoSkip:true,maxTicksLimit:7,callback:(v,i)=>labels[i].slice(0,7)}},
              y:{type:'logarithmic',grid:{color:t.grid},border:{display:false},min:50,ticks:{color:t.muted,font:{family:css('--mono'),size:11},callback:v=>[50,100,200,400,800,1000].includes(v)?v:null}}}})
  }));

  // 6. allocation comparison (100% stacked, horizontal)
  const ALLOC = {
    labels:['GEODNET (10억)','웰비안 덱 (100억)'],
    series:[
      {label:'노드 리워드',color:t.s1,data:[35,46]},
      {label:'투자자',color:t.s7,data:[25,5]},
      {label:'팀',color:t.s5,data:[25,6]},
      {label:'생태계 · 벤더',color:t.s4,data:[13,5]},
      {label:'유동성 · LP',color:t.s3,data:[0,13]},
      {label:'퍼블릭 · 기타',color:t.s6,data:[2,0]},
      {label:'소각 예정',color:t.s8,data:[0,25]}]
  };
  const allocLabel = {id:'alab', afterDatasetsDraw(chart){
    const {ctx} = chart; const tt=tokens(); ctx.save(); ctx.font='11px '+css('--mono'); ctx.textAlign='center'; ctx.textBaseline='middle';
    chart.data.datasets.forEach((ds,di)=>{ const meta=chart.getDatasetMeta(di); meta.data.forEach((bar,i)=>{ const v=ds.data[i]; if(v<5) return;
      const w=Math.abs(bar.x-bar.base); if(w<26) return; ctx.fillStyle='#ffffff'; ctx.fillText(v+'%', bar.base+(bar.x-bar.base)/2, bar.y); }); });
    ctx.restore(); }};
  charts.push(new Chart(document.getElementById('cAlloc'), {type:'bar', plugins:[allocLabel],
    data:{labels:ALLOC.labels, datasets:ALLOC.series.map((s,i)=>({label:s.label,data:s.data,backgroundColor:s.color,stack:'a',
      borderColor:t.surface,borderWidth:{left:0,right:2,top:0,bottom:0},borderSkipped:false,
      borderRadius:i===ALLOC.series.length-1?{topRight:4,bottomRight:4}:0}))},
    options:baseOpts(t,{indexAxis:'y', plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>' '+c.dataset.label+': '+c.parsed.x+'%'}}},
      scales:{x:{stacked:true,max:100,grid:{color:t.grid},border:{display:false},ticks:{color:t.muted,font:{family:css('--mono'),size:11},stepSize:25,callback:v=>v+'%'}},
              y:{stacked:true,grid:{display:false},border:{color:t.axis},ticks:{color:t.ink2,font:{family:css('--mono'),size:12}}}},
      datasets:{bar:{barPercentage:.6,categoryPercentage:.8}}})
  }));
}

// cohort table
(function(){
  const tb = document.getElementById('cohortRows'); const C = DATA.cohorts;
  const note = {0:'토큰 판매 불가 기간 14개월 포함',2:'TGE 당일 진입 — 사실상 제네시스',5:'ATH 당일 진입 — 최악의 타이밍에도 회수',8:'현재 조건(6/일)'};
  C.forEach((c,i)=>{
    const tr=document.createElement('tr'); if(i===2||i===8) tr.className='hl';
    const f=(v)=>v==null?'<span class="na">미회수</span>':v+'일';
    tr.innerHTML=`<td>${c.cohort}</td><td class="num">${c.tokens.toLocaleString()}</td><td class="num">${f(c.payback_hold_days)}</td><td class="num">${f(c.payback_sell_days)}</td><td class="num">$${c.hold_value_now.toLocaleString()}</td><td class="num">$${c.hold_peak_usd.toLocaleString()} <span class="na">(${c.hold_peak_date.slice(0,7)})</span></td><td>${note[i]||''}</td>`;
    tb.appendChild(tr);
  });
})();

document.fonts ? document.fonts.ready.then(build) : build();
const mq = matchMedia('(prefers-color-scheme: dark)'); mq.addEventListener && mq.addEventListener('change', build);
new MutationObserver(build).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
