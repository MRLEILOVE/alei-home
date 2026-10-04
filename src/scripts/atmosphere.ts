export {};

const root = document.documentElement;
const control = document.querySelector<HTMLElement>('#weather-control');
const toggle = document.querySelector<HTMLButtonElement>('#weather-toggle');
const state = document.querySelector<HTMLElement>('#weather-state');
const status = document.querySelector<HTMLElement>('#weather-status');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let preferred = root.dataset.weatherPreference !== 'off';

function updateWeather(announce = false) {
  const enabled = preferred && !reducedMotion.matches;
  root.dataset.weather = enabled ? 'on' : 'off';
  if (toggle) {
    toggle.setAttribute('aria-pressed', String(enabled));
    toggle.setAttribute(
      'aria-label',
      reducedMotion.matches ? '系统已关闭环境动效' : enabled ? '关闭环境动效' : '开启环境动效',
    );
    toggle.disabled = reducedMotion.matches;
    toggle.title = reducedMotion.matches
      ? '已跟随系统的减少动态效果设置'
      : '控制云朵、雨雪、落叶和青草的动态效果';
  }
  if (state) state.textContent = reducedMotion.matches ? '静态' : enabled ? '开' : '关';
  if (announce && status)
    status.textContent = enabled ? '环境动效已开启' : '环境动效已关闭，保留四季背景';
}

toggle?.addEventListener('click', () => {
  preferred = !preferred;
  root.dataset.weatherPreference = preferred ? 'on' : 'off';
  try {
    localStorage.setItem('alei-weather', preferred ? 'on' : 'off');
  } catch {
    /* 当前页面仍可开关动效。 */
  }
  updateWeather(true);
});
reducedMotion.addEventListener('change', () => updateWeather());

function pauseHiddenPage() {
  root.dataset.pageHidden = String(document.hidden);
}
document.addEventListener('visibilitychange', pauseHiddenPage);
pauseHiddenPage();
updateWeather();
if (control) control.hidden = false;
