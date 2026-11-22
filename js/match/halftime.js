// ═══════════════════════════════════════════════════════════════
// DEVRE ARASI KONUŞMASI
// ═══════════════════════════════════════════════════════════════
function HalftimeSpeech({myScore,oppScore,myStr,oppStr,clubName,onContinue,onTacticChange,squad=[],lineup=[]}){
  const diff=myScore-oppScore;
  const isWin=diff>0, isDraw=diff===0, isLose=diff<0;
  const strDiff=myStr-(oppStr||70);

  // ── Durum bazlı konuşma seçenekleri ──
  const speechPool=(()=>{
    if(isWin&&diff>=2) return [
      {tone:"ateşli",text:`${diff} fark harika! Bu tempoyu ikinci devrede de koruyun. Savunmayı ihmal etmeyin, gol yemeden bitirin.`,emoji:"🔥"},
      {tone:"sakin",text:"İyi gidiyoruz. Panik yok, skor kontrolünüzde. Gereksiz risk almayın, pozisyon oyunu oynayın.",emoji:"😎"},
      {tone:"motive",text:"Muhteşem bir ilk devre! Soyunma odasındaki gurur hissediliyor. Şimdi asıl iş başlıyor.",emoji:"💪"},
    ];
    if(isWin&&diff===1) return [
      {tone:"uyarı",text:"Tek gol fark az. Dikkatli olun, rakip ikinci devrede daha sert çıkacak. Savunmayı sıkılaştırın.",emoji:"⚠️"},
      {tone:"motive",text:"Doğru yoldayız. Bu gol farkı korunabilir ama şansımızı zorlamayın. Konsantre kalın.",emoji:"🎯"},
      {tone:"saldırı",text:"Tek gol yetmez! İkinci golü erkenden atacağız, rakibin umudunu kıracağız.",emoji:"⚔️"},
    ];
    if(isDraw) return [
      {tone:"baskı",text:"Beraberlik yetmez. İkinci devrede daha agresif çıkıyoruz. Orta sahayı kazanın, öne geçin.",emoji:"⚡"},
      {tone:"analiz",text:`Rakip ${strDiff<-5?"beklenenden güçlü":"bizim seviyemizde"}. Taktik değiştirmeliyiz. Kanatları daha etkili kullanalım.`,emoji:"🧠"},
      {tone:"sakin",text:"İyi bir beraberlik maçı bu. Sabırlı olun, ilk golü atacak olan kazanacak.",emoji:"🤝"},
    ];
    if(isLose&&diff===-1) return [
      {tone:"ateşli",text:"Tek golle geri olunur! Bu takım daha iyi. İkinci devrede saldırıya geçiyoruz!",emoji:"🔥"},
      {tone:"taktik",text:"Savunma hataları var. Düzeltiyoruz. Orta alan daha kompakt duracak, kontra ataklara dikkat.",emoji:"🛡️"},
      {tone:"motive",text:"Daha çok maç oynadınız, daha zor durumlardan döndünüz. Şimdi toparlanma zamanı.",emoji:"💪"},
    ];
    // isLose && diff<=-2
    return [
      {tone:"sert",text:"Bu performans kabul edilemez. İkinci devrede her şeyi sahaya bırakacaksınız. Şimdi.",emoji:"😤"},
      {tone:"taktik",text:"Rakip bizi okudu. Formation değiştiriyoruz. Daha direkt, daha hızlı oyun istiyorum.",emoji:"🧠"},
      {tone:"dürüst",text:"Zor durumdayız ama bitmiş değiliz. Tek gol farkı kapatılabilir. İnanç ve disiplin.",emoji:"🎯"},
    ];
  })();

  // Taktik ayar seçenekleri (devre arası)
  const tacticOptions=[
    {key:"atk",  label:"⚔️ Tam Hücum",   desc:"Daha fazla forvet, yüksek risk"},
    {key:"bal",  label:"⚖️ Dengeli",       desc:"Normal formasyon koru"},
    {key:"def",  label:"🛡️ Savunma",       desc:"Geri çekil, gol yeme"},
    {key:"press",label:"🔥 Yüksek Baskı",  desc:"Rakibe alan verme"},
  ];

  const [chosenIdx,setChosenIdx]=useState(null);
  const [tactic,setTactic]=useState("bal");
  const [step,setStep]=useState("speech"); // speech | tactic | subs | ready
  const [showAll,setShowAll]=useState(false);

  // ── OYUNCU DEĞİŞİKLİĞİ ──
  const startingXI=lineup.length>0
    ? lineup.map(idx=>squad[idx]).filter(Boolean)
    : squad.slice(0,11);
  const benchPlayers=squad.filter(p=>!startingXI.find(s=>s&&s.id===p.id)&&!p.injured);

  const condMap=React.useMemo(()=>{
    const m={};
    startingXI.forEach(p=>{
      if(!p) return;
      const base=p.fatigue||0;
      const posW=["ST","LM","RM","CM"].includes(p.pos)?0.6:0.4;
      m[p.id]=Math.max(0,100-Math.min(100,base+20+Math.floor(Math.random()*20*posW)));
    });
    return m;
  // eslint-disable-next-line
  },[]);

  const condCol=(c)=>c>=70?"#30e070":c>=45?"#ffd060":c>=25?"#e67e22":"#ff5050";
  const condLabel=(c)=>c>=70?"İyi":c>=45?"Normal":c>=25?"Yorgun":"Kritik";

  const [subs,setSubs]=useState([]);
  const [pickingOut,setPickingOut]=useState(null);
  const MAX_SUBS=3;

  const addSub=(inPlayer)=>{
    if(!pickingOut||subs.length>=MAX_SUBS) return;
    if(subs.find(s=>s.out.id===pickingOut.id||s.in.id===inPlayer.id)){setPickingOut(null);return;}
    setSubs(prev=>[...prev,{out:pickingOut,in:inPlayer}]);
    setPickingOut(null);
  };
  const removeSub=(outId)=>setSubs(prev=>prev.filter(s=>s.out.id!==outId));
  const currentXI=startingXI.filter(p=>p&&!subs.find(s=>s.out.id===p.id));
  const availBench=benchPlayers.filter(p=>!subs.find(s=>s.in.id===p.id));

  // Varsayılan konuşmayı duruma göre seç
  const defaultIdx=isLose?0:isDraw?1:0;
  const activeIdx=chosenIdx!==null?chosenIdx:defaultIdx;
  const activeSpeech=speechPool[activeIdx]||speechPool[0];

  const tacticBonusMap={atk:6,bal:0,def:-4,press:3};
  const tacticBonus=tacticBonusMap[tactic]||0;

  return(
    <div style={{
      position:"fixed",inset:0,zIndex:280,
      background:"rgba(0,0,0,.92)",
      display:"flex",alignItems:"center",justifyContent:"center",padding:12,
    }}>
      <div style={{
        width:"min(100%,440px)",
        background:"linear-gradient(160deg,#0b1525,#050d1a)",
        border:`1px solid rgba(77,166,255,0.22)`,borderRadius:12,overflow:"hidden",
        display:"flex",flexDirection:"column",maxHeight:"92vh",
      }}>
        {/* Başlık */}
        <div style={{
          padding:"10px 16px",
          background:"linear-gradient(90deg,#0d1f3d,#091523)",
          borderBottom:`1px solid rgba(77,166,255,0.22)`,
          display:"flex",alignItems:"center",gap:8,flexShrink:0,
        }}>
          <span style={{fontSize:"1.1rem"}}>🏟️</span>
          <div style={{flex:1}}>
            <div style={{fontSize:".72rem",fontWeight:800,color:C.wh,letterSpacing:1}}>DEVRE ARASI — SOYUNMA ODASI</div>
            <div style={{fontSize:".48rem",color:C.dmr}}>{clubName} · 45. dakika</div>
          </div>
          {/* Skor rozeti */}
          <div style={{
            padding:"4px 12px",borderRadius:6,
            background:isWin?"rgba(46,204,113,.2)":isLose?"rgba(192,57,43,.2)":"rgba(200,153,42,.15)",
            border:`1px solid ${isWin?"rgba(39,174,96,.5)":isLose?"rgba(192,57,43,.5)":"rgba(200,153,42,.4)"}`,
            fontSize:"1.1rem",fontWeight:900,
            color:isWin?C.grn2:isLose?C.red2:C.gd,
          }}>{myScore} – {oppScore}</div>
        </div>

        <div style={{flex:1,overflowY:"auto",padding:"12px 14px 6px"}}>

          {/* ADIM 1: Konuşma seçimi */}
          {step==="speech"&&<>
            <div style={{fontSize:".5rem",color:C.dmr,textTransform:"uppercase",letterSpacing:1.5,marginBottom:8}}>
              Takıma ne söyleyeceksin?
            </div>

            {/* Durum analizi */}
            <div style={{
              padding:"8px 12px",marginBottom:10,borderRadius:7,
              background:isWin?"rgba(39,174,96,.08)":isLose?"rgba(192,57,43,.08)":"rgba(200,153,42,.07)",
              border:`1px solid ${isWin?"rgba(39,174,96,.25)":isLose?"rgba(192,57,43,.25)":"rgba(200,153,42,.2)"}`,
              fontSize:".56rem",color:C.dim,lineHeight:1.6,
            }}>
              {isWin&&diff>=2&&"🟢 Harika bir ilk devre. Takımın dominan oyununu sürdürmeli."}
              {isWin&&diff===1&&"🟡 Tek gol avantajı kırılgan. Savunma sağlamlığı kritik."}
              {isDraw&&strDiff>=5&&"🟡 Daha güçlüyüz ama gol bulamıyoruz. Taktik revize şart."}
              {isDraw&&strDiff<5&&"⚪ Dengeli bir maç. Sabır ve fırsatı iyi değerlendirmek gerekiyor."}
              {isLose&&diff===-1&&"🔴 Tek gol açıkta kaldık. Hâlâ kurtarılabilir bir maç."}
              {isLose&&diff<=-2&&"🔴 Ciddi skor açığı. Radikal değişiklik şart."}
            </div>

            {/* Konuşma seçenekleri */}
            {(showAll?speechPool:speechPool.slice(0,2)).map((sp,i)=>(
              <button key={i} onClick={()=>setChosenIdx(i)} style={{
                display:"block",width:"100%",textAlign:"left",
                padding:"10px 12px",marginBottom:6,
                background:activeIdx===i?"rgba(45,143,255,.18)":"rgba(26,110,216,.06)",
                border:`1px solid ${activeIdx===i?C.ac2:C.brd}`,
                borderRadius:7,cursor:"pointer",fontFamily:"inherit",
                transition:"all .15s",
              }}>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
                  <span style={{fontSize:"1rem"}}>{sp.emoji}</span>
                  <span style={{fontSize:".56rem",fontWeight:700,color:activeIdx===i?C.ac2:C.dim,textTransform:"uppercase",letterSpacing:.8}}>{sp.tone}</span>
                  {activeIdx===i&&<span style={{fontSize:".44rem",color:C.ac2,marginLeft:"auto"}}>✓ Seçildi</span>}
                </div>
                <div style={{fontSize:".6rem",color:activeIdx===i?C.wh:C.dim,lineHeight:1.5,fontStyle:"italic"}}>
                  "{sp.text}"
                </div>
              </button>
            ))}
            {speechPool.length>2&&!showAll&&(
              <button onClick={()=>setShowAll(true)} style={{
                width:"100%",padding:"5px",background:"transparent",
                border:`1px dashed ${C.brd2}`,borderRadius:5,cursor:"pointer",
                fontFamily:"inherit",fontSize:".5rem",color:C.dmr,marginBottom:4,
              }}>+ Daha fazla seçenek</button>
            )}
          </>}

          {/* ADIM 2: Taktik ayarı */}
          {step==="tactic"&&<>
            <div style={{
              padding:"8px 12px",marginBottom:10,borderRadius:7,
              background:"rgba(26,110,216,.08)",border:`1px solid rgba(77,166,255,0.22)`,
              fontSize:".56rem",color:C.dim,lineHeight:1.5,fontStyle:"italic",
            }}>
              <span style={{fontSize:".9rem"}}>{activeSpeech.emoji} </span>
              "{activeSpeech.text}"
            </div>

            <div style={{fontSize:".5rem",color:C.dmr,textTransform:"uppercase",letterSpacing:1.5,marginBottom:8}}>
              İkinci devre taktiği
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:10}}>
              {tacticOptions.map(t=>(
                <button key={t.key} onClick={()=>setTactic(t.key)} style={{
                  padding:"10px 8px",textAlign:"center",
                  background:tactic===t.key?"rgba(77,166,255,.25)":"rgba(26,110,216,.06)",
                  border:`1px solid ${tactic===t.key?C.ac2:C.brd}`,
                  borderRadius:6,cursor:"pointer",fontFamily:"inherit",transition:"all .15s",
                }}>
                  <div style={{fontSize:".8rem",marginBottom:3}}>{t.label.split(" ")[0]}</div>
                  <div style={{fontSize:".56rem",fontWeight:700,color:tactic===t.key?C.wh:C.dim}}>{t.label.split(" ").slice(1).join(" ")}</div>
                  <div style={{fontSize:".44rem",color:C.dmr,marginTop:2}}>{t.desc}</div>
                  {tactic===t.key&&tacticBonus!==0&&(
                    <div style={{marginTop:4,fontSize:".46rem",fontWeight:700,
                      color:tacticBonus>0?C.grn2:C.red2}}>
                      {tacticBonus>0?"+"+tacticBonus:tacticBonus} hücum bonusu
                    </div>
                  )}
                </button>
              ))}
            </div>
          </>}

          {/* ADIM 3: OYUNCU DEĞİŞİKLİĞİ */}
          {step==="subs"&&<>
            <div style={{fontSize:".48rem",color:C.dmr,textTransform:"uppercase",letterSpacing:1.5,marginBottom:6,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <span>Değişiklik yap ({subs.length}/{MAX_SUBS})</span>
              {pickingOut&&<span style={{color:"#ffd060",fontSize:".46rem",animation:"blink 1s infinite"}}>⬇ Girecek oyuncuyu seç</span>}
            </div>

            {/* Yapılan değişiklikler */}
            {subs.length>0&&<div style={{marginBottom:8}}>
              {subs.map((s,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:6,padding:"5px 8px",marginBottom:4,
                  background:"rgba(39,174,96,.08)",border:"1px solid rgba(39,174,96,.25)",borderRadius:6}}>
                  <span style={{fontSize:".55rem",color:C.red2,fontWeight:600,minWidth:28,textAlign:"center"}}>{s.out.pos}</span>
                  <span style={{fontSize:".6rem",color:C.red2,flex:1}}>{s.out.n}</span>
                  <span style={{fontSize:".7rem"}}>→</span>
                  <span style={{fontSize:".6rem",color:C.grn2,flex:1,textAlign:"right"}}>{s.in.n}</span>
                  <span style={{fontSize:".55rem",color:C.grn2,fontWeight:600,minWidth:28,textAlign:"center"}}>{s.in.pos}</span>
                  <button onClick={()=>removeSub(s.out.id)} style={{
                    padding:"2px 6px",background:"rgba(192,57,43,.2)",border:"1px solid rgba(192,57,43,.4)",
                    borderRadius:4,cursor:"pointer",fontFamily:"inherit",fontSize:".5rem",color:C.red2,
                  }}>✕</button>
                </div>
              ))}
            </div>}

            {/* Saha 11 — çıkacak oyuncu seçimi */}
            {!pickingOut&&<>
              <div style={{fontSize:".44rem",color:C.dmr,marginBottom:4,letterSpacing:1}}>SAHADAKİLER — çıkacak oyuncuyu seç:</div>
              <div style={{display:"flex",flexDirection:"column",gap:3,marginBottom:10,maxHeight:160,overflowY:"auto"}}>
                {currentXI.map(p=>{
                  const cond=condMap[p.id]??70;
                  const alreadyOut=subs.find(s=>s.out.id===p.id);
                  if(alreadyOut) return null;
                  return(
                    <button key={p.id} onClick={()=>subs.length<MAX_SUBS&&setPickingOut(p)}
                      disabled={subs.length>=MAX_SUBS}
                      style={{
                        display:"flex",alignItems:"center",gap:8,padding:"6px 10px",
                        background:"rgba(26,110,216,.07)",border:`1px solid ${cond<45?"rgba(231,76,60,.3)":C.brd}`,
                        borderRadius:6,cursor:subs.length>=MAX_SUBS?"default":"pointer",
                        fontFamily:"inherit",transition:"all .15s",textAlign:"left",
                        opacity:subs.length>=MAX_SUBS?0.5:1,
                      }}>
                      <span style={{fontSize:".5rem",fontWeight:700,color:C.ac2,minWidth:30}}>{p.pos}</span>
                      <span style={{fontSize:".6rem",color:C.wh,flex:1}}>{p.n}</span>
                      <span style={{fontSize:".52rem",color:"#9ab",marginRight:4}}>OVR {p.ovr}</span>
                      <span style={{fontSize:".5rem",fontWeight:700,color:condCol(cond),
                        background:`rgba(${cond<45?"192,57,43":cond<70?"200,153,42":"46,204,113"},.12)`,
                        padding:"1px 6px",borderRadius:3}}>
                        {condLabel(cond)} {cond}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>}

            {/* Yedekler — girecek oyuncu seçimi */}
            {pickingOut&&<>
              <div style={{
                padding:"5px 10px",marginBottom:6,borderRadius:5,
                background:"rgba(231,76,60,.1)",border:"1px solid rgba(231,76,60,.3)",
                fontSize:".56rem",color:C.red2,
              }}>⬆ {pickingOut.n} ({pickingOut.pos}) çıkıyor — kim girecek?</div>
              <div style={{display:"flex",flexDirection:"column",gap:3,maxHeight:160,overflowY:"auto"}}>
                {availBench.length===0&&<div style={{fontSize:".56rem",color:C.dmr,padding:"8px 0",textAlign:"center"}}>Uygun yedek yok</div>}
                {availBench.map(p=>(
                  <button key={p.id} onClick={()=>addSub(p)}
                    style={{
                      display:"flex",alignItems:"center",gap:8,padding:"6px 10px",
                      background:"rgba(39,174,96,.08)",border:"1px solid rgba(39,174,96,.25)",
                      borderRadius:6,cursor:"pointer",fontFamily:"inherit",transition:"all .15s",textAlign:"left",
                    }}>
                    <span style={{fontSize:".5rem",fontWeight:700,color:C.grn2,minWidth:30}}>{p.pos}</span>
                    <span style={{fontSize:".6rem",color:C.wh,flex:1}}>{p.n}</span>
                    <span style={{fontSize:".52rem",color:"#9ab",marginRight:4}}>OVR {p.ovr}</span>
                    <span style={{fontSize:".5rem",color:C.grn2}}>→ Gir</span>
                  </button>
                ))}
              </div>
              <button onClick={()=>setPickingOut(null)} style={{
                width:"100%",marginTop:6,padding:"6px",background:"transparent",
                border:`1px dashed ${C.brd2}`,borderRadius:5,cursor:"pointer",
                fontFamily:"inherit",fontSize:".5rem",color:C.dmr,
              }}>← İptal</button>
            </>}
          </>}

          {/* ADIM 4: Hazır */}
          {step==="ready"&&<div style={{textAlign:"center",padding:"16px 0"}}>
            <div style={{fontSize:"2.5rem",marginBottom:8}}>
              {activeSpeech.emoji}
            </div>
            <div style={{fontSize:".78rem",fontWeight:700,color:C.wh,marginBottom:6}}>Takım hazır!</div>
            <div style={{fontSize:".56rem",color:C.dim,fontStyle:"italic",lineHeight:1.5,marginBottom:10}}>
              "{activeSpeech.text}"
            </div>
            <div style={{
              display:"inline-flex",gap:6,padding:"5px 14px",borderRadius:6,
              background:"rgba(45,143,255,.12)",border:`1px solid rgba(77,166,255,0.22)`,
              fontSize:".52rem",color:C.ac2,marginBottom:subs.length>0?8:0,
            }}>
              Taktik: {tacticOptions.find(t=>t.key===tactic)?.label}
              {tacticBonus!==0&&<span style={{color:tacticBonus>0?C.grn2:C.red2,fontWeight:700}}>
                {" "}{tacticBonus>0?"+"+tacticBonus:tacticBonus}
              </span>}
            </div>
            {subs.length>0&&<div style={{width:"100%",maxWidth:280,margin:"0 auto"}}>
              {subs.map((s,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:6,padding:"4px 8px",marginBottom:3,
                  background:"rgba(39,174,96,.07)",border:"1px solid rgba(39,174,96,.2)",borderRadius:5,
                  fontSize:".52rem"}}>
                  <span style={{color:C.red2,flex:1,textAlign:"right"}}>{s.out.n}</span>
                  <span style={{color:"#7898c0"}}>→</span>
                  <span style={{color:C.grn2,flex:1}}>{s.in.n}</span>
                </div>
              ))}
            </div>}
          </div>}
        </div>

        {/* Alt butonlar */}
        <div style={{padding:"10px 14px 12px",borderTop:`1px solid rgba(77,166,255,0.22)`,flexShrink:0,
          display:"flex",gap:6}}>
          {step==="speech"&&(
            <>
              <button onClick={()=>setStep("tactic")} style={{
                flex:2,padding:"10px 0",
                background:`linear-gradient(135deg,#1a4fa8,${C.ac2})`,
                border:"none",color:"#fff",fontSize:".66rem",fontWeight:800,
                cursor:"pointer",borderRadius:7,fontFamily:"inherit",letterSpacing:1,
              }}>Taktik Ayarla →</button>
              <button onClick={()=>onContinue({speech:activeSpeech,tactic:"bal",tacticBonus:0,subs:[]})} style={{
                flex:1,padding:"10px 0",
                background:"rgba(100,120,160,.1)",border:`1px solid rgba(77,166,255,0.22)`,
                color:C.dim,fontSize:".6rem",cursor:"pointer",borderRadius:7,fontFamily:"inherit",
              }}>Hızlı Geç</button>
            </>
          )}
          {step==="tactic"&&(
            <>
              <button onClick={()=>setStep("subs")} style={{
                flex:2,padding:"10px 0",
                background:`linear-gradient(135deg,#1e8449,${C.grn2})`,
                border:"none",color:"#fff",fontSize:".66rem",fontWeight:800,
                cursor:"pointer",borderRadius:7,fontFamily:"inherit",letterSpacing:1,
              }}>Değişiklik Yap →</button>
              <button onClick={()=>setStep("speech")} style={{
                flex:1,padding:"10px 0",
                background:"rgba(100,120,160,.1)",border:`1px solid rgba(77,166,255,0.22)`,
                color:C.dim,fontSize:".6rem",cursor:"pointer",borderRadius:7,fontFamily:"inherit",
              }}>← Geri</button>
            </>
          )}
          {step==="subs"&&(
            <>
              <button onClick={()=>setStep("ready")} style={{
                flex:2,padding:"10px 0",
                background:`linear-gradient(135deg,#7b2d8c,#a855f7)`,
                border:"none",color:"#fff",fontSize:".66rem",fontWeight:800,
                cursor:"pointer",borderRadius:7,fontFamily:"inherit",letterSpacing:1,
              }}>Hazır! ✅ {subs.length>0&&`(${subs.length} değişiklik)`}</button>
              <button onClick={()=>setStep("tactic")} style={{
                flex:1,padding:"10px 0",
                background:"rgba(100,120,160,.1)",border:`1px solid rgba(77,166,255,0.22)`,
                color:C.dim,fontSize:".6rem",cursor:"pointer",borderRadius:7,fontFamily:"inherit",
              }}>← Geri</button>
            </>
          )}
          {step==="ready"&&(
            <button onClick={()=>onContinue({speech:activeSpeech,tactic,tacticBonus,subs})} style={{
              flex:1,padding:"11px 0",
              background:`linear-gradient(135deg,#0d3a8c,${C.ac2})`,
              border:"none",color:"#fff",fontSize:".72rem",fontWeight:800,
              cursor:"pointer",borderRadius:7,fontFamily:"inherit",letterSpacing:2,
              boxShadow:`0 4px 18px ${C.ac}55`,
            }}>🏃 2. DEVREYE ÇIKIYORUZ!</button>
          )}
        </div>
      </div>
    </div>
  );
}
