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
// • Oyuncular hedefe lerp + hız sınırıyla yürür, hareket yönüne döner,
//   koşarken hafifçe sallanır. Top, hedef değişince mesafeye göre yay çizer.
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
  const noop={update(){},triggerEvent(){},resetKickoff(){},dispose(){}};
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
  const makePlayer=(team)=>{
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
    return {g,body,torso,team,pos:new THREE.Vector3(),tgt:new THREE.Vector3(),
      yaw:home?Math.PI/2:-Math.PI/2,phase:Math.random()*6,speed:0,has:false,
      label:null,labelText:null};
  };
  const ensurePlayer=(team,i)=>{
    const list=teams[team];
    while(list.length<=i) list.push(makePlayer(team));
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
      const d=dots[i]; if(!d) continue;
      const p=ensurePlayer(team,i);
      pitchToWorld3D(d.x,d.y,0,p.tgt);
      const gk=d.role==="GK";
      p.torso.material=team==="home"?(gk?mats.homeGK:mats.home):(gk?mats.awayGK:mats.away);
      if(!p.has){ p.pos.copy(p.tgt); p.has=true; p.g.position.copy(p.pos); p.g.rotation.y=p.yaw; }
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

  const startFlight=(ex,ez,ey,h,dur,fn,script)=>{
    fl.sx=bpos.x; fl.sy=bpos.y; fl.sz=bpos.z;
    fl.ex=ex; fl.ey=ey; fl.ez=ez; fl.h=h; fl.dur=Math.max(0.05,dur); fl.t=0;
    fl.fn=fn||null; fl.script=!!script; fl.on=true;
  };
  // Normal akış: kısa mesafe yerden yuvarlanır, uzun mesafe yay çizer
  const autoFlight=(ex,ez)=>{
    const d=Math.hypot(ex-bpos.x,ez-bpos.z);
    if(d<0.05&&bpos.y<0.01) return;
    const h=d>15?Math.min(8,d*0.12):d>8?d*0.03:0;
    startFlight(ex,ez,0,h,Math.min(1.0,0.22+d*0.012),null,false);
  };
  const nextLeg=()=>{
    const l=legs.shift();
    if(l) startFlight(l.x,l.z,l.y,l.h,l.dur,l.fn,true);
  };
  const busy=()=>clk<lockUntil||legs.length>0||(fl.on&&fl.script);
  const onBallTarget=(x,y)=>{
    pitchToWorld3D(x,y,0,tmpV);
    if(!ballInit){ ballInit=true; bpos.set(tmpV.x,0,tmpV.z); return; }
    if(busy()){ pend.on=true; pend.x=tmpV.x; pend.z=tmpV.z; return; }
    autoFlight(tmpV.x,tmpV.z);
  };
  // Senaryo başlat: mevcut uçuşu kes, kilitle
  const beginScript=(lockSec)=>{
    legs.length=0; fl.on=false; fl.fn=null;
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
    if(disposed||!ev||ev.x==null||ev.y==null) return;
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
        const s=ev.type==="save"?zoneSide:atkSide;
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

  const resetKickoff=()=>{
    if(disposed) return;
    legs.length=0; fl.script=false; lockUntil=0; pend.on=false;
    autoFlight(0,0);
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
    const kPos=1-Math.exp(-dt*5), kYaw=Math.min(1,dt*6), kSp=Math.min(1,dt*8);
    for(let t=0;t<2;t++){
      const list=t===0?teams.home:teams.away;
      for(let i=0;i<list.length;i++){
        const p=list[i]; if(!p.g.visible) continue;
        let dx=(p.tgt.x-p.pos.x)*kPos, dz=(p.tgt.z-p.pos.z)*kPos;
        const step=Math.hypot(dx,dz), maxStep=MAX_RUN*dt;
        if(step>maxStep){ dx*=maxStep/step; dz*=maxStep/step; }
        p.pos.x+=dx; p.pos.z+=dz;
        const sp=dt>0?Math.hypot(dx,dz)/dt:0;
        p.speed+=(sp-p.speed)*kSp;
        // Koşarken hareket yönüne, dururken topa dön
        const want=p.speed>0.6?Math.atan2(dx,dz):Math.atan2(bpos.x-p.pos.x,bpos.z-p.pos.z);
        p.yaw+=wrapPi(want-p.yaw)*kYaw;
        p.g.position.set(p.pos.x,0,p.pos.z);
        p.g.rotation.y=p.yaw;
        const a=Math.min(1,p.speed/3);
        p.phase+=dt*(5+p.speed*1.2);
        p.body.position.y=Math.abs(Math.sin(p.phase))*0.14*a;
        p.body.rotation.z=Math.sin(p.phase)*0.07*a;
        p.body.rotation.x=0.12*a;
      }
    }
  };
  const updateBall=(dt)=>{
    const px=bpos.x, pz=bpos.z;
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
    if(!fl.on&&!legs.length&&clk>=lockUntil&&pend.on){ pend.on=false; autoFlight(pend.x,pend.z); }
    ball.position.set(bpos.x,BR+bpos.y,bpos.z);
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
  };
  if(api.addDisposeHook) removeDisposeHook=api.addDisposeHook(dispose);

  return {update,triggerEvent,resetKickoff,dispose};
}
