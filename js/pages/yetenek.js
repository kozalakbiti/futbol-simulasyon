// ─── ALTYAPI ─────────────────────────────────────────────────
function PageYetenek({onAction,squad,youth,onAddToSquad,clubName="Club Manager: Glory Road",squadFull=false,squadCount=0,academyLevel=1,setAcademyLevel=()=>{},onDismissYouth=()=>{},finans=null,updateFinans=()=>{}}){
  const [sel,setSel]=useState(null);
  const posGroups={GK:"Kaleci",CB:"Stoper",LB:"Sol Bek",RB:"Sağ Bek",CM:"Orta Saha",LM:"Sol Kanat",RM:"Sağ Kanat",ST:"Forvet",CAM:"Ofansif OS",CDM:"Defansif OS"};
  const yearDots=(y)=>{
    const yr=y||0;
    return [0,1,2].map(i=>(
      <span key={i} style={{display:"inline-block",width:7,height:7,borderRadius:"50%",marginRight:2,
        background:i<yr?(yr>=3?"#ff5050":"#ffd060"):"rgba(255,255,255,.12)",
        border:`1px solid ${i<yr?(yr>=3?"#cc2233":"#d4a020"):"rgba(255,255,255,.2)"}`}}/>
    ));
  };
  const ACADEMY_LEVELS=[
    {lv:1,label:"Temel",cost:0,potBonus:0,countBonus:0,color:"#7898c0",desc:"Standart altyapı"},
    {lv:2,label:"Gelişen",cost:2000,potBonus:2,countBonus:0,color:C.grn2,desc:"+2 POT, altyapı kalitesi artar"},
    {lv:3,label:"İyi",cost:5000,potBonus:4,countBonus:1,color:"#ffd060",desc:"+4 POT, sezon başı +1 ekstra keşif"},
    {lv:4,label:"Güçlü",cost:12000,potBonus:6,countBonus:1,color:"#f97316",desc:"+6 POT, yıldız adayları çıkabilir"},
    {lv:5,label:"Elit",cost:30000,potBonus:8,countBonus:2,color:C.pur2,desc:"+8 POT, en iyi yetenekler akademine gelir"},
  ];
  const curAcademy=ACADEMY_LEVELS[academyLevel-1]||ACADEMY_LEVELS[0];
  const nextAcademy=ACADEMY_LEVELS[academyLevel]||null;
  const budget=finans?.budget||0;
  const canUpgrade=nextAcademy&&budget>=nextAcademy.cost;
  const fmtCost=(k)=>k>=1000?(k/1000).toFixed(0)+"M€":k+"K€";

  return(
    <div style={{display:"flex",flex:1,minHeight:0,overflow:"hidden",flexDirection:"column"}}>
      {/* Akademi Seviyesi Paneli */}
      <div style={{flexShrink:0,padding:"8px 12px",borderBottom:`1px solid rgba(77,166,255,0.12)`,
        background:"rgba(142,68,173,.06)"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
          <div style={{flex:1}}>
            <div style={{fontSize:".62rem",fontWeight:700,color:curAcademy.color}}>
              🏫 Akademi: {curAcademy.label} (Lv {academyLevel}/5)
            </div>
            <div style={{fontSize:".46rem",color:C.dim,marginTop:1}}>{curAcademy.desc}</div>
          </div>
          {nextAcademy&&(
            <button onClick={()=>{
              if(!canUpgrade){onAction(`💸 Yükseltme için ${fmtCost(nextAcademy.cost)} gerekiyor! (Mevcut: ${fmtCost(budget)})`);return;}
              updateFinans(nextAcademy.cost,"buy",`Akademi Lv${nextAcademy.lv} yükseltmesi`);
              setAcademyLevel(nextAcademy.lv);
              onAction(`🏫 Akademi ${nextAcademy.label} seviyesine yükseltildi! -${fmtCost(nextAcademy.cost)}`);
            }} style={{padding:"5px 10px",borderRadius:5,border:"none",cursor:"pointer",fontFamily:"inherit",
              fontSize:".5rem",fontWeight:700,
              background:canUpgrade?"linear-gradient(135deg,rgba(142,68,173,.6),rgba(142,68,173,.3))":"rgba(100,100,150,.15)",
              color:canUpgrade?C.pur2:C.dmr}}>
              {canUpgrade?`⬆ Lv${nextAcademy.lv} — ${fmtCost(nextAcademy.cost)}`:`🔒 ${fmtCost(nextAcademy.cost)}`}
            </button>
          )}
          {!nextAcademy&&<Chip color="purple">Maksimum Seviye</Chip>}
        </div>
        {/* Seviye barı */}
        <div style={{height:4,background:"rgba(142,68,173,.15)",borderRadius:2,overflow:"hidden"}}>
          <div style={{height:"100%",width:`${(academyLevel/5)*100}%`,background:`linear-gradient(90deg,${C.pur},${C.pur2})`,borderRadius:2,transition:"width .4s"}}/>
        </div>
      </div>

      {/* Ana içerik: Sol liste + Sağ detay */}
      <div style={{display:"flex",flex:1,minHeight:0,overflow:"hidden"}}>
      {/* Sol: liste */}
      <div style={{flex:1,display:"flex",flexDirection:"column",minHeight:0,borderRight:`1px solid rgba(77,166,255,0.1)`}}>
        <div style={{padding:"8px 12px",borderBottom:`1px solid rgba(77,166,255,0.1)`,flexShrink:0,
          display:"flex",justifyContent:"space-between",alignItems:"center",background:"rgba(142,68,173,.04)"}}>
          <div>
            <div style={{fontSize:".7rem",fontWeight:600,color:C.pur2,letterSpacing:1}}>⭐ ALTYAPI</div>
            <div style={{fontSize:".5rem",color:C.dim,marginTop:1}}>3 yılda yetişir · İmzala veya bırak</div>
          </div>
          <Chip color="purple">{youth.length} oyuncu</Chip>
        </div>
        {squadFull&&(
          <div style={{flexShrink:0,padding:"7px 12px",
            background:"rgba(231,76,60,.18)",borderBottom:"2px solid #e74c3c",
            display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:".9rem"}}>⛔</span>
            <div>
              <div style={{fontSize:".58rem",fontWeight:700,color:"#ff5050"}}>KADRO DOLU ({squadCount}/32)</div>
              <div style={{fontSize:".46rem",color:"#e8975a"}}>Altyapıdan oyuncu alınamaz. Önce kadronu düzenle.</div>
            </div>
          </div>
        )}
        <div style={{flex:1,overflowY:"auto",padding:10,display:"flex",flexDirection:"column",gap:6}}>
          {youth.map(pl=>{
            const yr=pl.youthYear||0;
            const isLastYear=yr>=2;
            const cardBorder=isLastYear?"#ff5050":sel&&sel.id===pl.id?C.pur:C.brd;
            const cardBg=isLastYear?"rgba(231,76,60,.07)":sel&&sel.id===pl.id?"rgba(142,68,173,.15)":"rgba(26,110,216,.04)";
            return(
              <div key={pl.id} onClick={()=>setSel((sel&&sel.id===pl.id)?null:pl)}
                style={{padding:"9px 10px",background:cardBg,border:`1px solid ${cardBorder}`,borderRadius:5,cursor:"pointer"}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                  <PosTag pos={pl.pos}/>
                  <div style={{flex:1}}>
                    <div style={{fontSize:".76rem",fontWeight:600}}>{pl.n}</div>
                    <div style={{fontSize:".5rem",color:C.dim}}>{posGroups[pl.pos]||pl.pos} · {pl.age} yaş</div>
                  </div>
                  <div style={{textAlign:"right",flexShrink:0}}>
                    <div style={{fontSize:".8rem",fontWeight:700,color:C.ac2}}>{pl.ovr}</div>
                    <div style={{fontSize:".56rem",color:C.pur2,fontWeight:600}}>↑{pl.pot}</div>
                  </div>
                </div>
                {/* Yıl göstergesi */}
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
                  <div style={{display:"flex",alignItems:"center",gap:3}}>
                    <span style={{fontSize:".44rem",color:C.dmr,marginRight:2}}>Altyapı yılı:</span>
                    {yearDots(yr)}
                    <span style={{fontSize:".44rem",color:yr>=2?"#ff5050":C.dim,marginLeft:2,fontWeight:yr>=2?700:400}}>
                      {yr}/3{yr>=2?" ⚠️ Son yıl!":""}
                    </span>
                  </div>
                </div>
                {/* Potansiyel bar */}
                <div style={{height:5,background:"rgba(100,140,220,.1)",borderRadius:3,overflow:"hidden",position:"relative",marginBottom:2}}>
                  <div style={{position:"absolute",left:0,top:0,height:"100%",width:`${pl.ovr}%`,background:C.ac2,borderRadius:3}}/>
                  <div style={{position:"absolute",left:`${pl.ovr}%`,top:0,height:"100%",width:`${pl.pot-pl.ovr}%`,background:"rgba(142,68,173,.5)",borderRadius:3}}/>
                  <div style={{position:"absolute",top:0,left:`${pl.pot}%`,width:2,height:"100%",background:C.pur}}/>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:".44rem",color:C.dmr}}>
                  <span>OVR: {pl.ovr}</span>
                  <span>Gelişim: <b style={{color:C.pur2}}>+{pl.pot-pl.ovr}</b></span>
                  <span>Tavan: {pl.pot}</span>
                </div>
              </div>
            );
          })}
          {youth.length===0&&(
            <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",color:C.dmr,gap:8,padding:20,textAlign:"center"}}>
              <div style={{fontSize:"2rem"}}>🌱</div>
              <div style={{fontSize:".6rem"}}>Altyapıda oyuncu yok<br/>Sezon sonunda yeni keşifler gelecek</div>
            </div>
          )}
        </div>
      </div>
      {/* Sağ: seçili oyuncu detayı */}
      <div style={{width:220,display:"flex",flexDirection:"column",padding:12,overflowY:"auto"}}>
        {sel?(
          <>
            <div style={{textAlign:"center",marginBottom:10,padding:10,background:"rgba(142,68,173,.08)",borderRadius:5,border:`1px solid rgba(142,68,173,.2)`}}>
              <div style={{fontSize:"2rem",marginBottom:4}}>{sel.pos==="GK"?"🧤":sel.pos==="ST"?"⚽":"🌟"}</div>
              <div style={{fontSize:".82rem",fontWeight:700}}>{sel.n}</div>
              <div style={{fontSize:".54rem",color:C.dim,marginTop:2}}>{posGroups[sel.pos]||sel.pos} · {sel.age} yaş</div>
              <div style={{display:"flex",justifyContent:"center",gap:8,marginTop:8}}>
                <Chip color="blue">OVR {sel.ovr}</Chip>
                <Chip color="purple">POT {sel.pot}</Chip>
              </div>
            </div>
            {/* Altyapı durumu */}
            {(()=>{
              const yr=sel.youthYear||0;
              const remaining=3-yr;
              const col=remaining<=1?"#ff5050":remaining===2?"#ffd060":C.grn2;
              return(
                <div style={{marginBottom:10,padding:"7px 10px",borderRadius:5,
                  background:remaining<=1?"rgba(231,76,60,.08)":"rgba(26,110,216,.06)",
                  border:`1px solid ${remaining<=1?"rgba(231,76,60,.3)":C.brd2}`}}>
                  <div style={{fontSize:".44rem",color:C.dmr,marginBottom:4,textTransform:"uppercase",letterSpacing:.8}}>Altyapı Durumu</div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div style={{display:"flex",gap:3}}>{yearDots(yr)}</div>
                    <span style={{fontSize:".52rem",fontWeight:700,color:col}}>
                      {remaining<=0?"Son yıl doldu":remaining===1?"⚠️ Son yıl":remaining+" yıl kaldı"}
                    </span>
                  </div>
                  {remaining<=1&&<div style={{fontSize:".44rem",color:"#ff5050",marginTop:4}}>Bu sezonda A takımına alınmazsa serbest kalır!</div>}
                </div>
              );
            })()}
            <div style={{marginBottom:10}}>
              <div style={{fontSize:".52rem",color:C.dim,textTransform:"uppercase",letterSpacing:2,marginBottom:6}}>Özellikler</div>
              {[["Hız",sel.spd,C.ac2],["Şut",sel.sht,C.red2],["Pas",sel.pas,C.grn2],["Def",sel.def,C.gd]].map(([l,v,col])=>(
                <div key={l} style={{display:"flex",alignItems:"center",gap:6,marginBottom:5}}>
                  <span style={{fontSize:".62rem",color:C.dim,minWidth:28}}>{l}</span>
                  <div style={{flex:1,height:4,background:"rgba(100,140,220,.1)",borderRadius:2,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${v}%`,background:col,borderRadius:2}}/>
                  </div>
                  <span style={{fontSize:".7rem",fontWeight:600,minWidth:22,textAlign:"right"}}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{marginBottom:10,padding:8,background:"rgba(26,110,216,.06)",borderRadius:4,border:`1px solid rgba(77,166,255,0.1)`}}>
              <div style={{fontSize:".52rem",color:C.dim,textTransform:"uppercase",letterSpacing:2,marginBottom:4}}>Bilgiler</div>
              {[["Maaş",`${sel.sal}K€/yıl`],["Altyapı Yılı",`${sel.youthYear||0}/3`],["Altyapı",clubName]].map(([l,v])=>(
                <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"3px 0",borderBottom:`1px solid rgba(77,166,255,0.1)`,fontSize:".64rem"}}>
                  <span style={{color:C.dim}}>{l}</span><span style={{color:C.wh,fontWeight:600}}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              <button
                disabled={squadFull}
                onClick={()=>{if(!squadFull){onAddToSquad(sel);setSel(null);}}}
                style={{
                  padding:"9px 0",borderRadius:6,fontFamily:"inherit",fontWeight:800,
                  fontSize:".64rem",letterSpacing:.5,cursor:squadFull?"not-allowed":"pointer",
                  background:squadFull?"rgba(231,76,60,.15)":"linear-gradient(135deg,#27ae60,#2ecc71)",
                  border:squadFull?"1px solid #e74c3c55":"none",
                  color:squadFull?"#ff5050":"#fff",
                  boxShadow:squadFull?"none":"0 3px 10px rgba(39,174,96,.4)",
                  width:"100%"
                }}>
                {squadFull?"⛔ KADRO DOLU (32/32)":"✅ A TAKIMINA AL"}
              </button>
              <Btn color="red" onClick={()=>{onDismissYouth(sel.id);setSel(null);onAction(`${sel.n} altyapıdan ayrıldı.`);}} style={{padding:7,fontSize:".64rem",width:"100%"}}>
                ❌ BIRAKMAK İSTEMİYORUM
              </Btn>
              <Btn color="blue" onClick={()=>{onAction(sel.n+" için antrenman planı oluşturuldu!");}} style={{padding:7,fontSize:".64rem",width:"100%"}}>
                🏋️ ANTRENMAN PLANLA
              </Btn>
            </div>
          </>
        ):(
          <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",color:C.dmr,textAlign:"center",gap:8}}>
            <div style={{fontSize:"2.5rem"}}>👆</div>
            <div style={{fontSize:".66rem"}}>Detay görmek için<br/>bir oyuncu seçin</div>
          </div>
        )}
      </div>
      </div>{/* Ana içerik kapanış */}
    </div>
  );
}
