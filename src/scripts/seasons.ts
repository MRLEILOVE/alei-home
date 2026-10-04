import { seasons, type SeasonId } from '../data/seasons';

const root = document.documentElement;
const buttons = document.querySelectorAll<HTMLButtonElement>('[data-season-choice]');
const autoButton = document.querySelector<HTMLButtonElement>('#season-auto');
const status = document.querySelector<HTMLElement>('#season-status');
const storageKey = 'alei-season';
const curtain = document.querySelector<HTMLElement>('#season-pull');
const pullHandle = document.querySelector<HTMLButtonElement>('#season-pull-handle');
const pullLabel = document.querySelector<HTMLElement>('#season-pull-label');
const pullHint = document.querySelector<HTMLElement>('#season-pull-hint');
const hintStorageKey = 'alei-season-pull-seen';

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
  const next = seasons[(seasons.findIndex((item) => item.id === id) + 1) % seasons.length];
  if (pullLabel) pullLabel.textContent = season.name;
  if (pullHandle) {
    pullHandle.setAttribute('aria-label', `拉动切换到${next.name}天`);
    pullHandle.title = `当前${season.name}天，向下拉动或点击，换到${next.name}天`;
  }
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', season.color);
  if (announce && status)
    status.textContent = `${automatic ? '随时节，当前为' : '已切换到'}${season.name}天`;
}

function selectManualSeason(id: SeasonId) {
  applySeason(id, false);
  try {
    localStorage.setItem(storageKey, id);
  } catch {
    /* 无存储权限时仍可切换。 */
  }
}

buttons.forEach((button) => {
  button.addEventListener('click', () => {
    selectManualSeason(button.dataset.seasonChoice as SeasonId);
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

if (curtain && pullHandle && pullHint) {
  curtain.hidden = false;
  try {
    pullHint.hidden = localStorage.getItem(hintStorageKey) === '1';
    localStorage.setItem(hintStorageKey, '1');
  } catch {
    pullHint.hidden = false;
  }

  const dismissHint = () => {
    pullHint.hidden = true;
  };
  document.querySelector('#season-pull-dismiss')?.addEventListener('click', dismissHint);

  const nextSeason = () => {
    const index = seasons.findIndex((season) => season.id === root.dataset.season);
    selectManualSeason(seasons[(index + 1) % seasons.length].id);
    dismissHint();
  };

  let pointerId: number | null = null;
  let startX = 0;
  let startY = 0;
  let distance = 0;
  let moved = false;
  let suppressPointerClick = false;
  const threshold = 44;

  const release = (cancelled: boolean) => {
    if (pointerId === null) return;
    const captured = pointerId;
    pointerId = null;
    const completed = !cancelled && distance >= threshold;
    suppressPointerClick = cancelled || moved;
    curtain.dataset.dragging = 'false';
    curtain.dataset.ready = 'false';
    curtain.style.setProperty('--pull-distance', '0px');
    if (pullHandle.hasPointerCapture(captured)) pullHandle.releasePointerCapture(captured);
    if (completed) nextSeason();
  };

  pullHandle.addEventListener('pointerdown', (event) => {
    if (!event.isPrimary || event.button !== 0) return;
    pointerId = event.pointerId;
    startX = event.clientX;
    startY = event.clientY;
    distance = 0;
    moved = false;
    suppressPointerClick = false;
    curtain.dataset.dragging = 'true';
    pullHandle.setPointerCapture(event.pointerId);
  });
  pullHandle.addEventListener('pointermove', (event) => {
    if (event.pointerId !== pointerId) return;
    distance = Math.max(0, event.clientY - startY);
    moved ||= Math.abs(event.clientY - startY) > 8 || Math.abs(event.clientX - startX) > 8;
    curtain.style.setProperty('--pull-distance', `${Math.min(distance * 0.75, 88)}px`);
    curtain.dataset.ready = String(distance >= threshold);
  });
  pullHandle.addEventListener('pointerup', (event) => {
    if (event.pointerId === pointerId) release(false);
  });
  pullHandle.addEventListener('pointercancel', (event) => {
    if (event.pointerId === pointerId) release(true);
  });
  pullHandle.addEventListener('lostpointercapture', (event) => {
    if (event.pointerId === pointerId) release(true);
  });
  window.addEventListener('blur', () => release(true));
  pullHandle.addEventListener('click', (event) => {
    // 拖动松手后的合成 click 不重复换季；键盘生成的 click 保持可用。
    if (suppressPointerClick && event.detail !== 0) {
      suppressPointerClick = false;
      return;
    }
    nextSeason();
  });
}
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && root.dataset.seasonMode === 'auto')
    applySeason(currentSeason(), true, false);
});
