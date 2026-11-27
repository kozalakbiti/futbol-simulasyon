// ─── FORMASYON ────────────────────────────────────────────────
// ─── FORMASYON & TAKTİK (BİRLEŞİK) ──────────────────────────
// Mevki uyumluluk matrisi (yalnızca görsel vurgu; yerleştirme kuralı posPenalty'de kalır)
const POS_COMPAT_SECONDARY={
  GK:[], CB:["CDM","LB","RB"], LB:["CB","LM","RM","CDM"], RB:["CB","LM","RM","CDM"],
  CDM:["CM","CB","CAM"], CM:["CDM","CAM","LM","RM"], CAM:["CM","ST","LM","RM"],
  LM:["CAM","CM","ST","LB","RB"], RM:["CAM","CM","ST","LB","RB"], ST:["CAM","LM","RM"],
};
// PES tarzı mevki rozet rengi: GK sarı, defans mavi, orta saha yeşil, forvet kırmızı
function fmPesPosCol(p){
  if(p==="GK") return "#facc15";
  if(["CB","LB","RB","LWB","RWB","SW"].includes(p)) return "#3b82f6";
  if(["CDM","CM","CAM","LM","RM","DM","AM"].includes(p)) return "#22c55e";
  return "#ef4444";
}
function getPosCompatibility(playerPos,slotPos){
  if(playerPos===slotPos) return "primary";
  return (POS_COMPAT_SECONDARY[playerPos]||[]).includes(slotPos)?"secondary":"none";
}

function PageFormasyonTaktik({squad,coaches,formation,setFormation,lineup:startingXI,setLineup:setStartingXI,autoLineup,setAutoLineup,tactic,setTactic,nextFixture,myStr,initialTab="formasyon",onInitialTabUsed=()=>{}}){
  const [tab,setTab]=useState(initialTab==="taktik"?"taktik":"formasyon"); // "formasyon" | "taktik"
  const tacs=[
    {l:"Hücum Baskısı", key:"press",  opts:["Düşük","Orta","Yüksek"],  desc:["Savunma odaklı, top kaybı riski az","Dengeli baskı","Yüksek baskı, daha fazla top kazanımı ama riskli"]},
    {l:"Defans Hattı",  key:"defLine",opts:["Geri","Orta","İleri"],    desc:["Kompakt savunma, az boşluk","Dengeli","Yüksek hatlı savunma, hücum desteği ama ofsayt riski"]},
    {l:"Oyun Stili",   key:"style",  opts:["Kısa Pas","Karma","Uzun Top"],desc:["Topla oynama, OVR yüksekse avantaj","Karma oyun","Direkt oyun, fiziksel baskı"]},
    {l:"Kanat Kullanımı",key:"wing",  opts:["Az","Normal","Yoğun"],    desc:["Merkez odaklı","Dengeli kanat","Kanat hücumları yoğun, çapraz pas tehdidi"]},
    {l:"Baskı Alanı",  key:"pressZone",opts:["Kendi Saha","Orta Saha","Rakip Saha"],desc:["Düşük blok, defans ağırlıklı","Orta saha hakimiyeti","Yüksek press, zayıf rakibe karşı etkili"]},
  ];

  // ── Dinamik Maç Analizi ────────────────────────────────────
  const oppStr=nextFixture?nextFixture.str:70;
  const home=nextFixture?nextFixture.home:true;
  const opp=nextFixture?nextFixture.opp:"Rakip";
  const myS=myStr||74;
  const strDiff=myS-oppStr;

  // Taktik bileşenleri hesapla
  const pressVal=tactic.press??1;
  const defVal=tactic.defLine??1;
  const styleVal=tactic.style??0;
  const wingVal=tactic.wing??1;
  const zoneVal=tactic.pressZone??1;

  // Detaylı etki hesaplama
  const pressEffect=pressVal===2?(oppStr<70?+3:-2):pressVal===0?-1:0;
  const defEffect=defVal===2?(home?+2:-2):defVal===0?(home?-1:+1):0;
  const styleEffect=styleVal===0?+1:styleVal===2?-1:0;
  const wingEffect=wingVal===2?+2:wingVal===0?-1:0;
  const zoneEffect=zoneVal===2?(oppStr<72?+2:-3):zoneVal===0?-1:0;
  const tacticTotal=Math.max(-4,Math.min(6,pressEffect+defEffect+styleEffect+wingEffect+zoneEffect));

  // Antrenör taktik bonusu
  const tacCoach=(coaches||[]).find(c=>c.hired&&c.type==="team"&&c.teamBonuses&&c.teamBonuses.tacticBonus);
  const tacCoachBonus=tacCoach?(tacCoach.teamBonuses.tacticBonus||0):0;

  // Özel Talimat efektleri (görsel + hesap senkronik)
  const togEffects=[
    tactic.tog0?(oppStr>75?1:2):0,  // Hızlı Kontra
    tactic.tog1?1:0,                 // Set Pres
    tactic.tog2?(home?-1:1):0,       // Geri Çekil
    tactic.tog3?(oppStr>myS?1:-1):0, // Oyunu Yavaşlat
    tactic.tog4?(oppStr<72?2:1):0,   // İki Kanat
    tactic.tog5?1:0,                 // Orta Sahaya Baskı
  ];
  const togTotal=togEffects.reduce((a,b)=>a+b,0);
  // Rakip analizi: scout raporuna göre (menajerin bildiği kimlik) eşleşme etkisi
  const scoutReport=nextFixture?getScoutReport(nextFixture.opp,oppStr,coaches,nextFixture.w):null;
  const scoutMatch=scoutReport?calcStyleMatch(tactic,scoutReport.shownStyle,scoutReport.amp):0;
  useEffect(()=>{ if(initialTab==="taktik") onInitialTabUsed(); },[]);
  const totalEffect=tacticTotal+tacCoachBonus+togTotal+scoutMatch;

  const effStr=myS+totalEffect+(home?6:0);
  const winProb=Math.round(Math.max(8,Math.min(90,50+strDiff*1.8+totalEffect*3+(home?8:0))));
  const drawProb=Math.round(Math.max(8,Math.min(30,25-Math.abs(strDiff)*0.5)));
  const loseProb=Math.max(5,100-winProb-drawProb);

  // Maç tarzı tahmini
  const attackScore=(pressVal===2?2:0)+(wingVal===2?2:wingVal===1?1:0)+(defVal===2?1:0)+(zoneVal===2?2:0);
  const defenseScore=(pressVal===0?2:0)+(defVal===0?2:defVal===1?1:0)+(zoneVal===0?2:0);
  const styleLabel=attackScore>=5?"Yüksek Riskli Hücum":attackScore>=3?"Agresif":defenseScore>=4?"Çok Savunmacı":defenseScore>=2?"Dengeli/Savunmacı":"Dengeli";
  const styleCol=attackScore>=5?"#ff5050":attackScore>=3?"#e67e22":defenseScore>=4?"#3498db":C.ac2;

  // Risk puanı
  const riskScore=pressVal*1.5+(defVal===2?2:0)+(zoneVal===2?1.5:0)+(wingVal===2?1:0);
  const riskLabel=riskScore>=5?"Yüksek":riskScore>=3?"Orta":"Düşük";
  const riskCol=riskScore>=5?"#ff5050":riskScore>=3?"#e67e22":"#30e070";

  // Beklenen gol
  const myLambda=(1.3+attackScore*0.15+totalEffect*0.08+(home?0.2:0)).toFixed(2);
  const opLambda=(1.0+defenseScore*0.08-totalEffect*0.06+(home?-0.15:0.1)).toFixed(2);

  const effectColor=(v)=>v>0?"#30e070":v<0?"#ff5050":"#7898c0";
  const effectSign=(v)=>v>0?"+"+v:v;

  // ── Tab bar ──
  const tabBar=(
    <div style={{flexShrink:0,display:"flex",gap:3,padding:"6px 8px",
      background:C.nav,borderBottom:"1px solid rgba(77,166,255,0.1)"}}>
      {[["formasyon","🎯","Formasyon"],["taktik","⚙️","Taktik"]].map(([id,icon,label])=>{
        const active=tab===id;
        return(
          <button key={id} onClick={()=>setTab(id)} style={{
            flex:1,padding:"7px 4px",cursor:"pointer",borderRadius:7,fontFamily:"inherit",
            border:active?"1px solid rgba(77,166,255,.4)":"1px solid rgba(77,166,255,.1)",
            background:active?"linear-gradient(135deg,rgba(21,98,204,.4),rgba(21,98,204,.2))":C.surface,
            color:active?C.wh:C.dim,
            fontSize:".58rem",fontWeight:active?800:500,letterSpacing:active?.3:0,
            boxShadow:active?"0 0 10px rgba(77,166,255,.15)":"none",
            transition:"all .15s"}}>
            {icon} {label}
          </button>
        );
      })}
    </div>
  );

  // ── Formasyon içeriği (PageFormasyon mantığı burada) ──
  const [picking,setPicking]=useState(null);
  const [swapping,setSwapping]=useState(null);
  const [warnSlot,setWarnSlot]=useState(null);
  const [selectedBenchPlayer,setSelectedBenchPlayer]=useState(null); // squad indeksi

  const slots=FDATA[formation];
  const startingSet=new Set(startingXI);
  const subs=squad.map((p,i)=>({...p,sqIdx:i})).filter((_,i)=>!startingSet.has(i));

  const dispOvr=(pl,slotPos)=>{
    const pen=posPenalty(pl.pos,slotPos);
    return pen===-99?null:pl.ovr+pen;
  };

  const activeCoachF=coaches.find(c=>c.hired);
  const boostGroup=activeCoachF
    ?{Hücum:"ATT","Pas Oyunu":"MID",Defans:"DEF",Taktik:null,Denge:null,Genç:null}[activeCoachF.spec]||null
    :null;

  const buildAutoLineupLocal=(form)=>{
    const slts=FDATA[form];
    const available=[...squad.map((p,i)=>({...p,sqIdx:i}))];
    const result=Array(11).fill(null);
    const used=new Set();
    slts.forEach((s,i)=>{
      const candidates=available.filter(p=>!used.has(p.sqIdx)&&(p.injured||0)===0&&posPenalty(p.pos,s.p)===0).map(p=>({...p,score:p.ovr})).sort((a,b)=>b.score-a.score);
      if(candidates[0]){result[i]=candidates[0].sqIdx;used.add(candidates[0].sqIdx);}
    });
    slts.forEach((s,i)=>{
      if(result[i]!==null) return;
      const fallbackOrder=NEAREST_POS[s.p]||[s.p];
      for(const fp of fallbackOrder){
        const candidates=available.filter(p=>!used.has(p.sqIdx)&&(p.injured||0)===0&&p.pos===fp).map(p=>({...p,score:p.ovr})).sort((a,b)=>b.score-a.score);
        if(candidates[0]){result[i]=candidates[0].sqIdx;used.add(candidates[0].sqIdx);break;}
      }
    });
    slts.forEach((s,i)=>{
      if(result[i]!==null) return;
      const last=available.filter(p=>!used.has(p.sqIdx)&&(p.injured||0)===0&&(s.p==="GK"?p.pos==="GK":p.pos!=="GK"));
      if(last[0]){result[i]=last[0].sqIdx;used.add(last[0].sqIdx);}
    });
    slts.forEach((s,i)=>{
      if(result[i]!==null) return;
      const last=available.filter(p=>!used.has(p.sqIdx)&&(s.p==="GK"?p.pos==="GK":p.pos!=="GK"));
      if(last[0]){result[i]=last[0].sqIdx;used.add(last[0].sqIdx);}
    });
    return result;
  };

  const handleAutoLineup=()=>{setStartingXI(buildAutoLineupLocal(formation));setPicking(null);setSwapping(null);setSelectedBenchPlayer(null);};
  const handleCircleClick=(idx)=>{
    if(selectedBenchPlayer!==null){ if(placeSub(idx,selectedBenchPlayer)) setSelectedBenchPlayer(null); return; }
    if(picking!==null){if(picking===idx){setPicking(null);return;}handleCircleSwap(picking,idx);return;}
    if(swapping!==null){if(swapping===idx){setSwapping(null);return;}handleCircleSwap(swapping,idx);setSwapping(null);return;}
    setPicking(idx);
  };
  const placeSub=(slotIdx,sqIdx)=>{
    const slotPos=slots[slotIdx].p;
    const pl=squad[sqIdx];
    if(!pl) return;
    if((pl.injured||0)>0){setWarnSlot(slotIdx);setTimeout(()=>setWarnSlot(null),900);return;}
    const pen=posPenalty(pl.pos,slotPos);
    if(pen===-99){setWarnSlot(slotIdx);setTimeout(()=>setWarnSlot(null),900);return;}
    const nl=[...startingXI];nl[slotIdx]=sqIdx;setStartingXI(nl);setPicking(null);
    return true;
  };
  const handleSubPick=(sqIdx)=>{
    if(picking===null){ // önce yedek seç → sahada uygun slotlar vurgulanır
      if((squad[sqIdx]?.injured||0)>0) return;
      setSelectedBenchPlayer(v=>v===sqIdx?null:sqIdx); setSwapping(null); return;
    }
    placeSub(picking,sqIdx);
  };
  const handleCircleSwap=(fromIdx,toIdx)=>{
    const aPlayer=squad[startingXI[fromIdx]];
    const bPlayer=squad[startingXI[toIdx]];
    const aSlot=slots[fromIdx].p;
    const bSlot=slots[toIdx].p;
    const penAtoB=posPenalty(aPlayer.pos,bSlot);
    const penBtoA=posPenalty(bPlayer.pos,aSlot);
    if(penAtoB===-99||penBtoA===-99){setWarnSlot(penAtoB===-99?toIdx:fromIdx);setTimeout(()=>setWarnSlot(null),900);return;}
    const nl=[...startingXI];[nl[fromIdx],nl[toIdx]]=[nl[toIdx],nl[fromIdx]];setStartingXI(nl);setPicking(null);
  };
  const cancel=()=>{setPicking(null);setSwapping(null);setSelectedBenchPlayer(null);};

  // ── Sürükle-bırak (Pointer Events: fare + dokunmatik) ──
  // src: {kind:"xi"|"sub", id: slot indeksi | squad indeksi}. <8px hareket = normal tıklama.
  const dragRef=useRef(null);          // {src,x0,y0,pid,active}
  const justDraggedRef=useRef(false);
  const [ghost,setGhost]=useState(null); // {x,y,label,ovr,pos,over}
  const readDrop=(x,y)=>{
    const el=document.elementFromPoint(x,y);
    const t=el&&el.closest&&el.closest("[data-drop]");
    if(!t) return null;
    const [kind,id]=t.getAttribute("data-drop").split(":");
    return {kind,id:+id};
  };
  const dragHandlers=(src,pl)=>({
    onPointerDown:e=>{
      if(e.button!==undefined&&e.button!==0) return;
      dragRef.current={src,x0:e.clientX,y0:e.clientY,pid:e.pointerId,active:false};
      try{e.currentTarget.setPointerCapture(e.pointerId);}catch(_){}
    },
    onPointerMove:e=>{
      const d=dragRef.current; if(!d||d.pid!==e.pointerId) return;
      if(!d.active){
        if(Math.hypot(e.clientX-d.x0,e.clientY-d.y0)<8) return;
        d.active=true;
      }
      e.preventDefault();
      const ov=readDrop(e.clientX,e.clientY);
      setGhost({src:`${src.kind}:${src.id}`,x:e.clientX,y:e.clientY,label:(pl.n.includes(".")?pl.n.split(".")[1]:pl.n)||pl.n,ovr:pl.ovr,pos:pl.pos,
        over:ov?`${ov.kind}:${ov.id}`:null});
    },
    onPointerUp:e=>{
      const d=dragRef.current; dragRef.current=null;
      if(!d||!d.active){ setGhost(null); return; }   // kısa dokunuş → onClick çalışır
      justDraggedRef.current=true; setTimeout(()=>{justDraggedRef.current=false;},0);
      try{e.currentTarget.releasePointerCapture(e.pointerId);}catch(_){}
      setGhost(null);
      const dst=readDrop(e.clientX,e.clientY); if(!dst) return;
      if(src.kind==="xi"&&dst.kind==="xi"){ if(dst.id!==src.id) handleCircleSwap(src.id,dst.id); }
      else if(src.kind==="sub"&&dst.kind==="xi") placeSub(dst.id,src.id);
      else if(src.kind==="xi"&&dst.kind==="sub") placeSub(src.id,dst.id);
      else return;
      setPicking(null);setSwapping(null);setSelectedBenchPlayer(null);
    },
    onPointerCancel:()=>{ dragRef.current=null; setGhost(null); },
  });
  const clickGuard=fn=>()=>{ if(justDraggedRef.current) return; fn(); };

  const formasyonContent=(
    <div style={{flex:1,display:"flex",flexDirection:"column",minHeight:0,overflow:"hidden",
      padding:"8px 8px 6px",gap:5,background:C.surface}}>
      {/* Üst bar */}
      <div style={{flexShrink:0,display:"flex",gap:4,alignItems:"center",flexWrap:"wrap",
        background:C.nav,borderRadius:9,padding:"6px 8px",
        border:"1px solid rgba(77,166,255,0.1)"}}>
        <div style={{display:"flex",gap:3,background:C.inset,borderRadius:6,
          padding:"2px",border:"1px solid rgba(77,166,255,0.07)"}}>
          {Object.keys(FDATA).map(f=>{
            const active=f===formation;
            return(
            <button key={f} onClick={()=>{
                setFormation(f);setStartingXI(buildAutoLineupLocal(f));cancel();
                // Formasyon değişince taktikleri otomatik ayarla
                const formTacticMap={
                  "4-4-2":  {wing:2,defLine:1,press:1,pressZone:1},   // Dengeli kanat
                  "4-3-3":  {wing:2,defLine:2,press:2,pressZone:2},   // Hücum, yüksek hat
                  "3-5-2":  {wing:0,defLine:1,press:1,pressZone:1},   // Merkez odaklı
                  "4-2-3-1":{wing:1,defLine:1,press:1,pressZone:1},   // Dengeli
                  "5-3-2":  {wing:0,defLine:0,press:0,pressZone:0},   // Savunma blok
                  "4-1-4-1":{wing:2,defLine:1,press:1,pressZone:1},   // Kanat + CDM
                };
                const suggested=formTacticMap[f];
                if(suggested) setTactic(prev=>({...prev,...suggested}));
              }}
              style={{background:active?"linear-gradient(135deg,rgba(21,98,204,.5),rgba(21,98,204,.25))":"transparent",
                border:active?"1px solid rgba(77,166,255,.4)":"1px solid transparent",
                color:active?C.wh:C.dim,
                fontSize:".56rem",letterSpacing:active?.6:0,fontWeight:active?800:500,
                padding:"5px 10px",cursor:"pointer",borderRadius:5,fontFamily:"inherit",
                boxShadow:active?"0 0 10px rgba(77,166,255,.15)":"none",
                transition:"all .15s"}}>{f}</button>
            );
          })}
        </div>
        <div style={{width:1,height:20,background:"rgba(77,166,255,.08)",flexShrink:0}}/>
        <button onClick={()=>setAutoLineup&&setAutoLineup(v=>!v)}
          title="Her maç sonrası otomatik en iyi 11 seçilir"
          style={{background:autoLineup?"linear-gradient(135deg,rgba(26,184,92,.25),rgba(26,184,92,.1))":"rgba(100,120,160,.08)",
            border:autoLineup?"1px solid rgba(26,184,92,.3)":"1px solid rgba(77,166,255,.08)",
            color:autoLineup?C.grn2:C.dmr,
            fontSize:".5rem",fontWeight:700,padding:"5px 10px",cursor:"pointer",borderRadius:6,
            fontFamily:"inherit",transition:"all .15s",whiteSpace:"nowrap"}}>
          {autoLineup?"🤖 Oto Açık":"🤖 Oto Kapalı"}
        </button>
        <button onClick={handleAutoLineup}
          style={{marginLeft:"auto",background:"linear-gradient(135deg,rgba(21,98,204,.3),rgba(21,98,204,.15))",
            border:"1px solid rgba(77,166,255,.2)",color:C.ac2,
            fontSize:".5rem",fontWeight:700,padding:"5px 10px",cursor:"pointer",borderRadius:6,
            fontFamily:"inherit",transition:"all .15s",whiteSpace:"nowrap"}}>⚡ En İyi 11</button>
      </div>

      {/* Sürükleme hayalet rozeti */}
      {ghost&&(()=>{ const tc=posC(ghost.pos); return ReactDOM.createPortal(
        <div style={{position:"fixed",left:ghost.x,top:ghost.y,transform:"translate(-50%,-130%) rotate(-3deg)",
          zIndex:9999,pointerEvents:"none",display:"flex",alignItems:"center",gap:5,
          background:"rgba(10,18,34,.92)",border:`1.5px solid ${ghost.over?"#ffd060":tc.c}`,borderRadius:999,
          padding:"4px 10px 4px 4px",boxShadow:"0 10px 24px rgba(0,0,0,.55), 0 0 14px rgba(255,208,96,.25)",
          fontSize:".5rem",fontWeight:800,color:"#fff",whiteSpace:"nowrap"}}>
          <span style={{width:22,height:22,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",
            background:tc.c,color:"#0b1220",fontSize:".46rem",fontWeight:900}}>{ghost.ovr}</span>
          {ghost.label}<span style={{color:tc.c,fontSize:".42rem"}}>{ghost.pos}</span>
        </div>,document.body); })()}

      {/* Yedek seçili: renk açıklaması */}
      {selectedBenchPlayer!==null&&squad[selectedBenchPlayer]&&<div style={{flexShrink:0,textAlign:"center",fontSize:".44rem",
        color:C.wh,background:"rgba(34,197,94,.08)",border:"1px solid rgba(34,197,94,.25)",borderRadius:6,padding:"5px",fontWeight:700}}>
        {squad[selectedBenchPlayer].n} ({squad[selectedBenchPlayer].pos}) → <span style={{color:"#22c55e"}}>● Ana mevki</span> · <span style={{color:"#f59e0b"}}>● Yan mevki</span> · sahada bir slota dokun
        <button onClick={cancel} style={{marginLeft:8,background:"rgba(255,255,255,.1)",border:"none",
          color:"rgba(255,255,255,.7)",cursor:"pointer",fontSize:".44rem",borderRadius:4,padding:"1px 6px",fontFamily:"inherit"}}>✕</button>
      </div>}
      <style>{"@keyframes fmPosPulse{0%,100%{box-shadow:0 0 0 2px rgba(34,197,94,.95),0 0 10px 2px rgba(34,197,94,.55)}50%{box-shadow:0 0 0 4px rgba(34,197,94,.75),0 0 20px 6px rgba(34,197,94,.35)}}"}</style>

      {/* Hint */}
      {picking!==null&&<div style={{flexShrink:0,textAlign:"center",fontSize:".44rem",
        color:C.gd,background:"rgba(232,184,58,.08)",border:"1px solid rgba(232,184,58,.2)",
        borderRadius:6,padding:"5px",fontWeight:700}}>
        👆 Yedek seç veya sahada başka oyuncuya tıkla (yer değiştir)
        <button onClick={cancel} style={{marginLeft:8,background:"rgba(255,255,255,.1)",border:"none",
          color:"rgba(255,255,255,.7)",cursor:"pointer",fontSize:".44rem",borderRadius:4,
          padding:"1px 6px",fontFamily:"inherit"}}>✕</button>
      </div>}

      {/* Saha */}
      <div style={{flex:1,position:"relative",minHeight:0,borderRadius:9,overflow:"hidden",
        border:"2px solid rgba(255,255,255,.15)",
        boxShadow:"0 4px 24px rgba(0,0,0,.6), inset 0 0 60px rgba(0,0,0,.2)"}}>

        {/* PES taktik tahtası: yatay iki tonlu doğal çim şeritleri + ince çim grenleri */}
        <div style={{position:"absolute",inset:0,
          background:`repeating-linear-gradient(180deg,rgba(255,255,255,.025) 0 2px,rgba(0,0,0,.025) 2px 4px),
            repeating-linear-gradient(180deg,#3d8a36 0 6.25%,#4a9a40 6.25% 12.5%)`}}/>
        {/* Stadyum gölgesi: kenarlarda yumuşak vinyet */}
        <div style={{position:"absolute",inset:0,pointerEvents:"none",
          background:"radial-gradient(ellipse 75% 70% at 50% 50%,rgba(0,0,0,0) 55%,rgba(0,0,0,.38) 100%),linear-gradient(90deg,rgba(0,0,0,.18),rgba(0,0,0,0) 12%,rgba(0,0,0,0) 88%,rgba(0,0,0,.18))"}}/>
        {/* Sağ üst: aktif oyun tarzı · Sağ alt: diziliş kodu */}
        <div style={{position:"absolute",top:6,right:6,zIndex:2,pointerEvents:"none",padding:"2px 7px",borderRadius:3,
          background:"rgba(8,12,20,.72)",borderLeft:"3px solid #ffd060",color:"#fff",fontSize:".42rem",fontWeight:900,letterSpacing:.6,
          textTransform:"uppercase",textShadow:"0 1px 3px #000"}}>
          {tactic.tog0?"Kontra Atak":(["Kısa Pas","Karma Oyun","Uzun Top"][tactic.style??0])}</div>
        <div style={{position:"absolute",bottom:6,right:6,zIndex:2,pointerEvents:"none",padding:"1px 7px",borderRadius:3,
          background:"rgba(8,12,20,.72)",color:"#fff",fontSize:".62rem",fontWeight:900,letterSpacing:1,
          fontFamily:"'Barlow Condensed',sans-serif",textShadow:"0 1px 3px #000"}}>{formation}</div>

        {/* Saha çizgileri — SVG tabanlı, keskin ve parlak */}
        <svg style={{position:"absolute",inset:0,width:"100%",height:"100%",overflow:"visible",filter:"drop-shadow(0 0 1px rgba(255,255,255,.45))"}}
          viewBox="0 0 100 160" preserveAspectRatio="none">
          {/* Dış çerçeve */}
          <rect x="3" y="2" width="94" height="156" fill="none" stroke="#ffffff" strokeWidth=".7"/>
          {/* Orta çizgi */}
          <line x1="3" y1="80" x2="97" y2="80" stroke="#ffffff" strokeWidth=".7"/>
          {/* Orta daire */}
          <circle cx="50" cy="80" r="16" fill="none" stroke="#ffffff" strokeWidth=".7"/>
          {/* Orta nokta */}
          <circle cx="50" cy="80" r="1" fill="#ffffff"/>

          {/* Alt ceza sahası (büyük) */}
          <rect x="19" y="127" width="62" height="31" fill="none" stroke="#ffffff" strokeWidth=".7"/>
          {/* Alt küçük ceza sahası */}
          <rect x="35" y="147" width="30" height="11" fill="none" stroke="#ffffff" strokeWidth=".7"/>
          {/* Alt kale */}
          <rect x="43" y="156" width="14" height="3.5" fill="none" stroke="#ffffff" strokeWidth="1"/>
          {/* Alt penaltı noktası */}
          <circle cx="50" cy="140" r="0.8" fill="#ffffff"/>
          {/* Alt ceza yayı */}
          <path d="M 38 127 A 13 13 0 0 0 62 127" fill="none" stroke="#ffffff" strokeWidth=".7"/>

          {/* Üst ceza sahası (büyük) */}
          <rect x="19" y="2" width="62" height="31" fill="none" stroke="#ffffff" strokeWidth=".7"/>
          {/* Üst küçük ceza sahası */}
          <rect x="35" y="2" width="30" height="11" fill="none" stroke="#ffffff" strokeWidth=".7"/>
          {/* Üst kale */}
          <rect x="43" y="-1.5" width="14" height="3.5" fill="none" stroke="#ffffff" strokeWidth="1"/>
          {/* Üst penaltı noktası */}
          <circle cx="50" cy="20" r="0.8" fill="#ffffff"/>
          {/* Üst ceza yayı */}
          <path d="M 38 33 A 13 13 0 0 1 62 33" fill="none" stroke="#ffffff" strokeWidth=".7"/>

          {/* Köşe yayları */}
          <path d="M 3 5 A 3 3 0 0 1 6 2" fill="none" stroke="#ffffff" strokeWidth=".6"/>
          <path d="M 94 2 A 3 3 0 0 1 97 5" fill="none" stroke="#ffffff" strokeWidth=".6"/>
          <path d="M 3 155 A 3 3 0 0 0 6 158" fill="none" stroke="#ffffff" strokeWidth=".6"/>
          <path d="M 94 158 A 3 3 0 0 0 97 155" fill="none" stroke="#ffffff" strokeWidth=".6"/>
        </svg>

        {/* Oyuncular */}
        {slots.map((s,idx)=>{
          const pl=squad[startingXI[idx]];
          if(!pl) return null;
          const tc=posC(s.p);
          const isActive=picking===idx||swapping===idx;
          // Vurgu: seçili yedek ya da sürüklenen yedek
          const hlSq=selectedBenchPlayer!==null?selectedBenchPlayer:(ghost&&ghost.src&&ghost.src.startsWith("sub:")?+ghost.src.slice(4):null);
          const comp=hlSq!==null&&squad[hlSq]?getPosCompatibility(squad[hlSq].pos,s.p):null;
          const pen=posPenalty(pl.pos,s.p);
          const eOvr=dispOvr(pl,s.p);
          const hasWarn=pen===-5;
          const cantPlay=pen===-99;
          const isWarnFlash=warnSlot===idx;
          const pc=fmPesPosCol(s.p);
          const borderColor=isWarnFlash?"#ff3333":isActive?"#ffd060":cantPlay?"#ff5050":hasWarn?"#ffd060":pc+"99";
          const fit=Math.max(0,Math.min(100,100-(pl.fatigue||0)));
          const ovrCol=cantPlay?"#ff7070":hasWarn?"#ffd060":eOvr>=85?"#ffd060":eOvr>=80?"#ff6b5a":"#ffffff";
          return(
            <div key={idx} data-drop={`xi:${idx}`} onClick={clickGuard(()=>handleCircleClick(idx))} {...dragHandlers({kind:"xi",id:idx},pl)}
              style={{position:"absolute",left:`${s.x}%`,top:`${s.y}%`,touchAction:"none",userSelect:"none",
                opacity:(ghost&&ghost.src===`xi:${idx}`)||comp==="none"?0.45:1,
                outline:ghost&&ghost.over===`xi:${idx}`?"2px dashed #ffd060":"none",outlineOffset:3,borderRadius:8,
                transform:"translate(-50%,-50%)",
                display:"flex",flexDirection:"column",alignItems:"center",
                cursor:"pointer",zIndex:isActive?10:3,filter:cantPlay?"brightness(.85)":"none"}}>
              {/* PES tarzı kompakt oyuncu etiketi: ★OVR / mevki rozeti / isim / kondisyon çizgisi */}
              <div style={{minWidth:46,maxWidth:60,padding:"2px 4px 3px",borderRadius:5,
                background:isActive?"rgba(60,45,8,.82)":"linear-gradient(180deg,rgba(8,12,20,.42),rgba(8,12,20,.72))",
                border:`1.5px solid ${borderColor}`,
                animation:comp==="primary"?"fmPosPulse 1.2s ease-in-out infinite":"none",
                boxShadow:comp==="secondary"?"0 0 0 3px #f59e0b, 0 0 14px rgba(245,158,11,.55)":isActive?"0 0 0 3px rgba(232,184,58,.35), 0 4px 14px rgba(0,0,0,.8), 0 0 20px rgba(232,184,58,.4)":cantPlay?"0 0 0 2px rgba(231,76,60,.3), 0 3px 10px rgba(0,0,0,.7)":"0 3px 10px rgba(0,0,0,.55)",
                display:"flex",flexDirection:"column",alignItems:"center",gap:1,
                transition:"all .15s",position:"relative"}}>
                <span style={{fontSize:".5rem",color:ovrCol,fontWeight:900,lineHeight:1,textShadow:"0 1px 3px #000"}}>
                  {cantPlay?"✕":`★${eOvr}`}</span>
                <span style={{fontSize:".32rem",fontWeight:900,lineHeight:1.15,letterSpacing:.5,color:pc,
                  background:"rgba(0,0,0,.72)",padding:"0 5px",borderRadius:2,border:`1px solid ${pc}66`}}>{s.p}</span>
                <span style={{fontSize:".38rem",color:"#fff",fontWeight:900,lineHeight:1.1,letterSpacing:.1,
                  maxWidth:54,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",textShadow:"0 1px 3px #000"}}>
                  {(pl.n.includes(".")?pl.n.split(".")[1]:pl.n)||pl.n}</span>
                <div title={`Kondisyon %${fit}`} style={{width:"100%",height:2,borderRadius:1,background:"rgba(255,255,255,.18)",overflow:"hidden"}}>
                  <div style={{width:`${fit}%`,height:"100%",background:fit>=75?"#22c55e":fit>=50?"#f59e0b":"#ef4444"}}/></div>
              </div>
              {comp==="primary"&&<div style={{display:"flex",alignItems:"center",gap:2,marginTop:1,fontSize:".28rem",fontWeight:900,
                color:"#fff",background:"rgba(34,197,94,.85)",padding:"0 4px",borderRadius:3,letterSpacing:.3,whiteSpace:"nowrap"}}>
                <span style={{width:4,height:4,borderRadius:"50%",background:"#dcfce7"}}/>ANA MEVKİ</div>}
              {comp==="secondary"&&<div style={{marginTop:1,fontSize:".28rem",fontWeight:900,color:"#1f1300",
                background:"rgba(245,158,11,.9)",padding:"0 4px",borderRadius:3,letterSpacing:.3,whiteSpace:"nowrap"}}>YAN MEVKİ</div>}
              {hasWarn&&<div style={{fontSize:".3rem",color:"#ffd060",fontWeight:800,lineHeight:1,marginTop:1,
                background:"rgba(200,153,42,.2)",padding:"0 3px",borderRadius:2,border:"1px solid rgba(200,153,42,.3)"}}>-5</div>}
              {isActive&&<div style={{position:"absolute",top:-4,right:-4,width:8,height:8,
                borderRadius:"50%",background:"#ffd060",boxShadow:"0 0 8px #ffd060aa"}}/>}
            </div>
          );
        })}
      </div>

      {/* Yedekler */}
      <div style={{flexShrink:0,background:C.nav,
        borderRadius:9,border:"1px solid rgba(77,166,255,0.08)",padding:"6px 8px"}}>
        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
          <div style={{fontSize:".4rem",color:picking!==null?C.gd:C.dim,
            textTransform:"uppercase",letterSpacing:1.5,fontWeight:picking!==null?800:600}}>
            {picking!==null?"👇 Yedek Seç":"Yedek Oyuncular"}
          </div>
          {picking===null&&<div style={{fontSize:".4rem",color:C.dim,
            padding:"1px 6px",borderRadius:8,background:"rgba(77,166,255,.05)",
            border:"1px solid rgba(77,166,255,.08)"}}>{subs.length} oyuncu</div>}
          {picking!==null&&<div style={{fontSize:".38rem",color:"rgba(232,184,58,.6)",fontStyle:"italic"}}>❌ oynayamaz · ⚠️ -5 ceza</div>}
        </div>
        <div style={{display:"flex",gap:4,overflowX:"auto",paddingBottom:2,scrollbarWidth:"none"}}>
          {subs.map(pl=>{
            const tc=posC(pl.pos);
            const pickSlotPos=picking!==null?slots[picking].p:null;
            const subPen=pickSlotPos?posPenalty(pl.pos,pickSlotPos):0;
            const isInjured=(pl.injured||0)>0;
            const subCant=subPen===-99||isInjured;
            const subWarn=!isInjured&&subPen===-5;
            const canSelect=picking!==null&&!subCant;
            return(
              <div key={pl.id} data-drop={`sub:${pl.sqIdx}`} onClick={clickGuard(()=>handleSubPick(pl.sqIdx))} {...dragHandlers({kind:"sub",id:pl.sqIdx},pl)}
                style={{flexShrink:0,touchAction:"pan-x",userSelect:"none",
                  outline:ghost&&ghost.over===`sub:${pl.sqIdx}`?"2px dashed #ffd060":selectedBenchPlayer===pl.sqIdx?"2px solid #22c55e":"none",outlineOffset:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2,
                  padding:"5px 6px",borderRadius:7,minWidth:38,
                  opacity:subCant?0.32:1,
                  background:isInjured?"rgba(180,40,40,.12)":subCant?"rgba(192,57,43,.08)":subWarn?"rgba(232,184,58,.1)":canSelect?"rgba(21,98,204,.18)":C.card,
                  border:`1px solid ${isInjured?"rgba(231,76,60,.35)":subCant?"rgba(231,76,60,.2)":subWarn?"rgba(232,184,58,.25)":canSelect?"rgba(77,166,255,.3)":"rgba(77,166,255,.07)"}`,
                  boxShadow:canSelect?"0 0 10px rgba(77,166,255,.1)":"none",
                  cursor:subCant?"not-allowed":picking!==null?"pointer":"default",transition:"all .15s"}}>
                <div style={{width:23,height:23,borderRadius:"50%",
                  background:isInjured?"rgba(180,40,40,.6)":tc.bg.replace(",.1",",.75").replace(",.12",",.75").replace(",.15",",.8"),
                  border:`1.5px solid ${isInjured?"rgba(231,76,60,.8)":tc.b.replace(",.2",",.75").replace(",.28",",.85").replace(",.3",",.85")}`,
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:".46rem",fontWeight:900,color:"#fff",
                  boxShadow:isInjured?"0 0 6px rgba(231,76,60,.3)":`0 0 6px ${tc.c}22`,
                  textShadow:"0 1px 2px rgba(0,0,0,.6)"}}>
                  {isInjured?"🏥":subCant?"✕":pl.ovr}
                </div>
                <div style={{fontSize:".35rem",
                  color:isInjured?"rgba(255,100,100,.7)":subCant?"rgba(255,80,80,.6)":subWarn?C.gd:picking!==null?C.wh:C.dim,
                  whiteSpace:"nowrap",fontWeight:700,maxWidth:44,overflow:"hidden",textOverflow:"ellipsis",letterSpacing:.1}}>
                  {(pl.n.includes(".")?pl.n.split(".")[1]:pl.n)||pl.n}
                </div>
                <span style={{fontSize:".36rem",fontWeight:700,padding:"1px 4px",borderRadius:3,
                  background:isInjured?"rgba(180,40,40,.2)":tc.bg,color:isInjured?"#ff8080":tc.c,
                  border:`1px solid ${isInjured?"rgba(231,76,60,.3)":tc.b}`,whiteSpace:"nowrap",letterSpacing:.3}}>
                  {isInjured?`${pl.injured}h`:pl.pos}
                </span>
                {subWarn&&<span style={{fontSize:".3rem",color:C.gd,fontWeight:800,
                  background:"rgba(200,153,42,.15)",padding:"0 3px",borderRadius:2}}>-5</span>}
              </div>
            );
          })}
          {subs.length===0&&<div style={{padding:"8px 0",fontSize:".5rem",color:C.dim,fontStyle:"italic"}}>Yedek oyuncu yok</div>}
        </div>
      </div>
    </div>
  );

  const taktikContent=(
    <div style={{display:"flex",flex:1,minHeight:0,overflow:"hidden"}}>
      <div style={{flex:1,overflowY:"auto",padding:"10px 12px",background:C.surface}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
          <div style={{fontSize:".6rem",fontWeight:900,color:C.wh,letterSpacing:.5}}>Takım Taktikleri</div>
          <div style={{fontSize:".42rem",color:C.grn2,background:"rgba(48,224,112,.1)",
            border:"1px solid rgba(48,224,112,.2)",padding:"2px 8px",borderRadius:10,fontWeight:700}}>⚡ Maça Etki Ediyor</div>
        </div>
        <div style={{fontSize:".46rem",color:C.ora,marginBottom:12,
          padding:"7px 10px",background:"linear-gradient(135deg,rgba(232,151,90,.1),rgba(232,151,90,.03))",
          borderRadius:7,border:"1px solid rgba(232,151,90,.18)",display:"flex",alignItems:"center",gap:6}}>
          <span style={{fontSize:".7rem",flexShrink:0}}>💡</span>
          <span>Rakip gücüne, sahaya ve rakibin oyun tarzına göre maç sonucunu <b style={{color:C.ora}}>±7 OVR</b> kadar etkiler</span>
        </div>
        {scoutReport&&<ScoutReportCard opp={opp} report={scoutReport} tactic={tactic}/>}
        {tacs.map((t,ti)=>{
          const activeOpt=tactic[t.key]??1;
          const icons=["🔵","⚪","🔴"];
          const optCols=["#5dade2","#7898c0","#ff6060"];
          return(
          <div key={ti} style={{marginBottom:14,background:C.gradCard,
            borderRadius:8,padding:"8px 10px",border:"1px solid rgba(77,166,255,0.07)"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:7}}>
              <div style={{fontSize:".46rem",letterSpacing:1.2,color:C.dim,textTransform:"uppercase",fontWeight:700}}>{t.l}</div>
              <div style={{fontSize:".42rem",color:optCols[activeOpt],fontWeight:700,
                background:`${optCols[activeOpt]}15`,border:`1px solid ${optCols[activeOpt]}30`,
                padding:"1px 7px",borderRadius:8}}>{t.opts[activeOpt]}</div>
            </div>
            <div style={{display:"flex",gap:3,marginBottom:7,background:C.inset,
              borderRadius:6,padding:"2px",border:"1px solid rgba(77,166,255,0.06)"}}>
              {t.opts.map((o,oi)=>{
                const active=activeOpt===oi;
                const col=optCols[oi];
                return(
                <button key={oi} onClick={()=>setTactic(p=>({...p,[t.key]:oi}))} style={{
                  flex:1,padding:"6px 4px",cursor:"pointer",borderRadius:5,fontFamily:"inherit",
                  border:active?`1px solid ${col}55`:"1px solid transparent",
                  background:active?`linear-gradient(135deg,${col}30,${col}15)`:"transparent",
                  color:active?C.wh:C.dim,
                  fontSize:".52rem",fontWeight:active?800:500,
                  boxShadow:active?`0 0 10px ${col}18`:"none",transition:"all .15s"}}>{o}</button>
                );
              })}
            </div>
            <div style={{fontSize:".44rem",color:C.dmr,fontStyle:"italic",lineHeight:1.4,paddingLeft:2}}>{t.desc[activeOpt]}</div>
          </div>
          );
        })}
        <div style={{marginTop:6,background:C.gradCard,
          borderRadius:8,padding:"8px 10px",border:"1px solid rgba(77,166,255,0.07)"}}>
          <div style={{fontSize:".46rem",color:C.dim,letterSpacing:1.2,
            textTransform:"uppercase",fontWeight:700,marginBottom:8}}>Özel Talimatlar</div>
          {["Hızlı Kontra","Set Pres","Geri Çekil","Oyunu Yavaşlat","İki Kanat","Orta Sahaya Baskı"].map((t,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",
              padding:"7px 2px",borderBottom:"1px solid rgba(77,166,255,0.06)"}}>
              <span style={{fontSize:".58rem",color:tactic[`tog${i}`]?C.wh:C.dim,
                fontWeight:tactic[`tog${i}`]?600:400,transition:"color .2s"}}>{t}</span>
              <div onClick={()=>setTactic(p=>({...p,[`tog${i}`]:!p[`tog${i}`]}))}
                style={{width:30,height:15,borderRadius:8,flexShrink:0,cursor:"pointer",
                  background:tactic[`tog${i}`]?"linear-gradient(90deg,#1562cc,#4da6ff)":"rgba(30,50,80,.5)",
                  border:tactic[`tog${i}`]?"1px solid rgba(77,166,255,.4)":"1px solid rgba(77,166,255,.1)",
                  transition:"all .2s",position:"relative",
                  boxShadow:tactic[`tog${i}`]?"0 0 8px rgba(77,166,255,.25)":"none"}}>
                <div style={{position:"absolute",top:2,left:tactic[`tog${i}`]?16:2,
                  width:9,height:9,borderRadius:"50%",background:"#fff",transition:"left .2s",
                  boxShadow:"0 1px 3px rgba(0,0,0,.4)"}}/>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{width:194,minHeight:0,borderLeft:"1px solid rgba(77,166,255,0.07)",
        background:C.card,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{flexShrink:0,padding:"10px 10px 0",display:"flex",flexDirection:"column",gap:8}}>
        {nextFixture?<div style={{flexShrink:0,
          background:`linear-gradient(135deg,${effStr>=oppStr?"rgba(26,184,92,.13)":"rgba(231,76,60,.13)"},${C.card})`,
          border:`1px solid ${effStr>=oppStr?"rgba(26,184,92,.22)":"rgba(231,76,60,.22)"}`,
          borderRadius:8,overflow:"hidden"}}>
          <div style={{height:2,background:`linear-gradient(90deg,transparent,${effStr>=oppStr?"#30e070":"#ff5050"},transparent)`}}/>
          <div style={{padding:"8px 10px"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
              <div style={{display:"flex",alignItems:"center",gap:5}}>
                <TeamBadge name={opp} size="md"/>
                <div style={{fontSize:".58rem",fontWeight:800,color:C.wh}}>{opp}</div>
              </div>
              <span style={{fontSize:".42rem",fontWeight:700,
                color:home?C.grn2:C.gd,background:home?"rgba(48,224,112,.1)":"rgba(255,208,96,.1)",
                border:home?"1px solid rgba(48,224,112,.2)":"1px solid rgba(255,208,96,.2)",
                padding:"1px 5px",borderRadius:6,flexShrink:0}}>{home?"🏠 Ev":"✈️ Dep."}</span>
            </div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{textAlign:"center"}}>
                <div style={{fontSize:".32rem",color:C.dim,letterSpacing:.8,textTransform:"uppercase",marginBottom:2}}>Bizim Güç</div>
                <div style={{fontSize:".9rem",fontWeight:900,lineHeight:1,color:effStr>=oppStr?C.grn2:C.red2,textShadow:effStr>=oppStr?"0 0 12px #30e07055":"0 0 12px #ff505055"}}>{effStr}</div>
              </div>
              <div style={{textAlign:"center",padding:"0 6px"}}>
                <div style={{fontSize:".52rem",fontWeight:800,color:effStr>=oppStr+8?C.grn2:effStr>=oppStr+3?"#6fcf97":effStr>=oppStr-3?C.gd:"#ff6060"}}>
                  {effStr>=oppStr+8?"🔥":effStr>=oppStr+3?"✅":effStr>=oppStr-3?"⚖️":"⚠️"}
                </div>
                <div style={{fontSize:".32rem",color:C.dmr,marginTop:1}}>
                  {effStr>=oppStr+8?"Favori":effStr>=oppStr+3?"Avantaj":effStr>=oppStr-3?"Dengeli":"Dezav."}
                </div>
              </div>
              <div style={{textAlign:"center"}}>
                <div style={{fontSize:".32rem",color:C.dim,letterSpacing:.8,textTransform:"uppercase",marginBottom:2}}>Rakip</div>
                <div style={{fontSize:".9rem",fontWeight:900,lineHeight:1,color:oppStr>=75?"#ff6060":oppStr>=65?C.gd:C.grn2}}>{oppStr}</div>
              </div>
            </div>
          </div>
        </div>:<div style={{background:`linear-gradient(135deg,rgba(26,184,92,.12),${C.card})`,
          border:"1px solid rgba(26,184,92,.2)",borderRadius:8,padding:"8px 10px",textAlign:"center"}}>
          <div style={{fontSize:".32rem",color:C.dim,letterSpacing:.8,textTransform:"uppercase",marginBottom:4}}>Efektif Güç</div>
          <div style={{fontSize:".9rem",fontWeight:900,lineHeight:1,color:C.grn2}}>{effStr}</div>
        </div>}
        <div style={{flexShrink:0,background:C.gradCard,
          border:"1px solid rgba(77,166,255,0.08)",borderRadius:8,padding:"8px 10px"}}>
          <div style={{fontSize:".38rem",color:C.dim,textTransform:"uppercase",letterSpacing:1.2,marginBottom:8,fontWeight:700}}>Maç Tahmini</div>
          {[["Galibiyet",winProb,C.grn2],["Beraberlik",drawProb,C.gd],["Mağlubiyet",loseProb,C.red2]].map(([l,v,cc])=>(
            <div key={l} style={{marginBottom:7}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:3,alignItems:"center"}}>
                <span style={{fontSize:".44rem",color:C.dim,fontWeight:500}}>{l}</span>
                <span style={{fontSize:".52rem",color:cc,fontWeight:800,textShadow:`0 0 8px ${cc}44`}}>{v}%</span>
              </div>
              <div style={{height:5,background:C.surface,borderRadius:3,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${v}%`,background:`linear-gradient(90deg,${cc}88,${cc})`,
                  borderRadius:3,boxShadow:`0 0 6px ${cc}44`,transition:"width .4s ease"}}/>
              </div>
            </div>
          ))}
        </div>
        </div>
        <div style={{flex:1,overflowY:"auto",minHeight:0,padding:"0 10px 16px",display:"flex",flexDirection:"column",gap:8}}>
        <div style={{background:C.gradCard,
          border:"1px solid rgba(77,166,255,0.08)",borderRadius:8,padding:"8px 10px"}}>
          <div style={{fontSize:".38rem",color:C.dim,textTransform:"uppercase",letterSpacing:1.2,marginBottom:7,fontWeight:700}}>Taktik Etki Dökümü</div>
          {[["Hücum Baskısı",pressEffect],["Defans Hattı",defEffect],["Oyun Stili",styleEffect],["Kanat",wingEffect],["Baskı Alanı",zoneEffect],
            ...(togTotal!==0?[["Özel Talimatlar",togTotal]]:[]),
            ...(tacCoachBonus?[[`${tacCoach.n}`,tacCoachBonus]]:[]),
          ].map(([l,v],i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 0",borderBottom:"1px solid rgba(77,166,255,0.06)"}}>
              <span style={{fontSize:".44rem",color:C.dim}}>{l}</span>
              <span style={{fontSize:".5rem",color:effectColor(v),fontWeight:800,background:`${effectColor(v)}12`,border:`1px solid ${effectColor(v)}25`,padding:"0 5px",borderRadius:5,minWidth:24,textAlign:"center"}}>{effectSign(v)}</span>
            </div>
          ))}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:6,paddingTop:5,borderTop:"1px solid rgba(77,166,255,0.15)"}}>
            <span style={{fontSize:".46rem",color:C.dim,fontWeight:700}}>Toplam</span>
            <span style={{fontSize:".72rem",fontWeight:900,color:effectColor(totalEffect),textShadow:`0 0 10px ${effectColor(totalEffect)}55`}}>{effectSign(totalEffect)}</span>
          </div>
        </div>
        <div style={{background:C.gradCard,
          border:"1px solid rgba(77,166,255,0.08)",borderRadius:8,padding:"8px 10px"}}>
          <div style={{fontSize:".38rem",color:C.dim,textTransform:"uppercase",letterSpacing:1.2,marginBottom:7,fontWeight:700}}>Maç Profili</div>
          {[["Oyun Tarzı",styleLabel,styleCol],["Risk",riskLabel,riskCol],["Gol Bek. (B)",myLambda,C.gd],["Gol Bek. (R)",opLambda,C.red2]].map(([l,v,cc])=>(
            <div key={l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 0",borderBottom:"1px solid rgba(77,166,255,0.06)"}}>
              <span style={{fontSize:".44rem",color:C.dim}}>{l}</span>
              <span style={{fontSize:".48rem",fontWeight:700,color:cc}}>{v}</span>
            </div>
          ))}
        </div>
        <div style={{background:"linear-gradient(135deg,rgba(21,98,204,.1),rgba(21,98,204,.03))",
          border:"1px solid rgba(77,166,255,.1)",borderRadius:8,padding:"8px 10px"}}>
          <div style={{fontSize:".38rem",color:C.dim,textTransform:"uppercase",letterSpacing:1.2,marginBottom:7,fontWeight:700}}>Aktif Taktikler</div>
          {tacs.map((t,ti)=>(
            <div key={ti} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 0",borderBottom:"1px solid rgba(77,166,255,0.07)"}}>
              <span style={{fontSize:".42rem",color:C.dim}}>{t.l}</span>
              <span style={{fontSize:".46rem",color:C.wh,fontWeight:700}}>{t.opts[tactic[t.key]??1]}</span>
            </div>
          ))}
        </div>
        </div>
      </div>
    </div>
  );

  return(
    <div style={{display:"flex",flexDirection:"column",flex:1,minHeight:0,overflow:"hidden"}}>
      {tabBar}
      {tab==="formasyon" ? formasyonContent : taktikContent}
    </div>
  );
}
