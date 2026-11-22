// ═══════════════════════════════════════════════════════════════
// OYUNCU ÖZELLİKLERİ (TRAITS)
// ═══════════════════════════════════════════════════════════════
const PLAYER_TRAITS={
  // Hücum
  clinical:   {icon:"🎯",label:"Klinisyen",   desc:"Ceza sahasında soğukkanlı",   strBonus:2,  cat:"attack"},
  speedster:  {icon:"⚡",label:"Hızlı Kanat", desc:"Sprint hızıyla rakipleri geçer", strBonus:1,  cat:"attack"},
  headers:    {icon:"✈️",label:"Kafa Uzmanı", desc:"Topun üstüne gider",           strBonus:1,  cat:"attack"},
  // Orta saha
  engine:     {icon:"🔋",label:"Motor",        desc:"Yorulmadan koşar, her yerde",  strBonus:2,  cat:"mid"},
  visionary:  {icon:"👁️",label:"Vizyoner",    desc:"Görülmez paslar atar",         strBonus:1,  cat:"mid"},
  // Defans
  tank:       {icon:"🛡️",label:"Tank",        desc:"Fiziksel duel kazanır",        strBonus:2,  cat:"def"},
  sweeper:    {icon:"🧹",label:"Libero",       desc:"Son çizgide tempolu temizler", strBonus:1,  cat:"def"},
  // Karakter
  leader:     {icon:"👑",label:"Lider",        desc:"Takım moralini yükseltir",     moralBonus:8,cat:"char"},
  bigmatch:   {icon:"🌟",label:"Büyük Maç",   desc:"Güçlü rakiplere karşı daha iyi",bigMatchBonus:3,cat:"char"},
  nervewreck: {icon:"😰",label:"Gergin",       desc:"Baskı altında performans düşer",strPenalty:2,cat:"char"},
  chippy:     {icon:"😤",label:"Sinirli",      desc:"Sarı kart riski yüksek",       yellowRisk:true,cat:"char"},
};

// Pozisyona göre olası traitler
const TRAIT_POOL_BY_POS={
  GK:  ["tank","leader","nervewreck"],
  CB:  ["tank","sweeper","leader","headers","nervewreck"],
  LB:  ["speedster","engine","tank","chippy"],
  RB:  ["speedster","engine","tank","chippy"],
  CDM: ["tank","engine","chippy","leader"],
  CM:  ["engine","visionary","leader","bigmatch","nervewreck"],
  CAM: ["visionary","clinical","bigmatch","speedster","nervewreck"],
  LM:  ["speedster","clinical","visionary","chippy"],
  RM:  ["speedster","clinical","visionary","chippy"],
  ST:  ["clinical","headers","speedster","bigmatch","nervewreck","chippy"],
};

// Oyuncuya trait ata (oluşturma/yükleme anında)
const assignTraits=(player)=>{
  if(player.traits&&player.traits.length>0) return player.traits;
  const pool=TRAIT_POOL_BY_POS[player.pos]||["engine"];
  // OVR 80+ ise 2 trait, 70+ 50% şans 2, diğer 1
  const count=player.ovr>=80?2:player.ovr>=70&&Math.random()<0.5?2:1;
  const shuffled=[...pool].sort(()=>Math.random()-0.5);
  return shuffled.slice(0,Math.min(count,pool.length));
};

// Trait etkisini maç str'sine uygula
const calcTraitBonus=(player,oppStr,isHome)=>{
  if(!player.traits||player.traits.length===0) return 0;
  let bonus=0;
  player.traits.forEach(t=>{
    const tr=PLAYER_TRAITS[t];
    if(!tr) return;
    if(tr.strBonus)    bonus+=tr.strBonus;
    if(tr.strPenalty)  bonus-=tr.strPenalty;
    if(tr.bigMatchBonus&&oppStr>=78) bonus+=tr.bigMatchBonus;
  });
  return bonus;
};
