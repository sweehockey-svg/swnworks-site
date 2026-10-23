(() => {
  const enhance = () => {
    if (!location.hash.startsWith('#/band/')) return;
    const section = [...document.querySelectorAll('.detail-main .content-section')].find(el => el.querySelector('h2')?.textContent.trim() === 'Medlemmar');
    if (!section || section.querySelector('.band-network-cta')) return;
    const link = document.createElement('p');
    link.className = 'band-network-cta';
    const a = document.createElement('a');
    a.href = '#/natverket';
    a.textContent = 'Utforska musikernas kopplingar i släktträdet ↗';
    link.append(a);
    section.append(link);
  };
  new MutationObserver(enhance).observe(document.getElementById('app'), {childList:true});
  addEventListener('hashchange', enhance);
  enhance();
})();
