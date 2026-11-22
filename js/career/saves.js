// ══════════════════════════════════════════════════════════════
// YENİ SİSTEMLER v6
// ══════════════════════════════════════════════════════════════

// ── 1. KAYIT / YÜKLEME SİSTEMİ (Oyuncu Kariyeri) ─────────────
// Oyuncu kariyer kayıtları: fcyildiz_player_saves (antrenör modundan AYRI)
// Antrenör kariyer kayıtları: fcym_save_index + fcym_save_slot_* ve fcym_coach_saves
const PLAYER_SAVES_KEY = 'fcyildiz_player_saves';
const PLAYER_MAX_SLOTS = 5;

function saveCareer(player, slotId) {
  try {
    const saves = getPlayerSaves();
    const sid = slotId != null ? Number(slotId) : null;
    if (sid == null && saves.length >= PLAYER_MAX_SLOTS) return { ok: false, reason: 'max' };
    // Checksum: oyuncu verisini de imzala
    const playerData = { ...player };
    const chk = calcSaveChecksum({
      clubName: player.team||"",
      transferBudget: 0,
      rep: { pts: player.rep||0 },
      squad: [],
      season: { played: player.matches||0 },
      careerStats: { seasons: Array(player.season||1) },
    });
    const slot = {
      id: sid != null ? sid : Date.now(),
      savedAt: Date.now(),
      schemaVersion: SAVE_SCHEMA_VERSION,
      gameVersion: GAME_VERSION,
      name: player.name || 'Oyuncu',
      age: player.age || 18,
      season: player.season || 1,
      ovr: player.ovr || 50,
      pos: player.pos || 'CM',
      team: player.team || 'Serbest',
      _checksum: chk,
      data: { player: playerData }
    };
    let newSaves;
    if (sid != null) {
      newSaves = saves.map(s => Number(s.id) === sid ? slot : s);
      if (!newSaves.some(s => Number(s.id) === sid)) newSaves = [...saves, slot];
    } else {
      newSaves = [slot, ...saves];
    }
    const ok = safeLsSet(PLAYER_SAVES_KEY, newSaves);
    return ok ? { ok: true, slot } : { ok: false, reason: 'storage_full' };
  } catch(e) { return { ok: false, reason: e.message }; }
}

function getPlayerSaves() {
  return safeLsGet(PLAYER_SAVES_KEY, []);
}

function loadCareerSlot(slotId) {
  try {
    const saves = getPlayerSaves();
    const slot = saves.find(s => s.id === slotId);
    if (!slot?.data?.player) return null;
    // Oyuncu kariyer verisi koç modundan farklı yapıda (seasonGoals array vs number)
    // Sadece temel sınır kontrollerini uygula, tam sanitizasyon yapma
    const p = slot.data.player;
    return {
      ...p,
      ovr:    Math.max(30, Math.min(99,  parseInt(p.ovr)  || 50)),
      pot:    Math.max(30, Math.min(99,  parseInt(p.pot)  || 50)),
      age:    Math.max(14, Math.min(45,  parseInt(p.age)  || 18)),
      morale: Math.max(0,  Math.min(100, parseInt(p.morale)||75)),
      fatigue:Math.max(0,  Math.min(100, parseInt(p.fatigue)||0)),
      // seasonGoals oyuncu modunda array — dokunma
      seasonGoals: Array.isArray(p.seasonGoals) ? p.seasonGoals : [],
    };
  } catch(e) { return null; }
}

function deleteCareerSlot(slotId) {
  try {
    const saves = getPlayerSaves().filter(s => s.id !== slotId);
    return safeLsSet(PLAYER_SAVES_KEY, saves);
  } catch(e) { return false; }
}

// Geriye dönük uyumluluk — eski tek-slot sisteminden göç
function migrateOldSave() {
  try {
    const old = localStorage.getItem('fcyildiz_career_v6');
    if (!old) return;
    const data = safeLsGet('fcyildiz_career_v6');
    if (!data?.player) return;
    const saves = getPlayerSaves();
    if (saves.some(s => s.id === 0)) return;
    const migrated = {
      id: 0,
      savedAt: new Date(data.savedAt || Date.now()).getTime(),
      schemaVersion: SAVE_SCHEMA_VERSION,
      gameVersion: GAME_VERSION,
      name: data.player.name || 'Oyuncu',
      age: data.player.age || 18,
      season: data.player.season || 1,
      ovr: data.player.ovr || 50,
      pos: data.player.pos || 'CM',
      team: data.player.team || 'Serbest',
      data: { player: data.player }
    };
    safeLsSet(PLAYER_SAVES_KEY, [migrated, ...saves]);
  } catch(e) {}
}
migrateOldSave(); // Sayfa yüklenince bir kez çalışır

// ── TAM EKRAN — Capacitor WebView ────────────────────────────
// WebView'da Fullscreen API çalışmaz; tam ekran MainActivity'den yönetilir.
// Burada sadece CSS tarafını halledelim: status bar rengi koyu tutulsun,
// safe-area padding'ler doğru hesaplansın.
(function initFullscreen(){
  // Capacitor plugin varsa StatusBar'ı gizle
  try {
    if(window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.StatusBar) {
      window.Capacitor.Plugins.StatusBar.hide().catch(()=>{});
    }
  } catch(e) {}

  // Capacitor hazır olduğunda tekrar dene
  document.addEventListener("deviceready", function(){
    try {
      if(window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.StatusBar) {
        window.Capacitor.Plugins.StatusBar.hide().catch(()=>{});
      }
    } catch(e) {}
  }, { once: true });

  // Portre modu kilidi — Capacitor ScreenOrientation plugin
  try {
    if(window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.ScreenOrientation) {
      window.Capacitor.Plugins.ScreenOrientation.lock({ orientation: "portrait" }).catch(()=>{});
    }
  } catch(e) {}
})();
