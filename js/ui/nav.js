// ═══════════════════════════════════════════════════════════════
// NAVİGASYON
// ═══════════════════════════════════════════════════════════════
const NAV=[
  {i:"🏠",l:"Ana Sayfa", p:"home"},
  {i:"📅",l:"Fikstür",   p:"fikstur"},
  {i:"👥",l:"Kadro",     p:"kadro"},
  {i:"🎯",l:"Form & Taktik",p:"formasyon"},
  {i:"🏋️",l:"Antrenman", p:"antrenman"},
  {i:"🔄",l:"Transfer",  p:"transfer"},
  {i:"⭐",l:"Altyapı",   p:"yetenek"},
  {i:"💰",l:"Finans",    p:"finans"},
  {i:"📊",l:"İstatistik",p:"istatistik",ic:"chart"},
  {i:"⭐",l:"İtibar",    p:"itibar"},
  {i:"•••",l:"Diğer",   p:"diger"},
];
// ═══════════════════════════════════════════════════════════════
// AYARLAR SAYFASI
// ═══════════════════════════════════════════════════════════════
function PageAyarlar({transferPace="normal",onPaceChange=()=>{},skipPreMatch=false,onSkipPreMatchChange=()=>{}}){
  const PACES=[
    {key:"slow",  icon:"🐢", label:"Yavaş",     color:"#5dade2",
     desc:"Transfer teklifleri çok nadir gelir. Sakin bir pazar deneyimi yaşarsın."},
    {key:"normal",icon:"⚽", label:"Normal",    color:"#30e070",
     desc:"Gerçekçi transfer hareketliliği. Her pencerede makul sayıda teklif."},
    {key:"fast",  icon:"🔥", label:"Hareketli", color:"#ff5050",
     desc:"Pazar çok hareketli — oyuncularına sık sık teklif gelir, kararları hızlı alman gerekir!"},
  ];
  return(
    <div style={{flex:1,display:"flex",flexDirection:"column",minHeight:0,overflowY:"auto",padding:"12px 10px",gap:16}}>
      {/* Başlık */}
      <div style={{padding:"10px 14px",background:C.inset,borderRadius:8,
        border:`1px solid rgba(77,166,255,0.1)`}}>
        <div style={{fontSize:".7rem",fontWeight:800,color:C.ac2,letterSpacing:1,marginBottom:3}}>⚙️ OYUN AYARLARI</div>
        <div style={{fontSize:".48rem",color:C.dim}}>Bu ayarlar kayıt dosyasına da yansır.</div>
      </div>

      {/* Görünüm: Gece / Gündüz */}
      <div style={{background:C.inset,borderRadius:8,border:`1px solid ${C.brd2}`,padding:"10px 14px",
        display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
        <div>
          <div style={{fontSize:".62rem",fontWeight:800,color:C.wh,letterSpacing:.5}}>Görünüm Teması</div>
          <div style={{fontSize:".46rem",color:C.dim,marginTop:2}}>Gece (koyu) veya Gündüz (açık) arayüz — bu cihazda hatırlanır</div>
        </div>
        <ThemeToggleButton/>
      </div>

      {/* Transfer Hareketliliği */}
      <div style={{background:C.inset,borderRadius:8,border:`1px solid rgba(77,166,255,0.1)`,overflow:"hidden"}}>
        <div style={{padding:"9px 14px",borderBottom:`1px solid rgba(77,166,255,0.1)`,
          background:C.surface}}>
          <div style={{fontSize:".62rem",fontWeight:800,color:C.wh,letterSpacing:.5}}>⚡ Transfer Pazarı Hareketliliği</div>
          <div style={{fontSize:".46rem",color:C.dim,marginTop:2}}>
            Rakip kulüplerin ne sıklıkla transfer teklifi yapacağını belirle
          </div>
        </div>
        <div style={{padding:"10px 12px",display:"flex",flexDirection:"column",gap:8}}>
          {PACES.map(({key,icon,label,color,desc})=>{
            const active=transferPace===key;
            return(
              <button key={key} onClick={()=>onPaceChange(key)}
                style={{
                  display:"flex",alignItems:"center",gap:12,
                  padding:"10px 12px",borderRadius:7,cursor:"pointer",
                  fontFamily:"inherit",textAlign:"left",
                  background:active?`${color}18`:C.surface,
                  border:`2px solid ${active?color:C.brd2}`,
                  transition:"all .18s"
                }}>
                {/* İkon + Seçim */}
                <div style={{
                  width:36,height:36,borderRadius:8,
                  background:active?`${color}30`:C.surfaceHover,
                  border:`1px solid ${active?color:C.brd2}`,
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:"1.1rem",flexShrink:0
                }}>{icon}</div>
                {/* Label + Açıklama */}
                <div style={{flex:1}}>
                  <div style={{
                    fontSize:".6rem",fontWeight:active?800:600,
                    color:active?color:C.wh,letterSpacing:active?.3:0,
                    marginBottom:2
                  }}>{label}</div>
                  <div style={{fontSize:".46rem",color:active?`${color}cc`:C.dim,lineHeight:1.4}}>{desc}</div>
                </div>
                {/* Aktif göstergesi */}
                {active&&<div style={{
                  width:8,height:8,borderRadius:"50%",
                  background:color,boxShadow:`0 0 6px ${color}`,flexShrink:0
                }}/>}
              </button>
            );
          })}
        </div>
        {/* Aktif durum özeti */}
        <div style={{padding:"8px 14px",borderTop:`1px solid rgba(77,166,255,0.1)`,
          background:C.inset,display:"flex",alignItems:"center",gap:6}}>
          <span style={{fontSize:".48rem",color:C.dim}}>Mevcut ayar:</span>
          <span style={{
            fontSize:".52rem",fontWeight:800,
            color:PACES.find(p=>p.key===transferPace)?.color||C.ac2
          }}>
            {PACES.find(p=>p.key===transferPace)?.icon} {PACES.find(p=>p.key===transferPace)?.label}
          </span>
        </div>
      </div>

      {/* Maç Hazırlığı ekranı */}
      <div style={{background:C.inset,borderRadius:8,border:`1px solid rgba(77,166,255,0.1)`,
        padding:"10px 14px",display:"flex",alignItems:"center",gap:12}}>
        <div style={{flex:1}}>
          <div style={{fontSize:".62rem",fontWeight:800,color:C.wh,letterSpacing:.5}}>📋 Maç Hazırlığı Ekranı</div>
          <div style={{fontSize:".46rem",color:C.dim,marginTop:2,lineHeight:1.4}}>
            OYNA'ya basınca rakibin scout raporu ve taktik eşleşmesi gösterilir. Bu tercih cihaza kaydedilir.
          </div>
        </div>
        <button onClick={()=>onSkipPreMatchChange(!skipPreMatch)} style={{
          flexShrink:0,padding:"6px 12px",borderRadius:14,cursor:"pointer",fontFamily:"inherit",
          fontSize:".5rem",fontWeight:800,
          background:!skipPreMatch?"rgba(48,224,112,.18)":C.surfaceHover,
          border:`1px solid ${!skipPreMatch?"#30e070":C.brd2}`,
          color:!skipPreMatch?"#30e070":C.dim}}>{!skipPreMatch?"AÇIK":"KAPALI"}</button>
      </div>

      {/* Bilgi kutusu */}
      <div style={{padding:"10px 14px",background:"rgba(52,152,219,.08)",borderRadius:8,
        border:"1px solid rgba(52,152,219,.25)"}}>
        <div style={{fontSize:".52rem",fontWeight:700,color:"#5dade2",marginBottom:4}}>💡 Nasıl Çalışır?</div>
        <div style={{fontSize:".46rem",color:"#8ab4c8",lineHeight:1.6}}>
          • <b>Yavaş:</b> Teklif ihtimali %85 azalır. Sezon başında bile çok az teklif gelir.<br/>
          • <b>Normal:</b> Standart hareketlilik. Transfer penceresinde daha fazla, dışında az teklif.<br/>
          • <b>Hareketli:</b> Teklif ihtimali 3.5× artar. Kadronun yıldızları için sürekli teklif beklenir.<br/>
          Ayar istediğin zaman değiştirilebilir ve kaydedilir.
        </div>
      </div>
    </div>
  );
}

const DIGER_PAGES=[
  {i:"📰",l:"Haberler",     p:"haberler"},
  {i:"🏟️",l:"Takımlar",    p:"takimlar"},
  {i:"🎤",l:"Basın",        p:"basin"},
  {i:"👥",l:"İlişkiler",   p:"taraftar"},
  {i:"📖",l:"Oyun Rehberi", p:"rehber"},
  {i:"⚙️",l:"Ayarlar",       p:"ayarlar"},
];
const LABELS={merkez:"Kulüp Kampüsü",home:"Kulüp Yönetimi",kadro:"Kadro",fikstur:"Fikstür",formasyon:"Form & Taktik",
  antrenman:"Antrenman",transfer:"Transfer Pazarı",yetenek:"Altyapı",
  diger:"Diğer",kaydet:"Kaydet / Yükle",haberler:"Haberler",finans:"Finans",
  istatistik:"İstatistikler",takimlar:"Takımlar",ayarlar:"Ayarlar"};

// ═══════════════════════════════════════════════════════════════
// ALT NAVİGASYON (6 ana sekme) + CANLI DURUM & HABER BANDI
// ═══════════════════════════════════════════════════════════════
const HUB_TABS=[
  {i:"🏟️",l:"Merkez", p:"merkez",ic:"stadium", pages:["merkez"]},
  {i:"🏆",l:"Lig",    p:"home",ic:"trophy",   pages:["home","takimlar"]},
  {i:"📅",l:"Fikstür",p:"fikstur",ic:"calendar",pages:["fikstur"]},
  {i:"👥",l:"Kadro",  p:"kadro",ic:"users",  pages:["kadro"]},
  {i:"📋",l:"Taktik", p:"formasyon",ic:"tactics",pages:["formasyon"]},
  {i:"💼",l:"Kulüp",  p:"kulup",ic:"briefcase",  pages:[]},
];
// Kulüp çekmecesi (3×3). Transfer/Antrenman/Altyapı/Finans → 3D Kampüs; Fikstür → alt bar
const KULUP_PAGES=[
  {i:"📊",l:"İstatistik", p:"istatistik",ic:"chart"},
  {i:"👥",l:"İlişkiler",  p:"taraftar",ic:"handshake"},
  {i:"🏅",l:"İtibar",     p:"itibar",ic:"medal"},
  {i:"📰",l:"Haberler",   p:"haberler",ic:"news"},
  {i:"🎤",l:"Basın",      p:"basin",ic:"mic"},
  {i:"🏟️",l:"Takımlar",   p:"takimlar",ic:"shield"},
  {i:"⚙️",l:"Ayarlar",    p:"ayarlar",ic:"settings"},
  {i:"💾",l:"Kaydet",     p:"kaydet",ic:"save"},
  {i:"📖",l:"Rehber",     p:"rehber",ic:"book"},
];

function StatusTicker({items=[],onMatch,matchDisabled=false,matchLabel="MAÇ"}){
  const list=items.filter(Boolean);
  const row=(k)=>(
    <div key={k} style={{display:"flex",flexShrink:0,alignItems:"center"}}>
      {list.map((t,i)=>(
        <span key={i} style={{display:"inline-flex",alignItems:"center",gap:4,padding:"0 14px",whiteSpace:"nowrap",
          fontSize:".52rem",fontWeight:600,color:t.c||C.wh,borderRight:`1px solid ${C.brd2}`}}>
          {t.i&&<span>{t.i}</span>}{t.t}
        </span>
      ))}
    </div>
  );
  // Süre içerik uzunluğuyla orantılı → her cihazda okunabilir hız
  const dur=Math.max(18,list.reduce((a,t)=>a+String(t.t).length,0)*0.28);
  return(
    <div style={{display:"flex",alignItems:"stretch",height:30,flexShrink:0,background:C.nav,
      borderTop:`1px solid ${C.brd}`}}>
      <div style={{flexShrink:0,display:"flex",alignItems:"center",padding:"0 8px",background:C.red2,color:"#fff",
        fontSize:".46rem",fontWeight:900,letterSpacing:1}}>CANLI</div>
      <div style={{flex:1,overflow:"hidden",position:"relative",display:"flex",alignItems:"center"}}>
        <div className="ticker-track" style={{display:"flex",animationDuration:`${dur}s`}}>{row("a")}{row("b")}</div>
      </div>
      <button onClick={onMatch} disabled={matchDisabled} title="Sonraki maça git" style={{flexShrink:0,border:"none",
        padding:"0 14px",cursor:matchDisabled?"not-allowed":"pointer",fontFamily:"inherit",
        background:matchDisabled?C.card2:"linear-gradient(135deg,#16a34a,#22c55e)",
        color:matchDisabled?C.dmr:"#fff",fontSize:".62rem",fontWeight:900,letterSpacing:1,
        boxShadow:matchDisabled?"none":"inset 0 1px 0 rgba(255,255,255,.25)"}}>⚽ {matchLabel}</button>
    </div>
  );
}

function BottomNav({page,kulupOpen,onTab,onKulupPick}){
  const inKulup=KULUP_PAGES.some(k=>k.p===page)&&!HUB_TABS.some(t=>t.pages.includes(page));
  return(
    <div style={{position:"relative",flexShrink:0}}>
      {kulupOpen&&(
        <div className="fade-in-up" style={{position:"absolute",bottom:"100%",left:6,right:6,zIndex:60,marginBottom:36,
          background:C.card,border:`1px solid ${C.brd}`,borderRadius:12,padding:8,
          boxShadow:"0 -8px 30px rgba(0,0,0,.25)",display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6}}>
          {KULUP_PAGES.map(k=>{const a=page===k.p;return(
            <button key={k.p} onClick={()=>onKulupPick(k.p)} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,
              padding:"8px 2px",borderRadius:9,cursor:"pointer",fontFamily:"inherit",
              background:a?C.ac3:C.surface,border:`1px solid ${a?C.ac2:C.brd2}`,color:a?C.ac2:C.wh}}>
              <AppIcon name={k.ic} size={20} stroke={1.8}/>
              <span style={{fontSize:".46rem",fontWeight:700,letterSpacing:.3}}>{k.l}</span>
            </button>);})}
        </div>
      )}
      <div style={{display:"flex",height:52,background:C.nav,borderTop:`1px solid ${C.brd}`}}>
        {HUB_TABS.map(t=>{
          const a=t.p==="kulup"?(kulupOpen||inKulup):t.pages.includes(page);
          return(
            <button key={t.p} onClick={()=>onTab(t.p)} style={{flex:"1 1 0",minWidth:0,padding:"0 1px",display:"flex",flexDirection:"column",alignItems:"center",
              justifyContent:"center",gap:2,border:"none",cursor:"pointer",fontFamily:"inherit",position:"relative",
              background:a?C.ac3:"transparent",color:a?C.ac2:C.dim}}>
              {a&&<div style={{position:"absolute",top:0,left:"22%",right:"22%",height:3,borderRadius:"0 0 3px 3px",background:C.ac2}}/>}
              <AppIcon name={t.ic} size={20} stroke={a?2.1:1.7}/>
              <span style={{fontSize:".47rem",fontWeight:a?800:600,letterSpacing:.2,whiteSpace:"nowrap",maxWidth:"100%",overflow:"hidden",textOverflow:"ellipsis"}}>{t.l}{t.p==="kulup"?(kulupOpen?" ▾":" ▴"):""}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
