// ══════════════════════════════════════════════════════════
// ONBOARDING SCREEN — ilk başlangıç kurulum ekranı
// ══════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════
// TUTORIAL / REHBER — onboarding sonrası oyun rehberi
// ══════════════════════════════════════════════════════════
const TUTORIAL_STEPS=[
  {
    icon:"🏠",
    title:"Ana Sayfa — Lig Tablosu",
    desc:"Ana sayfada bulunduğun ligin puan tablosunu ve diğer ligleri görebilirsin. Sıralamana, form durumuna ve rakip güçlere buradan bakabilirsin.",
    tip:"💡 Sekmelere tıklayarak Premier Lig, La Liga gibi dünya liglerini de takip edebilirsin.",
    highlight:"home",
    img:"📊"
  },
  {
    icon:"📅",
    title:"Fikstür — Maç Takvimi",
    desc:"Tüm maçlarını ay ay görebilirsin. Oynanan maçlar sonuçla, gelecek maçlar rakip gücüyle görünür.",
    tip:"💡 Ev maçlarında saha avantajın var! Deplasman maçlarına dikkat et.",
    highlight:"fikstur",
    img:"📅"
  },
  {
    icon:"▶️",
    title:"Maç Oynamak",
    desc:"Ana sayfada 'OYNA' butonuna bas. Maç simülasyonu sırasında golcü atamalarını, kartları ve sonucu canlı izleyebilirsin.",
    tip:"💡 Kadronun OVR ortalaması ne kadar yüksekse galip gelme ihtimalin o kadar artar.",
    highlight:"home",
    img:"⚽"
  },
  {
    icon:"👥",
    title:"Kadro Yönetimi",
    desc:"Kadro sekmesinde oyuncularını görebilir, satışa çıkarabilir, formasyonunu ayarlayabilirsin. 11'lini seçerek maç gücünü optimize et.",
    tip:"💡 Her pozisyon için en az 1-2 yedek bulundur. Sakatlanma ve kart cezası riskini göz önünde bulundur.",
    highlight:"kadro",
    img:"👥"
  },
  {
    icon:"🔄",
    title:"Transfer Sistemi",
    desc:"Transfer sekmesinde 700+ oyuncu arasından alım yapabilirsin. Transfer penceresi (Ağustos–Eylül ve Ocak) açıkken alım-satım yapabilirsin.",
    tip:"💡 Serbest oyuncuları her zaman transfer edebilirsin — bonservis ödemeden!",
    highlight:"transfer",
    img:"🔄"
  },
  {
    icon:"💰",
    title:"Bütçe & Finans",
    desc:"Bütçeni akıllıca yönet. Her transfer bonservis + yıllık maaş gerektiriyor. Maç gelirleri (stadyum, yayın, sponsorluk) haftalık bütçene eklenir.",
    tip:"💡 Değeri düşük ama potansiyeli yüksek genç oyuncular al, geliştir, sat!",
    highlight:"finans",
    img:"💸"
  },
  {
    icon:"⭐",
    title:"İtibar & Yükseliş",
    desc:"Güçlü rakipleri yenip, kaliteli transferler yaparak itibarını artırırsın. Yüksek itibar = daha iyi oyuncuları transfer edebilirsin.",
    tip:"💡 TFF 1. Lig'de ilk 3'e gir ve Elit Lig'e yüksel! Oradan Avrupa kapıları açılır.",
    highlight:"home",
    img:"🏆"
  },
  {
    icon:"💾",
    title:"Kaydet & Yükle",
    desc:"Oyununu kaydetmek için üst bardaki 'Kaydet' butonuna bas. Birden fazla kayıt slotu oluşturabilirsin. Yükleme için Kaydet butonunun yanındaki listeyi kullan.",
    tip:"💡 Önemli maçlardan önce mutlaka kaydet! Kayıtlar tarayıcı hafızasında saklanır — tarayıcı verilerini temizlersen kayıtlar silinir.",
    highlight:"home",
    img:"💾"
  },
];

function TutorialOverlay({onClose,clubName}){
  const [step,setStep]=useState(0);
  const cur=TUTORIAL_STEPS[step];
  const total=TUTORIAL_STEPS.length;
  const isLast=step===total-1;

  return(
    <div style={{
      position:"fixed",inset:0,zIndex:8000,
      background:"rgba(2,8,18,.88)",
      display:"flex",flexDirection:"column",
      alignItems:"center",justifyContent:"center",
      padding:16,backdropFilter:"blur(4px)"
    }}>
      {/* Kart */}
      <div style={{
        width:"100%",maxWidth:380,
        background:C.gradCard,
        border:"1px solid rgba(36,133,255,.3)",
        borderRadius:18,overflow:"hidden",
        boxShadow:"0 32px 80px rgba(0,0,0,.9),0 0 0 1px rgba(36,133,255,.1)"
      }}>
        {/* Üst şerit */}
        <div style={{
          height:4,background:"linear-gradient(90deg,#1a6ed8,#2ecc71)",
          width:`${((step+1)/total)*100}%`,transition:"width .4s ease"
        }}/>

        {/* Büyük icon alanı */}
        <div style={{
          padding:"28px 0 16px",textAlign:"center",
          background:"linear-gradient(180deg,rgba(36,133,255,.08) 0%,transparent 100%)"
        }}>
          <div style={{
            display:"inline-flex",alignItems:"center",justifyContent:"center",
            width:72,height:72,borderRadius:20,
            background:"rgba(36,133,255,.12)",
            border:"1px solid rgba(36,133,255,.25)",
            fontSize:"2.2rem",marginBottom:0,
            boxShadow:"0 8px 24px rgba(36,133,255,.2)"
          }}>{cur.img}</div>
        </div>

        {/* İçerik */}
        <div style={{padding:"0 24px 20px"}}>
          {/* Adım sayacı */}
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:10}}>
            <span style={{fontSize:".42rem",color:"rgba(36,133,255,.7)",letterSpacing:2,textTransform:"uppercase",fontWeight:700}}>
              ADIM {step+1} / {total}
            </span>
            <span style={{fontSize:".7rem"}}>{cur.icon}</span>
          </div>

          <div style={{fontSize:".82rem",fontWeight:800,color:C.wh,marginBottom:10,lineHeight:1.3}}>
            {cur.title}
          </div>

          <div style={{fontSize:".58rem",color:C.dim,lineHeight:1.75,marginBottom:14}}>
            {cur.desc}
          </div>

          {/* İpucu */}
          <div style={{
            background:"rgba(46,204,113,.08)",
            border:"1px solid rgba(46,204,113,.2)",
            borderRadius:8,padding:"9px 12px",marginBottom:20
          }}>
            <div style={{fontSize:".54rem",color:"rgba(46,204,113,.9)",lineHeight:1.6}}>
              {cur.tip}
            </div>
          </div>

          {/* Dot göstergeler */}
          <div style={{display:"flex",justifyContent:"center",gap:5,marginBottom:18}}>
            {TUTORIAL_STEPS.map((_,i)=>(
              <div key={i} onClick={()=>setStep(i)} style={{
                width:i===step?20:6,height:6,borderRadius:3,
                background:i<step?"#30e070":i===step?"#4da6ff":C.brd,
                transition:"all .3s",cursor:"pointer"
              }}/>
            ))}
          </div>

          {/* Butonlar */}
          <div style={{display:"flex",gap:8}}>
            {step>0&&(
              <button onClick={()=>setStep(s=>s-1)} style={{
                flex:1,padding:"10px 0",borderRadius:10,
                border:`1px solid ${C.brd}`,
                background:C.surfaceHover,
                color:C.dim,fontSize:".6rem",
                cursor:"pointer",fontFamily:"inherit"
              }}>← Geri</button>
            )}
            {!isLast?(
              <button onClick={()=>setStep(s=>s+1)} style={{
                flex:2,padding:"10px 0",borderRadius:10,border:"none",
                background:"linear-gradient(135deg,#1a6ed8,#2485ff)",
                color:"#fff",fontSize:".64rem",fontWeight:700,
                cursor:"pointer",fontFamily:"inherit",
                boxShadow:"0 4px 16px rgba(36,133,255,.35)"
              }}>İleri →</button>
            ):(
              <button onClick={onClose} style={{
                flex:2,padding:"10px 0",borderRadius:10,border:"none",
                background:"linear-gradient(135deg,#1a8449,#2ecc71)",
                color:"#fff",fontSize:".66rem",fontWeight:800,
                cursor:"pointer",fontFamily:"inherit",
                boxShadow:"0 4px 16px rgba(46,204,113,.35)"
              }}>🏆 Hadi Başlayalım!</button>
            )}
          </div>
        </div>
      </div>

      {/* Atla */}
      <button onClick={onClose} style={{
        marginTop:16,background:"none",border:"none",
        color:C.dmr,fontSize:".5rem",
        cursor:"pointer",fontFamily:"inherit",letterSpacing:1
      }}>Rehberi Atla</button>
    </div>
  );
}
