/* Personal scratchpad: no broadcast state, messages, or network writes. */
(async () => {
  "use strict";
  const panel=document.getElementById("privateNotes");
  const role=document.body.dataset.commentaryRole,standalone=role==="obs-presenter";
  if(!panel||(!standalone&&role!=="presenter"))return;
  const fragment=location.hash.slice(1);
  if(!standalone){
    let invite;
    try{
      invite=JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(fragment),c=>c.charCodeAt(0))));
    }catch{return;}
    const slot=Number(invite?.slot??0),room=invite?.room,seat=invite?.publicKey?.x;
    if(![0,1].includes(slot)||typeof room!=="string"||!/^[a-f0-9-]{36}$/.test(room)||typeof seat!=="string"||!/^[-\w]{43}$/.test(seat)||
       invite?.privateKey?.kty!=="EC"||typeof invite.privateKey.d!=="string"||!/^[-\w]{43}$/.test(invite.privateKey.d))return;
  }
  const lang=document.documentElement.lang;
  const strings={
    sv:["Egna anteckningar","Bara i den här webbläsaren och för den här kommentatorslänken. Skickas inte till sändningen eller din kollega.","Skriv stödord, uttal eller sådant du vill ta upp i pausen…","Sparat på den här enheten","Kunde inte spara här. Anteckningarna försvinner när du laddar om."],
    en:["Private notes","Only in this browser and for this commentary link. Not sent to the broadcast or your colleague.","Add talking points, pronunciations or topics for the break…","Saved on this device","Could not save here. Notes will be lost when you reload."],
    fi:["Omat muistiinpanot","Vain tässä selaimessa ja tällä selostuslinkillä. Ei lähetetä katsojille eikä toiselle selostajalle.","Kirjoita tukisanoja, ääntämisohjeita tai tauon puheenaiheita…","Tallennettu tälle laitteelle","Tallennus epäonnistui. Muistiinpanot katoavat, kun lataat sivun uudelleen."],
    de:["Private Notizen","Nur in diesem Browser und für diesen Kommentatorenlink. Nicht in der Sendung oder für andere Kommentatoren sichtbar.","Stichpunkte, Aussprache oder Themen für die Pause…","Auf diesem Gerät gespeichert","Speichern nicht möglich. Beim Neuladen gehen die Notizen verloren."]
  };
  const localOnly={
    sv:"Sparas bara i den här webbläsaren. Anteckningarna skickas inte till OBS eller sändningen.",
    en:"Saved only in this browser. Notes are not sent to OBS or the broadcast.",
    fi:"Tallennetaan vain tähän selaimeen. Muistiinpanoja ei lähetetä OBS:ään eikä lähetykseen.",
    de:"Nur in diesem Browser gespeichert. Notizen werden nicht an OBS oder die Sendung übertragen."
  };
  const [title,description,placeholder,saved,unavailable]=strings[lang]||strings.sv;
  const input=panel.querySelector("textarea"),hint=panel.querySelector(".notes-hint"),status=panel.querySelector(".notes-status");
  panel.querySelector("summary").textContent=title;
  hint.textContent=standalone?(localOnly[lang]||localOnly.sv):description;
  input.setAttribute("aria-label",title);
  input.placeholder=placeholder;
  // Namespace by a one-way fingerprint; never persist the invitation/key.
  let key="swn-obs-presenter-notes:v1:"+lang;
  if(!standalone){
    try{
      const digest=new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(fragment)));
      key="swn-commentator-notes:v1:"+lang+":"+[...digest].map(x=>x.toString(16).padStart(2,"0")).join("");
    }catch{status.textContent=unavailable;panel.hidden=false;return;}
  }
  try{
    input.value=(localStorage.getItem(key)||"").slice(0,input.maxLength);
    if(input.value)status.textContent=saved;
  }catch{status.textContent=unavailable;}
  input.addEventListener("input",()=>{
    try{
      if(input.value)localStorage.setItem(key,input.value);
      else localStorage.removeItem(key);
      status.textContent=saved;
    }catch{status.textContent=unavailable;}
  });
  panel.hidden=false;
})();
