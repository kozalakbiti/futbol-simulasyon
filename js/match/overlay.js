// ═══════════════════════════════════════════════════════════════
// MAÇ OVERLAY — GELİŞTİRİLMİŞ
// ═══════════════════════════════════════════════════════════════
// Hız ayarları: [interval_ms, dakika_per_tick, flash_süre_ms]
const SPEED_CONFIGS={
  slow:  {ms:280, dpt:1, flash:4500, label:"🐢 Yavaş"},
  normal:{ms:280, dpt:1, flash:4500, label:"▶ Normal"},
  fast:  {ms:45,  dpt:3, flash:1800, label:"⚡ Hızlı"},
};
// 3D görünümde maç saati yavaş akar (×0.6 gerçekçi tempo × ACTORS3D_SLOW; 2D akış aynı kalır).
// Tick aralığı = ms / MATCH3D_TEMPO. Görünüm maç sırasında değişirse interval yeniden kurulur.
const MATCH3D_TEMPO=0.6*(typeof ACTORS3D_SLOW==="number"?ACTORS3D_SLOW:0.55);   // canlı akış temposu (players3d ACTORS3D_SLOW ile aynı oran; Adım 11: %35 hızlı)
// Kilit an öncesi 3D hücum kurulumu için en uzun bekleme (ms): takım son üçte bire varamazsa an yine açılır
const MATCH3D_BUILDUP_MAX_MS=9000;
function matchTickMs(cfg,is3D){ return is3D?Math.round(cfg.ms/MATCH3D_TEMPO):cfg.ms; }
// 3D (2.5D) olay senkronu: bu tiplerde akış metni, flash, skor ve gol sesi topun 3D animasyonu
//   olayın anına varınca (players3d onImpact) gösterilir. SYNC3D_MAX_MS: animasyon hiç bitmezse
//   (sahne kapandı, kilit an açıldı, senaryo kesildi) en geç bu sürede yine gösterilir.
const SYNC3D_TYPES={goal:1,miss:1,header:1,save:1,keeper:1,chance:1,crossbar:1};
const SYNC3D_MAX_MS=12000;   // (atak hazırlığı ACTORS3D_PREP_SEC dahil)

function MatchOverlay({fixture,coachBonus,tacticBonus=0,myStr=74,squad=[],lineup=[],onFinish,clubName="Club Manager: Glory Road",formation="4-4-2"}){
  const [minute,setMinute]=useState(0);
  const [myScore,setMyScore]=useState(0);
  const [oppScore,setOppScore]=useState(0);
  const [log,setLog]=useState([]);
  const [phase,setPhase]=useState("playing"); // playing | halftime | result
  const [poss,setPoss]=useState(52);
  const [tab,setTab]=useState("log");         // log | pitch | stats | ratings
  const [flash,setFlash]=useState(null);      // büyük olay flash
  const [ballPos,setBallPos]=useState([50,50]); // top pozisyonu [x,y]
  const [heatDots,setHeatDots]=useState([]);  // ısı haritası noktaları
  const [speed,setSpeed]=useState("slow");  // slow | normal | fast
  const [soundOn,setSoundOn]=useState(()=>{ try{ return typeof MATCH_SFX==="undefined"||MATCH_SFX.enabled!==false; }catch(_){ return true; } });
  // ── İNTERAKTİF ANLAR ──
  const [activeMoment,setActiveMoment]=useState(null); // aktif müdahale anı
  const [momentBonus,setMomentBonus]=useState(0);      // toplanan gol bonusu
  // ── DEVRE ARASI KONUŞMASI ──
  const [showHalftime,setShowHalftime]=useState(false);
  const [htTacticBonus,setHtTacticBonus]=useState(0); // devre arası taktik bonusu
  // ── RAKİP AI FORMASYON ──
  const [oppFormation,setOppFormation]=useState(()=>getRivalFormation(fixture?.opp,fixture?.str||70));
  const [oppFormChangedAt,setOppFormChangedAt]=useState(null); // taktik değişim dakikası
  // ── CANLI SAHA ANİMASYONU ──
  const [ballEvents,setBallEvents]=useState([]); // aktif saha efektleri [{id,x,y,type,team}]
  // ── MAÇ GÖRÜNÜMÜ ── her zaman 3D (eski 2D radar kaldırıldı). Sahne açılamazsa metin akışı sürer,
  //   sahne birkaç kez kendiliğinden yeniden denenir (pitch3dTry → yeni Pitch3D örneği).
  const viewMode="3d", is3D=true;
  const [pitch3dTry,setPitch3dTry]=useState(0);
  const [pitch3dFail,setPitch3dFail]=useState(false);
  // Kilit anda gol oldu: 3D akış santrayla (golü yiyen takım) başlar
  const kickTeamRef=useRef(null);
  const [cam3D,setCam3D]=useState("top"); // varsayılan: kuşbakışı 2.5D (tribün sahayı kapatmaz)
  const pitch3dApiRef=useRef(null);
  const viewModeRef=useRef(viewMode);
  // Kilit anlar her zaman 3D
  const use3DMoment=()=>true;
  // Gol atanlar (skor tabelası için; motor sonucu değişmez): [{min,team,name}]
  const [goalList,setGoalList]=useState([]);
  // 3D olay kuyruğu: ballEvents'e eklenen her olayın kopyası (son 30). 2D ballEvents
  // olayları 1.1–2.2 sn sonra siler; 3D duraklatılmışken (devre arası, maç sonu)
  // gelen olaylar böylece kaybolmaz. players3d görülen id'leri kendisi ayıklar.
  const events3dQueueRef=useRef([]);
  // Maç bitince 3D önizleme ~4 sn daha oynasın (88–90. dk golü görünsün), sonra dursun
  const [result3dFrozen,setResult3dFrozen]=useState(false);
  useEffect(()=>{
    if(phase!=="result") return;
    const t=setTimeout(()=>setResult3dFrozen(true),4000);
    return()=>clearTimeout(t);
  },[phase]);
  const [playerDots,setPlayerDots]=useState(()=>{
    // FDATA: x=kanat(sol-sağ), y=derinlik(0=rakip kale, 100=kendi kale)
    // Saha görünümü: yatay(sol=OPP kale, sağ=FCY kale), dikey=kanat
    // Dönüşüm: sahaX = 100 - fdata.y  |  sahaY = fdata.x
    const fData=FDATA[formation]||FDATA["4-4-2"];
    return fData.map((slot,i)=>({
      id:i, x:100-(slot.y||50), y:slot.x||50,
      vx:0, vy:0,          // hız vektörü
      pulse:false,
      role:slot.p||"CM",   // pozisyon rolü
      noiseT:Math.random()*100 // perlin benzeri gürültü fazı
    }));
  });
  const ballEvIdRef=useRef(0);
  // Rakip oyuncu noktaları — fizik sistemi ile
  const [oppDots,setOppDots]=useState(()=>{
    const fData=FDATA[oppFormation]||FDATA["4-4-2"];
    return fData.map((slot,i)=>({
      id:i, x:slot.y||50, y:slot.x||50,
      vx:0, vy:0,
      role:slot.p||"CM",
      noiseT:Math.random()*100+50
    }));
  });
  const baseOppDotsRef=useRef((()=>{
    const fData=FDATA[oppFormation]||FDATA["4-4-2"];
    return fData.map((slot,i)=>({id:i,bx:slot.y||50,by:slot.x||50,role:slot.p||"CM"}));
  })());
  // Formasyon bazı pozisyonları — hareket hesabında referans
  const baseDotsRef=useRef((()=>{
    const fData=FDATA[formation]||FDATA["4-4-2"];
    return fData.map((slot,i)=>({id:i,bx:100-(slot.y||50),by:slot.x||50,role:slot.p||"CM"}));
  })());
  const momentsRef=useRef([]);     // planlanmış anlar
  const actors3dRef=useRef(null);  // canlı 3D akış denetleyicisi (createMatchActors3D; sahne yeniden kurulunca yenilenir)
  const buildUpRef=useRef(null);   // {mo,team,t0}: 3D kilit an öncesi hücum kurulumu sürüyor
  const pausedRef=useRef(false);   // interval duraklatıldı mı
  const mountedRef=useRef(true);   // unmount sonrası gecikmeli devam interval başlatmasın
  useEffect(()=>()=>{ mountedRef.current=false; },[]);
  // Bekleyen 3D olay sunumları: id → {fn, timer} (SYNC3D_TYPES; yalnız ref'ler kullanılır → interval
  //   kapanışında da güncel)
  const pending3dRef=useRef(new Map());
  const sync3dOn=()=>viewModeRef.current==="3d"&&!!actors3dRef.current&&!!pitch3dApiRef.current&&
    !(pitch3dApiRef.current.isDisposed&&pitch3dApiRef.current.isDisposed());
  const resolve3d=(id)=>{
    const m=pending3dRef.current, it=m.get(id); if(!it) return;
    m.delete(id); clearTimeout(it.timer);
    try{ it.fn(); }catch(e){ console.error("[3D] olay sunumu hatası",e); }
  };
  const defer3d=(id,fn)=>{
    const timer=setTimeout(()=>resolve3d(id),SYNC3D_MAX_MS);
    pending3dRef.current.set(id,{fn,timer});
  };
  const flush3d=()=>{ Array.from(pending3dRef.current.keys()).forEach(resolve3d); };
  useEffect(()=>()=>{ pending3dRef.current.forEach(it=>clearTimeout(it.timer)); pending3dRef.current.clear(); },[]);
  const lineupRef=useRef(lineup);  // lineup — Babel 500KB koruması
  useEffect(()=>{lineupRef.current=lineup;},[lineup]);
  const result=useRef(null);
  const queue=useRef([]);
  const tick=useRef(0);
  const logRef=useRef(null);
  const htShown=useRef(false);
  const ivRef=useRef(null);
  const speedRef=useRef("slow");
  const soundOnRef=useRef(true);
  const runIntervalRef=useRef(null);

  // ── SES SİSTEMİ (Gerçek Ses Dosyaları) ──────────────────────
  const playSound=(key,vol=1.0,delay=0)=>{
    if(!soundOnRef.current) return;
    const src=SOUNDS[key]; if(!src) return;
    const play=()=>{
      try{
        const a=new Audio(src);
        a.volume=Math.min(1,Math.max(0,vol));
        a.play().catch(()=>{});
      }catch(e){}
    };
    if(delay>0) setTimeout(play,delay); else play();
  };

  // Maç başı düdüğü — hakem düdüğü (kısa)
  // Web Audio sentez sesleri (sfx.js) varsa düdük/tribün onlarla; yoksa kayıtlı sesler
  const sfx=()=>(soundOnRef.current&&typeof MATCH_SFX!=="undefined")?MATCH_SFX:null;
  const playWhistle=(long=false)=>{
    const S=sfx(); if(S){ S.whistle(long?"long":"short"); return; }
    if(long){
      // Devre arası / maç sonu: ref düdüğü
      playSound('whistle_ref',0.9);
    } else {
      // Kısa: metal düdük
      playSound('whistle_short',0.85);
    }
  };

  // Maç sonu: gerçek final düdüğü sesi
  const playFinalWhistle=()=>{ const S=sfx(); if(S){ S.whistle("triple"); return; } playSound('final_whistle',1.0); };

  // Stadyum sesi — gol kutlaması
  const playCrowd=(joy=true,noSynth=false)=>{
    if(!joy) return; // uğultu kaldırıldı
    if(!noSynth){ const S=sfx(); if(S) S.goal(); }      // sentez tribün coşkusu (kayıtlı sesin altında)
    // Gol: önce Mackolik bildirimi, sonra stadyum (2s'de fade-out ile biter)
    playSound('goal_notify',1.0);
    if(soundOnRef.current){
      setTimeout(()=>{
        try{
          const a=new Audio(SOUNDS['stadium_cheer']);
          a.volume=0.85;
          a.play().catch(()=>{});
          // 2 saniye sonra 0.8s içinde azalarak kapat
          setTimeout(()=>{
            const fadeSteps=20;
            const fadeTime=800;
            const stepTime=fadeTime/fadeSteps;
            let step=0;
            const timer=setInterval(()=>{
              step++;
              a.volume=Math.max(0, 0.85*(1-step/fadeSteps));
              if(step>=fadeSteps){ clearInterval(timer); a.pause(); }
            },stepTime);
          },2000);
        }catch(e){}
      },350);
    }
  };

  // Faul düdüğü — metal düdük (kısa)
  const playFoulWhistle=()=>{ const S=sfx(); if(S){ S.whistle("short"); return; } playSound('whistle_short',0.7); };

  useEffect(()=>{ soundOnRef.current=soundOn; try{ if(typeof MATCH_SFX!=="undefined") MATCH_SFX.setEnabled(soundOn); }catch(_){} },[soundOn]);

  // Müdahale anı çözümlendi — skoru güncelle ve maçı devam ettir
  const handleMomentResolve=(res)=>{
    const momentMin=activeMoment?.min||minute;
    setActiveMoment(null);
    // Gol → 3D akış santrayla sürer: golü yiyen takım ortadan başlar, oyuncular mevkilerinde
    if(res.goalScored||res.goalConceded){
      kickTeamRef.current=res.goalScored?"away":"home";
      setTimeout(()=>{ kickTeamRef.current=null; },8000);
      const back=(base)=>(prev)=>prev.map(p=>{ const b=base.find(q=>q.id===p.id); return b?{...p,x:b.bx,y:b.by,vx:0,vy:0,pulse:false}:p; });
      setPlayerDots(back(baseDotsRef.current)); setOppDots(back(baseOppDotsRef.current));
      setBallPos([50,50]);
    }
    // Skor tabelası listesi (yalnız görsel)
    if(res.goalScored) setGoalList(g=>[...g,{min:momentMin,team:"me",name:res.player||""}]);
    else if(res.goalConceded) setGoalList(g=>[...g,{min:momentMin,team:"opp",name:""}]);
    // Gerçekçi skor: kilit an golü, aynı takımın maçın KALANINDA planlı bir golünün yerine geçer
    //   (o pozisyonu kaleci kurtarır); golcü listesi de buna göre güncellenir
    if((res.goalScored||res.goalConceded)&&result.current){
      const tm=res.goalScored?"me":"opp", R=result.current;
      const e=queue.current.find(q=>q.type==="goal"&&q.team===tm&&q.min>momentMin);
      if(e){
        if(tm==="me"){
          const who=res.player||e.scorer;
          R.evs=R.evs.map(q=>q===e?{...e,min:momentMin,scorer:who,assist:null,act:MOMENT_TYPES[res.momentType]?.label||e.act,pos:""}:q)
            .sort((a,b)=>a.min-b.min);
          const at=R.scorers.lastIndexOf(e.scorer);
          if(at>=0){ R.scorers.splice(at,1); R.assisters.splice(at,1); R.scorers.unshift(who); R.assisters.unshift(null); }
        } else R.evs=R.evs.map(q=>q===e?{...e,min:momentMin}:q).sort((a,b)=>a.min-b.min);
        // Kuyrukta gol → savunan takımın kaleci kurtarışı (evs listesi ayrı)
        queue.current=queue.current.map(q=>q===e?{min:e.min,type:"save",team:tm==="me"?"opp":"me",zone:e.zone}:q);
      }
    }
    // Kaçan hücum anı: skorumuza göre (0: %20 · 1: %50 · 2+: %85) sıradaki planlı golümüz gelmez (anlar skoru şişirmesin)
    else if(!res.goalScored&&res.momentType!=="tackle"&&result.current&&Math.random()<(myScore>=2?0.85:myScore===1?0.5:0.2)){
      const R=result.current, e=queue.current.find(q=>q.type==="goal"&&q.team==="me"&&q.min>momentMin);
      if(e){
        const sv={min:e.min,type:"save",team:"opp",zone:e.zone}, at=R.scorers.lastIndexOf(e.scorer);
        if(at>=0){ R.scorers.splice(at,1); R.assisters.splice(at,1); }
        R.evs=R.evs.map(q=>q===e?sv:q);
        queue.current=queue.current.map(q=>q===e?sv:q);
      }
    }
    // Gol/gol yenme güncelle
    if(res.goalScored){
      setMyScore(s=>s+1);
      playWhistle(false);
      setTimeout(()=>playCrowd(true,true),180);   // sentez tribün sesi kilit anda zaten çaldı
      setFlash({text:`⚽ GOL! ${res.player} — ${MOMENT_TYPES[res.momentType]?.label||""}`,col:C.grn2,big:true,min:0});
      setTimeout(()=>setFlash(null),3500);
      setLog(l=>[...l,{min:momentsRef.current.find(m=>m.type===res.momentType)?.min||0,
        text:`⚽ [MÜDAHALE] GOL! ${res.player} — ${res.msg}`,col:C.grn2,big:true}]);
    } else if(res.goalConceded){
      setOppScore(s=>s+1);
      setFlash({text:`😨 GOL YEDİK! ${res.msg}`,col:C.red2,big:true,min:0});
      setTimeout(()=>setFlash(null),3500);
      setLog(l=>[...l,{min:0,text:`😨 [MÜDAHALE] Gol yedik — ${res.msg}`,col:C.red2,big:true}]);
    } else if(res.optionId==="offside"){
      setLog(l=>[...l,{min:momentMin,text:`🚩 OFSAYT! ${res.player} — ${fixture.opp} serbest vuruş kullanacak`,col:"#f1c40f"}]);
      // 3D canlı akış: aynı noktadan rakip serbest vuruşu
      if(res.zone){
        setBallPos(res.zone);
        setTimeout(()=>{ if(!mountedRef.current) return;
          const eid=++ballEvIdRef.current;
          events3dQueueRef.current=[...events3dQueueRef.current.slice(-29),{id:eid,x:res.zone[0],y:res.zone[1],type:"offside",team:"me",spot:true}];
          if(live3dRef.current) live3dRef.current.events=events3dQueueRef.current;
        },900);
      }
    } else {
      setLog(l=>[...l,{min:0,text:`🎮 [MÜDAHALE] ${res.msg}`,col:res.success?C.grn2:"#e67e22"}]);
    }
    // Maçı devam ettir
    //   Eski interval (varsa) önce temizlenir: iki interval üst üste binip saati/olayları
    //   iki kat sürmesin ya da duraklatma bayrağı yarışıp maç takılı kalmasın
    setTimeout(()=>{
      if(!mountedRef.current) return;
      clearInterval(ivRef.current);
      pausedRef.current=false;
      if(fastDoneRef.current) return;
      runIntervalRef.current&&runIntervalRef.current();
    },300);
  };

  // ⚡ HIZLI: kalan süre anında oynatılır. Maç başında simulateMatch(myStr, rakip gücü, ev sahibi,
  //   coachBonus+tacticBonus, ilk 11) ile üretilen sonucun (kilit an düzeltmeleri dahil) kalan olayları
  //   tek seferde uygulanır; skor/golcü/asist/not/istatistik aynı result nesnesinden gelir → onFinish formatı aynı.
  const fastDoneRef=useRef(false);
  const finishNow=()=>{
    if(fastDoneRef.current||!result.current) return;
    fastDoneRef.current=true;
    clearInterval(ivRef.current);
    pausedRef.current=true;
    // Bekleyen 3D kurulum / kilit an / devre arası beklemeleri kapat
    if(buildUpRef.current){ const ac=actors3dRef.current; buildUpRef.current=null; try{ if(ac&&ac.isAlive&&ac.isAlive()&&ac.buildUp) ac.buildUp(null); }catch(_){} }
    (momentsRef.current||[]).forEach(mo=>{ mo.resolved=true; });
    setActiveMoment(null);
    setShowHalftime(false);
    // 3D animasyonunu bekleyen olaylar hemen sunulsun (skor/metin)
    flush3d();
    const from=minute;
    const rest=(queue.current||[]).filter(e=>e.min>from&&e.min<=90);
    const logs=[];
    if(from<46&&!htShown.current){ htShown.current=true; logs.push({min:45,text:"⏸ ─────── DEVRE ARASI ───────",col:C.gd,half:true}); }
    let me=0, op=0;
    rest.forEach(e=>{
      if(e.type==="goal"){ if(e.team==="me") me++; else op++; }
      logs.push({min:e.min,...evToLog(e,fixture.opp)});
    });
    logs.sort((a,b)=>a.min-b.min);
    if(me) setMyScore(s=>s+me);
    if(op) setOppScore(s=>s+op);
    const gl=rest.filter(e=>e.type==="goal").map(e=>({min:e.min,team:e.team==="me"?"me":"opp",name:e.team==="me"?(e.scorer||""):""}));
    if(gl.length) setGoalList(g=>[...g,...gl]);
    if(logs.length) setLog(l=>[...l,...logs]);
    setFlash(null);
    setSpeed("fast"); speedRef.current="fast";
    setMinute(90);
    setPhase("result");
    setTimeout(()=>{ if(mountedRef.current) playFinalWhistle(); },120);
  };
  useEffect(()=>{
    // Maç başı düdüğü
    setTimeout(()=>playWhistle(false),500);
    return()=>{};
  },[]);
  const evToLog=(e,opp)=>{
    const isMe=e.team==="me";
    const tName=isMe?clubName:opp;
    const fix=(s)=>typeof s==="string"?s.replace(/__TEAM__/g,clubName):s;
    switch(e.type){
      case "goal":
        if(isMe) return{
          text:`${e.icon} GOL! ${e.scorer}${e.assist?" (as: "+e.assist+")":""} — ${e.pos}, ${e.act}`,
          col:C.grn2, big:true, emoji:"⚽"};
        return{text:`${e.icon} ${opp} GOOOL — ${e.act} (${e.pos})`,col:C.red2,big:true,emoji:"⚽"};
      case "yellow":
        return{text:`🟨 Sarı kart — ${e.player}`,col:C.gd};
      case "yellow2red":
        return{text:`🟨🟥 İKİNCİ SARI! ${e.player} oyun dışı!`,col:C.red2,big:true};
      case "red":
        return{text:`🟥 DOĞRUDAN KIRMIZI KART! ${e.player} soyunma odasına!`,col:C.red2,big:true};
      case "miss":
        if(isMe) return{text:`${e.icon} ${e.player} — ${e.desc}`,col:"#7a8a9a"};
        return{text:`${e.icon} Rakip ${e.desc}`,col:"#556070"};
      case "save":
        if(isMe) return{text:`🧤 ${e.player||"Kaleci"} inanılmaz kurtarış!`,col:C.ac2};
        return{text:`🧤 Rakip kaleci müdahale etti.`,col:"#556"};
      case "sub":
        if(isMe) return{text:`🔄 Değişiklik: ↓${e.out}  ↑${e.in_}`,col:C.pur2};
        return{text:`🔄 ${opp} değişiklik yapıyor.`,col:"#556"};
      case "corner":
        return{text:"🚩 "+fix(isMe?(e._me?(e._me(e.team,opp)):tName+" köşe"):(e._them?(e._them(e.team,opp)):tName+" köşe")),col:isMe?"#7b8a":"#667"};
      case "foul":
        return{text:"🦵 "+fix(isMe?(e._me?(e._me(e.team,opp)):"Faul"):(e._them?(e._them(e.team,opp)):"Faul")),col:"#a8855a"};
      case "offside":
        return{text:"🚫 "+fix(isMe?(e._me?(e._me(e.team,opp)):"Ofsayt"):(e._them?(e._them(e.team,opp)):"Ofsayt")),col:"#778"};
      case "var":
        return{text:"📺 "+fix(e._me?(e._me(e.team,opp)):"VAR incelemesi!"),col:C.gd};
      case "var_cancel":
        return{text:"📺 VAR: GOL İPTAL — "+tName+" şokta!",col:C.red2};
      case "injury":
        return{text:"🏥 "+fix(isMe?(e._me?(e._me(e.team,opp)):"Sakatlık!"):(e._them?(e._them(e.team,opp)):"Sakatlık!")),col:"#f93"};
      case "chance":
        return{text:"😮 "+fix(isMe?(e._me?(e._me(e.team,opp)):"Büyük pozisyon!"):(e._them?(e._them(e.team,opp)):"Büyük pozisyon!")),col:isMe?C.grn2:C.red2};
      case "press":
        return{text:"⚡ "+fix(isMe?(e._me?(e._me(e.team,opp)):"Pres!"):(e._them?(e._them(e.team,opp)):"Pres!")),col:isMe?C.ac2:"#778"};
      case "tackle":
        return{text:"🛡️ "+fix(isMe?(e._me?(e._me(e.team,opp)):"Müdahale!"):(e._them?(e._them(e.team,opp)):"Müdahale!")),col:isMe?C.ac2:"#778"};
      case "crossbar":
        return{text:"🥅 "+fix(isMe?(e._me?(e._me(e.team,opp)):"Direğe!"):(e._them?(e._them(e.team,opp)):"Direğe!")),col:isMe?C.gd:C.red2,big:isMe};
      case "penalty_won":
        return{text:"🔴 "+fix(isMe?(e._me?(e._me(e.team,opp)):"Penaltı!"):(e._them?(e._them(e.team,opp)):"Penaltı!")),col:isMe?C.grn2:C.red2,big:true};
      case "handball":
        return{text:"✋ "+fix(isMe?(e._me?(e._me(e.team,opp)):"El!"):(e._them?(e._them(e.team,opp)):"El!")),col:"#a87"};
      case "clearance":
        return{text:"👊 "+fix(isMe?(e._me?(e._me(e.team,opp)):"Uzaklaştırıldı!"):(e._them?(e._them(e.team,opp)):"Uzaklaştırıldı!")),col:isMe?C.ac2:"#667"};
      case "header":
        return{text:"🔝 "+fix(isMe?(e._me?(e._me(e.team,opp)):"Kafa!"):(e._them?(e._them(e.team,opp)):"Kafa!")),col:"#7a9"};
      case "keeper":
        return{text:"🧤 "+fix(isMe?(e._me?(e._me(e.team,opp)):"Kaleci!"):(e._them?(e._them(e.team,opp)):"Kaleci!")),col:C.ac2};
      case "counter":
        return{text:"⚡ "+fix(isMe?(e._me?(e._me(e.team,opp)):"Kontra!"):(e._them?(e._them(e.team,opp)):"Kontra!")),col:isMe?C.grn2:C.red2,big:isMe};
      case "longball":
        return{text:"🎯 "+fix(isMe?(e._me?(e._me(e.team,opp)):"Uzun top!"):(e._them?(e._them(e.team,opp)):"Uzun top!")),col:"#7a8"};
      case "dispossess":
        return{text:"💢 "+fix(isMe?(e._me?(e._me(e.team,opp)):"Top kaybı!"):(e._them?(e._them(e.team,opp)):"Top kaybı!")),col:"#a77"};
      case "atmosphere":
        return{text:"📢 "+fix(isMe?(e._me?(e._me(e.team,opp)):"Atmosfer!"):(e._them?(e._them(e.team,opp)):"Atmosfer!")),col:"#556"};
      case "setpiece":
        return{text:"📐 "+fix(isMe?(e._me?(e._me(e.team,opp)):"Standart!"):(e._them?(e._them(e.team,opp)):"Standart!")),col:"#778"};
      case "comment":
        return{text:`💬 ${e.text}`,col:"#4a5a6a"};
      default:
        return{text:`• ${JSON.stringify(e.type)}`,col:C.dmr};
    }
  };

  // Hız değişince speedRef'i güncelle (interval'i yeniden başlatmak için)
  useEffect(()=>{speedRef.current=speed;},[speed]);

  // 3D odak: 2. yarıda 3D saha 180° dönük (players3d) → 2D koordinat da döndürülür (100−x, 100−y)
  const setFocus3D=(api,b)=>{ const f=minute>45; api.setFocus(f?100-b[0]:b[0],f?100-b[1]:b[1]); };
  // 3D önizleme: "Takip" kamerası için topun konumunu 3D sahneye ilet
  useEffect(()=>{
    const api=pitch3dApiRef.current;
    if(api&&!api.isDisposed()) setFocus3D(api,ballPos);
  },[ballPos]);

  // 3D önizleme: kendi takımımızın kısa isim etiketleri (2D sahadaki ile aynı kural)
  // (2D görünümde hesaplanmaz — hook sırası korunur, yalnızca içerik koşullu)
  const labels3d=React.useMemo(()=>!is3D?null:playerDots.map((p,i)=>{
    const pl=lineup.length>0?squad[lineup[i]]:squad[i];
    if(!pl||!pl.n) return "";
    return matchLabelName3D(pl.n);
  }),[is3D,lineup,squad,playerDots.length]);
  // 3D akış: oyuncu başına şut reytingi (uzaktan şut yalnız iyi şutörlere)
  const shots3d=React.useMemo(()=>!is3D?null:playerDots.map((p,i)=>{
    const pl=lineup.length>0?squad[lineup[i]]:squad[i];
    return pl?Number(pl.sht)||Math.round((Number(pl.ovr)||65)*0.88):60;
  }),[is3D,lineup,squad,playerDots.length]);
  // 3D kilit an: sahadaki kadro (takım arkadaşı adları). Koşulsuz hook; yalnız kadro değişince yeniden hesaplanır
  // 3D/2.5D: takım forma renkleri (veri dosyasındaki birincil/ikincil; yakınsa deplasmana ikinci forma)
  //   ve stadyum/çim/ışık varyasyonu (ev sahibi gücü + maç hash'i). Maç boyunca sabit.
  const kit3d=React.useMemo(()=>typeof actors3dKitColors==="function"?actors3dKitColors(clubName,fixture.opp,!!fixture.home):null,[clubName,fixture.opp,fixture.home]);
  const kitCss3d=React.useMemo(()=>{ if(!kit3d) return null; const c=(h)=>"#"+("000000"+(h>>>0).toString(16)).slice(-6); return {me:c(kit3d.home),opp:c(kit3d.away)}; },[kit3d]);
  const venue3d=React.useMemo(()=>typeof pitch3dVenue==="function"?pitch3dVenue({homeName:fixture.home?clubName:fixture.opp,homeStr:fixture.home?myStr:fixture.str,comp:fixture.comp,week:fixture.w,opp:fixture.opp}):null,[clubName,fixture.opp,fixture.home,fixture.comp,fixture.w,fixture.str,myStr]);
  const moment3dMates=React.useMemo(()=>(lineup.length>0?lineup.map(i=>squad[i]):squad.slice(0,11)).filter(Boolean),[lineup,squad]);
  // 3D sahne denetleyicisi bu ref'i her karede okur (React state'i karede güncellenmez)
  const live3dRef=useRef(null);
  const minuteRef3d=useRef(0); minuteRef3d.current=minute;
  // half: 3D'de 2. yarı taraf değişimi (2D yönü değişmez) · myBase/oppBase: diziliş tabanı (3D çapaları)
  if(is3D) live3dRef.current={my:playerDots,opp:oppDots,ball:ballPos,events:events3dQueueRef.current,labels:labels3d,shots:shots3d,oppStr:fixture.str,
    kick:kickTeamRef.current,half:minute>45?2:1,myBase:baseDotsRef.current,oppBase:baseOppDotsRef.current};
  else live3dRef.current=null;

  useEffect(()=>{
    // Sadece başlangıç 11'ini scorer/assister havuzuna al (lineupRef — Babel korumalı)
    const safeLineup=lineupRef.current||lineup||[];
    const startingSquad=safeLineup.length>0
      ? safeLineup.map(idx=>squad[idx]).filter(Boolean)
      : squad;
    result.current=simulateMatch(myStr,fixture.str,fixture.home,coachBonus+tacticBonus,startingSquad);
    queue.current=[...result.current.evs];
    // Müdahale anlarını planla
    momentsRef.current=planMoments(myStr,fixture.str,squad);

    const runInterval=()=>{
      const cfg=SPEED_CONFIGS[speedRef.current]||SPEED_CONFIGS.normal;
      const tickMs=matchTickMs(cfg,viewModeRef.current==="3d");
      if(fastDoneRef.current) return;   // ⚡ Hızlı ile maç bitti: devre arası/kilit an dönüşü yeniden başlatmasın
      ivRef.current=setInterval(()=>{        // Hız ya da 2D/3D görünüm değiştiyse interval'i yeniden başlat
        if(fastDoneRef.current){ clearInterval(ivRef.current); return; }
        const curCfg=SPEED_CONFIGS[speedRef.current]||SPEED_CONFIGS.normal;
        if(matchTickMs(curCfg,viewModeRef.current==="3d")!==tickMs){
          clearInterval(ivRef.current);
          runInterval();
          return;
        }

        // 3D kilit an öncesi HÜCUM KURULUMU: dakika ilerlemez; 3D akış topu kilit anın takımıyla
        //   son üçte bire taşır (players3d buildUp). Takım oraya varınca ya da en çok
        //   MATCH3D_BUILDUP_MAX_MS sonra (an asla kaybolmaz) ya da 2D'ye geçilince kilit an açılır.
        if(buildUpRef.current){
          if(pausedRef.current) return;
          const bu=buildUpRef.current, ac=actors3dRef.current;
          const alive=!!(ac&&ac.isAlive&&ac.isAlive());
          if(speedRef.current!=="slow"){
            // Hız "yavaş"tan çıktı: hızlı modlardaki gibi an atlanır (resolved kalır), maç sürer
            buildUpRef.current=null;
            if(alive&&ac.buildUp) ac.buildUp(null);
          } else {
            // Sahne kare çizmiyorsa (sekme gizli, 3D tuval ekran dışı, duraklatılmış) 3D akış ilerlemez:
            //   beklemeden kilit an açılır
            const p3=pitch3dApiRef.current;
            const notRendering=(typeof document!=="undefined"&&document.hidden)
              ||!p3||(p3.isDisposed&&p3.isDisposed())||(p3.isRendering&&!p3.isRendering());
            // BÖLGE SENKRONU: topun 3D akıştaki yeri + sahibi. Planlı türün bölgesine varınca (ya da geçince)
            //   hemen; süre dolunca topun o an bulunduğu bölgeye uygun türle açılır. Serbest/duran top beklenir.
            const sp=alive&&ac.getPlaySpot?ac.getPlaySpot():null, waited=Date.now()-bu.t0;
            const pr=sp?{own:0,mid:1,final:2}[momentRegion(sp.x)]:-1;
            const want=bu.mo.type==="counter"||bu.mo.type==="tackle"?0:MOMENT_REGION.mid.includes(bu.mo.type)?1:2;
            const fit=!!sp&&sp.team===bu.team&&(bu.team==="away"?sp.x<50:pr>want||pr===want&&(waited>5000||momentTypeAt(sp,bu.mo.type)===bu.mo.type));
            // Rakip kendi sahasında topla oynuyorsa bize uygun an yoktur: en çok 2× süre top kazanılması beklenir
            const late=waited>MATCH3D_BUILDUP_MAX_MS&&(!!sp&&(sp.team==="home"||sp.x<50)||waited>MATCH3D_BUILDUP_MAX_MS*2);
            if(waited>MATCH3D_BUILDUP_MAX_MS&&bu.team==="away"&&alive&&ac.buildUp&&!bu.flip){ bu.flip=true; bu.team="home"; ac.buildUp("home",MATCH3D_BUILDUP_MAX_MS/1000+4); }
            const ready=!alive||notRendering||viewModeRef.current!=="3d"||fit||late;
            if(!ready) return;
            buildUpRef.current=null;
            if(alive&&ac.buildUp) ac.buildUp(null);
            bu.mo.view3D=use3DMoment(); // görünüm kilit an başında sabitlenir
            if(alive&&bu.mo.view3D){
              let s=sp||(ac.getPlaySpot&&ac.getPlaySpot(true));
              if(s){
                // Süre sonunda top hâlâ rakipte ve bizim yarının dışındaysa: top bizde kabul edilir (orta saha anı)
                if(s.team!=="home"&&s.x>=50) s={...s,team:"home",idx:-1};
                const used=new Set(momentsRef.current.filter(q=>q.resolved&&q!==bu.mo).map(q=>q.type));
                const ty=momentTypeAt(s,bu.mo.type,used);
                if(ty!==bu.mo.type){ bu.mo.type=ty; bu.mo.config=MOMENT_TYPES[ty]; }
                bu.mo.spot={x:s.x,y:s.y};
                // Topa sahip gerçek oyuncu (duran top ve savunma anında planlı oyuncu kalır)
                const pool=(lineupRef.current||[]).length>0?lineupRef.current.map(i=>squad[i]):squad;
                if(ty==="tackle"){ if(bu.mo.player&&!["CB","LB","RB","CDM"].includes(bu.mo.player.pos)) bu.mo.player=pool.slice(0,11).find(p=>p&&["CB","CDM","LB","RB"].includes(p.pos))||bu.mo.player; }
                else if(s.idx>=0&&!["corner","freekick","penalty"].includes(ty)){ const o=pool[s.idx]; if(o&&o.n&&o.pos!=="GK") bu.mo.player=o; }
              }
            }
            pausedRef.current=true;
            clearInterval(ivRef.current);
            setActiveMoment(bu.mo);
            return;
          }
        }

        tick.current+=1;
        const dpt=curCfg.dpt;
        const m=tick.current*dpt;

        // Duraklatma kontrolü (müdahale anı aktifse atla)
        if(pausedRef.current) return;

        // Müdahale anı tetikle? (duraklatma yüzünden kaçan dakika 3 dk içinde yine açılır)
        const nextMoment=momentsRef.current.find(mo=>!mo.resolved&&mo.min<=m&&mo.min>(m-dpt-3));
        if(nextMoment&&speedRef.current==="slow"){
          nextMoment.resolved=true;
          const ac=actors3dRef.current;
          if(use3DMoment()&&ac&&ac.isAlive&&ac.isAlive()&&ac.buildUp){
            // Savunma anı (tackle): rakip bizim yarımıza gelir; diğerleri: topu biz oynarız
            const team=nextMoment.type==="tackle"?"away":"home";
            buildUpRef.current={mo:nextMoment,team,t0:Date.now()};
            ac.buildUp(team,MATCH3D_BUILDUP_MAX_MS/1000+2);
            return;
          }
          nextMoment.view3D=use3DMoment(); // görünüm kilit an başında sabitlenir
          pausedRef.current=true;
          clearInterval(ivRef.current);
          setActiveMoment(nextMoment);
          return;
        }

        // Devre arası
        if(m>=46&&m<46+dpt&&!htShown.current){
          htShown.current=true;
          playWhistle(true); // Uzun düdük — devre arası
          setLog(l=>[...l,{min:45,text:"⏸ ─────── DEVRE ARASI ───────",col:C.gd,half:true}]);
          // Hızlı mod dışında soyunma odası konuşması göster
          if(speedRef.current==="slow"){
            pausedRef.current=true;
            clearInterval(ivRef.current);
            setShowHalftime(true);
          }
        }

        // ── BLOK HAREKETİ + OYUNCU FİZİĞİ ──
        setBallPos(prev=>{
          const bvx=(prev[0]<20||prev[0]>80)?-Math.sign(prev[0]-50)*3:rnd(-9,9);
          const bvy=(prev[1]<10||prev[1]>90)?-Math.sign(prev[1]-50)*4:rnd(-13,13);
          const nx=Math.max(4,Math.min(96,prev[0]+bvx));
          const ny=Math.max(4,Math.min(96,prev[1]+bvy));
          setHeatDots(d=>[...d.slice(-40),{x:nx,y:ny,t:m}]);

          const fatigue=Math.min(0.4,m/90*0.4);
          // Top bölgesi: 0=kendi ceza 1=kendi yarı 2=orta 3=rakip yarı 4=rakip ceza
          const zone=nx<15?0:nx<35?1:nx<65?2:nx<85?3:4;
          const oppZone=4-zone;

          // Hat blok ofsetleri — bölgeye göre hatlar birlikte kayar
          const calcLineOffsets=(z)=>({
            def: z>=3?8 : z===2?2  : z===1?-5  : -10,
            mid: z>=3?12: z===2?4  : z===1?-3  : -8,
            fwd: z>=3?18: z===2?8  : z===1?-2  : -6,
          });
          const myOff=calcLineOffsets(zone);
          const opOff=calcLineOffsets(oppZone);
          const wingShift=(ny-50)*0.12;

          // Blok fizik fonksiyonu — FCY ve rakip için ortak
          const applyBlockPhysics=(pp,baseRef,offsets,mirrorWing)=>{
            const nextPositions=pp.map(p=>{
              if(p.pulse) return{...p,vx:p.vx*0.6,vy:p.vy*0.6};
              const base=baseRef.find(b=>b.id===p.id)||{bx:p.x,by:p.y,role:"CM"};
              const role=base.role||"CM";

              // Kaleci: sadece y ekseninde kale çizgisinde kayar
              if(role==="GK"){
                const gkY=Math.max(20,Math.min(80,50+(ny-50)*(mirrorWing?0.35:-0.35)));
                const nt=(p.noiseT||0)+0.05;
                return{...p,x:p.x+(base.bx-p.x)*0.05+(Math.sin(nt*0.4)*0.25),
                  y:p.y+(gkY-p.y)*0.08,vx:0,vy:0,noiseT:nt};
              }

              const isDef=["CB","LB","RB","CDM"].includes(role);
              const isMid=["CM","CAM","LM","RM"].includes(role);
              const isWing=["LB","RB","LM","RM"].includes(role);
              const lineOff=isDef?offsets.def:isMid?offsets.mid:offsets.fwd;
              const ws=mirrorWing?-wingShift:wingShift;

              const tgtX=Math.max(8,Math.min(92,base.bx+lineOff));
              const tgtY=Math.max(5,Math.min(95,base.by+(isWing?ws*1.3:ws*0.5)));

              // Yay kuvveti hedefe doğru
              const springX=(tgtX-p.x)*0.15;
              const springY=(tgtY-p.y)*0.12;

              // Küçültülmüş organik gürültü — kaotikliği önlemek için
              const nt=(p.noiseT||0)+0.055;
              const noiseAmp=(1-fatigue)*0.45;
              const noiseX=Math.sin(nt*0.7+p.id*0.4)*noiseAmp;
              const noiseY=Math.cos(nt*0.55+p.id*0.6)*noiseAmp;

              const friction=0.65;
              const nvx=(p.vx||0)*friction+springX+noiseX;
              const nvy=(p.vy||0)*friction+springY+noiseY;
              const maxSpd=isDef?1.1:isMid?1.4:1.7;
              const spd=Math.sqrt(nvx*nvx+nvy*nvy)||1;
              const cvx=spd>maxSpd?(nvx/spd)*maxSpd:nvx;
              const cvy=spd>maxSpd?(nvy/spd)*maxSpd:nvy;
              return{...p,vx:cvx,vy:cvy,
                x:Math.max(3,Math.min(97,p.x+cvx)),
                y:Math.max(3,Math.min(97,p.y+cvy)),noiseT:nt};
            });

            // Oyuncular arası itme
            const minDist=6;
            return nextPositions.map((p,i)=>{
              if(p.pulse) return p;
              let fx=0,fy=0;
              nextPositions.forEach((o,j)=>{
                if(i===j)return;
                const dx=p.x-o.x,dy=p.y-o.y;
                const d=Math.sqrt(dx*dx+dy*dy)||0.01;
                if(d<minDist){const f=(minDist-d)/minDist*0.65;fx+=(dx/d)*f;fy+=(dy/d)*f;}
              });
              return{...p,x:Math.max(3,Math.min(97,p.x+fx)),
                y:Math.max(3,Math.min(97,p.y+fy)),
                vx:p.vx+fx*0.2,vy:p.vy+fy*0.2};
            });
          };

          setPlayerDots(pp=>applyBlockPhysics(pp,baseDotsRef.current,myOff,false));
          setOppDots(pp=>applyBlockPhysics(pp,baseOppDotsRef.current,opOff,true));
          return[nx,ny];
        });

        // Top kontrolü sallan
        setPoss(p=>Math.max(36,Math.min(64,p+rnd(-5,5))));

        // ── RAKİP AI TAKTİK DEĞİŞİMİ ──
        // 60. ve 75. dakikada skor farkına göre formasyon değiştir
        if((m>=60&&m<60+dpt)||(m>=75&&m<75+dpt)){
          setMyScore(myS=>{ setOppScore(oppS=>{
            const diff=oppS-myS; // pozitif=rakip önde, negatif=rakip geride
            const newForm=getRivalFormation(fixture.opp,fixture.str,diff,m);
            setOppFormation(prev=>{
              if(prev!==newForm){
                setOppFormChangedAt(m);
                // Rakip formasyon değişince baz pozisyonları güncelle
                const newFData=FDATA[newForm]||FDATA["4-4-2"];
                baseOppDotsRef.current=newFData.map((slot,i)=>({id:i,bx:slot.y||50,by:slot.x||50,role:slot.p||"CM"}));
                const changeMsg=diff<=-1
                  ?`⚡ ${fixture.opp} hücuma geçiyor! (${newForm})`
                  :diff>=2
                  ?`🛡️ ${fixture.opp} savunmaya çekiliyor! (${newForm})`
                  :null;
                if(changeMsg) setLog(l=>[...l,{min:Math.round(m),text:changeMsg,col:"#e8922a",big:false}]);
              }
              return newForm;
            });
            return oppS;
          }); return myS; });
        }

        // Bu tikteki olaylar (dpt büyüklüğüne göre pencere)
        const eventsNow=queue.current.filter(e=>e.min<=m&&e.min>(m-dpt));
        eventsNow.forEach(e=>{
          const entry=evToLog(e,fixture.opp);
          let eid=0;                                   // saha animasyonu kimliği (zone'lu olaylarda)
          // SUNUM: skor, gol listesi, gol sesi, akış metni ve flash. 3D görünümde topun animasyonu
          //   olayın "an"ına (ağlara girdiği / kaleciye ulaştığı / kale çizgisini geçtiği kare)
          //   varınca çalışır (players3d onImpact → resolve3d); 2D'de ya da 3D yoksa hemen.
          const present=()=>{
          if(!mountedRef.current) return;
          if(e.type==="goal"){
            if(e.team==="me") setMyScore(s=>s+1);
            else setOppScore(s=>s+1);
            setGoalList(g=>[...g,{min:e.min,team:e.team==="me"?"me":"opp",name:e.team==="me"?(e.scorer||""):""}]);
            // Gol sesi: kısa düdük + stadyum kutlaması
            setTimeout(()=>{ playWhistle(false); setTimeout(()=>playCrowd(true),180); },0);
            // ── GOL SONRASI RESET: oyuncular mevkilerine dönsün ──
            setTimeout(()=>{
              if(!mountedRef.current) return;
              setPlayerDots(prev=>prev.map(p=>{
                const base=baseDotsRef.current.find(b=>b.id===p.id);
                if(!base) return p;
                return{...p, x:base.bx, y:base.by, vx:0, vy:0, pulse:false};
              }));
              setOppDots(prev=>prev.map(p=>{
                const base=baseOppDotsRef.current.find(b=>b.id===p.id);
                if(!base) return p;
                return{...p, x:base.bx, y:base.by, vx:0, vy:0, pulse:false};
              }));
              setBallPos([50,50]);
            }, 1800);
          }
          setLog(l=>[...l,{min:e.min,...entry}]);
          if(entry.big){
            setFlash({...entry,min:e.min});
            setTimeout(()=>{ if(mountedRef.current) setFlash(null); },curCfg.flash);
          }
          };
          if(["foul","yellow","yellow2red","red","handball","penalty_won"].includes(e.type)){
            setTimeout(()=>playFoulWhistle(),0);
          }
          // Top pozisyonunu olayla hizala
          if(e.zone) setBallPos(e.zone);
          // ── CANLI SAHA ANİMASYONU: event'e göre saha efekti ──
          if(e.zone){
            eid=++ballEvIdRef.current;
            const evType=e.type; // goal,miss,save,yellow,red,sub,corner,foul,chance,counter...
            const evTeam=e.team||"me";
            setBallEvents(prev=>[...prev,{id:eid,x:e.zone[0],y:e.zone[1],type:evType,team:evTeam}]);
            // 3D kuyruğu: yeni dizi (players3d referans karşılaştırır), en fazla 30 olay
            events3dQueueRef.current=[...events3dQueueRef.current.slice(-29),{id:eid,x:e.zone[0],y:e.zone[1],type:evType,team:evTeam}];
            // Animasyon süresi: gol 2.2s, diğer 1.1s
            setTimeout(()=>setBallEvents(prev=>prev.filter(ev=>ev.id!==eid)),evType==="goal"?2200:1100);
            // Özellik 2: Event tipine göre oyuncu pozisyon değişimi
            const zonePct=e.zone[0]; // 0-100, saha yatay konumu
            const zoneY=e.zone[1];   // kanat konumu
            setPlayerDots(prev=>{
              const base=baseDotsRef.current;
              // En yakın oyuncuyu bul (pulse için)
              const nearest=prev.reduce((best,q)=>
                Math.hypot(q.x-zonePct,q.y-zoneY)<Math.hypot(best.x-zonePct,best.y-zoneY)?q:best,prev[0]);

              return prev.map(p=>{
                const b=base.find(bb=>bb.id===p.id)||{bx:p.x,by:p.y,role:"CM"};
                const role=b.role||"CM";
                const isNearest=p.id===nearest.id;

                // ── Kendi golümüz / pozisyonumuz ──
                if((evType==="goal"||evType==="miss"||evType==="chance"||evType==="counter")&&evTeam==="me"){
                  if(role==="ST"||role==="CAM"){
                    // Forvetler topa koşsun — hız dürtüsü ver
                    const dx=zonePct-p.x, dy=zoneY-p.y;
                    const d=Math.hypot(dx,dy)||1;
                    return{...p, vx:(dx/d)*4.5, vy:(dy/d)*3.5, pulse:isNearest};
                  }
                  if(role==="LM"||role==="RM"||role==="CM"){
                    // Orta saha ileri hamle
                    return{...p, vx:2.5+Math.random()*1.5, vy:(zoneY-p.y)*0.08, pulse:false};
                  }
                  if(role==="LB"||role==="RB"){
                    // Bek yüksel — kanat koşusu
                    return{...p, vx:1.8, vy:(role==="LB"?-1:1)*1.2, pulse:false};
                  }
                  if(role==="CB"){
                    return{...p, vx:0.5, vy:(zoneY-p.y)*0.04, pulse:false};
                  }
                }

                // ── Rakip golü / rakip pozisyonu ──
                if((evType==="goal"||evType==="save"||evType==="miss")&&evTeam==="opp"){
                  if(role==="CB"||role==="CDM"){
                    // Defans kaleci önüne koşsun
                    const dx=90-p.x, dy=50-p.y;
                    const d=Math.hypot(dx,dy)||1;
                    return{...p, vx:(dx/d)*3.5, vy:(dy/d)*3.0, pulse:isNearest};
                  }
                  if(role==="LB"||role==="RB"){
                    return{...p, vx:2.0, vy:(role==="LB"?1:-1)*1.0, pulse:false};
                  }
                  if(role==="CM"||role==="LM"||role==="RM"){
                    return{...p, vx:1.5, vy:(50-p.y)*0.06, pulse:false};
                  }
                  if(role==="ST"||role==="CAM"){
                    // Hücumcular geri çekilsin (yüksek baskı savunma)
                    return{...p, vx:-1.0, vy:(50-p.y)*0.05, pulse:false};
                  }
                }

                // ── Kart / faul: bölgeye yakın oyuncu dur, kaleci ileri çıksın ──
                if(evType==="yellow"||evType==="red"||evType==="foul"){
                  if(isNearest) return{...p, vx:p.vx*0.1, vy:p.vy*0.1, pulse:true};
                  return{...p, vx:p.vx*0.6, vy:p.vy*0.6};
                }

                // ── Köşe vuruşu: herkes ceza sahasına ──
                if(evType==="corner"){
                  if(role!=="GK"&&role!=="CB"&&evTeam==="me"){
                    return{...p, vx:2.0+(Math.random()-0.5)*1.5, vy:(zoneY-p.y)*0.12, pulse:false};
                  }
                }

                // Genel: pulse en yakına
                return{...p, pulse:isNearest};
              });
            });
            setTimeout(()=>setPlayerDots(prev=>prev.map(p=>({...p,pulse:false}))),1400);
          }
          if(eid&&SYNC3D_TYPES[e.type]&&sync3dOn()) defer3d(eid,present);
          else present();
        });

        if(m>=90){
          clearInterval(ivRef.current);
          setMinute(90);
          const finishMatch=()=>{
            if(!mountedRef.current) return;
            setPhase("result");
            // Maç sonu: sentezlenmiş 3 düdük (uzun-kısa-kısa)
            setTimeout(()=>playFinalWhistle(),120);
          };
          // Son dakika olayı 3D'de hâlâ oynuyorsa (ör. 90. dk golü) önce top ağlara girsin,
          //   skor/metin gelsin; sonra maç sonu (en çok SYNC3D_MAX_MS)
          if(pending3dRef.current.size){
            const t0=Date.now();
            const wait=()=>{
              if(!mountedRef.current) return;
              if(!pending3dRef.current.size||Date.now()-t0>SYNC3D_MAX_MS){ flush3d(); finishMatch(); }
              else setTimeout(wait,150);
            };
            wait();
          } else finishMatch();
        }
        else setMinute(m);
      },tickMs);
    };

    runIntervalRef.current=runInterval;
    runInterval();
    return()=>clearInterval(ivRef.current);
  },[]);

  useEffect(()=>{
    if(logRef.current) logRef.current.scrollTop=logRef.current.scrollHeight;
  },[log]);

  const r=result.current;
  // Sonuç: görüntülenen skordan türet (r.res pre-computed, animasyonla uyuşmayabilir)
  const finalRes=phase==="result"?(myScore>oppScore?"W":myScore<oppScore?"L":"D"):null;
  const resCol=finalRes?(finalRes==="W"?C.grn2:finalRes==="L"?C.red2:C.gd):(myScore>oppScore?C.grn2:myScore<oppScore?C.red2:C.gd);
  const isHT=minute>=45&&minute<47;
  const devre=minute<45?"1. DEVRE":"2. DEVRE";


  // 3D modda sonuç paneli kısa ekranda alta taşabilir → maç bitince "DEVAM ET" görünür olsun
  const resultPanelRef=useRef(null);
  useEffect(()=>{
    if(phase!=="result"||viewMode!=="3d") return;
    const t=setTimeout(()=>{
      try{ resultPanelRef.current&&resultPanelRef.current.scrollIntoView({block:"end",behavior:"smooth"}); }catch(e){}
    },150);
    return()=>clearTimeout(t);
  },[phase,viewMode]);
  // Three yüklenemedi / Pitch3D hata verdi → 2 kez kendiliğinden yeniden dene; olmazsa "Tekrar dene" paneli
  //   (maç metin akışıyla sürer, 2D saha yok)
  const retry3d=()=>{ setPitch3dFail(false); setPitch3dTry(n=>n+1); };
  const on3dViewError=()=>{
    pitch3dApiRef.current=null;
    flush3d();
    setPitch3dFail(true);
    if(pitch3dTry<2) setTimeout(()=>{ if(mountedRef.current) retry3d(); },1200);
  };
  const view3dH=(()=>{
    const vh=(typeof window!=="undefined"&&window.innerHeight)||640;
    return phase==="result"?Math.max(180,Math.round(vh*0.3)):Math.max(220,Math.round(vh*0.45));
  })();
  const half3d=phase==="result"?"MAÇ SONU":(showHalftime||isHT)?"DEVRE ARASI":devre;
  // 3D kilit an kendi sahnesini açar: o sırada canlı 3D sahne kapatılır (tek WebGL bağlamı)
  const hide3dForMoment=!!(activeMoment&&activeMoment.view3D);

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.93)",zIndex:200,
      display:"flex",alignItems:"center",justifyContent:"center",padding:6}}>
      {/* ── İNTERAKTİF AN OVERLAY ── */}
      {activeMoment&&(
        <InteractiveMoment3D
          moment={activeMoment}
          mates={moment3dMates}
          homeShare={fixture.home?0.74:0.3}
          kitColors={kit3d} venue={venue3d}
          myStr={myStr}
          oppStr={fixture.str}
          onResolve={handleMomentResolve}
        />
      )}
      {/* ── DEVRE ARASI KONUŞMASI ── */}
      {showHalftime&&(
        <HalftimeSpeech
          myScore={myScore}
          oppScore={oppScore}
          myStr={myStr}
          oppStr={fixture.str}
          clubName={clubName}
          squad={squad}
          lineup={lineup}
          onContinue={({speech,tactic,tacticBonus:tb,subs:htSubs=[]})=>{
            setHtTacticBonus(tb||0);
            setShowHalftime(false);
            // Log'a konuşma notu ekle
            setLog(l=>[...l,{min:45,text:`💬 "${speech.text.substring(0,60)}…"`,col:C.ac2,half:false}]);
            if(tb&&tb!==0){
              setLog(l=>[...l,{min:45,text:`📋 İkinci devre taktiği: ${tb>0?"⚔️ Ofansif":"🛡️ Savunmacı"} (${tb>0?"+"+tb:tb} bonus)`,col:tb>0?C.grn2:"#e67e22",half:false}]);
            }
            // Devre arası değişiklikleri log'a yaz
            if(htSubs.length>0){
              htSubs.forEach(s=>{
                setLog(l=>[...l,{min:46,text:`🔄 DEĞİŞİKLİK: ${s.out.n} ⬇ → ${s.in.n} ⬆ (${s.in.pos})`,col:"#a78bfa",big:false}]);
              });
            }
            // Interval'ı yeniden başlat
            clearInterval(ivRef.current);
            pausedRef.current=false;
            runIntervalRef.current&&runIntervalRef.current();
          }}
        />
      )}
      <div style={{width:"min(100vw,520px)",background:C.card,border:`1px solid rgba(77,166,255,0.22)`,
        borderRadius:10,overflowX:"hidden",overflowY:is3D?"auto":"hidden",
        display:"flex",flexDirection:"column",maxHeight:"98vh"}}>

        {/* ── HEADER ── */}
        <div style={{background:"linear-gradient(135deg,#0b1d3a,#050e1c)",
          padding:"6px 12px",borderBottom:`1px solid rgba(77,166,255,0.22)`,
          display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}>
          <div style={{fontSize:".48rem",letterSpacing:2,color:C.dim,textTransform:"uppercase"}}>
            {fixture.home?"🏠 EV":"✈️ DEP"} · {fixture.comp||"SL"} · Hafta {fixture.w}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:5,flexWrap:"wrap",justifyContent:"flex-end"}}>
            {/* Müdahale anı sayacı */}
            {phase==="playing"&&speed==="slow"&&(()=>{
              const total=momentsRef.current.length;
              const done=momentsRef.current.filter(m=>m.resolved).length;
              return(
                <div style={{
                  padding:"2px 6px",borderRadius:4,
                  background:"rgba(232,184,58,.12)",
                  border:"1px solid rgba(232,184,58,.3)",
                  fontSize:".44rem",color:"#ffd060",fontWeight:700,
                  display:"flex",alignItems:"center",gap:3,
                }}>🎮 {done}/{total}</div>
              );
            })()}
            {/* Ses butonu */}
            <button onClick={()=>{ const ns=!soundOn; setSoundOn(ns); soundOnRef.current=ns; }}
              style={{
                padding:"2px 7px",borderRadius:4,cursor:"pointer",fontFamily:"inherit",
                fontSize:".52rem",border:`1px solid ${soundOn?"rgba(39,174,96,.4)":"rgba(100,140,220,.2)"}`,
                background:soundOn?"rgba(39,174,96,.15)":"rgba(100,140,220,.06)",
                color:soundOn?C.grn2:C.dmr,transition:"all .15s"
              }}>{soundOn?"🔊":"🔇"}</button>
            {/* Hız seçici — sadece oynarken göster */}
            {phase==="playing"&&(
              <div style={{display:"flex",gap:2,background:"rgba(0,0,0,.4)",borderRadius:4,padding:2,border:`1px solid rgba(77,166,255,0.1)`}}>
                {Object.entries(SPEED_CONFIGS).map(([k,v])=>(
                  <button key={k} onClick={()=>{ if(k==="fast"){ finishNow(); return; } setSpeed(k);speedRef.current=k;}}
                    style={{
                      padding:"2px 7px",borderRadius:3,cursor:"pointer",fontFamily:"inherit",
                      fontSize:".46rem",fontWeight:speed===k?800:400,letterSpacing:.3,
                      border:"none",
                      background:speed===k
                        ?k==="fast"?"linear-gradient(135deg,#c0392b,#e74c3c)"
                          :k==="slow"?"linear-gradient(135deg,#1a6ed8,#2485ff)"
                          :"linear-gradient(135deg,#1e8449,#27ae60)"
                        :"transparent",
                      color:speed===k?"#fff":C.dmr,
                      transition:"all .15s"
                    }}>{v.label}</button>
                ))}
              </div>
            )}
            {phase==="playing"&&<span style={{
              background:isHT?"rgba(200,153,42,.25)":"rgba(192,57,43,.2)",
              border:`1px solid ${isHT?C.gd:C.red2}`,borderRadius:3,
              padding:"2px 8px",fontSize:".58rem",color:isHT?C.gd:C.red2,
              fontWeight:700,display:"flex",alignItems:"center",gap:4}}>
              {!isHT&&<span style={{width:5,height:5,borderRadius:"50%",background:C.red2,
                display:"inline-block",animation:"blink 1s infinite"}}/>}
              {isHT?"⏸ DEVRE":"🔴 "+minute+"'"} 
            </span>}
            {phase==="result"&&<span style={{fontSize:".6rem",color:C.gd,fontWeight:700,letterSpacing:2}}>
              ⏱ MAÇ BİTTİ
            </span>}
          </div>
        </div>


        {/* ── 3D MAÇ GÖRÜNÜMÜ (tek örnek) + SKOR TABELASI ── */}
        {is3D&&<div style={{flexShrink:0,padding:"0 8px 6px"}}>
          <div style={{position:"relative",height:view3dH}}>
            {hide3dForMoment?(
              <div style={{height:"100%",borderRadius:6,border:"1px solid rgba(77,166,255,.25)",
                background:"#0b1220",display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:".6rem",color:"#9fb3c8"}}>🎮 Kilit an oynanıyor…</div>
            ):pitch3dFail?(
              <div style={{height:"100%",borderRadius:6,border:"1px solid rgba(77,166,255,.25)",gap:8,
                background:"#0b1220",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
                fontSize:".6rem",color:"#9fb3c8"}}>
                <span>⚠️ 3D stadyum açılamadı — maç akışı sürüyor</span>
                <button onClick={retry3d} style={{padding:"8px 16px",minHeight:40,borderRadius:8,border:"none",fontFamily:"inherit",
                  fontSize:".6rem",fontWeight:800,cursor:"pointer",background:"#6b3fd1",color:"#fff"}}>Tekrar dene</button>
              </div>
            ):(
              <Pitch3D key={pitch3dTry} camera={cam3D} onCameraChange={setCam3D} height={view3dH} controlsAt="bottom" venue={venue3d}
                paused={showHalftime||(phase!=="playing"&&(phase!=="result"||result3dFrozen))}
                onReady={api=>{
                  pitch3dApiRef.current=api;
                  setFocus3D(api,ballPos);
                  // Tribün: ev sahibinin taraftarı çoğunlukta (bizim payımız)
                  if(api.crowd) api.crowd.setSupport(fixture.home?0.74:0.3);
                  // 22 oyuncu + top + olay efektleri; sahne silinirken kendini temizler
                  try{
                    // onImpact: top olayın anına vardı (ağlar/kaleci/kale çizgisi) → bekleyen metin/skor/ses
                    const ac=createMatchActors3D(api,{getSnapshot:()=>live3dRef.current,colors:kit3d,
                      onImpact:(ev)=>{ if(ev&&ev.id!=null) resolve3d(ev.id); },
                      // Canlı akışta 3D ofsayt düdüğü: akış metni + istatistik
                      onOffside:(o)=>{
                        if(!mountedRef.current) return;
                        const me=o.team==="home", L2=lineupRef.current||[];
                        const pl=me?(L2.length>0?squad[L2[o.idx]]:squad[o.idx]):null;
                        const min=Math.max(1,Math.min(90,minuteRef3d.current||1));
                        setLog(l=>[...l,{min,text:me?`🚩 Ofsayt! ${pl&&pl.n?pl.n+" ":""}savunma arkasında yakalandı — ${fixture.opp} serbest vuruş kullanıyor`:`🚩 Ofsayt! ${fixture.opp} hücumu bayrağa takıldı — serbest vuruş bizim`,col:me?"#f1c40f":"#778"}]);
                        const st=result.current&&result.current.stats;
                        if(st){ if(me) st.myOffsides=(st.myOffsides||0)+1; else st.opOffsides=(st.opOffsides||0)+1; }
                      }});
                    actors3dRef.current=ac;
                    // Kilit an hücum kurulumu sürerken sahne yeniden kurulduysa kurulum sürsün
                    const bu=buildUpRef.current; if(bu&&ac&&ac.buildUp) ac.buildUp(bu.team,MATCH3D_BUILDUP_MAX_MS/1000+2);
                  }
                  catch(e){ console.error("[3D] oyuncular kurulamadı",e); }
                }}
                onError={on3dViewError}/>
            )}
            <Scoreboard3D clubName={clubName} oppName={fixture.opp} myScore={myScore} oppScore={oppScore}
              minute={minute} half={half3d} goals={goalList} kit={kitCss3d}/>
          </div>
        </div>}

        {/* ── FLASH OLAY ── */}
        {flash&&<div style={{margin:"0 10px 5px",padding:"7px 12px",borderRadius:5,flexShrink:0,
          background:flash.col===C.grn2?"rgba(39,174,96,.15)":flash.col===C.red2?"rgba(232,64,64,.15)":"rgba(200,153,42,.12)",
          border:`1px solid ${flash.col}`,animation:"popIn .25s ease"}}>
          <div style={{fontSize:".7rem",fontWeight:700,color:flash.col}}>{flash.text}</div>
        </div>}

        {/* ── SEKMELER ── */}
        <div style={{display:"flex",borderBottom:`1px solid rgba(77,166,255,0.1)`,flexShrink:0}}>
          {[["log","📋 Olaylar"],["stats","📊 Stats"],["ratings","⭐ Puanlar"]].map(([t,l])=>(
            <button key={t} onClick={()=>setTab(t)} style={{
              flex:1,padding:"5px 2px",border:"none",fontFamily:"inherit",cursor:"pointer",
              fontSize:".5rem",letterSpacing:.3,
              background:tab===t?"rgba(45,143,255,.12)":"transparent",
              color:tab===t?C.ac2:C.dim,
              borderBottom:`2px solid ${tab===t?C.ac2:"transparent"}`}}>{l}</button>
          ))}
        </div>

        {/* ── LOG SEKMESİ ── */}
        {tab==="log"&&<div ref={logRef} style={{flex:1,overflowY:"auto",padding:"5px 10px",minHeight:120,maxHeight:180}}>
          {log.length===0&&<div style={{textAlign:"center",padding:"24px 0",fontSize:".62rem",color:C.dmr}}>
            ⏳ Düdük bekleniyor...
          </div>}
          {log.map((e,i)=>(
            <div key={i} style={{
              display:"flex",gap:5,padding:"3px 5px",
              borderBottom:e.half?`1px solid ${C.gd}`:`1px solid rgba(77,166,255,0.1)`,
              background:e.big?"rgba(39,174,96,.05)":e.half?"rgba(200,153,42,.04)":"transparent",
              borderLeft:e.big?`3px solid ${e.col}`:`3px solid transparent`,
              marginBottom:e.half?4:0,borderRadius:e.big?3:0}}>
              <span style={{color:C.dmr,minWidth:20,fontSize:".48rem",flexShrink:0,
                alignSelf:"center",fontFamily:"monospace"}}>{e.min}'</span>
              <span style={{color:e.col,fontSize:e.big?".67rem":".58rem",
                fontWeight:e.big||e.half?700:400,lineHeight:1.4}}>{e.text}</span>
            </div>
          ))}
        </div>}


        {/* ── İSTATİSTİK SEKMESİ ── */}
        {tab==="stats"&&r&&<div style={{flex:1,overflowY:"auto",padding:"8px 12px",minHeight:160}}>
          {[
            ["Toplam Şut",r.stats.myShots,r.stats.opShots],
            ["İsabetli Şut",r.stats.myOnTarget,r.stats.opOnTarget],
            ["Köşe Vuruşu",r.stats.myCorners,r.stats.opCorners],
            ["Faul",r.stats.myFouls,r.stats.opFouls],
            ["Ofsayt",r.stats.myOffsides,r.stats.opOffsides],
            ["Top Kontrolü",`${poss}%`,`${100-poss}%`],
            ["Toplam Pas",r.stats.myPasses,r.stats.opPasses],
            ["Gol",myScore,oppScore],
          ].map(([label,my,op])=>{
            const myN=typeof my==="string"?parseInt(my):my;
            const opN=typeof op==="string"?parseInt(op):op;
            const tot=myN+opN||1;
            return(
              <div key={label} style={{marginBottom:7}}>
                <div style={{display:"flex",justifyContent:"space-between",
                  fontSize:".54rem",marginBottom:2,alignItems:"center"}}>
                  <span style={{fontWeight:700,color:C.ac2,minWidth:28}}>{my}</span>
                  <span style={{color:C.dmr,fontSize:".46rem",letterSpacing:.5,
                    textAlign:"center",flex:1}}>{label}</span>
                  <span style={{fontWeight:700,color:C.red2,minWidth:28,textAlign:"right"}}>{op}</span>
                </div>
                <div style={{height:5,background:"#0a1520",borderRadius:3,
                  overflow:"hidden",display:"flex"}}>
                  <div style={{width:`${(myN/tot)*100}%`,
                    background:`linear-gradient(90deg,${C.ac},${C.ac2})`,
                    borderRadius:"3px 0 0 3px",transition:"width .4s"}}/>
                  <div style={{width:`${(opN/tot)*100}%`,
                    background:`linear-gradient(90deg,#c0392b,${C.red2})`,
                    borderRadius:"0 3px 3px 0"}}/>
                </div>
              </div>
            );
          })}
        </div>}

        {/* ── OYUNCU PUANLARI SEKMESİ ── */}
        {tab==="ratings"&&r&&<div style={{flex:1,overflowY:"auto",padding:"8px 12px",minHeight:160}}>
          <div style={{fontSize:".44rem",color:C.dmr,letterSpacing:1.5,
            textTransform:"uppercase",marginBottom:6}}>Oyuncu Performansları</div>
          {squad.length>0
            ?[...squad].sort((a,b)=>(r.ratings[b.id]||65)-(r.ratings[a.id]||65)).map(pl=>{
              const rating=r.ratings[pl.id]||rnd(62,75);
              const isScorer=r.scorers.includes(pl.n);
              const isAssist=(r.assisters&&r.assisters.includes(pl.n));
              const col=rating>=85?C.grn2:rating>=75?C.gd:rating>=65?C.ac2:C.red2;
              return(
                <div key={pl.id} style={{display:"flex",alignItems:"center",gap:6,
                  padding:"4px 6px",borderBottom:`1px solid rgba(77,166,255,0.1)`,
                  background:isScorer?"rgba(39,174,96,.05)":"transparent"}}>
                  <PosTag pos={pl.pos} small/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:".62rem",fontWeight:isScorer?700:400,
                      overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{pl.n}</div>
                    <div style={{fontSize:".44rem",color:C.dmr}}>
                      {isScorer?"⚽ Gol":""}
                      {isAssist?" 🅰️ Asist":""}
                    </div>
                  </div>
                  <div style={{textAlign:"center",minWidth:36}}>
                    <div style={{height:3,width:36,background:"#0a1520",borderRadius:2,overflow:"hidden",marginBottom:2}}>
                      <div style={{height:"100%",width:`${rating}%`,background:col,borderRadius:2}}/>
                    </div>
                    <span style={{fontSize:".62rem",fontWeight:700,color:col}}>{rating}</span>
                  </div>
                </div>
              );
            })
            :<div style={{textAlign:"center",padding:"20px 0",fontSize:".62rem",color:C.dmr}}>
              Kadro bilgisi yüklenemiyor.
            </div>}
        </div>}

        {/* ── SONUÇ PANELİ — Sinematik ── */}
        {phase==="result"&&r&&<div ref={resultPanelRef} style={{
          padding:"14px 14px 16px",
          borderTop:`2px solid ${resCol}44`,flexShrink:0,
          background:`linear-gradient(0deg,${
            finalRes==="W"?"rgba(4,20,12,.98)":
            finalRes==="L"?"rgba(20,4,4,.98)":
            "rgba(20,14,4,.98)"
          },rgba(4,12,24,.9))`,
          position:"relative",overflow:"hidden"
        }}>
          {/* Arka plan glow */}
          <div style={{
            position:"absolute",inset:0,pointerEvents:"none",
            background:`radial-gradient(ellipse at 50% 0%,${resCol}18,transparent 70%)`
          }}/>
          {/* Konfeti — sadece galibiyet */}
          {finalRes==="W"&&[...Array(12)].map((_,i)=>(
            <div key={i} style={{
              position:"absolute",
              left:`${8+i*8}%`,top:0,
              width:6,height:6,
              borderRadius:i%2===0?"50%":"2px",
              background:["#ffd700","#ff4444","#4da6ff","#30e070","#c084fc"][i%5],
              animation:`confettiFall ${0.6+i*0.1}s ease ${i*0.04}s both`,
              pointerEvents:"none"
            }}/>
          ))}
          <div style={{textAlign:"center",marginBottom:10,position:"relative"}}>
            {/* Büyük sonuç etiketi */}
            <div style={{
              fontSize:"1.4rem",fontWeight:900,letterSpacing:3,color:resCol,
              textShadow:`0 0 30px ${resCol}88`,marginBottom:6,
              animation:"scorePop .4s ease"
            }}>
              {finalRes==="W"?"🏆 GALİBİYET!":finalRes==="L"?"😞 MAĞLUBİYET":"🤝 BERABERLİK"}
            </div>
            {r.scorers.length>0&&<div style={{
              fontSize:".58rem",marginBottom:6,
              background:"rgba(255,255,255,.05)",borderRadius:8,
              padding:"4px 10px",display:"inline-block"
            }}>
              ⚽ <span style={{color:C.grn2,fontWeight:700}}>{r.scorers.join(", ")}</span>
            </div>}
            {/* İstatistik kartları */}
            <div style={{display:"flex",justifyContent:"center",gap:6,marginTop:8}}>
              {[
                ["PUAN",finalRes==="W"?3:finalRes==="D"?1:0,C.gd],
                ["ŞUT",r.stats.myShots,C.ac2],
                ["İSABET",r.stats.myOnTarget,C.grn2],
                ["KÖŞE",r.stats.myCorners,C.ac2],
                ["TOP",poss+"%",C.pur2],
              ].map(([l,v,c],i)=>(
                <div key={l} style={{
                  textAlign:"center",flex:1,
                  background:`rgba(255,255,255,.05)`,
                  border:`1px solid rgba(255,255,255,.08)`,
                  borderRadius:8,padding:"6px 4px",
                  animation:`slideUp .3s ease ${i*0.06}s both`
                }}>
                  <div style={{fontSize:".38rem",color:C.dmr,letterSpacing:.5,marginBottom:2}}>{l}</div>
                  <div style={{fontSize:".92rem",fontWeight:800,color:c}}>{v}</div>
                </div>
              ))}
            </div>
          </div>
          <button onClick={()=>onFinish({...r, res:finalRes, myG:myScore, opG:oppScore})} style={{
            display:"block",width:"100%",padding:12,
            background:finalRes==="W"
              ?"linear-gradient(135deg,#065f46,#10b981)"
              :finalRes==="L"
              ?"linear-gradient(135deg,#7f1d1d,#dc2626)"
              :"linear-gradient(135deg,#78350f,#d97706)",
            border:"none",color:"#fff",fontSize:".78rem",fontWeight:800,
            letterSpacing:2,cursor:"pointer",borderRadius:10,fontFamily:"inherit",
            boxShadow:finalRes==="W"?"0 4px 20px rgba(16,185,129,.4)":
              finalRes==="L"?"0 4px 20px rgba(220,38,38,.3)":"0 4px 20px rgba(217,119,6,.3)",
            position:"relative"
          }}>
            ▶ DEVAM ET
          </button>
        </div>}
      </div>
      <style>{`
        @keyframes blink{0%,100%{opacity:1}50%{opacity:.15}}
        @keyframes goalBurst{0%{width:0;height:0;opacity:1}60%{width:60px;height:60px;opacity:.7}100%{width:80px;height:80px;opacity:0}}
        @keyframes goalBurst2{0%{width:0;height:0;opacity:.8}100%{width:110px;height:110px;opacity:0}}
        @keyframes confettiFall{0%{transform:translateY(-10px) rotate(0deg);opacity:1}100%{transform:translateY(80px) rotate(720deg);opacity:0}}
        @keyframes scorePop{0%{transform:scale(.6);opacity:0}60%{transform:scale(1.1)}100%{transform:scale(1);opacity:1}}
        @keyframes slideUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes goalLabel{0%{opacity:0;transform:translate(-50%,-150%) scale(.7)}15%{opacity:1;transform:translate(-50%,-160%) scale(1.05)}80%{opacity:1;transform:translate(-50%,-160%) scale(1)}100%{opacity:0;transform:translate(-50%,-170%) scale(.95)}}
        @keyframes missPulse{0%{width:0;height:0;opacity:1}100%{width:40px;height:40px;opacity:0}}
        @keyframes savePulse{0%{width:0;height:0;opacity:1}100%{width:44px;height:44px;opacity:0}}
        @keyframes cardPop{0%{opacity:0;transform:translate(-50%,-50%) rotate(-10deg) scale(.5)}20%{opacity:1;transform:translate(-50%,-80%) rotate(-10deg) scale(1.2)}80%{opacity:1;transform:translate(-50%,-80%) rotate(-10deg) scale(1)}100%{opacity:0;transform:translate(-50%,-90%) rotate(-10deg) scale(.9)}}
        @keyframes chancePulse{0%{width:0;height:0;opacity:1}100%{width:36px;height:36px;opacity:0}}
        @keyframes popIn{from{opacity:0;transform:scale(.9)}to{opacity:1;transform:scale(1)}}
        @keyframes fadeSlide{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
      `}</style>
    </div>
  );
}
