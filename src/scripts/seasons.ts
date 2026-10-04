import { seasons, type SeasonId } from '../data/seasons';

const root = document.documentElement;
const buttons = document.querySelectorAll<HTMLButtonElement>('[data-season-choice]');
const autoButton = document.querySelector<HTMLButtonElement>('#season-auto');
const status = document.querySelector<HTMLElement>('#season-status');
const storageKey = 'alei-season';

function currentSeason(): SeasonId {
  const month = Number(
    new Intl.DateTimeFormat('en', { timeZone: 'Asia/Taipei', month: 'numeric' }).format(new Date()),
  );
  return month >= 3 && month <= 5
    ? 'spring'
    : month >= 6 && month <= 8
      ? 'summer'
      : month >= 9 && month <= 11
        ? 'autumn'
        : 'winter';
}

function applySeason(id: SeasonId, automatic: boolean, announce = true) {
  const season = seasons.find((item) => item.id === id)!;
  root.dataset.season = id;
  root.dataset.seasonMode = automatic ? 'auto' : 'manual';
  buttons.forEach((button) =>
    button.setAttribute('aria-pressed', String(button.dataset.seasonChoice === id)),
  );
  autoButton?.setAttribute('aria-pressed', String(automatic));
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', season.color);
  if (announce && status)
    status.textContent = `${automatic ? '随时节，当前为' : '已切换到'}${season.name}天`;
}

buttons.forEach((button) => {
  button.addEventListener('click', () => {
    const id = button.dataset.seasonChoice as SeasonId;
    applySeason(id, false);
    try {
      localStorage.setItem(storageKey, id);
    } catch {
      /* 无存储权限时仍可切换。 */
    }
  });
});

autoButton?.addEventListener('click', () => {
  applySeason(currentSeason(), true);
  try {
    localStorage.removeItem(storageKey);
  } catch {
    /* 当前页面仍跟随季节。 */
  }
});

// 首屏主题由 head 内的短脚本设置，这里同步控件状态。
const initial = seasons.find((season) => season.id === root.dataset.season)?.id ?? currentSeason();
applySeason(initial, root.dataset.seasonMode !== 'manual', false);
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && root.dataset.seasonMode === 'auto')
    applySeason(currentSeason(), true, false);
});
