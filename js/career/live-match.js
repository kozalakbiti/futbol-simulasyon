// ── 4. CANLI MAÇ SKORU BİLEŞENİ ──────────────────────────────
function LiveMatchScreen({ player, perf, weather, isDerby, isCL, onFinish }) {

  // ── REACT STATE — sadece UI elemanları için ────────────────
  const [minute,   setMinute]   = useState(0);
  const [score,    setScore]    = useState({ home:0, away:0 });
  const [gameEvts, setGameEvts] = useState([]);
  const [comm,     setComm]     = useState('Maç başlıyor...');
  const [halftime, setHalftime] = useState(false);
  const [finished, setFinished] = useState(false);
  const [flash,    setFlash]    = useState(null);
  const [action,   setAction]   = useState(null);
  const [myPoss,   setMyPoss]   = useState(false);

  // ── CANVAS REF ────────────────────────────────────────────
  const canvasRef   = useRef(null);

  // ── RAF / OYUN DURUMU — tüm animasyon verisi ref'te ───────
  const rafRef      = useRef(null);
  const minuteRef   = useRef(0);
  const finishedRef = useRef(false);
  const halftimeRef = useRef(false);
  const scoreRef    = useRef({ home:0, away:0 });
  const possRef     = useRef('home'); // 'home' | 'away'
  const tickRef     = useRef(0);
  const lastMsRef   = useRef(null);
  const actionRef   = useRef(null);

  // Oyun nesneleri — ref'te, setState yok
  const ballRef     = useRef({ x:0.50, y:0.50, vx:0, vy:0 });
  const playersRef  = useRef([]);

  // ── SABITLER ─────────────────────────────────────────────
  const isHome    = perf.isHome !== false;
  const finalGF   = perf.gf || 0;
  const finalGA   = perf.ga || 0;
  const maxMin    = perf.hasLastMin ? 90 + (perf.extraTime||3) : 90;
  const myGoalKey = isHome ? 'home' : 'away';
  const opGoalKey = isHome ? 'away' : 'home';
  const MS_PER_MIN = 120; // 120ms × 90 = ~11sn

  // ── GOL DAKİKALARI ───────────────────────────────────────
  const goalRef = useRef(null);
  if (!goalRef.current) {
    const dist = (n) => {
      const arr=[]; let t=0;
      while(arr.length<n && t++<500){
        const m=5+Math.floor(Math.random()*82);
        if(!arr.includes(m)) arr.push(m);
      }
      return arr.sort((a,b)=>a-b);
    };
    const pg=Math.min(perf.goals||0, finalGF);
    const myGoals=dist(finalGF), oppGoals=dist(finalGA);
    const playerGoals=myGoals.slice(0,pg);
    // Müdahale dakikaları: gol öncesi + rastgele
    const actionMins=[
      ...myGoals.map(m=>({min:Math.max(1,m-2),type:'attack'})),
      ...oppGoals.map(m=>({min:Math.max(1,m-1),type:'defend'})),
      ...[10,22,34,47,58,67,76,85].map(m=>({min:m,type:Math.random()<.5?'attack':'defend'})),
    ].filter((a,i,arr)=>arr.findIndex(b=>b.min===a.min)===i).sort((a,b)=>a.min-b.min);
    goalRef.current={myGoals,oppGoals,playerGoals,actionMins};
  }
  const {myGoals,oppGoals,playerGoals,actionMins}=goalRef.current;

  // ── OYUNCU INIT ──────────────────────────────────────────
  // ── FORMASYON SİSTEMİ (4-3-3) ──────────────────────────────
  if(playersRef.current.length===0){
    const mkP=(id,team,bx,by,role,opts={})=>({
      id,team,x:bx,y:by,tx:bx,ty:by,hx:bx,hy:by,role,...opts,
    });
    const home=[
      mkP('h1', 'home',.06,.50,'gk'),
      mkP('h2', 'home',.22,.15,'def'),
      mkP('h3', 'home',.25,.37,'def'),
      mkP('h4', 'home',.25,.63,'def'),
      mkP('h5', 'home',.22,.85,'def'),
      mkP('h6', 'home',.42,.25,'mid'),
      mkP('h7', 'home',.44,.50,'mid'),
      mkP('h8', 'home',.42,.75,'mid'),
      mkP('h9', 'home',.62,.18,'fwd'),
      mkP('h10','home',.65,.50,'fwd',{isPlayer:isHome}),
      mkP('h11','home',.62,.82,'fwd'),
    ];
    const away=[
      mkP('a1', 'away',.94,.50,'gk'),
      mkP('a2', 'away',.78,.15,'def'),
      mkP('a3', 'away',.75,.37,'def'),
      mkP('a4', 'away',.75,.63,'def'),
      mkP('a5', 'away',.78,.85,'def'),
      mkP('a6', 'away',.58,.25,'mid'),
      mkP('a7', 'away',.56,.50,'mid'),
      mkP('a8', 'away',.58,.75,'mid'),
      mkP('a9', 'away',.38,.18,'fwd'),
      mkP('a10','away',.35,.50,'fwd',{isPlayer:!isHome}),
      mkP('a11','away',.38,.82,'fwd'),
    ];
    playersRef.current=[...home,...away];
  }


    // ── CANVAS ÇİZİMİ ─────────────────────────────────────────
  function drawFrame(canvas) {
    const ctx=canvas.getContext('2d');
    // Canvas boyutu 0 ise yeniden boyutlandır
    if(canvas.width<10||canvas.height<10){
      canvas.width=canvas.offsetWidth||320;
      canvas.height=canvas.offsetHeight||165;
    }
    const W=canvas.width, H=canvas.height;
    ctx.clearRect(0,0,W,H);

    // Çim arka plan
    ctx.fillStyle='#0d5230';
    ctx.fillRect(0,0,W,H);
    // Çim şeritleri
    for(let i=0;i<8;i++){
      ctx.fillStyle=i%2===0?'rgba(0,0,0,.07)':'rgba(255,255,255,.02)';
      ctx.fillRect(i*(W/8),0,W/8,H);
    }

    // Saha çizgileri
    ctx.strokeStyle='rgba(255,255,255,.35)';
    ctx.lineWidth=1.5;
    // Dış sınır
    ctx.strokeRect(4,4,W-8,H-8);
    // Orta çizgi
    ctx.beginPath(); ctx.moveTo(W/2,4); ctx.lineTo(W/2,H-4); ctx.stroke();
    // Orta daire
    ctx.beginPath(); ctx.arc(W/2,H/2,H*.22,0,Math.PI*2); ctx.stroke();
    ctx.fillStyle='rgba(255,255,255,.3)';
    ctx.beginPath(); ctx.arc(W/2,H/2,2,0,Math.PI*2); ctx.fill();

    // Ceza sahaları
    const pa=H*.36, pb=H*.64, pw=W*.13;
    ctx.strokeStyle='rgba(255,255,255,.28)'; ctx.lineWidth=1;
    ctx.strokeRect(4,pa,pw,pb-pa);           // sol büyük
    ctx.strokeRect(4,pa+H*.1,pw*.38,pb-pa-H*.2); // sol küçük
    ctx.strokeRect(W-4-pw,pa,pw,pb-pa);      // sağ büyük
    ctx.strokeRect(W-4-pw*.38,pa+H*.1,pw*.38,pb-pa-H*.2); // sağ küçük

    // Penaltı noktaları
    ctx.fillStyle='rgba(255,255,255,.5)';
    ctx.beginPath(); ctx.arc(W*.11,H/2,2,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(W*.89,H/2,2,0,Math.PI*2); ctx.fill();

    // Kale çubukları
    ctx.strokeStyle='rgba(255,255,255,.8)'; ctx.lineWidth=2.5;
    const gy1=H*.42, gy2=H*.58;
    ctx.strokeRect(0,gy1,5,gy2-gy1);         // sol kale
    ctx.strokeRect(W-5,gy1,5,gy2-gy1);       // sağ kale

    // Oyuncular — katmanlı çizim: gölge → daire → numara → özel efekt
    const bx=ballRef.current.x*W, by=ballRef.current.y*H;
    // Önce gölgeler (arkada kalması için)
    playersRef.current.forEach(p=>{
      const px=p.x*W, py=p.y*H;
      const r=p.isPlayer?9:5.5;
      ctx.fillStyle='rgba(0,0,0,.25)';
      ctx.beginPath(); ctx.ellipse(px+1,py+r+1,r*.7,r*.25,0,0,Math.PI*2); ctx.fill();
    });
    // Sonra oyuncular
    playersRef.current.forEach(p=>{
      const px=p.x*W, py=p.y*H;
      const isMain=p.isPlayer;
      const r=isMain?9:5.5;

      // Renk: ana oyuncu yeşil, kaleci sarı, home mavi, away kırmızı
      const baseCol=isMain?'#10b981':p.role==='gk'?'#f59e0b':p.team==='home'?'#2563eb':'#dc2626';
      const darkCol=isMain?'#065f46':p.role==='gk'?'#92400e':p.team==='home'?'#1e3a8a':'#7f1d1d';

      // Gradient dolgu
      const grad=ctx.createRadialGradient(px-r*.3,py-r*.3,0,px,py,r);
      grad.addColorStop(0,'rgba(255,255,255,.25)');
      grad.addColorStop(1,'rgba(0,0,0,.1)');

      ctx.fillStyle=baseCol;
      ctx.beginPath(); ctx.arc(px,py,r,0,Math.PI*2); ctx.fill();
      ctx.fillStyle=grad;
      ctx.beginPath(); ctx.arc(px,py,r,0,Math.PI*2); ctx.fill();

      // Kenarlık
      ctx.strokeStyle=isMain?'#fff':p.role==='gk'?'rgba(255,255,255,.9)':'rgba(255,255,255,.55)';
      ctx.lineWidth=isMain?2.5:1.2;
      ctx.beginPath(); ctx.arc(px,py,r,0,Math.PI*2); ctx.stroke();

      // İç renk çizgisi (forma şerit efekti — ana oyuncu hariç)
      if(!isMain&&p.role!=='gk'){
        ctx.strokeStyle=darkCol;
        ctx.lineWidth=.8;
        ctx.beginPath(); ctx.arc(px,py,r*.6,0,Math.PI*2); ctx.stroke();
      }

      // Numara / ikon
      ctx.fillStyle='#fff';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      if(isMain){
        ctx.font=`bold 7px system-ui`;
        ctx.fillText(player.formNumber||9,px,py);
      } else if(p.role==='gk'){
        ctx.font=`bold 6px system-ui`;
        ctx.fillText('GK',px,py);
      }

      // Ana oyuncuya isim etiketi
      if(isMain){
        const label=(player.name||'').split(' ').pop();
        ctx.font='bold 5.5px system-ui';
        ctx.fillStyle='rgba(0,0,0,.55)';
        ctx.fillRect(px-label.length*1.8-1,py+r+2,label.length*3.6+2,8);
        ctx.fillStyle='#fff';
        ctx.fillText(label,px,py+r+6);
      }

      // Top hakimiyet halkası (yakın olunca)
      if(isMain){
        const dist=Math.hypot(bx-px,by-py);
        if(dist<22){
          ctx.strokeStyle='rgba(255,255,255,.5)';
          ctx.lineWidth=1.2;
          ctx.setLineDash([4,3]);
          ctx.beginPath(); ctx.arc(px,py,r+5,0,Math.PI*2); ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      // Formasyon pozisyon noktası (küçük rehber)
      if(!isMain&&p.role!=='gk'){
        const hpx=p.hx*W, hpy=p.hy*H;
        const dp=Math.hypot(px-hpx,py-hpy);
        if(dp>12){
          ctx.strokeStyle='rgba(255,255,255,.12)';
          ctx.lineWidth=.5;
          ctx.setLineDash([2,4]);
          ctx.beginPath(); ctx.moveTo(px,py); ctx.lineTo(hpx,hpy); ctx.stroke();
          ctx.setLineDash([]);
        }
      }
    });

    // Top
    ctx.font='14px serif';
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.shadowColor='rgba(0,0,0,.5)'; ctx.shadowBlur=4;
    ctx.fillText('⚽',bx,by);
    ctx.shadowBlur=0;
  }

  // ── OYUNCU HEDEFİ GÜNCELLE (her 20 tick'te bir) ──────────
  function updateTargets(tick, poss) {
    const bx=ballRef.current.x, by=ballRef.current.y;

    // Her oyuncu için ideal hedef hesapla
    const targets = {};
    playersRef.current.forEach(p => {
      const dir = p.team==='home' ? 1 : -1;
      const isPoss = p.team===poss;

      if(p.role==='gk'){
        // Kaleci: kendi kale çizgisi yakınında, topa göre y
        targets[p.id]={
          tx: p.team==='home' ? 0.07 : 0.93,
          ty: Math.max(0.38, Math.min(0.62, p.hy*0.6 + by*0.4)),
        };
        return;
      }

      // Ev pozisyonundan başla (hx, hy)
      let tx = p.hx, ty = p.hy;

      if(isPoss){
        // Hücum: formasyon ev pozisyonundan biraz ileriye kayma
        const push = p.role==='fwd' ? 0.10 : p.role==='mid' ? 0.05 : 0.02;
        tx = p.hx + dir * push;
        // Top pozisyonuna göre y ekseninde hafif çekim (max %20)
        ty = p.hy * 0.8 + by * 0.2;
      } else {
        // Savunma: bloğu koru, sadece hafif topa doğru y çekimi
        const pull = p.role==='fwd' ? 0.05 : p.role==='mid' ? 0.15 : 0.25;
        tx = p.hx * (1-pull) + bx * pull;
        ty = p.hy * 0.75 + by * 0.25;
        // Savunma blok: top kendi yarısına geldiyse geri çekil
        const ownHalf = p.team==='home' ? bx < 0.5 : bx > 0.5;
        if(ownHalf){
          tx = p.hx * 0.7 + bx * 0.3;
          ty = p.hy * 0.6 + by * 0.4;
        }
      }

      // Hafif salınım (canlılık)
      const phase = tick * 0.018 + p.id.charCodeAt(1) * 0.7;
      tx += Math.sin(phase) * 0.012;
      ty += Math.cos(phase * 1.2) * 0.012;

      targets[p.id] = {
        tx: Math.max(0.04, Math.min(0.96, tx)),
        ty: Math.max(0.05, Math.min(0.95, ty)),
      };
    });

    // Top peşindeki tek chaser (her takım için)
    let chaserH=null, chaserA=null, dH=99, dA=99;
    playersRef.current.forEach(p=>{
      if(p.role==='gk') return;
      const d=Math.hypot(bx-p.x, by-p.y);
      if(p.team==='home' && d<dH){dH=d; chaserH=p.id;}
      if(p.team==='away' && d<dA){dA=d; chaserA=p.id;}
    });
    // Chaser topu takip et
    playersRef.current.forEach(p=>{
      if(p.role==='gk') return;
      const isC = (p.team==='home' ? chaserH : chaserA) === p.id;
      if(isC){
        const d=Math.hypot(bx-p.x, by-p.y);
        if(d>0.08){
          targets[p.id].tx = p.x + (bx-p.x)*0.12;
          targets[p.id].ty = p.y + (by-p.y)*0.12;
        }
      }
    });

    // Repulse: oyuncular birbirine çok yaklaşmasın (5 iterasyon)
    const ids = Object.keys(targets);
    const MIN_DIST = 0.085;
    for(let it=0; it<5; it++){
      for(let a=0; a<ids.length; a++){
        for(let b=a+1; b<ids.length; b++){
          const ta=targets[ids[a]], tb=targets[ids[b]];
          const dx=ta.tx-tb.tx, dy=ta.ty-tb.ty;
          const d=Math.hypot(dx,dy);
          if(d<MIN_DIST && d>0.001){
            const f=(MIN_DIST-d)*0.5;
            const nx=dx/d, ny=dy/d;
            ta.tx+=nx*f; ta.ty+=ny*f;
            tb.tx-=nx*f; tb.ty-=ny*f;
            ta.tx=Math.max(0.04,Math.min(0.96,ta.tx));
            ta.ty=Math.max(0.05,Math.min(0.95,ta.ty));
            tb.tx=Math.max(0.04,Math.min(0.96,tb.tx));
            tb.ty=Math.max(0.05,Math.min(0.95,tb.ty));
          }
        }
      }
    }

    playersRef.current = playersRef.current.map(p=>({
      ...p, tx:targets[p.id].tx, ty:targets[p.id].ty
    }));
  }

  // ── TOP FİZİĞİ ───────────────────────────────────────────
  function updateBall(tick, poss) {
    let {x,y,vx,vy}=ballRef.current;

    // Sürtünme (çim direnci)
    vx*=.91; vy*=.91;
    x+=vx; y+=vy;

    // Sınır yansıması
    if(x<.03){x=.03;vx=Math.abs(vx)*.55;}
    if(x>.97){x=.97;vx=-Math.abs(vx)*.55;}
    if(y<.04){y=.04;vy=Math.abs(vy)*.55;}
    if(y>.96){y=.96;vy=-Math.abs(vy)*.55;}

    // ── OYUNCU ÇARPIŞMASI ───────────────────────────────────
    const BALL_R = 0.022; // topun normalize yarıçapı
    const PLAYER_R = 0.032; // oyuncu yarıçapı (biraz büyük = daha kolay çarpışma)
    const TOUCH_D = BALL_R + PLAYER_R;

    // En yakın oyuncuyu bul (chaser = top kontrolünde)
    let chaserH=null, chaserA=null, dH=99, dA=99;
    playersRef.current.forEach(p=>{
      if(p.role==='gk') return;
      const d=Math.hypot(x-p.x, y-p.y);
      if(p.team==='home' && d<dH){dH=d; chaserH=p;}
      if(p.team==='away' && d<dA){dA=d; chaserA=p;}
    });

    // Tüm oyuncularla çarpışma kontrolü
    playersRef.current.forEach(p=>{
      const dx=x-p.x, dy=y-p.y;
      const d=Math.hypot(dx,dy);
      if(d<TOUCH_D && d>0.001){
        // Çarpışma normal vektörü
        const nx=dx/d, ny=dy/d;
        // Topun bu oyuncuya olan göreli hızı
        const relV=vx*nx+vy*ny;

        // Sadece top oyuncuya doğru gidiyorsa (negatif relV = birbirine yaklaşıyor)
        if(relV<0.002){
          // Yansıma kuvveti
          const bounce=(-relV*1.4)+0.006;
          vx+=nx*bounce;
          vy+=ny*bounce;
        }

        // Çakışmayı çöz (penetrasyon önleme)
        const overlap=TOUCH_D-d;
        x+=nx*overlap*0.6;
        y+=ny*overlap*0.6;

        // Chaser topu aktif taşıyorsa: hedef yönüne doğru ekstra itki
        const isChaser=(p.team==='home'?chaserH:chaserA)?.id===p.id;
        if(isChaser){
          const dir=p.team==='home'?1:-1;
          // Chaser topun sahibiyse onu hedef kaleye doğru iter
          const pushX=dir*0.015;
          const pushY=(0.5-y)*0.008; // Ortaya doğru y düzeltmesi
          vx+=pushX+(Math.random()-.5)*0.008;
          vy+=pushY+(Math.random()-.5)*0.010;
        }
      }
    });

    // Kaleci çarpışması (kale alanı koruması)
    playersRef.current.filter(p=>p.role==='gk').forEach(p=>{
      const dx=x-p.x, dy=y-p.y;
      const d=Math.hypot(dx,dy);
      const GK_R=TOUCH_D*1.4;
      if(d<GK_R && d>0.001){
        const nx=dx/d, ny=dy/d;
        // Kaleci topu dışarı atar
        const speed=Math.max(0.02, Math.hypot(vx,vy));
        vx=nx*speed*1.2+(Math.random()-.5)*0.01;
        vy=ny*speed*1.2+(Math.random()-.5)*0.015;
        const overlap=GK_R-d;
        x+=nx*overlap;
        y+=ny*overlap;
      }
    });

    // Yavaşlayınca sahip oyuncudan itki (top ölü kalmaz)
    if(Math.hypot(vx,vy)<0.004 && tick%20===0){
      const chaser=poss==='home'?chaserH:chaserA;
      if(chaser){
        const dir=chaser.team==='home'?1:-1;
        const dx=chaser.x-x, dy=chaser.y-y;
        const d=Math.hypot(dx,dy);
        if(d<0.15){
          // Chaser yakındaysa topu ileriye iter
          vx=dir*(.014+Math.random()*.016)+(Math.random()-.5)*.008;
          vy=(Math.random()-.5)*.018;
        } else {
          // Uzaksa rastgele itki
          vx=dir*(.010+Math.random()*.012)+(Math.random()-.5)*.010;
          vy=(Math.random()-.5)*.018;
        }
      } else {
        const dir=poss==='home'?1:-1;
        vx=dir*(.010+Math.random()*.014)+(Math.random()-.5)*.010;
        vy=(Math.random()-.5)*.018;
      }
    }

    // Sınır tekrar kontrol (çarpışma sonrası taşma olabilir)
    x=Math.max(.03,Math.min(.97,x));
    y=Math.max(.04,Math.min(.96,y));

    ballRef.current={x,y,vx,vy};
  }

  // ── MÜDAHALE EVENT'İ ─────────────────────────────────────
  function buildAction(type) {
    const pos=player.pos;
    const atk=['ST','CAM','LM','RM'].includes(pos);
    const mid=['CM','CDM'].includes(pos);
    const def=['CB','LB','RB','GK'].includes(pos);
    if(type==='attack'){
      if(atk) return [{type:'shot',label:'Şut çekiyor!'},{type:'dribble',label:'Çalım yapıyor!'},{type:'header',label:'Kafa vuruşu!'}][Math.floor(Math.random()*3)];
      if(mid) return {type:'pass',label:'Anahtar pas!'};
      return {type:'tackle',label:'Hücuma çıkıyor!'};
    } else {
      if(def||pos==='GK') return [{type:'tackle',label:'Müdahale!'},{type:'save',label:'Kurtarış!'},{type:'header',label:'Kafa uzatıyor!'}][Math.floor(Math.random()*3)];
      if(mid) return {type:'tackle',label:'Topu kesiyor!'};
      return {type:'dribble',label:'Geri düşüyor!'};
    }
  }

  // ── ANA RAF DÖNGÜSÜ ──────────────────────────────────────
  useEffect(()=>{
    const canvas=canvasRef.current;
    if(!canvas) return;

    const loop=(ts)=>{
      if(finishedRef.current) return;
      rafRef.current=requestAnimationFrame(loop);
      const tick=++tickRef.current;

      // Top + oyuncu güncelle (her frame, sadece ref — setState yok)
      if(!halftimeRef.current){
        updateBall(tick, possRef.current);
        if(tick%10===0) updateTargets(tick, possRef.current); // hedef pozisyon 10fps güncelle
        // Oyuncuları hedefe doğru yumuşak kayıştır
        playersRef.current=playersRef.current.map(p=>({
          ...p,
          x:p.x+(p.tx-p.x)*.05,
          y:p.y+(p.ty-p.y)*.05,
        }));
      }

      // Canvas çiz (her frame)
      drawFrame(canvas);

      // Dakika güncelle (MS_PER_MIN aralıkla)
      if(lastMsRef.current===null) lastMsRef.current=ts;
      const elapsed=ts-lastMsRef.current;
      if(elapsed>=MS_PER_MIN && !halftimeRef.current){
        lastMsRef.current=ts;
        minuteRef.current+=1;
        const next=minuteRef.current;

        // Devre arası
        if(next===45){
          halftimeRef.current=true;
          setHalftime(true);
          // Top ortaya
          ballRef.current={x:.5,y:.5,vx:0,vy:0};
          // Oyuncuları ev pozisyonlarına döndür
          playersRef.current=playersRef.current.map(function(p){
            return Object.assign({},p,{tx:p.hx,ty:p.hy,x:p.hx,y:p.hy});
          });
          setTimeout(()=>{
            halftimeRef.current=false;
            setHalftime(false);
            lastMsRef.current=null;
            // Top sahipliği değiştir (2. devre — setTimeout içinde güvenli)
            possRef.current=possRef.current==='home'?'away':'home';
            setMyPoss(possRef.current==='home'===isHome);
          },2800);
        }

        // Müdahale anı — React state ile göster
        const act=actionMins.find(a=>a.min===next);
        if(act && !actionRef.current){
          const ev=buildAction(act.type);
          const isSuccess=act.type==='attack'
            ?(playerGoals.includes(next+1)||playerGoals.includes(next+2)||Math.random()<.45)
            :Math.random()<.6;
          const full={...ev,result:isSuccess?'success':'fail',minute:next};
          actionRef.current=full;
          setAction(full);
          setTimeout(()=>{ actionRef.current=null; setAction(null); },2000);
        }

        // Gol: takımım
        if(myGoals.includes(next)){
          const isPlayerGoal=playerGoals.includes(next);
          scoreRef.current={...scoreRef.current,[myGoalKey]:scoreRef.current[myGoalKey]+1};
          setScore({...scoreRef.current});
          setFlash('#10b981'); setTimeout(()=>setFlash(null),700);
          setGameEvts(ev=>[...ev,{min:next,text:isPlayerGoal?`⚽ GOL! ${player.name} fileleri sarstı!`:`⚽ GOL! ${player.team}!`,color:'#10b981'}]);
          setComm(isPlayerGoal?`🔥 ${player.name} GOL ATTI!`:`⚽ ${player.team} GOL!`);
          setMyPoss(isHome);
          ballRef.current={x:.5,y:.5,vx:0,vy:0};
          possRef.current=opGoalKey==='home'?'home':'away';
        }

        // Gol: rakip
        if(oppGoals.includes(next)){
          scoreRef.current={...scoreRef.current,[opGoalKey]:scoreRef.current[opGoalKey]+1};
          setScore({...scoreRef.current});
          setFlash('#ef4444'); setTimeout(()=>setFlash(null),700);
          setGameEvts(ev=>[...ev,{min:next,text:'😔 Rakip golü buldu.',color:'#ef4444'}]);
          setComm('😔 Rakip golü buldu!');
          ballRef.current={x:.5,y:.5,vx:0,vy:0};
          possRef.current=myGoalKey==='home'?'home':'away';
        }

        // Top hakimiyet değişimi
        if(tick%40===0 && Math.random()<.30){
          const np=possRef.current==='home'?'away':'home';
          possRef.current=np;
          setMyPoss(np==='home'===isHome);
          ballRef.current.vx*=-1.2; ballRef.current.vy*=-0.8;
        }

        // Periyodik yorum
        if(next%9===0 && !myGoals.includes(next) && !oppGoals.includes(next)){
          const p=possRef.current;
          const lines={
            home:['Ev sahibi baskı uyguluyor!','Kanat oyunu deneniyor.','Pozisyon arayışı sürüyor.'],
            away:['Rakip tehlikeli.','Savunma sağlamlaşıyor.','Top karşı bölgede.'],
          };
          setComm(lines[p][Math.floor(Math.random()*3)]);
        }

        // Dakika state güncelle
        setMinute(next);

        // Maç sonu
        if(next>=maxMin){
          finishedRef.current=true;
          setFinished(true);
          cancelAnimationFrame(rafRef.current);
          setTimeout(()=>onFinish(),1500);
        }
      }
    };

    rafRef.current=requestAnimationFrame(loop);
    return ()=>{ if(rafRef.current) cancelAnimationFrame(rafRef.current); };
  },[]);

  // ── Canvas boyutu ─────────────────────────────────────────
  useEffect(()=>{
    const canvas=canvasRef.current;
    if(!canvas) return;
    const resize=()=>{
      // CSS boyutunu doğrudan kullan - DPR karmaşıklığı olmadan
      canvas.width=canvas.offsetWidth||320;
      canvas.height=canvas.offsetHeight||165;
    };
    // Kısa gecikme ile çağır (DOM mount sonrası)
    const timer=setTimeout(resize, 50);
    window.addEventListener('resize',resize);
    return ()=>{ clearTimeout(timer); window.removeEventListener('resize',resize); };
  },[]);

  const sc=scoreRef.current;
  const myS=isHome?sc.home:sc.away, oppS=isHome?sc.away:sc.home;
  const actionIcons={shot:'⚽',tackle:'🛡️',save:'🧤',header:'👤',dribble:'🌀',pass:'🎯'};

  return(
    <div style={{position:'fixed',inset:0,background:'#020812',display:'flex',flexDirection:'column',fontFamily:'system-ui,sans-serif',zIndex:998}}>

      {/* Gol flash */}
      {flash&&<div style={{position:'fixed',inset:0,background:flash,opacity:.15,zIndex:999,pointerEvents:'none'}}/>}

      {/* SKOR HEADER */}
      <div style={{background:isCL?'linear-gradient(135deg,#1e1b4b,#312e81)':isDerby?'linear-gradient(135deg,#7f1d1d,#991b1b)':'linear-gradient(135deg,#0a1630,#050e22)',padding:'10px 14px 7px',flexShrink:0}}>
        {isCL&&<div style={{fontSize:'.44rem',color:'#ffd060',fontWeight:700,letterSpacing:2,marginBottom:2,textAlign:'center'}}>⭐ ASK</div>}
        {isDerby&&<div style={{fontSize:'.44rem',color:'#f87171',fontWeight:700,letterSpacing:2,marginBottom:2,textAlign:'center'}}>🔥 DERBİ MAÇI</div>}
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:10,marginBottom:5}}>
          <div style={{flex:1,textAlign:'right'}}>
            <div style={{fontSize:'.6rem',fontWeight:700,color:'#fff'}}>{isHome?player.team:'Rakip'}</div>
            <div style={{fontSize:'.4rem',color:'#7898c0'}}>{isHome?'🏠':'✈️'}</div>
          </div>
          <div style={{textAlign:'center',minWidth:88}}>
            <div style={{fontSize:'2.1rem',fontWeight:900,color:'#fff',lineHeight:1,letterSpacing:5}}>
              {sc.home} - {sc.away}
            </div>
            <div style={{fontSize:'.45rem',fontWeight:700,color:finished?'#10b981':halftime?'#f59e0b':minute>80?'#ef4444':'#7898c0'}}>
              {finished?'⏹ BİTTİ':halftime?'⏸ DEVRE ARASI':minute>90?`90+${minute-90}'`:`${minute}'`}
            </div>
          </div>
          <div style={{flex:1,textAlign:'left'}}>
            <div style={{fontSize:'.6rem',fontWeight:700,color:'#fff'}}>{isHome?'Rakip':player.team}</div>
            <div style={{fontSize:'.4rem',color:'#7898c0'}}>{isHome?'✈️':'🏠'}</div>
          </div>
        </div>
        <div style={{height:3,background:'rgba(255,255,255,.1)',borderRadius:2,overflow:'hidden'}}>
          <div style={{height:'100%',width:`${Math.min(100,(minute/maxMin)*100)}%`,background:minute>75?'#ef4444':minute>45?'#f59e0b':'#2485ff',transition:'width .1s linear'}}/>
        </div>
      </div>

      {/* CANVAS SAHA */}
      <div style={{margin:'7px 12px',borderRadius:10,overflow:'hidden',flexShrink:0,position:'relative',height:170,border:'1px solid rgba(255,255,255,.12)'}}>
        <canvas ref={canvasRef} style={{width:'100%',height:'100%',display:'block'}}/>
        {/* Possession bar */}
        <div style={{position:'absolute',top:5,left:'50%',transform:'translateX(-50%)',display:'flex',gap:3,alignItems:'center',pointerEvents:'none'}}>
          <div style={{width:28,height:3,borderRadius:2,background:myPoss?'#2485ff':'rgba(255,255,255,.15)',transition:'background .3s'}}/>
          <div style={{width:7,height:7,borderRadius:'50%',background:myPoss?'#2485ff':'#ef4444',border:'1px solid rgba(255,255,255,.4)',transition:'background .3s'}}/>
          <div style={{width:28,height:3,borderRadius:2,background:!myPoss?'#ef4444':'rgba(255,255,255,.15)',transition:'background .3s'}}/>
        </div>
        {halftime&&<div style={{position:'absolute',inset:0,background:'rgba(0,0,0,.78)',display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:'.82rem',fontWeight:900,color:'#fff'}}>⏸ DEVRE ARASI</div>
            <div style={{fontSize:'.6rem',color:'#7898c0',marginTop:3}}>{sc.home} - {sc.away}</div>
          </div>
        </div>}
        {finished&&<div style={{position:'absolute',inset:0,background:'rgba(0,0,0,.82)',display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:'1.5rem',marginBottom:3}}>{myS>oppS?'🏆':myS===oppS?'🤝':'😔'}</div>
            <div style={{fontSize:'.76rem',fontWeight:900,color:myS>oppS?'#10b981':myS===oppS?'#f59e0b':'#ef4444'}}>
              {myS>oppS?'GALİBİYET':myS===oppS?'BERABERLİK':'MAĞLUBIYET'}
            </div>
          </div>
        </div>}
      </div>

      {/* MÜDAHALEBANNERı */}
      {action&&(
        <div style={{margin:'0 12px 5px',padding:'8px 13px',background:action.result==='success'?'rgba(16,185,129,.12)':'rgba(245,158,11,.1)',border:`1.5px solid ${action.result==='success'?'rgba(16,185,129,.35)':'rgba(245,158,11,.35)'}`,borderRadius:10,display:'flex',alignItems:'center',gap:10,flexShrink:0}}>
          <span style={{fontSize:'1.5rem'}}>{actionIcons[action.type]||'⚽'}</span>
          <div style={{flex:1}}>
            <div style={{fontSize:'.6rem',fontWeight:800,color:action.result==='success'?'#10b981':'#f59e0b'}}>{player.name} — {action.label}</div>
            <div style={{fontSize:'.5rem',color:action.result==='success'?'#6ee7b7':'#fcd34d'}}>
              {action.result==='success'?'✅ Başarılı!':'❌ Başarısız.'} {action.minute}'
            </div>
          </div>
        </div>
      )}

      {/* YORUM */}
      <div style={{padding:'0 12px',marginBottom:5,flexShrink:0}}>
        <div style={{background:'rgba(255,255,255,.04)',border:'1px solid rgba(77,166,255,.12)',borderRadius:8,padding:'6px 11px',fontSize:'.55rem',color:'#ccc',display:'flex',alignItems:'center',gap:6,minHeight:28}}>
          <span>🎙️</span>{comm}
        </div>
      </div>

      {/* OLAY AKIŞI */}
      <div style={{flex:1,overflowY:'auto',padding:'0 12px'}}>
        {gameEvts.length===0&&<div style={{textAlign:'center',color:'#3a5070',fontSize:'.5rem',paddingTop:10}}>Maç devam ediyor...</div>}
        {[...gameEvts].reverse().map((ev,i)=>(
          <div key={i} style={{display:'flex',gap:8,padding:'5px 0',borderBottom:'1px solid rgba(77,166,255,.06)'}}>
            <span style={{fontSize:'.5rem',fontWeight:700,color:'#4da6ff',minWidth:24,flexShrink:0}}>{ev.min}'</span>
            <span style={{fontSize:'.54rem',color:ev.color||'#ccc',lineHeight:1.4}}>{ev.text}</span>
          </div>
        ))}
      </div>

      {/* ALT PANEL */}
      <div style={{padding:'7px 12px 10px',background:'rgba(5,14,34,.96)',borderTop:'1px solid rgba(77,166,255,.1)',flexShrink:0}}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
          <span style={{fontSize:'.44rem',color:'#7898c0'}}>{player.name} · #{player.formNumber||9} · {player.pos}</span>
          <span style={{fontSize:'.44rem',fontWeight:700,color:myPoss?'#2485ff':'#ef4444'}}>{myPoss?'🔵 Top bizde':'🔴 Top rakipte'}</span>
        </div>
        <div style={{display:'flex',justifyContent:'space-around'}}>
          {[
            {l:'Golüm',v:gameEvts.filter(e=>e.text.includes(player.name)).length,i:'⚽',col:'#10b981'},
            {l:'Dakika',v:`${Math.min(minute,90)}'`,i:'⏱️',col:'#7898c0'},
            {l:'Skor',v:`${myS}-${oppS}`,i:'📊',col:myS>oppS?'#10b981':myS<oppS?'#ef4444':'#f59e0b'},
            {l:'Hava',v:weather?.icon||'☀️',i:'🌤️',col:'#7898c0'},
          ].map((s,i)=>(
            <div key={i} style={{textAlign:'center'}}>
              <div style={{fontSize:'.7rem'}}>{s.i}</div>
              <div style={{fontSize:'.7rem',fontWeight:800,color:s.col||'#fff'}}>{s.v}</div>
              <div style={{fontSize:'.36rem',color:'#7898c0'}}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
