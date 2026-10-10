/* Shared admin gate. Studio code starts only after server-verified access. */
(() => {
  'use strict';
  const cfg = window.EHOCKEY_CONFIG || {};
  const languageStudio = /^\/broadcast-studio\/(SV|en|fi|de)\/$/i.test(location.pathname);
  const params = new URLSearchParams(location.search);
  const output = languageStudio && params.get('obs') === '1';
  let client, started = false, checking = false;
  function unlock() {
    document.documentElement.removeAttribute('data-studio-locked');
    document.getElementById('studio-login')?.remove();
  }
  async function startScripts() {
    if (started) return;
    started = true;
    for (const placeholder of document.querySelectorAll('script[data-studio-src]')) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = placeholder.dataset.studioSrc;
        script.async = false;
        if (placeholder.hasAttribute('charset')) script.charset = placeholder.getAttribute('charset');
        script.onload = resolve;
        script.onerror = () => reject(new Error('Kunde inte ladda studion. Ladda om sidan.'));
        placeholder.replaceWith(script);
      });
    }
    unlock();
  }
  const panel = document.createElement('section');
  panel.id = 'studio-login';
  panel.innerHTML = '<div class="studio-login-card"><div class="studio-login-brand">SWNWORKS · ADMIN</div><h1>Logga in i SWNWORKS</h1><p>Endast ditt admin-konto har tillgång till SWNWORKS adminverktyg.</p><form><label>Inloggningsnamn<input name="username" value="eSwahn" autocomplete="username" required spellcheck="false"></label><label>Lösenord<input name="password" type="password" autocomplete="current-password" required></label><button type="submit">Logga in</button></form><p id="studio-login-status" role="status" aria-live="polite">Kontrollerar inloggningen…</p><a href="/">Till SWNWORKS</a></div>';
  document.body.appendChild(panel);
  const status = panel.querySelector('#studio-login-status');
  const submit = panel.querySelector('button');
  function message(text) { status.textContent = text; }
  async function check() {
    if (checking) return false;
    checking = true;
    try {
      const { data, error } = await client.auth.getSession();
      if (error) throw error;
      if (!data.session) { message('Använd samma admininloggning som på Svensk eHockey.'); return false; }
      const verified = await client.auth.getUser();
      if (verified.error || !verified.data.user) throw new Error('Inloggningen kunde inte verifieras. Logga in igen.');
      const access = await client.rpc('swn_studio_admin_access');
      if (access.error) throw new Error('Kunde inte kontrollera adminbehörigheten. Försök igen.');
      if (access.data !== true) { message('Det här kontot har inte tillgång till studiorna. Logga in med ditt admin-konto.'); return false; }
      await startScripts();
      const bar = document.createElement('div');
      bar.id = 'studio-session';
      bar.innerHTML = '<span>ADMIN · eSwahn</span><button type="button">Logga ut</button>';
      bar.querySelector('button').onclick = async () => {
        const result = await client.auth.signOut({ scope: 'local' });
        if (!result.error) location.reload();
      };
      document.body.appendChild(bar);
      return true;
    } catch (error) {
      message(error.message || 'Kunde inte kontrollera inloggningen. Försök igen.');
      return false;
    } finally { checking = false; }
  }
  panel.querySelector('form').onsubmit = async event => {
    event.preventDefault();
    if (!client) return;
    const username = panel.querySelector('[name="username"]').value.trim().toLowerCase();
    const password = panel.querySelector('[name="password"]').value;
    if (!/^[a-z0-9._-]{2,40}$/.test(username)) { message('Skriv ett giltigt inloggningsnamn.'); return; }
    submit.disabled = true;
    message('Loggar in…');
    try {
      const result = await client.auth.signInWithPassword({ email: username + '@writers.svenskehockey.se', password });
      panel.querySelector('[name="password"]').value = '';
      if (result.error) throw new Error(/invalid login credentials/i.test(result.error.message) ? 'Fel inloggningsnamn eller lösenord.' : result.error.message);
      await check();
    } catch (error) { message(error.message || 'Inloggningen misslyckades.'); }
    finally { submit.disabled = false; }
  };
  async function boot() {
    if (output) {
      window.SWNStudioAccess = Object.freeze({ output: true, session: async () => null });
      await startScripts();
      return;
    }
    if (!window.supabase?.createClient || !cfg.supabaseUrl || !cfg.supabasePublishableKey) throw new Error('Inloggningen kunde inte starta. Ladda om sidan.');
    client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabasePublishableKey);
    window.SWNStudioAccess = Object.freeze({
      output: false,
      session: async () => {
        const result = await client.auth.getSession();
        if (result.error || !result.data.session) throw new Error('Admininloggning krävs.');
        return result.data.session;
      }
    });
    client.auth.onAuthStateChange((event, session) => {
      if (started && (!session || event === 'USER_UPDATED')) window.setTimeout(() => location.reload(), 0);
    });
    await check();
  }
  boot().catch(error => message(error.message));
})();
