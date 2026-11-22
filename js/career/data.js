// ═══════════════════════════════════════════════════════════════
// ANA MENÜ EKRANI (Yeni Oyun / Kayıt Yükle)
// ═══════════════════════════════════════════════════════════════


// ═══════════════════════════════════════════════════════════════
// OYUNCU KARİYER MODU v6 — TAM VERSİYON
// ═══════════════════════════════════════════════════════════════

const CP={bg:"#020812",bg2:"#050e22",bg3:"#0a1630",ac:"#2485ff",ac2:"#4da6ff",grn:"#10b981",grn2:"#34d399",red:"#ef4444",ora:"#f59e0b",pur:"#8b5cf6",wh:"#fff",dim:"#7898c0",brd:"rgba(77,166,255,.15)"};

// ── KİŞİLİK TİPLERİ ──────────────────────────────────────────
const PERSONALITY_TYPES=[
  {id:"leader",label:"Lider",icon:"👑",desc:"Takımı motive eder. Antrenör ilişkisi +10, takım ilişkisi +10 başlar. Büyük maçlarda performans bonusu.",bonuses:{coachRel:10,teamRel:10,bigMatchBonus:0.3}},
  {id:"hardworker",label:"Çalışkan",icon:"💪",desc:"Antrenman verimi 2 kat. Yaşlanma geç başlar (34+). Sakatlanma riski düşük.",bonuses:{trainingMult:2.0,agingAge:34,injuryMult:0.6}},
  {id:"genius",label:"Deha",icon:"🧠",desc:"OVR gelişimi hızlı. Potansiyel +5 bonus. Ama moral düşükken performans çöker.",bonuses:{devMult:1.4,potBonus:5,moodSensitive:true}},
  {id:"rebel",label:"Asi",icon:"🔥",desc:"Antrenör ilişkisi zor kurar (-10). Ama galibiyette moral çok yükselir, form dalgalı.",bonuses:{coachRel:-10,winMoralBonus:15,formVariance:1.5}},
];

// ── MENTOR SİSTEMİ ──────────────────────────────────────────
const MENTORS=[
  {id:"m1",n:"Roberto Santos",pos:"ST",era:"2000s",icon:"⭐",quote:"Gol atmak bir sanattır. Her fırsatı değerlendirmeyi öğren.",bonus:{devMult:1.25,goalBonus:0.08},requirement:"ST veya CAM olmak"},
  {id:"m2",n:"Klaus Weber",pos:"CM",era:"1990s",icon:"🎯",quote:"Orta saha oyunu okumaktır. Topu değil, alanı gör.",bonus:{devMult:1.20,assistBonus:0.10},requirement:"Orta saha mevkisi"},
  {id:"m3",n:"Jean-Pierre Moreau",pos:"CB",era:"2000s",icon:"🛡️",quote:"Savunma bir zihin oyunudur. Rakibin aklını oku.",bonus:{devMult:1.18,defBonus:0.12},requirement:"Defans mevkisi"},
  {id:"m4",n:"Carlos Herrera",pos:"GK",era:"1990s",icon:"🧤",quote:"Kaleci olmak yalnız savaşçı olmaktır. Ama o yalnızlıkta güç vardır.",bonus:{devMult:1.22,saveBonus:0.15},requirement:"Kaleci olmak"},
  {id:"m5",n:"Fatih Aydın",pos:"any",era:"2010s",icon:"🏆",quote:"Türk futbolu dünyaya açılmak için seni bekliyor.",bonus:{devMult:1.15,repBonus:5},requirement:"Türk olmak"},
];

// ── ANTRENÖRLERİ ── (kişisel antrenör)
const PERSONAL_COACHES=[
  {id:"pc1",n:"Andre Schulz",spec:"Şut",icon:"🎯",cost:200,devBonus:0.4,desc:"Her hafta şut antrenmanı +0.4 dev puan ekstra"},
  {id:"pc2",n:"Tomás Varela",spec:"Pas",icon:"🔄",cost:180,devBonus:0.35,desc:"Pas ve vizyon geliştirme uzmanı"},
  {id:"pc3",n:"Kim Park",spec:"Fizik",icon:"💨",cost:150,devBonus:0.3,injuryMult:0.5,desc:"Kondisyon ve sakatlanma önleme"},
  {id:"pc4",n:"Marco Rossi",spec:"Taktik",icon:"🧩",cost:220,devBonus:0.5,desc:"Taktik zeka ve pozisyon alma"},
];

// ── ANTRENMAN TÜRLERİ ──────────────────────────────────────
const TRAINING_TYPES=[
  {id:"shooting",label:"Şut Antrenmanı",icon:"⚽",desc:"Gol istatistiğini güçlendirir",devBonus:3.5,fatigueCost:25,moralBonus:3,skillFocus:"finishing"},
  {id:"passing",label:"Pas Antrenmanı",icon:"🔄",desc:"Asist ve vizyon geliştirir",devBonus:3.0,fatigueCost:20,moralBonus:2,skillFocus:"passing"},
  {id:"fitness",label:"Kondisyon",icon:"🏃",desc:"Yorgunluğu atar, sakatlanma riskini düşürür",devBonus:1.5,fatigueCost:-30,moralBonus:5,skillFocus:"stamina"},
  {id:"mental",label:"Mental Antrenman",icon:"🧠",desc:"Moral ve antrenör ilişkisini güçlendirir",devBonus:2.0,fatigueCost:10,moralBonus:10,skillFocus:"composure"},
  {id:"team",label:"Takım Antrenmanı",icon:"🤝",desc:"Takım ilişkisini artırır",devBonus:2.5,fatigueCost:18,moralBonus:4,skillFocus:"vision"},
  {id:"rest",label:"Dinlenme",icon:"😴",desc:"Tam iyileşme, forma riskini sıfırlar",devBonus:0,fatigueCost:-40,moralBonus:8,skillFocus:null},
];

// ── YAŞAM OLAYLARI ──────────────────────────────────────────
const LIFE_EVENTS=[
  {id:"house",label:"Ev Satın Al",icon:"🏠",cost:500,moralBonus:15,desc:"Şehirde ev al, moral +15, birikim -500K€"},
  {id:"luxury_house",label:"Lüks Villa",icon:"🏡",cost:2000,moralBonus:25,repBonus:8,desc:"Lüks villa, moral +25, itibar +8"},
  {id:"car",label:"Spor Araba",icon:"🚗",cost:300,moralBonus:10,repBonus:3,desc:"Spor araba, moral +10"},
  {id:"charity",label:"Hayır İşleri",icon:"❤️",cost:200,repBonus:15,fanBonus:2000,desc:"Bağış yap, itibar +15, taraftar +2000"},
  {id:"academy",label:"Futbol Okulu Kur",icon:"🏟️",cost:1000,repBonus:20,fanBonus:5000,desc:"Futbol akademisi, itibar +20"},
  {id:"invest_safe",label:"Güvenli Yatırım",icon:"📈",cost:500,returnMult:1.08,desc:"Düşük risk, %8 yıllık getiri"},
  {id:"invest_risky",label:"Riskli Yatırım",icon:"💹",cost:1000,returnMult:1.25,riskMult:0.7,desc:"Yüksek risk, %25 getiri veya %30 kayıp"},
];

// ── KARIYER TİPLERİ ──────────────────────────────────────────
const CAREER_POSITIONS=["GK","CB","LB","RB","CDM","CM","CAM","LM","RM","ST"];
const CAREER_NATIONS=["TUR","ESP","FRA","DEU","BRA","ARG","ENG","ITA","POR","NED","BEL","CRO","SEN","COL","URU","POL","NOR","SWE","DEN","GHA"];
const CAREER_FLAGS={"TUR":"🇹🇷","ESP":"🇪🇸","FRA":"🇫🇷","DEU":"🇩🇪","BRA":"🇧🇷","ARG":"🇦🇷","ENG":"🏴󠁧󠁢󠁥󠁮󠁧󠁿","ITA":"🇮🇹","POR":"🇵🇹","NED":"🇳🇱","BEL":"🇧🇪","CRO":"🇭🇷","SEN":"🇸🇳","COL":"🇨🇴","URU":"🇺🇾","POL":"🇵🇱","NOR":"🇳🇴","SWE":"🇸🇪","DEN":"🇩🇰","GHA":"🇬🇭"};

const CAREER_TEAMS=[
  {n:"Altinordu FC",lg:"1. Lig",str:54,tier:3,city:"İzmir",color:"#e84040"},{n:"Adanaspor FC",lg:"1. Lig",str:57,tier:3,city:"Adana",color:"#e84040"},
  {n:"Kocaelispor FC",lg:"1. Lig",str:60,tier:3,city:"Kocaeli",color:"#2485ff"},{n:"Pendikspor FC",lg:"Elit Lig",str:61,tier:2,city:"İstanbul",color:"#e84040"},
  {n:"Bodrumspor FC",lg:"1. Lig",str:63,tier:3,city:"Bodrum",color:"#27ae60"},{n:"Sakaryaspor FC",lg:"1. Lig",str:65,tier:3,city:"Sakarya",color:"#e84040"},
  {n:"Eyupspor FC",lg:"1. Lig",str:68,tier:3,city:"İstanbul",color:"#8b5cf6"},
  {n:"Kayserispor FC",lg:"Elit Lig",str:63,tier:2,city:"Kayseri",color:"#e84040"},{n:"Antalyaspor FC",lg:"Elit Lig",str:61,tier:2,city:"Antalya",color:"#e84040"},
  {n:"Sivasspor FC",lg:"Elit Lig",str:65,tier:2,city:"Sivas",color:"#e84040"},{n:"Basaksehir FC",lg:"Elit Lig",str:74,tier:2,city:"İstanbul",color:"#f59e0b"},
  {n:"Trabzonspor FC",lg:"Elit Lig",str:76,tier:2,city:"Trabzon",color:"#8b5cf6"},{n:"Besiktas FC",lg:"Elit Lig",str:80,tier:2,city:"İstanbul",color:"#fff"},
  {n:"Fenerbahce FC",lg:"Elit Lig",str:86,tier:2,city:"İstanbul",color:"#ffd060"},{n:"Galatasaray FC",lg:"Elit Lig",str:88,tier:2,city:"İstanbul",color:"#e84040"},
  {n:"Northon City",lg:"İngiliz Ligi",str:86,tier:1,city:"Londra",color:"#e84040"},{n:"Dortmund BV",lg:"Alman Ligi",str:82,tier:1,city:"Dortmund BV",color:"#ffd060"},
  {n:"FC Internazionale",lg:"İtalyan Ligi",str:85,tier:1,city:"Milano",color:"#2485ff"},{n:"Atletico Madreno",lg:"İspanyol Ligi",str:84,tier:1,city:"Madrid",color:"#e84040"},
  {n:"Juventus FC",lg:"İtalyan Ligi",str:83,tier:1,city:"Torino FC",color:"#fff"},{n:"Bayern FC",lg:"Alman Ligi",str:91,tier:1,city:"Münih",color:"#e84040"},
  {n:"FC Cataluña",lg:"İspanyol Ligi",str:92,tier:1,city:"Barselona",color:"#2485ff"},{n:"Eastfield City",lg:"İngiliz Ligi",str:93,tier:1,city:"Manchester",color:"#4da6ff"},
  {n:"Real Madreno",lg:"İspanyol Ligi",str:95,tier:1,city:"Madrid",color:"#fff"},{n:"Paris SG",lg:"Fransız Ligi",str:90,tier:1,city:"Paris",color:"#2485ff"},
  {n:"Mersey Reds",lg:"İngiliz Ligi",str:87,tier:1,city:"Mersey Reds",color:"#e84040"},
];

const SKILL_TREES={
  GK:{name:"Kaleci",skills:[{id:"reflexes",n:"Refleksler",icon:"🧤",max:10,desc:"Ani kurtarışlar"},{id:"positioning",n:"Pozisyon",icon:"📍",max:10,desc:"Doğru pozisyon alma"},{id:"distribution",n:"Pas",icon:"🦶",max:8,desc:"Ayakla çıkış"},{id:"leadership",n:"Liderlik",icon:"👑",max:8,desc:"Savunmayı yönet"}]},
  CB:{name:"Stoper",skills:[{id:"tackling",n:"Müdahale",icon:"🛡️",max:10},{id:"heading",n:"Kafa",icon:"👤",max:8},{id:"composure",n:"Sakinlik",icon:"🧘",max:8},{id:"pace_def",n:"Hız",icon:"⚡",max:6}]},
  LB:{name:"Sol Bek",skills:[{id:"crossing",n:"Orta",icon:"🎯",max:10},{id:"pace",n:"Hız",icon:"⚡",max:10},{id:"tackling",n:"Müdahale",icon:"🛡️",max:8},{id:"stamina",n:"Dayanıklılık",icon:"💪",max:8}]},
  RB:{name:"Sağ Bek",skills:[{id:"crossing",n:"Orta",icon:"🎯",max:10},{id:"pace",n:"Hız",icon:"⚡",max:10},{id:"tackling",n:"Müdahale",icon:"🛡️",max:8},{id:"stamina",n:"Dayanıklılık",icon:"💪",max:8}]},
  CDM:{name:"Def. Orta",skills:[{id:"tackling",n:"Müdahale",icon:"🛡️",max:10},{id:"passing",n:"Pas",icon:"🔄",max:10},{id:"stamina",n:"Dayanıklılık",icon:"💪",max:8},{id:"vision",n:"Vizyon",icon:"👁️",max:8}]},
  CM:{name:"Orta Saha",skills:[{id:"passing",n:"Pas",icon:"🔄",max:10},{id:"shooting",n:"Şut",icon:"⚽",max:8},{id:"stamina",n:"Dayanıklılık",icon:"💪",max:10},{id:"vision",n:"Vizyon",icon:"👁️",max:10}]},
  CAM:{name:"Ofansif OS",skills:[{id:"vision",n:"Vizyon",icon:"👁️",max:10},{id:"dribbling",n:"Dribling",icon:"🌀",max:10},{id:"shooting",n:"Şut",icon:"⚽",max:10},{id:"freekick",n:"Frikik",icon:"🎯",max:8}]},
  LM:{name:"Sol Kanat",skills:[{id:"pace",n:"Hız",icon:"⚡",max:10},{id:"dribbling",n:"Dribling",icon:"🌀",max:10},{id:"crossing",n:"Orta",icon:"🎯",max:8},{id:"shooting",n:"Şut",icon:"⚽",max:8}]},
  RM:{name:"Sağ Kanat",skills:[{id:"pace",n:"Hız",icon:"⚡",max:10},{id:"dribbling",n:"Dribling",icon:"🌀",max:10},{id:"crossing",n:"Orta",icon:"🎯",max:8},{id:"shooting",n:"Şut",icon:"⚽",max:8}]},
  ST:{name:"Forvet",skills:[{id:"finishing",n:"Bitiricilik",icon:"🥅",max:10},{id:"pace",n:"Hız",icon:"⚡",max:8},{id:"heading",n:"Kafa",icon:"👤",max:8},{id:"composure",n:"Soğukkanlılık",icon:"🧊",max:10}]},
};

const CAREER_STAGES=[
  {id:"youth",label:"Genç Yetenek",minOvr:0,maxOvr:64,icon:"🌱"},
  {id:"rising",label:"Yükselen Yıldız",minOvr:65,maxOvr:74,icon:"📈"},
  {id:"star",label:"Yıldız",minOvr:75,maxOvr:84,icon:"⭐"},
  {id:"elite",label:"Elit Oyuncu",minOvr:85,maxOvr:89,icon:"🌟"},
  {id:"legend",label:"Efsane",minOvr:90,maxOvr:99,icon:"👑"},
];

const RIVALS=[
  {n:"C.Ronaldino Jr.",pos:"ST",nat:"POR",ovr:72,rivalry:"Gol rekabeti"},
  {n:"K. Müller",pos:"CAM",nat:"DEU",ovr:75,rivalry:"Yaratıcılık rekabeti"},
  {n:"A. Diallo",pos:"LM",nat:"SEN",ovr:70,rivalry:"Kanat hakimiyeti"},
  {n:"L. Vargas",pos:"ST",nat:"ARG",ovr:68,rivalry:"Gol krallığı"},
  {n:"S. Eriksen",pos:"CM",nat:"DEN",ovr:73,rivalry:"Orta saha kontrolü"},
];

const SPONSORS=[
  {n:"SportWear Pro",icon:"👟",minOvr:55,salary:50,desc:"Forma ve ayakkabı sponsorluğu"},
  {n:"EnergyDrink X",icon:"⚡",minOvr:65,salary:120,desc:"Enerji içeceği yüzü"},
  {n:"AutoBrand",icon:"🚗",minOvr:72,salary:250,desc:"Otomobil markası"},
  {n:"GlobalBank",icon:"💳",minOvr:80,salary:500,desc:"Banka reklam yüzü"},
  {n:"LuxuryWatch",icon:"⌚",minOvr:87,salary:1000,desc:"Lüks saat markası"},
  {n:"WorldSport",icon:"🌍",minOvr:92,salary:2000,desc:"Dünya spor markası"},
];

const CAREER_ACHIEVEMENTS=[
  {id:"first_match",icon:"⚽",title:"İlk Maç",desc:"İlk profesyonel maçını oynadın",cat:"kariyer",check:p=>p.totalMatches>=1},
  {id:"first_goal",icon:"🥅",title:"İlk Gol",desc:"İlk golünü attın",cat:"kariyer",check:p=>p.totalGoals>=1},
  {id:"first_assist",icon:"🎯",title:"İlk Asist",desc:"İlk asistini yaptın",cat:"kariyer",check:p=>p.totalAssists>=1},
  {id:"hat_trick",icon:"🎩",title:"Hat-trick",desc:"Bir maçta 3 gol",cat:"performans",check:p=>(p.bestMatchGoals||0)>=3},
  {id:"motm_5",icon:"🌟",title:"Seri Yıldız",desc:"5 kez maçın adamı",cat:"performans",check:p=>(p.motmCount||0)>=5},
  {id:"motm_20",icon:"💫",title:"Kronik Yıldız",desc:"20 kez maçın adamı",cat:"performans",check:p=>(p.motmCount||0)>=20},
  {id:"season_10g",icon:"🔟",title:"10 Gol Sezonu",desc:"Bir sezonda 10+ gol",cat:"sezon",check:p=>(p.history||[]).some(s=>s.goals>=10)},
  {id:"season_20g",icon:"💥",title:"20 Gol Sezonu",desc:"Bir sezonda 20+ gol",cat:"sezon",check:p=>(p.history||[]).some(s=>s.goals>=20)},
  {id:"goals_50",icon:"🏅",title:"50 Gol",desc:"Kariyer 50 gol",cat:"kariyer",check:p=>p.totalGoals>=50},
  {id:"goals_100",icon:"💯",title:"100 Gol",desc:"Kariyer 100 gol",cat:"kariyer",check:p=>p.totalGoals>=100},
  {id:"goals_200",icon:"🏆",title:"200 Gol",desc:"Kariyer 200 gol",cat:"kariyer",check:p=>p.totalGoals>=200},
  {id:"matches_100",icon:"📋",title:"100. Maç",desc:"100 maç oynadın",cat:"kariyer",check:p=>p.totalMatches>=100},
  {id:"matches_300",icon:"📚",title:"Veteran",desc:"300 maç oynadın",cat:"kariyer",check:p=>p.totalMatches>=300},
  {id:"ovr_70",icon:"📈",title:"Yükseliş",desc:"OVR 70",cat:"gelisim",check:p=>p.ovr>=70},
  {id:"ovr_80",icon:"⭐",title:"Yıldız",desc:"OVR 80",cat:"gelisim",check:p=>p.ovr>=80},
  {id:"ovr_90",icon:"👑",title:"Efsane",desc:"OVR 90",cat:"gelisim",check:p=>p.ovr>=90},
  {id:"national",icon:"🏳️",title:"Milli Sporcu",desc:"Milli takım forması",cat:"milli",check:p=>p.nationalCaps>=1},
  {id:"national_50",icon:"🎖️",title:"Milli Kaptan",desc:"50 milli maç",cat:"milli",check:p=>p.nationalCaps>=50},
  {id:"world_cup",icon:"🌍",title:"Dünya Kupası",desc:"Dünya Kupası oyuncusu",cat:"milli",check:p=>p.worldCup},
  {id:"bigclub",icon:"🏟️",title:"Büyük Sahne",desc:"Tier 1 kulübe transfer",cat:"transfer",check:p=>p.teamTier===1},
  {id:"top_scorer",icon:"🥇",title:"Gol Kralı",desc:"Lig golcüsü oldun",cat:"sezon",check:p=>p.isTopScorer},
  {id:"ballon_dor",icon:"🏆",title:"Ballon d'Or",desc:"Yılın Oyuncusu",cat:"odul",check:p=>p.ballonDor},
  {id:"captain",icon:"🎗️",title:"Kaptan",desc:"Takım kaptanı oldun",cat:"sosyal",check:p=>p.isCaptain},
  {id:"club_legend",icon:"🗿",title:"Kulüp Efsanesi",desc:"Aynı kulüpte 5+ sezon",cat:"sosyal",check:p=>(p.seasonsAtClub||0)>=5},
  {id:"mentor",icon:"👨‍🏫",title:"Mentor Öğrencisi",desc:"Bir mentordan öğrendin",cat:"kariyer",check:p=>!!p.mentor},
  {id:"personality",icon:"🎭",title:"Karakter Sahibi",desc:"Kişilik tipini belirledin",cat:"kariyer",check:p=>!!p.personality},
  {id:"house_owner",icon:"🏠",title:"Ev Sahibi",desc:"Ev satın aldın",cat:"finans",check:p=>(p.ownedAssets||[]).some(a=>a.includes("house"))},
  {id:"savings_1m",icon:"💰",title:"Milyoner",desc:"1M€ birikim yaptın",cat:"finans",check:p=>(p.savings||0)>=1000},
  {id:"charity_hero",icon:"❤️",title:"Hayır Kahramanı",desc:"Hayır işlerine katkı",cat:"finans",check:p=>p.didCharity},
  {id:"red_card",icon:"🟥",title:"Ateşli Karakter",desc:"İlk kırmızı kartını aldın",cat:"performans",check:p=>p.redCards>=1},
  {id:"injury_return",icon:"🩹",title:"Geri Döndüm",desc:"Uzun sakatlıktan döndün",cat:"kariyer",check:p=>p.hadLongInjury},
  {id:"retire_legend",icon:"🕊️",title:"Efsane Emeklilik",desc:"OVR 85+ ile emekli",cat:"kariyer",check:p=>p.retired&&p.ovr>=85},
];

// Maç olayları
const MEX={
  goal_self:["⚽ {name} ceza sahasına girdi ve müthiş vuruşla fileleri salladı! {min}'","⚽ Nefes kesen aksiyon! {name} kaleciye şans tanımadı! {min}'","⚽ HAT-TRİCK TAMAMLANDI! {name} tarihe geçiyor! {min}'","⚽ {name}'nin frikiki duvarın üzerinden geçti! GOL! {min}'","⚽ Olağanüstü bireysel aksiyon! 3 adamı geçti, GOL! {min}'"],
  assist_self:["🎯 {name}'nin ölçülü ortası kafa vuruşuyla gole dönüştü! {min}'","🎯 {name}'nin vizyon pası rakip savunmayı yerle bir etti! {min}'","🎯 Harika kombinasyon! {name}'nin pasından gol kaçınılmaz oldu! {min}'"],
  team_goal:["⚽ Takım golü buldu! {min}'","⚽ Güzel kombinasyondan gol! {min}'"],
  opp_goal:["😔 Rakip golü buldu. {min}'","😔 Beklenen hata! Rakip öne geçti. {min}'"],
  penalty_scored:["🎯 PENALTI! {name} soğukkanlılığını korudu ve golü attı! {min}'"],
  penalty_missed:["😱 {name}'nin penaltısı direğe çarptı! Büyük fırsat kaçtı! {min}'"],
  last_minute:["⏰ 90+{extra}! {name} SON DAKİKA GOLÜ! TRİBÜNLER ÇILGINA DÖNDÜ!","⏰ STOPAJ GOLÜ! {name} takımını kurtardı! +{extra}!"],
  red_card:["🟥 {name} sert müdahalesi nedeniyle KIRMIZI KART gördü! {min}'","🟥 İKİNCİ SARI = KIRMIZI! {name} sahadan ayrılıyor! {min}'"],
  yellow_card:["🟨 {name} sarı kart gördü! {min}'"],
  derby:["🔥 DERBİ MAÇI! Tribünler ateş gibi! Her top mücadelesi savaş!"],
  cl_atm:["🌟 AVRUPA ŞAMPİYONLAR KUPASI! {name} Avrupa sahnesinde! Tüm dünya izliyor!"],
  big_chance:["🔥 {name} büyük pozisyon! Az kalsın gol! {min}'","⚡ {name} boş kaleyi buldu ama direği! {min}'"],
  commentary_good:["💪 {name} bugün formda! Her topa yetişiyor.","🔥 {name} bu maçta şov yapıyor! Rakip savunma çaresiz."],
  commentary_bad:["😐 {name} ritmi bir türlü tutturamıyor bugün.","🔄 Antrenör {name}'yi değiştirmeyi düşünüyor olabilir."],
};

// Sosyal medya
const SOCIAL={
  great:["EFSANE! {name} bu neslin en iyisi 🐐","Bugün tribünlerde ağladım. {name} = GÖZ YAŞI 😭⚽","{name} = KALITE! Başka kelime yok 💎","Tüm dünya bunu konuşuyor: {name}! 🌍"],
  good:["Bugün {name} iyiydi 👏","{name} bu sezonda çok umut verici 📈","Güzel maç {name}, böyle devam ⚽"],
  bad:["{name} bu sezon hayal kırıklığı 😔","Antrenör {name}'yi neden oynattı? 🤔","{name} daha iyisini yapabilir 💔"],
  crisis:["Skandal! {name} hakkındaki haberler şoke etti 😱","{name}'nin o açıklaması her yerde gündem 🔥","Sosyal medya {name} için ikiye bölündü... 🤯"],
  captain:["KAPİTAN {name}! Bu doğru seçim! 🎗️💪","Takım kaptanımız {name}! Çok hak etti! 🏆"],
};

// Haber sistemi
function genNews(p,type,extra={}){
  const map={
    match_win:{icon:"🏆",title:`${p.name} Takımını Zafere Taşıdı`,body:`${p.name} ${extra.rating||7.0} puanlık performansıyla galibiyette kilit rol oynadı.`},
    match_loss:{icon:"😔",title:`${p.team} Mağlup`,body:`${p.name} zorlu maçta mücadele etti ama takım istediği sonucu alamadı.`},
    goal_scored:{icon:"⚽",title:`${p.name}'dan Harika Gol`,body:`${p.name}'nin ${extra.goals||1}. sezon golü sosyal medyada gündem oldu!`},
    hat_trick:{icon:"🎩",title:`${p.name}'dan HAT-TRİCK!`,body:`Tarihi gece! ${p.name} bu gece 3 golle tarihe geçti!`},
    penalty_miss:{icon:"😱",title:`${p.name} Penaltı Kaçırdı`,body:`Kritik anda penaltı direkten döndü. Sosyal medya ikiye bölündü.`},
    red_card:{icon:"🟥",title:`${p.name}'ye Kırmızı Kart`,body:`${p.name} ${extra.min||75}. dakikada kırmızı kart gördü. ${extra.ban||1} maç ceza bekleniyor.`},
    last_minute:{icon:"⏰",title:`${p.name}'dan Son Dakika Mucizesi!`,body:`İnanılmaz! ${p.name} +${extra.extra||3}. dakikada takımını kurtardı!`},
    transfer:{icon:"✈️",title:`${p.name} ${extra.team||"Yeni Takım"}'de!`,body:`Resmi! ${p.name} yeni kulübüyle anlaştı.`},
    national:{icon:CAREER_FLAGS[p.nat]||"🏳️",title:`${p.name} Milli Takımda!`,body:`${p.nat} Milli Takımı ${p.name}'yi kadrosuna dahil etti!`},
    loan:{icon:"🔄",title:`${p.name} Kiralık Gidiyor`,body:`${p.name} sezon sonu ${extra.team||"yeni kulüp"}'e kiralık gidecek.`},
    captain:{icon:"🎗️",title:`${p.name} Kaptan Seçildi!`,body:`${p.team} teknik direktörü ${p.name}'yi takım kaptanı olarak belirledi!`},
    conflict:{icon:"⚡",title:`${p.name} ile ${extra.teammate||"takım arkadaşı"} arasında gerilim`,body:`Soyunma odasında yaşanan tartışma kulübe yansıdı.`},
    club_legend:{icon:"🗿",title:`${p.name}: ${p.team} Efsanesi`,body:`${p.name} ${p.team} formasıyla 5. sezonuna giriyor. Gerçek bir kulüp efsanesi!`},
    mentor:{icon:"👨‍🏫",title:`${extra.mentor||"Efsane"} ${p.name}'yi Aldı Kanatları Altına`,body:`${extra.mentor||"Eski yıldız"} genç yeteneği ${p.name}'yi bizzat yetiştiriyor.`},
    ovr_up:{icon:"📈",title:`${p.name} Gelişmeye Devam Ediyor`,body:`OVR ${extra.ovr||70}. Uzmanlar ${p.name}'nin potansiyelini yakından takip ediyor.`},
    motm:{icon:"🌟",title:`Maçın Adamı: ${p.name}!`,body:`${extra.rating||8.0} puan! ${p.name} bu performansıyla şov yaptı!`},
    charity:{icon:"❤️",title:`${p.name}'den Büyük Bağış`,body:`${p.name} sosyal sorumluluk projelerine büyük bağış yaptı. Taraftarlar alkışlıyor.`},
    crisis:{icon:"🔥",title:`${p.name} Basın Krizi`,body:`${p.name}'nin açıklaması büyük tartışma yarattı. Kulüp açıklama yapacak.`},
    birthday:{icon:"🎂",title:`${p.name} Doğum Günü!`,body:`${p.name} bugün ${extra.age||25} yaşına girdi! Takım sürpriz yaptı.`},
    contract:{icon:"📝",title:`${p.name} Sözleşme İmzaladı`,body:`${p.name}, ${p.team} ile yeni sözleşme imzaladı! Taraftarlar sevinçle kutluyor.`},
    diary:{icon:"📓",title:"Kariyer Günlüğü",body:extra.msg||"..."},
  };
  const n=map[type]||{icon:"📰",title:"Haber",body:"..."};
  return{...n,id:Date.now()+Math.random(),date:new Date().toLocaleDateString("tr-TR"),type};
}

// Günlük mesajlar
const DIARY={
  win:["Harika bir gün! Kazandık ve katkımı koydum. Bu duygu tarif edilemez.","Sahada her şey yerine oturdu. Antrenöre güveniyorum, o da bana."],
  loss:["Zor bir gün... Ama bu yenilgiden ders çıkarmalıyız.","Sahadaki performansımdan memnun değilim. Daha iyisini yapabilirim."],
  goal:["Golü attığımda tribünler çılgına döndü! Çocukken bu anları hayal ederdim.","Her gol benim için özel. Ama daha çoğunu atacağım."],
  training:["Antrenman çok yoğundu. Yorgunum ama bunun karşılığını alacağım.","Kondisyonum her geçen gün daha iyi."],
  mentor_1st:["Bugün {mentor} ile ilk antrenmanımı yaptım. O benden çok şey görmemi beklediğini söyledi.","Efsane {mentor} bugün yanıma geldi. 'Sende bir şey var' dedi. Ağlamak üzereydim."],
  captain_1st:["Kaptan bandajını koluma taktığımda ne hissettiğimi anlatamam. Bu sorumluluk beni büyütecek."],
  national:["Milli takım daveti geldi! Çocukluğumdan beri bu anı bekledim. Bayrağım için oynayacağım!"],
  injury:["Sakatlık haberini duyunca yıkıldım. Ama en kısa sürede döneceğim."],
  last_minute:["90+3'te o golü attıktan sonra tribünlere baktım. O an hayatımın en iyi anıydı."],
  red_card:["Kırmızı kart gördüm... Sinirlerimi kontrol edemem. Kendimden utanıyorum."],
  birthday:["Bugün doğum günüm. Takım arkadaşlarım sürpriz yaptı. Ne kadar şanslıyım."],
  house:["Bugün ilk evimi aldım. Artık bu şehirde gerçekten köklendim."],
  charity:["Hayır projesine katkıda bulundum. Futbol bana bu imkânı verdiği için minnettarım."],
  conflict:["Takım arkadaşımla anlaşamadık. Bu gerilimi çözmeliyiz, takıma zarar veriyor."],
  retire:["Hayatımın en zor kararını aldım. Ama emeklilik zamanım geldi. Ne güzel bir yolculuktu!"],
};

// Lig tablosu
function initLeagueTable(teamName,teamStr,lg){
  const rivals=CAREER_TEAMS.filter(t=>t.lg===lg&&t.n!==teamName).slice(0,lg.includes("TFF")?17:17);
  const initBudget=(str)=>str>=84?80:str>=78?50:str>=72?30:str>=66?18:str>=60?10:6; // M€
  return [
    {n:teamName,str:teamStr,pts:0,w:0,d:0,l:0,gf:0,ga:0,me:true,color:"#4da6ff",budget:initBudget(teamStr),spent:0},
    ...rivals.map(t=>({n:t.n,str:t.str,pts:0,w:0,d:0,l:0,gf:0,ga:0,me:false,color:t.color||"#7898c0",budget:initBudget(t.str),spent:0}))
  ];
}
function simLeagueWeek(table){
  return table.map(t=>{
    if(t.me) return t;
    const wp=Math.min(0.78,Math.max(0.12,0.5+(t.str-62)/80));
    const r=Math.random();
    if(r<wp) return{...t,pts:t.pts+3,w:t.w+1,gf:t.gf+1+Math.floor(Math.random()*2),ga:t.ga+Math.floor(Math.random()*2)};
    if(r<wp+0.24) return{...t,pts:t.pts+1,d:t.d+1,gf:t.gf+1,ga:t.ga+1};
    return{...t,l:t.l+1,gf:t.gf+Math.floor(Math.random()*2),ga:t.ga+1+Math.floor(Math.random()*2)};
  }).sort((a,b)=>b.pts-a.pts||(b.gf-b.ga)-(a.gf-a.ga));
}
function initTopScorers(name,pos,teamName){
  // Rakip golcüler: isim + gerçekçi pozisyon ataması
  const rivals=[
    {n:"J.Martinez",pos:"ST",team:"Real CF"},{n:"K.Silva",pos:"CAM",team:"Atletik SC"},
    {n:"A.Müller",pos:"ST",team:"Bayern FC"},{n:"L.Hassan",pos:"LM",team:"Ajax SK"},
    {n:"R.Kowalski",pos:"CM",team:"Wisła SK"},{n:"M.Traoré",pos:"ST",team:"Lille OSC"},
    {n:"C.Santos",pos:"RM",team:"Porto FC"},{n:"D.Popov",pos:"CAM",team:"CSKA SK"},
    {n:"N.Larsen",pos:"ST",team:"Brøndby IF"},{n:"F.Moreno",pos:"LM",team:"Sevilla CF"},
    {n:"B.Özdemir",pos:"CM",team:"Trabzon SK"},{n:"E.Çelik",pos:"ST",team:"Fenerbahçe"},
  ];
  return[...rivals.map(r=>({n:r.n,pos:r.pos,team:r.team,goals:0,assists:0,me:false})),{n:name,pos:pos||"ST",team:teamName||"Club Manager: Glory Road",goals:0,assists:0,me:true}];
}

// Hava durumu
const WEATHER=[
  {n:"Güneşli",icon:"☀️",eff:0},{n:"Bulutlu",icon:"⛅",eff:-0.1},{n:"Yağmurlu",icon:"🌧️",eff:-0.3},
  {n:"Karlı",icon:"❄️",eff:-0.6},{n:"Rüzgarlı",icon:"💨",eff:-0.2},{n:"Sıcak",icon:"🌡️",eff:-0.2},
];

// Kariyer evresi
function getStage(ovr){return CAREER_STAGES.find(s=>ovr>=s.minOvr&&ovr<=s.maxOvr)||CAREER_STAGES[0];}

// Ajan sistemi
const CAREER_AGENTS=[
  {n:"Mehmet Yıldız",emoji:"💼",desc:"Türk futbolunun güçlü temsilcisi",bonus:0.10,speciality:"Türkiye"},
  {n:"Carlos Mendes",emoji:"🦅",desc:"Uluslararası transferlerin ustası",bonus:0.15,speciality:"Güney Amerika"},
  {n:"Sarah Williams",emoji:"📋",desc:"Genç yeteneklerin güvenilir sözcüsü",bonus:0.12,speciality:"Gelişim"},
  {n:"Viktor Petrov",emoji:"⚔️",desc:"Maksimum maaş için her koşulda savaşır",bonus:0.18,speciality:"Büyük Transferler"},
  {n:"Marco Ferrari",emoji:"🌺",desc:"İtalyan kulüplerle güçlü bağlantı",bonus:0.14,speciality:"İtalya/İspanya"},
];

// Maç hedefleri
function genMatchGoals(p){
  const gs=[];
  if(["ST","CAM","LM","RM"].includes(p.pos)) gs.push({id:"score",desc:"Bu maçta gol at",reward:8});
  if(["CAM","CM","LM","RM","ST"].includes(p.pos)) gs.push({id:"assist",desc:"Asist yap",reward:5});
  gs.push({id:"rating75",desc:"7.5+ rating al",reward:6});
  gs.push({id:"win",desc:"Maçı kazan",reward:4});
  return gs.slice(0,2);
}

// Sezon hedefleri
function genSeasonGoals(p){
  const gs=[];
  if(["ST","CAM"].includes(p.pos)) gs.push({id:"goals10",desc:"10 gol at",reward:50,done:false});
  if(["CAM","CM","LM","RM"].includes(p.pos)) gs.push({id:"assists8",desc:"8 asist yap",reward:40,done:false});
  gs.push({id:"rating68",desc:"Ort. 6.8+ rating",reward:30,done:false});
  gs.push({id:"matches20",desc:"20+ maç oyna",reward:25,done:false});
  return gs;
}

// Performans hesabı
function calcPerf(p,teamStr,oppStr,isHome,weather,mGoals){
  const pers=PERSONALITY_TYPES.find(x=>x.id===p.personality);
  const homeB=isHome?4:0;
  const wEff=weather?.eff||0;
  const sk=p.skills||{};

  // ── POZİSYONA GÖRE KRİTİK SKİLL'LER ─────────────────────
  // Her pozisyon için hangi skill'lerin takım gücüne katkısı ne kadar
  const posSkillBonus={
    GK:  (sk.reflexes||0)*0.8+(sk.positioning||0)*0.6+(sk.leadership||0)*0.4,
    CB:  (sk.tackling||0)*0.8+(sk.heading||0)*0.6+(sk.composure||0)*0.5+(sk.pace_def||0)*0.3,
    LB:  (sk.crossing||0)*0.5+(sk.pace||0)*0.7+(sk.tackling||0)*0.6+(sk.stamina||0)*0.4,
    RB:  (sk.crossing||0)*0.5+(sk.pace||0)*0.7+(sk.tackling||0)*0.6+(sk.stamina||0)*0.4,
    CDM: (sk.tackling||0)*0.8+(sk.passing||0)*0.6+(sk.stamina||0)*0.5+(sk.vision||0)*0.4,
    CM:  (sk.passing||0)*0.8+(sk.stamina||0)*0.6+(sk.shooting||0)*0.4+(sk.vision||0)*0.7,
    CAM: (sk.vision||0)*0.9+(sk.dribbling||0)*0.7+(sk.shooting||0)*0.6+(sk.freekick||0)*0.4,
    LM:  (sk.pace||0)*0.8+(sk.dribbling||0)*0.7+(sk.crossing||0)*0.6+(sk.shooting||0)*0.5,
    RM:  (sk.pace||0)*0.8+(sk.dribbling||0)*0.7+(sk.crossing||0)*0.6+(sk.shooting||0)*0.5,
    ST:  (sk.finishing||0)*1.0+(sk.pace||0)*0.6+(sk.heading||0)*0.5+(sk.composure||0)*0.8,
  }[p.pos]||Object.values(sk).reduce((s,v)=>s+v*0.4,0);

  // Skill bonusu: max ~8-10 OVR eşdeğeri (her skill max 10 puan)
  const skillStrBonus = Math.min(10, posSkillBonus * 0.35);

  // Toplam maç gücü: takım gücü + bireysel skill katkısı
  const effectiveStr = teamStr + skillStrBonus;

  const moodB=(p.personality==="genius"&&p.morale<40)?-1.5:0;
  const personalityB=pers?.bonuses?.bigMatchBonus&&effectiveStr>85?pers.bonuses.bigMatchBonus:0;
  const formVar=pers?.bonuses?.formVariance||1;
  const diff=effectiveStr-oppStr+homeB;

  // winP: skill bonusu artık anlamlı etki yapıyor (~%5-15 fark)
  const winP=Math.min(0.85,Math.max(0.10, 0.5+diff*0.013));
  const r=Math.random();
  const isWin=r<winP, isDraw=!isWin&&r<winP+0.25, isLoss=!isWin&&!isDraw;

  // Rating: skill bonusu doğrudan rating'e yansıyor
  const skillRatBonus = Math.min(1.5, posSkillBonus * 0.08);
  const baseR=(isWin?7.0:isDraw?6.3:5.6)+(Math.random()-0.5)*2.2*formVar+wEff+skillRatBonus+moodB+personalityB;
  const rating=Math.max(4.2,Math.min(9.9,Math.round(baseR*10)/10));

  const mentorGoalB=(p.mentor)?0.06:0;
  // Gol/asist ihtimali: ilgili skill'ler pozisyona göre güçlü etki yapıyor
  const finSkill=(sk.finishing||sk.shooting||0);
  const visSkill=(sk.vision||sk.passing||0);
  const goalP=(p.pos==="ST"?0.40:p.pos==="CAM"?0.20:["LM","RM"].includes(p.pos)?0.14:p.pos==="CM"?0.09:0.02)
              +mentorGoalB+finSkill*0.025+(isWin?0.06:0);
  const assP=(p.pos==="CAM"?0.28:p.pos==="CM"?0.22:["LM","RM"].includes(p.pos)?0.20:p.pos==="ST"?0.12:0.05)
             +visSkill*0.025+(isWin?0.04:0);

  const goals=isLoss&&Math.random()<0.65?0:Math.random()<goalP?(Math.random()<0.15?2:1):0;
  const assists=goals>0?0:(Math.random()<assP?1:0);
  const motm=rating>=8.3&&Math.random()<0.65;
  const hasPenalty=Math.random()<0.12;
  const penSkill=(sk.composure||sk.finishing||0);
  const penScored=hasPenalty&&Math.random()<(0.70+penSkill*0.02);
  const hasLastMin=(isWin||isDraw)&&Math.random()<0.08;
  const hasRedCard=Math.random()<(p.personality==="rebel"?0.04:0.015);
  const extraTime=Math.floor(Math.random()*5)+1;
  const gf=isWin?1+Math.floor(Math.random()*3):isDraw?1+Math.floor(Math.random()*2):Math.floor(Math.random()*2);
  const ga=isLoss?1+Math.floor(Math.random()*3):isDraw?gf:Math.max(0,gf-1-Math.floor(Math.random()*2));
  const achGoals=[];
  if(mGoals){
    if(mGoals.find(g=>g.id==="score")&&goals>0) achGoals.push("score");
    if(mGoals.find(g=>g.id==="assist")&&assists>0) achGoals.push("assist");
    if(mGoals.find(g=>g.id==="rating75")&&rating>=7.5) achGoals.push("rating75");
    if(mGoals.find(g=>g.id==="win")&&isWin) achGoals.push("win");
  }
  return{isWin,isDraw,isLoss,rating,goals:goals+(hasPenalty&&penScored?1:0),assists,motm,mins:rating>=6.8?90:rating>=5.8?72:40,gf,ga,score:`${gf}-${ga}`,hasPenalty,penScored,hasLastMin,extraTime,hasRedCard,achGoals,skillStrBonus};
}

// Gelişim hesabı
function calcDev(p,perf){
  const gap=Math.max(0,(p.pot||80)-(p.ovr||60));
  if(gap<=0) return 0;
  const pers=PERSONALITY_TYPES.find(x=>x.id===p.personality);
  const persM=pers?.bonuses?.devMult||1.0;
  const mentorM=p.mentor?1.2:1.0;
  const pcM=p.personalCoach?1+(PERSONAL_COACHES.find(x=>x.id===p.personalCoach)?.devBonus||0):1.0;
  const ageF=p.age<=19?1.05:p.age<=21?0.88:p.age<=23?0.72:p.age<=25?0.56:p.age<=27?0.36:p.age<=29?0.18:0.06;
  const perfF=perf.rating>=8.8?1.6:perf.rating>=7.8?1.25:perf.rating>=6.8?1.0:0.72;
  const gapF=gap>=20?1.28:gap>=15?1.12:gap>=10?1.0:gap>=5?0.68:0.28;
  return ageF*perfF*gapF*persM*mentorM*pcM*(2.8+Math.random()*2.0);
}

// Maç akışı
function buildFlow(p,perf,isDerby,isCL){
  const evts=[];
  const mins=[8,17,23,31,38,44,51,58,64,72,79,84];
  const used=new Set();
  const pm=()=>{let m;do{m=mins[Math.floor(Math.random()*mins.length)];}while(used.has(m));used.add(m);return m;};
  const pick=arr=>arr[Math.floor(Math.random()*arr.length)];
  if(isCL) evts.push({min:1,type:"cl",txt:pick(MEX.cl_atm).replace(/{name}/g,p.name)});
  else if(isDerby) evts.push({min:1,type:"derby",txt:pick(MEX.derby)});
  if(perf.hasPenalty){
    const m=pm();
    evts.push({min:m,type:perf.penScored?"pen_scored":"pen_miss",txt:(perf.penScored?MEX.penalty_scored[0]:MEX.penalty_missed[0]).replace(/{name}/g,p.name).replace("{min}",m+"")});
  }
  for(let i=0;i<perf.goals-(perf.hasPenalty&&perf.penScored?1:0);i++){
    const m=pm();
    const msgs=perf.goals>=3&&i===2?[MEX.goal_self[2]]:MEX.goal_self;
    evts.push({min:m,type:"goal_self",txt:pick(msgs).replace(/{name}/g,p.name).replace("{min}",m+"")});
  }
  if(perf.assists>0){const m=pm();evts.push({min:m,type:"assist_self",txt:pick(MEX.assist_self).replace(/{name}/g,p.name).replace("{min}",m+"")});}
  if(perf.hasLastMin) evts.push({min:90,type:"last_min",txt:pick(MEX.last_minute).replace(/{name}/g,p.name).replace("{extra}",perf.extraTime+"")});
  if(perf.hasRedCard){const m=pm();evts.push({min:m,type:"red_card",txt:pick(MEX.red_card).replace(/{name}/g,p.name).replace("{min}",m+"")});}
  if(perf.gf>0){const m=pm();evts.push({min:m,type:"team_goal",txt:pick(MEX.team_goal).replace("{min}",m+"")});}
  if(perf.ga>0){const m=pm();evts.push({min:m,type:"opp_goal",txt:pick(MEX.opp_goal).replace("{min}",m+"")});}
  if(perf.rating>=7.5) evts.push({min:pm(),type:"good",txt:pick(MEX.commentary_good).replace(/{name}/g,p.name)});
  else if(perf.rating<5.8) evts.push({min:pm(),type:"bad",txt:pick(MEX.commentary_bad).replace(/{name}/g,p.name)});
  if(Math.random()<0.35){const m=pm();evts.push({min:m,type:"chance",txt:pick(MEX.big_chance).replace(/{name}/g,p.name).replace("{min}",m+"")});}
  return evts.sort((a,b)=>a.min-b.min);
}

// ── İTİBAR SİSTEMİ ─────────────────────────────────────────────
// Yavaş kazanım: her maç 1-3 puan, büyük başarılar +10-15
// İtibar → piyasa değeri ve transfer teklifi maaşına doğrudan etki
const REP_EVENTS={
  // Maç bazlı (küçük kazanımlar)
  rating_low:    {rep:-1, desc:"Kötü maç"},
  rating_mid:    {rep:1,  desc:"İyi performans"},
  rating_high:   {rep:2,  desc:"Harika performans"},
  rating_top:    {rep:3,  desc:"Olağanüstü performans"},
  goal:          {rep:1,  desc:"Gol attın"},
  assist:        {rep:1,  desc:"Asist yaptın"},
  motm:          {rep:2,  desc:"Maçın adamı"},
  penalty_miss:  {rep:-2, desc:"Penaltı kaçırdın"},
  red_card:      {rep:-3, desc:"Kırmızı kart"},
  // Büyük başarılar (sezon sonu)
  top_scorer:    {rep:12, desc:"Gol Krallığı"},
  national_call: {rep:10, desc:"Milli Takım"},
  ballon_dor:    {rep:15, desc:"Ballon d'Or"},
  club_legend:   {rep:12, desc:"Kulüp Efsanesi"},
  world_cup:     {rep:15, desc:"Dünya Kupası"},
  promotion:     {rep:8,  desc:"Şampiyonluk"},
  // Azalma
  bad_season:    {rep:-5, desc:"Kötü sezon"},
  captain_off:   {rep:-4, desc:"Kaptan bandı alındı"},
};

// Oyuncunun itibarına göre piyasa değeri hesapla
function calcMarketValue(ovr, rep, age, pos, isBallonDor=false){
  // OVR tabanı
  const ovrBase = ovr<=60 ? ovr*8 : ovr<=70 ? ovr*18 : ovr<=80 ? ovr*35 : ovr<=90 ? ovr*70 : ovr*120;
  // İtibar çarpanı: 0 itibar = 0.4x, 50 itibar = 1.0x, 100 itibar = 2.2x
  const repMult = 0.4 + (rep/100)*1.8;
  // Yaş çarpanı
  const ageMult = age<=21?1.3:age<=24?1.1:age<=27?1.0:age<=30?0.85:age<=33?0.65:0.40;
  // Pozisyon bonosu (GK ve forvet biraz daha değerli)
  const posMult = pos==="ST"?1.1:pos==="GK"?1.05:1.0;
  // Altın Top kazananları çok satın alınabilir olmaz — piyasa doygunluğu etkisi
  const ballonMult = isBallonDor ? 0.72 : 1.0;
  return Math.max(50, Math.round(ovrBase * repMult * ageMult * posMult * ballonMult));
}

// Transfer teklifi maaşı itibardan etkilenir
function calcOfferSalary(teamStr, agentBonus, rep){
  const base = teamStr * 1.1 * agentBonus;
  // İtibar 0=0.6x, 50=1.0x, 100=1.5x
  const repMult = 0.6 + (rep/100)*0.9;
  return Math.round(base * repMult);
}

// Maç sonrası itibar değişimi hesapla
function calcRepChange(perf, isMiniGameWin){
  let delta = 0;
  // Rating bazlı
  if(perf.rating >= 9.0)      delta += REP_EVENTS.rating_top.rep;
  else if(perf.rating >= 7.5) delta += REP_EVENTS.rating_high.rep;
  else if(perf.rating >= 6.5) delta += REP_EVENTS.rating_mid.rep;
  else                         delta += REP_EVENTS.rating_low.rep;
  // Performans bonusları
  if(perf.goals > 0)    delta += REP_EVENTS.goal.rep * Math.min(perf.goals, 3);
  if(perf.assists > 0)  delta += REP_EVENTS.assist.rep;
  if(perf.motm)         delta += REP_EVENTS.motm.rep;
  if(perf.hasRedCard)   delta += REP_EVENTS.red_card.rep;
  if(perf.hasPenalty && !perf.penScored) delta += REP_EVENTS.penalty_miss.rep;
  // Mini-game başarısı bonus
  if(isMiniGameWin)     delta += 1;
  // Maksimum tek maç değişimi: -5 ile +5 arasında kısıtla
  return Math.max(-5, Math.min(5, delta));
}
