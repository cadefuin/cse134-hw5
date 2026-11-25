const KEY = 'theme';
const root = document.documentElement;
const group = document.querySelector('[data-theme-switch]');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function apply(theme) {
  if (theme === 'system') delete root.dataset.theme;
  else root.dataset.theme = theme;
}

function applyWithTransition(theme) {
  // Fallback: no API support, or the user asked for less motion.
  if (!document.startViewTransition || reducedMotion.matches) {
    apply(theme);
    return;
  }
  document.startViewTransition(() => apply(theme));
}

group.hidden = false;
group.querySelector(`[value="${root.dataset.theme ?? 'system'}"]`).checked = true;

group.addEventListener('change', (event) => {
  const theme = event.target.value;
  applyWithTransition(theme);
  try {
    if (theme === 'system') localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, theme);
  } catch {
    // Storage blocked: the choice applies now but is not remembered.
  }
});