// ═══════════════════════════════════════════════════════════════
// 3D KİLİT AN — InteractiveMoment3D (rota çizerek pas / şut / müdahale)
// ═══════════════════════════════════════════════════════════════
// Kullanım (overlay.js): <InteractiveMoment3D moment myStr oppStr onResolve/>
//   Props ve onResolve sözleşmesi 2D InteractiveMoment ile BİREBİR aynıdır:
//   onResolve({success,goalScored,goalConceded,optionId,player,momentType,msg})
// Akış: seçenek seç → sahaya rota çiz (≤ MOMENT3D_DRAW_SEC sn) → güç barını
//   durdur → sonucun 3D animasyonu → sonuç kartı → ~2.8 sn sonra onResolve.
// Geri dönüş: WebGL yoksa, Three.js yüklenemezse veya Pitch3D hata verirse
//   aynı props ile 2D InteractiveMoment gösterilir; "2D'ye geç" düğmesi de var.
// Koordinat: 3D yardımcılarla aynı (x=0 bizim kale, x=100 rakip kale).
// Bellek: kilit an kapanınca kendi Pitch3D'si (ayrı WebGL bağlamı) unmount olur;
//   denetleyici pointer dinleyicilerini, kare kancasını, oyuncuları ve kendi
//   geometri/malzemelerini addDisposeHook ile serbest bırakır.
// ═══════════════════════════════════════════════════════════════

const MOMENT3D_DRAW_SEC=8;         // çizim süresi sınırı (sn)
const MOMENT3D_ATT_SPEED=7.5;      // müdahale anında rakip forvetin koşu hızı (m/sn)
const MOMENT3D_DEF_SPEED=8;        // bizim savunmacının yetişme hızı (m/sn)

// Olay tipine göre dizilim (0–100 saha yüzdesi) + kamera (dünya, metre).
//   carrier: moment.player (bizim takım, indeks 0) · mates: takım arkadaşları
//   opps: rakip saha oyuncuları · gk: rakip kaleci · myGk: bizim kaleci
//   attacker/runTo: (tackle) topu süren rakip ve koşu hedefi · wall: duvar sayısı
const MOMENT3D_LAYOUTS={
  corner:{
    ball:[99.2,1.2], carrier:[100.6,-0.6],
    mates:[[93,9],[93.5,40],[91,52],[88,62],[95,47]],
    opps:[[94.5,42],[92,50],[89,60],[96.5,52],[86,36],[93,12.5]],
    gk:[98.7,50],
    cam:{pos:[56,10,-42],look:[38,0,-1]},            // köşe bayrağının arkası
  },
  freekick:{
    ball:[78,34], carrier:[76.2,32],
    mates:[[89,45],[87,58],[91,53],[84,66]],
    opps:[[90,47.5],[88,56],[92,55.5],[85,64]],
    wall:4, gk:[98.6,50],
    cam:{pos:[18.5,6.5,-16],look:[46,0,-1]},          // topun arkası, kaleye bakış
  },
  counter:{
    ball:[58,50], carrier:[57,50],
    mates:[[70,22],[72,78],[62,34],[50,64]],
    opps:[[72.5,25],[74.5,74],[64.5,37],[80,48],[53,61]],
    gk:[98,50],
    cam:{pos:[-4,9,7],look:[36,0,-2]},                // hücum edenin arkası
  },
  penalty:{
    ball:[89.5,50], carrier:[87.3,50.5],
    mates:[[82,28],[82,72],[80,44]],
    opps:[[82.5,34],[82.5,66],[81,56]],
    gk:[99.6,50],
    cam:{pos:[31,3.6,3.5],look:[52.5,1.1,0]},         // vurucunun arkası, hafif yandan
  },
  oneonone:{
    ball:[84,46], carrier:[83,46],
    mates:[[74,24],[70,64]],
    opps:[[78,52],[75,38]],
    gk:[95,49],
    cam:{pos:[25,5,0],look:[52.5,0.6,-0.5]},          // forvetin arkası
  },
  tackle:{
    ball:[31,42], attacker:[30.2,42], runTo:[10,49],
    carrier:[21,57],                                  // bizim savunmacı (moment.player)
    mates:[[15,36],[16,66]], myGk:[1.8,50],
    opps:[[25,26],[36,64]],
    cam:{pos:[-63,9,9],look:[-27,0,-2]},              // bizim kale tarafı
  },
};

// Seçenek → ne çizilecek. lofted: havadan top (risk yalnız iniş bölgesinde),
// header: pası kafayla bitir, carry: şuttan önce topu rotanın bir kısmında sür.
const MOMENT3D_OPTION_KIND={
  corner:  {high:{kind:"pass",lofted:true,header:true},short:{kind:"pass"},far:{kind:"pass",lofted:true,header:true}},
  freekick:{direct:{kind:"shot"},wall:{kind:"shot",lofted:true},pass:{kind:"pass"}},
  counter: {sprint:{kind:"pass"},dribble:{kind:"shot",carry:true},wait:{kind:"pass"}},
  penalty: {power:{kind:"shot"},place:{kind:"shot"},chip:{kind:"shot",lofted:true}},
  oneonone:{shoot:{kind:"shot"},lob:{kind:"shot",lofted:true},fake:{kind:"shot",carry:true}},
  tackle:  {slide:{kind:"tackle"},block:{kind:"tackle"},foul:{kind:"tackle"}},
};

const MOMENT3D_KIND_TEXT={
  pass:  {tag:"Pas rotası",      hint:"✍️ Toptan takım arkadaşına doğru pas rotası çiz"},
  shot:  {tag:"Şut rotası",      hint:"✍️ Toptan kaleye doğru şut rotası çiz (kale içi = yeşil)"},
  tackle:{tag:"Müdahale noktası",hint:"👆 Rakibin kırmızı koşu yoluna dokun ya da çiz: müdahale noktası"},
};

// Rota üzerindeki rakiplerin "kesilme riski" (0–1).
// pts: [{x,z}] dünya, opps: [{x,z,w?}] (w: rakip ağırlığı, ör. duvar şutta) → {risk, idx (en tehlikeli rakip), u (rota oranı), x, z}
function moment3dRouteRisk(pts,opps,lofted){
  const out={risk:0,idx:-1,u:0,x:0,z:0};
  if(!pts||pts.length<2||!opps||!opps.length) return out;
  const cum=[0]; let total=0;
  for(let i=1;i<pts.length;i++){ total+=Math.hypot(pts[i].x-pts[i-1].x,pts[i].z-pts[i-1].z); cum.push(total); }
  if(total<=0) return out;
  let keep=1, worst=0;
  for(let j=0;j<opps.length;j++){
    const o=opps[j]; if(!o) continue;
    let bestD=1e9, bestU=0, bx=0, bz=0;
    for(let i=1;i<pts.length;i++){
      const a=pts[i-1], b=pts[i], dx=b.x-a.x, dz=b.z-a.z, l2=dx*dx+dz*dz;
      let t=l2>0?((o.x-a.x)*dx+(o.z-a.z)*dz)/l2:0; t=t<0?0:t>1?1:t;
      const px=a.x+dx*t, pz=a.z+dz*t, d=Math.hypot(o.x-px,o.z-pz);
      if(d<bestD){ bestD=d; bestU=(cum[i-1]+Math.sqrt(l2)*t)/total; bx=px; bz=pz; }
    }
    // Havadan topta yalnız iniş bölgesi (son %28) tam risk taşır; yerden topta
    // topun ilk 1.5 metresinde rakip araya giremez sayılır.
    const w=lofted?(bestU>0.72?1:0.2):(bestU*total<1.5?0.3:1);
    const base=Math.max(0,1-bestD/3.5);
    const r=Math.pow(base,1.3)*0.85*w*(Number.isFinite(o.w)?o.w:1);
    keep*=(1-r);
    if(r>worst){ worst=r; out.idx=j; out.u=bestU; out.x=bx; out.z=bz; }
  }
  out.risk=1-keep;
  return out;
}

// ── DENGE: rota kalitesi → başarı şansına eklenen terim ──
// calcMomentChance (moments.js) 2D formülünün aynısıdır; 3D yalnızca bu terimi ekler.
// q=0.6 (tipik, makul bir rota: orta risk + alıcıya yakın / kale içi ama köşe değil)
// → 0; mükemmel rota (q=1) → +0.12; kötü rota (q≤0.2, ör. kale dışı) → −0.12.
// Çoğu oyuncu q≈0.5–0.75 aralığında çizer → ortalama terim ≈ 0…+0.04, yani
// ortalama başarı oranı 2D ile kabaca aynı kalır (başsız testte rastgele makul
// rotalarla tip başına ortalama terim −0.07…+0.05, genel ortalama ≈ 0). Süre dolup
// otomatik rota seçilirse kalite 0.6'yla sınırlanır ve ayrıca −0.04 uygulanır.
// Sonuç yine 0.08–0.92 ile sınırlanır.
function moment3dRouteTerm(q){
  const v=(Number.isFinite(q)?q:0.6)-0.6;
  return Math.max(-0.12,Math.min(0.12,v*0.3));
}

// Başarısızlık mesajına uygun animasyon: "wide" | "post" | "save" | "cut"
function moment3dFailKind(msg){
  const m=String(msg||"");
  if(/dışarı|yüksek kaldı/i.test(m)) return "wide";
  if(/[dD]irekten/.test(m)) return "post";
  if(/kaleci|kurtar|tuttu|yakaladı|atıldı/i.test(m)) return "save";
  return "cut";
}

// Rota değerlendirmesinin kısa metni ve rengi (HTML rozeti için)
function moment3dRouteLabel(ev){
  if(!ev||!ev.valid) return "";
  const q=Math.round(ev.quality*100);
  if(ev.kind==="shot") return ev.inGoal
    ?`✓ Kale içinde · Blok riski %${Math.round(ev.risk*100)} · Kalite %${q}`
    :`✗ Kale dışı · Kalite %${q}`;
  if(ev.kind==="tackle") return `Zamanlama %${Math.round(ev.timing*100)} · Kalite %${q}`;
  return `Kesilme riski %${Math.round(ev.risk*100)} · ${ev.recvDist<4?"Alıcı hazır":"Alıcı uzak"} · Kalite %${q}`;
}
function moment3dRouteColor(ev){
  if(!ev||!ev.valid) return 0xffffff;
  if(ev.kind==="shot") return ev.inGoal?(ev.risk>0.4?0xf39c12:0x2ecc71):0xe74c3c;
  return ev.quality>=0.6?0x2ecc71:ev.quality>=0.38?0xf39c12:0xe74c3c;
}

// Kilit an sahne denetleyicisi (React dışı). api: Pitch3D onReady api'si.
// cfg: {type, label, onRoute(ev,final), onAnimEnd()}
// Dönüş: {begin(info), setInput(on), clear(), getEval(), autoRoute(), play(outcome), dispose()}
function createMoment3DController(api,cfg){
  const lay=MOMENT3D_LAYOUTS[cfg.type];
  if(!api||!api.THREE||api.isDisposed()||!lay) throw new Error("Kilit an sahnesi kurulamadı: "+cfg.type);
  const THREE=api.THREE, D=PITCH3D_DIM, L=D.halfLen, H=D.halfWid, GW=D.goalWidth/2;
  const isTackle=cfg.type==="tackle";
  const clamp=(v,a,b)=>v<a?a:v>b?b:v;
  const wp=(p)=>{ const w=pitchToWorld3D(p[0],p[1]); return {x:w.x,z:w.z}; };
  const flat=(geo)=>{ geo.rotateX(-Math.PI/2); return geo; };

  // ── Dizilim → statik snapshot (createMatchActors3D yeniden kullanılır) ──
  const ballW=wp(lay.ball);
  const my=[], opp=[], mateW=[], riskers=[]; // riskers: {x,z,idx(opp dizisinde),gk}
  my.push({id:0,x:lay.carrier[0],y:lay.carrier[1],role:isTackle?"CB":"ST"});
  const defW=wp(lay.carrier);
  lay.mates.forEach(m=>{ my.push({id:my.length,x:m[0],y:m[1],role:"CM"}); mateW.push(wp(m)); });
  let myGkIdx=-1;
  if(lay.myGk){ myGkIdx=my.length; my.push({id:my.length,x:lay.myGk[0],y:lay.myGk[1],role:"GK"}); }
  let attW=null, runW=null;
  if(lay.attacker){ opp.push({id:0,x:lay.attacker[0],y:lay.attacker[1],role:"ST"}); attW=wp(lay.attacker); runW=wp(lay.runTo); }
  lay.opps.forEach(o=>{ const w=wp(o); riskers.push({x:w.x,z:w.z,idx:opp.length,gk:false}); opp.push({id:opp.length,x:o[0],y:o[1],role:"CB"}); });
  if(lay.wall){
    // Duvar: toptan kaleye doğru 9.15 m'de, doğrultuya dik
    const dx=L-ballW.x, dz=0-ballW.z, dl=Math.hypot(dx,dz)||1, ux=dx/dl, uz=dz/dl;
    for(let k=0;k<lay.wall;k++){
      const off=(k-(lay.wall-1)/2)*0.8;
      const w={x:ballW.x+ux*9.15-uz*off, z:ballW.z+uz*9.15+ux*off};
      const p=worldToPitch3D(w.x,w.z);
      riskers.push({x:w.x,z:w.z,idx:opp.length,gk:false,wall:true});
      opp.push({id:opp.length,x:p.x,y:p.y,role:"CB"});
    }
  }
  let gkIdx=-1, gkW=null;
  if(lay.gk){ gkIdx=opp.length; gkW=wp(lay.gk); riskers.push({x:gkW.x,z:gkW.z,idx:gkIdx,gk:true}); opp.push({id:opp.length,x:lay.gk[0],y:lay.gk[1],role:"GK"}); }
  // Şut blok riski: kaleci hariç; duvar şutun yüksek gittiği için kısmen bloklar
  const fieldRiskers=riskers.filter(r=>!r.gk).map(r=>r.wall?{x:r.x,z:r.z,idx:r.idx,gk:false,w:0.3}:r);
  const snap={my,opp,ball:lay.ball,events:[],labels:[cfg.label||""]};
  const actors=createMatchActors3D(api,{getSnapshot:()=>snap});

  // ── Kamera: önce uzaktan, ilk karede olay noktasına yumuşakça yaklaşır ──
  const cp=lay.cam.pos, cl=lay.cam.look;
  api.setCustomCamera(cl[0]+(cp[0]-cl[0])*2.2,cp[1]*1.6+10,cl[2]+(cp[2]-cl[2])*2.2,cl[0],cl[1],cl[2],true);
  let introPending=true;

  // ── Görseller (kendi kaynaklarımız; dispose'da serbest) ──
  const owned={geos:[],mats:[]};
  const G=(g)=>{ owned.geos.push(g); return g; };
  const M=(m)=>{ owned.mats.push(m); return m; };
  const group=new THREE.Group(); group.name="moment3d";
  api.groups.fx.add(group);
  const basic=(color,opacity)=>M(new THREE.MeshBasicMaterial({color,transparent:true,opacity,depthWrite:false,side:THREE.DoubleSide}));
  // Düz şerit (WebGL çizgi kalınlığı desteklemediği için mesh)
  const makeRibbon=(maxPts,width,color,opacity,y)=>{
    const pos=new Float32Array(maxPts*2*3);
    const idx=[];
    for(let i=0;i<maxPts-1;i++){ const a=i*2; idx.push(a,a+1,a+2,a+1,a+3,a+2); }
    const geo=G(new THREE.BufferGeometry());
    const attr=new THREE.BufferAttribute(pos,3);
    if(attr.setUsage&&THREE.DynamicDrawUsage) attr.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute("position",attr); geo.setIndex(idx); geo.setDrawRange(0,0);
    const mat=basic(color,opacity);
    const mesh=new THREE.Mesh(geo,mat); mesh.renderOrder=3; mesh.frustumCulled=false;
    group.add(mesh);
    const set=(pts)=>{
      const n=Math.min(pts?pts.length:0,maxPts), hw=width/2;
      for(let i=0;i<n;i++){
        const a=pts[Math.max(0,i-1)], b=pts[Math.min(n-1,i+1)];
        let tx=b.x-a.x, tz=b.z-a.z; const tl=Math.hypot(tx,tz)||1; tx/=tl; tz/=tl;
        const p=pts[i], j=i*6;
        pos[j]=p.x-tz*hw; pos[j+1]=y; pos[j+2]=p.z+tx*hw;
        pos[j+3]=p.x+tz*hw; pos[j+4]=y; pos[j+5]=p.z-tx*hw;
      }
      attr.needsUpdate=true;
      geo.setDrawRange(0,n>1?(n-1)*6:0);
    };
    return {mesh,mat,set};
  };
  const MAX_PTS=64;
  const routeRib=makeRibbon(MAX_PTS,0.6,0x2ecc71,0.85,0.08);
  const pathRib=makeRibbon(2,1.3,0xe74c3c,0.32,0.06);
  const ringGeo=G(flat(new THREE.RingGeometry(0.75,1.1,28)));
  const targetMat=basic(0x2ecc71,0.9), dangerMat=basic(0xe74c3c,0.75), pathEndMat=basic(0xe74c3c,0.5);
  const targetRing=new THREE.Mesh(ringGeo,targetMat); targetRing.position.y=0.09; targetRing.visible=false; targetRing.renderOrder=4; group.add(targetRing);
  const dangerRing=new THREE.Mesh(ringGeo,dangerMat); dangerRing.position.y=0.09; dangerRing.scale.set(1.5,1,1.5); dangerRing.visible=false; dangerRing.renderOrder=4; group.add(dangerRing);
  const pathEnd=new THREE.Mesh(ringGeo,pathEndMat); pathEnd.position.y=0.07; pathEnd.visible=false; group.add(pathEnd);
  const markGeo=G(new THREE.SphereGeometry(0.32,10,8));
  const goalMark=new THREE.Mesh(markGeo,targetMat); goalMark.visible=false; goalMark.renderOrder=4; group.add(goalMark);

  // ── Rota durumu ──
  let info={kind:"pass"}, kind="pass", lofted=false;
  const route=[];     // dünya {x,z}; route[0] = top (tackle: savunmacı)
  let lastEval=null, inputOn=false, drawing=false, pid=null, disposed=false;

  const polyLen=(pts)=>{ let s=0; for(let i=1;i<pts.length;i++) s+=Math.hypot(pts[i].x-pts[i-1].x,pts[i].z-pts[i-1].z); return s; };
  // pts'yi uzunluğunun u oranında kes → yeni dizi (son nokta enterpolasyon)
  const truncate=(pts,u)=>{
    const total=polyLen(pts), target=total*clamp(u,0,1), out=[pts[0]];
    let acc=0;
    for(let i=1;i<pts.length;i++){
      const a=pts[i-1], b=pts[i], l=Math.hypot(b.x-a.x,b.z-a.z);
      if(acc+l>=target){ const t=l>0?(target-acc)/l:0; out.push({x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t}); return out; }
      acc+=l; out.push(b);
    }
    return out;
  };

  const evalPass=(pts)=>{
    const end=pts[pts.length-1], len=polyLen(pts);
    let best=-1, bd=1e9;
    for(let i=0;i<mateW.length;i++){ const d=Math.hypot(mateW[i].x-end.x,mateW[i].z-end.z); if(d<bd){ bd=d; best=i; } }
    const r=moment3dRouteRisk(pts,riskers,lofted);
    const recv=clamp(1-(bd-2)/7,0,1);
    const valid=len>=3;
    const q=valid?clamp((1-r.risk)*0.65+recv*0.35,0,1):0;
    return {valid,kind:"pass",quality:q,risk:r.risk,worstIdx:r.idx,worstU:r.u,recvIdx:best,recvDist:bd,end:{x:end.x,z:end.z},len};
  };
  const evalShot=(pts)=>{
    const n=pts.length, len=polyLen(pts);
    // Kale çizgisini (x=+L) kestiği nokta; varmadıysa son doğrultuda uzat
    let cross=null, cutAt=n;
    for(let i=1;i<n;i++){
      const a=pts[i-1], b=pts[i];
      if(a.x<L&&b.x>=L){ const t=(L-a.x)/(b.x-a.x); cross={x:L,z:a.z+(b.z-a.z)*t}; cutAt=i; break; }
    }
    if(!cross){
      const a=pts[Math.max(0,n-4)], b=pts[n-1], dx=b.x-a.x;
      if(dx>0.05){ const t=(L-b.x)/dx; cross={x:L,z:b.z+(b.z-a.z)*t}; }
    }
    const tz=cross?clamp(cross.z,-(GW+10),GW+10):clamp(pts[n-1].z,-(GW+10),GW+10);
    const inGoal=!!cross&&Math.abs(tz)<GW-0.15;
    const kz=gkW?gkW.z:0;
    const place=clamp(Math.abs(tz-kz)/(GW*0.85),0,1);
    const shotPts=pts.slice(0,cutAt); if(cross) shotPts.push(cross);
    const r=moment3dRouteRisk(shotPts,fieldRiskers,lofted);
    // Havadan şutta ve topu sürerek (dribling/yanıltma) yapılan şutta blok daha az
    const block=r.risk*(lofted?0.4:1)*(info.carry?0.5:1);
    const q=inGoal?clamp((0.35+0.65*place)*(1-block*0.7),0,1):0.05;
    return {valid:len>=2,kind:"shot",quality:q,risk:block,inGoal,targetZ:tz,worstIdx:r.idx,worstU:r.u,len};
  };
  const evalTackle=(I)=>{
    const px=runW.x-attW.x, pz=runW.z-attW.z, len=Math.hypot(px,pz)||1;
    const u=clamp(((I.x-attW.x)*px+(I.z-attW.z)*pz)/(len*len),0,1);
    const cx=attW.x+px*u, cz=attW.z+pz*u, lat=Math.hypot(I.x-cx,I.z-cz);
    const tAtt=u*len/MOMENT3D_ATT_SPEED, tDef=Math.hypot(cx-defW.x,cz-defW.z)/MOMENT3D_DEF_SPEED;
    const diff=tDef-tAtt;
    // Erken varmak iyidir (yavaş düşer); geç kalmak hızla cezalandırılır
    const timing=diff<=0?clamp(1+diff/2.5,0.4,1):clamp(1-diff/1.6,0,1);
    const latS=clamp(1-lat/5,0,1);
    const goalPen=u>0.8?(u-0.8)*2:0; // ceza sahasına çok yakın: tehlikeli
    const q=clamp(timing*latS-goalPen*0.4,0,1);
    return {valid:true,kind:"tackle",quality:q,risk:1-timing,timing,u,point:{x:cx,z:cz},lat,len};
  };
  const evaluate=()=>{
    if(route.length<2) return {valid:false,kind};
    if(kind==="tackle") return evalTackle(route[route.length-1]);
    if(kind==="shot") return evalShot(route);
    return evalPass(route);
  };

  const refresh=(final)=>{
    if(disposed) return;
    routeRib.set(route);
    const ev=evaluate(); lastEval=ev;
    const col=moment3dRouteColor(ev);
    routeRib.mat.color.setHex(col); targetMat.color.setHex(col);
    const end=route.length>1?route[route.length-1]:null;
    targetRing.visible=!!end;
    if(end){ const tp=kind==="tackle"&&ev.valid?ev.point:end; targetRing.position.set(tp.x,0.09,tp.z); }
    // En tehlikeli rakibin altında kırmızı halka
    let dr=null;
    if(ev.valid&&kind!=="tackle"&&ev.worstIdx>=0&&ev.risk>0.2){
      dr=(kind==="shot"?fieldRiskers:riskers)[ev.worstIdx]||null;
    }
    dangerRing.visible=!!dr;
    if(dr){ const p=actors.getPlayerPos("away",dr.idx); dangerRing.position.set(p?p.x:dr.x,0.09,p?p.z:dr.z); }
    // Şutta hedef noktası kale ağzında küre ile gösterilir
    goalMark.visible=kind==="shot"&&ev.valid;
    if(goalMark.visible) goalMark.position.set(L+0.2,1.2,ev.targetZ);
    try{ cfg.onRoute&&cfg.onRoute(ev,!!final); }catch(e){ console.error("[3D kilit an] onRoute",e); }
  };

  // ── Pointer girdisi (fare + dokunma) ──
  const cv=api.renderer.domElement;
  const pick=(e)=>{
    const p=api.screenToPitch(e.clientX,e.clientY);
    if(!p||!Number.isFinite(p.x)||!Number.isFinite(p.y)) return null;
    const w=pitchToWorld3D(p.x,p.y);
    return {x:clamp(w.x,-L-4,L+4),z:clamp(w.z,-H-3,H+3)};
  };
  const addPt=(p)=>{
    if(kind==="tackle"){ route.length=0; route.push({x:defW.x,z:defW.z},p); return; }
    const last=route[route.length-1];
    if(Math.hypot(p.x-last.x,p.z-last.z)<1.0) return;
    if(route.length>=MAX_PTS){ route[route.length-1]=p; return; } // uç noktayı güncelle
    route.push(p);
  };
  const onDown=(e)=>{
    if(!inputOn||disposed) return;
    if(e.button!=null&&e.button>0) return;
    e.preventDefault();
    const p=pick(e); if(!p) return;
    pid=e.pointerId; drawing=true;
    try{ cv.setPointerCapture(pid); }catch(_){}
    route.length=0;
    route.push(kind==="tackle"?{x:defW.x,z:defW.z}:{x:ballW.x,z:ballW.z});
    addPt(p); refresh(false);
  };
  const onMove=(e)=>{
    if(!drawing||e.pointerId!==pid) return;
    e.preventDefault();
    const p=pick(e); if(p){ addPt(p); refresh(false); }
  };
  const endDraw=()=>{
    if(!drawing) return;
    drawing=false;
    try{ if(pid!=null) cv.releasePointerCapture(pid); }catch(_){}
    pid=null; refresh(true);
  };
  const onUp=(e)=>{ if(drawing&&e.pointerId===pid) endDraw(); };
  cv.addEventListener("pointerdown",onDown,{passive:false});
  cv.addEventListener("pointermove",onMove,{passive:false});
  cv.addEventListener("pointerup",onUp);
  cv.addEventListener("pointercancel",onUp);
  const removePointer=()=>{
    cv.removeEventListener("pointerdown",onDown,{passive:false});
    cv.removeEventListener("pointermove",onMove,{passive:false});
    cv.removeEventListener("pointerup",onUp);
    cv.removeEventListener("pointercancel",onUp);
  };

  const begin=(inf)=>{
    if(disposed) return;
    info=inf||{kind:"pass"}; kind=info.kind||"pass"; lofted=!!info.lofted;
    route.length=0; lastEval=null;
    if(kind==="tackle"&&attW){
      pathRib.set([attW,runW]); pathRib.mesh.visible=true;
      pathEnd.visible=true; pathEnd.position.set(runW.x,0.07,runW.z);
    } else { pathRib.mesh.visible=false; pathEnd.visible=false; }
    refresh(false);
    inputOn=true;
  };
  const setInput=(on)=>{ inputOn=!!on; if(!on) endDraw(); };
  const clear=()=>{ if(drawing) return; route.length=0; refresh(false); };

  // Süre dolunca makul rota: pas → en iyi alıcı, şut → kalecinin ters köşesi,
  // müdahale → koşu yolunda en iyi nokta
  const autoRoute=()=>{
    if(disposed) return lastEval;
    endDraw();
    route.length=0;
    if(kind==="tackle"){
      let bestU=0.5, bestQ=-1;
      for(let u=0.2;u<=0.8;u+=0.05){
        const I={x:attW.x+(runW.x-attW.x)*u,z:attW.z+(runW.z-attW.z)*u};
        const q=evalTackle(I).quality; if(q>bestQ){ bestQ=q; bestU=u; }
      }
      route.push({x:defW.x,z:defW.z},{x:attW.x+(runW.x-attW.x)*bestU,z:attW.z+(runW.z-attW.z)*bestU});
    } else if(kind==="shot"){
      const kz=gkW?gkW.z:0, tz=(kz>=0?-1:1)*GW*0.55;
      route.push({x:ballW.x,z:ballW.z},{x:L+0.5,z:tz});
    } else {
      let best=null, bq=-1;
      for(let i=0;i<mateW.length;i++){
        const pts=[{x:ballW.x,z:ballW.z},{x:mateW[i].x,z:mateW[i].z}];
        const q=evalPass(pts).quality; if(q>bq){ bq=q; best=pts; }
      }
      if(best) route.push(best[0],best[1]);
      else route.push({x:ballW.x,z:ballW.z},{x:ballW.x+8,z:ballW.z});
    }
    refresh(true);
    return lastEval;
  };

  // ── Sonuç animasyonu: zaman çizelgesi + koşucu (kare kancasında) ──
  const tl=[]; let animOn=false, animT=0, ended=false, runner=null;
  const later=(sec,fn)=>{ const t=animT+sec; let i=tl.length; while(i>0&&tl[i-1].t>t) i--; tl.splice(i,0,{t,fn}); };
  const finish=()=>{ if(ended) return; ended=true; try{ cfg.onAnimEnd&&cfg.onAnimEnd(); }catch(e){ console.error(e); } };
  const finishSoon=(s)=>later(s==null?1:s,finish);
  const startRunner=(team,idx,pts,speed,carry,onU,onEnd)=>{
    const cum=[0]; let len=0;
    for(let i=1;i<pts.length;i++){ len+=Math.hypot(pts[i].x-pts[i-1].x,pts[i].z-pts[i-1].z); cum.push(len); }
    runner={team,idx,pts,cum,len,speed,d:0,carry,onU:onU||[],onEnd};
  };
  const stepRunner=(dt)=>{
    const r=runner;
    r.d=Math.min(r.len,r.d+r.speed*dt);
    const u=r.len>0?r.d/r.len:1;
    let i=1; while(i<r.pts.length-1&&r.cum[i]<r.d) i++;
    const a=r.pts[i-1], b=r.pts[i]||a, sl=r.cum[i]-r.cum[i-1];
    const t=sl>0?(r.d-r.cum[i-1])/sl:1;
    const x=a.x+(b.x-a.x)*t, z=a.z+(b.z-a.z)*t;
    actors.movePlayer(r.team,r.idx,x,z);
    if(r.carry&&sl>0) actors.setBall(x+(b.x-a.x)/sl*0.4,z+(b.z-a.z)/sl*0.4,0);
    for(let k=0;k<r.onU.length;k++){
      const o=r.onU[k];
      if(!o.done&&u>=o.u){ o.done=true; o.fn(); if(runner!==r) return; }
    }
    if(u>=1){ runner=null; if(r.onEnd) r.onEnd(); }
  };
  // Rota boyunca top bacakları (≤10 bacak); y: yay (H) + uç yüksekliği (endY)
  const legsAlong=(pts,speed,Hh,endY,endFn)=>{
    const n=pts.length;
    if(n<2) return [{x:pts[0].x,z:pts[0].z,y:endY,h:0,dur:0.1,fn:endFn}];
    const step=Math.max(1,Math.ceil((n-1)/10)), sel=[];
    for(let i=step;i<n-1;i+=step) sel.push(pts[i]);
    sel.push(pts[n-1]);
    let total=0, prev=pts[0]; const seg=[];
    for(let i=0;i<sel.length;i++){ const l=Math.hypot(sel[i].x-prev.x,sel[i].z-prev.z); seg.push(l); total+=l; prev=sel[i]; }
    const dur=clamp(total/speed,0.35,2.2);
    let acc=0;
    return sel.map((p,i)=>{
      acc+=seg[i]; const u=total>0?acc/total:1;
      return {x:p.x,z:p.z,y:4*Hh*u*(1-u)+endY*u,h:0,dur:Math.max(0.05,dur*(total>0?seg[i]/total:1/sel.length)),fn:i===sel.length-1?endFn:null};
    });
  };
  const gkTo=(z)=>{ if(gkIdx>=0) actors.movePlayer("away",gkIdx,L-0.9,clamp(z,-GW,GW)); };
  const sgnOf=(v)=>v>=0?1:-1;

  // p noktasından rakip kaleye bitiriş (aim: hedeflenen z)
  const shootFrom=(p,o,fk,high,aim)=>{
    const s=sgnOf(aim), d=Math.hypot(L-p.x,aim-p.z), dur=clamp(d/26,0.3,0.9);
    if(o.success){
      const gz=Math.abs(aim)<GW-0.4?aim:s*(GW-0.6);
      gkTo(-s*Math.min(1.8,GW*0.5));             // kaleci ters köşeye
      actors.playBallScript([
        {x:L+1.0,z:gz,y:high?1.7:1.0,h:high?0.25:0.4,dur,fn:()=>actors.goalFx(1,gz,"home")},
        {x:L+1.6,z:gz,y:0,h:0.1,dur:0.25,fn:()=>finishSoon(1.3)},
      ],0);
      return;
    }
    if(fk==="wide"){
      const wz=Math.abs(aim)>GW+0.8?aim:s*(GW+1.2+Math.random()*2);
      gkTo(wz*0.3);
      actors.playBallScript([
        {x:L+2.5,z:wz,y:high?3.3:0.7,h:1.2,dur},
        {x:L+5,z:wz*1.1,y:0,h:0.5,dur:0.35,fn:()=>finishSoon(0.9)},
      ],0);
    } else if(fk==="post"){
      const pz=s*(GW-0.1);
      gkTo(pz*0.5);
      actors.playBallScript([
        {x:L-0.15,z:pz,y:1.1,h:0.3,dur,fn:()=>{ actors.shakeGoal(1); actors.ringFx(L-0.3,pz,0xffffff,0.6,3); }},
        {x:L-13,z:clamp(pz*3+(Math.random()*6-3),-H+2,H-2),y:0,h:2.5,dur:0.75,fn:()=>finishSoon(0.8)},
      ],0);
    } else { // save (ve kesilme mesajı olmayan şut başarısızlıkları)
      const sz=clamp(aim,-(GW-0.4),GW-0.4);
      gkTo(sz);
      actors.playBallScript([
        {x:L-0.9,z:sz,y:high?2.0:1.1,h:0.4,dur:dur+0.05,fn:()=>actors.ringFx(L-0.9,sz,0xffffff,0.6,3)},
        {x:L+1.5,z:sgnOf(sz)*(GW+3),y:0.3,h:1.6,dur:0.5,fn:()=>finishSoon(0.9)},
      ],0);
    }
  };

  const playPass=(o,ev,fk)=>{
    const pts=route.slice(), end=pts[pts.length-1];
    const recvMy=ev.recvIdx>=0?ev.recvIdx+1:1;
    const header=!!info.header;
    const Hh=lofted?Math.min(8,ev.len*0.2):0, speed=lofted?18:22;
    actors.movePlayer("home",recvMy,end.x,end.z); // alıcı rotanın ucuna koşar
    if(!o.success&&fk==="cut"){
      // Kesilme: en tehlikeli rakip (yoksa uca en yakın) rotaya girer
      let rk=ev.worstIdx>=0?riskers[ev.worstIdx]:null, u=ev.worstIdx>=0?ev.worstU:0.85;
      if(!rk){ let bd=1e9; riskers.forEach(r=>{ const d=Math.hypot(r.x-end.x,r.z-end.z); if(d<bd){ bd=d; rk=r; } }); }
      u=clamp(u,0.3,0.95);
      const cut=truncate(pts,u), c=cut[cut.length-1];
      if(rk) actors.movePlayer("away",rk.idx,c.x,c.z);
      actors.playBallScript(legsAlong(cut,speed,Hh*u,0,()=>{
        actors.ringFx(c.x,c.z,0xe74c3c,0.7,4);
        actors.playBallScript([{x:c.x-16,z:clamp(c.z+sgnOf(c.z)*10,-H+2,H-2),y:0,h:5,dur:0.9,fn:()=>finishSoon(0.8)}],0);
      }),0);
      return;
    }
    const aim=sgnOf(Math.random()-0.5)*GW*(0.3+Math.random()*0.45);
    actors.playBallScript(legsAlong(pts,speed,Hh,header?2.0:0,()=>shootFrom(end,o,fk==="cut"?"save":fk,header,aim)),0);
  };

  const playShot=(o,ev,fk)=>{
    const pts=route.slice();
    const path=[pts[0]];
    for(let i=1;i<pts.length;i++){ if(pts[i].x>=L-0.6) break; path.push(pts[i]); }
    const tz=ev.targetZ, s=sgnOf(tz);
    let aim;
    const f=fk==="cut"?"save":fk;
    if(o.success) aim=ev.inGoal?tz:s*GW*0.55;
    else if(f==="wide") aim=ev.inGoal?s*(GW+1.5):tz;
    else aim=ev.inGoal?tz:s*GW*0.6;
    const Hh=lofted?Math.min(5,ev.len*0.16):0, speed=lofted?16:28;
    actors.movePlayer("home",0,ballW.x-0.5,ballW.z); // vurucu topa yürür
    const fire=(pp)=>{
      const last=pp[pp.length-1];
      if(pp.length<2){ shootFrom(last,o,f,lofted,aim); return; }
      actors.playBallScript(legsAlong(pp,speed,Hh,lofted?1.5:0.4,()=>shootFrom(last,o,f,lofted,aim)),0);
    };
    if(info.carry&&path.length>=2&&polyLen(path)>4){
      // Dribling / yanıltma: topu rotanın ilk %45'inde sür, sonra vur
      const a=truncate(path,0.45), from=a[a.length-1];
      const rest=[from]; let acc=0; const tot=polyLen(path);
      for(let i=1;i<path.length;i++){ acc+=Math.hypot(path[i].x-path[i-1].x,path[i].z-path[i-1].z); if(acc>tot*0.45) rest.push(path[i]); }
      startRunner("home",0,a,8,true,null,()=>fire(rest));
    } else fire(path);
  };

  const playTackle=(o,ev)=>{
    const I=ev.point, len=ev.len;
    const dDef=Math.hypot(I.x-defW.x,I.z-defW.z);
    const tp=worldToPitch3D(I.x,I.z);
    const shootAtUs=(from)=>{
      const gz=sgnOf(Math.random()-0.5)*GW*(0.3+Math.random()*0.4);
      const d=Math.hypot(-L-from.x,gz-from.z), dur=clamp(d/26,0.3,0.8);
      if(o.goalConceded){
        if(myGkIdx>=0) actors.movePlayer("home",myGkIdx,-(L-0.9),-gz*0.5);
        actors.playBallScript([
          {x:-(L+1.0),z:gz,y:1.0,h:0.4,dur,fn:()=>actors.goalFx(-1,gz,"away")},
          {x:-(L+1.6),z:gz,y:0,h:0.1,dur:0.25,fn:()=>finishSoon(1.3)},
        ],0);
      } else {
        if(myGkIdx>=0) actors.movePlayer("home",myGkIdx,-(L-0.9),gz);
        actors.playBallScript([
          {x:-(L-0.9),z:gz,y:1.0,h:0.4,dur:dur+0.05,fn:()=>actors.ringFx(-(L-0.9),gz,0xffffff,0.6,3)},
          {x:-(L+1.5),z:sgnOf(gz)*(GW+3),y:0.3,h:1.6,dur:0.5,fn:()=>finishSoon(0.9)},
        ],0);
      }
    };
    if(o.success){
      // Savunmacı yetişebilsin diye müdahale anı en erken (mesafe / 12 m/sn)
      const uMin=clamp((dDef/12)*MOMENT3D_ATT_SPEED/Math.max(1,len),0,0.95);
      const u=clamp(Math.max(ev.u,uMin),0.12,0.95);
      const at={x:attW.x+(runW.x-attW.x)*u,z:attW.z+(runW.z-attW.z)*u};
      actors.movePlayer("home",0,at.x,at.z);
      startRunner("away",0,[attW,runW],MOMENT3D_ATT_SPEED,true,[{u,fn:()=>{
        runner=null;
        const b=actors.getBall(), bx=b?b.x:at.x, bz=b?b.z:at.z;
        actors.ringFx(bx,bz,0x1abc9c,0.8,5);
        actors.movePlayer("away",0,bx-0.8,bz+1.2);            // rakip dengesini kaybeder
        actors.playBallScript([{x:bx+14,z:clamp(bz+sgnOf(bz)*12,-H+2,H-2),y:0,h:4,dur:0.9,fn:()=>finishSoon(0.8)}],0);
      }}],null);
      return;
    }
    // Başarısız: savunmacı hedefi ıskalar (yanına düşer)
    const side=sgnOf(I.z-defW.z);
    actors.movePlayer("home",0,I.x+1.5,I.z+side*2.6);
    if(info&&cfg.type==="tackle"&&o.optId==="foul"){
      // Faul: müdahale noktasında kart, ardından serbest vuruştan şut
      startRunner("away",0,[attW,runW],MOMENT3D_ATT_SPEED,true,[{u:clamp(ev.u,0.15,0.9),fn:()=>{
        runner=null;
        actors.triggerEvent({type:"yellow",x:tp.x,y:tp.y,team:"me"});
        const b=actors.getBall(), from={x:b?b.x:I.x,z:b?b.z:I.z};
        later(1.0,()=>shootAtUs(from));
      }}],null);
      return;
    }
    startRunner("away",0,[attW,runW],MOMENT3D_ATT_SPEED,true,null,()=>shootAtUs(runW));
  };

  const play=(o)=>{
    if(disposed||animOn||!o) return;
    setInput(false);
    animOn=true; animT=0; ended=false;
    dangerRing.visible=false;
    const ev=(lastEval&&lastEval.valid)?lastEval:autoRoute();
    const fk=moment3dFailKind(o.msg);
    try{
      if(kind==="tackle"&&attW) playTackle(o,ev);
      else if(kind==="shot") playShot(o,ev,fk);
      else playPass(o,ev,fk);
    }catch(e){ console.error("[3D kilit an] animasyon hatası",e); finishSoon(0.3); }
    later(9,finish); // güvenlik: senaryo takılırsa
  };

  // ── Kare kancası ──
  const hook=(dt,t)=>{
    if(disposed) return;
    if(introPending&&dt>0){
      introPending=false;
      api.setCustomCamera(cp[0],cp[1],cp[2],cl[0],cl[1],cl[2],false);
    }
    if(targetRing.visible&&!animOn){ const k=1+0.12*Math.sin(t*6); targetRing.scale.set(k,1,k); }
    if(!animOn) return;
    animT+=dt;
    while(tl.length&&tl[0].t<=animT){
      const e=tl.shift();
      try{ e.fn(); }catch(err){ console.error("[3D kilit an]",err); }
    }
    if(runner) stepRunner(dt);
  };
  const removeHook=api.addFrameHook(hook);

  let removeDisposeHook=null;
  const dispose=()=>{
    if(disposed) return;
    disposed=true;
    inputOn=false; drawing=false;
    removeHook();
    if(removeDisposeHook) removeDisposeHook();
    removePointer();
    try{ actors.dispose(); }catch(e){}
    if(group.parent) group.parent.remove(group);
    group.clear();
    owned.geos.forEach(g=>{ try{ g.dispose(); }catch(e){} });
    owned.mats.forEach(m=>{ try{ m.dispose(); }catch(e){} });
    owned.geos.length=0; owned.mats.length=0;
    tl.length=0; runner=null; route.length=0;
  };
  if(api.addDisposeHook) removeDisposeHook=api.addDisposeHook(dispose);

  return {begin,setInput,clear,getEval:()=>lastEval,autoRoute,play,dispose};
}

// 3D kilit an sahnesi + arayüz. onFallback(msg): 2D'ye geç (sonuç hesaplanmadan önce).
function Moment3DStage({moment,onResolve,onFallback}){
  const {config,player,min}=moment;
  const [ready,setReady]=useState(false);
  const [phase,setPhase]=useState("choose"); // choose | draw | power | anim | result
  const [opt,setOpt]=useState(null);
  const [routeOk,setRouteOk]=useState(false);
  const [timeLeft,setTimeLeft]=useState(MOMENT3D_DRAW_SEC);
  const [result,setResult]=useState(null);
  const [animOut,setAnimOut]=useState(false);
  const ctrlRef=useRef(null), phaseRef=useRef("choose"), optRef=useRef(null);
  const riskRef=useRef(null), barRef=useRef(null), barNumRef=useRef(null);
  const powerRef=useRef(0), powerDirRef=useRef(1), rafRef=useRef(0);
  const timersRef=useRef([]), outcomeRef=useRef(null), resolvedRef=useRef(false);
  const shownRef=useRef(false), autoRef=useRef(false), deadlineRef=useRef(0);
  const cbRef=useRef(null); cbRef.current={onResolve,onFallback};
  const shortName=(player.n||"").split(" ").pop();

  const go=(p)=>{ phaseRef.current=p; setPhase(p); };
  const later=(ms,fn)=>{ const id=setTimeout(fn,ms); timersRef.current.push(id); return id; };

  useEffect(()=>()=>{
    timersRef.current.forEach(clearTimeout); timersRef.current=[];
    cancelAnimationFrame(rafRef.current);
    if(ctrlRef.current){ ctrlRef.current.dispose(); ctrlRef.current=null; }
  },[]);

  const doResolve=()=>{
    if(resolvedRef.current||!outcomeRef.current) return;
    resolvedRef.current=true;
    const o=outcomeRef.current;
    cbRef.current.onResolve({success:o.success,goalScored:o.goalScored,goalConceded:o.goalConceded,
      optionId:o.optId,player:player.n,momentType:moment.type,msg:o.msg});
  };
  const showResult=()=>{
    if(shownRef.current||!outcomeRef.current) return;
    shownRef.current=true;
    setResult(outcomeRef.current);
    go("result");
    later(2800,()=>{ setAnimOut(true); later(400,doResolve); });
  };
  const handleRoute=(ev)=>{
    const el=riskRef.current;
    if(el){
      const txt=moment3dRouteLabel(ev);
      el.textContent=txt;
      el.style.opacity=txt?"1":"0";
      el.style.color="#"+moment3dRouteColor(ev).toString(16).padStart(6,"0");
    }
    setRouteOk(!!(ev&&ev.valid));
  };
  // Denetleyici geri çağrıları her zaman güncel fonksiyonları kullansın
  const handlersRef=useRef(null);
  handlersRef.current={handleRoute,showResult};

  const fallback=(msg)=>{
    if(outcomeRef.current) return; // sonuç hesaplandıysa 2D'ye dönülmez
    cancelAnimationFrame(rafRef.current);
    try{ cbRef.current.onFallback&&cbRef.current.onFallback(msg||""); }catch(e){}
  };

  const onReady=(api)=>{
    try{
      ctrlRef.current=createMoment3DController(api,{
        type:moment.type, label:shortName,
        onRoute:(ev,final)=>handlersRef.current.handleRoute(ev,final),
        onAnimEnd:()=>handlersRef.current.showResult(),
      });
      setReady(true);
    }catch(e){
      console.error("[3D kilit an] kurulum hatası",e);
      fallback("3D kilit an kurulamadı; 2D görünüme geçildi.");
    }
  };
  const onErr=()=>{
    ctrlRef.current=null; // sahne silinirken denetleyici kendini temizledi
    if(outcomeRef.current) showResult();
    else fallback("3D görünüm açılamadı; kilit an 2D olarak devam ediyor.");
  };

  const choose=(o)=>{
    if(phaseRef.current!=="choose"||!ctrlRef.current) return;
    optRef.current=o; setOpt(o);
    const ki=(MOMENT3D_OPTION_KIND[moment.type]||{})[o.id]||{kind:"shot"};
    ctrlRef.current.begin(ki);
    deadlineRef.current=Date.now()+MOMENT3D_DRAW_SEC*1000;
    setTimeLeft(MOMENT3D_DRAW_SEC);
    go("draw");
  };

  const startPower=()=>{
    powerRef.current=0; powerDirRef.current=1;
    let last=0;
    const tick=(now)=>{
      const dt=last?Math.min(0.05,(now-last)/1000):0.016; last=now;
      // 2D ile aynı salınım hızı (~2.2 birim / 60 fps kare)
      powerRef.current+=powerDirRef.current*132*dt;
      if(powerRef.current>=100){ powerRef.current=100; powerDirRef.current=-1; }
      if(powerRef.current<=0){ powerRef.current=0; powerDirRef.current=1; }
      const v=Math.round(powerRef.current);
      if(barRef.current) barRef.current.style.width=v+"%";
      if(barNumRef.current){
        barNumRef.current.textContent=String(v);
        barNumRef.current.style.color=v<30?"#e74c3c":v<45?"#e67e22":v<=80?"#2ecc71":"#e74c3c";
      }
      rafRef.current=requestAnimationFrame(tick);
    };
    rafRef.current=requestAnimationFrame(tick);
  };

  const confirmRoute=()=>{
    if(phaseRef.current!=="draw") return;
    const c=ctrlRef.current; if(!c) return;
    c.setInput(false);
    let ev=c.getEval();
    if(!ev||!ev.valid){ c.autoRoute(); autoRef.current=true; }
    else autoRef.current=false;
    go("power");
    startPower();
  };

  // Çizim süresi sayacı (200 ms'de bir; süre dolunca mevcut ya da otomatik rota)
  useEffect(()=>{
    if(phase!=="draw") return;
    const iv=setInterval(()=>{
      const left=Math.max(0,Math.ceil((deadlineRef.current-Date.now())/1000));
      setTimeLeft(left);
      if(left<=0){ clearInterval(iv); confirmRoute(); }
    },200);
    return()=>clearInterval(iv);
  },[phase]);

  const freeze=()=>{
    if(phaseRef.current!=="power") return;
    cancelAnimationFrame(rafRef.current);
    const power=powerRef.current, o=optRef.current, c=ctrlRef.current;
    if(!o) return;
    const ev=c?c.getEval():null;
    // Otomatik rota (süre doldu / çizilmedi) ödül getirmez: kalite en fazla 0.6 → terim ≤ −0.04
    const q0=ev&&ev.valid?ev.quality:0.45;
    const q=autoRef.current?Math.min(q0,0.6):q0;
    const term=moment3dRouteTerm(q)-(autoRef.current?0.04:0);
    const chance=calcMomentChance(player,o,power,term);
    const success=Math.random()<chance;
    const msg=getMomentMsg(moment.type,o.id,success,player.n);
    const isTackle=moment.type==="tackle";
    const goalScored=!isTackle&&success;
    const goalConceded=isTackle&&!success&&Math.random()>0.4; // 2D ile aynı
    outcomeRef.current={success,msg,goalScored,goalConceded,optId:o.id,
      chance:Math.round(chance*100),power:Math.round(power),quality:Math.round(q*100)};
    go("anim");
    if(c){ try{ c.play(outcomeRef.current); }catch(e){ console.error(e); showResult(); } }
    else showResult();
    later(9500,showResult); // güvenlik: animasyon bitmese de sonuç gelsin
  };

  const kinfo=opt?(MOMENT3D_OPTION_KIND[moment.type]||{})[opt.id]:null;
  const ktext=kinfo?MOMENT3D_KIND_TEXT[kinfo.kind]:null;
  const locked=phase==="anim"||phase==="result";
  const hint=phase==="choose"?(ready?"Bir seçenek belirle":"⏳ 3D sahne hazırlanıyor…")
    :phase==="draw"?(ktext?ktext.hint:"")
    :phase==="power"?"Güç barını yeşil bölgede durdur":"";
  const btnBase={fontFamily:"inherit",cursor:"pointer",borderRadius:7,fontWeight:800};

  return(
    <div style={{position:"fixed",inset:0,zIndex:500,background:"rgba(0,0,0,.95)",
      display:"flex",flexDirection:"column",alignItems:"center",padding:"6px 6px 8px",
      animation:animOut?"m3dFadeOut .4s forwards":"m3dSlideIn .3s cubic-bezier(.16,1,.3,1)"}}>
      <div style={{width:"min(98vw,560px)",flex:1,minHeight:0,display:"flex",flexDirection:"column",
        borderRadius:10,overflow:"hidden",border:`2px solid ${config.color}`,
        boxShadow:`0 8px 40px ${config.color}44`,background:"#071208"}}>

        {/* ── Başlık ── */}
        <div style={{background:`linear-gradient(90deg,${config.color},${config.color}bb)`,
          padding:"6px 10px",display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
          <span style={{fontSize:"1.5rem",filter:"drop-shadow(0 2px 4px rgba(0,0,0,.5))"}}>{config.icon}</span>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:".9rem",fontWeight:900,letterSpacing:2,color:"#fff",
              textShadow:"0 2px 4px rgba(0,0,0,.4)",fontFamily:"'Barlow Condensed',sans-serif"}}>{config.label}</div>
            <div style={{fontSize:".46rem",color:"rgba(255,255,255,.85)",letterSpacing:1,
              whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
              {min}. DAKİKA · {player.n} · OVR {player.ovr}
            </div>
          </div>
          {phase==="draw"&&(
            <div style={{fontSize:".8rem",fontWeight:900,color:timeLeft<=3?"#ffdddd":"#fff",
              background:"rgba(0,0,0,.3)",borderRadius:6,padding:"3px 8px",
              fontFamily:"'Barlow Condensed',sans-serif"}}>⏱ {timeLeft}</div>
          )}
          {!locked&&(
            <button onClick={()=>fallback("")} title="Bu kilit anı 2D görünümde oyna"
              style={{...btnBase,fontSize:".5rem",padding:"4px 8px",color:"#fff",
                background:"rgba(0,0,0,.35)",border:"1px solid rgba(255,255,255,.35)"}}>
              2D'ye geç
            </button>
          )}
        </div>

        {/* ── 3D sahne ── */}
        <div style={{flex:1,minHeight:180,position:"relative"}}
          onPointerDown={phase==="power"?freeze:undefined}>
          <div style={{position:"absolute",inset:0}}>
            <Pitch3D camera="custom" height="100%" showControls={false} interactive={true}
              onReady={onReady} onError={onErr}/>
          </div>
          {hint&&(
            <div style={{position:"absolute",top:6,left:"50%",transform:"translateX(-50%)",zIndex:3,
              pointerEvents:"none",maxWidth:"92%",textAlign:"center",fontSize:".52rem",fontWeight:700,
              color:"#fff",background:"rgba(0,0,0,.62)",padding:"4px 9px",borderRadius:6,lineHeight:1.4}}>
              {hint}
            </div>
          )}
          <div ref={riskRef} style={{position:"absolute",bottom:6,left:6,right:6,zIndex:3,
            pointerEvents:"none",opacity:0,textAlign:"center",fontSize:".52rem",fontWeight:800,
            background:"rgba(0,0,0,.66)",padding:"4px 8px",borderRadius:6,transition:"opacity .15s"}}/>
        </div>

        {/* ── Alt panel ── */}
        <div style={{flexShrink:0,padding:"6px 8px 8px",borderTop:`2px solid ${config.color}44`,
          background:"linear-gradient(180deg,#0d1e10 0%,#071208 100%)"}}>
          {phase==="choose"&&(
            <div style={{display:"flex",gap:6}}>
              {config.options.map(o=>{
                const statVal=player[o.stat]||55;
                const ki=(MOMENT3D_OPTION_KIND[moment.type]||{})[o.id]||{kind:"shot"};
                return(
                  <button key={o.id} disabled={!ready} onClick={()=>choose(o)} style={{...btnBase,
                    flex:1,minWidth:0,display:"flex",flexDirection:"column",alignItems:"center",gap:2,
                    padding:"7px 4px",background:"rgba(255,255,255,.06)",color:"#fff",
                    border:"2px solid rgba(255,255,255,.14)",opacity:ready?1:0.45,
                    cursor:ready?"pointer":"default"}}>
                    <span style={{fontSize:"1.25rem"}}>{o.icon}</span>
                    <span style={{fontSize:".66rem",fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:.4}}>{o.label}</span>
                    <span style={{fontSize:".4rem",color:"rgba(255,255,255,.45)",fontWeight:600}}>{o.desc}</span>
                    <span style={{fontSize:".42rem",color:config.color,letterSpacing:.5,textTransform:"uppercase"}}>
                      {o.stat} {statVal} · {MOMENT3D_KIND_TEXT[ki.kind].tag}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
          {phase==="draw"&&(
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <div style={{flex:1,fontSize:".5rem",color:"rgba(255,255,255,.6)",lineHeight:1.4}}>
                {opt?.icon} <b style={{color:config.color}}>{opt?.label}</b> — {ktext?ktext.tag:""}.
                {" "}Yeniden çizmek için tekrar sürükle. Süre dolarsa otomatik rota seçilir.
              </div>
              <button onClick={()=>ctrlRef.current&&ctrlRef.current.clear()} style={{...btnBase,
                fontSize:".56rem",padding:"8px 10px",color:"#ddd",background:"rgba(255,255,255,.06)",
                border:"1px solid rgba(255,255,255,.2)"}}>🗑 Temizle</button>
              <button disabled={!routeOk} onClick={confirmRoute} style={{...btnBase,
                fontSize:".62rem",padding:"8px 12px",color:"#fff",
                background:routeOk?config.color:"rgba(255,255,255,.08)",
                border:`1px solid ${routeOk?config.color:"rgba(255,255,255,.15)"}`,
                opacity:routeOk?1:0.5,cursor:routeOk?"pointer":"default"}}>✔ Onayla</button>
            </div>
          )}
          {phase==="power"&&(
            <div>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{fontSize:".42rem",color:"rgba(255,255,255,.5)",letterSpacing:1,minWidth:28,fontWeight:700}}>GÜÇ</div>
                <div style={{flex:1,height:10,background:"rgba(255,255,255,.08)",borderRadius:5,overflow:"hidden",position:"relative"}}>
                  <div style={{position:"absolute",left:"40%",width:"40%",top:0,bottom:0,
                    background:"rgba(46,204,113,.15)",borderLeft:"1px solid rgba(46,204,113,.5)",
                    borderRight:"1px solid rgba(46,204,113,.5)"}}/>
                  <div ref={barRef} style={{height:"100%",width:"0%",
                    background:"linear-gradient(90deg,#e74c3c 0%,#e67e22 30%,#2ecc71 45%,#2ecc71 75%,#e74c3c 100%)",
                    borderRadius:5}}/>
                </div>
                <div ref={barNumRef} style={{fontSize:".62rem",fontWeight:800,minWidth:24,textAlign:"right",
                  fontFamily:"'Barlow Condensed',sans-serif",color:"#e74c3c"}}>0</div>
              </div>
              <button onClick={freeze} style={{...btnBase,width:"100%",marginTop:7,padding:"10px 0",
                fontSize:".8rem",letterSpacing:2,color:"#fff",background:config.color,
                border:`1px solid ${config.color}`,fontFamily:"'Barlow Condensed',sans-serif"}}>
                {moment.type==="tackle"?"🛡️ MÜDAHALE!":"⚡ VUR!"}
              </button>
            </div>
          )}
          {phase==="anim"&&(
            <div style={{textAlign:"center",fontSize:".6rem",color:"rgba(255,255,255,.6)",padding:"10px 0",letterSpacing:1}}>
              {opt?.icon} {opt?.label}…
            </div>
          )}
          {phase==="result"&&result&&(
            <div style={{padding:"6px 6px 4px",textAlign:"center"}}>
              <div style={{fontSize:result.goalScored?"2.6rem":"1.9rem",marginBottom:4,
                animation:"m3dBounce .5s cubic-bezier(.36,.07,.19,.97)",
                filter:result.goalScored?"drop-shadow(0 0 20px #2ecc71)":result.goalConceded?"drop-shadow(0 0 16px #e74c3c)":"none"}}>
                {result.goalScored?"⚽":result.goalConceded?"😨":result.success?"✅":"❌"}
              </div>
              {result.goalScored&&(
                <div style={{fontSize:"1rem",fontWeight:900,letterSpacing:4,color:"#2ecc71",marginBottom:4,
                  fontFamily:"'Barlow Condensed',sans-serif",textShadow:"0 0 20px rgba(46,204,113,.8)"}}>G O L !</div>
              )}
              <div style={{fontSize:".66rem",fontWeight:700,lineHeight:1.5,marginBottom:6,padding:"0 8px",
                color:result.goalScored?"#2ecc71":result.goalConceded?"#e74c3c":result.success?"#2ecc71":"#e67e22"}}>
                {result.msg}
              </div>
              <div style={{display:"flex",justifyContent:"center",gap:8,flexWrap:"wrap",fontSize:".42rem",color:"rgba(255,255,255,.35)"}}>
                <span>Güç: {result.power}</span><span>·</span>
                <span>Rota: %{result.quality}</span><span>·</span>
                <span>Şans: %{result.chance}</span><span>·</span>
                <span style={{color:result.success?"#2ecc71":"#e74c3c"}}>{result.success?"✓ Başarılı":"✗ Başarısız"}</span>
              </div>
            </div>
          )}
        </div>
      </div>
      <style>{`
        @keyframes m3dSlideIn{from{opacity:0;transform:translateY(40px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes m3dFadeOut{from{opacity:1;transform:scale(1)}to{opacity:0;transform:scale(.96)}}
        @keyframes m3dBounce{0%{transform:scale(0) rotate(-10deg)}60%{transform:scale(1.3) rotate(3deg)}100%{transform:scale(1) rotate(0)}}
      `}</style>
    </div>
  );
}

// Dış bileşen: 3D mümkünse Moment3DStage, değilse (veya geri dönüşte) 2D InteractiveMoment
function InteractiveMoment3D(props){
  // İlk karar tek seferde (WebGL testi geçici bir bağlam açar, iki kez çağırma)
  const [init]=useState(()=>{
    const known=!!(props.moment&&MOMENT3D_LAYOUTS[props.moment.type]);
    if(!known) return {mode:"2d",notice:""};
    return hasWebGLSupport()?{mode:"3d",notice:""}
      :{mode:"2d",notice:"Bu cihaz WebGL desteklemiyor; kilit an 2D olarak oynanıyor."};
  });
  const [mode,setMode]=useState(init.mode);
  const [notice,setNotice]=useState(init.notice);
  useEffect(()=>{
    if(!notice) return;
    const t=setTimeout(()=>setNotice(""),3500);
    return()=>clearTimeout(t);
  },[notice]);
  if(mode==="2d"){
    return(
      <>
        <InteractiveMoment moment={props.moment} myStr={props.myStr} oppStr={props.oppStr} onResolve={props.onResolve}/>
        {notice&&(
          <div style={{position:"fixed",top:10,left:"50%",transform:"translateX(-50%)",zIndex:501,
            maxWidth:"92vw",textAlign:"center",fontSize:".56rem",fontWeight:700,color:"#f5c26b",
            background:"rgba(11,18,32,.95)",border:"1px solid rgba(245,194,107,.4)",
            padding:"6px 12px",borderRadius:8,pointerEvents:"none"}}>
            ⚠️ {notice}
          </div>
        )}
      </>
    );
  }
  return(
    <Moment3DStage moment={props.moment} onResolve={props.onResolve}
      onFallback={(msg)=>{ setNotice(msg||""); setMode("2d"); }}/>
  );
}
