// ══════════════════════════════════════════════════════════════
// MİNİ OYUN BİLEŞENLERİ
// ══════════════════════════════════════════════════════════════

// ── ŞUT MİNİ OYUNU ───────────────────────────────────────────
// Güç çubuğu (tut-bırak) + isabet hedefi (hareket eden nokta)

// ══════════════════════════════════════════════════════════════
// MİNİ OYUN SİSTEMİ — NEW STAR SOCCER TARZI
// Canvas tabanlı saha içi görsel + RAF animasyonu
// ══════════════════════════════════════════════════════════════

// ── ORTAK CANVAS YARDIMCILARI ─────────────────────────────────
function drawPitchPerspective(ctx, W, H, opts={}) {
  const { showWall=false, showGoal=true, fromPenSpot=false } = opts;
  const VX=W/2, VY=H*0.08; // vanishing point — yüksekte

  // ── TRİBÜN ARKA PLAN ──────────────────────────────────────
  // Derin tribün gradyanı
  const tribGrad=ctx.createLinearGradient(0,0,0,H*.48);
  tribGrad.addColorStop(0,'#060d1a');
  tribGrad.addColorStop(.35,'#0b1a2e');
  tribGrad.addColorStop(.7,'#0e2240');
  tribGrad.addColorStop(1,'#122848');
  ctx.fillStyle=tribGrad;
  ctx.fillRect(0,0,W,H*0.35);

  // Tribün koltuk sıraları (perspektif)
  const rowCount=14;
  for(let i=0;i<rowCount;i++){
    const t=i/rowCount;
    const rowY=H*(0.04+t*0.38);
    const rowH=H*(0.022+t*0.004);
    // Koltuk renkleri (kırmızı/lacivert dalgası)
    const seated=Math.random()<0.72;
    if(seated){
      const hue=i%3===0?350:i%3===1?220:200;
      const sat=i%3===0?75:50;
      ctx.fillStyle=`hsla(${hue},${sat}%,${22+i*1.2}%,${0.55+t*0.3})`;
    } else {
      ctx.fillStyle=`rgba(15,30,55,${0.4+t*0.3})`;
    }
    ctx.fillRect(0,rowY,W,rowH);

    // Koltuk detayı (küçük bloklar)
    if(i>4){
      const blockW=Math.max(3,W/(20+i*2));
      for(let x=0;x<W;x+=blockW+1){
        const r=Math.random();
        if(r<0.55){
          ctx.fillStyle=`hsla(${340+Math.random()*40},65%,${28+i*1.5}%,.7)`;
          ctx.fillRect(x,rowY,blockW,rowH*.85);
        } else if(r<0.75){
          ctx.fillStyle=`rgba(8,20,45,.8)`;
          ctx.fillRect(x,rowY,blockW,rowH*.85);
        }
      }
    }
  }

  // Tribün ışıkları (4 projektör)
  [[0.05,0.02],[0.95,0.02],[0.12,0.18],[0.88,0.18]].forEach(([lx,ly])=>{
    const lgr=ctx.createRadialGradient(W*lx,H*ly,0,W*lx,H*ly,W*.12);
    lgr.addColorStop(0,'rgba(255,250,200,.18)');
    lgr.addColorStop(.4,'rgba(255,250,200,.05)');
    lgr.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=lgr; ctx.fillRect(0,0,W,H*.48);
    // Projektör gövdesi
    ctx.fillStyle='rgba(220,220,180,.7)';
    ctx.fillRect(W*lx-2,H*ly-1,4,4);
  });

  // Tribün/saha sınırı
  const boundGrad=ctx.createLinearGradient(0,H*.45,0,H*.52);
  boundGrad.addColorStop(0,'#0e2240');
  boundGrad.addColorStop(.4,'#1a4d24');
  boundGrad.addColorStop(1,'#1e6b30');
  ctx.fillStyle=boundGrad;
  ctx.fillRect(0,H*.45,W,H*.08);

  // ── ÇİM SAHASI ────────────────────────────────────────────
  const grassGrad=ctx.createLinearGradient(0,H*.50,0,H);
  grassGrad.addColorStop(0,'#1e6b30');
  grassGrad.addColorStop(.35,'#1a5c28');
  grassGrad.addColorStop(.7,'#175224');
  grassGrad.addColorStop(1,'#134a20');
  ctx.fillStyle=grassGrad;
  ctx.fillRect(0,H*.50,W,H*.50);

  // Çim şeritleri (perspektif trapezoid)
  const stripeCount=10;
  for(let i=0;i<stripeCount;i++){
    if(i%2===0) continue;
    const t0=i/stripeCount, t1=(i+1)/stripeCount;
    const y0=H*.50+t0*(H*.50), y1=H*.50+t1*(H*.50);
    const x0l=VX-(VX)*(1-t0*.5), x0r=VX+(W-VX)*(1-t0*.5);
    ctx.fillStyle='rgba(0,0,0,.06)';
    ctx.beginPath();
    ctx.moveTo(x0l,y0); ctx.lineTo(x0r,y0);
    ctx.lineTo(VX+(W-VX)*(1-t1*.5),y1);
    ctx.lineTo(VX-(VX)*(1-t1*.5),y1);
    ctx.closePath(); ctx.fill();
  }

  // Saha aydınlatma (merkez parlama)
  const pitchGlow=ctx.createRadialGradient(W/2,H*.55,0,W/2,H*.65,W*.55);
  pitchGlow.addColorStop(0,'rgba(255,255,220,.04)');
  pitchGlow.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=pitchGlow; ctx.fillRect(0,H*.50,W,H*.50);

  // ── SAHA ÇİZGİLERİ (PERSPEKTİF) ──────────────────────────
  ctx.save();
  ctx.strokeStyle='rgba(255,255,255,.32)';
  ctx.lineWidth=1.2;

  // Yan çizgiler (vanishing point'ten)
  const drawPerspLine=(x1,y1,x2,y2)=>{
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
  };
  drawPerspLine(VX,VY, W*.04,H);   // sol yan
  drawPerspLine(VX,VY, W*.96,H);   // sağ yan

  // Yatay çizgiler (farklı derinlikler)
  const hLines=[.54,.62,.72,.85];
  hLines.forEach(t=>{
    const y=H*t;
    const factor=(y-VY)/(H-VY);
    const xl=VX-VX*factor*0.96;
    const xr=VX+(W-VX)*factor*0.96;
    ctx.beginPath(); ctx.moveTo(xl,y); ctx.lineTo(xr,y); ctx.stroke();
  });

  // Orta çizgi
  const midY=H*.68;
  const midFact=(midY-VY)/(H-VY);
  const midL=VX-VX*midFact*.96, midR=VX+(W-VX)*midFact*.96;
  ctx.lineWidth=1.5;
  drawPerspLine(midL,midY, midR,midY);

  // Orta daire (ellipse perspektif)
  ctx.lineWidth=1;
  ctx.beginPath();
  ctx.ellipse(W/2, H*.74, W*.12, H*.05, 0, 0, Math.PI*2);
  ctx.stroke();
  ctx.fillStyle='rgba(255,255,255,.35)';
  ctx.beginPath(); ctx.arc(W/2,H*.74,2.5,0,Math.PI*2); ctx.fill();

  // Ceza sahası
  const paW=W*.34, paH=H*.22;
  const paX=(W-paW)/2, paY=H*.27;
  ctx.lineWidth=1.4;
  ctx.strokeStyle='rgba(255,255,255,.35)';
  ctx.strokeRect(paX,paY,paW,paH);

  // Küçük ceza sahası
  const saW=W*.18, saH=H*.10;
  ctx.strokeRect((W-saW)/2, paY, saW, saH);

  // Penaltı noktası
  ctx.fillStyle='rgba(255,255,255,.55)';
  ctx.beginPath();
  ctx.arc(W/2, fromPenSpot?H*.44:H*.36, 2.5, 0, Math.PI*2);
  ctx.fill();

  ctx.restore();

  // ── KALE ──────────────────────────────────────────────────
  if(showGoal){
    // Kale: opts.nearGoal=true → saha üzerinde yakın kale
    //        opts.nearGoal=false → uzakta perspektif kale (eski)
    const nearGoal=opts.nearGoal!==false;
    const gL=nearGoal?W*0.18:W*0.27;
    const gR=nearGoal?W*0.82:W*0.73;
    const gTop=nearGoal?H*0.36:H*0.06;
    const gBot=nearGoal?H*0.55:H*0.34;
    const postW=4;

    // Kale arka duvar (gölgeli)
    ctx.fillStyle='rgba(0,0,0,.22)';
    ctx.fillRect(gL+postW,gTop+postW,gR-gL-postW*2,gBot-gTop-postW);

    // Ağ dokusu
    ctx.strokeStyle='rgba(255,255,255,.12)';
    ctx.lineWidth=.6;
    for(let x=gL+postW;x<gR-postW;x+=10){
      ctx.beginPath(); ctx.moveTo(x,gTop+postW); ctx.lineTo(x,gBot); ctx.stroke();
    }
    for(let y=gTop+postW;y<gBot;y+=8){
      ctx.beginPath(); ctx.moveTo(gL+postW,y); ctx.lineTo(gR-postW,y); ctx.stroke();
    }

    // Direkler (3D beyaz boru görünümü)
    const drawPost=(x,y,w,h,horiz=false)=>{
      const grad=ctx.createLinearGradient(
        horiz?x:x, horiz?y:y,
        horiz?x:x+w, horiz?y+h:y
      );
      grad.addColorStop(0,'rgba(180,180,180,.9)');
      grad.addColorStop(.35,'rgba(255,255,255,.95)');
      grad.addColorStop(.7,'rgba(210,210,210,.9)');
      grad.addColorStop(1,'rgba(150,150,150,.8)');
      ctx.fillStyle=grad;
      ctx.fillRect(x,y,w,h);
      // Kenar gölge
      ctx.fillStyle='rgba(0,0,0,.15)';
      if(horiz){ctx.fillRect(x,y+h*.7,w,h*.3);}
      else{ctx.fillRect(x+w*.7,y,w*.3,h);}
    };

    drawPost(gL-postW/2, gTop, postW, gBot-gTop);          // sol direk
    drawPost(gR-postW/2, gTop, postW, gBot-gTop);          // sağ direk
    drawPost(gL-postW/2, gTop, gR-gL+postW, postW, true);  // üst direk

    // Kale gölgesi yerde
    ctx.fillStyle='rgba(0,0,0,.2)';
    ctx.beginPath();
    ctx.ellipse(W/2, gBot+3, (gR-gL)*.45, 5, 0, 0, Math.PI*2);
    ctx.fill();
  }

  // ── DUVAR (frikik) ────────────────────────────────────────
  if(showWall){
    const wallY=(opts&&opts.nearGoal)?H*0.58:H*0.48; const wallH=H*0.13;
    const wallL=W*.28, wallR=W*.60;
    const playerW=(wallR-wallL)/5;

    // Oyuncu siluetleri (5 kişi)
    const teamColors=['#1a3a7a','#c41a1a','#1a5c2a','#7a1a7a','#5c3a1a'];
    for(let i=0;i<5;i++){
      const wx=wallL+i*playerW;
      const pW=playerW*.72;
      const pH=wallH;

      // Gölge
      ctx.fillStyle='rgba(0,0,0,.25)';
      ctx.beginPath();
      ctx.ellipse(wx+pW/2,wallY+pH+2,pW*.4,3,0,0,Math.PI*2);
      ctx.fill();

      // Bacaklar
      ctx.fillStyle=`hsl(${200+i*25},30%,22%)`;
      ctx.fillRect(wx+pW*.1,wallY+pH*.6,pW*.35,pH*.4);
      ctx.fillRect(wx+pW*.52,wallY+pH*.6,pW*.35,pH*.4);

      // Gövde (forma)
      const bodyGrad=ctx.createLinearGradient(wx,wallY,wx+pW,wallY);
      bodyGrad.addColorStop(0,teamColors[i]);
      bodyGrad.addColorStop(1,shadeColor(teamColors[i],-30));
      ctx.fillStyle=bodyGrad;
      ctx.fillRect(wx+pW*.08,wallY+pH*.28,pW*.84,pH*.45);

      // Kollar
      ctx.fillStyle=teamColors[i];
      ctx.fillRect(wx,wallY+pH*.30,pW*.12,pH*.30);
      ctx.fillRect(wx+pW*.88,wallY+pH*.30,pW*.12,pH*.30);

      // Kafa
      const skinTones=['#c68642','#f1c27d','#e0ac69','#8d5524','#ffdbac'];
      ctx.fillStyle=skinTones[i%skinTones.length];
      ctx.beginPath();
      ctx.arc(wx+pW/2, wallY+pH*.18, pW*.22, 0, Math.PI*2);
      ctx.fill();

      // Saç
      ctx.fillStyle='rgba(40,20,10,.7)';
      ctx.beginPath();
      ctx.arc(wx+pW/2, wallY+pH*.12, pW*.22, Math.PI, 0);
      ctx.fill();
    }
  }
}

function shadeColor(col, amt) {
  // Basit renk koyulaştırma/açma
  const n=parseInt(col.slice(1),16);
  const r=Math.max(0,Math.min(255,((n>>16)&255)+amt));
  const g=Math.max(0,Math.min(255,((n>>8)&255)+amt));
  const b=Math.max(0,Math.min(255,(n&255)+amt));
  return `rgb(${r},${g},${b})`;
}


// Top çiz — gerçekçi 3D top
function drawBall(ctx, x, y, r, spin=0) {
  // Zemin gölgesi
  ctx.fillStyle='rgba(0,0,0,.3)';
  ctx.beginPath();
  ctx.ellipse(x+r*.15, y+r*.75, r*.75, r*.22, 0, 0, Math.PI*2);
  ctx.fill();

  // Ana top (beyaz baz)
  ctx.fillStyle='#fff';
  ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();

  // Derin radial gradient (3D küre)
  const sph=ctx.createRadialGradient(x-r*.28,y-r*.28,r*.05,x,y,r);
  sph.addColorStop(0,'rgba(255,255,255,0)');
  sph.addColorStop(.55,'rgba(200,200,200,.15)');
  sph.addColorStop(.82,'rgba(130,130,130,.35)');
  sph.addColorStop(1,'rgba(60,60,60,.55)');
  ctx.fillStyle=sph;
  ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();

  // Beşgen desenler (top dönüyor)
  ctx.save();
  ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.clip();

  const drawPentagon=(cx,cy,size,rotation)=>{
    ctx.beginPath();
    for(let i=0;i<5;i++){
      const a=rotation+i*Math.PI*2/5-Math.PI/2;
      const px=cx+Math.cos(a)*size, py=cy+Math.sin(a)*size;
      i===0?ctx.moveTo(px,py):ctx.lineTo(px,py);
    }
    ctx.closePath();
    ctx.fillStyle='rgba(20,20,20,.72)';
    ctx.fill();
    ctx.strokeStyle='rgba(0,0,0,.4)';
    ctx.lineWidth=r*.05;
    ctx.stroke();
  };

  // Merkez beşgen
  drawPentagon(x, y, r*.38, spin);
  // Çevre beşgenler (5 adet)
  for(let i=0;i<5;i++){
    const a=spin+i*Math.PI*2/5-Math.PI/2;
    const ox=x+Math.cos(a)*r*.72;
    const oy=y+Math.sin(a)*r*.72;
    drawPentagon(ox,oy,r*.32,spin+Math.PI/5);
  }
  ctx.restore();

  // Parlama (sol üst)
  const shine=ctx.createRadialGradient(x-r*.3,y-r*.3,0,x-r*.1,y-r*.1,r*.45);
  shine.addColorStop(0,'rgba(255,255,255,.55)');
  shine.addColorStop(.5,'rgba(255,255,255,.18)');
  shine.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle=shine;
  ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
}


// ── 1. ŞUT MİNİ OYUNU ──────────────────────────────────────
// Aşama 1: Güç çubuğu (tut-bırak)
// Aşama 2: Nişan — yatay + dikey sürgü
// Aşama 3: Top animasyonu (saha canvas'ında uçar)
function ShotMinigame({playerName, pos, skills, onResult}){
  const canvasRef = useRef(null);
  const rafRef    = useRef(null);
  const [phase, setPhase]   = useState('power');
  const [power, setPower]   = useState(0);
  const powerRef  = useRef(0);
  const pdirRef   = useRef(1);
  const [aimX, setAimX] = useState(50); // 0-100
  const [aimY, setAimY] = useState(45); // 0-100
  const aimRef    = useRef({x:50,y:45});
  const lockedRef = useRef({power:0,x:50,y:45});
  const [result, setResult] = useState(null);
  const ballAnimRef = useRef(null); // {x,y,tx,ty,t,spin}
  const phaseRef  = useRef('power');

  const finishSkill = (skills?.finishing||skills?.shooting||0);

  // Güç animasyonu
  useEffect(()=>{
    if(phaseRef.current!=='power') return;
    const id=setInterval(()=>{
      powerRef.current += pdirRef.current*2.8;
      if(powerRef.current>=100){powerRef.current=100;pdirRef.current=-1;}
      if(powerRef.current<=0){powerRef.current=0;pdirRef.current=1;}
      setPower(Math.round(powerRef.current));
    },28);
    return ()=>clearInterval(id);
  },[]);

  // Nişan animasyonu
  useEffect(()=>{
    if(phaseRef.current!=='aim') return;
    const speed=Math.max(0.4, 1.2-finishSkill*.07);
    let dx=(Math.random()-.5)*speed, dy=(Math.random()-.5)*speed*.7;
    const id=setInterval(()=>{
      aimRef.current.x = Math.max(4,Math.min(96, aimRef.current.x+dx));
      aimRef.current.y = Math.max(4,Math.min(90, aimRef.current.y+dy));
      if(aimRef.current.x<=4||aimRef.current.x>=96) dx*=-1;
      if(aimRef.current.y<=4||aimRef.current.y>=90) dy*=-1;
      // Biraz rasgeleleştir
      if(Math.random()<.04){ dx+=(Math.random()-.5)*.3; dy+=(Math.random()-.5)*.2; }
      setAimX(Math.round(aimRef.current.x));
      setAimY(Math.round(aimRef.current.y));
    },22);
    return ()=>clearInterval(id);
  },[phase]);

  // Canvas çizimi
  useEffect(()=>{
    const canvas=canvasRef.current; if(!canvas) return;
    canvas.width=canvas.offsetWidth||320;
    canvas.height=canvas.offsetHeight||200;
    const W=canvas.width, H=canvas.height;

    let spin=0, t=0;
    const loop=()=>{
      rafRef.current=requestAnimationFrame(loop);
      const ctx=canvas.getContext('2d');
      ctx.clearRect(0,0,W,H);
      drawPitchPerspective(ctx,W,H,{showGoal:true,nearGoal:true});
      spin+=.06;

      if(phaseRef.current==='power'||phaseRef.current==='aim'){
        // Sahadaki oyuncu (alt merkez)
        const px=W/2, py=H*.90;
        ctx.fillStyle='#10b981';
        ctx.beginPath(); ctx.arc(px,py,7,0,Math.PI*2); ctx.fill();
        ctx.strokeStyle='#fff'; ctx.lineWidth=2;
        ctx.beginPath(); ctx.arc(px,py,7,0,Math.PI*2); ctx.stroke();
        ctx.fillStyle='#fff'; ctx.font='bold 6px system-ui';
        ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(skills?.formNumber||9,px,py);
        // Top oyuncunun önünde
        drawBall(ctx,px,py-14,6,spin);

        if(phaseRef.current==='aim'){
          // Nişan halkası kale üzerinde
          const tx=W*(aimRef.current.x/100);
          const ty=H*(0.37+(aimRef.current.y/100)*0.16);
          ctx.strokeStyle='rgba(255,60,60,.9)';
          ctx.lineWidth=2;
          ctx.beginPath(); ctx.arc(tx,ty,10,0,Math.PI*2); ctx.stroke();
          ctx.strokeStyle='rgba(255,60,60,.4)';
          ctx.lineWidth=1; ctx.setLineDash([4,3]);
          ctx.beginPath(); ctx.moveTo(px,py-14); ctx.lineTo(tx,ty); ctx.stroke();
          ctx.setLineDash([]);
          // Küçük merkez nokta
          ctx.fillStyle='#ff3c3c';
          ctx.beginPath(); ctx.arc(tx,ty,3,0,Math.PI*2); ctx.fill();
        }
      }

      if(phaseRef.current==='fly'&&ballAnimRef.current){
        const b=ballAnimRef.current;
        b.t=Math.min(1,b.t+.035);
        const ease=1-Math.pow(1-b.t,2); // ease-out
        const cx=b.sx+(b.tx-b.sx)*ease;
        const cy=b.sy+(b.ty-b.sy)*ease - Math.sin(b.t*Math.PI)*H*.12;
        const r=6+4*(1-b.t); // uzaklaştıkça küçülür
        drawBall(ctx,cx,cy,r,spin);
        ballAnimRef.current.cx=cx; ballAnimRef.current.cy=cy;
        if(b.t>=1){
          phaseRef.current='result';
          setPhase('result');
          cancelAnimationFrame(rafRef.current);
          setTimeout(()=>onResult(b.result),1400);
        }
      }

      if(phaseRef.current==='result'&&ballAnimRef.current){
        const b=ballAnimRef.current;
        if(b.result.isGoal){
          // Kale içinde top
          drawBall(ctx,b.tx,b.ty,5,spin);
          ctx.fillStyle='rgba(16,185,129,.3)';
          ctx.fillRect(W*.34,H*.08,W*.32,H*.14);
        } else {
          // Kalecinin önünde
          drawBall(ctx,b.cx||b.tx,b.cy||b.ty,5,spin);
        }
      }
    };
    rafRef.current=requestAnimationFrame(loop);
    return ()=>{ if(rafRef.current) cancelAnimationFrame(rafRef.current); };
  },[]);

  const lockPower=()=>{
    if(phaseRef.current!=='power') return;
    lockedRef.current.power=powerRef.current;
    phaseRef.current='aim'; setPhase('aim');
  };

  const lockAim=()=>{
    if(phaseRef.current!=='aim') return;
    const pw=lockedRef.current.power;
    const ax=aimRef.current.x, ay=aimRef.current.y;
    const centerDist=Math.hypot(ax-50,ay-45)/60;
    const powerScore=pw/100;
    const accuracy=Math.min(.94,.50+finishSkill*.04+(1-centerDist)*.25+powerScore*.1);
    const isGoal=Math.random()<accuracy;
    const W=canvasRef.current?.offsetWidth||320;
    const H=canvasRef.current?.offsetHeight||200;
    const res={isGoal,power:pw,accuracy:Math.round((1-centerDist)*100),
      msg:isGoal
        ?(pw>80?'💥 GÜÇLÜ VURUŞ! GOL!':centerDist<.25?'🎯 PERFECT! GOL!':'⚽ İSABETLİ! GOL!')
        :(centerDist>.7?'😬 Direkten döndü!':pw<30?'🧤 Çok yumuşak!':'🧤 Kaleci kurtardı!')};
    ballAnimRef.current={
      sx:W/2, sy:H*.895,
      tx:W*(0.18+(ax/100)*0.64), ty:H*(0.37+(ay/100)*0.16),
      t:0, spin:0, result:res,
    };
    phaseRef.current='fly'; setPhase('fly');
    setResult(res);
  };

  const pw=power;
  const pwCol=pw>80?'#ef4444':pw>55?'#f59e0b':'#10b981';

  return(
    <div style={{position:'fixed',inset:0,background:'#010810',zIndex:1000,display:'flex',flexDirection:'column',fontFamily:'system-ui,sans-serif'}}>
      <div style={{padding:'10px 16px',flexShrink:0,textAlign:'center'}}>
        <div style={{fontSize:'.48rem',color:'#4da6ff',fontWeight:700,letterSpacing:2,textTransform:'uppercase'}}>⚽ ŞUT FIRSATI</div>
        <div style={{fontSize:'.68rem',fontWeight:900,color:'#fff',marginTop:2}}>{playerName}</div>
      </div>

      {/* Saha canvas */}
      <div style={{flex:1,margin:'0 12px',borderRadius:10,overflow:'hidden',position:'relative',minHeight:0}}>
        <canvas ref={canvasRef} style={{width:'100%',height:'100%',display:'block'}}/>
      </div>

      {/* Kontroller */}
      <div style={{padding:'10px 16px 20px',flexShrink:0}}>
        {phase==='power'&&(
          <>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:'.5rem',color:'#7898c0',marginBottom:5}}>
              <span>GÜÇ</span>
              <span style={{color:pwCol,fontWeight:700}}>{pw}%</span>
            </div>
            <div style={{height:14,background:'rgba(255,255,255,.07)',borderRadius:7,overflow:'hidden',position:'relative',marginBottom:10}}>
              <div style={{height:'100%',width:`${pw}%`,background:`linear-gradient(90deg,#10b981,${pwCol})`,borderRadius:7,transition:'width .02s'}}/>
              <div style={{position:'absolute',top:0,left:'55%',width:2,height:'100%',background:'rgba(255,255,255,.3)'}}/>
              <div style={{position:'absolute',top:0,left:'80%',width:2,height:'100%',background:'rgba(239,68,68,.5)'}}/>
            </div>
            <div style={{fontSize:'.42rem',color:'#555',textAlign:'center',marginBottom:8}}>55-80% optimal güç</div>
            <button onClick={lockPower} style={{width:'100%',padding:'13px',background:'linear-gradient(135deg,#065f46,#059669)',border:'none',borderRadius:10,color:'#fff',fontWeight:900,cursor:'pointer',fontFamily:'inherit',fontSize:'.76rem'}}>
              ✊ GÜÇ KİLİTLE
            </button>
          </>
        )}
        {phase==='aim'&&(
          <>
            <div style={{fontSize:'.54rem',color:'#f59e0b',fontWeight:700,textAlign:'center',marginBottom:8}}>
              🎯 Kırmızı halkayı kaleyle hizala!
            </div>
            <div style={{display:'flex',justifyContent:'center',gap:16,marginBottom:10,fontSize:'.46rem',color:'#7898c0'}}>
              <span>Sol üst</span><span>Merkez</span><span>Sağ üst</span>
            </div>
            <button onClick={lockAim} style={{width:'100%',padding:'13px',background:'linear-gradient(135deg,#1a6ed8,#2485ff)',border:'none',borderRadius:10,color:'#fff',fontWeight:900,cursor:'pointer',fontFamily:'inherit',fontSize:'.76rem'}}>
              ⚽ VUR!
            </button>
          </>
        )}
        {phase==='fly'&&(
          <div style={{textAlign:'center',padding:'10px 0'}}>
            <div style={{fontSize:'.68rem',color:'#ffd060',fontWeight:700}}>⚡ Top havada...</div>
          </div>
        )}
        {phase==='result'&&result&&(
          <div style={{textAlign:'center',padding:'10px 0'}}>
            <div style={{fontSize:'1.8rem',marginBottom:5}}>{result.isGoal?'🎉':'😬'}</div>
            <div style={{fontSize:'.76rem',fontWeight:900,color:result.isGoal?'#10b981':'#ef4444'}}>{result.msg}</div>
            <div style={{fontSize:'.5rem',color:'#7898c0',marginTop:5}}>Güç: {result.power}% · İsabet: {result.accuracy}%</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── 2. PENALTI MİNİ OYUNU ─────────────────────────────────
// Aşama 1: Köşe seç (kale görünümü)
// Aşama 2: Kaleci hareketi — doğru zamanda vur!
// Aşama 3: Top animasyonu
function PenaltyMinigame({playerName, skills, onResult}){
  const canvasRef = useRef(null);
  const rafRef    = useRef(null);
  const [phase, setPhase]   = useState('choose');
  const [chosen, setChosen] = useState(null); // 0-5 kale bölgesi
  const [timer, setTimer]   = useState(100);
  const [result, setResult] = useState(null);
  const phaseRef   = useRef('choose');
  const chosenRef  = useRef(null);
  const timerRef   = useRef(100);
  const gkXRef     = useRef(.5); // kaleci x (0-1 arası)
  const gkDirRef   = useRef(1);
  const ballAnimRef= useRef(null);
  const spinRef    = useRef(0);

  const finishSkill = skills?.finishing||skills?.composure||0;
  const saveChance  = Math.max(.12,.40-finishSkill*.025);

  // Kale bölgeleri (6 alan: 3 sütun × 2 satır)
  // index: 0=sol üst, 1=orta üst, 2=sağ üst, 3=sol alt, 4=orta alt, 5=sağ alt
    const zones=[
    {label:'Sol Üst', gx:0.23, gy:0.39},
    {label:'Orta Üst',gx:0.50, gy:0.38},
    {label:'Sağ Üst', gx:0.77, gy:0.39},
    {label:'Sol Alt',  gx:0.23, gy:0.51},
    {label:'Orta Alt', gx:0.50, gy:0.51},
    {label:'Sağ Alt',  gx:0.77, gy:0.51},
  ];

  // Canvas RAF döngüsü
  useEffect(()=>{
    const canvas=canvasRef.current; if(!canvas) return;
    canvas.width=canvas.offsetWidth||320;
    canvas.height=canvas.offsetHeight||220;
    const W=canvas.width, H=canvas.height;

    const loop=()=>{
      rafRef.current=requestAnimationFrame(loop);
      const ctx=canvas.getContext('2d');
      ctx.clearRect(0,0,W,H);
      drawPitchPerspective(ctx,W,H,{showGoal:true,fromPenSpot:true,nearGoal:true});
      spinRef.current+=.07;

      const gkX=gkXRef.current;

      // Kaleci (kale önünde)
      if(phaseRef.current==='choose'||phaseRef.current==='timing'){
        const gkPx=W*0.18+gkX*(W*0.64);
        const gkPy=H*0.49;
        // Kaleci gövdesi
        ctx.fillStyle='#f59e0b';
        ctx.fillRect(gkPx-8,gkPy-16,16,20);
        ctx.fillStyle='#fbbf24';
        ctx.beginPath(); ctx.arc(gkPx,gkPy-19,8,0,Math.PI*2); ctx.fill();
        // Kaleci gölgesi
        ctx.fillStyle='rgba(0,0,0,.25)';
        ctx.beginPath(); ctx.ellipse(gkPx,gkPy+4,8,2.5,0,0,Math.PI*2); ctx.fill();
        // Kaleci eldiveni (kollar)
        ctx.fillStyle='#f59e0b';
        ctx.fillRect(gkPx-16,gkPy-9,8,5);
        ctx.fillRect(gkPx+8,gkPy-9,8,5);
      }

      // Oyuncu (penaltı noktasında)
      if(phaseRef.current!=='fly'&&phaseRef.current!=='result'){
        const px=W/2, py=H*.85;
        ctx.fillStyle='#10b981';
        ctx.beginPath(); ctx.arc(px,py,7,0,Math.PI*2); ctx.fill();
        ctx.strokeStyle='#fff'; ctx.lineWidth=2;
        ctx.beginPath(); ctx.arc(px,py,7,0,Math.PI*2); ctx.stroke();
        // Top önünde
        drawBall(ctx,px,py-13,6.5,spinRef.current);
      }

      // Seçilen bölge işareti
      if(phaseRef.current==='timing'&&chosenRef.current!==null){
        const z=zones[chosenRef.current];
        const tx=W*z.gx, ty=H*z.gy;
        ctx.strokeStyle='rgba(255,60,60,.9)'; ctx.lineWidth=2;
        ctx.beginPath(); ctx.arc(tx,ty,12,0,Math.PI*2); ctx.stroke();
        ctx.strokeStyle='rgba(255,60,60,.3)'; ctx.lineWidth=1;
        ctx.setLineDash([3,3]);
        ctx.beginPath(); ctx.moveTo(W/2,H*.84); ctx.lineTo(tx,ty); ctx.stroke();
        ctx.setLineDash([]);
      }

      // Kale bölgeleri (choose aşamasında)
      if(phaseRef.current==='choose'){
        zones.forEach((z,i)=>{
          const tx=W*z.gx, ty=H*z.gy;
          const isChosen=chosen===i;
          ctx.fillStyle=isChosen?'rgba(255,60,60,.35)':'rgba(255,255,255,.06)';
          ctx.strokeStyle=isChosen?'rgba(255,60,60,.9)':'rgba(255,255,255,.25)';
          ctx.lineWidth=isChosen?2:1;
          ctx.beginPath();
          ctx.roundRect(tx-22,ty-10,44,22,4);
          ctx.fill(); ctx.stroke();
          ctx.fillStyle=isChosen?'#fff':'rgba(255,255,255,.6)';
          ctx.font=`${isChosen?'bold ':''}.5rem system-ui`;
          ctx.textAlign='center'; ctx.textBaseline='middle';
          ctx.fillText(z.label,tx,ty);
        });
      }

      // Top animasyonu (fly)
      if(phaseRef.current==='fly'&&ballAnimRef.current){
        const b=ballAnimRef.current;
        b.t=Math.min(1,b.t+.04);
        const ease=1-Math.pow(1-b.t,2.5);
        const cx=b.sx+(b.tx-b.sx)*ease;
        const cy=b.sy+(b.ty-b.sy)*ease - Math.sin(b.t*Math.PI)*H*.08;
        const r=6.5*(1-b.t*.4);
        drawBall(ctx,cx,cy,r,spinRef.current);

        // Kaleci atlayışı
        const gkPx=(W*.34)+b.gkTarget*(W*.32);
        const gkFly=Math.min(1,b.t*2);
        const gkPy=H*.205-gkFly*H*.06;
        ctx.fillStyle='#f59e0b';
        ctx.fillRect(gkPx-9,gkPy-18,18,22);
        ctx.fillStyle='#fbbf24';
        ctx.beginPath(); ctx.arc(gkPx,gkPy-22,9,0,Math.PI*2); ctx.fill();

        if(b.t>=1){
          phaseRef.current='result'; setPhase('result');
          cancelAnimationFrame(rafRef.current);
          setTimeout(()=>onResult(b.res),1500);
        }
        ballAnimRef.current={...b,t:b.t,cx,cy};
      }

      if(phaseRef.current==='result'&&ballAnimRef.current){
        const b=ballAnimRef.current;
        if(b.res?.isGoal){
          ctx.fillStyle='rgba(16,185,129,.25)';
          ctx.fillRect(W*.34,H*.08,W*.32,H*.14);
        }
        drawBall(ctx,b.cx||b.tx,b.cy||b.ty,5,spinRef.current);
      }
    };
    rafRef.current=requestAnimationFrame(loop);
    return ()=>{ if(rafRef.current) cancelAnimationFrame(rafRef.current); };
  },[chosen]);

  // Kaleci sallanma (timing aşamasında)
  useEffect(()=>{
    if(phase!=='timing') return;
    const id=setInterval(()=>{
      gkXRef.current+=gkDirRef.current*.018;
      if(gkXRef.current>=.85){gkXRef.current=.85;gkDirRef.current=-1;}
      if(gkXRef.current<=.15){gkXRef.current=.15;gkDirRef.current=1;}
      timerRef.current=Math.max(0,timerRef.current-1.8);
      setTimer(Math.round(timerRef.current));
    },30);
    return ()=>clearInterval(id);
  },[phase]);

  const selectZone=(i)=>{ setChosen(i); chosenRef.current=i; };

  const shoot=()=>{
    if(phaseRef.current!=='timing'||chosenRef.current===null) return;
    const z=zones[chosenRef.current];
    // Kaleci hangi tarafı tuttu?
    const gkSide=gkXRef.current; // 0-1
    const shotSide=z.gx; // 0-1
    const diff=Math.abs(gkSide-shotSide);
    const gkSaved=diff<.28&&Math.random()<saveChance;
    const isGoal=!gkSaved;
    const timerBonus=timerRef.current>60?.15:timerRef.current>30?.05:0;

    // Kaleci atlayış hedefi
    const gkTarget=gkSaved?z.gx:gkXRef.current;

    const W=canvasRef.current?.offsetWidth||320;
    const H=canvasRef.current?.offsetHeight||220;
    const res={isGoal,
      msg:isGoal
        ?(timerBonus>.1?'🎯 SOĞUKKANLILLIK! GOL!':'⚽ KÖŞEYE! GOL!')
        :(gkSaved?'🧤 KALECİ TAHMİN ETTİ!':'😱 DİREK!')};

    ballAnimRef.current={
      sx:W/2, sy:H*0.87,
      tx:W*z.gx, ty:H*(z.gy+0.01),
      t:0, gkTarget, res,
    };
    phaseRef.current='fly'; setPhase('fly');
  };

  const goTiming=()=>{
    if(chosen===null) return;
    phaseRef.current='timing'; setPhase('timing');
  };

  return(
    <div style={{position:'fixed',inset:0,background:'#010810',zIndex:1000,display:'flex',flexDirection:'column',fontFamily:'system-ui,sans-serif'}}>
      <div style={{padding:'10px 16px',flexShrink:0,textAlign:'center'}}>
        <div style={{fontSize:'.48rem',color:'#f59e0b',fontWeight:700,letterSpacing:2,textTransform:'uppercase'}}>🎯 PENALTI!</div>
        <div style={{fontSize:'.68rem',fontWeight:900,color:'#fff',marginTop:2}}>{playerName} penaltı noktasında</div>
      </div>

      <div style={{flex:1,margin:'0 12px',borderRadius:10,overflow:'hidden',position:'relative',minHeight:0}}>
        <canvas ref={canvasRef} style={{width:'100%',height:'100%',display:'block'}}/>
      </div>

      <div style={{padding:'10px 16px 20px',flexShrink:0}}>
        {phase==='choose'&&(
          <>
            <div style={{fontSize:'.54rem',color:'#f59e0b',textAlign:'center',marginBottom:8}}>
              Köşeyi seç — kaleci hareket edecek!
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:6,marginBottom:10}}>
              {zones.map((z,i)=>(
                <button key={i} onClick={()=>selectZone(i)}
                  style={{padding:'9px 4px',borderRadius:8,cursor:'pointer',fontFamily:'inherit',fontSize:'.52rem',fontWeight:chosen===i?700:400,background:chosen===i?'rgba(255,60,60,.25)':'rgba(255,255,255,.05)',border:`1.5px solid ${chosen===i?'rgba(255,60,60,.8)':'rgba(255,255,255,.15)'}`,color:chosen===i?'#ff6060':'#888'}}>
                  {z.label}
                </button>
              ))}
            </div>
            <button onClick={goTiming} disabled={chosen===null}
              style={{width:'100%',padding:'13px',background:chosen!==null?'linear-gradient(135deg,#7c3aed,#8b5cf6)':'rgba(255,255,255,.08)',border:'none',borderRadius:10,color:'#fff',fontWeight:900,cursor:chosen!==null?'pointer':'default',fontFamily:'inherit',fontSize:'.76rem'}}>
              {chosen!==null?'▶ KALECİ HAREKET EDİYOR!':'← Önce köşe seç'}
            </button>
          </>
        )}
        {phase==='timing'&&(
          <>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:'.5rem',color:'#7898c0',marginBottom:5}}>
              <span>⏱️ Kaleci harekette...</span>
              <span style={{color:timer>60?'#10b981':timer>30?'#f59e0b':'#ef4444',fontWeight:700}}>{Math.round(timer)}%</span>
            </div>
            <div style={{height:12,background:'rgba(255,255,255,.07)',borderRadius:6,overflow:'hidden',marginBottom:10}}>
              <div style={{height:'100%',width:`${timer}%`,background:`linear-gradient(90deg,${timer>60?'#10b981':'#f59e0b'},${timer>30?'#ffd060':'#ef4444'})`,borderRadius:6,transition:'width .03s'}}/>
            </div>
            <button onClick={shoot}
              style={{width:'100%',padding:'13px',background:'linear-gradient(135deg,#7c3aed,#8b5cf6)',border:'none',borderRadius:10,color:'#fff',fontWeight:900,cursor:'pointer',fontFamily:'inherit',fontSize:'.76rem'}}>
              ⚽ VUR!
            </button>
          </>
        )}
        {phase==='fly'&&(
          <div style={{textAlign:'center',padding:'10px 0'}}>
            <div style={{fontSize:'.68rem',color:'#ffd060',fontWeight:700}}>💨 Top havada...</div>
          </div>
        )}
        {phase==='result'&&(
          <div style={{textAlign:'center',padding:'10px 0'}}>
            <div style={{fontSize:'1.8rem',marginBottom:5}}>{result?.isGoal?'🎉':'😬'}</div>
            <div style={{fontSize:'.76rem',fontWeight:900,color:result?.isGoal?'#10b981':'#ef4444'}}>{result?.msg}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── 3. SERBEST VURUŞ MİNİ OYUNU ───────────────────────────
// Aşama 1: Duvar görseli + açı çubuğu + efekt seç
// Aşama 2: Güç timing (kısa vuruş penceresi)
// Aşama 3: Top animasyonu (duvarın üstünden veya yanından)
function FreekickMinigame({playerName, skills, onResult}){
  const canvasRef  = useRef(null);
  const rafRef     = useRef(null);
  const [phase, setPhase]   = useState('setup');
  const [angle, setAngle]   = useState(50);
  const [effect, setEffect] = useState(null);
  const [timing, setTiming] = useState(100);
  const [result, setResult] = useState(null);
  const phaseRef   = useRef('setup');
  const angleRef   = useRef(50);
  const effectRef  = useRef(null);
  const timingRef  = useRef(100);
  const ballAnimRef= useRef(null);
  const spinRef    = useRef(0);
  const timingDirRef = useRef(-1);

  const fkSkill = skills?.freekick||skills?.shooting||0;
  const baseAcc = .38+fkSkill*.055;

  // Canvas RAF
  useEffect(()=>{
    const canvas=canvasRef.current; if(!canvas) return;
    canvas.width=canvas.offsetWidth||320;
    canvas.height=canvas.offsetHeight||220;
    const W=canvas.width, H=canvas.height;

    const loop=()=>{
      rafRef.current=requestAnimationFrame(loop);
      const ctx=canvas.getContext('2d');
      ctx.clearRect(0,0,W,H);
      drawPitchPerspective(ctx,W,H,{showGoal:true,showWall:true,nearGoal:true});
      spinRef.current+=.05;

      // Oyuncu (sol alt)
      const px=W*.38, py=H*.90;
      ctx.fillStyle='#10b981';
      ctx.beginPath(); ctx.arc(px,py,7,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle='#fff'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.arc(px,py,7,0,Math.PI*2); ctx.stroke();

      if(phaseRef.current==='setup'||phaseRef.current==='timing'){
        drawBall(ctx,px,py-13,6,spinRef.current);

        // Yörünge önizlemesi
        if(effectRef.current){
          const ax=angleRef.current/100;
          const tx=W*(.34+ax*.32);
          const ef=effectRef.current;
          ctx.strokeStyle='rgba(255,215,0,.45)'; ctx.lineWidth=1.5; ctx.setLineDash([5,4]);
          ctx.beginPath(); ctx.moveTo(px,py-13);
          if(ef==='curl_left'){
            ctx.bezierCurveTo(px-W*.08,H*.55, tx-W*.05,H*.35, tx,H*.15);
          } else if(ef==='curl_right'){
            ctx.bezierCurveTo(px+W*.04,H*.55, tx+W*.05,H*.35, tx,H*.15);
          } else {
            ctx.quadraticCurveTo(W/2,H*.30, tx,H*.15);
          }
          ctx.stroke(); ctx.setLineDash([]);

          // Hedef nokta
          ctx.strokeStyle='rgba(255,215,0,.9)'; ctx.lineWidth=1.5;
          ctx.beginPath(); ctx.arc(tx,H*.15,8,0,Math.PI*2); ctx.stroke();
        }
      }

      // Top fly animasyonu
      if(phaseRef.current==='fly'&&ballAnimRef.current){
        const b=ballAnimRef.current;
        b.t=Math.min(1,b.t+.032);
        const ease=b.t<.5?2*b.t*b.t:1-Math.pow(-2*b.t+2,2)/2;

        let cx,cy;
        if(b.effect==='curl_left'){
          cx=b.sx+(b.tx-b.sx)*ease-Math.sin(b.t*Math.PI)*W*.09;
          cy=b.sy+(b.ty-b.sy)*ease-Math.sin(b.t*Math.PI)*H*.18;
        } else if(b.effect==='curl_right'){
          cx=b.sx+(b.tx-b.sx)*ease+Math.sin(b.t*Math.PI)*W*.07;
          cy=b.sy+(b.ty-b.sy)*ease-Math.sin(b.t*Math.PI)*H*.18;
        } else {
          cx=b.sx+(b.tx-b.sx)*ease;
          cy=b.sy+(b.ty-b.sy)*ease-Math.sin(b.t*Math.PI)*H*.22;
        }
        const r=6.5*(1-b.t*.45);
        drawBall(ctx,cx,cy,r,spinRef.current*2);
        ballAnimRef.current={...b,cx,cy};

        if(b.t>=1){
          phaseRef.current='result'; setPhase('result');
          cancelAnimationFrame(rafRef.current);
          setTimeout(()=>onResult(b.res),1500);
        }
      }

      if(phaseRef.current==='result'&&ballAnimRef.current){
        const b=ballAnimRef.current;
        if(b.res?.isGoal){
          ctx.fillStyle='rgba(16,185,129,.22)';
          ctx.fillRect(W*.34,H*.08,W*.32,H*.14);
        }
        drawBall(ctx,b.cx||b.tx,b.cy||b.ty,5,spinRef.current);
      }
    };
    rafRef.current=requestAnimationFrame(loop);
    return ()=>{ if(rafRef.current) cancelAnimationFrame(rafRef.current); };
  },[]);

  // Timing sayacı
  useEffect(()=>{
    if(phase!=='timing') return;
    const id=setInterval(()=>{
      timingRef.current+=timingDirRef.current*3;
      if(timingRef.current>=100){timingRef.current=100;timingDirRef.current=-1;}
      if(timingRef.current<=0){timingRef.current=0;timingDirRef.current=1;}
      setTiming(Math.round(timingRef.current));
    },30);
    return ()=>clearInterval(id);
  },[phase]);

  const shoot=()=>{
    if(phaseRef.current!=='timing') return;
    const ax=angleRef.current, ef=effectRef.current;
    const centerDist=Math.abs(ax-50)/50;
    const timingScore=1-Math.abs(timingRef.current-65)/65;
    const curlBonus=ef!=='straight'?fkSkill*.02:0;
    const chance=Math.min(.88,baseAcc+(1-centerDist)*.20+timingScore*.18+curlBonus);
    const isGoal=Math.random()<chance;

    const W=canvasRef.current?.offsetWidth||320;
    const H=canvasRef.current?.offsetHeight||220;
    const res={isGoal,
      msg:isGoal
        ?(ef!=='straight'&&fkSkill>=6?'🌀 MUHTEŞEM VİRAJ! GOL!':ax<25||ax>75?'🎯 KÖŞE! GOL!':'⚽ MÜKEMMEl FRİKİK! GOL!')
        :(centerDist>.6?'😬 Direkten döndü!':'😔 Duvar engeli!')};

    ballAnimRef.current={
      sx:W*0.38, sy:H*0.88,
      tx:W*(0.18+(ax/100)*0.64), ty:H*0.38,
      t:0, effect:ef, res,
    };
    phaseRef.current='fly'; setPhase('fly');
    setResult(res);
  };

  const goTiming=()=>{
    if(!effect) return;
    phaseRef.current='timing'; setPhase('timing');
  };

  return(
    <div style={{position:'fixed',inset:0,background:'#010810',zIndex:1000,display:'flex',flexDirection:'column',fontFamily:'system-ui,sans-serif'}}>
      <div style={{padding:'10px 16px',flexShrink:0,textAlign:'center'}}>
        <div style={{fontSize:'.48rem',color:'#8b5cf6',fontWeight:700,letterSpacing:2,textTransform:'uppercase'}}>🌀 SERBEST VURUŞ</div>
        <div style={{fontSize:'.68rem',fontWeight:900,color:'#fff',marginTop:2}}>{playerName}</div>
      </div>

      <div style={{flex:1,margin:'0 12px',borderRadius:10,overflow:'hidden',position:'relative',minHeight:0}}>
        <canvas ref={canvasRef} style={{width:'100%',height:'100%',display:'block'}}/>
      </div>

      <div style={{padding:'8px 16px 18px',flexShrink:0}}>
        {phase==='setup'&&(
          <>
            <div style={{marginBottom:8}}>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:'.48rem',color:'#7898c0',marginBottom:4}}>
                <span>← Sol</span>
                <span style={{color:'#ffd060',fontWeight:700}}>AÇI: {angle<35?'Sol Köşe':angle>65?'Sağ Köşe':'Merkez'}</span>
                <span>Sağ →</span>
              </div>
              <input type="range" min="5" max="95" value={angle}
                onChange={e=>{setAngle(Number(e.target.value));angleRef.current=Number(e.target.value);}}
                style={{width:'100%',accentColor:'#8b5cf6',cursor:'pointer'}}/>
            </div>
            <div style={{display:'flex',gap:7,marginBottom:10}}>
              {[
                {id:'curl_left', label:'↩️ Sol Viraj', tip:'Duvar etrafı'},
                {id:'straight',  label:'⬆️ Düz',       tip:'Güçlü direkt'},
                {id:'curl_right',label:'↪️ Sağ Viraj', tip:'Köşe süpürme'},
              ].map(e=>(
                <button key={e.id} onClick={()=>{setEffect(e.id);effectRef.current=e.id;}}
                  style={{flex:1,padding:'9px 4px',borderRadius:9,cursor:'pointer',fontFamily:'inherit',background:effect===e.id?'rgba(139,92,246,.3)':'rgba(255,255,255,.05)',border:`1.5px solid ${effect===e.id?'#8b5cf6':'rgba(255,255,255,.12)'}`,color:effect===e.id?'#c4b5fd':'#666',display:'flex',flexDirection:'column',alignItems:'center',gap:2}}>
                  <span style={{fontSize:'.8rem'}}>{e.label.split(' ')[0]}</span>
                  <span style={{fontSize:'.46rem',fontWeight:700}}>{e.label.split(' ').slice(1).join(' ')}</span>
                  <span style={{fontSize:'.4rem',color:'#555'}}>{e.tip}</span>
                </button>
              ))}
            </div>
            <button onClick={goTiming} disabled={!effect}
              style={{width:'100%',padding:'13px',background:effect?'linear-gradient(135deg,#4c1d95,#8b5cf6)':'rgba(255,255,255,.07)',border:'none',borderRadius:10,color:'#fff',fontWeight:900,cursor:effect?'pointer':'default',fontFamily:'inherit',fontSize:'.76rem'}}>
              {effect?'▶ VURUŞ HAZIRLIĞI':'← Önce efekt seç'}
            </button>
          </>
        )}
        {phase==='timing'&&(
          <>
            <div style={{fontSize:'.52rem',color:'#f59e0b',fontWeight:700,textAlign:'center',marginBottom:5}}>
              ⚡ Yeşil bölgede vur!
            </div>
            <div style={{height:14,background:'rgba(255,255,255,.07)',borderRadius:7,overflow:'hidden',marginBottom:10,position:'relative'}}>
              <div style={{position:'absolute',top:0,left:'50%',width:'30%',height:'100%',background:'rgba(16,185,129,.25)',transform:'translateX(-50%)'}}/>
              <div style={{height:'100%',width:8,background:'linear-gradient(90deg,#8b5cf6,#c4b5fd)',borderRadius:4,position:'absolute',top:0,left:`calc(${timing}% - 4px)`,transition:'left .03s'}}/>
            </div>
            <button onClick={shoot}
              style={{width:'100%',padding:'13px',background:'linear-gradient(135deg,#4c1d95,#8b5cf6)',border:'none',borderRadius:10,color:'#fff',fontWeight:900,cursor:'pointer',fontFamily:'inherit',fontSize:'.76rem'}}>
              ⚽ FRİKİK VUR!
            </button>
          </>
        )}
        {phase==='fly'&&(
          <div style={{textAlign:'center',padding:'8px 0'}}>
            <div style={{fontSize:'.68rem',color:'#ffd060',fontWeight:700}}>🌀 Top havada...</div>
          </div>
        )}
        {phase==='result'&&result&&(
          <div style={{textAlign:'center',padding:'8px 0'}}>
            <div style={{fontSize:'1.8rem',marginBottom:4}}>{result.isGoal?'🎉':'😔'}</div>
            <div style={{fontSize:'.76rem',fontWeight:900,color:result.isGoal?'#10b981':'#ef4444'}}>{result.msg}</div>
          </div>
        )}
      </div>
    </div>
  );
}

function MiniGameOrchestrator({type, playerName, pos, skills, onResult}){
  if(type === "shot")     return <ShotMinigame     playerName={playerName} pos={pos} skills={skills} onResult={onResult}/>;
  if(type === "penalty")  return <PenaltyMinigame  playerName={playerName} skills={skills} onResult={onResult}/>;
  if(type === "freekick") return <FreekickMinigame playerName={playerName} skills={skills} onResult={onResult}/>;
  return null;
}
