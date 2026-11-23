// ═══════════════════════════════════════════════════════════════
// 3D MAÇ — OYUNCULAR, TOP, OYUN AKIŞI VE OLAY EFEKTLERİ (React dışı denetleyici)
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
//   + topa bağlı oyun: drivePlayer(team,i,wx,wz) (konumu doğrudan sür; hız/yön
//   hareketten hesaplanır), setOwner(team,i) / setOwner(null), getOwner() → {team,i}|null,
//   kickTo(wx,wz,lofted,mul?) → uçuş süresi (sn), kickBall(vx,vy,vz,curlX,curlZ),
//   getBallVel(), isBallFree(), getPlayer(team,i), poseFx(team,i,"slide"|"fall",sec)
//   ballR (top yarıçapı, m; kilit an fiziği aynı ölçeği kullanır), setPlayerFade(team,i,alpha)
//   + Adım 6: actionFx(team,i,"kick"|"poke"|"celebrate",{side,power}),
//   diveFx(team,i,wx,wz,height) (kaleci o noktaya doğru yana uçar)
//   (team: "home" | "away") · opts.manual: otomatik oyun kapalı (kilit an sahnesi)
// • OYUNCU MODELİ: rig3d.js (eklemli low-poly: baş, gövde, şort, 2 kol, 2 bacak +
//   diz, krampon). Koşu döngüsü hızla orantılı; duruşta nefes/bekleme salınımı;
//   pas/şutta vuruş, müdahalede ayak uzatma, kalecide yana uçma animasyonu.
//   Gölgeler tek InstancedMesh (güneş yönünde uzatılmış, dalışta gövdeyi izler).
// • OYUN AKIŞI (Adım 6, normal maç): tempo öncekinden ~%40 yavaş.
//   2D ballPos her tick'te ~10 m sıçradığı için doğrudan izlenmez; yumuşatılmış
//   "çapa" (anchor) olarak kullanılır. Topa sahip oyuncu karar verir:
//   – kısa üçgen pas (8–20 m tercih), ileri/boşa pas, kanat değiştirme,
//   – boş alana top sürme: top ayaktan kısa dokunuşlarla (hıza göre) öne itilir,
//   – uzun pas (> ~27 m) ya da önü kapalı yol → parabolik yay (g = 9.8).
//   En yakın 2 takım arkadaşı üçgen kurar, kanat oyuncuları topa sahipken açılır;
//   rakipte en yakın oyuncu kale tarafından baskı yapar, ikincisi açıyı kapatır,
//   yakındaysa ayak uzatıp topu kapabilir. Top çapadan çok uzaklaşırsa uzun topla
//   o bölgeye gidilir (3D, 2D'nin top bölgesinden kopmaz).
// • Olaylar (gol/kaçan şut/kurtarış/direk/korner/kart) tek seferlik senaryo +
//   efekt + tribün coşkusu (api.crowd) tetikler; görülmüş olay id'leri tutulur.
// • Bellek: paylaşılan geometri/malzeme; efektler bitince dispose edilir.
//   api.addDisposeHook ile sahne silinmeden önce kendini temizler.
// • Kare döngüsünde yeni nesne/vektör tahsis edilmez.
// ═══════════════════════════════════════════════════════════════

const ACTORS3D_COLORS={
  home:0x2485ff, homeGK:0xffb020, homeShorts:0xf2f2f2,   // bizim takım (2D ile aynı mavi)
  away:0xd93a3a, awayGK:0xa36bff, awayShorts:0x1b1b24,   // rakip
  skin:0xe0b48c, ball:0xffffff, yellowCard:"#ffd21f", redCard:"#e0262b",
};
// Normal akış tempo sabitleri (m/sn, m/sn²). Önceki sürüm: koşu 14, sürme 8–9.5,
// sürtünme 3.2, pas varış hızı 6 → hepsi ~%40 düşürüldü.
// Normal akış (kuşbakışı canlı maç) %45 yavaş: koşu ve top hızları ×0.55, maç saati de
//   aynı oranda yavaş (overlay.js MATCH3D_TEMPO) → top kaleler arasında pinpon gibi gitmez.
//   Kilit an (manual) kendi sabitleriyle çalışır, etkilenmez.
// Adım 11: canlı akış %35 hızlandırıldı (0.55 × 1.35 ≈ 0.743); maç saati (MATCH3D_TEMPO),
//   koşu/top hızları ve senaryo süreleri hep bu tek orandan türediği için birlikte hızlanır.
const ACTORS3D_SLOW=0.55*1.35;
// Canlı akış pas seçimi (m): bu mesafeye kadar yerden kısa pas, üstü havadan (ağır cezalı) ve
//   PASS_MAX'tan uzağa pas yok → oyuncular en yakın uygun arkadaşla kademeli paslaşır.
const ACTORS3D_PASS_SHORT=22, ACTORS3D_PASS_MAX=32;
const ACTORS3D_PACE={
  slow:0.6*ACTORS3D_SLOW,     // senaryo/olay süreleri bu oranla uzar
  run:8.4*ACTORS3D_SLOW,      // en yüksek koşu (santra dönüşü vb.)
  dribble:4.7*ACTORS3D_SLOW,  // top sürme
  receive:5.8*ACTORS3D_SLOW,  // pas alıcısı
  chase:6.2*ACTORS3D_SLOW,    // sahipsiz topa koşu
  press:5.3*ACTORS3D_SLOW,    // baskı (yaklaşırken), uzaktaysa chase
  support:4.4*ACTORS3D_SLOW,  // üçgen kuran destek oyuncuları
  rollFric:2.6*ACTORS3D_SLOW*ACTORS3D_SLOW, // yerden pasın yavaşlaması (hız ×0.55 → sürtünme ×0.55²)
  passEnd:4.8*ACTORS3D_SLOW,  // yerden pasın alıcıya varış hızı
  loftT:1/ACTORS3D_SLOW,      // havadan pas uçuş süresi çarpanı
  tick:0.47/ACTORS3D_SLOW,    // normal hızda ballPos güncelleme aralığı (sn; tempo() referansı)
};

const ACTORS3D_BALL_CANVAS={cv:null};   // futbol topu dokusu tuvali (bir kez üretilir)
function createMatchActors3D(api,opts={}){
  const noop={update(){},triggerEvent(){},resetKickoff(){},dispose(){},
    movePlayer(){},getPlayerPos(){return null;},setBall(){},playBallScript(){},
    goalFx(){},ringFx(){},shakeGoal(){},getBall(){return null;},
    drivePlayer(){},setOwner(){},getOwner(){return null;},kickTo(){return 0;},kickBall(){},
    getBallVel(){return null;},isBallFree(){return false;},getPlayer(){return null;},poseFx(){},
    actionFx(){},diveFx(){},setPlayerFade(){},ballR:0.42};
  if(!api||!api.THREE||api.isDisposed()) return noop;
  const THREE=api.THREE, D=PITCH3D_DIM, L=D.halfLen, H=D.halfWid, GW=D.goalWidth/2;
  const COL=ACTORS3D_COLORS, PACE=ACTORS3D_PACE, BR=0.42; // top yarıçapı (görünürlük için büyütülmüş)
  const flat=(geo)=>{geo.rotateX(-Math.PI/2);return geo;};
  const owned={geos:[],mats:[],texs:[]}; // denetleyiciye ait paylaşılan kaynaklar
  const G=(g)=>{owned.geos.push(g);return g;};
  const M=(m)=>{owned.mats.push(m);return m;};
  const clamp=(v,a,b)=>v<a?a:v>b?b:v;
  const sgn=(v)=>v>=0?1:-1;
  const manual=!!opts.manual;                   // kilit an: sahipliği dış denetleyici yönetir
  const crowd=api.crowd||null;
  const cheer=(team,level,sec)=>{ if(crowd&&!manual) try{ crowd.excite(team,level,sec); }catch(e){} };
  const cheerAny=(team,level,sec)=>{ if(crowd) try{ crowd.excite(team,level,sec); }catch(e){} };

  // ── Paylaşılan geometri ──
  const kit=createRigKit3D(THREE,COL);
  const shadowGeo=G(flat(new THREE.CircleGeometry(0.85,14)));
  const ballGeo=G(new THREE.SphereGeometry(BR,32,20));   // pürüzsüz top (desen dokuda)
  const ringGeo=G(flat(new THREE.RingGeometry(0.8,1.15,32)));
  const poleGeo=G(new THREE.CylinderGeometry(0.05,0.05,1.8,6)); poleGeo.translate(0,0.9,0);
  const flagGeo=G(new THREE.PlaneGeometry(0.7,0.45)); flagGeo.translate(0.35,1.55,0);

  // ── Paylaşılan malzemeler ──
  const lam=(c)=>M(new THREE.MeshLambertMaterial({color:c}));
  const mats={
    pole:lam(0xeeeeee),
    ball:M(new THREE.MeshPhongMaterial({color:COL.ball,shininess:45,specular:0x444444})),
    flag:M(new THREE.MeshBasicMaterial({color:0xffd23f,side:THREE.DoubleSide})),
    shadow:M(new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:0.32,depthWrite:false})),
    ballShadow:M(new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:0.4,depthWrite:false})),
  };

  const root=new THREE.Group(); root.name="actors";
  const ballRoot=new THREE.Group(); ballRoot.name="ballActor";
  const fxRoot=new THREE.Group(); fxRoot.name="fxActors";
  api.groups.players.add(root); api.groups.ball.add(ballRoot); api.groups.fx.add(fxRoot);

  // Köşe bayrakları
  [[-1,-1],[1,-1],[1,1],[-1,1]].forEach(([sx,sz])=>{
    const p=new THREE.Mesh(poleGeo,mats.pole); p.position.set(sx*L,0,sz*H); root.add(p);
    const f=new THREE.Mesh(flagGeo,mats.flag); f.position.set(sx*L,0,sz*H); f.rotation.y=sx>0?Math.PI:0; root.add(f);
  });

  // ── Oyuncu gölgeleri: tek InstancedMesh (takım başına 15 yuva) ──
  const SH_SLOTS=15;
  const shadows=new THREE.InstancedMesh(shadowGeo,mats.shadow,SH_SLOTS*2);
  shadows.renderOrder=1; shadows.frustumCulled=false; root.add(shadows);
  const shM=new THREE.Matrix4(), shQ=new THREE.Quaternion(), shP=new THREE.Vector3(), shS=new THREE.Vector3();
  const SUN_YAW=Math.atan2(-30,-45);           // güneş (30,80,45) → gölge −X −Z yönüne uzar
  const SUN_OX=-Math.sin(Math.atan2(30,45))*0.55, SUN_OZ=-Math.cos(Math.atan2(30,45))*0.55;
  shQ.setFromAxisAngle(new THREE.Vector3(0,1,0),SUN_YAW);
  shS.set(0,0,0); shP.set(0,-50,0); shM.compose(shP,shQ,shS);
  for(let i=0;i<SH_SLOTS*2;i++) shadows.setMatrixAt(i,shM);

  // ── Oyuncular ──
  // Klasik futbol topu dokusu (CanvasTexture, eşdikdörtgen): kesik ikosahedron — 12 siyah beşgen
  //   (ikosahedron köşeleri) + 20 beyaz altıgen (dodekahedron köşeleri), aralarında dikiş çizgisi.
  //   Her piksel küre yönüne çevrilip en yakın yüz merkezine göre boyanır (Voronoi).
  //   Tuval modül düzeyinde bir kez üretilir (her kilit anda ~13 ms takılma olmasın).
  try{
    let cv=ACTORS3D_BALL_CANVAS.cv;
    if(!cv){
    const TW=512, TH=256; cv=document.createElement("canvas"); cv.width=TW; cv.height=TH;
    const g2=cv.getContext("2d"), img=g2&&g2.createImageData?g2.createImageData(TW,TH):null;
    if(!img) cv=null;
    if(img){
      const PHI=(1+Math.sqrt(5))/2, IP=1/PHI, C=[];
      const push=(x,y,z,pent)=>{ const l=Math.hypot(x,y,z); C.push([x/l,y/l,z/l,pent]); };
      for(const a of [-1,1]) for(const b of [-1,1]){ push(0,a,b*PHI,1); push(a,b*PHI,0,1); push(a*PHI,0,b,1); }
      for(const a of [-1,1]) for(const b of [-1,1]){ for(const c of [-1,1]) push(a,b,c,0); push(0,a*IP,b*PHI,0); push(a*IP,b*PHI,0,0); push(a*PHI,0,b*IP,0); }
      const px=img.data;
      for(let y=0;y<TH;y++){
        const th=(y+0.5)/TH*Math.PI, st=Math.sin(th), ct=Math.cos(th);
        for(let x=0;x<TW;x++){
          const ph=(x+0.5)/TW*Math.PI*2, dx=-Math.cos(ph)*st, dy=ct, dz=Math.sin(ph)*st;
          let b1=-2, b2=-2, k1=0;
          for(let i=0;i<C.length;i++){ const c=C[i], d=c[0]*dx+c[1]*dy+c[2]*dz; if(d>b1){ b2=b1; b1=d; k1=i; } else if(d>b2) b2=d; }
          const seam=Math.acos(Math.min(1,b2))-Math.acos(Math.min(1,b1))<0.035;
          const v=seam?70:C[k1][3]?24:246, j=(y*TW+x)*4;
          px[j]=v; px[j+1]=v; px[j+2]=v+(C[k1][3]||seam?0:4); px[j+3]=255;
        }
      }
      g2.putImageData(img,0,0);
      ACTORS3D_BALL_CANVAS.cv=cv;
    }
    }
    if(cv){
      // encoding ayarlanmaz: renderer doğrusal çıktı veriyor (diğer CanvasTexture'larla aynı)
      const tex=new THREE.CanvasTexture(cv); owned.texs.push(tex);
      mats.ball.map=tex; mats.ball.needsUpdate=true;
    }
  }catch(e){ /* doku üretilemedi: düz beyaz top */ }

  const teams={home:[],away:[]};
  const makePlayer=(team,idx)=>{
    const g=new THREE.Group();
    const home=team==="home";
    const rig=kit.build(team,false,idx);
    g.add(rig.body);
    g.visible=false;
    root.add(g);
    // vx/vz: yumuşatılmış hız · ovr/ox/oz/cap: oyun mantığının geçici hedefi ve hız
    // sınırı · driven: konum dışarıdan sürülüyor (kilit an) · face*: kısa süre sabit bakış
    return {g,rig,body:rig.body,team,idx,pos:new THREE.Vector3(),tgt:new THREE.Vector3(),
      yaw:home?Math.PI/2:-Math.PI/2,speed:0,has:false,gk:false,role:"CM",
      vx:0,vz:0,lx:0,lz:0,ovr:false,ox:0,oz:0,cap:0,driven:false,
      faceT:0,faceYaw:0,tackleCd:0,label:null,labelText:null};
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
      const s=new THREE.Sprite(m); s.scale.set(4.4,1.1,1); s.position.y=3.95; s.renderOrder=5;
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
      if(gk!==p.gk){ p.gk=gk; kit.setKit(p.rig,gk); }
      p.role=d.role||"CM";
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

  // ── Top fiziği ──
  // Kilit an (manual) eski sabitlerle çalışır: denge ölçümü (moment3d) bu sürelere göre yapıldı.
  const G_ACC=9.8, TAU=Math.PI*2;
  const ROLL_FRIC=manual?3.2:PACE.rollFric, PASS_VEND=manual?6:PACE.passEnd;
  const own={team:null,i:-1,since:0,dwell:1,decide:0,dribble:false,touchT:0,px:0,pz:0,drN:0,fromT:null,fromI:-1};
  const bvel=new THREE.Vector3();                // serbest topun hızı (y dikey)
  const curl={x:0,z:0,t:0};                      // falso: kısa süreli yanal ivme
  let freeBall=false;                            // top ayaktan koptu, fizikle ilerliyor
  const rcv={team:null,i:-1,x:0,z:0,t:0,tried:0};// pas alıcısı, buluşma noktası, zaman aşımı, kesme denemeleri (bit)
  const bt={on:false,x:0,z:0};                   // son ballPos hedefi (dünya)
  const anc={x:0,z:0,on:false};                  // yumuşatılmış ballPos (çapa)
  const passPt={x:0,z:0};                        // öngörülü hedef (tahsis yok)
  const pk={on:false,t:0,x:0,z:0,lofted:false,team:null,i:-1}; // gecikmeli pas (önce vuruş animasyonu)
  const scr={p:null,x:0,z:0,until:0};            // senaryo oyuncusu (olayda topa koşan)
  let chaser=null, chaseT=0, postScript=false, farT=0;
  // ballPos güncelleme aralığı (üstel ortalama, sn): hızlı modda bekleme süreleri kısalır
  let btLast=-1, btEma=PACE.tick, btSeq=0, flSeq=-1;
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
    if(!ballInit){ ballInit=true; bpos.set(tmpV.x,0,tmpV.z); if(!manual){ bt.on=true; bt.x=tmpV.x; bt.z=tmpV.z; anc.on=true; anc.x=tmpV.x; anc.z=tmpV.z; } return; }
    if(manual) return;
    bt.on=true; bt.x=tmpV.x; bt.z=tmpV.z; btSeq++;
    if(!anc.on){ anc.on=true; anc.x=tmpV.x; anc.z=tmpV.z; }
    if(btLast>=0){ const g=clk-btLast; if(g>0&&g<2) btEma+=(g-btEma)*0.3; }
    btLast=clk;
    if(busy()){ pend.on=true; pend.x=tmpV.x; pend.z=tmpV.z; }
  };
  const ownerP=()=>own.team?(teams[own.team][own.i]||null):null;
  // Tempo çarpanı: hızlı modda (ballPos sık değişir) koşu ve pas hızları artar (normal: 1)
  const tempo=()=>manual?1:clamp(PACE.tick/btEma,1,2.4);
  // Senaryo süresi: yavaş tempo (1/0.6), hızlı modda kısalır
  const sDur=(v)=>v*clamp(1/PACE.slow/tempo(),0.7,1/PACE.slow);
  const setOwnerInternal=(team,i)=>{
    const tp=tempo();
    own.team=team; own.i=i; own.since=clk;
    own.dwell=(0.5+Math.random()*0.6)*clamp(btEma/PACE.tick,0.3,1);
    // İlk dokunuştan sonra karar: kısa (verkaç) ile ~1.3 sn arası
    // Adım 12: topu alır almaz karar (≈0.15–0.45 sn) → bekleme yok, akıcı tek-iki dokunuş paslaşma
    own.decide=clk+(0.15+Math.random()*0.3)/tp;
    own.dribble=false; own.touchT=0; own.drN=0;
    freeBall=false; bvel.set(0,0,0); curl.t=0; rcv.team=null; chaser=null; pk.on=false;
  };
  // Vuran oyuncu: sahip (henüz bırakılmadıysa) ya da topa ≤2.4 m en yakın oyuncu
  const kickerNear=(r)=>{
    const o=ownerP(); if(o&&o.g.visible) return o;
    let best=null, bd=r||2.4;
    for(let t=0;t<2;t++){ const list=t===0?teams.home:teams.away;
      for(let i=0;i<list.length;i++){ const p=list[i]; if(!p.g.visible) continue;
        const d=Math.hypot(p.pos.x-bpos.x,p.pos.z-bpos.z); if(d<bd){ bd=d; best=p; } } }
    return best;
  };
  const faceTo=(p,dx,dz,sec)=>{ if(!p||(!dx&&!dz)) return; p.faceYaw=Math.atan2(dx,dz); p.faceT=clk+(sec||0.4); };
  const kickAnim=(p,vx,vz,power,t0)=>{
    if(!p) return;
    faceTo(p,vx,vz,0.45);
    rigAction3D(p.rig,"kick",{power,t0:t0==null?0.4:t0,side:(p.idx%4===3)?-1:1});
  };
  const kickBall=(vx,vy,vz,cx,cz)=>{
    if(disposed||!Number.isFinite(vx)||!Number.isFinite(vy)||!Number.isFinite(vz)) return;
    const sp=Math.hypot(vx,vy,vz);
    if(sp>1) kickAnim(kickerNear(2.4),vx,vz,clamp(0.35+sp/32,0.35,1),0.4); // top şimdi çıkıyor → vuruş anı
    own.team=null; freeBall=true; rcv.team=null; rcv.tried=0; landSoft=false; landStop=false;
    legs.length=0; fl.on=false; fl.fn=null; pk.on=false;
    bvel.set(vx,vy,vz);
    curl.x=Number.isFinite(cx)?cx:0; curl.z=Number.isFinite(cz)?cz:0;
    curl.t=(curl.x||curl.z)?1.4:0;
    if(bpos.y<0||(vy<=0&&bpos.y<0.01)) bpos.y=0;
  };
  // Uçuş süresi tahmini: yerden (sürtünmeli, alıcıya passEnd ile varır) / havadan (parabol)
  const passTime=(d,lofted)=>{
    if(lofted){
      if(manual) return Math.max(0.7,clamp(0.6+d*0.025,0.8,2.0)); // kilit an: eski süre (denge)
      return clamp(1.05+d*0.034,1.25,2.9)*PACE.loftT/Math.min(1.5,tempo());  // ~35 m → 4 sn (yavaş tempo)
    }
    const vEnd=PASS_VEND*tempo(), v0=Math.min(30,Math.sqrt(vEnd*vEnd+2*ROLL_FRIC*d));
    const disc=v0*v0-2*ROLL_FRIC*d;
    return disc>0?(v0-Math.sqrt(disc))/ROLL_FRIC:v0/ROLL_FRIC;
  };
  // (px,pz) noktasına vuruş → uçuş süresi
  //   mul (isteğe bağlı, >1): pas hızı çarpanı → uçuş süresi T/mul (kilit anda seri, keskin pas)
  const kickTo=(px,pz,lofted,mul)=>{
    if(disposed||!Number.isFinite(px)||!Number.isFinite(pz)) return 0;
    const dx=px-bpos.x, dz=pz-bpos.z, d=Math.hypot(dx,dz);
    if(d<0.3){ kickBall(0,0,0); return 0.1; }
    const k=Number.isFinite(mul)&&mul>1?Math.min(3,mul):1;
    // Havadan pasta çarpanın yalnız karekökü uygulanır ve süre ≥1.05 sn tutulur (tepe ≥1.35 m):
    //   T/mul tepeyi 1/mul² düşürüp topu savunmacının içinden diz hizasında geçirirdi
    const T=lofted?(k>1?Math.max(1.05,passTime(d,true)/Math.sqrt(k)):passTime(d,true)):passTime(d,false)/k;
    const ux=dx/d, uz=dz/d;
    if(lofted){ const vh=d/T; kickBall(ux*vh,G_ACC*T/2,uz*vh); landSoft=true; return T; }
    if(k>1){
      // Aynı mesafeyi T/mul sürede alan yerden pas: v0 = d/T + a·T/2 (a = ROLL_FRIC)
      const v0=Math.min(42,d/T+ROLL_FRIC*T/2);
      kickBall(ux*v0,0,uz*v0);
      return T;
    }
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
  const nearestTo=(x,z,excl,teamOnly,noGk)=>{
    nearBest=null; nearD=1e9;
    for(let t=0;t<2;t++){
      const tk=t===0?"home":"away";
      if(teamOnly&&teamOnly!==tk) continue;
      const list=teams[tk];
      for(let i=0;i<list.length;i++){
        const p=list[i]; if(!p.g.visible||p===excl||(noGk&&p.gk)) continue;
        const d=Math.hypot(p.pos.x-x,p.pos.z-z);
        if(d<nearD){ nearD=d; nearBest=p; }
      }
    }
    return nearBest;
  };
  const otherTeam=(t)=>t==="home"?"away":"home";
  // Pas yolunda (ilk/son %15 hariç) r m içinde rakip var mı?
  let laneHit=false;
  const laneBlocked=(team,ax,az,bx,bz,r)=>{
    const dx=bx-ax, dz=bz-az, l2=dx*dx+dz*dz; laneHit=false;
    if(l2<1) return false;
    const rr=r||2;
    const list=teams[otherTeam(team)];
    for(let i=0;i<list.length&&!laneHit;i++){
      const o=list[i]; if(!o.g.visible) continue;
      const u=((o.pos.x-ax)*dx+(o.pos.z-az)*dz)/l2;
      if(u<0.15||u>0.85) continue;
      if(Math.hypot(o.pos.x-(ax+dx*u),o.pos.z-(az+dz*u))<rr) laneHit=true;
    }
    return laneHit;
  };
  const setRcv=(p,x,z,T)=>{ rcv.team=p.team; rcv.i=p.idx; rcv.x=x; rcv.z=z; rcv.t=clk+T+2.5; rcv.tried=0; };
  const clearOverrides=()=>{
    for(let t=0;t<2;t++){ const list=t===0?teams.home:teams.away; for(let i=0;i<list.length;i++){ list[i].ovr=false; list[i].cap=0; } }
  };
  const nearestOppDist=(p)=>{ nearestTo(p.pos.x,p.pos.z,null,otherTeam(p.team),false); return nearD; };
  const isWide=(r)=>r==="LB"||r==="RB"||r==="LM"||r==="RM"||r==="LW"||r==="RW"||r==="LWB"||r==="RWB";

  // ── Oyun yönetmeni (yalnızca normal akış) ──
  // Pas başlat: önce vuruş animasyonu (gerilme), ~0.2 sn sonra top çıkar
  const startPass=(o,m,lofted)=>{
    const tp=tempo();
    leadPoint(m,lofted,passPt);
    pk.on=true; pk.t=clk+0.2/tp; pk.x=passPt.x; pk.z=passPt.z; pk.lofted=lofted; pk.team=m.team; pk.i=m.idx;
    faceTo(o,passPt.x-o.pos.x,passPt.z-o.pos.z,0.6);
    const d=Math.hypot(passPt.x-bpos.x,passPt.z-bpos.z);
    rigAction3D(o.rig,"kick",{power:lofted?0.95:clamp(0.45+d/50,0.45,0.85),t0:0,side:(o.idx%4===3)?-1:1});
    own.fromT=o.team; own.fromI=o.idx;
  };
  const execPass=()=>{
    pk.on=false;
    const m=teams[pk.team]&&teams[pk.team][pk.i];
    // Top zaten ayağın önünde; animasyon vuruş anında → kickTo animasyonu yeniden başlatmasın
    const o=ownerP(); const act=o?o.rig.act:null;
    if(o) o.rig.act=null;
    const T=kickTo(pk.x,pk.z,pk.lofted);
    if(o&&act==="kick"){ o.rig.act="kick"; o.rig.actT=o.rig.actDur*0.42; }
    if(m&&m.g.visible) setRcv(m,pk.x,pk.z,T);
  };
  const decide=(o)=>{
    const tp=tempo(), dir=o.team==="home"?1:-1;
    const mates=teams[o.team];
    let best=null, bs=-1e9, bestLoft=false;
    const pressure=nearestOppDist(o);
    for(let i=0;i<mates.length;i++){
      const m=mates[i]; if(m===o||!m.g.visible) continue;
      const d=Math.hypot(m.pos.x-o.pos.x,m.pos.z-o.pos.z);
      // KISA PASLAŞMA: en yakın uygun (pas yolu açık) arkadaş tercih edilir; uzun/havadan top
      //   yalnız kısa seçenek yoksa ve ağır cezayla (rastgele uzun top yok, kademeli ilerleme)
      if(d<4.5||d>ACTORS3D_PASS_MAX) continue;
      if(m.gk&&(o.pos.x*dir>-12||pressure>5)) continue;    // kaleciye yalnızca kendi yarıda, baskı altında
      let lofted=d>ACTORS3D_PASS_SHORT;
      if(!lofted&&laneBlocked(o.team,bpos.x,bpos.z,m.pos.x,m.pos.z,1.8)){ if(d<16) continue; lofted=true; }
      let sc=1.35-d*0.04;                                    // yakın arkadaş: en yüksek puan
      if(lofted) sc-=0.55;                                   // uzun/havadan top: son çare
      sc+=clamp((m.pos.x-o.pos.x)*dir,-12,14)*0.03;          // kademeli ileri pas (geri pas cezalı)
      if(anc.on) sc-=Math.hypot(m.pos.x-anc.x,m.pos.z-anc.z)*0.03; // 2D top bölgesini izle
      sc+=Math.min(nearestOppDist(m),8)*0.07;                // boştaki arkadaş
      if(own.fromT===m.team&&own.fromI===m.idx) sc-=0.2;     // hemen geri pas (verkaç) daha seyrek
      if(m.gk) sc-=0.8;
      sc+=Math.random()*0.18;
      if(sc>bs){ bs=sc; best=m; bestLoft=lofted; }
    }
    // Top sürme: önü (7 m koni) boşsa ve çapa ileride ise cazip
    let ahead=false;
    const opps=teams[otherTeam(o.team)];
    for(let i=0;i<opps.length&&!ahead;i++){
      const q=opps[i]; if(!q.g.visible) continue;
      const ax=(q.pos.x-o.pos.x)*dir, az=q.pos.z-o.pos.z;
      if(ax>0&&ax<8&&Math.abs(az)<ax*0.8+1.5) ahead=true;
    }
    // Sürme puanı paslaşmanın altında tutulur (önü tamamen boşsa ve hiç sürmediyse sürebilir)
    let ds=(ahead?0.1:0.75)+(anc.on&&(anc.x-o.pos.x)*dir>6?0.2:0)-(pressure<3?0.45:0)-own.drN*0.5+Math.random()*0.2;
    if(o.gk) ds=-9;
    if(best&&bs>ds){ startPass(o,best,bestLoft); return; }
    if(o.gk){ // kaleci top sürmez: kısa seçenek yoksa en yakın arkadaşa (gerekirse havadan)
      const q=nearestTo(o.pos.x,o.pos.z,o,o.team,true);
      if(q){ startPass(o,q,Math.hypot(q.pos.x-o.pos.x,q.pos.z-o.pos.z)>ACTORS3D_PASS_SHORT); return; }
    }
    // Boş alana sür: ileri + çapaya doğru kanat ayarı
    own.dribble=true; own.drN++;
    const az=anc.on?(anc.z-o.pos.z)*0.4:0;
    own.px=clamp(o.pos.x+dir*(8+Math.random()*7),-L+3,L-3);
    own.pz=clamp(o.pos.z+az+(Math.random()*2-1)*5,-H+2,H-2);
    own.decide=clk+(0.6+Math.random()*0.5)/tp;   // kısa sürme, sonra yeniden pas arar
  };
  // Destek: sahibin en yakın 2 arkadaşı üçgen köşelerine (0.6 sn'de bir seçilir)
  // Boş alana koşu: topa sahip takımın en ileri 2 hücum oyuncusu (destekçiler hariç) topun
  //   önüne, rakibin en seyrek olduğu kulvara koşar (1.4 sn'de bir yeniden seçilir)
  const runners=[null,null], runAt=[{x:0,z:0},{x:0,z:0}]; let runT=0, runFor=-1;
  const pickRunners=(o)=>{
    runners[0]=null; runners[1]=null;
    const dir=o.team==="home"?1:-1, list=teams[o.team], opp=otherTeam(o.team);
    let f0=-1e9, f1=-1e9;
    for(let i=0;i<list.length;i++){
      const m=list[i]; if(m===o||!m.g.visible||m.gk||m===sup[0]||m===sup[1]) continue;
      const fx=(m.pos.x-o.pos.x)*dir; if(fx<-3) continue;   // topun gerisindekiler koşmaz
      if(fx>f0){ f1=f0; runners[1]=runners[0]; f0=fx; runners[0]=m; } else if(fx>f1){ f1=fx; runners[1]=m; }
    }
    for(let k=0;k<2;k++){
      const m=runners[k]; if(!m) continue;
      const ax=clamp(Math.max(m.pos.x*dir,o.pos.x*dir+10+k*5+Math.random()*4),-L+4,L-6)*dir;
      let bz=m.pos.z, bd=-1;
      for(let c=-1;c<=1;c++){
        const zc=clamp(m.pos.z+c*9,-H+3,H-3);
        nearestTo(ax,zc,null,opp,true); const dd=nearD+(c===0?0.5:0);
        if(dd>bd){ bd=dd; bz=zc; }
      }
      runAt[k].x=ax; runAt[k].z=bz;
    }
  };
  const sup=[null,null]; let supT=0, supSide=1;
  const pickSupport=(o)=>{
    sup[0]=null; sup[1]=null;
    let d0=1e9, d1=1e9;
    const list=teams[o.team];
    for(let i=0;i<list.length;i++){
      const m=list[i]; if(m===o||!m.g.visible||m.gk) continue;
      const d=Math.hypot(m.pos.x-o.pos.x,m.pos.z-o.pos.z);
      if(d>26) continue;
      if(d<d0){ d1=d0; sup[1]=sup[0]; d0=d; sup[0]=m; } else if(d<d1){ d1=d; sup[1]=m; }
    }
    supSide=o.pos.z>0?-1:1; // önde-içe ve geride-kanada açılır
  };
  // Baskı: rakipte topa en yakın (kaleci hariç) kale tarafından gelir, ikinci açıyı kapatır
  let pr1=null, pr2=null;
  const pressLogic=(o,dt)=>{
    const tp=tempo(), dt2=otherTeam(o.team), goalX=dt2==="home"?-L:L;
    pr1=null; pr2=null; let d1=1e9, d2=1e9;
    const list=teams[dt2];
    for(let i=0;i<list.length;i++){
      const q=list[i]; if(!q.g.visible||q.gk) continue;
      const d=Math.hypot(q.pos.x-bpos.x,q.pos.z-bpos.z);
      if(d<d1){ d2=d1; pr2=pr1; d1=d; pr1=q; } else if(d<d2){ d2=d; pr2=q; }
    }
    if(pr1&&d1<22){
      const gx=goalX-bpos.x, gz=-bpos.z, gl=Math.hypot(gx,gz)||1;
      const stand=d1>6?1.0:1.35;                // yakında kale tarafında ~1.4 m
      pr1.ovr=true; pr1.ox=bpos.x+gx/gl*stand; pr1.oz=bpos.z+gz/gl*stand;
      pr1.cap=(d1>8?PACE.chase:PACE.press)*tp;
      // Ayak uzatma: müdahale mesafesinde, bekleme süresi dolduysa
      if(pr1.tackleCd>0) pr1.tackleCd-=dt;
      else if(d1<1.5&&bpos.y<0.6&&clk-own.since>0.6){
        if(Math.random()<1-Math.exp(-0.9*dt)){
          pr1.tackleCd=1.4;
          const lx=Math.cos(pr1.yaw), lz=-Math.sin(pr1.yaw); // yerel sağ (dünya)
          rigAction3D(pr1.rig,"poke",{side:((bpos.x-pr1.pos.x)*lx+(bpos.z-pr1.pos.z)*lz)>=0?1:-1});
          if(Math.random()<0.5){ // top kapıldı: top hafifçe sekip sahipsiz kalır
            const a=Math.atan2(pr1.pos.z-o.pos.z,pr1.pos.x-o.pos.x)+(Math.random()-0.5)*1.4, v=3+Math.random()*3;
            // Doğrudan serbest bırak (kickBall sahibe vuruş animasyonu oynatırdı)
            own.team=null; freeBall=true; rcv.team=null; pk.on=false; landSoft=false; landStop=false; curl.t=0;
            bpos.y=0; bvel.set(Math.cos(a)*v,0,Math.sin(a)*v);
            chaser=pr1; chaseT=clk+0.5;
            return;
          }
        }
      }
    }
    if(pr2&&d2<20){
      const gx=goalX-bpos.x, gz=-bpos.z, gl=Math.hypot(gx,gz)||1;
      pr2.ovr=true; pr2.ox=bpos.x+gx/gl*7+(o.vz>0?2:-2); pr2.oz=bpos.z+gz/gl*7+o.vz*0.4;
      pr2.cap=PACE.press*0.9*tp;
    }
  };
  const ownerLogic=(o,dt)=>{
    const tp=tempo();
    o.ovr=true;
    if(pk.on){ o.ox=o.pos.x; o.oz=o.pos.z; o.cap=1.2; if(clk>=pk.t) execPass(); return; }
    // Top 2D bölgesinden koptu (≥26 m, 1.5 sn): o bölgeye KISA pas zinciriyle ilerle — bölgeye
    //   en çok yaklaştıran, pas yolu açık yakın arkadaşa yerden pas; yoksa o yöne sür.
    //   Uzun top yalnız bölge çok uzaksa (≥45 m) ve 3.5 sn'de kısa yolla yaklaşılamadıysa.
    const farD=anc.on?Math.hypot(anc.x-bpos.x,anc.z-bpos.z):0;
    if(farD>26){ farT+=dt; } else farT=0;
    if(farT>1.5&&clk-own.since>0.5&&!(farD>=45&&farT>3.5)){
      const mates=teams[o.team];
      let bm=null, bg=4;
      for(let i=0;i<mates.length;i++){
        const m=mates[i]; if(m===o||!m.g.visible||m.gk) continue;
        const d=Math.hypot(m.pos.x-o.pos.x,m.pos.z-o.pos.z);
        if(d<5||d>ACTORS3D_PASS_SHORT) continue;
        if(laneBlocked(o.team,bpos.x,bpos.z,m.pos.x,m.pos.z,1.6)) continue;
        const gain=farD-Math.hypot(anc.x-m.pos.x,anc.z-m.pos.z)-d*0.15;
        if(gain>bg){ bg=gain; bm=m; }
      }
      if(bm){ farT=0.9; startPass(o,bm,false); o.ox=o.pos.x; o.oz=o.pos.z; o.cap=1.2; return; }
      if(!own.dribble){
        const ux=(anc.x-o.pos.x)/(farD||1), uz=(anc.z-o.pos.z)/(farD||1);
        own.dribble=true; own.drN++;
        own.px=clamp(o.pos.x+ux*9,-L+3,L-3); own.pz=clamp(o.pos.z+uz*9,-H+2,H-2);
        own.decide=clk+(0.9+Math.random()*0.6)/tp;
      }
    }
    if(farT>3.5&&farD>=45&&clk-own.since>0.5){
      farT=0;
      const q=nearestTo(anc.x,anc.z,o,o.team,true);
      if(q){
        const tx=clamp(anc.x,-L+2,L-2), tz=clamp(anc.z,-H+2,H-2);
        faceTo(o,tx-o.pos.x,tz-o.pos.z,0.6);
        rigAction3D(o.rig,"kick",{power:1,t0:0.25,side:1});
        const T=kickTo(tx,tz,true); setRcv(q,tx,tz,T+0.6);
        return;
      }
    }
    if(clk>=own.decide&&!pk.on){ own.dribble=false; decide(o); if(pk.on){ o.ox=o.pos.x; o.oz=o.pos.z; o.cap=1.2; return; } }
    if(own.dribble){
      // Top ayağa kilitli (updateBall): oyuncu hedefe koşar, top her karede ayağının önünde
      const ux0=own.px-o.pos.x, uz0=own.pz-o.pos.z, ul=Math.hypot(ux0,uz0)||1, ux=ux0/ul, uz=uz0/ul;
      o.ox=o.pos.x+ux*3; o.oz=o.pos.z+uz*3; o.cap=PACE.dribble*tp;
      // Görsel dokunuş animasyonu (top konumu değişmez; kilit updateBall'da)
      if(clk>=own.touchT&&o.speed>1){
        own.touchT=clk+0.32;
        if(Math.random()<0.55) rigAction3D(o.rig,"kick",{power:0.3,t0:0.38,dur:0.32,side:(o.idx%2)?1:-1});
      }
      if(ul<2) own.decide=Math.min(own.decide,clk);
    } else {
      // Topu ayakta tut, hafif koruma hareketi
      o.ox=o.pos.x+Math.sin(clk*1.3+o.idx)*0.25; o.oz=o.pos.z+Math.cos(clk*1.1+o.idx)*0.25; o.cap=1.4;
      if(!pk.on&&own.decide>clk+0.5/tp) own.decide=clk+0.5/tp; // topla beklerken en geç ~0.5 sn'de karar
    }
  };
  // Senaryo bitti / normal akış: sahiplik ve takım davranışı (her kare, hareketten ÖNCE)
  const autoPossess=(dt)=>{
    if(anc.on&&bt.on){ const k=1-Math.exp(-dt/1.2); anc.x+=(bt.x-anc.x)*k; anc.z+=(bt.z-anc.z)*k; }
    if(busy()){
      own.team=null; freeBall=false; rcv.team=null; postScript=true; pk.on=false;
      if(scr.p&&clk<scr.until&&scr.p.g.visible){ scr.p.ovr=true; scr.p.ox=scr.x; scr.p.oz=scr.z; scr.p.cap=PACE.chase*tempo(); }
      return;
    }
    if(postScript){
      postScript=false; scr.p=null;
      // Senaryo bitti: ballPos çok uzaktaysa (gol → santra, aut → kale vuruşu) uzun top
      if(pend.on){
        pend.on=false;
        anc.x=pend.x; anc.z=pend.z;
        if(Math.hypot(pend.x-bpos.x,pend.z-bpos.z)>15){
          const q=nearestTo(pend.x,pend.z,null);
          if(q){
            const center=Math.abs(pend.x)<2&&Math.abs(pend.z)<2; // santra: tam orta noktaya
            const tx=center?0:pend.x, tz=center?0:pend.z;
            const lof=center||Math.hypot(tx-bpos.x,tz-bpos.z)>ACTORS3D_PASS_SHORT; // kısa ise yerden
            const T=kickTo(tx,tz,lof); setRcv(q,tx,tz,T+0.8);
            if(center){ landStop=true; bt.x=0; bt.z=0; }
          }
          return;
        }
      }
    }
    const tp=tempo();
    const o=ownerP();
    if(o){
      if(!o.g.visible){ own.team=null; return; }
      ownerLogic(o,dt);
      if(!ownerP()) return;
      if(clk>supT){ pickSupport(o); supT=clk+0.6; }
      const dir=o.team==="home"?1:-1;
      for(let k=0;k<2;k++){
        const m=sup[k]; if(!m||m===o||m.ovr) continue;
        const ax=k===0?dir*8:-dir*4, az=k===0?supSide*10:-supSide*11;
        m.ovr=true;
        m.ox=clamp(0.65*(o.pos.x+ax)+0.35*m.tgt.x,-L+2,L-2);
        m.oz=clamp(0.65*(o.pos.z+az)+0.35*m.tgt.z,-H+1.5,H-1.5);
        m.cap=PACE.support*tp;
      }
      if(clk>runT||runFor!==own.since){ pickRunners(o); runT=clk+1.4; runFor=own.since; } // yeni sahip: hemen yeniden seç
      for(let k=0;k<2;k++){
        const m=runners[k]; if(!m||m===o||m.ovr||!m.g.visible||m.team!==o.team) continue;
        m.ovr=true; m.ox=runAt[k].x; m.oz=runAt[k].z; m.cap=PACE.receive*tp;
      }
      pressLogic(o,dt);
      return;
    }
    if(freeBall&&rcv.team){
      const r=teams[rcv.team][rcv.i];
      if(r&&r.g.visible&&clk<rcv.t){
        r.ovr=true; r.cap=PACE.receive*tp;
        const db=Math.hypot(bpos.x-r.pos.x,bpos.z-r.pos.z);
        // Buluşma noktasına koş; top yakına gelince doğrudan topa
        if(db<4&&bpos.y<1.2){ r.ox=bpos.x; r.oz=bpos.z; } else { r.ox=rcv.x; r.oz=rcv.z; }
        if(db<1.15&&bpos.y<1.7){ setOwnerInternal(r.team,r.idx); return; }
        // Pas yoluna en yakın rakip topa hamle eder; ≤1.1 m'ye girerse (oyuncu başına bir kez) %45 keser
        const q=nearestTo(bpos.x,bpos.z,null,otherTeam(rcv.team),true);
        if(q&&nearD<7&&!manual){
          q.ovr=true; q.ox=bpos.x+bvel.x*0.3; q.oz=bpos.z+bvel.z*0.3; q.cap=PACE.chase*tp;
          const bit=1<<(q.idx%30);
          if(nearD<1.1&&bpos.y<1.0&&!(rcv.tried&bit)){
            rcv.tried|=bit;
            if(Math.random()<0.45){ rigAction3D(q.rig,"poke",{side:1}); setOwnerInternal(q.team,q.idx); return; }
          }
        }
        return;
      }
      rcv.team=null;
    }
    // Sahipsiz top: en yakın oyuncu topa koşar (0.3 sn'de bir yeniden seçilir)
    if(!chaser||clk>chaseT||!chaser.g.visible){ chaser=nearestTo(bpos.x,bpos.z,null); chaseT=clk+0.3; }
    if(!chaser){
      // Kadro yok (oyuncu görünmüyor): top ballPos'a uçar
      if(bt.on&&btSeq!==flSeq&&!fl.on){
        flSeq=btSeq;
        const d=Math.hypot(bt.x-bpos.x,bt.z-bpos.z);
        if(d>0.05) startFlight(bt.x,bt.z,0,d>15?Math.min(8,d*0.12):d>8?d*0.03:0,sDur(Math.min(1.0,0.22+d*0.012)),null,false);
      }
      return;
    }
    chaser.ovr=true; chaser.cap=PACE.chase*tp; chaser.ox=bpos.x; chaser.oz=bpos.z;
    if(Math.hypot(bpos.x-chaser.pos.x,bpos.z-chaser.pos.z)<1.15&&bpos.y<1.7&&Math.hypot(bvel.x,bvel.z)<10)
      setOwnerInternal(chaser.team,chaser.idx);
  };
  // Senaryo başlat: mevcut uçuşu kes, sahipliği askıya al, kilitle
  const beginScript=(lockSec)=>{
    legs.length=0; fl.on=false; fl.fn=null; pk.on=false;
    own.team=null; freeBall=false; bvel.set(0,0,0); curl.t=0; rcv.team=null;
    lockUntil=clk+lockSec;
  };
  const leg=(x,z,y,h,dur,fn)=>legs.push({x,z,y,h,dur,fn:fn||null});
  // Olay noktasına ilk bacak (mesafeye göre yay); fn: bacak bitince (vuruş anı)
  const legToZone=(wx,wz,fn)=>{
    const d=Math.hypot(wx-bpos.x,wz-bpos.z);
    leg(wx,wz,0,Math.min(6,d*0.1),sDur(Math.min(0.55,0.15+d*0.01)),fn);
  };
  // Olayda topa koşacak hücumcu (topa en yakın) — senaryo boyunca hedefe koşar
  const scriptRunner=(team,wx,wz,sec)=>{
    const p=nearestTo(wx,wz,null,team,true);
    scr.p=p; scr.x=wx; scr.z=wz; scr.until=clk+sec;
    return p;
  };
  // Kaleci: s=+1 rakip kalesi (away), s=−1 bizim kale (home)
  const keeperOf=(s)=>{
    const list=teams[s>0?"away":"home"];
    for(let i=0;i<list.length;i++) if(list[i].gk&&list[i].g.visible) return list[i];
    return null;
  };
  // Kaleciyi (wx,wz) noktasına doğru uçur; h: hedef yüksekliği (m)
  const diveTo=(p,wx,wz,h,spd)=>{
    if(!p) return;
    const fx=bpos.x-p.pos.x, fz=bpos.z-p.pos.z;
    faceTo(p,fx,fz,1.6); p.yaw=Math.atan2(fx,fz);
    const lx=Math.cos(p.yaw), lz=-Math.sin(p.yaw);
    const side=((wx-p.pos.x)*lx+(wz-p.pos.z)*lz)>=0?1:-1;
    const k=Number.isFinite(spd)&&spd>0?clamp(spd,0.5,3):1;   // hız çarpanı: animasyon k× kısa
    rigAction3D(p.rig,"dive",{side,h:clamp((Number(h)||0.8)/2.4,0,1),dur:RIG3D_ACT_DUR.dive/k});
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

  // ── Olay → senaryo + efekt + tribün ──
  const triggerEvent=(ev)=>{
    if(disposed||!ev||!Number.isFinite(ev.x)||!Number.isFinite(ev.y)) return;
    const W=pitchToWorld3D(ev.x,ev.y);
    const opp=ev.team==="opp";
    const atkTeam=opp?"away":"home", defTeam=opp?"home":"away";
    const teamCol=opp?COL.away:COL.home;
    const zoneSide=ev.x>=50?1:-1;           // gol/kaçan/kurtarış: zone hangi kaleye yakınsa
    const atkSide=opp?-1:1;                  // diğerleri: hücum eden takımın hedef kalesi
    const rz=(a)=>(Math.random()*2-1)*a;
    switch(ev.type){
      case "goal":{
        const s=zoneSide, gz=clamp(W.z*0.25,-GW+0.6,GW-0.6);
        const shooterTeam=s>0?"home":"away";
        beginScript(sDur(2.0)+1.2);
        const shooter=scriptRunner(shooterTeam,W.x,W.z,sDur(0.6));
        cheer(shooterTeam,0.55,1.2);
        legToZone(W.x,W.z,()=>{
          kickAnim(shooter,s*L-W.x,gz-W.z,1,0.4);
          // Kaleci geç kalır: topun gittiği tarafa uçar ama yetişemez
          const k=keeperOf(s); if(k) diveTo(k,s*L,gz,0.9);
        });
        leg(s*(L+1.2),gz,0.9,1.0,sDur(0.45),()=>{
          shakeNet(s);
          spawnRing(s*(L-1.5),0.06,gz,teamCol,1.3,9);
          spawnBurst(s*(L-0.5),1.6,gz,teamCol,46);
          if(api.closeUp) api.closeUp(s*(L-3),gz,1.9);
          if(shooter) rigAction3D(shooter.rig,"celebrate",{});
          cheer(shooterTeam,1,4.5); cheer(otherTeam(shooterTeam),0.05,4.5);
        });
        leg(s*(L+1.5),gz,0,0.1,sDur(0.25));
        break;
      }
      case "miss": case "header":{
        const s=ev.type==="miss"?zoneSide:atkSide;
        if(Math.abs(W.x-s*L)>45) break;
        const shooterTeam=s>0?"home":"away";
        const zs=W.z>=0?1:-1, wz=zs*(GW+1+Math.random()*2.5);
        const high=ev.type==="header";
        beginScript(sDur(1.6));
        const shooter=scriptRunner(shooterTeam,W.x,W.z,sDur(0.6));
        legToZone(W.x,W.z,()=>{
          if(!high) kickAnim(shooter,s*L-W.x,wz-W.z,1,0.4);
          const k=keeperOf(s); if(k&&Math.random()<0.45) diveTo(k,s*L,wz,high?2.2:0.6);
          cheerAny("both",0.5,1.6);
        });
        leg(s*(L+2.5),high?rz(GW):wz,high?3.4:0.4,1.6,sDur(0.55));
        leg(s*(L+1),high?rz(GW):wz,0,0.5,sDur(0.35));
        break;
      }
      case "save": case "keeper": case "chance":{
        // keeper: olayın takımının KALECİSİ kurtarır → team "me" bizim kale (−1),
        // team "opp" rakip kale (+1). chance: hücum edenin hedef kalesi.
        const s=ev.type==="save"?zoneSide:ev.type==="keeper"?-atkSide:atkSide;
        if(Math.abs(W.x-s*L)>45) break;
        const shooterTeam=s>0?"home":"away";
        const gz=clamp(W.z*0.3,-3,3), hgt=0.6+Math.random()*1.2;
        beginScript(sDur(1.7));
        const shooter=scriptRunner(shooterTeam,W.x,W.z,sDur(0.6));
        legToZone(W.x,W.z,()=>{
          kickAnim(shooter,s*L-W.x,gz-W.z,1,0.4);
          const k=keeperOf(s); if(k&&Math.abs(gz-k.pos.z)>0.9) diveTo(k,s*L,gz,hgt);
          cheerAny("both",0.55,1.8);
        });
        leg(s*(L-0.9),gz,hgt,0.6,sDur(0.4),()=>spawnRing(s*(L-0.9),0.06,gz,0xffffff,0.6,3));
        leg(s*(L-8),clamp(gz+rz(7),-(H-2),H-2),0,2.2,sDur(0.6));
        break;
      }
      case "crossbar":{
        const s=atkSide;
        if(Math.abs(W.x-s*L)>45) break;
        const gz=rz(GW-0.8);
        beginScript(sDur(1.8));
        const shooter=scriptRunner(atkTeam,W.x,W.z,sDur(0.6));
        legToZone(W.x,W.z,()=>{
          kickAnim(shooter,s*L-W.x,gz-W.z,1,0.4);
          const k=keeperOf(s); if(k) diveTo(k,s*L,gz,2.3);
        });
        leg(s*(L-0.2),gz,D.goalHeight-BR,0.8,sDur(0.45),()=>{ shakeNet(s); cheerAny("both",0.7,2); });
        leg(s*(L-12),clamp(gz+rz(8),-(H-2),H-2),0,3,sDur(0.7));
        break;
      }
      case "corner":{
        const s=atkSide, zs=W.z>=0?1:-1;
        const fx=s*(L-0.7), fz=zs*(H-0.7);
        beginScript(sDur(1.3));
        scriptRunner(atkTeam,fx,fz,sDur(1.3));
        const d=Math.hypot(fx-bpos.x,fz-bpos.z);
        leg(fx,fz,0,Math.min(5,d*0.06),sDur(Math.min(0.8,0.25+d*0.008)),()=>spawnRing(fx,0.06,fz,teamCol,0.9,4));
        cheer(atkTeam,0.4,2);
        break;
      }
      case "yellow":
        spawnCard(W.x,W.z,COL.yellowCard); cheer(atkTeam,0.3,1.5); break;
      case "red": case "tackle_red": case "yellow2red":
        spawnCard(W.x,W.z,COL.redCard); cheer(atkTeam,0.55,2); cheer(defTeam,0.35,2); break;
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
  // koşu animasyonu ve yön, karedeki yer değiştirmeden hesaplanır.
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
    legs.length=0; fl.on=false; fl.fn=null; fl.script=false; lockUntil=0; pend.on=false; pk.on=false;
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
  // Oyuncuyu yarı saydam yap (alpha<1) ya da geri al (1): vuruş ekranında görüşü kapatmasın.
  //   İlk kullanımda o oyuncunun malzemeleri klonlanır (paylaşılan kit malzemesi değişmez).
  const fadeMats=[];
  const setPlayerFade=(team,i,alpha)=>{
    const p=teamList(team)[i]; if(!p||disposed) return;
    const a=Number.isFinite(alpha)?clamp(alpha,0,1):1;
    if(p.fadeA===a||(p.fadeA==null&&a>=0.999)) return;
    p.fadeA=a;
    if(!p.fadeMap) p.fadeMap=new Map();   // özgün malzeme → bu oyuncunun saydam klonu (tek klon)
    p.g.traverse(o=>{
      if(!o.isMesh||Array.isArray(o.material)) return;
      if(a>=0.999){ if(o.userData.m0) o.material=o.userData.m0; return; }
      if(!o.userData.m0) o.userData.m0=o.material;
      let m=p.fadeMap.get(o.userData.m0);
      if(!m){ m=o.userData.m0.clone(); m.transparent=true; m.depthWrite=false; fadeMats.push(m); p.fadeMap.set(o.userData.m0,m); }
      m.opacity=a; o.material=m;
    });
  };
  // Kısa süreli duruş: "slide" (kayarak müdahale) | "fall" (yere düşme)
  const poseFx=(team,i,kind,sec)=>{
    const p=teamList(team)[i]; if(!p||disposed) return;
    rigAction3D(p.rig,kind==="slide"?"slide":"fall",{dur:Number.isFinite(sec)?Math.max(0.4,sec):undefined});
  };
  // Eylem animasyonu: "kick" | "poke" | "celebrate" (+ "slide" | "fall")
  const actionFx=(team,i,kind,o)=>{
    const p=teamList(team)[i]; if(!p||disposed) return;
    const op=o||{};
    if(kind==="poke"&&op.tx!=null){
      const lx=Math.cos(p.yaw), lz=-Math.sin(p.yaw);
      op.side=((op.tx-p.pos.x)*lx+(op.tz-p.pos.z)*lz)>=0?1:-1;
    }
    rigAction3D(p.rig,kind,op);
  };
  const diveFx=(team,i,wx,wz,h,spd)=>{
    const p=teamList(team)[i]; if(!p||disposed||!Number.isFinite(wx)||!Number.isFinite(wz)) return;
    diveTo(p,wx,wz,h,spd);
  };
  // Senaryo bacakları: [{x,z,y,h,dur,fn}] — fn, bacak bitince çağrılır (zincirleme)
  // Topa ≤2.2 m oyuncu varsa vuruş animasyonu oynar (şut/orta/uzaklaştırma)
  const playBallScript=(list,lockSec)=>{
    if(disposed||!list||!list.length) return;
    const first=list[0];
    if(first&&Number.isFinite(first.x)){
      const dd=Math.hypot(first.x-bpos.x,first.z-bpos.z), du=Number(first.dur)||0.4;
      if(dd/du>6) kickAnim(kickerNear(2.2),first.x-bpos.x,first.z-bpos.z,clamp(dd/du/25,0.5,1),0.4);
    }
    beginScript(lockSec||0);
    for(let i=0;i<list.length;i++){
      const l=list[i];
      if(!l||!Number.isFinite(l.x)||!Number.isFinite(l.z)) continue;
      leg(l.x,l.z,Number.isFinite(l.y)?l.y:0,Number.isFinite(l.h)?l.h:0,Number.isFinite(l.dur)?l.dur:0.4,l.fn);
    }
  };
  const goalFx=(s,gz,team)=>{
    if(disposed) return;
    const tk=team==="away"?"away":"home";
    const col=tk==="away"?COL.away:COL.home;
    shakeNet(s);
    spawnRing(s*(L-1.5),0.06,gz,col,1.3,9);
    spawnBurst(s*(L-0.5),1.6,gz,col,46);
    cheerAny(tk,1,4); cheerAny(otherTeam(tk),0.05,4);
    const p=nearestTo(s*(L-12),gz,null,tk,true);
    if(p&&nearD<35) rigAction3D(p.rig,"celebrate",{});
  };
  const ringFx=(x,z,color,dur,maxS)=>{ if(!disposed) spawnRing(x,0.06,z,color,dur||0.8,maxS||4); };
  const shakeGoal=(s)=>{ if(!disposed) shakeNet(s); };
  const getBall=()=>bpos; // salt okunur

  const resetKickoff=()=>{
    if(disposed) return;
    legs.length=0; fl.on=false; fl.fn=null; fl.script=false; lockUntil=0; pend.on=false; pk.on=false;
    // Santra: top havadan orta noktaya, merkeze en yakın oyuncunun ayağına
    const q=nearestTo(0,0,null);
    const T=kickTo(0,0,true);
    landStop=true; bt.on=true; bt.x=0; bt.z=0; anc.x=0; anc.z=0; // top orta noktada durur, merkezdeki oyuncu alır
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
  const updatePlayers=(dt)=>{
    const tp=tempo();
    // kOvr: oyun görevindeki (sahip/alıcı/baskı) oyuncu hedefe daha kararlı yaklaşır
    const kPos=1-Math.exp(-dt*3), kOvr=1-Math.exp(-dt*9), kYaw=Math.min(1,dt*6), kSp=Math.min(1,dt*8), kV=Math.min(1,dt*6);
    const possT=manual?null:own.team, wideZ=H*0.72;
    for(let t=0;t<2;t++){
      const list=t===0?teams.home:teams.away;
      const dir=t===0?1:-1;
      for(let i=0;i<list.length;i++){
        const p=list[i];
        const slot=t*SH_SLOTS+i;
        if(!p.g.visible){ if(i<SH_SLOTS){ shS.set(0,0,0); shP.set(0,-50,0); shM.compose(shP,shQ,shS); shadows.setMatrixAt(slot,shM); } continue; }
        let dx, dz;
        const pinned=p.rig.act==="dive"||p.rig.act==="slide"||p.rig.act==="fall";
        if(p.driven){
          // Konum dışarıdan sürülüyor: yalnızca karedeki yer değiştirmeyi ölç
          dx=p.pos.x-p.lx; dz=p.pos.z-p.lz;
        } else {
          let tx=p.ovr?p.ox:p.tgt.x, tz=p.ovr?p.oz:p.tgt.z;
          if(!p.ovr&&possT){
            // Topa sahip takım: kanatlar açılır, forvetler ileri koşar
            if(possT===p.team){
              if(isWide(p.role)) tz=sgn(tz||(p.idx%2?1:-1))*Math.max(Math.abs(tz),wideZ);
              else if(p.role==="ST"||p.role==="CF"||p.role==="CAM") tx=clamp(tx+dir*4,-L+3,L-3);
            }
          }
          const kp=p.ovr&&p.cap>0?kOvr:kPos;
          dx=(tx-p.pos.x)*kp; dz=(tz-p.pos.z)*kp;
          const step=Math.hypot(dx,dz);
          let maxStep=(p.cap>0?p.cap:(manual?14:PACE.run*tp))*dt;
          if(pinned) maxStep*=0.15;                     // yerdeyken neredeyse hareketsiz
          if(step>maxStep){ dx*=maxStep/step; dz*=maxStep/step; }
          p.pos.x+=dx; p.pos.z+=dz;
        }
        p.lx=p.pos.x; p.lz=p.pos.z;
        const sp=dt>0?Math.hypot(dx,dz)/dt:0;
        if(dt>0){ p.vx+=(dx/dt-p.vx)*kV; p.vz+=(dz/dt-p.vz)*kV; }
        p.speed+=(sp-p.speed)*kSp;
        // Bakış: kısa süreli sabit (vuruş/dalış) → koşu yönü → topa
        let want;
        if(clk<p.faceT) want=p.faceYaw;
        else want=p.speed>0.6?Math.atan2(dx,dz):Math.atan2(bpos.x-p.pos.x,bpos.z-p.pos.z);
        if(!pinned) p.yaw+=wrapPi(want-p.yaw)*kYaw;
        p.g.position.set(p.pos.x,0,p.pos.z);
        p.g.rotation.y=p.yaw;
        animateRig3D(p.rig,dt,pinned?0:p.speed);
        // Gölge: güneş yönünde uzatılmış; dalış/kaymada gövdeyi izler, havadayken küçülür
        if(i<SH_SLOTS){
          const B=p.rig.body, off=B.position.x;
          const low=clamp((RIG3D_HIP-B.position.y)/1.0,0,1), air=Math.max(0,B.position.y-RIG3D_HIP-0.12);
          const k=1/(1+air*0.9);
          shP.set(p.pos.x+Math.cos(p.yaw)*off+SUN_OX,0.03,p.pos.z-Math.sin(p.yaw)*off+SUN_OZ);
          shS.set((1+0.35*low)*k,1,(1.45+0.8*low)*k);
          shM.compose(shP,shQ,shS);
          shadows.setMatrixAt(slot,shM);
        }
      }
      // Kullanılmayan yuvaları gizle (oyuncu sayısı azaldıysa)
      for(let i=list.length;i<SH_SLOTS;i++){ shS.set(0,0,0); shP.set(0,-50,0); shM.compose(shP,shQ,shS); shadows.setMatrixAt(t*SH_SLOTS+i,shM); }
    }
    shadows.instanceMatrix.needsUpdate=true;
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
      else if(landSoft){ bvel.y=-bvel.y*0.2; bvel.x*=0.35; bvel.z*=0.35; landSoft=false; } // havadan pas: kısa yuvarlanma
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
      // TOP AYAĞA KİLİTLİ (normal akış, top sürme, kilit an, pas öncesi): pas/şut dışında top
      // serbest kaymaz; konum her karede doğrudan hesaplanır:
      //   top = oyuncu + ileri(yaw)·(ayak önü + sürme dokunuşu) , y = küçük sekme
      // Dokunuş fazı koşu adımından (rig.phase): itişte top biraz öne açılır ve hafif seker.
      const run=Math.min(1,o.speed/3);
      const k=(((o.rig.phase%TAU)+TAU)%TAU)/TAU;
      const touch=k<0.15?k/0.15:1-(k-0.15)/0.85;
      const off=0.8+0.45*run*touch;
      bpos.x=o.pos.x+Math.sin(o.yaw)*off; bpos.z=o.pos.z+Math.cos(o.yaw)*off;
      bpos.y=0.1*run*4*touch*(1-touch);
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
  // Tribün: top ceza sahası çevresindeyken (normal akış) kıpırdanma
  let hypeT=0;
  const crowdTick=(dt)=>{
    if(!crowd||manual) return;
    hypeT-=dt; if(hypeT>0) return; hypeT=0.5;
    const o=ownerP();
    if(o&&Math.abs(bpos.x)>L-20&&Math.abs(bpos.z)<22){
      const atk=(bpos.x>0)===(o.team==="home");
      if(atk) cheer(o.team,0.32,0.8);
    }
  };

  let disposed=false;
  const hook=(dt,t)=>{
    if(disposed) return;
    clk=t;
    if(opts.getSnapshot) update(opts.getSnapshot());
    clearOverrides();
    if(!manual&&dt>0) autoPossess(dt);
    updatePlayers(dt);
    updateBall(dt);
    updateFx(dt);
    updateNets(dt);
    if(dt>0) crowdTick(dt);
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
    try{ shadows.dispose(); }catch(e){}
    [root,ballRoot,fxRoot].forEach(g=>{ if(g.parent) g.parent.remove(g); g.clear(); });
    try{ kit.dispose(); }catch(e){}
    owned.geos.forEach(g=>{try{g.dispose();}catch(e){}});
    owned.texs.forEach(t=>{try{t.dispose();}catch(e){}});
    owned.mats.forEach(m=>{try{m.dispose();}catch(e){}});
    fadeMats.forEach(m=>{try{m.dispose();}catch(e){}}); fadeMats.length=0;
    owned.geos.length=0; owned.texs.length=0; owned.mats.length=0;
    teams.home.length=0; teams.away.length=0; legs.length=0; seen.clear();
    own.team=null; rcv.team=null; chaser=null; nearBest=null; freeBall=false; scr.p=null; pr1=null; pr2=null; sup[0]=null; sup[1]=null; runners[0]=null; runners[1]=null;
  };
  if(api.addDisposeHook) removeDisposeHook=api.addDisposeHook(dispose);

  return {update,triggerEvent,resetKickoff,dispose,
    movePlayer,getPlayerPos,setBall,playBallScript,goalFx,ringFx,shakeGoal,getBall,
    drivePlayer,setOwner,getOwner,kickTo,kickBall,getBallVel:()=>bvel,isBallFree:()=>freeBall,
    getPlayer,poseFx,actionFx,diveFx,setPlayerFade,ballR:BR};
}
