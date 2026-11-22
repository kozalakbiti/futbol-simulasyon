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
  // ── SÜPER LİG ──────────────────────────────────────────────
  {n:"Galatasaray FC", name:"Galatasaray FC", pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:84,stad:"Rams Park",      city:"İstanbul",  lg:"Elit Lig"},
  {n:"Fenerbahce FC",  name:"Fenerbahce FC",  pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:82,stad:"Ülker Stadyumu", city:"İstanbul",  lg:"Elit Lig"},
  {n:"FC Yildiz",   name:"FC Yildiz",   pts:0, w:0, d:0,l:0,gf:0, ga:0, gd:0, me:true, str:63,stad:"Yildiz Arena",   city:"Ankara",    lg:"1. Lig"},
  {n:"Besiktas FC",    name:"Besiktas FC",    pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0, me:false,str:78,stad:"Tüpraş Stadyumu",city:"İstanbul",  lg:"Elit Lig"},
  {n:"Trabzonspor FC", name:"Trabzonspor FC", pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0, me:false,str:76,stad:"Medical Park",  city:"Trabzon",   lg:"Elit Lig"},
  {n:"Basaksehir FC",  name:"Basaksehir FC",  pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0, me:false,str:72,stad:"Başakşehir St.",city:"İstanbul",  lg:"Elit Lig"},
  {n:"Konyaspor FC",   name:"Konyaspor FC",   pts:0,w:0, d:0,l:0,gf:0,ga:0,gd:0,me:false,str:65,stad:"Konya Stadyumu",city:"Konya",     lg:"Elit Lig"},
  {n:"Alanyaspor FC",  name:"Alanyaspor FC",  pts:0,w:0, d:0,l:0,gf:0,ga:0,gd:0,me:false,str:62,stad:"Bahçeşehir",   city:"Alanya",    lg:"Elit Lig"},
  {n:"Sivasspor FC",   name:"Sivasspor FC",   pts:0,w:0, d:0,l:0,gf:0,ga:0,gd:0,me:false,str:60,stad:"4 Eylül St.", city:"Sivas",    lg:"Elit Lig"},
  {n:"Kasimpasa FC",   name:"Kasimpasa FC",   pts:0,w:0, d:0,l:0,gf:0,ga:0,gd:0,me:false,str:60,stad:"Recep Tayyip",city:"İstanbul",  lg:"Elit Lig"},
  {n:"Rizespor FC",    name:"Rizespor FC",    pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:60,stad:"Rize Stad.",    city:"Rize",     lg:"Elit Lig"},
  {n:"Antalyaspor FC", name:"Antalyaspor FC", pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:61,stad:"Antalya Stad.",city:"Antalya",   lg:"Elit Lig"},
  {n:"Hatayspor FC",   name:"Hatayspor FC",   pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:62,stad:"Hatay Stad.",  city:"Hatay",     lg:"Elit Lig"},
  // ── PREMIER LEAGUE ─────────────────────────────────────────
  {n:"Eastfield City",    name:"Eastfield City",    pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:92,stad:"Etihad Stadium",city:"Manchester",lg:"İngiliz Ligi"},
  {n:"Northon City",     name:"Northon City",     pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:90,stad:"Emirates St.",  city:"London",    lg:"İngiliz Ligi"},
  {n:"Mersey Reds",   name:"Mersey Reds",   pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:89,stad:"Anfield",       city:"Mersey Reds", lg:"İngiliz Ligi"},
  {n:"Westbridge FC",     name:"Westbridge FC",     pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:85,stad:"Stamford Bridge",city:"London",   lg:"İngiliz Ligi"},
  {n:"Tyneside FC",   name:"Tyneside FC",   pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:82,stad:"St.James Park", city:"Tyneside FC", lg:"İngiliz Ligi"},
  {n:"Midfield Villa", name:"Midfield Villa", pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:81,stad:"Villa Park",    city:"Birmingham",lg:"İngiliz Ligi"},
  {n:"Southgate Hotspur",   name:"Southgate Hotspur",   pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0, me:false,str:80,stad:"Spurs Stadium",city:"London",  lg:"İngiliz Ligi"},
  {n:"Redford United",     name:"Redford United",     pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:78,stad:"Old Trafford",  city:"Manchester",lg:"İngiliz Ligi"},
  {n:"Seagulls FC",    name:"Seagulls FC",    pts:0,w:0, d:0,l:0,gf:0,ga:0,gd:0,me:false,str:76,stad:"Amex Stadium",  city:"Seagulls FC",  lg:"İngiliz Ligi"},
  {n:"Riverside FC",   name:"Riverside FC",   pts:0,w:0, d:0,l:0,gf:0,ga:0,gd:0,me:false,str:74,stad:"Brentford C.G.",city:"London",   lg:"İngiliz Ligi"},
  {n:"East Hammers",    name:"East Hammers",    pts:0,w:0, d:0,l:0,gf:0,ga:0,gd:0,me:false,str:72,stad:"London Stadium",city:"London",  lg:"İngiliz Ligi"},
  {n:"Goodfields FC",     name:"Goodfields FC",     pts:0,w:0, d:0,l:0,gf:0,ga:0,gd:0,me:false,str:70,stad:"Goodison Park",city:"Mersey Reds",lg:"İngiliz Ligi"},
  // ── LA LIGA ─────────────────────────────────────────────────
  {n:"Real Madreno", name:"Real Madreno", pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:95,stad:"Bernabéu",      city:"Madrid",    lg:"İspanyol Ligi"},
  {n:"FC Cataluña",   name:"FC Cataluña",   pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:92,stad:"Olímpic L.C.",  city:"FC Cataluña", lg:"İspanyol Ligi"},
  {n:"Atletico Madreno",    name:"Atletico Madreno",    pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:86,stad:"Metropolitano", city:"Madrid",    lg:"İspanyol Ligi"},
  {n:"Real Sociedad",    name:"Real Sociedad",    pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0, me:false,str:80,stad:"Reale Arena",   city:"San Sebastián",lg:"İspanyol Ligi"},
  {n:"Villareal CF",  name:"Villareal CF",  pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0, me:false,str:78,stad:"Estadio Madrigal",city:"Villareal CF",lg:"İspanyol Ligi"},
  {n:"Valencia CF",    name:"Valencia CF",    pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:75,stad:"Mestalla",      city:"Valencia CF",  lg:"İspanyol Ligi"},
  {n:"Real Betis",       name:"Real Betis",       pts:0,w:0, d:0,l:0,gf:0,ga:0,gd:0,me:false,str:74,stad:"Benito Villamarin",city:"Sevilia FC",lg:"İspanyol Ligi"},
  {n:"Sevilia FC",     name:"Sevilia FC",     pts:0,w:0, d:0,l:0,gf:0,ga:0,gd:0,me:false,str:73,stad:"Ramón Sánchez",city:"Sevilia FC",    lg:"İspanyol Ligi"},
  // ── BUNDESLIGA ──────────────────────────────────────────────
  {n:"Bayern FC",      name:"Bayern FC",      pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:93,stad:"Allianz Arena", city:"München",   lg:"Alman Ligi"},
  {n:"Leverkusen FC",  name:"Leverkusen FC",  pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:89,stad:"BayArena",      city:"Leverkusen FC",lg:"Alman Ligi"},
  {n:"Dortmund BV",    name:"Dortmund BV",    pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:84,stad:"Signal Iduna",  city:"Dortmund BV",  lg:"Alman Ligi"},
  {n:"Leipzig RB",     name:"Leipzig RB",     pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:83,stad:"Red Bull Arena",city:"Leipzig RB",   lg:"Alman Ligi"},
  {n:"Frankfurt EFC",   name:"Frankfurt EFC",   pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0, me:false,str:78,stad:"Deutsche Bank P.",city:"Frankfurt EFC",lg:"Alman Ligi"},
  {n:"Stuttgart VfB",   name:"Stuttgart VfB",   pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0, me:false,str:77,stad:"MHPArena",      city:"Stuttgart VfB", lg:"Alman Ligi"},
  {n:"M'gladbach",  name:"M'gladbach",  pts:0,w:0, d:0,l:0,gf:0,ga:0,gd:0,me:false,str:72,stad:"Borussia-Park", city:"Mönchengladbach",lg:"Alman Ligi"},
  {n:"Wolfsburg FC",   name:"Wolfsburg FC",   pts:0,w:0, d:0,l:0,gf:0,ga:0,gd:0,me:false,str:70,stad:"Volkswagen Arena",city:"Wolfsburg FC",lg:"Alman Ligi"},
  // ── SERIE A ─────────────────────────────────────────────────
  {n:"FC Internazionale",       name:"FC Internazionale",       pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:91,stad:"San Siro",       city:"Milano",    lg:"İtalyan Ligi"},
  {n:"Juventus FC",    name:"Juventus FC",    pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:86,stad:"Juventus Stadium",city:"Torino FC",   lg:"İtalyan Ligi"},
  {n:"AC Milanese",    name:"AC Milanese",    pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:85,stad:"San Siro",       city:"Milano",    lg:"İtalyan Ligi"},
  {n:"SSC Partenopei",      name:"SSC Partenopei",      pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:84,stad:"Diego Armando Maradona",city:"SSC Partenopei",lg:"İtalyan Ligi"},
  {n:"AS Romasso",        name:"AS Romasso",        pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0, me:false,str:80,stad:"Olimpico",       city:"AS Romasso",      lg:"İtalyan Ligi"},
  {n:"SS Lazione",       name:"SS Lazione",       pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0, me:false,str:78,stad:"Olimpico",       city:"AS Romasso",      lg:"İtalyan Ligi"},
  {n:"ACF Fiorentina",  name:"ACF Fiorentina",  pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0, me:false,str:75,stad:"Artemio Franchi",city:"Firenze",  lg:"İtalyan Ligi"},
  {n:"Atalanta BC B",    name:"Atalanta BC B",    pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:82,stad:"Gewiss Stadium", city:"Bergamo",   lg:"İtalyan Ligi"},
  // ── LIGUE 1 ─────────────────────────────────────────────────
  {n:"Paris SG",         name:"Paris SG",         pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:94,stad:"Parc des Princes",city:"Paris",   lg:"Fransız Ligi"},
  {n:"AS Monaco B",      name:"AS Monaco B",      pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:80,stad:"Stade Louis II", city:"AS Monaco B",    lg:"Fransız Ligi"},
  {n:"OM Marseille",   name:"OM Marseille",   pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:78,stad:"Vélodrome",      city:"OM Marseille", lg:"Fransız Ligi"},
  {n:"OL Lyon",        name:"OL Lyon",        pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0, me:false,str:76,stad:"Groupama Stadium",city:"OL Lyon",    lg:"Fransız Ligi"},
  {n:"RC Lens",        name:"RC Lens",        pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0, me:false,str:75,stad:"Bollaert-Delelis",city:"RC Lens",    lg:"Fransız Ligi"},
  {n:"LOSC Lille",       name:"LOSC Lille",       pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0, me:false,str:74,stad:"Pierre-Mauroy",  city:"LOSC Lille",     lg:"Fransız Ligi"},
  {n:"OGC Nice",        name:"OGC Nice",        pts:0,w:0, d:0,l:0,gf:0,ga:0,gd:0,me:false,str:72,stad:"Allianz Riviera",city:"OGC Nice",     lg:"Fransız Ligi"},
  {n:"Eyupspor FC",    name:"Eyupspor FC",    pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:68,stad:"Eyup St.",     city:"Istanbul",lg:"1. Lig"},
  {n:"Sakaryaspor FC", name:"Sakaryaspor FC", pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:65,stad:"Ataturk St.",  city:"Sakarya", lg:"1. Lig"},
  {n:"Bodrumspor FC",  name:"Bodrumspor FC",  pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:63,stad:"Bodrum St.",   city:"Bodrum",  lg:"1. Lig"},
  {n:"Goztepe FC",     name:"Goztepe FC",     pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:66,stad:"Gursel Aksel", city:"Izmir",   lg:"1. Lig"},
  {n:"Kocaelispor FC", name:"Kocaelispor FC", pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:60,stad:"Izmit St.",    city:"Kocaeli", lg:"1. Lig"},
  {n:"Manisaspor FC",   name:"Manisaspor FC",   pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:58,stad:"Manisa St.",   city:"Manisa",  lg:"1. Lig"},
  {n:"Zonguldakspor FC",    name:"Zonguldakspor FC",    pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:56,stad:"Bolu St.",      city:"Bolu",    lg:"1. Lig"},
  {n:"Adanaspor FC",   name:"Adanaspor FC",   pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:57,stad:"5 Ocak St.",   city:"Adana",   lg:"1. Lig"},
  {n:"Erzurumspor FC", name:"Erzurumspor FC", pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:55,stad:"K.Karabekir",  city:"Erzurum", lg:"1. Lig"},
  {n:"Altinordu FC",   name:"Altinordu FC",   pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:59,stad:"Altinordu FC",    city:"Izmir",   lg:"1. Lig"},
  {n:"Umraniyespor FC",name:"Umraniyespor FC",pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:60,stad:"Umraniye",     city:"Istanbul",lg:"1. Lig"},
  {n:"Bandirmaspor FC",name:"Bandirmaspor FC",pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:57,stad:"Bandirma",     city:"Bandirma",lg:"1. Lig"},
  {n:"Denizlispor FC", name:"Denizlispor FC", pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:58,stad:"Denizli St.",  city:"Denizli", lg:"1. Lig"},
  {n:"Sultangazi FC",  name:"Sultangazi FC",  pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:61,stad:"Pendik St.",   city:"Istanbul",lg:"1. Lig"},
  {n:"Genclerbirligi FC",name:"Genclerbirligi FC",pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:62,stad:"19Mayis",  city:"Ankara",  lg:"1. Lig"},
  {n:"Kecioren FK", name:"Kecioren FK", pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:54,stad:"Kecioren St.", city:"Ankara",  lg:"1. Lig"},
  // ── Premier League eksikler (20 takım) ──
  {n:"Wolverhampton",       name:"Wolverhampton",       pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:68,stad:"Molineux",           city:"Wolverhampton",lg:"İngiliz Ligi"},
  {n:"Crystal FC",name:"Crystal FC",pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:67,stad:"Selhurst Park",    city:"London",       lg:"İngiliz Ligi"},
  {n:"Fulham FC",       name:"Fulham FC",       pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:66,stad:"Craven Cottage",     city:"London",       lg:"İngiliz Ligi"},
  {n:"Bournemouth FC",  name:"Bournemouth FC",  pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:65,stad:"Vitality Stadium",   city:"Bournemouth FC",  lg:"İngiliz Ligi"},
  {n:"Nottingham FC", name:"Nottingham FC", pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:66,stad:"City Ground",        city:"Nottingham FC",   lg:"İngiliz Ligi"},
  {n:"Luton Town",        name:"Luton Town",        pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:60,stad:"Kenilworth Road",    city:"Luton Town",        lg:"İngiliz Ligi"},
  {n:"Burnley FC",      name:"Burnley FC",      pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:62,stad:"Turf Moor",          city:"Burnley FC",      lg:"İngiliz Ligi"},
  {n:"Sheffield FC",name:"Sheffield FC",pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:61,stad:"Bramall Lane",       city:"Sheffield",    lg:"İngiliz Ligi"},
  // ── La Liga eksikler (20 takım) ──
  {n:"CA Osasuna",      name:"CA Osasuna",      pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:64,stad:"El Sadar",           city:"Pamplona",     lg:"İspanyol Ligi"},
  {n:"Celta Vigo",   name:"Celta Vigo",   pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:64,stad:"Balaidos",           city:"Vigo",         lg:"İspanyol Ligi"},
  {n:"Getafe CF",       name:"Getafe CF",       pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:62,stad:"Coliseum Alfonso",   city:"Getafe CF",       lg:"İspanyol Ligi"},
  {n:"RCD Mallorca",     name:"RCD Mallorca",     pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:62,stad:"Son Moix",           city:"Palma",        lg:"İspanyol Ligi"},
  {n:"Girona FC",       name:"Girona FC",       pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:72,stad:"Montilivi",          city:"Girona FC",       lg:"İspanyol Ligi"},
  {n:"Rayo Vallecano",name:"Rayo Vallecano",pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:63,stad:"Vallecas",        city:"Madrid",       lg:"İspanyol Ligi"},
  {n:"UD Almería",      name:"UD Almería",      pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:58,stad:"Power Horse",        city:"UD Almería",      lg:"İspanyol Ligi"},
  {n:"Granada CF",      name:"Granada CF",      pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:60,stad:"Los Carmenes",       city:"Granada CF",      lg:"İspanyol Ligi"},
  {n:"UD Las Palmas",   name:"UD Las Palmas",   pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:61,stad:"Gran Canaria",       city:"UD Las Palmas",   lg:"İspanyol Ligi"},
  {n:"Alaves",       name:"Alaves",       pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:62,stad:"Mendizorroza",       city:"Vitoria",      lg:"İspanyol Ligi"},
  {n:"Athletic Club",name:"Athletic Club",pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:72,stad:"San Mames",          city:"Bilbao",       lg:"İspanyol Ligi"},
  {n:"Valladolid",   name:"Valladolid",   pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:60,stad:"Jose Zorrilla",      city:"Valladolid",   lg:"İspanyol Ligi"},
  // ── Bundesliga eksikler (18 takım) ──
  {n:"SC Freiburg",     name:"SC Freiburg",     pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:68,stad:"Europa-Park",        city:"SC Freiburg",     lg:"Alman Ligi"},
  {n:"Berlin Union", name:"Berlin Union", pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:67,stad:"An der Alten Forsterei",city:"Berlin",   lg:"Alman Ligi"},
  {n:"FSV Mainz",        name:"FSV Mainz",        pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:65,stad:"Mewa Arena",         city:"FSV Mainz",        lg:"Alman Ligi"},
  {n:"TSG Hoffenheim",   name:"TSG Hoffenheim",   pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:65,stad:"PreZero Arena",      city:"TSG Hoffenheim",   lg:"Alman Ligi"},
  {n:"FC Augsburg",     name:"FC Augsburg",     pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:62,stad:"WWK Arena",          city:"FC Augsburg",     lg:"Alman Ligi"},
  {n:"VfL Bochum",       name:"VfL Bochum",       pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:61,stad:"Vonovia Ruhrstadion",city:"VfL Bochum",       lg:"Alman Ligi"},
  {n:"Bremen FC",name:"Bremen FC",pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:66,stad:"Weserstadion",       city:"Bremen",       lg:"Alman Ligi"},
  {n:"FC Heidenheim",   name:"FC Heidenheim",   pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:63,stad:"Voith-Arena",        city:"FC Heidenheim",   lg:"Alman Ligi"},
  {n:"SV Darmstadt",    name:"SV Darmstadt",    pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:59,stad:"Merck-Stadion",      city:"SV Darmstadt",    lg:"Alman Ligi"},
  {n:"Koln",         name:"Koln",         pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:63,stad:"RheinEnergie",       city:"Cologne",      lg:"Alman Ligi"},
  // ── Serie A eksikler (20 takım) ──
  {n:"Torino FC",       name:"Torino FC",       pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:66,stad:"Olimpico Torino",    city:"Turin",        lg:"İtalyan Ligi"},
  {n:"Bologna FC",      name:"Bologna FC",      pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:68,stad:"Renato Dall'Ara",    city:"Bologna FC",      lg:"İtalyan Ligi"},
  {n:"AC Monza",        name:"AC Monza",        pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:64,stad:"U-Power Stadium",    city:"AC Monza",        lg:"İtalyan Ligi"},
  {n:"Genoa CFC",        name:"Genoa CFC",        pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:63,stad:"Luigi Ferraris",     city:"Genoa CFC",        lg:"İtalyan Ligi"},
  {n:"US Lecce",        name:"US Lecce",        pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:62,stad:"Via del Mare",       city:"US Lecce",        lg:"İtalyan Ligi"},
  {n:"Cagliari Calcio",     name:"Cagliari Calcio",     pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:62,stad:"Unipol Domus",       city:"Cagliari Calcio",     lg:"İtalyan Ligi"},
  {n:"Frosinone Calcio",    name:"Frosinone Calcio",    pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:60,stad:"Benito Stirpe",      city:"Frosinone Calcio",    lg:"İtalyan Ligi"},
  {n:"Hellas Verona",name:"Hellas Verona",pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:62,stad:"Bentegodi",          city:"Hellas Verona",       lg:"İtalyan Ligi"},
  {n:"Udinese Calcio",      name:"Udinese Calcio",      pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:63,stad:"Friuli",             city:"Udine",        lg:"İtalyan Ligi"},
  {n:"FC Empoli",       name:"FC Empoli",       pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:62,stad:"Carlo Castellani",   city:"FC Empoli",       lg:"İtalyan Ligi"},
  {n:"US Sassuolo",     name:"US Sassuolo",     pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:64,stad:"Mapei Stadium",      city:"US Sassuolo",     lg:"İtalyan Ligi"},
  {n:"US Salernitana",  name:"US Salernitana",  pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:59,stad:"Arechi",             city:"Salerno",      lg:"İtalyan Ligi"},
  // ── Ligue 1 eksikler (18 takım) ──
  {n:"Stade Rennais",       name:"Stade Rennais",       pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:68,stad:"Roazhon Park",       city:"Stade Rennais",       lg:"Fransız Ligi"},
  {n:"FC Nantes",       name:"FC Nantes",       pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:64,stad:"Beaujoire",          city:"FC Nantes",       lg:"Fransız Ligi"},
  {n:"RC Strasbourg",   name:"RC Strasbourg",   pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:63,stad:"Meinau",             city:"RC Strasbourg",   lg:"Fransız Ligi"},
  {n:"Toulouse FC",     name:"Toulouse FC",     pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:64,stad:"Stadium Toulouse",   city:"Toulouse FC",     lg:"Fransız Ligi"},
  {n:"Montpellier HSC",  name:"Montpellier HSC",  pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:62,stad:"La Mosson",          city:"Montpellier HSC",  lg:"Fransız Ligi"},
  {n:"Brest",        name:"Brest",        pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:65,stad:"Francis-Le Ble",     city:"Brest",        lg:"Fransız Ligi"},
  {n:"Stade de Reims",        name:"Stade de Reims",        pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:63,stad:"Auguste Delaune",    city:"Stade de Reims",        lg:"Fransız Ligi"},
  {n:"Clermont Foot",     name:"Clermont Foot",     pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:60,stad:"Gabriel Montpied",   city:"Clermont Foot",     lg:"Fransız Ligi"},
  {n:"FC Metz",         name:"FC Metz",         pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:61,stad:"Saint-Symphorien",   city:"FC Metz",         lg:"Fransız Ligi"},
  {n:"Le Havre",     name:"Le Havre",     pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:62,stad:"Oceane",             city:"Le Havre",     lg:"Fransız Ligi"},
  {n:"FC Lorient",      name:"FC Lorient",      pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:62,stad:"Moustoir",           city:"FC Lorient",      lg:"Fransız Ligi"},
  // ── Süper Lig eksikler (19 takım) ──
  {n:"Adana Demir FC",name:"Adana Demir FC",pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:63,stad:"Yeni Adana",     city:"Adana",        lg:"Elit Lig"},
  {n:"Gaziantepspor FC", name:"Gaziantepspor FC", pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:61,stad:"Kalyon Stadyumu",    city:"Gaziantep",    lg:"Elit Lig"},
  {n:"Kayserispor FC",  name:"Kayserispor FC",  pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:62,stad:"Kayseri Stadyumu",   city:"Kayseri",      lg:"Elit Lig"},
  {n:"Istanbulspor FC", name:"Istanbulspor FC", pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:59,stad:"Necmi Kadioglu",     city:"Istanbul",     lg:"Elit Lig"},
  {n:"Ankaragucu FC",   name:"Ankaragucu FC",   pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:62,stad:"Eryaman",            city:"Ankara",       lg:"Elit Lig"},
  {n:"Samsunspor FC",   name:"Samsunspor FC",   pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:63,stad:"19 Mayis",           city:"Samsun",       lg:"Elit Lig"},
  {n:"Pendikspor FC",       name:"Pendikspor FC",       pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:60,stad:"Pendik Stadyumu",    city:"Istanbul",     lg:"Elit Lig"},
  // ── TFF 1. Lig eksikler (19 takım) ──
  {n:"Bucaspor FC",     name:"Bucaspor FC",     pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:58,stad:"Buca Stadyumu",      city:"Izmir",        lg:"1. Lig"},
  {n:"Tarsus FK",   name:"Tarsus FK",   pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:53,stad:"Tarsus Stadyumu",    city:"Tarsus",       lg:"1. Lig"},
  {n:"Elazig FK",    name:"Elazig FK",    pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:55,stad:"Elazig Stadyumu",    city:"Elazig",       lg:"1. Lig"},
  // ── Primeira Liga (18 takım) ──
  {n:"SL Benfica",      name:"SL Benfica",      pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:84,stad:"Estadio da Luz",     city:"Lisbon",      lg:"Portekiz Ligi"},
  {n:"FC Porto",        name:"FC Porto",        pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:83,stad:"Estadio do Dragao",  city:"FC Porto",       lg:"Portekiz Ligi"},
  {n:"Sporting CP",  name:"Sporting CP",  pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:82,stad:"Alvalade",          city:"Lisbon",      lg:"Portekiz Ligi"},
  {n:"SC Braga",        name:"SC Braga",        pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:74,stad:"Estadio Municipal", city:"SC Braga",       lg:"Portekiz Ligi"},
  {n:"Vitoria SC",   name:"Vitoria SC",   pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:67,stad:"Afonso Henriques",  city:"Guimaraes",   lg:"Portekiz Ligi"},
  {n:"Rio Ave",      name:"Rio Ave",      pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:64,stad:"Arcos",             city:"Vila do Conde",lg:"Portekiz Ligi"},
  {n:"Famalicao",    name:"Famalicao",    pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:63,stad:"Municipal",         city:"Famalicao",   lg:"Portekiz Ligi"},
  {n:"Casa Pia",     name:"Casa Pia",     pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:65,stad:"Pina Manique",      city:"Lisbon",      lg:"Portekiz Ligi"},
  {n:"Estoril",      name:"Estoril",      pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:62,stad:"Antonio Coimbra",   city:"Estoril",     lg:"Portekiz Ligi"},
  {n:"Arouca",       name:"Arouca",       pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:61,stad:"Municipal de Arouca",city:"Arouca",     lg:"Portekiz Ligi"},
  {n:"Santa Clara",  name:"Santa Clara",  pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:62,stad:"Sao Miguel",        city:"Ponta Delgada",lg:"Portekiz Ligi"},
  {n:"Moreirense",   name:"Moreirense",   pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:61,stad:"Comunitario",       city:"Moreira",     lg:"Portekiz Ligi"},
  {n:"Portimonense", name:"Portimonense", pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:60,stad:"Municipal Portimao",city:"Portimao",    lg:"Portekiz Ligi"},
  {n:"Gil Vicente",  name:"Gil Vicente",  pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:62,stad:"Cidade de Barcelos",city:"Barcelos",    lg:"Portekiz Ligi"},
  {n:"Chaves",       name:"Chaves",       pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:60,stad:"Municipal de Chaves",city:"Chaves",     lg:"Portekiz Ligi"},
  {n:"Boavista",     name:"Boavista",     pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:66,stad:"Bessa",             city:"FC Porto",       lg:"Portekiz Ligi"},
  {n:"Vizela",       name:"Vizela",       pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:59,stad:"Futebol Clube",     city:"Vizela",      lg:"Portekiz Ligi"},
  {n:"Paços Ferreira B",name:"Paços Ferreira B",pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:60,stad:"Capital do Movel",city:"Pacos",      lg:"Portekiz Ligi"},
  // ── Eredivisie (18 takım) ──
  {n:"PSV Eindhoven",          name:"PSV Eindhoven",          pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:86,stad:"Philips Stadion",   city:"Eindhoven",   lg:"Hollanda Ligi"},
  {n:"AFC Ajax",         name:"AFC Ajax",         pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:83,stad:"Johan Cruyff Arena",city:"Amsterdam",   lg:"Hollanda Ligi"},
  {n:"Feyenoord",    name:"Feyenoord",    pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:82,stad:"De Kuip",          city:"Rotterdam",   lg:"Hollanda Ligi"},
  {n:"AZ Alkmaar",   name:"AZ Alkmaar",   pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:76,stad:"AFAS Stadion",     city:"Alkmaar",     lg:"Hollanda Ligi"},
  {n:"FC Utrecht",      name:"FC Utrecht",      pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:72,stad:"Galgenwaard",      city:"FC Utrecht",     lg:"Hollanda Ligi"},
  {n:"FC Twente",       name:"FC Twente",       pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:73,stad:"De Grolsch Veste", city:"Enschede",    lg:"Hollanda Ligi"},
  {n:"Vitesse",      name:"Vitesse",      pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:67,stad:"Gelredome",        city:"Arnhem",      lg:"Hollanda Ligi"},
  {n:"Groningen",    name:"Groningen",    pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:64,stad:"Euroborg",         city:"Groningen",   lg:"Hollanda Ligi"},
  {n:"Heerenveen",   name:"Heerenveen",   pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:65,stad:"Abe Lenstra",      city:"Heerenveen",  lg:"Hollanda Ligi"},
  {n:"NEC Nijmegen", name:"NEC Nijmegen", pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:64,stad:"Goffert",         city:"Nijmegen",    lg:"Hollanda Ligi"},
  {n:"Sparta Rotterdam",name:"Sparta Rotterdam",pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:63,stad:"Het Kasteel",city:"Rotterdam",  lg:"Hollanda Ligi"},
  {n:"Almere City",  name:"Almere City",  pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:62,stad:"Yanmar Stadion",  city:"Almere",      lg:"Hollanda Ligi"},
  {n:"Heracles FC",     name:"Heracles FC",     pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:63,stad:"Polman Stadion",  city:"Almelo",      lg:"Hollanda Ligi"},
  {n:"Go Ahead Eagles",name:"Go Ahead Eagles",pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:62,stad:"De Adelaarshorst",city:"Deventer",lg:"Hollanda Ligi"},
  {n:"RKC Waalwijk", name:"RKC Waalwijk", pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:60,stad:"Mandemakers",    city:"RKC Waalwijk",    lg:"Hollanda Ligi"},
  {n:"Zwolle",       name:"Zwolle",       pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:61,stad:"MAC3PARK",        city:"Zwolle",      lg:"Hollanda Ligi"},
  {n:"Emmen",        name:"Emmen",        pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:59,stad:"De Oude Meerdijk",city:"Emmen",       lg:"Hollanda Ligi"},
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

// TFF 1. Lig rakipleri (15 rakip → 30 maç)
const TFF1_RIVALS=[
  {n:"Eyupspor FC",      str:68},{n:"Sakaryaspor FC",   str:65},{n:"Bodrumspor FC",   str:63},
  {n:"Goztepe FC",       str:66},{n:"Kocaelispor FC",   str:60},{n:"Manisaspor FC",    str:58},
  {n:"Zonguldakspor FC", str:56},{n:"Adanaspor FC",     str:57},{n:"Erzurumspor FC",   str:55},
  {n:"Altinordu FC",     str:59},{n:"Umraniyespor FC",  str:60},{n:"Bandirmaspor FC",  str:57},
  {n:"Denizlispor FC",   str:58},{n:"Sultangazi FC",    str:61},{n:"Genclerbirligi FC",str:62},
  {n:"Kecioren FK",      str:54},{n:"Bucaspor FC",      str:58},{n:"Tarsus FK",        str:53},
  {n:"Elazig FK",        str:55},{n:"Kahramanmarasspor",str:56}, // 20. yedek
];
// Süper Lig rakipleri (17 rakip → 34 maç)
const SL_RIVALS=[
  {n:"Galatasaray FC",  str:88},{n:"Fenerbahce FC",   str:86},{n:"Trabzonspor FC",  str:76},
  {n:"Basaksehir FC",   str:74},{n:"Kasimpasa FC",   str:62},{n:"Sivasspor FC",    str:65},
  {n:"Konyaspor FC",    str:63},{n:"Alanyaspor FC",  str:64},{n:"Rizespor FC",     str:60},
  {n:"Antalyaspor FC",  str:61},{n:"Hatayspor FC",   str:62},{n:"Kayserispor FC",  str:63},
  {n:"Samsunspor FC",   str:61},{n:"Ankaragucu FC",  str:59},{n:"Adana Demir FC",  str:60},
  {n:"Gaziantepspor FC",str:60},{n:"Istanbulspor FC",str:58},
  {n:"Pendikspor FC",   str:57},{n:"Besiktas FC",str:78}, // Yedekler
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
  {n:"SC Braga",      str:74},{n:"Boavista",    str:66},{n:"Casa Pia",    str:65},
  {n:"Vitoria SC", str:67},{n:"Rio Ave",     str:64},{n:"Famalicao",   str:63},
  {n:"Santa Clara",str:62},{n:"Estoril",     str:62},{n:"Gil Vicente", str:62},
  {n:"Arouca",     str:61},{n:"Moreirense",  str:61},{n:"Portimonense",str:60},
  {n:"Chaves",     str:60},{n:"Vizela",      str:59},
  {n:"Paços Ferreira B",str:60}, // Yedek
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
  {n:"PSV Eindhoven",          str:86},{n:"AFC Ajax",         str:83},{n:"Feyenoord",    str:82},
  {n:"AZ Alkmaar",   str:76},{n:"FC Twente",       str:73},{n:"FC Utrecht",      str:72},
  {n:"Vitesse",      str:67},{n:"Heerenveen",   str:65},{n:"Groningen",    str:64},
  {n:"NEC Nijmegen", str:64},{n:"Heracles FC",     str:63},{n:"Sparta Rotterdam",str:63},
  {n:"Go Ahead Eagles",str:62},{n:"Almere City",str:62},{n:"Zwolle",       str:61},
  {n:"RKC Waalwijk", str:60},{n:"Emmen",        str:59},
  {n:"RKC Waalwijk",     str:58}, // Yedek
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

// Büyük 5 lig fikstürü — CAREER_TEAMS içinden o ligin rakiplerini kullanır
const buildBig5Fixture=(lg,excludeName="")=>{
  const shuffle=(a)=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
  const LIG_MONTHS={
    "İngiliz Ligi": TFF1_MONTHS, // 38 hafta
    "İspanyol Ligi":TFF1_MONTHS, // 38 hafta
    "İtalyan Ligi": TFF1_MONTHS, // 38 hafta
    "Fransız Ligi": SL_MONTHS,   // 34 hafta
    "Alman Ligi":   SL_MONTHS,   // 34 hafta
  };
  const mo=LIG_MONTHS[lg]||TFF1_MONTHS;
  const rivals=INIT_TEAMS.filter(t=>t.lg===lg&&t.n!==excludeName);
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
const TFF1_KUPA_OPPS=[
  {n:"Kayserispor FC",str:62},{n:"Bucaspor FC",str:58},{n:"Ankaragucu FC",str:62},
  {n:"Alanyaspor FC",str:60},{n:"Rizespor FC",str:59},{n:"Hatayspor FC",str:61},
  {n:"Adanaspor FC",str:57},{n:"Denizlispor FC",str:58},{n:"Zonguldakspor FC",str:56},
  {n:"Samsunspor FC",str:61},{n:"Altinordu FC",str:55},{n:"Manisaspor FC",str:57},
];
const SL_KUPA_OPPS=[
  {n:"Sivasspor FC",str:65},{n:"Kayserispor FC",str:62},{n:"Antalyaspor FC",str:61},
  {n:"Samsunspor FC",str:60},{n:"Pendikspor FC",str:59},{n:"Kasimpasa FC",str:63},
  {n:"Rizespor FC",str:60},{n:"Alanyaspor FC",str:62},{n:"Hatayspor FC",str:61},
  {n:"Gaziantepspor FC",str:60},{n:"Konyaspor FC",str:61},{n:"Adana Demir FC",str:63},
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
    if(f.comp==="HAZ"||f.comp==="ZTK"||f.comp==="CL"||f.comp==="UEFA"||f.comp==="SUPERKUPA") return;
    const m=f.month||"";
    if(!monthLigW[m]) monthLigW[m]=[];
    monthLigW[m].push(f.w||0);
  });
  Object.keys(monthLigW).forEach(m=>monthLigW[m].sort((a,b)=>a-b));
  // Ay içindeki kupa maçlarını w'ye göre sırala, sonra lig haftaları arasına dağıt
  const monthCupW={};
  fixtures.forEach(f=>{
    if(f.comp!=="ZTK"&&f.comp!=="CL"&&f.comp!=="UEFA"&&f.comp!=="SUPERKUPA") return;
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
    if(f.comp!=="ZTK"&&f.comp!=="CL"&&f.comp!=="UEFA"&&f.comp!=="SUPERKUPA") return;
    const m=f.month||"";
    if(monthCupCounter[m]===undefined) monthCupCounter[m]=0;
    fixCupIdx.set(f, monthCupCounter[m]++);
  });
  const effectiveW=(f)=>{
    if(f.comp==="HAZ") return (f.w||0)===0?-1:(f.w||0);
    if(f.comp==="ZTK"||f.comp==="CL"||f.comp==="UEFA"||f.comp==="SUPERKUPA"){
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
  // Süper Lig
  "Galatasaray FC":"4-2-3-1","Fenerbahce FC":"4-3-3","Besiktas FC":"4-2-3-1",
  "Trabzonspor FC":"4-3-3","Basaksehir FC":"4-4-2","Konyaspor FC":"5-3-2",
  "Alanyaspor FC":"4-3-3","Sivasspor FC":"4-1-4-1","Adana Demir FC":"4-2-3-1",
  "Samsunspor FC":"4-4-2","Bodrumspor FC":"4-2-3-1","Antalyaspor FC":"4-4-2",
  "Kasimpasa FC":"4-3-3","Hatayspor FC":"4-4-2","Kayserispor FC":"5-3-2",
  "Rizespor FC":"4-4-2","Ankaragucu FC":"4-1-4-1","Ankaragucu FC":"4-1-4-1",
  "Pendikspor FC":"4-4-2","Istanbulspor FC":"4-3-3","Gaziantepspor FC":"4-4-2",
  // TFF 1. Lig
  "Eyupspor FC":"4-3-3","Sakaryaspor FC":"4-2-3-1",
  "Goztepe FC":"4-3-3","Kocaelispor FC":"4-4-2","Manisaspor FC":"4-1-4-1",
  "Zonguldakspor FC":"5-3-2","Adanaspor FC":"4-4-2","Erzurumspor FC":"5-3-2",
  "Altinordu FC":"4-3-3","Umraniyespor FC":"4-4-2","Bandirmaspor FC":"4-4-2",
  "Denizlispor FC":"4-2-3-1","Genclerbirligi FC":"4-3-3","Kecioren FK":"5-3-2",
  "Bucaspor FC":"4-4-2","Tarsus FK":"5-3-2","Elazig FK":"4-4-2",
  "Altay FC":"4-2-3-1","Manisaspor FC":"4-4-2",
  // Premier League
  "Eastfield City":"4-3-3","Mersey Reds":"4-3-3","Northon City":"4-3-3",
  "Westbridge FC":"4-2-3-1","Man United":"4-4-2","Southgate Hotspur":"4-2-3-1",
  "Tyneside FC":"4-3-3","Midfield Villa":"4-2-3-1","Seagulls FC":"4-2-3-1",
  "Leicester City":"4-4-2","Wolverhampton":"3-5-2","East Hammers":"4-2-3-1",
  // La Liga
  "Real Madreno":"4-3-3","FC Cataluña":"4-3-3","Atletico Madreno":"4-4-2",
  "Sevilia FC":"4-2-3-1","Villareal CF":"4-4-2","Real Sociedad":"4-3-3",
  "Athletic":"4-2-3-1","CA Osasuna":"4-4-2","Getafe CF":"4-1-4-1","RCD Mallorca":"5-3-2",
  // Bundesliga
  "Bayern FC":"4-2-3-1","Dortmund BV":"4-3-3","Leverkusen FC":"4-2-3-1",
  "Leipzig RB":"4-4-2","TSG Hoffenheim":"4-2-3-1","Koln":"4-4-2",
  "FC Heidenheim":"5-3-2","SC Freiburg":"3-5-2","Frankfurt EFC":"3-5-2",
  "Wolfsburg FC":"4-2-3-1","FSV Mainz":"4-3-3","VfL Bochum":"4-4-2",
  // Serie A
  "FC Internazionale":"3-5-2","AC Milanese":"4-2-3-1","Juventus FC":"3-5-2",
  "SSC Partenopei":"4-3-3","Atalanta BC B":"3-5-2","SS Lazione":"4-3-3",
  "AS Romasso":"3-5-2","Torino FC":"4-4-2","Genoa CFC":"4-4-2","Udinese Calcio":"4-4-2",
  "Bologna FC":"4-2-3-1","ACF Fiorentina":"4-3-3",
  // Ligue 1
  "Paris SG":"4-3-3","OL Lyon":"4-2-3-1","AS Monaco B":"4-3-3","OM Marseille":"4-2-3-1",
  "Stade Rennais":"4-2-3-1","RC Lens":"4-3-3","RC Strasbourg":"4-4-2","Stade de Reims":"4-1-4-1",
  "LOSC Lille":"4-4-2","OGC Nice":"4-3-3","FC Nantes":"4-4-2",
  // Diger Avrupa
  "FC Porto":"4-3-3","SL Benfica":"4-3-3","Sporting CP":"4-2-3-1",
  "AFC Ajax":"4-3-3","Feyenoord":"4-3-3","PSV Eindhoven":"4-3-3",
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
