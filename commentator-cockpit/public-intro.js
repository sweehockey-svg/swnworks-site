// Keep a readable league name visible until the external image has loaded.
document.querySelectorAll('[data-league-logo]').forEach((container) => {
  const image = container.querySelector('img');
  if (!image) return;
  const update = () => {
    container.classList.toggle('logo-loaded', image.complete && image.naturalWidth > 0);
  };
  image.addEventListener('load', update);
  image.addEventListener('error', update);
  update();
});
