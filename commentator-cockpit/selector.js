(() => {
  "use strict";

  const sb=window.supabase;
  if(!sb) return;

  const client=sb.createClient(
    "https://pqaymcvlwsruxvekvvtl.supabase.co",
    "sb_publishable_XARUftv6YJUELo4jc8NIsA_mee9YHJV",
    {auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}
  );

  const state={user:null,accessRows:[],busy:false,message:"",messageType:""};
  const accountButton=document.getElementById("selectorAccountButton");
  const panel=document.getElementById("selectorAuthPanel");
  const backdrop=document.getElementById("selectorAuthBackdrop");
  const closeButton=document.getElementById("selectorAuthClose");
  const body=document.getElementById("selectorAuthBody");
  const title=document.getElementById("selectorAuthTitle");

  const esc=(value)=>String(value??"")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");

  function leagueLabel(key){
    if(key==="hockeyettan") return "Hockeyettan";
    if(key==="hockeytvaan") return "Hockeytvåan";
    if(key==="suomi-sarja") return "Suomi-sarja";
    return key||"Liga";
  }

  function activeRows(){
    return state.accessRows.filter((row)=>row.active);
  }

  function globalAdmin(){
    return activeRows().find((row)=>row.role==="admin"&&!row.team_id&&!row.league_key)||null;
  }

  function displayName(){
    return activeRows().find((row)=>row.display_name)?.display_name ||
      state.user?.email?.split("@")[0] ||
      "Konto";
  }

  function accessSummary(){
    if(globalAdmin()) return "GLOBAL ADMIN";
    const rows=activeRows();
    if(!rows.length) return "EJ GODKÄND";
    const leagues=new Set(rows.map((row)=>row.league_key).filter(Boolean));
    const teamCount=rows.filter((row)=>row.team_id).length;
    const leagueCount=rows.filter((row)=>!row.team_id&&row.league_key).length;
    if(leagueCount&&teamCount) return leagueCount+" LIGA + "+teamCount+" LAG";
    if(leagueCount) return leagueCount===1?"LIGAACCESS":leagueCount+" LIGOR";
    if(teamCount) return teamCount===1?"1 LAG":teamCount+" LAG";
    return leagues.size?leagues.size+" ÅTKOMSTER":"KONTO";
  }

  function cardAccessLabel(leagueKey){
    if(!state.user) return "TILLGÄNGLIG · PRIVAT BETA";
    if(globalAdmin()) return "ADMIN · ALLA LAG";
    const rows=activeRows().filter((row)=>row.league_key===leagueKey);
    if(rows.some((row)=>!row.team_id)) return "DIN ÅTKOMST · HELA LIGAN";
    const teamCount=rows.filter((row)=>row.team_id).length;
    if(teamCount) return "DIN ÅTKOMST · "+teamCount+" "+(teamCount===1?"LAG":"LAG");
    return "TILLGÄNGLIG · KONTO KRÄVS";
  }

  function updateCards(){
    document.querySelectorAll("[data-league-key]").forEach((card)=>{
      const stateNode=card.querySelector("[data-card-state]");
      if(!stateNode) return;
      const label=cardAccessLabel(card.dataset.leagueKey);
      stateNode.textContent=label;
      card.classList.toggle("has-access",/DIN ÅTKOMST|ADMIN/.test(label));
    });
  }

  function updateAccountButton(){
    if(!accountButton) return;
    if(state.user){
      accountButton.classList.add("signed-in");
      accountButton.innerHTML=
        '<span class="selector-account-dot"></span>'+
        '<span><strong>'+esc(displayName())+'</strong><small>'+esc(accessSummary())+'</small></span>';
    }else{
      accountButton.classList.remove("signed-in");
      accountButton.innerHTML=
        '<span class="selector-account-dot"></span>'+
        '<span><strong>LOGGA IN</strong><small>KONTO</small></span>';
    }
    updateCards();
  }

  function renderPanel(){
    if(!body||!title) return;
    if(state.user){
      title.textContent="Ditt konto";
      const rows=activeRows();
      const accessHtml=globalAdmin()
        ? '<div class="selector-access-row"><strong>Global admin</strong><span>Alla ligor och lag</span></div>'
        : rows.length
          ? rows.map((row)=>{
              const label=row.team_id?"Lagaccess":"Ligaaccess";
              return '<div class="selector-access-row"><strong>'+esc(leagueLabel(row.league_key))+'</strong><span>'+esc(label)+'</span></div>';
            }).join("")
          : '<div class="selector-access-empty">Kontot är inloggat men har ännu ingen cockpitbehörighet.</div>';

      body.innerHTML=
        '<article class="selector-account-card"><span>INLOGGAD</span><strong>'+esc(displayName())+'</strong><small>'+esc(state.user.email||"")+'</small></article>'+
        '<div class="selector-access-list">'+accessHtml+'</div>'+
        '<div class="selector-auth-actions"><button type="button" id="selectorSignOut">LOGGA UT</button></div>';

      document.getElementById("selectorSignOut")?.addEventListener("click",async()=>{
        await client.auth.signOut();
      });
      return;
    }

    title.textContent="Logga in";
    body.innerHTML=
      '<p class="selector-auth-intro">Logga in med samma e-postadress som är kopplad till din liga- eller lagbehörighet.</p>'+
      '<form class="selector-auth-form" id="selectorAuthForm">'+
        '<label><span>E-POST</span><input id="selectorAuthEmail" type="email" required autocomplete="email" placeholder="namn@example.com"></label>'+
        '<button type="submit" '+(state.busy?"disabled":"")+'>'+(state.busy?"SKICKAR…":"SKICKA INLOGGNINGSLÄNK")+'</button>'+
      '</form>'+
      (state.message?'<div class="selector-auth-message '+esc(state.messageType)+'">'+esc(state.message)+'</div>':"")+
      '<div class="selector-auth-note"><strong>Privat beta</strong><span>Inloggning ger inte automatiskt åtkomst. Kontot måste vara godkänt för en liga eller ett lag.</span></div>';

    document.getElementById("selectorAuthForm")?.addEventListener("submit",async(event)=>{
      event.preventDefault();
      if(state.busy) return;
      const email=String(document.getElementById("selectorAuthEmail")?.value||"").trim();
      if(!email) return;
      state.busy=true;
      state.message="";
      renderPanel();
      const redirectUrl=window.location.origin+window.location.pathname;
      const {error}=await client.auth.signInWithOtp({
        email,
        options:{emailRedirectTo:redirectUrl,shouldCreateUser:true}
      });
      state.busy=false;
      state.messageType=error?"error":"success";
      state.message=error
        ? "Kunde inte skicka länken: "+error.message
        : "Inloggningslänk skickad till "+email+".";
      renderPanel();
    });
  }

  function openPanel(){
    renderPanel();
    panel?.classList.add("open");
    panel?.setAttribute("aria-hidden","false");
    if(backdrop){
      backdrop.hidden=false;
      requestAnimationFrame(()=>backdrop.classList.add("open"));
    }
    document.body.classList.add("selector-auth-open");
  }

  function closePanel(){
    panel?.classList.remove("open");
    panel?.setAttribute("aria-hidden","true");
    backdrop?.classList.remove("open");
    document.body.classList.remove("selector-auth-open");
    if(backdrop) window.setTimeout(()=>{backdrop.hidden=true;},180);
  }

  async function loadAccess(){
    state.accessRows=[];
    if(!state.user?.email) return;
    const {data,error}=await client.from("commentator_access")
      .select("id,email,role,team_id,league_key,active,display_name")
      .order("role",{ascending:true});
    if(error){
      console.error("Selector access lookup failed",error);
      return;
    }
    state.accessRows=data||[];
  }

  async function applySession(session){
    state.user=session?.user||null;
    await loadAccess();
    updateAccountButton();
    if(panel?.classList.contains("open")) renderPanel();
  }

  accountButton?.addEventListener("click",openPanel);
  closeButton?.addEventListener("click",closePanel);
  backdrop?.addEventListener("click",closePanel);
  document.addEventListener("keydown",(event)=>{
    if(event.key==="Escape"&&panel?.classList.contains("open")) closePanel();
  });

  client.auth.onAuthStateChange((_event,session)=>{
    applySession(session).catch(console.error);
  });

  client.auth.getSession().then(({data})=>applySession(data.session)).catch(console.error);
})();