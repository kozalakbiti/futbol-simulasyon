// ═══════════════════════════════════════════════════════════════
// 3D STADYUM — basamaklı tribünler, taraftarlar, projektörler, panolar, kulübeler
// ═══════════════════════════════════════════════════════════════
// buildStadium3D(THREE) → {group, update(dt), crowd, dispose}
//   group: sahneye eklenir (Pitch3D groups.pitch içine). Unmount'ta
//          disposeObject3D(scene) her şeyi serbest bırakır; dispose() de var.
//   crowd.setSupport(s)            → s: tribündeki BİZİM taraftar payı (0–1).
//                                    Ev sahibi çoğunlukta olsun: ev maçında ~0.74.
//   crowd.excite(team,level,sec)   → team "home" (bizim taraftar) | "away" | "both";
//                                    level 0–1: 0.3 kıpırdanma, 0.6 ayağa kalkma,
//                                    1 zıplayarak sevinç. sec sonra sakinleşir.
//   update(dt)                     → Pitch3D kare döngüsü çağırır (yalnızca uniform).
// Performans: binlerce taraftar 3 InstancedMesh (gövde, baş, kol) = 3 çizim çağrısı.
//   Oturma/ayağa kalkma/zıplama vertex shader'da (onBeforeCompile) yapılır:
//   kare başına CPU'da yalnızca 4 uniform yazılır, matris yüklenmez.
//   Tribün basamakları + çatı + projektör direkleri tek birleşik mesh'tir.
// Tüm marka adları uydurmadır.
// ═══════════════════════════════════════════════════════════════

const STADIUM3D_BRANDS=[
  ["KOZA ENERJİ","#0d3b66","#faf0ca"],["MAVİ HAVA","#1d4ed8","#ffffff"],["ATLAS GIDA","#b91c1c","#fff7e6"],
  ["YILDIZ BANK","#111827","#facc15"],["RÜZGAR SPOR","#047857","#ecfdf5"],["GLORY ROAD","#7c3aed","#ffffff"],
  ["DENİZ KARGO","#0e7490","#e0f2fe"],["ÇINAR SÜT","#f8fafc","#166534"],
];
// Taraftar formaları: bizim (mavi/beyaz) · rakip (kırmızı/siyah) · tarafsız
const STADIUM3D_FAN_COLS={
  home:[0x2485ff,0x2485ff,0x1a5fc4,0xf2f2f2,0x5aa8ff,0x2485ff],
  away:[0xd93a3a,0xd93a3a,0x9e2424,0x1b1b24,0xf2f2f2,0xd93a3a],
  neutral:[0x6b7280,0x374151,0x9ca3af,0x4b5563,0x2f3e2f],
  skin:[0xe0b48c,0xd9a77f,0xc8946a,0x8d5a3b,0xf0c9a2],
};

function buildStadium3D(THREE){
  const D=PITCH3D_DIM, L=D.halfLen, H=D.halfWid;
  const group=new THREE.Group(); group.name="stadium";
  const owned={geos:[],mats:[],texs:[]};
  const G=(g)=>{ owned.geos.push(g); return g; };
  const M=(m)=>{ owned.mats.push(m); return m; };
  const box=(w,h,d,x,y,z,ry)=>{ const g=new THREE.BoxGeometry(w,h,d); if(ry) g.rotateY(ry); g.translate(x,y,z); return g; };
  const rand=(()=>{ let s=1337; return ()=>{ s=(s*16807)%2147483647; return (s-1)/2147483646; }; })(); // tekrarlanabilir

  // ── Tribün yerleşimi: her bölüm basamak listesi + yön ──
  // Uzak uzun tribün (−Z), iki kale arkası (±X). Yakın taraf yayın kamerası için açık.
  const RISE=0.62, TREAD=1.25;
  const sections=[
    {axis:"z", sign:-1, start:H+7.5, rows:13, len:150, base:0.9},   // uzak uzun tribün
    {axis:"x", sign:-1, start:L+9.5, rows:9,  len:86,  base:0.7},   // bizim kale arkası
    {axis:"x", sign: 1, start:L+9.5, rows:9,  len:86,  base:0.7},   // rakip kale arkası
  ];
  const standParts=[];
  const seats=[]; // {x,y,z,ry,sec,row,col}
  const SEAT=0.84;
  sections.forEach((s,si)=>{
    for(let r=0;r<s.rows;r++){
      const top=s.base+RISE*(r+1), off=s.start+TREAD*(r+0.5);
      const shade=r%2?0x2a3644:0x313f4f;
      // Basamak: zeminden basamak üstüne dolu blok
      if(s.axis==="z") standParts.push({g:box(s.len,top,TREAD,0,top/2,s.sign*off),c:shade});
      else standParts.push({g:box(TREAD,top,s.len,s.sign*off,top/2,0),c:shade});
      // Koltuk sırası
      const n=Math.floor((s.len-4)/SEAT);
      for(let k=0;k<n;k++){
        const u=(k-(n-1)/2)*SEAT+(rand()-0.5)*0.12;
        if(Math.abs(u)<1.2&&r>s.rows-4) continue; // merdiven boşluğu (üst sıralar)
        if(s.axis==="z") seats.push({x:u,y:top,z:s.sign*off,ry:s.sign<0?0:Math.PI,sec:si,row:r,col:k});
        else seats.push({x:s.sign*off,y:top,z:u,ry:s.sign<0?Math.PI/2:-Math.PI/2,sec:si,row:r,col:k});
      }
    }
    // Arka duvar + çatı (eğik saçak)
    const back=s.start+TREAD*s.rows+0.6, topH=s.base+RISE*s.rows;
    if(s.axis==="z"){
      standParts.push({g:box(s.len+2,topH+9,1.2,0,(topH+9)/2,s.sign*back),c:0x1c2531});
      const roof=new THREE.BoxGeometry(s.len+4,0.5,TREAD*s.rows*0.8); roof.rotateX(-s.sign*0.12); roof.translate(0,topH+8.5,s.sign*(back-TREAD*s.rows*0.38));
      standParts.push({g:roof,c:0x3a4656});
    } else {
      standParts.push({g:box(1.2,topH+6,s.len+2,s.sign*back,(topH+6)/2,0),c:0x1c2531});
    }
  });
  // Köşe dolguları (uzak köşeler): tribün kesintisiz görünsün
  [-1,1].forEach(sx=>standParts.push({g:box(14,6,16,sx*(L+16),3,-(H+15)),c:0x26313d}));

  // ── Projektörler: 4 kule (uzak köşeler yüksek, yakın köşeler kamera dışında) ──
  const towers=[[-74,-(H+26)],[74,-(H+26)],[-78,H+30],[78,H+30]];
  const lampFaces=[], glowPts=[];
  towers.forEach(([x,z])=>{
    const hgt=40;
    const pole=new THREE.CylinderGeometry(0.45,0.8,hgt,8); pole.translate(x,hgt/2,z);
    standParts.push({g:pole,c:0x4b5563});
    // Lamba paneli: sahaya dönük, aşağı eğik
    const ry=Math.atan2(-x,-z);
    const panel=new THREE.BoxGeometry(7,4,0.6); panel.rotateX(0.5); panel.rotateY(ry); panel.translate(x,hgt+1.5,z);
    standParts.push({g:panel,c:0x2b2f36});
    const face=new THREE.PlaneGeometry(6.4,3.4); face.rotateX(0.5); face.rotateY(ry);
    const fx=Math.sin(ry)*0.35, fz=Math.cos(ry)*0.35;
    face.translate(x+fx,hgt+1.5,z+fz);
    lampFaces.push({g:face,c:0xfffbe6});
    glowPts.push(x+fx*3,hgt+1.5,z+fz*3);
  });

  // ── Yedek kulübeleri (uzak taç çizgisi, orta çizginin iki yanı) ──
  const benchZ=-(H+2.7);
  [-1,1].forEach(sx=>{
    const cx=sx*11, seatCol=sx<0?0x2485ff:0xd93a3a;
    standParts.push({g:box(8,0.25,1.6,cx,0.12,benchZ),c:0x3a3f47});            // taban
    standParts.push({g:box(8,1.1,0.12,cx,0.7,benchZ-0.8),c:0xdfe6ee});         // arka panel
    standParts.push({g:box(8,0.45,0.7,cx,0.45,benchZ-0.35),c:seatCol});        // koltuklar
    standParts.push({g:box(0.12,1.9,1.6,cx-4,0.95,benchZ),c:0xdfe6ee});        // yan paneller
    standParts.push({g:box(0.12,1.9,1.6,cx+4,0.95,benchZ),c:0xdfe6ee});
    const roof=new THREE.BoxGeometry(8.4,0.12,2.0); roof.rotateX(-0.12); roof.translate(cx,2.0,benchZ+0.1);
    standParts.push({g:roof,c:0xb8c6d4});
    // Teknik alan çizgisi
    standParts.push({g:box(9,0.03,0.12,cx,0.02,benchZ+1.4),c:0xf2f2f2});
    // Kulübede oturanlar (taraftar mantığıyla aynı örneklere eklenir: golde onlar da kalkar)
    for(let k=0;k<6;k++) seats.push({x:cx-3.2+k*1.28,y:0.25,z:benchZ-0.3,ry:0,sec:sx<0?10:11,row:0,col:k,bench:true});
  });

  const standMat=M(new THREE.MeshLambertMaterial({vertexColors:true}));
  const stand=new THREE.Mesh(G(mergeGeos3D(THREE,standParts)),standMat);
  stand.name="stands"; group.add(stand);
  const lampMat=M(new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.DoubleSide}));
  group.add(new THREE.Mesh(G(mergeGeos3D(THREE,lampFaces)),lampMat));
  // Projektör parıltısı: tek Points (4 nokta, toplamsal karışım)
  const glowTex=(()=>{
    const cv=document.createElement("canvas"); cv.width=64; cv.height=64;
    const ctx=cv.getContext("2d");
    const gr=ctx&&ctx.createRadialGradient?ctx.createRadialGradient(32,32,0,32,32,32):null;
    if(gr){
      gr.addColorStop(0,"rgba(255,252,235,1)"); gr.addColorStop(0.25,"rgba(255,245,200,0.55)"); gr.addColorStop(1,"rgba(255,240,190,0)");
      ctx.fillStyle=gr; ctx.fillRect(0,0,64,64);
    }
    const t=new THREE.CanvasTexture(cv); owned.texs.push(t); return t;
  })();
  const glowGeo=G(new THREE.BufferGeometry());
  glowGeo.setAttribute("position",new THREE.Float32BufferAttribute(glowPts,3));
  const glowMat=M(new THREE.PointsMaterial({map:glowTex,size:26,sizeAttenuation:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,color:0xfff6d8}));
  const glow=new THREE.Points(glowGeo,glowMat); glow.frustumCulled=false; group.add(glow);

  // ── Reklam panoları (LED: doku yavaşça kayar) ──
  const adTex=(()=>{
    const cv=document.createElement("canvas"); cv.width=1024; cv.height=64;
    const ctx=cv.getContext("2d");
    if(ctx){
      const w=cv.width/STADIUM3D_BRANDS.length;
      STADIUM3D_BRANDS.forEach(([name,bg,fg],i)=>{
        ctx.fillStyle=bg; ctx.fillRect(i*w,0,w,64);
        ctx.fillStyle=fg; ctx.font="bold 30px sans-serif"; ctx.textAlign="center"; ctx.textBaseline="middle";
        ctx.fillText(name,i*w+w/2,34,w-12);
      });
    }
    const t=new THREE.CanvasTexture(cv);
    t.wrapS=THREE.RepeatWrapping; t.minFilter=THREE.LinearFilter; t.generateMipmaps=false;
    owned.texs.push(t); return t;
  })();
  const adMat=M(new THREE.MeshBasicMaterial({map:adTex}));
  const boardBack=M(new THREE.MeshLambertMaterial({color:0x111827}));
  const BH=0.95, BOFF=4.6;
  // u ölçeği: 1 doku tekrarı ≈ 48 m (her marka ~6 m)
  const board=(len,x,z,ry)=>{
    const g=new THREE.PlaneGeometry(len,BH);
    const uv=g.attributes.uv; for(let i=0;i<uv.count;i++) uv.setX(i,uv.getX(i)*len/48);
    const m=new THREE.Mesh(G(g),adMat); m.position.set(x,BH/2+0.02,z); m.rotation.y=ry; group.add(m);
    const b=new THREE.Mesh(G(new THREE.BoxGeometry(len,BH,0.15)),boardBack);
    b.position.set(x-Math.sin(ry)*0.09,BH/2+0.02,z-Math.cos(ry)*0.09); b.rotation.y=ry; group.add(b);
  };
  board(PITCH3D_LEN+2*BOFF,0,-(H+BOFF),0);           // uzak taç (sahaya bakar: +Z)
  board(PITCH3D_LEN+2*BOFF,0,H+BOFF,Math.PI);        // yakın taç
  board(PITCH3D_WID+2*BOFF,-(L+BOFF+1.5),0,Math.PI/2);
  board(PITCH3D_WID+2*BOFF,L+BOFF+1.5,0,-Math.PI/2);

  // ── Taraftarlar: 3 InstancedMesh (gövde/baş/kol), shader animasyonu ──
  const N=seats.length;
  const bodyGeo=G(new THREE.BoxGeometry(0.5,1.05,0.36)); bodyGeo.translate(0,0.52,0);
  const headGeo=G(new THREE.OctahedronGeometry(0.2,0)); headGeo.translate(0,1.24,0);
  const armParts=[
    {g:box(0.13,0.72,0.13,0.29,1.32,0.02),c:0xffffff},
    {g:box(0.13,0.72,0.13,-0.29,1.32,0.02),c:0xffffff},
  ];
  const armGeo=G(mergeGeos3D(THREE,armParts)); armGeo.deleteAttribute("color");
  const fanAttr=new Float32Array(N*3); // x: faz, y: takım (0 bizim / 1 rakip / 0.5 tarafsız), z: coşku katsayısı
  const blockR=new Float32Array(N), selfR=new Float32Array(N);
  for(let i=0;i<N;i++){
    const s=seats[i];
    fanAttr[i*3]=rand(); fanAttr[i*3+2]=s.bench?0.7:0.65+rand()*0.6;
    // Kümelenme: 7 koltuk x 3 sıralık bloklar aynı takımı tutar (+%14 bireysel karışım)
    const bk=s.sec*1000+Math.floor(s.row/3)*100+Math.floor(s.col/7);
    blockR[i]=((Math.sin(bk*12.9898)*43758.5453)%1+1)%1;
    selfR[i]=rand();
  }
  // Tek paylaşılan öznitelik nesnesi → tek GPU tamponu (setSupport üç mesh'e birden yansır)
  const aFanAttr=new THREE.InstancedBufferAttribute(fanAttr,3);
  [bodyGeo,headGeo,armGeo].forEach(g=>g.setAttribute("aFan",aFanAttr));
  const uni={uTime:{value:0},uExH:{value:0.05},uExA:{value:0.05}};
  const crowdMat=(arms)=>{
    const m=new THREE.MeshLambertMaterial({color:0xffffff});
    m.onBeforeCompile=(sh)=>{
      sh.uniforms.uTime=uni.uTime; sh.uniforms.uExH=uni.uExH; sh.uniforms.uExA=uni.uExA;
      sh.vertexShader="attribute vec3 aFan;\nuniform float uTime;\nuniform float uExH;\nuniform float uExA;\n"+
        sh.vertexShader.replace("#include <begin_vertex>",[
          "#include <begin_vertex>",
          "float ex=clamp(mix(uExH,uExA,aFan.y)*aFan.z,0.0,1.0);",
          "float stand=smoothstep(0.22,0.55,ex);",
          // Oturan taraftar alçak (y bastırılır); ayağa kalkınca tam boy
          "transformed.y*=mix(0.64,1.0,stand);",
          arms?"transformed.y=mix(0.55,transformed.y,stand); transformed.xz*=mix(0.2,1.0,stand);":"",
          // Zıplama (yalnızca büyük coşkuda) + kıpırdanma
          "float hop=max(0.0,sin(uTime*(7.5+aFan.z*2.5)+aFan.x*6.2831));",
          "transformed.y+=hop*hop*0.5*smoothstep(0.62,1.0,ex);",
          "transformed.x+=sin(uTime*(1.1+aFan.x)+aFan.x*6.2831)*0.05*transformed.y*(0.4+ex);",
        ].join("\n"));
    };
    if(arms) m.customProgramCacheKey=()=>"crowdArms"; else m.customProgramCacheKey=()=>"crowdBody";
    return M(m);
  };
  const mkInst=(geo,mat)=>{
    const im=new THREE.InstancedMesh(geo,mat,N);
    im.frustumCulled=false; // örnekler tüm stadyuma yayılır (tek sınır küresi yetersiz)
    group.add(im); return im;
  };
  const bodyMat=crowdMat(false), armMat=crowdMat(true);
  // Baş: ten rengi (instanceColor) ama gövde ile aynı shader
  const headMat=crowdMat(false); headMat.customProgramCacheKey=()=>"crowdBody";
  const bodies=mkInst(bodyGeo,bodyMat), heads=mkInst(headGeo,headMat), arms=mkInst(armGeo,armMat);
  const mtx=new THREE.Matrix4(), q=new THREE.Quaternion(), pv=new THREE.Vector3(), sv=new THREE.Vector3(), up=new THREE.Vector3(0,1,0);
  const col=new THREE.Color();
  for(let i=0;i<N;i++){
    const s=seats[i], k=0.92+selfR[i]*0.16;
    q.setFromAxisAngle(up,s.ry+(selfR[i]-0.5)*0.25);
    pv.set(s.x,s.y,s.z); sv.set(k,k*(0.94+blockR[i]*0.12),k);
    mtx.compose(pv,q,sv);
    bodies.setMatrixAt(i,mtx); heads.setMatrixAt(i,mtx); arms.setMatrixAt(i,mtx);
    col.setHex(STADIUM3D_FAN_COLS.skin[Math.floor(selfR[i]*997)%STADIUM3D_FAN_COLS.skin.length]);
    heads.setColorAt(i,col);
  }
  const setSupport=(share)=>{
    const s=Number.isFinite(share)?Math.max(0,Math.min(1,share)):0.5;
    for(let i=0;i<N;i++){
      const st=seats[i];
      let team;
      if(st.bench) team=st.sec===10?0:1;
      else if(selfR[i]<0.06) team=0.5;                                  // tarafsız
      else { const r=selfR[i]<0.2?(selfR[i]-0.06)/0.14:blockR[i]; team=r<s?0:1; }
      fanAttr[i*3+1]=team;
      const pal=team===0?STADIUM3D_FAN_COLS.home:team===1?STADIUM3D_FAN_COLS.away:STADIUM3D_FAN_COLS.neutral;
      col.setHex(pal[Math.floor(selfR[i]*7919+blockR[i]*13)%pal.length]);
      bodies.setColorAt(i,col); arms.setColorAt(i,col);
    }
    aFanAttr.needsUpdate=true;
    if(bodies.instanceColor) bodies.instanceColor.needsUpdate=true;
    if(arms.instanceColor) arms.instanceColor.needsUpdate=true;
  };
  setSupport(0.6);
  if(heads.instanceColor) heads.instanceColor.needsUpdate=true;

  // ── Coşku durumu ──
  const BASE=0.06;
  const ex={h:BASE,a:BASE,th:BASE,ta:BASE,uh:0,ua:0};
  const excite=(team,level,sec)=>{
    const lv=Math.max(0,Math.min(1,Number(level)||0)), until=Number.isFinite(sec)?sec:2;
    if(team==="home"||team==="both"){ if(lv>=ex.th||ex.uh<=0){ ex.th=Math.max(lv,BASE); ex.uh=until; } }
    if(team==="away"||team==="both"){ if(lv>=ex.ta||ex.ua<=0){ ex.ta=Math.max(lv,BASE); ex.ua=until; } }
  };
  let t=0;
  const update=(dt)=>{
    if(!(dt>0)) return;
    t+=dt; if(t>1e4) t-=1e4;
    if(ex.uh>0){ ex.uh-=dt; if(ex.uh<=0) ex.th=BASE; }
    if(ex.ua>0){ ex.ua-=dt; if(ex.ua<=0) ex.ta=BASE; }
    // Ayağa kalkış hızlı, oturuş yavaş
    const kh=1-Math.exp(-dt*(ex.th>ex.h?6:1.4)), ka=1-Math.exp(-dt*(ex.ta>ex.a?6:1.4));
    ex.h+=(ex.th-ex.h)*kh; ex.a+=(ex.ta-ex.a)*ka;
    uni.uTime.value=t; uni.uExH.value=ex.h; uni.uExA.value=ex.a;
    adTex.offset.x=(adTex.offset.x+dt*0.012)%1;
  };
  const dispose=()=>{
    [bodies,heads,arms].forEach(m=>{ try{ m.dispose(); }catch(e){} });
    if(group.parent) group.parent.remove(group);
    group.clear();
    owned.geos.forEach(g=>{ try{ g.dispose(); }catch(e){} });
    owned.texs.forEach(x=>{ try{ x.dispose(); }catch(e){} });
    owned.mats.forEach(m=>{ try{ m.dispose(); }catch(e){} });
    owned.geos.length=0; owned.texs.length=0; owned.mats.length=0;
  };
  return {group,update,dispose,fans:N,crowd:{setSupport,excite,getLevels:()=>({home:ex.h,away:ex.a})}};
}
