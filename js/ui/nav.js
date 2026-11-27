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
  {i:"📊",l:"İstatistik",p:"istatistik"},
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
const LABELS={home:"Kulüp Yönetimi",kadro:"Kadro",fikstur:"Fikstür",formasyon:"Form & Taktik",
  antrenman:"Antrenman",transfer:"Transfer Pazarı",yetenek:"Altyapı",
  diger:"Diğer",kaydet:"Kaydet / Yükle",haberler:"Haberler",finans:"Finans",
  istatistik:"İstatistikler",takimlar:"Takımlar",ayarlar:"Ayarlar"};
