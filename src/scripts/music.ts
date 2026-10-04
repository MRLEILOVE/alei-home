import type APlayer from 'aplayer';
import type { Track } from '../data/music';

const root = document.querySelector<HTMLElement>('#music');
const container = document.querySelector<HTMLElement>('#audio-player');
const status = document.querySelector<HTMLElement>('#audio-status');
const fallback = document.querySelector<HTMLAnchorElement>('#audio-fallback');
const recordCover = document.querySelector<HTMLImageElement>('#record-cover');

if (root && container && status && fallback) {
  const collections = JSON.parse(root.dataset.tracks || '{}') as Record<
    'songs' | 'stories',
    Track[]
  >;
  const tabs = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-audio-tab]'));
  let player: APlayer | undefined;
  let activeCollection: 'songs' | 'stories' = 'songs';
  let requestId = 0;
  let controlObserver: MutationObserver | undefined;

  function publishState(playing: boolean) {
    root!.dataset.playing = String(playing);
    document.dispatchEvent(new CustomEvent('alei:audio', { detail: { playing } }));
  }

  function updateSongCover(track: Track | undefined) {
    if (!recordCover || !track?.cover) return;
    recordCover.src = track.cover;
    recordCover.alt = `《${track.name}》唱片封面`;
  }

  // APlayer 的图片播放按钮原本使用 div；补齐键盘操作与可访问名称。
  function enhanceControls() {
    if (!container) return;
    const imageButton = container.querySelector<HTMLElement>('.aplayer-button');
    if (imageButton) {
      imageButton.setAttribute('role', 'button');
      imageButton.tabIndex = 0;
      imageButton.setAttribute('aria-label', player?.audio.paused ? '播放音频' : '暂停音频');
      if (!imageButton.dataset.keyboardReady) {
        imageButton.dataset.keyboardReady = 'true';
        imageButton.addEventListener('keydown', (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            imageButton.click();
          }
        });
      }
    }
    const labels: Record<string, string> = {
      'aplayer-icon-play': '播放音频',
      'aplayer-icon-pause': '暂停音频',
      'aplayer-icon-back': '上一首',
      'aplayer-icon-forward': '下一首',
      'aplayer-icon-volume-down': '调整音量',
      'aplayer-icon-volume-off': '取消静音',
      'aplayer-icon-volume-up': '调整音量',
      'aplayer-icon-menu': '展开或收起播放列表',
      'aplayer-icon-order': '切换播放顺序',
      'aplayer-icon-loop': '切换循环模式',
      'aplayer-icon-lrc': '显示或隐藏歌词',
    };
    for (const button of container.querySelectorAll<HTMLButtonElement>('button')) {
      const entry = Object.entries(labels).find(([className]) =>
        button.classList.contains(className),
      );
      if (entry) button.setAttribute('aria-label', entry[1]);
      button.type = 'button';
    }
    container.querySelectorAll<HTMLElement>('.aplayer-list li').forEach((item, index) => {
      const track = collections[activeCollection][index];
      if (!track) return;
      const current = item.classList.contains('aplayer-list-light');
      item.setAttribute('role', 'button');
      item.tabIndex = 0;
      item.setAttribute('aria-current', String(current));
      item.setAttribute(
        'aria-label',
        `${current && !player?.audio.paused ? '暂停' : '播放'}《${track.name}》`,
      );
      if (!item.dataset.keyboardReady) {
        item.dataset.keyboardReady = 'true';
        item.addEventListener('keydown', (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            item.click();
          }
        });
      }
    });
    const progress = container.querySelector<HTMLElement>('.aplayer-bar-wrap');
    if (progress) {
      progress.setAttribute('role', 'slider');
      progress.setAttribute('aria-label', '播放进度');
      progress.setAttribute('aria-valuemin', '0');
      progress.tabIndex = 0;
      progress.setAttribute('aria-valuemax', String(Math.floor(player?.audio.duration || 0)));
      progress.setAttribute('aria-valuenow', String(Math.floor(player?.audio.currentTime || 0)));
      if (!progress.dataset.keyboardReady) {
        progress.dataset.keyboardReady = 'true';
        progress.addEventListener('keydown', (event) => {
          if (!player || !Number.isFinite(player.audio.duration)) return;
          const offsets: Record<string, number> = {
            ArrowRight: 5,
            ArrowLeft: -5,
            ArrowUp: 10,
            ArrowDown: -10,
          };
          if (event.key in offsets) {
            event.preventDefault();
            player.audio.currentTime = Math.max(
              0,
              Math.min(player.audio.duration, player.audio.currentTime + offsets[event.key]),
            );
          } else if (event.key === 'Home' || event.key === 'End') {
            event.preventDefault();
            player.audio.currentTime = event.key === 'Home' ? 0 : player.audio.duration;
          }
        });
      }
    }
  }

  async function selectCollection(name: 'songs' | 'stories', playImmediately = false) {
    const currentRequest = ++requestId;
    activeCollection = name;
    controlObserver?.disconnect();
    if (player) {
      player.pause();
      // APlayer 1.10 销毁时清空音源会触发延迟跳曲，先清空旧列表避免操作新歌单。
      player.list.clear();
      player.destroy();
      player = undefined;
    }
    publishState(false);
    tabs.forEach((tab) => {
      const selected = tab.dataset.audioTab === name;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });
    document.querySelector<HTMLElement>('#songs-panel')!.hidden = name !== 'songs';
    document.querySelector<HTMLElement>('#stories-panel')!.hidden = name !== 'stories';
    fallback!.hidden = true;
    status!.textContent = '';
    container!.replaceChildren();
    const tracks = collections[name] || [];
    if (name === 'songs') updateSongCover(tracks[0]);
    container!.hidden = tracks.length === 0;
    if (!tracks.length) return;

    status!.textContent = '正在载入播放器…';
    fallback!.href = tracks[0].url;
    try {
      const { default: Player } = await import('aplayer');
      // 连续切换标签时，只创建最后一次选择的播放器。
      if (currentRequest !== requestId) return;
      player = new Player({
        container: container!,
        audio: tracks,
        theme: getComputedStyle(document.documentElement).getPropertyValue('--accent').trim(),
        autoplay: false,
        preload: 'none',
        volume: 0.65,
        mutex: true,
        loop: 'none',
        listFolded: false,
        listMaxHeight: '300px',
        lrcType: tracks.some((track) => track.lrc) ? 3 : 0,
        storageName: 'alei-home-player',
      });
      status!.textContent = '已就绪，点击播放。';
      const instance = player;
      const onCurrent = (event: string, listener: () => void) => {
        instance.on(event, () => {
          if (currentRequest === requestId && player === instance) listener();
        });
      };
      onCurrent('play', () => {
        publishState(true);
        status!.textContent = '正在播放';
        fallback!.hidden = true;
        enhanceControls();
      });
      onCurrent('pause', () => {
        publishState(false);
        status!.textContent = '已暂停';
        enhanceControls();
      });
      onCurrent('waiting', () => {
        status!.textContent = '正在缓冲音频…';
      });
      onCurrent('playing', () => {
        status!.textContent = '正在播放';
      });
      onCurrent('ended', () => {
        publishState(false);
        status!.textContent = '这段声音播放完了。';
      });
      onCurrent('error', () => {
        publishState(false);
        status!.textContent = '这段音频暂时无法播放，可以直接打开音频再试一次。';
        fallback!.href = player?.audio.currentSrc || tracks[0].url;
        fallback!.hidden = false;
      });
      instance.on('listswitch', ({ index }) => {
        if (currentRequest !== requestId || player !== instance) return;
        // listswitch 在 APlayer 更新当前索引之前触发，使用事件里的目标索引。
        if (name === 'songs') updateSongCover(tracks[index]);
        status!.textContent = '已切换音频';
        fallback!.hidden = true;
      });
      onCurrent('timeupdate', () => {
        const progress = container!.querySelector<HTMLElement>('[role="slider"]');
        progress?.setAttribute('aria-valuenow', String(Math.floor(player?.audio.currentTime || 0)));
        progress?.setAttribute('aria-valuemax', String(Math.floor(player?.audio.duration || 0)));
      });
      enhanceControls();
      controlObserver = new MutationObserver(enhanceControls);
      controlObserver.observe(container!, { childList: true, subtree: true });
      if (playImmediately) {
        // 原生 play Promise 可检测浏览器的自动播放限制。
        try {
          await player.audio.play();
        } catch {
          if (currentRequest === requestId && player.audio.paused && !player.audio.error) {
            status!.textContent = '请点击播放器的播放按钮开始收听。';
          }
        }
      }
    } catch (error) {
      if (currentRequest !== requestId) return;
      if (import.meta.env.DEV) console.error('Audio player initialization failed:', error);
      status!.textContent = '播放器加载失败，可以直接打开音频收听。';
      fallback!.hidden = false;
    }
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => {
      const name = tab.dataset.audioTab as 'songs' | 'stories';
      if (name !== activeCollection) void selectCollection(name);
    });
    tab.addEventListener('keydown', (event) => {
      let next = index;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      else if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = tabs.length - 1;
      else return;
      event.preventDefault();
      tabs[next].focus();
      tabs[next].click();
    });
  });
  document.querySelector('#listen-story')?.addEventListener('click', () => {
    tabs[1].focus();
    void selectCollection('stories', true);
  });
  if (collections.songs.length) void selectCollection('songs');
}
