// ── Ana Kariyer Ekranı v4 ──────────────────────────────────────

// ══════════════════════════════════════════════════════════════
// GÜVENLİK & VERİ BÜTÜNLÜĞÜ SİSTEMİ
// ══════════════════════════════════════════════════════════════

const GAME_VERSION = "7.9.5.3";
const SAVE_SCHEMA_VERSION = 4; // save formatı değiştiğinde artır (v4: Avrupa kupaları Swiss model)

// ── SINIR TANIMLARI (exploit önleme) ──────────────────────────
const LIMITS = {
  ovr:      { min: 30,  max: 99    },
  pot:      { min: 30,  max: 99    },
  age:      { min: 14,  max: 45    },
  val:      { min: 0,   max: 500   }, // M€
  sal:      { min: 0,   max: 50000 }, // K€/hafta
  moral:    { min: 0,   max: 100   },
  fatigue:  { min: 0,   max: 100   },
  seasonGoals:   { min: 0, max: 200 },
  seasonAssists: { min: 0, max: 200 },
  seasonMatches: { min: 0, max: 100 },
  rep:      { min: 0,   max: 200   },
  budget:   { min: -999999, max: 9999999 }, // K€
};

// ── CHECKSUM (basit imza — manipülasyon tespiti) ──────────────
// Kayıt edilirken kritik alanların hash'i oluşturulur,
// yüklenirken kontrol edilir. Uyuşmazlık = uyarı göster.
function calcSaveChecksum(data) {
  try {
    const critical = [
      data.clubName||"",
      String(Math.round((data.transferBudget||data.budget||0))),
      String(Math.round(data.rep?.pts||0)),
      String((data.squad||[]).length),
      String((data.squad||[]).reduce((s,p)=>s+(p.ovr||0),0)),
      String(data.season?.played||0),
      String((data.careerStats?.seasons||[]).length),
    ].join("|");
    // Basit djb2 hash
    let h = 5381;
    for(let i=0;i<critical.length;i++) h=((h<<5)+h)^critical.charCodeAt(i);
    return (h>>>0).toString(16);
  } catch(e) { return "0"; }
}

// ── OYUNCU VERİSİ DOĞRULAMA (bozuk / manipüle edilmiş değer tespiti) ──
function sanitizePlayer(p) {
  if(!p||typeof p!=="object") return null;
  const clamp=(v,min,max,def)=>{
    const n=parseFloat(v);
    if(isNaN(n)) return def;
    return Math.max(min,Math.min(max,n));
  };
  return {
    ...p,
    ovr:     clamp(p.ovr,     LIMITS.ovr.min,     LIMITS.ovr.max,     60),
    pot:     clamp(p.pot,     LIMITS.pot.min,     LIMITS.pot.max,     60),
    age:     clamp(p.age,     LIMITS.age.min,     LIMITS.age.max,     22),
    val:     clamp(p.val,     LIMITS.val.min,     LIMITS.val.max,     0.5),
    sal:     clamp(p.sal,     LIMITS.sal.min,     LIMITS.sal.max,     100),
    moral:   clamp(p.moral,   LIMITS.moral.min,   LIMITS.moral.max,   75),
    fatigue: clamp(p.fatigue, LIMITS.fatigue.min, LIMITS.fatigue.max, 0),
    seasonGoals:   clamp(p.seasonGoals,   LIMITS.seasonGoals.min,   LIMITS.seasonGoals.max,   0),
    seasonAssists: clamp(p.seasonAssists, LIMITS.seasonAssists.min, LIMITS.seasonAssists.max, 0),
    seasonMatches: clamp(p.seasonMatches, LIMITS.seasonMatches.min, LIMITS.seasonMatches.max, 0),
    seasonRatings: Array.isArray(p.seasonRatings)
      ? p.seasonRatings.filter(r=>typeof r==="number"&&r>=0&&r<=100).slice(0,50)
      : [],
    devPoints: clamp(p.devPoints, 0, 9999, 0),
    injured:  clamp(p.injured,  0, 52,  0),
    injSev:   clamp(p.injSev,   0, 3,   0),
  };
}

// ── SAVE VERİSİ DOĞRULAMA & MİGRASYON ────────────────────────
// ── v4: 32 takımlı grup sistemi → 36 takımlı Swiss model (CL/UEFA/CON) ──
// Eski grup tabloları ve oynanmamış eski CL/UEFA fikstürleri kaldırılır. Kullanıcının
// kupası (force) korunur. Sezon Eylül'ü geçtiyse tablolar yüklemede hemen kurulur (rebuild),
// geçmemişse Eylül kurasında kurulur. Yeni kayıtlarda (clTable vb. var) hiçbir şey yapmaz.
function migrateEuroSwissSave(data){
  const s=data&&data.season;
  if(!s||typeof s!=="object") return false;
  const isLegacyEuro=(f)=>(f.comp==="CL"||f.comp==="UEFA")&&!f.sw;
  const hasTables=!!(s.clTable||s.uefaTable||s.conTable);
  const peg=data.pendingEuroGroups;
  const legacyPeg=!!(peg&&!peg.swiss);
  const legacyFix=(s.fixture||[]).filter(isLegacyEuro);
  const hasGroups=!!(s.clGroups||s.uefaGroups);
  if(hasTables&&!legacyPeg&&!legacyFix.length&&!hasGroups) return false;
  const inGroups=(g)=>!!g&&Object.values(g).some(arr=>(arr||[]).some(t=>t&&t.me));
  let force=inGroups(s.clGroups)?"CL":inGroups(s.uefaGroups)?"UEFA":(legacyFix[0]&&legacyFix[0].comp)||null;
  if(legacyPeg&&(peg.type==="CL"||peg.type==="UEFA")) force=peg.type; // sezon sonunda kazanılmış hak
  s.fixture=(s.fixture||[]).filter(f=>!isLegacyEuro(f));
  s.clGroups=null; s.uefaGroups=null;
  if(!hasTables){
    s.clTable=null; s.uefaTable=null; s.conTable=null;
    const MO=["Temmuz","Agustos","Eylul","Ekim","Kasim","Aralik","Ocak","Subat","Mart","Nisan","Mayis","Haziran"];
    const lastMi=(s.results||[]).reduce((mx,r)=>Math.max(mx,MO.indexOf(r.month||"")),-1);
    const ligLeft=(s.fixture||[]).some(f=>!["HAZ","ZTK","CL","UEFA","CON","SUPERKUPA"].includes(f.comp));
    const rebuild=!legacyPeg&&ligLeft&&lastMi>=MO.indexOf("Eylul");
    data.pendingEuroGroups={swiss:true,quals:null,force,rebuild};
  } else if(legacyPeg){
    data.pendingEuroGroups={swiss:true,quals:null,force};
  }
  return true;
}

function validateAndMigrateSave(data) {
  if(!data||typeof data!=="object") return {ok:false,reason:"Boş veri"};

  const warnings = [];
  const v = data.schemaVersion||data.version||1;

  // ── Migrasyon: v1 → v3 ──
  if(v < 2) {
    // budget tek alandan iki alana ayrıldı
    if(data.budget!==undefined && data.transferBudget===undefined) {
      data.transferBudget = Math.round((data.budget||0)*0.6);
      data.wageBudget     = Math.round((data.budget||0)*0.4);
    }
    warnings.push("v1→v3 migrasyon uygulandı");
  }
  if(v < 3) {
    // rep eski formattan yeni formata
    if(typeof data.rep === "number") {
      data.rep = { pts: Math.max(0,Math.min(200,data.rep)), history:[] };
      warnings.push("rep formatı güncellendi");
    }
  }

  // ── Checksum kontrolü ──
  let checksumOk = true;
  if(data._checksum) {
    const expected = calcSaveChecksum(data);
    if(data._checksum !== expected) {
      checksumOk = false;
      warnings.push("⚠️ Kayıt imzası uyuşmuyor — veri değiştirilmiş olabilir");
    }
  }

  // ── Migrasyon: v3 → v4 — Avrupa kupaları (checksum sonrası: imza alanlarına dokunmaz) ──
  if(v < 4) {
    if(migrateEuroSwissSave(data)) warnings.push("Avrupa kupaları 36 takımlı lig aşaması formatına taşındı");
  }
  if(v < SAVE_SCHEMA_VERSION) data.schemaVersion = SAVE_SCHEMA_VERSION;

  // ── Oyuncu verisi sanitizasyonu ──
  if(Array.isArray(data.squad)) {
    data.squad = data.squad.map(sanitizePlayer).filter(Boolean);
  }
  if(Array.isArray(data.db)) {
    data.db = data.db.map(sanitizePlayer).filter(Boolean);
  }

  // ── Rep sınır kontrolü ──
  if(data.rep?.pts !== undefined) {
    data.rep.pts = Math.max(LIMITS.rep.min, Math.min(LIMITS.rep.max, data.rep.pts));
  }

  // ── Bütçe sınır kontrolü ──
  if(data.transferBudget !== undefined) {
    data.transferBudget = Math.max(LIMITS.budget.min, Math.min(LIMITS.budget.max, data.transferBudget));
  }
  if(data.wageBudget !== undefined) {
    data.wageBudget = Math.max(LIMITS.budget.min, Math.min(LIMITS.budget.max, data.wageBudget));
  }

  return { ok:true, data, warnings, checksumOk };
}

// ── GÜVENLİ localStorage OKUMA (bozuk JSON koruması) ──────────
function safeLsGet(key, fallback=null) {
  try {
    const raw = localStorage.getItem(key);
    if(!raw) return fallback;
    return JSON.parse(raw);
  } catch(e) {
    console.warn("[FCY] localStorage okuma hatası:", key, e.message);
    return fallback;
  }
}

function safeLsSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch(e) {
    console.warn("[FCY] localStorage yazma hatası:", key, e.message);
    // QuotaExceededError — eski kayıtları temizlemeyi dene
    if(e.name==="QuotaExceededError"||e.name==="NS_ERROR_DOM_QUOTA_REACHED") {
      try {
        // En eski save slot'unu bul ve sil
        const idx = safeLsGet("fcym_save_index",[]);
        if(idx.length>3) {
          const oldest = idx[idx.length-1];
          localStorage.removeItem(oldest);
          localStorage.setItem(key, JSON.stringify(value));
          return true;
        }
      } catch(e2) {}
    }
    return false;
  }
}
