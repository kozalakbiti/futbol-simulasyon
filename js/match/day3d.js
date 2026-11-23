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

const DAY3D_CANVAS={sky:null,roof:null,net:null,grassBump:null,wear:null,grass:null};
// Güneş yönü (dünya; sahanın sol-arka üstü → gölgeler sağ-öne düşer) ve gökyüzü/pus renkleri
const DAY3D_SUN_DIR=[-0.48,0.66,0.58];   // Adım 17: daha alçak güneş → tribün/çatı gölgesi sahaya uzanır
const DAY3D_SKY_CLEAR=0x9fb6cc, DAY3D_FOG=0xd2d3cc;

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
      // Adım 17: yumuşak, hafif puslu çelik mavisi; ufukta açık gri-mavi
      gr.addColorStop(0,"#5d86b4"); gr.addColorStop(0.3,"#86a7c9"); gr.addColorStop(0.46,"#c3cfd6");
      gr.addColorStop(0.5,"#ddd8cc"); gr.addColorStop(1,"#a7b0b2");   // ufukta sıcak, hafif altın pus
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
      for(let c=0;c<22;c++){
        const cx=r()*W, cy=H*(0.2+r()*0.25), sz=18+r()*34*(0.6+(cy/H-0.2)*2.4);
        const n=5+Math.floor(r()*7);
        for(let k=0;k<n;k++) puff(cx+(r()-0.5)*sz*3.2,cy+(r()-0.5)*sz*0.35,sz*(0.6+r()*0.8),0.18+r()*0.25);
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
    }
  }catch(e){ C[kind]=null; }
  return C[kind];
}

// Gündüz çim tuvali (2048×1024, gw×gh m alanı; saha çizgilerine hizalı): doğal sıcak yeşil, boyda 18
//   belirgin biçme şeridi (±9%) + ende hafif dama (±2.5%), orta ölçek leke (değer gürültüsü), ince
//   piksel gürültüsü ve ton kayması (sarımsı/mavimsi yeşil). Oturum başına bir kez (~0.1–0.3 sn).
function day3dGrassCanvas(gw,gh){
  const C=DAY3D_CANVAS;
  if(C.grass||typeof document==="undefined") return C.grass;
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
        let k=out?0.84:(1+(bx?0.09:-0.09)+(bz?0.025:-0.025));
        k*=0.9+n*0.16+(r()-0.5)*0.09;
        const hue=(h-0.5)*0.22+(r()-0.5)*0.06;           // + sarımsı, − mavimsi
        const j=(y*W+x)*4;
        px[j]=Math.min(255,(58+hue*70)*k); px[j+1]=Math.min(255,(134+hue*18)*k); px[j+2]=Math.min(255,(44-hue*40)*k); px[j+3]=255;
      }
    }
    ctx.putImageData(img,0,0); C.grass=cv;
  }catch(e){ C.grass=null; }
  return C.grass;
}

// Paylaşılan tuvalden yeni doku (her sahnenin kendi dokusu; sahneyle dispose edilir)
function day3dTex(THREE,kind,aniso){
  const cv=day3dCanvas(kind); if(!cv) return null;
  const t=new THREE.CanvasTexture(cv);
  if(kind!=="sky"){ t.wrapS=THREE.RepeatWrapping; t.wrapT=THREE.RepeatWrapping; }
  if(Number.isFinite(aniso)&&aniso>1) t.anisotropy=aniso;
  return t;
}

function day3dSkyDome(THREE){
  const geo=new THREE.SphereGeometry(300,32,16);
  const tex=day3dTex(THREE,"sky");
  const mat=new THREE.MeshBasicMaterial({color:tex?0xffffff:DAY3D_SKY_CLEAR,map:tex||null,side:THREE.BackSide,fog:false,depthWrite:false});
  const m=new THREE.Mesh(geo,mat);
  m.name="sky"; m.renderOrder=-10; m.frustumCulled=false;
  return m;
}

// Güneş + gök ışığı. Gölge kamerası saha + tribün ön kısmına dar tutulur (±85 × ±68 m).
//   lowEnd (dokunmatik/küçük ekran): gölge haritası 1024², yoksa 2048².
function day3dLights(THREE,scene,lowEnd){
  // Adım 17: sıcak güneş (≈4500 K sarımsı) + serin gök dolgusu, toprak tonlu yer yansıması →
  //   gölge tarafı mavimsi, güneş tarafı sıcak (düz "plastik" aydınlatma yerine renk kontrastı)
  const hemi=new THREE.HemisphereLight(0xc9dcf2,0x6b5e3e,0.5);
  scene.add(hemi);
  const sun=new THREE.DirectionalLight(0xffdcaa,1.25);
  const d=DAY3D_SUN_DIR;
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

// Stilize ağaç: gövde + iki koni (düşük poligon, vertex rengi) → InstancedMesh.
//   pts: [[x,z,ölçek],...]. instanceColor ile hafif ton farkı.
function day3dTrees(THREE,pts){
  if(!pts||!pts.length) return null;
  const parts=[];
  const trunk=new THREE.CylinderGeometry(0.22,0.32,2.6,5); trunk.translate(0,1.3,0); parts.push({g:trunk,c:0x6b4a2f});
  const c1=new THREE.ConeGeometry(2.7,5.2,7); c1.translate(0,4.6,0); parts.push({g:c1,c:0x2f7a3a});
  const c2=new THREE.ConeGeometry(2.0,4.2,7); c2.translate(0,7.4,0); parts.push({g:c2,c:0x3d9147});
  const c3=new THREE.ConeGeometry(1.2,3.0,6); c3.translate(0,9.7,0); parts.push({g:c3,c:0x4aa152});
  const geo=mergeGeos3D(THREE,parts);
  const mat=new THREE.MeshLambertMaterial({vertexColors:true});
  const im=new THREE.InstancedMesh(geo,mat,pts.length);
  im.name="trees"; im.frustumCulled=false;
  const r=day3dRand(8642);
  const m=new THREE.Matrix4(), q=new THREE.Quaternion(), p=new THREE.Vector3(), s=new THREE.Vector3(), up=new THREE.Vector3(0,1,0), col=new THREE.Color();
  for(let i=0;i<pts.length;i++){
    const [x,z,k]=pts[i], sc=Number.isFinite(k)?k:1;
    q.setFromAxisAngle(up,r()*Math.PI*2);
    p.set(x,0,z); s.set(sc*(0.9+r()*0.2),sc,sc*(0.9+r()*0.2));
    m.compose(p,q,s); im.setMatrixAt(i,m);
    col.setRGB(0.85+r()*0.2,0.9+r()*0.15,0.82+r()*0.18); im.setColorAt(i,col);
  }
  im.instanceMatrix.needsUpdate=true;
  if(im.instanceColor) im.instanceColor.needsUpdate=true;
  return im;
}
