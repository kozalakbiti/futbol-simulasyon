// ═══════════════════════════════════════════════════════════════
// 3D MAÇ MOTORU — ORTAK YARDIMCILAR (Three.js yükleyici + koordinatlar)
// ═══════════════════════════════════════════════════════════════
// • Three.js r128 (UMD, global THREE) cdnjs'ten İHTİYAÇ ANINDA yüklenir:
//   loadThreeJs() → Promise<THREE>. Tekrar çağrılınca aynı Promise döner,
//   window.THREE zaten varsa hemen çözülür, hata/timeout'ta reddeder
//   (reddedilince bir sonraki çağrı yeniden dener).
// • hasWebGLSupport() → boolean (yalnızca olumlu sonuç önbelleğe alınır).
// • KOORDİNAT SİSTEMİ (2D MatchOverlay ile aynı, overlay.js'ten doğrulandı):
//   2D: x 0–100 soldan sağa, y 0–100 yukarıdan aşağıya (kanat).
//       x=0 tarafı BİZİM kalemiz (kalecimiz x≈12), x=100 tarafı RAKİP kalesi
//       (bizim gol olaylarımızın zone'u x≈75–93; rakip gollerinde 100-x).
//   3D dünya (metre): saha 105 x 68, merkez (0,0,0), Y yukarı.
//       dünyaX = (x/100 − 0.5)·105  → −52.5 bizim kale çizgisi, +52.5 rakip
//       dünyaZ = (y/100 − 0.5)·68   → −34 üst taç çizgisi (2D'de y=0), +34 alt
//   Yayın kamerası +Z tarafından baktığı için ekranda sol=bizim kale,
//   üst=y 0 olur; 2D görünümle birebir aynı yön.
// ═══════════════════════════════════════════════════════════════

const THREE_JS_URL="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
const THREE_JS_TIMEOUT_MS=15000;
const THREE3D_LOADER={promise:null,webgl:null};

// Saha ölçüleri (metre, FIFA standardı)
const PITCH3D_LEN=105;          // kale çizgisinden kale çizgisine (dünya X)
const PITCH3D_WID=68;           // taç çizgisinden taç çizgisine (dünya Z)
// ── Güvenli özel kamera (kilit an) ──
// Kamera saha + kenar payı kutusuna kırpılır. Kutu dışbükey: kamera da hedef
// (top/oyuncu) de içindeyse aradaki görüş çizgisi de içinde kalır; stadyum
// yapıları (panolar 4.6 m, kulübeler 2.7 m+, tribünler 7.5 m+ dışarıda)
// görüşü kapatamaz. Kırpılan yatay mesafenin bir kısmı yüksekliğe eklenir
// (bakış dikleşir, sahne yine sığar). out: {x,y,z} ya da Vector3 — tahsis yok.
const PITCH3D_CAM_PAD_X=1.0, PITCH3D_CAM_PAD_Z=1.5, PITCH3D_CAM_MIN_Y=4, PITCH3D_CAM_MAX_Y=46;
const PITCH3D_CAM_LOW_Y=0.75;   // çim seviyesi vuruş kamerası (kilit an: şut/orta onayı)
const PITCH3D_CAM_TOP_MAX_Y=80; // kuşbakışı kilit an kamerası (saha üstünde; dikey ekranda kadraj sığsın)
// minY / maxY (isteğe bağlı): en düşük (çim seviyesi: PITCH3D_CAM_LOW_Y) / en yüksek
// (kuşbakışı: PITCH3D_CAM_TOP_MAX_Y) yükseklik
function pitch3dSafeCam(px,py,pz,out,liftK,minY,maxY){
  const D=PITCH3D_DIM, mx=D.halfLen+PITCH3D_CAM_PAD_X, mz=D.halfWid+PITCH3D_CAM_PAD_Z;
  const x=Number.isFinite(px)?px:0, z=Number.isFinite(pz)?pz:0;
  const k=Number.isFinite(liftK)?liftK:0.35;
  let y=Number.isFinite(py)?py:12;
  const cx=Math.max(-mx,Math.min(mx,x)), cz=Math.max(-mz,Math.min(mz,z));
  const lo=Number.isFinite(minY)?Math.max(0.4,minY):PITCH3D_CAM_MIN_Y;
  const hi=Number.isFinite(maxY)?Math.max(lo,maxY):PITCH3D_CAM_MAX_Y;
  y=Math.min(hi,Math.max(lo,y+Math.hypot(x-cx,z-cz)*k));
  // Kale ağının içine alçaktan girmesin
  if(Math.abs(cx)>D.halfLen-1&&Math.abs(cz)<D.goalWidth/2+2.5) y=Math.max(y,D.goalHeight+3);
  out.x=cx; out.y=y; out.z=cz;
  return out;
}

const PITCH3D_DIM={
  halfLen:52.5, halfWid:34,
  penDepth:16.5, penWidth:40.32,   // ceza sahası
  boxDepth:5.5, boxWidth:18.32,    // 6 yarda (kale alanı)
  penSpot:11, circleR:9.15, cornerR:1,
  goalWidth:7.32, goalHeight:2.44, goalDepth:2,
  lineW:0.25,                      // çizgi kalınlığı (küçük ekranda titreşmesin diye kalın)
};

// Three.js'i tembel yükle — tek Promise
function loadThreeJs(){
  if(typeof window!=="undefined"&&window.THREE&&window.THREE.WebGLRenderer){
    return Promise.resolve(window.THREE);
  }
  if(THREE3D_LOADER.promise) return THREE3D_LOADER.promise;
  // Aynı URL'li etiket DOM'da varsa (ör. zaman aşımından sonra hâlâ iniyorsa)
  // yenisini ekleme, onun olaylarını bekle → çift yükleme olmaz.
  const existing=document.querySelector('script[src="'+THREE_JS_URL+'"]');
  if(existing&&existing.getAttribute("data-three3d-loaded")==="1"){
    // Etiket yüklenmiş ama THREE yok → bozuk; kaldır. Reddedilen Promise
    // önbelleğe ALINMAZ, böylece sonraki çağrı etiketi yeniden indirir.
    if(existing.parentNode) existing.parentNode.removeChild(existing);
    THREE3D_LOADER.promise=null;
    return Promise.reject(new Error("Three.js yüklendi ama THREE bulunamadı"));
  }
  THREE3D_LOADER.promise=new Promise((resolve,reject)=>{
    let done=false;
    let script=existing;
    const isNew=!script;
    if(isNew){
      script=document.createElement("script");
      script.src=THREE_JS_URL;
      script.async=true;
      script.crossOrigin="anonymous";
      // Kalıcı dinleyiciler: geç gelen yükleme işaretlenir (window.THREE ilk
      // satırdaki kontrolle kullanılır); geç gelen hata etiketi kaldırır ki
      // sonraki deneme yeniden indirebilsin.
      script.addEventListener("load",()=>script.setAttribute("data-three3d-loaded","1"));
      script.addEventListener("error",()=>{ if(script.parentNode) script.parentNode.removeChild(script); });
    }
    const onLoad=()=>finish(null);
    const onErr=()=>finish(new Error("Three.js indirilemedi"));
    const finish=(err)=>{
      if(done) return;
      done=true;
      clearTimeout(timer);
      script.removeEventListener("load",onLoad);
      script.removeEventListener("error",onErr);
      if(err){
        // Zaman aşımında etiket DOM'da kalır (geç gelirse window.THREE kullanılır)
        THREE3D_LOADER.promise=null; // sonraki çağrı yeniden denesin
        reject(err);
      } else if(window.THREE&&window.THREE.WebGLRenderer){
        resolve(window.THREE);
      } else {
        THREE3D_LOADER.promise=null;
        reject(new Error("Three.js yüklendi ama THREE bulunamadı"));
      }
    };
    const timer=setTimeout(()=>finish(new Error("Three.js yükleme zaman aşımı")),THREE_JS_TIMEOUT_MS);
    script.addEventListener("load",onLoad);
    script.addEventListener("error",onErr);
    if(isNew) document.head.appendChild(script);
  });
  return THREE3D_LOADER.promise;
}

// WebGL desteği var mı? (geçici bağlamı hemen serbest bırakır)
function hasWebGLSupport(){
  // Yalnızca "var" sonucu önbelleğe alınır; "yok" geçici olabilir (bağlam sınırı vb.)
  if(THREE3D_LOADER.webgl===true) return true;
  let ok=false;
  try{
    const cv=document.createElement("canvas");
    const gl=cv.getContext("webgl")||cv.getContext("experimental-webgl");
    ok=!!(window.WebGLRenderingContext&&gl);
    if(gl){
      const lose=gl.getExtension("WEBGL_lose_context");
      if(lose) lose.loseContext();
    }
  }catch(e){ ok=false; }
  if(ok) THREE3D_LOADER.webgl=true;
  return ok;
}

// 0–100 saha yüzdesi → dünya koordinatı. out (THREE.Vector3) verilirse ona yazar.
// Sayı olmayan / NaN / Infinity girdiler saha ortasına (50) düşer.
function pitchToWorld3D(x,y,h=0,out){
  // String sayılar da kabul edilir ("42" → 42); geçersiz değer saha ortasına düşer
  // (null/"" → NaN; Number(null)=0 olduğu için ayrıca kontrol edilir)
  x=(x==null||x==="")?NaN:Number(x); y=(y==null||y==="")?NaN:Number(y); h=Number(h);
  const wx=((Number.isFinite(x)?x:50)/100-0.5)*PITCH3D_LEN;
  const wz=((Number.isFinite(y)?y:50)/100-0.5)*PITCH3D_WID;
  if(!Number.isFinite(h)) h=0;
  if(out&&out.set){ out.set(wx,h,wz); return out; }
  return {x:wx,y:h,z:wz};
}

// Dünya (X,Z) → 0–100 saha yüzdesi (raycast sonuçlarını 2D sisteme çevirmek için)
function worldToPitch3D(wx,wz){
  return {x:(wx/PITCH3D_LEN+0.5)*100, y:(wz/PITCH3D_WID+0.5)*100};
}

// Saha etiketi için kısa ad: baştaki baş harf(ler) atılır ("C.Undero" → "Undero",
//   "I.N.Ad" → "Ad", "O.De M.R." → "De M.R."), sondaki tek baş harf de ("Taylor G." → "Taylor"). Ad metninin kendisi
//   değiştirilmez (kurgusal adlar players.js'te bilerek böyle), yalnız baş harf öneki kalkar.
//   (Eski kural split(".")[1] birden çok baş harfli adda yalnız ikinci harfi gösteriyordu.)
function matchLabelName3D(n){
  const s=String(n==null?"":n).trim();
  const t=s.replace(/^([A-Za-zÇĞİÖŞÜçğıöşü]{1,2}\.\s*)+/,"").replace(/(\s+[A-Za-zÇĞİÖŞÜ]\.)+$/,"").trim();   // "Taylor G." → "Taylor"
  return t||s;
}

// Nokta (px,pz) ile (ax,az)→(bx,bz) doğru parçası arasındaki en kısa yatay mesafe (m). Hızlı top
//   bir karede metrelerce yol alır: temas denetimi önceki→şimdiki top konumu parçasıyla yapılır
//   (düşük FPS'te tünelleme olmasın).
function segPointDist3D(ax,az,bx,bz,px,pz){
  const dx=bx-ax, dz=bz-az, L2=dx*dx+dz*dz;
  let t=L2>1e-9?((px-ax)*dx+(pz-az)*dz)/L2:0;
  t=t<0?0:(t>1?1:t);
  return Math.hypot(ax+dx*t-px,az+dz*t-pz);
}

// Parçaları tek indekssiz geometride birleştirir; her parçanın rengi vertex
// rengine yazılır (tek malzeme + vertexColors → tek çizim çağrısı).
// parts: [{g: BufferGeometry (yerinde dönüştürülmüş), c: 0xRRGGBB}] — girdi geometrileri dispose edilir.
// uv: true → uv'ler de korunur (yoksa 0). Çıktı: position, normal, color (+uv).
function mergeGeos3D(THREE,parts,uv){
  const col=new THREE.Color();
  let n=0;
  const list=parts.map(p=>{ const g=p.g.index?p.g.toNonIndexed():p.g; n+=g.attributes.position.count; return {g,src:p.g,c:p.c}; });
  const pos=new Float32Array(n*3), nor=new Float32Array(n*3), clr=new Float32Array(n*3), uvs=uv?new Float32Array(n*2):null;
  let o=0;
  list.forEach(({g,src,c})=>{
    const cnt=g.attributes.position.count;
    pos.set(g.attributes.position.array,o*3);
    if(g.attributes.normal) nor.set(g.attributes.normal.array,o*3);
    if(uvs&&g.attributes.uv) uvs.set(g.attributes.uv.array,o*2);
    col.setHex(Number.isFinite(c)?c:0xffffff);
    for(let i=0;i<cnt;i++){ const j=(o+i)*3; clr[j]=col.r; clr[j+1]=col.g; clr[j+2]=col.b; }
    o+=cnt;
    if(g!==src) g.dispose();
    src.dispose();
  });
  const out=new THREE.BufferGeometry();
  out.setAttribute("position",new THREE.BufferAttribute(pos,3));
  out.setAttribute("normal",new THREE.BufferAttribute(nor,3));
  out.setAttribute("color",new THREE.BufferAttribute(clr,3));
  if(uvs) out.setAttribute("uv",new THREE.BufferAttribute(uvs,2));
  out.computeBoundingSphere();
  return out;
}

// Bir Object3D ağacındaki tüm geometry/material/texture'ları serbest bırakır
// (InstancedMesh örnek tamponları için mesh.dispose() da çağrılır)
function disposeObject3D(root){
  if(!root||!root.traverse) return;
  const geos=new Set(), mats=new Set(), texs=new Set(), inst=[];
  root.traverse(o=>{
    if(o.isInstancedMesh) inst.push(o);
    if(o.geometry) geos.add(o.geometry);
    if(o.material){
      (Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{
        if(!m) return;
        mats.add(m);
        Object.keys(m).forEach(k=>{ const v=m[k]; if(v&&v.isTexture) texs.add(v); });
      });
    }
  });
  inst.forEach(m=>{ try{m.dispose();}catch(e){} });
  geos.forEach(g=>{ try{g.dispose();}catch(e){} });
  texs.forEach(t=>{ try{t.dispose();}catch(e){} });
  mats.forEach(m=>{ try{m.dispose();}catch(e){} });
  if(root.clear) root.clear();
}
