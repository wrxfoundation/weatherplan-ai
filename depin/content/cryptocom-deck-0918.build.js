const pptxgen = require("pptxgenjs");
const p = new pptxgen();
p.layout = "LAYOUT_WIDE";            // 13.33 x 7.5
p.author = "KWeather"; p.company = "KWeather";
p.title = "Weather Data Market - Deep Dive";

const INK="16283A", MUTE="5E7488", DARK="0E1A26", PAPER="FFFFFF",
      CARD="EFF3F6", LINE="D6DEE5", AMBER="C77A1E", TEAL="1F7A6B", SLATE="5E7488",
      ONDARK="F2F6F9", ONDARKMUTE="93A7B8";
const F="Arial";

const T=(s,t,o)=>s.addText(t,Object.assign({fontFace:F,isTextBox:true,margin:0},o));
const chip=(s,x,y,w,txt,col,fill)=>{
  s.addShape(p.ShapeType.roundRect,{x,y,w,h:0.38,fill:{color:fill},line:{color:col,width:1},rectRadius:0.19});
  T(s,txt,{x,y:y+0.055,w,h:0.28,fontSize:12,bold:true,color:col,align:"center"});
};
const title=(s,txt,sub)=>{
  T(s,txt,{x:0.7,y:0.52,w:12,h:0.62,fontSize:32,bold:true,color:INK});
  if(sub) T(s,sub,{x:0.7,y:1.16,w:12,h:0.34,fontSize:14,color:MUTE});
};

/* 1 — cover */
{const s=p.addSlide(); s.background={color:DARK};
 T(s,"WEATHER DATA MARKET   ·   KWEATHER",{x:0.8,y:1.5,w:11,h:0.3,fontSize:12,bold:true,color:AMBER,charSpacing:2});
 T(s,"We sell determinations,\nnot weather data.",{x:0.8,y:2.0,w:11.5,h:1.9,fontSize:44,bold:true,color:ONDARK,lineSpacing:52});
 T(s,"A deep dive for the Crypto.com product team",{x:0.8,y:4.0,w:11,h:0.36,fontSize:16,color:ONDARKMUTE});
 const y=4.85;
 chip(s,0.8,y,1.5,"met",TEAL,"12241F"); chip(s,2.45,y,1.8,"not_met",SLATE,"16212B"); chip(s,4.4,y,1.8,"withheld",AMBER,"241A0E");
 T(s,"Every answer is one of these three — and the third one is the point.",{x:6.5,y:y+0.06,w:6,h:0.3,fontSize:12,color:ONDARKMUTE});
 T(s,"18 September 2026",{x:0.8,y:6.5,w:5,h:0.3,fontSize:11,color:ONDARKMUTE});
 s.addNotes("Open with the one-line definition. 90 seconds. Do not start with the company.");}

/* 2 — who builds this */
{const s=p.addSlide(); s.background={color:PAPER};
 title(s,"Who builds this","Two companies, two roles — and one layer that is not today's subject.");
 const cy=1.85, ch=2.5;
 s.addShape(p.ShapeType.rect,{x:0.7,y:cy,w:5.9,h:ch,fill:{color:CARD},line:{color:LINE,width:1}});
 s.addShape(p.ShapeType.rect,{x:6.85,y:cy,w:5.75,h:ch,fill:{color:PAPER},line:{color:LINE,width:1}});
 T(s,"KWeather",{x:1.0,y:cy+0.28,w:5.3,h:0.4,fontSize:22,bold:true,color:INK});
 T(s,"Seoul.",{x:1.0,y:cy+0.72,w:5.3,h:0.28,fontSize:12,color:MUTE});
 T(s,[{text:"30 years of weather measurement, supplying 3,500+ enterprise clients in Korea.",options:{breakLine:true}},
      {text:"The data provider and the contracting party.",options:{bold:true}}],
   {x:1.0,y:cy+1.05,w:5.3,h:1.2,fontSize:14,color:INK,lineSpacing:20});
 T(s,"Wellbian Labs",{x:7.15,y:cy+0.28,w:5.2,h:0.4,fontSize:22,bold:true,color:INK});
 T(s,"Singapore.",{x:7.15,y:cy+0.72,w:5.2,h:0.28,fontSize:12,color:MUTE});
 T(s,[{text:"Builds and operates the platform under delegation.",options:{breakLine:true}},
      {text:"Not a party to your contract.",options:{bold:true}}],
   {x:7.15,y:cy+1.05,w:5.2,h:1.2,fontSize:14,color:INK,lineSpacing:20});
 T(s,"Old company, new territory.",{x:0.7,y:4.65,w:6,h:0.42,fontSize:20,bold:true,italic:true,color:AMBER});
 s.addShape(p.ShapeType.rect,{x:0.7,y:5.35,w:11.9,h:1.15,fill:{color:"FBF6EE"},line:{color:"E8D9C2",width:1}});
 T(s,"One thing to set aside",{x:1.0,y:5.55,w:3.2,h:0.28,fontSize:12,bold:true,color:AMBER});
 T(s,"The wellbian device network — consumer-owned indoor air sensors — is a separate layer. It is not a source for this product, and not today's subject.",
   {x:1.0,y:5.85,w:11.3,h:0.5,fontSize:13,color:INK});
 s.addNotes("If they ask 'weren't you XRPL?' — that is the device layer. Split it here before they find it on the site.");}

/* 3 — the problem */
{const s=p.addSlide(); s.background={color:PAPER};
 title(s,"Why would the losing side accept this number?","Settlement doesn't need the most accurate value. It needs one nobody can reopen.");
 const rows=[["01","Nothing to verify","Most weather APIs are 'it is so because we say so.' After settlement, the losing side asks where the number came from — and there is a screenshot."],
             ["02","A single point of failure","One observation point per city. If it drops, drifts, or spikes, the settlement moves with it. That is most of the market."],
             ["03","Shaped for humans","Sign-up, API-key issuance, sales approval. A settlement bot cannot onboard itself."]];
 let y=1.95;
 rows.forEach(([n,h,b])=>{
   s.addShape(p.ShapeType.ellipse,{x:0.75,y:y+0.04,w:0.52,h:0.52,fill:{color:INK}});
   T(s,n,{x:0.75,y:y+0.17,w:0.52,h:0.28,fontSize:13,bold:true,color:PAPER,align:"center"});
   T(s,h,{x:1.5,y:y,w:3.3,h:0.36,fontSize:17,bold:true,color:INK});
   T(s,b,{x:4.9,y:y+0.02,w:7.7,h:0.9,fontSize:13,color:MUTE,lineSpacing:18});
   y+=1.32;});
 s.addShape(p.ShapeType.rect,{x:0.7,y:5.95,w:11.9,h:0.85,fill:{color:INK}});
 T(s,"So our claim is not accuracy. It is that being wrong doesn't move the result.",
   {x:1.1,y:6.2,w:11.1,h:0.36,fontSize:17,bold:true,color:ONDARK});
 s.addNotes("Spend real time here. If they nod at this slide, the rest lands.");}

/* 4 — how it's made */
{const s=p.addSlide(); s.background={color:PAPER};
 title(s,"How one determination is made","Hourly. 167 cities, 90 countries.");
 const steps=[["1","Collect","11 independent sources — national and international weather services, live airport observations, and KWeather's own network. Independent bodies rarely fail together."],
              ["2","Take the middle","The median, not the mean. One wild value drags a mean; the middle stays the middle."],
              ["3","Drop the outliers","MAD screening. Half the sources can be wrong at once and the result does not move. Thresholds are private and fixed per version."],
              ["4","Check against reality","The consensus is matched to actual observations and graded: verified / single_source / mixed / mismatch / unverified. The grade ships with the answer."],
              ["5","Leave a fingerprint","Canonical JSON, SHA-256, anchored on-chain. Raw data never goes on chain. Anyone can recompute the hash themselves."]];
 const w=2.28, gap=0.19; let x=0.7;
 steps.forEach(([n,h,b])=>{
   s.addShape(p.ShapeType.rect,{x,y:1.95,w,h:3.35,fill:{color:CARD},line:{color:LINE,width:1}});
   s.addShape(p.ShapeType.ellipse,{x:x+0.22,y:2.18,w:0.44,h:0.44,fill:{color:AMBER}});
   T(s,n,{x:x+0.22,y:2.29,w:0.44,h:0.26,fontSize:13,bold:true,color:PAPER,align:"center"});
   T(s,h,{x:x+0.22,y:2.76,w:w-0.44,h:0.62,fontSize:15,bold:true,color:INK,lineSpacing:19});
   T(s,b,{x:x+0.22,y:3.44,w:w-0.44,h:1.7,fontSize:11,color:MUTE,lineSpacing:15});
   x+=w+gap;});
 s.addShape(p.ShapeType.rect,{x:0.7,y:5.55,w:11.9,h:1.25,fill:{color:PAPER},line:{color:LINE,width:1}});
 T(s,"Proving the computation itself — Flare FCC",{x:1.0,y:5.75,w:6,h:0.3,fontSize:13,bold:true,color:INK});
 T(s,"The attestation path is implemented and verified end to end on testnet: forged signatures are rejected, replays are rejected. What remains is the switch from a test key to a production enclave.",
   {x:1.0,y:6.08,w:11.3,h:0.55,fontSize:12,color:MUTE,lineSpacing:16});
 s.addNotes("One sentence to memorise: eleven independent sources, hourly, screened so half can fail, matched to reality, fingerprinted on chain.");}

/* 5 — met / not_met / withheld */
{const s=p.addSlide(); s.background={color:PAPER};
 title(s,"met  /  not_met  /  withheld","You define the condition: city, metric, operator, threshold, UTC hour. One of three answers comes back.");
 const cards=[["met","The condition is true.",TEAL,"F1F8F6"],
              ["not_met","The condition is false.",SLATE,"F2F5F7"],
              ["withheld","We do not rule.",AMBER,"FBF6EE"]];
 let x=0.7; const w=3.93, gap=0.2;
 cards.forEach(([h,b,c,f])=>{
   s.addShape(p.ShapeType.rect,{x,y:1.95,w,h:1.55,fill:{color:f},line:{color:LINE,width:1}});
   chip(s,x+0.3,2.2,1.85,h,c,PAPER);
   T(s,b,{x:x+0.3,y:2.78,w:w-0.6,h:0.5,fontSize:14,color:INK});
   x+=w+gap;});
 T(s,"withheld is not a failure. It is a result.",{x:0.7,y:3.8,w:11.9,h:0.4,fontSize:20,bold:true,color:INK});
 T(s,"When the sources disagree or the reality check comes back wrong, we do not force a pick. We say that hour cannot carry a settlement.",
   {x:0.7,y:4.22,w:11.9,h:0.56,fontSize:14,color:MUTE,lineSpacing:19});
 s.addShape(p.ShapeType.rect,{x:0.7,y:4.86,w:11.9,h:1.08,fill:{color:INK}});
 T(s,"One wrong settlement costs more than a hundred withholds.",{x:1.1,y:5.04,w:11.1,h:0.34,fontSize:17,bold:true,color:ONDARK});
 T(s,"Being able to withhold means every met and not_met we publish is one we could have withheld and didn't. A system that always answers cannot tell you that.",
   {x:1.1,y:5.40,w:11.1,h:0.46,fontSize:12,color:ONDARKMUTE,lineSpacing:16});
 T(s,"For product design: withheld can be written into the contract in advance as a void-or-defer condition — so a dispute is handled by rule before it happens, not by a person after it.",
   {x:0.7,y:6.14,w:11.9,h:0.6,fontSize:13,color:INK,lineSpacing:17});
 s.addNotes("This is the slide to push. Never call withheld a failure.");}

/* 6 — agent native */
{const s=p.addSlide(); s.background={color:PAPER};
 title(s,"An agent can buy this without a human","No sign-up. No API-key issuance. No sales approval.");
 s.addShape(p.ShapeType.rect,{x:0.7,y:2.0,w:5.9,h:3.0,fill:{color:CARD},line:{color:LINE,width:1}});
 T(s,"What isn't there",{x:1.0,y:2.25,w:5.3,h:0.32,fontSize:15,bold:true,color:INK});
 T(s,[{text:"An account to register",options:{bullet:true,breakLine:true}},
      {text:"A key-issuance flow to wait on",options:{bullet:true,breakLine:true}},
      {text:"A person to approve the request",options:{bullet:true}}],
   {x:1.15,y:2.7,w:5.1,h:1.5,fontSize:14,color:INK,paraSpaceAfter:10});
 T(s,"A settlement bot can be our direct customer.",{x:1.0,y:4.35,w:5.3,h:0.4,fontSize:14,bold:true,color:AMBER});
 s.addShape(p.ShapeType.rect,{x:6.85,y:2.0,w:5.75,h:3.0,fill:{color:PAPER},line:{color:LINE,width:1}});
 T(s,"What happens instead",{x:7.15,y:2.25,w:5.2,h:0.32,fontSize:15,bold:true,color:INK});
 const fl=[["Call without credit","HTTP 402 Payment Required"],["Read the response","It states what to pay, and where"],["Top up and retry","The agent does this itself"]];
 let fy=2.72;
 fl.forEach(([a,b],i)=>{
   s.addShape(p.ShapeType.roundRect,{x:7.15,y:fy,w:5.2,h:0.62,fill:{color:CARD},line:{color:LINE,width:1},rectRadius:0.08});
   T(s,a,{x:7.35,y:fy+0.08,w:4.8,h:0.26,fontSize:13,bold:true,color:INK});
   T(s,b,{x:7.35,y:fy+0.33,w:4.8,h:0.24,fontSize:11,color:MUTE});
   fy+=0.78;});
 s.addShape(p.ShapeType.rect,{x:0.7,y:5.4,w:11.9,h:0.95,fill:{color:INK}});
 T(s,"Your developers can price the integration from this slide alone. That is what we mean by buy-in.",
   {x:1.1,y:5.72,w:11.1,h:0.36,fontSize:16,bold:true,color:ONDARK});
 s.addNotes("The product team usually reacts hardest to this one.");}

/* 7 — today / not yet */
{const s=p.addSlide(); s.background={color:PAPER};
 title(s,"What works today, and what doesn't","We would rather say this ourselves than have you find it.");
 const live=["Eleven-source collection and consensus — hourly, 167 cities","Reality-check grading shipped with every answer","Canonical JSON, SHA-256, on-chain anchor — mainnet","Subscriptions, metering and agent self-top-up — live payments","The purchase buttons on the site are real"];
 const not=["Flare FCC: implemented and verified on testnet. Forged signatures rejected, replays rejected. Remaining: test key to production enclave","Coverage density — more cities, more points per city. This is a schedule ahead of us, not a gap behind us"];
 s.addShape(p.ShapeType.rect,{x:0.7,y:2.0,w:6.4,h:4.2,fill:{color:"F1F8F6"},line:{color:LINE,width:1}});
 chip(s,1.0,2.25,1.55,"LIVE NOW",TEAL,PAPER);
 let ly=2.95;
 live.forEach(t=>{T(s,t,{x:1.0,y:ly,w:5.8,h:0.62,fontSize:13,color:INK,lineSpacing:17,bullet:true}); ly+=0.66;});
 s.addShape(p.ShapeType.rect,{x:7.35,y:2.0,w:5.25,h:4.2,fill:{color:"FBF6EE"},line:{color:LINE,width:1}});
 chip(s,7.65,2.25,1.55,"NOT YET",AMBER,PAPER);
 let ny=2.95;
 not.forEach(t=>{T(s,t,{x:7.65,y:ny,w:4.65,h:1.5,fontSize:13,color:INK,lineSpacing:17,bullet:true}); ny+=1.6;});
 T(s,"The wellbian device network is a separate layer and not a source for this product.",
   {x:0.7,y:6.45,w:11.9,h:0.32,fontSize:12,italic:true,color:MUTE});
 s.addNotes("Say the FCC line exactly as written. Do not soften it and do not oversell it.");}

/* 8 — next */
{const s=p.addSlide(); s.background={color:DARK};
 T(s,"What would be useful from Friday",{x:0.8,y:1.5,w:11.5,h:0.7,fontSize:34,bold:true,color:ONDARK});
 const items=[["Run it","Your team has the account. Point it at a condition you actually settle and see what comes back."],
              ["Tell us where it breaks","One line per place you get stuck is worth more to us than a long document."],
              ["Then the commercial shape","Pricing and structure belong in the next conversation, not this one."]];
 let y=2.6;
 items.forEach(([h,b],i)=>{
   s.addShape(p.ShapeType.ellipse,{x:0.8,y:y+0.03,w:0.5,h:0.5,fill:{color:AMBER}});
   T(s,String(i+1),{x:0.8,y:y+0.15,w:0.5,h:0.26,fontSize:13,bold:true,color:DARK,align:"center"});
   T(s,h,{x:1.55,y:y,w:3.4,h:0.36,fontSize:18,bold:true,color:ONDARK});
   T(s,b,{x:5.1,y:y+0.03,w:7.4,h:0.62,fontSize:14,color:ONDARKMUTE,lineSpacing:19});
   y+=1.1;});
 s.addShape(p.ShapeType.rect,{x:0.8,y:6.05,w:11.7,h:0.02,fill:{color:"2A3D4E"},line:{color:"2A3D4E",width:0}});
 T(s,"The full technical documentation is on the site if your team wants the detail behind any of this.",
   {x:0.8,y:6.3,w:11.7,h:0.32,fontSize:12,color:ONDARKMUTE});
 s.addNotes("Close by asking what they want to see next. Write it down. Do not promise anything commercial.");}

p.writeFile({fileName:"cryptocom-deck-0918.pptx"}).then(f=>console.log("wrote",f));
