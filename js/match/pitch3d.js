// ═══════════════════════════════════════════════════════════════
// 3D SAHA — Pitch3D bileşeni (saha, stadyum kenarı, kameralar)
// ═══════════════════════════════════════════════════════════════
// Kullanım:
//   <Pitch3D camera="broadcast" onCameraChange={setCam} height={220}
//            onReady={api=>apiRef.current=api} onError={err=>...}/>
//   camera verilmezse bileşen kamerayı kendi içinde tutar.
//   Kamera kimlikleri: "top" (Kuşbakışı 2.5D, maçta varsayılan) | "broadcast" (Yayın) | "tactical" (Taktik)
//                      | "goal" (Kale arkası) | "follow" (Topu takip)
//
// onReady(api) — sahne kurulunca BİR KEZ çağrılır. api:
//   THREE, scene, camera, renderer, container
//   groups:{pitch, players, ball, fx}  → Adım 2+ nesnelerini buraya ekle
//                                         (players/ball/fx boş gelir)
//   crowd:{setSupport(pay), excite(team,level,sec)} → tribün (stadium3d.js)
//   toWorld(x,y,h=0,out?)   → 0–100 saha yüzdesi → dünya {x,y,z} / Vector3
//   toPitch(wx,wz)          → dünya → 0–100 saha yüzdesi
//   setFocus(x,y)           → 0–100; "Takip" kamerası bu noktayı yumuşakça izler
//   getFocus()              → yumuşatılmış odak (dünya {x,z})
//   setFocusWorld(wx,wz)    → aynısı, dünya koordinatıyla (kare başına tahsis yok)
//   getCameraMode()         → aktif kamera kimliği
//   closeUp(wx,wz,sec)      → Yayın/Takip modunda kısa yakın plan (gol vb.)
//   addFrameHook(fn)        → fn(dt,t,realDt) her karede çağrılır (t: duraklamada duran saat);
//                             dönen fonksiyon kaldırır. Duraklatma anında ve duraklıyken
//                             yeniden boyutlanınca bir kez dt=0 ile de çağrılır.
//                             dt ve t zaman ölçeğiyle (setTimeScale) çarpılır; realDt
//                             gerçek süredir (kamera geçişleri her zaman gerçek zamanda).
//   setTimeScale(s)         → kancalara giden zaman ölçeği (0.05–1; ağır çekim ≈ 0.2)
//   getTimeScale()          → aktif zaman ölçeği
//   screenToWorld(cx,cy,out)→ ekran → zemin düzlemi, DÜNYA {x,z} (out'a yazar) | null
//   worldToScreen(wx,wy,wz,out) → dünya → ekran (client) {x,y} (out'a yazar) | null (kamera arkası)
//   setCustomCamera(px,py,pz,lx,ly,lz,snap,low,fov) → camera="custom" iken sabit poz (kilit an).
//                             fov: isteğe bağlı dikey görüş açısı (derece; yoksa PITCH3D_FOV).
//                             low=true: çim seviyesi vuruş kamerası (dikey ekranda geri çekilme yok,
//                             en düşük yükseklik PITCH3D_CAM_LOW_Y; yatayda yine saha kutusunda)
//   renderOnce()            → döngü durmuşken tek kare çiz
//   addDisposeHook(fn)      → sahne silinmeden hemen önce fn() çağrılır
//   screenToPitch(cx,cy)    → ekran (clientX/Y) → zemin düzlemi → {x,y} 0–100 | null
//   isDisposed()            → unmount olduysa true (eski api'yi kullanmayı bırak)
// Prop'lar: paused (render döngüsünü durdurur), interactive (Adım 7'den beri tuval her zaman touch-action:none),
//   controlsAt ("top" | "bottom": kamera düğmelerinin köşesi; HUD üstteyse "bottom")
// Temizlik: unmount'ta scene içindeki HER ŞEY disposeObject3D ile serbest
// bırakılır; gruplara eklenen mesh'ler için ayrıca dispose gerekmez.
// Kendi eklediğin dinleyicileri addFrameHook'un döndürdüğü fonksiyonla kaldır.
// ═══════════════════════════════════════════════════════════════

// Temel dikey görüş açısı (derece). Kadraj hesapları (pitch3dCameraPose, kilit an frameFit) bunu varsayar.
const PITCH3D_FOV=45;
// Pus (THREE.Fog) mesafeleri (m): kuşbakışında etkisiz (OFF), çim seviyesi vuruş kamerasında yumuşak
const PITCH3D_FOG_FAR_OFF=5000, PITCH3D_FOG_NEAR_LOW=55, PITCH3D_FOG_FAR_LOW=340;

const PITCH3D_CAMERAS=[
  {id:"top",      icon:"🛰️",label:"Kuşbakışı"},
  {id:"broadcast",icon:"📺",label:"Yayın"},
  {id:"tactical", icon:"🗺️",label:"Taktik"},
  {id:"goal",     icon:"🥅",label:"Kale"},
  {id:"follow",   icon:"🎯",label:"Takip"},
];

// Poz yazıcı: out ({pos:Vector3, look:Vector3}) verilirse ona yazar (kare başına
// tahsis yok), verilmezse {pos:[x,y,z], look:[x,y,z]} döner (geriye uyumluluk).
function pitch3dSetPose(out,px,py,pz,lx,ly,lz){
  if(out&&out.pos&&out.look){ out.pos.set(px,py,pz); out.look.set(lx,ly,lz); return out; }
  return {pos:[px,py,pz],look:[lx,ly,lz]};
}

// Kamera hedef pozu — f: yumuşatılmış odak (dünya x,z); out: bkz. pitch3dSetPose
function pitch3dCameraPose(mode,f,aspect,st,out){
  const a=Math.max(0.4,aspect||1.6);
  const D=PITCH3D_DIM;
  if(mode==="tactical"){
    // Tüm sahayı (kenar payıyla) sığdıracak yükseklik
    const tanV=Math.tan((45*Math.PI/180)/2);
    const dist=Math.max((D.halfLen+6)/(tanV*a),(D.halfWid+5)/tanV)*1.04;
    return pitch3dSetPose(out,0,dist,dist*0.1,0,0,0);
  }
  if(mode==="top"){
    // Kuşbakışı 2.5D: neredeyse tam tepeden, topu izler. Kamera sahanın üstünde
    // durduğu için tribünler sahayı kapatamaz. Yatay ekranda saha boyu yatay,
    // dikey ekranda hücum yönü (+X) yukarı bakar (dar ekranda daha yüksek).
    const tanV=Math.tan((45*Math.PI/180)/2);
    const portrait=a<1;
    const y=Math.max(34,Math.min(75,(portrait?16:30)/(tanV*a)));
    const fx=Math.max(-D.halfLen+8,Math.min(D.halfLen-8,f.x));
    const fz=Math.max(-D.halfWid+10,Math.min(D.halfWid-10,f.z));
    return portrait?pitch3dSetPose(out,fx-y*0.16,y,fz,fx,0,fz)
      :pitch3dSetPose(out,fx,y,fz+y*0.16,fx,0,fz);
  }
  if(mode==="goal"){
    // Topun bulunduğu yarı sahadaki kalenin arkası (gidip gelmesin diye histerezis)
    if(f.x>8) st.goalSide=1; else if(f.x<-8) st.goalSide=-1;
    const s=st.goalSide||1;
    return pitch3dSetPose(out,s*63,9,f.z*0.25,s*18,0,f.z*0.4);
  }
  if(mode==="follow"){
    const k=Math.min(1.6,Math.max(1,1.4/a));
    const cz=Math.min(D.halfWid+14,f.z+22*k);
    return pitch3dSetPose(out,f.x*0.92,14*k,cz,f.x,0,f.z);
  }
  // broadcast — yan tribünden, topla birlikte hafif kaydırma
  const k=Math.min(1.8,Math.max(1,1.5/a));
  return pitch3dSetPose(out,f.x*0.55,34*k,62*k,f.x*0.7,0,f.z*0.2);
}

// Çim tuvalleri (bir kez üretilir, sahneler arasında paylaşılır; dokular sahneyle dispose edilir)
const PITCH3D_GRASS_CANVAS={map:null,grain:null};
// map: 1024×512 biçme deseni (gw×gh m alanı kaplar; bantlar saha çizgilerine hizalı: boyda 14,
//   ende 10 bant, iki yön damalı) · grain: 256² ince gürültü (aoMap, 0.72–1)
//   pat/tint: biçme deseni ve çim tonu (pitch3dVenue); map desen+ton başına önbellekli, grain ortak
const PITCH3D_GRASS_BY=new Map();
function pitch3dGrassCanvases(gw,gh,pat,tint){
  const key=(pat||"vert")+"|"+(Number(tint)||0).toFixed(2);
  if(PITCH3D_GRASS_BY.has(key)) return PITCH3D_GRASS_BY.get(key);
  if(typeof document==="undefined") return PITCH3D_GRASS_CANVAS;
  const C={map:null,grain:PITCH3D_GRASS_CANVAS.grain}, TN=day3dGrassTint(tint);
  try{
    const rnd=(()=>{ let s=24681; return ()=>{ s=(s*16807)%2147483647; return (s-1)/2147483646; }; })();
    { const W=1024, Hh=512, cv=document.createElement("canvas"); cv.width=W; cv.height=Hh;
      const ctx=cv.getContext("2d"), img=ctx&&ctx.createImageData?ctx.createImageData(W,Hh):null;
      if(img){
        const px=img.data, D=PITCH3D_DIM, L=D.halfLen, Hw=D.halfWid, sx=PITCH3D_LEN/14, sz=PITCH3D_WID/10;
        // Orta ölçekli lekeler: kaba ızgara (33×17) değer gürültüsü, çift doğrusal
        const GX=33, GY=17, lo=new Float32Array(GX*GY); for(let i=0;i<lo.length;i++) lo[i]=rnd();
        for(let y=0;y<Hh;y++){
          // Tuval y=0 dokunun üstü (v=1) → PlaneGeometry'de +Y kenarı; flat() sonrası dünya −Z
          const wz=(y+0.5)/Hh*gh-gh/2, bz=Math.floor((wz+Hw)/sz)&1;
          const fy=y/Hh*(GY-1), y0=Math.floor(fy), ty=fy-y0, y1=Math.min(GY-1,y0+1);
          for(let x=0;x<W;x++){
            const wx=(x+0.5)/W*gw-gw/2, bx=Math.floor((wx+L)/sx)&1;
            const fx=x/W*(GX-1), x0=Math.floor(fx), tx=fx-x0, x1=Math.min(GX-1,x0+1);
            const n=(lo[y0*GX+x0]*(1-tx)+lo[y0*GX+x1]*tx)*(1-ty)+(lo[y1*GX+x0]*(1-tx)+lo[y1*GX+x1]*tx)*ty;
            const out=Math.abs(wx)>L||Math.abs(wz)>Hw;            // çizgi dışı pay: düz, biraz koyu
            // Yalnız boyuna biçme şeritleri (ende bant kaldırıldı: iki yönlü dama büyük kareler gibi görünüyordu)
            let k=out?0.86:(1+0.075*day3dMowBand(wx,wz,pat,14));   // yumuşak şerit kenarı (desen: pitch3dVenue)
            k*=0.93+n*0.1+(rnd()-0.5)*0.03;
            const j=(y*W+x)*4;
            let cr=44*k*TN.r, cg=124*k*TN.g, cb=50*k*TN.b;
            const wv=out?0:day3dGoalWear(wx,wz,n,rnd());                    // kale önü yıpranması
            if(wv>0){ cr+=(96-cr)*wv; cg+=(86-cg)*wv*0.92; cb+=(56-cb)*wv; }
            px[j]=Math.min(255,cr); px[j+1]=Math.min(255,cg); px[j+2]=Math.min(255,cb); px[j+3]=255;
          }
        }
        ctx.putImageData(img,0,0); C.map=cv;
      }
    }
    if(!C.grain){ const N=256, cv=document.createElement("canvas"); cv.width=N; cv.height=N;
      const ctx=cv.getContext("2d"), img=ctx&&ctx.createImageData?ctx.createImageData(N,N):null;
      if(img){
        const px=img.data;
        for(let i=0;i<N*N;i++){
          const v=Math.round(255*(0.72+0.28*Math.pow(rnd(),0.7))), j=i*4;
          px[j]=v; px[j+1]=v; px[j+2]=v; px[j+3]=255;
        }
        ctx.putImageData(img,0,0); C.grain=cv; PITCH3D_GRASS_CANVAS.grain=cv;
      }
    }
  }catch(e){ /* tuval yok: düz renk çim */ }
  PITCH3D_GRASS_BY.delete(key); PITCH3D_GRASS_BY.set(key,C);
  while(PITCH3D_GRASS_BY.size>2) PITCH3D_GRASS_BY.delete(PITCH3D_GRASS_BY.keys().next().value);
  return C;
}

// Sahayı (çim, çizgiler, kaleler, stadyum kenarı) kurar → THREE.Group
//   maxAniso: renderer'ın desteklediği en yüksek anizotropi (çim dokusu; en çok 8 kullanılır)
//   day (isteğe bağlı): gündüz — Phong çim + yaprak kabartması (bumpMap), gölge alan çim/çizgi,
//   parlak direkler + arka destek çubukları/ipler, alphaMap örgülü file (day3d.js tuvalleri)
function buildPitch3DMeshes(THREE,maxAniso,day,venue){
  const VN=venue||{}, gPat=VN.grass||"vert", gTint=Number(VN.tint)||0;   // biçme deseni + çim tonu
  const D=PITCH3D_DIM, W=D.lineW, L=D.halfLen, H=D.halfWid;
  const g=new THREE.Group(); g.name="pitch";
  const flat=(geo)=>{geo.rotateX(-Math.PI/2);return geo;};

  // Koyu çevre zemini
  const ground=new THREE.Mesh(flat(new THREE.PlaneGeometry(200,150)),
    new THREE.MeshLambertMaterial({color:0x17241b}));
  ground.position.y=-0.03; g.add(ground);
  if(day){ ground.material.color.setHex(0x2c4a2a); ground.receiveShadow=true; }
  else if(VN.light==="noon") ground.material.color.setHex(0x2d4b24);       // çevre peyzajıyla aynı ton
  else if(VN.light==="sunset") ground.material.color.setHex(0x323c20);
  // Çim: TEK düzlem (eski 14 şerit mesh'i yerine 1 çizim çağrısı). map = biçme deseni (iki yönde
  //   damalı açık/koyu bantlar + orta ölçekli leke, saha boyunca tek kopya); aoMap = ince çim
  //   tanesi (256² gürültü, ~1.4 m'de bir tekrar) — yalnız ortam (hemisfer) ışığını çarparak
  //   koyulaştırır, ek ışık maliyeti yok. Tuvaller modül düzeyinde bir kez üretilir.
  const GW2=PITCH3D_LEN+10, GH2=PITCH3D_WID+8;
  const grassGeo=flat(new THREE.PlaneGeometry(GW2,GH2));
  grassGeo.setAttribute("uv2",new THREE.BufferAttribute(grassGeo.attributes.uv.array.slice(0),2)); // aoMap uv2 ister
  // Çim (gündüz + gece): MeshStandardMaterial (yüksek pürüzlülük, metal yok; r128 doğrusal ışık
  //   modunda Lambert ile aynı parlaklık ölçeği → palet bozulmaz). Katmanlar:
  //   • map: biçme şeritleri (yalnız boyuna) + orta ölçek leke, sahaya tek kopya
  //   • roughnessMap: şerit başına pürüzlülük (bir şerit hafif parlak, komşusu mat; map ile hizalı)
  //   • mikro çim kılı: dikişsiz kıl dokusu iki ölçekte, uzaklığa göre karışır (day3dGrassDetail) +
  //     aynı doku bumpMap olarak ince ölçekte (~0.55 m) → kuşbakışında ve vuruş kamerasında tüm saha
  //     boyunca homojen, kare tekrar izi olmayan çim. (Eski ince taneli aoMap kaldırıldı: yalnız
  //     kameraya yakın — topun çevresinde — görünüyor, uzakta mipmap'le düzleşiyordu.)
  //   • anizotropi: renderer'ın en yükseği (en çok 16)
  const grassMat=new THREE.MeshStandardMaterial({color:0xffffff,roughness:day?1:0.97,metalness:0});
  const cvs=pitch3dGrassCanvases(GW2,GH2,gPat,gTint);
  const aniso=Math.max(1,Math.min(16,Number(maxAniso)||1));
  const dayGrass=day?day3dGrassCanvas(GW2,GH2,gPat,gTint):null;
  if(dayGrass){
    const t=new THREE.CanvasTexture(dayGrass); t.anisotropy=aniso; grassMat.map=t;   // 2048×1024: yakında ~5 cm/texel
  } else if(cvs.map){
    const t=new THREE.CanvasTexture(cvs.map); t.anisotropy=aniso; grassMat.map=t;   // mipmap: 1024×512 (2'nin kuvveti)
  } else grassMat.color.setHex(0x2f7d33);
  const rc=day3dGrassRoughCanvas(GW2,GH2,gPat);
  // (pürüzlülük tuvali gündüz çiminin şeritlerine hizalı → yalnız gündüz)
  if(day&&rc&&grassMat.map){ const rt=new THREE.CanvasTexture(rc); rt.anisotropy=aniso; grassMat.roughnessMap=rt; }
  const detT=grassMat.map?day3dTex(THREE,"grassDetail",aniso):null;
  if(detT){
    // bumpMap: r128'de tüm haritalar map'in uv dönüşümünü paylaşır (bumpMap.repeat yok sayılır);
    //   ince tekrar gölgelendiricide (day3dGrassDetail: bump uv = vUv × ince ölçek)
    const bt=day3dTex(THREE,"grassDetail",aniso);
    if(bt){ grassMat.bumpMap=bt; grassMat.bumpScale=day?0.24:0.2; }   // ince kıl kabartması (yumuşak, gürültüsüz)
    day3dGrassDetail(THREE,grassMat,detT,GW2,GH2,day?0.12:0.14);
  }
  const grassBase=new THREE.Mesh(grassGeo,grassMat);
  grassBase.position.y=-0.01; grassBase.name="grass"; g.add(grassBase);
  if(day) grassBase.receiveShadow=true;

  // Çizgiler (WebGL'de çizgi kalınlığı desteklenmediği için ince düz mesh'ler)
  // Gündüz: net beyaz, ışık/gölge alan çizgi (tribün çatısının gölgesinde de doğal görünür)
  const lineMat=day?new THREE.MeshLambertMaterial({color:0xffffff,emissive:0x5a5a5a,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2})
    :new THREE.MeshBasicMaterial({color:0xf2f2f2,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});
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

  if(day) g.children.forEach(o=>{ if(o.material===lineMat) o.receiveShadow=true; });
  if(day){
    // Aşınmış çim (Adım 17): iki kale ağzı + iki penaltı noktası — tek geometri, tek çizim çağrısı.
    //   Çimin üstünde, çizgilerin altında (polygonOffset −1, çizgiler −2), gölge alır.
    const wt=day3dTex(THREE,"wear");
    if(wt){
      wt.wrapS=wt.wrapT=THREE.ClampToEdgeWrapping;
      const pos=[], uv=[];
      const patch=(cx,cz,w,d)=>{   // w: x boyu, d: z boyu (m)
        const x0=cx-w/2, x1=cx+w/2, z0=cz-d/2, z1=cz+d/2, y=0.012;
        pos.push(x0,y,z0, x0,y,z1, x1,y,z1, x0,y,z0, x1,y,z1, x1,y,z0);
        uv.push(0,0, 0,1, 1,1, 0,0, 1,1, 1,0);
      };
      [-1,1].forEach(s=>{ patch(s*(L-2.6),0,5.5,8.5); patch(s*(L-D.penSpot),0,3.2,3.2); });
      const wg=new THREE.BufferGeometry();
      wg.setAttribute("position",new THREE.Float32BufferAttribute(pos,3));
      wg.setAttribute("uv",new THREE.Float32BufferAttribute(uv,2));
      wg.computeVertexNormals();
      const wm=new THREE.MeshLambertMaterial({map:wt,transparent:true,depthWrite:false,
        polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});
      const wear=new THREE.Mesh(wg,wm); wear.name="wear"; wear.receiveShadow=true; wear.renderOrder=0; g.add(wear);
    }
  }

  // Kaleler: direkler + üst direk + basit file (çizgi ızgarası; gündüzde alphaMap örgü)
  const postMat=day?new THREE.MeshPhongMaterial({color:0xffffff,specular:0x8a8a8a,shininess:70,emissive:0x202020})
    :new THREE.MeshLambertMaterial({color:0xffffff});
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
  // Gündüz file: 4 yüz tek geometri (uv = metre / göz aralığı), baklava örgü alphaMap, iki yüzlü
  const NET_CELL=0.14;
  const dayNetMat=day?(()=>{
    const at=day3dTex(THREE,"net",Math.min(4,Math.max(1,Number(maxAniso)||1)));
    return new THREE.MeshLambertMaterial({color:0xffffff,emissive:0x2a2a2a,alphaMap:at||null,transparent:true,
      opacity:at?0.95:0.12,side:THREE.DoubleSide,depthWrite:false});
  })():null;
  const netFaces=(faces)=>{
    const pos=[], uv=[];
    faces.forEach(([a,b,c,d])=>{
      const u=a.distanceTo(b)/NET_CELL, v=a.distanceTo(d)/NET_CELL;
      // a(0,0) b(u,0) c(u,v) d(0,v)
      pos.push(a.x,a.y,a.z,b.x,b.y,b.z,c.x,c.y,c.z, a.x,a.y,a.z,c.x,c.y,c.z,d.x,d.y,d.z);
      uv.push(0,0,u,0,u,v, 0,0,u,v,0,v);
    });
    const geo=new THREE.BufferGeometry();
    geo.setAttribute("position",new THREE.Float32BufferAttribute(pos,3));
    geo.setAttribute("uv",new THREE.Float32BufferAttribute(uv,2));
    geo.computeVertexNormals();
    const m=new THREE.Mesh(geo,dayNetMat); m.renderOrder=3; return m;
  };
  // İki nokta arası ince silindir (destek çubuğu / ip) → mergeGeos3D parçası
  const rodY=new THREE.Vector3(0,1,0), rodQ=new THREE.Quaternion(), rodM=new THREE.Matrix4(), rodS=new THREE.Vector3(1,1,1);
  const rod=(a,b,r,c)=>{
    const d=b.clone().sub(a), len=d.length();
    const geo=new THREE.CylinderGeometry(r,r,len,6,1,true);
    rodQ.setFromUnitVectors(rodY,d.normalize());
    rodM.compose(a.clone().add(b).multiplyScalar(0.5),rodQ,rodS); geo.applyMatrix4(rodM);
    return {g:geo,c};
  };
  [-1,1].forEach(s=>{
    const goal=new THREE.Group(); goal.name=s<0?"goalHome":"goalAway";
    const x0=s*L, x1=s*(L+gd), V=(x,y,z)=>new THREE.Vector3(x,y,z);
    [-gw,gw].forEach(z=>{const p=new THREE.Mesh(postGeo,postMat);p.position.set(x0,gh/2,z);if(day){p.castShadow=true;p.receiveShadow=true;}goal.add(p);});
    const bar=new THREE.Mesh(barGeo,postMat); bar.position.set(x0,gh,0); if(day){bar.castShadow=true;bar.receiveShadow=true;} goal.add(bar);
    const bh=gh*0.75; // arka üst yükseklik (file hafif eğimli)
    const net=new THREE.Group(); net.name="net";
    const faces=[
      [V(x1,0,-gw),V(x1,0,gw),V(x1,bh,gw),V(x1,bh,-gw)],      // arka
      [V(x0,gh,-gw),V(x0,gh,gw),V(x1,bh,gw),V(x1,bh,-gw)],    // üst
      [V(x0,0,-gw),V(x1,0,-gw),V(x1,bh,-gw),V(x0,gh,-gw)],    // yan
      [V(x0,0,gw),V(x1,0,gw),V(x1,bh,gw),V(x0,gh,gw)],        // yan
    ];
    if(day){
      net.add(netFaces(faces));
      // Arka çerçeve: yan/arka zemin çubukları, arka dikmeler, üst eğik destekler (direk tepesinden
      //   arkaya), arka üst çubuk + gerilmiş ipler (arka köşelerden zemindeki kazıklara). 1 çizim çağrısı.
      const bc=0xd5dade, rc=0xf4f4f0, rr=0.035;
      const rods=[];
      [-gw,gw].forEach(z=>{
        rods.push(rod(V(x0,0.03,z),V(x1,0.03,z),rr,bc));            // yan zemin çubuğu
        rods.push(rod(V(x1,0,z),V(x1,bh,z),rr,bc));                 // arka dikme
        rods.push(rod(V(x0,gh,z),V(x1,bh,z),rr,bc));                // üst eğik destek
        const peg=V(x1+s*0.9,0.02,z+Math.sign(z)*0.7);
        rods.push(rod(V(x1,bh,z),peg,0.012,rc));                     // gergi ipi
      });
      rods.push(rod(V(x1,0.03,-gw),V(x1,0.03,gw),rr,bc));            // arka zemin çubuğu
      rods.push(rod(V(x1,bh,-gw),V(x1,bh,gw),rr,bc));                // arka üst çubuk
      const frame=new THREE.Mesh(mergeGeos3D(THREE,rods),new THREE.MeshPhongMaterial({vertexColors:true,specular:0x555555,shininess:40}));
      frame.castShadow=true; frame.name="goalFrame"; goal.add(frame);
    } else faces.forEach(f=>{net.add(netGrid(f,0.45));net.add(quad(f[0],f[1],f[2],f[3]));});
    goal.add(net);
    g.add(goal);
  });

  // Tribünler, taraftarlar, panolar, projektörler, kulübeler: stadium3d.js (createPitch3DScene ekler)
  return g;
}

// Sahneyi kurar, render döngüsünü başlatır → {api, destroy, setPaused, setInteractive}
// Kurulum yarıda hata fırlatırsa o ana kadar eklenen her şey geri alınır
// (dinleyiciler, sahne, WebGL bağlamı, canvas) ve hata yeniden fırlatılır.
// ── Stadyum / çim / ışık varyasyonu ──
// pitch3dVenue({homeName,homeStr,comp,week,opp}) → {size,grass,tint,light}
//   size  : ev sahibi gücü/ligi → "small" (alt lig: açık küçük tribün + bol ağaç) | "mid" (orta ölçek:
//           tek katlı çatılı) | "big" (büyük kulüp: çift katlı, köşeleri kapalı dev stadyum)
//   grass : ev sahibinin kendi biçme deseni (ad hash'i) → "vert" | "horiz" | "check"; tint: −1…1 çim tonu
//   light : maç hash'i (ev + rakip + hafta) → "noon" | "sunset" | "night"
//   Aynı maç her açılışta aynı görünür (canlı akış ve kilit an aynı stadyumu paylaşır).
function pitch3dHash(str){ let h=2166136261; str=String(str||""); for(let i=0;i<str.length;i++){ h^=str.charCodeAt(i); h=Math.imul(h,16777619)>>>0; } return h>>>0; }
function pitch3dVenue(o){
  o=o||{};
  const str=Number(o.homeStr), comp=String(o.comp||"");
  let size=!Number.isFinite(str)?"mid":str>=79?"big":str>=69?"mid":"small";
  if(comp==="TFF1"&&size==="big") size="mid";
  if(comp==="HAZ") size=size==="big"?"mid":"small";            // hazırlık maçı: küçük tesis
  const hh=pitch3dHash("v|"+(o.homeName||"")), mh=pitch3dHash("m|"+(o.homeName||"")+"|"+(o.opp||"")+"|"+(o.week!=null?o.week:"")+"|"+comp);
  const grass=["vert","horiz","check"][hh%3];
  const tint=[-0.8,-0.35,0,0.35,0.8][(hh>>>4)%5];
  const lr=(mh%1000)/1000, light=lr<0.4?"noon":lr<0.7?"sunset":"night";
  return {size,grass,tint,light};
}
// Kurulumda kullanılan biçim: venue yoksa eski görünüm (gündüz: büyük İngiliz tribünleri + öğle güneşi,
//   gece: projektörlü canlı akış sahnesi) aynen korunur.
function pitch3dVenueNorm(v,day){
  const ok=(x,arr,def)=>arr.indexOf(x)>=0?x:def;
  if(!v||typeof v!=="object") return {size:"classic",grass:"vert",tint:0,light:day?"noon":"night",custom:false};
  return {size:ok(v.size,["small","mid","big"],"classic"),grass:ok(v.grass,["vert","horiz","check"],"vert"),
    tint:Math.max(-1,Math.min(1,Number(v.tint)||0)),light:ok(v.light,["noon","sunset","night"],day?"noon":"night"),custom:true};
}
// Gece gök kubbesi (ufuk gradyanı, vertex rengi; fog'dan etkilenmez)
function pitch3dNightSky(THREE){
  const SR=300, sky=new THREE.SphereGeometry(SR,24,12);
  const pos=sky.attributes.position, col=new Float32Array(pos.count*3);
  const cTop=new THREE.Color(0x03060f), cMid=new THREE.Color(0x0d1a33), cHor=new THREE.Color(0x3a3352), cGlow=new THREE.Color(0x6a4d5c), tmp=new THREE.Color();
  for(let i=0;i<pos.count;i++){
    const h=pos.getY(i)/SR;                       // −1 (alt) … 1 (tepe)
    if(h<0.02) tmp.copy(cGlow).lerp(cHor,Math.max(0,Math.min(1,(0.02-h)/0.25)));
    else if(h<0.25) tmp.copy(cGlow).lerp(cMid,(h-0.02)/0.23);
    else tmp.copy(cMid).lerp(cTop,Math.min(1,(h-0.25)/0.6));
    col[i*3]=tmp.r; col[i*3+1]=tmp.g; col[i*3+2]=tmp.b;
  }
  sky.setAttribute("color",new THREE.BufferAttribute(col,3));
  const skyMesh=new THREE.Mesh(sky,new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.BackSide,fog:false,depthWrite:false}));
  skyMesh.name="sky"; skyMesh.renderOrder=-10; skyMesh.frustumCulled=false;
  return skyMesh;
}
const PITCH3D_SUNSET_SKY=0xffb48c, PITCH3D_SUNSET_FOG=0xe6b08c, PITCH3D_NIGHT_FOG_DAY=0x161a2a;

function createPitch3DScene(THREE,container,opts){
  const dpr=Math.min(window.devicePixelRatio||1,2);
  const renderer=new THREE.WebGLRenderer({antialias:dpr<1.5,alpha:false,powerPreference:"high-performance"});
  const canvas=renderer.domElement;
  const cleanups=[];            // kurulumda eklenen dinleyicilerin geri alma fonksiyonları
  const disposeHooks=new Set(); // Adım 2+ denetleyicileri (sahne silinmeden ÖNCE çağrılır)
  let scene=null, disposed=false, running=false, raf=0;
  const stop=()=>{running=false; if(raf) cancelAnimationFrame(raf); raf=0;};
  const teardown=()=>{
    stop();
    disposeHooks.forEach(fn=>{try{fn();}catch(e){console.error("[Pitch3D] dispose hook hatası",e);}});
    disposeHooks.clear();
    cleanups.forEach(fn=>{try{fn();}catch(e){}});
    cleanups.length=0;
    if(scene) disposeObject3D(scene);
    try{renderer.dispose();}catch(e){}
    try{renderer.forceContextLoss();}catch(e){}
    if(canvas.parentNode) canvas.parentNode.removeChild(canvas);
  };

  try{
    renderer.setPixelRatio(dpr);
    const day=!!opts.day;          // gündüz sahnesi (kilit an): gök, güneş + gölge, İngiliz tribünleri (day3d.js)
    const VEN=pitch3dVenueNorm(opts.venue,day), LT=VEN.light;   // stadyum / çim / ışık varyasyonu
    renderer.setClearColor(LT==="night"?(day?0x05070d:0x0b1220):LT==="sunset"?0xe7a676:DAY3D_SKY_CLEAR,1);
    if(day){
      // Yumuşak gölgeler: yalnız güneş gölge yapar (tek ışık); harita boyutu cihaza göre (day3dLights)
      renderer.shadowMap.enabled=true;
      renderer.shadowMap.type=THREE.PCFSoftShadowMap;
      // Film tonu (ACES): parlak güneşte beyazlar patlamaz, renkler doygun ve canlı kalır.
      //   Pozlama, ACES'in orta tonları koyulaştırmasını dengeler (DAY3D_EXPOSURE, day3d.js)
      renderer.toneMapping=THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure=LT==="sunset"?DAY3D_EXPOSURE*0.94:LT==="night"?DAY3D_EXPOSURE*0.88:DAY3D_EXPOSURE;
    }
    // Dokunma: 3D tuval parmak hareketlerini her zaman yutar (mobilde sayfa kaymasın)
    canvas.style.cssText="display:block;width:100%;height:100%;touch-action:none;";
    container.appendChild(canvas);

    scene=new THREE.Scene();
    const camera=new THREE.PerspectiveCamera(PITCH3D_FOV,1.6,1,800);   // dikey yayında kamera geri çekilir: karşı ufuk (≈410 m) kırpılmasın

    if(day){
      let lowEnd=false;
      try{ lowEnd=!!(window.matchMedia&&window.matchMedia("(pointer: coarse)").matches)||Math.min(window.innerWidth||0,window.innerHeight||0)<500; }catch(e){}
      day3dLights(THREE,scene,lowEnd,LT);
    } else if(LT==="noon"){        // canlı akış, gün ortası: parlak gök dolgusu + güneş
      scene.add(new THREE.HemisphereLight(0xeaf4ff,0x2c3a22,1.05));
      const sun=new THREE.DirectionalLight(0xfff1d8,0.95);
      sun.position.set(-40,90,50); scene.add(sun);
    } else if(LT==="sunset"){      // canlı akış, gün batımı: sıcak turuncu alçak güneş
      scene.add(new THREE.HemisphereLight(0xffd2ae,0x3a2c1c,0.8));
      const sun=new THREE.DirectionalLight(0xffa860,1.0);
      sun.position.set(-90,38,55); scene.add(sun);
    } else {
      scene.add(new THREE.HemisphereLight(0xe6f0ff,0x1c2a1c,0.85));
      const sun=new THREE.DirectionalLight(0xffffff,0.75);
      sun.position.set(30,80,45); scene.add(sun);
    }

    // Akşam/gece stadyum atmosferi: ufuk gradyanlı gök kubbesi (vertex rengi, fog'dan etkilenmez;
    //   kamera far=400 içinde) + pus (THREE.Fog). Pus her zaman sahnede (program değişimi/takılma
    //   olmasın); kuşbakışında near/far çok uzak = etkisiz, çim seviyesi vuruş kamerasında yumuşak pus.
    if(LT==="night"){
      scene.add(pitch3dNightSky(THREE));
      scene.fog=new THREE.Fog(day?PITCH3D_NIGHT_FOG_DAY:0x2a2a44,PITCH3D_FOG_FAR_OFF,PITCH3D_FOG_FAR_OFF*2);
    } else {
      // Gündüz: mavi gök + bulut kubbesi (gün batımında turuncu çarpan); pus gökyüzünün ufuk rengiyle aynı
      scene.add(day3dSkyDome(THREE,LT==="sunset"?PITCH3D_SUNSET_SKY:undefined));
      scene.fog=new THREE.Fog(LT==="sunset"?PITCH3D_SUNSET_FOG:DAY3D_FOG,PITCH3D_FOG_FAR_OFF,PITCH3D_FOG_FAR_OFF*2);
    }
    // Çevre peyzajı (landscape3d.js): stadyum dışı zemin, duvar, binalar, ağaçlar, tepeler → ufukta boşluk yok
    scene.add(buildLandscape3D(THREE,LT));
    const groups={pitch:buildPitch3DMeshes(THREE,renderer.capabilities&&renderer.capabilities.getMaxAnisotropy?renderer.capabilities.getMaxAnisotropy():1,day,VEN),
      players:new THREE.Group(),ball:new THREE.Group(),fx:new THREE.Group()};
    Object.keys(groups).forEach(k=>{groups[k].name=k;scene.add(groups[k]);});
    // Stadyum (tribün + taraftar + projektör + pano + kulübe); sahne ile birlikte temizlenir
    const stadium=buildStadium3D(THREE,{day,size:VEN.size,flood:LT==="night",isAlive:()=>!disposed,
      onAsset:()=>{ if(!disposed) renderOnce(); }});   // hazır model geldi: duraklatılmış sahneyi yenile
    groups.pitch.add(stadium.group);

    // Odak + kamera durumu
    const focusTarget={x:0,z:0}, focus={x:0,z:0};
    const camPos=new THREE.Vector3(), camLook=new THREE.Vector3();
    const tPos=new THREE.Vector3(), tLook=new THREE.Vector3();
    const camState={goalSide:1};
    const closeUp={until:0,x:0,z:0}; // gol vb. için kısa yakın plan
    const poseOut={pos:tPos,look:tLook};           // pitch3dCameraPose buraya yazar (tahsis yok)
    const customCam={on:false,low:false,free:false,fov:PITCH3D_FOV,pos:new THREE.Vector3(),look:new THREE.Vector3()}; // "custom" kamera (kilit an)
    let freeAge=0;   // yörünge kamerasında geçen süre (sn): geçiş yumuşak başlar, sonra hedefe rijit bağlanır
    let first=true, lastT=0, clock=0, visibleOnScreen=true, paused=!!opts.paused;
    let timeScale=1, hookClock=0; // ağır çekim: kancalar ölçekli dt/saat alır
    // Kare kancaları: dizi (closure'sız döngü). Kaldırma yeni dizi atar, böylece
    // döngü sırasında kendini kaldıran kanca diziyi kaydırmaz.
    let hooks=[];
    let size={w:1,h:1};

    // Tek kare: odak + kamera + kancalar + çizim. dt=0 → hiçbir şey ilerlemez,
    // yalnızca kancalar yeni veriyi okur (duraklatma/yeniden boyutlandırma anı).
    const step=(dt)=>{
      clock+=dt;
      // Odak yumuşatma
      const kf=1-Math.exp(-dt*4);
      focus.x+=(focusTarget.x-focus.x)*kf; focus.z+=(focusTarget.z-focus.z)*kf;
      // Kamera hedefi + yumuşak geçiş (yakın plan yalnızca Yayın/Takip modunda)
      const mode=opts.getCameraMode();
      if(mode==="custom"&&customCam.on){
        // Dar (dikey) ekranda aynı bakış yönünde geri çekil ki sahne sığsın
        // Kadrajı çağıran hesaplar (kilit an: kuşbakışı yüksekliği en-boy oranına göre);
        // burada geri çekilme yok. Kuşbakışında tavan PITCH3D_CAM_TOP_MAX_Y (sahanın üstü, güvenli).
        tLook.copy(customCam.look);
        tPos.copy(customCam.pos);
        // Kamera saha kutusunda kalır: tribün/çatı görüşü kapatmaz
        //   (free: yörünge kamerası sınırını çağıran hesaplar, yön bozulmasın diye kırpılmaz)
        if(!customCam.free) pitch3dSafeCam(tPos.x,tPos.y,tPos.z,tPos,0.55,customCam.low?PITCH3D_CAM_LOW_Y:undefined,
          customCam.low?undefined:PITCH3D_CAM_TOP_MAX_Y);
        if(tLook.y<0) tLook.y=0;
        if(!Number.isFinite(tLook.x+tLook.y+tLook.z)) tLook.set(0,0,0);
      } else if(clock<closeUp.until&&(mode==="follow"||mode==="broadcast")){
        const sx=closeUp.x>=0?1:-1;
        tPos.set(closeUp.x-sx*13,5.5,closeUp.z+11); tLook.set(closeUp.x,1,closeUp.z);
      } else {
        pitch3dCameraPose(mode,focus,camera.aspect,camState,poseOut);
      }
      // Dikey görüş açısı: özel kamera isterse (vuruş ekranı: dikey ekranda kale ağzı sığsın), yoksa
      //   temel açı. Konum/bakışla AYNI katsayıyla yumuşar (vuruş ekranından çıkışta zum sıçraması yok);
      //   ilk karede (snap) doğrudan atlar. Projeksiyon yalnız açı değişince güncellenir.
      const wantFov=(mode==="custom"&&customCam.on)?customCam.fov:PITCH3D_FOV;
      let nf=camera.fov; const snapCam=first;
      if(first){camPos.copy(tPos);camLook.copy(tLook);nf=wantFov;first=false;}
      else{
        // Yörüngede hedef zaten yumuşatılmış: doğrusal lerp yay yerine kiriş çizip yatay uzaklığı daraltmasın
        freeAge=mode==="custom"&&customCam.on&&customCam.free?freeAge+dt:0;
        const kc=1-Math.exp(-dt*(freeAge>0?6+Math.min(1,freeAge/0.6)*84:2.8));camPos.lerp(tPos,kc);camLook.lerp(tLook,kc);nf+=(wantFov-nf)*kc;}
      if(Math.abs(nf-wantFov)<0.01) nf=wantFov;
      if(nf!==camera.fov){ camera.fov=nf; camera.updateProjectionMatrix(); }
      // Pus: yalnız çim seviyesi özel kamerada (vuruş ekranı) yaklaşır; geçişi kamerayla aynı hızda
      if(scene.fog){
        const low=mode==="custom"&&customCam.on&&customCam.low;
        const wn=low?PITCH3D_FOG_NEAR_LOW:PITCH3D_FOG_FAR_OFF, wfr=low?PITCH3D_FOG_FAR_LOW:PITCH3D_FOG_FAR_OFF*2;
        const kfg=snapCam?1:1-Math.exp(-dt*2.8);
        scene.fog.near+=(wn-scene.fog.near)*kfg; scene.fog.far+=(wfr-scene.fog.far)*kfg;
      }
      camera.position.copy(camPos); camera.lookAt(camLook);
      const list=hooks, sdt=dt*timeScale;
      hookClock+=sdt;
      stadium.update(sdt); // taraftar animasyonu (yalnızca uniform; ağır çekimde yavaşlar)
      for(let i=0;i<list.length;i++){
        try{list[i](sdt,hookClock,dt);}catch(e){console.error("[Pitch3D] frame hook hatası",e);}
      }
      try{
        renderer.render(scene,camera);
      }catch(err){
        // Her karede konsolu doldurmasın: döngüyü durdur, hata yoluna yönlendir
        stop();
        opts.onRenderError&&opts.onRenderError(err);
      }
    };
    const frame=(now)=>{
      if(!running) return;
      raf=requestAnimationFrame(frame);
      const t=now/1000;
      const dt=lastT?Math.min(0.1,t-lastT):0.016;
      lastT=t;
      step(dt);
    };
    // Döngü çalışmıyorken tek kare çiz (duraklatılmış sahne boş kalmasın)
    const renderOnce=()=>{
      if(disposed||running||!scene) return;
      step(0);
    };
    const start=()=>{
      if(running||disposed) return;
      if(paused||document.hidden||!visibleOnScreen){
        // Duraklatma yüzünden başlamadıysak en azından son durumu göster
        if(paused&&!document.hidden) renderOnce();
        return;
      }
      running=true; lastT=0; raf=requestAnimationFrame(frame);
    };

    const resize=()=>{
      const w=Math.max(1,container.clientWidth), h=Math.max(1,container.clientHeight);
      if(w===size.w&&h===size.h) return;
      size={w,h};
      renderer.setSize(w,h,false);
      camera.aspect=w/h; camera.updateProjectionMatrix();
      // setSize tuvali temizler: döngü durmuşsa (paused) tek kare yeniden çiz
      if(!running&&!document.hidden) renderOnce();
    };

    const onVis=()=>{document.hidden?stop():start();};
    document.addEventListener("visibilitychange",onVis);
    cleanups.push(()=>document.removeEventListener("visibilitychange",onVis));

    if(typeof ResizeObserver!=="undefined"){
      const ro=new ResizeObserver(()=>resize()); ro.observe(container);
      cleanups.push(()=>ro.disconnect());
    } else {
      window.addEventListener("resize",resize);
      cleanups.push(()=>window.removeEventListener("resize",resize));
    }
    if(typeof IntersectionObserver!=="undefined"){
      const io=new IntersectionObserver(ents=>{
        visibleOnScreen=ents.some(e=>e.isIntersecting);
        visibleOnScreen?start():stop();
      });
      io.observe(container);
      cleanups.push(()=>io.disconnect());
    }

    const onLost=(e)=>{e.preventDefault();stop();opts.onContextLost&&opts.onContextLost();};
    canvas.addEventListener("webglcontextlost",onLost);
    cleanups.push(()=>canvas.removeEventListener("webglcontextlost",onLost));

    const raycaster=new THREE.Raycaster(), ndc=new THREE.Vector2();
    const groundPlane=new THREE.Plane(new THREE.Vector3(0,1,0),0), hit=new THREE.Vector3();
    const projV=new THREE.Vector3();

    const api={
      THREE,scene,camera,renderer,container,groups,
      crowd:stadium.crowd, // setSupport(pay), excite(team,level,sec) — bkz. stadium3d.js
      toWorld:(x,y,h=0,out)=>pitchToWorld3D(x,y,h,out),
      toPitch:(wx,wz)=>worldToPitch3D(wx,wz),
      setFocus:(x,y)=>{const w=pitchToWorld3D(x,y);focusTarget.x=w.x;focusTarget.z=w.z;},
      setFocusWorld:(wx,wz)=>{focusTarget.x=wx;focusTarget.z=wz;}, // kare başına tahsis yok
      getFocus:()=>({x:focus.x,z:focus.z}),
      getCameraMode:()=>opts.getCameraMode(),
      // Yayın/Takip modunda (wx,wz) dünya noktasına sec saniyelik yakın plan
      closeUp:(wx,wz,sec=1.6)=>{closeUp.x=wx;closeUp.z=wz;closeUp.until=clock+sec;},
      // camera="custom" modunda kullanılacak sabit poz (dünya). snap: geçişsiz atla
      //   fov (isteğe bağlı): dikey görüş açısı (derece, 30–75); verilmezse PITCH3D_FOV
      setCustomCamera:(px,py,pz,lx,ly,lz,snap,low,fov,free)=>{
        customCam.pos.set(px,py,pz); customCam.look.set(lx,ly,lz); customCam.on=true; customCam.low=!!low; customCam.free=!!free;
        customCam.fov=Number.isFinite(fov)?Math.max(30,Math.min(75,fov)):PITCH3D_FOV;
        if(snap) first=true;
      },
      addFrameHook:(fn)=>{
        if(typeof fn!=="function") return ()=>{};
        hooks=hooks.concat([fn]);
        return ()=>{ hooks=hooks.filter(h=>h!==fn); };
      },
      renderOnce:()=>renderOnce(),
      addDisposeHook:(fn)=>{disposeHooks.add(fn);return()=>disposeHooks.delete(fn);},
      screenToPitch:(cx,cy)=>{
        const r=canvas.getBoundingClientRect();
        if(!r.width||!r.height) return null;
        ndc.set(((cx-r.left)/r.width)*2-1,-((cy-r.top)/r.height)*2+1);
        raycaster.setFromCamera(ndc,camera);
        if(!raycaster.ray.intersectPlane(groundPlane,hit)) return null;
        return worldToPitch3D(hit.x,hit.z);
      },
      // Aynı ışın, dünya koordinatıyla (kilit an girdisi; out verilirse tahsis yok)
      screenToWorld:(cx,cy,out)=>{
        const r=canvas.getBoundingClientRect();
        if(!r.width||!r.height) return null;
        ndc.set(((cx-r.left)/r.width)*2-1,-((cy-r.top)/r.height)*2+1);
        raycaster.setFromCamera(ndc,camera);
        if(!raycaster.ray.intersectPlane(groundPlane,hit)) return null;
        if(!Number.isFinite(hit.x)||!Number.isFinite(hit.z)) return null;
        const o=out||{x:0,z:0}; o.x=hit.x; o.z=hit.z; return o;
      },
      worldToScreen:(wx,wy,wz,out)=>{
        const r=canvas.getBoundingClientRect();
        if(!r.width||!r.height) return null;
        projV.set(wx,wy,wz).project(camera);
        // Kamera arkası (z>1) ya da geçersiz: ekranda değil → null
        if(!Number.isFinite(projV.x)||!Number.isFinite(projV.y)||projV.z>1) return null;
        const o=out||{x:0,y:0};
        o.x=r.left+(projV.x+1)/2*r.width; o.y=r.top+(1-projV.y)/2*r.height; return o;
      },
      setTimeScale:(v)=>{ timeScale=Number.isFinite(v)?Math.max(0.05,Math.min(1,v)):1; },
      getTimeScale:()=>timeScale,
      isDisposed:()=>disposed,
      // Render döngüsü şu an dönüyor mu (duraklatma / sekme gizli / tuval ekran dışı → false)
      isRendering:()=>!disposed&&running&&!paused&&!document.hidden&&visibleOnScreen,
    };
    cleanups.push(()=>{hooks=[];});

    // Hazır kale modeli (assets/models/goal.glb, assets3d.js): direk + üst direk. Gelmezse (ağ yok,
    //   dosya bozuk) prosedürel kale olduğu gibi kalır; sahne kapandıysa model hemen serbest bırakılır.
    if(typeof assets3dApplyGoals==="function"){
      assets3dApplyGoals(THREE,groups.pitch,PITCH3D_DIM,()=>!disposed)
        .then(ok=>{ if(ok&&!disposed) renderOnce(); }).catch(()=>{});
    }

    resize();
    start();

    const destroy=()=>{
      if(disposed) return;
      disposed=true;
      teardown();
    };
    const setPaused=(p)=>{
      const was=paused;
      paused=!!p;
      if(paused){
        // Duraklamadan hemen önce: kancalar aynı tick'te gelen veriyi (ör. 90. dk
        // golü, devre arası olayları) dt=0 ile okusun, son kare çizilsin.
        if(!was&&running&&!disposed){ stop(); step(0); }
        else stop();
      } else start();
    };
    const setInteractive=()=>{canvas.style.touchAction="none";}; // (Adım 7: her zaman none)
    return {api,destroy,setPaused,setInteractive,renderOnce};
  }catch(err){
    disposed=true;
    teardown();
    throw err;
  }
}

// paused: true iken render döngüsü durur (son kare ekranda kalır)
// interactive: (eski) — Adım 7'den beri tuval her zaman dokunma hareketlerini yutar (touch-action:none)
// day: gündüz sahnesi (yalnız kurulumda okunur; kilit an kullanır)
function Pitch3D({camera,onCameraChange,onReady,onError,height=220,showControls=true,paused=false,interactive=false,controlsAt="top",day=false,venue=null}){
  const mountRef=useRef(null);
  const venueRef=useRef(venue);   // stadyum/çim/ışık varyasyonu (yalnız kurulumda okunur)
  venueRef.current=venue;
  const instRef=useRef(null);
  const [innerCam,setInnerCam]=useState("broadcast");
  const camMode=camera||innerCam;
  const camModeRef=useRef(camMode);
  camModeRef.current=camMode;
  const cbRef=useRef({onReady,onError});
  cbRef.current={onReady,onError};
  const pausedRef=useRef(paused);
  pausedRef.current=paused;
  const interactiveRef=useRef(interactive);
  interactiveRef.current=interactive;
  const [status,setStatus]=useState("loading"); // loading | ready | error
  const [errMsg,setErrMsg]=useState("");

  useEffect(()=>{
    let cancelled=false, inst=null;
    const fail=(msg,err)=>{
      if(cancelled) return;
      if(err) console.warn("[Pitch3D]",err);
      setErrMsg(msg); setStatus("error");
      if(inst){inst.destroy();inst=null;instRef.current=null;}
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
          paused:pausedRef.current,
          interactive:interactiveRef.current,
          day:!!day,
          venue:venueRef.current||null,
          onContextLost:()=>fail("3D grafik bağlamı kaybedildi. Bölümü kapatıp yeniden açmayı dene."),
          // destroy'u render çağrısının dışında yap (döngü zaten durdu)
          onRenderError:(err)=>setTimeout(()=>fail("3D çizimde bir hata oluştu; 3D görünüm kapatıldı. 2D saha çalışmaya devam ediyor.",err),0),
        });
      }catch(err){
        fail("3D görünüm başlatılamadı. 2D saha çalışmaya devam ediyor.",err);
        return;
      }
      instRef.current=inst;
      setStatus("ready");
      try{cbRef.current.onReady&&cbRef.current.onReady(inst.api);}catch(e){console.error("[Pitch3D] onReady hatası",e);}
      // Duraklatılmış kurulduysa onReady'de eklenen nesneler de görünsün
      if(inst&&pausedRef.current) inst.renderOnce();
    }).catch(err=>{
      fail("3D kütüphanesi yüklenemedi (internet bağlantını kontrol et). 2D saha çalışmaya devam ediyor.",err);
    });
    return ()=>{cancelled=true; instRef.current=null; if(inst){inst.destroy();inst=null;}};
  },[]);

  useEffect(()=>{ if(instRef.current) instRef.current.setPaused(paused); },[paused]);
  useEffect(()=>{ if(instRef.current) instRef.current.setInteractive(interactive); },[interactive]);

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
      {showControls&&status==="ready"&&<div style={{position:"absolute",...(controlsAt==="bottom"?{bottom:5}:{top:5}),right:5,
        display:"flex",flexWrap:"wrap",justifyContent:"flex-end",maxWidth:"calc(100% - 10px)",gap:3,zIndex:2}}>
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
