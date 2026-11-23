// ═══════════════════════════════════════════════════════════════
// 3D KİLİT AN — InteractiveMoment3D (serbest kontrol: top sür, pas, şut/orta)
// ═══════════════════════════════════════════════════════════════
// Kullanım (overlay.js): <InteractiveMoment3D moment myStr oppStr mates onResolve onFallback/>
//   onResolve sözleşmesi 2D InteractiveMoment ile BİREBİR aynıdır:
//   onResolve({success,goalScored,goalConceded,optionId,player,momentType,msg})
//   mates (isteğe bağlı): sahadaki kadro oyuncuları → takım arkadaşlarının adları.
// Akış: kısa kamera girişi (~0.6 sn) → topa sahip oyuncumuz (moment.player)
//   hemen kontrolde; etrafında yarı saydam kontrol halkası.
// HİBRİT KAMERA: oyun akışı (top sürme, pas, koşu çizimi, savunma) neredeyse tam
//   tepeden 2.5D kuşbakışıdır (tribün sahayı kapatmaz, dokunmatik çizim nettir;
//   dikey ekranda hücum yönü yukarı). Yalnız şut/orta/duran top vuruşu onaylanınca
//   kamera çim seviyesine inip topun arkasına geçer (vuruş ekranı, aşağıda 4).
//   1) TOP SÜRME (sapan): topa sahip oyuncuya basılı tutup parmağı/fareyi TERS yöne çek →
//      ok mesafeden bağımsız HEP YEŞİL: parmak ekrandayken oyuncu ok yönüne gerçek zamanlı
//      sürer, kalkınca durur. Açık oyunda çekiş asla şut değildir.
//      Duran topta (frikik/korner/penaltı) oyuncu kıpırdamaz: çekiş KIRMIZI vuruş okudur
//      (kaleye → şut, kanattan ceza sahasına → orta, başka yöne → havadan uzun pas).
//   SAĞ ALT DÜĞMELER: ŞUT → ok çekmeden doğrudan vuruş ekranı (kaleye) · PAS → pas modu
//      (arkadaşlar parlar; dokun = pas, arkadaştan sürükle = koşu yolu).
//   2) PAS / KOŞU YOLU: topsuz takım arkadaşına dokun → doğrudan pas. Takım
//      arkadaşından boş alana parmakla sürükle → noktalı beyaz koşu rotası; bırakınca
//      koşuya başlar. Rota üzerindeki boş alana dokun → önüne ara pası. Pas sayısı
//      SINIRSIZ (top kaptırılmadıkça); her pas süreyi azalan miktarda uzatır.
//   3) VURUŞ EKRANI: ŞUT düğmesi / duran topta kırmızı ok bırakılınca zaman
//      durur, kuşbakışı kamera ANINDA çim seviyesine, topun hemen arkasına iner: ekranın
//      alt ortasında sahnenin gerçek 3D topu (büyük), karşıda kale ve kaleci. Topa
//      dokunulan nokta dönüşü belirler (Magnus): ortası = düz; sağ kenarı = top SOLA
//      kıvrılır, sol kenarı = SAĞA kıvrılır; altı = yüksek/aşırtma (yavaş, barajın
//      üstünden); üstü = sert, düşen vuruş. ~4 sn dokunulmazsa düz vurulur.
//   4) SAVUNMA (tackle): kendi savunmacından topla gelen rakibe doğru ok çiz. Ok
//      beyaz/yeşilken bırak = ayakta temiz müdahale (yakın mesafe); uzun çekip
//      kırmızıya dönünce bırak = kayarak müdahale (uzanır, arkadan gelirse faul
//      riski). Savunmacı rakiple kale arasında kendiliğinden jokey yapar.
//   • Sanal çubuk / klavye hareketi YOK: hücumda top yalnız sapanın yeşil okuyla
//     sürülür, savunmada müdahale yalnız okla. Tuval touch-action:none (sayfa kaymaz).
//   • FİZİK: şut/kafa vuruşu yerçekimi + hava direnci + Magnus kuvvetiyle adım adım
//     simüle edilir (physShot). Baraj ve saha oyuncuları kapsül, direkler/üst direk
//     silindir: çarpan top seker (geri döner ya da kornere gider). Kaleci erişim alanına
//     giren top kurtarılır (yavaşsa tutar, sertse çeler); yalnız kalecinin yetişemediği
//     noktadan çizgiyi geçen top gol olur. Pas/şut dışında top ayağa kilitlidir.
// Kamera: her zaman saha + ~1.5 m kenar payı içinde (Pitch3D, pitch3dSafeCam);
//   tribün, çatı ve panolar kamera ile oyun arasına giremez (dikey ekranda da).
//   • Süre ~10 sn (ağır çekimde yavaşlar, vuruş ekranında durur); dolarsa en düşük
//     kaliteyle otomatik vuruş.
// Sonuç ADİL olasılıkla belirlenir (calcMomentChance, 2D ile aynı formül);
//   3D yalnızca konum kalitesi terimini (+0.05 / −0.12) ve dribling/pas kesilme
//   riskini ekler. Görsel yörünge sonuca uyar ve çizilen oka olabildiğince yakındır.
// Geri dönüş: WebGL yoksa, Three.js yüklenemezse veya Pitch3D hata verirse
//   aynı props ile 2D InteractiveMoment gösterilir; "2D'ye geç" düğmesi de var.
// Koordinat: 3D yardımcılarla aynı (x=0 bizim kale, x=100 rakip kale).
// Bellek: kilit an kapanınca kendi Pitch3D'si (ayrı WebGL bağlamı) unmount olur;
//   denetleyici pointer/klavye dinleyicilerini, kare kancasını, oyuncuları ve
//   kendi geometri/malzemelerini addDisposeHook ile serbest bırakır.
// ═══════════════════════════════════════════════════════════════

const MOMENT3D_TIME_SEC=10;        // kilit an süresi (oyun zamanı; ağır çekimde yavaşlar)
const MOMENT3D_INTRO_SEC=0.6;      // kamera girişi (gerçek zaman)
// Pas sınırı YOK (Adım 12). Başarılı pas süreye REFILL·DECAY^(pas−1) ekler (tavan
//   MOMENT3D_TIME_SEC) → sınırsız pasla da kilit an sonsuza uzamaz (toplam ek ≤ 16 sn).
const MOMENT3D_PASS_REFILL=4, MOMENT3D_PASS_REFILL_DECAY=0.75;
const MOMENT3D_SHOT_BTN_POWER=62;  // ŞUT düğmesi: tatlı bölgede güç (vuruş şekli ekranda seçilir)
const MOMENT3D_FADE_OP=0.25;       // vuruş ekranında top–kale arasındaki oyuncuların saydamlığı
const MOMENT3D_SLOWMO=0.2;         // geri çekerken zaman ölçeği
const MOMENT3D_PASS_SPEED=1.8;     // kilit an paslarının hız çarpanı (uçuş süresi /1.8 → %80 daha hızlı)
// Sapan (çekiş oranı f: 0–1, ekranın kısa kenarının %34'ü = 1):
//   • Açık oyun: HEP YEŞİL sürme oku; parmak ekrandayken gerçek zamanlı sürer (f, DRIB_F'de
//     doyar: tam hız). Şut yalnız sağ alttaki ŞUT düğmesiyle (doğrudan vuruş ekranı).
//   • Duran top: KIRMIZI vuruş oku, güç = f·100 → tatlı bölge (40–80) f≈0.4–0.8, >90 isabetsiz.
const MOMENT3D_DRIB_F=0.4;
const MOMENT3D_DRIB_MIN=3, MOMENT3D_DRIB_MAX=12;   // yeşil ok = top sürme mesafesi (m)
const MOMENT3D_STRIKE_SEC=4;       // vuruş ekranında dokunulmazsa düz vuruş (gerçek zaman, sn)
const MOMENT3D_SPIN_CURL=0.32;     // vuruş ekranı: topun kenarı → kavis (rad, + = sağa)
// Koşu yolu: en fazla nokta / toplam uzunluk (m); ara pası için rotaya en fazla uzaklık (m)
const MOMENT3D_RUN_PTS=32, MOMENT3D_RUN_LEN=34, MOMENT3D_RUN_PICK=4;
// Savunma oku: bu uzunluğa (m) kadar beyaz/yeşil = ayakta müdahale, üstü kırmızı = kayarak
const MOMENT3D_SLIDE_LEN=4.2, MOMENT3D_TACKLE_ARROW_MAX=9;
// ── DENGE SABİTLERİ (başsız bot simülasyonu, her tip × bot 300 an; tablo aşağıda) ──
// Dribling top kapma: savunmacı topa ≤1.5 m iken saniye başına olasılık oranı
//   λ = RATE · (oppStr / dribling) · (0.35+0.65·yönelim) · (önden 1 / arkadan 0.55)
//   · (kaleci 0.5) (dribling = spd·0.6 + ovr·0.4). Topu yeni alan GUARD_SEC boyunca
//   korunur; kapma anında LAST_SHOT olasılıkla "son an vuruşu" (konum kalitesi ≤0.6).
const MOMENT3D_TACKLE_RATE=0.5;
// Topu yeni alan oyuncunun (kilit an başı / pas sonrası) korunma süresi (sn, kontrol halkası parlar)
const MOMENT3D_GUARD_SEC=2.2;
// Baskı yapan savunmacının hamle etmeden önce jokey yaptığı süre (sn, ≤4 m'de)
const MOMENT3D_JOCKEY_SEC=0.9;
// Jokey duruşundaki savunmacının kapma oranı çarpanı (hamle edince 1)
const MOMENT3D_JOCKEY_TACKLE=0.1;
// Hamle eden (kale tarafından gelen, önden) savunmacının kapma oranı çarpanı
const MOMENT3D_COMMIT_TACKLE=0.7;
// Açı kapatan ikinci savunmacının kapma oranı çarpanı (pozisyon tutar, hamle etmez)
const MOMENT3D_COVER_TACKLE=0.4;
// Kapma anında oyuncunun yine de aceleci "son an vuruşu" yapabilme olasılığı
// (hareketsiz/acemi oyuncu sıfıra düşmesin; terim en çok 0, güç 20 = tatlı bölge dışı)
const MOMENT3D_LAST_SHOT=0.65;
// Pas kesilme olasılığı = rota riski (moment3dRouteRisk) · PASS_CUT + alıcı cezası
//   (takım arkadaşına ≤%3; boş alana: alıcı rakipten geç kalıyorsa ≤%50).
//   Ölçüm: iyi botun (açık arkadaşa) pası ≈ %5 kesildi, rastgele pas ≈ %35.
const MOMENT3D_PASS_CUT=0.45;
// Konum kalitesi terimi (q−0.6)·0.3, ASİMETRİK sınırlı: en fazla +0.05, en az −0.12.
//   q=0.6 (makul konum/vuruş) → 0 · q≥0.77 → +0.05 · süre dolunca sabit AUTO_TERM (−0.24).
// Bot ölçümü (oyuncu ovr/stat 65, rakip gücü 72). Beklenen başarı % = an başına
//   calcMomentChance ortalaması (top kaybı/kesilme = 0); "2D iyi" = en iyi seçenek +
//   yeşil güç, "2D rast." = rastgele seçenek + rastgele güç. 3D botlar: iyi (boşa
//   sürer, açık arkadaşa pas, en iyi açı/köşe + yeşil güç), makul (kaleye düz sürer,
//   basit yana kaçış, 20 m'de uzak köşe + yeşil güç), acemi (gürültülü yön, rastgele
//   an/güç/nişan), rastgele (rastgele hareket ve eylem), hareketsiz (hiçbir şey yapmaz).
//   Adım 6 ölçümü (200 an/hücre; akıllı baskı: jokey → hamle, açı kapatan ikinci savunmacı).
//   NOT (Adım 9): şut/orta sonucu artık fizikten (physShot) — bu tablo eski; güncel ölçüm PLAN-3D.md Adım 9.
//   tip       2D iyi 2D rast. | 3D iyi  makul  acemi  rastgele hareketsiz | iyi−2D iyi
//   corner     65.8   55.5    |  70.6   70.2   60.8   31.7     21.4      |  +4.8
//   freekick   66.6   56.3    |  72.0   65.5   54.4   25.3     22.8      |  +5.3
//   counter    67.6   56.2    |  66.9   53.8   49.3   24.8     19.6      |  −0.7
//   penalty    70.0   58.9    |  72.9   73.0   59.8   42.2     20.2      |  +2.8
//   oneonone   68.1   58.7    |  73.6   73.0   46.6   31.5     22.6      |  +5.4
//   tackle     71.6   59.2    |  72.3   65.4   55.4   31.3     23.3      |  +0.8
//   → iyi oyun 2D'nin en iyisinden en fazla ~+5 puan önde; makul oyun ≈ 2D (−6…+5),
//     YALNIZ kontrada kaleye düz süren makul bot −14 (Adım 5: −3.7): kale tarafındaki
//     baskı düz sürmeyi bilerek cezalandırır; yön değiştiren/pas veren iyi bot −0.7.
//     Acemi 2D rastgeleden en fazla ~12 puan geride; hareketsiz kalmak (süre dolması)
//     her tipte rastgele oynamanın altında kalır (ödüllenmez, ama sıfır da değildir).
const MOMENT3D_TERM_MAX=0.05, MOMENT3D_TERM_MIN=-0.12;
// Süre doldu: en kötü geçerli eylemden de kötü (rastgele oynamanın ortalamasının altında kalır)
const MOMENT3D_AUTO_TERM=-0.24;
function moment3dRouteTerm(q){
  const v=(Number.isFinite(q)?q:0.6)-0.6;
  return Math.max(MOMENT3D_TERM_MIN,Math.min(MOMENT3D_TERM_MAX,v*0.3));
}

// Olay tipine göre dizilim (0–100 saha yüzdesi) + kamera (dünya, metre).
//   carrier: moment.player (bizim takım, indeks 0) · mates: takım arkadaşları
//   opps: rakip saha oyuncuları · gk: rakip kaleci · myGk: bizim kaleci
//   attacker/runTo: (tackle) topu süren rakip ve şut noktası · wall: duvar sayısı
//   cam.h: kuşbakışı yüksekliği (m) · cam.look: ilk odak (dünya x,z; odak sonra oyuncuyu izler)
const MOMENT3D_LAYOUTS={
  corner:{
    ball:[99.2,1.2], carrier:[100.6,-0.6],
    mates:[[93,9],[93.5,40],[91,52],[88,62],[95,47]],
    opps:[[94.5,42],[92,50],[89,60],[96.5,52],[86,36],[93,12.5]],
    gk:[98.7,50],
    cam:{h:40,look:[45,-15]},                         // kuşbakışı: köşe + ceza sahası
  },
  freekick:{
    ball:[78,34], carrier:[76.2,32],
    mates:[[89,45],[87,58],[91,53],[84,66]],
    opps:[[90,47.5],[88,56],[92,55.5],[85,64]],
    wall:4, gk:[98.6,50],
    cam:{h:36,look:[40,-5]},                          // kuşbakışı: top + baraj + kale
  },
  counter:{
    ball:[58,50], carrier:[57,50],
    mates:[[70,22],[72,78],[62,34],[50,64]],
    opps:[[72.5,25],[74.5,74],[64.5,37],[80,48],[53,61]],
    gk:[98,50],
    cam:{h:36,look:[16,0]},                           // kuşbakışı: hücum eden + önündeki alan
  },
  penalty:{
    ball:[89.5,50], carrier:[87.3,50.5],
    mates:[[82,28],[82,72],[80,44]],
    opps:[[82.5,34],[82.5,66],[81,56]],
    gk:[99.6,50],
    cam:{h:26,look:[45,0]},                           // kuşbakışı: penaltı noktası + kale
  },
  oneonone:{
    ball:[84,46], carrier:[83,46],
    mates:[[74,24],[70,64]],
    opps:[[78,52],[75,38]],
    gk:[95,49],
    cam:{h:32,look:[41,-2]},                          // kuşbakışı: forvet + kaleci
  },
  tackle:{
    ball:[31,42], attacker:[30.2,42], runTo:[10,49],
    carrier:[21,57],                                  // bizim savunmacı (moment.player)
    mates:[[15,36],[16,66]], myGk:[1.8,50],
    opps:[[25,26],[36,64]],
    cam:{h:34,look:[-27,-2]},                         // kuşbakışı: savunmacı + rakip + kalemiz
  },
};

// Eylem → MOMENT_TYPES seçeneği (stat/bonus calcMomentChance'a gider; 2D ile aynı tablo)
//   shot: doğrudan şut · pass_shot: en az bir pastan sonra şut · cross: orta (kafa)
//   pass_cross: pastan sonra orta · power: (penaltı) güçlü vuruş · carry: (birebir) sürüp şut
const MOMENT3D_ACTION_OPT={
  corner:  {shot:"far",    pass_shot:"short", cross:"high",   pass_cross:"short",  timeout:"high"},
  freekick:{shot:"direct", pass_shot:"pass",  cross:"wall",   pass_cross:"pass",   timeout:"direct"},
  counter: {shot:"sprint", pass_shot:"sprint",cross:"sprint", pass_cross:"sprint", timeout:"wait"},
  penalty: {shot:"place",  power:"power",     timeout:"chip"},
  oneonone:{shot:"shoot",  carry:"fake",      pass_shot:"fake", cross:"fake", pass_cross:"fake", timeout:"lob"},
  tackle:  {tackle:"slide",stand:"block",     block:"block",  foul:"foul",    timeout:"slide"},
};
function moment3dOpt(type,key){
  const mt=MOMENT_TYPES[type];
  const id=(MOMENT3D_ACTION_OPT[type]||{})[key];
  const o=mt?(mt.options.find(x=>x.id===id)||mt.options[0]):null;
  return o||{id:key||"x",stat:"sht",bonus:0.3};
}

// Güce göre ok rengi: zayıf (gri) → yeşil (40–80) → sarı → turuncu → kırmızı (>90, isabetsiz)
function moment3dPowerColor(p){
  if(!Number.isFinite(p)) return 0xffffff;
  if(p<25) return 0x9aa5b1;
  if(p<40) return 0xb8e05a;
  if(p<=80) return 0x2ecc71;   // calcMomentChance tam bonusu: 40–80
  if(p<=85) return 0xf1c40f;
  if(p<=90) return 0xe67e22;
  return 0xe74c3c;
}

// Sonuç metinleri (3D'ye özgü; 2D getMomentMsg değişmez).
// act: shot | pass_shot | cross | pass_cross | power | carry | timeout | dribble_lost | intercepted
//      | tackle | block | foul · kind: goal | save | post | wide | block | ok | fail
function moment3dMsg(type,act,kind,name){
  const n=name||"Oyuncumuz";
  if(type==="tackle"){
    if(act==="tackle") return kind==="ok"?`${n} kayarak müdahaleyle topu aldı! Tehlike atlatıldı.`:`${n} müdahalede geç kaldı, rakip geçti!`;
    if(act==="stand") return kind==="ok"?`${n} ayakta temiz müdahaleyle topu çaldı!`:`${n} ayağını uzattı ama rakip topu sıyırıp geçti!`;
    if(act==="slide_foul") return `${n} arkadan kaydı: faul, sarı kart ve tehlikeli serbest vuruş!`;
    if(act==="block") return kind==="ok"?`${n} şutun önüne atladı, blok! Harika savunma.`:`${n} bloğa uzandı ama şut geçti!`;
    if(act==="foul") return kind==="ok"?`${n} taktik faulle hücumu kesti.`:`${n} faul yaptı: sarı kart ve tehlikeli serbest vuruş!`;
    return kind==="ok"?`Son anda ${n} araya girdi, şut engellendi!`:`Rakip rahat vurdu, ${n} yetişemedi!`;
  }
  if(act==="dribble_lost") return `${n} topu kaptırdı, atak bitti.`;
  if(act==="intercepted") return `Pas arayı kesildi, atak bitti.`;
  if(act==="timeout_cross") return kind==="goal"?`Süre daralırken orta geldi, ${n} kafayla GOL!`
    :`Süre doldu, ${n} aceleyle ortaladı; savunma uzaklaştırdı.`;
  if(act==="last_shot"){
    if(kind==="goal") return `Savunmacı üstüne gelirken ${n} son anda vurdu… GOL!`;
    if(kind==="save") return `Baskı altındaki ${n} son anda vurdu, kaleci kurtardı.`;
    return `Baskı altındaki ${n} son anda vurdu, top dışarı gitti.`;
  }
  const cross=act==="cross"||act==="pass_cross";
  if(kind==="goal"){
    if(cross) return `Orta geldi, ${n} kafayı vurdu: GOL!`;
    if(act==="timeout") return `Süre daralırken ${n} vurdu… GOL!`;
    if(act==="pass_shot") return `Paslaşmanın ardından ${n} bitirdi! GOL!`;
    if(type==="penalty") return `${n} penaltıyı köşeye gönderdi! GOL!`;
    if(type==="freekick") return `${n} serbest vuruşu ağlara yolladı! GOL!`;
    if(type==="corner") return `${n} kornerden doğrudan GOL!`;
    return `${n} sürdü, vurdu… GOL!`;
  }
  if(cross){
    if(kind==="save") return `${n} kafayı vurdu, kaleci yakaladı!`;
    if(kind==="wide") return `${n} kafa vuruşu üstten auta gitti.`;
    if(kind==="post") return `${n} kafayı vurdu, top direkten döndü!`;
    return `Orta savunmadan döndü, fırsat kaçtı.`;
  }
  const pre=act==="timeout"?`Süre daralınca ${n} aceleyle vurdu: `:"";
  if(kind==="save") return pre?pre+"kaleci kurtardı.":`${n} vurdu ama kaleci kurtardı!`;
  if(kind==="post") return pre?pre+"direkten döndü!":`${n} şutu direkten döndü!`;
  if(kind==="block") return pre?pre+"savunma bloke etti.":`${n} vurdu, savunma bloke etti.`;
  return pre?pre+"dışarı.":`${n} vuruşu az farkla dışarı gitti.`;
}

// Rota üzerindeki rakiplerin "kesilme riski" (0–1).
// pts: [{x,z}] dünya, opps: [{x,z,w?}] (w: rakip ağırlığı) → {risk, idx (en tehlikeli rakip), u (rota oranı), x, z}
// n (isteğe bağlı): pts dizisinin kullanılacak uzunluğu (önceden ayrılmış dizi için)
function moment3dRouteRisk(pts,opps,lofted,n){
  const out={risk:0,idx:-1,u:0,x:0,z:0};
  const np=Number.isFinite(n)?Math.min(n,pts?pts.length:0):(pts?pts.length:0);
  if(!pts||np<2||!opps||!opps.length) return out;
  let total=0;
  for(let i=1;i<np;i++) total+=Math.hypot(pts[i].x-pts[i-1].x,pts[i].z-pts[i-1].z);
  if(total<=0) return out;
  let keep=1, worst=0;
  for(let j=0;j<opps.length;j++){
    const o=opps[j]; if(!o) continue;
    let bestD=1e9, bestU=0, bx=0, bz=0, acc=0;
    for(let i=1;i<np;i++){
      const a=pts[i-1], b=pts[i], dx=b.x-a.x, dz=b.z-a.z, l2=dx*dx+dz*dz, l=Math.sqrt(l2);
      let t=l2>0?((o.x-a.x)*dx+(o.z-a.z)*dz)/l2:0; t=t<0?0:t>1?1:t;
      const px=a.x+dx*t, pz=a.z+dz*t, d=Math.hypot(o.x-px,o.z-pz);
      if(d<bestD){ bestD=d; bestU=(acc+l*t)/total; bx=px; bz=pz; }
      acc+=l;
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

// Kilit an sahne denetleyicisi (React dışı). api: Pitch3D onReady api'si.
// cfg: {type, player, oppStr, mates:[{n}], touch, onHud(h), onFrame(timeFrac,power,colHex),
//       onStrikeBall(x,y,r)|onStrikeBall(null) (vuruş ekranı: 3D topun tuvaldeki yeri), onOutcome(o), onAnimEnd()}
// Dönüş: girdi (bot simülasyonu da kullanır): dribbleTo(wx,wz), passTo(wx,wz,loft,recv),
//   setRun(idx,[{x,z}]), strike(dx,dz,power,curl) (anında) · beginStrike(dx,dz,power) → vuruş ekranı →
//   confirmStrike(sx,sy) · standTackle(ex,ez), slideTackle(dx,dz,len), tackleAt(wx,wz), foul(holdSec),
//   block(power) · setSpin(x,y) · forceTimeout() · getState() · dispose()
function createMoment3DController(api,cfg){
  const type=cfg.type, lay=MOMENT3D_LAYOUTS[type];
  if(!api||!api.THREE||api.isDisposed()||!lay) throw new Error("Kilit an sahnesi kurulamadı: "+type);
  const THREE=api.THREE, D=PITCH3D_DIM, L=D.halfLen, H=D.halfWid, GW=D.goalWidth/2;
  const isTackle=type==="tackle", isPen=type==="penalty";
  const setPiece=type==="corner"||type==="freekick"||isPen;
  const clamp=(v,a,b)=>v<a?a:v>b?b:v;
  const sgn=(v)=>v>=0?1:-1;
  const wp=(p)=>{ const w=pitchToWorld3D(p[0],p[1]); return {x:w.x,z:w.z}; };
  const flat=(geo)=>{ geo.rotateX(-Math.PI/2); return geo; };
  const P=cfg.player||{};
  const num=(v,d)=>Number.isFinite(Number(v))&&Number(v)>0?Number(v):d;
  const shortN=(n)=>{ const s=String(n||""); return s.split(" ").pop().split(".").pop()||s; };
  const pname=P.n||"Oyuncumuz";
  const oppStr=clamp(num(cfg.oppStr,70),40,99);
  const drb=num(P.spd,60)*0.6+num(P.ovr,65)*0.4;              // dribling yeterliliği
  const defSk=num(P.def,60)*0.6+num(P.ovr,65)*0.4;
  // Hızlar (m/sn): top sürerken oyuncumuz savunmacılardan biraz yavaş; savunmacıların
  // dönüş hızı sınırlı olduğu için ani yön değiştirme onları geçer.
  const VMAX_BALL=clamp(4.9+(drb-50)*0.04,4.6,6.4);
  const VMAX_RUN=6.4;
  const VMAX_DEF=clamp(5.5+(oppStr-60)*0.03,5.1,6.6);
  const VMAX_MYDEF=clamp(5.8+(defSk-50)*0.035,5.4,7.2);
  const VMAX_ATT=5.0;

  // ── Dizilim → ajanlar + statik snapshot (createMatchActors3D manual modda) ──
  const my=[], opp=[], home=[], away=[];
  const add=(list,snapList,team,p100,role,kind,name)=>{
    const w=wp(p100);
    const a={team,idx:snapList.length,x:w.x,z:w.z,vx:0,vz:0,ax:w.x,az:w.z,kind,name:name||"",
      cool:0,mark:-1,ovr:false,ox:0,oz:0,osp:0,rw:{x:0,z:0,w:1}};
    snapList.push({id:snapList.length,x:p100[0],y:p100[1],role});
    list.push(a); return a;
  };
  // Takım arkadaşı adları (mates prop'u: tackle'da savunmacılar, diğerlerinde hücumcular önce)
  const mateNames=(()=>{
    const src=Array.isArray(cfg.mates)?cfg.mates.filter(m=>m&&m.n&&m.n!==P.n&&m.pos!=="GK"):[];
    const atk=["ST","LW","RW","LM","RM","CAM","CF"], def=["CB","LB","RB","CDM","LWB","RWB"];
    const pref=isTackle?def:atk;
    src.sort((a,b)=>(pref.includes(b.pos)?1:0)-(pref.includes(a.pos)?1:0));
    return src.map(m=>m.n);
  })();
  add(home,my,"home",lay.carrier,isTackle?"CB":"ST","mate",pname);
  lay.mates.forEach((m,k)=>add(home,my,"home",m,"CM","mate",mateNames[k]||""));
  let myGk=null;
  if(lay.myGk) myGk=add(home,my,"home",lay.myGk,"GK","gk","");
  let att=null, runW=null;
  if(lay.attacker){ att=add(away,opp,"away",lay.attacker,"ST","att",""); runW=wp(lay.runTo); }
  lay.opps.forEach(o=>add(away,opp,"away",o,"CB","def",""));
  const ballW=wp(lay.ball);
  if(lay.wall){
    // Duvar: toptan kaleye doğru 9.15 m'de, doğrultuya dik
    const dx=L-ballW.x, dz=0-ballW.z, dl=Math.hypot(dx,dz)||1, ux=dx/dl, uz=dz/dl;
    for(let k=0;k<lay.wall;k++){
      const off=(k-(lay.wall-1)/2)*0.8;
      const p=worldToPitch3D(ballW.x+ux*9.15-uz*off,ballW.z+uz*9.15+ux*off);
      add(away,opp,"away",[p.x,p.y],"CB","wall","");
    }
  }
  let gk=null;
  if(lay.gk){
    // Penaltı/birebirde kaleci bir tarafa hafif kaymış başlar (açık köşe her an değişir)
    const gy=(isPen||type==="oneonone")?lay.gk[1]+(Math.random()*2-1)*2.2:lay.gk[1];
    gk=add(away,opp,"away",[lay.gk[0],gy],"GK","gk","");
  }
  const labels=home.map(a=>a.kind==="gk"?"":shortN(a.name));
  const snap={my,opp,ball:lay.ball,events:[],labels};
  const actors=createMatchActors3D(api,{getSnapshot:()=>snap,manual:true});
  actors.update(snap); // oyuncular hemen oluşsun (sahiplik ilk karede kurulabilsin)
  const B=actors.getBall()||{x:ballW.x,y:0,z:ballW.z};
  const ball0x=ballW.x;

  // ── Hibrit kamera: oyun akışında kuşbakışı 2.5D (odak oyuncuyu izler), vuruş
  //    onayında çim seviyesi (topun arkası → hedef). Pitch3D özel kamerayı saha
  //    kutusuna kırpar (pitch3dSafeCam): tribün görüşü kapatmaz. ──
  const camH=lay.cam.h, cl=lay.cam.look;
  const setCam=api.setCustomCamera;
  // Neredeyse dik bakış (~11° eğim: yön tabanı tanımlı kalsın). Dikey ekranda hücum (+X) yukarı.
  const camAsp=()=>api.camera&&Number.isFinite(api.camera.aspect)?api.camera.aspect:1.6;
  // camOrient: "x" = saha boyu ekranda yatay (kamera +z tarafında), "z" = saha boyu dikey
  //   (kamera −x tarafında, hücum yukarı). Kilit an başında bir kez kadraja göre seçilir.
  let camOrient=null;
  const overheadCam=(fx,fz,h,snap)=>{
    const o=camOrient||(camAsp()<1?"z":"x");
    if(o==="z") setCam(fx-h*0.2,h,fz,fx,0,fz,!!snap,false);
    else setCam(fx,h,fz+h*0.2,fx,0,fz,!!snap,false);
  };
  // Kadraj: verilen noktaları (dünya x,z) ekranda tutacak odak + yükseklik (en az camH, en çok 78 m).
  //   Yatay ekranda saha boyu (x) yatay eksende, dikeyde z yatay eksende. %12 kenar payı.
  const TAN_V=Math.tan((45*Math.PI/180)/2);
  const frameBox={x0:0,x1:0,z0:0,z1:0,n:0};
  const frameAdd=(x,z)=>{
    if(!Number.isFinite(x)||!Number.isFinite(z)) return;
    if(!frameBox.n){ frameBox.x0=frameBox.x1=x; frameBox.z0=frameBox.z1=z; }
    else { frameBox.x0=Math.min(frameBox.x0,x); frameBox.x1=Math.max(frameBox.x1,x); frameBox.z0=Math.min(frameBox.z0,z); frameBox.z1=Math.max(frameBox.z1,z); }
    frameBox.n++;
  };
  const frameFit=(out)=>{
    const asp=Math.max(0.3,camAsp());
    out.x=(frameBox.x0+frameBox.x1)/2; out.z=(frameBox.z0+frameBox.z1)/2;
    const hx=(frameBox.x1-frameBox.x0)/2+3, hz=(frameBox.z1-frameBox.z0)/2+3;
    // halfH/halfV: ekranın yatay / dikey eksenine düşen yarı boy (m)
    const need=(halfH,halfV)=>Math.max(halfH/(TAN_V*asp*0.88),halfV/(TAN_V*0.88));
    const hX=need(hx,hz), hZ=need(hz,hx);
    if(!camOrient){
      // Varsayılan (yatay: "x", dikey: "z" — hücum yukarı); öbürü belirgin şekilde yakınsa onu seç
      const def=asp<1?"z":"x";
      camOrient=def==="z"?(hX<hZ*0.85?"x":"z"):(hZ<hX*0.85?"z":"x");
    }
    out.h=clamp(Math.max(camH,camOrient==="z"?hZ:hX),camH,78);
    return out;
  };
  // Kadraja alınacaklar: top + oyuncumuz + (yakın) takım arkadaşları + koşu yolu; savunmada
  //   savunmacı + rakip + şut noktası. Topa 45 m'den uzak arkadaşlar sayılmaz (aşırı uzaklaşmasın).
  const frameCollect=(c)=>{
    frameBox.n=0;
    frameAdd(B.x,B.z); frameAdd(c.x,c.z);
    if(isTackle&&att){ frameAdd(att.x,att.z); if(runW) frameAdd(runW.x*0.5+att.x*0.5,runW.z); }
    for(let i=0;i<home.length;i++){ const m=home[i]; if(m.kind==="gk") continue; if(Math.hypot(m.x-B.x,m.z-B.z)<45) frameAdd(m.x,m.z); }
    if(run.idx>=0&&run.pts.length) { const e=run.pts[run.pts.length-1]; frameAdd(e.x,e.z); }
    if(isPen||type==="oneonone") frameAdd(L,0);
  };
  const fitTmp={x:0,z:0,h:camH};
  const focus={x:cl[0],z:cl[1],h:camH};
  overheadCam(cl[0],cl[1],78,true);          // giriş: yüksekten kadraja iner
  const strikeCam={x:0,z:0,tx:0,tz:0};       // vuruş kamerası: top konumu + hedef

  // ── Görseller (paylaşılan geometri/malzeme; dispose'da serbest) ──
  const owned={geos:[],mats:[]};
  const G=(g)=>{ owned.geos.push(g); return g; };
  const M=(m)=>{ owned.mats.push(m); return m; };
  const group=new THREE.Group(); group.name="moment3d";
  api.groups.fx.add(group);
  const basic=(color,opacity)=>M(new THREE.MeshBasicMaterial({color,transparent:true,opacity,depthWrite:false,side:THREE.DoubleSide}));
  const teamCol=0x4da6ff;
  // Kontrol halkası
  const ringGeo=G(flat(new THREE.RingGeometry(1.2,1.65,36)));
  const ctlMat=basic(teamCol,0.55);
  const ctlRing=new THREE.Mesh(ringGeo,ctlMat); ctlRing.position.y=0.07; ctlRing.renderOrder=4; group.add(ctlRing);
  // İniş/hedef halkası + kale ağzı işareti
  const markRingGeo=G(flat(new THREE.RingGeometry(0.7,1.05,28)));
  const landMat=basic(0x2ecc71,0.8);
  const landRing=new THREE.Mesh(markRingGeo,landMat); landRing.position.y=0.08; landRing.visible=false; landRing.renderOrder=4; group.add(landRing);
  const markGeo=G(new THREE.SphereGeometry(0.32,10,8));
  const goalMark=new THREE.Mesh(markGeo,landMat); goalMark.visible=false; goalMark.renderOrder=4; group.add(goalMark);
  // Koşu yolu (kullanıcı çizer): noktalı beyaz rota (tek InstancedMesh) + rota sonu halkası
  const RUN_DOT_N=60;
  const runDotGeo=G(flat(new THREE.CircleGeometry(0.2,8)));
  const runDotMat=basic(0xffffff,0.9);
  const runDots=new THREE.InstancedMesh(runDotGeo,runDotMat,RUN_DOT_N); runDots.renderOrder=4; runDots.frustumCulled=false; runDots.visible=false;
  group.add(runDots);
  const runMat=basic(0xffffff,0.55);
  const runMark=new THREE.Mesh(markRingGeo,runMat); runMark.position.y=0.08; runMark.visible=false; runMark.renderOrder=3; group.add(runMark);
  // Ok: sabit segment sayılı şerit (vertex güncellenir) + uç üçgeni
  const AR_N=24;
  const arPos=new Float32Array(AR_N*2*3);
  const arIdx=[]; for(let i=0;i<AR_N-1;i++){ const a=i*2; arIdx.push(a,a+1,a+2,a+1,a+3,a+2); }
  const arGeo=G(new THREE.BufferGeometry());
  const arAttr=new THREE.BufferAttribute(arPos,3);
  if(arAttr.setUsage&&THREE.DynamicDrawUsage) arAttr.setUsage(THREE.DynamicDrawUsage);
  arGeo.setAttribute("position",arAttr); arGeo.setIndex(arIdx); arGeo.setDrawRange(0,0);
  const arMat=basic(0x2ecc71,0.85);
  const arrow=new THREE.Mesh(arGeo,arMat); arrow.renderOrder=5; arrow.frustumCulled=false; arrow.visible=false; group.add(arrow);
  const hdPos=new Float32Array(9);
  const hdGeo=G(new THREE.BufferGeometry());
  const hdAttr=new THREE.BufferAttribute(hdPos,3);
  if(hdAttr.setUsage&&THREE.DynamicDrawUsage) hdAttr.setUsage(THREE.DynamicDrawUsage);
  hdGeo.setAttribute("position",hdAttr);
  const head=new THREE.Mesh(hdGeo,arMat); head.renderOrder=5; head.frustumCulled=false; head.visible=false; group.add(head);
  const arX=new Float32Array(AR_N), arZ=new Float32Array(AR_N);
  // Noktalı pas çizgisi: tek InstancedMesh (tek çizim çağrısı)
  const DOT_N=22;
  const dotGeo=G(flat(new THREE.CircleGeometry(0.26,10)));
  const dotMat=basic(0xffffff,0.9);
  const dots=new THREE.InstancedMesh(dotGeo,dotMat,DOT_N); dots.renderOrder=4; dots.frustumCulled=false; dots.visible=false;
  group.add(dots);
  const tmpM=new THREE.Matrix4();
  let dotsT=0;
  const showDots=(x0,z0,x1,z1,lofted)=>{
    const d=Math.hypot(x1-x0,z1-z0); const n=clamp(Math.round(d/1.6),2,DOT_N);
    for(let i=0;i<DOT_N;i++){
      const u=i/(n-1);
      if(i<n){
        const h=lofted?4*Math.min(6,d*0.12)*u*(1-u):0;
        tmpM.makeTranslation(x0+(x1-x0)*u,0.09+h*0.15,z0+(z1-z0)*u);
      } else tmpM.makeTranslation(0,-50,0);
      dots.setMatrixAt(i,tmpM);
    }
    dots.instanceMatrix.needsUpdate=true;
    dotMat.color.setHex(lofted?0xf1c40f:0xffffff);
    dots.visible=true; dotsT=0.9;
  };

  // ── Durum ──
  let phase="intro";      // intro | set | play | pass | strike (vuruş ekranı) | anim | done
  let introT=0, playT=0, timeLeft=MOMENT3D_TIME_SEC, passes=0, ctl=0, carried=0;
  let outcome=null, ended=false, disposed=false, wallUp=!!lay.wall, timeScale=1;
  let flashMsg="", flashT=0, touchUi=!!cfg.touch, hudKey="", realT=0, guardT=0;
  const moveIn={x:0,z:0};
  // aim.mode: "drib" (yeşil koşu oku) | "kick" (kırmızı vuruş oku) | "tk" (savunma oku)
  //   len: savunma okunun uzunluğu (m) · f: sapan çekiş oranı (0–1)
  const aim={on:false,mode:"kick",dx:1,dz:0,ax:1,az:0,power:0,curl:0,f:0,len:0,cancel:false};
  // Vuruş ekranında seçilen vuruş noktası: x>0 topun sağı → sağa falso; y<0 altı → yüksek, y>0 üstü → sert/alçak
  const spin={x:0,y:0};
  // Bekleyen vuruş (vuruş ekranı): yön, güç, tür (shot|cross) ve hedef (kamera için)
  const pend={on:false,dx:1,dz:0,power:0,kind:"shot",tx:0,tz:0,t:0};
  const drib={on:false,x:0,z:0};       // yeşil oktan sonra top sürme hedefi
  // Sağ alt düğmeler: passMode = PAS düğmesi açık (arkadaşlar parlar, ipucu pas/koşu yolu);
  //   forceShot = ŞUT düğmesiyle açılan vuruş: yön ne olursa olsun şut (uzun pas/orta değil)
  let passMode=false, forceShot=false, outT=0;
  // Koşu yolu: idx = koşan takım arkadaşı, pts = rota (dünya), i = sıradaki nokta
  const run={idx:-1,pts:[],i:0};
  const draw={on:false,idx:-1,pts:[],len:0};   // çizilmekte olan rota
  const hold={on:false,t:0};          // tackle: uzun basış (faul) göstergesi
  const passInfo={r:-1,px:0,pz:0,T:0,t:0,cut:false,cutter:-1,cx:0,cz:0,tc:0,lofted:false};
  const cls={kind:"",zHit:0,lx:0,lz:0};
  const riskList=[];                  // rakip riskleri (ajanların rw nesneleri, yeniden kullanılır)
  const shotPts=[]; for(let i=0;i<12;i++) shotPts.push({x:0,z:0});
  const ctlA=()=>home[ctl];
  const flash=(m)=>{ flashMsg=m; flashT=2.2; hud(); };

  // ── HUD: yalnızca değişince React'a bildir (her karede setState yok) ──
  const hintFor=()=>{
    if(phase==="intro") return "Hazırlan…";
    if(phase==="strike") return pend.kind==="cross"?"Topa dokun: orta = düz · sağdan vur = sola kavis · soldan = sağa · alt = yüksek orta"
      :pend.kind==="lpass"?"Topa dokun: havadan uzun pas"
      :"Topa dokun: orta = düz · sağdan vur = sola kavis · soldan = sağa · alt = aşırtma · üst = sert";
    if(aim.on){
      if(isTackle) return aim.len>MOMENT3D_SLIDE_LEN?"KIRMIZI — bırak: kayarak müdahale · savunmacıya geri getir: iptal"
        :"Beyaz/yeşil — bırak: ayakta müdahale · uzat: kayarak · savunmacıya geri getir: iptal";
      if(aim.mode==="drib") return "YEŞİL — basılı tut: o yöne sürer · parmağı kaydır: yön ver · bırak: dur (sonra tekrar çek: şut)";
      return "KIRMIZI — bırak: vuruş ekranı · halkaya geri getir: iptal";
    }
    if(draw.on) return "Koşu yolunu çiz — bırak: takım arkadaşın koşuya başlar";
    if(phase==="pass") return "Pas…";
    if(phase==="anim"||phase==="done") return "";
    if(isTackle) return "Savunmacından rakibe ok çiz ve bırak: kısa beyaz/yeşil = ayakta, uzun kırmızı = kayarak · Rakibe dokun: ayakta · Savunmacıda uzun bas: faul";
    if(isPen) return "Topa basılı tut, ters yöne geri çek ve bırak → vuruş ekranı";
    if(run.idx>=0&&phase==="play") return "Rota üzerindeki boş alana dokun: ara pası · ŞUT: vuruş ekranı";
    if(passMode) return "PAS — parlayan arkadaşa dokun: pas · Arkadaştan boş alana sürükle: koşu yolu, rotaya dokun: ara pası";
    if(phase==="set") return "Arkadaşa dokun: kısa pas · Arkadaştan sürükle: koşu yolu · Topa basılı geri çek: orta / şut";
    return "Topa basılı geri çek: yeşil ok = top sür · PAS: arkadaşa pas / koşu yolu · ŞUT: vuruş ekranı";
  };
  const hud=()=>{
    const h={phase,hint:flashT>0?flashMsg:hintFor(),passes,
      touchUi,aiming:aim.on||draw.on,tackle:isTackle,strikeKind:pend.kind,passMode,setPiece:!!setPiece};
    const k=h.phase+"|"+h.hint+"|"+h.passes+"|"+h.touchUi+"|"+h.aiming+"|"+h.strikeKind+"|"+h.passMode;
    if(k===hudKey) return;
    hudKey=k;
    try{ cfg.onHud&&cfg.onHud(h); }catch(e){ console.error("[3D kilit an] onHud",e); }
  };

  // ── Yardımcılar ──
  // Hareket girdisi: YALNIZ sapanın yeşil oku (drib) — sanal çubuk/klavye yok
  //   Parmak basılıyken yeşil okta (aim.mode drib) oyuncu ANINDA ok yönüne sürer; parmak
  //   kaydıkça yön gerçek zamanlı döner, çekiş arttıkça hızlanır; bırakınca durur.
  const inputDir=()=>{
    let x=0, z=0;
    if(aim.on&&aim.mode==="drib"&&!aim.cancel){
      const s=0.45+0.55*clamp(aim.f/MOMENT3D_DRIB_F,0,1);
      x=aim.dx*s; z=aim.dz*s;
    } else if(drib.on){
      // Yeşil ok: hedefe tam hızla sür, son 1.5 m'de yavaşla, varınca dur
      const a=ctlA(), dx=drib.x-a.x, dz=drib.z-a.z, d=Math.hypot(dx,dz);
      if(d<0.7) drib.on=false;
      else { const s=Math.min(1,0.35+d/1.5*0.65); x=dx/d*s; z=dz/d*s; }
    }
    const m=Math.hypot(x,z); if(m>1){ x/=m; z/=m; }
    moveIn.x=x; moveIn.z=z;
  };
  // Dönüş hızı sınırlı yönelim (savunmacı/rakip AI). stopR: hedefe bu kadar kala dur.
  const steer=(a,tx,tz,vmax,omega,accel,dt,stopR)=>{
    const dx=tx-a.x, dz=tz-a.z, d=Math.hypot(dx,dz);
    const ds=d<=stopR?0:vmax*Math.min(1,(d-stopR)/2.5);
    const sp=Math.hypot(a.vx,a.vz);
    if(ds<=0.01||d<1e-4){
      if(sp>0){ const ns=Math.max(0,sp-accel*dt); a.vx*=ns/sp; a.vz*=ns/sp; }
    } else {
      const ux=dx/d, uz=dz/d;
      if(sp<1.0){
        const k=Math.min(1,dt*6); a.vx+=(ux*ds-a.vx)*k; a.vz+=(uz*ds-a.vz)*k;
      } else {
        const cur=Math.atan2(a.vz,a.vx), want=Math.atan2(uz,ux);
        let da=want-cur; while(da>Math.PI) da-=Math.PI*2; while(da<-Math.PI) da+=Math.PI*2;
        const full=Math.abs(da), lim=omega*dt;
        if(da>lim) da=lim; else if(da<-lim) da=-lim;
        const tgt=ds*(full>1.6?0.45:1);           // keskin dönüşte yavaşlar
        const ns=Math.max(0,sp+clamp(tgt-sp,-accel*dt,accel*dt));
        const na=cur+da; a.vx=Math.cos(na)*ns; a.vz=Math.sin(na)*ns;
      }
    }
    a.x=clamp(a.x+a.vx*dt,-L-3,L+3); a.z=clamp(a.z+a.vz*dt,-H-2,H+2);
  };
  // Jokey adımı (yön sınırı yok: geri/yan adım). (gx,gz): kale yönü. Kaleye doğru geri
  // çekilme tam hızda, yanal adım VMAX·0.6 ile sınırlı, ivme 6 m/sn² → ani kesiş geçer.
  const shuffle=(a,tx,tz,vmax,gx,gz,dt)=>{
    let ex=tx-a.x, ez=tz-a.z; const el=Math.hypot(ex,ez);
    const want=Math.min(vmax,el*3.2);
    let wx=el>1e-4?ex/el*want:0, wz=el>1e-4?ez/el*want:0;
    const along=wx*gx+wz*gz, lx=wx-along*gx, lz=wz-along*gz, ll=Math.hypot(lx,lz), lmax=vmax*0.6;
    if(ll>lmax){ const k=lmax/ll; wx=along*gx+lx*k; wz=along*gz+lz*k; }
    const dvx=wx-a.vx, dvz=wz-a.vz, dl=Math.hypot(dvx,dvz), mx=6*dt;
    if(dl>mx){ a.vx+=dvx/dl*mx; a.vz+=dvz/dl*mx; } else { a.vx=wx; a.vz=wz; }
    a.x=clamp(a.x+a.vx*dt,-L-3,L+3); a.z=clamp(a.z+a.vz*dt,-H-2,H+2);
  };
  const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
  const isOppField=(a)=>a.kind==="def"||a.kind==="wall"||a.kind==="att";
  // Rakip risk listesi (moment3dRouteRisk için): saha oyuncuları w=1 (duvar wallW), kaleci gkW
  const buildRisk=(wallW,gkW)=>{
    riskList.length=0;
    for(let i=0;i<away.length;i++){
      const a=away[i]; if(isTackle&&a===att) continue;
      a.rw.x=a.x; a.rw.z=a.z; a.rw.w=a.kind==="gk"?gkW:a.kind==="wall"?wallW:1;
      if(a.rw.w>0) riskList.push(a.rw);
    }
    return riskList;
  };
  const riskAgent=(idx)=>{ // riskList indeksinden ajana
    const rw=riskList[idx]; if(!rw) return null;
    for(let i=0;i<away.length;i++) if(away[i].rw===rw) return away[i];
    return null;
  };
  const inBox=(x,z)=>x>L-17.5&&Math.abs(z)<D.penWidth/2+1;
  // Şut mesafesi referansı: serbest vuruş zaten ~25 m'den kurulduğu için 20 m, diğerleri penaltı noktası
  const DIST_REF=type==="freekick"?20:11;
  const gkAt=()=>gk?{x:gk.x,z:gk.z}:{x:L,z:0};

  // ── Vuruş değerlendirmesi (ADİL: konum + açı + kaleci + blok; görselden bağımsız) ──
  const bezSample=(x0,z0,ax,az,x2,z2,n,out)=>{
    const len=Math.hypot(x2-x0,z2-z0), x1=x0+ax*len*0.5, z1=z0+az*len*0.5;
    for(let i=0;i<n;i++){
      const u=i/(n-1), w0=(1-u)*(1-u), w1=2*u*(1-u), w2=u*u;
      out[i].x=w0*x0+w1*x1+w2*x2; out[i].z=w0*z0+w1*z1+w2*z2;
    }
  };
  const evalShot=(bx,bz,ax,az,zHit,curlAbs,wallW)=>{
    const dG=Math.hypot(L-bx,bz);
    const distQ=clamp(1-(dG-DIST_REF)/24,0,1);
    const a1=Math.atan2(-GW-bz,L-bx), a2=Math.atan2(GW-bz,L-bx);
    const angQ=clamp(Math.abs(a2-a1)/0.62,0,1);
    const inGoal=Math.abs(zHit)<GW-0.15;
    let gkClear=1;
    if(gk){
      const lx=L-bx, lz=zHit-bz, l2=lx*lx+lz*lz||1;
      const u=clamp(((gk.x-bx)*lx+(gk.z-bz)*lz)/l2,0,1);
      gkClear=clamp((Math.hypot(gk.x-(bx+lx*u),gk.z-(bz+lz*u))-0.3)/1.8,0,1);
    }
    const edge=Math.abs(zHit)/GW;
    // Vuruş noktası: altından (lift) baraj/blok aşılır ama isabet düşer; üstünden (top) sert, kaleciyi zorlar
    // Kenardan vuruş (falso): kavis bloğu biraz aşar ama isabet hafif düşer (bedava bonus değil)
    const lift=Math.max(0,-spin.y), top=Math.max(0,spin.y), side=Math.min(1,Math.abs(spin.x));
    const acc=(edge<=0.72?0.45+0.55*edge/0.72:clamp(1-(edge-0.72)/0.28*0.55,0,1))*(1-0.2*lift)*(1-0.12*top)*(1-0.1*side);
    gkClear=clamp(gkClear+0.12*top,0,1);
    bezSample(bx,bz,ax,az,L,zHit,12,shotPts);
    const r=moment3dRouteRisk(shotPts,buildRisk(wallW,0),false,12);
    const block=r.risk*(curlAbs>0.15?0.75:1)*(1-0.2*side)*(1-0.45*lift)*(1+0.25*top); // falso blok riskini azaltır
    const q=inGoal?clamp((0.1+0.25*distQ+0.15*angQ+0.25*gkClear+0.25*acc)*(1-block*0.5),0,1):0.05;
    return {q,inGoal,block,blockAgent:r.idx>=0?riskAgent(r.idx):null};
  };
  const evalCross=(lx,lz)=>{
    let best=-1, bd=1e9;
    for(let i=0;i<home.length;i++){ const a=home[i]; if(i===ctl||a.kind==="gk") continue; const d=Math.hypot(a.x-lx,a.z-lz); if(d<bd){ bd=d; best=i; } }
    const recvQ=clamp(1-(bd-1.5)/6,0,1);
    let keep=1;
    for(let i=0;i<away.length;i++){
      const a=away[i]; if(a.kind==="gk") continue;
      const b=Math.max(0,1-Math.hypot(a.x-lx,a.z-lz)/3.5); keep*=1-0.85*Math.pow(b,1.3);
    }
    const dg=Math.hypot(L-lx,lz);
    const zoneQ=clamp(1-Math.abs(dg-9)/10,0,1)*(inBox(lx,lz)?1:0.4);
    const g=gkAt(), gkQ=clamp(Math.hypot(g.x-lx,g.z-lz)/6,0,1);
    const q=clamp(0.3*recvQ+0.3*keep+0.25*zoneQ+0.15*gkQ,0,1);
    return {q,mate:best};
  };
  // Çekiş yönü/gücü → vuruş türü (cls'e yazar): shot | cross | lpass
  const classify=(bx,bz,dx,dz,power)=>{
    // Penaltı ve ŞUT düğmesi: kaleye yönelen vuruş mesafe/konumdan bağımsız (kendi yarıdan,
    //   kanattan da) ŞUTTUR — orta/uzun pas kontrolünden önce
    if(dx>0&&(isPen||forceShot)){
      cls.kind="shot"; cls.zHit=clamp(bz+dz*(L-bx)/Math.max(dx,0.02),-(GW+2.4),GW+2.4); return cls;
    }
    if(dx>0.05&&bx>0){
      const zHit=bz+dz*(L-bx)/dx;
      if(Math.abs(zHit)<GW+2.5){ cls.kind="shot"; cls.zHit=zHit; return cls; }
    }
    // Orta: penaltı noktasına en yakın geçiş, güç mesafeyi ±%10–18 ayarlar (40–80 = tam)
    const sx=L-10-bx, sz=-bz;
    const tStar=Math.max(8,sx*dx+sz*dz);
    const f=0.73+clamp(power,0,100)*0.0045;
    const lx=clamp(bx+dx*tStar*f,-L+1,L-1), lz=clamp(bz+dz*tStar*f,-H+1,H-1);
    if(inBox(lx,lz)&&(Math.abs(bz)>12||type==="corner")){ cls.kind="cross"; cls.lx=lx; cls.lz=lz; return cls; }
    const d=6+clamp(power,0,100)*0.3;
    cls.kind="lpass"; cls.lx=clamp(bx+dx*d,-L+1,L-1); cls.lz=clamp(bz+dz*d,-H+1,H-1);
    return cls;
  };

  // ── Sonuç ──
  const tl=[]; let animT=0;
  const later=(sec,fn)=>{ const t=animT+sec; let i=tl.length; while(i>0&&tl[i-1].t>t) i--; tl.splice(i,0,{t,fn}); };
  const finish=()=>{ if(ended) return; ended=true; phase="done"; hud(); try{ cfg.onAnimEnd&&cfg.onAnimEnd(); }catch(e){ console.error(e); } };
  const finishSoon=(s)=>later(s==null?1:s,finish);
  const emit=(o)=>{
    if(outcome) return false;
    outcome=o; phase="anim"; aim.on=false; hold.on=false; timeScale=1;
    pend.on=false; drib.on=false; draw.on=false;
    arrow.visible=false; head.visible=false; landRing.visible=false; goalMark.visible=false;
    if(api.setTimeScale) api.setTimeScale(1);
    hud();
    try{ cfg.onOutcome&&cfg.onOutcome(o); }catch(e){ console.error("[3D kilit an] onOutcome",e); }
    later(9,finish); // güvenlik: animasyon takılırsa
    return true;
  };
  // calcMomentChance ile adil zar (stat/bonus: MOMENT_TYPES'taki benzer seçenek)
  const roll=(optKey,power,q,auto)=>{
    const opt=moment3dOpt(type,optKey);
    const term=auto?MOMENT3D_AUTO_TERM:moment3dRouteTerm(q);
    const chance=calcMomentChance(P,opt,power,term);
    return {success:Math.random()<chance,chance,opt};
  };
  const mk=(success,act,kind,name,power,q,chance,goalScored,goalConceded,msg)=>({
    success,goalScored:!!goalScored,goalConceded:!!goalConceded,optId:act,playerName:name||pname,
    msg:msg||moment3dMsg(type,act,kind,name||pname),chance:Math.round(chance*100),
    power:Math.round(power),quality:Math.round(q*100),act,kind});

  // GK dalışı / ajan yönlendirme (animasyonda AI'yı ezer)
  const override=(a,x,z,sp)=>{ if(!a) return; a.ovr=true; a.ox=x; a.oz=z; a.osp=sp; };
  // ── FİZİKSEL ŞUT: yerçekimi + hava direnci + Magnus; kapsül / direk / kaleci çarpışması ──
  //   Ölçek players3d ile aynı: oyuncular görünürlük için ~3.2 m, top yarıçapı BALL_R.
  //   Vuruş önce kesin olarak simüle edilir (sonuç = fizik), sonra örnekler top senaryosu
  //   olarak oynatılır → top hiçbir oyuncunun, barajın ya da kalecinin içinden geçmez.
  //   Adil zar (calcMomentChance) yalnız kalecinin vuruşu OKUMASINI belirler: zar başarılıysa
  //   kaleci geç/ters köşeye uçar (erişimi ~ayakta durduğu yer), başarısızsa doğru köşeye
  //   tam erişimle uçar. Erişim alanına giren top kurtarılır, dışından giren gol olur.
  const BALL_R=Number.isFinite(actors.ballR)?actors.ballR:0.42;
  const GH=D.goalHeight, POST_R=0.06;
  const BODY_R=0.4, BODY_Y0=0.15, BODY_Y1=2.85;            // oyuncu kapsülü: yarıçap + eksen (m)
  const GK_STAND=0.95, GK_DIVE_MAX=2.4, GK_WRONG=0.45;      // kaleci erişimi: ayakta / en çok uçuş / ters köşe
  const GK_DIVE_V=clamp(4.2+(oppStr-70)*0.04,3.6,5.2);      // kaleci uçuş hızı (m/sn)
  const G_ACC=9.8, AIR_K=0.006, MAG_SIDE=0.3, MAG_TOP=0.2, MAG_LIFT=0.04;
  const SIM_DT=1/120, SAMPLE_DT=1/30, SIM_MAX=3.4;
  // Tek adım (yerinde). s={x,y,z,vx,vy,vz,side,top}: y = yerden yükseklik (topun altı).
  //   side>0: topun SAĞINDAN vuruş → top sola kıvrılır (ivme hızın soluna, büyüklük ∝ hız)
  //   top>0: üstünden (ileri dönüş) → aşağı Magnus (düşen vuruş) · top<0: altından → hafif kaldırma
  const stepBall=(s,dt)=>{
    const v=Math.hypot(s.vx,s.vy,s.vz);
    let ax=-AIR_K*v*s.vx, ay=-G_ACC-AIR_K*v*s.vy, az=-AIR_K*v*s.vz;
    if(s.side){ ax+=s.side*MAG_SIDE*s.vz; az-=s.side*MAG_SIDE*s.vx; }
    if(s.top>0) ay-=MAG_TOP*s.top*v; else if(s.top<0) ay+=MAG_LIFT*(-s.top)*v;
    s.vx+=ax*dt; s.vy+=ay*dt; s.vz+=az*dt;
    s.x+=s.vx*dt; s.y+=s.vy*dt; s.z+=s.vz*dt;
    if(s.y<=0){
      s.y=0;
      if(s.vy<-1.5){ s.vy=-s.vy*0.5; s.vx*=0.8; s.vz*=0.8; s.side*=0.5; s.top*=0.5; } // sekme
      else s.vy=0;
    }
    if(s.y===0&&s.vy===0){ // yuvarlanma: sürtünme, dönüş söner
      const sp=Math.hypot(s.vx,s.vz);
      if(sp>0){ const ns=Math.max(0,sp-3.2*dt); s.vx*=ns/sp; s.vz*=ns/sp; }
      s.side*=0.95; s.top=0;
    }
  };
  // Küre–nokta çarpışması: top merkezi (qx,qy,qz)'ye R'den yakınsa dışarı itilir ve seker (e: esneklik)
  const bounceOff=(s,qx,qy,qz,R,e)=>{
    const cy=s.y+BALL_R, nx=s.x-qx, ny=cy-qy, nz=s.z-qz, d=Math.hypot(nx,ny,nz);
    if(!(d<R)||d<1e-6) return false;
    const ux=nx/d, uy=ny/d, uz=nz/d;
    s.x=qx+ux*R; s.z=qz+uz*R; s.y=Math.max(0,qy+uy*R-BALL_R);
    const vn=s.vx*ux+s.vy*uy+s.vz*uz;
    if(vn<0){ s.vx-=(1+e)*vn*ux; s.vy-=(1+e)*vn*uy; s.vz-=(1+e)*vn*uz; s.side*=0.3; s.top*=0.3; }
    return true;
  };
  // Hedefe (tx,tz) yatay mesafede ty yüksekliğiyle varacak çıkış hızı: kavis (Magnus) ve
  //   yerçekimi hesaba katılarak yön açısı + dikey hız yinelemeyle bulunur (Magnus eğrisi
  //   hedefte biter; kavis başta dışa açılıp içe kıvrılır).
  const solveS={x:0,y:0,z:0,vx:0,vy:0,vz:0,side:0,top:0};
  const solveLaunch=(x0,z0,y0,tx,tz,ty,speed,side,top)=>{
    const dx=tx-x0, dz=tz-z0, S=Math.hypot(dx,dz)||1, ux=dx/S, uz=dz/S;
    const T0=S/Math.max(4,speed);
    let ang=0, vy=(ty-y0+0.5*G_ACC*T0*T0)/T0;
    const s=solveS;
    for(let it=0;it<8;it++){
      const ca=Math.cos(ang), sa=Math.sin(ang);
      s.x=x0; s.y=y0; s.z=z0; s.vx=(ux*ca-uz*sa)*speed; s.vy=vy; s.vz=(ux*sa+uz*ca)*speed; s.side=side; s.top=top;
      let t=0, prog=0;
      while(t<4&&prog<S){
        stepBall(s,SIM_DT); t+=SIM_DT; prog=(s.x-x0)*ux+(s.z-z0)*uz;
        if(Math.hypot(s.vx,s.vz)<1) break;
      }
      if(prog<S*0.98) break;                      // hedefe ulaşamıyor: son tahminle bırak
      const lat=(s.x-x0)*(-uz)+(s.z-z0)*ux;       // + = hedef çizgisinin sağı
      if(Math.abs(lat)<0.04&&Math.abs(ty-s.y)<0.04) break;
      ang=clamp(ang-Math.atan2(lat,S),-0.9,0.9);
      vy=clamp(vy+(ty-s.y)/Math.max(0.25,t),-2,22);
    }
    const ca=Math.cos(ang), sa=Math.sin(ang);
    return {vx:(ux*ca-uz*sa)*speed,vy,vz:(ux*sa+uz*ca)*speed};
  };
  // Vuruş gücü + seçilen vuruş noktası → hız / hedef yükseklik / dikey dönüş
  const shotLaunch=(power)=>{
    const lift=Math.max(0,-spin.y), top=Math.max(0,spin.y);
    // Kale çizgisinde topun ALTI (m): en çok ~1.15 → topun üstü (çap 2·BALL_R) üst direğin altında
    let ty=0.5+lift*0.7-top*0.35;
    if(power>88) ty+=(power-88)*0.12;               // aşırı güç: üstten auta gider
    const speed=(13+clamp(power,0,100)*0.19)*(1-0.4*lift)*(1+0.08*top);
    return {ty:Math.max(0.05,ty),speed,top:spin.y};
  };
  const fxEvent=(e)=>{
    if(e.type==="block") actors.ringFx(e.x,e.z,0xe74c3c,0.7,4);
    else if(e.type==="post"){ actors.shakeGoal(1); actors.ringFx(e.x,e.z,0xffffff,0.6,3); }
    else if(e.type==="save") actors.ringFx(e.x,e.z,0xffffff,0.6,3);
    else if(e.type==="goal") actors.goalFx(1,e.z,"home");
  };
  // Engeller: tüm saha oyuncuları (vuran ve skip hariç) — vuruş anındaki yerleriyle.
  //   Başlangıçta topla iç içe olan (topun dibindeki) oyuncu, top ondan ayrılana dek yok sayılır.
  //   moved (isteğe bağlı Map ajan→{x,z}): o ana dek yeni yerine gidecek oyuncu (hava topu düellosu)
  //   noIgn: iç içe olan da engel sayılır (kafa vuruşu: kaybedilen düellodaki markajcı)
  const buildBlockers=(x0,y0,z0,skip,moved,noIgn)=>{
    const out=[], R=BODY_R+BALL_R, cy=y0+BALL_R;
    const add=(a)=>{
      if(!a||a.kind==="gk") return;
      const p=moved&&moved.get(a), ax=p?p.x:a.x, az=p?p.z:a.z;
      const d=Math.hypot(x0-ax,cy-clamp(cy,BODY_Y0,BODY_Y1),z0-az);
      out.push({a,x:ax,z:az,ign:!noIgn&&d<R+0.05});
    };
    for(let i=0;i<away.length;i++) add(away[i]);
    for(let i=0;i<home.length;i++) if(i!==ctl&&i!==skip) add(home[i]);
    return out;
  };
  // Oyuncu kapsülleri (baraj + saha oyuncuları): gövde/kafa → top seker. İlk temas ev'e yazılır.
  const hitBodies=(s,blk,t,ev)=>{
    const R=BODY_R+BALL_R;
    for(let i=0;i<blk.length;i++){
      const b=blk[i], cy=s.y+BALL_R, qy=clamp(cy,BODY_Y0,BODY_Y1);
      if(b.ign){ if(Math.hypot(s.x-b.x,cy-qy,s.z-b.z)>=R+0.05) b.ign=false; continue; }
      if(bounceOff(s,b.x,qy,b.z,R,0.4)){
        s.vz+=(Math.random()*2-1)*1.5; s.top=0;
        if(!ev.some(e=>e.type==="block")) ev.push({t,type:"block",x:s.x,z:s.z});
      }
    }
  };
  // Vuruş anında saha oyuncuları yerinde durur: simülasyonun kullandığı konumlar = ekrandaki konumlar
  const freezeField=(skip,moved)=>{
    for(let i=0;i<away.length;i++){ const a=away[i]; if(a.kind==="gk"||(moved&&moved.has(a))) continue; override(a,a.x,a.z,0); a.vx=0; a.vz=0; }
    for(let i=0;i<home.length;i++){ const a=home[i]; if(i===ctl||i===skip||a.kind==="gk") continue; override(a,a.x,a.z,0); a.vx=0; a.vz=0; }
  };
  // Örnekler → top senaryosu bacakları; olay efektleri o karede, son bacakta onEnd
  // Şut oynatma hızı: yörünge gerçek fizikle (≈22–32 m/sn) hesaplanır ama ekranda %60 hızlı
  //   oynatılır (zaman sıkıştırma). Fizikte hızı ×1.6 yapmak yörüngeyi düzleştirip topun baraj
  //   üstünden düşmesini imkânsız kılıyordu; sıkıştırmada sonuç aynı, top kaleye 1.6× hızlı gider.
  const SHOT_PLAY_K=1.6;
  const toLegs=(smp,ev,onEnd,k=1)=>{
    const evs=ev.slice().sort((a,b)=>a.t-b.t), legs=[];
    let ei=0;
    for(let i=1;i<smp.length;i++){
      const p=smp[i], q=smp[i-1], fns=[];
      while(ei<evs.length&&evs[ei].t<=p.t+1e-6) fns.push(evs[ei++]);
      const last=i===smp.length-1;
      legs.push({x:p.x,z:p.z,y:p.y,h:0,dur:Math.max(0.005,(p.t-q.t)/k),
        fn:(fns.length||last)?()=>{ fns.forEach(fxEvent); if(last&&onEnd) onEnd(); }:null});
    }
    return legs;
  };
  // o: {x,z,y, tz (kale çizgisinde hedef z), ty, speed, side, top, success (zar), skip (vurucu
  //   home indeksi)} → {kind, goal, play()} · kind: goal | save | post | wide | block
  //   Saha oyuncuları vuruş anındaki yerlerinde sabitlenir (freezeField), kaleci modeli ayrı.
  const physShot=(o)=>{
    const x0=o.x, z0=o.z, y0=Number.isFinite(o.y)?o.y:0;
    const lv=solveLaunch(x0,z0,y0,L,o.tz,o.ty,o.speed,o.side||0,o.top||0);
    const blk=buildBlockers(x0,y0,z0,o.skip,o.moved,!!o.header);
    const gkx=gk?gk.x:L, gkz=gk?gk.z:0;
    const plan={correct:!o.success,react:o.success?0.3+Math.random()*0.1:(isPen?0.03:0.12+Math.random()*0.06),
      t:NaN,cz:NaN,cy:NaN,reach:GK_STAND};
    const s={x:x0,y:y0,z:z0,vx:lv.vx,vy:lv.vy,vz:lv.vz,side:o.side||0,top:o.top||0};
    const smp=[{x:x0,y:y0,z:z0,t:0}], ev=[];
    let t=0, nextS=SAMPLE_DT, endT=SIM_MAX, goal=false, inNet=false, held=null, gkDone=!gk||x0>=gkx-0.1;
    while(t<endT){
      const px=s.x;
      if(held){
        // Kaleci tuttu: top ellerde, göğse iner
        t+=SIM_DT; s.vx=s.vy=s.vz=0;
        s.x=held.x-0.5; s.z=held.z; s.y=Math.max(0.6,held.y-BALL_R-(t-held.t)*2.5);
      } else {
        stepBall(s,SIM_DT); t+=SIM_DT;
        hitBodies(s,blk,t,ev);
        // Direkler (dikey) + üst direk (yatay): seker, gol yine olabilir
        const cy2=s.y+BALL_R;
        let hitPost=false;
        if(!inNet) for(let k=-1;k<=1;k+=2) if(bounceOff(s,L,clamp(cy2,0,GH),k*GW,POST_R+BALL_R,0.6)) hitPost=true;
        if(!inNet&&bounceOff(s,L,GH,clamp(s.z,-GW,GW),POST_R+BALL_R,0.6)) hitPost=true;
        if(hitPost&&!ev.some(e=>e.type==="post")) ev.push({t,type:"post",x:s.x,z:s.z});
        // Kaleci: top kaleci düzlemini geçerken erişim alanı kontrolü
        if(!gkDone&&px<gkx-0.1&&s.x>=gkx-0.1){
          gkDone=true;
          const by=s.y+BALL_R, dz=s.z-gkz;
          const d=Math.abs(dz)+Math.max(0,by-2.6)*0.6;   // üst köşe biraz daha uzak
          const reach=plan.correct?GK_STAND+clamp(GK_DIVE_V*(t-plan.react),0,GK_DIVE_MAX):GK_WRONG;
          plan.t=t; plan.cz=s.z; plan.cy=by; plan.reach=reach;
          if(by<GH+1.2&&d<=reach){
            const sp=Math.hypot(s.vx,s.vy,s.vz);
            ev.push({t,type:"save",x:s.x,z:s.z});
            if(sp<21&&d<1.6&&by<2.6){ held={t,x:s.x,z:s.z,y:by}; endT=t+0.9; }   // tuttu
            else {                                                              // çeldi: yana/dışarı
              s.vx=-Math.abs(s.vx)*0.25; s.vy=Math.abs(s.vy)*0.3+2.5;
              s.vz=sgn(dz||s.z||1)*Math.max(5,sp*0.35); s.side=0; s.top=0;
            }
          }
        }
        // Kale çizgisi: top tamamen çerçevenin içindeyse gol; ağ topu tutar
        if(!inNet&&px<L&&s.x>=L){
          if(Math.abs(s.z)<GW&&s.y+BALL_R<GH){ inNet=true; if(!goal){ goal=true; ev.push({t,type:"goal",z:s.z}); } endT=Math.min(endT,t+0.7); }
          else endT=Math.min(endT,t+0.5);
        }
        if(inNet){
          const back=L+D.goalDepth-BALL_R;
          if(s.x>back){ s.x=back; s.vx=-s.vx*0.15; s.vz*=0.4; s.vy*=0.5; s.side=0; }
          if(Math.abs(s.z)>GW-BALL_R){ s.z=sgn(s.z)*(GW-BALL_R); s.vz=-s.vz*0.2; }
          if(s.y+BALL_R>GH-0.05){ s.y=GH-0.05-BALL_R; if(s.vy>0) s.vy=-s.vy*0.2; }
        }
      }
      if(t>=nextS){ smp.push({x:s.x,y:s.y,z:s.z,t}); nextS+=SAMPLE_DT; }
      if(Math.abs(s.x)>L+4||Math.abs(s.z)>H+3) break;
      if(!held&&s.y===0&&Math.hypot(s.vx,s.vz)<0.6&&t>0.3) break;
    }
    if(smp[smp.length-1].t<t) smp.push({x:s.x,y:s.y,z:s.z,t});
    let kind="wide";
    if(goal) kind="goal";
    else { const f=ev.find(e=>e.type!=="goal"); if(f) kind=f.type; }
    const play=()=>{
      freezeField(o.skip,o.moved);
      if(gk){
        override(gk,gk.x,gk.z,0); gk.vx=0; gk.vz=0;
        {
          // Kaleci şut anında (tepki süresiyle) yatay dalışla uçar: doğru okursa topun / tahmin
          //   noktasının tarafına (erişim içindeyse kurtarır), ters köşeye aldanırsa öbür yana.
          //   Top kaleciye ulaşmadan sekse bile (plan.t yok) hedef noktaya doğru uçar.
          const saved=ev.some(e=>e.type==="save");
          const cz=Number.isFinite(plan.cz)?plan.cz:clamp(o.tz,-GW,GW), cy=Number.isFinite(plan.cy)?plan.cy:1.2;
          const tc=Number.isFinite(plan.t)?plan.t:0.6;
          const dz=cz-gkz, sd=sgn(dz||(Math.random()-0.5)), ad=Math.abs(dz);
          const tDive=plan.correct||saved?clamp(Math.min(plan.react,tc-0.25),0,0.2):0.06;
          // Barajda/yolda kesilen şutta (kaleciye hiç gelmez) kaleci uçmaz, yerinde izler.
          //   Dalış animasyonu da top oynatmasıyla aynı oranda (SHOT_PLAY_K) hızlanır.
          // Dalış hızı: tam uzanma (animasyonun %45'i) topun ekranda kaleciye vardığı ana denk gelir
          const dk=clamp(0.45*RIG3D_ACT_DUR.dive/Math.max(0.12,(tc-tDive)/SHOT_PLAY_K),1,3);
          if(kind!=="block") later(tDive/SHOT_PLAY_K,()=>{
            if(saved||plan.correct){
              const rz=saved?cz:gkz+sd*Math.min(ad,plan.reach);
              if(ad>0.6){ override(gk,gk.x,rz-sd*Math.min(1.9,Math.abs(rz-gkz)*0.8),13); actors.diveFx("away",gk.idx,gkx,rz,cy,dk); }
              else override(gk,gk.x,rz,6);                       // tam üstüne: ayakta tutar
            } else {
              override(gk,gk.x,gkz-sd*0.6,7); actors.diveFx("away",gk.idx,gkx,gkz-sd*2.2,1.0,dk); // ters köşe
            }
          });
        }
      }
      actors.playBallScript(toLegs(smp,ev,()=>finishSoon(goal?1.3:0.9),SHOT_PLAY_K),0);
    };
    return {kind,goal,play};
  };
  // Kafa vuruşu (orta sonrası): iniş noktasından kaleye, fizikle önceden simüle edilir
  //   Başarılı zarda kafayı vuran açık köşeyi seçer: kaleciden uzak ve yoldaki gövdelerden
  //   (kapsül + pay) temiz geçen hedef; başarısızda gelişigüzel (gövdeye/kaleciye gidebilir).
  const headerShot=(lx,lz,ly,mi,success,moved)=>{
    const g=gkAt();
    let aimZ=(Math.random()*2-1)*GW*0.6;
    if(success){
      const bl=buildBlockers(lx,ly,lz,mi,moved), R=BODY_R+BALL_R+0.2;
      let best=-1e9;
      for(let z=-(GW-0.6);z<=GW-0.6+1e-6;z+=0.3){
        const dx=L-lx, dz=z-lz, l2=dx*dx+dz*dz||1;
        let clear=9;
        for(let i=0;i<bl.length;i++){
          const b=bl[i]; if(b.ign) continue;
          const u=clamp(((b.x-lx)*dx+(b.z-lz)*dz)/l2,0,1);
          clear=Math.min(clear,Math.hypot(b.x-(lx+dx*u),b.z-(lz+dz*u)));
        }
        const sc=(clear>=R?2:0)+Math.min(clear,R)*0.3+Math.abs(z-g.z)*0.35+Math.random()*0.2;
        if(sc>best){ best=sc; aimZ=z; }
      }
    }
    return physShot({x:lx,z:lz,y:ly,tz:aimZ,ty:0.3+Math.random()*0.9,speed:15+Math.random()*3,side:0,top:0.3,
      success,skip:mi,moved,header:true});
  };
  // ORTA (fizik): toptan iniş noktasına havadan; yoldaki savunmacının kapsülüne çarparsa
  //   uzaklaştırılır (block), çarpmazsa kafa vuruşu topun vardığı yerden simüle edilir.
  //   Saha oyuncuları orta anında sabitlenir; yalnız kafayı vuracak arkadaş inişe koşar.
  //   side/top: vuruş noktası (kavis / yükseklik) → {kind, goal, play()}
  const physCross=(lx,lz,mi,success,side,top)=>{
    if(gk){ override(gk,gk.x,gk.z,0); gk.vx=0; gk.vz=0; }
    freezeField(mi);
    const x0=B.x, z0=B.z, y0=B.y||0;
    const d=Math.hypot(lx-x0,lz-z0)||1, ux=(lx-x0)/d, uz=(lz-z0)/d, T=clamp(d/19,0.8,2.2);
    const lv=solveLaunch(x0,z0,y0,lx,lz,2.0,d/T,side||0,top||0);
    const blk=buildBlockers(x0,y0,z0,mi);
    const s={x:x0,y:y0,z:z0,vx:lv.vx,vy:lv.vy,vz:lv.vz,side:side||0,top:top||0};
    const smp=[{x:x0,y:y0,z:z0,t:0}], ev=[];
    let t=0, nextS=SAMPLE_DT, endT=4, arrived=false;
    while(t<endT){
      stepBall(s,SIM_DT); t+=SIM_DT;
      hitBodies(s,blk,t,ev);
      const blocked=ev.length>0;
      if(blocked&&endT>t+1.4) endT=t+1.4;            // uzaklaştırılan top bir süre daha seker
      if(!blocked&&(s.x-x0)*ux+(s.z-z0)*uz>=d){ arrived=true; break; }
      if(t>=nextS){ smp.push({x:s.x,y:s.y,z:s.z,t}); nextS+=SAMPLE_DT; }
      if(Math.abs(s.x)>L+4||Math.abs(s.z)>H+3) break;
      if(s.y===0&&Math.hypot(s.vx,s.vz)<0.6&&t>0.3) break;
    }
    smp.push({x:s.x,y:s.y,z:s.z,t});
    const m=home[mi];
    if(m) override(m,s.x-0.4,s.z,Math.max(4,Math.hypot(m.x-s.x,m.z-s.z)/Math.max(0.5,t)*1.05)); // kafa noktasına koş
    // Hava topu düellosu (zar): kazanılırsa kafa noktasındaki markajcı (≤2.6 m) kafa hattının
    //   dışına itilir (o konumla simüle edilir → içinden geçilmez); kaybedilirse yerinde kalır
    //   ve kafa vuruşu gövdesine çarpar (uzaklaştırma).
    let moved=null;
    if(arrived&&success){
      const hx=L-s.x, hz=-s.z, hl=Math.hypot(hx,hz)||1, nx=-hz/hl, nz=hx/hl;
      for(let i=0;i<away.length;i++){
        const a=away[i]; if(a.kind==="gk") continue;
        if(Math.hypot(a.x-s.x,a.z-s.z)>2.6) continue;
        const lat=(a.x-s.x)*nx+(a.z-s.z)*nz, k=sgn(lat||1), need=BODY_R+BALL_R+0.9-Math.abs(lat);
        if(need<=0) continue;
        const p={x:clamp(a.x+nx*k*need,-L+0.5,L-0.5),z:clamp(a.z+nz*k*need,-H+0.5,H-0.5)};
        (moved||(moved=new Map())).set(a,p); override(a,p.x,p.z,6);
      }
    }
    const hd=arrived?headerShot(s.x,s.z,s.y,mi,success,moved):null;
    return {kind:hd?hd.kind:(ev.length?"block":"wide"),goal:!!(hd&&hd.goal),
      play:()=>actors.playBallScript(toLegs(smp,ev,()=>{ if(hd) hd.play(); else finishSoon(0.8); }),0)};
  };

  // ── Eylemler ──
  const canAct=()=>!outcome&&(phase==="play"||phase==="set"||phase==="strike");
  const startPlay=()=>{
    if(phase!=="set") return;
    phase="play"; wallUp=false; spin.x=0; spin.y=0; // vuruş noktası yalnız duran topun ilk vuruşu için
    for(let i=0;i<away.length;i++) if(away[i].kind==="wall") away[i].kind="def";
    hud();
  };

  // recv (isteğe bağlı): ara pası — alıcı bu takım arkadaşı, top tam (wx,wz) boş alanına
  //   toMate=true ile recv: o takım arkadaşının kendisine (öngörülü) pas — dokunulan arkadaş
  const passTo=(wx,wz,loft,recv,toMateForce)=>{
    if(!canAct()||phase==="strike"||isTackle||isPen||!Number.isFinite(wx)||!Number.isFinite(wz)) return false;
    // Tıklanan noktaya ≤5 m takım arkadaşı varsa ona (öngörülü), yoksa boş alana
    let ri=-1, rd=1e9;
    const forced=Number.isInteger(recv)&&recv!==ctl&&home[recv]&&home[recv].kind!=="gk";
    if(forced){ ri=recv; rd=toMateForce?Math.hypot(home[recv].x-wx,home[recv].z-wz):99; }
    else for(let i=0;i<home.length;i++){ const a=home[i]; if(i===ctl||a.kind==="gk") continue; const d=Math.hypot(a.x-wx,a.z-wz); if(d<rd){ rd=d; ri=i; } }
    if(ri<0) return false;
    const r=home[ri], toMate=forced?!!toMateForce:rd<5;
    let px=toMate?r.x:wx, pz=toMate?r.z:wz;
    let d=Math.hypot(px-B.x,pz-B.z);
    if(d<2.5){ flash("Pas için daha uzağa dokun"); return false; }
    let lofted=!!loft||d>22;
    if(!lofted){
      // Yol üstünde (2 m) rakip → havadan
      const dx=px-B.x, dz=pz-B.z, l2=dx*dx+dz*dz;
      for(let i=0;i<away.length&&!lofted;i++){
        const a=away[i]; const u=((a.x-B.x)*dx+(a.z-B.z)*dz)/l2;
        if(u>0.12&&u<0.9&&Math.hypot(a.x-(B.x+dx*u),a.z-(B.z+dz*u))<2) lofted=true;
      }
    }
    if(toMate){ // öngörülü hedef: alıcının hızına göre (iki yineleme)
      for(let k=0;k<2;k++){
        const T=lofted?Math.max(1.05,clamp(0.75+d*0.03,0.9,2.4)/Math.sqrt(MOMENT3D_PASS_SPEED)):d/12/MOMENT3D_PASS_SPEED; // kickTo ile aynı oran
        px=r.x+r.vx*Math.min(T,1.2); pz=r.z+r.vz*Math.min(T,1.2);
        d=Math.hypot(px-B.x,pz-B.z);
      }
    }
    px=clamp(px,-L+1,L-1); pz=clamp(pz,-H+1,H-1);
    // Kesilme olasılığı: rota riski + (boş alana pasta) alıcının rakipten önce varma şansı
    shotPts[0].x=B.x; shotPts[0].z=B.z; shotPts[1].x=px; shotPts[1].z=pz;
    const rr=moment3dRouteRisk(shotPts,buildRisk(1,0.5),lofted,2);
    const tR=Math.hypot(r.x-px,r.z-pz)/VMAX_RUN;
    let tD=1e9; for(let i=0;i<away.length;i++){ const a=away[i]; if(a.kind==="gk"||a===att) continue; tD=Math.min(tD,Math.hypot(a.x-px,a.z-pz)/VMAX_DEF); }
    const recvPen=toMate?clamp((rd-2)*0.01,0,0.03):clamp((tR-tD+0.6)*0.25,0,0.5);
    const pCut=clamp(rr.risk*MOMENT3D_PASS_CUT+recvPen,0,0.9);
    const cut=Math.random()<pCut;
    if(phase==="set") startPlay();
    showDots(B.x,B.z,px,pz,lofted);
    const fromA=ctlA(); fromA.ax=fromA.x; fromA.az=fromA.z; fromA.vx*=0.3; fromA.vz*=0.3;
    const T=actors.kickTo(px,pz,lofted,MOMENT3D_PASS_SPEED);   // seri, keskin pas (%80 hızlı)
    passes++; phase="pass"; spin.x=0; spin.y=0; passMode=false;
    passInfo.r=ri; passInfo.px=px; passInfo.pz=pz; passInfo.T=T; passInfo.t=0; passInfo.cut=cut; passInfo.lofted=lofted;
    passInfo.cutter=-1;
    if(cut){
      let ag=rr.idx>=0?riskAgent(rr.idx):null, cx=rr.x, cz=rr.z, u=rr.u;
      if(!ag||lofted){ // havadan: iniş noktasına en yakın rakip
        let bd=1e9; for(let i=0;i<away.length;i++){ const a=away[i]; if(a===att) continue; const dd=Math.hypot(a.x-px,a.z-pz); if(dd<bd){ bd=dd; ag=a; } }
        cx=px; cz=pz; u=1;
      }
      passInfo.cutter=ag?away.indexOf(ag):-1; passInfo.cx=cx; passInfo.cz=cz;
      passInfo.tc=lofted?T:T*clamp(u,0.15,1)*0.85;
      if(passInfo.cutter<0) passInfo.cut=false;
    }
    hud();
    return true;
  };

  const strike=(dx,dz,power,curl)=>{
    if(!canAct()) return false;
    const l=Math.hypot(dx,dz); if(!(l>1e-4)) return false;
    dx/=l; dz/=l;
    power=clamp(Number(power)||0,0,100); curl=clamp(Number(curl)||0,-0.6,0.6);
    if(isTackle) return block(power);
    // Kavis (vc>0 → top sağa kıvrılır) = parmak bükmesi (bot API'si) − vuruş noktası (spin.x):
    //   Magnus: topun sağından vuruş sola, solundan vuruş sağa kıvırır.
    //   ax/az: kavisli yolun çıkış ekseni (orta yayı ve evalShot rota riski için)
    const vc=clamp(curl-spin.x*MOMENT3D_SPIN_CURL,-0.6,0.6);
    const side=clamp(-vc/MOMENT3D_SPIN_CURL,-1,1);   // physShot: + = sola kavis
    const ca=Math.cos(-vc), sa=Math.sin(-vc);
    const ax=dx*ca-dz*sa, az=dx*sa+dz*ca;
    const c=classify(B.x,B.z,dx,dz,power);
    if(c.kind==="lpass"){
      if(isPen){ flash("Penaltıda kaleye doğru geri çek"); return false; }
      return passTo(c.lx,c.lz,true);
    }
    const a=ctlA();
    const name=a.name||pname;
    if(c.kind==="cross"){
      const ev=evalCross(c.lx,c.lz);
      const key=passes>0?"pass_cross":"cross";
      const rl=roll(key,power,ev.q,false);
      const m=home[ev.mate]||a;
      const hName=m.name||pname;
      // Orta + kafa vuruşu fizikle: yoldaki savunmacıya çarparsa uzaklaştırma, değilse
      // kafa vuruşu (kaleci/direk/aut fizikten); zar yalnız kalecinin okumasını belirler
      const cr=physCross(c.lx,c.lz,ev.mate,rl.success,side,spin.y*0.5);
      emit(mk(cr.goal,key,cr.kind,hName,power,ev.q,rl.chance,cr.goal,false));
      cr.play();
      return true;
    }
    // Şut: aşırı güç (>90, kırmızı) isabetsiz → sapma (zardan önce, kaliteye yansır)
    let zHit=c.zHit;
    if(power>90) zHit+=(Math.random()*2-1)*(power-88)*0.35;
    const ev=evalShot(B.x,B.z,ax,az,zHit,Math.abs(curl),wallUp?0.18:1); // parmak bükmesi; kenar vuruşu evalShot içinde (spin.x)
    let key=passes>0?"pass_shot":"shot";
    if(isPen) key=power>80?"power":"shot"; // güçlü vuruş seçeneği yalnız yeşil bölgenin üstünde (tatlı bölge avantajı olmasın)
    if(type==="oneonone"&&passes===0&&carried>6) key="carry";
    const rl=roll(key,power,ev.q,false);
    // Sonuç FİZİKTEN: baraj/oyuncu kapsülü → block, direk → post, kaleci erişimi → save,
    // çerçeve dışı → wide; yalnız kalecinin yetişemediği yerden çizgiyi geçen top gol
    const ln=shotLaunch(power);
    const sh=physShot({x:B.x,z:B.z,y:B.y,tz:zHit,ty:ln.ty,speed:ln.speed,side,top:ln.top,success:rl.success});
    const actName=key==="power"||key==="carry"?"shot":key;
    emit(mk(sh.goal,actName,sh.kind,name,power,ev.q,rl.chance,sh.goal,false));
    a.vx*=0.2; a.vz*=0.2;
    sh.play();
    return true;
  };
  // ── Vuruş ekranı: kırmızı ok bırakıldı → zaman durur, kamera çim seviyesine iner,
  //    kullanıcı büyük topun bir noktasına dokunur (confirmStrike) → vuruş. ──
  const strikeLow={on:false,cross:false};    // vuruştan sonra da alçak kamera (şutta)
  let strikeSnap=false;                      // vuruş ekranının ilk karesi: kamera geçişsiz atlar
  //   force=true (ŞUT düğmesi): tür her zaman şut (classify forceShot), confirmStrike'a taşınır
  const beginStrike=(dx,dz,power,force)=>{
    if(!canAct()||phase==="strike"||isTackle) return false;
    const l=Math.hypot(dx,dz); if(!(l>1e-4)) return false;
    dx/=l; dz/=l; power=clamp(Number(power)||0,0,100);
    forceShot=!!force;
    let c=classify(B.x,B.z,dx,dz,power);
    // Vuruş HER durumda vuruş ekranına geçer; penaltıda uzun pas yönü kaleye yönlendirilir.
    if(c.kind==="lpass"&&(isPen||forceShot)){
      const gx=Math.max(1,L-B.x), gz=clamp(B.z,-(GW-1.2),GW-1.2)-B.z, gl=Math.hypot(gx,gz)||1;
      dx=gx/gl; dz=gz/gl;
      c=classify(B.x,B.z,dx,dz,power);
    }
    forceShot=false;
    pend.on=true; pend.dx=dx; pend.dz=dz; pend.power=power; pend.kind=c.kind; pend.t=0; pend.prev=phase; pend.force=!!force;
    if(c.kind==="shot"){ pend.tx=L; pend.tz=clamp(c.zHit,-GW-2,GW+2); } else { pend.tx=c.lx; pend.tz=c.lz; }
    drib.on=false; spin.x=0; spin.y=0; passMode=false; aim.on=false; draw.on=false;
    const a=ctlA(); a.vx=0; a.vz=0;
    // Top ayak kilidinden çözülür (vuruş anına dek yerinde durur); vurucu KAMERANIN ARKASINA
    // alınır (topun 3.3 m gerisi) → çim seviyesi kamera topun hemen arkasında, görüş açık.
    // Vuruş onaylanınca (confirmStrike) vurucu topun sol-arkasına adım atar ve vurur.
    const own=actors.getOwner();
    pend.owned=!!(own&&own.team==="home"&&own.i===a.idx);
    if(pend.owned) actors.setOwner(null);
    let ux=pend.tx-B.x, uz=pend.tz-B.z; const ul=Math.hypot(ux,uz)||1; ux/=ul; uz/=ul;
    a.x=clamp(B.x-ux*3.3+uz*0.6,-L-2.5,L+2.5); a.z=clamp(B.z-uz*3.3-ux*0.6,-H-2.5,H+2.5);
    actors.movePlayer("home",a.idx,a.x,a.z,true);
    hideAim(); dots.visible=false;
    strikeSnap=true;                         // kuşbakışından geçişsiz (kesin) çim seviyesine
    phase="strike"; hud();
    return true;
  };
  // (sx,sy): topun üzerindeki nokta, −1…1 (x>0 sağ kenar, y>0 üst). Merkeze yakın = düz.
  const confirmStrike=(sx,sy)=>{
    if(phase!=="strike"||!pend.on||outcome) return false;
    let x=Number(sx)||0, y=Number(sy)||0; const l=Math.hypot(x,y);
    if(l>1){ x/=l; y/=l; }
    if(l<0.2){ x=0; y=0; }
    spin.x=x; spin.y=y;
    pend.on=false; phase=pend.prev==="set"?"set":"play";
    strikeLow.on=true; strikeLow.cross=pend.kind!=="shot"; // orta / uzun pas: top inince kuşbakışı
    { // vurucu topun sol-arkasına (vuruş animasyonu için ≤2.2 m)
      const a=ctlA(); let ux=pend.tx-B.x, uz=pend.tz-B.z; const ul=Math.hypot(ux,uz)||1; ux/=ul; uz/=ul;
      a.x=clamp(B.x-ux*1.0+uz*0.8,-L-2.5,L+2.5); a.z=clamp(B.z-uz*1.0-ux*0.8,-H-2.5,H+2.5); a.vx=0; a.vz=0;
      actors.movePlayer("home",a.idx,a.x,a.z,true);
    }
    unfadeAll();
    forceShot=!!pend.force;                  // strike() yeniden sınıflar: ŞUT düğmesi yine şut
    let ok=false;
    try{ ok=strike(pend.dx,pend.dz,pend.power,0); } finally { forceShot=false; }
    if(!ok){
      strikeLow.on=false; spin.x=0; spin.y=0;
      if(pend.owned) actors.setOwner("home",ctlA().idx);  // vuruş olmadı: top yine ayakta
      hud();
    }
    else if(strikeLow.cross) later(1.0,()=>{ strikeLow.on=false; }); // ortada top inince kuşbakışına dön
    return ok;
  };

  // ── Savunma (tackle) eylemleri ──
  const attackerFront=()=>{ // bizim savunmacı rakibin önünde/yanında mı?
    const c=ctlA(), sp=Math.hypot(att.vx,att.vz)||1;
    const dx=c.x-att.x, dz=c.z-att.z, d=Math.hypot(dx,dz)||1;
    return (dx*att.vx+dz*att.vz)/(d*sp)>-0.15;
  };
  const tackleAt=(wx,wz)=>{
    if(!isTackle||!canAct()||!att) return false;
    if(Number.isFinite(wx)&&Math.hypot(wx-att.x,wz-att.z)>4.5&&Math.hypot(wx-B.x,wz-B.z)>4.5){ flash("Müdahale için rakibe ya da topa dokun"); return false; }
    const c=ctlA(), d=dist(c,att);
    // Zamanlama/mesafe: 1.0–2.2 m ideal, 4.6 m'den uzak = boşa kayış; arkadan zayıf
    let q=d<=2.2?1-Math.max(0,1.0-d)*0.3:clamp(1-(d-2.2)/2.4,0,1);
    q*=attackerFront()?1:0.55;
    const power=clamp(25+q*55,0,100);
    const rl=roll("tackle",power,q,false);
    const conceded=!rl.success&&Math.random()>0.4; // 2D ile aynı olasılık
    emit(mk(rl.success,"tackle",rl.success?"ok":"fail",c.name||pname,power,q,rl.chance,false,conceded));
    animTackle("tackle",rl.success,conceded);
    return true;
  };
  const foul=(holdSec)=>{
    if(!isTackle||!canAct()||!att) return false;
    const c=ctlA(), d=dist(c,att);
    if(d>2.8){ flash("Faul için rakibe daha yakın ol"); return false; }
    const box=att.x<-L+16.5&&Math.abs(att.z)<D.penWidth/2;
    const q=clamp(1-(d-0.8)/2.2,0,1)*(box?0.4:1);   // ceza sahasında faul = penaltı riski
    const power=clamp(30+((Number(holdSec)||0)-0.4)*60,0,100);
    const rl=roll("foul",power,q,false);
    const conceded=!rl.success&&Math.random()>0.4;
    emit(mk(rl.success,"foul",rl.success?"ok":"fail",c.name||pname,power,q,rl.chance,false,conceded));
    animTackle("foul",rl.success,conceded);
    return true;
  };
  const block=(power)=>{
    if(!isTackle||!canAct()||!att) return false;
    const c=ctlA();
    // Şut yolu (rakip → kale merkezi) üzerinde, 2–7 m önde durmak ideal
    const lx=-L-att.x, lz=0-att.z, ll=Math.hypot(lx,lz)||1;
    const s=((c.x-att.x)*lx+(c.z-att.z)*lz)/ll;
    const pd=Math.abs((c.x-att.x)*lz-(c.z-att.z)*lx)/ll;
    const q=s<0?0:clamp(1-pd/2.5,0,1)*clamp(1-Math.abs(s-4)/5,0,1);
    const rl=roll("block",power,q,false);
    const conceded=!rl.success&&Math.random()>0.4;
    emit(mk(rl.success,"block",rl.success?"ok":"fail",c.name||pname,power,q,rl.chance,false,conceded));
    animTackle("block",rl.success,conceded);
    return true;
  };
  // Ayakta müdahale (beyaz/yeşil ok): savunmacı ok ucuna adım atıp topa ayak uzatır.
  //   İdeal: ok ucu rakibin ~0.25 sn sonraki konumunda, rakip ≤2.6 m'de ve önden.
  const standTackle=(ex,ez)=>{
    if(!isTackle||!canAct()||!att||!Number.isFinite(ex)||!Number.isFinite(ez)) return false;
    const c=ctlA();
    const px=att.x+att.vx*0.25, pz=att.z+att.vz*0.25;
    const e=Math.hypot(ex-px,ez-pz), d=Math.hypot(c.x-px,c.z-pz);
    let q=clamp(1-Math.max(0,e-0.7)/2.0,0,1)*(d<=2.6?1:clamp(1-(d-2.6)/2.2,0.15,1));
    q*=attackerFront()?1:0.6;
    const power=clamp(25+q*55,0,100);
    const rl=roll("stand",power,q,false);
    const conceded=!rl.success&&Math.random()>0.4; // 2D ile aynı olasılık
    emit(mk(rl.success,"stand",rl.success?"ok":"fail",c.name||pname,power,q,rl.chance,false,conceded));
    animTackle("stand",rl.success,conceded,ex,ez);
    return true;
  };
  // Kayarak müdahale (kırmızı ok): ok yönünde ~ok boyu kadar kayar. Rakibin kayma
  //   süresindeki konumu ok çizgisine yakınsa iyi; arkadan gelip kaçırırsa faul riski.
  const slideTackle=(dx,dz,len)=>{
    if(!isTackle||!canAct()||!att) return false;
    const l=Math.hypot(dx,dz); if(!(l>1e-4)) return false;
    dx/=l; dz/=l;
    const c=ctlA();
    const reach=clamp(Number(len)||0,MOMENT3D_SLIDE_LEN,MOMENT3D_TACKLE_ARROW_MAX)+0.8;
    const T=clamp(reach/9,0.3,0.9), px=att.x+att.vx*T, pz=att.z+att.vz*T;
    const s=(px-c.x)*dx+(pz-c.z)*dz, p=Math.abs((px-c.x)*dz-(pz-c.z)*dx);
    let q=clamp(1-Math.max(0,p-0.5)/2.2,0,1)*(s<0?0:s>reach+0.5?clamp(1-(s-reach-0.5)/2,0,1):1);
    const front=attackerFront(); q*=front?1:0.55;
    const power=clamp(25+q*55,0,100);
    const rl=roll("tackle",power,q,false);
    const conceded=!rl.success&&Math.random()>0.4;
    const ex=clamp(c.x+dx*reach,-L+0.5,L-0.5), ez=clamp(c.z+dz*reach,-H+0.5,H-0.5);
    if(!rl.success&&!front&&Math.random()<0.6){
      emit(mk(false,"slide_foul","fail",c.name||pname,power,q,rl.chance,false,conceded));
      animTackle("slide_foul",false,conceded,ex,ez);
      return true;
    }
    emit(mk(rl.success,"tackle",rl.success?"ok":"fail",c.name||pname,power,q,rl.chance,false,conceded));
    animTackle("tackle",rl.success,conceded,ex,ez);
    return true;
  };
  const shootAtUs=(fromX,fromZ,conceded)=>{
    const gz=sgn(Math.random()-0.5)*GW*(0.3+Math.random()*0.4);
    const d=Math.hypot(-L-fromX,gz-fromZ), dur=clamp(d/26,0.3,0.8);
    if(conceded){
      if(myGk){ override(myGk,-(L-0.9),-gz*0.5,6); actors.diveFx("home",myGk.idx,-L,gz,1.0); }
      actors.playBallScript([
        {x:-(L+1.0),z:gz,y:1.0,h:0.4,dur,fn:()=>actors.goalFx(-1,gz,"away")},
        {x:-(L+1.6),z:gz,y:0,h:0.1,dur:0.25,fn:()=>finishSoon(1.3)},
      ],0);
    } else {
      if(myGk){
        const far=Math.abs(gz-myGk.z)>1.2;
        override(myGk,-(L-0.9),far?gz-sgn(gz-myGk.z)*Math.min(1.9,Math.abs(gz-myGk.z)*0.8):gz,9);
        if(far) actors.diveFx("home",myGk.idx,-L,gz,1.0);
      }
      actors.playBallScript([
        {x:-(L-0.9),z:gz,y:1.0,h:0.4,dur:dur+0.05,fn:()=>actors.ringFx(-(L-0.9),gz,0xffffff,0.6,3)},
        {x:-(L+1.5),z:sgn(gz)*(GW+3),y:0.3,h:1.6,dur:0.5,fn:()=>finishSoon(0.9)},
      ],0);
    }
  };
  // (ex,ez) isteğe bağlı: çizilen okun ucu (kaçan müdahalede savunmacı oraya gider)
  const foulAftermath=(ok,conceded)=>{
    actors.poseFx("away",att.idx,"fall",1.4); override(att,att.x,att.z,0);
    actors.setBall(B.x,B.z,0);
    actors.ringFx(B.x,B.z,0xffffff,0.55,3);
    later(0.22,()=>actors.ringFx(B.x,B.z,0xffffff,0.55,4.5));
    later(0.44,()=>actors.ringFx(B.x,B.z,0xf1c40f,0.7,6));
    if(ok){ finishSoon(1.5); return; }
    const tp=worldToPitch3D(B.x,B.z);
    actors.triggerEvent({type:"yellow",x:tp.x,y:tp.y,team:"me"});
    const fx=B.x, fz=B.z;
    later(1.1,()=>shootAtUs(fx,fz,conceded));
  };
  const animTackle=(act,ok,conceded,ex,ez)=>{
    const c=ctlA();
    const hasE=Number.isFinite(ex)&&Number.isFinite(ez);
    if(act==="stand"){
      // Ayakta: kısa adım + ayak uzatma
      const tx=att.x+att.vx*0.25, tz=att.z+att.vz*0.25;
      override(c,ok?tx:(hasE?ex:tx+sgn(c.z-tz)*1.2),ok?tz:(hasE?ez:tz),7.5);
      later(0.12,()=>actors.actionFx("home",c.idx,"poke",{tx:B.x,tz:B.z}));
      later(0.3,()=>{
        if(ok){
          actors.ringFx(B.x,B.z,0x1abc9c,0.8,5);
          override(att,att.x+0.4,att.z+0.4,1.5);
          actors.setBall(B.x,B.z,0);
          actors.playBallScript([{x:B.x+12,z:clamp(B.z+sgn(B.z||1)*8,-H+2,H-2),y:0,h:1.2,dur:0.8,fn:()=>finishSoon(0.8)}],0);
        } else {
          override(att,runW.x,runW.z,VMAX_ATT+0.8);
          attRunShoot(conceded);
        }
      });
      return;
    }
    if(act==="slide_foul"){
      // Arkadan kayma: rakibi biçer → faul
      override(c,att.x,att.z,10); actors.poseFx("home",c.idx,"slide",0.9);
      later(0.32,()=>foulAftermath(false,conceded));
      return;
    }
    if(act==="tackle"){
      // Kayarak müdahale: savunmacı rakibe (kaçarsa okun ucuna) doğru kayar
      const tx=att.x+att.vx*0.3, tz=att.z+att.vz*0.3;
      if(ok) override(c,tx,tz,10);
      else if(hasE) override(c,ex,ez,10);
      else override(c,tx+sgn(c.z-tz)*1.8,tz+1.2,10);
      actors.poseFx("home",c.idx,"slide",0.9);
      later(0.35,()=>{
        if(ok){
          actors.ringFx(B.x,B.z,0x1abc9c,0.8,5);
          actors.poseFx("away",att.idx,"fall",1.2); override(att,att.x+0.5,att.z+0.8,2);
          actors.setBall(B.x,B.z,0);
          actors.playBallScript([{x:B.x+14,z:clamp(B.z+sgn(B.z||1)*12,-H+2,H-2),y:0,h:3,dur:0.9,fn:()=>finishSoon(0.8)}],0);
        } else {
          override(att,runW.x,runW.z,VMAX_ATT+0.8);
          attRunShoot(conceded);
        }
      });
      return;
    }
    if(act==="foul"){
      override(c,att.x,att.z,7);
      later(0.3,()=>foulAftermath(ok,conceded));
      return;
    }
    if(act==="block"){
      override(c,c.x,c.z,0);
      later(0.25,()=>{
        actors.setBall(B.x,B.z,0);
        if(ok){
          actors.playBallScript([{x:c.x+0.6,z:c.z,y:0.8,h:0,dur:0.22,fn:()=>{
            actors.ringFx(c.x,c.z,0x1abc9c,0.8,5);
            actors.playBallScript([{x:c.x+10,z:clamp(c.z+sgn(c.z||1)*10,-H+2,H-2),y:0,h:4,dur:0.85,fn:()=>finishSoon(0.8)}],0);
          }}],0);
        } else shootAtUs(B.x,B.z,conceded);
      });
      return;
    }
    // timeout: rakip şut noktasına vardı
    if(ok){
      override(c,att.x-1,att.z,9); actors.poseFx("home",c.idx,"slide",0.9);
      later(0.25,()=>{
        actors.setBall(B.x,B.z,0);
        actors.playBallScript([{x:c.x+0.5,z:c.z,y:0.6,h:0,dur:0.18,fn:()=>{
          actors.ringFx(c.x,c.z,0x1abc9c,0.8,5);
          actors.playBallScript([{x:c.x+10,z:clamp(c.z+sgn(c.z||1)*10,-H+2,H-2),y:0,h:4,dur:0.85,fn:()=>finishSoon(0.8)}],0);
        }}],0);
      });
    } else later(0.2,()=>{ actors.setBall(B.x,B.z,0); shootAtUs(B.x,B.z,conceded); });
  };
  const attRunShoot=(conceded)=>{
    // Geçilen savunmacının ardından rakip şut noktasına koşup vurur
    let t=0;
    const tick=()=>{
      t+=0.1;
      if(Math.hypot(att.x-runW.x,att.z-runW.z)<2.5||t>2.5){ actors.setBall(B.x,B.z,0); shootAtUs(B.x,B.z,conceded); return; }
      later(0.1,tick);
    };
    later(0.1,tick);
  };

  // Süre doldu: en düşük kaliteyle otomatik eylem (hiç oynamamak ödüllenmez)
  const autoAction=()=>{
    if(outcome) return;
    if(phase==="strike"&&pend.on&&confirmStrike(0,0)) return; // vuruş ekranı bekliyorsa düz vur
    // Süre kırmızı ok çekilirken doldu: nişan boşa gitmesin, vuruş ekranına geç
    if(aim.on&&aim.mode==="kick"&&!isTackle&&!aim.cancel&&aim.power>3){
      aim.on=false; hideAim();
      if(beginStrike(aim.dx,aim.dz,aim.power)) return;
    }
    aim.on=false; hold.on=false; draw.on=false; drib.on=false;
    const a=ctlA(), name=a.name||pname;
    if(isTackle){
      const rl=roll("timeout",20,0,true);
      const conceded=!rl.success&&Math.random()>0.4;
      emit(mk(rl.success,"timeout",rl.success?"ok":"fail",name,20,0,rl.chance,false,conceded));
      animTackle("timeout",rl.success,conceded);
      return;
    }
    hurriedShot("timeout");
  };
  // Son an vuruşu kalitesi: bulunulan yerden kale ortasına vuruşun kalitesi, en çok 0.6 (terim ≤ 0)
  const lastShotQ=()=>{
    const dx=L-B.x, dz=-B.z, dl=Math.hypot(dx,dz)||1;
    const ev=evalShot(B.x,B.z,dx/dl,dz/dl,0,0);
    return Math.min(0.6,ev&&Number.isFinite(ev.q)?ev.q:0);
  };
  // Aceleci vuruş (süre doldu / son an): güç 20 (tatlı bölge dışı)
  const hurriedShot=(act)=>{
    if(outcome) return;
    const a=ctlA(), name=a.name||pname;
    // Süre dolması: sabit en kötü terim · son an vuruşu: konum kalitesine göre (en çok nötr)
    const rl=act==="last_shot"?roll("timeout",20,lastShotQ(),false):roll("timeout",20,0,true);
    if(type==="corner"&&phase==="set"){
      // Kornerde aceleci orta: golde kafayı vuran, aksi halde ortayı yapan oyuncu
      const lx=L-10, lz=0, ev=evalCross(lx,lz), m=home[ev.mate]||a;
      spin.x=0; spin.y=0;
      const cr=physCross(lx,lz,ev.mate,rl.success,0,0);
      const who=cr.kind==="block"?name:(m.name||pname);
      const msg=cr.kind==="goal"||cr.kind==="block"?moment3dMsg(type,"timeout_cross",cr.kind,who):moment3dMsg(type,"cross",cr.kind,who);
      emit(mk(cr.goal,"timeout",cr.kind,who,20,0,rl.chance,cr.goal,false,msg));
      cr.play();
      return;
    }
    // Aceleci şut da fizikle: baraj/oyuncu/kaleci çarpışması aynı
    spin.x=0; spin.y=0;
    const zHit=(Math.random()*2-1)*GW*0.5, ln=shotLaunch(25);
    const sh=physShot({x:B.x,z:B.z,y:B.y,tz:zHit,ty:ln.ty,speed:ln.speed,side:0,top:0,success:rl.success});
    emit(mk(sh.goal,act,sh.kind,name,20,0,rl.chance,sh.goal,false));
    sh.play();
  };
  const forceTimeout=()=>{ if(!outcome){ if(phase==="intro"||phase==="pass"){ phase=setPiece&&!passes?"set":"play"; } autoAction(); } };

  // ── AI ──
  // Baskı (Adım 6): topa en yakın KALE TARAFINDAKİ savunmacı (p1) kademeli yaklaşır:
  //   >6 m sprint (sınırlı ivme, ışınlanma yok) → ≤6 m jokey (kale tarafında ~2 m; topu sürenin hızına
  //   +1.6 m/sn ile kapanır, kale tarafında kalır) → ≤2.2 m müdahale (topa gider,
  //   ≤1.7 m'de ayak uzatır; kapma olasılığı tackleCheck'te, eskisiyle aynı).
  //   İkinci savunmacı (p2) top–kale çizgisinde ~6.5 m önde, sürüş yönüne kayarak
  //   şut/pas açısını kapatır. Sınırlı dönüş hızı (omega) yüzünden ani yön
  //   değiştirme ve takım arkadaşının boş koşu yoluna atılan ara pası baskıyı kırar.
  //   Koşu yolları kullanıcı çizer (run); koşanı markajdaki savunmacı izler.
  let markT=0, attSide=0, attSwitchT=0;
  const clearRun=()=>{ run.idx=-1; run.pts.length=0; run.i=0; };
  const assignMarks=()=>{
    for(let i=0;i<home.length;i++) home[i].marked=false;
    for(let i=0;i<away.length;i++){
      const a=away[i]; if(a.kind!=="def") { a.mark=-1; continue; }
      let best=-1, bd=1e9;
      for(let j=0;j<home.length;j++){
        const m=home[j]; if(j===ctl||m.kind==="gk"||m.marked) continue;
        const d=dist(a,m); if(d<bd){ bd=d; best=j; }
      }
      a.mark=best; if(best>=0) home[best].marked=true;
    }
  };
  const stepAttackAI=(dt)=>{
    const c=ctlA();
    markT-=dt; if(markT<=0){ assignMarks(); markT=0.6; }
    // Baskı: topa en yakın kale tarafındaki savunmacı (yoksa en yakın) + açı kapatan ikinci
    let p1=null, p2=null, d1=1e9, d2=1e9;
    const gdx=L-B.x, gdz=-B.z, gdl=Math.hypot(gdx,gdz)||1, gux=gdx/gdl, guz=gdz/gdl;
    if(phase==="play"){
      for(let i=0;i<away.length;i++){
        const a=away[i]; if(a.kind!=="def") continue;
        // Topun gerisinde kalmış (geçilmiş) savunmacı baskı sırasında geride sayılır
        const behind=((a.x-B.x)*gux+(a.z-B.z)*guz)<-1.2;
        const d=Math.hypot(a.x-B.x,a.z-B.z)+(behind?6:0);
        if(d<d1){ d2=d1; p2=p1; d1=d; p1=a; } else if(d<d2){ d2=d; p2=a; }
      }
      if(d2>((type==="counter"||type==="oneonone")?14:10)) p2=null;
      if(p1) d1=Math.hypot(p1.x-B.x,p1.z-B.z);
    }
    for(let i=0;i<away.length;i++) if(away[i].pokeCd>0) away[i].pokeCd-=dt; // ayak uzatma bekleme süresi
    for(let i=0;i<away.length;i++){
      const a=away[i];
      if(a.kind==="gk"||a.kind==="att") continue;
      if(phase==="pass"&&passInfo.cut&&away[passInfo.cutter]===a) continue; // kesici stepPass'te
      a.stance=""; // (geçersiz kılınan savunmacıda eski duruş çarpanı kalmasın)
      if(a.ovr){ steer(a,a.ox,a.oz,a.osp||VMAX_DEF,8,12,dt,0.1); continue; }
      if(a.kind==="wall"){ a.vx=0; a.vz=0; continue; }
      if(a.cool>0) a.cool-=dt;
      if(a!==p1){ a.jockT=0; a.commitT=0; }
      let tx, tz, stop=0.3, om=3.0, vmax=VMAX_DEF, acc=9, jockey=false;
      if(phase==="set"||phase==="intro"){ tx=a.ax+Math.sin(playT*1.3+i)*0.6; tz=a.az+Math.cos(playT*1.1+i)*0.6; }
      else if(a===p1){
        const cs=Math.hypot(c.vx,c.vz);
        if(d1>6){        // sprint: kale tarafından, öngörülü
          const lead=Math.min(0.6,d1/10);
          tx=c.x+c.vx*lead+gux*1.2; tz=c.z+c.vz*lead+guz*1.2; stop=0.7; om=3.2; acc=6.5;
        } else if(!(a.commitT>0)&&!(d1<2.4&&((a.jockT||0)>MOMENT3D_JOCKEY_SEC||cs<1.6))){
          // jokey: kale tarafında ~2 m'de kal; geri/yan adımla alan ver (yanal hız sınırlı)
          tx=B.x+gux*2.0+c.vx*0.2; tz=B.z+guz*2.0+c.vz*0.2;
          vmax=Math.min(VMAX_DEF,cs+1.4); jockey=true; a.stance="jockey";
          if(d1<4.5) a.jockT=(a.jockT||0)+dt;
        } else {           // hamle (müdahale): topa; boşa giderse kısa toparlanma
          if(!(a.commitT>0)) a.commitT=0.8;
          a.commitT-=dt; a.stance="commit";
          if(a.commitT<=0){ a.commitT=0; a.jockT=-0.4; a.cool=Math.max(a.cool,0.6); }
          tx=B.x+c.vx*0.15; tz=B.z+c.vz*0.15; stop=0.5; om=3.2;
        }
        // Ayak uzatma (görsel; kapma olasılığı tackleCheck'te)
        if(d1<1.7&&!(a.pokeCd>0)&&!outcome){
          a.pokeCd=1.1;
          actors.actionFx("away",a.idx,"poke",{tx:B.x,tz:B.z});
        }
      } else if(a===p2){ // ikinci baskı: top–kale çizgisinde ~6.5 m önde, sürüş yönüne kayarak açıyı kapatır
        tx=B.x+gux*6.5+c.vx*0.3; tz=B.z+guz*6.5+c.vz*0.55; om=3.0; vmax=VMAX_DEF*0.92; a.stance="cover";
      } else if(a.mark>=0&&home[a.mark]){
        const m=home[a.mark];
        tx=m.x+(L-m.x)*0.12+(B.x-m.x)*0.15; tz=m.z*0.88+(B.z-m.z)*0.15;
      } else { tx=B.x+(L-B.x)*0.5; tz=B.z*0.5; }
      // Ayrışma: birbirine 3 m'den yakın savunmacılar açılır
      for(let j=0;j<away.length;j++){
        const b=away[j]; if(b===a||b.kind==="gk") continue;
        const dx=a.x-b.x, dz=a.z-b.z, d=Math.hypot(dx,dz);
        if(d<3&&d>1e-3){ tx+=dx/d*(3-d); tz+=dz/d*(3-d); }
      }
      if(jockey) shuffle(a,tx,tz,vmax*(a.cool>0?0.6:1),gux,guz,dt);
      else steer(a,tx,tz,vmax*(a.cool>0?0.6:1),om,acc,dt,stop);
    }
    // Kaleci: top–kale merkezi çizgisinde, uzaklığa göre öne çıkar (açıyı kapatır)
    if(gk&&!(phase==="pass"&&passInfo.cut&&away[passInfo.cutter]===gk)){
      if(gk.ovr) steer(gk,gk.ox,gk.oz,gk.osp||8,20,20,dt,0.05);
      else{
        const dx=B.x-L, dz=B.z, d=Math.hypot(dx,dz)||1;
        let tx, tz;
        if(isPen){ tx=L-0.3; tz=gk.az; }
        else {
          const out=type==="oneonone"?clamp(d*0.22,1,7):clamp(d*0.12,0.6,4.5);
          tx=L+dx/d*out; tz=clamp(dz/d*out,-GW-0.5,GW+0.5);
        }
        steer(gk,tx,tz,5,8,12,dt,0.1);
      }
    }
    // Takım arkadaşları: çizilen koşu yolu, yoksa ileri koşu + boşa kaçma
    for(let i=0;i<home.length;i++){
      const a=home[i]; if(i===ctl||a.kind==="gk") continue;
      if(a.ovr){ steer(a,a.ox,a.oz,a.osp||VMAX_RUN,10,14,dt,0.1); continue; }
      if(phase==="pass"&&i===passInfo.r) continue; // alıcı stepPass'te
      let tx, tz;
      if(i===run.idx&&phase!=="intro"){
        // Koşu yolu: sıradaki rota noktasına; varınca ilerle, rota bitince orada bekler
        while(run.i<run.pts.length-1&&Math.hypot(run.pts[run.i].x-a.x,run.pts[run.i].z-a.z)<1.3) run.i++;
        const p=run.pts[run.i]||a;
        const last=run.i>=run.pts.length-1;
        steer(a,p.x,p.z,VMAX_RUN,6,10,dt,last?0.4:0);
        continue;
      }
      if(phase==="set"||phase==="intro"){ tx=a.ax+Math.sin(playT*1.2+i*2)*0.8; tz=a.az+Math.cos(playT+i)*0.8; }
      else {
        const prog=clamp(B.x-ball0x,-5,40);
        tx=clamp(a.ax+prog*0.6+playT*0.45,-L+5,L-5.5); tz=a.az;
        let nd=1e9, nx=0, nz=0;
        for(let j=0;j<away.length;j++){ const o=away[j]; if(o.kind==="gk") continue; const d=dist(a,o); if(d<nd){ nd=d; nx=o.x; nz=o.z; } }
        if(nd<6){ tz+=sgn(a.z-nz)*(6-nd)*0.9; tx+=(a.x-nx)*(6-nd)*0.12; }
        const dc=dist(a,c); if(dc<7&&dc>1e-3){ tx+=(a.x-c.x)/dc*(7-dc); tz+=(a.z-c.z)/dc*(7-dc); }
        tz=clamp(tz,-H+2,H-2); tx=clamp(tx,-L+3,L-3);
      }
      steer(a,tx,tz,VMAX_RUN,6,10,dt,0.4);
    }
  };
  const stepTackleAI=(dt)=>{
    const c=ctlA();
    // Topu süren rakip: şut noktasına koşar, savunmacı önüne girerse yana kaçar (sınırlı dönüş)
    if(att){
      if(att.ovr) steer(att,att.ox,att.oz,att.osp||VMAX_ATT,4,10,dt,0.1);
      else if(phase==="play"){
        const rx=runW.x-att.x, rz=runW.z-att.z, rd=Math.hypot(rx,rz)||1;
        let tx=runW.x, tz=runW.z;
        const dx=c.x-att.x, dz=c.z-att.z, dc=Math.hypot(dx,dz);
        attSwitchT-=dt;
        if(dc<5){
          const fwd=(dx*rx+dz*rz)/(rd*Math.max(0.1,dc));
          if(fwd>0.2){
            const side=(dx*(-rz)+dz*rx)>0?-1:1;
            if(attSide===0||attSwitchT<=0){ attSide=side; attSwitchT=0.9; }
            tx=att.x+rx/rd*4+(-rz/rd)*attSide*3.5; tz=att.z+rz/rd*4+(rx/rd)*attSide*3.5;
          }
        }
        steer(att,tx,clamp(tz,-H+2,H-2),VMAX_ATT,4,8,dt,0);
        if(rd<2.2) autoAction(); // şut noktasına vardı
      }
    }
    for(let i=0;i<away.length;i++){
      const a=away[i]; if(a===att) continue;
      if(a.ovr){ steer(a,a.ox,a.oz,a.osp||6,6,10,dt,0.1); continue; }
      if(phase!=="play"){ continue; }
      steer(a,clamp(a.ax-playT*2.2,-L+8,L),a.az*0.9,5.5,4,8,dt,0.3);
    }
    for(let i=0;i<home.length;i++){
      const a=home[i]; if(i===ctl) continue;
      if(a.ovr){ steer(a,a.ox,a.oz,a.osp||6,10,14,dt,0.05); continue; }
      if(a.kind==="gk"){ steer(a,-L+0.8,clamp(B.z*0.3,-GW+0.4,GW-0.4),5,8,12,dt,0.1); continue; }
      if(phase!=="play") continue;
      // Diğer savunmacılar kale tarafına çekilir
      steer(a,clamp(Math.min(a.ax,B.x-6),-L+4,L),a.az*0.8+B.z*0.2,5.5,4,8,dt,0.3);
    }
  };
  // Dribling sırasında top kapma (adil olasılık; ölçüm yorumu sabitin yanında)
  const tackleCheck=(dt)=>{
    if(guardT>0){ guardT-=dt; return; } // topu yeni alan oyuncu kısa süre korunur (parlak halka)
    if(phase!=="play"||isTackle||outcome) return;
    // Kırmızı şut oku çekilirken (ağır çekim) top kapılmaz: bırakış kesin vuruş ekranına gider
    if(aim.on&&aim.mode==="kick") return;
    const own=actors.getOwner(); if(!own||own.team!=="home") return;
    const c=ctlA(), cs=Math.hypot(c.vx,c.vz);
    for(let i=0;i<away.length;i++){
      const a=away[i]; if(a.kind==="wall"||a.cool>0) continue;
      const d=Math.hypot(a.x-B.x,a.z-B.z); if(d>1.5) continue;
      const sp=Math.hypot(a.vx,a.vz);
      const facing=sp>1?clamp(((B.x-a.x)*a.vx+(B.z-a.z)*a.vz)/(Math.max(0.2,d)*sp),0,1):0.8;
      let front=1;
      if(cs>1){ const dd=((a.x-c.x)*c.vx+(a.z-c.z)*c.vz)/(cs*Math.max(0.3,dist(a,c))); front=dd>-0.2?1:0.55; }
      // Kaleci ayağa yatarken daha temkinli (çıkıp topu kapması yarı oranda)
      // Jokey yapan (henüz hamle etmemiş) savunmacı topa nadiren uzanır
      const stance=a.stance==="jockey"?MOMENT3D_JOCKEY_TACKLE:a.stance==="commit"?MOMENT3D_COMMIT_TACKLE:a.stance==="cover"?MOMENT3D_COVER_TACKLE:1;
      const lam=MOMENT3D_TACKLE_RATE*(oppStr/Math.max(30,drb))*(0.35+0.65*facing)*front*(a.kind==="gk"?0.5:1)*stance;
      if(Math.random()<1-Math.exp(-lam*dt)){ lost(a); return; }
    }
  };
  const lost=(a)=>{
    const c=ctlA();
    // Kapma anında son an vuruşu: MOMENT3D_LAST_SHOT olasılıkla oyuncu baskı altında
    // aceleyle vurur (süre dolması ile aynı, en düşük kalite); yoksa top kaybı.
    if(Math.random()<MOMENT3D_LAST_SHOT){ hurriedShot("last_shot"); return; }
    emit(mk(false,"dribble_lost","lost",c.name||pname,0,0,0,false,false));
    actors.actionFx("away",a.idx,"poke",{tx:B.x,tz:B.z});
    actors.setOwner("away",a.idx);
    override(a,a.x-14,clamp(a.z+sgn(a.z||1)*6,-H+2,H-2),6);
    override(c,c.x,c.z,0);
    actors.ringFx(a.x,a.z,0xe74c3c,0.7,4);
    finishSoon(1.4);
  };
  const stepPass=(dt)=>{
    const pi=passInfo; pi.t+=dt;
    const r=home[pi.r];
    if(pi.cut&&away[pi.cutter]){
      const cu=away[pi.cutter];
      steer(cu,pi.cx,pi.cz,8,10,14,dt,0);
      if(r) steer(r,pi.px,pi.pz,VMAX_RUN,8,14,dt,0);
      const db=Math.hypot(cu.x-B.x,cu.z-B.z);
      if((db<1.5&&B.y<2)||pi.t>pi.tc+0.35){
        actors.actionFx("away",cu.idx,"poke",{tx:B.x,tz:B.z});
        actors.setOwner("away",cu.idx);
        emit(mk(false,"intercepted","cut",ctlA().name||pname,0,0,0,false,false));
        override(cu,cu.x-12,clamp(cu.z+sgn(cu.z||1)*5,-H+2,H-2),6);
        actors.ringFx(cu.x,cu.z,0xe74c3c,0.7,4);
        finishSoon(1.3);
      }
      return;
    }
    if(!r){ phase="play"; hud(); return; }
    const db=Math.hypot(r.x-B.x,r.z-B.z);
    const tx=db<4&&B.y<1.3?B.x:pi.px, tz=db<4&&B.y<1.3?B.z:pi.pz;
    steer(r,tx,tz,7.5,8,14,dt,0);
    // Hızlı yerden pas hedef noktaya varınca (alıcı henüz yetişmediyse) top orada yavaşlar:
    //   keskin pas alıcının önünden kaçıp uzaklaşmasın
    if(!pi.lofted&&pi.t>=pi.T&&db>1.3&&actors.getBallVel&&actors.isBallFree&&actors.isBallFree()){
      const bv=actors.getBallVel(); if(bv){ const k=Math.exp(-5*dt); bv.x*=k; bv.z*=k; }
    }
    if((db<1.3&&B.y<1.8)||pi.t>pi.T+1.0){
      actors.setOwner("home",r.idx);
      ctl=pi.r; carried=0; drib.on=false; passMode=false;
      if(run.idx===pi.r) clearRun();   // koşan oyuncu topu aldı: rota biter
      phase="play"; guardT=MOMENT3D_GUARD_SEC;
      timeLeft=Math.min(MOMENT3D_TIME_SEC,timeLeft+MOMENT3D_PASS_REFILL*Math.pow(MOMENT3D_PASS_REFILL_DECAY,Math.max(0,passes-1)));
      actors.ringFx(r.x,r.z,teamCol,0.6,3);
      hud();
    }
  };
  const stepCtl=(dt)=>{
    const a=ctlA();
    if(a.ovr){ steer(a,a.ox,a.oz,a.osp||6,12,16,dt,0.05); return; }
    if(isTackle&&phase==="play"&&att){
      // Savunmacı kendiliğinden jokey yapar: rakip ile kalemiz arasında, rakibe ~2.4 m
      // (sanal çubuk yok; müdahaleyi kullanıcı okla yapar — kısa = ayakta, uzun kırmızı = kayarak)
      const gx=-L-att.x, gz=-att.z, gl=Math.hypot(gx,gz)||1;
      steer(a,att.x+gx/gl*2.4+att.vx*0.3,att.z+gz/gl*2.4+att.vz*0.3,VMAX_MYDEF*0.8,4,9,dt,0.3);
      return;
    }
    let ix=0, iz=0;
    if(phase==="play"&&!isPen){ inputDir(); ix=moveIn.x; iz=moveIn.z; }
    const vmax=isTackle?VMAX_MYDEF:VMAX_BALL;
    const k=Math.min(1,dt*((ix||iz)?5:6));       // ivmelenme / yavaşlama
    a.vx+=(ix*vmax-a.vx)*k; a.vz+=(iz*vmax-a.vz)*k;
    if(phase!=="play"){ a.vx*=0.9; a.vz*=0.9; }
    a.x=clamp(a.x+a.vx*dt,-L+0.6,L-0.6); a.z=clamp(a.z+a.vz*dt,-H+0.6,H-0.6);
    if(phase==="set"&&!isPen){ a.x=a.ax; a.z=a.az; a.vx=0; a.vz=0; } // duran top: kıpırdamaz
    if(phase==="play"&&!isTackle) carried+=Math.hypot(a.vx,a.vz)*dt;
  };
  const driveAll=()=>{
    for(let i=0;i<home.length;i++){ const a=home[i]; actors.drivePlayer("home",a.idx,a.x,a.z); }
    for(let i=0;i<away.length;i++){ const a=away[i]; actors.drivePlayer("away",a.idx,a.x,a.z); }
  };

  // ── Ok çizimi (vertex güncelle; tahsis yok) ──
  //   drib: oyuncudan yeşil koşu oku · kick: toptan kırmızı vuruş oku (önizleme: kale
  //   ağzı / iniş halkası) · tk: savunmacıdan beyaz → yeşil → kırmızı müdahale oku
  const dribLen=()=>MOMENT3D_DRIB_MIN+clamp(aim.f/MOMENT3D_DRIB_F,0,1)*(MOMENT3D_DRIB_MAX-MOMENT3D_DRIB_MIN);
  const tackleCol=(len)=>len>MOMENT3D_SLIDE_LEN?0xe74c3c:len>1.8?0x2ecc71:0xffffff;
  const drawArrow=()=>{
    const a=ctlA();
    let sx, sz, len, col, wk;
    if(aim.mode==="tk"){ sx=a.x; sz=a.z; len=Math.max(0.6,aim.len); col=tackleCol(aim.len); wk=0.9+Math.min(1,aim.len/MOMENT3D_TACKLE_ARROW_MAX)*0.5; }
    else if(aim.mode==="drib"){ sx=a.x; sz=a.z; len=dribLen(); col=0x2ecc71; wk=0.95; }
    else { sx=B.x; sz=B.z; len=3+aim.power*0.24; col=0xe74c3c; wk=0.8+aim.power/250; }
    const ex=sx+aim.dx*len, ez=sz+aim.dz*len;
    for(let i=0;i<AR_N;i++){
      const u=i/(AR_N-1)*0.86;
      arX[i]=sx+(ex-sx)*u; arZ[i]=sz+(ez-sz)*u;
    }
    const nx=-aim.dz, nz=aim.dx;
    for(let i=0;i<AR_N;i++){
      const hw=(0.22+0.28*(i/(AR_N-1)))*wk, j=i*6;
      arPos[j]=arX[i]+nx*hw; arPos[j+1]=0.12; arPos[j+2]=arZ[i]+nz*hw;
      arPos[j+3]=arX[i]-nx*hw; arPos[j+4]=0.12; arPos[j+5]=arZ[i]-nz*hw;
    }
    arAttr.needsUpdate=true; arGeo.setDrawRange(0,(AR_N-1)*6);
    // Uç: son şerit noktasından okun sonuna
    const lx=arX[AR_N-1], lz=arZ[AR_N-1], hwid=0.75*wk;
    hdPos[0]=ex+aim.dx*0.4; hdPos[1]=0.12; hdPos[2]=ez+aim.dz*0.4;
    hdPos[3]=lx+nx*hwid; hdPos[4]=0.12; hdPos[5]=lz+nz*hwid;
    hdPos[6]=lx-nx*hwid; hdPos[7]=0.12; hdPos[8]=lz-nz*hwid;
    hdAttr.needsUpdate=true;
    arMat.color.setHex(col);
    arrow.visible=true; head.visible=true;
    landRing.visible=false; goalMark.visible=false;
    if(aim.mode==="kick"){
      const c=classify(B.x,B.z,aim.dx,aim.dz,aim.power);
      if(c.kind==="shot"){ goalMark.visible=true; goalMark.position.set(L+0.2,1.2,clamp(c.zHit,-(GW+3),GW+3)); landMat.color.setHex(Math.abs(c.zHit)<GW-0.15?0x2ecc71:0xe74c3c); }
      else { landRing.visible=true; landRing.position.set(c.lx,0.08,c.lz); landMat.color.setHex(c.kind==="cross"?0xf1c40f:0xffffff); }
    } else {
      landRing.visible=true; landRing.position.set(clamp(ex,-L+0.5,L-0.5),0.08,clamp(ez,-H+0.5,H-0.5)); landMat.color.setHex(col);
    }
  };

  // Koşu yolu noktaları: çizilirken tüm rota, koşu sırasında koşucunun önündeki kısım
  const placeRunDots=()=>{
    let src=null, from=0, px=0, pz=0;
    if(draw.on&&draw.pts.length>=1){ src=draw.pts; px=src[0].x; pz=src[0].z; }
    else if(run.idx>=0&&run.pts.length>=2&&!outcome&&home[run.idx]){ src=run.pts; from=run.i; px=home[run.idx].x; pz=home[run.idx].z; }
    if(!src){ runDots.visible=false; runMark.visible=false; return; }
    let n=0, carry=0.6;
    for(let i=from;i<src.length&&n<RUN_DOT_N;i++){
      const qx=src[i].x, qz=src[i].z, sl=Math.hypot(qx-px,qz-pz);
      let t=carry;
      while(t<=sl&&n<RUN_DOT_N){ const u=t/sl; tmpM.makeTranslation(px+(qx-px)*u,0.1,pz+(qz-pz)*u); runDots.setMatrixAt(n++,tmpM); t+=1.1; }
      carry=t-sl; px=qx; pz=qz;
    }
    for(let i=n;i<RUN_DOT_N;i++){ tmpM.makeTranslation(0,-50,0); runDots.setMatrixAt(i,tmpM); }
    runDots.instanceMatrix.needsUpdate=true; runDots.visible=n>0;
    const e=src[src.length-1];
    runMark.visible=src.length>1; runMark.position.set(e.x,0.08,e.z);
    const k=1+0.1*Math.sin(realT*6); runMark.scale.set(k,1,k);
  };
  // Rotaya en yakın nokta (koşucunun önündeki kısım) → {x,z,d} | null
  const nearRunPath=(wx,wz)=>{
    if(run.idx<0||run.pts.length<2||!home[run.idx]) return null;
    const m=home[run.idx];
    let px=m.x, pz=m.z, bd=1e9, bx=0, bz=0;
    for(let i=run.i;i<run.pts.length;i++){
      const q=run.pts[i], dx=q.x-px, dz=q.z-pz, l2=dx*dx+dz*dz;
      let t=l2>0?((wx-px)*dx+(wz-pz)*dz)/l2:0; t=t<0?0:t>1?1:t;
      const cx=px+dx*t, cz=pz+dz*t, d=Math.hypot(wx-cx,wz-cz);
      if(d<bd){ bd=d; bx=cx; bz=cz; }
      px=q.x; pz=q.z;
    }
    return bd<1e9?{x:bx,z:bz,d:bd}:null;
  };
  // Koşu yolu ver (UI ve bot API'si): idx takım arkadaşı, pts [{x,z}] dünya
  const setRun=(idx,pts)=>{
    if(isTackle||isPen||outcome||!Number.isInteger(idx)||idx===ctl||!home[idx]||home[idx].kind==="gk"||!Array.isArray(pts)) return false;
    const list=[{x:home[idx].x,z:home[idx].z}];
    let len=0;
    for(let i=0;i<pts.length&&list.length<MOMENT3D_RUN_PTS;i++){
      const p=pts[i]; if(!p||!Number.isFinite(p.x)||!Number.isFinite(p.z)) continue;
      const q={x:clamp(p.x,-L+1,L-1),z:clamp(p.z,-H+1,H-1)}, b=list[list.length-1], d=Math.hypot(q.x-b.x,q.z-b.z);
      if(d<0.5) continue;
      if(len+d>MOMENT3D_RUN_LEN){ const k=(MOMENT3D_RUN_LEN-len)/d; list.push({x:b.x+(q.x-b.x)*k,z:b.z+(q.z-b.z)*k}); len=MOMENT3D_RUN_LEN; break; }
      list.push(q); len+=d;
    }
    if(len<3||list.length<2) return false;
    run.idx=idx; run.pts=list; run.i=1;
    return true;
  };

  // ── Girdi: pointer (fare + dokunma, tuval touch-action:none). Sanal çubuk / klavye yok. ──
  const act={id:null,sx:0,sy:0,t0:0,near:false,mate:-1,moved:0,type:""};
  const cv=api.renderer&&api.renderer.domElement;
  const wTmp={x:0,z:0}, wTmp2={x:0,z:0}, sTmp={x:0,y:0};
  const nowS=()=>(typeof performance!=="undefined"&&performance.now?performance.now():Date.now())/1000;
  const rectOf=()=>{ try{ return cv.getBoundingClientRect(); }catch(e){ return null; } };
  const nearScreen=(p,x,y,px)=>{
    const s=api.worldToScreen?api.worldToScreen(p.x,0.5,p.z,sTmp):null;
    return !!s&&Math.hypot(s.x-x,s.y-y)<px;
  };
  const nearCtlScreen=(x,y)=>{
    const a=ctlA();
    if(nearScreen(a,x,y,44)||(!isTackle&&nearScreen(B,x,y,44))) return true;
    const w=api.screenToWorld?api.screenToWorld(x,y,wTmp):null;
    return !!w&&(Math.hypot(w.x-a.x,w.z-a.z)<2.2||(!isTackle&&Math.hypot(w.x-B.x,w.z-B.z)<2.2));
  };
  // Ekrandaki noktaya en yakın topsuz takım arkadaşı (≤40 px ya da ≤2.4 m) → indeks | -1
  const mateAtScreen=(x,y)=>{
    const w=api.screenToWorld?api.screenToWorld(x,y,wTmp):null;
    let best=-1, bd=1e9;
    for(let i=0;i<home.length;i++){
      const m=home[i]; if(i===ctl||m.kind==="gk") continue;
      const s=api.worldToScreen?api.worldToScreen(m.x,0.9,m.z,sTmp):null;
      const dp=s?Math.hypot(s.x-x,s.y-y):1e9;
      const dw=w?Math.hypot(w.x-m.x,w.z-m.z):1e9;
      if((dp<40||dw<2.4)&&Math.min(dp/40,dw/2.4)<bd){ bd=Math.min(dp/40,dw/2.4); best=i; }
    }
    return best;
  };
  const updateAim=(x,y)=>{
    const w=api.screenToWorld?api.screenToWorld(x,y,wTmp):null;
    if(!w) return;
    const a=ctlA(), px=Math.hypot(x-act.sx,y-act.sy);
    if(isTackle){
      // Savunma oku: savunmacıdan parmağa doğru (ileri çizim)
      const dx=w.x-a.x, dz=w.z-a.z, dl=Math.hypot(dx,dz);
      if(dl>0.05){ aim.dx=dx/dl; aim.dz=dz/dl; }
      aim.len=Math.min(MOMENT3D_TACKLE_ARROW_MAX,dl);
      aim.cancel=dl<1.2||px<16;
      aim.mode="tk"; aim.power=clamp(aim.len/MOMENT3D_TACKLE_ARROW_MAX*100,0,100);
      aim.ax=aim.dx; aim.az=aim.dz; aim.curl=0;
      hud();
      return;
    }
    // Sapan: basılan noktadan geriye çekiş → ok ters yönde (ileri). Yön, sürükleme vektörünün
    //   zemindeki karşılığıdır (oyuncu koşarken de kararlı; kamera kaysa da değişmez).
    const w0=api.screenToWorld?api.screenToWorld(act.sx,act.sy,wTmp2):null;
    let dx=w0?w0.x-w.x:B.x-w.x, dz=w0?w0.z-w.z:B.z-w.z; const dl=Math.hypot(dx,dz);
    aim.cancel=px<16; // başlangıç noktasına geri getirmek = iptal (yeşil okta oyuncu durur)
    if(dl>0.05){ aim.dx=dx/dl; aim.dz=dz/dl; }
    const r=rectOf();
    const f=clamp(px/(0.34*Math.max(120,r?Math.min(r.width,r.height):300)),0,1);
    aim.f=f;
    // Mod çekişin başında seçilir (onMove) ve çekiş boyunca DEĞİŞMEZ: yeşil sürme oku ne kadar
    //   uzun çekilirse çekilsin kırmızıya dönmez; kırmızı şut okunda güç = f·100 (duran topla aynı).
    if(phase==="set") aim.mode="kick";
    if(aim.mode==="kick") aim.power=f*100;   // kırmızı: vuruş
    else aim.power=0;                        // yeşil: top sür (mesafe sınırsız, parmak kalkana dek)
    aim.curl=0; aim.ax=aim.dx; aim.az=aim.dz;
    hud();
  };
  const canAim=()=>canAct()&&(phase==="set"||phase==="play");
  const startDraw=(idx)=>{
    const m=home[idx]; if(!m) return;
    draw.on=true; draw.idx=idx; draw.pts=[{x:m.x,z:m.z}]; draw.len=0;
    hud();
  };
  const extendDraw=(x,y)=>{
    const w=api.screenToWorld?api.screenToWorld(x,y,wTmp):null;
    if(!w||draw.len>=MOMENT3D_RUN_LEN||draw.pts.length>=MOMENT3D_RUN_PTS) return;
    const qx=clamp(w.x,-L+1,L-1), qz=clamp(w.z,-H+1,H-1);
    const b=draw.pts[draw.pts.length-1], d=Math.hypot(qx-b.x,qz-b.z);
    if(d<1.0) return;
    if(draw.len+d>MOMENT3D_RUN_LEN){
      const k=(MOMENT3D_RUN_LEN-draw.len)/d;
      draw.pts.push({x:b.x+(qx-b.x)*k,z:b.z+(qz-b.z)*k}); draw.len=MOMENT3D_RUN_LEN;
      return;
    }
    draw.pts.push({x:qx,z:qz}); draw.len+=d;
  };
  const hideAim=()=>{ arrow.visible=false; head.visible=false; landRing.visible=false; goalMark.visible=false; };
  // Bırakılan ok → eylem
  const releaseAim=()=>{
    const a=ctlA();
    if(isTackle){
      if(aim.len>MOMENT3D_SLIDE_LEN) slideTackle(aim.dx,aim.dz,aim.len);
      else standTackle(a.x+aim.dx*aim.len,a.z+aim.dz*aim.len);
      return;
    }
    if(aim.mode==="drib"){ drib.on=false; hud(); return; } // parmak kalktı: oyuncu durur
    if(aim.power>3) beginStrike(aim.dx,aim.dz,aim.power); else hud();
  };
  // Vuruş ekranı görüşü: top ile kale arasındaki ~16 m'lik koridordaki oyuncular (baraj ve
  //   şutu kesebilecek savunmacılar dahil) MOMENT3D_FADE_OP (0.25) opaklıkta: kaleyi kapatmazlar
  //   ama yerleri görünür; fizik (çarpışma) aynen geçerli. Kaleci her zaman tam görünür.
  let fadedAny=false;
  const fadeView=()=>{
    let ux=pend.tx-B.x, uz=pend.tz-B.z; const ul=Math.hypot(ux,uz)||1; ux/=ul; uz/=ul;
    const cx=B.x-ux*2.4, cz=B.z-uz*2.4;
    const one=(team,a)=>{
      const rx=a.x-cx, rz=a.z-cz, along=rx*ux+rz*uz, lat=Math.abs(rx*uz-rz*ux);
      // Top ile hedef (kale) arasındaki koridor: kameradan ~16 m ileriye kadar, ileride genişler
      const near=a.kind!=="gk"&&along>-0.8&&along<16&&lat<2.4+Math.max(0,along)*0.12;
      actors.setPlayerFade(team,a.idx,near?MOMENT3D_FADE_OP:1); if(near) fadedAny=true;
    };
    for(let i=0;i<home.length;i++) one("home",home[i]);
    for(let i=0;i<away.length;i++) one("away",away[i]);
  };
  const unfadeAll=()=>{
    if(!fadedAny) return; fadedAny=false;
    for(let i=0;i<home.length;i++) actors.setPlayerFade("home",home[i].idx,1);
    for(let i=0;i<away.length;i++) actors.setPlayerFade("away",away[i].idx,1);
  };
  // Vuruş ekranı: 3D topun ekran merkezi + yarıçapı (client px) → out | null
  const sbTmp={x:0,y:0,r:0};
  let sbShown=false;
  const strikeBallScreen=(out)=>{
    if(!api.worldToScreen) return null;
    const c=api.worldToScreen(B.x,B.y+BALL_R,B.z,sTmp); if(!c) return null;
    const cx=c.x, cy=c.y;
    const t=api.worldToScreen(B.x,B.y+BALL_R*2,B.z,sTmp); if(!t) return null;
    out.x=cx; out.y=cy; out.r=Math.max(8,Math.abs(cy-t.y));
    return out;
  };
  // Vuruş ekranında dokunma: topun üzerindeki nokta → dönüş (sağ kenar = sola kavis, alt = aşırtma)
  const strikeTap=(x,y)=>{
    if(phase!=="strike"||!pend.on||outcome) return;
    const b=strikeBallScreen(sbTmp);
    if(!b) return;
    const sx=(x-b.x)/b.r, sy=-(y-b.y)/b.r;
    if(Math.hypot(sx,sy)*b.r>Math.max(b.r*1.25,b.r+28)){ flash("Vuruş için topun üzerine dokun"); return; }
    confirmStrike(sx,sy);
  };
  // Kısa dokunma
  const tapAt=(x,y)=>{
    const w=api.screenToWorld?api.screenToWorld(x,y,wTmp):null;
    if(isTackle){
      if(att&&(nearScreen(att,x,y,46)||(w&&Math.hypot(w.x-att.x,w.z-att.z)<3)))
        standTackle(att.x+att.vx*0.25,att.z+att.vz*0.25);
      else flash("Savunmacından rakibe ok çiz ya da rakibe dokun");
      return;
    }
    if(isPen){ flash("Penaltı: topa basılı tut ve ters yöne geri çek"); return; }
    if(act.near){ flash("Topa basılı tut ve ters yöne geri çek: yeşil ok = top sür · şut için sağ alttaki ŞUT"); return; }
    const mi=act.mate>=0?act.mate:mateAtScreen(x,y);
    if(mi>=0){ const m=home[mi]; passTo(m.x,m.z,false,mi,true); return; }          // doğrudan pas
    const rp=w?nearRunPath(w.x,w.z):null;
    if(rp&&rp.d<=MOMENT3D_RUN_PICK){ passTo(rp.x,rp.z,false,run.idx); return; } // ara pası
    flash(run.idx>=0?"Ara pası için noktalı rotanın üstüne dokun":"Takım arkadaşına dokun ya da ondan boş alana koşu yolu çiz");
  };
  const onDown=(e)=>{
    if(disposed||outcome||!cv) return;
    if(e.button!=null&&e.button>0) return;
    e.preventDefault&&e.preventDefault();
    const touchLike=e.pointerType==="touch"||e.pointerType==="pen";
    if(touchLike&&!touchUi){ touchUi=true; hud(); }
    if(phase==="strike"){ strikeTap(e.clientX,e.clientY); return; } // vuruş ekranı: 3D topa dokun
    const near=canAim()&&nearCtlScreen(e.clientX,e.clientY);
    const mate=!near&&!isTackle&&!isPen&&canAim()?mateAtScreen(e.clientX,e.clientY):-1;
    if(act.id!=null) return;
    act.id=e.pointerId; act.sx=e.clientX; act.sy=e.clientY; act.t0=nowS(); act.moved=0; act.type=e.pointerType||"";
    act.near=near; act.mate=mate;
    aim.cancel=false; aim.curl=0;
    if(isTackle){ hold.on=near||(!!att&&nearScreen(att,e.clientX,e.clientY,46)); hold.t=0; } // faul: savunmacıda/rakipte uzun bas
    try{ cv.setPointerCapture(e.pointerId); }catch(_){}
  };
  const onMove=(e)=>{
    if(disposed) return;
    if(e.pointerId!==act.id) return;
    e.preventDefault&&e.preventDefault();
    act.moved=Math.max(act.moved,Math.hypot(e.clientX-act.sx,e.clientY-act.sy));
    if(act.moved>12) hold.on=false;
    if(!aim.on&&!draw.on&&act.moved>14){
      if(act.near&&canAim()){
        // Mod burada kesinleşir: ilk çekiş yeşil (sürme); sürdükten sonra oyuncu durunca ya da
        //   ŞUT düğmesiyle kırmızı (şut). Duran topta çekiş doğrudan vuruştur.
        const shotNow=phase==="set";           // açık oyunda çekiş HEP yeşil sürme
        aim.on=true; aim.power=0; aim.f=0; aim.len=0; aim.mode=isTackle?"tk":shotNow?"kick":"drib";
        drib.on=false; hud();                   // kırmızıda ağır çekim başlar
      } else if(act.mate>=0&&canAim()){
        startDraw(act.mate);                    // takım arkadaşından koşu yolu
      }
    }
    if(aim.on) updateAim(e.clientX,e.clientY);
    else if(draw.on) extendDraw(e.clientX,e.clientY);
  };
  const release=(id)=>{ try{ if(cv&&id!=null) cv.releasePointerCapture(id); }catch(_){} };
  const onUp=(e)=>{
    if(disposed) return;
    if(e.pointerId!==act.id) return;
    // pointercancel ya da beklenmedik yakalama kaybı (lostpointercapture) = iptal, eylem yok
    const cancelled=e.type==="pointercancel"||e.type==="lostpointercapture";
    release(act.id); act.id=null;
    const dur=nowS()-act.t0, wasHold=hold.on, ht=hold.t;
    hold.on=false;
    if(aim.on){
      // Bırakış noktası son pointermove'dan farklıysa nişanı oradan güncelle
      if(!cancelled&&Number.isFinite(e.clientX)&&Number.isFinite(e.clientY)) updateAim(e.clientX,e.clientY);
      aim.on=false; hideAim();
      // KIRMIZI şut oku: yakalama kaybı / pointercancel (bazı Android WebView'ler parmak
      //   kalkarken bunu pointerup'tan önce yollar) de bırakış sayılır → kesin vuruş ekranı
      const kickRelease=aim.mode==="kick"&&!isTackle&&aim.power>3;
      if((!cancelled||kickRelease)&&!aim.cancel&&!outcome&&canAct()) releaseAim();
      else hud();
      return;
    }
    if(draw.on){
      draw.on=false;
      if(!cancelled&&!outcome&&canAim()){
        if(draw.len>=3&&setRun(draw.idx,draw.pts.slice(1))) flash("Koşu başladı — noktalı rotaya dokun: ara pası");
        else { const m=home[draw.idx]; if(m) passTo(m.x,m.z,false,draw.idx,true); } // çok kısa çizim = dokunma (pas)
      }
      draw.pts=[]; draw.len=0;
      hud();
      return;
    }
    if(cancelled||outcome) return;
    if(isTackle&&wasHold&&ht>=0.5&&act.moved<=12){ foul(ht); return; }
    if(act.moved<12&&dur<0.6&&canAct()&&phase!=="strike") tapAt(e.clientX,e.clientY);
    else if(act.moved>=12&&!isTackle&&!isPen&&phase==="play") flash("Top sürmek için topa sahip oyuncuna bas ve ters yöne geri çek (sapan)");
  };
  if(cv&&cv.addEventListener){
    cv.addEventListener("pointerdown",onDown,{passive:false});
    cv.addEventListener("pointermove",onMove,{passive:false});
    cv.addEventListener("pointerup",onUp);
    cv.addEventListener("pointercancel",onUp);
    cv.addEventListener("lostpointercapture",onUp);
  }
  const removeInput=()=>{
    if(cv&&cv.removeEventListener){
      cv.removeEventListener("pointerdown",onDown,{passive:false});
      cv.removeEventListener("pointermove",onMove,{passive:false});
      cv.removeEventListener("pointerup",onUp);
      cv.removeEventListener("pointercancel",onUp);
      cv.removeEventListener("lostpointercapture",onUp);
    }
  };

  // ── Kare kancası ──
  const hook=(dt,t,realDt)=>{
    if(disposed) return;
    const rdt=Number.isFinite(realDt)?realDt:dt;
    // Ağır çekim geçişi (gerçek zamanda yumuşak)
    // (vuruş ekranında zaman neredeyse durur: tribün/oyuncu animasyonu da yavaşlar)
    const wantTs=phase==="strike"?0.05:(aim.on&&aim.mode!=="drib")||draw.on?MOMENT3D_SLOWMO:1;
    if(Math.abs(timeScale-wantTs)>0.001){
      timeScale+=(wantTs-timeScale)*Math.min(1,rdt*12);
      if(Math.abs(timeScale-wantTs)<0.01) timeScale=wantTs;
      if(api.setTimeScale) api.setTimeScale(timeScale);
    }
    if(flashT>0){ flashT-=rdt; if(flashT<=0) hud(); }
    // Kilitlenme bekçisi (gerçek zaman): sonuç belli olduktan 6 sn sonra animasyon hâlâ
    //   bitmediyse (oyun saati durmuş/yavaşlamış olsa bile) kilit an kapanır
    if(outcome&&!ended){ outT+=rdt; if(outT>6) finish(); }
    if(dotsT>0){ dotsT-=rdt; dotMat.opacity=0.9*clamp(dotsT/0.4,0,1); if(dotsT<=0) dots.visible=false; }
    if(dt<=0) return;
    realT+=rdt;
    if(phase==="strike"){
      // Vuruş ekranı: simülasyon durur; süre dolarsa düz vuruş
      pend.t+=rdt;
      if(pend.t>=MOMENT3D_STRIKE_SEC&&!outcome) confirmStrike(0,0);
    }
    if(phase!=="strike") simStep(dt,rdt);
    else driveAll();
    // Kontrol halkası (nabız) + faul basış göstergesi
    const c=ctlA();
    ctlRing.visible=(!outcome||phase==="anim")&&phase!=="strike";
    ctlRing.position.set(c.x,0.07,c.z);
    const k=1+0.08*Math.sin(realT*5);
    ctlRing.scale.set(k,1,k);
    if(isTackle&&hold.on&&hold.t>0.25){
      const pw=clamp(30+(hold.t-0.4)*60,0,100);
      ctlMat.color.setHex(moment3dPowerColor(pw)); ctlMat.opacity=0.8;
    } else if(guardT>0&&phase==="play"){ ctlMat.color.setHex(0xe8f6ff); ctlMat.opacity=0.75+0.2*Math.sin(realT*14); } // top koruması
    else { ctlMat.color.setHex(teamCol); ctlMat.opacity=0.42+0.14*Math.sin(realT*5); }
    if(aim.on) drawArrow();
    placeRunDots();
    updateCamera(c,rdt);
    // Vuruş ekranı: 3D topun tuvaldeki yeri (arayüz rehber halkası buraya oturur)
    if(phase==="strike"&&!outcome) fadeView(); else unfadeAll();
    if(phase==="strike"&&!outcome){
      const b=strikeBallScreen(sbTmp), r=rectOf();
      if(b&&r){ sbShown=true; try{ cfg.onStrikeBall&&cfg.onStrikeBall(b.x-r.left,b.y-r.top,b.r); }catch(e){} }
    } else if(sbShown){ sbShown=false; try{ cfg.onStrikeBall&&cfg.onStrikeBall(null); }catch(e){} }
    const showPw=aim.on&&aim.mode==="kick";
    try{ cfg.onFrame&&cfg.onFrame(timeLeft/MOMENT3D_TIME_SEC,showPw?aim.power:-1,showPw?moment3dPowerColor(aim.power):0); }catch(e){}
    // Ajan geçersiz kılmaları yalnızca animasyon boyunca
    if(!outcome) for(let i=0;i<home.length;i++) if(home[i].ovr&&phase!=="pass") home[i].ovr=false;
  };
  // Simülasyon adımı (vuruş ekranında çağrılmaz)
  const simStep=(dt,rdt)=>{
    if(phase==="intro"){
      introT+=rdt;
      if(introT>=MOMENT3D_INTRO_SEC){
        phase=setPiece?"set":"play";
        if(!setPiece) actors.setOwner(isTackle?"away":"home",0);
        if(!setPiece&&!isTackle) guardT=MOMENT3D_GUARD_SEC;
        hud();
      }
    }
    playT+=dt; animT+=dt;
    while(tl.length&&tl[0].t<=animT){
      const e=tl.shift();
      try{ e.fn(); }catch(err){ console.error("[3D kilit an]",err); }
    }
    if(hold.on&&!aim.on){ hold.t+=dt; }
    stepCtl(dt);
    if(isTackle) stepTackleAI(dt); else stepAttackAI(dt);
    if(phase==="pass") stepPass(dt);
    tackleCheck(dt);
    driveAll();
    // Süre (yalnızca oynanırken; ağır çekimde yavaşlar)
    if((phase==="set"||phase==="play")&&!outcome){
      timeLeft-=dt;
      if(timeLeft<=0){ timeLeft=0; autoAction(); }
    }
  };
  // Hibrit kamera: vuruş ekranı ve şut animasyonu çim seviyesinde, geri kalan her şey kuşbakışı
  const updateCamera=(c,rdt)=>{
    if(phase==="strike"){
      // VURUŞ EKRANI: kamera çim seviyesinde topun hemen arkasında (kuşbakışı gizli) →
      //   gerçek 3D top ekranın alt ortasında büyük, karşıda kale ve kaleci. İlk kare geçişsiz.
      strikeCam.x=B.x; strikeCam.z=B.z; strikeCam.tx=pend.tx; strikeCam.tz=pend.tz;
      let ux=pend.tx-B.x, uz=pend.tz-B.z; const ul=Math.hypot(ux,uz)||1; ux/=ul; uz/=ul;
      setCam(B.x-ux*2.4,0.95,B.z-uz*2.4,B.x+ux*14,0.25,B.z+uz*14,strikeSnap,true);
      strikeSnap=false;
      return;
    }
    const low=strikeLow.on&&!!outcome;
    if(low){
      const bx=strikeCam.x, bz=strikeCam.z;
      let ux=strikeCam.tx-bx, uz=strikeCam.tz-bz; const ul=Math.hypot(ux,uz)||1; ux/=ul; uz/=ul;
      // Topun ~4.5 m arkası, hafif sağı, 1.3 m: top önde, kale/hedef karşıda
      setCam(bx-ux*4.5-uz*1.0,1.3,bz-uz*4.5+ux*1.0,bx+ux*16,1.0,bz+uz*16,false,true);
      return;
    }
    // Kuşbakışı: odak çizim/nişan sırasında sabit (parmak altındaki saha kaymasın)
    if((!aim.on||aim.mode==="drib")&&!draw.on){   // yeşil okta kamera koşan oyuncuyu izler
      // Odak + yükseklik kadrajdan: top, oyuncumuz, arkadaşlar, rota (dikey ekranda da hepsi görünür)
      frameCollect(c);
      frameFit(fitTmp);
      let fx=fitTmp.x, fz=fitTmp.z;
      if(phase==="anim"||phase==="pass"){ fx=fx*0.5+B.x*0.5; fz=fz*0.5+B.z*0.5; } // top uçarken ona kay
      const kf=Math.min(1,rdt*2.5);
      focus.x+=(fx-focus.x)*kf; focus.z+=(fz-focus.z)*kf; focus.h+=(fitTmp.h-focus.h)*kf;
    }
    overheadCam(focus.x,focus.z,focus.h,false);
  };
  const removeHook=api.addFrameHook(hook);
  hud();

  let removeDisposeHook=null;
  const dispose=()=>{
    if(disposed) return;
    disposed=true;
    aim.on=false;
    removeHook();
    if(removeDisposeHook) removeDisposeHook();
    removeInput();
    try{ if(api.setTimeScale&&!api.isDisposed()) api.setTimeScale(1); }catch(e){}
    try{ actors.dispose(); }catch(e){}
    if(group.parent) group.parent.remove(group);
    group.clear();
    try{ dots.dispose&&dots.dispose(); }catch(e){}
    try{ runDots.dispose&&runDots.dispose(); }catch(e){}
    run.pts.length=0; draw.pts=[];
    owned.geos.forEach(g=>{ try{ g.dispose(); }catch(e){} });
    owned.mats.forEach(m=>{ try{ m.dispose(); }catch(e){} });
    owned.geos.length=0; owned.mats.length=0;
    tl.length=0; riskList.length=0;
  };
  if(api.addDisposeHook) removeDisposeHook=api.addDisposeHook(dispose);

  const getState=()=>({phase,ctl,timeLeft,passes,carried,home,away,ball:B,gk,att,runW,
    outcome,isTackle,isPen,setPiece,wallUp,L,H,GW,oppStr,drb,run,strikeKind:pend.on?pend.kind:""});
  // Bot/test API: yeşil ok (top sür) hedefi
  const dribbleTo=(wx,wz)=>{
    if(!canAct()||phase!=="play"||isTackle||isPen||!Number.isFinite(wx)||!Number.isFinite(wz)) return false;
    drib.on=true; drib.x=clamp(wx,-L+1,L-1); drib.z=clamp(wz,-H+1,H-1); return true;
  };
  // Sağ alt ŞUT düğmesi: ok çekmeden DOĞRUDAN vuruş ekranı (kaleye; vuruş şekli ekranda seçilir)
  const shootNow=()=>{
    if(isTackle||isPen||outcome||aim.on||draw.on||(phase!=="play"&&phase!=="set")) return false;
    if(phase==="set"&&type==="corner") return false;      // kornerden doğrudan şut yok
    const gz=clamp(-B.z*0.15,-(GW-1.5),GW-1.5)-B.z;
    const gx=Math.max(1,L-B.x,Math.abs(gz)*0.1);           // kale çizgisine yakın kanatta da ileri bileşen kalsın
    return beginStrike(gx,gz,MOMENT3D_SHOT_BTN_POWER,true);
  };
  // Sağ alt PAS düğmesi: pas modu (arkadaşlar halkayla parlar; dokun = pas, sürükle = koşu yolu)
  const togglePassMode=()=>{
    if(isTackle||isPen||outcome||aim.on||(phase!=="play"&&phase!=="set")) return false;
    passMode=!passMode;
    if(passMode){
      drib.on=false;
      for(let i=0;i<home.length;i++){ const m=home[i]; if(i!==ctl&&m.kind!=="gk") actors.ringFx(m.x,m.z,0xf1c40f,0.9,3.2); }
    }
    hud();
    return passMode;
  };
  // (bot API'si: strike() öncesi vuruş noktası; arayüz confirmStrike ile seçer)
  const setSpin=(x,y)=>{
    if(aim.on||outcome) return {x:spin.x,y:spin.y}; // nişan sırasında değişmez
    let sx=Number(x)||0, sy=Number(y)||0; const l=Math.hypot(sx,sy);
    if(l>1){ sx/=l; sy/=l; }
    spin.x=sx; spin.y=sy;
    return {x:sx,y:sy};
  };
  return {passTo,strike,tackleAt,foul,block,forceTimeout,getState,dispose,setSpin,
    beginStrike,confirmStrike,standTackle,slideTackle,setRun,dribbleTo,shootNow,togglePassMode,
    evalShot:(bx,bz,ax,az,zHit,curl)=>evalShot(bx,bz,ax,az,zHit,Math.abs(curl||0),wallUp?0.18:1),
    evalCross,classify:(bx,bz,dx,dz,p)=>{ const c=classify(bx,bz,dx,dz,p); return {kind:c.kind,zHit:c.zHit,lx:c.lx,lz:c.lz}; }};
}

// 3D kilit an sahnesi + arayüz. onFallback(msg): 2D'ye geç (sonuç hesaplanmadan önce).
function Moment3DStage({moment,mates,myStr,oppStr,homeShare,onResolve,onFallback}){
  const {config,player,min}=moment;
  const coarse=(()=>{ try{ return !!(window.matchMedia&&window.matchMedia("(pointer: coarse)").matches); }catch(e){ return false; } })();
  const [ready,setReady]=useState(false);
  const [hud,setHud]=useState({phase:"intro",hint:"⏳ 3D sahne hazırlanıyor…",passes:0,touchUi:coarse,aiming:false,tackle:moment.type==="tackle",passMode:false});
  const [result,setResult]=useState(null);
  const [animOut,setAnimOut]=useState(false);
  const ctrlRef=useRef(null);
  const timersRef=useRef([]), outcomeRef=useRef(null), resolvedRef=useRef(false), shownRef=useRef(false);
  const timeBarRef=useRef(null), powerRef=useRef(null), sbRef=useRef(null), frameRef=useRef({w:-1,p:-2});
  const rootRef=useRef(null);
  const cbRef=useRef(null); cbRef.current={onResolve,onFallback};

  const later=(ms,fn)=>{ const id=setTimeout(fn,ms); timersRef.current.push(id); return id; };

  useEffect(()=>{
    // Güvenlik: kilit an 75 sn'de bitmediyse otomatik eylem, 90 sn'de hâlâ sonuç yoksa 2D
    //   (pas sınırı kalktı: uzun paslaşma + ağır çekimli koşu yolu çizimi 40 sn'yi aşabilir)
    later(75000,()=>{ if(!outcomeRef.current&&ctrlRef.current) ctrlRef.current.forceTimeout(); });
    later(90000,()=>{ if(!outcomeRef.current) fallback("3D kilit an yanıt vermedi; 2D görünüme geçildi."); });
    return()=>{
      timersRef.current.forEach(clearTimeout); timersRef.current=[];
      if(ctrlRef.current){ ctrlRef.current.dispose(); ctrlRef.current=null; }
    };
  },[]);

  const doResolve=()=>{
    if(resolvedRef.current||!outcomeRef.current) return;
    resolvedRef.current=true;
    const o=outcomeRef.current;
    cbRef.current.onResolve({success:o.success,goalScored:o.goalScored,goalConceded:o.goalConceded,
      optionId:o.optId,player:o.playerName||player.n,momentType:moment.type,msg:o.msg});
  };
  const showResult=()=>{
    if(shownRef.current||!outcomeRef.current) return;
    shownRef.current=true;
    setResult(outcomeRef.current);
    later(2800,closeNow);
  };
  // Sonuç kartını hemen kapat ve maça dön ("Devam" düğmesi / otomatik). Tek sefer.
  const closingRef=useRef(false);
  const closeNow=()=>{
    if(closingRef.current||!outcomeRef.current) return;
    closingRef.current=true;
    setAnimOut(true); later(400,doResolve);
  };
  // Sonuçtan sonra "Atla": animasyonu beklemeden sonuç kartına geç
  const skipAnim=()=>{ if(outcomeRef.current) showResult(); };
  const handlersRef=useRef(null);
  handlersRef.current={showResult,setHud};

  const fallback=(msg)=>{
    if(outcomeRef.current) return; // sonuç hesaplandıysa 2D'ye dönülmez
    try{ cbRef.current.onFallback&&cbRef.current.onFallback(msg||""); }catch(e){}
  };

  const onReady=(api)=>{
    // Tribün: ana 3D sahne ile aynı taraftar dağılımı (ev 0.74 / deplasman 0.3)
    if(api.crowd&&Number.isFinite(homeShare)) api.crowd.setSupport(homeShare);
    try{
      ctrlRef.current=createMoment3DController(api,{
        type:moment.type, player, oppStr, myStr, mates, touch:coarse,
        onHud:(h)=>handlersRef.current.setHud(h),
        onFrame:(frac,power,col)=>{
          // Yalnızca değişince DOM'a yaz (her karede React state'i yok)
          const fr=frameRef.current, tb=timeBarRef.current;
          const w=Math.round(Math.max(0,Math.min(1,frac))*400);
          if(tb&&w!==fr.w){ fr.w=w; tb.style.width=(w/4)+"%"; tb.style.background=frac<0.3?"#e74c3c":config.color; }
          const pw=powerRef.current, p=power>=0?Math.round(power):-1;
          if(pw&&p!==fr.p){
            fr.p=p;
            if(p>=0){ pw.style.opacity="1"; pw.textContent="Güç "+p+(p>90?" · isabetsiz!":p<25?" · zayıf":""); pw.style.color="#"+(col||0xffffff).toString(16).padStart(6,"0"); }
            else pw.style.opacity="0";
          }
        },
        onStrikeBall:(x,y,r)=>{
          // Vuruş ekranı rehber halkası sahnedeki gerçek 3D topun üstüne oturur (DOM, React state yok)
          const el=sbRef.current; if(!el) return;
          if(x==null||!Number.isFinite(x)){ el.style.opacity="0"; return; }
          const d=Math.round(r*2);
          el.style.opacity="1"; el.style.left=Math.round(x-r)+"px"; el.style.top=Math.round(y-r)+"px";
          el.style.width=d+"px"; el.style.height=d+"px";
        },
        // Sonuç kartı en geç 6.5 sn sonra (animasyon takılsa da); kart 2.8 sn sonra kendiliğinden kapanır
        onOutcome:(o)=>{ outcomeRef.current=o; later(6500,()=>handlersRef.current.showResult()); },
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

  const locked=!!outcomeRef.current||hud.phase==="anim"||hud.phase==="done";
  const btnBase={fontFamily:"inherit",cursor:"pointer",borderRadius:7,fontWeight:800};
  // Mobil: sahne açıkken parmak hareketi sayfayı kaydırmasın (eski iOS için touchmove da yutulur)
  useEffect(()=>{
    const el=rootRef.current; if(!el||!el.addEventListener) return;
    const stop=(e)=>{ if(e.cancelable) e.preventDefault(); };
    el.addEventListener("touchmove",stop,{passive:false});
    return()=>el.removeEventListener("touchmove",stop,{passive:false});
  },[]);
  // Vuruş ekranı: dokunma tuvalde (denetleyici strikeTap) — sahnedeki gerçek 3D topun üstüne.
  //   Arayüz yalnız rehber halkayı topun üstüne oturtur (onStrikeBall) ve geri sayımı gösterir.
  const striking=ready&&hud.phase==="strike";

  return(
    <div ref={rootRef} style={{position:"fixed",inset:0,zIndex:500,background:"rgba(0,0,0,.95)",touchAction:"none",overscrollBehavior:"contain",
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
          {!hud.tackle&&moment.type!=="penalty"&&(
            <div title="Yapılan pas (sınırsız)" style={{fontSize:".56rem",fontWeight:900,color:"#fff",
              background:"rgba(0,0,0,.3)",borderRadius:6,padding:"3px 7px",fontFamily:"'Barlow Condensed',sans-serif"}}>
              PAS {hud.passes}
            </div>
          )}
          {!locked&&(
            <button onClick={()=>fallback("")} title="Bu kilit anı 2D görünümde oyna"
              style={{...btnBase,fontSize:".5rem",padding:"4px 8px",color:"#fff",
                background:"rgba(0,0,0,.35)",border:"1px solid rgba(255,255,255,.35)"}}>
              2D'ye geç
            </button>
          )}
        </div>
        {/* İnce süre çubuğu */}
        <div style={{height:4,background:"rgba(255,255,255,.08)",flexShrink:0}}>
          <div ref={timeBarRef} style={{height:"100%",width:"100%",background:config.color,transition:"background .2s"}}/>
        </div>

        {/* ── 3D sahne ── */}
        <div style={{flex:1,minHeight:180,position:"relative",touchAction:"none"}}>
          <div style={{position:"absolute",inset:0}}>
            <Pitch3D camera="custom" height="100%" showControls={false} interactive={true}
              onReady={onReady} onError={onErr}/>
          </div>
          {hud.hint&&(
            <div style={{position:"absolute",top:6,left:"50%",transform:"translateX(-50%)",zIndex:3,
              pointerEvents:"none",maxWidth:"94%",textAlign:"center",fontSize:".5rem",fontWeight:700,
              color:"#fff",background:"rgba(0,0,0,.62)",padding:"4px 9px",borderRadius:6,lineHeight:1.4}}>
              {hud.hint}
            </div>
          )}
          <div ref={powerRef} style={{position:"absolute",top:36,left:"50%",transform:"translateX(-50%)",zIndex:3,
            pointerEvents:"none",opacity:0,fontSize:".7rem",fontWeight:900,letterSpacing:1,
            fontFamily:"'Barlow Condensed',sans-serif",background:"rgba(0,0,0,.6)",padding:"2px 10px",borderRadius:6}}/>
          {ready&&!locked&&!hud.tackle&&!hud.aiming&&moment.type!=="penalty"&&(hud.phase==="play"||hud.phase==="set")&&(
            // Sağ alt aksiyon düğmeleri (dokunmatik uyumlu, ≥48 px): PAS = pas modu · ŞUT = doğrudan vuruş ekranı
            <div style={{position:"absolute",right:10,bottom:10,zIndex:5,display:"flex",gap:8}}>
              <button onClick={(e)=>{ e.stopPropagation(); if(ctrlRef.current&&ctrlRef.current.togglePassMode) ctrlRef.current.togglePassMode(); }}
                title="Pas modu: arkadaşına dokun = pas · arkadaştan boş alana sürükle = koşu yolu"
                style={{...btnBase,minWidth:72,minHeight:52,fontSize:".8rem",letterSpacing:1,padding:"8px 14px",
                  fontFamily:"'Barlow Condensed',sans-serif",color:"#fff",touchAction:"manipulation",
                  background:hud.passMode?"linear-gradient(180deg,#f1c40f,#c79a00)":"rgba(0,0,0,.6)",
                  border:"2px solid #f1c40f",boxShadow:hud.passMode?"0 0 16px rgba(241,196,15,.7)":"0 2px 8px rgba(0,0,0,.5)"}}>
                ➜ PAS
              </button>
              {!(hud.phase==="set"&&moment.type==="corner")&&(
                <button onClick={(e)=>{ e.stopPropagation(); if(ctrlRef.current&&ctrlRef.current.shootNow) ctrlRef.current.shootNow(); }}
                  title="Şut: doğrudan 3D vuruş ekranı"
                  style={{...btnBase,minWidth:72,minHeight:52,fontSize:".8rem",letterSpacing:1,padding:"8px 14px",
                    fontFamily:"'Barlow Condensed',sans-serif",color:"#fff",touchAction:"manipulation",
                    background:"linear-gradient(180deg,#e74c3c,#b03a2e)",border:"2px solid #ffb3aa",
                    boxShadow:"0 0 14px rgba(231,76,60,.6)"}}>
                  ⚽ ŞUT
                </button>
              )}
            </div>
          )}
          {ready&&locked&&!result&&(
            // Vuruş / pozisyon sonrası: animasyonu beklemeden sonuca geç (kilitlenme hissi olmasın)
            <button onClick={(e)=>{ e.stopPropagation(); skipAnim(); }}
              style={{...btnBase,position:"absolute",right:10,bottom:10,zIndex:5,minHeight:44,fontSize:".66rem",
                padding:"6px 14px",color:"#fff",background:"rgba(0,0,0,.6)",border:"1px solid rgba(255,255,255,.45)",
                touchAction:"manipulation"}}>
              Atla ⏭
            </button>
          )}
          {striking&&!locked&&(
            // Vuruş ekranı katmanı: tıklamalar tuvale geçer (pointerEvents none); rehber halka 3D topun üstünde
            <div style={{position:"absolute",inset:0,zIndex:4,pointerEvents:"none"}}>
              <div style={{position:"absolute",top:34,left:"50%",transform:"translateX(-50%)",fontSize:".56rem",fontWeight:900,
                letterSpacing:1,color:"#fff",background:"rgba(0,0,0,.6)",padding:"3px 10px",borderRadius:6,
                fontFamily:"'Barlow Condensed',sans-serif",whiteSpace:"nowrap"}}>
                {hud.strikeKind==="cross"?"ORTA — TOPA DOKUN":hud.strikeKind==="lpass"?"UZUN PAS — TOPA DOKUN":"ŞUT — TOPA DOKUN"}
              </div>
              <div ref={sbRef} style={{position:"absolute",left:0,top:0,width:0,height:0,opacity:0,borderRadius:"50%",
                border:"2px dashed rgba(255,255,255,.75)",boxShadow:"0 0 18px rgba(46,204,113,.45)",transition:"opacity .15s"}}>
                {/* Bölgeler: orta = düz, kenarlar = kavis, alt = aşırtma, üst = sert */}
                <div style={{position:"absolute",left:"40%",top:"40%",width:"20%",height:"20%",borderRadius:"50%",border:"1px dashed rgba(46,204,113,.9)"}}/>
                <div style={{position:"absolute",left:"50%",top:"6%",bottom:"6%",borderLeft:"1px dotted rgba(255,255,255,.35)"}}/>
                <div style={{position:"absolute",top:"50%",left:"6%",right:"6%",borderTop:"1px dotted rgba(255,255,255,.35)"}}/>
              </div>
              <div style={{position:"absolute",bottom:8,left:"50%",transform:"translateX(-50%)",display:"flex",flexDirection:"column",alignItems:"center",width:"min(92%,360px)"}}>
                <div style={{fontSize:".42rem",color:"rgba(255,255,255,.85)",textAlign:"center",lineHeight:1.4,
                  background:"rgba(0,0,0,.5)",padding:"2px 8px",borderRadius:5}}>
                  {hud.strikeKind==="lpass"?"Topa dokun: havadan uzun pas":<>Orta: düz · Sağdan vur: sola kavis · Soldan: sağa kavis · Alt: yüksek{hud.strikeKind==="cross"?"":" / aşırtma"} · Üst: sert, düşen</>}
                </div>
                {/* Geri sayım: dolunca düz vuruş (MOMENT3D_STRIKE_SEC) */}
                <div style={{width:"min(46vw,210px)",height:4,borderRadius:2,background:"rgba(255,255,255,.15)",marginTop:5,overflow:"hidden"}}>
                  <div style={{height:"100%",background:"#f1c40f",transformOrigin:"left center",
                    animation:`m3dCount ${MOMENT3D_STRIKE_SEC}s linear forwards`}}/>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Alt panel ── */}
        <div style={{flexShrink:0,padding:"6px 8px 8px",borderTop:`2px solid ${config.color}44`,
          background:"linear-gradient(180deg,#0d1e10 0%,#071208 100%)"}}>
          {!result&&(
            <div style={{textAlign:"center",fontSize:".46rem",color:"rgba(255,255,255,.55)",lineHeight:1.5,padding:"2px 4px"}}>
              {hud.tackle
                ?"Kısa ok (beyaz/yeşil) yakındaki rakibe ayakta müdahale; uzun kırmızı ok kayarak uzanır ama arkadan gelirsen faul olur."
                :moment.type==="penalty"
                  ?"Kaleci bir tarafa kaymış — açık köşeye çek. Güç 40–80 ideal, 90 üstü isabetsiz; sonra topa dokunarak vuruş şeklini seç."
                  :"Oyuncuya bas, geri çek: yeşil okla basılıyken sürer (kaydırarak yön ver, bırakınca durur). Sağ alt: PAS (arkadaşa dokun / koşu yolu çiz, sınırsız pas) · ŞUT (doğrudan vuruş ekranı)."}
            </div>
          )}
          {result&&(
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
                {result.chance>0?(<>
                  <span>Güç: {result.power}</span><span>·</span>
                  <span>Konum: %{result.quality}</span><span>·</span>
                  <span>Şans: %{result.chance}</span><span>·</span>
                </>):null}
                <span style={{color:result.success?"#2ecc71":"#e74c3c"}}>{result.success?"✓ Başarılı":"✗ Başarısız"}</span>
              </div>
              <button onClick={closeNow}
                style={{...btnBase,marginTop:8,minHeight:42,minWidth:140,fontSize:".7rem",letterSpacing:1,color:"#fff",
                  background:config.color,border:"none",touchAction:"manipulation"}}>
                Devam ▶
              </button>
            </div>
          )}
        </div>
      </div>
      <style>{`
        @keyframes m3dSlideIn{from{opacity:0;transform:translateY(40px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes m3dFadeOut{from{opacity:1;transform:scale(1)}to{opacity:0;transform:scale(.96)}}
        @keyframes m3dCount{from{transform:scaleX(1)}to{transform:scaleX(0)}}
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
    <Moment3DStage moment={props.moment} mates={props.mates} myStr={props.myStr} oppStr={props.oppStr} homeShare={props.homeShare}
      onResolve={props.onResolve}
      onFallback={(msg)=>{
        setNotice(msg||""); setMode("2d");
        // Gerçek hata (mesaj dolu) → üst bileşen maç görünümünü de 2D'ye alsın; "2D'ye geç" düğmesi (boş mesaj) yalnız bu anı etkiler
        if(msg&&props.onFallback){ try{ props.onFallback(msg); }catch(e){} }
      }}/>
  );
}
