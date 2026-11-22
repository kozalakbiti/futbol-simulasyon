// ═══════════════════════════════════════════════════════════════
// OYUNCU DETAY MODALI
// ═══════════════════════════════════════════════════════════════
function PlayerModal({player,onClose,onList,onLoan,onSell,onRenew}){
  const [renewMode,setRenewMode]=useState(false);
  const [newYears,setNewYears]=useState(2);
  const salIncrease=Math.round(player.sal*(player.ovr>=80?0.15:player.ovr>=70?0.10:0.07));
  const newSal=player.sal+salIncrease;
  return(
    <Modal title={`${player.n} — Detay`} onClose={onClose}>
      <div style={{display:"flex",gap:10,marginBottom:12,padding:8,background:"rgba(26,110,216,.07)",borderRadius:4,border:`1px solid rgba(77,166,255,0.22)`}}>
        <div style={{width:44,height:44,borderRadius:"50%",background:`linear-gradient(135deg,${C.ac},#0a3070)`,
          display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.3rem",flexShrink:0}}>
          {player.pos==="GK"?"🧤":player.pos==="ST"?"⚽":"👟"}
        </div>
        <div style={{flex:1}}>
          <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:4}}>
            <span style={{fontSize:".9rem",fontWeight:700}}>{player.n}</span>
            <PosTag pos={player.pos}/>
          </div>
          <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
            <Chip color="gold">OVR {player.ovr}</Chip>
            <Chip color="purple">POT {player.pot}</Chip>
            <Chip>{player.age} yaş</Chip>
            <Chip color={player.ct<=1?"red":"green"}>{player.ct} yıl</Chip>
          </div>
        </div>
      </div>

      {[["Hız",player.spd],["Şut",player.sht],["Pas",player.pas],["Def",player.def],["OVR",player.ovr],["POT",player.pot]].map(([l,v],i)=>(
        <div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:5,fontSize:".68rem"}}>
          <span style={{color:C.dim,minWidth:32}}>{l}</span>
          {typeof v==="number"?<StatBar val={v} color={i===5?C.pur2:i===4?C.gd:C.ac2}/>:<div style={{flex:1,height:3,background:"rgba(100,140,220,.06)",borderRadius:2}}/>}
          <span style={{color:C.wh,fontWeight:600,minWidth:22,textAlign:"right"}}>{v!=null?v:"—"}</span>
        </div>
      ))}

      {/* Moral & Sakatlık */}
      {(()=>{
        const moral=player.moral??75;
        const injured=player.injured||0;
        const moralCol=moral>=80?"#30e070":moral>=60?"#ffd060":moral>=40?"#e67e22":"#ff5050";
        const moralLabel=moral>=85?"Olağanüstü":moral>=70?"İyi":moral>=50?"Normal":moral>=35?"Düşük":"Çok Kötü";
        return(
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,margin:"8px 0"}}>
            <div style={{background:injured?"rgba(231,76,60,.1)":"rgba(46,204,113,.06)",
              border:`1px solid ${injured?"rgba(231,76,60,.3)":"rgba(46,204,113,.2)"}`,
              borderRadius:6,padding:"8px 10px"}}>
              <div style={{fontSize:".44rem",color:C.dmr,textTransform:"uppercase",letterSpacing:1.5,marginBottom:4}}>Sağlık</div>
              {injured>0
                ?<><div style={{fontSize:".7rem",fontWeight:700,color:"#ff5050"}}>🩹 Sakatlık</div>
                   <div style={{fontSize:".5rem",color:"#e8975a"}}>{injured} hafta sonra dönüş</div></>
                :<><div style={{fontSize:".7rem",fontWeight:700,color:"#30e070"}}>✅ Sağlıklı</div>
                   <div style={{fontSize:".5rem",color:C.dmr}}>Oynayabilir</div></>
              }
            </div>
            <div style={{background:"rgba(26,110,216,.06)",border:`1px solid rgba(77,166,255,0.1)`,borderRadius:6,padding:"8px 10px"}}>
              <div style={{fontSize:".44rem",color:C.dmr,textTransform:"uppercase",letterSpacing:1.5,marginBottom:4}}>Moral</div>
              <div style={{fontSize:".7rem",fontWeight:700,color:moralCol}}>{moralLabel}</div>
              <div style={{height:4,background:"rgba(255,255,255,.06)",borderRadius:2,marginTop:4,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${moral}%`,background:moralCol,borderRadius:2,transition:"width .4s"}}/>
              </div>
              <div style={{fontSize:".44rem",color:C.dmr,marginTop:2}}>{moral}/100</div>
            </div>
          </div>
        );
      })()}

      <div style={{margin:"10px 0",padding:8,background:"rgba(142,68,173,.08)",borderRadius:4,border:`1px solid rgba(142,68,173,.2)`}}>
        <div style={{fontSize:".5rem",color:C.pur2,textTransform:"uppercase",letterSpacing:2,marginBottom:5}}>Gelişim Tavanı</div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{flex:1,height:8,background:"rgba(100,140,220,.1)",borderRadius:3,overflow:"hidden",position:"relative"}}>
            <div style={{position:"absolute",left:0,top:0,height:"100%",width:`${player.ovr}%`,background:C.ac2}}/>
            <div style={{position:"absolute",left:`${player.ovr}%`,top:0,height:"100%",width:`${player.pot-player.ovr}%`,background:"rgba(142,68,173,.45)"}}/>
          </div>
          <span style={{fontSize:".6rem",color:C.pur2,fontWeight:700}}>{player.pot}</span>
        </div>
        <div style={{fontSize:".5rem",color:C.dmr,marginTop:3}}>Şu an: {player.ovr} · Gelişim: +{player.pot-player.ovr}</div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:10}}>
        <div style={{background:"rgba(26,110,216,.06)",border:`1px solid rgba(77,166,255,0.1)`,borderRadius:3,padding:"7px 8px"}}>
          <div style={{fontSize:".48rem",color:C.dim,textTransform:"uppercase",letterSpacing:1.5,marginBottom:1}}>Piyasa Değeri</div>
          <div style={{fontSize:".84rem",fontWeight:700,color:player.st==="free"?C.grn2:C.gd}}>{player.st==="free"?calcFreePlayerVal(player):calcEffectiveVal(player)}M€</div>
        </div>
        <div style={{background:"rgba(26,110,216,.06)",border:`1px solid rgba(77,166,255,0.1)`,borderRadius:3,padding:"7px 8px"}}>
          <div style={{fontSize:".48rem",color:C.dim,textTransform:"uppercase",letterSpacing:1.5,marginBottom:1}}>Maş/Ay</div>
          <div style={{fontSize:".84rem",fontWeight:700,color:C.gd}}>{fmtSal(player.sal)}</div>
        </div>
      </div>

      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
        <Btn color={player.listed?"red":"gold"} onClick={()=>onList(player.id)} style={{flex:1,padding:7,fontSize:".62rem"}}>
          {player.listed?"LİSTEDEN ÇIKAR":"TRANSFER LİSTESİ"}
        </Btn>
        <Btn color={player.loan?"red":"blue"} onClick={()=>onLoan(player.id)} style={{flex:1,padding:7,fontSize:".62rem"}}>
          {player.loan?"KİRAYI İPTAL":"KİRALIĞA VER"}
        </Btn>
      </div>
      {/* Sözleşme Uzatma */}
      {onRenew&&(
        <div style={{marginTop:8,padding:"8px 10px",
          background:player.ct<=0?"rgba(231,76,60,.1)":player.ct===1?"rgba(232,184,58,.07)":"rgba(39,174,96,.07)",
          border:`1px solid ${player.ct<=0?"rgba(231,76,60,.35)":player.ct===1?"rgba(232,184,58,.3)":"rgba(39,174,96,.2)"}`,
          borderRadius:6}}>
          {!renewMode?(
            <div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div>
                  <div style={{fontSize:".5rem",color:player.ct<=0?C.red2:player.ct===1?C.gd:"#30e070",textTransform:"uppercase",letterSpacing:1.5,marginBottom:2}}>Sözleşme</div>
                  <div style={{fontSize:".62rem",color:player.ct<=0?C.red2:player.ct<=1?C.gd:C.wh}}>
                    {player.ct<=0?"❌ Sözleşmesi bitti":player.ct===1?"⚠️ Son yıl":player.ct+" yıl kaldı"}
                  </div>
                </div>
                <Btn color={player.ct<=0?"red":"green"} onClick={()=>setRenewMode(true)} style={{padding:"5px 10px",fontSize:".58rem"}}>
                  🔄 Uzat
                </Btn>
              </div>
              {player.ct<=0&&<div style={{marginTop:6,padding:"5px 7px",borderRadius:5,
                background:"rgba(231,76,60,.12)",border:"1px solid rgba(231,76,60,.25)",
                fontSize:".48rem",color:C.red2,lineHeight:1.5}}>
                ⚠️ Sezon sonunda ayrılabilir! OVR {player.ovr} → Ayrılma riski: {player.ovr>=80?"%75":player.ovr>=72?"%50":"%30"}
                <br/>Hemen uzat veya kaybedebilirsin.
              </div>}
              {player.ct===1&&<div style={{marginTop:4,fontSize:".44rem",color:C.gd,opacity:.8}}>
                Son sözleşme yılı — sezon sonunda serbest kalacak.
              </div>}
            </div>
          ):(
            <div>
              <div style={{fontSize:".5rem",color:"#30e070",marginBottom:6,textTransform:"uppercase",letterSpacing:1}}>Sözleşme Uzatma Teklifi</div>
              <div style={{display:"flex",gap:6,marginBottom:6,alignItems:"center"}}>
                <span style={{fontSize:".56rem",color:C.dim,minWidth:50}}>Süre:</span>
                {[1,2,3,4].map(y=>(
                  <button key={y} onClick={()=>setNewYears(y)} style={{
                    padding:"3px 8px",borderRadius:3,cursor:"pointer",fontFamily:"inherit",fontSize:".58rem",
                    border:`1px solid ${newYears===y?C.grn2:C.brd}`,
                    background:newYears===y?"rgba(46,204,113,.2)":"rgba(39,174,96,.05)",
                    color:newYears===y?"#30e070":C.dim}}>{y} yıl</button>
                ))}
              </div>
              <div style={{fontSize:".52rem",color:C.dmr,marginBottom:8}}>
                Yeni maaş: <span style={{color:C.gd,fontWeight:700}}>{fmtSal(newSal)}/yıl</span>
                <span style={{color:C.red2,marginLeft:4}}>(+{fmtSal(salIncrease)})</span>
              </div>
              <div style={{display:"flex",gap:6}}>
                <Btn color="green" onClick={()=>{onRenew(player,newYears,newSal);setRenewMode(false);}} style={{flex:1,padding:6,fontSize:".58rem"}}>
                  ✅ Teklifi Kabul Et
                </Btn>
                <Btn color="red" onClick={()=>setRenewMode(false)} style={{flex:1,padding:6,fontSize:".58rem"}}>
                  İptal
                </Btn>
              </div>
            </div>
          )}
        </div>
      )}
      {onSell&&<div style={{marginTop:6}}>
        <Btn color="red" onClick={()=>onSell(player)} style={{width:"100%",padding:7,fontSize:".62rem"}}>
          📤 OYUNCUYU SAT / KADRODAN ÇIKAR
        </Btn>
      </div>}
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════
// TAKİM GÜÇ ANALİZİ YARDIMCISI
// ═══════════════════════════════════════════════════════════════
function calcTeamGrades(squad){
  const gk=squad.filter(p=>p.pos==="GK");
  const def=squad.filter(p=>["CB","LB","RB"].includes(p.pos));
  const mid=squad.filter(p=>["CM","LM","RM","CAM","CDM"].includes(p.pos));
  const att=squad.filter(p=>p.pos==="ST");
  const avg=(arr)=>arr.length?Math.round(arr.reduce((s,p)=>s+p.ovr,0)/arr.length):60;
  return {
    GK:ovrToGrade(avg(gk)),
    DEF:ovrToGrade(avg(def)),
    MID:ovrToGrade(avg(mid)),
    ATT:ovrToGrade(avg(att)),
    overall:ovrToGrade(Math.round((avg(gk)+avg(def)+avg(mid)+avg(att))/4)),
  };
}


// En yakın pozisyon haritası — otomatik dizilimde fallback sırası
const NEAREST_POS={
  GK: ["GK"],
  CB: ["CB","CDM","LB","RB"],
  LB: ["LB","CB","LM","RB"],
  RB: ["RB","CB","RM","LB"],
  CDM:["CDM","CB","CM","CAM"],
  CM: ["CM","CDM","CAM","LM","RM"],
  CAM:["CAM","CM","LM","RM","ST"],
  LM: ["LM","RM","CM","CAM","LB"],
  RM: ["RM","LM","CM","CAM","RB"],
  ST: ["ST","CAM","LM","RM"],
};
