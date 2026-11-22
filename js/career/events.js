// ── 2. AİLE SİSTEMİ ──────────────────────────────────────────
const FAMILY_EVENTS = [
  // Partner olayları
  { id:'meet_partner',   minSeason:2, maxSeason:5,  icon:'💑', title:'Aşk Başlangıcı',
    desc:'Bir etkinlikte biriyle tanıştın. İlişkiye açık mısın?',
    opts:[
      { label:'Evet, tanışalım', moralDelta:+8,  result:'İlişki başladı! Moral ve mutluluk arttı.' },
      { label:'Şimdi değil, odaklanmam lazım', moralDelta:+2, result:'Futbola odaklandın. Bu karar seni etkiler mi?' },
    ],
    once: true, triggered: false },
  { id:'marriage',       minSeason:4, maxSeason:8,  icon:'💍', title:'Evlilik Teklifi',
    desc:'Partner senden evlenme teklifi bekliyor.',
    opts:[
      { label:'Evet, evleniyoruz!', moralDelta:+15, repDelta:+5, result:'Evlendin! Taraftarlar kutluyor, moral zirveye çıktı.' },
      { label:'Henüz değil', moralDelta:-3, result:'Ertelemek ilişkiye yük bindirdi.' },
    ],
    once: true, triggered: false },
  { id:'baby',           minSeason:5, maxSeason:10, icon:'👶', title:'Bebek Haberi!',
    desc:'Eşin hamile! Baba/anne oluyorsun.',
    opts:[
      { label:'Harika haber! 🎉', moralDelta:+20, result:'Çocuğun dünyaya geldi. Kariyerin yeni bir anlam kazandı.' },
    ],
    once: true, triggered: false, requiresMarriage: true },
  { id:'family_trip',    minSeason:3, maxSeason:20, icon:'✈️', title:'Aile Tatili',
    desc:'Sezon arasında aile ile tatil yapmak ister misin? (-150K€, +moral)',
    opts:[
      { label:'Tatile çıkalım! (-150K€)', costDelta: 150, moralDelta:+12, result:'Harika dinlendin. Yeni sezona dinç gireceksin.' },
      { label:'Odaklanmam lazım', moralDelta:-2, result:'Ailen biraz hayal kırıklığı yaşadı.' },
    ],
    once: false, triggered: false },
  { id:'child_match',    minSeason:7, maxSeason:20, icon:'🏟️', title:'Çocuğun Tribünde',
    desc:'Çocuğun ilk kez senin maçını izliyor. Özel bir gün!',
    opts:[
      { label:'Onun için gol atacağım!', moralDelta:+10, result:'Sahaya çıktığında gözlerin doldu. Efsane bir an.' },
    ],
    once: false, triggered: false, requiresBaby: true },

  // Partner destek olayları
  { id:'partner_support', minSeason:2, maxSeason:20, icon:'🤗', title:'Partner Desteği',
    desc:'Kötü bir seriden sonra partnerın seni motive etti.',
    opts:[
      { label:'Teşekkür ediyorum ❤️', moralDelta:+8, result:'Motivasyon taze. Yeniden hazırsın.' },
    ],
    once: false, triggered: false, requiresPartner: true },
  { id:'partner_argument', minSeason:3, maxSeason:20, icon:'💢', title:'Gerilim',
    desc:'Yoğun sezon sizi geriyor. Seyahat ve maçlar ilişkiyi yordu.',
    opts:[
      { label:'Özür dile ve dinle', moralDelta:-2,  repDelta:0,  result:'Sağlıklı iletişim. Kriz atlatıldı.' },
      { label:'Futbol önce gelir',   moralDelta:-8,  result:'Gerilim devam ediyor. Konsantrasyonun bozuldu.' },
    ],
    once: false, triggered: false, requiresPartner: true },
];

// Aile durumunu hesapla
function getFamilyStatus(p) {
  const fam = p.family || {};
  return {
    hasPartner: !!fam.hasPartner,
    isMarried:  !!fam.isMarried,
    hasChild:   !!fam.hasChild,
    partnerName: fam.partnerName || null,
    childName:   fam.childName || null,
    childAge:    fam.childAge || 0,
    moralBonus:  (fam.isMarried ? 3 : fam.hasPartner ? 1 : 0)
               + (fam.hasChild  ? 2 : 0),
  };
}

// Haftalık aile eventi tetikle
function checkFamilyEvent(player) {
  const fam = player.family || {};
  const season = player.season;

  for (const ev of FAMILY_EVENTS) {
    if (season < ev.minSeason || season > ev.maxSeason) continue;
    if (ev.requiresPartner && !fam.hasPartner) continue;
    if (ev.requiresMarriage && !fam.isMarried) continue;
    if (ev.requiresBaby && !fam.hasChild) continue;
    if (ev.id === 'marriage' && !fam.hasPartner) continue;
    if (ev.id === 'baby' && !fam.isMarried) continue;
    if (ev.once && (player.triggeredFamilyEvents || []).includes(ev.id)) continue;
    // Rastgele tetikle (sezon başı %20, diğerleri %8)
    const chance = ['meet_partner','marriage','baby'].includes(ev.id) ? 0.20 : 0.08;
    if (Math.random() < chance) return ev;
  }
  return null;
}

// ── 3. BRANCHING STORY OLAYLARI ──────────────────────────────
const STORY_EVENTS = [
  { id:'journalist_trap',  icon:'🎤', title:'Sert Soru',
    desc:'Bir gazeteci sana sert bir soru sordu: "Bu sezon hayal kırıklığı mısın?"',
    opts:[
      { label:'Sakin cevap ver', repDelta:+3, moralDelta:0,  coachDelta:0,  result:'Olgun bir yanıt. Saygınlığın arttı.' },
      { label:'Sert karşılık ver', repDelta:-2, moralDelta:+3, result:'Medya bunu gündem yaptı. Riskli bir hamle.' },
      { label:'Gülerek geç',      repDelta:+1, moralDelta:+2, result:'Kıvrak bir yanıt. Taraftarlar güldü.' },
    ]},
  { id:'rival_provocation', icon:'⚡', title:'Rival Kışkırtması',
    desc:`Rakip oyuncu maç öncesi sosyal medyada seni hedef aldı.`,
    opts:[
      { label:'Cevap verme, sahada konuş', repDelta:+4, moralDelta:-2, result:'Asil duruş. Sahada kanıtladın.' },
      { label:'Sosyal medyadan yanıtla',   repDelta:-1, moralDelta:+5, result:'Gerilim arttı ama moral yüksek.' },
      { label:'Kulüp açıklaması yap',      repDelta:+2, moralDelta:0,  coachDelta:+3, result:'Kurumsal duruş. Antrenör memnun.' },
    ]},
  { id:'contract_leak',    icon:'📰', title:'Sözleşme Sızdı',
    desc:'Maaşın medyaya sızdı. Taraftarlar tartışıyor.',
    opts:[
      { label:'Yorum yapma',       repDelta:0,  moralDelta:-3, result:'Sessizlik bazen en iyi cevap.' },
      { label:'Açıklama yap',      repDelta:+2, moralDelta:+1, result:'Şeffaflık olumlu karşılandı.' },
      { label:'Tepki göster',      repDelta:-3, moralDelta:+4, result:'Sinirli çıkış geri tepti.' },
    ]},
  { id:'youth_player',     icon:'🌱', title:'Genç Yetenek',
    desc:'Akademiden genç bir oyuncu senden tavsiye istiyor.',
    opts:[
      { label:'Yardım et, antren et', repDelta:+5, moralDelta:+3, teamDelta:+5, result:'Kulüp içinde saygın biri oldun.' },
      { label:'Nazikçe reddet',       repDelta:0,moralDelta:0,  result:'Zamansız bir istek. Anlayış gösterdi.' },
    ]},
  { id:'national_team_conflict', icon:'🏳️', title:'Milli Takım Anlaşmazlığı',
    desc:'Milli takım ve kulüp aynı haftaya denk geldi. Teknik direktörler çatışıyor.',
    opts:[
      { label:'Kulübü destekle',       repDelta:-2, moralDelta:+2, coachDelta:+5, result:'Antrenör memnun ama milli teknik direktör sinirli.' },
      { label:'Milli takımı seç',      repDelta:+5, moralDelta:+5, coachDelta:-3, result:'Vatanseverlik kazandı ama kulüp ilişkisi gerildi.' },
      { label:'Sağlık bahanesiyle çekil', repDelta:-4, moralDelta:-2, result:'İkisini de kızdırdın. Zor durum.' },
    ]},
  { id:'sponsor_scandal',  icon:'💼', title:'Sponsor Krizi',
    desc:'Sponsorun başka bir oyuncuya kötü davrandığı ortaya çıktı. Sözleşmen devam edecek mi?',
    opts:[
      { label:'Sözleşmeyi fesh et (-gelir)', repDelta:+8, moralDelta:+5, result:'Prensipli duruş. Taraftarlar hayran kaldı.' },
      { label:'Devam et, iş iştir',          repDelta:-5, moralDelta:-3, result:'Eleştiri yağdı ama gelir devam ediyor.' },
      { label:'Açıklama iste, bekle',         repDelta:+2, moralDelta:0,  result:'Temkinli yaklaşım. Karar askıda.' },
    ]},
  { id:'injury_comeback',  icon:'🩹', title:'Sakatlık Dönüşü',
    desc:'Uzun sakatlıktan döndün. Antrenör temkinli davranıyor.',
    opts:[
      { label:'Sabırlı ol, dinle',  repDelta:+3, moralDelta:-2, coachDelta:+5, result:'Profesyonellik takdirle karşılandı.' },
      { label:'Formumu kanıtla',    repDelta:+2, moralDelta:+6, result:'Sahada göstermen gerekiyor.' },
      { label:'Transfer iste',      repDelta:-2, moralDelta:+3, coachDelta:-8, result:'Antrenör hayal kırıklığı yaşadı.' },
    ]},
  { id:'locker_room_speech', icon:'🗣️', title:'Soyunma Odası Konuşması',
    desc:'Bir sonraki maç çok kritik. Takım moralinin düşük olduğunu hissediyorsun.',
    opts:[
      { label:'Liderlik et, konuş', moralDelta:+8, teamDelta:+8, repDelta:+3, result:'Takım senin etrafında toplandı. Efsane an.' },
      { label:'Sessiz kal',          moralDelta:0,  teamDelta:0,  result:'Kimse bir şey beklemiyordu.' },
      { label:'Antrenöre bırak',     moralDelta:+2, coachDelta:+4, result:'Hiyerarşiye saygı gösterdin.' },
    ]},
  { id:'city_hero',        icon:'🏙️', title:'Şehrin Kahramanı',
    desc:'Yerel bir felakette yardım kampanyası başlatıldı. Katılacak mısın?',
    opts:[
      { label:'Büyük bağış yap (-200K€)', repDelta:+10, fanDelta:3000, result:'Şehrin gerçek kahramanı oldun.' },
      { label:'Sembolik destek ver',       repDelta:+4,  fanDelta:800,  result:'İyi niyet jesti. Takdir gördün.' },
      { label:'Sessiz kal',                repDelta:-3,  result:'Sosyal medya eleştirdi.' },
    ]},
  { id:'retirement_offer', icon:'🎙️', title:'Yayıncı Teklifi',
    desc:'Emeklilik sonrası için büyük bir TV kanalından yorum uzmanlığı teklifi geldi.',
    opts:[
      { label:'İlginç, değerlendiririm', repDelta:+2, result:'Kariyerin sonrası için kapı aralandı.' },
      { label:'Henüz düşünmüyorum',      result:'Odaklanmaya devam ediyorsun.' },
    ]},
  { id:'mentor_clash',     icon:'🥊', title:'Mentor Anlaşmazlığı',
    desc:'Mentor ile antrenman metodunda görüş ayrılığı yaşadın.',
    opts:[
      { label:'Mentorun yolunu izle',  repDelta:+2, moralDelta:+3, result:'Güven pekişti.' },
      { label:'Kendi yolunu çiz',      repDelta:+3, moralDelta:+5, result:'Özgüvenin arttı ama mentor mesafelendi.' },
    ]},
  { id:'big_game_eve',     icon:'🌙', title:'Büyük Maç Öncesi Gece',
    desc:'Yarın dev maç var. Nasıl hazırlanıyorsun?',
    opts:[
      { label:'Erken uyu, tam odak',  moralDelta:+4, result:'Dinç ve hazırsın.' },
      { label:'Müzik dinle ve rahatla', moralDelta:+6, result:'Ritüelin işe yaradı.' },
      { label:'Ekstra antrenman yap', moralDelta:-2, result:'Fazla zorladın, biraz yoruldun.' },
    ]},
];

// Haftalık story event tetikle (%25 şans)
function checkStoryEvent(player) {
  if (Math.random() > 0.25) return null;
  const pool = STORY_EVENTS.filter(ev => {
    if (ev.id === 'national_team_conflict' && !player.hasNationalCall) return false;
    if (ev.id === 'mentor_clash' && !player.mentor) return false;
    if (ev.id === 'partner_argument' && !(player.family?.hasPartner)) return false;
    return true;
  });
  return pool[Math.floor(Math.random() * pool.length)] || null;
}
