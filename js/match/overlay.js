// ═══════════════════════════════════════════════════════════════
// MAÇ OVERLAY — GELİŞTİRİLMİŞ
// ═══════════════════════════════════════════════════════════════
// Hız ayarları: [interval_ms, dakika_per_tick, flash_süre_ms]
const SPEED_CONFIGS={
  slow:  {ms:280, dpt:1, flash:4500, label:"🐢 Yavaş"},
  normal:{ms:280, dpt:1, flash:4500, label:"▶ Normal"},
  fast:  {ms:45,  dpt:3, flash:1800, label:"⚡ Hızlı"},
};

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
  const [soundOn,setSoundOn]=useState(true);
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
  // ── MAÇ GÖRÜNÜMÜ: 2D / 3D ── kalıcı tercih (fcym_match_view, varsayılan "2d").
  // WebGL testi maç başına bir kez (olumlu sonuç three3d.js'te önbellekte).
  const [view3dInit]=useState(()=>{
    let ok=false; try{ ok=hasWebGLSupport(); }catch(e){ ok=false; }
    return {ok,mode:ok&&getMatchViewPref()==="3d"?"3d":"2d"};
  });
  const webgl3dOk=view3dInit.ok;
  const [viewMode,setViewMode]=useState(view3dInit.mode);
  const [view3dNotice,setView3dNotice]=useState("");
  const is3D=viewMode==="3d";
  const [cam3D,setCam3D]=useState("broadcast");
  const pitch3dApiRef=useRef(null);
  const viewModeRef=useRef(viewMode);
  viewModeRef.current=viewMode;
  // Kilit an 3D mi oynansın? 3D görünümdeyse evet (kilit an başında sabitlenir)
  const use3DMoment=()=>viewModeRef.current==="3d";
  // Gol atanlar (skor tabelası için; motor sonucu değişmez): [{min,team,name}]
  const [goalList,setGoalList]=useState([]);
  useEffect(()=>{
    if(!view3dNotice) return;
    const t=setTimeout(()=>setView3dNotice(""),4500);
    return()=>clearTimeout(t);
  },[view3dNotice]);
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
  const pausedRef=useRef(false);   // interval duraklatıldı mı
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
  const playWhistle=(long=false)=>{
    if(long){
      // Devre arası / maç sonu: ref düdüğü
      playSound('whistle_ref',0.9);
    } else {
      // Kısa: metal düdük
      playSound('whistle_short',0.85);
    }
  };

  // Maç sonu: gerçek final düdüğü sesi
  const playFinalWhistle=()=>{ playSound('final_whistle',1.0); };

  // Stadyum sesi — gol kutlaması
  const playCrowd=(joy=true)=>{
    if(!joy) return; // uğultu kaldırıldı
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
  const playFoulWhistle=()=>{ playSound('whistle_short',0.7); };

  useEffect(()=>{ soundOnRef.current=soundOn; },[soundOn]);

  // Müdahale anı çözümlendi — skoru güncelle ve maçı devam ettir
  const handleMomentResolve=(res)=>{
    const momentMin=activeMoment?.min||minute;
    setActiveMoment(null);
    // Skor tabelası listesi (yalnız görsel)
    if(res.goalScored) setGoalList(g=>[...g,{min:momentMin,team:"me",name:res.player||""}]);
    else if(res.goalConceded) setGoalList(g=>[...g,{min:momentMin,team:"opp",name:""}]);
    // Gol/gol yenme güncelle
    if(res.goalScored){
      setMyScore(s=>s+1);
      playWhistle(false);
      setTimeout(()=>playCrowd(true),180);
      setFlash({text:`⚽ GOL! ${res.player} — ${MOMENT_TYPES[res.momentType]?.label||""}`,col:C.grn2,big:true,min:0});
      setTimeout(()=>setFlash(null),3500);
      setLog(l=>[...l,{min:momentsRef.current.find(m=>m.type===res.momentType)?.min||0,
        text:`⚽ [MÜDAHALE] GOL! ${res.player} — ${res.msg}`,col:C.grn2,big:true}]);
    } else if(res.goalConceded){
      setOppScore(s=>s+1);
      setFlash({text:`😨 GOL YEDİK! ${res.msg}`,col:C.red2,big:true,min:0});
      setTimeout(()=>setFlash(null),3500);
      setLog(l=>[...l,{min:0,text:`😨 [MÜDAHALE] Gol yedik — ${res.msg}`,col:C.red2,big:true}]);
    } else {
      setLog(l=>[...l,{min:0,text:`🎮 [MÜDAHALE] ${res.msg}`,col:res.success?C.grn2:"#e67e22"}]);
    }
    // Maçı devam ettir
    setTimeout(()=>{
      pausedRef.current=false;
      runIntervalRef.current&&runIntervalRef.current();
    },300);
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

  // 3D önizleme: "Takip" kamerası için topun konumunu 3D sahneye ilet
  useEffect(()=>{
    const api=pitch3dApiRef.current;
    if(api&&!api.isDisposed()) api.setFocus(ballPos[0],ballPos[1]);
  },[ballPos]);

  // 3D önizleme: kendi takımımızın kısa isim etiketleri (2D sahadaki ile aynı kural)
  // (2D görünümde hesaplanmaz — hook sırası korunur, yalnızca içerik koşullu)
  const labels3d=React.useMemo(()=>!is3D?null:playerDots.map((p,i)=>{
    const pl=lineup.length>0?squad[lineup[i]]:squad[i];
    if(!pl||!pl.n) return "";
    return pl.n.split(".")[1]||pl.n.split(" ")[0]||pl.n;
  }),[is3D,lineup,squad,playerDots.length]);
  // 3D sahne denetleyicisi bu ref'i her karede okur (React state'i karede güncellenmez)
  const live3dRef=useRef(null);
  if(is3D) live3dRef.current={my:playerDots,opp:oppDots,ball:ballPos,events:events3dQueueRef.current,labels:labels3d};
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
      ivRef.current=setInterval(()=>{        // Hız değiştiyse interval'i yeniden başlat
        const curCfg=SPEED_CONFIGS[speedRef.current]||SPEED_CONFIGS.normal;
        if(curCfg.ms!==cfg.ms){
          clearInterval(ivRef.current);
          runInterval();
          return;
        }

        tick.current+=1;
        const dpt=curCfg.dpt;
        const m=tick.current*dpt;

        // Duraklatma kontrolü (müdahale anı aktifse atla)
        if(pausedRef.current) return;

        // Müdahale anı tetikle?
        const nextMoment=momentsRef.current.find(mo=>!mo.resolved&&mo.min<=m&&mo.min>(m-dpt));
        if(nextMoment&&speedRef.current==="slow"){
          nextMoment.resolved=true;
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
          if(e.type==="goal"){
            if(e.team==="me") setMyScore(s=>s+1);
            else setOppScore(s=>s+1);
            setGoalList(g=>[...g,{min:e.min,team:e.team==="me"?"me":"opp",name:e.team==="me"?(e.scorer||""):""}]);
            // Gol sesi: kısa düdük + stadyum kutlaması
            setTimeout(()=>{ playWhistle(false); setTimeout(()=>playCrowd(true),180); },0);
            // ── GOL SONRASI RESET: oyuncular mevkilerine dönsün ──
            setTimeout(()=>{
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
          if(["foul","yellow","yellow2red","red","handball","penalty_won"].includes(e.type)){
            setTimeout(()=>playFoulWhistle(),0);
          }
          // Top pozisyonunu olayla hizala
          if(e.zone) setBallPos(e.zone);
          // ── CANLI SAHA ANİMASYONU: event'e göre saha efekti ──
          if(e.zone){
            const eid=++ballEvIdRef.current;
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
          setLog(l=>[...l,{min:e.min,...entry}]);
          if(entry.big){
            setFlash({...entry,min:e.min});
            setTimeout(()=>setFlash(null),curCfg.flash);
          }
        });

        if(m>=90){
          clearInterval(ivRef.current);
          setMinute(90);
          setPhase("result");
          // Maç sonu: sentezlenmiş 3 düdük (uzun-kısa-kısa)
          setTimeout(()=>playFinalWhistle(),120);
        }
        else setMinute(m);
      },cfg.ms);
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

  // Top ısısına göre renk
  const ballCol=ballPos[0]>60?C.grn2:ballPos[0]<40?C.red2:C.gd;

  // ── 2D/3D geçişi: maç akışına (interval, skor, kilit anlar, devre arası) dokunmaz ──
  const pickView=(next)=>{
    if(next==="3d"&&!webgl3dOk){ setView3dNotice("Cihazın 3D desteklemiyor; maç 2D görünümde devam ediyor."); return; }
    if(next===viewModeRef.current) return;
    if(next!=="3d") pitch3dApiRef.current=null;
    setViewMode(next);
    setMatchViewPref(next);
    setView3dNotice("");
    if(next==="3d"&&tab==="pitch") setTab("log"); // 3D'de "Saha" sekmesi yok
  };
  // 3D modda sonuç paneli kısa ekranda alta taşabilir → maç bitince "DEVAM ET" görünür olsun
  const resultPanelRef=useRef(null);
  useEffect(()=>{
    if(phase!=="result"||viewMode!=="3d") return;
    const t=setTimeout(()=>{
      try{ resultPanelRef.current&&resultPanelRef.current.scrollIntoView({block:"end",behavior:"smooth"}); }catch(e){}
    },150);
    return()=>clearTimeout(t);
  },[phase,viewMode]);
  // Three yüklenemedi / Pitch3D hata verdi → bu maç için 2D (tercih kalıcı olarak değişmez)
  const on3dViewError=()=>{
    pitch3dApiRef.current=null;
    if(viewModeRef.current!=="3d") return;
    setViewMode("2d");
    setView3dNotice("3D görünüm açılamadı; maç 2D görünümde devam ediyor.");
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
      {activeMoment&&(activeMoment.view3D?(
        <InteractiveMoment3D
          moment={activeMoment}
          myStr={myStr}
          oppStr={fixture.str}
          onResolve={handleMomentResolve}
          onFallback={on3dViewError}
        />
      ):(
        <InteractiveMoment
          moment={activeMoment}
          myStr={myStr}
          oppStr={fixture.str}
          onResolve={handleMomentResolve}
        />
      ))}
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
            pausedRef.current=false;
            runIntervalRef.current();
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
            {/* Maç görünümü: 2D / 3D */}
            <div style={{display:"flex",gap:1,background:"rgba(0,0,0,.4)",borderRadius:4,padding:2,border:`1px solid rgba(77,166,255,0.1)`}}>
              {[["2d","2D"],["3d","3D"]].map(([k,l])=>{
                const on=viewMode===k, off=k==="3d"&&!webgl3dOk;
                return(
                  <button key={k} onClick={()=>pickView(k)} aria-disabled={off}
                    title={off?"Cihazın 3D desteklemiyor":k==="3d"?"3D maç görünümü":"2D maç görünümü"}
                    style={{padding:"2px 6px",borderRadius:3,fontFamily:"inherit",border:"none",
                      fontSize:".46rem",fontWeight:on?800:500,letterSpacing:.3,
                      cursor:off?"not-allowed":"pointer",opacity:off?0.4:1,
                      background:on?"linear-gradient(135deg,#6b3fd1,#8e5cf7)":"transparent",
                      color:on?"#fff":C.dmr,transition:"all .15s"}}>{l}</button>
                );
              })}
            </div>
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
                  <button key={k} onClick={()=>{setSpeed(k);speedRef.current=k;}}
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

        {/* ── 2D/3D bildirimi (WebGL yok / 3D açılamadı) ── */}
        {view3dNotice&&<div style={{margin:"5px 10px 0",padding:"4px 10px",borderRadius:5,flexShrink:0,
          fontSize:".52rem",fontWeight:700,color:"#f5c26b",background:"rgba(245,194,107,.08)",
          border:"1px solid rgba(245,194,107,.35)",textAlign:"center",animation:"fadeSlide .2s ease"}}>
          ⚠️ {view3dNotice}
        </div>}

        {/* ── SKOR PANELİ ── (3D'de skor tabelası 3D görünümün üstünde) */}
        {!is3D&&<div style={{padding:"8px 14px 4px",background:"linear-gradient(180deg,#091728,transparent)",
          display:"flex",alignItems:"center",flexShrink:0}}>
          <div style={{textAlign:"center",flex:1,minWidth:0}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:4,marginBottom:3}}>
              <TeamBadge name={clubName} size="md"/>
            </div>
            <div style={{fontSize:clubName.length>10?".38rem":".5rem",letterSpacing:clubName.length>10?0:2,color:C.ac2,fontWeight:700,marginBottom:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{clubName.toUpperCase()}</div>
            <div style={{fontSize:"2.8rem",fontWeight:900,lineHeight:1,
              color:phase==="result"?resCol:C.wh,
              textShadow:myScore>oppScore?"0 0 24px rgba(39,174,96,.6)":"none",
              transition:"all .3s"}}>{myScore}</div>
          </div>
          <div style={{textAlign:"center",padding:"0 10px"}}>
            <div style={{fontSize:".5rem",color:C.dmr,letterSpacing:2,marginBottom:3}}>vs</div>
            {phase==="playing"&&<div style={{fontSize:".42rem",color:C.dim,letterSpacing:1,
              background:"rgba(26,110,216,.08)",border:`1px solid rgba(77,166,255,0.1)`,borderRadius:2,padding:"1px 5px"}}>
              {devre}
            </div>}
          </div>
          <div style={{textAlign:"center",flex:1,minWidth:0}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:4,marginBottom:3}}>
              <TeamBadge name={fixture.opp} size="md"/>
            </div>
            <div style={{fontSize:fixture.opp.length>10?".38rem":".5rem",letterSpacing:fixture.opp.length>10?0:2,color:C.red2,fontWeight:700,marginBottom:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{fixture.opp.toUpperCase()}</div>
            <div style={{fontSize:"2.8rem",fontWeight:900,lineHeight:1,
              color:phase==="result"?(finalRes==="L"?C.grn2:finalRes==="W"?C.red2:C.gd):C.wh,
              transition:"all .3s"}}>{oppScore}</div>
          </div>
        </div>}

        {/* ── PROGRESS BAR ── */}
        {phase==="playing"&&<div style={{padding:"0 12px 5px",flexShrink:0}}>
          <div style={{height:3,background:"#0d1a2d",borderRadius:2,overflow:"hidden",marginBottom:2}}>
            <div style={{height:"100%",width:`${(minute/90)*100}%`,
              background:`linear-gradient(90deg,${C.ac},${C.grn2})`,transition:"width .1s"}}/>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:".4rem",color:C.dmr}}>
            <span>0'</span>
            <span style={{color:C.gd}}>45' HT</span>
            <span>90'</span>
          </div>
        </div>}

        {/* ── TOP KONTROLÜ ── */}
        {phase==="playing"&&<div style={{padding:"0 12px 6px",flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:5}}>
            <span style={{fontSize:".52rem",color:C.ac2,fontWeight:700,minWidth:26}}>{poss}%</span>
            <div style={{flex:1,height:7,background:"#0a1520",borderRadius:3,overflow:"hidden",
              display:"flex",position:"relative"}}>
              <div style={{width:`${poss}%`,background:`linear-gradient(90deg,${C.ac},${C.ac2})`,
                borderRadius:"3px 0 0 3px",transition:"width .3s"}}/>
              <div style={{width:`${100-poss}%`,background:`linear-gradient(90deg,#c0392b,${C.red2})`,
                borderRadius:"0 3px 3px 0"}}/>
              {/* Top indikatörü */}
              <div style={{position:"absolute",top:"50%",left:`${poss}%`,transform:"translate(-50%,-50%)",
                width:10,height:10,borderRadius:"50%",background:"#fff",
                boxShadow:"0 0 8px #fff",border:`2px solid ${ballCol}`,
                transition:"left .3s, border-color .3s"}}/>
            </div>
            <span style={{fontSize:".52rem",color:C.red2,fontWeight:700,minWidth:26,textAlign:"right"}}>{100-poss}%</span>
          </div>
        </div>}

        {/* ── 3D MAÇ GÖRÜNÜMÜ (tek örnek) + SKOR TABELASI ── */}
        {is3D&&<div style={{flexShrink:0,padding:"0 8px 6px"}}>
          <div style={{position:"relative",height:view3dH}}>
            {hide3dForMoment?(
              <div style={{height:"100%",borderRadius:6,border:"1px solid rgba(77,166,255,.25)",
                background:"#0b1220",display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:".6rem",color:"#9fb3c8"}}>🎮 Kilit an oynanıyor…</div>
            ):(
              <Pitch3D camera={cam3D} onCameraChange={setCam3D} height={view3dH} controlsAt="bottom"
                paused={showHalftime||(phase!=="playing"&&(phase!=="result"||result3dFrozen))}
                onReady={api=>{
                  pitch3dApiRef.current=api;
                  api.setFocus(ballPos[0],ballPos[1]);
                  // 22 oyuncu + top + olay efektleri; sahne silinirken kendini temizler
                  try{ createMatchActors3D(api,{getSnapshot:()=>live3dRef.current}); }
                  catch(e){ console.error("[3D] oyuncular kurulamadı",e); }
                }}
                onError={on3dViewError}/>
            )}
            <Scoreboard3D clubName={clubName} oppName={fixture.opp} myScore={myScore} oppScore={oppScore}
              minute={minute} half={half3d} goals={goalList}/>
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
          {[["log","📋 Olaylar"],["pitch","⚽ Saha"],["stats","📊 Stats"],["ratings","⭐ Puanlar"]].filter(([t])=>!(is3D&&t==="pitch")).map(([t,l])=>(
            <button key={t} onClick={()=>setTab(t)} style={{
              flex:1,padding:"5px 2px",border:"none",fontFamily:"inherit",cursor:"pointer",
              fontSize:".5rem",letterSpacing:.3,
              background:tab===t?"rgba(45,143,255,.12)":"transparent",
              color:tab===t?C.ac2:C.dim,
              borderBottom:`2px solid ${tab===t?C.ac2:"transparent"}`}}>{l}</button>
          ))}
        </div>

        {/* ── HER ZAMAN GÖRÜNÜR MİNİ SAHA — Sekme bağımsız ── */}
        {phase==="playing"&&!is3D&&<div style={{flexShrink:0,padding:"6px 8px 0"}}>
          <div style={{position:"relative",borderRadius:5,overflow:"hidden",
            height:90,border:"1.5px solid #2a6a2a",
            background:"linear-gradient(180deg,#1a5c1a 0%,#1e6b1e 45%,#1a5c1a 100%)"}}>
            {/* Saha SVG çizgileri — basit */}
            <svg width="100%" height="100%" style={{position:"absolute",inset:0,zIndex:1}} viewBox="0 0 700 260" preserveAspectRatio="none">
              <rect x="18" y="6" width="664" height="248" stroke="rgba(255,255,255,0.45)" strokeWidth="2" fill="none"/>
              <line x1="350" y1="6" x2="350" y2="254" stroke="rgba(255,255,255,0.45)" strokeWidth="1.5"/>
              <circle cx="350" cy="130" r="48" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" fill="none"/>
              <rect x="18" y="77" width="90" height="106" stroke="rgba(255,255,255,0.4)" strokeWidth="1" fill="rgba(255,255,255,0.02)"/>
              <rect x="592" y="77" width="90" height="106" stroke="rgba(255,255,255,0.4)" strokeWidth="1" fill="rgba(255,255,255,0.02)"/>
              <rect x="0" y="103" width="18" height="54" stroke="rgba(255,255,255,0.4)" strokeWidth="1" fill="rgba(192,57,43,0.2)"/>
              <rect x="682" y="103" width="18" height="54" stroke="rgba(255,255,255,0.4)" strokeWidth="1" fill="rgba(45,143,255,0.2)"/>
            </svg>
            {/* Isı haritası */}
            {heatDots.slice(-20).map((d,i)=>(
              <div key={i} style={{position:"absolute",
                left:`${d.x}%`,top:`${d.y}%`,
                width:6,height:6,borderRadius:"50%",
                background:d.x>50?"rgba(39,174,96,.2)":"rgba(192,57,43,.2)",
                transform:"translate(-50%,-50%)",
                opacity:0.15+((i/20)*0.4),filter:"blur(1px)",zIndex:2}}/>
            ))}
            {/* FCY Oyuncu noktaları — NSM tarzı */}
            {playerDots.map(p=>(
              <div key={p.id} style={{
                position:"absolute",left:`${p.x}%`,top:`${p.y}%`,
                width:p.pulse?11:8,height:p.pulse?11:8,borderRadius:"50%",
                background:"#2485ff",border:`1.5px solid ${p.pulse?"#fff":"rgba(255,255,255,.85)"}`,
                transform:"translate(-50%,-50%)",
                boxShadow:p.pulse?`0 0 10px #2485ff,0 0 18px rgba(36,133,255,.5)`:"0 1px 3px rgba(0,0,0,.5)",
                transition:"left 0.12s linear,top 0.12s linear,width .12s,height .12s",zIndex:3}}/>
            ))}
            {/* Rakip oyuncu noktaları */}
            {oppDots.map(p=>(
              <div key={"m"+p.id} style={{
                position:"absolute",left:`${p.x}%`,top:`${p.y}%`,
                width:p.pulse?10:7,height:p.pulse?10:7,borderRadius:"50%",
                background:C.red2,border:"1.5px solid rgba(255,255,255,.75)",
                transform:"translate(-50%,-50%)",
                boxShadow:p.pulse?`0 0 8px ${C.red2}`:"0 1px 2px rgba(0,0,0,.5)",
                transition:"left 0.12s linear,top 0.12s linear,width .12s,height .12s",
                zIndex:3}}/>
            ))}
            {/* Top — NSM parlak */}
            <div style={{position:"absolute",
              left:`${ballPos[0]}%`,top:`${ballPos[1]}%`,
              width:11,height:11,borderRadius:"50%",
              background:"#fff",
              boxShadow:`0 0 12px ${ballCol},0 0 5px rgba(255,255,255,.8)`,
              transform:"translate(-50%,-50%)",
              transition:"left .16s cubic-bezier(.25,.46,.45,.94),top .16s cubic-bezier(.25,.46,.45,.94)",
              zIndex:6,border:"1.5px solid rgba(0,0,0,0.2)"}}/>
            {/* Olay efektleri — mini versiyonu */}
            {ballEvents.map(ev=>{
              if(ev.type==="goal") return(
                <div key={ev.id} style={{position:"absolute",left:`${ev.x}%`,top:`${ev.y}%`,transform:"translate(-50%,-50%)",zIndex:8}}>
                  <div style={{position:"absolute",width:50,height:50,borderRadius:"50%",
                    background:ev.team==="me"?"rgba(39,174,96,0.3)":"rgba(220,50,50,0.3)",
                    border:`2px solid ${ev.team==="me"?C.grn2:C.red2}`,
                    transform:"translate(-50%,-50%)",animation:"goalBurst 0.6s ease-out forwards"}}/>
                  <div style={{position:"absolute",
                    background:ev.team==="me"?"rgba(39,174,96,0.95)":"rgba(200,40,40,0.95)",
                    color:"#fff",fontWeight:900,fontSize:".62rem",
                    padding:"2px 6px",borderRadius:3,
                    transform:"translate(-50%,-160%)",whiteSpace:"nowrap",
                    boxShadow:"0 2px 6px rgba(0,0,0,0.5)",
                    animation:"goalLabel 2s ease-out forwards",letterSpacing:1}}>
                    {ev.team==="me"?"⚽ GOL!":"⚽ GOL YEDİK"}
                  </div>
                </div>
              );
              if(ev.type==="miss") return(
                <div key={ev.id} style={{position:"absolute",left:`${ev.x}%`,top:`${ev.y}%`,transform:"translate(-50%,-50%)",zIndex:8}}>
                  <div style={{position:"absolute",width:24,height:24,borderRadius:"50%",
                    border:"2px dashed rgba(200,153,42,0.8)",transform:"translate(-50%,-50%)",
                    animation:"missPulse 1s ease-out forwards"}}/>
                </div>
              );
              if(ev.type==="save") return(
                <div key={ev.id} style={{position:"absolute",left:`${ev.x}%`,top:`${ev.y}%`,transform:"translate(-50%,-50%)",zIndex:8}}>
                  <div style={{position:"absolute",width:22,height:22,borderRadius:"50%",
                    background:"rgba(45,143,255,0.25)",border:"2px solid rgba(45,143,255,0.8)",
                    transform:"translate(-50%,-50%)",animation:"savePulse 1s ease-out forwards"}}/>
                </div>
              );
              if(ev.type==="yellow"||ev.type==="red"||ev.type==="yellow2red") return(
                <div key={ev.id} style={{position:"absolute",left:`${ev.x}%`,top:`${ev.y}%`,transform:"translate(-50%,-50%)",zIndex:8}}>
                  <div style={{position:"absolute",width:9,height:12,borderRadius:1,
                    background:ev.type==="red"?"#e74c3c":"#f1c40f",
                    transform:"translate(-50%,-50%) rotate(-8deg)",
                    animation:"cardPop 1s ease-out forwards"}}/>
                </div>
              );
              return null;
            })}
            {/* Kale etiketleri */}
            <div style={{position:"absolute",left:2,top:"50%",transform:"translateY(-50%)",zIndex:8,
              fontSize:".38rem",color:C.red2,fontWeight:700,background:"rgba(0,0,0,.7)",
              padding:"1px 3px",borderRadius:2}}>OPP</div>
            <div style={{position:"absolute",right:2,top:"50%",transform:"translateY(-50%)",zIndex:8,
              fontSize:".38rem",color:C.ac2,fontWeight:700,background:"rgba(0,0,0,.7)",
              padding:"1px 3px",borderRadius:2}}>FCY</div>
          </div>
        </div>}

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

        {/* ── SAHA SEKMESİ — Canlı Animasyonlu ── */}
        {tab==="pitch"&&!is3D&&<div style={{flex:1,padding:"6px 8px",display:"flex",flexDirection:"column",gap:5,overflowY:"auto"}}>

          {/* ═══ CANLI SAHA ═══ */}
          <div style={{position:"relative",borderRadius:6,overflow:"hidden",
            aspectRatio:"7/5",border:"2px solid #2a6a2a",
            background:"linear-gradient(180deg,#1a5c1a 0%,#1e6b1e 45%,#1a5c1a 100%)"}}>

            {/* Saha çizgileri SVG */}
            <svg width="100%" height="100%" style={{position:"absolute",inset:0,zIndex:1}} viewBox="0 0 700 500" preserveAspectRatio="none">
              {/* Zemin bantları */}
              {[0,1,2,3,4,5,6].map(i=>(
                <rect key={i} x={i*100} y="0" width="100" height="500"
                  fill={i%2===0?"rgba(0,0,0,0.04)":"rgba(255,255,255,0.02)"}/>
              ))}
              {/* Dış çizgi */}
              <rect x="18" y="12" width="664" height="476" stroke="rgba(255,255,255,0.55)" strokeWidth="2" fill="none" rx="2"/>
              {/* Orta çizgi */}
              <line x1="350" y1="12" x2="350" y2="488" stroke="rgba(255,255,255,0.55)" strokeWidth="1.5"/>
              {/* Orta daire */}
              <circle cx="350" cy="250" r="70" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" fill="none"/>
              <circle cx="350" cy="250" r="3" fill="rgba(255,255,255,0.7)"/>
              {/* Sol ceza sahası */}
              <rect x="18" y="148" width="108" height="204" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" fill="rgba(255,255,255,0.02)"/>
              {/* Sol 6 yarda */}
              <rect x="18" y="198" width="40" height="104" stroke="rgba(255,255,255,0.4)" strokeWidth="1" fill="none"/>
              {/* Sol penaltı noktası */}
              <circle cx="102" cy="250" r="3" fill="rgba(255,255,255,0.6)"/>
              {/* Sol yay */}
              <path d="M 126,192 A 70,70 0 0,1 126,308" stroke="rgba(255,255,255,0.4)" strokeWidth="1" fill="none"/>
              {/* Sağ ceza sahası */}
              <rect x="574" y="148" width="108" height="204" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" fill="rgba(255,255,255,0.02)"/>
              {/* Sağ 6 yarda */}
              <rect x="642" y="198" width="40" height="104" stroke="rgba(255,255,255,0.4)" strokeWidth="1" fill="none"/>
              {/* Sağ penaltı noktası */}
              <circle cx="598" cy="250" r="3" fill="rgba(255,255,255,0.6)"/>
              {/* Sağ yay */}
              <path d="M 574,192 A 70,70 0 0,0 574,308" stroke="rgba(255,255,255,0.4)" strokeWidth="1" fill="none"/>
              {/* Kale soldaki */}
              <rect x="0" y="210" width="18" height="80" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" fill="rgba(192,57,43,0.15)"/>
              {/* Kale sağdaki */}
              <rect x="682" y="210" width="18" height="80" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" fill="rgba(45,143,255,0.15)"/>
            </svg>

            {/* Isı haritası noktaları */}
            <div style={{position:"absolute",inset:0,zIndex:2}}>
              {heatDots.slice(-25).map((d,i)=>(
                <div key={i} style={{position:"absolute",
                  left:`${d.x}%`,top:`${d.y}%`,
                  width:8,height:8,borderRadius:"50%",
                  background:d.x>50?"rgba(39,174,96,.22)":"rgba(192,57,43,.22)",
                  transform:"translate(-50%,-50%)",
                  opacity:0.2+((i/25)*0.5),
                  filter:"blur(1.5px)"}}/>
              ))}
            </div>

            {/* Oyuncu noktaları — NSM tarzı isim etiketli */}
            <div style={{position:"absolute",inset:0,zIndex:3}}>
              {playerDots.map((p,i)=>{
                const pl=lineup.length>0?squad[lineup[i]]:squad[i];
                const speed=Math.sqrt((p.vx||0)**2+(p.vy||0)**2);
                const sz=p.pulse?15:Math.max(9,11-Math.min(2,speed*0.3));
                return(
                  <div key={p.id} style={{position:"absolute",left:`${p.x}%`,top:`${p.y}%`,
                    transform:"translate(-50%,-50%)",zIndex:3,transition:"left 0.12s linear,top 0.12s linear"}}>
                    {/* Nokta */}
                    <div style={{width:sz,height:sz,borderRadius:"50%",background:"#2485ff",
                      border:`2px solid ${p.pulse?"#fff":"rgba(255,255,255,.85)"}`,
                      boxShadow:p.pulse?`0 0 12px #2485ff,0 0 24px rgba(36,133,255,.6)`:"0 2px 4px rgba(0,0,0,.6)",
                      transition:"width .12s,height .12s,box-shadow .12s"}}/>
                    {/* İsim etiketi */}
                    {pl&&<div style={{position:"absolute",top:sz+1,left:"50%",transform:"translateX(-50%)",
                      fontSize:".3rem",color:"#fff",fontWeight:700,whiteSpace:"nowrap",
                      background:"rgba(0,0,0,.72)",padding:"0px 3px",borderRadius:2,
                      letterSpacing:.3,pointerEvents:"none"}}>
                      {pl.n.split(".")[1]||pl.n.split(" ")[0]||pl.n}
                    </div>}
                  </div>
                );
              })}
              {/* Rakip oyuncu noktaları */}
              {oppDots.map(p=>{
                const speed=Math.sqrt((p.vx||0)**2+(p.vy||0)**2);
                const sz=p.pulse?14:Math.max(8,10-Math.min(2,speed*0.3));
                return(
                  <div key={"opp"+p.id} style={{position:"absolute",left:`${p.x}%`,top:`${p.y}%`,
                    transform:"translate(-50%,-50%)",zIndex:3,
                    transition:"left 0.12s linear,top 0.12s linear"}}>
                    <div style={{width:sz,height:sz,borderRadius:"50%",background:C.red2,
                      border:"2px solid rgba(255,255,255,.8)",
                      boxShadow:p.pulse?`0 0 10px ${C.red2}`:"0 2px 4px rgba(0,0,0,.5)",
                      transition:"width .12s,height .12s"}}/>
                  </div>
                );
              })}
            </div>

            {/* Top — NSM tarzı parlak */}
            <div style={{position:"absolute",
              left:`${ballPos[0]}%`,top:`${ballPos[1]}%`,
              width:13,height:13,borderRadius:"50%",
              background:"#fff",
              boxShadow:`0 0 16px ${ballCol},0 0 8px rgba(255,255,255,.9),0 2px 5px rgba(0,0,0,.7)`,
              transform:"translate(-50%,-50%)",
              transition:"left .16s cubic-bezier(.25,.46,.45,.94),top .16s cubic-bezier(.25,.46,.45,.94)",
              zIndex:6,border:"1.5px solid rgba(0,0,0,0.25)"
            }}/>

            {/* ═══ CANLI OLAY EFEKTLERİ ═══ */}
            <div style={{position:"absolute",inset:0,zIndex:7,pointerEvents:"none"}}>
              {ballEvents.map(ev=>{
                if(ev.type==="goal"){
                  return(
                    <div key={ev.id} style={{position:"absolute",left:`${ev.x}%`,top:`${ev.y}%`,
                      transform:"translate(-50%,-50%)",zIndex:8}}>
                      {/* Patlama daire */}
                      <div style={{
                        position:"absolute",
                        width:60,height:60,borderRadius:"50%",
                        background:ev.team==="me"?"rgba(39,174,96,0.35)":"rgba(220,50,50,0.35)",
                        border:`3px solid ${ev.team==="me"?C.grn2:C.red2}`,
                        transform:"translate(-50%,-50%)",
                        animation:"goalBurst 0.6s ease-out forwards"
                      }}/>
                      {/* İkinci dalga */}
                      <div style={{
                        position:"absolute",
                        width:90,height:90,borderRadius:"50%",
                        border:`2px solid ${ev.team==="me"?"rgba(39,174,96,0.5)":"rgba(220,50,50,0.5)"}`,
                        transform:"translate(-50%,-50%)",
                        animation:"goalBurst2 0.9s ease-out 0.15s forwards"
                      }}/>
                      {/* Gol etiketi */}
                      <div style={{
                        position:"absolute",
                        background:ev.team==="me"?"rgba(39,174,96,0.95)":"rgba(200,40,40,0.95)",
                        color:"#fff",fontWeight:900,fontSize:".7rem",
                        padding:"3px 8px",borderRadius:4,
                        transform:"translate(-50%,-150%)",
                        whiteSpace:"nowrap",
                        boxShadow:"0 2px 8px rgba(0,0,0,0.5)",
                        animation:"goalLabel 2s ease-out forwards",
                        letterSpacing:1
                      }}>{ev.team==="me"?"⚽ GOL!":"⚽ GOL YEDİK"}</div>
                    </div>
                  );
                }
                if(ev.type==="miss"){
                  return(
                    <div key={ev.id} style={{position:"absolute",left:`${ev.x}%`,top:`${ev.y}%`,
                      transform:"translate(-50%,-50%)",zIndex:8}}>
                      <div style={{
                        position:"absolute",width:30,height:30,borderRadius:"50%",
                        border:"2px dashed rgba(200,153,42,0.7)",
                        transform:"translate(-50%,-50%)",
                        animation:"missPulse 1s ease-out forwards"
                      }}/>
                      <div style={{
                        position:"absolute",
                        background:"rgba(200,153,42,0.85)",color:"#fff",
                        fontWeight:700,fontSize:".52rem",padding:"1px 5px",borderRadius:3,
                        transform:"translate(-50%,-180%)",whiteSpace:"nowrap",
                        animation:"goalLabel 1s ease-out forwards"
                      }}>KAÇIRILDI</div>
                    </div>
                  );
                }
                if(ev.type==="save"){
                  return(
                    <div key={ev.id} style={{position:"absolute",left:`${ev.x}%`,top:`${ev.y}%`,
                      transform:"translate(-50%,-50%)",zIndex:8}}>
                      <div style={{
                        position:"absolute",width:28,height:28,borderRadius:"50%",
                        background:"rgba(45,143,255,0.3)",
                        border:"2px solid rgba(45,143,255,0.8)",
                        transform:"translate(-50%,-50%)",
                        animation:"savePulse 1s ease-out forwards"
                      }}/>
                      <div style={{
                        position:"absolute",
                        background:"rgba(45,143,255,0.9)",color:"#fff",
                        fontWeight:700,fontSize:".5rem",padding:"1px 5px",borderRadius:3,
                        transform:"translate(-50%,-180%)",whiteSpace:"nowrap",
                        animation:"goalLabel 1s ease-out forwards"
                      }}>🧤 KURTARIŞ</div>
                    </div>
                  );
                }
                if(ev.type==="yellow"||ev.type==="yellow2red"||ev.type==="red"){
                  const cardCol=ev.type==="red"?"#e74c3c":ev.type==="yellow2red"?"#e67e22":"#f1c40f";
                  return(
                    <div key={ev.id} style={{position:"absolute",left:`${ev.x}%`,top:`${ev.y}%`,
                      transform:"translate(-50%,-50%)",zIndex:8}}>
                      <div style={{
                        position:"absolute",
                        width:12,height:16,borderRadius:2,
                        background:cardCol,
                        border:"1px solid rgba(255,255,255,0.6)",
                        transform:"translate(-50%,-50%) rotate(-10deg)",
                        boxShadow:`0 0 8px ${cardCol}`,
                        animation:"cardPop 1s ease-out forwards"
                      }}/>
                    </div>
                  );
                }
                if(ev.type==="chance"||ev.type==="counter"){
                  return(
                    <div key={ev.id} style={{position:"absolute",left:`${ev.x}%`,top:`${ev.y}%`,
                      transform:"translate(-50%,-50%)",zIndex:8}}>
                      <div style={{
                        position:"absolute",width:22,height:22,borderRadius:"50%",
                        border:`2px solid ${ev.team==="me"?C.grn2:C.red2}`,
                        transform:"translate(-50%,-50%)",
                        animation:"chancePulse 1s ease-out forwards"
                      }}/>
                    </div>
                  );
                }
                return null;
              })}
            </div>

            {/* Kale etiketleri */}
            <div style={{position:"absolute",left:3,top:"50%",transform:"translateY(-50%)",zIndex:8,
              fontSize:".42rem",color:C.red2,fontWeight:700,
              background:"rgba(0,0,0,.75)",padding:"2px 4px",borderRadius:2,letterSpacing:1}}>OPP</div>
            <div style={{position:"absolute",right:3,top:"50%",transform:"translateY(-50%)",zIndex:8,
              fontSize:".42rem",color:C.ac2,fontWeight:700,
              background:"rgba(0,0,0,.75)",padding:"2px 4px",borderRadius:2,letterSpacing:1}}>FCY</div>

            {/* Bölge etiketi */}
            <div style={{position:"absolute",bottom:4,left:"50%",transform:"translateX(-50%)",zIndex:8,
              fontSize:".4rem",color:"rgba(255,255,255,.7)",
              background:"rgba(0,0,0,.5)",padding:"1px 8px",borderRadius:10,whiteSpace:"nowrap",
              letterSpacing:.5}}>
              {ballPos[0]>78?"🔥 Rakip Ceza Sahası":ballPos[0]>58?"Rakip Yarısı":ballPos[0]>42?"Orta Saha":ballPos[0]>22?"Kendi Yarısı":"🛡️ Kendi Ceza Sahası"}
            </div>

            {/* Dakika göstergesi saha üzerinde */}
            {phase==="playing"&&<div style={{position:"absolute",top:5,left:"50%",transform:"translateX(-50%)",zIndex:8,
              fontSize:".48rem",color:"rgba(255,255,255,.85)",fontWeight:700,
              background:"rgba(0,0,0,.55)",padding:"1px 7px",borderRadius:8,letterSpacing:1}}>
              {minute}'
            </div>}
          </div>

          {/* Formasyon bilgisi */}
          <div style={{display:"flex",gap:5}}>
            <div style={{flex:1,padding:"5px 8px",background:"rgba(45,143,255,.08)",
              border:"1px solid rgba(45,143,255,.2)",borderRadius:4,display:"flex",alignItems:"center",gap:6}}>
              <div style={{width:9,height:9,borderRadius:"50%",background:C.ac,flexShrink:0,
                boxShadow:`0 0 6px ${C.ac2}`}}/>
              <div>
                <div style={{fontSize:".36rem",color:C.dmr,letterSpacing:.8}}>SİZİN DİZİLİŞ</div>
                <div style={{fontSize:".65rem",fontWeight:900,color:C.ac2,letterSpacing:2}}>{formation||"4-4-2"}</div>
              </div>
            </div>
            <div style={{flex:1,padding:"5px 8px",
              background:oppFormChangedAt?"rgba(232,146,42,.1)":"rgba(192,57,43,.08)",
              border:`1px solid ${oppFormChangedAt?"rgba(232,146,42,.4)":"rgba(192,57,43,.2)"}`,borderRadius:4,
              display:"flex",alignItems:"center",gap:6}}>
              <div style={{width:9,height:9,borderRadius:"50%",background:C.red2,flexShrink:0}}/>
              <div>
                <div style={{fontSize:".36rem",color:C.dmr,letterSpacing:.8,display:"flex",gap:4,alignItems:"center"}}>
                  RAKİP DİZİLİŞ
                  {oppFormChangedAt&&<span style={{color:"#e8922a",fontSize:".34rem"}}>⚡{Math.round(oppFormChangedAt)}'</span>}
                </div>
                <div style={{fontSize:".65rem",fontWeight:900,color:oppFormChangedAt?"#e8922a":C.red2,letterSpacing:2}}>{oppFormation}</div>
              </div>
            </div>
          </div>

          {/* Top kontrolü özet */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5}}>
            {[
              ["Top Kontrolü",`${poss}%`,`${100-poss}%`,C.ac2,C.red2],
              ["Aktif Bölge",ballPos[0]>58?"Hücum":ballPos[0]>42?"Orta":"Defans",
                ballPos[0]<42?"Hücum":ballPos[0]<58?"Orta":"Defans",
                ballPos[0]>58?C.grn2:C.gd,ballPos[0]<42?C.red2:C.gd],
            ].map(([l,my,op,mc,oc])=>(
              <div key={l} style={{padding:"4px 7px",background:"rgba(0,0,0,.2)",
                border:"1px solid rgba(77,166,255,0.1)",borderRadius:3,textAlign:"center"}}>
                <div style={{fontSize:".38rem",color:C.dmr,marginBottom:2}}>{l}</div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontSize:".56rem",fontWeight:700,color:mc}}>{my}</span>
                  <span style={{fontSize:".38rem",color:"#445"}}>/</span>
                  <span style={{fontSize:".56rem",fontWeight:700,color:oc}}>{op}</span>
                </div>
              </div>
            ))}
          </div>
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
