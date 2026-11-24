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

const MOMENT3D_TIME_SEC=20;        // kilit an süresi (oyun zamanı; ağır çekimde yavaşlar) — Adım 15: ×2
// Top sürme süreyi kısmen yeniler: koşulan her metre +MOMENT3D_DRIB_REFILL sn (anda toplam en çok _MAX)
const MOMENT3D_DRIB_REFILL=0.12, MOMENT3D_DRIB_REFILL_MAX=6;
const MOMENT3D_INTRO_SEC=0.6;      // kamera girişi (gerçek zaman)
// Pas sınırı YOK (Adım 12). Başarılı pas süreye REFILL·DECAY^(pas−1) ekler (tavan
//   MOMENT3D_TIME_SEC) → sınırsız pasla da kilit an sonsuza uzamaz (toplam ek ≤ 24 sn).
const MOMENT3D_PASS_REFILL=6, MOMENT3D_PASS_REFILL_DECAY=0.75;
const MOMENT3D_SHOT_BTN_POWER=62;  // ŞUT düğmesi: tatlı bölgede güç (vuruş şekli ekranda seçilir)
// Vuruş ekranı SADE: saha oyuncuları (vurucu dahil) gizlenir; yalnız top, kale, kaleci, çim,
//   tribün görünür (frikikte baraj da). Gizlenen oyuncular şut fiziğinde engel sayılmaz.
// 2.5D odak: kadraj yükseklik çarpanı (1 = kadraj kutusu kenar payıyla tam sığar; <1 kırpar,
//   eskiden 0.78 → aşırı yakın plan) ve topa sahip oyuncunun etrafındaki pas/koşu menzili çemberi (m)
const MOMENT3D_ZOOM=1, MOMENT3D_FOCUS_R=18;
// 2.5D kadraj: pas verilebilir arkadaş yarıçapı (m), rakip kalenin kadraja girdiği top mesafesi (m),
//   kuşbakışı kamera yüksekliği tavanı (m; Pitch3D tavanı PITCH3D_CAM_TOP_MAX_Y = 80)
const MOMENT3D_FRAME_MATE_R=30, MOMENT3D_FRAME_GOAL_D=46, MOMENT3D_CAM_MAX_H=74;
const MOMENT3D_GK_LINE=0.4;        // kalecinin kale çizgisinin önündeki mesafesi (m): çizgide durur
// ŞUT düğmesi yalnız rakip yarı sahada ve kaleye bu mesafeden (m) yakınken aktif
const MOMENT3D_SHOT_MAX_D=38;
// Sürme → şut yön aktarımı: parmak kalktıktan sonra bu süre (gerçek zaman, sn) içinde ŞUT'a
//   basılırsa vuruş ekranı son sürme okunun yönüne hizalanır
const MOMENT3D_DRIB_AIM_SEC=3;
// Kaleci tepkisi (görsel dalış): top MOMENT3D_GK_SEE_F × şut mesafesini (2–5 m) kat edince
//   yön algılanır, üstüne refleks süresi (rakip gücüne göre 0.16–0.32 sn) eklenir
const MOMENT3D_GK_SEE_F=0.2;
const MOMENT3D_SLOWMO=0.2;         // geri çekerken zaman ölçeği
// kilit an pas hız çarpanı (Adım 14: 1.8 × 1.6 = 3.3; arcade tempo ×1.8; Adım 16: ×2 sert pas;
//   havadan pasta karekökü; tavan ACTORS3D_KICK_MUL_MAX/_VMAX players3d.js'te)
const MOMENT3D_PASS_SPEED=3.3*1.8;   // (Adım 17: yalnız havadan pas çarpanı; yer pası aşağıdaki hız eğrisiyle)
// Adım 17 — yer pası ortalama hızı (m/sn) = V0 + VK·mesafe, [VMIN, VMAX] aralığında (5 m ≈ 15.5,
//   15 m ≈ 20.5, 25 m ≈ 25.5). Top sürtünmeyle hafif yavaşlayarak (çıkış ≈ ort. + 1.2, varış ≈ ort. − 1.2)
//   yuvarlanır; 30 FPS'te kare başı ~0.5–0.9 m → göz takip eder. (Adım 16'da ×2 + tavan 140 m/sn idi:
//   15 m'lik pas 3 karede biterdi.)
const MOMENT3D_PASS_V0=13, MOMENT3D_PASS_VK=0.5, MOMENT3D_PASS_VMIN=15, MOMENT3D_PASS_VMAX=26;
// Adım 17 — kuşbakışı yörünge kamerası: varsayılan eğim (rad; eski sabit poz: geri 0.2h → ~78.7°),
//   kullanıcı sınırları (25°–79°) ve sürükleme duyarlılığı (ekran genişliği = 180° yaw, yüksekliği = 70° eğim)
const MOMENT3D_ORBIT_EL0=Math.atan2(1,0.2), MOMENT3D_ORBIT_EL_MIN=25*Math.PI/180, MOMENT3D_ORBIT_EL_MAX=79*Math.PI/180;
// Arcade tempo: şutun ekrandaki hızı (×; yörünge ve gol/kurtarış sonucu değişmez, oynatma sıkışır) ve
//   kaleci dalış animasyonunun en çok hızlanma katı (hızlı topa da tam uzanma zamanında yetişsin)
const MOMENT3D_ARCADE_SHOT=2.2, MOMENT3D_DIVE_K_MAX=RIG3D_DIVE_K_MAX;   // (rig3d.js daha önce yüklenir)
// Adım 16: şut 2.5D'de ok gibi sert gitsin → ekrandaki şut oynatması ayrıca ×2.2 (sonuç fiziği aynı)
const MOMENT3D_SHOT_HARD=2.2;
const MOMENT3D_SHOT_FAST=2.9;      // şut topu oynatma hızı ek çarpanı (2.5D kuşbakışı şut: sert, akıcı)
// Adım 17: vuruş ekranında topun
//   çevresindeki çim yaprağı sayısı ve yarıçapı (m)
const MOMENT3D_TUFT_N=420, MOMENT3D_TUFT_R=1.7;
// Sapan (çekiş oranı f: 0–1, ekranın kısa kenarının %34'ü = 1):
//   • Açık oyun: HEP YEŞİL sürme oku; parmak ekrandayken gerçek zamanlı sürer (f, DRIB_F'de
//     doyar: tam hız). Şut yalnız sağ alttaki ŞUT düğmesiyle (doğrudan vuruş ekranı).
//   • Duran top: KIRMIZI vuruş oku, güç = f·100 → tatlı bölge (40–80) f≈0.4–0.8, >90 isabetsiz.
const MOMENT3D_DRIB_F=0.4;
const MOMENT3D_DRIB_MIN=3, MOMENT3D_DRIB_MAX=12;   // yeşil ok = top sürme mesafesi (m)
// Orta inişinde topun alt yüksekliği (m): gerçek boydaki oyuncunun kafa vuruşu (sıçramayla ~2 m)
const MOMENT3D_CROSS_Y=1.6;
const MOMENT3D_STRIKE_SEC=4;       // vuruş ekranında dokunulmazsa düz vuruş (gerçek zaman, sn)
const MOMENT3D_SPIN_CURL=0.32;     // vuruş ekranı: topun kenarı → kavis (rad, + = sağa)
// NSM tarzı dinamik hedef: vuruş noktası yalnız kavisi değil NİHAİ HEDEFİ de değiştirir. Topun sağına
//   vuruş hedefi sola (soluna vuruş sağa) kaydırır, top açılı çıkıp kavisle oraya döner. Kayma 16 m
//   şutta MOMENT3D_SPIN_AIM m, mesafeyle orantılı (0.45×…1.6×). Alt/üst (yükselme/sertlik) shotLaunch'ta.
const MOMENT3D_SPIN_AIM=1.7;
// Doğal sapma (şut reytingi): 1σ yanal ≈ (100−şut)/100 × MOMENT3D_SHOT_DEV_Z m, dikey × _Y m.
//   85 şutta ~0.1 m (fark edilmez), 55 şutta ~0.3 m — vuruş organik, sürpriz ama kontrol oyuncuda.
const MOMENT3D_SHOT_DEV_Z=0.65, MOMENT3D_SHOT_DEV_Y=0.3;
// Vuruş ekranı kamerası: topun gerisi / yüksekliği (m, top→hedef ekseninde, yanal kayma yok) ve
//   topun ekrandaki dikey yeri (NDC: −1 alt kenar, 0 merkez) → top alt ortada tam görünür
// Kilit an HUD'u: yarı saydam "cam" katmanlar (backdrop-filter + -webkit- öneki). Bulanıklaştırma
//   desteklenmiyorsa (eski WebView) daha koyu, neredeyse düz zemin → yazı yine okunur.
const MOMENT3D_GLASS_OK=typeof CSS!=="undefined"&&!!CSS.supports&&(CSS.supports("backdrop-filter","blur(4px)")||CSS.supports("-webkit-backdrop-filter","blur(4px)"));
const MOMENT3D_GLASS={background:MOMENT3D_GLASS_OK?"rgba(12,18,28,.46)":"rgba(12,18,28,.84)",
  backdropFilter:"blur(10px) saturate(150%)",WebkitBackdropFilter:"blur(10px) saturate(150%)",
  border:"1px solid rgba(255,255,255,.16)",boxShadow:"0 4px 16px rgba(0,0,0,.32),inset 0 1px 0 rgba(255,255,255,.08)"};
// Kenar boşluğu: çentik/gezinme çubuğu (safe-area) payı ile en az 10 px
const MOMENT3D_SAFE_R="max(10px, env(safe-area-inset-right, 0px))", MOMENT3D_SAFE_B="max(10px, env(safe-area-inset-bottom, 0px))";
// Vuruş ekranı yörünge önizlemesinin nokta sayısı
const MOMENT3D_PREVIEW_N=96;
// Vuruş ekranı sürüklemesinde pointercancel'ın vuruş sayılması için en az basılı tutma süresi (sn)
const MOMENT3D_STRIKE_CANCEL_SEC=1;
// Orta vuruş ekranı bakış hedefi: kale çizgisinden bu kadar (m) önde, kale ile penaltı noktası arası
const MOMENT3D_CROSS_LOOK=6;
// Kavis önizleme şeridi: yarı genişlik (m) ve örnek aralığı (m)
const MOMENT3D_PREVIEW_W=0.21, MOMENT3D_PREVIEW_STEP=0.5;   // Adım 16: şerit biraz daha kalın ve parlak (nişan/falso çizgisi)
// (top küçüldü: yarıçap 0.2 m → kamera topa yakın, dokunulacak top ekranda yine büyük)
const MOMENT3D_STRIKE_BACK=2.4, MOMENT3D_STRIKE_UP=1.25, MOMENT3D_STRIKE_BALL_NDC=-0.68;   // Adım 17: biraz yüksek, ufka paralele yakın (eğim ~3°)
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
  // Ceza sahası içi karambol: kalabalık, sekip gelen top; hızlı karar (bas-vur ya da bırak)
  scramble:{
    ball:[87,45], carrier:[86.2,45.6],
    mates:[[90,57],[84,35],[80,52]],
    opps:[[88.6,47.8],[89.4,53.5],[86.2,40.5],[91.5,44],[84.2,49.5]],
    gk:[98.2,50],
    cam:{h:28,look:[40,-2]},
  },
  // Kanat ortası: kanatta topla oyuncu, ceza sahasında arkadaşlar (ORTA düğmesi → kafa vuruşu)
  cross:{
    ball:[80,10], carrier:[79,9.5],
    mates:[[91,45],[89,57],[86,50],[78,34]],
    opps:[[92,47],[90,55.5],[87,52.5],[93.5,50.5],[84,14]],
    gk:[98.6,50],
    cam:{h:36,look:[36,-12]},
  },
  // Ara pası: orta sahada topla oyuncu, savunma çizgisinin önünde forvet (koşu yolu + ara pası → birebir)
  through:{
    ball:[62,48], carrier:[61,48],
    mates:[[74.5,40],[71,66],[57,30]],
    opps:[[77,44],[77,57],[73,30],[65,58]],
    gk:[97.5,50],
    cam:{h:38,look:[22,0]},
  },
  // Uzaktan şut fırsatı: ceza sahası çizgisinin 5–10 m dışı (top kaleye ~25 m), savunma geride.
  //   Başlangıç mesafesi ayrıca moment3dFitLongshot ile 22–28 m'ye kırpılır.
  longshot:{
    ball:[76.2,46], carrier:[75.2,46],
    mates:[[87.2,30],[89.2,66],[71.2,64]],
    opps:[[86.2,44],[87.7,56],[84.2,63],[80.2,36]],
    gk:[98.5,50],
    cam:{h:34,look:[35,0]},
  },
  tackle:{
    ball:[31,42], attacker:[30.2,42], runTo:[10,49],
    carrier:[21,57],                                  // bizim savunmacı (moment.player)
    mates:[[15,36],[16,66]], myGk:[1.8,50],
    opps:[[25,26],[36,64]],
    cam:{h:34,look:[-27,-2]},                         // kuşbakışı: savunmacı + rakip + kalemiz
  },
};

// Uzaktan şut başlangıç mesafesi (m, top → kale ağzı ortası): ceza sahası çizgisinin 5–10 m dışı
const MOMENT3D_LONG_MIN=22, MOMENT3D_LONG_MAX=28;
// "Uzaktan Şut" dizilimini kaleye MOMENT3D_LONG_MIN–MAX m'ye kırpar: top, oyuncumuz, arkadaşlar ve
//   rakip savunma X'te birlikte kaydırılır (göreli düzen korunur; kaleci yerinde). Tablo
//   değişse bile ~14 m'den başlayan bir pozisyon bu etiketi asla almaz. Saf fonksiyon (kopya döner).
function moment3dFitLongshot(lay){
  if(!lay||!Array.isArray(lay.ball)) return lay;
  const L=PITCH3D_DIM.halfLen, w=pitchToWorld3D(lay.ball[0],lay.ball[1]);
  const dz=w.z, d=Math.hypot(L-w.x,dz);
  const want=Math.max(MOMENT3D_LONG_MIN,Math.min(MOMENT3D_LONG_MAX,d));
  if(!Number.isFinite(d)||Math.abs(want-d)<0.01) return lay;
  const gx=Math.sqrt(Math.max(0,want*want-dz*dz));     // istenen kaleye X uzaklığı
  const shift=((L-w.x)-gx)/PITCH3D_LEN*100;               // saha yüzdesi (+ = kaleye doğru)
  const sh=(p)=>[Math.max(1,Math.min(99,p[0]+shift)),p[1]];
  return Object.assign({},lay,{ball:sh(lay.ball),carrier:sh(lay.carrier),
    mates:(lay.mates||[]).map(sh),opps:(lay.opps||[]).map(sh)});
}

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
  scramble:{shot:"poke",   pass_shot:"lay",   cross:"lay",    pass_cross:"lay",    carry:"turn", timeout:"poke"},
  cross:   {shot:"cut",    pass_shot:"low",   cross:"high",   pass_cross:"low",    carry:"cut",  timeout:"high"},
  through: {shot:"finish", pass_shot:"ball",  cross:"ball",   pass_cross:"ball",   carry:"finish",timeout:"finish"},
  longshot:{shot:"power",  pass_shot:"work",  cross:"work",   pass_cross:"work",   carry:"curl", timeout:"power"},
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
  const type=cfg.type, lay=type==="longshot"?moment3dFitLongshot(MOMENT3D_LAYOUTS[type]):MOMENT3D_LAYOUTS[type];
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
  const shortN=(n)=>matchLabelName3D(n);   // saha etiketi kısa adı (three3d.js; canlı akışla aynı kural)
  const pname=P.n||"Oyuncumuz";
  const oppStr=clamp(num(cfg.oppStr,70),40,99);
  const drb=num(P.spd,60)*0.6+num(P.ovr,65)*0.4;              // dribling yeterliliği
  const defSk=num(P.def,60)*0.6+num(P.ovr,65)*0.4;
  const shotSk=clamp(num(P.sht,num(P.att,num(P.ovr,65))),30,99);   // şut reytingi (doğal sapma)
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
    // Baraj oyuncuları gerçek insan boyunda (h, m: kale yüksekliğinin ~%74.5'i ≈ 1.82 m; players3d ölçekler)
    const sn={id:snapList.length,x:p100[0],y:p100[1],role};
    if(kind==="wall") sn.h=PITCH3D_DIM.goalHeight*0.745;
    snapList.push(sn);
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
    // Adım 15: kaleci tam kale çizgisinde başlar (öne çıkmaz)
    const gw0=wp([lay.gk[0],gy]), gp0=worldToPitch3D(L-MOMENT3D_GK_LINE,gw0.z);
    gk=add(away,opp,"away",[gp0.x,gp0.y],"GK","gk","");
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
  // camOrient: "z" = saha boyu dikey (kamera −x tarafında, hücum edilen +X kalesi ekranın ÜSTÜNDE).
  //   Adım 16: SABİT dikey (NSM tarzı) — korner/kanat/frikik/kontra dahil her kilit anda ve yatay
  //   ekranda da kamera yana dönmez ("x" dalı kullanılmıyor, eski kod yolu olarak duruyor).
  const camOrient="z";
  // Adım 17 — yörünge (orbit/tilt): yaw = hedef çevresinde dönüş (0 = kamera −X tarafında, kale üstte),
  //   el = yükseklik açısı. Boş alandan sürükleme hedefleri (tyaw/tel) değiştirir; hook yumuşak izler.
  //   Ekran→saha dönüşümü (raycast) gerçek kameradan yapıldığı için dönükken de doğru çalışır.
  const camOrbit={yaw:0,el:MOMENT3D_ORBIT_EL0,tyaw:0,tel:MOMENT3D_ORBIT_EL0};
  const orbitDefault=()=>Math.abs(camOrbit.tyaw)<1e-3&&Math.abs(camOrbit.tel-MOMENT3D_ORBIT_EL0)<1e-3;
  const overheadCam=(fx,fz,h,snap)=>{
    const o=camOrient, yaw=camOrbit.yaw, el=camOrbit.el;
    if(Math.abs(yaw)<1e-4&&Math.abs(el-MOMENT3D_ORBIT_EL0)<1e-4){
      if(o==="z") setCam(fx-h*0.2,h,fz,fx,0,fz,!!snap,false);
      else setCam(fx,h,fz+h*0.2,fx,0,fz,!!snap,false);
      return;
    }
    // Varsayılanla aynı uzaklık (h·√1.04); alçak eğimde yaklaşır (saha kutusu kırpması az, izometrik his)
    const t=clamp((el-MOMENT3D_ORBIT_EL_MIN)/(MOMENT3D_ORBIT_EL0-MOMENT3D_ORBIT_EL_MIN),0,1);
    const R=h*1.0198*(0.62+0.38*t), ce=Math.cos(el)*R;
    setCam(fx-Math.cos(yaw)*ce,Math.sin(el)*R,fz-Math.sin(yaw)*ce,fx,0,fz,!!snap,false);
  };
  // Kadraj: verilen noktaları (dünya x,z) ekranda tutacak odak + yükseklik (orta mesafe, en çok MOMENT3D_CAM_MAX_H).
  //   Yatay ekranda saha boyu (x) yatay eksende, dikeyde z yatay eksende. %12 kenar payı.
  const TAN_V=Math.tan((PITCH3D_FOV*Math.PI/180)/2);   // kuşbakışı temel görüş açısı (pitch3d.js)
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
    // Kale kadrajdaysa yatay odak kale eksenine (z=0) çekilir → kale ekranın üst-ORTASINDA kalır;
    //   kutu yine tamamen sığsın diye yarı genişlik yeni merkeze göre ölçülür (kanatta biraz uzaklaşır)
    if(frameGoal) out.z*=0.3;
    const hx=(frameBox.x1-frameBox.x0)/2+3, hz=Math.max(frameBox.z1-out.z,out.z-frameBox.z0)+3;
    // halfH/halfV: ekranın yatay / dikey eksenine düşen yarı boy (m)
    const need=(halfH,halfV)=>Math.max(halfH/(TAN_V*asp*0.88),halfV/(TAN_V*0.88));
    const hX=need(hx,hz), hZ=need(hz,hx);
    // Orta mesafe: kadraj kutusu (kenar payıyla) tam sığar; en az lay.cam.h, en çok MOMENT3D_CAM_MAX_H
    out.h=clamp(Math.max(camH,camOrient==="z"?hZ:hX)*MOMENT3D_ZOOM,camH,MOMENT3D_CAM_MAX_H);
    // Adım 17 (korner/kanat): yükseklik tavana takılınca kale çekişi topu/topa sahip oyuncuyu ekran
    //   dışına itebiliyordu. Zorunlu noktalar (frameMust: top + oyuncumuz) görünür pencerede kalacak
    //   şekilde odak yatayda (z) ve dikeyde (x) kaydırılır; kale kısmen kadraj dışına kayabilir.
    //   Odak hook'ta yumuşak izlendiği için kayma akıcıdır (lerp).
    if(frameMust.n&&Math.abs(camOrbit.yaw)<0.3){
      const wz=Math.max(2,out.h*TAN_V*asp*0.88-2.5), wx=Math.max(2,out.h*TAN_V*0.88-2.5);
      const zlo=frameMust.z1-wz, zhi=frameMust.z0+wz;
      out.z=zlo<=zhi?clamp(out.z,zlo,zhi):(frameMust.z0+frameMust.z1)/2;
      const xlo=frameMust.x1-wx, xhi=frameMust.x0+wx;
      out.x=xlo<=xhi?clamp(out.x,xlo,xhi):(frameMust.x0+frameMust.x1)/2;
    }
    return out;
  };
  // Kadraja alınacaklar: top + oyuncumuz + (yakın) takım arkadaşları + koşu yolu; savunmada
  //   savunmacı + rakip + şut noktası. Topa 45 m'den uzak arkadaşlar sayılmaz (aşırı uzaklaşmasın).
  let frameGoal=false;   // rakip kale ağzı kadraja eklendi (frameFit yatay odağı kaleye çeker)
  const frameMust={x0:0,x1:0,z0:0,z1:0,n:0};   // her koşulda ekranda kalması gerekenler
  const frameCollect=(c)=>{
    frameBox.n=0; frameGoal=false;
    frameAdd(B.x,B.z); frameAdd(c.x,c.z);
    frameMust.x0=Math.min(B.x,c.x); frameMust.x1=Math.max(B.x,c.x);
    frameMust.z0=Math.min(B.z,c.z); frameMust.z1=Math.max(B.z,c.z); frameMust.n=2;
    if(isTackle&&att){ frameAdd(att.x,att.z); if(runW) frameAdd(runW.x*0.5+att.x*0.5,runW.z); }
    // Kadraj: topa MOMENT3D_FRAME_MATE_R m içindeki (pas verilebilir) arkadaşlar (pasta alıcı ve iniş noktası her zaman)
    for(let i=0;i<home.length;i++){ const m=home[i]; if(m.kind==="gk") continue; if(Math.hypot(m.x-B.x,m.z-B.z)<MOMENT3D_FRAME_MATE_R) frameAdd(m.x,m.z); }
    if(phase==="pass"&&home[passInfo.r]){ frameAdd(passInfo.px,passInfo.pz); frameAdd(home[passInfo.r].x,home[passInfo.r].z); }
    if(run.idx>=0&&run.pts.length) { const e=run.pts[run.pts.length-1]; frameAdd(e.x,e.z); }
    // Hücumda rakip kale ağzı da kadrajda (top kaleye MOMENT3D_FRAME_GOAL_D m'den yakınsa): nereye
    //   oynandığı her an görünsün. Savunmada (tackle) kendi kalemiz zaten şut noktasıyla gelir.
    if(!isTackle&&(isPen||type==="oneonone"||Math.hypot(L-B.x,B.z)<MOMENT3D_FRAME_GOAL_D)){ frameAdd(L,-GW); frameAdd(L,GW); frameGoal=true; }
    if(shotView){ frameAdd(L+1,-GW-1.5); frameAdd(L+1,GW+1.5); }
  };
  const fitTmp={x:0,z:0,h:camH};
  let shotView=false;   // şut 2.5D'de izleniyor: kadrajda kale ağzı da var
  const focus={x:cl[0],z:cl[1],h:camH};
  overheadCam(cl[0],cl[1],78,true);          // giriş: yüksekten kadraja iner
  const strikeCam={x:0,z:0,tx:0,tz:0};       // vuruş kamerası: top konumu + hedef
  // Vuruş ekranı kamera pozu (tahsis yok): top→hedef ekseninde topun MOMENT3D_STRIKE_BACK m
  //   gerisi, MOMENT3D_STRIKE_UP m yukarısı. Kamera saha kutusuna kırpılırsa (köşe/çizgi kenarı)
  //   bakış kırpılmış konumdan topun içinden geçer → top yine yatayda tam ortada kalır.
  //   Dikey bakış: top ekranın alt ortasında (NDC y = MOMENT3D_STRIKE_BALL_NDC), kale ve kaleci
  //   üst ortada. Şutta dikey ekranda görüş açısı kale ağzı (+ kaleci dalış payı) sığacak kadar açılır.
  const strikeTmp={px:0,py:0,pz:0,lx:0,ly:0,lz:0,fov:PITCH3D_FOV};
  const strikeCamV={x:0,y:0,z:0};
  //   kind: "shot" (ya da true) | "cross" | diğer. ORTA: kanattan orta, iniş noktasına bakınca kamera
  //   çoğu kez boş tribüne bakıyordu (iniş noktası kanattan sahaya dik). Ortada kamera ekseni topun
  //   arkasından kale ile ceza sahası merkezi arasına (MOMENT3D_CROSS_LOOK) çapraz bakar; kale ağzı,
  //   iniş noktası ve top aynı kadraja sığacak kadar yatay açı açılır, sığmıyorsa bakış (top ekranda
  //   kalmak şartıyla) noktaların ortasına döndürülür. Kamera çizgiye/köşeye kırpılınca da aynı hesap.
  const crossFit={pts:new Float64Array(8)};
  const strikePose=(bx,bz,tx,tz,shot,out)=>{
    const isShot=shot===true||shot==="shot", isCross=shot==="cross";
    const ltx=isCross?L-MOMENT3D_CROSS_LOOK:tx, ltz=isCross?clamp(tz*0.2,-4,4):tz;
    let ux=ltx-bx, uz=ltz-bz; const ul=Math.hypot(ux,uz)||1; ux/=ul; uz/=ul;
    pitch3dSafeCam(bx-ux*MOMENT3D_STRIKE_BACK,MOMENT3D_STRIKE_UP,bz-uz*MOMENT3D_STRIKE_BACK,strikeCamV,0.55,PITCH3D_CAM_LOW_Y,undefined);
    const cx=strikeCamV.x, cy=strikeCamV.y, cz=strikeCamV.z;
    let fov=PITCH3D_FOV, rot=0;
    if(isCross){
      // Kadraja girmesi gereken noktalar (kameradan, top yönüne göre açı): iki direk + iniş noktası
      const asp=Math.max(0.3,camAsp());
      let hx0=bx-cx, hz0=bz-cz; const d0=Math.hypot(hx0,hz0)||1; hx0/=d0; hz0/=d0;
      const P8=crossFit.pts; P8[0]=L; P8[1]=-GW; P8[2]=L; P8[3]=GW; P8[4]=tx; P8[5]=tz; P8[6]=L-11; P8[7]=0;
      let amin=0, amax=0;                                     // 0 = top (ekranda kalmalı)
      for(let i=0;i<8;i+=2){
        const px=P8[i]-cx, pz=P8[i+1]-cz;
        const a=Math.atan2(hx0*pz-hz0*px,hx0*px+hz0*pz);
        if(Math.abs(a)>1.45) continue;                        // kameranın arkası: sayılmaz
        if(a<amin) amin=a; if(a>amax) amax=a;
      }
      const halfMax=Math.atan(Math.tan(66*Math.PI/360)*asp);  // en geniş yatay yarı açı (fov 66°)
      const half=Math.min(halfMax,(amax-amin)/2+0.07);
      rot=(amax+amin)/2;                                     // bakış noktaların ortasına
      const ballLim=half-0.06; rot=clamp(rot,-ballLim,ballLim);   // top kadrajda kalır
      fov=clamp(2*Math.atan(Math.tan(half)/asp)*180/Math.PI,PITCH3D_FOV,66);
    }
    if(isShot){
      // Yatay yarı açı ≥ (kale yarı genişliği + 1.4 m) / (kameradan kale çizgisine uzaklık)
      const asp=Math.max(0.3,camAsp()), dG=Math.max(6,Math.hypot(L-cx,0-cz));
      const tanV=((GW+1.4)/dG)/asp;
      fov=clamp(2*Math.atan(tanV)*180/Math.PI,PITCH3D_FOV,64);
    }
    const ballY=(Number.isFinite(B.y)?B.y:0)+(Number.isFinite(BALL_R)?BALL_R:0.42);
    let hx=bx-cx, hz=bz-cz; let dh=Math.hypot(hx,hz);
    if(dh<0.5){ hx=ux; hz=uz; dh=1; }            // güvenlik: kamera topun üstüne düşerse eksen yönü
    hx/=dh; hz/=dh;
    if(rot){ const c=Math.cos(rot), s=Math.sin(rot), rx=hx*c-hz*s, rz=hx*s+hz*c; hx=rx; hz=rz; dh=Math.max(0.5,dh*Math.cos(rot)); }
    const angBall=Math.atan2(cy-ballY,Math.max(0.5,dh));                 // topa aşağı bakış açısı
    const alpha=Math.atan(-MOMENT3D_STRIKE_BALL_NDC*Math.tan(fov*Math.PI/360)); // top, ekran merkezinin bu kadar altında
    const pitch=angBall-alpha;                                            // kameranın aşağı eğimi (+ = aşağı)
    const sp=Math.sin(pitch), cp=Math.cos(pitch);
    // Bakış noktası yerin üstünde kalmalı (Pitch3D tLook.y<0'ı 0'a kırpar → eğim bozulurdu)
    const R=sp>0.01?Math.min(12,(cy-0.05)/sp):12;
    out.px=cx; out.py=cy; out.pz=cz;
    out.lx=cx+hx*cp*R; out.ly=cy-sp*R; out.lz=cz+hz*cp*R;
    out.fov=fov;
    return out;
  };

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
  // 2.5D odak çemberi: topa sahip oyuncunun pas/koşu menzili (yarı saydam açık dolgu + kenar)
  // Adım 17: dolgu yumuşak kenarlı (radyal alphaMap: içte hafif, kenara doğru belirginleşip söner)
  const focusTex=(()=>{
    try{
      const N=128, c=document.createElement("canvas"); c.width=N; c.height=N;
      const g=c.getContext("2d"); if(!g||!g.createRadialGradient) return null;
      const gr=g.createRadialGradient(N/2,N/2,0,N/2,N/2,N/2);
      gr.addColorStop(0,"#5a5a5a"); gr.addColorStop(0.78,"#8c8c8c"); gr.addColorStop(0.93,"#ffffff"); gr.addColorStop(1,"#000000");
      g.fillStyle=gr; g.fillRect(0,0,N,N);
      return new THREE.CanvasTexture(c);
    }catch(e){ return null; }
  })();
  const focusFillMat=basic(0xf2fbff,focusTex?0.2:0.07), focusEdgeMat=basic(0xffffff,0.22);
  if(focusTex){ focusFillMat.alphaMap=focusTex; focusFillMat.needsUpdate=true; }
  // Topa sahip oyuncunun altında dolu takım diski (uzaktan "top kimde" net okunur)
  const ctlDiscMat=basic(teamCol,0.5);
  const ctlDisc=new THREE.Mesh(G(flat(new THREE.CircleGeometry(1.15,28))),ctlDiscMat); ctlDisc.position.y=0.06; ctlDisc.renderOrder=3; group.add(ctlDisc);
  const focusFill=new THREE.Mesh(G(flat(new THREE.CircleGeometry(MOMENT3D_FOCUS_R,72))),focusFillMat);
  const focusEdge=new THREE.Mesh(G(flat(new THREE.RingGeometry(MOMENT3D_FOCUS_R-0.18,MOMENT3D_FOCUS_R,96))),focusEdgeMat);
  focusFill.position.y=0.04; focusEdge.position.y=0.05; focusFill.renderOrder=2; focusEdge.renderOrder=3;
  focusFill.visible=false; focusEdge.visible=false;
  group.add(focusFill); group.add(focusEdge);
  const focusC={x:0,z:0,on:false};
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
  let introT=0, playT=0, timeLeft=MOMENT3D_TIME_SEC, passes=0, ctl=0, carried=0, dribRefill=0;
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
  let passMode=false, forceShot=false, forceCross=false, outT=0;
  // Son yeşil sürme okunun yönü (parmak ekrandayken her karede güncellenir) → ŞUT hizası
  const lastDrib={dx:1,dz:0,t:-99};
  // ŞUT düğmesi bölgesi: rakip yarı saha ve kaleye ≤ MOMENT3D_SHOT_MAX_D · ORTA: kanat oyunu
  const shotZoneOk=()=>!isTackle&&B.x>0&&Math.hypot(L-B.x,B.z)<=MOMENT3D_SHOT_MAX_D;
  const crossZoneOk=()=>type==="cross"&&Math.abs(B.z)>12&&B.x>L*0.3;
  let shotOk=false, crossOk=false;
  // Koşu yolu: idx = koşan takım arkadaşı, pts = rota (dünya), i = sıradaki nokta
  const run={idx:-1,pts:[],i:0};
  const draw={on:false,idx:-1,pts:[],len:0};   // çizilmekte olan rota
  const hold={on:false,t:0};          // tackle: uzun basış (faul) göstergesi
  const passInfo={r:-1,px:0,pz:0,T:0,t:0,cut:false,cutter:-1,cx:0,cz:0,tc:0,lofted:false,bx0:NaN,bz0:NaN};
  const cls={kind:"",zHit:0,lx:0,lz:0};
  const riskList=[];                  // rakip riskleri (ajanların rw nesneleri, yeniden kullanılır)
  const shotPts=[]; for(let i=0;i<12;i++) shotPts.push({x:0,z:0});
  const ctlA=()=>home[ctl];
  const flash=(m)=>{ flashMsg=m; flashT=2.2; hud(); };
  // ── Zaman duraklatma (Adım 16, NSM tarzı) ──
  //   Kilit an açılınca ve pas alan arkadaş topu kontrol edince zaman DONAR: süre işlemez,
  //   savunmacılar/arkadaşlar yerinde kalır (pres yok). Kullanıcı top sürmeye, pas/koşu yolu
  //   seçmeye ya da vuruşa başladığı an (hook'taki koşul) akış yeniden başlar. Savunma anında yok.
  let isTimeFrozen=false;
  const freezeTime=(on)=>{
    on=!!on&&!isTackle&&!outcome;
    if(on===isTimeFrozen) return;
    isTimeFrozen=on;
    if(on){ for(let i=0;i<away.length;i++){ away[i].vx=0; away[i].vz=0; } for(let i=0;i<home.length;i++){ home[i].vx=0; home[i].vz=0; } }
    hud();
  };

  // ── HUD: yalnızca değişince React'a bildir (her karede setState yok) ──
  const hintFor=()=>{
    const h=hintBase();
    return isTimeFrozen&&h?"⏸ Zaman durdu · "+h:h;
  };
  const hintBase=()=>{
    if(phase==="intro") return "Hazırlan…";
    if(phase==="strike") return pend.kind==="cross"?"Topa dokun: orta = düz · sağdan vur = sola kavis · soldan = sağa · alt = yüksek orta"
      :pend.kind==="lpass"?"Topa dokun: havadan uzun pas"
      :"Topa dokun: orta = düz · sağdan vur = sola kavis · soldan = sağa · alt = aşırtma · üst = sert";
    if(aim.on){
      if(isTackle) return aim.len>MOMENT3D_SLIDE_LEN?"Bırak: kayarak müdahale · geri getir: iptal"
        :"Bırak: ayakta müdahale · uzat: kayarak";
      if(aim.mode==="drib") return "Basılı tut: sürer · kaydır: yön · bırak: dur";
      return "Bırak: vuruş ekranı · halkaya geri getir: iptal";
    }
    if(draw.on) return "Koşu yolunu çiz, bırak";
    if(phase==="pass") return "Pas…";
    if(phase==="anim"||phase==="done") return "";
    if(isTackle) return "Rakibe ok çiz: kısa = ayakta, uzun = kayarak · uzun bas: faul";
    if(isPen) return "Topa bas, geri çek, bırak → vuruş ekranı";
    if(run.idx>=0&&phase==="play") return "Rotaya dokun: ara pası · ŞUT: vuruş";
    if(passMode) return "Arkadaşa dokun: pas · arkadaştan sürükle: koşu yolu";
    if(phase==="set") return "Arkadaşa dokun: pas · topa basıp geri çek: orta/şut";
    if(crossOk) return "ORTA: kafa vuruşu · PAS · geri çek: sür";
    if(!shotOk) return "Geri çek: sür · PAS · arkadaştan sürükle: koşu yolu";
    return "Geri çek: sür · PAS · ŞUT: vuruş ekranı";
  };
  const sdrag={on:false,id:null,sx:0,sy:0,t0:0};   // vuruş ekranı önizleme sürüklemesi (hud okur)
  // Yörünge sürüklemesi durumu: pan = sürükleme sürüyor, lx/ly = son parmak konumu, tapT = çift dokunma
  const camPan={pan:false,lx:0,ly:0,tapT:-9,hinted:false};
  const resetPan=()=>{ camOrbit.tyaw=0; camOrbit.tel=MOMENT3D_ORBIT_EL0; };
  const hud=()=>{
    const h={phase,hint:flashT>0?flashMsg:hintFor(),passes,
      touchUi,aiming:aim.on||draw.on,tackle:isTackle,strikeKind:pend.kind,passMode,setPiece:!!setPiece,shotOk,crossOk,
      strikeHold:sdrag.on};
    const k=h.phase+"|"+h.hint+"|"+h.passes+"|"+h.touchUi+"|"+h.aiming+"|"+h.strikeKind+"|"+h.passMode+"|"+h.shotOk+"|"+h.crossOk+"|"+h.strikeHold;
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
  const DIST_REF=type==="freekick"||type==="longshot"?20:11;
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
    if(forceCross&&!isPen){   // ORTA düğmesi: kanattan her zaman orta (iniş penaltı noktası çevresi)
      const f=0.73+clamp(power,0,100)*0.0045, t=Math.max(8,(L-10-bx)*dx-bz*dz)*f;
      cls.kind="cross"; cls.lx=clamp(bx+dx*t,-L+1,L-1); cls.lz=clamp(bz+dz*t,-H+1,H-1); return cls;
    }
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
  let nextDist=NaN;   // vuruş noktası → kale mesafesi (m); orta/kafada kafa noktası (emit öncesi ayarlanır)
  const emit=(o)=>{
    if(o&&!outcome){ o.dist=Math.round((Number.isFinite(nextDist)?nextDist:Math.hypot(L-B.x,B.z))*10)/10; nextDist=NaN; }
    if(outcome) return false;
    outcome=o; phase="anim"; aim.on=false; hold.on=false; timeScale=1;
    pend.on=false; drib.on=false; draw.on=false;
    try{ hidePreview(); }catch(_){}   // (kurulum sırasında henüz tanımsız olabilir)
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
  // Oyuncu kapsülü: yarıçap + eksen (m). Oyuncular gerçek boyda (~1.82 m) → kapsül tepesi
  //   BODY_Y1+BODY_R ≈ 1.95 m (baraj sıçraması payıyla); eskiden büyük rig için 3.25 m idi
  const BODY_R=0.4, BODY_Y0=0.15, BODY_Y1=1.55;
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
  // Dinamik nihai hedef (kale çizgisi z): vuruş noktası yanal ofseti (spin.x) hedefi ters yöne kaydırır
  const aimShift=(x0,z0,zHit)=>{
    const d=Math.hypot(L-x0,zHit-z0);
    return zHit-spin.x*MOMENT3D_SPIN_AIM*clamp(d/16,0.45,1.6);
  };
  // Yaklaşık normal dağılımlı sapma (−1…1 üç örneğin ortalaması ×√3 değil: hafif, kuyruksuz)
  const devN=()=>(Math.random()+Math.random()+Math.random()-1.5)/0.5;
  const fxEvent=(e)=>{
    if(e.type==="block") actors.ringFx(e.x,e.z,0xe74c3c,0.7,4);
    else if(e.type==="post"){ actors.shakeGoal(1); actors.ringFx(e.x,e.z,0xffffff,0.6,3); }
    else if(e.type==="save") actors.ringFx(e.x,e.z,0xffffff,0.6,3);
    else if(e.type==="goal"){ actors.goalFx(1,e.z,"home"); try{ cfg.onGoalFx&&cfg.onGoalFx(); }catch(_){} }
    try{ cfg.onSfx&&cfg.onSfx(e.type); }catch(_){}
  };
  // Engeller: tüm saha oyuncuları (vuran ve skip hariç) — vuruş anındaki yerleriyle.
  //   Başlangıçta topla iç içe olan (topun dibindeki) oyuncu, top ondan ayrılana dek yok sayılır.
  //   moved (isteğe bağlı Map ajan→{x,z}): o ana dek yeni yerine gidecek oyuncu (hava topu düellosu)
  //   noIgn: iç içe olan da engel sayılır (kafa vuruşu: kaybedilen düellodaki markajcı)
  const buildBlockers=(x0,y0,z0,skip,moved,noIgn)=>{
    const out=[], R=BODY_R+BALL_R, cy=y0+BALL_R;
    const add=(a)=>{
      if(!a||a.kind==="gk"||a.hid) return;          // sade vuruş ekranında gizlenen oyuncu engel değil
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
  // Arcade tempo: ekrandaki şut hızı ayrıca ×MOMENT3D_ARCADE_SHOT (yörünge/sonuç aynı; yalnız oynatma hızlanır)
  // Adım 16: ×MOMENT3D_SHOT_HARD (2.2) daha sert; kaleci kayma hızları da aynı katla (SHOT_GK_K)
  // MOMENT3D_SHOT_FAST: şut oynatması ek %45 hızlı (sert, tok vuruş). Kaleci tepki/dalış zamanlaması
  //   SHOT_PLAY_K'dan türetildiği için birlikte ölçeklenir (dalış yine topun varışına denk gelir).
  const SHOT_PLAY_K=1.6*MOMENT3D_ARCADE_SHOT*MOMENT3D_SHOT_HARD*MOMENT3D_SHOT_FAST, SHOT_GK_K=MOMENT3D_ARCADE_SHOT*MOMENT3D_SHOT_HARD*MOMENT3D_SHOT_FAST;   // kaleci yer değiştirmesi de top hızıyla senkron
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
    const x0=Math.min(o.x,L-1.2), z0=o.z, y0=Number.isFinite(o.y)?o.y:0;   // şut noktası kaleci düzleminin önünde
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
          // Şut anı: kaleci yerinde donmaz; tepki süresince tahmin ettiği köşeye yan adımla kayar
          //   (doğru okuduysa topun hedef z'sine, aldandıysa öbür yana; en çok 0.7 m), sonra dalar
          { const sv=ev.some(e=>e.type==="save"), czp=Number.isFinite(plan.cz)?plan.cz:clamp(o.tz,-GW,GW);
            const dzp=czp-gkz, sdp=sgn(dzp||(Math.random()-0.5)), dir=(sv||plan.correct)?sdp:-sdp;
            if(kind!=="block") override(gk,gk.x,gkz+dir*Math.min(0.7,Math.max(0.35,Math.abs(dzp)*0.3)),4.5*SHOT_GK_K); }
          // Kaleci şut anında (tepki süresiyle) yatay dalışla uçar: doğru okursa topun / tahmin
          //   noktasının tarafına (erişim içindeyse kurtarır), ters köşeye aldanırsa öbür yana.
          //   Top kaleciye ulaşmadan sekse bile (plan.t yok) hedef noktaya doğru uçar.
          const saved=ev.some(e=>e.type==="save");
          const cz=Number.isFinite(plan.cz)?plan.cz:clamp(o.tz,-GW,GW), cy=Number.isFinite(plan.cy)?plan.cy:1.2;
          const tc=Number.isFinite(plan.t)?plan.t:0.6;
          const dz=cz-gkz, sd=sgn(dz||(Math.random()-0.5)), ad=Math.abs(dz);
          // TEPKİ GECİKMESİ (reactionDelay, görsel zaman): kaleci şut anında değil; top şut
          //   mesafesinin MOMENT3D_GK_SEE_F'i kadar (2–5 m) yol alıp yönü belli olunca, üstüne
          //   refleks süresi (rakip gücü = kalecilik; penaltıda yarısı, tahminle erken) geçince uçar.
          //   Hızlı şutta algı mesafesine daha çabuk varılır; en geç topun varışından 0.15 sn önce.
          const shotD=Math.hypot(L-x0,(Number.isFinite(o.tz)?o.tz:0)-z0);
          const seeD=clamp(shotD*MOMENT3D_GK_SEE_F,2,5);
          let tSee=tc;
          for(let i=1;i<smp.length;i++) if(Math.hypot(smp[i].x-x0,smp[i].z-z0)>=seeD){ tSee=smp[i].t; break; }
          const refl=clamp(0.32-(oppStr-60)*0.004,0.16,0.32)*(isPen?0.5:1)*(plan.correct||saved?1:0.8);
          const tcV=tc/SHOT_PLAY_K;
          // Üst sınır: tam uzanma (dalışın %45'i, en çok MOMENT3D_DIVE_K_MAX× hızla) top varmadan bitmeli
          const tDiveV=Math.max(0,Math.min(tSee/SHOT_PLAY_K+refl,tcV-RIG3D_DIVE_REACH_U*RIG3D_ACT_DUR.dive/MOMENT3D_DIVE_K_MAX));
          const tDive=tDiveV*SHOT_PLAY_K;               // fizik zamanında (aşağıdaki ortak formül)
          // Barajda/yolda kesilen şutta (kaleciye hiç gelmez) kaleci uçmaz, yerinde izler.
          //   Dalış animasyonu da top oynatmasıyla aynı oranda (SHOT_PLAY_K) hızlanır.
          // Dalış hızı: tam uzanma (animasyonun %45'i) topun ekranda kaleciye vardığı ana denk gelir
          const remV=Math.max(0.01,(tc-tDive)/SHOT_PLAY_K);              // dalış başı → topun varışı (görsel sn)
          const dk=clamp(RIG3D_DIVE_REACH_U*RIG3D_ACT_DUR.dive/remV,1,MOMENT3D_DIVE_K_MAX);
          // Çok kısa şut (en hızlı dalışta bile tam uzanma > kalan süre): animasyon ileriden başlar
          //   (t0 kesri) → tam uzanma topun varışına denk gelir. 6× dalışta tam uzanma 0.1125 sn
          //   (görsel). Örnek (×3.52 oynatma): penaltı 11 m güç 70 (26 m/s) tc≈0.44 → tcV≈0.125,
          //   dalış ≈0.01'de, dk≈6, t0=0; güç 100 (32 m/s) tc≈0.36 → tcV≈0.10 → dk=6, t0≈0.05;
          //   birebir ~12 m güç 80 tc≈0.45 → tcV≈0.13 → dk≈6, t0≈0; 25 m uzaktan tc≈1.0 → tcV≈0.28,
          //   refleks sonrası dalış ≈0.17'de → kalan ≈0.11 → dk≈6, t0≈0.
          const dt0=Math.max(0,RIG3D_DIVE_REACH_U-remV*dk/RIG3D_ACT_DUR.dive);
          if(kind!=="block") later(tDive/SHOT_PLAY_K,()=>{
            if(saved||plan.correct){
              const rz=saved?cz:gkz+sd*Math.min(ad,plan.reach);
              if(ad>0.6){ override(gk,gk.x,rz-sd*Math.min(1.9,Math.abs(rz-gkz)*0.8),13*SHOT_GK_K); actors.diveFx("away",gk.idx,gkx,rz,cy,dk,dt0); }
              else override(gk,gk.x,rz,6*SHOT_GK_K);  // tam üstüne: ayakta tutar
            } else {
              override(gk,gk.x,gkz-sd*0.6,7*SHOT_GK_K); actors.diveFx("away",gk.idx,gkx,gkz-sd*2.2,1.0,dk,dt0); // ters köşe
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
    const lv=solveLaunch(x0,z0,y0,lx,lz,MOMENT3D_CROSS_Y,d/T,side||0,top||0);
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

  // Pas hız çarpanı (kickTo/kickTime mul): yer pasında mesafeye göre gerçekçi ortalama hız (yukarıda),
  //   havadan pasta eski çarpan (players3d en az 1.05 sn uçuş tutar)
  const passMulFor=(d,lofted)=>{
    if(lofted) return MOMENT3D_PASS_SPEED;
    const v=clamp(MOMENT3D_PASS_V0+MOMENT3D_PASS_VK*d,MOMENT3D_PASS_VMIN,MOMENT3D_PASS_VMAX);
    const base=actors.passTime?actors.passTime(d,false):d/8;
    return Math.max(1,base/(Math.max(0.5,d)/v));
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
        // kickTo ile AYNI süre (yerden hızlı pasta v0 70 m/sn tavanına takılınca uzayan süre dahil)
        const pm=passMulFor(d,lofted);
        const T=actors.kickTime?actors.kickTime(d,lofted,pm)
          :lofted?Math.max(1.05,clamp(0.75+d*0.03,0.9,2.4)/Math.sqrt(pm)):(actors.passTime?actors.passTime(d,false):d/12)/Math.min(ACTORS3D_KICK_MUL_MAX,pm); // kickTo ile aynı süre
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
    if(api.setTimeScale&&timeScale<1){ timeScale=1; api.setTimeScale(1); }  // bırakıldığı an tam hız
    const T=actors.kickTo(px,pz,lofted,passMulFor(Math.hypot(px-B.x,pz-B.z),lofted));   // 0 ms bekleme, gerçekçi tempo
    passes++; phase="pass"; spin.x=0; spin.y=0; passMode=false; lastDrib.t=-99;
    passInfo.r=ri; passInfo.px=px; passInfo.pz=pz; passInfo.T=T; passInfo.t=0; passInfo.cut=cut; passInfo.lofted=lofted;
    passInfo.cutter=-1; passInfo.bx0=NaN; passInfo.bz0=NaN;
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
      nextDist=Math.hypot(L-c.lx,c.lz);
      emit(mk(cr.goal,key,cr.kind,hName,power,ev.q,rl.chance,cr.goal,false));
      cr.play();
      return true;
    }
    // Şut: aşırı güç (>90, kırmızı) isabetsiz → sapma (zardan önce, kaliteye yansır)
    let zHit=aimShift(B.x,B.z,c.zHit);
    if(power>90) zHit+=(Math.random()*2-1)*(power-88)*0.35;
    const devK=(100-shotSk)/100*(isPen?0.6:1);
    zHit+=devN()*devK*MOMENT3D_SHOT_DEV_Z;
    const ev=evalShot(B.x,B.z,ax,az,zHit,Math.abs(curl),wallUp?0.18:1); // parmak bükmesi; kenar vuruşu evalShot içinde (spin.x)
    let key=passes>0?"pass_shot":"shot";
    if(isPen) key=power>80?"power":"shot"; // güçlü vuruş seçeneği yalnız yeşil bölgenin üstünde (tatlı bölge avantajı olmasın)
    if((type==="oneonone"||type==="scramble"||type==="longshot")&&passes===0&&carried>6) key="carry";
    const rl=roll(key,power,ev.q,false);
    // Sonuç FİZİKTEN: baraj/oyuncu kapsülü → block, direk → post, kaleci erişimi → save,
    // çerçeve dışı → wide; yalnız kalecinin yetişemediği yerden çizgiyi geçen top gol
    const ln=shotLaunch(power);
    ln.ty=Math.max(0.05,ln.ty+devN()*devK*MOMENT3D_SHOT_DEV_Y);
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
  // ── CANLI TOP (NSM tarzı, yalnız akan oyun): vuruş ekranında top YERİNDE kalır (kamera önünde sabit
  //   derinlik → parmak hedefi, vuruş halkası ve yön çizgisi topun merkezinde sabit); yalnız GÖRSEL
  //   olarak kendi ekseninde döner ve hafifçe seker (zamanlama hissi). Topun fizik konumu (B) değişmez.
  //   Duran topta (frikik, penaltı, korner) tamamen hareketsiz. Gerçek zamanla işler (players3d).
  const startStrikeRoll=()=>{
    if(!actors.setBallIdleFx) return;
    if(setPiece||isPen||pend.prev!=="play"){ actors.setBallIdleFx(0,0); return; }
    const bounce=type==="cross"||type==="scramble";                         // orta / karambol: biraz daha canlı
    actors.setBallIdleFx(bounce?3.2:2.2,bounce?0.05:0.025);                   // dönüş (rad/sn), sekme (m)
  };
  const stopStrikeRoll=()=>{ if(actors.setBallIdleFx) actors.setBallIdleFx(0,0); };
  const beginStrike=(dx,dz,power,force)=>{
    if(!canAct()||phase==="strike"||isTackle) return false;
    const l=Math.hypot(dx,dz); if(!(l>1e-4)) return false;
    dx/=l; dz/=l; power=clamp(Number(power)||0,0,100);
    forceShot=force===true; forceCross=force==="cross";
    let c=classify(B.x,B.z,dx,dz,power);
    // Vuruş HER durumda vuruş ekranına geçer; penaltıda uzun pas yönü kaleye yönlendirilir.
    if(c.kind==="lpass"&&(isPen||forceShot)){
      const gx=Math.max(1,L-B.x), gz=clamp(B.z,-(GW-1.2),GW-1.2)-B.z, gl=Math.hypot(gx,gz)||1;
      dx=gx/gl; dz=gz/gl;
      c=classify(B.x,B.z,dx,dz,power);
    }
    forceShot=false; forceCross=false;
    pend.on=true; pend.dx=dx; pend.dz=dz; pend.power=power; pend.kind=c.kind; pend.t=0; pend.prev=phase; pend.force=force===true?true:force==="cross"?"cross":false;
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
    if(gk&&actors.faceToward) actors.faceToward("away",gk.idx,B.x,B.z,0.5); // kaleci ilk karede topa dönük
    strikeSnap=true;                         // kuşbakışından geçişsiz (kesin) çim seviyesine
    phase="strike"; camPan.pan=false; hud();
    startStrikeRoll();                       // akan oyunda top yerinde döner/hafif seker (duran topta sabit)
    try{ updatePreview(0,0); }catch(_){}     // dokunmadan önce düz (kavissiz) yol görünür
    return true;
  };
  // (sx,sy): topun üzerindeki nokta, −1…1 (x>0 sağ kenar, y>0 üst). Merkeze yakın = düz.
  const confirmStrike=(sx,sy)=>{
    if(phase!=="strike"||!pend.on||outcome) return false;
    let x=Number(sx)||0, y=Number(sy)||0; const l=Math.hypot(x,y);
    if(l>1){ x/=l; y/=l; }
    if(l<0.2){ x=0; y=0; }
    spin.x=x; spin.y=y;
    stopStrikeRoll();
    pend.on=false; phase=pend.prev==="set"?"set":"play";
    try{ hidePreview(); }catch(_){}   // (kurulum sırasında henüz tanımsız olabilir)
    // Adım 15: vuruş tetiklendiği karede 3D kamera kapanır → uçuş, falso, kaleci, sonuç 2.5D'de
    strikeLow.on=false; strikeLow.cross=false;
    shotView=pend.kind==="shot";
    { // vurucu topun sol-arkasına (vuruş animasyonu için ≤2.2 m)
      const a=ctlA(); let ux=pend.tx-B.x, uz=pend.tz-B.z; const ul=Math.hypot(ux,uz)||1; ux/=ul; uz/=ul;
      a.x=clamp(B.x-ux*1.0+uz*0.8,-L-2.5,L+2.5); a.z=clamp(B.z-uz*1.0-ux*0.8,-H-2.5,H+2.5); a.vx=0; a.vz=0;
      actors.movePlayer("home",a.idx,a.x,a.z,true);
    }
    // 2.5D'de saha yine dolu: oyuncular görünür ve şut fiziğinde yine engel
    showField();
    forceShot=pend.force===true; forceCross=pend.force==="cross"; // strike() yeniden sınıflar: düğmenin türü korunur
    let ok=false;
    try{ ok=strike(pend.dx,pend.dz,pend.power,0); } finally { forceShot=false; forceCross=false; }
    if(ok){
      // Kuşbakışı anında: top + kale ağzı (+ hedef) kadrajda; geçiş yok
      if(api.setTimeScale){ timeScale=1; api.setTimeScale(1); }
      frameCollect(ctlA()); frameFit(fitTmp);
      focus.x=fitTmp.x; focus.z=fitTmp.z; focus.h=fitTmp.h;
      overheadCam(focus.x,focus.z,focus.h,true);
    }
    if(!ok){
      showField(); shotView=false;
      strikeLow.on=false; spin.x=0; spin.y=0;
      if(pend.owned) actors.setOwner("home",ctlA().idx);  // vuruş olmadı: top yine ayakta
      hud();
    }
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
    showField();
    const a=ctlA(), name=a.name||pname;
    // Süre dolması: sabit en kötü terim · son an vuruşu: konum kalitesine göre (en çok nötr)
    const rl=act==="last_shot"?roll("timeout",20,lastShotQ(),false):roll("timeout",20,0,true);
    if((type==="corner"&&phase==="set")||(type==="cross"&&crossZoneOk())){
      // Kornerde aceleci orta: golde kafayı vuran, aksi halde ortayı yapan oyuncu
      const lx=L-10, lz=0, ev=evalCross(lx,lz), m=home[ev.mate]||a;
      spin.x=0; spin.y=0;
      const cr=physCross(lx,lz,ev.mate,rl.success,0,0);
      nextDist=Math.hypot(L-lx,lz);
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
    // Kaleci: kale çizgisinde (Adım 15), topun tarafına kayar
    if(gk&&!(phase==="pass"&&passInfo.cut&&away[passInfo.cutter]===gk)){
      if(gk.ovr) steer(gk,gk.ox,gk.oz,gk.osp||8,20,20*MOMENT3D_ARCADE_SHOT*MOMENT3D_SHOT_HARD,dt,0.05); // arcade: hızlı şuta yetişen ivme
      else{
        const dx=B.x-L, dz=B.z, d=Math.hypot(dx,dz)||1;
        let tx, tz;
        // Adım 15: kaleci çizgide kalır (öne çıkmaz); topun tarafına çizgi boyunca kayar
        if(isPen){ tx=L-0.3; tz=gk.az; }
        else { tx=L-MOMENT3D_GK_LINE; tz=clamp(B.z*clamp(4/Math.max(4,d),0.1,0.5),-(GW-0.8),GW-0.8); }
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
    // Temas: önceki → şimdiki top konumu parçası (56–70 m/s pas 30 FPS'te kare başı ~2 m: tünellemesin)
    const bx0=Number.isFinite(pi.bx0)?pi.bx0:B.x, bz0=Number.isFinite(pi.bz0)?pi.bz0:B.z;
    pi.bx0=B.x; pi.bz0=B.z;
    if(pi.cut&&away[pi.cutter]){
      const cu=away[pi.cutter];
      steer(cu,pi.cx,pi.cz,8,10,14,dt,0);
      if(r) steer(r,pi.px,pi.pz,VMAX_RUN,8,14,dt,0);
      const db=segPointDist3D(bx0,bz0,B.x,B.z,cu.x,cu.z);
      if(pi.t>=pi.tc&&!pi.lofted&&actors.getBallVel&&actors.isBallFree&&actors.isBallFree()){
        const bv=actors.getBallVel(); if(bv){ const k=Math.exp(-12*dt); bv.x*=k; bv.z*=k; }
      }
      const cuNear=Math.hypot(cu.x-pi.cx,cu.z-pi.cz)<2.5;
      if((db<1.5&&B.y<2)||(pi.t>pi.tc+0.35&&cuNear)||pi.t>pi.tc+1.2){
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
    const db=segPointDist3D(bx0,bz0,B.x,B.z,r.x,r.z);
    const tx=db<4&&B.y<1.3?B.x:pi.px, tz=db<4&&B.y<1.3?B.z:pi.pz;
    steer(r,tx,tz,7.5,8,14,dt,0);
    // Hızlı yerden pas hedef noktaya varınca (alıcı henüz yetişmediyse) top orada yavaşlar:
    //   keskin pas alıcının önünden kaçıp uzaklaşmasın
    if(!pi.lofted&&pi.t>=pi.T&&db>1.3&&actors.getBallVel&&actors.isBallFree&&actors.isBallFree()){
      const bv=actors.getBallVel(); if(bv){ const k=Math.exp(-12*dt); bv.x*=k; bv.z*=k; }
    }
    if((db<1.3&&B.y<1.8)||pi.t>pi.T+1.0){
      actors.setOwner("home",r.idx);
      ctl=pi.r; carried=0; drib.on=false; passMode=false; lastDrib.t=-99;
      if(run.idx===pi.r) clearRun();   // koşan oyuncu topu aldı: rota biter
      phase="play"; guardT=MOMENT3D_GUARD_SEC;
      timeLeft=Math.min(MOMENT3D_TIME_SEC,timeLeft+MOMENT3D_PASS_REFILL*Math.pow(MOMENT3D_PASS_REFILL_DECAY,Math.max(0,passes-1)));
      actors.ringFx(r.x,r.z,teamCol,0.6,3);
      freezeTime(true);                      // arkadaş topu kontrol etti: sıradaki hamleye dek zaman donuk
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
    a.x=clamp(a.x+a.vx*dt,-L+0.6,L-2.5); a.z=clamp(a.z+a.vz*dt,-H+0.6,H-0.6);   // kale çizgisindeki kalecinin içine sürülmez
    if(phase==="set"&&!isPen){ a.x=a.ax; a.z=a.az; a.vx=0; a.vz=0; } // duran top: kıpırdamaz
    if(phase==="play"&&!isTackle){
      const dm=Math.hypot(a.vx,a.vz)*dt; carried+=dm;
      // Top sürme süreyi kısmen yeniler (panik yok: sür, açı bul)
      if(dribRefill<MOMENT3D_DRIB_REFILL_MAX&&!outcome){
        const add=Math.min(dm*MOMENT3D_DRIB_REFILL,MOMENT3D_DRIB_REFILL_MAX-dribRefill);
        dribRefill+=add; timeLeft=Math.min(MOMENT3D_TIME_SEC,timeLeft+add);
      }
    }
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
    // Parmak kalktı: oyuncu durur ve ZAMAN DONAR (bullet-time) — rakipler, top ve süre yeni
    //   hamleye (tekrar sürme / pas / şut) dek sabit; hook koşulu hamle başlayınca çözer
    if(aim.mode==="drib"){ drib.on=false; freezeTime(true); hud(); return; }
    if(aim.power>3) beginStrike(aim.dx,aim.dz,aim.power); else hud();
  };
  // SADE VURUŞ EKRANI (New Star tarzı): vurucu dahil tüm saha oyuncuları gizlenir; ekranda yalnız
  //   3D top, kale, kaleci, çim ve tribün/gökyüzü kalır (frikikte baraj görünür). Şutta oyuncular
  //   sonuç animasyonu boyunca gizli kalır ve fizikte engel sayılmaz (buildBlockers a.hid);
  //   orta / uzun paste (oyuncular oyunda) vuruş onaylanınca yeniden görünür.
  let hiddenAny=false, keepHidden=false;
  const hideField=()=>{
    if(hiddenAny) return; hiddenAny=true;
    const one=(team,a)=>{
      const h=!(a.kind==="gk"||(type==="freekick"&&a.kind==="wall"));
      a.hid=h; actors.setPlayerHidden(team,a.idx,h);
    };
    for(let i=0;i<home.length;i++) one("home",home[i]);
    for(let i=0;i<away.length;i++) one("away",away[i]);
  };
  const showField=()=>{
    keepHidden=false;
    if(!hiddenAny) return; hiddenAny=false;
    for(let i=0;i<home.length;i++){ home[i].hid=false; actors.setPlayerHidden("home",home[i].idx,false); }
    for(let i=0;i<away.length;i++){ away[i].hid=false; actors.setPlayerHidden("away",away[i].idx,false); }
  };
  // Vuruş ekranındaki İPTAL: vuruş yapılmadan 2.5D sahaya dön (top yine ayakta)
  const cancelStrike=()=>{
    if(phase!=="strike"||!pend.on||outcome) return false;
    stopStrikeRoll();
    pend.on=false; phase=pend.prev==="set"?"set":"play";
    try{ hidePreview(); }catch(_){}   // (kurulum sırasında henüz tanımsız olabilir)
    forceShot=false; forceCross=false; spin.x=0; spin.y=0; strikeLow.on=false;
    const a=ctlA(); let ux=pend.tx-B.x, uz=pend.tz-B.z; const ul=Math.hypot(ux,uz)||1; ux/=ul; uz/=ul;
    a.x=clamp(B.x-ux*0.9,-L-2.5,L+2.5); a.z=clamp(B.z-uz*0.9,-H-2.5,H+2.5); a.vx=0; a.vz=0;
    actors.movePlayer("home",a.idx,a.x,a.z,true);
    if(pend.owned) actors.setOwner("home",a.idx);
    showField();
    if(api.setTimeScale){ timeScale=1; api.setTimeScale(1); }
    frameCollect(a); frameFit(fitTmp); focus.x=fitTmp.x; focus.z=fitTmp.z; focus.h=fitTmp.h;
    overheadCam(focus.x,focus.z,focus.h,true);                 // geçişsiz kuşbakışı
    flash("Vuruş iptal — sahaya dönüldü");
    return true;
  };
  // Vuruş ekranı: 3D topun ekran merkezi + yarıçapı (client px) → out | null
  const sbTmp={x:0,y:0,r:0};
  let sbShown=false;
  // ── Vuruş ekranı kavis/yükseklik önizlemesi ──
  // Topa basılı tutup parmağı topun üstünde gezdirirken yarı saydam yörünge yayı. Vuruşla AYNI
  //   parametrelerden hesaplanır: classify (zHit/iniş noktası) + shotLaunch / orta hızı +
  //   solveLaunch + stepBall (Magnus, hava direnci, yerçekimi). Yalnız serbest uçuş gösterilir
  //   (baraj/kaleci/direk teması ve güç>90 rastgele sapması önizlemede yok). Hesap yalnız
  //   pointermove'da; tek InstancedMesh, matrisler yerinde güncellenir (tahsis yok).
  //   Görsel: kameraya dönük, yarı saydam PARLAYAN şerit (tek BufferGeometry, toplamsal malzeme,
  //   enine yumuşak parıltı dokusu, sise girmez). Topun hemen önünden başlar, kaleye / iniş
  //   noktasına (ya da barajda çarptığı yere) gider; kavis uygulandıkça bükülür. Şut altın,
  //   orta camgöbeği, baraja çarpan yay turuncu-kırmızı. Yeniden hesap yalnız pointermove'da.
  const PREV_N=MOMENT3D_PREVIEW_N;
  const ribC=new Float32Array(PREV_N*3);                       // merkez noktaları
  const ribPos=new Float32Array(PREV_N*2*3), ribCol=new Float32Array(PREV_N*2*3), ribUv=new Float32Array(PREV_N*2*2);
  for(let i=0;i<PREV_N;i++){ const u=i/(PREV_N-1); ribUv[i*4]=u; ribUv[i*4+1]=0; ribUv[i*4+2]=u; ribUv[i*4+3]=1; }
  const ribIdx=[]; for(let i=0;i<PREV_N-1;i++){ const a=i*2; ribIdx.push(a,a+1,a+2,a+1,a+3,a+2); }
  const ribGeo=G(new THREE.BufferGeometry());
  const ribPA=new THREE.BufferAttribute(ribPos,3), ribCA=new THREE.BufferAttribute(ribCol,3);
  if(ribPA.setUsage&&THREE.DynamicDrawUsage){ ribPA.setUsage(THREE.DynamicDrawUsage); ribCA.setUsage(THREE.DynamicDrawUsage); }
  ribGeo.setAttribute("position",ribPA); ribGeo.setAttribute("color",ribCA);
  ribGeo.setAttribute("uv",new THREE.BufferAttribute(ribUv,2)); ribGeo.setIndex(ribIdx); ribGeo.setDrawRange(0,0);
  // Enine parıltı profili: ortada parlak çekirdek, kenarlara sönen hale (toplamsal: siyah = görünmez)
  const ribTex=(()=>{
    try{
      const cv=document.createElement("canvas"); cv.width=4; cv.height=64;
      const g=cv.getContext("2d"); if(!g) return null;
      const gr=g.createLinearGradient(0,0,0,64);
      gr.addColorStop(0,"#000000"); gr.addColorStop(0.28,"#262626"); gr.addColorStop(0.43,"#9a9a9a");
      gr.addColorStop(0.5,"#ffffff"); gr.addColorStop(0.57,"#9a9a9a"); gr.addColorStop(0.72,"#262626"); gr.addColorStop(1,"#000000");
      g.fillStyle=gr; g.fillRect(0,0,4,64);
      const t=new THREE.CanvasTexture(cv); t.minFilter=THREE.LinearFilter; t.generateMipmaps=false;
      return t;
    }catch(e){ return null; }
  })();
  const ribMat=M(new THREE.MeshBasicMaterial({map:ribTex,vertexColors:true,transparent:true,depthWrite:false,
    blending:THREE.AdditiveBlending,side:THREE.DoubleSide,fog:false}));
  const prevPts=new THREE.Mesh(ribGeo,ribMat);
  prevPts.frustumCulled=false; prevPts.visible=false; prevPts.renderOrder=6;
  group.add(prevPts);
  // Çekirdek: aynı şerit geometrisi, normal karışım (parlak gündüz zemininde de net okunur);
  //   enine profil ribTex alphaMap'i (ortası opak). Renk her yeniden çizimde türe göre.
  const ribCoreMat=M(new THREE.MeshBasicMaterial({color:0xffe08a,alphaMap:ribTex||null,transparent:true,opacity:0.72,
    depthWrite:false,side:THREE.DoubleSide,fog:false}));
  const prevCore=new THREE.Mesh(ribGeo,ribCoreMat);
  prevCore.frustumCulled=false; prevCore.renderOrder=5; prevPts.add(prevCore);   // prevPts görünürlüğünü izler
  const prevS={x:0,y:0,z:0,vx:0,vy:0,vz:0,side:0,top:0};
  // Vuruş ekranı: topun çevresinde dikey çim yaprakları (tek InstancedMesh). Topa yakın yapraklar
  //   koyu (temas gölgesinin içinde) → top çime gömülü durur. Yalnız vuruş ekranında görünür.
  const tuftGeo=(()=>{
    const g=new THREE.BufferGeometry();
    // İnce üçgen yaprak: taban koyu yeşil, uç açık sarımsı yeşil (vertex rengi)
    g.setAttribute("position",new THREE.Float32BufferAttribute([-0.018,0,0, 0.018,0,0, 0.004,1,0.01],3));
    g.setAttribute("normal",new THREE.Float32BufferAttribute([0,0.3,1, 0,0.3,1, 0,0.3,1],3));
    g.setAttribute("color",new THREE.Float32BufferAttribute([0.1,0.28,0.08, 0.1,0.28,0.08, 0.42,0.66,0.2],3));
    return G(g);
  })();
  const tuftMat=M(new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide}));
  const tufts=new THREE.InstancedMesh(tuftGeo,tuftMat,MOMENT3D_TUFT_N);
  tufts.frustumCulled=false; tufts.visible=false; tufts.renderOrder=1; group.add(tufts);
  { const m4=new THREE.Matrix4(), q=new THREE.Quaternion(), e=new THREE.Euler(), p=new THREE.Vector3(), sc=new THREE.Vector3(), col=new THREE.Color();
    for(let i=0;i<MOMENT3D_TUFT_N;i++){
      // Yoğunluk topa yakın fazla: r = R·u^1.6
      const r=MOMENT3D_TUFT_R*Math.pow(Math.random(),1.6)+0.05, a=Math.random()*Math.PI*2;
      e.set((Math.random()-0.5)*0.5,Math.random()*Math.PI*2,(Math.random()-0.5)*0.5); q.setFromEuler(e);
      const h=0.09+Math.random()*0.15; p.set(Math.cos(a)*r,0,Math.sin(a)*r); sc.set(0.8+Math.random()*0.8,h,1);
      m4.compose(p,q,sc); tufts.setMatrixAt(i,m4);
      const dk=0.45+0.55*Math.min(1,Math.max(0,(r-0.25)/0.9));      // topun altında/yakınında gölgeli
      col.setRGB(dk,dk*(0.95+Math.random()*0.1),dk); tufts.setColorAt(i,col);
    }
    tufts.instanceMatrix.needsUpdate=true; if(tufts.instanceColor) tufts.instanceColor.needsUpdate=true; }
  const ribCam={px:0,py:0,pz:0,lx:0,ly:0,lz:0,fov:PITCH3D_FOV};
  // n merkez noktasından kameraya dönük şerit (yarı genişlik uçlarda incelir, renk uçlarda söner)
  const buildRibbon=(n,hex)=>{
    if(n<2){ prevPts.visible=false; ribGeo.setDrawRange(0,0); return; }
    strikePose(B.x,B.z,pend.tx,pend.tz,pend.kind,ribCam);    // vuruş ekranı kamerası (sabit) → şerit ona döner
    const cr=((hex>>16)&255)/255, cg=((hex>>8)&255)/255, cb=(hex&255)/255;
    ribCoreMat.color.setHex(hex);
    for(let i=0;i<n;i++){
      const i0=Math.max(0,i-1)*3, i1=Math.min(n-1,i+1)*3, j=i*3;
      const tx=ribC[i1]-ribC[i0], ty=ribC[i1+1]-ribC[i0+1], tz=ribC[i1+2]-ribC[i0+2];
      const vx=ribCam.px-ribC[j], vy=ribCam.py-ribC[j+1], vz=ribCam.pz-ribC[j+2];
      let sx=ty*vz-tz*vy, sy=tz*vx-tx*vz, sz=tx*vy-ty*vx;      // yan = teğet × bakış
      const sl=Math.hypot(sx,sy,sz)||1; sx/=sl; sy/=sl; sz/=sl;
      const u=i/(n-1);
      const w=MOMENT3D_PREVIEW_W*(0.45+0.55*Math.min(1,u*5))*(1-0.3*u);
      const f=Math.min(1,0.25+u*6)*(1-0.45*u);
      const a=i*6;
      ribPos[a]=ribC[j]+sx*w; ribPos[a+1]=ribC[j+1]+sy*w; ribPos[a+2]=ribC[j+2]+sz*w;
      ribPos[a+3]=ribC[j]-sx*w; ribPos[a+4]=ribC[j+1]-sy*w; ribPos[a+5]=ribC[j+2]-sz*w;
      ribCol[a]=cr*f; ribCol[a+1]=cg*f; ribCol[a+2]=cb*f; ribCol[a+3]=cr*f; ribCol[a+4]=cg*f; ribCol[a+5]=cb*f;
    }
    ribPA.needsUpdate=true; ribCA.needsUpdate=true;
    ribGeo.setDrawRange(0,(n-1)*6);
    ribGeo.computeBoundingSphere();
    prevPts.visible=true;
  };
  // (sdrag yukarıda, hud() öncesinde tanımlı)
  const spTmp={sx:0,sy:0,near:false};
  const hidePreview=()=>{ prevPts.visible=false; ribGeo.setDrawRange(0,0); sdrag.on=false; sdrag.id=null; };
  // Topun ekrandaki noktası → (sx,sy) −1…1; null = topun dışında
  const strikePoint=(x,y,out)=>{
    const b=strikeBallScreen(sbTmp); if(!b) return null;
    let sx=(x-b.x)/b.r, sy=-(y-b.y)/b.r;
    out.near=Math.hypot(sx,sy)*b.r<=Math.max(b.r*1.25,b.r+28);
    const l=Math.hypot(sx,sy); if(l>1){ sx/=l; sy/=l; }
    out.sx=sx; out.sy=sy; return out;
  };
  const prevHitsWall=(S)=>{
    const cy=S.y+BALL_R; if(cy>BODY_Y1+BALL_R) return false;
    for(let i=0;i<away.length;i++){
      const w=away[i]; if(w.kind!=="wall") continue;
      if(Math.hypot(S.x-w.x,S.z-w.z)<BODY_R+BALL_R) return true;
    }
    return false;
  };
  const prevSpot={x:0,y:0};
  const updatePreview=(sx,sy)=>{
    if(phase!=="strike"||!pend.on||outcome){ hidePreview(); return; }
    let x=sx, y=sy; const l=Math.hypot(x,y);
    if(l>1){ x/=l; y/=l; }
    if(l<0.2){ x=0; y=0; }                       // confirmStrike ile aynı ölü bölge
    prevSpot.x=x; prevSpot.y=y;
    try{ cfg.onStrikeSpot&&cfg.onStrikeSpot(x,y); }catch(_){}
    const ox=spin.x, oy=spin.y; spin.x=x; spin.y=y;
    let c=null;
    forceShot=pend.force===true; forceCross=pend.force==="cross";
    try{ c=classify(B.x,B.z,pend.dx,pend.dz,pend.power); } finally { forceShot=false; forceCross=false; }
    const side=clamp(x,-1,1);                    // strike(): vc=−spin.x·SPIN_CURL → side = spin.x
    const S=prevS; let lv=null, endX=Infinity, crossD=0, x0=B.x, z0=B.z;
    const y0=B.y||0;
    if(c&&c.kind==="shot"){
      const ln=shotLaunch(pend.power);
      x0=Math.min(B.x,L-1.2);
      lv=solveLaunch(x0,z0,y0,L,aimShift(x0,z0,c.zHit),ln.ty,ln.speed,side,ln.top);   // dinamik hedef (sapmasız)
      S.top=ln.top; endX=L+0.6;
    } else if(c&&c.kind==="cross"){
      const d=Math.hypot(c.lx-x0,c.lz-z0)||1, T=clamp(d/19,0.8,2.2);
      lv=solveLaunch(x0,z0,y0,c.lx,c.lz,MOMENT3D_CROSS_Y,d/T,side,y*0.5);
      S.top=y*0.5; crossD=d;
    }
    spin.x=ox; spin.y=oy;
    if(!lv){ prevPts.visible=false; ribGeo.setDrawRange(0,0); return; }
    S.x=x0; S.y=y0; S.z=z0; S.vx=lv.vx; S.vy=lv.vy; S.vz=lv.vz; S.side=side;
    const ux=(c.kind==="cross"?(c.lx-x0):(L-x0)), uz=(c.kind==="cross"?(c.lz-z0):(c.zHit-z0)), ul=Math.hypot(ux,uz)||1;
    // Örnekler yol boyunca MOMENT3D_PREVIEW_STEP m'de bir; şerit HER ZAMAN topun tam merkezinden başlar
    let t=0, n=0, lx=x0, ly=y0, lz=z0, started=true, hitWall=false;
    const push=()=>{ if(n>=PREV_N) return; const j=n*3; ribC[j]=S.x; ribC[j+1]=S.y+BALL_R; ribC[j+2]=S.z; n++; lx=S.x; ly=S.y; lz=S.z; };
    push();                                         // ilk nokta: top merkezi (x0, y0+BALL_R, z0)
    while(t<3&&n<PREV_N){
      stepBall(S,SIM_DT); t+=SIM_DT;
      const prog=((S.x-x0)*ux+(S.z-z0)*uz)/ul;
      if(!started){ if(Math.hypot(S.x-x0,S.y-y0,S.z-z0)>=0.55){ started=true; push(); } }
      else if(Math.hypot(S.x-lx,S.y-ly,S.z-lz)>=MOMENT3D_PREVIEW_STEP) push();
      if(S.x>=endX||(crossD&&prog>=crossD)||Math.abs(S.z)>H+3){ if(started) push(); break; }
      if(S.y===0&&Math.hypot(S.vx,S.vz)<0.6){ if(started) push(); break; }
      // Serbest vuruş barajı: yay duvara çarptığı yerde biter (oyuncu kapsülünün içinden geçmesin)
      if(wallUp&&prevHitsWall(S)){ if(started) push(); hitWall=true; break; }
    }
    buildRibbon(n,hitWall?0xff6a3d:c.kind==="cross"?0x5fe1ff:0xffcf5a);
  };
  const strikeBallScreen=(out)=>{
    if(!api.worldToScreen) return null;
    const c=api.worldToScreen(B.x,B.y+BALL_R,B.z,sTmp); if(!c) return null;
    const cx=c.x, cy=c.y;
    const t=api.worldToScreen(B.x,B.y+BALL_R*2,B.z,sTmp); if(!t) return null;
    out.x=cx; out.y=cy; out.r=Math.max(8,Math.abs(cy-t.y));
    return out;
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
    if(phase==="strike"){
      // Vuruş ekranı: topa bas → (parmak topun üstünde gezerken kavis/yükseklik önizlemesi) → bırak = vuruş
      if(!pend.on||outcome) return;                 // (yeni basış eski sürüklemeyi devralır)
      const p=strikePoint(e.clientX,e.clientY,spTmp);
      if(!p) return;
      if(!p.near){ flash("Vuruş için topun üzerine dokun"); return; }
      sdrag.on=true; sdrag.id=e.pointerId; sdrag.sx=p.sx; sdrag.sy=p.sy; sdrag.t0=nowS();
      try{ cv.setPointerCapture(e.pointerId); }catch(_){}
      updatePreview(p.sx,p.sy); hud();
      return;
    }
    const near=canAim()&&nearCtlScreen(e.clientX,e.clientY);
    const mate=!near&&!isTackle&&!isPen&&canAim()?mateAtScreen(e.clientX,e.clientY):-1;
    if(act.id!=null) return;
    act.id=e.pointerId; act.sx=e.clientX; act.sy=e.clientY; act.t0=nowS(); act.moved=0; act.type=e.pointerType||"";
    camPan.pan=false;
    act.near=near; act.mate=mate;
    aim.cancel=false; aim.curl=0;
    if(isTackle){ hold.on=near||(!!att&&nearScreen(att,e.clientX,e.clientY,46)); hold.t=0; } // faul: savunmacıda/rakipte uzun bas
    try{ cv.setPointerCapture(e.pointerId); }catch(_){}
  };
  const onMove=(e)=>{
    if(disposed) return;
    if(sdrag.on&&e.pointerId===sdrag.id){
      e.preventDefault&&e.preventDefault();
      const p=strikePoint(e.clientX,e.clientY,spTmp);
      if(p){ sdrag.sx=p.sx; sdrag.sy=p.sy; updatePreview(p.sx,p.sy); }
      return;
    }
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
      } else if(!act.near&&act.mate<0&&!camPan.pan&&phase!=="strike"&&phase!=="intro"&&!hold.on){
        // Boş alandan sürükleme: yörünge kamerası (sağa-sola dönüş, yukarı-aşağı eğim)
        camPan.pan=true; camPan.lx=e.clientX; camPan.ly=e.clientY;
        if(!camPan.hinted){ camPan.hinted=true; flash("Kamera döndü — varsayılana dönmek için boş alana çift dokun"); }
      }
    }
    if(camPan.pan){
      // Sağa-sola: hedef çevresinde dönüş (ekran genişliği = 180°; parmak sağa → dünya parmakla döner)
      // Yukarı-aşağı: eğim (yukarı = daha yatay/izometrik, aşağı = daha tepeden; 25°–79°)
      const r=rectOf(), wpx=r&&r.width>0?r.width:400, hpx=r&&r.height>0?r.height:600;
      const dx=e.clientX-camPan.lx, dy=e.clientY-camPan.ly; camPan.lx=e.clientX; camPan.ly=e.clientY;
      let y=camOrbit.tyaw+dx/wpx*Math.PI; if(y>Math.PI) y-=Math.PI*2; else if(y<-Math.PI) y+=Math.PI*2;
      if(Math.abs(y-camOrbit.yaw)>Math.PI){ camOrbit.yaw+=y>camOrbit.yaw?Math.PI*2:-Math.PI*2; } // sarmada kısa yoldan izle
      camOrbit.tyaw=y;
      camOrbit.tel=clamp(camOrbit.tel+dy/hpx*(70*Math.PI/180),MOMENT3D_ORBIT_EL_MIN,MOMENT3D_ORBIT_EL_MAX);
      return;
    }
    if(aim.on) updateAim(e.clientX,e.clientY);
    else if(draw.on) extendDraw(e.clientX,e.clientY);
  };
  const release=(id)=>{ try{ if(cv&&id!=null) cv.releasePointerCapture(id); }catch(_){} };
  const onUp=(e)=>{
    if(disposed) return;
    if(sdrag.on&&e.pointerId===sdrag.id){
      // Vuruş ekranı bırakışı: önizleme gizlenir; son nokta ile vurulur. pointercancel /
      //   yakalama kaybı da bırakış sayılır (bazı Android WebView'ler pointerup'tan önce yollar)
      // İptal (pointercancel / yakalama kaybı) yalnız önizlemeyi kapatır; pointerup göndermeyen
      //   WebView örüntüsü için: sürükleme ≥ MOMENT3D_STRIKE_CANCEL_SEC sürdüyse iptal de vuruştur.
      const id=sdrag.id, held=nowS()-(sdrag.t0||0); let sx=sdrag.sx, sy=sdrag.sy;
      const up=e.type==="pointerup";
      if(up&&Number.isFinite(e.clientX)){ const p=strikePoint(e.clientX,e.clientY,spTmp); if(p){ sx=p.sx; sy=p.sy; } }
      hidePreview(); release(id); hud();
      if((up||held>=MOMENT3D_STRIKE_CANCEL_SEC)&&phase==="strike"&&pend.on&&!outcome) confirmStrike(sx,sy);
      else if(phase==="strike"&&pend.on&&!outcome) updatePreview(0,0);   // iptal: düz yol geri gelir
      return;
    }
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
      // Top sürme: iptal/yakalama kaybıyla kalkan parmak da bırakış → oyuncu durur, zaman donar
      else if(aim.mode==="drib"&&!isTackle&&!outcome){ drib.on=false; freezeTime(true); hud(); }
      else hud();
      return;
    }
    if(draw.on){
      draw.on=false;
      if(!cancelled&&!outcome&&canAim()){
        if(draw.len>=3&&setRun(draw.idx,draw.pts.slice(1)))
          flash(isTimeFrozen?"Koşu yolu hazır — top sürünce/pas verince koşar · rotaya dokun: ara pası":"Koşu başladı — noktalı rotaya dokun: ara pası");
        else { const m=home[draw.idx]; if(m) passTo(m.x,m.z,false,draw.idx,true); } // çok kısa çizim = dokunma (pas)
      }
      draw.pts=[]; draw.len=0;
      hud();
      return;
    }
    if(cancelled||outcome) return;
    if(isTackle&&wasHold&&ht>=0.5&&act.moved<=12){ foul(ht); return; }
    if(camPan.pan){ camPan.pan=false; hud(); return; }   // kaydırma bitti (eylem yok)
    // Boş alana çift dokunma: kamera varsayılanına (kale üstte, oyuncu ortada) döner
    if(act.moved<12&&dur<0.6&&!act.near&&act.mate<0&&phase!=="strike"){
      const t=nowS();
      if(t-camPan.tapT<0.38&&!orbitDefault()){ camPan.tapT=-9; resetPan(); return; }
      camPan.tapT=t;
    }
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
      // Yavaşlama yumuşak; HIZLANMA ANINDA (pas/vuruş bırakıldığı karede top gecikmesiz çıkar)
      if(wantTs>timeScale) timeScale=wantTs;
      else timeScale+=(wantTs-timeScale)*Math.min(1,rdt*12);
      if(Math.abs(timeScale-wantTs)<0.01) timeScale=wantTs;
      if(api.setTimeScale) api.setTimeScale(timeScale);
    }
    if(flashT>0){ flashT-=rdt; if(flashT<=0) hud(); }
    // Zaman akışı yeniden: top sürme (yeşil ok çekildi / sürme hedefi), pas ya da koşu yolu seçimi,
    //   duran topta vuruş oku, vuruş ekranı/pas/sonuç evresi
    if(isTimeFrozen&&(outcome||(phase!=="play"&&phase!=="set")||drib.on
      ||(aim.on&&!aim.cancel&&(aim.mode!=="drib"||aim.f>0.02)))) freezeTime(false);
    // Kilitlenme bekçisi (gerçek zaman): sonuç belli olduktan 6 sn sonra animasyon hâlâ
    //   bitmediyse (oyun saati durmuş/yavaşlamış olsa bile) kilit an kapanır
    if(outcome&&!ended){ outT+=rdt; if(outT>6) finish(); }
    if(dotsT>0){ dotsT-=rdt; dotMat.opacity=0.9*clamp(dotsT/0.4,0,1); if(dotsT<=0) dots.visible=false; }
    if(dt<=0) return;
    realT+=rdt;
    if(phase==="strike"){
      // Vuruş ekranı: simülasyon durur; süre dolarsa düz vuruş. Topa basılı tutup kaydırırken
      //   (önizleme) süre DURUR — arayüzdeki geri sayım çubuğu da (strikeHold) duraklar.
      if(!sdrag.on) pend.t+=rdt;
      if(pend.t>=MOMENT3D_STRIKE_SEC&&!outcome) confirmStrike(0,0);
    }
    if(phase!=="strike") simStep(dt,rdt);
    else {
      driveAll();
      // Vuruş ekranı: kaleci göğsüyle topa/vurucuya bakar (zaman ~×0.05: yavaş dönüş beklenmez)
      if(gk&&actors.faceToward) actors.faceToward("away",gk.idx,B.x,B.z,0.5);
    }
    // Kontrol halkası (nabız) + faul basış göstergesi
    const c=ctlA();
    ctlRing.visible=(!outcome||phase==="anim")&&phase!=="strike"&&!keepHidden;
    ctlRing.position.set(c.x,0.07,c.z);
    ctlDisc.visible=ctlRing.visible; ctlDisc.position.set(c.x,0.06,c.z);
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
    tufts.visible=phase==="strike"&&!outcome;
    if(tufts.visible) tufts.position.set(B.x,0,B.z);
    if(phase==="strike"&&!outcome) hideField();
    else if(!keepHidden) showField();
    // Odak çemberi: topa sahip oyuncuda (pasta alıcıya akıcı kayar); vuruş/sonuç/savunmada gizli
    { const on=!isTackle&&!outcome&&(phase==="play"||phase==="set"||phase==="pass");
      focusFill.visible=on; focusEdge.visible=on;
      if(on){
        const tx=phase==="pass"&&home[passInfo.r]?home[passInfo.r].x:c.x, tz=phase==="pass"&&home[passInfo.r]?home[passInfo.r].z:c.z;
        if(!focusC.on){ focusC.x=tx; focusC.z=tz; focusC.on=true; }
        const k=Math.min(1,rdt*(phase==="pass"?6:10));
        focusC.x+=(tx-focusC.x)*k; focusC.z+=(tz-focusC.z)*k;
        focusFill.position.x=focusC.x; focusFill.position.z=focusC.z;
        focusEdge.position.x=focusC.x; focusEdge.position.z=focusC.z;
        focusEdgeMat.opacity=0.18+0.06*Math.sin(realT*3);
      }
    }
    // Yön aktarımı: basılı yeşil okun son yönü
    if(aim.on&&aim.mode==="drib"&&!aim.cancel){ lastDrib.dx=aim.dx; lastDrib.dz=aim.dz; lastDrib.t=realT; }
    // ŞUT / ORTA düğmesi bölgesi (yalnız değişince HUD)
    { const so=phase==="play"||phase==="set"?shotZoneOk():false, co=phase==="play"&&crossZoneOk();
      if(so!==shotOk||co!==crossOk){ shotOk=so; crossOk=co; hud(); } }
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
        freezeTime(true);                    // kullanıcı ilk hamlesini yapana dek zaman donuk
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
    // Zaman donukken (Adım 16): rakip/arkadaş yapay zekâsı, top kapma ve süre işlemez → pozisyon sabit
    if(!isTimeFrozen){
      if(isTackle) stepTackleAI(dt); else stepAttackAI(dt);
    }
    if(phase==="pass") stepPass(dt);
    if(!isTimeFrozen) tackleCheck(dt);
    driveAll();
    // Süre (yalnızca oynanırken; ağır çekimde yavaşlar; zaman donukken durur)
    if((phase==="set"||phase==="play")&&!outcome&&!isTimeFrozen){
      timeLeft-=dt;
      if(timeLeft<=0){ timeLeft=0; autoAction(); }
    }
  };
  // Hibrit kamera: vuruş ekranı ve şut animasyonu çim seviyesinde, geri kalan her şey kuşbakışı
  const updateCamera=(c,rdt)=>{
    if(phase==="strike"){
      // VURUŞ EKRANI: kamera çim seviyesinde topun hemen arkasında (kuşbakışı gizli) →
      //   gerçek 3D top ekranın alt ortasında büyük, karşıda kale ve kaleci. İlk kare geçişsiz.
      strikeCam.x=B.x; strikeCam.z=B.z;
      // Orta: sonraki alçak kamera da kale/ceza sahası tarafına bakar (iniş noktası kanattan dik kalabilir)
      strikeCam.tx=pend.kind==="cross"?L-MOMENT3D_CROSS_LOOK:pend.tx; strikeCam.tz=pend.kind==="cross"?clamp(pend.tz*0.2,-4,4):pend.tz;
      // Kamera top→hedef ekseninde, topun tam arkasında (yanal kayma YOK → top yatayda tam ortada),
      //   bakış açısı top ekranın alt ortasında (MOMENT3D_STRIKE_BALL_NDC) duracak şekilde hesaplanır
      strikePose(B.x,B.z,pend.tx,pend.tz,pend.kind,strikeTmp);
      setCam(strikeTmp.px,strikeTmp.py,strikeTmp.pz,strikeTmp.lx,strikeTmp.ly,strikeTmp.lz,strikeSnap,true,strikeTmp.fov);
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
      // Pas: bekleme yok — odak topla alıcının buluşma noktasına akıcı kayar; animasyonda topa
      if(phase==="pass"&&home[passInfo.r]){ fx=passInfo.px*0.55+B.x*0.45; fz=passInfo.pz*0.55+B.z*0.45; }
      else if(phase==="anim"&&!shotView){ fx=fx*0.5+B.x*0.5; fz=fz*0.5+B.z*0.5; }
      const kf=Math.min(1,rdt*(phase==="pass"?5:3.2));
      focus.x+=(fx-focus.x)*kf; focus.z+=(fz-focus.z)*kf; focus.h+=(fitTmp.h-focus.h)*kf;
    }
    // Yörünge (boş alandan sürükleme): hedefe hızlı yaklaşır; çift dokunmada varsayılana döner
    { const ko=Math.min(1,rdt*12); camOrbit.yaw+=(camOrbit.tyaw-camOrbit.yaw)*ko; camOrbit.el+=(camOrbit.tel-camOrbit.el)*ko;
      if(Math.abs(camOrbit.tyaw-camOrbit.yaw)<1e-4) camOrbit.yaw=camOrbit.tyaw;
      if(Math.abs(camOrbit.tel-camOrbit.el)<1e-4) camOrbit.el=camOrbit.tel; }
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
    try{ tufts.dispose&&tufts.dispose(); }catch(e){}
    try{ ribTex&&ribTex.dispose(); }catch(e){}
    try{ focusTex&&focusTex.dispose(); }catch(e){}
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
    // Kanat ortası: penaltı noktasına orta (vuruş ekranı "ORTA" → kafa vuruşu)
    if(phase==="play"&&crossZoneOk()) return beginStrike(L-11-B.x,-B.z,MOMENT3D_SHOT_BTN_POWER,"cross");
    if(!shotZoneOk()){ flash("ŞUT için rakip yarı sahada, kaleye ~38 m içinde ol"); return false; }
    let tz=clamp(-B.z*0.15,-(GW-1.5),GW-1.5);
    // 2.5D → 3D yön aktarımı: az önce sürülen yön kaleye bakıyorsa vuruş (ve kamera) o yöne
    //   hizalanır; ok kale ağzının dışını gösteriyorsa en yakın direğin içine kırpılır
    if(realT-lastDrib.t<MOMENT3D_DRIB_AIM_SEC&&lastDrib.dx>0.15){
      tz=clamp(B.z+lastDrib.dz*(L-B.x)/lastDrib.dx,-(GW-0.4),GW-0.4);
    }
    const gz=tz-B.z;
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
    beginStrike,confirmStrike,cancelStrike,standTackle,slideTackle,setRun,dribbleTo,shootNow,togglePassMode,
    evalShot:(bx,bz,ax,az,zHit,curl)=>evalShot(bx,bz,ax,az,zHit,Math.abs(curl||0),wallUp?0.18:1),
    evalCross,classify:(bx,bz,dx,dz,p)=>{ const c=classify(bx,bz,dx,dz,p); return {kind:c.kind,zHit:c.zHit,lx:c.lx,lz:c.lz}; }};
}

// 3D kilit an sahnesi + arayüz. onFallback(msg): 2D'ye geç (sonuç hesaplanmadan önce).
function Moment3DStage({moment,mates,myStr,oppStr,homeShare,onResolve,onFallback}){
  const {config,player,min}=moment;
  const coarse=(()=>{ try{ return !!(window.matchMedia&&window.matchMedia("(pointer: coarse)").matches); }catch(e){ return false; } })();
  const [ready,setReady]=useState(false);
  const [hud,setHud]=useState({phase:"intro",hint:"⏳ 3D sahne hazırlanıyor…",passes:0,touchUi:coarse,aiming:false,tackle:moment.type==="tackle",passMode:false,shotOk:false,crossOk:false});
  const [result,setResult]=useState(null);
  const [animOut,setAnimOut]=useState(false);
  const [goalFlash,setGoalFlash]=useState(null);   // {dist} — top ağlara girince büyük GOL! + mesafe
  const ctrlRef=useRef(null);
  const timersRef=useRef([]), outcomeRef=useRef(null), resolvedRef=useRef(false), shownRef=useRef(false);
  const timeBarRef=useRef(null), powerRef=useRef(null), sbRef=useRef(null), spotRef=useRef(null), frameRef=useRef({w:-1,p:-2});
  const rootRef=useRef(null);
  const cbRef=useRef(null); cbRef.current={onResolve,onFallback};

  const later=(ms,fn)=>{ const id=setTimeout(fn,ms); timersRef.current.push(id); return id; };

  useEffect(()=>{
    // Güvenlik: kilit an 150 sn'de bitmediyse otomatik eylem, 170 sn'de hâlâ sonuç yoksa 2D
    //   (pas sınırı kalktı: uzun paslaşma + ağır çekimli koşu yolu çizimi 40 sn'yi aşabilir)
    later(150000,()=>{ if(!outcomeRef.current&&ctrlRef.current) ctrlRef.current.forceTimeout(); }); // Adım 15: süre ×2 + yenileme
    later(170000,()=>{ if(!outcomeRef.current) fallback("3D kilit an yanıt vermedi; 2D görünüme geçildi."); });
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
        // Vuruş noktası göstergesi (yeşil iç içe halkalar): (x,y) −1…1, topun merkezine göre (DOM, state yok)
        onStrikeSpot:(x,y)=>{
          const el=spotRef.current; if(!el||!Number.isFinite(x)||!Number.isFinite(y)) return;
          el.style.left=(50+x*40)+"%"; el.style.top=(50-y*40)+"%";
        },
        // Sonuç kartı en geç 6.5 sn sonra (animasyon takılsa da); kart 2.8 sn sonra kendiliğinden kapanır
        onGoalFx:()=>{ const o=outcomeRef.current; setGoalFlash({dist:o&&Number.isFinite(o.dist)?o.dist:null});
          try{ if(typeof MATCH_SFX!=="undefined") MATCH_SFX.goal(); }catch(_){} },
        onSfx:(t)=>{ try{ if(typeof MATCH_SFX==="undefined") return;
          if(t==="post") MATCH_SFX.post(); else if(t==="save") MATCH_SFX.save(); }catch(_){} },
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
  // Vuruş ekranı: dokunma tuvalde (denetleyici: onDown/onUp sdrag, strikePoint) — sahnedeki gerçek 3D topun üstüne.
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
              style={{...btnBase,fontSize:".52rem",padding:"0 10px",minHeight:44,minWidth:44,color:"#fff",
                background:"rgba(0,0,0,.28)",border:"1px solid rgba(255,255,255,.3)",touchAction:"manipulation"}}>
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
            <Pitch3D camera="custom" height="100%" showControls={false} interactive={true} day={true}
              onReady={onReady} onError={onErr}/>
          </div>
          {hud.hint&&!striking&&(
            // Tek satırlık kompakt ipucu: sol altta (sağ alttaki düğmelerin solunda), kale/saha görüşünü kapatmaz
            <div style={{position:"absolute",left:8,bottom:MOMENT3D_SAFE_B,zIndex:3,
              pointerEvents:"none",maxWidth:"calc(100% - 172px)",fontSize:".46rem",fontWeight:700,
              letterSpacing:.2,color:"#f4f7fb",padding:"3px 8px",borderRadius:7,lineHeight:1.3,
              background:"rgba(8,14,22,.5)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",
              textShadow:"0 1px 2px rgba(0,0,0,.7)"}}>
              {hud.hint}
            </div>
          )}
          <div ref={powerRef} style={{...MOMENT3D_GLASS,position:"absolute",top:38,left:"50%",transform:"translateX(-50%)",zIndex:3,
            pointerEvents:"none",opacity:0,fontSize:".7rem",fontWeight:900,letterSpacing:1,
            fontFamily:"'Barlow Condensed',sans-serif",padding:"2px 10px",borderRadius:8}}/>
          {ready&&!locked&&!hud.tackle&&!hud.aiming&&moment.type!=="penalty"&&(hud.phase==="play"||hud.phase==="set")&&(
            // Sağ alt aksiyon düğmeleri (dokunmatik uyumlu, ≥48 px): PAS = pas modu · ŞUT = doğrudan vuruş ekranı
            <div style={{...MOMENT3D_GLASS,position:"absolute",right:MOMENT3D_SAFE_R,bottom:MOMENT3D_SAFE_B,zIndex:5,
              display:"flex",gap:6,padding:4,borderRadius:14}}>
              <button onClick={(e)=>{ e.stopPropagation(); if(ctrlRef.current&&ctrlRef.current.togglePassMode) ctrlRef.current.togglePassMode(); }}
                title="Pas modu: arkadaşına dokun = pas · arkadaştan boş alana sürükle = koşu yolu"
                style={{...btnBase,minWidth:64,minHeight:48,fontSize:".78rem",letterSpacing:1.5,padding:"6px 12px",borderRadius:10,
                  fontFamily:"'Barlow Condensed',sans-serif",color:hud.passMode?"#1a1400":"#fff",touchAction:"manipulation",
                  textShadow:hud.passMode?"none":"0 1px 2px rgba(0,0,0,.6)",
                  background:hud.passMode?"linear-gradient(180deg,#ffd84d,#e0aa00)":"rgba(241,196,15,.12)",
                  border:"1px solid rgba(241,196,15,.75)",boxShadow:hud.passMode?"0 0 14px rgba(241,196,15,.55)":"none"}}>
                ➜ PAS
              </button>
              {!(hud.phase==="set"&&moment.type==="corner")&&(()=>{
                // Bağlamsal: kendi yarı sahada / kaleye ~38 m'den uzakta pasif (soluk, basılamaz)
                const on=hud.crossOk||hud.shotOk;
                return(
                  <button disabled={!on} aria-disabled={!on}
                    onClick={(e)=>{ e.stopPropagation(); if(on&&ctrlRef.current&&ctrlRef.current.shootNow) ctrlRef.current.shootNow(); }}
                    title={hud.crossOk?"Orta: vuruş ekranı, kafa vuruşu":on?"Şut: doğrudan 3D vuruş ekranı":"Şut rakip yarı sahada, kaleye ~38 m içinde açılır"}
                    style={{...btnBase,minWidth:64,minHeight:48,fontSize:".78rem",letterSpacing:1.5,padding:"6px 12px",borderRadius:10,
                      fontFamily:"'Barlow Condensed',sans-serif",color:"#fff",touchAction:"manipulation",
                      textShadow:"0 1px 2px rgba(0,0,0,.55)",cursor:on?"pointer":"not-allowed",opacity:on?1:0.4,
                      background:hud.crossOk?"linear-gradient(180deg,rgba(243,156,18,.92),rgba(200,127,10,.92))":"linear-gradient(180deg,rgba(231,76,60,.92),rgba(176,58,46,.92))",
                      border:hud.crossOk?"1px solid rgba(255,213,154,.9)":"1px solid rgba(255,179,170,.9)",
                      boxShadow:on?(hud.crossOk?"0 0 12px rgba(243,156,18,.5)":"0 0 12px rgba(231,76,60,.5)"):"none"}}>
                    {hud.crossOk?"⤴ ORTA":"⚽ ŞUT"}
                  </button>
                );
              })()}
            </div>
          )}
          {ready&&locked&&!result&&(
            // Vuruş / pozisyon sonrası: animasyonu beklemeden sonuca geç (kilitlenme hissi olmasın)
            <button onClick={(e)=>{ e.stopPropagation(); skipAnim(); }}
              style={{...btnBase,...MOMENT3D_GLASS,position:"absolute",right:MOMENT3D_SAFE_R,bottom:MOMENT3D_SAFE_B,zIndex:5,
                minHeight:44,minWidth:64,fontSize:".66rem",padding:"6px 14px",color:"#fff",borderRadius:10,
                touchAction:"manipulation"}}>
              Atla ⏭
            </button>
          )}
          {goalFlash&&!result&&(
            // Top ağlara girdi: büyük GOL! + vuruş mesafesi
            <div style={{position:"absolute",inset:0,zIndex:6,pointerEvents:"none",display:"flex",flexDirection:"column",
              alignItems:"center",justifyContent:"center",animation:"m3dBounce .5s cubic-bezier(.36,.07,.19,.97)"}}>
              <div style={{fontSize:"3.4rem",fontWeight:900,letterSpacing:6,color:"#fff",fontFamily:"'Barlow Condensed',sans-serif",
                textShadow:"0 0 24px rgba(46,204,113,.95),0 4px 10px rgba(0,0,0,.7)"}}>GOL!</div>
              {goalFlash.dist!=null&&(
                <div style={{marginTop:2,fontSize:"1.1rem",fontWeight:900,letterSpacing:2,color:"#2ecc71",fontFamily:"'Barlow Condensed',sans-serif",
                  background:"rgba(0,0,0,.55)",padding:"2px 12px",borderRadius:8}}>{goalFlash.dist.toFixed(1)} metre</div>
              )}
            </div>
          )}
          {striking&&!locked&&(
            // Vuruş ekranı katmanı: tıklamalar tuvale geçer (pointerEvents none); rehber halka 3D topun üstünde
            <div style={{position:"absolute",inset:0,zIndex:4,pointerEvents:"none"}}>
              <div style={{...MOMENT3D_GLASS,position:"absolute",top:38,left:"50%",transform:"translateX(-50%)",fontSize:".56rem",fontWeight:900,
                letterSpacing:1.5,color:"#fff",padding:"3px 11px",borderRadius:8,
                fontFamily:"'Barlow Condensed',sans-serif",whiteSpace:"nowrap"}}>
                {hud.strikeKind==="cross"?"ORTA — TOPA BAS, KAYDIR, BIRAK":hud.strikeKind==="lpass"?"UZUN PAS — TOPA DOKUN":"ŞUT — TOPA BAS, KAYDIR, BIRAK"}
              </div>
              {/* İPTAL: vuruş yapmadan 2.5D sahaya dön (katman pointerEvents:none; düğme tıklanabilir) */}
              <button onClick={(e)=>{ e.stopPropagation(); if(ctrlRef.current&&ctrlRef.current.cancelStrike) ctrlRef.current.cancelStrike(); }}
                aria-label="Vuruşu iptal et"
                style={{...btnBase,position:"absolute",right:MOMENT3D_SAFE_R,bottom:MOMENT3D_SAFE_B,pointerEvents:"auto",
                  minWidth:96,minHeight:46,borderRadius:23,fontSize:".8rem",letterSpacing:1.2,fontFamily:"'Barlow Condensed',sans-serif",
                  color:"#fff",padding:"0 16px 0 8px",display:"flex",alignItems:"center",gap:7,touchAction:"manipulation",
                  background:"linear-gradient(180deg,#f0564a,#b8241b)",border:"1px solid rgba(255,214,209,.85)",
                  boxShadow:"0 4px 14px rgba(0,0,0,.35),inset 0 1px 0 rgba(255,255,255,.35)",textShadow:"0 1px 2px rgba(0,0,0,.45)"}}>
                <span style={{width:26,height:26,borderRadius:"50%",background:"rgba(255,255,255,.95)",color:"#c0271d",
                  display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:".8rem",fontWeight:900}}>✕</span>
                İPTAL
              </button>
              <div ref={sbRef} style={{position:"absolute",left:0,top:0,width:0,height:0,opacity:0,borderRadius:"50%",
                border:"1px solid rgba(255,255,255,.28)",transition:"opacity .15s"}}>
                {/* Vuruş noktası (sweet-spot): parlak yeşil iç içe halkalar + merkez nokta; parmakla kayar */}
                <div ref={spotRef} style={{position:"absolute",left:"50%",top:"50%",width:"34%",height:"34%",
                  transform:"translate(-50%,-50%)",borderRadius:"50%",border:"3px solid rgba(57,255,120,.95)",
                  boxShadow:"0 0 10px rgba(57,255,120,.9),inset 0 0 8px rgba(57,255,120,.6)",background:"rgba(57,255,120,.14)"}}>
                  <div style={{position:"absolute",left:"22%",top:"22%",width:"56%",height:"56%",borderRadius:"50%",
                    border:"2px solid rgba(160,255,190,.85)"}}/>
                  <div style={{position:"absolute",left:"50%",top:"50%",width:"18%",height:"18%",transform:"translate(-50%,-50%)",
                    borderRadius:"50%",background:"#5dff8f",boxShadow:"0 0 6px #5dff8f"}}/>
                </div>
              </div>
              <div style={{position:"absolute",bottom:8,left:"50%",transform:"translateX(-50%)",display:"flex",flexDirection:"column",alignItems:"center",width:"min(92%,360px)"}}>
                <div style={{fontSize:".44rem",color:"rgba(255,255,255,.92)",textAlign:"center",lineHeight:1.3,
                  padding:"2px 8px",borderRadius:6,background:"rgba(8,14,22,.45)",whiteSpace:"nowrap",overflow:"hidden",
                  textOverflow:"ellipsis",maxWidth:"calc(100vw - 150px)"}}>
                  {hud.strikeKind==="lpass"?"Topa dokun: havadan uzun pas":"Kaydır: sağ = sola falso · sol = sağa · alt = yüksek · üst = sert"}
                </div>
                {/* Geri sayım: dolunca düz vuruş (MOMENT3D_STRIKE_SEC) */}
                <div style={{width:"min(46vw,210px)",height:4,borderRadius:2,background:"rgba(255,255,255,.15)",marginTop:5,overflow:"hidden"}}>
                  <div style={{height:"100%",background:"#f1c40f",transformOrigin:"left center",
                    animation:`m3dCount ${MOMENT3D_STRIKE_SEC}s linear forwards`,animationPlayState:hud.strikeHold?"paused":"running"}}/>
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
              {result.goalScored&&Number.isFinite(result.dist)&&(
                <div style={{fontSize:".8rem",fontWeight:900,color:"#2ecc71",marginBottom:4,letterSpacing:1,
                  fontFamily:"'Barlow Condensed',sans-serif"}}>Vuruş mesafesi: {result.dist.toFixed(1)} metre</div>
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
