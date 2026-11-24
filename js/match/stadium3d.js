// ═══════════════════════════════════════════════════════════════
// 3D STADYUM — basamaklı tribünler, taraftarlar, projektörler, panolar, kulübeler
// ═══════════════════════════════════════════════════════════════
// buildStadium3D(THREE,o) → {group, update(dt), crowd, dispose}
//   o.day (isteğe bağlı): gündüz İngiliz tarzı — 4 tribün (köşeler açık), ince çelik dikmeli
//   oluklu metal çatı (map + bumpMap), tuğla arka duvar, köşe boşluklarında ağaçlar (day3d.js),
//   projektör/hale YOK, kırmızı/mavi/beyaz/sarı taraftarlar, canlı renkli panolar. Gölge alır/verir.
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
// Gündüz panoları (NSM tarzı parlak, düz renk + basit amblem; hepsi uydurma marka):
//   [ad, üst renk, alt renk, yazı, amblem: "bolt" şimşek | "star" yıldız | "ring" halka | "chev" ok]
const STADIUM3D_BRANDS_DAY=[
  ["LEGGIT","#ff7a00","#f25500","#ffffff","chev"],["GLORY","#7c3aed","#5b21b6","#ffd60a","star"],
  ["TURBO","#ff1f3d","#c8001e","#ffffff","bolt"],["MAVİ HAVA","#1fa2ff","#0b5fd6","#ffffff","ring"],
  ["LEGGIT","#18c964","#0c9a49","#ffffff","chev"],["YILDIZ BANK","#ffd60a","#f5a300","#10131a","star"],
  ["TURBO","#111827","#000000","#ff3b30","bolt"],["GLORY","#ffffff","#e5edf7","#5b21b6","star"],
];
const STADIUM3D_FAN_COLS={
  home:[0x2485ff,0x2485ff,0x1a5fc4,0xf2f2f2,0x5aa8ff,0x2485ff],
  away:[0xd93a3a,0xd93a3a,0x9e2424,0x1b1b24,0xf2f2f2,0xd93a3a],
  neutral:[0x6b7280,0x374151,0x9ca3af,0x4b5563,0x2f3e2f],
  skin:[0xe0b48c,0xd9a77f,0xc8946a,0x8d5a3b,0xf0c9a2],
};
// Gündüz taraftar renkleri: kırmızı / mavi / beyaz / sarı (bizim mavi-beyaz-sarı, rakip kırmızı-beyaz-sarı)
const STADIUM3D_FAN_COLS_DAY={
  home:[0x2563eb,0x1d4ed8,0xf8fafc,0x2563eb,0xfacc15,0x3b82f6],
  away:[0xdc2626,0xb91c1c,0xf8fafc,0xdc2626,0xfacc15,0xef4444],
  neutral:[0xf8fafc,0xfacc15,0x2563eb,0xdc2626,0xe5e7eb],
  skin:STADIUM3D_FAN_COLS.skin,
};

// 0xRRGGBB rengini k (0–1) ile koyulaştırır (vertex rengi AO için)
function stadium3dShade(hex,k){
  const f=Math.max(0,Math.min(1,k));
  return (Math.round(((hex>>16)&255)*f)<<16)|(Math.round(((hex>>8)&255)*f)<<8)|Math.round((hex&255)*f);
}

function buildStadium3D(THREE,o){
  const day=!!(o&&o.day);
  const FAN=day?STADIUM3D_FAN_COLS_DAY:STADIUM3D_FAN_COLS;
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
  const sections=day?[
    // Gündüz: dört ayrı kapalı tribün, köşeler AÇIK (aralıklardan ağaçlar görünür)
    // Adım 17: daha yüksek/derin (vuruş kamerasında kale arkası çatı + tribün kadrajı doldurur)
    {axis:"z", sign:-1, start:H+7.5, rows:18, len:110, base:0.9},   // uzak uzun tribün
    {axis:"z", sign: 1, start:H+7.5, rows:15, len:110, base:0.9},   // yakın uzun tribün
    {axis:"x", sign:-1, start:L+9.5, rows:15, len:64,  base:0.7},   // bizim kale arkası
    {axis:"x", sign: 1, start:L+9.5, rows:15, len:64,  base:0.7},   // rakip kale arkası
  ]:[
    {axis:"z", sign:-1, start:H+7.5, rows:13, len:150, base:0.9},   // uzak uzun tribün
    {axis:"x", sign:-1, start:L+9.5, rows:9,  len:86,  base:0.7},   // bizim kale arkası
    {axis:"x", sign: 1, start:L+9.5, rows:9,  len:86,  base:0.7},   // rakip kale arkası
  ];
  const roofQuads=[];   // gündüz çatıları (uv'li dörtgenler → tek mesh)
  const roofLamps=[];   // gündüz çatı altı lambaları (tek mesh)
  const risers=[];      // gündüz basamak alınları (seyirci dokusu, tek mesh)
  const aoQuads=[];     // gündüz çatı altı / arka duvar fake AO dörtgenleri (tek mesh)
  const standParts=[];
  const seats=[]; // {x,y,z,ry,sec,row,col}
  const SEAT=0.84;
  sections.forEach((s,si)=>{
    for(let r=0;r<s.rows;r++){
      const top=s.base+RISE*(r+1), off=s.start+TREAD*(r+0.5);
      // Gündüz: beton basamak; çatı altında arka sıralara doğru koyulaşır (fake AO, vertex rengi)
      const shade=day?stadium3dShade(r%2?0x8e949c:0x9ea4ab,1-0.42*Math.pow(r/Math.max(1,s.rows-1),1.3)):(r%2?0x2a3644:0x313f4f);
      if(day) risers.push({s,r,top,off});
      // Basamak: zeminden basamak üstüne dolu blok
      if(s.axis==="z") standParts.push({g:box(s.len,top,TREAD,0,top/2,s.sign*off),c:shade});
      else standParts.push({g:box(TREAD,top,s.len,s.sign*off,top/2,0),c:shade});
      // Koltuk sırası
      const n=Math.floor((s.len-4)/SEAT);
      for(let k=0;k<n;k++){
        const u=(k-(n-1)/2)*SEAT+(rand()-0.5)*0.12;
        if(Math.abs(u)<1.2&&r>s.rows-4) continue; // merdiven boşluğu (üst sıralar)
        if(day&&r>=9&&rand()<0.38) continue;       // gündüz üst sıralar seyrek (çizim yükü sınırlı, doğal boşluklar)
        if(s.axis==="z") seats.push({x:u,y:top,z:s.sign*off,ry:s.sign<0?0:Math.PI,sec:si,row:r,col:k});
        else seats.push({x:s.sign*off,y:top,z:u,ry:s.sign<0?Math.PI/2:-Math.PI/2,sec:si,row:r,col:k});
      }
    }
    // Arka duvar + çatı (eğik saçak)
    const back=s.start+TREAD*s.rows+0.6, topH=s.base+RISE*s.rows;
    if(day){
      // İngiliz tarzı kapalı tribün: tuğla arka duvar, öne doğru hafif yükselen oluklu çatı,
      //   ön kenarda ince çelik dikmeler + beyaz saçak kirişi. P(off,y,along) → dünya [x,y,z]
      const P=(off,y,al)=>s.axis==="z"?[al,y,s.sign*off]:[s.sign*off,y,al];
      const yB=topH+5.0, yF=topH+6.8, fOff=s.start-4.5, hl=s.len/2+1;   // Adım 17: geniş saçak (çatı altı görünür)
      const wall=s.axis==="z"?box(s.len+2,yB,1.2,0,yB/2,s.sign*back):box(1.2,yB,s.len+2,s.sign*back,yB/2,0);
      standParts.push({g:wall,c:0x8b4a3c});
      // Yan duvarlar (tribünün iki ucu): kesit kapalı görünsün
      [-1,1].forEach(e=>{
        const al=e*(s.len/2+0.5), mid=(fOff+back)/2, dep=back-fOff;
        standParts.push({g:s.axis==="z"?box(1.0,yB*0.55,dep,al,yB*0.275,s.sign*mid):box(dep,yB*0.55,1.0,s.sign*mid,yB*0.275,al),c:0x7c4135});
      });
      roofQuads.push({a:P(fOff,yF,-hl),b:P(fOff,yF,hl),c:P(back+0.8,yB,hl),d:P(back+0.8,yB,-hl),len:hl*2,dep:back+0.8-fOff});
      // Fake AO: çatının hemen altında koyu gradyan (ön saçakta saydam → arka duvarda koyu) +
      //   arka duvarın sahaya bakan yüzünde üst sıraların arkası (çatı birleşimi koyu)
      aoQuads.push({a:P(fOff,yF-0.12,-hl),b:P(fOff,yF-0.12,hl),c:P(back+0.8,yB-0.12,hl),d:P(back+0.8,yB-0.12,-hl),v0:0,v1:1});
      const wf=back-0.62;   // duvarın ön yüzü (kalınlık 1.2) önünde
      aoQuads.push({a:P(wf,topH-0.2,-s.len/2),b:P(wf,topH-0.2,s.len/2),c:P(wf,yB-0.1,s.len/2),d:P(wf,yB-0.1,-s.len/2),v0:0.15,v1:1});
      // Saçak kirişi (ön kenar) + dikmeler (her ~14 m)
      standParts.push({g:s.axis==="z"?box(s.len+2,0.7,0.35,0,yF-0.3,s.sign*fOff):box(0.35,0.7,s.len+2,s.sign*fOff,yF-0.3,0),c:0xe9edf1});
      // Çatı makasları (alttan bakınca derinlik): ön kirişten arka duvara eğik kirişler
      const nT=Math.max(3,Math.round(s.len/7)), tl=Math.hypot(back+0.8-fOff,yF-yB);
      for(let k=0;k<=nT;k++){
        const al=-s.len/2+k*(s.len/nT), mo=(fOff+back+0.8)/2, my=(yF+yB)/2-0.45;
        const tr=s.axis==="z"?new THREE.BoxGeometry(0.22,0.6,tl):new THREE.BoxGeometry(tl,0.6,0.22);
        if(s.axis==="z") tr.rotateX(s.sign*Math.atan2(yF-yB,back+0.8-fOff)); else tr.rotateZ(-s.sign*Math.atan2(yF-yB,back+0.8-fOff));
        const p=P(mo,my,al); tr.translate(p[0],p[1],p[2]);
        standParts.push({g:tr,c:0x5d6873});
      }
      // Çatı altı projektörleri: ön kirişin altında ~3.2 m'de bir parlak lamba (tek MeshBasic mesh)
      const nL=Math.max(4,Math.round(s.len/3.2));
      for(let k=0;k<nL;k++){
        const al=-s.len/2+(k+0.5)*(s.len/nL), p=P(fOff+1.1,yF-0.85,al);
        roofLamps.push({g:s.axis==="z"?box(1.1,0.18,0.5,p[0],p[1],p[2]):box(0.5,0.18,1.1,p[0],p[1],p[2]),c:0xfff3d6});
      }
      const nC=Math.max(2,Math.round(s.len/14));
      for(let k=0;k<=nC;k++){
        // Dikmeler tribün ön kenarında (geniş saçak konsol; ad panoları/kale arkası görüşü kapanmasın)
        const co=s.start+0.3, ch=yF-(yF-yB)*(co-fOff)/(back+0.8-fOff);
        const al=-s.len/2+k*(s.len/nC), p=P(co,ch/2,al);
        const col=new THREE.CylinderGeometry(0.14,0.16,ch,6); col.translate(p[0],p[1],p[2]);
        standParts.push({g:col,c:0x9aa3ad});
      }
    } else if(s.axis==="z"){
      standParts.push({g:box(s.len+2,topH+9,1.2,0,(topH+9)/2,s.sign*back),c:0x1c2531});
      const roof=new THREE.BoxGeometry(s.len+4,0.5,TREAD*s.rows*0.8); roof.rotateX(-s.sign*0.12); roof.translate(0,topH+8.5,s.sign*(back-TREAD*s.rows*0.38));
      standParts.push({g:roof,c:0x3a4656});
    } else {
      standParts.push({g:box(1.2,topH+6,s.len+2,s.sign*back,(topH+6)/2,0),c:0x1c2531});
    }
  });
  // Köşe dolguları (uzak köşeler): tribün kesintisiz görünsün
  if(!day) [-1,1].forEach(sx=>standParts.push({g:box(14,6,16,sx*(L+16),3,-(H+15)),c:0x26313d}));

  // ── Projektörler: 4 kule (uzak köşeler yüksek, yakın köşeler kamera dışında) ──
  const towers=[[-74,-(H+26)],[74,-(H+26)],[-78,H+30],[78,H+30]];
  const lampFaces=[], glowPts=[];
  if(!day) towers.forEach(([x,z])=>{   // gündüz: projektör yok
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
  let trees=null;
  if(day){
    stand.castShadow=true; stand.receiveShadow=true;
    // Oluklu çatılar: tek mesh (uv: boyda 1 m'de bir oluk), map + bumpMap aynı tuval, iki yüzlü
    const pos=[], uvs=[];
    roofQuads.forEach(q=>{
      const u=q.len/1.0, v=q.dep/6;
      pos.push(...q.a,...q.b,...q.c, ...q.a,...q.c,...q.d);
      uvs.push(0,0,u,0,u,v, 0,0,u,v,0,v);
    });
    const rg=G(new THREE.BufferGeometry());
    rg.setAttribute("position",new THREE.Float32BufferAttribute(pos,3));
    rg.setAttribute("uv",new THREE.Float32BufferAttribute(uvs,2));
    rg.computeVertexNormals();
    const rt=day3dTex(THREE,"roof",4), rb=day3dTex(THREE,"roof",4);
    if(rt) owned.texs.push(rt);
    if(rb) owned.texs.push(rb);
    const roofMat=M(new THREE.MeshPhongMaterial({color:0xc4cad1,map:rt||null,bumpMap:rb||null,bumpScale:0.6,
      specular:0x5a5f66,shininess:30,side:THREE.DoubleSide}));
    const roof=new THREE.Mesh(rg,roofMat); roof.name="roofs"; roof.castShadow=true; roof.receiveShadow=true;
    group.add(roof);
    if(roofLamps.length){
      const lm=new THREE.Mesh(G(mergeGeos3D(THREE,roofLamps)),M(new THREE.MeshBasicMaterial({vertexColors:true,fog:false})));
      lm.name="roofLamps"; group.add(lm);
    }
    // P2(bölüm, merkezden uzaklık, y, boyuna konum) → dünya [x,y,z]
    const P2=(s,off,y,al)=>s.axis==="z"?[al,y,s.sign*off]:[s.sign*off,y,al];
    // Seyirci dokusu: her basamağın sahaya bakan alnında (RISE yüksekliği) koltuk + taraftar deseni.
    //   3D taraftarların arasındaki boşluklar dolu bir tribün gibi görünür. Tek mesh; vertex rengi =
    //   basamak AO katsayısı (arka sıralar çatı altında koyu). u: 16 m'de bir doku tekrarı,
    //   v: dokunun 16 sırasından biri (komşu basamaklar farklı desen).
    if(risers.length){
      const pos=[], uvs=[], cols=[];
      risers.forEach(({s,r,top,off})=>{
        const f=off-TREAD/2-0.02, y0=Math.max(0.05,top-RISE), y1=top-0.04, hl=s.len/2-0.6;
        const a=P2(s,f,y0,-hl), b=P2(s,f,y0,hl), c=P2(s,f,y1,hl), d=P2(s,f,y1,-hl);
        const u=s.len/16, v0=(r%16)/16+0.004, v1=(r%16+1)/16-0.004;
        const k=1-0.5*Math.pow(r/Math.max(1,s.rows-1),1.3);
        pos.push(...a,...b,...c, ...a,...c,...d);
        uvs.push(0,v0,u,v0,u,v1, 0,v0,u,v1,0,v1);
        for(let i=0;i<6;i++) cols.push(k,k,k);
      });
      const rg2=G(new THREE.BufferGeometry());
      rg2.setAttribute("position",new THREE.Float32BufferAttribute(pos,3));
      rg2.setAttribute("uv",new THREE.Float32BufferAttribute(uvs,2));
      rg2.setAttribute("color",new THREE.Float32BufferAttribute(cols,3));
      rg2.computeVertexNormals();
      const ct=day3dTex(THREE,"crowd",4);
      if(ct){
        owned.texs.push(ct);
        const rm=new THREE.Mesh(rg2,M(new THREE.MeshLambertMaterial({map:ct,vertexColors:true,side:THREE.DoubleSide})));
        rm.name="crowdRisers"; rm.receiveShadow=true; group.add(rm);
      }
    }
    // Çatı altı + arka duvar fake AO: siyaha yakın, alphaMap gradyanlı, saydam (tek mesh)
    if(aoQuads.length){
      const pos=[], uvs=[];
      aoQuads.forEach(q=>{
        pos.push(...q.a,...q.b,...q.c, ...q.a,...q.c,...q.d);
        uvs.push(0,q.v0,1,q.v0,1,q.v1, 0,q.v0,1,q.v1,0,q.v1);
      });
      const ag=G(new THREE.BufferGeometry());
      ag.setAttribute("position",new THREE.Float32BufferAttribute(pos,3));
      ag.setAttribute("uv",new THREE.Float32BufferAttribute(uvs,2));
      ag.computeVertexNormals();
      const at=day3dTex(THREE,"ao");
      if(at){
        at.wrapS=at.wrapT=THREE.ClampToEdgeWrapping; owned.texs.push(at);
        const am=new THREE.Mesh(ag,M(new THREE.MeshBasicMaterial({color:0x04070c,alphaMap:at,transparent:true,opacity:0.78,
          depthWrite:false,side:THREE.DoubleSide})));
        am.name="roofAO"; am.renderOrder=1; group.add(am);
      }
    }
    // Ağaçlar: köşe boşluklarında kümeler + kale arkası/yan tribünlerin gerisinde sıralar (tek InstancedMesh)
    const tp=[];
    // Köşe kümeleri köşe tribün modüllerinin (aşağıda) arkasında başlar
    [-1,1].forEach(sx=>[-1,1].forEach(sz=>{
      for(let k=0;k<7;k++) tp.push([sx*(70+rand()*24),sz*(52+rand()*22),1.0+rand()*0.6]);
    }));
    [-1,1].forEach(sx=>{ for(let k=0;k<8;k++) tp.push([sx*(92+rand()*10),-40+k*11+(rand()-0.5)*4,1.2+rand()*0.5]); });
    [-1,1].forEach(sz=>{ for(let k=0;k<10;k++) tp.push([-58+k*13+(rand()-0.5)*4,sz*(68+rand()*8),1.2+rand()*0.5]); });
    trees=day3dTrees(THREE,tp);
    if(trees){ owned.geos.push(trees.geometry); owned.mats.push(trees.material); group.add(trees); }
    // Hazır modeller (assets3d.js; gelmezse prosedürel kalır, köşeler açık kalır):
    //   tree.glb → ağaçlar (prosedürel ağaçların konum/ölçek/tonları aynen), stadium.glb → dört açık
    //   köşede sahaya dönük çatılı küçük tribün modülü
    const isAlive=(o&&o.isAlive)||(()=>true), onAsset=(o&&o.onAsset)||(()=>{});
    if(typeof assets3dApplyTrees==="function"&&trees){
      assets3dApplyTrees(THREE,group,trees,10.5,isAlive).then(ok=>{ if(ok) onAsset(); }).catch(()=>{});
    }
    if(typeof assets3dApplyStands==="function"){
      const cs=[];
      [-1,1].forEach(sx=>[-1,1].forEach(sz=>{ const x=sx*64, z=sz*45; cs.push([x,z,Math.atan2(x,z),18]); }));
      assets3dApplyStands(THREE,group,cs,isAlive).then(ok=>{ if(ok) onAsset(); }).catch(()=>{});
    }
  } else {
    const lampMat=M(new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.DoubleSide}));
    group.add(new THREE.Mesh(G(mergeGeos3D(THREE,lampFaces)),lampMat));
  }
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
  if(!day){   // projektör parıltısı/halesi yalnız gece
  const glowGeo=G(new THREE.BufferGeometry());
  glowGeo.setAttribute("position",new THREE.Float32BufferAttribute(glowPts,3));
  const glowMat=M(new THREE.PointsMaterial({map:glowTex,size:26,sizeAttenuation:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,color:0xfff6d8,fog:false}));
  const glow=new THREE.Points(glowGeo,glowMat); glow.frustumCulled=false; group.add(glow);
  // Gece atmosferi: projektörlerin geniş, sönük halesi (aynı doku + konumlar; toplamsal, 1 çizim)
  const haloMat=M(new THREE.PointsMaterial({map:glowTex,size:110,sizeAttenuation:true,transparent:true,opacity:0.32,
    depthWrite:false,blending:THREE.AdditiveBlending,color:0xffe8b8,fog:false}));
  const halo=new THREE.Points(glowGeo,haloMat); halo.frustumCulled=false; halo.renderOrder=-5; group.add(halo);
  }

  // ── Reklam panoları (LED: doku yavaşça kayar) ──
  const adTex=(()=>{
    const cv=document.createElement("canvas"); cv.width=day?2048:1024; cv.height=day?128:64;
    const ctx=cv.getContext("2d");
    if(ctx&&day){
      const w=cv.width/STADIUM3D_BRANDS_DAY.length, h=cv.height;
      // Amblem (kurgusal, basit geometrik): merkez (x,y), yarıçap r, renk fg
      const emblem=(kind,x,y,r,fg)=>{
        ctx.save(); ctx.fillStyle=fg; ctx.strokeStyle=fg; ctx.lineWidth=r*0.3; ctx.beginPath();
        if(kind==="bolt"){ ctx.moveTo(x+r*0.25,y-r); ctx.lineTo(x-r*0.55,y+r*0.12); ctx.lineTo(x-r*0.02,y+r*0.12);
          ctx.lineTo(x-r*0.3,y+r); ctx.lineTo(x+r*0.6,y-r*0.2); ctx.lineTo(x+r*0.05,y-r*0.2); ctx.closePath(); ctx.fill(); }
        else if(kind==="star"){ for(let k=0;k<10;k++){ const a=-Math.PI/2+k*Math.PI/5, rr=k%2?r*0.45:r; ctx.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr); } ctx.closePath(); ctx.fill(); }
        else if(kind==="ring"){ ctx.arc(x,y,r*0.78,0,Math.PI*2); ctx.stroke(); ctx.beginPath(); ctx.arc(x,y,r*0.3,0,Math.PI*2); ctx.fill(); }
        else { ctx.moveTo(x-r*0.7,y-r*0.8); ctx.lineTo(x+r*0.1,y-r*0.8); ctx.lineTo(x+r*0.8,y); ctx.lineTo(x+r*0.1,y+r*0.8);
          ctx.lineTo(x-r*0.7,y+r*0.8); ctx.lineTo(x,y); ctx.closePath(); ctx.fill(); }
        ctx.restore();
      };
      STADIUM3D_BRANDS_DAY.forEach(([name,c1,c2,fg,em],i)=>{
        const gr=ctx.createLinearGradient(i*w,0,i*w,h); gr.addColorStop(0,c1); gr.addColorStop(1,c2);
        ctx.fillStyle=gr; ctx.fillRect(i*w,0,w,h);
        ctx.fillStyle="rgba(255,255,255,.22)"; ctx.fillRect(i*w,0,w,h*0.12);           // üst parlama şeridi
        ctx.fillStyle="rgba(0,0,0,.18)"; ctx.fillRect(i*w,h*0.9,w,h*0.1);               // alt gölge şeridi
        ctx.fillStyle="rgba(0,0,0,.25)"; ctx.fillRect(i*w+w-3,0,3,h);                   // panolar arası ek yeri
        // Kalın italik yazı + amblem, birlikte ortalanır
        ctx.font="italic 900 72px sans-serif"; ctx.textAlign="left"; ctx.textBaseline="middle";
        const er=h*0.3, gap=er*0.7, tw=Math.min(ctx.measureText(name).width,w-er*2-gap-40);
        const x0=i*w+(w-(er*2+gap+tw))/2;
        emblem(em,x0+er,h/2+2,er,fg);
        ctx.lineWidth=6; ctx.strokeStyle="rgba(0,0,0,.28)"; ctx.strokeText(name,x0+er*2+gap,h/2+4,tw);
        ctx.fillStyle=fg; ctx.fillText(name,x0+er*2+gap,h/2+4,tw);
      });
    } else if(ctx){
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
  if(day) adMat.toneMapped=false;   // LED pano: ACES film tonu parlak renkleri soldurmasın
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
    col.setHex(FAN.skin[Math.floor(selfR[i]*997)%FAN.skin.length]);
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
      const pal=team===0?FAN.home:team===1?FAN.away:FAN.neutral;
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
    [bodies,heads,arms,trees].forEach(m=>{ try{ m&&m.dispose(); }catch(e){} });
    // Sonradan gelen hazır modeller (glbStand / glbTrees) owned listelerinde değil
    group.children.filter(c=>/^glb/.test(c.name)).forEach(c=>{ group.remove(c); disposeObject3D(c); });
    if(group.parent) group.parent.remove(group);
    group.clear();
    owned.geos.forEach(g=>{ try{ g.dispose(); }catch(e){} });
    owned.texs.forEach(x=>{ try{ x.dispose(); }catch(e){} });
    owned.mats.forEach(m=>{ try{ m.dispose(); }catch(e){} });
    owned.geos.length=0; owned.texs.length=0; owned.mats.length=0;
  };
  return {group,update,dispose,fans:N,crowd:{setSupport,excite,getLevels:()=>({home:ex.h,away:ex.a})}};
}
