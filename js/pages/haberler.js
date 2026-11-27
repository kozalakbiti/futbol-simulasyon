function PageHaberler({news,season}){
  const [tab,setTab]=useState("team");
  const typeLabel={transfer_in:"TRANSFER GELDİ",transfer_out:"TRANSFER GİTTİ",youth_promoted:"ALTYAPIDAN",
    loan_out:"KİRAYA GİTTİ",match:"MAÇ SONUCU",rival_transfer:"RAKİP HABER",
    coach_hire:"ANTRENÖR",incoming_offer:"GELEN TEKLİF",sponsor_end:"SPONSOR"};
  const typeColor={transfer_in:C.grn2,transfer_out:C.red2,youth_promoted:C.pur2,loan_out:C.gd,
    match:C.ac2,rival_transfer:"#e67e22",coach_hire:"#9b59b6",incoming_offer:C.gd,sponsor_end:C.dmr};
  const typeIcon={transfer_in:"📥",transfer_out:"📤",youth_promoted:"⭐",loan_out:"🔄",match:"⚽",
    rival_transfer:"🔴",coach_hire:"🧑‍🏫",incoming_offer:"📨",sponsor_end:"💼"};

  // Takıma ait haberler (rival hariç)
  const teamNews=[...news].filter(n=>n.type!=="rival_transfer").reverse();
  const globalNews=[...news].filter(n=>n.type==="rival_transfer").reverse();

  // Ek simüle global haberler — her hafta maç haberi üret
  const played=season?season.played||0:0;
  const teams=season?season.teams||[]:[];
  const simGlobalNews=[];
  // Liglerdeki takımlar için sahte haberler üret (seed ile deterministik)
  const SIM_HEADLINES=[
    (t,opp,s)=>`${t} ${opp}'u ${s} mağlup etti.`,
    (t,opp,s)=>`${opp} deplasmanda ${t}'ye ${s} kaybetti.`,
    (t,opp,s)=>`${t} - ${opp} ${s} berabere kaldı.`,
  ];
  const SIM_TRANSFERS=[
    (p,cl)=>`${cl}, ${p} transferini tamamladı.`,
    (p,cl)=>`${p} ${cl}'ye imza attı.`,
    (p,cl)=>`${p} ${cl} formasını giyecek.`,
  ];
  const GLOBAL_PLAYERS=["A.Silva","R.Benzemo","K.Maboul","E.Haland","B.Bellingam","V.Vinicius",
    "S.Mane","M.Salache","H.Kaner","L.Martinez","P.Dybala","A.Griezman","L.Goretzka","P.Pogba"];
  const GLOBAL_CLUBS=["Bayern FC","Real Madreno","FC Cataluña","Eastfield City","Paris SG","Mersey Reds","FC Internazionale","Juventus FC","Northon City"];

  if(played>0){
    for(let w=1;w<=Math.min(played,8);w++){
      const seed=w*1337;
      const t1=GLOBAL_CLUBS[seed%GLOBAL_CLUBS.length];
      const t2=GLOBAL_CLUBS[(seed*7+3)%GLOBAL_CLUBS.length];
      const g1=(seed*3)%4; const g2=(seed*5+1)%3;
      const hdl=SIM_HEADLINES[(seed)%3];
      simGlobalNews.push({type:"match",player:hdl(t1,t2,`${g1}-${g2}`),club:"",val:0,
        detail:`${t1} · ${["İngiliz Ligi","İspanyol Ligi","Alman Ligi","İtalyan Ligi","Fransız Ligi"][seed%5]}`,
        date:`H${w}`});
      if(w%3===0){
        const pl=GLOBAL_PLAYERS[(seed*11)%GLOBAL_PLAYERS.length];
        const cl=GLOBAL_CLUBS[(seed*13+5)%GLOBAL_CLUBS.length];
        const tl=SIM_TRANSFERS[(seed)%3];
        simGlobalNews.push({type:"rival_transfer",player:tl(pl,cl),club:cl,val:Math.round((seed%20)+5),
          detail:`${pl} · OVR ${60+(seed%30)} · ${(seed%15)+5}M€`,date:`H${w}`});
      }
    }
  }
  // Gerçek rival transferler + simüle haberler birleştir
  const allGlobal=[...globalNews,...simGlobalNews.reverse()];

  const NewsCard=({item})=>{
    const col=typeColor[item.type]||C.ac2;
    return(
      <div style={{display:"flex",gap:10,padding:"10px 12px",marginBottom:7,
        background:C.card,border:`1px solid rgba(77,166,255,0.22)`,borderRadius:6,
        borderLeft:`3px solid ${col}`}}>
        <div style={{fontSize:"1.4rem",flexShrink:0,lineHeight:1,paddingTop:2}}>{typeIcon[item.type]||"📰"}</div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:3}}>
            <span style={{fontSize:".46rem",fontWeight:700,padding:"1px 5px",borderRadius:2,
              background:`${col}22`,color:col,border:`1px solid ${col}44`,letterSpacing:1,textTransform:"uppercase",flexShrink:0}}>
              {typeLabel[item.type]||item.type}
            </span>
            <span style={{fontSize:".48rem",color:C.dmr,marginLeft:"auto",flexShrink:0}}>{item.date}</span>
          </div>
          <div style={{fontSize:".74rem",fontWeight:600,color:C.wh,marginBottom:2,lineHeight:1.3}}>{item.player}</div>
          {item.club&&<div style={{fontSize:".58rem",color:C.dim}}>
            {item.type==="transfer_in"?"Kulüp: ":"Kulüp: "}{item.club}
            {item.val>0&&<span style={{color:C.gd,fontWeight:600,marginLeft:8}}>{item.val}M€</span>}
          </div>}
          {item.detail&&<div style={{fontSize:".58rem",color:C.dim,marginTop:2}}>{item.detail}</div>}
        </div>
      </div>
    );
  };

  return(
    <div style={{flex:1,display:"flex",flexDirection:"column",minHeight:0}}>
      {/* Tab bar */}
      <div style={{display:"flex",borderBottom:`1px solid rgba(77,166,255,0.22)`,flexShrink:0}}>
        <button onClick={()=>setTab("team")} style={{flex:1,padding:"9px 4px",border:"none",cursor:"pointer",
          fontFamily:"inherit",fontSize:".6rem",fontWeight:tab==="team"?700:400,
          background:tab==="team"?"rgba(45,143,255,.12)":"transparent",
          color:tab==="team"?C.wh:C.dmr,
          borderBottom:tab==="team"?`2px solid ${C.ac2}`:"2px solid transparent"}}>
          🏟️ Takım Haberleri <span style={{fontSize:".46rem",color:C.dmr,marginLeft:3}}>{teamNews.length}</span>
        </button>
        <button onClick={()=>setTab("rivals")} style={{flex:1,padding:"9px 4px",border:"none",cursor:"pointer",
          fontFamily:"inherit",fontSize:".6rem",fontWeight:tab==="rivals"?700:400,
          background:tab==="rivals"?"rgba(232,100,34,.08)":"transparent",
          color:tab==="rivals"?C.wh:C.dmr,
          borderBottom:tab==="rivals"?`2px solid #e67e22`:"2px solid transparent"}}>
          🤖 Rakip AI
        </button>
        <button onClick={()=>setTab("global")} style={{flex:1,padding:"9px 4px",border:"none",cursor:"pointer",
          fontFamily:"inherit",fontSize:".6rem",fontWeight:tab==="global"?700:400,
          background:tab==="global"?"rgba(45,143,255,.12)":"transparent",
          color:tab==="global"?C.wh:C.dmr,
          borderBottom:tab==="global"?`2px solid ${C.ac2}`:"2px solid transparent"}}>
          🌍 Global <span style={{fontSize:".46rem",color:C.dmr,marginLeft:3}}>{allGlobal.length}</span>
        </button>
      </div>

      <div style={{flex:1,overflowY:"auto",padding:12}}>
        {tab==="team"&&<>
          <STitle extra={`${teamNews.length} haber`}>Transfer & Kadro Haberleri</STitle>
          {teamNews.length===0&&(
            <div style={{textAlign:"center",padding:"40px 20px",color:C.dmr}}>
              <div style={{fontSize:"2.5rem",marginBottom:10}}>📰</div>
              <div style={{fontSize:".72rem",marginBottom:4}}>Henüz haber yok</div>
              <div style={{fontSize:".6rem"}}>Transfer ve kadro hareketleri burada görünecek</div>
            </div>
          )}
          {teamNews.map((item,i)=><NewsCard key={i} item={item}/>)}
        </>}

        {tab==="rivals"&&(()=>{
          const myLg=season?season.league||"1. Lig":"1. Lig";
          const lgTeams=season?[...season.teams].filter(t=>t.lg===myLg).sort((a,b)=>b.pts-a.pts):[];
          const myIdx=lgTeams.findIndex(t=>t.me);
          const rivalNews=globalNews.filter(n=>n.type==="rival_transfer");
          return(
            <>
              <STitle extra="AI Güç Analizi">Rakip Takım İzleme</STitle>
              {/* Lig güç haritası */}
              <div style={{marginBottom:10}}>
                {lgTeams.map((t,i)=>{
                  const isMe=t.me;
                  const rank=i+1;
                  const str=t.str||65;
                  const threat=str>=78?"🔴 Yüksek":str>=68?"🟡 Orta":"🟢 Düşük";
                  const threatCol=str>=78?C.red2:str>=68?C.gd:C.grn2;
                  const aiStyle=rank<=2?"Şampiyonluk":rank>=lgTeams.length-2?"Küme korkusu":rank<=5?"Avrupa peşi":"Orta saha";
                  const ptGap=(lgTeams[0].pts||0)-(t.pts||0);
                  // Son form — pts / played oranı
                  const played=(t.w||0)+(t.d||0)+(t.l||0)||1;
                  const ppg=((t.pts||0)/played).toFixed(1);
                  return(
                    <div key={t.n} style={{
                      display:"flex",alignItems:"center",gap:8,
                      padding:"7px 10px",marginBottom:5,
                      background:isMe?"rgba(77,168,255,.1)":"transparent",
                      border:`1px solid ${isMe?C.ac2:C.brd}`,
                      borderLeft:`3px solid ${isMe?C.ac2:threatCol}`,
                      borderRadius:5,
                    }}>
                      {/* Sıra */}
                      <div style={{
                        minWidth:20,textAlign:"center",
                        fontSize:".58rem",fontWeight:700,
                        color:rank<=2?C.gd:rank>=lgTeams.length-2?C.red2:C.dmr,
                      }}>{rank}</div>
                      {/* İsim */}
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:".65rem",fontWeight:isMe?700:500,
                          overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",
                          color:isMe?C.ac2:C.wh}}>
                          {isMe?"⭐ ":""}{t.n}
                        </div>
                        <div style={{fontSize:".44rem",color:C.dmr,marginTop:1}}>
                          {isMe?"Senin takımın":aiStyle} · {ppg} puan/maç
                        </div>
                      </div>
                      {/* Güç */}
                      <div style={{textAlign:"center",minWidth:34}}>
                        <div style={{fontSize:".4rem",color:C.dmr,marginBottom:1}}>GÜÇS</div>
                        <div style={{fontSize:".72rem",fontWeight:700,color:threatCol,fontFamily:"'Barlow Condensed',sans-serif"}}>{str}</div>
                      </div>
                      {/* Bütçe */}
                      {!isMe&&<div style={{textAlign:"center",minWidth:38}}>
                        <div style={{fontSize:".4rem",color:C.dmr,marginBottom:1}}>BÜTÇE</div>
                        <div style={{fontSize:".58rem",fontWeight:700,
                          color:(t.budget||0)-(t.spent||0)>20?C.grn2:(t.budget||0)-(t.spent||0)>5?C.gd:C.red2}}>
                          {Math.max(0,Math.round((t.budget||0)-(t.spent||0)))}M€
                        </div>
                      </div>}
                      {/* Tehdit */}
                      {!isMe&&<div style={{
                        fontSize:".42rem",padding:"2px 5px",borderRadius:3,
                        background:`${threatCol}18`,
                        border:`1px solid ${threatCol}44`,
                        color:threatCol,fontWeight:600,whiteSpace:"nowrap",
                      }}>{threat}</div>}
                      {isMe&&<div style={{
                        fontSize:".42rem",padding:"2px 5px",borderRadius:3,
                        background:"rgba(45,143,255,.15)",
                        border:`1px solid ${C.ac}`,color:C.ac2,fontWeight:600,
                      }}>SEN</div>}
                    </div>
                  );
                })}
              </div>
              {/* Rakip AI Haberleri */}
              {rivalNews.length>0&&<>
                <STitle extra={`${rivalNews.length}`}>Rakip AI Faaliyetleri</STitle>
                {rivalNews.map((item,i)=><NewsCard key={i} item={item}/>)}
              </>}
              {rivalNews.length===0&&<div style={{textAlign:"center",padding:"20px",color:C.dmr,fontSize:".6rem"}}>
                Henüz rakip AI hareketi yok. Maç oynadıkça rakipler aktif olacak.
              </div>}
            </>
          );
        })()}

        {tab==="global"&&<>
          <STitle extra={`${allGlobal.length} haber`}>Global Futbol Haberleri</STitle>
          {allGlobal.length===0&&(
            <div style={{textAlign:"center",padding:"40px 20px",color:C.dmr}}>
              <div style={{fontSize:"2.5rem",marginBottom:10}}>🌍</div>
              <div style={{fontSize:".72rem",marginBottom:4}}>Henüz global haber yok</div>
              <div style={{fontSize:".6rem"}}>Maç oynadıkça haberler burada birikecek</div>
            </div>
          )}
          {allGlobal.map((item,i)=><NewsCard key={i} item={item}/>)}
        </>}
      </div>
    </div>
  );
}
