// ═══════════════════════════════════════════════════════════════
// TARAFTAR İLİŞKİLERİ
// ═══════════════════════════════════════════════════════════════
function PageIliskiler({fans,updateFans,season,clubName,addNews,mgmt,updateMgmt}){
  const [tab,setTab]=useState("fans"); // fans | mgmt

  // ── Taraftar verileri ──
  const fH=fans.happiness||60;
  const fT=fans.trust||50;
  const att=fans.attendance||65;
  const ultras=fans.ultras||"nötr";
  const fanHist=fans.history||[];
  const fHCol=fH>=75?C.grn2:fH>=50?"#e67e22":C.red2;
  const fTCol=fT>=75?C.grn2:fT>=50?"#e67e22":C.red2;
  const aCol=att>=80?C.grn2:att>=60?"#e67e22":C.red2;
  const ultrasCol=ultras==="destekçi"?C.grn2:ultras==="düşmanca"?C.red2:"#e67e22";
  const fHLabel=fH>=85?"Coşkulu 🎉":fH>=70?"Mutlu 😊":fH>=50?"Normal 😐":fH>=30?"Mutsuz 😒":"Öfkeli 😡";
  const fTLabel=fT>=75?"Tam Güven 💪":fT>=50?"İyi 👍":fT>=30?"Şüpheli 🤔":"Güvensiz 👎";

  // ── Yönetim verileri ──
  const mT=mgmt?.trust||60;
  const mHist=mgmt?.history||[];
  const mBlocked=mgmt?.blockWeeksLeft||0;
  const mTCol=mT>=70?C.grn2:mT>=40?"#e67e22":C.red2;
  const mTLabel=mT>=80?"Çok Memnun 🏆":mT>=60?"Memnun 👍":mT>=40?"Nötr 😐":mT>=20?"Kuşkulu 🤔":"Kriz! 🚨";
  const mRelLabel=mT>=70?"Güçlü İlişki":mT>=40?"Normal":mT>=20?"Gergin":"Kriz";

  // ── Fan aksiyonları ──
  const fanActions=[
    {id:"open_day",icon:"🤝",title:"Halka Açık Antrenman",desc:"Taraftarları antrenmana davet et",fanBonus:8,repBonus:1},
    {id:"meet_greet",icon:"📸",title:"İmza Günü",desc:"Oyuncularla taraftar buluşması",fanBonus:10,repBonus:2},
    {id:"season_ticket",icon:"🎫",title:"Kampanya Duyurusu",desc:"Sezonluk bilet kampanyası başlat",fanBonus:6,repBonus:1},
    {id:"fan_forum",icon:"💬",title:"Taraftar Forumu",desc:"Taraftarlarla doğrudan diyalog",fanBonus:5,repBonus:0},
    {id:"community",icon:"❤️",title:"Toplum Projesi",desc:"Sosyal sorumluluk etkinliği",fanBonus:7,repBonus:2},
  ];

  const [usedActions,setUsedActions]=useState({});
  const [actionDone,setActionDone]=useState(null);

  const doAction=(act)=>{
    if(usedActions[act.id]) return;
    if(updateFans) updateFans(act.fanBonus,act.title+" etkinliği","event");
    if(addNews) addNews({type:"taraftar",player:act.title,club:clubName,val:act.fanBonus,
      detail:act.desc,date:new Date().toLocaleDateString("tr-TR")});
    setUsedActions(p=>({...p,[act.id]:true}));
    setActionDone(act);
    setTimeout(()=>setActionDone(null),2500);
  };

  // Sekme bar ortak stili
  const tabBtn=(id,label,icon)=>(
    <button onClick={()=>setTab(id)} style={{
      flex:1,padding:"9px 4px",fontFamily:"inherit",cursor:"pointer",
      fontWeight:tab===id?700:400,fontSize:".58rem",
      background:tab===id?"rgba(45,143,255,.15)":"transparent",
      border:"none",borderBottom:`2px solid ${tab===id?C.ac2:"transparent"}`,
      color:tab===id?C.ac2:C.dmr,transition:"all .15s",
      display:"flex",alignItems:"center",justifyContent:"center",gap:4,
    }}>{icon} {label}</button>
  );

  // Gösterge kartı bileşeni
  const StatCard=({label,value,color,sublabel,barVal})=>(
    <div style={{padding:"10px 12px",background:C.card,border:`1px solid rgba(77,166,255,0.22)`,borderRadius:8}}>
      <div style={{fontSize:".44rem",color:C.dmr,textTransform:"uppercase",letterSpacing:1.2,marginBottom:4}}>{label}</div>
      <div style={{height:5,background:"rgba(100,140,220,.1)",borderRadius:3,overflow:"hidden",marginBottom:5}}>
        <div style={{height:"100%",width:`${barVal??value}%`,background:color,borderRadius:3,transition:"width .5s"}}/>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span style={{fontSize:".7rem",fontWeight:800,color}}>{value}</span>
        <span style={{fontSize:".46rem",color:C.dmr}}>{sublabel}</span>
      </div>
    </div>
  );

  return(
    <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column"}}>
      <div style={{padding:"12px 12px 0"}}>
        <STitle>İlişkiler</STitle>
      </div>

      {/* Sekme bar */}
      <div style={{display:"flex",borderBottom:`1px solid rgba(77,166,255,0.22)`,margin:"0 12px 12px",flexShrink:0}}>
        {tabBtn("fans","Taraftar","👥")}
        {tabBtn("mgmt","Yönetim","🏢")}
      </div>

      <div style={{flex:1,overflowY:"auto",padding:"0 12px 12px"}}>

        {/* ── TARAFTAR SEKMESİ ── */}
        {tab==="fans"&&<>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:10}}>
            <StatCard label="Mutluluk" value={fH} color={fHCol} sublabel={fHLabel}/>
            <StatCard label="TD Güven" value={fT} color={fTCol} sublabel={fTLabel}/>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:12}}>
            <div style={{padding:"10px 12px",background:C.card,border:`1px solid rgba(77,166,255,0.22)`,borderRadius:8}}>
              <div style={{fontSize:".44rem",color:C.dmr,textTransform:"uppercase",letterSpacing:1.2,marginBottom:4}}>Tribün Doluluk</div>
              <div style={{fontSize:".9rem",fontWeight:900,color:aCol,marginBottom:3}}>%{att}</div>
              <div style={{height:4,background:"rgba(100,140,220,.1)",borderRadius:2,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${att}%`,background:aCol,borderRadius:2}}/>
              </div>
              <div style={{fontSize:".44rem",color:C.dmr,marginTop:3}}>{att>=80?"Tribünler dolu":"Seyirci az"}</div>
            </div>
            <div style={{padding:"10px 12px",background:C.card,border:`1px solid rgba(77,166,255,0.22)`,borderRadius:8}}>
              <div style={{fontSize:".44rem",color:C.dmr,textTransform:"uppercase",letterSpacing:1.2,marginBottom:4}}>Ultras</div>
              <div style={{fontSize:".78rem",fontWeight:800,color:ultrasCol,marginBottom:3}}>
                {ultras==="destekçi"?"🟢 Destekçi":ultras==="düşmanca"?"🔴 Düşmanca":"🟡 Nötr"}
              </div>
              <div style={{fontSize:".44rem",color:C.dmr,lineHeight:1.4}}>
                {ultras==="destekçi"?"12. adam gibi destek":
                 ultras==="düşmanca"?"Eleştiriler yoğun":
                 "Sonuçlara göre tutum"}
              </div>
            </div>
          </div>

          <div style={{fontSize:".48rem",color:C.dmr,textTransform:"uppercase",letterSpacing:1.5,marginBottom:8}}>Etkinlikler</div>
          {actionDone&&(
            <div style={{padding:"8px 12px",marginBottom:8,borderRadius:6,
              background:"rgba(46,204,113,.12)",border:"1px solid rgba(39,174,96,.3)",
              fontSize:".58rem",color:C.grn2,fontWeight:700}}>
              ✅ {actionDone.title} — Taraftar mutluluğu +{actionDone.fanBonus}
            </div>
          )}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5,marginBottom:12}}>
            {fanActions.map(act=>{
              const used=usedActions[act.id];
              return(
                <button key={act.id} onClick={()=>doAction(act)} disabled={used} style={{
                  padding:"9px 8px",textAlign:"left",
                  background:used?"rgba(100,120,160,.04)":"rgba(26,110,216,.07)",
                  border:`1px solid ${used?C.brd2:C.brd}`,borderRadius:7,
                  cursor:used?"not-allowed":"pointer",fontFamily:"inherit",
                  opacity:used?0.5:1,transition:"all .15s",
                }}>
                  <div style={{fontSize:".88rem",marginBottom:3}}>{act.icon}</div>
                  <div style={{fontSize:".54rem",fontWeight:700,color:used?C.dmr:C.wh,marginBottom:2}}>{act.title}</div>
                  <div style={{fontSize:".44rem",color:C.dmr,marginBottom:4,lineHeight:1.3}}>{act.desc}</div>
                  {!used&&<div style={{fontSize:".44rem",color:C.grn2,fontWeight:700}}>+{act.fanBonus} mutluluk</div>}
                  {used&&<div style={{fontSize:".44rem",color:C.dmr}}>✓ Yapıldı</div>}
                </button>
              );
            })}
          </div>

          <div style={{fontSize:".48rem",color:C.dmr,textTransform:"uppercase",letterSpacing:1.5,marginBottom:6}}>Son Olaylar</div>
          {fanHist.length===0&&<div style={{fontSize:".58rem",color:C.dmr,padding:"8px 0"}}>Henüz kayıt yok.</div>}
          {fanHist.slice(0,12).map((h,i)=>(
            <div key={i} style={{display:"flex",gap:6,padding:"5px 8px",
              borderBottom:`1px solid rgba(77,166,255,0.1)`,alignItems:"center",fontSize:".54rem"}}>
              <span style={{fontWeight:700,minWidth:24,color:h.delta>0?C.grn2:h.delta<0?C.red2:C.dmr}}>
                {h.delta>0?"+"+h.delta:h.delta}
              </span>
              <span style={{flex:1,color:C.dim}}>{h.reason}</span>
              <span style={{color:C.dmr,fontSize:".42rem"}}>{h.date}</span>
            </div>
          ))}
        </>}

        {/* ── YÖNETİM SEKMESİ ── */}
        {tab==="mgmt"&&<>
          {/* Ana güven kartı */}
          <div style={{
            padding:"14px 16px",marginBottom:10,
            background:mT<30?"rgba(192,57,43,.08)":"rgba(26,110,216,.06)",
            border:`1px solid ${mT<30?"rgba(192,57,43,.3)":mT>=70?"rgba(39,174,96,.3)":C.brd}`,
            borderRadius:10,
          }}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
              <div>
                <div style={{fontSize:".44rem",color:C.dmr,textTransform:"uppercase",letterSpacing:1.5,marginBottom:3}}>
                  🏢 Yönetim Güveni
                </div>
                <div style={{fontSize:".62rem",fontWeight:700,color:mTCol}}>{mRelLabel}</div>
              </div>
              <div style={{fontSize:"1.8rem",fontWeight:900,color:mTCol,lineHeight:1}}>{mT}</div>
            </div>
            <div style={{height:8,background:C.surfaceHover,borderRadius:4,overflow:"hidden",marginBottom:6}}>
              <div style={{height:"100%",width:`${mT}%`,
                background:mT>=70?C.grn2:mT>=40?"#e67e22":C.red2,
                borderRadius:4,transition:"width .5s"}}/>
            </div>
            <div style={{fontSize:".5rem",color:C.dmr}}>{mTLabel}</div>
          </div>

          {/* Bütçe bloke uyarısı */}
          {mT<30&&mBlocked>0&&(
            <div style={{
              padding:"10px 14px",marginBottom:10,
              background:"rgba(232,64,64,.1)",
              border:"1px solid rgba(192,57,43,.4)",
              borderRadius:8,
            }}>
              <div style={{fontSize:".56rem",fontWeight:700,color:C.red2,marginBottom:4}}>
                🔒 Transfer Bütçesi Bloke
              </div>
              <div style={{fontSize:".52rem",color:C.dim,lineHeight:1.5}}>
                Yönetim güvensizliği nedeniyle bütçenin <b style={{color:C.red2}}>%30'u</b> bloke.
                Kaldırılmasına <b style={{color:C.gd}}>{mBlocked} maç</b> kaldı.
              </div>
            </div>
          )}

          {/* Yönetim ilişkisi skalaları */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:5,marginBottom:12}}>
            {[
              {l:"Güven",v:mT,c:mTCol},
              {l:"Basın Etkisi",v:Math.min(100,Math.max(0,mT+(Math.random()*10-5)|0)),c:"#e67e22"},
              {l:"Bütçe Riski",v:mT<30?100-mT:0,c:mT<30?C.red2:C.grn2},
            ].map(s=>(
              <div key={s.l} style={{padding:"8px 10px",background:C.card,border:`1px solid rgba(77,166,255,0.22)`,borderRadius:7,textAlign:"center"}}>
                <div style={{fontSize:".42rem",color:C.dmr,marginBottom:4}}>{s.l}</div>
                <div style={{fontSize:".9rem",fontWeight:800,color:s.c}}>{s.v}</div>
                <div style={{height:3,background:"rgba(100,140,220,.1)",borderRadius:2,overflow:"hidden",marginTop:4}}>
                  <div style={{height:"100%",width:`${s.v}%`,background:s.c,borderRadius:2}}/>
                </div>
              </div>
            ))}
          </div>

          {/* Yönetim beklentileri */}
          <div style={{
            padding:"10px 14px",marginBottom:12,
            background:C.card,border:`1px solid rgba(77,166,255,0.22)`,borderRadius:8,
          }}>
            <div style={{fontSize:".48rem",color:C.dmr,textTransform:"uppercase",letterSpacing:1.5,marginBottom:8}}>
              📋 Yönetim Beklentileri
            </div>
            {[
              {l:"Basın açıklamalarında temkinli ol",ok:mT>=40,tip:"Popülist cevaplar yönetimi rahatsız eder"},
              {l:"Gerçekçi hedefler aç",ok:mT>=50,tip:"Aşırı iddialı söylem baskı yaratır"},
              {l:"Transfer bütçesini verimli kullan",ok:mT>=30,tip:"Gereksiz transferler güveni zedeler"},
            ].map((e,i)=>(
              <div key={i} style={{display:"flex",gap:8,alignItems:"flex-start",marginBottom:6}}>
                <span style={{fontSize:".7rem",flexShrink:0,marginTop:1}}>{e.ok?"✅":"⚠️"}</span>
                <div>
                  <div style={{fontSize:".52rem",color:e.ok?C.wh:C.gd,fontWeight:e.ok?400:600}}>{e.l}</div>
                  <div style={{fontSize:".44rem",color:C.dmr,lineHeight:1.3}}>{e.tip}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Yönetim geçmişi */}
          <div style={{fontSize:".48rem",color:C.dmr,textTransform:"uppercase",letterSpacing:1.5,marginBottom:6}}>
            Son Olaylar
          </div>
          {mHist.length===0&&<div style={{fontSize:".58rem",color:C.dmr,padding:"8px 0"}}>Henüz kayıt yok.</div>}
          {mHist.slice(0,12).map((h,i)=>(
            <div key={i} style={{display:"flex",gap:6,padding:"5px 8px",
              borderBottom:`1px solid rgba(77,166,255,0.1)`,alignItems:"center",fontSize:".54rem"}}>
              <span style={{fontWeight:700,minWidth:24,color:h.delta>0?C.grn2:h.delta<0?C.red2:C.dmr}}>
                {h.delta>0?"+"+h.delta:h.delta===0?"±0":h.delta}
              </span>
              <span style={{flex:1,color:C.dim}}>{h.reason}</span>
              <span style={{color:C.dmr,fontSize:".42rem"}}>{h.date}</span>
            </div>
          ))}
        </>}

      </div>
    </div>
  );
}
