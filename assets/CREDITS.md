# 3D model kaynakları ve atıflar

3D maç sahnesinin hazır modelleri (`assets/models/`). Hepsi Poly Pizza'dan indirildi. Yükleyen kod: `js/match/assets3d.js`.
Bir model yüklenemezse oyun o parça için prosedürel modeli kullanır.

| Dosya | Model | Yazar | Lisans | Kaynak | Oyundaki değişiklik |
|---|---|---|---|---|---|
| `ball.glb` | Simple soccer football | Smirnoff Alexander | CC-BY 3.0 | https://poly.pizza/m/57u6P7Sr7K0 | Top yarıçapına ölçeklendi, merkezlendi |
| `goal.glb` | Soccer goal | Poly by Google | CC-BY 3.0 | https://poly.pizza/m/7t4hmicGHV4 | Yalnız direkler ve üst direk kullanılıyor; düzeltilip ölçeklendi, direkler inceltildi, kırmızı şeritler beyaza çevrildi |
| `stadium.glb` | Low Poly Sports Stands | Cole Brenner | CC-BY 3.0 | https://poly.pizza/m/26j2bQ3zuUL | Ölçeklendi; gündüz sahnesinde dört köşeye yerleştirildi |
| `tree.glb` | Tree | Quaternius | CC0 (kamu malı) | https://poly.pizza/m/1BkD9JnKrE | Ölçeklendi, örneklenerek çoğaltıldı |
| `player.glb` | Man (iskeletli, low-poly) | Quaternius | CC0 (kamu malı) | https://poly.pizza/m/HMnuH5geEG | Rig boyuna ölçeklendi; forma/şort/tozluk/ten/saç malzemeleri takım ve kaleci renkleriyle yeniden boyanıyor; hazır animasyonlar yerine kemikler oyunun eklemli rigiyle sürülüyor; IK ayak kemikleri baldıra bağlandı |

CC-BY 3.0 lisansı (https://creativecommons.org/licenses/by/3.0/) atıf ister. Oyun yayımlanırken bu
atıflar oyunun "Hakkında / Emeği geçenler" bölümünde ya da mağaza açıklamasında da yer almalıdır.

`js/vendor/GLTFLoader.js`: three.js r128 `examples/js/loaders/GLTFLoader.js` (MIT, three.js yazarları).

`assets/textures/`: harici doku dosyaları için ayrıldı. Çim, gök, seyirci ve AO dokuları şu an
`js/match/day3d.js` içinde tuvalle (canvas) üretiliyor, dosya gerekmiyor.
