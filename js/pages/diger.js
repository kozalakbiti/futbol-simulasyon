function PageDigerMenu({onSelect,currentPage}){
  return(
    <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",
      justifyContent:"center",gap:10,padding:20,overflowY:"auto"}}>
      <div style={{fontSize:".5rem",letterSpacing:3,color:"#7898c0",textTransform:"uppercase",marginBottom:4}}>
        Diğer Bölümler
      </div>
      {DIGER_PAGES.map(item=>(
        <button key={item.p} onClick={()=>onSelect(item.p)}
          style={{width:"100%",maxWidth:240,padding:"10px 16px",
            background:currentPage===item.p?"rgba(45,143,255,.25)":"rgba(11,21,37,.8)",
            border:`1px solid ${currentPage===item.p?"#4da6ff":"rgba(77,166,255,0.2)"}`,
            borderRadius:6,color:currentPage===item.p?"#4da6ff":"#f0f4ff",
            fontSize:".6rem",cursor:"pointer",display:"flex",alignItems:"center",gap:8,
            transition:"all .15s"}}>
          <span style={{fontSize:".75rem"}}>{item.i}</span>
          <span>{item.l}</span>
        </button>
      ))}
    </div>
  );
}
