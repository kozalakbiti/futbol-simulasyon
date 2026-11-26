// ─── FİKSTÜR ─────────────────────────────────────────────────
// ─── MAÇ DETAY MODALİ ────────────────────────────────────────
function MatchDetailModal({match,clubName,season,onClose}){
  if(!match) return null;
  const isW=match.r==="W", isD=match.r==="D", isL=match.r==="L";
  const resColor=isW?C.grn:isD?C.gd:C.red;
  const resBg=isW?"rgba(24,179,82,.12)":isD?"rgba(200,153,42,.10)":"rgba(196,32,48,.12)";
  const resLabel=isW?"GALİBİYET":isD?"BERABERLİK":"MAĞLUBIYET";
  const st=match.stats||{};
  const scorers=match.scorers||[];
  const assisters=match.assisters||[];
  const compLabel=(c)=>c==="ZTK"?"🏆 Ulusal Kupa":c==="HAZ"?"⚽ Hazırlık":c==="CL"?"⭐ Avrupa Şampiyonlar Kupası":c==="UEFA"?"🇪🇺 AL":c==="SL"?"Elit Lig":c==="TFF1"?"1. Lig":c==="Portekiz Ligi"?"Portekiz Ligi":c==="İngiliz 2. Ligi"?"İngiliz 2. Ligi":c==="Hollanda Ligi"?"Hollanda Ligi":c||"Lig Maçı";

  // Penaltı bilgisi: kayıtlıysa doğrudan kullan, yoksa aggregate'den hesapla
  const penInfo=(()=>{
    if(match.pen) return {hasPen:true,won:match.penWon,my:match.penMy,op:match.penOp};
    // Eski maçlar için: 2. maç mı ve aggregate eşit mi?
    const round=match.round||"";
    const isSecondLeg=round.includes("2. Maç")||round==="Final";
    const isKO=(match.comp==="CL"||match.comp==="UEFA"||match.comp==="ZTK");
    if(!isSecondLeg||!isKO||!season) return null;
    // 1. maçı bul
    const firstRound=round.replace("2. Maç","1. Maç");
    const r1=(season.results||[]).filter(r=>r.comp===match.comp&&r.round===firstRound&&r.opp===match.opp).slice(-1)[0];
    if(!r1) return null;
    const myTot=(r1.myG||0)+(match.myG||0);
    const opTot=(r1.opG||0)+(match.opG||0);
    if(myTot!==opTot) return null;
    // Aggregate eşit — penaltı olmalı, sonucu r'den çıkar
    const won=match.r==="W"||(match.r==="D"&&(r1.myG||0)>(r1.opG||0)===false); // Basit: W ise kazandı
    // Gerçek kazanan: bir sonraki maç var mı kontrol et
    const nextRounds={"Son 16 — 2. Maç":"Çeyrek Final — 1. Maç","Çeyrek Final — 2. Maç":"Yarı Final — 1. Maç","Yarı Final — 2. Maç":"Final","Final":"SAMPIYON"};
    const nextRound=nextRounds[round];
    const advanced=nextRound?(season.results||[]).some(r=>r.comp===match.comp&&r.round===nextRound&&r.opp!==match.opp)||(season.fixture||[]).some(f=>f.comp===match.comp&&f.round===nextRound):match.r==="W";
    return {hasPen:true,won:advanced,my:"?",op:"?"};
  })();

  const statRow=(label,myVal,opVal,icon)=>{
    const total=(myVal||0)+(opVal||0)||1;
    const myPct=Math.round(((myVal||0)/total)*100);
    const opPct=100-myPct;
    return(
      <div style={{marginBottom:8}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
          <span style={{fontSize:".62rem",fontWeight:700,color:C.wh}}>{myVal||0}</span>
          <span style={{fontSize:".55rem",color:C.dim}}>{icon} {label}</span>
          <span style={{fontSize:".62rem",fontWeight:700,color:C.wh}}>{opVal||0}</span>
        </div>
        <div style={{display:"flex",height:4,borderRadius:2,overflow:"hidden"}}>
          <div style={{width:myPct+"%",background:C.ac2,transition:"width .4s"}}/>
          <div style={{width:opPct+"%",background:"rgba(255,74,74,.5)",transition:"width .4s"}}/>
        </div>
      </div>
    );
  };

  const goalerList=scorers.map((name,i)=>({name,assist:assisters[i]||null}));
  const uniqueScorers=[...new Map(goalerList.map(g=>[g.name,g])).values()];
  const scorerCounts=scorers.reduce((acc,n)=>{acc[n]=(acc[n]||0)+1;return acc;},{});

  const posPct=st.myPasses&&st.opPasses?Math.round((st.myPasses/(st.myPasses+st.opPasses))*100):null;

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.75)",zIndex:9000,display:"flex",flexDirection:"column",overflowY:"auto"}}
      onClick={onClose}>
      <div style={{margin:"auto",width:"100%",maxWidth:420,background:C.card,borderRadius:12,overflow:"hidden"}}
        onClick={e=>e.stopPropagation()}>

        {/* Header */}
        <div style={{background:resBg,borderBottom:`1px solid ${resColor}33`,padding:"14px 16px 12px",textAlign:"center",position:"relative"}}>
          <div style={{fontSize:".5rem",fontWeight:700,letterSpacing:3,color:resColor,textTransform:"uppercase",marginBottom:4}}>{resLabel}</div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:12,marginBottom:6}}>
            <div style={{fontSize:".65rem",fontWeight:700,color:C.wh,flex:1,textAlign:"right"}}>{clubName}</div>
            <div style={{fontSize:"2rem",fontWeight:900,letterSpacing:4,color:C.wh,minWidth:70,textAlign:"center"}}>{match.s}</div>
            <div style={{fontSize:".65rem",fontWeight:700,color:C.dim,flex:1,textAlign:"left"}}>{match.opp}</div>
          </div>
          <div style={{fontSize:".5rem",color:C.dim}}>{match.home?"🏠 Ev Sahibi":"✈️ Deplasman"} · {compLabel(match.comp)} · {match.month} {match.w?"· Hafta "+match.w:""}</div>
          <button onClick={onClose} style={{position:"absolute",top:10,right:12,background:"none",border:"none",color:C.dim,fontSize:"1rem",cursor:"pointer",padding:4}}>✕</button>
        </div>

        {/* Penaltı bilgisi */}
        {penInfo&&(
          <div style={{padding:"8px 14px",borderBottom:`1px solid ${C.brd2}`,display:"flex",alignItems:"center",justifyContent:"center",gap:8,background:penInfo.won?"rgba(24,179,82,.08)":"rgba(196,32,48,.08)"}}>
            <span style={{fontSize:"1rem"}}>{penInfo.won?"🟢":"🔴"}</span>
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:".52rem",fontWeight:700,color:penInfo.won?C.grn2:C.red2,letterSpacing:1}}>
                PENALTİLAR — {penInfo.won?"KAZANILDI":"KAYBEDİLDİ"}
              </div>
              {penInfo.my!=="?"&&(
                <div style={{fontSize:".72rem",fontWeight:900,color:C.wh,letterSpacing:3,marginTop:2}}>
                  {penInfo.my} – {penInfo.op}
                </div>
              )}
            </div>
            <span style={{fontSize:"1rem"}}>{penInfo.won?"🏆":"😔"}</span>
          </div>
        )}

        {/* Goller */}
        {goalerList.length>0&&(
          <div style={{padding:"10px 14px",borderBottom:`1px solid ${C.brd2}`}}>
            <div style={{fontSize:".52rem",fontWeight:700,color:C.ac2,letterSpacing:2,marginBottom:6}}>⚽ GOLLER</div>
            {goalerList.map((g,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
                <div style={{width:18,height:18,borderRadius:"50%",background:C.ac3,display:"flex",alignItems:"center",justifyContent:"center",fontSize:".5rem"}}>⚽</div>
                <div>
                  <span style={{fontSize:".65rem",fontWeight:700,color:C.wh}}>{g.name}</span>
                  {scorerCounts[g.name]>1&&goalerList.filter(x=>x.name===g.name).indexOf(g)===0&&<span style={{fontSize:".5rem",color:C.gd,marginLeft:4}}>×{scorerCounts[g.name]}</span>}
                  {g.assist&&<span style={{fontSize:".55rem",color:C.dim,marginLeft:6}}>🎯 {g.assist}</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* İstatistikler */}
        {(st.myShots||st.opShots)&&(
          <div style={{padding:"10px 14px",borderBottom:`1px solid ${C.brd2}`}}>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:".5rem",color:C.dim,marginBottom:8}}>
              <span style={{fontWeight:700,color:C.ac2}}>{clubName}</span>
              <span>İSTATİSTİKLER</span>
              <span style={{fontWeight:700,color:C.red2}}>{match.opp}</span>
            </div>
            {posPct!==null&&statRow("Topa Sahip Olma",posPct,100-posPct,"🔵")}
            {statRow("Şut",st.myShots,st.opShots,"🎯")}
            {statRow("İsabetli Şut",st.myOnTarget,st.opOnTarget,"✅")}
            {statRow("Korner",st.myCorners,st.opCorners,"🚩")}
            {statRow("Faul",st.myFouls,st.opFouls,"🟡")}
            {statRow("Ofsayt",st.myOffsides,st.opOffsides,"🚫")}
          </div>
        )}

        {/* Rakip gücü */}
        {match.oppStr&&(
          <div style={{padding:"8px 14px",borderBottom:`1px solid ${C.brd2}`,display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:".52rem",color:C.dim}}>Rakip Güç:</span>
            <div style={{padding:"2px 8px",borderRadius:4,background:match.oppStr>=80?"rgba(196,32,48,.18)":match.oppStr>=70?"rgba(200,153,42,.18)":"rgba(24,179,82,.12)",fontSize:".6rem",fontWeight:700,color:match.oppStr>=80?C.red2:match.oppStr>=70?C.gd:C.grn2}}>{match.oppStr}</div>
            <div style={{flex:1,height:3,borderRadius:2,background:C.dmr,overflow:"hidden"}}>
              <div style={{width:match.oppStr+"%",height:"100%",background:match.oppStr>=80?C.red2:match.oppStr>=70?C.gd:C.grn2}}/>
            </div>
          </div>
        )}

        {/* Kapat butonu */}
        <div style={{padding:"10px 14px"}}>
          <button onClick={onClose} style={{width:"100%",padding:"9px",background:C.ac3,border:`1px solid ${C.brd}`,borderRadius:8,color:C.wh,fontSize:".62rem",fontWeight:700,cursor:"pointer"}}>Kapat</button>
        </div>
      </div>
    </div>
  );
}

function PageFikstur({season,clubName="Club Manager: Glory Road"}){
  const MONTH_ORDER=["Agustos","Eylul","Ekim","Kasim","Aralik","Ocak","Subat","Mart","Nisan","Mayis"];
  const [selectedMatch,setSelectedMatch]=useState(null);
  // Geçmiş maçlar — oynandığı sırada
  const pastFix=season.results.map((r,i)=>({
    opp:r.opp,done:true,r:r.r,s:r.s,
    home:r.home!==undefined?r.home:true,
    w:r.w||i+1,
    month:r.month||"Geçmiş",
    comp:r.comp||"SL",
    round:r.round,
    stats:r.stats,
    scorers:r.scorers,
    assisters:r.assisters,
    oppStr:r.oppStr,
    myG:r.myG,opG:r.opG,
    pen:r.pen,penWon:r.penWon,penMy:r.penMy,penOp:r.penOp,
    _idx:i
  }));
  // Gelecek maçlar: season.fixture zaten sortFixture ile doğru sırada — yeniden sıralama YOK
  const allFix=[...pastFix,...season.fixture];
  const byMonth={};
  MONTH_ORDER.forEach(m=>{byMonth[m]=[];});
  byMonth["Geçmiş"]=[];
  allFix.forEach(f=>{
    const m=f.month||"Geçmiş";
    if(!byMonth[m]) byMonth[m]=[];
    byMonth[m].push(f);
  });
  const orderedMonths=["Geçmiş",...MONTH_ORDER].filter(m=>byMonth[m]&&byMonth[m].length>0);

  const compLabel=(c)=>c==="ZTK"?"🏆 KUPA":c==="HAZ"?"⚽ HAZ":c==="CL"?"⭐ ASK":c==="UEFA"?"🇪🇺 AL":c==="SL"?"Elit":c==="TFF1"?"1.Lig":c==="Portekiz Ligi"?"Por":c==="İngiliz 2. Ligi"?"Eng2":c==="Hollanda Ligi"?"Hol":c||"Elit";
  const compColor=(c)=>c==="ZTK"?C.red2:c==="HAZ"?"#7c3aed":c==="CL"?"#ffd060":c==="UEFA"?"#e67e22":C.ac2;

  return(
    <>
    {selectedMatch&&<MatchDetailModal match={selectedMatch} clubName={clubName} season={season} onClose={()=>setSelectedMatch(null)}/>}
    <div style={{flex:1,overflowY:"auto",padding:12}}>
      <STitle extra={`${season.played} maç oynandı`}>Aylık Maç Takvimi</STitle>
      {orderedMonths.map(month=>(
        <div key={month} style={{marginBottom:16}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
            <div style={{fontSize:".6rem",fontWeight:700,letterSpacing:3,color:C.ac2,textTransform:"uppercase"}}>{month}</div>
            <div style={{flex:1,height:1,background:C.brd}}/>
            <Chip color="gray" small>{byMonth[month].length} maç</Chip>
          </div>
          {byMonth[month].map((f,i)=>(
            <div key={i}
              onClick={f.done?()=>setSelectedMatch(f):undefined}
              style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",
              borderBottom:`1px solid rgba(77,166,255,0.1)`,
              borderLeft:`3px solid ${f.done?(f.r==="W"?C.grn:f.r==="L"?C.red:C.gd):f.comp==="ZTK"?C.red2:f.comp==="CL"?"#ffd060":f.comp==="UEFA"?"#e67e22":f.comp==="HAZ"?"#7c3aed":f.home?C.ac2:C.dmr}`,
              marginBottom:2,
              cursor:f.done?"pointer":"default",
              background:f.done?"rgba(0,0,0,.15)":f.comp==="ZTK"?"rgba(192,57,43,.04)":f.comp==="CL"?"rgba(232,184,58,.06)":f.comp==="UEFA"?"rgba(230,126,34,.06)":"rgba(26,110,216,.04)",
              borderRadius:"0 3px 3px 0",
              transition:"background .12s"}}>
              <div style={{minWidth:30,fontSize:".52rem",color:f.comp==="ZTK"?C.red2:f.comp==="CL"?"#ffd060":f.comp==="UEFA"?"#e67e22":f.comp==="SUPERKUPA"?"#c0ff00":f.comp==="HAZ"?"#7c3aed":C.dmr,fontWeight:(f.comp==="ZTK"||f.comp==="HAZ"||f.comp==="CL"||f.comp==="UEFA"||f.comp==="SUPERKUPA")?700:400}}>
                {f.comp==="ZTK"?"🏆":f.comp==="CL"?"⭐":f.comp==="UEFA"?"🇪🇺":f.comp==="SUPERKUPA"?"SK":f.comp==="HAZ"?"HAZ":f.comp==="SL"?"SL":f.comp==="TFF1"?"TFF":f.comp==="Portekiz Ligi"?"POR":f.comp==="İngiliz 2. Ligi"?"ENG2":f.comp==="Hollanda Ligi"?"HOL":f.comp==="İngiliz Ligi"?"ENG":f.comp==="İspanyol Ligi"?"ESP":f.comp==="Alman Ligi"?"GER":f.comp==="İtalyan Ligi"?"ITA":f.comp==="Fransız Ligi"?"FRA":"LIG"}{(f.comp!=="ZTK"&&f.comp!=="CL"&&f.comp!=="UEFA"&&f.comp!=="SUPERKUPA"&&f.comp!=="HAZ")?f.w:""}
              </div>
              <div style={{width:28,height:28,borderRadius:"50%",
                background:f.comp==="ZTK"?"rgba(192,57,43,.2)":f.comp==="CL"?"rgba(232,184,58,.2)":f.comp==="UEFA"?"rgba(230,126,34,.2)":f.home?"rgba(45,143,255,.25)":"rgba(100,120,160,.1)",
                border:`1px solid ${f.comp==="ZTK"?C.red2:f.comp==="CL"?"#ffd060":f.comp==="UEFA"?"#e67e22":f.home?C.ac:C.brd}`,
                display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:".8rem",flexShrink:0}}>
                {f.comp==="ZTK"?"🏆":f.comp==="CL"?"⭐":f.comp==="UEFA"?"🇪🇺":f.home?"⌂":"✈"}
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:".72rem",fontWeight:f.home?600:400,color:f.home?C.wh:C.dim}}>
                  {f.home?`${clubName} — `:"vs "}{f.opp}
                </div>
                <div style={{fontSize:".52rem",color:C.dmr,marginTop:1}}>
                  {f.home?"Ev Sahibi":"Deplasman"} · <span style={{color:f.comp==="ZTK"?C.red2:C.dmr}}>{compLabel(f.comp)}</span>
                  {f.str&&!f.done&&<span> · Rakip Güç: <b style={{color:f.str>=80?C.red2:f.str>=70?C.gd:C.grn2}}>{f.str}</b></span>}
                  {f.done&&<span style={{color:C.dim,marginLeft:4}}>· Detay için tıkla</span>}
                </div>
              </div>
              {f.done
                ?<div style={{display:"flex",alignItems:"center",gap:6}}>
                  <div style={{width:18,height:18,borderRadius:2,display:"flex",alignItems:"center",justifyContent:"center",
                    fontWeight:700,fontSize:".6rem",background:f.r==="W"?"rgba(39,174,96,.25)":f.r==="D"?"rgba(200,153,42,.2)":"rgba(192,57,43,.2)",
                    color:f.r==="W"?C.grn2:f.r==="D"?C.gd:C.red2}}>{f.r}</div>
                  <div style={{fontSize:".76rem",fontWeight:700,letterSpacing:2,color:C.wh}}>{f.s}</div>
                  <div style={{fontSize:".6rem",color:C.dim}}>›</div>
                </div>
                :<Chip color={f.comp==="ZTK"?"red":f.comp==="HAZ"?"purple":f.home?"blue":"gray"} small>
                  {f.comp==="ZTK"?"KUPA":f.comp==="HAZ"?"HAZ":f.home?"EV":"DEP"}
                </Chip>}
            </div>
          ))}
        </div>
      ))}
      {orderedMonths.length===0&&<div style={{textAlign:"center",color:C.dmr,padding:24,fontSize:".72rem"}}>Fikstür yok</div>}
    </div>
    </>
  );
}
