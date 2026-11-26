// ═══════════════════════════════════════════════════════════════
// AVRUPA KUPALARI — SWISS MODEL PANELİ (36 takımlı tek tablo + eleme ağacı)
// PageHome (Avrupa sekmeleri) ve PageIstatistik (EuroSimWidget) kullanır.
// Veri: season.clTable / season.uefaTable / season.conTable (js/data/league.js motoru)
// ═══════════════════════════════════════════════════════════════
const euroPhaseLabel=(tbl)=>{
  if(!tbl) return "";
  if(tbl.phase==="league"){
    const done=Math.max(0,...tbl.matches.filter(m=>m.hg!==null).map(m=>m.md),0);
    return `Lig Aşaması · ${done}/${EURO_META[tbl.comp].md}. hafta`;
  }
  if(tbl.phase==="done") return `Tamamlandı · 🏆 ${tbl.champion||""}`;
  return EURO_KO_LABEL[tbl.phase]||"";
};

// Bir kupanın Gol & Asist krallığı — KÜMÜLATİF:
//  · AI takımlar: lig aşaması + tüm eleme ayaklarındaki toplam golleri (tbl.matches + tbl.ko) oyunculara dağıtılır.
//    Toplam gol yalnız artar, dağıtım (getTeamEuroScorers) toplamla monoton → turlar ilerledikçe değerler sıfırlanmaz.
//  · Kullanıcı: bu kupadaki gerçek maç sonuçlarının scorers/assisters listeleri (lig aşaması + eleme).
//  · Sadece tbl.teams (o kupanın 36 katılımcısı) — CL / UEFA / CON birbirine karışmaz.
const euroTeamGoals=(tbl)=>{
  const g={};(tbl.teams||[]).forEach(t=>{g[t.n]=0;});
  (tbl.matches||[]).forEach(m=>{if(m.hg===null)return;g[m.h]=(g[m.h]||0)+m.hg;g[m.a]=(g[m.a]||0)+m.ag;});
  EURO_KO_ROUNDS.forEach(r=>(tbl.ko&&tbl.ko[r]||[]).forEach(t=>t.legs.forEach(l=>{if(l.hg===null)return;g[l.h]=(g[l.h]||0)+l.hg;g[l.a]=(g[l.a]||0)+l.ag;})));
  return g;
};
const calcEuroScorers=(tbl,season,db)=>{
  if(!tbl) return {topG:[],topA:[]};
  const goals=euroTeamGoals(tbl);
  const all=[];
  const meT=tbl.teams.find(t=>t.me);
  tbl.teams.forEach(t=>{
    if(t.me) return;
    const list=typeof getTeamEuroScorers==="function"?getTeamEuroScorers(t.n,goals[t.n]||0,db||DB):[];
    list.forEach(p=>all.push({n:p.n,team:t.n,g:p.g,a:p.a,me:false}));
  });
  if(meT){
    const gc={},ac={};
    (season.results||[]).filter(r=>r.comp===tbl.comp&&!String(r.round||"").startsWith("Grup")).forEach(r=>{
      (r.scorers||[]).forEach(n=>{if(typeof n==="string") gc[n]=(gc[n]||0)+1;});
      (r.assisters||[]).forEach(n=>{if(typeof n==="string") ac[n]=(ac[n]||0)+1;});
    });
    new Set([...Object.keys(gc),...Object.keys(ac)]).forEach(n=>all.push({n,team:meT.n,g:gc[n]||0,a:ac[n]||0,me:true}));
  }
  return {
    topG:all.filter(p=>p.g>0).sort((a,b)=>b.g-a.g||b.a-a.a).slice(0,10),
    topA:all.filter(p=>p.a>0).sort((a,b)=>b.a-a.a||b.g-a.g).slice(0,10),
  };
};

function EuroSwissPanel({season,comp,clubName,db}){
  const meta=EURO_META[comp]||EURO_META.CL;
  const tbl=season&&season[EURO_TABLE_KEY[comp]];
  const [view,setView]=useState("tablo");
  const acc=meta.color, rgb=meta.rgb;
  if(!tbl){
    return(
      <div style={{padding:"28px 14px",textAlign:"center",color:C.dim,fontSize:".6rem",lineHeight:1.6}}>
        <div style={{fontSize:"2rem",marginBottom:6}}>{meta.icon}</div>
        <div style={{fontWeight:800,color:acc,fontSize:".72rem",marginBottom:4}}>{meta.name}</div>
        36 takımlı lig aşaması kurası <b style={{color:C.wh}}>Eylül</b>'de çekilir.<br/>
        8 lig sıralamasından {comp==="CON"?"6 maçlık (6 torba)":"8 maçlık (4 torba)"} format.
      </div>
    );
  }
  const srt=euroSortTable(tbl.teams);
  const st=euroMyStatus(tbl);
  const zone=(i)=>i<8?{c:C.grn2,bg:"rgba(40,224,106,.07)"}:i<24?{c:C.gd,bg:"rgba(255,208,96,.05)"}:{c:C.red2,bg:"rgba(255,74,74,.04)"};
  const stageTxt=st?(st.stage==="champion"?"🏆 ŞAMPİYON":st.out?`Elendi (${st.stage==="league"?"Lig aşaması":EURO_KO_LABEL[st.stage]})`
    :st.stage==="league"?(st.rank<=8?"Son 16 hattında":st.rank<=24?"Play-Off hattında":"Eleme hattında")
    :`${EURO_KO_LABEL[st.stage]} devam ediyor`):null;
  const tabBtn=(k,l)=>(
    <button key={k} onClick={()=>setView(k)} style={{flex:1,padding:"5px 4px",borderRadius:5,fontSize:".5rem",fontWeight:700,cursor:"pointer",
      background:view===k?`rgba(${rgb},.18)`:"rgba(255,255,255,.03)",color:view===k?acc:C.dim,
      border:`1px solid ${view===k?`rgba(${rgb},.45)`:"rgba(255,255,255,.06)"}`}}>{l}</button>
  );
  const GRID="18px minmax(0,1fr) 20px 20px 20px 20px 30px 24px";
  const teamName=(n,bold)=>(
    <span style={{display:"flex",alignItems:"center",gap:4,minWidth:0,overflow:"hidden"}}>
      <TeamBadge name={n} size="sm"/>
      <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontWeight:bold?800:500}}>{n}</span>
    </span>
  );
  const isMe=(n)=>st&&n===st.name;

  const TableView=()=>(
    <div style={{border:`1px solid rgba(${rgb},.22)`,borderRadius:6,overflow:"hidden"}}>
      <div style={{display:"grid",gridTemplateColumns:GRID,padding:"4px 6px",fontSize:".4rem",color:C.dim,letterSpacing:1,
        textTransform:"uppercase",background:`rgba(${rgb},.08)`,fontWeight:700}}>
        <span style={{textAlign:"center"}}>#</span><span>Takım</span>
        <span style={{textAlign:"center"}}>O</span><span style={{textAlign:"center"}}>G</span>
        <span style={{textAlign:"center"}}>B</span><span style={{textAlign:"center"}}>M</span>
        <span style={{textAlign:"center"}}>Av</span><span style={{textAlign:"center"}}>P</span>
      </div>
      {srt.map((t,i)=>{
        const z=zone(i), gd=t.gf-t.ga;
        return(
          <React.Fragment key={t.n}>
            {(i===8||i===24)&&<div style={{height:1,background:i===8?"rgba(40,224,106,.45)":"rgba(255,74,74,.4)"}}/>}
            <div style={{display:"grid",gridTemplateColumns:GRID,padding:"3px 6px",alignItems:"center",fontSize:".55rem",
              borderLeft:`3px solid ${z.c}`,background:t.me?"rgba(45,143,255,.16)":z.bg,color:t.me?C.wh:i>=24?C.dim:C.wh,
              borderBottom:"1px solid rgba(77,166,255,0.06)"}}>
              <span style={{textAlign:"center",fontWeight:700,color:z.c,fontSize:".5rem"}}>{i+1}</span>
              {teamName((t.me?"▶ ":"")+t.n,t.me)}
              <span style={{textAlign:"center",color:C.dim}}>{t.w+t.d+t.l}</span>
              <span style={{textAlign:"center",color:C.grn2}}>{t.w}</span>
              <span style={{textAlign:"center",color:C.gd}}>{t.d}</span>
              <span style={{textAlign:"center",color:C.red2}}>{t.l}</span>
              <span style={{textAlign:"center",color:C.dim,fontSize:".48rem"}}>{gd>0?"+"+gd:gd}</span>
              <span style={{textAlign:"center",fontWeight:800,color:z.c}}>{t.pts}</span>
            </div>
          </React.Fragment>
        );
      })}
      <div style={{display:"flex",gap:8,flexWrap:"wrap",padding:"5px 8px",fontSize:".42rem",background:"rgba(0,0,0,.2)"}}>
        <span style={{color:C.grn2}}>■ 1–8 Son 16</span>
        <span style={{color:C.gd}}>■ 9–24 Eleme Play-Off</span>
        <span style={{color:C.red2}}>■ 25–36 Elenir</span>
      </div>
    </div>
  );

  const TieCard=({tie,round})=>{
    const agg={[tie.a]:0,[tie.b]:0};
    tie.legs.forEach(l=>{if(l.hg===null)return;agg[l.h]+=l.hg;agg[l.h===tie.a?tie.b:tie.a]+=l.ag;});
    const played=tie.legs.some(l=>l.hg!==null);
    const mine=isMe(tie.a)||isMe(tie.b);
    const row=(n)=>(
      <div style={{display:"flex",alignItems:"center",gap:4,fontSize:".55rem",color:tie.win===n?acc:tie.win?C.dim:C.wh}}>
        <div style={{flex:1,minWidth:0}}>{teamName(n,tie.win===n||isMe(n))}</div>
        {tie.legs.map((l,i)=>(
          <span key={i} style={{width:16,textAlign:"center",color:C.dim,fontSize:".5rem"}}>
            {l.hg===null?"–":(l.h===n?l.hg:l.ag)}
          </span>
        ))}
        {round!=="fin"&&<span style={{width:18,textAlign:"center",fontWeight:800}}>{played?agg[n]:""}</span>}
      </div>
    );
    return(
      <div style={{padding:"5px 7px",marginBottom:5,borderRadius:5,background:mine?"rgba(45,143,255,.12)":"rgba(255,255,255,.025)",
        border:`1px solid ${mine?"rgba(77,168,255,.45)":`rgba(${rgb},.15)`}`}}>
        {row(tie.a)}{row(tie.b)}
        {tie.pen&&<div style={{fontSize:".42rem",color:C.gd,marginTop:2}}>Penaltılar: {tie.pen.a}-{tie.pen.b}</div>}
      </div>
    );
  };

  const KoView=()=>{
    if(tbl.phase==="league"){
      return(
        <div style={{padding:"14px 10px",textAlign:"center",fontSize:".55rem",color:C.dim,lineHeight:1.7}}>
          Eleme turları lig aşaması bitince belirlenir.<br/>
          <b style={{color:C.grn2}}>1–8</b> doğrudan Son 16 · <b style={{color:C.gd}}>9–24</b> Şubat'ta çift maçlı Play-Off<br/>
          Son 16 Mart · Çeyrek Final Nisan · Yarı Final Mayıs başı · Final Mayıs sonu (tek maç)
        </div>
      );
    }
    return(
      <div>
        {EURO_KO_ROUNDS.filter(r=>(tbl.ko[r]||[]).length).map(r=>(
          <div key={r} style={{marginBottom:8}}>
            <div style={{fontSize:".5rem",fontWeight:800,letterSpacing:1.5,color:acc,textTransform:"uppercase",margin:"4px 2px"}}>
              {EURO_KO_LABEL[r]}{r!=="fin"?" · çift maç":" · tek maç"}
            </div>
            {r==="po"&&tbl.direct&&(
              <div style={{fontSize:".44rem",color:C.dim,margin:"0 2px 4px"}}>Doğrudan Son 16: {tbl.direct.join(", ")}</div>
            )}
            {(tbl.ko[r]||[]).map((tie,i)=><TieCard key={i} tie={tie} round={r}/>)}
          </div>
        ))}
        {tbl.champion&&(
          <div style={{textAlign:"center",padding:"8px",fontSize:".7rem",fontWeight:800,color:acc}}>🏆 Şampiyon: {tbl.champion}</div>
        )}
      </div>
    );
  };

  const MyView=()=>{
    if(!st) return <div style={{padding:12,fontSize:".55rem",color:C.dim,textAlign:"center"}}>{clubName||"Takımın"} bu kupada yer almıyor.</div>;
    const myM=tbl.matches.filter(m=>isMe(m.h)||isMe(m.a)).sort((a,b)=>a.md-b.md);
    const cal=tbl.cal||{md:[]};
    return(
      <div>
        {myM.map((m,i)=>{
          const home=isMe(m.h), opp=home?m.a:m.h;
          const my=home?m.hg:m.ag, op=home?m.ag:m.hg;
          const r=m.hg===null?null:my>op?"W":my<op?"L":"D";
          const t=tbl.teams.find(x=>x.n===opp)||{};
          return(
            <div key={i} style={{display:"flex",alignItems:"center",gap:6,padding:"5px 7px",marginBottom:4,borderRadius:5,
              background:"rgba(255,255,255,.025)",borderLeft:`3px solid ${r==="W"?C.grn2:r==="L"?C.red2:r==="D"?C.gd:`rgba(${rgb},.4)`}`}}>
              <span style={{fontSize:".44rem",color:C.dim,width:44}}>{m.md}. hafta<br/>{(cal.md[m.md-1]||{}).month||""}</span>
              <span style={{fontSize:".5rem",color:home?C.ac2:C.dim,width:12}}>{home?"⌂":"✈"}</span>
              <div style={{flex:1,minWidth:0,fontSize:".56rem"}}>{teamName(opp)}</div>
              <span style={{fontSize:".42rem",color:C.dim}}>T{t.pot||"?"}</span>
              <span style={{fontSize:".6rem",fontWeight:800,width:30,textAlign:"right",color:r==="W"?C.grn2:r==="L"?C.red2:r==="D"?C.gd:C.dim}}>
                {r?`${my}-${op}`:"–"}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  const KingsView=()=>{
    const {topG,topA}=calcEuroScorers(tbl,season,db);
    if(!topG.length&&!topA.length) return <div style={{padding:12,fontSize:".55rem",color:C.dim,textAlign:"center"}}>Henüz gol yok.</div>;
    const col=(list,key,color,title)=>(
      <div style={{flex:1,minWidth:0}}>
        <div style={{padding:"3px 8px",fontSize:".42rem",fontWeight:700,color,letterSpacing:1,background:"rgba(255,255,255,.03)"}}>{title}</div>
        {list.map((p,i)=>(
          <div key={p.team+p.n} style={{display:"flex",alignItems:"center",gap:4,padding:"3px 8px",borderBottom:"1px solid rgba(45,143,255,0.06)"}}>
            <span style={{fontSize:".44rem",color:i===0?C.gd:C.dim,fontWeight:700,minWidth:12}}>{i+1}</span>
            <span style={{flex:1,fontSize:".5rem",color:p.me?C.ac2:C.wh,fontWeight:p.me?700:400,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.n}</span>
            <span style={{fontSize:".42rem",color:C.dim,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:60}}>{p.team}</span>
            <span style={{fontSize:".6rem",fontWeight:800,color:i===0?color:C.wh,minWidth:16,textAlign:"right"}}>{p[key]}</span>
          </div>
        ))}
      </div>
    );
    return(
      <div style={{border:`1px solid rgba(${rgb},.3)`,borderRadius:8,overflow:"hidden"}}>
        <div style={{padding:"5px 10px",background:`rgba(${rgb},.12)`,fontSize:".5rem",fontWeight:700,color:acc,letterSpacing:1}}>
          {meta.icon} {meta.name} — GOL & ASİST KRALLARI
        </div>
        <div style={{display:"flex"}}>
          {col(topG,"g",C.grn2,"⚽ GOL")}
          <div style={{width:1,background:"rgba(77,166,255,0.1)"}}/>
          {col(topA,"a","#a78bfa","🎯 ASİST")}
        </div>
      </div>
    );
  };

  const prim=EURO_PRIM[comp]||EURO_PRIM.UEFA;
  const fmtE=(v)=>v>=1000?(v/1000).toFixed(1)+"M€":v+"K€";
  return(
    <div>
      <div style={{padding:"9px 10px",marginBottom:8,borderRadius:8,background:`linear-gradient(135deg,rgba(${rgb},.16),rgba(0,0,0,.25))`,
        border:`1px solid rgba(${rgb},.35)`}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:"1.4rem"}}>{meta.icon}</span>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:".66rem",fontWeight:800,color:acc}}>{meta.name}</div>
            <div style={{fontSize:".46rem",color:C.dim}}>36 takım · tek tablo · {euroPhaseLabel(tbl)}</div>
          </div>
          {st&&(
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:".8rem",fontWeight:800,color:st.out?C.red2:C.wh}}>{st.rank}.</div>
              <div style={{fontSize:".42rem",color:st.out?C.red2:st.stage==="champion"?acc:C.grn2}}>{stageTxt}</div>
            </div>
          )}
        </div>
      </div>
      <div style={{display:"flex",gap:4,marginBottom:8}}>
        {tabBtn("tablo","📊 Tablo")}{tabBtn("eleme","🏆 Eleme")}{tabBtn("kral","⚽ Krallık")}{st&&tabBtn("mac","📅 Maçlarım")}
      </div>
      {view==="tablo"&&<TableView/>}
      {view==="eleme"&&<KoView/>}
      {view==="mac"&&<MyView/>}
      {view==="kral"&&<KingsView/>}
      {view==="tablo"&&(
        <div style={{marginTop:8,padding:"6px 8px",borderRadius:6,background:"rgba(255,255,255,.02)",border:"1px solid rgba(255,255,255,.05)",
          display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"3px 8px",fontSize:".44rem",color:C.dim}}>
          <span>Galibiyet <b style={{color:acc}}>{fmtE(prim.lig_galibiyet)}</b></span>
          <span>Beraberlik <b style={{color:acc}}>{fmtE(prim.lig_beraberlik)}</b></span>
          <span>Play-Off <b style={{color:acc}}>{fmtE(prim.playoff)}</b></span>
          <span>Son 16 <b style={{color:acc}}>{fmtE(prim.son16)}</b></span>
          <span>Çeyrek <b style={{color:acc}}>{fmtE(prim.ceyrek)}</b></span>
          <span>Yarı Final <b style={{color:acc}}>{fmtE(prim.yari)}</b></span>
          <span>Final <b style={{color:acc}}>{fmtE(prim.final)}</b></span>
          <span>Finalist <b style={{color:acc}}>{fmtE(prim.finalist)}</b></span>
          <span>Şampiyon <b style={{color:acc}}>{fmtE(prim.sampiyon)}</b></span>
        </div>
      )}
    </div>
  );
}
