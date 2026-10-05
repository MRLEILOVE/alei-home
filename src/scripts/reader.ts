import type { Contents, Location, NavItem } from 'epubjs';

async function initReader() {
  const root = document.querySelector<HTMLElement>('[data-reader]');
  if (!root) return;

  const viewer = document.querySelector<HTMLElement>('#reader-viewer')!;
  const status = document.querySelector<HTMLElement>('#reader-status')!;
  const position = document.querySelector<HTMLElement>('#reader-position')!;
  const toc = document.querySelector<HTMLSelectElement>('#reader-toc')!;
  const size = document.querySelector<HTMLSelectElement>('#reader-size')!;
  const previous = document.querySelector<HTMLButtonElement>('#reader-prev')!;
  const next = document.querySelector<HTMLButtonElement>('#reader-next')!;
  const positionKey = `alei-reader:${root.dataset.bookId}`;

  const readPreference = (key: string) => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  };
  const savePreference = (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* 无存储权限时仍可阅读。 */
    }
  };

  try {
    const [{ default: ePub }, response] = await Promise.all([
      import('epubjs'),
      fetch(root.dataset.bookUrl!, { signal: AbortSignal.timeout(30000) }),
    ]);
    if (!response.ok) throw new Error(`EPUB HTTP ${response.status}`);
    const book = ePub();
    await book.open(await response.arrayBuffer(), 'binary');
    await Promise.all([book.opened, book.ready]);

    const rendition = book.renderTo(viewer, {
      width: '100%',
      height: '100%',
      flow: 'paginated',
      spread: 'none',
      allowScriptedContent: false,
    });
    const colors = getComputedStyle(document.documentElement);
    rendition.themes.default({
      body: {
        color: `${colors.getPropertyValue('--ink')} !important`,
        background: `${colors.getPropertyValue('--paper')} !important`,
        'font-family': `${colors.getPropertyValue('--serif')} !important`,
        'line-height': '1.85 !important',
        'overflow-wrap': 'anywhere',
      },
      'p, li, blockquote': { 'font-size': '1em !important', 'line-height': '1.85 !important' },
      'img, svg': { 'max-width': '100% !important', 'object-fit': 'contain' },
      a: { color: `${colors.getPropertyValue('--accent')} !important` },
    });
    const savedSize = readPreference('alei-reader-font');
    if (savedSize && ['16', '18', '22', '26'].includes(savedSize)) size.value = savedSize;
    rendition.themes.fontSize(`${size.value}px`);

    function addChapters(items: NavItem[], depth = 0) {
      for (const item of items) {
        const option = document.createElement('option');
        option.value = item.href;
        option.textContent = `${'　'.repeat(depth)}${item.label.trim()}`;
        toc.append(option);
        if (item.subitems) addChapters(item.subitems, depth + 1);
      }
    }
    addChapters(book.navigation.toc);

    let busy = false;
    let location: Location | undefined;
    const updateButtons = () => {
      previous.disabled = busy || !location || location.atStart;
      next.disabled = busy || !location || location.atEnd;
      toc.disabled = busy;
      size.disabled = busy;
    };
    rendition.on('relocated', (current: Location) => {
      location = current;
      const { page, total } = current.start.displayed;
      position.textContent = current.atEnd ? '已读到最后一页' : `本节 ${page} / ${total} 页`;
      savePreference(positionKey, current.start.cfi);
      updateButtons();
    });

    async function navigate(action: () => Promise<void>) {
      if (busy) return;
      busy = true;
      updateButtons();
      try {
        await action();
        status.hidden = true;
      } catch (error) {
        console.error('阅读位置切换失败', error);
        status.textContent = '这一页未能打开，请重试或从目录选择章节。';
        status.hidden = false;
      } finally {
        busy = false;
        updateButtons();
      }
    }

    const turnPage = (forward: boolean) => {
      if (forward ? next.disabled : previous.disabled) return;
      void navigate(() => (forward ? rendition.next() : rendition.prev()));
    };
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        target?.closest('input, select, textarea, button, [contenteditable="true"]')
      )
        return;
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        event.preventDefault();
        turnPage(event.key === 'ArrowRight');
      }
    };
    document.addEventListener('keydown', onKey);
    rendition.on('keydown', onKey);
    rendition.hooks.content.register((contents: Contents) => {
      contents.document.documentElement.lang = 'zh-CN';
      const frame = contents.window.frameElement;
      frame?.setAttribute('title', `${document.querySelector('h1')?.textContent} 正文`);
    });
    previous.addEventListener('click', () => turnPage(false));
    next.addEventListener('click', () => turnPage(true));
    toc.addEventListener('change', () => {
      if (toc.value) void navigate(() => rendition.display(toc.value));
    });
    size.addEventListener('change', () => {
      const cfi = location?.start.cfi;
      savePreference('alei-reader-font', size.value);
      rendition.themes.fontSize(`${size.value}px`);
      void navigate(() => rendition.display(cfi));
    });

    // 先确定阅读区域高度，避免隐藏加载提示后改变分页尺寸。
    status.hidden = true;
    const savedPosition = readPreference(positionKey);
    try {
      await rendition.display(savedPosition || undefined);
    } catch (error) {
      if (!savedPosition) throw error;
      await rendition.display();
    }
    viewer.setAttribute('aria-busy', 'false');
    updateButtons();

    let resizeFrame = 0;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(() => {
        rendition.resize(viewer.clientWidth, viewer.clientHeight);
      });
    });
    observer.observe(viewer);
    window.addEventListener('pagehide', (event) => {
      if (event.persisted) return;
      observer.disconnect();
      cancelAnimationFrame(resizeFrame);
      document.removeEventListener('keydown', onKey);
      book.destroy();
    });
  } catch (error) {
    console.error('电子书加载失败', error);
    viewer.setAttribute('aria-busy', 'false');
    status.hidden = false;
    status.textContent = '暂时未能打开这本书。可以刷新重试，或点击上方“下载 EPUB”用阅读器打开。';
    position.textContent = '书页暂未打开';
  }
}

void initReader();
