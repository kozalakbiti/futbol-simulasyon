// ─── FİNANS ──────────────────────────────────────────────────
function PageFinans({finans,squad,coaches=[],clubName="Club Manager: Glory Road",onAcceptSponsor,onOpenSponsorModal,rep,league="1. Lig"}){
  const f=finans||{budget:20000,transferBudget:12000,wageBudget:8000,spent:0,income:0,wageSpent:0,salaryTotal:0,stadyum:0,forma:0,yayin:0,sponsorluk:0,ligOdeme:0,kupaPrim:0,weeklyLog:[],activeSponsors:[],SPONSOR_DEALS:[]};
  const fmt=(v)=>{const abs=Math.abs(v);const s=v<0?"-":"";return abs>=1000?s+(abs/1000).toFixed(1)+"M€":s+abs+"K€";};
  const salTotal=squad?squad.reduce((s,p)=>s+(p.sal||0),0):f.salaryTotal;
  const coachSalTotal=coaches.filter(c=>c.hired).reduce((s,c)=>s+(c.cost*1000),0);
  const weeklyWage=Math.round((salTotal+coachSalTotal));
  const totalGelir=f.stadyum+f.forma+f.yayin+f.sponsorluk+f.ligOdeme+(f.kupaPrim||0)+f.income;
  const totalGider=f.spent+(weeklyWage*(f.weeklyLog||[]).filter(l=>l.type==="salary_weekly").length);
  const net=totalGelir-totalGider;
  const [tab,setTab]=useState("ozet");
  const gelirRows=[
    {icon:"🏟️",label:"Stadyum Gelirleri", val:f.stadyum,          col:"#1ab855"},
    {icon:"👕",label:"Forma Satışı",        val:f.forma,            col:"#30e070"},
    {icon:"📺",label:"Yayın Gelirleri",     val:f.yayin,            col:"#3498db"},
    {icon:"🤝",label:"Sponsorluk",           val:f.sponsorluk,      col:"#9b59b6"},
    {icon:"🏆",label:"Lig Ödemesi",          val:f.ligOdeme,        col:"#ffd060"},
    {icon:"🥇",label:"Kupa Primleri",        val:f.kupaPrim||0,     col:"#ff5050"},
    {icon:"💸",label:"Transfer Geliri",      val:f.income,          col:"#1abc9c"},
  ];
  const maxGelir=Math.max(1,...gelirRows.map(r=>r.val));
  const pct=(v,m)=>Math.min(100,Math.round(v/m*100));
  const SPONSOR_DEALS=f.SPONSOR_DEALS||[];
  const activeSponsors=f.activeSponsors||[];
  const [sponsorSel,setSponsorSel]=useState(null);
  const repPts=rep?rep.pts:0;

  const tabBtn=(k,lbl)=>(
    <button key={k} onClick={()=>setTab(k)} style={{
      padding:"3px 9px",fontSize:".5rem",cursor:"pointer",fontFamily:"inherit",
      borderRadius:4,fontWeight:tab===k?700:400,
      background:tab===k?"rgba(45,143,255,.25)":"rgba(26,110,216,.06)",
      border:`1px solid ${tab===k?C.ac2:C.brd2}`,
      color:tab===k?C.wh:C.dim}}>{lbl}</button>
  );

  return(
    <div style={{flex:1,overflowY:"auto",padding:10}}>
      {/* Tab bar */}
      <div style={{display:"flex",gap:4,marginBottom:10,flexWrap:"wrap"}}>
        {tabBtn("ozet","📊 Özet")}
        {tabBtn("butce","💼 Bütçe")}
        {tabBtn("sponsor","🤝 Sponsorlar")}
        {tabBtn("hareketler","📋 Hareketler")}
        {tabBtn("maaslar","💰 Maaşlar")}
      </div>

      {/* ── ÖZET ── */}
      {tab==="ozet"&&<>
      {/* Ana metrikler — 4 kart */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5,marginBottom:8}}>
        {[
          {l:"Transfer Bütçesi", v:fmt(f.transferBudget||0), c:(f.transferBudget||0)>5000?C.grn2:(f.transferBudget||0)>1000?"#e67e22":C.red2, icon:"🏃"},
          {l:"Maaş Bütçesi",     v:fmt(f.wageBudget||0),    c:(f.wageBudget||0)>3000?C.grn2:(f.wageBudget||0)>500?"#e67e22":C.red2,    icon:"💰"},
          {l:"Toplam Gelir",     v:fmt(totalGelir),          c:C.grn2,  icon:"📈"},
          {l:"Net Durum",        v:(net>=0?"+":"")+fmt(net), c:net>=0?C.grn2:C.red2, icon:net>=0?"✅":"⚠️"},
        ].map((c2,i)=>(
          <div key={i} style={{background:C.card,borderRadius:8,padding:"9px 11px",border:`1px solid rgba(77,166,255,0.22)`}}>
            <div style={{fontSize:".42rem",color:C.dmr,marginBottom:3,textTransform:"uppercase",letterSpacing:.8,display:"flex",alignItems:"center",gap:3}}>
              <span>{c2.icon}</span><span>{c2.l}</span>
            </div>
            <div style={{fontSize:".86rem",fontWeight:900,color:c2.c}}>{c2.v}</div>
          </div>
        ))}
      </div>

      {/* Gelir vs Gider karşılaştırması */}
      <div style={{background:C.card,borderRadius:8,padding:"10px 12px",marginBottom:8,border:`1px solid rgba(77,166,255,0.22)`}}>
        <div style={{fontSize:".46rem",color:C.dim,textTransform:"uppercase",letterSpacing:1.5,marginBottom:8,fontWeight:700}}>📊 Gelir / Gider Dengesi</div>
        {(()=>{
          const totalGider2=(f.spent||0)+salTotal+coachSalTotal;
          const maxVal=Math.max(totalGelir,totalGider2,1);
          return(
            <>
            <div style={{marginBottom:6}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
                <span style={{fontSize:".5rem",color:C.grn2}}>📈 Toplam Gelir</span>
                <span style={{fontSize:".54rem",fontWeight:700,color:C.grn2}}>{fmt(totalGelir)}</span>
              </div>
              <div style={{height:8,background:C.surfaceHover,borderRadius:4,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${Math.round(totalGelir/maxVal*100)}%`,background:`linear-gradient(90deg,#1e8449,#27ae60)`,borderRadius:4}}/>
              </div>
            </div>
            <div style={{marginBottom:6}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
                <span style={{fontSize:".5rem",color:C.red2}}>📉 Toplam Gider</span>
                <span style={{fontSize:".54rem",fontWeight:700,color:C.red2}}>{fmt(totalGider2)}</span>
              </div>
              <div style={{height:8,background:C.surfaceHover,borderRadius:4,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${Math.round(totalGider2/maxVal*100)}%`,background:`linear-gradient(90deg,#922b21,#e74c3c)`,borderRadius:4}}/>
              </div>
            </div>
            <div style={{paddingTop:6,borderTop:`1px solid rgba(77,166,255,0.1)`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:".5rem",color:C.dim,fontWeight:700}}>Net</span>
              <span style={{fontSize:".7rem",fontWeight:900,color:net>=0?C.grn2:C.red2}}>{net>=0?"+":""}{fmt(net)}</span>
            </div>
            </>
          );
        })()}
      </div>

      {/* Gelir kalemleri */}
      <div style={{background:C.card,borderRadius:8,padding:"10px 12px",marginBottom:8,border:`1px solid rgba(77,166,255,0.22)`}}>
        <div style={{fontSize:".46rem",color:C.dim,textTransform:"uppercase",letterSpacing:1.5,marginBottom:8,fontWeight:700}}>💹 Gelir Kalemleri</div>
        {gelirRows.map((r,i)=>(
          <div key={i} style={{marginBottom:6}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
              <span style={{fontSize:".52rem",color:C.wh}}>{r.icon} {r.label}</span>
              <span style={{fontSize:".56rem",fontWeight:700,color:r.val>0?r.col:C.dmr}}>{r.val>0?fmt(r.val):"—"}</span>
            </div>
            <div style={{height:5,background:C.surfaceHover,borderRadius:3,overflow:"hidden"}}>
              <div style={{height:"100%",width:pct(r.val,maxGelir)+"%",background:r.col,borderRadius:3,transition:"width .4s"}}/>
            </div>
          </div>
        ))}
      </div>

      {/* Gider özeti */}
      <div style={{background:C.card,borderRadius:8,padding:"10px 12px",border:`1px solid rgba(231,76,60,.2)`}}>
        <div style={{fontSize:".46rem",color:C.red2,textTransform:"uppercase",letterSpacing:1.5,marginBottom:6,fontWeight:700}}>💸 Gider Özeti</div>
        {[
          {icon:"💼",label:"Transfer Harcamaları", val:f.spent||0},
          {icon:"👥",label:`Kadro Maaşları (${squad?squad.length:0} oyuncu)`, val:salTotal},
          {icon:"🏋️",label:`Antrenör Ücretleri (${coaches.filter(c=>c.hired).length} antrenör)`, val:coachSalTotal},
        ].map((r,i)=>(
          <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",
            padding:"5px 0",borderBottom:`1px solid rgba(77,166,255,0.1)`,fontSize:".54rem"}}>
            <span style={{color:C.dim}}>{r.icon} {r.label}</span>
            <span style={{fontWeight:700,color:r.val>0?C.red2:C.dmr}}>{r.val>0?fmt(r.val):"—"}</span>
          </div>
        ))}
        <div style={{paddingTop:6,display:"flex",justifyContent:"space-between"}}>
          <span style={{fontSize:".52rem",color:C.red2,fontWeight:700}}>Toplam Gider</span>
          <span style={{fontSize:".64rem",fontWeight:900,color:C.red2}}>{fmt((f.spent||0)+salTotal+coachSalTotal)}</span>
        </div>
      </div>

      {/* Tahmini Sezon Geliri */}
      {(()=>{
        const ligler={"1. Lig":{yayin:700,forma:80,sponsor:150,stadyumK:8000,bilet:12,macSayisi:30},"Elit Lig":{yayin:2200,forma:380,sponsor:600,stadyumK:18000,bilet:22,macSayisi:34}};
        const lgData=ligler[league]||ligler["1. Lig"];
        const evMac=Math.round(lgData.macSayisi/2);
        const tahminiStadyum=Math.round(lgData.stadyumK*lgData.bilet*0.70/1000)*evMac;
        const tahminiYayin=lgData.yayin;
        const tahminiForma=lgData.forma;
        const tahminiSponsor=lgData.sponsor+(f.activeSponsors||[]).reduce((s,sp)=>{const d=(f.SPONSOR_DEALS||[]).find(dd=>dd.id===sp.dealId);return s+(d?d.amount*lgData.macSayisi:0);},0);
        const totalTahmini=tahminiStadyum+tahminiYayin+tahminiForma+tahminiSponsor;
        const giderTahmin=(salTotal+coachSalTotal)+(f.spent||0);
        const netTahmin=totalTahmini-giderTahmin;
        return(
          <div style={{background:C.card,borderRadius:8,padding:"10px 12px",marginTop:8,border:`1px solid rgba(39,174,96,.2)`}}>
            <div style={{fontSize:".46rem",color:C.grn2,textTransform:"uppercase",letterSpacing:1.5,marginBottom:6,fontWeight:700}}>📅 Tahmini Sezon Geliri</div>
            <div style={{fontSize:".42rem",color:C.dmr,marginBottom:8}}>Ortalama doluluk ve mevcut sırana göre projeksiyon</div>
            {[
              {icon:"🏟️",label:"Tahmini Stadyum",val:tahminiStadyum,col:"#1ab855"},
              {icon:"📺",label:"Tahmini Yayın",  val:tahminiYayin, col:"#3498db"},
              {icon:"👕",label:"Tahmini Forma",  val:tahminiForma, col:"#30e070"},
              {icon:"🤝",label:"Sponsor Geliri", val:tahminiSponsor,col:"#9b59b6"},
            ].map((r,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",
                padding:"4px 0",borderBottom:`1px solid rgba(77,166,255,0.1)`,fontSize:".52rem"}}>
                <span style={{color:C.dim}}>{r.icon} {r.label}</span>
                <span style={{fontWeight:700,color:r.col}}>{fmt(r.val)}</span>
              </div>
            ))}
            <div style={{marginTop:6,paddingTop:6,borderTop:`1px solid rgba(77,166,255,0.22)`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:".54rem",color:C.wh,fontWeight:700}}>📈 Tahmini Toplam</span>
              <span style={{fontSize:".72rem",fontWeight:900,color:C.grn2}}>{fmt(totalTahmini)}</span>
            </div>
            <div style={{marginTop:4,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:".52rem",color:C.dim}}>📊 Tahmini Net</span>
              <span style={{fontSize:".66rem",fontWeight:800,color:netTahmin>=0?C.grn2:C.red2}}>{netTahmin>=0?"+":""}{fmt(netTahmin)}</span>
            </div>
          </div>
        );
      })()}

      {/* Transfer Yasağı / Uyarı */}
      {f.transferBan&&(f.transferBan.active||f.transferBan.budgetWarning)&&(
        <div style={{background:f.transferBan.active?"rgba(142,68,173,.12)":"rgba(230,126,34,.10)",borderRadius:8,padding:"10px 12px",marginTop:8,border:`2px solid ${f.transferBan.active?"rgba(142,68,173,.4)":"rgba(230,126,34,.4)"}`}}>
          <div style={{fontSize:".56rem",fontWeight:800,color:f.transferBan.active?"#c39bd3":"#e67e22",marginBottom:4}}>
            {f.transferBan.active?"🚫 Transfer Yasağı Aktif":"⚠️ Bütçe Uyarısı"}
          </div>
          <div style={{fontSize:".48rem",color:f.transferBan.active?"#a569bd":"#e8975a",lineHeight:1.6}}>
            {f.transferBan.active
              ?<>Bütçe iki sezon üst üste ekside kaldı. Transfer yasağı uygulandı.<br/>Bütçeyi artıya çevirince yasak otomatik kalkar.<br/><span style={{color:C.red2,fontWeight:700}}>Şu anki bütçe: {fmt((f.transferBudget||0)+(f.wageBudget||0))}</span></>
              :<>Bütçe açığı tespit edildi! Gelecek sezon sonuna kadar kapatmazsan transfer yasağı ve -15 itibar cezası alırsın.<br/><span style={{color:"#e67e22",fontWeight:700}}>Şu anki bütçe: {fmt((f.transferBudget||0)+(f.wageBudget||0))}</span></>
            }
          </div>
        </div>
      )}
      </> }

      {/* ── BÜTÇE SPLIT ── */}
      {tab==="butce"&&<>
        {/* Gelir kalemleri */}
        <div style={{background:C.card,borderRadius:8,padding:"10px 12px",marginBottom:8,border:`1px solid rgba(39,174,96,.25)`}}>
          <div style={{fontSize:".46rem",color:C.grn2,textTransform:"uppercase",letterSpacing:1.5,marginBottom:8,fontWeight:700}}>📈 Gelir Kalemleri</div>
          {gelirRows.filter(r=>r.val>0).map((r,i)=>(
            <div key={i} style={{marginBottom:6}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
                <span style={{fontSize:".52rem",color:C.wh}}>{r.icon} {r.label}</span>
                <span style={{fontSize:".56rem",fontWeight:700,color:r.col}}>{fmt(r.val)}</span>
              </div>
              <div style={{height:4,background:C.surfaceHover,borderRadius:2,overflow:"hidden"}}>
                <div style={{height:"100%",width:pct(r.val,maxGelir)+"%",background:r.col,borderRadius:2,transition:"width .4s"}}/>
              </div>
            </div>
          ))}
          {gelirRows.every(r=>r.val===0)&&<div style={{fontSize:".5rem",color:C.dmr}}>— Henüz gelir yok</div>}
          <div style={{marginTop:8,paddingTop:6,borderTop:`1px solid rgba(77,166,255,0.1)`,display:"flex",justifyContent:"space-between"}}>
            <span style={{fontSize:".52rem",color:C.grn2,fontWeight:700}}>Toplam Gelir</span>
            <span style={{fontSize:".6rem",fontWeight:800,color:C.grn2}}>{fmt(totalGelir)}</span>
          </div>
        </div>
        {/* Gider kalemleri */}
        <div style={{background:C.card,borderRadius:8,padding:"10px 12px",marginBottom:8,border:`1px solid rgba(231,76,60,.25)`}}>
          <div style={{fontSize:".46rem",color:C.red2,textTransform:"uppercase",letterSpacing:1.5,marginBottom:8,fontWeight:700}}>📉 Gider Kalemleri</div>
          {[
            {icon:"💼",label:"Transfer Harcama",    val:f.spent||0,       col:C.red2},
            {icon:"💰",label:"Yıllık Kadro Maaşı",  val:salTotal,         col:"#e67e22"},
            {icon:"🏋️",label:"Antrenör Ücretleri",  val:coachSalTotal,    col:"#e67e22"},
          ].map((r,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",
              borderBottom:`1px solid rgba(77,166,255,0.1)`,fontSize:".56rem"}}>
              <span style={{color:C.dim}}>{r.icon} {r.label}</span>
              <span style={{fontWeight:700,color:r.col}}>{fmt(r.val)}</span>
            </div>
          ))}
          <div style={{marginTop:6,display:"flex",justifyContent:"space-between"}}>
            <span style={{fontSize:".52rem",color:C.red2,fontWeight:700}}>Toplam Gider</span>
            <span style={{fontSize:".6rem",fontWeight:800,color:C.red2}}>{fmt((f.spent||0)+salTotal+coachSalTotal)}</span>
          </div>
        </div>
        {/* Net + Bütçe */}
        <div style={{background:C.card,borderRadius:8,padding:"10px 12px",border:`1px solid rgba(77,166,255,0.22)`}}>
          <div style={{fontSize:".46rem",color:C.dim,textTransform:"uppercase",letterSpacing:1.5,marginBottom:8,fontWeight:700}}>💼 Bütçe Durumu</div>
          {[
            {icon:"🏃",label:"Transfer Bütçesi",val:f.transferBudget||0,max:Math.max(f.transferBudget||1,f.spent||1)*1.2,col:C.ac2,sub:`Harcanan: ${fmt(f.spent||0)}`},
            {icon:"💰",label:"Maaş Bütçesi",   val:f.wageBudget||0,  max:Math.max(f.wageBudget||1,weeklyWage)*1.3,col:C.grn2,sub:`Yıllık kadro: ${fmt(weeklyWage)}`},
          ].map((r,i)=>(
            <div key={i} style={{marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                <div>
                  <div style={{fontSize:".6rem",fontWeight:700,color:C.wh}}>{r.icon} {r.label}</div>
                  <div style={{fontSize:".46rem",color:C.dmr,marginTop:1}}>{r.sub}</div>
                </div>
                <div style={{fontSize:"1rem",fontWeight:900,color:r.col}}>{fmt(r.val)}</div>
              </div>
              <div style={{height:10,background:C.surfaceHover,borderRadius:5,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${Math.min(100,r.val/r.max*100)}%`,
                  background:`linear-gradient(90deg,${r.col}88,${r.col})`,borderRadius:5,transition:"width .5s"}}/>
              </div>
            </div>
          ))}
          <div style={{padding:"6px 8px",background:"rgba(26,110,216,.06)",borderRadius:5,border:`1px solid rgba(77,166,255,0.1)`,fontSize:".46rem",color:C.dim,lineHeight:1.6}}>
            💡 Her sezon başında tüm kadro maaşları bütçeden düşülür.<br/>
            📊 Net: <span style={{color:net>=0?C.grn2:C.red2,fontWeight:700}}>{net>=0?"+":""}{fmt(net)}</span>
          </div>
        </div>
      </>}

      {/* ── SPONSORLAR ── */}
      {tab==="sponsor"&&<>
        {/* Active sponsors */}
        {activeSponsors.length>0&&(
          <div style={{background:C.card,borderRadius:8,padding:"10px 12px",marginBottom:10,border:`1px solid rgba(142,68,173,.35)`}}>
            <div style={{fontSize:".46rem",color:C.pur2,textTransform:"uppercase",letterSpacing:1.5,marginBottom:8,fontWeight:700}}>✅ Aktif Sponsorlar</div>
            {activeSponsors.map((s,i)=>{
              const deal=SPONSOR_DEALS.find(d=>d.id===s.dealId);
              if(!deal) return null;
              return(
                <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 0",
                  borderBottom:`1px solid rgba(77,166,255,0.1)`}}>
                  <span style={{fontSize:"1.2rem"}}>{deal.logo}</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:".62rem",fontWeight:700,color:C.wh}}>{deal.name}</div>
                    <div style={{fontSize:".46rem",color:C.dmr}}>{deal.desc}</div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:".6rem",fontWeight:700,color:C.grn2}}>+{fmt(deal.amount)}/h</div>
                    <div style={{fontSize:".42rem",color:C.dmr}}>{s.weeksLeft} hafta kaldı</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Available deals */}
        <div style={{background:C.card,borderRadius:8,padding:"10px 12px",border:`1px solid rgba(77,166,255,0.22)`}}>
          <div style={{fontSize:".46rem",color:C.dim,textTransform:"uppercase",letterSpacing:1.5,marginBottom:4,fontWeight:700}}>
            📋 Sponsorluk Teklifleri
          </div>
          <div style={{fontSize:".44rem",color:C.dmr,marginBottom:8}}>
            İtibarın: <span style={{color:repPts>=50?C.grn2:repPts>=25?"#e67e22":C.red2,fontWeight:700}}>{repPts}/100</span>
            {" — "}Yüksek itibarla büyük sponsorlar açılır
          </div>
          {SPONSOR_DEALS.map((deal,i)=>{
            const isActive=activeSponsors.some(s=>s.dealId===deal.id);
            const isLocked=repPts<deal.requires;
            const tierColors={"TFF":"#7898c0","TFF+":"#e67e22","SL-":"#ffd060","SL":C.grn2,"Elite":C.pur2};
            const tierColor=tierColors[deal.tier]||C.dim;
            return(
              <div key={i} onClick={()=>!isLocked&&setSponsorSel(sponsorSel===deal.id?null:deal.id)}
                style={{padding:"9px 10px",marginBottom:6,cursor:isLocked?"not-allowed":"pointer",
                  opacity:isLocked?0.45:1,
                  background:isActive?"rgba(39,174,96,.08)":sponsorSel===deal.id?"rgba(45,143,255,.15)":"rgba(26,110,216,.04)",
                  border:`1px solid ${isActive?"rgba(39,174,96,.3)":sponsorSel===deal.id?C.ac2:C.brd2}`,
                  borderRadius:8,transition:"all .15s"}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:"1.3rem",flexShrink:0}}>{isLocked?"🔒":deal.logo}</span>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:".63rem",fontWeight:700,color:isLocked?C.dim:C.wh,display:"flex",alignItems:"center",gap:5,flexWrap:"wrap"}}>
                      {deal.name}
                      {isActive&&<span style={{fontSize:".4rem",color:C.grn2,fontWeight:700,
                        background:"rgba(39,174,96,.15)",border:"1px solid rgba(39,174,96,.3)",
                        borderRadius:3,padding:"1px 4px"}}>AKTİF</span>}
                      <span style={{fontSize:".38rem",color:tierColor,fontWeight:700,
                        background:`rgba(${tierColor==="C.dim"?"100,140,220":"0,0,0"},.1)`,
                        border:`1px solid ${tierColor}55`,borderRadius:3,padding:"1px 4px"}}>{deal.tier}</span>
                    </div>
                    <div style={{fontSize:".46rem",color:C.dmr,marginTop:1}}>{deal.desc}</div>
                    {isLocked&&<div style={{fontSize:".42rem",color:"#e67e22",marginTop:2}}>🔒 Gerekli itibar: {deal.requires}</div>}
                  </div>
                  <div style={{textAlign:"right",flexShrink:0}}>
                    <div style={{fontSize:".7rem",fontWeight:900,color:isLocked?C.dmr:C.pur2}}>+{fmt(deal.amount)}</div>
                    <div style={{fontSize:".4rem",color:C.dmr}}>{deal.duration} yıl</div>
                  </div>
                </div>
                {sponsorSel===deal.id&&!isActive&&!isLocked&&(
                  <div style={{marginTop:8,paddingTop:8,borderTop:`1px solid rgba(77,166,255,0.1)`}}>
                    <button onClick={(e)=>{e.stopPropagation();if(onAcceptSponsor)onAcceptSponsor(deal);}}
                      style={{width:"100%",padding:"8px 0",
                        background:`linear-gradient(135deg,#6c1d9e,${C.pur2})`,border:"none",color:"#fff",
                        fontSize:".6rem",fontWeight:700,cursor:"pointer",borderRadius:6,fontFamily:"inherit",
                        boxShadow:"0 4px 14px rgba(142,68,173,.4)"}}>
                      ✍️ Sponsorluğu İmzala
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </>}

      {/* ── HAREKETLER ── */}
      {tab==="hareketler"&&(
        <div style={{background:C.card,borderRadius:8,padding:"10px 12px",border:`1px solid rgba(77,166,255,0.22)`}}>
          <div style={{fontSize:".46rem",color:C.dim,textTransform:"uppercase",letterSpacing:1.5,marginBottom:6,fontWeight:700}}>Son Hareketler</div>
          {(f.weeklyLog||[]).length===0&&<div style={{fontSize:".56rem",color:C.dmr}}>Henüz hareket yok</div>}
          {(f.weeklyLog||[]).slice(0,30).map((l,i)=>{
            const isIncome=["stadyum","forma","yayin","sponsorluk","ligOdeme","kupaPrim","sell","sponsor_payout"].includes(l.type);
            const isInfo=["salary_add","salary_remove"].includes(l.type);
            const icons={stadyum:"🏟️",forma:"👕",yayin:"📺",sponsorluk:"🤝",ligOdeme:"🏆",kupaPrim:"🥇",sell:"💸",buy:"🛒",salary_weekly:"💰",salary_add:"📝",salary_remove:"✂️",sponsor_payout:"🤝"};
            if(isInfo) return null;
            return(
              <div key={i} style={{display:"flex",alignItems:"center",gap:6,padding:"3px 0",
                borderBottom:`1px solid rgba(77,166,255,0.1)`,fontSize:".54rem"}}>
                <span>{icons[l.type]||"•"}</span>
                <span style={{flex:1,color:C.wh,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.desc||l.type}</span>
                <span style={{fontWeight:700,color:isIncome?C.grn2:C.red2,minWidth:44,textAlign:"right"}}>
                  {isIncome?"+":"-"}{fmt(l.amount)}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* ── MAAŞLAR ── */}
      {tab==="maaslar"&&<>
        <STitle>Kadro Maaşları</STitle>
        {squad&&squad.slice().sort((a,b)=>(b.sal||0)-(a.sal||0)).map((p,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"4px 6px",
            borderBottom:`1px solid rgba(77,166,255,0.1)`,fontSize:".6rem"}}>
            <span style={{minWidth:28,fontSize:".5rem",color:C.dmr,
              background:C.surfaceHover,borderRadius:3,padding:"1px 3px",textAlign:"center"}}>{p.pos}</span>
            <span style={{flex:1,color:C.wh}}>{p.n}</span>
            <span style={{color:C.gd,fontWeight:700,minWidth:55,textAlign:"right"}}>{fmt(p.sal||0)}/yıl</span>
          </div>
        ))}
        {(!squad||squad.length===0)&&<div style={{fontSize:".6rem",color:C.dmr,padding:8}}>Kadro boş</div>}
        {/* Toplam maaş gideri */}
        {squad&&squad.length>0&&(
          <>
          <div style={{display:"flex",alignItems:"center",gap:8,padding:"7px 6px",
            borderTop:`2px solid ${C.brd}`,marginTop:2,fontSize:".6rem",
            background:"rgba(26,110,216,.06)"}}>
            <span style={{minWidth:28}}/>
            <span style={{flex:1,color:C.ac2,fontWeight:700}}>👥 {squad.length} Oyuncu Toplam</span>
            <span style={{color:C.red2,fontWeight:900,minWidth:55,textAlign:"right"}}>{fmt(salTotal)}/yıl</span>
          </div>
          {coachSalTotal>0&&(
            <div style={{display:"flex",alignItems:"center",gap:8,padding:"5px 6px",
              borderBottom:`1px solid rgba(77,166,255,0.1)`,fontSize:".6rem",
              background:C.card}}>
              <span style={{minWidth:28}}/>
              <span style={{flex:1,color:C.pur2,fontWeight:700}}>🏋️ {coaches.filter(c=>c.hired).length} Antrenör</span>
              <span style={{color:C.red2,fontWeight:700,minWidth:55,textAlign:"right"}}>{fmt(coachSalTotal)}/yıl</span>
            </div>
          )}
          <div style={{display:"flex",alignItems:"center",gap:8,padding:"7px 6px",
            fontSize:".64rem",background:"rgba(231,76,60,.08)",
            border:`1px solid rgba(231,76,60,.2)`,borderRadius:"0 0 6px 6px"}}>
            <span style={{minWidth:28}}/>
            <span style={{flex:1,color:C.red2,fontWeight:900}}>💸 TOPLAM MALİYET</span>
            <span style={{color:C.red2,fontWeight:900,minWidth:55,textAlign:"right"}}>{fmt(salTotal+coachSalTotal)}/yıl</span>
          </div>
          <div style={{padding:"5px 6px",fontSize:".46rem",color:C.dmr}}>
            Maaş bütçesi: <span style={{color:(f.wageBudget||0)>=salTotal+coachSalTotal?C.grn2:C.red2,fontWeight:700}}>{fmt(f.wageBudget||0)}</span>
            {" · "}Fark: <span style={{color:(f.wageBudget||0)-(salTotal+coachSalTotal)>=0?C.grn2:C.red2,fontWeight:700}}>{fmt((f.wageBudget||0)-(salTotal+coachSalTotal))}</span>
          </div>
          </>
        )}
      </>}
    </div>
  );
}
