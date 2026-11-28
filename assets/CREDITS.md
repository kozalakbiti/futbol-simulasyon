# 3D model kaynakları ve atıflar

3D maç sahnesinin hazır modelleri (`assets/models/`). Hepsi Poly Pizza'dan indirildi. Yükleyen kod: `js/match/assets3d.js`.
Bir model yüklenemezse oyun o parça için prosedürel modeli kullanır.

| Dosya | Model | Yazar | Lisans | Kaynak | Oyundaki değişiklik |
|---|---|---|---|---|---|
| `ball.glb` | Simple soccer football | Smirnoff Alexander | CC-BY 3.0 | https://poly.pizza/m/57u6P7Sr7K0 | Top yarıçapına ölçeklendi, merkezlendi |
| `goal.glb` | Soccer goal | Poly by Google | CC-BY 3.0 | https://poly.pizza/m/7t4hmicGHV4 | Yalnız direkler ve üst direk kullanılıyor; düzeltilip ölçeklendi, direkler inceltildi, kırmızı şeritler beyaza çevrildi |
| `stadium.glb` | Low Poly Sports Stands | Cole Brenner | CC-BY 3.0 | https://poly.pizza/m/26j2bQ3zuUL | Ölçeklendi; gündüz sahnesinde dört köşeye yerleştirildi |
| `tree.glb` | Tree | Quaternius | CC0 (kamu malı) | https://poly.pizza/m/1BkD9JnKrE | Şu an kullanılmıyor (prosedürel gövdeli çam/meşe ağaçları tercih edildi) |
| `player.glb` | Man (iskeletli, low-poly) | Quaternius | CC0 (kamu malı) | https://poly.pizza/m/HMnuH5geEG | Rig boyuna ölçeklendi; forma/şort/tozluk/ten/saç malzemeleri takım ve kaleci renkleriyle yeniden boyanıyor; hazır animasyonlar yerine kemikler oyunun eklemli rigiyle sürülüyor; IK ayak kemikleri baldıra bağlandı |

CC-BY 3.0 lisansı (https://creativecommons.org/licenses/by/3.0/) atıf ister. Oyun yayımlanırken bu
atıflar oyunun "Hakkında / Emeği geçenler" bölümünde ya da mağaza açıklamasında da yer almalıdır.

`js/vendor/GLTFLoader.js`: three.js r128 `examples/js/loaders/GLTFLoader.js` (MIT, three.js yazarları).

`assets/textures/`: harici doku dosyaları için ayrıldı. Çim, gök, seyirci ve AO dokuları şu an
`js/match/day3d.js` içinde tuvalle (canvas) üretiliyor, dosya gerekmiyor.

## 3D Kulüp Kampüsü çevre modelleri (`js/screens/club-hub-3d.js`)

Yazar: Kenney (https://kenney.nl), lisans: CC0 (kamu malı, atıf zorunlu değil). Kit adları dosya
adlarından ve glb üreticisinden çıkarıldı; yayın öncesi doğrulanmalı.

| Dosya | Kit | Oyundaki değişiklik |
|---|---|---|
| `building-type-a.glb` … `building-type-f.glb`, `fence.glb`, `tree-small.glb` | City Kit (Suburban) | Kitin `colormap.png` paleti klasörde yok: glb'deki dış doku başvurusu yüklenirken ayıklanıyor, yerine tuvalde üretilen 3 renk varyantlı palet atlası (çatı/duvar/süs/kapı) kullanılıyor |
| `tree_oak.glb`, `tree_detailed.glb`, `tree_pineRoundA.glb`, `tree_pineTallA.glb`, `rock_largeA.glb`, `grass_large.glb` | Nature Kit | Işıksız (`KHR_materials_unlit`) malzemeler gölge alan PBR malzemelerle değiştirildi, yapraklara örnek başına ton varyasyonu |

Bir model yüklenemezse o parça prosedürel yedeğe düşer (ev modellerinin hiçbiri yüklenemezse eski kiremit çatılı sıra evler çizilir).
