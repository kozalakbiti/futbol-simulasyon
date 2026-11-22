function PageTakimAdi({clubName,setClubName}){
  const [val,setVal]=useState(clubName);
  const [saved,setSaved]=useState(false);

  // clubName prop dışarıdan değişirse local val'i güncelle
  useEffect(()=>{setVal(clubName);},[clubName]);

  const save=()=>{
    const trimmed=val.trim();
    if(!trimmed||trimmed===clubName) return;
    setClubName(trimmed);
    setSaved(true);
    setTimeout(()=>setSaved(false),2500);
  };
  return(
    <div style={{flex:1,overflowY:"auto",padding:20}}>
      <STitle>Takım Adı Düzenle</STitle>
      <div style={{background:C.card,borderRadius:10,padding:16,border:`1px solid rgba(77,166,255,0.22)`,marginBottom:12}}>
        <div style={{fontSize:".52rem",color:C.dmr,marginBottom:6}}>Mevcut Ad</div>
        <div style={{fontSize:"1.1rem",fontWeight:800,color:C.ac2,marginBottom:14}}>{clubName}</div>
        <div style={{fontSize:".52rem",color:C.dmr,marginBottom:6}}>Yeni Ad</div>
        <input
          value={val}
          onChange={e=>{setVal(e.target.value);setSaved(false);}}
          onKeyDown={e=>{if(e.key==="Enter") save();}}
          maxLength={30}
          placeholder="Takım adını girin..."
          style={{width:"100%",boxSizing:"border-box",padding:"10px 12px",
            background:"rgba(255,255,255,.04)",border:`1px solid ${val!==clubName?C.ac2:C.brd}`,
            borderRadius:7,color:C.wh,fontSize:".7rem",fontFamily:"inherit",outline:"none",
            marginBottom:10,transition:"border .2s"}}
        />
        <button onClick={save} disabled={!val.trim()||val.trim()===clubName} style={{width:"100%",padding:"10px 0",
          background:saved?"rgba(46,204,113,.2)":(!val.trim()||val.trim()===clubName)?"rgba(26,110,216,.06)":`linear-gradient(135deg,${C.ac},#0944a8)`,
          border:`1px solid ${saved?C.grn2:(!val.trim()||val.trim()===clubName)?C.brd:C.ac2}`,
          color:saved?C.grn2:(!val.trim()||val.trim()===clubName)?C.dmr:"#fff",
          fontSize:".65rem",fontWeight:700,cursor:(!val.trim()||val.trim()===clubName)?"not-allowed":"pointer",
          borderRadius:7,fontFamily:"inherit",transition:"all .3s"}}>
          {saved?"✓ Kaydedildi!":(!val.trim()||val.trim()===clubName)?"(değişiklik yok)":"Kaydet"}
        </button>
      </div>
      <div style={{fontSize:".52rem",color:C.dmr,lineHeight:1.6}}>
        Bu değişiklik header, stat bar ve tüm ekranlarda geçerli olacaktır.
      </div>
    </div>
  );
}
