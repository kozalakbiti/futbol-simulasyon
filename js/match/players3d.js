// ═══════════════════════════════════════════════════════════════
// 3D MAÇ — OYUNCULAR, TOP VE OLAY EFEKTLERİ (React dışı sahne denetleyicisi)
// ═══════════════════════════════════════════════════════════════
// Kullanım (Pitch3D onReady içinde):
//   const actors=createMatchActors3D(api,{getSnapshot:()=>liveRef.current});
//   snapshot: {my:[{id,x,y,role}], opp:[...], ball:[x,y],
//              events:[{id,x,y,type,team}], labels:["Kısa ad",...]}
//   (0–100 saha yüzdesi; my ve opp aynı sistemde: x=0 bizim kale, x=100 rakip)
//   getSnapshot verilirse denetleyici her karede kendisi okur; ayrıca
//   actors.update(snapshot) ile elle de beslenebilir. Diziler referans olarak
//   karşılaştırılır (React state'i her değişimde yeni dizi üretir).
// Dönen nesne: {update(snapshot), triggerEvent(ev), resetKickoff(), dispose()}
//   + kilit an sahnesi için (dünya koordinatı): movePlayer(team,i,wx,wz,instant),
//   getPlayerPos(team,i), setBall(wx,wz,y), playBallScript([{x,z,y,h,dur,fn}],lockSec),
//   goalFx(side,gz,team), ringFx(x,z,color,dur,maxS), shakeGoal(side), getBall()
//   + topa bağlı oyun (Adım 5): drivePlayer(team,i,wx,wz) (konumu doğrudan sür; hız/yön
//   hareketten hesaplanır), setOwner(team,i) / setOwner(null), getOwner() → {team,i}|null,
//   kickTo(wx,wz,lofted) → uçuş süresi (sn), kickBall(vx,vy,vz,curlX,curlZ),
//   getBallVel(), isBallFree(), getPlayer(team,i), poseFx(team,i,"slide"|"fall",sec)
//   (team: "home" | "away") · opts.manual: otomatik sahiplik kapalı (kilit an sahnesi)
// • Oyuncular hedefe lerp + hız sınırıyla yürür, hareket yönüne döner,
//   koşarken hafifçe sallanır.
// • TOP SAHİPLİĞİ (normal akış): her an bir top sahibi vardır. Sahip ballPos
//   hedefine koşar, top ayağının ~0.8–1.2 m önünde koşu fazıyla senkron
//   dokunuşlarla sürülür. ballPos'a başka bir oyuncu belirgin şekilde daha yakın
//   olunca top ayaktan kopar: aynı takım → pas (alıcının hareketine göre öngörülü,
//   kısa/açık yol → yerden sürtünmeli, uzun/kapalı → parabolik), rakip → top
//   kaybı/kesme. Alıcı topa birkaç adım atar, top gelince ayağına yapışır.
//   Olay senaryoları (gol, kurtarış…) sürerken sahiplik askıdadır; bitince en
//   yakın oyuncu topu alır (golden sonra top santraya, merkezdeki oyuncuya).
// • Olaylar (gol/kaçan şut/kurtarış/direk/korner/kart) tek seferlik efekt
//   tetikler; görülmüş olay id'leri tutulur. Bilinmeyen tipler sessizce geçilir.
// • Bellek: tüm oyuncular paylaşılan geometri/malzeme kullanır; efektler
//   bitince sahneden çıkarılıp dispose edilir. api.addDisposeHook ile sahne
//   silinmeden önce kendini temizler; dispose() elle de çağrılabilir.
// • Kare döngüsünde yeni nesne/vektör tahsis edilmez.
// ═══════════════════════════════════════════════════════════════

const ACTORS3D_COLORS={
  home:0x2485ff, homeGK:0xffb020, homeShorts:0xf2f2f2,   // bizim takım (2D ile aynı mavi)
  away:0xd93a3a, awayGK:0xa36bff, awayShorts:0x1b1b24,   // rakip
  skin:0xe0b48c, ball:0xffffff, yellowCard:"#ffd21f", redCard:"#e0262b",
};

function createMatchActors3D(api,opts={}){
  const noop={update(){},triggerEvent(){},resetKickoff(){},dispose(){},
    movePlayer(){},getPlayerPos(){return null;},setBall(){},playBallScript(){},
    goalFx(){},ringFx(){},shakeGoal(){},getBall(){return null;},
    drivePlayer(){},setOwner(){},getOwner(){return null;},kickTo(){return 0;},kickBall(){},
    getBallVel(){return null;},isBallFree(){return false;},getPlayer(){return null;},poseFx(){}};
  if(!api||!api.THREE||api.isDisposed()) return noop;
  const THREE=api.THREE, D=PITCH3D_DIM, L=D.halfLen, H=D.halfWid, GW=D.goalWidth/2;
  const COL=ACTORS3D_COLORS, BR=0.42; // top yarıçapı (görünürlük için büyütülmüş)
  const flat=(geo)=>{geo.rotateX(-Math.PI/2);return geo;};
  const owned={geos:[],mats:[],texs:[]}; // denetleyiciye ait paylaşılan kaynaklar
  const G=(g)=>{owned.geos.push(g);return g;};
  const M=(m)=>{owned.mats.push(m);return m;};
  const clamp=(v,a,b)=>v<a?a:v>b?b:v;

  // ── Paylaşılan geometri (oyuncu ~3 m: uzaktan görünsün diye büyütülmüş) ──
  const legsGeo=G(new THREE.CylinderGeometry(0.34,0.28,1.0,8)); legsGeo.translate(0,0.5,0);
  const torsoGeo=G(new THREE.CylinderGeometry(0.54,0.42,1.25,8));
  torsoGeo.scale(1,1,0.66); torsoGeo.translate(0,1.62,0); // omuzlar yerel X'te geniş → yüz +Z
  const headGeo=G(new THREE.SphereGeometry(0.36,10,8)); headGeo.translate(0,2.6,0);
  const shadowGeo=G(flat(new THREE.CircleGeometry(0.85,14)));
  const ballGeo=G(new THREE.IcosahedronGeometry(BR,1));
  const ringGeo=G(flat(new THREE.RingGeometry(0.8,1.15,32)));
  const poleGeo=G(new THREE.CylinderGeometry(0.05,0.05,1.8,6)); poleGeo.translate(0,0.9,0);
  const flagGeo=G(new THREE.PlaneGeometry(0.7,0.45)); flagGeo.translate(0.35,1.55,0);

  // ── Paylaşılan malzemeler ──
  const lam=(c)=>M(new THREE.MeshLambertMaterial({color:c}));
  const mats={
    home:lam(COL.home), homeGK:lam(COL.homeGK), homeShorts:lam(COL.homeShorts),
    away:lam(COL.away), awayGK:lam(COL.awayGK), awayShorts:lam(COL.awayShorts),
    skin:lam(COL.skin), pole:lam(0xeeeeee),
    ball:M(new THREE.MeshPhongMaterial({color:COL.ball,flatShading:true,shininess:25})),
    flag:M(new THREE.MeshBasicMaterial({color:0xffd23f,side:THREE.DoubleSide})),
    shadow:M(new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:0.3,depthWrite:false})),
    ballShadow:M(new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:0.4,depthWrite:false})),
  };

  const root=new THREE.Group(); root.name="actors";
  const ballRoot=new THREE.Group(); ballRoot.name="ballActor";
  const fxRoot=new THREE.Group(); fxRoot.name="fxActors";
  api.groups.players.add(root); api.groups.ball.add(ballRoot); api.groups.fx.add(fxRoot);

  // Köşe bayrakları (sahada yoktu; korner efekti için)
  [[-1,-1],[1,-1],[1,1],[-1,1]].forEach(([sx,sz])=>{
    const p=new THREE.Mesh(poleGeo,mats.pole); p.position.set(sx*L,0,sz*H); root.add(p);
    const f=new THREE.Mesh(flagGeo,mats.flag); f.position.set(sx*L,0,sz*H); f.rotation.y=sx>0?Math.PI:0; root.add(f);
  });

  // ── Oyuncular ──
  const teams={home:[],away:[]};
  const makePlayer=(team,idx)=>{
    const g=new THREE.Group(), body=new THREE.Group();
    const home=team==="home";
    const legs=new THREE.Mesh(legsGeo,home?mats.homeShorts:mats.awayShorts);
    const torso=new THREE.Mesh(torsoGeo,home?mats.home:mats.away);
    const head=new THREE.Mesh(headGeo,mats.skin);
    body.add(legs); body.add(torso); body.add(head);
    const sh=new THREE.Mesh(shadowGeo,mats.shadow); sh.position.y=0.03; sh.renderOrder=1;
    g.add(sh); g.add(body);
    g.visible=false;
    root.add(g);
    // vx/vz: yumuşatılmış hız (öngörülü pas) · ovr/ox/oz/cap: sahiplik mantığının
    // geçici hedefi ve hız sınırı · driven: konum dışarıdan sürülüyor (kilit an)
    return {g,body,torso,team,idx,pos:new THREE.Vector3(),tgt:new THREE.Vector3(),
      yaw:home?Math.PI/2:-Math.PI/2,phase:Math.random()*6,speed:0,has:false,
      vx:0,vz:0,lx:0,lz:0,ovr:false,ox:0,oz:0,cap:0,driven:false,pose:null,poseT:0,
      label:null,labelText:null};
  };
  const ensurePlayer=(team,i)=>{
    const list=teams[team];
    while(list.length<=i) list.push(makePlayer(team,list.length));
    return list[i];
  };

  // ── İsim etiketleri (oyuncu başına küçük canvas, bir kez oluşturulur) ──
  const drawLabel=(p,text)=>{
    if(!p.label){
      const cv=document.createElement("canvas"); cv.width=128; cv.height=32;
      const tex=new THREE.CanvasTexture(cv);
      tex.minFilter=THREE.LinearFilter; tex.generateMipmaps=false;
      const m=new THREE.SpriteMaterial({map:tex,transparent:true,depthWrite:false});
      const s=new THREE.Sprite(m); s.scale.set(4.4,1.1,1); s.position.y=3.75; s.renderOrder=5;
      p.g.add(s);
      owned.texs.push(tex); owned.mats.push(m);
      p.label={cv,ctx:cv.getContext("2d"),tex,s};
    }
    const {cv,ctx,tex,s}=p.label;
    p.labelText=text;
    if(!text||!ctx){ s.visible=false; return; }
    s.visible=true;
    ctx.clearRect(0,0,cv.width,cv.height);
    ctx.font="bold 19px sans-serif";
    const tw=Math.min(cv.width-4,ctx.measureText(text).width+14);
    const x0=(cv.width-tw)/2, y0=3, h=26, r=6;
    ctx.fillStyle="rgba(0,0,0,0.62)";
    ctx.beginPath();
    ctx.moveTo(x0+r,y0); ctx.lineTo(x0+tw-r,y0); ctx.quadraticCurveTo(x0+tw,y0,x0+tw,y0+r);
    ctx.lineTo(x0+tw,y0+h-r); ctx.quadraticCurveTo(x0+tw,y0+h,x0+tw-r,y0+h);
    ctx.lineTo(x0+r,y0+h); ctx.quadraticCurveTo(x0,y0+h,x0,y0+h-r);
    ctx.lineTo(x0,y0+r); ctx.quadraticCurveTo(x0,y0,x0+r,y0);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle="#ffffff"; ctx.textAlign="center"; ctx.textBaseline="middle";
    ctx.fillText(text,cv.width/2,y0+h/2+1,cv.width-10);
    tex.needsUpdate=true;
  };
  const applyLabels=(labels)=>{
    const list=teams.home;
    for(let i=0;i<list.length;i++){
      const t=(labels&&labels[i])||"";
      if(list[i].labelText!==t) drawLabel(list[i],t);
    }
  };

  const applyDots=(team,dots)=>{
    const list=teams[team];
    const n=dots?dots.length:0;
    for(let i=0;i<n;i++){
      const d=dots[i];
      const dx=d?Number(d.x):NaN, dy=d?Number(d.y):NaN;
      if(!Number.isFinite(dx)||!Number.isFinite(dy)){ // NaN koruması: geçerli veri gelene kadar gizli
        if(list[i]) list[i].g.visible=false;
        continue;
      }
      const p=ensurePlayer(team,i);
      pitchToWorld3D(dx,dy,0,p.tgt);
      const gk=d.role==="GK";
      p.torso.material=team==="home"?(gk?mats.homeGK:mats.home):(gk?mats.awayGK:mats.away);
      if(!p.has){ p.pos.copy(p.tgt); p.lx=p.pos.x; p.lz=p.pos.z; p.has=true; p.g.position.copy(p.pos); p.g.rotation.y=p.yaw; }
      p.g.visible=true;
    }
    for(let i=n;i<list.length;i++) list[i].g.visible=false;
  };

  // ── Top ──
  const ball=new THREE.Mesh(ballGeo,mats.ball); ballRoot.add(ball);
  const ballShadow=new THREE.Mesh(shadowGeo,mats.ballShadow); ballShadow.renderOrder=1; ballRoot.add(ballShadow);
  const bpos=new THREE.Vector3(0,0,0);         // y = yerden yükseklik (top merkezi BR+y)
  const fl={on:false,script:false,sx:0,sy:0,sz:0,ex:0,ey:0,ez:0,h:0,dur:1,t:0,fn:null};
  const legs=[];                                // senaryo kuyruğu (olay başına doldurulur)
  const pend={on:false,x:0,z:0};                // kilit sırasında gelen son ballPos
  const tmpV=new THREE.Vector3();
  let lockUntil=0, clk=0, ballInit=false;
  const manual=!!opts.manual;                   // kilit an: sahipliği dış denetleyici yönetir

  // ── Topa bağlı oyun: sahiplik + serbest top fiziği ──
  // G_ACC: yerçekimi (oyuncular ~1.6x büyütülmüş olsa da topun uçuşu gerçek ölçekte okunur)
  // ROLL_FRIC: yerden pasın sürtünmeli yavaşlaması (m/sn²) → 15 m'lik pas ≈ 1.3 sn
  const G_ACC=9.8, ROLL_FRIC=3.2, TAU=Math.PI*2;
  const own={team:null,i:-1,since:0,dwell:1};   // top sahibi (team null = sahipsiz)
  const bvel=new THREE.Vector3();                // serbest topun hızı (y dikey)
  const curl={x:0,z:0,t:0};                      // falso: kısa süreli yanal ivme
  let freeBall=false;                            // top ayaktan koptu, fizikle ilerliyor
  const rcv={team:null,i:-1,x:0,z:0,t:0};        // pas alıcısı, buluşma noktası, zaman aşımı
  const bt={on:false,x:0,z:0};                   // son ballPos hedefi (dünya)
  const passPt={x:0,z:0};                        // öngörülü hedef (tahsis yok)
  let chaser=null, chaseT=0, postScript=false;
  // ballPos güncelleme aralığı (üstel ortalama, sn): hızlı modda bekleme süreleri kısalır
  let btLast=-1, btEma=0.28, btSeq=0, flSeq=-1;
  let landSoft=false, landStop=false; // havadan pas: inişte yumuşak (kısa yuvarlanma) / santra: inişte dur

  const startFlight=(ex,ez,ey,h,dur,fn,script)=>{
    fl.sx=bpos.x; fl.sy=bpos.y; fl.sz=bpos.z;
    fl.ex=ex; fl.ey=ey; fl.ez=ez; fl.h=h; fl.dur=Math.max(0.05,dur); fl.t=0;
    fl.fn=fn||null; fl.script=!!script; fl.on=true;
  };
  const nextLeg=()=>{
    const l=legs.shift();
    if(l) startFlight(l.x,l.z,l.y,l.h,l.dur,l.fn,true);
  };
  const busy=()=>clk<lockUntil||legs.length>0||(fl.on&&fl.script);
  const onBallTarget=(x,y)=>{
    if(!Number.isFinite(x)||!Number.isFinite(y)) return; // NaN koruması
    pitchToWorld3D(x,y,0,tmpV);
    if(!ballInit){ ballInit=true; bpos.set(tmpV.x,0,tmpV.z); if(!manual){ bt.on=true; bt.x=tmpV.x; bt.z=tmpV.z; } return; }
    if(manual) return;
    bt.on=true; bt.x=tmpV.x; bt.z=tmpV.z; btSeq++;
    if(btLast>=0){ const g=clk-btLast; if(g>0&&g<2) btEma+=(g-btEma)*0.3; }
    btLast=clk;
    if(busy()){ pend.on=true; pend.x=tmpV.x; pend.z=tmpV.z; }
  };
  const ownerP=()=>own.team?(teams[own.team][own.i]||null):null;
  const setOwnerInternal=(team,i)=>{
    // Bekleme (pas öncesi en az sahiplik) ballPos sıklığıyla ölçeklenir: normal ~0.5–1.1 sn
    own.team=team; own.i=i; own.since=clk; own.dwell=(0.5+Math.random()*0.6)*clamp(btEma/0.28,0.3,1);
    freeBall=false; bvel.set(0,0,0); curl.t=0; rcv.team=null; chaser=null;
  };
  const kickBall=(vx,vy,vz,cx,cz)=>{
    if(disposed||!Number.isFinite(vx)||!Number.isFinite(vy)||!Number.isFinite(vz)) return;
    own.team=null; freeBall=true; rcv.team=null; landSoft=false; landStop=false;
    legs.length=0; fl.on=false; fl.fn=null;
    bvel.set(vx,vy,vz);
    curl.x=Number.isFinite(cx)?cx:0; curl.z=Number.isFinite(cz)?cz:0;
    curl.t=(curl.x||curl.z)?1.4:0;
    if(bpos.y<0||(vy<=0&&bpos.y<0.01)) bpos.y=0;
  };
  // Uçuş süresi tahmini: yerden (sürtünmeli, alıcıya ~6 m/sn ile varır) / havadan (parabol)
  const PASS_VEND=6;
  // Tempo çarpanı: hızlı modda (ballPos sık değişir) koşu ve pas hızları artar (normal: 1)
  const tempo=()=>manual?1:clamp(0.28/btEma,1,2.2);
  const passTime=(d,lofted)=>{
    if(lofted) return Math.max(0.7,clamp(0.6+d*0.025,0.8,2.0)/Math.min(1.5,tempo())); // havadan: makul hız
    const vEnd=PASS_VEND*tempo(), v0=Math.min(30,Math.sqrt(vEnd*vEnd+2*ROLL_FRIC*d));
    const disc=v0*v0-2*ROLL_FRIC*d;
    return disc>0?(v0-Math.sqrt(disc))/ROLL_FRIC:v0/ROLL_FRIC;
  };
  // (px,pz) noktasına vuruş → uçuş süresi
  const kickTo=(px,pz,lofted)=>{
    if(disposed||!Number.isFinite(px)||!Number.isFinite(pz)) return 0;
    const dx=px-bpos.x, dz=pz-bpos.z, d=Math.hypot(dx,dz);
    if(d<0.3){ kickBall(0,0,0); return 0.1; }
    const ux=dx/d, uz=dz/d, T=passTime(d,lofted);
    if(lofted){ const vh=d/T; kickBall(ux*vh,G_ACC*T/2,uz*vh); landSoft=true; return T; }
    const ve=PASS_VEND*tempo(), v0=Math.min(30,Math.sqrt(ve*ve+2*ROLL_FRIC*d));
    kickBall(ux*v0,0,uz*v0);
    return T;
  };
  // Alıcının anlık hızına göre öngörülü buluşma noktası (iki yineleme)
  const leadPoint=(p,lofted,out)=>{
    let tx=p.pos.x, tz=p.pos.z;
    for(let k=0;k<2;k++){
      const lt=Math.min(1.5,passTime(Math.hypot(tx-bpos.x,tz-bpos.z),lofted));
      tx=p.pos.x+p.vx*lt; tz=p.pos.z+p.vz*lt;
    }
    out.x=clamp(tx,-L+1,L-1); out.z=clamp(tz,-H+1,H-1);
  };
  // (kare döngüsünde closure tahsisi olmasın diye açık döngüler)
  let nearBest=null, nearD=1e9;
  const nearestTo=(x,z,excl)=>{
    nearBest=null; nearD=1e9;
    for(let t=0;t<2;t++){
      const list=t===0?teams.home:teams.away;
      for(let i=0;i<list.length;i++){
        const p=list[i]; if(!p.g.visible||p===excl) continue;
        const d=Math.hypot(p.pos.x-x,p.pos.z-z);
        if(d<nearD){ nearD=d; nearBest=p; }
      }
    }
    return nearBest;
  };
  // Pas yolunda (ilk/son %15 hariç) 2 m içinde rakip var mı?
  let laneHit=false;
  const laneBlocked=(team,ax,az,bx,bz)=>{
    const dx=bx-ax, dz=bz-az, l2=dx*dx+dz*dz; laneHit=false;
    if(l2<1) return false;
    const list=teams[team==="home"?"away":"home"];
    for(let i=0;i<list.length&&!laneHit;i++){
      const o=list[i]; if(!o.g.visible) continue;
      const u=((o.pos.x-ax)*dx+(o.pos.z-az)*dz)/l2;
      if(u<0.15||u>0.85) continue;
      if(Math.hypot(o.pos.x-(ax+dx*u),o.pos.z-(az+dz*u))<2) laneHit=true;
    }
    return laneHit;
  };
  const setRcv=(p,x,z,T)=>{ rcv.team=p.team; rcv.i=p.idx; rcv.x=x; rcv.z=z; rcv.t=clk+T+2.5; };
  // Sahiplik değişimi: o → q (aynı takım pas, rakip top kaybı/kesme)
  const autoPass=(o,q)=>{
    if(q.team===o.team){
      // Alıcı ballPos noktasına pasın varışından kısa sürede yetişebiliyorsa pas oraya
      // (top hedefini izler), değilse alıcının hareketine göre öngörülü nokta
      const dB=Math.hypot(bt.x-bpos.x,bt.z-bpos.z), lB=dB>22;
      if(Math.hypot(bt.x-q.pos.x,bt.z-q.pos.z)/8<passTime(dB,lB)+0.4){
        const T=kickTo(bt.x,bt.z,lB||laneBlocked(o.team,bpos.x,bpos.z,bt.x,bt.z));
        setRcv(q,bt.x,bt.z,T); return;
      }
      leadPoint(q,false,passPt);
      const d=Math.hypot(passPt.x-bpos.x,passPt.z-bpos.z);
      const lofted=d>22||laneBlocked(o.team,bpos.x,bpos.z,passPt.x,passPt.z);
      if(lofted) leadPoint(q,true,passPt);
      const T=kickTo(passPt.x,passPt.z,lofted);
      setRcv(q,passPt.x,passPt.z,T);
      return;
    }
    const dq=Math.hypot(q.pos.x-o.pos.x,q.pos.z-o.pos.z);
    if(dq<3.5){ // yakın rakip topu kaptı: kısa sekme
      const T=kickTo(q.pos.x,q.pos.z,false); setRcv(q,q.pos.x,q.pos.z,T); return;
    }
    // Kesilen pas: top boşluğa (ballPos) gider, rakip pas çizgisine girer
    const ax=bt.x, az=bt.z, d=Math.hypot(ax-bpos.x,az-bpos.z), lofted=d>22;
    let mx=ax, mz=az;
    if(!lofted&&d>0.1){
      const ux=(ax-bpos.x)/d, uz=(az-bpos.z)/d;
      const u=clamp((q.pos.x-bpos.x)*ux+(q.pos.z-bpos.z)*uz,2,d);
      mx=bpos.x+ux*u; mz=bpos.z+uz*u;
    }
    const sx=bpos.x, sz=bpos.z, T=kickTo(ax,az,lofted);
    // Buluşma süresi: topun izdüşüm noktasına varışı (kabaca)
    setRcv(q,mx,mz,lofted?T:T*Math.min(1,Math.hypot(mx-sx,mz-sz)/Math.max(1,d)));
  };
  const clearOverrides=()=>{
    for(let t=0;t<2;t++){ const list=t===0?teams.home:teams.away; for(let i=0;i<list.length;i++){ list[i].ovr=false; list[i].cap=0; } }
  };
  // Normal akışın sahiplik mantığı (her kare, oyuncu hareketinden ÖNCE)
  const autoPossess=()=>{
    if(busy()){
      own.team=null; freeBall=false; rcv.team=null; postScript=true; return;
    }
    if(postScript){
      postScript=false;
      // Senaryo bitti: ballPos çok uzaktaysa (gol → santra, aut → kale vuruşu) uzun top
      if(pend.on){
        pend.on=false;
        if(Math.hypot(pend.x-bpos.x,pend.z-bpos.z)>15){
          const q=nearestTo(pend.x,pend.z,null);
          if(q){
            const center=Math.abs(pend.x)<2&&Math.abs(pend.z)<2; // santra: tam orta noktaya
            const tx=center?0:pend.x, tz=center?0:pend.z;
            const T=kickTo(tx,tz,true); setRcv(q,tx,tz,T+0.8);
            if(center){ landStop=true; bt.x=0; bt.z=0; }
          }
          return;
        }
      }
    }
    const o=ownerP();
    if(o){
      if(!o.g.visible){ own.team=null; return; }
      const tp=tempo();
      o.ovr=true; o.cap=8*tp;                // top sürerken azami ~8 m/sn (hedef uzaksa 9.5) × tempo
      if(bt.on){
        const d=Math.hypot(bt.x-o.pos.x,bt.z-o.pos.z);
        if(d<1.6){ // hedefe vardı: topu hafif hareketle korur
          o.ox=bt.x+Math.sin(clk*1.3+o.idx)*0.5; o.oz=bt.z+Math.cos(clk*1.1+o.idx)*0.5;
        } else { o.ox=bt.x; o.oz=bt.z; if(d>3) o.cap=9.5*tp; }
        // Sahiplik değişimi: bekleme dolduysa ve hedefe başkası belirgin yakınsa;
        // sapma 10 m'yi aşarsa bekleme beklenmez (top ballPos'tan kopmasın)
        if((clk-own.since>own.dwell&&d>5)||d>10){
          const q=nearestTo(bt.x,bt.z,o);
          if(q&&nearD<d-1) autoPass(o,q);
        }
      } else { o.ox=o.pos.x; o.oz=o.pos.z; }
      return;
    }
    if(freeBall&&rcv.team){
      const r=teams[rcv.team][rcv.i];
      if(r&&r.g.visible&&clk<rcv.t){
        r.ovr=true; r.cap=8.5*tempo();
        const db=Math.hypot(bpos.x-r.pos.x,bpos.z-r.pos.z);
        // Buluşma noktasına koş; top yakına gelince doğrudan topa
        if(db<4&&bpos.y<1.2){ r.ox=bpos.x; r.oz=bpos.z; } else { r.ox=rcv.x; r.oz=rcv.z; }
        if(db<1.15&&bpos.y<1.7) setOwnerInternal(r.team,r.idx);
        return;
      }
      rcv.team=null;
    }
    // Sahipsiz top: en yakın oyuncu topa koşar (0.3 sn'de bir yeniden seçilir)
    if(!chaser||clk>chaseT||!chaser.g.visible){ chaser=nearestTo(bpos.x,bpos.z,null); chaseT=clk+0.3; }
    if(!chaser){
      // Kadro yok (oyuncu görünmüyor): top eski mantıkla ballPos'a uçar
      if(bt.on&&btSeq!==flSeq&&!fl.on){
        flSeq=btSeq;
        const d=Math.hypot(bt.x-bpos.x,bt.z-bpos.z);
        if(d>0.05) startFlight(bt.x,bt.z,0,d>15?Math.min(8,d*0.12):d>8?d*0.03:0,Math.min(1.0,0.22+d*0.012),null,false);
      }
      return;
    }
    {
      chaser.ovr=true; chaser.cap=8.5*tempo(); chaser.ox=bpos.x; chaser.oz=bpos.z;
      if(Math.hypot(bpos.x-chaser.pos.x,bpos.z-chaser.pos.z)<1.15&&bpos.y<1.7&&Math.hypot(bvel.x,bvel.z)<10)
        setOwnerInternal(chaser.team,chaser.idx);
    }
  };
  // Senaryo başlat: mevcut uçuşu kes, sahipliği askıya al, kilitle
  const beginScript=(lockSec)=>{
    legs.length=0; fl.on=false; fl.fn=null;
    own.team=null; freeBall=false; bvel.set(0,0,0); curl.t=0; rcv.team=null;
    lockUntil=clk+lockSec;
  };
  const leg=(x,z,y,h,dur,fn)=>legs.push({x,z,y,h,dur,fn:fn||null});
  // Olay noktasına ilk bacak (mesafeye göre yay)
  const legToZone=(wx,wz)=>{
    const d=Math.hypot(wx-bpos.x,wz-bpos.z);
    leg(wx,wz,0,Math.min(6,d*0.1),Math.min(0.55,0.15+d*0.01));
  };

  // ── Efektler ──
  const fxList=[]; // {obj,t,dur,step(k,dt),own:[geo/mat]}
  const addFx=(obj,dur,step,own)=>{ fxRoot.add(obj); fxList.push({obj,t:0,dur,step,own}); };
  const killFx=(f)=>{
    if(f.obj.parent) f.obj.parent.remove(f.obj);
    f.own.forEach(r=>{try{r.dispose();}catch(e){}});
  };
  const spawnRing=(x,y,z,color,dur,maxS)=>{
    const m=new THREE.MeshBasicMaterial({color,transparent:true,opacity:0.9,depthWrite:false,side:THREE.DoubleSide});
    const r=new THREE.Mesh(ringGeo,m); r.position.set(x,y,z); r.renderOrder=2;
    addFx(r,dur,(k)=>{ const s=1+k*(maxS-1); r.scale.set(s,1,s); m.opacity=0.9*(1-k); },[m]);
  };
  const spawnBurst=(x,y,z,color,n)=>{
    const pos=new Float32Array(n*3), vel=new Float32Array(n*3);
    for(let i=0;i<n;i++){
      pos[i*3]=x; pos[i*3+1]=y; pos[i*3+2]=z;
      const a=Math.random()*Math.PI*2, sp=3+Math.random()*6;
      vel[i*3]=Math.cos(a)*sp; vel[i*3+1]=4+Math.random()*7; vel[i*3+2]=Math.sin(a)*sp;
    }
    const geo=new THREE.BufferGeometry();
    const attr=new THREE.BufferAttribute(pos,3); geo.setAttribute("position",attr);
    const m=new THREE.PointsMaterial({color,size:0.6,transparent:true,opacity:1,depthWrite:false});
    const pts=new THREE.Points(geo,m); pts.frustumCulled=false;
    addFx(pts,1.6,(k,dt)=>{
      for(let i=0;i<n;i++){
        const j=i*3;
        vel[j+1]-=12*dt;
        pos[j]+=vel[j]*dt; pos[j+1]+=vel[j+1]*dt; pos[j+2]+=vel[j+2]*dt;
        if(pos[j+1]<0.05){ pos[j+1]=0.05; vel[j+1]*=-0.3; vel[j]*=0.7; vel[j+2]*=0.7; }
      }
      attr.needsUpdate=true;
      m.opacity=1-k*k;
    },[geo,m]);
  };
  const cardTexCache={};
  const cardTex=(color)=>{
    if(cardTexCache[color]) return cardTexCache[color];
    const cv=document.createElement("canvas"); cv.width=48; cv.height=64;
    const ctx=cv.getContext("2d");
    if(ctx){
      ctx.fillStyle="#ffffff"; ctx.fillRect(4,2,40,60);
      ctx.fillStyle=color; ctx.fillRect(7,5,34,54);
    }
    const tex=new THREE.CanvasTexture(cv); tex.minFilter=THREE.LinearFilter; tex.generateMipmaps=false;
    owned.texs.push(tex);
    cardTexCache[color]=tex;
    return tex;
  };
  const spawnCard=(x,z,color)=>{
    const m=new THREE.SpriteMaterial({map:cardTex(color),transparent:true,depthWrite:false});
    const s=new THREE.Sprite(m); s.scale.set(1.3,1.75,1); s.position.set(x,3.4,z); s.renderOrder=6;
    addFx(s,1.5,(k)=>{
      s.position.y=3.4+k*3;
      m.opacity=k<0.6?1:1-(k-0.6)/0.4;
      m.rotation=Math.sin(k*7)*0.15;
    },[m]); // doku paylaşılan (cardTexCache), burada dispose edilmez
  };

  // ── File sallanması: kale çizgisi sabit kalacak şekilde X'te ölçekle ──
  const nets={};
  const findNet=(name)=>{const g=api.groups.pitch&&api.groups.pitch.getObjectByName(name);return g?g.getObjectByName("net"):null;};
  nets[1]={obj:findNet("goalAway"),t:-1};
  nets[-1]={obj:findNet("goalHome"),t:-1};
  const shakeNet=(s)=>{ const n=nets[s]; if(n&&n.obj) n.t=0; };
  const resetNet=(s)=>{ const n=nets[s]; if(n&&n.obj){ n.obj.scale.x=1; n.obj.position.x=0; n.obj.scale.y=1; n.t=-1; } };
  const updateNets=(dt)=>{
    for(let s=-1;s<=1;s+=2){
      const n=nets[s]; if(!n.obj||n.t<0) continue;
      n.t+=dt;
      if(n.t>1.4){ resetNet(s); continue; }
      const amp=0.6*Math.exp(-n.t*2.6)*(0.6+0.4*Math.sin(n.t*22));
      const sc=1+amp, x0=s*L;
      n.obj.scale.x=sc; n.obj.position.x=x0*(1-sc);
      n.obj.scale.y=1+amp*0.08;
    }
  };

  // ── Olay → efekt ──
  const triggerEvent=(ev)=>{
    if(disposed||!ev||!Number.isFinite(ev.x)||!Number.isFinite(ev.y)) return;
    const W=pitchToWorld3D(ev.x,ev.y);
    const opp=ev.team==="opp";
    const teamCol=opp?COL.away:COL.home;
    const zoneSide=ev.x>=50?1:-1;           // gol/kaçan/kurtarış: zone hangi kaleye yakınsa
    const atkSide=opp?-1:1;                  // diğerleri: hücum eden takımın hedef kalesi
    const rz=(a)=>(Math.random()*2-1)*a;
    switch(ev.type){
      case "goal":{
        const s=zoneSide, gz=clamp(W.z*0.25,-GW+0.6,GW-0.6);
        beginScript(2.0);
        legToZone(W.x,W.z);
        leg(s*(L+1.2),gz,0.9,1.0,0.45,()=>{
          shakeNet(s);
          spawnRing(s*(L-1.5),0.06,gz,teamCol,1.3,9);
          spawnBurst(s*(L-0.5),1.6,gz,teamCol,46);
          if(api.closeUp) api.closeUp(s*(L-3),gz,1.9);
        });
        leg(s*(L+1.5),gz,0,0.1,0.25);
        break;
      }
      case "miss": case "header":{
        const s=ev.type==="miss"?zoneSide:atkSide;
        if(Math.abs(W.x-s*L)>45) break;
        const zs=W.z>=0?1:-1, wz=zs*(GW+1+Math.random()*2.5);
        const high=ev.type==="header";
        beginScript(1.6);
        legToZone(W.x,W.z);
        leg(s*(L+2.5),high?rz(GW):wz,high?3.4:0.4,1.6,0.55);
        leg(s*(L+1),high?rz(GW):wz,0,0.5,0.35);
        break;
      }
      case "save": case "keeper": case "chance":{
        // keeper: olayın takımının KALECİSİ kurtarır → team "me" bizim kale (−1),
        // team "opp" rakip kale (+1). chance: hücum edenin hedef kalesi.
        const s=ev.type==="save"?zoneSide:ev.type==="keeper"?-atkSide:atkSide;
        if(Math.abs(W.x-s*L)>45) break;
        const gz=clamp(W.z*0.3,-3,3);
        beginScript(1.7);
        legToZone(W.x,W.z);
        leg(s*(L-0.9),gz,1.1,0.6,0.4,()=>spawnRing(s*(L-0.9),0.06,gz,0xffffff,0.6,3));
        leg(s*(L-8),clamp(gz+rz(7),-(H-2),H-2),0,2.2,0.6);
        break;
      }
      case "crossbar":{
        const s=atkSide;
        if(Math.abs(W.x-s*L)>45) break;
        const gz=rz(GW-0.8);
        beginScript(1.8);
        legToZone(W.x,W.z);
        leg(s*(L-0.2),gz,D.goalHeight-BR,0.8,0.45,()=>shakeNet(s));
        leg(s*(L-12),clamp(gz+rz(8),-(H-2),H-2),0,3,0.7);
        break;
      }
      case "corner":{
        const s=atkSide, zs=W.z>=0?1:-1;
        const fx=s*(L-0.7), fz=zs*(H-0.7);
        beginScript(1.3);
        const d=Math.hypot(fx-bpos.x,fz-bpos.z);
        leg(fx,fz,0,Math.min(5,d*0.06),Math.min(0.8,0.25+d*0.008),()=>spawnRing(fx,0.06,fz,teamCol,0.9,4));
        break;
      }
      case "yellow":
        spawnCard(W.x,W.z,COL.yellowCard); break;
      case "red": case "tackle_red": case "yellow2red":
        spawnCard(W.x,W.z,COL.redCard); break;
      default: break; // bilinmeyen tip → sessizce geç
    }
  };

  // ── Kilit an sahnesi (moment3d.js) için doğrudan denetim — DÜNYA koordinatı ──
  // Not: snapshot dizileri değişmedikçe applyDots bu hedefleri ezmez.
  const teamList=(team)=>teams[team==="away"?"away":"home"];
  const movePlayer=(team,i,wx,wz,instant)=>{
    const p=teamList(team)[i];
    if(disposed||!p||!Number.isFinite(wx)||!Number.isFinite(wz)) return;
    p.tgt.set(wx,0,wz); p.driven=false;
    if(instant){ p.pos.copy(p.tgt); p.lx=p.pos.x; p.lz=p.pos.z; p.g.position.set(p.pos.x,0,p.pos.z); }
  };
  // Konumu doğrudan sür (kilit an denetleyicisi kendi hız/ivme modelini uygular);
  // koşu sallanması ve yön, karedeki yer değiştirmeden hesaplanır.
  const drivePlayer=(team,i,wx,wz)=>{
    const p=teamList(team)[i];
    if(disposed||!p||!Number.isFinite(wx)||!Number.isFinite(wz)) return;
    if(!p.driven){ p.lx=p.pos.x; p.lz=p.pos.z; }
    p.driven=true; p.pos.x=wx; p.pos.z=wz; p.tgt.set(wx,0,wz);
  };
  const getPlayerPos=(team,i)=>{ const p=teamList(team)[i]; return p?p.pos:null; }; // salt okunur
  const getPlayer=(team,i)=>teamList(team)[i]||null;                                  // salt okunur
  // Topu doğrudan bir noktaya koy: uçuşu, kilidi ve sahipliği iptal eder
  const setBall=(wx,wz,y)=>{
    if(disposed||!Number.isFinite(wx)||!Number.isFinite(wz)) return;
    legs.length=0; fl.on=false; fl.fn=null; fl.script=false; lockUntil=0; pend.on=false;
    own.team=null; freeBall=false; bvel.set(0,0,0); curl.t=0; rcv.team=null;
    ballInit=true; bpos.set(wx,Number.isFinite(y)?Math.max(0,y):0,wz);
  };
  // Topu bir oyuncunun ayağına bağla (null → sahipsiz bırak)
  const setOwner=(team,i)=>{
    if(disposed) return;
    if(team==null){ own.team=null; return; }
    const p=teamList(team)[i]; if(!p) return;
    legs.length=0; fl.on=false; fl.fn=null; lockUntil=0;
    setOwnerInternal(team==="away"?"away":"home",i);
  };
  const getOwner=()=>own.team?own:null;   // salt okunur {team,i}
  // Kısa süreli duruş: "slide" (kayarak müdahale) | "fall" (yere düşme)
  const poseFx=(team,i,kind,sec)=>{
    const p=teamList(team)[i]; if(!p||disposed) return;
    p.pose=kind||null; p.poseT=clk+(Number.isFinite(sec)?sec:0.6);
  };
  // Senaryo bacakları: [{x,z,y,h,dur,fn}] — fn, bacak bitince çağrılır (zincirleme)
  const playBallScript=(list,lockSec)=>{
    if(disposed||!list||!list.length) return;
    beginScript(lockSec||0);
    for(let i=0;i<list.length;i++){
      const l=list[i];
      if(!l||!Number.isFinite(l.x)||!Number.isFinite(l.z)) continue;
      leg(l.x,l.z,Number.isFinite(l.y)?l.y:0,Number.isFinite(l.h)?l.h:0,Number.isFinite(l.dur)?l.dur:0.4,l.fn);
    }
  };
  const goalFx=(s,gz,team)=>{
    if(disposed) return;
    const col=team==="away"?COL.away:COL.home;
    shakeNet(s);
    spawnRing(s*(L-1.5),0.06,gz,col,1.3,9);
    spawnBurst(s*(L-0.5),1.6,gz,col,46);
  };
  const ringFx=(x,z,color,dur,maxS)=>{ if(!disposed) spawnRing(x,0.06,z,color,dur||0.8,maxS||4); };
  const shakeGoal=(s)=>{ if(!disposed) shakeNet(s); };
  const getBall=()=>bpos; // salt okunur

  const resetKickoff=()=>{
    if(disposed) return;
    legs.length=0; fl.on=false; fl.fn=null; fl.script=false; lockUntil=0; pend.on=false;
    // Santra: top havadan orta noktaya, merkeze en yakın oyuncunun ayağına
    const q=nearestTo(0,0,null);
    const T=kickTo(0,0,true);
    landStop=true; bt.on=true; bt.x=0; bt.z=0; // top orta noktada durur, merkezdeki oyuncu alır
    if(q) setRcv(q,0,0,T+0.8);
  };

  // ── Snapshot işleme (referans karşılaştırması) ──
  const seen=new Set();
  let last={my:null,opp:null,ball:null,events:null,labels:null}, firstSnap=true;
  const update=(snap)=>{
    if(disposed||!snap) return;
    if(snap.my!==last.my){ last.my=snap.my; applyDots("home",snap.my); }
    if(snap.opp!==last.opp){ last.opp=snap.opp; applyDots("away",snap.opp); }
    if(snap.labels!==last.labels||firstSnap){ last.labels=snap.labels; applyLabels(snap.labels); }
    if(snap.events!==last.events){
      last.events=snap.events;
      const evs=snap.events||[];
      for(let i=0;i<evs.length;i++){
        const ev=evs[i]; if(!ev||seen.has(ev.id)) continue;
        seen.add(ev.id);
        // 3D açıldığında ekranda zaten olan eski olayları yeniden oynatma
        if(!firstSnap) triggerEvent(ev);
      }
    }
    // Olaylardan SONRA: aynı karede gelen ballPos senaryo kilidine takılır
    if(snap.ball!==last.ball&&snap.ball){ last.ball=snap.ball; onBallTarget(snap.ball[0],snap.ball[1]); }
    firstSnap=false;
  };

  // ── Kare güncellemesi ──
  const wrapPi=(a)=>{ while(a>Math.PI) a-=Math.PI*2; while(a<-Math.PI) a+=Math.PI*2; return a; };
  const MAX_RUN=14; // m/s — gol sonrası santra dönüşünde ışınlanma yerine koşu
  const updatePlayers=(dt)=>{
    // kOvr: topa bağlı görevdeki (sahip/alıcı/kovalayan) oyuncu hedefe daha kararlı yaklaşır
    const kPos=1-Math.exp(-dt*5), kOvr=1-Math.exp(-dt*10), kYaw=Math.min(1,dt*6), kSp=Math.min(1,dt*8), kV=Math.min(1,dt*6);
    for(let t=0;t<2;t++){
      const list=t===0?teams.home:teams.away;
      for(let i=0;i<list.length;i++){
        const p=list[i]; if(!p.g.visible) continue;
        let dx, dz;
        if(p.driven){
          // Konum dışarıdan sürülüyor: yalnızca karedeki yer değiştirmeyi ölç
          dx=p.pos.x-p.lx; dz=p.pos.z-p.lz;
        } else {
          const tx=p.ovr?p.ox:p.tgt.x, tz=p.ovr?p.oz:p.tgt.z;
          const kp=p.ovr&&p.cap>0?kOvr:kPos;
          dx=(tx-p.pos.x)*kp; dz=(tz-p.pos.z)*kp;
          const step=Math.hypot(dx,dz), maxStep=(p.cap>0?p.cap:MAX_RUN)*dt;
          if(step>maxStep){ dx*=maxStep/step; dz*=maxStep/step; }
          p.pos.x+=dx; p.pos.z+=dz;
        }
        p.lx=p.pos.x; p.lz=p.pos.z;
        const sp=dt>0?Math.hypot(dx,dz)/dt:0;
        if(dt>0){ p.vx+=(dx/dt-p.vx)*kV; p.vz+=(dz/dt-p.vz)*kV; }
        p.speed+=(sp-p.speed)*kSp;
        // Koşarken hareket yönüne, dururken topa dön
        const want=p.speed>0.6?Math.atan2(dx,dz):Math.atan2(bpos.x-p.pos.x,bpos.z-p.pos.z);
        p.yaw+=wrapPi(want-p.yaw)*kYaw;
        p.g.position.set(p.pos.x,0,p.pos.z);
        p.g.rotation.y=p.yaw;
        const a=Math.min(1,p.speed/3);
        p.phase+=dt*(5+p.speed*1.2);
        if(p.pose&&clk<p.poseT){
          // Kayarak müdahale: geriye yatık ve alçak · düşme: yana devrik
          if(p.pose==="slide"){ p.body.position.y=-0.55; p.body.rotation.x=-1.05; p.body.rotation.z=0; }
          else { p.body.position.y=-0.2; p.body.rotation.x=0.2; p.body.rotation.z=1.3; }
          continue;
        }
        p.pose=null;
        p.body.position.y=Math.abs(Math.sin(p.phase))*0.14*a;
        p.body.rotation.z=Math.sin(p.phase)*0.07*a;
        p.body.rotation.x=0.12*a;
      }
    }
  };
  // Serbest top: yerçekimi, sekme, yuvarlanma sürtünmesi, kısa süreli falso
  const integrateBall=(dt)=>{
    if(curl.t>0){ bvel.x+=curl.x*dt; bvel.z+=curl.z*dt; curl.t-=dt; }
    if(bpos.y>0.001||bvel.y>0) bvel.y-=G_ACC*dt;
    bpos.x+=bvel.x*dt; bpos.y+=bvel.y*dt; bpos.z+=bvel.z*dt;
    // Yerde kabul eşiği: sürmeden kalan çok küçük yükseklik topu "havada" bırakıp sürtünmesiz yuvarlamasın
    if(bpos.y<=0||(bpos.y<0.01&&bvel.y<=0)){
      bpos.y=0;
      if(landStop){ bvel.set(0,0,0); landStop=false; landSoft=false; freeBall=false; } // santra: orta noktada dur
      else if(landSoft){ bvel.y=-bvel.y*0.2; bvel.x*=0.3; bvel.z*=0.3; landSoft=false; } // havadan pas: kısa yuvarlanma
      else if(bvel.y<-2.2){ bvel.y=-bvel.y*0.38; bvel.x*=0.72; bvel.z*=0.72; } // sekme
      else bvel.y=0;
    }
    if(bpos.y===0&&bvel.y===0){
      const sp=Math.hypot(bvel.x,bvel.z);
      if(sp>0){
        const ns=Math.max(0,sp-ROLL_FRIC*dt);
        bvel.x*=ns/sp; bvel.z*=ns/sp;
        if(ns===0) freeBall=false;
      } else freeBall=false;
    }
    if(Math.abs(bpos.x)>L+4||Math.abs(bpos.z)>H+4){ // saha dışı: dur
      bpos.x=clamp(bpos.x,-L-4,L+4); bpos.z=clamp(bpos.z,-H-4,H+4); bvel.set(0,0,0); freeBall=false;
    }
    if(!Number.isFinite(bpos.x)||!Number.isFinite(bpos.y)||!Number.isFinite(bpos.z)){ // NaN koruması
      bpos.set(0,0,0); bvel.set(0,0,0); freeBall=false;
    }
  };
  const updateBall=(dt)=>{
    const px=bpos.x, pz=bpos.z;
    const o=fl.on||legs.length?null:ownerP();
    if(fl.on){
      fl.t+=dt;
      const u=Math.min(1,fl.t/fl.dur);
      bpos.x=fl.sx+(fl.ex-fl.sx)*u;
      bpos.z=fl.sz+(fl.ez-fl.sz)*u;
      bpos.y=Math.max(0,fl.sy+(fl.ey-fl.sy)*u+4*fl.h*u*(1-u));
      if(u>=1){
        fl.on=false;
        const fn=fl.fn; fl.fn=null;
        if(fn){ try{fn();}catch(e){console.error("[3D] efekt hatası",e);} }
        if(!fl.on) nextLeg();
      }
    } else if(legs.length) nextLeg();
    else if(o&&o.g.visible){
      // Sürme: top ayağın önünde; her iki adımda bir dokunuşla öne itilir, oyuncu yetişir.
      // Hedef nokta yön (yaw) ile döner; top ona yumuşakça uyar → sert dönüşte bir an geride kalır.
      const run=Math.min(1,o.speed/3);
      const k=(((o.phase%TAU)+TAU)%TAU)/TAU;
      const touch=k<0.15?k/0.15:1-(k-0.15)/0.85;
      // Hedef (ballPos) uzaktaysa uzun dokunuş: top koşu yönünde biraz daha önde (en çok +2.4 m)
      const lead=(!manual&&bt.on)?Math.min(2.4,0.5*Math.hypot(bt.x-o.pos.x,bt.z-o.pos.z))*run:0;
      const off=0.8+0.45*run*touch+lead;
      const fx=o.pos.x+Math.sin(o.yaw)*off, fz=o.pos.z+Math.cos(o.yaw)*off;
      const kb=1-Math.exp(-dt*12);
      bpos.x+=(fx-bpos.x)*kb; bpos.z+=(fz-bpos.z)*kb; bpos.y+=(0-bpos.y)*Math.min(1,kb*2);
      if(dt>0){ bvel.x=(bpos.x-px)/dt; bvel.z=(bpos.z-pz)/dt; bvel.y=0; }
    } else if(freeBall) integrateBall(dt);
    ball.position.set(bpos.x,BR+bpos.y,bpos.z);
    // Dönme: yer değiştirmeyle orantılı (yuvarlanma)
    ball.rotation.z-=(bpos.x-px)/BR;
    ball.rotation.x+=(bpos.z-pz)/BR;
    ballShadow.position.set(bpos.x,0.035,bpos.z);
    const ss=0.55*(1+bpos.y*0.08);
    ballShadow.scale.set(ss,1,ss);
    mats.ballShadow.opacity=0.4/(1+bpos.y*0.3);
  };
  const updateFx=(dt)=>{
    for(let i=fxList.length-1;i>=0;i--){
      const f=fxList[i];
      f.t+=dt;
      const k=Math.min(1,f.t/f.dur);
      try{ f.step(k,dt); }catch(e){ f.t=f.dur; }
      if(f.t>=f.dur){ killFx(f); fxList.splice(i,1); }
    }
  };

  let disposed=false;
  const hook=(dt,t)=>{
    if(disposed) return;
    clk=t;
    if(opts.getSnapshot) update(opts.getSnapshot());
    clearOverrides();
    if(!manual&&dt>0) autoPossess();
    updatePlayers(dt);
    updateBall(dt);
    updateFx(dt);
    updateNets(dt);
    if(api.setFocusWorld) api.setFocusWorld(bpos.x,bpos.z);
  };
  const removeHook=api.addFrameHook(hook);

  let removeDisposeHook=null;
  const dispose=()=>{
    if(disposed) return;
    disposed=true;
    removeHook();
    if(removeDisposeHook) removeDisposeHook();
    fxList.forEach(killFx); fxList.length=0;
    resetNet(1); resetNet(-1);
    [root,ballRoot,fxRoot].forEach(g=>{ if(g.parent) g.parent.remove(g); g.clear(); });
    owned.geos.forEach(g=>{try{g.dispose();}catch(e){}});
    owned.texs.forEach(t=>{try{t.dispose();}catch(e){}});
    owned.mats.forEach(m=>{try{m.dispose();}catch(e){}});
    owned.geos.length=0; owned.texs.length=0; owned.mats.length=0;
    teams.home.length=0; teams.away.length=0; legs.length=0; seen.clear();
    own.team=null; rcv.team=null; chaser=null; nearBest=null; freeBall=false;
  };
  if(api.addDisposeHook) removeDisposeHook=api.addDisposeHook(dispose);

  return {update,triggerEvent,resetKickoff,dispose,
    movePlayer,getPlayerPos,setBall,playBallScript,goalFx,ringFx,shakeGoal,getBall,
    drivePlayer,setOwner,getOwner,kickTo,kickBall,getBallVel:()=>bvel,isBallFree:()=>freeBall,
    getPlayer,poseFx};
}
