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

  const usedMins=new Set();
  const pickMin=(lo,hi)=>{
    let m;
    let tries=0;
    do{ m=lo+Math.floor(Math.random()*(hi-lo)); tries++; }while((usedMins.has(m)||[...usedMins].some(u=>Math.abs(u-m)<4))&&tries<30);
    usedMins.add(m);
    return m;
  };

  // ROTASYON + COOLDOWN: maçta 5 an; aynı tür bir maçta en çok bir kez, art arda iki an
  //   aynı türden olamaz ve son maçlarda görülen türler (MOMENT_RECENT, oturum boyu) bekletilir.
  //   Ağırlık: hücum türleri; penaltı nadir; savunma (tackle) maçta en çok bir kez, 2. yarıda.
  const atkPool=[...atk,...mid];
  const W={corner:0.8,freekick:1,counter:0.8,scramble:1.1,cross:1.1,through:1.1,oneonone:0.9,longshot:1,penalty:0.45};
  const recent=MOMENT_RECENT.list;
  const pickType=(used,prevType)=>{
    let tot=0; const cand=[];
    for(const t in W){
      if(used.has(t)||t===prevType) continue;
      const ri=recent.lastIndexOf(t);                       // yakın zamanda görüldüyse bekleme cezası
      const cool=ri<0?1:Math.min(1,0.15+0.17*(recent.length-1-ri));
      const w=W[t]*cool; if(w<=0) continue;
      cand.push([t,w]); tot+=w;
    }
    let r=Math.random()*tot;
    for(const [t,w] of cand){ if((r-=w)<=0) return t; }
    return cand.length?cand[cand.length-1][0]:"counter";
  };
  const mins=[pickMin(10,24),pickMin(27,44),pickMin(50,64),pickMin(66,78),pickMin(80,88)].sort((x,y)=>x-y);
  const tackleSlot=Math.random()<0.6?(2+Math.floor(Math.random()*2)):-1;   // 2. yarıda en çok bir savunma anı
  const used=new Set(); let prev=null;
  const plan=mins.map((min,i)=>{
    const type=i===tackleSlot?"tackle":pickType(used,prev);
    used.add(type); prev=type;
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

// Kilit an sonuç metinleri (2D InteractiveMoment ve 3D InteractiveMoment3D ortak)
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

// Kilit an başarı şansı (2D ve 3D ortak). extra: 3D rota kalitesi terimi (2D'de 0).
// Math.random çağrı sırası eski satırla aynı (önce şans gürültüsü, sonra başarı zarı).
function calcMomentChance(player,opt,power,extra=0){
  const baseOvr=(player.ovr||65)/100;
  const statVal=(player[opt.stat]||60)/100;
  const powerBonus=power>=40&&power<=80?0.12:power>=25&&power<=90?0.04:-0.08;
  return Math.min(0.92,Math.max(0.08,baseOvr*0.35+statVal*0.35+opt.bonus*0.25+powerBonus+(Math.random()*0.10-0.05)+(Number.isFinite(extra)?extra:0)));
}

// İnteraktif An Overlay bileşeni
function InteractiveMoment({moment, myStr, oppStr, onResolve}){
  const [chosen,setChosen]=useState(null);
  const [result,setResult]=useState(null);
  const [animOut,setAnimOut]=useState(false);
  const [powerFill,setPowerFill]=useState(0);
  const powerRef=useRef(0);
  const powerDirRef=useRef(1);
  const powerRafRef=useRef(null);
  const {config,player,min}=moment;

  useEffect(()=>{
    if(chosen) return;
    const speed=2.2;
    const tick=()=>{
      powerRef.current+=powerDirRef.current*speed;
      if(powerRef.current>=100){powerRef.current=100;powerDirRef.current=-1;}
      if(powerRef.current<=0){powerRef.current=0;powerDirRef.current=1;}
      setPowerFill(Math.round(powerRef.current));
      powerRafRef.current=requestAnimationFrame(tick);
    };
    powerRafRef.current=requestAnimationFrame(tick);
    return()=>cancelAnimationFrame(powerRafRef.current);
  },[chosen]);

  const resolve=(opt)=>{
    if(chosen) return;
    cancelAnimationFrame(powerRafRef.current);
    const frozenPower=powerRef.current;
    setChosen(opt.id);
    const chance=calcMomentChance(player,opt,frozenPower);
    const success=Math.random()<chance;
    const msg=getMomentMsg(moment.type,opt.id,success,player.n);
    const isTackle=moment.type==="tackle";
    const goalScored=!isTackle&&success;
    const goalConceded=isTackle&&!success&&Math.random()>0.4;
    setTimeout(()=>setResult({success,msg,goalScored,goalConceded,chance:Math.round(chance*100),power:Math.round(frozenPower)}),300);
    setTimeout(()=>{setAnimOut(true);setTimeout(()=>onResolve({success,goalScored,goalConceded,optionId:opt.id,player:player.n,momentType:moment.type,msg}),400);},2800);
  };

  const pitchPos={corner:[86,45],freekick:[76,28],counter:[62,50],penalty:[88,50],oneonone:[83,50],tackle:[28,50],
    scramble:[87,45],cross:[80,12],through:[62,48],longshot:[71,46]};
  const [px,py]=pitchPos[moment.type]||[70,50];
  const isTackleType=moment.type==="tackle";
  const powerCol=powerFill<30?"#e74c3c":powerFill<45?"#e67e22":powerFill<=80?"#2ecc71":"#e74c3c";

  return(
    <div style={{position:"fixed",inset:0,zIndex:500,background:"rgba(0,0,0,.93)",
      display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"8px 10px",
      animation:animOut?"nsmFadeOut .4s forwards":"nsmSlideIn .3s cubic-bezier(.16,1,.3,1)"}}>
      <div style={{width:"min(98vw,440px)",background:`linear-gradient(90deg,${config.color},${config.color}bb)`,
        borderRadius:"10px 10px 0 0",padding:"8px 14px",display:"flex",alignItems:"center",gap:10}}>
        <span style={{fontSize:"1.8rem",filter:"drop-shadow(0 2px 4px rgba(0,0,0,.5))"}}>{config.icon}</span>
        <div style={{flex:1}}>
          <div style={{fontSize:"1rem",fontWeight:900,letterSpacing:3,color:"#fff",
            textShadow:"0 2px 4px rgba(0,0,0,.4)",fontFamily:"'Barlow Condensed',sans-serif"}}>{config.label}</div>
          <div style={{fontSize:".46rem",color:"rgba(255,255,255,.8)",letterSpacing:1}}>{min}. DAKİKA</div>
        </div>
        <div style={{textAlign:"center",background:"rgba(0,0,0,.25)",borderRadius:6,padding:"4px 10px"}}>
          <div style={{fontSize:".36rem",color:"rgba(255,255,255,.7)",letterSpacing:1}}>OVR</div>
          <div style={{fontSize:"1.4rem",fontWeight:900,color:"#fff",lineHeight:1,fontFamily:"'Barlow Condensed',sans-serif"}}>{player.ovr}</div>
        </div>
      </div>
      <div style={{width:"min(98vw,440px)",background:"linear-gradient(180deg,#0d1e10 0%,#071208 100%)",
        border:`2px solid ${config.color}`,borderTop:"none",borderRadius:"0 0 10px 10px",overflow:"hidden",
        boxShadow:`0 8px 40px ${config.color}44`}}>
        <div style={{position:"relative",height:68,
          background:"linear-gradient(180deg,#1d6b1d 0%,#236a23 50%,#1d6b1d 100%)",
          borderBottom:`2px solid ${config.color}44`,overflow:"hidden"}}>
          {[0,1,2,3,4,5,6,7].map(i=>(
            <div key={i} style={{position:"absolute",top:0,bottom:0,left:`${i*12.5}%`,width:"12.5%",
              background:i%2===0?"rgba(0,0,0,.06)":"rgba(255,255,255,.03)"}}/>
          ))}
          <svg width="100%" height="100%" style={{position:"absolute",inset:0,zIndex:1}} viewBox="0 0 400 136" preserveAspectRatio="none">
            <rect x="8" y="4" width="384" height="128" stroke="rgba(255,255,255,.5)" strokeWidth="1.5" fill="none"/>
            <line x1="200" y1="4" x2="200" y2="132" stroke="rgba(255,255,255,.4)" strokeWidth="1"/>
            <circle cx="200" cy="68" r="26" stroke="rgba(255,255,255,.35)" strokeWidth="1" fill="none"/>
            <rect x="8" y="40" width="50" height="56" stroke="rgba(255,255,255,.45)" strokeWidth="1" fill="rgba(255,255,255,.03)"/>
            <rect x="342" y="40" width="50" height="56" stroke="rgba(255,255,255,.45)" strokeWidth="1" fill="rgba(255,255,255,.03)"/>
            <rect x="0" y="53" width="8" height="30" stroke="rgba(255,255,255,.5)" strokeWidth="1" fill="rgba(192,57,43,.2)"/>
            <rect x="392" y="53" width="8" height="30" stroke="rgba(255,255,255,.5)" strokeWidth="1" fill="rgba(45,143,255,.2)"/>
          </svg>
          <div style={{position:"absolute",left:`${px}%`,top:`${py}%`,transform:"translate(-50%,-50%)",zIndex:4}}>
            <div style={{width:14,height:14,borderRadius:"50%",
              background:isTackleType?"#e74c3c":config.color,border:"2px solid #fff",
              boxShadow:`0 0 10px ${config.color},0 0 20px ${config.color}55`,
              animation:"nsmPulse .8s ease-in-out infinite"}}/>
            <div style={{position:"absolute",top:16,left:"50%",transform:"translateX(-50%)",
              fontSize:".34rem",color:"#fff",fontWeight:800,whiteSpace:"nowrap",
              background:"rgba(0,0,0,.75)",padding:"1px 4px",borderRadius:2,letterSpacing:.5}}>
              {player.n.split(" ").pop()}
            </div>
          </div>
          <div style={{position:"absolute",left:isTackleType?`${px+9}%`:`${px-5}%`,top:`${py}%`,
            transform:"translate(-50%,-50%)",zIndex:3}}>
            <div style={{width:9,height:9,borderRadius:"50%",background:"#fff",
              boxShadow:"0 0 7px rgba(255,255,255,.9)"}}/>
          </div>
          <div style={{position:"absolute",left:3,top:"50%",transform:"translateY(-50%)",zIndex:5,
            fontSize:".34rem",color:C.red2,fontWeight:800,background:"rgba(0,0,0,.8)",
            padding:"1px 4px",borderRadius:2,letterSpacing:1}}>OPP</div>
          <div style={{position:"absolute",right:3,top:"50%",transform:"translateY(-50%)",zIndex:5,
            fontSize:".34rem",color:"#4af",fontWeight:800,background:"rgba(0,0,0,.8)",
            padding:"1px 4px",borderRadius:2,letterSpacing:1}}>SEN</div>
        </div>
        <div style={{padding:"7px 14px 3px",display:"flex",alignItems:"center",gap:8}}>
          <div style={{flex:1}}>
            <div style={{fontSize:".82rem",fontWeight:800,color:"#fff",
              fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:.5}}>{player.n}</div>
            <div style={{fontSize:".5rem",color:"rgba(255,255,255,.55)",fontStyle:"italic",marginTop:1}}>{config.desc}</div>
          </div>
          <div style={{display:"flex",gap:6}}>
            {["sht","pas","def","spd"].map(s=>{
              const val=player[s]||55;
              const isKey=config.options.some(o=>o.stat===s);
              return(
                <div key={s} style={{textAlign:"center",opacity:isKey?1:0.3}}>
                  <div style={{fontSize:".34rem",color:isKey?config.color:"rgba(255,255,255,.4)",letterSpacing:.5,fontWeight:700,textTransform:"uppercase"}}>{s}</div>
                  <div style={{fontSize:".72rem",fontWeight:800,color:isKey?config.color:"rgba(255,255,255,.4)",fontFamily:"'Barlow Condensed',sans-serif"}}>{val}</div>
                </div>
              );
            })}
          </div>
        </div>
        {!chosen&&(
          <div style={{padding:"2px 14px 6px"}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{fontSize:".42rem",color:"rgba(255,255,255,.5)",letterSpacing:1,minWidth:28,fontWeight:700}}>GÜÇ</div>
              <div style={{flex:1,height:8,background:"rgba(255,255,255,.08)",borderRadius:4,overflow:"hidden",position:"relative"}}>
                <div style={{position:"absolute",left:"40%",width:"40%",top:0,bottom:0,
                  background:"rgba(46,204,113,.15)",borderLeft:"1px solid rgba(46,204,113,.5)",
                  borderRight:"1px solid rgba(46,204,113,.5)"}}/>
                <div style={{height:"100%",width:`${powerFill}%`,
                  background:"linear-gradient(90deg,#e74c3c 0%,#e67e22 30%,#2ecc71 45%,#2ecc71 75%,#e74c3c 100%)",
                  borderRadius:4}}/>
              </div>
              <div style={{fontSize:".58rem",fontWeight:800,color:powerCol,minWidth:24,textAlign:"right",
                fontFamily:"'Barlow Condensed',sans-serif"}}>{powerFill}</div>
            </div>
            <div style={{fontSize:".36rem",color:"rgba(46,204,113,.55)",textAlign:"center",marginTop:2,letterSpacing:.5}}>
              ← YEŞİL BÖLGEDE SEÇ →
            </div>
          </div>
        )}
        {!result?(
          <div style={{padding:"4px 10px 12px",display:"flex",flexDirection:"column",gap:6}}>
            {config.options.map(opt=>{
              const statVal=player[opt.stat]||55;
              const isChosen=chosen===opt.id;
              const isOther=chosen&&!isChosen;
              return(
                <button key={opt.id} disabled={!!chosen} onClick={()=>resolve(opt)} style={{
                  display:"flex",alignItems:"center",gap:10,padding:"9px 12px",
                  background:isChosen?`${config.color}30`:"rgba(255,255,255,.05)",
                  border:`2px solid ${isChosen?config.color:isOther?"rgba(255,255,255,.03)":"rgba(255,255,255,.14)"}`,
                  borderRadius:9,cursor:chosen?"default":"pointer",fontFamily:"inherit",
                  transition:"all .12s",transform:isChosen?"scale(1.02)":"scale(1)",
                  opacity:isOther?0.25:1,
                  boxShadow:isChosen?`0 0 20px ${config.color}44`:"none"}}>
                  <div style={{width:38,height:38,borderRadius:8,flexShrink:0,
                    background:isChosen?`${config.color}40`:"rgba(255,255,255,.07)",
                    border:`1.5px solid ${isChosen?config.color:"rgba(255,255,255,.1)"}`,
                    display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.3rem"}}>{opt.icon}</div>
                  <div style={{flex:1,textAlign:"left"}}>
                    <div style={{fontSize:".76rem",fontWeight:800,color:isChosen?config.color:"#fff",
                      fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:.5,marginBottom:2}}>{opt.label}</div>
                    <div style={{fontSize:".46rem",color:"rgba(255,255,255,.4)",lineHeight:1.3}}>{opt.desc}</div>
                  </div>
                  <div style={{textAlign:"center",flexShrink:0,width:32}}>
                    <div style={{fontSize:".34rem",color:isChosen?config.color:"rgba(255,255,255,.35)",
                      letterSpacing:.5,fontWeight:700,marginBottom:2,textTransform:"uppercase"}}>{opt.stat}</div>
                    <div style={{height:28,width:6,background:"rgba(255,255,255,.08)",borderRadius:3,
                      overflow:"hidden",margin:"0 auto",position:"relative"}}>
                      <div style={{position:"absolute",bottom:0,left:0,right:0,height:`${statVal}%`,
                        background:isChosen?config.color:"rgba(255,255,255,.28)",borderRadius:3}}/>
                    </div>
                    <div style={{fontSize:".56rem",fontWeight:800,marginTop:2,
                      color:isChosen?config.color:"rgba(255,255,255,.45)",
                      fontFamily:"'Barlow Condensed',sans-serif"}}>{statVal}</div>
                  </div>
                </button>
              );
            })}
          </div>
        ):(
          <div style={{padding:"14px 14px 18px",textAlign:"center"}}>
            <div style={{fontSize:result.goalScored?"3.2rem":"2.2rem",marginBottom:6,
              animation:"nsmBounce .5s cubic-bezier(.36,.07,.19,.97)",
              filter:result.goalScored?"drop-shadow(0 0 20px #2ecc71)":result.goalConceded?"drop-shadow(0 0 16px #e74c3c)":"none"}}>
              {result.goalScored?"⚽":result.goalConceded?"😨":result.success?"✅":"❌"}
            </div>
            {result.goalScored&&(
              <div style={{fontSize:"1.1rem",fontWeight:900,letterSpacing:4,color:"#2ecc71",marginBottom:6,
                fontFamily:"'Barlow Condensed',sans-serif",textShadow:"0 0 20px rgba(46,204,113,.8)",
                animation:"nsmGolText .4s ease"}}>G O L !</div>
            )}
            <div style={{fontSize:".68rem",fontWeight:700,lineHeight:1.5,marginBottom:8,padding:"0 8px",
              color:result.goalScored?"#2ecc71":result.goalConceded?"#e74c3c":result.success?"#2ecc71":"#e67e22"}}>
              {result.msg}
            </div>
            <div style={{display:"flex",justifyContent:"center",gap:10,fontSize:".42rem",color:"rgba(255,255,255,.3)"}}>
              <span>Güç: {result.power}</span><span>·</span>
              <span>Şans: %{result.chance}</span><span>·</span>
              <span style={{color:result.success?"#2ecc71":"#e74c3c"}}>{result.success?"✓ Başarılı":"✗ Başarısız"}</span>
            </div>
          </div>
        )}
      </div>
      <style>{`
        @keyframes nsmSlideIn{from{opacity:0;transform:translateY(40px) scale(.95)}to{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes nsmFadeOut{from{opacity:1;transform:scale(1)}to{opacity:0;transform:scale(.95)}}
        @keyframes nsmPulse{0%,100%{transform:translate(-50%,-50%) scale(1)}50%{transform:translate(-50%,-50%) scale(1.6);opacity:.7}}
        @keyframes nsmBounce{0%{transform:scale(0) rotate(-10deg)}60%{transform:scale(1.3) rotate(3deg)}100%{transform:scale(1) rotate(0)}}
        @keyframes nsmGolText{0%{transform:scale(0.5);opacity:0}100%{transform:scale(1);opacity:1}}
      `}</style>
    </div>
  );
}
