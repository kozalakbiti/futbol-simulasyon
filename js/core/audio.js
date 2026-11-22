// ─── DİĞER MENÜ SAYFASI ─────────────────────────────────────

// ═══════════════════════════════════════════════════════════════
// MÜZİK & ATMOSFER — WEB AUDIO API (internet gerektirmez)
// ═══════════════════════════════════════════════════════════════

function AudioPlayer(){
  const [open,  setOpen]  = useState(false);
  const [ambOn, setAmbOn] = useState(false);
  const [ambVol,setAmbVol]= useState(0.5);
  const [atype, setAtype] = useState("match");

  const ctxRef   = useRef(null);
  const masterRef= useRef(null);
  const ambNodes = useRef([]);
  const timers   = useRef([]);

  function ensureCtx(){
    if(!ctxRef.current){
      const c=new (window.AudioContext||window.webkitAudioContext)();
      if(c.state==="suspended") c.resume();
      ctxRef.current=c;
      const m=c.createGain();
      m.gain.value=ambVol;
      m.connect(c.destination);
      masterRef.current=m;
    }
    return ctxRef.current;
  }

  function killAll(){
    timers.current.forEach(id=>clearTimeout(id));
    timers.current=[];
    ambNodes.current.forEach(n=>{try{n.stop();}catch(e){}});
    ambNodes.current=[];
  }

  function pinkNoise(ctx, dur){
    const sr=ctx.sampleRate;
    const frames=Math.ceil(sr*dur);
    const buf=ctx.createBuffer(1,frames,sr);
    const d=buf.getChannelData(0);
    // Pink noise (daha doğal insan kalabalığı hissi için)
    let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0;
    for(let i=0;i<frames;i++){
      const w=Math.random()*2-1;
      b0=0.99886*b0+w*0.0555179;
      b1=0.99332*b1+w*0.0750759;
      b2=0.96900*b2+w*0.1538520;
      b3=0.86650*b3+w*0.3104856;
      b4=0.55000*b4+w*0.5329522;
      b5=-0.7616*b5-w*0.0168980;
      d[i]=(b0+b1+b2+b3+b4+b5+w*0.5362)*0.11;
    }
    return buf;
  }

  // Maç atmosferi: sürekli kalabalık uğultusu + ritimli tezahürat + periyodik patlama
  function startMatch(ctx){
    const M=masterRef.current;
    const nodes=[];

    // — Katman 1: Derin stadyum uğultusu (bas frekanslar)
    const bg1=ctx.createBufferSource();
    bg1.buffer=pinkNoise(ctx,8); bg1.loop=true;
    const lp1=ctx.createBiquadFilter(); lp1.type="lowpass"; lp1.frequency.value=220;
    const g1=ctx.createGain(); g1.gain.value=0.7;
    bg1.connect(lp1); lp1.connect(g1); g1.connect(M);
    bg1.start(); nodes.push(bg1);

    // — Katman 2: Orta frekans kalabalık (insanların konuşma frekansı 300-3000 Hz)
    const bg2=ctx.createBufferSource();
    bg2.buffer=pinkNoise(ctx,6); bg2.loop=true;
    const bp2=ctx.createBiquadFilter(); bp2.type="bandpass"; bp2.frequency.value=800; bp2.Q.value=0.3;
    const g2=ctx.createGain(); g2.gain.value=0.45;
    // Yavaş soluk LFO (kalabalığın nefes alıp vermesi)
    const lfo2=ctx.createOscillator(); lfo2.type="sine"; lfo2.frequency.value=0.04;
    const lg2=ctx.createGain(); lg2.gain.value=0.12;
    lfo2.connect(lg2); lg2.connect(g2.gain);
    bg2.connect(bp2); bp2.connect(g2); g2.connect(M);
    bg2.start(); lfo2.start(); nodes.push(bg2,lfo2);

    // — Katman 3: Tiz frekans (ıslık, yüksek sesler)
    const bg3=ctx.createBufferSource();
    bg3.buffer=pinkNoise(ctx,4); bg3.loop=true;
    const hp3=ctx.createBiquadFilter(); hp3.type="highpass"; hp3.frequency.value=2500;
    const lp3=ctx.createBiquadFilter(); lp3.type="lowpass"; lp3.frequency.value=6000;
    const g3=ctx.createGain(); g3.gain.value=0.12;
    bg3.connect(hp3); hp3.connect(lp3); lp3.connect(g3); g3.connect(M);
    bg3.start(); nodes.push(bg3);

    // — Ritimli davul tezahüratı (tribün davulu: boom-boom-clap)
    const bpm=120; const beat=60/bpm;
    let tk=0;
    function tribun(){
      const now=ctx.currentTime;
      // Boom (kick davul)
      if(tk%4===0||tk%4===1){
        const ko=ctx.createOscillator(), kg=ctx.createGain();
        ko.type="sine"; ko.frequency.setValueAtTime(180,now);
        ko.frequency.exponentialRampToValueAtTime(45,now+0.22);
        kg.gain.setValueAtTime(0,now);
        kg.gain.linearRampToValueAtTime(0.9,now+0.01);
        kg.gain.exponentialRampToValueAtTime(0.001,now+0.3);
        ko.connect(kg); kg.connect(M);
        ko.start(now); ko.stop(now+0.35); nodes.push(ko);
      }
      // Clap (3. vuruş)
      if(tk%4===2){
        const sg=ctx.createGain();
        const ss=ctx.createBufferSource();
        ss.buffer=pinkNoise(ctx,0.18);
        const sbp=ctx.createBiquadFilter(); sbp.type="bandpass"; sbp.frequency.value=1200; sbp.Q.value=1.5;
        const shp=ctx.createBiquadFilter(); shp.type="highpass"; shp.frequency.value=600;
        sg.gain.setValueAtTime(0,now);
        sg.gain.linearRampToValueAtTime(0.65,now+0.015);
        sg.gain.exponentialRampToValueAtTime(0.001,now+0.2);
        ss.connect(sbp); sbp.connect(shp); shp.connect(sg); sg.connect(M);
        ss.start(now); nodes.push(ss);
      }
      // "HAAYDEE" tezahürat (her 8 vuruşta bir ses yükselir)
      if(tk%8===0&&tk>0){
        const cg=ctx.createGain();
        const cs=ctx.createBufferSource();
        cs.buffer=pinkNoise(ctx,0.6);
        const cbp=ctx.createBiquadFilter(); cbp.type="bandpass"; cbp.frequency.value=650; cbp.Q.value=0.6;
        cg.gain.setValueAtTime(0,now);
        cg.gain.linearRampToValueAtTime(0.55,now+0.08);
        cg.gain.linearRampToValueAtTime(0.35,now+0.4);
        cg.gain.exponentialRampToValueAtTime(0.001,now+0.7);
        cs.connect(cbp); cbp.connect(cg); cg.connect(M);
        cs.start(now); nodes.push(cs);
      }
      tk++;
      const tid=setTimeout(tribun, beat*1000);
      timers.current.push(tid);
    }
    tribun();

    // — Periyodik kalabalık patlaması (spontane tezahürat)
    function swell(){
      const now=ctx.currentTime;
      const dur=1.2+Math.random()*1.5;
      const sg=ctx.createGain();
      const ss=ctx.createBufferSource();
      ss.buffer=pinkNoise(ctx,dur+0.5);
      const bp=ctx.createBiquadFilter(); bp.type="bandpass";
      bp.frequency.value=500+Math.random()*300; bp.Q.value=0.5;
      sg.gain.setValueAtTime(0,now);
      sg.gain.linearRampToValueAtTime(0.5+Math.random()*0.3,now+0.25);
      sg.gain.linearRampToValueAtTime(0.05,now+dur);
      sg.gain.exponentialRampToValueAtTime(0.001,now+dur+0.3);
      ss.connect(bp); bp.connect(sg); sg.connect(M);
      ss.start(now); nodes.push(ss);
      const next=3000+Math.random()*5000;
      const tid=setTimeout(swell,next);
      timers.current.push(tid);
    }
    swell();

    ambNodes.current=nodes;
  }

  // Gol tezahüratı: uzun yükselen patlama
  function startGoal(ctx){
    const M=masterRef.current;
    const nodes=[];
    const now=ctx.currentTime;
    // Kalabalık çığlığı - yüksek bant
    for(let i=0;i<4;i++){
      const sg=ctx.createGain();
      const ss=ctx.createBufferSource();
      ss.buffer=pinkNoise(ctx,4);
      const bp=ctx.createBiquadFilter(); bp.type="bandpass";
      bp.frequency.value=400+i*300; bp.Q.value=0.4+i*0.1;
      sg.gain.setValueAtTime(0,now);
      sg.gain.linearRampToValueAtTime(0.7-i*0.08,now+0.15);
      sg.gain.setValueAtTime(0.6-i*0.08,now+1.5);
      sg.gain.exponentialRampToValueAtTime(0.001,now+4.5);
      ss.connect(bp); bp.connect(sg); sg.connect(M);
      ss.start(now); nodes.push(ss);
    }
    // Uzun gol çığlığı (yükselen frekans)
    const wo=ctx.createOscillator(), wg=ctx.createGain();
    wo.type="sine"; wo.frequency.setValueAtTime(280,now);
    wo.frequency.linearRampToValueAtTime(380,now+1.2);
    wo.frequency.linearRampToValueAtTime(320,now+3);
    wg.gain.setValueAtTime(0,now);
    wg.gain.linearRampToValueAtTime(0.18,now+0.2);
    wg.gain.exponentialRampToValueAtTime(0.001,now+3.5);
    wo.connect(wg); wg.connect(M);
    wo.start(now); wo.stop(now+4); nodes.push(wo);
    // 2 saniye sonra dur - ana ses devam eder
    setTimeout(()=>{nodes.forEach(n=>{try{n.stop();}catch(e){}});},5000);
    ambNodes.current=[...ambNodes.current,...nodes];
  }

  // Sessiz tribün (kuru alkış - daha az taraftar)
  function startCalm(ctx){
    const M=masterRef.current;
    const nodes=[];
    // Düşük arka plan
    const bg=ctx.createBufferSource();
    bg.buffer=pinkNoise(ctx,8); bg.loop=true;
    const lp=ctx.createBiquadFilter(); lp.type="lowpass"; lp.frequency.value=400;
    const g=ctx.createGain(); g.gain.value=0.25;
    bg.connect(lp); lp.connect(g); g.connect(M);
    bg.start(); nodes.push(bg);
    // Seyrek alkış
    function clap(){
      const now=ctx.currentTime;
      const cg=ctx.createGain();
      const cs=ctx.createBufferSource();
      cs.buffer=pinkNoise(ctx,0.5);
      const cbp=ctx.createBiquadFilter(); cbp.type="bandpass"; cbp.frequency.value=1000; cbp.Q.value=1.2;
      cg.gain.setValueAtTime(0,now);
      cg.gain.linearRampToValueAtTime(0.3,now+0.02);
      cg.gain.exponentialRampToValueAtTime(0.001,now+0.5);
      cs.connect(cbp); cbp.connect(cg); cg.connect(M);
      cs.start(now); nodes.push(cs);
      const tid=setTimeout(clap,2500+Math.random()*4000);
      timers.current.push(tid);
    }
    clap();
    ambNodes.current=nodes;
  }

  useEffect(()=>{
    if(masterRef.current) masterRef.current.gain.value=ambVol;
  },[ambVol]);

  useEffect(()=>{
    if(!ctxRef.current&&!ambOn) return;
    killAll();
    if(ambOn){
      const ctx=ensureCtx();
      if(atype==="match") startMatch(ctx);
      else startCalm(ctx);
    }
  },[ambOn,atype]);

  useEffect(()=>()=>{killAll();if(ctxRef.current)ctxRef.current.close();},[]);

  const ambTypes=[
    {id:"match",lbl:"🏟️ Maç"},
    {id:"calm", lbl:"👥 Sessiz"},
  ];

  const Tog=({on,onToggle,color})=>(
    <div onClick={onToggle} style={{width:36,height:18,borderRadius:9,cursor:"pointer",position:"relative",
      background:on?color:"rgba(255,255,255,.1)",transition:"background .2s"}}>
      <div style={{position:"absolute",top:2,left:on?20:2,width:14,height:14,borderRadius:"50%",
        background:"#fff",transition:"left .2s",boxShadow:"0 1px 3px rgba(0,0,0,.4)"}}/>
    </div>
  );

  return(<>
    <button onClick={()=>{ensureCtx();setOpen(v=>!v);}} style={{
      position:"fixed",bottom:32,right:12,zIndex:500,
      width:40,height:40,borderRadius:"50%",
      background:ambOn?`linear-gradient(135deg,${C.ac},#0944a8)`:"rgba(11,21,37,.92)",
      border:`1px solid ${ambOn?C.ac2:C.brd}`,
      color:ambOn?C.wh:C.dim,fontSize:"1.1rem",cursor:"pointer",
      display:"flex",alignItems:"center",justifyContent:"center",
      boxShadow:ambOn?"0 0 14px rgba(26,110,216,.5)":"0 2px 8px rgba(0,0,0,.5)",
      transition:"all .2s"}}>
      {ambOn?"🏟️":"🔇"}
    </button>
    {open&&<div style={{position:"fixed",bottom:82,right:8,zIndex:500,
      width:220,background:"#05091a",border:`1px solid rgba(77,166,255,0.22)`,
      borderRadius:10,boxShadow:"0 8px 32px rgba(0,0,0,.8)",overflow:"hidden"}}>
      <div style={{padding:"8px 12px",background:"#0a1428",borderBottom:`1px solid rgba(77,166,255,0.22)`,
        display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span style={{fontSize:".6rem",letterSpacing:2,color:C.ac2,textTransform:"uppercase",fontWeight:700}}>🏟️ Stadyum Sesi</span>
        <button onClick={()=>setOpen(false)} style={{background:"none",border:"none",color:C.dim,cursor:"pointer",fontSize:".9rem"}}>✕</button>
      </div>
      <div style={{padding:10,display:"flex",flexDirection:"column",gap:10}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
          <span style={{fontSize:".58rem",fontWeight:700,color:ambOn?C.ac2:C.dim,letterSpacing:1}}>Atmosfer</span>
          <Tog on={ambOn} onToggle={()=>{ensureCtx();setAmbOn(v=>!v);}} color={C.ac}/>
        </div>
        <div style={{display:"flex",gap:4}}>
          {ambTypes.map(a=>(
            <button key={a.id} onClick={()=>setAtype(a.id)} style={{
              flex:1,padding:"5px 2px",fontSize:".46rem",cursor:"pointer",fontFamily:"inherit",
              background:atype===a.id?"rgba(45,143,255,.3)":"transparent",
              border:`1px solid ${atype===a.id?C.ac2:C.brd2}`,borderRadius:4,
              color:atype===a.id?C.ac2:C.dim}}>{a.lbl}
            </button>
          ))}
        </div>
        <div>
          <input type="range" min="0" max="1" step="0.01" value={ambVol}
            onChange={e=>setAmbVol(parseFloat(e.target.value))}
            onTouchStart={e=>e.stopPropagation()} onTouchMove={e=>e.stopPropagation()}
            style={{width:"100%",accentColor:C.ac2,cursor:"pointer",touchAction:"none"}}/>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:".44rem",color:C.dmr,marginTop:2}}>
            <span>Ses Seviyesi</span><span>{Math.round(ambVol*100)}%</span>
          </div>
        </div>
        <div style={{fontSize:".44rem",color:C.dmr,lineHeight:1.5,borderTop:`1px solid rgba(77,166,255,0.1)`,paddingTop:6}}>
          🏟️ Maç: Ritimli tezahürat + davul + kalabalık<br/>
          👥 Sessiz: Seyrek alkış + arka plan
        </div>
      </div>
    </div>}
  </>);
}
