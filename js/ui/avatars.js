// ─── MANAGER AVATAR SVG RENDERER ─────────────────────────────
const AVATAR_DEFS={
  m1:(
    <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" style={{width:"100%",height:"100%"}}>
      <circle cx="20" cy="16" r="11" fill="#FDBCB4"/>
      <rect x="12" y="4" width="16" height="9" rx="4" fill="#2c1a0e"/>
      <ellipse cx="20" cy="38" rx="14" ry="10" fill="#1a4fa0"/>
      <circle cx="16.5" cy="15" r="1.6" fill="#2a2a2a"/>
      <circle cx="23.5" cy="15" r="1.6" fill="#2a2a2a"/>
      <path d="M16.5 20.5 Q20 23.5 23.5 20.5" stroke="#c07060" strokeWidth="1.3" fill="none" strokeLinecap="round"/>
      <ellipse cx="14.5" cy="18" rx="1.5" ry="0.8" fill="#f0a090" opacity="0.5"/>
      <ellipse cx="25.5" cy="18" rx="1.5" ry="0.8" fill="#f0a090" opacity="0.5"/>
    </svg>
  ),
  m2:(
    <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" style={{width:"100%",height:"100%"}}>
      <circle cx="20" cy="16" r="11" fill="#c68642"/>
      <path d="M10 12 Q20 4 30 12 Q28 7 20 6 Q12 7 10 12Z" fill="#1a1200"/>
      <ellipse cx="20" cy="38" rx="14" ry="10" fill="#8b1a1a"/>
      <circle cx="16.5" cy="15" r="1.6" fill="#111"/>
      <circle cx="23.5" cy="15" r="1.6" fill="#111"/>
      <path d="M16.5 20.5 Q20 23.5 23.5 20.5" stroke="#a05535" strokeWidth="1.3" fill="none" strokeLinecap="round"/>
      <path d="M14 13 Q20 11 26 13" stroke="#111" strokeWidth="1.4" fill="none" strokeLinecap="round"/>
    </svg>
  ),
  m3:(
    <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" style={{width:"100%",height:"100%"}}>
      <circle cx="20" cy="16" r="11" fill="#FDEBD0"/>
      <ellipse cx="20" cy="7" rx="9" ry="5" fill="#d4a017"/>
      <ellipse cx="20" cy="38" rx="14" ry="10" fill="#2e7d32"/>
      <circle cx="16.5" cy="15" r="1.6" fill="#3a3a3a"/>
      <circle cx="23.5" cy="15" r="1.6" fill="#3a3a3a"/>
      <path d="M16.5 20.5 Q20 23.5 23.5 20.5" stroke="#c07060" strokeWidth="1.3" fill="none" strokeLinecap="round"/>
    </svg>
  ),
  m4:(
    <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" style={{width:"100%",height:"100%"}}>
      <circle cx="20" cy="16" r="11" fill="#6b3a2a"/>
      <path d="M10 11 Q20 4 30 11 Q25 6 20 5 Q15 6 10 11Z" fill="#1a0a00"/>
      <ellipse cx="20" cy="38" rx="14" ry="10" fill="#1a237e"/>
      <circle cx="16.5" cy="15" r="1.6" fill="#0a0a0a"/>
      <circle cx="23.5" cy="15" r="1.6" fill="#0a0a0a"/>
      <path d="M16.5 20.5 Q20 23.5 23.5 20.5" stroke="#7a3a1e" strokeWidth="1.3" fill="none" strokeLinecap="round"/>
    </svg>
  ),
  m5:(
    <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" style={{width:"100%",height:"100%"}}>
      <circle cx="20" cy="16" r="11" fill="#FDBCB4"/>
      <ellipse cx="20" cy="7" rx="8" ry="4" fill="#c49a3c"/>
      <ellipse cx="20" cy="38" rx="14" ry="10" fill="#546e7a"/>
      <circle cx="16.5" cy="15" r="1.6" fill="#2a2a2a"/>
      <circle cx="23.5" cy="15" r="1.6" fill="#2a2a2a"/>
      <rect x="13" y="12.5" width="6" height="4" rx="2" fill="none" stroke="#3a3a3a" strokeWidth="1"/>
      <rect x="21" y="12.5" width="6" height="4" rx="2" fill="none" stroke="#3a3a3a" strokeWidth="1"/>
      <line x1="19" y1="14.5" x2="21" y2="14.5" stroke="#3a3a3a" strokeWidth="1"/>
      <path d="M16.5 20.5 Q20 23.5 23.5 20.5" stroke="#c07060" strokeWidth="1.3" fill="none" strokeLinecap="round"/>
    </svg>
  ),
  m6:(
    <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" style={{width:"100%",height:"100%"}}>
      <circle cx="20" cy="16" r="11" fill="#D4956A"/>
      <ellipse cx="20" cy="38" rx="14" ry="10" fill="#333"/>
      <circle cx="16.5" cy="15" r="1.6" fill="#222"/>
      <circle cx="23.5" cy="15" r="1.6" fill="#222"/>
      <path d="M16.5 20.5 Q20 23.5 23.5 20.5" stroke="#a0654a" strokeWidth="1.3" fill="none" strokeLinecap="round"/>
      <ellipse cx="20" cy="7" rx="9" ry="3.5" fill="#c07848" opacity="0.3"/>
    </svg>
  ),
  f1:(
    <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" style={{width:"100%",height:"100%"}}>
      <path d="M11 14 Q11 4 20 4 Q29 4 29 14 Q29 22 20 24 Q11 22 11 14Z" fill="#a0522d"/>
      <path d="M11 13 Q9 20 11 28 Q14 26 14 22" fill="#a0522d"/>
      <path d="M29 13 Q31 20 29 28 Q26 26 26 22" fill="#a0522d"/>
      <circle cx="20" cy="15" r="10" fill="#FDBCB4"/>
      <ellipse cx="20" cy="38" rx="14" ry="10" fill="#880e4f"/>
      <circle cx="16.5" cy="14" r="1.5" fill="#333"/>
      <circle cx="23.5" cy="14" r="1.5" fill="#333"/>
      <path d="M16.5 19.5 Q20 23 23.5 19.5" stroke="#e07090" strokeWidth="1.4" fill="none" strokeLinecap="round"/>
      <ellipse cx="14.5" cy="17" rx="1.5" ry="0.8" fill="#f0a090" opacity="0.5"/>
      <ellipse cx="25.5" cy="17" rx="1.5" ry="0.8" fill="#f0a090" opacity="0.5"/>
    </svg>
  ),
  f2:(
    <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" style={{width:"100%",height:"100%"}}>
      <path d="M11 14 Q11 4 20 4 Q29 4 29 14 Q29 22 20 24 Q11 22 11 14Z" fill="#1a1200"/>
      <path d="M11 12 Q9 20 11 28 Q14 26 14 22" fill="#1a1200"/>
      <path d="M29 12 Q31 20 29 28 Q26 26 26 22" fill="#1a1200"/>
      <circle cx="20" cy="15" r="10" fill="#c68642"/>
      <ellipse cx="20" cy="38" rx="14" ry="10" fill="#4a148c"/>
      <circle cx="16.5" cy="14" r="1.5" fill="#111"/>
      <circle cx="23.5" cy="14" r="1.5" fill="#111"/>
      <path d="M16.5 19.5 Q20 23 23.5 19.5" stroke="#c07080" strokeWidth="1.4" fill="none" strokeLinecap="round"/>
    </svg>
  ),
  f3:(
    <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" style={{width:"100%",height:"100%"}}>
      <path d="M11 14 Q11 4 20 4 Q29 4 29 14 Q29 22 20 24 Q11 22 11 14Z" fill="#d4a017"/>
      <path d="M11 12 Q9 20 12 28 Q14 26 14 22" fill="#d4a017"/>
      <path d="M29 12 Q31 20 28 28 Q26 26 26 22" fill="#d4a017"/>
      <circle cx="20" cy="15" r="10" fill="#FDEBD0"/>
      <ellipse cx="20" cy="38" rx="14" ry="10" fill="#00695c"/>
      <circle cx="16.5" cy="14" r="1.5" fill="#3a3a3a"/>
      <circle cx="23.5" cy="14" r="1.5" fill="#3a3a3a"/>
      <path d="M16.5 19.5 Q20 23 23.5 19.5" stroke="#d07090" strokeWidth="1.4" fill="none" strokeLinecap="round"/>
      <ellipse cx="14.5" cy="17" rx="1.5" ry="0.8" fill="#f0a090" opacity="0.45"/>
      <ellipse cx="25.5" cy="17" rx="1.5" ry="0.8" fill="#f0a090" opacity="0.45"/>
    </svg>
  ),
  f4:(
    <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" style={{width:"100%",height:"100%"}}>
      <path d="M11 14 Q11 4 20 4 Q29 4 29 14 Q29 22 20 24 Q11 22 11 14Z" fill="#1a0a00"/>
      <path d="M11 12 Q9 20 12 28 Q14 26 14 22" fill="#1a0a00"/>
      <path d="M29 12 Q31 20 28 28 Q26 26 26 22" fill="#1a0a00"/>
      <circle cx="20" cy="15" r="10" fill="#6b3a2a"/>
      <ellipse cx="20" cy="38" rx="14" ry="10" fill="#b71c1c"/>
      <circle cx="16.5" cy="14" r="1.5" fill="#0a0a0a"/>
      <circle cx="23.5" cy="14" r="1.5" fill="#0a0a0a"/>
      <path d="M16.5 19.5 Q20 23 23.5 19.5" stroke="#8a4050" strokeWidth="1.4" fill="none" strokeLinecap="round"/>
    </svg>
  ),
  old1:(
    <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" style={{width:"100%",height:"100%"}}>
      <circle cx="20" cy="16" r="11" fill="#FDEBD0"/>
      <path d="M10 11 Q20 4 30 11" stroke="#b0b0b0" strokeWidth="4" fill="none" strokeLinecap="round"/>
      <path d="M12 14 Q20 11 28 14" stroke="#b0b0b0" strokeWidth="2" fill="none"/>
      <ellipse cx="20" cy="38" rx="14" ry="10" fill="#37474f"/>
      <circle cx="16.5" cy="15" r="1.6" fill="#3a3a3a"/>
      <circle cx="23.5" cy="15" r="1.6" fill="#3a3a3a"/>
      <path d="M16.5 20.5 Q20 23.5 23.5 20.5" stroke="#c07060" strokeWidth="1.3" fill="none" strokeLinecap="round"/>
      <path d="M15 22 Q20 24 25 22" stroke="#c0c0c0" strokeWidth="1.5" fill="none"/>
    </svg>
  ),
  old2:(
    <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" style={{width:"100%",height:"100%"}}>
      <path d="M11 14 Q11 4 20 4 Q29 4 29 14 Q29 22 20 24 Q11 22 11 14Z" fill="#d0d0d0"/>
      <path d="M11 12 Q9 20 12 28 Q14 26 14 22" fill="#d0d0d0"/>
      <path d="M29 12 Q31 20 28 28 Q26 26 26 22" fill="#d0d0d0"/>
      <circle cx="20" cy="15" r="10" fill="#D4956A"/>
      <ellipse cx="20" cy="38" rx="14" ry="10" fill="#4e342e"/>
      <circle cx="16.5" cy="14" r="1.5" fill="#222"/>
      <circle cx="23.5" cy="14" r="1.5" fill="#222"/>
      <path d="M16.5 19.5 Q20 23 23.5 19.5" stroke="#c07080" strokeWidth="1.4" fill="none" strokeLinecap="round"/>
      <path d="M15 21.5 Q20 23.5 25 21.5" stroke="#aaa" strokeWidth="1.3" fill="none"/>
    </svg>
  ),
};
