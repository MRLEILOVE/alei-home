# 阿雷的小站

阿雷的个人门户：以四季手记为主题，用纸张底色、宋体标题、手绘山野和书页式排版，收录文字、开源作品、音乐角，以及手绘“小阿雷”。这是独立项目，通过链接访问原来的文章集，不修改文章集的源码或发布内容。

## 四季外观

首页支持春、夏、秋、冬四套插画和配色。默认按 Asia/Taipei 时区的月份选择：3–5 月春、6–8 月夏、9–11 月秋、12–2 月冬。首页可手动切换，偏好保存在浏览器本地；“随时节”清除手动选择，恢复自动模式。

右上角的窗帘拉绳可向下拖动后松手，按春、夏、秋、冬循环换季，也支持点击、Enter 和空格键。短距离拖动或取消手势时仅回弹。首次访问显示“拉一下试试看！”，可关闭或在首次换季后收起，已展示状态保存在浏览器本地。拉绳和原季节选择器共享状态，不打断音乐。

首屏脚本提前应用外观，插画、书封、播放器进度条与页面文字同步换色。切换季节不重载页面，也不打断正在播放的音频。禁用本地存储仍可在当前页面切换；关闭 JavaScript 时保留完整内容和秋季外观。四季风景是艺术化表达，不代表深圳实时天气。

四季共用一张 WebP 图集，通过 CSS 显示对应象限，并复用为低透明度的整页背景。正文区域叠加淡纸色，首页插画保留胶带和白纸边的便利贴样式。

环境动效按季节切换：春天细雨、花瓣与新草，夏天流云、微风与青草，秋天风吹落叶，冬天流云飘雪。季节选择下方的“环境动效”按钮可关闭并记住偏好，关闭后仍保留背景；系统启用减少动态效果时自动关闭，页面进入后台时暂停动画。装饰层不响应鼠标，不进入读屏内容；手机减少粒子数量，打印时隐藏装饰。

《程序员的离谱职场日记》使用原文章集的无文字封面，完整显示画面，书名与署名叠放在封面上方的留白处，阅读入口位于图片下方。

## 本地开发

Node.js 22.19+，推荐 Node.js 24。

```sh
npm ci
npm run dev
```

访问 http://127.0.0.1:4330/。

```sh
npm run check
npm run build
npm run verify
npm run preview
```

检查与构建可在停止开发服务后执行，避免 Vite 预构建缓存被并行检查重建。预览使用构建产物。

## 修改内容

- 个人资料、平台地址、精选项目：`src/data/site.ts`
- 页面结构：`src/pages/index.astro`
- 样式与响应式布局：`src/styles/global.css`
- 季节文案：`src/data/seasons.ts`；切换逻辑：`src/scripts/seasons.ts`；首屏外观：`src/layouts/Layout.astro`
- 右上角换季拉绳：`src/components/SeasonCurtain.astro`，手势与初次访问提示由 `src/scripts/seasons.ts` 管理。
- 整页背景与季节动效：`src/components/SeasonAtmosphere.astro`、`src/styles/atmosphere.css`；动效偏好：`src/scripts/atmosphere.ts`
- 职场日记封面入口：`src/components/JournalBook.astro`
- 曲目：`src/data/music.ts`
- 音频文件：`public/audio/`
- 歌曲封面：`public/covers/`，通过曲目配置的 `cover` 字段关联。
- 人物与原始插画：`src/assets/`，构建时由 Astro 生成 WebP 与响应式尺寸。
- 看板角色互动：`src/scripts/mascot.ts`
- 友情链接与留言配置：`src/data/community.ts`

## 留言板与友情链接

留言板使用 giscus，中文界面支持评论、回复和表情回应。数据保存在本仓库的 [GitHub Discussions #1](https://github.com/MRLEILOVE/alei-home/discussions/1)，不保存在静态网站文件或访客浏览器里。访客使用 GitHub 登录；站主可以在该讨论页管理留言。重新发布网站不会清除留言。

`Guestbook.astro` 使用固定 discussion 编号绑定留言板，不受页面标题或路径变化影响。组件按需加载，加载异常或禁用 JavaScript 时仍可通过底部链接直接在 GitHub 留言。`public/giscus.css` 提供纸张风格；`giscus.json` 限定生产站点和本地预览来源，并按最新留言排序。不要在前端配置中添加 GitHub token。

友情链接由站主管理：收到申请并确认后，在 `src/data/community.ts` 的 `friendLinks` 数组添加 `name`、`url`（完整 HTTPS 地址）、`description`。暂未添加时显示空状态，不编造友链。访客可在留言板提交交换申请，页面也提供本站名称、地址与介绍。

## 加入歌曲

将音频文件复制到 `public/audio/`，然后在 `src/data/music.ts` 的 `songs` 数组增加配置：

```ts
export const songs: Track[] = [
  {
    name: '歌曲名',
    artist: '歌手名',
    url: 'audio/song.mp3',
    // 可选，均为相对 public/ 的路径：
    // cover: 'covers/song.jpg',
    // lrc: 'lyrics/song.lrc',
  },
];
```

MP3 或浏览器可解码的 M4A；文件名建议采用英文与短横线。路径不要带站点仓库前缀，构建时会自动附加 GitHub Pages 子路径。也可配置可直接播放的 HTTPS 音频地址。

“我的歌单”已接入用户提供的九首周杰伦歌曲：七里香、以父之名、告白气球、夜曲、断了的弦、晴天、暗号、简单爱、稻香，按此顺序展示，约 40 分钟。八首 MP3 原样复制；《简单爱》从用户的 FLAC 转为 320 kbps MP3 供网页播放。用户原文件未修改，站内使用英文文件名避免路径编码问题。

“有声书”收录阿雷作品《程序员的离谱职场日记》的导读（约 5 分钟），由 Microsoft Edge TTS 云希音色合成；文件复制自现有文章集音频。歌曲和有声书默认均不自动播放，也不预先下载整首音频。站内不依赖第三方音乐解析 API。

播放器使用正方形缩略图：歌曲显示对应照片，有声书显示《程序员的离谱职场日记》的书封。歌名与歌手在同一行显示，长歌名自动省略；上方黑胶唱片保留随播放旋转的效果。

APlayer 按需加载，提供播放/暂停、进度、音量、曲目列表及可选 LRC。播放按钮和歌单条目支持 Enter/Space，进度条支持方向键、Home/End，音频类别支持左右方向键。九首歌曲按顺序对应用户提供的九张照片，切歌时同步更新黑胶中央封面与播放器缩略图。唱片随播放转动、暂停时停止，并遵循减少动态效果偏好。加载失败显示直接音频链接。

## 小阿雷

形象采用用户确认的第二版：黑色短袖、斜挎包、小米手环、蜡笔质感。当前是透明人物图片配轻量动画，支持点击对话、引导到文章/音乐、收起/恢复、记住显示偏好，以及随实际播放状态切换听歌动作。手机首次打开默认收起，系统开启减少动态效果时关闭动画。

当前没有 Live2D 模型或骨骼数据，因此没有声称接入 Live2D。今后取得模型后，可替换人物渲染部分，保留对话与播放器事件接口 `alei:audio`。

## GitHub Pages

网站地址：https://mrleilove.github.io/alei-home/

源码仓库：https://github.com/MRLEILOVE/alei-home

通过 `.github/workflows/pages.yml` 发布，仓库 Settings → Pages 使用 GitHub Actions。推送 `main` 后自动检查、构建并更新网站。

工作流从 GitHub 获取站点地址与子路径，支持项目仓库及主页仓库。手动模拟项目子路径构建：

```powershell
$env:SITE_URL = 'https://mrleilove.github.io'
$env:BASE_PATH = '/alei-home/'
npm run build
npm run verify
```

本地根路径预览前，清除这两个环境变量并重新构建即可。

## 素材来源

- 背景插画：用户提供的热气球手绘图。
- 四季场景：以用户插画为参考，由内置 imagegen 延展的春夏秋冬蜡笔画，见 `ASSETS.md`。
- 角色：根据该图，通过内置 imagegen 生成并按用户要求修改的透明人物稿。
- 自我介绍、签名、项目与平台链接：阿雷的公开 GitHub 个人说明及用户确认的信息。
- APlayer：MIT，见 `public/licenses/aplayer.txt`。项目文章、图像与音频不因播放器的开源许可而自动获得相同许可。
