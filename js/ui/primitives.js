// ═══════════════════════════════════════════════════════════════
function PosTag({pos,small}){
  const t=posC(pos);
  return <span style={{fontSize:small?".44rem":".5rem",fontWeight:700,padding:"1px 4px",borderRadius:2,
    background:t.bg,color:t.c,border:`1px solid ${t.b}`,minWidth:24,textAlign:"center",
    flexShrink:0,whiteSpace:"nowrap"}}>{pos}</span>;
}
function STitle({children,extra}){
  return <div style={{fontSize:".48rem",letterSpacing:2.5,color:"rgba(77,168,255,.55)",textTransform:"uppercase",
    marginBottom:8,paddingBottom:5,
    borderBottom:"1px solid rgba(77,168,255,0.12)",
    display:"flex",justifyContent:"space-between",alignItems:"center",fontWeight:700}}>
    <span style={{display:"flex",alignItems:"center",gap:5}}>
      <span style={{width:2,height:10,background:C.ac2,borderRadius:1,display:"inline-block"}}/>
      {children}
    </span>
    {extra&&<span style={{color:C.ac2,fontSize:".5rem",letterSpacing:.5,fontWeight:600,
      background:"rgba(45,143,255,.1)",padding:"1px 6px",borderRadius:3,
      border:"1px solid rgba(45,143,255,.2)"}}>{extra}</span>}
  </div>;
}
function Chip({color="blue",children,small}){
  const s={blue:{bg:"rgba(45,143,255,.14)",c:C.ac2,b:"rgba(45,143,255,.3)"},
    green:{bg:"rgba(46,204,113,.14)",c:C.grn2,b:"rgba(46,204,113,.3)"},
    gold:{bg:"rgba(240,192,64,.13)",c:C.gd,b:"rgba(240,192,64,.28)"},
    red:{bg:"rgba(232,64,64,.14)",c:C.red2,b:"rgba(232,64,64,.3)"},
    purple:{bg:"rgba(196,122,255,.13)",c:C.pur2,b:"rgba(196,122,255,.28)"},
    gray:{bg:"rgba(110,132,163,.1)",c:C.dim,b:"rgba(110,132,163,.2)"}};
  const st=s[color]||s.blue;
  return <span style={{fontSize:small?".43rem":".48rem",fontWeight:700,padding:small?"1px 4px":"2px 6px",
    borderRadius:4,background:st.bg,color:st.c,border:`1px solid ${st.b}`,whiteSpace:"nowrap",
    letterSpacing:.3}}>{children}</span>;
}
function Btn({onClick,children,color="blue",style}){
  const s={blue:{bg:"rgba(45,143,255,.18)",c:C.ac2,b:"rgba(45,143,255,.35)",hbg:"rgba(45,143,255,.28)"},
    green:{bg:"rgba(46,204,113,.18)",c:C.grn2,b:"rgba(46,204,113,.35)"},
    gold:{bg:"rgba(240,192,64,.16)",c:C.gd,b:"rgba(240,192,64,.3)"},
    red:{bg:"rgba(232,64,64,.16)",c:C.red2,b:"rgba(232,64,64,.3)"}};
  const st=s[color]||s.blue;
  return <button onClick={onClick} style={{background:st.bg,border:`1px solid ${st.b}`,color:st.c,
    fontSize:".58rem",padding:"4px 10px",cursor:"pointer",borderRadius:5,fontFamily:"inherit",
    fontWeight:600,letterSpacing:.3,...(style||{})}}>{children}</button>;
}
function Modal({title,onClose,children,wide}){
  return <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.88)",zIndex:300,
    display:"flex",alignItems:"center",justifyContent:"center",padding:16,backdropFilter:"blur(4px)"}}>
    <div style={{width:wide?"min(95vw,600px)":"min(92vw,420px)",background:C.card2,
      border:"1px solid rgba(45,143,255,0.2)",borderRadius:12,overflow:"hidden",
      maxHeight:"90vh",display:"flex",flexDirection:"column",
      boxShadow:"0 20px 60px rgba(0,0,0,0.8)"}}>
      <div style={{padding:"12px 16px",borderBottom:`1px solid rgba(77,166,255,0.22)`,
        display:"flex",justifyContent:"space-between",alignItems:"center",
        background:"linear-gradient(135deg,#0c1e3a,#071020)",flexShrink:0}}>
        <span style={{fontSize:".68rem",letterSpacing:2,color:C.wh,textTransform:"uppercase",fontWeight:700}}>{title}</span>
        <button onClick={onClose} style={{background:"rgba(255,255,255,.06)",border:`1px solid rgba(77,166,255,0.22)`,
          color:C.dim,cursor:"pointer",fontSize:".9rem",lineHeight:1,borderRadius:4,
          width:22,height:22,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
      </div>
      <div style={{overflowY:"auto",padding:14,flex:1}}>{children}</div>
    </div>
  </div>;
}
function StatBar({val,max=100,color=C.ac2}){
  return <div style={{flex:1,height:3,background:"rgba(100,140,220,.1)",borderRadius:2,overflow:"hidden"}}>
    <div style={{height:"100%",width:`${(val/max)*100}%`,background:color,borderRadius:2}}/>
  </div>;
}
