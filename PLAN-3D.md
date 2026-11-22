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

### 2. 22 oyuncu ve maç olayları senkronizasyonu — 🔨 devam ediyor
- [ ] Adım 1 denetim bulgularının düzeltilmesi (aşağıdaki günlüğe bak)
- [ ] 11 + 11 düşük poligon oyuncu (forma renkleri, kaleci farklı renk, numara/isim etiketi)
- [ ] `playerDots`/`oppDots`/`ballPos`'u ref üzerinden okuyup lerp ile izleme (2D ile aynı koordinat sistemi)
- [ ] Top: yay çizen pas/şut animasyonu, gölge
- [ ] `ballEvents`/olay tipine göre 3D efektler: gol (file sallanır + kamera yakın plan), kurtarış, aut, korner, kart
- [ ] Gol sonrası santra dönüşü

### 3. Kilit anlarda interaktif pas/şut çizimi ve müdahale — ⏳ bekliyor
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
