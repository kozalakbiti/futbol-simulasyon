// ─── ANA SAYFA ───────────────────────────────────────────────
function PageHome({season,clubName="Club Manager: Glory Road",activeScenario=null,squad=[],careerStats=null,db=null}){
  const myLg=season.league||"1. Lig";
  const allLgs=["1. Lig","Elit Lig","İngiliz Ligi","İspanyol Ligi","Alman Ligi","İtalyan Ligi","Fransız Ligi","Hollanda Ligi","Portekiz Ligi"];
  const showLgs=allLgs.filter(lg=>season.teams.some(t=>t.lg===lg));
  const hasCL=!!season.clGroups;
  const hasUEFA=!!season.uefaGroups;
  const kupa=season.kupaSonuc||{group:"",w:0,d:0,l:0,gf:0,ga:0,pts:0};
  const tabs=[...showLgs.map(lg=>({id:lg,lbl:{"1. Lig":"1.Lig","Elit Lig":"Elit","İngiliz Ligi":"Eng","İspanyol Ligi":"Esp","Alman Ligi":"Ger","İtalyan Ligi":"Ita","Fransız Ligi":"Fra","Hollanda Ligi":"Hol","Portekiz Ligi":"Por"}[lg]||lg,euro:false})),
    {id:"ZTK",  lbl:"🏆 KUPA",  euro:true, color:"#cc2233"},
    {id:"SUPERKUPA", lbl:"🛡️ KALKAN", euro:true, color:"#c0ff00"},
    {id:"CL",   lbl:"⭐ ASK",    euro:true, color:"#ffd060"},
    {id:"UEFA", lbl:"🇪🇺 AL", euro:true, color:"#e67e22"},
  ];
  const [selTab,setSelTab]=useState(myLg);

  const isEuro=selTab==="CL"||selTab==="UEFA"||selTab==="ZTK"||selTab==="SUPERKUPA";
  const groups=selTab==="CL"?season.clGroups:selTab==="UEFA"?season.uefaGroups:null;

  // Lig tablosu — me:true takım sadece kendi liginde görünsün
  const rows=!isEuro?[...season.teams].filter(t=>t.lg===selTab&&(!t.me||selTab===myLg)).sort((a,b)=>b.pts-a.pts||b.gd-a.gd||b.gf-a.gf):[];
  const promoLine=selTab==="1. Lig"?3:selTab==="Elit Lig"?2:null;
  const euLine=selTab==="Elit Lig"?4:null;
  const relLine=selTab==="Elit Lig"&&rows.length>3?rows.length-3:null;

  const GroupTable=({teams,name})=>{
    const sorted=[...teams].sort((a,b)=>b.pts-a.pts||(b.gf-b.ga)-(a.gf-a.ga));
    const euroColor=selTab==="CL"?"#ffd060":"#e67e22";
    return(
      <div style={{marginBottom:10,border:`1px solid rgba(${selTab==="CL"?"232,184,58":"230,126,34"},.25)`,borderRadius:6,overflow:"hidden"}}>
        <div style={{padding:"4px 8px",background:`rgba(${selTab==="CL"?"232,184,58":"230,126,34"},.12)`,
          fontSize:".5rem",fontWeight:700,letterSpacing:2,color:euroColor,textTransform:"uppercase"}}>
          {selTab==="CL"?"⭐":"🇪🇺"} GRUP {name}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"18px minmax(0,1fr) 22px 22px 22px 22px 38px 26px",
          padding:"4px 8px",fontSize:".42rem",color:"rgba(77,168,255,.5)",letterSpacing:1.2,textTransform:"uppercase",borderBottom:`1px solid rgba(77,168,255,0.12)`,background:"rgba(77,168,255,.04)",fontWeight:700}}>
          <span style={{textAlign:"center"}}>#</span><span style={{paddingLeft:3}}>Takım</span>
          <span style={{textAlign:"center"}}>O</span><span style={{textAlign:"center"}}>G</span>
          <span style={{textAlign:"center"}}>B</span><span style={{textAlign:"center"}}>M</span>
          <span style={{textAlign:"center"}}>Av</span><span style={{textAlign:"center"}}>P</span>
        </div>
        {sorted.map((t,i)=>(
          <div key={t.n} style={{display:"grid",gridTemplateColumns:"18px minmax(0,1fr) 22px 22px 22px 22px 38px 26px",
            padding:"4px 8px",borderBottom:i<sorted.length-1?`1px solid rgba(77,166,255,0.1)`:"none",alignItems:"center",
            background:t.me?"rgba(45,143,255,.12)":i<2?`rgba(${selTab==="CL"?"232,184,58":"230,126,34"},.05)`:"",
            borderLeft:t.me?`3px solid ${C.ac2}`:i<2?`3px solid ${euroColor}66`:"3px solid transparent"}}>
            <span style={{fontSize:".54rem",textAlign:"center",fontWeight:800,color:i<2?euroColor:C.dim,fontFamily:"'Barlow Condensed',sans-serif"}}>{i+1}</span>
            <span style={{fontSize:".62rem",color:t.me?C.ac2:C.wh,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",paddingLeft:3,display:"flex",alignItems:"center",gap:4}}>
              <TeamBadge name={t.me?clubName:t.n} size="sm"/>
              {t.me&&<span style={{fontSize:".44rem",marginRight:2}}>▶</span>}{t.me?clubName:t.n}
            </span>
            <span style={{textAlign:"center",fontSize:".56rem",color:C.dim}}>{t.w+t.d+t.l}</span>
            <span style={{textAlign:"center",fontSize:".56rem",color:C.grn2}}>{t.w}</span>
            <span style={{textAlign:"center",fontSize:".56rem",color:C.gd}}>{t.d}</span>
            <span style={{textAlign:"center",fontSize:".56rem",color:C.red2}}>{t.l}</span>
            <span style={{textAlign:"center",fontSize:".5rem",color:C.dim}}>{t.gd>0?"+"+t.gd:t.gd}</span>
            <span style={{textAlign:"center",fontSize:".72rem",fontWeight:700,color:t.me?euroColor:C.wh,fontFamily:"'Barlow Condensed',sans-serif"}}>{t.pts}</span>
          </div>
        ))}
        <div style={{padding:"3px 8px",fontSize:".42rem",color:euroColor,background:`rgba(${selTab==="CL"?"232,184,58":"230,126,34"},.06)`}}>
          ▲ İlk 2: {selTab==="CL"?"Son 16":"Eleme Turu"}
        </div>
      </div>
    );
  };

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
        position:"relative",zIndex:1,background:"rgba(1,4,9,.95)",backdropFilter:"blur(10px)",borderBottom:"2px solid rgba(77,166,255,0.15)"}}>
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
                :isMe?"rgba(77,166,255,.25)":"rgba(255,255,255,.08)"
              :"rgba(255,255,255,.03)",
            border:`1px solid ${isActive
              ?tab.euro?(tab.id==="CL"?"rgba(240,192,64,.5)":"rgba(232,116,42,.5)")
                :isMe?"rgba(45,143,255,.5)":"rgba(255,255,255,.2)"
              :"rgba(255,255,255,.06)"}`,
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
                <div style={{background:"rgba(0,0,0,.35)",borderRadius:8,padding:"10px",border:`1px solid ${skGoldBg}.15)`}}>
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
                      <div style={{textAlign:"center",fontSize:"1.4rem",fontWeight:900,color:"#fff",letterSpacing:4,marginTop:2}}>
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
                <div style={{marginTop:10,padding:"10px",borderRadius:8,background:"rgba(0,0,0,.2)",
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
                          background:i%2===0?"rgba(255,255,255,.02)":""}}>
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
                                    <span style={{flex:1,color:w===a?C.wh:"rgba(255,255,255,.3)",fontWeight:w===a?700:400,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{w===a?"✅":""} {a}</span>
                                    <span style={{color:C.dmr,fontSize:".4rem",flexShrink:0}}>vs</span>
                                    <span style={{flex:1,textAlign:"right",color:w===b?C.wh:"rgba(255,255,255,.3)",fontWeight:w===b?700:400,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{b} {w===b?"✅":""}</span>
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
      ):selTab!=="ZTK"&&selTab!=="SUPERKUPA"&&(selTab==="CL"||selTab==="UEFA")&&!season.fixture.some(f=>f.comp===selTab&&f.round&&!f.round.startsWith("Grup"))&&((season.results||[]).some(r=>r.comp===selTab&&r.round)||groups)?(
        <div style={{flex:1,overflowY:"auto",padding:"8px 8px 0"}}>
          {groups&&Object.entries(groups).map(([name,teams])=>(
            <GroupTable key={name} name={name} teams={teams}/>
          ))}
          {groups&&<div style={{padding:"6px 0 10px",fontSize:".44rem",color:C.dmr,textAlign:"center"}}>
            {selTab==="CL"?"⭐ Avrupa Şampiyonlar Kupası — Grup Aşaması":"🇪🇺 Avrupa Ligi — Grup Aşaması"}
          </div>}
          {/* Gol & Asist Krallığı — KO oynanmışsa onu göster, yoksa grup */}
          {(()=>{
            const accentColK=selTab==="CL"?"#ffd060":"#e67e22";
            const accentRgbK=selTab==="CL"?"232,184,58":"230,126,34";
            const koPlayedResults=(season.results||[]).filter(r=>r.comp===selTab&&r.round&&!r.round.startsWith("Grup"));
            // KO oynandıysa Dal 2 ile birebir aynı mantık — groups kullanma
            if(koPlayedResults.length>0){
              const allTourneyR=(season.results||[]).filter(r=>r.comp===selTab&&r.round);
              const accentColK2=selTab==="CL"?"#ffd060":"#e67e22";
              const accentRgbK2=selTab==="CL"?"232,184,58":"230,126,34";
              // Tüm turnuva oyuncuları: grup simülasyonunu baz al
              // Sonra kullanıcının gerçek tüm turnuva (grup+KO) verisini üstüne yaz
              const euroGrp=selTab==="CL"?season.clGroups:season.uefaGroups;
              const simBase=euroGrp?Object.values(euroGrp).flat().map(t=>{
                const tn=t.n||t; const teamGf=t.gf||0;
                if(t.me) return null;
                // Rakip asistleri listede gorunsun — teamGf boost
                return getTeamEuroScorers(tn,Math.round(teamGf*1.5),db||undefined).map(s=>({n:s.n,team:tn,g:s.g,a:s.a,me:false}));
              }).filter(Boolean).flat():[];
              let allPlayersKO2=[...simBase];
              // KO simüle rakipler ekle
              const allKoOpps=[...new Set(allTourneyR.filter(r=>r.round&&!r.round.startsWith("Grup")).map(r=>r.opp))];
              allKoOpps.forEach(tn=>{
                const tot=allTourneyR.filter(r=>r.opp===tn).reduce((s,r)=>s+(r.opG||0),0);
                if(tot===0) return;
                getTeamEuroScorers(tn,tot,db||undefined).forEach(s=>{
                  const ex=allPlayersKO2.find(p=>p.n===s.n&&p.team===tn);
                  // Toplama yap (override degil) — grup gollerine KO golleri ekle
                  if(ex){ex.g+=s.g;ex.a+=s.a;} else allPlayersKO2.push({n:s.n,team:tn,g:s.g,a:s.a,me:false});
                });
              });
              // Kullanıcı: gerçek gol/asist verisi
              const gc={},ac={};
              allTourneyR.forEach(r=>{
                (r.scorers||[]).forEach(n=>{if(typeof n==="string") gc[n]=(gc[n]||0)+1;});
                (r.assisters||[]).forEach(n=>{if(typeof n==="string") ac[n]=(ac[n]||0)+1;});
              });
              Object.entries(gc).forEach(([n,g])=>{
                const ex=allPlayersKO2.find(p=>p.n===n&&p.me);
                if(ex){ex.g=g;ex.a=ac[n]||0;} else allPlayersKO2.push({n,team:clubName,g,a:ac[n]||0,me:true});
              });
              Object.entries(ac).forEach(([n,a])=>{
                if(gc[n]) return;
                const ex=allPlayersKO2.find(p=>p.n===n&&p.me);
                if(ex){ex.a=a;} else allPlayersKO2.push({n,team:clubName,g:0,a,me:true});
              });
              const topGko2=[...allPlayersKO2].sort((a,b)=>b.g-a.g).filter(p=>p.g>0).slice(0,5);
              const topAko2=[...allPlayersKO2].sort((a,b)=>b.a-a.a).filter(p=>p.a>0).slice(0,5);
              if(topGko2.length===0) return null;
              return(
                <div style={{border:`1px solid rgba(${accentRgbK},.3)`,borderRadius:8,overflow:"hidden",marginBottom:8}}>
                  <div style={{padding:"5px 10px",background:`rgba(${accentRgbK},.12)`,fontSize:".5rem",fontWeight:700,color:accentColK,letterSpacing:1}}>
                    {selTab==="CL"?"⭐":"🇪🇺"} GOL & ASİST KRALLARI
                  </div>
                  <div style={{display:"flex",gap:0}}>
                    <div style={{flex:1,borderRight:"1px solid rgba(77,166,255,0.1)"}}>
                      <div style={{padding:"3px 8px",fontSize:".42rem",fontWeight:700,color:C.grn2,letterSpacing:1,background:"rgba(39,174,96,.07)",borderBottom:"1px solid rgba(39,174,96,.15)"}}>⚽ GOL KRALLARI</div>
                      {topGko2.map((p,i)=>(
                        <div key={i} style={{display:"flex",alignItems:"center",gap:4,padding:"3px 8px",borderBottom:i<4?"1px solid rgba(45,143,255,0.06)":"none"}}>
                          <span style={{fontSize:".44rem",color:i===0?C.gd:C.dim,fontWeight:700,minWidth:10}}>{i+1}</span>
                          <span style={{flex:1,fontSize:".5rem",color:p.me?C.ac2:C.wh,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontWeight:p.me?700:400}}>{p.n}</span>
                          <span style={{fontSize:".42rem",color:C.dmr,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:55}}>{p.team}</span>
                          <span style={{fontSize:".6rem",fontWeight:800,color:i===0?C.grn2:C.wh,minWidth:16,textAlign:"right"}}>{p.g}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{flex:1}}>
                      <div style={{padding:"3px 8px",fontSize:".42rem",fontWeight:700,color:"#a78bfa",letterSpacing:1,background:"rgba(142,68,173,.07)",borderBottom:"1px solid rgba(142,68,173,.15)"}}>🎯 ASİST KRALLARI</div>
                      {topAko2.map((p,i)=>(
                        <div key={i} style={{display:"flex",alignItems:"center",gap:4,padding:"3px 8px",borderBottom:i<4?"1px solid rgba(45,143,255,0.06)":"none"}}>
                          <span style={{fontSize:".44rem",color:i===0?C.gd:C.dim,fontWeight:700,minWidth:10}}>{i+1}</span>
                          <span style={{flex:1,fontSize:".5rem",color:p.me?C.ac2:C.wh,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontWeight:p.me?700:400}}>{p.n}</span>
                          <span style={{fontSize:".42rem",color:C.dmr,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:55}}>{p.team}</span>
                          <span style={{fontSize:".6rem",fontWeight:800,color:i===0?"#a78bfa":C.wh,minWidth:16,textAlign:"right"}}>{p.a}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            }
            // KO oynanmadıysa grup GK/AK göster
            const allGroupTeams=Object.values(groups||{}).flat();
            const euroGroupResults=(season.results||[]).filter(r=>r.comp===selTab&&r.round&&r.round.startsWith("Grup"));
            const played2=Math.min(euroGroupResults.length,6);
            if(played2===0||allGroupTeams.length===0) return null;
            let allPlayers=[];
            allGroupTeams.forEach((t)=>{
              const tn=t.n||t;
              const isMe=!!t.me;
              const teamGf=t.gf||0;
              if(isMe){
                const goalCount={};
                const assistCount={};
                euroGroupResults.forEach(r=>{
                  (r.scorers||[]).forEach(n=>{if(typeof n==="string") goalCount[n]=(goalCount[n]||0)+1;});
                  (r.assisters||[]).forEach(n=>{if(typeof n==="string") assistCount[n]=(assistCount[n]||0)+1;});
                });
                Object.entries(goalCount).forEach(([n,g])=>allPlayers.push({n,team:clubName,g,a:assistCount[n]||0,me:true}));
                Object.entries(assistCount).forEach(([n,a])=>{if(!goalCount[n]) allPlayers.push({n,team:clubName,g:0,a,me:true});});
              } else {
                getTeamEuroScorers(tn,teamGf,db||undefined).forEach(s=>allPlayers.push({n:s.n,team:tn,g:s.g,a:s.a,me:false}));
              }
            });
            const topG=[...allPlayers].sort((a,b)=>b.g-a.g).filter(p=>p.g>0).slice(0,5);
            const topA=[...allPlayers].sort((a,b)=>b.a-a.a).filter(p=>p.a>0).slice(0,5);
            if(topG.length===0) return null;
            return(
              <div style={{border:`1px solid rgba(${accentRgbK},.3)`,borderRadius:8,overflow:"hidden",marginBottom:8}}>
                <div style={{padding:"5px 10px",background:`rgba(${accentRgbK},.12)`,fontSize:".5rem",fontWeight:700,color:accentColK,letterSpacing:1}}>
                  {selTab==="CL"?"⭐":"🇪🇺"} GOL & ASİST KRALLARI
                </div>
                <div style={{display:"flex",gap:0}}>
                  <div style={{flex:1,borderRight:"1px solid rgba(77,166,255,0.1)"}}>
                    <div style={{padding:"3px 8px",fontSize:".42rem",fontWeight:700,color:C.grn2,letterSpacing:1,background:"rgba(39,174,96,.07)",borderBottom:"1px solid rgba(39,174,96,.15)"}}>⚽ GOL KRALLARI</div>
                    {topG.map((p,i)=>(
                      <div key={i} style={{display:"flex",alignItems:"center",gap:4,padding:"3px 8px",borderBottom:i<4?"1px solid rgba(45,143,255,0.06)":"none"}}>
                        <span style={{fontSize:".44rem",color:i===0?C.gd:C.dim,fontWeight:700,minWidth:10}}>{i+1}</span>
                        <span style={{flex:1,fontSize:".5rem",color:p.me?C.ac2:C.wh,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontWeight:p.me?700:400}}>{p.n}</span>
                        <span style={{fontSize:".42rem",color:C.dmr,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:55}}>{p.team}</span>
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
                        <span style={{fontSize:".42rem",color:C.dmr,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:55}}>{p.team}</span>
                        <span style={{fontSize:".6rem",fontWeight:800,color:i===0?"#a78bfa":C.wh,minWidth:16,textAlign:"right"}}>{p.a}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}
          {/* Grup Aşaması Prim Tablosu */}
          {(()=>{
            const accentCol=selTab==="CL"?"#ffd060":"#e67e22";
            const accentRgb=selTab==="CL"?"232,184,58":"230,126,34";
            const primData=selTab==="CL"?[
              {label:"Grup Galibiyeti",    val:"800K€", icon:"✅"},
              {label:"Grup Berabere",      val:"300K€", icon:"🤝"},
              {label:"Son 16'ya Çıkma",   val:"4M€",   icon:"🏅"},
              {label:"Çeyrek Final+",     val:"6.5M€+", icon:"🥉"},
              {label:"Şampiyonluk",       val:"25M€",  icon:"🎉"},
            ]:[
              {label:"Grup Galibiyeti",   val:"300K€", icon:"✅"},
              {label:"Grup Berabere",     val:"100K€", icon:"🤝"},
              {label:"Son 16'ya Çıkma",  val:"1.5M€", icon:"🏅"},
              {label:"Çeyrek Final+",    val:"2.5M€+", icon:"🥉"},
              {label:"Şampiyonluk",      val:"10M€",  icon:"🎉"},
            ];
            return(
              <div style={{border:`1px solid rgba(${accentRgb},.3)`,borderRadius:8,overflow:"hidden",marginBottom:8}}>
                <div style={{padding:"5px 10px",background:`rgba(${accentRgb},.12)`,display:"flex",alignItems:"center",gap:6}}>
                  <span style={{fontSize:".8rem"}}>💰</span>
                  <div style={{fontSize:".58rem",fontWeight:700,color:accentCol}}>Prim Tablosu</div>
                </div>
                {primData.map((p,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"3px 10px",
                    borderBottom:i<primData.length-1?`1px solid rgba(77,166,255,0.1)`:"none",
                    background:i%2===0?"rgba(255,255,255,.02)":""}}>
                    <span style={{fontSize:".65rem",minWidth:16}}>{p.icon}</span>
                    <span style={{flex:1,fontSize:".52rem",color:C.dim}}>{p.label}</span>
                    <span style={{fontSize:".58rem",fontWeight:700,color:"#ffd060"}}>{p.val}</span>
                  </div>
                ))}
              </div>
            );
          })()}
          {/* KO Simülasyonu — grup bitti, hibrit bracket (gerçek maçlar + simüle devam) */}
          {(()=>{
            const accentCol=selTab==="CL"?"#ffd060":"#e67e22";
            const accentRgb=selTab==="CL"?"232,184,58":"230,126,34";
            const grpPlayedCount=(season.results||[]).filter(r=>r.comp===selTab&&r.round&&r.round.startsWith("Grup")).length;
            if(grpPlayedCount<6) return null;
            // ── hibrit bracket: kullanıcının gerçek sonuçları + kalan takımlar simüle ──
            const _koSeed=(a,b,r)=>{let h=5381;const s=a+b+r;for(let i=0;i<s.length;i++)h=((h<<5)+h)+s.charCodeAt(i);return Math.abs(h);};
            const realKoRes=(season.results||[]).filter(r=>(r.comp===selTab)&&r.round&&!r.round.startsWith("Grup"));
            // Kullanıcı bu kupada KO oynamışsa hibrit, oynamamışsa tamamen simüle
            const userParticipating=realKoRes.length>0;
            const roundMatchesKw=(round,kw)=>{
              if(kw==="Final") return round==="Final"||(round.startsWith("Final")&&!round.includes("Çeyrek")&&!round.includes("Yarı"));
              return round.includes(kw);
            };
            const findRR=(kw)=>{
              const ms=realKoRes.filter(r=>r.round&&roundMatchesKw(r.round,kw));
              if(!ms.length) return null;
              const last=ms[ms.length-1];
              const myT=ms.reduce((s,r)=>s+(r.myG||0),0);
              const opT=ms.reduce((s,r)=>s+(r.opG||0),0);
              const won=myT>opT||(myT===opT&&last.r==="W"&&(last.pen===true||ms.length===1));
              return {opp:last.opp,won,myG:myT,opG:opT};
            };
            const q16=(()=>{
              if(!groups) return [];
              const q=[];
              Object.values(groups).forEach(gt=>{
                const s=[...gt].sort((a,b)=>
                  b.pts-a.pts||
                  ((b.gf||0)-(b.ga||0))-((a.gf||0)-(a.ga||0))||
                  (b.gf||0)-(a.gf||0)||
                  (a.ga||0)-(b.ga||0)||
                  (b.w||0)-(a.w||0)
                );
                if(s[0]) q.push(s[0].me?clubName:s[0].n);
                if(s[1]&&s[1].n!==s[0].n) q.push(s[1].me?clubName:s[1].n);
              });
              return q;
            })();
            if(q16.length<2) return null;
            const turKws=["Son 16","Çeyrek","Yarı Final","Final"];
            const turLbls=["🔟 Son 16","🏅 Çeyrek Final","🥈 Yarı Final","🏆 Final"];
            const turIds=["s16","qf","sf","fin"];
            // Zaman bazlı kaç tur gösterilecek
            const _MO=["Temmuz","Agustos","Eylul","Ekim","Kasim","Aralik","Ocak","Subat","Mart","Nisan","Mayis","Haziran"];
            const _lm=(season.results||[]).reduce((mx,r)=>Math.max(mx,_MO.indexOf(r.month||"")),-1);
            const _sub=_MO.indexOf("Subat");const _mar=_MO.indexOf("Mart");const _nis=_MO.indexOf("Nisan");
            const _se=!(season.fixture||[]).some(f=>!["ZTK","CL","UEFA","HAZ","SUPERKUPA"].includes(f.comp))&&(season.played||0)>5;
            const maxTur=(()=>{if(_lm<_sub)return 0;if(_lm<=_mar)return 1;if(_lm===_nis)return 2;if(_lm>=_nis&&!_se)return 3;return 4;})();
            if(maxTur===0) return(<div style={{textAlign:"center",padding:"12px",fontSize:".48rem",color:`rgba(${accentRgb},.5)`}}>⏳ Son 16 — Şubat ayında başlayacak</div>);
            // Bracket oluştur
            // userParticipating=true → hibrit (gerçek + simüle)
            // userParticipating=false → tamamen simüle (ASK'ta AL oynayan kullanıcı gibi)
            let currentSurvivors=[...q16];
            if(userParticipating){
              const rr0=findRR(turKws[0]);
              if(rr0){
                if(!currentSurvivors.includes(clubName)) currentSurvivors.push(clubName);
                if(!currentSurvivors.includes(rr0.opp)){
                  const toRm=currentSurvivors.map((n,_i)=>({n,i:_i})).reverse().find(({n})=>n!==clubName&&n!==rr0.opp);
                  if(toRm) currentSurvivors.splice(toRm.i,1);
                  currentSurvivors.push(rr0.opp);
                }
              }
            }
            const _drawS16=(q,seed)=>{
              const pot1=q.filter((_,i)=>i%2===0);
              const pot2=q.filter((_,i)=>i%2===1);
              const used=new Array(pot2.length).fill(false);
              const pairs=[];
              const hh=(a,b,r)=>{let h=5381;const s=a+b+r;for(let i=0;i<s.length;i++)h=((h<<5)+h)+s.charCodeAt(i);return Math.abs(h);};
              for(let i=0;i<pot1.length;i++){
                const a=pot1[i];
                const cands=pot2.map((b,j)=>({b,j})).filter(({j})=>j!==i&&!used[j]);
                const pool=cands.length>0?cands:pot2.map((b,j)=>({b,j})).filter(({j})=>!used[j]);
                if(!pool.length) continue;
                const pick=pool[hh(a,seed,"p")%pool.length];
                used[pick.j]=true;
                const h2=hh(a,pick.b,"s16");const aW=h2%2===0;const wG=1+(h2%3);const lG=wG>1?(h2*13)%wG:0;
                pairs.push({a,b:pick.b,w:aW?a:pick.b,l:aW?pick.b:a,ga:aW?wG:lG,gb:aW?lG:wG});
              }
              return pairs;
            };
            const allKoRounds=[];
            for(let ti=0;ti<maxTur;ti++){
              const kw=turKws[ti];const rId=turIds[ti];
              const rr=userParticipating?findRR(kw):null;
              const matches=[];const nextSurv=[];const proc=new Set();
              // S16 turu ve kullanıcı bu turu oynamıyorsa → Pot1 vs Pot2 kura
              if(ti===0&&!rr){
                const s16P=_drawS16(currentSurvivors,"s16seed");
                s16P.forEach(m=>{matches.push(m);nextSurv.push(m.w);proc.add(m.a);proc.add(m.b);});
              } else {
              let teams=[...currentSurvivors];
              if(rr){
                if(!teams.includes(clubName)) teams.push(clubName);
                if(!teams.includes(rr.opp)){
                  const toRm=teams.map((n,_i)=>({n,i:_i})).reverse().find(({n})=>n!==clubName&&n!==rr.opp);
                  if(toRm) teams.splice(toRm.i,1);
                  teams.push(rr.opp);
                }
                teams=[...teams.filter(n=>n!==clubName&&n!==rr.opp)];
                teams=[clubName,rr.opp,...teams];
              }
              let i=0;
              while(i+1<teams.length){
                const a=teams[i],b=teams[i+1];
                if(proc.has(a)||proc.has(b)){i+=2;continue;}
                const meIn=(a===clubName||b===clubName);
                if(meIn&&rr){
                  const opp=rr.opp;const w=rr.won?clubName:opp;
                  matches.push({a:clubName,b:opp,w,ga:rr.myG,gb:rr.opG,real:true});
                  nextSurv.push(w);proc.add(clubName);proc.add(opp);
                } else {
                  const h=_koSeed(a,b,rId);const aW=h%2===0;const wG=1+(h%3);const lG=wG>1?(h*13)%wG:0;
                  const w=aW?a:b;
                  matches.push({a,b,w,ga:aW?wG:lG,gb:aW?lG:wG});
                  nextSurv.push(w);proc.add(a);proc.add(b);
                }
                i+=2;
              }
              } // end else (S16 kura vs normal)
              allKoRounds.push({label:turLbls[ti],matches});
              currentSurvivors=nextSurv;
              if(userParticipating&&ti+1<maxTur){
                const rrN=findRR(turKws[ti+1]);
                if(rrN){
                  if(!currentSurvivors.includes(clubName)) currentSurvivors.push(clubName);
                  if(!currentSurvivors.includes(rrN.opp)){
                    const toRm=currentSurvivors.map((n,_i)=>({n,i:_i})).reverse().find(({n})=>n!==clubName&&n!==rrN.opp);
                    if(toRm) currentSurvivors.splice(toRm.i,1);
                    currentSurvivors.push(rrN.opp);
                  }
                }
              }
            }
            const lastRd=allKoRounds[allKoRounds.length-1];
            const champ=allKoRounds.length>=4&&lastRd?.matches[0]?lastRd.matches[0].w:null;
            return(
              <div style={{marginBottom:10}}>
                <div style={{fontSize:".46rem",color:C.dmr,marginBottom:6,letterSpacing:1,textTransform:"uppercase",textAlign:"center"}}>📡 Eleme Aşaması Simülasyonu</div>
                {allKoRounds.map((rd,ri)=>(
                  <div key={ri} style={{marginBottom:6,border:`1px solid rgba(${accentRgb},.22)`,borderRadius:6,overflow:"hidden"}}>
                    <div style={{padding:"4px 8px",background:`rgba(${accentRgb},.15)`,fontSize:".5rem",fontWeight:700,color:accentCol}}>{rd.label}</div>
                    {rd.matches.map((m,mi)=>{
                      const flip=m.b===clubName;
                      const left=flip?m.b:m.a; const right=flip?m.a:m.b;
                      const ga=flip?m.gb:m.ga; const gb=flip?m.ga:m.gb;
                      return(
                      <div key={mi} style={{display:"grid",gridTemplateColumns:"1fr 36px 1fr",alignItems:"center",padding:"4px 6px",borderBottom:mi<rd.matches.length-1?"1px solid rgba(255,255,255,.05)":"none",background:mi%2===0?"rgba(0,0,0,.15)":"rgba(0,0,0,.05)"}}>
                        <div style={{display:"flex",alignItems:"center",gap:3,overflow:"hidden"}}>
                          <span style={{fontSize:".36rem"}}>{m.w===left?"✅":"❌"}</span>
                          <span style={{fontSize:".44rem",fontWeight:m.w===left?700:400,color:m.w===left?"#fff":"rgba(255,255,255,.3)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",textDecoration:m.w===left?"none":"line-through"}}>{left}</span>
                        </div>
                        <div style={{textAlign:"center"}}><span style={{fontSize:".44rem",fontWeight:800,color:accentCol,background:`rgba(${accentRgb},.2)`,borderRadius:4,padding:"1px 4px"}}>{ga}–{gb}</span></div>
                        <div style={{display:"flex",alignItems:"center",gap:3,justifyContent:"flex-end",overflow:"hidden"}}>
                          <span style={{fontSize:".44rem",fontWeight:m.w===right?700:400,color:m.w===right?"#fff":"rgba(255,255,255,.3)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",textDecoration:m.w===right?"none":"line-through"}}>{right}</span>
                          <span style={{fontSize:".36rem"}}>{m.w===right?"✅":"❌"}</span>
                        </div>
                      </div>
                      );
                    })}
                    {ri===allKoRounds.length-1&&champ&&(
                      <div style={{padding:"6px",background:`rgba(${accentRgb},.18)`,textAlign:"center",fontSize:".54rem",fontWeight:800,color:accentCol}}>🏆 ŞAMPİYON: {champ}</div>
                    )}
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      ):selTab!=="ZTK"&&selTab!=="SUPERKUPA"&&(selTab==="CL"||selTab==="UEFA")&&(season.fixture.some(f=>f.comp===selTab&&f.round&&!f.round.startsWith("Grup"))||(season.results||[]).some(r=>r.comp===selTab&&r.round&&!r.round.startsWith("Grup")))?(
        // KO aşaması — eleme turlarını göster
        <div style={{flex:1,overflowY:"auto",padding:"12px"}}>
          <div style={{textAlign:"center",marginBottom:14}}>
            <div style={{fontSize:"2rem"}}>{selTab==="CL"?"⭐":"🇪🇺"}</div>
            <div style={{fontSize:".72rem",fontWeight:800,color:selTab==="CL"?"#ffd060":"#e67e22",marginBottom:4}}>
              {selTab==="CL"?"Avrupa Şampiyonlar Kupası — Eleme Aşaması":"Avrupa Ligi — Eleme Aşaması"}
            </div>
          </div>
          {(()=>{
            const koFix=season.fixture.filter(f=>f.comp===selTab&&f.round&&!f.round.startsWith("Grup"));
            const koResults=season.results.filter(r=>r.comp===selTab&&r.round&&!r.round.startsWith("Grup Aşaması"));
            const accentCol=selTab==="CL"?"#ffd060":"#e67e22";
            const accentRgb=selTab==="CL"?"232,184,58":"230,126,34";
            const allRounds=[...new Set([...koResults.map(r=>r.round?.replace(" — 1. Maç","").replace(" — 2. Maç","")||""),
              ...koFix.map(f=>f.round?.replace(" — 1. Maç","").replace(" — 2. Maç","")||"")])].filter(Boolean);
            const primData=selTab==="CL"?[
              {label:"Grup Galibiyeti",        val:"800K€",  icon:"✅"},
              {label:"Grup Berabere",           val:"300K€",  icon:"🤝"},
              {label:"Son 16'ya Çıkma",         val:"4M€",    icon:"🏅"},
              {label:"Çeyrek Finale Çıkma",     val:"6.5M€",  icon:"🥉"},
              {label:"Yarı Finale Çıkma",       val:"10M€",   icon:"🥈"},
              {label:"Finale Çıkma",            val:"15M€",   icon:"🥇"},
              {label:"Finalist (ekstra)",        val:"8M€",    icon:"🏆"},
              {label:"Şampiyonluk",             val:"25M€",   icon:"🎉"},
            ]:[
              {label:"Grup Galibiyeti",         val:"300K€",  icon:"✅"},
              {label:"Grup Berabere",           val:"100K€",  icon:"🤝"},
              {label:"Son 16'ya Çıkma",         val:"1.5M€",  icon:"🏅"},
              {label:"Çeyrek Finale Çıkma",     val:"2.5M€",  icon:"🥉"},
              {label:"Yarı Finale Çıkma",       val:"4M€",    icon:"🥈"},
              {label:"Finale Çıkma",            val:"6M€",    icon:"🥇"},
              {label:"Finalist (ekstra)",        val:"3M€",    icon:"🏆"},
              {label:"Şampiyonluk",             val:"10M€",   icon:"🎉"},
            ];
            // KO takvim fazı — mevcut haftaya göre kaç tur oynanmış?
            const _koSeedFn=(a,b,r)=>{let h=5381;const s=a+b+r;for(let i=0;i<s.length;i++)h=((h<<5)+h)+s.charCodeAt(i);return Math.abs(h);};
            const KO_ROUND_ORDER=["Son 16","Çeyrek","Yarı","Final"];
            const roundLabels=["Son 16","Çeyrek Final","Yarı Final","Final"];
            const roundIds=["Son 16","Çeyrek","Yarı","Final"];
            // Kullanıcının son KO maçı ve elendi mi?
            const lastUserKO=koResults.length>0?koResults[koResults.length-1]:null;
            const userEliminated=lastUserKO&&lastUserKO.r==="L";
            const userEliminatedRound=userEliminated?KO_ROUND_ORDER.findIndex(r=>lastUserKO.round?.includes(r)):-1;
            // Kullanıcıyı eleyen takım
            const _survivorOfUserRound=userEliminated?lastUserKO.opp:null;
            // Gruptan çıkan 16 takımı belirle: her gruptan ilk 2 (groups state'den)
            const _q16fromGroups=(()=>{
              if(!groups) return [];
              const q=[];
              Object.values(groups).forEach(grpTeams=>{
                const sorted=[...grpTeams].sort((a,b)=>
                  b.pts-a.pts||
                  ((b.gf||0)-(b.ga||0))-((a.gf||0)-(a.ga||0))||
                  (b.gf||0)-(a.gf||0)||
                  (a.ga||0)-(b.ga||0)||
                  (b.w||0)-(a.w||0)
                );
                if(sorted[0]) q.push(sorted[0].me?clubName:sorted[0].n);
                if(sorted[1]&&sorted[1].n!==sorted[0].n) q.push(sorted[1].me?clubName:sorted[1].n);
              });
              return q;
            })();
            // Son 16 bracket: _q16'yı çiftlere böl, deterministik kazananlar seç
            const _bracketRound=(pool,rndId)=>{
              const res=[];
              const winners=[];
              for(let i=0;i+1<pool.length;i+=2){
                const a=pool[i],b=pool[i+1];
                const h=_koSeedFn(a,b,rndId);
                const aWins=h%2===0;
                const winG=1+(h%3);
                const loseG=winG>1?((h*13)%winG):0;
                const ga=aWins?winG:loseG;
                const gb=aWins?loseG:winG;
                res.push({a,b,w:aWins?a:b,l:aWins?b:a,ga,gb});
                winners.push(aWins?a:b);
              }
              return{matches:res,winners};
            };
            // Son 16 kura: aynı gruptan çıkanlar karşılaşamaz
            // q16 = [A1,A2, B1,B2, ...] → pot1=birincilar(çift idx), pot2=ikinciler(tek idx)
            const _drawS16NoSameGroup=(q,seedStr)=>{
              if(q.length<16) return _bracketRound(q,seedStr);
              const pot1=q.filter((_,i)=>i%2===0); // grup birinceleri
              const pot2=q.filter((_,i)=>i%2===1); // grup ikincileri
              const hh=(a,b,r)=>{let h=5381;const s=a+b+r;for(let i=0;i<s.length;i++)h=((h<<5)+h)+s.charCodeAt(i);return Math.abs(h);};
              const used=new Array(pot2.length).fill(false);
              const pairs=[];
              for(let i=0;i<pot1.length;i++){
                const a=pot1[i];
                // Aynı grup değil (j!==i) ve henüz eşleşmemiş
                const cands=pot2.map((b,j)=>({b,j})).filter(({j})=>j!==i&&!used[j]);
                const pick=cands.length>0
                  ?cands[hh(a,seedStr,"p")%cands.length]
                  :pot2.map((b,j)=>({b,j})).find(({j})=>!used[j]);
                if(!pick) continue;
                used[pick.j]=true;
                const h2=hh(a,pick.b,seedStr);
                const aw=h2%2===0;const wg=1+(h2%3);const lg=wg>1?((h2*13)%wg):0;
                pairs.push({a,b:pick.b,w:aw?a:pick.b,l:aw?pick.b:a,ga:aw?wg:lg,gb:aw?lg:wg});
              }
              return{matches:pairs,winners:pairs.map(p=>p.w)};
            };
            // Tüm 4 turu önceden simüle et (deterministik — seed değişmez)
            const _r16=_drawS16NoSameGroup(_q16fromGroups,"s16");
            const _rqf=_bracketRound(_r16.winners,"qf");
            const _rsf=_bracketRound(_rqf.winners,"sf");
            const _rfin=_bracketRound(_rsf.winners,"fin");
            const _allSimRounds=[
              {label:roundLabels[0],id:roundIds[0],data:_r16},
              {label:roundLabels[1],id:roundIds[1],data:_rqf},
              {label:roundLabels[2],id:roundIds[2],data:_rsf},
              {label:roundLabels[3],id:roundIds[3],data:_rfin},
            ];
            // Takvim fazı: hangi KO turuna kadar oynanmış?
            const _MONTH_KO=["Temmuz","Agustos","Eylul","Ekim","Kasim","Aralik","Ocak","Subat","Mart","Nisan","Mayis","Haziran"];
            const _latestMKO=(season.results||[]).reduce((mx,r)=>Math.max(mx,_MONTH_KO.indexOf(r.month||"")),-1);
            const _subatKO=_MONTH_KO.indexOf("Subat");
            const _martKO=_MONTH_KO.indexOf("Mart");
            const _nisanKO=_MONTH_KO.indexOf("Nisan");
            const _mayisKO=_MONTH_KO.indexOf("Mayis");
            const _seasonEndedKO=!(season.fixture||[]).some(f=>!["ZTK","CL","UEFA","HAZ","SUPERKUPA"].includes(f.comp))&&(season.played||0)>5;
            // Kaç KO turu gösterilsin?
            const _koTursGoster=(()=>{
              if(_latestMKO<_subatKO) return 0;
              if(_latestMKO<=_martKO) return 1;   // Şubat-Mart: Son 16
              if(_latestMKO===_nisanKO) return 2;  // Nisan: ÇF
              if(_latestMKO===_mayisKO&&!_seasonEndedKO) return 3;  // Mayıs: YF
              if(_latestMKO===_mayisKO&&_seasonEndedKO) return 4;   // Mayıs sonu: Final
              if(_seasonEndedKO) return 4;
              return 0;
            })();
            // Kullanıcı elendikten sonra kalan turları simüle et
            const _simRounds=(()=>{
              if(!userEliminated) return [];
              const startRndIdx=userEliminatedRound+1;
              return _allSimRounds.slice(startRndIdx,_koTursGoster);
            })();
            return(<>
              {allRounds.map(rnd=>{
              const rResults=koResults.filter(r=>r.round?.startsWith(rnd));
              const rFix=koFix.filter(f=>f.round?.startsWith(rnd));
              const played=rResults.length>0;
              const upcoming=rFix.length>0;
              return(
                <div key={rnd} style={{marginBottom:10,padding:"10px 12px",
                  background:`rgba(${accentRgb},.06)`,border:`1px solid rgba(${accentRgb},.2)`,borderRadius:8}}>
                  <div style={{fontSize:".54rem",fontWeight:700,color:accentCol,marginBottom:6,letterSpacing:1}}>
                    {rnd.includes("Son 16")?"🔟 Son 16":rnd.includes("Çeyrek")?"🏅 Çeyrek Final":rnd.includes("Yarı")?"🥈 Yarı Final":"🏆 Final"}
                  </div>
                  {rResults.map((r,i)=>(
                    <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",
                      padding:"4px 6px",background:"rgba(0,0,0,.2)",borderRadius:4,marginBottom:3,fontSize:".52rem"}}>
                      <span style={{color:C.wh,fontWeight:600,display:"flex",alignItems:"center",gap:4}}><TeamBadge name={clubName} size="sm"/>{clubName}</span>
                      <span style={{color:r.r==="W"?C.grn2:r.r==="L"?C.red2:C.gd,fontWeight:800,margin:"0 8px"}}>{r.myG}-{r.opG}</span>
                      <span style={{color:C.dim,display:"flex",alignItems:"center",gap:4}}><TeamBadge name={r.opp} size="sm"/>{r.opp}</span>
                    </div>
                  ))}
                  {rFix.map((f,i)=>(
                    <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",
                      padding:"4px 6px",background:"rgba(0,0,0,.1)",borderRadius:4,marginBottom:3,fontSize:".5rem",
                      border:`1px dashed rgba(${accentRgb},.3)`}}>
                      <span style={{color:C.wh}}>{clubName}</span>
                      <span style={{color:accentCol,margin:"0 8px",fontWeight:700}}>vs</span>
                      <span style={{color:C.dim,display:"flex",alignItems:"center",gap:4}}><TeamBadge name={f.opp} size="sm"/>{f.opp} · {f.month}</span>
                    </div>
                  ))}
                </div>
              );
            })}
            {/* Kullanıcı elendikten sonra turnuva simülasyonu — gerçek grup sıralamalarından */}
            {_simRounds.length>0&&(
              <div style={{marginBottom:10,padding:"8px 10px",background:"rgba(30,30,50,.5)",border:`1px solid rgba(${accentRgb},.15)`,borderRadius:8}}>
                <div style={{fontSize:".46rem",color:C.dmr,marginBottom:6,letterSpacing:1,textTransform:"uppercase"}}>
                  📡 Turnuva Devam Ediyor — Simülasyon
                </div>
                {_simRounds.map((sr,sri)=>{
                  const isFinal=sr.id==="Final";
                  const champ=isFinal&&sr.data.winners[0]?sr.data.winners[0]:null;
                  return(
                    <div key={sri} style={{marginBottom:6,border:`1px solid rgba(${accentRgb},.22)`,borderRadius:6,overflow:"hidden"}}>
                      <div style={{padding:"4px 8px",background:`rgba(${accentRgb},.15)`,fontSize:".5rem",fontWeight:700,color:accentCol}}>
                        {sr.id.includes("Son 16")?"🔟":sr.id.includes("Çeyrek")?"🏅":sr.id.includes("Yarı")?"🥈":"🏆"} {sr.label.toUpperCase()}
                      </div>
                      {sr.data.matches.map((m,mi)=>(
                        <div key={mi} style={{display:"grid",gridTemplateColumns:"1fr 36px 1fr",alignItems:"center",padding:"4px 6px",borderBottom:mi<sr.data.matches.length-1?"1px solid rgba(255,255,255,.05)":"none",background:mi%2===0?"rgba(0,0,0,.15)":"rgba(0,0,0,.05)"}}>
                          <div style={{display:"flex",alignItems:"center",gap:3,overflow:"hidden"}}>
                            <span style={{fontSize:".36rem",flexShrink:0}}>{m.w===m.a?"✅":"❌"}</span>
                            <span style={{fontSize:".44rem",fontWeight:m.w===m.a?700:400,color:m.w===m.a?"#fff":"rgba(255,255,255,.3)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",textDecoration:m.w===m.a?"none":"line-through"}}>{m.a}</span>
                          </div>
                          <div style={{textAlign:"center"}}>
                            <span style={{fontSize:".44rem",fontWeight:800,color:accentCol,background:`rgba(${accentRgb},.2)`,borderRadius:4,padding:"1px 4px",display:"inline-block"}}>{m.ga}–{m.gb}</span>
                          </div>
                          <div style={{display:"flex",alignItems:"center",gap:3,justifyContent:"flex-end",overflow:"hidden"}}>
                            <span style={{fontSize:".44rem",fontWeight:m.w===m.b?700:400,color:m.w===m.b?"#fff":"rgba(255,255,255,.3)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",textAlign:"right",textDecoration:m.w===m.b?"none":"line-through"}}>{m.b}</span>
                            <span style={{fontSize:".36rem",flexShrink:0}}>{m.w===m.b?"✅":"❌"}</span>
                          </div>
                        </div>
                      ))}
                      {champ&&(
                        <div style={{padding:"6px",background:`rgba(${accentRgb},.18)`,textAlign:"center",fontSize:".54rem",fontWeight:800,color:accentCol}}>
                          🏆 ŞAMPİYON: {champ}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            {/* Gol & Asist Krallığı — KO aşaması */}
            {(()=>{
              const koResults2=season.results.filter(r=>r.comp===selTab&&r.round&&!r.round.startsWith("Grup"));
              const accentColGK=selTab==="CL"?"#ffd060":"#e67e22";
              const accentRgbGK=selTab==="CL"?"232,184,58":"230,126,34";
              // KO maçı oynanmadıysa grup GK/AK göster
              if(koResults2.length===0){
                const grpResults=(season.results||[]).filter(r=>r.comp===selTab&&r.round&&r.round.startsWith("Grup"));
                if(grpResults.length===0) return null;
                const allGroupTeamsD=Object.values(groups||{}).flat();
                if(allGroupTeamsD.length===0) return null;
                let grpPlayers=[];
                allGroupTeamsD.forEach(t=>{
                  const tn=t.n||t;
                  if(t.me){
                    const gc={},ac={};
                    grpResults.forEach(r=>{
                      (r.scorers||[]).forEach(n=>{if(typeof n==="string") gc[n]=(gc[n]||0)+1;});
                      (r.assisters||[]).forEach(n=>{if(typeof n==="string") ac[n]=(ac[n]||0)+1;});
                    });
                    Object.entries(gc).forEach(([n,g])=>grpPlayers.push({n,team:clubName,g,a:ac[n]||0,me:true}));
                    Object.entries(ac).forEach(([n,a])=>{if(!gc[n]) grpPlayers.push({n,team:clubName,g:0,a,me:true});});
                  } else {
                    getTeamEuroScorers(tn,t.gf||0,db||undefined).forEach(s=>grpPlayers.push({n:s.n,team:tn,g:s.g,a:s.a,me:false}));
                  }
                });
                const tG=[...grpPlayers].sort((a,b)=>b.g-a.g).filter(p=>p.g>0).slice(0,5);
                const tA=[...grpPlayers].sort((a,b)=>b.a-a.a).filter(p=>p.a>0).slice(0,5);
                if(tG.length===0) return null;
                return(
                  <div style={{marginTop:8,border:`1px solid rgba(${accentRgbGK},.3)`,borderRadius:8,overflow:"hidden",marginBottom:8}}>
                    <div style={{padding:"5px 10px",background:`rgba(${accentRgbGK},.12)`,fontSize:".5rem",fontWeight:700,color:accentColGK,letterSpacing:1}}>
                      {selTab==="CL"?"⭐":"🇪🇺"} GOL & ASİST KRALLARI
                    </div>
                    <div style={{display:"flex",gap:0}}>
                      <div style={{flex:1,borderRight:"1px solid rgba(77,166,255,0.1)"}}>
                        <div style={{padding:"3px 8px",fontSize:".42rem",fontWeight:700,color:C.grn2,letterSpacing:1,background:"rgba(39,174,96,.07)",borderBottom:"1px solid rgba(39,174,96,.15)"}}>⚽ GOL KRALLARI</div>
                        {tG.map((p,i)=>(<div key={i} style={{display:"flex",alignItems:"center",gap:4,padding:"3px 8px",borderBottom:i<4?"1px solid rgba(45,143,255,0.06)":"none"}}>
                          <span style={{fontSize:".44rem",color:i===0?C.gd:C.dim,fontWeight:700,minWidth:10}}>{i+1}</span>
                          <span style={{flex:1,fontSize:".5rem",color:p.me?C.ac2:C.wh,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontWeight:p.me?700:400}}>{p.n}</span>
                          <span style={{fontSize:".42rem",color:C.dmr,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:55}}>{p.team}</span>
                          <span style={{fontSize:".6rem",fontWeight:800,color:i===0?C.grn2:C.wh,minWidth:16,textAlign:"right"}}>{p.g}</span>
                        </div>))}
                      </div>
                      <div style={{flex:1}}>
                        <div style={{padding:"3px 8px",fontSize:".42rem",fontWeight:700,color:"#a78bfa",letterSpacing:1,background:"rgba(142,68,173,.07)",borderBottom:"1px solid rgba(142,68,173,.15)"}}>🎯 ASİST KRALLARI</div>
                        {tA.map((p,i)=>(<div key={i} style={{display:"flex",alignItems:"center",gap:4,padding:"3px 8px",borderBottom:i<4?"1px solid rgba(45,143,255,0.06)":"none"}}>
                          <span style={{fontSize:".44rem",color:i===0?C.gd:C.dim,fontWeight:700,minWidth:10}}>{i+1}</span>
                          <span style={{flex:1,fontSize:".5rem",color:p.me?C.ac2:C.wh,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontWeight:p.me?700:400}}>{p.n}</span>
                          <span style={{fontSize:".42rem",color:C.dmr,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:55}}>{p.team}</span>
                          <span style={{fontSize:".6rem",fontWeight:800,color:i===0?"#a78bfa":C.wh,minWidth:16,textAlign:"right"}}>{p.a}</span>
                        </div>))}
                      </div>
                    </div>
                  </div>
                );
              }
              const played2=koResults2.length;
              if(played2===0) return null;
              // Birikimli GK/AK: simüle grup verisi (tüm takımlar) + gerçek KO maçları
              let allPlayers=[];
              // 1. Tüm grup takımlarının simüle golleri (allSimPlayers benzeri)
              const allGroupTeamsKO=Object.values(groups||{}).flat();
              allGroupTeamsKO.forEach(t=>{
                const tn=t.n||t;
                if(t.me){
                  // Kullanıcı: gerçek grup scorers
                  const grpR=(season.results||[]).filter(r=>r.comp===selTab&&r.round&&r.round.startsWith("Grup"));
                  const gc={},ac={};
                  grpR.forEach(r=>{
                    (r.scorers||[]).forEach(n=>{if(typeof n==="string") gc[n]=(gc[n]||0)+1;});
                    (r.assisters||[]).forEach(n=>{if(typeof n==="string") ac[n]=(ac[n]||0)+1;});
                  });
                  Object.entries(gc).forEach(([n,g])=>allPlayers.push({n,team:clubName,g,a:ac[n]||0,me:true}));
                  Object.entries(ac).forEach(([n,a])=>{if(!gc[n]) allPlayers.push({n,team:clubName,g:0,a,me:true});});
                } else {
                  getTeamEuroScorers(tn,t.gf||0,db||undefined).forEach(s=>{
                    const ex=allPlayers.find(p=>p.n===s.n&&p.team===tn);
                    if(ex){ex.g+=s.g;ex.a+=s.a;} else allPlayers.push({n:s.n,team:tn,g:s.g,a:s.a,me:false});
                  });
                }
              });
              // 2. Gerçek KO maçları — kullanıcı scorers ekle, rakip opG ekle
              koResults2.forEach(r=>{
                (r.scorers||[]).forEach(n=>{
                  if(typeof n!=="string") return;
                  const ex=allPlayers.find(p=>p.n===n&&p.team===clubName);
                  if(ex) ex.g+=1; else allPlayers.push({n,team:clubName,g:1,a:0,me:true});
                });
                (r.assisters||[]).forEach(n=>{
                  if(typeof n!=="string") return;
                  const ex=allPlayers.find(p=>p.n===n&&p.team===clubName);
                  if(ex) ex.a+=1; else allPlayers.push({n,team:clubName,g:0,a:1,me:true});
                });
                // Rakip KO gollerini de ekle
                const koGf=r.opG||0;
                if(koGf>0){
                  const ex=allPlayers.find(p=>p.team===r.opp);
                  if(ex) ex.g+=koGf;
                  else getTeamEuroScorers(r.opp,koGf,db||undefined).forEach(s=>{
                    const ex2=allPlayers.find(p=>p.n===s.n&&p.team===r.opp);
                    if(ex2){ex2.g+=s.g;ex2.a+=s.a;} else allPlayers.push({n:s.n,team:r.opp,g:s.g,a:s.a,me:false});
                  });
                }
              });
              const topG=[...allPlayers].sort((a,b)=>b.g-a.g).filter(p=>p.g>0).slice(0,5);
              const topA=[...allPlayers].sort((a,b)=>b.a-a.a).filter(p=>p.a>0).slice(0,5);
              if(topG.length===0) return null;
              return(
                <div style={{marginTop:8,border:`1px solid rgba(${accentRgb},.3)`,borderRadius:8,overflow:"hidden",marginBottom:8}}>
                  <div style={{padding:"5px 10px",background:`rgba(${accentRgb},.12)`,fontSize:".5rem",fontWeight:700,color:accentCol,letterSpacing:1}}>
                    {selTab==="CL"?"⭐":"🇪🇺"} GOL & ASİST KRALLARI
                  </div>
                  <div style={{display:"flex",gap:0}}>
                    <div style={{flex:1,borderRight:"1px solid rgba(77,166,255,0.1)"}}>
                      <div style={{padding:"3px 8px",fontSize:".42rem",fontWeight:700,color:C.grn2,letterSpacing:1,background:"rgba(39,174,96,.07)",borderBottom:"1px solid rgba(39,174,96,.15)"}}>⚽ GOL KRALLARI</div>
                      {topG.map((p,i)=>(
                        <div key={i} style={{display:"flex",alignItems:"center",gap:4,padding:"3px 8px",borderBottom:i<4?"1px solid rgba(45,143,255,0.06)":"none"}}>
                          <span style={{fontSize:".44rem",color:i===0?C.gd:C.dim,fontWeight:700,minWidth:10}}>{i+1}</span>
                          <span style={{flex:1,fontSize:".5rem",color:p.me?C.ac2:C.wh,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontWeight:p.me?700:400}}>{p.n}</span>
                          <span style={{fontSize:".42rem",color:C.dmr,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:55}}>{p.team}</span>
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
                          <span style={{fontSize:".42rem",color:C.dmr,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:55}}>{p.team}</span>
                          <span style={{fontSize:".6rem",fontWeight:800,color:i===0?"#a78bfa":C.wh,minWidth:16,textAlign:"right"}}>{p.a}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}
            {/* Prim Tablosu */}
            <div style={{marginTop:4,border:`1px solid rgba(${accentRgb},.3)`,borderRadius:8,overflow:"hidden"}}>
              <div style={{padding:"5px 10px",background:`rgba(${accentRgb},.12)`,display:"flex",alignItems:"center",gap:6}}>
                <span style={{fontSize:".85rem"}}>💰</span>
                <div>
                  <div style={{fontSize:".6rem",fontWeight:700,color:accentCol}}>{selTab==="CL"?"Avrupa Şampiyonlar Kupası":"Avrupa Ligi"} Prim Tablosu</div>
                  <div style={{fontSize:".44rem",color:C.dmr}}>Her tur geçişinde otomatik eklenir</div>
                </div>
              </div>
              {primData.map((p,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"4px 10px",
                  borderBottom:i<primData.length-1?`1px solid rgba(77,166,255,0.1)`:"none",
                  background:i%2===0?"rgba(255,255,255,.02)":""}}>
                  <span style={{fontSize:".7rem",minWidth:18}}>{p.icon}</span>
                  <span style={{flex:1,fontSize:".56rem",color:C.dim}}>{p.label}</span>
                  <span style={{fontSize:".62rem",fontWeight:700,color:"#ffd060"}}>{p.val}</span>
                </div>
              ))}
            </div>
            </>);
          })()}
        </div>
      ):(selTab==="CL"||selTab==="UEFA")&&!groups?(
        <div style={{flex:1,overflowY:"auto",padding:"8px 8px 12px"}}>
          {(()=>{
            const isCL=selTab==="CL";
            const accentCol=isCL?"#ffd060":"#e67e22";
            const accentRgb=isCL?"232,184,58":"230,126,34";
            const CL_SIM_TEAMS=[
              ["Real Madreno","Bayern FC","FC Internazionale","Juventus FC"],
              ["Galatasaray FC","Sporting CP","Leverkusen FC","Atletico Madreno"],
              ["PSV Eindhoven","FC Porto","Villareal CF","RSC Anderlecht"],
              ["Eastfield City","Paris SG","AFC Ajax","SS Lazione"],
              ["Northon City","Mersey Reds","SL Benfica","Shakhtar"],
              ["FC Cataluña","Dortmund BV","Feyenoord","Celtic FC"],
              ["Westbridge FC","SSC Partenopei","Sevilia FC","SC Braga"],
              ["AC Milanese","Leipzig RB","Gladbach FC","Real Sociedad"],
            ];
            const AL_SIM_TEAMS=[
              ["AS Romasso","Stade Rennais","İskoç Mavi FC","Ferencvaros"],
              ["OL Lyon","Frankfurt EFC","East Hammers","Slavia Praha"],
              ["OM Marseille","Stuttgart VfB","Boavista","OGC Nice"],
              ["Atalanta BC B","Brest","Eintracht","RC Lens"],
              ["Fenerbahce FC","Trabzonspor FC","Bodo Glimt","Molde"],
              ["Bologna FC","Wolfsburg FC","AZ Alkmaar","Genk"],
              ["Gil Vicente","Qarabag","Union SG","Djurgarden"],
              ["Sturm Graz","Omonoia","Vitoria SC","Helsinki"],
            ];
            const simTeams=isCL?CL_SIM_TEAMS:AL_SIM_TEAMS;
            const groupNames="ABCDEFGH".split("");
            // Kura çekildi mi? — Eylül ayına girilmiş mi kontrol et
            // (kullanıcının oynadığı maçların aylarına bak)
            const MONTH_ORDER_E=["Temmuz","Agustos","Eylul","Ekim","Kasim","Aralik","Ocak","Subat","Mart","Nisan","Mayis","Haziran"];
            const playedMonths=(season.results||[]).map(r=>r.month||"");
            const latestMonthIdx=playedMonths.reduce((mx,m)=>Math.max(mx,MONTH_ORDER_E.indexOf(m)),-1);
            const eylulIdx=MONTH_ORDER_E.indexOf("Eylul");
            // Kura Eylül'de çekilir — Eylül'e girilmeden gruplar oluşmaz
            const kuraCekildi=latestMonthIdx>=eylulIdx;
            // Kullanıcının bu kupada kaç grup maçı oynadığını doğrudan results'tan say
            // (gruptan elenmiş olsa bile sayı sıfırlanmamalı)
            const clGroupPlayed2=(season.results||[]).filter(r=>r.comp==="CL"&&r.round&&r.round.startsWith("Grup")).length;
            const uefaGroupPlayed2=(season.results||[]).filter(r=>r.comp==="UEFA"&&r.round&&r.round.startsWith("Grup")).length;
            // Bu sekme CL mi UEFA mı?
            const thisComp=isCL?"CL":"UEFA";
            // Kullanıcının bu sekmede oynadığı maç sayısı (elense de korunur)
            const userGroupPlayed=isCL?clGroupPlayed2:uefaGroupPlayed2;
            // Kullanıcı bu kupada hiç oynamadıysa: fixture hafta numarasına göre hesapla
            const ekimIdx2=MONTH_ORDER_E.indexOf("Ekim");
            const subatIdx2=MONTH_ORDER_E.indexOf("Subat");
            const aralikIdx2=MONTH_ORDER_E.indexOf("Aralik");
            const kasimIdx2=MONTH_ORDER_E.indexOf("Kasim");
            // Son oynanan maçın fikstür w değeri — MD_W ile karşılaştırmak için doğru değer bu
            const big38Lg=["İngiliz Ligi","İspanyol Ligi","İtalyan Ligi"].includes(myLg);
            // MD takvimi sabit eşikler: her MD için (ay, o_ayda_min_lig_maci) tablosu
            const monthBasedPlayed=(()=>{
              const MO_L=["Temmuz","Agustos","Eylul","Ekim","Kasim","Aralik","Ocak","Subat","Mart","Nisan","Mayis","Haziran"];
              const EXCL_L=["CL","UEFA","ZTK","HAZ","SUPERKUPA"];
              const MD_SCHED_L=[["Eylul",1],["Ekim",1],["Ekim",2],["Kasim",1],["Kasim",2],["Aralik",1]];
              const eylulI=MO_L.indexOf("Eylul");
              if(latestMonthIdx<eylulI) return 0;
              const _res=season.results||[];
              const ligPlayed={};
              _res.forEach(r=>{if(!EXCL_L.includes(r.comp)&&r.month){ligPlayed[r.month]=(ligPlayed[r.month]||0)+1;}});
              let count=0;
              for(const [ay,threshold] of MD_SCHED_L){
                const ayI=MO_L.indexOf(ay);
                if(ayI>latestMonthIdx) break;
                if((ligPlayed[ay]||0)>=threshold) count++;
              }
              return Math.min(6,count);
            })();
            // KO aşaması: gerçek fikstüre uygun
            const nisanIdx2=MONTH_ORDER_E.indexOf("Nisan");
            const mayisIdx2=MONTH_ORDER_E.indexOf("Mayis");
            // Sezon sonu kontrolü (hafta 38 = sezon bitti = Final oynandı)
            const seasonEnded=(()=>{
              const _LE=["CL","UEFA","ZTK","HAZ","SUPERKUPA"];
              const hasLigLeft=(season.fixture||[]).some(f=>!_LE.includes(f.comp));
              return !hasLigLeft&&(season.played||0)>5;
            })();
            const koPhase2=(()=>{
              if(latestMonthIdx<subatIdx2) return 0;
              const _EXCL_KO=["CL","UEFA","ZTK","HAZ","SUPERKUPA"];
              const ligPlayedCount=(season.results||[]).filter(r=>!_EXCL_KO.includes(r.comp)).length;
              const realKoPlayed=(season.results||[]).filter(r=>
                r.comp===thisComp&&r.round&&!r.round.startsWith("Grup")
              ).length;
              // Kullanıcının gerçek KO turlarına göre minimum değer
              let ko_base=0;
              if(realKoPlayed>=7)      ko_base=8;
              else if(realKoPlayed>=6) ko_base=6;
              else if(realKoPlayed>=4) ko_base=4;
              else if(realKoPlayed>=2) ko_base=2;
              else if(realKoPlayed>=1) ko_base=2;
              // Lig ilerlemesine göre simüle turlar (kullanıcı elenmiş olsa da devam eder)
              const is38b=["İngiliz Ligi","İspanyol Ligi","İtalyan Ligi"].includes(myLg);
              const yf1Ew=is38b?35:30;
              const finEw=is38b?38:34;
              let lig_base=0;
              if(seasonEnded||ligPlayedCount>finEw) lig_base=8;
              else if(ligPlayedCount>yf1Ew)          lig_base=6;
              else if(latestMonthIdx>=nisanIdx2)      lig_base=4;
              else if(latestMonthIdx>=subatIdx2)      lig_base=2;
              // İkisinin maksimumu: gerçek oynanan turları göster + simüle devam
              return Math.max(ko_base, lig_base);
            })();
            // Grup: kullanıcı bu kupada oynadıysa kendi maçlarını kullan; hiç oynamadıysa ay bazlı
            const groupPlayed=userGroupPlayed>0?userGroupPlayed:monthBasedPlayed;
            const playedAfterEylul=kuraCekildi?groupPlayed:0;
            const played=Math.min(6,playedAfterEylul);
            // KO simülasyonu için ayrı sayaç (ay bazlı, kullanıcı katılımından bağımsız)
            const koSimPlayed=kuraCekildi?Math.min(6,monthBasedPlayed)+koPhase2:0;
            // Tüm takımların oyuncu listesi (gol/asist için)
            let allSimPlayers=[];
            // Grup tabloları — canlı veri varsa onu kullan, yoksa simüle et
            const liveGroupData=isCL?season.clGroups:season.uefaGroups;
            const groupTables=liveGroupData&&Object.keys(liveGroupData).length>0
              ? Object.entries(liveGroupData).map(([grpName,teams])=>({
                  name:grpName,
                  teams:[...teams].sort((a,b)=>b.pts-a.pts||(b.gf-b.ga)-(a.gf-a.ga))
                }))
              : simTeams.map((grpTeams,gi)=>{
              const teamStats=grpTeams.map((tn,ti)=>{
                let w=0,d=0,l=0,gf=0,ga=0;
                for(let match=0;match<played;match++){
                  const seed=((tn.charCodeAt(0)*31+match*17+ti*7+gi*3)>>>0)%100;
                  if(seed<40){w++;gf+=2;ga+=seed%2;}
                  else if(seed<65){d++;gf+=1;ga+=1;}
                  else{l++;ga+=2;gf+=seed%2;}
                }
                // Oyuncuları da üret — DB'den gerçek oyuncular, pozisyona göre dağıt
                if(played>0&&!allSimPlayers.some(x=>x.team===tn)){
                  const teamScorers=getTeamEuroScorers(tn,gf,db||undefined);
                  teamScorers.forEach(s=>allSimPlayers.push({n:s.n,team:tn,g:s.g,a:s.a}));
                }
                return{n:tn,w,d,l,gf,ga,pts:w*3+d};
              }).sort((a,b)=>b.pts-a.pts||(b.gf-b.ga)-(a.gf-a.ga));
              return{name:groupNames[gi],teams:teamStats};
            });
            // liveGroupData varsa grup gf verilerinden GK/AK üret
            if(liveGroupData&&Object.keys(liveGroupData).length>0&&played>0){
              Object.values(liveGroupData).forEach((grp,gi)=>{
                grp.forEach((t,ti)=>{
                  const tn=t.n||"";
                  if(!tn) return;
                  const isMe=t.me;
                  const teamGf=t.gf||0; // Takımın gerçek/simüle attığı gol
                  if(isMe){
                    // Kullanıcı: gerçek scorers/assisters dizisinden say
                    const euroResults=(season.results||[]).filter(r=>r.comp===thisComp&&r.round&&r.round.startsWith("Grup"));
                    const goalCount={};
                    const assistCount={};
                    euroResults.forEach(r=>{
                      (r.scorers||[]).forEach(n=>{if(typeof n==="string") goalCount[n]=(goalCount[n]||0)+1;});
                      (r.assisters||[]).forEach(n=>{if(typeof n==="string") assistCount[n]=(assistCount[n]||0)+1;});
                    });
                    Object.entries(goalCount).forEach(([n,g])=>{
                      const a=assistCount[n]||0;
                      const existing=allSimPlayers.find(x=>x.n===n);
                      if(existing){existing.g+=g;existing.a+=a;}
                      else allSimPlayers.push({n,team:clubName,g,a,me:true});
                    });
                    Object.entries(assistCount).forEach(([n,a])=>{
                      if(goalCount[n]) return;
                      const existing=allSimPlayers.find(x=>x.n===n);
                      if(existing){existing.a+=a;}
                      else allSimPlayers.push({n,team:clubName,g:0,a,me:true});
                    });
                  } else {
                    // Diğer takımlar: DB'den gerçek oyuncular — zaten eklenmemisse ekle
                    const alreadyAdded=allSimPlayers.some(x=>x.team===tn);
                    if(!alreadyAdded){
                      const teamScorers=getTeamEuroScorers(tn,teamGf,db||undefined);
                      teamScorers.forEach(s=>allSimPlayers.push({n:s.n,team:tn,g:s.g,a:s.a}));
                    }
                  }
                });
              });
            }
            const topG=[...allSimPlayers].sort((a,b)=>b.g-a.g).filter(p=>p.g>0).slice(0,5);
            const topA=[...allSimPlayers].sort((a,b)=>b.a-a.a).filter(p=>p.a>0).slice(0,5);
            // KO turlarındaki gol/asist (koPhase2 > 0 ise ekle — grup bittikten sonra)
            // allKoPlayers: simüle rakipler (sabit 4 tur) + kullanıcının gerçek maçları
            let allKoPlayers=[];
            {
              // allKoPlayers: bracket simulasyonundaki (gosterilen bracket ile ayni) mac sonuclarina gore
              // Her takimin sadece oynadigi turlar kadar gol/asist kazanmasi
              const teamTotals={};
              // KO bracket simulasyonu — _allSimRounds kullanici katilimli dalda tanimli
              // Yoksa ayni seed mantığiyla yerel olarak uret
              const _koHH=(s)=>{let h=5381;for(let i=0;i<s.length;i++)h=((h<<5)+h)+s.charCodeAt(i);return Math.abs(h);};
              const _koBracketRound=(pool,rndId)=>{
                const matches=[];
                for(let i=0;i+1<pool.length;i+=2){
                  const a=pool[i],b=pool[i+1];
                  const h=_koHH(a+b+rndId);
                  const aWins=h%2===0;
                  const wg=1+(h%3); const lg=wg>1?((h*13)%wg):0;
                  matches.push({a,b,w:aWins?a:b,l:aWins?b:a,ga:aWins?wg:lg,gb:aWins?lg:wg});
                }
                return{matches,winners:matches.map(m=>m.w)};
              };
              const _safeSimRounds=(()=>{
                if(typeof _allSimRounds!=="undefined") return _allSimRounds;
                // Yerel uret — groupTables'tan q16 al
                const _q16local=[];
                groupTables.forEach(g=>{if(g.teams[0])_q16local.push(g.teams[0].n);if(g.teams[1]&&g.teams[1].n!==g.teams[0]?.n)_q16local.push(g.teams[1].n);});
                const _lr16=_koBracketRound(_q16local,"s16");
                const _lqf=_koBracketRound(_lr16.winners,"qf");
                const _lsf=_koBracketRound(_lqf.winners,"sf");
                const _lfin=_koBracketRound(_lsf.winners,"fin");
                return[{data:_lr16},{data:_lqf},{data:_lsf},{data:_lfin}];
              })();
              const koTursToSim2=koPhase2>=8?4:koPhase2>=6?3:koPhase2>=4?2:koPhase2>=2?1:0;
              _safeSimRounds.slice(0,koTursToSim2).forEach((rnd,ri)=>{
                (rnd.data.matches||[]).forEach(({a,b,ga,gb})=>{
                  [a,b].forEach((tn,ti)=>{
                    if(!tn||tn===clubName) return;
                    const g=ti===0?ga:gb;
                    const ass=Math.round(g*0.7);
                    if(!teamTotals[tn]) teamTotals[tn]={g:0,a:0};
                    teamTotals[tn].g+=g;
                    teamTotals[tn].a+=ass;
                  });
                });
              });
              Object.entries(teamTotals).forEach(([tn,tot])=>{
                getTeamEuroScorers(tn,tot.g,db||undefined).forEach(s=>
                  allKoPlayers.push({n:s.n,team:tn,g:s.g,a:s.a})
                );
              });
              // Kullanıcının gerçek KO golleri: tüm results — döngü yok, direkt filtre
              const userKoMatches=(season.results||[]).filter(r=>r.comp===thisComp&&r.round&&!r.round.startsWith("Grup"));
              userKoMatches.forEach(r=>{
                (r.scorers||[]).forEach(name=>{
                  if(typeof name!=="string") return;
                  const ex=allKoPlayers.find(p=>p.n===name&&p.team===clubName);
                  if(ex) ex.g+=1; else allKoPlayers.push({n:name,team:clubName,g:1,a:0,me:true});
                });
                (r.assisters||[]).forEach(name=>{
                  if(typeof name!=="string") return;
                  const ex=allKoPlayers.find(p=>p.n===name&&p.team===clubName);
                  if(ex) ex.a+=1; else allKoPlayers.push({n:name,team:clubName,g:0,a:1,me:true});
                });
              });
            }
            // GK/AK: grup + KO birleşimi — HER ZAMAN KO oyuncularını ekle
            const allPlayersTotal=[...allSimPlayers];
            const realKoForTotal=(season.results||[]).filter(r=>r.comp===thisComp&&r.round&&!r.round.startsWith("Grup"));
            if(realKoForTotal.length>0){
              // Kullanici KO oynadi: gercek veriyi ekle
              allKoPlayers.filter(kp=>kp.me).forEach(kp=>{
                const existing=allPlayersTotal.find(p=>p.n===kp.n&&p.team===kp.team);
                if(existing){existing.g+=kp.g;existing.a+=kp.a;}
                else allPlayersTotal.push({...kp});
              });
            } else if(koPhase2>0){
              // Kullanici katilimi yok ama KO turu simule edildi: simule KO oyuncularini ekle
              allKoPlayers.forEach(kp=>{
                const existing=allPlayersTotal.find(p=>p.n===kp.n&&p.team===kp.team);
                if(existing){existing.g+=kp.g;existing.a+=kp.a;}
                else allPlayersTotal.push({...kp});
              });
            }
            // Gosterimde her zaman grup+KO birlesimi kullan, duplicate'leri birlestir
            const _mergedFinal={};
            allPlayersTotal.forEach(p=>{
              const key=p.n+"__"+p.team;
              if(_mergedFinal[key]){_mergedFinal[key].g+=p.g;_mergedFinal[key].a+=p.a;}
              else _mergedFinal[key]={...p};
            });
            const _baseForTotal=Object.values(_mergedFinal);
            const topGTotal=[..._baseForTotal].sort((a,b)=>b.g-a.g).filter(p=>p.g>0).slice(0,5);
            const topATotal=[..._baseForTotal].sort((a,b)=>b.a-a.a).filter(p=>p.a>0).slice(0,5);
            // Katılım koşulu
            const LIG_CL_SPOTS2={"İngiliz Ligi":4,"İspanyol Ligi":4,"Alman Ligi":4,"İtalyan Ligi":4,"Fransız Ligi":3,"Elit Lig":2,"Hollanda Ligi":1,"Portekiz Ligi":2};
            const LIG_UEFA_SPOTS2={"İngiliz Ligi":7,"İspanyol Ligi":6,"Alman Ligi":6,"İtalyan Ligi":7,"Fransız Ligi":5,"Elit Lig":4,"Hollanda Ligi":3,"Portekiz Ligi":3};
            const spotCount=isCL?(LIG_CL_SPOTS2[myLg]||0):(LIG_UEFA_SPOTS2[myLg]||0);
            // Kura çekilmedi → sadece bekleniyor mesajı
            if(!kuraCekildi) return(
              <div style={{textAlign:"center",padding:"32px 16px"}}>
                <div style={{fontSize:"2rem",marginBottom:10}}>{isCL?"⭐":"🇪🇺"}</div>
                <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,marginBottom:8}}>
                  <div style={{width:8,height:8,borderRadius:"50%",background:accentCol,animation:"pulse 1.5s infinite"}}/>
                  <div style={{fontSize:".68rem",fontWeight:700,color:accentCol}}>Kura Çekimi Bekleniyor</div>
                </div>
                <div style={{fontSize:".52rem",color:`rgba(${accentRgb},.5)`,marginBottom:4}}>
                  {isCL?"Avrupa Şampiyonlar Kupası":"Avrupa Ligi"} grup kuraları
                </div>
                <div style={{fontSize:".48rem",color:`rgba(${accentRgb},.35)`}}>Eylül ayında gerçekleşecek</div>
              </div>
            );
            return(
              <>
                {/* Başlık + katılım bilgisi */}
                <div style={{display:"flex",alignItems:"center",gap:8,padding:"6px 4px 10px"}}>
                  <span style={{fontSize:"1.2rem"}}>{isCL?"⭐":"🇪🇺"}</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:".62rem",fontWeight:800,color:accentCol}}>{isCL?"AVRUPA ŞAMPİYONLAR KUPASI":"AVRUPA LİGİ"}</div>
                    <div style={{fontSize:".44rem",color:C.dmr}}>Simüle Grup Aşaması · 2025/26</div>
                  </div>
                  {spotCount>0&&(
                    <div style={{padding:"4px 8px",borderRadius:6,fontSize:".42rem",fontWeight:700,
                      background:`rgba(${accentRgb},.1)`,border:`1px solid rgba(${accentRgb},.3)`,color:accentCol,textAlign:"center",lineHeight:1.4}}>
                      İlk {spotCount}'e gir<br/>
                      <span style={{fontWeight:400,color:C.dmr}}>katılmak için</span>
                    </div>
                  )}
                </div>
                {/* Grup tabloları */}
                {groupTables.map(({name,teams})=>(
                  <div key={name} style={{marginBottom:8,border:`1px solid rgba(${accentRgb},.25)`,borderRadius:6,overflow:"hidden"}}>
                    <div style={{padding:"4px 8px",background:`rgba(${accentRgb},.12)`,fontSize:".5rem",fontWeight:700,letterSpacing:2,color:accentCol,textTransform:"uppercase"}}>
                      {isCL?"⭐":"🇪🇺"} GRUP {name}
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"18px minmax(0,1fr) 22px 22px 22px 22px 38px 26px",
                      padding:"3px 8px",fontSize:".42rem",color:"rgba(77,168,255,.5)",letterSpacing:1,textTransform:"uppercase",
                      borderBottom:`1px solid rgba(77,168,255,0.1)`,fontWeight:700}}>
                      <span>#</span><span>Takım</span>
                      <span style={{textAlign:"center"}}>O</span><span style={{textAlign:"center"}}>G</span>
                      <span style={{textAlign:"center"}}>B</span><span style={{textAlign:"center"}}>M</span>
                      <span style={{textAlign:"center"}}>Av</span><span style={{textAlign:"center"}}>P</span>
                    </div>
                    {teams.map((t,i)=>(
                      <div key={t.n} style={{display:"grid",gridTemplateColumns:"18px minmax(0,1fr) 22px 22px 22px 22px 38px 26px",
                        padding:"3px 8px",borderBottom:i<3?`1px solid rgba(77,166,255,0.07)`:"none",alignItems:"center",
                        background:i<2?`rgba(${accentRgb},.04)`:""}}>
                        <span style={{fontSize:".5rem",color:i<2?accentCol:C.dim,fontWeight:700}}>{i+1}</span>
                        <span style={{fontSize:".58rem",color:C.wh,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:3}}>
                          <TeamBadge name={t.n} size="sm"/>{t.n}
                        </span>
                        <span style={{textAlign:"center",fontSize:".52rem",color:C.dim}}>{t.w+t.d+t.l}</span>
                        <span style={{textAlign:"center",fontSize:".52rem",color:C.grn2}}>{t.w}</span>
                        <span style={{textAlign:"center",fontSize:".52rem",color:C.gd}}>{t.d}</span>
                        <span style={{textAlign:"center",fontSize:".52rem",color:C.red2}}>{t.l}</span>
                        <span style={{textAlign:"center",fontSize:".48rem",color:C.dim}}>{t.gf-t.ga>0?"+"+(t.gf-t.ga):t.gf-t.ga}</span>
                        <span style={{textAlign:"center",fontSize:".68rem",fontWeight:800,color:i<2?accentCol:C.dim}}>{t.pts}</span>
                      </div>
                    ))}
                    <div style={{padding:"2px 8px",fontSize:".4rem",color:accentCol,background:`rgba(${accentRgb},.05)`}}>▲ İlk 2: Eleme Turu</div>
                  </div>
                ))}
                {/* Gol & Asist Krallığı */}
                {(()=>{
                  // Kullanıcının gerçek KO golleri varsa onları kullan — yoksa grup simülasyonunu göster
                  const realKo=(season.results||[]).filter(r=>r.comp===thisComp&&r.round&&!r.round.startsWith("Grup"));
                  const allTourneyR3=(season.results||[]).filter(r=>r.comp===thisComp&&r.round);
                  let displayTopG, displayTopA;
                  if(realKo.length>0){
                    // KO oynandı: allSimPlayers (tüm grup simülasyonu) üzerine
                    // kullanıcının GERÇEK tüm turnuva (grup+KO) verisini yaz
                    const mergedPlayers=[...allSimPlayers.map(p=>({...p}))];
                    const rgc={},rac={};
                    allTourneyR3.forEach(r=>{
                      (r.scorers||[]).forEach(n=>{if(typeof n==="string") rgc[n]=(rgc[n]||0)+1;});
                      (r.assisters||[]).forEach(n=>{if(typeof n==="string") rac[n]=(rac[n]||0)+1;});
                    });
                    // Kullanıcı oyuncularını merged listeye ekle/güncelle
                    Object.entries(rgc).forEach(([n,g])=>{
                      const ex=mergedPlayers.find(p=>p.n===n&&p.me);
                      if(ex){ex.g=g;ex.a=rac[n]||0;}
                      else mergedPlayers.push({n,team:clubName,g,a:rac[n]||0,me:true});
                    });
                    Object.entries(rac).forEach(([n,a])=>{
                      if(rgc[n]) return;
                      const ex=mergedPlayers.find(p=>p.n===n&&p.me);
                      if(ex){ex.a=a;} else mergedPlayers.push({n,team:clubName,g:0,a,me:true});
                    });
                    // Rakipler: gerçek maçlarda karşılaşılan takımların gol sayısını güncelle
                    const allOppsReal=[...new Set(allTourneyR3.map(r=>r.opp))];
                    allOppsReal.forEach(tn=>{
                      const tot3=allTourneyR3.filter(r=>r.opp===tn).reduce((s,r)=>s+(r.opG||0),0);
                      if(tot3===0) return;
                      const oppScorers=getTeamEuroScorers(tn,tot3,db||undefined);
                      oppScorers.forEach(s=>{
                        const ex=mergedPlayers.find(p=>p.n===s.n&&p.team===tn);
                        if(ex){ex.g+=s.g;ex.a+=s.a;} else mergedPlayers.push({n:s.n,team:tn,g:s.g,a:s.a,me:false});
                      });
                    });
                    displayTopG=[...mergedPlayers].sort((a,b)=>b.g-a.g).filter(p=>p.g>0).slice(0,5);
                    displayTopA=[...mergedPlayers].sort((a,b)=>b.a-a.a).filter(p=>p.a>0).slice(0,5);
                  } else {
                    // KO oynanmadı: simüle grup verisi
                    displayTopG=topGTotal;
                    displayTopA=topATotal;
                  }
                  if(!displayTopG||displayTopG.length===0) return null;
                  return(
                  <div style={{border:`1px solid rgba(${accentRgb},.3)`,borderRadius:8,overflow:"hidden",marginBottom:8}}>
                    <div style={{padding:"5px 10px",background:`rgba(${accentRgb},.12)`,fontSize:".5rem",fontWeight:700,color:accentCol,letterSpacing:1}}>
                      {isCL?"⭐":"🇪🇺"} GOL & ASİST KRALLARI
                    </div>
                    <div style={{display:"flex",gap:0}}>
                      <div style={{flex:1,borderRight:"1px solid rgba(77,166,255,0.1)"}}>
                        <div style={{padding:"3px 8px",fontSize:".42rem",fontWeight:700,color:C.grn2,letterSpacing:1,background:"rgba(39,174,96,.07)",borderBottom:"1px solid rgba(39,174,96,.15)"}}>⚽ GOL KRALLARI</div>
                        {displayTopG.map((p,i)=>(
                          <div key={i} style={{display:"flex",alignItems:"center",gap:4,padding:"3px 8px",borderBottom:i<4?"1px solid rgba(45,143,255,0.06)":"none"}}>
                            <span style={{fontSize:".44rem",color:i===0?C.gd:C.dim,fontWeight:700,minWidth:10}}>{i+1}</span>
                            <span style={{flex:1,fontSize:".5rem",color:p.me?C.ac2:C.wh,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.n}</span>
                            <span style={{fontSize:".42rem",color:C.dmr,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:55}}>{p.team}</span>
                            <span style={{fontSize:".6rem",fontWeight:800,color:i===0?C.grn2:C.wh,minWidth:16,textAlign:"right"}}>{p.g}</span>
                          </div>
                        ))}
                      </div>
                      <div style={{flex:1}}>
                        <div style={{padding:"3px 8px",fontSize:".42rem",fontWeight:700,color:"#a78bfa",letterSpacing:1,background:"rgba(142,68,173,.07)",borderBottom:"1px solid rgba(142,68,173,.15)"}}>🎯 ASİST KRALLARI</div>
                        {displayTopA.map((p,i)=>(
                          <div key={i} style={{display:"flex",alignItems:"center",gap:4,padding:"3px 8px",borderBottom:i<4?"1px solid rgba(45,143,255,0.06)":"none"}}>
                            <span style={{fontSize:".44rem",color:i===0?C.gd:C.dim,fontWeight:700,minWidth:10}}>{i+1}</span>
                            <span style={{flex:1,fontSize:".5rem",color:p.me?C.ac2:C.wh,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.n}</span>
                            <span style={{fontSize:".42rem",color:C.dmr,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:55}}>{p.team}</span>
                            <span style={{fontSize:".6rem",fontWeight:800,color:i===0?"#a78bfa":C.wh,minWidth:16,textAlign:"right"}}>{p.a}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  );
                })()}
                {/* KO Simülasyonu — grup bitti ve Şubat sonrası */}
                {koSimPlayed>=6&&(()=>{
                  const _koSeed=(a,b,r)=>{let h=5381;const s=a+b+r;for(let i=0;i<s.length;i++)h=((h<<5)+h)+s.charCodeAt(i);return Math.abs(h);};

                  // Kullanıcının gerçek KO sonuçları — sadece bu kupanın maçları
                  const realKoResults=(season.results||[]).filter(r=>r.comp===thisComp&&r.round&&!r.round.startsWith("Grup"));
                  const hasRealKo=realKoResults.length>0;

                  // q16: grup tablosundan her gruptan 1. ve 2. takım
                  const liveGroups=isCL?season.clGroups:season.uefaGroups;
                  let q16=[];
                  if(liveGroups&&Object.keys(liveGroups).length>0){
                    Object.values(liveGroups).forEach(grp=>{
                      const sorted=[...grp].sort((a,b)=>
                        b.pts-a.pts||
                        ((b.gf||0)-(b.ga||0))-((a.gf||0)-(a.ga||0))||
                        (b.gf||0)-(a.gf||0)||
                        (a.ga||0)-(b.ga||0)||
                        (b.w||0)-(a.w||0)
                      );
                      if(sorted[0]) q16.push(sorted[0].n);
                      if(sorted[1]&&sorted[1].n!==sorted[0].n) q16.push(sorted[1].n);
                    });
                  } else {
                    groupTables.forEach(g=>{if(g.teams[0])q16.push(g.teams[0].n);if(g.teams[1]&&g.teams[1].n!==g.teams[0].n)q16.push(g.teams[1].n);});
                  }
                  if(hasRealKo&&!q16.includes(clubName)) q16=[...q16.slice(0,15),clubName];

                  // Keyword eşleşme fonksiyonu — ÖNCE tanımlanmalı
                  // "Final" sadece gerçek Final maçlarını yakalar, "Çeyrek Final"/"Yarı Final" değil
                  const roundMatchesKeyword=(round,kw)=>{
                    if(kw==="Final") return round==="Final"||(round.startsWith("Final")&&!round.includes("Çeyrek")&&!round.includes("Yarı"));
                    return round.includes(kw);
                  };

                  // Kullanıcının tur bazında gerçek sonucunu bul
                  const findRealResult=(rndKeyword)=>{
                    const matches=realKoResults.filter(r=>r.round&&roundMatchesKeyword(r.round,rndKeyword));
                    if(matches.length===0) return null;
                    const last=matches[matches.length-1];
                    const myTotal=matches.reduce((s,r)=>s+(r.myG||0),0);
                    const opTotal=matches.reduce((s,r)=>s+(r.opG||0),0);
                    const won=myTotal>opTotal||(myTotal===opTotal&&last.r==="W"&&(last.pen===true||matches.length===1));
                    return {opp:last.opp,won,myG:myTotal,opG:opTotal};
                  };

                  // ── Tur bazlı hibrit bracket ──
                  // Kullanıcı katıldı + oynadı → gerçek sonuç
                  // Kullanıcı elendi → o turdan itibaren gerçek kazananla simüle devam
                  // Kullanıcı katılmadı → tamamen simüle

                  const turKeywords=["Son 16","Çeyrek","Yarı Final","Final"];
                  const turLabels=["🔟 Son 16","🏅 Çeyrek Final","🥈 Yarı Final","🏆 Final"];
                  const turIds=["s16","qf","sf","fin"];

                  // Kaç tur gösterilecek (koPhase2 bazlı — zamana göre)
                  const maxTur=Math.min(4,Math.floor(koPhase2/2));
                  if(maxTur===0) return(
                    <div style={{textAlign:"center",padding:"12px",fontSize:".48rem",color:`rgba(${accentRgb},.5)`}}>
                      ⏳ Son 16 Turu — Şubat ayında başlayacak
                    </div>
                  );

                  // Her turu sırayla inşa et
                  // survivors: o tura giren takımlar (önceki turun kazananları)
                  let survivors=[...q16];
                  // Gerçek rakipleri survivors'a garantile
                  turKeywords.slice(0,maxTur).forEach(kw=>{
                    const rr=findRealResult(kw);
                    if(!rr) return;
                    if(!survivors.includes(clubName)) survivors.push(clubName);
                    if(!survivors.includes(rr.opp)){
                      // Bir simüle takımı çıkar, rakibi ekle (çift sayı koru)
                      const toRemove=survivors.map((n,_i)=>({n,i:_i})).reverse().find(({n})=>n!==clubName&&n!==rr.opp);
                      if(toRemove) survivors.splice(toRemove.i,1);
                      survivors.push(rr.opp);
                    }
                  });

                  const allKoRounds=[];
                  // S16 kura: Pot1 (grup 1.'leri) vs Pot2 (grup 2.'leri), aynı gruptan karşılaşma yok
                  // q16 = [G_A_1, G_A_2, G_B_1, G_B_2, ...] → çift indexler Pot1, tek indexler Pot2
                  const _drawS16=(q,seed)=>{
                    const pot1=q.filter((_,i)=>i%2===0); // Grup 1.'leri
                    const pot2=q.filter((_,i)=>i%2===1); // Grup 2.'leri
                    const used=new Array(pot2.length).fill(false);
                    const pairs=[];
                    const hh=(a,b,r)=>{let h=5381;const s=a+b+r;for(let i=0;i<s.length;i++)h=((h<<5)+h)+s.charCodeAt(i);return Math.abs(h);};
                    for(let i=0;i<pot1.length;i++){
                      const a=pot1[i];
                      // Pot2'den: aynı grup değil (i===j → aynı grup) ve henüz kullanılmamış
                      const cands=pot2.map((b,j)=>({b,j})).filter(({j})=>j!==i&&!used[j]);
                      const pool=cands.length>0?cands:pot2.map((b,j)=>({b,j})).filter(({j})=>!used[j]);
                      if(!pool.length) continue;
                      const pick=pool[hh(a,seed,"s16p")%pool.length];
                      used[pick.j]=true;
                      const h2=hh(a,pick.b,"s16");const aW=h2%2===0;const wG=1+(h2%3);const lG=wG>1?(h2*13)%wG:0;
                      pairs.push({a,b:pick.b,w:aW?a:pick.b,l:aW?pick.b:a,ga:aW?wG:lG,gb:aW?lG:wG});
                    }
                    return pairs;
                  };

                  // Gerçek rakipleri ilk turdan itibaren currentSurvivors'a ekle
                  let currentSurvivors=[...q16];
                  const rr0=findRealResult(turKeywords[0]);
                  if(rr0){
                    if(!currentSurvivors.includes(clubName)) currentSurvivors.push(clubName);
                    if(!currentSurvivors.includes(rr0.opp)){
                      const toRm=currentSurvivors.map((n,_i)=>({n,i:_i})).reverse().find(({n})=>n!==clubName&&n!==rr0.opp);
                      if(toRm) currentSurvivors.splice(toRm.i,1);
                      currentSurvivors.push(rr0.opp);
                    }
                  }

                  for(let ti=0;ti<maxTur;ti++){
                    const kw=turKeywords[ti];
                    const rId=turIds[ti];
                    const realResult=findRealResult(kw);
                    const matches=[];
                    const nextSurvivors=[];
                    const processed=new Set();

                    // S16 turu: Pot1 vs Pot2 kura (aynı gruptan karşılaşma yok)
                    // Sonraki turlar: normal deterministik eşleşme
                    if(ti===0&&!realResult){
                      // Kullanıcı katılmıyor → tamamen simüle S16 kurası
                      const s16Pairs=_drawS16(currentSurvivors,"s16seed");
                      s16Pairs.forEach(m=>{
                        matches.push(m);
                        nextSurvivors.push(m.w);
                        processed.add(m.a);processed.add(m.b);
                      });
                    } else {
                    // Teams listesini hazırla
                    let teams=[...currentSurvivors];
                    if(realResult){
                      // Kullanıcı ve gerçek rakibini listede garantile
                      if(!teams.includes(clubName)) teams.push(clubName);
                      if(!teams.includes(realResult.opp)){
                        // Bir simüle takımı çıkar (çift sayı koru)
                        const toRm=teams.map((n,_i)=>({n,i:_i})).reverse().find(({n})=>n!==clubName&&n!==realResult.opp);
                        if(toRm) teams.splice(toRm.i,1);
                        teams.push(realResult.opp);
                      }
                      // Gerçek çifti (kullanıcı + rakip) listenin BAŞINA taşı
                      teams=teams.filter(n=>n!==clubName&&n!==realResult.opp);
                      teams=[clubName,realResult.opp,...teams];
                    }

                    let i=0;
                    while(i+1<teams.length){
                      const a=teams[i],b=teams[i+1];
                      if(processed.has(a)||processed.has(b)){i+=2;continue;}
                      const meInMatch=(a===clubName||b===clubName);
                      if(meInMatch&&realResult){
                        // Gerçek eşleşme
                        const opp=realResult.opp;
                        const w=realResult.won?clubName:opp;
                        matches.push({a:clubName,b:opp,w,l:realResult.won?opp:clubName,
                          ga:realResult.myG,gb:realResult.opG,real:true});
                        nextSurvivors.push(w);
                        processed.add(clubName);processed.add(opp);
                      } else {
                        // Simüle eşleşme
                        const h=_koSeed(a,b,rId);
                        const aWins=h%2===0;
                        const wG=1+(h%3);const lG=wG>1?(h*13)%wG:0;
                        const w=aWins?a:b;
                        matches.push({a,b,w,l:aWins?b:a,ga:aWins?wG:lG,gb:aWins?lG:wG});
                        nextSurvivors.push(w);
                        processed.add(a);processed.add(b);
                      }
                      i+=2;
                    }
                    } // end else

                    allKoRounds.push({label:turLabels[ti],matches});

                    // Sonraki tur: survivors = bu turun kazananları
                    currentSurvivors=nextSurvivors;
                    // Sonraki turun gerçek rakibini survivors'a ekle
                    if(ti+1<maxTur){
                      const rrNext=findRealResult(turKeywords[ti+1]);
                      if(rrNext){
                        if(!currentSurvivors.includes(clubName)) currentSurvivors.push(clubName);
                        if(!currentSurvivors.includes(rrNext.opp)){
                          const toRm=currentSurvivors.map((n,_i)=>({n,i:_i})).reverse().find(({n})=>n!==clubName&&n!==rrNext.opp);
                          if(toRm) currentSurvivors.splice(toRm.i,1);
                          currentSurvivors.push(rrNext.opp);
                        }
                      }
                    }
                  }

                  const visibleKoRounds=allKoRounds;
                  const lastRound=allKoRounds[allKoRounds.length-1];
                  const champ=allKoRounds.length>=4&&lastRound?.matches[0]?lastRound.matches[0].w:null;
                  if(visibleKoRounds.length===0) return(
                    <div style={{textAlign:"center",padding:"12px",fontSize:".48rem",color:`rgba(${accentRgb},.5)`}}>
                      ⏳ Son 16 Turu — Şubat ayında başlayacak
                    </div>
                  );
                  return(
                    <div style={{marginTop:8}}>
                      <div style={{fontSize:".46rem",color:C.dmr,marginBottom:6,letterSpacing:1,textTransform:"uppercase",textAlign:"center"}}>
                        📡 Eleme Aşaması Simülasyonu
                      </div>
                      {visibleKoRounds.map((kr,kri)=>(
                        <div key={kri} style={{marginBottom:6,padding:"0",background:`rgba(${accentRgb},.04)`,border:`1px solid rgba(${accentRgb},.25)`,borderRadius:6,overflow:"hidden"}}>
                          <div style={{fontSize:".5rem",fontWeight:700,color:accentCol,padding:"4px 8px",background:`rgba(${accentRgb},.15)`,marginBottom:0}}>{kr.label}</div>
                          {kr.matches.map((m,mi)=>{
                            // Kullanıcı takımı her zaman solda göster
                            const flip=m.b===clubName;
                            const left=flip?m.b:m.a;
                            const right=flip?m.a:m.b;
                            const ga=flip?m.gb:m.ga;
                            const gb=flip?m.ga:m.gb;
                            return(
                            <div key={mi} style={{display:"grid",gridTemplateColumns:"1fr 36px 1fr",alignItems:"center",padding:"4px 6px",borderBottom:mi<kr.matches.length-1?"1px solid rgba(255,255,255,.06)":"none",background:mi%2===0?"rgba(0,0,0,.15)":"rgba(0,0,0,.05)"}}>
                              <div style={{display:"flex",alignItems:"center",gap:3,overflow:"hidden"}}>
                                <span style={{fontSize:".36rem",flexShrink:0}}>{m.w===left?"✅":"❌"}</span>
                                <span style={{fontSize:".44rem",fontWeight:m.w===left?700:400,color:m.w===left?"#fff":"rgba(255,255,255,.3)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",textDecoration:m.w===left?"none":"line-through"}}>{left}</span>
                              </div>
                              <div style={{textAlign:"center"}}>
                                <span style={{fontSize:".46rem",fontWeight:800,color:accentCol,background:`rgba(${accentRgb},.2)`,borderRadius:4,padding:"1px 4px",display:"inline-block"}}>{ga}–{gb}</span>
                              </div>
                              <div style={{display:"flex",alignItems:"center",gap:3,justifyContent:"flex-end",overflow:"hidden"}}>
                                <span style={{fontSize:".44rem",fontWeight:m.w===right?700:400,color:m.w===right?"#fff":"rgba(255,255,255,.3)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",textAlign:"right",textDecoration:m.w===right?"none":"line-through"}}>{right}</span>
                                <span style={{fontSize:".36rem",flexShrink:0}}>{m.w===right?"✅":"❌"}</span>
                              </div>
                            </div>
                            );
                          })}
                          {kri===3&&champ&&(
                            <div style={{padding:"6px",background:`rgba(${accentRgb},.18)`,textAlign:"center",fontSize:".54rem",fontWeight:800,color:accentCol}}>
                              🏆 ŞAMPİYON: {champ}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </>
            );
          })()}
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
        background:"rgba(3,6,14,.6)"}}>
        {selTab===myLg&&promoLine&&<span style={{color:C.grn2,fontWeight:700}}>▲ İlk {promoLine}: {selTab==="1. Lig"?"Elit Lig":"ASK"}</span>}
        {selTab===myLg&&euLine&&<span style={{color:C.ora,fontWeight:700}}>🇪🇺 3-4: UEFA</span>}
        {selTab===myLg&&relLine&&<span style={{color:C.red2,fontWeight:700}}>▼ Son 3: Düşme</span>}
        {selTab!==myLg&&<span style={{color:C.dim}}>👁 İzleme modu</span>}
        {hasCL&&<span style={{color:C.gd,fontWeight:700}}>⭐ ASK'dasınız!</span>}
        {hasUEFA&&<span style={{color:C.ora,fontWeight:700}}>🇪🇺 Avrupa Ligi'ndesiniz!</span>}
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
          <div style={{borderTop:"1px solid rgba(45,143,255,0.1)",flexShrink:0,background:"rgba(3,6,14,.7)"}}>
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
