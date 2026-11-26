function PageItibar({rep,league}){
  const pts=rep?rep.pts:30;
  const hist=rep?(rep.history||[]):[];
  const col=pts>=70?C.grn2:pts>=40?"#e67e22":C.red2;
  const lbl=pts>=80?"Efsanevi":pts>=60?"Tanınmış":pts>=40?"Orta Düzey":pts>=20?"Düşük":"Bilinmez";
  const tiers=[
    {min:80,max:100,label:"Efsanevi",  desc:"Dünya yıldızları sizi tercih eder",     col:"#ffd060"},
    {min:60,max:79, label:"Tanınmış",  desc:"İyi oyuncuları kolaylıkla alırsınız",   col:C.grn2},
    {min:40,max:59, label:"Orta",      desc:"Ortalama oyuncular ilgi gösterir",      col:"#3498db"},
    {min:20,max:39, label:"Düşük",     desc:"Transfer pazarında zorluk çekersiniz",  col:"#e67e22"},
    {min:0,  max:19,label:"Bilinmez",  desc:"Neredeyse hiç seçeneğiniz yok",        col:C.red2},
  ];
  const LIG_MULT_LABELS={
    "İngiliz Ligi":{m:"×1.4",col:C.grn2,cl:null},
    "İspanyol Ligi":{m:"×1.35",col:C.grn2,cl:null},
    "Alman Ligi":{m:"×1.3",col:C.grn2,cl:null},
    "İtalyan Ligi":{m:"×1.25",col:C.grn2,cl:null},
    "Fransız Ligi":{m:"×1.2",col:"#e67e22",cl:null},
    "Elit Lig":{m:"×1.1",col:"#e67e22",cl:null},
    "Hollanda Ligi":{m:"×1.1",col:"#e67e22",cl:null},
    "Portekiz Ligi":{m:"×1.0",col:"#e67e22",cl:null},
    "İngiliz 2. Ligi":{m:"×0.85",col:C.red2,cl:"İlk 3 → İngiliz Ligi (terfi) · Avrupa kotası yok"},
    "Scottish Prem":{m:"×0.7",col:C.red2,cl:"Avrupa kotası yok"},
    "1. Lig":{m:"×0.75",col:C.red2,cl:"Avrupa kotası yok — önce Süper Lig'e çık"},
    "MLS":{m:"×0.7",col:C.red2,cl:"Avrupa kotası yok"},
    "Saudi Pro League":{m:"×0.8",col:C.red2,cl:"Avrupa kotası yok"},
  };
  const _li=LIG_MULT_LABELS[league]||{m:"×0.8",col:C.dmr,cl:"Bilinmeyen lig"};
  const ligInfo=EURO_QUOTA[league]?{..._li,cl:euroQuotaText(league)+" (eksik slotlar büyük liglerden 36'ya tamamlanır)"}:_li;
  return(
    <div style={{flex:1,overflowY:"auto",padding:12}}>
      <STitle extra={lbl}>Kulüp İtibarı</STitle>
      <div style={{background:C.card,borderRadius:10,padding:14,marginBottom:12,border:`1px solid rgba(77,166,255,0.22)`}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
          <span style={{fontSize:".6rem",color:C.dim}}>Mevcut İtibar</span>
          <span style={{fontSize:"1.4rem",fontWeight:900,color:col}}>{pts}<span style={{fontSize:".5rem",color:C.dmr}}>/100</span></span>
        </div>
        <div style={{height:10,background:"rgba(255,255,255,.06)",borderRadius:6,overflow:"hidden",marginBottom:6}}>
          <div style={{width:pts+"%",height:"100%",background:`linear-gradient(90deg,${col}88,${col})`,borderRadius:6}}/>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:".42rem",color:C.dmr}}>
          <span>0</span><span>40</span><span>60</span><span>80</span><span>100</span>
        </div>
      </div>
      {/* Lig bilgisi kartı */}
      <div style={{background:"rgba(26,110,216,.06)",border:"1px solid rgba(26,110,216,.15)",borderRadius:8,padding:"10px 12px",marginBottom:12}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
          <span style={{fontSize:".5rem",color:C.dmr}}>Lig:</span>
          <span style={{fontSize:".62rem",fontWeight:700,color:C.wh}}>{league}</span>
          <span style={{marginLeft:"auto",fontSize:".62rem",fontWeight:700,color:ligInfo.col}}>İtibar Çarpanı {ligInfo.m}</span>
        </div>
        <div style={{fontSize:".52rem",color:"#ffd060",display:"flex",alignItems:"center",gap:4}}>
          <span>⭐</span>
          <span>{ligInfo.cl}</span>
        </div>
        <div style={{marginTop:4,fontSize:".44rem",color:C.dmr}}>Kazanım çarpanı lig seviyesine göre değişir. Kayıplar her zaman çarpansız işler.</div>
      </div>
      <div style={{marginBottom:12}}>
        <div style={{fontSize:".5rem",color:C.dmr,letterSpacing:1,textTransform:"uppercase",marginBottom:5}}>Kademeler</div>
        {tiers.map((t,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",background:pts>=t.min&&pts<=t.max?"rgba(45,143,255,.12)":C.card,borderRadius:7,marginBottom:3,border:`1px solid ${pts>=t.min&&pts<=t.max?C.ac2:C.brd}`}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:t.col,flexShrink:0}}/>
            <div style={{flex:1}}>
              <span style={{fontSize:".6rem",color:pts>=t.min&&pts<=t.max?t.col:C.wh,fontWeight:600}}>{t.label} ({t.min}-{t.max}) </span>
              <span style={{fontSize:".5rem",color:C.dim}}>{t.desc}</span>
            </div>
            {pts>=t.min&&pts<=t.max&&<span style={{fontSize:".5rem",color:C.ac2}}>◀ Şu an</span>}
          </div>
        ))}
      </div>
      <div>
        <div style={{fontSize:".5rem",color:C.dmr,letterSpacing:1,textTransform:"uppercase",marginBottom:5}}>Son Hareketler</div>
        {hist.length===0&&<div style={{fontSize:".6rem",color:C.dmr,padding:"8px 0"}}>Henüz hareket yok</div>}
        {hist.slice(0,15).map((h,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 8px",borderBottom:`1px solid rgba(77,166,255,0.1)`}}>
            <span style={{fontWeight:700,fontSize:".58rem",minWidth:30,color:h.delta>0?C.grn2:h.delta<0?C.red2:C.dim}}>{h.delta>0?"+":""}{h.delta}</span>
            <span style={{flex:1,fontSize:".58rem",color:C.wh}}>{h.reason}</span>
            <span style={{fontSize:".5rem",color:C.dmr}}>{h.date}</span>
            <span style={{fontWeight:700,fontSize:".56rem",color:C.ac2,minWidth:20,textAlign:"right"}}>{h.pts}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
