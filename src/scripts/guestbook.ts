import { seasons } from '../data/seasons';

const container = document.querySelector<HTMLElement>('[data-giscus-config]');

if (container) {
  const root = document.documentElement;
  const origin = 'https://giscus.app';
  const client = document.createElement('script');
  Object.assign(client.dataset, JSON.parse(container.dataset.giscusConfig!));
  client.src = `${origin}/client.js`;
  client.crossOrigin = 'anonymous';
  client.async = true;

  const themeUrl = () => {
    const season = seasons.find((item) => item.id === root.dataset.season)?.id ?? 'autumn';
    return new URL(`${container.dataset.themeBase}giscus-${season}.css`, location.href).href;
  };

  const syncTheme = () => {
    const theme = themeUrl();
    client.dataset.theme = theme;
    // 只更新主题，不重建 iframe，保留登录状态、回复和未提交的文字。
    container
      .querySelector<HTMLIFrameElement>('iframe.giscus-frame')
      ?.contentWindow?.postMessage({ giscus: { setConfig: { theme } } }, origin);
  };

  // 先设置首屏季节；懒加载期间发生换季时，在 iframe 就绪后补发最新主题。
  syncTheme();
  container.addEventListener(
    'load',
    (event) => {
      if (event.target instanceof HTMLIFrameElement) syncTheme();
    },
    true,
  );
  new MutationObserver(syncTheme).observe(root, {
    attributes: true,
    attributeFilter: ['data-season'],
  });
  container.append(client);
}
