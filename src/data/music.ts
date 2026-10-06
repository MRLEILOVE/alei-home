export interface Track {
  name: string;
  artist: string;
  /** 本地文件用相对 public/ 的路径，也可使用可直接播放的 HTTPS 音频地址。 */
  url: string;
  cover?: string;
  lrc?: string;
}

// 使用用户提供的本地音频，封面对应各首歌曲所属的原发行专辑。
export const songs: Track[] = [
  {
    name: '七里香',
    artist: '周杰伦',
    url: 'audio/jay-qilixiang.mp3',
    cover: 'covers/jay-qilixiang.jpg',
  },
  {
    name: '以父之名',
    artist: '周杰伦',
    url: 'audio/jay-yifuzhiming.mp3',
    cover: 'covers/jay-yifuzhiming.jpg',
  },
  {
    name: '告白气球',
    artist: '周杰伦',
    url: 'audio/jay-gaobaiqiqiu.mp3',
    cover: 'covers/jay-gaobaiqiqiu.jpg',
  },
  { name: '夜曲', artist: '周杰伦', url: 'audio/jay-yequ.mp3', cover: 'covers/jay-yequ.jpg' },
  {
    name: '断了的弦',
    artist: '周杰伦',
    url: 'audio/jay-duanledexian.mp3',
    cover: 'covers/jay-duanledexian.jpg',
  },
  {
    name: '晴天',
    artist: '周杰伦',
    url: 'audio/jay-qingtian.mp3',
    cover: 'covers/jay-qingtian.jpg',
  },
  { name: '暗号', artist: '周杰伦', url: 'audio/jay-anhao.mp3', cover: 'covers/jay-anhao.jpg' },
  {
    name: '简单爱',
    artist: '周杰伦',
    url: 'audio/jay-jiandanai.mp3',
    cover: 'covers/jay-jiandanai.jpg',
  },
  {
    name: '稻香',
    artist: '周杰伦',
    url: 'audio/jay-daoxiang.mp3',
    cover: 'covers/jay-daoxiang.jpg',
  },
];

export const stories: Track[] = [
  {
    name: '导读：从一列绿皮火车开始',
    artist: '阿雷 · 程序员的离谱职场日记',
    url: 'audio/journal-guide.mp3',
  },
];
