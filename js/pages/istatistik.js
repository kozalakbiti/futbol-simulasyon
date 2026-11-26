// Deterministik sahte random (seed tabanlı, her render'da değişmez)
function seededRnd(seed,min,max){
  const x=Math.sin(seed+1)*10000;
  return min+Math.floor((x-Math.floor(x))*(max-min+1));
}

// Lig oyuncuları için gol/asist istatistikleri üret — played=0 ise herkes sifir
// squad ve clubName: kullanicinin gercek kadrosu ve takim adi
// ── KUPA GOL/ASİST KRALLARI — Gerçekçi oyuncu ismi üretici ──
function genCupPlayerName(teamName, slotIdx, seed) {
  const FIRST_NAMES = [
    "Silva","Müller","García","Rossi","Dubois","Kowalski","Andersen","Okafor",
    "Diallo","Santos","Moreira","Ferreira","Hernández","Costa","Martínez",
    "Ndombele","Kamara","Traoré","Benzema","Lewandowski","Salah","Kane",
    "Mbappe","Olmo","Pedri","Bellingham","Wirtz","Sané","Gnabry","Kimmich",
    "De Bruyne","Salisu","Rashford","Foden","Doku","Kvara","Vlahovic",
    "Lukaku","Dybala","Lautaro","Theo","Leao","Giroud","Osimhen","Kvaratskhelia"
  ];
  const LAST_INIT = ["A","B","C","D","E","F","G","H","J","K","L","M","N","O","P","R","S","T","V","Y"];
  const s = ((teamName.charCodeAt(0)||65)*31 + (teamName.charCodeAt(1)||65)*17 + slotIdx*13 + seed*7) % FIRST_NAMES.length;
  const li = ((teamName.charCodeAt(0)||65)*19 + slotIdx*11 + seed*3) % LAST_INIT.length;
  return FIRST_NAMES[s] + " " + LAST_INIT[li] + ".";
}

// Takımın gerçek DB oyuncularından gol/asist dağılımı — gerçekçi yoğunluklu dağılım
function getTeamEuroScorers(teamName, totalGf, dbRef){
  if(!dbRef||!teamName||totalGf<=0) return [];
  const FW_POS=["ST","LW","RW","CF"];
  const CAM_POS=["CAM"];
  const MF_POS=["LM","RM","CM","CDM"];
  const players=(dbRef||DB).filter(p=>p.club===teamName&&p.pos!=="GK"&&p.pos!=="CB"&&p.pos!=="LB"&&p.pos!=="RB"&&p.pos!=="LWB"&&p.pos!=="RWB");
  if(players.length===0) return [];
  // Takıma özgü deterministik seed
  const tnSeed=teamName.split("").reduce((h,c)=>((h<<5)+h)+c.charCodeAt(0),5381)>>>0;
  // Her oyuncuya pozisyon + OVR + kişisel varyasyon ile ağırlık ver
  const withWeights=players.map(p=>{
    const pSeed=((tnSeed*31)^(p.ovr||70)*17^(p.n.charCodeAt(0)||65)*7)>>>0;
    const varG=(pSeed%25)/100;       // 0.00-0.24 varyasyon
    const varA=((pSeed>>8)%25)/100;
    const isFW=FW_POS.includes(p.pos);
    const isCAM=CAM_POS.includes(p.pos);
    const isMF=MF_POS.includes(p.pos);
    const ovrBonus=((p.ovr||70)-65)*0.020; // OVR 65→0, 80→0.30, 90→0.50
    const gw=isFW?(0.80+ovrBonus+varG):isCAM?(0.28+ovrBonus*0.6+varG):isMF?(0.10+ovrBonus*0.3+varG):0.02;
    const aw=isFW?(0.18+ovrBonus*0.4+varA):isCAM?(0.48+ovrBonus*0.7+varA):isMF?(0.38+ovrBonus*0.5+varA):0.04;
    return{p,gw:Math.max(0,gw),aw:Math.max(0,aw)};
  });
  // Sadece anlamlı gol ağırlığı olan oyuncular (DEF/GK hariç zaten)
  const totalGW=withWeights.reduce((s,x)=>s+x.gw,0)||1;
  const totalAW=withWeights.reduce((s,x)=>s+x.aw,0)||1;
  // Her oyuncunun gol/asist payini hesapla
  // FW lider oyuncu 6 maclik grup asama sonu 6-9 gol atmali
  // totalGf cogunlukla 8-12 — FW %42 payla 3-5 gol cikiyor ki bu az
  // Cozum: takim toplam golunu dogrudan kullan ama lidere daha gercekci pay ver
  // totalGf genellikle 8-12 arasi — FW lider gercekte 6-9 gol ater
  // Gercek gf ile 6mac*3gol=18 hedefini karistir: dusuk gf de yeterli gorunsun
  const normGf=totalGf+Math.max(0,18-totalGf)*0.6;
  const result=[];
  withWeights.forEach(({p,gw,aw})=>{
    const g=Math.round(normGf*(gw/totalGW));
    const a=Math.round(normGf*1.10*(aw/totalAW));
    if(g>0||a>0) result.push({n:p.n,pos:p.pos,team:teamName,g,a});
  });
  return result;
}

function genLigScorers(season, squad, clubName, dbOverride){
  const myLg=season.league||"1. Lig";
  // Sadece lig maçlarını say — HAZ (hazırlık) maçları GK/AK'a dahil edilmez
  const EXCL_COMPS=["HAZ","ZTK","CL","UEFA","CON","SUPERKUPA"];
  const ligPlayed=(season.results||[]).filter(r=>!EXCL_COMPS.includes(r.comp)).length;
  const played=ligPlayed; // eski "season.played" yerine sadece lig maçları
  const attPos=["ST","LM","RM","CAM","CM"];

  // Mevcut kadrodaki oyuncu ID'leri — bunlar DB'den gösterilmez (me:true olarak eklenir)
  const squadIds=new Set((squad||[]).map(p=>p.id));
  // Mevcut kadrodaki oyuncu isimleri — isim çakışmasını önle
  const squadNames=new Set((squad||[]).map(p=>p.n));

  // DB'den ligteki oyuncuları al — ama kadrodakiler ve transferleri hariç tut
  // p.club aynı liğin takımında mı? Evet ise göster, hayır ise atla
  const lgTeams=new Set((season.teams||[]).filter(t=>t.lg===myLg).map(t=>t.n));
  // Kullanıcı takımını da ekle
  if(clubName) lgTeams.add(clubName);

  const lgPlayers=(dbOverride||DB).filter(p=>
    p.lg===myLg &&
    attPos.includes(p.pos) &&
    !squadIds.has(p.id) &&        // Kendi kadromuzda değil
    !squadNames.has(p.n) &&       // İsim çakışması yok
    lgTeams.has(p.club)           // Kulübü hâlâ bu liğde
  ).slice(0,40);

  const result=lgPlayers.map((p)=>{
    if(played===0) return{n:p.n,pos:p.pos,club:p.club,g:0,a:0,m:0,me:false,ovr:p.ovr};
    const FW_POS=["ST","LW","RW","CF","CAM"];
    const MF_POS=["LM","RM","CM","CDM"];
    // OVR bazlı starter tahmini — yüksek OVR oyuncu büyük ihtimalle ilk 11'de
    const isStarter=p.ovr>=74;
    const goalBase=FW_POS.includes(p.pos)?0.45:MF_POS.includes(p.pos)?0.20:0.05;
    const assistBase=FW_POS.includes(p.pos)?0.22:MF_POS.includes(p.pos)?0.48:0.10;
    const starterMult=isStarter?1.0:0.4;
    const variance=seededRnd(p.id*13,85,115)/100;
    const ovrFactor=p.ovr>=88?1.3:p.ovr>=82?1.0:p.ovr>=76?0.75:0.5;
    const g=Math.round(played*goalBase*ovrFactor*starterMult*variance);
    const a=Math.round(played*assistBase*ovrFactor*starterMult*variance);
    return{n:p.n,pos:p.pos,club:p.club,g,a,m:played,me:false,ovr:p.ovr};
  });

  // Kullanicinin gercek kadrosu — seasonGoals/seasonAssists verisini kullan
  const myClub=clubName||"FC Yildiz";
  if(squad&&squad.length>0){
    const attackers=squad.filter(p=>attPos.includes(p.pos));
    attackers.forEach((p)=>{
      if((p.seasonMatches||0)===0 && (p.seasonGoals||0)===0 && (p.seasonAssists||0)===0) return;
      // Starter eşiği: sezonun %40'ında oynamış olmalı (daha sıkı)
      const matchThreshold=Math.max(5, Math.floor(played*0.40));
      const isRegular=(p.seasonMatches||0)>=matchThreshold;
      const rawGoals=p.seasonGoals||0;
      const rawAssists=p.seasonAssists||0;
      const rawMatches=p.seasonMatches||0;
      // Yedekse: maç oranına göre ölçekle (maç/eşik oranı)
      const matchRatio=Math.min(1, rawMatches/Math.max(matchThreshold,1));
      const scaledGoals=isRegular?rawGoals:Math.round(rawGoals*matchRatio);
      const scaledAssists=isRegular?rawAssists:Math.round(rawAssists*matchRatio);
      // Çok az etki — atla
      if(scaledGoals===0 && scaledAssists===0) return;
      if(!isRegular && scaledGoals<2 && scaledAssists<3) return;
      const alreadyInResult=result.findIndex(r=>r.n===p.n);
      const entry={n:p.n,pos:p.pos,club:myClub,g:scaledGoals,a:Math.round(scaledAssists*0.80),m:rawMatches,me:true,ovr:p.ovr};
      if(alreadyInResult>=0) result[alreadyInResult]=entry;
      else result.push(entry);
    });
  } else {
    // Fallback: squad yoksa simule et (geriye donuk uyumluluk)
    const mf=0.6;
    result.push({n:"A.Yildiz",pos:"ST",club:myClub,g:Math.round(played*0.55*mf),a:Math.round(played*0.22*mf),m:played,me:true,ovr:75});
    result.push({n:"F.Turan", pos:"ST",club:myClub,g:Math.round(played*0.38*mf),a:Math.round(played*0.16*mf),m:played,me:true,ovr:72});
    result.push({n:"B.Dogan", pos:"CM",club:myClub,g:Math.round(played*0.22*mf),a:Math.round(played*0.40*mf),m:played,me:true,ovr:70});
    result.push({n:"O.Kurt",  pos:"LM",club:myClub,g:Math.round(played*0.18*mf),a:Math.round(played*0.32*mf),m:played,me:true,ovr:68});
  }
  return result;
}

// Avrupa kupaları canlı görünümü — 36 takımlı Swiss tablo + eleme ağacı (js/ui/euro.js)
function EuroSimWidget({season,clubName,db}){
  const avail=EURO_COMP_LIST.filter(c=>season&&season[EURO_TABLE_KEY[c]]);
  const mine=avail.find(c=>(season[EURO_TABLE_KEY[c]].teams||[]).some(t=>t.me));
  const [comp,setComp]=useState(mine||avail[0]||"CL");
  return(
    <div>
      <div style={{display:"flex",gap:4,marginBottom:8}}>
        {EURO_COMP_LIST.map(c=>(
          <button key={c} onClick={()=>setComp(c)} style={{flex:1,padding:"5px 4px",borderRadius:5,fontSize:".52rem",fontWeight:700,cursor:"pointer",
            background:comp===c?`rgba(${EURO_META[c].rgb},.18)`:"rgba(255,255,255,.03)",color:comp===c?EURO_META[c].color:C.dim,
            border:`1px solid ${comp===c?`rgba(${EURO_META[c].rgb},.45)`:"rgba(255,255,255,.06)"}`}}>
            {EURO_META[c].icon} {EURO_META[c].short}{c===mine?" ▶":""}
          </button>
        ))}
      </div>
      <EuroSwissPanel key={comp} season={season} comp={comp} clubName={clubName} db={db}/>
    </div>
  );
}

function PageIstatistik({season,squad,clubName="FC Yildiz",careerStats,pendingEuroGroups,db:dbProp}){
  const [tab,setTab]=useState("krallik");
  const [ligTab,setLigTab]=useState("gol");

  const played=season?.played||0;
  const myLg=season.league||"1. Lig";

  // Lig oyuncu istatistikleri
  const ligScorers=genLigScorers(season,squad,clubName,dbProp);
  const topScorers=[...ligScorers].sort((a,b)=>b.g-a.g).slice(0,20);
  const topAssisters=[...ligScorers].sort((a,b)=>b.a-a.a).slice(0,20);

  // FC Yildiz gercek kadro istatistikleri — her oyuncunun sezon verisi
  const myPlayers=(squad||[])
    .filter(p=>p.seasonMatches>0||(p.seasonGoals||0)>0||(p.seasonAssists||0)>0)
    .map(p=>({
      n:p.n, pos:p.pos,
      m:p.seasonMatches||0,
      g:p.seasonGoals||0,
      a:p.seasonAssists||0,
      ratings:p.seasonRatings||[],
      avgRating:p.seasonRatings&&p.seasonRatings.length>0
        ?Math.round(p.seasonRatings.reduce((x,y)=>x+y,0)/p.seasonRatings.length)
        :0,
      fatigue:p.fatigue||0,
      injSev:p.injSev||0,
      injured:p.injured||0,
    }));
  // Hicbir oyuncu mac oynamamissa tam kadroyu goster (sezon basi)
  const noMatchPlayed=myPlayers.length===0;
  const myPlayersFinal=noMatchPlayed
    ?(squad||[]).sort((a,b)=>b.ovr-a.ovr).slice(0,15).map(p=>({
        n:p.n,pos:p.pos,m:0,g:0,a:0,ratings:[],avgRating:0,
        fatigue:p.fatigue||0,injSev:p.injSev||0,injured:p.injured||0
      }))
    :myPlayers;

  // Takim istatistikleri — gercek season verisinden
  const myTeam=(season.teams||[]).find(t=>t.me)||{w:0,d:0,l:0,gf:0,ga:0,pts:0};
  const ts=played===0
    ?[["Oynanmis Mac","0"],["Atilan Gol","0"],["Yenilen Gol","0"],["Mac Basi Gol","—"],["Isabetli Sut","—"],["Basarili Pas","—"]]
    :[
      ["Oynanmis Mac",played],
      ["Atilan Gol",myTeam.gf||0],
      ["Yenilen Gol",myTeam.ga||0],
      ["Mac Basi Gol",played>0?((myTeam.gf||0)/played).toFixed(1):"—"],
      ["Isabetli Sut",played>0?`%${Math.round(35+played*0.5)}`:"—"],
      ["Basarili Pas",played>0?`%${Math.min(85,72+played)}`:"—"],
    ];

  const teamGrades=calcTeamGrades(squad);
  const allTeamGrades=INIT_TEAMS.map(t=>{
    const base=t.str;
    const gk=ovrToGrade(base-seededRnd(t.n.length*3,0,8));
    const def=ovrToGrade(base-seededRnd(t.n.length*5,0,6));
    const mid=ovrToGrade(base-seededRnd(t.n.length*7,0,5));
    const att=ovrToGrade(base-seededRnd(t.n.length*11,0,7));
    return{...t,gk,def,mid,att,overall:ovrToGrade(base)};
  });

  const tabBtnStyle=(k)=>({
    background:tab===k?"rgba(45,143,255,.25)":"rgba(26,110,216,.06)",
    border:`1px solid ${tab===k?C.ac2:C.brd}`,color:tab===k?C.wh:C.dim,
    fontSize:".5rem",padding:"3px 7px",cursor:"pointer",borderRadius:2,fontFamily:"inherit",whiteSpace:"nowrap"
  });

  const rankColor=(i)=>i===0?"#ffd060":i===1?"#c0c8d8":i===2?"#c87533":C.dim;
  const rankEmoji=(i)=>i===0?"🥇":i===1?"🥈":i===2?"🥉":null;


  return(
    <div style={{flex:1,display:"flex",flexDirection:"column",minHeight:0}}>
      {/* Ana tab bar */}
      <div style={{padding:"5px 10px",borderBottom:`1px solid rgba(77,166,255,0.1)`,display:"flex",gap:4,flexShrink:0,flexWrap:"wrap"}}>
        {[["krallik","⚽ Krallıklar"],["benim","📋 "+clubName],["takim","📊 Takım İst."],["guc","💪 Güç"],["grafik","📈 Grafik"],["avrupa","🌍 Avrupa"],["kariyer","🏅 Kariyer"]].map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)} style={tabBtnStyle(k)}>{l}</button>
        ))}
      </div>

      {/* ─── AVRUPA (Swiss model) ─── */}
      {tab==="avrupa"&&<div style={{flex:1,overflowY:"auto",padding:"8px 10px"}}>
        <EuroSimWidget season={season} clubName={clubName} db={dbProp}/>
      </div>}

      {/* ─── KRALLIKLAR ─── */}
      {tab==="krallik"&&<div style={{flex:1,display:"flex",flexDirection:"column",minHeight:0}}>
        {/* Alt tab: gol / asist */}
        <div style={{padding:"4px 10px",borderBottom:`1px solid rgba(77,166,255,0.1)`,display:"flex",gap:4,flexShrink:0}}>
          {[["gol","⚽ Gol Krallığı"],["asist","🎯 Asist Krallığı"]].map(([k,l])=>(
            <button key={k} onClick={()=>setLigTab(k)} style={{
              background:ligTab===k?"rgba(232,184,58,.2)":"rgba(232,184,58,.04)",
              border:`1px solid ${ligTab===k?C.gd:C.brd}`,color:ligTab===k?C.gd:C.dim,
              fontSize:".5rem",padding:"3px 8px",cursor:"pointer",borderRadius:2,fontFamily:"inherit"}}>
              {l}
            </button>
          ))}
          <div style={{marginLeft:"auto",display:"flex",alignItems:"center",
            fontSize:".44rem",color:C.dmr,padding:"2px 6px",background:"rgba(26,110,216,.06)",
            borderRadius:2,border:`1px solid rgba(77,166,255,0.22)`}}>
            {myLg}
          </div>
        </div>

        <div style={{flex:1,overflowY:"auto",padding:"8px 10px"}}>
          {/* Header */}
          <div style={{display:"grid",gridTemplateColumns:"22px 26px 1fr 60px 26px",gap:2,
            padding:"2px 2px",fontSize:".42rem",letterSpacing:1.5,color:C.dmr,
            textTransform:"uppercase",marginBottom:4,borderBottom:`1px solid rgba(77,166,255,0.22)`}}>
            <span>#</span><span>Pos</span><span>Oyuncu</span><span>Kulüp</span>
            <span style={{textAlign:"center",color:ligTab==="gol"?C.gd:C.grn2}}>
              {ligTab==="gol"?"GOL":"AST"}
            </span>
          </div>
          {(ligTab==="gol"?topScorers:topAssisters).map((s,i)=>{
            const val=ligTab==="gol"?s.g:s.a;
            const maxVal=ligTab==="gol"?topScorers[0].g:topAssisters[0].a;
            const barW=maxVal>0?Math.round(val/maxVal*100):0;
            const barCol=ligTab==="gol"?C.gd:C.grn2;
            return(
              <div key={i} style={{
                padding:"6px 4px",borderBottom:`1px solid rgba(77,166,255,0.1)`,
                background:s.me?"rgba(45,143,255,.12)":"transparent",
                borderLeft:s.me?`3px solid ${C.ac2}`:"3px solid transparent"
              }}>
                <div style={{display:"grid",gridTemplateColumns:"22px 26px 1fr 60px 26px",gap:2,alignItems:"center",marginBottom:3}}>
                  <span style={{color:rankColor(i),fontSize:".56rem",fontWeight:i<3?700:400,textAlign:"center"}}>
                    {rankEmoji(i)||i+1}
                  </span>
                  <PosTag pos={s.pos} small/>
                  <div style={{minWidth:0}}>
                    <div style={{fontSize:".64rem",fontWeight:s.me?700:500,
                      color:s.me?C.ac2:C.wh,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                      {s.n}
                    </div>
                  </div>
                  <span style={{fontSize:".5rem",color:C.dim,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.club}</span>
                  <span style={{textAlign:"center",fontSize:".76rem",fontWeight:800,color:barCol}}>{val}</span>
                </div>
                {/* Bar */}
                <div style={{height:3,background:"rgba(255,255,255,.05)",borderRadius:2,overflow:"hidden",marginLeft:48}}>
                  <div style={{height:"100%",width:`${barW}%`,background:barCol,borderRadius:2,
                    opacity: i<3?1:0.6}}/>
                </div>
              </div>
            );
          })}
        </div>
      </div>}

      {/* ─── KENDİ İSTATİSTİKLERİ ─── */}
      {tab==="benim"&&<div style={{flex:1,overflowY:"auto",padding:"8px 10px"}}>
        <div style={{fontSize:".52rem",color:C.ac2,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginBottom:6}}>
          {clubName} — Oyuncu Performansı
        </div>
        {/* Sezon özet kutuları */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:4,marginBottom:8}}>
          {[
            {l:"Top Gol",v:(myPlayersFinal.reduce((s,p)=>s+p.g,0)),c:C.gd,icon:"⚽"},
            {l:"Top Asist",v:(myPlayersFinal.reduce((s,p)=>s+p.a,0)),c:C.grn2,icon:"🎯"},
            {l:"Ort. Rating",v:myPlayersFinal.filter(p=>p.avgRating>0).length>0
              ?Math.round(myPlayersFinal.filter(p=>p.avgRating>0).reduce((s,p)=>s+p.avgRating,0)/myPlayersFinal.filter(p=>p.avgRating>0).length)
              :"—",c:C.ac2,icon:"⭐"},
            {l:"Sakatlar",v:(squad||[]).filter(p=>p.injured>0).length,c:C.red2,icon:"🏥"},
          ].map((x,i)=>(
            <div key={i} style={{background:"rgba(255,255,255,.04)",border:`1px solid rgba(255,255,255,.08)`,
              borderRadius:5,padding:"5px 4px",textAlign:"center"}}>
              <div style={{fontSize:".9rem"}}>{x.icon}</div>
              <div style={{fontSize:".82rem",fontWeight:900,color:x.c}}>{x.v}</div>
              <div style={{fontSize:".38rem",color:C.dmr,marginTop:1}}>{x.l}</div>
            </div>
          ))}
        </div>
        {/* Tablo başlığı */}
        <div style={{display:"grid",gridTemplateColumns:"18px 24px 1fr 28px 22px 24px 24px 28px 22px",gap:2,
          padding:"2px 2px",fontSize:".38rem",letterSpacing:1.2,color:C.dmr,textTransform:"uppercase",marginBottom:2,borderBottom:`1px solid rgba(77,166,255,0.22)`}}>
          <span>#</span><span>Pos</span><span>Ad</span>
          <span style={{textAlign:"center",color:"#9b59b6"}}>OVR</span>
          <span style={{textAlign:"center"}}>MAÇ</span>
          <span style={{textAlign:"center",color:C.gd}}>GOL</span>
          <span style={{textAlign:"center",color:C.grn2}}>AST</span>
          <span style={{textAlign:"center",color:C.ac2}}>RTG</span>
          <span style={{textAlign:"center"}}>KON</span>
        </div>
        {[...myPlayersFinal].sort((a,b)=>b.g-a.g||b.a-a.a).map((s,i)=>{
          const fullP=(squad||[]).find(p=>p.n===s.n);
          const fatCol=s.fatigue>70?"#ff5050":s.fatigue>40?"#e67e22":C.grn2;
          const ratingCol=s.avgRating>=80?C.grn2:s.avgRating>=70?C.ac2:s.avgRating>0?C.gd:C.dmr;
          const pTraits=fullP&&fullP.traits?fullP.traits:[];
          return(
            <div key={i} style={{borderBottom:`1px solid rgba(77,166,255,0.1)`,
              background:s.injured>0?"rgba(231,76,60,.06)":"transparent",
              borderLeft:s.injured>0?"2px solid rgba(231,76,60,.4)":"2px solid transparent"}}>
              <div style={{display:"grid",gridTemplateColumns:"18px 24px 1fr 28px 22px 24px 24px 28px 22px",
                gap:2,alignItems:"center",padding:"5px 2px"}}>
                <span style={{color:i<3?C.gd:C.dim,fontSize:".52rem",textAlign:"center",fontWeight:i<3?700:400}}>{rankEmoji(i)||i+1}</span>
                <PosTag pos={s.pos} small/>
                <div style={{minWidth:0}}>
                  <div style={{fontSize:".62rem",color:s.injured>0?C.red2:C.wh,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                    {s.n}{s.injured>0?<span style={{fontSize:".45rem",color:C.red2}}> 🩹{s.injured}h</span>:""}
                  </div>
                  {s.injSev>0&&s.injured>0&&<div style={{fontSize:".38rem",color:s.injSev===3?"#ff5050":s.injSev===2?"#e67e22":"#ffd060"}}>
                    {s.injSev===3?"● Ağır":s.injSev===2?"● Orta":"● Hafif"} sakatlık
                  </div>}
                </div>
                <span style={{textAlign:"center",fontSize:".6rem",fontWeight:700,color:"#9b59b6"}}>{fullP?fullP.ovr:"—"}</span>
                <span style={{textAlign:"center",fontSize:".54rem",color:C.dim}}>{s.m||0}</span>
                <span style={{textAlign:"center",fontSize:".72rem",fontWeight:700,color:C.gd}}>{s.g}</span>
                <span style={{textAlign:"center",fontSize:".68rem",fontWeight:600,color:C.grn2}}>{s.a}</span>
                <span style={{textAlign:"center",fontSize:".62rem",fontWeight:700,color:ratingCol}}>{s.avgRating||"—"}</span>
                <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:1}}>
                  <div style={{width:16,height:3,background:"rgba(255,255,255,.1)",borderRadius:2,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${s.fatigue||0}%`,background:fatCol,borderRadius:2}}/>
                  </div>
                  <span style={{fontSize:".38rem",color:fatCol}}>{s.fatigue||0}</span>
                </div>
              </div>
              {pTraits.length>0&&<div style={{display:"flex",gap:3,paddingLeft:44,paddingBottom:4,flexWrap:"wrap"}}>
                {pTraits.map(t=>{
                  const tr=PLAYER_TRAITS[t];
                  if(!tr) return null;
                  return(<span key={t} style={{fontSize:".36rem",padding:"1px 5px",borderRadius:8,
                    background:"rgba(155,89,182,.12)",border:"1px solid rgba(155,89,182,.25)",
                    color:"#b39ddb",fontWeight:600,whiteSpace:"nowrap"}}>
                    {tr.icon} {tr.label}
                  </span>);
                })}
              </div>}
            </div>
          );
        })}
        {noMatchPlayed&&myPlayersFinal.length>0&&(
          <div style={{padding:"8px 10px",background:"rgba(26,110,216,.07)",border:"1px solid rgba(26,110,216,.15)",
            borderRadius:5,marginTop:8,textAlign:"center"}}>
            <div style={{fontSize:".5rem",color:C.dmr}}>⏳ Henüz maç oynanmadı — istatistikler ilk maçtan sonra güncellenir</div>
          </div>
        )}
        {myPlayersFinal.length===0&&<div style={{textAlign:"center",padding:"20px",color:C.dmr,fontSize:".6rem"}}>
          ⏳ Kadro boş
        </div>}
      </div>}

      {/* ─── TAKIM İSTATİSTİKLERİ ─── */}
      {tab==="takim"&&<div style={{flex:1,overflowY:"auto",padding:"8px 10px"}}>
        <STitle extra={`${clubName}`}>Takım Sezon İstatistikleri</STitle>
        {ts.map(([l,v],i)=>(
          <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"7px 4px",borderBottom:`1px solid rgba(77,166,255,0.1)`,fontSize:".7rem"}}>
            <span style={{color:C.dim}}>{l}</span>
            <span style={{color:C.wh,fontWeight:600}}>{v}</span>
          </div>
        ))}
        {/* Maç özeti */}
        <div style={{marginTop:10,padding:10,background:"rgba(26,110,216,.07)",border:`1px solid rgba(77,166,255,0.22)`,borderRadius:6}}>
          <div style={{fontSize:".46rem",color:C.dim,textTransform:"uppercase",letterSpacing:1.5,marginBottom:6,fontWeight:700}}>Maç Özeti</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,textAlign:"center"}}>
            {[
              {l:"Galibiyet",v:(season.teams||[]).find(t=>t.me)?.w||0,c:C.grn2},
              {l:"Beraberlik",v:(season.teams||[]).find(t=>t.me)?.d||0,c:C.gd},
              {l:"Mağlubiyet",v:(season.teams||[]).find(t=>t.me)?.l||0,c:C.red2},
            ].map((x,i)=>(
              <div key={i} style={{background:"rgba(255,255,255,.04)",borderRadius:4,padding:"6px 4px",border:`1px solid rgba(255,255,255,.06)`}}>
                <div style={{fontSize:"1.1rem",fontWeight:900,color:x.c}}>{x.v}</div>
                <div style={{fontSize:".44rem",color:C.dmr}}>{x.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>}

      {/* ─── GÜÇ ANALİZİ ─── */}
      {tab==="guc"&&<div style={{flex:1,overflowY:"auto",padding:"8px 10px"}}>
        <STitle extra="A=Mükemmel D=Vasat">Takım Güç Analizi</STitle>
        <div style={{padding:10,marginBottom:10,background:"rgba(45,143,255,.12)",border:`1px solid ${C.ac2}`,borderRadius:5}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
            <div style={{fontSize:".72rem",fontWeight:700,color:C.ac2}}>▶ {clubName.toUpperCase()}</div>
            <div style={{display:"flex",gap:4,alignItems:"center"}}>
              {[["GK",teamGrades.GK],["DEF",teamGrades.DEF],["MID",teamGrades.MID],["ATT",teamGrades.ATT]].map(([l,g])=>(
                <div key={l} style={{textAlign:"center"}}>
                  <div style={{fontSize:".42rem",color:C.dmr,textTransform:"uppercase",marginBottom:2}}>{l}</div>
                  <div style={{width:28,height:28,borderRadius:4,display:"flex",alignItems:"center",justifyContent:"center",
                    background:`${gradeColor(g)}22`,border:`1px solid ${gradeColor(g)}66`,
                    fontWeight:800,fontSize:".82rem",color:gradeColor(g)}}>{g}</div>
                </div>
              ))}
              <div style={{textAlign:"center",marginLeft:4}}>
                <div style={{fontSize:".42rem",color:C.dmr,textTransform:"uppercase",marginBottom:2}}>GNL</div>
                <div style={{width:32,height:32,borderRadius:4,display:"flex",alignItems:"center",justifyContent:"center",
                  background:`${gradeColor(teamGrades.overall)}22`,border:`2px solid ${gradeColor(teamGrades.overall)}`,
                  fontWeight:900,fontSize:".9rem",color:gradeColor(teamGrades.overall)}}>{teamGrades.overall}</div>
              </div>
            </div>
          </div>
        </div>
        {allTeamGrades.filter(t=>!t.me).sort((a,b)=>b.str-a.str).map((t,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 8px",borderBottom:`1px solid rgba(77,166,255,0.1)`,borderRadius:2}}>
            <span style={{flex:1,fontSize:".7rem",color:C.dim}}>{t.n}</span>
            {[["GK",t.gk],["DEF",t.def],["MID",t.mid],["ATT",t.att],["GNL",t.overall]].map(([l,g])=>(
              <div key={l} style={{textAlign:"center"}}>
                <div style={{fontSize:".4rem",color:C.dmr,textTransform:"uppercase",marginBottom:1}}>{l}</div>
                <div style={{width:l==="GNL"?26:22,height:l==="GNL"?26:22,borderRadius:3,
                  display:"flex",alignItems:"center",justifyContent:"center",
                  background:`${gradeColor(g)}18`,border:`1px solid ${gradeColor(g)}55`,
                  fontWeight:l==="GNL"?800:700,fontSize:l==="GNL"?".72rem":".62rem",color:gradeColor(g)}}>{g}</div>
              </div>
            ))}
          </div>
        ))}
      </div>}

      {/* ─── GRAFİK ─── */}
      {tab==="grafik"&&<div style={{flex:1,overflowY:"auto",padding:"8px 10px"}}>
        {(()=>{
          const rh=season.rankHistory||[];
          const lgResults=(season.results||[]).filter(r=>!["ZTK","HAZ","CL","UEFA","CON","SUPERKUPA"].includes(r.comp));
          const maxRank=(season.teams||[]).filter(t=>t.lg===(season.league||"1. Lig")).length||19;
          if(rh.length<2) return(
            <div style={{textAlign:"center",padding:"40px 16px",color:C.dmr,fontSize:".56rem"}}>
              📈 Grafik için en az 2 maç oynayın
            </div>
          );
          // Sıra grafiği
          const W=320; const H=120; const pad=24;
          const chartW=W-pad*2; const chartH=H-pad*2;
          const maxW=rh[rh.length-1]?.w||1;
          const minW=rh[0]?.w||1;
          const xScale=(w)=>pad+(w-minW)/(Math.max(maxW-minW,1))*chartW;
          const yScale=(r)=>pad+(r-1)/(Math.max(maxRank-1,1))*chartH;
          // SVG polyline
          const pts=rh.map(p=>`${xScale(p.w).toFixed(1)},${yScale(p.rank).toFixed(1)}`).join(" ");
          const ptsArea=`${xScale(rh[0].w).toFixed(1)},${(pad+chartH).toFixed(1)} ${pts} ${xScale(rh[rh.length-1].w).toFixed(1)},${(pad+chartH).toFixed(1)}`;
          const lastRank=rh[rh.length-1]?.rank||1;
          const rankColor=lastRank<=3?C.grn2:lastRank<=6?C.gd:lastRank<=10?C.wh:C.red;
          return(<>
            <STitle extra={`Şu an: ${lastRank}. sıra`}>Sıra Grafiği</STitle>
            <div style={{background:"rgba(0,0,0,.3)",borderRadius:8,border:`1px solid rgba(77,166,255,.15)`,marginBottom:12,overflow:"hidden"}}>
              <svg viewBox={`0 0 ${W} ${H}`} style={{width:"100%",display:"block"}}>
                {/* Grid yatay çizgiler */}
                {[1,Math.ceil(maxRank/4),Math.ceil(maxRank/2),Math.ceil(maxRank*3/4),maxRank].map((r,i)=>(
                  <g key={i}>
                    <line x1={pad} y1={yScale(r)} x2={pad+chartW} y2={yScale(r)} stroke="rgba(255,255,255,.06)" strokeWidth="1"/>
                    <text x={pad-3} y={yScale(r)+4} textAnchor="end" fill="rgba(255,255,255,.3)" fontSize="7">{r}</text>
                  </g>
                ))}
                {/* Alan dolgusu */}
                <polygon points={ptsArea} fill={`${rankColor}18`}/>
                {/* Çizgi */}
                <polyline points={pts} fill="none" stroke={rankColor} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>
                {/* Son nokta */}
                <circle cx={xScale(rh[rh.length-1].w)} cy={yScale(lastRank)} r="4" fill={rankColor} stroke="#0a0f1e" strokeWidth="2"/>
                {/* Eksen */}
                <line x1={pad} y1={pad} x2={pad} y2={pad+chartH} stroke="rgba(255,255,255,.15)" strokeWidth="1"/>
                <line x1={pad} y1={pad+chartH} x2={pad+chartW} y2={pad+chartH} stroke="rgba(255,255,255,.15)" strokeWidth="1"/>
              </svg>
            </div>
            {/* Puan grafiği */}
            <STitle extra="">Puan Gelişimi</STitle>
            <div style={{background:"rgba(0,0,0,.3)",borderRadius:8,border:`1px solid rgba(77,166,255,.15)`,marginBottom:12,overflow:"hidden"}}>
              {(()=>{
                const maxPts=Math.max(...rh.map(p=>p.pts),1);
                const yPts=(p)=>pad+(1-p/maxPts)*chartH;
                const ptsPts=rh.map(p=>`${xScale(p.w).toFixed(1)},${yPts(p.pts).toFixed(1)}`).join(" ");
                const ptsArea2=`${xScale(rh[0].w).toFixed(1)},${(pad+chartH).toFixed(1)} ${ptsPts} ${xScale(rh[rh.length-1].w).toFixed(1)},${(pad+chartH).toFixed(1)}`;
                const lastPts=rh[rh.length-1]?.pts||0;
                return(
                  <svg viewBox={`0 0 ${W} ${H}`} style={{width:"100%",display:"block"}}>
                    {[0,Math.ceil(maxPts/4),Math.ceil(maxPts/2),Math.ceil(maxPts*3/4),maxPts].map((p2,i)=>(
                      <g key={i}>
                        <line x1={pad} y1={yPts(p2)} x2={pad+chartW} y2={yPts(p2)} stroke="rgba(255,255,255,.06)" strokeWidth="1"/>
                        <text x={pad-3} y={yPts(p2)+4} textAnchor="end" fill="rgba(255,255,255,.3)" fontSize="7">{p2}</text>
                      </g>
                    ))}
                    <polygon points={ptsArea2} fill="rgba(77,166,255,.12)"/>
                    <polyline points={ptsPts} fill="none" stroke={C.ac2} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>
                    <circle cx={xScale(rh[rh.length-1].w)} cy={yPts(lastPts)} r="4" fill={C.ac2} stroke="#0a0f1e" strokeWidth="2"/>
                    <line x1={pad} y1={pad} x2={pad} y2={pad+chartH} stroke="rgba(255,255,255,.15)" strokeWidth="1"/>
                    <line x1={pad} y1={pad+chartH} x2={pad+chartW} y2={pad+chartH} stroke="rgba(255,255,255,.15)" strokeWidth="1"/>
                  </svg>
                );
              })()}
            </div>
            {/* Form özeti */}
            <STitle extra="">Son Form</STitle>
            <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:12}}>
              {(season.form||[]).slice(-10).map((r,i)=>(
                <div key={i} style={{width:28,height:28,borderRadius:4,display:"flex",alignItems:"center",justifyContent:"center",
                  fontWeight:800,fontSize:".62rem",
                  background:r==="W"?"rgba(39,174,96,.25)":r==="D"?"rgba(243,156,18,.25)":"rgba(231,76,60,.25)",
                  border:`1px solid ${r==="W"?"rgba(39,174,96,.5)":r==="D"?"rgba(243,156,18,.5)":"rgba(231,76,60,.5)"}`,
                  color:r==="W"?C.grn2:r==="D"?C.gd:C.red}}>
                  {r}
                </div>
              ))}
            </div>
            {/* Maç istatistikleri */}
            {(()=>{
              const w=lgResults.filter(r=>r.r==="W").length;
              const d=lgResults.filter(r=>r.r==="D").length;
              const l=lgResults.filter(r=>r.r==="L").length;
              const gf=lgResults.reduce((s,r)=>s+(r.myG||0),0);
              const ga=lgResults.reduce((s,r)=>s+(r.opG||0),0);
              const total=w+d+l;
              return total>0&&(
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginBottom:8}}>
                  {[[`${w}G ${d}B ${l}M`,"Sonuçlar",C.wh],[`${gf}-${ga}`,"Gol Averajı",gf>ga?C.grn2:gf<ga?C.red:C.wh],[`%${Math.round(w/total*100)}`,"Galibiyet",C.ac2]].map(([v,lbl,c],i)=>(
                    <div key={i} style={{background:"rgba(0,0,0,.3)",borderRadius:6,padding:"8px",border:"1px solid rgba(77,166,255,.1)",textAlign:"center"}}>
                      <div style={{fontSize:".72rem",fontWeight:800,color:c}}>{v}</div>
                      <div style={{fontSize:".42rem",color:C.dmr,marginTop:2}}>{lbl}</div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </>);
        })()}
      </div>}

      {/* ─── KARİYER ─── */}
      {tab==="kariyer"&&<div style={{flex:1,overflowY:"auto",padding:"8px 10px"}}>
        {/* Genel kariyer özeti */}
        {(()=>{
          const cs=careerStats||{totalW:0,totalD:0,totalL:0,totalGF:0,totalGA:0,totalMatches:0,seasons:[],trophies:{ztk:0,sl:0}};
          const tm=cs.totalMatches||0;
          const winRate=tm>0?Math.round((cs.totalW/tm)*100):0;
          // Bu sezon verisini season.results üzerinden hesapla (kesin veri)
          const lgResults=(season.results||[]).filter(r=>r.comp!=="ZTK"&&r.comp!=="HAZ"&&r.comp!=="CL"&&r.comp!=="UEFA"&&r.comp!=="CON");
          const curW=lgResults.filter(r=>r.res==="W").length;
          const curD=lgResults.filter(r=>r.res==="D").length;
          const curL=lgResults.filter(r=>r.res==="L").length;
          const curGF=lgResults.reduce((s,r)=>s+(r.gf||0),0);
          const curGA=lgResults.reduce((s,r)=>s+(r.ga||0),0);
          const allW=cs.totalW+curW, allD=cs.totalD+curD, allL=cs.totalL+curL;
          const allGF=cs.totalGF+curGF, allGA=cs.totalGA+curGA;
          const allM=allW+allD+allL;
          const allWR=allM>0?Math.round((allW/allM)*100):0;
          const allGD=allGF-allGA;

          return(<>
            {/* Kariyer özet kartı */}
            <div style={{padding:"12px 14px",marginBottom:10,
              background:"linear-gradient(135deg,rgba(26,110,216,.12),rgba(26,110,216,.04))",
              border:`1px solid rgba(77,166,255,0.22)`,borderRadius:10}}>
              <div style={{fontSize:".48rem",color:C.dmr,textTransform:"uppercase",letterSpacing:1.5,marginBottom:8}}>
                Kariyer Geneli · {cs.seasons?cs.seasons.length:0}+1 Sezon
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:5,marginBottom:8}}>
                {[
                  ["Toplam Maç",allM,C.wh],
                  ["Galibiyet",allW,C.grn2],
                  ["Beraberlik",allD,C.gd],
                  ["Mağlubiyet",allL,C.red2],
                ].map(([l,v,c])=>(
                  <div key={l} style={{textAlign:"center",padding:"7px 4px",
                    background:"rgba(0,0,0,.2)",borderRadius:6,border:`1px solid rgba(77,166,255,0.1)`}}>
                    <div style={{fontSize:".42rem",color:C.dmr,marginBottom:2}}>{l}</div>
                    <div style={{fontSize:".88rem",fontWeight:900,color:c}}>{v}</div>
                  </div>
                ))}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:5}}>
                {[
                  ["Gol",allGF,C.grn2],
                  ["Yenilen",allGA,C.red2],
                  ["Gol Farkı",allGD>=0?"+"+allGD:allGD,allGD>=0?C.grn2:C.red2],
                ].map(([l,v,c])=>(
                  <div key={l} style={{textAlign:"center",padding:"7px 4px",
                    background:"rgba(0,0,0,.2)",borderRadius:6,border:`1px solid rgba(77,166,255,0.1)`}}>
                    <div style={{fontSize:".42rem",color:C.dmr,marginBottom:2}}>{l}</div>
                    <div style={{fontSize:".88rem",fontWeight:900,color:c}}>{v}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Galibiyet oranı */}
            <div style={{padding:"8px 12px",marginBottom:10,
              background:C.card,border:`1px solid rgba(77,166,255,0.22)`,borderRadius:8}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
                <span style={{fontSize:".52rem",color:C.dim}}>Kariyer Galibiyet Oranı</span>
                <span style={{fontSize:".88rem",fontWeight:900,
                  color:allWR>=60?C.grn2:allWR>=45?"#e67e22":C.red2}}>{allWR}%</span>
              </div>
              <div style={{height:6,background:"rgba(100,140,220,.08)",borderRadius:3,overflow:"hidden",position:"relative"}}>
                <div style={{height:"100%",
                  background:`linear-gradient(90deg,${C.grn2},${C.ac2})`,
                  width:`${allWR}%`,borderRadius:3,transition:"width .4s"}}/>
                <div style={{position:"absolute",top:0,left:"50%",width:1,height:"100%",background:"rgba(255,255,255,.2)"}}/>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",marginTop:3,fontSize:".4rem",color:C.dmr}}>
                <span>W:{allW} D:{allD} L:{allL}</span>
                <span>Maç başı gol: {allM>0?(allGF/allM).toFixed(2):"-"}</span>
              </div>
            </div>

            {/* Kupalar */}
            <div style={{padding:"8px 12px",marginBottom:10,
              background:C.card,border:`1px solid rgba(77,166,255,0.22)`,borderRadius:8}}>
              <div style={{fontSize:".5rem",color:C.dmr,textTransform:"uppercase",letterSpacing:1.2,marginBottom:7}}>Kupa Dolabı</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {[
                  {icon:"🏆",label:"Kupa",n:cs.trophies?.ztk||0},
                  {icon:"🥇",label:"Şampiyonlar Kalkanı",n:cs.trophies?.superKupa||0},
                  {icon:"🥇",label:"Elit Lig",n:cs.trophies?.sl||0},
                  {icon:"🌍",label:"AL",n:cs.trophies?.uefal||0},
                  {icon:"🟢",label:"KL",n:cs.trophies?.con||0},
                  {icon:"⭐",label:"ASK",n:cs.trophies?.cl||0},
                ].map(tr=>(
                  <div key={tr.label} style={{
                    padding:"8px 12px",borderRadius:7,textAlign:"center",
                    background:tr.n>0?"rgba(232,184,58,.12)":"rgba(100,120,160,.06)",
                    border:`1px solid ${tr.n>0?"rgba(232,184,58,.4)":C.brd2}`,
                    minWidth:60,
                  }}>
                    <div style={{fontSize:"1.2rem",marginBottom:2,opacity:tr.n>0?1:0.3}}>{tr.icon}</div>
                    <div style={{fontSize:".72rem",fontWeight:900,color:tr.n>0?C.gd:C.dmr}}>{tr.n}</div>
                    <div style={{fontSize:".42rem",color:C.dmr}}>{tr.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sezon geçmişi tablosu */}
            <div style={{fontSize:".5rem",color:C.dmr,textTransform:"uppercase",letterSpacing:1.2,marginBottom:6}}>
              Sezon Geçmişi
            </div>
            {/* Bu sezon (canlı) */}
            <div style={{display:"grid",gridTemplateColumns:"auto 1fr repeat(5,auto)",gap:"4px 8px",
              padding:"7px 10px",marginBottom:3,
              background:"rgba(45,143,255,.12)",border:`1px solid ${C.ac2}`,borderRadius:6,
              fontSize:".56rem",alignItems:"center"}}>
              <span style={{color:C.ac2,fontWeight:700,fontSize:".48rem"}}>●</span>
              <span style={{color:C.wh,fontWeight:700}}>{season.league||"1. Lig"} <span style={{fontSize:".44rem",color:C.ac2}}>(bu sezon)</span></span>
              <span style={{color:C.grn2}}>{curW}G</span>
              <span style={{color:C.gd}}>{curD}B</span>
              <span style={{color:C.red2}}>{curL}M</span>
              <span style={{color:C.dim}}>{curGF}-{curGA}</span>
              <span style={{color:C.wh,fontWeight:700}}>{curW*3+curD}P</span>
            </div>
            {cs.seasons&&cs.seasons.length>0
              ?cs.seasons.slice().reverse().map((s,i)=>(
                <div key={i} style={{display:"grid",gridTemplateColumns:"auto 1fr repeat(5,auto)",gap:"4px 8px",
                  padding:"6px 10px",marginBottom:2,
                  background:"rgba(8,18,40,.7)",border:`1px solid rgba(77,166,255,0.1)`,borderRadius:5,
                  fontSize:".54rem",alignItems:"center"}}>
                  <span style={{color:C.dmr,fontSize:".44rem"}}>{cs.seasons.length-i}</span>
                  <span style={{color:C.dim,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.league}</span>
                  <span style={{color:C.grn2}}>{s.w}G</span>
                  <span style={{color:C.gd}}>{s.d}B</span>
                  <span style={{color:C.red2}}>{s.l}M</span>
                  <span style={{color:C.dim,fontSize:".44rem"}}>{s.gf}-{s.ga}</span>
                  <span style={{color:s.rank<=3?C.grn2:C.wh,fontWeight:700}}>{s.pts}P</span>
                </div>
              ))
              :<div style={{fontSize:".58rem",color:C.dmr,textAlign:"center",padding:"12px 0"}}>
                İlk sezon devam ediyor.
              </div>}
          </>);
        })()}
      </div>}
    </div>
  );
}
