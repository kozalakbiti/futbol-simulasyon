// ═══════════════════════════════════════════════════════════════
// 3D ÇEVRE PEYZAJI — stadyumun dışı: park, çevre yolu, sokak lambaları, araçlar, konutlar, şehir silüeti
// ═══════════════════════════════════════════════════════════════
// buildLandscape3D(THREE,light) → Group. Gök kubbesinin (r=300) içinde ufka kadar her yönü kapatır:
//   kamera hangi açıya dönerse dönsün zemin ile gök arasında boş/beyaz bant kalmaz.
//   light: "noon" | "sunset" | "night". Sahneyle birlikte disposeObject3D temizler.
//   Duvar içi park (yürüyüş yolu, ağaç, bank, lamba) → çevre yolu (kaldırım, şerit, araç, lamba) → eğimli
//   çatılı konut sırası → katlı apartman/iş kulesi silüeti → tepeler. Hepsi birleşik/instanced (~14 çizim
//   çağrısı), kare başına iş yok. Gölgeler yere pişmiş yumuşak lekelerdir.
// Kamera menzili: yayın kamerası dikey ekranda z≈112 m'ye çekilir → duvar/bina bunun dışında kurulur.
const LANDSCAPE3D_PAL={
  noon:  {ground:[0x4a7a38,0x5d8f45],hill:[0x5f8a55,0x7fa083],wall:0xa58a76,cap:0xd8d0c4,roofs:[0x9a5540,0x7d4636,0x6d6f76,0xa8694a],
          house:[0xe6dac4,0xd9c3a0,0xcfd6d8,0xe2c9b4,0xbf8f76],tower:[0xb8c0c8,0xc9bda8,0x9fb0bd,0xd2cbbd,0xa98f7f],trim:0xf2ece0,base:0x8b8076,
          glass:[0x50718c,0x5d82a0,0x46637b],lit:0x7ea0b8,litP:0.15,road:0x55585c,walk:0xb4aea4,path:0xc7b594,line:0xe8e4d8,pole:0x3c4248,lamp:0xf4f0e0,shadow:0.26,tree:0xffffff,car:1},
  sunset:{ground:[0x56602f,0x6c6f3a],hill:[0x6b6148,0x9a7a62],wall:0x8a6650,cap:0xc09a7a,roofs:[0x7d4030,0x66382c,0x57505a,0x84503a],
          house:[0xd6ac84,0xc4946a,0xb9a293,0xcf9f7c,0x9f6a50],tower:[0xa58b80,0xb08d6e,0x8d7f82,0xb9987a,0x8c6a58],trim:0xe2bf98,base:0x6a584a,
          glass:[0x5a4a52,0x6b5560,0x4e424c],lit:0xffd489,litP:0.5,road:0x47413f,walk:0x8f7a68,path:0x9c8058,line:0xd8c29a,pole:0x2e2a2c,lamp:0xffe2a0,shadow:0.3,tree:0xd8a678,car:0.8},
  night: {ground:[0x14221a,0x1a2b20],hill:[0x121c24,0x1c2633],wall:0x2a303a,cap:0x3a424e,roofs:[0x2a2024,0x241e24,0x20242c,0x2c2226],
          house:[0x343a46,0x30353f,0x2b333f,0x383840,0x2f2c34],tower:[0x232c3a,0x283040,0x1e2734,0x2c3442,0x262a36],trim:0x444c5a,base:0x1a1f28,
          glass:[0x141c28,0x18222f,0x101824],lit:0xf6cf7c,litP:0.45,road:0x1c2026,walk:0x2c323a,path:0x2a2c2a,line:0x6a6a5c,pole:0x14181e,lamp:0xffe6a8,shadow:0.4,tree:0x3c5060,car:0.35},
};
function buildLandscape3D(THREE,light){
  const P=LANDSCAPE3D_PAL[light]||LANDSCAPE3D_PAL.noon;
  const g=new THREE.Group(); g.name="landscape";
  const r=day3dRand(24681);
  // Renkler gök gibi tuvaldeki tonla çıkar (ton eşleme / pus yok): uzak silüet beyaza sönmez
  const mat=(side)=>{ const m=new THREE.MeshBasicMaterial({vertexColors:true,fog:false,side:side||THREE.FrontSide}); m.toneMapped=false; return m; };
  const add=(geo,m,name)=>{ const x=new THREE.Mesh(geo,m); x.name=name; x.frustumCulled=false; g.add(x); return x; };
  const raw=(pos,col,idx)=>{
    const geo=new THREE.BufferGeometry();
    geo.setAttribute("position",new THREE.Float32BufferAttribute(pos,3));
    geo.setAttribute("color",new THREE.Float32BufferAttribute(col,3));
    geo.setIndex(idx); return geo;
  };

  // ── Zemin diski (r=296): halka halka iki çim tonu, hafif lekeli ──
  {
    const N=72, RAD=[0,60,95,118,140,165,195,230,262,296], pos=[], col=[], idx=[];
    const a=new THREE.Color(P.ground[0]), b=new THREE.Color(P.ground[1]), t=new THREE.Color();
    RAD.forEach(R=>{ for(let i=0;i<N;i++){
      const th=i/N*Math.PI*2; pos.push(Math.cos(th)*R,0,Math.sin(th)*R);
      t.copy(a).lerp(b,r()); col.push(t.r,t.g,t.b);
    } });
    for(let k=0;k<RAD.length-1;k++) for(let i=0;i<N;i++){
      const j=(i+1)%N, p=k*N+i, q=k*N+j, u=(k+1)*N+i, v=(k+1)*N+j; idx.push(p,q,u,q,v,u);
    }
    add(raw(pos,col,idx),mat(THREE.DoubleSide),"landGround").position.y=-0.12;
  }

  // ── Tepe sırtları: iki halka (yakın koyu, uzak soluk); ufuk bandını tamamen kapatır ──
  {
    const N=128, pos=[], col=[], idx=[]; let base=0;
    [[262,15,9,0,0.3],[288,38,12,1.7,0.9]].forEach(([R,h0,amp,ph,mix])=>{
      const top=new THREE.Color(P.hill[0]).lerp(new THREE.Color(P.hill[1]),mix), bot=new THREE.Color(P.hill[0]).multiplyScalar(0.82);
      for(let i=0;i<=N;i++){
        const th=i/N*Math.PI*2;
        const h=h0+amp*(0.5*Math.sin(th*5+ph)+0.3*Math.sin(th*11+ph*2)+0.2*Math.sin(th*23+ph));
        const R2=Math.min(R,Math.sqrt(296*296-h*h));
        pos.push(Math.cos(th)*R,-0.3,Math.sin(th)*R, Math.cos(th)*R2,h,Math.sin(th)*R2);
        col.push(bot.r,bot.g,bot.b,top.r,top.g,top.b);
        if(i<N){ const p=base+i*2; idx.push(p,p+1,p+2,p+1,p+3,p+2); }
      }
      base+=(N+1)*2;
    });
    add(raw(pos,col,idx),mat(THREE.DoubleSide),"landHills");
  }

  // ── Yardımcılar ──
  const pick=(A)=>A[Math.floor(r()*A.length)];
  const solid=[], panes=[], shadows=[];
  const M4=new THREE.Matrix4();
  // Yerel (yüzü +Z) parça → dünya: ry dönüş, (x,z) öteleme
  const put=(list,g,c)=>{ g.applyMatrix4(M4); list.push({g,c}); };
  const at=(x,z,ry)=>{ M4.makeRotationY(ry); M4.setPosition(x,0,z); };
  const bx=(w,h,d,x,y,z,c)=>{ const b=new THREE.BoxGeometry(w,h,d); b.translate(x,y+h/2,z); put(solid,b,c); };
  const pane=(w,h,x,y,z,ry,c)=>{ const q=new THREE.PlaneGeometry(w,h); q.rotateY(ry); q.translate(x,y,z); put(panes,q,c); };
  // Beşik çatı: mahya x ekseni boyunca, saçaklı
  const gable=(w,d,y,h,c,cWall)=>{
    const W=w/2+0.5, Dd=d/2+0.6, v=[], tri=(...p)=>v.push(...p);
    tri(-W,y,Dd, W,y,Dd, W,y+h,0); tri(-W,y,Dd, W,y+h,0, -W,y+h,0);
    tri(W,y,-Dd, -W,y,-Dd, -W,y+h,0); tri(W,y,-Dd, -W,y+h,0, W,y+h,0);
    const g1=new THREE.BufferGeometry(); g1.setAttribute("position",new THREE.Float32BufferAttribute(v,3)); g1.computeVertexNormals(); put(solid,g1,c);
    const w2=w/2, e=[w2,y,d/2, w2,y,-d/2, w2,y+h*0.95,0, -w2,y,-d/2, -w2,y,d/2, -w2,y+h*0.95,0];
    const g2=new THREE.BufferGeometry(); g2.setAttribute("position",new THREE.Float32BufferAttribute(e,3)); g2.computeVertexNormals(); put(solid,g2,cWall);
  };
  // Yere pişmiş gölge lekesi (güneşin tersine kaymış)
  const SH=light==="night"?[0,0]:[0.5,-0.6];
  const shadow=(x,z,w,d,h,ry)=>{
    const e=Math.min(9,h*0.35), q=new THREE.PlaneGeometry(w+e,d+e); q.rotateX(-Math.PI/2); q.rotateY(ry);
    q.translate(x+SH[0]*e,-0.045,z+SH[1]*e); shadows.push({g:q,c:0x000000});
  };
  const glass=()=>r()<P.litP?P.lit:pick(P.glass);
  // Bir cephedeki pencereler (çerçeve + cam + denizlik); side: 0 ön, 1 sağ, 2 sol
  const facade=(w,d,y0,floors,fh,step,ww,wh,side)=>{
    const span=side===0?w:d, n=Math.max(1,Math.floor((span-1.2)/step));
    for(let f=0;f<floors;f++) for(let i=0;i<n;i++){
      const u=(i-(n-1)/2)*step, y=y0+f*fh+fh*0.55, ry=side===0?0:side===1?Math.PI/2:-Math.PI/2;
      const px=side===0?u:(side===1?w/2:-w/2), pz=side===0?d/2:u, ox=side===1?1:side===2?-1:0, oz=side===0?1:0;
      pane(ww+0.35,wh+0.35,px+ox*0.06,y,pz+oz*0.06,ry,P.trim);
      pane(ww,wh,px+ox*0.12,y,pz+oz*0.12,ry,glass());
    }
  };

  // ── Çevre duvarı (stadyum parkı sınırı): örme duvar, babalar, başlık ──
  const WX=118, WZ=118;
  at(0,0,0);
  [-1,1].forEach(s=>{
    bx(WX*2,2.4,0.6,0,0,s*WZ,P.wall); bx(WX*2,0.3,0.95,0,2.4,s*WZ,P.cap);
    bx(0.6,2.4,WZ*2,s*WX,0,0,P.wall); bx(0.95,0.3,WZ*2,s*WX,2.4,0,P.cap);
    for(let k=-9;k<=9;k++){ bx(1.2,3.3,1.2,k*13,0,s*WZ,P.cap); bx(1.2,3.3,1.2,s*WX,0,k*13,P.cap); }
  });

  // ── Yollar: park yürüyüş yolu, çevre yolu + kaldırımlar + kesik şerit ──
  const flatRing=(r0,r1,c,y)=>{ const g0=new THREE.RingGeometry(r0,r1,96,1); g0.rotateX(-Math.PI/2); g0.translate(0,y,0); solid.push({g:g0,c}); };
  flatRing(169,172,P.walk,-0.07); flatRing(172,181,P.road,-0.08); flatRing(181,184,P.walk,-0.07);
  for(let i=0;i<90;i++){ const th=i/90*Math.PI*2, q=new THREE.PlaneGeometry(0.28,3.2); q.rotateX(-Math.PI/2); at(Math.cos(th)*176.5,Math.sin(th)*176.5,-th); put(panes,q.translate(0,-0.03,0),P.line); }
  at(0,0,0);
  [-1,1].forEach(s=>{ bx(WX*2-12,0.03,3,0,-0.08,s*106,P.path); bx(3,0.03,WZ*2-12,s*109,-0.08,0,P.path); });
  // Park bankları
  for(let k=-6;k<=6;k++) [-1,1].forEach(s=>{ at(k*16+5,s*103.6,0); bx(2,0.12,0.6,0,0.45,0,0x7a5636); bx(2,0.5,0.1,0,0.6,s*0.28,0x7a5636); bx(0.12,0.45,0.5,-0.8,0,0,P.pole); bx(0.12,0.45,0.5,0.8,0,0,P.pole); });

  // ── Konut sırası (2–4 kat, eğimli çatı, baca, balkon/dükkân) ──
  const NH=64;
  for(let i=0;i<NH;i++){
    const th=(i+0.1+r()*0.25)/NH*Math.PI*2, R=196+r()*5, x=Math.cos(th)*R, z=Math.sin(th)*R, ry=Math.atan2(-x,-z);
    const w=11+r()*5, d=9+r()*3, fl=2+Math.floor(r()*2.6), fh=3.1, base=0.6, h=base+fl*fh, c=pick(P.house), rc=pick(P.roofs);
    at(x,z,ry);
    bx(w+0.3,base,d+0.3,0,0,0,P.base); bx(w,fl*fh,d,0,base,0,c);
    for(let f=1;f<fl;f++) bx(w+0.16,0.16,d+0.16,0,base+f*fh-0.08,0,P.trim);          // kat silmesi
    bx(w+0.5,0.28,d+0.5,0,h-0.1,0,P.trim);                                          // saçak
    const rh=2.2+r()*1.6; gable(w,d,h+0.15,rh,rc,c);
    bx(0.9,2.2,0.9,w*0.28,h+rh*0.35,-d*0.15,0x7a4a3a); bx(1.1,0.2,1.1,w*0.28,h+rh*0.35+2.2,-d*0.15,P.base);
    facade(w,d,base+fh,fl-1,fh,2.7,1.15,1.5,0); facade(w,d,base,fl,fh,3.4,1.1,1.4,1); facade(w,d,base,fl,fh,3.4,1.1,1.4,2);
    if(i%3===0){                                                                     // zemin kat dükkân: vitrin + tente
      pane(w*0.8,2,0,base+1.2,d/2+0.12,0,light==="noon"?0x6f8ea5:P.lit); bx(w*0.86,0.14,1.6,0,base+2.45,d/2+0.8,[0xb8433a,0x2f6d8c,0x3d7a4a][i%9/3|0]);
    } else {
      facade(w*0.45,d,base,1,fh,2.6,1.15,1.5,0); bx(1.3,2.3,0.16,w*0.36,base,d/2+0.05,0x5a3a28); bx(2,0.14,1.2,w*0.36,base+2.45,d/2+0.5,P.trim);
      if(i%3===1) for(let f=1;f<fl;f++){ bx(3.2,0.16,1.2,-w*0.22,base+f*fh,d/2+0.6,P.trim); bx(3.2,0.75,0.08,-w*0.22,base+f*fh+0.16,d/2+1.16,P.pole); }
    }
    shadow(x,z,w,d,h,ry);
  }

  // ── Şehir silüeti: apartman blokları ve cam iş kuleleri ──
  const NT=46;
  for(let i=0;i<NT;i++){
    const th=(i+r()*0.5)/NT*Math.PI*2, R=222+r()*26, x=Math.cos(th)*R, z=Math.sin(th)*R, ry=Math.atan2(-x,-z);
    const office=r()<0.4, w=11+r()*8, d=11+r()*6, fl=office?7+Math.floor(r()*6):4+Math.floor(r()*5), fh=3.2, h=fl*fh+1, c=pick(P.tower);
    at(x,z,ry);
    bx(w+1,1.4,d+1,0,0,0,P.base); bx(w,h-1,d,0,1,0,c);
    if(office){                                                                      // bant camlar + düşey kanatlar
      for(let f=0;f<fl;f++){ const y=1+f*fh+1.7; pane(w*0.94,1.9,0,y,d/2+0.08,0,glass()); pane(d*0.94,1.9,w/2+0.08,y,0,Math.PI/2,pick(P.glass)); pane(d*0.94,1.9,-w/2-0.08,y,0,-Math.PI/2,pick(P.glass)); }
      for(let k=-2;k<=2;k++) bx(0.25,h-1,0.3,k*w*0.22,1,d/2+0.12,P.trim);
      bx(w*0.6,3,d*0.6,0,h,0,c); bx(0.16,6,0.16,w*0.15,h+3,0,P.pole);
    } else {
      facade(w,d,1,fl,fh,2.5,1.2,1.6,0); facade(w,d,1,fl,fh,3.3,1.1,1.5,1); facade(w,d,1,fl,fh,3.3,1.1,1.5,2);
      for(let f=1;f<fl;f++) bx(w*0.3,0.16,1.1,w*0.25,1+f*fh,d/2+0.55,P.trim);         // balkon plakaları
      if(i%2) gable(w,d,h+0.1,2.6,pick(P.roofs),c); else { bx(w+0.4,0.7,d+0.4,0,h,0,P.trim); bx(3,2.2,3,w*0.2,h+0.7,0,P.base); }
    }
    shadow(x,z,w,d,h,ry);
  }

  // ── Sokak/park lambaları (instanced) ──
  const LP=[];
  for(let i=0;i<56;i++){ const th=i/56*Math.PI*2, R=i%2?170.4:182.6; LP.push([Math.cos(th)*R,Math.sin(th)*R,i%2?-th:Math.PI-th]); }
  for(let k=-5;k<=5;k++) [-1,1].forEach(s=>{ LP.push([k*19,s*108.5,s>0?Math.PI/2:-Math.PI/2]); LP.push([s*111.5,k*19,s>0?Math.PI:0]); });
  const post=mergeGeos3D(THREE,[
    {g:new THREE.CylinderGeometry(0.09,0.16,6.4,6).translate(0,3.2,0),c:P.pole},{g:new THREE.CylinderGeometry(0.28,0.34,0.5,8).translate(0,0.25,0),c:P.pole},
    {g:new THREE.BoxGeometry(1.7,0.1,0.1).translate(0.8,6.35,0),c:P.pole},{g:new THREE.BoxGeometry(0.8,0.18,0.36).translate(1.5,6.3,0),c:P.pole},
    {g:new THREE.BoxGeometry(0.7,0.1,0.3).translate(1.5,6.17,0),c:P.lamp}]);
  const q4=new THREE.Quaternion(), up=new THREE.Vector3(0,1,0), v3=new THREE.Vector3(), one=new THREE.Vector3(1,1,1);
  const inst=(geo,list,name,m)=>{
    const im=new THREE.InstancedMesh(geo,m,list.length); im.name=name; im.frustumCulled=false;
    list.forEach(([x,z,ry,y],i)=>{ q4.setFromAxisAngle(up,ry); M4.compose(v3.set(x,y||0,z),q4,one); im.setMatrixAt(i,M4); });
    im.instanceMatrix.needsUpdate=true; g.add(im); return im;
  };
  inst(post,LP,"landLamps",mat());
  if(light!=="noon"){                                                                // lamba altı ışık lekesi
    const pool=new THREE.CircleGeometry(4.2,20); pool.rotateX(-Math.PI/2); pool.translate(1.5,0,0);
    const pm=new THREE.MeshBasicMaterial({color:0xffcf80,transparent:true,opacity:light==="night"?0.2:0.12,depthWrite:false,fog:false,blending:THREE.AdditiveBlending}); pm.toneMapped=false;
    inst(pool,LP.map(p=>[p[0],p[1],p[2],-0.03]),"landLampPools",pm).renderOrder=2;
  }

  // ── Park etmiş / yoldaki araçlar (instanced; renk örnek başına) ──
  const car=mergeGeos3D(THREE,[
    {g:new THREE.BoxGeometry(1.8,0.62,4.2).translate(0,0.66,0),c:0xffffff},{g:new THREE.BoxGeometry(1.6,0.56,2.2).translate(0,1.24,-0.15),c:0x2c3a46},
    {g:new THREE.BoxGeometry(1.5,0.1,1.9).translate(0,1.55,-0.15),c:0xf4f4f4},
    ...[[-0.85,1.3],[0.85,1.3],[-0.85,-1.3],[0.85,-1.3]].map(([x,z])=>({g:new THREE.CylinderGeometry(0.36,0.36,0.24,10).rotateZ(Math.PI/2).translate(x,0.36,z),c:0x16181a}))]);
  const CP=[]; for(let i=0;i<52;i++){ const th=r()*Math.PI*2, lane=i%3===0?174.2:i%3===1?178.8:173.6; CP.push([Math.cos(th)*lane,Math.sin(th)*lane,-th+(i%3===1?Math.PI:0)]); }
  const cars=inst(car,CP,"landCars",mat()), cc0=new THREE.Color();
  CP.forEach((p,i)=>{ cc0.setHex([0xb9322c,0xe8e8e6,0x2d4f86,0x24282c,0x9aa2a8,0x3d6b4a,0xd9a23a][Math.floor(r()*7)]).multiplyScalar(P.car); cars.setColorAt(i,cc0); });
  if(cars.instanceColor) cars.instanceColor.needsUpdate=true;

  // ── Ağaçlar: park kümeleri, yol boyu sıra, mahalle araları ──
  const pts=[];
  const cluster=(x,z,n,sp,k)=>{ for(let i=0;i<n;i++) pts.push([x+(r()-0.5)*sp,z+(r()-0.5)*sp,k+r()*0.5]); };
  for(let k=-5;k<=5;k++) [-1,1].forEach(s=>{ cluster(k*20+9,s*113,1,4,0.95); if(s<0) cluster(k*20,-101,1,6,0.9); });
  [-1,1].forEach(s=>{ for(let k=-5;k<=4;k++) cluster(s*114,k*20+8,1,3,0.95); });
  for(let i=0;i<60;i++){ const th=(i+0.5)/60*Math.PI*2, R=i%2?186.5:166; pts.push([Math.cos(th)*R,Math.sin(th)*R,0.9+r()*0.35]); }
  for(let i=0;i<18;i++){ const th=r()*Math.PI*2, R=138+r()*18; cluster(Math.cos(th)*R,Math.sin(th)*R,2,12,1.0); }
  for(let i=0;i<26;i++){ const th=r()*Math.PI*2; cluster(Math.cos(th)*212,Math.sin(th)*212,1,4,1.15); }
  const inWall=(p)=>Math.abs(Math.abs(p[0])-WX)<2.2&&Math.abs(p[1])<WZ+2||Math.abs(Math.abs(p[1])-WZ)<2.2&&Math.abs(p[0])<WX+2;
  const tp=pts.filter(p=>!inWall(p));
  tp.forEach(p=>shadow(p[0],p[1],3.2*p[2],3.2*p[2],6,0));
  const tr=day3dTrees(THREE,tp,P.tree);
  if(tr){ tr.name="landTrees"; g.add(tr); }

  // ── Birleştir: gölgeli vertex renkleri ──
  const bg=mergeGeos3D(THREE,solid), nn=bg.attributes.normal, cc=bg.attributes.color, pp=bg.attributes.position;
  for(let i=0;i<nn.count;i++){
    const ao=pp.getY(i)<0.5&&nn.getY(i)<0.5?0.86:1;                                   // dipte hafif AO
    const k=nn.getY(i)>0.9&&pp.getY(i)<0.3?1:Math.min(1.1,0.82+0.22*nn.getY(i)+0.14*nn.getZ(i)-0.12*nn.getX(i))*ao;
    cc.setXYZ(i,cc.getX(i)*k,cc.getY(i)*k,cc.getZ(i)*k);
  }
  add(bg,mat(THREE.DoubleSide),"landBuildings");
  add(mergeGeos3D(THREE,panes),mat(),"landWindows");
  const sm=new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:P.shadow,depthWrite:false,fog:false});
  add(mergeGeos3D(THREE,shadows),sm,"landShadows").renderOrder=1;
  return g;
}
