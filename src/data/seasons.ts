export const seasons = [
  {
    id: 'spring',
    name: '春',
    word: '万物生',
    caption: '春天，把新的故事种下。',
    aside: '花开有时，\n灵感也是。',
    color: '#f2f4e9',
  },
  {
    id: 'summer',
    name: '夏',
    word: '风正好',
    caption: '夏天，风会路过这片山野。',
    aside: '日子很长，\n不妨走走。',
    color: '#f1f5ef',
  },
  {
    id: 'autumn',
    name: '秋',
    word: '慢慢来',
    caption: '秋天，收集一些暖色的日常。',
    aside: '风翻过一页，\n故事又一行。',
    color: '#f6f2e9',
  },
  {
    id: 'winter',
    name: '冬',
    word: '等春来',
    caption: '冬天，把想说的话写在纸上。',
    aside: '天冷了，\n文字还有温度。',
    color: '#f1f2f3',
  },
] as const;

export type SeasonId = (typeof seasons)[number]['id'];
