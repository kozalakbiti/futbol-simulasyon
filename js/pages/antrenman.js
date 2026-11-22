// ─── ANTRENMAN ────────────────────────────────────────────────
// Antrenman odakları — her biri gelişimi farklı etkiler
const TRAIN_FOCUS=[
  {key:"balanced",  label:"Dengeli",     icon:"⚖️",  desc:"Tüm özellikler dengeli gelişir.",        devMult:1.0, statBonus:{}},
  {key:"shooting",  label:"Şut",         icon:"🎯",  desc:"Gol ve şut gücü öncelikli artar.",       devMult:1.15,statBonus:{sht:1}},
  {key:"physical",  label:"Fizik",       icon:"💪",  desc:"Güç ve dayanıklılık odaklı. Sakatlık riski azalır.", devMult:1.1, statBonus:{spd:1}, injMult:0.6},
  {key:"passing",   label:"Pas",         icon:"🔁",  desc:"Pas isabeti ve top kontrolü artar.",     devMult:1.1, statBonus:{pas:1}},
  {key:"defending", label:"Defans",      icon:"🛡️",  desc:"Savunma pozisyonları için özel çalışma.",devMult:1.1, statBonus:{def:1}},
  {key:"mental",    label:"Mental",      icon:"🧠",  desc:"Moral tabanı yükselir, baskı altında daha iyi performans.",devMult:1.05,moralBase:82},
  {key:"recovery",  label:"Toparlanma",  icon:"🩺",  desc:"Sakatlanma riski yarı yarıya düşer. Gelişim yavaşlar.",  devMult:0.7, injMult:0.4},
];

function PageAntrenman({coaches,onHire,onAssign,squad=[],trainFocus,setTrainFocus,setSquad=()=>{}}){
  const [tab,setTab]=useState("coaches");
  const [selPlayer,setSelPlayer]=useState(null);
  const [selAssignCoach,setSelAssignCoach]=useState(null);
  const activeTeam=coaches.filter(c=>c.hired&&c.type==="team");
  const activePlayer=coaches.filter(c=>c.hired&&c.type==="player");
  const teamCoaches=coaches.filter(c=>c.type==="team");
  const playerCoaches=coaches.filter(c=>c.type==="player");

  const CoachCard=({c,side})=>{
    const isTeam=c.type==="team";
    const accentCol=isTeam?"#ffd060":"#30e070";
    const accentBg=isTeam?"rgba(232,184,58,.12)":"rgba(46,204,113,.1)";
    const accentBrd=isTeam?"rgba(232,184,58,.3)":"rgba(39,174,96,.25)";
    const bonusEntries=isTeam
      ?Object.entries(c.teamBonuses||{})
      :Object.entries(c.playerBonuses||{});
    const bonusLabels={
      attack:"Hücum",defense:"Savunma",passing:"Pas",tacticBonus:"Taktik",
      counterAttack:"Kontra",possession:"Top Kontrolü",defLine:"Savunma Hattı",
      morale:"Moral",u23DevMult:"U23 Gelişim",u21DevMult:"U21 Gelişim",potBoost:"Potansiyel",
      globalDevMult:"Genel Gelişim",statBoost:"İstat. Artış",injMult:"Sak. Riski",
      spdBoost:"Hız Artış",seniorDevMult:"Kıdemli Gelişim",moralBase:"Moral Tabanı",setPiece:"Standart Durumlar",
      scoutAcc:"Scout İsabeti",matchup:"Taktik Eşleşme",
    };
    const fmtBonus=(k,v)=>{
      if(k==="injMult") return `×${v} azalır`;
      if(k==="scoutAcc") return `%${v}`;
      if(k==="u23DevMult"||k==="u21DevMult"||k==="globalDevMult"||k==="seniorDevMult") return `+${Math.round((v-1)*100)}%`;
      if(typeof v==="number"&&v>0) return `+${v}`;
      return `${v}`;
    };
    return(
      <div style={{background:c.hired?accentBg:"rgba(26,110,216,.04)",
        border:`1px solid ${c.hired?accentBrd:C.brd}`,borderRadius:6,padding:9,
        display:"flex",flexDirection:"column",gap:6,marginBottom:7}}>
        <div style={{display:"flex",alignItems:"flex-start",gap:7}}>
          <div style={{fontSize:"1.4rem",flexShrink:0,lineHeight:1,marginTop:1}}>{c.icon}</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:1}}>
              <span style={{fontSize:".76rem",fontWeight:700,color:c.hired?C.wh:C.dim}}>{c.n}</span>
              {c.hired
                ?<span style={{fontSize:".42rem",padding:"1px 5px",borderRadius:2,fontWeight:700,
                    background:accentBg,color:accentCol,border:`1px solid ${accentBrd}`,letterSpacing:1}}>AKTİF</span>
                :<span style={{fontSize:".44rem",padding:"1px 6px",borderRadius:2,fontWeight:700,
                    background:"rgba(200,153,42,.12)",color:C.gd,border:"1px solid rgba(200,153,42,.3)"}}>{c.cost}M€/yıl</span>}
            </div>
            <div style={{fontSize:".5rem",color:accentCol,fontWeight:600,marginBottom:2}}>{c.spec}</div>
            <div style={{fontSize:".5rem",color:C.dim,lineHeight:1.4}}>{c.desc}</div>
          </div>
        </div>
        {/* Bonus etiketleri */}
        <div style={{display:"flex",flexWrap:"wrap",gap:3}}>
          {bonusEntries.map(([k,v])=>(
            <div key={k} style={{padding:"2px 6px",borderRadius:3,fontSize:".44rem",fontWeight:700,
              background:accentBg,color:accentCol,border:`1px solid ${accentBrd}`}}>
              {bonusLabels[k]||k}: {fmtBonus(k,v)}
            </div>
          ))}
        </div>
        {/* Hire/fire */}
        <div style={{display:"flex",gap:5,alignItems:"center"}}>
          <div style={{flex:1,height:3,background:C.brd,borderRadius:2,overflow:"hidden"}}>
            <div style={{height:"100%",width:`${c.bonus*7}%`,background:accentCol}}/>
          </div>
          <span style={{fontSize:".46rem",color:C.dmr,marginRight:3}}>Güç {c.bonus}</span>
          {c.hired
            ?<Btn color="red" onClick={()=>onHire(c.id,false)} style={{fontSize:".52rem",padding:"3px 8px"}}>ÇIKAR</Btn>
            :<Btn onClick={()=>onHire(c.id,true)} style={{fontSize:".52rem",padding:"3px 8px",background:`linear-gradient(135deg,${C.ac},#0944a8)`}}>KİRALA</Btn>}
        </div>
      </div>
    );
  };

  return(
    <div style={{display:"flex",flex:1,minHeight:0,overflow:"hidden",flexDirection:"column"}}>
      {/* Sekme bar */}
      <div style={{display:"flex",borderBottom:`1px solid rgba(77,166,255,0.22)`,flexShrink:0}}>
        {[["coaches","🧑‍🏫 Antrenörler"],["assign","👥 Oyuncu Ata"],["individual","🏋️ Bireysel Plan"]].map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)} style={{
            flex:1,padding:"8px 4px",border:"none",cursor:"pointer",fontFamily:"inherit",
            fontSize:".6rem",fontWeight:tab===k?700:400,letterSpacing:.5,
            background:tab===k?"rgba(45,143,255,.12)":"transparent",
            color:tab===k?C.wh:C.dmr,
            borderBottom:tab===k?`2px solid ${C.ac2}`:"2px solid transparent"}}>
            {l}
          </button>
        ))}
      </div>

      {tab==="coaches"&&(
        <div style={{flex:1,overflowY:"auto",padding:"10px 10px 16px"}}>
          {/* Aktif özet */}
          <div style={{display:"flex",gap:5,marginBottom:10,padding:"7px 10px",
            background:"rgba(0,0,0,.3)",borderRadius:6,border:`1px solid rgba(77,166,255,0.1)`}}>
            <div style={{flex:1,textAlign:"center"}}>
              <div style={{fontSize:".44rem",color:"#ffd060",letterSpacing:1,textTransform:"uppercase",marginBottom:2}}>Yardımcı Antrenör</div>
              <div style={{fontSize:".68rem",fontWeight:700,color:activeTeam.length?C.wh:C.dmr}}>
                {activeTeam.length?activeTeam.map(c=>c.n).join(", "):"Yok"}</div>
            </div>
            <div style={{width:1,background:C.brd2}}/>
            <div style={{flex:1,textAlign:"center"}}>
              <div style={{fontSize:".44rem",color:"#30e070",letterSpacing:1,textTransform:"uppercase",marginBottom:2}}>Oyuncu Antrenörü</div>
              <div style={{fontSize:".68rem",fontWeight:700,color:activePlayer.length?C.wh:C.dmr}}>
                {activePlayer.length?activePlayer.map(c=>c.n).join(", "):"Yok"}</div>
            </div>
          </div>

          {/* İki sütun */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {/* SOL — Takım Antrenörleri */}
            <div>
              <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:7,padding:"4px 7px",
                background:"rgba(232,184,58,.08)",borderRadius:4,border:"1px solid rgba(232,184,58,.2)"}}>
                <span style={{fontSize:".8rem"}}>🏆</span>
                <div>
                  <div style={{fontSize:".56rem",fontWeight:700,color:"#ffd060"}}>Yardımcı Antrenör</div>
                  <div style={{fontSize:".42rem",color:C.dmr}}>Maç bonusları · Maks {COACHES_MAX_TEAM} aktif</div>
                </div>
                <span style={{marginLeft:"auto",fontSize:".52rem",fontWeight:700,
                  color:activeTeam.length>=COACHES_MAX_TEAM?"#ff5050":"#ffd060"}}>
                  {activeTeam.length}/{COACHES_MAX_TEAM}
                </span>
              </div>
              {teamCoaches.map(c=><CoachCard key={c.id} c={c} side="team"/>)}
            </div>
            {/* SAĞ — Oyuncu Antrenörleri */}
            <div>
              <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:7,padding:"4px 7px",
                background:"rgba(39,174,96,.08)",borderRadius:4,border:"1px solid rgba(39,174,96,.2)"}}>
                <span style={{fontSize:".8rem"}}>🎓</span>
                <div>
                  <div style={{fontSize:".56rem",fontWeight:700,color:"#30e070"}}>Oyuncu Antrenörü</div>
                  <div style={{fontSize:".42rem",color:C.dmr}}>Oyuncu gelişimi · Maks {COACHES_MAX_PLAYER} aktif</div>
                </div>
                <span style={{marginLeft:"auto",fontSize:".52rem",fontWeight:700,
                  color:activePlayer.length>=COACHES_MAX_PLAYER?"#ff5050":"#30e070"}}>
                  {activePlayer.length}/{COACHES_MAX_PLAYER}
                </span>
              </div>
              {playerCoaches.map(c=><CoachCard key={c.id} c={c} side="player"/>)}
            </div>
          </div>
        </div>
      )}

      {tab==="individual"&&(
        <div style={{display:"flex",flex:1,minHeight:0,overflow:"hidden"}}>
          {/* Oyuncu listesi */}
          <div style={{width:130,overflowY:"auto",borderRight:`1px solid rgba(77,166,255,0.22)`,padding:"8px 0"}}>
            <div style={{fontSize:".44rem",color:C.dmr,textTransform:"uppercase",letterSpacing:1.5,padding:"0 8px 6px"}}>Kadro</div>
            {[...squad].sort((a,b)=>a.pos.localeCompare(b.pos)).map(p=>{
              const focus=trainFocus[p.id]||"balanced";
              const fDef=TRAIN_FOCUS.find(f=>f.key===focus)||TRAIN_FOCUS[0];
              const isInj=(p.injured||0)>0;
              return(
                <div key={p.id} onClick={()=>setSelPlayer(p.id)}
                  style={{padding:"5px 8px",cursor:"pointer",
                    background:selPlayer===p.id?"rgba(45,143,255,.15)":"transparent",
                    borderLeft:selPlayer===p.id?`3px solid ${C.ac2}`:"3px solid transparent",
                    opacity:isInj?0.5:1}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span style={{fontSize:".62rem",fontWeight:600,color:isInj?C.red2:C.wh,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:70}}>{p.n}</span>
                    <span style={{fontSize:".7rem"}}>{fDef.icon}</span>
                  </div>
                  <div style={{fontSize:".46rem",color:C.dmr}}>{p.pos} · OVR {p.ovr}</div>
                </div>
              );
            })}
          </div>

          {/* Sağ panel — seçili oyuncu planı */}
          <div style={{flex:1,overflowY:"auto",padding:12}}>
            {(()=>{
              const pl=squad.find(p=>p.id===selPlayer);
              if(!pl) return(
                <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",gap:8,color:C.dmr}}>
                  <div style={{fontSize:"2rem"}}>👈</div>
                  <div style={{fontSize:".62rem",textAlign:"center"}}>Sol listeden oyuncu seç</div>
                </div>
              );
              const curFocus=trainFocus[pl.id]||"balanced";
              return(
                <>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10,padding:"8px 10px",background:"rgba(26,110,216,.07)",borderRadius:6,border:`1px solid rgba(77,166,255,0.1)`}}>
                    <div style={{width:36,height:36,borderRadius:"50%",background:`linear-gradient(135deg,${C.ac},#0a3070)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.1rem",flexShrink:0}}>
                      {pl.pos==="GK"?"🧤":pl.pos==="ST"?"⚽":"👟"}
                    </div>
                    <div>
                      <div style={{fontSize:".78rem",fontWeight:700}}>{pl.n}</div>
                      <div style={{fontSize:".5rem",color:C.dim}}>{pl.pos} · {pl.age} yaş · OVR {pl.ovr} → POT {pl.pot}</div>
                    </div>
                  </div>
                  {/* Yorgunluk göstergesi */}
                  {(pl.fatigue||0)>0&&(pl.injured||0)===0&&(
                    <div style={{padding:"6px 10px",background:(pl.fatigue||0)>70?"rgba(231,76,60,.1)":"rgba(230,126,34,.08)",
                      border:`1px solid ${(pl.fatigue||0)>70?"rgba(231,76,60,.3)":"rgba(230,126,34,.3)"}`,
                      borderRadius:4,marginBottom:8}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                        <span style={{fontSize:".5rem",color:(pl.fatigue||0)>70?"#ff5050":"#e67e22",fontWeight:600}}>
                          {(pl.fatigue||0)>70?"😓 Çok Yorgun":(pl.fatigue||0)>40?"😰 Yorgun":"😊 İyi Kondisyon"}
                        </span>
                        <span style={{fontSize:".5rem",color:C.dmr}}>Yorgunluk: {pl.fatigue||0}%</span>
                      </div>
                      <div style={{height:4,background:"rgba(255,255,255,.08)",borderRadius:2,overflow:"hidden"}}>
                        <div style={{height:"100%",width:`${pl.fatigue||0}%`,
                          background:(pl.fatigue||0)>70?"#ff5050":(pl.fatigue||0)>40?"#e67e22":"#30e070",
                          borderRadius:2}}/>
                      </div>
                      {(pl.fatigue||0)>70&&<div style={{fontSize:".44rem",color:C.dmr,marginTop:3}}>
                        ⚠️ Yüksek yorgunluk performansı düşürür ve sakatlık riskini artırır
                      </div>}
                    </div>
                  )}
                  {(pl.injured||0)>0&&(
                    <div style={{padding:"8px 10px",background:"rgba(231,76,60,.1)",border:"1px solid rgba(231,76,60,.3)",borderRadius:4,marginBottom:8}}>
                      <div style={{fontSize:".58rem",color:"#ff5050",fontWeight:700,marginBottom:3}}>
                        {(pl.injSev||0)===3?"🆘 Ağır Sakatlık":(pl.injSev||0)===2?"🏥 Orta Sakatlık":"🩹 Hafif Sakatlık"}
                      </div>
                      <div style={{fontSize:".5rem",color:C.dim,marginBottom:5}}>
                        {pl.injured} hafta daha {(pl.injSev||0)===3?"sahalara dönemez":(pl.injSev||0)===2?"antrenmana katılamaz":"tedavide"}
                      </div>
                      {/* Koruyucu antrenman toggle */}
                      <div style={{display:"flex",alignItems:"center",gap:8,padding:"5px 8px",
                        background:"rgba(255,255,255,.04)",borderRadius:4,cursor:"pointer"}}
                        onClick={()=>setSquad(prev=>prev.map(p=>p.id===pl.id?{...p,protectTrain:!p.protectTrain}:p))}>
                        <div style={{width:28,height:14,borderRadius:7,position:"relative",
                          background:pl.protectTrain?"rgba(46,204,113,.5)":"rgba(255,255,255,.12)",
                          transition:"background .2s"}}>
                          <div style={{position:"absolute",top:2,left:pl.protectTrain?14:2,width:10,height:10,
                            borderRadius:"50%",background:pl.protectTrain?"#30e070":"#888",transition:"left .2s"}}/>
                        </div>
                        <div>
                          <div style={{fontSize:".52rem",color:pl.protectTrain?C.grn2:C.dim,fontWeight:600}}>
                            🛡️ Koruyucu Antrenman
                          </div>
                          <div style={{fontSize:".42rem",color:C.dmr}}>
                            {pl.protectTrain?"Aktif — iyileşme hızlanır, gelişim durur":"Pasif — normal iyileşme"}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div style={{fontSize:".48rem",color:C.dmr,textTransform:"uppercase",letterSpacing:1.5,marginBottom:6}}>Antrenman Odağı Seç</div>
                  <div style={{display:"flex",flexDirection:"column",gap:5}}>
                    {TRAIN_FOCUS.map(f=>{
                      const active=curFocus===f.key;
                      return(
                        <button key={f.key} onClick={()=>setTrainFocus(prev=>({...prev,[pl.id]:f.key}))}
                          style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",
                            borderRadius:5,cursor:"pointer",fontFamily:"inherit",textAlign:"left",
                            border:`1px solid ${active?C.ac2:C.brd}`,
                            background:active?"rgba(45,143,255,.18)":"rgba(26,110,216,.04)",
                            transition:"all .15s"}}>
                          <span style={{fontSize:"1.1rem",flexShrink:0}}>{f.icon}</span>
                          <div style={{flex:1}}>
                            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                              <span style={{fontSize:".64rem",fontWeight:active?700:400,color:active?C.wh:C.dim}}>{f.label}</span>
                              {active&&<Chip color="blue" small>AKTİF</Chip>}
                              {f.devMult>1&&<span style={{fontSize:".48rem",color:"#30e070"}}>+{Math.round((f.devMult-1)*100)}% gelişim</span>}
                              {f.devMult<1&&<span style={{fontSize:".48rem",color:"#ffd060"}}>{Math.round((f.devMult-1)*100)}% gelişim</span>}
                            </div>
                            <div style={{fontSize:".5rem",color:C.dmr,marginTop:1}}>{f.desc}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {tab==="assign"&&(
        <div style={{display:"flex",flex:1,minHeight:0,overflow:"hidden"}}>
          {/* Sol: aktif oyuncu antrenörleri listesi */}
          <div style={{width:140,overflowY:"auto",borderRight:`1px solid rgba(77,166,255,0.22)`,padding:"8px 0"}}>
            <div style={{fontSize:".44rem",color:C.dmr,textTransform:"uppercase",letterSpacing:1.5,padding:"0 8px 6px"}}>
              Oyuncu Antrenörleri
            </div>
            {activePlayer.length===0&&(
              <div style={{padding:"12px 8px",fontSize:".52rem",color:C.dmr,textAlign:"center"}}>
                Aktif antrenör yok
              </div>
            )}
            {activePlayer.map(c=>{
              const assigned=(c.assignedPlayers||[]).length;
              const max=c.maxPlayers||7;
              const full=assigned>=max;
              const sel=selAssignCoach===c.id;
              return(
                <div key={c.id} onClick={()=>setSelAssignCoach(c.id)}
                  style={{padding:"7px 8px",cursor:"pointer",
                    background:sel?"rgba(39,174,96,.15)":"transparent",
                    borderLeft:sel?`3px solid #2ecc71`:"3px solid transparent"}}>
                  <div style={{display:"flex",alignItems:"center",gap:4,marginBottom:2}}>
                    <span style={{fontSize:".8rem"}}>{c.icon}</span>
                    <span style={{fontSize:".62rem",fontWeight:600,color:sel?C.wh:C.dim,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:80}}>{c.n}</span>
                  </div>
                  <div style={{fontSize:".46rem",color:C.dmr,marginBottom:3}}>{c.spec}</div>
                  <div style={{display:"flex",alignItems:"center",gap:4}}>
                    <div style={{flex:1,height:3,background:C.brd,borderRadius:2,overflow:"hidden"}}>
                      <div style={{height:"100%",width:`${(assigned/max)*100}%`,background:full?"#ff5050":"#30e070",transition:"width .3s"}}/>
                    </div>
                    <span style={{fontSize:".48rem",fontWeight:700,color:full?"#ff5050":"#30e070",flexShrink:0}}>{assigned}/{max}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sağ: antrenöre oyuncu ata */}
          <div style={{flex:1,overflowY:"auto",padding:12}}>
            {(()=>{
              if(!selAssignCoach||!activePlayer.find(c=>c.id===selAssignCoach)){
                return(
                  <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",gap:8,color:C.dmr}}>
                    <div style={{fontSize:"2rem"}}>👈</div>
                    <div style={{fontSize:".62rem",textAlign:"center"}}>Sol taraftan antrenör seç</div>
                    {activePlayer.length===0&&<div style={{fontSize:".52rem",color:"#ffd060",textAlign:"center"}}>Önce antrenör sayfasından oyuncu antrenörü kirala</div>}
                  </div>
                );
              }
              const coach=coaches.find(c=>c.id===selAssignCoach);
              const assigned=coach.assignedPlayers||[];
              const max=coach.maxPlayers||7;
              return(
                <>
                  {/* Antrenör özet başlık */}
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10,padding:"8px 10px",
                    background:"rgba(39,174,96,.08)",borderRadius:6,border:"1px solid rgba(39,174,96,.25)"}}>
                    <span style={{fontSize:"1.6rem"}}>{coach.icon}</span>
                    <div style={{flex:1}}>
                      <div style={{fontSize:".72rem",fontWeight:700,color:C.wh}}>{coach.n}</div>
                      <div style={{fontSize:".48rem",color:"#30e070"}}>{coach.spec}</div>
                    </div>
                    <div style={{textAlign:"center"}}>
                      <div style={{fontSize:".88rem",fontWeight:800,color:assigned.length>=max?"#ff5050":"#30e070"}}>{assigned.length}/{max}</div>
                      <div style={{fontSize:".4rem",color:C.dmr}}>oyuncu</div>
                    </div>
                  </div>

                  {/* Atanmış oyuncular */}
                  {assigned.length>0&&(
                    <div style={{marginBottom:10}}>
                      <div style={{fontSize:".44rem",color:"#30e070",textTransform:"uppercase",letterSpacing:1.5,marginBottom:5}}>Atanmış Oyuncular</div>
                      <div style={{display:"flex",flexDirection:"column",gap:3}}>
                        {assigned.map(pid=>{
                          const p=squad.find(pl=>pl.id===pid);
                          if(!p) return null;
                          return(
                            <div key={pid} style={{display:"flex",alignItems:"center",gap:7,padding:"5px 8px",
                              background:"rgba(39,174,96,.08)",border:"1px solid rgba(39,174,96,.2)",borderRadius:5}}>
                              <PosTag pos={p.pos} small/>
                              <span style={{flex:1,fontSize:".62rem",fontWeight:600,color:C.wh}}>{p.n}</span>
                              <span style={{fontSize:".52rem",color:C.dmr}}>{p.age}y · OVR {p.ovr}</span>
                              <button onClick={()=>onAssign(coach.id,pid,false)}
                                style={{background:"rgba(231,76,60,.15)",border:"1px solid rgba(231,76,60,.3)",color:"#ff5050",
                                  borderRadius:3,cursor:"pointer",fontSize:".5rem",padding:"2px 6px",fontFamily:"inherit"}}>✕</button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Kadrodan oyuncu ekle */}
                  <div style={{fontSize:".44rem",color:C.dmr,textTransform:"uppercase",letterSpacing:1.5,marginBottom:5}}>
                    {assigned.length>=max?"Kapasite Dolu — Önce Oyuncu Çıkar":"Kadrodan Oyuncu Ekle"}
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:3,opacity:assigned.length>=max?.45:1}}>
                    {[...squad].sort((a,b)=>b.ovr-a.ovr).map(p=>{
                      const isAssigned=assigned.includes(p.id);
                      // bu antrenöre zaten atanmış mı?
                      if(isAssigned) return null;
                      // başka bir antrenöre atanmış mı?
                      const otherCoach=coaches.find(co=>co.type==="player"&&co.hired&&(co.assignedPlayers||[]).includes(p.id));
                      const disabled=assigned.length>=max;
                      return(
                        <div key={p.id} style={{display:"flex",alignItems:"center",gap:7,padding:"5px 8px",
                          background:otherCoach?"rgba(255,255,255,.03)":"rgba(26,110,216,.04)",
                          border:`1px solid ${otherCoach?C.brd2:C.brd}`,borderRadius:5,
                          opacity:otherCoach||disabled?.5:1}}>
                          <PosTag pos={p.pos} small/>
                          <span style={{flex:1,fontSize:".62rem",fontWeight:600,color:otherCoach?C.dmr:C.wh}}>{p.n}</span>
                          <span style={{fontSize:".5rem",color:C.dmr}}>{p.age}y · {p.ovr}</span>
                          {otherCoach
                            ?<span style={{fontSize:".42rem",color:C.dmr,flexShrink:0}}>{otherCoach.n}</span>
                            :<button onClick={()=>!disabled&&onAssign(coach.id,p.id,true)}
                              style={{background:disabled?"rgba(26,110,216,.05)":"rgba(45,143,255,.15)",
                                border:`1px solid ${disabled?C.brd:C.ac2}`,color:disabled?C.dmr:C.ac2,
                                borderRadius:3,cursor:disabled?"default":"pointer",fontSize:".5rem",
                                padding:"2px 6px",fontFamily:"inherit",flexShrink:0}}>+ Ata</button>
                          }
                        </div>
                      );
                    })}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

    </div>
  );
}
