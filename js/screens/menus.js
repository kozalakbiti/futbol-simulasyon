function CoachSaveModal({clubName,season,COACH_MAX_SLOTS,getCoachSaves,doCoachSave,doCoachDeleteSlot,loadGameData,showToast,onClose}){
  const [slots,setSlots]=useState(()=>getCoachSaves());
  const [delConfirm,setDelConfirm]=useState(null);
  const fmtD=(ts)=>ts?new Date(ts).toLocaleString("tr-TR",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}):"—";
  const refresh=()=>setSlots(getCoachSaves());
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.92)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:16,fontFamily:"system-ui,sans-serif"}}>
      <div style={{background:"#050e22",border:"1px solid rgba(77,166,255,.25)",borderRadius:20,padding:20,width:"100%",maxWidth:340,maxHeight:"85vh",display:"flex",flexDirection:"column",gap:12}}>
        {/* Baslik */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <div style={{fontSize:".82rem",fontWeight:900,color:"#fff"}}>🧢 Oyunu Kaydet</div>
            <div style={{fontSize:".5rem",color:"#7898c0",marginTop:2}}>{clubName} · H{season.week||1} · {season.league||"1. Lig"}</div>
          </div>
          <button onClick={onClose} style={{background:"transparent",border:"none",color:"#666",fontSize:"1.1rem",cursor:"pointer",padding:4}}>✕</button>
        </div>
        {/* Yeni slot butonu */}
        {slots.length<COACH_MAX_SLOTS?(
          <button onClick={()=>{doCoachSave(null);refresh();}} style={{padding:"11px",background:"linear-gradient(135deg,#1a4f9e,#2485ff)",border:"none",borderRadius:10,color:"#fff",fontWeight:700,cursor:"pointer",fontFamily:"inherit",fontSize:".7rem",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
            <span>➕</span> Yeni Kayıt Oluştur
          </button>
        ):(
          <div style={{fontSize:".56rem",color:"#f59e0b",textAlign:"center",padding:"8px",background:"rgba(245,158,11,.08)",borderRadius:8,border:"1px solid rgba(245,158,11,.2)"}}>
            ⚠️ Maks {COACH_MAX_SLOTS} kayıt doldu. Üzerine yaz veya sil.
          </div>
        )}
        {/* Mevcut kayitlar */}
        <div style={{overflowY:"auto",display:"flex",flexDirection:"column",gap:6,maxHeight:"55vh"}}>
          {slots.length===0&&(
            <div style={{textAlign:"center",padding:"20px 0",color:"rgba(255,255,255,.3)",fontSize:".58rem"}}>📭 Henüz kayıt yok</div>
          )}
          {slots.map(slot=>(
            <div key={slot.id} style={{background:"rgba(255,255,255,.04)",border:"1px solid rgba(77,166,255,.15)",borderRadius:10,padding:"10px 12px",display:"flex",alignItems:"center",gap:8}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:".64rem",fontWeight:700,color:"#fff"}}>{slot.data?.clubName||"Club Manager: Glory Road"}</div>
                <div style={{fontSize:".5rem",color:"#7ab8ff",marginTop:1}}>{slot.data?.league||"1. Lig"} · H{slot.data?.week||1} · {slot.data?.managerName||"Menajer"}</div>
                <div style={{fontSize:".44rem",color:"rgba(255,255,255,.28)",marginTop:1}}>{fmtD(slot.data?.savedAt||slot.savedAt)}</div>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:4,flexShrink:0}}>
                {delConfirm===slot.id?(
                  <div style={{display:"flex",gap:4}}>
                    <button onClick={()=>{doCoachDeleteSlot(slot.id);setDelConfirm(null);refresh();showToast("🗑️ Kayıt silindi");}} style={{padding:"4px 8px",background:"rgba(192,57,43,.3)",border:"1px solid #e74c3c",borderRadius:5,color:"#ff5050",cursor:"pointer",fontSize:".5rem",fontFamily:"inherit"}}>Sil</button>
                    <button onClick={()=>setDelConfirm(null)} style={{padding:"4px 8px",background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.15)",borderRadius:5,color:"rgba(255,255,255,.5)",cursor:"pointer",fontSize:".5rem",fontFamily:"inherit"}}>İptal</button>
                  </div>
                ):(
                  <>
                    <button onClick={()=>{doCoachSave(slot.id);refresh();}} style={{padding:"4px 9px",background:"rgba(36,133,255,.2)",border:"1px solid rgba(36,133,255,.4)",borderRadius:6,color:"#4da6ff",cursor:"pointer",fontSize:".5rem",fontFamily:"inherit",fontWeight:700}}>Üzerine Yaz</button>
                    <button onClick={()=>{
                      if(slot.data&&window.confirm("Bu kaydı yükle? Mevcut ilerleme kaybolur.")){
                        loadGameData(slot.data);
                        onClose();
                        showToast("✅ Kayıt yüklendi!");
                      }
                    }} style={{padding:"4px 9px",background:"rgba(16,185,129,.1)",border:"1px solid rgba(16,185,129,.3)",borderRadius:6,color:"#10b981",cursor:"pointer",fontSize:".5rem",fontFamily:"inherit"}}>▶ Yükle</button>
                    <button onClick={()=>setDelConfirm(slot.id)} style={{padding:"4px 9px",background:"rgba(239,68,68,.07)",border:"1px solid rgba(239,68,68,.2)",borderRadius:6,color:"rgba(239,68,68,.7)",cursor:"pointer",fontSize:".5rem",fontFamily:"inherit"}}>🗑</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MainMenuScreen({onNewGame, onLoadGame, onCareerMode, onLoadPlayerSave}){
  const [saves,setSaves]=useState([]);
  const [loading,setLoading]=useState(true);
  const [tab,setTab]=useState("menu"); // "menu" | "coach_sub" | "player_sub" | "saves"
  const [saveFilter,setSaveFilter]=useState("all"); // "all" | "coach" | "player"
  const [deleteConfirm,setDeleteConfirm]=useState(null);

  useEffect(()=>{
    loadSaves();
  },[]);

  const loadSaves=()=>{
    setLoading(true);
    try{
      // ── Antrenör kariyer kayıtları (fcym_save_index / fcym_save_slot_*) ──
      const coachLoaded=[];
      const idx=safeLsGet("fcym_save_index",[]);
      for(const key of idx){
        try{
          const d=safeLsGet(key);
          if(d){
            coachLoaded.push({key,saveType:"coach",data:{...d,isCareerMode:false}});
          }
        }catch(e){}
      }

      // ── Oyuncu kariyer kayıtları (fcyildiz_player_saves — slot dizisi) ──
      const playerLoaded=[];
      try{
        const slots=safeLsGet("fcyildiz_player_saves",[]);
        if(Array.isArray(slots)){
          slots.forEach(slot=>{
            const synth={
              isCareerMode:true,
              savedAt: slot.id,
              clubName: slot.team||"Serbest",
              league: slot.league||"Oyuncu Kariyeri",
              week: slot.season||1,
              played: 0,
              managerName: slot.name||"Oyuncu",
              ovr: slot.ovr,
              _playerSlot: slot,
            };
            playerLoaded.push({key:"fcyildiz_player_"+slot.id,saveType:"player",data:synth});
          });
        }
      }catch(e){}

      const allLoaded=[...coachLoaded,...playerLoaded];
      allLoaded.sort((a,b)=>(b.data.savedAt||0)-(a.data.savedAt||0));
      setSaves(allLoaded);
    }catch(e){setSaves([]);}
    setLoading(false);
  };

  const deleteSave=(key)=>{
    try{
      if(key.startsWith("fcyildiz_player_")){
        const slotId=parseInt(key.replace("fcyildiz_player_",""),10);
        const slots=safeLsGet("fcyildiz_player_saves",[]);
        safeLsSet("fcyildiz_player_saves",slots.filter(s=>s.id!==slotId));
      } else {
        localStorage.removeItem(key);
        const idx=safeLsGet("fcym_save_index",[]);
        safeLsSet("fcym_save_index",idx.filter(k=>k!==key));
      }
    }catch(e){}
    setDeleteConfirm(null);
    loadSaves();
  };

  const fmtDate=(ts)=>{
    if(!ts) return "—";
    return new Date(ts).toLocaleString("tr-TR",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"});
  };

  const particles=Array.from({length:18},(_,i)=>({
    x:5+Math.random()*90, y:5+Math.random()*90,
    s:0.4+Math.random()*0.8, o:0.08+Math.random()*0.18,
    e:["⚽","🏆","⭐","🎯","🥅","👟"][i%6]
  }));

  return(
    <div style={{
      position:"fixed",inset:0,
      background:"linear-gradient(145deg,#010814 0%,#040c20 50%,#020810 100%)",
      display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
      zIndex:9999,fontFamily:"system-ui,sans-serif",overflow:"hidden",padding:16
    }}>
      {/* Arka plan partikülleri */}
      {particles.map((p,i)=>(
        <div key={i} style={{position:"absolute",left:`${p.x}%`,top:`${p.y}%`,
          fontSize:`${p.s}rem`,opacity:p.o,pointerEvents:"none",userSelect:"none",
          transform:`rotate(${Math.random()*360}deg)`}}>{p.e}</div>
      ))}

      {/* Logo + başlık */}
      <div style={{textAlign:"center",marginBottom:32,position:"relative"}}>
        <div style={{fontSize:"3.5rem",marginBottom:8,filter:"drop-shadow(0 0 20px rgba(36,133,255,.4))"}}>🏆</div>
        <div style={{fontSize:"1.6rem",fontWeight:900,color:"#fff",letterSpacing:2,
          textShadow:"0 0 30px rgba(36,133,255,.5)"}}>CLUB MANAGER</div>
        <div style={{fontSize:".62rem",fontWeight:600,color:"rgba(36,133,255,.8)",letterSpacing:6,marginTop:2}}>GLORY ROAD</div>
        <div style={{marginTop:8,height:2,width:60,background:"linear-gradient(90deg,transparent,#2485ff,transparent)",margin:"8px auto 0"}}/>
      </div>

      {tab==="menu"&&(
        <div style={{width:"100%",maxWidth:320,display:"flex",flexDirection:"column",gap:10}}>
          {/* Antrenör Kariyer */}
          <button onClick={()=>setTab("coach_sub")} style={{
            width:"100%",padding:"14px 20px",
            background:"linear-gradient(135deg,#1a6ed8,#2485ff)",
            border:"none",borderRadius:12,color:"#fff",
            fontSize:".78rem",fontWeight:800,cursor:"pointer",
            fontFamily:"inherit",letterSpacing:.5,
            boxShadow:"0 6px 24px rgba(36,133,255,.4)",
            display:"flex",alignItems:"center",justifyContent:"center",gap:10,
            transition:"all .2s"
          }}>
            <span style={{fontSize:"1.2rem"}}>🎩</span>
            ANTRENÖR KARİYERİ
          </button>

          {/* Oyuncu Kariyer Modu */}
          <button onClick={()=>setTab("player_sub")} style={{
            width:"100%",padding:"14px 20px",
            background:"linear-gradient(135deg,#1a6ed8,#0d4a9e)",
            border:"1.5px solid rgba(77,166,255,.4)",borderRadius:12,color:"#fff",
            fontSize:".78rem",fontWeight:800,cursor:"pointer",
            fontFamily:"inherit",letterSpacing:.5,
            boxShadow:"0 6px 24px rgba(36,133,255,.25)",
            display:"flex",alignItems:"center",justifyContent:"center",gap:10,
          }}>
            <span style={{fontSize:"1.2rem"}}>⚽</span>
            OYUNCU KARİYERİ
          </button>

          {/* Alt bilgi */}
          <div style={{textAlign:"center",marginTop:8,fontSize:".44rem",color:"rgba(255,255,255,.2)",letterSpacing:1.5}}>
            Club Manager: Glory Road · v2.0
          </div>
        </div>
      )}

      {/* Antrenör Kariyer Alt Menü */}
      {tab==="coach_sub"&&(
        <div style={{width:"100%",maxWidth:320,display:"flex",flexDirection:"column",gap:0}}>
          {/* Başlık */}
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
            <button onClick={()=>setTab("menu")} style={{
              background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.12)",
              borderRadius:8,color:"rgba(255,255,255,.6)",padding:"6px 12px",
              cursor:"pointer",fontSize:".6rem",fontFamily:"inherit"
            }}>← Geri</button>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <span style={{fontSize:"1.1rem"}}>🎩</span>
              <div style={{fontSize:".78rem",fontWeight:800,color:"#fff",letterSpacing:.5}}>ANTRENÖR KARİYERİ</div>
            </div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {/* Yeni Oyun */}
            <button onClick={onNewGame} style={{
              width:"100%",padding:"16px 20px",
              background:"linear-gradient(135deg,#1a6ed8,#2485ff)",
              border:"none",borderRadius:12,color:"#fff",
              fontSize:".78rem",fontWeight:800,cursor:"pointer",
              fontFamily:"inherit",letterSpacing:.5,
              boxShadow:"0 6px 24px rgba(36,133,255,.4)",
              display:"flex",alignItems:"center",gap:14
            }}>
              <span style={{fontSize:"1.4rem"}}>🆕</span>
              <div style={{textAlign:"left"}}>
                <div style={{fontSize:".78rem",fontWeight:800}}>YENİ OYUN</div>
                <div style={{fontSize:".48rem",fontWeight:400,opacity:.7,marginTop:2}}>Sıfırdan başla, takım kur</div>
              </div>
            </button>
            {/* Kayıt Yükle */}
            <button onClick={()=>{setSaveFilter("coach");setTab("saves");}} style={{
              width:"100%",padding:"16px 20px",
              background:"rgba(255,255,255,.06)",
              border:"1.5px solid rgba(255,255,255,.15)",borderRadius:12,color:"rgba(255,255,255,.9)",
              fontSize:".78rem",fontWeight:700,cursor:"pointer",
              fontFamily:"inherit",letterSpacing:.5,
              display:"flex",alignItems:"center",gap:14
            }}>
              <span style={{fontSize:"1.4rem"}}>📂</span>
              <div style={{textAlign:"left"}}>
                <div style={{fontSize:".78rem",fontWeight:700,display:"flex",alignItems:"center",gap:8}}>
                  KAYIT YÜKLE
                  {saves.filter(s=>s.saveType==="coach").length>0&&<span style={{
                    background:"rgba(36,133,255,.3)",border:"1px solid #2485ff",
                    borderRadius:10,padding:"1px 7px",fontSize:".48rem",fontWeight:700,color:"#4da6ff"
                  }}>{saves.filter(s=>s.saveType==="coach").length}</span>}
                </div>
                <div style={{fontSize:".48rem",fontWeight:400,opacity:.7,marginTop:2}}>Kaldığın yerden devam et</div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Oyuncu Kariyer Alt Menü */}
      {tab==="player_sub"&&(
        <div style={{width:"100%",maxWidth:320,display:"flex",flexDirection:"column",gap:0}}>
          {/* Başlık */}
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
            <button onClick={()=>setTab("menu")} style={{
              background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.12)",
              borderRadius:8,color:"rgba(255,255,255,.6)",padding:"6px 12px",
              cursor:"pointer",fontSize:".6rem",fontFamily:"inherit"
            }}>← Geri</button>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <span style={{fontSize:"1.1rem"}}>⚽</span>
              <div style={{fontSize:".78rem",fontWeight:800,color:"#fff",letterSpacing:.5}}>OYUNCU KARİYERİ</div>
            </div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {/* Yeni Oyun */}
            <button onClick={onCareerMode} style={{
              width:"100%",padding:"16px 20px",
              background:"linear-gradient(135deg,#1a6ed8,#0d4a9e)",
              border:"1.5px solid rgba(77,166,255,.4)",borderRadius:12,color:"#fff",
              fontSize:".78rem",fontWeight:800,cursor:"pointer",
              fontFamily:"inherit",letterSpacing:.5,
              boxShadow:"0 6px 24px rgba(36,133,255,.25)",
              display:"flex",alignItems:"center",gap:14
            }}>
              <span style={{fontSize:"1.4rem"}}>🆕</span>
              <div style={{textAlign:"left"}}>
                <div style={{fontSize:".78rem",fontWeight:800}}>YENİ OYUN</div>
                <div style={{fontSize:".48rem",fontWeight:400,opacity:.7,marginTop:2}}>Oyuncunu oluştur, kariyere başla</div>
              </div>
            </button>
            {/* Kayıt Yükle */}
            <button onClick={()=>{setSaveFilter("player");setTab("saves");}} style={{
              width:"100%",padding:"16px 20px",
              background:"rgba(255,255,255,.06)",
              border:"1.5px solid rgba(255,255,255,.15)",borderRadius:12,color:"rgba(255,255,255,.9)",
              fontSize:".78rem",fontWeight:700,cursor:"pointer",
              fontFamily:"inherit",letterSpacing:.5,
              display:"flex",alignItems:"center",gap:14
            }}>
              <span style={{fontSize:"1.4rem"}}>📂</span>
              <div style={{textAlign:"left"}}>
                <div style={{fontSize:".78rem",fontWeight:700,display:"flex",alignItems:"center",gap:8}}>
                  KAYIT YÜKLE
                  {saves.filter(s=>s.saveType==="player").length>0&&<span style={{
                    background:"rgba(36,133,255,.3)",border:"1px solid #2485ff",
                    borderRadius:10,padding:"1px 7px",fontSize:".48rem",fontWeight:700,color:"#4da6ff"
                  }}>{saves.filter(s=>s.saveType==="player").length}</span>}
                </div>
                <div style={{fontSize:".48rem",fontWeight:400,opacity:.7,marginTop:2}}>Kaldığın yerden devam et</div>
              </div>
            </button>
          </div>
        </div>
      )}

      {tab==="saves"&&(
        <div style={{width:"100%",maxWidth:360,display:"flex",flexDirection:"column",gap:0}}>
          {/* Geri + başlık */}
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
            <button onClick={()=>setTab(saveFilter==="player"?"player_sub":"coach_sub")} style={{
              background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.12)",
              borderRadius:8,color:"rgba(255,255,255,.6)",padding:"6px 12px",
              cursor:"pointer",fontSize:".6rem",fontFamily:"inherit"
            }}>← Geri</button>
            <div style={{fontSize:".78rem",fontWeight:700,color:"#fff"}}>Kayıtlı Oyunlar</div>
            <button onClick={loadSaves} style={{
              marginLeft:"auto",background:"transparent",border:"none",
              color:"rgba(255,255,255,.4)",cursor:"pointer",fontSize:".7rem",padding:4
            }}>🔄</button>
          </div>

          {/* Kayıt listesi */}
          <div style={{
            background:"rgba(6,14,32,.9)",border:"1px solid rgba(77,168,255,.15)",
            borderRadius:12,overflow:"hidden",maxHeight:"60vh",overflowY:"auto"
          }}>
            {loading?(
              <div style={{padding:24,textAlign:"center",color:"rgba(255,255,255,.4)",fontSize:".62rem"}}>
                Yükleniyor...
              </div>
            ):saves.length===0?(
              <div style={{padding:32,textAlign:"center"}}>
                <div style={{fontSize:"2rem",marginBottom:8}}>📭</div>
                <div style={{fontSize:".62rem",color:"rgba(255,255,255,.4)"}}>Kayıtlı oyun bulunamadı</div>
                <div style={{fontSize:".5rem",color:"rgba(255,255,255,.25)",marginTop:4}}>Oyun sırasında Kaydet butonunu kullanın</div>
              </div>
            ):(
              saves
                .filter(sv => saveFilter==="all" || sv.saveType===saveFilter)
                .map((sv,idx,arr)=>(
                <div key={sv.key} style={{
                  padding:"12px 14px",
                  borderBottom:idx<arr.length-1?"1px solid rgba(255,255,255,.05)":"none",
                  display:"flex",gap:10,alignItems:"center"
                }}>
                  {/* Sol: bilgi */}
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
                      <span style={{fontSize:".7rem",fontWeight:700,color:"#fff",
                        overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                        {sv.data.clubName||"Club Manager: Glory Road"}
                      </span>
                      <span style={{fontSize:".46rem",background:sv.saveType==="player"?"rgba(16,185,129,.2)":"rgba(36,133,255,.2)",
                        border:`1px solid ${sv.saveType==="player"?"rgba(16,185,129,.4)":"rgba(36,133,255,.3)"}`,borderRadius:4,
                        padding:"1px 5px",color:sv.saveType==="player"?"#34d399":"#7ab8ff",flexShrink:0}}>
                        {sv.saveType==="player"?"⚽ Oyuncu":"🧢 Antrenör"}
                      </span>
                      <span style={{fontSize:".46rem",background:"rgba(36,133,255,.2)",
                        border:"1px solid rgba(36,133,255,.3)",borderRadius:4,
                        padding:"1px 5px",color:"#7ab8ff",flexShrink:0}}>
                        {sv.data.league||"1. Lig"}
                      </span>
                    </div>
                    <div style={{fontSize:".52rem",color:"rgba(255,255,255,.5)",marginBottom:1}}>
                      {sv.saveType==="player"
                        ? `${sv.data.managerName} · Sezon ${sv.data.week||1}${sv.data.ovr?" · OVR "+sv.data.ovr:""}`
                        : `${sv.data.managerName||"Menajer"} · H${sv.data.week||1} · ${sv.data.played||0} maç`
                      }
                    </div>
                    <div style={{fontSize:".46rem",color:"rgba(255,255,255,.28)"}}>
                      {fmtDate(sv.data.savedAt)}
                    </div>
                  </div>
                  {/* Sağ: butonlar */}
                  <div style={{display:"flex",flexDirection:"column",gap:4,flexShrink:0}}>
                    {deleteConfirm===sv.key?(
                      <div style={{display:"flex",gap:4}}>
                        <button onClick={()=>deleteSave(sv.key)} style={{
                          background:"rgba(192,57,43,.3)",border:"1px solid #e74c3c",
                          borderRadius:5,color:"#ff5050",padding:"4px 8px",
                          cursor:"pointer",fontSize:".5rem",fontFamily:"inherit"
                        }}>Sil</button>
                        <button onClick={()=>setDeleteConfirm(null)} style={{
                          background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.15)",
                          borderRadius:5,color:"rgba(255,255,255,.5)",padding:"4px 8px",
                          cursor:"pointer",fontSize:".5rem",fontFamily:"inherit"
                        }}>İptal</button>
                      </div>
                    ):(
                      <>
                        <button onClick={()=>{
                          if(sv.saveType==="player"){
                            // Oyuncu kariyer kaydı
                            const playerData = sv.data._playerSlot?.data?.player;
                            if(playerData && onLoadPlayerSave) onLoadPlayerSave(playerData);
                          } else {
                            // Antrenör kariyer kaydı
                            onLoadGame(sv.data);
                          }
                        }} style={{
                          background:"linear-gradient(135deg,#1a6ed8,#2485ff)",border:"none",
                          borderRadius:6,color:"#fff",padding:"5px 12px",
                          cursor:"pointer",fontSize:".56rem",fontWeight:700,fontFamily:"inherit"
                        }}>▶ Yükle</button>
                        <button onClick={()=>setDeleteConfirm(sv.key)} style={{
                          background:"rgba(232,64,64,.1)",border:"1px solid rgba(192,57,43,.3)",
                          borderRadius:6,color:"rgba(231,76,60,.7)",padding:"4px 8px",
                          cursor:"pointer",fontSize:".48rem",fontFamily:"inherit"
                        }}>🗑</button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function OnboardingScreen({onComplete, onBack}){
  const [step,setStep]=useState(0); // 0=karşılama, 1=menajer, 2=lig, 3=takım, 4=hazır
  const [firstName,setFirstName]=useState("");
  const [lastName,setLastName]=useState("");
  const [age,setAge]=useState(38);
  const [avatar,setAvatar]=useState("m1");
  const [league,setLeague]=useState("1. Lig");
  const [selectedTeam,setSelectedTeam]=useState(null); // {n, str, stad, city, lg}
  const [customName,setCustomName]=useState("");        // kullanıcı özel isim yazabilir

  const TR_LEAGUES=["1. Lig","Elit Lig"];
  const isTrLeague=TR_LEAGUES.includes(league);

  // Seçilen lig için takım listesi
  const leagueTeams=INIT_TEAMS.filter(t=>t.lg===league&&!t.me).sort((a,b)=>b.str-a.str);

  const avatarGroups=[
    {label:"Genç Erkek",ids:["m1","m2","m3"]},
    {label:"Olgun Erkek",ids:["m4","m5","m6"]},
    {label:"Kadın",ids:["f1","f2","f3","f4"]},
    {label:"Efsane",ids:["old1","old2"]},
  ];

  const TOTAL_STEPS=5; // 0,1,2,3,4
  const STEP_TITLES=["Hoş Geldiniz","Menajer Profiliniz","Lig Seçimi","Takım Seçimi","Hazırsınız!"];
  const STEP_ICONS=["⚽","👤","🏆","🏟️","🚀"];

  const canNext=
    step===0 ||
    (step===1&&firstName.trim()&&lastName.trim()) ||
    step===2 ||
    (step===3&&selectedTeam);

  // Lig değişince takım seçimini sıfırla
  const handleLeagueChange=(lg)=>{ setLeague(lg); setSelectedTeam(null); setCustomName(""); };

  // Takım seçince otomatik isim doldur ama değiştirilebilir
  const handleTeamSelect=(t)=>{ setSelectedTeam(t); if(!customName||customName===selectedTeam?.n) setCustomName(t.n); };

  const finalClubName=(customName.trim()||selectedTeam?.n||"FC Yildiz");

  const handleFinish=()=>{
    onComplete({
      manager:{firstName:firstName.trim(),lastName:lastName.trim(),age,avatar},
      clubName:finalClubName,
      league,
      selectedTeam, // hangi takımı seçti (me:true yapılacak)
      isTrLeague,
    });
  };

  return(
    <div style={{
      position:"fixed",inset:0,
      background:"linear-gradient(160deg,#010814 0%,#040c20 40%,#020810 100%)",
      display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
      zIndex:9999,padding:"16px",fontFamily:"system-ui,sans-serif",
      overflow:"hidden"
    }}>
      {/* CSS animasyonları */}
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity:0; transform:translateY(14px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes pulseGold {
          0%,100% { opacity:.7; }
          50%      { opacity:1; }
        }
        @keyframes shimmer {
          0%   { background-position:-200% center; }
          100% { background-position: 200% center; }
        }
      `}</style>

      {/* Arka plan ışık efektleri */}
      <div style={{position:"absolute",inset:0,pointerEvents:"none",overflow:"hidden"}}>
        <div style={{position:"absolute",top:"-20%",left:"50%",transform:"translateX(-50%)",
          width:600,height:400,borderRadius:"50%",
          background:"radial-gradient(ellipse,rgba(255,215,0,.08) 0%,transparent 70%)"}}/>
        <div style={{position:"absolute",bottom:"-10%",left:"-10%",
          width:300,height:300,borderRadius:"50%",
          background:"radial-gradient(ellipse,rgba(36,133,255,.06) 0%,transparent 70%)"}}/>
        <div style={{position:"absolute",bottom:"-10%",right:"-10%",
          width:300,height:300,borderRadius:"50%",
          background:"radial-gradient(ellipse,rgba(36,133,255,.06) 0%,transparent 70%)"}}/>
        {/* Stadyum ışık çizgileri */}
        {step===0&&[...Array(8)].map((_,i)=>(
          <div key={i} style={{
            position:"absolute",top:0,left:`${10+i*12}%`,
            width:1,height:"35%",
            background:"linear-gradient(to bottom,rgba(255,215,0,.12),transparent)",
            animation:`pulseGold ${1.5+i*0.2}s ease-in-out infinite`
          }}/>
        ))}
      </div>

      {/* Üst logo alanı — sadece adım 0 */}
      {step===0&&(
        <div style={{textAlign:"center",marginBottom:20,animation:"fadeSlideIn .5s ease"}}>
          <div style={{fontSize:"2.8rem",marginBottom:6}}>🏆</div>
          <div style={{
            fontSize:"1.4rem",fontWeight:900,letterSpacing:2,
            background:"linear-gradient(90deg,#b8860b,#ffd700,#b8860b)",
            backgroundSize:"200% auto",
            WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",
            animation:"shimmer 2.5s linear infinite"
          }}>CLUB MANAGER</div>
          <div style={{fontSize:".55rem",color:"rgba(255,255,255,.4)",letterSpacing:8,marginTop:2}}>GLORY ROAD</div>
        </div>
      )}

      {/* Progress dots */}
      <div style={{display:"flex",gap:6,marginBottom:16}}>
        {[0,1,2,3,4].map(i=>(
          <div key={i} style={{
            width:i===step?24:8,height:8,borderRadius:4,transition:"all .3s",
            background:i<step?"#30e070":i===step?"#ffd700":"rgba(255,255,255,.15)"
          }}/>
        ))}
      </div>

      {/* Kart */}
      <div style={{
        width:"100%",maxWidth:420,
        background:"rgba(8,16,38,.95)",
        border:`1px solid ${step===0?"rgba(255,215,0,.2)":"rgba(36,133,255,.25)"}`,
        borderRadius:18,overflow:"hidden",
        boxShadow:"0 24px 64px rgba(0,0,0,.8), 0 0 0 1px rgba(255,255,255,.04)",
        animation:"fadeSlideIn .35s ease"
      }}>
        {/* Başlık */}
        <div style={{
          padding:"16px 22px 14px",
          borderBottom:"1px solid rgba(255,255,255,.06)",
          background:step===0
            ?"linear-gradient(135deg,rgba(255,215,0,.1),rgba(255,215,0,.04))"
            :"linear-gradient(135deg,rgba(36,133,255,.12),rgba(36,133,255,.04))"
        }}>
          <div style={{fontSize:"1.4rem",marginBottom:4}}>{STEP_ICONS[step]}</div>
          <div style={{fontSize:".88rem",fontWeight:800,color:"#fff",letterSpacing:.5}}>{STEP_TITLES[step]}</div>
          {step===0&&<div style={{fontSize:".54rem",color:"rgba(255,215,0,.6)",marginTop:3}}>
            Şampiyonluğa giden yolculuğun başlıyor ✨
          </div>}
        </div>

        {/* İçerik */}
        <div style={{padding:"20px 24px",maxHeight:"60vh",overflowY:"auto"}}>

          {/* ── ADIM 0: Sinematik Karşılama ── */}
          {step===0&&(
            <div style={{textAlign:"center",padding:"8px 0"}}>
              {/* Animasyonlu özellik kartları */}
              {[
                {icon:"⚽",title:"4000+ Oyuncu",desc:"Gerçek ligler, gerçekçi transferler",color:"#30e070"},
                {icon:"📋",title:"Derin Taktik",desc:"Formasyon, pressing, özel direktifler",color:"#4da6ff"},
                {icon:"🏆",title:"Çok Modlu Kariyer",desc:"Lig, Kupa, Avrupa — hepsi bir arada",color:"#ffd700"},
                {icon:"🌍",title:"9 Lig",desc:"Türkiye, İngiltere, İspanya ve daha fazlası",color:"#ff6b6b"},
              ].map((f,i)=>(
                <div key={i} style={{
                  display:"flex",alignItems:"center",gap:12,
                  background:`rgba(255,255,255,.04)`,
                  border:`1px solid ${f.color}22`,
                  borderLeft:`3px solid ${f.color}`,
                  borderRadius:10,padding:"10px 14px",marginBottom:8,
                  textAlign:"left",
                  animation:`fadeSlideIn .4s ease ${i*0.12}s both`,
                }}>
                  <div style={{fontSize:"1.6rem",flexShrink:0}}>{f.icon}</div>
                  <div>
                    <div style={{fontSize:".65rem",fontWeight:800,color:"#fff",marginBottom:2}}>{f.title}</div>
                    <div style={{fontSize:".52rem",color:"rgba(255,255,255,.5)"}}>{f.desc}</div>
                  </div>
                  <div style={{marginLeft:"auto",width:6,height:6,borderRadius:"50%",background:f.color,flexShrink:0}}/>
                </div>
              ))}
              <div style={{
                marginTop:12,padding:"10px 14px",
                background:"linear-gradient(135deg,rgba(255,215,0,.1),rgba(255,215,0,.05))",
                border:"1px solid rgba(255,215,0,.25)",
                borderRadius:10,fontSize:".56rem",color:"rgba(255,215,0,.85)",lineHeight:1.6
              }}>
                🚀 Tamamen ücretsiz · İnternet gerektirmez · Kayıtlar cihazda saklanır
              </div>
            </div>
          )}

          {/* ── ADIM 1: Menajer ── */}
          {step===1&&(
            <div>
              {/* Avatar seçimi */}
              <div style={{marginBottom:16}}>
                <div style={{fontSize:".48rem",color:"rgba(255,255,255,.4)",letterSpacing:1.5,
                  textTransform:"uppercase",marginBottom:10}}>Avatar Seçin</div>
                {avatarGroups.map(grp=>(
                  <div key={grp.label} style={{marginBottom:10}}>
                    <div style={{fontSize:".42rem",color:"rgba(255,255,255,.3)",marginBottom:6,letterSpacing:1}}>{grp.label}</div>
                    <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                      {grp.ids.map(avId=>(
                        <button key={avId} onClick={()=>setAvatar(avId)} style={{
                          width:52,height:52,borderRadius:10,padding:3,
                          border:`2px solid ${avatar===avId?"#4da6ff":"rgba(255,255,255,.1)"}`,
                          background:avatar===avId?"rgba(36,133,255,.2)":"rgba(255,255,255,.04)",
                          cursor:"pointer",transition:"all .2s",
                          boxShadow:avatar===avId?"0 0 12px rgba(36,133,255,.4)":"none"
                        }}>
                          <ManagerAvatar id={avId} size={44}/>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {/* İsim */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
                {[["Ad",firstName,setFirstName],["Soyad",lastName,setLastName]].map(([lbl,val,set])=>(
                  <div key={lbl}>
                    <div style={{fontSize:".46rem",color:"rgba(255,255,255,.4)",letterSpacing:1.5,
                      textTransform:"uppercase",marginBottom:5}}>{lbl}</div>
                    <input value={val} onChange={e=>set(e.target.value)} placeholder={lbl}
                      style={{width:"100%",background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.12)",
                        borderRadius:8,padding:"9px 12px",color:"#fff",fontSize:".68rem",
                        fontFamily:"inherit",outline:"none",boxSizing:"border-box"}}/>
                  </div>
                ))}
              </div>
              {/* Yaş */}
              <div>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                  <span style={{fontSize:".46rem",color:"rgba(255,255,255,.4)",letterSpacing:1.5,textTransform:"uppercase"}}>Yaş</span>
                  <span style={{fontSize:".72rem",fontWeight:700,color:"#4da6ff"}}>{age}</span>
                </div>
                <input type="range" min={25} max={75} value={age} onChange={e=>setAge(Number(e.target.value))}
                  onTouchStart={e=>e.stopPropagation()} onTouchMove={e=>e.stopPropagation()}
                  style={{width:"100%",accentColor:"#4da6ff",touchAction:"none"}}/>
              </div>
            </div>
          )}

          {/* ── ADIM 2: Lig Seçimi ── */}
          {step===2&&(
            <div>
              <div style={{fontSize:".5rem",color:"rgba(255,255,255,.4)",marginBottom:10,lineHeight:1.6}}>
                TFF ve Elit Lig'de ikinci lig ve Kupa da oynanır. Yabancı liglerde yalnızca kendi ligi simüle edilir.
              </div>
              {[
                ["1. Lig","🏆","2. Türk ligi — Kupa + yükselme hedefi","1. Lig"],
                ["Elit Lig","⭐","Türkiye'nin en üst ligi — Kupa dahil","Elit Lig"],
                ["İngiliz Ligi","🏴󠁧󠁢󠁥󠁮󠁧󠁿","İngiltere — sadece lig","İngiliz Ligi"],
                ["İngiliz 2. Ligi","🏴󠁧󠁢󠁥󠁮󠁧󠁿","İngiltere 2. lig — 24 takım, 46 hafta, ilk 3 yükselir","İngiliz 2. Ligi"],
                ["İspanyol Ligi","🇪🇸","İspanya — sadece lig","İspanyol Ligi"],
                ["Alman Ligi","🇩🇪","Almanya — sadece lig","Alman Ligi"],
                ["İtalyan Ligi","🇮🇹","İtalya — sadece lig","İtalyan Ligi"],
                ["Fransız Ligi","🇫🇷","Fransa — sadece lig","Fransız Ligi"],
                ["Hollanda Ligi","🇳🇱","Hollanda — ASK kota hakkı","Hollanda Ligi"],
                ["Portekiz Ligi","🇵🇹","Portekiz — ASK kota hakkı","Portekiz Ligi"],
              ].map(([val,flag,desc])=>(
                <button key={val} onClick={()=>handleLeagueChange(val)} style={{
                  display:"flex",alignItems:"center",gap:10,width:"100%",marginBottom:6,
                  padding:"9px 12px",borderRadius:10,
                  border:`1.5px solid ${league===val?"#4da6ff":"rgba(255,255,255,.1)"}`,
                  background:league===val?"rgba(36,133,255,.15)":"rgba(255,255,255,.03)",
                  cursor:"pointer",textAlign:"left",fontFamily:"inherit",transition:"all .2s"
                }}>
                  <span style={{fontSize:"1.1rem"}}>{flag}</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:".6rem",fontWeight:700,color:league===val?"#fff":"rgba(255,255,255,.7)"}}>{val}</div>
                    <div style={{fontSize:".44rem",color:"rgba(255,255,255,.35)",marginTop:1}}>{desc}</div>
                  </div>
                  {league===val&&<span style={{color:"#4da6ff",fontSize:".8rem"}}>✓</span>}
                </button>
              ))}
            </div>
          )}

          {/* ── ADIM 3: Takım Seçimi ── */}
          {step===3&&(
            <div>
              {/* Lig ASK/AL kotası bilgisi */}
              {(()=>{
                const LIG_CL_AL_INFO={
                  "İngiliz Ligi":"⭐ İlk 4 → ASK · İlk 7 → AL",
                  "İspanyol Ligi":"⭐ İlk 4 → ASK · İlk 6 → AL",
                  "Alman Ligi":"⭐ İlk 4 → ASK · İlk 6 → AL",
                  "İtalyan Ligi":"⭐ İlk 4 → ASK · İlk 7 → AL",
                  "Fransız Ligi":"⭐ İlk 3 → ASK · İlk 5 → AL",
                  "Elit Lig":"⭐ İlk 2 → ASK · 3-4 → AL",
                  "Hollanda Ligi":"⭐ 1. → ASK · 2-3 → AL",
                  "Portekiz Ligi":"⭐ İlk 2 → ASK · 3 → AL",
                  "İngiliz 2. Ligi":"⬆ İlk 3 → İngiliz Ligi'ne yükselir",
                };
                const info=LIG_CL_AL_INFO[league];
                // Seçilen takımın muhtemelen kota hakkı var mı?
                const lgTeamsRanked=[...leagueTeams].sort((a,b)=>b.str-a.str);
                const selRank=selectedTeam?lgTeamsRanked.findIndex(t=>t.n===selectedTeam.n)+1:99;
                const LIG_CL_SPOTS=Object.fromEntries(Object.entries(EURO_QUOTA).map(([k,q])=>[k,q[0]]));
                const LIG_UEFA_SPOTS=Object.fromEntries(Object.entries(EURO_QUOTA).map(([k,q])=>[k,q[0]+q[1]]));
                const inCL=selRank>0&&selRank<=((LIG_CL_SPOTS[league]||0));
                const inUEFA=!inCL&&selRank>0&&selRank<=((LIG_UEFA_SPOTS[league]||0));
                const inCON=!inCL&&!inUEFA&&selRank>0&&selRank<=(EURO_QUOTA[league]?EURO_QUOTA[league].reduce((a,b)=>a+b,0):0);
                return(
                  <div style={{marginBottom:10}}>
                    {info&&<div style={{fontSize:".46rem",color:"#ffd060",marginBottom:4,
                      background:"rgba(232,184,58,.08)",border:"1px solid rgba(232,184,58,.2)",
                      borderRadius:5,padding:"4px 8px"}}>{info}</div>}
                    {selectedTeam&&(inCL||inUEFA||inCON)&&(
                      <div style={{fontSize:".5rem",fontWeight:700,padding:"4px 8px",borderRadius:5,
                        background:inCL?"rgba(232,184,58,.15)":inUEFA?"rgba(230,126,34,.15)":"rgba(46,204,113,.15)",
                        border:`1px solid ${inCL?"rgba(232,184,58,.4)":inUEFA?"rgba(230,126,34,.4)":"rgba(46,204,113,.4)"}`,
                        color:inCL?"#ffd060":inUEFA?"#e67e22":"#2ecc71"}}>
                        {inCL?"⭐ Bu takımla Avrupa Şampiyonlar Kupası'nda başlarsınız!":inUEFA?"🇪🇺 Bu takımla Avrupa Ligi'nde başlarsınız!":"🟢 Bu takımla Konferans Ligi'nde başlarsınız!"}
                      </div>
                    )}
                    <div style={{fontSize:".44rem",color:"rgba(255,255,255,.3)",marginTop:4}}>
                      {league} takımlarından birini seç · Kadro DB'den yüklenir
                    </div>
                  </div>
                );
              })()}
              {/* Takım listesi */}
              <div style={{marginBottom:12}}>
                {leagueTeams.length===0&&(
                  <div style={{fontSize:".58rem",color:"rgba(255,255,255,.4)",textAlign:"center",padding:16}}>
                    Bu lig için takım bulunamadı
                  </div>
                )}
                {leagueTeams.map(t=>{
                  // Bu takımın DB'deki oyuncu sayısını hesapla
                  const dbCount=DB.filter(p=>p.club===t.n).length;
                  const LIG_CL_SPOTS2=Object.fromEntries(Object.entries(EURO_QUOTA).map(([k,q])=>[k,q[0]]));
                  const LIG_UEFA_SPOTS2=Object.fromEntries(Object.entries(EURO_QUOTA).map(([k,q])=>[k,q[0]+q[1]]));
                  const lgRanked=[...leagueTeams].sort((a,b)=>b.str-a.str);
                  const tRank=lgRanked.findIndex(r=>r.n===t.n)+1;
                  const tInCL=tRank>0&&tRank<=(LIG_CL_SPOTS2[league]||0);
                  const tInUEFA=!tInCL&&tRank>0&&tRank<=(LIG_UEFA_SPOTS2[league]||0);
                  const tInCON=!tInCL&&!tInUEFA&&tRank>0&&tRank<=(EURO_QUOTA[league]?EURO_QUOTA[league].reduce((a,b)=>a+b,0):0);
                  return(
                    <button key={t.n} onClick={()=>handleTeamSelect(t)} style={{
                      display:"flex",alignItems:"center",gap:10,width:"100%",marginBottom:5,
                      padding:"9px 12px",borderRadius:9,
                      border:`1.5px solid ${selectedTeam?.n===t.n?"#4da6ff":"rgba(255,255,255,.1)"}`,
                      background:selectedTeam?.n===t.n?"rgba(36,133,255,.15)":"rgba(255,255,255,.03)",
                      cursor:"pointer",textAlign:"left",fontFamily:"inherit",transition:"all .15s"
                    }}>
                      <div style={{
                        width:32,height:32,borderRadius:8,background:"rgba(36,133,255,.15)",
                        display:"flex",alignItems:"center",justifyContent:"center",
                        fontSize:".6rem",fontWeight:800,color:"#4da6ff",flexShrink:0
                      }}>{t.str}</div>
                      <div style={{flex:1}}>
                        <div style={{display:"flex",alignItems:"center",gap:5}}>
                          <span style={{fontSize:".62rem",fontWeight:700,color:selectedTeam?.n===t.n?"#fff":"rgba(255,255,255,.8)"}}>{t.n}</span>
                          {tInCL&&<span style={{fontSize:".38rem",background:"rgba(232,184,58,.2)",border:"1px solid rgba(232,184,58,.4)",color:"#ffd060",borderRadius:3,padding:"1px 4px"}}>⭐ASK</span>}
                          {tInUEFA&&<span style={{fontSize:".38rem",background:"rgba(230,126,34,.2)",border:"1px solid rgba(230,126,34,.4)",color:"#e67e22",borderRadius:3,padding:"1px 4px"}}>🇪🇺AL</span>}
                          {tInCON&&<span style={{fontSize:".38rem",background:"rgba(46,204,113,.2)",border:"1px solid rgba(46,204,113,.4)",color:"#2ecc71",borderRadius:3,padding:"1px 4px"}}>🟢KL</span>}
                        </div>
                        <div style={{fontSize:".44rem",color:"rgba(255,255,255,.35)"}}>{t.city} · {dbCount>0?dbCount+" oyuncu DB'de":"Varsayılan kadro"}</div>
                      </div>
                      {selectedTeam?.n===t.n&&<span style={{color:"#4da6ff",fontSize:".8rem"}}>✓</span>}
                    </button>
                  );
                })}
              </div>
              {/* Özel isim */}
              {selectedTeam&&(
                <div>
                  <div style={{fontSize:".46rem",color:"rgba(255,255,255,.4)",letterSpacing:1.5,
                    textTransform:"uppercase",marginBottom:5}}>Takım Adını Özelleştir (opsiyonel)</div>
                  <input value={customName} onChange={e=>setCustomName(e.target.value)}
                    placeholder={selectedTeam.n}
                    style={{width:"100%",background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.12)",
                      borderRadius:8,padding:"9px 12px",color:"#fff",fontSize:".68rem",
                      fontFamily:"inherit",outline:"none",boxSizing:"border-box"}}/>
                  <div style={{fontSize:".42rem",color:"rgba(255,255,255,.3)",marginTop:4}}>
                    Boş bırakırsan orijinal isim kullanılır
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── ADIM 4: Hazır — Sinematik ── */}
          {step===4&&(
            <div style={{textAlign:"center"}}>
              {/* Konfeti efekti */}
              <div style={{fontSize:"1.2rem",marginBottom:8,animation:"fadeSlideIn .3s ease"}}>
                🎉 🏆 🎉
              </div>
              <div style={{
                fontSize:".62rem",fontWeight:800,color:"#ffd700",
                letterSpacing:2,marginBottom:12,
                textShadow:"0 0 20px rgba(255,215,0,.5)"
              }}>HAZIRSIN!</div>
              <div style={{display:"inline-block",marginBottom:12,
                width:76,height:76,borderRadius:18,
                border:"2px solid rgba(255,215,0,.5)",
                background:"linear-gradient(135deg,rgba(255,215,0,.15),rgba(255,215,0,.05))",
                padding:8,
                boxShadow:"0 0 24px rgba(255,215,0,.2)"}}>
                <ManagerAvatar id={avatar} size={60}/>
              </div>
              <div style={{fontSize:".82rem",fontWeight:800,color:"#fff",marginBottom:3}}>
                Menajer {firstName} {lastName}
              </div>
              <div style={{fontSize:".54rem",color:"rgba(255,255,255,.5)",marginBottom:14}}>
                {age} yaşında · {league}
              </div>
              <div style={{
                background:"rgba(36,133,255,.08)",border:"1px solid rgba(36,133,255,.2)",
                borderRadius:10,padding:"12px 16px",marginBottom:8
              }}>
                <div style={{fontSize:".48rem",color:"rgba(255,255,255,.35)",letterSpacing:1,marginBottom:4}}>TAKIMIN</div>
                <div style={{fontSize:"1.1rem",fontWeight:800,color:"#4da6ff"}}>{finalClubName}</div>
                {selectedTeam&&finalClubName!==selectedTeam.n&&(
                  <div style={{fontSize:".44rem",color:"rgba(255,255,255,.3)",marginTop:2}}>
                    {selectedTeam.n} kadrosu ile
                  </div>
                )}
                <div style={{fontSize:".46rem",color:"rgba(255,255,255,.35)",marginTop:4}}>
                  Güç: {selectedTeam?.str||63} · {selectedTeam?.city||"Ankara"}
                </div>
                {/* Kadro kaynağı */}
                {(()=>{
                  const dbCount=selectedTeam?DB.filter(p=>p.club===selectedTeam.n).length:0;
                  return dbCount>=11?(
                    <div style={{marginTop:6,fontSize:".44rem",color:"rgba(46,204,113,.7)",fontWeight:700}}>
                      ✓ {dbCount} oyuncu DB'den yükleniyor
                    </div>
                  ):(
                    <div style={{marginTop:6,fontSize:".44rem",color:"rgba(255,255,255,.3)"}}>
                      Varsayılan başlangıç kadrosu kullanılacak
                    </div>
                  );
                })()}
                {/* ASK/AL durumu */}
                {(()=>{
                  const LIG_CL_SPOTS=Object.fromEntries(Object.entries(EURO_QUOTA).map(([k,q])=>[k,q[0]]));
                  const LIG_UEFA_SPOTS=Object.fromEntries(Object.entries(EURO_QUOTA).map(([k,q])=>[k,q[0]+q[1]]));
                  const lgTeamsRanked=[...INIT_TEAMS.filter(t=>t.lg===league)].sort((a,b)=>b.str-a.str);
                  const selRank=selectedTeam?lgTeamsRanked.findIndex(t=>t.n===selectedTeam.n)+1:99;
                  const inCL=selRank>0&&selRank<=(LIG_CL_SPOTS[league]||0);
                  const inUEFA=!inCL&&selRank>0&&selRank<=(LIG_UEFA_SPOTS[league]||0);
                  if(inCL) return <div style={{marginTop:6,fontSize:".5rem",fontWeight:700,color:"#ffd060"}}>⭐ Avrupa Şampiyonlar Kupası lig aşaması (36 takım) — kura Eylül'de!</div>;
                  const inCON=!inCL&&!inUEFA&&selRank>0&&selRank<=(EURO_QUOTA[league]?EURO_QUOTA[league].reduce((a,b)=>a+b,0):0);
                  if(inUEFA) return <div style={{marginTop:6,fontSize:".5rem",fontWeight:700,color:"#e67e22"}}>🇪🇺 Avrupa Ligi lig aşaması (36 takım) — kura Eylül'de!</div>;
                  if(inCON) return <div style={{marginTop:6,fontSize:".5rem",fontWeight:700,color:"#2ecc71"}}>🟢 Konferans Ligi lig aşaması (36 takım) — kura Eylül'de!</div>;
                  return null;
                })()}
              </div>
              <div style={{fontSize:".5rem",color:"rgba(255,255,255,.3)",marginTop:12}}>
                Hazırsanız sahaya çıkın! 🏟️
              </div>
            </div>
          )}
        </div>

        {/* Alt butonlar */}
        <div style={{padding:"0 24px 20px",display:"flex",gap:8}}>
          {step>0&&(
            <button onClick={()=>setStep(s=>s-1)} style={{
              flex:1,padding:"11px 0",borderRadius:10,
              border:"1px solid rgba(255,255,255,.12)",
              background:"rgba(255,255,255,.05)",
              color:"rgba(255,255,255,.6)",fontSize:".64rem",
              cursor:"pointer",fontFamily:"inherit"
            }}>← Geri</button>
          )}
          {step<4?(
            <button onClick={()=>canNext&&setStep(s=>s+1)} style={{
              flex:2,padding:"12px 0",borderRadius:10,border:"none",
              background:canNext
                ?(step===0?"linear-gradient(135deg,#c8940a,#ffd700,#c8940a)":"linear-gradient(135deg,#1a6ed8,#2485ff)")
                :"rgba(255,255,255,.05)",
              color:canNext?(step===0?"#111":"#fff"):"rgba(255,255,255,.25)",
              fontSize:step===0?".72rem":".66rem",
              fontWeight:step===0?900:700,
              letterSpacing:step===0?1:.5,
              cursor:canNext?"pointer":"not-allowed",fontFamily:"inherit",
              boxShadow:canNext?(step===0?"0 6px 24px rgba(255,215,0,.4)":"0 4px 16px rgba(36,133,255,.4)"):"none",
              transition:"all .2s",
              backgroundSize:"200% auto",
            }}>
              {step===0?"⚽ Macerana Başla!":step===3?"Hazır →":"İleri →"}
            </button>
          ):(
            <button onClick={handleFinish} style={{
              flex:2,padding:"11px 0",borderRadius:10,border:"none",
              background:"linear-gradient(135deg,#1a8449,#2ecc71)",
              color:"#fff",fontSize:".7rem",fontWeight:800,letterSpacing:.5,
              cursor:"pointer",fontFamily:"inherit",
              boxShadow:"0 4px 20px rgba(46,204,113,.4)"
            }}>
              🚀 Oyuna Başla!
            </button>
          )}
        </div>
      </div>

      {/* Alt dekor + geri butonu */}
      <div style={{marginTop:16,display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
        {onBack&&<button onClick={onBack} style={{
          background:"transparent",border:"none",
          color:"rgba(255,255,255,.3)",fontSize:".52rem",cursor:"pointer",
          fontFamily:"inherit",letterSpacing:1
        }}>← Ana Menüye Dön</button>}
        <div style={{fontSize:".44rem",color:"rgba(255,255,255,.16)",letterSpacing:2}}>
          Club Manager: Glory Road
        </div>
      </div>
    </div>
  );
}


function ManagerAvatar({id,size=40}){
  const svg=AVATAR_DEFS[id]||AVATAR_DEFS["m1"];
  return <div style={{width:size,height:size,flexShrink:0}}>{svg}</div>;
}

// ─── SENARYO SEÇİM EKRANI ────────────────────────────────────
const SCENARIOS=[
  {
    id:"standard",
    icon:"⚽",
    label:"Klasik Kariyer",
    desc:"Normal başlangıç. TFF 1. Lig, dengeli bütçe, standart kadro.",
    color:C.ac2,
    bg:"rgba(77,168,255,.1)",
    brd:"rgba(77,168,255,.3)",
    tag:"Standart",
    tagColor:C.ac2,
    budgetMult:1.0,
    squadMult:1.0,
    repMult:1.0,
    pressureLevel:0,
    constraint:null,
  },
  {
    id:"underdogs",
    icon:"🔥",
    label:"Külden Doğuş",
    desc:"Küme düşmüş tarihi bir kulübün başındasın. Bütçe kısıtlı, kadro zayıf ama taraftar seni bekliyor. 2 sezonda Süper Lig'e dön.",
    color:"#f97316",
    bg:"rgba(249,115,22,.1)",
    brd:"rgba(249,115,22,.3)",
    tag:"Zorlu",
    tagColor:"#f97316",
    budgetMult:0.45,
    squadMult:0.85,
    repMult:0.5,
    pressureLevel:1,
    constraint:null,
    startLeague:"1. Lig",
    startMessage:"🔥 Kulüp tarihin en zor döneminde. Taraftarlar seni bekliyor!",
  },
  {
    id:"petrodollar",
    icon:"💰",
    label:"Petro Dolar",
    desc:"Kulüp yeni sahipleri tarafından satın alındı. Para bol ama itibar sıfır — yıldızlar gelmek istemiyor. 3 sezonda şampiyonluk şart.",
    color:"#ffd060",
    bg:"rgba(255,208,96,.1)",
    brd:"rgba(255,208,96,.3)",
    tag:"Para Var, İtibar Yok",
    tagColor:"#ffd060",
    budgetMult:2.2,
    squadMult:0.90,
    repMult:0.6,
    pressureLevel:2,
    constraint:null,
    startMessage:"💰 Yeni sahipler büyük beklenti içinde. Bütçen bol ama itibar sıfırdan inşa edilecek!",
  },
  {
    id:"youngblood",
    icon:"🌱",
    label:"Genç Kanlar",
    desc:"Sadece 23 yaş altı oyuncu alabilirsin. Potansiyel yüksek ama sabır gerekiyor. Geleceği şekillendir.",
    color:C.grn2,
    bg:"rgba(40,224,106,.1)",
    brd:"rgba(40,224,106,.3)",
    tag:"Kısıtlı",
    tagColor:C.grn2,
    budgetMult:0.80,
    squadMult:0.90,
    repMult:0.85,
    pressureLevel:0,
    constraint:"u23only",
    startMessage:"🌱 Kurallar net: 23 yaş altı oyuncularla kadro kuruyorsun. Sabırlı ol!",
  },
  {
    id:"lastchance",
    icon:"⏰",
    label:"Son Şans",
    desc:"Sezon ortasında işten atıldın, yeni kulübün küme düşme hattında. 10 maçta kurtarman şart, bütçe yok, kadro umutsuz.",
    color:C.red2,
    bg:"rgba(255,74,74,.1)",
    brd:"rgba(255,74,74,.3)",
    tag:"Çok Zorlu",
    tagColor:C.red2,
    budgetMult:0.25,
    squadMult:0.80,
    repMult:0.45,
    pressureLevel:3,
    constraint:null,
    startMessage:"⏰ 10 maçın var. Ya kurtarırsın ya da ikinci kez kovulursun.",
  },
];

function ScenarioScreen({onSelect,onBack}){
  const [sel,setSel]=useState("standard");
  const active=SCENARIOS.find(s=>s.id===sel)||SCENARIOS[0];
  return(
    <div style={{height:"100dvh",background:"linear-gradient(160deg,#010e28,#010611)",display:"flex",flexDirection:"column",overflow:"hidden"}}>
      {/* Header */}
      <div style={{padding:"16px 16px 10px",flexShrink:0}}>
        <button onClick={onBack} style={{background:"none",border:"none",color:C.dim,fontSize:".72rem",cursor:"pointer",padding:"4px 0",marginBottom:8}}>← Geri</button>
        <div style={{fontSize:"1.1rem",fontWeight:900,color:C.wh,letterSpacing:1}}>Senaryo Seç</div>
        <div style={{fontSize:".55rem",color:C.dim,marginTop:3}}>Nasıl bir kariyer hikayesi istiyorsun?</div>
      </div>

      {/* Senaryo listesi */}
      <div style={{flex:1,overflowY:"auto",padding:"0 12px 8px"}}>
        {SCENARIOS.map(s=>(
          <div key={s.id} onClick={()=>setSel(s.id)}
            style={{marginBottom:10,padding:"12px 14px",borderRadius:10,cursor:"pointer",
              background:sel===s.id?s.bg:"rgba(255,255,255,.03)",
              border:`1px solid ${sel===s.id?s.brd:C.brd2}`,
              transition:"all .15s"}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
              <span style={{fontSize:"1.6rem",lineHeight:1}}>{s.icon}</span>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <span style={{fontSize:".76rem",fontWeight:700,color:sel===s.id?s.color:C.wh}}>{s.label}</span>
                  <span style={{fontSize:".42rem",padding:"1px 6px",borderRadius:3,fontWeight:700,
                    background:`${s.color}22`,color:s.tagColor,border:`1px solid ${s.color}44`}}>{s.tag}</span>
                </div>
                <div style={{fontSize:".52rem",color:C.dim,marginTop:3,lineHeight:1.5}}>{s.desc}</div>
              </div>
            </div>
            {sel===s.id&&(
              <div style={{display:"flex",flexWrap:"wrap",gap:5,marginTop:8}}>
                <div style={{padding:"2px 8px",borderRadius:4,fontSize:".44rem",fontWeight:700,background:s.bg,color:s.color,border:`1px solid ${s.brd}`}}>
                  💰 Bütçe ×{s.budgetMult.toFixed(2)}
                </div>
                <div style={{padding:"2px 8px",borderRadius:4,fontSize:".44rem",fontWeight:700,background:s.bg,color:s.color,border:`1px solid ${s.brd}`}}>
                  ⭐ İtibar ×{s.repMult.toFixed(2)}
                </div>
                {s.constraint==="u23only"&&<div style={{padding:"2px 8px",borderRadius:4,fontSize:".44rem",fontWeight:700,background:s.bg,color:s.color,border:`1px solid ${s.brd}`}}>🔒 Sadece U23</div>}
                {s.pressureLevel>0&&<div style={{padding:"2px 8px",borderRadius:4,fontSize:".44rem",fontWeight:700,background:"rgba(255,74,74,.12)",color:C.red2,border:"1px solid rgba(255,74,74,.25)"}}>
                  {"⚡".repeat(s.pressureLevel)} Baskı Seviyesi {s.pressureLevel}/3
                </div>}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Oyna butonu */}
      <div style={{padding:"10px 14px 20px",flexShrink:0,borderTop:`1px solid ${C.brd2}`}}>
        <button onClick={()=>onSelect(active)}
          style={{width:"100%",padding:"13px",borderRadius:10,border:"none",cursor:"pointer",
            background:`linear-gradient(135deg,${active.color},${active.color}99)`,
            color:"#000",fontWeight:900,fontSize:".76rem",fontFamily:"inherit",letterSpacing:.5}}>
          {active.icon} {active.label} ile Başla
        </button>
      </div>
    </div>
  );
}
