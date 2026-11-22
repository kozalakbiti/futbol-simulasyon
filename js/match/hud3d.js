// ═══════════════════════════════════════════════════════════════
// 3D MAÇ GÖRÜNÜMÜ — SKOR TABELASI (HTML HUD) + 2D/3D TERCİHİ
// ═══════════════════════════════════════════════════════════════
// • Scoreboard3D: 3D sahnenin üstünde duran yarı saydam HTML katman (WebGL değil).
//   Takım kısaltmaları + küçük rozet, skor, dakika, devre ve gol atanların kısa
//   listesi. Gol olunca skor yanıp söner, tabela atan takımın forma renginde parlar.
//   pointer-events:none → altındaki 3D sahneye dokunmayı engellemez.
// • Maç görünümü tercihi ("2d" | "3d") ayrı localStorage anahtarında saklanır
//   (kayıt dosyası şekli değişmez). Varsayılan "2d" (eski davranış, düşük güçlü cihaz).
// ═══════════════════════════════════════════════════════════════

const MATCH_VIEW_LS_KEY="fcym_match_view";

// Kayıtlı maç görünümü: "2d" | "3d" (bilinmeyen/eksik değer → "2d")
function getMatchViewPref(){
  try{ return safeLsGet(MATCH_VIEW_LS_KEY,"2d")==="3d"?"3d":"2d"; }
  catch(e){ return "2d"; }
}
// Not: safeLsSet kullanılmaz — kota dolunca en eski kayıt slotunu siliyor; küçük bir görünüm
// tercihi için kayıt kaybı riski alınmaz. Yazılamazsa tercih sessizce kaybolur.
function setMatchViewPref(v){
  try{ localStorage.setItem(MATCH_VIEW_LS_KEY,JSON.stringify(v==="3d"?"3d":"2d")); return true; }
  catch(e){ return false; }
}

// Forma renkleri (players3d.js ACTORS3D_COLORS ile aynı mavi/kırmızı)
const SCOREBOARD3D_KIT={me:"#2485ff",opp:"#d93a3a"};

// props: clubName, oppName, myScore, oppScore, minute, half (metin), goals [{min,team:"me"|"opp",name}]
function Scoreboard3D({clubName,oppName,myScore=0,oppScore=0,minute=0,half="",goals=[]}){
  const myB=getTeamBadge(clubName), opB=getTeamBadge(oppName);
  // Gol vurgusu: skor artınca kısa süre yanıp sön + takım renginde parıltı.
  // İlk değer referans alınır → 3D maç ortasında açılınca eski goller için vurgu olmaz.
  const prevRef=useRef({my:myScore,opp:oppScore});
  const [hl,setHl]=useState(null); // {side, k}
  useEffect(()=>{
    const p=prevRef.current;
    const side=myScore>p.my?"me":oppScore>p.opp?"opp":null;
    prevRef.current={my:myScore,opp:oppScore};
    if(!side) return;
    setHl({side,k:Date.now()});
    const t=setTimeout(()=>setHl(null),1900);
    return()=>clearTimeout(t);
  },[myScore,oppScore]);

  const glow=hl?SCOREBOARD3D_KIT[hl.side]:null;
  const shortName=(n)=>{ const s=String(n||"").trim(); if(!s) return ""; const parts=s.split(/[\s.]+/).filter(Boolean); return parts[parts.length-1]||s; };
  const mine=goals.filter(g=>g.team==="me").slice(-3);
  const theirs=goals.filter(g=>g.team!=="me").slice(-3);
  const minTxt=half==="MAÇ SONU"?"90'":half==="DEVRE ARASI"?"45'":`${minute}'`;

  const badge=(b,kit)=>(
    <span style={{width:15,height:15,borderRadius:4,flexShrink:0,display:"inline-flex",alignItems:"center",
      justifyContent:"center",background:b.bg,borderBottom:`2px solid ${kit}`,
      fontSize:".3rem",fontWeight:900,color:b.tx,lineHeight:1,letterSpacing:-.2,overflow:"hidden"}}>
      {String(b.ab||"?").slice(0,3)}
    </span>
  );
  const abbr=(b,name)=>String(b.ab||name||"?").slice(0,4).toUpperCase();
  const scoreBox=(v,side)=>(
    <span key={hl&&hl.side===side?hl.k:side} style={{minWidth:14,textAlign:"center",fontSize:".9rem",
      fontWeight:900,color:"#fff",fontFamily:"'Barlow Condensed',sans-serif",lineHeight:1,
      animation:hl&&hl.side===side?"sb3dBlink .32s steps(2,start) 5":"none",
      textShadow:hl&&hl.side===side?`0 0 10px ${SCOREBOARD3D_KIT[side]}`:"none"}}>{v}</span>
  );
  const scorerLine=(list,side)=>{
    if(!list.length) return null;
    return(
      <div style={{display:"flex",alignItems:"center",gap:3,maxWidth:"100%",overflow:"hidden",
        whiteSpace:"nowrap",textOverflow:"ellipsis",fontSize:".36rem",color:"rgba(255,255,255,.82)",
        background:"rgba(4,10,20,.55)",borderLeft:`2px solid ${SCOREBOARD3D_KIT[side]}`,
        borderRadius:"0 4px 4px 0",padding:"1px 5px"}}>
        <span style={{flexShrink:0}}>⚽</span>
        <span style={{overflow:"hidden",textOverflow:"ellipsis"}}>
          {list.map(g=>(side==="me"&&g.name?shortName(g.name)+" ":"")+(Number.isFinite(g.min)&&g.min>0?g.min+"'":"")).join(", ")}
        </span>
      </div>
    );
  };

  return(
    <div style={{position:"absolute",top:5,left:5,zIndex:3,pointerEvents:"none",
      maxWidth:"calc(100% - 10px)",display:"flex",flexDirection:"column",alignItems:"flex-start",gap:2}}>
      <div style={{display:"flex",alignItems:"stretch",borderRadius:6,overflow:"hidden",
        background:"rgba(6,14,28,.72)",border:`1px solid ${glow||"rgba(255,255,255,.16)"}`,
        boxShadow:glow?`0 0 14px ${glow}aa, inset 0 0 10px ${glow}55`:"0 2px 8px rgba(0,0,0,.45)",
        transition:"box-shadow .25s, border-color .25s",maxWidth:"100%"}}>
        {/* Takımlar + skor */}
        <div style={{display:"flex",alignItems:"center",gap:4,padding:"3px 6px",minWidth:0}}>
          {badge(myB,SCOREBOARD3D_KIT.me)}
          <span style={{fontSize:".44rem",fontWeight:800,color:"#dbe8ff",letterSpacing:.6}}>{abbr(myB,clubName)}</span>
          <span style={{display:"inline-flex",alignItems:"center",gap:3,padding:"1px 5px",borderRadius:4,
            background:"rgba(255,255,255,.08)"}}>
            {scoreBox(myScore,"me")}
            <span style={{fontSize:".5rem",color:"rgba(255,255,255,.45)",fontWeight:700}}>:</span>
            {scoreBox(oppScore,"opp")}
          </span>
          <span style={{fontSize:".44rem",fontWeight:800,color:"#ffdada",letterSpacing:.6}}>{abbr(opB,oppName)}</span>
          {badge(opB,SCOREBOARD3D_KIT.opp)}
        </div>
        {/* Dakika + devre */}
        <div style={{display:"flex",flexDirection:"column",justifyContent:"center",alignItems:"center",
          padding:"2px 6px",background:"rgba(255,255,255,.07)",borderLeft:"1px solid rgba(255,255,255,.12)",
          flexShrink:0}}>
          <span style={{fontSize:".52rem",fontWeight:900,color:half==="MAÇ SONU"?"#ffd060":"#fff",
            fontFamily:"'Barlow Condensed',sans-serif",lineHeight:1}}>{minTxt}</span>
          <span style={{fontSize:".28rem",color:"rgba(255,255,255,.6)",letterSpacing:.8,whiteSpace:"nowrap",marginTop:1}}>{half}</span>
        </div>
      </div>
      {scorerLine(mine,"me")}
      {scorerLine(theirs,"opp")}
      <style>{`@keyframes sb3dBlink{to{opacity:.15}}`}</style>
    </div>
  );
}
