// ═══════════════════════════════════════════════════════════════
// 3D MAÇ — EKLEMLİ OYUNCU MODELİ (stilize low-poly) + ANİMASYON
// ═══════════════════════════════════════════════════════════════
// createRigKit3D(THREE,COL) → kit
//   kit.build(team,gk,idx) → rig  (team: "home"|"away"; idx: saç/ten çeşidi)
//   kit.setKit(rig,gk)            → forma (kaleci/oyuncu) değişimi (geometri takası)
//   kit.dispose()                 → paylaşılan geometri + malzeme serbest
// rig: {body, head, armL, armR, thighL, thighR, shinL, shinR, ...durum}
//   rig.body p.g'nin çocuğudur (kalça ekseni, y=RIG3D_HIP). Bacaklar gövdeye
//   bağlıdır; böylece dalış/kayma gibi tüm vücut hareketleri tek dönüşle olur.
// animateRig3D(rig,dt,speed) → koşu döngüsü (hızla orantılı adım/kol), duruşta
//   nefes + hazır bekleme salınımı, ardından aktif eylem (üstüne yazar).
// rigAction3D(rig,kind,opts) → eylem başlat:
//   "kick" {power 0–1}  · vuruş ayağı geri gerilir, topa vurur, takip
//   "poke" {side ±1}    · müdahale: ayak topa uzatılır
//   "dive" {side ±1 (yerel sağ=+1), h 0–1} · kaleci yana uçar, yere düşer, kalkar
//   "slide" · kayarak müdahale  · "fall" · yere düşme  · "celebrate" · gol sevinci
// Performans: oyuncu başına 8 mesh (tek paylaşılan Lambert malzeme, renkler
//   vertex rengi); kare döngüsünde tahsis yok.
// Yön: model yerel +Z'ye bakar (players3d yaw = atan2(dx,dz)).
//   rotation.x < 0 → uzuv öne; diz (shin) rotation.x > 0 → geriye bükülür.
// ═══════════════════════════════════════════════════════════════

const RIG3D_HIP=1.48;          // kalça ekseni (yerden, m; oyuncu ~3.2 m: uzaktan okunsun; bacak+krampon 1.48 m)
const RIG3D_RIG_H=3.19;        // rig boyu (krampon tabanı → saç tepesi); gerçek boy ölçeği buna göre
const RIG3D_ACT_DUR={throw:1.2,kick:0.5,poke:0.55,dive:1.5,slide:0.9,fall:1.3,celebrate:2.2,cheerrun:2.6};
// Dalış animasyonunun en çok hızlanma katı (players3d diveTo ve moment3d dalış zamanlaması ortak)
//   ve tam uzanma anı (dalış süresinin kesri: animateRig3D "dive" 0.12–0.45 arası uçuş)
const RIG3D_DIVE_K_MAX=6, RIG3D_DIVE_REACH_U=0.45;

function createRigKit3D(THREE,COL){
  const geos=[];
  const G=(g)=>{ geos.push(g); return g; };
  // Parçaları tek geometride birleştir + parça rengi vertex rengine (three3d.js)
  const merge=(parts)=>G(mergeGeos3D(THREE,parts));
  const cyl=(rt,rb,h,seg,y,sz)=>{ const g=new THREE.CylinderGeometry(rt,rb,h,seg); if(sz) g.scale(1,1,sz); g.translate(0,y,0); return g; };
  const box=(w,h,d,x,y,z)=>{ const g=new THREE.BoxGeometry(w,h,d); g.translate(x,y,z); return g; };
  const sph=(r,ws,hs,x,y,z,sx,sy,sz)=>{ const g=new THREE.SphereGeometry(r,ws,hs); if(sx) g.scale(sx,sy,sz); g.translate(x,y,z); return g; };

  const SKIN=[0xe0b48c,0xc8946a,0x8d5a3b];          // ten tonları
  const HAIR=[0x2b1d14,0x111111,0x8a5a2b,0xd9b25f];  // saç renkleri
  const BOOT=[0x111111,0xf2f2f2,0x1e88e5];           // krampon renkleri
  // Forma / şort / tozluk belirgin ayrışır: tozluk formanın koyu tonu + üstte açık şerit,
  //   şort belinde ince koyu bel bandı (uzaktan da üç renk bölgesi okunur)
  const kitCol={
    // Takım renkleri (actors3dKitColors) tozluk/bel/şerit de verir; yoksa eski sabit tonlar
    home:{shirt:COL.home,shorts:COL.homeShorts,socks:COL.homeSocks!=null?COL.homeSocks:0x123a7a,band:COL.homeBand!=null?COL.homeBand:0xf2f2f2,belt:COL.homeBelt!=null?COL.homeBelt:0x1a5fc4},
    homeGK:{shirt:COL.homeGK,shorts:0x222222,socks:0x8a5a00,band:0xf2f2f2,belt:0x111111,gloves:0xf4f4f4},
    away:{shirt:COL.away,shorts:COL.awayShorts,socks:COL.awaySocks!=null?COL.awaySocks:0x7a1414,band:COL.awayBand!=null?COL.awayBand:0xf2f2f2,belt:COL.awayBelt!=null?COL.awayBelt:0x000000},
    awayGK:{shirt:COL.awayGK,shorts:0x222222,socks:0x4b2a85,band:0xf2f2f2,belt:0x111111,gloves:0xf4f4f4},
  };
  const cache={};
  const once=(key,fn)=>cache[key]||(cache[key]=fn());
  // Gövde (kalça ekseni = 0): şort + bel bandı + forma + yaka + boyun.
  //   Atletik oran: geniş omuz, dar bel (V gövde); eklem noktaları/boylar aynı → animasyonlar değişmez
  const bodyGeo=(k,skin)=>once("b"+k+skin,()=>{
    const c=kitCol[k];
    return merge([
      {g:cyl(0.36,0.4,0.44,8,-0.07,0.72),c:c.shorts},
      {g:cyl(0.375,0.375,0.06,8,0.13,0.72),c:c.belt},                // bel bandı (forma/şort sınırı)
      {g:cyl(0.54,0.35,0.92,8,0.56,0.62),c:c.shirt},
      {g:sph(0.52,8,5,0,0.98,0,1,0.32,0.62),c:c.shirt},              // omuz kubbesi
      {g:box(0.5,0.08,0.06,0,0.36,0.31),c:c.gloves?0xf4f4f4:c.shorts===0xf2f2f2?0xffffff:0x0b1320}, // göğüs bandı (sponsor şeridi; kalecide açık → ön net)
      {g:cyl(0.12,0.14,0.22,6,1.08),c:SKIN[skin]},
    ]);
  });
  // Baş (boyun üstü = 0): kafa + saç + burun (bakış yönü okunsun)
  const headGeo=(skin,hair)=>once("h"+skin+"_"+hair,()=>{
    // Atletik oran: baş biraz küçük (0.3 → 0.27), ense saçı arkada daha aşağı iner
    const cap=new THREE.SphereGeometry(0.295,10,6,0,Math.PI*2,0,Math.PI*0.42); cap.translate(0,0.25,-0.03);
    const nape=new THREE.SphereGeometry(0.28,8,5,Math.PI*1.1,Math.PI*0.8,Math.PI*0.3,Math.PI*0.3); nape.translate(0,0.23,-0.02);
    return merge([
      {g:sph(0.27,10,8,0,0.23,0,1,1.1,1),c:SKIN[skin]},
      {g:cap,c:HAIR[hair]},
      {g:nape,c:HAIR[hair]},
      {g:box(0.07,0.09,0.09,0,0.2,0.27),c:SKIN[skin]},
      // Gözler + kaşlar (yerel +Z = yüz): uzaktan da oyuncunun baktığı yön okunur
      {g:box(0.06,0.035,0.03,0.085,0.28,0.262),c:0x15110e},
      {g:box(0.06,0.035,0.03,-0.085,0.28,0.262),c:0x15110e},
      {g:box(0.2,0.025,0.03,0,0.322,0.255),c:HAIR[hair]},
    ]);
  });
  // Kol (omuz = 0, aşağı sarkar): kol yeni + ön kol + el (kalecide eldiven)
  const armGeo=(k,skin)=>once("a"+k+skin,()=>{
    const c=kitCol[k], gk=!!c.gloves;
    return merge([
      {g:cyl(0.13,0.115,0.36,6,-0.15),c:c.shirt},
      {g:cyl(0.095,0.08,0.5,6,-0.56),c:gk?c.shirt:SKIN[skin]},
      {g:sph(gk?0.14:0.105,6,5,0,-0.85,0.02),c:gk?c.gloves:SKIN[skin]},
    ]);
  });
  const thighGeo=(skin)=>once("t"+skin,()=>merge([{g:cyl(0.155,0.115,0.74,7,-0.36),c:SKIN[skin]}]));
  // Baldır (diz = 0): tozluk + krampon (burnu +Z)
  const shinGeo=(k,boot)=>once("s"+k+boot,()=>{
    const c=kitCol[k];
    return merge([
      {g:cyl(0.13,0.1,0.6,7,-0.3),c:c.socks},
      {g:cyl(0.136,0.134,0.08,7,-0.05),c:c.band},                    // tozluk üst şeridi
      {g:box(0.22,0.16,0.44,0,-0.62,0.08),c:BOOT[boot]},
    ]);
  });
  const mat=new THREE.MeshLambertMaterial({vertexColors:true});

  const keyOf=(team,gk)=>(team==="away"?"away":"home")+(gk?"GK":"");
  const build=(team,gk,idx)=>{
    const i=Math.abs(idx|0);
    const skin=(i*7+(team==="away"?3:0))%5<3?0:(i%2?1:2);
    const hair=(i*3+(team==="away"?1:0))%HAIR.length, boot=(i+(team==="away"?1:0))%BOOT.length;
    const k=keyOf(team,gk);
    const body=new THREE.Group(); body.position.y=RIG3D_HIP;
    const mesh=(g,parent,x,y,z)=>{ const m=new THREE.Mesh(g,mat); m.position.set(x,y,z); parent.add(m); return m; };
    const torso=mesh(bodyGeo(k,skin),body,0,0,0);
    const head=mesh(headGeo(skin,hair),body,0,1.18,0);
    const armL=mesh(armGeo(k,skin),body,0.53,0.92,0);
    const armR=mesh(armGeo(k,skin),body,-0.53,0.92,0);
    const thighL=mesh(thighGeo(skin),body,0.19,-0.06,0);
    const thighR=mesh(thighGeo(skin),body,-0.19,-0.06,0);
    const shinL=mesh(shinGeo(k,boot),thighL,0,-0.72,0);
    const shinR=mesh(shinGeo(k,boot),thighR,0,-0.72,0);
    return {body,torso,head,armL,armR,thighL,thighR,shinL,shinR,skin,boot,kit:k,
      phase:Math.random()*6.28,breath:Math.random()*6.28,
      act:null,actT:0,actDur:0,side:1,power:1,h:0,ox:0,oy:0};
  };
  const setKit=(rig,gk)=>{
    const k=keyOf(rig.kit.indexOf("away")===0?"away":"home",gk);
    if(k===rig.kit) return;
    rig.kit=k;
    rig.torso.geometry=bodyGeo(k,rig.skin);
    rig.armL.geometry=armGeo(k,rig.skin); rig.armR.geometry=armGeo(k,rig.skin);
    rig.shinL.geometry=shinGeo(k,rig.boot); rig.shinR.geometry=shinGeo(k,rig.boot);
    if(rig.glb&&rig.glb.setKit) rig.glb.setKit(k);   // hazır insan modeli (assets3d.js) forma rengi
  };
  const dispose=()=>{
    geos.forEach(g=>{ try{ g.dispose(); }catch(e){} });
    geos.length=0;
    try{ mat.dispose(); }catch(e){}
    Object.keys(cache).forEach(k=>delete cache[k]);
  };
  // kitCol/SKIN/HAIR/BOOT: hazır insan modeli (assets3d.js) aynı forma/ten/saç renklerini kullanır
  return {build,setKit,dispose,material:mat,kitCol,SKIN,HAIR,BOOT};
}

// Eylem başlat (aynı eylem sürerken yeniden başlatılmaz, "kick" hariç)
function rigAction3D(rig,kind,opts){
  if(!rig||!RIG3D_ACT_DUR[kind]) return;
  if(rig.act===kind&&kind!=="kick"&&rig.actT<rig.actDur*0.6) return;
  const o=opts||{};
  rig.act=kind; rig.actDur=Number.isFinite(o.dur)?o.dur:RIG3D_ACT_DUR[kind];
  // fast (dalış): uçuş (tam uzanmaya kadar, RIG3D_DIVE_REACH_U) fast× hızlı, sonrası (yerde yatış +
  //   kalkış) normal hızda → çok hızlı şutta da kaleci topa uzanır ve yerde görünür kalır
  rig.fast=(kind==="dive"&&Number.isFinite(o.fast))?Math.max(1,Math.min(RIG3D_DIVE_K_MAX,o.fast)):1;
  // t0: başlangıç kesri (ör. top hemen çıkıyorsa vuruş vuruş anından başlar)
  rig.actT=Number.isFinite(o.t0)?Math.max(0,Math.min(0.95,o.t0))*rig.actDur:0;
  rig.side=o.side<0?-1:1;
  rig.power=Number.isFinite(o.power)?Math.max(0.3,Math.min(1,o.power)):1;
  rig.h=Number.isFinite(o.h)?Math.max(0,Math.min(1,o.h)):0.3;
}
// Eylem sürüyor mu? (dalış/kayma/düşme sırasında oyuncu konumu kayabilir)
function rigBusy3D(rig){ return !!(rig&&rig.act&&rig.actT<rig.actDur); }

// Yumuşak geçiş (smoothstep) — üst seviyede: kare döngüsünde closure tahsisi olmasın
function rig3dEase(a,b,k){ return a+(b-a)*(k<0?0:k>1?1:k*k*(3-2*k)); }
// Doğrusal karışım (kaleci hazır duruşu; kare döngüsünde closure tahsisi olmasın diye üst seviyede)
function rig3dMix(a,b,t){ return a+(b-a)*t; }

function animateRig3D(rig,dt,speed){
  const ease=rig3dEase;
  if(!rig) return;
  const sp=Number.isFinite(speed)?Math.max(0,speed):0;
  const run=Math.min(1,sp/7);                   // 7 m/sn ≈ tam koşu
  const walk=Math.min(1,sp/1.2);                // hareket var mı
  // Adım fazı ALINAN YOLLA orantılı (kayma/"buz pateni" yok): bir tam döngü (2 adım) boyu
  //   1.1 + 0.42·hız m → yürüyüş 1.4 m/sn ≈ 0.8 Hz, koşu 7 m/sn ≈ 1.7 Hz, sprint 9 m/sn ≈ 1.8 Hz
  if(sp>0.25) rig.phase+=dt*sp*6.2832/(1.1+0.42*sp);
  rig.breath+=dt*2.1;
  const ph=rig.phase, s=Math.sin(ph), c=Math.cos(ph);
  const idle=1-walk, br=Math.sin(rig.breath);
  const B=rig.body;
  // ── Taban: koşu + bekleme ──
  const legA=walk*(0.18+0.58*run), armA=walk*(0.12+0.62*run);
  B.position.set(Math.sin(rig.breath*0.5)*0.03*idle,RIG3D_HIP+Math.abs(s)*0.11*run-0.05*idle+br*0.012*idle,0);
  B.rotation.set(0.04+0.2*run+0.06*idle,s*0.1*run,Math.sin(rig.breath*0.5)*0.025*idle);
  rig.thighL.rotation.set(-s*legA-0.12*idle,0,0.02);
  rig.thighR.rotation.set(s*legA-0.12*idle,0,-0.02);
  rig.shinL.rotation.set(0.06+0.22*idle+walk*(0.15+1.05*run)*Math.max(0,c),0,0);
  rig.shinR.rotation.set(0.06+0.22*idle+walk*(0.15+1.05*run)*Math.max(0,-c),0,0);
  rig.armL.rotation.set(s*armA+0.05*idle,0,0.13+0.1*run+br*0.035*idle);
  rig.armR.rotation.set(-s*armA+0.05*idle,0,-0.13-0.1*run-br*0.035*idle);
  rig.head.rotation.set(-0.1*run+br*0.02*idle,-s*0.08*run,0);
  // ── Kaleci hazır duruşu (dururken / yavaş yan adımda): bacaklar omuz genişliğinde açık, dizler
  //   kırık, kalça alçak, gövde öne eğik, eldivenler önde ve hafif yanda (yüz/göğüs net okunur).
  //   Koşuya geçtikçe (≥3 m/sn) söner; eylemler (dalış vb.) aşağıda üstüne yazar.
  if(rig.kit&&rig.kit.slice(-2)==="GK"){
    const rd=Math.max(0,1-sp/3);
    if(rd>0){
      B.position.y-=0.14*rd;
      B.rotation.x=rig3dMix(B.rotation.x,0.2,rd);
      rig.thighL.rotation.x=rig3dMix(rig.thighL.rotation.x,-0.5,rd); rig.thighL.rotation.z=rig3dMix(rig.thighL.rotation.z,0.2,rd);
      rig.thighR.rotation.x=rig3dMix(rig.thighR.rotation.x,-0.5,rd); rig.thighR.rotation.z=rig3dMix(rig.thighR.rotation.z,-0.2,rd);
      rig.shinL.rotation.x=rig3dMix(rig.shinL.rotation.x,0.78,rd); rig.shinR.rotation.x=rig3dMix(rig.shinR.rotation.x,0.78,rd);
      rig.armL.rotation.x=rig3dMix(rig.armL.rotation.x,-0.8+br*0.03,rd); rig.armL.rotation.z=rig3dMix(rig.armL.rotation.z,0.38,rd);
      rig.armR.rotation.x=rig3dMix(rig.armR.rotation.x,-0.8-br*0.03,rd); rig.armR.rotation.z=rig3dMix(rig.armR.rotation.z,-0.38,rd);
      rig.head.rotation.x=rig3dMix(rig.head.rotation.x,-0.16,rd);   // gövde eğikken bakış öne (topa)
      // Canlı bekleme (idle bounce): sağa-sola hafif yaylanma + parmak ucunda inip kalkma. Saat
      //   GERÇEK zamanla işler (rig.rdt, players3d) → vuruş ekranının ağır çekiminde (×0.05) de
      //   kaleci heykel gibi durmaz. Yan kayma uyluk açısıyla telafi edilir: ayaklar yerde kalır.
      rig.gkT=(rig.gkT||0)+(Number.isFinite(rig.rdt)?rig.rdt:dt);
      const gt=rig.gkT, sw=Math.sin(gt*2.3), dip=(1-Math.cos(gt*4.6))*0.5;   // dip: her yan uçta bir yaylanma
      const dx=sw*0.13*rd;
      B.position.x+=dx; B.position.y-=dip*0.08*rd;
      B.rotation.z+=-sw*0.04*rd;
      rig.thighL.rotation.z-=dx/1.4; rig.thighR.rotation.z-=dx/1.4;
      rig.thighL.rotation.x-=dip*0.13*rd; rig.thighR.rotation.x-=dip*0.13*rd;
      rig.shinL.rotation.x+=dip*0.24*rd; rig.shinR.rotation.x+=dip*0.24*rd;
      rig.armL.rotation.x-=dip*0.08*rd; rig.armR.rotation.x-=dip*0.08*rd;      // eller hazır, ritimle hafif
      rig.armL.rotation.z+=sw*0.05*rd; rig.armR.rotation.z+=sw*0.05*rd;
    }
  }
  // ── Eylem katmanı ──
  if(!rig.act) return;
  rig.actT+=dt*((rig.act==="dive"&&rig.fast>1&&rig.actT<RIG3D_DIVE_REACH_U*rig.actDur)?rig.fast:1);
  const u=Math.min(1,rig.actT/Math.max(0.05,rig.actDur));
  if(u>=1){ rig.act=null; return; }
  const sd=rig.side, P=rig.power;
  switch(rig.act){
    case "kick":{
      // Sağ ayak (side +1) ya da sol: geri ger (0–0.4) → vur (0.4–0.55) → takip
      const th=sd>0?rig.thighR:rig.thighL, sh=sd>0?rig.shinR:rig.shinL;
      const sup=sd>0?rig.thighL:rig.thighR, supS=sd>0?rig.shinL:rig.shinR;
      const arm=sd>0?rig.armL:rig.armR;
      let tx, kx;
      if(u<0.4){ const k=u/0.4; tx=ease(0,0.85*P,k); kx=ease(0.1,1.5*P,k); }
      else if(u<0.55){ const k=(u-0.4)/0.15; tx=ease(0.85*P,-1.3*P,k); kx=ease(1.5*P,0.05,k); }
      else { const k=(u-0.55)/0.45; tx=ease(-1.3*P,0,k); kx=ease(0.05,0.15,k); }
      th.rotation.set(tx,0,0); sh.rotation.set(kx,0,0);
      sup.rotation.set(-0.12,0,0); supS.rotation.set(0.28,0,0);
      arm.rotation.set(-0.35,0,sd*-0.9*P);   // denge kolu açılır
      B.rotation.x=0.05-0.12*P*Math.sin(Math.PI*u);
      B.rotation.y=sd*0.25*P*Math.sin(Math.PI*u);
      break;
    }
    case "poke":{
      // Ayak uzatma: öne-yana gerilme, gövde alçalır ve öne eğilir
      const k=Math.sin(Math.PI*Math.min(1,u*1.25));
      const th=sd>0?rig.thighR:rig.thighL, sh=sd>0?rig.shinR:rig.shinL;
      const sup=sd>0?rig.shinL:rig.shinR;
      th.rotation.set(-1.05*k,0,-sd*0.45*k); sh.rotation.set(0.08,0,0);
      sup.rotation.x=0.2+0.6*k;
      B.position.y-=0.28*k; B.rotation.x=0.1+0.35*k;
      rig.armL.rotation.z=0.5*k; rig.armR.rotation.z=-0.5*k;
      break;
    }
    case "dive":{
      // Kaleci: çömel (0–0.12) → yana uç (0.12–0.45) → yerde (–0.8) → kalk
      // rig.reach: ölçek telafisi (players3d: 1/oyuncu ölçeği) → küçültülmüş (gerçek boy) kalecide
      //   de yana uzanma ~2.3 m ve sıçrama yüksekliği dünyada aynı kalır
      const lie=-1.0, ang=1.4, rk=Number.isFinite(rig.reach)?rig.reach:1;
      let e, up;
      if(u<0.12){ e=0; up=0; B.position.y-=0.3*(u/0.12); }
      else if(u<0.45){ const k=(u-0.12)/0.33; e=ease(0,1,k); up=Math.sin(Math.PI*k)*(0.7+rig.h*0.9)*rk; }
      else if(u<0.8){ e=1; up=0; }
      else { e=ease(1,0,(u-0.8)/0.2); up=0; }
      B.rotation.z=-sd*ang*e;
      B.position.x+=sd*2.3*rk*Math.min(1,e*1.15);
      B.position.y+=lie*e+up;
      rig.armL.rotation.set(-2.9*Math.min(1,e*1.6),0,0.25); rig.armR.rotation.set(-2.9*Math.min(1,e*1.6),0,-0.25);
      rig.thighL.rotation.set(0.15*e,0,0.2*e); rig.thighR.rotation.set(0.15*e,0,-0.2*e);
      rig.shinL.rotation.x=0.35; rig.shinR.rotation.x=0.35;
      break;
    }
    case "slide":{
      const k=Math.min(1,u*4), out=u>0.75?1-(u-0.75)/0.25:1, e=k*out;
      B.position.y-=1.0*e; B.rotation.x=-1.0*e;
      rig.thighL.rotation.set(-1.35*e,0,0.1); rig.thighR.rotation.set(-0.5*e,0,-0.1);
      rig.shinL.rotation.x=0.05; rig.shinR.rotation.x=1.2*e;
      rig.armL.rotation.set(0.7*e,0,0.6*e); rig.armR.rotation.set(0.7*e,0,-0.6*e);
      break;
    }
    case "fall":{
      const k=Math.min(1,u*3.5), out=u>0.8?1-(u-0.8)/0.2:1, e=k*out;
      B.position.y-=1.0*e; B.rotation.z=1.35*e; B.rotation.x=0.2*e;
      rig.armL.rotation.set(-1.2*e,0,0.8*e); rig.armR.rotation.set(-0.8*e,0,-0.4*e);
      break;
    }
    case "throw":{
      // Taç: top başın üstünde, sonra öne savurma
      const k=u<0.45?u/0.45*0.25:0.25-(u-0.45)/0.55*1.9;
      rig.armL.rotation.set(-2.9+Math.max(0,-k),0,0.2); rig.armR.rotation.set(-2.9+Math.max(0,-k),0,-0.2);
      B.rotation.x+=-k*0.25;
      break;
    }
    case "cheerrun":{   // gol koşusu: kollar iki yana açık (uçak), bacaklar koşu adımında
      const k=Math.min(1,u*8)*Math.min(1,(1-u)*6), w=Math.sin(rig.actT*6)*0.12;
      rig.armL.rotation.set(-0.15,0,rig3dMix(rig.armL.rotation.z,1.5+w,k)); rig.armR.rotation.set(-0.15,0,rig3dMix(rig.armR.rotation.z,-1.5+w,k));
      rig.head.rotation.x=-0.18*k; B.rotation.z+=w*0.6*k;
      break;
    }
    case "celebrate":{
      // Kollar havada zıplama
      const j=Math.abs(Math.sin(rig.actT*7.5))*0.45*(1-u*0.5);
      B.position.y+=j;
      rig.armL.rotation.set(-2.75,0,0.45); rig.armR.rotation.set(-2.75,0,-0.45);
      rig.thighL.rotation.x=-0.25*j; rig.thighR.rotation.x=-0.25*j;
      rig.shinL.rotation.x=0.5*j+0.1; rig.shinR.rotation.x=0.5*j+0.1;
      break;
    }
    default: rig.act=null;
  }
}
