// ═══════════════════════════════════════════════════════════════
// 3D KULÜP KAMPÜSÜ (Club Hub) — "Merkez" sekmesi
// Prosedürel, PBR malzemeli spor kompleksi (tuval dokuları + MeshStandardMaterial):
//   • Arena: beton kolon + cam panelli cephe, çelik kafes çatı, LED şerit, dalgalanan kulüp
//     bayrakları, giriş turnikeleri, takım otobüsü cebi
//   • Kulüp Plazası: yansımalı cam kule, kat çizgileri, cam sundurma, kulüp amblemi, çeşme
//   • Sağlık & Performans: beyaz-cam bina, tartan koşu pisti, açık hava kondisyon alanı
//   • Antrenman / Akademi: biçme şeritli sahalar, ağlı kaleler, köşe bayrakları, kuklalar, kulübeler
//   • Gökyüzü kubbesi (bulutlu / yıldızlı) + ondan üretilen ortam yansıması (PMREM)
//   • Çevre yolunda dönen takım otobüsü; ağaçlar hazır .glb (assets/models/campus/, CC0)
// Performans: DPR ≤ 1.5; gölge haritası statik; sekme gizliyken çizim yok; boşta 30 fps;
// unmount'ta geometri/materyal/doku/PMREM/renderer dispose edilir.
// ═══════════════════════════════════════════════════════════════
const HUB_FACILITIES=[
  {id:"stadium", icon:"🏟️",name:"Stadyum",          pos:[0,0,-10],  cam:[0,26,14],   bh:10.5,col:"#2563eb"},
  {id:"training",icon:"⚽", name:"Antrenman Sahası", pos:[-24,0,8],  cam:[-14,18,26], bh:3.5, col:"#16a34a"},
  {id:"medical", icon:"🏥", name:"Sağlık & Fitness", pos:[21,0,4],   cam:[14,16,22],  bh:7.5, col:"#dc2626"},
  {id:"academy", icon:"🌟", name:"Akademi Sahası",   pos:[-15,0,26], cam:[-8,16,42],  bh:5,   col:"#9333ea"},
  {id:"admin",   icon:"🏢", name:"Yönetim Binası",   pos:[17,0,24],  cam:[10,18,42],  bh:16,  col:"#b45309"},
];
const HUB_OVERVIEW={cam:[0,56,62],look:[0,0,7]};
const HUB_MODEL_DIR="assets/models/";

// Tema → sahne ışık/sis/pozlama değerleri
const hubSceneTone=(light)=>light
  ?{fog:0xd3e7f6,fogD:0.0042,amb:0,hemiSky:0xcfe6ff,hemiGround:0x4a5e2e,hemi:0.38,sun:1.65,sunCol:0xffe2b8,flood:0,led:1.4,win:0,lamp:0,exp:0.92,env:0.55}
  :{fog:0x111d33,fogD:0.0068,amb:0.05,hemiSky:0x22365e,hemiGround:0x0b1a12,hemi:0.32,sun:0.22,sunCol:0x9fb8ff,flood:2.2,led:3.2,win:1.25,lamp:1.6,exp:0.95,env:0.35};

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

// Organik çok tonlu çim (512², kenarları sarmalı → dikişsiz tekrar)
function hubGrassTex(THREE){
  const t=hubCanvasTex(THREE,512,512,(g,w,h)=>{
    const wrap=(x,y,r,fn)=>{ for(const ox of [-w,0,w]) for(const oy of [-h,0,h]) if(x+ox>-r&&x+ox<w+r&&y+oy>-r&&y+oy<h+r) fn(x+ox,y+oy); };
    g.fillStyle="#5a8f43"; g.fillRect(0,0,w,h);
    // Geniş, yumuşak renk geçişleri (zeytin / çimen / koyu yeşil)
    const tones=["rgba(108,132,58,","rgba(74,124,48,","rgba(52,96,38,","rgba(132,164,78,","rgba(96,118,52,"];
    for(let i=0;i<70;i++){ const x=Math.random()*w, y=Math.random()*h, r=30+Math.random()*90, tc=tones[i%tones.length], a=.10+Math.random()*.14;
      wrap(x,y,r,(px,py)=>{ const gr=g.createRadialGradient(px,py,0,px,py,r); gr.addColorStop(0,tc+a+")"); gr.addColorStop(1,tc+"0)"); g.fillStyle=gr; g.fillRect(px-r,py-r,2*r,2*r); }); }
    // İnce çim sapları
    const blades=["#3f7330","#4d8538","#6a9a48","#7fae58","#8a9c4c","#35652a","#9bbd6a"];
    g.lineCap="round";
    for(let i=0;i<16000;i++){ const x=Math.random()*w, y=Math.random()*h, l=2+Math.random()*5, a=-Math.PI/2+(Math.random()-.5)*1.1;
      g.strokeStyle=blades[(Math.random()*blades.length)|0]; g.globalAlpha=.25+Math.random()*.45; g.lineWidth=.6+Math.random()*.8;
      const dx=Math.cos(a)*l, dy=Math.sin(a)*l; wrap(x,y,8,(px,py)=>{ g.beginPath(); g.moveTo(px,py); g.lineTo(px+dx,py+dy); g.stroke(); }); }
    g.globalAlpha=1;
    // Toprak / kuru ot grenleri
    hubNoise(g,w,h,5000,["#6b6a3a","#a2ad6a","#2f5626","#7c9446"],.35);
  },30,30);
  t.wrapS=t.wrapT=THREE.RepeatWrapping;
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
// Gökyüzü kubbesi (eşdikdörtgensel): gündüz bulutlu, gece yıldızlı
function hubSkyTex(THREE,light){
  return hubCanvasTex(THREE,1024,512,(g,w,h)=>{
    const gr=g.createLinearGradient(0,0,0,h);
    if(light){ gr.addColorStop(0,"#2f74c0"); gr.addColorStop(.32,"#6aa9e3"); gr.addColorStop(.49,"#dcedf9"); gr.addColorStop(.52,"#d3e7f6"); gr.addColorStop(1,"#c4d8e6"); }
    else { gr.addColorStop(0,"#02050d"); gr.addColorStop(.35,"#08132a"); gr.addColorStop(.49,"#1d2f52"); gr.addColorStop(.52,"#111d33"); gr.addColorStop(1,"#0a1222"); }
    g.fillStyle=gr; g.fillRect(0,0,w,h);
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
function hubLoadGlb(THREE,name,isAlive){
  if(typeof loadGltfLoader!=="function"||typeof assets3dBuffer!=="function") return Promise.resolve(null);
  return Promise.all([loadGltfLoader(),assets3dBuffer(name)]).then(([Loader,buf])=>new Promise(res=>{
    if(!Loader||!buf||!isAlive()) return res(null);
    try{
      new Loader().parse(buf.slice(0),HUB_MODEL_DIR,gl=>{
        const root=gl&&(gl.scene||(gl.scenes&&gl.scenes[0]));
        if(!root) return res(null);
        root.updateMatrixWorld(true);
        const out=new THREE.Group();
        root.traverse(m=>{ if(m.isMesh){ const gg=m.geometry.clone(); gg.applyMatrix4(m.matrixWorld);
          const mm=new THREE.Mesh(gg,m.material); mm.castShadow=true; mm.receiveShadow=true; out.add(mm); m.geometry.dispose(); } });
        if(!isAlive()){ out.traverse(m=>{ if(m.geometry) m.geometry.dispose(); }); return res(null); }
        res(out);
      },()=>res(null));
    }catch(e){ res(null); }
  })).catch(()=>null);
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

      // ── Işıklar ──
      const amb=new THREE.AmbientLight(0xffffff,0); scene.add(amb);
      const hemi=new THREE.HemisphereLight(0xcfe6ff,0x5b6e3a,0.55); scene.add(hemi);
      const sun=new THREE.DirectionalLight(0xffe7c4,2.4);
      sun.position.set(-38,62,26); sun.target.position.set(-1,0,7);
      sun.castShadow=true; sun.shadow.mapSize.set(2048,2048);
      Object.assign(sun.shadow.camera,{left:-48,right:48,top:48,bottom:-48,near:10,far:170});
      sun.shadow.bias=-0.0005; sun.shadow.normalBias=0.05; sun.shadow.radius=4;
      scene.add(sun); scene.add(sun.target);
      const floods=[];
      [[-10,9,-16],[10,9,-16],[-10,9,-4],[10,9,-4]].forEach(p=>{
        const l=new THREE.PointLight(0xeaf2ff,0,42,1.3); l.position.set(...p); scene.add(l); floods.push(l);
      });

      // ── Malzemeler ──
      const M=(c,o={})=>new THREE.MeshStandardMaterial({color:c,roughness:0.85,metalness:0,...o});
      const T={grass:hubGrassTex(THREE),pitch:hubPitchTex(THREE),park:hubParkingTex(THREE),plaza:hubPlazaTex(THREE)};
      const mGround=M(0xffffff,{map:T.grass,roughness:0.92}), mPitch=M(0xffffff,{map:T.pitch,roughness:0.95}), mPark=M(0xffffff,{map:T.park});
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
        const NC=170, junc=[[0,44],[-37,14.5],[35,14.5]], m4=new THREE.Matrix4(), q=new THREE.Quaternion(), sc=new THREE.Vector3(), pp=new THREE.Vector3(), up2=new THREE.Vector3(0,1,0), mats=[];
        for(let i=0;i<NC;i++){ const u0=i/NC, u1=(i+1)/NC, a=ring.getPointAt(u0), b=ring.getPointAt(u1%1), tg=b.clone().sub(a), len=tg.length(); tg.normalize();
          const nx=-tg.z, nz=tg.x, mx=(a.x+b.x)/2, mz=(a.z+b.z)/2;
          [-1,1].forEach(s=>{ const x=mx+nx*s*2.42, z=mz+nz*s*2.42;
            const inner=Math.hypot(x+1,z-7)<Math.hypot(mx+1,mz-7);
            if(inner&&junc.some(([jx,jz])=>Math.hypot(x-jx,z-jz)<3.4)) return;
            q.setFromAxisAngle(up2,Math.atan2(tg.x,tg.z)); sc.set(1,1,len+0.04); pp.set(x,0.06,z); mats.push(m4.compose(pp,q,sc).clone()); }); }
        const ci=new THREE.InstancedMesh(new THREE.BoxGeometry(0.22,0.12,1),mCurb,mats.length); ci.receiveShadow=true;
        mats.forEach((m,i)=>ci.setMatrixAt(i,m)); scene.add(ci);
      }
      // Sokak lambaları (instanced): bulvar + çevre yolu
      {const lp=[]; for(let z=5;z<=41;z+=6) [-3.3,3.3].forEach(x=>lp.push([x,z,x<0?0:Math.PI]));
        for(let i=0;i<26;i++){ const u=i/26, p=ring.getPointAt(u), tg=ring.getTangentAt(u); const nx=-tg.z, nz=tg.x; lp.push([p.x+nx*3.1,p.z+nz*3.1,Math.atan2(-nx,-nz)+Math.PI/2]); }
        const gPole=new THREE.CylinderGeometry(0.07,0.11,4,6).translate(0,2,0), gArm=new THREE.BoxGeometry(0.9,0.08,0.08).translate(0.42,3.95,0), gHead=new THREE.BoxGeometry(0.5,0.12,0.26).translate(0.82,3.88,0);
        const mk=(geo,mat,cast)=>{ const im=new THREE.InstancedMesh(geo,mat,lp.length); im.castShadow=cast; const m4=new THREE.Matrix4(), q=new THREE.Quaternion(), s=new THREE.Vector3(1,1,1), p=new THREE.Vector3(), up=new THREE.Vector3(0,1,0);
          lp.forEach(([x,z,r],i)=>{ q.setFromAxisAngle(up,r); p.set(x,0,z); m4.compose(p,q,s); im.setMatrixAt(i,m4); }); scene.add(im); };
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
        box(4,2.4,3,fm,8.8,1.2,-1.5,g); box(4.4,0.2,3.4,mSteelDark,8.8,2.5,-1.5,g);
        flagPole(g,-6.6,0,-4.6,3.6,0); flagPole(g,6.6,0,-4.6,3.6,0);
      }
      // ═══ 3) SAĞLIK & PERFORMANS MERKEZİ ═══
      {const g=G.medical;
        const fm=M(0xffffff,{map:hubWhiteFacadeTex(THREE),roughness:0.55,metalness:0.05}); winMats.push(fm);
        box(8,4.6,5,fm,-4.5,2.3,-2,g); box(8.4,0.3,5.4,mConcrete,-4.5,4.75,-2,g);
        box(3.6,3.2,3.6,mGlass,0.8,1.6,-2.6,g,{cast:false}); box(3.8,0.2,3.8,mWhite,0.8,3.3,-2.6,g);
        // Haç tabelası (çatı)
        box(1.4,0.42,0.14,mRed,-4.5,5.6,0.5,g); box(0.42,1.4,0.14,mRed,-4.5,5.6,0.5,g); box(0.12,0.8,0.12,mSteelDark,-4.5,5,0.5,g);
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
      }

      // ── Takım otobüsü (çevre yolunda döner) ──
      const bus=new THREE.Group(); scene.add(bus);
      {const liv=M(0xffffff,{map:hubBusTex(THREE,col1,col2,clubRef.current||"Kulüp"),roughness:0.35,metalness:0.3});
        const bodyM=M(col1Hex,{roughness:0.35,metalness:0.3}), wind=M(0x16212e,{metalness:0.6,roughness:0.1});
        const b=add(new THREE.BoxGeometry(1.9,2,6.4),[liv,liv,bodyM,bodyM,wind,bodyM],0,1.25,0,bus,{cast:false});
        const gw=new THREE.CylinderGeometry(0.38,0.38,0.3,12); gw.rotateZ(Math.PI/2);
        [[-0.85,-2.2],[0.85,-2.2],[-0.85,2.1],[0.85,2.1]].forEach(([x,z])=>add(gw,mTyre,x,0.38,z,bus,{cast:false}));
        const blob=add(new THREE.PlaneGeometry(2.4,7),new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:0.28,depthWrite:false}),0,0.05,0,bus,{cast:false}); blob.rotation.x=-Math.PI/2;
      }
      const busLane=new THREE.Vector3(), busTg=new THREE.Vector3(); let busU=0.12; const RING_LEN=ring.getLength();

      // ── Ağaç kümeleri (glb, instanced, ton varyasyonlu) ──
      const R=(a,b)=>a+Math.random()*(b-a);
      const inRing=(x,z,m=0)=>x>RX0-m&&x<RX1+m&&z>RZ0-m&&z<RZ1+m;
      const blocked=(x,z)=>(Math.abs(x)<5&&z>2&&z<44)||(Math.abs(z-14.5)<4.5&&x>-38&&x<36)
        ||HUB_FACILITIES.some(f=>Math.hypot(x-f.pos[0],z-f.pos[2])<(f.id==="stadium"?21:f.id==="training"?10.5:f.id==="medical"?13:9.5))
        ||(x>13&&x<33&&z>-20&&z<-6)||(inRing(x,z,4)&&!inRing(x,z,-4));
      const treePts=[];
      const cluster=(cx,cz,n,rad)=>{ for(let i=0,t=0;i<n&&t<n*12;t++){ const a=Math.random()*6.28, r=Math.sqrt(Math.random())*rad, x=cx+Math.cos(a)*r, z=cz+Math.sin(a)*r; if(blocked(x,z)) continue; treePts.push([x,z,R(0.75,1.35),R(0,6.28)]); i++; } };
      for(let i=0;i<14;i++){ const a=i/14*6.28+R(-.15,.15), r=R(62,92); cluster(Math.cos(a)*r,Math.sin(a)*r*0.85+7,10,9); }
      [[-30,-18],[-29,30],[-4,36],[29,36],[30,-24],[-12,-26],[10,-27],[-31,-4],[31,15]].forEach(([x,z])=>cluster(x,z,6,5));
      for(let z=6;z<=40;z+=6) [-6,6].forEach(x=>treePts.push([x,z+3,0.8,R(0,6.28)]));
      const instance=(name,pts,h,fallbackGeo,tint)=>(name?hubLoadGlb(THREE,name,isAlive):Promise.resolve(null)).then(gl=>{
        if(!isAlive()) return;
        const mtx=new THREE.Matrix4(), q=new THREE.Quaternion(), sc=new THREE.Vector3(), p=new THREE.Vector3(), up=new THREE.Vector3(0,1,0), c=new THREE.Color();
        const parts=gl?hubFit(THREE,gl,[null,h,null]).children:fallbackGeo.map(([geo,mat])=>({geometry:geo,material:mat}));
        parts.forEach(m=>{
          const im=new THREE.InstancedMesh(m.geometry,m.material,pts.length);
          im.castShadow=true; im.receiveShadow=true;
          pts.forEach(([x,z,s,r],i)=>{ q.setFromAxisAngle(up,r); sc.setScalar(s); p.set(x,0,z); mtx.compose(p,q,sc); im.setMatrixAt(i,mtx);
            if(tint){ c.setHSL(0.24+Math.random()*0.1,0.45+Math.random()*0.35,0.34+Math.random()*0.2); im.setColorAt(i,c); } });
          im.instanceMatrix.needsUpdate=true; if(im.instanceColor) im.instanceColor.needsUpdate=true;
          scene.add(im);
        });
        shadowDirty();
      });
      instance("campus/tree-round",treePts,4.8,[[new THREE.ConeGeometry(1.3,3.6,7).translate(0,2.6,0),M(0x2f7d3a)],[new THREE.CylinderGeometry(0.15,0.2,1,5).translate(0,0.5,0),M(0x7a5233)]],true);
      const bushPts=[]; for(let i=0;i<60;i++){ const a=R(0,6.28), r=R(44,70), x=Math.cos(a)*r, z=Math.sin(a)*r*0.85+7; if(!blocked(x,z)) bushPts.push([x,z,R(0.6,1.0),R(0,6.28)]); } bushPts.push(...edgeBushPts);
      instance(null,bushPts,1.6,[[new THREE.IcosahedronGeometry(0.85,0).scale(1.2,0.8,1.2).translate(0,0.55,0),M(0x3f7f34,{flatShading:true,roughness:0.9})]],true);

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
        amb.intensity=t.amb; hemi.color.setHex(t.hemiSky); hemi.groundColor.setHex(t.hemiGround); hemi.intensity=t.hemi;
        sun.intensity=t.sun; sun.color.setHex(t.sunCol);
        floods.forEach(l=>l.intensity=t.flood);
        mLed.emissiveIntensity=t.led; mLamp.emissiveIntensity=t.lamp;
        scene.traverse(o=>{ const m=o.material; if(m&&m.isMeshStandardMaterial&&!Array.isArray(m)) m.envMapIntensity=(m.metalness>0.5?1.3:0.6)*t.env; });
        winMats.forEach(m=>{ const wt=m.userData.winTex; m.emissive.setHex(isLight?0x000000:0xffd9a0);
          m.emissiveMap=isLight?null:(wt||m.map); m.emissiveIntensity=isLight?0:(wt?t.win:t.win*0.35); m.needsUpdate=true; });
        dirty=true;
      };

      // Tıklama (raycast) — sadece kısa dokunuş
      const ray=new THREE.Raycaster(), ndc=new THREE.Vector2();
      let downAt=null;
      const onDown=e=>{downAt={x:e.clientX,y:e.clientY};};
      const onUp=e=>{
        if(!downAt) return; const moved=Math.hypot(e.clientX-downAt.x,e.clientY-downAt.y); downAt=null;
        if(moved>8) return;
        const r=cv.getBoundingClientRect();
        ndc.set(((e.clientX-r.left)/r.width)*2-1,-((e.clientY-r.top)/r.height)*2+1);
        ray.setFromCamera(ndc,camera);
        const hit=ray.intersectObjects(Object.values(groups),true)[0];
        let o=hit&&hit.object; while(o&&!o.userData.fid) o=o.parent;
        setSel(o?o.userData.fid:null);
      };
      cv.addEventListener("pointerdown",onDown); cv.addEventListener("pointerup",onUp);

      const focus=(id)=>{
        curId=id;
        const f=HUB_FACILITIES.find(x=>x.id===id);
        if(f){ tgtLook.set(f.pos[0],1,f.pos[2]); tgtPos.set(...f.cam); }
        else { tgtLook.set(...HUB_OVERVIEW.look); tgtPos.set(...HUB_OVERVIEW.cam); }
        tgtPos.sub(tgtLook).multiplyScalar(distK).add(tgtLook);
        dirty=true;
      };

      let frame=0, last=performance.now(), t=0, swayAmt=1;
      const v3=new THREE.Vector3();
      let focusRef=null;
      const resize=()=>{
        const w=host.clientWidth||1,h=host.clientHeight||1;
        renderer.setSize(w,h,false); camera.aspect=w/h;
        const a=w/h; distK=a<0.8?Math.min(2.1,0.75/a+0.45):1; camera.fov=a<0.8?44:34;
        scene.fog.density=fogBase/distK;
        camera.updateProjectionMatrix(); if(focusRef) focusRef(curId); dirty=true;
      };
      ro=typeof ResizeObserver!=="undefined"?new ResizeObserver(resize):null;
      if(ro) ro.observe(host); else window.addEventListener("resize",resize);
      resize();

      const loop=(now)=>{
        if(disposed) return;
        raf=requestAnimationFrame(loop);
        if(document.hidden){ last=now; return; }
        const dt=Math.min(0.05,(now-last)/1000); last=now; frame++;
        // 30 fps yeterli (kamera geçişi dahil yumuşak); mobil pil/ısı için yarım hız
        if(frame&1) return;
        const dt2=dt*2; t+=dt2;
        const k=1-Math.pow(0.0025,dt2);
        camPos.lerp(tgtPos,k); camLook.lerp(tgtLook,k);
        swayAmt+=(((apiRef.current&&apiRef.current.sel)?0:1)-swayAmt)*k;
        const sway=Math.sin(t*0.22)*1.4*swayAmt;
        camera.position.set(camPos.x+sway,camPos.y,camPos.z);
        camera.lookAt(camLook);
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
      focusRef=focus; focus(null); camPos.copy(tgtPos); camLook.copy(tgtLook);
      apiRef.current={focus,applyTone,sel:null};
      applyTone(isLightTheme());
      shadowDirty();
      raf=requestAnimationFrame(loop);
      setReady(true);

      apiRef.current.cleanup=()=>{
        cv.removeEventListener("pointerdown",onDown); cv.removeEventListener("pointerup",onUp);
        if(!ro) window.removeEventListener("resize",resize);
        [skyTex.light,skyTex.dark].forEach(x=>x&&x.dispose());
        winMats.forEach(m=>m.userData.winTex&&m.userData.winTex.dispose());
        flagGeoBase.dispose();
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
        mats.forEach(m=>["map","emissiveMap","normalMap","roughnessMap","metalnessMap","aoMap","alphaMap"].forEach(k=>{ if(m[k]) texs.add(m[k]); }));
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
              width:44,height:44,borderRadius:"50%",cursor:"pointer",fontSize:"1.1rem",
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
