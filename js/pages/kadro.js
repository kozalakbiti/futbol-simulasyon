function PageKadro({squad,onSelectPlayer}){
  const [sort,setSort]=useState("ovr");
  const sorted=[...squad].sort((a,b)=>{
    if(sort==="val") return calcEffectiveVal(b)-calcEffectiveVal(a);
    return b[sort]-a[sort];
  });
  return(
    <div style={{flex:1,display:"flex",flexDirection:"column",minHeight:0}}>
      <div style={{padding:"8px 12px",
        borderBottom:"1px solid rgba(77,166,255,0.08)",
        background:"rgba(5,9,26,.92)",
        display:"flex",gap:4,flexShrink:0,flexWrap:"wrap",alignItems:"center"}}>
        <div style={{display:"flex",gap:3,background:"rgba(0,0,0,.4)",borderRadius:7,
          padding:"2px",border:"1px solid rgba(77,166,255,0.07)"}}>
          {[["ovr","OVR"],["pot","POT"],["age","YAŞ"],["val","DEĞER"],["sal","MAAŞ"]].map(([k,l])=>{
            const active=sort===k;
            return(
            <button key={k} onClick={()=>setSort(k)} style={{
              background:active?"linear-gradient(135deg,rgba(21,98,204,.5),rgba(21,98,204,.25))":"transparent",
              border:active?"1px solid rgba(77,166,255,.4)":"1px solid transparent",
              color:active?"#e8f4ff":"rgba(120,152,192,.5)",
              fontSize:".5rem",fontWeight:active?800:500,letterSpacing:active?.5:0,
              padding:"5px 10px",cursor:"pointer",borderRadius:5,fontFamily:"inherit",
              boxShadow:active?"0 0 10px rgba(77,166,255,.12)":"none",
              transition:"all .15s"}}>{l}</button>
            );
          })}
        </div>
        <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:5}}>
          <div style={{width:5,height:5,borderRadius:"50%",background:"rgba(77,166,255,.35)"}}/>
          <span style={{fontSize:".48rem",color:"rgba(120,152,192,.5)",fontWeight:600,letterSpacing:.3}}>{squad.length} oyuncu</span>
        </div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"6px 8px 12px",background:"rgba(3,6,18,.5)"}}>
        {/* Başlık satırı */}
        <div style={{display:"grid",gridTemplateColumns:"22px 1fr 26px 30px 26px 38px 28px 68px",
          gap:3,padding:"4px 10px",marginBottom:3,
          fontSize:".38rem",letterSpacing:1.4,color:"rgba(77,166,255,.3)",
          textTransform:"uppercase",fontWeight:600}}>
          <span style={{textAlign:"center"}}>#</span>
          <span>Ad</span>
          <span style={{textAlign:"center"}}>Yaş</span>
          <span style={{textAlign:"center"}}>OVR</span>
          <span style={{textAlign:"center"}}>Moral</span>
          <span>Gel.</span>
          <span style={{textAlign:"center"}}>Değ.</span>
          <span>Durum</span>
        </div>
        {sorted.map((pl,i)=>{
          const moral=pl.moral??75;
          const injured=pl.injured||0;
          const gap=pl.pot-pl.ovr;
          const moralCol=moral>=80?"#30e070":moral>=60?"#ffd060":moral>=40?"#e67e22":"#ff5050";
          const moralIcon=moral>=80?"😄":moral>=60?"🙂":moral>=40?"😐":"😞";
          const devCol=gap>=10?C.grn2:gap>=5?C.ac2:gap>=2?C.gd:"rgba(77,166,255,.2)";
          const ovrCol=pl.ovr>=90?"#ff3030":pl.ovr>=84?"#ff6060":pl.ovr>=80?"#ffd060":pl.ovr>=75?"#4da6ff":pl.ovr>=70?"#30e070":"rgba(120,152,192,.8)";
          return(
          <div key={pl.id} onClick={()=>onSelectPlayer(pl)}
            style={{display:"grid",gridTemplateColumns:"22px 1fr 26px 30px 26px 38px 28px 68px",
              gap:3,alignItems:"center",padding:"6px 10px",
              marginBottom:2,
              borderRadius:7,cursor:"pointer",
              background:injured>0
                ?"linear-gradient(135deg,rgba(231,76,60,.1),rgba(231,76,60,.04))"
                :"linear-gradient(135deg,rgba(10,20,42,.85),rgba(7,14,30,.8))",
              border:`1px solid ${injured>0?"rgba(231,76,60,.2)":"rgba(77,166,255,0.07)"}`,
              borderLeft:`3px solid ${injured>0?"rgba(231,76,60,.5)":pl.ovr>=84?"rgba(255,90,90,.4)":pl.ovr>=80?"rgba(255,208,96,.4)":pl.ovr>=75?"rgba(77,166,255,.4)":"rgba(77,166,255,.15)"}`,
              boxShadow:"inset 0 1px 0 rgba(255,255,255,.02)",
              transition:"all .15s"}}
            onMouseEnter={e=>{e.currentTarget.style.background=injured>0?"linear-gradient(135deg,rgba(220,60,50,.15),rgba(180,40,40,.08))":"linear-gradient(135deg,rgba(12,28,60,.95),rgba(8,16,36,.9))";e.currentTarget.style.borderColor=injured>0?"rgba(220,60,50,.35)":"rgba(77,168,255,.3)";}}
            onMouseLeave={e=>{e.currentTarget.style.background=injured>0?"linear-gradient(135deg,rgba(220,60,50,.12),rgba(180,40,40,.05))":"linear-gradient(135deg,rgba(8,18,38,.9),rgba(5,12,26,.85))";e.currentTarget.style.borderColor=injured>0?"rgba(220,60,50,.2)":"rgba(77,168,255,0.08)";}}>
            <span style={{fontSize:".44rem",color:"rgba(77,166,255,.25)",textAlign:"center",fontWeight:600}}>{i+1}</span>
            <div style={{display:"flex",alignItems:"center",gap:5,overflow:"hidden"}}>
              <PosTag pos={pl.pos} small/>
              <span style={{fontSize:".62rem",fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",
                whiteSpace:"nowrap",color:injured>0?"rgba(255,120,120,.9)":"rgba(230,240,255,.9)",
                letterSpacing:.1}}>{pl.n}</span>
            </div>
            <span style={{textAlign:"center",fontSize:".56rem",color:"rgba(120,152,192,.7)",fontWeight:500}}>{pl.age}</span>
            <div style={{textAlign:"center"}}>
              <span style={{fontSize:".68rem",fontWeight:900,color:ovrCol,
                textShadow:`0 0 8px ${ovrCol}44`}}>{pl.ovr}</span>
            </div>
            <span style={{textAlign:"center",fontSize:".6rem"}} title={`Moral: ${moral}`}>{moralIcon}</span>
            <div style={{display:"flex",alignItems:"center",gap:2}}>
              <div style={{flex:1,height:3,background:"rgba(255,255,255,.05)",borderRadius:2,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${Math.min(100,pl.devPoints||0)}%`,
                  background:`linear-gradient(90deg,${devCol}88,${devCol})`,borderRadius:2}}/>
              </div>
              <span style={{fontSize:".38rem",color:devCol,minWidth:14,fontWeight:700}}>+{gap}</span>
            </div>
            <span style={{fontSize:".54rem",fontWeight:700,
              color:pl.st==="free"?"#30e070":"rgba(255,208,96,.8)",textAlign:"center"}}>
              {calcEffectiveVal(pl)}M
            </span>
            <div style={{display:"flex",gap:2,flexWrap:"wrap",alignItems:"center"}}>
              {injured>0&&<Chip color="red" small>{pl.injSev===3?"🆘":pl.injSev===2?"🏥":"🩹"}{injured}h</Chip>}
              {!injured&&(pl.fatigue||0)>70&&<Chip color="red" small>😓{pl.fatigue||0}</Chip>}
              {!injured&&(pl.fatigue||0)>40&&(pl.fatigue||0)<=70&&<Chip color="gold" small>😰{pl.fatigue||0}</Chip>}
              {!injured&&pl.pendingJoin&&<Chip color="gold" small>⏳PEN</Chip>}
              {!injured&&!pl.pendingJoin&&pl.listed&&<Chip color="gold" small>LIST</Chip>}
              {!injured&&!pl.pendingJoin&&pl.ct<=0&&<Chip color="red" small>⚠️BİTTİ</Chip>}
              {!injured&&!pl.pendingJoin&&pl.ct===1&&<Chip color="gold" small>SON YIL</Chip>}
              {(pl.traits||[]).slice(0,1).map(t=>{
                const tr=PLAYER_TRAITS[t];
                return tr?<span key={t} style={{fontSize:".34rem",padding:"1px 4px",borderRadius:5,
                  background:"rgba(155,89,182,.12)",border:"1px solid rgba(155,89,182,.25)",
                  color:"#b39ddb"}}>{tr.icon}</span>:null;
              })}
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}
