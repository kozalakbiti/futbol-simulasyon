// ═══════════════════════════════════════════════════════════════
// İNTERAKTİF AN SİSTEMİ — New Star Manager tarzı müdahale
// ═══════════════════════════════════════════════════════════════

const MOMENT_TYPES={
  corner:{
    id:"corner", icon:"🚩", label:"KORNER!", color:"#ffd060",
    desc:"Köşe vuruşu kazandık! Nasıl kullanacaksın?",
    options:[
      {id:"high",  icon:"⬆️", label:"Yüksek Orta",  desc:"Uzun top, kafa vuruşu",    stat:"sht", bonus:0.32},
      {id:"short", icon:"↩️", label:"Kısa Pas",      desc:"Kombinasyonla pozisyon",   stat:"pas", bonus:0.28},
      {id:"far",   icon:"🎯", label:"Uzak Direk",    desc:"Süpriz açı girişimi",      stat:"sht", bonus:0.20},
    ]
  },
  freekick:{
    id:"freekick", icon:"📐", label:"SERBEST VURUŞ!", color:"#3498db",
    desc:"Tehlikeli bölgede serbest vuruş! Tercihini yap.",
    options:[
      {id:"direct",icon:"🚀", label:"Doğrudan Şut", desc:"Güçlü ve isabetli vuruş",  stat:"sht", bonus:0.38},
      {id:"wall",  icon:"↗️", label:"Duvarın Üstü", desc:"Eğimli teknik vuruş",      stat:"pas", bonus:0.30},
      {id:"pass",  icon:"↩️", label:"Kısa Kombinasyon",desc:"Pozisyon oluştur",      stat:"pas", bonus:0.22},
    ]
  },
  counter:{
    id:"counter", icon:"⚡", label:"KONTR ATAK!", color:"#30e070",
    desc:"Hızlı çıkış fırsatı! Rakip savunma açık!",
    options:[
      {id:"sprint",icon:"🏃", label:"Sürat Koşusu",  desc:"Maksimum hız, tek pas",   stat:"spd", bonus:0.40},
      {id:"dribble",icon:"🔥",label:"Dribling",      desc:"Rakibi geç, şut çek",     stat:"spd", bonus:0.33},
      {id:"wait",  icon:"⏸️", label:"Bekle & Gör",   desc:"Pozisyon kur, daha güvenli",stat:"pas",bonus:0.18},
    ]
  },
  penalty:{
    id:"penalty", icon:"🔴", label:"PENALTI!", color:"#ff5050",
    desc:"Hakem gösterdi! Penaltı noktasına gidiyoruz.",
    options:[
      {id:"power", icon:"💥", label:"Güç Vuruşu",    desc:"Köşeye sert şut",        stat:"sht", bonus:0.50},
      {id:"place", icon:"🎯", label:"İsabetli Köşe", desc:"Kalecinin tersi köşe",    stat:"sht", bonus:0.42},
      {id:"chip",  icon:"🎩", label:"Çip Vuruş",     desc:"Ortaya yüksek, riskli",   stat:"sht", bonus:0.28},
    ]
  },
  oneonone:{
    id:"oneonone", icon:"🎯", label:"BİREBİR!", color:"#9b59b6",
    desc:"Forvet kaleci karşısında! Büyük gol fırsatı!",
    options:[
      {id:"shoot", icon:"⚽", label:"Hemen Şut",     desc:"İlk dokunuşta vuruş",    stat:"sht", bonus:0.44},
      {id:"lob",   icon:"🌈", label:"Çip Aşırma",    desc:"Kalecinin üstünden",      stat:"sht", bonus:0.34},
      {id:"fake",  icon:"💃", label:"Yanıltma + Şut",desc:"Kaleciye hamle, sonra şut",stat:"spd",bonus:0.38},
    ]
  },
  scramble:{
    id:"scramble", icon:"💥", label:"CEZA SAHASINDA KARAMBOL!", color:"#e67e22",
    desc:"Top ceza sahasında sekti! Saniyeler içinde karar ver.",
    options:[
      {id:"poke",  icon:"🦶", label:"Hemen Vur",      desc:"İlk dokunuşta kaleye",     stat:"sht", bonus:0.36},
      {id:"lay",   icon:"↪️", label:"Arkadaşa Bırak", desc:"Boştaki arkadaşa çıkar",   stat:"pas", bonus:0.30},
      {id:"turn",  icon:"🔄", label:"Dönüp Vur",      desc:"Savunmacıyı sırtla, dön",  stat:"spd", bonus:0.32},
    ]
  },
  cross:{
    id:"cross", icon:"⤴️", label:"KANAT ORTASI!", color:"#f39c12",
    desc:"Kanatta topla buluştun, ceza sahası dolu!",
    options:[
      {id:"high",  icon:"🎯", label:"Arka Direğe Orta",desc:"Kafa vuruşu için yüksek top", stat:"pas", bonus:0.34},
      {id:"low",   icon:"➡️", label:"Yerden Kesme",    desc:"Ceza sahasına sert yerden",  stat:"pas", bonus:0.30},
      {id:"cut",   icon:"↩️", label:"İçeri Kat & Vur", desc:"Çizgiden içeri, şut",        stat:"sht", bonus:0.26},
    ]
  },
  through:{
    id:"through", icon:"🗡️", label:"ARA PASI!", color:"#16a085",
    desc:"Savunmanın arkası boş! Forvet koşuya kalkıyor.",
    options:[
      {id:"ball",  icon:"🧭", label:"Ara Pası",        desc:"Savunmanın arkasına",       stat:"pas", bonus:0.38},
      {id:"finish",icon:"⚽", label:"Kaleciyle Karşı Karşıya",desc:"Birebirde bitir",   stat:"sht", bonus:0.36},
      {id:"chip",  icon:"🌈", label:"Havadan Aşırt",   desc:"Kalecinin üstünden",        stat:"sht", bonus:0.26},
    ]
  },
  longshot:{
    id:"longshot", icon:"🚀", label:"UZAKTAN ŞUT FIRSATI!", color:"#c0392b",
    desc:"Ceza sahası dışında boşluk var! Dene ya da oyun kur.",
    options:[
      {id:"power", icon:"💥", label:"Sert Şut",        desc:"Kaleciyi zorla",            stat:"sht", bonus:0.30},
      {id:"curl",  icon:"🌀", label:"Plase Falso",     desc:"Uzak köşeye kavisli",       stat:"sht", bonus:0.28},
      {id:"work",  icon:"🔁", label:"Pas Kombinasyonu",desc:"Daha iyi pozisyon ara",     stat:"pas", bonus:0.24},
    ]
  },
  tackle:{
    id:"tackle", icon:"🛡️", label:"KRİTİK MÜDAHALE!", color:"#1abc9c",
    desc:"Rakip hücuma geçti! Savunma kararı ver.",
    options:[
      {id:"slide", icon:"⚡", label:"Kayarak Müdahale",desc:"Agresif, top al",       stat:"def", bonus:0.40},
      {id:"block", icon:"🧱", label:"Şutu Blok Et",   desc:"Pozisyon al, engelle",   stat:"def", bonus:0.35},
      {id:"foul",  icon:"🦵", label:"Stratejik Faul", desc:"Durdur, kart riski var", stat:"def", bonus:0.55},
    ]
  },
};

// Oturum boyu son görülen kilit an türleri (maçlar arası cooldown; kayda yazılmaz)
const MOMENT_RECENT={list:[]};

// Maç başı müdahale anlarını planlayan fonksiyon
function planMoments(myStr, oppStr, squad){
  // Sadece sahaya çıkan 11 oyuncu scorer/assister olabilir
  const lineupPlayers=squad; // tüm kadro — pozisyon ağırlığı filtreler
  const src=lineupPlayers.length>0?lineupPlayers:INIT_SQUAD;
  const atk=src.filter(p=>["ST","LM","RM","CAM"].includes(p.pos));
  const mid=src.filter(p=>["CM","CAM","CDM"].includes(p.pos));
  const def=src.filter(p=>["CB","LB","RB"].includes(p.pos));
  const all=src.filter(p=>p.pos!=="GK");

  const pickPlayer=(pool)=>pool[Math.floor(Math.random()*pool.length)]||all[0]||src[0];
  const moments=[];

  // ROTASYON + COOLDOWN: maçta 6–8 an; aynı tür (savunma hariç) bir maçta en çok bir kez, son maçlarda görülen türler (MOMENT_RECENT, oturum boyu) bekletilir.
  //   Ağırlık: hücum türleri; penaltı nadir; savunma (tackle) maçta 1–2 kez.
  const atkPool=[...atk,...mid];
  const W={corner:0.8,freekick:1,counter:0.8,scramble:1.1,cross:1.1,through:1.1,oneonone:0.9,longshot:1,penalty:0.45};
  const recent=MOMENT_RECENT.list;
  const pickType=(used,prevType,only)=>{
    let tot=0; const cand=[];
    for(const t in W){
      if(used.has(t)||t===prevType||(only&&!only.includes(t))) continue;
      const ri=recent.lastIndexOf(t);                       // yakın zamanda görüldüyse bekleme cezası
      const cool=ri<0?1:Math.min(1,0.15+0.17*(recent.length-1-ri));
      const w=W[t]*cool; if(w<=0) continue;
      cand.push([t,w]); tot+=w;
    }
    let r=Math.random()*tot;
    for(const [t,w] of cand){ if((r-=w)<=0) return t; }
    return cand.length?cand[cand.length-1][0]:"counter";
  };
  // Dakikalar: iki devreye eşit, dilimlere yayılı (aralarında en az ~3 dk; devre arasına denk gelmez)
  const n=6+(Math.random()<0.25?0:Math.random()<0.67?1:2);    // %25: 6 · %50: 7 · %25: 8
  const n1=n%2&&Math.random()<0.5?Math.ceil(n/2):Math.floor(n/2);
  const spread=(lo,hi,k)=>{ const s=(hi-lo)/k; return Array.from({length:k},(_,i)=>Math.floor(lo+s*(i+Math.random()*0.65))); };
  const mins=[...spread(7,43,n1),...spread(50,89,n-n1)];
  // Garanti türler rastgele yuvalara: 1 kontra, 1–2 duran top, 1–2 savunma; kalan yuvalar açık oyun ağırlıklı
  const slots=mins.map(()=>null), free=mins.map((_,i)=>i);
  const put=(t,ok)=>{ const c=free.filter(i=>!ok||ok(i)); if(!c.length) return; const i=c[Math.floor(Math.random()*c.length)]; slots[i]=t; free.splice(free.indexOf(i),1); };
  const used=new Set();
  const take=(only)=>{ const t=pickType(used,null,only); used.add(t); return t; };
  put("tackle",i=>i>0);
  if(n===8||Math.random()<0.5) put("tackle",i=>i>0&&slots[i-1]!=="tackle"&&slots[i+1]!=="tackle");
  put(take(["counter"]));
  put(take(["corner","freekick","penalty"]));
  if(n>6) put(take(["corner","freekick","penalty"]));
  free.slice().forEach(i=>{ slots[i]=take(["scramble","cross","through","oneonone","longshot"]); });
  const plan=mins.map((min,i)=>{
    const type=slots[i];
    const pool=type==="tackle"?def:(type==="penalty"||type==="oneonone"||type==="through"?atk:atkPool);
    return {type,min,player:pickPlayer(pool.length?pool:all)};
  });
  // Oturum boyu son görülen türler (cooldown penceresi 8)
  plan.forEach(p=>{ recent.push(p.type); });
  while(recent.length>8) recent.shift();

  plan.forEach(p=>{
    const mt=MOMENT_TYPES[p.type];
    moments.push({
      min:p.min,
      type:p.type,
      player:p.player,
      config:mt,
      resolved:false,
    });
  });

  return moments.sort((a,b)=>a.min-b.min);
}

// Kilit an sonuç metinleri (3D açılamazsa otomatik sonuç: InteractiveMoment3D)
function getMomentMsg(type,optId,success,name){
  const msgs={
    corner:{high:{ok:`${name} kafa vuruşuyla GOL!`,fail:`Kafa yanlış noktaya, rakip uzaklaştırdı.`},short:{ok:`Kısa kombinasyon! ${name} GOL attı!`,fail:`Kombinasyon bozuldu, top kaybı.`},far:{ok:`Uzak direğe sürpriz! GOL!`,fail:`Uzak direk denemesi dışarı.`}},
    freekick:{direct:{ok:`${name} muhteşem vuruş! GOL!`,fail:`Harika vuruş ama direkten döndü!`},wall:{ok:`${name} duvarın üstünden GOL!`,fail:`Duvarın üstünden ama kaleci tuttu.`},pass:{ok:`Kombinasyon, ${name} son vuruşu GOL!`,fail:`Kombinasyon iyi başladı ama son pas kaçtı.`}},
    counter:{sprint:{ok:`${name} savunmayı geçti, GOL!`,fail:`${name} süratle gitti ama kaleci kurtardı!`},dribble:{ok:`Muhteşem dribling! ${name} GOL!`,fail:`Dribling güzeldi ama direkten döndü.`},wait:{ok:`Sabırla oynandı, ${name} GOL!`,fail:`Beklemek işe yaramadı, top kaybı.`}},
    penalty:{power:{ok:`${name} güçlü vuruş, köşeye! GOL!`,fail:`Çok sert, direkten döndü!`},place:{ok:`${name} kalecinin tersine! GOL!`,fail:`Kaleci tarafı seçti ve kurtardı!`},chip:{ok:`Cesur çip! GOL!`,fail:`Çip ortaya düştü, kaleci yakaladı!`}},
    oneonone:{shoot:{ok:`${name} ilk dokunuşta GOL!`,fail:`${name} vurdu ama kaleci kurtardı!`},lob:{ok:`${name} enfes çip! GOL!`,fail:`Çip yüksek kaldı, dışarı.`},fake:{ok:`${name} kaleciye yıldırdı! GOL!`,fail:`Yanıltma bitmeden kaleci atıldı!`}},
    scramble:{poke:{ok:`Karambolde ilk dokunuş! ${name} GOL!`,fail:`${name} vurdu ama ayaklar arasında kaldı.`},lay:{ok:`${name} bıraktı, arkadaşı tamamladı: GOL!`,fail:`Bırakılan top savunmaya takıldı.`},turn:{ok:`${name} döndü ve vurdu: GOL!`,fail:`Dönüş yavaş kaldı, top kaptırıldı.`}},
    cross:{high:{ok:`Arka direğe orta, kafa: GOL!`,fail:`Orta kaleciye gitti.`},low:{ok:`Yerden kesme, iç tarafa dokunuş: GOL!`,fail:`Kesme ortayı savunma uzaklaştırdı.`},cut:{ok:`${name} içeri kattı, köşeye GOL!`,fail:`İçeri katış şutu dışarı gitti.`}},
    through:{ball:{ok:`Muhteşem ara pası! ${name} bitirdi: GOL!`,fail:`Ara pası uzun kaldı, kaleci aldı.`},finish:{ok:`${name} kaleciyle karşı karşıya: GOL!`,fail:`${name} birebirde kaleciye takıldı!`},chip:{ok:`${name} kalecinin üstünden aşırttı: GOL!`,fail:`Aşırtma üstten auta gitti.`}},
    longshot:{power:{ok:`${name} uzaktan füze! GOL!`,fail:`Sert şut kaleciden döndü.`},curl:{ok:`${name} uzak köşeye falso: GOL!`,fail:`Falso az farkla dışarı.`},work:{ok:`Sabırlı paslaşma, ${name} GOL!`,fail:`Kombinasyon kesildi.`}},
    tackle:{slide:{ok:`Mükemmel kayarak müdahale! Tehlike atlatıldı!`,fail:`Müdahale geç kaldı, rakip geçti!`},block:{ok:`Şut bloke edildi! Harika savunma!`,fail:`Blok tutmadı, şut devam etti!`},foul:{ok:`Stratejik faul, hücum durduruldu.`,fail:`Faul, sarı kart ve serbest vuruş!`}},
  };
  const msgSet=msgs[type]?.[optId];
  return msgSet?(success?msgSet.ok:msgSet.fail):(success?"Başarılı!":"Başarısız!");
}

// ── SAHA BÖLGESİ ↔ KİLİT AN (3D canlı akış) ──
//   Top konumu 0–100 (x: 100 = rakip kale). own: kendi yarımız · mid: orta saha · final: rakip 3. bölge.
const MOMENT_REGION={own:["tackle","counter"],mid:["through","counter","cross"],
  final:["oneonone","scramble","longshot","freekick","corner","penalty"]};
function momentRegion(x){ return x<50?"own":x<66.7?"mid":"final"; }
// spot {x,y,team}: 3D akışta topun yeri ve sahibi (home|away). planned bölgeye (ve noktaya) uyuyorsa
//   korunur, yoksa bölgenin uygun türlerinden ağırlıkla seçilir (used: maçta oynanan türler, az tercih).
function momentTypeAt(spot,planned,used){
  const reg=momentRegion(spot.x), wide=Math.abs(spot.y-50);
  // Rakipteki top kendi yarımızdaysa müdahale; rakip kendi sahasındayken savunma anı açılmaz
  if(reg==="own"&&spot.team==="away") return "tackle";
  const w={};
  if(reg==="own") w.counter=1;
  else if(reg==="mid"){ w.through=wide<26?1.2:0.4; w.counter=0.8; if(wide>18) w.cross=1.4; }
  else {
    const deep=spot.x>=82;
    if(wide<24){ w.oneonone=1; if(deep) w.scramble=1.3; else { w.longshot=0.7; w.freekick=1; } if(deep&&wide<14) w.penalty=0.35; }
    else if(deep) w.corner=1; else { w.freekick=1; w.oneonone=0.5; }
  }
  if(w[planned]&&!(used&&used.has(planned))) return planned;
  let tot=0; for(const k in w){ if(used&&used.has(k)) w[k]*=0.05; tot+=w[k]; }
  let r=Math.random()*tot;
  for(const k in w){ if((r-=w[k])<=0) return k; }
  return Object.keys(w)[0];
}

// Kilit an başarı şansı (2D ve 3D ortak). extra: 3D rota kalitesi terimi (2D'de 0).
// Math.random çağrı sırası eski satırla aynı (önce şans gürültüsü, sonra başarı zarı).
function calcMomentChance(player,opt,power,extra=0){
  const baseOvr=(player.ovr||65)/100;
  const statVal=(player[opt.stat]||60)/100;
  const powerBonus=power>=40&&power<=80?0.12:power>=25&&power<=90?0.04:-0.08;
  // −0.2 / tavan 0.75: kaleci ve savunma daha dirençli (gerçekçi skorlar)
  return Math.min(0.75,Math.max(0.08,baseOvr*0.35+statVal*0.35+opt.bonus*0.25-0.2+powerBonus+(Math.random()*0.10-0.05)+(Number.isFinite(extra)?extra:0)));
}

