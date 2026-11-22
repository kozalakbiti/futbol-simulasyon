// ═══════════════════════════════════════════════════════════════
// 3D SAHA — Pitch3D bileşeni (saha, stadyum kenarı, kameralar)
// ═══════════════════════════════════════════════════════════════
// Kullanım:
//   <Pitch3D camera="broadcast" onCameraChange={setCam} height={220}
//            onReady={api=>apiRef.current=api} onError={err=>...}/>
//   camera verilmezse bileşen kamerayı kendi içinde tutar.
//   Kamera kimlikleri: "broadcast" (Yayın) | "tactical" (Taktik)
//                      | "goal" (Kale arkası) | "follow" (Topu takip)
//
// onReady(api) — sahne kurulunca BİR KEZ çağrılır. api:
//   THREE, scene, camera, renderer, container
//   groups:{pitch, players, ball, fx}  → Adım 2+ nesnelerini buraya ekle
//                                         (players/ball/fx boş gelir)
//   toWorld(x,y,h=0,out?)   → 0–100 saha yüzdesi → dünya {x,y,z} / Vector3
//   toPitch(wx,wz)          → dünya → 0–100 saha yüzdesi
//   setFocus(x,y)           → 0–100; "Takip" kamerası bu noktayı yumuşakça izler
//   getFocus()              → yumuşatılmış odak (dünya {x,z})
//   addFrameHook(fn)        → fn(dt,t) her karede çağrılır; dönen fonksiyon kaldırır
//   screenToPitch(cx,cy)    → ekran (clientX/Y) → zemin düzlemi → {x,y} 0–100 | null
//   isDisposed()            → unmount olduysa true (eski api'yi kullanmayı bırak)
// Temizlik: unmount'ta scene içindeki HER ŞEY disposeObject3D ile serbest
// bırakılır; gruplara eklenen mesh'ler için ayrıca dispose gerekmez.
// Kendi eklediğin dinleyicileri addFrameHook'un döndürdüğü fonksiyonla kaldır.
// ═══════════════════════════════════════════════════════════════

const PITCH3D_CAMERAS=[
  {id:"broadcast",icon:"📺",label:"Yayın"},
  {id:"tactical", icon:"🗺️",label:"Taktik"},
  {id:"goal",     icon:"🥅",label:"Kale"},
  {id:"follow",   icon:"🎯",label:"Takip"},
];

// Kamera hedef pozu: {pos:[x,y,z], look:[x,y,z]} — f: yumuşatılmış odak (dünya x,z)
function pitch3dCameraPose(mode,f,aspect,st){
  const a=Math.max(0.4,aspect||1.6);
  const D=PITCH3D_DIM;
  if(mode==="tactical"){
    // Tüm sahayı (kenar payıyla) sığdıracak yükseklik
    const tanV=Math.tan((45*Math.PI/180)/2);
    const dist=Math.max((D.halfLen+6)/(tanV*a),(D.halfWid+5)/tanV)*1.04;
    return {pos:[0,dist,dist*0.1],look:[0,0,0]};
  }
  if(mode==="goal"){
    // Topun bulunduğu yarı sahadaki kalenin arkası (gidip gelmesin diye histerezis)
    if(f.x>8) st.goalSide=1; else if(f.x<-8) st.goalSide=-1;
    const s=st.goalSide||1;
    return {pos:[s*63,9,f.z*0.25],look:[s*18,0,f.z*0.4]};
  }
  if(mode==="follow"){
    const k=Math.min(1.6,Math.max(1,1.4/a));
    const cz=Math.min(D.halfWid+14,f.z+22*k);
    return {pos:[f.x*0.92,14*k,cz],look:[f.x,0,f.z]};
  }
  // broadcast — yan tribünden, topla birlikte hafif kaydırma
  const k=Math.min(1.8,Math.max(1,1.5/a));
  return {pos:[f.x*0.55,34*k,62*k],look:[f.x*0.7,0,f.z*0.2]};
}

// Sahayı (çim, çizgiler, kaleler, stadyum kenarı) kurar → THREE.Group
function buildPitch3DMeshes(THREE){
  const D=PITCH3D_DIM, W=D.lineW, L=D.halfLen, H=D.halfWid;
  const g=new THREE.Group(); g.name="pitch";
  const flat=(geo)=>{geo.rotateX(-Math.PI/2);return geo;};

  // Koyu çevre zemini
  const ground=new THREE.Mesh(flat(new THREE.PlaneGeometry(200,150)),
    new THREE.MeshLambertMaterial({color:0x17241b}));
  ground.position.y=-0.03; g.add(ground);
  // Çim (çizgi dışı pay)
  const grassBase=new THREE.Mesh(flat(new THREE.PlaneGeometry(PITCH3D_LEN+10,PITCH3D_WID+8)),
    new THREE.MeshLambertMaterial({color:0x2a6e2e}));
  grassBase.position.y=-0.01; g.add(grassBase);
  // Çim şeritleri
  const N=14, sw=PITCH3D_LEN/N;
  const stripeGeo=flat(new THREE.PlaneGeometry(sw,PITCH3D_WID));
  const stripeA=new THREE.MeshLambertMaterial({color:0x2f7d33});
  const stripeB=new THREE.MeshLambertMaterial({color:0x3a8f3e});
  for(let i=0;i<N;i++){
    const m=new THREE.Mesh(stripeGeo,i%2?stripeA:stripeB);
    m.position.set(-L+sw*(i+0.5),0,0); g.add(m);
  }

  // Çizgiler (WebGL'de çizgi kalınlığı desteklenmediği için ince düz mesh'ler)
  const lineMat=new THREE.MeshBasicMaterial({color:0xf2f2f2,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});
  const LY=0.02;
  const segX=(x1,x2,z)=>{ // X boyunca
    const m=new THREE.Mesh(flat(new THREE.PlaneGeometry(Math.abs(x2-x1)+W,W)),lineMat);
    m.position.set((x1+x2)/2,LY,z); g.add(m);
  };
  const segZ=(z1,z2,x)=>{ // Z boyunca
    const m=new THREE.Mesh(flat(new THREE.PlaneGeometry(W,Math.abs(z2-z1)+W)),lineMat);
    m.position.set(x,LY,(z1+z2)/2); g.add(m);
  };
  const rect=(x1,x2,z1,z2)=>{segX(x1,x2,z1);segX(x1,x2,z2);segZ(z1,z2,x1);segZ(z1,z2,x2);};
  // φ: dünya açısı, yön=(cosφ, sinφ) XZ düzleminde. rotateX(-90°) sonrası θ=-φ.
  const arc=(cx,cz,r,phi0,phi1)=>{
    const geo=flat(new THREE.RingGeometry(r-W/2,r+W/2,48,1,-phi1,phi1-phi0));
    const m=new THREE.Mesh(geo,lineMat); m.position.set(cx,LY,cz); g.add(m);
  };
  const spot=(x,z,r=0.3)=>{
    const m=new THREE.Mesh(flat(new THREE.CircleGeometry(r,16)),lineMat);
    m.position.set(x,LY,z); g.add(m);
  };
  rect(-L,L,-H,H);                         // kenar çizgileri
  segZ(-H,H,0);                            // orta çizgi
  arc(0,0,D.circleR,0,Math.PI*2);          // orta daire
  spot(0,0);                               // orta nokta
  const alpha=Math.acos((D.penDepth-D.penSpot)/D.circleR); // yay açısı (~53°)
  [-1,1].forEach(s=>{
    const gx=s*L;                                          // kale çizgisi
    rect(Math.min(gx,gx-s*D.penDepth),Math.max(gx,gx-s*D.penDepth),-D.penWidth/2,D.penWidth/2);
    rect(Math.min(gx,gx-s*D.boxDepth),Math.max(gx,gx-s*D.boxDepth),-D.boxWidth/2,D.boxWidth/2);
    const px=gx-s*D.penSpot;
    spot(px,0);                                            // penaltı noktası
    if(s<0) arc(px,0,D.circleR,-alpha,alpha);              // sol yay (+X'e bakar)
    else    arc(px,0,D.circleR,Math.PI-alpha,Math.PI+alpha);// sağ yay (−X'e bakar)
  });
  // Köşe yayları (sahanın içine doğru çeyrek daire)
  arc(-L,-H,D.cornerR,0,Math.PI/2);
  arc( L,-H,D.cornerR,Math.PI/2,Math.PI);
  arc( L, H,D.cornerR,Math.PI,Math.PI*1.5);
  arc(-L, H,D.cornerR,Math.PI*1.5,Math.PI*2);

  // Kaleler: direkler + üst direk + basit file (çizgi ızgarası)
  const postMat=new THREE.MeshLambertMaterial({color:0xffffff});
  const netMat=new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity:0.35});
  const netFillMat=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.06,
    side:THREE.DoubleSide,depthWrite:false});
  const postR=0.06, gw=D.goalWidth/2, gh=D.goalHeight, gd=D.goalDepth;
  const postGeo=new THREE.CylinderGeometry(postR,postR,gh,8);
  const barGeo=new THREE.CylinderGeometry(postR,postR,D.goalWidth+postR*2,8); barGeo.rotateX(Math.PI/2);
  const netGrid=(pts,step)=>{ // pts: [a,b,c,d] köşe (Vector3), a→b ve a→d kenarları
    const [a,b,,d]=pts, arr=[];
    const ab=b.clone().sub(a), ad=d.clone().sub(a);
    const nu=Math.max(1,Math.round(ab.length()/step)), nv=Math.max(1,Math.round(ad.length()/step));
    for(let i=0;i<=nu;i++){const p=a.clone().addScaledVector(ab,i/nu);const q=p.clone().add(ad);arr.push(p.x,p.y,p.z,q.x,q.y,q.z);}
    for(let j=0;j<=nv;j++){const p=a.clone().addScaledVector(ad,j/nv);const q=p.clone().add(ab);arr.push(p.x,p.y,p.z,q.x,q.y,q.z);}
    const geo=new THREE.BufferGeometry();
    geo.setAttribute("position",new THREE.Float32BufferAttribute(arr,3));
    return new THREE.LineSegments(geo,netMat);
  };
  const quad=(a,b,c,d)=>{ // file yüzeyi için çok hafif dolgu
    const geo=new THREE.BufferGeometry();
    geo.setAttribute("position",new THREE.Float32BufferAttribute([
      a.x,a.y,a.z,b.x,b.y,b.z,c.x,c.y,c.z, a.x,a.y,a.z,c.x,c.y,c.z,d.x,d.y,d.z],3));
    return new THREE.Mesh(geo,netFillMat);
  };
  [-1,1].forEach(s=>{
    const goal=new THREE.Group(); goal.name=s<0?"goalHome":"goalAway";
    const x0=s*L, x1=s*(L+gd), V=(x,y,z)=>new THREE.Vector3(x,y,z);
    [-gw,gw].forEach(z=>{const p=new THREE.Mesh(postGeo,postMat);p.position.set(x0,gh/2,z);goal.add(p);});
    const bar=new THREE.Mesh(barGeo,postMat); bar.position.set(x0,gh,0); goal.add(bar);
    const bh=gh*0.75; // arka üst yükseklik (file hafif eğimli)
    const net=new THREE.Group(); net.name="net";
    const faces=[
      [V(x1,0,-gw),V(x1,0,gw),V(x1,bh,gw),V(x1,bh,-gw)],      // arka
      [V(x0,gh,-gw),V(x0,gh,gw),V(x1,bh,gw),V(x1,bh,-gw)],    // üst
      [V(x0,0,-gw),V(x1,0,-gw),V(x1,bh,-gw),V(x0,gh,-gw)],    // yan
      [V(x0,0,gw),V(x1,0,gw),V(x1,bh,gw),V(x0,gh,gw)],        // yan
    ];
    faces.forEach(f=>{net.add(netGrid(f,0.45));net.add(quad(f[0],f[1],f[2],f[3]));});
    goal.add(net);
    g.add(goal);
  });

  // Reklam panoları + basit tribün basamakları
  const boardMat=new THREE.MeshLambertMaterial({color:0x1d3557});
  const boardMat2=new THREE.MeshLambertMaterial({color:0x14243b});
  const standMats=[0x26323f,0x1f2a35,0x2b3846,0x222d39].map(c=>new THREE.MeshLambertMaterial({color:c}));
  const box=(w,h,d,x,y,z,mat)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);g.add(m);};
  const bOff=4.5, bh2=0.9;
  box(PITCH3D_LEN+2*bOff,bh2,0.2,0,bh2/2,-(H+bOff),boardMat);   // uzak taç tarafı pano
  box(PITCH3D_LEN+2*bOff,bh2,0.2,0,bh2/2,H+bOff,boardMat2);     // yakın taç tarafı pano (alçak)
  [-1,1].forEach(s=>box(0.2,bh2,PITCH3D_WID+2*bOff,s*(L+bOff+1.5),bh2/2,0,boardMat));
  // Uzak uzun tribün (yakın taraf kamera görüşünü kapatmasın diye yok)
  for(let i=0;i<5;i++){
    const d=3, h=1.4*(i+1);
    box(PITCH3D_LEN+24,h,d,0,h/2,-(H+8+i*d+d/2),standMats[i%4]);
  }
  // Kale arkası tribünleri (alçak, kale kamerasının arkasında başlar)
  [-1,1].forEach(s=>{
    for(let i=0;i<4;i++){
      const d=3, h=1.2*(i+1);
      box(d,h,PITCH3D_WID+16,s*(66+i*d+d/2),h/2,0,standMats[(i+1)%4]);
    }
  });
  return g;
}

// Sahneyi kurar, render döngüsünü başlatır → {api, destroy}
function createPitch3DScene(THREE,container,opts){
  const dpr=Math.min(window.devicePixelRatio||1,2);
  const renderer=new THREE.WebGLRenderer({antialias:dpr<1.5,alpha:false,powerPreference:"high-performance"});
  renderer.setPixelRatio(dpr);
  renderer.setClearColor(0x0b1220,1);
  const canvas=renderer.domElement;
  canvas.style.cssText="display:block;width:100%;height:100%;touch-action:none;";
  container.appendChild(canvas);

  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(45,1.6,1,400);

  scene.add(new THREE.HemisphereLight(0xe6f0ff,0x1c2a1c,0.85));
  const sun=new THREE.DirectionalLight(0xffffff,0.75);
  sun.position.set(30,80,45); scene.add(sun);

  const groups={pitch:buildPitch3DMeshes(THREE),players:new THREE.Group(),ball:new THREE.Group(),fx:new THREE.Group()};
  Object.keys(groups).forEach(k=>{groups[k].name=k;scene.add(groups[k]);});

  // Odak + kamera durumu
  const focusTarget={x:0,z:0}, focus={x:0,z:0};
  const camPos=new THREE.Vector3(), camLook=new THREE.Vector3();
  const tPos=new THREE.Vector3(), tLook=new THREE.Vector3();
  const camState={goalSide:1};
  let first=true, disposed=false, raf=0, running=false, lastT=0, visibleOnScreen=true;
  const hooks=new Set();
  let size={w:1,h:1};

  const resize=()=>{
    const w=Math.max(1,container.clientWidth), h=Math.max(1,container.clientHeight);
    if(w===size.w&&h===size.h) return;
    size={w,h};
    renderer.setSize(w,h,false);
    camera.aspect=w/h; camera.updateProjectionMatrix();
  };

  const frame=(now)=>{
    if(!running) return;
    raf=requestAnimationFrame(frame);
    const t=now/1000;
    const dt=lastT?Math.min(0.1,t-lastT):0.016;
    lastT=t;
    // Odak yumuşatma
    const kf=1-Math.exp(-dt*4);
    focus.x+=(focusTarget.x-focus.x)*kf; focus.z+=(focusTarget.z-focus.z)*kf;
    // Kamera hedefi + yumuşak geçiş
    const pose=pitch3dCameraPose(opts.getCameraMode(),focus,camera.aspect,camState);
    tPos.set(pose.pos[0],pose.pos[1],pose.pos[2]); tLook.set(pose.look[0],pose.look[1],pose.look[2]);
    if(first){camPos.copy(tPos);camLook.copy(tLook);first=false;}
    else{const kc=1-Math.exp(-dt*2.8);camPos.lerp(tPos,kc);camLook.lerp(tLook,kc);}
    camera.position.copy(camPos); camera.lookAt(camLook);
    hooks.forEach(fn=>{try{fn(dt,t);}catch(e){console.error("[Pitch3D] frame hook hatası",e);}});
    renderer.render(scene,camera);
  };
  const start=()=>{
    if(running||disposed||document.hidden||!visibleOnScreen) return;
    running=true; lastT=0; raf=requestAnimationFrame(frame);
  };
  const stop=()=>{running=false; if(raf) cancelAnimationFrame(raf); raf=0;};

  const onVis=()=>{document.hidden?stop():start();};
  document.addEventListener("visibilitychange",onVis);

  let ro=null, io=null;
  if(typeof ResizeObserver!=="undefined"){ro=new ResizeObserver(()=>resize());ro.observe(container);}
  else window.addEventListener("resize",resize);
  if(typeof IntersectionObserver!=="undefined"){
    io=new IntersectionObserver(ents=>{
      visibleOnScreen=ents.some(e=>e.isIntersecting);
      visibleOnScreen?start():stop();
    });
    io.observe(container);
  }

  const onLost=(e)=>{e.preventDefault();stop();opts.onContextLost&&opts.onContextLost();};
  canvas.addEventListener("webglcontextlost",onLost);

  const raycaster=new THREE.Raycaster(), ndc=new THREE.Vector2();
  const groundPlane=new THREE.Plane(new THREE.Vector3(0,1,0),0), hit=new THREE.Vector3();

  const api={
    THREE,scene,camera,renderer,container,groups,
    toWorld:(x,y,h=0,out)=>pitchToWorld3D(x,y,h,out),
    toPitch:(wx,wz)=>worldToPitch3D(wx,wz),
    setFocus:(x,y)=>{const w=pitchToWorld3D(x,y);focusTarget.x=w.x;focusTarget.z=w.z;},
    getFocus:()=>({x:focus.x,z:focus.z}),
    addFrameHook:(fn)=>{hooks.add(fn);return()=>hooks.delete(fn);},
    screenToPitch:(cx,cy)=>{
      const r=canvas.getBoundingClientRect();
      if(!r.width||!r.height) return null;
      ndc.set(((cx-r.left)/r.width)*2-1,-((cy-r.top)/r.height)*2+1);
      raycaster.setFromCamera(ndc,camera);
      if(!raycaster.ray.intersectPlane(groundPlane,hit)) return null;
      return worldToPitch3D(hit.x,hit.z);
    },
    isDisposed:()=>disposed,
  };

  resize();
  start();

  const destroy=()=>{
    if(disposed) return;
    disposed=true;
    stop();
    hooks.clear();
    document.removeEventListener("visibilitychange",onVis);
    if(ro) ro.disconnect(); else window.removeEventListener("resize",resize);
    if(io) io.disconnect();
    canvas.removeEventListener("webglcontextlost",onLost);
    disposeObject3D(scene);
    renderer.dispose();
    try{renderer.forceContextLoss();}catch(e){}
    if(canvas.parentNode) canvas.parentNode.removeChild(canvas);
  };
  return {api,destroy};
}

function Pitch3D({camera,onCameraChange,onReady,onError,height=220,showControls=true}){
  const mountRef=useRef(null);
  const [innerCam,setInnerCam]=useState("broadcast");
  const camMode=camera||innerCam;
  const camModeRef=useRef(camMode);
  camModeRef.current=camMode;
  const cbRef=useRef({onReady,onError});
  cbRef.current={onReady,onError};
  const [status,setStatus]=useState("loading"); // loading | ready | error
  const [errMsg,setErrMsg]=useState("");

  useEffect(()=>{
    let cancelled=false, inst=null;
    const fail=(msg,err)=>{
      if(cancelled) return;
      if(err) console.warn("[Pitch3D]",err);
      setErrMsg(msg); setStatus("error");
      if(inst){inst.destroy();inst=null;}
      try{cbRef.current.onError&&cbRef.current.onError(err||new Error(msg));}catch(e){}
    };
    if(!hasWebGLSupport()){
      fail("Bu cihaz WebGL desteklemiyor; 3D görünüm kullanılamıyor. 2D saha çalışmaya devam ediyor.");
      return ()=>{cancelled=true;};
    }
    loadThreeJs().then(THREE=>{
      if(cancelled||!mountRef.current) return;
      try{
        inst=createPitch3DScene(THREE,mountRef.current,{
          getCameraMode:()=>camModeRef.current,
          onContextLost:()=>fail("3D grafik bağlamı kaybedildi. Bölümü kapatıp yeniden açmayı dene."),
        });
      }catch(err){
        fail("3D görünüm başlatılamadı. 2D saha çalışmaya devam ediyor.",err);
        return;
      }
      setStatus("ready");
      try{cbRef.current.onReady&&cbRef.current.onReady(inst.api);}catch(e){console.error("[Pitch3D] onReady hatası",e);}
    }).catch(err=>{
      fail("3D kütüphanesi yüklenemedi (internet bağlantını kontrol et). 2D saha çalışmaya devam ediyor.",err);
    });
    return ()=>{cancelled=true; if(inst){inst.destroy();inst=null;}};
  },[]);

  const pickCam=(id)=>{
    if(camera===undefined||camera===null) setInnerCam(id);
    if(onCameraChange) onCameraChange(id);
  };

  return(
    <div style={{position:"relative",width:"100%",height,borderRadius:6,overflow:"hidden",
      background:"#0b1220",border:"1px solid rgba(77,166,255,.25)",touchAction:"none"}}>
      <div ref={mountRef} style={{position:"absolute",inset:0}}/>
      {status==="loading"&&<div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",
        justifyContent:"center",fontSize:".62rem",color:"#9fb3c8",letterSpacing:.5}}>
        ⏳ 3D yükleniyor…
      </div>}
      {status==="error"&&<div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",
        justifyContent:"center",padding:"0 14px",textAlign:"center",fontSize:".6rem",
        color:"#f5c26b",lineHeight:1.5,background:"rgba(11,18,32,.92)"}}>
        ⚠️ {errMsg}
      </div>}
      {showControls&&status==="ready"&&<div style={{position:"absolute",top:5,right:5,display:"flex",gap:3,zIndex:2}}>
        {PITCH3D_CAMERAS.map(c=>{
          const on=c.id===camMode;
          return(
            <button key={c.id} onClick={()=>pickCam(c.id)} title={c.label}
              style={{fontSize:".5rem",padding:"3px 6px",borderRadius:4,cursor:"pointer",
                border:`1px solid ${on?"#4da6ff":"rgba(255,255,255,.2)"}`,
                background:on?"rgba(36,133,255,.35)":"rgba(0,0,0,.55)",
                color:on?"#fff":"#c9d6e3",fontWeight:on?700:400,whiteSpace:"nowrap"}}>
              {c.icon} {c.label}
            </button>
          );
        })}
      </div>}
    </div>
  );
}
