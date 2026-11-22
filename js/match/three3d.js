// ═══════════════════════════════════════════════════════════════
// 3D MAÇ MOTORU — ORTAK YARDIMCILAR (Three.js yükleyici + koordinatlar)
// ═══════════════════════════════════════════════════════════════
// • Three.js r128 (UMD, global THREE) cdnjs'ten İHTİYAÇ ANINDA yüklenir:
//   loadThreeJs() → Promise<THREE>. Tekrar çağrılınca aynı Promise döner,
//   window.THREE zaten varsa hemen çözülür, hata/timeout'ta reddeder
//   (reddedilince bir sonraki çağrı yeniden dener).
// • hasWebGLSupport() → boolean (sonuç önbelleğe alınır).
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
  THREE3D_LOADER.promise=new Promise((resolve,reject)=>{
    let done=false;
    const script=document.createElement("script");
    const finish=(err)=>{
      if(done) return;
      done=true;
      clearTimeout(timer);
      script.onload=null; script.onerror=null;
      if(err){
        if(script.parentNode) script.parentNode.removeChild(script);
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
    script.src=THREE_JS_URL;
    script.async=true;
    script.crossOrigin="anonymous";
    script.onload=()=>finish(null);
    script.onerror=()=>finish(new Error("Three.js indirilemedi"));
    document.head.appendChild(script);
  });
  return THREE3D_LOADER.promise;
}

// WebGL desteği var mı? (geçici bağlamı hemen serbest bırakır)
function hasWebGLSupport(){
  if(THREE3D_LOADER.webgl!==null) return THREE3D_LOADER.webgl;
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
  THREE3D_LOADER.webgl=ok;
  return ok;
}

// 0–100 saha yüzdesi → dünya koordinatı. out (THREE.Vector3) verilirse ona yazar.
function pitchToWorld3D(x,y,h=0,out){
  const wx=((x??50)/100-0.5)*PITCH3D_LEN;
  const wz=((y??50)/100-0.5)*PITCH3D_WID;
  if(out&&out.set){ out.set(wx,h,wz); return out; }
  return {x:wx,y:h,z:wz};
}

// Dünya (X,Z) → 0–100 saha yüzdesi (raycast sonuçlarını 2D sisteme çevirmek için)
function worldToPitch3D(wx,wz){
  return {x:(wx/PITCH3D_LEN+0.5)*100, y:(wz/PITCH3D_WID+0.5)*100};
}

// Bir Object3D ağacındaki tüm geometry/material/texture'ları serbest bırakır
function disposeObject3D(root){
  if(!root||!root.traverse) return;
  const geos=new Set(), mats=new Set(), texs=new Set();
  root.traverse(o=>{
    if(o.geometry) geos.add(o.geometry);
    if(o.material){
      (Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{
        if(!m) return;
        mats.add(m);
        Object.keys(m).forEach(k=>{ const v=m[k]; if(v&&v.isTexture) texs.add(v); });
      });
    }
  });
  geos.forEach(g=>{ try{g.dispose();}catch(e){} });
  texs.forEach(t=>{ try{t.dispose();}catch(e){} });
  mats.forEach(m=>{ try{m.dispose();}catch(e){} });
  if(root.clear) root.clear();
}
