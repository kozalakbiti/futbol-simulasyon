// ═══════════════════════════════════════════════════════════════
// MAÇ SONU BASIN TOPLANTISI MODALI
// Önemli maçlar sonrası otomatik çıkar
// ═══════════════════════════════════════════════════════════════
function PostMatchBasinModal({fix,result,clubName,fans,mgmt,updateFans,updateMgmt,addNews,onClose}){
  const isW=result.res==="W", isL=result.res==="L";
  const bigWin=isW&&(result.myG-result.opG)>=3;
  const bigLoss=isL&&(result.opG-result.myG)>=3;
  const isKupa=fix.comp==="ZTK"||fix.comp==="CL"||fix.comp==="UEFA";
  const score=`${result.myG}-${result.opG}`;

  // Sorular — sadece bir kez oluştur (fix/result değişmez)
  const questions=React.useMemo(()=>{
    // Rastgele ama tutarlı seed (fix bazlı)
    const seed=(fix.opp.charCodeAt(0)||0)*31+(fix.w||0)*17+(result.myG*7)+(result.opG*3);
    const pick=(arr,offset=0)=>arr[(seed+offset)%arr.length];

    const pool=[];

    // ── SORU 1: Maç sonucu değerlendirmesi ─────────────────────────
    if(isW){
      const q1pool=[
        {q:`${fix.opp}'a karşı ${score} galibiyeti nasıl değerlendiriyorsunuz?`,opts:[
          {t:"Harika bir performans, takım olarak çok iyi oynadık.",fan:+2,mgmt:+1},
          {t:"Kazandık ama bazı bölümlerde daha iyi olabilirdik.",fan:+1,mgmt:+2},
          {t:"Bu galibiyet taraftarlarımıza armağanımız!",fan:+3,mgmt:-1},
        ]},
        {q:`${fix.opp} galibiyetinin en kritik anı sizce neydi?`,opts:[
          {t:"Savunma düzenimiz mükemmeldi, rakibe nefes aldırmadık.",fan:+1,mgmt:+2},
          {t:"İlk golümüz oyunun seyrini değiştirdi.",fan:+2,mgmt:+1},
          {t:"Taraftarımızın desteği bize güç verdi, onlar 12. oyuncumuzdu.",fan:+3,mgmt:-1},
        ]},
        {q:`${score}'lik skorla biten maçta takımınızın performansını puanlar mısınız?`,opts:[
          {t:"8/10 veririm. Tutarlı ve disiplinli bir oyundu.",fan:+1,mgmt:+2},
          {t:"10/10! Bugün her şey mükemmeldi.",fan:+2,mgmt:0},
          {t:"Puanlar önemli değil, taraftarı mutlu etmek önemli!",fan:+3,mgmt:-1},
        ]},
        {q:`Bu galibiyet sezon hedeflerinize nasıl katkı sağlıyor?`,opts:[
          {t:"Her puan değerli, hedefe odaklanmaya devam ediyoruz.",fan:+1,mgmt:+2},
          {t:"Çok önemli bir puan aldık, üst sıralar için kritikti.",fan:+2,mgmt:+1},
          {t:"Şampiyonluk yolunda büyük bir adım attık!",fan:+3,mgmt:-1},
        ]},
      ];
      pool.push(pick(q1pool,0));
    } else if(isL){
      const q1pool=[
        {q:`${fix.opp} karşısında ${score} mağlubiyetten sonra neler söylemek istersiniz?`,opts:[
          {t:"Hayal kırıklığımız büyük ama başımızı kaldıracağız.",fan:+1,mgmt:+1},
          {t:"Bu sonuç kabul edilemez. Taraftardan özür dilerim.",fan:+2,mgmt:-1},
          {t:"Rakip daha iyiydi, ders çıkaracağız.",fan:0,mgmt:+2},
        ]},
        {q:`Bu yenilginin temel nedeni ne oldu?`,opts:[
          {t:"Bireysel hatalar ve konsantrasyon eksikliği. Üzerinde çalışacağız.",fan:+1,mgmt:+2},
          {t:"Taktik açıdan yetersiz kaldık. Sorumluluğu alıyorum.",fan:+2,mgmt:+1},
          {t:"Şans bugün yanımızda değildi ama taraftar her zaman arkamızda.",fan:+2,mgmt:-1},
        ]},
        {q:`Takımın morali bu yenilgiden nasıl etkilendi?`,opts:[
          {t:"Profesyoneliz, moralimizi koruyup sıkı çalışacağız.",fan:+1,mgmt:+2},
          {t:"Herkes üzgün ama bu bizi daha güçlü yapacak.",fan:+2,mgmt:+1},
          {t:"Taraftarımız moralimizin kaynağı. Onlar için geri döneceğiz.",fan:+3,mgmt:-1},
        ]},
        {q:`${fix.opp}'a karşı ${score} kaybettiniz. Oyunculara ne söylediniz?`,opts:[
          {t:"Hatalarımızı analiz ettik, bir sonraki maça odaklandık.",fan:+1,mgmt:+2},
          {t:"Hepsinden daha fazlasını beklediklerini söyledim.",fan:+1,mgmt:+1},
          {t:"Taraftarımızı hayal kırıklığına uğratmanın üzüntüsünü paylaştım.",fan:+2,mgmt:0},
        ]},
      ];
      pool.push(pick(q1pool,0));
    } else {
      const q1pool=[
        {q:`${fix.opp} ile ${score} beraberlik hakkında ne düşünüyorsunuz?`,opts:[
          {t:"Güçlü rakibe karşı bir puan değerliydi.",fan:+1,mgmt:+2},
          {t:"Kazanabileceğimiz bir maçtı, hayal kırıklığı yaşadık.",fan:+1,mgmt:0},
          {t:"Taraftarlarımız daha fazlasını hak ediyordu.",fan:+2,mgmt:-1},
        ]},
        {q:`${score}'lik beraberliği nasıl yorumlarsınız, kazanılmış mı kaybedilmiş mi?`,opts:[
          {t:"Dengeli bir maçtı, adil sonuç.",fan:+1,mgmt:+2},
          {t:"İkinci yarıda daha iyi oynasaydık kazanırdık.",fan:+1,mgmt:+1},
          {t:"Taraftarımız layık olduğumuzdan fazlasını hak ediyor.",fan:+2,mgmt:-1},
        ]},
        {q:`Bu beraberlik sezon gidişatınıza nasıl yansıyacak?`,opts:[
          {t:"İki puan bıraktık ama devam ediyoruz.",fan:+1,mgmt:+1},
          {t:"Kritik bir puan kaybı ama maç takvimimize bakacağız.",fan:+1,mgmt:+2},
          {t:"Sezon henüz bitmedi, taraftarımızla birlikte mücadele edeceğiz.",fan:+3,mgmt:-1},
        ]},
      ];
      pool.push(pick(q1pool,0));
    }

    // ── SORU 2: Bağlam bazlı ───────────────────────────────────────
    if(isKupa){
      const q2pool=[
        {q:"Kupa maçının özel baskısını nasıl yönettiniz?",opts:[
          {t:"Kupa her zaman ayrı motivasyon kaynağıdır.",fan:+2,mgmt:+1},
          {t:"Lig ve kupa dengesini iyi kurduk.",fan:+1,mgmt:+2},
          {t:"Kupa şampiyonluğuna susamış taraftarlarımız için elimizden geleni yaptık.",fan:+3,mgmt:-1},
        ]},
        {q:`${fix.comp==="ZTK"?"Ulusal Kupa":"Avrupa Ligi"} bu sezon hedeflerinizde kaçıncı sırada?`,opts:[
          {t:"Her turnuvada kazanmak için oynuyoruz.",fan:+2,mgmt:+1},
          {t:"Lig önceliğimiz ama kupayı da ciddiye alıyoruz.",fan:+1,mgmt:+2},
          {t:"Taraftarımıza kupa sevinci yaşatmak istiyoruz!",fan:+3,mgmt:-1},
        ]},
        {q:"Kupa performansınızdan memnun musunuz?",opts:[
          {t:"Evet, takım kupaya gereken özeni gösteriyor.",fan:+1,mgmt:+2},
          {t:"Bazı maçlarda daha iyi olabilirdik ama ilerliyoruz.",fan:+1,mgmt:+1},
          {t:"Taraftarımız kupayı çok istiyor, onun için savaşacağız.",fan:+3,mgmt:-1},
        ]},
      ];
      pool.push(pick(q2pool,3));
    } else if(bigWin){
      const q2pool=[
        {q:"Bu kadar büyük farkla kazanmak ne hissettiriyor?",opts:[
          {t:"Takımın potansiyelini gösterdik, gurur verici.",fan:+2,mgmt:+1},
          {t:"Rakibe saygısızlık etmek istemem ama harika bir gündü.",fan:+1,mgmt:+2},
          {t:"Taraftarlarla birlikte gökyüzüne uçtuk!",fan:+3,mgmt:-1},
        ]},
        {q:`${score} büyük bir skor. Rakibin savunmasını nasıl kırdınız?`,opts:[
          {t:"İyi hazırlandık, rakibin zayıf noktalarını bulduk.",fan:+1,mgmt:+2},
          {t:"Oyuncularım bireysel kalitelerini konuşturdu.",fan:+2,mgmt:+1},
          {t:"Taraftarımız arkamızdayken rakip savunması çözülür!",fan:+3,mgmt:-1},
        ]},
      ];
      pool.push(pick(q2pool,5));
    } else if(bigLoss){
      const q2pool=[
        {q:"Bu ağır yenilgiyi nasıl açıklarsınız?",opts:[
          {t:"Bireysel hatalar ve kolektif düşüş. Hep birlikte çalışacağız.",fan:+1,mgmt:+2},
          {t:"Sorumluluğu üstleniyorum. Taktiksel hatalar bende.",fan:+2,mgmt:+1},
          {t:"Bu sezon en kötü günümüzdü. Taraftardan özür diliyorum.",fan:+2,mgmt:-1},
        ]},
        {q:`${score} ağır bir yenilgi. Soyunma odasında hava nasıldı?`,opts:[
          {t:"Sessizlik vardı ama profesyoneller hızlı toparlıyor.",fan:+1,mgmt:+2},
          {t:"Herkes hayal kırıklığını yaşadı, ama bu bizi güçlendirecek.",fan:+2,mgmt:+1},
          {t:"Taraftarımıza karşı utanç duyduk, onlardan özür dileriz.",fan:+2,mgmt:-1},
        ]},
      ];
      pool.push(pick(q2pool,5));
    } else {
      const q2pool=[
        {q:"Bir sonraki maça nasıl hazırlanacaksınız?",opts:[
          {t:"Analiz yapıp eksiklerimizi kapatacağız.",fan:+1,mgmt:+2},
          {t:"Takım morali yüksek, güçlü döneceğiz.",fan:+2,mgmt:+1},
          {t:"Taraftarlarımızın güvenini kazanmak için her şeyi yapacağız.",fan:+2,mgmt:-1},
        ]},
        {q:"Takımınızın bu dönem en güçlü ve zayıf yönü nedir?",opts:[
          {t:"Savunma sağlam, hücumda tutarlılık üzerine çalışıyoruz.",fan:+1,mgmt:+2},
          {t:"Takım ruhu en güçlü yönümüz, bunu koruyacağız.",fan:+2,mgmt:+1},
          {t:"Taraftarımızın desteğiyle her engeli aşabiliriz.",fan:+3,mgmt:-1},
        ]},
        {q:"Sezonun geri kalanı için beklentileriniz neler?",opts:[
          {t:"Hedeflerimizi gerçekçi tutuyoruz, adım adım ilerliyoruz.",fan:+1,mgmt:+2},
          {t:"Potansiyelimizin farkındayız, üst sıralara bakıyoruz.",fan:+2,mgmt:+1},
          {t:"Taraftarımızın beklentisi bizim de beklentimiz — en üst!",fan:+3,mgmt:-1},
        ]},
        {q:"Rakiple karşılaşmadan önce en çok neyi düşünüyordunuz?",opts:[
          {t:"Rakibin hücum organizasyonunu kırmayı.",fan:+1,mgmt:+2},
          {t:"Kendi oyunumuzu doğru uygulamayı.",fan:+1,mgmt:+1},
          {t:"Taraftarımıza yakışır bir gösteri sunmayı.",fan:+3,mgmt:-1},
        ]},
        {q:"Rakip teknik direktörü hakkında ne düşünüyorsunuz?",opts:[
          {t:"Saygın bir teknik adam, iyi hazırlanmış bir takım kurmuş.",fan:+1,mgmt:+2},
          {t:"Her teknik direktör gibi iyi ve kötü yanları var.",fan:+1,mgmt:+1},
          {t:"Teknik direktörler rakip olur ama taraftarlar hep bizimle.",fan:+2,mgmt:-1},
        ]},
      ];
      pool.push(pick(q2pool,7));
    }

    return pool;
  },[fix.opp, fix.comp, fix.w, isW, isL, bigWin, bigLoss, isKupa, score]);

  const [answers,setAnswers]=useState({}); // {qi: oi} — soru indeksi → seçenek indeksi
  const [done,setDone]=useState(false);
  const [summary,setSummary]=useState(null);

  const allAnswered=Object.keys(answers).length===questions.length;

  const finish=()=>{
    if(!allAnswered) return;
    let totalFan=0, totalMgmt=0;
    questions.forEach((q,qi)=>{
      const oi=answers[qi];
      if(oi!==undefined){ totalFan+=q.opts[oi].fan; totalMgmt+=q.opts[oi].mgmt; }
    });
    if(updateFans) updateFans(totalFan,`Basın toplantısı: ${fix.opp} maçı sonrası`,"press");
    if(updateMgmt) updateMgmt(totalMgmt,`Basın toplantısı: ${fix.opp} maçı sonrası`);
    if(addNews) addNews({type:"basin",player:"Maç sonu basın toplantısı",club:clubName,val:0,
      detail:`${fix.opp} (${score}) sonrası`,date:new Date().toLocaleDateString("tr-TR")});
    setSummary({totalFan,totalMgmt});
    setDone(true);
  };

  const resIcon=isW?"🏆":isL?"😞":"🤝";
  const resText=isW?"Galibiyet":isL?"Mağlubiyet":"Beraberlik";
  const compLabel=fix.comp==="ZTK"?"Ulusal Kupa":fix.comp==="CL"?"Avrupa Şampiyonlar Kupası":fix.comp==="UEFA"?"Avrupa Ligi":"Lig Maçı";

  return(
    <div style={{
      position:"fixed",inset:0,zIndex:9000,
      background:"rgba(0,0,0,.82)",backdropFilter:"blur(4px)",
      display:"flex",alignItems:"center",justifyContent:"center",
    }}>
      <div style={{
        width:"min(390px,96vw)",maxHeight:"88vh",overflowY:"auto",
        background:"linear-gradient(160deg,#0d1b3e,#0a1628)",
        border:"1px solid rgba(26,110,216,.35)",
        borderRadius:14,padding:20,
        boxShadow:"0 20px 60px rgba(0,0,0,.7)",
      }}>
        {/* Başlık */}
        <div style={{textAlign:"center",marginBottom:16}}>
          <div style={{fontSize:"1.8rem",marginBottom:4}}>🎤</div>
          <div style={{fontSize:".54rem",color:"rgba(180,200,255,.5)",textTransform:"uppercase",letterSpacing:2,marginBottom:6}}>
            Maç Sonu Basın Toplantısı
          </div>
          <div style={{fontSize:".8rem",fontWeight:800,color:"#f0f4ff",marginBottom:4}}>
            {resIcon} {fix.opp} — {score}
          </div>
          <div style={{fontSize:".5rem",color:"rgba(180,200,255,.5)"}}>
            {compLabel} · {resText}
          </div>
        </div>

        {!done&&<>
          {questions.map((q,qi)=>(
            <div key={qi} style={{marginBottom:14}}>
              <div style={{
                fontSize:".54rem",color:"rgba(200,220,255,.8)",
                fontWeight:600,marginBottom:8,lineHeight:1.4,
                padding:"6px 10px",background:"rgba(26,110,216,.08)",
                borderLeft:"2px solid rgba(26,110,216,.5)",borderRadius:"0 5px 5px 0",
              }}>
                🎙️ {q.q}
              </div>
              {q.opts.map((opt,oi)=>{
                const sel=answers[qi]===oi;
                return(
                  <button key={oi} onClick={()=>setAnswers(a=>({...a,[qi]:oi}))}
                    style={{
                      width:"100%",textAlign:"left",padding:"8px 12px",marginBottom:5,
                      background:sel?"rgba(77,166,255,.25)":"rgba(255,255,255,.03)",
                      border:`1px solid ${sel?"rgba(26,110,216,.6)":"rgba(255,255,255,.08)"}`,
                      borderRadius:7,cursor:"pointer",fontFamily:"inherit",
                      color:sel?"#f0f4ff":"rgba(200,220,255,.7)",
                      fontSize:".54rem",lineHeight:1.4,transition:"all .12s",
                    }}>
                    {sel&&<span style={{color:"#4a9eff",marginRight:6}}>▶</span>}
                    {opt.t}
                  </button>
                );
              })}
            </div>
          ))}

          <button onClick={finish} disabled={!allAnswered} style={{
            width:"100%",padding:"11px",marginTop:4,
            background:allAnswered?"linear-gradient(135deg,#1a4fa8,#2485ff)":"rgba(100,120,160,.15)",
            border:`1px solid ${allAnswered?"rgba(26,110,216,.5)":"rgba(100,120,160,.2)"}`,
            borderRadius:8,cursor:allAnswered?"pointer":"not-allowed",
            color:allAnswered?"#fff":"rgba(180,200,255,.3)",
            fontSize:".6rem",fontWeight:700,fontFamily:"inherit",
          }}>
            {allAnswered?"Toplantıyı Bitir →":"Tüm soruları yanıtlayın"}
          </button>
        </>}

        {done&&summary&&<>
          <div style={{textAlign:"center",marginBottom:16}}>
            <div style={{fontSize:"1.4rem",marginBottom:6}}>
              {summary.totalFan>=3?"🎉":summary.totalFan>0?"👍":summary.totalFan===0?"😐":"😬"}
            </div>
            <div style={{fontSize:".66rem",fontWeight:700,color:"#f0f4ff",marginBottom:4}}>
              Basın toplantısı tamamlandı
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
            {[
              {l:"Taraftar",v:summary.totalFan,col:summary.totalFan>0?C.grn2:summary.totalFan<0?C.red2:C.dmr,icon:"👥"},
              {l:"Yönetim",v:summary.totalMgmt,col:summary.totalMgmt>0?C.ac2:summary.totalMgmt<0?C.red2:C.dmr,icon:"🏢"},
            ].map(item=>(
              <div key={item.l} style={{
                padding:"12px",textAlign:"center",
                background:"rgba(26,110,216,.06)",
                border:`1px solid ${item.v>0?"rgba(45,143,255,.3)":item.v<0?"rgba(192,57,43,.3)":"rgba(100,120,160,.15)"}`,
                borderRadius:8,
              }}>
                <div style={{fontSize:".42rem",color:C.dmr,marginBottom:4}}>{item.icon} {item.l.toUpperCase()}</div>
                <div style={{fontSize:"1.4rem",fontWeight:900,color:item.col}}>
                  {item.v>0?"+":""}{item.v}
                </div>
              </div>
            ))}
          </div>
          <button onClick={onClose} style={{
            width:"100%",padding:"11px",
            background:"linear-gradient(135deg,#1a4fa8,#2485ff)",
            border:"none",borderRadius:8,cursor:"pointer",
            color:"#fff",fontSize:".62rem",fontWeight:700,fontFamily:"inherit",
          }}>Devam Et →</button>
        </>}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// BASIN TOPLANTISI (manuel — Diğer menüsünden)
// ═══════════════════════════════════════════════════════════════
function PageBasin({season,squad,clubName,fans,updateFans,addNews,rep,mgmt,updateMgmt}){
  const [tab,setTab]=useState("gundem");  // gundem | arsiv | sorular
  const [activeConf,setActiveConf]=useState(null);  // aktif basın konf
  const [answerSel,setAnswerSel]=useState({});
  const [confDone,setConfDone]=useState(false);
  const [confResult,setConfResult]=useState(null);
  const [history,setHistory]=useState([]);

  const myTeam=season.teams.find(t=>t.me)||{pts:0,rank:1};
  const lastResult=season.results.slice(-1)[0];
  const lastRes=lastResult?.res||"D";
  const leagueName=season.league||"1. Lig";
  const repPts=rep?.pts||30;

  // ── Basın Gündemleri ──
  const pressAgendas=[
    {
      id:"match_result",
      available:!!lastResult,
      title:lastResult?`${lastResult.opp} maçı sonrası`:"Maç sonrası basın",
      icon:lastRes==="W"?"🏆":lastRes==="L"?"😞":"🤝",
      desc:lastResult?`${lastResult.myG}-${lastResult.opG} (${lastRes==="W"?"Galibiyet":lastRes==="L"?"Mağlubiyet":"Beraberlik"})`:"",
      questions:[
        {q:"Maçın kilit anı neydi?",
          opts:[
            {t:"Takımın hazırlığı ve kolektif oyunu belirleyiciydi.",rep:0,fan:+1,mgmt:+2,tone:"profesyonel"},
            {t:"Bireysel kalite fark yarattı. Oyuncularım inanılmazdı.",rep:0,fan:+2,mgmt:0,tone:"övgü"},
            {t:"Hakem kararlarının etkisi oldu, ama mücadelemizden memnunuz.",rep:0,fan:+1,mgmt:-2,tone:"eleştirel"},
          ]},
        {q:"Taraftarların desteği hakkında ne düşünüyorsunuz?",
          opts:[
            {t:"Taraftarlarımız 12. adam. Onlar olmadan bu başarı olmazdı.",rep:0,fan:+2,mgmt:-1,tone:"duygusal"},
            {t:"Destekleri motivasyon kaynağımız, teşekkür ederiz.",rep:0,fan:+2,mgmt:+1,tone:"samimi"},
            {t:"Bundan sonra daha iyi gösteriler sergileyeceğiz.",rep:0,fan:+1,mgmt:+1,tone:"kararlı"},
          ]},
      ],
    },
    {
      id:"form",
      available:season.form.length>=3,
      title:"Son form ve hedefler",
      icon:"📈",
      desc:`Son 5: ${season.form.slice(-5).join(" ")||"—"}`,
      questions:[
        {q:"Sezon hedefleriniz neler?",
          opts:[
            {t:"Şampiyonluk için yarışacağız. Başka hedefimiz yok.",rep:0,fan:+2,mgmt:-2,tone:"iddialı"},
            {t:"Adım adım, maç maç düşünüyoruz. Süreç önemli.",rep:0,fan:+1,mgmt:+2,tone:"gerçekçi"},
            {t:"Play-off hedefimiz var, geri kalanını göreceğiz.",rep:0,fan:-1,mgmt:+2,tone:"temkinli"},
          ]},
        {q:"Sakatlıklar ve kadro derinliği hakkında?",
          opts:[
            {t:"Kadromuz sağlam, rekabet yüksek seviyede.",rep:0,fan:+1,mgmt:+1,tone:"güvenli"},
            {t:"Bazı sorunlarımız var ama bunları çözeceğiz.",rep:0,fan:0,mgmt:+1,tone:"dürüst"},
            {t:"Detay vermek istemiyorum, sadece sahaya odaklanıyoruz.",rep:0,fan:-1,mgmt:-1,tone:"kaçamak"},
          ]},
      ],
    },
    {
      id:"transfer",
      available:repPts>=20,
      title:"Transfer politikası",
      icon:"🔄",
      desc:"Piyasa gündemine dair sorular",
      questions:[
        {q:"Yeni transfer planlarınız var mı?",
          opts:[
            {t:"Doğru oyuncuyu doğru anda alırız. Aceleci olmayacağız.",rep:0,fan:+1,mgmt:+2,tone:"stratejik"},
            {t:"Mevcut kadromuza güveniyoruz, transfer şu an gündemde değil.",rep:0,fan:0,mgmt:+1,tone:"kapalı"},
            {t:"Birkaç isim var, resmi açıklama yapıncaya kadar bekleyin.",rep:0,fan:+2,mgmt:-2,tone:"heyecanlı"},
          ]},
        {q:"Ayrılacak oyuncu var mı?",
          opts:[
            {t:"Kimseyi satmak niyetinde değiliz, kadro bütünlüğü önceliğimiz.",rep:0,fan:+2,mgmt:-1,tone:"kararlı"},
            {t:"Her oyuncu için doğru teklif gelirse değerlendiririz.",rep:0,fan:-1,mgmt:+1,tone:"belirsiz"},
            {t:"Bu konu tamamen teknik direktör ve yönetimin kararı.",rep:0,fan:0,mgmt:+1,tone:"kaçamak"},
          ]},
      ],
    },
    {
      id:"rival",
      available:season.played>=5,
      title:"Rakip analizi",
      icon:"🆚",
      desc:"Rakip takımlar hakkında",
      questions:[
        {q:"En zorlu rakibiniz kim?",
          opts:[
            {t:"Her maçta 11 rakip var. Hepsine saygı duyuyoruz.",rep:0,fan:+1,mgmt:+1,tone:"alçakgönüllü"},
            {t:"Tabii ki lider takımlar güçlü ama onlardan korkmuyoruz.",rep:0,fan:+2,mgmt:-2,tone:"meydan okuma"},
            {t:"Rakiplerimizi analiz ediyoruz ama açıklamak doğru olmaz.",rep:0,fan:0,mgmt:+2,tone:"stratejik"},
          ]},
      ],
    },
  ].filter(a=>a.available);

  const startConf=(agenda)=>{
    setActiveConf(agenda);
    setAnswerSel({});
    setConfDone(false);
    setConfResult(null);
    setTab("sorular");
  };

  const finishConf=()=>{
    if(!activeConf) return;
    const answered=Object.values(answerSel);

    // ── Sürpriz faktörü ──
    const surpriseRoll=Math.random();
    let surprise=null;
    if(surpriseRoll<0.12){
      surprise={type:"viral",icon:"📲",label:"Viral Oldu!",
        desc:"Açıklamalarınız sosyal medyada gündem oldu.",fanBonus:+3,mgmtBonus:-1,col:C.grn2};
    } else if(surpriseRoll<0.22){
      surprise={type:"misquote",icon:"📰",label:"Yanlış Aktarıldı",
        desc:"Bir gazete sözlerinizi çarpıttı.",fanBonus:-2,mgmtBonus:-2,col:C.red2};
    } else if(surpriseRoll<0.30){
      surprise={type:"rival_comment",icon:"💬",label:"Rakip Tepki Verdi",
        desc:"Rakip teknik direktör açıklamalarınıza yanıt verdi.",fanBonus:+1,mgmtBonus:+1,col:C.gd};
    }

    const baseFan=answered.reduce((s,o)=>s+o.fan,0);
    const baseMgmt=answered.reduce((s,o)=>s+(o.mgmt||0),0);
    const totalFan=baseFan+(surprise?.fanBonus||0);
    const totalMgmt=baseMgmt+(surprise?.mgmtBonus||0);

    const avg=answered.length>0?baseFan/answered.length:0;
    const outcome=avg>=1.8?"Çok iyi basın toplantısı":avg>=0.8?"İyi basın toplantısı":avg>=-0.2?"Nötr basın toplantısı":"Kötü basın toplantısı";

    const breakdown=activeConf.questions.map((q,qi)=>{
      const opt=answerSel[qi];
      return {q:q.q,chosen:opt?.t||"—",fan:opt?.fan||0,mgmt:opt?.mgmt||0,tone:opt?.tone||""};
    });

    const result={title:activeConf.title,fan:totalFan,baseFan,mgmt:totalMgmt,baseMgmt,
      outcome,surprise,breakdown,date:new Date().toLocaleDateString("tr-TR")};
    if(updateFans) updateFans(totalFan,outcome+": "+activeConf.title,"press");
    if(updateMgmt) updateMgmt(totalMgmt,outcome+": "+activeConf.title);
    if(addNews) addNews({type:"basin",player:outcome,club:clubName,val:0,detail:activeConf.title,date:new Date().toLocaleDateString("tr-TR")});
    setConfResult(result);
    setHistory(h=>[result,...h].slice(0,20));
    setConfDone(true);
  };

  const allAnswered=activeConf&&Object.keys(answerSel).length===activeConf.questions.length;

  return(
    <div style={{flex:1,overflowY:"auto",padding:12}}>
      <STitle extra="📰">Basın Toplantısı</STitle>

      {/* Sekmeler */}
      <div style={{display:"flex",gap:2,marginBottom:12,background:"rgba(0,0,0,.3)",borderRadius:6,padding:3}}>
        {[["gundem","📋 Gündem"],["arsiv","📂 Arşiv"]].map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)} style={{
            flex:1,padding:"5px 8px",borderRadius:4,border:"none",cursor:"pointer",
            fontFamily:"inherit",fontSize:".56rem",fontWeight:tab===k?700:400,
            background:tab===k?"rgba(45,143,255,.25)":"transparent",
            color:tab===k?C.ac2:C.dmr,
          }}>{l}</button>
        ))}
      </div>

      {/* Gündem sekmesi */}
      {tab==="gundem"&&<>
        {pressAgendas.length===0&&(
          <div style={{textAlign:"center",padding:"24px",color:C.dmr,fontSize:".62rem"}}>
            Basın toplantısı için önce maç oynamanız gerekiyor.
          </div>
        )}
        {pressAgendas.map(ag=>(
          <div key={ag.id} style={{
            padding:"12px 14px",marginBottom:8,
            background:"rgba(26,110,216,.06)",
            border:`1px solid rgba(77,166,255,0.22)`,borderRadius:8,
          }}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
              <span style={{fontSize:"1.2rem"}}>{ag.icon}</span>
              <div style={{flex:1}}>
                <div style={{fontSize:".66rem",fontWeight:700,color:C.wh}}>{ag.title}</div>
                {ag.desc&&<div style={{fontSize:".5rem",color:C.dmr,marginTop:1}}>{ag.desc}</div>}
              </div>
              <button onClick={()=>startConf(ag)} style={{
                padding:"5px 12px",borderRadius:5,border:`1px solid ${C.ac2}`,
                background:"rgba(45,143,255,.15)",color:C.ac2,
                fontSize:".56rem",fontWeight:700,cursor:"pointer",fontFamily:"inherit",
              }}>Başla →</button>
            </div>
            <div style={{fontSize:".48rem",color:C.dmr}}>
              {ag.questions.length} soru · Taraftar etkisi var
            </div>
          </div>
        ))}
        <div style={{marginTop:10,padding:"8px 12px",borderRadius:7,
          background:"rgba(8,18,40,.7)",border:`1px solid rgba(77,166,255,0.1)`,fontSize:".52rem",color:C.dmr}}>
          💡 İpucu: Cevaplarınız taraftar mutluluğunu hafifçe etkiler.
        </div>
      </>}

      {/* Soru-cevap akışı */}
      {tab==="sorular"&&activeConf&&<>
        {!confDone&&<>
          <div style={{fontSize:".56rem",color:C.dim,fontWeight:600,marginBottom:10}}>
            {activeConf.icon} {activeConf.title}
          </div>
          {activeConf.questions.map((q,qi)=>(
            <div key={qi} style={{marginBottom:12,padding:"10px 12px",
              background:"rgba(26,110,216,.05)",border:`1px solid rgba(77,166,255,0.22)`,borderRadius:8}}>
              <div style={{fontSize:".62rem",color:C.wh,fontWeight:600,marginBottom:8}}>
                🎤 {q.q}
              </div>
              {q.opts.map((opt,oi)=>{
                const sel=answerSel[qi]===opt;
                return(
                  <button key={oi} onClick={()=>setAnswerSel(p=>({...p,[qi]:opt}))} style={{
                    display:"block",width:"100%",textAlign:"left",
                    padding:"8px 10px",marginBottom:4,
                    background:sel?"rgba(77,166,255,.25)":"rgba(26,110,216,.04)",
                    border:`1px solid ${sel?C.ac2:C.brd2}`,borderRadius:5,
                    cursor:"pointer",fontFamily:"inherit",transition:"all .15s",
                  }}>
                    <div style={{fontSize:".58rem",color:sel?C.wh:C.dim,lineHeight:1.4}}>
                      {opt.t}
                    </div>
                    {sel&&<div style={{marginTop:4,fontSize:".44rem",color:opt.fan>0?C.grn2:opt.fan<0?C.red2:C.dmr}}>
                      Taraftar: {opt.fan>0?"+"+opt.fan:opt.fan===0?"±0":opt.fan}
                    </div>}
                  </button>
                );
              })}
            </div>
          ))}
          <button onClick={finishConf} disabled={!allAnswered} style={{
            width:"100%",padding:"11px 0",
            background:allAnswered?`linear-gradient(135deg,#1a4fa8,${C.ac2})`:"rgba(100,120,160,.15)",
            border:`1px solid ${allAnswered?C.ac2:C.brd}`,
            color:allAnswered?"#fff":C.dmr,
            fontSize:".68rem",fontWeight:800,cursor:allAnswered?"pointer":"not-allowed",
            borderRadius:8,fontFamily:"inherit",letterSpacing:1,
          }}>
            {allAnswered?"📰 Basın Toplantısını Tamamla":"Tüm soruları cevaplayın"}
          </button>
        </>}

        {confDone&&confResult&&<>
          {/* Genel sonuç başlığı */}
          <div style={{textAlign:"center",padding:"14px 0 8px"}}>
            <div style={{fontSize:"2rem",marginBottom:5}}>
              {confResult.fan>=4?"🌟":confResult.fan>=2?"😊":confResult.fan>=0?"😐":"😤"}
            </div>
            <div style={{fontSize:".82rem",fontWeight:800,marginBottom:3,
              color:confResult.fan>=2?C.grn2:confResult.fan>=0?C.gd:C.red2}}>
              {confResult.outcome}
            </div>
          </div>

          {/* Cevap dökümü */}
          <div style={{marginBottom:10}}>
            <div style={{fontSize:".46rem",color:C.dmr,textTransform:"uppercase",letterSpacing:1.5,marginBottom:6}}>
              Seçimlerinizin Etkisi
            </div>
            {confResult.breakdown.map((b,i)=>(
              <div key={i} style={{
                padding:"8px 10px",marginBottom:5,
                background:"rgba(26,110,216,.05)",
                border:`1px solid rgba(77,166,255,0.1)`,borderRadius:6,
              }}>
                <div style={{fontSize:".5rem",color:C.dmr,marginBottom:4}}>🎤 {b.q}</div>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <div style={{flex:1,fontSize:".56rem",color:C.dim,fontStyle:"italic",lineHeight:1.3}}>
                    "{b.chosen}"
                  </div>
                  <div style={{display:"flex",gap:4,flexShrink:0}}>
                    <div style={{
                      minWidth:32,textAlign:"center",padding:"3px 7px",borderRadius:4,
                      background:b.fan>0?"rgba(46,204,113,.12)":b.fan<0?"rgba(192,57,43,.12)":"rgba(100,120,160,.08)",
                      border:`1px solid ${b.fan>0?"rgba(39,174,96,.25)":b.fan<0?"rgba(192,57,43,.25)":"rgba(100,120,160,.15)"}`,
                      fontSize:".52rem",fontWeight:800,
                      color:b.fan>0?C.grn2:b.fan<0?C.red2:C.dmr,
                    }}>
                      <div style={{fontSize:".38rem",color:C.dmr,marginBottom:1}}>TAR</div>
                      {b.fan>0?"+"+b.fan:b.fan===0?"±0":b.fan}
                    </div>
                    <div style={{
                      minWidth:32,textAlign:"center",padding:"3px 7px",borderRadius:4,
                      background:b.mgmt>0?"rgba(45,143,255,.12)":b.mgmt<0?"rgba(192,57,43,.12)":"rgba(100,120,160,.08)",
                      border:`1px solid ${b.mgmt>0?"rgba(45,143,255,.25)":b.mgmt<0?"rgba(192,57,43,.25)":"rgba(100,120,160,.15)"}`,
                      fontSize:".52rem",fontWeight:800,
                      color:b.mgmt>0?C.ac2:b.mgmt<0?C.red2:C.dmr,
                    }}>
                      <div style={{fontSize:".38rem",color:C.dmr,marginBottom:1}}>YÖN</div>
                      {b.mgmt>0?"+"+b.mgmt:b.mgmt===0?"±0":b.mgmt}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Sürpriz faktörü */}
          {confResult.surprise&&(
            <div style={{
              padding:"10px 12px",marginBottom:10,
              background:`${confResult.surprise.col}0f`,
              border:`1px solid ${confResult.surprise.col}44`,
              borderRadius:8,
              animation:"popIn .3s ease",
            }}>
              <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:4}}>
                <span style={{fontSize:"1.1rem"}}>{confResult.surprise.icon}</span>
                <span style={{fontSize:".6rem",fontWeight:800,color:confResult.surprise.col,letterSpacing:.5}}>
                  ✨ SÜRPRİZ: {confResult.surprise.label}
                </span>
                <span style={{
                  marginLeft:"auto",fontSize:".64rem",fontWeight:900,
                  color:confResult.surprise.fanBonus>0?C.grn2:C.red2,
                }}>
                  {confResult.surprise.fanBonus>0?"+":""}{confResult.surprise.fanBonus}
                </span>
              </div>
              <div style={{fontSize:".52rem",color:C.dim}}>{confResult.surprise.desc}</div>
            </div>
          )}

          {/* Toplam etki — iki sütun */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:10}}>
            {[
              {l:"Taraftar",v:confResult.fan,base:confResult.baseFan,surp:confResult.surprise?.fanBonus,
               col:confResult.fan>0?C.grn2:confResult.fan<0?C.red2:C.dmr,icon:"👥"},
              {l:"Yönetim",v:confResult.mgmt,base:confResult.baseMgmt,surp:confResult.surprise?.mgmtBonus,
               col:confResult.mgmt>0?C.ac2:confResult.mgmt<0?C.red2:C.dmr,icon:"🏢"},
            ].map(item=>(
              <div key={item.l} style={{
                padding:"10px 12px",
                background:"rgba(26,110,216,.06)",
                border:`1px solid ${item.v>0?"rgba(45,143,255,.3)":item.v<0?"rgba(192,57,43,.3)":C.brd}`,
                borderRadius:8,
              }}>
                <div style={{fontSize:".44rem",color:C.dmr,marginBottom:4}}>
                  {item.icon} {item.l.toUpperCase()} ETKİSİ
                </div>
                <div style={{fontSize:"1.3rem",fontWeight:900,color:item.col,lineHeight:1}}>
                  {item.v>0?"+":""}{item.v}
                </div>
                {item.surp!==undefined&&item.surp!==0&&(
                  <div style={{fontSize:".42rem",color:C.dmr,marginTop:3}}>
                    Seçim {item.base>0?"+":""}{item.base}
                    {" · "}Sürpriz {item.surp>0?"+":""}{item.surp}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Yönetim bloke uyarısı */}
          {confResult.mgmt<-2&&(
            <div style={{
              padding:"8px 12px",marginBottom:10,
              background:"rgba(192,57,43,.08)",
              border:"1px solid rgba(192,57,43,.3)",
              borderRadius:7,fontSize:".54rem",
            }}>
              <div style={{color:C.red2,fontWeight:700,marginBottom:2}}>
                ⚠️ Yönetim Memnuniyetsizliği
              </div>
              <div style={{color:C.dim,lineHeight:1.5}}>
                {(mgmt?.trust||60)<30
                  ?"Yönetim güveni kritik seviyeye düştü. Transfer bütçenizin %30'u geçici olarak bloke edildi."
                  :"Yönetim bu açıklamalardan rahatsız. Güven düşmeye devam ederse bütçe bloke edilebilir."}
              </div>
            </div>
          )}

          {/* Bütçe bloke aktifse göster */}
          {mgmt?.trust<30&&mgmt?.blockWeeksLeft>0&&(
            <div style={{
              padding:"8px 12px",marginBottom:10,
              background:"rgba(232,64,64,.1)",
              border:"1px solid rgba(192,57,43,.4)",
              borderRadius:7,fontSize:".54rem",
            }}>
              <div style={{color:C.red2,fontWeight:700,marginBottom:2}}>
                🔒 Transfer Bütçesi Bloke!
              </div>
              <div style={{color:C.dim}}>
                Bütçenin %30'u ({mgmt.blockWeeksLeft} maç daha) bloke. Yönetimle ilişkinizi düzeltin.
              </div>
            </div>
          )}

          <button onClick={()=>setTab("gundem")} style={{
            width:"100%",padding:"10px",
            background:`linear-gradient(135deg,#1a4fa8,${C.ac2})`,
            border:"none",color:"#fff",fontSize:".66rem",fontWeight:700,
            cursor:"pointer",borderRadius:7,fontFamily:"inherit",
          }}>← Gündeme Dön</button>
        </>}
      </>}

      {/* Arşiv */}
      {tab==="arsiv"&&<>
        {history.length===0&&<div style={{textAlign:"center",padding:"24px",color:C.dmr,fontSize:".62rem"}}>
          Henüz basın toplantısı yapılmadı.
        </div>}
        {history.map((h,i)=>(
          <div key={i} style={{display:"flex",gap:8,padding:"8px 10px",
            marginBottom:5,background:"rgba(8,18,40,.7)",
            border:`1px solid rgba(77,166,255,0.1)`,borderRadius:6}}>
            <div style={{flex:1}}>
              <div style={{fontSize:".6rem",color:C.wh,fontWeight:600}}>{h.title}</div>
              <div style={{fontSize:".5rem",color:C.dmr,marginTop:1}}>{h.outcome}
                {h.surprise&&<span style={{color:h.surprise.col,marginLeft:4}}>{h.surprise.icon} {h.surprise.label}</span>}
              </div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:".54rem",color:h.fan>0?C.grn2:h.fan<0?C.red2:C.dmr,fontWeight:700}}>
                Taraftar: {h.fan>0?"+"+h.fan:h.fan}
              </div>
              <div style={{fontSize:".46rem",color:C.dmr}}>{h.date}</div>
            </div>
          </div>
        ))}
      </>}
    </div>
  );
}
