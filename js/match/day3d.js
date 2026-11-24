// ═══════════════════════════════════════════════════════════════
// 3D GÜNDÜZ SAHNESİ — kilit an / vuruş ekranı (Pitch3D day=true)
// ═══════════════════════════════════════════════════════════════
// Yalnız kilit anın kendi Pitch3D'si gündüzdür; canlı maç sahnesi (overlay) değişmez.
//   day3dSkyDome(THREE)              → prosedürel mavi gök + bulut kubbesi (Mesh, BackSide, fog yok)
//   day3dLights(THREE,scene,lowEnd)  → güneş (DirectionalLight, gölgeli) + HemisphereLight
//   day3dTrees(THREE,pts)            → stilize ağaçlar: TEK InstancedMesh (1 çizim çağrısı)
//   day3dTex(THREE,kind)             → paylaşılan tuvallerden yeni CanvasTexture
//                                      (kind: "roof" oluklu çatı · "net" file örgüsü · "grassBump")
// Renk hattı: renderer doğrusal çıktı verir (r128 varsayılanı, outputEncoding = LinearEncoding);
//   bütün sahne renkleri buna göre ayarlı. Tuval dokuları da varsayılan LinearEncoding'de kalır →
//   tuvaldeki renk ekranda aynen görünür (sRGB'ye geçmek tüm paleti yeniden ayarlamayı gerektirir).
// Bellek: tuvaller modül düzeyinde bir kez çizilir (sonraki kilit anlarında takılma yok); dokular,
//   geometriler ve malzemeler sahneye eklenir ve Pitch3D teardown'ındaki disposeObject3D(scene)
//   ile serbest kalır (malzemenin map/bumpMap/alphaMap alanlarındaki dokular dahil).
// Yükleme sırası: yalnız fonksiyon/sabit tanımlar; çalışma anında pitch3d.js/stadium3d.js çağırır.
// ═══════════════════════════════════════════════════════════════

const DAY3D_CANVAS={sky:null,roof:null,net:null,grassBump:null,wear:null,grass:null,grassRough:null,crowd:null,ao:null,grassDetail:null};
// Güneş yönü (dünya; sahanın sol-arka üstü → gölgeler sağ-öne düşer) ve gökyüzü/pus renkleri
const DAY3D_SUN_DIR=[-0.48,0.66,0.58];   // Adım 17: daha alçak güneş → tribün/çatı gölgesi sahaya uzanır
// Canlı mavi gök: pus rengi gök kubbesinin ufuk rengiyle aynı (uzak tribün/ağaç ufka yumuşakça karışır)
const DAY3D_SKY_CLEAR=0x8fc3ec, DAY3D_FOG=0xcfe4f2;
// ACES film tonu pozlaması (pitch3d.js gündüz renderer'ı). ACES orta tonları koyulaştırır; 1.25
//   sahne paletini (doğrusal çıktıya göre ayarlı) yaklaşık aynı parlaklıkta, daha doygun gösterir.
const DAY3D_EXPOSURE=1.25;

// Tekrarlanabilir rastgele (her açılışta aynı gök/ağaç düzeni)
function day3dRand(seed){ let s=seed>>>0||1; return ()=>{ s=(s*16807)%2147483647; return (s-1)/2147483646; }; }

function day3dCanvas(kind){
  const C=DAY3D_CANVAS;
  if(C[kind]||typeof document==="undefined") return C[kind];
  try{
    if(kind==="sky"){
      // Eşdikdörtgen gök: y=0 tepe (küre uv v=1), y=H/2 ufuk. Bulutlar ufkun üstündeki bantta,
      //   tepeye yakın değil (kutupta gerilmesin); yatayda dikişsiz (x±W'de de çizilir).
      const W=1024, H=512, cv=document.createElement("canvas"); cv.width=W; cv.height=H;
      const g=cv.getContext("2d"); if(!g) return null;
      const gr=g.createLinearGradient(0,0,0,H);
      // Canlı yaz göğü: tepede derin mavi → ufukta açık, hafif beyazlaşan mavi (NSM tarzı parlak gök)
      gr.addColorStop(0,"#1f6fd1"); gr.addColorStop(0.22,"#3d8fe3"); gr.addColorStop(0.38,"#74b4ef");
      gr.addColorStop(0.47,"#b5d9f5"); gr.addColorStop(0.5,"#d4e8f5"); gr.addColorStop(1,"#a9c4d6");
      g.fillStyle=gr; g.fillRect(0,0,W,H);
      const r=day3dRand(97531);
      const puff=(x,y,rad,a)=>{
        for(const ox of [0,-W,W]){
          if(x+ox+rad<0||x+ox-rad>W) continue;
          g.save(); g.translate(x+ox,y); g.scale(1,0.42);
          const p=g.createRadialGradient(0,0,0,0,0,rad);
          p.addColorStop(0,"rgba(255,255,255,"+a+")"); p.addColorStop(0.55,"rgba(255,255,255,"+(a*0.55)+")");
          p.addColorStop(1,"rgba(255,255,255,0)");
          g.fillStyle=p; g.beginPath(); g.arc(0,0,rad,0,Math.PI*2); g.fill(); g.restore();
        }
      };
      // Yumuşak beyaz kümülüsler: her bulut önce geniş, soluk bir taban, sonra parlak üst kabarcıklar
      for(let c=0;c<24;c++){
        const cx=r()*W, cy=H*(0.18+r()*0.27), sz=18+r()*34*(0.6+(cy/H-0.2)*2.4);
        const n=6+Math.floor(r()*7);
        puff(cx,cy+sz*0.12,sz*2.2,0.16);
        for(let k=0;k<n;k++) puff(cx+(r()-0.5)*sz*3.2,cy+(r()-0.5)*sz*0.35-sz*0.1,sz*(0.6+r()*0.8),0.3+r()*0.35);
      }
      C.sky=cv;
    } else if(kind==="roof"){
      // Oluklu metal: tek oluk periyodu (yatayda sinüs tonu); hem map hem bumpMap
      const W=64, H=4, cv=document.createElement("canvas"); cv.width=W; cv.height=H;
      const g=cv.getContext("2d"), img=g&&g.createImageData?g.createImageData(W,H):null; if(!img) return null;
      for(let x=0;x<W;x++){
        const v=Math.round(150+95*(0.5+0.5*Math.sin(x/W*Math.PI*2)));
        for(let y=0;y<H;y++){ const j=(y*W+x)*4; img.data[j]=v; img.data[j+1]=v+3; img.data[j+2]=v+8; img.data[j+3]=255; }
      }
      g.putImageData(img,0,0); C.roof=cv;
    } else if(kind==="net"){
      // File örgüsü (alphaMap: beyaz = tel, siyah = boşluk). Köşegenler → dikişsiz baklava örgü
      const N=32, cv=document.createElement("canvas"); cv.width=N; cv.height=N;
      const g=cv.getContext("2d"); if(!g) return null;
      g.fillStyle="#000"; g.fillRect(0,0,N,N);
      g.strokeStyle="#fff"; g.lineWidth=2.6;
      g.beginPath(); g.moveTo(0,0); g.lineTo(N,N); g.moveTo(N,0); g.lineTo(0,N);
      g.moveTo(-N/2,N/2); g.lineTo(N/2,-N/2); g.moveTo(N/2,N+N/2); g.lineTo(N+N/2,N/2);
      g.moveTo(N/2,-N/2); g.lineTo(N+N/2,N/2); g.moveTo(-N/2,N/2); g.lineTo(N/2,N+N/2);
      g.stroke(); C.net=cv;
    } else if(kind==="wear"){
      // RGBA: kahverengi-kum tonlu benekler, merkezden kenara düzensiz sönen alfa (dikişsiz değil, tek leke)
      const N=256, cv=document.createElement("canvas"); cv.width=N; cv.height=N;
      const g=cv.getContext("2d"), img=g&&g.createImageData?g.createImageData(N,N):null; if(!img) return null;
      const r=day3dRand(13579), GN=9, lo=new Float32Array(GN*GN); for(let i=0;i<lo.length;i++) lo[i]=r();
      for(let y=0;y<N;y++) for(let x=0;x<N;x++){
        const u=x/N*2-1, v=y/N*2-1, d=Math.hypot(u,v);
        const fx=(x/N)*(GN-1), fy=(y/N)*(GN-1), x0=Math.floor(fx), y0=Math.floor(fy), tx=fx-x0, ty=fy-y0;
        const x1=Math.min(GN-1,x0+1), y1=Math.min(GN-1,y0+1);
        const n=(lo[y0*GN+x0]*(1-tx)+lo[y0*GN+x1]*tx)*(1-ty)+(lo[y1*GN+x0]*(1-tx)+lo[y1*GN+x1]*tx)*ty;
        const edge=Math.max(0,Math.min(1,(1-d-(n-0.5)*0.5)*2.2));
        const a=edge*(0.55+0.45*r())*(0.6+0.4*n), j=(y*N+x)*4, k=0.85+r()*0.3;
        img.data[j]=Math.min(255,150*k); img.data[j+1]=Math.min(255,128*k); img.data[j+2]=Math.min(255,82*k); img.data[j+3]=Math.round(255*a*0.85);
      }
      g.putImageData(img,0,0); C.wear=cv;
    } else if(kind==="grassBump"){
      // Çim yaprağı kabartması: sütun başına taban + dikeyde yumuşatılmış gürültü → ince dikey çizgiler
      const N=256, cv=document.createElement("canvas"); cv.width=N; cv.height=N;
      const g=cv.getContext("2d"), img=g&&g.createImageData?g.createImageData(N,N):null; if(!img) return null;
      const r=day3dRand(424242);
      for(let x=0;x<N;x++){
        let h=r(); const base=r();
        for(let y=0;y<N;y++){
          h=h*0.72+r()*0.28;
          const v=Math.round(255*Math.min(1,Math.max(0,base*0.45+h*0.55))), j=(y*N+x)*4;
          img.data[j]=v; img.data[j+1]=v; img.data[j+2]=v; img.data[j+3]=255;
        }
      }
      g.putImageData(img,0,0); C.grassBump=cv;
    } else if(kind==="grassDetail"){
      // Dikişsiz mikro çim kılı dokusu (256²): orta gri taban üzerinde ~3600 kısa, hafif eğik
      //   açık/koyu yaprak çizgisi; kenarlardan taşan çizgiler karşı kenarda devam eder (tekrar
      //   izi yok). Hem renk ayrıntısı (pitch3d çim gölgelendiricisi) hem bumpMap olarak kullanılır.
      const N=256, cv=document.createElement("canvas"); cv.width=N; cv.height=N;
      const g=cv.getContext("2d"); if(!g) return null;
      const r=day3dRand(778899);
      g.fillStyle="#808080"; g.fillRect(0,0,N,N);
      g.lineCap="round";
      for(let i=0;i<4200;i++){
        const x=r()*N, y=r()*N, len=3+r()*8, a=-Math.PI/2+(r()-0.5)*0.9;
        const v=r()<0.5?Math.round(150+r()*60):Math.round(60+r()*50);   // yumuşak: açık kıl / hafif gölge (gürültüsüz)
        g.strokeStyle="rgba("+v+","+v+","+v+","+(0.22+r()*0.3)+")"; g.lineWidth=0.7+r()*1.1;
        const dx=Math.cos(a)*len, dy=Math.sin(a)*len;
        for(const ox of [-N,0,N]) for(const oy of [-N,0,N]){
          if(x+ox+len<0||x+ox-len>N||y+oy+len<0||y+oy-len>N) continue;
          g.beginPath(); g.moveTo(x+ox,y+oy); g.lineTo(x+ox+dx,y+oy+dy); g.stroke();
        }
      }
      C.grassDetail=cv;
    } else if(kind==="crowd"){
      // Tribün seyirci dokusu (dikişsiz, yatayda tekrar): 16 sıra × 32 koltuk; renkli tişört + ten
      //   rengi baş lekeleri, aralarda koyu boşluk. Basamak alınlarına sıra sıra uygulanır
      //   (stadium3d.js; AO orada vertex rengiyle). 3D taraftarların ARKASINDA kalır.
      const W=256, H=128, cv=document.createElement("canvas"); cv.width=W; cv.height=H;
      const g=cv.getContext("2d"); if(!g) return null;
      const r=day3dRand(55221);
      g.fillStyle="#3d434b"; g.fillRect(0,0,W,H);
      const shirts=["#2563eb","#1d4ed8","#f8fafc","#dc2626","#b91c1c","#facc15","#f8fafc","#3b82f6","#ef4444","#111827"];
      const skins=["#e0b48c","#d9a77f","#c8946a","#8d5a3b","#f0c9a2"];
      const cw=8, ch=8;
      for(let y=0;y<H;y+=ch) for(let x=0;x<W;x+=cw){
        if(r()<0.1) continue;                                   // boş koltuk
        const ox=x+(r()-0.5)*1.6, oy=y+(r()-0.5)*1.2;
        g.fillStyle=shirts[Math.floor(r()*shirts.length)]; g.fillRect(ox+1.5,oy+3.6,5,4.4);
        g.fillStyle=skins[Math.floor(r()*skins.length)]; g.beginPath(); g.arc(ox+4,oy+2.4,1.7,0,Math.PI*2); g.fill();
      }
      C.crowd=cv;
    } else if(kind==="ao"){
      // Fake AO alfa gradyanı (alphaMap: beyaz = opak): v=1 (arka duvar) koyu → v=0 (ön saçak) saydam
      const cv=document.createElement("canvas"); cv.width=4; cv.height=64;
      const g=cv.getContext("2d"); if(!g) return null;
      const gr=g.createLinearGradient(0,64,0,0);   // tuval y=64 → uv v=0
      gr.addColorStop(0,"#000"); gr.addColorStop(0.35,"#3a3a3a"); gr.addColorStop(0.8,"#c8c8c8"); gr.addColorStop(1,"#fff");
      g.fillStyle=gr; g.fillRect(0,0,4,64);
      C.ao=cv;
    }
  }catch(e){ C[kind]=null; }
  return C[kind];
}

// Gündüz çim tuvali (2048×1024, gw×gh m alanı; saha çizgilerine hizalı): doğal sıcak yeşil, boyda 18
//   belirgin biçme şeridi (±9%) + ende hafif dama (±2.5%), orta ölçek leke (değer gürültüsü), ince
//   piksel gürültüsü ve ton kayması (sarımsı/mavimsi yeşil). Oturum başına bir kez (~0.1–0.3 sn).
// Şerit kenarı yumuşatma: p = kale çizgisinden uzaklık (m), sw = şerit genişliği. Şerit içinde 1,
//   kenara ~0.5 m kala 0'a iner (iki komşu şeridin ortalama tonu) → yumuşak geçiş.
function day3dStripeEdge(p,sw){
  const f=((p%sw)+sw)%sw, e=Math.min(f,sw-f), t=Math.min(1,e/0.9);
  return t*t*(3-2*t);
}
// Biçme deseni (stadyum varyasyonu): pat = "vert" (boyuna şeritler: kale çizgisine paralel bantlar,
//   varsayılan) | "horiz" (enine şeritler: taç çizgisine paralel) | "check" (kareli / damalı kesim).
//   Dönüş: −1…1 işaretli bant tonu (kenarlar yumuşak, 0'a iner). nV: boyuna bant sayısı.
function day3dMowBand(wx,wz,pat,nV){
  const D=PITCH3D_DIM, L=D.halfLen, Hw=D.halfWid;
  if(pat==="horiz"){ const sz=PITCH3D_WID/12, b=Math.floor((wz+Hw)/sz)&1; return (b?1:-1)*day3dStripeEdge(wz+Hw,sz); }
  if(pat==="check"){
    const sx=PITCH3D_LEN/14, sz=PITCH3D_WID/9, bx=Math.floor((wx+L)/sx)&1, bz=Math.floor((wz+Hw)/sz)&1;
    return ((bx^bz)?1:-1)*Math.min(day3dStripeEdge(wx+L,sx),day3dStripeEdge(wz+Hw,sz));
  }
  const sx=PITCH3D_LEN/(nV||18), bx=Math.floor((wx+L)/sx)&1; return (bx?1:-1)*day3dStripeEdge(wx+L,sx);
}
// Desen/ton anahtarlı küçük tuval önbelleği (2048² tuvaller büyük: en çok 2 çeşit tutulur)
function day3dCacheGet(store,key){ return store.has(key)?store.get(key):undefined; }
function day3dCachePut(store,key,v){ store.delete(key); store.set(key,v); while(store.size>2) store.delete(store.keys().next().value); return v; }
// Çim tonu (tint −1…1): + sarımsı/açık yaz çimi, − koyu/mavimsi yeşil
function day3dGrassTint(tint){ const t=Math.max(-1,Math.min(1,Number(tint)||0)); return {r:1+0.13*t,g:1+0.02*t,b:1-0.16*t}; }
const DAY3D_GRASS_BY=new Map(), DAY3D_ROUGH_BY=new Map();

// Kale önü yıpranması (0…~0.8): altıpasın içinde kale çizgisinden ~2 m önde en yoğun, kaleci
//   şeridi (çizgi boyunca) ayrıca aşınmış; n: düşük frekanslı gürültü (0…1), rr: piksel rastgelesi.
//   Lekeli olsun diye gürültüyle maskelenir. Gündüz ve gece çim tuvalleri birlikte kullanır.
function day3dGoalWear(wx,wz,n,rr){
  const L=PITCH3D_DIM.halfLen, ax=L-Math.abs(wx);
  if(ax<-0.3||ax>8.5||Math.abs(wz)>9.5) return 0;
  const ex=(ax-2.0)/3.0, ez=wz/4.4;
  let w=Math.exp(-(ex*ex+ez*ez)*1.5);
  const lx=(ax-0.5)/0.8, lz=wz/3.8;
  w=Math.max(w,0.85*Math.exp(-(lx*lx+lz*lz)*1.3));
  const m=Math.min(1,Math.max(0,(n-0.2)*1.6+(rr-0.5)*0.7));   // lekeli maske
  return Math.min(0.8,w*m*0.95);
}

function day3dGrassCanvas(gw,gh,pat,tint){
  const key=(pat||"vert")+"|"+(Number(tint)||0).toFixed(2), hit=day3dCacheGet(DAY3D_GRASS_BY,key);
  if(hit!==undefined) return hit;
  if(typeof document==="undefined") return null;
  const TN=day3dGrassTint(tint);
  try{
    const W=2048, Hh=1024, cv=document.createElement("canvas"); cv.width=W; cv.height=Hh;
    const ctx=cv.getContext("2d"), img=ctx&&ctx.createImageData?ctx.createImageData(W,Hh):null;
    if(!img) return null;
    const px=img.data, D=PITCH3D_DIM, L=D.halfLen, Hw=D.halfWid, sx=PITCH3D_LEN/18, sz=PITCH3D_WID/10;
    const r=day3dRand(20241), GX=65, GY=33, lo=new Float32Array(GX*GY), lo2=new Float32Array(GX*GY);
    for(let i=0;i<lo.length;i++){ lo[i]=r(); lo2[i]=r(); }
    for(let y=0;y<Hh;y++){
      const wz=(y+0.5)/Hh*gh-gh/2, bz=Math.floor((wz+Hw)/sz)&1;
      const fy=y/Hh*(GY-1), y0=Math.floor(fy), ty=fy-y0, y1=Math.min(GY-1,y0+1);
      for(let x=0;x<W;x++){
        const wx=(x+0.5)/W*gw-gw/2, bx=Math.floor((wx+L)/sx)&1;
        const fx=x/W*(GX-1), x0=Math.floor(fx), tx=fx-x0, x1=Math.min(GX-1,x0+1);
        const i00=y0*GX+x0, i01=y0*GX+x1, i10=y1*GX+x0, i11=y1*GX+x1;
        const n=(lo[i00]*(1-tx)+lo[i01]*tx)*(1-ty)+(lo[i10]*(1-tx)+lo[i11]*tx)*ty;
        const h=(lo2[i00]*(1-tx)+lo2[i01]*tx)*(1-ty)+(lo2[i10]*(1-tx)+lo2[i11]*tx)*ty;
        const out=Math.abs(wx)>L+0.3||Math.abs(wz)>Hw+0.3;
        // Yalnız boyuna biçme şeritleri (ende bant YOK). Şerit kenarı ~0.5 m yumuşak geçiş: biçme
        //   yönü değişirken renk keskin çizgiyle değil doğal kayarak döner
        let k=out?0.84:(1+0.09*day3dMowBand(wx,wz,pat,18));
        k*=0.92+n*0.12+(r()-0.5)*0.035;   // dengeli ton: piksel titreşimi düşük (keskin/gürültülü görünmesin)
        const hue=(h-0.5)*0.18+(r()-0.5)*0.025;           // + sarımsı, − mavimsi
        const j=(y*W+x)*4;
        let cr=(58+hue*70)*k*TN.r, cg=(134+hue*18)*k*TN.g, cb=(44-hue*40)*k*TN.b;
        // Kale önü / altıpas yıpranması: lekeli toprak + solgun çim karışımı
        const wv=out?0:day3dGoalWear(wx,wz,n,r());
        if(wv>0){ cr+=(112-cr)*wv; cg+=(98-cg)*wv*0.92; cb+=(62-cb)*wv; }
        px[j]=Math.min(255,cr); px[j+1]=Math.min(255,cg); px[j+2]=Math.min(255,cb); px[j+3]=255;
      }
    }
    ctx.putImageData(img,0,0); return day3dCachePut(DAY3D_GRASS_BY,key,cv);
  }catch(e){ return day3dCachePut(DAY3D_GRASS_BY,key,null); }
}

// Gündüz çim pürüzlülük tuvali (roughnessMap; G kanalı okunur): çim tuvaliyle aynı gw×gh alan ve
//   aynı 18 boy şeridi + 10 en bandı. Açık şerit 0.78 (hafif parlak), koyu şerit 0.97 (mat), dama ±.
function day3dGrassRoughCanvas(gw,gh,pat){
  const key=pat||"vert", hit=day3dCacheGet(DAY3D_ROUGH_BY,key);
  if(hit!==undefined) return hit;
  if(typeof document==="undefined") return null;
  try{
    const W=512, Hh=256, cv=document.createElement("canvas"); cv.width=W; cv.height=Hh;
    const ctx=cv.getContext("2d"), img=ctx&&ctx.createImageData?ctx.createImageData(W,Hh):null;
    if(!img) return null;
    const D=PITCH3D_DIM, L=D.halfLen, Hw=D.halfWid, sx=PITCH3D_LEN/18, sz=PITCH3D_WID/10;
    for(let y=0;y<Hh;y++){
      const wz=(y+0.5)/Hh*gh-gh/2, bz=Math.floor((wz+Hw)/sz)&1;
      for(let x=0;x<W;x++){
        const wx=(x+0.5)/W*gw-gw/2, bx=Math.floor((wx+L)/sx)&1;
        const out=Math.abs(wx)>L+0.3||Math.abs(wz)>Hw+0.3;
        const v=Math.round(255*(out?0.98:(day3dMowBand(wx,wz,pat,18)>=0?0.8:0.96))), j=(y*W+x)*4;
        img.data[j]=v; img.data[j+1]=v; img.data[j+2]=v; img.data[j+3]=255;
      }
    }
    ctx.putImageData(img,0,0); return day3dCachePut(DAY3D_ROUGH_BY,key,cv);
  }catch(e){ return day3dCachePut(DAY3D_ROUGH_BY,key,null); }
}

// Çim malzemesine iki ölçekli mikro çim ayrıntısı ekler (onBeforeCompile; Lambert ve Standard).
//   Aynı dikişsiz kıl dokusu iki tekrar ölçeğinde (ince ~0.55 m, kaba ~3.3 m; oranları tamsayı
//   değil → ortak tekrar deseni oluşmaz) örneklenir ve kamera uzaklığına göre karışır: yakında
//   ince kıl, uzakta kaba doku → kuşbakışında da, çim seviyesi vuruş kamerasında da sahanın her
//   yerinde aynı yoğunlukta, kare tekrar izi olmayan doğal çim. Bir de büyük ölçekli (~19 m)
//   hafif ton dalgalanması tekrarı kırar. tex: day3dTex(THREE,"grassDetail") · gw/gh: düzlem (m).
function day3dGrassDetail(THREE,mat,tex,gw,gh,amp){
  if(!mat||!tex) return;
  const rep=(m)=>[gw/m,gh/m];
  const f=rep(0.55), c=rep(3.3), b=rep(19.0);
  const uni={uDetail:{value:tex},uDetRep:{value:new THREE.Vector4(f[0],f[1],c[0],c[1])},
    uDetBig:{value:new THREE.Vector2(b[0],b[1])},uDetAmp:{value:Number.isFinite(amp)?amp:0.22},
    uDetNear:{value:6.0},uDetFar:{value:38.0}};
  mat.detailTex=tex;   // disposeObject3D malzemenin doku alanlarını tarar → sahneyle serbest kalır
  mat.onBeforeCompile=(sh)=>{
    Object.assign(sh.uniforms,uni);
    // vUvBump: bumpMap'in ince ölçekli uv'si (r128 bumpMap kendi repeat'ini kullanmaz → bumpmap
    //   parçasındaki vUv makroyla vUvBump'a çevrilir; parça bitince makro kaldırılır)
    sh.vertexShader="uniform vec4 uDetRep;\nvarying float vDetDist;\nvarying vec2 vUvBump;\n"+sh.vertexShader
      .replace("#include <uv_vertex>","#include <uv_vertex>\nvUvBump=uv*uDetRep.xy;")
      .replace("#include <project_vertex>","#include <project_vertex>\nvDetDist=-mvPosition.z;");
    sh.fragmentShader="uniform sampler2D uDetail;\nuniform vec4 uDetRep;\nuniform vec2 uDetBig;\nuniform float uDetAmp;\n"+
      "uniform float uDetNear;\nuniform float uDetFar;\nvarying float vDetDist;\nvarying vec2 vUvBump;\n"+
      sh.fragmentShader
      .replace("#include <bumpmap_pars_fragment>","#define vUv vUvBump\n#include <bumpmap_pars_fragment>\n#undef vUv")
      .replace("#include <map_fragment>",[
        "#include <map_fragment>",
        "float detF=texture2D(uDetail,vUv*uDetRep.xy).g;",
        "float detC=texture2D(uDetail,vUv*uDetRep.zw+vec2(0.37,0.11)).g;",
        "float detB=texture2D(uDetail,vUv*uDetBig+vec2(0.71,0.53)).g;",
        "float detK=1.0-smoothstep(uDetNear,uDetFar,vDetDist);",
        "float det=mix(detC,detF,detK)*2.0-1.0;",
        "diffuseColor.rgb*=(1.0+det*uDetAmp*(1.0+0.2*detK))*(1.0+(detB-0.5)*0.08);",   // yakında ince, yumuşak kıl geçişi
      ].join("\n"));
  };
  mat.customProgramCacheKey=()=>"grassDetail"+(mat.isMeshStandardMaterial?"S":"L");
  mat.needsUpdate=true;
}

// Paylaşılan tuvalden yeni doku (her sahnenin kendi dokusu; sahneyle dispose edilir)
function day3dTex(THREE,kind,aniso){
  const cv=day3dCanvas(kind); if(!cv) return null;
  const t=new THREE.CanvasTexture(cv);
  if(kind!=="sky"){ t.wrapS=THREE.RepeatWrapping; t.wrapT=THREE.RepeatWrapping; }
  if(Number.isFinite(aniso)&&aniso>1) t.anisotropy=aniso;
  return t;
}

// tint (isteğe bağlı): gök dokusunu çarpan renk (gün batımında turuncu/pembe ufuk)
function day3dSkyDome(THREE,tint){
  const geo=new THREE.SphereGeometry(300,32,16);
  const tex=day3dTex(THREE,"sky");
  const mat=new THREE.MeshBasicMaterial({color:tex?(Number.isFinite(tint)?tint:0xffffff):DAY3D_SKY_CLEAR,map:tex||null,side:THREE.BackSide,fog:false,depthWrite:false});
  mat.toneMapped=false;   // gök tuvaldeki renkle aynen görünsün (ACES film tonu kubbeyi soldurmasın)
  const m=new THREE.Mesh(geo,mat);
  m.name="sky"; m.renderOrder=-10; m.frustumCulled=false;
  return m;
}

// Güneş + gök ışığı. Gölge kamerası saha + tribün ön kısmına dar tutulur (±85 × ±68 m).
//   lowEnd (dokunmatik/küçük ekran): gölge haritası 1024², yoksa 2048².
//   mode (pitch3dVenue ışık varyasyonu): "noon" (varsayılan, gün ortası güneş) | "sunset" (ikindi /
//   gün batımı: alçak, sıcak turuncu güneş, uzun gölge) | "night" (gece: projektör anahtar ışığı tepeden,
//   serin beyaz; gök dolgusu koyu lacivert)
function day3dLights(THREE,scene,lowEnd,mode){
  // Adım 17: sıcak güneş (≈4500 K sarımsı) + serin gök dolgusu, toprak tonlu yer yansıması →
  //   gölge tarafı mavimsi, güneş tarafı sıcak (düz "plastik" aydınlatma yerine renk kontrastı)
  //   Gök/çim yansıması: üstten mavi gök dolgusu, alttan çimden sekmiş yeşilimsi ışık
  const M=mode==="sunset"||mode==="night"?mode:"noon";
  const hemi=M==="night"?new THREE.HemisphereLight(0x5a6c96,0x1e2a1c,0.5)
    :M==="sunset"?new THREE.HemisphereLight(0xf2c4a0,0x4a4a2c,0.5):new THREE.HemisphereLight(0xbcd8f5,0x4e6a34,0.55);
  scene.add(hemi);
  const sun=M==="night"?new THREE.DirectionalLight(0xeef2ff,1.15):M==="sunset"?new THREE.DirectionalLight(0xff9a4a,1.35):new THREE.DirectionalLight(0xffe0b0,1.3);
  const d=M==="night"?[0.12,0.95,0.28]:M==="sunset"?[-0.78,0.3,0.55]:DAY3D_SUN_DIR;
  sun.position.set(d[0]*160,d[1]*160,d[2]*160);
  sun.target.position.set(0,0,0);
  sun.castShadow=true;
  const sz=lowEnd?1024:2048;
  sun.shadow.mapSize.set(sz,sz);
  const sc=sun.shadow.camera;
  sc.left=-85; sc.right=85; sc.top=68; sc.bottom=-68; sc.near=40; sc.far=300;
  sc.updateProjectionMatrix();
  sun.shadow.bias=-0.0006;
  if("normalBias" in sun.shadow) sun.shadow.normalBias=0.03;
  scene.add(sun); scene.add(sun.target);
  return {sun,hemi};
}

// Ağaçlar (InstancedMesh, vertex rengi): gövde + dallar + çok parçalı düzensiz yaprak tacı.
//   İki tür: geniş taçlı ÇINAR ve ince uzun KAVAK (koni yok). Yaprak küreleri gürültüyle bozulur; alt/iç
//   kısım koyu, üst kısım açık (vertex rengiyle pişmiş gölge). pts: [[x,z,ölçek],...]; her üçüncü nokta kavak.
//   Dönen: çınar InstancedMesh; kavaklar çocuk InstancedMesh (userData.oak). tint: gece/gün batımı çarpanı.
function day3dTrees(THREE,pts,tint){
  if(!pts||!pts.length) return null;
  const broadPts=[], tallPts=[];
  pts.forEach((p,i)=>(i%3===2?tallPts:broadPts).push(p));
  const r=day3dRand(8642), trunkC=0x6b4f38, trunkD=0x503a28;
  const tube=(x0,y0,z0,x1,y1,z1,ra,rb,c,parts)=>{
    const a=new THREE.Vector3(x0,y0,z0), b=new THREE.Vector3(x1,y1,z1), dir=b.clone().sub(a), len=dir.length();
    const g=new THREE.CylinderGeometry(rb,ra,len,6,1,true); g.translate(0,len/2,0);
    g.applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),dir.normalize())));
    g.translate(x0,y0,z0); parts.push({g,c});
  };
  const leaf=(x,y,z,rx,ry,c,parts)=>{
    const g=new THREE.IcosahedronGeometry(1,1), p=g.attributes.position, s1=r()*9, s2=r()*9;
    for(let i=0;i<p.count;i++){                              // aynı konumdaki köşeler aynı kayar (çatlak olmaz)
      const a=p.getX(i), b=p.getY(i), d=p.getZ(i), k=1+0.16*Math.sin(a*4.1+s1)*Math.cos(d*3.7+s2)+0.12*Math.sin(b*5.3+s2);
      p.setXYZ(i,a*k*rx,b*k*ry,d*k*rx);
    }
    g.rotateY(r()*6); g.translate(x,y,z); parts.push({g,c});   // küre normalleri kalır: yumuşak yaprak
  };
  const shade=(g,y0,y1)=>{
    const p=g.attributes.position, c=g.attributes.color, n=g.attributes.normal;
    for(let i=0;i<p.count;i++){
      if(p.getY(i)<y0) continue;
      const k=0.62+0.42*Math.max(0,Math.min(1,(p.getY(i)-y0)/(y1-y0)))+0.1*n.getY(i);
      c.setXYZ(i,c.getX(i)*k,c.getY(i)*k,c.getZ(i)*k*0.96);
    }
    return g;
  };
  const broad=()=>{
    const P=[];
    tube(0,0,0,0.08,2.6,0.04,0.42,0.27,trunkD,P); tube(0,0,0,0,0.35,0,0.62,0.42,trunkD,P);
    for(let i=0;i<5;i++){ const a=i/5*6.283+0.4; tube(0.08,2.3+i*0.12,0.04,Math.cos(a)*1.5,4.0+(i%2)*0.5,Math.sin(a)*1.5,0.17,0.07,trunkC,P); }
    const G=[0x4d7d34,0x558739,0x44722f,0x5e913f,0x3e6a2d];
    leaf(0,5.0,0,1.9,1.6,G[2],P);
    for(let i=0;i<6;i++){ const a=i/6*6.283; leaf(Math.cos(a)*1.7,4.5+(i%2)*0.55,Math.sin(a)*1.7,1.15+(i%3)*0.16,0.98,G[i%5],P); }
    for(let i=0;i<3;i++){ const a=i/3*6.283+0.7; leaf(Math.cos(a)*0.85,6.15+i*0.2,Math.sin(a)*0.85,1.15,0.95,G[(i+1)%5],P); }
    return shade(mergeGeos3D(THREE,P),3.2,7.2);
  };
  const tall=()=>{
    const P=[];
    tube(0,0,0,0,3.2,0,0.3,0.18,trunkC,P);
    const G=[0x46763a,0x4f8040,0x3d6a34];
    [[0,2.7,0,0.95,1.1],[0.35,3.7,0.2,1.05,1.2],[-0.3,4.5,-0.2,1.1,1.25],[0.2,5.5,-0.25,1.0,1.25],[-0.1,6.6,0.2,0.85,1.2],[0.05,7.6,0,0.62,1.15],[0,8.6,0,0.36,0.9]]
      .forEach(([x,y,z,a,b],i)=>leaf(x,y,z,a,b,G[i%3],P));
    return shade(mergeGeos3D(THREE,P),1.8,9);
  };
  const m=new THREE.Matrix4(), q=new THREE.Quaternion(), p=new THREE.Vector3(), s=new THREE.Vector3(), up=new THREE.Vector3(0,1,0), col=new THREE.Color();
  const inst=(geo,list,name)=>{
    const mat=new THREE.MeshLambertMaterial({vertexColors:true,color:Number.isFinite(tint)?tint:0xffffff});
    const im=new THREE.InstancedMesh(geo,mat,Math.max(1,list.length));
    im.name=name; im.frustumCulled=false; im.count=list.length;
    for(let i=0;i<list.length;i++){
      const [x,z,k]=list[i], sc=Number.isFinite(k)?k:1;
      q.setFromAxisAngle(up,r()*Math.PI*2);
      p.set(x,0,z); s.set(sc*(0.9+r()*0.22),sc*(0.88+r()*0.24),sc*(0.9+r()*0.22));
      m.compose(p,q,s); im.setMatrixAt(i,m);
      const v=0.84+r()*0.2; col.setRGB(v*(0.94+r()*0.16),v,v*(0.88+r()*0.1)); im.setColorAt(i,col);
    }
    im.instanceMatrix.needsUpdate=true;
    if(im.instanceColor) im.instanceColor.needsUpdate=true;
    return im;
  };
  const im=inst(broad(),broadPts,"trees");
  if(tallPts.length){ const o=inst(tall(),tallPts,"treesOak"); im.add(o); im.userData.oak=o; }
  return im;
}
