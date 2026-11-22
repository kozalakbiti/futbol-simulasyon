// ═══════════════════════════════════════════════════════════════
// MAÇ SİMÜLASYONU — GENİŞLETİLMİŞ
// ═══════════════════════════════════════════════════════════════

const GOL_TYPES=[
  {act:"sert sol ayak vuruşu",         pos:"ceza sahası sol köşesinden",  icon:"💥", zone:[75,40]},
  {act:"köşe vuruşu sonrası kafa",      pos:"altı pas içinde",             icon:"🎯", zone:[92,45]},
  {act:"uzak mesafe füze şutu",         pos:"yarı sahadan",                icon:"🚀", zone:[65,50]},
  {act:"penaltı",                       pos:"penaltı noktasından",         icon:"⚽", zone:[88,50]},
  {act:"bireysel dripling sonrası vole",pos:"ceza sahası ortasından",      icon:"🌪️", zone:[82,52]},
  {act:"serbest vuruş",                 pos:"ceza sahası dışından",        icon:"🎯", zone:[72,35]},
  {act:"hızlı kontra",                  pos:"sol kanattan",                icon:"⚡", zone:[85,20]},
  {act:"ortaya yükseliş + kafa",        pos:"sağ kanattan gelen ortaya",   icon:"🏹", zone:[90,70]},
  {act:"kombinasyon oyunu 1-2",         pos:"ceza sahası içinden",         icon:"🎪", zone:[80,48]},
  {act:"ikinci direğe koşu + vole",     pos:"ikinci direkte",              icon:"💫", zone:[93,72]},
  {act:"baskı sonrası top kapma",       pos:"savunma arkasında",           icon:"💨", zone:[78,50]},
  {act:"çapraz sert şut",              pos:"sağ kanattan içeri keserek",   icon:"🔥", zone:[84,68]},
  {act:"loblu vole",                    pos:"ceza sahası girişinden",      icon:"🌟", zone:[70,50]},
  {act:"ikinci topa giriş + sert şut", pos:"ceza sahası kenarından",      icon:"💪", zone:[76,44]},
  {act:"kaleciyi şaşırtan çalım",       pos:"birebir pozisyonda",          icon:"🎭", zone:[89,50]},
  {act:"topukla gol",                   pos:"arka bölgeden",               icon:"👟", zone:[88,54]},
  {act:"kaleci çıkışında lob",          pos:"sol kanattan",                icon:"🌈", zone:[82,22]},
  {act:"direkten dönüp gol",            pos:"sağ direkten dönerek",        icon:"🥅", zone:[94,58]},
];

const MISS_TYPES=[
  {desc:"direkten döndü",          icon:"🥅"},
  {desc:"gol çizgisinden uzaklaştırıldı", icon:"🛡️"},
  {desc:"şut üstten aşırtı çıktı", icon:"💨"},
  {desc:"kaleci harika kurtardı",  icon:"🧤"},
  {desc:"ofsayt bozdu",            icon:"🚫"},
  {desc:"direği salladı",          icon:"🔔"},
  {desc:"son anda bloke edildi",   icon:"✋"},
  {desc:"kale önünde kaçırdı",     icon:"😬"},
  {desc:"çapraz dışarı",           icon:"↗️"},
  {desc:"kaleciye yakalandı",      icon:"🧤"},
  {desc:"ön direğe çarptı",        icon:"🥅"},
  {desc:"sert şut aşırtı",         icon:"💫"},
];

const OLAY_TYPES=[
  {type:"corner",     icon:"🚩", me:(opp)=>`Köşe vuruşu! __TEAM__ kullanıyor...`,         them:(opp)=>`${opp} köşe kazandı!`},
  {type:"foul",       icon:"🦵", me:(opp)=>`${opp} oyuncusuna faul. Tehlikeli bölgede serbest vuruş.`, them:(opp)=>`${opp} faul yaptı. __TEAM__ serbest vuruş kullanacak.`},
  {type:"offside",    icon:"🚫", me:()=>"Ofsayt! Bayrak kalktı, pozisyon geçersiz.",        them:(opp)=>`Ofsayt tuzağı! ${opp} pozisyonu iptal.`},
  {type:"var",        icon:"📺", me:()=>"VAR incelemesi! Hakem ekrana gidiyor...",           them:()=>"VAR müdahalesi! Hakem kararı yeniden değerlendiriyor."},
  {type:"injury",     icon:"🏥", me:()=>"__TEAM__'da sakatlık! Oyun durdu, sağlık ekibi sahaya iniyor.", them:(opp)=>`${opp}'da oyuncu yerde. Ciddi görünüyor.`},
  {type:"chance",     icon:"😮", me:()=>"Devasa fırsat! Kaleci mucize kurtarış yaptı.",     them:(opp)=>`${opp} büyük pozisyon! Savunma son anda temizledi.`},
  {type:"press",      icon:"⚡", me:()=>"Yüksek baskı! Top kazanıldı, hızlı geçiş...",     them:(opp)=>`${opp} yoğun pres uyguluyor, pas bulmak zorlaşıyor.`},
  {type:"tackle",     icon:"🛡️", me:()=>"Harika müdahale! Savunma topu kaptı.",             them:(opp)=>`${opp} sert müdahale! Hakem izliyor.`},
  {type:"crossbar",   icon:"🥅", me:()=>"DIREĞE! Çok az kaldı, tribünler ayağa kalktı!",   them:(opp)=>`${opp}'ın şutu direkte! Kaleci ise yerinden kıpırdamadı.`},
  {type:"penalty_won",icon:"🔴", me:()=>"PENALTİ! Hakem nokta vuruşunu gösteriyor!",       them:(opp)=>`${opp} penaltı kazandı! __TEAM__ itiraz ediyor.`},
  {type:"handball",   icon:"✋", me:(opp)=>`El hareketi, ${opp} serbest vuruş kazandı.`,    them:()=>"Rakipte el! __TEAM__ serbest vuruş kullanacak."},
  {type:"clearance",  icon:"👊", me:()=>"Savunma uzaklaştırdı! Tehlike atlatıldı.",         them:(opp)=>`${opp} savunması son anda uzaklaştırdı.`},
  {type:"header",     icon:"🔝", me:()=>"Köşeden yükselen kafa! Az farkla dışarı.",         them:(opp)=>`${opp} kafa vuruşu — kaleci kapıştı.`},
  {type:"tackle_red", icon:"🟥", me:(opp)=>`${opp} tehlikeli hareket! Hakem kartı çıkardı.`,them:()=>"__TEAM__ oyuncusu tehlikeli müdahale, hakem yavaşlıyor!"},
  {type:"keeper",     icon:"🧤", me:()=>"Kaleci muhteşem! İkinci direğe uzandı.",           them:(opp)=>`${opp} kalecisi harika! Şutu çeldi.`},
  {type:"counter",    icon:"⚡", me:()=>"KONTRA ATAK! 3'e 1! Koşun!",                       them:(opp)=>`${opp} kontratağa kalktı, savunma geri çekiliyor!`},
  {type:"longball",   icon:"🎯", me:()=>"Uzun top atağı! Santrfor açıldı.",                  them:(opp)=>`${opp} uzun topla oynatıyor.`},
  {type:"setpiece",   icon:"📐", me:()=>"Standart pozisyon! Set-piece çalışması.",           them:(opp)=>`${opp} standart pozisyon hazırlığında.`},
  {type:"dispossess", icon:"💢", me:()=>"Top kaybedildi! Rakip baskı yaptı.",               them:(opp)=>`${opp} topu kaptırdı! __TEAM__ kontrol altına aldı.`},
  {type:"atmosphere", icon:"📢", me:()=>"Tribünler ayağa kalktı! Sahada inanılmaz atmosfer!",them:()=>"Taraftarlar karşı takımı destekliyor, tansiyon yüksek."},
];

const YORUM=[
  "Müthiş bir mücadele izliyoruz bugün!",
  "İki takım da büyük istek gösteriyor.",
  "Orta sahada yoğun top mücadelesi.",
  "Savunma hatları şu an çok sıkı.",
  "Hız ve kondisyon bu dakikalarda belirleyici olacak.",
  "Teknik direktör dokunuş yapmayı düşünüyor olmalı.",
  "Tribünler tam kapasite, atmosfer inanılmaz!",
  "Kritik bir dönemde giriyoruz maça.",
  "İlk golü atan takım avantaj yakalayacak.",
  "Her iki kaleci de dikkatli pozisyon alıyor.",
  "Orta saha baskısı kazananı belirleyecek.",
  "Yorgunluk belirtileri görülmeye başlandı.",
  "Hava koşulları oyunu etkiliyor.",
  "Deneyim farkı bu dakikalarda kendini gösterebilir.",
  "Taktik değişim yapılacak mı?",
];

// Saha bölgeleri (x: 0=kendi kale, 100=rakip kale, y: 0=sol, 100=sağ)
const ZONES={
  "kendi ceza sahası":    [12,50],
  "kendi yarı sahası":    [30,50],
  "orta saha":            [50,50],
  "rakip yarı sahası":    [65,50],
  "rakip ceza sahası":    [85,50],
  "sol kanat":            [60,15],
  "sağ kanat":            [60,85],
  "sol kornerflag":       [95,8],
  "sağ kornerflag":       [95,92],
};

// Poisson random variate for realistic goal counts
function poissonRandom(lambda){
  const L=Math.exp(-lambda);let k=0,p=1;
  do{k++;p*=Math.random();}while(p>L);
  return k-1;
}

function simulateMatch(myStr,oppStr,home,coachBonus=0,squad=[]){
  // Trait bonusu — maç öncesi hesapla (squad henüz filtrelenmedi)
  const traitStr=squad.reduce((sum,p)=>sum+calcTraitBonus(p,oppStr,home),0);
  const nervPenalty=squad.filter(p=>(p.traits||[]).includes("nervewreck")&&oppStr>=(myStr+coachBonus)).length*2;
  const bon=home?4:0;
  const eff=myStr+bon+coachBonus+Math.min(6,traitStr)-nervPenalty;
  const diff=eff-oppStr;

  // Sürpriz faktörü: %8 ihtimalle güçlü takım bile şaşırtıcı sonuç alabilir
  const surprise=Math.random()<0.08;
  const effectiveDiff=surprise?diff*(-0.5+Math.random()*0.3):diff;

  // Win probability via logistic curve — OVR farkı daha belirgin etkiye sahip
  const winP=Math.max(0.08,Math.min(0.82,1/(1+Math.exp(-effectiveDiff*0.075))));
  const drawP=Math.max(0.10,Math.min(0.30,0.28-Math.abs(effectiveDiff)*0.007));
  const r=Math.random();
  let res=r<winP?"W":r<winP+drawP?"D":"L";

  // Expected goals based on OVR ratio — Poisson distribution
  // Average top-flight match has ~2.6 goals; TFF matches ~2.2
  const avgTotalG=2.3;
  const strRatio=eff/(eff+oppStr);
  const myLambda=Math.max(0.25,avgTotalG*strRatio*(home?1.05:0.95));
  const opLambda=Math.max(0.25,avgTotalG*(1-strRatio)*(home?0.95:1.05));

  let myG=poissonRandom(myLambda);
  let opG=poissonRandom(opLambda);

  // Reconcile result with score — margin depends on strength difference
  if(res==="W"&&myG<=opG){
    const absDiff=Math.abs(diff);
    const p1=Math.max(0.20,0.52-absDiff*0.015); // büyük fark → +1 daha az olası
    const p2=Math.min(0.50,0.30+absDiff*0.010); // büyük fark → +2 daha olası
    const mr=Math.random();
    if(mr<p1) myG=opG+1;
    else if(mr<p1+p2) myG=opG+2;
    else myG=opG+3;
  } else if(res==="L"&&opG<=myG){
    const absDiff=Math.abs(diff);
    const p1=Math.max(0.20,0.52-absDiff*0.015);
    const p2=Math.min(0.50,0.30+absDiff*0.010);
    const mr=Math.random();
    if(mr<p1) opG=myG+1;
    else if(mr<p1+p2) opG=myG+2;
    else opG=myG+3;
  } else if(res==="D"){
    // Berabere: 0-0, 1-1, 2-2 dağılımı için Poisson(1.1)
    const eq=poissonRandom(1.1);
    myG=eq; opG=eq;
  }
  // Cap at reasonable max
  myG=Math.min(myG,7);opG=Math.min(opG,7);

  // Tüm kadro scorer havuzuna girer — pozisyon ağırlıkları yedekleri doğal olarak filtreler
  const src=squad.length>0?squad:INIT_SQUAD;
  const benchPlayers=[]; // lineup bağımsız — pozisyon ağırlığı yeterli
  const atk=src.filter(p=>["ST","CAM"].includes(p.pos));
  const wide=src.filter(p=>["LM","RM"].includes(p.pos));
  const mid=src.filter(p=>["CM","CDM"].includes(p.pos));
  const def=src.filter(p=>["CB","LB","RB"].includes(p.pos));
  const all=src.filter(p=>p.pos!=="GK");
  const gk=src.find(p=>p.pos==="GK")||{n:"Kaleci"};
  // Yedek FW/MF — çok düşük ağırlık (×1, starter ST/CAM ×5 ile kıyasla ~%5-10)
  const benchAtk=benchPlayers.filter(p=>["ST","CAM","LM","RM"].includes(p.pos));

  // GOL havuzu: ST/CAM ×5, LM/RM ×3, CM/CDM ×1, DEF ×1, yedek FW/MF ×1
  const scorerPool=[
    ...atk,...atk,...atk,...atk,...atk,   // ST/CAM ×5
    ...wide,...wide,...wide,               // LM/RM ×3
    ...mid,                                // CM/CDM ×1
    ...def,                                // CB/LB/RB ×1
    ...benchAtk,                           // Yedek FW/MF ×1 (~%5-10 ihtimal)
  ];
  const scorerPoolFull=scorerPool.length>0?scorerPool:[...src.filter(p=>p.pos!=="GK")];

  // ASİST havuzu: sadece src (başlangıç 11) — CAM/CM ×2, LM/RM ×3, CDM/ST ×1, DEF ×1
  // Gerçekçi: sezon boyunca en fazla 10-12 asist
  const srcCAMCM=src.filter(p=>["CAM","CM"].includes(p.pos));
  const assisterPool=[
    ...srcCAMCM,                         // CAM/CM ×1 (eskiden ×2)
    ...wide,...wide,                     // LM/RM ×2
    ...mid,                              // CDM ×1
    ...atk,                              // ST/CAM ×1
  ];
  const assisterPoolFull=assisterPool.length>0?assisterPool:[...src.filter(p=>p.pos!=="GK")];

  // Gol atanlar
  const scorers=[];
  for(let i=0;i<myG;i++) scorers.push(scorerPoolFull[rnd(0,scorerPoolFull.length-1)].n);

  // Asist yapanlar (gol atandan farklı)
  const assisters=[];
  for(let i=0;i<myG;i++){
    let a=assisterPoolFull[rnd(0,assisterPoolFull.length-1)];
    // Aynı oyuncu gol+asist yapmasın (3 deneme)
    for(let t=0;t<3&&a.n===scorers[i];t++) a=assisterPoolFull[rnd(0,assisterPoolFull.length-1)];
    assisters.push(a.n);
  }

  const evs=[];

  // ── GOLLER ──────────────────────────────────────────────
  const myMins=[...Array(myG)].map(()=>rnd(4,90)).sort((a,b)=>a-b);
  const opMins=[...Array(opG)].map(()=>rnd(4,90)).sort((a,b)=>a-b);
  myMins.forEach((m,i)=>{
    const gt=GOL_TYPES[rnd(0,GOL_TYPES.length-1)];
    const assist=rnd(0,3)>0?assisters[i]:null; // %75 asist göster
    evs.push({min:m,type:"goal",team:"me",scorer:scorers[i]||"?",assist,
      act:gt.act,pos:gt.pos,icon:gt.icon,zone:gt.zone});
  });
  opMins.forEach(m=>{
    const gt=GOL_TYPES[rnd(0,GOL_TYPES.length-1)];
    evs.push({min:m,type:"goal",team:"opp",act:gt.act,pos:gt.pos,icon:gt.icon,
      zone:[100-gt.zone[0],gt.zone[1]]});
  });

  // ── KAÇIRILAN GOLLER ──────────────────────────────────
  const missCnt=rnd(2,5);
  for(let i=0;i<missCnt;i++){
    const p=scorerPoolFull[rnd(0,scorerPoolFull.length-1)];
    const mt=MISS_TYPES[rnd(0,MISS_TYPES.length-1)];
    evs.push({min:rnd(5,89),type:"miss",team:"me",player:p.n,desc:mt.desc,icon:mt.icon,
      zone:[rnd(75,95),rnd(20,80)]});
  }
  for(let i=0;i<rnd(1,3);i++){
    const mt=MISS_TYPES[rnd(0,MISS_TYPES.length-1)];
    evs.push({min:rnd(5,89),type:"miss",team:"opp",desc:mt.desc,icon:mt.icon,
      zone:[rnd(5,25),rnd(20,80)]});
  }

  // ── KURTARIŞLAR ──────────────────────────────────────
  for(let i=0;i<rnd(1,4);i++){
    evs.push({min:rnd(5,89),type:"save",team:"me",player:gk.n,
      zone:[rnd(5,15),rnd(20,80)]});
  }
  for(let i=0;i<rnd(0,2);i++){
    evs.push({min:rnd(5,89),type:"save",team:"opp",zone:[rnd(85,95),rnd(20,80)]});
  }

  // ── KARTLAR ──────────────────────────────────────────
  // Sinirli (chippy) oyuncular daha fazla sarı kart riski taşır
  const chippyPlayers=src.filter(p=>(p.traits||[]).includes("chippy"));
  for(let i=0;i<rnd(0,5);i++){
    const p=all[rnd(0,all.length-1)];
    const team=rnd(0,1)?"me":"opp";
    evs.push({min:rnd(10,89),type:"yellow",team,player:team==="me"?p.n:"Rakip",
      zone:[rnd(20,80),rnd(20,80)]});
  }
  // Chippy oyuncu varsa ekstra sarı kart şansı
  if(chippyPlayers.length>0&&Math.random()<0.35){
    const cp=chippyPlayers[rnd(0,chippyPlayers.length-1)];
    evs.push({min:rnd(20,80),type:"yellow",team:"me",player:cp.n,zone:[rnd(20,80),rnd(20,80)]});
  }
  if(rnd(0,7)===0){
    const p=all[rnd(0,all.length-1)];
    const team=rnd(0,1)?"me":"opp";
    evs.push({min:rnd(30,85),type:"red",team,player:team==="me"?p.n:"Rakip",
      zone:[rnd(20,80),rnd(20,80)]});
  }
  // İkinci sarıdan kırmızı
  if(rnd(0,10)===0){
    const p=all[rnd(0,all.length-1)];
    evs.push({min:rnd(55,85),type:"yellow2red",team:"me",player:p.n});
  }

  // ── DEĞİŞİKLİKLER ─────────────────────────────────────
  const subCnt=rnd(1,3);
  for(let i=0;i<subCnt;i++){
    const out=all[rnd(0,all.length-1)];
    const inp=all[rnd(0,all.length-1)];
    evs.push({min:rnd(46+(i*10),85),type:"sub",team:"me",out:out.n,in_:inp.n!==out.n?inp.n:all[0].n});
  }
  // Rakip değişiklik
  if(rnd(0,2)>0){
    evs.push({min:rnd(55,80),type:"sub",team:"opp",out:"Rakip oyuncu",in_:"Yedek"});
  }

  // ── ÖZEL OLAYLAR ──────────────────────────────────────
  for(let i=0;i<rnd(6,12);i++){
    const ot=OLAY_TYPES[rnd(0,OLAY_TYPES.length-1)];
    const team=rnd(0,1)?"me":"opp";
    const zones=Object.values(ZONES);
    evs.push({min:rnd(2,89),type:ot.type,team,
      _me:ot.me,_them:ot.them,icon:ot.icon,
      zone:zones[rnd(0,zones.length-1)]});
  }

  // ── YORUM ─────────────────────────────────────────────
  for(let i=0;i<rnd(3,6);i++){
    evs.push({min:rnd(5,88),type:"comment",text:YORUM[rnd(0,YORUM.length-1)]});
  }

  evs.sort((a,b)=>a.min-b.min);

  // İstatistikler
  const stats={
    myShots:   myG*2+rnd(4,10), opShots:   opG*2+rnd(3,8),
    myOnTarget:myG+rnd(1,4),    opOnTarget:opG+rnd(1,3),
    myCorners: rnd(3,10),       opCorners: rnd(1,7),
    myFouls:   rnd(6,16),       opFouls:   rnd(5,15),
    myOffsides:rnd(0,4),        opOffsides:rnd(0,3),
    myPasses:  rnd(320,520),    opPasses:  rnd(250,480),
  };

  // Oyuncu performans puanları
  const ratings={};
  src.forEach(p=>{
    let base=rnd(60,78);
    if(scorers.includes(p.n)) base+=rnd(15,22);
    if(assisters.includes(p.n)) base+=rnd(8,14);
    ratings[p.id]=Math.min(99,base);
  });

  return{myG,opG,res,scorers,assisters,evs,stats,ratings};
}
