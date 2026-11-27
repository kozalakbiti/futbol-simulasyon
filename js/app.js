// ═══════════════════════════════════════════════════════════════
// ANA UYGULAMA
// ═══════════════════════════════════════════════════════════════
function App(){
  useThemeMode(); // Gece/Gündüz değişince tüm ağaç yeniden render olur
  const [page,setPage]=useState("home");
  const [digerOpen,setDigerOpen]=useState(false);
  const [managerOpen,setManagerOpen]=useState(false);
  const [transferOffer,setTransferOffer]=useState(null);
  const [pendingSquad,setPendingSquad]=useState([]);
  const [recentlyTransferred,setRecentlyTransferred]=useState(new Set());
  // Haftalık teklif kilidi: {playerId: weekNumber} — aynı haftada aynı oyuncuya 1 teklif
  const [weeklyOfferedPlayers,setWeeklyOfferedPlayers]=useState({});
  const [onboardingDone,setOnboardingDone]=useState(false);
  const [tutorialOpen,setTutorialOpen]=useState(false);
  const [manager,setManager]=useState({firstName:"",lastName:"",age:38,avatar:"m1"});
  // gameScreen: "mainmenu" | "scenario" | "playing" | "career_onboarding" | "career"
  const [gameScreen,setGameScreen]=useState("mainmenu");
  const [activeScenario,setActiveScenario]=useState(null); // seçilen senaryo
  const [careerState,setCareerState]=useState(null); // oyuncu kariyer state
  const [incomingOffers,setIncomingOffers]=useState([]);
  const [activeOffer,setActiveOffer]=useState(null);
  const [matchOverlay,setMatchOverlay]=useState(null);
  // Maç hazırlığı (scout raporu) modalı + cihaz tercihi: ekranı atla
  const [preMatch,setPreMatch]=useState(null);
  const [formasyonInitTab,setFormasyonInitTab]=useState("formasyon");
  const [skipPreMatch,setSkipPreMatchRaw]=useState(()=>safeLsGet(PREF_SKIP_PREMATCH_KEY,false)===true);
  const setSkipPreMatch=(v)=>{setSkipPreMatchRaw(!!v);safeLsSet(PREF_SKIP_PREMATCH_KEY,!!v);};
  const [postMatchBasin,setPostMatchBasin]=useState(null); // {fix, result} — maç sonu basın toplantısı
  const [selectedPlayer,setSelectedPlayer]=useState(null);
  const [releaseConfirm,setReleaseConfirm]=useState(null); // serbest bırakma onay dialogu
  const [coaches,setCoaches]=useState(COACHES.map(c=>({...c})));
  const [squad,setSquad]=useState(INIT_SQUAD.map(p=>({...p,traits:p.traits||assignTraits(p)})));
  const [db,setDb]=useState(()=>[...DB.map(p=>({...p})),...INIT_FREE_YOUTH]);
  const [youth,setYouth]=useState(INIT_YOUTH.map(p=>({...p,youthYear:p.youthYear||0})));
  const [academyLevel,setAcademyLevel]=useState(1); // 1-5 arası akademi seviyesi
  const [toast,setToast]=useState(null);
  const [news,setNews]=useState([]);
  // Formasyon + lineup App seviyesinde — maç gücünü etkiler
  const [formation,setFormation]=useState("4-4-2");
  // Formasyon değişince (App seviyesinde) lineup'ı da yenile
  const changeFormation=(f)=>{
    setFormation(f);
    // lineup'ı yeni formasyona göre en iyi 11 ile yenile
    setTimeout(()=>setStartingXI(prev=>{
      const slts=FDATA[f]||FDATA["4-4-2"];
      const sq=squad; // closure üzerinden mevcut kadro
      const available=[...sq.map((p,i)=>({...p,sqIdx:i}))];
      const res=Array(11).fill(null);const used=new Set();
      slts.forEach((s,i)=>{
        const cands=available.filter(p=>!used.has(p.sqIdx)&&!(p.injured||0))
          .map(p=>{const pen=posPenalty(p.pos,s.p);if(pen===-99)return null;return{...p,score:p.ovr+pen};})
          .filter(Boolean).sort((a,b)=>b.score-a.score);
        if(cands[0]){res[i]=cands[0].sqIdx;used.add(cands[0].sqIdx);}
      });
      slts.forEach((_,i)=>{if(res[i]!==null)return;const fb=available.find(p=>!used.has(p.sqIdx));if(fb){res[i]=fb.sqIdx;used.add(fb.sqIdx);}});
      return res;
    }),0);
  };
  const [startingXI,setStartingXI]=useState(()=>{
    // İlk açılışta INIT_SQUAD'a göre 4-4-2 ile en iyi 11'i seç
    const slts=FDATA["4-4-2"];
    const available=[...INIT_SQUAD.map((p,i)=>({...p,sqIdx:i}))];
    const result=Array(11).fill(null);
    const used=new Set();
    slts.forEach((s,i)=>{
      const cands=available
        .filter(p=>!used.has(p.sqIdx))
        .map(p=>{const pen=posPenalty(p.pos,s.p);if(pen===-99)return null;return{...p,score:p.ovr+pen};})
        .filter(Boolean).sort((a,b)=>b.score-a.score);
      if(cands[0]){result[i]=cands[0].sqIdx;used.add(cands[0].sqIdx);}
    });
    slts.forEach((_,i)=>{
      if(result[i]!==null)return;
      const fb=available.find(p=>!used.has(p.sqIdx));
      if(fb){result[i]=fb.sqIdx;used.add(fb.sqIdx);}
    });
    return result;
  });
  // lineupRef: Babel 500KB deoptimizasyon koruması — handleMatchFinish closure'da lineup'a güvenli erişim
  const lineupRef=useRef(startingXI);
  useEffect(()=>{lineupRef.current=startingXI;},[startingXI]);
  // Haftalık otomatik dizilim — her maç sonrası en iyi 11'i otomatik seç
  const [autoLineup,setAutoLineup]=useState(true);
  // Taktik seçimleri App seviyesinde — maç sonucunu etkiler
  const [tactic,setTactic]=useState({press:1,defLine:1,style:0,wing:1,pressZone:0});
  // Bireysel antrenman odakları: {playerId: focusKey}
  const [trainFocus,setTrainFocus]=useState({});
  // Taktik maç bonusu hesapla: -7 ile +7 arası etki (rakip eşleşmesi dahil)
  const calcTacticBonus=(tac,oppStr,home,oppStyle=null,matchAmp=0)=>{
    const myS=calcMyStr();
    const diff=myS-oppStr; // pozitif = biz güçlüyüz, negatif = rakip güçlü
    let bonus=0;
    // Hücum Baskısı: güçlü rakibe karşı riskli, zayıfa karşı etkili
    if(tac.press===2) bonus+=(diff>8?3:diff>0?1:diff>-8?-1:-3);
    else if(tac.press===0) bonus+=(diff<-5?1:-1); // düşük baskı zayıfken dezavantaj
    // Defans Hattı: ileri hat riskli, geri hat güvenli ama pasif
    if(tac.defLine===2) bonus+=(diff>5?(home?2:1):(home?-1:-2));
    else if(tac.defLine===0) bonus+=(diff<-5?(home?1:2):(home?-1:0));
    // Oyun Stili: kısa pas güçlüyken işe yarar, uzun top zayıfken çare
    if(tac.style===0) bonus+=(diff>0?2:-1);
    else if(tac.style===2) bonus+=(diff<0?1:-2);
    // Kanat kullanımı: etkili ama defans açığı
    if(tac.wing===2) bonus+=(diff>0?2:0);
    else if(tac.wing===0) bonus+=(diff<0?1:-1);
    // Rakip sahada baskı: büyük risk
    if(tac.pressZone===2) bonus+=(diff>10?2:diff>0?0:diff>-10?-2:-4);
    // tog0: Hızlı Kontra — güçlü rakibe karşı etkili, zayıfa karşı anlamsız
    if(tac.tog0) bonus+=(diff<-5?3:diff<0?1:-1);
    // tog1: Set Press — rakip ne kadar güçlüyse o kadar etkili
    if(tac.tog1) bonus+=(diff<0?2:1);
    // tog2: Geri Çekil — deplasmanda güçlü rakibe karşı işe yarar
    if(tac.tog2) bonus+=(!home&&diff<0?2:home&&diff>0?-2:0);
    // tog3: Oyunu Yavaşlat — güçlü rakibi frenleme, ama zayıfa karşı olumsuz
    if(tac.tog3) bonus+=(diff<-5?2:diff<0?1:diff>5?-2:-1);
    // tog4: İki Kanat — hücum güçlüyse çok etkili, değilse riskli
    if(tac.tog4) bonus+=(diff>8?3:diff>0?1:-2);
    // tog5: Orta Sahaya Baskı — dengeli etki
    if(tac.tog5) bonus+=(diff>0?1:0);
    // Rakip analizi: taktiğin rakibin gerçek oyun kimliğine uyumu (±3)
    if(oppStyle) bonus+=calcStyleMatch(tac,oppStyle,matchAmp);
    // Sürpriz değişkenliği: aynı taktik her maç aynı sonucu vermesin
    const variance=(Math.random()-0.5)*2; // -1 ile +1 arası
    bonus+=variance;
    // Simetrik sınır: -7 ile +7
    return Math.max(-7,Math.min(7,Math.round(bonus)));
  };
  const headerRef=useRef(null);

  // Gerçek maç gücü: lineup'taki oyuncuların efektif OVR ortalaması
  const calcMyStr=()=>{
    const slots=FDATA[formation];
    let total=0; let count=0;
    (lineupRef.current||startingXI||[]).forEach((sqIdx,slotIdx)=>{
      const pl=squad[sqIdx];
      const slot=slots[slotIdx];
      if(!pl||!slot) return;
      if((pl.injured||0)>0) return; // Sakatlar katılmaz
      const pen=posPenalty(pl.pos,slot.p);
      const eOvr=pen===-99?Math.max(55,pl.ovr-25):pl.ovr+pen;
      // Moral etkisi: düşük moral güç düşürür
      const moral=pl.moral??75;
      const moralMult=moral>=80?1.04:moral>=60?1.0:moral>=40?0.94:0.87;
      total+=Math.round(eOvr*moralMult); count++;
    });
    return count>0?Math.round(total/count):74;
  };

  // Maç sonrası otomatik dizilim — mevcut kadro + formasyon baz alır
  // Formasyonu da kadro yapısına göre otomatik optimize eder
  const buildAutoLineupApp=(currentSquad,currentFormation,currentCoaches,optimizeFormation=false)=>{
    // Kadro yapısına göre formasyon optimize et
    const chosenFormation=optimizeFormation
      ?getTeamFormation(currentSquad)
      :currentFormation;
    if(optimizeFormation&&chosenFormation!==currentFormation){
      setFormation(chosenFormation);
    }
    const slts=FDATA[chosenFormation]||FDATA[currentFormation];
    const posGroup=(p)=>{
      if(p==="GK") return "GK";
      if(["CB","LB","RB"].includes(p)) return "DEF";
      if(["CM","LM","RM","CAM","CDM"].includes(p)) return "MID";
      return "ATT";
    };
    const activeCoach=(currentCoaches||[]).find(c=>c.hired);
    const boostGroup=activeCoach
      ?{Hücum:"ATT","Pas Oyunu":"MID",Defans:"DEF",Taktik:null,Denge:null,Genç:null}[activeCoach.spec]||null
      :null;
    const available=[...currentSquad.map((p,i)=>({...p,sqIdx:i}))];
    const result=Array(11).fill(null);
    const used=new Set();
    // 1. geçiş: sağlıklı + tam pozisyon uyumu
    slts.forEach((s,i)=>{
      const candidates=available
        .filter(p=>!used.has(p.sqIdx)&&(p.injured||0)===0&&posPenalty(p.pos,s.p)===0)
        .map(p=>{
          const boost=(boostGroup&&posGroup(p.pos)===boostGroup)?3:0;
          return {...p,score:p.ovr+boost};
        })
        .sort((a,b)=>b.score-a.score);
      if(candidates[0]){ result[i]=candidates[0].sqIdx; used.add(candidates[0].sqIdx); }
    });
    // 2. geçiş: sağlıklı + en yakın pozisyon fallback (yetersiz kadro)
    slts.forEach((s,i)=>{
      if(result[i]!==null) return;
      const fallbackOrder=NEAREST_POS[s.p]||[s.p];
      for(const fallbackPos of fallbackOrder){
        const candidates=available
          .filter(p=>!used.has(p.sqIdx)&&(p.injured||0)===0&&p.pos===fallbackPos)
          .map(p=>({...p,score:p.ovr}))
          .sort((a,b)=>b.score-a.score);
        if(candidates[0]){ result[i]=candidates[0].sqIdx; used.add(candidates[0].sqIdx); break; }
      }
    });
    // 3. geçiş: sağlıklı herhangi biri
    slts.forEach((s,i)=>{
      if(result[i]!==null) return;
      const last=available.filter(p=>!used.has(p.sqIdx)&&(p.injured||0)===0&&(s.p==="GK"?p.pos==="GK":p.pos!=="GK"));
      if(last[0]){ result[i]=last[0].sqIdx; used.add(last[0].sqIdx); }
    });
    // 4. geçiş: zorunlu fallback — sakat dahil (11 kişi yoksa)
    slts.forEach((s,i)=>{
      if(result[i]!==null) return;
      const last=available.filter(p=>!used.has(p.sqIdx)&&(s.p==="GK"?p.pos==="GK":p.pos!=="GK"));
      if(last[0]){ result[i]=last[0].sqIdx; used.add(last[0].sqIdx); }
    });
    return result;
  };

  // Finans — ayrı basit state'ler (closure sorunu olmaz)
  // Transfer & Wage budget split
  const [transferBudget,setTransferBudget]=useState(12000); // K€ — transfer harcama bütçesi
  const [transferPace,setTransferPace]=useState("normal"); // "slow" | "normal" | "fast"
  const [wageBudget,setWageBudget]=useState(8000);          // K€ — yıllık maaş bütçesi
  const [spent,setSpent]=useState(0);       // K€ transfer harcama
  const [income,setIncome]=useState(0);     // K€ transfer gelir
  const [wageSpent,setWageSpent]=useState(0); // K€ maaş harcama
  const [fStadyum,setFStadyum]=useState(0);
  const [fForma,setFFOrma]=useState(0);
  const [fYayin,setFYayin]=useState(0);
  const [fSponsor,setFSponsor]=useState(0);
  const [fLigOdeme,setFLigOdeme]=useState(0);
  const [fKupaPrim,setFKupaPrim]=useState(0);
  const [weeklyLog,setWeeklyLog]=useState([]);

  // Sponsorship deals state — itibar (rep) bazlı gerçekçi anlaşmalar
  // TFF 1. Lig için küçük/yerel sponsorlar; Süper Lig ve artan itibarla büyük markalar açılır
  // Miktarlar K€/hafta cinsinden — TFF 1. Lig: 15-80K€/hafta, Süper Lig: 80-400K€/hafta
  const SPONSOR_DEALS=[
    // ── TFF 1. Lig seviyesi — itibar 0+ (herkese açık) ──
    {id:"s1",name:"Yerel Çay Markası",logo:"🍵",amount:15,duration:2,boost:"forma",desc:"Forma koluna logo — +15K€/hafta",requires:0,tier:"TFF"},
    {id:"s2",name:"Bölgesel Banka",logo:"🏧",amount:22,duration:1,boost:"stadyum",desc:"Stadyum reklam panoları — +22K€/hafta",requires:0,tier:"TFF"},
    {id:"s3",name:"Spor Giyim Markası",logo:"👟",amount:18,duration:3,boost:"forma",desc:"Forma tedariki + gelir — +18K€/hafta",requires:5,tier:"TFF"},
    {id:"s4",name:"Otobüs Firması",logo:"🚌",amount:12,duration:2,boost:"yayin",desc:"Takım ulaşım ortaklığı — +12K€/hafta",requires:0,tier:"TFF"},
    // ── Büyüyen TFF takımı — itibar 15+ ──
    {id:"s5",name:"Bölgesel GSM",logo:"📞",amount:35,duration:2,boost:"yayin",desc:"Maç yayınlarında reklam — +35K€/hafta",requires:15,tier:"TFF+"},
    {id:"s6",name:"Yerel İnşaat",logo:"🏗️",amount:28,duration:1,boost:"transfer",desc:"Stadyum sponsorluğu — +28K€/hafta",requires:10,tier:"TFF+"},
    {id:"s7",name:"Enerji İçeceği",logo:"⚡",amount:40,duration:2,boost:"wage",desc:"Oyuncu performans sponsoru — +40K€/hafta",requires:20,tier:"TFF+"},
    // ── Süper Lig ufkunda — itibar 30+ ──
    {id:"s8",name:"Turkcell Bölge",logo:"📱",amount:65,duration:2,boost:"yayin",desc:"Bölgesel yayın anlaşması — +65K€/hafta",requires:30,tier:"SL-"},
    {id:"s9",name:"Ülker Snack",logo:"🍪",amount:55,duration:3,boost:"forma",desc:"Forma kol sponsoru — +55K€/hafta",requires:35,tier:"SL-"},
    {id:"s10",name:"Türk Hava Yolları",logo:"✈️",amount:80,duration:1,boost:"stadyum",desc:"Stadyum isim hakkı — +80K€/hafta",requires:40,tier:"SL-"},
    // ── Süper Lig takımı — itibar 50+ ──
    {id:"s11",name:"Türk Telekom",logo:"📡",amount:160,duration:2,boost:"yayin",desc:"Resmi iletişim sponsoru — +160K€/hafta",requires:50,tier:"SL"},
    {id:"s12",name:"Garanti BBVA",logo:"🏦",amount:200,duration:2,boost:"transfer",desc:"Ana forma sponsoru — +200K€/hafta",requires:60,tier:"SL"},
    {id:"s13",name:"Pegasus",logo:"🛫",amount:140,duration:1,boost:"wage",desc:"Resmi uçuş ortağı — +140K€/hafta",requires:55,tier:"SL"},
    // ── Büyük kulüp — itibar 70+ ──
    {id:"s14",name:"Emirates",logo:"🌟",amount:350,duration:1,boost:"stadyum",desc:"Stadyum isim hakkı premium — +350K€/hafta",requires:70,tier:"Elite"},
    {id:"s15",name:"Fenerbahçe Banka",logo:"🏆",amount:280,duration:2,boost:"transfer",desc:"Uluslararası finans ortağı — +280K€/hafta",requires:75,tier:"Elite"},
  ];
  const [activeSponsors,setActiveSponsors]=useState([]); // {dealId, weeksLeft, totalEarned}
  const [sponsorModal,setSponsorModal]=useState(false);

  // Accept a sponsor deal
  const acceptSponsor=(deal)=>{
    setActiveSponsors(prev=>{
      if(prev.find(s=>s.dealId===deal.id)) return prev; // already active
      addNews({type:"sponsor",player:deal.name,club:"Sponsorluk",val:deal.amount,
        detail:`${deal.logo} ${deal.name} sponsorluğu imzalandı · ${deal.amount}K€/hafta · ${deal.duration} yıl`,
        date:new Date().toLocaleDateString("tr-TR")});
      setToast(`${deal.logo} ${deal.name} sponsorluğu imzalandı!`);
      setTimeout(()=>setToast(null),3000);
      return [...prev,{dealId:deal.id,weeksLeft:deal.duration*34,totalEarned:0}];
    });
    setSponsorModal(false);
  };

  // ── YÖNETİM İLİŞKİSİ ──
  const [mgmt,setMgmt]=useState({
    trust:60,
    blockedBudget:0,
    blockReason:"",
    blockWeeksLeft:0,
    history:[],
  });

  // ── TRANSFER YASAĞI SİSTEMİ ──
  // Bütçe ekside → 1. sezon sonu: UYARI verilir, yasak YOK.
  // Bütçe hâlâ ekside → 2. sezon sonu: transfer yasağı + -15 itibar cezası.
  // Bütçe artıya geçince yasak otomatik kalkar.
  const [transferBan,setTransferBan]=useState({
    active:false,          // gerçek yasak
    reason:"",
    appliedSeason:"",
    budgetWarning:false,   // 1. sezon uyarısı aktif mi (yasak henüz yok)
    warningSeason:"",      // uyarı hangi sezonda verildi
  });

  // finans objesi — sadece okuma için (PageFinans, header vb.)
  const budget=transferBudget+wageBudget; // combined for legacy compat
  // Yönetim blokesi: mgmt.trust < 30 iken transferBudget'ın %30'u bloke
  const isMgmtBlocked=mgmt.trust<30&&mgmt.blockWeeksLeft>0;
  const blockedAmount=isMgmtBlocked?Math.round(transferBudget*0.30):0;
  const effectiveTransferBudget=transferBudget-blockedAmount;

  const finans={
    budget,transferBudget,effectiveTransferBudget,blockedAmount,isMgmtBlocked,
    wageBudget,spent,income,wageSpent,salaryTotal:0,
    stadyum:fStadyum,forma:fForma,yayin:fYayin,
    sponsorluk:fSponsor,ligOdeme:fLigOdeme,kupaPrim:fKupaPrim,weeklyLog,
    activeSponsors,SPONSOR_DEALS,
    transferBan,
  };
  const updateFinans=(delta,type,desc="")=>{
    const isGelir=["sell","stadyum","forma","yayin","sponsorluk","ligOdeme","kupaPrim","sponsor_payout"].includes(type);
    const isGider=["buy","salary_weekly","salary_add"].includes(type);
    if(type==="buy"){
      setSpent(p=>p+delta);
      setTransferBudget(p=>p-delta); // Negatife düşebilir — sezon sonu hesaplanır
    }
    if(type==="sell")      {setIncome(p=>p+delta);setTransferBudget(p=>p+Math.round(delta*0.5));setWageBudget(p=>p+Math.round(delta*0.5));}
    if(type==="stadyum")   setFStadyum(p=>p+delta);
    if(type==="forma")     setFFOrma(p=>p+delta);
    if(type==="yayin")     setFYayin(p=>p+delta);
    if(type==="sponsorluk"||type==="sponsor_payout") setFSponsor(p=>p+delta);
    if(type==="ligOdeme")  setFLigOdeme(p=>p+delta);
    if(type==="kupaPrim")  setFKupaPrim(p=>p+delta);
    if(type==="salary_weekly") {
      setWageSpent(p=>p+delta);
      setWageBudget(p=>p-delta);
    }
    if(type==="salary_add") {
      setWageSpent(p=>p+delta);
      setWageBudget(p=>p-delta);
    }
    if(type==="salary_remove") setWageBudget(p=>p+delta);
    if(type==="salary_annual"||type==="coach_salary"){
      setWageSpent(p=>p+delta);
      // Maaşın yarısı wageBudget'tan, yarısı transferBudget'tan
      const half=Math.round(delta*0.5);
      setWageBudget(p=>p-half);
      setTransferBudget(p=>p-(delta-half));
    }
    // Gelirler shared pool'a gider
    if(["stadyum","forma","yayin","sponsorluk","sponsor_payout","ligOdeme","kupaPrim"].includes(type)){
      setTransferBudget(p=>p+Math.round(delta*0.5));
      setWageBudget(p=>p+Math.round(delta*0.5));
    }
    // sell: already handled above (split 50/50 between transferBudget and wageBudget)
    setWeeklyLog(p=>[{week:0,type,amount:delta,desc},...p].slice(0,50));
    // Transfer yasağı kaldırma kontrolü — gelir/satış sonrası bütçe artıya geçti mi?
    if(["sell","stadyum","forma","yayin","sponsorluk","sponsor_payout","ligOdeme","kupaPrim","salary_remove","salary_annual","coach_salary"].includes(type)){
      // React state async olduğu için timeout ile kontrol
      setTimeout(()=>checkTransferBanLift(),50);
    }
  };

  // Transfer yasağı / uyarı kaldırma kontrolü — bütçe artıya geçince otomatik çalışır
  const checkTransferBanLift=(newTransferBudget,newWageBudget)=>{
    const newTotal=(newTransferBudget??transferBudget)+(newWageBudget??wageBudget);
    if(newTotal>=0){
      if(transferBan.active){
        setTransferBan({active:false,reason:"",appliedSeason:"",budgetWarning:false,warningSeason:""});
        addNews({type:"rival_transfer",player:"✅ Transfer Yasağı Kaldırıldı",club:clubName,val:0,
          detail:`✅ Bütçe artıya geçti! ${clubName} transfer yasağı kaldırıldı. Tekrar transfer yapabilirsin.`,
          date:new Date().toLocaleDateString("tr-TR")});
        setTimeout(()=>showToast("✅ Bütçe artıya geçti — transfer yasağı kaldırıldı!",4000),200);
      } else if(transferBan.budgetWarning){
        setTransferBan(prev=>({...prev,budgetWarning:false,warningSeason:""}));
        setTimeout(()=>showToast("✅ Bütçe artıya geçti — bütçe uyarısı kaldırıldı!",3000),200);
      }
    }
  };

  // Process sponsor payouts each match
  const processSponsorPayouts=()=>{
    setActiveSponsors(prev=>{
      const updated=[];
      prev.forEach(s=>{
        const deal=SPONSOR_DEALS.find(d=>d.id===s.dealId);
        if(!deal) return;
        const payout=deal.amount;
        updateFinans(payout,"sponsor_payout",`${deal.logo} ${deal.name} sponsorluk ödemesi`);
        const newWeeks=s.weeksLeft-1;
        if(newWeeks>0) updated.push({...s,weeksLeft:newWeeks,totalEarned:s.totalEarned+payout});
        else addNews({type:"sponsor_end",player:deal.name,club:"",val:0,
          detail:`${deal.logo} ${deal.name} sponsorluğu sona erdi`,date:new Date().toLocaleDateString("tr-TR")});
      });
      return updated;
    });
  };

  const addNews=(item)=>setNews(prev=>[...prev,item]);

  const MAX_SQUAD=32;
  const handleAddToSquad=(player,source="db",transferCostM=null,transferSalK=null,transferCt=null)=>{
    if(squad.length>=MAX_SQUAD){
      showToast(`⛔ Kadro dolu! Maksimum ${MAX_SQUAD} oyuncu. Önce birini sat veya bırak.`,4000);
      return;
    }
    const finalSal=transferSalK!==null?transferSalK:(player.sal||20);
    const isFreePlayer=player.st==="free"||player.val===0;
    const isYouthPlayer=source==="youth";
    const finalVal=transferCostM!==null?transferCostM
      :isYouthPlayer?calcYouthPlayerVal(player)
      :isFreePlayer?calcFreePlayerVal(player)
      :(player.val||0);
    setSquad(prev=>{
      if(prev.find(p=>p.id===player.id)) return prev;
      // Bir sonraki transfer penceresine kadar teklif koruması
      const nextWindow=(()=>{
        const MONTH_ORDER=["Temmuz","Agustos","Eylul","Ekim","Kasim","Aralik","Ocak","Subat","Mart","Nisan","Mayis","Haziran"];
        const curIdx=MONTH_ORDER.indexOf(currentMonth||"Temmuz");
        const found=["Agustos","Eylul","Ocak"].find(w=>MONTH_ORDER.indexOf(w)>curIdx);
        return found||"_nextSeason";
      })();
      const newP={
        id:player.id, n:player.n, pos:player.pos,
        ovr:player.ovr, pot:player.pot,
        traits:assignTraits(player),
        moral:player.moral||75, injured:player.injured||0, injSev:player.injSev||0, fatigue:0, protectTrain:false, devPoints:player.devPoints||0, seasonGoals:0, seasonAssists:0, seasonRatings:[], seasonMatches:0,
        spd:player.spd||Math.round(player.ovr*0.92+rnd(-5,5)),
        sht:player.sht||Math.round(player.ovr*0.88+rnd(-5,5)),
        pas:player.pas||Math.round(player.ovr*0.85+rnd(-5,5)),
        def:player.def||Math.round(player.ovr*0.80+rnd(-5,5)),
        age:player.age, ct:transferCt!==null?transferCt:(player.ct||3),
        val:finalVal, sal:finalSal,
        st:(player.st==="free"||isYouthPlayer)?"contracted":(player.st||"contracted"),
        nat:player.nat, lg:player.lg, club:player.club,
        listed:false, loan:false,
        protectedUntil:nextWindow,  // bu aydan önce dış teklif gelmez
      };
      return [...prev, newP];
    });
    // Transfer pazarından satın alındıysa sadece DB'den kaldır
    // (finans güncellemesi çağıran tarafından yapılır — çift sayım önlenir)
    if(source==="db"){
      setDb(prev=>prev.filter(p=>p.id!==player.id));
    }
    // Altyapıdan alındıysa altyapı listesinden kaldır
    if(source==="youth") setYouth(prev=>prev.filter(p=>p.id!==player.id));
  };

  const [clubName,setClubNameRaw]=useState("FC Yildiz");
  const setClubName=(name)=>{
    setClubNameRaw(name);
    setSeason(prev=>({...prev,teams:prev.teams.map(t=>t.me?{...t,n:name,name:name}:t)}));
  };


  // Haftalık gelir gelişim tablosu
  // Lig: TFF1→300-700K€/yıl yayın, SL→1.5-4M€/yıl; forma/sponsor liglerine göre
  const calcWeeklyRevenue=(fix,lg,rank,totalWeeks=34)=>{
    const isHome=fix.home;
    const isLeague=fix.comp!=="ZTK";
    const week=fix.w||1;
    // Haftalık pay (yıllık bölü sezon haftası)
    // Yayın geliri — her maç haftası (ev/deplasman farketmez)
    const yayinYillik=lg==="Elit Lig"?2200+(Math.max(0,10-rank)*150):700+(Math.max(0,10-rank)*30);
    const yayinHafta=Math.round(yayinYillik/totalWeeks);
    // Stadyum geliri — lig maçları + ev kupa maçları
    const kapasite=lg==="Elit Lig"?18000:8000;
    const biletFiyat=lg==="Elit Lig"?22:12;
    const doluluk=0.55+Math.random()*0.35; // %55-90
    // Kupa ev maçlarında stadyum doluluk %40-65 (daha az ilgi)
    const kupaDoluluk=0.40+Math.random()*0.25;
    const isZtk=fix.comp==="ZTK";
    const stadyumGelir=isHome&&isLeague?Math.round(kapasite*biletFiyat*doluluk/1000):isHome&&isZtk?Math.round(kapasite*biletFiyat*kupaDoluluk/1000*0.7):0; // K€
    // Forma geliri — sabit haftalık
    const formaYillik=lg==="Elit Lig"?380:80;
    const formaHafta=Math.round(formaYillik/totalWeeks);
    // Sponsorluk — sabit haftalık
    const sponsorYillik=lg==="Elit Lig"?600:150;
    const sponsorHafta=Math.round(sponsorYillik/totalWeeks);
    return {yayin:yayinHafta,stadyum:stadyumGelir,forma:formaHafta,sponsorluk:sponsorHafta};
  };
  const [season,setSeason]=useState({
    week:1,played:0,goals:0,conceded:0,wins:0,draws:0,losses:0,
    league:"1. Lig",
    teams:buildInitTeamsWithStr(),
    results:[],
    fixture:sortFixture([...INIT_PRESEASON_TFF1.map(f=>({...f})),...buildTFF1Fixture().map(f=>({...f})),...buildKupaTFF1(clubName,Date.now()).map(f=>({...f}))]),
    uefaGroups: null,
    kupaSonuc: {group:"Grup A", w:0,d:0,l:0,gf:0,ga:0,pts:0, elendi:false, finalci:false, sampiyon:false},
  });

  const [seasonEndModal,setSeasonEndModal]=useState(null);
  const [rep,setRep]=useState({pts:8,history:[]});

  // ── KARİYER İSTATİSTİKLERİ — sezonlar boyunca birikir ──
  const [careerStats,setCareerStats]=useState({
    seasons:[],           // {league, rank, pts, w, d, l, gf, ga, year}
    totalW:0,totalD:0,totalL:0,totalGF:0,totalGA:0,totalPts:0,
    totalMatches:0,
    bestRank:99,bestLeague:"",
    trophies:{ztk:0,sl:0,cl:0,uefal:0,con:0,superKupa:0},
    lastClChampion:"",     // geçen sezon ASK şampiyonu
    lastUefaChampion:"",   // geçen sezon AL şampiyonu
    pressMoods:[],        // basın toplantısı geçmişi
  });

  // ── TARAFTAR İLİŞKİLERİ ──
  const [fans,setFans]=useState({
    happiness:60,
    attendance:65,
    trust:50,
    chants:0,
    ultras:"nötr",
    history:[],
  });

  const updateMgmt=(delta,reason)=>{
    setMgmt(prev=>{
      const newT=Math.max(0,Math.min(100,prev.trust+delta));
      const entry={reason,delta,trust:newT,date:new Date().toLocaleDateString("tr-TR")};
      // Güven 30'un altına düştüğünde bütçenin %30'unu 4 hafta bloke et
      let newBlock=prev.blockedBudget, newReason=prev.blockReason, newWeeks=prev.blockWeeksLeft;
      if(newT<30&&prev.trust>=30){
        // Eşiği yeni geçti — bloke uygula (isMgmtBlocked: trust<30 && blockWeeksLeft>0)
        newReason=reason;
        newWeeks=4;
      }
      return{...prev,trust:newT,blockedBudget:newBlock,blockReason:newReason,blockWeeksLeft:newWeeks,
        history:[entry,...(prev.history||[])].slice(0,30)};
    });
  };

  const updateFans=(delta,reason,type="match")=>{
    setFans(prev=>{
      const newH=Math.max(0,Math.min(100,prev.happiness+delta));
      const newT=Math.max(0,Math.min(100,prev.trust+(delta>0?Math.ceil(delta/3):Math.floor(delta/2))));
      const newA=Math.max(30,Math.min(100,prev.attendance+(delta>0?1:-1)));
      const ultras=newH>=75?"destekçi":newH<=30?"düşmanca":"nötr";
      const entry={reason,delta,happiness:newH,trust:newT,type,date:new Date().toLocaleDateString("tr-TR")};
      return{...prev,happiness:newH,trust:newT,attendance:newA,ultras,
        history:[entry,...(prev.history||[])].slice(0,40)};
    });
  };
  // İtibar başlangıç hesabı — lig seviyesi + takım gücü
  const calcInitialRep=(league,teamStr)=>{
    // Lig taban itibarı
    const LIG_BASE={
      "Elit Lig":38,"1. Lig":12,
      "İngiliz Ligi":52,"İspanyol Ligi":50,"Alman Ligi":48,"İtalyan Ligi":46,"Fransız Ligi":42,
      "Hollanda Ligi":36,"Portekiz Ligi":34,"İngiliz 2. Ligi":30,"Scottish Prem":28,"MLS":22,"Saudi Pro League":25,
    };
    const base=LIG_BASE[league]||20;
    // Takım gücü bonusu: her 5 OVR puanı için +3, lig bazından
    // 65 str = ortalama, 80 str = güçlü, 55 str = zayıf
    const strBonus=Math.round((teamStr-65)*0.5);
    return Math.max(5,Math.min(80,base+strBonus));
  };

  const updateRep=(delta,reason,lg,raw=false)=>{
    // ── İTİBAR KAZANİM EĞRİSİ ──
    const gainDecay=(pts)=>
      pts<20?1.00:pts<40?0.70:pts<60?0.42:pts<75?0.22:pts<88?0.10:0.04;
    const lossMult=(pts)=>
      pts<40?1.00:pts<60?1.10:pts<75?1.25:pts<88?1.45:1.70;

    // 75+ itibar: sadece kupa/şampiyonluk kazanımına izin ver
    // Maç galibiyeti, sıralama, transfer vb. artık kazandırmaz (kayıplar hâlâ geçerli)
    const isTrophyReason=(r)=>
      r.includes("Şampiyonluğu")||r.includes("Şampiyonu")||
      r.includes("Kupası")||r.includes("Finale Çıktı")||
      r.includes("Yarı Finale")||r.includes("Çeyrek Finale")||
      r.includes("Grup Aşaması Geçildi")||r.includes("yükselmesi")||
      r.includes("ASK hakkı")||r.includes("Avrupa Ligi")||
      r.includes("Turuna Çıktı")||r.includes("Konferans Ligi");

    if(raw){
      // raw=true: maç galibiyet/mağlubiyet
      setRep(prev=>{
        let scaledDelta=delta;
        if(delta>0){
          // 75+ ise maç galibiyeti artık kazandırmaz
          if(prev.pts>=75) return prev;
          scaledDelta=Math.max(1,Math.round(delta*gainDecay(prev.pts)));
        } else {
          scaledDelta=Math.round(delta*lossMult(prev.pts));
        }
        const npts=Math.max(0,Math.min(100,prev.pts+scaledDelta));
        const entry={reason,delta:scaledDelta,pts:npts,date:new Date().toLocaleDateString("tr-TR")};
        return{pts:npts,history:[entry,...(prev.history||[])].slice(0,30)};
      });
      return;
    }
    const LIG_MULT={
      "İngiliz Ligi":1.4,"İspanyol Ligi":1.35,"Alman Ligi":1.3,"İtalyan Ligi":1.25,"Fransız Ligi":1.2,
      "Elit Lig":1.1,"1. Lig":0.75,"Hollanda Ligi":1.0,"Portekiz Ligi":0.9,"İngiliz 2. Ligi":0.85,
      "Scottish Prem":0.7,"MLS":0.7,"Saudi Pro League":0.8,
    };
    const mult=LIG_MULT[lg]||0.8;
    setRep(prev=>{
      let d;
      if(delta>0){
        // 75+ ise sadece kupa/şampiyonluk kazanımına izin ver
        if(prev.pts>=75&&!isTrophyReason(reason)) return prev;
        // Kupa kazanımları için sabit puanlar (decay yerine):
        // CL Şampiyonluğu: +7 | AL Şampiyonluğu: +3 | Lig Şampiyonluğu: +2 | Kupa: +1
        if(prev.pts>=75){
          const trophyPts=
            reason.includes("Avrupa Şampiyonlar Kupası")&&reason.includes("Şampiyonluğu")?7:
            reason.includes("UEFA")&&reason.includes("Şampiyonluğu")?3:
            reason.includes("Süper Lig Şampiyonluğu")?2:
            reason.includes("Lig Şampiyonluğu")?2:
            reason.includes("Kupa")&&reason.includes("Şampiyonluğu")?1:
            reason.includes("CL")&&reason.includes("Şampiyonluğu")?7:
            Math.max(1,Math.round(delta*mult*gainDecay(prev.pts)));
          const npts=Math.max(0,Math.min(100,prev.pts+trophyPts));
          const entry={reason,delta:trophyPts,pts:npts,date:new Date().toLocaleDateString("tr-TR")};
          return{pts:npts,history:[entry,...(prev.history||[])].slice(0,30)};
        }
        d=Math.max(1,Math.round(delta*mult*gainDecay(prev.pts)));
      } else {
        d=Math.round(delta*mult*lossMult(prev.pts));
      }
      const npts=Math.max(0,Math.min(100,prev.pts+d));
      const entry={reason,delta:d,pts:npts,date:new Date().toLocaleDateString("tr-TR")};
      return{pts:npts,history:[entry,...(prev.history||[])].slice(0,30)};
    });
  };
  // İngiltere terfi/düşme: İngiliz Ligi son 3 → İngiliz 2. Ligi, İngiliz 2. Ligi ilk 3 → İngiliz Ligi
  // (kullanıcı takımı listelerde yer alırsa AI takas sayısı otomatik azalır; lig boyutları 20/24 kalır)
  const applyEngSwaps=(teams)=>{
    const srt=(lg)=>teams.filter(t=>t.lg===lg).sort((a,b)=>b.pts-a.pts||b.gd-a.gd||b.gf-a.gf);
    const pl=srt("İngiliz Ligi"), ch=srt("İngiliz 2. Ligi");
    const anyPlayed=pl.some(t=>(t.w+t.d+t.l)>0)||ch.some(t=>(t.w+t.d+t.l)>0);
    if(!anyPlayed||pl.length<4||ch.length<4) return teams;
    const plRel=new Set(pl.slice(-3).filter(t=>!t.me).map(t=>t.n));
    const chPro=new Set(ch.slice(0,3).filter(t=>!t.me).map(t=>t.n));
    return teams.map(t=>t.me?t
      :plRel.has(t.n)?{...t,lg:"İngiliz 2. Ligi",str:Math.min(74,Math.max(t.str-2,64))}
      :chPro.has(t.n)?{...t,lg:"İngiliz Ligi",str:Math.max(64,Math.min(70,t.str-1))}
      :t);
  };
  const promoteToLeague=(newLg,tffTable=[],slTable=[])=>{
    const is38Lig=["İngiliz Ligi","İspanyol Ligi","İtalyan Ligi","İngiliz 2. Ligi"].includes(newLg);
    // İngiltere ligleri: terfi/düşme sonrası güncel takım listesiyle fikstür kur
    const engTeamsNext=applyEngSwaps(season.teams||[]);
    const ligFix=newLg==="1. Lig"
      ?buildTFF1Fixture(clubName).map(f=>({...f}))
      :is38Lig
      ?buildBig5Fixture(newLg,clubName,(newLg==="İngiliz Ligi"||newLg==="İngiliz 2. Ligi")?engTeamsNext:null)
      :newLg==="Elit Lig"?buildSLFixture(clubName).map(f=>({...f}))
      :newLg==="Portekiz Ligi"?buildPrimeiraFixture(clubName).map(f=>({...f}))
      :newLg==="Hollanda Ligi"?buildEredivisieFixture(clubName).map(f=>({...f}))
      :buildSLFixture(clubName).map(f=>({...f}));
    const kupaFix=newLg==="1. Lig"
      ?buildKupaTFF1(clubName,Date.now()).map(f=>({...f}))
      :newLg==="Elit Lig"?buildKupaSL(clubName,Date.now()).map(f=>({...f}))
      :[];
    const preFix=newLg==="1. Lig"
      ?INIT_PRESEASON_TFF1.map(f=>({...f}))
      :newLg==="Elit Lig"?INIT_PRESEASON_SL.map(f=>({...f}))
      :newLg==="Portekiz Ligi"?INIT_PRESEASON_PRIMEIRA.map(f=>({...f}))
      :newLg==="Hollanda Ligi"?INIT_PRESEASON_EREDIVISIE.map(f=>({...f}))
      :[];
    const MONTH_ORDER_FIX=["Temmuz","Agustos","Eylul","Ekim","Kasim","Aralik","Ocak","Subat","Mart","Nisan","Mayis","Haziran"];
    const moFix=(m)=>{const i=MONTH_ORDER_FIX.indexOf(m);return i===-1?99:i;};
    // Avrupa (Swiss model) fikstürü Eylül kurasında eklenir (pendingEuroGroups)
    const euroFix=[];
    const newFix=[...preFix,...ligFix,...kupaFix];
    // Sezon sonu hazırlık maçı — tüm lig maçları bittikten sonra (Mayıs sonu)
    const _endHazOpps={
      "1. Lig":["Ankaragucu FC","Altay FC","Eskisehirspor"],
      "Elit Lig":["Rizespor FC","Konyaspor FC","Alanyaspor FC"],
      "İngiliz Ligi":["Southampton FC","Luton Town","Sheffield FC"],
      "İspanyol Ligi":["Cadiz CF","Alaves CF","Granada CF"],
      "Alman Ligi":["Heidenheim FC","Darmstadt 98","Holstein Kiel"],
      "İtalyan Ligi":["Empoli FC","Sassuolo FC","Monza FC"],
      "Fransız Ligi":["Metz FC","Lorient FC","Clermont FC"],
      "Hollanda Ligi":["NEC Nijmegen","Excelsior FC","Almere City"],
      "Portekiz Ligi":["Chaves FC","Estoril FC","Portimonense FC"],
      "İngiliz 2. Ligi":["Reading FC","Luton Town","Leicester City"],
    };
    const _hazPool=_endHazOpps[newLg]||["Ankaragucu FC","Altay FC","Eskisehirspor"];
    const _hazOpp=_hazPool[Math.floor(Math.random()*_hazPool.length)];
    const allFix=sortFixture([...newFix,...euroFix]);
    allFix.push({w:500,opp:_hazOpp,home:true,str:58+Math.floor(Math.random()*10),month:"Haziran",comp:"HAZ",round:"Hazırlık"});
    const kupaGrup=newLg==="1. Lig"?"Grup A":"Grup B";
    // ── ŞAMPIYONLAR KALKANI: ASK Şampiyonu vs AL Şampiyonu (Ağustos son haftası) ──
    // Sadece kullanıcı hem ZTK hem ASK/AL şampiyonu olduğunda eklenir
    // Önceki sezon CL (ASK) ve UEFA (AL) şampiyonlarını al
    const prevClChamp =careerStats.lastClChampion||"";
    const prevUefaChamp=careerStats.lastUefaChampion||"";
    // Simüle şampiyonlar: kullanıcı kazanmadıysa rastgele güçlü takım seç
    const CL_POOL=["Real Madreno","Bayern FC","Eastfield City","FC Internazionale","Juventus FC","Northon City","Mersey Reds","Paris SG"];
    const UEFA_POOL=["Atletico Madreno","SS Lazione","PSV Eindhoven","FC Porto","OL Lyon","Leverkusen FC","Boavista","SL Benfica"];
    const hh=(s)=>{let h=5381;for(let i=0;i<s.length;i++)h=((h<<5)+h)+s.charCodeAt(i);return Math.abs(h);};
    const seed=Date.now()%1000;
    const simClChamp=prevClChamp||CL_POOL[hh("cl"+seed)%CL_POOL.length];
    const simUefaChamp=prevUefaChamp||UEFA_POOL[hh("uefa"+seed)%UEFA_POOL.length];
    // Kullanıcı ASK VEYA AL şampiyonu ise Şampiyonlar Kalkanı oynanır
    const userIsClChamp=simClChamp===clubName;
    const userIsUefaChamp=simUefaChamp===clubName;
    if(userIsClChamp||userIsUefaChamp){
      const skOpp=userIsClChamp?simUefaChamp:simClChamp;
      if(skOpp&&skOpp!==clubName){
        const skStr=90+Math.floor(Math.random()*5);
        allFix.push({w:55,opp:skOpp,home:false,str:skStr,month:"Agustos",comp:"SUPERKUPA",round:"Şampiyonlar Kalkanı"});
      }
    }

    // ── Sezon sonu lig ödemesi (season state henüz güncel) ──
    const endLg=season.league||"1. Lig";
    const endTeams=[...season.teams].filter(t=>t.lg===endLg).sort((a,b)=>b.pts-a.pts);
    const endRankIdx=endTeams.findIndex(t=>t.me);
    const endRank=endRankIdx>=0?endRankIdx+1:10;
    const totalTeams=endTeams.length||19;
    const havuz=endLg==="Elit Lig"?60000:8000;
    const esitPay=Math.round(havuz/totalTeams*0.5);
    const siraPay=Math.round((havuz*0.5)*(totalTeams-endRank+1)/(totalTeams*(totalTeams+1)/2));
    const ligOdeme=esitPay+siraPay;
    updateFinans(ligOdeme,"ligOdeme",`${endLg} Sezon Sonu Ödemesi (${endRank}. sıra)`);
    setTimeout(()=>showToast(`💰 Lig ödemesi: ${ligOdeme>=1000?(ligOdeme/1000).toFixed(1)+"M€":ligOdeme+"K€"} (${endRank}. sıra)`),300);

    // ── Sezon başı maaş gideri (setter dışında hesapla) ──
    const currentSquad=squad; // mevcut closure'dan oku
    const totalSal=currentSquad.reduce((s,p)=>s+(p.sal||0),0);
    if(totalSal>0){
      updateFinans(totalSal,"salary_annual",`Sezon başı kadro maaş gideri (${currentSquad.length} oyuncu)`);
      setTimeout(()=>showToast(`💰 Sezon başı maaş: -${totalSal}K€ bütçeden düşüldü`,3500),600);
    }

    // ── Sezon başı antrenör ücretleri ──
    const hiredCoaches=coaches.filter(c=>c.hired);
    const totalCoachCost=Math.round(hiredCoaches.reduce((s,c)=>s+(c.cost*1000||0),0));
    if(totalCoachCost>0){
      updateFinans(totalCoachCost,"coach_salary",`Sezon başı antrenör ücretleri (${hiredCoaches.length} antrenör)`);
      setTimeout(()=>showToast(`🧑‍🏫 Antrenör ücretleri: -${(totalCoachCost/1000).toFixed(1)}M€`,2500),900);
    }

    // ── Bütçe kontrolü: 2 sezonluk tolerans sistemi ──
    // 1. sezon ekside → uyarı ver, yasak yok
    // 2. sezon ekside (uyarı zaten aktifse) → transfer yasağı + -15 itibar
    // Bütçe artıya geçince yasak/uyarı otomatik kalkar (checkTransferBanLift ile)
    setTimeout(()=>{
      const curBudget=transferBudget+wageBudget;
      if(curBudget<0){
        if(!transferBan.budgetWarning&&!transferBan.active){
          // 1. kez ekside: sadece uyarı, yasak yok
          setTransferBan(prev=>({...prev,budgetWarning:true,warningSeason:newLg}));
          addNews({type:"rival_transfer",player:"⚠️ Bütçe Uyarısı",club:clubName,val:0,
            detail:`⚠️ Bütçe açığı tespit edildi! Gelecek sezon sonuna kadar bütçeyi artıya çevirmezsen transfer yasağı uygulanır.`,
            date:new Date().toLocaleDateString("tr-TR")});
          setTimeout(()=>showToast("⚠️ Bütçe açığı! Gelecek sezon sonuna kadar kapatmazsan transfer yasağı alırsın.",6000),600);
        } else if(transferBan.budgetWarning&&!transferBan.active){
          // 2. kez ekside: artık yasak + itibar cezası
          setTransferBan(prev=>({...prev,active:true,reason:"İki sezon üst üste bütçe açığı",appliedSeason:newLg,budgetWarning:false}));
          updateRep(-15,"Bütçe krizi: transfer yasağı uygulandı",newLg);
          addNews({type:"rival_transfer",player:"⛔ Transfer Yasağı",club:clubName,val:0,
            detail:`⛔ İki sezon üst üste bütçe açığı! ${clubName} transfer yasağı aldı ve 15 itibar puanı kaybetti. Bütçeyi artıya çevirerek yasağı kaldırabilirsin.`,
            date:new Date().toLocaleDateString("tr-TR")});
          setTimeout(()=>showToast("⛔ Transfer yasağı! İki sezon bütçe açığı kapatılamadı. -15 itibar.",6000),600);
        } else if(transferBan.active){
          // Yasak zaten aktif, devam ediyor
          setTimeout(()=>showToast("⚠️ Bütçe hâlâ ekside — transfer yasağı devam ediyor.",4000),600);
        }
      } else if(curBudget>=0&&transferBan.budgetWarning&&!transferBan.active){
        // Bütçe artıya geçti, uyarıyı kaldır
        setTransferBan(prev=>({...prev,budgetWarning:false,warningSeason:""}));
        setTimeout(()=>showToast("✅ Bütçe artıya geçti — uyarı kaldırıldı!",3000),600);
      }
    },1500);

    // ── Sezon state sıfırla ──
    setSeason(prev=>({...prev,
      week:1,played:0,goals:0,conceded:0,wins:0,draws:0,losses:0,league:newLg,
      teams:(()=>{
        const basePts={pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0};
        // SL son 3 (me hariç) → TFF'ye düşer
        const slLen=slTable.length;
        const slRelIds=new Set(slTable.slice(Math.max(0,slLen-3)).filter(t=>!t.me).map(t=>t.n));
        const tffPromoIds=new Set(tffTable.slice(0,3).filter(t=>!t.me).map(t=>t.n));
        const newBudget=(str)=>str>=84?80:str>=78?50:str>=72?30:str>=66?18:str>=60?10:6;
        // İngiltere terfi/düşme (lig ve str güncellenir; puanlar aşağıda sıfırlanır)
        return applyEngSwaps(prev.teams).map(t=>{
          if(t.me) return{...t,...basePts,lg:newLg};
          if(tffPromoIds.has(t.n)){
            const promoStr=Math.max(58,Math.min(67,t.str-5));
            return{...t,...basePts,lg:"Elit Lig",str:promoStr,budget:newBudget(promoStr),spent:0};
          }
          if(slRelIds.has(t.n)){
            const relStr=Math.min(72,Math.max(t.str-3,62));
            return{...t,...basePts,lg:"1. Lig",str:relStr,budget:newBudget(relStr),spent:0};
          }
          // Normal sezon başı: bütçeyi yenile + str bazlı hafif bütçe artışı (önceki satışlardan gelir)
          const sellingIncome=Math.round((t.spent||0)*0.3); // önceki transferlerin yüzde 30'u geri döner
          return{...t,...basePts,budget:newBudget(t.str)+sellingIncome,spent:0};
        });
      })(),
      results:[],fixture:allFix,form:[],rankHistory:[],
      kupaSonuc:{group:kupaGrup,w:0,d:0,l:0,gf:0,ga:0,pts:0,elendi:false,finalci:false,sampiyon:false},
    }));

    // ── Kadro: yaş +1, emeklilik (tek setSquad çağrısı) ──
    const RETIRE_BASE=35;
    // Sözleşmesi biten oyuncular (expiring0) — ayrılma/kalma kararı
    const expiringPlayers=squad.filter(p=>p.ct<=0&&p.st!=="free");
    const departures=[];
    expiringPlayers.forEach(p=>{
      // Yüksek OVR + genç → başka kulüp teklifleri var, ayrılma şansı yüksek
      const depChance=p.ovr>=80?0.75:p.ovr>=72?0.50:p.ovr>=65?0.30:0.15;
      if(Math.random()<depChance){
        departures.push(p);
        addNews({type:"transfer_out",player:p.n,club:clubName,val:p.val||0,
          detail:`📤 Sözleşmesi bitti — ${p.n} (${p.pos}, OVR ${p.ovr}) ${clubName}'den ayrıldı.`,
          date:new Date().toLocaleDateString("tr-TR")});
      }
    });
    if(departures.length>0){
      const names=departures.map(p=>p.n).join(", ");
      setTimeout(()=>showToast(`📤 ${departures.length} oyuncu ayrıldı: ${names}`,5000),800);
      // Maaş tasarrufu + antrenör atamalarını temizle
      departures.forEach(p=>{
        updateFinans(p.sal||20,"salary_remove",`Sözleşme bitti: ${p.n} ayrıldı`);
        removePlayerFromCoaches(p.id);
        rebuildLineupAfterRemove(p.id);
      });
    }
    const departureIds=new Set(departures.map(p=>p.id));

    setSquad(prev=>prev
      .filter(p=>!departureIds.has(p.id)) // ayrılanları çıkar
      .map(p=>{
        const newAge=p.age+1;
        const newCt=Math.max(0,p.ct-1);
        // ct=0 → serbest bırakılacak (listed olarak işaretle), ct=1 → expiring
        let newSt=p.st;
        if(newCt===0&&p.st!=="free"&&p.st!=="expiring0") newSt="expiring0"; // bir sonraki sezon başında serbest
        else if(newCt===1&&(p.st==="contracted")) newSt="expiring";
        return {...p,age:newAge,ct:newCt,st:newSt,
          // Sezon başı: yorgunluk sifirla, sezon istatistiklerini sifirla
          fatigue:0,seasonGoals:0,seasonAssists:0,seasonRatings:[],seasonMatches:0,
          injSev:p.injured>0?p.injSev:0
        };
      })
      .filter(p=>{
        if(p.age<RETIRE_BASE) return true;
        return Math.random()>(( p.age-RETIRE_BASE)*0.25+0.2);
      }));

    // ── DB: yaş +1, emeklilik, yeni gençler ──
    // season.teams snapshot — stale closure'u önle
    const _seasonTeamsSnap=season.teams||[];
    // Altyapıdan mezun/serbest kalanlar — setYouth updater'ının çalışma zamanına bağlı kalmamak için
    // mevcut youth state'inden önceden hesaplanır ve ana setDb akışına (serbest havuz sınırından önce) eklenir
    const _youthReleased=(youth||[])
      .map(p=>({...p,age:p.age+1,youthYear:(p.youthYear||0)+1}))
      .filter(p=>p.youthYear>=3)
      .map(p=>({
        ...p,club:"Serbest",lg:"Serbest",nat:"TUR",ct:0,st:"free",ch:65,
        val:Math.round((p.pot-65)*0.25*10)/10,
        sal:Math.round((30+(p.ovr-50)*4)/10)*10,
      }));
    setDb(prev=>{
      const RETIRE_BASE2=35;
      const aged=prev.map(p=>{
        const newAge=p.age+1;

        // Kulüp gücü: önce season snapshot, yoksa INIT_TEAMS
        const liveTeam=_seasonTeamsSnap.find(t2=>t2.n===p.club);
        const initTeam=INIT_TEAMS.find(t2=>t2.n===p.club);
        const clubStr2=liveTeam?liveTeam.str:initTeam?initTeam.str:p.ovr>=80?75:62;

        // ── Sözleşme: AI kulüp oyuncuları çoğunlukla mevcut kulübüyle uzatır ──
        let newCt=Math.max(0,p.ct-1);
        let newSt=p.st;
        let expired=false;
        if(newCt===0&&p.st!=="free"){
          const isAiClubPlayer=p.club&&p.club!=="Serbest"&&p.club!==clubName;
          // Taban: %78 uzatma (33+ yaş: %60). Kulüp uyumu: kulübün çok üstündeki oyuncu ayrılmaya,
          // kulüp seviyesine uygun oyuncu kalmaya biraz daha meyilli
          let renewP=newAge>=33?0.60:0.78;
          const fitGap=(p.ovr||65)-clubStr2;
          if(fitGap>8) renewP-=0.06; else if(Math.abs(fitGap)<=5) renewP+=0.04;
          renewP=Math.max(0.5,Math.min(0.85,renewP));
          if(isAiClubPlayer&&Math.random()<renewP){
            newCt=1+Math.floor(Math.random()*3);
            newSt="contracted";
          } else {
            newSt="free";
            expired=true;
          }
        }
        else if(newCt===1&&p.st==="contracted") newSt="expiring";
        const coachMult=clubStr2>=88?1.40
          :clubStr2>=82?1.20
          :clubStr2>=75?1.05
          :clubStr2>=68?0.95
          :0.80;
        const youthBonus=newAge<=18?1.20:newAge<=20?1.10:newAge<=22?1.05:1.0;
        const clubFactor=coachMult*youthBonus;

        const gap=Math.max(0,(p.pot||p.ovr||70)-(p.ovr||70));
        let newOvr=p.ovr||70;
        let newVal=p.val||0;
        if(gap>0){
          // devRate: yılda gelişme ihtimali (0-1 arası olacak şekilde ölçeklendirildi)
          const devRate=newAge<=19?0.72:newAge<=21?0.58:newAge<=23?0.42
            :newAge<=25?0.28:newAge<=27?0.16:newAge<=29?0.09
            :newAge<=31?0.04:newAge<=32?0.01:0;
          const gapMult=gap>=20?1.25:gap>=15?1.10:gap>=10?1.0:gap>=6?0.80:gap>=3?0.55:0.30;
          const minChance=gap>=10?0.10:gap>=5?0.05:gap>=2?0.02:0.005;
          const devChance=Math.min(0.88, Math.max(minChance, devRate*gapMult*clubFactor));
          if(Math.random()<devChance){
            newOvr=Math.min(p.pot||70, newOvr+1);
            // 2 OVR: sadece çok genç + büyük gap + elit kulüp
            const doubleChance=newAge<=20&&gap>=15&&clubStr2>=82?0.25:0;
            if(doubleChance>0&&Math.random()<doubleChance){
              newOvr=Math.min(p.pot||70, newOvr+1);
            }
          }
        }
        // Yaşlı oyuncularda OVR düşüşü (33+)
        // Büyük kulüplerde medikal destek sayesinde düşüş biraz daha yavaş
        const declineResist=clubStr2>=82?0.7:1.0;
        if(newAge>=33&&Math.random()<Math.min(0.8,(newAge-32)*0.15*declineResist)){
          newOvr=Math.max(55, newOvr-1);
        }
        // Val güncelle — her sezon yaş + OVR bazlı gerçekçi değer
        {
          const pos2=p.pos||"CM";
          const isGK=pos2==="GK";
          const isDef=["CB","LB","RB","LWB","RWB"].includes(pos2);
          // OVR baz (pozisyona göre ayarlı)
          const ovrBase=newOvr>=94?200:newOvr>=93?175:newOvr>=92?150:newOvr>=91?120:newOvr>=90?95:
                        newOvr>=88?72:newOvr>=86?55:newOvr>=84?42:newOvr>=82?32:newOvr>=80?23:
                        newOvr>=78?16:newOvr>=76?11:newOvr>=74?7:newOvr>=72?4.5:newOvr>=70?3:
                        newOvr>=68?2:newOvr>=65?1.2:newOvr>=62?0.7:0.4;
          const posMult=isGK?0.65:isDef?0.80:1.0;
          // Yaş çarpanı — gerçek pazar gibi peak 23-26, sonra düşüş
          const ageMult=newAge<=20?0.75:newAge<=22?0.90:newAge<=25?1.00:newAge<=27?0.90:
                        newAge<=29?0.75:newAge<=31?0.55:newAge<=33?0.38:newAge<=35?0.25:0.15;
          // Küçük rastgele sapma ±%5 — pazar dalgalanması simülasyonu
          const jitter=0.95+Math.random()*0.10;
          newVal=Math.max(0.1, Math.round(ovrBase*posMult*ageMult*jitter*10)/10);
        }

        return {...p,age:newAge,ovr:newOvr,val:newVal,ct:newCt,st:newSt,
          club:expired?"Serbest":p.club,
          lg:expired?"Serbest":p.lg};
      });
      const retired=[];
      const survived=aged.filter(p=>{
        if(p.age<RETIRE_BASE2) return true;
        const r=Math.random()<((p.age-RETIRE_BASE2)*0.25+0.2);
        if(r) retired.push(p.n);
        return !r;
      });
      const newCount=retired.length>0
        ? Math.max(12, retired.length + 4 + Math.floor(Math.random()*5))  // emeklilerden fazla ekle
        : 10 + Math.floor(Math.random()*5);
      const newYouth=Array.from({length:newCount},()=>genYouthPlayer());
      setTimeout(()=>showToast(
        retired.length>0
          ? `👴 ${retired.length} oyuncu emekli · 🌟 ${newCount} yeni yetenek piyasaya girdi`
          : `🌟 ${newCount} yeni genç yetenek transfer pazarına eklendi`
      ),1200);
      // ── AI Takımlar Free Oyuncuları Transfer Eder ──
      // Serbest kalan oyuncuların büyük çoğunluğunu AI takımlara dağıt
      const allFree=survived.filter(p=>p.st==="free");
      let remainingFree=[...survived.filter(p=>p.st!=="free"),...newYouth];
      
      // Tüm liglerdeki takım isimlerini topla (me olmayan)
      const aiTeamNames=[];
      // teams array'e direkt erişemiyoruz ama club bilgisinden çıkarabiliriz
      // DB'deki contracted oyuncuların club'larından AI takımları bul
      const clubCounts={};
      survived.filter(p=>p.st==="contracted"&&p.club!=="Serbest").forEach(p=>{
        clubCounts[p.club]=(clubCounts[p.club]||0)+1;
      });
      const aiClubs=Object.keys(clubCounts).filter(c=>c&&c!=="Serbest"&&c!=="FC Yildiz");

      // Kulüp str'lerini season.teams'den al
      const clubStr={};
      season.teams.forEach(t=>{ if(t.n&&!t.me) clubStr[t.n]=t.str||65; });

      // Her free oyuncu için AI imzalama şansı — ovr + kulüp itibarına göre
      allFree.forEach(p=>{
        const ageP = p.age>=35?0.25 : p.age>=32?0.60 : 1.0;

        if(Math.random()<0.92*ageP && aiClubs.length>0){
          // OVR 80+ oyuncular sadece str>=70 kulüplere gidebilir (düşük ihtimalle de olsa)
          const eligibleClubs = p.ovr>=80
            ? aiClubs.filter(c=>(clubStr[c]||65)>=70)  // güçlü kulüpler
            : p.ovr>=70
            ? aiClubs.filter(c=>(clubStr[c]||65)>=55)  // orta kademe+
            : aiClubs; // herkes

          if(eligibleClubs.length===0){ remainingFree.push(p); return; }

          // Kulübü ağırlıklı seç: str yükseldikçe seçilme ihtimali artar
          // OVR 80+ için str<50 kulüplere imza atma ihtimali neredeyse sıfır
          const weighted = eligibleClubs.map(c=>{
            const str=clubStr[c]||65;
            let w;
            if(p.ovr>=80){
              w = str>=80?10 : str>=75?6 : str>=70?3 : str>=60?0.3 : 0.02;
            } else if(p.ovr>=70){
              w = str>=75?8 : str>=65?5 : str>=55?2 : 0.5;
            } else {
              w = str>=70?5 : str>=60?4 : str>=50?3 : 1;
            }
            return {c, w};
          });
          const totalW=weighted.reduce((s,x)=>s+x.w,0);
          let r=Math.random()*totalW;
          const pick=weighted.find(x=>{ r-=x.w; return r<=0; })||weighted[weighted.length-1];
          const club=pick.c;
          const clubLg=survived.find(x=>x.club===club)?.lg||"Elit Lig";
          remainingFree.push({...p, club, lg:clubLg, st:"contracted", ct:1+Math.floor(Math.random()*3)});
        } else {
          remainingFree.push(p);
        }
      });
      
      // Altyapıdan serbest kalanlar havuza katılır (sınır kontrolünden önce)
      if(_youthReleased.length>0) remainingFree=[...remainingFree,..._youthReleased];

      // ── AI KADRO DENGESİ: min 18 / en az 2 GK / max 32 ──
      const SQ_MIN=18, SQ_MAX=32, SQ_SOFT=28, GK_MIN=2;
      const aiTeams=INIT_TEAMS.filter(t=>!t.me&&t.n&&t.n!==clubName).map(t=>{
        const live=_seasonTeamsSnap.find(t2=>t2.n===t.n);
        return {n:t.n, lg:t.lg, str:live?.str||t.str||65};
      });
      const sqCount={}, gkCount={};
      aiTeams.forEach(t=>{ sqCount[t.n]=0; gkCount[t.n]=0; });
      remainingFree.forEach(p=>{
        if(p.st!=="free"&&sqCount[p.club]!==undefined){
          sqCount[p.club]++;
          if(p.pos==="GK") gkCount[p.club]++;
        }
      });
      const isFreeP=p=>p.st==="free"||p.club==="Serbest";
      const signTo=(idx,t)=>{
        const p=remainingFree[idx];
        remainingFree[idx]={...p, club:t.n, lg:t.lg, st:"contracted", ct:1+Math.floor(Math.random()*3)};
        sqCount[t.n]++;
        if(p.pos==="GK") gkCount[t.n]++;
      };
      // Takım gücüne en uygun serbest oyuncuyu bul (OVR ≈ str-4); onlyGK ile kaleci
      const bestFreeFor=(t,onlyGK)=>{
        let best=-1, bestD=Infinity;
        const target=t.str-4;
        for(let i=0;i<remainingFree.length;i++){
          const p=remainingFree[i];
          if(!isFreeP(p)) continue;
          if(onlyGK&&p.pos!=="GK") continue;
          // Güçlü oyuncular zayıf kulübe düşmez
          if(p.ovr>=80&&t.str<70) continue;
          const d=Math.abs((p.ovr||60)-target);
          if(d<bestD){ bestD=d; best=i; }
        }
        return best;
      };
      // Önce kalecisi eksik olanlar, sonra en küçük kadrolular
      [...aiTeams].sort((a,b)=>(gkCount[a.n]-gkCount[b.n])||(sqCount[a.n]-sqCount[b.n])).forEach(t=>{
        while(gkCount[t.n]<GK_MIN&&sqCount[t.n]<SQ_MAX){
          const i=bestFreeFor(t,true); if(i<0) break; signTo(i,t);
        }
        while(sqCount[t.n]<SQ_MIN){
          const i=bestFreeFor(t,false); if(i<0) break; signTo(i,t);
        }
      });

      // ── SERBEST HAVUZ SINIRI: sezon başında 50–75 arası ──
      const FREE_MAX=75;
      const freeIdx=[];
      remainingFree.forEach((p,i)=>{ if(isFreeP(p)) freeIdx.push(i); });
      if(freeIdx.length>FREE_MAX){
        const keepN=50+Math.floor(Math.random()*26); // 50–75
        // En iyi / yüksek potansiyelli oyuncular serbest kalır; düşük-orta OVR fazlası dağıtılır
        const score=p=>(p.ovr||60)+(p.age<=21?Math.max(0,(p.pot||0)-(p.ovr||0))*0.5:0);
        freeIdx.sort((a,b)=>score(remainingFree[b])-score(remainingFree[a]));
        const excess=freeIdx.slice(keepN);
        const toRemove=new Set();
        excess.forEach(i=>{
          const p=remainingFree[i];
          // Kadrosu 28'in altında, oyuncunun seviyesine uygun (±12) AI kulüp; en küçük kadro öncelikli
          const cands=aiTeams.filter(t=>sqCount[t.n]<SQ_SOFT&&sqCount[t.n]<SQ_MAX
            &&Math.abs((p.ovr||60)-(t.str-4))<=12&&!(p.ovr>=80&&t.str<70));
          if(cands.length>0){
            cands.sort((a,b)=>sqCount[a.n]-sqCount[b.n]);
            signTo(i,cands[0]);
          } else {
            toRemove.add(i); // uygun kulüp yok → emekli/pasif havuz (DB'den çıkar)
          }
        });
        if(toRemove.size>0) remainingFree=remainingFree.filter((_,i)=>!toRemove.has(i));
      }

      // ── DB DOLULUK KONTROLÜ — 3000-4000 arası tut (ayrı setDb yok, burada birleştir) ──
      const MIN_DB2=3000;
      if(remainingFree.length<MIN_DB2){
        const TARGET_DB2=MIN_DB2+Math.floor(Math.random()*1001);
        const needed=Math.max(0,TARGET_DB2-remainingFree.length);
        const newPlayers=Array.from({length:needed},()=>{
          const p=genFreeAgent();
          return {...p, st:"contracted", club:"Bağımsız", lg:"Bağımsız", ct:1+Math.floor(Math.random()*2)};
        });
        remainingFree=[...remainingFree,...newPlayers];
      }
      return remainingFree;
    });

    // ── Altyapı yenileme — released oyuncular ana setDb'ye eklenir ──
    setYouth(prev=>{
      const aged=prev.map(p=>({...p,age:p.age+1,youthYear:(p.youthYear||0)+1}));
      const released=aged.filter(p=>p.youthYear>=3);
      const kept=aged.filter(p=>p.youthYear<3);
      if(released.length>0){
        // Serbest kalanlar (_youthReleased) yukarıda ana setDb akışına eklendi
        setTimeout(()=>showToast(`🎓 ${released.length} altyapı oyuncusu serbest kaldı, transfer pazarına eklendi`),1800);
      }
      const newCount=2+Math.floor(Math.random()*2)+Math.floor(academyLevel/2); // Lv1:2-3, Lv3:3-4, Lv5:4-5
      const newKids=Array.from({length:newCount},()=>genYouthAltyapi(academyLevel));
      setTimeout(()=>showToast(`⭐ Altyapıya ${newCount} yeni oyuncu keşfedildi${academyLevel>=3?" (Akademi Lv"+academyLevel+")":""}`),2400);
      return [...kept,...newKids];
    });

    setSeasonEndModal(null);
    setRecentlyTransferred(new Set());

    // ── Finans: sezon başında harcama/gelir sayaçları sıfırla ──
    // (transferBudget ve wageBudget sıfırlanmaz — önceki sezondan kalan bakiye devam eder)
    setSpent(0);
    setIncome(0);
    setWageSpent(0);
    setFStadyum(0);
    setFFOrma(0);
    setFYayin(0);
    setFSponsor(0);
    setFLigOdeme(0);
    setFKupaPrim(0);
    setWeeklyLog([]);

    // Pending satışları sezon sonunda tamamla (bir sonraki sezon kaybolmasın)
    if(pendingSquad.length>0){
      const pendingSells=pendingSquad.filter(x=>x.type==="sell");
      pendingSells.forEach(({player:p})=>{
        setSquad(sq=>sq.filter(pl=>pl.id!==p.id));
        removePlayerFromCoaches(p.id);
        rebuildLineupAfterRemove(p.id);
        const sellK=Math.round((p.val||0)*1000);
        if(sellK>0) updateFinans(sellK,"sell",`Satış: ${p.n} (${p.val}M€)`);
        updateFinans(p.sal||20,"salary_remove",`Maaş azaldı: ${p.n}`);
        addNews({type:"transfer_out",player:p.n,club:"FC Yildiz",val:p.val,
          detail:`✅ Sezon sonu satış tamamlandı · ${p.pos} · ${p.ovr} OVR`,
          date:new Date().toLocaleDateString("tr-TR")});
      });
      if(pendingSells.length>0) setTimeout(()=>showToast(`✅ ${pendingSells.length} pending satış sezon sonunda tamamlandı`),600);
    }
    setPendingSquad([]);
    setIncomingOffers([]);
    // currentMonth, season.fixture[0].month'tan türetildiği için ayrıca set etmeye gerek yok
    // altinTopVerildi artık sezon numarasıyla takip edildiğinden manuel sıfırlama gerekmez
    // Bug 8: Sezon geçişinde blockWeeksLeft azalt (süresiz bloke önleme)
    setMgmt(prev=>({
      ...prev,
      blockWeeksLeft:Math.max(0,(prev.blockWeeksLeft||0)-1),
      blockedBudget:(prev.blockWeeksLeft||0)<=1?0:prev.blockedBudget,
      blockReason:(prev.blockWeeksLeft||0)<=1?"":prev.blockReason,
    }));
    setTimeout(()=>showToast(newLg==="Elit Lig"?"🏆 Elit Lig'e yükseldiniz! Yeni sezon başladı!":season.league==="Elit Lig"&&newLg==="1. Lig"?"⬇ TFF 1. Lig'e düştünüz. Yeni sezon başladı.":season.league==="İngiliz 2. Ligi"&&newLg==="İngiliz Ligi"?"🏆 İngiliz Ligi'ne yükseldiniz! Yeni sezon başladı!":season.league==="İngiliz Ligi"&&newLg==="İngiliz 2. Ligi"?"⬇ İngiliz 2. Ligi'ne düştünüz. Yeni sezon başladı.":"⚽ Yeni sezon başladı!"),1500);
  };
  const showToast=(msg)=>{setToast(msg);setTimeout(()=>setToast(null),3000);};

  // ── BAŞLANGIÇ MİGRASYONU — localStorage'daki tüm save'lerdeki fixture'ları düzelt ──
  useEffect(()=>{
    try{
      const SAVES_KEY="fcym_coach_saves";
      const raw=localStorage.getItem(SAVES_KEY);
      if(!raw) return;
      const saves=JSON.parse(raw);
      if(!Array.isArray(saves)) return;
      let changed=false;
      const fixFixture=(f, lg)=>{
        if(!f) return f;
        if(f.sw) return f; // Swiss model Avrupa fikstürü — w zaten takvime göre
        const _is38=["İngiliz Ligi","İspanyol Ligi","İtalyan Ligi"].includes(lg||"");
        // ZTK grup son maçı
        if(f.comp==="ZTK"&&f.round&&f.round.startsWith("Grup")&&(f.w===265||f.w===225||f.w===215))
          return {...f,w:2050,month:"Subat"};
        // ZTK KO
        if(f.comp==="ZTK"&&f.round==="Son 16 — 1. Maç") return {...f,w:2250,month:"Mart"};
        if(f.comp==="ZTK"&&f.round==="Son 16 — 2. Maç") return {...f,w:2430,month:"Mart"};
        if(f.comp==="ZTK"&&f.round==="Çeyrek Final — 1. Maç") return {...f,w:2650,month:"Nisan"};
        if(f.comp==="ZTK"&&f.round==="Çeyrek Final — 2. Maç") return {...f,w:2830,month:"Nisan"};
        if(f.comp==="ZTK"&&f.round==="Yarı Final — 1. Maç") return {...f,w:3050,month:"Mayis"};
        if(f.comp==="ZTK"&&f.round==="Yarı Final — 2. Maç") return {...f,w:3250,month:"Mayis"};
        if(f.comp==="ZTK"&&f.round&&f.round.startsWith("Final")) return {...f,w:3430,month:"Mayis"};
        // CL/UEFA KO — 38 ve 34 haftalık lig için farklı değerler
        if((f.comp==="CL"||f.comp==="UEFA"||f.comp==="CON")&&f.round==="Son 16 — 1. Maç") return {...f,w:_is38?2750:2330,month:"Mart"};
        if((f.comp==="CL"||f.comp==="UEFA"||f.comp==="CON")&&f.round==="Son 16 — 2. Maç") return {...f,w:_is38?2850:2530,month:"Mart"};
        if((f.comp==="CL"||f.comp==="UEFA"||f.comp==="CON")&&f.round==="Çeyrek Final — 1. Maç") return {...f,w:_is38?3050:2730,month:"Nisan"};
        if((f.comp==="CL"||f.comp==="UEFA"||f.comp==="CON")&&f.round==="Çeyrek Final — 2. Maç") return {...f,w:_is38?3150:2920,month:"Nisan"};
        // CL/UEFA YF
        if((f.comp==="CL"||f.comp==="UEFA"||f.comp==="CON")&&f.round==="Yarı Final — 1. Maç") return {...f,w:_is38?3550:3150,month:"Mayis"};
        if((f.comp==="CL"||f.comp==="UEFA"||f.comp==="CON")&&f.round==="Yarı Final — 2. Maç") return {...f,w:_is38?3650:3350,month:"Mayis"};
        // CL/UEFA Final
        if((f.comp==="CL"||f.comp==="UEFA"||f.comp==="CON")&&f.round==="Final") return {...f,w:_is38?3750:3470,month:"Mayis"};
        return f;
      };
      const migratedSaves=saves.map(slot=>{
        if(!slot.data||!slot.data.season||!slot.data.season.fixture) return slot;
        const slotLg=slot.data.season.league||"";
        const oldFix=slot.data.season.fixture;
        const newFix=oldFix.map(f=>fixFixture(f,slotLg));
        // Değişiklik var mı?
        const isDiff=newFix.some((f,i)=>f.w!==oldFix[i].w||f.month!==oldFix[i].month);
        if(!isDiff) return slot;
        changed=true;
        return {...slot,data:{...slot.data,season:{...slot.data.season,fixture:sortFixture(newFix)}}};
      });
      if(changed){
        localStorage.setItem(SAVES_KEY,JSON.stringify(migratedSaves));
        // Eğer şu an oynanan oyun varsa season fixture'ını da güncelle
        setSeason(prev=>{
          if(!prev||!prev.fixture) return prev;
          const prevLg=prev.league||"";
          const newFix=sortFixture(prev.fixture.map(f=>fixFixture(f,prevLg)));
          return {...prev,fixture:newFix};
        });
      }
    }catch(e){ console.warn("[FCY] Migrasyon hatası:",e); }
  },[]); // sadece mount'ta bir kez çalışır
  // Takım antrenörü (analist dahil) varsa maç bonusu ondan gelir; yoksa eski davranış
  const activeCoach=coaches.find(c=>c.hired&&c.type==="team")||coaches.find(c=>c.hired);
  const coachBonus=activeCoach?activeCoach.bonus:0;
  const myTeam=season.teams.find(t=>t.me)||season.teams[2];
  const myLg=season.league||"1. Lig";
  const myRank=[...season.teams].filter(t=>t.lg===myLg).sort((a,b)=>b.pts-a.pts).findIndex(t=>t.me)+1;
  const nextFix=season.fixture[0];
  // Canlı str: rivalAI güncellemelerini ana ekrana da yansıt
  const nextFixLiveStr=nextFix?(season.teams.find(t=>t.n===nextFix.opp)?.str||nextFix.str):70;
  const nextFixLive=nextFix?{...nextFix,str:nextFixLiveStr}:nextFix;

  // ── DERBİ & BÜYÜK MAÇ TESPİTİ ──────────────────────────────
  const DERBY_PAIRS={
    "Galatasaray FC":["Fenerbahce FC","Besiktas FC","Trabzonspor FC"],
    "Fenerbahce FC":["Galatasaray FC","Besiktas FC","Trabzonspor FC"],
    "Besiktas FC":["Galatasaray FC","Fenerbahce FC","Trabzonspor FC"],
    "Trabzonspor FC":["Galatasaray FC","Fenerbahce FC","Besiktas FC"],
    "Basaksehir FC":["Galatasaray FC","Fenerbahce FC","Besiktas FC"],
    "Redford United":["Eastfield City","Mersey Reds","Northon City"],
    "Eastfield City":["Redford United","Mersey Reds","Northon City"],
    "Mersey Reds":["Redford United","Eastfield City","Goodfields FC"],
    "Northon City":["Southgate Hotspur","Redford United","Westbridge FC"],
    "Southgate Hotspur":["Northon City","Westbridge FC"],
    "Westbridge FC":["Northon City","Southgate Hotspur"],
    "Real Madreno":["FC Cataluña","Atletico Madreno"],
    "FC Cataluña":["Real Madreno","Atletico Madreno"],
    "Atletico Madreno":["Real Madreno","FC Cataluña"],
    "FC Internazionale":["AC Milanese","Juventus FC"],
    "AC Milanese":["FC Internazionale","Juventus FC"],
    "Juventus FC":["FC Internazionale","AC Milanese"],
    "Bayern FC":["Dortmund BV","Leipzig RB","Leverkusen FC"],
    "Dortmund BV":["Bayern FC","FC Schalke"],
  };

  const checkIsDerby=(myClub,oppName)=>{
    const rivals=DERBY_PAIRS[myClub]||[];
    if(rivals.includes(oppName)) return true;
    // Şehir derbisi: "Spor" veya benzer kelime içeren aynı şehir takımları
    return false;
  };

  // ── SOYUNMA ODASI OLAYLARI ───────────────────────────────────
  const LOCKER_EVENTS=[
    {id:"tension",prob:0.07,condition:(res)=>res==="L",
     title:"⚡ Soyunma Odası Gerginliği",
     desc:"Maç sonu gerginlik yaşandı. Takım morali düştü.",
     effect:(setSquad)=>setSquad(prev=>prev.map(p=>({...p,moral:Math.max(30,(p.moral||75)-8)})))},
    {id:"captain_talk",prob:0.10,condition:(res)=>res==="L",
     title:"🫡 Kaptan Konuşması",
     desc:"Kaptan takımı topladı, herkes odaklandı.",
     effect:(setSquad)=>setSquad(prev=>prev.map(p=>({...p,moral:Math.min(99,(p.moral||75)+6)})))},
    {id:"derby_boost",prob:0.25,condition:(res,isDerby)=>isDerby&&res==="W",
     title:"🔥 Derbi Coşkusu",
     desc:"Derbi galibiyeti soyunma odasını ateşe verdi!",
     effect:(setSquad)=>setSquad(prev=>prev.map(p=>({...p,moral:Math.min(99,(p.moral||75)+15)})))},
    {id:"young_star",prob:0.04,condition:(_,__,squad)=>squad.some(p=>p.age<=21&&(p.seasonGoals||0)>=3),
     title:"🌟 Genç Yıldız",
     desc:"Genç oyuncu formda, soyunma odasının gözdesine döndü.",
     effect:(setSquad)=>setSquad(prev=>prev.map(p=>p.age<=21?{...p,moral:Math.min(99,(p.moral||75)+10)}:p))},
    {id:"bad_ref",prob:0.08,condition:(res)=>res==="L",
     title:"😤 Hakem Tartışması",
     desc:"Maç sonu hakem kararları tartışıldı.",
     effect:(setSquad)=>setSquad(prev=>prev.map(p=>({...p,moral:Math.max(30,(p.moral||75)-5)})))},
    {id:"comeback_spirit",prob:0.15,condition:(res,_,__,myG,opG)=>res==="W"&&myG>=(opG+2),
     title:"💪 Galip Ruh",
     desc:"Büyük galibiyet soyunma odasını hareketlendirdi!",
     effect:(setSquad)=>setSquad(prev=>prev.map(p=>({...p,moral:Math.min(99,(p.moral||75)+8)})))},
  ];
  // Son tetiklenen locker event'i takip et — aynı event 3 maçta bir çıksın
  const lastLockerEvent=useRef({});



  const handleMatchFinish=(result)=>{
    setMatchOverlay(null);
    const fix=season.fixture[0];
    const score=`${result.myG}-${result.opG}`;

    // ── Derbi tespiti ──
    const isDerbyMatch=checkIsDerby(clubName,fix?.opp||"");

    // ── Derbi öncesi haber (sonraki maç derbi mi?) ──
    const nextFix=season.fixture[1];
    if(nextFix&&checkIsDerby(clubName,nextFix.opp||"")&&!isDerbyMatch){
      setTimeout(()=>showToast(`🔥 DERBİ HAFTASI! Sıradaki rakip: ${nextFix.opp} — Hazır mısın?`,5000),1500);
    }

    // ── Derbi galibiyeti extra itibar ──
    if(isDerbyMatch){
      const derbDelta=result.res==="W"?8:result.res==="D"?2:-4;
      setTimeout(()=>updateRep(derbDelta,`Derbi maçı ${result.res==="W"?"galibiyeti":result.res==="D"?"beraberliği":"mağlubiyeti"}: ${clubName} - ${fix.opp}`,season.league||"1. Lig"),600);
      if(result.res==="W") setTimeout(()=>showToast(`🏆 DERBİ GALİBİYETİ! +${derbDelta} itibar kazandın!`,4000),800);
    }

    // ── Soyunma odası olayı (%20 ihtimalle tetikle, cooldown ile) ──
    if(Math.random()<0.20){
      const played=season.played||0;
      const eligible=LOCKER_EVENTS.filter(ev=>{
        if(!ev.condition(result.res,isDerbyMatch,squad,result.myG,result.opG)) return false;
        const lastPlayed=lastLockerEvent.current[ev.id]||0;
        return (played-lastPlayed)>=3; // Aynı event en erken 3 maçta bir
      });
      if(eligible.length>0){
        const ev=eligible[Math.floor(Math.random()*eligible.length)];
        lastLockerEvent.current[ev.id]=played;
        setTimeout(()=>{
          ev.effect(setSquad);
          showToast(`${ev.title}: ${ev.desc}`,4000);
          addNews({type:"match",player:ev.title,club:clubName,val:0,
            detail:ev.desc,date:new Date().toLocaleDateString("tr-TR")});
        },2000);
      }
    }

    setSeason(prev=>{
      // Diğer liglerin bu haftaki maçlarını simüle et
      const simWeek=(teams,myLg,myOpp,myLgCap)=>{
        const LIG_MAX={"1. Lig":38,"Elit Lig":34,"İngiliz Ligi":38,"İspanyol Ligi":38,"Alman Ligi":34,"İtalyan Ligi":38,"Fransız Ligi":34,"Hollanda Ligi":34,"Portekiz Ligi":34,"İngiliz 2. Ligi":46};
        // updated: her takımın kopyasını index ile tut
        const updated=teams.map(t=>({...t}));
        const idxOf=(name)=>updated.findIndex(t=>t.n===name);
        const isZtkWeek=myOpp==="__ZTK__";
        const isEuroWeek=myOpp==="__EURO__";
        const weekSeed=prev.played||0;
        const deterShuffle=(arr,seed)=>{
          const a=[...arr];
          for(let i=a.length-1;i>0;i--){const j=((seed*1664525+1013904223+i*22695477)>>>0)%(i+1);[a[i],a[j]]=[a[j],a[i]];}
          return a;
        };
        const simMatch=(aIdx,bIdx,seed)=>{
          if(aIdx<0||bIdx<0) return;
          const a=updated[aIdx], b=updated[bIdx];
          if(a.me||b.me) return; // kullanıcı takımına ASLA dokunma
          const aStr=a.str||65, bStr=b.str||65, total=aStr+bStr;
          const rng=((seed*1664525+a.n.charCodeAt(0)*22695477+b.n.charCodeAt(0)*6364136)>>>0)/4294967296;
          const rng2=((seed*6364136+aIdx*1664525)>>>0)/4294967296;
          const strDiff=aStr-bStr; // pozitif → A güçlü
          const baseWin=(aStr/total)*100;
          // Güç farkı belirleyici: coeff 1.8 → güçlü takımlar baskın sıralama yapar
          const diffBonus=strDiff*1.8;
          const aWinRaw=Math.max(4,Math.min(88,baseWin+diffBonus));
          // Beraberlik: eşit takımlarda max %20, fark büyüdükçe hızla düşer
          const drawChance=Math.max(4,16-Math.abs(strDiff)*0.6);
          const aWinChance=Math.min(aWinRaw, 100-drawChance-4);
          let aRes,bRes;
          if(rng*100<aWinChance){aRes="W";bRes="L";}
          else if(rng*100<aWinChance+drawChance){aRes="D";bRes="D";}
          else{aRes="L";bRes="W";}
          // Gerçekçi gol simülasyonu: ayrı seed'ler, daha yüksek skorlar
          const rng3=((seed*22695477+aIdx*6364136+bIdx*1664525+1)>>>0)/4294967296;
          const rng4=((seed*6364136+bIdx*22695477+aIdx*1664525+2)>>>0)/4294967296;
          const strRatio=Math.max(0.5,Math.min(2.0,aStr/(bStr||65)));
          // Galibiyet: 1-4 gol, güçlü takım daha fazla atar
          const aAttack=aRes==="W"?1+Math.floor(rng2*2+strRatio*0.8):aRes==="D"?Math.floor(rng2*2)+1:Math.floor(rng3*2);
          const bAttack=bRes==="W"?1+Math.floor(rng3*2+1/strRatio*0.8):bRes==="D"?aAttack:Math.floor(rng4*2);
          const aGf=Math.max(0,Math.min(8,aAttack));
          const bGf=Math.max(0,Math.min(8,aRes==="D"?aGf:bAttack));
          updated[aIdx]={...a,pts:a.pts+(aRes==="W"?3:aRes==="D"?1:0),w:a.w+(aRes==="W"?1:0),d:a.d+(aRes==="D"?1:0),l:a.l+(aRes==="L"?1:0),gf:a.gf+aGf,ga:a.ga+bGf,gd:a.gd+aGf-bGf};
          updated[bIdx]={...b,pts:b.pts+(bRes==="W"?3:bRes==="D"?1:0),w:b.w+(bRes==="W"?1:0),d:b.d+(bRes==="D"?1:0),l:b.l+(bRes==="L"?1:0),gf:b.gf+bGf,ga:b.ga+aGf,gd:b.gd+bGf-aGf};
        };
        const ligs=["1. Lig","Elit Lig","İngiliz Ligi","İspanyol Ligi","Alman Ligi","İtalyan Ligi","Fransız Ligi","Hollanda Ligi","Portekiz Ligi","İngiliz 2. Ligi"];
        ligs.forEach(lg=>{
          const maxGames=LIG_MAX[lg]||34;
          // Kullanıcının ligi için özel işlem
          if(lg===myLg){
            // ZTK/Avrupa haftasında kullanıcı oynamaz ama diğer lig takımları oynar
            // DİKKAT: Diğer takımların maç sayısı kullanıcının lig maç sayısını geçemez
            const oppToExclude=(isZtkWeek||isEuroWeek)?null:myOpp;
            // capForOthers: kullanıcının lig maç sayısı referans alınır (Kupa/UEFA maçları saymaz)
            const capForOthers=(myLgCap!==undefined)?myLgCap:maxGames;
            const eligibleIdx=updated
              .map((t,i)=>({t,i}))
              .filter(({t})=>t.lg===lg&&!t.me&&t.n!==oppToExclude&&(t.w+t.d+t.l)<capForOthers)
              .map(({i})=>i);
            let pool=[...deterShuffle(eligibleIdx, weekSeed+lg.charCodeAt(0))];
            // Tek sayıda takım: en az maç oynayan kalmalı, en çok oynayan çıkar
            // Beraberlikte: shuffle'ın sonuna düşeni çıkar (her hafta farklı)
            if(pool.length%2!==0){
              const maxPlayed=Math.max(...pool.map(i=>updated[i].w+updated[i].d+updated[i].l));
              // pool sonundan ilk maxPlayed'i bul (shuffle her hafta farklı sıra → farklı takım)
              let removeIdx=-1;
              for(let k=pool.length-1;k>=0;k--){
                if((updated[pool[k]].w+updated[pool[k]].d+updated[pool[k]].l)===maxPlayed){removeIdx=k;break;}
              }
              if(removeIdx>=0) pool.splice(removeIdx,1);
              else pool=pool.slice(0,pool.length-1);
            }
            for(let i=0;i+1<pool.length;i+=2) simMatch(pool[i],pool[i+1],weekSeed+i);
            return;
          }
          // Diğer ligler: kullanıcının lig ilerleme oranıyla orantılı ilerle
          // Kullanıcı kendi liginde %X oynamışsa bu lig de maxGames*%X kadar oynasın
          const userMax=LIG_MAX[myLg]||34;
          const userRatio=(myLgCap!==undefined)?myLgCap/userMax:1;
          const otherLigCap=Math.round(maxGames*userRatio);
          const eligibleIdx=updated
            .map((t,i)=>({t,i}))
            .filter(({t})=>t.lg===lg&&!t.me&&(t.w+t.d+t.l)<otherLigCap)
            .map(({i})=>i);
          if(eligibleIdx.length<2) return;
          let pool=[...deterShuffle(eligibleIdx, weekSeed+lg.charCodeAt(0))];
          if(pool.length%2!==0) pool=pool.slice(0,pool.length-1);
          for(let i=0;i+1<pool.length;i+=2) simMatch(pool[i],pool[i+1],weekSeed+i);
        });
        return updated;
      };
      const curLgForSim=prev.league||"1. Lig";
      const isEuroFix=fix.comp==="CL"||fix.comp==="UEFA"||fix.comp==="CON";
      const KNOWN_LIG_COMPS=["SL","TFF1","İngiliz Ligi","İspanyol Ligi","Alman Ligi","İtalyan Ligi","Fransız Ligi","Hollanda Ligi","Portekiz Ligi","İngiliz 2. Ligi"];
      const isLeagueFix=KNOWN_LIG_COMPS.includes(fix.comp)||(!["ZTK","HAZ","CL","UEFA","CON","SUPERKUPA"].includes(fix.comp)&&!isEuroFix);
      // Kullanıcının lig maç sayısı (Kupa/HAZ/CL/UEFA hariç) — bu maçtan sonraki değer
      const myLgPlayedSoFar=prev.results.filter(r=>!["ZTK","HAZ","CL","UEFA","CON","SUPERKUPA"].includes(r.comp)).length;
      const myLgCap=isLeagueFix?myLgPlayedSoFar+1:myLgPlayedSoFar;
      const newTeams0=prev.teams.map(t=>{
        if(t.me) return isLeagueFix?{...t,pts:t.pts+(result.res==="W"?3:result.res==="D"?1:0),
          w:t.w+(result.res==="W"?1:0),d:t.d+(result.res==="D"?1:0),l:t.l+(result.res==="L"?1:0),
          gf:t.gf+result.myG,ga:t.ga+result.opG,gd:t.gd+result.myG-result.opG}:t;
        if(t.n===fix.opp&&!t.me&&isLeagueFix){
          const or=result.res==="W"?"L":result.res==="L"?"W":"D";
          return{...t,pts:t.pts+(or==="W"?3:or==="D"?1:0),
            w:t.w+(or==="W"?1:0),d:t.d+(or==="D"?1:0),l:t.l+(or==="L"?1:0),
            gf:t.gf+result.opG,ga:t.ga+result.myG,gd:t.gd+result.opG-result.myG};
        }
        return t;
      });
      // HAZ ve ZTK haftasında hem TFF1 hem SL durur; CL/UEFA haftasında lig devam eder
      const newTeams1=(fix.comp==="HAZ"||fix.comp==="SUPERKUPA")
        ? newTeams0  // Hazırlık/Şampiyonlar Kalkanı: lig simülasyonu yok
        : (fix.comp==="ZTK")
          ? simWeek(newTeams0,curLgForSim,"__ZTK__",myLgCap)
          : simWeek(newTeams0,curLgForSim,isEuroFix?"__EURO__":fix.opp,myLgCap);

      // ── CATCH-UP: Kullanıcı liginde eksik maçı olan takımları eşitle ──
      // myLgCap kadar maç oynamış olması gereken takımları bul, eksikse maç simüle et
      const newTeams=(()=>{
        if(fix.comp==="HAZ"||fix.comp==="SUPERKUPA") return newTeams1; // Hazırlık/Kalkan haftasında dokunma
        const lgTeams=newTeams1.map((t,i)=>({t,i})).filter(({t})=>t.lg===curLgForSim&&!t.me);
        // Referans: myLgCap (bu maçtan sonra kullanıcının sahip olması gereken lig maç sayısı)
        const behind=lgTeams.filter(({t})=>(t.w+t.d+t.l)<myLgCap);
        if(behind.length===0) return newTeams1;
        const catchUp=[...newTeams1];
        // Eksik takımları ikişerli eşleştirip maç simüle et
        const rng=(seed,n)=>((seed*1664525+1013904223)>>>0)%n;
        let seed=myLgCap*997+behind.length*31;
        const shuffled=[...behind].sort(()=>rng(seed++,3)-1);
        for(let i=0;i+1<shuffled.length;i+=2){
          const ai=shuffled[i].i, bi=shuffled[i+1].i;
          const a=catchUp[ai], b=catchUp[bi];
          if(a.me||b.me) continue;
          const aStr=a.str||65, bStr=b.str||65, total=aStr+bStr;
          const r1=((seed*1664525+a.n.charCodeAt(0)*22695477)>>>0)/4294967296; seed++;
          const r2=((seed*6364136+ai*1664525)>>>0)/4294967296; seed++;
          const strDiffC=aStr-bStr;
          const aWin=Math.max(4,Math.min(88,(aStr/total)*100+strDiffC*1.8));
          const draw=Math.max(4,16-Math.abs(strDiffC)*0.6);
          let aRes,bRes;
          if(r1*100<aWin){aRes="W";bRes="L";}
          else if(r1*100<aWin+draw){aRes="D";bRes="D";}
          else{aRes="L";bRes="W";}
          // Euro catchUp gerçekçi gol
          const r3e=((seed*22695477+ai*6364136+1)>>>0)/4294967296;
          const r4e=((seed*6364136+bi*22695477+2)>>>0)/4294967296;
          const srE=Math.max(0.5,Math.min(2.0,aStr/(bStr||65)));
          const aGfR=aRes==="W"?1+Math.floor(r2*2+srE*0.8):aRes==="D"?Math.floor(r2*2)+1:Math.floor(r3e*2);
          const bGfR=bRes==="W"?1+Math.floor(r3e*2+(1/srE)*0.8):bRes==="D"?aGfR:Math.floor(r4e*2);
          const aGf=Math.max(0,Math.min(7,aGfR));
          const bGf=Math.max(0,Math.min(7,aRes==="D"?aGf:bGfR));
          catchUp[ai]={...a,pts:a.pts+(aRes==="W"?3:aRes==="D"?1:0),w:a.w+(aRes==="W"?1:0),d:a.d+(aRes==="D"?1:0),l:a.l+(aRes==="L"?1:0),gf:a.gf+aGf,ga:a.ga+bGf,gd:a.gd+aGf-bGf};
          catchUp[bi]={...b,pts:b.pts+(bRes==="W"?3:bRes==="D"?1:0),w:b.w+(bRes==="W"?1:0),d:b.d+(bRes==="D"?1:0),l:b.l+(bRes==="L"?1:0),gf:b.gf+bGf,ga:b.ga+aGf,gd:b.gd+bGf-aGf};
        }
        // Tek kalan varsa (tek sayı): ona da tek maç simüle et (vs hayali rakip)
        if(shuffled.length%2!==0){
          const lone=shuffled[shuffled.length-1];
          const ti=lone.i; const t=catchUp[ti];
          if(!t.me){
            const r1=((seed*1664525+t.n.charCodeAt(0)*22695477)>>>0)/4294967296; seed++;
            const r2=((seed*6364136)>>>0)/4294967296; seed++;
            const win=0.45, draw=0.22;
            let res;
            if(r1<win) res="W"; else if(r1<win+draw) res="D"; else res="L";
            const gf=res==="W"?1+Math.floor(r2*3):Math.floor(r2*2);
            const ga=res==="L"?1+Math.floor(r2*3):Math.floor(r2*2);
            catchUp[ti]={...t,pts:t.pts+(res==="W"?3:res==="D"?1:0),w:t.w+(res==="W"?1:0),d:t.d+(res==="D"?1:0),l:t.l+(res==="L"?1:0),gf:t.gf+gf,ga:t.ga+ga,gd:t.gd+gf-ga};
          }
        }
        return catchUp;
      })();
      const isZtkGroup=fix.comp==="ZTK"&&fix.round&&fix.round.startsWith("Grup");
      const prevKupa=prev.kupaSonuc||{group:"",w:0,d:0,l:0,gf:0,ga:0,pts:0};
      const newKupa=isZtkGroup?{...prevKupa,w:prevKupa.w+(result.res==="W"?1:0),d:prevKupa.d+(result.res==="D"?1:0),l:prevKupa.l+(result.res==="L"?1:0),gf:prevKupa.gf+result.myG,ga:prevKupa.ga+result.opG,pts:prevKupa.pts+(result.res==="W"?3:result.res==="D"?1:0)}:prevKupa;

      // extraFixture: hem CL/UEFA hem ZTK için kullanılır — CL bloğundan önce tanımlanmalı
      let extraFixture=[];
      let penData=null; // Penaltı bilgisi — maç sonucuna eklenir
      // Belirli bir ay için bir sonraki kullanılabilir w değeri
      // Hem fixture hem results'a bakarak çakışmayı önle
      const nextWForMonth=(month,base)=>{
        const usedFix=prev.fixture
          .filter(f=>f.month===month&&(f.comp==="ZTK"||f.comp==="CL"||f.comp==="UEFA"||f.comp==="CON"))
          .map(f=>f.w||0);
        const usedRes=prev.results
          .filter(r=>r.month===month&&(r.comp==="ZTK"||r.comp==="CL"||r.comp==="UEFA"||r.comp==="CON"))
          .map(r=>r.w||0);
        const allUsed=[...usedFix,...usedRes];
        return allUsed.length>0?Math.max(base,...allUsed.map(w=>w+1)):base;
      };

      // ── AVRUPA (SWISS MODEL) — kullanıcının Avrupa maçı ─────────
      // Lig aşaması primi + eleme turunda toplam eşitse penaltı; tablo ilerletme aşağıda (upd sonrası)
      let euroUM=null;
      if(isEuroFix&&fix.sw){
        const comp=fix.comp;
        const meta=EURO_META[comp]||EURO_META.UEFA;
        const prim=EURO_PRIM[comp]||EURO_PRIM.UEFA;
        const fmtEuro=(v)=>v>=1000?(v/1000).toFixed(1)+"M€":v+"K€";
        if(fix.md){
          euroUM={comp,md:fix.md,myG:result.myG,opG:result.opG};
          if(result.res==="W"||result.res==="D"){
            const v=result.res==="W"?prim.lig_galibiyet:prim.lig_beraberlik;
            setTimeout(()=>{
              updateFinans(v,"kupaPrim",`${meta.icon} ${meta.name} Lig Aşaması ${result.res==="W"?"Galibiyeti":"Beraberliği"} (+${fmtEuro(v)})`);
              showToast(`💰 ${meta.icon} ${meta.name} ${result.res==="W"?"galibiyet":"beraberlik"} primi: +${fmtEuro(v)}`,2500);
            },800);
          }
        } else if(fix.ko){
          euroUM={comp,ko:fix.ko,leg:fix.leg||0,myG:result.myG,opG:result.opG};
          const tblNow=prev[EURO_TABLE_KEY[comp]];
          const meT=tblNow&&tblNow.teams.find(t=>t.me);
          const tie=meT&&(tblNow.ko[fix.ko]||[]).find(t=>t.a===meT.n||t.b===meT.n);
          const decisive=fix.ko==="fin"||(fix.leg||0)===1;
          if(tie&&decisive){
            let myAgg=result.myG, opAgg=result.opG;
            if(fix.ko!=="fin"){const l0=tie.legs[0];if(l0&&l0.hg!==null){const h=l0.h===meT.n;myAgg+=h?l0.hg:l0.ag;opAgg+=h?l0.ag:l0.hg;}}
            if(myAgg===opAgg){
              const oppT=tblNow.teams.find(t=>t.n===fix.opp)||{str:fix.str||75};
              const r=euroRng(euroHash(tblNow.seed+":upen:"+fix.ko+":"+prev.played))();
              const won=r<0.5+((meT.str||70)-(oppT.str||70))*0.008;
              const wp=4+Math.floor(r*10)%2, lp=Math.max(2,wp-1-Math.floor(r*100)%2);
              penData={won,my:won?wp:lp,op:won?lp:wp};
              euroUM.penWon=won;
              setTimeout(()=>showToast(`⚽ ${fix.ko==="fin"?"Final":"Toplamda"} eşitlik! Penaltılar: ${won?"🎉 Kazandık":"😔 Kaybettik"} (${penData.my}-${penData.op})`,4000),300);
            }
          }
        }
      }
      const prevZtkPlayed=prev.results.filter(r=>r.comp==="ZTK").length;
      const prevZtkGroupPlayed=prev.results.filter(r=>r.comp==="ZTK"&&r.round&&r.round.startsWith("Grup")).length;
      // Penaltı simülasyonu: str farkına göre ağırlıklı random
      const simPenalties=(myStr,oppStr,seed)=>{
        const myProb=0.35+(myStr/(myStr+oppStr))*0.30;
        const won=((seed*1664525+1013904223)>>>0)/4294967296 < myProb;
        const myPens=won?(Math.floor(((seed*22695477)>>>0)%3)+4):(Math.floor(((seed*22695477)>>>0)%3)+3);
        const opPens=won?(myPens-1-Math.floor(((seed*6364136)>>>0)%2)):(myPens+1+Math.floor(((seed*6364136)>>>0)%2));
        return {won, myPens:Math.max(3,Math.min(5,myPens)), opPens:Math.max(3,Math.min(5,opPens))};
      };

      const isLastZtk=fix.comp==="ZTK"&&fix.round&&fix.round.startsWith("Grup")&&prevZtkGroupPlayed===5; // 6. grup maçı
      const isS16Match=fix.comp==="ZTK"&&fix.round&&fix.round.startsWith("Son 16");
      const isQFMatch =fix.comp==="ZTK"&&fix.round&&fix.round.startsWith("Çeyrek");
      const isSFMatch =fix.comp==="ZTK"&&fix.round&&fix.round.startsWith("Yarı Final");
      const isFinalMatch=fix.comp==="ZTK"&&fix.round&&fix.round.startsWith("Final");
      // ztkWonFinal: Final maçı kazanıldı mı? (her iki isFinalMatch bloğu da erişebilsin)
      const _finalPenSeedOuter=result.myG*29+result.opG*31+107; // prev.played burada erişilemez
      const _finalPenOuter=isFinalMatch&&result.res==="D"?simPenalties(fix.str||78,fix.str||78,_finalPenSeedOuter):null;
      const ztkWonFinal=isFinalMatch&&(result.res==="W"||(result.res==="D"&&_finalPenOuter!=null&&_finalPenOuter.won===true));

      // Yardımcı: ZTK çift maç sonucu — iki maçtaki gol toplamına göre kazanan
      const ztkTwoLegResult=(r1,r2)=>{
        const parseGoals=(r)=>{
          if(r.myG!=null&&r.opG!=null) return {myG:r.myG,opG:r.opG};
          if(r.s){const p=r.s.split("-");return {myG:parseInt(p[0])||0,opG:parseInt(p[1])||0};}
          return {myG:0,opG:0};
        };
        const g1=parseGoals(r1);
        const g2=parseGoals(r2);
        const myTotal=g1.myG+g2.myG;
        const opTotal=g1.opG+g2.opG;
        if(myTotal>opTotal) return "W";
        if(myTotal<opTotal) return "L";
        return "D"; // Eşitlik → penaltılara gidilecek
      };

      // Rakip gücü hesapla
      const getRoundStr=(round,league)=>{
        if(league==="1. Lig"){
          if(round.startsWith("Son 16"))    return 68+Math.floor(Math.random()*6);
          if(round.startsWith("Çeyrek"))    return 72+Math.floor(Math.random()*6);
          if(round.startsWith("Yarı Final"))return 76+Math.floor(Math.random()*6);
          if(round.startsWith("Final"))     return 78+Math.floor(Math.random()*8);
        } else {
          if(round.startsWith("Son 16"))    return 82+Math.floor(Math.random()*6);
          if(round.startsWith("Çeyrek"))    return 84+Math.floor(Math.random()*6);
          if(round.startsWith("Yarı Final"))return 86+Math.floor(Math.random()*6);
          if(round.startsWith("Final"))     return 88+Math.floor(Math.random()*8);
        }
        return 70;
      };

      const tff1Opps={
        "Son 16":    ["Sivasspor FC","Antalyaspor FC","Kasimpasa FC","Rizespor FC","Konyaspor FC","Samsunspor FC","Hatayspor FC","Pendikspor FC"],
        "Çeyrek":    ["Galatasaray FC","Fenerbahce FC","Trabzonspor FC","Basaksehir FC","Besiktas FC","Konyaspor FC","Samsunspor FC","Alanyaspor FC"],
        "Yarı Final":["Fenerbahce FC","Besiktas FC","Trabzonspor FC","Basaksehir FC"],
        "Final":     ["Galatasaray FC","Fenerbahce FC","Besiktas FC","Trabzonspor FC","Basaksehir FC"],
      };
      const slOpps={
        "Son 16":    ["Sivasspor FC","Alanyaspor FC","Hatayspor FC","Kayserispor FC","Antalyaspor FC","Kasimpasa FC","Rizespor FC","Pendikspor FC"],
        "Çeyrek":    ["Galatasaray FC","Fenerbahce FC","Besiktas FC","Trabzonspor FC","Basaksehir FC","Kasimpasa FC","Antalyaspor FC","Konyaspor FC"],
        "Yarı Final":["Fenerbahce FC","Besiktas FC","Trabzonspor FC","Basaksehir FC"],
        "Final":     ["Galatasaray FC","Fenerbahce FC","Besiktas FC","Trabzonspor FC","Basaksehir FC"],
      };

      const pickOpp=(round,league,seed,exclude=[])=>{
        const pool=((league==="1. Lig"?tff1Opps:slOpps)[round]||tff1Opps["Final"])
          .filter(o=>!exclude.includes(o)&&o!==clubName); // kullanıcı takımıyla asla eşleşme
        const fallback=((league==="1. Lig"?tff1Opps:slOpps)[round]||tff1Opps["Final"])
          .filter(o=>o!==clubName&&!exclude.includes(o));
        const chosen=pool.length>0?pool:fallback.length>0?fallback:["Galatasaray FC"];
        return chosen[Math.abs(seed)%chosen.length];
      };

      // Önceki ZTK rakiplerini topla (tekrar seçilmesin) — grup rakipleri dahil
      const prevZtkOpps=[
        ...new Set([
          ...prev.results.filter(r=>r.comp==="ZTK").map(r=>r.opp),
          ...prev.fixture.filter(f=>f.comp==="ZTK"&&f.round&&f.round.startsWith("Grup")).map(f=>f.opp)
        ])
      ];

      // ── GRUP AŞAMASI BİTTİ ──────────────────────────────────────
      let ztkGroupQualified=false; // prim bloğundan da erişilebilsin
      if(isLastZtk){
        const ztkOpps=(prev.league==="1. Lig"
          ?["Kayserispor FC","Bucaspor FC","Ankaragucu FC","Alanyaspor FC","Rizespor FC"]
          :["Sivasspor FC","Kayserispor FC","Antalyaspor FC","Samsunspor FC","Pendikspor FC"])
          .filter(o=>o!==clubName).slice(0,3);
        // Rakip satırları — kullanıcının gerçek maç sonuçlarını yansıt
        const ztkOppStats=ztkOpps.map(o=>({n:o,w:0,d:0,l:0,gf:0,ga:0}));
        const ztkGroupRes=prev.results.filter(r=>r.comp==="ZTK"&&r.round&&r.round.startsWith("Grup"));
        const userOppIdx6=[0,1,2,0,1,2];
        const sideMatchups6=[[1,2],[0,2],[0,1],[1,2],[0,2],[0,1]];
        for(let t=0;t<6;t++){
          // Kullanıcının o turdaki rakibi
          const myOppIdx=userOppIdx6[t];
          const myOpp=ztkOppStats[myOppIdx];
          const myResult=ztkGroupRes[t];
          if(myOpp&&myResult){
            const res=myResult.r;
            if(res==="W"){myOpp.l++;myOpp.ga+=myResult.myG;myOpp.gf+=myResult.opG;}
            else if(res==="D"){myOpp.d++;myOpp.ga+=myResult.myG;myOpp.gf+=myResult.opG;}
            else{myOpp.w++;myOpp.ga+=myResult.myG;myOpp.gf+=myResult.opG;}
          }
          // Diğer 2 rakip
          const [ai,bi]=sideMatchups6[t];
          const a=ztkOppStats[ai]; const b=ztkOppStats[bi];
          if(!a||!b) continue;
          const seed=(a.n.charCodeAt(0)*31+b.n.charCodeAt(0)*17+t*13)%100;
          if(seed<38){a.w++;a.gf+=2;a.ga+=seed%2;b.l++;b.ga+=2;b.gf+=seed%2;}
          else if(seed<62){a.d++;b.d++;a.gf+=1;a.ga+=1;b.gf+=1;b.ga+=1;}
          else{b.w++;b.gf+=2;b.ga+=seed%2;a.l++;a.ga+=2;a.gf+=seed%2;}
        }
        const ztkOppRows=ztkOppStats.map(o=>({...o,pts:o.w*3+o.d,gd:o.gf-o.ga}));
        const myGd=newKupa.gf-newKupa.ga;
        const myRow={n:clubName,pts:newKupa.pts,gd:myGd};
        // Tablo sıralaması: puan → averaj (tablo ile birebir aynı)
        const ztkTable=[myRow,...ztkOppRows].sort((a,b)=>b.pts-a.pts||b.gd-a.gd);
        const myRank=ztkTable.findIndex(r=>r.n===clubName);
        const qualified=myRank<=1; // sadece 1. ve 2. çıkar
        ztkGroupQualified=qualified;
        if(qualified){
          const seed=(newKupa.pts*17+prevZtkPlayed*7+43);
          const opp=pickOpp("Son 16",prev.league,seed,prevZtkOpps);
          const str=getRoundStr("Son 16",prev.league);
          extraFixture=[
            {w:2250,opp,home:true, str,month:"Mart", comp:"ZTK",round:"Son 16 — 1. Maç"},
            {w:2430,opp,home:false,str,month:"Mart", comp:"ZTK",round:"Son 16 — 2. Maç"},
          ];
          setTimeout(()=>showToast(`🏆 Kupa Son 16! ${opp} ile eşleştin`,3000),500);
          addNews({type:"match",player:"Kupa",club:opp,val:0,detail:`🏆 Son 16: ${opp} ile eşleştiniz`,date:new Date().toLocaleDateString("tr-TR")});
        } else {
          setSeason(p=>({...p,kupaSonuc:{...p.kupaSonuc,elendi:true}}));
          setTimeout(()=>showToast("❌ Kupa grup aşamasından elendинiz",3000),500);
        }
      }

      // ── SON 16 2. MAÇI BİTTİ ────────────────────────────────────
      if(isS16Match&&fix.round.includes("2. Maç")){
        const ztkRes=prev.results.filter(r=>r.comp==="ZTK"&&r.round&&r.round.startsWith("Son 16"));
        const r1=ztkRes[ztkRes.length-1]||{myG:0,opG:0};
        const r2=result;
        const twoLeg=ztkTwoLegResult(r1,r2);
        let advanced=twoLeg==="W";
        let penMsg="";
        if(twoLeg==="D"){
          const penSeed=prev.played*41+result.myG*13+result.opG*7+53;
          const pen=simPenalties(fix.str||70,fix.str||70,penSeed);
          advanced=pen.won;
          penMsg=` (pen. ${pen.myPens}-${pen.opPens})`;
          setTimeout(()=>showToast(`⚽ Eşitlik! Penaltılar: ${pen.won?"🎉 Kazandık":"😔 Kaybettik"} ${pen.myPens}-${pen.opPens}`,4000),300);
        }
        if(advanced){
          const seed=prev.played*31+result.myG*7+result.opG*13+61;
          const opp=pickOpp("Çeyrek",prev.league,seed,prevZtkOpps);
          const str=getRoundStr("Çeyrek",prev.league);
          extraFixture=[
            {w:2650,opp,home:false,str,month:"Nisan",comp:"ZTK",round:"Çeyrek Final — 1. Maç"},
            {w:2830,opp,home:true, str,month:"Nisan",comp:"ZTK",round:"Çeyrek Final — 2. Maç"},
          ];
          setTimeout(()=>showToast(`🏆 Çeyrek Finale çıktınız! ${opp} ile eşleştiniz`,3000),penMsg?4500:500);
          addNews({type:"match",player:"Kupa",club:opp,val:0,detail:`🏆 Çeyrek Final: ${opp} ile${penMsg}`,date:new Date().toLocaleDateString("tr-TR")});
        } else {
          setTimeout(()=>showToast(`❌ Kupa Son 16'da elendинiz${penMsg}`,3000),penMsg?4500:500);
          addNews({type:"match",player:"Kupa",club:fix.opp,val:0,detail:`❌ Son 16'da ${fix.opp}'e elendik${penMsg}`,date:new Date().toLocaleDateString("tr-TR")});
          setSeason(p=>({...p,kupaSonuc:{...p.kupaSonuc,elendi:true}}));
        }
      }

      // ── ÇEYREK FİNAL 2. MAÇI BİTTİ ─────────────────────────────
      if(isQFMatch&&fix.round.includes("2. Maç")){
        const ztkRes=prev.results.filter(r=>r.comp==="ZTK"&&r.round&&r.round.startsWith("Çeyrek"));
        const r1=ztkRes[ztkRes.length-1]||{myG:0,opG:0};
        const r2=result;
        const twoLeg=ztkTwoLegResult(r1,r2);
        let advanced=twoLeg==="W";
        let penMsg="";
        if(twoLeg==="D"){
          const penSeed=prev.played*53+result.myG*11+result.opG*17+67;
          const pen=simPenalties(fix.str||72,fix.str||72,penSeed);
          advanced=pen.won;
          penMsg=` (pen. ${pen.myPens}-${pen.opPens})`;
          penData={won:pen.won,my:pen.myPens,op:pen.opPens};
          setTimeout(()=>showToast(`⚽ Eşitlik! Penaltılar: ${pen.won?"🎉 Kazandık":"😔 Kaybettik"} ${pen.myPens}-${pen.opPens}`,4000),300);
        }
        if(advanced){
          const seed=prev.played*53+result.myG*11+result.opG*17+79;
          const opp=pickOpp("Yarı Final",prev.league,seed,prevZtkOpps);
          const str=getRoundStr("Yarı Final",prev.league);
          extraFixture=[
            {w:3050,opp,home:true, str,month:"Mayis",comp:"ZTK",round:"Yarı Final — 1. Maç"},
            {w:3250,opp,home:false,str,month:"Mayis",comp:"ZTK",round:"Yarı Final — 2. Maç"},
          ];
          setTimeout(()=>showToast(`🏆 Yarı Finale çıktınız! ${opp} karşınızda`,3000),penMsg?4500:500);
          addNews({type:"match",player:"Kupa",club:opp,val:0,detail:`🏆 Yarı Final: ${opp} ile${penMsg}`,date:new Date().toLocaleDateString("tr-TR")});
        } else {
          setTimeout(()=>showToast(`❌ Kupa Çeyrek Finale elendiniz${penMsg}`,3000),penMsg?4500:500);
          addNews({type:"match",player:"Kupa",club:fix.opp,val:0,detail:`❌ Çeyrek Final'de ${fix.opp}'e elendik${penMsg}`,date:new Date().toLocaleDateString("tr-TR")});
          setSeason(p=>({...p,kupaSonuc:{...p.kupaSonuc,elendi:true}}));
        }
      }

      // ── YARI FİNAL 2. MAÇI BİTTİ ───────────────────────────────
      if(isSFMatch&&fix.round.includes("2. Maç")){
        const ztkRes=prev.results.filter(r=>r.comp==="ZTK"&&r.round&&r.round.startsWith("Yarı Final"));
        const r1=ztkRes[ztkRes.length-1]||{myG:0,opG:0};
        const r2=result;
        const twoLeg=ztkTwoLegResult(r1,r2);
        let advanced=twoLeg==="W";
        let penMsg="";
        if(twoLeg==="D"){
          const penSeed=prev.played*97+result.myG*19+result.opG*23+83;
          const pen=simPenalties(fix.str||76,fix.str||76,penSeed);
          advanced=pen.won;
          penMsg=` (pen. ${pen.myPens}-${pen.opPens})`;
          penData={won:pen.won,my:pen.myPens,op:pen.opPens};
          setTimeout(()=>showToast(`⚽ Eşitlik! Penaltılar: ${pen.won?"🎉 Kazandık":"😔 Kaybettik"} ${pen.myPens}-${pen.opPens}`,4000),300);
        }
        if(advanced){
          const seed=prev.played*97+result.myG*19+result.opG*23+101;
          const opp=pickOpp("Final",prev.league,seed,prevZtkOpps);
          const str=getRoundStr("Final",prev.league);
          extraFixture=[
            {w:3430,opp,home:false,str,month:"Mayis",comp:"ZTK",round:"Final"},
          ];
          setSeason(p=>({...p,kupaSonuc:{...p.kupaSonuc,finalci:true}}));
          setTimeout(()=>showToast(`🏆 Kupa FİNALİNE ÇIKTI! ${opp} karşınızda - Mayıs'ta!`,4000),penMsg?4500:500);
          addNews({type:"match",player:"Kupa",club:opp,val:0,detail:`🏆🏆 Kupa FİNALİ! ${opp} ile - Mayıs${penMsg}`,date:new Date().toLocaleDateString("tr-TR")});
        } else {
          setSeason(p=>({...p,kupaSonuc:{...p.kupaSonuc,elendi:true}}));
          setTimeout(()=>showToast(`❌ Kupa Yarı Final'de elendiniz${penMsg}`,3000),penMsg?4500:500);
          addNews({type:"match",player:"Kupa",club:fix.opp,val:0,detail:`❌ Yarı Final'de ${fix.opp}'e elendik${penMsg}`,date:new Date().toLocaleDateString("tr-TR")});
        }
      }

      // ── FİNAL BİTTİ ─────────────────────────────────────────────
      if(isFinalMatch){
        const finalRes2=result.res;
        const finalPen=_finalPenOuter;
        if(finalRes2==="W"){
          setTimeout(()=>showToast("🏆🎉 ULUSAL KUPASI KAZANDIK! Şampiyonuz!",5000),500);
          addNews({type:"match",player:"Kupa",club:fix.opp,val:0,detail:`🏆🎉 ULUSAL KUPA KAZANILDI! ${fix.opp}'i yendik`,date:new Date().toLocaleDateString("tr-TR")});
        } else if(finalRes2==="L"){
          setTimeout(()=>showToast("😔 Kupa Finalinde kaybettik. İyi mücadele!",3500),500);
          addNews({type:"match",player:"Kupa",club:fix.opp,val:0,detail:`😔 Kupa Finali kaybedildi — ${fix.opp}'e yenildik`,date:new Date().toLocaleDateString("tr-TR")});
        } else if(finalPen!=null){
          // Beraberlik = penaltılar
          setTimeout(()=>showToast("⚽ Kupa Finali berabere! Penaltılar başlıyor...",2000),300);
          setTimeout(()=>{
            if(finalPen.won){
              showToast(`🏆🎉 PENALTILARDA KAZANDIK! KUPA ŞAMPİYONUYUZ! (${finalPen.myPens}-${finalPen.opPens})`,5000);
              addNews({type:"match",player:"Kupa",club:fix.opp,val:0,detail:`🏆 Kupa penaltılarda kazanıldı! ${finalPen.myPens}-${finalPen.opPens}`,date:new Date().toLocaleDateString("tr-TR")});
            } else {
              showToast(`😔 Penaltılarda kaybettik (${finalPen.myPens}-${finalPen.opPens}). Finalist olduk, gururluyuz.`,4000);
              addNews({type:"match",player:"Kupa",club:fix.opp,val:0,detail:`😔 Kupa Finali penaltılarda kaybedildi ${finalPen.myPens}-${finalPen.opPens}`,date:new Date().toLocaleDateString("tr-TR")});
            }
          },2500);
        }
        // Şampiyonluk state'ini burada set et (race condition önlemi)
        if(ztkWonFinal){
          setSeason(p=>({...p,kupaSonuc:{...p.kupaSonuc,sampiyon:true}}));
        }
      }

      // ── ŞAMPIYONLAR KALKANI SONUCU ──────────────────────────────────────────
      if(fix.comp==="SUPERKUPA"){        const skRes=result.res;
        if(skRes==="W"){
          setTimeout(()=>{showToast("🏆🎉 ŞAMPIYONLAR KALKANI KAZANDIK!",5000);},400);
          addNews({type:"match",player:"Şampiyonlar Kalkanı",club:fix.opp,val:0,
            detail:`🏆 Şampiyonlar Kalkanı kazanıldı! ${fix.opp} yenildi.`,date:new Date().toLocaleDateString("tr-TR")});
          updateFinans(2000,"kupaPrim","🏆 Şampiyonlar Kalkanı Şampiyonluk Primi (+2M€)");
          setCareerStats(prev=>({...prev,trophies:{...prev.trophies,superKupa:(prev.trophies?.superKupa||0)+1}}));
        } else if(skRes==="L"){
          setTimeout(()=>{showToast(`😔 Şampiyonlar Kalkanı'yı ${fix.opp}'e kaybettik.`,3500);},400);
          addNews({type:"match",player:"Şampiyonlar Kalkanı",club:fix.opp,val:0,
            detail:`😔 Şampiyonlar Kalkanı finalisti — ${fix.opp}'e yenildik.`,date:new Date().toLocaleDateString("tr-TR")});
        } else {
          // Berabere → penaltılar
          const skPenSeed=prev.played*53+result.myG*17+result.opG*13+37;
          const skPenWon=((skPenSeed*1664525+1013904223)>>>0)/4294967296<0.5;
          const skMyP=skPenWon?5:4; const skOpP=skPenWon?4:5;
          // Penalti verisini kaydet — fikstür detayında gösterilsin
          penData={won:skPenWon,my:skMyP,op:skOpP};
          setTimeout(()=>{showToast("⚽ Şampiyonlar Kalkanı berabere! Penaltılar...",2000);},300);
          setTimeout(()=>{
            if(skPenWon){
              showToast(`🏆🎉 PENALTIlARDA KAZANDIK! Şampiyonlar Kalkanı bizim! (${skMyP}-${skOpP})`,5000);
              addNews({type:"match",player:"Şampiyonlar Kalkanı",club:fix.opp,val:0,
                detail:`🏆 Şampiyonlar Kalkanı penaltılarda kazanıldı! ${skMyP}-${skOpP}`,date:new Date().toLocaleDateString("tr-TR")});
              updateFinans(2000,"kupaPrim","🏆 Şampiyonlar Kalkanı Şampiyonluk Primi (+2M€)");
              setCareerStats(prev=>({...prev,trophies:{...prev.trophies,superKupa:(prev.trophies?.superKupa||0)+1}}));
            } else {
              showToast(`😔 Penaltılarda kaybettik (${skMyP}-${skOpP}). Finalist olduk.`,4000);
              addNews({type:"match",player:"Şampiyonlar Kalkanı",club:fix.opp,val:0,
                detail:`😔 Şampiyonlar Kalkanı penaltılarda kaybedildi ${skMyP}-${skOpP}`,date:new Date().toLocaleDateString("tr-TR")});
            }
          },2500);
        }
      }
      // ── ZTK KUPA PRİM SİSTEMİ ───────────────────────────────────
      // Her kupa turu geçişinde / maç kazanıldığında bütçeye prim eklenir
      // TFF 1. Lig / Süper Lig prim tablosu (K€)
      const ZTK_PRIM={
        "1. Lig":{
          grup_galibiyet:    30,  // Grup maçı galibiyeti
          grup_beraberlik:   10,  // Grup maçı berabere
          grup_gecis:       120,  // Gruptan çıkma
          s16_gecis:        200,  // Son 16'dan çıkma
          qf_gecis:         350,  // Çeyrek Final'den çıkma
          sf_gecis:         500,  // Yarı Final'den çıkma
          finalist:         300,  // Finalde oynamak (kaybetsen bile)
          sampiyon:        1000,  // Kupa şampiyonluğu
        },
        "Elit Lig":{
          grup_galibiyet:    60,
          grup_beraberlik:   20,
          grup_gecis:       300,
          s16_gecis:        500,
          qf_gecis:         900,
          sf_gecis:        1400,
          finalist:         800,
          sampiyon:        3000,
        },
      };
      const lgForPrim=prev.league||"1. Lig";
      const primTab=ZTK_PRIM[lgForPrim]||ZTK_PRIM["1. Lig"];

      // Grup maçı galibiyeti / berabere primi
      if(fix.comp==="ZTK"&&fix.round&&fix.round.startsWith("Grup")){
        if(result.res==="W"){
          setTimeout(()=>{
            updateFinans(primTab.grup_galibiyet,"kupaPrim",`🏆 Kupa Grup Galibiyeti Primi (+${primTab.grup_galibiyet}K€)`);
            showToast(`💰 Kupa Grup galibiyeti primi: +${primTab.grup_galibiyet}K€`,2500);
          },800);
        } else if(result.res==="D"){
          setTimeout(()=>{
            updateFinans(primTab.grup_beraberlik,"kupaPrim",`🏆 Kupa Grup Berabere Primi (+${primTab.grup_beraberlik}K€)`);
          },800);
        }
        // Gruptan çıkma primi — eleme ile aynı kriter (tablo sıralaması)
        if(isLastZtk&&ztkGroupQualified){
          setTimeout(()=>{
            updateFinans(primTab.grup_gecis,"kupaPrim",`🏆 Kupa Son 16 Prim (+${primTab.grup_gecis}K€)`);
            showToast(`💰 Kupa Son 16 primi: +${primTab.grup_gecis}K€`,3000);
          },1200);
        }
      }

      // Son 16 geçiş primi
      if(isS16Match&&fix.round.includes("2. Maç")){
        const ztkResCheck=prev.results.filter(r=>r.comp==="ZTK"&&r.round&&r.round.startsWith("Son 16"));
        const r1c=ztkResCheck[ztkResCheck.length-1]||{myG:0,opG:0};
        const g1c={myG:r1c?.myG??0, opG:r1c?.opG??0};
        const myTotC=g1c.myG+result.myG; const opTotC=g1c.opG+result.opG;
        const advancedS16=myTotC>opTotC;
        if(advancedS16){
          setTimeout(()=>{
            updateFinans(primTab.s16_gecis,"kupaPrim",`🏆 Kupa Çeyrek Final Prim (+${primTab.s16_gecis}K€)`);
            showToast(`💰 Kupa Çeyrek Final primi: +${primTab.s16_gecis}K€`,3000);
          },1500);
        }
      }

      // Çeyrek Final geçiş primi
      if(isQFMatch&&fix.round.includes("2. Maç")){
        const ztkResCheck=prev.results.filter(r=>r.comp==="ZTK"&&r.round&&r.round.startsWith("Çeyrek"));
        const r1c=ztkResCheck[ztkResCheck.length-1]||{myG:0,opG:0};
        const g1c={myG:r1c?.myG??0, opG:r1c?.opG??0};
        const myTotC=g1c.myG+result.myG; const opTotC=g1c.opG+result.opG;
        const advancedQF=myTotC>opTotC||(myTotC===opTotC&&result.myG>result.opG);
        if(advancedQF){
          setTimeout(()=>{
            updateFinans(primTab.qf_gecis,"kupaPrim",`🏆 Kupa Yarı Final Prim (+${primTab.qf_gecis}K€)`);
            showToast(`💰 Kupa Yarı Final primi: +${primTab.qf_gecis}K€`,3000);
          },1500);
        }
      }

      // Yarı Final geçiş primi (Finale çıkma)
      if(isSFMatch&&fix.round.includes("2. Maç")){
        const ztkResCheck=prev.results.filter(r=>r.comp==="ZTK"&&r.round&&r.round.startsWith("Yarı Final"));
        const r1c=ztkResCheck[ztkResCheck.length-1]||{myG:0,opG:0};
        const g1c={myG:r1c?.myG??0, opG:r1c?.opG??0};
        const myTotC=g1c.myG+result.myG; const opTotC=g1c.opG+result.opG;
        const advancedSF=myTotC>opTotC||(myTotC===opTotC&&result.myG>result.opG);
        if(advancedSF){
          setTimeout(()=>{
            updateFinans(primTab.sf_gecis,"kupaPrim",`🏆 Kupa Final Prim (+${primTab.sf_gecis}K€)`);
            showToast(`💰 Kupa Finale çıkma primi: +${primTab.sf_gecis}K€`,3500);
          },1500);
        }
      }

      // Final bitişi — finalist + şampiyon primleri
      if(isFinalMatch){
        // Finalist primi (her halükarda)
        setTimeout(()=>{
          updateFinans(primTab.finalist,"kupaPrim",`🏆 Kupa Finalist Prim (+${primTab.finalist}K€)`);
          showToast(`💰 Kupa Finalist primi: +${primTab.finalist}K€`,2000);
        },600);
        // Şampiyon primi — isFinalMatch bloğundaki ztkWonFinal ile tutarlı
        if(ztkWonFinal){
          setTimeout(()=>{
            updateFinans(primTab.sampiyon,"kupaPrim",`🏆🎉 Kupa ŞAMPİYONLUK PRİMİ (+${primTab.sampiyon}K€)`);
            showToast(`💰🏆 Kupa Şampiyonluk primi: +${primTab.sampiyon}K€`,4000);
          },3000);
        }
      }
      // ── ZTK PRİM SİSTEMİ SONU ───────────────────────────────────

      // Hafta ilerleyince teklif kilidini temizle
      const weekAdvances=(fix.comp!=="ZTK"&&fix.comp!=="HAZ"&&fix.comp!=="SUPERKUPA"&&!isEuroFix);
      if(weekAdvances) setWeeklyOfferedPlayers({});
      let upd={...prev,week:prev.week+(weekAdvances?1:0),played:prev.played+1,
        goals:prev.goals+result.myG,conceded:prev.conceded+result.opG,
        wins:prev.wins+(result.res==="W"?1:0),draws:prev.draws+(result.res==="D"?1:0),losses:prev.losses+(result.res==="L"?1:0),
        teams:newTeams,
        results:[...prev.results,{opp:fix.opp,r:result.res,s:score,myG:result.myG,opG:result.opG,month:fix.month,comp:fix.comp,home:fix.home,w:fix.w,round:fix.round,stats:result.stats,scorers:result.scorers,assisters:result.assisters,oppStr:fix.str,...(penData?{pen:true,penWon:penData.won,penMy:penData.my,penOp:penData.op}:{})}],
        // Yeni maçları sortFixture ile ekle — PageFikstur ile aynı sıra
        fixture:(()=>{
          const remaining=prev.fixture.slice(1);
          if(extraFixture.length===0) return remaining;
          // Dinamik w düzeltmesi: extraFixture'daki kupa maçlarının w değerini
          // remaining'deki lig haftalarına göre yeniden hesapla.
          // Böylece bazı Nisan haftaları zaten oynanmış olsa bile
          // kupa maçları kalan haftalar arasına doğru yerleşir.
          const _LIG_EXCL=["HAZ","ZTK","CL","UEFA","CON","SUPERKUPA"];
          // Ay → kalan lig w değerleri
          const _remLigW={};
          remaining.forEach(f=>{
            if(_LIG_EXCL.includes(f.comp)) return;
            const m=f.month||"";
            if(!_remLigW[m]) _remLigW[m]=[];
            _remLigW[m].push(f.w||0);
          });
          Object.keys(_remLigW).forEach(m=>_remLigW[m].sort((a,b)=>a-b));
          // remaining'deki mevcut kupa maçlarını ay bazında say
          // Böylece yeni eklenen kupa maçları onların arkasına yerleşir
          const _existingCupW={};
          remaining.forEach(f=>{
            if(!_LIG_EXCL.includes(f.comp)) return;
            if(f.comp==="HAZ") return;
            const m=f.month||"";
            if(!_existingCupW[m]) _existingCupW[m]=[];
            _existingCupW[m].push(f.w||0);
          });
          // extraFixture içindeki her kupa maçını kalan haftalar arasına yerleştir
          // Ay içinde kaçıncı kupa maçı olduğunu say, sonra eşit aralıklarla dağıt
          const _cupByMonth={};
          extraFixture.forEach(f=>{
            const m=f.month||"";
            if(!_cupByMonth[m]) _cupByMonth[m]=[];
            _cupByMonth[m].push(f);
          });
          const _adjExtra=extraFixture.map(f=>{
            const m=f.month||"";
            const ligWs=_remLigW[m]||[];
            if(ligWs.length===0) return f; // o ayda lig haftası kalmamış, dokunma
            const cupsInMonth=_cupByMonth[m]||[];
            const idx=cupsInMonth.indexOf(f);
            // Mevcut kupa maçlarından sonra başla
            const existingCount=(_existingCupW[m]||[]).length;
            const totalIdx=existingCount+idx;
            // ligWs arasına eşit aralıklarla dağıt
            const targetLigIdx=Math.min(totalIdx, ligWs.length-1);
            const newW=ligWs[targetLigIdx]*100+50+(totalIdx-targetLigIdx)*10;
            return {...f, w:newW};
          });
          return sortFixture([...remaining,..._adjExtra]);
        })(),
        form:[...prev.form.slice(-5),result.res],
        rankHistory:(()=>{
          const lgName=prev.league||"1. Lig";
          const lgTeamsSorted=[...newTeams].filter(t=>t.lg===lgName).sort((a,b)=>b.pts-a.pts||b.gd-a.gd||b.gf-a.gf);
          const myRankNow=lgTeamsSorted.findIndex(t=>t.me)+1||0;
          const myPtsNow=lgTeamsSorted.find(t=>t.me)?.pts||0;
          if(myRankNow===0) return prev.rankHistory||[];
          return [...(prev.rankHistory||[]),{w:prev.played+1,rank:myRankNow,pts:myPtsNow}].slice(-38);
        })(),
        kupaSonuc:{...newKupa,
          sampiyon:newKupa.sampiyon||ztkWonFinal||false
        },
      };

      // ── AVRUPA KUPALARI (Swiss): 3×36 takımlı tabloları bu maçın takvim konumuna kadar ilerlet ──
      const euroAdvanceAll=(P,um)=>{
        const evAll=[], addFix=[];
        EURO_COMP_LIST.forEach(c=>{
          const key=EURO_TABLE_KEY[c];
          if(!upd[key]) return;
          const r=advanceEuroTable(upd[key],P,um&&um.comp===c?um:null);
          upd={...upd,[key]:r.tbl};
          evAll.push(...r.ev);addFix.push(...r.fix);
        });
        if(addFix.length) upd={...upd,fixture:sortFixture([...upd.fixture,...addFix])};
        const fmtEuro=(v)=>v>=1000?(v/1000).toFixed(1)+"M€":v+"K€";
        const repTab={r16:[6,3,2],qf:[8,4,3],sf:[12,6,4],fin:[16,8,5]};
        evAll.forEach(e=>{
          const meta=EURO_META[e.comp], prim=EURO_PRIM[e.comp], ci=EURO_COMP_LIST.indexOf(e.comp);
          const tbl=upd[EURO_TABLE_KEY[e.comp]];
          const mine=!!(tbl&&tbl.teams.some(t=>t.me));
          const payPrim=(k,label,delay)=>setTimeout(()=>{
            updateFinans(prim[k],"kupaPrim",`${meta.icon} ${meta.name} ${label} Primi (+${fmtEuro(prim[k])})`);
            showToast(`💰 ${meta.icon} ${label} primi: +${fmtEuro(prim[k])}`,3000);
          },delay);
          if(e.type==="league_end"&&mine&&e.myRank){
            if(e.myRank<=8){
              setTimeout(()=>showToast(`🎉 ${meta.icon} ${meta.name} lig aşamasını ${e.myRank}. bitirdik — doğrudan Son 16!`,4500),600);
            } else if(e.myRank<=24){
              const meN=(tbl.teams.find(x=>x.me)||{}).n;
              const tie=(tbl.ko.po||[]).find(t=>t.a===meN||t.b===meN);
              const opp=tie?(tie.a===meN?tie.b:tie.a):"";
              setTimeout(()=>showToast(`${meta.icon} ${meta.name}: ${e.myRank}. sıra — Şubat'ta Play-Off${opp?": "+opp:""}`,4500),600);
              payPrim("playoff","Play-Off",1500);
            } else {
              setTimeout(()=>showToast(`😔 ${meta.icon} ${meta.name} lig aşamasında ${e.myRank}. sırada kalıp elendik.`,4000),600);
            }
          }
          if(e.type==="round_start"&&e.tie){
            const meN=(tbl.teams.find(x=>x.me)||{}).n;
            const opp=e.tie.a===meN?e.tie.b:e.tie.a;
            const lbl=EURO_KO_LABEL[e.round];
            setTimeout(()=>showToast(e.round==="fin"?`🏆🌟 ${meta.name} FİNALİNDEYİZ! Rakip: ${opp}`:`🏆 ${meta.name} ${lbl}: ${opp} ile eşleştik.`,4500),900);
            payPrim(EURO_PRIM_ROUND[e.round],lbl,1800);
            const rp=repTab[e.round];
            if(rp) setTimeout(()=>updateRep(rp[ci],`${meta.name} ${lbl} Turuna Çıktı`,season.league||"Elit Lig"),2000);
          }
          if(e.type==="tie_end"&&!e.won){
            const pen=e.pen?" (penaltılarla)":"";
            setTimeout(()=>showToast(e.round==="fin"?`😔 ${meta.name} Finalini kaybettik${pen}. Gururluyuz!`:`😔 ${meta.name} ${EURO_KO_LABEL[e.round]} turunda elendik${pen} — rakip: ${e.opp}`,4000),900);
          }
          if(e.type==="tie_end"&&e.round==="fin"){
            payPrim("finalist","Finalist",600);
            if(!e.won) updateRep([10,5,3][ci],`${meta.name} — Final Kaybı (Finalist)`,season.league||"Elit Lig");
          }
          if(e.type==="champion"){
            if(e.me){
              setTimeout(()=>showToast(`🏆🎉🎊 ${meta.upper} KUPASINI KAZANDIK!`,6000),500);
              payPrim("sampiyon","Şampiyonluk",3500);
              setTimeout(()=>updateRep([16,8,5][ci],`🏆 ${meta.name} Şampiyonluğu`,season.league||"Elit Lig"),3000);
            }
            const trKey=e.comp==="CL"?"cl":e.comp==="UEFA"?"uefal":"con";
            setCareerStats(cs=>({...cs,
              trophies:e.me?{...cs.trophies,[trKey]:((cs.trophies||{})[trKey]||0)+1}:cs.trophies,
              lastClChampion:e.comp==="CL"?e.champion:cs.lastClChampion,
              lastUefaChampion:e.comp==="UEFA"?e.champion:cs.lastUefaChampion,
              lastConChampion:e.comp==="CON"?e.champion:cs.lastConChampion,
            }));
          }
        });
      };
      {
        const lastLigW=Math.max(0,...upd.results.filter(r=>!EURO_CUP_COMPS.includes(r.comp)&&(r.w||0)<1000).map(r=>r.w||0));
        const P=isLeagueFix?(fix.w||lastLigW):(fix.w||0)>=1000?(fix.w/100):lastLigW;
        euroAdvanceAll(P,euroUM);
      }

      // Sezon sonu: tüm fikstür (ZTK + CL/UEFA dahil) bitince tetikle
      const hasRemainingZtk=upd.fixture.some(f=>f.comp==="ZTK");
      const hasRemainingLig=upd.fixture.some(f=>f.comp!=="ZTK"&&f.comp!=="HAZ"&&f.comp!=="CL"&&f.comp!=="UEFA"&&f.comp!=="CON");
      const hasRemainingEuro=upd.fixture.some(f=>f.comp==="CL"||f.comp==="UEFA"||f.comp==="CON");
      // Sezon gerçekten bitti: lig kalmadı VE kupa kalmadı VE Avrupa kalmadı VE bu haftadan ekstra fikstür de yok
      const seasonOver=!hasRemainingLig&&!hasRemainingZtk&&!hasRemainingEuro&&extraFixture.length===0;
      if(seasonOver){
        euroAdvanceAll(Infinity,null); // AI eleme turları ve finaller tamamlanır
        const lg2=upd.league||"1. Lig";
        // Eksik maçları tamamla: sezon sonunda tüm takımlar maxGames oynamış olmalı
        const LIG_MAX2={"1. Lig":38,"Elit Lig":34,"İngiliz Ligi":38,"İspanyol Ligi":38,"Alman Ligi":34,"İtalyan Ligi":38,"Fransız Ligi":34,"Hollanda Ligi":34,"Portekiz Ligi":34,"İngiliz 2. Ligi":46};
        const fillTeams=[...upd.teams];
        const maxG=LIG_MAX2[lg2]||34;
        let fillSeed=99999;
        // Eksik maç sayısını bul ve o kadar tur çalıştır
        // Her takımın eksik maç sayısını bul, en fazlası kadar tur çalıştır
        const maxMissing=(()=>{
          const counts=fillTeams.filter(t=>t.lg===lg2&&!t.me).map(t=>t.w+t.d+t.l);
          return counts.length>0?Math.max(0,...counts.map(c=>maxG-c)):0;
        })();
        // Her takımı kesinlikle maxG'ye tamamla - tek kalan varsa fazladan maç oynat
        const fillMatch=(aI,bI)=>{
          const a=fillTeams[aI],b=fillTeams[bI];
          const aStr=a.str||65,bStr=b.str||65,total=aStr+bStr;
          const rng=((fillSeed*1664525+a.n.charCodeAt(0)*22695477+b.n.charCodeAt(0)*6364136)>>>0)/4294967296;
          const rng2=((fillSeed*6364136+aI*1664525)>>>0)/4294967296;
          const strDiff=aStr-bStr;
          const baseWin=(aStr/total)*100;
          const diffBonus=strDiff*1.5;
          const aWinChance=Math.max(8,Math.min(82,baseWin+diffBonus));
          const drawChance=Math.max(5,18-Math.abs(strDiff)*0.5);
          let aRes,bRes;
          if(rng*100<aWinChance){aRes="W";bRes="L";}
          else if(rng*100<aWinChance+drawChance){aRes="D";bRes="D";}
          else{aRes="L";bRes="W";}
          // Gerçekçi kupa gol simülasyonu
          const rng3f=((fillSeed*22695477+aI*6364136+1)>>>0)/4294967296;
          const rng4f=((fillSeed*6364136+bI*22695477+2)>>>0)/4294967296;
          const strRatioF=Math.max(0.5,Math.min(2.0,aStr/(bStr||65)));
          const aGfRaw=aRes==="W"?1+Math.floor(rng2*2+strRatioF*0.7):aRes==="D"?Math.floor(rng2*2)+1:Math.floor(rng3f*2);
          const bGfRaw=bRes==="W"?1+Math.floor(rng3f*2+(1/strRatioF)*0.7):bRes==="D"?aGfRaw:Math.floor(rng4f*2);
          const aGf=Math.max(0,Math.min(7,aGfRaw));
          const bGf=Math.max(0,Math.min(7,aRes==="D"?aGf:bGfRaw));
          fillTeams[aI]={...fillTeams[aI],pts:a.pts+(aRes==="W"?3:aRes==="D"?1:0),w:a.w+(aRes==="W"?1:0),d:a.d+(aRes==="D"?1:0),l:a.l+(aRes==="L"?1:0),gf:a.gf+aGf,ga:a.ga+bGf,gd:a.gd+aGf-bGf};
          fillTeams[bI]={...fillTeams[bI],pts:b.pts+(bRes==="W"?3:bRes==="D"?1:0),w:b.w+(bRes==="W"?1:0),d:b.d+(bRes==="D"?1:0),l:b.l+(bRes==="L"?1:0),gf:b.gf+bGf,ga:b.ga+aGf,gd:b.gd+bGf-aGf};
          fillSeed++;
        };
        for(let round=0;round<maxMissing;round++){
          const eligible=fillTeams.map((t,i)=>({t,i})).filter(({t})=>t.lg===lg2&&!t.me&&(t.w+t.d+t.l)<maxG);
          if(eligible.length===0) break;
          let pool=eligible.map(({i})=>i);
          // Tek sayıda takım varsa: en az maç oynayan başka uygun takımla eşleştir
          if(pool.length%2!==0){
            // pool dışından (zaten maxG'de olan) biri ile oynasın
            const extra=fillTeams.map((t,i)=>({t,i})).find(({t,i})=>t.lg===lg2&&!t.me&&!pool.includes(i)&&(t.w+t.d+t.l)<=maxG);
            if(extra) pool.push(extra.i);
            else pool=pool.slice(0,pool.length-1);
          }
          for(let i=0;i+1<pool.length;i+=2) fillMatch(pool[i],pool[i+1]);
        }
        upd={...upd,teams:fillTeams};
        // lg2 ile eşleşen takımlar + me takımını da zorla dahil et
        const lgT_raw=[...upd.teams].filter(t=>t.lg===lg2||t.me);
        // Tekrar eden me takımını çıkar
        const lgT=[...new Map(lgT_raw.map(t=>[t.n,t])).values()].sort((a,b)=>b.pts-a.pts||b.gd-a.gd||b.gf-a.gf);
        const meIdx=lgT.findIndex(t=>t.me);
        const rank2=meIdx>=0?meIdx+1:lgT.length; // bulunamazsa son sıra (güvenli varsayım)
        const myPts=(lgT.find(t=>t.me)||{pts:0}).pts;
        if(rank2===1&&lg2==="Elit Lig") updateRep(7,"Süper Lig Şampiyonluğu",lg2);
        else if(rank2===1) updateRep(12,"Lig Şampiyonluğu",lg2);
        else if(rank2<=3&&lg2==="1. Lig") updateRep(10,"Süper Lig yükselmesi",lg2);
        else if(rank2<=3&&lg2==="İngiliz 2. Ligi") updateRep(10,"İngiliz Ligi yükselmesi",lg2);
        else if(rank2<=2) updateRep(6,"Üst 2 Bitiş (ASK hakkı)",lg2);
        else if(rank2<=4) updateRep(7,"Avrupa Ligi",lg2);
        else if(rank2<=6) updateRep(3,"Üst sıra bitiş",lg2);
        else if(rank2>lgT.length-3&&lg2==="Elit Lig") updateRep(-18,"Küme düşme: TFF 1. Lig",lg2);
        else if(rank2>lgT.length-3&&lg2==="İngiliz Ligi") updateRep(-18,"Küme düşme: İngiliz 2. Ligi",lg2);
        else if(rank2>=lgT.length-2) updateRep(-10,"Alt sıra bitiş",lg2);
        else updateRep(1,"Sezon tamamlandı",lg2);
        // ── Kariyer istatistiklerini güncelle ──
        const myTeamEnd=lgT.find(t=>t.me)||{w:0,d:0,l:0,gf:0,ga:0,pts:0};
        setCareerStats(prev=>{
          const newSeason={league:lg2,rank:rank2,pts:myPts,w:myTeamEnd.w||0,d:myTeamEnd.d||0,l:myTeamEnd.l||0,gf:myTeamEnd.gf||0,ga:myTeamEnd.ga||0};
          const trophies={...prev.trophies};
          if(rank2===1&&lg2==="Elit Lig") trophies.sl=(trophies.sl||0)+1;
          if(upd.kupaSonuc?.sampiyon) trophies.ztk=(trophies.ztk||0)+1;

          return{
            ...prev,
            seasons:[...(prev.seasons||[]),newSeason],
            totalW:(prev.totalW||0)+(myTeamEnd.w||0),
            totalD:(prev.totalD||0)+(myTeamEnd.d||0),
            totalL:(prev.totalL||0)+(myTeamEnd.l||0),
            totalGF:(prev.totalGF||0)+(myTeamEnd.gf||0),
            totalGA:(prev.totalGA||0)+(myTeamEnd.ga||0),
            totalMatches:(prev.totalMatches||0)+(myTeamEnd.w||0)+(myTeamEnd.d||0)+(myTeamEnd.l||0),
            bestRank:Math.min(prev.bestRank||99,rank2),
            bestLeague:rank2<(prev.bestRank||99)?lg2:prev.bestLeague||lg2,
            trophies,
          };
        });
        // Taraftar memnuniyeti — sezon sonu
        if(rank2<=3) updateFans(12,"Sezon başarısı: "+rank2+". sıra","season");
        else if(rank2<=6) updateFans(4,"Sezon tatmin edici","season");
        else if(rank2>=lgT.length-2) updateFans(-15,"Kötü sezon bitiş","season");
        else updateFans(-2,"Sezon beklentilerin altında","season");
        // ── Avrupa katılımı (Swiss model): 8 ligin final sıralamasından 3×36 takım ──
        // Kura Eylül'de çekilir (pendingEuroGroups → isEnteringEylul hook'u)
        const correctSeasonNumEuro=(careerStats.seasons||[]).length+1;
        const euroQuals=selectEuroQualifiers(upd.teams);
        const myEuroComp=EURO_COMP_LIST.find(c=>euroQuals[c].some(t=>t.me))||null;
        setTimeout(()=>setPendingEuroGroups({swiss:true,quals:euroQuals,myComp:myEuroComp,seed:(Date.now()%1000003)+correctSeasonNumEuro}),900);
        if(myEuroComp){
          const _em=EURO_META[myEuroComp], _ek={CL:"'na",UEFA:"'ne",CON:"'ne"}[myEuroComp];
          setTimeout(()=>showToast(`${_em.icon} Tebrikler! ${clubName} ${_em.name}${_ek} katıldı! Lig aşaması kurası Eylül'de.`,5000),1200);
        }
        const lgT_total=lgT.length;
        // Terfi: 1. Lig → Elit Lig, İngiliz 2. Ligi → İngiliz Ligi (ilk 3)
        const PROMO_TO={"1. Lig":"Elit Lig","İngiliz 2. Ligi":"İngiliz Ligi"};
        // Düşme: Elit Lig → 1. Lig, İngiliz Ligi → İngiliz 2. Ligi (son 3)
        const RELEG_TO={"Elit Lig":"1. Lig","İngiliz Ligi":"İngiliz 2. Ligi"};
        const isPromoted=rank2<=3&&!!PROMO_TO[lg2];
        const relegZone=lgT_total-2; // 19-2=17 → 17,18,19 düşer
        const isRelegated=!!RELEG_TO[lg2]&&rank2>=relegZone;
        const promoteTo=PROMO_TO[lg2]||"Elit Lig", relegateTo=RELEG_TO[lg2]||"1. Lig";
        // TFF tablosunu da hesapla — yükselen/düşen AI için gerekli
        const tffT=[...upd.teams].filter(t=>t.lg==="1. Lig").sort((a,b)=>b.pts-a.pts||b.gd-a.gd||b.gf-a.gf);
        const slT=[...upd.teams].filter(t=>t.lg==="Elit Lig").sort((a,b)=>b.pts-a.pts||b.gd-a.gd||b.gf-a.gf);
        // seasonNum: setCareerStats async olduğu için stale olmaması adına
        // yeni eklenen sezon dahil doğru sayıyı hesapla (prev.seasons.length+1)
        const correctSeasonNum=(careerStats.seasons||[]).length+1;
        setTimeout(()=>setSeasonEndModal({rank:rank2,league:lg2,pts:myPts,teams:lgT,promoted:isPromoted,relegated:isRelegated,promoteTo,relegateTo,totalTeams:lgT_total,tffTable:tffT,slTable:slT,scenario:activeScenario,seasonNum:correctSeasonNum}),800);
        return upd;
      }
      return upd;
    });
    // ── Eylül başında kura çekimi modalını göster (pendingEuroGroups varsa) ──
    const nextMonth2=season.fixture&&season.fixture[1]?season.fixture[1].month:
                     season.fixture&&season.fixture[0]?season.fixture[0].month:"";
    const prevMonth2=fix.month||"";
    // Eylül'e geçişte VEYA ilk maçlar Eylül'deyse (yeni oyun) kura çekimini tetikle
    const isEnteringEylul=(prevMonth2!=="Eylul"&&nextMonth2==="Eylul")||(fix.month==="Eylul"&&season.played<=3);
    // ── ALTIN TOP ÖDÜLÜ — Eylül başında, her sezonda ──
    // Her sezon Eylül'e girildiğinde tetiklenir (played kısıtı yok)
    const isEnteringEylulForAward=(prevMonth2!=="Eylul"&&nextMonth2==="Eylul")||(fix.month==="Eylul"&&season.played<=3);
    const currentSeasonNum=(careerStats.seasons||[]).length;
    if(isEnteringEylulForAward&&altinTopVerildi.current!==currentSeasonNum){
      altinTopVerildi.current=currentSeasonNum;
      setTimeout(()=>{
        // Tüm DB'den + kadroden en iyi oyuncuyu seç (önceki sezonun performansı)
        // Skor: OVR * 0.5 + seasonGoals * 3 + seasonAssists * 2 + avgRating * 0.5
        const calcAltinScore=(p)=>{
          const ratings=p.seasonRatings||[];
          // Minimum 10 mac oynamamissa rating hesaba katma — 1-2 mac outlier olusturuyor
          const avgR=ratings.length>=10
            ?ratings.reduce((a,b)=>a+b,0)/ratings.length
            :ratings.length>=5?(ratings.reduce((a,b)=>a+b,0)/ratings.length)*0.7:7.0;
          // OVR 80+ olmadan aday olamaz (gorselde OVR 67 kazaniyordu)
          const ovrGate=(p.ovr||70)>=80?1:0;
          // Sezon maç sayisi yeterliyse degerlendirmeye al
          const minMatches=(p.seasonMatches||p.matches||0)>=15?1:0;
          if(!ovrGate||!minMatches) return -1;
          return (p.ovr||70)*0.8+(p.seasonGoals||0)*3+(p.seasonAssists||0)*2+avgR*2+(p.motmCount||0)*4;
        };
        // Tüm DB — lig filtresi yok, tüm dünyadan adaylar
        const isFirstSeason=(careerStats.seasons||[]).length===0;
        const allCandidates=[...db.filter(p=>p.ovr>=80)];
        // Kadrodaki oyuncuları da dahil et (DB'de yoksa)
        squad.forEach(sp=>{
          if(!allCandidates.find(dp=>dp.id===sp.id)&&(sp.ovr||0)>=80)
            allCandidates.push(sp);
        });
        if(allCandidates.length===0) return;
        let winner;
        if(isFirstSeason){
          // İlk sezonda istatistik yok — OVR 85+ arası rasgele seç
          const topPlayers=allCandidates.filter(p=>p.ovr>=85).sort((a,b)=>b.ovr-a.ovr).slice(0,10);
          const pool=topPlayers.length>0?topPlayers:allCandidates.sort((a,b)=>b.ovr-a.ovr).slice(0,10);
          winner=pool[Math.floor(Math.random()*pool.length)];
        } else {
          // Skoru -1 olan adaylar (OVR<80 veya az mac) elendi
          const eligible=allCandidates.filter(p=>calcAltinScore(p)>0);
          if(eligible.length===0){
            // Fallback: OVR 85+ en iyi DB oyuncusu
            const fb=allCandidates.filter(p=>p.ovr>=85).sort((a,b)=>b.ovr-a.ovr);
            if(fb.length===0) return;
            winner=fb[0];
          } else {
            winner=eligible.reduce((best,p)=>calcAltinScore(p)>calcAltinScore(best)?p:best,eligible[0]);
          }
        }
        const isMyPlayer=!!squad.find(sp=>sp.id===winner.id);
        // Piyasa değerini artır — kazananın val'ini %5 yükselt (gerçekçi ödül etkisi)
        const valArtis=parseFloat(((winner.val||1)*0.05).toFixed(2));
        const yeniVal=parseFloat(((winner.val||1)+valArtis).toFixed(2));
        if(isMyPlayer){
          setSquad(prev=>prev.map(p=>p.id===winner.id?{...p,val:yeniVal}:p));
        } else {
          setDb(prev=>prev.map(p=>p.id===winner.id?{...p,val:yeniVal}:p));
        }
        addNews({type:"rival_transfer",player:"🏅 Altın Top Ödülü",club:winner.n+" ("+winner.club+")",
          val:0,detail:`Geçen sezonun en iyi oyuncusu seçildi! OVR:${winner.ovr} · Piyasa değeri +${valArtis.toFixed(1)}M€ arttı.`,
          date:new Date().toLocaleDateString("tr-TR")});
        setAltinTopModal({winner:{...winner,val:yeniVal},isMyPlayer,valArtis});
      },1200);
    }
    if(isEnteringEylul&&pendingEuroGroups){
      const peg=pendingEuroGroups;
      setPendingEuroGroups(null);
      setTimeout(()=>{
        const drawn=buildEuroSeasonDraw(season,peg.swiss?peg:{swiss:true,quals:null});
        setSeason(s=>({...s,...drawn.tables,
          fixture:sortFixture([...s.fixture.filter(f=>!(isEuroComp(f.comp)&&f.sw)),...drawn.userFix]),
        }));
        if(drawn.kura) setKuraModal(drawn.kura);
        else showToast("🌍 Avrupa kupalarında lig aşaması kuraları çekildi (36 takım).",3000);
      },600);
    }
    // Yeni ayda transfer penceresi açılıyorsa pending oyuncuları kadroya aktar
    const newMonth=season.fixture&&season.fixture[1]?season.fixture[1].month:
                   season.fixture&&season.fixture[0]?season.fixture[0].month:"";
    const wasOpen=isTransferWindow(fix.month||"");
    const nowOpen=isTransferWindow(newMonth);
    if(!wasOpen&&nowOpen&&pendingSquad.length>0){
      const buys=pendingSquad.filter(x=>!x.type||x.type==="buy");
      const sells=pendingSquad.filter(x=>x.type==="sell");
      // pendingJoin bayrağını temizle (artık resmi olarak aktif)
      setSquad(sq=>sq.map(p=>p.pendingJoin?{...p,pendingJoin:false}:p));
      buys.forEach(({player})=>{
        handleAddToSquad(player,"pending");
        addNews({type:"transfer_in",player:player.n,club:player.club,val:player.val||0,
          detail:"✅ Transfer sezonu açıldı, kadroya katıldı · "+player.pos+"·OVR"+player.ovr,
          date:new Date().toLocaleDateString("tr-TR")});
      });
      sells.forEach(({player:p})=>{
        setSquad(sq=>sq.filter(pl=>pl.id!==p.id));
        removePlayerFromCoaches(p.id);
        rebuildLineupAfterRemove(p.id);
        const sellK=Math.round((p.val||0)*1000);
        if(sellK>0) updateFinans(sellK,"sell",`Satış: ${p.n} (${p.val}M€)`);
        updateFinans(p.sal||20,"salary_remove",`Maaş azaldı: ${p.n}`);
        addNews({type:"transfer_out",player:p.n,club:"FC Yildiz",val:p.val,
          detail:"✅ Transfer sezonu açıldı, satış gerçekleşti · "+p.pos+"·OVR"+p.ovr,
          date:new Date().toLocaleDateString("tr-TR")});
      });
      const msg=[];
      if(buys.length>0) msg.push(buys.length+" oyuncu kadroya katıldı");
      if(sells.length>0) msg.push(sells.length+" oyuncu satıldı");
      showToast("🔓 Transfer sezonu açıldı! "+msg.join(", ")+".");
      setPendingSquad([]);
    } else {
      showToast(result.res==="W"?`⚽ GALİBİYET! ${fix.opp} ${score}`:result.res==="L"?`😔 Mağlubiyet: ${fix.opp} ${score}`:`🤝 Beraberlik: ${fix.opp} ${score}`);
    }
    var rLg=season.league||"1. Lig";
    // Maç bazı rep: net sabit değerler (raw=true → çarpan yok)
    if(result.res==="W"){
      const repGain=fix.comp==="CL"?3:fix.comp==="UEFA"?3:fix.comp==="CON"?2:fix.comp==="ZTK"?2:1;
      updateRep(repGain,"Galibiyet: "+fix.opp,rLg,true);
    } else if(result.res==="L"){
      updateRep(fix.str>=75?-1:fix.str>=65?-2:-3,"Mağlubiyet: "+fix.opp,rLg);
    } else if(result.res==="D"&&(fix.comp==="CL"||fix.comp==="UEFA"||fix.comp==="CON")){
      updateRep(1,"Beraberlik: "+fix.opp+" ("+fix.comp+")",rLg,true); // Avrupa'da beraberlik
    }
    // Taraftar memnuniyeti — maç sonucuna göre
    const goalDiff=result.myG-result.opG;
    if(result.res==="W"){
      const fanBonus=fix.str>=75?8:fix.str>=65?5:3;
      const excitingBonus=goalDiff>=3?4:goalDiff>=2?2:0;
      updateFans(fanBonus+excitingBonus,"Galibiyet: "+fix.opp+" ("+result.myG+"-"+result.opG+")","match");
    } else if(result.res==="L"){
      const fanPenalty=fix.str>=75?-3:fix.str>=65?-6:-10;
      updateFans(fanPenalty,"Mağlubiyet: "+fix.opp+" ("+result.myG+"-"+result.opG+")","match");
    } else {
      updateFans(fix.str>=75?2:-1,"Beraberlik: "+fix.opp,"match");
    }

    // Yönetim bloke sayacını düşür
    setMgmt(prev=>{
      if(prev.blockWeeksLeft>0){
        const newWeeks=prev.blockWeeksLeft-1;
        const cleared=newWeeks===0;
        return{...prev,blockWeeksLeft:newWeeks,
          blockedBudget:cleared?0:prev.blockedBudget,
          blockReason:cleared?"":prev.blockReason,
          history:cleared?[{reason:"Bütçe blokesi kaldırıldı",delta:0,trust:prev.trust,
            date:new Date().toLocaleDateString("tr-TR")},...prev.history].slice(0,30):prev.history};
      }
      return prev;
    });

    // Maç sonrası formasyon dizilimini güncelle (autoLineup açıksa)
    if(autoLineup){
      setStartingXI(buildAutoLineupApp(squad,formation,coaches));
    }

    // Önemli maç sonrası basın toplantısı tetikle — sadece gerçekten önemli maçlarda
    const isImportantMatch=
      (fix.comp!=="ZTK"&&fix.comp!=="HAZ"&&fix.comp!=="CL"&&fix.comp!=="UEFA"&&fix.comp!=="CON"&&fix.str>=85) ||  // elit lig rakibi (85+)
      (fix.comp==="ZTK"&&fix.round&&(fix.round.startsWith("Yarı")||fix.round.startsWith("Final"))) ||  // ZTK YF/Final
      (fix.comp==="CL"&&fix.ko) ||                                                              // CL eleme turları
      ((fix.comp==="UEFA"||fix.comp==="CON")&&(fix.ko==="sf"||fix.ko==="fin"));                // AL/KL YF/Final
    if(isImportantMatch){
      setPostMatchBasin({fix, result});
    }

  
  // ══════════════════════════════════════════════════════════════
  // HAFTALIK OYUNCU GÜNCELLEME SİSTEMİ
  // Gelişim, sakatlanma, moral, rakip transferleri
  // ══════════════════════════════════════════════════════════════

  const weeklyPlayerUpdate=(matchResult,fixture)=>{
    const isWin=matchResult.res==="W";
    const isLoss=matchResult.res==="L";

    // Aktif oyuncu antrenörlerini hazırla (bonuslar oyuncu bazında assignedPlayers kontrolüyle hesaplanacak)
    const activePlayerCoaches=coaches.filter(c=>c.hired&&c.type==="player");

    setSquad(prev=>prev.map(p=>{
      let {ovr,pot,age,moral=75,injured=0,injSev=0,fatigue=0,protectTrain=false,devPoints=0,val,sal,
        seasonGoals=0,seasonAssists=0,seasonRatings=[],seasonMatches=0}=p;
      // Antrenman odağı
      const focus=TRAIN_FOCUS.find(f=>f.key===(trainFocus[p.id]||"balanced"))||TRAIN_FOCUS[0];

      // Oyuncuya atanmış antrenörlerin bonuslarını hesapla (sadece assignedPlayers'da olan oyuncuya etki eder)
      const myCoaches=activePlayerCoaches.filter(c=>(c.assignedPlayers||[]).includes(p.id));
      const coachGlobalDevMult=myCoaches.reduce((acc,c)=>acc*(c.playerBonuses?.globalDevMult||1.0),1.0);
      const coachU23DevMult=myCoaches.reduce((acc,c)=>acc*(c.playerBonuses?.u23DevMult||1.0),1.0);
      const coachU21DevMult=myCoaches.reduce((acc,c)=>acc*(c.playerBonuses?.u21DevMult||1.0),1.0);
      const coachSeniorDevMult=myCoaches.reduce((acc,c)=>acc*(c.playerBonuses?.seniorDevMult||1.0),1.0);
      const coachInjMult=myCoaches.reduce((acc,c)=>acc*(c.playerBonuses?.injMult||1.0),1.0);
      const coachSpdBoost=myCoaches.some(c=>c.playerBonuses?.spdBoost)?1:0;
      const coachMoralBase=myCoaches.reduce((acc,c)=>Math.max(acc,c.playerBonuses?.moralBase||0),0);

      // ── MAÇ İSTATİSTİKLERİNİ GÜNCELLE ────────────────────────
      // Hazırlık maçları (HAZ) istatistiklerine sayılmaz
      const isHazMatch=fixture&&fixture.comp==="HAZ";
      const isEuroMatch=fixture&&(fixture.comp==="CL"||fixture.comp==="UEFA"||fixture.comp==="CON");
      const isKupaMatch=fixture&&fixture.comp==="ZTK";
      const isLigMatch=!isHazMatch&&!isEuroMatch&&!isKupaMatch;
      const plGoals=isHazMatch?0:(matchResult.scorers||[]).filter(n=>n===p.n).length;
      const plAssists=isHazMatch?0:(matchResult.assisters||[]).filter(n=>n===p.n).length;
      const plRating=matchResult.ratings?matchResult.ratings[p.id]||0:0;
      // seasonGoals/Assists = SADECE lig goller (GK/AK için)
      const newSeasonGoals=seasonGoals+(isLigMatch?plGoals:0);
      const newSeasonAssists=seasonAssists+(isLigMatch?plAssists:0);
      const newSeasonMatches=isHazMatch?seasonMatches:(seasonMatches+1);
      const newSeasonRatings=plRating>0?[...seasonRatings.slice(-9),plRating]:seasonRatings;

      // ── 1. SAKATLAMA ─────────────────────────────────────────
      if(injured>0){
        // Koruyucu antrenman: iyileşmeyi hızlandırmaz ama yeniden sakatlanma riskini azaltır
        const recovSpeed=protectTrain?1.5:1;
        const newInjured=Math.max(0,injured-recovSpeed);
        const newInjSev=newInjured===0?0:injSev;
        const injVal=(()=>{
          const ovrBase=ovr>=85?45:ovr>=80?22:ovr>=75?10:ovr>=70?5:ovr>=65?2:1;
          const ageMult=age<=21?1.25:age<=25?1.10:age<=27?1.02:age<=29?0.90:age<=31?0.75:age<=33?0.55:0.35;
          return Math.max(0.1,parseFloat((ovrBase*ageMult*0.94).toFixed(2)));
        })();
        // Sakatlı oyuncu maçta oynamaz — istatistikler (maç sayısı, gol, asist, rating) değişmez
        return {...p, injured:Math.ceil(newInjured), injSev:newInjSev, val:injVal,
          fatigue:Math.max(0,fatigue-15),
          moral:Math.max(30, moral-2)};
      }

      // ── YORGUNluk SİSTEMİ ────────────────────────────────────
      // Her maçta yorgunluk +20 artar, her hafta -10 azalır (rest)
      // lineup indekslerinden oyuncunun maçta oynayıp oynamadığını belirle
      const playedInMatch=(lineupRef.current||startingXI||[]).some(idx=>idx!==null&&idx!==undefined&&squad[idx]&&squad[idx].id===p.id);
      const fatigueDelta=playedInMatch?20:-10;
      const newFatigue=Math.max(0,Math.min(100,fatigue+fatigueDelta));
      // Yorgunluk OVR'ye etki eder: %100 yorgunluk = -6 OVR
      const fatigueOvrPenalty=Math.round(newFatigue*0.06);

      // Koruyucu antrenman: maç gücünü biraz düşürür ama sakatlık riskini azaltır
      const injMult=(protectTrain?0.5:1.0)*(focus.injMult||1.0)*coachInjMult;
      // Yüksek yorgunluk sakatlık riskini artırır
      const fatiguePenalty=newFatigue>70?6:newFatigue>50?3:0;
      const injuryBase=(age>=33?18:age>=30?12:age>=27?8:5)*injMult;
      const moralPenalty=moral<40?4:0;
      const injuryRoll=Math.random()*100;
      if(injuryRoll<(injuryBase+moralPenalty+fatiguePenalty)/10){
        // Sakatlık ciddiyeti: hafif(1-2h), orta(3-5h), ağır(6-10h)
        const sevRoll=Math.random();
        let severity, weeks;
        if(sevRoll<0.55){severity=1;weeks=1+Math.floor(Math.random()*2);}
        else if(sevRoll<0.85){severity=2;weeks=3+Math.floor(Math.random()*3);}
        else{severity=3;weeks=6+Math.floor(Math.random()*(age>=30?5:3));}
        return {...p, injured:weeks, injSev:severity, fatigue:Math.min(100,newFatigue+10),
          moral:Math.max(20, moral-15),
          seasonGoals:newSeasonGoals,seasonAssists:newSeasonAssists,
          seasonRatings:newSeasonRatings,seasonMatches:newSeasonMatches};
      }

      // ── 2. MORAL SİSTEMİ ─────────────────────────────────────
      let moralDelta=0;
      if(isWin) moralDelta+=8;
      else if(isLoss) moralDelta-=10;
      else moralDelta+=1;
      const moralBaseVal=Math.max(75,coachMoralBase||(focus.moralBase||75));
      moralDelta+=(moralBaseVal-moral)*0.08;
      moral=Math.max(10,Math.min(99,Math.round(moral+moralDelta)));

      // ── 3. GELİŞİM SİSTEMİ ──────────────────────────────────
      const gap=pot-ovr;
      if(gap<=0&&age<32){
        // Potansiyele ulaşmış ama henüz 32 altı: çok nadir tavan aşma
        ovr=Math.random()<0.004?Math.min(99,ovr+1):ovr;
      } else if(gap>0){
        let devRate=0;
        // FM/gerçek dünya referanslı gelişim eğrisi
        // 23 sonrası yavaşlar ama tamamen durmaz — 30+ çok yavaş ama mümkün
        if(age<=19)      devRate=4.5;   // yılda ~1.5 OVR (pirlanta çağ)
        else if(age===20)devRate=3.8;   // ~1.25 OVR
        else if(age===21)devRate=3.2;   // ~1.05 OVR
        else if(age===22)devRate=2.7;   // ~0.90 OVR
        else if(age===23)devRate=2.2;   // ~0.73 OVR (zirveye yaklaşıyor)
        else if(age===24)devRate=1.6;   // ~0.53 OVR
        else if(age===25)devRate=1.1;   // ~0.37 OVR
        else if(age===26)devRate=0.75;  // ~0.25 OVR
        else if(age===27)devRate=0.50;  // ~0.17 OVR
        else if(age===28)devRate=0.32;  // ~0.10 OVR
        else if(age===29)devRate=0.20;  // ~0.07 OVR
        else if(age===30)devRate=0.12;  // ~0.04 OVR (nadir ama mümkün)
        else if(age===31)devRate=0.07;  // ~0.02 OVR
        else if(age===32)devRate=0.03;  // deneyim katkısı — çok nadir
        else             devRate=0;     // 33+: artık gelişim yok

        const moralMult=moral>=85?1.18:moral>=70?1.06:moral>=50?0.92:moral>=35?0.72:0.50;
        const resultMult=isWin?1.08:isLoss?0.93:1.0;
        // gap büyükse daha hızlı
        const gapMult=gap>=15?1.12:gap>=10?1.0:gap>=6?0.72:gap>=3?0.40:0.15;

        // Sezon performans bonusu — gol/asist/rating gelişimi etkiler
        const avgRating=newSeasonRatings.length>0
          ?newSeasonRatings.reduce((s,r)=>s+r,0)/newSeasonRatings.length:0;
        const perfBonus=
          (newSeasonGoals>=10?1.10:newSeasonGoals>=5?1.05:1.0)*
          (newSeasonAssists>=8?1.06:newSeasonAssists>=4?1.03:1.0)*
          (avgRating>=7.5?1.08:avgRating>=6.5?1.02:avgRating>0&&avgRating<5.5?0.94:1.0);

        // Oyuncu antrenörü multiplier — yaşa göre farklı
        const playerCoachMult=age<=21
          ?coachU21DevMult*coachU23DevMult*coachGlobalDevMult  // 21-: tüm genç bonuslar birikim
          :age<=23
            ?coachU23DevMult*coachGlobalDevMult
            :age>=30
              ?coachSeniorDevMult*coachGlobalDevMult
              :coachGlobalDevMult;

        devPoints+=devRate*moralMult*resultMult*gapMult*perfBonus*(0.80+Math.random()*0.20)*(focus.devMult||1.0)*playerCoachMult;

        if(devPoints>=100){
          ovr=Math.min(pot,ovr+1);
          devPoints=devPoints-100;
          const sb=focus.statBonus||{};
          const pUpdated={...p,ovr,devPoints,val};
          if(sb.sht&&p.sht) pUpdated.sht=Math.min(99,(p.sht||60)+1);
          if(sb.spd&&p.spd) pUpdated.spd=Math.min(99,(p.spd||60)+1);
          if(coachSpdBoost&&p.spd) pUpdated.spd=Math.min(99,(pUpdated.spd||p.spd||60)+1);
          if(sb.pas&&p.pas) pUpdated.pas=Math.min(99,(p.pas||60)+1);
          if(sb.def&&p.def) pUpdated.def=Math.min(99,(p.def||60)+1);
          const finalMoral=focus.moralBase?Math.max(moral,focus.moralBase):moral;
          return {...pUpdated, moral:finalMoral, fatigue:newFatigue,
            seasonGoals:newSeasonGoals,seasonAssists:newSeasonAssists,
            seasonRatings:newSeasonRatings,seasonMatches:newSeasonMatches};
        }
      }

      // ── 4. YAŞ & GERİLEME ───────────────────────────────────
      if(age>=34&&Math.random()<0.019){
        ovr=Math.max(ovr-1,50);
        devPoints=0;
      } else if(age>=32&&Math.random()<0.012){
        ovr=Math.max(ovr-1,50);
        devPoints=0;
      } else if(age>=30&&Math.random()<0.006){
        ovr=Math.max(ovr-1,50);
      }

      // ── 5. DİNAMİK PİYASA DEĞERİ GÜNCELLEMESI ──────────────────
      // Her hafta OVR, yaş, moral, istatistik ve form bazlı yeniden hesapla
      {
        const statsScore=(()=>{
          // Oyuncu istatistikleri varsa kalite çarpanı hesapla
          const sht=p.sht||0, pas=p.pas||0, def=p.def||0, spd=p.spd||0;
          const hasStat=sht>0||pas>0||def>0||spd>0;
          if(!hasStat) return 1.0;
          const statAvg=(sht+pas+def+spd)/[sht,pas,def,spd].filter(s=>s>0).length;
          return statAvg>=80?1.12:statAvg>=75?1.07:statAvg>=70?1.03:statAvg>=65?0.98:0.94;
        })();

        const ovrBase=(()=>{
          if(ovr>=90) return 70; if(ovr>=87) return 50; if(ovr>=85) return 38;
          if(ovr>=83) return 28; if(ovr>=80) return 20; if(ovr>=78) return 14;
          if(ovr>=75) return 9;  if(ovr>=73) return 6;  if(ovr>=70) return 4;
          if(ovr>=68) return 2.5;if(ovr>=65) return 1.5;if(ovr>=62) return 0.8;
          if(ovr>=60) return 0.4; return 0.2;
        })();

        const ageMult=(()=>{
          if(age<=21) return 1.25; if(age<=23) return 1.18; if(age<=25) return 1.10;
          if(age<=27) return 1.02; if(age<=29) return 0.90; if(age<=31) return 0.75;
          if(age<=33) return 0.55; if(age<=35) return 0.35; return 0.18;
        })();

        const potMult=(()=>{
          const gap=pot-ovr;
          if(age>28) return 1.0; // yaşlıda potansiyel etkisi yok
          return gap>=15?1.20:gap>=10?1.12:gap>=6?1.06:gap>=3?1.02:1.0;
        })();

        const moralMult=moral>=85?1.05:moral>=65?1.0:moral>=45?0.97:0.93;

        const formMult=isWin?1.02:isLoss?0.98:1.0; // maç sonucu kısa vadeli etki

        // Küçük haftalık rastgele dalgalanma ±%1.5
        const jitter=0.985+Math.random()*0.030;

        const newVal=ovrBase*ageMult*potMult*statsScore*moralMult*formMult*jitter;
        val=Math.max(0.1, parseFloat(newVal.toFixed(2)));
      }

      // ── 5b. SEZON İSTATİSTİKLERİ & PİYASA DEĞERİ BONUS ─────────
      // Maç başına gol/asist piyasa değerini etkiler
      const statsMult=(()=>{
        const avgRating=newSeasonRatings.length>0?newSeasonRatings.reduce((a,b)=>a+b,0)/newSeasonRatings.length:70;
        const goalBonus=newSeasonGoals*0.03;
        const assistBonus=newSeasonAssists*0.015;
        const ratingBonus=avgRating>=80?0.05:avgRating>=75?0.02:avgRating>=70?0:avgRating>=65?-0.02:-0.04;
        return 1+goalBonus+assistBonus+ratingBonus;
      })();
      val=Math.max(0.1, parseFloat((val*statsMult).toFixed(2)));

      return {...p, ovr, devPoints, moral, val, fatigue:newFatigue,
        seasonGoals:newSeasonGoals, seasonAssists:newSeasonAssists,
        seasonRatings:newSeasonRatings, seasonMatches:newSeasonMatches};
    }));

    // ── DB HAFTALIK GELİŞİM — Kullanıcı dışı oyuncular sezon içi gelişir ──
    // Her maçta küçük bir ihtimalle; sezon boyu birikimli etki yaratır
    const _dbTeamsSnap=season.teams||[];
    setDb(prev=>prev.map(p=>{
      const gap=Math.max(0,(p.pot||p.ovr||70)-(p.ovr||70));
      if(gap===0) return p; // potansiyele ulaştı, gelişim yok
      const newAge=p.age;
      // devRate: haftalık ihtimal (sezonluk ~34 maç)
      const weeklyRate=newAge<=19?0.025:newAge<=21?0.018:newAge<=23?0.012
        :newAge<=25?0.007:newAge<=27?0.004:newAge<=29?0.002:0;
      if(weeklyRate===0) return p;
      const liveT=_dbTeamsSnap.find(t=>t.n===p.club);
      const initT=INIT_TEAMS.find(t=>t.n===p.club);
      const cs=liveT?liveT.str:initT?initT.str:p.ovr>=80?75:62;
      const cm=cs>=88?1.40:cs>=82?1.20:cs>=75?1.05:cs>=68?0.95:0.80;
      const yb=newAge<=18?1.20:newAge<=20?1.10:newAge<=22?1.05:1.0;
      const gm=gap>=20?1.25:gap>=15?1.10:gap>=10?1.0:gap>=6?0.80:gap>=3?0.55:0.30;
      const chance=Math.min(0.15, weeklyRate*cm*yb*gm);
      if(Math.random()>chance) return p;
      const newOvr=Math.min(p.pot||70,(p.ovr||70)+1);
      const isGKw=p.pos==="GK";
      const isDefw=["CB","LB","RB","LWB","RWB"].includes(p.pos||"");
      const ovrBasew=newOvr>=94?200:newOvr>=92?150:newOvr>=90?95:newOvr>=88?72:newOvr>=86?55:newOvr>=84?42:newOvr>=82?32:newOvr>=80?23:newOvr>=78?16:newOvr>=75?11:newOvr>=72?7:newOvr>=70?4.5:newOvr>=68?3:newOvr>=65?1.8:newOvr>=62?1:0.5;
      const posMultw=isGKw?0.65:isDefw?0.80:1.0;
      const ageMultw=newAge<=20?0.75:newAge<=22?0.90:newAge<=25?1.00:newAge<=27?0.90:newAge<=29?0.75:newAge<=31?0.55:newAge<=33?0.38:0.25;
      const newVal=Math.max(0.1,Math.round(ovrBasew*posMultw*ageMultw*10)/10);
      return {...p,ovr:newOvr,val:newVal};
    }));
  };

  // ── RAKİP TAKIMLARIN TRANSFER YAPMASI ───────────────────────
  // ══════════════════════════════════════════════════════════════
  // RAKİP AI SİSTEMİ — Her hafta çalışan zeki takım davranışları
  // ══════════════════════════════════════════════════════════════

  // Her takımın haftalık "AI kararı" — transfer, taktik değişim, moral
  const rivalAI=(lgName, weekNum, matchResult)=>{
    const rivalTeams=season.teams.filter(t=>t.lg===lgName&&!t.me);
    if(rivalTeams.length===0) return;

    // Eksik bütçe alanlarını initialize et (eski kayıt uyumu)
    const initBudgetForStr=(str)=>str>=84?80:str>=78?50:str>=72?30:str>=66?18:str>=60?10:6;
    const teamsNeedBudget=rivalTeams.filter(t=>t.budget==null);
    if(teamsNeedBudget.length>0){
      setSeason(prev=>({...prev,teams:prev.teams.map(t=>
        t.budget==null?{...t,budget:initBudgetForStr(t.str||65),spent:0}:t
      )}));
    }

    const myTeam=season.teams.find(t=>t.me);
    const lgTable=[...season.teams].filter(t=>t.lg===lgName).sort((a,b)=>b.pts-a.pts);
    const dateStr=new Date().toLocaleDateString("tr-TR");

    // ══════════════════════════════════════════════════════════════
    // RAKİP AI v3 — Akıllı pozisyon analizi, güçlü transfer baskısı
    // ══════════════════════════════════════════════════════════════

    // ── YARDIMCI: Takım ihtiyaç analizi ──────────────────────────
    const analyzeTeamNeeds=(team, lgTable)=>{
      const rank=lgTable.findIndex(t=>t.n===team.n)+1;
      const total=lgTable.length;
      const str=team.str||65;
      const ppg=(team.pts||0)/Math.max(team.w+team.d+team.l,1);
      const isTitleRace=rank<=2;
      const isEuropeanSpot=rank>=3&&rank<=5;
      const isMidTable=rank>5&&rank<=total-4;
      const isRelZone=rank>=total-3;
      const isDeepRelZone=rank>=total-1;
      const isStrWeak=str<63;
      const isBadForm=ppg<0.9;
      return {rank,total,str,ppg,isTitleRace,isEuropeanSpot,isMidTable,isRelZone,isDeepRelZone,isStrWeak,isBadForm};
    };

    // ── YARDIMCI: Pozisyon önceliği — str ve senaryo bazlı ──────
    const getNeededPositions=(analysis)=>{
      const {isTitleRace,isRelZone,isDeepRelZone,isBadForm,str}=analysis;
      if(isDeepRelZone||isBadForm) return ["GK","CB","CB","CDM","ST"];
      if(isRelZone)                return ["CB","CDM","ST","GK","LB","RB"];
      if(isTitleRace&&str>=75)     return ["ST","CAM","LW","RW","ST"];
      if(isTitleRace)              return ["ST","CAM","CM","LM","RM"];
      return ["ST","CB","CAM","CDM","CM","LM","RM","LB","RB"];
    };

    // ── 1+2. RAKİP TRANSFER AI — tek setDb çağrısı (React batching sorununu önler) ──
    const doRivalTransfers=()=>{
      setDb(prevDb=>{
        let updatedDb=[...prevDb];

        if(isTransferWindow(currentMonth)){
          // Serbest oyuncu 75'i aşarsa — AI takımlar imzalasın (silme değil)
          const freePlayers=updatedDb.filter(p=>p.st==="free"||p.club==="Serbest");
          if(freePlayers.length>75){
            const excess=freePlayers.slice(75);
            excess.forEach(fp=>{
              if(rivalTeams.length===0) return;
              const eligibleTeams=rivalTeams.filter(t=>{
                const str=t.str||65;
                return fp.ovr>=str-10&&fp.ovr<=str+8;
              });
              const tPool=eligibleTeams.length>0?eligibleTeams:rivalTeams;
              const t=tPool[Math.floor(Math.random()*tPool.length)];
              updatedDb=updatedDb.map(p=>p.id===fp.id
                ?{...p,club:t.n,lg:t.lg||"Elit Lig",st:"contracted",ct:1+Math.floor(Math.random()*2)}
                :p);
            });
          }

          rivalTeams.forEach(buyerTeam=>{
            const analysis=analyzeTeamNeeds(buyerTeam,lgTable);
            const {rank,str,isTitleRace,isRelZone,isDeepRelZone,isBadForm,isStrWeak}=analysis;
            let transferProb=0.35;
            if(isDeepRelZone||isBadForm) transferProb=0.80;
            else if(isRelZone)           transferProb=0.68;
            else if(isTitleRace)         transferProb=0.62;
            else if(isStrWeak)           transferProb=0.55;
            if(Math.random()>transferProb) return;
            const teamBudget=buyerTeam.budget!=null?buyerTeam.budget
              :(str>=84?80:str>=78?50:str>=72?30:str>=66?18:str>=60?10:6);
            const teamSpent=buyerTeam.spent||0;
            const remainingBudget=teamBudget-teamSpent;
            if(remainingBudget<=0) return;
            const minOvr=Math.max(55,str-8);
            const maxOvr=Math.min(95,str+12);
            const neededPositions=getNeededPositions(analysis);
            let pick=null;
            for(const neededPos of neededPositions){
              const freeCands=updatedDb.filter(p=>p.st==="free"&&p.ovr>=minOvr&&p.ovr<=maxOvr&&p.pos===neededPos);
              const paidCands=updatedDb.filter(p=>
                (p.st==="listed"||p.st==="expiring"||p.st==="expiring0")&&
                p.ovr>=minOvr&&p.ovr<=maxOvr&&p.pos===neededPos&&(p.val||0)<=remainingBudget
              );
              const cands=[...freeCands,...paidCands];
              if(cands.length>0){
                pick=cands.map(p=>({...p,score:p.ovr+(p.st==="free"?6:0)-(p.val||0)*0.15+(Math.random()*3)}))
                  .sort((a,b)=>b.score-a.score)[0];
                break;
              }
            }
            if(!pick) return;
            const transferFee=pick.st==="free"?0:(pick.val||0);
            updatedDb=updatedDb.map(p=>p.id===pick.id
              ?{...p,club:buyerTeam.n,lg:buyerTeam.lg||p.lg,st:"contracted",ct:Math.max(1,Math.floor(Math.random()*3)+1)}
              :p);
            const strGain=pick.ovr>=str+5?3:pick.ovr>=str?2:1;
            setSeason(prev=>({...prev,teams:prev.teams.map(t=>{
              if(t.n===buyerTeam.n) return{...t,str:Math.min(t.str+strGain,95),spent:(t.spent||0)+transferFee};
              return t;
            })}));
            const scenario=isDeepRelZone?"küme düşmekten kurtulmak için acil transfer":
              isRelZone?"küme düşme baskısını atmak için":
              isTitleRace?"şampiyonluk koşusunu güçlendirmek için":
              isBadForm?"kötü formdan çıkmak için":"kadrosunu güçlendirmek için";
            addNews({type:"rival_transfer",player:pick.n,club:buyerTeam.n,val:transferFee,
              detail:`🔴 ${buyerTeam.n} ${scenario}: ${pick.n}${pick.st==="free"?" (serbest)":""} · ${pick.pos} · OVR ${pick.ovr}`,
              date:dateStr});
          });
        } else {
          // Pencere dışı: sadece serbest oyuncu imzalama
          rivalTeams.forEach(buyerTeam=>{
            const analysis=analyzeTeamNeeds(buyerTeam,lgTable);
            const actProb=analysis.isDeepRelZone?0.80:analysis.isBadForm?0.65:analysis.isRelZone?0.55:analysis.isTitleRace?0.50:0.40;
            if(Math.random()>actProb) return;
            const str=buyerTeam.str||65;
            const minOvr=Math.max(52,str-8);
            const neededPositions=getNeededPositions(analysis);
            let pick=null;
            for(const pos of neededPositions){
              const cands=updatedDb.filter(p=>p.st==="free"&&p.ovr>=minOvr&&p.pos===pos);
              if(cands.length>0){ pick=cands.sort((a,b)=>b.ovr-a.ovr)[0]; break; }
            }
            if(!pick){
              const anyCands=updatedDb.filter(p=>p.st==="free"&&p.ovr>=minOvr);
              if(anyCands.length>0) pick=anyCands.sort((a,b)=>b.ovr-a.ovr)[0];
            }
            if(!pick) return;
            updatedDb=updatedDb.map(p=>p.id===pick.id
              ?{...p,club:buyerTeam.n,lg:buyerTeam.lg||p.lg,st:"contracted",ct:Math.max(1,Math.floor(Math.random()*2)+1)}
              :p);
            const strGain=pick.ovr>=str?2:1;
            setSeason(prev=>({...prev,teams:prev.teams.map(t=>t.n===buyerTeam.n?{...t,str:Math.min(t.str+strGain,95)}:t)}));
            if(analysis.isDeepRelZone||analysis.isBadForm){
              addNews({type:"rival_transfer",player:pick.n,club:buyerTeam.n,val:0,
                detail:`🚨 ${buyerTeam.n} serbest imza: ${pick.n} · ${pick.pos} · OVR ${pick.ovr}`,date:dateStr});
            }
          });
        }

        return updatedDb;
      });
    };
    const doEmergencyFreeAgentSigning=()=>{}; // doRivalTransfers'e entegre edildi

    // ── 3. RAKİP TAKTİK / FORM STRATEJİSİ ────────────────────
    const doRivalTactics=()=>{
      if(weekNum%3!==0) return;
      setSeason(prev=>{
        const lgT=[...prev.teams].filter(t=>t.lg===lgName).sort((a,b)=>b.pts-a.pts);
        return{...prev,teams:prev.teams.map(t=>{
          if(t.me||t.lg!==lgName) return t;
          const analysis=analyzeTeamNeeds(t,lgT);
          const {isDeepRelZone,isRelZone,isTitleRace,isBadForm,isMidTable}=analysis;
          let strDelta=0;
          if(isDeepRelZone){
            strDelta=Math.random()<0.4?1:Math.random()<0.5?0:-1;
          } else if(isRelZone||isBadForm){
            strDelta=Math.random()<0.55?1:0;
          } else if(isTitleRace){
            strDelta=Math.random()<0.65?1:Math.random()<0.4?0:-1;
          } else if(isMidTable){
            strDelta=Math.random()<0.2?1:Math.random()<0.2?-1:0;
          }
          return{...t,str:Math.max(52,Math.min(95,t.str+strDelta))};
        })};
      });
    };

    // ── 4. ZENGİN RAKİP HABERLERİ ────────────────────────────
    const doRivalNews=()=>{
      const lgT=[...season.teams].filter(t=>t.lg===lgName).sort((a,b)=>b.pts-a.pts);
      const myTeamData=season.teams.find(t=>t.me);
      if(!myTeamData) return;
      const myRankNow=lgT.findIndex(r=>r.me)+1;
      const directRivals=lgT.filter((t,i)=>{
        const myIdx=lgT.findIndex(r=>r.me);
        return!t.me&&Math.abs(i-myIdx)<=2;
      }).slice(0,2);
      directRivals.forEach(rival=>{
        const rivalRank=lgT.findIndex(r=>r.n===rival.n)+1;
        if(rivalRank<myRankNow&&weekNum%3===0&&Math.random()<0.38){
          const ptDiff=(lgT[rivalRank-1].pts||0)-(myTeamData.pts||0);
          if(ptDiff>0){
            const urgency=ptDiff>=6?"🚨":ptDiff>=3?"⚠️":"📊";
            addNews({type:"rival_transfer",
              player:`${urgency} ${rival.n} ${ptDiff} puan önde (${rivalRank}. sıra)`,
              club:rival.n,val:0,
              detail:`${urgency} ${rival.n} · ${rival.pts||0} puan · Sıra: ${rivalRank} · ${ptDiff>5?"Kritik fark!":"Takip ediliyor"}`,
              date:dateStr});
          }
        }
      });
      const relTeams=lgT.slice(lgT.length-3);
      relTeams.forEach(t=>{
        if(!t.me&&weekNum%4===0&&Math.random()<0.30){
          const analysis=analyzeTeamNeeds(t,lgT);
          const msg=analysis.isDeepRelZone
            ?`${t.n} son sırada, yönetim kriz toplantısı yapıyor`
            :`${t.n} küme düşme sınırında, baskı artıyor`;
          addNews({type:"rival_transfer",player:`📉 ${msg}`,club:t.n,val:0,
            detail:`📉 ${t.n} · Sıra: ${lgT.findIndex(r=>r.n===t.n)+1} · ${t.pts||0} puan · OVR ${t.str||60}`,date:dateStr});
        }
      });
      if(lgT.length>0&&!lgT[0].me&&weekNum%4===0&&Math.random()<0.30){
        const leader=lgT[0];
        const gap=(leader.pts||0)-(myTeamData.pts||0);
        if(gap>0){
          addNews({type:"rival_transfer",
            player:`🏆 ${leader.n} liderliği sürdürüyor (+${gap} puan)`,
            club:leader.n,val:0,
            detail:`🏆 Lider: ${leader.n} · ${leader.pts||0} puan · OVR ${leader.str||70} · ${gap>8?"Fark açılıyor!":"Sıkı mücadele"}`,
            date:dateStr});
        }
      }
      if(matchResult&&Math.random()<0.28){
        const watcher=directRivals[Math.floor(Math.random()*Math.max(directRivals.length,1))];
        if(watcher){
          const reactions={
            W:[`${watcher.n}: "${clubName} bu formda şampiyon adayı"`,`${watcher.n}: "Onların gücünü saygıyla karşılıyoruz"`],
            L:[`${watcher.n}: "${clubName}'den 3 puan aldık, fark kapandı"`,`${watcher.n}: "${clubName} baskı altında"`],
            D:[`${watcher.n}: "${clubName} bir puan bıraktı, avantaj bizde"`,`${watcher.n}: "Her puan kritik bu sezonda"`]
          };
          const pool=reactions[matchResult.res]||reactions.D;
          addNews({type:"rival_transfer",player:pool[Math.floor(Math.random()*pool.length)],
            club:watcher.n,val:0,detail:`💬 Maç sonrası tepki · ${watcher.n} · Hafta ${weekNum}`,date:dateStr});
        }
      }
    };

    // ── 5. GÖZETİM & KEŞIF SİSTEMİ ──────────────────────────
    const doScoutMyPlayers=()=>{
      if(Math.random()>0.18) return;
      const topPlayers=squad.filter(p=>p.ovr>=68).sort((a,b)=>b.ovr-a.ovr).slice(0,4);
      if(topPlayers.length===0) return;
      const scouted=topPlayers[Math.floor(Math.random()*topPlayers.length)];
      const interestedClubs=rivalTeams.filter(t=>Math.abs((t.str||65)-scouted.ovr)<=12);
      const scoutingClub=(interestedClubs.length>0?interestedClubs:rivalTeams)[
        Math.floor(Math.random()*(interestedClubs.length||rivalTeams.length))];
      if(!scoutingClub||!scouted) return;
      addNews({type:"rival_transfer",
        player:`🔍 ${scoutingClub.n} — ${scouted.n} için ${scouted.ovr>=80?"ciddi ilgi":"ön keşif"}`,
        club:scoutingClub.n,val:scouted.val||0,
        detail:`👁 ${scouted.ovr>=80?"CİDDİ İLGİ":"ÖN KEŞİF"} · ${scouted.pos} · OVR ${scouted.ovr} · ${scoutingClub.n} (OVR ${scoutingClub.str||65})`,
        date:dateStr});
    };

    // ── Tüm AI aksiyonları çalıştır ───────────────────────────
    doRivalTransfers();
    doEmergencyFreeAgentSigning();
    doRivalTactics();
    doRivalNews();
    doScoutMyPlayers();
  };

  // ── Haftalık gelirler ──
    const lgNow=season.league||"1. Lig";
    const lgTeamsNow=[...season.teams].filter(t=>t.lg===lgNow).sort((a,b)=>b.pts-a.pts);
    const rankNow=lgTeamsNow.findIndex(t=>t.me)+1||10;
    const rev=calcWeeklyRevenue(fix,lgNow,rankNow);
    if(rev.stadyum>0) updateFinans(rev.stadyum,"stadyum",fix.comp==="ZTK"?`🏆 Kupa Stadyum - ${fix.opp}`:`Stadyum - ${fix.opp}`);
    if(rev.yayin>0)   updateFinans(rev.yayin,"yayin",`Yayın Geliri H${fix.w}`);
    if(rev.forma>0)   updateFinans(rev.forma,"forma",`Forma Satışı H${fix.w}`);
    if(rev.sponsorluk>0) updateFinans(rev.sponsorluk,"sponsorluk",`Sponsorluk H${fix.w}`);
    // Maaş ödemesi promoteToLeague'de sezon başında yapılır; burada tekrar kesilmez

    const currentMonth=fix.month||"";
    setTimeout(()=>generateIncomingOffers(squad,currentMonth,recentlyTransferred),800);

    // Haftalık oyuncu güncellemeleri + sponsor ödemeleri
    setTimeout(()=>{
      weeklyPlayerUpdate(result,fix);
      rivalAI(season.league||"1. Lig", season.played||0, result);
      processSponsorPayouts();
      // ── DB DOLULUK KONTROLÜ — sadece min kontrolü, oyuncu silme YOK ──
      setDb(prev=>{
        if(prev.length>=3000) return prev;
        const needed=3000+Math.floor(Math.random()*501)-prev.length;
        const newPlayers=Array.from({length:Math.max(0,needed)},()=>{
          const p=genFreeAgent();
          return {...p, st:"contracted", club:"Bağımsız", lg:"Bağımsız", ct:1+Math.floor(Math.random()*2)};
        });
        return [...prev,...newPlayers];
      });
    },200);
  };

  // Transfer sezonu kontrolü: Agustos, Eylul = yaz penceresi; Ocak = kış penceresi
  const TRANSFER_WINDOWS=["Agustos","Eylul","Ocak"];
  const isTransferWindow=(month)=>TRANSFER_WINDOWS.includes(month);
  // Şu anki ay
  const currentMonth=season.fixture&&season.fixture[0]?season.fixture[0].month:"";
  // Transfer yasağı aktifse pencere kapalı sayılır
  const transferWindowOpen=isTransferWindow(currentMonth)&&!transferBan.active;

  // Oyuncunun transfer itibarını hesapla (0-100)
  // İtibar = OVR + durum bonusu + istatistik bonusları
  const calcPlayerPrestige=(pl)=>{
    let base=pl.ovr; // 60-94 arası
    // Durum bonusu: listed/expiring oyuncular daha fazla teklif alır
    if(pl.st==="free") base+=20;
    else if(pl.st==="listed") base+=12;
    else if(pl.st==="expiring"||pl.st==="expiring0"||pl.ct<=1) base+=8;
    else if(pl.st==="contracted"&&pl.ct>=4) base-=10; // uzun sözleşme = transfer zor
    // Yaş etkisi
    if(pl.age<=22) base+=6;       // genç yıldız
    else if(pl.age<=26) base+=3;
    else if(pl.age>=34) base-=8;  // yaşlı = az ilgi
    else if(pl.age>=31) base-=4;
    // Potansiyel bonusu
    if(pl.pot-pl.ovr>=10) base+=5; // yüksek potansiyel
    return Math.max(5,Math.min(95,base));
  };

  // Transfer teklifi üret — yalnızca uygun koşulda çağrılır
  const generateIncomingOffers=(squad,currentMonth,recentlyXferred)=>{
    const window=isTransferWindow(currentMonth);

    // Pace çarpanları
    const PACE_MULT={slow:0.15, normal:1.0, fast:3.5};
    const PACE_MAX ={slow:1,    normal:window?2:1, fast:window?5:3};
    const paceMult=PACE_MULT[transferPace]||1.0;
    const maxOffersCap=PACE_MAX[transferPace]||2;

    // Aktif teklif limitini pace'e göre ayarla
    const activeLimit={slow:1, normal:3, fast:6}[transferPace]||3;
    if(incomingOffers.length>=activeLimit) return;
    // Haftalık max: pencerede 2, dışında 1
    const MAX_OFFERS_PER_WEEK=maxOffersCap;

    const CLUBS_BY_TIER=[
      {min:85,clubs:["Real Madreno","Eastfield City","Bayern FC","Paris SG","Mersey Reds","Northon City","Westbridge FC","Atletico Madreno","FC Cataluña","FC Internazionale","Juventus FC","Dortmund BV"]},
      {min:75,clubs:["Tyneside FC","Midfield Villa","Southgate Hotspur","SSC Partenopei","AC Milanese","Sevilia FC","FC Porto","AFC Ajax","Galatasaray FC","Fenerbahce FC","Besiktas FC","Leverkusen FC"]},
      {min:60,clubs:["Trabzonspor FC","OM Marseille","AS Romasso","SS Lazione","Real Betis","Real Sociedad","Wolfsburg FC","OGC Nice","RC Lens","ACF Fiorentina","SC Braga"]},
      {min:0, clubs:["Maccabi","Olympiakos","Slavia Praha","RSC Anderlecht","Gent","Sturm Graz","Shakhtar","Dinamo Zagreb"]},
    ];

    const alreadyHasOffer=new Set(incomingOffers.map(o=>o.player.id));
    const newOffers=[];

    const MONTH_ORDER=["Temmuz","Agustos","Eylul","Ekim","Kasim","Aralik","Ocak","Subat","Mart","Nisan","Mayis","Haziran"];
    const curIdx=MONTH_ORDER.indexOf(currentMonth||"Temmuz");
    const isWindowPassed=(w)=>{
      if(w==="_nextSeason") return false;
      const wIdx=MONTH_ORDER.indexOf(w);
      return wIdx!==-1&&wIdx<=curIdx;
    };

    squad.forEach(p=>{
      if(newOffers.length>=MAX_OFFERS_PER_WEEK) return;
      if(recentlyXferred&&recentlyXferred.has(p.id)) return;
      if(alreadyHasOffer.has(p.id)) return;
      if(p.pendingSell) return; // Zaten transfer bekleniyor — teklif alma
      if(p.protectedUntil&&!isWindowPassed(p.protectedUntil)) return;

      const ovr=p.ovr||60;
      const isListed=p.st==="listed";
      const isExpiring=p.ct<=1;

      // OVR bazlı teklif ihtimali — gerçekçi dağılım
      // OVR 90+: her haftada %30, düşük OVR oyuncular neredeyse hiç teklif almaz
      let baseChance;
      if(ovr>=90)      baseChance=window?0.30:0.12;
      else if(ovr>=85) baseChance=window?0.18:0.06;
      else if(ovr>=80) baseChance=window?0.10:0.03;
      else if(ovr>=75) baseChance=window?0.05:0.015;
      else if(ovr>=70) baseChance=window?0.025:0.006;
      else if(ovr>=65) baseChance=window?0.010:0.002;
      else             baseChance=window?0.003:0.0005; // OVR<65 çok nadir

      // Liste/sözleşme bitişi bonusu
      if(isListed)   baseChance*=3.0;
      if(isExpiring) baseChance*=2.0;

      const finalChance=Math.min(0.98, baseChance*paceMult);
      if(Math.random()>finalChance) return;

      // Kulüp tier — oyuncu OVR'una uygun rakip gelsin
      const tier=CLUBS_BY_TIER.find(t=>ovr>=t.min)||CLUBS_BY_TIER[CLUBS_BY_TIER.length-1];
      const club=tier.clubs[Math.floor(Math.random()*tier.clubs.length)];

      const valBase=Math.max(0.5,p.val||0.5);
      const discountMult=isListed?(0.65+Math.random()*0.20):(0.80+Math.random()*0.30);
      const offerVal=p.st==="free"?0:Math.max(0.5,parseFloat((valBase*discountMult).toFixed(1)));
      const offerSal=p.sal>0?Math.round(p.sal*(0.95+Math.random()*0.30)):Math.round(40+Math.random()*80);
      const windowLabel=window?"Transfer Penceresi":"Sezon Dışı";

      newOffers.push({id:Date.now()+Math.floor(Math.random()*9999),player:p,club,offerVal,offerSal,
        date:new Date().toLocaleDateString("tr-TR"),windowLabel});
      alreadyHasOffer.add(p.id);
    });

    if(newOffers.length===0) return;

    setIncomingOffers(prev=>{
      const existingIds=new Set(prev.map(o=>o.player.id));
      const fresh=newOffers.filter(o=>!existingIds.has(o.player.id));
      if(fresh.length===0) return prev;
      fresh.forEach(o=>{
        const isListed=o.player.st==="listed";
        addNews({type:"incoming_offer",player:o.player.n,club:o.club,val:o.offerVal,
          detail:`${o.club} → ${o.player.pos} · ${o.player.ovr} OVR · ${o.offerVal>0?o.offerVal+"M€":"Serbest"} · ${o.offerSal}K€/yıl · ${o.windowLabel}${isListed?" · 📉 İndirimli (listede)":""}`,
          date:new Date().toLocaleDateString("tr-TR")});
      });
      return [...prev,...fresh];
    });
  };

  const handleHireCoach=(id,hire)=>{
    const co=COACHES.find(c=>c.id===id);
    if(!co) return;
    if(hire){
      const sameType=coaches.filter(c=>c.hired&&c.type===co.type);
      const maxForType=co.type==="team"?COACHES_MAX_TEAM:COACHES_MAX_PLAYER;
      if(sameType.length>=maxForType){showToast(`Maksimum ${maxForType} ${co.type==="team"?"yardımcı":"oyuncu"} antrenörü!`);return;}
      const costK=Math.round(co.cost*1000);
      updateFinans(costK,"buy",`Antrenör: ${co.n} (${co.cost}M€)`);
      addNews({type:"coach_hire",player:co.n,club:"—",val:co.cost,
        detail:`${co.spec} antrenörü · ${co.cost}M€/yıl`,
        date:new Date().toLocaleDateString("tr-TR")});
    }
    setCoaches(cs=>cs.map(c=>c.id===id?{...c,hired:hire,assignedPlayers:hire?(c.assignedPlayers||[]):[]}:c));

    showToast(hire?`${co.n} kadronuza katıldı! (-${co.cost}M€)`:`${co.n} ayrıldı.`);
  };

  // Oyuncu kadradan çıkınca antrenör listesinden de temizle
  const removePlayerFromCoaches=(playerId)=>{
    setCoaches(cs=>cs.map(c=>({
      ...c,
      assignedPlayers:(c.assignedPlayers||[]).filter(id=>id!==playerId)
    })));
  };

  // Satış/ayrılma sonrası lineup index kaymasını düzelt
  // Oyuncu id bazlı eşleşmeyle gerçek yeni indeksi bulur
  const rebuildLineupAfterRemove=(removedId)=>{
    setTimeout(()=>{
      setSquad(currentSq=>{
        setStartingXI(prevLn=>{
          // Sil: removedId olan slotu null yap; diğerleri için id→yeni index eşle
          const idToNewIdx=new Map(currentSq.map((p,i)=>[p.id,i]));
          return prevLn.map(oldIdx=>{
            if(oldIdx===null||oldIdx===undefined) return null;
            const oldP=currentSq[oldIdx]; // filter sonrası bu index mevcut mu?
            if(!oldP) return null;         // index kaydı: artık başka biri veya yok
            if(oldP.id===removedId) return null; // silinen oyuncu
            return idToNewIdx.get(oldP.id)??null;
          });
        });
        return currentSq;
      });
    },0);
  };

  const handleAssignPlayer=(coachId,playerId,assign)=>{
    const co=coaches.find(c=>c.id===coachId);
    if(!co) return;
    const potBoost=co.playerBonuses?.potBoost||0;

    if(assign){
      // Oyuncuyu antrenör listesine ekle + potBoost uygula
      setCoaches(cs=>cs.map(c=>{
        if(c.id!==coachId) return c;
        const cur=c.assignedPlayers||[];
        if(cur.length>=(c.maxPlayers||7)) return c;
        if(cur.includes(playerId)) return c;
        return {...c,assignedPlayers:[...cur,playerId]};
      }));
      if(potBoost>0){
        setSquad(sq=>sq.map(p=>{
          if(p.id!==playerId) return p;
          const base=p.basePot??p.pot; // orijinal pot'u ilk kez kaydet
          const newPot=Math.min(99,base+potBoost);
          return {...p,basePot:base,pot:newPot};
        }));
      }
    } else {
      // Oyuncuyu antrenör listesinden çıkar + potBoost geri al
      setCoaches(cs=>cs.map(c=>{
        if(c.id!==coachId) return c;
        return {...c,assignedPlayers:(c.assignedPlayers||[]).filter(id=>id!==playerId)};
      }));
      if(potBoost>0){
        setSquad(sq=>sq.map(p=>{
          if(p.id!==playerId) return p;
          const restoredPot=p.basePot??p.pot; // basePot yoksa mevcut pot
          const newOvr=p.ovr>restoredPot?restoredPot:p.ovr; // OVR pot'u geçemez
          return {...p,pot:restoredPot,basePot:undefined,ovr:newOvr};
        }));
      }
    }
  };

  // ── OYUN KAYDETME ──────────────────────────────────────────
  const COACH_SAVES_KEY = "fcym_coach_saves";
  const COACH_MAX_SLOTS = 5;
  const [saveStatus,setSaveStatus]=useState(null);
  const pendingAutoSave=useRef(false); // transfer sonrası otomatik kayıt bayrağı
  const [showCoachSaveModal,setShowCoachSaveModal]=useState(false);
  const [pendingNewSeason,setPendingNewSeason]=useState(null); // sezon bitti, hazır olunca başlat
  const [pendingEuroGroups,setPendingEuroGroups]=useState(null); // kura çekimi — Eylül başında göster
  const [kuraModal,setKuraModal]=useState(null); // {comp:"CL"|"UEFA"|"CON", pots:[[{n,lg,me}]], opps:[{n,lg,pot,home,md,month}]}
  const [altinTopModal,setAltinTopModal]=useState(null); // {winner:{n,club,pos,ovr,val,seasonGoals,seasonAssists,seasonRatings}, isMyPlayer:bool}
  const altinTopVerildi=useRef(-1); // son ödül verilen sezon numarası (-1=henüz verilmedi)
  const [showExitConfirm,setShowExitConfirm]=useState(false);

  const buildCoachSaveData = () => {
    const d = {
    schemaVersion:SAVE_SCHEMA_VERSION,
    gameVersion:GAME_VERSION,
    savedAt:Date.now(),
    clubName,
    league:season.league||"1. Lig",
    week:(()=>{const _lm=season.results.filter(r=>!["ZTK","HAZ","CL","UEFA","CON","SUPERKUPA"].includes(r.comp)).length;return _lm||season.week||1;})(),
    played:season.played||0,
    managerName:`${manager.firstName} ${manager.lastName}`.trim()||"Menajer",
    manager,
    squad:squad.map(p=>({...p})),
    coaches:coaches.map(c=>({...c})),
    db:db.map(p=>({...p})),
    pendingEuroGroups:pendingEuroGroups||null,
    season,formation,lineup:startingXI,autoLineup,
    budget,transferBudget,wageBudget,spent,income,wageSpent,transferPace,
    fStadyum,fForma:fForma,fYayin,fSponsor,fLigOdeme,fKupaPrim,
    weeklyLog:weeklyLog.slice(0,50),
    activeSponsors,pendingSquad,
    news:news.slice(0,50),
    rep,careerStats,fans,mgmt,transferBan,trainFocus,tactic,youth,academyLevel,
    // Transfer kısıtlamaları — yükleme sonrası doğru çalışması için
    recentlyTransferred:[...recentlyTransferred],  // Set → Array olarak kaydet
    weeklyOfferedPlayers,                           // {playerId: weekNum}
    };
    d._checksum = calcSaveChecksum(d);
    return d;
  };

  const getCoachSaves = () => safeLsGet(COACH_SAVES_KEY, []);

  const doCoachSave = (slotId) => {
    // slotId: null=yeni slot, number=uzerine yaz
    setSaveStatus("saving");
    try{
      const saves = getCoachSaves();
      const sid = slotId != null ? Number(slotId) : null;
      if(sid == null && saves.length >= COACH_MAX_SLOTS){
        showToast("Maks "+COACH_MAX_SLOTS+" kayıt doldu. Üzerine yaz veya sil.");
        setSaveStatus(null);
        return;
      }
      const slot = {
        id: sid != null ? sid : Date.now(),
        savedAt: Date.now(),
        data: buildCoachSaveData()
      };
      let newSaves;
      if(sid != null){
        newSaves = saves.map(s => Number(s.id)===sid ? slot : s);
        if(!newSaves.some(s=>Number(s.id)===sid)) newSaves=[...saves,slot];
      } else {
        newSaves = [slot,...saves];
      }
      safeLsSet(COACH_SAVES_KEY, newSaves);
      // fcym_save_index'i de guncelle (MainMenu uyumu icin)
      const key = "fcym_save_slot_"+slot.id;
      safeLsSet(key, slot.data);
      const idx=safeLsGet("fcym_save_index",[]);
      const slotKeys=newSaves.map(s=>"fcym_save_slot_"+s.id);
      safeLsSet("fcym_save_index",slotKeys.slice(0,10));
      showToast(sid!=null?"💾 Kayıt güncellendi!":"💾 Yeni kayıt oluşturuldu!");
      setSaveStatus("saved");
      setTimeout(()=>setSaveStatus(null),2500);
    }catch(e){
      setSaveStatus("error");
      showToast("Kaydetme hatası: "+e.message);
      setTimeout(()=>setSaveStatus(null),2500);
    }
  };

  const doCoachDeleteSlot = (slotId) => {
    try{
      const sid = Number(slotId);
      const saves = getCoachSaves().filter(s=>Number(s.id)!==sid);
      safeLsSet(COACH_SAVES_KEY, saves);
      localStorage.removeItem("fcym_save_slot_"+sid);
      const slotKeys=saves.map(s=>"fcym_save_slot_"+s.id);
      safeLsSet("fcym_save_index",slotKeys);
    }catch(e){}
  };

  // Eski saveGame - geri uyumluluk icin (PageKaydet onLoad vs)
  const saveGame=async()=>{ setShowCoachSaveModal(true); };

  const loadGameData=(rawData)=>{
    try{
      // ── Güvenlik & migrasyon katmanı ──
      const { ok, data, warnings, checksumOk } = validateAndMigrateSave(rawData);
      if(!ok) { showToast("⚠️ Kayıt okunamadı: "+data?.reason); return; }
      if(!checksumOk) {
        showToast("⚠️ Kayıt değiştirilmiş görünüyor — bazı değerler sıfırlandı",5000);
        console.warn("[FCY] Checksum uyuşmazlığı");
      }
      if(warnings.length>0) console.info("[FCY] Yükleme uyarıları:", warnings);

      if(data.manager) setManager(data.manager);
      if(data.clubName) setClubNameRaw(data.clubName);
      if(data.squad) setSquad(data.squad);
      if(data.coaches){
        // Eski kayıtlarda sonradan eklenen antrenörler (ör. Maç Analisti) yok — id bazlı tamamla
        const savedCoaches=Array.isArray(data.coaches)?data.coaches.filter(c=>c&&typeof c==="object"):[];
        const savedIds=new Set(savedCoaches.map(c=>c.id));
        setCoaches([...savedCoaches,...COACHES.filter(c=>!savedIds.has(c.id)).map(c=>({...c}))]);
      }
      if(data.season){
        // ── Fikstür migrasyonu: eski w değerlerini yeni konumlara güncelle ──
        const migrateFixture=(fixture,lg)=>{
          if(!fixture) return fixture;
          const _is38=["İngiliz Ligi","İspanyol Ligi","İtalyan Ligi"].includes(lg||"");
          return fixture.map(f=>{
            if(!f) return f;
            // w > 1000: dinamik olarak yerleştirilmiş (_adjExtra) — dokunma
            if((f.w||0) > 1000) return f;
            // ZTK grup son maçı — eski w değerleri
            if(f.comp==="ZTK"&&f.round&&f.round.startsWith("Grup")&&(f.w===265||f.w===225||f.w===215))
              return {...f,w:2050,month:"Subat"};
            // ZTK KO — güncel değerler (34 ve 38 hafta aynı)
            if(f.comp==="ZTK"&&f.round==="Son 16 — 1. Maç") return {...f,w:2250,month:"Mart"};
            if(f.comp==="ZTK"&&f.round==="Son 16 — 2. Maç") return {...f,w:2430,month:"Mart"};
            if(f.comp==="ZTK"&&f.round==="Çeyrek Final — 1. Maç") return {...f,w:2650,month:"Nisan"};
            if(f.comp==="ZTK"&&f.round==="Çeyrek Final — 2. Maç") return {...f,w:2830,month:"Nisan"};
            if(f.comp==="ZTK"&&f.round==="Yarı Final — 1. Maç") return {...f,w:3050,month:"Mayis"};
            if(f.comp==="ZTK"&&f.round==="Yarı Final — 2. Maç") return {...f,w:3250,month:"Mayis"};
            if(f.comp==="ZTK"&&f.round&&f.round.startsWith("Final")) return {...f,w:3430,month:"Mayis"};
            // CL/UEFA KO — sadece eski format (w < 1000) olan maçları düzelt
            if((f.comp==="CL"||f.comp==="UEFA"||f.comp==="CON")&&f.round==="Son 16 — 1. Maç") return {...f,w:_is38?2750:2330,month:"Mart"};
            if((f.comp==="CL"||f.comp==="UEFA"||f.comp==="CON")&&f.round==="Son 16 — 2. Maç") return {...f,w:_is38?2850:2530,month:"Mart"};
            if((f.comp==="CL"||f.comp==="UEFA"||f.comp==="CON")&&f.round==="Çeyrek Final — 1. Maç") return {...f,w:_is38?3050:2730,month:"Nisan"};
            if((f.comp==="CL"||f.comp==="UEFA"||f.comp==="CON")&&f.round==="Çeyrek Final — 2. Maç") return {...f,w:_is38?3150:2920,month:"Nisan"};
            if((f.comp==="CL"||f.comp==="UEFA"||f.comp==="CON")&&f.round==="Yarı Final — 1. Maç") return {...f,w:_is38?3550:3150,month:"Mayis"};
            if((f.comp==="CL"||f.comp==="UEFA"||f.comp==="CON")&&f.round==="Yarı Final — 2. Maç") return {...f,w:_is38?3650:3350,month:"Mayis"};
            if((f.comp==="CL"||f.comp==="UEFA"||f.comp==="CON")&&f.round==="Final") return {...f,w:_is38?3750:3470,month:"Mayis"};
            return f;
          });
        };
        let migratedSeason={...data.season,
          fixture:sortFixture(migrateFixture(data.season.fixture||[], data.season.league))
        };
        // v4 migrasyonu sezon ortasında eski grup sistemini kaldırdıysa 36 takımlı tabloları şimdi kur
        if(data.pendingEuroGroups&&data.pendingEuroGroups.swiss&&data.pendingEuroGroups.rebuild){
          try{
            const drawn=buildEuroSeasonDraw(migratedSeason,data.pendingEuroGroups);
            migratedSeason={...migratedSeason,...drawn.tables,fixture:sortFixture([...migratedSeason.fixture,...drawn.userFix])};
            data.pendingEuroGroups=null;
          }catch(e){console.warn("Avrupa tablo migrasyonu başarısız",e);data.pendingEuroGroups=null;}
        }
        setSeason(migratedSeason);
      }
      if(data.formation) setFormation(data.formation);
      if(data.lineup) setStartingXI(data.lineup);
      if(data.autoLineup!==undefined) setAutoLineup(data.autoLineup);
      if(data.transferBudget!==undefined) setTransferBudget(data.transferBudget);
      else if(data.budget!==undefined) setTransferBudget(Math.round(data.budget*0.6));
      if(data.wageBudget!==undefined) setWageBudget(data.wageBudget);
      else if(data.budget!==undefined) setWageBudget(Math.round(data.budget*0.4));
      if(data.spent!==undefined) setSpent(data.spent);
      if(data.income!==undefined) setIncome(data.income);
      if(data.wageSpent!==undefined) setWageSpent(data.wageSpent);
      if(data.weeklyLog) setWeeklyLog(data.weeklyLog);
      if(data.activeSponsors) setActiveSponsors(data.activeSponsors);
      if(data.fStadyum!==undefined) setFStadyum(data.fStadyum);
      if(data.fForma!==undefined) setFFOrma(data.fForma);
      if(data.fYayin!==undefined) setFYayin(data.fYayin);
      if(data.fSponsor!==undefined) setFSponsor(data.fSponsor);
      if(data.fLigOdeme!==undefined) setFLigOdeme(data.fLigOdeme);
      if(data.fKupaPrim!==undefined) setFKupaPrim(data.fKupaPrim);
      if(data.pendingSquad) setPendingSquad(data.pendingSquad);
      if(data.news) setNews(data.news);
      if(data.rep) setRep(data.rep);
      if(data.careerStats) setCareerStats(data.careerStats);
      if(data.fans) setFans(data.fans);
      if(data.mgmt) setMgmt(data.mgmt);
      if(data.transferBan) setTransferBan(data.transferBan);
      if(data.trainFocus) setTrainFocus(data.trainFocus);
      if(data.tactic) setTactic(data.tactic);
      if(data.youth) setYouth(data.youth);
      if(data.academyLevel) setAcademyLevel(data.academyLevel);
      if(data.transferPace) setTransferPace(data.transferPace);
      if(data.pendingEuroGroups) setPendingEuroGroups(data.pendingEuroGroups);
      else setPendingEuroGroups(null);
      // ── Transfer kısıtlamaları restore ──
      // recentlyTransferred: Array olarak kaydedilmiş, Set'e çevir
      setRecentlyTransferred(new Set(Array.isArray(data.recentlyTransferred)?data.recentlyTransferred:[]));
      // weeklyOfferedPlayers: haftalık teklif kilidi
      setWeeklyOfferedPlayers(data.weeklyOfferedPlayers&&typeof data.weeklyOfferedPlayers==="object"?data.weeklyOfferedPlayers:{});
      // incomingOffers: yükleme anında sıfırla (modal state'leri temizlensin)
      setIncomingOffers([]);
      setActiveOffer(null);
      // DB yükle — eski kayıtlarda yoksa varsayılanı koru
      if(data.db&&data.db.length>0){
        // Mevcut DB'yi sil, kayıttan geri yükle + eksikse taze DB ile doldur
        const savedDb=data.db.map(p=>({...p}));
        const savedIds=new Set(savedDb.map(p=>p.id));
        // Yeni oyuncuları (DB'nin geri kalanı) savedIds dışından ekle
        setDb(savedDb);
      }
      setOnboardingDone(true);
      setGameScreen("playing");
      setPage("home");
      showToast("✅ Oyun yüklendi: "+data.clubName);
    }catch(e){
      showToast("⚠️ Yükleme hatası!");
    }
  };

  const resetAllGameState=()=>{
    // Oyun verileri
    setSquad(INIT_SQUAD.map(p=>({...p,traits:p.traits||assignTraits(p)})));
    setDb([...DB.map(p=>({...p})),...INIT_FREE_YOUTH]);
    setYouth(INIT_YOUTH.map(p=>({...p,youthYear:p.youthYear||0})));
    setCoaches(COACHES.map(c=>({...c})));
    setFormation("4-4-2");
    // Reset sonrası INIT_SQUAD'a göre en iyi 11'i seç
    {
      const slts=FDATA["4-4-2"];
      const available=[...INIT_SQUAD.map((p,i)=>({...p,sqIdx:i}))];
      const res=Array(11).fill(null);const used2=new Set();
      slts.forEach((s,i)=>{
        const cands=available.filter(p=>!used2.has(p.sqIdx))
          .map(p=>{const pen=posPenalty(p.pos,s.p);if(pen===-99)return null;return{...p,score:p.ovr+pen};})
          .filter(Boolean).sort((a,b)=>b.score-a.score);
        if(cands[0]){res[i]=cands[0].sqIdx;used2.add(cands[0].sqIdx);}
      });
      slts.forEach((_,i)=>{if(res[i]!==null)return;const fb=available.find(p=>!used2.has(p.sqIdx));if(fb){res[i]=fb.sqIdx;used2.add(fb.sqIdx);}});
      setStartingXI(res);
    }
    setTactic({press:1,defLine:1,style:0,wing:1,pressZone:0});
    setTrainFocus({});
    setManager({firstName:"",lastName:"",age:38,avatar:"m1"});
    setClubNameRaw("FC Yildiz");
    // Sezon
    const MO=["Temmuz","Agustos","Eylul","Ekim","Kasim","Aralik","Ocak","Subat","Mart","Nisan","Mayis","Haziran"];
    const mo=(m)=>{const i=MO.indexOf(m);return i===-1?99:i;};
    setSeason({
      week:1,played:0,goals:0,conceded:0,wins:0,draws:0,losses:0,
      league:"1. Lig",
      teams:buildInitTeamsWithStr(),
      results:[],
      fixture:sortFixture([...INIT_PRESEASON_TFF1.map(f=>({...f})),...buildTFF1Fixture().map(f=>({...f})),...buildKupaTFF1(clubName,Date.now()).map(f=>({...f}))]),
      form:[],rankHistory:[],clGroups:null,uefaGroups:null,clTable:null,uefaTable:null,conTable:null,
      kupaSonuc:{group:"Grup A",w:0,d:0,l:0,gf:0,ga:0,pts:0,elendi:false,finalci:false,sampiyon:false},
    });
    // Finans
    setTransferBudget(12000);
    setWageBudget(8000);
    setSpent(0); setIncome(0); setWageSpent(0);
    setFStadyum(0); setFFOrma(0); setFYayin(0); setFSponsor(0); setFLigOdeme(0);
    setWeeklyLog([]);
    setActiveSponsors([]);
    // İlişkiler
    setRep({pts:8,history:[]});
    setFans({happiness:60,attendance:65,trust:50,chants:0,ultras:"nötr",history:[]});
    setMgmt({trust:60,blockedBudget:0,blockReason:"",blockWeeksLeft:0,history:[]});
    setCareerStats({seasons:[],totalW:0,totalD:0,totalL:0,totalGF:0,totalGA:0,totalPts:0,
      totalMatches:0,bestRank:99,bestLeague:"",trophies:{ztk:0,sl:0,cl:0,uefal:0,con:0},pressMoods:[]});
    // UI
    setPendingSquad([]);
    setRecentlyTransferred(new Set());
    setIncomingOffers([]);
    setActiveOffer(null);
    setMatchOverlay(null);
    setPostMatchBasin(null);
    setSeasonEndModal(null);
    setNews([]);
    setOnboardingDone(false);
    // Transfer / müzakere sıfırlama
    setTransferOffer(null);
    setWeeklyOfferedPlayers({});
    setSelectedPlayer(null);
    setReleaseConfirm(null);
    setPage("home");
    setDigerOpen(false);
    setManagerOpen(false);
    setSponsorModal(false);
    setAutoLineup(true);
    setTransferPace("normal");
    setFKupaPrim(0);
    setTransferBan({active:false,reason:"",appliedSeason:"",budgetWarning:false,warningSeason:""});
    setSaveStatus(null);
    setPendingNewSeason(null);
    setPendingEuroGroups(null);
    setKuraModal(null);
    setShowExitConfirm(false);
  };

  // Ana menü göster
  if(gameScreen==="mainmenu") return(
    <MainMenuScreen
      onNewGame={()=>{ resetAllGameState(); setGameScreen("scenario"); }}
      onLoadGame={(data)=>loadGameData(data)}
      onCareerMode={()=>setGameScreen("career_onboarding")}
      onLoadPlayerSave={(player)=>{ setCareerState(player); setGameScreen("career"); }}
    />
  );

  // Senaryo seçim ekranı
  if(gameScreen==="scenario") return(
    <ScenarioScreen
      onSelect={(scenario)=>{ setActiveScenario(scenario); setGameScreen("onboarding"); }}
      onBack={()=>setGameScreen("mainmenu")}
    />
  );

  // Oyuncu Kariyer Onboarding
  if(gameScreen==="career_onboarding") return(
    <CareerOnboardingScreen
      onStart={(player)=>{setCareerState(player);setGameScreen("career");}}
      onBack={()=>setGameScreen("mainmenu")}
    />
  );

  // Oyuncu Kariyer Ana Ekran
  if(gameScreen==="career") return(
    <CareerScreen
      player={careerState}
      onBack={()=>setGameScreen("mainmenu")}
    />
  );

  // Onboarding (yeni oyun)
  if(gameScreen==="onboarding"||!onboardingDone) return(
    <OnboardingScreen onComplete={({manager:m,clubName:cn,league:lg,selectedTeam:selT,isTrLeague:isTr})=>{
      setManager(m);
      setClubName(cn);

      // ── Seçilen takımın GERÇEK KADROSUNU yükle ──────────────────
      const teamDbPlayers=selT?DB.filter(p=>p.club===selT.n):[];
      let initSquadFromTeam=[];
      if(teamDbPlayers.length>=11){
        // DB'den takımın oyuncularını al, en iyi 25'i seç
        initSquadFromTeam=teamDbPlayers
          .sort((a,b)=>b.ovr-a.ovr)
          .slice(0,25)
          .map(p=>({
            ...p,
            moral:75, injured:0, injSev:0, fatigue:0, protectTrain:false, devPoints:0, seasonGoals:0, seasonAssists:0, seasonRatings:[], seasonMatches:0,
            spd:p.spd||Math.round(p.ovr*0.92+rnd(-3,3)),
            sht:p.sht||Math.round(p.ovr*0.88+rnd(-3,3)),
            pas:p.pas||Math.round(p.ovr*0.85+rnd(-3,3)),
            def:p.def||Math.round(p.ovr*0.80+rnd(-3,3)),
            ct:p.ct||3, listed:false, loan:false,
            st:p.st||"contracted",
          }));
      }
      // Eğer DB'de bu takıma ait yeterli oyuncu yoksa varsayılan kadroyu kullan
      const useTeamSquad=initSquadFromTeam.length>=11;
      const finalInitSquad=useTeamSquad?initSquadFromTeam:INIT_SQUAD.map(p=>({...p}));
      setSquad(finalInitSquad);

      // ── Kadro yapısına göre formasyon + oto dizilim uygula ──────
      const initFormation=getTeamFormation(finalInitSquad);
      setFormation(initFormation);
      const initSlots=FDATA[initFormation]||FDATA["4-4-2"];
      const initAvail=[...finalInitSquad.map((p,i)=>({...p,sqIdx:i}))];
      const initRes=Array(11).fill(null); const initUsed=new Set();
      initSlots.forEach((s,i)=>{
        const cands=initAvail
          .filter(p=>!initUsed.has(p.sqIdx)&&!(p.injured||0))
          .map(p=>{const pen=posPenalty(p.pos,s.p);if(pen===-99)return null;return{...p,score:p.ovr+pen};})
          .filter(Boolean).sort((a,b)=>b.score-a.score);
        if(cands[0]){initRes[i]=cands[0].sqIdx;initUsed.add(cands[0].sqIdx);}
      });
      // Fallback: sakatlanma yoksa doldur
      initSlots.forEach((_,i)=>{
        if(initRes[i]!==null)return;
        const fb=initAvail.find(p=>!initUsed.has(p.sqIdx));
        if(fb){initRes[i]=fb.sqIdx;initUsed.add(fb.sqIdx);}
      });
      setStartingXI(initRes);

      // ── İtibar — seçilen takım gücüne + lig'e göre ──────────────
      const teamStr=selT?selT.str:65;
      const initRepPts=calcInitialRep(lg,teamStr);
      setRep({pts:initRepPts,history:[{
        reason:`${cn} ile ${lg}'ye başlangıç (${teamStr} güç)`,
        delta:initRepPts,pts:initRepPts,
        date:new Date().toLocaleDateString("tr-TR"),
      }]});

      // ── Avrupa kupaları (Swiss model): katılımcılar Eylül kurasında güç sıralamasıyla belirlenir ──
      const MO=["Temmuz","Agustos","Eylul","Ekim","Kasim","Aralik","Ocak","Subat","Mart","Nisan","Mayis","Haziran"];
      const mo=(m)=>{const i=MO.indexOf(m);return i===-1?99:i;};
      const _euroPreview=selectEuroQualifiers(INIT_TEAMS.map(t=>selT&&t.n===selT.n&&t.lg===selT.lg?{...t,me:true}:{...t,me:false}),{byStr:true});
      const myEuroPreview=EURO_COMP_LIST.find(c=>_euroPreview[c].some(t=>t.me))||null;

      let ligFix=[], kupaFix=[], preFix=[], euroFix=[];
      if(isTr){
        preFix=lg==="Elit Lig"?INIT_PRESEASON_SL.map(f=>({...f})):INIT_PRESEASON_TFF1.map(f=>({...f}));
        ligFix=lg==="Elit Lig"?buildSLFixture(clubName).map(f=>({...f})):buildTFF1Fixture(clubName).map(f=>({...f}));
        kupaFix=lg==="Elit Lig"?buildKupaSL(clubName,Date.now()).map(f=>({...f})):buildKupaTFF1(clubName,Date.now()).map(f=>({...f}));
        // Seçilen takım TFF1/SL'deyse, fikstürde o takımın adı geçen maçlar önceki varsayılan takımla değiştirilmeli
        if(selT&&selT.lg===lg){
          // Her SL/TFF1 takımı için benzersiz replacement — seçilen takım fikstürden silinip
          // SL_RIVALS/TFF1_RIVALS'ta OLMAYAN bir takımla değiştirilir (çift maç sorununu önler)
          const SL_REPLACEMENT_MAP={
            "Galatasaray FC":  {n:"Giresunspor FC",str:59},
            "Fenerbahce FC":   {n:"Giresunspor FC",str:59},
            "Besiktas FC":     {n:"Giresunspor FC",str:59},
            "Trabzonspor FC":  {n:"Erzurumspor FC",str:58},
            "Basaksehir FC":   {n:"Denizlispor FC",str:60},
            "Kasimpasa FC":    {n:"Zonguldakspor FC",str:57},
            "Sivasspor FC":    {n:"Goztepe FC",str:61},
            "Konyaspor FC":    {n:"Altay FC",str:59},
            "Alanyaspor FC":   {n:"Umraniyespor FC",str:58},
            "Rizespor FC":     {n:"Bandirmaspor FC",str:57},
            "Antalyaspor FC":  {n:"Altinordu FC",str:56},
            "Hatayspor FC":    {n:"Bucaspor FC",str:60},
            "Kayserispor FC":  {n:"Tarsus FK",str:56},
            "Samsunspor FC":   {n:"Kecioren FK",str:55},
            "Ankaragucu FC":   {n:"Tarsus FK",str:55},
            "Gaziantepspor FC":{n:"Elazig FK",str:56},
            "Istanbulspor FC": {n:"Bucaspor FC",str:58},
          };
          const TFF1_REPLACEMENT_MAP={
            "Eyupspor FC":      {n:"Samsunspor B",str:58},
            "Sakaryaspor FC":   {n:"Giresunspor FC",str:57},
            "Bodrumspor FC":    {n:"Samsunspor B",str:57},
            "Goztepe FC":       {n:"Elazigspor FC",str:54},
            "Kocaelispor FC":   {n:"Isparta 32 Spor",str:53},
            "Manisaspor FC":    {n:"Kastamonuspor",str:52},
            "Zonguldakspor FC": {n:"Samsunspor B",str:56},
            "Adanaspor FC":     {n:"Giresunspor FC",str:55},
            "Erzurumspor FC":   {n:"Isparta 32 Spor",str:53},
            "Altinordu FC":     {n:"Elazigspor FC",str:54},
            "Umraniyespor FC":  {n:"Isparta 32 Spor",str:53},
            "Bandirmaspor FC":  {n:"Giresunspor FC",str:56},
            "Denizlispor FC":   {n:"Kastamonuspor",str:53},
            "Sultangazi FC":    {n:"Samsunspor B",str:57},
            "Genclerbirligi FC":{n:"Elazigspor FC",str:55},
            "Kecioren FK":      {n:"Elazigspor FC",str:54},
            "Bucaspor FC":      {n:"Isparta 32 Spor",str:53},
            "Tarsus FK":        {n:"Kastamonuspor",str:52},
            "Elazig FK":        {n:"Giresunspor FC",str:55},
            "Kahramanmarasspor":{n:"Giresunspor FC",str:57},
          };
          const repMap=lg==="Elit Lig"?SL_REPLACEMENT_MAP:TFF1_REPLACEMENT_MAP;
          const replaceName=selT.n;
          const repTeam=repMap[replaceName]||{n:lg==="Elit Lig"?"Adana Demir FC":"Altay FC",str:58};
          ligFix=ligFix.map(f=>f.opp===replaceName?{...f,opp:repTeam.n,str:repTeam.str}:f);
          kupaFix=kupaFix.map(f=>f.opp===replaceName?{...f,opp:repTeam.n,str:repTeam.str}:f);
          preFix=preFix.map(f=>f.opp===replaceName?{...f,opp:repTeam.n,str:repTeam.str}:f);
        }
      } else if(lg==="Portekiz Ligi"){
        preFix=INIT_PRESEASON_PRIMEIRA.map(f=>({...f}));
        ligFix=buildPrimeiraFixture(selT?selT.n:"").map(f=>({...f}));
        kupaFix=[];
        if(selT){
          ligFix=ligFix.map(f=>f.opp===selT.n?{...f,opp:"Paços Ferreira B",str:60}:f);
        }
      } else if(lg==="Hollanda Ligi"){
        preFix=INIT_PRESEASON_EREDIVISIE.map(f=>({...f}));
        ligFix=buildEredivisieFixture(selT?selT.n:"").map(f=>({...f}));
        kupaFix=[];
        if(selT){
          ligFix=ligFix.map(f=>f.opp===selT.n?{...f,opp:"RKC Waalwijk",str:58}:f);
        }
      } else {
        preFix=[];
        ligFix=buildBig5Fixture(lg,selT?selT.n:"");
        kupaFix=[];
      }
      // Avrupa grupları pending'e gider — Eylül'de kura çekimi modalı ile açılır
      // Rozetle aynı liste (INIT_TEAMS güç sıralaması) sabitlenir; kullanıcı takımı kulüp adıyla (cn) ve me:true girer.
      // quals:null bırakılırsa Eylül'de DB-harmanlı güçle yeniden seçilir ve kullanıcı listeden düşebilir.
      const _euroQualsFixed={};
      EURO_COMP_LIST.forEach(c=>{_euroQualsFixed[c]=_euroPreview[c].map(t=>t.me?{...t,n:cn,me:true}:t);});
      setTimeout(()=>setPendingEuroGroups({swiss:true,quals:_euroQualsFixed,myComp:myEuroPreview,force:myEuroPreview,seed:Date.now()%1000003}),500);

      // euroFix eklenmez — Eylül hook'u ekleyecek
      const _endHazOpps2={
        "1. Lig":["Ankaragucu FC","Altay FC","Eskisehirspor"],
        "Elit Lig":["Rizespor FC","Konyaspor FC","Alanyaspor FC"],
        "İngiliz Ligi":["Southampton FC","Luton Town","Sheffield FC"],
        "İspanyol Ligi":["Cadiz CF","Alaves CF","Granada CF"],
        "Alman Ligi":["Heidenheim FC","Darmstadt 98","Holstein Kiel"],
        "İtalyan Ligi":["Empoli FC","Sassuolo FC","Monza FC"],
        "Fransız Ligi":["Metz FC","Lorient FC","Clermont FC"],
        "Hollanda Ligi":["NEC Nijmegen","Excelsior FC","Almere City"],
        "Portekiz Ligi":["Chaves FC","Estoril FC","Portimonense FC"],
        "İngiliz 2. Ligi":["Reading FC","Luton Town","Leicester City"],
      };
      const _hazPool2=_endHazOpps2[lg]||["Ankaragucu FC","Altay FC","Eskisehirspor"];
      const _hazOpp2=_hazPool2[Math.floor(Math.random()*_hazPool2.length)];
      const allFix=sortFixture([...preFix,...ligFix,...kupaFix]);
      allFix.push({w:500,opp:_hazOpp2,home:true,str:58+Math.floor(Math.random()*10),month:"Haziran",comp:"HAZ",round:"Hazırlık"});
      const kupaGrp=lg==="Elit Lig"?"Grup B":"Grup A";

      setSeason(prev=>{
        // TFF1'de FC Yildiz (default me:true) + seçilen takım → çakışma olmaması için
        // Seçilen takım TFF1'deyse, FC Yildiz'i farklı bir takımla değiştir
        const TFF1_REPLACEMENTS=[
          {n:"Altay FC",name:"Altay FC",pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:62,stad:"Altay St.",city:"Izmir",lg:"1. Lig"},
          {n:"Samsunspor B",name:"Samsunspor B",pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:58,stad:"Samsun St.",city:"Samsun",lg:"1. Lig"},
          {n:"Elazigspor FC",name:"Elazigspor FC",pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:55,stad:"Elazig St.",city:"Elazig",lg:"1. Lig"},
          {n:"Kahramanmarasspor",name:"Kahramanmarasspor",pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:56,stad:"KMaras St.",city:"KMaras",lg:"1. Lig"},
        ];
        const isSelTFF1=selT&&selT.lg==="1. Lig";
        const newTeams=prev.teams.map(t=>{
          if(t.me){
            if(isSelTFF1){
              const rep=TFF1_REPLACEMENTS[Math.floor(Math.random()*TFF1_REPLACEMENTS.length)];
              return {...rep};
            }
            // Elit Lig seçilince: eski me:true takımı (FC Yildiz) farklı bir takımla değiştir
            // Böylece 1. Lig'de me:true takım kalmaz
            return {n:"Kahramanmarasspor",name:"Kahramanmarasspor",pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,me:false,str:56,stad:"KMaras St.",city:"KMaras",lg:"1. Lig"};
          }
          if(selT&&t.n===selT.n&&t.lg===selT.lg) return {...t,me:true,n:cn,name:cn};
          // DB'den gerçek str hesapla (zaten buildInitTeamsWithStr ile gelmiş olabilir)
          const dbStr=calcTeamStrFromDB(t.n);
          if(dbStr!==null){
            const blended=Math.round(dbStr*0.60 + t.str*0.40);
            return {...t,str:blended};
          }
          return t;
        });
        return {
          ...prev,
          league:lg,
          teams:newTeams,
          fixture:allFix,
          clGroups:null,
          uefaGroups:null,
          clTable:null,uefaTable:null,conTable:null,
          kupaSonuc:{group:kupaGrp,w:0,d:0,l:0,gf:0,ga:0,pts:0,elendi:false,finalci:false,sampiyon:false},
        };
      });

      // ── Finans: lig bazlı başlangıç bütçesi ─────────────────────
      const LIG_BUDGET={
        "İngiliz Ligi":{tr:120000,w:80000},"İspanyol Ligi":{tr:100000,w:70000},
        "Alman Ligi":{tr:90000,w:60000},"İtalyan Ligi":{tr:95000,w:65000},
        "Fransız Ligi":{tr:70000,w:50000},"Elit Lig":{tr:25000,w:18000},
        "1. Lig":{tr:12000,w:8000},"Hollanda Ligi":{tr:40000,w:28000},
        "Portekiz Ligi":{tr:35000,w:24000},"Hollanda Ligi":{tr:45000,w:32000},
        "İngiliz 2. Ligi":{tr:30000,w:22000},
      };
      const budgetBase=LIG_BUDGET[lg]||{tr:15000,w:10000};
      // Takım gücüne göre bütçe ayarla (%±25)
      const strFactor=0.75+((teamStr-65)/65)*0.5;
      const baseTr=Math.round(budgetBase.tr*strFactor);
      const baseWg=Math.round(budgetBase.w*strFactor);

      // ── Senaryo etkileri ────────────────────────────────────────
      const scen=activeScenario||SCENARIOS[0];
      // Başlangıç maaş yükünü hesapla — bütçe maaştan sonra negatife düşmesin
      const usedSquadForSal=useTeamSquad?initSquadFromTeam:INIT_SQUAD;
      const initSalTotal=usedSquadForSal.reduce((s,p)=>s+(p.sal||0),0);
      // Senaryo bütçesi: maaş yükü + senaryo çarpanı ile elde edilen bütçe (en az maaş+1000)
      const scenTr=Math.max(initSalTotal+1000, Math.round(baseTr*(scen.budgetMult||1.0)));
      const scenWg=Math.round(baseWg*(scen.budgetMult||1.0));
      const scenRep=Math.max(5,Math.min(80,Math.round(calcInitialRep(lg,teamStr)*(scen.repMult||1.0))));

      setTransferBudget(scenTr);
      setWageBudget(scenWg);

      // İtibarı senaryo repStart'ına göre güncelle (onboarding'de zaten set edilmişti, override et)
      if(scen.id!=="standard"){
        setRep({pts:scenRep,history:[{
          reason:`${scen.label} senaryosu — ${cn} ile başlangıç`,
          delta:scenRep,pts:scenRep,
          date:new Date().toLocaleDateString("tr-TR"),
        }]});
      }

      // U23 kısıtını news'e ekle
      if(scen.constraint==="u23only"){
        setTimeout(()=>addNews({
          type:"rival_transfer",
          player:"🔒 Kural: Sadece 23 Yaş Altı",
          club:cn,val:0,
          detail:"Genç Kanlar senaryosu: yalnızca 23 yaş altı oyuncu transfer edebilirsin.",
          date:new Date().toLocaleDateString("tr-TR"),
        }),800);
      }

      // Senaryo başlangıç mesajı
      if(scen.startMessage){
        setTimeout(()=>showToast(scen.startMessage,5000),1200);
      }

      setOnboardingDone(true);
      setGameScreen("playing");
      setTutorialOpen(true);

      // İlk sezon başı maaş kesintisi
      setTimeout(()=>{
        const usedSquad=useTeamSquad?initSquadFromTeam:INIT_SQUAD;
        const initSal=usedSquad.reduce((s,p)=>s+(p.sal||0),0);
        if(initSal>0){
          updateFinans(initSal,"salary_annual",`Sezon başı kadro maaş gideri (${usedSquad.length} oyuncu)`);
          setTimeout(()=>showToast(`💰 Sezon başı maaş: -${initSal}K€ bütçeden düşüldü`,3500),400);
        }
        if(myEuroPreview) setTimeout(()=>showToast(`${EURO_META[myEuroPreview].icon} Tebrikler! ${cn}, ${EURO_META[myEuroPreview].name} lig aşamasında! Kura Eylül'de.`,4000),600);
      },500);
    }} onBack={()=>setGameScreen("mainmenu")}/>
  );

  return(
    <div style={{display:"flex",flexDirection:"column",height:"100dvh",background:C.bg,color:C.wh,
      fontFamily:"system-ui,sans-serif",overflow:"hidden",fontSize:"14px"}}>

      {/* ── HEADER (kaydırılabilir) ── */}
      <div style={{flexShrink:0,background:C.gradNav,borderBottom:"1px solid rgba(77,168,255,0.22)",boxShadow:"0 2px 20px rgba(0,0,0,0.9),0 1px 0 rgba(77,168,255,0.08)"}}>
        {/* Üst satır: başlık + takım bilgisi */}
        <div style={{display:"flex",alignItems:"center",height:46,overflowX:"auto",
          scrollbarWidth:"none",padding:"0 10px",gap:8}}>
          <button onClick={()=>setManagerOpen(true)} style={{background:managerOpen?"rgba(13,74,158,.95)":"rgba(20,98,204,.9)",padding:"0 10px",height:"100%",display:"flex",alignItems:"center",gap:6,
            fontWeight:700,fontSize:".7rem",flexShrink:0,border:"none",cursor:"pointer",fontFamily:"inherit",
            borderRadius:"0 6px 6px 0",transition:"background .2s",boxShadow:managerOpen?"inset 0 0 0 1px rgba(77,168,255,0.3)":"none"}}>
            <ManagerAvatar id={manager.avatar} size={24}/>
            <div style={{textAlign:"left"}}>
              <div style={{fontSize:".58rem",fontWeight:700,letterSpacing:.5,color:"#fff",whiteSpace:"nowrap"}}>{manager.firstName[0]}.{manager.lastName}</div>
              <div style={{fontSize:".42rem",color:"rgba(255,255,255,0.85)",letterSpacing:1}}>MENAJER</div>
            </div>
          </button>
          <div style={{display:"flex",alignItems:"center",gap:7,flexShrink:0}}>
            <div style={{width:30,height:30,borderRadius:8,background:"linear-gradient(135deg,#5ab4ff,#0d2870)",
              border:"1.5px solid rgba(45,143,255,0.5)",display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:"1rem",boxShadow:"0 2px 8px rgba(45,143,255,0.3)"}}>⚽</div>
            <div>
              <div style={{fontSize:".76rem",fontWeight:900,letterSpacing:2,whiteSpace:"nowrap",color:C.wh,fontFamily:"'Barlow Condensed',sans-serif"}}>{clubName.toUpperCase()}</div>
              <div style={{fontSize:".44rem",color:C.ac2,fontWeight:600,letterSpacing:1}}>{season.league||"1. Lig"}</div>
            </div>
          </div>
          {/* İstatistikler */}
          {(()=>{const ligMacSayisi=season.results.filter(r=>r.comp!=="ZTK"&&r.comp!=="HAZ"&&r.comp!=="CL"&&r.comp!=="UEFA"&&r.comp!=="CON"&&r.comp!=="SUPERKUPA").length;const LIG_MAC_MAX={"1. Lig":38,"Elit Lig":34,"İngiliz Ligi":38,"İspanyol Ligi":38,"Alman Ligi":34,"İtalyan Ligi":38,"Fransız Ligi":34,"Hollanda Ligi":34,"Portekiz Ligi":34,"İngiliz 2. Ligi":46};const toplamLigMac=LIG_MAC_MAX[season.league||"1. Lig"]||34;return[["Puan",String(myTeam.pts),C.gd],["Sıra",String(myRank),C.grn2],["Bütçe",(()=>{const b=finans.budget;const abs=Math.abs(b);return (b<0?"-":"")+(abs>=1000?(abs/1000).toFixed(1)+"M€":abs+"K€");})(),C.gd],["Hafta",`${ligMacSayisi}/${toplamLigMac}`,C.dim]];})().map(([l,v,c],i)=>(
            <div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",
              borderLeft:`1px solid rgba(77,166,255,0.22)`,paddingLeft:9,flexShrink:0,gap:1}}>
              <div style={{fontSize:".78rem",fontWeight:800,color:c,whiteSpace:"nowrap",letterSpacing:.5,fontFamily:"'Barlow Condensed',sans-serif"}}>{l}{v?" "+v:""}</div>
              <div style={{fontSize:".40rem",color:C.dim,letterSpacing:1.4,textTransform:"uppercase",fontWeight:600}}>
                {i===0?"PUAN":i===1?"SIRA":i===2?"BÜTÇE":"HAFTA"}
              </div>
            </div>
          ))}
          {activeCoach&&<div style={{borderLeft:`1px solid rgba(77,166,255,0.22)`,paddingLeft:8,flexShrink:0}}>
            <Chip color="green" small>{activeCoach.n}</Chip>
          </div>}
          {/* Kaydet butonu */}
          <div style={{marginLeft:"auto",display:"flex",gap:4,flexShrink:0,paddingLeft:8,borderLeft:`1px solid rgba(77,166,255,0.22)`}}>
            <button onClick={()=>saveGame()} title="Oyunu Kaydet"
              style={{background:saveStatus==="saving"?"rgba(232,184,58,.2)":saveStatus==="saved"?"rgba(46,204,113,.2)":"rgba(45,143,255,.15)",
                border:`1px solid ${saveStatus==="saved"?C.grn:saveStatus==="saving"?C.gd:C.brd}`,
                borderRadius:5,color:saveStatus==="saved"?C.grn2:saveStatus==="saving"?C.gd:C.dim,
                padding:"4px 8px",cursor:"pointer",fontSize:".6rem",fontFamily:"inherit",
                display:"flex",alignItems:"center",gap:3,whiteSpace:"nowrap"}}>
              {saveStatus==="saving"?"⏳":saveStatus==="saved"?"✅":<AppIcon name="save" size={12}/>}
              <span style={{fontSize:".5rem"}}>{saveStatus==="saving"?"Kaydediliyor":saveStatus==="saved"?"Kaydedildi":"Kaydet"}</span>
            </button>
            <ThemeToggleButton compact style={{borderRadius:5,padding:"4px 7px"}}/>
            <button onClick={()=>setShowExitConfirm(true)} title="Ana Menü"
              style={{background:C.surface,border:`1px solid rgba(77,166,255,0.22)`,
                borderRadius:5,color:C.dim,padding:"4px 7px",cursor:"pointer",fontSize:".7rem",fontFamily:"inherit",display:"flex",alignItems:"center"}}>
              <AppIcon name="home" size={13}/>
            </button>
          </div>
        </div>

        {/* Alt satır: NAV sekmeleri */}
        <div style={{position:"relative"}}>
          <div style={{display:"flex",overflowX:"auto",scrollbarWidth:"none",borderTop:`1px solid rgba(77,166,255,0.1)`}}>
            {NAV.map((item,i)=>{
              const isDiger=item.p==="diger";
              const isActive=isDiger?digerOpen||DIGER_PAGES.some(d=>d.p===page):page===item.p;
              return(
                <button key={i} onClick={()=>{
                  if(isDiger){setDigerOpen(o=>!o);}
                  else{setPage(item.p);setDigerOpen(false);}
                }} style={{
                  display:"flex",alignItems:"center",gap:4,padding:"7px 11px",
                  cursor:"pointer",flexShrink:0,fontFamily:"inherit",
                  border:"none",borderBottom:`2.5px solid ${isActive?C.ac2:"transparent"}`,
                  color:isActive?C.wh:C.dim,fontWeight:isActive?700:400,
                  background:isActive?"rgba(77,168,255,0.08)":"transparent",
                  transition:"color .18s,background .18s"}}>
                  <span style={{fontSize:isDiger?".72rem":".82rem",letterSpacing:isDiger?2:0,filter:isActive?"drop-shadow(0 0 4px rgba(77,168,255,0.5))":"none",transition:"filter .18s"}}>{item.i}</span>
                  <span style={{fontSize:".56rem",letterSpacing:.8,textTransform:"uppercase",whiteSpace:"nowrap",fontWeight:isActive?700:500}}>{item.l}</span>
                  {isDiger&&<span style={{fontSize:".5rem",color:isActive?C.ac2:C.dmr}}>{digerOpen?"▲":"▼"}</span>}
                </button>
              );
            })}
          </div>
          {/* Diğer dropdown */}
          {digerOpen&&(
            <div style={{position:"absolute",top:"100%",right:0,zIndex:50,
              background:C.nav,border:`1px solid rgba(77,168,255,0.18)`,borderTop:"none",backdropFilter:"blur(8px)",
              borderRadius:"0 0 6px 6px",boxShadow:"0 8px 24px rgba(0,0,0,.6)",
              minWidth:160,overflow:"hidden"}}>
              {DIGER_PAGES.map((item,i)=>(
                <button key={i} onClick={()=>{setPage(item.p);setDigerOpen(false);}} style={{
                  display:"flex",alignItems:"center",gap:8,width:"100%",padding:"9px 14px",
                  cursor:"pointer",fontFamily:"inherit",border:"none",
                  borderLeft:`3px solid ${page===item.p?C.ac2:"transparent"}`,
                  color:page===item.p?C.wh:C.dim,textAlign:"left",
                  background:page===item.p?"rgba(45,143,255,.15)":"transparent"}}>
                  <span style={{fontSize:".82rem"}}>{item.i}</span>
                  <span style={{fontSize:".64rem",letterSpacing:.5}}>{item.l}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── İÇERİK (tam ekran, sağ+sol panel yok) ── */}
      <div style={{flex:1,minHeight:0,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        {/* OYNA banner - sadece ana sayfada */}
        {/* Kadro Uyarıları */}
        {page==="home"&&(()=>{
          const injured=squad.filter(p=>(p.injured||0)>0);
          const lowMoral=squad.filter(p=>(p.moral??75)<40);
          if(injured.length===0&&lowMoral.length===0) return null;
          return(
            <div style={{margin:"0 10px 8px",display:"flex",flexDirection:"column",gap:4}}>
              {injured.length>0&&(
                <div style={{background:"rgba(232,64,64,.08)",border:"1px solid rgba(232,64,64,.22)",
                  borderRadius:8,padding:"6px 12px",display:"flex",gap:8,alignItems:"center",
                  borderLeft:"3px solid #e84040"}}>
                  <span style={{fontSize:".82rem"}}>🩹</span>
                  <div>
                    <span style={{fontSize:".5rem",fontWeight:700,color:C.red2,letterSpacing:.5}}>SAKATLIK — </span>
                    <span style={{fontSize:".49rem",color:"#e89060"}}>{injured.map(p=>p.n).join(", ")} ({injured.length} oyuncu)</span>
                  </div>
                </div>
              )}
              {lowMoral.length>0&&(
                <div style={{background:"rgba(232,140,40,.07)",border:"1px solid rgba(232,140,40,.2)",
                  borderRadius:8,padding:"6px 12px",display:"flex",gap:8,alignItems:"center",
                  borderLeft:"3px solid #e8922a"}}>
                  <span style={{fontSize:".82rem"}}>😞</span>
                  <div>
                    <span style={{fontSize:".5rem",fontWeight:700,color:C.ora,letterSpacing:.5}}>DÜŞÜK MORAL — </span>
                    <span style={{fontSize:".49rem",color:"rgba(232,140,40,.8)"}}>{lowMoral.map(p=>p.n).join(", ")}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {page==="home"&&nextFix&&(()=>{
          const isHome=nextFix.home;
          const compLabel=nextFix.comp==="HAZ"?"HAZIRLIK ⚽":nextFix.comp==="ZTK"?"🏆 KUPA":nextFix.comp==="CL"?"⭐ AVRUPA ŞAMPİYONLAR KUPASI":nextFix.comp==="UEFA"?"🇪🇺 AVRUPA LİGİ":nextFix.comp==="CON"?"🟢 KONFERANS LİGİ":"H"+(season.results.filter(r=>r.comp!=="ZTK"&&r.comp!=="HAZ"&&r.comp!=="CL"&&r.comp!=="UEFA"&&r.comp!=="CON").length+1);
          const accentCol=nextFix.comp==="CL"?"#ffd060":nextFix.comp==="UEFA"?"#e67e22":nextFix.comp==="CON"?"#2ecc71":nextFix.comp==="ZTK"?"#e84040":nextFix.comp==="HAZ"?"#7c3aed":nextFix.comp==="SUPERKUPA"?"#c0ff00":C.ac2;
          const accentRgb=nextFix.comp==="CL"?"200,160,0":nextFix.comp==="UEFA"?"200,100,0":nextFix.comp==="CON"?"30,160,90":nextFix.comp==="ZTK"?"200,40,40":nextFix.comp==="HAZ"?"26,184,85":nextFix.comp==="SUPERKUPA"?"150,255,50":"45,143,255";
          const myStr=calcMyStr()+coachBonus;
          const diff=myStr-nextFixLive.str;
          const diffCol=diff>5?C.grn2:diff<-5?C.red2:C.gd;
          return(
          <div style={{
            position:"relative",overflow:"hidden",flexShrink:0,
            background:C.gradCard,
            borderBottom:`1px solid rgba(${accentRgb},0.25)`,
            boxShadow:`inset 0 -1px 0 rgba(${accentRgb},0.15)`
          }}>
            {/* Derin saha arkaplanı */}
            <div style={{position:"absolute",inset:0,pointerEvents:"none"}}>
              <svg width="100%" height="100%" style={{opacity:.07}}>
                <defs>
                  <radialGradient id="pitch_glow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="white" stopOpacity="0.15"/>
                    <stop offset="100%" stopColor="white" stopOpacity="0"/>
                  </radialGradient>
                </defs>
                <rect x="0" y="0" width="100%" height="100%" fill="url(#pitch_glow)"/>
                {/* Orta daire */}
                <circle cx="50%" cy="50%" r="28" stroke="white" strokeWidth="1" fill="none"/>
                <circle cx="50%" cy="50%" r="2" stroke="white" strokeWidth="1.5" fill="white"/>
                {/* Orta çizgi */}
                <line x1="50%" y1="0" x2="50%" y2="100%" stroke="white" strokeWidth=".8"/>
                {/* Sol ceza sahası */}
                <rect x="0" y="18%" width="18%" height="64%" stroke="white" strokeWidth=".8" fill="none"/>
                <rect x="0" y="32%" width="7%" height="36%" stroke="white" strokeWidth=".8" fill="none"/>
                {/* Sağ ceza sahası */}
                <rect x="82%" y="18%" width="18%" height="64%" stroke="white" strokeWidth=".8" fill="none"/>
                <rect x="93%" y="32%" width="7%" height="36%" stroke="white" strokeWidth=".8" fill="none"/>
              </svg>
            </div>
            {/* Accent glow üstten */}
            <div style={{position:"absolute",top:0,left:0,right:0,height:2,
              background:`linear-gradient(90deg,transparent 0%,rgba(${accentRgb},0.9) 50%,transparent 100%)`}}/>
            {/* Sol renk çizgisi */}
            <div style={{position:"absolute",left:0,top:0,bottom:0,width:3,
              background:`linear-gradient(180deg,transparent,rgba(${accentRgb},.8),transparent)`}}/>
            {/* İçerik */}
            <div style={{padding:"10px 14px 10px 17px",display:"flex",alignItems:"center",gap:10,position:"relative"}}>
              <div style={{flex:1,minWidth:0}}>
                {/* Üst etiket */}
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:5}}>
                  <div style={{
                    background:`rgba(${accentRgb},0.12)`,border:`1px solid rgba(${accentRgb},0.35)`,
                    borderRadius:3,padding:"1px 6px",
                    fontSize:".38rem",fontWeight:800,color:accentCol,letterSpacing:1.5,textTransform:"uppercase"
                  }}>SONRAKİ MAÇ</div>
                  <div style={{fontSize:".38rem",color:C.dmr,fontWeight:600,letterSpacing:1}}>
                    {compLabel} · {nextFix.month.toUpperCase()}
                  </div>
                </div>
                {/* Takımlar */}
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  {/* Bizim takım */}
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:".78rem",fontWeight:900,color:C.wh,letterSpacing:.3,
                      overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",
                      textShadow:`0 0 20px rgba(${accentRgb},0.4)`}}>{clubName}</div>
                    <div style={{display:"flex",alignItems:"center",gap:4,marginTop:2}}>
                      <span style={{fontSize:".4rem",fontWeight:700,
                        color:isHome?C.grn2:C.dim,letterSpacing:.8,
                        background:isHome?"rgba(26,184,85,0.12)":"rgba(120,152,192,0.1)",
                        border:`1px solid ${isHome?"rgba(26,184,85,0.3)":"rgba(120,152,192,0.2)"}`,
                        borderRadius:2,padding:"0px 4px"}}>{isHome?"🏠 EV":"✈️ DEP"}</span>
                      <span style={{fontSize:".4rem",color:C.dmr}}>GÜÇ</span>
                      <span style={{fontSize:".44rem",fontWeight:800,color:accentCol}}>{myStr}</span>
                    </div>
                  </div>
                  {/* VS + fark */}
                  <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:1,flexShrink:0}}>
                    <div style={{
                      background:C.surfaceHover,border:`1px solid ${C.brd}`,
                      borderRadius:4,padding:"2px 7px",
                      fontSize:".5rem",fontWeight:900,color:C.dim,letterSpacing:2
                    }}>VS</div>
                    <div style={{fontSize:".36rem",fontWeight:700,color:diffCol}}>
                      {diff>0?`+${diff}`:diff===0?"═":diff}
                    </div>
                  </div>
                  {/* Rakip */}
                  <div style={{flex:1,minWidth:0,textAlign:"right"}}>
                    <div style={{fontSize:".78rem",fontWeight:900,color:C.wh,letterSpacing:.3,
                      overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{nextFix.opp}</div>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"flex-end",gap:4,marginTop:2}}>
                      <span style={{fontSize:".4rem",color:C.dmr}}>GÜÇ</span>
                      <span style={{fontSize:".44rem",fontWeight:800,
                        color:nextFixLive.str>=80?C.red2:nextFixLive.str>=70?C.gd:C.dim}}>{nextFixLive.str}</span>
                    </div>
                  </div>
                </div>
              </div>
              {/* OYNA butonu */}
              <button onClick={()=>{ if(skipPreMatch) setMatchOverlay(nextFix); else setPreMatch(nextFix); }} style={{
                background:`linear-gradient(135deg,rgba(${accentRgb},1),rgba(${accentRgb},0.8))`,
                boxShadow:`0 6px 24px rgba(${accentRgb},0.6), inset 0 1px 0 rgba(255,255,255,0.2)`,
                border:`1px solid rgba(${accentRgb},0.7)`,
                color:"#fff",fontSize:".66rem",fontWeight:900,letterSpacing:2,
                padding:"12px 18px",cursor:"pointer",borderRadius:10,flexShrink:0,
                whiteSpace:"nowrap",textShadow:"0 1px 4px rgba(0,0,0,.6)",
                display:"flex",alignItems:"center",gap:6,
                animation:"pulse 2s ease infinite"
              }}><span style={{fontSize:"1rem"}}>▶</span>OYNA</button>
            </div>
          </div>
          );
        })()}
        {/* ── YENİ SEZON HAZIR BANNER ── */}
        {pendingNewSeason&&season.fixture.length===0&&(
          <div style={{
            flexShrink:0,display:"flex",alignItems:"center",gap:10,
            padding:"8px 14px",
            background:"linear-gradient(135deg,rgba(26,110,216,.25),rgba(36,133,255,.15))",
            borderBottom:"2px solid rgba(77,166,255,.4)",
            borderTop:"1px solid rgba(77,166,255,.2)",
          }}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:".54rem",fontWeight:800,color:C.ac2,letterSpacing:.5}}>
                {pendingNewSeason.promoted?(pendingNewSeason.league==="İngiliz Ligi"?"🏆 Yeni sezon hazır — İngiliz Ligi":"🏆 Yeni sezon hazır — Süper Lig"):pendingNewSeason.relegated?(pendingNewSeason.league==="İngiliz 2. Ligi"?"⬇ Yeni sezon hazır — İngiliz 2. Ligi":"⬇ Yeni sezon hazır — TFF 1. Lig"):"⚽ Yeni sezon başlatmaya hazır"}
              </div>
              <div style={{fontSize:".42rem",color:C.dmr,marginTop:1}}>İstediğin kadar istatistiklere göz at, hazır olunca başlat</div>
            </div>
            <button onClick={()=>{
              promoteToLeague(pendingNewSeason.league,pendingNewSeason.tffTable,pendingNewSeason.slTable);
              // Şampiyon kayıtlarını yeni sezon başladıktan SONRA sıfırla
              // (promoteToLeague içinde Şampiyonlar Kalkanı için okundu, artık temizlenir)
              setCareerStats(prev=>({...prev,lastClChampion:"",lastUefaChampion:""}));
              setPendingNewSeason(null);
            }} style={{
              flexShrink:0,padding:"7px 16px",
              background:pendingNewSeason.promoted?"linear-gradient(135deg,#27ae60,#2ecc71)":pendingNewSeason.relegated?"linear-gradient(135deg,#922b21,#e74c3c)":"linear-gradient(135deg,#1a6ed8,#2485ff)",
              border:"none",color:"#fff",fontSize:".6rem",fontWeight:800,
              cursor:"pointer",borderRadius:8,fontFamily:"inherit",letterSpacing:.5,
              boxShadow:"0 3px 12px rgba(36,133,255,.35)"
            }}>▶ YENİ SEZON</button>
          </div>
        )}
        {/* Sayfa içeriği - TAM EKRAN */}
        <div style={{flex:1,display:"flex",minHeight:0,overflow:"hidden"}}
          onClick={()=>digerOpen&&setDigerOpen(false)}>
          {page==="diger" ? <PageDigerMenu onSelect={(p)=>{setPage(p);setDigerOpen(false);}} currentPage={page}/>
            : page==="home"       ? <PageHome season={season} clubName={clubName} activeScenario={activeScenario} squad={squad} careerStats={careerStats} db={db}/>
            : page==="kadro"      ? <PageKadro squad={squad} onSelectPlayer={setSelectedPlayer} clubName={clubName}/>
            : page==="fikstur"    ? <PageFikstur season={season} clubName={clubName}/>
            : page==="formasyon"  ? <PageFormasyonTaktik squad={squad} coaches={coaches} formation={formation} setFormation={setFormation} lineup={startingXI} setLineup={setStartingXI} autoLineup={autoLineup} setAutoLineup={setAutoLineup} tactic={tactic} setTactic={setTactic} nextFixture={(()=>{const nf=season.fixture&&season.fixture[0]?season.fixture[0]:null;if(!nf)return null;const liveStr=(season.teams.find(t=>t.n===nf.opp)?.str)||nf.str;return{...nf,str:liveStr};})()}  myStr={calcMyStr()} initialTab={formasyonInitTab} onInitialTabUsed={()=>setFormasyonInitTab("formasyon")} />
            : page==="antrenman"  ? <PageAntrenman coaches={coaches} onHire={handleHireCoach} onAssign={handleAssignPlayer} squad={squad} trainFocus={trainFocus} setTrainFocus={setTrainFocus} setSquad={setSquad}/>
            : page==="transfer"   ? <PageTransfer db={db} onAction={showToast} onAddToSquad={(p)=>{handleAddToSquad(p,"db");}} addNews={addNews} rep={rep} updateRep={updateRep} league={season.league||"1. Lig"} finans={finans} onMakeOffer={(pl)=>{
                if(squad.length>=MAX_SQUAD){showToast(`⛔ Kadro dolu! Maksimum ${MAX_SQUAD} oyuncu. Önce birini sat veya bırak.`,4000);return;}
                const offeredWeek=weeklyOfferedPlayers[pl.id];
                if(offeredWeek!==undefined && offeredWeek===season.week){
                  showToast(`⏳ ${pl.n} için bu hafta zaten teklif yapıldı. Sonraki haftayı bekle.`,3500);
                  return;
                }
                setTransferOffer(pl);
              }} transferWindowOpen={transferWindowOpen} currentMonth={currentMonth} recentlyTransferred={recentlyTransferred} weeklyOfferedPlayers={weeklyOfferedPlayers} currentWeek={season.week} pendingSquad={pendingSquad} squadFull={squad.length>=MAX_SQUAD} squadCount={squad.length} transferPace={transferPace} onPaceChange={setTransferPace} scenarioConstraint={activeScenario?.constraint||null}/>
            : page==="yetenek"    ? <PageYetenek onAction={showToast} squad={squad} youth={youth} clubName={clubName} squadFull={squad.length>=MAX_SQUAD} squadCount={squad.length} academyLevel={academyLevel} setAcademyLevel={setAcademyLevel} finans={finans} updateFinans={updateFinans} onDismissYouth={(id)=>setYouth(prev=>prev.filter(p=>p.id!==id))} onAddToSquad={(p)=>{
              if(squad.length>=MAX_SQUAD){showToast(`⛔ Kadro dolu! Maksimum ${MAX_SQUAD} oyuncu. Önce birini sat veya bırak.`,4000);return;}
              handleAddToSquad(p,"youth");addNews({type:"youth_promoted",player:p.n,club:clubName+" Altyapı",val:calcYouthPlayerVal(p),detail:`${p.age} yaşında, POT ${p.pot}`,date:new Date().toLocaleDateString("tr-TR")});showToast(p.n+" A takımına alındı!");}}/>            : page==="rehber"     ? (()=>{setTimeout(()=>{setTutorialOpen(true);setPage("home");},0);return null;})()
            : page==="ayarlar"   ? <PageAyarlar transferPace={transferPace} onPaceChange={setTransferPace} skipPreMatch={skipPreMatch} onSkipPreMatchChange={setSkipPreMatch}/>
            : page==="kaydet"     ? <PageKaydet season={season} squad={squad} coaches={coaches} youth={youth} db={db} clubName={clubName} onLoad={(d)=>loadGameData(d)}
                transferBudget={transferBudget} wageBudget={wageBudget} spent={spent} income={income} wageSpent={wageSpent}
                fStadyum={fStadyum} fForma={fForma} fYayin={fYayin} fSponsor={fSponsor} fLigOdeme={fLigOdeme} fKupaPrim={fKupaPrim}
                weeklyLog={weeklyLog} activeSponsors={activeSponsors} pendingSquad={pendingSquad}
                formation={formation} lineup={startingXI} autoLineup={autoLineup} tactic={tactic} trainFocus={trainFocus} transferPace={transferPace}
                rep={rep} careerStats={careerStats} fans={fans} mgmt={mgmt} transferBan={transferBan}
                news={news} manager={manager} pendingEuroGroups={pendingEuroGroups}/>
            : page==="haberler"   ? <PageHaberler news={news} season={season}/>
            : page==="finans"     ? <PageFinans finans={finans} squad={squad} coaches={coaches} clubName={clubName} onAcceptSponsor={acceptSponsor} rep={rep} league={season.league||"1. Lig"}/>
            : page==="istatistik" ? <PageIstatistik season={season} squad={squad} clubName={clubName} careerStats={careerStats} pendingEuroGroups={pendingEuroGroups} db={db}/>
            : page==="basin"      ? <PageBasin season={season} squad={squad} clubName={clubName} fans={fans} updateFans={updateFans} addNews={addNews} rep={rep} mgmt={mgmt} updateMgmt={updateMgmt}/>
            : page==="taraftar"   ? <PageIliskiler fans={fans} updateFans={updateFans} season={season} clubName={clubName} addNews={addNews} mgmt={mgmt} updateMgmt={updateMgmt}/>
            : page==="takimlar"   ? <PageTakimlar season={season} clubName={clubName} db={db} squad={squad}/>
            : page==="itibar"     ? <PageItibar rep={rep} league={season.league||"1. Lig"}/>
            : page==="takim_adi"  ? <PageTakimAdi clubName={clubName} setClubName={setClubName}/>
            : null}
        </div>

      </div>

      {/* ── STATUS BAR ── */}
      <div style={{height:22,background:C.nav,borderTop:`1px solid rgba(77,166,255,0.22)`,
        display:"flex",alignItems:"center",overflowX:"auto",scrollbarWidth:"none",
        padding:"0 10px",gap:10,flexShrink:0}}>
        {(()=>{const ligMac=season.results.filter(r=>r.comp!=="ZTK"&&r.comp!=="HAZ"&&r.comp!=="CL"&&r.comp!=="UEFA"&&r.comp!=="CON"&&r.comp!=="SUPERKUPA").length;const LIG_MAC_MAX2={"1. Lig":38,"Elit Lig":34,"İngiliz Ligi":38,"İspanyol Ligi":38,"Alman Ligi":34,"İtalyan Ligi":38,"Fransız Ligi":34,"Hollanda Ligi":34,"Portekiz Ligi":34,"İngiliz 2. Ligi":46};const topMac=LIG_MAC_MAX2[season.league||"1. Lig"]||34;return[`● ${clubName.toUpperCase()}`,`P: ${myTeam.pts}`,`Sıra: ${myRank}`,`H: ${ligMac}/${topMac}`,`W:${season.wins} D:${season.draws} L:${season.losses}`];})().map((v,i)=>(
          <span key={i} style={{fontSize:".5rem",letterSpacing:.8,color:C.dim,flexShrink:0,
            borderLeft:i>0?`1px solid rgba(77,166,255,0.22)`:"",paddingLeft:i>0?8:0}}>{v}</span>
        ))}
        <div style={{flex:1,display:"flex",justifyContent:"flex-end",gap:3}}>
          {season.form.slice(-6).map((f,i)=>(
            <div key={i} style={{width:14,height:14,borderRadius:2,display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:".44rem",fontWeight:700,
              background:f==="W"?"rgba(39,174,96,.25)":f==="D"?"rgba(200,153,42,.2)":"rgba(192,57,43,.2)",
              color:f==="W"?C.grn2:f==="D"?C.gd:C.red2}}>{f}</div>
          ))}
        </div>
      </div>

      {/* ── OVERLAY'LER ── */}
      {matchOverlay&&(()=>{
        // Canlı str: rivalAI'ın güncellediği season.teams değerini kullan, yoksa fixture.str
        const liveOppStr=(season.teams.find(t=>t.n===matchOverlay.opp)?.str)||matchOverlay.str;
        const liveFixture={...matchOverlay, str:liveOppStr};
        const isDerbyLive=checkIsDerby(clubName,matchOverlay.opp||"");
        const derbyBonus=isDerbyLive?3:0; // Derbi maçında +3 motivasyon bonusu
        const scoutRep=getScoutReport(matchOverlay.opp,liveOppStr,coaches,matchOverlay.w);
        return <MatchOverlay fixture={liveFixture} coachBonus={coachBonus+derbyBonus} tacticBonus={calcTacticBonus(tactic,liveOppStr,matchOverlay.home,scoutRep.trueStyle,scoutRep.amp)} myStr={calcMyStr()} onFinish={handleMatchFinish} clubName={clubName} squad={squad} lineup={startingXI} formation={formation}/>;
      })()}
      {preMatch&&!matchOverlay&&(()=>{
        const pmStr=(season.teams.find(t=>t.n===preMatch.opp)?.str)||preMatch.str;
        const pmFix={...preMatch,str:pmStr};
        return <PreMatchModal fix={pmFix} report={getScoutReport(preMatch.opp,pmStr,coaches,preMatch.w)}
          tactic={tactic} danger={getDangerPlayer(db,preMatch.opp)} myStr={calcMyStr()}
          onTactics={()=>{setPreMatch(null);setFormasyonInitTab("taktik");setPage("formasyon");}}
          onStart={()=>{const f=preMatch;setPreMatch(null);setMatchOverlay(f);}}
          onClose={()=>setPreMatch(null)}
          onSkipForever={()=>{const f=preMatch;setSkipPreMatch(true);setPreMatch(null);setMatchOverlay(f);}}/>;
      })()}
      {postMatchBasin&&<PostMatchBasinModal
        fix={postMatchBasin.fix}
        result={postMatchBasin.result}
        clubName={clubName}
        fans={fans}
        mgmt={mgmt}
        updateFans={updateFans}
        updateMgmt={updateMgmt}
        addNews={addNews}
        onClose={()=>setPostMatchBasin(null)}
      />}

      {/* Gelen teklif bildirimi */}
      {incomingOffers.length>0&&!activeOffer&&(
        <div style={{position:"fixed",bottom:toast?60:6,left:"50%",transform:"translateX(-50%)",
          zIndex:200,display:"flex",alignItems:"center",gap:8,
          background:C.gradCard,
          border:`1px solid ${C.gd}`,borderRadius:6,padding:"7px 12px",
          boxShadow:"0 4px 20px rgba(0,0,0,.7)",minWidth:260,maxWidth:340}}>
          <span style={{fontSize:"1rem"}}>📨</span>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:2}}>
              <span style={{fontSize:".5rem",color:C.gd,textTransform:"uppercase",letterSpacing:1.5,fontWeight:700}}>Gelen Teklif</span>
              {incomingOffers[0].windowLabel&&<span style={{fontSize:".4rem",padding:"1px 5px",borderRadius:3,
                background:"rgba(232,184,58,.15)",color:C.gd,border:"1px solid rgba(232,184,58,.3)"}}>
                {incomingOffers[0].windowLabel}
              </span>}
            </div>
            <div style={{fontSize:".64rem",color:C.wh,fontWeight:600,
              overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
              {incomingOffers[0].club} → {incomingOffers[0].player.n}
            </div>
            <div style={{fontSize:".52rem",color:C.dim}}>
              {incomingOffers[0].offerVal>0?incomingOffers[0].offerVal+"M\u20ac":"Serbest"} · {incomingOffers[0].offerSal}K\u20ac/yıl
            </div>
          </div>
          <button onClick={()=>setActiveOffer(incomingOffers[0])}
            style={{background:`linear-gradient(135deg,${C.grn},${C.grn2})`,border:"none",
              color:"#fff",fontSize:".6rem",fontWeight:700,padding:"5px 9px",
              cursor:"pointer",borderRadius:3,fontFamily:"inherit",whiteSpace:"nowrap"}}>
            Görüşme
          </button>
          <button onClick={()=>setIncomingOffers(prev=>prev.slice(1))}
            style={{background:"rgba(232,64,64,.18)",border:`1px solid ${C.red}`,
              color:C.red2,fontSize:".66rem",padding:"4px 7px",
              cursor:"pointer",borderRadius:3,fontFamily:"inherit"}}>✕</button>
        </div>
      )}

      {/* Gelen teklif pazarlık modal */}
      {activeOffer&&(
        <div style={{position:"fixed",inset:0,zIndex:300,background:"rgba(0,0,0,.75)",
          display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
          <IncomingOfferModal
            offer={activeOffer}
            onAccept={(offer)=>{
              if(!transferWindowOpen){
                // Pencere kapalı: oyuncu kadroda kalır, pencere açılınca ayrılır
                setPendingSquad(prev=>[...prev.filter(x=>x.player?.id!==offer.player.id),{player:offer.player,type:"sell",club:offer.club,val:offer.finalVal||offer.offerVal}]);
                setSquad(sq=>sq.map(p=>p.id===offer.player.id?{...p,listed:true,pendingSell:true}:p));
                addNews({type:"transfer_out",player:offer.player.n,club:offer.club,
                  val:offer.finalVal||offer.offerVal,
                  detail:`⏳ ${offer.club} anlaştı, transfer penceresi açılınca ayrılacak · ${offer.player.pos} · ${offer.player.ovr} OVR`,
                  date:new Date().toLocaleDateString("tr-TR")});
                showToast("⏳ "+offer.player.n+" anlaştı, transfer penceresi açılınca ayrılacak!");
              } else {
                // Pencere açık: hemen transfer
                setSquad(sq=>sq.filter(p=>p.id!==offer.player.id));
                removePlayerFromCoaches(offer.player.id);
                const sellVal=(offer.finalVal||offer.offerVal||0)*1000;
                updateFinans(sellVal,"sell");
                updateFinans(offer.player.sal||20,"salary_remove");
                addNews({type:"transfer_out",player:offer.player.n,club:offer.club,
                  val:offer.finalVal||offer.offerVal,
                  detail:`${offer.club} → ${offer.player.pos} · ${offer.player.ovr} OVR · ${offer.finalVal||offer.offerVal}M€`,
                  date:new Date().toLocaleDateString("tr-TR")});
                showToast(offer.player.n+" "+offer.club+"'e transfer oldu!");
              }
              setIncomingOffers(prev=>prev.filter(o=>o.id!==offer.id));
              setActiveOffer(null);
            }}
            onReject={(offer)=>{
              addNews({type:"offer_rejected",player:offer.player.n,club:offer.club,val:0,
                detail:offer.club+" teklifini reddettiniz",date:new Date().toLocaleDateString("tr-TR")});
              showToast(offer.club+" teklifi reddedildi.");
              setIncomingOffers(prev=>prev.filter(o=>o.id!==offer.id));
              setActiveOffer(null);
            }}
            onClose={()=>setActiveOffer(null)}
            squad={squad}
          />
        </div>
      )}

      {selectedPlayer&&<PlayerModal player={selectedPlayer} onClose={()=>setSelectedPlayer(null)}
        onList={id=>{
          setSquad(sq=>{
            const newSq=sq.map(p=>p.id===id?{...p,listed:!p.listed}:p);
            const curMonth=season.fixture&&season.fixture[0]?season.fixture[0].month:"";
            const inWindow=TRANSFER_WINDOWS.includes(curMonth);
            if(inWindow) setTimeout(()=>generateIncomingOffers(newSq,curMonth,recentlyTransferred),1500);
            return newSq;
          });
          const curMonth=season.fixture&&season.fixture[0]?season.fixture[0].month:"";
          const inWindow=TRANSFER_WINDOWS.includes(curMonth);
          setSelectedPlayer(null);
          showToast(inWindow?"Transfer listesi güncellendi! Pencere açık, teklifler gelebilir.":"Transfer listesi güncellendi. Transfer penceresi kapalı.");}}
        onLoan={id=>{
          setSquad(sq=>{
            const newSq=sq.map(p=>p.id===id?{...p,loan:!p.loan}:p);
            const curMonth=season.fixture&&season.fixture[0]?season.fixture[0].month:"";
            if(TRANSFER_WINDOWS.includes(curMonth)) setTimeout(()=>generateIncomingOffers(newSq,curMonth,recentlyTransferred),1500);
            return newSq;
          });
          setSelectedPlayer(null);
          showToast("Kiralama durumu güncellendi.");}}
        onRenew={(p,years,newSal)=>{
          setSquad(sq=>sq.map(pl=>pl.id===p.id?{...pl,ct:years,sal:newSal,st:"contracted"}:pl));
          addNews({type:"transfer_in",player:p.n,club:"FC Yildiz",val:p.val||0,
            detail:`📝 Sözleşme uzatıldı: ${years} yıl · Maaş: ${newSal}K€`,
            date:new Date().toLocaleDateString("tr-TR")});
          showToast(`✅ ${p.n} ile ${years} yıllık yeni sözleşme imzalandı!`);
          setSelectedPlayer(null);}}
        onSell={p=>{
          // Her durumda onay dialogunu göster (pencere açık veya kapalı)
          setReleaseConfirm(p);
        }}/>}

      {/* ─── MENAJER PROFİL MODAL ─── */}
      {managerOpen&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.75)",zIndex:400,display:"flex",alignItems:"flex-start",justifyContent:"flex-start",padding:0}}
          onClick={()=>setManagerOpen(false)}>
          <div style={{background:C.card,border:`1px solid ${C.ac2}`,borderRadius:"0 0 12px 0",
            boxShadow:"0 8px 32px rgba(0,0,0,.8)",minWidth:260,maxWidth:300,overflow:"hidden"}}
            onClick={e=>e.stopPropagation()}>
            {/* Header */}
            <div style={{background:C.gradCard,padding:"14px 16px",borderBottom:`1px solid rgba(77,166,255,0.22)`,
              display:"flex",alignItems:"center",gap:12}}>
              {/* Avatar seçici */}
              <div style={{width:52,height:52,borderRadius:"50%",background:"rgba(45,143,255,.15)",
                border:`2px solid ${C.ac2}`,display:"flex",alignItems:"center",justifyContent:"center",
                flexShrink:0,overflow:"hidden",padding:4}}>
                <ManagerAvatar id={manager.avatar} size={44}/>
              </div>
              <div>
                <div style={{fontSize:".9rem",fontWeight:800,color:C.wh}}>{manager.firstName} {manager.lastName}</div>
                <div style={{fontSize:".54rem",color:C.gd,fontWeight:600,letterSpacing:1}}>⭐ MENAJER · {manager.age} yaş</div>
                <div style={{fontSize:".48rem",color:C.dim,marginTop:1}}>Lisans: Pro Menajer</div>
              </div>
              <button onClick={()=>setManagerOpen(false)} style={{marginLeft:"auto",background:C.surfaceHover,
                border:`1px solid rgba(77,166,255,0.22)`,color:C.dim,cursor:"pointer",fontSize:".7rem",
                width:24,height:24,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",
                fontFamily:"inherit",flexShrink:0}}>✕</button>
            </div>

            {/* Form */}
            <div style={{padding:"14px 16px",display:"flex",flexDirection:"column",gap:10}}>
              {/* Avatar seçimi */}
              <div>
                <div style={{fontSize:".44rem",color:C.dim,textTransform:"uppercase",letterSpacing:1.5,marginBottom:5,fontWeight:700}}>Avatar Seç</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:5}}>
                  {Object.keys(AVATAR_DEFS).map(avId=>(
                    <button key={avId} onClick={()=>setManager(m=>({...m,avatar:avId}))} style={{
                      width:"100%",aspectRatio:"1",borderRadius:8,cursor:"pointer",fontFamily:"inherit",padding:4,
                      background:manager.avatar===avId?"rgba(36,133,255,.2)":C.surface,
                      border:`2px solid ${manager.avatar===avId?C.ac2:C.brd}`,
                      display:"flex",alignItems:"center",justifyContent:"center",transition:"all .15s",overflow:"hidden"}}>
                      <ManagerAvatar id={avId} size={36}/>
                    </button>
                  ))}
                </div>
              </div>

              {/* Ad */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                <div>
                  <div style={{fontSize:".44rem",color:C.dim,textTransform:"uppercase",letterSpacing:1.5,marginBottom:4,fontWeight:700}}>Ad</div>
                  <input value={manager.firstName}
                    onChange={e=>setManager(m=>({...m,firstName:e.target.value}))}
                    style={{width:"100%",background:C.surfaceHover,border:`1px solid rgba(77,166,255,0.22)`,
                      color:C.wh,padding:"6px 8px",borderRadius:5,fontSize:".68rem",fontFamily:"inherit",outline:"none"}}/>
                </div>
                <div>
                  <div style={{fontSize:".44rem",color:C.dim,textTransform:"uppercase",letterSpacing:1.5,marginBottom:4,fontWeight:700}}>Soyad</div>
                  <input value={manager.lastName}
                    onChange={e=>setManager(m=>({...m,lastName:e.target.value}))}
                    style={{width:"100%",background:C.surfaceHover,border:`1px solid rgba(77,166,255,0.22)`,
                      color:C.wh,padding:"6px 8px",borderRadius:5,fontSize:".68rem",fontFamily:"inherit",outline:"none"}}/>
                </div>
              </div>

              {/* Takım Adı */}
              <div>
                <div style={{fontSize:".44rem",color:C.dim,textTransform:"uppercase",letterSpacing:1.5,marginBottom:4,fontWeight:700}}>Takım Adı</div>
                <input value={clubName}
                  onChange={e=>setClubName(e.target.value)}
                  style={{width:"100%",background:C.surfaceHover,border:`1px solid rgba(77,166,255,0.22)`,
                    color:C.wh,padding:"6px 8px",borderRadius:5,fontSize:".68rem",fontFamily:"inherit",outline:"none"}}/>
              </div>

              {/* Yaş */}
              <div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                  <div style={{fontSize:".44rem",color:C.dim,textTransform:"uppercase",letterSpacing:1.5,fontWeight:700}}>Yaş</div>
                  <div style={{fontSize:".72rem",fontWeight:700,color:C.ac2}}>{manager.age}</div>
                </div>
                <input type="range" min={25} max={75} value={manager.age}
                  onChange={e=>setManager(m=>({...m,age:parseInt(e.target.value)}))}
                  onTouchStart={e=>e.stopPropagation()} onTouchMove={e=>e.stopPropagation()}
                  style={{width:"100%",accentColor:C.ac2,cursor:"pointer",touchAction:"none"}}/>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:".42rem",color:C.dmr,marginTop:2}}>
                  <span>25</span><span>50</span><span>75</span>
                </div>
              </div>

              {/* Uyruk/Deneyim bilgisi (statik gösterim) */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                {[
                  {l:"Deneyim",v:manager.age>=55?"Veteran":manager.age>=45?"Tecrübeli":manager.age>=35?"Orta":"Genç",c:manager.age>=55?C.gd:manager.age>=45?C.grn2:C.ac2},
                  {l:"Lisans",v:"Pro",c:C.pur2},
                ].map((x,i)=>(
                  <div key={i} style={{background:C.surface,borderRadius:5,padding:"6px 8px",border:`1px solid rgba(77,166,255,0.1)`}}>
                    <div style={{fontSize:".42rem",color:C.dmr,textTransform:"uppercase",letterSpacing:1,marginBottom:2}}>{x.l}</div>
                    <div style={{fontSize:".7rem",fontWeight:700,color:x.c}}>{x.v}</div>
                  </div>
                ))}
              </div>

              <button onClick={()=>setManagerOpen(false)} style={{
                width:"100%",padding:"9px 0",background:`linear-gradient(135deg,${C.ac},${C.ac2})`,
                border:"none",color:"#fff",fontSize:".64rem",fontWeight:700,cursor:"pointer",
                borderRadius:6,fontFamily:"inherit",letterSpacing:1}}>
                ✓ KAYDET
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── TRANSFER TEKLİF SAYFASI (App seviyesi) ─── */}
      {transferOffer&&(
        <div style={{position:"fixed",inset:0,zIndex:350,background:C.bg,display:"flex",flexDirection:"column"}}>
          <OfferPage
            onOfferSent={(pid)=>setWeeklyOfferedPlayers(prev=>({...prev,[pid]:season.week}))}
            onOfferFailed={(pid)=>setWeeklyOfferedPlayers(prev=>{const n={...prev};delete n[pid];return n;})}
            player={transferOffer}
            rep={rep}
            league={season.league||"1. Lig"}
            onBack={()=>setTransferOffer(null)}
            onSuccess={(p,ov,sv,ct)=>{
              const isFreeTransfer=p.st==="free"||p.val===0||ov===0;
              // Bir sonraki transfer penceresine kadar gelen teklif koruması
              const _MO=["Temmuz","Agustos","Eylul","Ekim","Kasim","Aralik","Ocak","Subat","Mart","Nisan","Mayis","Haziran"];
              const _WINS=["Agustos","Eylul","Ocak"];
              const _curM=season.fixture&&season.fixture[0]?season.fixture[0].month:"";
              const _curIdx=_MO.indexOf(_curM);
              const _nextWin=_WINS.find(w=>_MO.indexOf(w)>_curIdx)||"_nextSeason";
              const playerWithContract={...p,sal:sv||p.sal,val:p.val,ct:ct||p.ct||3,transferredThisSeason:true,protectedUntil:_nextWin};
              // Finans her durumda güncellenir
              if(!isFreeTransfer){
                const costK=Math.round(ov*1000);
                if(costK>0) updateFinans(costK,"buy","Bonservis: "+p.n+" ("+Math.round(ov)+"M€)");
              }
              // Maaş sezon başı salary_annual ile toplu kesilir; transfer anında çift sayımı önlemek için burada kesim yapılmaz
              // Oyuncuyu "yakın zamanda transfer" listesine ekle
              setRecentlyTransferred(prev=>new Set([...prev,p.id]));
              if(transferWindowOpen){
                // Pencere açık: hemen kadroya ekle
                handleAddToSquad(playerWithContract,"db",null,null,ct||p.ct||3);
                addNews({type:"transfer_in",player:p.n,club:p.club,val:isFreeTransfer?0:ov||0,
                  detail:p.pos+"·OVR"+p.ovr+"·"+sv+"K€/yıl",date:new Date().toLocaleDateString("tr-TR")});
                showToast(isFreeTransfer?p.n+" serbest olarak kadronuza katıldı!":p.n+" kadronuza katıldı! (-"+Math.round(ov)+"M€)");
              } else {
                // Pencere kapalı: kadroya EKLEME - pending listesine al, pencere açılınca katılır
                const pendingPlayer={...playerWithContract, pendingJoin:true, moral:60};
                setPendingSquad(prev=>[...prev.filter(x=>x.player?.id!==p.id),{player:pendingPlayer,type:"buy"}]);
                setDb(prev=>prev.filter(pl=>pl.id!==p.id));
                addNews({type:"transfer_in",player:p.n,club:p.club,val:isFreeTransfer?0:ov||0,
                  detail:"⏳ İmzaladı, transfer penceresi açılınca kadroya katılacak · "+p.pos+"·OVR"+p.ovr,
                  date:new Date().toLocaleDateString("tr-TR")});
                showToast("⏳ "+p.n+" imzaladı! Transfer penceresi açılınca kadroya katılacak.");
              }
              if(updateRep) updateRep(p.ovr>=85?1:0,"Transfer: "+p.n,season.league||"1. Lig");
              setTransferOffer(null);
              // Transfer sonrası otomatik kayıt — tüm state güncellemeleri bittikten sonra kaydet
              setTimeout(()=>{
                if(pendingAutoSave.current){
                  pendingAutoSave.current=false;
                  const saves=getCoachSaves();
                  const lastSlotId=saves.length>0?Number(saves[0].id):null;
                  doCoachSave(lastSlotId);
                }
              },2000);
            }}
          />
        </div>
      )}

            {/* ─── OYUN REHBERİ ─── */}
      {tutorialOpen&&<TutorialOverlay onClose={()=>setTutorialOpen(false)} clubName={clubName}/>}

      {toast&&(
        <div style={{position:"fixed",bottom:30,left:"50%",transform:"translateX(-50%)",
          background:C.nav,color:C.wh,padding:"8px 16px",borderRadius:5,
          fontSize:".76rem",border:`1px solid ${C.ac2}`,zIndex:999,
          boxShadow:"0 4px 20px rgba(0,0,0,.6)",pointerEvents:"none",whiteSpace:"nowrap"}}>
          ✓ {toast}
        </div>
      )}

      {/* ─── SERBEST BIRAKMA ONAY MODAL ─── */}
      {releaseConfirm&&(()=>{
        const p=releaseConfirm;
        // Tazminat: kalan sözleşme yıl × yıllık maaş × 0.5
        const tazminat=Math.round((p.ct||1)*(p.sal||0)*0.5);
        return(
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.8)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:"0 16px"}}
            onClick={()=>setReleaseConfirm(null)}>
            <div style={{background:C.card,border:"1px solid rgba(231,76,60,.4)",borderRadius:12,padding:20,width:"100%",maxWidth:340,boxShadow:"0 8px 32px rgba(0,0,0,.8)"}}
              onClick={e=>e.stopPropagation()}>
              <div style={{fontSize:".8rem",fontWeight:800,color:C.wh,marginBottom:4}}>📤 {p.n} — Ne Yapmak İstiyorsun?</div>
              <div style={{fontSize:".52rem",color:C.dim,marginBottom:16}}>{p.pos} · OVR {p.ovr} · {p.age} yaş</div>

              {/* Transfer listesine ekle */}
              <div style={{background:"rgba(39,174,96,.08)",border:"1px solid rgba(39,174,96,.25)",borderRadius:8,padding:12,marginBottom:10,cursor:"pointer"}}
                onClick={()=>{
                  setSquad(sq=>sq.map(pl=>pl.id===p.id?{...pl,listed:true}:pl));
                  showToast(transferWindowOpen
                    ? `📋 ${p.n} transfer listesine eklendi! Teklifler gelebilir.`
                    : `📋 ${p.n} transfer listesine eklendi. Pencere açılınca teklifler gelecek.`);
                  setReleaseConfirm(null); setSelectedPlayer(null);
                }}>
                <div style={{fontSize:".64rem",fontWeight:700,color:"#27ae60",marginBottom:3}}>📋 Transfer Listesine Ekle</div>
                <div style={{fontSize:".5rem",color:C.dim}}>
                  {transferWindowOpen?"Kulüpler hemen teklif yapabilir":"Pencere açılınca teklifler gelecek"} · Beklenen: <span style={{color:C.gd,fontWeight:700}}>{calcEffectiveVal(p)}M€</span>
                </div>
              </div>

              {/* Serbest bırak */}
              <div style={{background:"rgba(231,76,60,.08)",border:"1px solid rgba(231,76,60,.25)",borderRadius:8,padding:12,marginBottom:16,cursor:"pointer"}}
                onClick={()=>{
                  setSquad(sq=>sq.filter(pl=>pl.id!==p.id));
                  removePlayerFromCoaches(p.id);
                  rebuildLineupAfterRemove(p.id);
                  // Serbest bırakmada gelir YOK, tazminat ödenir
                  if(tazminat>0) updateFinans(-tazminat,"release_fee",`Serbest bırakma tazminatı: ${p.n}`);
                  updateFinans(p.sal||20,"salary_remove",`Maaş azaldı: ${p.n}`);
                  addNews({type:"transfer_out",player:p.n,club:"FC Yildiz",val:0,
                    detail:`🔓 Serbest bırakıldı · Tazminat: ${tazminat}K€ · ${p.pos} · ${p.ovr} OVR`,
                    date:new Date().toLocaleDateString("tr-TR")});
                  showToast(`🔓 ${p.n} serbest bırakıldı. Tazminat: ${tazminat>0?tazminat+"K€":"—"}`);
                  setReleaseConfirm(null); setSelectedPlayer(null);
                }}>
                <div style={{fontSize:".64rem",fontWeight:700,color:"#e74c3c",marginBottom:3}}>🔓 Serbest Bırak</div>
                <div style={{fontSize:".5rem",color:C.dim}}>Transfer geliri yok · Tazminat: <span style={{color:"#ff6b6b",fontWeight:700}}>{tazminat>0?tazminat+"K€":"—"}</span></div>
                <div style={{fontSize:".44rem",color:C.dim,marginTop:3}}>{p.ct||0} yıl kalan sözleşme × {p.sal||0}K€ × 0.5</div>
              </div>

              <button onClick={()=>setReleaseConfirm(null)}
                style={{width:"100%",padding:"8px 0",background:C.surface,border:`1px solid ${C.brd}`,
                  color:C.dim,borderRadius:6,cursor:"pointer",fontSize:".56rem",fontFamily:"inherit"}}>İptal</button>
            </div>
          </div>
        );
      })()}

      {seasonEndModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.95)",zIndex:500,overflowY:"auto",WebkitOverflowScrolling:"touch"}}>
          <div style={{minHeight:"100%",display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"16px 12px 32px"}}>
          <div style={{background:C.gradCard,border:"1px solid rgba(45,143,255,0.3)",borderRadius:16,padding:"18px 16px",maxWidth:340,width:"100%",boxShadow:"0 24px 80px rgba(0,0,0,.9)"}}>

            {/* Başlık */}
            <div style={{textAlign:"center",marginBottom:14,paddingBottom:14,borderBottom:"1px solid rgba(77,166,255,.12)"}}>
              <div style={{fontSize:"2.2rem",marginBottom:4}}>
                {seasonEndModal.rank===1?"🏆":seasonEndModal.promoted?"🎉":seasonEndModal.relegated?"⬇️":seasonEndModal.rank<=3?"🥈":"🏁"}
              </div>
              <div style={{fontSize:".58rem",fontWeight:700,letterSpacing:3,color:C.ac2,textTransform:"uppercase",marginBottom:4}}>SEZON SONU</div>
              <div style={{fontSize:"1.4rem",fontWeight:900,color:C.wh}}>{seasonEndModal.league}</div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginTop:6}}>
                <div style={{background:"rgba(77,166,255,.15)",border:"1px solid rgba(77,166,255,.3)",borderRadius:8,padding:"4px 14px",textAlign:"center"}}>
                  <div style={{fontSize:".42rem",color:C.dim,textTransform:"uppercase",letterSpacing:1}}>Sıra</div>
                  <div style={{fontSize:"1.2rem",fontWeight:900,color:C.ac2}}>{seasonEndModal.rank}.</div>
                </div>
                <div style={{background:"rgba(77,166,255,.15)",border:"1px solid rgba(77,166,255,.3)",borderRadius:8,padding:"4px 14px",textAlign:"center"}}>
                  <div style={{fontSize:".42rem",color:C.dim,textTransform:"uppercase",letterSpacing:1}}>Puan</div>
                  <div style={{fontSize:"1.2rem",fontWeight:900,color:C.ac2}}>{seasonEndModal.pts}</div>
                </div>
                <div style={{background:"rgba(77,166,255,.15)",border:"1px solid rgba(77,166,255,.3)",borderRadius:8,padding:"4px 14px",textAlign:"center"}}>
                  <div style={{fontSize:".42rem",color:C.dim,textTransform:"uppercase",letterSpacing:1}}>Maç</div>
                  <div style={{fontSize:"1.2rem",fontWeight:900,color:C.ac2}}>{(seasonEndModal.teams.find(t=>t.me)||{}).w||0+((seasonEndModal.teams.find(t=>t.me)||{}).d||0)+((seasonEndModal.teams.find(t=>t.me)||{}).l||0)||season.played||0}</div>
                </div>
              </div>
            </div>

            {/* Senaryo Hedef Değerlendirmesi */}
            {seasonEndModal.scenario&&seasonEndModal.scenario.id!=="standard"&&(()=>{
              const sc=seasonEndModal.scenario;
              const sNum=seasonEndModal.seasonNum||1;
              const rank=seasonEndModal.rank;
              const promoted=seasonEndModal.promoted;
              const relegated=seasonEndModal.relegated;

              // Her senaryo için hedef tanımı
              const goals={
                underdogs:[
                  {label:"Elit Lig'e yükselmek",done:promoted,sezon:2,desc:"2 sezon içinde"},
                  {label:"Küme düşmemek",done:!relegated,sezon:null,desc:"Her sezon"},
                  {label:"İlk 5'e girmek",done:rank<=5,sezon:null,desc:"Bu sezon"},
                ],
                petrodollar:[
                  {label:"Şampiyonluk",done:rank===1,sezon:3,desc:"3 sezon içinde"},
                  {label:"İlk 3'e girmek",done:rank<=3,sezon:null,desc:"Bu sezon"},
                  {label:"Küme düşmemek",done:!relegated,sezon:null,desc:"Her sezon"},
                ],
                youngblood:[
                  {label:"İlk 10'da kalmak",done:rank<=10,sezon:null,desc:"Her sezon"},
                  {label:"U23 kadroyla küme düşmemek",done:!relegated,sezon:null,desc:"Her sezon"},
                  {label:"Genç yetenek yetiştirmek",done:squad.some(p=>p.age<=23&&(p.ovr||0)>=70),sezon:null,desc:"OVR 70+ U23"},
                ],
                lastchance:[
                  {label:"Küme düşmeden kurtarmak",done:!relegated,sezon:1,desc:"Bu sezon şart"},
                  {label:"İlk 10'a girmek",done:rank<=10,sezon:1,desc:"Hedef bu sezon"},
                ],
              };
              const scenGoals=goals[sc.id]||[];
              if(scenGoals.length===0) return null;

              const doneCount=scenGoals.filter(g=>g.done).length;
              const allDone=doneCount===scenGoals.length;

              return(
                <div style={{background:allDone?"rgba(40,224,106,.1)":"rgba(255,208,96,.08)",
                  border:`1px solid ${allDone?"rgba(40,224,106,.3)":"rgba(255,208,96,.25)"}`,
                  borderRadius:10,padding:"10px 12px",marginBottom:12}}>
                  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
                    <span style={{fontSize:"1rem"}}>{sc.icon}</span>
                    <div>
                      <div style={{fontSize:".5rem",fontWeight:700,color:allDone?C.grn2:C.gd,letterSpacing:1}}>{sc.label.toUpperCase()} — SEZON {sNum} HEDEFLERİ</div>
                      <div style={{fontSize:".42rem",color:C.dim,marginTop:1}}>{doneCount}/{scenGoals.length} hedef tamamlandı</div>
                    </div>
                    <div style={{marginLeft:"auto",fontSize:"1.1rem"}}>{allDone?"✅":"⏳"}</div>
                  </div>
                  {scenGoals.map((g,i)=>(
                    <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 0",
                      borderBottom:i<scenGoals.length-1?`1px solid ${C.brd2}`:"none"}}>
                      <div style={{fontSize:".9rem"}}>{g.done?"✅":"❌"}</div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:".56rem",color:g.done?C.wh:C.dim,fontWeight:g.done?600:400}}>{g.label}</div>
                        <div style={{fontSize:".42rem",color:C.dmr}}>{g.desc}</div>
                      </div>
                    </div>
                  ))}
                  {allDone&&<div style={{marginTop:8,padding:"5px 8px",background:"rgba(40,224,106,.15)",borderRadius:6,fontSize:".52rem",fontWeight:700,color:C.grn2,textAlign:"center"}}>
                    🎉 Tüm senaryo hedefleri tamamlandı!
                  </div>}
                </div>
              );
            })()}

            {/* Puan tablosu satırları */}
            {(()=>{
              const myTeam=seasonEndModal.teams.find(t=>t.me)||{};
              const W=myTeam.w||season.wins||0;
              const D=myTeam.d||season.draws||0;
              const L=myTeam.l||season.losses||0;
              const GF=myTeam.gf||season.goals||0;
              const GA=myTeam.ga||season.conceded||0;
              return(
                <div style={{background:C.card,border:"1px solid rgba(77,166,255,.12)",borderRadius:10,padding:"10px 12px",marginBottom:12}}>
                  <div style={{fontSize:".44rem",color:C.ac2,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginBottom:8}}>Sezon Performansı</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginBottom:8}}>
                    {[["G","Galibiyet",W,"#30e070"],["B","Beraberlik",D,"#ffd060"],["M","Mağlubiyet",L,"#ff5050"]].map(([k,lbl,v,c])=>(
                      <div key={k} style={{background:C.surface,borderRadius:7,padding:"6px 4px",textAlign:"center"}}>
                        <div style={{fontSize:"1.1rem",fontWeight:900,color:c}}>{v}</div>
                        <div style={{fontSize:".4rem",color:C.dim}}>{lbl}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>
                    {[["Atılan",GF,"#30e070"],["Yenen",GA,"#ff5050"],["Averaj",GF-GA>=0?"+":"",GF-GA>=0?"#30e070":"#ff5050"]].map(([lbl,v,c],i)=>(
                      <div key={lbl} style={{background:C.surface,borderRadius:7,padding:"6px 4px",textAlign:"center"}}>
                        <div style={{fontSize:"1.0rem",fontWeight:900,color:c}}>{i===2?(GF-GA>=0?"+":"")+(GF-GA):v}</div>
                        <div style={{fontSize:".4rem",color:C.dim}}>{lbl}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Top scorers from squad */}
            {(()=>{
              const scorers=squad.filter(p=>(p.seasonGoals||0)>0).sort((a,b)=>(b.seasonGoals||0)-(a.seasonGoals||0)).slice(0,3);
              if(scorers.length===0) return null;
              return(
                <div style={{background:C.card,border:"1px solid rgba(77,166,255,.12)",borderRadius:10,padding:"10px 12px",marginBottom:12}}>
                  <div style={{fontSize:".44rem",color:C.ac2,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginBottom:8}}>⚽ Gol Krallığı (Kadro)</div>
                  {scorers.map((p,i)=>(
                    <div key={p.id} style={{display:"flex",alignItems:"center",gap:8,padding:"4px 0",borderBottom:i<scorers.length-1?`1px solid ${C.brd2}`:"none"}}>
                      <div style={{fontSize:".52rem",fontWeight:700,color:i===0?C.gd:i===1?"#c0c0c0":"#cd7f32",minWidth:16}}>{i+1}.</div>
                      <div style={{flex:1,fontSize:".58rem",color:C.wh,fontWeight:600}}>{p.n}</div>
                      <div style={{fontSize:".52rem",color:C.dim}}>{p.pos}</div>
                      <div style={{fontSize:".68rem",fontWeight:800,color:C.grn2}}>{p.seasonGoals}⚽</div>
                      {(p.seasonAssists||0)>0&&<div style={{fontSize:".52rem",color:C.ac2}}>{p.seasonAssists}🅰️</div>}
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* En iyi puan ortalaması */}
            {(()=>{
              const rated=squad.filter(p=>(p.seasonRatings||[]).length>=3);
              if(rated.length===0) return null;
              const top=rated.map(p=>({...p,avg:p.seasonRatings.reduce((s,r)=>s+r,0)/p.seasonRatings.length})).sort((a,b)=>b.avg-a.avg).slice(0,3);
              return(
                <div style={{background:C.card,border:"1px solid rgba(77,166,255,.12)",borderRadius:10,padding:"10px 12px",marginBottom:12}}>
                  <div style={{fontSize:".44rem",color:C.ac2,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginBottom:8}}>⭐ En İyi Ortalama Puan</div>
                  {top.map((p,i)=>(
                    <div key={p.id} style={{display:"flex",alignItems:"center",gap:8,padding:"4px 0",borderBottom:i<top.length-1?`1px solid ${C.brd2}`:"none"}}>
                      <div style={{fontSize:".52rem",fontWeight:700,color:i===0?C.gd:i===1?"#c0c0c0":"#cd7f32",minWidth:16}}>{i+1}.</div>
                      <div style={{flex:1,fontSize:".58rem",color:C.wh,fontWeight:600}}>{p.n}</div>
                      <div style={{fontSize:".52rem",color:C.dim}}>{p.pos}</div>
                      <div style={{fontSize:".68rem",fontWeight:800,color:C.gd}}>{p.avg.toFixed(1)}</div>
                      <div style={{fontSize:".44rem",color:C.dim}}>{p.seasonRatings.length}m</div>
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* Lig tablosu - ilk 5 */}
            <div style={{background:C.card,border:"1px solid rgba(77,166,255,.12)",borderRadius:10,padding:"10px 12px",marginBottom:12}}>
              <div style={{fontSize:".44rem",color:C.ac2,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginBottom:8}}>📊 Lig Tablosu (İlk 5)</div>
              {seasonEndModal.teams.slice(0,5).map((t,i)=>(
                <div key={i} style={{display:"flex",gap:8,padding:"4px 6px",borderRadius:5,background:t.me?"rgba(45,143,255,.12)":"",borderBottom:"1px solid rgba(100,140,220,.06)"}}>
                  <span style={{fontSize:".52rem",color:i<3?C.grn2:C.dim,minWidth:18,fontWeight:700}}>{i+1}.</span>
                  <span style={{flex:1,fontSize:".6rem",color:t.me?C.ac2:C.wh,fontWeight:t.me?700:400,display:"flex",alignItems:"center",gap:4}}><TeamBadge name={t.name||t.n} size="sm"/>{t.name||t.n}</span>
                  <span style={{fontSize:".5rem",color:C.dim}}>{(t.w||0)+(t.d||0)+(t.l||0)}m</span>
                  <span style={{fontSize:".58rem",fontWeight:700,color:C.wh}}>{t.pts}p</span>
                </div>
              ))}
            </div>

            {/* Özel rozet */}
            {seasonEndModal.promoted&&(
              <div style={{background:"rgba(46,204,113,.12)",border:"1px solid rgba(39,174,96,.3)",borderRadius:8,padding:"8px 10px",marginBottom:12,textAlign:"center"}}>
                <div style={{fontSize:"1.2rem",marginBottom:2}}>🎊</div>
                <div style={{fontSize:".68rem",fontWeight:700,color:C.grn2}}>{seasonEndModal.promoteTo==="İngiliz Ligi"?"İngiliz Ligi'ne Yükseldiniz!":"Süper Lig'e Yükseldiniz!"}</div>
              </div>
            )}
            {seasonEndModal.relegated&&(
              <div style={{background:"rgba(232,64,64,.15)",border:"1px solid rgba(192,57,43,.4)",borderRadius:8,padding:"8px 10px",marginBottom:12,textAlign:"center"}}>
                <div style={{fontSize:"1.2rem",marginBottom:2}}>⬇️</div>
                <div style={{fontSize:".68rem",fontWeight:700,color:C.red2}}>{seasonEndModal.relegateTo==="İngiliz 2. Ligi"?"İngiliz 2. Ligi'ne Düştünüz":"TFF 1. Lig'e Düştünüz"}</div>
                <div style={{fontSize:".5rem",color:"#cc2233",marginTop:2}}>{seasonEndModal.rank}. sıra — küme düşme bölgesi</div>
              </div>
            )}
            {seasonEndModal.league==="Elit Lig"&&seasonEndModal.rank<=2&&!seasonEndModal.relegated&&(
              <div style={{background:"rgba(232,184,58,.1)",border:"1px solid rgba(232,184,58,.3)",borderRadius:8,padding:"8px 10px",marginBottom:12,textAlign:"center"}}>
                <div style={{fontSize:".68rem",fontWeight:700,color:C.gd}}>⭐ Avrupa Şampiyonlar Kupası!</div>
              </div>
            )}

            {/* Yeni Sezon butonu */}
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              <button onClick={()=>{
                setPendingNewSeason({
                  league:seasonEndModal.promoted?(seasonEndModal.promoteTo||"Elit Lig"):seasonEndModal.relegated?(seasonEndModal.relegateTo||"1. Lig"):seasonEndModal.league,
                  tffTable:seasonEndModal.tffTable||[],
                  slTable:seasonEndModal.slTable||[],
                  promoted:seasonEndModal.promoted,
                  relegated:seasonEndModal.relegated
                });
                setSeasonEndModal(null);
              }} style={{width:"100%",padding:"11px 0",
                background:seasonEndModal.promoted?"linear-gradient(135deg,#27ae60,#2ecc71)":seasonEndModal.relegated?"linear-gradient(135deg,#922b21,#e74c3c)":"linear-gradient(135deg,#1a6ed8,#2485ff)",
                border:"none",color:"#fff",fontSize:".7rem",fontWeight:800,cursor:"pointer",borderRadius:10,fontFamily:"inherit",letterSpacing:.5,
                boxShadow:"0 6px 20px rgba(36,133,255,.3)"}}>
                {seasonEndModal.promoted?(seasonEndModal.promoteTo==="İngiliz Ligi"?"🏆 TAMAM — İngiliz Ligi'ne Geçmeye Hazırım":"🏆 TAMAM — Süper Lig'e Geçmeye Hazırım"):seasonEndModal.relegated?"⬇ TAMAM — Devam":"✓ TAMAM"}
              </button>
              <div style={{fontSize:".46rem",color:C.dmr,textAlign:"center",letterSpacing:.5}}>
                İstatistikleri inceledikten sonra menüden Yeni Sezon'u başlatabilirsin
              </div>
            </div>
          </div>
          </div>
        </div>
      )}

      {/* ── ALTIN TOP ÖDÜLÜ MODALI ── */}
      {altinTopModal&&(()=>{
        const w=altinTopModal.winner;
        const isMe=altinTopModal.isMyPlayer;
        const avgR=w.seasonRatings&&w.seasonRatings.length>0
          ?Math.round(w.seasonRatings.reduce((a,b)=>a+b,0)/w.seasonRatings.length):"-";
        const posLabel=w.pos||"";
        return(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.97)",zIndex:610,overflowY:"auto",WebkitOverflowScrolling:"touch"}}>
          <div style={{minHeight:"100%",display:"flex",alignItems:"center",justifyContent:"center",padding:"24px 14px 40px"}}>
            <div style={{background:C.gradCard,border:"1px solid rgba(255,200,40,.45)",borderRadius:18,padding:"24px 18px",maxWidth:340,width:"100%",boxShadow:"0 0 80px rgba(255,180,0,.18), 0 24px 80px rgba(0,0,0,.95)",position:"relative",overflow:"hidden"}}>
              {/* Altın parıltı arka plan */}
              <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse at 50% 0%,rgba(255,190,0,.13) 0%,transparent 70%)",pointerEvents:"none"}}/>

              {/* Başlık */}
              <div style={{textAlign:"center",marginBottom:20}}>
                <div style={{fontSize:"3rem",marginBottom:4,filter:"drop-shadow(0 0 16px rgba(255,200,0,.7))"}}>🏅</div>
                <div style={{fontSize:".48rem",fontWeight:800,letterSpacing:4,color:"rgba(255,190,40,.7)",textTransform:"uppercase",marginBottom:6}}>Sezonun En İyisi</div>
                <div style={{fontSize:"1.25rem",fontWeight:900,color:C.gd,letterSpacing:.5,textShadow:"0 0 20px rgba(255,200,0,.5)"}}>ALTIN TOP ÖDÜLÜ</div>
              </div>

              {/* Oyuncu Kartı */}
              <div style={{background:"rgba(255,190,0,.07)",border:"1px solid rgba(255,190,0,.25)",borderRadius:14,padding:"16px 14px",marginBottom:18,textAlign:"center"}}>
                <div style={{fontSize:".52rem",fontWeight:700,color:"rgba(255,190,40,.6)",letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>KAZANAN</div>
                <div style={{fontSize:"1.4rem",fontWeight:900,color:C.wh,marginBottom:4}}>{w.n}</div>
                <div style={{fontSize:".58rem",color:C.dim,marginBottom:14}}>{w.club} · {posLabel}</div>

                {/* İstatistik kutuları */}
                <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:8}}>
                  {[
                    {label:"OVR",val:w.ovr,col:"#4da6ff"},
                    {label:"GOL",val:w.seasonGoals||0,col:"#30e070"},
                    {label:"ASİST",val:w.seasonAssists||0,col:"#f59e0b"},
                    {label:"ORT",val:avgR,col:"#e879f9"},
                  ].map(s=>(
                    <div key={s.label} style={{background:C.inset,borderRadius:8,padding:"8px 4px"}}>
                      <div style={{fontSize:"1.0rem",fontWeight:900,color:s.col}}>{s.val}</div>
                      <div style={{fontSize:".42rem",color:C.dmr,fontWeight:600,letterSpacing:1}}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Piyasa değeri artışı */}
                <div style={{background:"rgba(255,190,0,.12)",border:"1px solid rgba(255,190,0,.3)",borderRadius:8,padding:"7px 10px",marginTop:4}}>
                  <span style={{fontSize:".6rem",color:C.gd,fontWeight:700}}>📈 Piyasa Değeri +{altinTopModal.valArtis.toFixed(1)}M€ → {w.val.toFixed(1)}M€</span>
                </div>
              </div>

              {/* Mesaj */}
              <div style={{textAlign:"center",marginBottom:18}}>
                {isMe
                  ?<div style={{background:"rgba(255,190,0,.1)",border:"1px solid rgba(255,190,0,.35)",borderRadius:10,padding:"10px 12px"}}>
                    <div style={{fontSize:".7rem",fontWeight:900,color:C.gd,marginBottom:3}}>🌟 Kadronuzdaki oyuncu kazandı!</div>
                    <div style={{fontSize:".56rem",color:C.dim}}>Bu ödül kulübünüzün değerini de yükseltiyor.</div>
                  </div>
                  :<div style={{fontSize:".56rem",color:C.dim,lineHeight:1.5}}>
                    Bu oyuncu geçen sezon tüm ligdeki en yüksek performansı gösterdi.
                  </div>
                }
              </div>

              <button onClick={()=>setAltinTopModal(null)} style={{
                width:"100%",padding:"13px 0",
                background:"linear-gradient(135deg,#b8860b,#ffd060)",
                border:"none",color:"#1a1000",
                fontSize:".72rem",fontWeight:900,cursor:"pointer",borderRadius:10,
                fontFamily:"inherit",letterSpacing:.5,
                boxShadow:"0 4px 20px rgba(255,200,0,.3)"
              }}>
                🏅 Tebrikler!
              </button>
            </div>
          </div>
        </div>
        );
      })()}

      {/* ANA MENÜ ÇIKIŞ ONAY MODALI */}
      {/* ── KURA ÇEKİMİ MODALI ── */}
      {kuraModal&&kuraModal.comp&&(()=>{
        const km=EURO_META[kuraModal.comp]||EURO_META.CL;
        const rgbK=km.rgb, colK=km.color;
        return(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.96)",zIndex:600,overflowY:"auto",WebkitOverflowScrolling:"touch"}}>
          <div style={{minHeight:"100%",display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"20px 12px 40px"}}>
          <div style={{background:C.gradCard,border:`1px solid rgba(${rgbK},.4)`,borderRadius:16,padding:"20px 16px",maxWidth:380,width:"100%",boxShadow:"0 24px 80px rgba(0,0,0,.8)"}}>
            <div style={{textAlign:"center",marginBottom:14,paddingBottom:12,borderBottom:`1px solid rgba(${rgbK},.2)`}}>
              <div style={{fontSize:"2.4rem",marginBottom:6}}>{km.icon}</div>
              <div style={{fontSize:".5rem",fontWeight:700,letterSpacing:3,color:`rgba(${rgbK},.8)`,textTransform:"uppercase",marginBottom:4}}>{km.upper}</div>
              <div style={{fontSize:"1.05rem",fontWeight:900,color:C.wh,marginBottom:4}}>LİG AŞAMASI KURASI</div>
              <div style={{fontSize:".5rem",color:C.dim}}>36 takım · {km.pots} torba · {km.md} maç ({km.md/2} ev / {km.md/2} deplasman)</div>
            </div>
            <div style={{fontSize:".5rem",fontWeight:800,letterSpacing:2,color:colK,marginBottom:6}}>RAKİPLERİN</div>
            {(kuraModal.opps||[]).map((o,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 8px",marginBottom:4,borderRadius:8,
                background:`rgba(${rgbK},.05)`,border:`1px solid rgba(${rgbK},.12)`}}>
                <span style={{fontSize:".44rem",color:C.dim,width:40}}>{o.md}. hafta<br/>{o.month}</span>
                <TeamBadge name={o.n} size="sm"/>
                <span style={{flex:1,fontSize:".6rem",color:C.wh,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{o.n}</span>
                <span style={{fontSize:".42rem",color:C.dmr}}>{o.lg}</span>
                <span style={{fontSize:".44rem",color:colK,width:22,textAlign:"center"}}>T{o.pot}</span>
                <span style={{fontSize:".52rem",width:14,color:o.home?"#4da8ff":C.dmr}}>{o.home?"⌂":"✈"}</span>
              </div>
            ))}
            <div style={{fontSize:".5rem",fontWeight:800,letterSpacing:2,color:colK,margin:"12px 0 6px"}}>TORBALAR</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
              {(kuraModal.pots||[]).map((p,pi)=>(
                <div key={pi} style={{border:`1px solid rgba(${rgbK},.18)`,borderRadius:8,overflow:"hidden"}}>
                  <div style={{padding:"3px 7px",background:`rgba(${rgbK},.1)`,fontSize:".44rem",fontWeight:800,color:colK}}>TORBA {pi+1}</div>
                  {p.map((t,ti)=>(
                    <div key={ti} style={{padding:"2px 7px",fontSize:".46rem",color:t.me?colK:"rgba(240,244,255,.8)",fontWeight:t.me?800:400,
                      overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.me?"▶ ":""}{t.n}</div>
                  ))}
                </div>
              ))}
            </div>
            <div style={{fontSize:".46rem",color:C.dim,margin:"10px 2px",lineHeight:1.5}}>
              1–8 doğrudan Son 16 · 9–24 Şubat'ta çift maçlı Play-Off · 25–36 elenir. Aynı ligden takımlar eşleşmez.
            </div>
            <button onClick={()=>setKuraModal(null)} style={{
              width:"100%",marginTop:4,padding:"13px 0",
              background:`linear-gradient(135deg,rgba(${rgbK},.75),${colK})`,
              border:"none",color:kuraModal.comp==="CL"?"#1a1000":"#fff",
              fontSize:".72rem",fontWeight:900,cursor:"pointer",borderRadius:10,
              fontFamily:"inherit",letterSpacing:.5
            }}>
              {km.icon} Lig Aşamasına Hazırım!
            </button>
          </div>
          </div>
        </div>
        );
      })()}

      {showCoachSaveModal&&(
        <CoachSaveModal
          clubName={clubName}
          season={season}
          COACH_MAX_SLOTS={COACH_MAX_SLOTS}
          getCoachSaves={getCoachSaves}
          doCoachSave={doCoachSave}
          doCoachDeleteSlot={doCoachDeleteSlot}
          loadGameData={loadGameData}
          showToast={showToast}
          onClose={()=>setShowCoachSaveModal(false)}
        />
      )}

      {showExitConfirm&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.82)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
          <div style={{background:C.card,border:"1px solid rgba(77,166,255,.25)",borderRadius:16,padding:24,width:"100%",maxWidth:300,textAlign:"center"}}>
            <div style={{fontSize:"2rem",marginBottom:8}}>🏠</div>
            <div style={{fontSize:".85rem",fontWeight:800,color:C.wh,marginBottom:6}}>Ana Menüye Dön?</div>
            <div style={{fontSize:".54rem",color:C.dim,marginBottom:20}}>Kaydedilmemiş ilerleme kaybolur.</div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setShowExitConfirm(false)} style={{flex:1,padding:"11px",background:C.surfaceHover,border:`1px solid ${C.brd}`,borderRadius:9,color:"#aaa",cursor:"pointer",fontFamily:"inherit",fontSize:".68rem",fontWeight:600}}>
                İptal
              </button>
              <button onClick={()=>{setShowExitConfirm(false);setGameScreen("mainmenu");}} style={{flex:1,padding:"11px",background:"linear-gradient(135deg,#1a6ed8,#2485ff)",border:"none",borderRadius:9,color:"#fff",cursor:"pointer",fontFamily:"inherit",fontSize:".68rem",fontWeight:700}}>
                🏠 Dön
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
