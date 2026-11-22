// ── Kariyer Onboarding v4 ──────────────────────────────────────
function CareerOnboardingScreen({onStart,onBack}){
  const [step,setStep]=useState(0);
  const [name,setName]=useState("");
  const [pos,setPos]=useState("ST");
  const [nat,setNat]=useState("TUR");
  const [teamIdx,setTeamIdx]=useState(null);
  const [agentIdx,setAgentIdx]=useState(0);
  const [age,setAge]=useState(17);
  const [personality,setPersonality]=useState(null);
  const [mentorIdx,setMentorIdx]=useState(null);
  const [formNum,setFormNum]=useState(9);
  const startTeams=CAREER_TEAMS.filter(t=>t.tier>=2).sort((a,b)=>a.str-b.str);
  const availMentors=MENTORS.filter(m=>m.requirement.includes(pos)||m.requirement.includes("any")||m.requirement.includes("Türk")&&nat==="TUR");

  const launchCareer=()=>{
    const team=startTeams[teamIdx||0];
    const agent=CAREER_AGENTS[agentIdx];
    const pers=PERSONALITY_TYPES.find(x=>x.id===personality)||PERSONALITY_TYPES[0];
    const mentor=mentorIdx!==null?availMentors[mentorIdx]:null;
    const ovr=52+Math.floor(Math.random()*8);
    const potBase=76+Math.floor(Math.random()*19);
    const pot=potBase+(pers.bonuses?.potBonus||0);
    const initSkills={};
    (SKILL_TREES[pos]?.skills||[]).forEach(s=>{initSkills[s.id]=0;});
    const coachRelStart=50+(pers.bonuses?.coachRel||0);
    const teamRelStart=50+(pers.bonuses?.teamRel||0);
    const player={
      name:name||"Oyuncum",pos,nat,age:parseInt(age),
      ovr,pot,team:team.n,teamLg:team.lg,teamStr:team.str,teamTier:team.tier,teamColor:team.color||"#4da6ff",
      childhoodTeam:team.n,
      goals:0,assists:0,matches:0,ratings:[],
      devPoints:0,season:1,week:1,
      totalGoals:0,totalAssists:0,totalMatches:0,
      skills:initSkills,skillPoints:3+((pers.id==="genius")?1:0),
      personality:pers.id,
      mentor:mentor?mentor.id:null,
      formNumber:formNum,
      trophies:[],
      nationalCaps:0,nationalGoals:0,hasNationalCall:false,worldCup:false,
      retired:false,retirementAge:null,
      history:[],pressConf:[],diary:[],
      morale:75+(pers.id==="leader"?5:pers.id==="rebel"?-5:0),
      salary:Math.round(team.str*0.9+Math.random()*40),
      contract:3,injuredWeeks:0,fatigue:0,
      reputation:8,fans:500+Math.floor(Math.random()*2000),
      marketValue:Math.round(ovr*20),
      savings:0,investments:[],ownedAssets:[],
      agent,sponsors:[],
      achievements:[],
      motmCount:0,bestMatchGoals:0,isTopScorer:false,isTopAssister:false,ballonDor:false,
      news:[],
      leagueTable:initLeagueTable(team.n,team.str,team.lg),
      topScorers:initTopScorers(name||"Ben",pos,team.n),
      coachRelation:Math.max(0,Math.min(100,coachRelStart)),
      teamRelation:Math.max(0,Math.min(100,teamRelStart)),
      seasonGoals:genSeasonGoals({pos}),
      matchGoals:[],
      rival:RIVALS[Math.floor(Math.random()*RIVALS.length)],
      homeGoals:0,awayGoals:0,homeMatches:0,awayMatches:0,
      weeklyFormRatings:[],ovrHistory:[ovr],
      ballonDorVotes:0,
      isCaptain:false,seasonsAtClub:1,
      redCards:0,hadLongInjury:false,
      didCharity:false,
      conflictWith:null,
      personalCoach:null,
      isOnLoan:false,loanFrom:null,
      gameSpeed:"normal",
      rewindTokens:2,
      savedGame:null,
    };
    // İlk diary girişi
    const pers_intros={
      leader:"Hayatımın en büyük kararını verdim. Bu takımda lider olmak istiyorum.",
      hardworker:"Hiç kimse benden daha çok çalışamaz. Bunu kanıtlayacağım.",
      genius:"Futbol benim için doğal. Ama potansiyelimi kullanmam gerekiyor.",
      rebel:"Kimse bana nasıl oynayacağımı söyleyemez. Ben kendi yolumu çizeceğim."
    };
    player.diary=[{week:1,text:pers_intros[pers.id]||"Yeni bir sayfa açılıyor...",date:new Date().toLocaleDateString("tr-TR")}];
    if(mentor) player.diary.unshift({week:1,text:DIARY.mentor_1st[0].replace("{mentor}",mentor.n),date:new Date().toLocaleDateString("tr-TR")});
    onStart(player);
  };

  const s={position:"fixed",inset:0,background:`linear-gradient(145deg,${CP.bg},${CP.bg2})`,display:"flex",flexDirection:"column",zIndex:9999,fontFamily:"system-ui,sans-serif",padding:20,overflowY:"auto"};
  const STEPS=["İsim","Mevki","Uyruk","Takım","Kişilik","Mentor","Ajan","Başla"];

  return(
    <div style={s}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
        <button onClick={onBack} style={{background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",color:"#aaa",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontFamily:"inherit",fontSize:".6rem"}}>← Geri</button>
        <div>
          <div style={{fontSize:".88rem",fontWeight:900,color:CP.wh}}>⚽ Oyuncu Kariyer v4</div>
          <div style={{fontSize:".5rem",color:CP.ac2}}>Adım {step+1}/{STEPS.length} · {STEPS[step]}</div>
        </div>
      </div>
      <div style={{display:"flex",gap:3,marginBottom:18}}>
        {STEPS.map((_,i)=><div key={i} style={{flex:1,height:3,borderRadius:2,background:i<=step?CP.ac:"rgba(255,255,255,.08)",transition:"background .3s"}}/>)}
      </div>

      {/* ADIM 0: İSİM */}
      {step===0&&(
        <div style={{flex:1,display:"flex",flexDirection:"column",gap:14}}>
          <div style={{fontSize:".96rem",fontWeight:800,color:CP.wh}}>👤 Oyuncunu Tanıt</div>
          <div>
            <div style={{fontSize:".52rem",color:CP.ac2,marginBottom:5,textTransform:"uppercase",letterSpacing:1}}>Oyuncu Adı</div>
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="Adını yaz..."
              style={{width:"100%",padding:"12px 14px",background:"rgba(255,255,255,.06)",border:`1px solid ${CP.brd}`,borderRadius:10,color:CP.wh,fontSize:".76rem",fontFamily:"inherit",outline:"none",boxSizing:"border-box"}}/>
          </div>
          <div>
            <div style={{fontSize:".52rem",color:CP.ac2,marginBottom:6,textTransform:"uppercase",letterSpacing:1}}>Başlangıç Yaşı</div>
            <div style={{display:"flex",gap:5}}>
              {[16,17,18,19,20].map(a=>(
                <button key={a} onClick={()=>setAge(a)} style={{flex:1,padding:"10px 4px",borderRadius:8,cursor:"pointer",fontFamily:"inherit",fontSize:".6rem",fontWeight:700,background:age===a?"rgba(36,133,255,.35)":"rgba(255,255,255,.05)",border:`1.5px solid ${age===a?CP.ac:"rgba(255,255,255,.1)"}`,color:age===a?CP.wh:"#888"}}>
                  {a}{a===17?" ⭐":""}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div style={{fontSize:".52rem",color:CP.ac2,marginBottom:6,textTransform:"uppercase",letterSpacing:1}}>Forma Numarası</div>
            <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
              {[7,8,9,10,11,17,19,21,99].map(n=>(
                <button key={n} onClick={()=>setFormNum(n)} style={{padding:"8px 12px",borderRadius:8,cursor:"pointer",fontFamily:"inherit",fontSize:".7rem",fontWeight:700,background:formNum===n?"rgba(255,215,0,.3)":"rgba(255,255,255,.05)",border:`1.5px solid ${formNum===n?"#ffd060":"rgba(255,255,255,.1)"}`,color:formNum===n?"#ffd060":CP.wh}}>
                  #{n}
                </button>
              ))}
            </div>
          </div>
          <div style={{marginTop:"auto"}}>
            <button onClick={()=>name.trim()&&setStep(1)} style={{width:"100%",padding:"13px",borderRadius:11,cursor:name.trim()?"pointer":"default",fontFamily:"inherit",fontSize:".74rem",fontWeight:800,border:"none",background:name.trim()?"linear-gradient(135deg,#1a6ed8,#2485ff)":"rgba(255,255,255,.08)",color:CP.wh}}>İleri →</button>
          </div>
        </div>
      )}

      {/* ADIM 1: MEVKİ */}
      {step===1&&(
        <div style={{flex:1,display:"flex",flexDirection:"column",gap:10}}>
          <div style={{fontSize:".96rem",fontWeight:800,color:CP.wh}}>🎯 Mevkini Seç</div>
          <div style={{overflowY:"auto",flex:1,display:"grid",gridTemplateColumns:"1fr 1fr",gap:7}}>
            {CAREER_POSITIONS.map(p=>{
              const info={GK:{l:"Kaleci",i:"🧤"},CB:{l:"Stoper",i:"🛡️"},LB:{l:"Sol Bek",i:"↙️"},RB:{l:"Sağ Bek",i:"↘️"},CDM:{l:"Def. Orta",i:"⚔️"},CM:{l:"Orta Saha",i:"🔄"},CAM:{l:"Ofansif OS",i:"🎯"},LM:{l:"Sol Kanat",i:"⚡"},RM:{l:"Sağ Kanat",i:"⚡"},ST:{l:"Forvet",i:"⚽"}}[p];
              return(
                <button key={p} onClick={()=>setPos(p)} style={{padding:"11px 10px",borderRadius:10,cursor:"pointer",fontFamily:"inherit",textAlign:"left",background:pos===p?"rgba(36,133,255,.28)":"rgba(255,255,255,.04)",border:`1.5px solid ${pos===p?CP.ac:"rgba(255,255,255,.1)"}`,color:CP.wh}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontSize:"1.3rem"}}>{info.i}</span>
                    <div><div style={{fontSize:".66rem",fontWeight:700}}>{p}</div><div style={{fontSize:".5rem",color:pos===p?"#88c4ff":CP.dim}}>{info.l}</div></div>
                  </div>
                  <div style={{display:"flex",gap:3,flexWrap:"wrap",marginTop:5}}>
                    {(SKILL_TREES[p]?.skills||[]).map(sk=><span key={sk.id} style={{fontSize:".4rem",background:"rgba(255,255,255,.06)",padding:"2px 5px",borderRadius:4,color:CP.dim}}>{sk.icon} {sk.n}</span>)}
                  </div>
                </button>
              );
            })}
          </div>
          <div style={{display:"flex",gap:7}}>
            <button onClick={()=>setStep(0)} style={{flex:1,padding:"11px",background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",borderRadius:9,color:"#aaa",cursor:"pointer",fontFamily:"inherit",fontSize:".66rem"}}>← Geri</button>
            <button onClick={()=>setStep(2)} style={{flex:2,padding:"11px",background:"linear-gradient(135deg,#1a6ed8,#2485ff)",border:"none",borderRadius:9,color:CP.wh,fontWeight:800,cursor:"pointer",fontFamily:"inherit",fontSize:".68rem"}}>İleri →</button>
          </div>
        </div>
      )}

      {/* ADIM 2: UYRUK */}
      {step===2&&(
        <div style={{flex:1,display:"flex",flexDirection:"column",gap:10}}>
          <div style={{fontSize:".96rem",fontWeight:800,color:CP.wh}}>🌍 Uyruğunu Seç</div>
          <div style={{overflowY:"auto",flex:1,display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
            {CAREER_NATIONS.map(n=>(
              <button key={n} onClick={()=>setNat(n)} style={{padding:"10px 12px",borderRadius:8,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:8,background:nat===n?"rgba(36,133,255,.28)":"rgba(255,255,255,.04)",border:`1.5px solid ${nat===n?CP.ac:"rgba(255,255,255,.1)"}`,color:CP.wh}}>
                <span style={{fontSize:"1.1rem"}}>{CAREER_FLAGS[n]||"🌍"}</span>
                <span style={{fontSize:".62rem",fontWeight:nat===n?700:400}}>{n}</span>
              </button>
            ))}
          </div>
          <div style={{display:"flex",gap:7}}>
            <button onClick={()=>setStep(1)} style={{flex:1,padding:"11px",background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",borderRadius:9,color:"#aaa",cursor:"pointer",fontFamily:"inherit",fontSize:".66rem"}}>← Geri</button>
            <button onClick={()=>setStep(3)} style={{flex:2,padding:"11px",background:"linear-gradient(135deg,#1a6ed8,#2485ff)",border:"none",borderRadius:9,color:CP.wh,fontWeight:800,cursor:"pointer",fontFamily:"inherit",fontSize:".68rem"}}>İleri →</button>
          </div>
        </div>
      )}

      {/* ADIM 3: TAKIM */}
      {step===3&&(
        <div style={{flex:1,display:"flex",flexDirection:"column",gap:10}}>
          <div style={{fontSize:".96rem",fontWeight:800,color:CP.wh}}>🏟️ Başlangıç Takımı</div>
          <div style={{overflowY:"auto",flex:1,display:"flex",flexDirection:"column",gap:5}}>
            {startTeams.map((t,i)=>(
              <button key={i} onClick={()=>setTeamIdx(i)} style={{padding:"10px 13px",borderRadius:10,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:10,background:teamIdx===i?"rgba(36,133,255,.2)":"rgba(255,255,255,.04)",border:`1.5px solid ${teamIdx===i?CP.ac:"rgba(255,255,255,.09)"}`,color:CP.wh}}>
                <div style={{width:32,height:32,borderRadius:7,background:t.color||"#333",display:"flex",alignItems:"center",justifyContent:"center",fontSize:".8rem",flexShrink:0}}>{t.tier===1?"🌟":t.tier===2?"⚽":"🥉"}</div>
                <div style={{flex:1,textAlign:"left"}}>
                  <div style={{fontSize:".66rem",fontWeight:700}}>{t.n}</div>
                  <div style={{fontSize:".5rem",color:CP.dim}}>{t.lg} · {t.city}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:".62rem",fontWeight:700,color:t.str>=85?"#ffd060":t.str>=70?CP.ac2:CP.dim}}>{t.str} güç</div>
                </div>
              </button>
            ))}
          </div>
          <div style={{display:"flex",gap:7}}>
            <button onClick={()=>setStep(2)} style={{flex:1,padding:"11px",background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",borderRadius:9,color:"#aaa",cursor:"pointer",fontFamily:"inherit",fontSize:".66rem"}}>← Geri</button>
            <button onClick={()=>teamIdx!==null&&setStep(4)} style={{flex:2,padding:"11px",background:teamIdx!==null?"linear-gradient(135deg,#1a6ed8,#2485ff)":"rgba(255,255,255,.1)",border:"none",borderRadius:9,color:CP.wh,fontWeight:800,cursor:teamIdx!==null?"pointer":"default",fontFamily:"inherit",fontSize:".68rem"}}>İleri →</button>
          </div>
        </div>
      )}

      {/* ADIM 4: KİŞİLİK */}
      {step===4&&(
        <div style={{flex:1,display:"flex",flexDirection:"column",gap:10}}>
          <div style={{fontSize:".96rem",fontWeight:800,color:CP.wh}}>🎭 Karakterini Seç</div>
          <div style={{fontSize:".5rem",color:CP.dim,marginBottom:4}}>Kişilik tipinin tüm kariyerin boyunca farklı olaylar tetikler.</div>
          <div style={{flex:1,display:"flex",flexDirection:"column",gap:8}}>
            {PERSONALITY_TYPES.map(pt=>(
              <button key={pt.id} onClick={()=>setPersonality(pt.id)} style={{padding:"13px 14px",borderRadius:11,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:12,background:personality===pt.id?"rgba(36,133,255,.2)":"rgba(255,255,255,.04)",border:`1.5px solid ${personality===pt.id?CP.ac:"rgba(255,255,255,.1)"}`,color:CP.wh}}>
                <span style={{fontSize:"1.8rem"}}>{pt.icon}</span>
                <div style={{flex:1,textAlign:"left"}}>
                  <div style={{fontSize:".72rem",fontWeight:700}}>{pt.label}</div>
                  <div style={{fontSize:".52rem",color:CP.dim,marginBottom:4}}>{pt.desc}</div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                    {Object.entries(pt.bonuses).filter(([k])=>!["moodSensitive","formVariance","bigMatchBonus","agingAge","injuryMult"].includes(k)).map(([k,v])=>(
                      <span key={k} style={{fontSize:".44rem",background:v>0?"rgba(16,185,129,.12)":"rgba(239,68,68,.12)",border:`1px solid ${v>0?"rgba(16,185,129,.3)":"rgba(239,68,68,.3)"}`,borderRadius:5,padding:"2px 6px",color:v>0?CP.grn:CP.red}}>
                        {k==="coachRel"?"Antrenör İlişkisi":k==="teamRel"?"Takım İlişkisi":k==="devMult"?"Gelişim Çarpanı":k==="trainingMult"?"Antrenman":k==="potBonus"?"Potansiyel":k==="winMoralBonus"?"Galibiyet Moral":k}: {v>0?"+":""}{typeof v==="number"&&v<5?v+"x":v}
                      </span>
                    ))}
                  </div>
                </div>
                {personality===pt.id&&<span style={{fontSize:"1.2rem"}}>✅</span>}
              </button>
            ))}
          </div>
          <div style={{display:"flex",gap:7}}>
            <button onClick={()=>setStep(3)} style={{flex:1,padding:"11px",background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",borderRadius:9,color:"#aaa",cursor:"pointer",fontFamily:"inherit",fontSize:".66rem"}}>← Geri</button>
            <button onClick={()=>personality&&setStep(5)} style={{flex:2,padding:"11px",background:personality?"linear-gradient(135deg,#1a6ed8,#2485ff)":"rgba(255,255,255,.1)",border:"none",borderRadius:9,color:CP.wh,fontWeight:800,cursor:personality?"pointer":"default",fontFamily:"inherit",fontSize:".68rem"}}>İleri →</button>
          </div>
        </div>
      )}

      {/* ADIM 5: MENTOR */}
      {step===5&&(
        <div style={{flex:1,display:"flex",flexDirection:"column",gap:10}}>
          <div style={{fontSize:".96rem",fontWeight:800,color:CP.wh}}>👨‍🏫 Mentor Seç</div>
          <div style={{fontSize:".5rem",color:CP.dim,marginBottom:4}}>Bir efsane, kariyerinin başında seni alacak kanatları altına. (İsteğe bağlı)</div>
          <div style={{flex:1,display:"flex",flexDirection:"column",gap:7}}>
            {availMentors.map((m,i)=>(
              <button key={i} onClick={()=>setMentorIdx(mentorIdx===i?null:i)} style={{padding:"12px 14px",borderRadius:10,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:12,background:mentorIdx===i?"rgba(139,92,246,.2)":"rgba(255,255,255,.04)",border:`1.5px solid ${mentorIdx===i?"#8b5cf6":"rgba(255,255,255,.1)"}`,color:CP.wh}}>
                <span style={{fontSize:"1.6rem"}}>{m.icon}</span>
                <div style={{flex:1,textAlign:"left"}}>
                  <div style={{fontSize:".7rem",fontWeight:700}}>{m.n}</div>
                  <div style={{fontSize:".52rem",color:CP.dim,marginBottom:3}}>{m.requirement} · {m.era}</div>
                  <div style={{fontSize:".5rem",color:"#a78bfa",fontStyle:"italic"}}>"{m.quote}"</div>
                  <div style={{marginTop:4,display:"flex",gap:6}}>
                    {Object.entries(m.bonus).map(([k,v])=>(
                      <span key={k} style={{fontSize:".44rem",background:"rgba(139,92,246,.12)",border:"1px solid rgba(139,92,246,.3)",borderRadius:5,padding:"2px 6px",color:"#c4b5fd"}}>+{v>1?v+"x":(v*100)+"%"} {k==="devMult"?"Gelişim":k==="goalBonus"?"Gol":k==="assistBonus"?"Asist":k==="defBonus"?"Defans":k==="saveBonus"?"Kurtarış":k==="repBonus"?"İtibar":k}</span>
                    ))}
                  </div>
                </div>
                {mentorIdx===i&&<span style={{fontSize:"1.1rem"}}>✅</span>}
              </button>
            ))}
            <button onClick={()=>setMentorIdx(null)} style={{padding:"10px",background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.07)",borderRadius:9,color:"#555",cursor:"pointer",fontFamily:"inherit",fontSize:".6rem"}}>Mentor olmadan devam et</button>
          </div>
          <div style={{display:"flex",gap:7}}>
            <button onClick={()=>setStep(4)} style={{flex:1,padding:"11px",background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",borderRadius:9,color:"#aaa",cursor:"pointer",fontFamily:"inherit",fontSize:".66rem"}}>← Geri</button>
            <button onClick={()=>setStep(6)} style={{flex:2,padding:"11px",background:"linear-gradient(135deg,#1a6ed8,#2485ff)",border:"none",borderRadius:9,color:CP.wh,fontWeight:800,cursor:"pointer",fontFamily:"inherit",fontSize:".68rem"}}>İleri →</button>
          </div>
        </div>
      )}

      {/* ADIM 6: AJAN */}
      {step===6&&(
        <div style={{flex:1,display:"flex",flexDirection:"column",gap:10}}>
          <div style={{fontSize:".96rem",fontWeight:800,color:CP.wh}}>🤝 Ajanını Seç</div>
          <div style={{flex:1,display:"flex",flexDirection:"column",gap:7}}>
            {CAREER_AGENTS.map((a,i)=>(
              <button key={i} onClick={()=>setAgentIdx(i)} style={{padding:"12px 14px",borderRadius:11,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:12,background:agentIdx===i?"rgba(36,133,255,.2)":"rgba(255,255,255,.04)",border:`1.5px solid ${agentIdx===i?CP.ac:"rgba(255,255,255,.1)"}`,color:CP.wh}}>
                <span style={{fontSize:"1.8rem"}}>{a.emoji}</span>
                <div style={{flex:1,textAlign:"left"}}>
                  <div style={{fontSize:".7rem",fontWeight:700}}>{a.n}</div>
                  <div style={{fontSize:".52rem",color:CP.dim,marginBottom:2}}>{a.desc}</div>
                  <div style={{fontSize:".5rem",color:CP.grn,fontWeight:700}}>+{Math.round(a.bonus*100)}% maaş · 🎯 {a.speciality}</div>
                </div>
                {agentIdx===i&&<span style={{fontSize:"1.1rem"}}>✅</span>}
              </button>
            ))}
          </div>
          <div style={{display:"flex",gap:7}}>
            <button onClick={()=>setStep(5)} style={{flex:1,padding:"11px",background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",borderRadius:9,color:"#aaa",cursor:"pointer",fontFamily:"inherit",fontSize:".66rem"}}>← Geri</button>
            <button onClick={()=>setStep(7)} style={{flex:2,padding:"11px",background:"linear-gradient(135deg,#1a6ed8,#2485ff)",border:"none",borderRadius:9,color:CP.wh,fontWeight:800,cursor:"pointer",fontFamily:"inherit",fontSize:".68rem"}}>İleri →</button>
          </div>
        </div>
      )}

      {/* ADIM 7: ÖZET */}
      {step===7&&(()=>{
        const team=startTeams[teamIdx||0];
        const pers=PERSONALITY_TYPES.find(x=>x.id===personality)||PERSONALITY_TYPES[0];
        const mentor=mentorIdx!==null?availMentors[mentorIdx]:null;
        return(
          <div style={{flex:1,display:"flex",flexDirection:"column",gap:12}}>
            <div style={{fontSize:".96rem",fontWeight:800,color:CP.wh}}>🚀 Kariyerine Hazır Mısın?</div>
            <div style={{background:"rgba(36,133,255,.08)",border:`1px solid ${CP.brd}`,borderRadius:14,padding:16}}>
              <div style={{textAlign:"center",marginBottom:12}}>
                <div style={{fontSize:"2rem"}}>#{formNum}</div>
                <div style={{fontSize:"1rem",fontWeight:900,color:CP.wh}}>{name}</div>
                <div style={{fontSize:".56rem",color:CP.ac2}}>{CAREER_FLAGS[nat]} {nat} · {pos} · {age} yaş · {pers.icon} {pers.label}</div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7}}>
                {[
                  {l:"Takım",v:team.n,i:"🏟️"},{l:"Lig",v:team.lg,i:"🏆"},
                  {l:"Kişilik",v:pers.label,i:pers.icon},{l:"Mentor",v:mentor?mentor.n:"Yok",i:"👨‍🏫"},
                  {l:"Ajan",v:CAREER_AGENTS[agentIdx].n,i:"🤝"},{l:"Forma No",v:`#${formNum}`,i:"👕"},
                ].map((x,i)=>(
                  <div key={i} style={{background:"rgba(255,255,255,.04)",borderRadius:8,padding:"7px 10px",display:"flex",gap:6,alignItems:"center"}}>
                    <span style={{fontSize:".9rem"}}>{x.i}</span>
                    <div><div style={{fontSize:".42rem",color:CP.dim}}>{x.l}</div><div style={{fontSize:".58rem",fontWeight:700,color:CP.wh}}>{x.v}</div></div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{background:"rgba(16,185,129,.07)",border:"1px solid rgba(16,185,129,.2)",borderRadius:10,padding:12}}>
              <div style={{fontSize:".56rem",color:CP.grn,fontWeight:700,marginBottom:4}}>🎯 Kariyer Yol Haritası</div>
              <div style={{fontSize:".5rem",color:CP.dim,lineHeight:1.7}}>🌱 Genç Yetenek → 📈 Yükselen Yıldız → ⭐ Yıldız → 🌟 Elit → 👑 Efsane<br/>🏆 Ballon d'Or · 🌍 Dünya Kupası · 💎 Mega Sponsorluk · 🕊️ Efsane Emeklilik</div>
            </div>
            <div style={{display:"flex",gap:7,marginTop:"auto"}}>
              <button onClick={()=>setStep(6)} style={{flex:1,padding:"11px",background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",borderRadius:9,color:"#aaa",cursor:"pointer",fontFamily:"inherit",fontSize:".66rem"}}>← Geri</button>
              <button onClick={launchCareer} style={{flex:2,padding:"14px",background:"linear-gradient(135deg,#065f46,#10b981)",border:"none",borderRadius:12,color:CP.wh,fontWeight:900,cursor:"pointer",fontFamily:"inherit",fontSize:".78rem",letterSpacing:.5}}>🚀 KARİYERE BAŞLA!</button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
