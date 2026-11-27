// ─── ANA SAYFA ───────────────────────────────────────────────
function PageHome({season,clubName="Club Manager: Glory Road",activeScenario=null,squad=[],careerStats=null,db=null}){
  const myLg=season.league||"1. Lig";
  const allLgs=["1. Lig","Elit Lig","İngiliz Ligi","İspanyol Ligi","Alman Ligi","İtalyan Ligi","Fransız Ligi","Hollanda Ligi","Portekiz Ligi","İngiliz 2. Ligi"];
  const showLgs=allLgs.filter(lg=>season.teams.some(t=>t.lg===lg));
  const kupa=season.kupaSonuc||{group:"",w:0,d:0,l:0,gf:0,ga:0,pts:0};
  const tabs=[...showLgs.map(lg=>({id:lg,lbl:{"1. Lig":"1.Lig","Elit Lig":"Elit","İngiliz Ligi":"Eng","İspanyol Ligi":"Esp","Alman Ligi":"Ger","İtalyan Ligi":"Ita","Fransız Ligi":"Fra","Hollanda Ligi":"Hol","Portekiz Ligi":"Por","İngiliz 2. Ligi":"Eng2"}[lg]||lg,euro:false})),
    {id:"ZTK",  lbl:"🏆 KUPA",  euro:true, color:"#cc2233"},
    {id:"SUPERKUPA", lbl:"🛡️ KALKAN", euro:true, color:"#c0ff00"},
    {id:"CL",   lbl:"⭐ ASK",    euro:true, color:"#ffd060"},
    {id:"UEFA", lbl:"🇪🇺 AL", euro:true, color:"#e67e22"},
    {id:"CON",  lbl:"🟢 KL",  euro:true, color:"#2ecc71"},
  ];
  const [selTab,setSelTab]=useState(myLg);

  const isEuro=selTab==="CL"||selTab==="UEFA"||selTab==="CON"||selTab==="ZTK"||selTab==="SUPERKUPA";

  // Lig tablosu — me:true takım sadece kendi liginde görünsün
  const rows=!isEuro?[...season.teams].filter(t=>t.lg===selTab&&(!t.me||selTab===myLg)).sort((a,b)=>b.pts-a.pts||b.gd-a.gd||b.gf-a.gf):[];
  const promoLine=selTab==="1. Lig"?3:selTab==="Elit Lig"?2:null;
  const euLine=selTab==="Elit Lig"?4:null;
  const relLine=selTab==="Elit Lig"&&rows.length>3?rows.length-3:null;

  return(
    <div style={{display:"flex",flexDirection:"column",flex:1,minHeight:0,overflow:"hidden",position:"relative"}}>
      {/* ── Futbol Sahası Arka Plan ── */}
      <div style={{position:"absolute",inset:0,zIndex:0,pointerEvents:"none",overflow:"hidden"}}>
        {/* Stadium lights glow */}
        <div style={{position:"absolute",top:"-30%",left:"10%",width:"80%",height:"60%",
          background:"radial-gradient(ellipse at center, rgba(26,90,180,.18) 0%, transparent 70%)"}}/>
        {/* SVG pitch */}
        <svg viewBox="0 0 400 260" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" style={{opacity:.08}}>
          {[0,1,2,3,4,5,6,7,8,9].map(i=>(
            <rect key={i} x={i*40} y="0" width="40" height="260"
              fill={i%2===0?"#1a6b2e":"#1c7532"} opacity="1"/>
          ))}
          <rect x="14" y="12" width="372" height="236" stroke="white" strokeWidth="1.4" fill="none"/>
          <line x1="200" y1="12" x2="200" y2="248" stroke="white" strokeWidth="1.4"/>
          <circle cx="200" cy="130" r="38" stroke="white" strokeWidth="1.4" fill="none"/>
          <circle cx="200" cy="130" r="2.5" fill="white"/>
          <rect x="14" y="62" width="56" height="136" stroke="white" strokeWidth="1.2" fill="none"/>
          <rect x="14" y="96" width="22" height="68" stroke="white" strokeWidth="1.2" fill="none"/>
          <circle cx="52" cy="130" r="2" fill="white"/>
          <path d="M70,104 A38,38 0 0,1 70,156" stroke="white" strokeWidth="1.2" fill="none"/>
          <rect x="330" y="62" width="56" height="136" stroke="white" strokeWidth="1.2" fill="none"/>
          <rect x="364" y="96" width="22" height="68" stroke="white" strokeWidth="1.2" fill="none"/>
          <circle cx="348" cy="130" r="2" fill="white"/>
          <path d="M330,104 A38,38 0 0,0 330,156" stroke="white" strokeWidth="1.2" fill="none"/>
          <path d="M14,20 A8,8 0 0,1 22,12" stroke="white" strokeWidth="1.2" fill="none"/>
          <path d="M378,12 A8,8 0 0,1 386,20" stroke="white" strokeWidth="1.2" fill="none"/>
          <path d="M386,240 A8,8 0 0,1 378,248" stroke="white" strokeWidth="1.2" fill="none"/>
          <path d="M22,248 A8,8 0 0,1 14,240" stroke="white" strokeWidth="1.2" fill="none"/>
        </svg>
        <div style={{position:"absolute",bottom:0,left:0,right:0,height:"40%",
          background:"linear-gradient(transparent,rgba(5,12,26,.95))"}}/>
        <div style={{position:"absolute",top:0,left:0,right:0,height:"25%",
          background:"linear-gradient(rgba(5,12,26,.7),transparent)"}}/>
      </div>
      <div style={{display:"flex",gap:4,padding:"6px 10px",overflowX:"auto",flexShrink:0,
        borderBottom:"1px solid rgba(45,143,255,0.12)",scrollbarWidth:"none",
        position:"relative",zIndex:1,background:C.nav,backdropFilter:"blur(10px)",borderBottom:"2px solid rgba(77,166,255,0.15)"}}>
        {tabs.map(tab=>{
          const isActive=selTab===tab.id;
          const isMe=tab.id===myLg&&!tab.euro;
          const tabColor=tab.euro?(tab.id==="CL"?"#ffd060":"#e8742a"):isMe?C.ac2:C.dim;
          return(
          <button key={tab.id} onClick={()=>setSelTab(tab.id)} style={{
            padding:"4px 10px",fontSize:".46rem",cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap",
            borderRadius:5,flexShrink:0,fontWeight:isActive?700:500,
            background:isActive
              ?tab.euro?`rgba(${tab.id==="CL"?"240,192,64":"232,116,42"},.15)`
                :isMe?"rgba(77,166,255,.25)":C.surfaceHover
              :C.surface,
            border:`1px solid ${isActive
              ?tab.euro?(tab.id==="CL"?"rgba(240,192,64,.5)":"rgba(232,116,42,.5)")
                :isMe?"rgba(45,143,255,.5)":C.brd
              :C.brd2}`,
            color:isActive?tabColor:C.dim,
            transition:"all .15s"}}>
            {isMe?"▶ ":""}{tab.lbl}
          </button>
          );
        })}
      </div>

      {/* ZTK Kupası */}
      {selTab==="SUPERKUPA"?(()=>{
        const skFix=season.fixture.find(f=>f.comp==="SUPERKUPA");
        const skResult=season.results.find(r=>r.comp==="SUPERKUPA");
        const skComp=careerStats.lastClChampion?"ASK":careerStats.lastUefaChampion?"AL":"";
        const skGold="#FFD700";
        const skGoldDim="#B8860B";
        const skGoldBg="rgba(255,215,0,";
        return(
          <div style={{padding:"0 2px"}}>
            <div style={{background:`${skGoldBg}.07)`,border:`1px solid ${skGoldBg}.35)`,borderRadius:12,padding:"14px",marginBottom:12,
              boxShadow:`0 0 24px ${skGoldBg}.08)`}}>
              {/* Başlık */}
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                <span style={{fontSize:"1.6rem"}}>🏆</span>
                <div>
                  <div style={{fontSize:".72rem",fontWeight:900,color:skGold,letterSpacing:1}}>ŞAMPIYONLAR KALKANI</div>
                  <div style={{fontSize:".44rem",color:skGoldDim,letterSpacing:.5}}>ASK Şampiyonu ⚡ AL Şampiyonu</div>
                </div>
              </div>
              <div style={{height:1,background:`linear-gradient(90deg,transparent,${skGold}66,transparent)`,marginBottom:10}}/>
              {skFix?(
                <div style={{background:C.inset,borderRadius:8,padding:"10px",border:`1px solid ${skGoldBg}.15)`}}>
                  <div style={{fontSize:".58rem",fontWeight:700,color:"#fff8e1"}}>🆚 {skFix.opp}</div>
                  <div style={{fontSize:".5rem",color:skGoldDim,marginTop:2}}>
                    Deplasman · {skFix.month} · Rakip Güç: <span style={{color:skFix.str>=85?"#ff6060":skFix.str>=75?"#ffb040":skGold,fontWeight:700}}>{skFix.str}</span>
                  </div>
                  {skResult?(
                    <div style={{marginTop:8,padding:"8px 10px",borderRadius:6,
                      background:skResult.r==="W"?`${skGoldBg}.18)`:skResult.r==="L"?"rgba(200,40,40,.18)":"rgba(120,120,120,.18)",
                      border:`1px solid ${skResult.r==="W"?skGoldBg+",.4)":skResult.r==="L"?"rgba(200,40,40,.4)":"rgba(120,120,120,.4)"}`}}>
                      <div style={{fontSize:".72rem",fontWeight:900,
                        color:skResult.r==="W"?skGold:skResult.r==="L"?"#ff6060":"#aaa",
                        textAlign:"center",letterSpacing:2}}>
                        {skResult.r==="W"?"🏆 ŞAMPİYON!":skResult.r==="L"?"😔 Finalist":skResult.r==="D"?"⚽ Berabere":""}
                      </div>
                      <div style={{textAlign:"center",fontSize:"1.4rem",fontWeight:900,color:C.wh,letterSpacing:4,marginTop:2}}>
                        {skResult.myG} – {skResult.opG}
                      </div>
                    </div>
                  ):(
                    <div style={{marginTop:8,padding:"6px 8px",borderRadius:6,background:`${skGoldBg}.06)`,
                      border:`1px solid ${skGoldBg}.2)`,fontSize:".5rem",color:skGoldDim,textAlign:"center"}}>
                      ⏳ Ağustos ayında oynanacak
                    </div>
                  )}
                </div>
              ):(
                <div style={{marginTop:10,padding:"10px",borderRadius:8,background:C.inset,
                  border:`1px solid ${skGoldBg}.15)`,fontSize:".52rem",color:skGoldDim,textAlign:"center",lineHeight:1.7}}>
                  Önceki sezonda ASK veya AL şampiyonu olunması gerekiyor
                </div>
              )}
            </div>
          </div>
        );
      })():selTab==="ZTK"?(
        <div style={{flex:1,overflowY:"auto",padding:12,position:"relative",zIndex:1}}>
          {/* Türk liginde değilse uyarı göster */}
          {season.league!=="Elit Lig"&&season.league!=="1. Lig"?(
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:12,padding:32,textAlign:"center"}}>
              <div style={{fontSize:"2.5rem"}}>🏆</div>
              <div style={{fontSize:".72rem",fontWeight:700,color:"#ff5050"}}>ULUSAL KUPA</div>
              <div style={{fontSize:".56rem",color:C.dmr,lineHeight:1.7,maxWidth:240}}>
                Bu kupa yalnızca Elit Lig ve 1. Lig takımlarına açıktır.
              </div>
              <div style={{padding:"6px 14px",borderRadius:6,fontSize:".5rem",fontWeight:700,
                background:"rgba(232,64,64,.1)",border:"1px solid rgba(192,57,43,.3)",color:"#ff5050"}}>
                Türk liglerinde oynamanız gerekiyor →
              </div>
            </div>
          ):(
          <React.Fragment>
          {(()=>{
            const kupaFix=season.results.filter(r=>r.comp==="ZTK");
            const myZtkGroupPlayed=kupaFix.filter(r=>r.round&&r.round.startsWith("Grup")).length;
            const opps=season.league==="1. Lig"
              ?["Kayserispor FC","Bucaspor FC","Ankaragucu FC"]
              :["Sivasspor FC","Kayserispor FC","Antalyaspor FC"];
            // Grup maçlarını tutarlı simüle et: her maç çifti için tek seed
            // Grup: kullanıcı + 3 rakip. Rakipler arası maçlar: opp[0]vs[1], opp[0]vs[2], opp[1]vs[2] (gidiş-dönüş)
            // Toplam 6 rakip arası maç (3 çift × 2)
            const oppStats=opps.map(o=>({n:o,w:0,d:0,l:0,gf:0,ga:0}));
            const totalGames=Math.min(myZtkGroupPlayed,6);
            // Tur düzeni: her turda kullanıcı bir rakiple, diğer 2 rakip kendi aralarında oynar
            // Tur 0: kullanıcı vs opp[0], opp[1] vs opp[2]
            // Tur 1: kullanıcı vs opp[1], opp[0] vs opp[2]
            // Tur 2: kullanıcı vs opp[2], opp[0] vs opp[1]
            // Tur 3: kullanıcı vs opp[0] (rövanş), opp[1] vs opp[2]
            // Tur 4: kullanıcı vs opp[1] (rövanş), opp[0] vs opp[2]
            // Tur 5: kullanıcı vs opp[2] (rövanş), opp[0] vs opp[1]
            const userOppIdx=[0,1,2,0,1,2]; // her turda kullanıcının rakibi
            const sideMatchups=[[1,2],[0,2],[0,1],[1,2],[0,2],[0,1]]; // diğer 2 rakip
            const ztkGroupResults=kupaFix.filter(r=>r.round&&r.round.startsWith("Grup"));
            for(let t=0;t<totalGames;t++){
              // Kullanıcının o turdaki rakibi — sonuç results'tan al
              const myOppIdx=userOppIdx[t];
              const myOpp=oppStats[myOppIdx];
              const myResult=ztkGroupResults[t]; // o turdaki kullanıcı maç sonucu
              if(myOpp&&myResult){
                const res=myResult.r; // "W","D","L"
                if(res==="W"){myOpp.l++;myOpp.ga+=myResult.myG;myOpp.gf+=myResult.opG;}
                else if(res==="D"){myOpp.d++;myOpp.ga+=myResult.myG;myOpp.gf+=myResult.opG;}
                else{myOpp.w++;myOpp.ga+=myResult.myG;myOpp.gf+=myResult.opG;}
              }
              // Diğer 2 rakip kendi aralarında oynuyor
              const [ai,bi]=sideMatchups[t];
              const a=oppStats[ai]; const b=oppStats[bi];
              if(!a||!b) continue;
              const seed=(a.n.charCodeAt(0)*31+b.n.charCodeAt(0)*17+t*13)%100;
              if(seed<38){a.w++;a.gf+=2;a.ga+=seed%2;b.l++;b.ga+=2;b.gf+=seed%2;}
              else if(seed<62){a.d++;b.d++;a.gf+=1;a.ga+=1;b.gf+=1;b.ga+=1;}
              else{b.w++;b.gf+=2;b.ga+=seed%2;a.l++;a.ga+=2;a.gf+=seed%2;}
            }
            const oppRows=oppStats.map(o=>({...o,pts:o.w*3+o.d,me:false}));
            const myRow={n:clubName,w:kupa.w,d:kupa.d,l:kupa.l,gf:kupa.gf,ga:kupa.ga,pts:kupa.pts,me:true};
            const rows=[myRow,...oppRows].sort((a,b)=>b.pts-a.pts||(b.gf-b.ga)-(a.gf-a.ga));
            const groupResults=kupaFix.filter(r=>!r.round||r.round.startsWith("Grup"));
            const groupDone=groupResults.length>=6;
            const myPts=kupa.pts;
            const oppPts=opps.map((o,i)=>{const s=o.charCodeAt(0)+o.charCodeAt(1);return Math.min(Math.floor(((s*7+i*13)%3)+1),6)*3+Math.min(Math.floor(((s*3+i*5)%2)),3);});
            // Qualified: tabloda sıra 0 veya 1 (1. veya 2.) olmalı
            const myTableRank=rows.findIndex(r=>r.me);
            const qualified=myTableRank<=1;
            return(
              <React.Fragment>
                {/* Grup tablosu */}
                <div style={{marginBottom:12,border:"1px solid rgba(192,57,43,.35)",borderRadius:8,overflow:"hidden"}}>
                  <div style={{padding:"6px 10px",background:"rgba(232,64,64,.15)",display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontSize:"1.1rem"}}>🏆</span>
                    <div>
                      <div style={{fontSize:".62rem",fontWeight:700,color:"#ff5050",letterSpacing:1}}>ULUSAL KUPA</div>
                      <div style={{fontSize:".46rem",color:C.dmr}}>{kupa.group||"Grup Aşaması"} — 2025/26</div>
                    </div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"18px minmax(0,1fr) 22px 22px 22px 22px 38px 26px",
                    padding:"4px 8px",fontSize:".42rem",color:"rgba(77,168,255,.5)",letterSpacing:1.2,textTransform:"uppercase",borderBottom:`1px solid rgba(77,168,255,0.12)`,background:"rgba(77,168,255,.04)",fontWeight:700}}>
                    <span style={{textAlign:"center"}}>#</span><span style={{paddingLeft:3}}>Takım</span>
                    <span style={{textAlign:"center"}}>O</span><span style={{textAlign:"center"}}>G</span>
                    <span style={{textAlign:"center"}}>B</span><span style={{textAlign:"center"}}>M</span>
                    <span style={{textAlign:"center"}}>Av</span><span style={{textAlign:"center"}}>P</span>
                  </div>
                  {rows.map((t,i)=>(
                    <div key={t.n} style={{display:"grid",gridTemplateColumns:"18px minmax(0,1fr) 22px 22px 22px 22px 38px 26px",
                      padding:"4px 8px",borderBottom:i<rows.length-1?`1px solid rgba(77,166,255,0.1)`:"none",alignItems:"center",
                      background:t.me?"rgba(232,64,64,.1)":i<2?"rgba(192,57,43,.04)":"",
                      borderLeft:t.me?"2px solid #e74c3c":i<2?"2px solid #c0392b55":"2px solid transparent"}}>
                      <span style={{fontSize:".52rem",textAlign:"center",fontWeight:700,color:i<2?"#ff5050":C.dmr}}>{i+1}</span>
                      <span style={{fontSize:".62rem",color:t.me?"#ff5050":C.wh,fontWeight:t.me?700:400,paddingLeft:3}}>
                        {t.me&&<span style={{fontSize:".44rem",marginRight:2}}>▶</span>}{t.n}
                      </span>
                      <span style={{textAlign:"center",fontSize:".56rem",color:C.dim}}>{t.w+t.d+t.l}</span>
                      <span style={{textAlign:"center",fontSize:".56rem",color:C.grn2}}>{t.w}</span>
                      <span style={{textAlign:"center",fontSize:".56rem",color:C.gd}}>{t.d}</span>
                      <span style={{textAlign:"center",fontSize:".56rem",color:C.red2}}>{t.l}</span>
                      <span style={{textAlign:"center",fontSize:".5rem",color:C.dim}}>{t.gd>0?"+"+t.gd:t.gd}</span>
                      <span style={{textAlign:"center",fontSize:".7rem",fontWeight:700,color:t.me?"#ff5050":C.wh}}>{t.pts}</span>
                    </div>
                  ))}
                  <div style={{padding:"4px 8px",fontSize:".42rem",color:"#ff5050",background:"rgba(192,57,43,.06)"}}>
                    ▲ İlk 2: Son 16 Turu
                  </div>
                </div>
                {/* ZTK Gol & Asist Krallığı */}
                {(()=>{
                  const played2=Math.min(myZtkGroupPlayed,6);
                  if(played2===0) return null;
                  // GK = Forvetler, AK = Orta sahalar — her pozisyondan en yuksek OVR'li starter
                  const sqSorted=(squad||[]).filter(p=>p.pos!=="GK").sort((a,b)=>b.ovr-a.ovr);
                  // GK havuzu: ST/LW/RW/CF en yuksek OVR'liler (en fazla 3)
                  const goalPool=sqSorted.filter(p=>["ST","LW","RW","CF"].includes(p.pos)).slice(0,3);
                  // Forvet yoksa CAM da al
                  const goalPoolFinal=goalPool.length>0?goalPool:sqSorted.filter(p=>["ST","LW","RW","CF","CAM"].includes(p.pos)).slice(0,3);
                  // AK havuzu: CAM/CM/LM/RM en yuksek OVR'liler (en fazla 4)
                  const assistPool=sqSorted.filter(p=>["CAM","CM","LM","RM"].includes(p.pos)).slice(0,4);
                  let allPlayers=[];
                  rows.forEach(row=>{
                    const isMe=row.me;
                    const teamGf=row.gf||0;
                    if(isMe){
                      const ztkResults=(season.results||[]).filter(r=>r.comp==="ZTK"&&r.round&&r.round.startsWith("Grup"));
                      const myG=ztkResults.reduce((s,r)=>s+(r.myG||0),0);
                      // Goller: FW starter'lara dag — 1.FW en fazla
                      const gRatios=[0.45,0.28,0.17,0.10];
                      goalPoolFinal.slice(0,3).forEach((p,pi)=>{
                        const g=Math.round(myG*(gRatios[pi]||0));
                        if(g>0){
                          const ex=allPlayers.find(x=>x.n===p.n&&x.team===clubName);
                          if(ex) ex.g+=g; else allPlayers.push({n:p.n,team:clubName,g,a:0,me:pi===0});
                        }
                      });
                      // Asistler: CAM/CM starter'lara dag — 1.CM en fazla
                      const aRatios=[0.35,0.28,0.20,0.12,0.05];
                      assistPool.slice(0,5).forEach((p,pi)=>{
                        const a=Math.round(myG*(aRatios[pi]||0));
                        if(a>0){
                          const ex=allPlayers.find(x=>x.n===p.n&&x.team===clubName);
                          if(ex) ex.a+=a; else allPlayers.push({n:p.n,team:clubName,g:0,a,me:false});
                        }
                      });
                    } else {
                      // Rakipler: getTeamEuroScorers ile pozisyon bazlı dağılım
                      // Rakip asistleri daha gercekci gozuksun — teamGf boost ile
                      const scorers=getTeamEuroScorers(row.n,Math.round(teamGf*1.5),db||undefined);
                      scorers.forEach(s=>allPlayers.push({n:s.n,team:row.n,g:s.g,a:s.a,me:false}));
                    }
                  });
                  const topG=[...allPlayers].sort((a,b)=>b.g-a.g).filter(p=>p.g>0).slice(0,5);
                  const topA=[...allPlayers].sort((a,b)=>b.a-a.a).filter(p=>p.a>0).slice(0,5);
                  if(topG.length===0) return null;
                  return(
                    <div style={{marginBottom:12,border:"1px solid rgba(192,57,43,.3)",borderRadius:8,overflow:"hidden"}}>
                      <div style={{padding:"5px 10px",background:"rgba(192,57,43,.12)",fontSize:".5rem",fontWeight:700,color:"#ff5050",letterSpacing:1}}>
                        🏆 KUPA — GOL & ASİST KRALLARI
                      </div>
                      <div style={{display:"flex",gap:0}}>
                        <div style={{flex:1,borderRight:"1px solid rgba(77,166,255,0.1)"}}>
                          <div style={{padding:"3px 8px",fontSize:".42rem",fontWeight:700,color:C.grn2,letterSpacing:1,background:"rgba(39,174,96,.07)",borderBottom:"1px solid rgba(39,174,96,.15)"}}>⚽ GOL KRALLARI</div>
                          {topG.map((p,i)=>(
                            <div key={i} style={{display:"flex",alignItems:"center",gap:4,padding:"3px 8px",borderBottom:i<4?"1px solid rgba(45,143,255,0.06)":"none"}}>
                              <span style={{fontSize:".44rem",color:i===0?C.gd:C.dim,fontWeight:700,minWidth:10}}>{i+1}</span>
                              <span style={{flex:1,fontSize:".5rem",color:p.me?C.ac2:C.wh,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontWeight:p.me?700:400}}>{p.n}</span>
                              <span style={{fontSize:".42rem",color:C.dmr,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:50}}>{p.team}</span>
                              <span style={{fontSize:".6rem",fontWeight:800,color:i===0?C.grn2:C.wh,minWidth:16,textAlign:"right"}}>{p.g}</span>
                            </div>
                          ))}
                        </div>
                        <div style={{flex:1}}>
                          <div style={{padding:"3px 8px",fontSize:".42rem",fontWeight:700,color:"#a78bfa",letterSpacing:1,background:"rgba(142,68,173,.07)",borderBottom:"1px solid rgba(142,68,173,.15)"}}>🎯 ASİST KRALLARI</div>
                          {topA.map((p,i)=>(
                            <div key={i} style={{display:"flex",alignItems:"center",gap:4,padding:"3px 8px",borderBottom:i<4?"1px solid rgba(45,143,255,0.06)":"none"}}>
                              <span style={{fontSize:".44rem",color:i===0?C.gd:C.dim,fontWeight:700,minWidth:10}}>{i+1}</span>
                              <span style={{flex:1,fontSize:".5rem",color:p.me?C.ac2:C.wh,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontWeight:p.me?700:400}}>{p.n}</span>
                              <span style={{fontSize:".42rem",color:C.dmr,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:50}}>{p.team}</span>
                              <span style={{fontSize:".6rem",fontWeight:800,color:i===0?"#a78bfa":C.wh,minWidth:16,textAlign:"right"}}>{p.a}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })()}
                {/* Kupa maçları listesi */}
                <div style={{fontSize:".5rem",color:C.dmr,letterSpacing:1.5,textTransform:"uppercase",marginBottom:6}}>Kupa Maçları</div>
                {kupaFix.length===0&&(
                  <div style={{fontSize:".58rem",color:C.dmr,textAlign:"center",padding:16}}>Henüz kupa maçı oynanmadı</div>
                )}
                {kupaFix.map((r,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 8px",
                    borderBottom:`1px solid rgba(77,166,255,0.1)`,borderLeft:`2px solid ${r.r==="W"?"#1ab855":r.r==="D"?"#e67e22":"#ff5050"}`}}>
                    <span style={{fontSize:".64rem",fontWeight:700,color:r.r==="W"?C.grn2:r.r==="D"?C.gd:C.red2,minWidth:16}}>{r.r==="W"?"G":r.r==="D"?"B":"M"}</span>
                    <span style={{flex:1,fontSize:".62rem",color:C.wh,display:"flex",alignItems:"center",gap:5}}><TeamBadge name={r.opp} size="sm"/>vs {r.opp}</span>
                    <span style={{fontSize:".64rem",fontWeight:700,color:C.dim}}>{r.s}</span>
                  </div>
                ))}
                {/* Kupa Prim Tablosu */}
                {(()=>{
                  const isSlPrim=season.league==="Elit Lig";
                  const primData=[
                    {label:"Grup Galibiyeti",       tff1:"30K€",  sl:"60K€",  icon:"✅"},
                    {label:"Grup Berabere",          tff1:"10K€",  sl:"20K€",  icon:"🤝"},
                    {label:"Son 16'ya Çıkma",        tff1:"120K€", sl:"300K€", icon:"🏅"},
                    {label:"Çeyrek Finale Çıkma",    tff1:"200K€", sl:"500K€", icon:"🥉"},
                    {label:"Yarı Finale Çıkma",      tff1:"350K€", sl:"900K€", icon:"🥈"},
                    {label:"Finale Çıkma",           tff1:"500K€", sl:"1.4M€", icon:"🥇"},
                    {label:"Finalist Olma (ekstra)", tff1:"300K€", sl:"800K€", icon:"🏆"},
                    {label:"Kupa Şampiyonluğu",      tff1:"1M€",   sl:"3M€",   icon:"🎉"},
                  ];
                  return(
                    <div style={{marginTop:10,border:"1px solid rgba(192,57,43,.3)",borderRadius:8,overflow:"hidden"}}>
                      <div style={{padding:"5px 10px",background:"rgba(192,57,43,.12)",display:"flex",alignItems:"center",gap:6}}>
                        <span style={{fontSize:".85rem"}}>💰</span>
                        <div>
                          <div style={{fontSize:".6rem",fontWeight:700,color:"#ff5050"}}>Kupa Prim Tablosu</div>
                          <div style={{fontSize:".44rem",color:C.dmr}}>{isSlPrim?"Elit Lig":"1. Lig"} primleri — her tur geçişinde otomatik eklenir</div>
                        </div>
                      </div>
                      {primData.map((p,i)=>(
                        <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"4px 10px",
                          borderBottom:i<primData.length-1?`1px solid rgba(77,166,255,0.1)`:"none",
                          background:i%2===0?C.surface:""}}>
                          <span style={{fontSize:".7rem",minWidth:18}}>{p.icon}</span>
                          <span style={{flex:1,fontSize:".56rem",color:C.dim}}>{p.label}</span>
                          <span style={{fontSize:".62rem",fontWeight:700,color:"#ffd060"}}>{isSlPrim?p.sl:p.tff1}</span>
                        </div>
                      ))}
                    </div>
                  );
                })()}
                {/* Tur ilerlemesi */}
                {!groupDone?(
                  <div style={{marginTop:8,padding:"6px 10px",background:"rgba(192,57,43,.06)",border:"1px solid rgba(192,57,43,.2)",borderRadius:6,fontSize:".48rem",color:C.dmr,lineHeight:1.7}}>
                    🏆 Ulusal Kupa grup maçları Ekim–Mart ayları arasında oynanır.<br/>
                    İlk 2 takım Son 16 Turu'na yükselir. ({groupResults.length}/6 maç)
                  </div>
                ):!qualified?((()=>{
                  const _simSeed=(n)=>{let h=5381;for(let i=0;i<n.length;i++)h=((h<<5)+h)+n.charCodeAt(i);return Math.abs(h);};
                  const _simKO=(teams,rnd)=>{const res=[];for(let i=0;i<teams.length;i+=2){const a=teams[i],b=teams[i+1]||teams[0];const s=_simSeed(a+b+rnd);res.push(s%3===0?b:a);}return res;};
                  const _pool=["Galatasaray FC","Fenerbahce FC","Besiktas FC","Trabzonspor FC","Basaksehir FC","Samsunspor FC","Antalyaspor FC","Sivasspor FC","Kayserispor FC","Alanyaspor FC","Konyaspor FC","Pendikspor FC","Ankaragucu FC","Kasimpasa FC","Hatayspor FC","Rizespor FC"];
                  const _all=[..._pool].filter(t=>t!==clubName).slice(0,16);
                  const _s16=_simKO(_all,"s16");
                  const _qf=_simKO(_s16,"qf");
                  const _sf=_simKO(_qf,"sf");
                  const _win=_simKO(_sf,"final")[0]||"Galatasaray FC";
                  return(
                    <div style={{marginTop:8}}>
                      <div style={{padding:"7px 10px",background:"rgba(231,76,60,.06)",border:"1px solid rgba(231,76,60,.2)",borderRadius:6,fontSize:".5rem",color:"#ff5050",marginBottom:8}}>
                        ❌ Grup aşamasından elendiniz ({myPts} puan). Turnuva diğer takımlar arasında devam etti.
                      </div>
                      {[{label:"Son 16",winners:_s16},{label:"Çeyrek Final",winners:_qf},{label:"Yarı Final",winners:_sf},{label:"Final",winners:[_win]}].map(({label,winners},ri)=>(
                        <div key={ri} style={{marginBottom:6,padding:"8px 10px",background:ri===3?"rgba(255,215,0,.06)":"rgba(192,57,43,.06)",border:ri===3?"1px solid rgba(255,215,0,.3)":"1px solid rgba(192,57,43,.2)",borderRadius:6}}>
                          <div style={{fontSize:".54rem",fontWeight:700,color:ri===3?"#ffd060":"#ff5050",marginBottom:4}}>
                            {["🔵","🟣","🟠","🏆"][ri]} {label.toUpperCase()}
                          </div>
                          {ri<3?winners.map((w,i)=><div key={i} style={{fontSize:".44rem",color:"#8ab4cc",padding:"2px 0"}}>✅ {w}</div>):<div style={{fontSize:".6rem",fontWeight:900,color:"#ffd060",textAlign:"center",padding:4}}>🏆 {_win}</div>}
                        </div>
                      ))}
                    </div>
                  );
                })())
                :(()=>{
                  const rounds=["Son 16","Çeyrek Final","Yarı Final","Final"];
                  const roundKeys=["Son 16","Çeyrek","Yarı Final","Final"];
                  const _ztkSeed=(a,b,r)=>{let h=5381;const s=a+b+r;for(let i=0;i<s.length;i++)h=((h<<5)+h)+s.charCodeAt(i);return Math.abs(h);};
                  // Kullanıcının elendigi KO turunu bul
                  const _playedRounds=roundKeys.map((key,ri)=>{
                    const pl=kupaFix.filter(r=>r.round&&r.round.startsWith(key));
                    if(pl.length===0) return null;
                    const parseG=(r)=>{if(r.myG!=null)return{myG:r.myG,opG:r.opG};if(r.s){const p=r.s.split("-");return{myG:parseInt(p[0])||0,opG:parseInt(p[1])||0};}return{myG:0,opG:0};};
                    const myGt=pl.reduce((s,r)=>s+parseG(r).myG,0);
                    const opGt=pl.reduce((s,r)=>s+parseG(r).opG,0);
                    const isDone=pl.length>=(rounds[ri]==="Final"?1:2);
                    const advanced=isDone&&(rounds[ri]==="Final"?pl[0].r==="W":myGt>opGt);
                    return{ri,key,pl,isDone,advanced,opp:pl[0].opp};
                  }).filter(Boolean);
                  const lastPlayedRound=_playedRounds[_playedRounds.length-1];
                  const userZtkEliminated=lastPlayedRound&&lastPlayedRound.isDone&&!lastPlayedRound.advanced;
                  const userZtkEliminatedRi=userZtkEliminated?lastPlayedRound.ri:-1;
                  // Elenince kalan turları simüle et
                  const _ztkPool=["Galatasaray FC","Fenerbahce FC","Besiktas FC","Trabzonspor FC","Basaksehir FC","Samsunspor FC","Antalyaspor FC","Sivasspor FC"];
                  const _ztkSimRounds=(()=>{
                    if(!userZtkEliminated) return [];
                    const survivor=lastPlayedRound.opp;
                    const startRi=userZtkEliminatedRi+1;
                    let pool=[survivor,..._ztkPool.filter(t=>t!==clubName&&t!==survivor)].slice(0,Math.max(1,8>>(userZtkEliminatedRi+1)));
                    const simmed=[];
                    for(let ri=startRi;ri<4;ri++){
                      if(pool.length<2) break;
                      const matches=[],winners=[];
                      for(let i=0;i+1<pool.length;i+=2){
                        const a=pool[i],b=pool[i+1];
                        const w=_ztkSeed(a,b,roundKeys[ri])%2===0?a:b;
                        matches.push([a,b]);winners.push(w);
                      }
                      if(pool.length%2===1)winners.push(pool[pool.length-1]);
                      simmed.push({label:rounds[ri],ri,matches,winners});
                      pool=winners;
                    }
                    return simmed;
                  })();
                  return(
                    <div style={{marginTop:8}}>
                      {rounds.map((roundLabel,ri)=>{
                        const key=roundKeys[ri];
                        const played=kupaFix.filter(r=>r.round&&r.round.startsWith(key));
                        const pending=season.fixture.filter(f=>f.comp==="ZTK"&&f.round&&f.round.startsWith(key));
                        if(played.length===0&&pending.length===0) return null;
                        const icons=["🔵","🟣","🟠","🏆"];
                        const parseG=(r)=>{
                          if(r.myG!=null) return{myG:r.myG,opG:r.opG};
                          if(r.s){const p=r.s.split("-");return{myG:parseInt(p[0])||0,opG:parseInt(p[1])||0};}
                          return{myG:0,opG:0};
                        };
                        const myGt=played.reduce((s,r)=>s+parseG(r).myG,0);
                        const opGt=played.reduce((s,r)=>s+parseG(r).opG,0);
                        const opp=played.length>0?played[0].opp:pending.length>0?pending[0].opp:"?";
                        const isDone=played.length>=(roundLabel==="Final"?1:2);
                        const advanced=isDone&&(roundLabel==="Final"?played[0].r==="W":myGt>opGt);
                        return(
                          <div key={ri} style={{marginBottom:6,padding:"8px 10px",
                            background:`rgba(192,57,43,.${isDone?12:6})`,
                            border:`1px solid rgba(192,57,43,.${isDone?40:20})`,borderRadius:6}}>
                            <div style={{fontSize:".54rem",fontWeight:700,color:"#ff5050",marginBottom:4}}>
                              {icons[ri]} {roundLabel.toUpperCase()} — {opp}
                            </div>
                            {played.length===0&&<div style={{fontSize:".48rem",color:C.gd}}>⏳ Yakında oynanacak</div>}
                            {played.map((r,i)=>(
                              <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"3px 0",
                                borderBottom:`1px solid rgba(192,57,43,.15)`}}>
                                <span style={{fontSize:".44rem",color:C.dmr,minWidth:60}}>{r.round}</span>
                                <span style={{fontSize:".44rem",color:C.dmr}}>{r.home?"⌂ Ev":"✈ Dep"}</span>
                                <span style={{flex:1,fontSize:".5rem",color:C.wh,display:"flex",alignItems:"center",gap:4}}><TeamBadge name={r.opp} size="sm"/>vs {r.opp}</span>
                                <span style={{fontSize:".58rem",fontWeight:700,color:r.r==="W"?C.grn2:r.r==="D"?C.gd:C.red2}}>{r.s}</span>
                              </div>
                            ))}
                            {isDone&&(
                              <div style={{marginTop:5,fontSize:".52rem",fontWeight:700,color:advanced?C.grn2:C.red2}}>
                                {advanced?(roundLabel==="Final"?"🏆 KUPA KAZANILDI!":"✅ Sonraki tura geçtiniz!"):(roundLabel==="Final"?"😔 Finalist oldunuz!":"❌ Elendiniz")}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {/* ZTK: kullanıcı KO'da elendikten sonra kalan turlar */}
                      {_ztkSimRounds.length>0&&(
                        <div style={{marginBottom:8,padding:"8px 10px",background:"rgba(30,30,50,.5)",border:"1px solid rgba(192,57,43,.2)",borderRadius:6}}>
                          <div style={{fontSize:".44rem",color:C.dmr,marginBottom:5,letterSpacing:1,textTransform:"uppercase"}}>📡 Kupa Devam Ediyor — Simülasyon</div>
                          {_ztkSimRounds.map((sr,sri)=>(
                            <div key={sri} style={{marginBottom:6,padding:"5px 8px",background:"rgba(192,57,43,.07)",border:"1px solid rgba(192,57,43,.18)",borderRadius:5}}>
                              <div style={{fontSize:".5rem",fontWeight:700,color:"#ff5050",marginBottom:3}}>{["🔵","🟣","🟠","🏆"][sr.ri]} {sr.label.toUpperCase()}</div>
                              {sr.matches.map(([a,b],mi)=>{
                                const w=sr.winners[mi]||a;
                                return(
                                  <div key={mi} style={{display:"flex",alignItems:"center",gap:4,padding:"2px 0",fontSize:".46rem"}}>
                                    <span style={{flex:1,color:w===a?C.wh:C.dmr,fontWeight:w===a?700:400,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{w===a?"✅":""} {a}</span>
                                    <span style={{color:C.dmr,fontSize:".4rem",flexShrink:0}}>vs</span>
                                    <span style={{flex:1,textAlign:"right",color:w===b?C.wh:C.dmr,fontWeight:w===b?700:400,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{b} {w===b?"✅":""}</span>
                                  </div>
                                );
                              })}
                              {sri===_ztkSimRounds.length-1&&sr.winners[0]&&(
                                <div style={{marginTop:4,padding:"4px",background:"rgba(255,215,0,.12)",borderRadius:4,textAlign:"center",fontSize:".52rem",fontWeight:800,color:"#ffd060"}}>🏆 KUPA ŞAMPİYONU: {sr.winners[0]}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      <div style={{padding:"4px 8px",background:"rgba(192,57,43,.06)",border:"1px solid rgba(192,57,43,.15)",borderRadius:6,fontSize:".42rem",color:C.dmr}}>
                        🏆 Kupa 2025/26 — Son 16: Nisan · Çeyrek: Nisan/Mayıs · Yarı/Final: Mayıs
                      </div>
                    </div>
                  );
                })()}
              </React.Fragment>
            );
          })()}
          </React.Fragment>
          )}
        </div>
      ):(selTab==="CL"||selTab==="UEFA"||selTab==="CON")?(
        <div style={{flex:1,overflowY:"auto",padding:"8px 8px 12px",position:"relative",zIndex:1}}>
          <EuroSwissPanel season={season} comp={selTab} clubName={clubName} db={db}/>
        </div>
      ):(

      /* Lig tablosu */
      <>
      <div style={{display:"grid",gridTemplateColumns:"20px minmax(0,1fr) 22px 22px 22px 22px 40px 28px",gap:0,
        fontSize:".42rem",letterSpacing:1.5,color:C.dim,textTransform:"uppercase",padding:"5px 10px",
        flexShrink:0,borderBottom:"1px solid rgba(45,143,255,0.12)",
        background:"rgba(77,166,255,0.08)",fontWeight:700}}>
        <span style={{textAlign:"center"}}>#</span><span style={{paddingLeft:4}}>Takım</span>
        <span style={{textAlign:"center"}}>O</span><span style={{textAlign:"center"}}>G</span>
        <span style={{textAlign:"center"}}>B</span><span style={{textAlign:"center"}}>M</span>
        <span style={{textAlign:"center"}}>Av</span><span style={{textAlign:"center",color:C.gd}}>P</span>
      </div>
      <div style={{flex:1,overflowY:"auto"}}>
        {rows.map((t,i)=>(
          <div key={i} style={{display:"grid",gridTemplateColumns:"20px minmax(0,1fr) 22px 22px 22px 22px 40px 28px",gap:0,padding:"5px 10px",
            borderBottom:"1px solid rgba(45,143,255,0.06)",alignItems:"center",
            background:t.me?"rgba(45,143,255,.12)":promoLine&&i<promoLine?"rgba(46,204,113,.05)":euLine&&i>=(promoLine||99)&&i<euLine?"rgba(232,116,42,.04)":relLine&&i>=relLine?"rgba(232,64,64,.05)":"",
            borderLeft:t.me?"3px solid #2d8fff":promoLine&&i<promoLine?"3px solid rgba(46,204,113,.4)":euLine&&i>=(promoLine||99)&&i<euLine?"3px solid rgba(232,116,42,.4)":relLine&&i>=relLine?"3px solid rgba(232,64,64,.4)":"3px solid transparent"}}>
            <span style={{fontSize:".52rem",textAlign:"center",fontWeight:800,
              color:i===0?"#ffd060":promoLine&&i<promoLine?C.grn2:euLine&&i>=(promoLine||99)&&i<euLine?C.ora:relLine&&i>=relLine?C.red2:C.dim}}>{i+1}</span>
            <span style={{fontSize:".62rem",color:t.me?C.ac2:C.wh,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",paddingLeft:4,fontWeight:t.me?700:400}}>
              <TeamBadge name={t.me?clubName:t.n} size="sm" style={{marginRight:3}}/>{t.me&&<span style={{fontSize:".44rem",marginRight:2,color:C.ac2}}>▶</span>}{t.me?clubName:t.n}
            </span>
            <span style={{textAlign:"center",fontSize:".56rem",color:C.dim}}>{t.w+t.d+t.l}</span>
            <span style={{textAlign:"center",fontSize:".56rem",color:C.grn2,fontWeight:600}}>{t.w}</span>
            <span style={{textAlign:"center",fontSize:".56rem",color:C.gd}}>{t.d}</span>
            <span style={{textAlign:"center",fontSize:".56rem",color:C.red2}}>{t.l}</span>
            <span style={{textAlign:"center",fontSize:".5rem",color:C.dim,whiteSpace:"nowrap"}}>{t.gd>0?"+"+t.gd:t.gd}</span>
            <span style={{textAlign:"center",fontSize:".72rem",fontWeight:800,color:t.me?C.gd:i<3?C.wh:C.dim}}>{t.pts}</span>
          </div>
        ))}
        {rows.length===0&&<div style={{padding:16,textAlign:"center",fontSize:".64rem",color:C.dmr}}>Veri yok</div>}
      </div>
      <div style={{display:"flex",flexWrap:"wrap",gap:"4px 8px",padding:"5px 10px",
        borderTop:"1px solid rgba(45,143,255,0.1)",flexShrink:0,fontSize:".42rem",
        background:C.card}}>
        {selTab===myLg&&promoLine&&<span style={{color:C.grn2,fontWeight:700}}>▲ İlk {promoLine}: {selTab==="1. Lig"?"Elit Lig":"ASK"}</span>}
        {selTab===myLg&&euLine&&<span style={{color:C.ora,fontWeight:700}}>🇪🇺 3-4: UEFA</span>}
        {selTab===myLg&&relLine&&<span style={{color:C.red2,fontWeight:700}}>▼ Son 3: Düşme</span>}
        {selTab!==myLg&&<span style={{color:C.dim}}>👁 İzleme modu</span>}
        {EURO_COMP_LIST.map(c=>{const t=season[EURO_TABLE_KEY[c]];return t&&t.teams.some(x=>x.me)?<span key={c} style={{color:EURO_META[c].color,fontWeight:700}}>{EURO_META[c].icon} {EURO_META[c].name}'ndesiniz!</span>:null;})}
      </div>
      {/* Gol & Asist Krallığı — tüm lig sekmelerinde */}
      {!isEuro&&(()=>{
        // Hangi lig sekmesindeyiz? O ligin oyuncularını getir
        const tabLg=selTab;
        // O ligdeki DB oyuncuları (simüle)
        const attPos=["ST","LM","RM","CAM","CM"];
        const lgTeamNames=new Set((season.teams||[]).filter(t=>t.lg===tabLg).map(t=>t.n));
        if(tabLg===myLg) lgTeamNames.add(clubName);
        const played=season.played||0;
        if(played===0) return null;

        // Kendi ligimizse gerçek veriler
        let lgPlayers=[];
        if(tabLg===myLg){
          lgPlayers=genLigScorers(season,squad,clubName,db||undefined);
        } else {
          // Diğer liglerde DB'den pozisyon bazlı simüle et
          const dbPlayers=(db||DB).filter(p=>p.lg===tabLg&&p.pos!=="GK").slice(0,60);
          const FW_POS=["ST","LW","RW","CF","CAM"];
          const MF_POS=["LM","RM","CM","CDM"];
          lgPlayers=dbPlayers.map((p,idx)=>{
            const isStarter=idx<11*((dbPlayers.length/11)|0)?(idx%11)<10:idx<10; // yaklaşık starter
            const goalBase=FW_POS.includes(p.pos)?0.45:MF_POS.includes(p.pos)?0.20:0.05;
            const assistBase=FW_POS.includes(p.pos)?0.15:MF_POS.includes(p.pos)?0.40:0.08;
            const starterMult=isStarter?1.0:0.35;
            const ovrFactor=p.ovr>=88?1.3:p.ovr>=82?1.0:p.ovr>=76?0.75:0.5;
            const variance=seededRnd(p.id*13,85,115)/100;
            const g=Math.round(played*goalBase*ovrFactor*starterMult*variance);
            const a=Math.round(played*assistBase*ovrFactor*starterMult*variance);
            return{n:p.n,pos:p.pos,club:p.club,g,a,m:played,me:false,ovr:p.ovr};
          });
        }
        const topG=[...lgPlayers].sort((a,b)=>b.g-a.g).filter(p=>p.g>0).slice(0,5);
        const topA=[...lgPlayers].sort((a,b)=>b.a-a.a).filter(p=>p.a>0).slice(0,5);
        if(topG.length===0) return null;
        return(
          <div style={{borderTop:"1px solid rgba(45,143,255,0.1)",flexShrink:0,background:C.card}}>
            <div style={{display:"flex",gap:0}}>
              <div style={{flex:1,borderRight:"1px solid rgba(45,143,255,0.1)"}}>
                <div style={{padding:"3px 8px",fontSize:".42rem",fontWeight:700,color:C.grn2,letterSpacing:1,background:"rgba(39,174,96,.07)",borderBottom:"1px solid rgba(39,174,96,.15)"}}>⚽ GOL KRALLARI</div>
                {topG.map((p,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:4,padding:"2px 8px",borderBottom:i<4?"1px solid rgba(45,143,255,0.05)":"none"}}>
                    <span style={{fontSize:".44rem",color:i===0?C.gd:C.dim,fontWeight:700,minWidth:10}}>{i+1}</span>
                    <span style={{flex:1,fontSize:".5rem",color:p.me?C.ac2:C.wh,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontWeight:p.me?700:400}}>{p.n}</span>
                    <span style={{fontSize:".42rem",color:C.dmr,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:60}}>{p.me?clubName:p.club}</span>
                    <span style={{fontSize:".6rem",fontWeight:800,color:i===0?C.grn2:C.wh,minWidth:16,textAlign:"right"}}>{p.g}</span>
                  </div>
                ))}
              </div>
              <div style={{flex:1}}>
                <div style={{padding:"3px 8px",fontSize:".42rem",fontWeight:700,color:"#a78bfa",letterSpacing:1,background:"rgba(142,68,173,.07)",borderBottom:"1px solid rgba(142,68,173,.15)"}}>🎯 ASİST KRALLARI</div>
                {topA.map((p,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:4,padding:"2px 8px",borderBottom:i<4?"1px solid rgba(45,143,255,0.05)":"none"}}>
                    <span style={{fontSize:".44rem",color:i===0?C.gd:C.dim,fontWeight:700,minWidth:10}}>{i+1}</span>
                    <span style={{flex:1,fontSize:".5rem",color:p.me?C.ac2:C.wh,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontWeight:p.me?700:400}}>{p.n}</span>
                    <span style={{fontSize:".42rem",color:C.dmr,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:60}}>{p.me?clubName:p.club}</span>
                    <span style={{fontSize:".6rem",fontWeight:800,color:i===0?"#a78bfa":C.wh,minWidth:16,textAlign:"right"}}>{p.a}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })()}
      </>
      )}
    </div>
  );
}
