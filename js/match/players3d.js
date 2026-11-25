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
//   + faceToward(team,i,wx,wz,sec) (oyuncuyu noktaya anında döndürür; vuruş ekranında kaleci topa)
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
// Takım forma renkleri (3D + 2.5D): TEAM_BADGE (theme.js) birincil (bg) = forma, ikincil (tx) = şort /
//   tozluk şeridi. "home" = bizim takım, "away" = rakip (3D tarafları). İki forma çok yakınsa GERÇEK
//   deplasman takımı (myHome false → biz) kontrast ikinci formaya geçer: önce ikincil renk forma olur,
//   o da yakınsa beyaz/koyu lacivertten uzak olanı. Kaleciler iki formadan da uzak bir renk alır.
//   Dönen nesne ACTORS3D_COLORS ile aynı anahtarlar (+ homeSocks/awaySocks/homeBelt/awayBelt/…Band).
function actors3dHex(v,def){
  if(typeof v==="number"&&Number.isFinite(v)) return v;
  const s=String(v||"").trim().replace(/^#/,"");
  if(/^[0-9a-fA-F]{6}$/.test(s)) return parseInt(s,16);
  if(/^[0-9a-fA-F]{3}$/.test(s)) return parseInt(s.split("").map(c=>c+c).join(""),16);
  return def;
}
function actors3dColDist(a,b){   // algısal ağırlıklı RGB uzaklığı (0 … ~765)
  const r1=a>>16&255, g1=a>>8&255, b1=a&255, r2=b>>16&255, g2=b>>8&255, b2=b&255;
  const rm=(r1+r2)/2, dr=r1-r2, dg=g1-g2, db=b1-b2;
  return Math.sqrt((2+rm/256)*dr*dr+4*dg*dg+(2+(255-rm)/256)*db*db);
}
function actors3dShade(c,k){
  const f=(v)=>Math.max(0,Math.min(255,Math.round(v*k)));
  return (f(c>>16&255)<<16)|(f(c>>8&255)<<8)|f(c&255);
}
const ACTORS3D_KIT_CLASH=150;   // bu uzaklığın altında iki forma "çok yakın" sayılır
function actors3dKitColors(myName,oppName,myHome){
  const D=ACTORS3D_COLORS, out=Object.assign({},D);
  try{
    const badge=(n)=>typeof getTeamBadge==="function"&&n?getTeamBadge(n):null;
    const kitOf=(n,defShirt,defShorts)=>{ const b=badge(n);
      return {p:actors3dHex(b&&b.bg,defShirt),s:actors3dHex(b&&b.tx,defShorts)}; };
    const me=kitOf(myName,D.home,D.homeShorts), op=kitOf(oppName,D.away,D.awayShorts);
    // Forma = birincil, şort = ikincil (aynıysa koyu/açık ton)
    const mk=(k)=>({shirt:k.p,shorts:actors3dColDist(k.p,k.s)<60?(actors3dColDist(k.p,0xffffff)>250?0xf2f2f2:0x1b1b24):k.s});
    let h=mk(me), a=mk(op);
    if(actors3dColDist(h.shirt,a.shirt)<ACTORS3D_KIT_CLASH){
      // Deplasman takımı ikinci forma: ikincil renk forma, birincil şort
      const awayKit=myHome?op:me, homeShirt=myHome?h.shirt:a.shirt;
      let alt={shirt:awayKit.s,shorts:awayKit.p};
      if(actors3dColDist(alt.shirt,homeShirt)<ACTORS3D_KIT_CLASH){
        const w=0xf4f4f4, n=0x14203a;
        const sh=actors3dColDist(w,homeShirt)>=actors3dColDist(n,homeShirt)?w:n;
        alt={shirt:sh,shorts:sh===w?awayKit.p:0xf2f2f2};
        if(actors3dColDist(alt.shorts,alt.shirt)<60) alt.shorts=sh===w?0x14203a:0xf2f2f2;
      }
      if(myHome) a=alt; else h=alt;
    }
    out.home=h.shirt; out.homeShorts=h.shorts; out.away=a.shirt; out.awayShorts=a.shorts;
    // Tozluk: forma renginin koyu tonu; bel bandı: şortun koyu tonu; tozluk şeridi: şort rengi
    out.homeSocks=actors3dShade(h.shirt,0.55); out.awaySocks=actors3dShade(a.shirt,0.55);
    out.homeBelt=actors3dShade(h.shorts,0.6);  out.awayBelt=actors3dShade(a.shorts,0.6);
    out.homeBand=h.shorts; out.awayBand=a.shorts;
    // Kaleci: iki saha formasından (ve birbirinden) en uzak aday
    const GKS=[0xffb020,0xa36bff,0x22d3a6,0xff5fa2,0x9be22d,0x2d2d2d,0x00b4ff];
    const pickGk=(avoid)=>{ let best=GKS[0], bd=-1;
      GKS.forEach(c=>{ const d=Math.min(...avoid.map(x=>actors3dColDist(c,x))); if(d>bd){ bd=d; best=c; } }); return best; };
    out.homeGK=pickGk([out.home,out.away]);
    out.awayGK=pickGk([out.home,out.away,out.homeGK]);
  }catch(e){ return Object.assign({},D); }
  return out;
}
// Normal akış tempo sabitleri (m/sn, m/sn²). Önceki sürüm: koşu 14, sürme 8–9.5,
// sürtünme 3.2, pas varış hızı 6 → hepsi ~%40 düşürüldü.
// Normal akış (kuşbakışı canlı maç) %45 yavaş: koşu ve top hızları ×0.55, maç saati de
//   aynı oranda yavaş (overlay.js MATCH3D_TEMPO) → top kaleler arasında pinpon gibi gitmez.
//   Kilit an (manual) kendi sabitleriyle çalışır, etkilenmez.
// Adım 11: canlı akış %35 hızlandırıldı (0.55 × 1.35 ≈ 0.743); maç saati (MATCH3D_TEMPO),
//   koşu/top hızları ve senaryo süreleri hep bu tek orandan türediği için birlikte hızlanır.
const ACTORS3D_SLOW=0.55*1.35;
const ACTORS3D_SHOT_FAST=2.9;    // canlı akış şut uçuşu ek hız çarpanı (sert, akıcı şut; kilit an MOMENT3D_SHOT_FAST ile aynı)
// Canlı akış pas seçimi (m): bu mesafeye kadar yerden kısa pas, üstü havadan (ağır cezalı) ve
//   PASS_MAX'tan uzağa pas yok → oyuncular en yakın uygun arkadaşla kademeli paslaşır.
const ACTORS3D_PASS_SHORT=22, ACTORS3D_PASS_MAX=32;
// Canlı akış kaleci tepkisi: top bu kadar (m) yol alınca yön algılanır + refleks süresi (sn)
const ACTORS3D_GK_SEE=3.5, ACTORS3D_GK_REFLEX=0.16;
// Tek pas (ilk dokunuşta) olasılığı ve verkaç (pas ver-koş) koşu mesafesi (m)
const ACTORS3D_ONE_TOUCH=0.35, ACTORS3D_GIVE_GO=11;
// Gol konfetisi renkleri (siyah, beyaz, kırmızı)
const ACTORS3D_CONFETTI=[0x161616,0xffffff,0xe53935];
// Yerden pasın alıcıya varış hızı tavanı (m/sn): yüksek tempoda bile alıcı topu kontrol edebilsin
const ACTORS3D_PASS_VMAX=15*1.4;   // (arcade tempo ×ACTORS3D_ARCADE_PASS ile birlikte)
// Canlı akış topa temas (oyuncu merkezi ↔ top merkezi, m). Top görünürlük için büyük (yarıçap
//   0.42 m): REACH 0.85 → topun yüzeyi oyuncunun ~0.45 m önünde = ayak erişimi. Top yalnız bir
//   oyuncu bu mesafeye girince yön değiştirir (alma, kesme, sahipsiz topa varma).
//   TACKLE_R: ayak uzatarak müdahale (≈0.6 m ayak erişimi + top yarıçapı). Eskiden 1.15 / 1.5 m.
const ACTORS3D_REACH=0.85, ACTORS3D_TACKLE_R=1.05;
// Topu alan oyuncunun ayağına yumuşak oturma süresi (sn): top ışınlanıp yön değiştirmez
const ACTORS3D_GRAB_SEC=0.16;
// Canlı akış olayı (şut/gol/korner…) uçuştaki pası kesmez: top bir oyuncuya ulaşana ya da
//   yavaşlayana dek en çok bu kadar (sn) bekletilir, sonra senaryo topu o oyuncunun ayağından başlatır
const ACTORS3D_EV_WAIT=1.6;
// Şut olayı öncesi ATAK HAZIRLIĞI: hücum takımı en çok bu kadar sn (ya da PREP_PASSES pas + son üçte bir) pas yapar
const ACTORS3D_PREP_SEC=5.5, ACTORS3D_PREP_PASSES=4;
// Uzaktan şut: bu mesafeden (m) ötesi ancak şut reytingi ≥ SHT, önü açık oyuncu için LONG_P olasılıkla; LONG_MAX ötesi hiç
const ACTORS3D_LONG_D=18, ACTORS3D_LONG_MAX=25, ACTORS3D_LONG_SHT=78, ACTORS3D_LONG_P=0.15;
// Arcade tempo (canlı akış): oyuncu koşu hızları ve pas hızı +%40. Maç saati (overlay MATCH3D_TEMPO,
//   ACTORS3D_SLOW'dan türer) ve senaryo süreleri (slow) DEĞİŞMEZ → 2D ile olay eşzamanı korunur.
//   Yerden pasta sürtünme ×PASS² → aynı mesafede top aynı yoldan 1.4× hızlı gider (süre /1.4).
const ACTORS3D_ARCADE_RUN=1.4, ACTORS3D_ARCADE_PASS=1.4;
// Kilit an seri pası: kickTo hız çarpanı tavanı ve yerden pasın en yüksek çıkış hızı (m/sn)
//   (Adım 17: Adım 16'daki ×2 tavan — 13 / 140 m/sn — geri alındı: top 1–2 karede hedefe "ışınlanıyordu")
const ACTORS3D_KICK_MUL_MAX=6.5, ACTORS3D_KICK_VMAX=70;
// Canlı akış doğallığı (Adım 16): oyuncu başına bağımsız çapa yumuşatma süresi (sn, alt–üst),
//   mevki çevresinde salınım genliği (m), topa yönelme yarıçapı (m) ve koşu hızı varyasyonu (±)
const ACTORS3D_NAT_TAU=[0.3,0.85], ACTORS3D_NAT_AMP=[0.7,2.3], ACTORS3D_NAT_PULL_R=20, ACTORS3D_NAT_SPD=0.12;
const ACTORS3D_PACE={
  slow:0.6*ACTORS3D_SLOW,     // senaryo/olay süreleri bu oranla uzar
  // Adım 15: oyuncu hızları ~×1.2 (daha dinamik pozisyon alma)
  run:9.8*ACTORS3D_SLOW*ACTORS3D_ARCADE_RUN,      // en yüksek koşu (santra dönüşü vb.)
  dribble:5.6*ACTORS3D_SLOW*ACTORS3D_ARCADE_RUN,  // top sürme
  receive:7.0*ACTORS3D_SLOW*ACTORS3D_ARCADE_RUN,  // pas alıcısı
  chase:7.4*ACTORS3D_SLOW*ACTORS3D_ARCADE_RUN,    // sahipsiz topa koşu
  press:6.4*ACTORS3D_SLOW*ACTORS3D_ARCADE_RUN,    // baskı (yaklaşırken), uzaktaysa chase
  support:5.4*ACTORS3D_SLOW*ACTORS3D_ARCADE_RUN,  // üçgen kuran destek oyuncuları
  rollFric:2.6*ACTORS3D_SLOW*ACTORS3D_SLOW*ACTORS3D_ARCADE_PASS*ACTORS3D_ARCADE_PASS, // yerden pasın yavaşlaması (hız ×0.55 → sürtünme ×0.55²)
  passEnd:14.5*ACTORS3D_SLOW*ACTORS3D_ARCADE_PASS, // yerden pasın alıcıya varış hızı (Adım 15: 11.5 → 14.5)
  loftT:1/(ACTORS3D_SLOW*ACTORS3D_ARCADE_PASS),      // havadan pas uçuş süresi çarpanı
  tick:0.47/ACTORS3D_SLOW,    // normal hızda ballPos güncelleme aralığı (sn; tempo() referansı)
};

const ACTORS3D_BALL_CANVAS={cv:null,bump:null};   // futbol topu dokusu + dikiş kabartması tuvalleri (bir kez üretilir)
const ACTORS3D_BLOB_CANVAS={cv:null};   // yumuşak gölge/parıltı lekesi tuvali (bir kez üretilir)
// Top izi (gol/kurtarış/şut senaryosu, hızlı top): nokta sayısı ve izin açıldığı hız (m/sn)
const ACTORS3D_TRAIL_N=18, ACTORS3D_TRAIL_V=10;
// Kuşbakışı takım halkası + numara rozetinin zemindeki boyu (m)
const ACTORS3D_BADGE_M=3.0;
function createMatchActors3D(api,opts={}){
  const noop={update(){},triggerEvent(){},resetKickoff(){},dispose(){},
    movePlayer(){},getPlayerPos(){return null;},setBall(){},playBallScript(){},
    goalFx(){},ringFx(){},shakeGoal(){},getBall(){return null;},
    drivePlayer(){},setOwner(){},getOwner(){return null;},kickTo(){return 0;},kickBall(){},
    getBallVel(){return null;},isBallFree(){return false;},getPlayer(){return null;},poseFx(){},
    actionFx(){},diveFx(){},faceToward(){},setPlayerFade(){},setPlayerHidden(){},setBallIdleFx(){},setBallIdleOffset(){},ballR:0.2};
  if(!api||!api.THREE||api.isDisposed()) return noop;
  const THREE=api.THREE, D=PITCH3D_DIM, L=D.halfLen, H=D.halfWid, GW=D.goalWidth/2;
  // opts.colors: takım forma renkleri (actors3dKitColors); yoksa varsayılan mavi/kırmızı
  const COL=opts.colors&&typeof opts.colors==="object"?Object.assign({},ACTORS3D_COLORS,opts.colors):ACTORS3D_COLORS, PACE=ACTORS3D_PACE, BR=0.2; // top yarıçapı (m): gerçek boy oyunculara oranlı (gerçek ~0.11; okunurluk için ~1.8×). Kilit an fiziği de bunu kullanır (ballR)
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
  // Hazır insan modeli (assets/models/player.glb, assets3d.js): yüklenince her oyuncuya iskeletli
  //   bir kopya eklenir ve prosedürel rig görünmez sürücüye dönüşür. Yüklenemezse rig görünür kalır.
  let glbKit=null;
  const attachGlb=(p)=>{
    if(!glbKit||!p||p.rig.glb) return;
    const inst=glbKit.make(p.rig.kit,p.rig.skin,p.idx*3+(p.team==="away"?1:0));
    p.sg.add(inst.root); p.rig.glb=inst;
    const r=p.rig; [r.torso,r.head,r.armL,r.armR,r.thighL,r.thighR].forEach(m=>{ m.visible=false; });
    inst.sync(r);
  };
  if(typeof assets3dLoadPlayerKit==="function"){
    assets3dLoadPlayerKit(THREE,kit,()=>!disposed&&!api.isDisposed()).then(pk=>{
      if(!pk) return;
      if(disposed||api.isDisposed()){ pk.dispose(); return; }
      glbKit=pk;
      teams.home.forEach(attachGlb); teams.away.forEach(attachGlb);
      if(api.renderOnce) api.renderOnce();
    }).catch(()=>{});
  }
  // Gerçek insan boyu: kale yüksekliğinin ~%74.5'i ≈ 1.82 m — TÜM oyuncular (kaleci, saha oyuncuları,
  //   baraj) aynı gerçekçi boyda (NSM referansı); snapshot h (m) verilirse o kullanılır.
  const ACTORS3D_REAL_H=PITCH3D_DIM.goalHeight*0.745;
  const setPlayerScale=(p,h)=>{
    const s=Number.isFinite(h)&&h>0?clamp(h/RIG3D_RIG_H,0.3,1):1;
    if(p.sk===s) return;
    p.sk=s; p.sg.scale.setScalar(s);
    p.rig.reach=1/s;                                   // dalışta yana uzanma dünyada aynı (rig3d.js)
    if(p.label&&p.label.s) p.label.s.position.y=s<1?3.95*s+0.45:3.95;
  };
  const shadowGeo=G(flat(new THREE.CircleGeometry(0.85,14)));
  const ballGeo=G(new THREE.SphereGeometry(BR,32,20));   // pürüzsüz top (desen dokuda)
  const ringGeo=G(flat(new THREE.RingGeometry(0.8,1.15,32)));
  const poleGeo=G(new THREE.CylinderGeometry(0.05,0.05,1.8,6)); poleGeo.translate(0,0.9,0);
  const flagGeo=G(new THREE.PlaneGeometry(0.7,0.45)); flagGeo.translate(0.35,1.55,0);

  // ── Paylaşılan malzemeler ──
  const lam=(c)=>M(new THREE.MeshLambertMaterial({color:c}));
  // Yumuşak gölge lekesi (blob): beyaz merkez → saydam kenar radyal gradyan (64², bir kez).
  //   Gölge malzemeleri siyah renk × bu dokunun alfası → kenarı yumuşak düşen gölge (gölge haritası yok).
  //   Aynı doku top izinde (toplamsal) ve takım halkasında da kullanılır.
  const blobTex=(()=>{
    try{
      let cv=ACTORS3D_BLOB_CANVAS.cv;
      if(!cv){
        cv=document.createElement("canvas"); cv.width=64; cv.height=64;
        const ctx=cv.getContext("2d"); if(!ctx||!ctx.createRadialGradient) return null;
        const gr=ctx.createRadialGradient(32,32,0,32,32,32);
        gr.addColorStop(0,"rgba(255,255,255,1)"); gr.addColorStop(0.45,"rgba(255,255,255,0.75)");
        gr.addColorStop(0.8,"rgba(255,255,255,0.22)"); gr.addColorStop(1,"rgba(255,255,255,0)");
        ctx.fillStyle=gr; ctx.fillRect(0,0,64,64);
        ACTORS3D_BLOB_CANVAS.cv=cv;
      }
      const t=new THREE.CanvasTexture(cv); owned.texs.push(t); return t;
    }catch(e){ return null; }
  })();
  const mats={
    pole:lam(0xeeeeee),
    // Top: fiziksel tabanlı (hemisfer + güneş ışığı sahnede var → siyah kalmaz); dengeli pürüzlülük
    ball:M(new THREE.MeshStandardMaterial({color:COL.ball,roughness:0.42,metalness:0.04,emissive:0x111111})),
    flag:M(new THREE.MeshBasicMaterial({color:0xffd23f,side:THREE.DoubleSide})),
    shadow:M(new THREE.MeshBasicMaterial({color:0x000000,map:blobTex,transparent:true,opacity:blobTex?0.5:0.32,depthWrite:false,
      polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-3})),
    ballShadow:M(new THREE.MeshBasicMaterial({color:0x0a140a,map:blobTex,transparent:true,opacity:0.4,depthWrite:false,
      polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-3})),
  };

  const root=new THREE.Group(); root.name="actors";
  const ballRoot=new THREE.Group(); ballRoot.name="ballActor";
  const fxRoot=new THREE.Group(); fxRoot.name="fxActors";
  api.groups.players.add(root); api.groups.ball.add(ballRoot); api.groups.fx.add(fxRoot);

  // Köşe bayrakları (kameraya çok yakın olan gizlenir: korner vuruş ekranında kumaş ekranı kapatmasın)
  const cornerFlags=[];
  [[-1,-1],[1,-1],[1,1],[-1,1]].forEach(([sx,sz])=>{
    const p=new THREE.Mesh(poleGeo,mats.pole); p.position.set(sx*L,0,sz*H); root.add(p);
    const f=new THREE.Mesh(flagGeo,mats.flag); f.position.set(sx*L,0,sz*H); f.rotation.y=sx>0?Math.PI:0; root.add(f);
    cornerFlags.push(p,f);
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
  //   Tuval modül düzeyinde bir kez üretilir (her kilit anda takılma olmasın).
  //   Yüksek çözünürlük (1024×512, oturum başına bir kez ~4× eski süre). Paneller piksel başına KÜRE
  //   YÖNÜNDEN hesaplandığı için kutuplarda bozulmaz. Aynı geçişte dikiş kabartması (bumpMap):
  //   panel ortası yüksek, dikişe yaklaştıkça yumuşakça oluğa iner.
  try{
    let cv=ACTORS3D_BALL_CANVAS.cv, bcv=ACTORS3D_BALL_CANVAS.bump;
    if(!cv){
    const TW=1024, TH=512; cv=document.createElement("canvas"); cv.width=TW; cv.height=TH;
    bcv=document.createElement("canvas"); bcv.width=TW; bcv.height=TH;
    const g2=cv.getContext("2d"), img=g2&&g2.createImageData?g2.createImageData(TW,TH):null;
    const gb=bcv.getContext("2d"), bimg=gb&&gb.createImageData?gb.createImageData(TW,TH):null;
    if(!bimg) bcv=null;
    if(!img) cv=null;
    if(img){
      const bpx=bimg?bimg.data:null;
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
          const gap=Math.acos(Math.min(1,b2))-Math.acos(Math.min(1,b1)), seam=gap<0.03;
          const v=seam?70:C[k1][3]?24:246, j=(y*TW+x)*4;
          px[j]=v; px[j+1]=v; px[j+2]=v+(C[k1][3]||seam?0:4); px[j+3]=255;
          if(bpx){ const e=Math.min(1,gap/0.09), hv=Math.round(255*(0.25+0.75*e*e*(3-2*e))); bpx[j]=hv; bpx[j+1]=hv; bpx[j+2]=hv; bpx[j+3]=255; }
        }
      }
      g2.putImageData(img,0,0);
      if(bimg) gb.putImageData(bimg,0,0);
      ACTORS3D_BALL_CANVAS.cv=cv; ACTORS3D_BALL_CANVAS.bump=bcv;
    }
    }
    if(cv){
      // encoding ayarlanmaz: renderer doğrusal çıktı veriyor (diğer CanvasTexture'larla aynı)
      const tex=new THREE.CanvasTexture(cv); owned.texs.push(tex);
      mats.ball.map=tex;
      if(bcv){ const bt=new THREE.CanvasTexture(bcv); owned.texs.push(bt); mats.ball.bumpMap=bt; mats.ball.bumpScale=0.012; }
      mats.ball.needsUpdate=true;
    }
  }catch(e){ /* doku üretilemedi: düz beyaz top */ }

  const teams={home:[],away:[]};
  // ── Devre yönü ──
  // 2D motor (overlay) yönü hiç değiştirmez: bizim takım (home) 2D'de hep x=0 → x=100'e hücum eder.
  //   3D'de 1. yarı home soldan sağa (+X, hedef kale +L), 2. yarı sağdan sola (−X): snapshot'tan
  //   gelen TÜM 2D koordinatlar 2. yarıda saha merkezine göre 180° döndürülür (x,z → −x,−z; kanatlar
  //   takımın kendi solunda/sağında kalır). Kilit an sahnesi (manual) kendi koordinatıyla çalışır: hs=1.
  let hs=1;
  const atkDir=(team)=>(team==="away"?-1:1)*hs;             // takımın hücum yönü (+1: +X kalesine)
  const toW=(x,y,out)=>{ pitchToWorld3D(x,y,0,out); if(hs<0){ out.x=-out.x; out.z=-out.z; } return out; };
  // ── Kuşbakışı okunurluk: zeminde ışıklı takım halkası + forma numarası rozeti ──
  // Oyuncu başına 128² tuval (bir kez; kaleci olunca yeniden çizilir), paylaşılan düz geometri.
  //   Yalnız yüksek kamerada (kuşbakışı/2.5D) görünür; çim seviyesi vuruş ekranında gizli.
  //   Numara her karede ekranın "yukarı"sına döner (kamera bakış yönü) → hep düz okunur.
  //   Numara (snapshot gerçek forma numarası taşımaz): kaleci 1, saha oyuncuları dizilim sırasıyla
  //   boşluksuz 2, 3, … (applyDots p.num'u hesaplar; değişince rozet yeniden çizilir).
  const badgeGeo=G(flat(new THREE.PlaneGeometry(ACTORS3D_BADGE_M,ACTORS3D_BADGE_M)));
  const hexCss=(h)=>"#"+("000000"+(h>>>0).toString(16)).slice(-6);
  const drawBadge=(p)=>{
    if(!p.badge){
      const cv=document.createElement("canvas"); cv.width=128; cv.height=128;
      const tex=new THREE.CanvasTexture(cv); tex.anisotropy=2;
      const m=new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,fog:false});
      owned.texs.push(tex); owned.mats.push(m);
      const mesh=new THREE.Mesh(badgeGeo,m); mesh.renderOrder=2; mesh.visible=false; mesh.frustumCulled=false;
      root.add(mesh);
      p.badge={cv,ctx:cv.getContext("2d"),tex,mesh};
    }
    const {ctx,tex}=p.badge; if(!ctx) return;
    const home=p.team==="home", col=hexCss(p.gk?(home?COL.homeGK:COL.awayGK):(home?COL.home:COL.away));
    ctx.clearRect(0,0,128,128);
    // Işıklı halka: dış parıltı + dolu halka + ince iç kontur
    ctx.save(); ctx.shadowColor=col; ctx.shadowBlur=14;
    ctx.strokeStyle=col; ctx.lineWidth=9; ctx.globalAlpha=0.9;
    ctx.beginPath(); ctx.arc(64,64,44,0,Math.PI*2); ctx.stroke(); ctx.restore();
    ctx.strokeStyle="rgba(255,255,255,0.55)"; ctx.lineWidth=2;
    ctx.beginPath(); ctx.arc(64,64,38,0,Math.PI*2); ctx.stroke();
    // Numara rozeti: halkanın alt kenarında (ekranda oyuncunun altında) dolu daire
    const n=String(p.gk?1:clamp(Number(p.num)||2,2,99));
    ctx.fillStyle=col; ctx.strokeStyle="#ffffff"; ctx.lineWidth=3;
    ctx.beginPath(); ctx.arc(64,104,19,0,Math.PI*2); ctx.fill(); ctx.stroke();
    // Numara: açık formada koyu, koyu formada beyaz (beyaz / sarı formalarda da okunur)
    { const c0=p.gk?(home?COL.homeGK:COL.awayGK):(home?COL.home:COL.away), lum=(0.299*(c0>>16&255)+0.587*(c0>>8&255)+0.114*(c0&255))/255;
      ctx.fillStyle=lum>0.62?"#141821":"#ffffff"; }
    ctx.font="bold 24px sans-serif"; ctx.textAlign="center"; ctx.textBaseline="middle";
    ctx.fillText(n,64,105,32);
    tex.needsUpdate=true;
  };
  const badgeDir=new THREE.Vector3();
  const makePlayer=(team,idx)=>{
    const g=new THREE.Group();
    const home=team==="home";
    const rig=kit.build(team,false,idx);
    // Ölçek grubu: rig + hazır model birlikte ölçeklenir (gerçek boy: kaleci/baraj); etiket ölçeklenmez
    const sg=new THREE.Group(); sg.name="playerScale";
    sg.add(rig.body); g.add(sg);
    g.visible=false;
    root.add(g);
    // vx/vz: yumuşatılmış hız · ovr/ox/oz/cap: oyun mantığının geçici hedefi ve hız
    // sınırı · driven: konum dışarıdan sürülüyor (kilit an) · face*: kısa süre sabit bakış
    return {g,sg,sk:1,rig,body:rig.body,team,idx,pos:new THREE.Vector3(),tgt:new THREE.Vector3(),
      yaw:home?Math.PI/2:-Math.PI/2,speed:0,has:false,gk:false,role:"CM",
      vx:0,vz:0,lx:0,lz:0,ovr:false,ox:0,oz:0,cap:0,driven:false,
      faceT:0,faceYaw:0,tackleCd:0,label:null,labelText:null,badge:null,
      // Doğal hareket (canlı akış): bağımsız tepki süresi, salınım fazı/frekansı/genliği, topa yönelme, hız
      nvTau:ACTORS3D_NAT_TAU[0]+Math.random()*(ACTORS3D_NAT_TAU[1]-ACTORS3D_NAT_TAU[0]),
      nvPh:Math.random()*Math.PI*2, nvPh2:Math.random()*Math.PI*2,
      nvFf:0.16+Math.random()*0.22, nvFz:0.13+Math.random()*0.24,
      nvAmp:ACTORS3D_NAT_AMP[0]+Math.random()*(ACTORS3D_NAT_AMP[1]-ACTORS3D_NAT_AMP[0]),
      nvPull:0.35+Math.random()*0.55, nvSpd:1+(Math.random()*2-1)*ACTORS3D_NAT_SPD};
  };
  const ensurePlayer=(team,i)=>{
    const list=teams[team];
    while(list.length<=i){ const p=makePlayer(team,list.length); list.push(p); attachGlb(p); }
    return list[i];
  };

  // ── İsim etiketleri (oyuncu başına küçük canvas, bir kez oluşturulur) ──
  // Tuval 128×64: üst yarı TAM ad, alt yarı KISA ad. Doku repeat/offset ile yarı seçilir → durum
  //   değişince yeniden çizim yok. TAM ad (topa sahip + 2 pas seçeneği) kesilmez/sıkıştırılmaz:
  //   uzun adda yazı boyu küçülür (19 → en az 13 px). Diğer (soluk) etiketler BİLEREK kısaltılır
  //   (LBL_SHORT: 6 harften uzunsa ilk 5 harf + "."); karakter eklenmez.
  const LBL_SHORT=(t)=>t.length>6?t.slice(0,5)+".":t;
  const fitText=(ctx,text,maxW)=>{
    let fs=19; ctx.font="bold 19px sans-serif";
    const w=ctx.measureText(text).width;
    if(w>maxW){ fs=Math.max(13,Math.floor(19*maxW/w)); ctx.font="bold "+fs+"px sans-serif"; }
    return Math.min(maxW,ctx.measureText(text).width);
  };
  const drawPill=(ctx,text,yOff,cvW)=>{
    const tw0=fitText(ctx,text,cvW-18);
    const tw=Math.min(cvW-4,tw0+14);
    const x0=(cvW-tw)/2, y0=yOff+3, h=26, r=6;
    ctx.fillStyle="rgba(0,0,0,0.62)";
    ctx.beginPath();
    ctx.moveTo(x0+r,y0); ctx.lineTo(x0+tw-r,y0); ctx.quadraticCurveTo(x0+tw,y0,x0+tw,y0+r);
    ctx.lineTo(x0+tw,y0+h-r); ctx.quadraticCurveTo(x0+tw,y0+h,x0+tw-r,y0+h);
    ctx.lineTo(x0+r,y0+h); ctx.quadraticCurveTo(x0,y0+h,x0,y0+h-r);
    ctx.lineTo(x0,y0+r); ctx.quadraticCurveTo(x0,y0,x0+r,y0);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle="#ffffff"; ctx.textAlign="center"; ctx.textBaseline="middle";
    ctx.fillText(text,cvW/2,y0+h/2+1,cvW-10);
    return tw/cvW;
  };
  const drawLabel=(p,text)=>{
    if(!p.label){
      const cv=document.createElement("canvas"); cv.width=128; cv.height=64;
      const tex=new THREE.CanvasTexture(cv);
      tex.minFilter=THREE.LinearFilter; tex.generateMipmaps=false;
      tex.repeat.set(1,0.5); tex.offset.set(0,0.5);           // üst yarı (tam ad)
      const m=new THREE.SpriteMaterial({map:tex,transparent:true,depthWrite:false});
      const s=new THREE.Sprite(m); s.scale.set(4.4,1.1,1); s.position.y=3.95; s.renderOrder=5;
      p.g.add(s);
      owned.texs.push(tex); owned.mats.push(m);
      // cy/cyT: sprite merkezi (ekran uzayı kaydırma; 0.5 = baş üstü) · hide: çakışma nedeniyle gizli
      // k: mesafe ölçeği · dist: kameraya uzaklık · wf/wfS: tam/kısa plakanın tuval genişliğine oranı
      // pri: yerleşim önceliği · dim: soluk + kısa ad · a: geçerli saydamlık
      p.label={cv,ctx:cv.getContext("2d"),tex,s,cy:0.5,cyT:0.5,hide:false,k:1,dist:0,wf:1,wfS:1,pri:0,dim:false,a:1};
    }
    const {cv,ctx,s}=p.label;
    p.labelText=text;
    if(!text||!ctx){ s.visible=false; return; }
    s.visible=!p.label.hide&&!p.hid;
    ctx.clearRect(0,0,cv.width,cv.height);
    p.label.wf=drawPill(ctx,text,0,cv.width);
    p.label.wfS=drawPill(ctx,LBL_SHORT(text),32,cv.width);
    p.label.tex.needsUpdate=true;
  };
  const applyLabels=(labels)=>{
    const list=teams.home;
    for(let i=0;i<list.length;i++){
      const t=(labels&&labels[i])||"";
      if(list[i].labelText!==t) drawLabel(list[i],t);
    }
  };

  // ── Etiket ölçeği ve çakışma önleme (ekran uzayı) ──
  // Ölçek her karede: kamera uzaklığıyla orantılı → ekranda yaklaşık sabit, okunur boy.
  // Yerleşim ~0.17 sn'de bir, öncelik sırasıyla (topa sahip, sonra topa en yakın) açgözlü:
  //   etiket önce baş üstünde denenir; yerleşmiş bir plakayla çakışırsa EKRANDA ÜSTTEKİ oyuncunun
  //   etiketi yukarı (1–2 kademe), alttakinin etiketi aşağı (ayaklarının altına) itilir; hiçbiri
  //   sığmazsa gizlenir. İlk LBL.full etiket (topa sahip + en yakın 2 pas seçeneği) tam ad ve tam
  //   opak, diğerleri kısa ad + soluk. Kaydırma Sprite.center ile (ekran uzayı, kameradan bağımsız).
  // Tahsis yok: vektör, sıra dizisi, aday ve kutu tamponları yeniden kullanılır.
  const LBL={ref:60,kMin:0.75,kMax:1.8,w:4.4,h:1.1,y:3.95,every:0.17,pad:3,gap:2,full:3,dimA:0.5,
    pillH:26/32};                                 // plaka yüksekliği / görünen tuval yarısı yüksekliği
  const lblV=new THREE.Vector3();
  const lblP={x:0,y:0};
  const lblOrder=[];
  const lblBox=new Float64Array(5*24);            // yerleşen plakalar: x, y, yarı genişlik, yarı yükseklik, oyuncu taban y (px)
  const lblCand=new Float64Array(4);              // aday ekran kaydırmaları (px, + aşağı)
  let lblNext=0, lblPrev=-1;
  // Oyuncu konumu + y yüksekliği → tuval pikseli (lblP); ekranda değilse false
  const lblProj=(p,y,cam,cw,ch)=>{
    lblV.set(p.g.position.x,y,p.g.position.z); root.localToWorld(lblV);
    lblV.project(cam);
    if(!(lblV.z<1)||!Number.isFinite(lblV.x)||!Number.isFinite(lblV.y)) return false;
    lblP.x=(lblV.x+1)*0.5*cw; lblP.y=(1-lblV.y)*0.5*ch;
    return true;
  };
  const lblHit=(nb,x,y,hw,hh)=>{
    for(let b=0;b<nb;b++){
      const q=b*5;
      if(Math.abs(x-lblBox[q])<hw+lblBox[q+2]&&Math.abs(y-lblBox[q+1])<hh+lblBox[q+3]) return b;
    }
    return -1;
  };
  const layoutLabels=()=>{
    const cam=api.camera;
    if(!cam||!cam.isPerspectiveCamera) return;   // kamera yoksa eski (sabit) davranış
    const list=teams.home;
    if(!list.length) return;
    const first=lblPrev<0;
    const dt=first?0:clamp(clk-lblPrev,0,0.1);
    lblPrev=clk;
    const kY=first?1:1-Math.exp(-dt*10);
    // 1) Mesafe ölçeği + ekran kaydırma / saydamlık geçişi (her kare)
    for(let i=0;i<list.length;i++){
      const p=list[i], lb=p.label;
      if(!lb||!p.labelText||!lb.ctx||!p.g.visible||p.hid) continue;
      const s=lb.s;
      lblV.set(p.g.position.x,LBL.y,p.g.position.z); root.localToWorld(lblV);
      const dist=lblV.distanceTo(cam.position);
      const k=clamp(dist/LBL.ref,LBL.kMin,LBL.kMax);
      lb.k=k; lb.dist=dist;
      s.scale.set(LBL.w*k,LBL.h*k,1);
      lb.cy+=(lb.cyT-lb.cy)*kY; s.center.y=lb.cy;
      const aT=lb.dim?LBL.dimA:1; lb.a+=(aT-lb.a)*kY; s.material.opacity=lb.a*(p.fadeA==null?1:p.fadeA);
      s.visible=!lb.hide;
    }
    // 2) Çakışma önleme (seyrek)
    if(!(clk>=lblNext||clk<lblNext-1)) return;   // (saat geri sardıysa da yeniden yerleştir)
    lblNext=clk+LBL.every;
    const cv=api.renderer&&api.renderer.domElement;
    const cw=Math.max(1,(cv&&cv.clientWidth)||1), ch=Math.max(1,(cv&&cv.clientHeight)||1);
    const tanHalf=Math.tan((cam.fov||45)*Math.PI/360);
    const o=ownerP();
    lblOrder.length=0;
    for(let i=0;i<list.length;i++){
      const p=list[i], lb=p.label;
      if(!lb||!p.labelText||!lb.ctx||!p.g.visible||p.hid) continue;
      // Öncelik: topa sahip (−1) → topa / sahibe en yakın (pas seçenekleri)
      const rx=o&&o.team==="home"?o.pos.x:bpos.x, rz=o&&o.team==="home"?o.pos.z:bpos.z;
      lb.pri=p===o?-1:Math.hypot(p.pos.x-rx,p.pos.z-rz);
      let j=lblOrder.length; lblOrder.push(p);
      while(j>0&&lblOrder[j-1].label.pri>lb.pri){ lblOrder[j]=lblOrder[j-1]; j--; }
      lblOrder[j]=p;
    }
    let nb=0;
    for(let i=0;i<lblOrder.length;i++){
      const p=lblOrder[i], lb=p.label, k=lb.k;
      // Kademe: ilk LBL.full tam ad + opak, diğerleri kısa ad + soluk (doku yarısı değişir)
      const dim=i>=LBL.full;
      if(dim!==lb.dim){ lb.dim=dim; lb.tex.offset.y=dim?0:0.5; }
      const ppm=ch/(2*tanHalf*Math.max(1,lb.dist));            // metre başına piksel
      const spx=Math.max(1,ppm*LBL.h*k);                        // sprite yüksekliği (px)
      const hw=ppm*LBL.w*k*(dim?lb.wfS:lb.wf)*0.5+LBL.pad, hh=spx*LBL.pillH*0.5+LBL.pad*0.5;
      if(!lblProj(p,LBL.y,cam,cw,ch)){ lb.hide=false; lb.cyT=0.5; lb.s.visible=true; continue; }   // ekran dışı: dokunma
      const bx=lblP.x, by=lblP.y;
      // Ayak (zemin) noktası: aşağı itilen etiket ayakların hemen altına
      const footDy=lblProj(p,0,cam,cw,ch)?Math.max(spx,lblP.y-by):spx*3;
      const stepUp=2*hh+LBL.gap;
      let dy=NaN;
      const h0=lblHit(nb,bx,by,hw,hh);
      if(h0<0) dy=0;
      else {
        // Çakışan plakanın oyuncusu ekranda bu oyuncunun ÜSTÜNDEYSE bu (alttaki) aşağı itilir; değilse yukarı
        const lower=lblBox[h0*5+4]<by;
        if(lower){ lblCand[0]=footDy+hh+LBL.gap; lblCand[1]=-stepUp; lblCand[2]=-2*stepUp; }
        else { lblCand[0]=-stepUp; lblCand[1]=-2*stepUp; lblCand[2]=footDy+hh+LBL.gap; }
        for(let c=0;c<3;c++){ if(lblHit(nb,bx,by+lblCand[c],hw,hh)<0){ dy=lblCand[c]; break; } }
      }
      if(!Number.isFinite(dy)){
        if(i===0) dy=0;                                       // topa sahip / ilk etiket hep görünür
        else { lb.hide=true; lb.s.visible=false; continue; }
      }
      lb.hide=false; lb.s.visible=true;
      lb.cyT=0.5+dy/spx;                                        // center.y artınca sprite ekranda aşağı kayar
      if(nb*5+5<=lblBox.length){
        const q=nb*5; lblBox[q]=bx; lblBox[q+1]=by+dy; lblBox[q+2]=hw; lblBox[q+3]=hh; lblBox[q+4]=by; nb++;
      }
    }
    lblOrder.length=0;
  };

  const applyDots=(team,dots)=>{
    const list=teams[team];
    const n=dots?dots.length:0;
    let outNo=2;   // saha oyuncusu numara sayacı (kaleci 1)
    for(let i=0;i<n;i++){
      const d=dots[i];
      const dx=d?Number(d.x):NaN, dy=d?Number(d.y):NaN;
      if(!Number.isFinite(dx)||!Number.isFinite(dy)){ // NaN koruması: geçerli veri gelene kadar gizli
        if(list[i]) list[i].g.visible=false;
        continue;
      }
      const p=ensurePlayer(team,i);
      toW(dx,dy,p.tgt);
      const gk=d.role==="GK";
      const num=gk?1:outNo++;
      let redraw=false;
      if(gk!==p.gk){ p.gk=gk; kit.setKit(p.rig,gk); redraw=true; }
      // Boy: snapshot h (m) → yoksa gerçek insan boyu (herkes kaleciyle aynı ölçek)
      setPlayerScale(p,Number.isFinite(d.h)?d.h:ACTORS3D_REAL_H);
      if(num!==p.num){ p.num=num; redraw=true; }
      if(!p.badge||redraw){ try{ drawBadge(p); }catch(e){} }
      p.role=d.role||"CM";
      if(!p.has){ p.pos.copy(p.tgt); p.lx=p.pos.x; p.lz=p.pos.z; p.has=true; p.g.position.copy(p.pos); p.g.rotation.y=p.yaw; }
      p.g.visible=true;
    }
    for(let i=n;i<list.length;i++) list[i].g.visible=false;
  };

  // ── Top ──
  const ball=new THREE.Mesh(ballGeo,mats.ball); ballRoot.add(ball);
  // Hazır top modeli (assets/models/ball.glb, assets3d.js): topun çocuğu olur (konum/dönme/ölçek
  //   aynen geçerli), prosedürel küre gizlenir. Yüklenemezse prosedürel top olduğu gibi kalır.
  if(typeof assets3dApplyBall==="function"){
    assets3dApplyBall(THREE,ball,BR,()=>!disposed&&!api.isDisposed())
      .then(ok=>{ if(ok&&api.renderOnce) api.renderOnce(); }).catch(()=>{});
  }
  const ballShadow=new THREE.Mesh(shadowGeo,mats.ballShadow); ballShadow.renderOrder=1; ballRoot.add(ballShadow);
  // Temas gölgesi: top yerdeyken altında küçük, koyu çekirdek (yükseldikçe söner)
  const ballContactMat=M(new THREE.MeshBasicMaterial({color:0x050a05,map:blobTex,transparent:true,opacity:0.7,depthWrite:false,
    polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-4}));
  const ballContact=new THREE.Mesh(shadowGeo,ballContactMat); ballContact.renderOrder=2; ballRoot.add(ballContact);
  // Top izi: kısa, sönen nokta şeridi (tek Points, toplamsal; renk siyaha inince görünmez).
  //   Konum/renk dizileri bir kez ayrılır; karede yalnız kaydırılır (tahsis yok).
  const trailPos=new Float32Array(ACTORS3D_TRAIL_N*3), trailCol=new Float32Array(ACTORS3D_TRAIL_N*3);
  const trailGeo=G(new THREE.BufferGeometry());
  const trailPA=new THREE.BufferAttribute(trailPos,3), trailCA=new THREE.BufferAttribute(trailCol,3);
  if(trailPA.setUsage&&THREE.DynamicDrawUsage){ trailPA.setUsage(THREE.DynamicDrawUsage); trailCA.setUsage(THREE.DynamicDrawUsage); }
  trailGeo.setAttribute("position",trailPA); trailGeo.setAttribute("color",trailCA);
  const trailMat=M(new THREE.PointsMaterial({size:BR*2.3,map:blobTex,vertexColors:true,transparent:true,depthWrite:false,
    blending:THREE.AdditiveBlending,sizeAttenuation:true,fog:false}));
  const trail=new THREE.Points(trailGeo,trailMat); trail.frustumCulled=false; trail.visible=false; trail.renderOrder=3;
  ballRoot.add(trail);
  let trailK=0;   // iz yoğunluğu 0–1 (yumuşak açılıp kapanır)
  let hookRdt=0;   // son karenin gerçek süresi (sn; ağır çekimden bağımsız; hook günceller)
  const ballIdle={spin:0,bob:0,t:0,ox:0,oy:0,oz:0};   // vuruş ekranı canlı top (setBallIdleFx)
  const bpos=new THREE.Vector3(0,0,0);         // y = yerden yükseklik (top merkezi BR+y)
  const fl={on:false,script:false,sx:0,sy:0,sz:0,ex:0,ey:0,ez:0,h:0,dur:1,t:0,fn:null};
  const legs=[];                                // senaryo kuyruğu (olay başına doldurulur)
  const pend={on:false,x:0,z:0};                // kilit sırasında gelen son ballPos
  // Duran top (canlı akış): santra / kale vuruşu / taç / serbest vuruş / korner. rsNext: senaryo bitince başlayacak
  const rs={on:false,kind:"",team:"home",x:0,z:0,p:null,t0:0,min:1};
  const rsNext={kind:"",team:"home",x:0,z:0,go:false};   // go: gol oldu, takımlar santraya dönüyor
  const evQ=[];                                 // bekleyen top olayları {ev,t} (uçuştaki pas bitsin diye; ACTORS3D_EV_WAIT)
  const tmpV=new THREE.Vector3();
  let lockUntil=0, clk=0, ballInit=false;

  // ── Top fiziği ──
  // Kilit an (manual) eski sabitlerle çalışır: denge ölçümü (moment3d) bu sürelere göre yapıldı.
  const G_ACC=9.8, TAU=Math.PI*2;
  const ROLL_FRIC=manual?3.2:PACE.rollFric, PASS_VEND=manual?6:PACE.passEnd;
  const own={team:null,i:-1,since:0,dwell:1,decide:0,dribble:false,touchT:0,px:0,pz:0,drN:0,fromT:null,fromI:-1};
  const bvel=new THREE.Vector3();                // serbest topun hızı (y dikey)
  // Önceki karedeki top konumu: temas denetimi önceki→şimdiki parça ile (hızlı pasta tünelleme yok)
  const bprev={x:0,z:0};
  const ballSegD=(x,z)=>{
    const sx=bpos.x-bprev.x, sz=bpos.z-bprev.z;
    if(sx*sx+sz*sz>64) return Math.hypot(bpos.x-x,bpos.z-z);   // ışınlama (>8 m): yalnız şimdiki konum
    return segPointDist3D(bprev.x,bprev.z,bpos.x,bpos.z,x,z);
  };
  const curl={x:0,z:0,t:0};                      // falso: kısa süreli yanal ivme
  let freeBall=false;                            // top ayaktan koptu, fizikle ilerliyor
  const rcv={team:null,i:-1,x:0,z:0,t:0,tried:0};// pas alıcısı, buluşma noktası, zaman aşımı, kesme denemeleri (bit)
  const bt={on:false,x:0,z:0};                   // son ballPos hedefi (dünya)
  const anc={x:0,z:0,on:false};                  // yumuşatılmış ballPos (çapa)
  const passPt={x:0,z:0};                        // öngörülü hedef (tahsis yok)
  const pk={on:false,t:0,x:0,z:0,lofted:false,team:null,i:-1}; // gecikmeli pas (önce vuruş animasyonu)
  const scr={p:null,x:0,z:0,until:0};            // senaryo oyuncusu (olayda topa koşan)
  let chaser=null, chaseT=0, postScript=false, farT=0, lastPoss=null;
  // Hücum kurulumu (kilit an öncesi, overlay buildUp): team öne dönük oynar (pas puanında ilerleme
  //   ağırlığı yüksek, 2D bölge bağı kapalı); son üçte bire varış GARANTİ değil — overlay en çok
  //   MATCH3D_BUILDUP_MAX_MS bekler. oppT: top rakipteyken biriken süre (sn)
  const bu={team:null,until:0,oppT:0};
  // ballPos güncelleme aralığı (üstel ortalama, sn): hızlı modda bekleme süreleri kısalır
  let btLast=-1, btEma=PACE.tick, btSeq=0, flSeq=-1;
  let landSoft=false, landStop=false; // havadan pas: inişte yumuşak (kısa yuvarlanma) / santra: inişte dur

  // raw: kilit an şutunun fizik örnekleri (çok kısa bacaklar) → 0.05 sn taban uygulanmaz,
  //   kare süresini aşan zaman sonraki bacağa devreder (updateBall); şut gerçek sürede oynar.
  const startFlight=(ex,ez,ey,h,dur,fn,script,raw)=>{
    fl.sx=bpos.x; fl.sy=bpos.y; fl.sz=bpos.z;
    fl.ex=ex; fl.ey=ey; fl.ez=ez; fl.h=h; fl.dur=raw?Math.max(0.001,dur):Math.max(0.05,dur); fl.t=0;
    fl.fn=fn||null; fl.script=!!script; fl.raw=!!raw; fl.on=true;
  };
  const nextLeg=()=>{
    const l=legs.shift();
    if(l) startFlight(l.x,l.z,l.y,l.h,l.dur,l.fn,true,l.raw);
  };
  const busy=()=>clk<lockUntil||legs.length>0||(fl.on&&fl.script);
  const onBallTarget=(x,y)=>{
    if(!Number.isFinite(x)||!Number.isFinite(y)) return; // NaN koruması
    toW(x,y,tmpV);
    if(!ballInit){ ballInit=true; bpos.set(tmpV.x,0,tmpV.z); if(!manual){ bt.on=true; bt.x=tmpV.x; bt.z=tmpV.z; anc.on=true; anc.x=tmpV.x; anc.z=tmpV.z;
      if(Math.hypot(tmpV.x,tmpV.z)<2){ rsNext.kind="kickoff"; rsNext.team=hs<0?"away":"home"; rsNext.x=0; rsNext.z=0; } } return; }   // devre başı: santra
    if(manual) return;
    bt.on=true; bt.x=tmpV.x; bt.z=tmpV.z; btSeq++;
    if(!anc.on){ anc.on=true; anc.x=tmpV.x; anc.z=tmpV.z; }
    if(btLast>=0){ const g=clk-btLast; if(g>0&&g<2) btEma+=(g-btEma)*0.3; }
    btLast=clk;
    if(busy()||evQ.length){ pend.on=true; pend.x=tmpV.x; pend.z=tmpV.z; } // bekleyen olay da senaryo sayılır
  };
  const ownerP=()=>own.team?(teams[own.team][own.i]||null):null;
  // Tempo çarpanı: hızlı modda (ballPos sık değişir) koşu ve pas hızları artar (normal: 1)
  const tempo=()=>manual?1:clamp(PACE.tick/btEma,1,2.4);
  // Senaryo süresi: yavaş tempo (1/0.6), hızlı modda kısalır
  const sDur=(v)=>v*clamp(1/PACE.slow/tempo(),0.7,1/PACE.slow);
  // Şut uçuşu (kaleye giden bacak): ACTORS3D_SHOT_FAST kat hızlı → sert, tok vuruş (kaleci dalışı aynı süreyi kullanır)
  const shotDur=(v)=>sDur(v)/ACTORS3D_SHOT_FAST;
  const setOwnerInternal=(team,i)=>{
    const tp=tempo();
    if(!(rcv.team===team&&rcv.i===i)) own.fromT=null;   // pasla gelmedi: eski verkaç bilgisi geçersiz
    own.team=team; own.i=i; own.since=clk; lastPoss=team;
    own.dwell=(0.5+Math.random()*0.6)*clamp(btEma/PACE.tick,0.3,1);
    // İlk dokunuştan sonra karar: kısa (verkaç) ile ~1.3 sn arası
    // Adım 12: topu alır almaz karar (≈0.15–0.45 sn) → bekleme yok, akıcı tek-iki dokunuş paslaşma
    own.decide=clk+(Math.random()<ACTORS3D_ONE_TOUCH?0.02:0.06+Math.random()*0.14)/tp; // tek pas ya da çok kısa kontrol
    own.dribble=false; own.touchT=0; own.drN=0;
    freeBall=false; bvel.set(0,0,0); curl.t=0; rcv.team=null; chaser=null; pk.on=false;
    // Canlı akış: topu alan oyuncu topa döner (top ayağının önüne arkasından ışınlanmasın);
    //   top ACTORS3D_GRAB_SEC içinde ayağa yumuşakça oturur (updateBall)
    if(!manual){ const p=teams[team]&&teams[team][i]; if(p) faceTo(p,bpos.x-p.pos.x,bpos.z-p.pos.z,0.22); }
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
    // Topa vuruş sesi (Web Audio; sfx.js): sert vuruş = şut, yumuşak = pas
    try{ if(typeof MATCH_SFX!=="undefined"&&!disposed){ if(power>=0.85) MATCH_SFX.kick(Math.round(power*90+10)); else MATCH_SFX.pass(); } }catch(_){}
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
    const vEnd=Math.min(PASS_VEND*tempo(),ACTORS3D_PASS_VMAX), v0=Math.min(manual?30:40*ACTORS3D_ARCADE_PASS,Math.sqrt(vEnd*vEnd+2*ROLL_FRIC*d));   // kickTo ile aynı sınır
    const disc=v0*v0-2*ROLL_FRIC*d;
    return disc>0?(v0-Math.sqrt(disc))/ROLL_FRIC:v0/ROLL_FRIC;
  };
  // (px,pz) noktasına vuruş → uçuş süresi
  //   mul (isteğe bağlı, >1): pas hızı çarpanı → uçuş süresi T/mul (kilit anda seri, keskin pas)
  // kickTo'nun d mesafesi için GERÇEK varış süresi (yerden hızlı pasta v0 tavanı dahil) — vuruş yapmaz.
  //   Kilit an öngörülü hedefi bununla hesaplar (kickTo ile aynı formül).
  const kickTime=(d,lofted,mul)=>{
    if(!(d>=0.3)) return 0.1;
    const k=Number.isFinite(mul)&&mul>1?Math.min(ACTORS3D_KICK_MUL_MAX,mul):1;
    const T=lofted?(k>1?Math.max(1.05,passTime(d,true)/Math.sqrt(k)):passTime(d,true)):passTime(d,false)/k;
    if(lofted||k<=1) return T;
    const v0=Math.min(ACTORS3D_KICK_VMAX,d/T+ROLL_FRIC*T/2), disc=v0*v0-2*ROLL_FRIC*d;
    return ROLL_FRIC>0?(disc>0?(v0-Math.sqrt(disc))/ROLL_FRIC:v0/ROLL_FRIC):T;
  };
  const kickTo=(px,pz,lofted,mul)=>{
    if(disposed||!Number.isFinite(px)||!Number.isFinite(pz)) return 0;
    const dx=px-bpos.x, dz=pz-bpos.z, d=Math.hypot(dx,dz);
    if(d<0.3){ kickBall(0,0,0); return 0.1; }
    const k=Number.isFinite(mul)&&mul>1?Math.min(ACTORS3D_KICK_MUL_MAX,mul):1;
    // Havadan pasta çarpanın yalnız karekökü uygulanır ve süre ≥1.05 sn tutulur (tepe ≥1.35 m):
    //   T/mul tepeyi 1/mul² düşürüp topu savunmacının içinden diz hizasında geçirirdi
    const T=lofted?(k>1?Math.max(1.05,passTime(d,true)/Math.sqrt(k)):passTime(d,true)):passTime(d,false)/k;
    const ux=dx/d, uz=dz/d;
    if(lofted){ const vh=d/T; kickBall(ux*vh,G_ACC*T/2,uz*vh); landSoft=true; return T; }
    if(k>1){
      // Aynı mesafeyi T/mul sürede alan yerden pas: v0 = d/T + a·T/2 (a = ROLL_FRIC)
      const v0=Math.min(ACTORS3D_KICK_VMAX,d/T+ROLL_FRIC*T/2);
      kickBall(ux*v0,0,uz*v0);
      // v0 tavana takıldıysa gerçek varış süresi: d = v0·t − a·t²/2 → t = (v0 − √(v0² − 2ad)) / a
      return kickTime(d,false,mul);
    }
    const ve=Math.min(PASS_VEND*tempo(),ACTORS3D_PASS_VMAX), v0=Math.min(manual?30:40*ACTORS3D_ARCADE_PASS,Math.sqrt(ve*ve+2*ROLL_FRIC*d));
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

  // ── Diziliş çapaları (yalnız canlı akış) ──
  // Her oyuncunun çapası takımın GERÇEK dizilişinden gelir (overlay → snapshot myBase/oppBase =
  //   FDATA[formation] tabanı; yoksa FDATA 4-3-3 / 4-2-3-1): derinlik (0 = rakip kale … 100 = kendi
  //   kale) + kanat (0–100). Çapa topun ileri konumu (takımın hücum yönünde) ve evreye göre kayar:
  //   • savunma hattı kendi yarısı ile orta çizgi arasında kalır; savunurken en yakın rakip
  //     forvetin kale tarafına markaj yapar,
  //   • orta saha topla yana kayar (üçgen; destek oyuncuları ayrıca pickSupport'ta),
  //   • forvet/kanat hücumda rakip ceza sahası çevresine koşar, savunmada orta sahaya döner.
  //   Hedef üstel yumuşatmayla izlenir (titreme yok); en çok 11×11 uzaklık (O(n²)), tahsis yok.
  const baseArr={home:null,away:null};
  const roleCls=(r)=>r==="GK"?0:(r==="CB"||r==="LB"||r==="RB"||r==="LWB"||r==="RWB"||r==="SW")?1
    :(r==="ST"||r==="CF"||r==="LW"||r==="RW"||r==="SS")?3:2;
  const fallbackSlot=(i)=>{
    const F=(typeof FDATA!=="undefined"&&FDATA)?(FDATA["4-3-3"]||FDATA["4-2-3-1"]):null;
    return F&&F[i]?F[i]:null;
  };
  const updateAnchors=(dt)=>{
    const possT=own.team||rcv.team||lastPoss;
    const ko=(rs.on&&rs.kind==="kickoff")||!own.team&&!freeBall&&!rcv.team&&Math.hypot(bpos.x,bpos.z)<1.5;   // santra bekleniyor
    for(let t=0;t<2;t++){
      const team=t===0?"home":"away", list=teams[team], base=baseArr[team];
      const dir=atkDir(team), att=possT===team, bf=bpos.x*dir, opp=teams[t===0?"away":"home"];
      for(let i=0;i<list.length;i++){
        const p=list[i]; if(!p.g.visible||p.driven) continue;
        // Taban: derinlik + kanat (2D tabanı: home bx=100−derinlik, rakip bx=derinlik; by=kanat)
        let depth=NaN, wing=NaN;
        const b=base&&base[i];
        if(b&&Number.isFinite(Number(b.bx))&&Number.isFinite(Number(b.by))){
          depth=team==="home"?100-Number(b.bx):Number(b.bx); wing=Number(b.by);
        } else { const s=fallbackSlot(i); if(s){ depth=s.y; wing=s.x; } }
        if(!Number.isFinite(depth)){ continue; }                    // taban yok: 2D noktası (tgt) kalır
        const cls=roleCls(p.gk?"GK":p.role);
        // Takım koordinatı: f = hücum yönünde ileri (kendi kale −L), zt = takımın solu (−) / sağı (+)
        let f, z;
        const zt=(wing/100-0.5)*PITCH3D_WID;
        if(cls===0){
          f=-L+3+clamp((bf+L)*0.06,0,6);
          z=clamp(bpos.z*0.15,-2.5,2.5);
        } else {
          const fc=att?clamp(bf*0.6+4,-16,22):clamp(bf*0.55-8,-30,8);
          f=fc+(50-depth)*(att?0.55:0.42);
          if(cls===1){
            // Bek bindirmesi: top rakip yarıda ve aynı kanattaysa bek topun önüne çıkar
            const ovl=att&&isWide(p.role)&&bf>-4&&zt*dir*bpos.z>0&&Math.abs(bpos.z)>6;
            if(ovl) f=Math.max(f,bf+3);
            f=clamp(f,-L+7,att?(isWide(p.role)?(ovl?L-18:8):0):-6);
          }
          else if(cls===2) f=clamp(f,-L+14,L-20);
          else f=att?clamp(Math.max(f,bf+6),L-34,L-11):clamp(f,-8,12);
          z=zt*dir*(att?1.05:0.75)+bpos.z*(cls===2?0.38:cls===1?0.22:0.25);
          if(att&&isWide(p.role)&&cls!==1) z=sgn(z||zt*dir)*Math.max(Math.abs(z),H*0.62);   // kanat açılır
          // Savunurken markaj: kendi yarımızdaki en yakın rakip forvetin kale tarafı
          if(cls===1&&!att){
            let md=18, mx=0, mz=0, mo=false;
            const wx0=f*dir;
            for(let j=0;j<opp.length;j++){
              const q=opp[j]; if(!q.g.visible||q.gk) continue;
              if(q.pos.x*dir>-2) continue;                              // bizim yarıda değil
              const d=Math.hypot(q.pos.x-wx0,q.pos.z-z);
              if(d<md){ md=d; mx=q.pos.x; mz=q.pos.z; mo=true; }
            }
            if(mo){ f=f*0.5+(mx*dir-1.8)*0.5; z=z*0.5+mz*0.5; }
          }
          // Doğal hareket (Adım 16): her oyuncu mevkisi çevresinde KENDİ fazı/frekansıyla salınır
          //   (iki sinüs toplamı → periyodik görünmez) ve topa yakınsa kendi eğilimiyle topa yönelir
          //   (en çok %35, topa 3 m'den fazla yaklaşmaz) → takım tek blok halinde düz kaymaz.
          const wA=p.nvAmp*(ko?0.3:1);
          f+=wA*(Math.sin(clk*p.nvFf*6.283+p.nvPh)*0.7+Math.sin(clk*p.nvFf*2.9+p.nvPh2)*0.3);
          z+=wA*(Math.sin(clk*p.nvFz*6.283+p.nvPh2)*0.7+Math.sin(clk*p.nvFz*3.7+p.nvPh)*0.3);
          {
            const bfx=bpos.x*dir, bz=bpos.z, dB=Math.hypot(bfx-f,bz-z);
            if(dB<ACTORS3D_NAT_PULL_R&&dB>3){
              const pk=Math.min(0.35,p.nvPull*(1-dB/ACTORS3D_NAT_PULL_R)*(cls===1?0.45:cls===3?0.8:1)*(att?0.7:1));
              const mv=Math.min(pk*dB,dB-3);
              f+=(bfx-f)/dB*mv; z+=(bz-z)/dB*mv;
            }
          }
          if(ko) f=Math.min(f,-1.2);                                     // santrada kendi yarısında
        }
        const wx=clamp(f*dir,-L+1,L-1), wz=clamp(z,-H+1.5,H-1.5);
        if(!p.anOn){ p.anOn=true; p.anX=p.tgt.x; p.anZ=p.tgt.z; }
        // Oyuncu başına bağımsız tepki süresi (eskiden herkes 0.5 sn → senkron kayma)
        const k=1-Math.exp(-dt/(p.nvTau||0.5));
        p.anX+=(wx-p.anX)*k; p.anZ+=(wz-p.anZ)*k;
        p.tgt.x=p.anX; p.tgt.z=p.anZ;
      }
    }
  };
  // Kilit an öncesi hücum kurulumu: team (home|away) öne dönük oynar; garantiler (hileler):
  //   • rakip kurulumu yapan takıma ayakla müdahale etmez (pressLogic),
  //   • kurulumu yapan takımın pas yolundaki kesmesi kesin ve erişimi geniş (1.6 m, rcv dalı),
  //   • top rakipte toplam 1.2 sn'yi geçerse en yakın oyuncumuz 2.2 m içindeyse topu kapar.
  //   Son üçte bire varış süresi garanti değildir (denemede 3–11 sn). null → kapat. sec: en uzun süre.
  const buildUp=(team,sec)=>{
    if(disposed||manual) return;
    bu.team=team==="home"||team==="away"?team:null; bu.oppT=0;
    bu.until=clk+(Number.isFinite(sec)?sec:12);
  };
  // team topu rakip yarının son üçte birinde (hedef kaleye L/3'ten yakın) ayağında tutuyor mu?
  // Topun oyun konumu {x,y (0–100, bizim hücum yönümüz x=100), team, idx} — yalnız oyun akarken
  //   ve top bir oyuncudayken; force: her durumda (en yakın oyuncu sahip sayılır)
  const getPlaySpot=(force)=>{
    if(disposed||!ballInit) return null;
    const flow=!busy()&&!rs.on&&!rsNext.kind;
    const o=flow?ownerP():null, p=o||(force?nearestTo(bpos.x,bpos.z,null):null);
    if(!p) return null;
    const d=atkDir("home");
    return {x:clamp(50+bpos.x*d/L*50,0,100),y:clamp(50+bpos.z*d/H*50,0,100),team:p.team,idx:p.idx};
  };
  const inFinalThird=(team)=>{
    const o=ownerP();
    return !!(o&&o.team===team&&bpos.x*atkDir(team)>L/3);
  };
  // Devre değişimi: tüm durum sıfırlanır, oyuncular ve top bir sonraki snapshot'ta yeni (dönük)
  //   konumlarına ışınlanır
  const swapSides=()=>{
    legs.length=0; fl.on=false; fl.fn=null; fl.script=false; lockUntil=0; pend.on=false; pk.on=false;
    evQ.length=0; gkPend.on=false; rs.on=false; rsNext.kind="";
    own.team=null; freeBall=false; bvel.set(0,0,0); curl.t=0; rcv.team=null; chaser=null; lastPoss=null; bu.team=null;
    for(let t=0;t<2;t++){ const list=t===0?teams.home:teams.away;
      for(let i=0;i<list.length;i++){ const p=list[i]; p.has=false; p.anOn=false; p.vx=0; p.vz=0; p.speed=0; } }
    last.my=null; last.opp=null; last.ball=null; ballInit=false; anc.on=false; bt.on=false;
  };

  // ── Oyun yönetmeni (yalnızca normal akış) ──
  // Pas başlat: önce vuruş animasyonu (gerilme), ~0.2 sn sonra top çıkar
  // Kaleci dağıtımı: top en çok orta saha çizgisi civarına (rakip yarıda 2 m) gider
  const gkX=(p,x)=>p&&p.gk&&!manual?Math.min(x*atkDir(p.team),2)*atkDir(p.team):x;
  const startPass=(o,m,lofted)=>{
    const tp=tempo();
    leadPoint(m,lofted,passPt); passPt.x=gkX(o,passPt.x);
    pk.on=true; pk.t=clk+0.08/tp; pk.x=passPt.x; pk.z=passPt.z; pk.lofted=lofted; pk.team=m.team; pk.i=m.idx; // Adım 14: vuruş gerilmesi kısa (seri pas)
    faceTo(o,passPt.x-o.pos.x,passPt.z-o.pos.z,0.6);
    const d=Math.hypot(passPt.x-bpos.x,passPt.z-bpos.z);
    rigAction3D(o.rig,"kick",{power:lofted?0.95:clamp(0.45+d/50,0.45,0.85),t0:0,side:(o.idx%4===3)?-1:1});
    own.fromT=o.team; own.fromI=o.idx;
  };
  const passN={home:0,away:0};   // atak hazırlığı: takımın verdiği pas sayısı
  const execPass=()=>{
    pk.on=false; if(passN[pk.team]!=null) passN[pk.team]++;
    const m=teams[pk.team]&&teams[pk.team][pk.i];
    // Top zaten ayağın önünde; animasyon vuruş anında → kickTo animasyonu yeniden başlatmasın
    const o=ownerP(); const act=o?o.rig.act:null;
    if(o) o.rig.act=null;
    const T=kickTo(pk.x,pk.z,pk.lofted);
    if(o&&act==="kick"){ o.rig.act="kick"; o.rig.actT=o.rig.actDur*0.42; }
    if(m&&m.g.visible) setRcv(m,pk.x,pk.z,T);
  };
  const decide=(o)=>{
    const tp=tempo(), dir=atkDir(o.team);
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
      // AMAÇLI PAS: hedef kaleye doğru ilerleme (geri pas cezalı) + boşta olma (en yakın rakip) +
      //   açık pas yolu (yukarıda). Hücum kurulumunda (bu) ilerleme ağırlığı artar, 2D çapa izlenmez.
      const prog=(m.pos.x-o.pos.x)*dir;
      sc+=clamp(prog,-12,18)*(bu.team===o.team?0.075:0.045);
      // Orta saha paslaşması + kanat/bek bindirmesi + ceza sahası önüne hazırlık pası
      { const fx=m.pos.x*dir, wide=Math.abs(m.pos.z)>H*0.5;
        if(!lofted&&Math.abs(o.pos.x)<L/3&&Math.abs(fx)<L/3) sc+=0.12;
        if(wide&&fx>L*0.15&&prog>-4) sc+=0.2;
        if(fx>L-16.5&&Math.abs(m.pos.z)<20&&!lofted) sc+=0.22;      // ceza sahası içine pas
        if(fx>L-28&&fx<L-12&&Math.abs(m.pos.z)<18&&Math.abs(o.pos.z)>H*0.45) sc+=0.2; }
      if(m.pos.x*dir>L/3) sc+=0.12;                           // son üçte birdeki arkadaş
      if(anc.on&&bu.team!==o.team) sc-=Math.hypot(m.pos.x-anc.x,m.pos.z-anc.z)*0.015; // 2D top bölgesine hafif bağ
      sc+=Math.min(nearestOppDist(m),8)*0.08;                // boştaki arkadaş
      if(own.fromT===m.team&&own.fromI===m.idx)               // verkaç: pası veren koşup öne geçtiyse geri ver
        sc+=((m.pos.x-o.pos.x)*dir>3&&nearestOppDist(m)>3)?0.3:-0.2;
      if(m.gk) sc-=0.8;
      sc+=Math.random()*0.08;
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
    let ds=(ahead?0.05:0.62)+(anc.on&&bu.team!==o.team&&(anc.x-o.pos.x)*dir>6?0.2:0)+(bu.team===o.team&&!ahead?0.25:0)
      -(pressure<3?0.45:0)-own.drN*0.5+Math.random()*0.12;
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
    own.decide=clk+(0.35+Math.random()*0.3)/tp;  // kısa sürme, sonra yeniden pas arar
  };
  // Destek: sahibin en yakın 2 arkadaşı üçgen köşelerine (0.6 sn'de bir seçilir)
  // Boş alana koşu: topa sahip takımın en ileri 2 hücum oyuncusu (destekçiler hariç) topun
  //   önüne, rakibin en seyrek olduğu kulvara koşar (1.4 sn'de bir yeniden seçilir)
  const runners=[null,null], runAt=[{x:0,z:0},{x:0,z:0}]; let runT=0, runFor=-1;
  const pickRunners=(o)=>{
    runners[0]=null; runners[1]=null;
    const dir=atkDir(o.team), list=teams[o.team], opp=otherTeam(o.team);
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
    const tp=tempo(), dt2=otherTeam(o.team), goalX=-atkDir(dt2)*L;   // baskı yapan takımın kendi kalesi
    pr1=null; pr2=null; let d1=1e9, d2=1e9;
    const list=teams[dt2];
    for(let i=0;i<list.length;i++){
      const q=list[i]; if(!q.g.visible||q.gk) continue;
      const d=Math.hypot(q.pos.x-bpos.x,q.pos.z-bpos.z);
      if(d<d1){ d2=d1; pr2=pr1; d1=d; pr1=q; } else if(d<d2){ d2=d; pr2=q; }
    }
    if(pr1&&d1<22){
      const gx=goalX-bpos.x, gz=-bpos.z, gl=Math.hypot(gx,gz)||1;
      const stand=d1>6?1.0:0.95;                // yakında kale tarafında ~1 m (ayak erişiminde: ACTORS3D_TACKLE_R)
      pr1.ovr=true; pr1.ox=bpos.x+gx/gl*stand; pr1.oz=bpos.z+gz/gl*stand;
      pr1.cap=(d1>8?PACE.chase:PACE.press)*tp;
      // Ayak uzatma: müdahale mesafesinde, bekleme süresi dolduysa
      if(pr1.tackleCd>0) pr1.tackleCd-=dt;
      else if(!(bu.team&&bu.team!==dt2)&&ballSegD(pr1.pos.x,pr1.pos.z)<ACTORS3D_TACKLE_R&&bpos.y<0.6&&clk-own.since>0.6){
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
    const farD=anc.on&&!bu.team?Math.hypot(anc.x-bpos.x,anc.z-bpos.z):0;   // hücum kurulumunda 2D bölgesi izlenmez
    if(farD>30){ farT+=dt; } else farT=0;
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
      if(!own.dribble&&!o.gk){
        const ux=(anc.x-o.pos.x)/(farD||1), uz=(anc.z-o.pos.z)/(farD||1);
        own.dribble=true; own.drN++;
        own.px=clamp(o.pos.x+ux*9,-L+3,L-3); own.pz=clamp(o.pos.z+uz*9,-H+2,H-2);
        own.decide=clk+(0.9+Math.random()*0.6)/tp;
      }
    }
    if(farT>3.5&&farD>=45&&clk-own.since>0.5){
      farT=0;
      const ax=gkX(o,anc.x), q=nearestTo(ax,anc.z,o,o.team,true);
      if(q){
        const tx=clamp(ax,-L+2,L-2), tz=clamp(anc.z,-H+2,H-2);
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
      if(!pk.on&&own.decide>clk+0.25/tp) own.decide=clk+0.25/tp; // topla beklerken en geç ~0.25 sn'de karar
    }
  };
  // ── Duran top akışı (yalnız canlı maç) ──
  //   Top noktaya yuvarlanır/uçar (ışınlanmaz), kullanan oyuncu başına gelir, ~1–1.5 sn'de oyun başlar.
  const startRestart=(kind,team,x,z)=>{
    if(manual||disposed) return false;
    const s=sgn(x), dir=atkDir(team);
    const p=kind==="goal"?(keeperOf(s)||nearestTo(x,z,null,team)):nearestTo(x,z,null,team,true);
    if(!p) return false;
    legs.length=0; fl.on=false; fl.fn=null; pk.on=false; pend.on=false; gkPend.on=false;
    own.team=null; freeBall=false; bvel.set(0,0,0); curl.t=0; rcv.team=null; chaser=null; bu.team=null; scr.p=null; postScript=false;
    lastPoss=team;
    rs.on=true; rs.kind=kind; rs.team=team; rs.x=x; rs.z=z; rs.p=p; rs.t0=clk;
    rs.min=(kind==="kickoff"?1.4:1.0)/Math.sqrt(tempo());
    const d=Math.hypot(x-bpos.x,z-bpos.z);
    if(d>0.4||bpos.y>0.2) startFlight(x,z,0,kind==="kickoff"&&d>20?6:d>8?Math.min(3,d*0.1):0,clamp(0.25+d*0.014,0.25,0.95),null,false);
    anc.x=x; anc.z=z;
    return true;
  };
  const restartTarget=()=>{
    const p=rs.p, dir=atkDir(rs.team), s=sgn(rs.x), r=Math.random();
    const near=(x,z)=>nearestTo(clamp(x,-L+3,L-3),clamp(z,-H+3,H-3),p,rs.team,true);
    if(rs.kind==="kickoff") return {m:near(-dir*8,r<0.5?-6:6),lof:false};
    if(rs.kind==="goal") return r<0.4?{m:near(-dir*(2+r*25),(Math.random()*2-1)*20),lof:true}:{m:near(s*(L-19),(Math.random()<0.5?-1:1)*18),lof:false};
    if(rs.kind==="throw") return {m:near(rs.x+dir*3,rs.z-sgn(rs.z)*9),lof:true};
    if(rs.kind==="corner") return {m:near(s*(L-9),-sgn(rs.z)*2),lof:true};
    const m=near(rs.x+dir*12,rs.z*0.6);                        // serbest vuruş
    return {m,lof:!!m&&Math.hypot(m.pos.x-rs.x,m.pos.z-rs.z)>ACTORS3D_PASS_SHORT};
  };
  // Santra dizilişi: herkes kendi yarısına, rakip orta yuvarlağın dışına. remain: kalan süre (sn) → geç kalan
  //   oyuncu daha hızlı koşar. skip: dokunulmayacak oyuncu (kullanan / golü kutlayan)
  const kickoffShape=(team,skip,remain,cap)=>{
    for(let t=0;t<2;t++){
      const tk=t===0?"home":"away", list=teams[tk], d2=atkDir(tk);
      for(let i=0;i<list.length;i++){
        const q=list[i]; if(q===skip||!q.g.visible) continue;
        let x=q.tgt.x, z=q.tgt.z;
        if(!q.gk){
          x=Math.min(x*d2,-1.5)*d2;
          if(tk!==team){ const R=Math.hypot(x,z); if(R<9.8){ const k=9.8/Math.max(0.5,R); x*=k; z*=k; if(x*d2>-1.5) x=-1.5*d2; if(Math.hypot(x,z)<9.6) z=(z>=0?1:-1)*9.6; } }
        }
        q.ovr=true; q.ox=clamp(x,-L+0.8,L-0.8); q.oz=clamp(z,-H+0.8,H-0.8);
        q.cap=Math.max(cap,Math.min(20,Math.hypot(q.ox-q.pos.x,q.oz-q.pos.z)*1.6/Math.max(0.25,remain)));
      }
    }
  };
  const restartLogic=()=>{
    const p=rs.p, dir=atkDir(rs.team), el=clk-rs.t0, K=rs.kind, sp=PACE.chase*1.7*tempo();
    if(!p.g.visible||el>4){ rs.on=false; return; }
    anc.x=rs.x; anc.z=rs.z; own.team=null; freeBall=false; bvel.set(0,0,0);
    // Kullanan oyuncu topun arkasına
    let ox=rs.x-dir*0.7, oz=rs.z;
    if(K==="throw"){ ox=rs.x; oz=rs.z+sgn(rs.z)*0.5; }
    else if(K==="corner"){ ox=rs.x+sgn(rs.x)*0.4; oz=rs.z+sgn(rs.z)*0.5; }
    p.ovr=true; p.ox=ox; p.oz=oz; p.cap=sp;
    // Diğerleri: santrada kendi yarısı (rakip orta yuvarlak dışında), serbest vuruş/korner/taçta rakip mesafesi,
    //   kale vuruşunda rakip ceza sahası dışında
    if(K==="kickoff") kickoffShape(rs.team,p,rs.min-el,sp);
    else for(let t=0;t<2;t++){
      const tk=t===0?"home":"away", list=teams[tk], oppT=tk!==rs.team;
      for(let i=0;i<list.length;i++){
        const q=list[i]; if(q===p||!q.g.visible) continue;
        let x=q.tgt.x, z=q.tgt.z, go=false;
        if(oppT&&!q.gk){
          if(K==="goal"){ const lim=L-17.5; if(x*sgn(rs.x)>lim&&Math.abs(z)<D.penWidth/2){ x=sgn(rs.x)*lim; go=true; } }
          else {
            const R=K==="throw"?3:9.15, dx=q.pos.x-rs.x, dz=q.pos.z-rs.z, d=Math.hypot(dx,dz);
            if(d<R){ go=true; x=rs.x+(d>0.1?dx/d:-dir)*R; z=rs.z+(d>0.1?dz/d:0)*R; }
          }
        }
        if(go){ q.ovr=true; q.ox=clamp(x,-L+0.8,L-0.8); q.oz=clamp(z,-H+0.8,H-0.8); q.cap=PACE.run*tempo(); }
      }
    }
    const near=Math.hypot(p.pos.x-ox,p.pos.z-oz)<0.9;
    if(K==="throw"&&near&&!fl.on){
      bpos.set(p.pos.x,1.95*(0.5+0.5*p.sk),p.pos.z-sgn(rs.z)*0.1);     // top başın üstünde
      if(p.rig.act!=="throw") rigAction3D(p.rig,"throw",{dur:1.6});
    }
    if(near&&!fl.on) faceTo(p,K==="throw"?0:dir,K==="throw"?-sgn(rs.z):K==="corner"?-sgn(rs.z)*4:0,0.3);
    if(!((near&&!fl.on&&el>=rs.min)||(el>=2.6&&!fl.on&&Math.hypot(p.pos.x-rs.x,p.pos.z-rs.z)<2.4))) return;
    const t=restartTarget(), m=t.m;
    rs.on=false;
    if(!m){ setOwnerInternal(p.team,p.idx); return; }
    if(K==="kickoff"){ try{ if(typeof MATCH_SFX!=="undefined") MATCH_SFX.whistle("short"); }catch(_){} }
    const tx=gkX(p,m.pos.x), tz=m.pos.z;
    if(K==="throw"){
      const dx=tx-bpos.x, dz=tz-bpos.z, d=Math.hypot(dx,dz)||1, reach=Math.min(d,16), T=clamp(0.45+reach*0.03,0.5,0.9);
      const ex=bpos.x+dx/d*reach, ez=bpos.z+dz/d*reach;
      kickBall(dx/d*reach/T,(G_ACC*T*T/2-bpos.y)/T,dz/d*reach/T); landSoft=true;
      p.rig.act=null; rigAction3D(p.rig,"throw",{dur:0.5}); p.rig.actT=0.2;
      setRcv(m,ex,ez,T);
    } else {
      faceTo(p,tx-bpos.x,tz-bpos.z,0.5);
      const T=kickTo(tx,tz,t.lof); setRcv(m,tx,tz,T);
    }
  };
  // Serbest top çizgiyi geçti: yan çizgi → taç, dip çizgi → kale vuruşu / korner
  const checkOut=()=>{
    if(manual||fl.on||!ballInit) return false;
    if(Math.abs(bpos.z)>H+0.35) return startRestart("throw",otherTeam(lastPoss||"home"),clamp(bpos.x,-L+2,L-2),sgn(bpos.z)*H);
    if(Math.abs(bpos.x)>L+0.35){
      const s=sgn(bpos.x), def=s===atkDir("home")?"away":"home";
      return lastPoss===def?startRestart("corner",otherTeam(def),s*(L-0.6),sgn(bpos.z)*(H-0.6))
        :startRestart("goal",def,s*(L-5.5),sgn(bpos.z)*5);
    }
    return false;
  };
  // Senaryo bitti / normal akış: sahiplik ve takım davranışı (her kare, hareketten ÖNCE)
  const autoPossess=(dt)=>{
    if(gkPend.on&&clk>=gkPend.t){ gkPend.on=false; diveTo(gkPend.p,gkPend.x,gkPend.z,gkPend.h,gkPend.spd,gkPend.t0); } // gecikmeli kaleci dalışı
    if(anc.on&&bt.on){ const k=1-Math.exp(-dt/0.7); anc.x+=(bt.x-anc.x)*k; anc.z+=(bt.z-anc.z)*k; }
    if(busy()){
      own.team=null; freeBall=false; rcv.team=null; postScript=true; pk.on=false;
      if(rsNext.go&&rsNext.kind==="kickoff") kickoffShape(rsNext.team,clk<scr.until+0.8?scr.p:null,Math.max(0.5,lockUntil-clk+0.6),PACE.run*0.8);
      if(scr.p&&clk<scr.until&&scr.p.g.visible){ scr.p.ovr=true; scr.p.ox=scr.x; scr.p.oz=scr.z; scr.p.cap=PACE.chase*tempo(); }
      return;
    }
    if(rsNext.kind&&!busy()){
      const k=rsNext.kind; rsNext.kind=""; rsNext.go=false; scr.p=null;
      if(startRestart(k,rsNext.team,rsNext.x,rsNext.z)){ restartLogic(); return; }
    }
    if(rs.on){ restartLogic(); return; }
    if(postScript){
      postScript=false; scr.p=null;
      // Senaryo bitti: ballPos çok uzaktaysa (gol → santra, aut → kale vuruşu) uzun top
      if(pend.on){
        pend.on=false;
        anc.x=pend.x; anc.z=pend.z;
        if(Math.hypot(pend.x-bpos.x,pend.z-bpos.z)>15){
          const center=Math.abs(pend.x)<2&&Math.abs(pend.z)<2; // santra: tam orta noktaya
          const out=Math.abs(bpos.x)>L||Math.abs(bpos.z)>H;    // top oyun dışında (ağda, taç/aut çizgisinin dışında)
          const q=nearestTo(pend.x,pend.z,null);
          if(center&&q){
            // Santra (oyun durmuş): top havadan orta noktaya
            const T=kickTo(0,0,true); setRcv(q,0,0,T+0.8);
            landStop=true; bt.x=0; bt.z=0;
          } else if(out){
            // Oyun dışı top boşlukta uçmaz: yeni top yeniden başlama noktasına konur, en yakın oyuncu alır
            bpos.set(clamp(pend.x,-L+1,L-1),0,clamp(pend.z,-H+0.5,H-0.5));
            bvel.set(0,0,0); freeBall=false; curl.t=0; rcv.team=null; chaser=null;
          } else {
            // Oyun içi: yalnız topun yanındaki oyuncu (ayak erişimi) pas verebilir; yoksa en yakın
            //   oyuncu topa koşar ve oyun yönetmeni (çapa) akışı 2D top bölgesine taşır
            const k=kickerNear(ACTORS3D_REACH+0.9);
            const px=gkX(k,pend.x), r=k&&k.gk?nearestTo(px,pend.z,k,k.team,true):q;
            if(k&&r&&r!==k){
              const lof=Math.hypot(px-bpos.x,pend.z-bpos.z)>ACTORS3D_PASS_SHORT;
              const T=kickTo(px,pend.z,lof); setRcv(r,px,pend.z,T+0.8);
            }
          }
          return;
        }
      }
      // Senaryo topu oyun dışında bıraktı (aut/taç), 2D yeni konum da yakın: yeni top çizginin
      //   içine konur (kale vuruşu: 6 pas çizgisi, taç: yan çizgi) → kimse yokken uçmaz/kaymaz
      if(Math.abs(bpos.x)>L||Math.abs(bpos.z)>H){
        const gx=Math.abs(bpos.x)>L?sgn(bpos.x)*(L-5.5):bpos.x;
        bpos.set(clamp(gx,-L+1,L-1),0,clamp(bpos.z,-H+0.5,H-0.5));
        bvel.set(0,0,0); freeBall=false; curl.t=0; rcv.team=null; chaser=null;
      }
    }
    if(!ownerP()&&checkOut()){ restartLogic(); return; }
    const tp=tempo();
    if(bu.team&&clk>bu.until) bu.team=null;
    // Kurulum: top (sahip ya da pas alıcısı) rakipte toplam 1.2 sn'yi geçerse kurulumu yapan takımın
    //   topa en yakın oyuncusu (ayak erişimi 2.2 m, top yerde) topu kapar; rakip tek pasla oynasa da
    //   top en geç birkaç saniyede bize geçer (pas yolundaki kesme de bu sırada kesin: rcv dalı)
    if(bu.team){
      const pt=own.team||rcv.team;
      if(pt&&pt!==bu.team) bu.oppT+=dt; else if(pt===bu.team) bu.oppT=0;
      if(bu.oppT>1.2&&bpos.y<1.2&&!pk.on){
        const q=nearestTo(bpos.x,bpos.z,null,bu.team,true);
        if(q&&ballSegD(q.pos.x,q.pos.z)<2.2){ rigAction3D(q.rig,"poke",{side:1}); setOwnerInternal(bu.team,q.idx); bu.oppT=0; }
      }
    }
    const o=ownerP();
    if(o){
      if(!o.g.visible){ own.team=null; return; }
      ownerLogic(o,dt);
      if(!ownerP()) return;
      if(clk>supT){ pickSupport(o); supT=clk+0.6; }
      const dir=atkDir(o.team);
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
      // Verkaç koşusu: az önce pası veren (destek/koşucu değilse) ileri boşluğa koşar
      if(own.fromT===o.team&&clk-own.since<2.2){
        const g=teams[o.team][own.fromI];
        if(g&&g!==o&&!g.ovr&&g.g.visible&&!g.gk){
          g.ovr=true; g.cap=PACE.receive*tp;
          g.ox=clamp(Math.max(g.pos.x*dir,o.pos.x*dir+ACTORS3D_GIVE_GO*0.6),-L+4,L-6)*dir;
          g.oz=clamp(g.pos.z+(o.pos.z>g.pos.z?-1:1)*2,-H+2,H-2);
        }
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
        // (yakında topun birazcık önüne: yuvarlanan topun yoluna girer, arkasından kovalamaz)
        if(db<4&&bpos.y<1.2){ r.ox=bpos.x+bvel.x*0.12; r.oz=bpos.z+bvel.z*0.12; } else { r.ox=rcv.x; r.oz=rcv.z; }
        if(ballSegD(r.pos.x,r.pos.z)<ACTORS3D_REACH&&bpos.y<1.7){ setOwnerInternal(r.team,r.idx); return; }
        // Off-the-ball: top alıcıya gitmeden takım arkadaşları boş kulvarlara koşmaya başlar
        const rk=-2-rcv.i-(rcv.team==="away"?100:0);   // takım + alıcı anahtarı
        if(clk>runT||runFor!==rk){ pickRunners(r); runT=clk+1.4; runFor=rk; }
        for(let k=0;k<2;k++){
          const m=runners[k]; if(!m||m===r||m.ovr||!m.g.visible||m.team!==r.team) continue;
          m.ovr=true; m.ox=runAt[k].x; m.oz=runAt[k].z; m.cap=PACE.receive*tp;
        }
        // Pas yoluna en yakın rakip topa hamle eder; TOPA ayak erişimine (ACTORS3D_REACH) girerse
        //   (oyuncu başına bir kez) %45 keser — yol çizgisine uzaklık değil, topun kendisine uzaklık
        const q=nearestTo(bpos.x,bpos.z,null,otherTeam(rcv.team),true);
        if(q&&nearD<7&&!manual){
          q.ovr=true; q.ox=bpos.x+bvel.x*0.3; q.oz=bpos.z+bvel.z*0.3; q.cap=PACE.chase*tp;
          const bit=1<<(q.idx%30);
          const buQ=bu.team===q.team;                          // kurulumda kesme kesin, erişim geniş
          if(ballSegD(q.pos.x,q.pos.z)<(buQ?1.6:ACTORS3D_REACH)&&bpos.y<1.0&&!(rcv.tried&bit)){
            rcv.tried|=bit;
            if(buQ||Math.random()<0.45){ rigAction3D(q.rig,"poke",{side:1}); setOwnerInternal(q.team,q.idx); return; }
            // Kanatta kaçan müdahale: top rakibe çarpıp taca çıkabilir
            if(Math.abs(bpos.z)>H-13&&Math.random()<0.6){
              rigAction3D(q.rig,"poke",{side:1}); lastPoss=q.team;
              kickBall(bvel.x*0.35,0,sgn(bpos.z)*13); return;
            }
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
        if(d>0.05) startFlight(bt.x,bt.z,0,d>15?Math.min(8,d*0.12):d>8?d*0.03:0,sDur(Math.min(0.75,0.17+d*0.009)),null,false);
      }
      return;
    }
    chaser.ovr=true; chaser.cap=PACE.chase*tp; chaser.ox=bpos.x; chaser.oz=bpos.z;
    if(ballSegD(chaser.pos.x,chaser.pos.z)<ACTORS3D_REACH&&bpos.y<1.7&&Math.hypot(bvel.x,bvel.z)<10)
      setOwnerInternal(chaser.team,chaser.idx);
  };
  // Senaryo başlat: mevcut uçuşu kes, sahipliği askıya al, kilitle
  const beginScript=(lockSec)=>{
    rs.on=false; rsNext.kind=""; rsNext.go=false;
    legs.length=0; fl.on=false; fl.fn=null; pk.on=false;
    own.team=null; freeBall=false; bvel.set(0,0,0); curl.t=0; rcv.team=null;
    lockUntil=clk+lockSec;
    gkPend.on=false;                 // önceki olayın bekleyen kaleci dalışı yeni senaryoda oynamasın
  };
  const leg=(x,z,y,h,dur,fn,raw)=>legs.push({x,z,y,h,dur,fn:fn||null,raw:!!raw});
  // Olay noktasına ilk bacak; fn: bacak bitince (vuruş anı).
  //   Eskiden top, yanında kimse olmasa da 0.5–1 sn'de yayla olay noktasına uçuyordu (boşlukta yön
  //   değiştirme). Şimdi: topu ayağındaki/yanındaki oyuncu vuruş animasyonuyla PAS verir (kısa
  //   mesafe yerden düz çizgi, uzun mesafe havadan), süre gerçek pas süresidir (passTime).
  //   Senaryo hücumcusu (scr.p) pas süresinde olay noktasına yetişemiyorsa vuruş noktası ona doğru
  //   kaydırılır → top boşlukta değil, hücumcunun ayağında yön değiştirir. Dönen {x,z}: vuruş noktası.
  const zonePt={x:0,z:0};
  let zoneT=2.6;                                 // legToZone en uzun pas/koşu süresi (sn)
  const legToZone=(wx,wz,fn,out)=>{
    let tx=wx, tz=wz, d=Math.hypot(tx-bpos.x,tz-bpos.z);
    const runV=PACE.chase*tempo(), TMAX=zoneT;
    const sp=scr.p;
    // Hücumcu vuruş noktasına en çok TMAX'ta yetişebilmeli: uzaksa nokta ona doğru kaydırılır
    if(sp){
      const ds=Math.hypot(tx-sp.pos.x,tz-sp.pos.z), reach=runV*TMAX+ACTORS3D_REACH;
      if(ds>reach){ const f=(ds-reach)/ds; tx+=(sp.pos.x-tx)*f; tz+=(sp.pos.z-tz)*f; d=Math.hypot(tx-bpos.x,tz-bpos.z); }
    }
    // Süre: gerçek pas süresi (top zaten oradaysa kısa); hücumcu daha geç varacaksa pas onun
    //   koşusuna göre ağırlaştırılır / top onu bekler → top hücumcuyla aynı anda vuruş noktasında
    let T=d>=1.2?passTime(d,d>ACTORS3D_PASS_SHORT):0.08;
    if(sp) T=Math.max(T,(Math.hypot(tx-sp.pos.x,tz-sp.pos.z)-ACTORS3D_REACH)/Math.max(1,runV));
    T=clamp(T,d>=1.2?0.3:0.08,TMAX);
    if(sp){ scr.x=tx; scr.z=tz; scr.until=Math.max(scr.until,clk+T+0.15); }
    if(d>=1.2){
      const k=kickerNear(ACTORS3D_REACH+0.9);          // topu ayağında tutan / yanındaki oyuncu
      // (hücumcunun kendisiyse: önüne uzun dokunuş — hafif vuruş)
      if(k) kickAnim(k,tx-bpos.x,tz-bpos.z,k===sp?0.35:clamp(0.45+d/50,0.45,0.9),0.4);
    }
    const lofted=d>ACTORS3D_PASS_SHORT;
    leg(tx,tz,0,lofted?Math.min(6,d*0.1):0,T,fn);
    zonePt.x=tx; zonePt.z=tz;
    if(out){ out.x=tx; out.z=tz; }   // çağıranın kopyası (zonePt paylaşılır)
    return zonePt;
  };
  // Olayda topa koşacak hücumcu (topa en yakın) — senaryo boyunca hedefe koşar
  const scriptRunner=(team,wx,wz,sec)=>{
    const p=nearestTo(wx,wz,null,team,true);
    scr.p=p; scr.x=wx; scr.z=wz; scr.until=clk+sec;
    return p;
  };
  // Kaleci: s dünya tarafındaki (±L) kaleyi savunan takımın kalecisi (1. yarı +L rakip, 2. yarı +L biz)
  const keeperOf=(s)=>{
    const list=teams[s===atkDir("home")?"away":"home"];
    for(let i=0;i<list.length;i++) if(list[i].gk&&list[i].g.visible) return list[i];
    return null;
  };
  // Kaleciyi (wx,wz) noktasına doğru uçur; h: hedef yüksekliği (m)
  //   spd: hız çarpanı (≤RIG3D_DIVE_K_MAX) · t0 (isteğe bağlı): animasyonun başlangıç kesri (çok kısa
  //   şutta dalış ileriden başlar → tam uzanma topla aynı anda)
  const diveTo=(p,wx,wz,h,spd,t0)=>{
    if(!p) return;
    const fx=bpos.x-p.pos.x, fz=bpos.z-p.pos.z;
    faceTo(p,fx,fz,1.6); p.yaw=Math.atan2(fx,fz);
    const lx=Math.cos(p.yaw), lz=-Math.sin(p.yaw);
    const side=((wx-p.pos.x)*lx+(wz-p.pos.z)*lz)>=0?1:-1;
    const k=Number.isFinite(spd)&&spd>0?clamp(spd,0.5,RIG3D_DIVE_K_MAX):1;   // hız çarpanı: animasyon k× kısa
    // fast: yalnız uçuş (tam uzanmaya kadar) k× hızlı; yerde yatış ve kalkış normal hızda → kısa
    //   şutta da kaleci topa uzanır ve kurtarış/yere düşüş görünür kalır (rig3d.js)
    rigAction3D(p.rig,"dive",{side,h:clamp((Number(h)||0.8)/2.4,0,1),fast:k,
      t0:Number.isFinite(t0)?clamp(t0,0,RIG3D_DIVE_REACH_U-0.01):undefined});
  };

  // Kaleci TEPKİ GECİKMESİ (canlı akış): şut anında değil; top ACTORS3D_GK_SEE m yol alıp yönü
  //   belli olunca + refleks süresi geçince uçar (en geç uçuşun %70'inde). flight: topun kaleye
  //   varış süresi (sn), dist: şut mesafesi (m). Dalış hızı, tam uzanma varışa denk gelecek şekilde.
  const gkPend={on:false,t:0,p:null,x:0,z:0,h:0,spd:1,t0:0};
  const diveLater=(p,wx,wz,h,flight,dist)=>{
    if(!p) return;
    const fl=Math.max(0.15,Number(flight)||0.5), d=Math.max(4,Number(dist)||16);
    const see=fl*clamp(ACTORS3D_GK_SEE/d,0.08,0.6);
    // Tam uzanma (dalışın RIG3D_DIVE_REACH_U'su) topun varışına denk gelsin: gecikme en hızlı uzanmanın
    //   yetişeceği kadarla sınırlı; dalış hızı kalan süreden (en çok RIG3D_DIVE_K_MAX×); o da yetmezse
    //   animasyon ileriden başlar (t0) → hızlı şutta da kaleci topla aynı anda uzanır
    const reachD=RIG3D_DIVE_REACH_U*RIG3D_ACT_DUR.dive;
    const delay=Math.min(fl*0.7,ACTORS3D_GK_REFLEX+Math.random()*0.08+see,Math.max(0,fl-reachD/RIG3D_DIVE_K_MAX));
    const rem=Math.max(0.01,fl-delay);
    gkPend.on=true; gkPend.t=clk+delay; gkPend.p=p; gkPend.x=wx; gkPend.z=wz; gkPend.h=h;
    gkPend.spd=clamp(reachD/rem,1,RIG3D_DIVE_K_MAX);
    gkPend.t0=Math.max(0,RIG3D_DIVE_REACH_U-rem*gkPend.spd/RIG3D_ACT_DUR.dive);
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
    // Konfeti (Adım 15): küçük kâğıt parçaları, siyah-beyaz-kırmızı; hava direnciyle süzülür
    const cols=new Float32Array(n*3), PAL=ACTORS3D_CONFETTI, tmpC=new THREE.Color();
    for(let i=0;i<n;i++){ tmpC.setHex(PAL[i%PAL.length]); cols[i*3]=tmpC.r; cols[i*3+1]=tmpC.g; cols[i*3+2]=tmpC.b; }
    geo.setAttribute("color",new THREE.BufferAttribute(cols,3));
    const m=new THREE.PointsMaterial({size:0.2,vertexColors:true,transparent:true,opacity:1,depthWrite:false});
    const pts=new THREE.Points(geo,m); pts.frustumCulled=false;
    addFx(pts,2.6,(k,dt)=>{
      const drag=Math.exp(-dt*2.2);
      for(let i=0;i<n;i++){
        const j=i*3;
        vel[j+1]-=9*dt; vel[j]*=drag; vel[j+2]*=drag;
        if(vel[j+1]<-2.2) vel[j+1]=-2.2;                       // süzülme (kâğıt hızı)
        const w=Math.sin(k*18+i)*0.9*dt;                       // sallanma
        pos[j]+=vel[j]*dt+w; pos[j+1]+=vel[j+1]*dt; pos[j+2]+=vel[j+2]*dt-w;
        if(pos[j+1]<0.03){ pos[j+1]=0.03; vel[j+1]=0; vel[j]*=0.5; vel[j+2]*=0.5; }
      }
      attr.needsUpdate=true;
      m.opacity=k<0.7?1:1-(k-0.7)/0.3;
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
  // Faul düdüğü: top bulunduğu yerde (oyun noktası) durur, faule uğrayan takım serbest vuruş kullanır
  const foulStop=(team,spot)=>{
    if(manual||busy()||rs.on||rsNext.kind||!ballInit||Math.abs(bpos.x)>L||Math.abs(bpos.z)>H) return null;
    const x=clamp(spot?spot.x:bpos.x,-L+6,L-6), z=clamp(spot?spot.z:bpos.z,-H+1.5,H-1.5);
    const o=spot?null:ownerP(), v=o&&o.team===team?o:null, c=v?nearestTo(x,z,null,otherTeam(team),true):null;
    if(!startRestart("freekick",team,x,z)) return null;
    if(v&&c&&nearD<3) rigAction3D(v.rig,"fall",{dur:0.7});
    return {x,z};
  };
  const triggerEvent=(ev)=>{
    if(disposed||!ev||!Number.isFinite(ev.x)||!Number.isFinite(ev.y)) return;
    const W=toW(ev.x,ev.y,{x:0,y:0,z:0,set(a,b,c){ this.x=a; this.y=b; this.z=c; }});
    const opp=ev.team==="opp";
    const atkTeam=opp?"away":"home", defTeam=opp?"home":"away";
    const teamCol=opp?COL.away:COL.home;
    // (2D'de x≥50 rakip kalesi tarafı; 3D dünya tarafı devreye göre: ×hs)
    const zoneSide=(ev.x>=50?1:-1)*hs;      // gol/kaçan/kurtarış: zone hangi kaleye yakınsa
    const atkSide=atkDir(atkTeam);           // diğerleri: hücum eden takımın hedef kalesi
    const sideTeam=(s)=>s===atkDir("home")?"home":"away";   // s kalesine hücum eden takım
    const rz=(a)=>(Math.random()*2-1)*a;
    // Olay "an"ı (opts.onImpact): top kale çizgisini geçtiği / kaleciye ulaştığı / direğe çarptığı
    //   karede bildirilir → overlay metin, skor ve sesi bu ana senkronlar. Senaryo kurmayan
    //   olaylarda (kart, uzak bölge vb.) hemen bildirilir.
    // Uzaktan şut azaltma: ceza sahasına uzak şut olaylarının çoğu ceza sahası önüne çekilir
    if(EV_SHOT[ev.type]&&!manual){
      const s=(ev.type==="miss"||ev.type==="save"||ev.type==="goal")?zoneSide:ev.type==="keeper"?-atkSide:atkSide;
      const dg=L-W.x*s;
      if(dg>ACTORS3D_LONG_D&&dg<=45){
        const tm=sideTeam(s), p=nearestTo(W.x,W.z,null,tm,true);
        const sk=p?(tm==="home"?(last.shots&&last.shots[p.idx])||60:(Number(last.oppStr)||65)+(roleCls(p.role)===3?6:0)):0;
        const far=p&&dg<=ACTORS3D_LONG_MAX&&sk>=ACTORS3D_LONG_SHT&&nearestOppDist(p)>5&&Math.random()<ACTORS3D_LONG_P;
        if(!far){ W.x=s*(L-(7+Math.random()*8)); W.z=clamp(W.z,-14,14); }
      }
      zoneT=4;                                   // hücumcu ceza sahasına kadar koşabilsin (pas beklenir)
    }
    else zoneT=2.6;
    {
    }
    let deferred=false;
    const impact=()=>{ if(opts.onImpact) try{ opts.onImpact(ev); }catch(e){ console.error("[3D] onImpact hatası",e); } };
    switch(ev.type){
      case "goal":{
        deferred=true;
        const s=zoneSide, gz=clamp(W.z*0.25,-GW+0.6,GW-0.6);
        const shooterTeam=sideTeam(s);
        beginScript(sDur(2.0)+1.2);
        rsNext.kind="kickoff"; rsNext.team=otherTeam(shooterTeam); rsNext.x=0; rsNext.z=0;   // golü yiyen takım santra yapar
        const shooter=scriptRunner(shooterTeam,W.x,W.z,sDur(0.6));
        cheer(shooterTeam,0.55,1.2);
        const Z={x:W.x,z:W.z};               // gerçek vuruş noktası (legToZone kaydırabilir)
        legToZone(W.x,W.z,()=>{
          kickAnim(shooter,s*L-Z.x,gz-Z.z,1,0.4);
          // Kaleci geç kalır: topun gittiği tarafa uçar ama yetişemez
          const k=keeperOf(s); if(k) diveLater(k,s*L,gz,0.9,shotDur(0.45),Math.hypot(s*L-Z.x,gz-Z.z));
        },Z);
        leg(s*(L+1.2),gz,0.9,1.0,shotDur(0.45),()=>{
          impact();                                         // top ağlarda: GOL metni/skor/ses şimdi
          shakeNet(s);
          rsNext.go=true;
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
        const shooterTeam=sideTeam(s);
        const zs=W.z>=0?1:-1, wz=zs*(GW+1+Math.random()*2.5);
        const high=ev.type==="header";
        beginScript(sDur(1.6));
        rsNext.kind="goal"; rsNext.team=otherTeam(shooterTeam); rsNext.x=s*(L-5.5); rsNext.z=zs*5;   // aut → kale vuruşu
        const shooter=scriptRunner(shooterTeam,W.x,W.z,sDur(0.6));
        const Z={x:W.x,z:W.z};               // gerçek vuruş noktası (legToZone kaydırabilir)
        legToZone(W.x,W.z,()=>{
          if(!high) kickAnim(shooter,s*L-Z.x,wz-Z.z,1,0.4);
          const k=keeperOf(s); if(k&&Math.random()<0.45) diveLater(k,s*L,wz,high?2.2:0.6,shotDur(0.55),Math.hypot(s*L-Z.x,wz-Z.z));
          cheerAny("both",0.5,1.6);
        },Z);
        deferred=true;
        leg(s*(L+2.5),high?rz(GW):wz,high?3.4:0.4,1.6,shotDur(0.55),impact);   // top kale çizgisini geçti (auta)
        leg(s*(L+1),high?rz(GW):wz,0,0.5,sDur(0.35));
        break;
      }
      case "save": case "keeper": case "chance":{
        // keeper: olayın takımının KALECİSİ kurtarır → team "me" bizim kale (−1),
        // team "opp" rakip kale (+1). chance: hücum edenin hedef kalesi.
        const s=ev.type==="save"?zoneSide:ev.type==="keeper"?-atkSide:atkSide;
        if(Math.abs(W.x-s*L)>45) break;
        const shooterTeam=sideTeam(s);
        const gz=clamp(W.z*0.3,-3,3), hgt=0.6+Math.random()*1.2;
        beginScript(sDur(1.7));
        const shooter=scriptRunner(shooterTeam,W.x,W.z,sDur(0.6));
        const Z={x:W.x,z:W.z};               // gerçek vuruş noktası (legToZone kaydırabilir)
        legToZone(W.x,W.z,()=>{
          kickAnim(shooter,s*L-Z.x,gz-Z.z,1,0.4);
          const k=keeperOf(s); if(k&&Math.abs(gz-k.pos.z)>0.9) diveLater(k,s*L,gz,hgt,shotDur(0.4),Math.hypot(s*L-Z.x,gz-Z.z));
          cheerAny("both",0.55,1.8);
        },Z);
        deferred=true;
        leg(s*(L-0.9),gz,hgt,0.6,shotDur(0.4),()=>{ impact(); spawnRing(s*(L-0.9),0.06,gz,0xffffff,0.6,3); try{ if(typeof MATCH_SFX!=="undefined") MATCH_SFX.save(); }catch(_){} });
        leg(s*(L-8),clamp(gz+rz(7),-(H-2),H-2),0,2.2,sDur(0.6));
        break;
      }
      case "crossbar":{
        const s=atkSide;
        if(Math.abs(W.x-s*L)>45) break;
        const gz=rz(GW-0.8);
        beginScript(sDur(1.8));
        const shooter=scriptRunner(atkTeam,W.x,W.z,sDur(0.6));
        const Z={x:W.x,z:W.z};               // gerçek vuruş noktası (legToZone kaydırabilir)
        legToZone(W.x,W.z,()=>{
          kickAnim(shooter,s*L-Z.x,gz-Z.z,1,0.4);
          const k=keeperOf(s); if(k) diveLater(k,s*L,gz,2.3,shotDur(0.45),Math.hypot(s*L-Z.x,gz-Z.z));
        },Z);
        deferred=true;
        leg(s*(L-0.2),gz,D.goalHeight-BR,0.8,shotDur(0.45),()=>{ impact(); shakeNet(s); cheerAny("both",0.7,2); try{ if(typeof MATCH_SFX!=="undefined") MATCH_SFX.post(); }catch(_){} });
        leg(s*(L-12),clamp(gz+rz(8),-(H-2),H-2),0,3,sDur(0.7));
        break;
      }
      case "corner":{
        const s=atkSide, zs=W.z>=0?1:-1;
        const fx=s*(L-0.7), fz=zs*(H-0.7);
        beginScript(sDur(1.3));
        rsNext.kind="corner"; rsNext.team=atkTeam; rsNext.x=fx; rsNext.z=fz;
        scriptRunner(atkTeam,fx,fz,sDur(1.3));
        const d=Math.hypot(fx-bpos.x,fz-bpos.z);
        // Top kendiliğinden uçmaz: yanındaki oyuncu (savunmacı) uzaklaştırır → kornere
        { const k=kickerNear(ACTORS3D_REACH+0.9); if(k) kickAnim(k,fx-bpos.x,fz-bpos.z,0.9,0.4); }
        leg(fx,fz,0,Math.min(5,d*0.06),sDur(Math.min(0.8,0.25+d*0.008)),()=>spawnRing(fx,0.06,fz,teamCol,0.9,4));
        cheer(atkTeam,0.4,2);
        break;
      }
      case "offside":   // kilit andaki ofsayt (spot): bayrağın kalktığı noktadan rakip serbest vuruşu
        if(ev.spot) foulStop(defTeam,W);
        break;
      case "foul": case "handball":
        foulStop(defTeam); break;
      case "yellow":
        { const f=foulStop(defTeam); spawnCard(f?f.x:W.x,f?f.z:W.z,COL.yellowCard); } cheer(atkTeam,0.3,1.5); break;
      case "red": case "tackle_red": case "yellow2red":
        { const f=foulStop(defTeam); spawnCard(f?f.x:W.x,f?f.z:W.z,COL.redCard); } cheer(atkTeam,0.55,2); cheer(defTeam,0.35,2); break;
      default: break; // bilinmeyen tip → sessizce geç
    }
    if(!deferred) impact();
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
    // Rozet sahnede ayrı (root altında): kendi malzemesinin saydamlığı birlikte solar
    if(p.badge&&p.badge.mesh&&p.badge.mesh.material) p.badge.mesh.material.opacity=a;
  };
  // Oyuncuyu tamamen gizle / göster (3D vuruş ekranı sadeleştirmesi). g.visible "sahada"
  //   anlamında kalır (AI/en yakın oyuncu aramaları etkilenmez); yalnız çocuk nesneler gizlenir.
  const setPlayerHidden=(team,i,hidden)=>{
    const p=teamList(team)[i]; if(!p||disposed) return;
    const h=!!hidden; if(!!p.hid===h) return;
    p.hid=h;
    const ch=p.g.children;
    for(let k=0;k<ch.length;k++) ch[k].visible=!h;
    if(p.label&&p.label.s) p.label.s.visible=!h&&!!p.labelText&&!p.label.hide;
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
  // Oyuncuyu (wx,wz) noktasına ANINDA döndür ve sec sn öyle tut (model yerel +Z = göğüs:
  //   yaw = atan2(dx,dz)). Vuruş ekranında zaman ~×0.05 aktığı için kalecinin yavaş dönüşü
  //   beklenmez: göğsü her karede topa/vurucuya bakar. Dalış (diveTo) yönü yine bu yaw'a göre
  //   yerel sağ/sol hesaplar, dolayısıyla dalış tarafları değişmez.
  const faceToward=(team,i,wx,wz,sec)=>{
    const p=teamList(team)[i]; if(!p||disposed||!Number.isFinite(wx)||!Number.isFinite(wz)) return;
    const dx=wx-p.pos.x, dz=wz-p.pos.z; if(Math.hypot(dx,dz)<0.05) return;
    if(p.rig.act==="dive") return;                // dalış sürerken gövde dönmez
    p.yaw=Math.atan2(dx,dz); p.faceYaw=p.yaw; p.faceT=clk+(Number.isFinite(sec)?sec:0.3);
    p.g.rotation.y=p.yaw;
  };
  const diveFx=(team,i,wx,wz,h,spd,t0)=>{
    const p=teamList(team)[i]; if(!p||disposed||!Number.isFinite(wx)||!Number.isFinite(wz)) return;
    diveTo(p,wx,wz,h,spd,t0);
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
      leg(l.x,l.z,Number.isFinite(l.y)?l.y:0,Number.isFinite(l.h)?l.h:0,Number.isFinite(l.dur)?l.dur:0.4,l.fn,l.raw===true);
    }
  };
  const goalFx=(s,gz,team)=>{
    if(disposed) return;
    const tk=team==="away"?"away":"home";
    const col=tk==="away"?COL.away:COL.home;
    shakeNet(s);
    spawnRing(s*(L-1.5),0.06,gz,col,1.3,9);
    spawnBurst(s*(L-0.5),1.6,gz,col,120);
    cheerAny(tk,1,4); cheerAny(otherTeam(tk),0.05,4);
    const p=nearestTo(s*(L-12),gz,null,tk,true);
    if(p&&nearD<35) rigAction3D(p.rig,"celebrate",{});
  };
  const ringFx=(x,z,color,dur,maxS)=>{ if(!disposed) spawnRing(x,0.06,z,color,dur||0.8,maxS||4); };
  const shakeGoal=(s)=>{ if(!disposed) shakeNet(s); };
  const getBall=()=>bpos; // salt okunur
  // Vuruş ekranı canlı topu (yalnız görsel; bpos/fizik değişmez): spin = kendi ekseninde dönüş (rad/sn),
  //   bob = yerinde hafif sekme (m). Gerçek zamanla işler (ağır çekimden bağımsız). (0,0) → kapalı.
  // Vuruş ekranı canlı top konum ofseti (m, yalnız görsel; bpos/fizik değişmez). (0,0,0) → kapalı.
  const setBallIdleOffset=(x,y,z)=>{
    ballIdle.ox=Number.isFinite(x)?x:0; ballIdle.oy=Number.isFinite(y)?Math.max(0,y):0; ballIdle.oz=Number.isFinite(z)?z:0;
  };
  const setBallIdleFx=(spin,bob)=>{
    ballIdle.spin=Number.isFinite(spin)?spin:0; ballIdle.bob=Number.isFinite(bob)?Math.max(0,Math.min(0.15,bob)):0;
    if(!ballIdle.spin&&!ballIdle.bob) ballIdle.t=0;
  };

  const resetKickoff=()=>{
    if(disposed) return;
    gkPend.on=false; evQ.length=0;   // santra: bekleyen olaylar oynatılmaz
    legs.length=0; fl.on=false; fl.fn=null; fl.script=false; lockUntil=0; pend.on=false; pk.on=false;
    // Santra: top havadan orta noktaya, merkeze en yakın oyuncunun ayağına
    bt.on=true; bt.x=0; bt.z=0; anc.x=0; anc.z=0;
    rsNext.kind="kickoff"; rsNext.team=hs<0?"away":"home"; rsNext.x=0; rsNext.z=0;
  };

  // ── Olay kuyruğu: senaryo uçuştaki pası havada kesmesin ──
  // Top serbestçe yol alıyorsa (pas/sekme, sahibi yok) topu oynatan olay, top bir oyuncuya
  //   ulaşana ya da yavaşlayana dek (en çok ACTORS3D_EV_WAIT sn) bekletilir; böylece senaryo
  //   topu boşlukta değil, bir oyuncunun ayağından başlatır. Kart vb. hemen oynar.
  const EV_SHOT={goal:1,miss:1,header:1,save:1,keeper:1,chance:1,crossbar:1};
  // Şut olayında hücum eden takım (triggerEvent ile aynı kural)
  const evAttacker=(ev)=>{
    const t=ev.team==="opp"?"away":"home";
    if(ev.type==="keeper") return otherTeam(t);
    if(ev.type==="goal"||ev.type==="miss"||ev.type==="save") return atkDir("home")===(ev.x>=50?1:-1)*hs?"home":"away";
    return t;
  };
  // Hazırlık bitti mi: süre doldu ya da takım yeterince pas yapıp rakip son üçte bire girdi
  const prepDone=(q)=>{
    if(!q.prep) return true;
    const poss=own.team||rcv.team;
    const ok=clk>=q.prep||rs.on||(poss===q.team&&passN[q.team]-q.p0>=ACTORS3D_PREP_PASSES&&bpos.x*atkDir(q.team)>L-22);
    if(ok){ q.prep=0; if(q.bu&&bu.team===q.team) bu.team=null; }
    return ok;
  };
  const EV_BALL={goal:1,miss:1,header:1,save:1,keeper:1,chance:1,crossbar:1,corner:1};
  const ballInFlight=()=>rs.on||!!rsNext.kind||!busy()&&!ownerP()&&freeBall&&Math.hypot(bvel.x,bvel.z)>1.5;
  // Duvar saati (ms): sahne duraklatılınca (devre arası, dt=0) ya da sekme arka plandayken kare
  //   dönmez; bekleyen olay gerçek zamanda ACTORS3D_EV_WAIT'ten eskiyse 2. yarıda oynatılmaz, atılır
  const evNowMs=()=>(typeof performance!=="undefined"&&performance.now)?performance.now():Date.now();
  // Oynatılmadan düşen olaylar: overlay beklemesin (metin/skor hemen)
  const dropEvQ=()=>{
    const q=evQ.splice(0,evQ.length);
    if(opts.onImpact) q.forEach(it=>{ try{ opts.onImpact(it.ev); }catch(e){} });
    if(!busy()) pend.on=false;
  };   // bekletilen ballPos zaten bt'de
  const queueEvent=(ev)=>{
    // Şut olayı: önce pas organizasyonu (normal tempoda, başka olay beklemiyorken)
    if(!manual&&ev&&EV_SHOT[ev.type]&&!evQ.length&&!busy()&&!rs.on&&!rsNext.kind&&ballInit&&tempo()<1.3){
      const team=evAttacker(ev), b=!bu.team;
      if(b) buildUp(team,ACTORS3D_PREP_SEC+0.4);
      evQ.push({ev,t:clk+ACTORS3D_PREP_SEC+ACTORS3D_EV_WAIT,w:evNowMs(),team,p0:passN[team],prep:clk+ACTORS3D_PREP_SEC,bu:b});
      return;
    }
    if(manual||!ev||(!evQ.length&&!(EV_BALL[ev.type]&&ballInFlight()))){ triggerEvent(ev); return; }
    evQ.push({ev,t:clk+ACTORS3D_EV_WAIT,w:evNowMs()}); // sıra korunur (önceki bekleyen olayın arkasına)
  };

  // ── Snapshot işleme (referans karşılaştırması) ──
  const seen=new Set();
  let last={my:null,opp:null,ball:null,events:null,labels:null}, firstSnap=true;
  const update=(snap)=>{
    if(disposed||!snap) return;
    // Devre değişti (2. yarı başı): taraflar 180° döner → herkes yeni yerine ışınlanır
    const nh=(!manual&&snap.half===2)?-1:1;
    if(nh!==hs){ hs=nh; swapSides(); }
    if(snap.myBase!==baseArr.home) baseArr.home=snap.myBase||null;
    if(snap.oppBase!==baseArr.away) baseArr.away=snap.oppBase||null;
    if(snap.my!==last.my){ last.my=snap.my; applyDots("home",snap.my); }
    if(snap.opp!==last.opp){ last.opp=snap.opp; applyDots("away",snap.opp); }
    last.shots=snap.shots||null; last.oppStr=snap.oppStr;
    if(snap.labels!==last.labels||firstSnap){ last.labels=snap.labels; applyLabels(snap.labels); }
    if(snap.events!==last.events){
      last.events=snap.events;
      const evs=snap.events||[];
      for(let i=0;i<evs.length;i++){
        const ev=evs[i]; if(!ev||seen.has(ev.id)) continue;
        seen.add(ev.id);
        // 3D açıldığında ekranda zaten olan eski olayları yeniden oynatma
        if(!firstSnap) queueEvent(ev);
      }
    }
    // Olaylardan SONRA: aynı karede gelen ballPos senaryo kilidine takılır
    if(snap.ball!==last.ball&&snap.ball){ last.ball=snap.ball; onBallTarget(snap.ball[0],snap.ball[1]); }
    layoutLabels();   // isim plakaları: mesafe ölçeği + çakışma önleme
    firstSnap=false;
  };

  // ── Kare güncellemesi ──
  const wrapPi=(a)=>{ while(a>Math.PI) a-=Math.PI*2; while(a<-Math.PI) a+=Math.PI*2; return a; };
  const updatePlayers=(dt,rdt)=>{
    const tp=tempo();
    // kOvr: oyun görevindeki (sahip/alıcı/baskı) oyuncu hedefe daha kararlı yaklaşır
    const kPos=1-Math.exp(-dt*(manual?3:4.6)), kOvr=1-Math.exp(-dt*9), kYaw=Math.min(1,dt*(manual?6:8)), kSp=Math.min(1,dt*8), kV=Math.min(1,dt*6);

    // Rozetler: yüksek kamerada görünür, numara ekranın yukarısına (kamera bakışının yatay izdüşümü)
    const cam=api.camera, hiCam=!!(cam&&cam.position&&cam.position.y>14);
    let badgeYaw=0;
    if(hiCam&&cam.getWorldDirection){ cam.getWorldDirection(badgeDir); badgeYaw=Math.atan2(-badgeDir.x,-badgeDir.z); }
    for(let t=0;t<2;t++){
      const list=t===0?teams.home:teams.away;
      for(let i=0;i<list.length;i++){
        const p=list[i];
        const slot=t*SH_SLOTS+i;
        if(!p.g.visible){ if(p.badge) p.badge.mesh.visible=false; if(i<SH_SLOTS){ shS.set(0,0,0); shP.set(0,-50,0); shM.compose(shP,shQ,shS); shadows.setMatrixAt(slot,shM); } continue; }
        let dx, dz;
        const pinned=p.rig.act==="dive"||p.rig.act==="slide"||p.rig.act==="fall";
        if(p.driven){
          // Konum dışarıdan sürülüyor: yalnızca karedeki yer değiştirmeyi ölç
          dx=p.pos.x-p.lx; dz=p.pos.z-p.lz;
        } else {
          // (canlı akışta tgt = diziliş çapası: updateAnchors; kanat açılması / forvet koşusu orada)
          const tx=p.ovr?p.ox:p.tgt.x, tz=p.ovr?p.oz:p.tgt.z;
          const kp=p.ovr&&p.cap>0?kOvr:kPos;
          dx=(tx-p.pos.x)*kp; dz=(tz-p.pos.z)*kp;
          const step=Math.hypot(dx,dz);
          let maxStep=(p.cap>0?p.cap:(manual?14:PACE.run*tp*(p.nvSpd||1)))*dt;   // canlı akış: oyuncu başına hız varyasyonu
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
        // Kaleci: göğsü HER ZAMAN topa (geri/yan adımda, kaleye dönerken, uzak topta da) → sırtı
        //   topa/vurucuya hiç dönmez. (Eskiden uzak topta ≥4 m/sn koşarken koşu yönüne dönüyordu:
        //   top uzaktayken kalesine geri koşan kaleci sırtını topa veriyordu.) Topu ayağındayken hariç.
        else if(p.gk&&p!==ownerP()) want=Math.atan2(bpos.x-p.pos.x,bpos.z-p.pos.z);
        else {
          // Koşu yönü yumuşatılmış hızdan (kare adımı titrer); histerezis: 1.4 m/sn üstü koşu yönü,
          //   0.8 altı topa döner (arada önceki durum) → durup kalkarken yön çırpınmaz
          const vs=Math.hypot(p.vx,p.vz);
          p.runFace=p.runFace?vs>0.8:vs>1.4;
          want=p.runFace?Math.atan2(p.vx,p.vz):Math.atan2(bpos.x-p.pos.x,bpos.z-p.pos.z);
        }
        if(!pinned) p.yaw+=wrapPi(want-p.yaw)*kYaw;
        p.g.position.set(p.pos.x,0,p.pos.z);
        p.g.rotation.y=p.yaw;
        if(p.badge){
          const bm=p.badge.mesh, on=hiCam&&!p.hid;
          bm.visible=on;
          if(on){ bm.position.set(p.pos.x,0.045,p.pos.z); bm.rotation.y=badgeYaw; }
        }
        p.rig.rdt=Number.isFinite(rdt)?rdt:dt;   // gerçek zaman (kaleci bekleme yaylanması ağır çekimde de akar)
        animateRig3D(p.rig,dt,pinned?0:p.speed);
        if(p.rig.glb) p.rig.glb.sync(p.rig);   // hazır insan modeli kemikleri ← rig eklemleri
        // Gölge: güneş yönünde uzatılmış; dalış/kaymada gövdeyi izler, havadayken küçülür
        //   (rig birimleri oyuncu ölçeğiyle dünyaya çevrilir: gerçek boy kaleci)
        if(i<SH_SLOTS){
          const B=p.rig.body, off=B.position.x*p.sk;
          const low=clamp((RIG3D_HIP-B.position.y)/1.0,0,1), air=Math.max(0,B.position.y-RIG3D_HIP-0.12)*p.sk;
          const k=1/(1+air*0.9)*(0.45+0.55*p.sk);
          shP.set(p.pos.x+Math.cos(p.yaw)*off+SUN_OX,0.03,p.pos.z-Math.sin(p.yaw)*off+SUN_OZ);
          if(p.hid) shS.set(0,0,0); else shS.set((1+0.35*low)*k,1,(1.45+0.8*low)*k);   // gizli oyuncunun gölgesi yok
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
    bprev.x=px; bprev.z=pz;
    const o=fl.on||legs.length?null:ownerP();
    if(fl.on){
      fl.t+=dt;
      // Ham (raw) bacaklar: bu karede biten kısa bacaklar hemen tüketilir, artan süre devreder
      while(fl.on&&fl.raw&&fl.t>=fl.dur&&legs.length&&legs[0].raw){
        const over=fl.t-fl.dur, fn=fl.fn; fl.fn=null; fl.on=false;
        bpos.set(fl.ex,Math.max(0,fl.ey),fl.ez);
        if(fn){ try{fn();}catch(e){console.error("[3D] efekt hatası",e);} }
        if(fl.on) break;                 // efekt yeni uçuş başlattı
        if(!(legs.length&&legs[0].raw)) break;
        nextLeg(); fl.t=over;
      }
    }
    if(fl.on){
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
      const off=(0.8+0.45*run*touch)*(0.35+0.65*o.sk);   // ayak önü: oyuncu ölçeğiyle (gerçek boyda ~0.6 m)
      bpos.x=o.pos.x+Math.sin(o.yaw)*off; bpos.z=o.pos.z+Math.cos(o.yaw)*off;
      bpos.y=0.1*run*4*touch*(1-touch);
      // Canlı akış, topu yeni alma: top ayağa ışınlanmaz, kısa sürede yumuşakça oturur
      if(!manual){
        const g=(clk-own.since)/ACTORS3D_GRAB_SEC;
        if(g<1){ const kk=Math.min(1,dt*12+g*g); bpos.x=px+(bpos.x-px)*kk; bpos.z=pz+(bpos.z-pz)*kk; }
      }
      if(dt>0){ bvel.x=(bpos.x-px)/dt; bvel.z=(bpos.z-pz)/dt; bvel.y=0; }
    } else if(freeBall) integrateBall(dt);
    { const hiCam=!!(api.camera&&api.camera.position&&api.camera.position.y>14);
      // Kuşbakışında top okunurluk için 1.15× (eski 1.6×'ten ~%28 küçük: oyunculara oranlı; yükseldikçe
      //   biraz daha: yükseklik hissi); alçak kamerada gerçek ölçek
      const sc=hiCam?1.15+Math.min(0.8,Math.max(0,bpos.y)*0.1):1;
      ball.scale.set(sc,sc,sc); ball.position.set(bpos.x,BR*sc+bpos.y,bpos.z);
      // Dönme: yer değiştirmeyle orantılı (yuvarlanma; görünen yarıçapla)
      ball.rotation.z-=(bpos.x-px)/(BR*sc);
      ball.rotation.x+=(bpos.z-pz)/(BR*sc);
      if(ballIdle.spin||ballIdle.bob){
        ballIdle.t+=hookRdt;
        ball.rotation.y+=ballIdle.spin*hookRdt; ball.rotation.x+=ballIdle.spin*0.35*hookRdt;   // yerinde dönüş
        ball.position.y+=ballIdle.bob*Math.abs(Math.sin(ballIdle.t*5.2));                     // hafif sekme
      }
      // Vuruş ekranı canlı top ofseti (setBallIdleOffset; yalnız görsel): sekme + yatay salınım
      if(ballIdle.ox||ballIdle.oy||ballIdle.oz){ ball.position.x+=ballIdle.ox; ball.position.y+=ballIdle.oy; ball.position.z+=ballIdle.oz; } }
    ballShadow.position.set(bpos.x+ballIdle.ox,0.035,bpos.z+ballIdle.oz);
    // Yumuşak temas gölgesi: top yükseldikçe KÜÇÜLÜR ve silikleşir (yerde ~0.94 m çap, 4 m'de ~yarısı)
    const ss=0.55*(BR/0.42)*(api.camera&&api.camera.position&&api.camera.position.y>14?1.6:1)/(1+Math.max(0,bpos.y+ballIdle.oy)*0.25);   // top boyuyla orantılı
    ballShadow.scale.set(ss,1,ss);
    mats.ballShadow.opacity=0.45/(1+Math.max(0,bpos.y+ballIdle.oy)*0.45);
    { const cg=clamp(1-(bpos.y+ballIdle.oy)/0.8,0,1);                           // yerde 1, 0.8 m'de 0
      ballContact.visible=cg>0.02; ballContact.position.set(bpos.x+ballIdle.ox,0.04,bpos.z+ballIdle.oz);
      const cs=0.26+0.1*(1-cg); ballContact.scale.set(cs,1,cs); ballContactMat.opacity=0.75*cg; }
    updateTrail(dt,px,pz);
  };
  // Top izi: senaryo uçuşunda (gol/kurtarış/şut; kilit an şutları da playBallScript ile) ve top
  //   hızlıyken açılır; aksi halde söner. Noktalar her karede bir kaydırılır (en yeni = 0).
  const updateTrail=(dt,px,pz)=>{
    if(!(dt>0)) return;
    const v=Math.hypot(bpos.x-px,bpos.z-pz)/dt;
    const want=(fl.on&&fl.script&&v>ACTORS3D_TRAIL_V)?1:0;
    trailK+=(want-trailK)*Math.min(1,dt*(want?10:4));
    if(trailK<0.02&&!want){ if(trail.visible) trail.visible=false; trailK=0; return; }
    const cy=ball.position.y, N=ACTORS3D_TRAIL_N;
    if(!trail.visible){ for(let i=0;i<N;i++){ trailPos[i*3]=bpos.x; trailPos[i*3+1]=cy; trailPos[i*3+2]=bpos.z; } trail.visible=true; }
    for(let i=N-1;i>0;i--){ trailPos[i*3]=trailPos[i*3-3]; trailPos[i*3+1]=trailPos[i*3-2]; trailPos[i*3+2]=trailPos[i*3-1]; }
    trailPos[0]=bpos.x; trailPos[1]=cy; trailPos[2]=bpos.z;
    for(let i=0;i<N;i++){ const k=trailK*Math.pow(1-i/N,1.6)*0.85; trailCol[i*3]=k; trailCol[i*3+1]=k*0.97; trailCol[i*3+2]=k*0.88; }
    trailPA.needsUpdate=true; trailCA.needsUpdate=true;
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
      const atk=bpos.x*atkDir(o.team)>0;
      if(atk) cheer(o.team,0.32,0.8);
    }
  };

  let disposed=false;
  let hookMs=0;   // son karenin duvar saati (ms): uzun boşluk = sekme arka planda kalmış
  const hook=(dt,t,rdt)=>{
    if(disposed) return;
    hookRdt=Number.isFinite(rdt)?Math.min(0.1,rdt):dt;
    clk=t;
    const nowMs=evNowMs(), gapMs=hookMs>0?nowMs-hookMs:0; hookMs=nowMs;
    if(opts.getSnapshot) update(opts.getSnapshot());
    clearOverrides();
    // Bekleyen olay: duraklatmada (dt=0) at; duvar saatinde bayatlama yalnız sekme gizliyken ya da
    //   uzun kare boşluğunda (>1 sn) uygulanır — düşük FPS'li cihazda gol animasyonu düşmesin
    const wallStale=(typeof document!=="undefined"&&document.hidden)||gapMs>1000;
    if(evQ.length&&(dt<=0||(wallStale&&nowMs-evQ[0].w>(ACTORS3D_EV_WAIT+(evQ[0].team?ACTORS3D_PREP_SEC:0))*1000+500))) dropEvQ();
    if(!manual&&dt>0&&evQ.length&&!busy()&&prepDone(evQ[0])&&(!ballInFlight()||(clk>=evQ[0].t&&!rs.on&&!rsNext.kind))){ const q=evQ.shift(); triggerEvent(q.ev); if(!busy()&&!evQ.length) pend.on=false; } // senaryo kurmayan olay: bekletilen ballPos zaten bt'de
    if(!manual&&dt>0) updateAnchors(dt);
    if(!manual&&dt>0) autoPossess(dt);
    updatePlayers(dt,rdt);
    updateBall(dt);
    for(let i=0;i<cornerFlags.length;i++){
      const f=cornerFlags[i], c=api.camera.position;
      f.visible=Math.hypot(c.x-f.position.x,c.y-1,c.z-f.position.z)>6;
    }
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
    { const gb=ball.getObjectByName("glbBall"); if(gb){ ball.remove(gb); disposeObject3D(gb); } }   // hazır top modeli
    if(glbKit){ try{ glbKit.dispose(); }catch(e){} glbKit=null; }                                   // hazır insan modeli
    [root,ballRoot,fxRoot].forEach(g=>{ if(g.parent) g.parent.remove(g); g.clear(); });
    try{ kit.dispose(); }catch(e){}
    owned.geos.forEach(g=>{try{g.dispose();}catch(e){}});
    owned.texs.forEach(t=>{try{t.dispose();}catch(e){}});
    owned.mats.forEach(m=>{try{m.dispose();}catch(e){}});
    fadeMats.forEach(m=>{try{m.dispose();}catch(e){}}); fadeMats.length=0;
    owned.geos.length=0; owned.texs.length=0; owned.mats.length=0;
    teams.home.length=0; teams.away.length=0; legs.length=0; evQ.length=0; seen.clear();
    own.team=null; rcv.team=null; chaser=null; nearBest=null; freeBall=false; scr.p=null; pr1=null; pr2=null; sup[0]=null; sup[1]=null; runners[0]=null; runners[1]=null;
  };
  if(api.addDisposeHook) removeDisposeHook=api.addDisposeHook(dispose);

  return {update,triggerEvent,resetKickoff,dispose,getRestart:()=>rs.on?rs.kind:"",
    movePlayer,getPlayerPos,setBall,playBallScript,goalFx,ringFx,shakeGoal,getBall,
    drivePlayer,setOwner,getOwner,kickTo,kickBall,getBallVel:()=>bvel,isBallFree:()=>freeBall,
    getPlayer,poseFx,actionFx,diveFx,faceToward,setPlayerFade,setPlayerHidden,setBallIdleFx,setBallIdleOffset,passTime,ballR:BR,
    buildUp,inFinalThird,getPlaySpot,isAlive:()=>!disposed,kickTime};
}
