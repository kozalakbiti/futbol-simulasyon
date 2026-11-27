// ─── TRANSFER PAZARI ──────────────────────────────────────────
// Serbest oyuncular için dinamik piyasa değeri hesapla (OVR + yaş + pot bazlı)
function calcFreePlayerVal(player){
  if(player.st!=="free"||!player) return player.val||0;
  const ovr=player.ovr||70;
  const age=player.age||28;
  const pot=player.pot||ovr;
  // OVR baz değer
  const ovrBase=ovr>=90?70:ovr>=87?50:ovr>=85?38:ovr>=83?28:ovr>=80?20:
                ovr>=78?14:ovr>=75?9:ovr>=73?6:ovr>=70?4:
                ovr>=68?2.5:ovr>=65?1.5:ovr>=62?0.8:ovr>=60?0.5:0.3;
  // Yaş çarpanı
  const ageMult=age<=21?1.15:age<=24?1.08:age<=27?1.0:age<=29?0.88:age<=31?0.72:age<=33?0.50:age<=35?0.30:0.15;
  // Potansiyel çarpanı — gap + yaşa göre güçlü etki
  // 55OVR/87POT/24yaş hedef: ~5M => ovrBase=0.5, ageMult=1.08 => potMult ~9.3
  const gap=pot-ovr;
  const agePosFactor=age<=21?1.0:age<=24?0.85:age<=27?0.65:age<=30?0.35:0.10;
  const potMult=1+(gap>=25?2.8:gap>=20?2.2:gap>=15?1.6:gap>=10?1.0:gap>=5?0.4:0)*agePosFactor*6;
  return Math.max(0.1, parseFloat((ovrBase*ageMult*potMult).toFixed(1)));
}

// Altyapı oyuncusu piyasa değeri — gerçekçi, max ~0.9M€
function calcYouthPlayerVal(player){
  const ovr=player.ovr||60;
  const age=player.age||18;
  const pot=player.pot||ovr;
  const gap=pot-ovr;
  // Baz değer: OVR'a göre 50K-500K arası
  const ovrBase=ovr>=75?0.50:ovr>=72?0.32:ovr>=68?0.18:ovr>=65?0.10:0.05;
  // Yaş çarpanı (küçük etki)
  const ageMult=age<=17?1.25:age<=19?1.10:age<=21?1.0:0.88;
  // Potansiyel bonusu (çok küçük)
  const potBonus=gap>=18?0.20:gap>=13?0.12:gap>=8?0.05:0;
  const val=ovrBase*ageMult+potBonus;
  return Math.max(0.05, Math.min(0.95, Math.round(val*100)/100));
}

function PlayerCard({player}){
  const pc=posC(player.pos);
  const gc=player.ovr>=90?"#ff5050":player.ovr>=80?"#ffd060":player.ovr>=70?"#b0bec5":player.ovr>=60?"#cd7f32":"#e8975a";
  const stColors={contracted:C.red2,expiring:C.gd,listed:C.ac2,free:C.grn2};
  const stLabels={contracted:"SÖZL.",expiring:"BİTİYOR",listed:"LİSTEDE",free:"SERBEST"};
  return(
    <div style={{
      background:C.gradCard,
      border:`1px solid ${gc}44`,borderRadius:12,overflow:"hidden",
      boxShadow:`0 0 30px ${gc}18,0 8px 32px rgba(0,0,0,.6)`,
      position:"relative",marginBottom:14
    }}>
      {/* Üst gradient şerit */}
      <div style={{height:3,background:`linear-gradient(90deg,transparent,${gc},transparent)`}}/>
      {/* İçerik */}
      <div style={{padding:"12px 14px",display:"flex",gap:12,alignItems:"center"}}>
        {/* OVR circle */}
        <div style={{
          width:54,height:54,borderRadius:"50%",flexShrink:0,
          background:`conic-gradient(${gc} ${player.ovr*3.6}deg,${C.surfaceHover} 0deg)`,
          display:"flex",alignItems:"center",justifyContent:"center",
          boxShadow:`0 0 16px ${gc}44`
        }}>
          <div style={{
            width:44,height:44,borderRadius:"50%",
            background:C.card,
            display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"
          }}>
            <div style={{fontSize:"1.1rem",fontWeight:900,color:gc,lineHeight:1}}>{player.ovr}</div>
            <div style={{fontSize:".36rem",color:gc,fontWeight:700,letterSpacing:1,opacity:.8}}>{player.pos}</div>
          </div>
        </div>
        {/* Bilgiler */}
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:3}}>
            <span style={{fontSize:".82rem",fontWeight:800,color:C.wh,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{player.n}</span>
            <div style={{
              padding:"1px 6px",borderRadius:3,fontSize:".44rem",fontWeight:800,
              background:`${stColors[player.st]||C.ac2}22`,color:stColors[player.st]||C.ac2,
              border:`1px solid ${stColors[player.st]||C.ac2}55`,letterSpacing:1,flexShrink:0
            }}>{stLabels[player.st]||player.st}</div>
          </div>
          <div style={{fontSize:".58rem",color:C.dim,marginBottom:6}}>{player.club} · {player.lg}</div>
          {/* Stats row */}
          <div style={{display:"flex",gap:8}}>
            {[["POT",player.pot,C.pur2],["YAŞ",player.age,C.wh],["DEĞER",player.st==="free"?calcFreePlayerVal(player)+"M€":calcEffectiveVal(player)+"M€",player.st==="free"?C.grn2:C.gd],["ŞANS",player.ch+"%",player.ch>=70?C.grn2:player.ch>=40?C.gd:C.red2]].map(([l,v,c])=>(
              <div key={l} style={{textAlign:"center"}}>
                <div style={{fontSize:".38rem",color:C.dim,letterSpacing:.8,marginBottom:1}}>{l}</div>
                <div style={{fontSize:".62rem",fontWeight:700,color:c}}>{v}</div>
              </div>
            ))}
          </div>
        </div>
        {/* Grade badge */}
        <div style={{
          width:32,height:32,borderRadius:6,flexShrink:0,
          background:`${gc}18`,border:`2px solid ${gc}66`,
          display:"flex",alignItems:"center",justifyContent:"center",
          fontWeight:900,fontSize:".9rem",color:gc,
          boxShadow:`0 0 12px ${gc}33`
        }}>{player.ovr>=90?"⭐":player.ovr>=80?"A":player.ovr>=70?"B":player.ovr>=60?"C":"D"}</div>
      </div>
      {/* POT bar */}
      <div style={{padding:"0 14px 10px"}}>
        <div style={{height:3,background:C.surfaceHover,borderRadius:2,overflow:"hidden",position:"relative"}}>
          <div style={{position:"absolute",left:0,top:0,height:"100%",width:`${player.ovr}%`,background:`${gc}88`,borderRadius:2}}/>
          <div style={{position:"absolute",left:`${player.ovr}%`,top:0,height:"100%",width:`${Math.max(0,player.pot-player.ovr)}%`,background:"rgba(142,68,173,.5)",borderRadius:2}}/>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:".4rem",color:"#3a5070",marginTop:3}}>
          <span>Mevcut: {player.ovr}</span><span style={{color:C.pur2}}>Tavan: {player.pot} (+{player.pot-player.ovr})</span>
        </div>
      </div>
    </div>
  );
}

// Oyuncu gerçek piyasa değeri — potansiyel çarpanı dahil (liste ve teklif ekranı senkron)
function calcEffectiveVal(player){
  if(player.st==="free") return calcFreePlayerVal(player);
  const raw=player.val||0;
  const pot=player.pot||player.ovr||70;
  const gap=Math.max(0,pot-(player.ovr||70));
  const age=player.age||28;
  const agePosFactor=age<=20?1.0:age<=23?0.85:age<=26?0.60:age<=29?0.25:0;
  const mult=1+(gap>=20?1.5:gap>=15?1.0:gap>=10?0.6:gap>=5?0.25:0)*agePosFactor;
  return Math.round(raw*mult*10)/10;
}

// Oyuncunun gerçek maaş beklentisi — ham sal + potansiyel/yaş çarpanı
// DB'deki sal değerleri bazen gerçekçi değil; bu fonksiyon potansiyeli yansıtır
function calcEffectiveSal(player){
  const raw=player.sal||20;
  const pot=player.pot||player.ovr||70;
  const gap=Math.max(0,pot-(player.ovr||70));
  const age=player.age||28;
  // Genç + yüksek potansiyel = yüksek maaş beklentisi
  // 18y gap20: ~4x | 20y gap15: ~2.5x | 23y gap10: ~1.5x | 26y+: minimal etki
  const ageFactor=age<=18?1.0:age<=20?0.85:age<=22?0.65:age<=24?0.45:age<=26?0.25:0.10;
  const potMult=1+(gap>=20?3.0:gap>=15?2.0:gap>=10?1.1:gap>=5?0.4:0)*ageFactor;
  // Minimum mantıklı taban: OVR bazlı
  const ovrBase=player.ovr>=85?8000:player.ovr>=80?4000:player.ovr>=75?2000
    :player.ovr>=70?800:player.ovr>=65?400:player.ovr>=60?200:100;
  return Math.max(Math.round(raw*potMult), ovrBase);
}

// ── Paylaşılan kabul olasılığı hesabı — OfferPage ve transfer listesi aynı fonksiyonu kullanır ──
function calcAcceptProb({player, repPts=30, league="1. Lig", offer=0, salOffer=0, ctOffer=2, round=1, mood=50}){
  const isFree = player.st==="free";
  // Yüksek potansiyelli gençler için piyasa değerini yukarı ayarla
  const rawVal = isFree ? (player.val||0) : (player.val||10);
  const pot=player.pot||player.ovr||70;
  const age=player.age||28;
  const gap=Math.max(0,pot-(player.ovr||70));
  // Pot çarpanı: genç + yüksek gap → değer şişer (max ×2.5)
  const agePosFactor=age<=20?1.0:age<=23?0.85:age<=26?0.60:age<=29?0.25:0;
  const potValMult=1+(gap>=20?1.5:gap>=15?1.0:gap>=10?0.6:gap>=5?0.25:0)*agePosFactor;
  const effectiveVal = isFree ? rawVal : Math.round(rawVal * potValMult * 10)/10;
  const isLowTier = (league==="1. Lig");
  // Rep bonusu: daha yavaş ölçeklenir, maksimum +10
  const repBonus = Math.round(Math.min(10, (repPts-30)/7));
  const moodBonus = Math.round((mood-50)/12);
  const ctBonus = (ctOffer-1)*2;
  // Lig penaltısı: TFF'de yüksek OVR oyuncular gelmek istemez
  const repLeaguePenalty = isLowTier?(player.ovr>=85?-40:player.ovr>=80?-28:player.ovr>=75?-15:player.ovr>=70?-5:0):0;
  // Düşük rep penaltısı: her OVR seviyesinde aktif, rep arttıkça azalır
  const repFactor = Math.max(0, Math.min(1, (repPts-20)/60)); // 0..1 arası (rep 20→80)
  const ovrPenalty = player.ovr>=85?-60:player.ovr>=80?-45:player.ovr>=75?-28:player.ovr>=70?-14:player.ovr>=65?-5:0;
  const lowRepPenalty = Math.round(ovrPenalty * (1 - repFactor));
  // Yüksek potansiyel penaltısı: düşük OVR olsa dahi talep eden kulüp çok olur → transfer güçleşir
  // gap büyük + genç → ek direnç (serbest oyuncular hariç)
  const potResistance = isFree ? 0 : -Math.round((gap>=20?18:gap>=15?12:gap>=10?7:gap>=5?3:0)*agePosFactor);
  if(isFree){
    // Serbest oyuncu: bonservis yok ama maaş beklentisi kritik
    const effSal = calcEffectiveSal(player);
    const salRatioFree = salOffer > 0 ? Math.min(1.0, salOffer / (effSal * 1.05)) : 0;
    // Maaş skoru: ch'nin etkisini maaş oranıyla bastır
    // Düşük maaş → ch değeri ağırlığı azalır, sert ceza devreye girer
    const chWeight = salRatioFree >= 0.90 ? 1.0   // tam maaş: ch tam etkili
      : salRatioFree >= 0.75 ? 0.65                // %75 maaş: ch %65 etkili
      : salRatioFree >= 0.55 ? 0.35                // %55 maaş: ch %35 etkili
      : salRatioFree >= 0.35 ? 0.15                // %35 maaş: ch %15 etkili
      : 0.05;                                       // çok düşük: ch neredeyse etkisiz
    const salPenalty = salRatioFree >= 0.90 ? 12
      : salRatioFree >= 0.75 ? 0
      : salRatioFree >= 0.55 ? -18
      : salRatioFree >= 0.35 ? -35
      : -55; // maaş çok düşük → neredeyse imkansız
    const base = player.ch * chWeight + repBonus + repLeaguePenalty + lowRepPenalty + moodBonus + ctBonus + salPenalty;
    return Math.max(2, Math.min(90, Math.round(base)));
  }
  const ratio = offer/(effectiveVal||1);
  // Maaş oranı: oyuncunun mevcut maaşından %10 zam beklentisine göre normalize
  // Maaş beklentisi: calcEffectiveSal ile potansiyel dahil gerçek beklenti
  const salExpect = calcEffectiveSal(player) * 1.10;
  const salRatio = Math.min(1.0, salOffer / salExpect);
  // statusBase: bu oranın altındaki teklifler sert ceza alır
  const statusBase = player.st==="expiring"||player.st==="expiring0"?0.60:player.st==="listed"?0.72:0.92;
  // Bonservis çarpanı: üstel ölçek, düşük teklif maaş/round bonusuyla kurtarılamaz
  const feeScore = Math.min(1.0, Math.pow(ratio/statusBase, 1.8));
  // Maaş ve diğer bonuslar fee ile çarpılır
  const salBonus    = Math.min(1, salRatio) * feeScore * 12;
  const chBonus     = player.ch * 0.08 * feeScore;
  const roundBonus  = Math.min(6,(round-1)*1.5) * feeScore;
  // Ana formül
  const base = feeScore * 62
             + salBonus
             + chBonus
             + roundBonus
             + ctBonus
             + repBonus + repLeaguePenalty + lowRepPenalty + moodBonus
             + potResistance;
  const raw = Math.round(base);
  return Math.max(3, Math.min(93, raw));
}

function OfferPage({player,onBack,onSuccess,onOfferSent=()=>{},onOfferFailed=()=>{},rep,league}){
  const isFree=player.st==="free";
  // Yüksek potansiyelli gençler için piyasa değerini yukarı ayarla (calcAcceptProb ile tutarlı)
  const _rawVal=isFree?calcFreePlayerVal(player):(player.val||10);
  const _pot=player.pot||player.ovr||70;
  const _gap=Math.max(0,_pot-(player.ovr||70));
  const _age=player.age||28;
  const _agePosFactor=_age<=20?1.0:_age<=23?0.85:_age<=26?0.60:_age<=29?0.25:0;
  const _potValMult=isFree?1:(1+(_gap>=20?1.5:_gap>=15?1.0:_gap>=10?0.6:_gap>=5?0.25:0)*_agePosFactor);
  const effectiveVal=Math.round(_rawVal*_potValMult*10)/10;
  // Potansiyel bazlı maaş başlangıç teklifi
  const initSalOffer=player.sal>0?Math.round(calcEffectiveSal(player)*0.85):30;
  const repPts=rep?rep.pts:30;
  const isLowTier=(league==="1. Lig");

  // ── MÜZAKERECİ PROFİLİ — oyuncu kişiliği müzakereyi etkiler ──
  const agentProfile=(()=>{
    // Oyuncuya özgü deterministik ajan seçimi (id bazlı → her seferinde aynı ajan)
    const seed=(player.id||0)+(player.age||0)*7+(player.ovr||0)*3;
    const pick=(arr)=>arr[seed%arr.length];

    // Yıldız oyuncular (88+): güçlü ve iddialı temsilciler
    if(player.ovr>=88){
      return pick([
        {name:"Jorge Mendes",       style:"sert",      emoji:"💼",desc:"Dünyanın en güçlü futbol ajansı sahibi"},
        {name:"Mino Raiola Jr.",    style:"sert",      emoji:"😤",desc:"Acımasız müzakerelerin efsanevi temsilcisi"},
        {name:"Pini Zahavi",        style:"pazarlikci",emoji:"🦅",desc:"Devasa transferlerin arkasındaki isim"},
        {name:"Jonathan Barnett",   style:"sert",      emoji:"🗡️",desc:"Yıldız oyuncuların güvenilmez temsilcisi"},
        {name:"Freddie Shepherd",   style:"pazarlikci",emoji:"🧠",desc:"Stratejik hamleler yapan veteran ajan"},
      ]);
    }
    // Genç yetenekler (≤22)
    if(player.age<=22){
      return pick([
        {name:"Ahmet Erdoğan",      style:"umutlu",    emoji:"🌱",desc:"Genç yeteneklerin hırslı temsilcisi"},
        {name:"Luca Valentini",     style:"umutlu",    emoji:"🌟",desc:"İtalyan okul çıkışlı genç ajan"},
        {name:"Mehmet Çelik",       style:"umutlu",    emoji:"🚀",desc:"Türk genç yıldızlarının sözcüsü"},
        {name:"Yusuf Al-Rashid",    style:"esnek",     emoji:"💫",desc:"Genç oyuncuları büyük kulüplere taşır"},
        {name:"Adam Karimi",        style:"umutlu",    emoji:"⚡",desc:"Hızlı yükselen yeteneklerin ajansı"},
      ]);
    }
    // Serbest oyuncular
    if(player.st==="free"){
      return pick([
        {name:"Marco Silva",        style:"esnek",     emoji:"🤝",desc:"Serbest oyuncular konusunda uzman"},
        {name:"Raúl Gómez",         style:"esnek",     emoji:"🕊️",desc:"Hızlı ve sorunsuz geçişler için"},
        {name:"Emeka Okafor",       style:"esnek",     emoji:"🌍",desc:"Uluslararası serbest transferlerde otorite"},
        {name:"Sven Lindqvist",     style:"pazarlikci",emoji:"📋",desc:"İskandinav ajanlık ekolünün temsilcisi"},
      ]);
    }
    // Satışa çıkarılmış / listed
    if(player.st==="listed"||player.st==="expiring0"){
      return pick([
        {name:"José Pereira",       style:"aceleci",   emoji:"⚡",desc:"Kulübün baskısıyla hızlı anlaşma arıyor"},
        {name:"Ivan Drago",         style:"aceleci",   emoji:"🔥",desc:"Son dakika uzmanı, basın baskısı ustası"},
        {name:"Gaël Beaumont",      style:"aceleci",   emoji:"⏩",desc:"Transfer penceresinin kapanmadan önce işi bitirir"},
      ]);
    }
    // Orta segment (78-87)
    if(player.ovr>=78){
      return pick([
        {name:"David Walsh",        style:"pazarlikci",emoji:"🧠",desc:"Deneyimli ve stratejik temsilci"},
        {name:"Aleksandr Kovalev",  style:"pazarlikci",emoji:"♟️",desc:"Satranç gibi müzakere eden Doğu Avrupalı ajan"},
        {name:"Thomas Hartmann",    style:"sert",      emoji:"⚖️",desc:"Alman disipliniyle her detayı masaya yatırır"},
        {name:"Sebastião Carvalho", style:"pazarlikci",emoji:"🎯",desc:"Portekiz kökenli, Avrupa kulüpleri uzmanı"},
        {name:"Oluwaseun Adeyemi",  style:"esnek",     emoji:"🌟",desc:"Afrikalı yetenekleri küresel arenaya taşır"},
      ]);
    }
    // Düşük segment / Türk lig oyuncuları
    const pos=player.pos||"ORT";
    if(pos==="KL"||pos==="DF"){
      return pick([
        {name:"Mehmet Aydın",       style:"esnek",     emoji:"🤝",desc:"Türk futbolunun tanınan temsilcisi"},
        {name:"Cüneyt Yıldız",      style:"esnek",     emoji:"🛡️",desc:"Defans oyuncuları uzmanı, sağlam duruşlu ajan"},
        {name:"Haluk Demir",        style:"pazarlikci",emoji:"📊",desc:"Verilere dayalı müzakere anlayışı"},
      ]);
    }
    if(pos==="FW"||pos==="CAM"){
      return pick([
        {name:"Rodrigo Mendes",     style:"umutlu",    emoji:"⚽",desc:"Forvet ve yaratıcı oyuncuların sözcüsü"},
        {name:"Bülent Karahan",     style:"sert",      emoji:"🎯",desc:"Golcülerin piyasa değerini iyi bilir"},
        {name:"Artem Shevchenko",   style:"pazarlikci",emoji:"💡",desc:"Ofansif oyuncuları için stratejik hamle ustası"},
      ]);
    }
    return pick([
      {name:"Mehmet Aydın",         style:"esnek",     emoji:"🤝",desc:"Türk futbolunun tanınan temsilcisi"},
      {name:"Karim Benzara",        style:"esnek",     emoji:"🌐",desc:"Çok uluslu bağlantıları olan deneyimli ajan"},
      {name:"Pieter van den Berg",  style:"pazarlikci",emoji:"🏦",desc:"Hollandalı, finansal detaylarda titiz"},
      {name:"Liam O'Brien",         style:"umutlu",    emoji:"☘️",desc:"İrlanda kökenli, neşeli ama hesap bilir"},
      {name:"Fatih Başaran",        style:"esnek",     emoji:"🦅",desc:"Türk ve Balkan liglerinde köklü ajan"},
    ]);
  })();

  // ── OYUNCU ÖNCELIKLERINI belirle (hangi konuda pes etmez) ──
  const playerPriority=(()=>{
    if(player.age<=23) return "sal"; // gençler maaş ister
    if(player.ovr>=82) return "fee"; // yıldızlar bonservis değeri konusunda hassas
    if(player.st==="listed") return "duration"; // listeyedekiler uzun sözleşme ister
    return Math.random()<0.5?"sal":"duration";
  })();

  // ── STATE ──
  const [offer,setOffer]=useState(isFree?0:Math.round((effectiveVal||10)*0.85));
  const [salOffer,setSalOffer]=useState(initSalOffer);
  const [ctOffer,setCtOffer]=useState(2); // sözleşme yılı
  const [minOffer,setMinOffer]=useState(0);   // önceki turda gönderilen min bonservis
  const [minSal,setMinSal]=useState(0);       // önceki turda gönderilen min maaş
  const [stage,setStage]=useState("form"); // form | thinking | result | timeline
  const [result,setResult]=useState(null); // accepted | counter | rejected | hardno
  const [dots,setDots]=useState(0);
  const [round,setRound]=useState(1);
  const [maxRounds]=useState(player.st==="contracted"?4:player.st==="listed"?5:3);
  const [counterDemand,setCounterDemand]=useState(null);
  const [agentNote,setAgentNote]=useState(null);
  const [history,setHistory]=useState([]); // müzakere geçmişi
  const [mood,setMood]=useState(50);       // 0-100 ajan ruh hali
  const [leverage,setLeverage]=useState(null); // özel koz durumu
  const [tab,setTab]=useState("offer");    // offer | profile | history

  useEffect(()=>{
    if(stage!=="thinking") return;
    const t=setInterval(()=>setDots(d=>(d+1)%4),400);
    return()=>clearInterval(t);
  },[stage]);

  // ── Başlangıç kozu mesajı ──
  useEffect(()=>{
    if(player.st==="expiring"||player.st==="expiring0") setLeverage({type:"expiring",msg:player.st==="expiring0"?"🔴 Sözleşmesi bitti — İstediğin şartları dayat!":"⏳ Sözleşmesi bitiyor — Müzakereler daha kolay!"});
    else if(player.st==="listed") setLeverage({type:"listed",msg:"📋 Kulüp satmak istiyor — Fiyat daha uygun!"});
    else if(player.st==="free") setLeverage({type:"free",msg:"🟢 Serbest oyuncu — Bonservis yok, sadece maaş!"});
    else if(repPts>=70) setLeverage({type:"rep",msg:"⭐ Yüksek itibarınız müzakere gücünüzü artırıyor!"});
  },[]);

  // ── Olasılık hesabı — paylaşılan fonksiyonu kullan ──
  const prob=()=>calcAcceptProb({player,repPts,league,offer,salOffer,ctOffer,round,mood});
  const p=prob();
  const pColor=p>=70?C.grn2:p>=45?C.gd:C.red2;
  const pLabel=p>=75?"Çok Yüksek":p>=60?"Yüksek":p>=45?"Orta":p>=25?"Düşük":"Çok Düşük";

  // ── Teklif kalitesi ──
  const offerQuality=()=>{
    if(isFree) return {label:"Serbest Oyuncu",color:C.grn2,icon:"🟢"};
    const r=offer/(effectiveVal||1);
    if(r>=1.2) return {label:"Çok İyi Teklif",color:C.grn2,icon:"🔥"};
    if(r>=1.0) return {label:"Adil Teklif",color:C.grn2,icon:"✅"};
    if(r>=0.75) return {label:"Düşük Teklif",color:C.gd,icon:"⚠️"};
    return {label:"Çok Düşük",color:C.red2,icon:"❌"};
  };
  const q=offerQuality();

  // ── Ajan mood rengi ──
  const moodColor=mood>=70?C.grn2:mood>=45?C.gd:mood>=25?"#e67e22":C.red2;
  const moodLabel=mood>=80?"Çok Olumlu 😊":mood>=60?"Olumlu 🙂":mood>=40?"Nötr 😐":mood>=20?"Soğuk 😒":"Düşmanca 😠";

  // ── Karşı teklif hesapla ──
  const calcCounter=(offeredFee,offeredSal,offeredCt)=>{
    const marketVal=effectiveVal||5;
    const curSal=player.sal||300;
    const reasons=[];

    // Önceliğe göre talep belirle
    let demandFee=isFree?0:Math.round(marketVal*(0.92+Math.random()*0.18));
    // Maaş talebi: mevcut maaş zammı VEYA teklifin üstü — hangisi büyükse
    const baseDemandSal=Math.round(curSal*(1.05+Math.random()*0.15));
    let demandSal=Math.max(baseDemandSal, Math.round(offeredSal*1.05));
    let demandCt=Math.min(4,offeredCt+1);

    // Style'a göre davranış
    if(agentProfile.style==="sert"){
      demandFee=Math.round(marketVal*1.05);
      demandSal=Math.max(Math.round(curSal*1.18), Math.round(offeredSal*1.08));
      reasons.push("Müvekkilim piyasanın en iyisi, bunu rakamlar yansıtmalı");
    } else if(agentProfile.style==="aceleci"){
      demandFee=Math.round(marketVal*0.88); // biraz indirim
      demandSal=Math.max(Math.round(curSal*1.10), Math.round(offeredSal*1.03));
      reasons.push("Kulübümüz hızlı karar ister, teklifinizi biraz iyileştirin");
    } else if(agentProfile.style==="umutlu"){
      demandSal=Math.max(Math.round(curSal*1.20), Math.round(offeredSal*1.05)); // gençler maaş ister
      demandCt=3;
      reasons.push("Genç kariyerim için güçlü bir maaş paketi şart");
    }

    // Oyuncu önceliğine göre ek baskı
    if(playerPriority==="sal"&&offeredSal<demandSal) reasons.push("Maaş müvekkilim için birinci öncelik");
    if(playerPriority==="fee"&&!isFree&&offeredFee<demandFee) reasons.push("Bonservis değerimiz pazarlık konusu değil");
    if(playerPriority==="duration"&&offeredCt<demandCt) reasons.push(`Müvekkilim en az ${demandCt} yıllık güvence istiyor`);
    if(player.ovr>=82) reasons.push("Bu seviyede oyuncu için piyasa fiyatı şart");
    if(player.age<=22) reasons.push("Uzun vadeli yatırım olarak değerlendirin");
    if(player.ct<=1) reasons.push("Sözleşmesi bitiyor ama hâlâ değerini biliyor");

    // Rakip kulüp koz
    if(round>=2&&Math.random()<0.4) reasons.push("Başka kulüplerden de ciddi teklifler aldık");

    return {
      fee:demandFee, sal:demandSal, ct:demandCt,
      reason:reasons[Math.floor(Math.random()*Math.max(1,reasons.length))]||"Müvekkil daha iyi koşullar bekliyor",
      rivalClub:Math.random()<0.4?["Galatasaray FC","Fenerbahçe","Beşiktaş","Trabzonspor FC"][Math.floor(Math.random()*4)]:null,
    };
  };

  // ── Teklif gönder ──
  const doSend=()=>{
    // Haftalık teklif kilidini kaydet (ilk turda)
    if(round===1) onOfferSent(player.id);
    // Ruh halini güncelle (teklif iyiyse artar)
    const feePct=isFree?1:(offer/(effectiveVal||1));
    // Maaş kalitesi: beklenti (mevcut+%10) üstü zaten tam puan, altı orantılı düşük
    const salExpect=calcEffectiveSal(player)*1.10;
    const salPct=Math.min(1.0, salOffer/salExpect);
    const offerQualityScore=(feePct*0.6+salPct*0.4)*100;
    const newMood=Math.max(5,Math.min(95,mood+(offerQualityScore>90?10:offerQualityScore>75?5:offerQualityScore>60?0:offerQualityScore>45?-5:-12)));
    setMood(newMood);

    // Geçmişe ekle
    setHistory(h=>[...h,{
      round, offer:isFree?0:offer, sal:salOffer, ct:ctOffer,
      prob:p, label:q.label, time:new Date().toLocaleTimeString("tr-TR",{hour:"2-digit",minute:"2-digit"})
    }]);
    // Bir sonraki turda bu değerlerin altına inemez
    if(!isFree) setMinOffer(offer);
    setMinSal(salOffer);
    setStage("thinking");

    // Düşünme süresi — ajan stili ve tur sayısına göre
    const thinkTime=agentProfile.style==="aceleci"?1000+Math.random()*500
      :agentProfile.style==="sert"?2200+Math.random()*1000
      :1500+Math.random()*800;

    setTimeout(()=>{
      // Güncel mood ile olasılığı yeniden hesapla (setMood async olduğu için)
      const freshP=calcAcceptProb({player,repPts,league,offer,salOffer,ctOffer,round,mood:newMood});
      const roll=Math.random()*100;
      if(roll<freshP){
        setResult("accepted"); setStage("result");
      } else {
        const ratio=isFree?1:offer/(player.val||1);
        const salExpectClose=calcEffectiveSal(player)*1.10;
        const salRatio=Math.min(1.0, salOffer/salExpectClose);
        const isClose=ratio>=0.72||salRatio>=0.88||round>=maxRounds-1;
        // Maksimum tur aşıldı veya ajan çok soğuduysa hard no
        if(round>=maxRounds||newMood<15){
          setResult("hardno"); setStage("result");
        } else if(isClose&&Math.random()<0.75){
          const cd=calcCounter(offer,salOffer,ctOffer);
          setCounterDemand(cd);
          const agentNotes=[
            `Rakamlar yaklaşıyor, küçük bir adım daha yeterli.`,
            `Yönetim toplantısından sonra dönüş yapıyoruz.`,
            `${cd.rivalClub?cd.rivalClub+"dan da teklif var, ":""}kararımızı bekliyoruz.`,
            `Prensipte evet, ama rakamlar tatmin edici değil.`,
            `Müvekkil sizinle çalışmak istiyor, şartlar biraz daha iyi olmalı.`,
          ];
          setAgentNote(agentNotes[Math.floor(Math.random()*agentNotes.length)]);
          setResult("counter"); setStage("result");
        } else {
          const rejectNotes=[
            `Teklif müvekkilin beklentilerinin çok altında.`,
            `Bu aşamada müzakereyi sürdürmek mümkün değil.`,
            `${agentProfile.name}: "Üzgünüz, kabul edemeyiz."`,
          ];
          setAgentNote(rejectNotes[Math.floor(Math.random()*rejectNotes.length)]);
          setResult("rejected"); setStage("result");
        }
      }
    },thinkTime);
  };

  const doAcceptCounter=()=>{
    if(counterDemand){
      const newFee=counterDemand.fee||0;
      const newSal=counterDemand.sal;
      setOffer(newFee);
      setSalOffer(newSal);
      setCtOffer(counterDemand.ct||ctOffer);
      // Karşı teklif değerleri de minimum olarak kayıt edilir
      if(!isFree) setMinOffer(newFee);
      setMinSal(newSal);
    }
    setResult(null); setCounterDemand(null); setAgentNote(null);
    setRound(r=>r+1); setStage("form");
  };
  const doNewOffer=()=>{
    setResult(null); setCounterDemand(null); setAgentNote(null);
    // Teklifi düşürmeyi engelle: önceki değerleri koru
    if(!isFree) setOffer(o=>Math.max(o,minOffer));
    setSalOffer(s=>Math.max(s,minSal));
    setRound(r=>r+1); setStage("form");
  };

  // ── Sözleşme yılı seçici ──
  const CtSelector=()=>(
    <div style={{marginBottom:12}}>
      <div style={{fontSize:".48rem",color:C.dim,textTransform:"uppercase",letterSpacing:1.5,marginBottom:5}}>
        Sözleşme Süresi
      </div>
      <div style={{display:"flex",gap:4}}>
        {[1,2,3,4,5].map(y=>(
          <button key={y} onClick={()=>setCtOffer(y)} style={{
            flex:1,padding:"7px 2px",
            background:ctOffer===y?`rgba(26,110,216,.25)`:"rgba(26,110,216,.06)",
            border:`1px solid ${ctOffer===y?C.ac2:C.brd2}`,
            borderRadius:4,cursor:"pointer",fontFamily:"inherit",
            fontSize:".56rem",fontWeight:ctOffer===y?700:400,
            color:ctOffer===y?C.ac2:C.dmr,
          }}>{y}y</button>
        ))}
      </div>
      <div style={{fontSize:".44rem",color:C.dmr,marginTop:3}}>
        {ctOffer>=3?"✅ Uzun sözleşme — kabul şansını artırır":ctOffer===2?"⚠️ Orta — yeterli olabilir":"❌ Kısa — oyuncu daha fazla ister"}
      </div>
    </div>
  );

  // ── Ajan profil kartı ──
  const AgentCard=()=>(
    <div style={{
      padding:"10px 12px",marginBottom:10,
      background:"rgba(26,110,216,.05)",
      border:`1px solid rgba(77,166,255,0.22)`,borderRadius:8,
    }}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
        <div style={{
          width:36,height:36,borderRadius:"50%",flexShrink:0,
          background:C.gradCard,
          border:`2px solid ${moodColor}`,
          display:"flex",alignItems:"center",justifyContent:"center",
          fontSize:"1.1rem",
        }}>{agentProfile.emoji}</div>
        <div style={{flex:1}}>
          <div style={{fontSize:".66rem",fontWeight:700,color:C.wh}}>{agentProfile.name}</div>
          <div style={{fontSize:".48rem",color:C.dmr}}>{agentProfile.desc}</div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:".42rem",color:C.dmr,marginBottom:1}}>Ruh Hali</div>
          <div style={{fontSize:".6rem",fontWeight:700,color:moodColor}}>{moodLabel}</div>
        </div>
      </div>
      {/* Mood bar */}
      <div style={{height:3,background:"rgba(100,140,220,.1)",borderRadius:2,overflow:"hidden"}}>
        <div style={{height:"100%",width:`${mood}%`,background:moodColor,borderRadius:2,transition:"width .4s"}}/>
      </div>
      {/* Öncelik */}
      <div style={{marginTop:6,display:"flex",gap:4,flexWrap:"wrap"}}>
        <span style={{fontSize:".42rem",padding:"1px 5px",borderRadius:2,
          background:"rgba(232,184,58,.12)",border:"1px solid rgba(232,184,58,.3)",color:C.gd}}>
          Öncelik: {playerPriority==="sal"?"💰 Maaş":playerPriority==="fee"?"💎 Bonservis":"📅 Süre"}
        </span>
        <span style={{fontSize:".42rem",padding:"1px 5px",borderRadius:2,
          background:"rgba(100,120,160,.12)",border:`1px solid rgba(77,166,255,0.1)`,color:C.dmr}}>
          Tarz: {agentProfile.style==="sert"?"😤 Sert":agentProfile.style==="aceleci"?"⚡ Aceleci":agentProfile.style==="umutlu"?"🌟 Hırslı":"🤝 Esnek"}
        </span>
        <span style={{fontSize:".42rem",padding:"1px 5px",borderRadius:2,
          background:"rgba(100,120,160,.12)",border:`1px solid rgba(77,166,255,0.1)`,color:C.dmr}}>
          Max {maxRounds} tur
        </span>
      </div>
    </div>
  );

  // ── Müzakere geçmişi ──
  const HistoryTab=()=>(
    <div>
      <div style={{fontSize:".48rem",color:C.dmr,letterSpacing:1.5,textTransform:"uppercase",marginBottom:8}}>Müzakere Geçmişi</div>
      {history.length===0&&<div style={{textAlign:"center",padding:"20px",color:C.dmr,fontSize:".6rem"}}>Henüz teklif gönderilmedi.</div>}
      {history.map((h,i)=>(
        <div key={i} style={{
          display:"flex",gap:8,alignItems:"center",
          padding:"7px 10px",marginBottom:5,
          background:C.card,
          border:`1px solid rgba(77,166,255,0.1)`,borderRadius:5,
        }}>
          <div style={{minWidth:16,textAlign:"center",fontSize:".54rem",fontWeight:700,color:C.dmr}}>{h.round}</div>
          <div style={{flex:1}}>
            {!isFree&&<div style={{fontSize:".58rem",color:C.gd,fontWeight:600}}>{h.offer}M€ bonservis</div>}
            <div style={{fontSize:".54rem",color:C.ac2}}>{fmtSal(h.sal)}/yıl · {h.ct}y sözleşme</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:".5rem",color:h.prob>=60?C.grn2:h.prob>=40?C.gd:C.red2,fontWeight:600}}>%{h.prob}</div>
            <div style={{fontSize:".42rem",color:C.dmr}}>{h.time}</div>
          </div>
        </div>
      ))}
    </div>
  );

  return(
    <div style={{flex:1,display:"flex",flexDirection:"column",minHeight:0,background:C.bg}}>
      {/* Header */}
      <div style={{padding:"8px 12px",borderBottom:`1px solid rgba(77,166,255,0.22)`,flexShrink:0,
        display:"flex",alignItems:"center",gap:8,background:C.inset}}>
        <button onClick={onBack} style={{
          background:"none",border:`1px solid rgba(77,166,255,0.22)`,color:C.dim,
          fontSize:".58rem",padding:"3px 8px",cursor:"pointer",borderRadius:3,fontFamily:"inherit",
        }}>← Geri</button>
        <div style={{flex:1,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
          <span style={{fontSize:".62rem",color:C.dim}}>Müzakere: </span>
          <span style={{fontSize:".72rem",fontWeight:700,color:C.wh}}>{player.n}</span>
        </div>
        {/* Tur göstergesi */}
        <div style={{display:"flex",gap:3,alignItems:"center"}}>
          {Array.from({length:maxRounds}).map((_,i)=>(
            <div key={i} style={{
              width:8,height:8,borderRadius:"50%",
              background:i<round-1?"rgba(39,174,96,.6)":i===round-1?C.ac2:"rgba(100,140,220,.2)",
              border:`1px solid ${i===round-1?C.ac2:"transparent"}`,
            }}/>
          ))}
          <span style={{fontSize:".5rem",color:C.dmr,marginLeft:2}}>{round}/{maxRounds}</span>
        </div>
      </div>

      {/* Koz bildirimi */}
      {leverage&&stage==="form"&&round===1&&(
        <div style={{
          margin:"6px 10px 0",padding:"6px 10px",borderRadius:5,
          background:"rgba(232,184,58,.08)",border:"1px solid rgba(232,184,58,.25)",
          fontSize:".54rem",color:C.gd,
        }}>{leverage.msg}</div>
      )}

      {/* Tab bar */}
      <div style={{display:"flex",borderBottom:`1px solid rgba(77,166,255,0.1)`,flexShrink:0}}>
        {[["offer","📨 Teklif"],["profile","🧑‍💼 Ajan"],["history","📋 Geçmiş"]].map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)} style={{
            flex:1,padding:"6px 4px",border:"none",cursor:"pointer",fontFamily:"inherit",
            fontSize:".5rem",background:tab===k?"rgba(45,143,255,.12)":"transparent",
            color:tab===k?C.ac2:C.dmr,
            borderBottom:`2px solid ${tab===k?C.ac2:"transparent"}`,
          }}>{l}</button>
        ))}
      </div>

      <div style={{flex:1,overflowY:"auto",padding:"10px 12px 20px"}}>
        {/* Profile tab */}
        {tab==="profile"&&<>
          <PlayerCard player={player}/>
          <AgentCard/>
          <div style={{padding:"10px 12px",background:C.card,border:`1px solid rgba(77,166,255,0.22)`,borderRadius:8}}>
            <div style={{fontSize:".48rem",color:C.dmr,textTransform:"uppercase",letterSpacing:1.5,marginBottom:8}}>Oyuncu İstekleri</div>
            {[
              ["Öncelikli İstek", playerPriority==="sal"?"Yüksek maaş":playerPriority==="fee"?"Piyasa değeri":  "Uzun sözleşme", C.gd],
              ["Kulüp Tercihi", isLowTier&&player.ovr>=78?"Üst lig tercih eder":"Katılmaya açık", isLowTier&&player.ovr>=78?C.red2:C.grn2],
              ["Transfer Şansı", `%${player.ch}`, player.ch>=70?C.grn2:player.ch>=45?C.gd:C.red2],
            ].map(([l,v,c])=>(
              <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",
                borderBottom:`1px solid rgba(77,166,255,0.1)`,fontSize:".58rem"}}>
                <span style={{color:C.dmr}}>{l}</span>
                <span style={{color:c,fontWeight:600}}>{v}</span>
              </div>
            ))}
          </div>
        </>}

        {/* History tab */}
        {tab==="history"&&<HistoryTab/>}

        {/* Offer tab */}
        {tab==="offer"&&<>
          <PlayerCard player={player}/>
          <AgentCard/>

          {/* FORM */}
          {stage==="form"&&(
            <div>
              {leverage&&round===1&&(
                <div style={{marginBottom:8,padding:"6px 10px",background:"rgba(39,174,96,.08)",
                  border:"1px solid rgba(39,174,96,.2)",borderRadius:5,fontSize:".54rem",color:C.grn2}}>
                  {leverage.type==="free"?"🟢 Serbest — bonservis bedeli yok":
                   leverage.type==="expiring"?"⏳ Sözleşmesi bitiyor":
                   leverage.type==="listed"?"📋 Kulüp satmak istiyor":
                   "⭐ İtibar avantajı"}
                </div>
              )}

              {/* Bonservis slider */}
              {!isFree&&(
                <div style={{marginBottom:12}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                    <span style={{fontSize:".48rem",color:C.dim,textTransform:"uppercase",letterSpacing:1.5}}>Bonservis Teklifi</span>
                    <span style={{fontSize:".48rem",color:C.dmr}}>Piyasa: <b style={{color:C.gd}}>{effectiveVal}M€</b></span>
                  </div>
                  <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:3}}>
                    <input type="range" min={Math.max(Math.round(effectiveVal*0.4),minOffer)} max={Math.round(effectiveVal*1.6)}
                      value={offer} onChange={e=>setOffer(Math.max(Number(e.target.value),minOffer))}
                      onTouchStart={e=>e.stopPropagation()}
                      onTouchMove={e=>e.stopPropagation()}
                      style={{flex:1,accentColor:C.ac2,touchAction:"none",cursor:"pointer"}}/>
                    <div style={{fontSize:"1rem",fontWeight:700,color:C.gd,minWidth:40,textAlign:"right"}}>{offer}M</div>
                  </div>
                  <div style={{height:3,background:"rgba(100,140,220,.1)",borderRadius:2,overflow:"hidden",marginBottom:2}}>
                    <div style={{height:"100%",
                      width:`${Math.min(100,((offer-effectiveVal*0.4)/(effectiveVal*1.2))*100)}%`,
                      background:offer>=effectiveVal?C.grn2:offer>=effectiveVal*0.8?C.gd:C.red2,
                      borderRadius:2,transition:"width .2s"}}/>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:".4rem",color:"#3a5070"}}>
                    <span>{Math.round(effectiveVal*0.4)}M</span>
                    <span style={{color:q.color}}>{q.icon} {q.label}</span>
                    <span>{Math.round(effectiveVal*1.6)}M</span>
                  </div>
                </div>
              )}
              {isFree&&(
                <div style={{marginBottom:10,padding:"8px 12px",background:"rgba(39,174,96,.08)",
                  border:"1px solid rgba(39,174,96,.25)",borderRadius:8,
                  display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:"1.2rem"}}>🟢</span>
                  <div>
                    <div style={{fontSize:".64rem",fontWeight:700,color:C.grn2}}>Serbest Oyuncu</div>
                    <div style={{fontSize:".5rem",color:C.dim}}>Bonservis yok — sadece maaş ve sözleşme süresi</div>
                  </div>
                </div>
              )}

              {/* Maaş slider */}
              <div style={{marginBottom:12}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                  <span style={{fontSize:".48rem",color:C.dim,textTransform:"uppercase",letterSpacing:1.5}}>Yıllık Maaş Teklifi</span>
                  <span style={{fontSize:".48rem",color:C.dmr}}>Mevcut: <b style={{color:C.ac2}}>{fmtSal(calcEffectiveSal(player))}</b></span>
                </div>
                <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:3}}>
                {(()=>{
                  // Slider aralığı: calcEffectiveSal ile tutarlı
                  const baseSal=calcEffectiveSal(player);
                  const salMin=Math.max(10,Math.round((player.sal||50)*0.3));
                  const salMax=Math.round(baseSal*2.5);
                  const salStep=salMax<=200?5:salMax<=500?10:salMax<=2000?25:50;
                  return(<>
                  <input type="range" min={Math.max(salMin,minSal)} max={salMax}
                    step={salStep} value={salOffer} onChange={e=>setSalOffer(Math.max(Number(e.target.value),minSal))}
                    onTouchStart={e=>e.stopPropagation()}
                    onTouchMove={e=>e.stopPropagation()}
                    style={{flex:1,accentColor:C.ac2,touchAction:"none",cursor:"pointer"}}/>
                  <div style={{fontSize:".9rem",fontWeight:700,color:C.ac2,minWidth:56,textAlign:"right"}}>{fmtSal(salOffer)}</div>
                  </>);
                })()}
                </div>
                <div style={{height:3,background:"rgba(100,140,220,.1)",borderRadius:2,overflow:"hidden",marginBottom:2}}>
                  <div style={{height:"100%",
                    width:`${Math.min(100,((salOffer-Math.max(10,Math.round((player.sal||50)*0.3)))/(Math.round((player.sal||50)*2.2)))*100)}%`,
                    background:salOffer>=(player.sal||50)?C.grn2:salOffer>=(player.sal||50)*0.85?C.gd:C.red2,
                    borderRadius:2,transition:"width .2s"}}/>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:".4rem",color:"#3a5070"}}>
                  <span>{Math.max(10,Math.round((player.sal||50)*0.3))}K</span>
                  <span style={{color:salOffer>=(player.sal||50)?C.grn2:C.gd}}>
                    {salOffer>=(player.sal||50)?"✅ Yeterli":"⚠️ Düşük"}
                  </span>
                  <span>{Math.round((player.sal||50)*2.5)}K</span>
                </div>
              </div>

              {/* Sözleşme süresi */}
              <CtSelector/>

              {/* Kabul olasılığı */}
              <div style={{marginBottom:12,padding:"8px 12px",
                background:`${pColor}08`,border:`1px solid ${pColor}33`,borderRadius:7}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
                  <span style={{fontSize:".52rem",color:C.dmr,letterSpacing:.5}}>Kabul Olasılığı</span>
                  <span style={{fontSize:".88rem",fontWeight:900,color:pColor}}>%{p} <span style={{fontSize:".5rem",fontWeight:400,color:C.dmr}}>{pLabel}</span></span>
                </div>
                <div style={{height:5,background:"rgba(100,140,220,.1)",borderRadius:3,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${p}%`,background:`linear-gradient(90deg,${pColor}88,${pColor})`,
                    borderRadius:3,transition:"width .3s"}}/>
                </div>
                <div style={{marginTop:5,fontSize:".44rem",color:C.dmr}}>
                  {round>1&&<span>🔄 {round}. tur · Her tur şans hafif artar · </span>}
                  <span style={{color:moodColor}}>Ajan: {moodLabel}</span>
                </div>
              </div>

              <button onClick={doSend} style={{
                width:"100%",padding:"12px 0",
                background:`linear-gradient(135deg,#1a4fa8,${C.ac2},#1a4fa8)`,
                backgroundSize:"200% 100%",
                border:"none",color:"#fff",fontSize:".72rem",fontWeight:800,
                letterSpacing:2,cursor:"pointer",borderRadius:8,fontFamily:"inherit",
                boxShadow:`0 4px 20px ${C.ac}66`,
              }}>
                📨 {round>1?`${round}. Teklifi Gönder`:"Teklifi Gönder"}
              </button>
            </div>
          )}

          {/* DÜŞÜNÜYOR */}
          {stage==="thinking"&&(
            <div style={{textAlign:"center",padding:"30px 0"}}>
              <div style={{
                width:56,height:56,borderRadius:"50%",margin:"0 auto 14px",
                border:`3px solid ${C.brd}`,borderTopColor:C.ac2,
                animation:"spin 1s linear infinite"
              }}/>
              <div style={{fontSize:".78rem",fontWeight:700,color:C.wh,marginBottom:4}}>
                {agentProfile.name} değerlendiriyor
              </div>
              <div style={{fontSize:".6rem",color:C.dmr,marginBottom:8}}>{"●".repeat(dots+1)+"○".repeat(3-dots)}</div>
              <div style={{fontSize:".52rem",color:moodColor}}>{moodLabel}</div>
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
          )}

          {/* SONUÇ */}
          {stage==="result"&&(
            <div>
              {/* Result header */}
              <div style={{
                textAlign:"center",padding:"16px",marginBottom:10,
                background:result==="accepted"?"linear-gradient(135deg,rgba(39,174,96,.2),rgba(39,174,96,.05))":
                  result==="counter"?"linear-gradient(135deg,rgba(232,184,58,.2),rgba(232,184,58,.05))":
                  result==="hardno"?"linear-gradient(135deg,rgba(192,57,43,.25),rgba(192,57,43,.05))":
                  "linear-gradient(135deg,rgba(192,57,43,.15),rgba(192,57,43,.05))",
                border:`1px solid ${result==="accepted"?"rgba(39,174,96,.5)":result==="counter"?"rgba(232,184,58,.5)":"rgba(192,57,43,.5)"}`,
                borderRadius:10
              }}>
                <div style={{fontSize:"2.4rem",marginBottom:6,lineHeight:1}}>
                  {result==="accepted"?"✅":result==="counter"?"🤝":result==="hardno"?"🚫":"❌"}
                </div>
                <div style={{
                  fontSize:".96rem",fontWeight:900,letterSpacing:2,textTransform:"uppercase",marginBottom:6,
                  color:result==="accepted"?C.grn2:result==="counter"?C.gd:C.red2,
                }}>
                  {result==="accepted"?"Anlaşma Sağlandı!":result==="counter"?"Karşı Teklif":result==="hardno"?"Müzakere Kırıldı":"Teklif Reddedildi"}
                </div>
                <div style={{fontSize:".58rem",color:C.dim,lineHeight:1.5}}>
                  {result==="accepted"
                    ?`${player.n} ${isFree?"kadroya katılmayı":offer+"M€ + "+fmtSal(salOffer)+"/yıl · "+ctOffer+" yıl sözleşmeyi"} kabul etti.`
                    :result==="hardno"
                    ?`${agentProfile.name}: "Bu teklifle müzakereye devam etmemiz mümkün değil."`
                    :result==="counter"&&counterDemand
                    ?agentNote||"Müvekkil farklı koşullar talep ediyor."
                    :agentNote||"Teklifiniz reddedildi."}
                </div>
              </div>

              {/* Karşı teklif detayı */}
              {result==="counter"&&counterDemand&&(
                <div style={{marginBottom:10,padding:"12px 14px",
                  background:"rgba(232,184,58,.06)",border:"1px solid rgba(232,184,58,.3)",borderRadius:10}}>
                  <div style={{fontSize:".44rem",color:C.gd,letterSpacing:1.5,textTransform:"uppercase",fontWeight:700,marginBottom:6}}>
                    🧑‍💼 {agentProfile.name} — Tur {round} Talepleri
                  </div>
                  <div style={{fontSize:".56rem",color:C.dim,fontStyle:"italic",marginBottom:8,paddingBottom:7,
                    borderBottom:"1px solid rgba(232,184,58,.15)"}}>
                    "{counterDemand.reason}"
                  </div>
                  {counterDemand.rivalClub&&(
                    <div style={{marginBottom:8,padding:"4px 8px",borderRadius:4,
                      background:"rgba(192,57,43,.08)",border:"1px solid rgba(192,57,43,.2)",
                      fontSize:".52rem",color:C.red2}}>
                      ⚠️ {counterDemand.rivalClub} da bu oyuncuyu istiyor!
                    </div>
                  )}
                  <div style={{display:"grid",gridTemplateColumns:isFree?"1fr":"1fr 1fr",gap:7,marginBottom:8}}>
                    {!isFree&&(
                      <div style={{padding:"8px",background:"rgba(232,184,58,.08)",border:"1px solid rgba(232,184,58,.2)",borderRadius:6,textAlign:"center"}}>
                        <div style={{fontSize:".4rem",color:C.dmr,textTransform:"uppercase",marginBottom:2}}>Bonservis İstedi</div>
                        <div style={{fontSize:".84rem",fontWeight:900,color:C.gd}}>{counterDemand.fee}M€</div>
                        <div style={{fontSize:".4rem",color:counterDemand.fee<=offer?C.grn2:C.red2,marginTop:1}}>
                          {counterDemand.fee<=offer?"✅ Karşılayabilirsin":"❌ Teklifin: "+offer+"M€"}
                        </div>
                      </div>
                    )}
                    <div style={{padding:"8px",background:"rgba(26,110,216,.08)",border:`1px solid rgba(77,166,255,0.22)`,borderRadius:6,textAlign:"center"}}>
                      <div style={{fontSize:".4rem",color:C.dmr,textTransform:"uppercase",marginBottom:2}}>Maaş İstedi</div>
                      <div style={{fontSize:".84rem",fontWeight:900,color:C.ac2}}>{fmtSal(counterDemand.sal)}</div>
                      <div style={{fontSize:".4rem",color:counterDemand.sal<=salOffer?C.grn2:C.red2,marginTop:1}}>
                        {counterDemand.sal<=salOffer?"✅ Karşılayabilirsin":"❌ Teklifin: "+fmtSal(salOffer)}
                      </div>
                    </div>
                  </div>
                  {counterDemand.ct>ctOffer&&(
                    <div style={{padding:"6px 10px",background:"rgba(142,68,173,.08)",border:"1px solid rgba(142,68,173,.2)",
                      borderRadius:5,fontSize:".52rem",color:C.pur2,textAlign:"center",marginBottom:4}}>
                      📅 {counterDemand.ct} yıllık sözleşme istiyor (Teklifin: {ctOffer} yıl)
                    </div>
                  )}
                  <div style={{fontSize:".46rem",color:C.dmr,textAlign:"center"}}>
                    {round<maxRounds?`${maxRounds-round} tur hakkın daha var`:"Son tur — bu talepleri kabul etmek zorunda kalabilirsin"}
                  </div>
                </div>
              )}

              {/* Kabul sonrası özet */}
              {result==="accepted"&&(
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:10}}>
                  {[
                    [isFree?"Bonservis":"Bonservis",isFree?"Serbest":offer+"M€",C.gd],
                    ["Yıllık Maaş",fmtSal(salOffer),C.ac2],
                    ["Sözleşme",ctOffer+" yıl",C.wh],
                    ["Müzakere",round+". turda",C.pur2]
                  ].map(([l,v,c])=>(
                    <div key={l} style={{padding:"7px",background:"rgba(46,204,113,.06)",border:"1px solid rgba(39,174,96,.2)",borderRadius:6,textAlign:"center"}}>
                      <div style={{fontSize:".4rem",color:C.dmr,textTransform:"uppercase",letterSpacing:.8,marginBottom:2}}>{l}</div>
                      <div style={{fontSize:".74rem",fontWeight:800,color:c}}>{v}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Butonlar */}
              <div style={{display:"flex",gap:6}}>
                {result==="counter"&&counterDemand&&round<maxRounds&&(
                  <button onClick={doAcceptCounter} style={{
                    flex:2,padding:"10px 0",
                    background:"rgba(232,184,58,.15)",border:`1px solid ${C.gd}`,color:C.gd,
                    fontSize:".58rem",fontWeight:700,cursor:"pointer",borderRadius:6,fontFamily:"inherit"
                  }}>🤝 Talepleri Kabul Et</button>
                )}
                {(result==="rejected"||result==="counter")&&round<maxRounds&&(
                  <button onClick={doNewOffer} style={{
                    flex:1,padding:"10px 0",
                    background:"rgba(100,120,160,.1)",border:`1px solid rgba(77,166,255,0.22)`,color:C.dim,
                    fontSize:".58rem",fontWeight:700,cursor:"pointer",borderRadius:6,fontFamily:"inherit"
                  }}>✏️ Yeni Teklif</button>
                )}
                {result==="accepted"&&(
                  <button onClick={()=>onSuccess(player,isFree?0:offer,salOffer,ctOffer)} style={{
                    flex:2,padding:"10px 0",
                    background:`linear-gradient(135deg,#1e8449,${C.grn2})`,border:"none",color:"#fff",
                    fontSize:".64rem",fontWeight:800,cursor:"pointer",borderRadius:6,fontFamily:"inherit",
                    boxShadow:"0 4px 16px rgba(39,174,96,.4)"
                  }}>✅ İmzayı At!</button>
                )}
                <button onClick={()=>{ if(history.length===0) onOfferFailed(player.id); onBack(); }} style={{
                  flex:1,padding:"10px 0",
                  background:"rgba(100,120,160,.08)",border:`1px solid rgba(77,166,255,0.22)`,color:C.dim,
                  fontSize:".6rem",cursor:"pointer",borderRadius:6,fontFamily:"inherit"
                }}>Kapat</button>
              </div>
            </div>
          )}
        </>}
      </div>
    </div>
  );
}

function PageTransfer({db,onAction,onAddToSquad,addNews,rep,updateRep,league,finans,onMakeOffer,transferWindowOpen=true,currentMonth="",recentlyTransferred=new Set(),weeklyOfferedPlayers={},currentWeek=1,pendingSquad=[],squadFull=false,squadCount=0,transferPace="normal",onPaceChange=()=>{},scenarioConstraint=null}){
  const [q,setQ]=useState("");
  const [fPos,setFPos]=useState("");
  const [sort,setSort]=useState("ovr");
  const [sel,setSel]=useState(null);
  const [showOnlyFree,setShowOnlyFree]=useState(false);

  const freeCount=db.filter(p=>p.st==="free").length;
  const filtered=db.filter(p=>{
    if(showOnlyFree&&p.st!=="free"&&p.club!=="Serbest") return false;
    if(fPos&&p.pos!==fPos) return false;
    if(q){const lq=q.toLowerCase();if(!p.n.toLowerCase().includes(lq)&&!p.club.toLowerCase().includes(lq))return false;}
    return true;
  }).sort((a,b)=>sort==="age"?a[sort]-b[sort]:b[sort]-a[sort]);

  const stC={contracted:"red",expiring:"gold",listed:"blue",free:"green"};
  const stL={contracted:"Sözl.",expiring:"Bitiyor",listed:"Listede",free:"Serbest"};



  const repPts=rep?rep.pts:30;
  const repCol=repPts>=70?C.grn2:repPts>=40?"#e67e22":C.red2;
  const repLbl=repPts>=80?"Efsanevi":repPts>=60?"Tanınmış":repPts>=40?"Orta":repPts>=20?"Düşük":"Bilinmez";
  return(
    <div style={{flex:1,display:"flex",flexDirection:"column",minHeight:0}}>
      {/* ── Transfer Penceresi Durumu ── */}
      <div style={{flexShrink:0,padding:"8px 14px",
        background:transferWindowOpen
          ?"linear-gradient(90deg,rgba(26,184,92,.2) 0%,rgba(26,184,92,.04) 100%)"
          :"linear-gradient(90deg,rgba(231,76,60,.2) 0%,rgba(231,76,60,.04) 100%)",
        borderBottom:`1px solid ${transferWindowOpen?"rgba(48,224,112,.25)":"rgba(255,80,80,.25)"}`,
        display:"flex",alignItems:"center",gap:10,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",left:0,top:0,bottom:0,width:3,
          background:transferWindowOpen?"#30e070":"#ff5050",
          boxShadow:transferWindowOpen?"0 0 14px #30e070cc":"0 0 14px #ff5050cc"}}/>
        <div style={{width:8,height:8,borderRadius:"50%",flexShrink:0,marginLeft:8,
          background:transferWindowOpen?"#30e070":"#ff5050",
          boxShadow:transferWindowOpen?"0 0 10px #30e070bb":"0 0 10px #ff5050bb"}}/>
        <div style={{flex:1}}>
          <div style={{fontSize:".54rem",fontWeight:900,letterSpacing:.8,textTransform:"uppercase",
            color:transferWindowOpen?C.grn2:C.red2,lineHeight:1.2}}>
            {transferWindowOpen?"Transfer Penceresi Açık":"Transfer Penceresi Kapalı"}
          </div>
          {transferWindowOpen&&<div style={{fontSize:".42rem",color:"rgba(48,224,112,.55)",marginTop:1}}>{currentMonth} • Teklif yapılabilir</div>}
          {!transferWindowOpen&&<div style={{fontSize:".42rem",color:"rgba(232,151,90,.7)",marginTop:1}}>Serbest oyuncular hariç teklif verilemez</div>}
        </div>
        {pendingSquad.length>0&&<div style={{
          fontSize:".46rem",background:"rgba(232,184,58,.18)",color:C.gd,
          padding:"3px 10px",borderRadius:12,border:"1px solid rgba(232,184,58,.35)",fontWeight:700,
          boxShadow:"0 0 8px rgba(232,184,58,.15)"}}>
          ⏳ {pendingSquad.length} bekliyor
        </div>}
      </div>
      {/* ── Transfer Hareketliliği Seçici ── */}
      <div style={{flexShrink:0,padding:"6px 14px",
        background:C.nav,
        borderBottom:"1px solid rgba(77,166,255,0.08)",
        display:"flex",alignItems:"center",gap:8}}>
        <span style={{fontSize:".44rem",color:C.dim,whiteSpace:"nowrap",letterSpacing:.5,textTransform:"uppercase",fontWeight:600}}>Hareketlilik</span>
        <div style={{display:"flex",gap:4,background:C.inset,borderRadius:8,padding:"2px",border:"1px solid rgba(77,166,255,0.08)"}}>
        {[
          {key:"slow",  label:"Yavaş",     icon:"🐢"},
          {key:"normal",label:"Normal",    icon:"⚽"},
          {key:"fast",  label:"Hızlı",     icon:"🔥"},
        ].map(({key,label,icon})=>{
          const active=transferPace===key;
          const col=key==="slow"?"#5dade2":key==="normal"?"#30e070":"#ff6060";
          return(
            <button key={key} onClick={()=>onPaceChange(key)}
              style={{
                padding:"4px 11px",borderRadius:6,cursor:"pointer",
                fontFamily:"inherit",fontSize:".46rem",fontWeight:active?800:500,
                letterSpacing:active?.4:0,
                background:active?`linear-gradient(135deg,${col}33,${col}18)`:"transparent",
                border:active?`1px solid ${col}55`:"1px solid transparent",
                color:active?col:C.dim,
                display:"flex",alignItems:"center",gap:4,
                transition:"all .18s",
                boxShadow:active?`0 0 10px ${col}22`:"none"
              }}>
              <span style={{fontSize:".58rem"}}>{icon}</span>
              <span>{label}</span>
            </button>
          );
        })}
        </div>
        <span style={{marginLeft:"auto",fontSize:".43rem",color:C.dmr,fontStyle:"italic"}}>
          {transferPace==="slow"?"Az teklif gelir":transferPace==="fast"?"Pazar çok hareketli":"Dengeli pazar"}
        </span>
      </div>
      {/* ── Kadro Dolu Uyarısı ── */}
      {squadFull&&(
        <div style={{flexShrink:0,padding:"9px 14px",
          background:"linear-gradient(90deg,rgba(231,76,60,.2) 0%,rgba(231,76,60,.06) 100%)",
          borderBottom:"1px solid rgba(255,80,80,.25)",
          display:"flex",alignItems:"center",gap:10,position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",left:0,top:0,bottom:0,width:3,
            background:"#ff5050",boxShadow:"0 0 12px #ff5050cc"}}/>
          <span style={{fontSize:".9rem",marginLeft:4}}>⛔</span>
          <div style={{flex:1}}>
            <div style={{fontSize:".54rem",fontWeight:900,color:C.red2,letterSpacing:.7,textTransform:"uppercase"}}>Kadro Dolu — {squadCount}/32</div>
            <div style={{fontSize:".43rem",color:"rgba(232,151,90,.75)",marginTop:2}}>Önce bir oyuncu sat veya kadrodan çıkar</div>
          </div>
          <div style={{fontSize:".62rem",fontWeight:900,
            background:"rgba(255,80,80,.15)",border:"1px solid rgba(255,80,80,.3)",
            borderRadius:7,padding:"5px 10px",color:C.red2,
            boxShadow:"0 0 10px rgba(255,80,80,.15)"}}>{squadCount}/32</div>
        </div>
      )}
      {/* ── Transfer Yasağı Uyarısı ── */}
      {finans&&finans.transferBan&&finans.transferBan.active&&(
        <div style={{flexShrink:0,padding:"9px 14px",
          background:"linear-gradient(90deg,rgba(142,68,173,.2) 0%,rgba(142,68,173,.06) 100%)",
          borderBottom:"1px solid rgba(155,89,182,.3)",
          display:"flex",alignItems:"center",gap:10,position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",left:0,top:0,bottom:0,width:3,
            background:"#9b59b6",boxShadow:"0 0 12px #9b59b6cc"}}/>
          <span style={{fontSize:".9rem",marginLeft:4}}>🚫</span>
          <div style={{flex:1}}>
            <div style={{fontSize:".54rem",fontWeight:900,color:"#c39bd3",letterSpacing:.7,textTransform:"uppercase"}}>Transfer Yasağı Aktif</div>
            <div style={{fontSize:".43rem",color:"rgba(165,105,189,.75)",marginTop:2}}>Bütçeyi artıya çevirerek yasağı kaldırabilirsin</div>
          </div>
          <div style={{fontSize:".5rem",background:"rgba(142,68,173,.2)",border:"1px solid rgba(155,89,182,.35)",
            borderRadius:7,padding:"5px 9px",color:"#c39bd3",fontWeight:800,textAlign:"center",
            boxShadow:"0 0 10px rgba(142,68,173,.2)"}}>🚫 YASAK</div>
        </div>
      )}
      {/* ── Bütçe Uyarısı (1. sezon) ── */}
      {finans&&finans.transferBan&&finans.transferBan.budgetWarning&&!finans.transferBan.active&&(
        <div style={{flexShrink:0,padding:"9px 14px",
          background:"linear-gradient(90deg,rgba(230,126,34,.18) 0%,rgba(230,126,34,.05) 100%)",
          borderBottom:"1px solid rgba(230,126,34,.25)",
          display:"flex",alignItems:"center",gap:10,position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",left:0,top:0,bottom:0,width:3,
            background:"#e67e22",boxShadow:"0 0 12px #e67e22aa"}}/>
          <span style={{fontSize:".9rem",marginLeft:4}}>⚠️</span>
          <div style={{flex:1}}>
            <div style={{fontSize:".54rem",fontWeight:900,color:"#e67e22",letterSpacing:.7,textTransform:"uppercase"}}>Bütçe Uyarısı</div>
            <div style={{fontSize:".43rem",color:"rgba(232,151,90,.75)",marginTop:2}}>Gelecek sezon sonuna kadar kapatmazsan transfer yasağı alırsın</div>
          </div>
          <div style={{fontSize:".5rem",background:"rgba(230,126,34,.15)",border:"1px solid rgba(230,126,34,.3)",
            borderRadius:7,padding:"5px 9px",color:"#e67e22",fontWeight:800,
            boxShadow:"0 0 10px rgba(230,126,34,.15)"}}>⚠️ UYARI</div>
        </div>
      )}
      {/* ── İtibar + Bütçe Üst Bar ── */}
      {(rep||finans)&&<div style={{
        flexShrink:0,padding:"8px 14px",
        background:C.gradCard,
        borderBottom:"1px solid rgba(77,166,255,0.1)",
        display:"flex",gap:10,alignItems:"center"
      }}>
        {rep&&<div style={{display:"flex",alignItems:"center",gap:8,flex:1,minWidth:0}}>
          <div style={{
            padding:"3px 9px",borderRadius:20,fontSize:".43rem",fontWeight:800,letterSpacing:.6,
            background:`linear-gradient(135deg,${repCol}25,${repCol}10)`,
            color:repCol,border:`1px solid ${repCol}44`,
            boxShadow:`0 0 10px ${repCol}18`,whiteSpace:"nowrap"
          }}>⭐ {repLbl}</div>
          <div style={{flex:1,height:5,background:C.surfaceHover,borderRadius:3,overflow:"hidden",position:"relative"}}>
            <div style={{position:"absolute",left:0,top:0,bottom:0,
              width:repPts+"%",
              background:`linear-gradient(90deg,${repCol}aa,${repCol})`,
              borderRadius:3,boxShadow:`0 0 8px ${repCol}55`,
              transition:"width .4s ease"}}/>
          </div>
          <span style={{fontSize:".52rem",fontWeight:800,color:repCol,minWidth:24,textAlign:"right"}}>{repPts}</span>
        </div>}
        {rep&&finans&&<div style={{width:1,height:20,background:"rgba(77,166,255,0.12)"}}/>}
        {finans&&<div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:".38rem",color:C.dim,letterSpacing:.8,textTransform:"uppercase",marginBottom:1}}>Bütçe</div>
            <div style={{fontSize:".72rem",fontWeight:900,
              color:finans.budget>=5000?C.grn2:finans.budget>=1000?"#e67e22":C.red2,
              lineHeight:1,textShadow:finans.budget>=5000?"0 0 12px #30e07044":finans.budget>=1000?"0 0 12px #e67e2244":"0 0 12px #ff505044"}}>
              {(()=>{const b=finans.budget;const abs=Math.abs(b);return (b<0?"-":"")+(abs>=1000?(abs/1000).toFixed(1)+"M€":abs+"K€");})()}
            </div>
          </div>
          {finans.spent>0&&<div style={{textAlign:"right"}}>
            <div style={{fontSize:".38rem",color:C.dim,letterSpacing:.8,textTransform:"uppercase",marginBottom:1}}>Harcama</div>
            <div style={{fontSize:".54rem",fontWeight:700,color:"rgba(255,80,80,.7)"}}>
              -{finans.spent>=1000?(finans.spent/1000).toFixed(1)+"M€":finans.spent+"K€"}
            </div>
          </div>}
        </div>}
      </div>}
      {/* ── Sekme bar: Tümü / Serbest ── */}
      <div style={{flexShrink:0,display:"flex",borderBottom:"1px solid rgba(77,166,255,0.08)",
        background:C.nav,padding:"0 6px",gap:4}}>
        {[
          {free:false,label:"Tümü",icon:"📋",count:db.length,col:C.ac2,activeBg:"rgba(36,133,255,.12)"},
          {free:true, label:"Serbest",icon:"🆓",count:freeCount,col:C.grn2,activeBg:"rgba(26,184,92,.12)"},
        ].map(({free,label,icon,count,col,activeBg})=>{
          const active=showOnlyFree===free;
          return(
            <div key={label}
              style={{flex:1,padding:"9px 8px",textAlign:"center",cursor:"pointer",
                position:"relative",transition:"all .18s",
                background:active?activeBg:"transparent",
                borderRadius:"0 0 0 0"}}
              onClick={()=>{setShowOnlyFree(free);setSel(null);}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
                <span style={{fontSize:".58rem"}}>{icon}</span>
                <span style={{fontSize:".54rem",fontWeight:active?800:500,
                  color:active?col:C.dim,letterSpacing:active?.5:0,
                  transition:"all .18s"}}>{label}</span>
                <span style={{fontSize:".42rem",fontWeight:700,
                  background:active?`${col}25`:C.surfaceHover,
                  color:active?col:C.dmr,
                  padding:"1px 6px",borderRadius:10,border:active?`1px solid ${col}40`:"1px solid transparent",
                  transition:"all .18s"}}>{count}</span>
              </div>
              {active&&<div style={{position:"absolute",bottom:0,left:"15%",right:"15%",height:2,
                background:`linear-gradient(90deg,transparent,${col},transparent)`,
                boxShadow:`0 0 8px ${col}88`}}/>}
            </div>
          );
        })}
      </div>
      {/* ── Filtre bar ── */}
      <div style={{flexShrink:0,padding:"8px 10px",
        background:C.nav,
        borderBottom:"1px solid rgba(77,166,255,0.08)",
        display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
        <div style={{flex:1,minWidth:90,position:"relative",display:"flex",alignItems:"center"}}>
          <span style={{position:"absolute",left:8,fontSize:".58rem",pointerEvents:"none",zIndex:1,
            color:q?C.ac2:C.dmr}}>🔍</span>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Oyuncu veya kulüp ara..."
            style={{
              width:"100%",background:q?C.card2:C.card,
              border:`1px solid ${q?"rgba(77,166,255,.4)":"rgba(77,166,255,.12)"}`,color:C.wh,
              fontSize:".52rem",padding:"6px 8px 6px 26px",borderRadius:7,outline:"none",
              fontFamily:"inherit",transition:"all .18s",
              boxShadow:q?"0 0 12px rgba(77,166,255,.12)":"none"
            }}/>
          {q&&<span onClick={()=>setQ("")} style={{position:"absolute",right:8,fontSize:".55rem",
            color:C.dim,cursor:"pointer",lineHeight:1}}>✕</span>}
        </div>
        <select value={fPos} onChange={e=>setFPos(e.target.value)}
          style={{
            background:fPos?C.card2:C.card,
            border:`1px solid ${fPos?"rgba(77,166,255,.4)":"rgba(77,166,255,.12)"}`,
            color:fPos?C.wh:C.dim,
            fontSize:".5rem",padding:"6px 6px",borderRadius:7,fontFamily:"inherit",cursor:"pointer",
            transition:"all .18s"
          }}>
          {["","GK","CB","LB","RB","CM","LM","RM","CAM","CDM","ST"].map(o=>(
            <option key={o} value={o}>{o||"Mevki"}</option>
          ))}
        </select>
        <select value={sort} onChange={e=>setSort(e.target.value)}
          style={{
            background:C.card,border:"1px solid rgba(77,166,255,.12)",
            color:C.dim,
            fontSize:".5rem",padding:"6px 6px",borderRadius:7,fontFamily:"inherit",cursor:"pointer"
          }}>
          {[["ovr","OVR↓"],["pot","POT↓"],["val","Değer"],["ch","Şans"],["age","Yaş"]].map(([v,l])=>(
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <div style={{
          padding:"5px 9px",borderRadius:7,fontSize:".46rem",fontWeight:700,
          background:"rgba(36,133,255,.1)",color:C.dim,
          border:"1px solid rgba(36,133,255,.15)",whiteSpace:"nowrap",letterSpacing:.3
        }}>{filtered.length}<span style={{color:C.dim,fontWeight:500}}>/{db.length}</span></div>
      </div>

      {/* ── Kart Listesi ── */}
      <div style={{flex:1,overflowY:"auto",padding:"8px 8px 20px",background:C.card}}>
        {filtered.map(pl=>{
          const isOpen=!!(sel&&sel.id===pl.id);
          // Transfer OVR renk semas: 90+ kirmizi, 80-89 sari, 70-79 gumus, 60-69 bronz, <60 acik turuncu
          const gc=pl.ovr>=90?C.red2:pl.ovr>=80?C.gd:pl.ovr>=70?(isLightTheme()?"#64748b":"#b0bec5"):pl.ovr>=60?(isLightTheme()?"#a16207":"#cd7f32"):C.ora;
          const stColors={contracted:C.red2,expiring:C.gd,listed:C.ac2,free:C.grn2};
          const stLabels={contracted:"SÖZL.",expiring:"BİTİYOR",listed:"LİSTEDE",free:"SERBEST"};
          // "Adil teklif" senaryosu — teklif ekranıyla tutarlı baz hesap
          const _ev=calcEffectiveVal(pl);
          const _fairOffer=pl.st==="free"?0:_ev;
          const _fairSal=Math.round(calcEffectiveSal(pl)*0.95); // tam beklentiye yakın maaş
          const plAccept=calcAcceptProb({player:pl,repPts:rep?rep.pts:30,league,offer:_fairOffer,salOffer:_fairSal,ctOffer:3,round:1});
          const chColor=plAccept>=70?C.grn2:plAccept>=40?C.gd:C.red2;
          return(
            <div key={pl.id} style={{marginBottom:isOpen?0:6}}>
              {/* Ana kart satırı */}
              <div onClick={()=>setSel(isOpen?null:pl)}
                style={{
                  display:"flex",alignItems:"center",gap:9,padding:"8px 11px",
                  cursor:"pointer",
                  borderRadius:isOpen?"9px 9px 0 0":9,
                  background:isOpen
                    ?C.gradSel
                    :C.gradCard,
                  border:`1px solid ${isOpen?"rgba(77,166,255,.45)":"rgba(77,166,255,0.1)"}`,
                  borderBottom:isOpen?"1px solid rgba(77,166,255,.2)":"1px solid rgba(77,166,255,0.08)",
                  boxShadow:isOpen?"0 4px 20px rgba(21,98,204,.2), inset 0 1px 0 rgba(77,166,255,.08)":"inset 0 1px 0 rgba(255,255,255,.02)",
                  transition:"all .18s",
                  position:"relative",overflow:"hidden"
                }}>
                {/* Left accent stripe */}
                {isOpen&&<div style={{position:"absolute",left:0,top:0,bottom:0,width:2,
                  background:`linear-gradient(180deg,${gc}aa,${gc}33)`,
                  boxShadow:`2px 0 8px ${gc}44`}}/>}
                {/* OVR circle */}
                <div style={{
                  width:38,height:38,borderRadius:"50%",flexShrink:0,
                  background:`conic-gradient(${gc} ${pl.ovr*3.6}deg,${C.surface} 0deg)`,
                  display:"flex",alignItems:"center",justifyContent:"center",
                  boxShadow:`0 0 10px ${gc}33`
                }}>
                  <div style={{
                    width:29,height:29,borderRadius:"50%",
                    background:C.gradCard,
                    display:"flex",alignItems:"center",justifyContent:"center"
                  }}>
                    <div style={{fontSize:".72rem",fontWeight:900,color:gc,lineHeight:1}}>{pl.ovr}</div>
                  </div>
                </div>
                {/* İsim + kulüp */}
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:2}}>
                    <span style={{fontSize:".66rem",fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",
                      whiteSpace:"nowrap",color:isOpen?C.wh:C.wh,letterSpacing:.1}}>{pl.n}</span>
                    <div style={{
                      padding:"1px 5px",borderRadius:3,fontSize:".38rem",fontWeight:800,flexShrink:0,
                      background:`${stColors[pl.st]||C.ac2}1a`,color:stColors[pl.st]||C.ac2,
                      border:`1px solid ${stColors[pl.st]||C.ac2}38`,letterSpacing:.7,
                      textTransform:"uppercase"
                    }}>{stLabels[pl.st]||pl.st}</div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:5}}>
                    <span style={{color:posC(pl.pos).c,fontWeight:700,fontSize:".42rem",
                      padding:"1px 5px",borderRadius:3,background:posC(pl.pos).bg,
                      border:`1px solid ${posC(pl.pos).b}`,letterSpacing:.4}}>{pl.pos}</span>
                    <span style={{fontSize:".44rem",color:C.dim,overflow:"hidden",
                      textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{pl.club}</span>
                  </div>
                </div>
                {/* Stats sağ */}
                <div style={{display:"flex",gap:8,alignItems:"center",flexShrink:0}}>
                  <div style={{textAlign:"center",minWidth:24}}>
                    <div style={{fontSize:".32rem",color:C.dmr,marginBottom:1,letterSpacing:.4,textTransform:"uppercase"}}>Pot</div>
                    <div style={{fontSize:".56rem",fontWeight:800,color:C.pur2}}>{pl.pot}</div>
                  </div>
                  <div style={{textAlign:"center",minWidth:32}}>
                    <div style={{fontSize:".32rem",color:C.dmr,marginBottom:1,letterSpacing:.4}}>€</div>
                    <div style={{fontSize:".5rem",fontWeight:700,
                      color:pl.st==="free"?C.grn2:(isLightTheme()?C.wh:C.dim)}}>
                      {pl.st==="free"?"FREE":calcEffectiveVal(pl)+"M"}
                    </div>
                  </div>
                  <div style={{
                    width:34,height:34,borderRadius:7,flexShrink:0,
                    background:`linear-gradient(135deg,${chColor}20,${chColor}0a)`,
                    border:`1px solid ${chColor}44`,
                    display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
                    boxShadow:`0 0 8px ${chColor}22`
                  }}>
                    <div style={{fontSize:".38rem",color:`${chColor}88`,lineHeight:1,marginBottom:1}}>ŞNS</div>
                    <div style={{fontSize:".54rem",fontWeight:900,color:chColor,lineHeight:1}}>{plAccept}%</div>
                  </div>
                  <div style={{fontSize:".55rem",color:isOpen?C.ac2:C.dim,
                    transition:"all .18s"}}>{isOpen?"▲":"▼"}</div>
                </div>
              </div>

              {/* Accordion detay */}
              {isOpen&&(
                <div style={{
                  background:C.gradCard,
                  border:"1px solid rgba(77,166,255,.35)",borderTop:"none",
                  borderRadius:"0 0 10px 10px",padding:"12px 14px",
                  boxShadow:"0 12px 32px rgba(0,0,0,.6), inset 0 1px 0 rgba(77,166,255,.05)"
                }}>
                  {/* Info grid */}
                  <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginBottom:12}}>
                    {[
                      ["Yaş",pl.age,C.wh,"🎂"],
                      ["Uyruk",pl.nat,C.dim,"🌍"],
                      ["Sözleşme",pl.ct>0?pl.ct+"y":"Yok",pl.ct<=1?C.red2:C.wh,"📋"],
                      ["Maaş",pl.sal>0?fmtSal(pl.sal):"—",C.dim,"💶"],
                    ].map(([l,v,c,ico])=>(
                      <div key={l} style={{
                        padding:"6px 6px 5px",
                        background:"linear-gradient(135deg,rgba(21,98,204,.1),rgba(10,20,50,.4))",
                        border:"1px solid rgba(77,166,255,.1)",borderRadius:7,textAlign:"center"}}>
                        <div style={{fontSize:".35rem",color:C.dim,textTransform:"uppercase",
                          letterSpacing:.8,marginBottom:3}}>{ico} {l}</div>
                        <div style={{fontSize:".6rem",fontWeight:800,color:c,letterSpacing:.1}}>{v}</div>
                      </div>
                    ))}
                  </div>
                  {/* Lig chip */}
                  <div style={{marginBottom:12,display:"flex",alignItems:"center",gap:6}}>
                    <span style={{fontSize:".4rem",color:C.dim,letterSpacing:.6,textTransform:"uppercase"}}>Lig</span>
                    <span style={{fontSize:".46rem",color:C.dim,
                      background:"rgba(77,166,255,.06)",border:"1px solid rgba(77,166,255,.1)",
                      padding:"2px 8px",borderRadius:10}}>{pl.lg}</span>
                  </div>
                  {/* Potansiyel bar */}
                  <div style={{marginBottom:12}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
                      <span style={{fontSize:".42rem",color:C.dim,letterSpacing:.4,textTransform:"uppercase"}}>Gelişim</span>
                      <div style={{display:"flex",alignItems:"center",gap:4}}>
                        <span style={{fontSize:".5rem",fontWeight:800,color:C.ac2}}>{pl.ovr}</span>
                        <span style={{fontSize:".38rem",color:C.dmr}}>→</span>
                        <span style={{fontSize:".5rem",fontWeight:800,color:C.pur2}}>{pl.pot}</span>
                        <span style={{fontSize:".4rem",color:C.pur2,fontWeight:700,
                          background:"rgba(142,68,173,.15)",border:"1px solid rgba(142,68,173,.25)",
                          padding:"0px 5px",borderRadius:8,marginLeft:2}}>+{pl.pot-pl.ovr}</span>
                      </div>
                    </div>
                    <div style={{height:6,background:"rgba(100,140,220,.06)",borderRadius:4,overflow:"hidden",position:"relative"}}>
                      <div style={{position:"absolute",left:0,top:0,height:"100%",
                        width:`${pl.ovr}%`,
                        background:`linear-gradient(90deg,${C.ac}cc,${C.ac2})`,
                        borderRadius:4,boxShadow:`0 0 8px ${C.ac2}44`}}/>
                      <div style={{position:"absolute",left:`${pl.ovr}%`,top:0,height:"100%",
                        width:`${Math.max(0,pl.pot-pl.ovr)}%`,
                        background:"linear-gradient(90deg,rgba(142,68,173,.5),rgba(180,100,255,.35))",
                        borderRadius:4}}/>
                    </div>
                  </div>
                  {/* Şans bar */}
                  <div style={{marginBottom:12}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
                      <span style={{fontSize:".42rem",color:C.dim,letterSpacing:.4,textTransform:"uppercase"}}>Kabul Şansı</span>
                      <span style={{fontSize:".5rem",fontWeight:800,color:chColor,
                        textShadow:`0 0 8px ${chColor}66`}}>{plAccept}%</span>
                    </div>
                    <div style={{height:6,background:"rgba(100,140,220,.06)",borderRadius:4,overflow:"hidden"}}>
                      <div style={{height:"100%",width:`${plAccept}%`,
                        background:`linear-gradient(90deg,${chColor}88,${chColor})`,
                        borderRadius:4,boxShadow:`0 0 10px ${chColor}55`,transition:"width .4s ease"}}/>
                    </div>
                  </div>
                  {/* Butonlar */}
                  <div style={{display:"flex",gap:7}}>
                    {rep&&<div style={{
                      background:C.gradCard,
                      borderRadius:8,padding:"6px 10px",
                      border:"1px solid rgba(100,150,255,.12)",
                      display:"flex",flexDirection:"column",justifyContent:"center",minWidth:74
                    }}>
                      <div style={{fontSize:".36rem",color:C.dim,marginBottom:2,
                        letterSpacing:.7,textTransform:"uppercase"}}>İtibar</div>
                      <div style={{fontSize:".58rem",fontWeight:800,
                        color:rep.pts>=60?C.grn2:rep.pts>=35?"#e67e22":C.red2,
                        textShadow:rep.pts>=60?"0 0 8px #30e07044":"none"}}>
                        {rep.pts}/100
                      </div>
                    </div>}
                    {(()=>{
                      const isWeeklyLocked=weeklyOfferedPlayers[pl.id]===currentWeek;
                      const isBanned=finans&&finans.transferBan&&finans.transferBan.active&&pl.st!=="free";
                      const isU23Blocked=scenarioConstraint==="u23only"&&(pl.age||99)>23;
                      const isDisabled=squadFull||recentlyTransferred.has(pl.id)||(!transferWindowOpen&&pl.st!=="free")||isWeeklyLocked||isBanned||isU23Blocked;
                      const btnBg=squadFull?"rgba(231,76,60,.12)":recentlyTransferred.has(pl.id)?"rgba(232,184,58,.12)":isWeeklyLocked?"rgba(100,120,200,.12)":isBanned?"rgba(142,68,173,.12)":isU23Blocked?"rgba(40,224,106,.08)":(!transferWindowOpen&&pl.st!=="free")?"rgba(77,100,160,.1)":`linear-gradient(135deg,#1562cc,#4da6ff)`;
                      const btnBorder=squadFull?"1px solid rgba(231,76,60,.3)":recentlyTransferred.has(pl.id)?"1px solid rgba(232,184,58,.3)":isWeeklyLocked?"1px solid rgba(100,120,200,.35)":isBanned?"1px solid rgba(142,68,173,.35)":isU23Blocked?"1px solid rgba(40,224,106,.25)":(!transferWindowOpen&&pl.st!=="free")?"1px solid rgba(77,166,255,0.18)":"none";
                      const btnLabel=squadFull?"⛔ Kadro Dolu":recentlyTransferred.has(pl.id)?"⏳ Beklemede":isWeeklyLocked?"⏰ Sonraki Hafta":isBanned?"🚫 Transfer Yasağı":isU23Blocked?"🌱 Sadece U23":(!transferWindowOpen&&pl.st!=="free")?"🔒 Pencere Kapalı":"📨 Teklif Yap";
                      return <button
                        disabled={isDisabled}
                        onClick={e=>{e.stopPropagation();if(!isDisabled)onMakeOffer(pl);}}
                        style={{
                          flex:1,padding:"10px 0",
                          background:btnBg,border:btnBorder,
                          color:isDisabled?C.dmr:"#fff",
                          fontSize:".54rem",fontWeight:800,letterSpacing:.6,
                          cursor:isDisabled?"not-allowed":"pointer",
                          borderRadius:8,fontFamily:"inherit",
                          boxShadow:isDisabled?"none":`0 4px 16px rgba(21,98,204,.45), 0 1px 0 rgba(255,255,255,.15) inset`,
                          textTransform:"uppercase",
                          transition:"all .15s"
                        }}>
                        {btnLabel}
                      </button>;
                    })()}
                    <button onClick={e=>{e.stopPropagation();setSel(null);}}
                      style={{
                        padding:"10px 12px",
                        background:"rgba(77,100,160,.08)",
                        border:"1px solid rgba(77,166,255,0.12)",
                        color:C.dim,fontSize:".62rem",
                        cursor:"pointer",borderRadius:8,fontFamily:"inherit",
                        transition:"all .15s"
                      }}>✕</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {filtered.length===0&&(
          <div style={{textAlign:"center",padding:"40px 20px",color:C.dmr}}>
            <div style={{fontSize:"2.2rem",marginBottom:10,filter:"grayscale(.5)"}}>🔍</div>
            <div style={{fontSize:".6rem",color:C.dim,fontWeight:600,letterSpacing:.5}}>Oyuncu bulunamadı</div>
            <div style={{fontSize:".46rem",color:C.dmr,marginTop:4}}>Filtreni değiştirmeyi dene</div>
          </div>
        )}
      </div>
    </div>
  );
}
