// ═══════════════════════════════════════════════════════════════
// 3D KULÜP KAMPÜSÜ (Club Hub) — "Merkez" sekmesi
// Prosedürel, PBR malzemeli spor kompleksi (tuval dokuları + MeshStandardMaterial):
//   • Arena: beton kolon + cam panelli cephe, çelik kafes çatı, LED şerit, dalgalanan kulüp
//     bayrakları, giriş turnikeleri, takım otobüsü cebi
//   • Kulüp Plazası: yansımalı cam kule, kat çizgileri, cam sundurma, kulüp amblemi, çeşme
//   • Sağlık & Performans: beyaz-cam bina, tartan koşu pisti, açık hava kondisyon alanı
//   • Antrenman / Akademi: biçme şeritli sahalar, ağlı kaleler, köşe bayrakları, kuklalar, kulübeler
//   • Gökyüzü kubbesi (bulutlu / yıldızlı) + ondan üretilen ortam yansıması (PMREM)
//   • Çevre yolunda dönen takım otobüsü
//   • Çevre: kıvrılan nehir + kemerli taş köprü, Kenney banliyö evleri (6 tip, 90° katı yön, ölçek,
//     3 renk varyantı) + bahçe çitleri, apartmanlar, kasaba sokakları/lambaları; 5 tür ağaç (meşe,
//     detaylı, yuvarlak/uzun çam, küçük), nehir kıyısı/park kaya + çim öbekleri (hepsi InstancedMesh, .glb CC0;
//     yüklenemeyen her parça prosedürel yedeğe düşer)
//   • Zemin: çok katmanlı çim tuvali (+bump) × makro doku (yama, nemli nehir kıyısı, bina/ağaç altı AO)
//   • Işık: tek güneş/ay (1024² PCFSoft, statik) + HemisphereLight; gündüz sıcak ikindi, gece serin ay;
//     gölge kamerası dışındaki ev/ağaçlara ışık yönüne göre uzayan decal gölge
//   • Kamera: sürükle = 360° yörünge, pinch/tekerlek = sınırlı zoom, tesis ikonu = yumuşak odak
// Performans: DPR ≤ 1.5; gölge haritası statik; sekme gizli/ekran dışıyken RAF durur; 30 fps;
// unmount'ta geometri/materyal/doku/PMREM/renderer dispose edilir.
// ═══════════════════════════════════════════════════════════════
const HUB_FACILITIES=[
  {id:"stadium", icon:"🏟️",name:"Stadyum",            pos:[0,0,-10],  cam:[0,26,14],   bh:10.5,col:"#2563eb"},
  {id:"training",icon:"⚽", name:"Antrenman Sahası",   pos:[-24,0,8],  cam:[-14,18,26], bh:3.5, col:"#16a34a"},
  {id:"fitness", icon:"🏃", name:"Fitness & Kondisyon",pos:[28,0,6.6], cam:[34,14,24],  bh:2.5, col:"#ea580c"},
  {id:"academy", icon:"🌟", name:"Altyapı Akademisi",  pos:[-15,0,26], cam:[-8,16,42],  bh:5,   col:"#9333ea"},
  {id:"medical", icon:"🏥", name:"Sağlık Merkezi",     pos:[21,0,4],   cam:[12,15,18],  bh:7.5, col:"#dc2626"},
  {id:"admin",   icon:"🏢", name:"Yönetim & Mağaza",   pos:[17,0,24],  cam:[12,18,44],  bh:16,  col:"#b45309"},
];
const HUB_OVERVIEW={cam:[0,56,62],look:[0,0,7]};
// Kampüsün batısından kıvrılarak geçen nehir (dünya x,z kontrol noktaları)
const HUB_RIVER=[[-20,-245],[-55,-150],[-80,-70],[-58,-22],[-58,14.5],[-61,50],[-88,110],[-75,180],[-45,240]];
const HUB_RIVER_W=12;
const HUB_MODEL_DIR="assets/models/";

// Ana ışık yönü: sahne hedefine (HUB_SUN_TGT) göre ofset. Gündüz batı-güneybatıdan alçak (~33°) sıcak ikindi
// güneşi → uzun yumuşak gölgeler; gece doğu-kuzeydoğudan yüksek (~46°) serin ay. Gökyüzündeki güneş parıltısı /
// ay diski ve sahte (decal) gölgelerin yönü de buradan hesaplanır.
const HUB_SUN_DIR={day:[-61,44,27],night:[48,58,-30]};
const HUB_SUN_TGT=[-1,0,7];
const HUB_SHADOW_R=52;   // gölge kamerası yarı genişliği: 1024² harita → ~10 cm/texel. Dışında: decal gölge + zemin AO
// Kenney banliyö evleri: ham taban izi (glb birimi; fx = cephe genişliği, fz = derinlik, hy = yükseklik; ön yüz −z)
const HUB_HOUSE_TYPES=[
  {n:"building-type-a",fx:1.30,fz:1.02,hy:0.83,w:3},{n:"building-type-b",fx:1.82,fz:1.14,hy:1.14,w:2},
  {n:"building-type-c",fx:1.28,fz:1.02,hy:1.03,w:3},{n:"building-type-d",fx:1.76,fz:1.02,hy:1.24,w:2},
  {n:"building-type-e",fx:1.30,fz:1.02,hy:1.14,w:3},{n:"building-type-f",fx:1.42,fz:1.40,hy:1.14,w:2}];
// Ev renk varyantları (prosedürel palet atlası başına bir tane): çatı / duvar / söve / kapı
const HUB_HOUSE_PAL=[
  {roof:"#b4503a",wall:"#efe2c6",trim:"#fbf8f1",door:"#7b4a2d"},
  {roof:"#56606d",wall:"#e4e9ec",trim:"#ffffff",door:"#2e4e6e"},
  {roof:"#7d4a32",wall:"#d3dfcb",trim:"#f6f3ea",door:"#8a3030"}];
// Ağaç türleri (assets/models/*.glb): hedef boy (m), yaprak/gövde rengi; atlas → Kenney paletli model
const HUB_TREES={
  oak:     {n:"tree_oak",       h:4.4,leaf:0x356a26,bark:0x6e4b33},
  detailed:{n:"tree_detailed",  h:4.8,leaf:0x3d6e28,bark:0x6e4b33},
  pineR:   {n:"tree_pineRoundA",h:5.2,leaf:0x285c32,bark:0x5a3d2a},
  pineT:   {n:"tree_pineTallA", h:6.8,leaf:0x235231,bark:0x5a3d2a},
  small:   {n:"tree-small",     h:2.6,atlas:true}};

// Tema → sahne ışık/sis/pozlama değerleri. Işık düzeni: tek ana yönlü ışık (güneş/ay) + HemisphereLight
// (gök/çim dolgu). Stadyum projektörleri (4 PointLight) yalnız gece sahneye girer. blob = decal gölge opaklığı.
const hubSceneTone=(light)=>light
  ?{fog:0xdfe7ea,fogD:0.0040,hemiSky:0xc6dcf7,hemiGround:0x667a36,hemi:0.5,sun:2.0,sunCol:0xffc88e,sunDir:HUB_SUN_DIR.day,flood:0,led:1.4,win:0,lamp:0,exp:0.9,env:0.5,blob:0.34}
  :{fog:0x0e1930,fogD:0.0062,hemiSky:0x2b4677,hemiGround:0x0c1b17,hemi:0.26,sun:0.42,sunCol:0xa6c2ff,sunDir:HUB_SUN_DIR.night,flood:2.2,led:3.2,win:1.25,lamp:1.6,exp:0.86,env:0.32,blob:0.22};

// ── Tuval dokuları ─────────────────────────────────────────────
function hubCanvasTex(THREE,w,h,draw,rx=1,ry=1){
  const c=document.createElement("canvas"); c.width=w; c.height=h;
  draw(c.getContext("2d"),w,h);
  const t=new THREE.CanvasTexture(c);
  t.encoding=THREE.sRGBEncoding; t.anisotropy=4;
  if(rx!==1||ry!==1){ t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(rx,ry); }
  return t;
}
const hubNoise=(g,w,h,n,cols,a)=>{ for(let i=0;i<n;i++){ g.fillStyle=cols[i%cols.length]; g.globalAlpha=a*Math.random(); g.fillRect(Math.random()*w,Math.random()*h,1+Math.random()*2,1+Math.random()*2);} g.globalAlpha=1; };
const hubShade=(hex,k)=>{ const n=parseInt(String(hex).replace("#","").padEnd(6,"0").slice(0,6),16); const f=v=>Math.max(0,Math.min(255,Math.round(v*k)));
  return `rgb(${f(n>>16&255)},${f(n>>8&255)},${f(n&255)})`; };
// İki renk arası doğrusal karışım (t 0..1, sınırlanır) → css rgb
const hubMix=(a,b,t)=>{ const p=h=>{ const n=parseInt(String(h).replace("#",""),16); return [n>>16&255,n>>8&255,n&255]; };
  const A=p(a), B=p(b), k=Math.max(0,Math.min(1,t)); return `rgb(${A.map((v,i)=>Math.round(v+(B[i]-v)*k)).join(",")})`; };

// Organik çok tonlu çim (512², kenarları sarmalı → dikişsiz tekrar). Aynı doku bumpMap olarak da kullanılır:
// sapların açık uçları "yüksek", koyu dipleri "alçak" → alçak ikindi güneşinde ince çim kabartısı.
function hubGrassTex(THREE){
  const t=hubCanvasTex(THREE,512,512,(g,w,h)=>{
    const wrap=(x,y,r,fn)=>{ for(const ox of [-w,0,w]) for(const oy of [-h,0,h]) if(x+ox>-r&&x+ox<w+r&&y+oy>-r&&y+oy<h+r) fn(x+ox,y+oy); };
    const blob=(x,y,r,tc,a)=>wrap(x,y,r,(px,py)=>{ const gr=g.createRadialGradient(px,py,0,px,py,r); gr.addColorStop(0,tc+a+")"); gr.addColorStop(1,tc+"0)"); g.fillStyle=gr; g.fillRect(px-r,py-r,2*r,2*r); });
    g.fillStyle="#5a8e42"; g.fillRect(0,0,w,h);
    // 1) Geniş, yumuşak renk geçişleri: zeytin / taze çimen / koyu nemli yeşil / güneşte solmuş açık yeşil
    const tones=["rgba(108,132,58,","rgba(74,124,48,","rgba(52,96,38,","rgba(132,164,78,","rgba(96,118,52,","rgba(146,156,84,","rgba(62,112,46,"];
    for(let i=0;i<90;i++) blob(Math.random()*w,Math.random()*h,26+Math.random()*96,tones[i%tones.length],.09+Math.random()*.14);
    // 2) Yonca / sık çim öbekleri: küçük koyu adacıklar, içlerinde yuvarlak yapraklar
    for(let i=0;i<120;i++){ const cx=Math.random()*w, cy=Math.random()*h, r=5+Math.random()*10;
      blob(cx,cy,r*1.6,"rgba(44,88,34,",.28);
      for(let k=0;k<10;k++){ const a=Math.random()*6.28, d=Math.random()*r, x=cx+Math.cos(a)*d, y=cy+Math.sin(a)*d;
        g.fillStyle=Math.random()<.5?"#4f8c3c":"#5f9c46"; g.globalAlpha=.55; wrap(x,y,3,(px,py)=>{ g.beginPath(); g.arc(px,py,1+Math.random()*1.4,0,7); g.fill(); }); } }
    g.globalAlpha=1;
    // 3) Çim sapları: önce koyu dip katmanı, sonra ışık alan açık uçlar (ışık sol üstten)
    g.lineCap="round";
    const blades=[["#2f5a24","#35652a","#3f7330"],["#4d8538","#6a9a48","#7fae58","#8a9c4c","#9bbd6a","#a9c977"]];
    blades.forEach((cols,pass)=>{ for(let i=0;i<(pass?14000:9000);i++){ const x=Math.random()*w, y=Math.random()*h, l=(pass?2:3)+Math.random()*5, a=-Math.PI/2+(Math.random()-.5)*1.1;
      g.strokeStyle=cols[(Math.random()*cols.length)|0]; g.globalAlpha=(pass?.22:.3)+Math.random()*.42; g.lineWidth=.6+Math.random()*.8;
      const dx=Math.cos(a)*l, dy=Math.sin(a)*l; wrap(x,y,8,(px,py)=>{ g.beginPath(); g.moveTo(px,py); g.lineTo(px+dx,py+dy); g.stroke(); }); } });
    g.globalAlpha=1;
    // 4) Seyrek kır çiçekleri (beyaz papatya / sarı / lila noktalar)
    for(let i=0;i<150;i++){ const x=Math.random()*w, y=Math.random()*h; g.fillStyle=["#f4f1e4","#f6d85a","#c9b6e8","#ffffff"][i%4]; g.globalAlpha=.55+Math.random()*.35;
      wrap(x,y,2,(px,py)=>g.fillRect(px,py,1.2+Math.random(),1.2+Math.random())); }
    g.globalAlpha=1;
    // 5) Toprak / kuru ot grenleri
    hubNoise(g,w,h,5500,["#6b6a3a","#a2ad6a","#2f5626","#7c9446","#8a7a4a"],.35);
  },34,34);
  t.wrapS=t.wrapT=THREE.RepeatWrapping;
  return t;
}
// Zemin makro dokusu (512², tüm zemin dairesini BİR KEZ kaplar, tekrar yok): çim dokusunun tekrar desenini
// kırar ve doğal geçişler ekler. Değer 128 = ×1.0 çarpan (shader'da rgb×2). İçerik: geniş taze/kuru/serin
// çim lekeleri, nehir boyu nemli koyu yeşil kuşak, kampüs içi bakımlı çim, ev bahçeleri ve her ağaç / binanın
// altında yumuşak ortam kapanması (AO) → gölge haritası dışında da nesneler zemine "oturur".
// d: {river:[{x,z}], trees:[[x,z,r]], boxes:[[x,z,hx,hz]], ring:[x0,z0,x1,z1], R:yarıçap}
function hubGroundMacroTex(THREE,d){
  const N=512, S=N/(2*d.R), X=x=>(x+d.R)*S, Z=z=>(z+d.R)*S;
  const c=document.createElement("canvas"); c.width=c.height=N; const g=c.getContext("2d");
  g.fillStyle="rgb(128,128,128)"; g.fillRect(0,0,N,N);
  const blob=(x,y,r,col,a)=>{ const gr=g.createRadialGradient(x,y,0,x,y,r); gr.addColorStop(0,`rgba(${col},${a})`); gr.addColorStop(1,`rgba(${col},0)`); g.fillStyle=gr; g.fillRect(x-r,y-r,2*r,2*r); };
  // Geniş lekeler: taze (yeşile kayık), kuru (sarıya kayık), serin (mavi-yeşil gölgeli)
  const cols=["112,140,106","154,144,104","118,130,124","138,142,100","104,132,104"];
  for(let i=0;i<70;i++) blob(Math.random()*N,Math.random()*N,(18+Math.random()*48)*S*2,cols[i%cols.length],.35+Math.random()*.3);
  // Kampüs çevre yolu içi: bakımlı, hafif koyu-taze çim
  {const [x0,z0,x1,z1]=d.ring; g.fillStyle="rgba(112,136,108,.45)"; g.fillRect(X(x0),Z(z0),X(x1)-X(x0),Z(z1)-Z(z0));}
  // Nehir kıyısı: nemli, koyu ve canlı yeşil kuşak (iç içe geniş → dar)
  g.lineCap=g.lineJoin="round";
  [[34,"98,130,104",.35],[20,"90,124,96",.45]].forEach(([wd,col,a])=>{ g.strokeStyle=`rgba(${col},${a})`; g.lineWidth=wd*S; g.beginPath();
    d.river.forEach((p,i)=>i?g.lineTo(X(p.x),Z(p.z)):g.moveTo(X(p.x),Z(p.z))); g.stroke(); });
  // Bina tabanları: yumuşak kenarlı koyu halka (içten dışa azalan katmanlar)
  d.boxes.forEach(([x,z,hx,hz])=>{ for(let k=4;k>=1;k--){ const e=k*0.9; g.fillStyle=`rgba(70,78,72,${0.12})`;
    g.fillRect(X(x-hx-e),Z(z-hz-e),(2*hx+2*e)*S,(2*hz+2*e)*S); } });
  // Ağaç altları: taç gölgesi + kök çevresi koyu
  d.trees.forEach(([x,z,r])=>blob(X(x),Z(z),Math.max(1.5,r*S),"70,84,72",.5));
  const t=new THREE.CanvasTexture(c);
  t.flipY=false; t.encoding=THREE.LinearEncoding; t.wrapS=t.wrapT=THREE.ClampToEdgeWrapping;
  return t;
}
// Sahte (decal) temas gölgesi dokusu: yumuşak kenarlı yuvarlatılmış dikdörtgen (beyaz, alfa ile)
function hubBlobTex(THREE){
  const c=document.createElement("canvas"); c.width=c.height=64; const g=c.getContext("2d");
  for(let i=0;i<14;i++){ const e=2+i*2; g.fillStyle="rgba(255,255,255,.085)"; g.beginPath();
    const r=Math.max(2,18-i); if(g.roundRect) g.roundRect(e,e,64-2*e,64-2*e,r); else g.rect(e,e,64-2*e,64-2*e); g.fill(); }
  const t=new THREE.CanvasTexture(c); t.encoding=THREE.sRGBEncoding; return t;
}
// Kenney "colormap.png" palet atlası yerine prosedürel atlas. Modellerin UV'leri 16 sütunluk bir paletin
// sütun ortalarına (u=(i+.5)/16) düşer, v ise yükseklikle azalan bir renk rampasıdır (küçük v = üst):
//   sütun 1  → çatı (v .27–.46) + söve/saçak/basamak (v .52–.73)   sütun 3 → taş (v<.75), çit/çalı yeşili (.75–.93), gövde/toprak (>.93)
//   sütun 7  → duvar                                                sütun 9 → yol / bahçe çiti (beyaz ahşap)     sütun 11 → kapı
// Komşu boş sütunlar en yakın dolu sütunun rengiyle doldurulur; mipmap yok (yüz başına u sabit → titreme olmaz).
function hubKenneyAtlas(THREE,pal){
  const W=64, H=256, c=document.createElement("canvas"); c.width=W; c.height=H; const g=c.getContext("2d");
  const ramp=(v,v0,v1)=>(v-v0)/(v1-v0);
  const k=(hex,f)=>"#"+[16,8,0].map(s=>Math.max(0,Math.min(255,Math.round((parseInt(hex.slice(1),16)>>s&255)*f))).toString(16).padStart(2,"0")).join("");
  const prof=[
    v=>v<0.47?hubMix(k(pal.roof,1.12),pal.roof,ramp(v,0.27,0.36))                                        // sütun 0–2: çatı
      :v<0.52?hubShade(pal.roof,0.62):hubMix(pal.trim,"#d8d2c6",ramp(v,0.52,0.73)),                       //   oluk / söve
    v=>v<0.75?hubMix("#a7a094","#857f74",ramp(v,0.55,0.75))                                               // 3–5: taş
      :v<0.93?hubMix("#7cb04f","#3b6f30",ramp(v,0.775,0.93)):hubMix("#7a5638","#55392a",ramp(v,0.93,0.98)), //   çalı / gövde
    v=>hubMix(k(pal.wall,1.03),k(pal.wall,0.88),ramp(v,0.525,0.725)),                                    // 6–8: duvar
    v=>hubMix("#f1ede4","#cbc3b3",ramp(v,0.525,0.725)),                                                    // 9–10: yol / çit
    v=>hubMix(k(pal.door,1.15),pal.door,ramp(v,0.35,0.464))];                                              // 11–15: kapı
  const colOf=i=>i<=2?0:i<=5?1:i<=8?2:i<=10?3:4;
  for(let y=0;y<H;y++){ const v=(y+0.5)/H; for(let i=0;i<16;i++){ g.fillStyle=prof[colOf(i)](v); g.fillRect(i*4,y,4,1); } }
  const t=new THREE.CanvasTexture(c);
  t.flipY=false; t.encoding=THREE.sRGBEncoding; t.generateMipmaps=false; t.minFilter=t.magFilter=THREE.LinearFilter;
  t.wrapS=t.wrapT=THREE.ClampToEdgeWrapping;
  return t;
}
// Kavşak karesi: şeritsiz düz asfalt
function hubAsphaltTex(THREE){
  return hubCanvasTex(THREE,128,128,(g,w,h)=>{ g.fillStyle="#3b3f46"; g.fillRect(0,0,w,h); hubNoise(g,w,h,1100,["#2d3136","#4a4f57","#585d65"],.7); });
}
// Modern ahşap kaplama (dikey çıtalar)
function hubWoodTex(THREE,rep=2){
  return hubCanvasTex(THREE,256,256,(g,w,h)=>{
    for(let x=0;x<w;x+=16){ g.fillStyle=["#9a6a3f","#a8774a","#8c5f37","#b0804f"][(x/16)%4]; g.fillRect(x,0,16,h); g.fillStyle="rgba(40,22,10,.45)"; g.fillRect(x+15,0,1,h); }
    for(let i=0;i<220;i++){ g.strokeStyle="rgba(60,34,16,"+(.08+Math.random()*.14)+")"; g.lineWidth=.6; const x=Math.random()*w; g.beginPath(); g.moveTo(x,0); g.bezierCurveTo(x+2,h*.3,x-2,h*.7,x+1,h); g.stroke(); }
  },rep,1);
}
function hubPitchTex(THREE){
  return hubCanvasTex(THREE,1024,672,(g,w,h)=>{
    for(let i=0;i<16;i++){ g.fillStyle=i%2?"#3c9445":"#4fae58"; g.fillRect(i*w/16,0,w/16+1,h); }
    for(let j=0;j<10;j++){ g.fillStyle=j%2?"rgba(255,255,255,.035)":"rgba(0,0,0,.035)"; g.fillRect(0,j*h/10,w,h/10+1); } // çapraz biçme
    hubNoise(g,w,h,9000,["#3a8a42","#5cbd66","#2f7a38"],.35);
    g.strokeStyle="rgba(255,255,255,.95)"; g.lineWidth=5; const m=28;
    g.strokeRect(m,m,w-2*m,h-2*m);
    g.beginPath(); g.moveTo(w/2,m); g.lineTo(w/2,h-m); g.stroke();
    g.beginPath(); g.arc(w/2,h/2,82,0,7); g.stroke();
    [m,w-m].forEach((x,i)=>{ g.strokeRect(i?x-150:x,h/2-170,150,340); g.strokeRect(i?x-55:x,h/2-76,55,152);
      g.beginPath(); g.arc(i?x-110:x+110,h/2,82,i?Math.PI*0.62:-Math.PI*0.38,i?Math.PI*1.38:Math.PI*0.38); g.stroke(); });
    g.fillStyle="#fff"; g.beginPath(); g.arc(w/2,h/2,6,0,7); g.fill();
  });
}
function hubRoadTex(THREE,len){
  return hubCanvasTex(THREE,128,512,(g,w,h)=>{
    g.fillStyle="#cbc4b6"; g.fillRect(0,0,w,h);
    hubNoise(g,w,h,1400,["#b5ad9e","#ddd6c8"],.5);
    for(let y=0;y<h;y+=24){ g.fillStyle="rgba(0,0,0,.14)"; g.fillRect(0,y,18,1.5); g.fillRect(w-18,y,18,1.5); }
    g.fillStyle="#a39c90"; g.fillRect(18,0,4,h); g.fillRect(w-22,0,4,h);
    g.fillStyle="#3b3f46"; g.fillRect(22,0,w-44,h);
    hubNoise(g,w,h,4200,["#2d3136","#4a4f57","#585d65"],.7);
    g.fillStyle="rgba(240,236,224,.85)"; g.fillRect(26,0,2,h); g.fillRect(w-28,0,2,h);
    g.fillStyle="#f2d36b"; for(let y=16;y<h;y+=128) g.fillRect(w/2-2,y,4,64);
  },1,len);
}
function hubParkingTex(THREE){
  return hubCanvasTex(THREE,512,352,(g,w,h)=>{
    g.fillStyle="#3f434a"; g.fillRect(0,0,w,h);
    hubNoise(g,w,h,6000,["#31353b","#50555d"],.7);
    g.strokeStyle="#f2efe4"; g.lineWidth=3;
    for(let i=0;i<=12;i++){ const x=24+i*(w-48)/12; g.beginPath(); g.moveTo(x,14); g.lineTo(x,120); g.moveTo(x,h-120); g.lineTo(x,h-14); g.stroke(); }
    g.beginPath(); g.moveTo(24,120); g.lineTo(w-24,120); g.moveTo(24,h-120); g.lineTo(w-24,h-120); g.stroke();
    g.fillStyle="#f2efe4"; g.font="bold 22px sans-serif"; g.textAlign="center";
    for(let x=60;x<w;x+=140){ g.save(); g.translate(x,h/2+8); g.fillText("⟶",0,0); g.restore(); }
  });
}
function hubPlazaTex(THREE){
  return hubCanvasTex(THREE,256,256,(g,w,h)=>{
    g.fillStyle="#d7d0c2"; g.fillRect(0,0,w,h);
    for(let y=0;y<h;y+=32) for(let x=(y/32%2)*16;x<w;x+=32){ g.fillStyle=Math.random()<.5?"#cfc7b8":"#e0d9cc"; g.fillRect(x+1,y+1,30,30); }
    hubNoise(g,w,h,1500,["#bdb5a6","#ece6da"],.4);
  },6,6);
}
// Cephe: beton kolonlar + cam paneller + kat bantları
function hubFacadeTex(THREE,rep,floors=2,glass="#20324a"){
  return hubCanvasTex(THREE,256,256,(g,w,h)=>{
    g.fillStyle="#d9d6cf"; g.fillRect(0,0,w,h);
    hubNoise(g,w,h,1600,["#c6c2b9","#ebe8e1"],.5);
    const fh=h/floors;
    for(let f=0;f<floors;f++){
      const y=f*fh+fh*0.18, gh=fh*0.66;
      const gr=g.createLinearGradient(0,y,0,y+gh); gr.addColorStop(0,"#6f93b8"); gr.addColorStop(.35,glass); gr.addColorStop(1,"#101a28");
      for(let x=0;x<w;x+=64){ g.fillStyle=gr; g.fillRect(x+12,y,40,gh); g.fillStyle="rgba(255,255,255,.18)"; g.fillRect(x+31,y,2,gh); }
    }
    g.fillStyle="rgba(0,0,0,.12)"; for(let x=0;x<w;x+=64) g.fillRect(x+8,0,3,h);
  },rep,1);
}
// Perde duvar: yansımalı koyu cam + kat çizgileri + dikmeler (kule)
function hubCurtainTex(THREE,floors,cols){
  return hubCanvasTex(THREE,256,512,(g,w,h)=>{
    const gr=g.createLinearGradient(0,0,w,h); gr.addColorStop(0,"#5a7ea6"); gr.addColorStop(.5,"#233a57"); gr.addColorStop(1,"#3c5f86");
    g.fillStyle=gr; g.fillRect(0,0,w,h);
    const fh=h/floors, cw=w/cols;
    g.fillStyle="#c9ced6"; for(let f=0;f<=floors;f++) g.fillRect(0,f*fh-3,w,6);
    g.fillStyle="rgba(200,210,222,.75)"; for(let c=0;c<=cols;c++) g.fillRect(c*cw-1.5,0,3,h);
    g.fillStyle="rgba(255,255,255,.08)"; for(let i=0;i<6;i++){ g.beginPath(); const x=Math.random()*w; g.moveTo(x,0); g.lineTo(x+40,0); g.lineTo(x-60,h); g.lineTo(x-100,h); g.fill(); }
  });
}
// Gece pencere ışıkları (emissiveMap)
function hubWindowLightTex(THREE,floors,cols,fill=0.55){
  return hubCanvasTex(THREE,256,512,(g,w,h)=>{
    g.fillStyle="#000"; g.fillRect(0,0,w,h);
    const fh=h/floors, cw=w/cols;
    for(let f=0;f<floors;f++) for(let c=0;c<cols;c++) if(Math.random()<fill){
      g.fillStyle=Math.random()<.7?"#ffd69a":"#cfe3ff"; g.fillRect(c*cw+3,f*fh+5,cw-6,fh-10);
    }
  });
}
function hubWhiteFacadeTex(THREE){
  return hubCanvasTex(THREE,256,256,(g,w,h)=>{
    g.fillStyle="#f3f4f2"; g.fillRect(0,0,w,h); hubNoise(g,w,h,900,["#e2e4e0","#ffffff"],.5);
    g.fillStyle="rgba(0,0,0,.06)"; for(let x=0;x<w;x+=32) g.fillRect(x,0,1,h);
    [[0.2,0.22],[0.6,0.22]].forEach(([yy,hh])=>{ const gr=g.createLinearGradient(0,yy*h,0,(yy+hh)*h); gr.addColorStop(0,"#7fa8cf"); gr.addColorStop(1,"#203248");
      g.fillStyle=gr; g.fillRect(0,yy*h,w,hh*h); g.fillStyle="rgba(255,255,255,.55)"; for(let x=0;x<w;x+=42) g.fillRect(x,yy*h,2,hh*h); });
  },2,1);
}
function hubTartanTex(THREE){
  return hubCanvasTex(THREE,128,128,(g,w,h)=>{ g.fillStyle="#b4452f"; g.fillRect(0,0,w,h); hubNoise(g,w,h,3000,["#9c3a27","#c95a42","#8a3221"],.8); },6,6);
}
function hubRubberTex(THREE){
  return hubCanvasTex(THREE,128,128,(g,w,h)=>{ g.fillStyle="#2b3038"; g.fillRect(0,0,w,h); hubNoise(g,w,h,3000,["#1f242b","#3a4049","#46505c"],.8);
    g.strokeStyle="rgba(255,255,255,.18)"; g.lineWidth=2; for(let x=0;x<w;x+=32){ g.beginPath(); g.moveTo(x,0); g.lineTo(x,h); g.stroke(); } },3,1.5);
}
function hubNetTex(THREE){
  const t=hubCanvasTex(THREE,64,64,(g,w,h)=>{ g.clearRect(0,0,w,h); g.strokeStyle="rgba(255,255,255,.95)"; g.lineWidth=2;
    for(let i=0;i<=w;i+=8){ g.beginPath(); g.moveTo(i,0); g.lineTo(i,h); g.moveTo(0,i); g.lineTo(w,i); g.stroke(); } },4,3);
  return t;
}
// Tribün koltukları + taraftarlar (kulüp rengi)
function hubSeatTex(THREE,col,col2){
  return hubCanvasTex(THREE,512,256,(g,w,h)=>{
    const rows=16, rh=h/rows;
    for(let r=0;r<rows;r++){
      g.fillStyle="#6b6f76"; g.fillRect(0,r*rh,w,rh);
      g.fillStyle=r%5===2?col2:(r%2?hubShade(col,0.85):col); g.fillRect(0,r*rh+rh*0.3,w,rh*0.55);
      g.fillStyle="rgba(0,0,0,.25)"; for(let x=0;x<w;x+=8) g.fillRect(x,r*rh+rh*0.3,1,rh*0.55);
    }
    const fan=["#f3d6b9","#c99a74","#8a5a3c",col,col2,"#ffffff","#222831"];
    for(let i=0;i<2600;i++){ g.fillStyle=fan[i%fan.length]; const r=Math.floor(Math.random()*rows); g.fillRect(Math.random()*w,r*rh+rh*0.15,3,rh*0.5); }
  },2,1);
}
function hubFlagTex(THREE,col,col2,ab){
  return hubCanvasTex(THREE,128,64,(g,w,h)=>{
    g.fillStyle=col; g.fillRect(0,0,w,h); g.fillStyle=col2; g.fillRect(0,h*0.38,w,h*0.24);
    g.fillStyle=col2; g.font="900 22px sans-serif"; g.textAlign="center"; g.textBaseline="middle";
    g.fillStyle="#ffffff"; g.globalAlpha=.9; g.fillText(ab,w*0.62,h*0.5);
  });
}
function hubEmblemTex(THREE,col,col2,ab){
  return hubCanvasTex(THREE,256,256,(g,w,h)=>{
    g.clearRect(0,0,w,h);
    g.beginPath(); g.moveTo(128,14); g.lineTo(230,48); g.lineTo(220,150); g.quadraticCurveTo(200,215,128,244); g.quadraticCurveTo(56,215,36,150); g.lineTo(26,48); g.closePath();
    g.fillStyle="#f8fafc"; g.fill(); g.lineWidth=10; g.strokeStyle=col2; g.stroke();
    g.save(); g.clip(); g.fillStyle=col; g.fillRect(0,0,128,256); g.fillStyle=hubShade(col,0.75); g.fillRect(128,0,128,256); g.restore();
    g.fillStyle="#ffffff"; g.font="900 64px sans-serif"; g.textAlign="center"; g.textBaseline="middle"; g.fillText(ab,128,128);
    g.font="700 22px sans-serif"; g.fillText("★ ★ ★",128,196);
  });
}
function hubBusTex(THREE,col,col2,name){
  return hubCanvasTex(THREE,512,128,(g,w,h)=>{
    g.fillStyle=col; g.fillRect(0,0,w,h);
    const gr=g.createLinearGradient(0,18,0,64); gr.addColorStop(0,"#6f8fb0"); gr.addColorStop(1,"#0d1622");
    g.fillStyle=gr; g.fillRect(40,18,w-60,46);
    g.fillStyle="rgba(255,255,255,.25)"; for(let x=40;x<w-20;x+=58) g.fillRect(x,18,3,46);
    g.fillStyle=col2; g.beginPath(); g.moveTo(0,h); g.lineTo(w*0.55,h); g.lineTo(w*0.75,70); g.lineTo(0,70); g.fill();
    g.fillStyle="#ffffff"; g.font="900 30px sans-serif"; g.textBaseline="middle"; g.fillText(String(name).toUpperCase().slice(0,22),20,98);
  });
}
// Kasaba evi cephesi (beyaz taban → instanceColor ile pastel ton) + gece pencere ışığı
function hubHouseTex(THREE){
  const win=[[0.14,0.22],[0.62,0.22],[0.14,0.58],[0.62,0.58]];
  const map=hubCanvasTex(THREE,128,128,(g,w,h)=>{
    g.fillStyle="#f4f1ea"; g.fillRect(0,0,w,h); hubNoise(g,w,h,500,["#e3ded3","#ffffff"],.5);
    win.forEach(([x,y])=>{ g.fillStyle="#fafafa"; g.fillRect(x*w-3,y*h-3,w*0.24+6,h*0.2+6);
      const gr=g.createLinearGradient(0,y*h,0,(y+0.2)*h); gr.addColorStop(0,"#7fa2c4"); gr.addColorStop(1,"#22324a"); g.fillStyle=gr; g.fillRect(x*w,y*h,w*0.24,h*0.2);
      g.fillStyle="#fafafa"; g.fillRect(x*w+w*0.115,y*h,2,h*0.2); });
    g.fillStyle="rgba(0,0,0,.18)"; g.fillRect(0,h-6,w,6);
  });
  const lit=hubCanvasTex(THREE,128,128,(g,w,h)=>{ g.fillStyle="#000"; g.fillRect(0,0,w,h);
    win.forEach(([x,y])=>{ if(Math.random()<0.6){ g.fillStyle="#ffd69a"; g.fillRect(x*w,y*h,w*0.24,h*0.2); } }); });
  return {map,lit};
}
// Kiremit çatı (açık taban → instanceColor kiremit tonları)
function hubRoofTex(THREE){
  return hubCanvasTex(THREE,128,128,(g,w,h)=>{
    g.fillStyle="#f2e6dc"; g.fillRect(0,0,w,h);
    for(let r=0;r<8;r++){ const y=r*h/8; g.fillStyle="rgba(60,20,10,.32)"; g.fillRect(0,y+h/8-3,w,3);
      for(let x=(r%2)*8;x<w;x+=16){ g.fillStyle="rgba(60,20,10,.22)"; g.fillRect(x,y,1.5,h/8); } }
    hubNoise(g,w,h,700,["#d8c4b4","#fff6ee"],.5);
  },3,2);
}
// Kırmızı-beyaz çizgili tente
function hubAwningTex(THREE){
  return hubCanvasTex(THREE,128,32,(g,w,h)=>{ for(let i=0;i<8;i++){ g.fillStyle=i%2?"#ffffff":"#dc2626"; g.fillRect(i*w/8,0,w/8,h); } });
}
// Nehir: ince dalga çizgileri (kaydırılan doku)
function hubWaterTex(THREE){
  const t=hubCanvasTex(THREE,128,256,(g,w,h)=>{
    g.fillStyle="#d8eefc"; g.fillRect(0,0,w,h);
    for(let i=0;i<120;i++){ const x=Math.random()*w, y=Math.random()*h, l=8+Math.random()*26;
      g.strokeStyle=`rgba(255,255,255,${.35+Math.random()*.5})`; g.lineWidth=1+Math.random();
      g.beginPath(); g.moveTo(x,y); g.quadraticCurveTo(x+l/2,y-3,x+l,y); g.stroke(); }
    hubNoise(g,w,h,800,["#a9d3f2","#ffffff"],.35);
  },1,1);
  t.wrapS=t.wrapT=THREE.RepeatWrapping;
  return t;
}
// Gökyüzü kubbesi (eşdikdörtgensel): gündüz bulutlu, gece yıldızlı
function hubSkyTex(THREE,light){
  return hubCanvasTex(THREE,1024,512,(g,w,h)=>{
    const gr=g.createLinearGradient(0,0,0,h);
    if(light){ gr.addColorStop(0,"#2f74c0"); gr.addColorStop(.32,"#6aa9e3"); gr.addColorStop(.47,"#d6e7f2"); gr.addColorStop(.5,"#ebe9df"); gr.addColorStop(.52,"#dfe7ea"); gr.addColorStop(1,"#cdd9df"); }
    else { gr.addColorStop(0,"#02050d"); gr.addColorStop(.35,"#08132a"); gr.addColorStop(.49,"#1d2f52"); gr.addColorStop(.52,"#0e1930"); gr.addColorStop(1,"#0a1222"); }
    g.fillStyle=gr; g.fillRect(0,0,w,h);
    // Güneş / ay: HUB_SUN_DIR yönünün küre UV'si (SphereGeometry: x=−cosφ·sinθ, z=sinφ·sinθ; u=φ/2π, tuval y=θ/π·h)
    {const d=light?HUB_SUN_DIR.day:HUB_SUN_DIR.night, L=Math.hypot(...d);
      let ph=Math.atan2(d[2],-d[0]); if(ph<0) ph+=Math.PI*2;
      const sx=ph/(Math.PI*2)*w, sy=Math.acos(d[1]/L)/Math.PI*h;
      const glow=(x,y,r,stops)=>[-w,0,w].forEach(o=>{ const cg=g.createRadialGradient(x+o,y,0,x+o,y,r); stops.forEach(([p,c])=>cg.addColorStop(p,c)); g.fillStyle=cg; g.fillRect(x+o-r,y-r,2*r,2*r); });
      if(light){
        glow(sx,h*0.49,300,[[0,"rgba(255,206,150,.32)"],[1,"rgba(255,206,150,0)"]]);         // ufukta sıcak ikindi pusu
        glow(sx,sy,140,[[0,"rgba(255,236,200,.85)"],[.12,"rgba(255,220,170,.5)"],[1,"rgba(255,210,160,0)"]]);
        glow(sx,sy,10,[[0,"rgba(255,252,240,1)"],[.7,"rgba(255,246,220,1)"],[1,"rgba(255,240,210,0)"]]);
      } else {
        glow(sx,sy,90,[[0,"rgba(180,200,255,.35)"],[1,"rgba(160,185,255,0)"]]);              // ay halesi
        glow(sx,sy,9,[[0,"rgba(240,245,255,1)"],[.8,"rgba(226,234,250,1)"],[1,"rgba(220,230,250,0)"]]);
        [[-2,-2,2.2],[2.5,1.5,1.6],[-1,3,1.2]].forEach(([dx,dy,r])=>{ g.fillStyle="rgba(170,182,205,.55)"; g.beginPath(); g.arc(sx+dx,sy+dy,r,0,7); g.fill(); });
      }
    }
    if(light){
      for(let i=0;i<70;i++){ const x=Math.random()*w, y=h*(0.12+Math.random()*0.34), r=20+Math.random()*60;
        const cg=g.createRadialGradient(x,y,1,x,y,r); cg.addColorStop(0,"rgba(255,255,255,.55)"); cg.addColorStop(1,"rgba(255,255,255,0)");
        g.fillStyle=cg; g.save(); g.translate(x,y); g.scale(2.4,0.7); g.translate(-x,-y); g.beginPath(); g.arc(x,y,r,0,7); g.fill(); g.restore(); }
    } else {
      for(let i=0;i<700;i++){ g.fillStyle=`rgba(255,255,255,${0.3+Math.random()*0.7})`; const s=Math.random()<.08?2:1; g.fillRect(Math.random()*w,Math.random()*h*0.47,s,s); }
      const hg=g.createLinearGradient(0,h*0.42,0,h*0.5); hg.addColorStop(0,"rgba(255,170,90,0)"); hg.addColorStop(1,"rgba(255,170,90,.18)"); g.fillStyle=hg; g.fillRect(0,h*0.42,w,h*0.08);
    }
  });
}

// ── .glb yükleme (GLTFLoader + assets3d önbellekli tampon) ─────
// Kenney kitleri dokuyu harici "Textures/colormap.png" olarak ister; dosya pakette yok ve r128 GLTFLoader eksik
// dokuda TÜM ayrıştırmayı reddeder. GLB'nin JSON parçasından harici görselleri çıkarır; dokusu düşen malzemeyi
// extras.hubAtlas ile işaretler (→ material.userData.hubAtlas) → çağıran prosedürel palet atlasını takar.
function hubGlbStripExternal(buf){
  try{
    const dv=new DataView(buf);
    if(buf.byteLength<20||dv.getUint32(0,true)!==0x46546C67||dv.getUint32(16,true)!==0x4E4F534A) return buf;
    const jLen=dv.getUint32(12,true);
    const json=JSON.parse(new TextDecoder().decode(new Uint8Array(buf,20,jLen)));
    const imgs=json.images||[], ext=imgs.map(im=>!!(im.uri&&!/^data:/i.test(im.uri)));
    if(!ext.some(Boolean)) return buf;
    let ni=0; const imgMap=imgs.map((im,i)=>ext[i]?-1:ni++);
    const texs=json.textures||[]; let nt=0; const texMap=texs.map(t=>imgMap[t.source]>=0?nt++:-1);
    json.images=imgs.filter((im,i)=>!ext[i]);
    json.textures=texs.filter((t,i)=>texMap[i]>=0).map(t=>Object.assign({},t,{source:imgMap[t.source]}));
    const fix=(o,key,mat)=>{ if(!o||!o[key]) return; const n=texMap[o[key].index];
      if(n>=0) o[key].index=n; else { delete o[key]; if(key==="baseColorTexture") mat.extras=Object.assign({},mat.extras,{hubAtlas:true}); } };
    (json.materials||[]).forEach(m=>{ const pb=m.pbrMetallicRoughness; fix(pb,"baseColorTexture",m); fix(pb,"metallicRoughnessTexture",m);
      ["normalTexture","occlusionTexture","emissiveTexture"].forEach(key=>fix(m,key,m)); });
    if(!json.images.length) delete json.images;
    if(!json.textures.length){ delete json.textures; delete json.samplers; }
    const js=new TextEncoder().encode(JSON.stringify(json)), pad=(4-js.length%4)%4;
    const rest=new Uint8Array(buf,20+jLen);                   // ikili (BIN) parça olduğu gibi
    const out=new Uint8Array(20+js.length+pad+rest.length), o=new DataView(out.buffer);
    o.setUint32(0,0x46546C67,true); o.setUint32(4,2,true); o.setUint32(8,out.length,true);
    o.setUint32(12,js.length+pad,true); o.setUint32(16,0x4E4F534A,true);
    out.set(js,20); out.fill(0x20,20+js.length,20+js.length+pad); out.set(rest,20+js.length+pad);
    return out.buffer;
  }catch(e){ return buf; }
}
// opts.strip: harici dokuları çıkar (Kenney paletli modeller). Dönen grubun mesh'leri: userData.atlas = palet ister
function hubLoadGlb(THREE,name,isAlive,opts){
  if(typeof loadGltfLoader!=="function"||typeof assets3dBuffer!=="function") return Promise.resolve(null);
  return Promise.all([loadGltfLoader(),assets3dBuffer(name)]).then(([Loader,buf])=>new Promise(res=>{
    if(!Loader||!buf||!isAlive()) return res(null);
    try{
      const src=opts&&opts.strip?hubGlbStripExternal(buf):buf;
      new Loader().parse(src===buf?buf.slice(0):src,HUB_MODEL_DIR,gl=>{
        const root=gl&&(gl.scene||(gl.scenes&&gl.scenes[0]));
        if(!root) return res(null);
        root.updateMatrixWorld(true);
        const out=new THREE.Group();
        root.traverse(m=>{ if(m.isMesh){ const gg=m.geometry.clone(); gg.applyMatrix4(m.matrixWorld);
          const mm=new THREE.Mesh(gg,m.material); mm.castShadow=true; mm.receiveShadow=true;
          mm.userData.atlas=!!(m.material&&m.material.userData&&m.material.userData.hubAtlas); out.add(mm); m.geometry.dispose(); } });
        if(!isAlive()){ out.traverse(m=>{ if(m.geometry) m.geometry.dispose(); }); return res(null); }
        res(out);
      },()=>res(null));
    }catch(e){ res(null); }
  })).catch(()=>null);
}
// Grubu ölçeklemeden tabana oturtur: xz merkezi 0, alt yüz y=0 (Kenney evleri: ham glb birimi korunur)
function hubCenterBase(THREE,g){
  const b=new THREE.Box3().setFromObject(g), c=new THREE.Vector3(); b.getCenter(c);
  g.children.forEach(o=>{ if(o.geometry){ o.geometry.translate(-c.x,-b.min.y,-c.z); o.geometry.computeBoundingBox(); o.geometry.computeBoundingSphere(); } });
  return g;
}
function hubFit(THREE,g,size){
  const b=new THREE.Box3().setFromObject(g), s=new THREE.Vector3(), c=new THREE.Vector3();
  b.getSize(s); b.getCenter(c);
  const ks=[0,1,2].map(i=>size[i]&&s.getComponent(i)>1e-6?size[i]/s.getComponent(i):null);
  const kd=Math.max(...ks.filter(v=>v!=null))||1;
  const k=ks.map(v=>v==null?kd:v);
  const m=new THREE.Matrix4().makeTranslation(-c.x*k[0],-b.min.y*k[1],-c.z*k[2]).multiply(new THREE.Matrix4().makeScale(k[0],k[1],k[2]));
  g.children.forEach(o=>{ if(o.geometry){ o.geometry.applyMatrix4(m); o.geometry.computeBoundingSphere(); o.geometry.computeBoundingBox(); } });
  return g;
}

function ClubHub3D({squad=[],youth=[],season,fans,rep,transferBudget=0,clubName="",onNavigate=()=>{}}){
  const mode=useThemeMode();
  const light=mode==="light";
  const hostRef=useRef(null);
  const badgeRefs=useRef({});
  const apiRef=useRef(null);           // sahne ile iletişim: focus(id), applyTone(light)
  const clubRef=useRef(clubName); clubRef.current=clubName;
  const [sel,setSel]=useState(null);
  const [ready,setReady]=useState(false);
  const [failed,setFailed]=useState(false);

  // ── Sahne kurulumu (bir kez) ─────────────────────────────────
  useEffect(()=>{
    let disposed=false, raf=0, renderer=null, scene=null, ro=null, pmrem=null, envRT=null;
    const isAlive=()=>!disposed;
    const host=hostRef.current;
    if(!host) return;
    if(typeof loadThreeJs!=="function"){ setFailed(true); return; }
    loadThreeJs().then(THREE=>{
      if(disposed||!THREE) return;
      try{ renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:"low-power"}); }
      catch(e){ setFailed(true); return; }
      let dirty=true;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));
      renderer.outputEncoding=THREE.sRGBEncoding;
      renderer.toneMapping=THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure=1.05;
      renderer.physicallyCorrectLights=false;
      renderer.shadowMap.enabled=true;
      renderer.shadowMap.type=THREE.PCFSoftShadowMap;
      renderer.shadowMap.autoUpdate=false;           // statik gölge: yalnız sahne değişince
      const shadowDirty=()=>{ renderer.shadowMap.needsUpdate=true; dirty=true; };
      const cv=renderer.domElement;
      cv.style.cssText="position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none";
      host.insertBefore(cv,host.firstChild);
      pmrem=new THREE.PMREMGenerator(renderer);

      // Kulüp renkleri (TEAM_BADGE)
      const badge=(typeof getTeamBadge==="function"?getTeamBadge(clubRef.current):null)||{bg:"#1d4ed8",tx:"#ffffff",ab:"FC"};
      const col1=badge.bg||"#1d4ed8", col2=(badge.tx&&badge.tx.toLowerCase()!==String(col1).toLowerCase())?badge.tx:"#ffffff", ab=(badge.ab||"FC").slice(0,3);
      const col1Hex=new THREE.Color(col1).getHex();

      scene=new THREE.Scene();
      scene.fog=new THREE.FogExp2(0xd3e7f6,0.0042);
      const camera=new THREE.PerspectiveCamera(34,1,0.5,700);
      const camPos=new THREE.Vector3(...HUB_OVERVIEW.cam), camLook=new THREE.Vector3(...HUB_OVERVIEW.look);
      let distK=1, curId=null, fogBase=0.0042;
      const tgtPos=camPos.clone(), tgtLook=camLook.clone();
      camera.position.copy(camPos); camera.lookAt(camLook);

      // ── Gökyüzü kubbesi ──
      const skyTex={light:null,dark:null};
      const skyMat=new THREE.MeshBasicMaterial({side:THREE.BackSide,fog:false,depthWrite:false});
      const sky=new THREE.Mesh(new THREE.SphereGeometry(500,48,24),skyMat); sky.renderOrder=-1; scene.add(sky);
      const envScene=new THREE.Scene(); const envSky=new THREE.Mesh(sky.geometry,skyMat); envScene.add(envSky);

      // ── Işıklar: tek ana yönlü ışık (gündüz ikindi güneşi / gece ay) + HemisphereLight gök/çim dolgusu ──
      // Mobil: gölge haritası en fazla 1024² (PCFSoft, r128'de radius etkisiz → yumuşaklık filtreden), statik
      // (yalnız sahne / tema değişince yeniden çizilir). Kamera kampüsü kapsar; dışında decal gölge + zemin AO.
      const hemi=new THREE.HemisphereLight(0xc6dcf7,0x667a36,0.5); scene.add(hemi);
      const sun=new THREE.DirectionalLight(0xffc88e,2.0);
      sun.target.position.set(...HUB_SUN_TGT);
      sun.castShadow=true; sun.shadow.mapSize.set(1024,1024);
      Object.assign(sun.shadow.camera,{left:-HUB_SHADOW_R,right:HUB_SHADOW_R,top:HUB_SHADOW_R,bottom:-HUB_SHADOW_R,near:5,far:220});
      sun.shadow.bias=-0.0006; sun.shadow.normalBias=0.04;
      const placeSun=d=>{ sun.position.set(HUB_SUN_TGT[0]+d[0],HUB_SUN_TGT[1]+d[1],HUB_SUN_TGT[2]+d[2]); sun.shadow.camera.updateProjectionMatrix(); };
      placeSun(HUB_SUN_DIR.day);
      scene.add(sun); scene.add(sun.target);
      // Stadyum projektörleri: yalnız gece görünür (gündüz sahnede yalnız güneş + hemisphere kalır)
      const floods=[];
      [[-10,9,-16],[10,9,-16],[-10,9,-4],[10,9,-4]].forEach(p=>{
        const l=new THREE.PointLight(0xeaf2ff,0,42,1.3); l.position.set(...p); l.visible=false; scene.add(l); floods.push(l);
      });
      let curTone=hubSceneTone(true);       // sonradan yüklenen modellerin malzemeleri bu tona göre ayarlanır

      // ── Malzemeler ──
      const M=(c,o={})=>new THREE.MeshStandardMaterial({color:c,roughness:0.85,metalness:0,...o});
      const T={grass:hubGrassTex(THREE),pitch:hubPitchTex(THREE),park:hubParkingTex(THREE),plaza:hubPlazaTex(THREE)};
      const mGround=M(0xffffff,{map:T.grass,bumpMap:T.grass,bumpScale:0.5,roughness:0.94}), mPitch=M(0xffffff,{map:T.pitch,roughness:0.95}), mPark=M(0xffffff,{map:T.park});
      // Zemin: çim detay dokusu × makro doku (tüm daireyi bir kez kaplar; doğal geçiş + AO). Makro, yerleşim
      // (nehir, ağaçlar, binalar) belli olunca aşağıda üretilir; ilk render'dan önce hazırdır.
      const groundMacro={value:null};
      mGround.onBeforeCompile=sh=>{
        sh.uniforms.hubMacro=groundMacro;
        sh.vertexShader=sh.vertexShader.replace("#include <common>","#include <common>\nvarying vec2 vHubMacro;")
          .replace("#include <begin_vertex>","#include <begin_vertex>\nvHubMacro=vec2(position.x,-position.y)/520.0+0.5;");
        sh.fragmentShader=sh.fragmentShader.replace("#include <common>","#include <common>\nuniform sampler2D hubMacro;\nvarying vec2 vHubMacro;")
          .replace("#include <map_fragment>","#include <map_fragment>\ndiffuseColor.rgb*=texture2D(hubMacro,vHubMacro).rgb*2.0;");
      };
      const mPlaza=M(0xffffff,{map:T.plaza,roughness:0.9});
      const mConcrete=M(0xd3cfc6,{roughness:0.92}), mConcreteDark=M(0x8d8a84,{roughness:0.95});
      const mSteel=M(0xb8c0cb,{metalness:0.85,roughness:0.32}), mSteelDark=M(0x4b5563,{metalness:0.8,roughness:0.4});
      const mWhite=M(0xf5f6f4,{roughness:0.6}), mPost=M(0xffffff,{roughness:0.35,metalness:0.1});
      const mGlass=M(0x8fb3d4,{metalness:0.6,roughness:0.08,transparent:true,opacity:0.45,depthWrite:false});
      const mMembrane=M(0xdfe4ea,{roughness:0.6,metalness:0.1,transparent:true,opacity:0.82});
      const mLed=new THREE.MeshStandardMaterial({color:col1Hex,emissive:col1Hex,emissiveIntensity:1.4,roughness:0.4});
      const mLamp=M(0xfff6d8,{emissive:0xfff0c2,emissiveIntensity:0});
      const mCone=M(0xf97316,{roughness:0.6}), mDummy=M(0xfacc15,{roughness:0.55}), mRed=M(0xdc2626,{roughness:0.5});
      const mTyre=M(0x1f2328,{roughness:0.9}), mWater=M(0x5aa7d6,{metalness:0.2,roughness:0.05,transparent:true,opacity:0.85});
      const mNet=new THREE.MeshStandardMaterial({color:0xffffff,map:hubNetTex(THREE),transparent:true,alphaTest:0.35,side:THREE.DoubleSide,roughness:0.8});
      const winMats=[];                      // gece pencere ışığı alan malzemeler
      const add=(geo,mat,x,y,z,parent=scene,o={})=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);
        m.castShadow=o.cast!==false; m.receiveShadow=o.recv!==false; parent.add(m); return m;};
      const box=(w,h,d,mat,x,y,z,parent,o)=>add(new THREE.BoxGeometry(w,h,d),mat,x,y,z,parent,o);
      const flat=(w,d,mat,x,y,z,parent=scene,ry=0)=>{const m=add(new THREE.PlaneGeometry(w,d),mat,x,y,z,parent,{cast:false});m.rotation.x=-Math.PI/2;m.rotation.z=ry;return m;};

      // ── Zemin, yollar, plazalar ──
      const ground=add(new THREE.CircleGeometry(260,48),mGround,0,0,0,scene,{cast:false}); ground.rotation.x=-Math.PI/2;
      // Asfalt: polygonOffset + katman başına farklı y/units → üst üste binen yollarda z-fighting yok
      const mAsphalt=(map,units)=>M(0xffffff,{map,roughness:0.95,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:units});
      const road=(x,z,w,len,ry,y=0.03,units=-1)=>flat(w,len,mAsphalt(hubRoadTex(THREE,Math.max(1,Math.round(len/w/2.5))),units),x,y,z,scene,ry);
      road(-1,14.5,4.6,70,Math.PI/2);                  // yatay cadde (alt katman)
      road(0,22.5,5,39,0,0.031,-2);                    // ana bulvar (arena → çevre yolu)
      road(-15,20.5,3.6,12,0,0.031,-2);                // akademi bağlantısı
      road(17,17,3.6,5,0,0.031,-2);                    // kulüp plazası bağlantısı
      road(10,6.75,3.6,15.5,0,0.031,-2);               // sağlık merkezi bağlantısı
      // Kavşak kareleri: şeritleri keser, en üst katman (y + 0.002)
      {const mJ=M(0xffffff,{map:hubAsphaltTex(THREE),roughness:0.95,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-4});
        [[0,14.5,5,4.6],[-15,14.5,3.6,4.6],[17,14.5,3.6,4.6],[10,14.5,3.6,4.6],   // cadde kavşakları
         [0,44,5,4.6],[-37,14.5,4.6,4.6],[35,14.5,4.6,4.6]]                      // çevre yolu bağlantıları
          .forEach(([x,z,w,d])=>flat(w,d,mJ,x,0.034,z));
      }
      // Taş bordürler (açık gri) + kenar çalıları
      const mCurb=M(0xcfcfca,{roughness:0.9});
      const curbZ=(x,z0,z1)=>box(0.22,0.12,z1-z0,mCurb,x,0.06,(z0+z1)/2,scene,{cast:false});
      const curbX=(z,x0,x1)=>box(x1-x0,0.12,0.22,mCurb,(x0+x1)/2,0.06,z,scene,{cast:false});
      const curbFrame=(x0,z0,x1,z1,gaps={})=>{ // gaps: {n:[[x0,x1]..], s:.., w:[[z0,z1]..], e:..}
        const run=(a,b,gs,fn)=>{ let s=a; (gs||[]).slice().sort((p,q)=>p[0]-q[0]).forEach(([g0,g1])=>{ if(g0>s) fn(s,g0); s=Math.max(s,g1); }); if(b>s) fn(s,b); };
        run(x0,x1,gaps.n,(a,b)=>curbX(z0,a,b)); run(x0,x1,gaps.s,(a,b)=>curbX(z1,a,b));
        run(z0,z1,gaps.w,(a,b)=>curbZ(x0,a,b)); run(z0,z1,gaps.e,(a,b)=>curbZ(x1,a,b)); };
      [-2.6,2.6].forEach(x=>{ curbZ(x,6,12.2); curbZ(x,16.8,41.6); });          // bulvar
      [[-34.6,-2.6],[2.6,8.1],[11.9,32.6]].forEach(([a,b])=>curbX(12.09,a,b));   // cadde kuzey
      [[-34.6,-16.9],[-13.1,-2.6],[2.6,15.1],[18.9,32.6]].forEach(([a,b])=>curbX(16.91,a,b)); // cadde güney
      [-16.9,-13.1].forEach(x=>curbZ(x,16.8,22));                                // akademi bağlantısı
      [15.1,18.9].forEach(x=>curbZ(x,16.8,19));                                  // plaza bağlantısı
      [8.1,11.9].forEach(x=>curbZ(x,6,12.2));                                    // sağlık bağlantısı
      curbFrame(-18,-24,18,6,{s:[[-2.6,2.6],[8.1,11.9]],e:[[-18.75,-7.25]]});   // arena esplanadı
      curbFrame(10,19,24,35,{n:[[15.1,18.9]]});                                  // kulüp plazası
      const edgeBushPts=[];                                                      // aşağıdaki çalı örneklemesine eklenir
      const shrub=(x,z,s=0.5)=>edgeBushPts.push([x+(Math.random()-.5)*0.3,z+(Math.random()-.5)*0.3,s*(0.8+Math.random()*0.4),Math.random()*6.28]);
      for(let x=-34;x<=32;x+=3.4) if(x<-17.5||(x>-12.5&&x<-8)||(x>8&&x<14.5)||x>19.5) shrub(x,18.0);
      for(let x=13;x<=31;x+=3.4) shrub(x,11.0);
      for(let x=-12;x<=-8;x+=2) shrub(x,11.0);
      for(let z=-22;z<=1;z+=3.2) shrub(-19,z,0.55);
      for(let x=-16;x<=16;x+=3.2) shrub(x,-25,0.55);
      for(let z=20.5;z<=34;z+=2.7){ shrub(9,z,0.45); shrub(25,z,0.45); }
      for(let x=11;x<=23;x+=2.4) shrub(x,36,0.45);
      flat(17,11.5,mPark,23,0.035,-13);    // otopark
      flat(36,30,mPlaza,0,0.02,-9);        // arena esplanadı
      flat(14,16,mPlaza,17,0.025,27);      // kulüp plazası

      // Çevre yolu (kapalı eğri üzerinde şerit) — otobüs bu yolda döner
      const ringPts=[]; const RX0=-37,RX1=35,RZ0=-30,RZ1=44,RR=9;
      const corner=(cx,cz,a0)=>{ for(let i=0;i<=6;i++){ const a=a0+i/6*Math.PI/2; ringPts.push(new THREE.Vector3(cx+Math.cos(a)*RR,0,cz+Math.sin(a)*RR)); } };
      corner(RX1-RR,RZ0+RR,-Math.PI/2); corner(RX1-RR,RZ1-RR,0); corner(RX0+RR,RZ1-RR,Math.PI/2); corner(RX0+RR,RZ0+RR,Math.PI);
      const ring=new THREE.CatmullRomCurve3(ringPts,true,"centripetal");
      {const N=220, W=4.6, pos=[], uv=[], idx=[]; const up=new THREE.Vector3(0,1,0), nrm=new THREE.Vector3(); let acc=0, prev=null;
        for(let i=0;i<=N;i++){ const u=i/N, p=ring.getPointAt(u%1), tg=ring.getTangentAt(u%1); nrm.crossVectors(up,tg).normalize();
          if(prev) acc+=p.distanceTo(prev); prev=p.clone();
          pos.push(p.x+nrm.x*W/2,0.032,p.z+nrm.z*W/2, p.x-nrm.x*W/2,0.032,p.z-nrm.z*W/2);
          uv.push(0,acc/(W*2.5),1,acc/(W*2.5));
          if(i<N){ const a=i*2; idx.push(a,a+2,a+1,a+1,a+2,a+3); } }
        const gg=new THREE.BufferGeometry(); gg.setAttribute("position",new THREE.Float32BufferAttribute(pos,3)); gg.setAttribute("uv",new THREE.Float32BufferAttribute(uv,2));
        gg.setIndex(idx); gg.computeVertexNormals();
        const rt=hubRoadTex(THREE,1); const rm=add(gg,mAsphalt(rt,-1),0,0,0,scene,{cast:false});
        if(gg.attributes.normal.array[1]<0){ gg.index.array.reverse(); gg.computeVertexNormals(); }
        rm.material.side=THREE.DoubleSide;
        // Çevre yolu bordürleri (instanced); bağlantı ağızlarında iç kenar açık bırakılır
        const NC=170, junc=[[0,44],[-37,14.5],[35,14.5]], outJ=[[0,44],[-37,14.5],[35,14.5],[0,-30]], m4=new THREE.Matrix4(), q=new THREE.Quaternion(), sc=new THREE.Vector3(), pp=new THREE.Vector3(), up2=new THREE.Vector3(0,1,0), mats=[];
        for(let i=0;i<NC;i++){ const u0=i/NC, u1=(i+1)/NC, a=ring.getPointAt(u0), b=ring.getPointAt(u1%1), tg=b.clone().sub(a), len=tg.length(); tg.normalize();
          const nx=-tg.z, nz=tg.x, mx=(a.x+b.x)/2, mz=(a.z+b.z)/2;
          [-1,1].forEach(s=>{ const x=mx+nx*s*2.42, z=mz+nz*s*2.42;
            const inner=Math.hypot(x+1,z-7)<Math.hypot(mx+1,mz-7);
            if(inner&&junc.some(([jx,jz])=>Math.hypot(x-jx,z-jz)<3.4)) return;
            if(!inner&&outJ.some(([jx,jz])=>Math.hypot(x-jx,z-jz)<3.6)) return;   // kasabaya çıkan yolların ağzı
            q.setFromAxisAngle(up2,Math.atan2(tg.x,tg.z)); sc.set(1,1,len+0.04); pp.set(x,0.06,z); mats.push(m4.compose(pp,q,sc).clone()); }); }
        const ci=new THREE.InstancedMesh(new THREE.BoxGeometry(0.22,0.12,1),mCurb,mats.length); ci.receiveShadow=true;
        mats.forEach((m,i)=>ci.setMatrixAt(i,m)); scene.add(ci);
      }
      // ═══ NEHİR + TAŞ KÖPRÜ ═══
      const R=(a,b)=>a+Math.random()*(b-a);
      const nearRing=(x,z,m)=>x>RX0-m&&x<RX1+m&&z>RZ0-m&&z<RZ1+m;
      const river=new THREE.CatmullRomCurve3(HUB_RIVER.map(([x,z])=>new THREE.Vector3(x,0,z)),false,"centripetal");
      const riverPts=river.getSpacedPoints(180);
      const riverDist=(x,z)=>{ let d=1e9; for(const p of riverPts){ const q=(p.x-x)*(p.x-x)+(p.z-z)*(p.z-z); if(q<d) d=q; } return Math.sqrt(d); };
      const waterTex=hubWaterTex(THREE);
      {const ribbon=(W,y,mat,vRep)=>{ const N=200, pos=[], uv=[], idx=[], up=new THREE.Vector3(0,1,0), nrm=new THREE.Vector3(), p=new THREE.Vector3(), tg=new THREE.Vector3(); let acc=0, px=null, pz=null;
          for(let i=0;i<=N;i++){ const u=i/N; river.getPointAt(u,p); river.getTangentAt(u,tg); nrm.crossVectors(up,tg).normalize();
            if(px!==null) acc+=Math.hypot(p.x-px,p.z-pz); px=p.x; pz=p.z;
            pos.push(p.x+nrm.x*W/2,y,p.z+nrm.z*W/2, p.x-nrm.x*W/2,y,p.z-nrm.z*W/2); uv.push(0,acc/vRep,1,acc/vRep);
            if(i<N){ const a=i*2; idx.push(a,a+2,a+1,a+1,a+2,a+3); } }
          const gg=new THREE.BufferGeometry(); gg.setAttribute("position",new THREE.Float32BufferAttribute(pos,3)); gg.setAttribute("uv",new THREE.Float32BufferAttribute(uv,2));
          gg.setIndex(idx); gg.computeVertexNormals();
          if(gg.attributes.normal.array[1]<0){ gg.index.array.reverse(); gg.computeVertexNormals(); }
          const m=add(gg,mat,0,0,0,scene,{cast:false}); m.frustumCulled=false; return m; };
        ribbon(HUB_RIVER_W+5,0.045,M(0x9c8a62,{roughness:1}),20);                                   // kumlu kıyı
        ribbon(HUB_RIVER_W,0.07,new THREE.MeshStandardMaterial({color:0x2f97ea,map:waterTex,metalness:0.55,roughness:0.06,
          emissive:0x0b4f8c,emissiveIntensity:0.22}),HUB_RIVER_W*2);                                  // parlak mavi su
        // Kemerli taş köprü (batı yolu nehri z=14.5'te geçer)
        const BX=-58, BZ=14.5, L=13, BH=1.5, BW=6.4, mStone=M(0xb9b0a0,{roughness:0.95});
        const s=new THREE.Shape(); s.moveTo(-L,0); s.lineTo(-L+5,BH); s.lineTo(L-5,BH); s.lineTo(L,0); s.lineTo(6.4,0); s.quadraticCurveTo(0,1.9,-6.4,0); s.lineTo(-L,0);
        const bg=new THREE.ExtrudeGeometry(s,{depth:BW,bevelEnabled:false,curveSegments:10}); bg.translate(0,0,-BW/2);
        add(bg,mStone,BX,0,BZ);
        box(2*(L-5),0.03,4.6,M(0xffffff,{map:hubAsphaltTex(THREE),roughness:0.95}),BX,BH+0.015,BZ,scene,{cast:false}); // köprü asfaltı
        [-1,1].forEach(sz=>{ box(2*(L-5),0.5,0.3,mStone,BX,BH+0.25,BZ+sz*(BW/2-0.15));
          [-1,1].forEach(sx=>{ const p=box(Math.hypot(5,BH),0.5,0.3,mStone,BX+sx*(L-2.5),BH/2+0.25,BZ+sz*(BW/2-0.15)); p.rotation.z=-sx*Math.atan2(BH,5); }); });
      }

      // ═══ KASABA: sokaklar, Kenney banliyö evleri, bahçe çitleri, apartmanlar ═══
      // Ev parselleri modelin gerçek taban izine göre BURADA planlanır (ağaç yerleşimi ve zemin makro dokusu bunları
      // kullanır); modeller aşağıda ("ÇEVRE MODELLERİ") yüklenince tip × renk × bölge başına instanced çizilir.
      // Hiçbir ev modeli yüklenemezse aynı parsellere eski prosedürel kiremit çatılı evler çizilir.
      const houses=[], apts=[], townLamps=[], townRoads=[], fencePts=[], gardenCand=[];
      let buildProcHouses=null;                                                        // yedek evler (aşağıda tanımlanır)
      const onRoad=(x,z,ex,ez)=>townRoads.some(([cx,cz,w,len,ry])=>ry?(Math.abs(x-cx)<len/2+ex&&Math.abs(z-cz)<w/2+ez+0.8):(Math.abs(z-cz)<len/2+ez&&Math.abs(x-cx)<w/2+ex+0.8));
      const lotHit=(x,z,ex,ez)=>houses.some(h=>Math.abs(x-h.x)<h.hx+ex+0.1&&Math.abs(z-h.z)<h.hz+ez+0.1)||apts.some(h=>Math.abs(x-h.x)<h.hx+ex+0.6&&Math.abs(z-h.z)<h.hz+ez+0.6);
      const lotOK=(x,z,ex,ez)=>{ const r=Math.max(ex,ez); return !nearRing(x,z,6+r)&&riverDist(x,z)>HUB_RIVER_W/2+3+r&&Math.hypot(x,z-7)<228&&!onRoad(x,z,ex,ez)&&!lotHit(x,z,ex,ez); };
      const streets=[ // [cx,cz,genişlik,uzunluk,yön(0=z boyunca, π/2=x boyunca), apartman olasılığı, bölge(0 batı,1 kuzey,2 doğu,3 güney)]
        [-96,14.5,5,114,Math.PI/2,0.1,0],[-100,14.5,3.8,110,0,0,0],[-128,14.5,3.8,90,0,0.15,0],   // batı (nehrin ötesi, köprülü)
        [0,82,5,76,0,0,1],[5,84,3.8,100,Math.PI/2,0,1],                                            // kuzey (yalnız ev)
        [85,14.5,5,100,Math.PI/2,0,2],[80,14.5,3.8,110,0,0,2],[112,10,3.8,80,0,0,2],                // doğu (yalnız ev)
        [0,-68,5,76,0,0,3],[0,-72,3.8,110,Math.PI/2,0,3]];                                         // güney = varsayılan kamerada arka (yalnız ev)
      streets.forEach(([cx,cz,w,len,ry])=>townRoads.push([cx,cz,w,len,ry]));
      {const mJ=M(0xffffff,{map:hubAsphaltTex(THREE),roughness:0.95,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-4});
        flat(4.6,4.6,mJ,0,0.034,-30); }                                                   // güney çevre yolu ağzı
      const typeW=HUB_HOUSE_TYPES.reduce((a,t)=>a+t.w,0);
      const pickType=()=>{ let r=Math.random()*typeW; for(let i=0;i<HUB_HOUSE_TYPES.length;i++){ r-=HUB_HOUSE_TYPES[i].w; if(r<0) return i; } return 0; };
      const FENCE_L=1.49;                                                               // ölçeklenmiş çit parçası boyu (m)
      streets.forEach(([cx,cz,w,len,ry,pApt,reg])=>{
        road(cx,cz,w,len,ry,w<4?0.029:0.03,w<4?-1:-2);
        const alongX=!!ry, ang=alongX?0:Math.PI/2;
        const P=(t,o)=>alongX?[cx+t,cz+o]:[cx+o,cz+t];                                  // sokak boyu t, dik ofset o → dünya
        for(let t=-len/2+6,i=0;t<len/2;t+=15,i++){ const s=i%2?1:-1, off=w/2+0.9;      // sokak lambaları
          const [x,z]=P(t,s*off);
          if(!nearRing(x,z,4)&&riverDist(x,z)>HUB_RIVER_W/2+1.5) townLamps.push([x,z,alongX?s*Math.PI/2:(s>0?Math.PI:0)]); }
        [-1,1].forEach(s=>{ let t=-len/2+3;
          while(t<len/2-3){
            if(Math.random()<pApt){                                                     // apartman
              const W=R(8,10.5), D=R(8,10), off=w/2+1.6+D/2, cAl=t+W/2, [x,z]=P(cAl,s*off);
              const ex=alongX?W/2:D/2, ez=alongX?D/2:W/2;
              if(t+W<len/2-2&&lotOK(x,z,ex,ez)) apts.push({x,z,w:W,d:D,fl:Math.random()<0.5?4:6,ang,hx:ex,hz:ez});
              t+=W+R(2,4)+(Math.random()<0.12?R(3,6):0); continue; }
            // Ev: tip, 90° katı yön (çoğu sokağa bakar; bir kısmı yan / ters döner), ölçek, renk varyantı
            const ty=pickType(), T=HUB_HOUSE_TYPES[ty];
            const qr=Math.random(), q=qr<0.55?0:qr<0.725?1:qr<0.9?-1:2;
            const big=reg!==0;                                                          // apartmansız bölgeler: daha büyük ev + geniş bahçe, hep çitli
            const k=R(4.4,5.4)*(T.fx>1.6?0.9:1)*(big?1.22:1);
            const W=((q&1)?T.fz:T.fx)*k, D=((q&1)?T.fx:T.fz)*k;                         // sokak boyunca genişlik / derinlik
            const yard=R(1.4,2.4)*(big?1.3:1), off=w/2+1.2+yard+D/2, cAl=t+W/2, [x,z]=P(cAl,s*off);
            const ex=alongX?W/2:D/2, ez=alongX?D/2:W/2;
            if(t+W<len/2-2&&lotOK(x,z,ex,ez)){
              const base=alongX?(s>0?0:Math.PI):s*Math.PI/2;                              // model −z (ön) → sokağa
              houses.push({x,z,w:W,d:D,h:R(3.2,4.6),rh:R(1.5,2.3),ang,hx:ex,hz:ez,ty,k,yaw:base+q*Math.PI/2,reg,vr:(Math.random()*HUB_HOUSE_PAL.length)|0,hgt:T.hy*k});
              // Bahçe çiti (%70, büyük evli bölgelerde hep): sokak tarafında kapı boşluklu ön çit + sağ komşu sınırında ön bahçe boyunca yan çit
              if(big||Math.random()<0.7){
                const fo=s*(w/2+1.35), n=Math.max(2,Math.round((W+0.6)/FENCE_L)), gate=(n/2)|0, fyaw=alongX?0:Math.PI/2;
                for(let j=0;j<n;j++){ if(j===gate) continue; const [fx,fz]=P(cAl-(n*FENCE_L)/2+(j+0.5)*FENCE_L,fo); fencePts.push([fx,fz,fyaw,reg]); }
                const se=cAl+(n*FENCE_L)/2+0.05, depth=yard+0.1, m=Math.max(1,Math.round(depth/FENCE_L));
                for(let j=0;j<m;j++){ const [fx,fz]=P(se,fo+s*(j+0.5)*(depth/m)); fencePts.push([fx,fz,fyaw+Math.PI/2,reg]); }
              }
              // Arka bahçe ağacı adayları (tüm parseller bitince çakışma süzülür)
              const ng=Math.random()<0.6?(Math.random()<0.3?2:1):0;
              for(let j=0;j<ng;j++){ const [gx,gz]=P(cAl+R(-W/3,W/3),s*(off+D/2+R(1.3,3.2))); gardenCand.push([gx,gz]); }
            }
            t+=W+R(1.2,2.6)+(Math.random()<0.12?R(3,6):0); } });
      });
      // Köprü üstü lambalar (y = köprü tabliyesi)
      [-4,4].forEach(dx=>[-1,1].forEach(sz=>townLamps.push([-58+dx,14.5+sz*3.05,sz>0?Math.PI/2:-Math.PI/2,1.5])));
      {const mtx=new THREE.Matrix4(), q=new THREE.Quaternion(), sc=new THREE.Vector3(), p=new THREE.Vector3(), up=new THREE.Vector3(0,1,0), c=new THREE.Color();
        const fill=(geo,mat,list,set,cols)=>{ if(!list.length) return; const im=new THREE.InstancedMesh(geo,mat,list.length);
          im.castShadow=false; im.receiveShadow=true; im.frustumCulled=false;
          list.forEach((o,i)=>{ set(o); q.setFromAxisAngle(up,o.ang); mtx.compose(p,q,sc); im.setMatrixAt(i,mtx);
            if(cols){ c.set(cols[(Math.random()*cols.length)|0]); im.setColorAt(i,c); } });
          im.instanceMatrix.needsUpdate=true; if(im.instanceColor) im.instanceColor.needsUpdate=true; scene.add(im); };
        const gUnit=()=>new THREE.BoxGeometry(1,1,1).translate(0,0.5,0);
        // Yedek: prosedürel sıra evler (duvar + kiremit beşik çatı, sırt sokağa paralel) — yalnız ev modelleri yüklenemezse
        buildProcHouses=()=>{
          const ht=hubHouseTex(THREE), mHouse=M(0xffffff,{map:ht.map,roughness:0.85}); mHouse.userData.winTex=ht.lit; winMats.push(mHouse);
          const rv=[-.5,0,-.5, .5,0,-.5, 0,1,-.5,  .5,0,.5, -.5,0,.5, 0,1,.5], P=i=>rv.slice(i*3,i*3+3);
          // köşeler: 0=(-.5,0,-.5) 1=(.5,0,-.5) 2=sırt(0,1,-.5) 3=(.5,0,.5) 4=(-.5,0,.5) 5=sırt(0,1,.5); üçgenler dışa bakar (CCW)
          const tri=[[1,0,2],[4,3,5],[0,4,5],[0,5,2],[3,1,2],[3,2,5]], rp=[], ruv=[];
          tri.forEach(t=>t.forEach(i=>{ const v=P(i); rp.push(...v); ruv.push(v[2]+0.5,v[1]); }));
          const gRoof=new THREE.BufferGeometry(); gRoof.setAttribute("position",new THREE.Float32BufferAttribute(rp,3)); gRoof.setAttribute("uv",new THREE.Float32BufferAttribute(ruv,2));
          gRoof.computeVertexNormals(); gRoof.rotateY(Math.PI/2);
          fill(gUnit(),mHouse,houses,o=>{ p.set(o.x,0,o.z); sc.set(o.w,o.h,o.d); },["#f3e3c3","#e8d2b0","#f2f0ea","#d9c7a8","#efd9d0","#cfdcd6","#f1e7d0","#e0c9b6"]);
          fill(gRoof,M(0xffffff,{map:hubRoofTex(THREE),roughness:0.8}),houses,o=>{ p.set(o.x,o.h,o.z); sc.set(o.w*1.1,o.rh,o.d*1.1); },["#b4452f","#a63d2a","#c0573a","#8f3a28","#b85a3c","#9b4a35"]);
          applyTone(isLightTheme());                                                     // yeni pencere malzemesi gece tonunu alsın
        };
        // Apartmanlar: 4 ve 6 katlı (kat başına doku tekrarı doğru kalsın diye iki grup)
        const mTop=M(0x8d8a84,{roughness:0.95});
        [4,6].forEach(fl=>{ const fm=M(0xffffff,{map:hubFacadeTex(THREE,1,fl),roughness:0.6,metalness:0.1}); fm.userData.winTex=hubWindowLightTex(THREE,fl,4,0.45); winMats.push(fm);
          fill(gUnit(),[fm,fm,mTop,mTop,fm,fm],apts.filter(a=>a.fl===fl),o=>{ p.set(o.x,0,o.z); sc.set(o.w,fl*3.1,o.d); },["#ffffff","#efe6d8","#e3ddd2","#dfe6ea","#f0e0cc"]);
          fill(gUnit(),mSteelDark,apts.filter(a=>a.fl===fl),o=>{ p.set(o.x,fl*3.1,o.z); sc.set(2,1.1,1.8); }); });   // çatı makine dairesi
      }

      // Sokak lambaları (instanced): bulvar + çevre yolu + kasaba sokakları + köprü
      {const lp=[]; for(let z=5;z<=41;z+=6) [-3.3,3.3].forEach(x=>lp.push([x,z,x<0?0:Math.PI]));
        for(let i=0;i<26;i++){ const u=i/26, p=ring.getPointAt(u), tg=ring.getTangentAt(u); const nx=-tg.z, nz=tg.x; lp.push([p.x+nx*3.1,p.z+nz*3.1,Math.atan2(-nx,-nz)+Math.PI/2]); }
        lp.push(...townLamps);
        const gPole=new THREE.CylinderGeometry(0.07,0.11,4,6).translate(0,2,0), gArm=new THREE.BoxGeometry(0.9,0.08,0.08).translate(0.42,3.95,0), gHead=new THREE.BoxGeometry(0.5,0.12,0.26).translate(0.82,3.88,0);
        const mk=(geo,mat,cast)=>{ const im=new THREE.InstancedMesh(geo,mat,lp.length); im.castShadow=cast; im.frustumCulled=false; const m4=new THREE.Matrix4(), q=new THREE.Quaternion(), s=new THREE.Vector3(1,1,1), p=new THREE.Vector3(), up=new THREE.Vector3(0,1,0);
          lp.forEach(([x,z,r,y=0],i)=>{ q.setFromAxisAngle(up,r); p.set(x,y,z); m4.compose(p,q,s); im.setMatrixAt(i,m4); }); scene.add(im); };
        mk(gPole,mSteelDark,true); mk(gArm,mSteelDark,false); mk(gHead,mLamp,false);
      }

      // ── Ortak yapı yardımcıları ──
      const flags=[];                      // dalgalanan bayraklar: {geo, base, phase}
      const flagGeoBase=new THREE.PlaneGeometry(1.6,0.9,10,4).translate(0.8,0,0);
      const mFlag=new THREE.MeshStandardMaterial({map:hubFlagTex(THREE,col1,col2,ab),side:THREE.DoubleSide,roughness:0.8});
      const flagPole=(parent,x,y,z,h=4,ry=0)=>{
        add(new THREE.CylinderGeometry(0.04,0.06,h,6),mSteel,x,y+h/2,z,parent);
        const geo=flagGeoBase.clone(); const f=add(geo,mFlag,x,y+h-0.5,z,parent,{cast:false}); f.rotation.y=ry;
        flags.push({geo,base:Float32Array.from(geo.attributes.position.array),phase:Math.random()*6});
      };
      const goal=(parent,x,z,ry,w=3.2,h=1.1,d=1.1)=>{
        const g=new THREE.Group(); g.position.set(x,0,z); g.rotation.y=ry; parent.add(g);
        const gp=new THREE.CylinderGeometry(0.06,0.06,h,8);
        add(gp,mPost,-w/2,h/2,0,g); add(gp,mPost,w/2,h/2,0,g);
        const cb=add(new THREE.CylinderGeometry(0.06,0.06,w+0.12,8),mPost,0,h,0,g); cb.rotation.z=Math.PI/2;
        const back=add(new THREE.PlaneGeometry(w,h),mNet,0,h/2,-d,g,{cast:false});
        const top=add(new THREE.PlaneGeometry(w,d),mNet,0,h,-d/2,g,{cast:false}); top.rotation.x=Math.PI/2;
        [-1,1].forEach(s=>{ const sd=add(new THREE.PlaneGeometry(d,h),mNet,s*w/2,h/2,-d/2,g,{cast:false}); sd.rotation.y=Math.PI/2; });
      };
      const dugout=(parent,x,z,ry,len=2.6)=>{
        const g=new THREE.Group(); g.position.set(x,0,z); g.rotation.y=ry; parent.add(g);
        const sh=add(new THREE.CylinderGeometry(0.75,0.75,len,12,1,true,0,Math.PI),mGlass,0,0.05,0,g,{cast:false}); sh.rotation.z=Math.PI/2; sh.rotation.y=Math.PI/2;
        box(len,0.35,0.45,M(col1Hex,{roughness:0.5}),0,0.25,-0.2,g); box(len+0.1,0.1,0.9,mConcreteDark,0,0.02,0,g,{cast:false});
      };
      const pitch=(w,d,parent,withGoals=true,gw=3.6)=>{
        flat(w+1.6,d+1.6,M(0x4d8c3c,{roughness:1}),0,0.045,0,parent);
        flat(w,d,mPitch,0,0.06,0,parent);
        if(withGoals){ goal(parent,-w/2+0.02,0,-Math.PI/2,gw,gw*0.34,gw*0.32); goal(parent,w/2-0.02,0,Math.PI/2,gw,gw*0.34,gw*0.32); }
        // Köşe bayrakları
        const gf=new THREE.CylinderGeometry(0.025,0.025,0.9,5), gfl=new THREE.PlaneGeometry(0.3,0.2).translate(0.15,0,0);
        [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx,sz])=>{ add(gf,mPost,sx*w/2,0.45,sz*d/2,parent,{cast:false}); const f=add(gfl,mRed,sx*w/2,0.8,sz*d/2,parent,{cast:false}); f.material.side=THREE.DoubleSide; });
      };
      // Takım otobüsü (geometri/malzeme paylaşımlı): çevre yolunda dönen + otoparkta duran
      const busParts={liv:M(0xffffff,{map:hubBusTex(THREE,col1,col2,clubRef.current||"Kulüp"),roughness:0.35,metalness:0.3}),
        body:M(col1Hex,{roughness:0.35,metalness:0.3}), wind:M(0x16212e,{metalness:0.6,roughness:0.1}),
        geo:new THREE.BoxGeometry(1.9,2,6.4), wheel:new THREE.CylinderGeometry(0.38,0.38,0.3,12).rotateZ(Math.PI/2),
        blob:new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:0.28,depthWrite:false})};
      const makeBus=()=>{ const bus=new THREE.Group(), P=busParts;
        add(P.geo,[P.liv,P.liv,P.body,P.body,P.wind,P.body],0,1.25,0,bus,{cast:false});
        [[-0.85,-2.2],[0.85,-2.2],[-0.85,2.1],[0.85,2.1]].forEach(([x,z])=>add(P.wheel,mTyre,x,0.38,z,bus,{cast:false}));
        const blob=add(new THREE.PlaneGeometry(2.4,7),P.blob,0,0.05,0,bus,{cast:false}); blob.rotation.x=-Math.PI/2;
        return bus; };
      const groups={};
      const G={}; HUB_FACILITIES.forEach(f=>{const g=new THREE.Group();g.position.set(...f.pos);g.userData.fid=f.id;scene.add(g);groups[f.id]=g;G[f.id]=g;});

      // ═══ 1) ARENA ═══
      {const g=G.stadium;
        const PW=16, PD=10.5;              // saha
        pitch(PW,PD,g,true,3.8);
        const OX=14, OZ=11.2, H=6.2;       // dış cephe yarı-ölçüleri ve yükseklik
        const IX=PW/2+1.1, IZ=PD/2+1.1;    // iç tribün kenarı
        // Koltuklu eğimli tribünler (yan grup: dışa +z)
        const mSeat=M(0xffffff,{map:hubSeatTex(THREE,col1,col2),roughness:0.8});
        const stand=(ry,inner,outer,len)=>{
          const sg=new THREE.Group(); sg.rotation.y=ry; g.add(sg);
          const d=outer-inner, r=H-0.9, L=Math.hypot(d,r);
          const pl=add(new THREE.PlaneGeometry(len,L),mSeat,0,0.6+r/2,inner+d/2,sg,{cast:false}); pl.lookAt(new THREE.Vector3(0,d,-r).applyAxisAngle(new THREE.Vector3(0,1,0),ry).add(pl.getWorldPosition(new THREE.Vector3())));
          box(len,0.6,0.5,mConcrete,0,0.3,inner-0.1,sg);       // saha kenarı duvarı
          box(len,0.25,0.25,mLed,0,0.75,inner-0.2,sg,{cast:false}); // LED reklam bandı
        };
        g.updateMatrixWorld(true);
        stand(0,IZ,OZ-0.4,2*IX); stand(Math.PI,IZ,OZ-0.4,2*IX); stand(Math.PI/2,IX,OX-0.4,2*IZ); stand(-Math.PI/2,IX,OX-0.4,2*IZ);
        // Köşe dolguları
        [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx,sz])=>box(OX-IX,H-1,OZ-IZ,mConcreteDark,sx*(IX+(OX-IX)/2),(H-1)/2,sz*(IZ+(OZ-IZ)/2),g));
        // Dış cephe: beton kolon + cam panel (iki kat)
        const facade=(len,x,z,ry)=>{ const m=M(0xffffff,{map:hubFacadeTex(THREE,Math.round(len/4),2),roughness:0.55,metalness:0.15}); winMats.push(m);
          const w=box(len,H,0.5,m,x,H/2,z,g); w.rotation.y=ry; };
        facade(2*OX,0,OZ,0); facade(2*OX,0,-OZ,0); facade(2*OZ,OX,0,Math.PI/2); facade(2*OZ,-OX,0,Math.PI/2);
        // Beton kolonlar (cephe önünde)
        const gCol=new THREE.BoxGeometry(0.45,H+0.6,0.45);
        for(let x=-OX;x<=OX+0.01;x+=3.5) [-1,1].forEach(s=>add(gCol,mConcrete,x,(H+0.6)/2,s*(OZ+0.3),g));
        for(let z=-OZ+3.5;z<OZ;z+=3.5) [-1,1].forEach(s=>add(gCol,mConcrete,s*(OX+0.3),(H+0.6)/2,z,g));
        // Çatı: membran + çelik kafes + LED iç kenar
        const RY=H+0.9;
        [[0,(IZ+OZ)/2+0.3,2*OX+1.2,OZ-IZ+1.6],[0,-(IZ+OZ)/2-0.3,2*OX+1.2,OZ-IZ+1.6],[(IX+OX)/2+0.3,0,OX-IX+1.6,2*IZ],[-(IX+OX)/2-0.3,0,OX-IX+1.6,2*IZ]]
          .forEach(([x,z,w,d])=>box(w,0.16,d,mMembrane,x,RY,z,g));
        {const beams=[]; // kafes: enine kirişler + boyuna kirişler (instanced)
          for(let x=-OX;x<=OX+0.01;x+=1.75) [-1,1].forEach(s=>beams.push([x,RY+0.42,s*(IZ+OZ)/2,0.12,0.6,OZ-IZ+1.4]));
          for(let z=-IZ;z<=IZ+0.01;z+=1.75) [-1,1].forEach(s=>beams.push([s*(IX+OX)/2,RY+0.42,z,OX-IX+1.4,0.6,0.12]));
          [IZ-0.4,OZ].forEach(zz=>[-1,1].forEach(s=>beams.push([0,RY+0.72,s*zz,2*OX+1,0.14,0.14])));
          [IX-0.4,OX].forEach(xx=>[-1,1].forEach(s=>beams.push([s*xx,RY+0.72,0,0.14,0.14,2*OZ])));
          const im=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),mSteel,beams.length); im.castShadow=true;
          const m4=new THREE.Matrix4(), q=new THREE.Quaternion(), p=new THREE.Vector3(), s=new THREE.Vector3();
          beams.forEach(([x,y,z,sx,sy,sz],i)=>{ p.set(x,y,z); s.set(sx,sy,sz); m4.compose(p,q,s); im.setMatrixAt(i,m4); }); g.add(im);
        }
        // İç çatı kenarı LED şerit + projektör bankları
        [[0,IZ-0.4,2*IX+1.2,0.18,0.18],[0,-(IZ-0.4),2*IX+1.2,0.18,0.18],[IX-0.4,0,0.18,0.18,2*IZ],[-(IX-0.4),0,0.18,0.18,2*IZ]]
          .forEach(([x,z,w,h,d])=>box(w,h,d,mLed,x,RY-0.12,z,g,{cast:false}));
        [-6,-2,2,6].forEach(x=>[-1,1].forEach(s=>box(1.3,0.35,0.3,mLamp,x,RY-0.3,s*(IZ-0.2),g,{cast:false})));
        // Çatı kenarında kulüp bayrakları
        for(let x=-OX+1;x<=OX-1;x+=4.5) flagPole(g,x,RY+0.1,OZ+0.4,2.6,0);
        for(let x=-OX+1;x<=OX-1;x+=4.5) flagPole(g,x,RY+0.1,-OZ-0.4,2.6,Math.PI);
        // Giriş: cam sundurma + turnikeler
        box(10,0.14,3,mGlass,0,3.2,OZ+1.8,g,{cast:false});
        [-4.8,4.8].forEach(x=>add(new THREE.CylinderGeometry(0.1,0.1,3.2,8),mSteel,x,1.6,OZ+3.1,g));
        for(let i=0;i<9;i++){ const x=-4+i;
          box(0.18,1.05,1.1,mSteel,x,0.52,OZ+2.4,g); const arm=box(0.5,0.05,0.05,mSteelDark,x+0.3,0.85,OZ+2.4,g,{cast:false}); }
        // Stadyum giriş kapısı tabelası (kulüp adı)
        add(new THREE.PlaneGeometry(8,0.9),new THREE.MeshStandardMaterial({roughness:0.5,emissive:0xffffff,emissiveIntensity:0.06,map:hubCanvasTex(THREE,512,58,(c,w,h)=>{
            c.fillStyle=col1; c.fillRect(0,0,w,h); c.fillStyle=col2; c.fillRect(0,h-6,w,6);
            c.fillStyle="#ffffff"; c.font="900 34px sans-serif"; c.textAlign="center"; c.textBaseline="middle";
            c.fillText(String(clubRef.current||"Kulüp").toUpperCase().slice(0,24)+" STADYUMU",w/2,h/2-2); })}),0,3.75,OZ+3.32,g,{cast:false});
        box(8.3,1.05,0.14,mSteelDark,0,3.75,OZ+3.22,g,{cast:false});
        // Projektör direkleri (4 köşe; direk + lamba bankı instanced)
        {const mp=[[-1,-1],[1,-1],[-1,1],[1,1]].map(([sx,sz])=>[sx*(OX+1.7),sz*(OZ+1.7),Math.atan2(-sx,-sz)]);
          const m4=new THREE.Matrix4(), q=new THREE.Quaternion(), e=new THREE.Euler(), p=new THREE.Vector3(), s1=new THREE.Vector3(1,1,1);
          const inst=(geo,mat,y,tilt)=>{ const im=new THREE.InstancedMesh(geo,mat,4); im.castShadow=true;
            mp.forEach(([x,z,yaw],i)=>{ e.set(tilt,yaw,0,"YXZ"); q.setFromEuler(e); p.set(x,y,z); m4.compose(p,q,s1); im.setMatrixAt(i,m4); }); g.add(im); };
          inst(new THREE.CylinderGeometry(0.16,0.32,15,8).translate(0,7.5,0),mSteel,0,0);
          inst(new THREE.BoxGeometry(3.2,1.9,0.3),mSteelDark,15.2,0.45);
          inst(new THREE.BoxGeometry(2.9,1.6,0.06).translate(0,0,0.18),mLamp,15.2,0.45);
        }
        // Takım otobüsü cebi (çizgili)
        flat(4,10,M(0xffffff,{map:hubCanvasTex(THREE,64,160,(c,w,h)=>{c.fillStyle="#3b3f46";c.fillRect(0,0,w,h);hubNoise(c,w,h,500,["#2f3338","#4a4f57"],.7);
          c.strokeStyle="#f2d36b";c.lineWidth=3;c.strokeRect(4,4,w-8,h-8);c.fillStyle="#f2d36b";c.font="bold 16px sans-serif";c.textAlign="center";c.fillText("BUS",w/2,h/2);})}),
          9.5,0.04,OZ+5,g);
      }

      // ═══ 2) ANTRENMAN SAHASI ═══
      {const g=G.training; pitch(12,8,g,true,3.4);
        const im=(geo,mat,pts)=>{ const m=new THREE.InstancedMesh(geo,mat,pts.length); m.castShadow=true; const m4=new THREE.Matrix4();
          pts.forEach(([x,z],i)=>{ m4.makeTranslation(x,0,z); m.setMatrixAt(i,m4); }); g.add(m); };
        im(new THREE.ConeGeometry(0.14,0.36,8).translate(0,0.18,0),mCone,[...Array(10)].map((_,i)=>[-4.5+i,-2.4+(i%2)*0.6]));
        im(new THREE.CylinderGeometry(0.16,0.24,1.5,8).translate(0,0.75,0),mDummy,[[2.2,-1],[2.2,-0.4],[2.2,0.2],[2.2,0.8]]);
        im(new THREE.SphereGeometry(0.15,8,6).translate(0,1.62,0),mDummy,[[2.2,-1],[2.2,-0.4],[2.2,0.2],[2.2,0.8]]);
        dugout(g,-2,4.9,0); dugout(g,2,4.9,0);
        // Ekipman deposu
        const fm=M(0xffffff,{map:hubWhiteFacadeTex(THREE),roughness:0.6}); winMats.push(fm);
        box(4,2.4,3,fm,9.8,1.2,-1.5,g); box(4.4,0.2,3.4,mSteelDark,9.8,2.5,-1.5,g);
        flagPole(g,-6.6,0,-4.6,3.6,0); flagPole(g,6.6,0,-4.6,3.6,0);
        // Tel çit (doğu kenarında giriş kapısı açık) + üst korkuluk + direkler (instanced)
        {const FX=7.4, FZ=5.9, FH=1.8, mF=(len)=>{ const t=hubNetTex(THREE); t.repeat.set(len/0.9,FH/0.9);
            return new THREE.MeshStandardMaterial({color:0x3f6b4c,map:t,transparent:true,alphaTest:0.3,side:THREE.DoubleSide,roughness:0.7,metalness:0.3}); };
          const panel=(len,x,z,ry)=>{ const m=add(new THREE.PlaneGeometry(len,FH),mF(len),x,FH/2,z,g,{cast:false}); m.rotation.y=ry;
            const r=box(len,0.06,0.06,mSteelDark,x,FH,z,g,{cast:false}); r.rotation.y=ry; };
          panel(2*FX,0,-FZ,0); panel(2*FX,0,FZ,0); panel(2*FZ,-FX,0,Math.PI/2);
          panel(FZ-1.3,FX,-(FZ+1.3)/2,Math.PI/2); panel(FZ-1.3,FX,(FZ+1.3)/2,Math.PI/2);
          const pts=[]; for(let x=-FX;x<=FX+0.01;x+=2.1) pts.push([x,-FZ],[x,FZ]); for(let z=-FZ+2;z<FZ-0.5;z+=2) pts.push([-FX,z]); [-FZ+2,-1.3,1.3,FZ-2].forEach(z=>pts.push([FX,z]));
          const im=new THREE.InstancedMesh(new THREE.CylinderGeometry(0.05,0.05,FH+0.1,6).translate(0,(FH+0.1)/2,0),mSteelDark,pts.length), m4=new THREE.Matrix4();
          pts.forEach(([x,z],i)=>{ m4.makeTranslation(x,0,z); im.setMatrixAt(i,m4); }); im.castShadow=true; g.add(im);
          // Ek ekipman: koordinasyon merdivenleri + mini kaleler
          [[-4,1.6],[-4,2.6]].forEach(([x,z])=>flat(3,0.5,M(0xfacc15,{roughness:0.6,transparent:true,opacity:0.9}),x,0.075,z,g));
          goal(g,-1,-2.8,0,1.4,0.7,0.6); goal(g,1.2,-2.8,0,1.4,0.7,0.6);
        }
      }
      // ═══ 3) SAĞLIK & PERFORMANS MERKEZİ ═══
      {const g=G.medical;
        const fm=M(0xffffff,{map:hubWhiteFacadeTex(THREE),roughness:0.55,metalness:0.05}); winMats.push(fm);
        box(8,4.6,5,fm,-4.5,2.3,-2,g); box(8.4,0.3,5.4,mConcrete,-4.5,4.75,-2,g);
        box(3.6,3.2,3.6,mGlass,0.8,1.6,-2.6,g,{cast:false}); box(3.8,0.2,3.8,mWhite,0.8,3.3,-2.6,g);
        // Haç tabelası (çatı)
        box(1.4,0.42,0.14,mRed,-4.5,5.6,0.5,g); box(0.42,1.4,0.14,mRed,-4.5,5.6,0.5,g); box(0.12,0.8,0.12,mSteelDark,-4.5,5,0.5,g);
        // Ambulans (klinik girişinde)
        {const a=new THREE.Group(); a.position.set(-9.7,0,0.2); g.add(a);
          box(1.5,1.6,2.3,mWhite,0,1.15,-0.45,a); box(1.5,1.05,1.05,mWhite,0,0.88,1.2,a);
          box(1.36,0.5,0.06,M(0x16212e,{metalness:0.6,roughness:0.1}),0,1.12,1.74,a,{cast:false});       // ön cam
          box(1.53,0.2,3.42,mRed,0,0.95,0.07,a,{cast:false});                                         // kırmızı şerit
          [[-0.77,0],[0.77,0]].forEach(([x])=>{ box(0.02,0.42,0.14,mRed,x,1.45,-0.45,a,{cast:false}); box(0.02,0.14,0.42,mRed,x,1.45,-0.45,a,{cast:false}); }); // yan haç
          box(0.9,0.14,0.26,new THREE.MeshStandardMaterial({color:0x3b82f6,emissive:0x2563eb,emissiveIntensity:0.8}),0,1.99,0.1,a,{cast:false}); // tepe lambası
          const gw=new THREE.CylinderGeometry(0.3,0.3,0.24,10); gw.rotateZ(Math.PI/2);
          [[-0.68,-1.1],[0.68,-1.1],[-0.68,1.05],[0.68,1.05]].forEach(([x,z])=>add(gw,mTyre,x,0.3,z,a,{cast:false}));
        }
      }
      // ═══ 3b) FITNESS & KONDİSYON (pist + açık hava alanı; eski sağlık yerleşimi korunur) ═══
      {const gf=new THREE.Group(), F0=HUB_FACILITIES.find(f=>f.id==="medical").pos, F1=HUB_FACILITIES.find(f=>f.id==="fitness").pos;
        gf.position.set(F0[0]-F1[0],0,F0[2]-F1[2]); G.fitness.add(gf); const g=gf;
        // Tartan koşu pisti (oval) + iç çim + şerit çizgileri
        {const sh=(r,l)=>{ const s=new THREE.Shape(); s.absarc(l/2,0,r,-Math.PI/2,Math.PI/2,false); s.absarc(-l/2,0,r,Math.PI/2,Math.PI*1.5,false); return s; };
          const outer=sh(3.4,5), inner=sh(2.2,5); outer.holes.push(new THREE.Path(inner.getPoints(24)));
          const tr=add(new THREE.ShapeGeometry(outer,24),M(0xffffff,{map:hubTartanTex(THREE),roughness:0.9}),7,0.05,2.6,g,{cast:false}); tr.rotation.x=-Math.PI/2;
          const inf=add(new THREE.ShapeGeometry(inner,24),M(0x4f9a46,{roughness:1}),7,0.045,2.6,g,{cast:false}); inf.rotation.x=-Math.PI/2;
          [2.6,3.0].forEach(r=>{ const pts=sh(r,5).getPoints(40).map(p=>new THREE.Vector3(p.x,0,-p.y)); const ln=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:0xffffff}));
            ln.position.set(7,0.07,2.6); g.add(ln); });
        }
        // Açık hava kondisyon alanı
        flat(7,3.2,M(0xffffff,{map:hubRubberTex(THREE),roughness:0.95}),-4.5,0.05,3.2,g);
        [-7,-5.5].forEach(x=>{ [-0.8,0.8].forEach(dz=>add(new THREE.CylinderGeometry(0.05,0.05,2.2,6),mSteelDark,x,1.1,3.2+dz,g));
          const b=add(new THREE.CylinderGeometry(0.04,0.04,1.7,6),mSteel,x,2.15,3.2,g); b.rotation.x=Math.PI/2; });
        [[-3.6,2.5],[-2.9,2.5],[-3.25,3.5]].forEach(([x,z],i)=>box(0.6,0.4+i*0.15,0.6,M(0x1f2937,{roughness:0.7}),x,(0.4+i*0.15)/2,z,g));
        [[-1.8,2.8],[-1.8,3.7]].forEach(([x,z])=>{ const t=add(new THREE.TorusGeometry(0.38,0.16,8,16),mTyre,x,0.16,z,g); t.rotation.x=Math.PI/2; });
      }
      // ═══ 4) AKADEMİ ═══
      {const g=G.academy; pitch(9,6,g,true,2.6);
        dugout(g,-1.6,3.9,0,2); dugout(g,1.6,3.9,0,2);
        // Gençlik Akademisi & Yatakhane: cam lobi + ahşap çekirdek (zemin), beyaz konsol yatakhane (2 kat), ahşap lameller
        {const BX=8.4, mWood=M(0xffffff,{map:hubWoodTex(THREE,2),roughness:0.7});
          const fm=M(0xffffff,{map:hubWhiteFacadeTex(THREE),roughness:0.55}); winMats.push(fm);
          const [wx,,wz]=g.position.toArray();
          flat(5.8,8.2,mPlaza,BX,0.05,0,g);                                                   // taş avlu
          curbFrame(wx+BX-2.9,wz-4.1,wx+BX+2.9,wz+4.1,{w:[[-1.2+wz,1.6+wz]]});              // avlu bordürü (saha tarafı girişli)
          box(5,0.22,7,mConcrete,BX,0.16,0,g);                                                // kaide
          box(4,2.4,4.4,mWood,BX+0.2,1.47,-1,g);                                              // ahşap çekirdek
          box(4,2.4,2,mGlass,BX+0.2,1.47,2.2,g,{cast:false});                                 // cam lobi
          [-1.8,-0.9,0,0.9,1.8].forEach(dx=>box(0.07,2.4,0.07,mSteelDark,BX+0.2+dx,1.47,3.2,g,{cast:false}));
          box(4.8,3.6,6.8,fm,BX,4.47,0,g);                                                    // yatakhane katları
          box(4.95,0.14,6.95,mWhite,BX,2.72,0,g,{cast:false});                                // döşeme bandı
          [[-2.2,3.2],[-2.2,-3.2]].forEach(([dx,dz])=>add(new THREE.CylinderGeometry(0.08,0.08,2.45,8),mSteel,BX+dx,1.5,dz,g)); // konsol kolonları
          {const n=15, fin=new THREE.InstancedMesh(new THREE.BoxGeometry(0.07,3.4,0.14),mWood,n), m4=new THREE.Matrix4(); // saha cephesi lameller
            for(let i=0;i<n;i++){ m4.makeTranslation(BX-2.45,4.47,-3.15+i*0.45); fin.setMatrixAt(i,m4); } fin.castShadow=true; g.add(fin); }
          box(5.3,0.22,7.3,mWhite,BX,6.38,0,g);                                               // çatı saçağı
          box(2.6,0.12,1.4,mWood,BX+0.2,2.75,3.9,g);                                          // giriş saçağı
          for(let i=0;i<3;i++){ const p=box(1.1,0.05,1.8,M(0x1e293b,{metalness:0.6,roughness:0.25}),BX-1.3+i*1.3,6.68,-1.2,g,{cast:false}); p.rotation.x=-0.3; } // güneş panelleri
          const sign=add(new THREE.PlaneGeometry(3.4,0.6),new THREE.MeshStandardMaterial({roughness:0.5,map:hubCanvasTex(THREE,512,90,(c,w,h)=>{
              c.fillStyle="#f8f7f3"; c.fillRect(0,0,w,h); c.fillStyle=col1; c.fillRect(0,0,14,h);
              c.fillStyle="#1f2937"; c.font="bold 40px sans-serif"; c.textBaseline="middle"; c.fillText("GENÇLİK AKADEMİSİ",34,h/2); })}),BX,5.85,3.42,g,{cast:false});
          [[BX+3.3,-3.5],[BX+3.3,-1.2],[BX+3.3,1.2],[BX+3.3,3.5],[BX-1.5,4.6],[BX+1.5,4.6]].forEach(([x,z])=>shrub(wx+x,wz+z,0.45)); // avlu çalıları
        }
        const cn=new THREE.InstancedMesh(new THREE.ConeGeometry(0.12,0.3,8).translate(0,0.15,0),mCone,6); const m4=new THREE.Matrix4();
        for(let i=0;i<6;i++){ m4.makeTranslation(-2+i*0.8,0,-1.6); cn.setMatrixAt(i,m4); } cn.castShadow=true; g.add(cn);
      }
      // ═══ 5) KULÜP PLAZASI / YÖNETİM ═══
      {const g=G.admin, FL=4, TW=7, TH=14;
        const cw=M(0xffffff,{map:hubCurtainTex(THREE,FL,6),metalness:0.7,roughness:0.15,envMapIntensity:1.3}); winMats.push(cw);
        cw.userData.winTex=hubWindowLightTex(THREE,FL,6,0.6);
        box(TW,TH,TW,cw,0,TH/2,-1.5,g);
        // Kat çizgileri (döşeme bantları) + köşe kolonları + çatı
        for(let f=1;f<=FL;f++) box(TW+0.25,0.16,TW+0.25,mWhite,0,f*TH/FL,-1.5,g,{cast:false});
        [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx,sz])=>box(0.4,TH+0.4,0.4,mConcrete,sx*TW/2,(TH+0.4)/2,-1.5+sz*TW/2,g));
        box(2.4,1,2,mSteelDark,1.2,TH+0.9,-2.5,g); box(TW-0.6,0.5,TW-0.6,mConcrete,0,TH+0.25,-1.5,g);
        // Giriş cam sundurması
        box(5,0.14,2.6,mGlass,0,3.2,3.3,g,{cast:false}); box(5.1,0.08,0.1,mSteel,0,3.25,4.6,g,{cast:false});
        [-2.4,2.4].forEach(x=>add(new THREE.CylinderGeometry(0.07,0.07,3.2,8),mSteel,x,1.6,4.5,g));
        // Kulüp amblemi (cephe)
        const em=add(new THREE.PlaneGeometry(2.6,2.6),new THREE.MeshStandardMaterial({map:hubEmblemTex(THREE,col1,col2,ab),transparent:true,alphaTest:0.1,roughness:0.4,emissive:0xffffff,emissiveIntensity:0.08}),0,TH-2.4,2.03,g,{cast:false});
        em.userData.emblem=true;
        // Çeşme
        add(new THREE.CylinderGeometry(1.9,2.05,0.5,28),mConcrete,0,0.25,7.2,g);
        add(new THREE.CylinderGeometry(1.7,1.7,0.06,28),mWater,0,0.47,7.2,g,{cast:false});
        add(new THREE.CylinderGeometry(0.25,0.35,1.1,12),mConcrete,0,0.55,7.2,g);
        add(new THREE.SphereGeometry(0.32,12,8),mWater,0,1.2,7.2,g,{cast:false});
        [-4.5,4.5,0].forEach((x,i)=>flagPole(g,x,0,i===2?9.6:8.6,6,0));
        // Taraftar mağazası: kırmızı-beyaz tenteli stantlar (plaza batısı, plazaya bakar)
        {const mAwn=M(0xffffff,{map:hubAwningTex(THREE),roughness:0.7,side:THREE.DoubleSide}), mKit=M(col1Hex,{roughness:0.6}), mKit2=M(new THREE.Color(col2).getHex(),{roughness:0.6});
          const gPost=new THREE.CylinderGeometry(0.04,0.04,2.1,6);
          [1.3,3.7,6.1].forEach((z,i)=>{ const st=new THREE.Group(); st.position.set(-5.6,0,z); st.rotation.y=Math.PI/2; g.add(st);
            box(1.9,0.95,0.8,mWhite,0,0.475,0.1,st); box(1.9,0.06,0.9,mKit,0,0.98,0.12,st,{cast:false});       // tezgâh
            box(1.9,1.9,0.08,mWhite,0,0.95,-0.55,st);                                                           // arka pano
            [[-0.9,0.55],[0.9,0.55],[-0.9,-0.55],[0.9,-0.55]].forEach(([x,zz])=>add(gPost,mSteelDark,x,1.05,zz,st,{cast:false}));
            const aw=add(new THREE.PlaneGeometry(2.2,1.5),mAwn,0,2.2,0.15,st); aw.rotation.x=-Math.PI/2+0.32;     // eğimli tente
            for(let k=0;k<4;k++) box(0.32,0.42,0.04,k%2?mKit2:mKit,-0.6+k*0.4,1.35,-0.5,st,{cast:false});       // asılı formalar/atkılar
            if(i===1){ const sg=add(new THREE.PlaneGeometry(1.8,0.38),new THREE.MeshStandardMaterial({roughness:0.5,map:hubCanvasTex(THREE,256,54,(c,w,h)=>{
                c.fillStyle="#dc2626"; c.fillRect(0,0,w,h); c.fillStyle="#fff"; c.font="900 28px sans-serif"; c.textAlign="center"; c.textBaseline="middle"; c.fillText("FAN SHOP",w/2,h/2+1); })}),0,2.75,0.62,st,{cast:false}); sg.rotation.x=-0.1; }
          });
        }
        // Yönetim otoparkı: park etmiş takım otobüsü + yönetici araçları (instanced)
        {flat(15,6.8,mPark,12,0.036,2,g,Math.PI/2);
          const pb=makeBus(); pb.position.set(10.1,0,1.2); g.add(pb);
          const cars=[-3.4,-0.8,1.8,4.4,7].map(z=>[13.4,z]), m4=new THREE.Matrix4(), c=new THREE.Color();
          const ci=(geo,mat,tint)=>{ const im=new THREE.InstancedMesh(geo,mat,cars.length); im.castShadow=true;
            cars.forEach(([x,z],i)=>{ m4.makeTranslation(x,0,z); im.setMatrixAt(i,m4); if(tint){ c.set(["#f8fafc","#111827","#9ca3af","#1d4ed8","#b91c1c"][i%5]); im.setColorAt(i,c); } }); g.add(im); };
          ci(new THREE.BoxGeometry(3.1,0.6,1.5).translate(0,0.5,0),M(0xffffff,{roughness:0.3,metalness:0.5}),true);
          ci(new THREE.BoxGeometry(1.7,0.5,1.3).translate(-0.2,1.05,0),M(0x1e2a38,{roughness:0.15,metalness:0.6}),false);
        }
      }

      // ── Takım otobüsü (çevre yolunda döner) ──
      const bus=makeBus(); scene.add(bus);
      const busLane=new THREE.Vector3(), busTg=new THREE.Vector3(); let busU=0.12; const RING_LEN=ring.getLength();

      // ═══ ÇEVRE MODELLERİ: 5 tür ağaç, nehir/park kayaları + çim öbekleri, Kenney evleri, bahçe çitleri ═══
      // Gölge bayrakları: gölge kamerasının kapsadığı alandaki (HUB_SHADOW_R) ağaç/ev/çitler gerçek gölge düşürür
      // ve alır; dışındakiler gölge hesabına hiç girmez (harita onları kapsamaz) → yerine güneş/ay yönüne göre
      // uzayan decal gölge + zemin AO. Evler/çitler bölge başına ayrı InstancedMesh (kendi sınır küresiyle) →
      // kameranın arkasında kalan bölge tümüyle kırpılır. Model yüklenemezse her parça prosedürel yedeğe düşer.
      const inRing=nearRing;
      const blocked=(x,z)=>(Math.abs(x)<5&&z>2&&z<44)||(Math.abs(z-14.5)<4.5&&x>-38&&x<36)
        ||HUB_FACILITIES.some(f=>Math.hypot(x-f.pos[0],z-f.pos[2])<(f.id==="stadium"?21:f.id==="training"?10.5:f.id==="medical"?13:9.5))
        ||(x>13&&x<33&&z>-20&&z<-6)||(x>24&&x<33.5&&z>17&&z<35)||(inRing(x,z,4)&&!inRing(x,z,-4))
        ||Math.abs(x)>250||Math.abs(z-7)>250||riverDist(x,z)<HUB_RIVER_W/2+2.6||onRoad(x,z,0.9,0.9)||lotHit(x,z,0.9,0.9);
      const nearSun=(x,z)=>Math.hypot(x-HUB_SUN_TGT[0],z-HUB_SUN_TGT[2])<HUB_SHADOW_R-6;
      const _m=new THREE.Matrix4(), _q=new THREE.Quaternion(), _s=new THREE.Vector3(), _p=new THREE.Vector3(), _up=new THREE.Vector3(0,1,0), _c=new THREE.Color();
      const tuneMat=m=>{ m.envMapIntensity=(m.metalness>0.5?1.3:0.6)*curTone.env; return m; };
      // pts: [x,z,ölçek,rotY]; o: {cast,recv,cull,tint(color,pt)}. cull → geometri klonu + örnekleri saran küre.
      // Örnek rengi HER ZAMAN yazılır (tint yoksa beyaz): r128 program önbelleği malzeme başınadır ve
      // instanceColor'lı/instanceColor'sız iki InstancedMesh aynı malzemeyi paylaşırsa ikincisinde render
      // istisna fırlatır (null instanceColor) → karenin geri kalanı çizilmez. Atlas malzemesi ev/çit/ağaçta ortak.
      const inst=(geo,mat,pts,o={})=>{ if(!pts.length) return null;
        const g=o.cull?geo.clone():geo, im=new THREE.InstancedMesh(g,mat,pts.length), bb=new THREE.Box3(), tb=new THREE.Box3();
        if(o.cull&&!geo.boundingBox) geo.computeBoundingBox();
        pts.forEach((pt,i)=>{ _q.setFromAxisAngle(_up,pt[3]); _s.setScalar(pt[2]); _p.set(pt[0],0,pt[1]); _m.compose(_p,_q,_s); im.setMatrixAt(i,_m);
          if(o.cull){ tb.copy(geo.boundingBox).applyMatrix4(_m); bb.union(tb); }
          if(o.tint) o.tint(_c,pt); else _c.setRGB(1,1,1); im.setColorAt(i,_c); });
        if(o.cull){ g.boundingSphere=bb.getBoundingSphere(new THREE.Sphere()); im.frustumCulled=true; }
        else im.frustumCulled=false;                                   // r128: örnek sınırı hesaplanmaz → yanlış kırpılmasın
        im.castShadow=!!o.cast; im.receiveShadow=!!o.recv;
        im.instanceMatrix.needsUpdate=true; if(im.instanceColor) im.instanceColor.needsUpdate=true;
        scene.add(im); return im; };
      // Nature Kit modelleri KHR_materials_unlit (ışıksız MeshBasic) gelir → ışık/gölge alan PBR malzemeyle değiştir
      const natMat=(src,leafHex,barkHex,flat)=>{ const nm=String(src&&src.name||"").toLowerCase();
        const col=/bark|wood|trunk/.test(nm)?barkHex:/dirt|stone|rock/.test(nm)?0x8c877e:leafHex;
        return tuneMat(new THREE.MeshStandardMaterial({color:col,roughness:0.9,metalness:0,flatShading:!!flat})); };
      const isLeafMat=m=>!/bark|wood|trunk|dirt|stone|rock/i.test(String(m&&m.name||""));
      // Kenney paletli modeller (evler, çit, küçük ağaç) için prosedürel atlas malzemeleri (renk varyantı başına)
      const atlasMats=HUB_HOUSE_PAL.map(p=>tuneMat(M(0xffffff,{map:hubKenneyAtlas(THREE,p),roughness:0.82})));
      const leafTint=c=>{ const k=R(0.82,1.12); c.setRGB(k*R(0.9,1.06),k,k*R(0.86,1.04)); };
      const decals=[];                                                 // sahte gölgeler: {x,z,h, r | w,d, tree}

      // ── Ağaçlar: bağlama göre tür karışımı ──
      const treePts=[];                                                // [x,z,ölçek,rot,tür]
      const mixPick=mix=>{ let r=Math.random()*mix.reduce((a,m)=>a+m[1],0); for(const [sp,w] of mix){ r-=w; if(r<0) return sp; } return mix[0][0]; };
      const MIX_RING=[["oak",3],["detailed",3],["pineR",2],["small",1]], MIX_WOOD=[["pineT",4],["pineR",3],["oak",2]];
      const MIX_RIVER=[["oak",3],["detailed",2],["small",2]], MIX_PARK=[["detailed",3],["oak",2],["small",2],["pineR",1]];
      const cluster=(cx,cz,n,rad,mix)=>{ for(let i=0,t=0;i<n&&t<n*12;t++){ const a=Math.random()*6.28, r=Math.sqrt(Math.random())*rad, x=cx+Math.cos(a)*r, z=cz+Math.sin(a)*r;
        if(blocked(x,z)) continue; treePts.push([x,z,R(0.75,1.35),R(0,6.28),mixPick(mix)]); i++; } };
      const RING_PARKS=[];
      for(let i=0;i<14;i++){ const a=i/14*6.28+R(-.15,.15), r=R(62,92), x=Math.cos(a)*r, z=Math.sin(a)*r*0.85+7; RING_PARKS.push([x,z]); cluster(x,z,10,9,MIX_RING); }
      for(let i=0;i<24;i++){ const a=i/24*6.28+R(-.12,.12), r=R(100,190); cluster(Math.cos(a)*r,Math.sin(a)*r*0.9+7,12,11,MIX_WOOD); }   // kasaba çevresi korulukları
      for(let i=6;i<riverPts.length-6;i+=7){ const p=riverPts[i], sd=i%14?1:-1; cluster(p.x+sd*(HUB_RIVER_W/2+5),p.z+R(-3,3),4,4,MIX_RIVER); } // nehir kıyısı
      const PARKS=[[-30,-18],[-29,30],[-4,36],[29,36],[30,-24],[-12,-26],[10,-27],[-31,-4],[31,15]];
      PARKS.forEach(([x,z])=>cluster(x,z,6,5,MIX_PARK));
      for(let z=6;z<=40;z+=6) [-6,6].forEach(x=>treePts.push([x,z+3,0.8,R(0,6.28),"detailed"]));   // bulvar: tek tür, eş boy
      gardenCand.forEach(([x,z])=>{ if(!blocked(x,z)) treePts.push([x,z,R(0.7,1.05),R(0,6.28),Math.random()<0.6?"small":Math.random()<0.5?"oak":"detailed"]); });
      const treeFallback=(sp,T)=>{ const trunk={geometry:new THREE.CylinderGeometry(0.15,0.2,1,5).translate(0,0.5,0),material:tuneMat(M(T.bark||0x6e4b33)),leaf:false};
        const crown=sp==="pineR"||sp==="pineT"?new THREE.ConeGeometry(T.h*0.2,T.h*0.78,7).translate(0,T.h*0.6,0)
          :new THREE.IcosahedronGeometry(T.h*0.28,0).scale(1,1.1,1).translate(0,T.h*0.62,0);
        return [trunk,{geometry:crown,material:tuneMat(M(T.leaf||0x4b8231,{flatShading:true})),leaf:true}]; };
      Object.keys(HUB_TREES).forEach(sp=>{ const T=HUB_TREES[sp], pts=treePts.filter(p=>p[4]===sp); if(!pts.length) return;
        const near=pts.filter(p=>nearSun(p[0],p[1])), far=pts.filter(p=>!nearSun(p[0],p[1]));
        far.forEach(([x,z,s])=>decals.push({x,z,r:T.h*0.28*s,h:T.h*0.78*s,tree:true}));
        hubLoadGlb(THREE,T.n,isAlive,{strip:!!T.atlas}).then(gl=>{ if(!isAlive()) return;
          const parts=gl?hubFit(THREE,gl,[null,T.h,null]).children.map(m=>({geometry:m.geometry,
              material:m.userData.atlas?atlasMats[0]:natMat(m.material,T.leaf,T.bark),leaf:m.userData.atlas||isLeafMat(m.material)}))
            :treeFallback(sp,T);
          parts.forEach(m=>{ const tint=m.leaf?leafTint:null;
            inst(m.geometry,m.material,near,{cast:true,recv:true,tint});      // kampüs: gerçek yumuşak gölge
            inst(m.geometry,m.material,far,{tint}); });                      // uzak: gölge hesabı yok (decal)
          shadowDirty();
        });
      });

      // ── Nehir kıyısı ve parklar: kaya öbekleri (rock_largeA) + çim öbekleri (grass_large) ──
      const rockPts=[], grassPts=[];
      const clutterOK=(x,z)=>!onRoad(x,z,0.6,0.6)&&!lotHit(x,z,0.6,0.6)&&!(inRing(x,z,4)&&!inRing(x,z,-4))&&Math.hypot(x+58,z-14.5)>12&&Math.hypot(x,z-7)<245;
      for(let i=2;i<riverPts.length-2;i+=2){ const p=riverPts[i], a=riverPts[i-1], b=riverPts[i+1];
        let tx=b.x-a.x, tz=b.z-a.z; const tl=Math.hypot(tx,tz)||1; tx/=tl; tz/=tl; const nx=-tz, nz=tx;
        [-1,1].forEach(sd=>{
          if(Math.random()<0.3){ const o=HUB_RIVER_W/2+R(0.5,2.2), n=1+((Math.random()*3)|0);                       // kumlu şeritte kayalar
            for(let j=0;j<n;j++){ const oo=o+R(-0.5,0.5), u=R(-1.6,1.6), x=p.x+nx*sd*oo+tx*u, z=p.z+nz*sd*oo+tz*u;
              if(clutterOK(x,z)) rockPts.push([x,z,R(0.4,1.1),R(0,6.28)]); } }
          if(Math.random()<0.55){ const n=2+((Math.random()*3)|0);                                                  // kıyı gerisinde çim öbekleri
            for(let j=0;j<n;j++){ const oo=HUB_RIVER_W/2+R(2.2,6.5), u=R(-2.5,2.5), x=p.x+nx*sd*oo+tx*u, z=p.z+nz*sd*oo+tz*u;
              if(clutterOK(x,z)&&riverDist(x,z)>HUB_RIVER_W/2+1.6) grassPts.push([x,z,R(0.8,1.5),R(0,6.28)]); } }
        }); }
      PARKS.concat(RING_PARKS).forEach(([cx,cz])=>{
        for(let j=0;j<7;j++){ const a=R(0,6.28), r=R(1,8), x=cx+Math.cos(a)*r, z=cz+Math.sin(a)*r; if(!blocked(x,z)) grassPts.push([x,z,R(0.7,1.3),R(0,6.28)]); }
        if(Math.random()<0.55){ const a=R(0,6.28), r=R(2,7), x=cx+Math.cos(a)*r, z=cz+Math.sin(a)*r; if(!blocked(x,z)) rockPts.push([x,z,R(0.35,0.75),R(0,6.28)]); } });
      const grassTint=c=>{ const k=R(0.85,1.15); c.setRGB(k*R(0.92,1.1),k,k*R(0.85,1)); };
      hubLoadGlb(THREE,"rock_largeA",isAlive).then(gl=>{ if(!isAlive()) return;
        const parts=gl?hubFit(THREE,gl,[null,0.95,null]).children.map(m=>({geometry:m.geometry,material:natMat(m.material,0x4f8a34,0x6e4b33,true)}))
          :[{geometry:new THREE.DodecahedronGeometry(1,0).scale(1.6,0.55,1.2).translate(0,0.35,0),material:tuneMat(M(0x8c877e,{flatShading:true,roughness:0.95}))}];
        parts.forEach(m=>inst(m.geometry,m.material,rockPts,{recv:true}));
        shadowDirty(); });
      hubLoadGlb(THREE,"grass_large",isAlive).then(gl=>{ if(!isAlive()) return;
        const parts=gl?hubFit(THREE,gl,[null,0.6,null]).children.map(m=>({geometry:m.geometry,material:natMat(m.material,0x4c8a33,0x4c8a33)}))
          :[{geometry:new THREE.ConeGeometry(0.45,0.6,5).translate(0,0.3,0),material:tuneMat(M(0x4c8a33,{flatShading:true}))}];
        parts.forEach(m=>inst(m.geometry,m.material,grassPts,{recv:true,tint:grassTint}));
        shadowDirty(); });

      // ── Kenney evleri: tip × renk varyantı × bölge × (gölge alanı içi/dışı) başına InstancedMesh ──
      houses.forEach(h=>{ if(!nearSun(h.x,h.z)) decals.push({x:h.x,z:h.z,w:h.w,d:h.d,h:h.hgt}); });
      apts.forEach(a=>decals.push({x:a.x,z:a.z,w:a.w,d:a.d,h:a.fl*3.1}));
      Promise.all(HUB_HOUSE_TYPES.map(T=>hubLoadGlb(THREE,T.n,isAlive,{strip:true}))).then(gls=>{
        if(!isAlive()) return;
        const ok=gls.map(Boolean);
        if(!ok.some(Boolean)){ if(buildProcHouses) buildProcHouses(); shadowDirty(); return; }     // prosedürel yedek
        // Yüklenemeyen tip → taban izi en yakın yüklenen tip (parsele sığacak ölçekle)
        const sub=HUB_HOUSE_TYPES.map((T,i)=>ok[i]?i:HUB_HOUSE_TYPES.map((U,j)=>[j,Math.abs(U.fx-T.fx)+Math.abs(U.fz-T.fz)]).filter(([j])=>ok[j]).sort((a,b)=>a[1]-b[1])[0][0]);
        const geo=gls.map(g=>g&&hubCenterBase(THREE,g));
        const buckets=new Map();
        houses.forEach(h=>{ const ty=sub[h.ty], T=HUB_HOUSE_TYPES[h.ty], U=HUB_HOUSE_TYPES[ty], near=nearSun(h.x,h.z);
          const key=[ty,h.vr,h.reg,near?1:0].join("|"); if(!buckets.has(key)) buckets.set(key,[]);
          buckets.get(key).push([h.x,h.z,h.k*Math.min(T.fx/U.fx,T.fz/U.fz,1.1),h.yaw]); });
        const houseTint=c=>{ const k=R(0.92,1.04); c.setRGB(k*R(0.98,1.03),k,k*R(0.96,1.02)); };
        buckets.forEach((pts,key)=>{ const [ty,vr,,near]=key.split("|").map(Number);
          geo[ty].children.forEach(m=>inst(m.geometry,m.userData.atlas?atlasMats[vr]:tuneMat(m.material),pts,{cull:true,cast:!!near,recv:!!near,tint:houseTint})); });
        shadowDirty();
      });
      // ── Bahçe çitleri (fence.glb, ev atlasının beyaz ahşap sütunu) ──
      hubLoadGlb(THREE,"fence",isAlive,{strip:true}).then(gl=>{ if(!isAlive()||!fencePts.length) return;
        const parts=gl?hubFit(THREE,gl,[FENCE_L,null,null]).children.map(m=>({geometry:m.geometry,material:m.userData.atlas?atlasMats[0]:tuneMat(m.material)}))
          :[{geometry:new THREE.BoxGeometry(FENCE_L-0.04,0.8,0.08).translate(0,0.4,0),material:tuneMat(M(0xf1ede4))}];
        const buckets=new Map();
        fencePts.forEach(([x,z,yaw,reg])=>{ const key=reg+"|"+(nearSun(x,z)?1:0); if(!buckets.has(key)) buckets.set(key,[]); buckets.get(key).push([x,z,1,yaw]); });
        buckets.forEach((pts,key)=>{ const near=key.endsWith("|1"); parts.forEach(m=>inst(m.geometry,m.material,pts,{cull:true,recv:near})); });
        shadowDirty();
      });

      // ── Çalılar (prosedürel, instanced, ton varyasyonlu) ──
      const bushPts=[]; for(let i=0;i<60;i++){ const a=R(0,6.28), r=R(44,70), x=Math.cos(a)*r, z=Math.sin(a)*r*0.85+7; if(!blocked(x,z)) bushPts.push([x,z,R(0.6,1.0),R(0,6.28)]); } bushPts.push(...edgeBushPts);
      {const c=new THREE.Color();
        const im=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.85,0).scale(1.2,0.8,1.2).translate(0,0.55,0),M(0x3f7f34,{flatShading:true,roughness:0.9}),bushPts.length);
        im.castShadow=true; im.receiveShadow=true; im.frustumCulled=false;
        bushPts.forEach(([x,z,s,r],i)=>{ _q.setFromAxisAngle(_up,r); _s.setScalar(s); _p.set(x,0,z); _m.compose(_p,_q,_s); im.setMatrixAt(i,_m);
          c.setHSL(0.24+Math.random()*0.1,0.45+Math.random()*0.35,0.34+Math.random()*0.2); im.setColorAt(i,c); });
        im.instanceMatrix.needsUpdate=true; if(im.instanceColor) im.instanceColor.needsUpdate=true; scene.add(im); }

      // ── Sahte gölgeler (decal): gölge haritası dışındaki ev/apartman/ağaçlar. Güneş/ay yönüne göre uzar,
      //    tema değişince yeniden yerleşir (placeDecals). Tek InstancedMesh, şeffaf, derinliğe yazmaz. ──
      const decalMat=new THREE.MeshBasicMaterial({color:0x0b130e,map:hubBlobTex(THREE),transparent:true,opacity:0.3,depthWrite:false,
        polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-8});
      const decalIM=decals.length?new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1).rotateX(-Math.PI/2),decalMat,decals.length):null;
      if(decalIM){ decalIM.frustumCulled=false; decalIM.renderOrder=1; scene.add(decalIM); }
      const placeDecals=t=>{ if(!decalIM) return;
        const d=t.sunDir, hl=Math.hypot(d[0],d[2]), sx=-d[0]/hl, sz=-d[2]/hl, cot=hl/d[1];
        _q.setFromAxisAngle(_up,Math.atan2(sx,sz));
        decals.forEach((o,i)=>{ const L=o.h*cot;
          if(o.tree) _s.set(2*o.r*1.1,1,L*0.85+2*o.r); else { const rf=0.5*Math.hypot(o.w,o.d); _s.set(rf*1.8,1,L+rf*1.6); }
          _p.set(o.x+sx*L*0.5,0.045,o.z+sz*L*0.5); _m.compose(_p,_q,_s); decalIM.setMatrixAt(i,_m); });
        decalIM.instanceMatrix.needsUpdate=true; decalMat.opacity=t.blob; };

      // ── Zemin makro dokusu: yerleşim artık belli (nehir, ağaç/çalı, ev/apartman tabanları) ──
      groundMacro.value=hubGroundMacroTex(THREE,{R:260,river:riverPts,ring:[RX0-3,RZ0-3,RX1+3,RZ1+3],
        trees:treePts.map(([x,z,s,,sp])=>[x,z,HUB_TREES[sp].h*0.3*s+0.6]).concat(bushPts.map(([x,z,s])=>[x,z,1.1*s])),
        boxes:houses.map(h=>[h.x,h.z,h.hx,h.hz]).concat(apts.map(a=>[a.x,a.z,a.hx,a.hz]))});

      // ── Tema tonu ──
      const applyTone=(isLight)=>{
        const t=hubSceneTone(isLight), key=isLight?"light":"dark";
        if(!skyTex[key]) skyTex[key]=hubSkyTex(THREE,isLight);
        skyMat.map=skyTex[key]; skyMat.needsUpdate=true;
        // Ortam yansıması gökyüzünden (cam, çelik, su)
        if(envRT) envRT.dispose();
        envRT=pmrem.fromScene(envScene,0.02,0.1,1000); scene.environment=envRT.texture;
        scene.fog.color.setHex(t.fog); fogBase=t.fogD; scene.fog.density=fogBase/distK;
        renderer.toneMappingExposure=t.exp;
        curTone=t;
        hemi.color.setHex(t.hemiSky); hemi.groundColor.setHex(t.hemiGround); hemi.intensity=t.hemi;
        sun.intensity=t.sun; sun.color.setHex(t.sunCol); placeSun(t.sunDir);   // gündüz ikindi güneşi ↔ gece ay
        floods.forEach(l=>{ l.intensity=t.flood; l.visible=!isLight; });        // gündüz: yalnız güneş + hemisphere
        placeDecals(t);
        renderer.shadowMap.needsUpdate=true;                                   // ışık yönü değişti → statik gölge yenilensin
        mLed.emissiveIntensity=t.led; mLamp.emissiveIntensity=t.lamp;
        scene.traverse(o=>{ const m=o.material; if(m&&m.isMeshStandardMaterial&&!Array.isArray(m)) m.envMapIntensity=(m.metalness>0.5?1.3:0.6)*t.env; });
        winMats.forEach(m=>{ const wt=m.userData.winTex; m.emissive.setHex(isLight?0x000000:0xffd9a0);
          m.emissiveMap=isLight?null:(wt||m.map); m.emissiveIntensity=isLight?0:(wt?t.win:t.win*0.35); m.needsUpdate=true; });
        dirty=true;
      };

      // ── Kamera: hedef etrafında küresel yörünge (azimut / yükseklik açısı / mesafe) ──
      // Sürükle = 360° döndür (+ dikeyde sınırlı eğim), pinch / tekerlek = sınırlı yakınlaştırma; yerin altına inmez.
      // Açılar dikeyden (polar) tanımlı: el = π/2 − polar. Kullanıcı sınırı polar 0.35–0.82 (ufuk boş görünmesin),
      // genel bakış polar 0.48 (kuş bakışı), tesis odakları polar 0.50–0.78.
      const HALF=Math.PI/2, POL_MIN=0.35, POL_MAX=0.82, POL_OVR=0.48, POL_F0=0.50, POL_F1=0.78;
      const EL0=HALF-POL_MAX, EL1=HALF-POL_MIN, wrapA=a=>Math.atan2(Math.sin(a),Math.cos(a));
      const sph={az:0,el:0.7,d:80}, tsph={az:0,el:0.7,d:80}; let baseD=80, idleT=0;
      const clampD=d=>Math.max(Math.max(9,baseD*0.4),Math.min(Math.min(170,baseD*1.8),d));
      const focus=(id)=>{
        curId=id;
        const f=HUB_FACILITIES.find(x=>x.id===id), cam=f?f.cam:HUB_OVERVIEW.cam;
        if(f) tgtLook.set(f.pos[0],1,f.pos[2]); else tgtLook.set(...HUB_OVERVIEW.look);
        const ox=cam[0]-tgtLook.x, oy=cam[1]-tgtLook.y, oz=cam[2]-tgtLook.z, len=Math.hypot(ox,oy,oz)||1;
        baseD=len*distK;
        tsph.az=sph.az+wrapA(Math.atan2(ox,oz)-sph.az); const pol=f?Math.max(POL_F0,Math.min(POL_F1,HALF-Math.asin(oy/len))):POL_OVR;
        tsph.el=HALF-pol; tsph.d=baseD;
        idleT=0; dirty=true;
      };

      // Dokunma / fare: tek parmak döndürür, iki parmak yakınlaştırır, kısa dokunuş tesis seçer (raycast)
      const ray=new THREE.Raycaster(), ndc=new THREE.Vector2();
      const ptrs=new Map(); let downAt=null, pinch0=0, pinchD0=0;
      const pinchLen=()=>{ const [a,b]=[...ptrs.values()]; return Math.hypot(a.x-b.x,a.y-b.y); };
      const onDown=e=>{
        ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY}); try{ cv.setPointerCapture(e.pointerId); }catch(_){}
        if(ptrs.size===1) downAt={x:e.clientX,y:e.clientY};
        else { downAt=null; if(ptrs.size===2){ pinch0=pinchLen(); pinchD0=tsph.d; } }
        idleT=0;
      };
      const onMove=e=>{
        const p=ptrs.get(e.pointerId); if(!p) return;
        const dx=e.clientX-p.x, dy=e.clientY-p.y; p.x=e.clientX; p.y=e.clientY; idleT=0;
        if(ptrs.size===1){ tsph.az-=dx*0.0068; tsph.el=Math.max(EL0,Math.min(EL1,tsph.el+dy*0.004)); }
        else if(ptrs.size===2&&pinch0>0){ const d=pinchLen(); if(d>1) tsph.d=clampD(pinchD0*pinch0/d); }
      };
      const onUp=e=>{
        if(!ptrs.delete(e.pointerId)) return;
        if(ptrs.size<2) pinch0=0;
        if(e.type!=="pointerup"||!downAt||ptrs.size){ if(!ptrs.size) downAt=null; return; }
        const moved=Math.hypot(e.clientX-downAt.x,e.clientY-downAt.y); downAt=null;
        if(moved>8) return;
        const r=cv.getBoundingClientRect();
        ndc.set(((e.clientX-r.left)/r.width)*2-1,-((e.clientY-r.top)/r.height)*2+1);
        ray.setFromCamera(ndc,camera);
        const hit=ray.intersectObjects(Object.values(groups),true)[0];
        let o=hit&&hit.object; while(o&&!o.userData.fid) o=o.parent;
        setSel(o?o.userData.fid:null);
      };
      const onWheel=e=>{ e.preventDefault(); tsph.d=clampD(tsph.d*Math.exp(Math.max(-1,Math.min(1,e.deltaY*0.01))*0.12)); idleT=0; };
      cv.addEventListener("pointerdown",onDown); cv.addEventListener("pointermove",onMove);
      cv.addEventListener("pointerup",onUp); cv.addEventListener("pointercancel",onUp);
      cv.addEventListener("wheel",onWheel,{passive:false});

      let frame=0, last=performance.now(), t=0;
      const v3=new THREE.Vector3();
      const resize=()=>{
        const w=host.clientWidth||1,h=host.clientHeight||1;
        renderer.setSize(w,h,false); camera.aspect=w/h;
        const a=w/h, k0=distK; distK=a<0.8?Math.min(2.1,0.75/a+0.45):1; camera.fov=a<0.8?44:34;
        if(k0!==distK){ const q=distK/k0; baseD*=q; tsph.d*=q; sph.d*=q; }   // kullanıcının açısı korunur
        scene.fog.density=fogBase/distK;
        camera.updateProjectionMatrix(); dirty=true;
      };
      ro=typeof ResizeObserver!=="undefined"?new ResizeObserver(resize):null;
      if(ro) ro.observe(host); else window.addEventListener("resize",resize);
      resize();

      const loop=(now)=>{
        if(disposed) return;
        raf=requestAnimationFrame(loop);
        const dt=Math.min(0.05,(now-last)/1000); last=now; frame++;
        // 30 fps yeterli (kamera geçişi dahil yumuşak); mobil pil/ısı için yarım hız
        if(frame&1) return;
        const dt2=dt*2; t+=dt2;
        const k=1-Math.pow(0.0025,dt2), kc=1-Math.pow(0.0003,dt2);
        idleT+=dt2;
        if(idleT>5&&!ptrs.size) tsph.az+=dt2*((apiRef.current&&apiRef.current.sel)?0.02:0.04);   // boşta yavaş tur
        camLook.lerp(tgtLook,k);
        sph.az+=(tsph.az-sph.az)*kc; sph.el+=(tsph.el-sph.el)*kc; sph.d+=(tsph.d-sph.d)*kc;
        const ce=Math.cos(sph.el);
        camera.position.set(camLook.x+Math.sin(sph.az)*ce*sph.d,camLook.y+Math.sin(sph.el)*sph.d,camLook.z+Math.cos(sph.az)*ce*sph.d);
        camera.lookAt(camLook);
        waterTex.offset.y-=dt2*0.035;                                    // nehir akıntısı
        // Otobüs: sağ şeritte, ~5 birim/sn
        busU=(busU+dt2*5/RING_LEN)%1;
        ring.getPointAt(busU,busLane); ring.getTangentAt(busU,busTg);
        bus.position.set(busLane.x-busTg.z*1.15,0,busLane.z+busTg.x*1.15);
        bus.lookAt(bus.position.x+busTg.x,0,bus.position.z+busTg.z);
        // Bayraklar
        flags.forEach(f=>{ const a=f.geo.attributes.position.array, b=f.base;
          for(let i=0;i<a.length;i+=3){ const x=b[i]; a[i+2]=Math.sin(x*3.2-t*6+f.phase+b[i+1]*1.5)*0.12*x; }
          f.geo.attributes.position.needsUpdate=true; });
        renderer.render(scene,camera);
        dirty=false;
        // Yüzen rozetler: 3D çapa → ekran
        const w=host.clientWidth,h=host.clientHeight;
        HUB_FACILITIES.forEach(f=>{
          const el=badgeRefs.current[f.id]; if(!el) return;
          v3.set(f.pos[0],f.bh,f.pos[2]).project(camera);
          const vis=v3.z<1&&v3.x>-1.2&&v3.x<1.2&&v3.y>-1.2&&v3.y<1.2;
          el.style.display=vis?"flex":"none";
          if(vis) el.style.transform=`translate(-50%,-100%) translate(${(v3.x*0.5+0.5)*w}px,${(-v3.y*0.5+0.5)*h}px)`;
        });
      };
      // Merkez sekmesi görünmüyorsa (sekme gizli / ekran dışı) döngü tamamen durur
      let onScreen=true;
      const start=()=>{ if(!raf&&!disposed&&onScreen&&!document.hidden){ last=performance.now(); raf=requestAnimationFrame(loop); } };
      const stop=()=>{ if(raf){ cancelAnimationFrame(raf); raf=0; } };
      const onVis=()=>{ if(document.hidden) stop(); else start(); };
      document.addEventListener("visibilitychange",onVis);
      const io=typeof IntersectionObserver!=="undefined"?new IntersectionObserver(es=>{ onScreen=es[es.length-1].isIntersecting; if(onScreen) start(); else stop(); }):null;
      if(io) io.observe(host);

      focus(null); sph.az=tsph.az; sph.el=tsph.el; sph.d=tsph.d; camLook.copy(tgtLook);
      apiRef.current={focus,applyTone,sel:null};
      applyTone(isLightTheme());
      shadowDirty();
      start();
      setReady(true);

      apiRef.current.cleanup=()=>{
        stop(); document.removeEventListener("visibilitychange",onVis); if(io) io.disconnect();
        cv.removeEventListener("pointerdown",onDown); cv.removeEventListener("pointermove",onMove);
        cv.removeEventListener("pointerup",onUp); cv.removeEventListener("pointercancel",onUp); cv.removeEventListener("wheel",onWheel);
        if(!ro) window.removeEventListener("resize",resize);
        [skyTex.light,skyTex.dark].forEach(x=>x&&x.dispose());
        winMats.forEach(m=>m.userData.winTex&&m.userData.winTex.dispose());
        flagGeoBase.dispose();
        if(groundMacro.value) groundMacro.value.dispose();
        atlasMats.forEach(m=>{ if(m.map) m.map.dispose(); m.dispose(); });   // sahneye hiç girmemiş olabilir (yükleme hatası)
      };
    }).catch(()=>{ if(!disposed) setFailed(true); });

    return ()=>{
      disposed=true;
      if(raf) cancelAnimationFrame(raf);
      if(ro) ro.disconnect();
      if(apiRef.current&&apiRef.current.cleanup) apiRef.current.cleanup();
      if(scene){
        const geos=new Set(), mats=new Set(), texs=new Set();
        scene.traverse(o=>{ if(o.geometry) geos.add(o.geometry); if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>mats.add(m)); });
        mats.forEach(m=>["map","emissiveMap","normalMap","roughnessMap","metalnessMap","aoMap","alphaMap","bumpMap"].forEach(k=>{ if(m[k]) texs.add(m[k]); }));
        geos.forEach(g=>g.dispose()); mats.forEach(m=>m.dispose()); texs.forEach(x=>x.dispose());
        scene.environment=null; scene.clear&&scene.clear();
      }
      if(envRT) envRT.dispose();
      if(pmrem) pmrem.dispose();
      if(renderer){
        renderer.dispose(); try{ renderer.forceContextLoss(); }catch(e){}
        const cv=renderer.domElement; if(cv&&cv.parentNode) cv.parentNode.removeChild(cv);
      }
      apiRef.current=null; renderer=null; scene=null;
    };
  },[]);

  // Tema değişimi → sahne tonu
  useEffect(()=>{ if(apiRef.current) apiRef.current.applyTone(light); },[light,ready]);
  // Seçim → kamera odak
  useEffect(()=>{ if(apiRef.current){ apiRef.current.sel=sel; apiRef.current.focus(sel); } },[sel,ready]);

  // ── Özet verileri ────────────────────────────────────────────
  const injured=squad.filter(p=>(p.injured||0)>0);
  const avgFit=squad.length?Math.round(squad.reduce((a,p)=>a+(100-(p.fatigue||0)),0)/squad.length):100;
  const nextFix=season&&season.fixture&&season.fixture[0];
  const topYouth=[...youth].sort((a,b)=>(b.pot||0)-(a.pot||0))[0];
  const F=HUB_FACILITIES.find(f=>f.id===sel);
  const stat=(l,v,c)=>(
    <div style={{flex:1,minWidth:70,background:C.surface,border:`1px solid ${C.brd2}`,borderRadius:8,padding:"6px 8px"}}>
      <div style={{fontSize:".42rem",color:C.dim,letterSpacing:.6,textTransform:"uppercase",fontWeight:700}}>{l}</div>
      <div style={{fontSize:".72rem",fontWeight:900,color:c||C.wh,marginTop:1}}>{v}</div>
    </div>
  );
  const go=(p,l)=>(
    <button key={p} onClick={()=>onNavigate(p)} style={{flex:1,padding:"8px 10px",borderRadius:8,cursor:"pointer",
      border:"none",background:`linear-gradient(135deg,${F?F.col:C.ac},${F?F.col:C.ac}cc)`,color:"#fff",
      fontSize:".56rem",fontWeight:800,letterSpacing:.5,fontFamily:"inherit"}}>{l} →</button>
  );
  const card=()=>{
    if(!F) return null;
    let body=null, acts=null;
    if(F.id==="stadium"){ body=<>{stat("Seyirci",`%${fans?.attendance??0}`)}{stat("Taraftar Mutluluğu",`%${fans?.happiness??0}`,C.grn2)}{stat("Bütçe",fmtSal(transferBudget),C.gd)}</>; acts=[go("finans","Finans & Stadyum")]; }
    if(F.id==="training"){ body=<>{stat("Kadro",`${squad.length} oyuncu`)}{stat("Ort. Kondisyon",`%${avgFit}`,avgFit>=70?C.grn2:C.gd)}{stat("Sonraki Rakip",nextFix?nextFix.opp:"—")}</>; acts=[go("antrenman","Antrenman"),go("formasyon","Formasyon")]; }
    if(F.id==="fitness"){ const tired=squad.filter(p=>(p.fatigue||0)>=30).length;
      body=<>{stat("Ort. Kondisyon",`%${avgFit}`,avgFit>=70?C.grn2:C.gd)}{stat("Yorgun",`${tired} oyuncu`,tired?C.gd:C.grn2)}{stat("Kadro",`${squad.length} oyuncu`)}</>; acts=[go("antrenman","Kondisyon Antrenmanı")]; }
    if(F.id==="medical"){ body=<>{stat("Sakat",injured.length,injured.length?C.red2:C.grn2)}{stat("Ort. Kondisyon",`%${avgFit}`,avgFit>=70?C.grn2:C.gd)}
      <div style={{flexBasis:"100%",fontSize:".5rem",color:C.dim}}>{injured.length?injured.slice(0,4).map(p=>`${p.n} (${p.injured} hf)`).join(" · "):"Kadroda sakat oyuncu yok."}</div></>; acts=[go("kadro","Kadro Durumu")]; }
    if(F.id==="academy"){ body=<>{stat("Altyapı",`${youth.length} oyuncu`)}{stat("En Yetenekli",topYouth?`${topYouth.n}`:"—",C.pur2)}{stat("En Yüksek POT",topYouth?topYouth.pot:"—",C.pur2)}</>; acts=[go("yetenek","Altyapı")]; }
    if(F.id==="admin"){ body=<>{stat("İtibar",rep?rep.pts:0,C.gd)}{stat("Taraftar Güveni",`%${fans?.trust??0}`)}{stat("Transfer Bütçesi",fmtSal(transferBudget),C.grn2)}</>; acts=[go("transfer","Transfer"),go("taraftar","İlişkiler")]; }
    return(
      <div className="fade-in-up" style={{position:"absolute",left:62,right:8,bottom:8,zIndex:3,
        background:light?"rgba(255,255,255,.72)":"rgba(10,22,45,.66)",backdropFilter:"blur(8px) saturate(1.3)",WebkitBackdropFilter:"blur(8px) saturate(1.3)",border:`1px solid ${light?"rgba(255,255,255,.65)":"rgba(148,180,230,.22)"}`,borderTop:`3px solid ${F.col}`,borderRadius:12,
        padding:"10px 12px",boxShadow:"0 8px 28px rgba(0,0,0,.25)"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
          <span style={{fontSize:"1rem"}}>{F.icon}</span>
          <div style={{flex:1,fontSize:".72rem",fontWeight:900,color:C.wh,letterSpacing:.5}}>{F.name}</div>
          <button onClick={()=>setSel(null)} title="Kampüse dön" style={{background:C.surface,border:`1px solid ${C.brd2}`,
            borderRadius:6,color:C.dim,cursor:"pointer",padding:"3px 6px",display:"flex"}}><AppIcon name="close" size={12}/></button>
        </div>
        <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:8}}>{body}</div>
        <div style={{display:"flex",gap:6}}>{acts}</div>
      </div>
    );
  };

  return(
    <div ref={hostRef} style={{flex:1,position:"relative",overflow:"hidden",minHeight:0,
      background:light?"linear-gradient(180deg,#bfe3ff,#e8f5ff)":"linear-gradient(180deg,#071226,#0a1a33)"}}>
      {!ready&&!failed&&<div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",
        fontSize:".6rem",color:C.dim}}>Kampüs yükleniyor…</div>}
      {failed&&<div style={{position:"absolute",top:12,left:64,right:12,fontSize:".55rem",color:C.dim}}>
        3D kampüs bu cihazda açılamadı — soldaki tesis ikonlarını kullanabilirsin.</div>}

      {/* Kulüp adı */}
      <div style={{position:"absolute",top:10,left:62,zIndex:2,pointerEvents:"none",
        fontSize:".7rem",fontWeight:900,letterSpacing:2,color:light?"#0f172a":"#f8fafc",
        textShadow:light?"0 1px 0 rgba(255,255,255,.7)":"0 1px 6px rgba(0,0,0,.6)",fontFamily:"'Barlow Condensed',sans-serif"}}>
        {clubName.toUpperCase()} · KAMPÜS</div>

      {/* Yüzen rozetler */}
      {ready&&HUB_FACILITIES.map(f=>(
        <div key={f.id} ref={el=>{badgeRefs.current[f.id]=el;}} onClick={()=>setSel(f.id)}
          style={{position:"absolute",left:0,top:0,zIndex:2,display:"none",alignItems:"center",gap:4,cursor:"pointer",
            padding:"3px 8px 3px 4px",borderRadius:14,whiteSpace:"nowrap",
            background:sel===f.id?f.col:(light?"rgba(255,255,255,.92)":"rgba(10,22,45,.85)"),
            border:`1.5px solid ${f.col}`,boxShadow:"0 3px 10px rgba(0,0,0,.25)",
            color:sel===f.id?"#fff":(light?"#0f172a":"#f8fafc"),fontSize:".5rem",fontWeight:800,willChange:"transform"}}>
          <span style={{fontSize:".7rem"}}>{f.icon}</span>{f.name}
        </div>
      ))}

      {/* Sol: yuvarlak tesis ikonları */}
      <div style={{position:"absolute",left:8,top:"50%",transform:"translateY(-50%)",zIndex:3,
        display:"flex",flexDirection:"column",gap:8}}>
        {HUB_FACILITIES.map(f=>{
          const a=sel===f.id;
          return(
            <button key={f.id} onClick={()=>setSel(a?null:f.id)} title={f.name} style={{
              width:42,height:42,borderRadius:"50%",cursor:"pointer",fontSize:"1.1rem",
              display:"flex",alignItems:"center",justifyContent:"center",padding:0,
              background:a?f.col:C.card,border:`2px solid ${a?"#fff":f.col}`,
              boxShadow:a?`0 0 0 3px ${f.col}55,0 4px 14px rgba(0,0,0,.3)`:"0 3px 10px rgba(0,0,0,.22)"}}>{f.icon}</button>
          );
        })}
      </div>

      {card()}
    </div>
  );
}
