// ═══════════════════════════════════════════════════════════════
// 3D HAZIR MODELLER (.glb) — GLTFLoader altyapısı + güvenli loadModel()
// ═══════════════════════════════════════════════════════════════
// Modeller assets/models/ altında (lisans/atıf: assets/CREDITS.md):
//   ball.glb    → top (players3d.js: prosedürel kürenin yerine; dönme/ölçek mevcut mesh'ten gelir)
//   goal.glb    → kale çerçevesi (pitch3d.js: direk/üst direk/arka çerçeve; file prosedürel kalır,
//                 böylece gol anındaki file sallanması aynen çalışır)
//   stadium.glb → çatılı küçük tribün modülü (stadium3d.js gündüz: açık köşelere)
//   tree.glb    → ağaç (stadium3d.js gündüz: köşe/arka ağaç sıraları, InstancedMesh)
// • GLTFLoader: Three.js r128 ile birebir aynı sürüm (examples/js, global THREE.GLTFLoader),
//   js/vendor/GLTFLoader.js'ten (çevrim dışı/Capacitor), olmazsa jsdelivr'den İHTİYAÇ ANINDA yüklenir.
//   Modeller Draco/meshopt sıkıştırmasız olduğu için DRACOLoader gerekmez (yüklenmez).
// • loadModel(name) → Promise<Object3D|null>: ASLA reddetmez. İndirme/ayrıştırma hatası, zaman
//   aşımı ya da GLTFLoader yoksa null döner → çağıran prosedürel modeli olduğu gibi bırakır.
//   Ham .glb verisi (ArrayBuffer) bir kez indirilir ve önbelleğe alınır; her çağrı YENİ bir nesne
//   ağacı ayrıştırır (her Pitch3D kendi WebGL bağlamına sahip; sahne teardown'ındaki
//   disposeObject3D(scene) yalnız o kopyayı serbest bırakır, önbellek bozulmaz).
// • Renk hattı: renderer doğrusal çıktı veriyor (day3d.js başlığı). glTF temel renkleri doğrusal,
//   renk dokuları sRGB tanımlıdır → modeller burada aynı hatta çevrilir (renk sRGB değerine,
//   doku LinearEncoding'e), böylece modelin tasarlandığı renkler ekranda aynen görünür.
// • Yükleme sırası: yalnız fonksiyon/sabit tanımları (yükleme anında hiçbir şey çalıştırmaz).
// ═══════════════════════════════════════════════════════════════

const ASSETS3D_GLTF_URLS=["js/vendor/GLTFLoader.js","https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js"];
const ASSETS3D_MODEL_DIR="assets/models/";
const ASSETS3D_TIMEOUT_MS=15000;
const ASSETS3D_STATE={loader:null,buffers:{},failed:{},warned:{}};

function assets3dWarn(key,msg,err){
  if(ASSETS3D_STATE.warned[key]) return;
  ASSETS3D_STATE.warned[key]=true;
  console.warn("[assets3d] "+msg+" — prosedürel model kullanılıyor",err||"");
}

// Tek <script> etiketi yükler (zaman aşımlı). Hata → reddeder, etiketi kaldırır.
function assets3dScript(url){
  return new Promise((resolve,reject)=>{
    const s=document.createElement("script");
    let done=false;
    const fin=(err)=>{
      if(done) return; done=true; clearTimeout(t);
      if(err){ if(s.parentNode) s.parentNode.removeChild(s); reject(err); } else resolve();
    };
    const t=setTimeout(()=>fin(new Error("zaman aşımı: "+url)),ASSETS3D_TIMEOUT_MS);
    s.src=url; s.async=true;
    if(/^https?:/.test(url)) s.crossOrigin="anonymous";
    s.onload=()=>fin(null); s.onerror=()=>fin(new Error("indirilemedi: "+url));
    document.head.appendChild(s);
  });
}

// GLTFLoader sınıfı → Promise<class|null> (önce yerel kopya, sonra CDN). Reddetmez.
function loadGltfLoader(){
  const T=typeof window!=="undefined"?window.THREE:null;
  if(!T) return Promise.resolve(null);
  if(T.GLTFLoader) return Promise.resolve(T.GLTFLoader);
  if(ASSETS3D_STATE.loader) return ASSETS3D_STATE.loader;
  ASSETS3D_STATE.loader=(async()=>{
    for(const url of ASSETS3D_GLTF_URLS){
      try{ await assets3dScript(url); }catch(e){ continue; }
      if(window.THREE&&window.THREE.GLTFLoader) return window.THREE.GLTFLoader;
    }
    ASSETS3D_STATE.loader=null;   // sonraki kilit anı yeniden denesin
    assets3dWarn("loader","GLTFLoader yüklenemedi");
    return null;
  })();
  return ASSETS3D_STATE.loader;
}

// Ham .glb (ArrayBuffer) → Promise<ArrayBuffer|null>, önbellekli. Başarısız indirme önbelleğe
//   alınmaz (bir sonraki çağrı yeniden dener), ama aynı oturumda tekrar tekrar uyarı basılmaz.
function assets3dBuffer(name){
  const B=ASSETS3D_STATE.buffers;
  if(B[name]) return B[name];
  const url=ASSETS3D_MODEL_DIR+name+".glb";
  B[name]=new Promise(resolve=>{
    let done=false;
    const fin=(v)=>{ if(done) return; done=true; clearTimeout(t); if(!v) delete B[name]; resolve(v); };
    const t=setTimeout(()=>{ assets3dWarn("buf:"+name,url+" zaman aşımı"); fin(null); },ASSETS3D_TIMEOUT_MS);
    try{
      // XHR: Capacitor/yerel sunucuda fetch ile aynı; file:// açılışı zaten oyunu başlatmaz
      const x=new XMLHttpRequest();
      x.open("GET",url,true); x.responseType="arraybuffer";
      x.onload=()=>{
        const ok=(x.status===200||x.status===0)&&x.response&&x.response.byteLength>20;
        // GLB sihirli sayısı "glTF" (0x46546C67)
        const magic=ok?new DataView(x.response).getUint32(0,true):0;
        if(ok&&magic===0x46546C67) fin(x.response);
        else { assets3dWarn("buf:"+name,url+" geçersiz yanıt ("+x.status+")"); fin(null); }
      };
      x.onerror=()=>{ assets3dWarn("buf:"+name,url+" indirilemedi"); fin(null); };
      x.send();
    }catch(e){ assets3dWarn("buf:"+name,url+" istek hatası",e); fin(null); }
  });
  return B[name];
}

// Modeli renk hattına uydur + gölge bayrakları. opts.shadow: {cast,receive}
function assets3dPrepare(THREE,root,opts){
  const o=opts||{};
  const seen=new Set();
  root.traverse(m=>{
    if(!m.isMesh) return;
    m.castShadow=o.cast!==false; m.receiveShadow=o.receive!==false;
    (Array.isArray(m.material)?m.material:[m.material]).forEach(mat=>{
      if(!mat||seen.has(mat)) return; seen.add(mat);
      if(mat.color&&mat.color.convertLinearToSRGB) mat.color.convertLinearToSRGB();
      if(mat.emissive&&mat.emissive.convertLinearToSRGB) mat.emissive.convertLinearToSRGB();
      ["map","emissiveMap"].forEach(k=>{ if(mat[k]){ mat[k].encoding=THREE.LinearEncoding; mat[k].needsUpdate=true; } });
      if(o.aniso>1) ["map","normalMap","roughnessMap"].forEach(k=>{ if(mat[k]) mat[k].anisotropy=o.aniso; });
      mat.needsUpdate=true;
    });
  });
  return root;
}

// Güvenli model yükleyici: Promise<Object3D|null>, ASLA reddetmez.
//   opts.isAlive(): false dönerse (sahne bu arada kapandıysa) model hemen serbest bırakılır → null
//   opts.cast / opts.receive: gölge bayrakları (varsayılan ikisi de açık) · opts.aniso: doku anizotropisi
function loadModel(name,opts){
  const o=opts||{};
  if(ASSETS3D_STATE.failed[name]) return Promise.resolve(null);
  return Promise.all([loadGltfLoader(),assets3dBuffer(name)]).then(([Loader,buf])=>{
    if(!Loader||!buf) return null;
    const THREE=window.THREE;
    return new Promise(resolve=>{
      try{
        new Loader().parse(buf,ASSETS3D_MODEL_DIR,(gltf)=>{
          const root=gltf&&(gltf.scene||(gltf.scenes&&gltf.scenes[0]));
          if(!root){ resolve(null); return; }
          if(o.isAlive&&!o.isAlive()){ disposeObject3D(root); resolve(null); return; }
          try{ assets3dPrepare(THREE,root,o); }catch(e){}
          root.name="glb:"+name;
          resolve(root);
        },(err)=>{
          ASSETS3D_STATE.failed[name]=true;    // bozuk dosya: oturumda yeniden ayrıştırma
          assets3dWarn("parse:"+name,name+".glb ayrıştırılamadı",err);
          resolve(null);
        });
      }catch(e){
        ASSETS3D_STATE.failed[name]=true;
        assets3dWarn("parse:"+name,name+".glb ayrıştırılamadı",e);
        resolve(null);
      }
    });
  }).catch(e=>{ assets3dWarn("load:"+name,name+".glb yüklenemedi",e); return null; });
}

// Modelin dönüşümlerini geometriye işler ve tek düz grup döndürür: her mesh'in matrisi
//   (düğüm ölçek/dönüş zinciri, ör. FBX2glTF'in 100× ölçeği ve −90° X dönüşü) geometriye
//   uygulanır → sonraki sığdırma tek, temiz bir ölçek/konum olur. Malzemeler korunur.
function assets3dFlatten(THREE,root){
  root.updateMatrixWorld(true);
  const out=new THREE.Group(); out.name=root.name;
  const list=[];
  root.traverse(m=>{ if(m.isMesh) list.push(m); });
  list.forEach(m=>{
    const g=m.geometry.clone(); g.applyMatrix4(m.matrixWorld);
    const mm=new THREE.Mesh(g,m.material);
    mm.name=m.name; mm.castShadow=m.castShadow; mm.receiveShadow=m.receiveShadow;
    out.add(mm);
  });
  // Kaynak geometriler artık kullanılmıyor (malzemeler/dokular yeni mesh'lerde yaşıyor)
  list.forEach(m=>{ try{ m.geometry.dispose(); }catch(e){} });
  return out;
}

// Düzleştirilmiş grubun sınır kutusu
function assets3dBox(THREE,group){
  const b=new THREE.Box3();
  group.children.forEach(m=>{ if(m.geometry){ m.geometry.computeBoundingBox(); b.union(m.geometry.boundingBox); } });
  return b;
}

// Geometriyi yerinde dönüştürür: kutu → hedef boyut (sx,sy,sz; null → orantılı), taban/merkez hizası.
//   size: [x,y,z] (metre; null olan eksen en büyük verilen ölçekle orantılı). pivot: "base" (alt
//   yüz y=0, xz merkez) | "center" (tam merkez). Döndürür: uygulanan ölçek [kx,ky,kz].
function assets3dFit(THREE,group,size,pivot){
  const b=assets3dBox(THREE,group), s=new THREE.Vector3(), c=new THREE.Vector3();
  b.getSize(s); b.getCenter(c);
  const ks=[0,1,2].map(i=>(size[i]&&s.getComponent(i)>1e-9)?size[i]/s.getComponent(i):null);
  const kd=Math.max(...ks.filter(v=>v!=null).concat([0]))||1;
  const k=ks.map(v=>v==null?kd:v);
  const m=new THREE.Matrix4().makeScale(k[0],k[1],k[2]);
  const ty=pivot==="center"?-c.y*k[1]:-b.min.y*k[1];
  m.premultiply(new THREE.Matrix4().makeTranslation(-c.x*k[0],ty,-c.z*k[2]));
  group.children.forEach(o=>{ if(o.geometry){ o.geometry.applyMatrix4(m); o.geometry.computeBoundingSphere(); } });
  return k;
}

// Orantısız sığdırmada kalınlaşan ince parçaları (direk/çubuk) inceltir: her mesh'in kutusunda
//   maxT'den kalın OLAN ama longMin'den kısa eksenler kendi merkezinde maxT'ye indirilir.
function assets3dThinBars(THREE,group,maxT,longMin){
  const s=new THREE.Vector3(), c=new THREE.Vector3(), m=new THREE.Matrix4(), t=new THREE.Matrix4();
  group.children.forEach(o=>{
    const g=o.geometry; if(!g) return;
    g.computeBoundingBox(); g.boundingBox.getSize(s); g.boundingBox.getCenter(c);
    const k=[0,1,2].map(i=>{ const v=s.getComponent(i); return (v>maxT&&v<longMin)?maxT/v:1; });
    if(k[0]===1&&k[1]===1&&k[2]===1) return;
    m.makeTranslation(-c.x,-c.y,-c.z);
    m.premultiply(t.makeScale(k[0],k[1],k[2]));
    m.premultiply(t.makeTranslation(c.x,c.y,c.z));
    g.applyMatrix4(m); g.computeBoundingSphere();
  });
}

// ── Top ── ball: players3d'nin top mesh'i (yarıçap r). Model ona çocuk olarak eklenir; mevcut
//   konum/dönme/ölçek mantığı aynen geçerli. Prosedürel küre yalnız gizlenir (malzeme görünmez).
function assets3dApplyBall(THREE,ball,r,isAlive){
  if(!ball) return Promise.resolve(false);
  return loadModel("ball",{isAlive,receive:false}).then(root=>{
    if(!root) return false;
    if(isAlive&&!isAlive()){ disposeObject3D(root); return false; }
    const g=assets3dFlatten(THREE,root);
    assets3dFit(THREE,g,[r*2,r*2,r*2],"center");
    g.children.forEach(m=>{
      m.castShadow=true; m.receiveShadow=false;
      (Array.isArray(m.material)?m.material:[m.material]).forEach(mat=>{
        // Hafif deri parlaklığı (gündüz güneşinde ışık lekesi)
        if(mat&&mat.isMeshStandardMaterial){ mat.roughness=Math.min(mat.roughness,0.5); mat.metalness=0; }
      });
    });
    g.name="glbBall";
    ball.add(g);
    if(ball.material) ball.material.visible=false;   // prosedürel küre çizilmez (gölge de çocuğundan)
    return true;
  });
}

// ── Kaleler ── pitchGroup içindeki goalHome/goalAway gruplarına modelin direk + üst direk
//   parçalarını ekler, prosedürel direk/üst direği gizler. "net" grubu (sallanan file) ve arka
//   destek çerçevesi ("goalFrame") DOKUNULMAZ: modelin üçgen kesitli arka çerçevesi ve kalın file
//   çubukları alınmaz, çünkü kilit an fiziği (moment3d.js) fileyi 2 m derin, tam yükseklikte bir
//   kutu sayar; görünen file bu kutuyla aynı kalmalı. Model: x genişlik, y yükseklik, z derinlik.
//   Kırmızı şeritler beyaza çevrilir (maç kalesi).
function assets3dApplyGoals(THREE,pitchGroup,D,isAlive){
  if(!pitchGroup) return Promise.resolve(false);
  return loadModel("goal",{isAlive}).then(root=>{
    if(!root) return false;
    if(isAlive&&!isAlive()){ disposeObject3D(root); return false; }
    const g=assets3dFlatten(THREE,root);
    // Parçalar: Box001/Box002 direkler, Box005 üst direk (ad "Box001_1" gibi gelir); gerisi atılır
    const boxNo=(m)=>{ const r=/Box0*(\d+)/.exec(String(m.name)); return r?parseInt(r[1],10):NaN; };
    const KEEP=[1,2,5];
    g.children.slice().forEach(m=>{
      if(KEEP.indexOf(boxNo(m))<0){ g.remove(m); try{ m.geometry.dispose(); }catch(e){} }
    });
    if(!g.children.length){ disposeObject3D(g); return false; }
    // Model Y ekseninde birkaç derece dönük: iki direğin (Box001, Box002) merkezlerini x eksenine hizala
    { const ctr=(no)=>{ const b=new THREE.Box3(); g.children.forEach(m=>{ if(boxNo(m)===no){ m.geometry.computeBoundingBox(); b.union(m.geometry.boundingBox); } });
        return b.isEmpty()?null:b.getCenter(new THREE.Vector3()); };
      const a=ctr(1), b=ctr(2);
      if(a&&b){
        const phi=Math.atan2(b.z-a.z,b.x-a.x);
        if(Math.abs(phi)>1e-4&&Math.abs(phi)<0.5){ const r=new THREE.Matrix4().makeRotationY(phi); g.children.forEach(m=>m.geometry.applyMatrix4(r)); }
      } }
    const pr=0.06;   // direk yarıçapı (prosedürel ile aynı)
    assets3dFit(THREE,g,[D.goalWidth+pr*2,D.goalHeight+pr,null],"base");
    assets3dThinBars(THREE,g,pr*2,1.2);
    const white=new THREE.MeshPhongMaterial({color:0xffffff,specular:0x8a8a8a,shininess:70,emissive:0x202020});
    const oldMats=new Set();
    g.children.forEach(m=>{
      (Array.isArray(m.material)?m.material:[m.material]).forEach(x=>x&&oldMats.add(x));
      m.material=white; m.castShadow=true; m.receiveShadow=true;
    });
    oldMats.forEach(x=>{ try{ x.dispose(); }catch(e){} });
    let n=0;
    [-1,1].forEach(s=>{
      const goal=pitchGroup.getObjectByName(s<0?"goalHome":"goalAway");
      if(!goal) return;
      // Prosedürel direk + üst direk gizlenir (file ve arka destekler kalır); dispose sahneyle birlikte
      goal.children.forEach(c=>{ if(c.name!=="net"&&c.name!=="goalFrame") c.visible=false; });
      const m=n===0?g:g.clone();   // klon: geometri/malzeme paylaşılır (sahne dispose'u bir kez serbest bırakır)
      // Ön yüz −z → sahaya bakmalı: s=+1 (x=+L) kalesi için ön yüz −x, s=−1 için +x
      m.rotation.y=s>0?Math.PI/2:-Math.PI/2;
      // Fit sonrası direkler z=0 merkezli → direk merkezi kale çizgisinde (x=s·L), prosedürelle aynı
      m.position.set(s*D.halfLen,0,0);
      m.name="glbGoal"; goal.add(m); n++;
    });
    if(!n){ disposeObject3D(g); return false; }
    return true;
  });
}

// ── Köşe tribün modülleri (gündüz) ── pts: [[x,z,yönY,uzunluk],...]. Model ön yüzü −z.
function assets3dApplyStands(THREE,group,pts,isAlive){
  if(!group||!pts||!pts.length) return Promise.resolve(false);
  return loadModel("stadium",{isAlive}).then(root=>{
    if(!root) return false;
    if(isAlive&&!isAlive()){ disposeObject3D(root); return false; }
    const g=assets3dFlatten(THREE,root);
    assets3dFit(THREE,g,[1,null,null],"base");   // 1 m uzunluğa normalize; örnek başına ölçeklenir
    pts.forEach(([x,z,ry,len],i)=>{
      const m=i===0?g:g.clone();
      m.scale.setScalar(len); m.position.set(x,0,z); m.rotation.y=ry; m.name="glbStand";
      group.add(m);
    });
    return true;
  });
}

// ── Ağaçlar (gündüz) ── prosedürel InstancedMesh'in örnek matrislerini (konum/dönüş/ölçek) ve
//   renk tonlarını aynen kullanır: model mesh'i başına bir InstancedMesh (2 çizim çağrısı).
//   Başarılıysa prosedürel ağaçlar gizlenir. height: ölçek 1'deki ağaç boyu (prosedürel ≈ 11 m).
function assets3dApplyTrees(THREE,group,procTrees,height,isAlive){
  if(!group||!procTrees) return Promise.resolve(false);
  return loadModel("tree",{isAlive}).then(root=>{
    if(!root) return false;
    if(isAlive&&!isAlive()){ disposeObject3D(root); return false; }
    const g=assets3dFlatten(THREE,root);
    assets3dFit(THREE,g,[null,height,null],"base");
    const cnt=procTrees.count, mtx=new THREE.Matrix4(), col=new THREE.Color();
    const made=[];
    g.children.forEach(m=>{
      const im=new THREE.InstancedMesh(m.geometry,m.material,cnt);
      // Gölge atmaz (prosedürel ağaçlar gibi): ~64 örnek × model üçgeni gölge geçişinde ikinci kez
      //   çizilmesin (mobil); ağaçların çoğu zaten güneş gölge kamerasının dışında
      im.name="glbTrees"; im.frustumCulled=false; im.castShadow=false; im.receiveShadow=true;
      for(let i=0;i<cnt;i++){
        procTrees.getMatrixAt(i,mtx); im.setMatrixAt(i,mtx);
        if(procTrees.instanceColor){ procTrees.getColorAt(i,col); im.setColorAt(i,col); }
      }
      im.instanceMatrix.needsUpdate=true;
      if(im.instanceColor) im.instanceColor.needsUpdate=true;
      made.push(im);
    });
    if(!made.length) return false;
    made.forEach(im=>group.add(im));
    procTrees.visible=false;
    return true;
  });
}

// ═══════════════════════════════════════════════════════════════
// İNSAN OYUNCU MODELİ (player.glb: Quaternius "Man", CC0, iskeletli) — prosedürel rig ile sürülür
// ═══════════════════════════════════════════════════════════════
// Oyun mantığı ve TÜM animasyonlar (koşu, vuruş, dalış, kayma, düşme, sevinç) rig3d.js'teki
//   eklemli rigde kalır; rig görünmez "sürücü" olur. Her karede rig eklemlerinin dönüşleri modelin
//   kemiklerine aktarılır (sync): gövde → Body, baş → Head, kollar → UpperArm, uyluk → UpperLeg,
//   baldır → LowerLeg. Hedef kemik dünyası = sürücü dönüşü × kemiğin dinlenme dünyası (kollar/
//   bacaklar önce dümdüz aşağı hizalanır: rigin sıfır duruşu "kollar yanda, bacaklar düz").
//   Kalça yer değiştirmesi (dalışta yana uçuş, çömelme) Body kemiğinin konumuna yazılır.
// Model Blender IK düzeninde: ayak kemikleri baldıra değil köke bağlı → yüklemede baldıra
//   bağlanır (attach, dünya dönüşü korunur), böylece ayak bacağı izler.
// Forma: modelin Shirt/Pants/Socks/Skin/Hair malzemeleri takım/kaleci renkleriyle (rig3d kitCol,
//   SKIN, HAIR) Lambert malzemelere çevrilir; malzemeler kit+ten+saç başına önbellekli (paylaşılır).
// Boy: model rig boyuna (ASSETS3D_RIG_H, rig birimi) ölçeklenir; gerçek boy küçültmesi (kaleci,
//   baraj) players3d'de oyuncu başına ölçek grubuyla yapılır.
// Kare maliyeti: oyuncu başına 8 kemik, yalnız quaternion çarpımı (tahsis yok).
const ASSETS3D_RIG_H=RIG3D_RIG_H;   // prosedürel rig boyu (rig3d.js daha önce yüklenir)

function assets3dLoadPlayerKit(THREE,rigKit,isAlive){
  if(!rigKit) return Promise.resolve(null);
  return loadModel("player",{isAlive,receive:false}).then(root=>{
    if(!root) return null;
    if(isAlive&&!isAlive()){ disposeObject3D(root); return null; }
    try{ return assets3dBuildPlayerKit(THREE,root,rigKit); }
    catch(e){ assets3dWarn("playerkit","player.glb iskeleti uyumsuz",e); disposeObject3D(root); return null; }
  });
}

function assets3dBuildPlayerKit(THREE,root,rigKit){
  const norm=(s)=>String(s||"").replace(/[^A-Za-z0-9]/g,"").toLowerCase();
  const findBones=(obj)=>{ const b={}; obj.traverse(o=>{ if(o.isBone) b[norm(o.userData&&o.userData.name||o.name)]=o; }); return b; };
  const B0=findBones(root);
  const need=["body","head","upperarml","upperarmr","lowerarml","lowerarmr","upperlegl","upperlegr","lowerlegl","lowerlegr"];
  for(const n of need) if(!B0[n]) throw new Error("kemik yok: "+n);
  root.updateMatrixWorld(true);
  // IK ayakları baldıra bağla (varsa)
  [["footl","lowerlegl"],["footr","lowerlegr"]].forEach(([f,l])=>{ if(B0[f]&&B0[l]&&B0[f].parent!==B0[l]) B0[l].attach(B0[f]); });
  const skinned=[]; root.traverse(o=>{ if(o.isSkinnedMesh) skinned.push(o); });
  if(!skinned.length) throw new Error("SkinnedMesh yok");

  // Sarmalayıcı: ayak tabanı y=0, kalça xz merkezde, yüz +Z, boy ASSETS3D_RIG_H
  const wrap=new THREE.Group(); wrap.name="glbPlayer"; wrap.add(root);
  wrap.updateMatrixWorld(true);
  const box=new THREE.Box3().setFromObject(root), size=new THREE.Vector3(); box.getSize(size);
  if(!(size.y>1e-6)) throw new Error("model boyu 0");
  const k=ASSETS3D_RIG_H/size.y;
  const hip=new THREE.Vector3(); B0.body.getWorldPosition(hip);
  root.scale.multiplyScalar(k);
  root.position.set(-hip.x*k,-box.min.y*k,-hip.z*k);
  wrap.updateMatrixWorld(true);
  // Yüz yönü: göz malzemeli mesh'in merkezi baş kemiğinin önünde olmalı (+Z)
  { const eye=skinned.find(m=>/eye/i.test(m.material&&m.material.name||""));
    const hp=new THREE.Vector3(); B0.head.getWorldPosition(hp);
    if(eye){
      eye.geometry.computeBoundingBox();
      const ec=eye.geometry.boundingBox.getCenter(new THREE.Vector3()).applyMatrix4(eye.matrixWorld);
      const dx=ec.x-hp.x, dz=ec.z-hp.z;
      if(Math.hypot(dx,dz)>1e-4){ wrap.rotation.y=-Math.atan2(dx,dz); wrap.updateMatrixWorld(true); }
    } }
  // Model yüzü +Z'de: karakterin solu +X. Rig solu (armL/thighL) +X'te → L/R eşleşmesi kemik konumundan
  const wp=(b)=>b.getWorldPosition(new THREE.Vector3());
  const swap=wp(B0.upperarml).x<wp(B0.upperarmr).x;
  const sideL=swap?"r":"l", sideR=swap?"l":"r";

  // Eşlenen kemikler (ebeveyn önce). drv: rig sürücüsü · anc: en yakın eşlenen ata (MAP indisi) ·
  //   child: hizalama yönü için alt kemik
  const MAP=[
    {n:"body",drv:"body"},
    {n:"head",drv:"head",anc:0},
    {n:"upperarm"+sideL,drv:"armL",anc:0,child:"lowerarm"+sideL},
    {n:"upperarm"+sideR,drv:"armR",anc:0,child:"lowerarm"+sideR},
    {n:"upperleg"+sideL,drv:"thighL",anc:0,child:"lowerleg"+sideL},
    {n:"lowerleg"+sideL,drv:"shinL",anc:4,child:"foot"+sideL},
    {n:"upperleg"+sideR,drv:"thighR",anc:0,child:"lowerleg"+sideR},
    {n:"lowerleg"+sideR,drv:"shinR",anc:6,child:"foot"+sideR},
  ];
  const down=new THREE.Vector3(0,-1,0), qa=new THREE.Quaternion();
  const getRW=(b)=>b.getWorldQuaternion(new THREE.Quaternion());
  MAP.forEach(m=>{
    const b=B0[m.n];
    m.restW=getRW(b);
    m.R0=m.restW.clone();
    if(m.child){
      const c=B0[m.child]||(b.children.find(o=>o.isBone));
      if(c){
        const d=wp(c).sub(wp(b));
        if(d.lengthSq()>1e-12){ qa.setFromUnitVectors(d.normalize(),down); m.R0.premultiply(qa); }
      }
    }
  });
  MAP.forEach(m=>{
    // Ebeveynin şimdiki dünyası = ata kemiğin şimdiki dünyası × rel (aradaki kemikler dinlenmede)
    //   · ata yoksa (Body) ebeveyn sabittir
    const pw=getRW(B0[m.n].parent);
    if(Number.isInteger(m.anc)) m.rel=MAP[m.anc].restW.clone().invert().multiply(pw);
    else m.parW=pw;
  });
  // Body konumu: dinlenme dünyası (sarmalayıcı uzayı) + ebeveyninin (sabit) ters dünya matrisi
  const bodyM=MAP[0];
  bodyM.P0=wp(B0.body);
  bodyM.invPM=new THREE.Matrix4().copy(B0.body.parent.matrixWorld).invert();

  // Malzemeler: kit + ten + saç başına önbellek (r128: iskeletli mesh için skinning:true)
  const C=rigKit.kitCol||{}, SKIN=rigKit.SKIN||[0xe0b48c], HAIR=rigKit.HAIR||[0x2b1d14];
  const matCache={};
  const partOf=(name)=>{ const s=String(name||"").toLowerCase();
    return /shirt/.test(s)?"shirt":/pant|short/.test(s)?"shorts":/sock/.test(s)?"socks":/skin/.test(s)?"skin":
      /hair/.test(s)?"hair":/eye/.test(s)?"eyes":/shoe|boot/.test(s)?"boot":"other"; };
  const colorFor=(part,kit,skin,hair)=>{
    const c=C[kit]||C.home||{};
    switch(part){
      case "shirt": return c.shirt!=null?c.shirt:0x2485ff;
      case "shorts": return c.shorts!=null?c.shorts:0xf2f2f2;
      case "socks": return c.socks!=null?c.socks:0x123a7a;
      case "skin": return SKIN[skin%SKIN.length];
      case "hair": return HAIR[hair%HAIR.length];
      case "eyes": return 0x0b0907;   // koyu göz: yüz okunur
      case "boot": return 0x111111;
      default: return 0xcccccc;
    }
  };
  const getMat=(srcMat,kit,skin,hair)=>{
    const part=partOf(srcMat&&srcMat.name), key=part+"|"+kit+"|"+skin+"|"+hair;
    if(!matCache[key]){
      // Kumaş/ten mat (plastik parlama yok): parça başına pürüzlülük; kalecide şort/tozluk daha mat
      const gkK=/GK$/.test(String(kit));
      const rough={shirt:0.84,shorts:gkK?0.9:0.78,socks:0.92,skin:0.62,hair:0.95,eyes:0.35,boot:0.5}[part]||0.85;
      const m=new THREE.MeshStandardMaterial({color:colorFor(part,kit,skin,hair),roughness:rough,metalness:0,skinning:true});
      m.name="glbKit_"+part; matCache[key]=m;
    }
    return matCache[key];
  };
  skinned.forEach(m=>{ m.userData.srcMat=m.material; });

  // KALECİ AKSESUARI: eldiven (avuç→parmak arası) ve kontrast renkli krampon (bilek→parmak ucu).
  //   Modelde ayrı eldiven/ayakkabı malzemesi yok → küçük düşük poligonlu parçalar dinlenme
  //   duruşunda yerleştirilip ilgili kemiğe bağlanır (attach: dünya dönüşü korunur), kemikle hareket
  //   eder. Yalnız kaleci formasında görünür (inst.setKit). Boyutlar rig biriminde (1 m ≈ 1.75).
  const U=ASSETS3D_RIG_H/1.82;
  const gloveMat=new THREE.MeshStandardMaterial({color:0xf4f4f4,roughness:0.7,metalness:0}); gloveMat.name="glbGloveMat";
  const gloveCuff=new THREE.MeshStandardMaterial({color:0x1a1a1a,roughness:0.75,metalness:0}); gloveCuff.name="glbGloveCuff";
  const bootMat=new THREE.MeshStandardMaterial({color:0xd8ff1e,roughness:0.45,metalness:0}); bootMat.name="glbBootMat";
  const soleMat=new THREE.MeshStandardMaterial({color:0x111111,roughness:0.6,metalness:0}); soleMat.name="glbSoleMat";
  matCache["acc|glove"]=gloveMat; matCache["acc|cuff"]=gloveCuff; matCache["acc|boot"]=bootMat; matCache["acc|sole"]=soleMat;
  const gloveGeo=new THREE.IcosahedronGeometry(1,1);              // birim; elin ölçülen boyuna ölçeklenir
  const cuffGeo=new THREE.CylinderGeometry(1,1.1,1,8);
  const bootGeo=new THREE.BoxGeometry(1,1,1), soleGeo=new THREE.BoxGeometry(1,1,1);
  const addAcc=(bone,mesh,name)=>{ mesh.name=name; mesh.castShadow=true; mesh.visible=false; mesh.updateMatrixWorld(true); bone.attach(mesh); };   // ebeveynsiz: yerel = dünya (sarmalayıcı uzayı)
  [["l",sideL],["r",sideR]].forEach(([tag,sd])=>{
    // Eldiven: avuç kemiğinden parmak ucuna (Fingers_end) uzanan elipsoit — boyu elin ölçülen
    //   uzunluğu (+%15), eni/kalınlığı bunun oranı → modelin el boyutuna oturur, parmak taşmaz
    const palm=B0["palm"+sd], tip=B0["fingers"+sd+"end"]||B0["fingers"+sd]||B0["middlehand"+sd];
    if(palm&&tip){
      const p=wp(palm), q=wp(tip), hl=Math.max(0.05*U,p.distanceTo(q));
      const d=q.clone().sub(p).normalize(), c=p.clone().lerp(q,0.5);
      const g=new THREE.Mesh(gloveGeo,gloveMat); g.position.copy(c);
      g.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d);
      g.scale.set(hl*0.58,hl*0.66,hl*0.42);
      addAcc(palm,g,"glbGlove");
      const cf=new THREE.Mesh(cuffGeo,gloveCuff); cf.position.copy(p).addScaledVector(d,-hl*0.05);
      cf.quaternion.copy(g.quaternion); cf.scale.set(hl*0.34,hl*0.24,hl*0.34);
      addAcc(palm,cf,"glbGlove");
    }
    const foot=B0["foot"+sd], toe=B0["foot"+sd+"end"];
    if(foot){
      const a=wp(foot), t=toe?wp(toe):a.clone().add(new THREE.Vector3(0,0,0.16*U));
      const dx=t.x-a.x, dz=t.z-a.z, len=Math.max(0.2*U,Math.hypot(dx,dz)+0.1*U), yaw=Math.atan2(dx,dz);
      const cx=(a.x+t.x)/2+Math.sin(yaw)*0.02*U, cz=(a.z+t.z)/2+Math.cos(yaw)*0.02*U;
      const b=new THREE.Mesh(bootGeo,bootMat); b.scale.set(0.105*U,0.085*U,len); b.position.set(cx,0.06*U,cz); b.rotation.y=yaw;
      addAcc(foot,b,"glbBoot");
      const so=new THREE.Mesh(soleGeo,soleMat); so.scale.set(0.11*U,0.025*U,len*1.02); so.position.set(cx,0.0125*U,cz); so.rotation.y=yaw;
      addAcc(foot,so,"glbBoot");
    }
  });

  // Sürücü dönüşü (kare başına tahsis yok)
  const qB=new THREE.Quaternion(), qD=new THREE.Quaternion(), qP=new THREE.Quaternion(), qT=new THREE.Quaternion();
  const vP=new THREE.Vector3();
  const drvQ=(rig,name,out)=>{
    switch(name){
      case "body": return out.copy(qB);
      case "head": return out.copy(qB).multiply(rig.head.quaternion);
      case "armL": return out.copy(qB).multiply(rig.armL.quaternion);
      case "armR": return out.copy(qB).multiply(rig.armR.quaternion);
      case "thighL": return out.copy(qB).multiply(rig.thighL.quaternion);
      case "thighR": return out.copy(qB).multiply(rig.thighR.quaternion);
      case "shinL": return out.copy(qB).multiply(rig.thighL.quaternion).multiply(rig.shinL.quaternion);
      case "shinR": return out.copy(qB).multiply(rig.thighR.quaternion).multiply(rig.shinR.quaternion);
    }
    return out.identity();
  };

  // Bir örnek: iskeletli klon (SkeletonUtils.clone eşdeğeri: kemikler sırayla eşlenip yeniden bağlanır)
  const make=(kit,skin,hair)=>{
    const src=[], dst=[];
    const cw=wrap.clone(true);
    wrap.traverse(o=>src.push(o)); cw.traverse(o=>dst.push(o));
    const map=new Map(); src.forEach((o,i)=>map.set(o,dst[i]));
    const meshes=[];
    src.forEach((o,i)=>{
      if(!o.isSkinnedMesh) return;
      const d=dst[i];
      const bones=o.skeleton.bones.map(b=>map.get(b));
      d.bind(new THREE.Skeleton(bones,o.skeleton.boneInverses),o.bindMatrix);
      d.castShadow=true; d.receiveShadow=false; d.frustumCulled=false;   // dalışta kemikler bağ kutusundan çıkar
      d.userData.srcMat=o.userData.srcMat;
      meshes.push(d);
    });
    const acc=[]; cw.traverse(o=>{ if(o.isMesh&&!o.isSkinnedMesh&&/^glb(Glove|Boot)$/.test(o.name)) acc.push(o); });
    const Bi=findBones(cw);
    const bones=MAP.map(m=>Bi[m.n]);
    const W=MAP.map(()=>new THREE.Quaternion());   // eşlenen kemiklerin şimdiki dünyası (sarmalayıcı uzayı)
    const inst={root:cw,kit:null,skin:skin|0,hair:hair|0};
    inst.setKit=(k2)=>{
      if(inst.kit===k2) return; inst.kit=k2;
      meshes.forEach(d=>{ d.material=getMat(d.userData.srcMat,k2,inst.skin,inst.hair); });
      const gkOn=/GK$/.test(String(k2));
      acc.forEach(o=>{ o.visible=gkOn; });   // eldiven + krampon yalnız kalecide
    };
    inst.setKit(kit);
    inst.sync=(rig)=>{
      qB.copy(rig.body.quaternion);
      for(let i=0;i<MAP.length;i++){
        const m=MAP[i], b=bones[i]; if(!b) continue;
        drvQ(rig,m.drv,qD);
        W[i].copy(qD).multiply(m.R0);                       // hedef dünya
        if(m.rel) qP.copy(W[m.anc]).multiply(m.rel); else qP.copy(m.parW);
        b.quaternion.copy(qT.copy(qP).invert().multiply(W[i]));
      }
      // Kalça konumu: rigin kalça yer değiştirmesi (dalış, çömelme, sıçrama)
      const bp=rig.body.position;
      vP.set(bodyM.P0.x+bp.x,bodyM.P0.y+(bp.y-RIG3D_HIP),bodyM.P0.z+bp.z).applyMatrix4(bodyM.invPM);
      if(bones[0]) bones[0].position.copy(vP);
    };
    return inst;
  };
  const dispose=()=>{
    Object.keys(matCache).forEach(k2=>{ try{ matCache[k2].dispose(); }catch(e){} });
    disposeObject3D(wrap);
  };
  return {make,dispose};
}
