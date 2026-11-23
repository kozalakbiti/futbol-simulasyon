// ═══════════════════════════════════════════════════════════════
// MAÇ SES EFEKTLERİ — WEB AUDIO API ile sentez (harici dosya yok)
// Tek global: MATCH_SFX. Yükleme anında başka hiçbir global kullanmaz.
// Hiçbir çağrı hata fırlatmaz; bağlam yoksa sessizce hiçbir şey yapmaz.
// ═══════════════════════════════════════════════════════════════

const MATCH_SFX = (function(){
  const PREF_KEY = "cmgr_match_sfx_on";   // ayrı localStorage anahtarı (kayıt şeması etkilenmez)
  let ctx = null;          // tek, tembel (lazy) AudioContext
  let master = null;       // ana ses düzeyi
  let comp = null;         // patlamayı önleyen kompresör
  let bufs = null;         // {white, pink, brown} — bir kez üretilir
  let lastKickAt = 0;      // aynı anda yağan vuruşları seyreltmek için
  let failed = false;      // bağlam kurulamadıysa bir daha denemeyelim

  let enabled = true;
  try { const v = window.localStorage && window.localStorage.getItem(PREF_KEY); if (v === "0") enabled = false; } catch (e) {}

  // ─── Bağlam ve ana çıkış ───
  function ensure(){
    if (ctx) return ctx;
    if (failed) return null;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) { failed = true; return null; }
      ctx = new AC();
      comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -14;
      comp.knee.value = 8;
      comp.ratio.value = 6;
      comp.attack.value = 0.003;
      comp.release.value = 0.2;
      master = ctx.createGain();
      master.gain.value = 0.8;
      master.connect(comp);
      comp.connect(ctx.destination);
      bufs = makeBuffers(ctx);
      return ctx;
    } catch (e) {
      failed = true; ctx = null; master = null; comp = null; bufs = null;
      return null;
    }
  }

  function makeBuffers(c){
    const sr = c.sampleRate;
    const n = Math.floor(sr * 2);  // 2 sn, döngüyle kullanılır
    const white = c.createBuffer(1, n, sr);
    const pink = c.createBuffer(1, n, sr);
    const brown = c.createBuffer(1, n, sr);
    const w = white.getChannelData(0), p = pink.getChannelData(0), b = brown.getChannelData(0);
    let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0, last=0;
    for (let i = 0; i < n; i++){
      const r = Math.random()*2-1;
      w[i] = r;
      // Pembe gürültü (Paul Kellet yaklaşımı)
      b0=0.99886*b0+r*0.0555179; b1=0.99332*b1+r*0.0750759; b2=0.96900*b2+r*0.1538520;
      b3=0.86650*b3+r*0.3104856; b4=0.55000*b4+r*0.5329522; b5=-0.7616*b5-r*0.0168980;
      p[i] = (b0+b1+b2+b3+b4+b5+b6+r*0.5362)*0.11;
      b6 = r*0.115926;
      // Kahverengi gürültü (entegre edilmiş beyaz)
      last = (last + 0.02*r)/1.02;
      b[i] = last*3.5;
    }
    // Döngü dikişinde tık olmasın diye uçları yumuşat
    const fade = Math.min(256, n>>2);
    [w,p,b].forEach(d=>{ for (let i=0;i<fade;i++){ const k=i/fade; d[i]*=k; d[n-1-i]*=k; } });
    return { white, pink, brown };
  }

  // Çalmaya hazır bağlam (kapalıysa / gizliyse / hata varsa null)
  function ready(){
    if (!enabled) return null;
    try { if (typeof document !== "undefined" && document.hidden) return null; } catch (e) {}
    const c = ensure();
    if (!c) return null;
    try { if (c.state !== "running") { const pr = c.resume(); if (pr && pr.catch) pr.catch(()=>{}); } } catch (e) {}
    return c;
  }

  // ─── Küçük yardımcılar (kısa ömürlü düğümler) ───
  function noiseSrc(c, kind, loop){
    const s = c.createBufferSource();
    s.buffer = bufs[kind] || bufs.white;
    s.loop = !!loop;
    // Her seferinde farklı başlangıç: aynı gürültü tekrar etmesin
    return s;
  }
  function startStop(src, t0, dur, offset){
    try {
      if (offset != null) src.start(t0, offset); else src.start(t0);
      src.stop(t0 + dur + 0.05);
    } catch (e) {}
  }
  function cleanup(src, nodes){
    src.onended = function(){
      try { src.disconnect(); } catch (e) {}
      nodes.forEach(n=>{ try { n.disconnect(); } catch (e) {} });
    };
  }
  function env(g, t0, peak, atk, dec){
    // Hızlı atak, üstel sönüm
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(Math.max(0.0002, peak), t0 + atk);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + atk + dec);
  }
  function rndOff(){ return Math.random()*1.5; }
  function clamp01(v){ v = Number(v); return isFinite(v) ? Math.max(0, Math.min(1, v)) : 0; }

  // ─── Vuruş: tok "thump" + keskin "pop" ───
  function thumpPop(c, t0, vol, bright, decay){
    // Düşük frekans gövde
    const o = c.createOscillator();
    o.type = "triangle";
    o.frequency.setValueAtTime(125 + 20*bright, t0);
    o.frequency.exponentialRampToValueAtTime(48, t0 + decay);
    const og = c.createGain();
    env(og, t0, vol, 0.003, decay);
    o.connect(og); og.connect(master);
    cleanup(o, [og]);
    try { o.start(t0); o.stop(t0 + decay + 0.06); } catch (e) {}

    // Deri "pop": bandpass gürültü patlaması
    const n = noiseSrc(c, "white", false);
    const bp = c.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 1500 + 1500*bright;
    bp.Q.value = 1.4;
    const ng = c.createGain();
    env(ng, t0, vol*(0.35 + 0.45*bright), 0.0015, 0.035 + 0.02*bright);
    n.connect(bp); bp.connect(ng); ng.connect(master);
    cleanup(n, [bp, ng]);
    startStop(n, t0, 0.08, rndOff());
  }

  function kick(power){
    try {
      const c = ready(); if (!c) return;
      const now = c.currentTime;
      if (now - lastKickAt < 0.03) return;
      lastKickAt = now;
      const p = clamp01((power == null ? 60 : power) / 100);
      thumpPop(c, now + 0.005, 0.45 + 0.55*p, p, 0.09 + 0.06*p);
    } catch (e) {}
  }

  function pass(){
    try {
      const c = ready(); if (!c) return;
      const now = c.currentTime;
      if (now - lastKickAt < 0.03) return;
      lastKickAt = now;
      thumpPop(c, now + 0.005, 0.32, 0.15, 0.07);
    } catch (e) {}
  }

  // ─── Hakem düdüğü ───
  function whistleTone(c, t0, dur){
    const base = 2750 + Math.random()*250;
    const o = c.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(base, t0);
    // Bezelye titreşimi: ~30 Hz frekans modülasyonu
    const lfo = c.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 26 + Math.random()*8;
    const lfoG = c.createGain();
    lfoG.gain.value = 110;
    lfo.connect(lfoG); lfoG.connect(o.frequency);

    // Hafif sertlik için ikinci harmonik
    const o2 = c.createOscillator();
    o2.type = "sine";
    o2.frequency.setValueAtTime(base*2, t0);
    lfoG.connect(o2.frequency);
    const g2 = c.createGain(); g2.gain.value = 0.12;
    o2.connect(g2);

    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(0.28, t0 + 0.015);
    g.gain.setValueAtTime(0.28, t0 + Math.max(0.02, dur - 0.05));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g2.connect(g); g.connect(master);

    // Nefes gürültüsü
    const n = noiseSrc(c, "white", false);
    const bp = c.createBiquadFilter();
    bp.type = "bandpass"; bp.frequency.value = base; bp.Q.value = 3;
    const ng = c.createGain();
    ng.gain.setValueAtTime(0.0001, t0);
    ng.gain.linearRampToValueAtTime(0.06, t0 + 0.015);
    ng.gain.setValueAtTime(0.06, t0 + Math.max(0.02, dur - 0.05));
    ng.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    n.connect(bp); bp.connect(ng); ng.connect(master);

    cleanup(o, [g, lfoG, g2]);
    cleanup(o2, []);
    cleanup(lfo, []);
    cleanup(n, [bp, ng]);
    try {
      o.start(t0); o2.start(t0); lfo.start(t0);
      o.stop(t0 + dur + 0.05); o2.stop(t0 + dur + 0.05); lfo.stop(t0 + dur + 0.05);
    } catch (e) {}
    startStop(n, t0, dur, rndOff());
  }

  function whistle(kind){
    try {
      const c = ready(); if (!c) return;
      const t = c.currentTime + 0.01;
      if (kind === "long") {
        whistleTone(c, t, 0.95);
      } else if (kind === "triple") {
        // Maç sonu: kısa, kısa, uzun
        whistleTone(c, t, 0.32);
        whistleTone(c, t + 0.45, 0.32);
        whistleTone(c, t + 0.9, 1.1);
      } else {
        whistleTone(c, t, 0.28);
      }
    } catch (e) {}
  }

  // ─── Kalabalık uğultusu ───
  function crowdAt(c, t0, intensity, sec){
    const I = clamp01(intensity);
    if (I <= 0) return;
    const dur = Math.max(0.3, Math.min(10, Number(sec) || 2));
    const atk = Math.min(0.35, dur*0.2);

    const n = noiseSrc(c, "pink", true);
    const lp = c.createBiquadFilter();
    lp.type = "lowpass"; lp.frequency.value = 900 + 900*I; lp.Q.value = 0.5;
    const bp = c.createBiquadFilter();
    bp.type = "peaking"; bp.frequency.value = 450; bp.Q.value = 0.8; bp.gain.value = 6;
    const g = c.createGain();
    env(g, t0, 0.25 + 0.6*I, atk, dur - atk);
    n.connect(lp); lp.connect(bp); bp.connect(g); g.connect(master);
    cleanup(n, [lp, bp, g]);
    startStop(n, t0, dur, rndOff());

    // Gövde: kahverengi gürültüyle derin uğultu
    const nb = noiseSrc(c, "brown", true);
    const lp2 = c.createBiquadFilter();
    lp2.type = "lowpass"; lp2.frequency.value = 320;
    const g2 = c.createGain();
    env(g2, t0, 0.2 + 0.35*I, atk*1.3, dur - atk*1.3);
    nb.connect(lp2); lp2.connect(g2); g2.connect(master);
    cleanup(nb, [lp2, g2]);
    startStop(nb, t0, dur, rndOff());
  }

  function crowd(intensity, sec){
    try {
      const c = ready(); if (!c) return;
      crowdAt(c, c.currentTime + 0.01, intensity, sec);
    } catch (e) {}
  }

  // "ooo → ah" formant kayması (kısa "ooh" için ters yön de olabilir)
  function formantSweep(c, t0, dur, from, to, peak){
    const n = noiseSrc(c, "pink", true);
    const out = c.createGain();
    env(out, t0, peak, Math.min(0.3, dur*0.25), dur*0.75);
    const nodes = [out];
    for (let i = 0; i < from.length; i++){
      const f = c.createBiquadFilter();
      f.type = "bandpass"; f.Q.value = 5;
      f.frequency.setValueAtTime(from[i], t0);
      f.frequency.exponentialRampToValueAtTime(to[i], t0 + dur*0.45);
      const fg = c.createGain(); fg.gain.value = i === 0 ? 1 : 0.6;
      n.connect(f); f.connect(fg); fg.connect(out);
      nodes.push(f, fg);
    }
    out.connect(master);
    cleanup(n, nodes);
    startStop(n, t0, dur, rndOff());
  }

  function goal(){
    try {
      const c = ready(); if (!c) return;
      const t = c.currentTime + 0.01;
      crowdAt(c, t, 1, 4.2);
      formantSweep(c, t, 2.6, [320, 760, 2300], [720, 1150, 2500], 0.9);
    } catch (e) {}
  }

  function ooh(c, t0, I){
    crowdAt(c, t0, I, 1.4);
    formantSweep(c, t0, 1.2, [420, 900, 2400], [330, 720, 2300], 0.35 + 0.4*I);
  }

  // ─── Direk: metalik "tıng" + kalabalık "ooh" ───
  function post(){
    try {
      const c = ready(); if (!c) return;
      const t = c.currentTime + 0.005;
      const partials = [[430, 0.9, 0.35], [1012, 0.95, 0.25], [1597, 0.75, 0.18], [2380, 0.6, 0.12]];
      partials.forEach(([f, d, a])=>{
        const o = c.createOscillator();
        o.type = "sine";
        o.frequency.value = f * (0.99 + Math.random()*0.02);
        const g = c.createGain();
        env(g, t, a, 0.002, d);
        o.connect(g); g.connect(master);
        cleanup(o, [g]);
        try { o.start(t); o.stop(t + d + 0.05); } catch (e) {}
      });
      // Çarpma anının kısa tıkırtısı
      const n = noiseSrc(c, "white", false);
      const hp = c.createBiquadFilter();
      hp.type = "highpass"; hp.frequency.value = 2500;
      const ng = c.createGain();
      env(ng, t, 0.25, 0.001, 0.03);
      n.connect(hp); hp.connect(ng); ng.connect(master);
      cleanup(n, [hp, ng]);
      startStop(n, t, 0.06, rndOff());
      ooh(c, t + 0.12, 0.5);
    } catch (e) {}
  }

  // ─── Kurtarış: eldiven "pat" + kısa "ooh" ───
  function save(){
    try {
      const c = ready(); if (!c) return;
      const t = c.currentTime + 0.005;
      const n = noiseSrc(c, "white", false);
      const lp = c.createBiquadFilter();
      lp.type = "lowpass"; lp.frequency.value = 1400; lp.Q.value = 0.9;
      const g = c.createGain();
      env(g, t, 0.75, 0.002, 0.07);
      n.connect(lp); lp.connect(g); g.connect(master);
      cleanup(n, [lp, g]);
      startStop(n, t, 0.1, rndOff());
      // Eldivenin tok gövdesi
      const o = c.createOscillator();
      o.type = "sine";
      o.frequency.setValueAtTime(180, t);
      o.frequency.exponentialRampToValueAtTime(70, t + 0.06);
      const og = c.createGain();
      env(og, t, 0.4, 0.002, 0.06);
      o.connect(og); og.connect(master);
      cleanup(o, [og]);
      try { o.start(t); o.stop(t + 0.1); } catch (e) {}
      ooh(c, t + 0.1, 0.45);
    } catch (e) {}
  }

  // ─── Açma / aç-kapa ───
  function unlock(){
    try {
      const c = ensure(); if (!c) return;
      if (c.state !== "running") { const pr = c.resume(); if (pr && pr.catch) pr.catch(()=>{}); }   // suspended / interrupted (iOS)
      // iOS WebView: sessiz kısa bir buffer çalmak bağlamı gerçekten açar
      const s = c.createBufferSource();
      s.buffer = c.createBuffer(1, 1, c.sampleRate);
      s.connect(c.destination);
      s.onended = function(){ try { s.disconnect(); } catch (e) {} };
      s.start(0);
    } catch (e) {}
  }

  function setEnabled(on){
    enabled = !!on;
    try { window.localStorage && window.localStorage.setItem(PREF_KEY, enabled ? "1" : "0"); } catch (e) {}
    if (enabled) unlock();
  }

  // İlk kullanıcı etkileşiminde kendiliğinden aç (bir kerelik)
  try {
    if (typeof window !== "undefined" && window.addEventListener) {
      // Dokunmatikte kullanıcı etkinleşmesi touchend/pointerup/click'te sayılır (iOS): hepsini dinle;
      //   bağlam gerçekten "running" olana kadar her etkileşimde yeniden dene
      const EVS = ["pointerdown", "touchstart", "pointerup", "touchend", "click", "keydown"];
      const opts = { passive: true, capture: true };
      let done = false;
      const onFirst = function(){
        if (done) return;
        unlock();
        try {
          const c = ensure();
          if (c && c.state === "running") {
            done = true;
            EVS.forEach(function(ev){ window.removeEventListener(ev, onFirst, opts); });
          }
        } catch (e) {}
      };
      EVS.forEach(function(ev){ window.addEventListener(ev, onFirst, opts); });
    }
  } catch (e) {}

  const api = {
    unlock, kick, pass, whistle, crowd, goal, post, save, setEnabled,
  };
  Object.defineProperty(api, "enabled", {
    get(){ return enabled; },
    set(v){ setEnabled(v); },
    enumerable: true,
  });
  return api;
})();
