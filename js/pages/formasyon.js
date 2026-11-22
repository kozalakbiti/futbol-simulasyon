// ─── FORMASYON ────────────────────────────────────────────────
// ─── FORMASYON & TAKTİK (BİRLEŞİK) ──────────────────────────
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
      background:"rgba(5,9,26,.95)",borderBottom:"1px solid rgba(77,166,255,0.1)"}}>
      {[["formasyon","🎯","Formasyon"],["taktik","⚙️","Taktik"]].map(([id,icon,label])=>{
        const active=tab===id;
        return(
          <button key={id} onClick={()=>setTab(id)} style={{
            flex:1,padding:"7px 4px",cursor:"pointer",borderRadius:7,fontFamily:"inherit",
            border:active?"1px solid rgba(77,166,255,.4)":"1px solid rgba(77,166,255,.1)",
            background:active?"linear-gradient(135deg,rgba(21,98,204,.4),rgba(21,98,204,.2))":"rgba(10,20,42,.4)",
            color:active?"#e8f4ff":"rgba(120,152,192,.55)",
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

  const handleAutoLineup=()=>{setStartingXI(buildAutoLineupLocal(formation));setPicking(null);setSwapping(null);};
  const handleCircleClick=(idx)=>{
    if(picking!==null){if(picking===idx){setPicking(null);return;}handleCircleSwap(picking,idx);return;}
    if(swapping!==null){if(swapping===idx){setSwapping(null);return;}handleCircleSwap(swapping,idx);setSwapping(null);return;}
    setPicking(idx);
  };
  const handleSubPick=(sqIdx)=>{
    if(picking===null) return;
    const slotPos=slots[picking].p;
    const pl=squad[sqIdx];
    if((pl.injured||0)>0){setWarnSlot(picking);setTimeout(()=>setWarnSlot(null),900);return;}
    const pen=posPenalty(pl.pos,slotPos);
    if(pen===-99){setWarnSlot(picking);setTimeout(()=>setWarnSlot(null),900);return;}
    const nl=[...startingXI];nl[picking]=sqIdx;setStartingXI(nl);setPicking(null);
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
  const cancel=()=>{setPicking(null);setSwapping(null);};

  const formasyonContent=(
    <div style={{flex:1,display:"flex",flexDirection:"column",minHeight:0,overflow:"hidden",
      padding:"8px 8px 6px",gap:5,background:"rgba(3,6,18,.5)"}}>
      {/* Üst bar */}
      <div style={{flexShrink:0,display:"flex",gap:4,alignItems:"center",flexWrap:"wrap",
        background:"rgba(5,9,26,.92)",borderRadius:9,padding:"6px 8px",
        border:"1px solid rgba(77,166,255,0.1)"}}>
        <div style={{display:"flex",gap:3,background:"rgba(0,0,0,.4)",borderRadius:6,
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
                color:active?"#e8f4ff":"rgba(120,152,192,.5)",
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
            color:autoLineup?"#30e070":"rgba(120,152,192,.4)",
            fontSize:".5rem",fontWeight:700,padding:"5px 10px",cursor:"pointer",borderRadius:6,
            fontFamily:"inherit",transition:"all .15s",whiteSpace:"nowrap"}}>
          {autoLineup?"🤖 Oto Açık":"🤖 Oto Kapalı"}
        </button>
        <button onClick={handleAutoLineup}
          style={{marginLeft:"auto",background:"linear-gradient(135deg,rgba(21,98,204,.3),rgba(21,98,204,.15))",
            border:"1px solid rgba(77,166,255,.2)",color:"rgba(150,190,255,.8)",
            fontSize:".5rem",fontWeight:700,padding:"5px 10px",cursor:"pointer",borderRadius:6,
            fontFamily:"inherit",transition:"all .15s",whiteSpace:"nowrap"}}>⚡ En İyi 11</button>
      </div>

      {/* Hint */}
      {picking!==null&&<div style={{flexShrink:0,textAlign:"center",fontSize:".44rem",
        color:"#ffd060",background:"rgba(232,184,58,.08)",border:"1px solid rgba(232,184,58,.2)",
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

        {/* Şeritli çim dokusu — gerçekçi saha */}
        <div style={{position:"absolute",inset:0,
          background:`repeating-linear-gradient(
            180deg,
            #2d7a2d 0px, #2d7a2d 14px,
            #338a33 14px, #338a33 28px
          )`}}/>
        {/* Hafif perspektif tonu — üst biraz koyu */}
        <div style={{position:"absolute",inset:0,
          background:"linear-gradient(180deg,rgba(0,0,0,.18) 0%,rgba(0,0,0,0) 30%,rgba(0,0,0,0) 70%,rgba(0,0,0,.18) 100%)",
          pointerEvents:"none"}}/>

        {/* Saha çizgileri — SVG tabanlı, keskin ve parlak */}
        <svg style={{position:"absolute",inset:0,width:"100%",height:"100%",overflow:"visible"}}
          viewBox="0 0 100 160" preserveAspectRatio="none">
          {/* Dış çerçeve */}
          <rect x="3" y="2" width="94" height="156" fill="none" stroke="rgba(255,255,255,.90)" strokeWidth=".7"/>
          {/* Orta çizgi */}
          <line x1="3" y1="80" x2="97" y2="80" stroke="rgba(255,255,255,.90)" strokeWidth=".7"/>
          {/* Orta daire */}
          <circle cx="50" cy="80" r="16" fill="none" stroke="rgba(255,255,255,.90)" strokeWidth=".7"/>
          {/* Orta nokta */}
          <circle cx="50" cy="80" r="1" fill="rgba(255,255,255,.90)"/>

          {/* Alt ceza sahası (büyük) */}
          <rect x="19" y="127" width="62" height="31" fill="none" stroke="rgba(255,255,255,.90)" strokeWidth=".7"/>
          {/* Alt küçük ceza sahası */}
          <rect x="35" y="147" width="30" height="11" fill="none" stroke="rgba(255,255,255,.90)" strokeWidth=".7"/>
          {/* Alt kale */}
          <rect x="43" y="156" width="14" height="3.5" fill="none" stroke="rgba(255,255,255,.85)" strokeWidth="1"/>
          {/* Alt penaltı noktası */}
          <circle cx="50" cy="140" r="0.8" fill="rgba(255,255,255,.85)"/>
          {/* Alt ceza yayı */}
          <path d="M 38 127 A 13 13 0 0 0 62 127" fill="none" stroke="rgba(255,255,255,.90)" strokeWidth=".7"/>

          {/* Üst ceza sahası (büyük) */}
          <rect x="19" y="2" width="62" height="31" fill="none" stroke="rgba(255,255,255,.90)" strokeWidth=".7"/>
          {/* Üst küçük ceza sahası */}
          <rect x="35" y="2" width="30" height="11" fill="none" stroke="rgba(255,255,255,.90)" strokeWidth=".7"/>
          {/* Üst kale */}
          <rect x="43" y="-1.5" width="14" height="3.5" fill="none" stroke="rgba(255,255,255,.85)" strokeWidth="1"/>
          {/* Üst penaltı noktası */}
          <circle cx="50" cy="20" r="0.8" fill="rgba(255,255,255,.85)"/>
          {/* Üst ceza yayı */}
          <path d="M 38 33 A 13 13 0 0 1 62 33" fill="none" stroke="rgba(255,255,255,.90)" strokeWidth=".7"/>

          {/* Köşe yayları */}
          <path d="M 3 5 A 3 3 0 0 1 6 2" fill="none" stroke="rgba(255,255,255,.7)" strokeWidth=".6"/>
          <path d="M 94 2 A 3 3 0 0 1 97 5" fill="none" stroke="rgba(255,255,255,.7)" strokeWidth=".6"/>
          <path d="M 3 155 A 3 3 0 0 0 6 158" fill="none" stroke="rgba(255,255,255,.7)" strokeWidth=".6"/>
          <path d="M 94 158 A 3 3 0 0 0 97 155" fill="none" stroke="rgba(255,255,255,.7)" strokeWidth=".6"/>
        </svg>

        {/* Oyuncular */}
        {slots.map((s,idx)=>{
          const pl=squad[startingXI[idx]];
          if(!pl) return null;
          const tc=posC(s.p);
          const isActive=picking===idx||swapping===idx;
          const pen=posPenalty(pl.pos,s.p);
          const eOvr=dispOvr(pl,s.p);
          const hasWarn=pen===-5;
          const cantPlay=pen===-99;
          const isWarnFlash=warnSlot===idx;
          const circleColor=isWarnFlash?"rgba(255,50,50,.9)":isActive?"rgba(232,184,58,.92)":cantPlay?"rgba(192,57,43,.8)":hasWarn?"rgba(180,130,20,.7)":tc.bg.replace(",.1",",.85").replace(",.12",",.85").replace(",.15",",.88");
          const borderColor=isWarnFlash?"#ff3333":isActive?"#ffd060":cantPlay?"#ff5050":hasWarn?"#ffd060":tc.b.replace(",.2",",.85").replace(",.28",",.9").replace(",.3",",.9");
          return(
            <div key={idx} onClick={()=>handleCircleClick(idx)}
              style={{position:"absolute",left:`${s.x}%`,top:`${s.y}%`,
                transform:"translate(-50%,-50%)",
                display:"flex",flexDirection:"column",alignItems:"center",
                cursor:"pointer",zIndex:isActive?10:3,filter:cantPlay?"brightness(.85)":"none"}}>
              <div style={{width:34,height:34,borderRadius:"50%",
                background:circleColor,border:`2px solid ${borderColor}`,
                boxShadow:isActive?"0 0 0 3px rgba(232,184,58,.35), 0 4px 14px rgba(0,0,0,.8), 0 0 20px rgba(232,184,58,.4)":cantPlay?"0 0 0 2px rgba(231,76,60,.3), 0 3px 10px rgba(0,0,0,.7)":`0 0 12px ${tc.c}44, 0 4px 12px rgba(0,0,0,.8)`,
                display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
                transition:"all .15s",position:"relative",overflow:"hidden"}}>
                <div style={{position:"absolute",top:0,left:0,right:0,height:"50%",
                  background:"rgba(255,255,255,.15)",borderRadius:"50% 50% 0 0",pointerEvents:"none"}}/>
                <span style={{fontSize:".3rem",color:"rgba(255,255,255,.85)",fontWeight:700,lineHeight:1.1,letterSpacing:.3}}>{s.p}</span>
                <span style={{fontSize:".52rem",color:cantPlay?"#ff7070":hasWarn?"#ffd060":"#fff",
                  fontWeight:900,lineHeight:1.1,textShadow:"0 1px 4px rgba(0,0,0,.8)"}}>
                  {cantPlay?"✕":eOvr}
                </span>
              </div>
              <div style={{marginTop:2,fontSize:".36rem",color:"#fff",fontWeight:700,
                background:"rgba(0,0,0,.78)",padding:"1px 5px",borderRadius:3,
                maxWidth:52,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",
                textShadow:"0 1px 3px rgba(0,0,0,.9)",border:"1px solid rgba(255,255,255,.1)",letterSpacing:.1}}>
                {(pl.n.includes(".")?pl.n.split(".")[1]:pl.n)||pl.n}
              </div>
              {hasWarn&&<div style={{fontSize:".3rem",color:"#ffd060",fontWeight:800,lineHeight:1,marginTop:1,
                background:"rgba(200,153,42,.2)",padding:"0 3px",borderRadius:2,border:"1px solid rgba(200,153,42,.3)"}}>-5</div>}
              {isActive&&<div style={{position:"absolute",top:-4,right:-4,width:8,height:8,
                borderRadius:"50%",background:"#ffd060",boxShadow:"0 0 8px #ffd060aa"}}/>}
            </div>
          );
        })}
      </div>

      {/* Yedekler */}
      <div style={{flexShrink:0,background:"rgba(5,9,26,.92)",
        borderRadius:9,border:"1px solid rgba(77,166,255,0.08)",padding:"6px 8px"}}>
        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
          <div style={{fontSize:".4rem",color:picking!==null?"#ffd060":"rgba(77,166,255,.3)",
            textTransform:"uppercase",letterSpacing:1.5,fontWeight:picking!==null?800:600}}>
            {picking!==null?"👇 Yedek Seç":"Yedek Oyuncular"}
          </div>
          {picking===null&&<div style={{fontSize:".4rem",color:"rgba(77,166,255,.2)",
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
              <div key={pl.id} onClick={()=>handleSubPick(pl.sqIdx)}
                style={{flexShrink:0,display:"flex",flexDirection:"column",alignItems:"center",gap:2,
                  padding:"5px 6px",borderRadius:7,minWidth:38,
                  opacity:subCant?0.32:1,
                  background:isInjured?"rgba(180,40,40,.12)":subCant?"rgba(192,57,43,.08)":subWarn?"rgba(232,184,58,.1)":canSelect?"rgba(21,98,204,.18)":"rgba(10,20,40,.5)",
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
                  color:isInjured?"rgba(255,100,100,.7)":subCant?"rgba(255,80,80,.6)":subWarn?"#ffd060":picking!==null?"rgba(200,220,255,.9)":"rgba(120,152,192,.7)",
                  whiteSpace:"nowrap",fontWeight:700,maxWidth:44,overflow:"hidden",textOverflow:"ellipsis",letterSpacing:.1}}>
                  {(pl.n.includes(".")?pl.n.split(".")[1]:pl.n)||pl.n}
                </div>
                <span style={{fontSize:".36rem",fontWeight:700,padding:"1px 4px",borderRadius:3,
                  background:isInjured?"rgba(180,40,40,.2)":tc.bg,color:isInjured?"#ff8080":tc.c,
                  border:`1px solid ${isInjured?"rgba(231,76,60,.3)":tc.b}`,whiteSpace:"nowrap",letterSpacing:.3}}>
                  {isInjured?`${pl.injured}h`:pl.pos}
                </span>
                {subWarn&&<span style={{fontSize:".3rem",color:"#ffd060",fontWeight:800,
                  background:"rgba(200,153,42,.15)",padding:"0 3px",borderRadius:2}}>-5</span>}
              </div>
            );
          })}
          {subs.length===0&&<div style={{padding:"8px 0",fontSize:".5rem",color:"rgba(77,166,255,.2)",fontStyle:"italic"}}>Yedek oyuncu yok</div>}
        </div>
      </div>
    </div>
  );

  const taktikContent=(
    <div style={{display:"flex",flex:1,minHeight:0,overflow:"hidden"}}>
      <div style={{flex:1,overflowY:"auto",padding:"10px 12px",background:"rgba(3,6,18,.4)"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
          <div style={{fontSize:".6rem",fontWeight:900,color:"rgba(230,240,255,.9)",letterSpacing:.5}}>Takım Taktikleri</div>
          <div style={{fontSize:".42rem",color:"#30e070",background:"rgba(48,224,112,.1)",
            border:"1px solid rgba(48,224,112,.2)",padding:"2px 8px",borderRadius:10,fontWeight:700}}>⚡ Maça Etki Ediyor</div>
        </div>
        <div style={{fontSize:".46rem",color:"rgba(232,151,90,.8)",marginBottom:12,
          padding:"7px 10px",background:"linear-gradient(135deg,rgba(232,151,90,.1),rgba(232,151,90,.03))",
          borderRadius:7,border:"1px solid rgba(232,151,90,.18)",display:"flex",alignItems:"center",gap:6}}>
          <span style={{fontSize:".7rem",flexShrink:0}}>💡</span>
          <span>Rakip gücüne, sahaya ve rakibin oyun tarzına göre maç sonucunu <b style={{color:"#e8975a"}}>±7 OVR</b> kadar etkiler</span>
        </div>
        {scoutReport&&<ScoutReportCard opp={opp} report={scoutReport} tactic={tactic}/>}
        {tacs.map((t,ti)=>{
          const activeOpt=tactic[t.key]??1;
          const icons=["🔵","⚪","🔴"];
          const optCols=["#5dade2","#7898c0","#ff6060"];
          return(
          <div key={ti} style={{marginBottom:14,background:"linear-gradient(135deg,rgba(10,20,42,.8),rgba(7,14,30,.6))",
            borderRadius:8,padding:"8px 10px",border:"1px solid rgba(77,166,255,0.07)"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:7}}>
              <div style={{fontSize:".46rem",letterSpacing:1.2,color:"rgba(77,166,255,.5)",textTransform:"uppercase",fontWeight:700}}>{t.l}</div>
              <div style={{fontSize:".42rem",color:optCols[activeOpt],fontWeight:700,
                background:`${optCols[activeOpt]}15`,border:`1px solid ${optCols[activeOpt]}30`,
                padding:"1px 7px",borderRadius:8}}>{t.opts[activeOpt]}</div>
            </div>
            <div style={{display:"flex",gap:3,marginBottom:7,background:"rgba(0,0,0,.3)",
              borderRadius:6,padding:"2px",border:"1px solid rgba(77,166,255,0.06)"}}>
              {t.opts.map((o,oi)=>{
                const active=activeOpt===oi;
                const col=optCols[oi];
                return(
                <button key={oi} onClick={()=>setTactic(p=>({...p,[t.key]:oi}))} style={{
                  flex:1,padding:"6px 4px",cursor:"pointer",borderRadius:5,fontFamily:"inherit",
                  border:active?`1px solid ${col}55`:"1px solid transparent",
                  background:active?`linear-gradient(135deg,${col}30,${col}15)`:"transparent",
                  color:active?"#fff":"rgba(120,152,192,.45)",
                  fontSize:".52rem",fontWeight:active?800:500,
                  boxShadow:active?`0 0 10px ${col}18`:"none",transition:"all .15s"}}>{o}</button>
                );
              })}
            </div>
            <div style={{fontSize:".44rem",color:"rgba(120,152,192,.45)",fontStyle:"italic",lineHeight:1.4,paddingLeft:2}}>{t.desc[activeOpt]}</div>
          </div>
          );
        })}
        <div style={{marginTop:6,background:"linear-gradient(135deg,rgba(10,20,42,.8),rgba(7,14,30,.6))",
          borderRadius:8,padding:"8px 10px",border:"1px solid rgba(77,166,255,0.07)"}}>
          <div style={{fontSize:".46rem",color:"rgba(77,166,255,.4)",letterSpacing:1.2,
            textTransform:"uppercase",fontWeight:700,marginBottom:8}}>Özel Talimatlar</div>
          {["Hızlı Kontra","Set Pres","Geri Çekil","Oyunu Yavaşlat","İki Kanat","Orta Sahaya Baskı"].map((t,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",
              padding:"7px 2px",borderBottom:"1px solid rgba(77,166,255,0.06)"}}>
              <span style={{fontSize:".58rem",color:tactic[`tog${i}`]?"rgba(200,220,255,.85)":"rgba(120,152,192,.55)",
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
        background:"rgba(2,5,15,.6)",display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{flexShrink:0,padding:"10px 10px 0",display:"flex",flexDirection:"column",gap:8}}>
        {nextFixture?<div style={{flexShrink:0,
          background:`linear-gradient(135deg,${effStr>=oppStr?"rgba(26,184,92,.13)":"rgba(231,76,60,.13)"},rgba(10,20,42,.8))`,
          border:`1px solid ${effStr>=oppStr?"rgba(26,184,92,.22)":"rgba(231,76,60,.22)"}`,
          borderRadius:8,overflow:"hidden"}}>
          <div style={{height:2,background:`linear-gradient(90deg,transparent,${effStr>=oppStr?"#30e070":"#ff5050"},transparent)`}}/>
          <div style={{padding:"8px 10px"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
              <div style={{display:"flex",alignItems:"center",gap:5}}>
                <TeamBadge name={opp} size="md"/>
                <div style={{fontSize:".58rem",fontWeight:800,color:"rgba(230,240,255,.9)"}}>{opp}</div>
              </div>
              <span style={{fontSize:".42rem",fontWeight:700,
                color:home?"#30e070":"#ffd060",background:home?"rgba(48,224,112,.1)":"rgba(255,208,96,.1)",
                border:home?"1px solid rgba(48,224,112,.2)":"1px solid rgba(255,208,96,.2)",
                padding:"1px 5px",borderRadius:6,flexShrink:0}}>{home?"🏠 Ev":"✈️ Dep."}</span>
            </div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{textAlign:"center"}}>
                <div style={{fontSize:".32rem",color:"rgba(77,166,255,.35)",letterSpacing:.8,textTransform:"uppercase",marginBottom:2}}>Bizim Güç</div>
                <div style={{fontSize:".9rem",fontWeight:900,lineHeight:1,color:effStr>=oppStr?"#30e070":"#ff5050",textShadow:effStr>=oppStr?"0 0 12px #30e07055":"0 0 12px #ff505055"}}>{effStr}</div>
              </div>
              <div style={{textAlign:"center",padding:"0 6px"}}>
                <div style={{fontSize:".52rem",fontWeight:800,color:effStr>=oppStr+8?"#30e070":effStr>=oppStr+3?"#6fcf97":effStr>=oppStr-3?"#ffd060":"#ff6060"}}>
                  {effStr>=oppStr+8?"🔥":effStr>=oppStr+3?"✅":effStr>=oppStr-3?"⚖️":"⚠️"}
                </div>
                <div style={{fontSize:".32rem",color:"rgba(120,152,192,.4)",marginTop:1}}>
                  {effStr>=oppStr+8?"Favori":effStr>=oppStr+3?"Avantaj":effStr>=oppStr-3?"Dengeli":"Dezav."}
                </div>
              </div>
              <div style={{textAlign:"center"}}>
                <div style={{fontSize:".32rem",color:"rgba(77,166,255,.35)",letterSpacing:.8,textTransform:"uppercase",marginBottom:2}}>Rakip</div>
                <div style={{fontSize:".9rem",fontWeight:900,lineHeight:1,color:oppStr>=75?"#ff6060":oppStr>=65?"#ffd060":"#30e070"}}>{oppStr}</div>
              </div>
            </div>
          </div>
        </div>:<div style={{background:`linear-gradient(135deg,rgba(26,184,92,.12),rgba(10,20,42,.8))`,
          border:"1px solid rgba(26,184,92,.2)",borderRadius:8,padding:"8px 10px",textAlign:"center"}}>
          <div style={{fontSize:".32rem",color:"rgba(77,166,255,.35)",letterSpacing:.8,textTransform:"uppercase",marginBottom:4}}>Efektif Güç</div>
          <div style={{fontSize:".9rem",fontWeight:900,lineHeight:1,color:"#30e070"}}>{effStr}</div>
        </div>}
        <div style={{flexShrink:0,background:"linear-gradient(135deg,rgba(10,20,42,.9),rgba(7,14,30,.8))",
          border:"1px solid rgba(77,166,255,0.08)",borderRadius:8,padding:"8px 10px"}}>
          <div style={{fontSize:".38rem",color:"rgba(77,166,255,.35)",textTransform:"uppercase",letterSpacing:1.2,marginBottom:8,fontWeight:700}}>Maç Tahmini</div>
          {[["Galibiyet",winProb,C.grn2],["Beraberlik",drawProb,C.gd],["Mağlubiyet",loseProb,C.red2]].map(([l,v,cc])=>(
            <div key={l} style={{marginBottom:7}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:3,alignItems:"center"}}>
                <span style={{fontSize:".44rem",color:"rgba(120,152,192,.6)",fontWeight:500}}>{l}</span>
                <span style={{fontSize:".52rem",color:cc,fontWeight:800,textShadow:`0 0 8px ${cc}44`}}>{v}%</span>
              </div>
              <div style={{height:5,background:"rgba(255,255,255,.04)",borderRadius:3,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${v}%`,background:`linear-gradient(90deg,${cc}88,${cc})`,
                  borderRadius:3,boxShadow:`0 0 6px ${cc}44`,transition:"width .4s ease"}}/>
              </div>
            </div>
          ))}
        </div>
        </div>
        <div style={{flex:1,overflowY:"auto",minHeight:0,padding:"0 10px 16px",display:"flex",flexDirection:"column",gap:8}}>
        <div style={{background:"linear-gradient(135deg,rgba(10,20,42,.9),rgba(7,14,30,.8))",
          border:"1px solid rgba(77,166,255,0.08)",borderRadius:8,padding:"8px 10px"}}>
          <div style={{fontSize:".38rem",color:"rgba(77,166,255,.35)",textTransform:"uppercase",letterSpacing:1.2,marginBottom:7,fontWeight:700}}>Taktik Etki Dökümü</div>
          {[["Hücum Baskısı",pressEffect],["Defans Hattı",defEffect],["Oyun Stili",styleEffect],["Kanat",wingEffect],["Baskı Alanı",zoneEffect],
            ...(togTotal!==0?[["Özel Talimatlar",togTotal]]:[]),
            ...(tacCoachBonus?[[`${tacCoach.n}`,tacCoachBonus]]:[]),
          ].map(([l,v],i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 0",borderBottom:"1px solid rgba(77,166,255,0.06)"}}>
              <span style={{fontSize:".44rem",color:"rgba(120,152,192,.55)"}}>{l}</span>
              <span style={{fontSize:".5rem",color:effectColor(v),fontWeight:800,background:`${effectColor(v)}12`,border:`1px solid ${effectColor(v)}25`,padding:"0 5px",borderRadius:5,minWidth:24,textAlign:"center"}}>{effectSign(v)}</span>
            </div>
          ))}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:6,paddingTop:5,borderTop:"1px solid rgba(77,166,255,0.15)"}}>
            <span style={{fontSize:".46rem",color:"rgba(200,220,255,.7)",fontWeight:700}}>Toplam</span>
            <span style={{fontSize:".72rem",fontWeight:900,color:effectColor(totalEffect),textShadow:`0 0 10px ${effectColor(totalEffect)}55`}}>{effectSign(totalEffect)}</span>
          </div>
        </div>
        <div style={{background:"linear-gradient(135deg,rgba(10,20,42,.9),rgba(7,14,30,.8))",
          border:"1px solid rgba(77,166,255,0.08)",borderRadius:8,padding:"8px 10px"}}>
          <div style={{fontSize:".38rem",color:"rgba(77,166,255,.35)",textTransform:"uppercase",letterSpacing:1.2,marginBottom:7,fontWeight:700}}>Maç Profili</div>
          {[["Oyun Tarzı",styleLabel,styleCol],["Risk",riskLabel,riskCol],["Gol Bek. (B)",myLambda,C.gd],["Gol Bek. (R)",opLambda,C.red2]].map(([l,v,cc])=>(
            <div key={l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 0",borderBottom:"1px solid rgba(77,166,255,0.06)"}}>
              <span style={{fontSize:".44rem",color:"rgba(120,152,192,.55)"}}>{l}</span>
              <span style={{fontSize:".48rem",fontWeight:700,color:cc}}>{v}</span>
            </div>
          ))}
        </div>
        <div style={{background:"linear-gradient(135deg,rgba(21,98,204,.1),rgba(21,98,204,.03))",
          border:"1px solid rgba(77,166,255,.1)",borderRadius:8,padding:"8px 10px"}}>
          <div style={{fontSize:".38rem",color:"rgba(77,166,255,.4)",textTransform:"uppercase",letterSpacing:1.2,marginBottom:7,fontWeight:700}}>Aktif Taktikler</div>
          {tacs.map((t,ti)=>(
            <div key={ti} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 0",borderBottom:"1px solid rgba(77,166,255,0.07)"}}>
              <span style={{fontSize:".42rem",color:"rgba(120,152,192,.5)"}}>{t.l}</span>
              <span style={{fontSize:".46rem",color:"rgba(200,220,255,.8)",fontWeight:700}}>{t.opts[tactic[t.key]??1]}</span>
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
