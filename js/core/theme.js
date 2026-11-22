// ── GÖMÜLÜ SES DOSYALARI (base64) ──────────────────────────

const { useState, useEffect, useRef } = React;

// ═══════════════════════════════════════════════════════════════
// RENKLER
// ═══════════════════════════════════════════════════════════════
const C={
  bg:"#010611",nav:"#03091e",card:"#08112a",
  card2:"#0c1a38",
  ac:"#1462cc",ac2:"#4da8ff",ac3:"rgba(77,168,255,0.13)",
  gd:"#ffd060",gd2:"#e0a020",
  wh:"#eef4ff",dim:"#6a8ab0",dmr:"#182840",
  brd:"rgba(77,166,255,0.18)",brd2:"rgba(77,166,255,0.07)",
  grn:"#18b352",grn2:"#28e06a",grn3:"rgba(40,224,106,0.11)",
  red:"#c42030",red2:"#ff4a4a",red3:"rgba(255,74,74,0.11)",
  pur:"#8a3ec0",pur2:"#d080ff",
  ora:"#ff9040",
  // Yeni: zengin derinlik renkleri
  glow:"rgba(77,168,255,0.06)",
  surface:"rgba(255,255,255,0.03)",
  surfaceHover:"rgba(255,255,255,0.06)",
};

// ═══════════════════════════════════════════════════════════════
// YARDIMCILAR
// ═══════════════════════════════════════════════════════════════
const rnd=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const fmtSal=(k)=>{if(!k||k===0)return"0K€";if(k>=1000)return(k/1000).toFixed(k%1000===0?0:2).replace(/\.?0+$/,"")+"M€";return k+"K€";};
const posC=(p)=>{
  if(p==="GK") return {bg:"rgba(200,153,42,.15)",c:C.gd,b:"rgba(200,153,42,.3)"};
  if(["CB","LB","RB"].includes(p)) return {bg:"rgba(45,143,255,.15)",c:C.ac2,b:"rgba(45,143,255,.3)"};
  if(["CM","LM","RM","CAM","CDM"].includes(p)) return {bg:"rgba(46,204,113,.12)",c:C.grn2,b:"rgba(39,174,96,.28)"};
  return {bg:"rgba(232,64,64,.18)",c:C.red2,b:"rgba(232,64,64,.35)"};
};
const gradeColor=(g)=>g==="A"?C.grn2:g==="B"?C.ac2:g==="C"?C.gd:C.red2;
const ovrToGrade=(v)=>v>=84?"A":v>=77?"B":v>=70?"C":"D";
// ═══════════════════════════════════════════════════════════════
// TAKİM BADGE (emoji + renk)
// ═══════════════════════════════════════════════════════════════
const TEAM_BADGE={
  // ── ELİT LİG ──────────────────────────────────────────────
  "Galatasaray FC":    {e:"🔴🟡",bg:"#e8142a",tx:"#ffd700",ab:"GFC"},
  "Fenerbahce FC":     {e:"💛🔵",bg:"#003f8a",tx:"#ffcc00",ab:"FFC"},
  "Besiktas FC":       {e:"⚫⚪",bg:"#1a1a1a",tx:"#ffffff",ab:"BFC"},
  "Trabzonspor FC":    {e:"🟤🔵",bg:"#7a1f00",tx:"#4da6ff",ab:"TFC"},
  "Basaksehir FC":     {e:"🟠⚫",bg:"#f97316",tx:"#1a1a1a",ab:"BSK"},
  "Konyaspor FC":      {e:"🟢⚪",bg:"#15803d",tx:"#ffffff",ab:"KNY"},
  "Alanyaspor FC":     {e:"🟠🔵",bg:"#f97316",tx:"#1d4ed8",ab:"ALY"},
  "Sivasspor FC":      {e:"🔴⚪",bg:"#cc2233",tx:"#ffffff",ab:"SVS"},
  "Kasimpasa FC":      {e:"🟠🔵",bg:"#ea580c",tx:"#2563eb",ab:"KSM"},
  "Rizespor FC":       {e:"🟢⚪",bg:"#16a34a",tx:"#ffffff",ab:"RZS"},
  "Antalyaspor FC":    {e:"🔴⚪",bg:"#cc2233",tx:"#ffffff",ab:"ANT"},
  "Hatayspor FC":      {e:"🔴⚪",bg:"#cc2233",tx:"#ffffff",ab:"HTY"},
  "Adana Demir FC":    {e:"🔵🟡",bg:"#1d4ed8",tx:"#ffd700",ab:"ADM"},
  "Gaziantepspor FC":  {e:"🔴⚫",bg:"#991b1b",tx:"#ffffff",ab:"GZP"},
  "Kayserispor FC":    {e:"🟡🔴",bg:"#dc2626",tx:"#ffd700",ab:"KYS"},
  "Istanbulspor FC":   {e:"🟡⚫",bg:"#1a1a1a",tx:"#ffd700",ab:"IST"},
  "Ankaragucu FC":     {e:"🟡🔵",bg:"#1d4ed8",tx:"#ffd700",ab:"AKG"},
  "Ankaragucu FC":        {e:"🟡🔵",bg:"#1d4ed8",tx:"#ffd700",ab:"AKG"},
  "Samsunspor FC":     {e:"🔴⚫",bg:"#991b1b",tx:"#ffffff",ab:"SMS"},
  "Pendikspor FC":     {e:"🔵🟡",bg:"#1d4ed8",tx:"#ffd700",ab:"PDK"},
  "Giresunspor FC":    {e:"🟢⚫",bg:"#15803d",tx:"#ffffff",ab:"GRS"},
  "Bursaspor FC":      {e:"🟢⚪",bg:"#16a34a",tx:"#ffffff",ab:"BRS"},
  "Umraniyespor FC":   {e:"🔵⚪",bg:"#2563eb",tx:"#ffffff",ab:"UMR"},
  "Altay FC":          {e:"🔵⚪",bg:"#1d4ed8",tx:"#ffffff",ab:"ALT"},
  "Zonguldakspor FC":  {e:"⚫🔴",bg:"#1a1a1a",tx:"#dc2626",ab:"ZNG"},
  "Sultangazi FC":     {e:"🔵⚪",bg:"#2563eb",tx:"#ffffff",ab:"SUL"},
  // ── 1. LİG ────────────────────────────────────────────────
  "Eyupspor FC":       {e:"🟢⚪",bg:"#15803d",tx:"#ffffff",ab:"EYP"},
  "Sakaryaspor FC":    {e:"🔴⚪",bg:"#b91c1c",tx:"#ffffff",ab:"SAK"},
  "Bodrumspor FC":     {e:"🔵⚪",bg:"#2563eb",tx:"#ffffff",ab:"BDR"},
  "Goztepe FC":        {e:"🟡🔴",bg:"#f59e0b",tx:"#dc2626",ab:"GZT"},
  "Kocaelispor FC":    {e:"🔴⚪",bg:"#cc2233",tx:"#ffffff",ab:"KOC"},
  "Manisaspor FC":     {e:"🟡🔴",bg:"#dc2626",tx:"#ffd700",ab:"MNS"},
  "Adanaspor FC":      {e:"🔵⚪",bg:"#1d4ed8",tx:"#ffffff",ab:"ADA"},
  "Erzurumspor FC":    {e:"🔴⚪",bg:"#b91c1c",tx:"#ffffff",ab:"ERZ"},
  "Altinordu FC":      {e:"🟠⚫",bg:"#f97316",tx:"#1a1a1a",ab:"ALO"},
  "Bandirmaspor FC":   {e:"🔴⚪",bg:"#cc2233",tx:"#ffffff",ab:"BND"},
  "Denizlispor FC":    {e:"🔵⚫",bg:"#1d4ed8",tx:"#1a1a1a",ab:"DNZ"},
  "Genclerbirligi FC": {e:"🔴⚫",bg:"#991b1b",tx:"#ffffff",ab:"GNK"},
  "Kecioren FK":       {e:"🔵⚪",bg:"#1d4ed8",tx:"#ffffff",ab:"KCR"},
  "Bucaspor FC":       {e:"🔴⚪",bg:"#cc2233",tx:"#ffffff",ab:"BUC"},
  "Tarsus FK":         {e:"🔴⚪",bg:"#991b1b",tx:"#ffffff",ab:"TAR"},
  "Elazigspor FC":     {e:"🟠⚪",bg:"#ea580c",tx:"#ffffff",ab:"ELZ"},
  "Elazig FK":         {e:"🟠⚪",bg:"#ea580c",tx:"#ffffff",ab:"ELZ"},
  "Kahramanmarasspor": {e:"🔴⚪",bg:"#b91c1c",tx:"#ffffff",ab:"KMR"},
  "Samsunspor B":      {e:"🔴⚫",bg:"#991b1b",tx:"#ffffff",ab:"SMB"},
  "Sultangazi FC":     {e:"🔵⚪",bg:"#2563eb",tx:"#ffffff",ab:"SUL"},
  "Güneydoğu FK":      {e:"🔴⚪",bg:"#b91c1c",tx:"#ffffff",ab:"GDF"},
  "Eastfield City":       {e:"🔵",  bg:"#6cabdd",tx:"#1c2c5b",ab:"EFC"},
  "Redford United":        {e:"🔴",  bg:"#da291c",tx:"#fbe122",ab:"RFU"},
  "Southgate Hotspur":      {e:"⚪🔵",bg:"#132257",tx:"#ffffff",ab:"SGH"},
  "Tyneside FC":      {e:"⚫⚪",bg:"#241f20",tx:"#ffffff",ab:"TYN"},
  "Midfield Villa":    {e:"🟣",  bg:"#95bfe5",tx:"#670e36",ab:"MVL"},
  "Seagulls FC":       {e:"🔵⚪",bg:"#0057b8",tx:"#ffffff",ab:"SEA"},
  "East Hammers":       {e:"🟣🔵",bg:"#7c2c3b",tx:"#1bb1e7",ab:"EHM"},
  "Riverside FC":      {e:"🔴",  bg:"#e30613",tx:"#ffffff",ab:"RVS"},
  "Fulham FC":         {e:"⚪",  bg:"#ffffff",tx:"#cc0000",ab:"FUL"},
  "Crystal FC": {e:"🔴🔵",bg:"#1b458f",tx:"#c4122f",ab:"CRY"},
  "Wolverhampton":         {e:"🟠",  bg:"#fdb913",tx:"#231f20",ab:"WOL"},
  "Goodfields FC":        {e:"🔵",  bg:"#003399",tx:"#ffffff",ab:"GDF"},
  "Bournemouth FC":    {e:"🔴⚫",bg:"#da291c",tx:"#000000",ab:"BOU"},
  "Nottingham FC":   {e:"🔴",  bg:"#dd0000",tx:"#ffffff",ab:"NFO"},
  "Sheffield FC":  {e:"🔴",  bg:"#ee2737",tx:"#ffffff",ab:"SHU"},
  "Luton Town":          {e:"🟠",  bg:"#f78f1e",tx:"#ffffff",ab:"LUT"},
  "Burnley FC":        {e:"🟣",  bg:"#6c1d45",tx:"#99d6ea",ab:"BRS"},
  // La Liga
  "Real Madreno":    {e:"⚪",  bg:"#febe10",tx:"#ffffff",ab:"RMD"},
  "FC Cataluña":      {e:"🔴🔵",bg:"#a50044",tx:"#004d98",ab:"CAT"},
  "Atletico Madreno":       {e:"🔴⚪",bg:"#cb3524",tx:"#ffffff",ab:"ATD"},
  "Sevilia FC":        {e:"🔴",  bg:"#d71920",tx:"#ffffff",ab:"SVL"},
  "Villareal CF":     {e:"🟡",  bg:"#ffd700",tx:"#009640",ab:"VRL"},
  "Real Sociedad":       {e:"🔵⚪",bg:"#0067b1",tx:"#ffffff",ab:"SOC"},
  "Real Betis":          {e:"🟢",  bg:"#00954c",tx:"#ffffff",ab:"BTI"},
  "Athletic Club":  {e:"🔴⚪",bg:"#ee2523",tx:"#ffffff",ab:"BLB"},
  "Valencia CF":       {e:"🟠⚫",bg:"#ff6600",tx:"#000000",ab:"VCF"},
  "Girona FC":         {e:"🔴",  bg:"#cd1416",tx:"#ffffff",ab:"GIR"},
  "Alaves":         {e:"🔵",  bg:"#004f9f",tx:"#ffffff",ab:"ALV"},
  "Celta Vigo":     {e:"🔵",  bg:"#87ceeb",tx:"#ffffff",ab:"CLT"},
  "Rayo Vallecano": {e:"🔴",  bg:"#ee1c25",tx:"#ffffff",ab:"RYO"},
  "CA Osasuna":        {e:"🔴",  bg:"#d9000d",tx:"#ffffff",ab:"OSN"},
  "Getafe CF":         {e:"🔵",  bg:"#004f9f",tx:"#ffffff",ab:"GTF"},
  "RCD Mallorca":       {e:"🔴⚫",bg:"#e60026",tx:"#000000",ab:"MLC"},
  "Granada CF":        {e:"🔴",  bg:"#c3142d",tx:"#ffffff",ab:"GRN"},
  "Valladolid":     {e:"🟣",  bg:"#6b21a8",tx:"#ffffff",ab:"VLL"},
  "UD Las Palmas":     {e:"🟡",  bg:"#fbbf24",tx:"#004f9f",ab:"LPA"},
  "UD Almería":        {e:"🔴",  bg:"#e30613",tx:"#ffffff",ab:"ALM"},
  // Bundesliga
  "Bayern FC":         {e:"🔴",  bg:"#dc052d",tx:"#ffffff",ab:"BAY"},
  "Dortmund BV":       {e:"🟡⚫",bg:"#fde100",tx:"#000000",ab:"DVB"},
  "Leverkusen FC":     {e:"🔴⚫",bg:"#e32221",tx:"#000000",ab:"LVK"},
  "Leipzig RB":        {e:"🔴⚫",bg:"#dd0741",tx:"#ffffff",ab:"LPZ"},
  "Frankfurt EFC":      {e:"🔴⚫",bg:"#e1000f",tx:"#000000",ab:"FFT"},
  "Stuttgart VfB":      {e:"🔴",  bg:"#e32219",tx:"#ffffff",ab:"STG"},
  "Wolfsburg FC":      {e:"🟢",  bg:"#65b32e",tx:"#ffffff",ab:"WLF"},
  "TSG Hoffenheim":     {e:"🔵",  bg:"#1961ac",tx:"#ffffff",ab:"HOF"},
  "SC Freiburg":       {e:"🔴⚫",bg:"#e30613",tx:"#000000",ab:"FRB"},
  "M'gladbach":     {e:"🟢",  bg:"#000000",tx:"#ffffff",ab:"GLA"},
  "FSV Mainz":          {e:"🔴",  bg:"#c8102e",tx:"#ffffff",ab:"MNZ"},
  "FC Augsburg":       {e:"🔴🟢",bg:"#ba3733",tx:"#007a47",ab:"FCA"},
  "Berlin Union":   {e:"🔴",  bg:"#eb1923",tx:"#ffffff",ab:"BLN"},
  "VfL Bochum":         {e:"🔵",  bg:"#1d4ed8",tx:"#ffffff",ab:"STG"},
  "FC Heidenheim":     {e:"🔴",  bg:"#db0012",tx:"#ffffff",ab:"FCH"},
  "SV Darmstadt":      {e:"🔵",  bg:"#004f9f",tx:"#ffffff",ab:"SV9"},
  "Koln":           {e:"🔴⚪",bg:"#e2001a",tx:"#ffffff",ab:"FCK"},
  "Bremen FC":  {e:"🟢",  bg:"#1d9053",tx:"#ffffff",ab:"SVW"},
  // Serie A
  "FC Internazionale":          {e:"🔵⚫",bg:"#010e80",tx:"#000000",ab:"INZ"},
  "Juventus FC":       {e:"⚫⚪",bg:"#000000",tx:"#ffffff",ab:"JFC"},
  "AC Milanese":       {e:"🔴⚫",bg:"#fb090b",tx:"#000000",ab:"MLN"},
  "SSC Partenopei":         {e:"🔵",  bg:"#12a0c0",tx:"#ffffff",ab:"SSN"},
  "AS Romasso":           {e:"🟡🔴",bg:"#8b0000",tx:"#ffd700",ab:"ASR"},
  "SS Lazione":          {e:"🔵",  bg:"#87ceeb",tx:"#ffffff",ab:"LAZ"},
  "ACF Fiorentina":     {e:"🟣",  bg:"#4b0082",tx:"#ffffff",ab:"FIO"},
  "Atalanta BC B":       {e:"🔵⚫",bg:"#1c4b9c",tx:"#000000",ab:"ATA"},
  "Torino FC":         {e:"🟤",  bg:"#8b0000",tx:"#ffffff",ab:"TOR"},
  "Bologna FC":        {e:"🔴🔵",bg:"#cc0000",tx:"#003399",ab:"BOL"},
  "AC Monza":          {e:"⚪🔴",bg:"#e30613",tx:"#ffffff",ab:"MLN"},
  "Genoa CFC":          {e:"🔴🔵",bg:"#cc0000",tx:"#003399",ab:"GEN"},
  "US Lecce":          {e:"🟡🔴",bg:"#ffd700",tx:"#cc0000",ab:"LEC"},
  "FC Empoli":         {e:"🔵",  bg:"#3366cc",tx:"#ffffff",ab:"EMP"},
  "Cagliari Calcio":       {e:"🔴🔵",bg:"#c71c2c",tx:"#003399",ab:"CAG"},
  "Udinese Calcio":        {e:"⚫⚪",bg:"#1a1a1a",tx:"#ffffff",ab:"UDI"},
  "US Sassuolo":       {e:"🟢",  bg:"#00713e",tx:"#ffffff",ab:"SAS"},
  "US Salernitana":    {e:"🟤",  bg:"#8b1a1a",tx:"#ffffff",ab:"SAL"},
  "Hellas Verona":  {e:"🔵🟡",bg:"#004b8d",tx:"#ffd700",ab:"HEL"},
  "Frosinone Calcio":      {e:"🟡🔵",bg:"#ffd700",tx:"#003399",ab:"FRO"},
  // Ligue 1
  "Paris SG":            {e:"🔵🔴",bg:"#004170",tx:"#da291c",ab:"Paris SG"},
  "OM Marseille":      {e:"🔵⚪",bg:"#009fc8",tx:"#ffffff",ab:"OM"},
  "AS Monaco B":         {e:"🔴⚪",bg:"#e4002b",tx:"#ffffff",ab:"MCO"},
  "OL Lyon":           {e:"🔵🔴",bg:"#1d3461",tx:"#e30613",ab:"OL"},
  "RC Lens":           {e:"🟡🔴",bg:"#e30613",tx:"#f5a623",ab:"RCL"},
  "OGC Nice":           {e:"🔴⚫",bg:"#e30613",tx:"#000000",ab:"NCE"},
  "Stade Rennais":         {e:"🔴⚫",bg:"#e30613",tx:"#000000",ab:"RNS"},
  "LOSC Lille":          {e:"🔴⚫",bg:"#e30613",tx:"#000000",ab:"LSL"},
  "RC Strasbourg":     {e:"🔵⚪",bg:"#003189",tx:"#ffffff",ab:"RCS"},
  "FC Nantes":         {e:"🟡🟢",bg:"#ffd700",tx:"#007438",ab:"FCN"},
  "Toulouse FC":       {e:"🟣",  bg:"#7b2d8b",tx:"#ffffff",ab:"TFC"},
  "Stade de Reims":          {e:"🔴⚪",bg:"#e30613",tx:"#ffffff",ab:"RMS"},
  "FC Metz":           {e:"🟣🟡",bg:"#6b21a8",tx:"#ffd700",ab:"FCM"},
  "Montpellier HSC":    {e:"🔵🟠",bg:"#f97316",tx:"#1d4ed8",ab:"MHC"},
  "Brest":          {e:"🔴⚪",bg:"#e30613",tx:"#ffffff",ab:"SBT"},
  "Le Havre":       {e:"🔵",  bg:"#1d4ed8",tx:"#ffffff",ab:"HAC"},
  "FC Lorient":        {e:"🟠⚫",bg:"#f97316",tx:"#000000",ab:"FCL"},
  "Clermont Foot":       {e:"🔴🔵",bg:"#e30613",tx:"#003189",ab:"CLM"},

  "Giresunspor FC": {e:"🟢⚫",bg:"#15803d",tx:"#ffffff",ab:"GRS"},
  "Bursaspor FC": {e:"🟢⚪",bg:"#16a34a",tx:"#ffffff",ab:"BRS"},
  "Altay FC": {e:"🔵⚪",bg:"#1d4ed8",tx:"#ffffff",ab:"ALT"},
  "Elazigspor FC": {e:"🟠⚪",bg:"#ea580c",tx:"#ffffff",ab:"ELZ"},

};
// Fallback: takım ismine göre deterministik renk üret
const teamBadgeFallback=(name)=>{
  if(!name) return {bg:"#1a2e4a",tx:"#7898c0",ab:"?"};
  const h=name.split("").reduce((a,c)=>a+c.charCodeAt(0),0);
  const COLORS=["#1562cc","#cc2233","#15803d","#8b2500","#6b21a8","#f97316","#0f766e","#be185d"];
  const bg=COLORS[h%COLORS.length];
  const ab=name.replace(/[^A-Za-z]/g,"").slice(0,3).toUpperCase()||"???";
  return {bg,tx:"#ffffff",ab};
};
const getTeamBadge=(name)=>TEAM_BADGE[name]||teamBadgeFallback(name);

// TeamBadge bileşeni — size: "sm"(20px) | "md"(28px) | "lg"(36px)
function TeamBadge({name,size="md",style={}}){
  const b=getTeamBadge(name);
  const sz=size==="sm"?18:size==="lg"?36:26;
  const fs=size==="sm"?.38:size==="lg"?.7:.5;
  return(
    <div style={{
      width:sz,height:sz,borderRadius:sz*0.22,flexShrink:0,
      background:`linear-gradient(145deg,${b.bg},${b.bg}cc)`,
      border:`1.5px solid ${b.bg}88`,
      display:"flex",alignItems:"center",justifyContent:"center",
      boxShadow:`0 1px 4px rgba(0,0,0,.4),inset 0 1px 0 rgba(255,255,255,.15)`,
      ...style
    }}>
      <span style={{fontSize:`${fs}rem`,fontWeight:900,color:b.tx,letterSpacing:-.3,lineHeight:1,
        textShadow:"0 1px 2px rgba(0,0,0,.4)"}}>{b.ab}</span>
    </div>
  );
}
