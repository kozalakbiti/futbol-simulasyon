# PLAN-3D — 3D Maç Motoru

Branch: `feature/3d-mac-motoru` · Kütüphane: Three.js r128 (cdnjs, UMD, ihtiyaç anında yüklenir)

## Mevcut durum (js/match/ incelemesi)

- `engine.js` → `simulateMatch` maçın sonucunu ve olay listesini (`evs`: `{min,type,team,zone:[x,y]}`) baştan üretir. 3D katman bu sonucu **değiştirmez**, yalnızca görselleştirir.
- `overlay.js` → `MatchOverlay`: `setInterval` ile dakika ilerler (`SPEED_CONFIGS`: yavaş/normal 280 ms/dk, hızlı 45 ms/3 dk). 2D saha SVG + `playerDots`/`oppDots` (0–100 koordinatlı, formasyon `FDATA`'dan), `ballPos`, `ballEvents` (gol/kart/korner efektleri). Mini saha her zaman görünür, "Saha" sekmesinde büyük saha var.
- `moments.js` → `planMoments` maç başına 5 kilit an planlar (korner, kontra, müdahale, serbest vuruş, birebir/penaltı). `InteractiveMoment` 3 seçenek + güç barı sunar ve `onResolve({success,goalScored,goalConceded,optionId,player,momentType,msg})` ile `handleMomentResolve`'a döner. Kilit anlar yalnızca "yavaş" hızda tetiklenir.
- `halftime.js` → `HalftimeSpeech` (devre arası), `scouting.js` → maç öncesi rakip analizi. Bunlara dokunulmaz.

## Görevler

### 1. 3D saha ve kameralar — ✅ tamamlandı
- [x] `loadThreeJs()` — cdnjs'ten tembel yükleme, tek Promise, hata/timeout ve WebGL kontrolü
- [x] Yeni dosya(lar) `js/match/` altında, `index.html`'de `overlay.js`'ten önce
- [x] `Pitch3D` React bileşeni: renderer, sahne, ışık, çim şeritleri, tüm saha çizgileri, kaleler (direk + file), stadyum kenarı
- [x] Kameralar: Yayın (yan tribün), Taktik (üstten), Kale arkası, Topu takip; yumuşak geçiş ve kamera seçici
- [x] Yeniden boyutlandırma (ResizeObserver), DPR sınırı, unmount'ta tam `dispose`

### 2. 22 oyuncu ve maç olayları senkronizasyonu — ✅ tamamlandı
- [x] Adım 1 denetim bulgularının düzeltilmesi (aşağıdaki günlüğe bak)
- [x] 11 + 11 düşük poligon oyuncu (forma renkleri, kaleci farklı renk, numara/isim etiketi)
- [x] `playerDots`/`oppDots`/`ballPos`'u ref üzerinden okuyup lerp ile izleme (2D ile aynı koordinat sistemi)
- [x] Top: yay çizen pas/şut animasyonu, gölge
- [x] `ballEvents`/olay tipine göre 3D efektler: gol (file sallanır + kamera yakın plan), kurtarış, aut, korner, kart
- [x] Gol sonrası santra dönüşü

### 3. Kilit anlarda interaktif pas/şut çizimi ve müdahale — ✅ tamamlandı
- [x] Adım 2 denetim bulgularının düzeltilmesi (aşağıdaki günlüğe bak)
- [x] `InteractiveMoment3D`: kilit an sahnesi (oyuncular olay tipine göre dizilir, kamera yaklaşır)
- [x] Parmakla/fareyle sahaya pas veya şut rotası çizme (raycast → zemin), rota önizlemesi, rakip araya girme riski göstergesi
- [x] Rota kalitesi + oyuncu istatistikleri + mevcut seçenek/güç mantığıyla başarı hesabı; savunma anında (tackle) müdahale noktası seçme
- [x] Sonucun 3D animasyonu, ardından **aynı `onResolve` sözleşmesi**
- [x] 3D yüklenemezse mevcut 2D `InteractiveMoment`'e düşme

### 4. Skor tabelası ve 2D/3D geçişi — ✅ tamamlandı
- [x] Adım 3 denetim bulgularının düzeltilmesi (özellikle denge; aşağıdaki günlüğe bak)
- [x] 3D görünüm üzerinde skor tabelası (takımlar, skor, dakika, devre, gol atanlar), gol anında vurgu
- [x] `MatchOverlay`'e 2D/3D geçiş düğmesi; tercih ayrı anahtarda (`fcym_match_view`) saklanır
- [x] WebGL yoksa düğme devre dışı + Türkçe uyarı; 2D akışı (sekmeler, devre arası, sonuç paneli) bozulmaz
- [x] Performans: 3D kapalıyken render döngüsü durur, maç kapanınca her şey temizlenir

### 5. Topa bağlı oyun ve serbest kontrollü kilit anlar — ✅ tamamlandı (tarayıcı testi bekliyor)
- [x] Normal akışta top, topa sahip oyuncunun ayağının önünde sürülür ve onunla döner; yalnız pas/şutta fiziksel yörüngeyle hedef oyuncuya gider
- [x] Kilit anlarda seçenek kartları kalkar; topa sahip oyuncu hemen top sürmeye başlar, etrafında yarı saydam kontrol halkası, fare/ok tuşları (dokunmatikte sanal joystick) ile serbest hareket ve rakip geçme
- [x] Boş alana/takım arkadaşına tıklama → noktalı çizgiyle yerden/havadan pas
- [x] Topa basılı tutup geri çekme → ağır çekim, güce göre yeşilden kırmızıya dönen kavisli şut/orta oku, bırakınca vuruş
- [x] Aynı `onResolve` sözleşmesi, denge 2D ile uyumlu, 2D geri dönüş korunur

## İlerleme günlüğü

_(Her adım bittikçe buraya eklenir: ne yapıldı, kod-denetleyici bulguları, düzeltmeler.)_

### Adım 1 — 3D saha ve kameralar ✅
- **Yeni:** `js/match/three3d.js` (`loadThreeJs`, `hasWebGLSupport`, `pitchToWorld3D`/`worldToPitch3D`, `disposeObject3D`, `PITCH3D_*` sabitleri), `js/match/pitch3d.js` (`Pitch3D`, `createPitch3DScene`, `buildPitch3DMeshes`, `pitch3dCameraPose`, `PITCH3D_CAMERAS`). `index.html`'de `overlay.js`'ten önce yükleniyor.
- **Koordinat:** x=0 bizim kale, x=100 rakip kale, y=0 2D sahanın üst kenarı (overlay.js'teki "sağ=FCY kale" yorumu yanlış). `toWorld`: `wx=(x/100−0.5)·105`, `wz=(y/100−0.5)·68`.
- **Kameralar:** 📺 Yayın, 🗺️ Taktik, 🥅 Kale arkası, 🎯 Takip. Geçişler lerp ile yumuşak. Sekme gizliyken veya bileşen ekran dışındayken render duruyor; unmount'ta her şey temizleniyor.
- **API (`onReady`):** `{THREE, scene, camera, renderer, groups:{pitch,players,ball,fx}, toWorld, toPitch, setFocus, getFocus, addFrameHook, screenToPitch, isDisposed}`.
- **Entegrasyon:** Saha sekmesinde katlanabilir "🧊 3D Önizleme (beta)" bölümü. Varsayılan kapalı, 2D saha yerinde.
- **Kod denetimi:** Engelleyici hata yok. Babel 7.23.5 ile derlendi, yükleme sırası ve isim çakışması temiz, maç akışı değişmedi. Bulgular:
  - [önemli] `touch-action:none` mobilde sayfa kaydırmayı engelliyor.
  - [küçük] Kurulum yarıda patlarsa canvas/WebGL bağlamı sızıyor.
  - [küçük] Zaman aşımından sonra Three.js iki kez yüklenebilir.
  - [küçük] WebGL'in "yok" sonucu kalıcı olarak önbelleğe alınıyor.
  - [küçük] Render hatası her karede konsola düşüyor.
  - [küçük] 3D kutusunda `flexShrink:0` eksik.
  - [not] Kilit an veya devre arası ekranı açıkken render döngüsü durmuyor (`paused` prop'u önerildi).
  - Hepsi Adım 2'nin başında düzeltilecek.
- **Commit:** `d69bc76`

### Adım 2 — 22 oyuncu ve maç olayları ✅
- **Adım 1 düzeltmeleri:**
  - `touch-action` yalnızca `interactive` modda `none` oluyor.
  - Kurulum hata verirse her şey geri alınıyor.
  - Three.js artık iki kez yüklenmiyor.
  - WebGL için yalnızca olumlu sonuç önbelleğe alınıyor.
  - Render hatasında döngü durup hata gösteriliyor.
  - 3D kutusuna `flexShrink:0` eklendi.
  - `Pitch3D`'ye `paused` prop'u eklendi (kilit an, devre arası, sonuç ekranında duruyor).
- **Yeni dosya `js/match/players3d.js`:** `createMatchActors3D(api,{getSnapshot})` → `{update, triggerEvent, resetKickoff, dispose}`, ayrıca `ACTORS3D_COLORS`.
  - **Oyuncular:** 22 düşük poligon oyuncu. Geometri ve malzeme paylaşılıyor. Bizimkiler mavi, rakip kırmızı, kaleciler ayrı renk. Bizim oyuncuların üstünde isim etiketi var.
  - **Hareket:** Oyuncular hedefe lerp ile koşuyor, hareket yönüne dönüyor, koşarken sallanıyor.
  - **Top:** Kısa mesafede yuvarlanıyor, uzunda yay çiziyor. Zemin gölgesi yüksekliğe göre değişiyor.
  - **Efektler:** gol (file şişer, renkli halka/parçacık, yakın plan), kaçan şut, kurtarış, direk, korner (4 köşe bayrağı eklendi), sarı/kırmızı kart. Golden sonra top santraya yayla dönüyor.
- **Pitch3D API'sine eklenenler:** `setFocusWorld`, `getCameraMode`, `closeUp`, `addDisposeHook`. overlay.js içinde `live3dRef` snapshot'ı ve `labels3d` eklendi.
- **Kod denetimi:** Engelleyici hata yok. Derleme, yükleme sırası, isim çakışması ve hook kuralları temiz; 2D akış değişmedi. Adım 1 düzeltmeleri doğrulandı. Bulgular:
  - [önemli] `three3d.js:58-62`: "yüklendi ama THREE yok" dalında reddedilmiş Promise önbellekte kalıyor, 3D sayfa yenilenene kadar yeniden denenmiyor.
  - [önemli] `paused` zamanlaması:
    - 90. dakika golü ve devre arası tick'indeki olaylar 3D'de kayboluyor.
    - Sahne duraklatılmış haldeyken kurulursa ya da yeniden boyutlanırsa boş kalıyor; tek karelik bir `renderOnce` yolu gerekiyor.
  - [küçük] "keeper" olayında kale yönü ters.
  - [küçük] NaN koordinatlara karşı koruma yok.
  - [küçük] `pitch3dCameraPose` ve `hooks.forEach` her karede yeni nesne ayırıyor.
  - [not] overlay'deki `setFocus` efekti artık yedek işlevi görüyor.
  - Hepsi Adım 3'ün başında düzeltilecek.
- **Commit:** `7dcef88`

### Adım 3 — Kilit anlarda rota çizerek müdahale ✅
- **Adım 2 düzeltmeleri:**
  - Bozuk Three.js etiketinden sonra yükleme yeniden deneniyor.
  - `step`/`renderOnce`, `setPaused` anında dt=0 ile tek kare çiziliyor.
  - Maç sonunda önizleme 4 sn daha oynuyor (`result3dFrozen`), böylece son dakika golü görünüyor.
  - `events3dQueueRef` son 30 olayı tutuyor; devre arası olayları artık kaybolmuyor.
  - "keeper" yönü düzeltildi, NaN koruması eklendi.
  - Kamera pozu (`pitch3dSetPose`) kare başına yeni nesne ayırmıyor.
- **Yeni dosya `js/match/moment3d.js`:** `InteractiveMoment3D`, `Moment3DStage`, `createMoment3DController`, `MOMENT3D_LAYOUTS`, `MOMENT3D_OPTION_KIND`.
  - **Akış:** seçenek → sahaya rota çizme (8 sn, Temizle/Onayla) → güç barı → 3D animasyon → sonuç kartı → `onResolve` (2D ile aynı sözleşme, tek çağrı korumalı).
  - **Yerleşim ve kamera:** Olay tipine göre oyuncular diziliyor (serbest vuruşta duvar var), kamera olay tipine göre yaklaşıyor.
  - **Risk göstergesi:** Çizim sırasında kesilme riski gösteriliyor, en tehlikeli rakip vurgulanıyor. Şutta kale içi/dışı belirtiliyor, müdahalede rakibin koşu yolu çiziliyor.
  - **2D'ye geri dönüş:** WebGL yoksa, yükleme hatası olursa, Pitch3D hata verirse veya "2D'ye geç" düğmesine basılırsa 2D `InteractiveMoment`'e dönülüyor.
- **moments.js:** `getMomentMsg` ve `calcMomentChance(player,opt,power,extra)` ortak fonksiyon olarak dışarı taşındı. 2D davranışı ve `Math.random` sırası aynı.
- **Diğer:** `players3d.js`'e kilit an API'si eklendi (`movePlayer`, `playBallScript`, `goalFx`…). `pitch3d.js`'e `custom` kamera modu eklendi. `overlay.js`'te `use3DMoment()` koşulu eklendi (şimdilik `show3D`'ye bağlı).
- **Kod denetimi:** Kritik hata yok. Derleme, yükleme sırası, isim çakışması ve hook kuralları temiz. `onResolve` her yolda tam bir kez çağrılıyor, maç asılı kalmıyor. Bellek temizliği tam, 2D akış değişmedi. Bulgular:
  - [önemli] **Denge:** En iyi rota kolay bulunuyor. 18 seçeneğin 14'ünde rota terimi +0.12'ye ulaşıyor, yani 3D kilit an 2D'den 12 puana kadar daha başarılı.
    - Pas: en yakın takım arkadaşına kısa pas tam puan alıyor (ilerleme terimi yok).
    - Şut: kaleci blok riskine dahil değil.
  - [önemli] **Otomatik rota:** Süre dolunca seçilen otomatik rota (−0.04), zayıf bir el çiziminden (en kötü −0.12) daha iyi sonuç verebiliyor. Bu "hiç çizme" stratejisini ödüllendiriyor.
  - [küçük] `moments.js`'te `MOMENT_TYPES` girintisi gereksiz yere değişmiş.
  - [küçük] Başarılı stratejik faulde kart/düdük animasyonu yok.
  - [küçük] NaN atlanan oyuncu slotu saha ortasında görünebilir.
  - [küçük] `pitchToWorld3D` string sayıları saha ortasına düşürüyor.
  - Hepsi Adım 4'ün başında düzeltilecek.
- **Commit:** `a36f297`

### Adım 4 — Skor tabelası ve 2D/3D geçişi ✅
- **Adım 3 düzeltmeleri:**
  - **Pas kalitesi:** Kesilme riski %50, alıcıya isabet %25, ilerleme/tehdit %25.
  - **Şut kalitesi:** Kaleciden uzaklık ve köşe isabeti sayılıyor. Kaleci blok riskine 0.35 ağırlıkla giriyor. Penaltı ve birebirde kaleci rastgele bir yana kaymış başlıyor.
  - **Rota terimi:** Asimetrik; üst sınır +0.05, alt sınır −0.12.
  - **Otomatik rota:** Sabit −0.12. Hiçbir el çiziminden iyi olamaz.
  - **Denge ölçümü (`bal3.js`):** En iyi rota ortalaması +0.049, rastgele makul rota ortalaması ≈0. İyi oynayan biri 2D'ye göre en fazla ~+5 puan alıyor.
  - **Diğer:** `MOMENT_TYPES` girintisi geri alındı. Başarılı faulde düdük efekti oynuyor. NaN slotu gizleniyor; string koordinatlar kabul ediliyor.
- **Yeni dosya `js/match/hud3d.js`:**
  - `Scoreboard3D` (HTML katman): rozet, skor, dakika, devre, son goller; golde yanıp sönme ve parıltı.
  - `getMatchViewPref`/`setMatchViewPref`: `fcym_match_view` anahtarı, değer `"2d"`/`"3d"`, varsayılan `"2d"`.
- **overlay.js:**
  - Başlıkta 2D/3D düğmesi var.
  - 3D modda tam genişlikte sahne ve tabela gösteriliyor; mini saha, Saha sekmesi ve büyük skor paneli gizleniyor.
  - Beta önizleme kaldırıldı.
  - 3D kilit an sırasında canlı sahne kapatılıyor, yani aynı anda tek WebGL bağlamı var.
  - 3D açılamazsa o maç için 2D'ye dönülüyor; tercih kalıcı olarak değişmiyor.
  - 2D modda 3D'ye özgü hiçbir maliyet yok.
- **Diğer dosyalar:** `pitch3d.js`'e `controlsAt` prop'u eklendi. Ayarlar sayfasına (`js/ui/nav.js`) "Maç Görünümü 2D/3D" seçeneği eklendi.
- **Kod denetimi:** Kritik ya da önemli hata yok. Derleme, yükleme sırası, isim çakışması, hook sırası (viewMode değişince değişmiyor) ve WebGL bağlam yönetimi temiz. Maç akışı, kayıt şekli ve denge doğrulandı. 4 küçük bulgu çıktı, ana oturumda düzeltildi:
  - `setMatchViewPref` artık `safeLsSet` kullanmıyor. `safeLsSet` kota dolunca en eski menajer kaydını siliyordu.
  - 3D modda maç bitince sonuç paneli görünür alana kaydırılıyor, böylece "DEVAM ET" düğmesi görünüyor.
  - Ayarlar'da WebGL yokken 2D seçili gösteriliyor.
  - 3D kilit an hata yüzünden 2D'ye düşerse maç görünümü de 2D'ye geçiyor. "2D'ye geç" düğmesi yalnız o anı etkiliyor.
- **Düzeltme sonrası kontrol:** Babel 7.23.5 derlemesi, `node --check` ve sunucu tarafı render testi geçti.

## Sonuç ve açık işler
4 adımın hepsi tamamlandı. Oyun henüz gerçek tarayıcıda / Android WebView'da elle test edilmedi. Test edilmesi gerekenler:
- 2D↔3D'yi maç sırasında defalarca değiştir; interval, skor, devre arası ve kilit anlar bozulmamalı, konsolda WebGL bağlam uyarısı çıkmamalı.
- 6 kilit an tipinin hepsinde çizim, risk göstergesi, güç barı ve animasyon doğru çalışmalı; mobilde dokunarak çizim yapılabilmeli.
- 360 px genişlikte başlık düğmeleri, tabela ve kamera düğmeleri çakışmamalı; sonuç panelinde "DEVAM ET" görünmeli.
- Ağ kapalıyken ya da WebGL yokken 2D'ye düşüş ve uyarılar çıkmalı.
- Android'de FPS kontrol edilmeli (yaklaşık 190 çizim çağrısı var).

Bilinen sınırlamalar:
- Rakip golcü adları motorda olmadığı için tabelada yalnız dakika görünüyor.
- 3D modda Saha sekmesindeki formasyon özeti gizli.
- Kalecide dalış animasyonu yok.
- Şut yüksekliği çizilemiyor.

### Adım 5 — Topa bağlı oyun ve serbest kontrollü kilit anlar ✅
- **Normal akış (`players3d.js`):**
  - Her an bir top sahibi var (`ballPos` hedefine en yakın oyuncu).
  - Top, koşuyla senkron dokunuşlarla ayağın 0.8–1.25 m önünde sürülüyor ve oyuncuyla dönüyor.
  - Sahiplik değişince top fiziksel bir yörüngeyle gidiyor:
    - kısa ve açık yolda yerden pas (sürtünmeli),
    - uzun ya da önü kapalı pasta havadan parabol (g=9.8, inişte kısa yuvarlanma),
    - alıcı öngörülü hedeflemeyle topu alıyor; rakip araya girerse kesme ya da top kapma oluyor.
  - Santrada top orta noktaya inip forvette duruyor.
  - Hızlı modda tempo çarpanı var; top 10 m'den fazla koparsa erken pas atılıyor.
- **Kilit an (`moment3d.js`, baştan yazıldı):**
  - Seçenek kartları, rota çizimi ve güç barı kaldırıldı. Kilit an ~0.6 sn kamera girişinden sonra doğrudan kontrolle başlıyor.
  - Kontrol edilen oyuncunun çevresinde yarı saydam halka var. İlk 2.2 sn (`MOMENT3D_GUARD_SEC`) top kapılamıyor; bu sürede halka yanıp sönüyor.
  - **Klavye:** ok tuşları veya WASD.
  - **Fare:** oyuncu imlece doğru sürüyor.
  - **Dokunmatik:** sol altta sanal joystick.
  - **Rakip AI:** sınırlı dönüş hızıyla takip, markaj ve açı kapatan kaleci. Ani yön değişimiyle rakip geçilebiliyor.
  - **Tıklama:** noktalı çizgiyle yerden ya da havadan pas, en fazla 3 pas. Kontrol pası alan oyuncuya geçiyor.
  - **Basılı tutup geri çekme:** ağır çekim (0.2) ve kavisli ok. Ok güce göre renk değiştiriyor: yeşil 40–80, sonra sarı, turuncu, kırmızı (>90 isabetsiz). Yanal sürükleme falso veriyor, halkaya geri getirmek iptal ediyor.
  - **Duran toplar:** Penaltıda yalnız şut var. Korner ve serbest vuruşta tıklamak kısa pas, geri çekmek orta veya şut; serbest vuruşta duvar var.
  - **Savunma (tackle):** rakibe dokunmak kayarak müdahale, uzun basmak taktik faul, geri çekmek şut bloğu.
  - **Top kaptırma:** %65 ihtimalle son an vuruşu oluyor (`MOMENT3D_LAST_SHOT`), değer olarak tatlı bölgenin dışında.
  - **Süre dolunca:** otomatik zayıf eylem yapılıyor (terim −0.24).
  - **Sonuç:** `calcMomentChance` + konum kalitesi terimi (+0.05/−0.12) ile hesaplanıyor; görsel yörünge sonuca uyuyor.
  - `onResolve` sözleşmesi aynı; `optionId` artık yapılan eylemden geliyor.
- **pitch3d.js:** `setTimeScale`/`getTimeScale` eklendi; frame hook'larına ölçekli dt gidiyor. `screenToWorld` eklendi; `worldToScreen` kamera arkasındaki noktada null dönüyor.
- **Kod denetimi (kod-denetleyici, testleri kendisi koşturdu):**
  - Kritik hata yok.
  - Doğrulananlar: derleme, yükleme sırası, isim çakışması, hook kuralları, `onResolve` yolları (forceTimeout matrisi), pencere dinleyicilerinin temizlenmesi, ağır çekimin 1'e dönmesi, tek WebGL bağlamı, kayıt şeklinin değişmemesi.
  - Bulgular:
    - [önemli] pointercancel nişanı iptal etmek yerine şut atıyordu.
    - [önemli] Kontra ve birebirde hareketsiz ya da acemi oyuncu topu neredeyse her seferinde kaptırıyordu (%1).
    - [küçük] Ok rengi eşiği, korner süre dolması mesajı, fareyle nişanda oyuncunun kayması, `worldToScreen` kamera arkası, top–ballPos sapması (hızlı modda en çok 41 m), boş kadro, `mates` memo.
  - Hepsi düzeltildi.
- **Düzeltme sonrası testler (ana oturumda yeniden çalıştırıldı):**
  - Babel 7.23.5 ve `node --check` ile 8 dosya OK.
  - smoke5, kick, ssr5, audit5 ve audit5b geçti.
  - pointercancel artık vuruş yapmıyor.
  - Normal akışta top–ballPos sapması: normal hızda ortalama 2.4 m (en çok 8.3), hızlı modda ortalama 4.2 m (en çok 17.2).
- **Denge (`bal5.js`, 300 an/hücre, beklenen başarı %):**

| tip | 2D iyi | 2D rast | 3D iyi | makul | acemi | rastgele | hareketsiz |
|---|---|---|---|---|---|---|---|
| corner | 65.4 | 55.2 | 70.2 | 70.4 | 59.8 | 31.3 | 21.4 |
| freekick | 67.8 | 55.9 | 72.2 | 65.1 | 54.9 | 27.8 | 23.2 |
| counter | 67.7 | 56.2 | 63.9 | 64.1 | 50.6 | 26.1 | 19.1 |
| penalty | 69.5 | 58.6 | 73.1 | 72.9 | 59.3 | 43.8 | 20.5 |
| oneonone | 68.4 | 58.3 | 73.6 | 73.2 | 47.9 | 30.2 | 26.6 |
| tackle | 71.9 | 58.4 | 72.4 | 66.1 | 54.8 | 31.1 | 23.3 |

  - İyi oyun 2D'nin en iyisinden en çok +5.2 puan önde.
  - Hareketsiz oyun her tipte rastgele oyunun altında.
  - Birebirde acemi oyuncu 2D rastgelenin 10.4 puan gerisinde (hedef ≤10, sınırda).
- **Açık kalanlar:** Gerçek tarayıcıda ve Android'de elle test yapılmadı. Bakılacaklar: koruma halkasının görünürlüğü, joystick ile pası iki parmakla birlikte kullanmak, ağır çekim ve okun görünümü, hızlı modda koşu hızları, FPS.

### 6. Görsel ve oynanış güncellemesi — ✅ tamamlandı (gerçek cihaz testi bekliyor)
- [x] Eklemli low-poly oyuncu modeli (baş + saç, boyun, forma, şort, iki kol, dizli iki bacak, krampon) ve dinamik yer gölgesi
- [x] Animasyonlar: hıza orantılı koşu, duruşta nefes/bekleme salınımı, pas/şutta vuruş, müdahalede ayak uzatma, kalecide yana uçma, kayma, düşme, gol sevinci
- [x] Dolu tribünler (InstancedMesh taraftarlar, ev sahibi ağırlıklı formalar), gol ve kritik pozisyonlarda ayağa kalkma/zıplama, projektörler, LED reklam panoları, yedek kulübeleri
- [x] Tempo %40 yavaş; kısa üçgen paslar, kanatlara açılma, dokunuşlu top sürme, parabolik uzun toplar, normal akışta baskı
- [x] Kilit anlarda kademeli savunma baskısı (sprint → jokey → hamle), açı kapatan ikinci savunmacı, ayak uzatma; ani yön değiştirme ve boş koşuya ara pası baskıyı kırar

### Adım 6 — Görsel ve oynanış güncellemesi ✅
- **Yeni `js/match/rig3d.js`:** `createRigKit3D` (`build`/`setKit`/`dispose`), `animateRig3D`, `rigAction3D`, `rigBusy3D`, `RIG3D_HIP`, `RIG3D_ACT_DUR`.
  - Oyuncu başına 8 mesh, hepsi tek paylaşılan Lambert malzeme (renkler vertex renginde). Forma, ten, saç ve krampon çeşitleri geometri önbelleğinden gelir.
  - Eylemler: `kick` (gerilme → vuruş → takip), `poke`, `dive` (çömelme → uçuş → yerde → kalkış), `slide`, `fall`, `celebrate`.
- **Yeni `js/match/stadium3d.js`:** `buildStadium3D` → `{group, update, crowd:{setSupport, excite}}`.
  - Uzak uzun tribün + iki kale arkası (basamaklar, arka duvar, çatı tek birleşik mesh). Yakın taraf yayın kamerası için açık.
  - ~4.000 taraftar 3 InstancedMesh ile (gövde, baş, kol). Oturma/kalkma/zıplama vertex shader'da (`onBeforeCompile`); kare başına yalnızca 4 uniform yazılır.
  - 4 projektör kulesi (lamba yüzü + toplamsal parıltı), kayan LED panolar (uydurma markalar), iki yedek kulübesi (oturanlar da golde kalkar).
  - `setSupport(pay)`: overlay ev maçında 0.74, deplasmanda 0.3 verir. Taraftarlar 7×3 koltuk bloklarında kümelenir.
- **`three3d.js`:** `mergeGeos3D` (renkli geometri birleştirme), `disposeObject3D` InstancedMesh tamponlarını da bırakır.
- **`pitch3d.js`:** eski düz tribün/panolar kaldırıldı; stadyum sahneye eklenir, `api.crowd` açılır, kare döngüsünde `stadium.update`.
- **`players3d.js` (yeniden yazıldı, API aynı + `actionFx`, `diveFx`):**
  - Gölgeler tek InstancedMesh (güneş yönünde uzar, dalışta gövdeyi izler).
  - **Oyun yönetmeni (normal akış):** 2D ballPos doğrudan izlenmez, yumuşatılmış "çapa" olur. Topa sahip oyuncu puanlamayla karar verir: kısa (8–20 m) pas tercih, ileri pas, boştaki arkadaş, kanat değiştirme, çapaya yakınlık; ya da boş alana dokunuşlu top sürme. >27 m ya da önü kapalı pas parabolik uçar.
  - Pas önce vuruş animasyonuyla gerilir, top ~0.2 sn sonra çıkar. En yakın 2 arkadaş üçgen kurar, kanatlar topa sahipken açılır, forvetler ileri koşar.
  - Rakipte en yakın oyuncu kale tarafından baskı yapar (≤1.5 m'de ayak uzatır, %50 kapar), ikincisi açıyı kapatır. Pas yoluna giren rakip %45 keser.
  - Top çapadan ≥26 m kopup 1.5 sn kalırsa o bölgeye uzun top atılır.
  - Olaylar: şut anında vuran oyuncu vuruş animasyonu, kaleci dalışı, golde sevinç; tribün coşkusu (gol 1.0, şut/kurtarış 0.5–0.7, korner 0.4, ceza sahası baskısı 0.32).
  - **Tempo:** koşu 14→8.4, sürme 8–9.5→4.7, pas varış hızı 6→4.8, sürtünme 3.2→2.6 m/sn², senaryo süreleri ×1/0.6. Kilit an (manual) top fiziği eski değerlerde kaldı (denge ölçümü buna göre).
- **`overlay.js`:** `MATCH3D_TEMPO=0.6`, 3D görünümde maç saati %40 yavaş (tick 280 → 467 ms). Görünüm maç sırasında değişirse interval yeniden kurulur. 2D akış aynı.
- **`moment3d.js`:**
  - Baskı yapan savunmacı (topa en yakın kale tarafındaki): >6 m sprint (ivme 6.5) → ≤6 m jokey (kale tarafında ~2 m, geri/yan adım, yanal hız ×0.6) → `MOMENT3D_JOCKEY_SEC` (0.9 sn) jokeyden sonra ya da top süren yavaşlayınca 0.8 sn hamle → boşa giderse 0.6 sn toparlanma. ≤1.7 m'de ayak uzatma animasyonu.
  - Kapma oranı çarpanları: jokey 0.1, hamle 0.7, açı kapatan 0.4 (`MOMENT3D_*_TACKLE`).
  - İkinci savunmacı top–kale çizgisinde ~6.5 m önde, sürüş yönüne kayar.
  - Boş koşu: ~2.8 sn'de bir takım arkadaşı savunma hattının arkasına çapraz koşar, hedefi soluk beyaz halkayla gösterilir (ara pas). İpucu metni güncellendi.
  - Kaleci dalışları `diveFx` ile (gol: geç kalır, kurtarış: uzak köşeye uçar; gövde kayması hesaba katılır).
- **Ölçümler (başsız, `flow.js`):** normal akışta top hızı ortalaması 16.4 → 8.1 m/sn, en yüksek oyuncu hızı 14 → 8.5 m/sn, NaN yok, kare başına kanca ~0.05 ms, dispose sonrası kanca 0.
- **Denge (`bal5.js`, 200 an/hücre):** iyi oyun 2D'nin en iyisine göre −0.7…+5.4; acemi/rastgele/hareketsiz Adım 5 ile aynı aralıkta. Kontrada kaleye düz süren "makul" bot −3.7 → −14 (bilinçli: kale tarafındaki baskı düz sürmeyi cezalandırır). Tablo `moment3d.js` başında.
- **Gerçek WebGL kontrolü (başsız Edge, SwiftShader):** shader derleme hatası yok. Yayın kamerası ~250 çizim çağrısı, ~190 bin üçgen (taraftarlar ~150 bin).

### Adım 7 — Kilit an kamerası, mobil ve dokunmatik kontroller ✅
- **Kamera (asıl sorun):** Dikey ekranda `pitch3d` özel kamerayı sahne sığsın diye 2 kata kadar geri çekiyordu. Kornerde (eski konum saha dışında, z −42) ve savunmada (x −63) kamera tribünün içine/arkasına düşüyor, tribün sahayı kapatıyordu.
  - `three3d.js`: `pitch3dSafeCam`. Kamera saha + kenar payı kutusuna (|x| ≤ 53.5, |z| ≤ 35.5) kırpılır. Kırpılan yatay mesafenin bir kısmı yüksekliğe eklenir, kale ağına alçaktan girmez.
  - `pitch3d.js`: kırpma, özel kamerada dikey geri çekilmeden **sonra** her karede uygulanır. Kutu dışbükey olduğu için kamera ile oyun arasına tribün, çatı, pano ya da kulübe giremez.
  - `moment3d.js`: kamera açıları saha içinde ve yüksek. Korner: ceza sahası üstünden köşeye bakar, kale altta, top üstte. Diğerleri oyun arkasından. Takip odağı oyuncuya daha yakın.
  - Ölçüm (`t7c.js`, 0.557 ve 1.6 en-boy oranı): oyuncu ve top bütün tiplerde kadrajda (|NDC| ≤ 0.67). 6 tipte 240 karede kutu dışına çıkan kamera yok.
- **Mobil:**
  - `sunucu.js --lan`: 0.0.0.0'a bağlanır ve yerel ağ adreslerini (Wi-Fi önce) yazar. `baslat.bat` bu modu kullanır. Gizli yollar her modda 403 döner: nokta ile başlayan parçalar (`.git`, `.claude`), Windows kısa adları (`GIT~1`), `::$DATA` akışları. Ayrıca `realpath` ile çözülen gerçek yol kökün içinde ve gizli olmamalı. Yalnızca localhost ya da IP adresiyle gelen istekler kabul edilir (DNS rebinding koruması).
  - 3D tuval her zaman `touch-action:none`. Kilit an katmanı `touch-action:none` + `overscroll-behavior:contain`, ayrıca eski iOS için `touchmove` engellenir.
- **Dokunmatik kontroller:**
  - **Yüzen sanal çubuk:** Hücum ya da savunmada sahada basılı tutup sürükle. Basılan nokta merkez olur ve oyuncu sürükleme yönüne gerçek zamanlı sürer/koşar. Fare ile basılı sürükleme de aynı. Sol alt bölge hâlâ çubuğu anında başlatır.
  - **Kısa dokunuş:** pas (boş koşu halkası / takım arkadaşı). Savunmada rakibe dokunmak kayarak müdahale yapar. Oyuncu/top üzerinden geri çekme: ağır çekim, yeşilden kırmızıya kavisli ok, yana bükme ile falso (Adım 5'ten).
  - **Vuruş noktası (frikik/korner/penaltı):** Sağ altta top simgesi.
    - Topun sağı sola falso verir (`SPIN_CURL` 0.3 rad, parmak bükmesiyle toplanır, ±0.6 sınırı). Solu sağa falso verir.
    - Altı: yüksek yay; blok/baraj riski ×(1−0.45), isabet ×(1−0.2).
    - Üstü: sert ve alçak; blok riski ×1.25, kaleci terimi +0.12.
    - Yalnız duran topun ilk vuruşunda geçerli; ilk pas ya da oyun başlayınca sıfırlanır ve simge gizlenir. Falsonun blok indirimi yalnız parmak bükmesinden gelir; üst vuruşun isabet bedeli ×(1−0.12).
    - Etki, konum kalitesi terimiyle sınırlı (+0.05/−0.12). Bot dengesi değişmedi (vuruş noktası 0).
- **Denge (`bal5.js`, 150 an/hücre):** iyi oyun 2D'nin en iyisine göre −0.1 … +5.2. Adım 6 ile aynı aralıkta.

### Adım 8 — Hibrit kamera, sapan, koşu yolu, vuruş ekranı, ok ile müdahale ✅
- **Hibrit kamera:** Maç görünümüne `top` (Kuşbakışı 2.5D) kamera modu eklendi ve varsayılan yapıldı. Kilit anda oyun akışı da neredeyse tepeden (~11° eğim) çekiliyor; dikey ekranda hücum yönü yukarı bakıyor. Şut, orta veya duran top vuruşu onaylanınca `setCustomCamera(..., low=true)` çağrılıyor ve kamera çim seviyesine iniyor (`PITCH3D_CAM_LOW_Y`, saha kutusu kırpması sürüyor). Ortada top inince kamera kuşbakışına dönüyor.
- **Sapan:** Topa sahip oyuncudan ters yöne çekince kısa çekişte yeşil koşu oku çıkıyor (bırakınca 3–12 m top sürer). Çekiş `MOMENT3D_DRIB_F` eşiğini geçince ok kırmızı vuruş okuna dönüyor (güç 30–100). Duran topta çekişin tamamı vuruştur. Fare imleciyle yönlendirme kaldırıldı.
- **Pas ve koşu yolu:** Takım arkadaşına dokunmak doğrudan pas atar. Takım arkadaşından sürükleyince noktalı beyaz bir rota çizilir (en fazla 34 m). Rotaya dokununca alıcısı koşucu olan bir ara pası atılır (`passTo(..., recv)`); kesilme olasılığı eski formülle hesaplanır. Otomatik boş koşular kaldırıldı.
- **Vuruş ekranı:** Kırmızı ok bırakılınca `phase="strike"` olur, simülasyon ve süre durur. Büyük topa dokunulan nokta falsoyu ve yüksekliği belirler. Merkez düz vuruştur. Sağ/sol kenar topu o yöne kıvırır (blok riski ×0.8, isabet ×0.9). Alt ve üst eskisi gibi çalışır. 4 sn içinde dokunulmazsa top düz vurulur.
- **Savunma:** Savunmacıdan rakibe ok çizilir. 4.2 m'ye kadar beyaz/yeşil ok ayakta müdahaledir (`block` seçeneği). Daha uzun kırmızı ok kayarak müdahaledir (`slide`); arkadan gelip kaçarsa %60 olasılıkla faul olur (sarı kart ve serbest vuruş). Rakibe dokunmak ayakta müdahale, uzun basmak faul yapar.
- **Adalet:** Sonuç yine `calcMomentChance` ve konum terimiyle (+0.05/−0.12) belirlenir. Bot API'si korundu ve genişletildi (`beginStrike`, `confirmStrike`, `setRun`, `dribbleTo`, `standTackle`, `slideTackle`). Başsız testler (Three.js r128 ve sahte tuval, 1.6 ve 0.7 en-boy) bütün akışları geçti. Gerçek cihazda dokunmatik test bekleniyor.
- **Kadraj (denetim düzeltmesi):** Kuşbakışı yüksekliği ve odak artık top, oyuncumuz, topa 45 m'ye kadar yakın takım arkadaşları ve koşu yolundan hesaplanıyor (en çok 78 m, `PITCH3D_CAM_TOP_MAX_Y=80`). Pitch3D'nin dikey ekranda geri çekilmesi kaldırıldı. Saha yönü (boy yatay ya da dikey) her kilit anın başında bir kez, kadraja daha iyi uyan şekilde seçiliyor. Test: 1.6, 0.7 ve 0.5 en-boy oranlarında altı tipin hepsinde top ve bütün saha oyuncuları ekranda kalıyor.
