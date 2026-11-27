// ═══════════════════════════════════════════════════════════════
// RAKİP ANALİZİ — OYUN KİMLİKLERİ, SCOUT RAPORU & TAKTİK EŞLEŞMESİ
// ═══════════════════════════════════════════════════════════════
// Her rakibin deterministik bir oyun kimliği var (kayıt gerektirmez).
// Taktiğin bu kimliğe uyumu calcTacticBonus'a en fazla ±3 ekler.
const TEAM_STYLES={
  pres:  {l:"Yüksek Pres",       icon:"⚡", col:"#ff7a45",
    desc:"Rakip sahada agresif baskı yapar, geriden oyun kurmana izin vermez.",
    tip:"Uzun top ve Hızlı Kontra ile presi atla. Kısa pas ve rakip sahada baskı riskli."},
  kontra:{l:"Kontra Atak",       icon:"🏹", col:"#e8b83a",
    desc:"Topu sana bırakır, top kazanınca savunma arkasına hızlı koşu yapar.",
    tip:"Defans hattını geri çek, Orta Sahaya Baskı ve Oyunu Yavaşlat ile geçişleri kes. İleri hat ve yoğun kanat tehlikeli."},
  uzun:  {l:"Uzun Top & Fizik",  icon:"💪", col:"#a080ff",
    desc:"Hava toplarına ve ikinci toplara oynar, fiziksel mücadeleyi sever.",
    tip:"Kısa pasla topu yerde tut, Set Pres ile uzun topun kaynağını boğ. Geri hat güvenli."},
  topa:  {l:"Topa Sahip Olma",   icon:"🔁", col:"#4da6ff",
    desc:"Sabırlı kısa paslarla oyunu kontrol eder, topu kaptırmamaya çalışır.",
    tip:"Yüksek baskı, rakip sahada pres ve Set Pres ile ritmini boz; top kazanınca Hızlı Kontra."},
  blok:  {l:"Katı Savunma",      icon:"🧱", col:"#30c080",
    desc:"Derin ve kompakt bir blokla kalesini kapatır, boşluk vermez.",
    tip:"Kanatları kullan (İki Kanat), kısa pasla sabırlı ol, hattı ileri al. Kontra için boşluk yok."},
};
// Formasyona göre olası kimlikler (formasyonla tutarlı kalsın)
const STYLE_BY_FORMATION={
  "4-3-3":["pres","topa","pres"], "4-2-3-1":["topa","pres","kontra"],
  "4-4-2":["uzun","kontra","pres"], "4-1-4-1":["blok","topa","kontra"],
  "5-3-2":["blok","kontra","uzun"], "3-5-2":["kontra","uzun","topa"],
};
function scoutHash(s){
  let h=5381; const str=String(s||"");
  for(let i=0;i<str.length;i++) h=((h<<5)+h)^str.charCodeAt(i);
  return h>>>0;
}
// Takımın oyun kimliği: yalnızca isimden deterministik (güç değişse de sezon boyunca sabit).
// Tercih formasyonu bilinen takımlarda kimlik o formasyonla tutarlı seçilir.
function getTeamStyle(teamName, teamStr){
  const pref=TEAM_PREF_FORMATION[teamName];
  const opts=(pref&&STYLE_BY_FORMATION[pref])||Object.keys(TEAM_STYLES);
  return opts[scoutHash("style|"+teamName)%opts.length];
}
// Taktik ↔ rakip kimliği eşleşmesi: -3 ile +3 arası
function calcStyleMatch(tac, styleKey, amp=0){
  if(!styleKey||!TEAM_STYLES[styleKey]) return 0;
  const t=tac||{};
  const press=t.press??1, def=t.defLine??1, sty=t.style??0, wing=t.wing??1, zone=t.pressZone??0;
  let m=0;
  switch(styleKey){
    case "pres":
      if(sty===2) m+=2; else if(sty===0) m-=1;
      if(t.tog0) m+=1; if(t.tog3) m+=1;
      if(zone===2) m-=1;
      break;
    case "kontra":
      if(def===0) m+=1; else if(def===2) m-=2;
      if(t.tog5) m+=1; if(t.tog3) m+=1;
      if(zone===2) m-=1; if(wing===2) m-=1;
      break;
    case "uzun":
      if(def===0) m+=1; else if(def===2) m-=1;
      if(sty===0) m+=1; else if(sty===2) m-=1;
      if(t.tog1) m+=1; if(t.tog5) m+=1;
      break;
    case "topa":
      if(press===2) m+=1; else if(press===0) m-=1;
      if(zone===2) m+=1;
      if(t.tog1) m+=1; if(t.tog0) m+=1; if(t.tog3) m-=1;
      break;
    case "blok":
      if(wing===2) m+=1; if(t.tog4) m+=1;
      if(sty===0) m+=1; else if(sty===2) m-=1;
      if(def===2) m+=1;
      if(t.tog0) m-=1; if(t.tog3) m-=1;
      break;
  }
  if(m>0) m+=amp; // analist doğru taktiğin etkisini güçlendirir
  return Math.max(-3,Math.min(3,m));
}
// Scout isabeti: analist %100, taktik antrenörü %80, kimse yoksa %60
function getScoutAccuracy(coaches){
  const hired=(coaches||[]).filter(c=>c&&c.hired&&c.type==="team");
  const an=hired.find(c=>c.teamBonuses&&c.teamBonuses.scoutAcc);
  if(an) return {acc:Math.max(0,Math.min(100,an.teamBonuses.scoutAcc)),amp:an.teamBonuses.matchup||0,src:an.n};
  const tc=hired.find(c=>c.teamBonuses&&c.teamBonuses.tacticBonus);
  if(tc) return {acc:80,amp:0,src:tc.n};
  return {acc:60,amp:0,src:null};
}
// Scout raporu: trueStyle maç motorunda kullanılır, UI yalnızca shownStyle gösterir.
// seed (ör. fikstür haftası) aynı maç için raporu sabit tutar.
function getScoutReport(teamName, teamStr, coaches, seed=""){
  const trueStyle=getTeamStyle(teamName, teamStr);
  const {acc,amp,src}=getScoutAccuracy(coaches);
  let shownStyle=trueStyle;
  if(scoutHash("scout|"+teamName+"|"+seed)%100>=acc){
    const others=Object.keys(TEAM_STYLES).filter(k=>k!==trueStyle);
    shownStyle=others[scoutHash("alt|"+teamName+"|"+seed)%others.length];
  }
  return {trueStyle,shownStyle,acc,amp,src,formation:getRivalFormation(teamName, teamStr||70)};
}
function getDangerPlayer(db, teamName){
  const list=(db||[]).filter(p=>p&&p.club===teamName&&!p.injured);
  if(!list.length) return null;
  return list.reduce((b,p)=>(p.ovr||0)>(b.ovr||0)?p:b,list[0]);
}
const PREF_SKIP_PREMATCH_KEY="fcym_pref_skip_prematch"; // cihaz tercihi, kayıt dosyasına girmez

// Scout raporu kartı (Taktik sayfası + Maç Hazırlığı ekranında ortak)
function ScoutReportCard({opp, report, tactic, danger=null, compact=false}){
  if(!report) return null;
  const st=TEAM_STYLES[report.shownStyle];
  const match=calcStyleMatch(tactic, report.shownStyle, report.amp);
  const mCol=match>0?"#30e070":match<0?"#ff5050":"#7898c0";
  const mLbl=match>=2?"Çok uygun":match>0?"Uygun":match===0?"Nötr":match>-2?"Uyumsuz":"Ters taktik";
  const accCol=report.acc>=100?"#30e070":report.acc>=80?"#e8b83a":"#ff9050";
  return(
    <div style={{background:C.gradCard,
      borderRadius:8,padding:compact?"8px 10px":"10px 12px",border:`1px solid ${st.col}33`,marginBottom:12}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:6,marginBottom:6}}>
        <div style={{fontSize:".46rem",letterSpacing:1.2,color:C.dim,textTransform:"uppercase",fontWeight:700}}>
          🔎 Scout Raporu · {opp}
        </div>
        <div style={{fontSize:".4rem",fontWeight:700,color:accCol,background:`${accCol}15`,
          border:`1px solid ${accCol}35`,padding:"1px 6px",borderRadius:8,whiteSpace:"nowrap"}}>
          İsabet %{report.acc}
        </div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
        <div style={{fontSize:"1.2rem",lineHeight:1}}>{st.icon}</div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:".62rem",fontWeight:800,color:st.col}}>{st.l}</div>
          <div style={{fontSize:".44rem",color:C.dim,lineHeight:1.4}}>{st.desc}</div>
        </div>
        <div style={{textAlign:"center",flexShrink:0}}>
          <div style={{fontSize:".38rem",color:C.dmr}}>DİZİLİŞ</div>
          <div style={{fontSize:".56rem",fontWeight:800,color:C.wh}}>{report.formation}</div>
        </div>
      </div>
      {danger&&<div style={{fontSize:".46rem",color:C.red2,marginBottom:6}}>
        ⚠️ Tehlikeli oyuncu: <b>{danger.n}</b> ({danger.pos}, OVR {danger.ovr})
      </div>}
      {!compact&&<div style={{fontSize:".46rem",color:C.gd,lineHeight:1.5,marginBottom:6}}>💡 {st.tip}</div>}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
        padding:"5px 8px",borderRadius:6,background:`${mCol}12`,border:`1px solid ${mCol}30`}}>
        <span style={{fontSize:".46rem",color:C.dim}}>Taktik eşleşmesi</span>
        <span style={{fontSize:".54rem",fontWeight:900,color:mCol}}>{match>0?"+"+match:match} · {mLbl}</span>
      </div>
      {report.acc<100&&<div style={{fontSize:".4rem",color:C.dim,marginTop:5,fontStyle:"italic"}}>
        {report.src?`${report.src} raporu hazırladı.`:"Analist yok — rapor yanılıyor olabilir."} Tam isabet için Antrenman'dan Maç Analisti tut.
      </div>}
    </div>
  );
}

// Maç öncesi hazırlık ekranı
function PreMatchModal({fix, report, tactic, danger, myStr, onTactics, onStart, onClose, onSkipForever}){
  if(!fix||!report) return null;
  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,zIndex:900,background:"rgba(0,0,0,.78)",
      display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:420,maxHeight:"90vh",overflowY:"auto",
        background:C.gradCard,borderRadius:12,
        border:"1px solid rgba(77,166,255,.25)",boxShadow:"0 12px 40px rgba(0,0,0,.6)",padding:"14px 14px 12px"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
          <div style={{fontSize:".7rem",fontWeight:900,color:C.wh,letterSpacing:1}}>📋 MAÇ HAZIRLIĞI</div>
          <button onClick={onClose} style={{background:"none",border:"none",color:C.dim,
            fontSize:".9rem",cursor:"pointer",fontFamily:"inherit"}}>✕</button>
        </div>
        <div style={{fontSize:".5rem",color:C.dim,marginBottom:10}}>
          {fix.home?"🏠 Ev":"✈️ Deplasman"} · Rakip gücü <b style={{color:C.wh}}>{fix.str}</b> · Senin gücün <b style={{color:C.wh}}>{myStr}</b>
        </div>
        <ScoutReportCard opp={fix.opp} report={report} tactic={tactic} danger={danger}/>
        <div style={{display:"flex",gap:8}}>
          <button onClick={onTactics} style={{flex:1,padding:"10px 8px",borderRadius:8,cursor:"pointer",fontFamily:"inherit",
            background:"rgba(77,166,255,.12)",border:"1px solid rgba(77,166,255,.35)",color:C.ac2,
            fontSize:".58rem",fontWeight:800}}>⚙️ Taktiğe Git</button>
          <button onClick={onStart} style={{flex:1,padding:"10px 8px",borderRadius:8,cursor:"pointer",fontFamily:"inherit",
            background:"linear-gradient(135deg,#1ab855,#12883e)",border:"1px solid rgba(48,224,112,.5)",color:"#fff",
            fontSize:".58rem",fontWeight:900,letterSpacing:1}}>▶ MAÇA BAŞLA</button>
        </div>
        <button onClick={onSkipForever} style={{marginTop:10,width:"100%",background:"none",border:"none",cursor:"pointer",
          fontFamily:"inherit",fontSize:".42rem",color:C.dim,textDecoration:"underline"}}>
          Bu ekranı bir daha gösterme (Ayarlar'dan geri açılabilir)
        </button>
      </div>
    </div>
  );
}
