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

### 3. Kilit anlarda interaktif pas/şut çizimi ve müdahale — 🔨 devam ediyor
- [ ] Adım 2 denetim bulgularının düzeltilmesi (aşağıdaki günlüğe bak)
- [ ] `InteractiveMoment3D`: kilit an sahnesi (oyuncular olay tipine göre dizilir, kamera yaklaşır)
- [ ] Parmakla/fareyle sahaya pas veya şut rotası çizme (raycast → zemin), rota önizlemesi, rakip araya girme riski göstergesi
- [ ] Rota kalitesi + oyuncu istatistikleri + mevcut seçenek/güç mantığıyla başarı hesabı; savunma anında (tackle) müdahale noktası seçme
- [ ] Sonucun 3D animasyonu, ardından **aynı `onResolve` sözleşmesi**
- [ ] 3D yüklenemezse mevcut 2D `InteractiveMoment`'e düşme

### 4. Skor tabelası ve 2D/3D geçişi — ⏳ bekliyor
- [ ] 3D görünüm üzerinde skor tabelası (takımlar, skor, dakika, devre, gol atanlar), gol anında vurgu
- [ ] `MatchOverlay`'e 2D/3D geçiş düğmesi; tercih `safeLsGet/safeLsSet` ile ayrı anahtarda saklanır
- [ ] WebGL yoksa düğme devre dışı + Türkçe uyarı; 2D akışı (sekmeler, devre arası, sonuç paneli) bozulmaz
- [ ] Performans: 3D kapalıyken render döngüsü durur, maç kapanınca her şey temizlenir

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
