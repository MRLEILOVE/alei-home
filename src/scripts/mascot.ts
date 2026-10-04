const mascot = document.querySelector<HTMLElement>('#mascot');
const wake = document.querySelector<HTMLButtonElement>('#mascot-wake');
const character = document.querySelector<HTMLButtonElement>('#mascot-character');
const dialog = document.querySelector<HTMLElement>('#mascot-dialog');
const message = document.querySelector<HTMLElement>('#mascot-message');

if (mascot && wake && character && dialog && message) {
  const storageKey = 'alei-mascot-collapsed';
  let audioPlaying = false;
  let greetingTimer: ReturnType<typeof setTimeout> | undefined;
  let messageIndex = 0;
  const messages = [
    '嗨，我是小阿雷。代码写累了，就来这里歇一会儿。',
    '做一件事，就把一件事做好，别半途而废了。',
    '有些灵感不在屏幕里。抬头看看，也许就遇见了。',
    '今天也记得喝水。想读点什么，书架就在旁边。',
    '代码之外，也要给喜欢的歌和自己的生活留点时间。',
  ];

  function restingState() {
    mascot!.dataset.state = audioPlaying ? 'playing' : 'idle';
  }
  function showDialog(text?: string) {
    if (text) message!.textContent = text;
    dialog!.hidden = false;
    character!.setAttribute('aria-expanded', 'true');
  }
  function closeDialog() {
    dialog!.hidden = true;
    character!.setAttribute('aria-expanded', 'false');
  }
  function setCollapsed(collapsed: boolean, save = true) {
    mascot!.hidden = collapsed;
    wake!.hidden = !collapsed;
    closeDialog();
    if (save) {
      try {
        localStorage.setItem(storageKey, String(collapsed));
      } catch {
        /* 隐私模式下仍可操作。 */
      }
    }
  }
  let collapsed = window.matchMedia('(max-width: 600px)').matches;
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved !== null) collapsed = saved === 'true';
  } catch {
    /* 使用当前屏幕宽度作为默认值。 */
  }
  setCollapsed(collapsed, false);

  character.addEventListener('click', () => {
    if (!dialog.hidden) {
      closeDialog();
      return;
    }
    showDialog();
    mascot.dataset.state = 'hello';
    clearTimeout(greetingTimer);
    greetingTimer = setTimeout(restingState, 750);
  });
  wake.addEventListener('click', () => {
    setCollapsed(false);
    showDialog('我回来啦。想读一段文字，还是听一会儿故事？');
    character.focus();
  });
  document.querySelector('#mascot-hide')?.addEventListener('click', () => {
    setCollapsed(true);
    wake.focus();
  });
  document.querySelector('#mascot-close-dialog')?.addEventListener('click', () => {
    closeDialog();
    character.focus();
  });
  mascot.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !dialog.hidden) {
      closeDialog();
      character.focus();
    }
  });
  document.addEventListener('pointerdown', (event) => {
    if (
      event.target instanceof Node &&
      !mascot.contains(event.target) &&
      !wake.contains(event.target)
    )
      closeDialog();
  });
  mascot.querySelectorAll<HTMLButtonElement>('[data-mascot-action]').forEach((button) => {
    button.addEventListener('click', () => {
      const action = button.dataset.mascotAction;
      if (action === 'chat') {
        messageIndex = (messageIndex + 1) % messages.length;
        showDialog(messages[messageIndex]);
        mascot.dataset.state = 'thinking';
        clearTimeout(greetingTimer);
        greetingTimer = setTimeout(restingState, 900);
      } else {
        const target = document.querySelector<HTMLElement>(
          action === 'read' ? '#writing' : '#music',
        );
        target?.scrollIntoView({
          behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
          block: 'start',
        });
        showDialog(
          action === 'read'
            ? '这里有我的职场日记，也有生活里的小念头。'
            : document.querySelector('#songs-summary')
              ? '这几首都是常听的歌，挑一首吧。也可以听听有声书导读。'
              : '歌单正在准备，也可以先听听有声书导读。',
        );
        const control = target?.querySelector<HTMLElement>('a, button');
        control?.focus({ preventScroll: true });
      }
    });
  });
  document.addEventListener('alei:audio', (event) => {
    audioPlaying = (event as CustomEvent<{ playing: boolean }>).detail.playing;
    restingState();
    if (!dialog.hidden)
      message.textContent = audioPlaying
        ? '那就一起听一会儿吧，别急着赶路。'
        : '歇一会儿也很好，想听的时候再继续。';
  });
}
