const INIT_SQUAD=[
  // ── İlk 11 — ort. OVR ~63, ligin ortası — 1. Lig gerçekçi maaşlar ──
  // TFF 1. Lig maaş aralığı: yedek ~80-150K€/yıl, ilk 11 ~150-500K€/yıl, kaptan ~500-700K€/yıl
  {id:1, n:"A.Yilmaz",pos:"GK",ovr:62,pot:67,spd:52,sht:18,pas:48,def:62,age:28,ct:2,val:0.8,sal:280,listed:false,loan:false,moral:75,injured:0,injSev:0,fatigue:0,protectTrain:false,devPoints:0,seasonGoals:0,seasonAssists:0,seasonRatings:[],seasonMatches:0},
  {id:2, n:"M.Demir", pos:"CB",ovr:61,pot:66,spd:55,sht:28,pas:52,def:63,age:25,ct:3,val:0.9,sal:240,listed:false,loan:false,moral:75,injured:0,injSev:0,fatigue:0,protectTrain:false,devPoints:0,seasonGoals:0,seasonAssists:0,seasonRatings:[],seasonMatches:0},
  {id:3, n:"K.Celik", pos:"CB",ovr:60,pot:64,spd:56,sht:26,pas:50,def:62,age:27,ct:2,val:0.7,sal:220,listed:false,loan:false,moral:75,injured:0,injSev:0,fatigue:0,protectTrain:false,devPoints:0,seasonGoals:0,seasonAssists:0,seasonRatings:[],seasonMatches:0},
  {id:4, n:"S.Arslan",pos:"LB",ovr:62,pot:69,spd:70,sht:42,pas:58,def:60,age:23,ct:4,val:1.0,sal:260,listed:false,loan:false,moral:75,injured:0,injSev:0,fatigue:0,protectTrain:false,devPoints:0,seasonGoals:0,seasonAssists:0,seasonRatings:[],seasonMatches:0},
  {id:5, n:"E.Kaya",  pos:"RB",ovr:59,pot:63,spd:68,sht:38,pas:54,def:58,age:24,ct:2,val:0.7,sal:200,listed:false,loan:false,moral:75,injured:0,injSev:0,fatigue:0,protectTrain:false,devPoints:0,seasonGoals:0,seasonAssists:0,seasonRatings:[],seasonMatches:0},
  {id:6, n:"H.Sahin", pos:"CM",ovr:64,pot:69,spd:62,sht:55,pas:64,def:54,age:26,ct:3,val:1.1,sal:320,listed:false,loan:false,moral:75,injured:0,injSev:0,fatigue:0,protectTrain:false,devPoints:0,seasonGoals:0,seasonAssists:0,seasonRatings:[],seasonMatches:0},
  {id:7, n:"B.Dogan", pos:"CM",ovr:66,pot:73,spd:64,sht:60,pas:66,def:52,age:24,ct:4,val:1.4,sal:420,listed:false,loan:false,moral:75,injured:0,injSev:0,fatigue:0,protectTrain:false,devPoints:0,seasonGoals:0,seasonAssists:0,seasonRatings:[],seasonMatches:0},
  {id:8, n:"O.Kurt",  pos:"LM",ovr:63,pot:71,spd:76,sht:58,pas:62,def:44,age:22,ct:3,val:1.1,sal:290,listed:false,loan:false,moral:75,injured:0,injSev:0,fatigue:0,protectTrain:false,devPoints:0,seasonGoals:0,seasonAssists:0,seasonRatings:[],seasonMatches:0},
  {id:9, n:"C.Bulut", pos:"RM",ovr:61,pot:68,spd:74,sht:55,pas:58,def:40,age:21,ct:2,val:0.9,sal:250,listed:false,loan:false,moral:75,injured:0,injSev:0,fatigue:0,protectTrain:false,devPoints:0,seasonGoals:0,seasonAssists:0,seasonRatings:[],seasonMatches:0},
  {id:10,n:"A.Yildiz",pos:"ST",ovr:68,pot:75,spd:76,sht:70,pas:58,def:30,age:25,ct:4,val:1.8,sal:580,listed:false,loan:false,moral:75,injured:0,injSev:0,fatigue:0,protectTrain:false,devPoints:0,seasonGoals:0,seasonAssists:0,seasonRatings:[],seasonMatches:0},
  {id:11,n:"F.Turan", pos:"ST",ovr:63,pot:67,spd:68,sht:64,pas:54,def:28,age:27,ct:2,val:1.0,sal:310,listed:false,loan:false,moral:75,injured:0,injSev:0,fatigue:0,protectTrain:false,devPoints:0,seasonGoals:0,seasonAssists:0,seasonRatings:[],seasonMatches:0},
  // ── Yedekler ─────────────────────────────────────────────────
  {id:12,n:"T.Kilic", pos:"GK",ovr:55,pot:60,spd:48,sht:14,pas:42,def:54,age:22,ct:2,val:0.3,sal:120,listed:false,loan:false,moral:75,injured:0,injSev:0,fatigue:0,protectTrain:false,devPoints:0,seasonGoals:0,seasonAssists:0,seasonRatings:[],seasonMatches:0},
  {id:13,n:"B.Yurt",  pos:"CB",ovr:57,pot:63,spd:52,sht:22,pas:46,def:58,age:23,ct:2,val:0.4,sal:140,listed:false,loan:false,moral:75,injured:0,injSev:0,fatigue:0,protectTrain:false,devPoints:0,seasonGoals:0,seasonAssists:0,seasonRatings:[],seasonMatches:0},
  {id:14,n:"A.Oz",    pos:"LB",ovr:55,pot:64,spd:66,sht:34,pas:52,def:54,age:21,ct:3,val:0.4,sal:110,listed:false,loan:false,moral:75,injured:0,injSev:0,fatigue:0,protectTrain:false,devPoints:0,seasonGoals:0,seasonAssists:0,seasonRatings:[],seasonMatches:0},
  {id:15,n:"M.Can",   pos:"CM",ovr:57,pot:66,spd:58,sht:48,pas:60,def:48,age:22,ct:2,val:0.5,sal:130,listed:false,loan:false,moral:75,injured:0,injSev:0,fatigue:0,protectTrain:false,devPoints:0,seasonGoals:0,seasonAssists:0,seasonRatings:[],seasonMatches:0},
  {id:16,n:"E.Ay",    pos:"ST",ovr:58,pot:67,spd:66,sht:60,pas:48,def:24,age:21,ct:3,val:0.6,sal:150,listed:false,loan:false,moral:75,injured:0,injSev:0,fatigue:0,protectTrain:false,devPoints:0,seasonGoals:0,seasonAssists:0,seasonRatings:[],seasonMatches:0},
  {id:17,n:"K.Yurt",  pos:"RM",ovr:55,pot:65,spd:72,sht:50,pas:54,def:36,age:20,ct:2,val:0.4,sal:100,listed:false,loan:false,moral:75,injured:0,injSev:0,fatigue:0,protectTrain:false,devPoints:0,seasonGoals:0,seasonAssists:0,seasonRatings:[],seasonMatches:0},
  {id:18,n:"Z.Demir", pos:"RB",ovr:53,pot:61,spd:62,sht:32,pas:48,def:52,age:20,ct:2,val:0.3,sal:90, listed:false,loan:false,moral:75,injured:0,injSev:0,fatigue:0,protectTrain:false,devPoints:0,seasonGoals:0,seasonAssists:0,seasonRatings:[],seasonMatches:0},
  {id:19,n:"U.Polat",  pos:"CDM",ovr:56,pot:64,spd:60,sht:45,pas:56,def:58,age:22,ct:2,val:0.4,sal:110,listed:false,loan:false,moral:75,injured:0,injSev:0,fatigue:0,protectTrain:false,devPoints:0,seasonGoals:0,seasonAssists:0,seasonRatings:[],seasonMatches:0},
  {id:20,n:"G.Ay",     pos:"CAM",ovr:57,pot:66,spd:65,sht:52,pas:66,def:36,age:21,ct:2,val:0.5,sal:120,listed:false,loan:false,moral:75,injured:0,injSev:0,fatigue:0,protectTrain:false,devPoints:0,seasonGoals:0,seasonAssists:0,seasonRatings:[],seasonMatches:0},
  {id:21,n:"N.Kara",   pos:"CB", ovr:54,pot:62,spd:50,sht:22,pas:44,def:56,age:23,ct:2,val:0.3,sal:95, listed:false,loan:false,moral:75,injured:0,injSev:0,fatigue:0,protectTrain:false,devPoints:0,seasonGoals:0,seasonAssists:0,seasonRatings:[],seasonMatches:0},
  {id:22,n:"R.Ince",   pos:"LM", ovr:55,pot:63,spd:71,sht:48,pas:52,def:34,age:20,ct:2,val:0.3,sal:90, listed:false,loan:false,moral:75,injured:0,injSev:0,fatigue:0,protectTrain:false,devPoints:0,seasonGoals:0,seasonAssists:0,seasonRatings:[],seasonMatches:0},
];


const INIT_TEAMS=[
  // ═══ 2026/27 SEZONU LİG YAPILARI ═══════════════════════════════════
  // ── ELİT LİG (18 takım, 34 hafta) ─────────────────────────────────
  {n:"Galatasaray FC", name:"Galatasaray FC", pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:84,stad:"Rams Park",      city:"İstanbul",  lg:"Elit Lig"},
  {n:"Fenerbahce FC",  name:"Fenerbahce FC",  pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:82,stad:"Ülker Stadyumu", city:"İstanbul",  lg:"Elit Lig"},
  {n:"Besiktas FC",    name:"Besiktas FC",    pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:78,stad:"Tüpraş Stadyumu",city:"İstanbul",  lg:"Elit Lig"},
  {n:"Trabzonspor FC", name:"Trabzonspor FC", pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:76,stad:"Medical Park",  city:"Trabzon",   lg:"Elit Lig"},
  {n:"Basaksehir FC",  name:"Basaksehir FC",  pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:72,stad:"Başakşehir St.",city:"İstanbul",  lg:"Elit Lig"},
  {n:"Goztepe FC",     name:"Goztepe FC",     pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:66,stad:"Gursel Aksel", city:"Izmir",     lg:"Elit Lig"},
  {n:"Samsunspor FC",  name:"Samsunspor FC",  pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:63,stad:"19 Mayis",     city:"Samsun",    lg:"Elit Lig"},
  {n:"Eyupspor FC",    name:"Eyupspor FC",    pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:68,stad:"Eyup St.",     city:"Istanbul",  lg:"Elit Lig"},
  {n:"Konyaspor FC",   name:"Konyaspor FC",   pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:65,stad:"Konya Stadyumu",city:"Konya",    lg:"Elit Lig"},
  {n:"Alanyaspor FC",  name:"Alanyaspor FC",  pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:62,stad:"Bahçeşehir",   city:"Alanya",    lg:"Elit Lig"},
  {n:"Rizespor FC",    name:"Rizespor FC",    pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:60,stad:"Rize Stad.",   city:"Rize",      lg:"Elit Lig"},
  {n:"Kasimpasa FC",   name:"Kasimpasa FC",   pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:60,stad:"Recep Tayyip", city:"İstanbul",  lg:"Elit Lig"},
  {n:"Gaziantepspor FC",name:"Gaziantepspor FC",pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:61,stad:"Kalyon Stadyumu",city:"Gaziantep",lg:"Elit Lig"},
  {n:"Genclerbirligi FC",name:"Genclerbirligi FC",pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:62,stad:"19 Mayis",   city:"Ankara",    lg:"Elit Lig"},
  {n:"Kocaelispor FC", name:"Kocaelispor FC", pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:60,stad:"Izmit St.",    city:"Kocaeli",   lg:"Elit Lig"},
  {n:"Erzurumspor FC", name:"Erzurumspor FC", pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:59,stad:"K.Karabekir",  city:"Erzurum",   lg:"Elit Lig"},
  {n:"Amed Sportif FC",name:"Amed Sportif FC",pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:60,stad:"Diyarbakır St.",city:"Diyarbakır",lg:"Elit Lig"},
  {n:"Corum FK",       name:"Corum FK",       pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:58,stad:"Çorum Şehir St.",city:"Çorum",    lg:"Elit Lig"},
  // ── 1. LİG (20 takım, 38 hafta) ───────────────────────────────────
  {n:"FC Yildiz",      name:"FC Yildiz",      pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:true, str:63,stad:"Yildiz Arena",   city:"Ankara",   lg:"1. Lig"},
  {n:"Kayserispor FC", name:"Kayserispor FC", pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:62,stad:"Kayseri Stadyumu",city:"Kayseri", lg:"1. Lig"},
  {n:"Antalyaspor FC", name:"Antalyaspor FC", pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:61,stad:"Antalya Stad.", city:"Antalya",   lg:"1. Lig"},
  {n:"Karagumruk FC",  name:"Karagumruk FC",  pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:62,stad:"Fatih St.",     city:"İstanbul",  lg:"1. Lig"},
  {n:"Sivasspor FC",   name:"Sivasspor FC",   pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:60,stad:"4 Eylül St.",   city:"Sivas",     lg:"1. Lig"},
  {n:"Bodrumspor FC",  name:"Bodrumspor FC",  pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:63,stad:"Bodrum St.",    city:"Bodrum",    lg:"1. Lig"},
  {n:"Pendikspor FC",  name:"Pendikspor FC",  pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:60,stad:"Pendik Stadyumu",city:"Istanbul", lg:"1. Lig"},
  {n:"Umraniyespor FC",name:"Umraniyespor FC",pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:60,stad:"Umraniye",      city:"Istanbul",  lg:"1. Lig"},
  {n:"Istanbulspor FC",name:"Istanbulspor FC",pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:59,stad:"Necmi Kadioglu",city:"Istanbul",  lg:"1. Lig"},
  {n:"Bursaspor FC",   name:"Bursaspor FC",   pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:59,stad:"Timsah Arena",  city:"Bursa",     lg:"1. Lig"},
  {n:"Manisaspor FC",  name:"Manisaspor FC",  pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:58,stad:"Manisa St.",    city:"Manisa",    lg:"1. Lig"},
  {n:"Erokspor FC",    name:"Erokspor FC",    pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:58,stad:"Esenyurt St.",  city:"Istanbul",  lg:"1. Lig"},
  {n:"Bandirmaspor FC",name:"Bandirmaspor FC",pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:57,stad:"Bandirma",      city:"Bandirma",  lg:"1. Lig"},
  {n:"Igdir FK",       name:"Igdir FK",       pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:57,stad:"Igdir Şehir St.",city:"Igdir",    lg:"1. Lig"},
  {n:"Boluspor FC",    name:"Boluspor FC",    pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:56,stad:"Bolu St.",      city:"Bolu",      lg:"1. Lig"},
  {n:"Vanspor FK",     name:"Vanspor FK",     pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:56,stad:"Van Atatürk St.",city:"Van",      lg:"1. Lig"},
  {n:"Sariyer FC",     name:"Sariyer FC",     pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:55,stad:"Yusuf Ziya Öniş",city:"Istanbul", lg:"1. Lig"},
  {n:"Kecioren FK",    name:"Kecioren FK",    pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:54,stad:"Kecioren St.",  city:"Ankara",    lg:"1. Lig"},
  {n:"Muglaspor FC",   name:"Muglaspor FC",   pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:54,stad:"Muğla St.",     city:"Muğla",     lg:"1. Lig"},
  {n:"Batman Petrol FC",name:"Batman Petrol FC",pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:54,stad:"Batman St.",  city:"Batman",    lg:"1. Lig"},
  // ── İNGİLİZ LİGİ (20 takım, 38 hafta) ─────────────────────────────
  {n:"Eastfield City",    name:"Eastfield City",    pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:92,stad:"Etihad Stadium",city:"Manchester",lg:"İngiliz Ligi"},
  {n:"Northon City",     name:"Northon City",     pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:90,stad:"Emirates St.",  city:"London",    lg:"İngiliz Ligi"},
  {n:"Mersey Reds",   name:"Mersey Reds",   pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:89,stad:"Anfield",       city:"Mersey Reds", lg:"İngiliz Ligi"},
  {n:"Westbridge FC",     name:"Westbridge FC",     pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:85,stad:"Stamford Bridge",city:"London",   lg:"İngiliz Ligi"},
  {n:"Tyneside FC",   name:"Tyneside FC",   pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:82,stad:"St.James Park", city:"Tyneside FC", lg:"İngiliz Ligi"},
  {n:"Midfield Villa", name:"Midfield Villa", pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:81,stad:"Villa Park",    city:"Birmingham",lg:"İngiliz Ligi"},
  {n:"Southgate Hotspur",   name:"Southgate Hotspur",   pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:80,stad:"Spurs Stadium",city:"London",  lg:"İngiliz Ligi"},
  {n:"Redford United",     name:"Redford United",     pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:78,stad:"Old Trafford",  city:"Manchester",lg:"İngiliz Ligi"},
  {n:"Seagulls FC",    name:"Seagulls FC",    pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:76,stad:"Amex Stadium",  city:"Seagulls FC",  lg:"İngiliz Ligi"},
  {n:"Riverside FC",   name:"Riverside FC",   pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:74,stad:"Brentford C.G.",city:"London",   lg:"İngiliz Ligi"},
  {n:"Goodfields FC",     name:"Goodfields FC",     pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:70,stad:"Goodison Park",city:"Mersey Reds",lg:"İngiliz Ligi"},
  {n:"Crystal FC",name:"Crystal FC",pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:67,stad:"Selhurst Park",    city:"London",       lg:"İngiliz Ligi"},
  {n:"Fulham FC",       name:"Fulham FC",       pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:66,stad:"Craven Cottage",     city:"London",       lg:"İngiliz Ligi"},
  {n:"Nottingham FC", name:"Nottingham FC", pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:66,stad:"City Ground",        city:"Nottingham FC",   lg:"İngiliz Ligi"},
  {n:"Bournemouth FC",  name:"Bournemouth FC",  pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:65,stad:"Vitality Stadium",   city:"Bournemouth FC",  lg:"İngiliz Ligi"},
  {n:"Leeds",           name:"Leeds",           pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:67,stad:"Elland Road",        city:"Leeds",        lg:"İngiliz Ligi"},
  {n:"Sunderland",      name:"Sunderland",      pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:66,stad:"Stadium of Light",   city:"Sunderland",   lg:"İngiliz Ligi"},
  {n:"Covenford City",  name:"Covenford City",  pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:64,stad:"Covenford Arena",    city:"Coventry",     lg:"İngiliz Ligi"},
  {n:"Ipsworth Town",   name:"Ipsworth Town",   pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:64,stad:"Portman Lane",       city:"Ipswich",      lg:"İngiliz Ligi"},
  {n:"Humberport City", name:"Humberport City", pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:62,stad:"Humber Stadium",     city:"Hull",         lg:"İngiliz Ligi"},
  // ── İNGİLİZ 2. LİGİ (24 takım, 46 hafta) — 2026/27 ──────────────────
  {n:"East Hammers",   name:"East Hammers",   pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:73,stad:"London Stadium",   city:"London",       lg:"İngiliz 2. Ligi"},
  {n:"Wolverhampton",  name:"Wolverhampton",  pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:71,stad:"Molineux",         city:"Wolverhampton",lg:"İngiliz 2. Ligi"},
  {n:"Burnley FC",     name:"Burnley FC",     pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:69,stad:"Turf Moor",        city:"Burnley",      lg:"İngiliz 2. Ligi"},
  {n:"Southampton FC", name:"Southampton FC", pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:69,stad:"St Mary's",        city:"Southampton",  lg:"İngiliz 2. Ligi"},
  {n:"Sheffield FC",   name:"Sheffield FC",   pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:68,stad:"Bramall Lane",     city:"Sheffield",    lg:"İngiliz 2. Ligi"},
  {n:"Middlesbrough",  name:"Middlesbrough",  pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:68,stad:"Riverside Stadium",city:"Middlesbrough",lg:"İngiliz 2. Ligi"},
  {n:"Norwich FC",     name:"Norwich FC",     pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:67,stad:"Carrow Road",      city:"Norwich",      lg:"İngiliz 2. Ligi"},
  {n:"West Bromford",  name:"West Bromford",  pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:67,stad:"The Hawthorns",    city:"West Bromwich",lg:"İngiliz 2. Ligi"},
  {n:"Birmingham",     name:"Birmingham",     pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:67,stad:"St Andrew's",      city:"Birmingham",   lg:"İngiliz 2. Ligi"},
  {n:"Wrexham FC",     name:"Wrexham FC",     pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:67,stad:"Racecourse Ground",city:"Wrexham",      lg:"İngiliz 2. Ligi"},
  {n:"Watford FC",     name:"Watford FC",     pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:66,stad:"Vicarage Road",    city:"Watford",      lg:"İngiliz 2. Ligi"},
  {n:"Millwall",       name:"Millwall",       pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:66,stad:"The Den",          city:"London",       lg:"İngiliz 2. Ligi"},
  {n:"Bristol FC",     name:"Bristol FC",     pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:66,stad:"Ashton Gate",      city:"Bristol",      lg:"İngiliz 2. Ligi"},
  {n:"Stoke",          name:"Stoke",          pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:66,stad:"bet365 Stadium",   city:"Stoke",        lg:"İngiliz 2. Ligi"},
  {n:"Preston",        name:"Preston",        pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:65,stad:"Deepdale",         city:"Preston",      lg:"İngiliz 2. Ligi"},
  {n:"Swansea",        name:"Swansea",        pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:65,stad:"Swansea.com St.",  city:"Swansea",      lg:"İngiliz 2. Ligi"},
  {n:"QPR",            name:"QPR",            pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:65,stad:"Loftus Road",      city:"London",       lg:"İngiliz 2. Ligi"},
  {n:"Derby FC",       name:"Derby FC",       pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:65,stad:"Pride Park",       city:"Derby",        lg:"İngiliz 2. Ligi"},
  {n:"Blackburn",      name:"Blackburn",      pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:65,stad:"Ewood Park",       city:"Blackburn",    lg:"İngiliz 2. Ligi"},
  {n:"Portsmouth FC",  name:"Portsmouth FC",  pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:64,stad:"Fratton Park",     city:"Portsmouth",   lg:"İngiliz 2. Ligi"},
  {n:"Charlton FC",    name:"Charlton FC",    pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:64,stad:"The Valley",       city:"London",       lg:"İngiliz 2. Ligi"},
  {n:"Cardiff",        name:"Cardiff",        pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:64,stad:"Cardiff City St.", city:"Cardiff",      lg:"İngiliz 2. Ligi"},
  {n:"Bolton FC",      name:"Bolton FC",      pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:64,stad:"Toughsheet Comm.", city:"Bolton",       lg:"İngiliz 2. Ligi"},
  {n:"Lincoln FC",     name:"Lincoln FC",     pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:63,stad:"Sincil Bank",      city:"Lincoln",      lg:"İngiliz 2. Ligi"},
  // ── İSPANYOL LİGİ (20 takım, 38 hafta) ────────────────────────────
  {n:"Real Madreno", name:"Real Madreno", pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:95,stad:"Bernabéu",      city:"Madrid",    lg:"İspanyol Ligi"},
  {n:"FC Cataluña",   name:"FC Cataluña",   pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:92,stad:"Olímpic L.C.",  city:"FC Cataluña", lg:"İspanyol Ligi"},
  {n:"Atletico Madreno",    name:"Atletico Madreno",    pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:86,stad:"Metropolitano", city:"Madrid",    lg:"İspanyol Ligi"},
  {n:"Real Sociedad",    name:"Real Sociedad",    pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:80,stad:"Reale Arena",   city:"San Sebastián",lg:"İspanyol Ligi"},
  {n:"Villareal CF",  name:"Villareal CF",  pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:78,stad:"Estadio Madrigal",city:"Villareal CF",lg:"İspanyol Ligi"},
  {n:"Valencia CF",    name:"Valencia CF",    pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:75,stad:"Mestalla",      city:"Valencia CF",  lg:"İspanyol Ligi"},
  {n:"Real Betis",       name:"Real Betis",       pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:74,stad:"Benito Villamarin",city:"Sevilia FC",lg:"İspanyol Ligi"},
  {n:"Sevilia FC",     name:"Sevilia FC",     pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:73,stad:"Ramón Sánchez",city:"Sevilia FC",    lg:"İspanyol Ligi"},
  {n:"Athletic Club",name:"Athletic Club",pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:72,stad:"San Mames",          city:"Bilbao",       lg:"İspanyol Ligi"},
  {n:"CA Osasuna",      name:"CA Osasuna",      pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:64,stad:"El Sadar",           city:"Pamplona",     lg:"İspanyol Ligi"},
  {n:"Celta Vigo",   name:"Celta Vigo",   pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:64,stad:"Balaidos",           city:"Vigo",         lg:"İspanyol Ligi"},
  {n:"Espanyol",        name:"Espanyol",        pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:64,stad:"RCDE Stadium",       city:"Barcelona",    lg:"İspanyol Ligi"},
  {n:"Rayo Vallecano",name:"Rayo Vallecano",pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:63,stad:"Vallecas",        city:"Madrid",       lg:"İspanyol Ligi"},
  {n:"Getafe CF",       name:"Getafe CF",       pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:62,stad:"Coliseum Alfonso",   city:"Getafe CF",       lg:"İspanyol Ligi"},
  {n:"Elche",           name:"Elche",           pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:62,stad:"Martinez Valero",    city:"Elche",        lg:"İspanyol Ligi"},
  {n:"Levante",         name:"Levante",         pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:61,stad:"Ciutat de Valencia", city:"Valencia",     lg:"İspanyol Ligi"},
  {n:"Real Oviedo",     name:"Real Oviedo",     pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:61,stad:"Carlos Tartiere",    city:"Oviedo",       lg:"İspanyol Ligi"},
  {n:"Deportivo",       name:"Deportivo",       pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:62,stad:"Riazor",             city:"A Coruña",     lg:"İspanyol Ligi"},
  {n:"Racing Santander",name:"Racing Santander",pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:61,stad:"El Sardinero",       city:"Santander",    lg:"İspanyol Ligi"},
  {n:"Malaga CF",       name:"Malaga CF",       pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:61,stad:"La Rosaleda",        city:"Malaga",       lg:"İspanyol Ligi"},
  // ── ALMAN LİGİ (18 takım, 34 hafta) ───────────────────────────────
  {n:"Bayern FC",      name:"Bayern FC",      pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:93,stad:"Allianz Arena", city:"München",   lg:"Alman Ligi"},
  {n:"Leverkusen FC",  name:"Leverkusen FC",  pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:89,stad:"BayArena",      city:"Leverkusen FC",lg:"Alman Ligi"},
  {n:"Dortmund BV",    name:"Dortmund BV",    pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:84,stad:"Signal Iduna",  city:"Dortmund BV",  lg:"Alman Ligi"},
  {n:"Leipzig RB",     name:"Leipzig RB",     pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:83,stad:"Red Bull Arena",city:"Leipzig RB",   lg:"Alman Ligi"},
  {n:"Frankfurt EFC",   name:"Frankfurt EFC",   pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:78,stad:"Deutsche Bank P.",city:"Frankfurt EFC",lg:"Alman Ligi"},
  {n:"Stuttgart VfB",   name:"Stuttgart VfB",   pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:77,stad:"MHPArena",      city:"Stuttgart VfB", lg:"Alman Ligi"},
  {n:"M'gladbach",  name:"M'gladbach",  pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:72,stad:"Borussia-Park", city:"Mönchengladbach",lg:"Alman Ligi"},
  {n:"SC Freiburg",     name:"SC Freiburg",     pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:68,stad:"Europa-Park",        city:"SC Freiburg",     lg:"Alman Ligi"},
  {n:"Berlin Union", name:"Berlin Union", pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:67,stad:"An der Alten Forsterei",city:"Berlin",   lg:"Alman Ligi"},
  {n:"Bremen FC",name:"Bremen FC",pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:66,stad:"Weserstadion",       city:"Bremen",       lg:"Alman Ligi"},
  {n:"FSV Mainz",        name:"FSV Mainz",        pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:65,stad:"Mewa Arena",         city:"FSV Mainz",        lg:"Alman Ligi"},
  {n:"TSG Hoffenheim",   name:"TSG Hoffenheim",   pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:65,stad:"PreZero Arena",      city:"TSG Hoffenheim",   lg:"Alman Ligi"},
  {n:"Hamburger SV",     name:"Hamburger SV",     pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:65,stad:"Volksparkstadion",   city:"Hamburg",      lg:"Alman Ligi"},
  {n:"FC Schalke",       name:"FC Schalke",       pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:64,stad:"Veltins-Arena",      city:"Gelsenkirchen",lg:"Alman Ligi"},
  {n:"Koln",         name:"Koln",         pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:63,stad:"RheinEnergie",       city:"Cologne",      lg:"Alman Ligi"},
  {n:"FC Augsburg",     name:"FC Augsburg",     pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:62,stad:"WWK Arena",          city:"FC Augsburg",     lg:"Alman Ligi"},
  {n:"Paderborn",        name:"Paderborn",        pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:60,stad:"Home Deluxe Arena",  city:"Paderborn",    lg:"Alman Ligi"},
  {n:"SV Elversberg",    name:"SV Elversberg",    pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:60,stad:"Ursapharm-Arena",    city:"Spiesen-Elversberg",lg:"Alman Ligi"},
  // ── İTALYAN LİGİ (20 takım, 38 hafta) ─────────────────────────────
  {n:"FC Internazionale",       name:"FC Internazionale",       pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:91,stad:"San Siro",       city:"Milano",    lg:"İtalyan Ligi"},
  {n:"Juventus FC",    name:"Juventus FC",    pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:86,stad:"Juventus Stadium",city:"Torino FC",   lg:"İtalyan Ligi"},
  {n:"AC Milanese",    name:"AC Milanese",    pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:85,stad:"San Siro",       city:"Milano",    lg:"İtalyan Ligi"},
  {n:"SSC Partenopei",      name:"SSC Partenopei",      pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:84,stad:"Diego Armando Maradona",city:"SSC Partenopei",lg:"İtalyan Ligi"},
  {n:"Atalanta BC B",    name:"Atalanta BC B",    pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:82,stad:"Gewiss Stadium", city:"Bergamo",   lg:"İtalyan Ligi"},
  {n:"AS Romasso",        name:"AS Romasso",        pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:80,stad:"Olimpico",       city:"AS Romasso",      lg:"İtalyan Ligi"},
  {n:"SS Lazione",       name:"SS Lazione",       pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:78,stad:"Olimpico",       city:"AS Romasso",      lg:"İtalyan Ligi"},
  {n:"ACF Fiorentina",  name:"ACF Fiorentina",  pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:75,stad:"Artemio Franchi",city:"Firenze",  lg:"İtalyan Ligi"},
  {n:"Como",            name:"Como",            pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:70,stad:"Sinigaglia",         city:"Como",         lg:"İtalyan Ligi"},
  {n:"Bologna FC",      name:"Bologna FC",      pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:68,stad:"Renato Dall'Ara",    city:"Bologna FC",      lg:"İtalyan Ligi"},
  {n:"Torino FC",       name:"Torino FC",       pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:66,stad:"Olimpico Torino",    city:"Turin",        lg:"İtalyan Ligi"},
  {n:"AC Monza",        name:"AC Monza",        pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:64,stad:"U-Power Stadium",    city:"AC Monza",        lg:"İtalyan Ligi"},
  {n:"US Sassuolo",     name:"US Sassuolo",     pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:64,stad:"Mapei Stadium",      city:"US Sassuolo",     lg:"İtalyan Ligi"},
  {n:"Parma Calcio",    name:"Parma Calcio",    pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:63,stad:"Ennio Tardini",      city:"Parma",        lg:"İtalyan Ligi"},
  {n:"Genoa CFC",        name:"Genoa CFC",        pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:63,stad:"Luigi Ferraris",     city:"Genoa CFC",        lg:"İtalyan Ligi"},
  {n:"Udinese Calcio",      name:"Udinese Calcio",      pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:63,stad:"Friuli",             city:"Udine",        lg:"İtalyan Ligi"},
  {n:"US Lecce",        name:"US Lecce",        pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:62,stad:"Via del Mare",       city:"US Lecce",        lg:"İtalyan Ligi"},
  {n:"Cagliari Calcio",     name:"Cagliari Calcio",     pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:62,stad:"Unipol Domus",       city:"Cagliari Calcio",     lg:"İtalyan Ligi"},
  {n:"Venezia FC",      name:"Venezia FC",      pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:61,stad:"Pier Luigi Penzo",   city:"Venezia",      lg:"İtalyan Ligi"},
  {n:"Frosinone Calcio",    name:"Frosinone Calcio",    pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:60,stad:"Benito Stirpe",      city:"Frosinone Calcio",    lg:"İtalyan Ligi"},
  // ── FRANSIZ LİGİ (18 takım, 34 hafta) ─────────────────────────────
  {n:"Paris SG",         name:"Paris SG",         pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:94,stad:"Parc des Princes",city:"Paris",   lg:"Fransız Ligi"},
  {n:"AS Monaco B",      name:"AS Monaco B",      pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:80,stad:"Stade Louis II", city:"AS Monaco B",    lg:"Fransız Ligi"},
  {n:"OM Marseille",   name:"OM Marseille",   pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:78,stad:"Vélodrome",      city:"OM Marseille", lg:"Fransız Ligi"},
  {n:"OL Lyon",        name:"OL Lyon",        pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:76,stad:"Groupama Stadium",city:"OL Lyon",    lg:"Fransız Ligi"},
  {n:"RC Lens",        name:"RC Lens",        pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:75,stad:"Bollaert-Delelis",city:"RC Lens",    lg:"Fransız Ligi"},
  {n:"LOSC Lille",       name:"LOSC Lille",       pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:74,stad:"Pierre-Mauroy",  city:"LOSC Lille",     lg:"Fransız Ligi"},
  {n:"OGC Nice",        name:"OGC Nice",        pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:72,stad:"Allianz Riviera",city:"OGC Nice",     lg:"Fransız Ligi"},
  {n:"Stade Rennais",       name:"Stade Rennais",       pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:68,stad:"Roazhon Park",       city:"Stade Rennais",       lg:"Fransız Ligi"},
  {n:"Brest",        name:"Brest",        pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:65,stad:"Francis-Le Ble",     city:"Brest",        lg:"Fransız Ligi"},
  {n:"Toulouse FC",     name:"Toulouse FC",     pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:64,stad:"Stadium Toulouse",   city:"Toulouse FC",     lg:"Fransız Ligi"},
  {n:"Paris FC",        name:"Paris FC",        pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:64,stad:"Stade Jean-Bouin",   city:"Paris",        lg:"Fransız Ligi"},
  {n:"RC Strasbourg",   name:"RC Strasbourg",   pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:63,stad:"Meinau",             city:"RC Strasbourg",   lg:"Fransız Ligi"},
  {n:"AJ Auxerre",      name:"AJ Auxerre",      pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:62,stad:"Abbe-Deschamps",     city:"Auxerre",      lg:"Fransız Ligi"},
  {n:"Le Havre",     name:"Le Havre",     pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:62,stad:"Oceane",             city:"Le Havre",     lg:"Fransız Ligi"},
  {n:"FC Lorient",      name:"FC Lorient",      pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:62,stad:"Moustoir",           city:"FC Lorient",      lg:"Fransız Ligi"},
  {n:"Angers SCO",      name:"Angers SCO",      pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:61,stad:"Raymond-Kopa",       city:"Angers",       lg:"Fransız Ligi"},
  {n:"Troyes",          name:"Troyes",          pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:60,stad:"Stade de l'Aube",    city:"Troyes",       lg:"Fransız Ligi"},
  {n:"Le Mans FC",      name:"Le Mans FC",      pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:59,stad:"MMArena",            city:"Le Mans",      lg:"Fransız Ligi"},
  // ── PORTEKİZ LİGİ (18 takım, 34 hafta) ────────────────────────────
  {n:"SL Benfica",      name:"SL Benfica",      pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:84,stad:"Estadio da Luz",     city:"Lisbon",      lg:"Portekiz Ligi"},
  {n:"FC Porto",        name:"FC Porto",        pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:83,stad:"Estadio do Dragao",  city:"FC Porto",       lg:"Portekiz Ligi"},
  {n:"Sporting CP",  name:"Sporting CP",  pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:82,stad:"Alvalade",          city:"Lisbon",      lg:"Portekiz Ligi"},
  {n:"SC Braga",        name:"SC Braga",        pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:74,stad:"Estadio Municipal", city:"SC Braga",       lg:"Portekiz Ligi"},
  {n:"Vitoria SC",   name:"Vitoria SC",   pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:67,stad:"Afonso Henriques",  city:"Guimaraes",   lg:"Portekiz Ligi"},
  {n:"Casa Pia",     name:"Casa Pia",     pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:65,stad:"Pina Manique",      city:"Lisbon",      lg:"Portekiz Ligi"},
  {n:"Rio Ave",      name:"Rio Ave",      pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:64,stad:"Arcos",             city:"Vila do Conde",lg:"Portekiz Ligi"},
  {n:"Famalicao",    name:"Famalicao",    pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:63,stad:"Municipal",         city:"Famalicao",   lg:"Portekiz Ligi"},
  {n:"Estoril",      name:"Estoril",      pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:62,stad:"Antonio Coimbra",   city:"Estoril",     lg:"Portekiz Ligi"},
  {n:"Santa Clara",  name:"Santa Clara",  pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:62,stad:"Sao Miguel",        city:"Ponta Delgada",lg:"Portekiz Ligi"},
  {n:"Gil Vicente",  name:"Gil Vicente",  pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:62,stad:"Cidade de Barcelos",city:"Barcelos",    lg:"Portekiz Ligi"},
  {n:"Arouca",       name:"Arouca",       pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:61,stad:"Municipal de Arouca",city:"Arouca",     lg:"Portekiz Ligi"},
  {n:"Moreirense",   name:"Moreirense",   pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:61,stad:"Comunitario",       city:"Moreira",     lg:"Portekiz Ligi"},
  {n:"CD Nacional",  name:"CD Nacional",  pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:61,stad:"Madeira",           city:"Funchal",     lg:"Portekiz Ligi"},
  {n:"CS Maritimo",  name:"CS Maritimo",  pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:61,stad:"Barreiros",         city:"Funchal",     lg:"Portekiz Ligi"},
  {n:"Estrela Amadora",name:"Estrela Amadora",pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:60,stad:"Jose Gomes",   city:"Amadora",     lg:"Portekiz Ligi"},
  {n:"FC Alverca",   name:"FC Alverca",   pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:60,stad:"Complexo do FC Alverca",city:"Alverca",lg:"Portekiz Ligi"},
  {n:"Academico Viseu",name:"Academico Viseu",pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:59,stad:"Fontelo",      city:"Viseu",       lg:"Portekiz Ligi"},
  // ── HOLLANDA LİGİ (18 takım, 34 hafta) ────────────────────────────
  {n:"PSV Eindhoven",          name:"PSV Eindhoven",          pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:86,stad:"Philips Stadion",   city:"Eindhoven",   lg:"Hollanda Ligi"},
  {n:"AFC Ajax",         name:"AFC Ajax",         pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:83,stad:"Johan Cruyff Arena",city:"Amsterdam",   lg:"Hollanda Ligi"},
  {n:"Feyenoord",    name:"Feyenoord",    pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:82,stad:"De Kuip",          city:"Rotterdam",   lg:"Hollanda Ligi"},
  {n:"AZ Alkmaar",   name:"AZ Alkmaar",   pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:76,stad:"AFAS Stadion",     city:"Alkmaar",     lg:"Hollanda Ligi"},
  {n:"FC Twente",       name:"FC Twente",       pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:73,stad:"De Grolsch Veste", city:"Enschede",    lg:"Hollanda Ligi"},
  {n:"FC Utrecht",      name:"FC Utrecht",      pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:72,stad:"Galgenwaard",      city:"FC Utrecht",     lg:"Hollanda Ligi"},
  {n:"Heerenveen",   name:"Heerenveen",   pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:65,stad:"Abe Lenstra",      city:"Heerenveen",  lg:"Hollanda Ligi"},
  {n:"Groningen",    name:"Groningen",    pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:64,stad:"Euroborg",         city:"Groningen",   lg:"Hollanda Ligi"},
  {n:"NEC Nijmegen", name:"NEC Nijmegen", pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:64,stad:"Goffert",         city:"Nijmegen",    lg:"Hollanda Ligi"},
  {n:"Sparta Rotterdam",name:"Sparta Rotterdam",pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:63,stad:"Het Kasteel",city:"Rotterdam",  lg:"Hollanda Ligi"},
  {n:"Go Ahead Eagles",name:"Go Ahead Eagles",pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:62,stad:"De Adelaarshorst",city:"Deventer",lg:"Hollanda Ligi"},
  {n:"Fortuna Sittard",name:"Fortuna Sittard",pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:62,stad:"Fortuna Sittard Stadion",city:"Sittard",lg:"Hollanda Ligi"},
  {n:"Zwolle",       name:"Zwolle",       pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:61,stad:"MAC3PARK",        city:"Zwolle",      lg:"Hollanda Ligi"},
  {n:"ADO Den Haag", name:"ADO Den Haag", pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:61,stad:"Bingoal Stadion",  city:"Den Haag",    lg:"Hollanda Ligi"},
  {n:"Excelsior",    name:"Excelsior",    pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:60,stad:"Van Donge & De Roo",city:"Rotterdam",  lg:"Hollanda Ligi"},
  {n:"SC Cambuur",   name:"SC Cambuur",   pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:60,stad:"Kooi Stadion",     city:"Leeuwarden",  lg:"Hollanda Ligi"},
  {n:"Willem II",    name:"Willem II",    pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:60,stad:"Koning Willem II", city:"Tilburg",     lg:"Hollanda Ligi"},
  {n:"Telstar",      name:"Telstar",      pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:58,stad:"BUKO Stadion",     city:"Velsen",      lg:"Hollanda Ligi"},
];

const MONTHS=["Şubat","Mart","Nisan","Mayıs"];
// ── Çift devreli round-robin fikstür üreticisi ─────────────────
// Her rakiple 1. devrde 1 maç (ev/dep), 2. devrde tam tersi
// Berger algoritması (standart round-robin yönlendirme)
const buildDoubleRoundRobin=(teams, comp, months, startW=1)=>{
  const n=teams.length; // rakip sayısı (biz dahil değil)
  // Berger tablosu: n+1 takım (biz = takım 0, rakipler 1..n)
  // Tur sayısı = n (çift sayı için), sonra deplasman tersle
  const slots=[...Array(n+1).keys()]; // 0=biz, 1..n=rakipler
  const rounds=[];
  const arr=[...slots];
  for(let r=0;r<n;r++){
    // Haftadaki ev/dep: r çift → takım 0 evde, r tek → deplasman
    const homeFirst=(r%2===0);
    // Takım 0 ile karşılaşan: arr[n] (sabit döndürme noktasına göre)
    const opp=arr[n]; // son eleman sabit değil, Berger'de [n] sabit olur
    // Gerçek Berger: ilk eleman sabit (0), kalanlar döner
    rounds.push({r,home:homeFirst,opp:arr[arr.length-1]});
    // Döndür: arr[1..n] sağa bir kaydır, arr[0] sabit
    const last=arr[arr.length-1];
    for(let i=arr.length-1;i>1;i--) arr[i]=arr[i-1];
    arr[1]=last;
  }
  // Aylara dağıt
  const mo=months&&months.length>0?months:["Eylul","Ekim","Kasim","Aralik","Ocak","Subat","Mart","Nisan","Mayis"];
  const perMonth=Math.ceil(n/mo.length);
  const fixtures=[];
  let w=startW;
  rounds.forEach((rd,i)=>{
    const month=mo[Math.min(Math.floor(i/perMonth),mo.length-1)];
    const opp=teams[rd.opp-1]; // rakip objesi
    fixtures.push({w:w++,opp:opp.n,home:rd.home,str:opp.str,month,comp});
  });
  // 2. devre: ev/dep tersle
  rounds.forEach((rd,i)=>{
    const month=mo[Math.min(mo.length-Math.ceil(n/mo.length)+Math.floor(i/perMonth),mo.length-1)];
    const opp=teams[rd.opp-1];
    fixtures.push({w:w++,opp:opp.n,home:!rd.home,str:opp.str,month,comp});
  });
  return fixtures;
};

// 1. Lig rakipleri (2026/27 — 19 rakip → 38 maç)
const TFF1_RIVALS=[
  {n:"Kayserispor FC",   str:62},{n:"Antalyaspor FC",   str:61},{n:"Karagumruk FC",    str:62},
  {n:"Sivasspor FC",     str:60},{n:"Bodrumspor FC",    str:63},{n:"Pendikspor FC",    str:60},
  {n:"Umraniyespor FC",  str:60},{n:"Istanbulspor FC",  str:59},{n:"Bursaspor FC",     str:59},
  {n:"Manisaspor FC",    str:58},{n:"Erokspor FC",      str:58},{n:"Bandirmaspor FC",  str:57},
  {n:"Igdir FK",         str:57},{n:"Boluspor FC",      str:56},{n:"Vanspor FK",       str:56},
  {n:"Sariyer FC",       str:55},{n:"Kecioren FK",      str:54},{n:"Muglaspor FC",     str:54},
  {n:"Batman Petrol FC", str:54},
  {n:"Sakaryaspor FC",   str:57}, // Yedek: kullanıcı bir 1. Lig takımını seçerse 19. rakip
];
// Elit Lig rakipleri (2026/27 — 18 takım; kullanıcı hariç 17 rakip → 34 maç)
const SL_RIVALS=[
  {n:"Galatasaray FC",   str:88},{n:"Fenerbahce FC",    str:86},{n:"Besiktas FC",      str:78},
  {n:"Trabzonspor FC",   str:76},{n:"Basaksehir FC",    str:74},{n:"Eyupspor FC",      str:68},
  {n:"Goztepe FC",       str:66},{n:"Konyaspor FC",     str:63},{n:"Alanyaspor FC",    str:64},
  {n:"Samsunspor FC",    str:61},{n:"Kasimpasa FC",     str:62},{n:"Genclerbirligi FC",str:62},
  {n:"Gaziantepspor FC", str:60},{n:"Rizespor FC",      str:60},{n:"Kocaelispor FC",   str:60},
  {n:"Amed Sportif FC",  str:60},{n:"Erzurumspor FC",   str:59},{n:"Corum FK",         str:58},
];

const TFF1_MONTHS=["Agustos","Agustos","Agustos","Eylul","Eylul","Eylul","Ekim","Ekim","Ekim","Kasim","Kasim","Kasim","Aralik","Aralik","Aralik","Aralik","Aralik","Ocak","Ocak","Ocak","Ocak","Subat","Subat","Subat","Subat","Mart","Mart","Mart","Mart","Nisan","Nisan","Nisan","Nisan","Mayis","Mayis","Mayis","Mayis","Mayis"];
// Gerçek SL takvimi: 34 maça birebir ay ataması
const SL_MONTHS_LIST=[
  "Agustos","Agustos","Agustos",          // H1-3
  "Eylul","Eylul","Eylul",                // H4-6
  "Ekim","Ekim","Ekim",                   // H7-9
  "Kasim","Kasim","Kasim",                // H10-12
  "Aralik","Aralik","Aralik",             // H13-15
  "Ocak","Ocak","Ocak",                   // H16-18
  "Subat","Subat","Subat",                // H19-21
  "Mart","Mart","Mart","Mart",            // H22-25 (Mart biraz dolu)
  "Nisan","Nisan","Nisan","Nisan",        // H26-29
  "Mayis","Mayis","Mayis","Mayis","Mayis" // H30-34
];
const SL_MONTHS  =["Agustos","Agustos","Agustos","Eylul","Eylul","Eylul","Ekim","Ekim","Ekim","Kasim","Kasim","Kasim","Aralik","Aralik","Aralik","Ocak","Ocak","Ocak","Subat","Subat","Subat","Mart","Mart","Mart","Mart","Nisan","Nisan","Nisan","Nisan","Mayis","Mayis","Mayis","Mayis","Mayis"];
// ─────────────────────────────────────────────────────────────────────
// PRIMEIRA LIGA (18 takım, 34 maç)
// ─────────────────────────────────────────────────────────────────────
const PRIMEIRA_RIVALS=[
  {n:"SL Benfica",    str:84},{n:"FC Porto",       str:83},{n:"Sporting CP", str:82},
  {n:"SC Braga",      str:74},{n:"Vitoria SC",     str:67},{n:"Casa Pia",    str:65},
  {n:"Rio Ave",       str:64},{n:"Famalicao",      str:63},{n:"Santa Clara", str:62},
  {n:"Estoril",       str:62},{n:"Gil Vicente",    str:62},{n:"Arouca",      str:61},
  {n:"Moreirense",    str:61},{n:"CD Nacional",    str:61},{n:"CS Maritimo", str:61},
  {n:"Estrela Amadora",str:60},{n:"FC Alverca",    str:60},{n:"Academico Viseu",str:59},
];
const PRIMEIRA_MONTHS=["Agustos","Agustos","Agustos","Eylul","Eylul","Eylul","Ekim","Ekim","Ekim","Kasim","Kasim","Kasim","Aralik","Aralik","Aralik","Ocak","Ocak","Subat","Subat","Subat","Mart","Mart","Mart","Mart","Nisan","Nisan","Nisan","Nisan","Mayis","Mayis","Mayis","Mayis","Mayis","Mayis"];
const buildPrimeiraFixture=(excludeName="")=>{
  const shuffle=(a)=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
  const rivals=PRIMEIRA_RIVALS.filter(r=>r.n!==excludeName).slice(0,17);
  const n=rivals.length;
  const firstHalf=shuffle(rivals.map((opp,i)=>({opp,home:i%2===0})));
  const secondHalf=firstHalf.map(rd=>({opp:rd.opp,home:!rd.home}));
  const fix=[];let w=1;
  firstHalf.forEach((rd,i)=>fix.push({w:w++,opp:rd.opp.n,home:rd.home,str:rd.opp.str,month:PRIMEIRA_MONTHS[i]||"Mayis",comp:"Portekiz Ligi"}));
  secondHalf.forEach((rd,i)=>fix.push({w:w++,opp:rd.opp.n,home:rd.home,str:rd.opp.str,month:PRIMEIRA_MONTHS[n+i]||"Mayis",comp:"Portekiz Ligi"}));
  return fix;
};
const INIT_PRESEASON_PRIMEIRA=[
  {w:0,opp:"Estoril",   home:true, str:62,month:"Temmuz",comp:"HAZ",round:"Hazırlık"},
  {w:0,opp:"Chaves",    home:false,str:60,month:"Temmuz",comp:"HAZ",round:"Hazırlık"},
  {w:0,opp:"Portimonense",home:true,str:60,month:"Temmuz",comp:"HAZ",round:"Hazırlık"},
];

// ─────────────────────────────────────────────────────────────────────
// EREDİVİSİE (18 takım, 34 maç)
// ─────────────────────────────────────────────────────────────────────
const EREDIVISIE_RIVALS=[
  {n:"PSV Eindhoven", str:86},{n:"AFC Ajax",       str:83},{n:"Feyenoord",    str:82},
  {n:"AZ Alkmaar",    str:76},{n:"FC Twente",      str:73},{n:"FC Utrecht",   str:72},
  {n:"Heerenveen",    str:65},{n:"Groningen",      str:64},{n:"NEC Nijmegen", str:64},
  {n:"Sparta Rotterdam",str:63},{n:"Go Ahead Eagles",str:62},{n:"Fortuna Sittard",str:62},
  {n:"Zwolle",        str:61},{n:"ADO Den Haag",   str:61},{n:"Excelsior",    str:60},
  {n:"SC Cambuur",    str:60},{n:"Willem II",      str:60},{n:"Telstar",      str:58},
];
const EREDIVISIE_MONTHS=["Agustos","Agustos","Agustos","Eylul","Eylul","Eylul","Ekim","Ekim","Ekim","Kasim","Kasim","Kasim","Aralik","Aralik","Aralik","Ocak","Ocak","Subat","Subat","Subat","Mart","Mart","Mart","Mart","Nisan","Nisan","Nisan","Nisan","Mayis","Mayis","Mayis","Mayis","Mayis","Mayis"];
const buildEredivisieFixture=(excludeName="")=>{
  const shuffle=(a)=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
  const rivals=EREDIVISIE_RIVALS.filter(r=>r.n!==excludeName).slice(0,17);
  const n=rivals.length;
  const firstHalf=shuffle(rivals.map((opp,i)=>({opp,home:i%2===0})));
  const secondHalf=firstHalf.map(rd=>({opp:rd.opp,home:!rd.home}));
  const fix=[];let w=1;
  firstHalf.forEach((rd,i)=>fix.push({w:w++,opp:rd.opp.n,home:rd.home,str:rd.opp.str,month:EREDIVISIE_MONTHS[i]||"Mayis",comp:"Hollanda Ligi"}));
  secondHalf.forEach((rd,i)=>fix.push({w:w++,opp:rd.opp.n,home:rd.home,str:rd.opp.str,month:EREDIVISIE_MONTHS[n+i]||"Mayis",comp:"Hollanda Ligi"}));
  return fix;
};
const INIT_PRESEASON_EREDIVISIE=[
  {w:0,opp:"Zwolle",    home:true, str:61,month:"Temmuz",comp:"HAZ",round:"Hazırlık"},
  {w:0,opp:"Emmen",     home:false,str:59,month:"Temmuz",comp:"HAZ",round:"Hazırlık"},
  {w:0,opp:"RKC Waalwijk",home:true,str:60,month:"Temmuz",comp:"HAZ",round:"Hazırlık"},
];


// TFF1_MONTHS artık 38 elemanlı — her hafta için doğrudan ay bilgisi içerir
// Gerçek TFF takvimi: Ağu×3, Eyl×3, Eki×3, Kas×3, Ara×5, Oca×4, Şub×4, Mar×4, Nis×4, May×5
const buildTFF1Fixture=(excludeName="")=>{
  const shuffle=(a)=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
  const rivals=TFF1_RIVALS.filter(r=>r.n!==excludeName).slice(0,19);
  const n=rivals.length; // her zaman 19
  // 1. devre: rastgele sıra, ev/dep dönüşümlü
  const firstHalf=shuffle(rivals.map((opp,i)=>({opp,home:i%2===0})));
  // 2. devre: 1. devrenin AYNI SIRASI, sadece ev/dep ters (shuffle YOK)
  const secondHalf=firstHalf.map(rd=>({opp:rd.opp,home:!rd.home}));
  const mo=TFF1_MONTHS; // 38 elemanlı — index=hafta sırası
  const fix=[];
  let w=1;
  // 1. Devre: index 0-18
  firstHalf.forEach((rd,i)=>{
    fix.push({w:w++,opp:rd.opp.n,home:rd.home,str:rd.opp.str,month:mo[i],comp:"TFF1"});
  });
  // 2. Devre: index 19-37
  secondHalf.forEach((rd,i)=>{
    fix.push({w:w++,opp:rd.opp.n,home:rd.home,str:rd.opp.str,month:mo[n+i],comp:"TFF1"});
  });
  return fix;
};
const INIT_FIXTURE_TFF1=buildTFF1Fixture();

const buildSLFixture=(excludeName="")=>{
  const shuffle=(a)=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
  const rivals=SL_RIVALS.filter(r=>r.n!==excludeName).slice(0,17);
  const n=rivals.length; // her zaman 17
  const firstHalf=shuffle(rivals.map((opp,i)=>({opp,home:i%2===0})));
  // 2. devre: 1. devrenin AYNI SIRASI, sadece ev/dep ters (shuffle YOK)
  const secondHalf=firstHalf.map(rd=>({opp:rd.opp,home:!rd.home}));
  const fix=[];
  let w=1;
  firstHalf.forEach((rd,i)=>{
    fix.push({w:w++,opp:rd.opp.n,home:rd.home,str:rd.opp.str,month:SL_MONTHS[i]||"Mayis",comp:"SL"});
  });
  secondHalf.forEach((rd,i)=>{
    fix.push({w:w++,opp:rd.opp.n,home:rd.home,str:rd.opp.str,month:SL_MONTHS[n+i]||"Mayis",comp:"SL"});
  });
  return fix;
};
const INIT_FIXTURE_SL=buildSLFixture();

// İngiliz 2. Ligi (Championship) takvimi: 46 hafta
// Ağu×4, Eyl×4, Eki×5, Kas×4, Ara×6, Oca×4, Şub×5, Mar×5, Nis×5, May×4
const CH_MONTHS=[
  "Agustos","Agustos","Agustos","Agustos",
  "Eylul","Eylul","Eylul","Eylul",
  "Ekim","Ekim","Ekim","Ekim","Ekim",
  "Kasim","Kasim","Kasim","Kasim",
  "Aralik","Aralik","Aralik","Aralik","Aralik","Aralik",
  "Ocak","Ocak","Ocak","Ocak",
  "Subat","Subat","Subat","Subat","Subat",
  "Mart","Mart","Mart","Mart","Mart",
  "Nisan","Nisan","Nisan","Nisan","Nisan",
  "Mayis","Mayis","Mayis","Mayis"
];

// Büyük 5 lig (+ İngiliz 2. Ligi) fikstürü — o ligin rakiplerini kullanır
// teamsOverride: sezonlar arası terfi/düşme sonrası güncel takım listesi (verilmezse INIT_TEAMS)
const buildBig5Fixture=(lg,excludeName="",teamsOverride=null)=>{
  const shuffle=(a)=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
  const LIG_MONTHS={
    "İngiliz Ligi": TFF1_MONTHS, // 38 hafta
    "İspanyol Ligi":TFF1_MONTHS, // 38 hafta
    "İtalyan Ligi": TFF1_MONTHS, // 38 hafta
    "Fransız Ligi": SL_MONTHS,   // 34 hafta
    "Alman Ligi":   SL_MONTHS,   // 34 hafta
    "İngiliz 2. Ligi":CH_MONTHS, // 46 hafta
  };
  const mo=LIG_MONTHS[lg]||TFF1_MONTHS;
  const rivals=(teamsOverride||INIT_TEAMS).filter(t=>t.lg===lg&&!t.me&&t.n!==excludeName);
  if(rivals.length===0) return buildTFF1Fixture(excludeName).map(f=>({...f,comp:lg}));
  const n=rivals.length;
  const firstHalf=shuffle(rivals.map((opp,i)=>({opp,home:i%2===0})));
  const secondHalf=firstHalf.map(rd=>({opp:rd.opp,home:!rd.home}));
  const fix=[];
  let w=1;
  firstHalf.forEach((rd,i)=>{
    fix.push({w:w++,opp:rd.opp.n,home:rd.home,str:rd.opp.str,month:mo[i]||"Mayis",comp:lg});
  });
  secondHalf.forEach((rd,i)=>{
    fix.push({w:w++,opp:rd.opp.n,home:rd.home,str:rd.opp.str,month:mo[n+i]||"Mayis",comp:lg});
  });
  return fix;
};

// İngiliz 2. Ligi (24 takım): kullanıcı hariç 23 rakip → 46 hafta
const buildChampionshipFixture=(excludeName="",teamsOverride=null)=>buildBig5Fixture("İngiliz 2. Ligi",excludeName,teamsOverride);

// Hazırlık maçları (sezon öncesi — Temmuz)
const INIT_PRESEASON_TFF1=[
  {w:0, opp:"Ankaragucu FC",   home:true, str:62,month:"Temmuz",comp:"HAZ", round:"Hazırlık"},
  {w:0, opp:"Altay FC",        home:false,str:58,month:"Temmuz",comp:"HAZ", round:"Hazırlık"},
  {w:0, opp:"Eskisehirspor",home:true, str:54,month:"Temmuz",comp:"HAZ", round:"Hazırlık"},
];
const INIT_PRESEASON_SL=[
  {w:0, opp:"Rizespor FC",     home:true, str:60,month:"Temmuz",comp:"HAZ", round:"Hazırlık"},
  {w:0, opp:"Konyaspor FC",    home:false,str:65,month:"Temmuz",comp:"HAZ", round:"Hazırlık"},
  {w:0, opp:"Alanyaspor FC",   home:true, str:62,month:"Temmuz",comp:"HAZ", round:"Hazırlık"},
];

// Ulusal Kupa fikstürü (her iki ligde de oynanır)
// 1. Lig takımı için kupa rakipleri: Elit Lig takımları
const TFF1_KUPA_OPPS=[
  {n:"Konyaspor FC",str:63},{n:"Alanyaspor FC",str:62},{n:"Rizespor FC",str:60},
  {n:"Kasimpasa FC",str:62},{n:"Gaziantepspor FC",str:60},{n:"Genclerbirligi FC",str:62},
  {n:"Kocaelispor FC",str:60},{n:"Erzurumspor FC",str:59},{n:"Amed Sportif FC",str:60},
  {n:"Corum FK",str:58},{n:"Samsunspor FC",str:61},{n:"Goztepe FC",str:66},
];
// Elit Lig takımı için kupa rakipleri: 1. Lig takımları
const SL_KUPA_OPPS=[
  {n:"Kayserispor FC",str:62},{n:"Antalyaspor FC",str:61},{n:"Sivasspor FC",str:60},
  {n:"Karagumruk FC",str:62},{n:"Bodrumspor FC",str:63},{n:"Pendikspor FC",str:60},
  {n:"Istanbulspor FC",str:59},{n:"Bursaspor FC",str:59},{n:"Umraniyespor FC",str:60},
  {n:"Manisaspor FC",str:58},{n:"Bandirmaspor FC",str:57},{n:"Igdir FK",str:57},
];
// Sezona özgü deterministik karıştırma — aynı sezonda tutarlı ama her sezonda farklı
const shuffleKupaPool=(pool,excludeName,seed)=>{
  const filtered=pool.filter(o=>o.n!==excludeName);
  // Fisher-Yates ile seed tabanlı karıştır
  const arr=[...filtered];
  for(let i=arr.length-1;i>0;i--){
    const j=((seed*1664525+i*22695477+1013904223)>>>0)%(i+1);
    [arr[i],arr[j]]=[arr[j],arr[i]];
  }
  return arr;
};
const buildKupaTFF1=(excludeName="",seasonSeed=1)=>{
  const pool=shuffleKupaPool(TFF1_KUPA_OPPS,excludeName,seasonSeed);
  const opps=[pool[0],pool[1],pool[2]];
  // Grup harfini de seed'e göre belirle
  const grupHarf=String.fromCharCode(65+((seasonSeed*7+3)%8)); // A-H arası
  return[
    {w: 75,opp:opps[0].n,home:true, str:opps[0].str,month:"Ekim",  comp:"ZTK",round:`Grup ${grupHarf}`},
    {w:105,opp:opps[1].n,home:false,str:opps[1].str,month:"Kasim", comp:"ZTK",round:`Grup ${grupHarf}`},
    {w:135,opp:opps[2].n,home:true, str:opps[2].str,month:"Aralik",comp:"ZTK",round:`Grup ${grupHarf}`},
    {w:185,opp:opps[0].n,home:false,str:opps[0].str,month:"Ocak",  comp:"ZTK",round:`Grup ${grupHarf}`},
    {w:190,opp:opps[1].n,home:true, str:opps[1].str,month:"Ocak",  comp:"ZTK",round:`Grup ${grupHarf}`},
    {w:2050,opp:opps[2].n,home:false,str:opps[2].str,month:"Subat", comp:"ZTK",round:`Grup ${grupHarf}`},
  ];
};
const buildKupaSL=(excludeName="",seasonSeed=1)=>{
  const pool=shuffleKupaPool(SL_KUPA_OPPS,excludeName,seasonSeed);
  const opps=[pool[0],pool[1],pool[2]];
  const grupHarf=String.fromCharCode(65+((seasonSeed*7+3)%8));
  return[
    {w: 75,opp:opps[0].n,home:true, str:opps[0].str,month:"Ekim",  comp:"ZTK",round:`Grup ${grupHarf}`},
    {w:105,opp:opps[1].n,home:false,str:opps[1].str,month:"Kasim", comp:"ZTK",round:`Grup ${grupHarf}`},
    {w:135,opp:opps[2].n,home:true, str:opps[2].str,month:"Aralik",comp:"ZTK",round:`Grup ${grupHarf}`},
    {w:165,opp:opps[0].n,home:false,str:opps[0].str,month:"Ocak",  comp:"ZTK",round:`Grup ${grupHarf}`},
    {w:175,opp:opps[1].n,home:true, str:opps[1].str,month:"Ocak",  comp:"ZTK",round:`Grup ${grupHarf}`},
    {w:2050,opp:opps[2].n,home:false,str:opps[2].str,month:"Subat", comp:"ZTK",round:`Grup ${grupHarf}`},
  ];
};
const INIT_KUPA_TFF1=buildKupaTFF1();
const INIT_KUPA_SL=buildKupaSL();
// ── FİKSTÜR SIRALAMA YARDIMCISI ──────────────────────────────
// Kupa/Avrupa maçlarını aynı aydaki lig haftaları ARASINA dağıtır.
// Her çağrı için fixture array'i alır, doğru sırayla döner.
const FIXTURE_MONTH_ORDER=["Temmuz","Agustos","Eylul","Ekim","Kasim","Aralik","Ocak","Subat","Mart","Nisan","Mayis","Haziran"];
const sortFixture=(fixtures)=>{
  // Sıralama: önce ay, sonra w değeri (lig=1-38, Kupa=101-106/251-332, AL/ASK=200-302)
  // Her turnuvanın w değeri zaten doğru kronolojik sırayı temsil ediyor
  // Kupa maçlarını lig haftaları arasına yerleştirmek için w'yi normalize et
  const MO=["Temmuz","Agustos","Eylul","Ekim","Kasim","Aralik","Ocak","Subat","Mart","Nisan","Mayis","Haziran"];
  const mo=(m)=>{const i=MO.indexOf(m);return i===-1?99:i;};
  // Ay içindeki lig haftalarını topla
  const monthLigW={};
  fixtures.forEach(f=>{
    if(f.comp==="HAZ"||f.comp==="ZTK"||f.comp==="CL"||f.comp==="UEFA"||f.comp==="CON"||f.comp==="SUPERKUPA") return;
    const m=f.month||"";
    if(!monthLigW[m]) monthLigW[m]=[];
    monthLigW[m].push(f.w||0);
  });
  Object.keys(monthLigW).forEach(m=>monthLigW[m].sort((a,b)=>a-b));
  // Ay içindeki kupa maçlarını w'ye göre sırala, sonra lig haftaları arasına dağıt
  const monthCupW={};
  fixtures.forEach(f=>{
    if(f.comp!=="ZTK"&&f.comp!=="CL"&&f.comp!=="UEFA"&&f.comp!=="CON"&&f.comp!=="SUPERKUPA") return;
    const m=f.month||"";
    if(!monthCupW[m]) monthCupW[m]=[];
    monthCupW[m].push(f.w||0);
  });
  Object.keys(monthCupW).forEach(m=>monthCupW[m].sort((a,b)=>a-b));
  // FIX: Her kupa/euro maçına benzersiz sıra numarası ata.
  // cupWs.indexOf(rawW) aynı w değerine sahip 2 maç için hep aynı index'i döndürürdü;
  // bu da her ikisinin aynı effectiveW'ye düşmesine ve ay başında birden simüle edilmesine yol açıyordu.
  const monthCupCounter={};
  const fixCupIdx=new Map();
  fixtures.forEach(f=>{
    if(f.comp!=="ZTK"&&f.comp!=="CL"&&f.comp!=="UEFA"&&f.comp!=="CON"&&f.comp!=="SUPERKUPA") return;
    if((f.w||0)>=1000) return; // w>=1000 doğrudan konumlanır — slot sayacını kaydırmasın (Avrupa/ZTK çakışması)
    const m=f.month||"";
    if(monthCupCounter[m]===undefined) monthCupCounter[m]=0;
    fixCupIdx.set(f, monthCupCounter[m]++);
  });
  const effectiveW=(f)=>{
    if(f.comp==="HAZ") return (f.w||0)===0?-1:(f.w||0);
    if(f.comp==="ZTK"||f.comp==="CL"||f.comp==="UEFA"||f.comp==="CON"||f.comp==="SUPERKUPA"){
      const m=f.month||"";
      const ligWs=monthLigW[m]||[];
      const rawW=f.w||0;
      // w >= 1000: gerçek hafta pozisyonu — w/100 ile lig haftaları arasına girer
      // Örn: w:2230 → 22.30 → lig w:22 ile w:23 arasına düşer ✅
      if(rawW>=1000) return rawW/100;
      // <1000: slot bazlı dağıtım (eski maçlar için fallback)
      const idx=fixCupIdx.has(f)?fixCupIdx.get(f):0;
      const slots=ligWs.length+1;
      if(ligWs.length===0) return 50+idx*3;
      const slotIdx=Math.min(idx, ligWs.length);
      if(slotIdx===0) return ligWs[0]-0.5-(slots-1-idx)*0.1;
      if(slotIdx>=ligWs.length) return ligWs[ligWs.length-1]+0.5+(idx-ligWs.length+1)*0.1;
      return ligWs[slotIdx-1]+(ligWs[slotIdx]-ligWs[slotIdx-1])*((idx%slots+1)/(slots+1));
    }
    return f.w||0;
  };
  return [...fixtures].sort((a,b)=>{
    const ma=mo(a.month||"");
    const mb=mo(b.month||"");
    if(ma!==mb) return ma-mb;
    return effectiveW(a)-effectiveW(b);
  });
};


// ── Pozisyon ceza kuralları (global utility) ──────────────────
// Dönüş: 0 = tam uyum, -5 = yan ceza, -99 = oynayamaz
const posPenalty=(playerPos,slotPos)=>{
  if(playerPos===slotPos) return 0;
  if(playerPos==="GK"||slotPos==="GK") return -99;
  // GK hariç tüm pozisyonlar için esnek kural seti
  const DEF=["CB","LB","RB"];
  const MID=["CM","LM","RM","CAM","CDM"];
  const ATT=["ST","CAM","LM","RM"]; // geniş hücum grubu
  // Kanat (LM↔RM) arası ceza yok
  if(["LM","RM"].includes(playerPos)&&["LM","RM"].includes(slotPos)) return 0;
  // Tam bek (LB↔RB) arası ceza yok
  if(["LB","RB"].includes(playerPos)&&["LB","RB"].includes(slotPos)) return 0;
  // CB her savunma slotunda oynayabilir
  if(playerPos==="CB"&&DEF.includes(slotPos)) return -4;
  if(DEF.includes(playerPos)&&slotPos==="CB") return -4;
  // CDM ↔ CM geçiş — doğal
  if(playerPos==="CDM"&&slotPos==="CM") return -2;
  if(playerPos==="CM"&&slotPos==="CDM") return -2;
  // CAM ↔ CM geçiş
  if(playerPos==="CAM"&&slotPos==="CM") return -3;
  if(playerPos==="CM"&&slotPos==="CAM") return -3;
  // Kanat ↔ CAM/CM
  if(["LM","RM"].includes(playerPos)&&["CM","CAM"].includes(slotPos)) return -5;
  if(["CM","CAM"].includes(playerPos)&&["LM","RM"].includes(slotPos)) return -5;
  // ST ↔ CAM / LM / RM (false 9 veya kanat ST)
  if(playerPos==="ST"&&["CAM","LM","RM"].includes(slotPos)) return -8;
  if(["CAM","LM","RM"].includes(playerPos)&&slotPos==="ST") return -8;
  // Aynı büyük grupta ise -10 ceza
  const grp=(p)=>DEF.includes(p)?"DEF":MID.includes(p)?"MID":"ATT";
  if(grp(playerPos)===grp(slotPos)) return -10;
  // Farklı büyük gruplar arası geçiş yasak (-99)
  return -99;
};

const FDATA={
  "4-4-2":  [{x:50,y:88,p:"GK"},{x:15,y:68,p:"LB"},{x:38,y:68,p:"CB"},{x:62,y:68,p:"CB"},{x:85,y:68,p:"RB"},{x:10,y:46,p:"LM"},{x:33,y:46,p:"CM"},{x:67,y:46,p:"CM"},{x:90,y:46,p:"RM"},{x:35,y:22,p:"ST"},{x:65,y:22,p:"ST"}],
  "4-3-3":  [{x:50,y:88,p:"GK"},{x:15,y:68,p:"LB"},{x:38,y:68,p:"CB"},{x:62,y:68,p:"CB"},{x:85,y:68,p:"RB"},{x:28,y:48,p:"CM"},{x:50,y:48,p:"CM"},{x:72,y:48,p:"CM"},{x:20,y:22,p:"LM"},{x:50,y:16,p:"ST"},{x:80,y:22,p:"RM"}],
  "3-5-2":  [{x:50,y:88,p:"GK"},{x:22,y:68,p:"CB"},{x:50,y:68,p:"CB"},{x:78,y:68,p:"CB"},{x:8,y:46,p:"LM"},{x:28,y:46,p:"CM"},{x:50,y:46,p:"CM"},{x:72,y:46,p:"CM"},{x:92,y:46,p:"RM"},{x:35,y:22,p:"ST"},{x:65,y:22,p:"ST"}],
  "4-2-3-1":[{x:50,y:88,p:"GK"},{x:15,y:68,p:"LB"},{x:38,y:68,p:"CB"},{x:62,y:68,p:"CB"},{x:85,y:68,p:"RB"},{x:33,y:52,p:"CM"},{x:67,y:52,p:"CM"},{x:18,y:34,p:"LM"},{x:50,y:34,p:"CAM"},{x:82,y:34,p:"RM"},{x:50,y:16,p:"ST"}],
  "5-3-2":  [{x:50,y:88,p:"GK"},{x:8,y:68,p:"LB"},{x:27,y:68,p:"CB"},{x:50,y:68,p:"CB"},{x:73,y:68,p:"CB"},{x:92,y:68,p:"RB"},{x:25,y:44,p:"CM"},{x:50,y:44,p:"CM"},{x:75,y:44,p:"CM"},{x:35,y:20,p:"ST"},{x:65,y:20,p:"ST"}],
  "4-1-4-1":[{x:50,y:88,p:"GK"},{x:15,y:68,p:"LB"},{x:38,y:68,p:"CB"},{x:62,y:68,p:"CB"},{x:85,y:68,p:"RB"},{x:50,y:56,p:"CDM"},{x:10,y:38,p:"LM"},{x:33,y:38,p:"CM"},{x:67,y:38,p:"CM"},{x:90,y:38,p:"RM"},{x:50,y:16,p:"ST"}],
};

// DB'den takımın en iyi 11 oyuncusunun OVR ortalamasını hesapla → str
function calcTeamStrFromDB(teamName){
  const players=DB.filter(p=>p.club===teamName);
  if(players.length===0) return null; // DB'de yok, mevcut str'yi koru
  const sorted=players.sort((a,b)=>b.ovr-a.ovr);
  const best11=sorted.slice(0,11);
  const avg=Math.round(best11.reduce((s,p)=>s+p.ovr,0)/best11.length);
  return avg;
}

// Tüm INIT_TEAMS için DB'den str güncelle (varsa)
function buildInitTeamsWithStr(){
  return INIT_TEAMS.map(t=>{
    if(t.me) return {...t}; // kullanıcı takımına dokunma
    const dbStr=calcTeamStrFromDB(t.n);
    if(dbStr===null) return {...t}; // DB'de yoksa orijinal str kullan
    // DB ortalaması ile orijinal str'yi harmanlayarak daha istikrarlı bir değer üret
    // (transfer bazlı dengesizliği yumuşatmak için %60 DB + %40 orijinal)
    const blended=Math.round(dbStr*0.60 + t.str*0.40);
    return {...t, str:blended};
  });
}

// Her takım için sabit formasyon tercihi (gercek dunyaya yakin)
const TEAM_PREF_FORMATION={
  // Elit Lig
  "Galatasaray FC":"4-2-3-1","Fenerbahce FC":"4-3-3","Besiktas FC":"4-2-3-1",
  "Trabzonspor FC":"4-3-3","Basaksehir FC":"4-4-2","Konyaspor FC":"5-3-2",
  "Alanyaspor FC":"4-3-3","Samsunspor FC":"4-4-2","Kasimpasa FC":"4-3-3",
  "Rizespor FC":"4-4-2","Gaziantepspor FC":"4-4-2","Eyupspor FC":"4-3-3",
  "Goztepe FC":"4-3-3","Kocaelispor FC":"4-4-2","Genclerbirligi FC":"4-3-3",
  "Erzurumspor FC":"5-3-2","Amed Sportif FC":"4-2-3-1","Corum FK":"4-1-4-1",
  // 1. Lig
  "Kayserispor FC":"5-3-2","Antalyaspor FC":"4-4-2","Sivasspor FC":"4-1-4-1",
  "Karagumruk FC":"4-2-3-1","Bodrumspor FC":"4-2-3-1","Pendikspor FC":"4-4-2",
  "Istanbulspor FC":"4-3-3","Umraniyespor FC":"4-4-2","Bandirmaspor FC":"4-4-2",
  "Manisaspor FC":"4-1-4-1","Kecioren FK":"5-3-2","Bursaspor FC":"4-2-3-1",
  "Erokspor FC":"4-3-3","Igdir FK":"4-4-2","Boluspor FC":"4-4-2",
  "Vanspor FK":"5-3-2","Sariyer FC":"4-1-4-1","Muglaspor FC":"4-4-2","Batman Petrol FC":"5-3-2",
  // Alt lig / kupa / hazırlık rakipleri (lig dışı ama maç havuzlarında geçiyor)
  "Hatayspor FC":"4-4-2","Adana Demir FC":"4-2-3-1","Ankaragucu FC":"4-1-4-1",
  "Sakaryaspor FC":"4-2-3-1","Zonguldakspor FC":"5-3-2","Adanaspor FC":"4-4-2",
  "Altinordu FC":"4-3-3","Denizlispor FC":"4-2-3-1","Bucaspor FC":"4-4-2",
  "Tarsus FK":"5-3-2","Elazig FK":"4-4-2","Altay FC":"4-2-3-1",
  // İngiliz Ligi
  "Eastfield City":"4-3-3","Mersey Reds":"4-3-3","Northon City":"4-3-3",
  "Westbridge FC":"4-2-3-1","Redford United":"4-4-2","Southgate Hotspur":"4-2-3-1",
  "Tyneside FC":"4-3-3","Midfield Villa":"4-2-3-1","Seagulls FC":"4-2-3-1",
  "Riverside FC":"4-4-2","Goodfields FC":"4-4-2","Crystal FC":"3-5-2",
  "Fulham FC":"4-2-3-1","Nottingham FC":"4-2-3-1","Bournemouth FC":"4-2-3-1",
  "Leeds":"4-2-3-1","Sunderland":"4-3-3","Covenford City":"4-4-2",
  "Ipsworth Town":"4-2-3-1","Humberport City":"4-4-2",
  "Leicester City":"4-4-2", // lig dışı (Avrupa/kupa havuzları)
  // İngiliz 2. Ligi
  "East Hammers":"4-2-3-1","Wolverhampton":"3-5-2","Burnley FC":"4-4-2",
  "Southampton FC":"4-3-3","Sheffield FC":"3-5-2","Middlesbrough":"4-2-3-1",
  "Norwich FC":"4-3-3","West Bromford":"4-2-3-1","Birmingham":"4-2-3-1",
  "Wrexham FC":"3-5-2","Watford FC":"4-3-3","Millwall":"4-4-2",
  "Bristol FC":"4-2-3-1","Stoke":"4-4-2","Preston":"3-5-2",
  "Swansea":"4-3-3","QPR":"4-2-3-1","Derby FC":"4-4-2",
  "Blackburn":"4-2-3-1","Portsmouth FC":"4-4-2","Charlton FC":"4-4-2",
  "Cardiff":"4-1-4-1","Bolton FC":"4-4-2","Lincoln FC":"4-4-2",
  // İspanyol Ligi
  "Real Madreno":"4-3-3","FC Cataluña":"4-3-3","Atletico Madreno":"4-4-2",
  "Sevilia FC":"4-2-3-1","Villareal CF":"4-4-2","Real Sociedad":"4-3-3",
  "Athletic Club":"4-2-3-1","CA Osasuna":"4-4-2","Getafe CF":"4-1-4-1",
  "Valencia CF":"4-4-2","Real Betis":"4-2-3-1","Celta Vigo":"4-3-3",
  "Rayo Vallecano":"4-4-2","Espanyol":"4-4-2","Elche":"4-4-2","Levante":"4-2-3-1",
  "Real Oviedo":"4-4-2","Deportivo":"4-2-3-1","Racing Santander":"4-3-3","Malaga CF":"4-4-2",
  "RCD Mallorca":"5-3-2", // lig dışı
  // Alman Ligi
  "Bayern FC":"4-2-3-1","Dortmund BV":"4-3-3","Leverkusen FC":"4-2-3-1",
  "Leipzig RB":"4-4-2","TSG Hoffenheim":"4-2-3-1","Koln":"4-4-2",
  "SC Freiburg":"3-5-2","Frankfurt EFC":"3-5-2","FSV Mainz":"4-3-3",
  "Stuttgart VfB":"4-2-3-1","M'gladbach":"4-2-3-1","Berlin Union":"3-5-2",
  "Bremen FC":"4-3-3","FC Augsburg":"3-5-2","Hamburger SV":"4-3-3",
  "FC Schalke":"4-2-3-1","Paderborn":"4-3-3","SV Elversberg":"4-4-2",
  "Wolfsburg FC":"4-2-3-1","FC Heidenheim":"5-3-2","VfL Bochum":"4-4-2", // lig dışı
  // İtalyan Ligi
  "FC Internazionale":"3-5-2","AC Milanese":"4-2-3-1","Juventus FC":"3-5-2",
  "SSC Partenopei":"4-3-3","Atalanta BC B":"3-5-2","SS Lazione":"4-3-3",
  "AS Romasso":"3-5-2","Torino FC":"4-4-2","Genoa CFC":"4-4-2","Udinese Calcio":"4-4-2",
  "Bologna FC":"4-2-3-1","ACF Fiorentina":"4-3-3","Como":"4-2-3-1",
  "AC Monza":"3-5-2","US Sassuolo":"4-3-3","Parma Calcio":"4-3-3",
  "US Lecce":"4-3-3","Cagliari Calcio":"4-4-2","Venezia FC":"3-5-2","Frosinone Calcio":"4-3-3",
  // Fransız Ligi
  "Paris SG":"4-3-3","OL Lyon":"4-2-3-1","AS Monaco B":"4-3-3","OM Marseille":"4-2-3-1",
  "Stade Rennais":"4-2-3-1","RC Lens":"4-3-3","RC Strasbourg":"4-4-2",
  "LOSC Lille":"4-4-2","OGC Nice":"4-3-3","Brest":"4-3-3","Toulouse FC":"4-2-3-1",
  "Paris FC":"4-3-3","AJ Auxerre":"5-3-2","Le Havre":"4-4-2","FC Lorient":"4-4-2",
  "Angers SCO":"4-1-4-1","Troyes":"4-4-2","Le Mans FC":"4-4-2",
  "Stade de Reims":"4-1-4-1","FC Nantes":"4-4-2", // lig dışı
  // Portekiz Ligi
  "FC Porto":"4-3-3","SL Benfica":"4-3-3","Sporting CP":"4-2-3-1",
  "SC Braga":"4-2-3-1","Vitoria SC":"4-4-2","Boavista":"4-4-2",
  // Hollanda Ligi
  "AFC Ajax":"4-3-3","Feyenoord":"4-3-3","PSV Eindhoven":"4-3-3",
  "AZ Alkmaar":"4-3-3","FC Twente":"4-2-3-1","FC Utrecht":"4-4-2",
  // Diger Avrupa
  "Celtic FC":"4-2-3-1","İskoç Mavi FC":"4-4-2",
  "Brugge":"4-3-3","Slavia":"4-2-3-1","Salzburg":"4-3-3",
  "Olympiakos":"4-3-3","Shakhtar":"4-3-3","Dinamo Zagreb":"4-2-3-1",
  "Sheriff":"4-4-2","Qarabag":"4-1-4-1","Bodo Glimt":"4-3-3",
};
// Takimin gucune ve kadro yapisina gore en uygun formasyonu sec
function getTeamFormation(players, teamName){
  // Once isme gore bak
  if(teamName&&TEAM_PREF_FORMATION[teamName]) return TEAM_PREF_FORMATION[teamName];
  if(!players||players.length===0) return "4-4-2";
  // Kadro yapısına göre akıllı formasyon seçimi
  const cnt=(pos)=>players.filter(p=>p.pos===pos).length;
  const cbs=cnt("CB"), lbs=cnt("LB"), rbs=cnt("RB");
  const cms=cnt("CM"), cdms=cnt("CDM"), cams=cnt("CAM");
  const sts=cnt("ST"), lms=cnt("LM"), rms=cnt("RM");
  const totalMid=cms+cdms+cams;
  const totalDef=cbs+lbs+rbs;
  // 3-5-2: sadece gerçekten 3 CB + wingback odaklı kadrolarda
  if(cbs>=3&&lms>=1&&rms>=1&&totalMid>=3&&sts>=2&&(lbs+rbs)<2) return "3-5-2";
  // 4-2-3-1: CAM varsa ve yeterli orta saha varsa
  if(cams>=1&&cms>=1&&sts>=1&&(lbs+rbs)>=1) return "4-2-3-1";
  // 4-1-4-1: CDM odaklı kadro
  if(cdms>=1&&cms>=2&&(lms>=1||rms>=1)&&sts>=1&&(lbs+rbs)>=1) return "4-1-4-1";
  // 4-3-3: fazla kanat ve forvet varsa
  if(sts>=2&&totalMid>=3&&(lbs+rbs)>=1) return "4-3-3";
  // 5-3-2: fazla stoper, az fullback
  if(cbs>=3&&totalMid>=2&&sts>=1&&(lbs+rbs)<2) return "5-3-2";
  return "4-4-2";
}

// Rakip takım formasyonunu isme + guce + maç durumuna gore belirle
// scoreDiff: pozitif = rakip önde, negatif = rakip geride
function getRivalFormation(teamName, teamStr, scoreDiff=0, minute=0){
  const base=TEAM_PREF_FORMATION[teamName]||(
    teamStr>=82?"4-3-3":teamStr>=76?"4-2-3-1":teamStr>=70?"4-4-2":teamStr>=65?"4-1-4-1":"5-3-2"
  );
  // AI taktik değişimi — skor durumuna ve dakikaya göre
  if(minute>=60){
    // Geride kalınca hücuma geç
    if(scoreDiff<=-2) return "4-2-3-1"; // iki gol açığı: açık hücum
    if(scoreDiff<=-1){
      // Bir gol açığı: daha agresif varyant
      const aggressiveMap={"5-3-2":"4-3-3","4-1-4-1":"4-2-3-1","4-4-2":"4-3-3","3-5-2":"4-3-3"};
      return aggressiveMap[base]||base;
    }
  }
  if(minute>=70){
    // Önde olunca kilitlenme
    if(scoreDiff>=2){
      const defensiveMap={"4-3-3":"4-4-2","4-2-3-1":"4-1-4-1","4-4-2":"5-3-2","3-5-2":"5-3-2"};
      return defensiveMap[base]||base;
    }
  }
  return base;
}

// Verilen oyuncu listesi ve formasyon için otomatik dizilim oluştur
function buildTeamLineup(players, formation){
  const slts=FDATA[formation]||FDATA["4-4-2"];
  const available=[...players.map((p,i)=>({...p,sqIdx:i}))];
  const result=Array(11).fill(null);
  const used=new Set();
  slts.forEach((s,i)=>{
    const candidates=available
      .filter(p=>!used.has(p.sqIdx))
      .map(p=>{
        const pen=posPenalty(p.pos,s.p);
        if(pen===-99) return null;
        return {...p,score:p.ovr+pen};
      })
      .filter(Boolean)
      .sort((a,b)=>b.score-a.score);
    if(candidates[0]){result[i]=candidates[0].sqIdx;used.add(candidates[0].sqIdx);}
  });
  // Fallback
  slts.forEach((_,i)=>{
    if(result[i]!==null) return;
    const fb=available.find(p=>!used.has(p.sqIdx));
    if(fb){result[i]=fb.sqIdx;used.add(fb.sqIdx);}
  });
  return result;
}

// ═══════════════════════════════════════════════════════════════
// AVRUPA KUPALARI — UEFA 36 TAKIMLI SWISS MODEL (LİG AŞAMASI)
// CL (Avrupa Şampiyonlar Kupası) · UEFA (Avrupa Ligi) · CON (Konferans Ligi)
// CL/UEFA: 4 torba × 9, her torbadan 2 rakip → 8 maç (4 ev / 4 dep)
// CON    : 6 torba × 6, her torbadan 1 rakip → 6 maç (3 ev / 3 dep)
// Tek tablo: 1–8 Son 16, 9–24 Eleme Play-Off (çift maç), 25–36 elenir.
// Tüm fonksiyonlar saf (state kopyası döner) ve seed ile deterministiktir.
// ═══════════════════════════════════════════════════════════════
const EURO_COMP_LIST=["CL","UEFA","CON"];
const EURO_TABLE_KEY={CL:"clTable",UEFA:"uefaTable",CON:"conTable"};
const EURO_META={
  CL:  {name:"Avrupa Şampiyonlar Kupası",upper:"AVRUPA ŞAMPİYONLAR KUPASI",short:"ASK",icon:"⭐",color:"#ffd060",rgb:"232,184,58",md:8,pots:4},
  UEFA:{name:"Avrupa Ligi",upper:"AVRUPA LİGİ",short:"AL",icon:"🇪🇺",color:"#e67e22",rgb:"230,126,34",md:8,pots:4},
  CON: {name:"Konferans Ligi",upper:"KONFERANS LİGİ",short:"KL",icon:"🟢",color:"#2ecc71",rgb:"46,204,113",md:6,pots:6},
};
// Lig başına kontenjan [CL, UEFA, CON] (LIG_EURO_SPOTS) — tablo 34+34+36 verir,
// eksik slotlar selectEuroQualifiers içinde büyük liglerin en güçlü takımlarıyla 36'ya tamamlanır
const EURO_QUOTA={
  "İngiliz Ligi":[5,5,5],"İspanyol Ligi":[5,5,5],"Alman Ligi":[5,5,5],"İtalyan Ligi":[5,5,5],
  "Fransız Ligi":[4,4,5],"Hollanda Ligi":[4,4,5],"Portekiz Ligi":[4,4,5],"Elit Lig":[2,2,1],
};
const LIG_EURO_SPOTS=EURO_QUOTA;
// Doldurma havuzu: Elit Lig (6+ sıra) ve alt ligler hariç Avrupa'nın büyük ligleri
const EURO_FILL_LEAGUES=["İngiliz Ligi","İspanyol Ligi","Alman Ligi","İtalyan Ligi","Fransız Ligi","Hollanda Ligi","Portekiz Ligi"];
// "1–5 → ASK · 6–10 → AL · 11–15 → KL" biçiminde lig bilgi metni
const euroQuotaText=(lg)=>{
  const q=EURO_QUOTA[lg];if(!q) return null;
  let a=1;const parts=[];
  EURO_COMP_LIST.forEach((c,i)=>{if(q[i]>0){const b=a+q[i]-1;parts.push((a===b?a+".":a+"–"+b)+" → "+EURO_META[c].short);a=b+1;}});
  return parts.join(" · ");
};
// Sezon başı önizleme: takım adı → "CL"/"UEFA"/"CON" (oluşturucuyla aynı seçim, güç sıralaması)
let _euroPreviewCache=null;
const euroPreviewComp=(name)=>{
  if(!_euroPreviewCache){
    const q=selectEuroQualifiers(INIT_TEAMS.map(t=>({...t,me:false})),{byStr:true});
    _euroPreviewCache={};
    EURO_COMP_LIST.forEach(c=>q[c].forEach(t=>{_euroPreviewCache[t.n]=c;}));
  }
  return _euroPreviewCache[name]||null;
};
const EURO_KO_ROUNDS=["po","r16","qf","sf","fin"];
const EURO_KO_LABEL={po:"Play-Off",r16:"Son 16",qf:"Çeyrek Final",sf:"Yarı Final",fin:"Final"};
const EURO_CUP_COMPS=["HAZ","ZTK","CL","UEFA","CON","SUPERKUPA"];
const isEuroComp=(c)=>c==="CL"||c==="UEFA"||c==="CON";

const euroHash=(s)=>{let h=2166136261;const str=String(s);for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;};
const euroRng=(seed)=>{let a=(seed>>>0)||1;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};};
const euroShuffle=(arr,rng)=>{const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};

// ── Katılımcı seçimi: 8 ligin sıralaması (byStr=true → güç sıralaması) ──
// force: kullanıcının girmesi gereken kupa ("CL"/"UEFA"/"CON") — eski kayıt uyumu
const selectEuroQualifiers=(teams,opts={})=>{
  const {byStr=false,force=null,noMe=false}=opts;
  if(noMe) teams=(teams||[]).filter(t=>!t.me);
  const out={CL:[],UEFA:[],CON:[]};
  const used=new Set();
  const rankLg=(lg)=>{
    const ts=(teams||[]).filter(t=>t.lg===lg);
    const played=!byStr&&ts.some(t=>(t.w||0)+(t.d||0)+(t.l||0)>0);
    return [...ts].sort((a,b)=>played
      ?((b.pts||0)-(a.pts||0)||(b.gd||0)-(a.gd||0)||(b.gf||0)-(a.gf||0)||(b.str||0)-(a.str||0))
      :((b.str||0)-(a.str||0)||String(a.n).localeCompare(String(b.n))));
  };
  const mk=(t)=>({n:t.n,lg:t.lg,str:t.str||65,me:!!t.me});
  Object.entries(EURO_QUOTA).forEach(([lg,q])=>{
    const r=rankLg(lg);let i=0;
    EURO_COMP_LIST.forEach((c,ci)=>{for(let k=0;k<q[ci]&&i<r.length;k++,i++){out[c].push(mk(r[i]));used.add(r[i].n);}});
  });
  // 36 takım garantisi: eksik slotları henüz seçilmemiş, büyük liglerin en güçlü takımlarıyla doldur
  const byStrDesc=(a,b)=>(b.str||0)-(a.str||0)||String(a.n).localeCompare(String(b.n));
  const rest=[...(teams||[])].filter(t=>!used.has(t.n)&&EURO_FILL_LEAGUES.includes(t.lg)).sort(byStrDesc);
  EURO_COMP_LIST.forEach(c=>{while(out[c].length<36&&rest.length){const t=rest.shift();out[c].push(mk(t));used.add(t.n);}});
  // Son çare (lig verisi eksikse): Elit Lig ve İngiliz 2. Ligi dışındaki kalanlar
  const rest2=[...(teams||[])].filter(t=>!used.has(t.n)&&!t.me&&t.lg!=="Elit Lig"&&t.lg!=="İngiliz 2. Ligi").sort(byStrDesc);
  EURO_COMP_LIST.forEach(c=>{while(out[c].length<36&&rest2.length){const t=rest2.shift();out[c].push(mk(t));used.add(t.n);}});
  if(force&&out[force]){
    const me=(teams||[]).find(t=>t.me);
    if(me&&!out[force].some(t=>t.me)){
      EURO_COMP_LIST.forEach(c=>{out[c]=out[c].filter(t=>!t.me);});
      const list=out[force];
      // Aynı ligden en zayıf takımı (yoksa genel en zayıfı) çıkar
      const sameLg=list.filter(t=>t.lg===me.lg).sort((a,b)=>a.str-b.str);
      const drop=sameLg[0]||[...list].sort((a,b)=>a.str-b.str)[0];
      out[force]=list.filter(t=>t!==drop);
      out[force].push(mk(me));
      // Kullanıcının çıktığı kupadaki boşluğu düşen takımla doldur
      EURO_COMP_LIST.forEach(c=>{if(c!==force&&out[c].length<36&&drop) {out[c].push(drop);}});
    }
  }
  return out;
};

// ── Torbalar: güce göre sırala, aynı ligden torba başına en fazla cap takım ──
const buildEuroPots=(list,comp)=>{
  const nP=EURO_META[comp].pots, size=list.length/nP, cap=comp==="CON"?2:3;
  const sorted=[...list].sort((a,b)=>b.str-a.str||String(a.n).localeCompare(String(b.n)));
  const pots=Array.from({length:nP},()=>[]);
  let queue=sorted;
  for(let p=0;p<nP;p++){
    const next=[];
    for(const t of queue){
      const cnt=pots[p].filter(x=>x.lg===t.lg).length;
      if(pots[p].length<size&&(cnt<cap||p===nP-1)) pots[p].push(t); else next.push(t);
    }
    queue=next;
  }
  return pots;
};

// ── Eşleşme grafiği: aynı lig yok, tekrar eşleşme yok ──
const buildSwissPairs=(pots,comp,rng)=>{
  const per=comp==="CON"?1:2;
  const ok=(a,b,strict)=>a.n!==b.n&&(!strict||a.lg!==b.lg);
  // İki torba arası (veya torba içi) d-düzenli eşleşme — geri izlemeli
  const matchPerfect=(A,B,forbid,strict)=>{ // A[i] ↔ B[perm[i]] mükemmel eşleşme
    const n=A.length, usedB=new Array(n).fill(false), res=new Array(n);
    const order=euroShuffle([...Array(n).keys()],rng);
    let steps=0;
    const go=(k)=>{
      if(k===n) return true;
      if(++steps>20000) return false;
      const i=order[k];
      for(const j of euroShuffle([...Array(n).keys()],rng)){
        if(usedB[j]||!ok(A[i],B[j],strict)||forbid.has(A[i].n+"|"+B[j].n)) continue;
        usedB[j]=true;res[i]=j;
        if(go(k+1)) return true;
        usedB[j]=false;
      }
      return false;
    };
    return go(0)?res:null;
  };
  const intraCycle=(P,strict)=>{ // torba içi: CL/UEFA → 2-düzenli (Hamilton çevrimi)
    const n=P.length;let steps=0;
    for(let tries=0;tries<200;tries++){
      const order=[0];const used=new Set([0]);
      const go=()=>{
        if(++steps>40000) return false;
        if(order.length===n) return ok(P[order[n-1]],P[order[0]],strict);
        for(const j of euroShuffle([...Array(n).keys()],rng)){
          if(used.has(j)||!ok(P[order[order.length-1]],P[j],strict)) continue;
          used.add(j);order.push(j);
          if(go()) return true;
          used.delete(j);order.pop();
        }
        return false;
      };
      if(go()) return order.map((v,i)=>[P[v],P[order[(i+1)%n]]]);
    }
    return null;
  };
  const intraMatch=(P,strict)=>{ // torba içi: CON → mükemmel eşleşme (6 takım → 3 çift)
    const n=P.length, used=new Array(n).fill(false), pairs=[];let steps=0;
    const go=()=>{
      if(++steps>20000) return false;
      const i=used.indexOf(false); if(i<0) return true;
      used[i]=true;
      for(const j of euroShuffle([...Array(n).keys()],rng)){
        if(used[j]||!ok(P[i],P[j],strict)) continue;
        used[j]=true;pairs.push([P[i],P[j]]);
        if(go()) return true;
        used[j]=false;pairs.pop();
      }
      used[i]=false;return false;
    };
    return go()?pairs:null;
  };
  for(const strict of [true,false]){
    for(let attempt=0;attempt<30;attempt++){
      const edges=[];let fail=false;
      for(let i=0;i<pots.length&&!fail;i++){
        const intra=per===2?intraCycle(pots[i],strict):intraMatch(pots[i],strict);
        if(!intra){fail=true;break;}
        edges.push(...intra);
        for(let j=i+1;j<pots.length&&!fail;j++){
          const forbid=new Set();
          for(let r=0;r<per;r++){
            const m=matchPerfect(pots[i],pots[j],forbid,strict);
            if(!m){fail=true;break;}
            m.forEach((jj,ii)=>{edges.push([pots[i][ii],pots[j][jj]]);forbid.add(pots[i][ii].n+"|"+pots[j][jj].n);});
          }
        }
      }
      if(!fail) return edges.map(([a,b])=>[a.n,b.n]);
    }
  }
  return [];
};

// ── Ev/deplasman: Euler çevrimi ile yönlendir → her takım yarı ev, yarı dep ──
const orientEuroPairs=(pairs)=>{
  const adj={};pairs.forEach(([a,b],i)=>{(adj[a]=adj[a]||[]).push(i);(adj[b]=adj[b]||[]).push(i);});
  const usedE=new Array(pairs.length).fill(false), out=[], ptr={};
  Object.keys(adj).forEach(start=>{
    // Hierholzer: kenarları geçiş yönünde ev→dep olarak yaz
    const stack=[[start,-1]];
    while(stack.length){
      const [v]=stack[stack.length-1];
      ptr[v]=ptr[v]||0;
      while(ptr[v]<adj[v].length&&usedE[adj[v][ptr[v]]]) ptr[v]++;
      if(ptr[v]===adj[v].length){const [,e]=stack.pop();if(e>=0)out.push(e);continue;}
      const e=adj[v][ptr[v]];usedE[e]=true;
      const [a,b]=pairs[e];const w=a===v?b:a;
      stack.push([w,e]);
      pairs[e]=[v,w]; // v ev sahibi
    }
  });
  return pairs.map(([h,a])=>({h,a}));
};

// ── Maç günü ataması: her takım her haftada tam 1 maç ──
// Her maç günü için kalan maç grafiğinde mükemmel eşleşme (MRV geri izleme), çıkmazda yeniden dene
const assignEuroMatchdays=(matches,nMd,rng)=>{
  const names=[...new Set(matches.flatMap(m=>[m.h,m.a]))];
  for(let attempt=0;attempt<60;attempt++){
    const left=new Set(matches.map((_,i)=>i));
    const md=new Array(matches.length).fill(0);
    let ok=true;
    for(let k=1;k<=nMd&&ok;k++){
      const inc={};names.forEach(n=>inc[n]=[]);
      left.forEach(i=>{inc[matches[i].h].push(i);inc[matches[i].a].push(i);});
      const free=new Set(names), chosen=[];let steps=0;
      const go=()=>{
        if(!free.size) return true;
        if(++steps>4000) return false;
        let best=null,bo=null;
        for(const n of free){const o=inc[n].filter(i=>free.has(matches[i].h)&&free.has(matches[i].a));if(!bo||o.length<bo.length){best=n;bo=o;if(!o.length)break;}}
        if(!bo.length) return false;
        for(const i of euroShuffle(bo,rng)){
          const m=matches[i];free.delete(m.h);free.delete(m.a);chosen.push(i);
          if(go()) return true;
          chosen.pop();free.add(m.h);free.add(m.a);
        }
        return false;
      };
      if(!go()){ok=false;break;}
      chosen.forEach(i=>{md[i]=k;left.delete(i);});
    }
    if(ok) return matches.map((m,i)=>({...m,md:md[i],hg:null,ag:null}));
  }
  // Son çare: sırayla dağıt (çok nadir)
  return matches.map((m,i)=>({...m,md:(i%nMd)+1,hg:null,ag:null}));
};

// ── Takvim: kullanıcının lig haftaları arasına (w>=1000) ZTK/Kalkan ile çakışmadan yerleş ──
const buildEuroCalendar=(allFix,comp)=>{
  const MO=["Temmuz","Agustos","Eylul","Ekim","Kasim","Aralik","Ocak","Subat","Mart","Nisan","Mayis","Haziran"];
  const lig=(allFix||[]).filter(f=>!EURO_CUP_COMPS.includes(f.comp)&&(f.w||0)>0&&(f.w||0)<1000);
  const byM={};lig.forEach(f=>{(byM[f.month]=byM[f.month]||new Set()).add(f.w);});
  Object.keys(byM).forEach(m=>{byM[m]=[...byM[m]].sort((a,b)=>a-b);});
  const allW=[...new Set(lig.map(f=>f.w))].sort((a,b)=>a-b);
  // ZTK / Kalkan maçlarının oturduğu ara haftaları işaretle
  const busy=new Set();let last=0;
  sortFixture((allFix||[]).filter(f=>f.comp!=="HAZ"&&!isEuroComp(f.comp))).forEach(f=>{
    if(f.comp==="ZTK"||f.comp==="SUPERKUPA") busy.add(last); else if((f.w||0)<1000) last=f.w||last;
  });
  const taken=new Set();
  const pick=(month,n,mode)=>{
    let cand=(byM[month]||[]).slice();
    if(mode==="early") cand=cand.slice(0,Math.max(1,cand.length-1));
    if(mode==="last") cand=cand.slice(-1);
    if(!cand.length){ // o ay lig yok: önceki ayların son haftasından sonra
      const mi=MO.indexOf(month);let base=0;
      for(let k=mi-1;k>=0&&!base;k--){const ws=byM[MO[k]];if(ws&&ws.length) base=ws[ws.length-1];}
      if(!base) base=allW[0]||1;
      return Array.from({length:n},(_,k)=>({w:base*100+45+k*5,month}));
    }
    const res=[];
    for(let k=0;k<n;k++){
      const ideal=Math.min(cand.length-1,Math.floor((k+0.5)*cand.length/n));
      let g=null;
      for(let d=0;d<cand.length&&g===null;d++){
        for(const idx of [ideal+d,ideal-d]){
          if(idx<0||idx>=cand.length) continue;
          const w=cand[idx];
          if(!taken.has(w)&&!busy.has(w)){g=w;break;}
        }
      }
      if(g===null) for(const w of cand) if(!taken.has(w)){g=w;break;}
      if(g===null){res.push({w:cand[cand.length-1]*100+46+k*2,month});continue;}
      taken.add(g);
      res.push({w:g*100+(mode==="last"?60:40),month});
    }
    return res.sort((a,b)=>a.w-b.w);
  };
  const mdMonths=comp==="CON"
    ?["Ekim","Ekim","Kasim","Kasim","Aralik","Aralik"]
    :["Eylul","Ekim","Ekim","Kasim","Kasim","Aralik","Ocak","Ocak"];
  const mdCount={};mdMonths.forEach(m=>mdCount[m]=(mdCount[m]||0)+1);
  const md=[];Object.keys(mdCount).sort((a,b)=>MO.indexOf(a)-MO.indexOf(b)).forEach(m=>md.push(...pick(m,mdCount[m])));
  // Eleme turları: Şubat'tan itibaren lig araları, her slot bir öncekinden sonra (monoton)
  const gaps=allW.filter(w=>{const m=lig.find(f=>f.w===w).month;return MO.indexOf(m)>=MO.indexOf("Subat");});
  const lastW=allW[allW.length-1]||38;
  const monthOfW=(w)=>lig.find(f=>f.w===w).month;
  let li=-1;
  const koPick=(month,n)=>{
    const res=[];
    for(let k=0;k<n;k++){
      let cand=gaps.map((w,i)=>({w,i})).filter(x=>x.i>li&&x.w<lastW&&!busy.has(x.w));
      const inM=cand.filter(x=>monthOfW(x.w)===month);
      const pickFrom=inM.length?inM:cand.filter(x=>MO.indexOf(monthOfW(x.w))>=MO.indexOf(month));
      const c=pickFrom.length?pickFrom[(k===0||pickFrom.length<2)?0:Math.min(1,pickFrom.length-1)]:(cand[0]||null);
      if(c){li=c.i;res.push({w:c.w*100+40,month:monthOfW(c.w)});}
      else{const prev=res.length?res[res.length-1].w:(lastW*100+40);res.push({w:Math.max(prev+2,lastW*100+42+k*2),month});}
    }
    return res;
  };
  const po=koPick("Subat",2), r16=koPick("Mart",2), qf=koPick("Nisan",2), sf=koPick("Mayis",2);
  const lastMonth=lig.length?monthOfW(lastW):"Mayis";
  return {md,po,r16,qf,sf,fin:[{w:lastW*100+60,month:lastMonth}]};
};
const euroPos=(c)=>c?(c.w||0)/100:Infinity;

// ── Maç simülasyonu (Poisson, güç farkı + iç saha) ──
const euroSimScore=(hStr,aStr,rng)=>{
  const d=(hStr||70)-(aStr||70);
  const lh=Math.max(0.25,Math.min(3.6,1.38*Math.exp(d*0.045)));
  const la=Math.max(0.2,Math.min(3.4,1.08*Math.exp(-d*0.045)));
  const pois=(l)=>{const L=Math.exp(-l);let k=0,p=1;do{k++;p*=rng();}while(p>L&&k<10);return k-1;};
  return [pois(lh),pois(la)];
};
const euroSortTable=(teams)=>[...(teams||[])].sort((a,b)=>
  b.pts-a.pts||(b.gf-b.ga)-(a.gf-a.ga)||b.gf-a.gf||b.w-a.w||(b.str||0)-(a.str||0)||String(a.n).localeCompare(String(b.n)));

// ── Tablo oluştur (Eylül kurası) ──
const createEuroTable=(comp,quals,allFix,seed)=>{
  const rng=euroRng(euroHash(comp+":"+seed));
  const list=(quals||[]).slice(0,36);
  if(list.length<36) return null;
  const pots=buildEuroPots(list,comp);
  const potOf={};pots.forEach((p,i)=>p.forEach(t=>{potOf[t.n]=i+1;}));
  const pairs=buildSwissPairs(pots,comp,rng);
  const matches=assignEuroMatchdays(orientEuroPairs(pairs),EURO_META[comp].md,rng)
    .sort((a,b)=>a.md-b.md);
  return {
    comp,seed:euroHash(comp+"#"+seed),phase:"league",champion:null,
    teams:list.map(t=>({n:t.n,lg:t.lg,str:t.str,me:!!t.me,pot:potOf[t.n],pts:0,w:0,d:0,l:0,gf:0,ga:0})),
    matches,cal:buildEuroCalendar(allFix,comp),
    ko:{po:[],r16:[],qf:[],sf:[],fin:[]},
  };
};

// Kullanıcının kupa fikstürleri (sw:true → w dinamik düzeltmeden muaf)
const euroUserLeagueFixtures=(tbl,fromPos=-Infinity)=>{
  if(!tbl) return [];
  const me=tbl.teams.find(t=>t.me);if(!me) return [];
  const strOf={};tbl.teams.forEach(t=>strOf[t.n]=t.str);
  return tbl.matches.filter(m=>(m.h===me.n||m.a===me.n)&&m.hg===null&&euroPos(tbl.cal.md[m.md-1])>fromPos).map(m=>{
    const c=tbl.cal.md[m.md-1]||{w:0,month:"Ekim"};
    const opp=m.h===me.n?m.a:m.h;
    return {w:c.w,month:c.month,opp,home:m.h===me.n,str:strOf[opp]||75,comp:tbl.comp,round:"Lig Aşaması",md:m.md,sw:true};
  });
};
const euroTieFixtures=(tbl,round,tie)=>{
  const me=tbl.teams.find(t=>t.me);if(!me) return [];
  if(tie.a!==me.n&&tie.b!==me.n) return [];
  const opp=tie.a===me.n?tie.b:tie.a;
  const str=(tbl.teams.find(t=>t.n===opp)||{}).str||78;
  return tie.legs.map((lg,i)=>{
    const c=tbl.cal[round][i]||tbl.cal[round][0];
    const label=round==="fin"?"Final":`${EURO_KO_LABEL[round]} — ${i+1}. Maç`;
    return {w:c.w,month:c.month,opp,home:round==="fin"?false:lg.h===me.n,str,comp:tbl.comp,round:label,ko:round,leg:i,sw:true};
  });
};

// ── Tabloyu P konumuna kadar ilerlet ──
// um: kullanıcının az önce oynadığı maç {md}|{ko,leg} + {myG,opG,penWon}
// Dönen: {tbl, ev:[{type,...}], fix:[yeni kullanıcı fikstürleri]}
const advanceEuroTable=(tblIn,P,um=null)=>{
  if(!tblIn) return {tbl:tblIn,ev:[],fix:[]};
  const tbl=JSON.parse(JSON.stringify(tblIn));
  const ev=[], fix=[];
  const me=tbl.teams.find(t=>t.me);
  const isMe=(n)=>!!me&&n===me.n;
  const T={};tbl.teams.forEach(t=>T[t.n]=t);
  const rngFor=(k)=>euroRng(euroHash(tbl.seed+":"+k));
  const applyRes=(m,hg,ag)=>{
    m.hg=hg;m.ag=ag;
    const h=T[m.h],a=T[m.a];if(!h||!a) return;
    h.gf+=hg;h.ga+=ag;a.gf+=ag;a.ga+=hg;
    if(hg>ag){h.w++;h.pts+=3;a.l++;} else if(hg<ag){a.w++;a.pts+=3;h.l++;} else {h.d++;a.d++;h.pts++;a.pts++;}
  };
  // 1) Kullanıcı sonucu
  if(um&&me){
    if(um.md){
      const m=tbl.matches.find(x=>x.md===um.md&&x.hg===null&&(isMe(x.h)||isMe(x.a)));
      if(m){const home=isMe(m.h);applyRes(m,home?um.myG:um.opG,home?um.opG:um.myG);}
    } else if(um.ko){
      const tie=(tbl.ko[um.ko]||[]).find(t=>isMe(t.a)||isMe(t.b));
      const leg=tie&&tie.legs[um.leg||0];
      if(leg&&leg.hg===null){
        const home=isMe(leg.h);leg.hg=home?um.myG:um.opG;leg.ag=home?um.opG:um.myG;
        if(um.penWon!==undefined&&um.penWon!==null) tie.userPen=um.penWon;
      }
    }
  }
  // Çift maç sonucu
  const decideTie=(tie,key)=>{
    if(tie.win) return;
    if(tie.legs.some(l=>l.hg===null)) return;
    const g={[tie.a]:0,[tie.b]:0};
    tie.legs.forEach(l=>{g[l.h]+=l.hg;g[l.h===tie.a?tie.b:tie.a]+=l.ag;});
    if(g[tie.a]!==g[tie.b]){tie.win=g[tie.a]>g[tie.b]?tie.a:tie.b;return;}
    // Penaltılar
    let aWins;
    if(tie.userPen!==undefined&&(isMe(tie.a)||isMe(tie.b))) aWins=isMe(tie.a)?tie.userPen:!tie.userPen;
    else {const r=rngFor("pen"+key)();const sa=T[tie.a]?.str||70, sb=T[tie.b]?.str||70;aWins=r<0.5+(sa-sb)*0.01;}
    const r2=rngFor("pens"+key)();const wp=4+Math.floor(r2*2), lp=Math.max(2,wp-1-Math.floor(r2*2));
    tie.pen={a:aWins?wp:lp,b:aWins?lp:wp};
    tie.win=aWins?tie.a:tie.b;
  };
  const mkTie=(a,b,legs)=>({a,b,legs:legs===1?[{h:a,a:b,hg:null,ag:null}]
    :[{h:b,a:a,hg:null,ag:null},{h:a,a:b,hg:null,ag:null}],win:null,pen:null}); // seri başı rövanşı evinde
  const startRound=(round,ties)=>{
    tbl.ko[round]=ties;tbl.phase=round;
    ties.forEach(t=>fix.push(...euroTieFixtures(tbl,round,t)));
  };
  for(let guard=0;guard<10;guard++){
    if(tbl.phase==="league"){
      tbl.matches.forEach((m,i)=>{
        if(m.hg!==null) return;
        if(euroPos(tbl.cal.md[m.md-1])>P) return;
        if((isMe(m.h)||isMe(m.a))&&P!==Infinity&&!um?.catchUp&&euroPos(tbl.cal.md[m.md-1])>P-2) return; // kullanıcı maçını kendisi oynar
        const [hg,ag]=euroSimScore(T[m.h]?.str,T[m.a]?.str,rngFor("m"+i));
        applyRes(m,hg,ag);
      });
      if(tbl.matches.some(m=>m.hg===null)) break;
      const srt=euroSortTable(tbl.teams);
      srt.forEach((t,i)=>{T[t.n].rank=i+1;});
      const myRank=me?T[me.n].rank:0;
      ev.push({type:"league_end",comp:tbl.comp,myRank});
      // Play-Off: 9↔24, 10↔23 … 16↔17 (seri başı 9–16 rövanşı evinde oynar)
      startRound("po",Array.from({length:8},(_,t)=>mkTie(srt[8+t].n,srt[23-t].n,2)));
      tbl.direct=srt.slice(0,8).map(t=>t.n);
      continue;
    }
    if(tbl.phase==="done") break;
    const round=tbl.phase, ties=tbl.ko[round]||[];
    ties.forEach((tie,ti)=>{
      tie.legs.forEach((l,li)=>{
        if(l.hg!==null) return;
        if(euroPos(tbl.cal[round][li])>P) return;
        if((isMe(l.h)||isMe(l.a))&&P!==Infinity&&!um?.catchUp&&euroPos(tbl.cal[round][li])>P-2) return;
        const [hg,ag]=euroSimScore(T[l.h]?.str,T[l.a]?.str,rngFor(round+ti+"_"+li));
        l.hg=hg;l.ag=ag;
      });
      decideTie(tie,round+ti);
    });
    if(ties.some(t=>!t.win)) break;
    // Kullanıcı tur sonucu
    ties.forEach(t=>{if(isMe(t.a)||isMe(t.b)) ev.push({type:"tie_end",comp:tbl.comp,round,won:isMe(t.win),opp:isMe(t.a)?t.b:t.a,pen:t.pen});});
    const W=ties.map(t=>t.win);
    if(round==="po"){
      // Son 16: k. seri başı ↔ Play-Off eşleşmesi (8-k) galibi → 1↔16/17, 8↔9/24
      startRound("r16",tbl.direct.map((n,k)=>mkTie(n,W[7-k],2)));
      ev.push({type:"round_start",comp:tbl.comp,round:"r16",tie:tbl.ko.r16.find(t=>isMe(t.a)||isMe(t.b))||null});
    } else if(round==="r16"){
      const order=[[0,7],[3,4],[1,6],[2,5]];
      startRound("qf",order.map(([x,y])=>mkTie(W[x],W[y],2)));
      ev.push({type:"round_start",comp:tbl.comp,round:"qf",tie:tbl.ko.qf.find(t=>isMe(t.a)||isMe(t.b))||null});
    } else if(round==="qf"){
      startRound("sf",[mkTie(W[0],W[1],2),mkTie(W[2],W[3],2)]);
      ev.push({type:"round_start",comp:tbl.comp,round:"sf",tie:tbl.ko.sf.find(t=>isMe(t.a)||isMe(t.b))||null});
    } else if(round==="sf"){
      startRound("fin",[mkTie(W[0],W[1],1)]);
      ev.push({type:"round_start",comp:tbl.comp,round:"fin",tie:tbl.ko.fin.find(t=>isMe(t.a)||isMe(t.b))||null});
    } else if(round==="fin"){
      tbl.champion=W[0];tbl.phase="done";
      ev.push({type:"champion",comp:tbl.comp,champion:W[0],me:isMe(W[0])});
    }
  }
  return {tbl,ev,fix};
};

// Kullanıcının bu kupadaki durumu (UI için)
const euroMyStatus=(tbl)=>{
  if(!tbl) return null;
  const me=tbl.teams.find(t=>t.me);if(!me) return null;
  const srt=euroSortTable(tbl.teams);
  const rank=srt.findIndex(t=>t.me)+1;
  let stage="league", out=false;
  for(const r of EURO_KO_ROUNDS){
    const tie=(tbl.ko[r]||[]).find(t=>t.a===me.n||t.b===me.n);
    if(tie){stage=r;if(tie.win&&tie.win!==me.n) out=true;}
  }
  if(tbl.phase!=="league"&&stage==="league"&&!(tbl.direct||[]).includes(me.n)) out=true;
  if(tbl.champion===me.n) stage="champion";
  return {rank,stage,out,name:me.n};
};
// Avrupa primleri (K€) — tur atlama primleri o tura ulaşınca ödenir
const EURO_PRIM={
  CL:  {lig_galibiyet:800,lig_beraberlik:300,playoff:1500,son16:4000,ceyrek:6500,yari:10000,final:15000,finalist:8000,sampiyon:25000},
  UEFA:{lig_galibiyet:300,lig_beraberlik:100,playoff:600, son16:1500,ceyrek:2500,yari:4000, final:6000, finalist:3000,sampiyon:10000},
  CON: {lig_galibiyet:150,lig_beraberlik:50, playoff:300, son16:700, ceyrek:1200,yari:2000, final:3000, finalist:1500,sampiyon:5000},
};
// Tura ulaşma → prim anahtarı
const EURO_PRIM_ROUND={po:"playoff",r16:"son16",qf:"ceyrek",sf:"yari",fin:"final"};

// ── Sezonun Avrupa kurası: 3 tablo + kullanıcı fikstürü + kura modalı verisi ──
// peg: {swiss:true, quals:{CL,UEFA,CON}|null, force?, seed?, rebuild?}
// Geçmiş haftalar (yüklenen eski kayıt / geç kura) kullanıcı dahil simüle edilir.
const buildEuroSeasonDraw=(season,peg)=>{
  const teams=season.teams||[];
  const byName={};teams.forEach(t=>{byName[t.n]=t;});
  let quals=peg&&peg.quals;
  if(quals){
    // Sezon sonu kontenjanını güncel güç/me bilgisiyle tazele
    quals={CL:[],UEFA:[],CON:[]};
    EURO_COMP_LIST.forEach(c=>{quals[c]=(peg.quals[c]||[]).map(t=>{const cur=byName[t.n];return cur?{n:cur.n,lg:cur.lg,str:cur.str||t.str,me:!!cur.me}:{...t,me:false};});});
    // Kullanıcının hakkı varsa (force) ama listede yoksa (ad uyuşmazlığı vb.): aynı ligin en zayıfını çıkarıp ekle
    const meT=teams.find(t=>t.me);
    if(peg.force&&quals[peg.force]&&meT&&!EURO_COMP_LIST.some(c=>quals[c].some(t=>t.me))){
      const list=quals[peg.force].filter(t=>t.n!==meT.n);
      const sameLg=list.filter(t=>t.lg===meT.lg).sort((a,b)=>a.str-b.str);
      const drop=sameLg[0]||[...list].sort((a,b)=>a.str-b.str)[0];
      quals[peg.force]=[...list.filter(t=>t!==drop),{n:meT.n,lg:meT.lg,str:meT.str||65,me:true}].slice(0,36);
    }
  } else {
    quals=selectEuroQualifiers(teams,{byStr:true,force:(peg&&peg.force)||null,noMe:!!(peg&&peg.rebuild&&!peg.force)});
  }
  const allFix=[...(season.results||[]),...(season.fixture||[])];
  const seed=(peg&&peg.seed)||((season.played||0)*7919+teams.length*31+(Date.now()%1000003));
  const lastLigW=Math.max(0,...(season.results||[]).filter(r=>!EURO_CUP_COMPS.includes(r.comp)&&(r.w||0)<1000).map(r=>r.w||0));
  const tables={}, userFix=[];let kura=null;
  EURO_COMP_LIST.forEach(c=>{
    let tbl=createEuroTable(c,quals[c],allFix,seed);
    if(!tbl){tables[EURO_TABLE_KEY[c]]=null;return;}
    let koFix=[];
    if(lastLigW>0){const r=advanceEuroTable(tbl,lastLigW,{catchUp:true});tbl=r.tbl;koFix=r.fix;}
    tables[EURO_TABLE_KEY[c]]=tbl;
    const me=tbl.teams.find(t=>t.me);
    if(!me) return;
    userFix.push(...euroUserLeagueFixtures(tbl,lastLigW),...koFix.filter(f=>f.w/100>lastLigW));
    const lgOf={};tbl.teams.forEach(t=>{lgOf[t.n]=t;});
    kura={comp:c,
      pots:Array.from({length:EURO_META[c].pots},(_,i)=>tbl.teams.filter(t=>t.pot===i+1).map(t=>({n:t.n,lg:t.lg,me:!!t.me}))),
      opps:tbl.matches.filter(m=>m.h===me.n||m.a===me.n).sort((a,b)=>a.md-b.md).map(m=>{const o=m.h===me.n?m.a:m.h;
        return {n:o,lg:lgOf[o].lg,pot:lgOf[o].pot,home:m.h===me.n,md:m.md,month:(tbl.cal.md[m.md-1]||{}).month||""};}),
    };
  });
  return {tables,userFix,kura};
};
