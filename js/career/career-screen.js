// ── AİLE OLAYI KARTI ─────────────────────────────────────────
function FamilyEventCard({ event, player, onChoice }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.88)', zIndex:1001, display:'flex', alignItems:'center', justifyContent:'center', padding:20, fontFamily:'system-ui,sans-serif' }}>
      <div style={{ background:'linear-gradient(135deg,#050e22,#0a1630)', border:'1px solid rgba(255,105,180,.25)', borderRadius:18, padding:24, width:'100%', maxWidth:340 }}>
        <div style={{ textAlign:'center', marginBottom:16 }}>
          <div style={{ fontSize:'2.5rem', marginBottom:6 }}>{event.icon}</div>
          <div style={{ fontSize:'.84rem', fontWeight:900, color:'#fff', marginBottom:4 }}>{event.title}</div>
          <div style={{ fontSize:'.58rem', color:'#7898c0', lineHeight:1.5 }}>{event.desc}</div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {event.opts.map((opt, i) => (
            <button key={i} onClick={() => onChoice(opt, event)}
              style={{ padding:'12px 14px', background:'rgba(255,105,180,.08)', border:'1px solid rgba(255,105,180,.2)', borderRadius:11, color:'#fff', cursor:'pointer', fontFamily:'inherit', fontSize:'.62rem', fontWeight:600, textAlign:'left', lineHeight:1.4 }}>
              {opt.label}
              <div style={{ fontSize:'.5rem', color:'#a78bfa', marginTop:3 }}>
                {[opt.moralDelta && `Moral ${opt.moralDelta>0?'+':''}${opt.moralDelta}`, opt.repDelta && `İtibar ${opt.repDelta>0?'+':''}${opt.repDelta}`, opt.costDelta && `-${opt.costDelta}K€`].filter(Boolean).join(' · ')}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── STORY EVENT KARTI ─────────────────────────────────────────
function StoryEventCard({ event, player, onChoice }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.88)', zIndex:1001, display:'flex', alignItems:'center', justifyContent:'center', padding:20, fontFamily:'system-ui,sans-serif' }}>
      <div style={{ background:'linear-gradient(135deg,#050e22,#0a1630)', border:'1px solid rgba(139,92,246,.25)', borderRadius:18, padding:24, width:'100%', maxWidth:340 }}>
        <div style={{ textAlign:'center', marginBottom:16 }}>
          <div style={{ fontSize:'.46rem', color:'#a78bfa', fontWeight:700, letterSpacing:2, textTransform:'uppercase', marginBottom:6 }}>📖 Kariyer Olayı</div>
          <div style={{ fontSize:'2rem', marginBottom:6 }}>{event.icon}</div>
          <div style={{ fontSize:'.82rem', fontWeight:900, color:'#fff', marginBottom:6 }}>{event.title}</div>
          <div style={{ fontSize:'.58rem', color:'#7898c0', lineHeight:1.5 }}>{event.desc.replace('{rival}', player.rival?.n || 'Rakip')}</div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {event.opts.map((opt, i) => (
            <button key={i} onClick={() => onChoice(opt, event)}
              style={{ padding:'12px 14px', background:'rgba(139,92,246,.08)', border:'1px solid rgba(139,92,246,.2)', borderRadius:11, color:'#fff', cursor:'pointer', fontFamily:'inherit', fontSize:'.62rem', fontWeight:600, textAlign:'left', lineHeight:1.4 }}>
              {opt.label}
              <div style={{ fontSize:'.48rem', color:'#a78bfa', marginTop:3 }}>
                {[opt.repDelta   && `İtibar ${opt.repDelta>0?'+':''}${opt.repDelta}`,
                  opt.moralDelta && `Moral ${opt.moralDelta>0?'+':''}${opt.moralDelta}`,
                  opt.coachDelta && `Antrenör İlişkisi ${opt.coachDelta>0?'+':''}${opt.coachDelta}`,
                  opt.teamDelta  && `Takım İlişkisi ${opt.teamDelta>0?'+':''}${opt.teamDelta}`,
                  opt.fanDelta   && `+${opt.fanDelta} taraftar`,
                  opt.costDelta  && `-${opt.costDelta}K€`,
                ].filter(Boolean).join(' · ')}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function CareerScreen({player:init,onBack}){
  const [p,setP]=useState(init);
  const [tab,setTab]=useState("home");
  const [matchResult,setMatchResult]=useState(null);
  const [matchFlow,setMatchFlow]=useState([]);
  const [toast,setToast]=useState(null);
  const [toastCol,setToastCol]=useState(CP.ac);
  const [pendingOffers,setPendingOffers]=useState([]);
  const [unlocked,setUnlocked]=useState(null);
  const [pressQ,setPressQ]=useState(null);
  const [coachMsg,setCoachMsg]=useState(null);
  const [modals,setModals]=useState({retire:false,skills:false,sponsor:false,training:false,life:false,conflict:false,captain:false,pcoach:false,loan:false,speed:false});
  const [liveMatch,setLiveMatch]       = useState(null);   // {perf, weather, isDerby, isCL}
  const [storyEvent,setStoryEvent]     = useState(null);   // aktif story kartı
  const [familyEvent,setFamilyEvent]   = useState(null);   // aktif aile kartı
  const [showSaveMenu,setShowSaveMenu] = useState(false);
  const [kTab,setKTab] = useState("gol"); // lig sekmesi gol/asist toggle
  const showModal=(k,v=true)=>setModals(m=>({...m,[k]:v}));

  const t2=(msg,col=CP.ac,dur=3500)=>{setToast(msg);setToastCol(col);setTimeout(()=>setToast(null),dur);};

  // Başarı kontrolü
  const checkAch=(pl)=>{
    const n=CAREER_ACHIEVEMENTS.filter(a=>!(pl.achievements||[]).includes(a.id)&&a.check(pl));
    if(n.length>0){
      setP(prev=>({...prev,achievements:[...(prev.achievements||[]),n[0].id]}));
      setUnlocked(n[0]);
      setTimeout(()=>setUnlocked(null),4500);
      t2(`🏆 BAŞARI: ${n[0].title}!`,"#f59e0b",4500);
    }
  };

  const stage=getStage(p.ovr);
  const avgRat=p.ratings.length>0?(p.ratings.reduce((s,r)=>s+r,0)/p.ratings.length).toFixed(1):"—";
  const devPct=Math.min(100,Math.round(p.devPoints||0));
  const myPos=(p.leagueTable||[]).findIndex(t=>t.me)+1;
  const sponsorInc=(p.sponsors||[]).reduce((s,sid)=>{const sp=SPONSORS.find(x=>x.n===sid);return s+(sp?.salary||0);},0);
  const mentor=p.mentor?MENTORS.find(m=>m.id===p.mentor):null;
  const pers=PERSONALITY_TYPES.find(x=>x.id===p.personality)||PERSONALITY_TYPES[0];
  const isCL=p.teamTier===1;

  // Maç simülasyonu
  // Mini-game tetikleme: şut/penaltı/frikik fırsatı doğduğunda
  const playMatch=()=>{
    // Story event kontrolü (her 3 haftada bir şans)
    if (p.week % 3 === 0 || Math.random() < 0.15) {
      const sev = checkStoryEvent(p);
      if (sev) { setStoryEvent(sev); return; }
    }
    // Aile event kontrolü
    const fev = checkFamilyEvent(p);
    if (fev) { setFamilyEvent(fev); return; }

    const weather=WEATHER[Math.floor(Math.random()*WEATHER.length)];
    const mGoals=genMatchGoals(p);
    const isHome=Math.random()>0.5;
    const isDerby=p.teamLg.includes("Süper")&&Math.random()<0.15;
    const oppStr=p.teamStr-10+Math.random()*20;
    finishMatch(weather,mGoals,isHome,isDerby,oppStr,null);
  };

  // finishMatch: hem doğrudan hem mini-game callback'ten çağrılır
  const finishMatch=(weather,mGoals,isHome,isDerby,oppStr,mgRes=null)=>{
    const perf=calcPerf(p,p.teamStr,oppStr,isHome,weather,mGoals);
    // Mini-game sonucunu perfa yansıt
    if(mgRes){
      if(mgRes.isGoal){
        perf.goals+=1;
        perf.gf+=1;
        if(perf.isLoss&&perf.gf>perf.ga){perf.isWin=true;perf.isLoss=false;perf.score=`${perf.gf}-${perf.ga}`;}
      }
      perf.rating=Math.min(9.9,perf.rating+(mgRes.isGoal?0.5:-0.2));
    }
    // Gelişim
    const dvPts=calcDev(p,perf);
    let newOvr=p.ovr, newDev=(p.devPoints||0)+dvPts, ovrUp=false;
    if(newDev>=100){newOvr=Math.min(p.pot,newOvr+1);newDev-=100;ovrUp=true;}

    // Kırmızı kart
    const rcBan=perf.hasRedCard?1+Math.floor(Math.random()*2):0;
    const newRedCards=(p.redCards||0)+(perf.hasRedCard?1:0);

    // Yaralanma
    const persInjMult=pers?.bonuses?.injuryMult||1;
    const pcInjMult=p.personalCoach?(PERSONAL_COACHES.find(x=>x.id===p.personalCoach)?.injuryMult||1):1;
    const injured=Math.random()<(p.fatigue>72?0.08:p.fatigue>52?0.035:0.012)*persInjMult*pcInjMult;
    const injWeeks=injured?3+Math.floor(Math.random()*5):0;

    // İstatistikler — YENİ İTİBAR SİSTEMİ
    const newFat=Math.min(100,p.fatigue+22);
    const persWinMoral=pers?.bonuses?.winMoralBonus||0;
    const newMor=Math.max(20,Math.min(99,p.morale+(perf.isWin?9+persWinMoral:perf.isDraw?1:-7)));
    const repCh=calcRepChange(perf, mgRes?.isGoal||false);
    const mGoalRep=(perf.achGoals||[]).reduce((s,gid)=>{const g=mGoals.find(x=>x.id===gid);return s+(g?.reward||0);},0);
    const newRep=Math.min(100,Math.max(0,(p.reputation||8)+repCh+mGoalRep));
    const fanCh=perf.isWin?Math.floor(Math.random()*600)+100:perf.isDraw?50:-Math.floor(Math.random()*200);
    const newFans=Math.max(200,(p.fans||500)+fanCh);
    // Piyasa değeri artık itibar + OVR bazlı
    const newMV=calcMarketValue(newOvr,newRep,p.age,p.pos,p.ballonDor||false);
    const newSav=(p.savings||0)+Math.round(p.salary/34)+((sponsorInc/34)|0);
    const invReturn=(p.investments||[]).reduce((s,inv)=>s+Math.round((inv.amount||0)*(inv.rate||0)/52),0);

    // Lig tablosu
    let newTbl=simLeagueWeek(p.leagueTable||[]);
    newTbl=newTbl.map(t=>!t.me?t:{...t,pts:t.pts+(perf.isWin?3:perf.isDraw?1:0),w:t.w+(perf.isWin?1:0),d:t.d+(perf.isDraw?1:0),l:t.l+(perf.isLoss?1:0),gf:t.gf+perf.gf,ga:t.ga+perf.ga}).sort((a,b)=>b.pts-a.pts||(b.gf-b.ga)-(a.gf-a.ga));
    let newScorers=[...(p.topScorers||[])].map(s=>{
      if(s.me) return{...s,goals:s.goals+perf.goals,assists:s.assists+perf.assists};
      // Pozisyona göre gol/asist olasılığı
      const sp=s.pos||"CM";
      const goalP=sp==="ST"?0.22:sp==="CAM"?0.14:sp==="LM"||sp==="RM"?0.12:sp==="CM"?0.06:0.04;
      const assP=sp==="CAM"||sp==="CM"?0.16:sp==="LM"||sp==="RM"?0.14:sp==="ST"?0.08:0.04;
      return{...s,goals:s.goals+(Math.random()<goalP?1:0),assists:s.assists+(Math.random()<assP?1:0)};
    }).sort((a,b)=>b.goals-a.goals);
    const assistersSorted=[...newScorers].sort((a,b)=>b.assists-a.assists);
    const isTop=newScorers[0]?.me||false;
    const isTopAssist=assistersSorted[0]?.me||false;

    const cMsg=perf.rating>=8.0?{type:"praise",msg:p.isCaptain?`Kaptan sözünü tuttu! Harika maç ${p.name}!`:"Harika maç! Böyle devam edersen takımın en önemli ismi olacaksın.",relChg:+5}
      :perf.rating>=6.5?{type:"neutral",msg:"Makul bir performans. Daha yüksek standardını bekliyorum.",relChg:0}
      :{type:"critic",msg:"Bu performans yeterli değil. Konsantrasyonunu artırman şart.",relChg:p.personality==="rebel"?-8:-5};
    const newCoach=Math.max(0,Math.min(100,(p.coachRelation||50)+cMsg.relChg));
    const newTeam=Math.max(0,Math.min(100,(p.teamRelation||50)+(perf.isWin?3:perf.isDraw?0:-2)));
    let newRival=p.rival;
    if(newRival) newRival={...newRival,ovr:Math.min(99,newRival.ovr+(Math.random()<0.25?1:0))};

    let conflictEvent=null;
    if(p.personality==="rebel"&&Math.random()<0.05&&!p.conflictWith){
      const mates=["A.Yıldız","M.Kaya","C.Demir","B.Şahin"];
      conflictEvent=mates[Math.floor(Math.random()*mates.length)];
    }
    let captainOffer=false;
    if(!p.isCaptain&&(p.coachRelation||50)>=80&&(p.teamRelation||50)>=75&&p.matches>=15&&Math.random()<0.06) captainOffer=true;

    let newNews=[...(p.news||[])];
    if(perf.goals>=3) newNews=[genNews(p,"hat_trick"),...newNews];
    else if(perf.goals>=1) newNews=[genNews(p,"goal_scored",{goals:perf.goals}),...newNews];
    if(perf.motm) newNews=[genNews(p,"motm",{rating:perf.rating}),...newNews];
    if(perf.hasLastMin) newNews=[genNews(p,"last_minute",{extra:perf.extraTime}),...newNews];
    if(perf.hasRedCard) newNews=[genNews(p,"red_card",{min:75,ban:rcBan}),...newNews];
    if(perf.hasPenalty&&!perf.penScored) newNews=[genNews(p,"penalty_miss"),...newNews];
    if(ovrUp) newNews=[genNews(p,"ovr_up",{ovr:newOvr}),...newNews];
    if(isTop&&!p.isTopScorer) newNews=[genNews(p,"top_scorer",{goals:newScorers.find(s=>s.me)?.goals||0}),...newNews];
    if(isTopAssist&&!p.isTopAssister) newNews=[{icon:"🎯",title:`${p.name} Asist Krallığında Lider!`,body:`${p.name} bu hafta asist krallığına yükseldi! Ligde en fazla asist yapan isim oldu.`,date:new Date().toLocaleDateString("tr-TR"),type:"top_assister"},...newNews];
    if(conflictEvent) newNews=[genNews(p,"conflict",{teammate:conflictEvent}),...newNews];
    if(captainOffer) newNews=[genNews(p,"captain"),...newNews];
    newNews=newNews.slice(0,30);

    let newDiary=[...(p.diary||[])];
    const dKey=perf.goals>0?"goal":perf.isWin?"win":perf.hasLastMin?"last_minute":perf.hasRedCard?"red_card":"loss";
    const dMsgs=DIARY[dKey]||DIARY.win;
    if(dMsgs&&Math.random()<0.45) newDiary=[{week:p.week,text:dMsgs[Math.floor(Math.random()*dMsgs.length)],date:new Date().toLocaleDateString("tr-TR")},...newDiary].slice(-20);

    const newForm=[...(p.weeklyFormRatings||[]),perf.rating].slice(-8);
    const newOvrH=[...(p.ovrHistory||[p.ovr]),newOvr];
    const updGoals=(p.seasonGoals||[]).map(g=>{
      if(g.done) return g;
      if(g.id==="goals10"&&p.goals+perf.goals>=10) return{...g,done:true};
      if(g.id==="assists8"&&p.assists+perf.assists>=8) return{...g,done:true};
      if(g.id==="matches20"&&p.matches+1>=20) return{...g,done:true};
      return g;
    });
    const ballonNom=(()=>{
      if(p.ballonDor||p.ovr<90||p.season<2) return false;
      const _avgR2=p.ratings&&p.ratings.length>0?(p.ratings.reduce((s,r)=>s+r,0)/p.ratings.length):0;
      const statScore=(p.goals||0)*3+(p.assists||0)*2+(p.motmCount||0)*5+(p.isTopScorer?20:0)+(p.isTopAssister?15:0)+_avgR2*2;
      const nomChance=Math.min(0.25,statScore/600);
      return Math.random()<nomChance;
    })();

    const newP={...p,
      ovr:newOvr,devPoints:newDev,
      goals:p.goals+perf.goals,assists:p.assists+perf.assists,matches:p.matches+1,
      ratings:[...(p.ratings||[]).slice(-29),perf.rating],
      totalGoals:p.totalGoals+perf.goals,totalAssists:p.totalAssists+perf.assists,totalMatches:p.totalMatches+1,
      homeGoals:isHome?(p.homeGoals||0)+perf.goals:p.homeGoals||0,
      awayGoals:!isHome?(p.awayGoals||0)+perf.goals:p.awayGoals||0,
      homeMatches:isHome?(p.homeMatches||0)+1:p.homeMatches||0,
      awayMatches:!isHome?(p.awayMatches||0)+1:p.awayMatches||0,
      fatigue:injured?100:newFat,morale:newMor,
      injuredWeeks:injured?injWeeks:0,
      redCards:newRedCards,hadLongInjury:p.hadLongInjury||(injured&&injWeeks>=4),
      week:p.week+(rcBan>0?1+rcBan:1),
      reputation:newRep,fans:newFans,marketValue:newMV,
      savings:newSav+invReturn,
      leagueTable:newTbl,topScorers:newScorers,isTopScorer:isTop,isTopAssister:isTopAssist,
      coachRelation:newCoach,teamRelation:newTeam,
      motmCount:(p.motmCount||0)+(perf.motm?1:0),
      bestMatchGoals:Math.max(p.bestMatchGoals||0,perf.goals),
      news:newNews,diary:newDiary,rival:newRival,
      weeklyFormRatings:newForm,ovrHistory:newOvrH,
      seasonGoals:updGoals,
      ballonDor:ballonNom||p.ballonDor,
      ballonDorVotes:(ballonNom?1:0)+(p.ballonDorVotes||0),
      conflictWith:conflictEvent||p.conflictWith,
    };
    setP(newP);
    perf.rating=parseFloat(perf.rating.toFixed(1));
    setMatchResult({...perf,ovrUp,newOvr,injured,injWeeks,weather,isDerby,isCL,matchGoals:mGoals,isHome,rcBan,mgRes});
    setMatchFlow(buildFlow(p,perf,isDerby,isCL));
    setCoachMsg(cMsg);
    // Canlı maç göster, bittikten sonra tab="match"
    setLiveMatch({perf:{...perf,isHome,hasLastMin:perf.hasLastMin,extraTime:perf.extraTime,goals:perf.goals,assists:perf.assists,gf:perf.gf,ga:perf.ga,gameSpeed:p.gameSpeed}, weather, isDerby, isCL});
    return; // setTab("match") LiveMatch callback'inde yapılacak
    const pqs=[
      {q:perf.isWin?"Bu galibiyeti nasıl değerlendiriyorsunuz?":"Mağlubiyeti nasıl karşıladınız?",opts:[perf.isWin?"Takım çalışmasının meyvasıdır":"Hatalarımızı analiz edeceğiz",perf.isWin?"Çok iyi oynadık, hak ettik":"Bir sonrakinde fark yaratacağız","Her maçtan bir şey öğreniyorum"],relGain:3,morGain:2},
      {q:perf.hasRedCard?"Kırmızı kart için ne söylemek istersiniz?":perf.goals>0?`${perf.goals} golünüzü anlatır mısınız?`:"Performansınızdan memnun musunuz?",opts:[perf.hasRedCard?"Kendimden utanıyorum, özür":"Taraftarlar için attım, inanılmaz his","Bir sonraki maça odaklandım"],relGain:4,morGain:3},
      {q:"Transfer söylentileri hakkında?",opts:["Şu an sadece takımıma odaklandım","Ajan bu konuları yönetiyor","Kariyer kararlarımı doğru zamanda alırım"],relGain:2,morGain:0},
    ];
    setTimeout(()=>setPressQ(pqs[Math.floor(Math.random()*pqs.length)]),150);
    checkAch(newP);
    if(captainOffer) setTimeout(()=>{
      if(window.confirm(`🎗️ Antrenör seni kaptan yapmak istiyor!\n\nKabul ediyor musun?`)){
        setP(prev=>({...prev,isCaptain:true,coachRelation:Math.min(100,(prev.coachRelation||50)+10),teamRelation:Math.min(100,(prev.teamRelation||50)+10),diary:[{week:prev.week,text:DIARY.captain_1st[0],date:new Date().toLocaleDateString("tr-TR")},...(prev.diary||[])].slice(-20)}));
        t2("🎗️ Takım Kaptanı oldun!","#ffd060",5000);
      }
    },2000);
    if(newP.week>34) setTimeout(()=>endSeason(newP),200);
  };


  // Antrenman
  const doTraining=(typeId)=>{
    const tr=TRAINING_TYPES.find(x=>x.id===typeId)||TRAINING_TYPES[0];
    const persM=pers?.bonuses?.trainingMult||1.0;
    const pcM=p.personalCoach?(PERSONAL_COACHES.find(x=>x.id===p.personalCoach)?.devBonus||0)+1:1;
    let newDev=(p.devPoints||0)+(tr.devBonus*persM*pcM), newOvr=p.ovr;
    if(newDev>=100){newOvr=Math.min(p.pot,newOvr+1);newDev-=100;t2(`📈 ${tr.label} meyvesini verdi! OVR → ${newOvr}`,CP.grn);}
    const newFat=Math.max(0,Math.min(100,p.fatigue+tr.fatigueCost));
    const newMor=Math.min(99,Math.max(20,(p.morale||75)+tr.moralBonus));
    const newTbl=simLeagueWeek(p.leagueTable||[]).sort((a,b)=>b.pts-a.pts||(b.gf-b.ga)-(a.gf-a.ga));
    const newSav=(p.savings||0)+Math.round(p.salary/34);
    const trMsg=DIARY.training[Math.floor(Math.random()*DIARY.training.length)];
    const newDiary=[{week:p.week,text:trMsg,date:new Date().toLocaleDateString("tr-TR")},...(p.diary||[])].slice(-20);
    const newP={...p,ovr:newOvr,devPoints:newDev,fatigue:newFat,morale:newMor,leagueTable:newTbl,savings:newSav,diary:newDiary,week:p.week+1,ovrHistory:[...(p.ovrHistory||[p.ovr]),newOvr]};
    setP(newP);
    showModal("training",false);
    t2(`${tr.icon} ${tr.label} tamamlandı!`,CP.dim);
    if(newP.week>34) endSeason(newP);
  };

  // Sezon sonu
  const endSeason=(pl)=>{
    const newAge=pl.age+1;
    // Kişisel antrenör yaşlanma
    const persAgingAge=PERSONALITY_TYPES.find(x=>x.id===pl.personality)?.bonuses?.agingAge||32;
    const agingPenalty=newAge>persAgingAge?-1:0;
    const newOvrWithAge=Math.max(50,pl.ovr+agingPenalty);
    // Sponsorluk geliri yatırıma ekle
    const sponsorAnnual=(pl.sponsors||[]).reduce((s,sid)=>{const sp=SPONSORS.find(x=>x.n===sid);return s+(sp?.salary||0);},0);
    // Yatırım getirileri
    const newInvestments=(pl.investments||[]).map(inv=>({...inv,amount:Math.round(inv.amount*(inv.win?inv.returnMult:inv.riskMult||0.7))}));
    const invGain=newInvestments.reduce((s,i)=>s+i.amount,0)-(pl.investments||[]).reduce((s,i)=>s+i.amount,0);
    // Transfer teklifleri
    const offers=[];
    if(pl.ovr>=60){
      const elig=CAREER_TEAMS.filter(t=>t.str>pl.teamStr+4&&t.n!==pl.team);
      elig.sort(()=>Math.random()-0.5).slice(0,4).forEach(t=>{
        if(Math.random()<0.42){
          const sB=1+(pl.agent?.bonus||0.12);
          const homePremium=t.n===pl.childhoodTeam?1.1:1;
          // İtibar transfer maaşına yansır
          const offerSalary=calcOfferSalary(t.str, sB*homePremium, pl.reputation||0);
          offers.push({team:t.n,lg:t.lg,str:t.str,tier:t.tier,color:t.color,salary:offerSalary,city:t.city,contract:3,isChildhood:t.n===pl.childhoodTeam});
        }
      });
    }
    // Kiralık teklifi
    const loanOffer=pl.age<=20&&pl.ovr>=58&&!pl.isOnLoan&&Math.random()<0.3?CAREER_TEAMS.find(t=>t.str>pl.teamStr+8&&t.tier<=pl.teamTier):null;
    // Milli takım
    const natCall=pl.ovr>=63&&Math.random()<0.38&&!pl.hasNationalCall;
    const worldCupQ=pl.ovr>=70&&pl.hasNationalCall&&Math.random()<0.25&&!pl.worldCup;
    const ballonWin=(()=>{
      if(pl.ballonDor||pl.ballonDorVotes<2||pl.ovr<90) return false;
      // İstatistik skoru: rakiplerle kıyaslanır
      const statScore=(pl.goals||0)*3+(pl.assists||0)*2+(pl.motmCount||0)*5
        +(pl.isTopScorer?25:0)+(pl.isTopAssister?18:0)+avgR*3
        +(pl.isCaptain?5:0);
      // OVR 90-92: zorlu, 93-95: olası, 96+: çok olası
      const ovrMult=pl.ovr>=96?1.4:pl.ovr>=93?1.1:0.85;
      const winChance=Math.min(0.75,statScore/500*ovrMult);
      return Math.random()<winChance;
    })();
    // Kulüp efsanesi
    const newSeasonsAtClub=(pl.seasonsAtClub||1)+1;
    const clubLegend=newSeasonsAtClub>=5&&!pl.isClubLegend;
    // Sezon hedef bonusu
    const goalsDoneRep=(pl.seasonGoals||[]).filter(g=>g.done).length*15;
    const avgR=pl.ratings.length>0?parseFloat((pl.ratings.reduce((s,r)=>s+r,0)/pl.ratings.length).toFixed(1)):0;
    const sStat={season:pl.season,age:pl.age,team:pl.team,ovr:pl.ovr,goals:pl.goals,assists:pl.assists,matches:pl.matches,avgRating:avgR,isTopScorer:pl.isTopScorer,isTopAssister:pl.isTopAssister||false,motm:pl.motmCount||0,ballonDor:ballonWin,isCaptain:pl.isCaptain};

    // Haberler
    let newNews=[...(pl.news||[])];
    if(natCall) newNews=[genNews(pl,"national"),...newNews];
    if(ballonWin) newNews=[genNews({...pl},"diary",{msg:"BALLON D'OR KAZANDIM! Hayatımın en büyük ödülü!"}),...newNews];
    if(clubLegend) newNews=[genNews(pl,"club_legend"),...newNews];
    if(loanOffer) newNews=[genNews(pl,"loan",{team:loanOffer.n}),...newNews];

    // Sponsor açılımı
    const newSponsor=SPONSORS.find(s=>pl.ovr>=s.minOvr&&!(pl.sponsors||[]).includes(s.n));
    if(newSponsor&&Math.random()<0.4) newNews=[genNews(pl,"diary",{msg:`${newSponsor.icon} ${newSponsor.n} sponsorluk teklifi geldi!`}),...newNews];

    // Günlük
    let newDiary=[...(pl.diary||[])];
    if(natCall) newDiary=[{week:pl.week,text:DIARY.national[0],date:new Date().toLocaleDateString("tr-TR")},...newDiary].slice(-20);

    // Aile güncellemeleri
    const updFamily = pl.family ? {...pl.family, childAge:(pl.family.childAge||0)+1} : pl.family;

    const newPl={...pl, family:updFamily,
      age:newAge,contract:Math.max(0,pl.contract-1),ovr:newOvrWithAge,
      goals:0,assists:0,matches:0,ratings:[],week:1,season:pl.season+1,
      history:[...(pl.history||[]),sStat],
      hasNationalCall:natCall||pl.hasNationalCall,
      nationalCaps:pl.nationalCaps+(natCall?Math.floor(Math.random()*7)+1:0),
      nationalGoals:pl.nationalGoals+(natCall&&["ST","CAM"].includes(pl.pos)?Math.floor(Math.random()*3):0),
      worldCup:worldCupQ||pl.worldCup,
      isTopScorer:false,isTopAssister:false,motmCount:0,
      ballonDor:ballonWin||pl.ballonDor,
      marketValue:ballonWin?calcMarketValue(newOvrWithAge,Math.min(100,(pl.reputation||0)+goalsDoneRep),newAge,pl.pos,true):pl.marketValue,
      reputation:Math.min(100,(pl.reputation||0)+goalsDoneRep),
      savings:(pl.savings||0)+sponsorAnnual+invGain,
      investments:newInvestments,
      sponsors:newSponsor&&Math.random()<0.4?[...(pl.sponsors||[]),newSponsor.n]:pl.sponsors||[],
      news:newNews,diary:newDiary,
      seasonsAtClub:newSeasonsAtClub,
      isClubLegend:clubLegend||pl.isClubLegend,
      leagueTable:initLeagueTable(pl.team,pl.teamStr,pl.teamLg),
      topScorers:initTopScorers(pl.name,pl.pos,pl.team),
      conflictWith:null,
      skillPoints:(pl.skillPoints||0)+(ovrUp?1:0)+1, // her sezon +1 skill puan
    };
    const ovrUp=newOvrWithAge>pl.ovr;
    setPendingOffers([...offers,...(loanOffer?[{team:loanOffer.n,lg:loanOffer.lg,str:loanOffer.str,tier:loanOffer.tier,salary:Math.round(loanOffer.str*0.5),contract:1,isLoan:true}]:[])])  ;
    setP(newPl);
    setTab("season_end");
    checkAch(newPl);
    // Otomatik kayıt (sezon sonu) — ilk slota yazar, yoksa yeni oluşturur
    const pSaves = getPlayerSaves();
    const autoSlotId = pSaves.length > 0 ? pSaves[0].id : null;
    const autoR = saveCareer(newPl, autoSlotId);
    t2(autoR.ok ? '💾 Kariyer otomatik kaydedildi' : '⚠️ Otomatik kayıt başarısız', '#4da6ff', 2500);

    // Doğum günü
    if(Math.random()<0.3) setTimeout(()=>{
      t2(`🎂 ${newAge}. doğum günün kutlu olsun ${pl.name}!`,"#f59e0b",5000);
      setP(prev=>({...prev,news:[genNews(prev,"birthday",{age:newAge}),...(prev.news||[])],diary:[{week:1,text:DIARY.birthday[0],date:new Date().toLocaleDateString("tr-TR")},...(prev.diary||[])].slice(-20)}));
    },1500);
  };

  // Story event sonucu
  const resolveStoryEvent = (opt, ev) => {
    setP(prev => {
      const upd = { ...prev };
      if (opt.repDelta)   upd.reputation   = Math.min(100, Math.max(0, (upd.reputation||0)   + opt.repDelta));
      if (opt.moralDelta) upd.morale        = Math.min(99,  Math.max(20,(upd.morale||75)       + opt.moralDelta));
      if (opt.coachDelta) upd.coachRelation = Math.min(100, Math.max(0, (upd.coachRelation||50)+ opt.coachDelta));
      if (opt.teamDelta)  upd.teamRelation  = Math.min(100, Math.max(0, (upd.teamRelation||50) + opt.teamDelta));
      if (opt.fanDelta)   upd.fans          = Math.max(0,   (upd.fans||0) + opt.fanDelta);
      if (opt.costDelta)  upd.savings       = Math.max(0,   (upd.savings||0) - opt.costDelta);
      upd.news = [genNews(prev,'diary',{msg:`📖 ${ev.title}: ${opt.result}`}), ...(upd.news||[])].slice(0,30);
      upd.diary = [{week:prev.week, text:`${ev.icon} ${opt.result}`, date:new Date().toLocaleDateString('tr-TR')}, ...(upd.diary||[])].slice(-20);
      // Kariyer devam et (playMatch)
      return upd;
    });
    setStoryEvent(null);
    t2(`📖 ${ev.title}: ${opt.result}`, '#a78bfa', 4000);
  };

  // Aile event sonucu
  const resolveFamilyEvent = (opt, ev) => {
    setP(prev => {
      const upd = { ...prev, family: { ...(prev.family||{}) } };
      if (opt.moralDelta) upd.morale  = Math.min(99,  Math.max(20,(upd.morale||75) + opt.moralDelta));
      if (opt.repDelta)   upd.reputation = Math.min(100,Math.max(0,(upd.reputation||0)+opt.repDelta));
      if (opt.costDelta)  upd.savings = Math.max(0,   (upd.savings||0) - opt.costDelta);
      // Aile durumu güncelle
      if (ev.id==='meet_partner' && opt.moralDelta > 0) upd.family.hasPartner = true;
      if (ev.id==='marriage'     && opt.moralDelta > 5) upd.family.isMarried  = true;
      if (ev.id==='baby')  { upd.family.hasChild = true; upd.family.childAge  = 0; }
      // Yıllık çocuk yaşı artışı endSeason'da yapılacak
      upd.triggeredFamilyEvents = [...(upd.triggeredFamilyEvents||[]), ...(ev.once?[ev.id]:[])];
      upd.news  = [genNews(prev,'diary',{msg:`${ev.icon} ${ev.title}: ${opt.result}`}), ...(upd.news||[])].slice(0,30);
      upd.diary = [{week:prev.week, text:`${ev.icon} ${opt.result}`, date:new Date().toLocaleDateString('tr-TR')}, ...(upd.diary||[])].slice(-20);
      return upd;
    });
    setFamilyEvent(null);
    t2(`${ev.icon} ${opt.result}`, '#ff69b4', 4000);
  };

  const answerPress=(opt,pq)=>{
    setP(prev=>({...prev,reputation:Math.min(100,(prev.reputation||0)+(pq.relGain||2)),morale:Math.min(99,(prev.morale||75)+(pq.morGain||1)),pressConf:[...(prev.pressConf||[]),{q:pq.q,a:opt}].slice(-10)}));
    setPressQ(null);t2("📢 Basın toplantısı tamamlandı!",CP.ac2);
  };

  const upgradeSkill=(skillId)=>{
    if((p.skillPoints||0)<=0) return;
    const tree=SKILL_TREES[p.pos];
    const skill=tree?.skills.find(s=>s.id===skillId);
    if(!skill) return;
    const cur=(p.skills||{})[skillId]||0;
    if(cur>=skill.max) return;
    setP(prev=>({...prev,skills:{...(prev.skills||{}),[skillId]:(prev.skills?.[skillId]||0)+1},skillPoints:(prev.skillPoints||0)-1}));
    t2(`✅ ${skill.icon} ${skill.n} geliştirildi (${cur+1}/${skill.max})`,CP.grn);
  };

  const retire=()=>{
    const finalP={...p,retired:true,retirementAge:p.age};
    setP(finalP);checkAch(finalP);showModal("retire",false);setTab("retired");
    const msg=DIARY.retire[0];
    setP(prev=>({...prev,diary:[{week:prev.week,text:msg,date:new Date().toLocaleDateString("tr-TR")},...(prev.diary||[])].slice(-20)}));
  };

  const doLifeEvent=(ev)=>{
    if((p.savings||0)<ev.cost){t2("❌ Yetersiz birikim!",CP.red);return;}
    let update={savings:(p.savings||0)-ev.cost,ownedAssets:[...(p.ownedAssets||[]),ev.id]};
    if(ev.moralBonus) update.morale=Math.min(99,(p.morale||75)+ev.moralBonus);
    if(ev.repBonus) update.reputation=Math.min(100,(p.reputation||0)+ev.repBonus);
    if(ev.fanBonus) update.fans=(p.fans||0)+ev.fanBonus;
    if(ev.id==="charity") update.didCharity=true;
    if(ev.id.includes("invest")){
      const won=Math.random()<0.6;
      const inv={id:ev.id,amount:ev.cost,returnMult:ev.returnMult,riskMult:ev.riskMult,win:won};
      update.investments=[...(p.investments||[]),inv];
      update.savings=(p.savings||0)-ev.cost;
      t2(won?`📈 ${ev.label}: İyi yatırım! +%${Math.round((ev.returnMult-1)*100)}`:`📉 ${ev.label}: Kayıp! -%${Math.round((1-(ev.riskMult||0.7))*100)}`,won?CP.grn:CP.red);
    } else {
      t2(`✅ ${ev.label}! ${ev.moralBonus?`Moral +${ev.moralBonus}`:""}`,CP.grn);
    }
    if(ev.id.includes("house")) update.diary=[{week:p.week,text:DIARY.house[0],date:new Date().toLocaleDateString("tr-TR")},...(p.diary||[])].slice(-20);
    if(ev.id==="charity") update.diary=[{week:p.week,text:DIARY.charity[0],date:new Date().toLocaleDateString("tr-TR")},...(p.diary||[])].slice(-20);
    setP(prev=>({...prev,...update}));
    checkAch({...p,...update});
    showModal("life",false);
  };

  const resolveConflict=(choice)=>{
    if(choice==="apologize"){
      setP(prev=>({...prev,teamRelation:Math.min(100,(prev.teamRelation||50)+15),conflictWith:null,morale:Math.min(99,(prev.morale||75)+5)}));
      t2("🤝 Anlaşmazlık çözüldü! Takım ilişkisi arttı.",CP.grn);
    } else {
      setP(prev=>({...prev,teamRelation:Math.max(0,(prev.teamRelation||50)-10),conflictWith:null,reputation:Math.min(100,(prev.reputation||0)+3)}));
      t2("💪 Tutumunu korudun. Takım ilişkisi düştü ama itibar arttı.",CP.ora);
    }
    showModal("conflict",false);
  };

  // Tab bar
  const TABS=[{id:"home",l:"Ana",i:"🏠"},{id:"news",l:"Haberler",i:"📰"},{id:"league",l:"Lig",i:"📊"},{id:"stats",l:"İstatistik",i:"📈"},{id:"diary",l:"Günlük",i:"📓"}];
  const TabBar=()=>(
    <div style={{display:"flex",background:"#020812",borderTop:`1px solid ${CP.brd}`,flexShrink:0}}>
      {TABS.map(t=>(
        <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,padding:"9px 4px",display:"flex",flexDirection:"column",alignItems:"center",gap:2,background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",borderTop:`2px solid ${tab===t.id?CP.ac:"transparent"}`,color:tab===t.id?CP.ac2:CP.dim}}>
          <span style={{fontSize:".9rem"}}>{t.i}</span>
          <span style={{fontSize:".4rem",fontWeight:600}}>{t.l}</span>
        </button>
      ))}
    </div>
  );

  const ToastEl=()=>toast&&<div style={{position:"fixed",top:48,left:"50%",transform:"translateX(-50%)",background:toastCol,color:CP.wh,padding:"10px 18px",borderRadius:20,fontSize:".66rem",fontWeight:700,zIndex:9999,textAlign:"center",maxWidth:"90vw",boxShadow:"0 4px 20px rgba(0,0,0,.5)"}}>{toast}</div>;
  const AchEl=()=>unlocked&&<div style={{position:"fixed",top:56,left:"50%",transform:"translateX(-50%)",background:"linear-gradient(135deg,#92400e,#d97706)",color:CP.wh,padding:"12px 20px",borderRadius:16,zIndex:9999,textAlign:"center",boxShadow:"0 4px 24px rgba(0,0,0,.6)",minWidth:230}}><div style={{fontSize:"1.4rem",marginBottom:3}}>{unlocked.icon}</div><div style={{fontSize:".6rem",fontWeight:900,letterSpacing:1}}>BAŞARI AÇILDI!</div><div style={{fontSize:".64rem",fontWeight:700}}>{unlocked.title}</div><div style={{fontSize:".5rem",opacity:.85}}>{unlocked.desc}</div></div>;

  // ── ANA EKRAN ──
  // Save menu (çoklu slot)
  if(showSaveMenu) {
    const pSaves = getPlayerSaves();
    const fmtD = (ts) => ts ? new Date(ts).toLocaleString("tr-TR",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}) : "—";
    return(
      <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.92)',zIndex:1002,display:'flex',alignItems:'center',justifyContent:'center',padding:16,fontFamily:'system-ui,sans-serif'}}>
        <div style={{background:'#040d20',border:'1px solid rgba(77,168,255,.2)',backdropFilter:'blur(12px)',borderRadius:18,padding:20,width:'100%',maxWidth:340,maxHeight:'85vh',display:'flex',flexDirection:'column',gap:12}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div>
              <div style={{fontSize:'.82rem',fontWeight:900,color:'#fff'}}>💾 Kariyer Kaydet</div>
              <div style={{fontSize:'.5rem',color:'#7898c0',marginTop:2}}>{p.name} · Sezon {p.season} · OVR {p.ovr}</div>
            </div>
            <button onClick={()=>setShowSaveMenu(false)} style={{background:'transparent',border:'none',color:'#666',fontSize:'1.1rem',cursor:'pointer',padding:4}}>✕</button>
          </div>
          {/* Yeni slot butonu */}
          {pSaves.length < PLAYER_MAX_SLOTS ? (
            <button onClick={()=>{
              const r=saveCareer(p);
              t2(r.ok?'✅ Yeni kayıt oluşturuldu!':'❌ Kayıt hatası!', r.ok?'#10b981':'#ef4444');
              setShowSaveMenu(false);
            }} style={{padding:'11px',background:'linear-gradient(135deg,#065f46,#059669)',border:'none',borderRadius:10,color:'#fff',fontWeight:700,cursor:'pointer',fontFamily:'inherit',fontSize:'.7rem',display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
              <span>➕</span> Yeni Kayıt Oluştur
            </button>
          ) : (
            <div style={{fontSize:'.56rem',color:'#f59e0b',textAlign:'center',padding:'8px',background:'rgba(245,158,11,.08)',borderRadius:8,border:'1px solid rgba(245,158,11,.2)'}}>
              ⚠️ Maks {PLAYER_MAX_SLOTS} kayıt doldu. Üzerine yaz veya sil.
            </div>
          )}
          {/* Mevcut kayıtlar */}
          <div style={{overflowY:'auto',display:'flex',flexDirection:'column',gap:6,maxHeight:'50vh'}}>
            {pSaves.length===0 && (
              <div style={{textAlign:'center',padding:'20px 0',color:'rgba(255,255,255,.3)',fontSize:'.58rem'}}>
                📭 Henüz kayıt yok
              </div>
            )}
            {pSaves.map(slot=>(
              <div key={slot.id} style={{background:'rgba(255,255,255,.04)',border:'1px solid rgba(36,133,255,.15)',borderRadius:10,padding:'10px 12px',display:'flex',alignItems:'center',gap:8}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:'.64rem',fontWeight:700,color:'#fff'}}>{slot.name}</div>
                  <div style={{fontSize:'.5rem',color:'#7ab8ff',marginTop:1}}>{slot.team||'Serbest'} · Sezon {slot.season} · OVR {slot.ovr}</div>
                  <div style={{fontSize:'.44rem',color:'rgba(255,255,255,.28)',marginTop:1}}>{fmtD(slot.savedAt)}</div>
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:4,flexShrink:0}}>
                  <button onClick={()=>{
                    const r=saveCareer(p, slot.id);
                    t2(r.ok?'💾 Kayıt güncellendi!':'❌ Hata!', r.ok?'#10b981':'#ef4444');
                    setShowSaveMenu(false);
                  }} style={{padding:'4px 9px',background:'rgba(36,133,255,.2)',border:'1px solid rgba(36,133,255,.4)',borderRadius:6,color:'#4da6ff',cursor:'pointer',fontSize:'.5rem',fontFamily:'inherit',fontWeight:700}}>Üzerine Yaz</button>
                  <button onClick={()=>{
                    const loaded=loadCareerSlot(slot.id);
                    if(loaded&&window.confirm('Bu kayıdı yükle? Mevcut ilerleme kaybolur.')){
                      setP(loaded);
                      t2('✅ Kariyer yüklendi!','#10b981');
                      setShowSaveMenu(false);
                    }
                  }} style={{padding:'4px 9px',background:'rgba(16,185,129,.1)',border:'1px solid rgba(16,185,129,.3)',borderRadius:6,color:'#10b981',cursor:'pointer',fontSize:'.5rem',fontFamily:'inherit'}}>▶ Yükle</button>
                  <button onClick={()=>{
                    if(window.confirm('Bu kaydı sil?')){deleteCareerSlot(slot.id);}
                  }} style={{padding:'4px 9px',background:'rgba(239,68,68,.07)',border:'1px solid rgba(239,68,68,.2)',borderRadius:6,color:'rgba(239,68,68,.7)',cursor:'pointer',fontSize:'.5rem',fontFamily:'inherit'}}>🗑</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Story event kartı
  if(storyEvent) return <StoryEventCard event={storyEvent} player={p} onChoice={resolveStoryEvent}/>;

  // Aile event kartı
  if(familyEvent) return <FamilyEventCard event={familyEvent} player={p} onChoice={resolveFamilyEvent}/>;

  // Canlı maç
  if(liveMatch) return <LiveMatchScreen player={p} perf={liveMatch.perf} weather={liveMatch.weather} isDerby={liveMatch.isDerby} isCL={liveMatch.isCL} onFinish={()=>{setLiveMatch(null);setTab('match');}}/>;


  if(tab==="home") return(
    <div style={{position:"fixed",inset:0,background:CP.bg,display:"flex",flexDirection:"column",fontFamily:"system-ui,sans-serif"}}>
      <ToastEl/><AchEl/>
      {/* Header */}
      <div style={{background:`linear-gradient(135deg,${CP.bg2},${CP.bg3})`,padding:"11px 14px",borderBottom:`1px solid ${CP.brd}`,flexShrink:0}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:7}}>
          <div>
            <div style={{fontSize:".43rem",color:CP.ac2,letterSpacing:2,textTransform:"uppercase"}}>{stage.icon} {stage.label} {p.isCaptain?"🎗️ KAPTAN":""} {p.formNumber?`#${p.formNumber}`:""}</div>
            <div style={{fontSize:".92rem",fontWeight:900,color:CP.wh}}>{p.name}</div>
            <div style={{fontSize:".5rem",color:CP.dim}}>{CAREER_FLAGS[p.nat]} {p.nat} · {p.pos} · {p.age} yaş · {p.team} {p.isOnLoan?"(Kiralık)":""}</div>
            {p.personality&&<div style={{fontSize:".46rem",color:PERSONALITY_TYPES.find(x=>x.id===p.personality)?.id==="rebel"?"#f87171":PERSONALITY_TYPES.find(x=>x.id===p.personality)?.id==="leader"?"#ffd060":"#a78bfa"}}>{pers.icon} {pers.label} karakter</div>}
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:"2.4rem",fontWeight:900,color:"#ffd060",lineHeight:1}}>{p.ovr}</div>
            <div style={{fontSize:".44rem",color:CP.dim}}>OVR · Pot: {p.pot}</div>
            <div style={{fontSize:".5rem",color:CP.ac2}}>{stage.icon}</div>
          </div>
        </div>
        {/* Dev bar */}
        <div style={{marginBottom:5}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:".41rem",color:CP.dim,marginBottom:2}}>
            <span>Gelişim {devPct}%</span>
            <span style={{color:(p.skillPoints||0)>0?"#f59e0b":CP.dim}} onClick={()=>showModal("skills")}>{(p.skillPoints||0)} skill puan {(p.skillPoints||0)>0?"⭐ (tıkla)":""}</span>
          </div>
          <div style={{height:5,background:"rgba(255,255,255,.07)",borderRadius:3,overflow:"hidden"}}>
            <div style={{height:"100%",width:`${devPct}%`,background:"linear-gradient(90deg,#2485ff,#8b5cf6)",borderRadius:3}}/>
          </div>
        </div>
        {/* Metriks */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:4}}>
          {[{l:"İtibar",v:`${p.reputation||0}`,col:"#ffd060"},{l:"Fan",v:(p.fans||0)>=1000?`${((p.fans||0)/1000).toFixed(1)}B`:`${p.fans||0}`,col:"#ef4444"},{l:"Sıra",v:`${myPos}.`,col:myPos<=3?"#ffd060":CP.ac2},{l:"Değer",v:`${p.marketValue>=1000?`${(p.marketValue/1000).toFixed(1)}M`:`${p.marketValue}K`}€`,col:CP.grn}].map((m,i)=>(
            <div key={i} style={{textAlign:"center"}}>
              <div style={{fontSize:".6rem",fontWeight:700,color:m.col}}>{m.v}</div>
              <div style={{fontSize:".38rem",color:CP.dim}}>{m.l}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{flex:1,overflowY:"auto",padding:"10px 14px"}}>
        {/* Sezon bilgi + birikim */}
        <div style={{background:"rgba(36,133,255,.06)",border:`1px solid ${CP.brd}`,borderRadius:10,padding:"10px 12px",marginBottom:9}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{fontSize:".48rem",color:CP.ac2}}>SEZON {p.season} · HAFTA {p.week}/34 {p.gameSpeed==="fast"?"⚡":""}</div>
              <div style={{fontSize:".62rem",fontWeight:700,color:CP.wh}}>{p.team}</div>
              <div style={{fontSize:".48rem",color:CP.dim}}>{p.teamLg} · {p.contract} yıl sözleşme</div>
              {mentor&&<div style={{fontSize:".44rem",color:"#a78bfa"}}>👨‍🏫 Mentor: {mentor.n}</div>}
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:".72rem",fontWeight:800,color:CP.grn}}>{p.salary}K€/yıl</div>
              {sponsorInc>0&&<div style={{fontSize:".46rem",color:"#f59e0b"}}>+{sponsorInc}K€ sponsor</div>}
              <div style={{fontSize:".44rem",color:CP.dim}}>💰 {(p.savings||0)>=1000?`${((p.savings||0)/1000).toFixed(1)}M`:`${p.savings||0}K`}€</div>
            </div>
          </div>
        </div>

        {/* Sezon istatistik */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginBottom:9}}>
          {[{l:"Maç",v:p.matches,i:"⚽",col:CP.wh},{l:"Gol",v:p.goals,i:"🥅",col:CP.grn},{l:"Asist",v:p.assists,i:"🎯",col:CP.ac2},{l:"Rating",v:avgRat,i:"⭐",col:"#ffd060"}].map((s,i)=>(
            <div key={i} style={{background:"rgba(255,255,255,.04)",border:`1px solid ${CP.brd}`,borderRadius:10,padding:"9px 6px",textAlign:"center"}}>
              <div style={{fontSize:".9rem",marginBottom:2}}>{s.i}</div>
              <div style={{fontSize:".82rem",fontWeight:900,color:s.col}}>{s.v}</div>
              <div style={{fontSize:".4rem",color:CP.dim}}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* Barlar */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:9}}>
          {[
            {l:"Kondisyon",v:100-p.fatigue,col:p.fatigue<40?CP.grn:p.fatigue<70?"#f59e0b":CP.red},
            {l:"Moral",v:p.morale,col:p.morale>=70?CP.grn:p.morale>=40?"#f59e0b":CP.red},
            {l:"Antrenör İlişkisi",v:p.coachRelation||50,col:(p.coachRelation||50)>=65?CP.grn:(p.coachRelation||50)>=40?"#f59e0b":CP.red},
            {l:"Takım İlişkisi",v:p.teamRelation||50,col:(p.teamRelation||50)>=65?CP.grn:(p.teamRelation||50)>=40?"#f59e0b":CP.red},
          ].map((b,i)=>(
            <div key={i} style={{background:"rgba(255,255,255,.04)",border:`1px solid ${CP.brd}`,borderRadius:9,padding:"8px 10px"}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:".44rem",color:CP.dim,marginBottom:3}}><span>{b.l}</span><span style={{color:b.col,fontWeight:700}}>{b.v}%</span></div>
              <div style={{height:4,background:"rgba(255,255,255,.07)",borderRadius:2,overflow:"hidden"}}><div style={{height:"100%",width:`${b.v}%`,background:b.col,borderRadius:2}}/></div>
            </div>
          ))}
        </div>

        {/* Rival */}
        {p.rival&&<div style={{background:"rgba(139,92,246,.08)",border:"1px solid rgba(139,92,246,.22)",borderRadius:10,padding:"9px 12px",marginBottom:9,display:"flex",gap:10,alignItems:"center"}}>
          <span style={{fontSize:"1.3rem"}}>⚡</span>
          <div style={{flex:1}}><div style={{fontSize:".54rem",color:"#a78bfa",fontWeight:700}}>Rival: {p.rival.n}</div><div style={{fontSize:".48rem",color:CP.dim}}>{p.rival.pos} · OVR {p.rival.ovr} · {p.rival.rivalry}</div></div>
          <div style={{fontSize:".56rem",fontWeight:700,color:p.ovr>=p.rival.ovr?CP.grn:CP.red}}>{p.ovr>=p.rival.ovr?"ÖNDE 💪":"GERİDE ⚡"}</div>
        </div>}

        {/* Çatışma uyarısı */}
        {p.conflictWith&&<div style={{background:"rgba(239,68,68,.1)",border:"1px solid rgba(239,68,68,.25)",borderRadius:10,padding:"9px 12px",marginBottom:9,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div><div style={{fontSize:".58rem",fontWeight:700,color:CP.red}}>⚡ Takım İçi Çatışma</div><div style={{fontSize:".5rem",color:CP.dim}}>{p.conflictWith} ile anlaşmazlık</div></div>
          <button onClick={()=>showModal("conflict")} style={{padding:"7px 12px",background:"rgba(239,68,68,.15)",border:"1px solid rgba(239,68,68,.3)",borderRadius:8,color:CP.red,cursor:"pointer",fontFamily:"inherit",fontSize:".58rem",fontWeight:700}}>Çöz</button>
        </div>}

        {/* Sakatlanma */}
        {p.injuredWeeks>0&&<div style={{background:"rgba(239,68,68,.1)",border:"1px solid rgba(239,68,68,.22)",borderRadius:10,padding:"9px 12px",marginBottom:9,display:"flex",gap:8,alignItems:"center"}}>
          <span style={{fontSize:"1.3rem"}}>🩹</span>
          <div><div style={{fontSize:".6rem",fontWeight:700,color:CP.red}}>Sakatlandın!</div><div style={{fontSize:".5rem",color:CP.dim}}>{p.injuredWeeks} hafta sahalardan uzak</div></div>
        </div>}

        {/* Milli takım */}
        {/* Aile durumu */}
        {(()=>{const fam=getFamilyStatus(p);if(!fam.hasPartner)return null;return(
          <div style={{background:'rgba(255,105,180,.07)',border:'1px solid rgba(255,105,180,.2)',borderRadius:10,padding:'9px 12px',marginBottom:9,display:'flex',gap:8,alignItems:'center'}}>
            <span style={{fontSize:'1.3rem'}}>{fam.hasChild?'👨‍👩‍👧':fam.isMarried?'💍':'💑'}</span>
            <div>
              <div style={{fontSize:'.58rem',fontWeight:700,color:'#f9a8d4'}}>{fam.isMarried?'Evli':'Birlikte'}{fam.hasChild?` · ${fam.childName||'Çocuk'} (${fam.childAge||0} yaş)`:''}</div>
              <div style={{fontSize:'.48rem',color:'#7898c0'}}>Aile moral bonusu: +{fam.moralBonus}/hafta</div>
            </div>
          </div>
        );})()}
        {p.hasNationalCall&&<div style={{background:"rgba(16,185,129,.08)",border:"1px solid rgba(16,185,129,.2)",borderRadius:10,padding:"9px 12px",marginBottom:9,display:"flex",gap:8,alignItems:"center"}}>
          <span style={{fontSize:"1.3rem"}}>{CAREER_FLAGS[p.nat]||"🌍"}</span>
          <div><div style={{fontSize:".58rem",fontWeight:700,color:CP.grn}}>{p.nat} Milli Takımı {p.worldCup?"· 🌍 Dünya Kupası":""}</div><div style={{fontSize:".5rem",color:CP.dim}}>{p.nationalCaps} cap · {p.nationalGoals} gol</div></div>
        </div>}

        {/* Sezon hedefleri */}
        {(p.seasonGoals||[]).length>0&&<div style={{background:"rgba(255,215,0,.06)",border:"1px solid rgba(255,215,0,.16)",borderRadius:10,padding:"9px 12px",marginBottom:9}}>
          <div style={{fontSize:".52rem",color:"#ffd060",fontWeight:700,marginBottom:5}}>🎯 Sezon Hedefleri</div>
          {(p.seasonGoals||[]).map((g,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:7,marginBottom:3}}>
              <span style={{fontSize:".85rem"}}>{g.done?"✅":"⬜"}</span>
              <span style={{fontSize:".54rem",color:g.done?CP.grn:CP.wh,flex:1,textDecoration:g.done?"line-through":"none"}}>{g.desc}</span>
              <span style={{fontSize:".46rem",color:"#ffd060"}}>+{g.reward}</span>
            </div>
          ))}
        </div>}

        {/* Skill puan */}
        {(p.skillPoints||0)>0&&<button onClick={()=>showModal("skills")} style={{width:"100%",padding:"10px",background:"rgba(139,92,246,.1)",border:"1.5px solid rgba(139,92,246,.3)",borderRadius:10,color:"#a78bfa",fontWeight:700,cursor:"pointer",fontFamily:"inherit",fontSize:".68rem",marginBottom:7}}>🎯 Skill Puanı Kullan ({p.skillPoints||0} puan)</button>}

        {/* Aksiyon butonları */}
        {p.injuredWeeks>0?(
          <button onClick={()=>{setP(prev=>({...prev,injuredWeeks:Math.max(0,prev.injuredWeeks-1),fatigue:Math.max(0,prev.fatigue-25),week:prev.week+1,leagueTable:simLeagueWeek(prev.leagueTable||[]).sort((a,b)=>b.pts-a.pts||(b.gf-b.ga)-(a.gf-a.ga))}));t2("🩹 İyileşme haftası",CP.dim);}}
            style={{width:"100%",padding:"13px",background:"linear-gradient(135deg,#7f1d1d,#dc2626)",border:"none",borderRadius:11,color:CP.wh,fontWeight:800,cursor:"pointer",fontFamily:"inherit",fontSize:".74rem",marginBottom:7}}>
            🩹 İYİLEŞME HAFTASI · H{p.week}/34
          </button>
        ):(
          <button onClick={playMatch} style={{width:"100%",padding:"14px",background:"linear-gradient(135deg,#065f46,#059669)",border:"none",borderRadius:11,color:CP.wh,fontWeight:900,cursor:"pointer",fontFamily:"inherit",fontSize:".8rem",boxShadow:"0 4px 18px rgba(5,150,105,.4)",marginBottom:7,letterSpacing:.5}}>
            ▶ MAÇ OYNA · H{p.week}/34
          </button>
        )}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7,marginBottom:7}}>
          <button onClick={()=>showModal("training")} style={{padding:"11px",background:"rgba(36,133,255,.1)",border:`1.5px solid rgba(36,133,255,.25)`,borderRadius:10,color:CP.ac2,fontWeight:700,cursor:"pointer",fontFamily:"inherit",fontSize:".64rem"}}>💪 Antrenman</button>
          <button onClick={()=>showModal("sponsor")} style={{padding:"11px",background:"rgba(245,158,11,.08)",border:"1px solid rgba(245,158,11,.2)",borderRadius:10,color:"#f59e0b",cursor:"pointer",fontFamily:"inherit",fontSize:".64rem"}}>💼 Sponsor</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7,marginBottom:7}}>
          <button onClick={()=>showModal("life")} style={{padding:"10px",background:"rgba(16,185,129,.08)",border:"1px solid rgba(16,185,129,.2)",borderRadius:9,color:CP.grn,cursor:"pointer",fontFamily:"inherit",fontSize:".62rem"}}>🏠 Yaşam</button>
          <button onClick={()=>showModal("pcoach")} style={{padding:"10px",background:"rgba(139,92,246,.08)",border:"1px solid rgba(139,92,246,.2)",borderRadius:9,color:"#a78bfa",cursor:"pointer",fontFamily:"inherit",fontSize:".62rem"}}>🏋️ Özel Antrenör</button>
        </div>
        <div style={{display:"flex",gap:7,marginBottom:7}}>
          <button onClick={()=>showModal("retire")} style={{flex:1,padding:"9px",background:"rgba(255,255,255,.03)",border:`1px solid rgba(255,255,255,.06)`,borderRadius:9,color:"#555",cursor:"pointer",fontFamily:"inherit",fontSize:".6rem"}}>🕊️ Emekli</button>
          <button onClick={()=>setShowSaveMenu(true)} style={{flex:1,padding:"9px",background:"rgba(36,133,255,.06)",border:"1px solid rgba(36,133,255,.18)",borderRadius:9,color:"#4da6ff",cursor:"pointer",fontFamily:"inherit",fontSize:".6rem"}}>💾 Kaydet</button>
          <button onClick={onBack} style={{flex:1,padding:"9px",background:"rgba(255,255,255,.03)",border:`1px solid rgba(255,255,255,.06)`,borderRadius:9,color:"#444",cursor:"pointer",fontFamily:"inherit",fontSize:".6rem"}}>← Menü</button>
        </div>
        <div style={{height:16}}/>
      </div>

      {/* ANTRENMAN MODAl */}
      {modals.training&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.85)",zIndex:999,display:"flex",flexDirection:"column",justifyContent:"flex-end"}}>
        <div style={{background:CP.bg2,borderRadius:"16px 16px 0 0",padding:"20px 16px",maxHeight:"80vh",overflowY:"auto"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <div style={{fontSize:".8rem",fontWeight:800,color:CP.wh}}>💪 Antrenman Türü Seç</div>
            <button onClick={()=>showModal("training",false)} style={{background:"rgba(255,255,255,.1)",border:"none",color:CP.wh,borderRadius:6,padding:"4px 10px",cursor:"pointer",fontFamily:"inherit",fontSize:".6rem"}}>✕</button>
          </div>
          {p.personalCoach&&<div style={{background:"rgba(139,92,246,.1)",border:"1px solid rgba(139,92,246,.25)",borderRadius:8,padding:"8px 12px",marginBottom:12,fontSize:".54rem",color:"#a78bfa"}}>🏋️ Özel Antrenör: {PERSONAL_COACHES.find(x=>x.id===p.personalCoach)?.n} — Ekstra gelişim bonusu aktif</div>}
          {TRAINING_TYPES.map(tr=>(
            <button key={tr.id} onClick={()=>doTraining(tr.id)} style={{width:"100%",padding:"13px 14px",background:"rgba(255,255,255,.04)",border:`1px solid ${CP.brd}`,borderRadius:10,marginBottom:8,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:12,color:CP.wh}}>
              <span style={{fontSize:"1.5rem"}}>{tr.icon}</span>
              <div style={{flex:1,textAlign:"left"}}>
                <div style={{fontSize:".66rem",fontWeight:700}}>{tr.label}</div>
                <div style={{fontSize:".5rem",color:CP.dim}}>{tr.desc}</div>
                <div style={{display:"flex",gap:8,marginTop:3}}>
                  <span style={{fontSize:".46rem",color:tr.devBonus>0?CP.grn:CP.dim}}>+{tr.devBonus} dev</span>
                  <span style={{fontSize:".46rem",color:tr.fatigueCost<0?CP.grn:CP.red}}>{tr.fatigueCost<0?`+${Math.abs(tr.fatigueCost)} kondisyon`:`-${tr.fatigueCost} kondisyon`}</span>
                  <span style={{fontSize:".46rem",color:CP.ora}}>+{tr.moralBonus} moral</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>}

      {/* YAŞAM OLAYLARI */}
      {modals.life&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.85)",zIndex:999,display:"flex",flexDirection:"column",justifyContent:"flex-end"}}>
        <div style={{background:CP.bg2,borderRadius:"16px 16px 0 0",padding:"20px 16px",maxHeight:"80vh",overflowY:"auto"}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
            <div style={{fontSize:".8rem",fontWeight:800,color:CP.wh}}>🏠 Yaşam & Yatırım</div>
            <button onClick={()=>showModal("life",false)} style={{background:"rgba(255,255,255,.1)",border:"none",color:CP.wh,borderRadius:6,padding:"4px 10px",cursor:"pointer",fontFamily:"inherit",fontSize:".6rem"}}>✕</button>
          </div>
          <div style={{fontSize:".52rem",color:CP.dim,marginBottom:12}}>Birikim: {(p.savings||0)>=1000?`${((p.savings||0)/1000).toFixed(1)}M`:`${p.savings||0}K`}€</div>
          {LIFE_EVENTS.map((ev,i)=>{
            const owned=(p.ownedAssets||[]).includes(ev.id);
            const canAfford=(p.savings||0)>=ev.cost;
            return(
              <div key={i} style={{background:"rgba(255,255,255,.04)",border:`1px solid ${owned?"rgba(16,185,129,.3)":CP.brd}`,borderRadius:10,padding:"12px 14px",marginBottom:8,opacity:canAfford||owned?1:0.55}}>
                <div style={{display:"flex",gap:10,alignItems:"center"}}>
                  <span style={{fontSize:"1.4rem"}}>{ev.icon}</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:".66rem",fontWeight:700,color:CP.wh}}>{ev.label}</div>
                    <div style={{fontSize:".52rem",color:CP.dim}}>{ev.desc}</div>
                    <div style={{fontSize:".5rem",color:CP.red,fontWeight:700}}>-{ev.cost}K€</div>
                  </div>
                  {owned?<span style={{fontSize:".6rem",color:CP.grn}}>✅ Sahip</span>:
                    <button onClick={()=>doLifeEvent(ev)} disabled={!canAfford} style={{padding:"8px 12px",background:canAfford?"linear-gradient(135deg,#065f46,#10b981)":"rgba(255,255,255,.08)",border:"none",borderRadius:8,color:CP.wh,fontWeight:700,cursor:canAfford?"pointer":"default",fontFamily:"inherit",fontSize:".58rem"}}>Satın Al</button>}
                </div>
              </div>
            );
          })}
        </div>
      </div>}

      {/* ÖZEL ANTRENÖR */}
      {modals.pcoach&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.85)",zIndex:999,display:"flex",flexDirection:"column",justifyContent:"flex-end"}}>
        <div style={{background:CP.bg2,borderRadius:"16px 16px 0 0",padding:"20px 16px",maxHeight:"75vh",overflowY:"auto"}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
            <div style={{fontSize:".8rem",fontWeight:800,color:CP.wh}}>🏋️ Özel Antrenör</div>
            <button onClick={()=>showModal("pcoach",false)} style={{background:"rgba(255,255,255,.1)",border:"none",color:CP.wh,borderRadius:6,padding:"4px 10px",cursor:"pointer",fontFamily:"inherit",fontSize:".6rem"}}>✕</button>
          </div>
          {PERSONAL_COACHES.map((pc,i)=>{
            const isHired=p.personalCoach===pc.id;
            return(
              <div key={i} style={{background:"rgba(255,255,255,.04)",border:`1px solid ${isHired?"rgba(139,92,246,.4)":CP.brd}`,borderRadius:10,padding:"12px 14px",marginBottom:8}}>
                <div style={{display:"flex",gap:10,alignItems:"center"}}>
                  <span style={{fontSize:"1.4rem"}}>{pc.icon}</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:".66rem",fontWeight:700,color:CP.wh}}>{pc.n}</div>
                    <div style={{fontSize:".52rem",color:CP.dim}}>{pc.desc}</div>
                    <div style={{fontSize:".5rem",color:CP.red}}>-{pc.cost}K€/sezon</div>
                  </div>
                  {isHired?<span style={{fontSize:".6rem",color:"#a78bfa"}}>Aktif ✅</span>:
                    <button onClick={()=>{if((p.savings||0)<pc.cost){t2("❌ Yetersiz birikim!",CP.red);return;}setP(prev=>({...prev,personalCoach:pc.id,savings:(prev.savings||0)-pc.cost}));t2(`✅ ${pc.n} tutuldu!`,"#a78bfa");showModal("pcoach",false);}} style={{padding:"8px 10px",background:"rgba(139,92,246,.15)",border:"1px solid rgba(139,92,246,.3)",borderRadius:8,color:"#a78bfa",cursor:"pointer",fontFamily:"inherit",fontSize:".56rem",fontWeight:700}}>Tut</button>}
                </div>
              </div>
            );
          })}
        </div>
      </div>}

      {/* SPONSOR MODAL */}
      {modals.sponsor&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.85)",zIndex:999,display:"flex",flexDirection:"column",justifyContent:"flex-end"}}>
        <div style={{background:CP.bg2,borderRadius:"16px 16px 0 0",padding:"20px 16px",maxHeight:"75vh",overflowY:"auto"}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
            <div style={{fontSize:".8rem",fontWeight:800,color:CP.wh}}>💼 Sponsorluk</div>
            <button onClick={()=>showModal("sponsor",false)} style={{background:"rgba(255,255,255,.1)",border:"none",color:CP.wh,borderRadius:6,padding:"4px 10px",cursor:"pointer",fontFamily:"inherit",fontSize:".6rem"}}>✕</button>
          </div>
          {SPONSORS.map((sp,i)=>{const have=(p.sponsors||[]).includes(sp.n);const elig=p.ovr>=sp.minOvr;return(
            <div key={i} style={{background:"rgba(255,255,255,.04)",border:`1px solid ${have?"rgba(245,158,11,.3)":elig?"rgba(77,166,255,.18)":CP.brd}`,borderRadius:10,padding:"12px 14px",marginBottom:8,opacity:elig?1:0.5}}>
              <div style={{display:"flex",gap:10,alignItems:"center"}}>
                <span style={{fontSize:"1.4rem"}}>{sp.icon}</span>
                <div style={{flex:1}}><div style={{fontSize:".66rem",fontWeight:700,color:CP.wh}}>{sp.n}</div><div style={{fontSize:".52rem",color:CP.dim}}>{sp.desc}</div><div style={{fontSize:".52rem",color:CP.grn,fontWeight:700}}>+{sp.salary}K€/sezon</div></div>
                {have?<span style={{fontSize:".6rem",color:"#f59e0b"}}>Aktif ✅</span>:elig?<button onClick={()=>{setP(prev=>({...prev,sponsors:[...(prev.sponsors||[]),sp.n],news:[genNews(prev,"diary",{msg:`${sp.icon} ${sp.n} ile sponsorluk anlaşması!`}),...(prev.news||[])]}));t2(`✅ ${sp.n} anlaşması!`,CP.grn);showModal("sponsor",false);}} style={{padding:"8px 10px",background:"rgba(245,158,11,.15)",border:"1px solid rgba(245,158,11,.3)",borderRadius:8,color:"#f59e0b",cursor:"pointer",fontFamily:"inherit",fontSize:".56rem",fontWeight:700}}>Kabul</button>:<span style={{fontSize:".52rem",color:"#555"}}>OVR {sp.minOvr}+</span>}
              </div>
            </div>
          );})}
        </div>
      </div>}

      {/* ÇATIŞMA MODAL */}
      {modals.conflict&&p.conflictWith&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.85)",zIndex:999,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
        <div style={{background:CP.bg2,borderRadius:16,padding:24,width:"100%",maxWidth:320}}>
          <div style={{textAlign:"center",marginBottom:14}}>
            <div style={{fontSize:"1.8rem",marginBottom:6}}>⚡</div>
            <div style={{fontSize:".84rem",fontWeight:800,color:CP.wh}}>Takım İçi Çatışma</div>
            <div style={{fontSize:".54rem",color:CP.dim,marginTop:6}}>{p.conflictWith} ile soyunma odasında gerginlik yaşandı. Ne yapacaksın?</div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            <button onClick={()=>resolveConflict("apologize")} style={{padding:"12px",background:"linear-gradient(135deg,#065f46,#10b981)",border:"none",borderRadius:10,color:CP.wh,fontWeight:700,cursor:"pointer",fontFamily:"inherit",fontSize:".68rem"}}>🤝 Özür Dile (Takım ilişkisi +15)</button>
            <button onClick={()=>resolveConflict("standground")} style={{padding:"12px",background:"rgba(239,68,68,.12)",border:"1px solid rgba(239,68,68,.3)",borderRadius:10,color:CP.red,fontWeight:700,cursor:"pointer",fontFamily:"inherit",fontSize:".68rem"}}>💪 Tutumunda Dur (İtibar +3)</button>
          </div>
        </div>
      </div>}

      {/* SKILL MODAL */}
      {modals.skills&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.85)",zIndex:999,display:"flex",flexDirection:"column",justifyContent:"flex-end"}}>
        <div style={{background:CP.bg2,borderRadius:"16px 16px 0 0",padding:"20px 16px",maxHeight:"80vh",overflowY:"auto"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
            <div style={{fontSize:".8rem",fontWeight:800,color:CP.wh}}>🎯 Skill Ağacı — {SKILL_TREES[p.pos]?.name}</div>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              <span style={{fontSize:".6rem",color:"#f59e0b",fontWeight:700}}>{p.skillPoints||0} puan</span>
              <button onClick={()=>showModal("skills",false)} style={{background:"rgba(255,255,255,.1)",border:"none",color:CP.wh,borderRadius:6,padding:"4px 10px",cursor:"pointer",fontFamily:"inherit",fontSize:".6rem"}}>✕</button>
            </div>
          </div>
          {(()=>{
            const sk=p.skills||{};
            const posSkillBonus={
              GK:(sk.reflexes||0)*0.8+(sk.positioning||0)*0.6+(sk.leadership||0)*0.4,
              CB:(sk.tackling||0)*0.8+(sk.heading||0)*0.6+(sk.composure||0)*0.5+(sk.pace_def||0)*0.3,
              LB:(sk.crossing||0)*0.5+(sk.pace||0)*0.7+(sk.tackling||0)*0.6+(sk.stamina||0)*0.4,
              RB:(sk.crossing||0)*0.5+(sk.pace||0)*0.7+(sk.tackling||0)*0.6+(sk.stamina||0)*0.4,
              CDM:(sk.tackling||0)*0.8+(sk.passing||0)*0.6+(sk.stamina||0)*0.5+(sk.vision||0)*0.4,
              CM:(sk.passing||0)*0.8+(sk.stamina||0)*0.6+(sk.shooting||0)*0.4+(sk.vision||0)*0.7,
              CAM:(sk.vision||0)*0.9+(sk.dribbling||0)*0.7+(sk.shooting||0)*0.6+(sk.freekick||0)*0.4,
              LM:(sk.pace||0)*0.8+(sk.dribbling||0)*0.7+(sk.crossing||0)*0.6+(sk.shooting||0)*0.5,
              RM:(sk.pace||0)*0.8+(sk.dribbling||0)*0.7+(sk.crossing||0)*0.6+(sk.shooting||0)*0.5,
              ST:(sk.finishing||0)*1.0+(sk.pace||0)*0.6+(sk.heading||0)*0.5+(sk.composure||0)*0.8,
            }[p.pos]||0;
            const totalBonus=Math.min(10,posSkillBonus*0.35);
            return <div style={{background:"rgba(36,133,255,.08)",border:"1px solid rgba(36,133,255,.2)",borderRadius:8,padding:"8px 12px",marginBottom:12,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontSize:".52rem",color:CP.dim}}>Toplam maç gücü etkisi</div>
              <div style={{fontSize:".65rem",fontWeight:800,color:totalBonus>0?"#4ade80":CP.dim}}>+{totalBonus.toFixed(1)} güç</div>
            </div>;
          })()}
          {(SKILL_TREES[p.pos]?.skills||[]).map(sk=>{
            const cur=(p.skills||{})[sk.id]||0;
            const canUp=(p.skillPoints||0)>0&&cur<sk.max;
            // Pozisyona göre bu skill'in ağırlığı
            const weightMap={finishing:1.0,composure:0.8,reflexes:0.8,tackling:0.8,passing:0.8,vision:0.7,dribbling:0.7,pace:0.7,positioning:0.6,heading:0.6,stamina:0.6,crossing:0.5,shooting:0.5,leadership:0.4,freekick:0.4,pace_def:0.3,distribution:0.3};
            const w=weightMap[sk.id]||0.5;
            const impact=cur*w*0.35;
            return(
              <div key={sk.id} style={{background:"rgba(255,255,255,.04)",border:`1px solid ${cur>0?"rgba(36,133,255,.25)":CP.brd}`,borderRadius:10,padding:"12px 14px",marginBottom:8}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
                  <div style={{display:"flex",gap:8,alignItems:"center"}}><span style={{fontSize:"1.2rem"}}>{sk.icon}</span><div><div style={{fontSize:".64rem",fontWeight:700,color:CP.wh}}>{sk.n}</div><div style={{fontSize:".48rem",color:CP.dim}}>{sk.desc||""}</div></div></div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:".58rem",fontWeight:700,color:CP.ac2}}>{cur}/{sk.max}</div>
                    {cur>0&&<div style={{fontSize:".42rem",color:"#4ade80"}}>+{impact.toFixed(2)} güç</div>}
                  </div>
                </div>
                <div style={{display:"flex",gap:3,marginBottom:8}}>{Array.from({length:sk.max},(_,i)=><div key={i} style={{flex:1,height:5,borderRadius:2,background:i<cur?"#2485ff":"rgba(255,255,255,.1)"}}/>)}</div>
                <button onClick={()=>upgradeSkill(sk.id)} disabled={!canUp} style={{width:"100%",padding:"8px",background:canUp?"rgba(36,133,255,.2)":"rgba(255,255,255,.05)",border:`1px solid ${canUp?CP.ac:"rgba(255,255,255,.07)"}`,borderRadius:7,color:canUp?CP.ac2:"#444",cursor:canUp?"pointer":"default",fontFamily:"inherit",fontSize:".6rem",fontWeight:700}}>
                  {cur>=sk.max?"MAX ✅":canUp?"Geliştir (1 puan)":"Puan Yok"}
                </button>
              </div>
            );
          })}
        </div>
      </div>}

      {/* EMEKLİLİK MODAL */}
      {modals.retire&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.85)",zIndex:999,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
        <div style={{background:CP.bg2,borderRadius:16,padding:24,width:"100%",maxWidth:320}}>
          <div style={{textAlign:"center",marginBottom:16}}><div style={{fontSize:"2rem",marginBottom:6}}>🕊️</div><div style={{fontSize:".9rem",fontWeight:800,color:CP.wh}}>Emekli Olmak İstiyor Musun?</div><div style={{fontSize:".54rem",color:CP.dim,marginTop:6}}>{p.age} yaşında, OVR {p.ovr} ile emekli olacaksın. {p.ovr>=85?"Efsane bir kariyer! 👑":""}</div></div>
          <div style={{display:"flex",gap:8}}><button onClick={()=>showModal("retire",false)} style={{flex:1,padding:"11px",background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",borderRadius:9,color:"#aaa",cursor:"pointer",fontFamily:"inherit",fontSize:".68rem"}}>İptal</button><button onClick={retire} style={{flex:2,padding:"11px",background:"linear-gradient(135deg,#7f1d1d,#991b1b)",border:"none",borderRadius:9,color:CP.wh,fontWeight:700,cursor:"pointer",fontFamily:"inherit",fontSize:".68rem"}}>🕊️ Emekli Ol</button></div>
        </div>
      </div>}
      <TabBar/>
    </div>
  );

  // ── MAÇ EKRANI ──
  if(tab==="match"&&matchResult) return(
    <div style={{position:"fixed",inset:0,background:CP.bg,display:"flex",flexDirection:"column",fontFamily:"system-ui,sans-serif",overflowY:"auto"}}>
      <ToastEl/>
      <style>{`
        @keyframes confettiFall {
          0%   { transform:translateY(-20px) rotate(0deg); opacity:1; }
          100% { transform:translateY(80px) rotate(720deg); opacity:0; }
        }
        @keyframes scorePop {
          0%   { transform:scale(0.5); opacity:0; }
          60%  { transform:scale(1.15); }
          100% { transform:scale(1); opacity:1; }
        }
        @keyframes slideUp {
          from { transform:translateY(20px); opacity:0; }
          to   { transform:translateY(0); opacity:1; }
        }
        @keyframes pulse {
          0%,100% { opacity:1; }
          50% { opacity:.6; }
        }
      `}</style>
      <div style={{
        background:matchResult.isWin
          ?"linear-gradient(160deg,#022c22 0%,#064e3b 50%,#065f46 100%)"
          :matchResult.isDraw
          ?"linear-gradient(160deg,#3d1a00 0%,#78350f 50%,#b45309 100%)"
          :"linear-gradient(160deg,#3d0000 0%,#7f1d1d 50%,#991b1b 100%)",
        padding:"24px 16px 20px",flexShrink:0,textAlign:"center",
        position:"relative",overflow:"hidden"
      }}>
        {/* Konfeti — sadece galibiyet */}
        {matchResult.isWin&&[...Array(18)].map((_,i)=>(
          <div key={i} style={{
            position:"absolute",
            left:`${5+i*5.5}%`,
            top:"-10px",
            width:8, height:8,
            borderRadius:i%3===0?"50%":i%3===1?"2px":"0",
            background:["#ffd700","#ff4444","#4da6ff","#30e070","#ff69b4","#ff8c00"][i%6],
            animation:`confettiFall ${0.8+i*0.12}s ease ${i*0.05}s both`,
            pointerEvents:"none"
          }}/>
        ))}
        {/* Parlama efekti */}
        <div style={{
          position:"absolute",inset:0,
          background:matchResult.isWin
            ?"radial-gradient(ellipse at 50% 0%,rgba(255,215,0,.15),transparent 70%)"
            :"radial-gradient(ellipse at 50% 0%,rgba(255,255,255,.05),transparent 70%)",
          pointerEvents:"none"
        }}/>
        {/* Badges */}
        <div style={{display:"flex",justifyContent:"center",gap:6,marginBottom:8}}>
          {matchResult.isCL&&<div style={{fontSize:".48rem",color:"#ffd060",fontWeight:700,letterSpacing:2,
            background:"rgba(255,208,96,.15)",border:"1px solid rgba(255,208,96,.3)",
            borderRadius:20,padding:"3px 10px"}}>⭐ ASK</div>}
          {matchResult.isDerby&&<div style={{fontSize:".48rem",color:"#ff6b6b",fontWeight:700,letterSpacing:2,
            background:"rgba(255,107,107,.15)",border:"1px solid rgba(255,107,107,.3)",
            borderRadius:20,padding:"3px 10px"}}>🔥 DERBİ</div>}
          {matchResult.isHome
            ?<div style={{fontSize:".48rem",color:"rgba(255,255,255,.6)",background:"rgba(255,255,255,.08)",borderRadius:20,padding:"3px 10px"}}>🏠 İç Saha</div>
            :<div style={{fontSize:".48rem",color:"rgba(255,255,255,.6)",background:"rgba(255,255,255,.08)",borderRadius:20,padding:"3px 10px"}}>✈️ Deplasman</div>}
        </div>
        {/* Büyük emoji */}
        <div style={{fontSize:"3.2rem",marginBottom:6,animation:"scorePop .5s ease"}}>
          {matchResult.isWin?"🏆":matchResult.isDraw?"🤝":"😔"}
        </div>
        {/* Skor */}
        <div style={{
          fontSize:"2.4rem",fontWeight:900,color:"white",
          letterSpacing:2,marginBottom:4,
          animation:"scorePop .4s ease .1s both",
          textShadow:matchResult.isWin?"0 0 30px rgba(255,215,0,.5)":"none"
        }}>{matchResult.score}</div>
        {/* Sonuç etiketi */}
        <div style={{
          display:"inline-block",
          fontSize:".72rem",fontWeight:900,letterSpacing:3,
          padding:"6px 20px",borderRadius:24,
          background:matchResult.isWin?"rgba(255,215,0,.2)":matchResult.isDraw?"rgba(255,255,255,.15)":"rgba(255,50,50,.2)",
          border:matchResult.isWin?"1px solid rgba(255,215,0,.4)":matchResult.isDraw?"1px solid rgba(255,255,255,.25)":"1px solid rgba(255,50,50,.3)",
          color:matchResult.isWin?"#ffd700":"white",
          animation:"slideUp .4s ease .2s both"
        }}>{matchResult.isWin?"GALİBİYET":matchResult.isDraw?"BERABERLİK":"MAĞLUBIYET"}</div>
        {/* Hava durumu */}
        <div style={{fontSize:".52rem",color:"rgba(255,255,255,.5)",marginTop:8}}>
          {matchResult.weather?.icon} {matchResult.weather?.n}
        </div>
        {matchResult.rcBan>0&&<div style={{marginTop:6,fontSize:".52rem",color:"#ff6b6b",fontWeight:700,
          background:"rgba(255,50,50,.15)",borderRadius:8,padding:"4px 10px",display:"inline-block"}}>
          🟥 {matchResult.rcBan} maç ceza aldın!
        </div>}
      </div>

      <div style={{padding:"14px 16px",flex:1}}>
        {/* Rating */}
        <div style={{
          background:matchResult.rating>=9
            ?"linear-gradient(135deg,rgba(255,215,0,.12),rgba(255,215,0,.04))"
            :matchResult.rating>=7
            ?"linear-gradient(135deg,rgba(16,185,129,.1),rgba(16,185,129,.03))"
            :"rgba(255,255,255,.04)",
          border:`1px solid ${matchResult.rating>=9?"rgba(255,215,0,.3)":matchResult.rating>=7?"rgba(16,185,129,.25)":CP.brd}`,
          borderRadius:14,padding:16,marginBottom:12,textAlign:"center",
          animation:"fadeUp .4s ease .1s both"
        }}>
          <div style={{fontSize:".5rem",color:CP.dim,marginBottom:6,textTransform:"uppercase",letterSpacing:1}}>Performans Puanı</div>
          <div style={{
            fontSize:"3.8rem",fontWeight:900,lineHeight:1,
            color:matchResult.rating>=9?"#ffd060":matchResult.rating>=8?CP.grn:matchResult.rating>=7?CP.ac2:matchResult.rating>=6?"#f59e0b":CP.red,
            textShadow:matchResult.rating>=9?"0 0 30px rgba(255,215,0,.6)":matchResult.rating>=8?"0 0 20px rgba(16,185,129,.5)":"none",
            animation:"scorePop .5s ease"
          }}>{typeof matchResult.rating==="number"?matchResult.rating.toFixed(1):matchResult.rating}</div>
          {matchResult.motm&&<div style={{
            marginTop:8,padding:"8px 16px",
            background:"linear-gradient(135deg,rgba(255,215,0,.2),rgba(255,215,0,.08))",
            border:"1px solid rgba(255,215,0,.4)",borderRadius:10,
            fontSize:".64rem",fontWeight:900,color:"#ffd700",letterSpacing:1,
            animation:"scorePop .4s ease .3s both"
          }}>🌟 MAÇIN ADAMI!</div>}
          {matchResult.mgRes&&<div style={{marginTop:4,padding:"6px 10px",background:matchResult.mgRes.isGoal?"rgba(16,185,129,.12)":"rgba(239,68,68,.1)",border:`1px solid ${matchResult.mgRes.isGoal?"rgba(16,185,129,.3)":"rgba(239,68,68,.25)"}`,borderRadius:8,fontSize:".54rem",color:matchResult.mgRes.isGoal?"#10b981":"#ef4444",fontWeight:700}}>
            {matchResult.mgRes.type==="shot"?"⚽ Şut Mini-Game: ":matchResult.mgRes.type==="penalty"?"🎯 Penaltı: ":"🌀 Frikik: "}
            {matchResult.mgRes.msg}
          </div>}
          {matchResult.hasPenalty&&<div style={{marginTop:3,fontSize:".54rem",color:matchResult.penScored?CP.grn:CP.red,fontWeight:700}}>{matchResult.penScored?"🎯 Penaltı golü!":"😱 Penaltı kaçırdın!"}</div>}
          {matchResult.hasLastMin&&<div style={{marginTop:3,fontSize:".56rem",color:"#ffd060",fontWeight:700}}>⏰ Son dakika golü! +{matchResult.extraTime}!</div>}
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginTop:12}}>
            {[{l:"Gol",v:matchResult.goals,i:"⚽"},{l:"Asist",v:matchResult.assists,i:"🎯"},{l:"Dakika",v:matchResult.mins,i:"⏱️"}].map((s,i)=>(
              <div key={i}><div style={{fontSize:"1rem"}}>{s.i}</div><div style={{fontSize:".88rem",fontWeight:800,color:CP.wh}}>{s.v}</div><div style={{fontSize:".44rem",color:CP.dim}}>{s.l}</div></div>
            ))}
          </div>
          {matchResult.ovrUp&&<div style={{
            marginTop:10,padding:"10px 14px",
            background:"linear-gradient(135deg,rgba(139,92,246,.2),rgba(139,92,246,.08))",
            border:"1px solid rgba(139,92,246,.4)",borderRadius:10,
            fontSize:".62rem",color:"#c084fc",fontWeight:800,
            animation:"slideUp .4s ease .4s both",
            display:"flex",alignItems:"center",gap:8
          }}>
            <span style={{fontSize:"1.2rem"}}>⬆️</span>
            <div>
              <div style={{fontSize:".5rem",color:"rgba(192,132,252,.6)",letterSpacing:1}}>GELİŞİM!</div>
              <div>OVR <span style={{color:"rgba(255,255,255,.5)"}}>{matchResult.newOvr-1}</span> → <span style={{color:"#c084fc",fontSize:".72rem"}}>{matchResult.newOvr}</span></div>
            </div>
          </div>}
          {matchResult.injured&&<div style={{marginTop:8,padding:"8px 12px",background:"rgba(239,68,68,.12)",border:"1px solid rgba(239,68,68,.3)",borderRadius:8,fontSize:".56rem",color:CP.red,fontWeight:700}}>🩹 Sakatlandın! {matchResult.injWeeks} hafta dinleneceksin.</div>}
        </div>

        {/* Maç hedefleri */}
        {(matchResult.matchGoals||[]).length>0&&<div style={{background:"rgba(255,215,0,.06)",border:"1px solid rgba(255,215,0,.16)",borderRadius:11,padding:"10px 13px",marginBottom:12}}>
          <div style={{fontSize:".52rem",color:"#ffd060",fontWeight:700,marginBottom:7}}>🎯 Maç Hedefleri</div>
          {(matchResult.matchGoals||[]).map((g,i)=>{const done=(matchResult.achGoals||[]).includes(g.id);return(
            <div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
              <span style={{fontSize:".9rem"}}>{done?"✅":"❌"}</span>
              <span style={{fontSize:".56rem",color:done?CP.grn:CP.dim,flex:1}}>{g.desc}</span>
              <span style={{fontSize:".5rem",color:done?"#ffd060":"#444"}}>{done?`+${g.reward} itibar`:""}</span>
            </div>
          );})}
        </div>}

        {/* Maç akışı */}
        <div style={{background:"rgba(255,255,255,.03)",border:`1px solid ${CP.brd}`,borderRadius:12,padding:"11px 13px",marginBottom:12}}>
          <div style={{fontSize:".52rem",color:CP.ac2,fontWeight:700,marginBottom:8,textTransform:"uppercase",letterSpacing:1}}>⚡ Maç Akışı</div>
          {matchFlow.map((ev,i)=>(
            <div key={i} style={{display:"flex",gap:8,alignItems:"flex-start",padding:"6px 0",borderBottom:i<matchFlow.length-1?`1px solid rgba(77,166,255,.06)`:"none"}}>
              <div style={{fontSize:".52rem",fontWeight:700,color:CP.ac2,minWidth:26}}>{ev.min}'</div>
              <div style={{fontSize:".56rem",lineHeight:1.4,color:["goal_self","assist_self","pen_scored","last_min"].includes(ev.type)?CP.grn:["opp_goal","red_card","pen_miss"].includes(ev.type)?CP.red:ev.type==="derby"||ev.type==="cl"?"#ffd060":"#ccc"}}>{ev.txt}</div>
            </div>
          ))}
        </div>

        {/* Antrenör yorumu */}
        {coachMsg&&<div style={{background:coachMsg.type==="praise"?"rgba(16,185,129,.1)":coachMsg.type==="critic"?"rgba(239,68,68,.1)":"rgba(255,255,255,.05)",border:`1px solid ${coachMsg.type==="praise"?"rgba(16,185,129,.25)":coachMsg.type==="critic"?"rgba(239,68,68,.25)":"rgba(255,255,255,.1)"}`,borderRadius:10,padding:"11px 13px",marginBottom:12}}>
          <div style={{fontSize:".5rem",color:coachMsg.type==="praise"?CP.grn:coachMsg.type==="critic"?CP.red:CP.dim,fontWeight:700,marginBottom:4}}>👨‍💼 Antrenör {coachMsg.relChg>0?"(+ilişki)":coachMsg.relChg<0?"(-ilişki)":""}</div>
          <div style={{fontSize:".58rem",color:"#ddd",lineHeight:1.5,fontStyle:"italic"}}>"{coachMsg.msg}"</div>
        </div>}

        {/* Basın */}
        {pressQ&&<div style={{background:"rgba(255,255,255,.04)",border:`1px solid ${CP.brd}`,borderRadius:12,padding:14,marginBottom:12}}>
          <div style={{fontSize:".52rem",color:CP.ac2,fontWeight:700,marginBottom:8}}>📢 Basın Toplantısı</div>
          <div style={{fontSize:".62rem",color:CP.wh,fontWeight:700,marginBottom:10,lineHeight:1.4}}>"{pressQ.q}"</div>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {(pressQ.opts||[]).map((opt,i)=>(
              <button key={i} onClick={()=>answerPress(opt,pressQ)} style={{padding:"10px 12px",background:"rgba(36,133,255,.1)",border:`1px solid ${CP.brd}`,borderRadius:8,color:CP.wh,cursor:"pointer",fontFamily:"inherit",fontSize:".58rem",textAlign:"left",lineHeight:1.4}}>💬 "{opt}"</button>
            ))}
          </div>
        </div>}

        <button onClick={()=>{setPressQ(null);setTab("home");}} style={{width:"100%",padding:"14px",background:"linear-gradient(135deg,#1a6ed8,#2485ff)",border:"none",borderRadius:11,color:CP.wh,fontWeight:800,cursor:"pointer",fontFamily:"inherit",fontSize:".76rem"}}>DEVAM ET →</button>
        <div style={{height:20}}/>
      </div>
    </div>
  );

  // ── HABERLER ──
  if(tab==="news") return(
    <div style={{position:"fixed",inset:0,background:CP.bg,display:"flex",flexDirection:"column",fontFamily:"system-ui,sans-serif"}}>
      <div style={{padding:"14px 16px",borderBottom:`1px solid ${CP.brd}`,flexShrink:0}}><div style={{fontSize:".82rem",fontWeight:800,color:CP.wh}}>📰 Haberler & Sosyal Medya</div><div style={{fontSize:".5rem",color:CP.dim}}>Sezon {p.season} · {p.team}</div></div>
      <div style={{flex:1,overflowY:"auto",padding:"12px 14px"}}>
        <div style={{background:"rgba(36,133,255,.06)",border:`1px solid ${CP.brd}`,borderRadius:12,padding:14,marginBottom:14}}>
          <div style={{fontSize:".54rem",color:CP.ac2,fontWeight:700,marginBottom:8}}>📱 Sosyal Medya</div>
          {((p.goals>=10?SOCIAL.great:p.goals>=5?SOCIAL.good:SOCIAL.bad).slice(0,3)).map((c,i)=>(
            <div key={i} style={{padding:"8px 10px",background:"rgba(255,255,255,.04)",borderRadius:8,marginBottom:6,fontSize:".56rem",color:"#ddd",lineHeight:1.5}}>
              <span style={{color:CP.ac2,fontWeight:700}}>@taraftar{1000+i*317} </span>
              {c.replace(/{name}/g,p.name).replace("{team}",p.team)}
            </div>
          ))}
          {p.isCaptain&&<div style={{padding:"8px 10px",background:"rgba(255,215,0,.08)",borderRadius:8,marginBottom:6,fontSize:".56rem",color:"#fcd34d",lineHeight:1.5}}><span style={{color:"#ffd060",fontWeight:700}}>@futbolfanı </span>{SOCIAL.captain[0].replace(/{name}/g,p.name)}</div>}
        </div>
        {(p.news||[]).length===0?<div style={{textAlign:"center",padding:"40px 0",color:CP.dim,fontSize:".6rem"}}>Maç oyna, haber üret!</div>:(p.news||[]).map((n,i)=>(
          <div key={i} style={{background:"rgba(255,255,255,.04)",border:`1px solid ${CP.brd}`,borderRadius:11,padding:"12px 14px",marginBottom:8}}>
            <div style={{display:"flex",gap:8,alignItems:"flex-start"}}>
              <span style={{fontSize:"1.3rem"}}>{n.icon}</span>
              <div style={{flex:1}}><div style={{fontSize:".64rem",fontWeight:700,color:CP.wh,marginBottom:3}}>{n.title}</div><div style={{fontSize:".54rem",color:CP.dim,lineHeight:1.4}}>{n.body}</div><div style={{fontSize:".44rem",color:"#3a5070",marginTop:4}}>{n.date}</div></div>
            </div>
          </div>
        ))}
        <div style={{height:16}}/>
      </div>
      <TabBar/>
    </div>
  );

  // ── LİG ──
  if(tab==="league") return(
    <div style={{position:"fixed",inset:0,background:CP.bg,display:"flex",flexDirection:"column",fontFamily:"system-ui,sans-serif"}}>
      <div style={{padding:"14px 16px",borderBottom:`1px solid ${CP.brd}`,flexShrink:0}}><div style={{fontSize:".82rem",fontWeight:800,color:CP.wh}}>📊 {p.teamLg}</div><div style={{fontSize:".5rem",color:CP.dim}}>Sezon {p.season} · H{p.week}/34</div></div>
      <div style={{flex:1,overflowY:"auto",padding:"12px 14px"}}>
        {/* Puan tablosu */}
        <div style={{background:"rgba(255,255,255,.03)",border:`1px solid ${CP.brd}`,borderRadius:12,overflow:"hidden",marginBottom:14}}>
          <div style={{display:"grid",gridTemplateColumns:"20px 1fr 26px 26px 26px 26px 36px 28px",padding:"7px 10px",fontSize:".42rem",color:CP.dim,background:"rgba(255,255,255,.04)",borderBottom:`1px solid ${CP.brd}`}}>
            <span>#</span><span>Takım</span><span style={{textAlign:"center"}}>O</span><span style={{textAlign:"center"}}>G</span><span style={{textAlign:"center"}}>B</span><span style={{textAlign:"center"}}>M</span><span style={{textAlign:"center"}}>Av</span><span style={{textAlign:"center"}}>P</span>
          </div>
          {(p.leagueTable||[]).map((t,i)=>(
            <div key={t.n} style={{display:"grid",gridTemplateColumns:"20px 1fr 26px 26px 26px 26px 36px 28px",padding:"7px 10px",borderBottom:i<(p.leagueTable||[]).length-1?`1px solid rgba(77,166,255,.06)`:"none",background:t.me?"rgba(36,133,255,.1)":"transparent",alignItems:"center"}}>
              <span style={{fontSize:".52rem",fontWeight:700,color:i<3?"#ffd060":i<6?CP.ac2:CP.dim}}>{i+1}</span>
              <div style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:6,height:6,borderRadius:"50%",background:t.color||CP.dim,flexShrink:0}}/><span style={{fontSize:".58rem",color:t.me?CP.ac2:"#ccc",fontWeight:t.me?700:400,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.me?"▶ ":""}{t.n}</span></div>
              <span style={{fontSize:".5rem",color:CP.dim,textAlign:"center"}}>{t.w+t.d+t.l}</span>
              <span style={{fontSize:".5rem",color:CP.grn,textAlign:"center"}}>{t.w}</span>
              <span style={{fontSize:".5rem",color:"#f59e0b",textAlign:"center"}}>{t.d}</span>
              <span style={{fontSize:".5rem",color:CP.red,textAlign:"center"}}>{t.l}</span>
              <span style={{fontSize:".48rem",color:CP.dim,textAlign:"center"}}>{(t.gf-t.ga)>=0?"+":""}{t.gf-t.ga}</span>
              <span style={{fontSize:".66rem",fontWeight:800,color:t.me?CP.ac2:CP.wh,textAlign:"center"}}>{t.pts}</span>
            </div>
          ))}
        </div>
        {/* Gol & Asist Krallığı */}
        {(()=>{
          const scorersRaw=p.topScorers||[];
          const topG=[...scorersRaw].sort((a,b)=>b.goals-a.goals).slice(0,10);
          const topA=[...scorersRaw].sort((a,b)=>b.assists-a.assists).slice(0,10);
          const list=kTab==="gol"?topG:topA;
          const valKey=kTab==="gol"?"goals":"assists";
          const accentCol=kTab==="gol"?"#ffd060":"#a78bfa";
          const accentBg=kTab==="gol"?"rgba(255,215,0,.06)":"rgba(142,68,173,.06)";
          const accentBrd=kTab==="gol"?"rgba(255,215,0,.15)":"rgba(142,68,173,.15)";
          const valLabel=kTab==="gol"?"gol":"as.";
          return(
            <div style={{background:"rgba(255,255,255,.03)",border:`1px solid ${CP.brd}`,borderRadius:12,overflow:"hidden",marginBottom:14}}>
              {/* Sekme başlığı */}
              <div style={{display:"flex",borderBottom:`1px solid ${CP.brd}`}}>
                {[["gol","⚽ Gol Krallığı"],["asist","🎯 Asist Krallığı"]].map(([k,lbl])=>(
                  <button key={k} onClick={()=>setKTab(k)} style={{
                    flex:1,padding:"9px 6px",border:"none",cursor:"pointer",fontFamily:"inherit",
                    fontSize:".52rem",fontWeight:700,letterSpacing:.5,
                    background:kTab===k?(k==="gol"?"rgba(255,215,0,.1)":"rgba(142,68,173,.1)"):"transparent",
                    color:kTab===k?(k==="gol"?"#ffd060":"#a78bfa"):CP.dim,
                    borderBottom:kTab===k?`2px solid ${k==="gol"?"#ffd060":"#a78bfa"}`:"2px solid transparent",
                    transition:"all .15s"
                  }}>{lbl}</button>
                ))}
              </div>
              {/* Liste */}
              {list.map((s,i)=>(
                <div key={s.n} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 12px",
                  borderBottom:i<list.length-1?`1px solid rgba(77,166,255,.06)`:"none",
                  background:s.me?"rgba(36,133,255,.1)":"transparent"}}>
                  <span style={{fontSize:".52rem",fontWeight:800,color:i===0?accentCol:i<3?CP.ac2:CP.dim,minWidth:18,textAlign:"center"}}>{i+1}</span>
                  {/* Bar arka planı */}
                  <div style={{flex:1,position:"relative",overflow:"hidden"}}>
                    <div style={{position:"absolute",left:0,top:0,bottom:0,
                      width:`${list[0]?.[valKey]>0?Math.round((s[valKey]/list[0][valKey])*100):0}%`,
                      background:`${accentCol}18`,borderRadius:3}}/>
                    <span style={{position:"relative",fontSize:".58rem",color:s.me?CP.ac2:"#ccc",fontWeight:s.me?700:400,paddingLeft:2}}>
                      {s.me?"⭐ ":""}{s.n}
                    </span>
                  </div>
                  <span style={{fontSize:".44rem",color:CP.dim,maxWidth:60,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.team||""}</span>
                  <span style={{fontSize:".64rem",fontWeight:800,color:i===0?accentCol:CP.wh,minWidth:28,textAlign:"right"}}>{s[valKey]} <span style={{fontSize:".42rem",fontWeight:400,color:CP.dim}}>{valLabel}</span></span>
                </div>
              ))}
              {list.length===0&&<div style={{padding:14,textAlign:"center",fontSize:".54rem",color:CP.dim}}>Henüz veri yok</div>}
            </div>
          );
        })()}
        {/* Form */}
        {(p.weeklyFormRatings||[]).length>2&&<div style={{background:"rgba(255,255,255,.03)",border:`1px solid ${CP.brd}`,borderRadius:12,padding:"12px 14px",marginBottom:14}}>
          <div style={{fontSize:".54rem",color:CP.ac2,fontWeight:700,marginBottom:10}}>📈 Form Grafiği</div>
          <div style={{display:"flex",alignItems:"flex-end",gap:4,height:50}}>
            {(p.weeklyFormRatings||[]).slice(-8).map((r,i)=>{const h=Math.round(((r-4)/(9.9-4))*50);const col=r>=8?"#ffd060":r>=7?CP.grn:r>=6?CP.ac2:"#f59e0b";return(<div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2}}><div style={{width:"100%",background:col,borderRadius:"3px 3px 0 0",height:h,minHeight:3}}/><div style={{fontSize:".38rem",color:CP.dim}}>{r}</div></div>);})}
          </div>
        </div>}
        {/* Ballon d'Or */}
        {p.ballonDorVotes>0&&<div style={{background:"rgba(255,215,0,.08)",border:"1px solid rgba(255,215,0,.25)",borderRadius:11,padding:"12px 14px",marginBottom:14}}><div style={{display:"flex",gap:10,alignItems:"center"}}><span style={{fontSize:"1.6rem"}}>🏆</span><div><div style={{fontSize:".62rem",fontWeight:700,color:"#ffd060"}}>Ballon d'Or {p.ballonDor?"KAZANDIN! 👑":"Adayı"}</div><div style={{fontSize:".52rem",color:CP.dim}}>{p.ballonDorVotes} oy</div></div></div></div>}
        <div style={{height:16}}/>
      </div>
      <TabBar/>
    </div>
  );

  // ── İSTATİSTİK ──
  if(tab==="stats") return(
    <div style={{position:"fixed",inset:0,background:CP.bg,display:"flex",flexDirection:"column",fontFamily:"system-ui,sans-serif"}}>
      <div style={{padding:"14px 16px",borderBottom:`1px solid ${CP.brd}`,flexShrink:0}}><div style={{fontSize:".82rem",fontWeight:800,color:CP.wh}}>📈 Kariyer İstatistikleri</div></div>
      <div style={{flex:1,overflowY:"auto",padding:"12px 14px"}}>
        {/* OVR grafiği */}
        {(p.ovrHistory||[]).length>2&&<div style={{background:"rgba(255,255,255,.04)",border:`1px solid ${CP.brd}`,borderRadius:12,padding:"12px 14px",marginBottom:12}}>
          <div style={{fontSize:".52rem",color:CP.ac2,fontWeight:700,marginBottom:8}}>📊 OVR Gelişim</div>
          <div style={{display:"flex",alignItems:"flex-end",gap:3,height:44}}>
            {(p.ovrHistory||[]).slice(-12).map((o,i)=>{const h=Math.round(((o-50)/(99-50))*44);return(<div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2}}><div style={{width:"100%",background:o>=90?"#ffd060":o>=80?CP.grn:o>=70?CP.ac2:"#8b5cf6",borderRadius:"2px 2px 0 0",height:h,minHeight:2}}/><div style={{fontSize:".36rem",color:CP.dim}}>{o}</div></div>);})}
          </div>
        </div>}
        {/* Kariyer özet */}
        <div style={{background:"rgba(255,255,255,.04)",border:`1px solid ${CP.brd}`,borderRadius:12,padding:14,marginBottom:12}}>
          <div style={{fontSize:".52rem",color:CP.ac2,fontWeight:700,marginBottom:10}}>Kariyer Özeti</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
            {[{l:"Toplam Maç",v:p.totalMatches,i:"⚽"},{l:"Toplam Gol",v:p.totalGoals,i:"🥅"},{l:"Toplam Asist",v:p.totalAssists,i:"🎯"},{l:"OVR",v:p.ovr,i:"⭐"},{l:"Milli Cap",v:p.nationalCaps,i:CAREER_FLAGS[p.nat]||"🌍"},{l:"Birikim",v:`${(p.savings||0)>=1000?`${((p.savings||0)/1000).toFixed(1)}M`:`${p.savings||0}K`}€`,i:"💰"},{l:"MoTM",v:p.motmCount||0,i:"🌟"},{l:"Sezon",v:p.season-1,i:"📅"},{l:"Kırmızı Kart",v:p.redCards||0,i:"🟥"}].map((s,i)=>(
              <div key={i} style={{textAlign:"center",background:"rgba(255,255,255,.03)",borderRadius:8,padding:"8px 4px"}}>
                <div style={{fontSize:".85rem"}}>{s.i}</div>
                <div style={{fontSize:".76rem",fontWeight:800,color:CP.wh}}>{s.v}</div>
                <div style={{fontSize:".4rem",color:CP.dim}}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
        {/* Başarılar */}
        <div style={{marginBottom:12}}>
          <div style={{fontSize:".54rem",color:"#ffd060",fontWeight:700,marginBottom:8}}>🏆 Başarılar ({(p.achievements||[]).length}/{CAREER_ACHIEVEMENTS.length})</div>
          {["kariyer","performans","sezon","gelisim","milli","transfer","odul","sosyal","finans"].map(cat=>{
            const cas=CAREER_ACHIEVEMENTS.filter(a=>a.cat===cat);
            return(<div key={cat} style={{marginBottom:8}}>
              <div style={{fontSize:".46rem",color:CP.dim,marginBottom:4,textTransform:"uppercase",letterSpacing:1}}>{cat}</div>
              <div style={{display:"flex",flexDirection:"column",gap:4}}>
                {cas.map(a=>{const done=(p.achievements||[]).includes(a.id);return(
                  <div key={a.id} style={{display:"flex",gap:8,alignItems:"center",padding:"7px 11px",background:done?"rgba(255,215,0,.07)":"rgba(255,255,255,.03)",border:`1px solid ${done?"rgba(255,215,0,.2)":"rgba(255,255,255,.06)"}`,borderRadius:8}}>
                    <span style={{fontSize:"1rem",opacity:done?1:0.2}}>{a.icon}</span>
                    <div style={{flex:1}}><div style={{fontSize:".56rem",fontWeight:700,color:done?"#ffd060":"#444"}}>{a.title}</div><div style={{fontSize:".46rem",color:done?CP.dim:"#333"}}>{a.desc}</div></div>
                    {done&&<span style={{fontSize:".52rem",color:CP.grn}}>✅</span>}
                  </div>
                );})}
              </div>
            </div>);
          })}
        </div>
        {/* Sezon geçmişi */}
        {(p.history||[]).length>0&&<div>
          <div style={{fontSize:".54rem",color:CP.ac2,fontWeight:700,marginBottom:8}}>📅 Sezon Geçmişi</div>
          {[...(p.history||[])].reverse().map((s,i)=>(
            <div key={i} style={{background:"rgba(255,255,255,.03)",border:`1px solid ${CP.brd}`,borderRadius:10,padding:"10px 13px",marginBottom:6}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><div><span style={{fontSize:".62rem",fontWeight:700,color:CP.wh}}>Sezon {s.season}</span><span style={{fontSize:".52rem",color:CP.dim,marginLeft:6}}>{s.age} yaş</span></div><span style={{fontSize:".6rem",color:CP.ac2,fontWeight:700}}>OVR {s.ovr}</span></div>
              <div style={{fontSize:".52rem",color:CP.dim,marginBottom:4}}>{s.team} {s.isCaptain?"🎗️ Kaptan":""}</div>
              <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                <span style={{fontSize:".54rem",color:"#ccc"}}>{s.matches} maç</span>
                <span style={{fontSize:".54rem",color:CP.grn}}>{s.goals} gol</span>
                <span style={{fontSize:".54rem",color:CP.ac2}}>{s.assists} asist</span>
                <span style={{fontSize:".54rem",color:"#ffd060"}}>⭐ {s.avgRating}</span>
                {s.isTopScorer&&<span style={{fontSize:".54rem",color:"#f59e0b"}}>🥇 Gol Kralı</span>}
                {s.isTopAssister&&<span style={{fontSize:".54rem",color:"#a78bfa"}}>🎯 Asist Kralı</span>}
                {s.motm>0&&<span style={{fontSize:".54rem",color:"#8b5cf6"}}>🌟 {s.motm}× MoTM</span>}
                {s.ballonDor&&<span style={{fontSize:".54rem",color:"#ffd060"}}>🏆 Ballon d'Or</span>}
              </div>
            </div>
          ))}
        </div>}
        <div style={{height:16}}/>
      </div>
      <TabBar/>
    </div>
  );

  // ── GÜNLÜK ──
  if(tab==="diary") return(
    <div style={{position:"fixed",inset:0,background:CP.bg,display:"flex",flexDirection:"column",fontFamily:"system-ui,sans-serif"}}>
      <div style={{padding:"14px 16px",borderBottom:`1px solid ${CP.brd}`,flexShrink:0}}>
        <div style={{fontSize:".82rem",fontWeight:800,color:CP.wh}}>📓 Kariyer Günlüğü</div>
        <div style={{fontSize:".5rem",color:CP.dim}}>{p.name}'ın iç dünyası · {pers.icon} {pers.label}</div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"12px 14px"}}>
        {mentor&&<div style={{background:"rgba(139,92,246,.08)",border:"1px solid rgba(139,92,246,.22)",borderRadius:11,padding:"11px 13px",marginBottom:14}}>
          <div style={{fontSize:".54rem",color:"#a78bfa",fontWeight:700,marginBottom:4}}>👨‍🏫 Mentor: {mentor.n}</div>
          <div style={{fontSize:".56rem",color:"#c4b5fd",fontStyle:"italic"}}>"{mentor.quote}"</div>
        </div>}
        {(p.diary||[]).length===0?<div style={{textAlign:"center",padding:"60px 0",color:CP.dim,fontSize:".62rem"}}>Günlük boş. Oyna ve yaşa!</div>:(p.diary||[]).map((d,i)=>(
          <div key={i} style={{background:"rgba(255,255,255,.04)",border:`1px solid ${CP.brd}`,borderRadius:12,padding:"14px 16px",marginBottom:8}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><span style={{fontSize:".54rem",fontWeight:700,color:CP.ac2}}>📓 Hafta {d.week}</span><span style={{fontSize:".44rem",color:"#3a5070"}}>{d.date}</span></div>
            <div style={{fontSize:".62rem",color:"#ddd",lineHeight:1.7,fontStyle:"italic"}}>"{d.text}"</div>
            <div style={{fontSize:".48rem",color:"#3a5070",marginTop:6,textAlign:"right"}}>— {p.name}</div>
          </div>
        ))}
        {(p.pressConf||[]).length>0&&<div style={{marginTop:10}}>
          <div style={{fontSize:".54rem",color:CP.ac2,fontWeight:700,marginBottom:8}}>📢 Basın Toplantısı Geçmişi</div>
          {(p.pressConf||[]).map((pc,i)=>(
            <div key={i} style={{background:"rgba(255,255,255,.03)",border:`1px solid rgba(77,166,255,.08)`,borderRadius:10,padding:"10px 13px",marginBottom:6}}>
              <div style={{fontSize:".56rem",color:CP.dim,marginBottom:4}}>❓ "{pc.q}"</div>
              <div style={{fontSize:".58rem",color:"#ccc",fontStyle:"italic"}}>💬 "{pc.a}"</div>
            </div>
          ))}
        </div>}
        <div style={{height:16}}/>
      </div>
      <TabBar/>
    </div>
  );

  // ── SEZON SONU ──
  if(tab==="season_end") return(
    <div style={{position:"fixed",inset:0,background:CP.bg,display:"flex",flexDirection:"column",fontFamily:"system-ui,sans-serif",overflowY:"auto",padding:"20px 16px"}}>
      <style>{`
        @keyframes seasonConfetti {
          0%   { transform:translateY(-30px) rotate(0deg) scale(1); opacity:1; }
          100% { transform:translateY(120px) rotate(900deg) scale(0.5); opacity:0; }
        }
        @keyframes seasonGlow {
          0%,100% { text-shadow: 0 0 20px rgba(255,215,0,.5); }
          50%      { text-shadow: 0 0 40px rgba(255,215,0,.9), 0 0 60px rgba(255,215,0,.4); }
        }
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(16px); }
          to   { opacity:1; transform:translateY(0); }
        }
      `}</style>
      <ToastEl/>
      {/* Konfeti arka plan */}
      <div style={{position:"fixed",inset:0,pointerEvents:"none",overflow:"hidden",zIndex:1}}>
        {[...Array(20)].map((_,i)=>(
          <div key={i} style={{
            position:"absolute",
            left:`${i*5}%`,top:"-20px",
            width:i%2===0?10:7,height:i%2===0?10:7,
            borderRadius:i%3===0?"50%":"2px",
            background:["#ffd700","#ff4444","#4da6ff","#30e070","#c084fc","#fb923c"][i%6],
            animation:`seasonConfetti ${1+i*0.15}s ease ${i*0.08}s both`
          }}/>
        ))}
      </div>
      <div style={{textAlign:"center",marginBottom:18,position:"relative",zIndex:2,animation:"fadeUp .5s ease"}}>
        <div style={{fontSize:"3.5rem",marginBottom:8}}>🏁</div>
        <div style={{
          fontSize:"1.1rem",fontWeight:900,color:"#ffd700",
          animation:"seasonGlow 2s ease infinite",letterSpacing:1
        }}>SEZON {p.season-1} BİTTİ!</div>
        <div style={{fontSize:".58rem",color:CP.dim,marginTop:4}}>{p.age-1} yaş · {p.team}</div>
        {/* Sezon özet bar */}
        {(p.history||[]).length>0&&(()=>{const s=p.history[p.history.length-1];return(
          <div style={{display:"flex",justifyContent:"center",gap:16,marginTop:12,
            background:"rgba(255,215,0,.06)",border:"1px solid rgba(255,215,0,.15)",
            borderRadius:12,padding:"10px 16px",animation:"fadeUp .5s ease .15s both"}}>
            {[{l:"Maç",v:s.matches,c:"#fff"},{l:"Gol",v:s.goals,c:"#30e070"},{l:"Asist",v:s.assists,c:"#a78bfa"},{l:"Ort.",v:typeof s.avgRating==="number"?s.avgRating.toFixed(1):s.avgRating,c:"#ffd700"}].map((x,i)=>(
              <div key={i} style={{textAlign:"center"}}>
                <div style={{fontSize:"1rem",fontWeight:900,color:x.c}}>{x.v}</div>
                <div style={{fontSize:".42rem",color:CP.dim,letterSpacing:1}}>{x.l}</div>
              </div>
            ))}
          </div>
        );})()}
      </div>
      {/* Sezon özeti */}
      {(p.history||[]).length>0&&(()=>{const s=p.history[p.history.length-1];return(
        <div style={{background:"rgba(255,255,255,.04)",border:`1px solid ${CP.brd}`,borderRadius:14,padding:16,marginBottom:14}}>
          <div style={{fontSize:".52rem",color:CP.ac2,fontWeight:700,marginBottom:10}}>📊 SEZON RAPORU</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:10}}>
            {[{l:"Maç",v:s.matches},{l:"Gol",v:s.goals},{l:"Asist",v:s.assists},{l:"Ort.",v:s.avgRating}].map((x,i)=>(
              <div key={i} style={{textAlign:"center"}}><div style={{fontSize:".82rem",fontWeight:800,color:CP.wh}}>{x.v}</div><div style={{fontSize:".44rem",color:CP.dim}}>{x.l}</div></div>
            ))}
          </div>
          {s.isTopScorer&&<div style={{background:"rgba(255,215,0,.1)",border:"1px solid rgba(255,215,0,.25)",borderRadius:8,padding:"7px 10px",fontSize:".56rem",color:"#ffd060",fontWeight:700,textAlign:"center",marginBottom:6}}>🥇 Sezon Gol Kralsın!</div>}
          {s.isTopAssister&&<div style={{background:"rgba(167,139,250,.1)",border:"1px solid rgba(167,139,250,.25)",borderRadius:8,padding:"7px 10px",fontSize:".56rem",color:"#a78bfa",fontWeight:700,textAlign:"center",marginBottom:6}}>🎯 Sezon Asist Kralsın!</div>}
          {s.ballonDor&&<div style={{background:"rgba(255,215,0,.15)",border:"1px solid rgba(255,215,0,.4)",borderRadius:8,padding:"8px",fontSize:".6rem",color:"#ffd060",fontWeight:900,textAlign:"center"}}>🏆 BALLON D'OR KAZANDIN!</div>}
          {p.isClubLegend&&<div style={{background:"rgba(139,92,246,.12)",border:"1px solid rgba(139,92,246,.3)",borderRadius:8,padding:"7px",fontSize:".56rem",color:"#a78bfa",fontWeight:700,textAlign:"center",marginTop:6}}>🗿 {p.team} Kulüp Efsanesi! ({p.seasonsAtClub} sezon)</div>}
        </div>
      );})()}
      {/* Sezon hedefleri */}
      {(p.seasonGoals||[]).some(g=>g.done)&&<div style={{background:"rgba(255,215,0,.06)",border:"1px solid rgba(255,215,0,.16)",borderRadius:11,padding:"11px 13px",marginBottom:14}}>
        <div style={{fontSize:".56rem",color:"#ffd060",fontWeight:700,marginBottom:7}}>🎯 Sezon Hedefleri</div>
        {(p.seasonGoals||[]).map((g,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
            <span style={{fontSize:".85rem"}}>{g.done?"✅":"❌"}</span>
            <span style={{fontSize:".56rem",color:g.done?CP.grn:CP.dim,flex:1}}>{g.desc}</span>
            {g.done&&<span style={{fontSize:".5rem",color:"#ffd060"}}>+{g.reward} itibar</span>}
          </div>
        ))}
      </div>}
      {/* Transfer teklifleri */}
      {pendingOffers.length>0&&<div style={{marginBottom:14}}>
        <div style={{fontSize:".6rem",fontWeight:700,color:"#ffd060",marginBottom:8}}>📬 Transfer Teklifleri</div>
        {pendingOffers.map((offer,i)=>(
          <div key={i} style={{background:offer.isChildhood?"rgba(255,215,0,.1)":offer.isLoan?"rgba(139,92,246,.08)":"rgba(255,215,0,.06)",border:`1px solid ${offer.isChildhood?"rgba(255,215,0,.35)":offer.isLoan?"rgba(139,92,246,.25)":"rgba(255,215,0,.18)"}`,borderRadius:11,padding:"12px 14px",marginBottom:8}}>
            {offer.isChildhood&&<div style={{fontSize:".48rem",color:"#ffd060",fontWeight:700,marginBottom:5}}>🏠 Çocukluk Takımın!</div>}
            {offer.isLoan&&<div style={{fontSize:".48rem",color:"#a78bfa",fontWeight:700,marginBottom:5}}>🔄 Kiralık Transfer</div>}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <div><div style={{fontSize:".7rem",fontWeight:700,color:CP.wh}}>{offer.team}</div><div style={{fontSize:".5rem",color:CP.dim}}>{offer.lg} · {offer.str} güç</div></div>
              <div style={{textAlign:"right"}}><div style={{fontSize:".72rem",fontWeight:800,color:CP.grn}}>{offer.salary}K€/yıl</div><div style={{fontSize:".44rem",color:CP.dim}}>{offer.contract} yıl</div></div>
            </div>
            <div style={{display:"flex",gap:7}}>
              <button onClick={()=>{setP(prev=>({...prev,team:offer.team,teamLg:offer.lg,teamStr:offer.str,teamTier:offer.tier,teamColor:offer.color,salary:offer.salary,contract:offer.contract,isOnLoan:!!offer.isLoan,seasonsAtClub:1,leagueTable:initLeagueTable(offer.team,offer.str,offer.lg),topScorers:initTopScorers(prev.name,prev.pos,offer.team),news:[genNews({...prev,team:offer.team},"transfer",{team:offer.team}),...(prev.news||[])]}));setPendingOffers([]);t2(`✈️ ${offer.team}'e transfer!`,CP.grn,4000);}} style={{flex:2,padding:"9px",background:"linear-gradient(135deg,#065f46,#10b981)",border:"none",borderRadius:8,color:CP.wh,fontWeight:700,cursor:"pointer",fontFamily:"inherit",fontSize:".62rem"}}>✅ Kabul</button>
              <button onClick={()=>{t2(`🤝 ${p.agent?.n}: ${Math.round(offer.salary*1.18)}K€ karşı teklif!`,"#f59e0b",4000);}} style={{flex:1,padding:"9px",background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.14)",borderRadius:8,color:"#aaa",cursor:"pointer",fontFamily:"inherit",fontSize:".58rem"}}>🤝 Pazarlık</button>
            </div>
          </div>
        ))}
        <button onClick={()=>setPendingOffers([])} style={{width:"100%",padding:"8px",background:"rgba(255,255,255,.04)",border:`1px solid rgba(255,255,255,.08)`,borderRadius:8,color:"#666",cursor:"pointer",fontFamily:"inherit",fontSize:".6rem",marginBottom:8}}>Teklifleri Reddet</button>
      </div>}
      {/* Milli takım */}
      {p.hasNationalCall&&<div style={{background:"rgba(16,185,129,.08)",border:"1px solid rgba(16,185,129,.22)",borderRadius:11,padding:"12px 14px",marginBottom:14}}>
        <div style={{display:"flex",gap:10,alignItems:"center"}}><span style={{fontSize:"1.6rem"}}>{CAREER_FLAGS[p.nat]||"🌍"}</span><div><div style={{fontSize:".64rem",fontWeight:700,color:CP.grn}}>{p.nat} Milli Takımı</div><div style={{fontSize:".52rem",color:CP.dim}}>{p.nationalCaps} cap · {p.nationalGoals} gol{p.worldCup?" · 🌍 Dünya Kupası":""}</div></div></div>
      </div>}
      {p.contract<=1&&<div style={{background:"rgba(239,68,68,.08)",border:"1px solid rgba(239,68,68,.22)",borderRadius:11,padding:"12px 14px",marginBottom:14}}><div style={{fontSize:".6rem",fontWeight:700,color:CP.red,marginBottom:4}}>⚠️ Sözleşme {p.contract===0?"Bitti!":"Bitiyor!"}</div><div style={{fontSize:".54rem",color:CP.dim}}>{p.contract===0?"Serbest kaldın!":"Bu sezon sonunda serbest kalacaksın."}</div></div>}
      <button onClick={()=>{setPendingOffers([]);setTab("home");}} style={{width:"100%",padding:"14px",background:"linear-gradient(135deg,#1a6ed8,#2485ff)",border:"none",borderRadius:12,color:CP.wh,fontWeight:900,cursor:"pointer",fontFamily:"inherit",fontSize:".8rem",marginBottom:8}}>🚀 SEZON {p.season} BAŞLASIN!</button>
      <button onClick={onBack} style={{width:"100%",padding:"10px",background:"rgba(255,255,255,.04)",border:`1px solid rgba(255,255,255,.07)`,borderRadius:10,color:"#555",cursor:"pointer",fontFamily:"inherit",fontSize:".62rem"}}>Ana Menü</button>
      <div style={{height:24}}/>
    </div>
  );

  // ── EMEKLİLİK ──
  if(tab==="retired") return(
    <div style={{position:"fixed",inset:0,background:CP.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"system-ui,sans-serif",padding:24,overflowY:"auto"}}>
      <div style={{fontSize:"3rem",marginBottom:8}}>🕊️</div>
      <div style={{fontSize:"1.2rem",fontWeight:900,color:CP.wh,marginBottom:4,textAlign:"center"}}>Efsane Bir Kariyer!</div>
      <div style={{fontSize:".58rem",color:CP.dim,marginBottom:20,textAlign:"center"}}>{p.retirementAge} yaşında · OVR {p.ovr} · {pers.icon} {pers.label}</div>
      <div style={{width:"100%",maxWidth:320,background:"rgba(255,255,255,.04)",border:`1px solid ${CP.brd}`,borderRadius:16,padding:20,marginBottom:16}}>
        <div style={{textAlign:"center",marginBottom:14}}>
          <div style={{fontSize:".9rem",fontWeight:900,color:CP.wh}}>{p.name} #{p.formNumber}</div>
          <div style={{fontSize:".56rem",color:CP.ac2}}>{CAREER_FLAGS[p.nat]} {p.nat} · {p.pos}</div>
          {p.isCaptain&&<div style={{fontSize:".52rem",color:"#ffd060",marginTop:3}}>🎗️ Kulüp Kaptanı</div>}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          {[{l:"Toplam Maç",v:p.totalMatches},{l:"Toplam Gol",v:p.totalGoals},{l:"Toplam Asist",v:p.totalAssists},{l:"En Yüksek OVR",v:Math.max(...(p.ovrHistory||[p.ovr]))},{l:"Milli Cap",v:p.nationalCaps},{l:"Birikim",v:`${(p.savings||0)>=1000?`${((p.savings||0)/1000).toFixed(1)}M`:`${p.savings||0}K`}€`},{l:"Başarılar",v:`${(p.achievements||[]).length}/${CAREER_ACHIEVEMENTS.length}`},{l:"MoTM",v:p.motmCount||0}].map((s,i)=>(
            <div key={i} style={{textAlign:"center",background:"rgba(255,255,255,.03)",borderRadius:8,padding:"8px"}}>
              <div style={{fontSize:".76rem",fontWeight:800,color:CP.wh}}>{s.v}</div>
              <div style={{fontSize:".42rem",color:CP.dim}}>{s.l}</div>
            </div>
          ))}
        </div>
        {p.ballonDor&&<div style={{marginTop:10,background:"rgba(255,215,0,.12)",border:"1px solid rgba(255,215,0,.3)",borderRadius:8,padding:"8px",fontSize:".6rem",color:"#ffd060",fontWeight:700,textAlign:"center"}}>🏆 Ballon d'Or Kazananı</div>}
        {p.worldCup&&<div style={{marginTop:6,background:"rgba(16,185,129,.1)",border:"1px solid rgba(16,185,129,.25)",borderRadius:8,padding:"8px",fontSize:".6rem",color:CP.grn,fontWeight:700,textAlign:"center"}}>🌍 Dünya Kupası Oyuncusu</div>}
        {p.isClubLegend&&<div style={{marginTop:6,background:"rgba(139,92,246,.1)",border:"1px solid rgba(139,92,246,.25)",borderRadius:8,padding:"8px",fontSize:".6rem",color:"#a78bfa",fontWeight:700,textAlign:"center"}}>🗿 Kulüp Efsanesi</div>}
      </div>
      <button onClick={onBack} style={{width:"100%",maxWidth:320,padding:"14px",background:"linear-gradient(135deg,#1a6ed8,#2485ff)",border:"none",borderRadius:12,color:CP.wh,fontWeight:800,cursor:"pointer",fontFamily:"inherit",fontSize:".78rem"}}>Ana Menüye Dön</button>
    </div>
  );

  return null;
}
