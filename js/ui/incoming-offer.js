function IncomingOfferModal({offer,onAccept,onReject,onClose,squad=[]}){
  const pl=offer.player;
  const livePl=squad.find(p=>p.id===pl.id)||pl;
  const liveVal=livePl.val||pl.val||0;
  const [counter,setCounter]=useState(null);
  const [negotiation,setNegotiation]=useState(null); // {round,clubResponse,finalOffer}
  const base=offer.offerVal||0;
  const minVal=Math.round(Math.max(base*0.8, base-2));
  const maxVal=Math.round(base*1.8);
  const [myVal,setMyVal]=useState(Math.round(liveVal*1.05));
  const gc=pl.ovr>=90?"#ff5050":pl.ovr>=80?"#ffd060":pl.ovr>=70?"#b0bec5":pl.ovr>=60?"#cd7f32":"#e8975a";
  const isGoodOffer=base>=liveVal*0.9;

  // Karşı teklif müzakeresi — kulüp tepkisi simüle et
  const doCounterOffer=()=>{
    const demanded=myVal;
    const gap=demanded-base;
    const gapPct=base>0?gap/base:0;
    let response,finalOffer=null,accepts=false;
    if(gapPct<=0.05){
      // Çok yakın — kabul et
      accepts=true;
      finalOffer=demanded;
      response=`✅ ${offer.club} teklifinizi kabul etti! ${demanded}M€'ya anlaştınız.`;
    } else if(gapPct<=0.20){
      // Orta — buluşalım
      finalOffer=Math.round((base+demanded)/2*10)/10;
      accepts=true;
      response=`🤝 ${offer.club} ortadan buluşmayı teklif etti: ${finalOffer}M€`;
    } else if(gapPct<=0.40){
      // Biraz yüksek — kısmen iyileştirdi
      finalOffer=Math.round((base*1.08)*10)/10;
      accepts=Math.random()<0.4;
      response=accepts
        ?`💰 ${offer.club} teklifini ${finalOffer}M€'ya yükseltti ve bunu son teklif olarak sundu.`
        :`😤 ${offer.club}: "${demanded}M€ gerçekçi değil. En fazla ${finalOffer}M€ verebiliriz."`;
    } else {
      // Çok yüksek — reddetti
      response=`❌ ${offer.club}: "Talep ettiğiniz ${demanded}M€ bütçemizi aşıyor. Anlaşamıyoruz."`;
    }
    setNegotiation({round:1,response,finalOffer,accepts});
    setCounter(null);
  };

  return(
    <div style={{
      background:"linear-gradient(145deg,#0d1e3a,#070e1e)",
      border:`2px solid ${C.gd}`,borderRadius:14,
      padding:0,maxWidth:310,width:"100%",
      boxShadow:`0 0 40px rgba(232,184,58,.2),0 16px 48px rgba(0,0,0,.95)`,
      overflow:"hidden"
    }}>
      <div style={{height:3,background:`linear-gradient(90deg,transparent,${C.gd},transparent)`}}/>
      <div style={{padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",
        borderBottom:`1px solid rgba(232,184,58,.15)`}}>
        <div style={{display:"flex",alignItems:"center",gap:7}}>
          <div style={{width:28,height:28,borderRadius:"50%",background:"rgba(232,184,58,.15)",
            border:`1px solid rgba(232,184,58,.4)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:".9rem"}}>📨</div>
          <div>
            <div style={{fontSize:".52rem",fontWeight:800,color:C.gd,letterSpacing:1.5,textTransform:"uppercase"}}>Gelen Teklif</div>
            <div style={{fontSize:".44rem",color:C.dmr}}>{offer.club}</div>
          </div>
        </div>
        <button onClick={onClose} style={{background:"rgba(255,255,255,.05)",border:`1px solid rgba(77,166,255,0.22)`,
          color:C.dim,cursor:"pointer",fontSize:".7rem",width:24,height:24,borderRadius:"50%",
          display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"inherit"}}>✕</button>
      </div>

      <div style={{padding:"12px 14px"}}>
        {/* Player info */}
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12,padding:"10px 12px",
          background:`linear-gradient(135deg,rgba(26,110,216,.1),rgba(26,110,216,.04))`,
          border:`1px solid ${gc}33`,borderRadius:9}}>
          <div style={{width:42,height:42,borderRadius:"50%",flexShrink:0,
            background:`conic-gradient(${gc} ${pl.ovr*3.6}deg,rgba(255,255,255,.05) 0deg)`,
            display:"flex",alignItems:"center",justifyContent:"center"}}>
            <div style={{width:32,height:32,borderRadius:"50%",background:"#071226",
              display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
              <div style={{fontSize:".8rem",fontWeight:900,color:gc,lineHeight:1}}>{pl.ovr}</div>
              <div style={{fontSize:".32rem",color:gc,opacity:.8}}>{pl.pos}</div>
            </div>
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:".78rem",fontWeight:800,color:C.wh,marginBottom:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{pl.n}</div>
            <div style={{display:"flex",gap:8,fontSize:".5rem",color:C.dim}}>
              <span>Yaş {pl.age}</span>
              <span style={{color:gc}}>POT {pl.pot}</span>
            </div>
            {/* Trait rozeti */}
            {livePl.traits&&livePl.traits.length>0&&<div style={{display:"flex",gap:3,marginTop:3,flexWrap:"wrap"}}>
              {livePl.traits.map(t=>{const tr=PLAYER_TRAITS[t];return tr?(<span key={t} style={{fontSize:".34rem",padding:"1px 4px",borderRadius:6,background:"rgba(155,89,182,.15)",border:"1px solid rgba(155,89,182,.3)",color:"#b39ddb"}}>{tr.icon} {tr.label}</span>):null;})}
            </div>}
          </div>
          <div style={{width:26,height:26,borderRadius:5,flexShrink:0,background:`${gc}18`,border:`1px solid ${gc}55`,
            display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:".72rem",color:gc}}>
            {pl.ovr>=90?"⭐":pl.ovr>=80?"A":pl.ovr>=70?"B":pl.ovr>=60?"C":"D"}
          </div>
        </div>

        {/* Teklif detayları */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:12}}>
          <div style={{padding:"8px 10px",borderRadius:7,
            background:`${isGoodOffer?"rgba(46,204,113,.1)":"rgba(232,184,58,.08)"}`,
            border:`1px solid ${isGoodOffer?"rgba(39,174,96,.3)":"rgba(232,184,58,.3)"}`}}>
            <div style={{fontSize:".4rem",color:C.dmr,textTransform:"uppercase",letterSpacing:.8,marginBottom:2}}>Teklif Bedeli</div>
            <div style={{fontSize:".88rem",fontWeight:900,color:C.gd}}>{base>0?`${base}M€`:"Serbest"}</div>
            <div style={{fontSize:".4rem",color:C.dmr,marginTop:1}}>Piyasa: {liveVal}M€</div>
          </div>
          <div style={{padding:"8px 10px",borderRadius:7,background:"rgba(26,110,216,.08)",border:`1px solid rgba(77,166,255,0.22)`}}>
            <div style={{fontSize:".4rem",color:C.dmr,textTransform:"uppercase",letterSpacing:.8,marginBottom:2}}>Teklif Eden</div>
            <div style={{fontSize:".72rem",fontWeight:800,color:C.wh,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{offer.club}</div>
          </div>
          <div style={{padding:"8px 10px",borderRadius:7,background:"rgba(26,110,216,.06)",border:`1px solid rgba(77,166,255,0.22)`}}>
            <div style={{fontSize:".4rem",color:C.dmr,textTransform:"uppercase",letterSpacing:.8,marginBottom:2}}>Mevcut Maaş</div>
            <div style={{fontSize:".68rem",fontWeight:700,color:C.dim}}>{fmtSal(pl.sal||20)}/yıl</div>
          </div>
          <div style={{padding:"8px 10px",borderRadius:7,background:"rgba(36,133,255,.1)",border:`1px solid rgba(36,133,255,.3)`}}>
            <div style={{fontSize:".4rem",color:C.dmr,textTransform:"uppercase",letterSpacing:.8,marginBottom:2}}>Yeni Maaş</div>
            <div style={{fontSize:".68rem",fontWeight:800,color:C.ac2}}>{offer.offerSal||0}K€/yıl</div>
          </div>
        </div>

        {/* Müzakere slider */}
        {counter&&!negotiation&&(
          <div style={{marginBottom:12,padding:"10px 12px",background:"rgba(232,184,58,.06)",
            border:`1px solid rgba(232,184,58,.25)`,borderRadius:8}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
              <div style={{fontSize:".44rem",color:C.dmr,textTransform:"uppercase",letterSpacing:.8}}>Karşı Teklifin</div>
              <div style={{fontSize:".88rem",fontWeight:900,color:C.gd}}>{myVal}M€</div>
            </div>
            <input type="range" min={minVal} max={maxVal} step="0.5" value={myVal}
              onChange={e=>setMyVal(parseFloat(e.target.value))}
              onTouchStart={e=>e.stopPropagation()} onTouchMove={e=>e.stopPropagation()}
              style={{width:"100%",accentColor:C.gd,cursor:"pointer",touchAction:"none"}}/>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:".4rem",color:C.dmr,marginTop:3}}>
              <span>{minVal}M€</span><span style={{color:myVal>=liveVal?"#30e070":C.gd}}>{myVal>=liveVal?"✅ İyi Fiyat":"⚠️ Altı"}</span><span>{maxVal}M€</span>
            </div>
            <button onClick={doCounterOffer} style={{width:"100%",marginTop:8,padding:"8px 0",
              background:"linear-gradient(135deg,rgba(232,184,58,.25),rgba(232,184,58,.1))",
              border:`1px solid ${C.gd}`,color:C.gd,fontSize:".58rem",fontWeight:700,
              cursor:"pointer",borderRadius:6,fontFamily:"inherit"}}>
              📤 {myVal}M€ ile Karşı Teklif Yap
            </button>
          </div>
        )}

        {/* Müzakere sonucu */}
        {negotiation&&(
          <div style={{marginBottom:12,padding:"10px 12px",
            background:negotiation.accepts?"rgba(39,174,96,.08)":"rgba(231,76,60,.08)",
            border:`1px solid ${negotiation.accepts?"rgba(39,174,96,.3)":"rgba(231,76,60,.3)"}`,borderRadius:8}}>
            <div style={{fontSize:".56rem",color:C.wh,lineHeight:1.5,marginBottom:8}}>{negotiation.response}</div>
            {negotiation.accepts&&negotiation.finalOffer&&(
              <button onClick={()=>onAccept({...offer,finalVal:negotiation.finalOffer})} style={{
                width:"100%",padding:"8px 0",background:"linear-gradient(135deg,rgba(39,174,96,.3),rgba(39,174,96,.15))",
                border:`1px solid ${C.grn2}`,color:C.grn2,fontSize:".6rem",fontWeight:800,
                cursor:"pointer",borderRadius:6,fontFamily:"inherit"}}>
                ✅ {negotiation.finalOffer}M€'ya Kabul Et
              </button>
            )}
          </div>
        )}

        {/* Butonlar */}
        {!negotiation&&(
          <div style={{display:"flex",gap:6}}>
            {!counter&&base>0&&(
              <button onClick={()=>setCounter(true)} style={{flex:1,padding:"9px 0",
                background:"rgba(232,184,58,.1)",border:`1px solid rgba(232,184,58,.4)`,color:C.gd,
                fontSize:".58rem",fontWeight:700,cursor:"pointer",borderRadius:7,fontFamily:"inherit"}}>
                ⚖️ Pazarlık
              </button>
            )}
            <button onClick={()=>onAccept({...offer,finalVal:base})} style={{flex:1,padding:"9px 0",
              background:"linear-gradient(135deg,rgba(39,174,96,.25),rgba(39,174,96,.15))",
              border:`1px solid ${C.grn2}`,color:C.grn2,fontSize:".58rem",fontWeight:800,
              cursor:"pointer",borderRadius:7,fontFamily:"inherit",boxShadow:"0 3px 12px rgba(39,174,96,.25)"}}>
              ✅ Kabul
            </button>
            <button onClick={()=>onReject(offer)} style={{flex:1,padding:"9px 0",
              background:"rgba(232,64,64,.1)",border:`1px solid rgba(231,76,60,.4)`,color:C.red2,
              fontSize:".58rem",fontWeight:700,cursor:"pointer",borderRadius:7,fontFamily:"inherit"}}>
              ❌ Reddet
            </button>
          </div>
        )}
        {negotiation&&!negotiation.accepts&&(
          <button onClick={()=>onReject(offer)} style={{width:"100%",padding:"9px 0",
            background:"rgba(232,64,64,.1)",border:`1px solid rgba(231,76,60,.4)`,color:C.red2,
            fontSize:".58rem",fontWeight:700,cursor:"pointer",borderRadius:7,fontFamily:"inherit"}}>
            ❌ Reddet
          </button>
        )}
      </div>
    </div>
  );
}
