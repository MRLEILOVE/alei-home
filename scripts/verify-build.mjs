import { readFile, stat, readdir } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = process.cwd();
const dist = path.join(root, 'dist');
const base = `/${(process.env.BASE_PATH || '').replace(/^\/+|\/+$/g, '')}/`.replace('//', '/');
const html = await readFile(path.join(dist, 'index.html'), 'utf8');
const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]));
const decode = (value) =>
  value
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&amp;/g, '&');
let references = 0;

async function verifyReference(value) {
  value = decode(value);
  if (/^(https?:|data:|mailto:|tel:|javascript:)/i.test(value)) return;
  const url = new URL(value, `https://local.invalid${base}`);
  if (value.startsWith('#')) {
    if (url.hash) assert(ids.has(decodeURIComponent(url.hash.slice(1))), `锚点不存在：${value}`);
    references++;
    return;
  }
  assert(url.pathname.startsWith(base), `资源缺少部署子路径 ${base}：${value}`);
  let relative = decodeURIComponent(url.pathname.slice(base.length));
  if (!relative || relative.endsWith('/')) relative += 'index.html';
  const target = path.resolve(dist, relative);
  assert(target.startsWith(dist + path.sep), `资源超出构建目录：${value}`);
  assert((await stat(target)).isFile(), `本地资源不存在：${value}`);
  references++;
}

for (const match of html.matchAll(/\b(?:src|href)="([^"]+)"/g)) await verifyReference(match[1]);
for (const match of html.matchAll(/\bsrcset="([^"]+)"/g)) {
  for (const source of match[1].split(',')) await verifyReference(source.trim().split(/\s+/)[0]);
}
const tracksMatch = html.match(/data-tracks="([^"]+)"/);
assert(tracksMatch, '播放器配置未写入页面');
const tracks = JSON.parse(decode(tracksMatch[1]));
for (const track of [...tracks.songs, ...tracks.stories]) {
  assert(track.name && track.artist, '曲目信息不完整');
  await verifyReference(track.url);
  if (track.cover) await verifyReference(track.cover);
  if (track.lrc) await verifyReference(track.lrc);
}
const requiredLinks = [
  'https://github.com/MRLEILOVE',
  'https://blog.csdn.net/qq_34845394',
  'https://www.cnblogs.com/leigq',
  'https://juejin.cn/user/1239904846353710',
  'https://mrleilove.github.io/article-library-site/',
  'https://music.163.com/#/djradio?id=1499531119',
];
for (const link of requiredLinks) assert(html.includes(link), `缺少个人入口：${link}`);
assert(!html.includes('�'), '构建页面包含乱码替换字符');

async function verifyEncoding(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) await verifyEncoding(file);
    else if (/\.(astro|ts|css|mjs)$/.test(file))
      new TextDecoder('utf-8', { fatal: true }).decode(await readFile(file));
  }
}
await verifyEncoding(path.join(root, 'src'));
console.log(
  `验证通过：1 个页面，${references} 个本地资源/锚点，${tracks.songs.length} 首歌曲，${tracks.stories.length} 段有声书；UTF-8 正常。部署子路径：${base}`,
);
