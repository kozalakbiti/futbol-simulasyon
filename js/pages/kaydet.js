function PageKaydet({season, squad, coaches, youth, db, clubName="Club Manager: Glory Road", onLoad,
  transferBudget=0, wageBudget=0, spent=0, income=0, wageSpent=0,
  fStadyum=0, fForma=0, fYayin=0, fSponsor=0, fLigOdeme=0, fKupaPrim=0,
  weeklyLog=[], activeSponsors=[], pendingSquad=[], formation="4-4-2", lineup=[],
  autoLineup=true, tactic={}, trainFocus={}, transferPace="normal",
  rep={pts:8,history:[]}, careerStats={}, fans={}, mgmt={}, transferBan={},
  news=[], manager={}, transferBanData={}, pendingEuroGroups=null}){
  const [saves, setSaves] = useState(()=>{
    try{
      const s = localStorage.getItem("fcym_coach_saves");
      return s ? JSON.parse(s) : [];
    }catch(e){ return []; }
  });
  const [msg, setMsg] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [overwriteSlot, setOverwriteSlot] = useState(null); // slot id to overwrite

  const showMsg = (text, ok=true) => {
    setMsg({text, ok});
    setTimeout(()=>setMsg(null), 2800);
  };

  const buildSlotData = (existingId) => {
    const rank=[...season.teams].filter(t=>t.lg===(season.league||"1. Lig")).sort((a,b)=>b.pts-a.pts).findIndex(t=>t.me)+1;
    const slotData = {
      season, squad, coaches, youth, db, clubName, manager,
      formation, lineup, autoLineup, tactic, trainFocus, transferPace,
      transferBudget, wageBudget, spent, income, wageSpent,
      fStadyum, fForma, fYayin, fSponsor, fLigOdeme, fKupaPrim,
      weeklyLog, activeSponsors, pendingSquad,
      rep, careerStats, fans, mgmt, transferBan,
      news: (news||[]).slice(0, 50),
      pendingEuroGroups: pendingEuroGroups||null,
      // Ana menü gösterimi için üst level alanlar
      clubName, week: season.week, league: season.league||"1. Lig",
      played: squad.length, managerName: manager?.name||"Menajer",
      savedAt: Date.now(),
    };
    return {
      id: existingId || Date.now(),
      date: new Date().toLocaleString("tr-TR"),
      week: season.week,
      league: season.league||"1. Lig",
      pts: (season.teams.find(t=>t.me)||{pts:0}).pts,
      rank,
      squadSize: squad.length,
      data: slotData
    };
  };

  // Yeni slot — maks 5 kayıt
  const doNewSave = () => {
    if(saves.length>=5){
      showMsg("⚠️ Maks 5 kayıt. Var olan bir kaydın üzerine yaz veya sil.", false);
      return;
    }
    const slot = buildSlotData(null);
    const newSaves = [slot, ...saves];
    try{
      if(safeLsSet("fcym_coach_saves", newSaves)){
        // fcym_save_index + fcym_save_slot_* de güncelle (ana menü uyumu)
        const key="fcym_save_slot_"+slot.id;
        safeLsSet(key, slot.data);
        const idx=safeLsGet("fcym_save_index",[]);
        const slotKeys=newSaves.map(s=>"fcym_save_slot_"+s.id);
        safeLsSet("fcym_save_index",slotKeys.slice(0,10));
        setSaves(newSaves);
        showMsg("✅ Yeni kayıt oluşturuldu — H"+season.week);
      } else {
        showMsg("❌ Kaydetme başarısız (depolama dolu olabilir)", false);
      }
    }catch(e){
      showMsg("❌ Kaydetme başarısız (depolama dolu olabilir)", false);
    }
  };

  // Üzerine yaz
  const doOverwrite = (id) => {
    const slot = buildSlotData(id);
    const newSaves = saves.map(s=>s.id===id?slot:s);
    try{
      if(safeLsSet("fcym_coach_saves", newSaves)){
        // fcym_save_slot_* de güncelle (ana menü uyumu)
        const key="fcym_save_slot_"+slot.id;
        safeLsSet(key, slot.data);
        const slotKeys=newSaves.map(s=>"fcym_save_slot_"+s.id);
        safeLsSet("fcym_save_index",slotKeys.slice(0,10));
        setSaves(newSaves);
        setOverwriteSlot(null);
        showMsg("💾 Kayıt güncellendi — H"+season.week);
      } else {
        showMsg("❌ Kaydetme başarısız", false);
      }
    }catch(e){
      showMsg("❌ Kaydetme başarısız", false);
    }
  };

  const doLoad = (slot) => {
    try{
      onLoad(slot.data);
      showMsg("✅ Yüklendi: "+slot.date);
    }catch(e){
      showMsg("❌ Yükleme başarısız", false);
    }
  };

  const doDelete = (id) => {
    const newSaves = saves.filter(s=>s.id!==id);
    safeLsSet("fcym_coach_saves", newSaves);
    setSaves(newSaves);
    setConfirmDel(null);
    showMsg("🗑️ Kayıt silindi");
  };

  const doExport = (slot) => {
    const json = JSON.stringify(slot.data);
    const blob = new Blob([json], {type:"application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fcyildiz-h${slot.week}-${slot.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const doImport = (e) => {
    const file = e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try{
        const data = JSON.parse(ev.target.result);
        if(!data.season || !data.squad) throw new Error("Geçersiz dosya");
        onLoad(data);
        showMsg("✅ Dosyadan yüklendi!");
      }catch(err){
        showMsg("❌ Geçersiz kayıt dosyası", false);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const myTeam=season.teams.find(t=>t.me)||{pts:0};
  const myRank=[...season.teams].filter(t=>t.lg===(season.league||"1. Lig")).sort((a,b)=>b.pts-a.pts).findIndex(t=>t.me)+1;

  return(
    <div style={{flex:1,display:"flex",flexDirection:"column",minHeight:0}}>
      {msg&&<div style={{padding:"8px 14px",textAlign:"center",fontSize:".7rem",fontWeight:700,
        background:msg.ok?"rgba(39,174,96,.15)":"rgba(232,64,64,.15)",
        borderBottom:`1px solid ${msg.ok?C.grn:C.red}`,color:msg.ok?C.grn2:C.red2,flexShrink:0}}>
        {msg.text}
      </div>}

      <div style={{flex:1,overflowY:"auto",padding:12}}>
        {/* Mevcut oyun özeti */}
        <div style={{marginBottom:14,padding:12,background:"rgba(26,110,216,.06)",
          border:`1px solid rgba(77,166,255,0.22)`,borderRadius:8}}>
          <div style={{fontSize:".48rem",color:C.dmr,letterSpacing:1.5,textTransform:"uppercase",marginBottom:8}}>
            Mevcut İlerleme
          </div>
          <div style={{display:"flex",gap:6,marginBottom:10,flexWrap:"wrap"}}>
            {[
              ["Hafta",`${season.results.filter(r=>!["ZTK","HAZ","CL","UEFA","CON","SUPERKUPA"].includes(r.comp)).length}/${{"1. Lig":38,"Elit Lig":34,"İngiliz Ligi":38,"İspanyol Ligi":38,"Alman Ligi":34,"İtalyan Ligi":38,"Fransız Ligi":34,"Hollanda Ligi":34,"Portekiz Ligi":34,"İngiliz 2. Ligi":46}[season.league||"1. Lig"]||34}`,"#4da6ff"],
              ["Puan",myTeam.pts,"#ffd060"],
              ["Sıra",`${myRank}. sıra`,"#30e070"],
              ["Kadro",`${squad.length} oyuncu`,"#9b59b6"],
            ].map(([l,v,c])=>(
              <div key={l} style={{padding:"5px 10px",background:"rgba(26,110,216,.08)",
                border:`1px solid rgba(77,166,255,0.1)`,borderRadius:4,textAlign:"center",flex:1}}>
                <div style={{fontSize:".42rem",color:C.dmr,textTransform:"uppercase",marginBottom:1}}>{l}</div>
                <div style={{fontSize:".7rem",fontWeight:700,color:c}}>{v}</div>
              </div>
            ))}
          </div>

          {/* İki seçenek yan yana */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {/* Yeni kayıt */}
            <button onClick={doNewSave} style={{padding:"10px 6px",
              background:saves.length>=5?"rgba(100,120,160,.08)":`linear-gradient(135deg,${C.ac},#0944a8)`,
              border:`1px solid ${saves.length>=5?C.brd:C.ac}`,
              color:saves.length>=5?C.dmr:"#fff",
              fontSize:".62rem",fontWeight:700,letterSpacing:1,cursor:saves.length>=5?"not-allowed":"pointer",
              borderRadius:5,fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
              <span style={{fontSize:"1rem"}}>➕</span>
              <div style={{textAlign:"left"}}>
                <div>Yeni Kayıt</div>
                <div style={{fontSize:".44rem",fontWeight:400,opacity:.7}}>{saves.length}/5 slot</div>
              </div>
            </button>
            {/* En son kaydın üzerine yaz */}
            <button
              onClick={()=>saves.length>0?setOverwriteSlot(saves[0].id):showMsg("Henüz kayıt yok, yeni kayıt oluştur",false)}
              style={{padding:"10px 6px",
              background:"rgba(46,204,113,.12)",
              border:`1px solid rgba(39,174,96,.35)`,
              color:C.grn2,
              fontSize:".62rem",fontWeight:700,letterSpacing:1,cursor:"pointer",
              borderRadius:5,fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
              <span style={{fontSize:"1rem"}}>💾</span>
              <div style={{textAlign:"left"}}>
                <div>Son Kaydın Üzerine Yaz</div>
                <div style={{fontSize:".44rem",fontWeight:400,opacity:.7}}>
                  {saves.length>0?saves[0].date.split(" ")[0]:"Kayıt yok"}
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* İçe/Dışa aktar */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
          <label style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,
            padding:"9px 8px",background:"rgba(39,174,96,.07)",
            border:`1px solid rgba(39,174,96,.2)`,borderRadius:6,cursor:"pointer"}}>
            <span style={{fontSize:"1.1rem"}}>📂</span>
            <span style={{fontSize:".58rem",color:C.grn2,fontWeight:700}}>Dosyadan Yükle</span>
            <span style={{fontSize:".44rem",color:C.dmr}}>JSON kayıt dosyası</span>
            <input type="file" accept=".json" onChange={doImport} style={{display:"none"}}/>
          </label>
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,
            padding:"9px 8px",background:"rgba(200,153,42,.07)",
            border:`1px solid rgba(200,153,42,.2)`,borderRadius:6,
            color:C.gd,fontSize:".58rem",fontWeight:700,cursor:"default"}}>
            <span style={{fontSize:"1.1rem"}}>📤</span>
            <span>Dışa Aktar</span>
            <span style={{fontSize:".44rem",color:C.dmr}}>Kayıt seç → 📤</span>
          </div>
        </div>

        {/* Kayıt slotları */}
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
          <STitle style={{marginBottom:0}}>Kayıtlı Oyunlar</STitle>
          <span style={{fontSize:".46rem",color:C.dmr,marginLeft:"auto"}}>{saves.length}/5 slot kullanımda</span>
        </div>

        {saves.length===0&&(
          <div style={{textAlign:"center",padding:"28px 0",color:C.dmr}}>
            <div style={{fontSize:"2rem",marginBottom:8}}>💾</div>
            <div style={{fontSize:".68rem"}}>Henüz kayıt yok</div>
            <div style={{fontSize:".56rem",marginTop:4}}>Yukarıdan yeni kayıt oluştur</div>
          </div>
        )}
        {saves.map((slot,si)=>(
          <div key={slot.id} style={{marginBottom:8,padding:"10px 12px",
            background:si===0?"rgba(26,110,216,.08)":"rgba(11,21,37,.8)",
            border:`1px solid ${si===0?C.ac2:C.brd}`,borderRadius:6,
            position:"relative"}}>
            {si===0&&<div style={{position:"absolute",top:6,right:8,fontSize:".4rem",
              background:"rgba(77,166,255,.25)",color:C.ac2,padding:"1px 5px",borderRadius:2,
              fontWeight:700,letterSpacing:1}}>SON KAYIT</div>}
            <div style={{marginBottom:6}}>
              <div style={{fontSize:".68rem",fontWeight:700,color:C.wh,marginBottom:2}}>{slot.date}</div>
              <div style={{display:"flex",gap:8,fontSize:".52rem",color:C.dim}}>
                <span>H{slot.week}</span>
                <span>·</span>
                <span style={{color:C.gd}}>{slot.pts} puan</span>
                <span>·</span>
                <span>{slot.rank>0?slot.rank+". sıra":"—"}</span>
                <span>·</span>
                <span>{slot.squadSize} oyuncu</span>
                {slot.league&&<><span>·</span><span style={{color:C.ac2}}>{slot.league==="1. Lig"?"1.Lig":"Elit"}</span></>}
              </div>
            </div>
            {/* Üzerine yaz onay */}
            {overwriteSlot===slot.id?(
              <div style={{padding:"8px 10px",background:"rgba(39,174,96,.08)",borderRadius:4,
                border:"1px solid rgba(39,174,96,.25)",marginBottom:6}}>
                <div style={{fontSize:".58rem",color:C.grn2,marginBottom:6}}>
                  💾 Bu kaydın üzerine yazılacak. Devam?
                </div>
                <div style={{display:"flex",gap:6}}>
                  <button onClick={()=>doOverwrite(slot.id)} style={{flex:1,padding:"5px",
                    background:"rgba(39,174,96,.25)",border:`1px solid ${C.grn}`,color:C.grn2,
                    fontSize:".62rem",fontWeight:700,cursor:"pointer",borderRadius:3,fontFamily:"inherit"}}>
                    ✅ Evet, üzerine yaz
                  </button>
                  <button onClick={()=>setOverwriteSlot(null)} style={{flex:1,padding:"5px",
                    background:"transparent",border:`1px solid rgba(77,166,255,0.22)`,color:C.dim,
                    fontSize:".6rem",cursor:"pointer",borderRadius:3,fontFamily:"inherit"}}>İptal</button>
                </div>
              </div>
            ):confirmDel===slot.id?(
              <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:6}}>
                <span style={{flex:1,fontSize:".6rem",color:C.red2}}>Silinsin mi?</span>
                <button onClick={()=>doDelete(slot.id)} style={{padding:"5px 10px",
                  background:"rgba(192,57,43,.25)",border:`1px solid ${C.red}`,color:C.red2,
                  fontSize:".6rem",cursor:"pointer",borderRadius:3,fontFamily:"inherit"}}>Evet Sil</button>
                <button onClick={()=>setConfirmDel(null)} style={{padding:"5px 10px",
                  background:"rgba(100,120,160,.1)",border:`1px solid rgba(77,166,255,0.22)`,color:C.dim,
                  fontSize:".6rem",cursor:"pointer",borderRadius:3,fontFamily:"inherit"}}>İptal</button>
              </div>
            ):null}
            <div style={{display:"flex",gap:6}}>
              <button onClick={()=>doLoad(slot)} style={{flex:2,padding:"6px 0",
                background:`linear-gradient(135deg,${C.ac},#0944a8)`,border:"none",color:"#fff",
                fontSize:".62rem",fontWeight:700,cursor:"pointer",borderRadius:4,fontFamily:"inherit"}}>
                ▶ Yükle
              </button>
              <button onClick={()=>setOverwriteSlot(overwriteSlot===slot.id?null:slot.id)} style={{flex:2,padding:"6px 0",
                background:overwriteSlot===slot.id?"rgba(46,204,113,.2)":"rgba(46,204,113,.1)",
                border:`1px solid rgba(39,174,96,.${overwriteSlot===slot.id?5:2})`,color:C.grn2,
                fontSize:".62rem",fontWeight:700,cursor:"pointer",borderRadius:4,fontFamily:"inherit"}}>
                💾 Üzerine Yaz
              </button>
              <button onClick={()=>doExport(slot)} style={{flex:1,padding:"6px 0",
                background:"rgba(200,153,42,.15)",border:`1px solid ${C.gd2}`,color:C.gd,
                fontSize:".62rem",cursor:"pointer",borderRadius:4,fontFamily:"inherit"}}>📤</button>
              <button onClick={()=>setConfirmDel(slot.id)} style={{flex:1,padding:"6px 0",
                background:"rgba(232,64,64,.1)",border:`1px solid rgba(192,57,43,.3)`,color:C.red2,
                fontSize:".62rem",cursor:"pointer",borderRadius:4,fontFamily:"inherit"}}>🗑️</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
