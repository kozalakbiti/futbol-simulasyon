const INIT_YOUTH=[
  {id:2001,n:"Y.Ozturk", pos:"ST",ovr:63,pot:88,age:17,spd:85,sht:72,pas:65,def:30,sal:20,youthYear:0},
  {id:2002,n:"E.Koc",    pos:"CM",ovr:61,pot:85,age:16,spd:70,sht:60,pas:78,def:55,sal:18,youthYear:0},
  {id:2003,n:"B.Yilmaz", pos:"LB",ovr:59,pot:83,age:17,spd:82,sht:45,pas:68,def:72,sal:16,youthYear:0},
  {id:2004,n:"A.Arslan",  pos:"CB",ovr:56,pot:80,age:16,spd:68,sht:38,pas:60,def:75,sal:14,youthYear:0},
  {id:2005,n:"M.Sahin",  pos:"GK",ovr:58,pot:82,age:17,spd:55,sht:20,pas:52,def:70,sal:14,youthYear:0},
  {id:2006,n:"D.Kurt",   pos:"RM",ovr:62,pot:87,age:18,spd:88,sht:68,pas:70,def:45,sal:20,youthYear:0},
  {id:2007,n:"C.Polat",  pos:"CAM",ovr:60,pot:86,age:17,spd:74,sht:65,pas:80,def:40,sal:18,youthYear:0},
  {id:2008,n:"S.Aksoy",  pos:"RB", ovr:57,pot:81,age:16,spd:80,sht:42,pas:62,def:70,sal:16,youthYear:0},
];

// ═══════════════════════════════════════════════════════════════
// GENÇ YETENEK SİSTEMİ
// ═══════════════════════════════════════════════════════════════
const YOUTH_FIRST=["E","M","K","A","B","C","S","T","O","H","Y","F","R","D","N","Z","U","I","G","L"];
const YOUTH_LAST=["Yilmaz","Kaya","Demir","Sahin","Celik","Arslan","Dogan","Kurt","Bulut","Yurt",
  "Ozturk","Koc","Polat","Aksoy","Turan","Can","Oz","Ay","Kilic","Yurt","Acar","Bas","Sen",
  "Top","Dal","Gul","Tas","Er","Bey","Han","Efe","Bay","Kor","Tan","Ince","Cam","Pek"];
const YOUTH_POS=["GK","CB","CB","LB","RB","CM","CM","LM","RM","CAM","CDM","ST","ST"];
const YOUTH_NAT=["TUR","TUR","TUR","TUR","TUR","TUR","ENG","FRA","BRA","ARG","NED","POR","GER","ESP"];

let _youthIdCounter=99001;
const genYouthPlayer=()=>{
  const pos=YOUTH_POS[Math.floor(Math.random()*YOUTH_POS.length)];
  const age=15+Math.floor(Math.random()*4); // 15-18
  // OVR düşük ama POT yüksek — yetenek oyuncuları
  const ovr=52+Math.floor(Math.random()*12); // 52-63
  const pot=76+Math.floor(Math.random()*14); // 76-89 (yüksek potansiyel)
  const first=YOUTH_FIRST[Math.floor(Math.random()*YOUTH_FIRST.length)];
  const last=YOUTH_LAST[Math.floor(Math.random()*YOUTH_LAST.length)];
  const nat=YOUTH_NAT[Math.floor(Math.random()*YOUTH_NAT.length)];
  const spd=60+Math.floor(Math.random()*30);
  const sht=pos==="GK"?15+Math.floor(Math.random()*10):40+Math.floor(Math.random()*35);
  const pas=50+Math.floor(Math.random()*30);
  const def=["CB","LB","RB","GK"].includes(pos)?55+Math.floor(Math.random()*25):25+Math.floor(Math.random()*30);
  const val=Math.round((pot-70)*0.3*10)/10; // değer potansiyele göre
  const sal=30+Math.floor(Math.random()*40); // 30-70K€/yıl
  const id=_youthIdCounter++;
  return{id,n:`${first}.${last}`,pos,ovr,pot,age,spd,sht,pas,def,val,sal,
    club:"Serbest",lg:"Serbest",nat,ct:0,st:"free",ch:70};
};

// Altyapıya özel genç oyuncu üretici (daha düşük OVR, yüksek pot)
const genYouthAltyapi=(acLvl=1)=>{
  const pos=YOUTH_POS[Math.floor(Math.random()*YOUTH_POS.length)];
  const age=14+Math.floor(Math.random()*3); // 14-16
  // Akademi seviyesi potansiyel ve OVR'yi etkiler
  const lvlBonus=(acLvl-1)*2; // seviye 1→0, 2→2, 3→4, 4→6, 5→8
  const ovr=46+Math.floor(Math.random()*12)+Math.floor(lvlBonus*0.5);
  const pot=74+Math.floor(Math.random()*16)+lvlBonus; // 74-89 → daha yüksek seviyede 82-97
  const first=YOUTH_FIRST[Math.floor(Math.random()*YOUTH_FIRST.length)];
  const last=YOUTH_LAST[Math.floor(Math.random()*YOUTH_LAST.length)];
  const spd=62+Math.floor(Math.random()*28);
  const sht=pos==="GK"?12+Math.floor(Math.random()*8):36+Math.floor(Math.random()*32);
  const pas=48+Math.floor(Math.random()*28);
  const def=["CB","LB","RB","GK"].includes(pos)?52+Math.floor(Math.random()*22):20+Math.floor(Math.random()*28);
  const sal=10+Math.floor(Math.random()*15);
  const id=_youthIdCounter++;
  return{id,n:`${first}.${last}`,pos,ovr:Math.min(75,ovr),pot:Math.min(97,pot),age,spd,sht,pas,def,sal,youthYear:0};
};

// Genel serbest oyuncu üretici — DB doluluk kontrolü için
// Geniş yaş/ovr aralığı, gerçekçi değerler
const genFreeAgent=()=>{
  const pos=YOUTH_POS[Math.floor(Math.random()*YOUTH_POS.length)];
  const age=18+Math.floor(Math.random()*16); // 18-33
  const ovr=55+Math.floor(Math.random()*22); // 55-76
  const pot=Math.min(88,ovr+Math.floor(Math.random()*12)); // pot >= ovr, max 88
  const first=YOUTH_FIRST[Math.floor(Math.random()*YOUTH_FIRST.length)];
  const last=YOUTH_LAST[Math.floor(Math.random()*YOUTH_LAST.length)];
  const nat=YOUTH_NAT[Math.floor(Math.random()*YOUTH_NAT.length)];
  const spd=55+Math.floor(Math.random()*30);
  const sht=pos==="GK"?20+Math.floor(Math.random()*15):45+Math.floor(Math.random()*30);
  const pas=50+Math.floor(Math.random()*30);
  const def=["CB","LB","RB","GK"].includes(pos)?55+Math.floor(Math.random()*25):25+Math.floor(Math.random()*30);
  const val=Math.max(0.1,Math.round((ovr-55)*0.15*10)/10);
  const sal=Math.round((40+(ovr-55)*8)/10)*10; // 40-208K€/yıl
  const id=_youthIdCounter++;
  return{id,n:`${first}.${last}`,pos,ovr,pot,age,spd,sht,pas,def,val,sal,
    club:"Serbest",lg:"Serbest",nat,ct:0,st:"free",ch:65};
};

// Başlangıçta 7 serbest genç yetenek DB'ye eklenir
const INIT_FREE_YOUTH=Array.from({length:7},()=>genYouthPlayer());

const COACHES=[
  // ── YARDIMCI ANTRENÖRLER ──────────────────────────────────────
  {id:1, type:"team", n:"K.Demirci",    spec:"Hücum",      hired:false,cost:1.2,bonus:4,
   desc:"Forvet hattına hücum koordinasyonu katkısı sağlar.",
   teamBonuses:{attack:+3, pressing:+2},
   icon:"⚔️"},
  {id:2, type:"team", n:"S.Voronov",    spec:"Defans",     hired:false,cost:1.8,bonus:5,
   desc:"Savunma organizasyonu ve kompakt blok katkısı.",
   teamBonuses:{defense:+3, defLine:+2},
   icon:"🛡️"},
  {id:3, type:"team", n:"T.Hartmann",   spec:"Taktik",     hired:false,cost:2.5,bonus:6,
   desc:"Taktik uyum ve oyun okuma konusunda destek sağlar.",
   teamBonuses:{tacticBonus:+3, counterAttack:+2},
   icon:"🧠"},
  {id:4, type:"team", n:"L.Ferrante",   spec:"Pas Oyunu",  hired:false,cost:2.8,bonus:5,
   desc:"Kısa pas ve top kontrolü odaklı oyun sistemine katkı sağlar.",
   teamBonuses:{passing:+4, possession:+3},
   icon:"🔁"},
  {id:5, type:"team", n:"M.Brandão",    spec:"Denge",      hired:false,cost:2.0,bonus:4,
   desc:"Hem hücum hem savunmaya dengeli katkı sağlar.",
   teamBonuses:{attack:+2, defense:+2, morale:+3},
   icon:"⚖️"},
  // ── OYUNCU ANTRENÖRLERİ ─────────────────────────────────────
  {id:6, type:"player", n:"O.Lindqvist", spec:"Genç Geliştirme", hired:false,cost:0.8,bonus:6,
   desc:"23 yaş altı oyuncuların gelişimine hafif katkı sağlar.",
   playerBonuses:{u23DevMult:1.18, potBoost:1},
   icon:"🌱", maxPlayers:7, assignedPlayers:[]},
  {id:7, type:"player", n:"R.Nkemdirim", spec:"Bireysel Teknik",hired:false,cost:1.5,bonus:8,
   desc:"Tüm kadronun bireysel teknik becerilerini geliştirir.",
   playerBonuses:{globalDevMult:1.08, statBoost:1},
   icon:"🎓", maxPlayers:7, assignedPlayers:[]},
  {id:8, type:"player", n:"V.Çetin",     spec:"Fiziksel Güç",   hired:false,cost:1.0,bonus:7,
   desc:"Hız ve güç antrenmanları ile fiziksel gelişimi hızlandırır. Sakatlık riskini azaltır.",
   playerBonuses:{injMult:0.70, spdBoost:1},
   icon:"💪", maxPlayers:7, assignedPlayers:[]},
  {id:9, type:"player", n:"B.Okonkwo",   spec:"Üst Düzey Teknik",hired:false,cost:2.2,bonus:10,
   desc:"Yüksek OVR'li oyuncuların gelişimini sürdürür, moral yüksek tutar.",
   playerBonuses:{seniorDevMult:1.10, moralBase:78},
   icon:"⭐", maxPlayers:7, assignedPlayers:[]},
  {id:10,type:"player", n:"H.Stavros",   spec:"Set Pres",        hired:false,cost:1.3,bonus:7,
   desc:"Standart durum (serbest vuruş/köşe) verimliliğini artırır.",
   playerBonuses:{globalDevMult:1.06, setPiece:+4},
   icon:"🎯", maxPlayers:7, assignedPlayers:[]},
  {id:11,type:"player", n:"T.Yılmaz",   spec:"Akademi Koçu",     hired:false,cost:1.1,bonus:7,
   desc:"23 yaş altı oyuncuların potansiyeline kademeli katkı sağlar.",
   playerBonuses:{u23DevMult:1.22, potBoost:1},
   icon:"🏫", maxPlayers:7, assignedPlayers:[]},
  {id:12,type:"player", n:"D.Svensson", spec:"Erken Yetenek Koçu", hired:false,cost:1.8,bonus:9,
   desc:"21 yaş altı oyunculara özel gelişim programı. Potansiyel tavanını hafifçe yükseltir.",
   playerBonuses:{u21DevMult:1.35, potBoost:2, u23DevMult:1.12},
   icon:"🚀", maxPlayers:5, assignedPlayers:[]},
  // ── MAÇ ANALİSTİ (takım antrenörü slotunu kullanır) ───────────
  {id:13,type:"team", n:"E.Varga",     spec:"Maç Analisti", hired:false,cost:1.4,bonus:3,
   desc:"Rakipleri video ile analiz eder. Scout raporları tam isabetli olur, rakibe uygun taktiğin etkisi artar.",
   teamBonuses:{scoutAcc:100, matchup:+1},
   icon:"🔍"},
];
const COACHES_MAX_TEAM=1;   // Aynı anda maks 1 takım antrenörü
const COACHES_MAX_PLAYER=4; // Aynı anda maks 4 oyuncu antrenörü
