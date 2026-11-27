function PageTakimlar({season,clubName="Club Manager: Glory Road",db=[],squad=[]}){
  const [filter,setFilter]=useState("all");
  const [sel,setSel]=useState(null);
  const [detTab,setDetTab]=useState("bilgi");
  // INIT_TEAMS ile season.teams'i birleştir — kayıt yüklense bile tüm ligler görünsün
  const allTeams=(()=>{
    const seasonMap={};
    (season.teams||[]).forEach(t=>{ seasonMap[t.n]=t; });
    return INIT_TEAMS.map(t=>seasonMap[t.n]?{...t,...seasonMap[t.n]}:t);
  })();
  const leagues=[...new Set(allTeams.map(t=>t.lg))].sort();
  const visible=allTeams
    .filter(t=>filter==="all"||t.lg===filter)
    .sort((a,b)=>a.lg===b.lg?(b.pts-a.pts):a.lg.localeCompare(b.lg));

  if(sel){
    const lgTeams=[...allTeams].filter(t=>t.lg===sel.lg).sort((a,b)=>b.pts-a.pts);
    const rank=lgTeams.findIndex(t=>t.n===sel.n)+1;

    const posColor=(pos)=>pos==="GK"?"#f39c12":["CB","LB","RB"].includes(pos)?"#3498db":pos==="ST"?"#ff5050":"#30e070";
    const posRgb=(pos)=>pos==="GK"?"243,156,18":["CB","LB","RB"].includes(pos)?"52,152,219":pos==="ST"?"231,76,60":"46,204,113";

    const teamName=sel.me?null:(sel.name||sel.n);
    const dbPlayers=teamName?db.filter(p=>p.club===teamName).sort((a,b)=>b.ovr-a.ovr):[];
    const mySquadPlayers=sel.me?[...squad].sort((a,b)=>b.ovr-a.ovr):[];
    const displayPlayers=sel.me?mySquadPlayers:dbPlayers;
    return(
      <div style={{flex:1,display:"flex",flexDirection:"column",minHeight:0}}>
        {/* Başlık */}
        <div style={{flexShrink:0,padding:"8px 12px",borderBottom:`1px solid rgba(77,166,255,0.22)`,
          background:C.inset,display:"flex",alignItems:"center",gap:8}}>
          <button onClick={()=>setSel(null)} style={{background:"none",border:`1px solid rgba(77,166,255,0.22)`,
            color:C.dim,fontSize:".6rem",padding:"3px 8px",cursor:"pointer",borderRadius:2,fontFamily:"inherit"}}>← Geri</button>
          <span style={{fontWeight:700,fontSize:".82rem"}}>{sel.me?clubName:sel.name}</span>
          {sel.me&&<Chip color="blue" small>SENİN TAKIMIN</Chip>}
          <span style={{marginLeft:"auto",fontSize:".56rem",color:C.dim}}>{sel.lg}</span>
        </div>
        {/* Sekmeler */}
        <div style={{flexShrink:0,display:"flex",borderBottom:`1px solid rgba(77,166,255,0.1)`,background:C.inset}}>
          {[["bilgi","📊 Bilgi"],["kadro",`👥 Kadro (${displayPlayers.length})`],["dizilis","⬛ Diziliş"]].map(([k,l])=>(
            <button key={k} onClick={()=>setDetTab(k)} style={{
              flex:1,padding:"7px 0",background:detTab===k?"rgba(77,166,255,.25)":"none",
              border:"none",borderBottom:`2px solid ${detTab===k?C.ac2:"transparent"}`,
              color:detTab===k?C.wh:C.dim,fontSize:".6rem",fontWeight:detTab===k?700:400,
              cursor:"pointer",fontFamily:"inherit",transition:"all .15s"}}>
              {l}
            </button>
          ))}
        </div>

        {/* BİLGİ sekmesi */}
        {detTab==="bilgi"&&(
          <div style={{flex:1,overflowY:"auto",padding:10,display:"flex",flexDirection:"column",gap:8}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
              {[["🏟️ Stad",sel.stad||"—"],["📍 Şehir",sel.city||"—"],
                ["⚡ Güç",sel.me
                    ? (squad.length>0?Math.round(squad.reduce((s,p)=>s+p.ovr,0)/squad.length):"—")
                    : (sel.str||"—")],
                ["🏅 Lig",sel.lg||"—"],
              ].map(([l,v])=>(
                <div key={l} style={{padding:"7px 10px",background:"rgba(26,110,216,.07)",
                  border:`1px solid rgba(77,166,255,0.1)`,borderRadius:4}}>
                  <div style={{fontSize:".44rem",color:C.dmr,letterSpacing:1,marginBottom:2}}>{l}</div>
                  <div style={{fontSize:".7rem",fontWeight:600,color:C.wh}}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{padding:"8px 10px",background:C.inset,border:`1px solid rgba(77,166,255,0.1)`,borderRadius:4}}>
              <div style={{fontSize:".46rem",color:C.dmr,textTransform:"uppercase",letterSpacing:1.5,marginBottom:6}}>Sezon İstatistikleri</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:4}}>
                {[["G",sel.w,C.grn2],["B",sel.d,C.gd],["M",sel.l,C.red2],["P",sel.pts,C.ac2]].map(([l,v,c])=>(
                  <div key={l} style={{textAlign:"center",padding:"5px 0"}}>
                    <div style={{fontSize:"1rem",fontWeight:700,color:c}}>{v}</div>
                    <div style={{fontSize:".44rem",color:C.dmr}}>{l}</div>
                  </div>
                ))}
              </div>
              <div style={{height:1,background:C.brd2,margin:"6px 0"}}/>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:4}}>
                {[["Attığı",sel.gf,C.grn2],["Yediği",sel.ga,C.red2],["AG",sel.gd>0?"+"+sel.gd:sel.gd,sel.gd>=0?C.grn2:C.red2]].map(([l,v,c])=>(
                  <div key={l} style={{textAlign:"center",padding:"4px 0"}}>
                    <div style={{fontSize:".88rem",fontWeight:700,color:c}}>{v}</div>
                    <div style={{fontSize:".44rem",color:C.dmr}}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{padding:"8px 10px",background:C.inset,border:`1px solid rgba(77,166,255,0.1)`,borderRadius:4}}>
              <div style={{fontSize:".46rem",color:C.dmr,textTransform:"uppercase",letterSpacing:1.5,marginBottom:6}}>
                {sel.lg} Sıralaması
              </div>
              {lgTeams.slice(0,6).map((t,i)=>(
                <div key={t.n} style={{display:"flex",alignItems:"center",gap:6,padding:"4px 0",
                  borderBottom:`1px solid rgba(77,166,255,0.1)`,
                  background:t.n===sel.n?"rgba(45,143,255,.12)":"transparent"}}>
                  <span style={{fontSize:".52rem",color:i<3?C.gd:C.dmr,minWidth:16,textAlign:"center",fontWeight:i<3?700:400}}>{i+1}</span>
                  <span style={{flex:1,fontSize:".64rem",color:t.n===sel.n?C.ac2:C.dim,fontWeight:t.n===sel.n?700:400}}>{t.me?clubName:t.name}</span>
                  <span style={{fontSize:".68rem",fontWeight:700,color:t.n===sel.n?C.ac2:C.wh}}>{t.pts}</span>
                </div>
              ))}
              {lgTeams.length>6&&rank>6&&(
                <div style={{display:"flex",alignItems:"center",gap:6,padding:"4px 0",background:"rgba(45,143,255,.12)"}}>
                  <span style={{fontSize:".52rem",color:C.ac2,minWidth:16,textAlign:"center",fontWeight:700}}>{rank}</span>
                  <span style={{flex:1,fontSize:".64rem",color:C.ac2,fontWeight:700}}>{sel.me?clubName:sel.name}</span>
                  <span style={{fontSize:".68rem",fontWeight:700,color:C.ac2}}>{sel.pts}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* KADRO sekmesi */}
        {detTab==="kadro"&&(
          <div style={{flex:1,display:"flex",flexDirection:"column",minHeight:0}}>
            {/* Sabit başlık satırı */}
            <div style={{flexShrink:0,display:"grid",gridTemplateColumns:"36px 1fr 30px 26px 36px",
              padding:"4px 8px",fontSize:".38rem",color:C.dmr,letterSpacing:.8,textTransform:"uppercase",
              borderBottom:`1px solid rgba(77,166,255,0.1)`,background:C.inset}}>
              <span>POS</span><span>OYUNCU</span>
              <span style={{textAlign:"center"}}>MİL</span>
              <span style={{textAlign:"center"}}>YAŞ</span>
              <span style={{textAlign:"center",fontWeight:700}}>OVR</span>
            </div>
            {/* Kaydırılabilir oyuncu listesi */}
            <div style={{flex:1,overflowY:"auto"}}>
              {displayPlayers.length===0?(
                <div style={{padding:"20px",textAlign:"center",fontSize:".6rem",color:C.dmr}}>
                  Kadro verisi bulunamadı
                </div>
              ):displayPlayers.map((p,i)=>(
                <div key={p.id||i} style={{display:"grid",gridTemplateColumns:"36px 1fr 30px 26px 36px",
                  padding:"6px 8px",borderBottom:`1px solid rgba(77,166,255,0.1)`,alignItems:"center",
                  background:i%2===0?C.surface:"transparent"}}>
                  <div>
                    <span style={{fontSize:".42rem",fontWeight:700,color:posColor(p.pos),
                      background:`rgba(${posRgb(p.pos)},.18)`,padding:"2px 3px",borderRadius:2}}>
                      {p.pos}
                    </span>
                  </div>
                  <span style={{fontSize:".62rem",color:p.ovr>=85?C.wh:C.dim,overflow:"hidden",
                    textOverflow:"ellipsis",whiteSpace:"nowrap",fontWeight:p.ovr>=85?600:400}}>
                    {p.n}
                  </span>
                  <span style={{textAlign:"center",fontSize:".48rem",color:C.dmr}}>{p.nat||"—"}</span>
                  <span style={{textAlign:"center",fontSize:".54rem",color:C.dmr}}>{p.age}</span>
                  <span style={{textAlign:"center",fontSize:".68rem",fontWeight:700,
                    color:p.ovr>=85?C.grn2:p.ovr>=75?C.ac2:p.ovr>=65?C.gd:C.dim}}>
                    {p.ovr}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DİZİLİŞ sekmesi */}
        {detTab==="dizilis"&&(()=>{
          const players=sel.me?[...squad].sort((a,b)=>b.ovr-a.ovr):db.filter(p=>p.club===(sel.name||sel.n)).sort((a,b)=>b.ovr-a.ovr);
          const autoForm=getTeamFormation(players, sel.me?null:(sel.name||sel.n));
          const slots=FDATA[autoForm]||FDATA["4-4-2"];
          const autoLu=buildTeamLineup(players,autoForm);
          const posColor2=(pos)=>pos==="GK"?"#f39c12":["CB","LB","RB"].includes(pos)?"#3498db":pos==="ST"?"#ff5050":["CAM","CDM"].includes(pos)?"#9b59b6":"#30e070";
          return(
            <div style={{flex:1,display:"flex",flexDirection:"column",minHeight:0,overflow:"hidden"}}>
              {/* Formasyon etiketi */}
              <div style={{flexShrink:0,padding:"4px 8px",background:"rgba(45,143,255,.12)",
                borderBottom:`1px solid rgba(77,166,255,0.1)`,display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:".48rem",color:C.dmr}}>Formasyon</span>
                <span style={{fontSize:".72rem",fontWeight:800,color:C.ac2,letterSpacing:2}}>{autoForm}</span>
                <span style={{fontSize:".44rem",color:C.dmr,marginLeft:"auto"}}>Kadro yapısına göre otomatik</span>
              </div>
              {/* Saha */}
              <div style={{flex:1,minHeight:0,position:"relative",
                background:"linear-gradient(180deg,#164d24 0%,#1b5e2c 10%,#164d24 20%,#1b5e2c 30%,#164d24 40%,#1b5e2c 50%,#164d24 60%,#1b5e2c 70%,#164d24 80%,#1b5e2c 90%,#164d24 100%)",
                overflow:"hidden"}}>
                {/* Saha çizgileri */}
                <div style={{position:"absolute",inset:0,pointerEvents:"none"}}>
                  <div style={{position:"absolute",width:"100%",height:1,background:C.brd,top:"50%"}}/>
                  <div style={{position:"absolute",width:"60%",height:"18%",border:`1px solid ${C.brd}`,bottom:0,left:"20%"}}/>
                  <div style={{position:"absolute",width:"60%",height:"18%",border:`1px solid ${C.brd}`,top:0,left:"20%"}}/>
                  <div style={{position:"absolute",width:"28%",height:"7%",border:`1px solid ${C.brd}`,bottom:0,left:"36%"}}/>
                  <div style={{position:"absolute",width:"28%",height:"7%",border:`1px solid ${C.brd}`,top:0,left:"36%"}}/>
                  <div style={{position:"absolute",width:40,height:40,borderRadius:"50%",
                    border:`1px solid ${C.brd}`,top:"50%",left:"50%",transform:"translate(-50%,-50%)"}}/>
                </div>
                {/* Oyuncular */}
                {slots.map((s,idx)=>{
                  const sqIdx=autoLu[idx];
                  const pl=players[sqIdx];
                  if(!pl) return null;
                  const pc=posColor2(pl.pos);
                  return(
                    <div key={idx} style={{
                      position:"absolute",
                      left:`${s.x}%`,top:`${s.y}%`,
                      transform:"translate(-50%,-50%)",
                      display:"flex",flexDirection:"column",alignItems:"center",gap:1,
                      zIndex:2}}>
                      <div style={{
                        width:26,height:26,borderRadius:"50%",
                        background:`radial-gradient(circle at 35% 35%,${pc}dd,${pc}88)`,
                        border:`2px solid ${pc}`,
                        display:"flex",alignItems:"center",justifyContent:"center",
                        fontSize:".42rem",fontWeight:800,color:"#fff",
                        boxShadow:`0 0 6px ${pc}66`}}>
                        {s.p}
                      </div>
                      <div style={{
                        background:"rgba(0,0,0,.75)",
                        border:`1px solid ${pc}66`,
                        borderRadius:2,padding:"1px 3px",
                        fontSize:".36rem",color:C.wh,
                        maxWidth:42,overflow:"hidden",textOverflow:"ellipsis",
                        whiteSpace:"nowrap",textAlign:"center"}}>
                        {pl.n.split(".")[1]||pl.n}
                      </div>
                      <div style={{fontSize:".34rem",fontWeight:700,color:pc}}>{pl.ovr}</div>
                    </div>
                  );
                })}
              </div>
              {/* Yedekler */}
              <div style={{flexShrink:0,padding:"4px 6px",borderTop:`1px solid rgba(77,166,255,0.1)`,
                background:"rgba(0,0,0,.25)"}}>
                <div style={{fontSize:".38rem",color:C.dmr,marginBottom:3,textTransform:"uppercase",letterSpacing:1}}>
                  Yedekler
                </div>
                <div style={{display:"flex",flexWrap:"wrap",gap:3}}>
                  {players.slice(0).filter((_,i)=>!autoLu.includes(i)).slice(0,10).map((p,i)=>(
                    <div key={i} style={{
                      display:"flex",alignItems:"center",gap:2,
                      background:C.surface,border:`1px solid rgba(77,166,255,0.1)`,
                      borderRadius:2,padding:"2px 4px"}}>
                      <span style={{fontSize:".36rem",fontWeight:700,color:posColor2(p.pos)}}>{p.pos}</span>
                      <span style={{fontSize:".38rem",color:C.dim}}>{p.n.split(".")[1]||p.n}</span>
                      <span style={{fontSize:".38rem",fontWeight:700,color:C.dmr}}>{p.ovr}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}

      </div>
    );
  }

  return(
    <div style={{flex:1,display:"flex",flexDirection:"column",minHeight:0}}>
      {/* Lig filtresi — yatay kaydırmalı butonlar */}
      <div style={{flexShrink:0,borderBottom:`1px solid rgba(77,166,255,0.1)`,background:C.nav,
        overflowX:"auto",overflowY:"hidden",WebkitOverflowScrolling:"touch",
        scrollbarWidth:"none",msOverflowStyle:"none",
        display:"flex",flexDirection:"row",alignItems:"stretch",
        minWidth:0,width:"100%"}}>
        {[["all","Tümü"],...leagues.map(lg=>[lg,lg])].map(([key,label])=>{
          const active=filter===key;
          const shortLabel={"İngiliz Ligi":"Eng","İspanyol Ligi":"Esp","Alman Ligi":"Ger","İtalyan Ligi":"Ita","Fransız Ligi":"Fra","Hollanda Ligi":"Hol","Portekiz Ligi":"Por","İngiliz 2. Ligi":"Eng2","1. Lig":"1.Lig","Elit Lig":"Elit"}[label]||label;
          const count=key==="all"?allTeams.length:allTeams.filter(t=>t.lg===key).length;
          return(
            <button key={key} onClick={()=>setFilter(key)} style={{
              flexShrink:0,padding:"8px 10px",
              background:active?"rgba(77,166,255,.25)":"transparent",
              border:"none",
              borderBottom:`2px solid ${active?C.ac2:"transparent"}`,
              color:active?C.wh:C.dim,
              fontSize:".52rem",fontWeight:active?700:400,
              cursor:"pointer",fontFamily:"inherit",
              display:"flex",flexDirection:"column",alignItems:"center",gap:1,
              transition:"all .12s",whiteSpace:"nowrap"}}>
              <span>{shortLabel}</span>
              <span style={{fontSize:".38rem",color:active?C.ac2:C.dmr,fontWeight:700}}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Takım listesi */}
      <div style={{flex:1,overflowY:"auto",background:C.bg}}>
        {(() => {
          const grouped={};
          visible.forEach(t=>{
            if(!grouped[t.lg]) grouped[t.lg]=[];
            grouped[t.lg].push(t);
          });
          return Object.entries(grouped).map(([lg,lgTeams])=>(
            <div key={lg}>
              {/* Lig başlığı */}
              <div style={{
                padding:"5px 10px",
                background:"linear-gradient(90deg,rgba(26,110,216,.22) 0%,rgba(26,110,216,.06) 100%)",
                borderTop:`1px solid rgba(26,110,216,.2)`,
                borderBottom:`1px solid rgba(26,110,216,.15)`,
                display:"flex",alignItems:"center",justifyContent:"space-between"
              }}>
                <span style={{fontSize:".46rem",fontWeight:800,color:C.ac2,
                  letterSpacing:2,textTransform:"uppercase"}}>{lg}</span>
                <span style={{fontSize:".4rem",color:C.dmr,fontWeight:600}}>{lgTeams.length} takım</span>
              </div>

              {/* Kolon başlıkları */}
              <div style={{
                display:"grid",gridTemplateColumns:"22px 1fr 26px 26px 26px 26px 32px",
                padding:"3px 10px",
                fontSize:".36rem",color:C.dmr,letterSpacing:1,textTransform:"uppercase",
                background:C.nav,borderBottom:`1px solid rgba(77,166,255,0.1)`
              }}>
                <span>#</span><span>Takım</span>
                <span style={{textAlign:"center"}}>O</span>
                <span style={{textAlign:"center"}}>G</span>
                <span style={{textAlign:"center"}}>B</span>
                <span style={{textAlign:"center"}}>M</span>
                <span style={{textAlign:"center",fontWeight:700}}>P</span>
              </div>

              {/* Takım satırları */}
              {lgTeams.map((t,i)=>{
                const rankColor=i===0?"#ffd060":i===1?"#b8c8d8":i===2?"#c88840":C.dmr;
                const strColor=t.str>=85?C.grn2:t.str>=75?C.ac2:t.str>=65?C.gd:C.dim;
                const isMe=t.me;
                return(
                  <div key={t.n} onClick={()=>{ setSel(t); setDetTab("bilgi"); }}
                    style={{
                      display:"grid",gridTemplateColumns:"22px 1fr 26px 26px 26px 26px 32px",
                      padding:"6px 10px",
                      borderBottom:`1px solid rgba(77,166,255,0.1)`,
                      cursor:"pointer",
                      background:isMe?"rgba(45,143,255,.12)":i%2===0?C.surface:"transparent",
                      borderLeft:`3px solid ${i<3?rankColor:isMe?C.ac2:"transparent"}`,
                    }}
                    onMouseEnter={e=>{ e.currentTarget.style.background="rgba(45,143,255,.12)"; }}
                    onMouseLeave={e=>{ e.currentTarget.style.background=isMe?"rgba(45,143,255,.12)":i%2===0?C.surface:"transparent"; }}>

                    {/* Sıra no */}
                    <span style={{fontSize:".54rem",fontWeight:700,alignSelf:"center",color:rankColor}}>
                      {i+1}
                    </span>

                    {/* Takım adı + güç bar */}
                    <div style={{minWidth:0,alignSelf:"center"}}>
                      <div style={{fontSize:".64rem",fontWeight:isMe?700:400,
                        color:isMe?C.ac2:C.wh,
                        overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                        {isMe?"▶ ":""}{isMe?clubName:t.name}
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:3,marginTop:1}}>
                        <div style={{width:24,height:2,background:C.brd2,borderRadius:1,overflow:"hidden"}}>
                          <div style={{height:"100%",width:`${Math.min(100,t.str)}%`,background:strColor}}/>
                        </div>
                        <span style={{fontSize:".38rem",color:strColor,fontWeight:700}}>{t.str}</span>
                      </div>
                    </div>

                    {/* İstatistikler */}
                    <span style={{textAlign:"center",fontSize:".56rem",color:C.dim,alignSelf:"center"}}>{t.w+t.d+t.l}</span>
                    <span style={{textAlign:"center",fontSize:".58rem",color:C.grn2,fontWeight:600,alignSelf:"center"}}>{t.w}</span>
                    <span style={{textAlign:"center",fontSize:".56rem",color:C.gd,alignSelf:"center"}}>{t.d}</span>
                    <span style={{textAlign:"center",fontSize:".56rem",color:C.red2,alignSelf:"center"}}>{t.l}</span>
                    <span style={{textAlign:"center",fontSize:".72rem",fontWeight:800,
                      color:isMe?C.ac2:C.wh,alignSelf:"center"}}>{t.pts}</span>
                  </div>
                );
              })}
            </div>
          ));
        })()}
      </div>
    </div>
  );
}
