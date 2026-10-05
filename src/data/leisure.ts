import type { ImageMetadata } from 'astro';
import psychologyOfMoney from '../assets/books/psychology-of-money.jpg';
import outOfTheGobi from '../assets/books/out-of-the-gobi.jpg';
import thinkingFastAndSlow from '../assets/books/thinking-fast-and-slow.jpg';
import superforecasting from '../assets/books/superforecasting.jpg';

export const games = [
  {
    name: '鹈鹕追月',
    subtitle: '月饼大作战',
    description: '骑上自行车，穿过桂花云海。跳过障碍，收集月饼，赴一场月宫的团圆之约。',
    duration: '一局 2 分钟',
    controls: '空格 / 轻点跳跃 · 支持二段跳',
    url: 'https://mrleilove.github.io/pelican-moon-game/',
  },
];

export interface RecommendedBook {
  title: string;
  originalTitle: string;
  author: string;
  category: string;
  note: string;
  description?: string;
  url?: string;
  ebook?: {
    slug: string;
    file: string;
    cover: ImageMetadata;
  };
}

export const recommendedBooks: RecommendedBook[] = [
  {
    title: '小王子',
    originalTitle: 'LE PETIT PRINCE',
    author: '安托万·德·圣埃克苏佩里',
    category: '文学 · 童话',
    note: '给忙碌的大人，留一点孩子气。',
    description:
      '一个小小的星球，一朵玫瑰，一段关于相遇与牵挂的旅程。适合在一天的忙碌之后，慢慢翻上几页，重新看看那些被忽略的小事。',
    url: 'https://www.lepetitprince.com/en/the-book/',
  },
  {
    title: '金钱心理学',
    originalTitle: 'THE PSYCHOLOGY OF MONEY',
    author: '摩根·豪泽尔',
    category: '财富 · 心理',
    note: '赚钱靠能力，守钱靠克制，懂得“足够”才是普通人复利的关键。',
    ebook: {
      slug: 'psychology-of-money',
      file: 'books/psychology-of-money.epub',
      cover: psychologyOfMoney,
    },
  },
  {
    title: '走出戈壁',
    originalTitle: 'OUT OF THE GOBI',
    author: '单伟建',
    category: '传记 · 成长',
    note: '从戈壁到沃顿，一个不抱怨、不说教的人如何靠韧性走出迷茫。',
    ebook: {
      slug: 'out-of-the-gobi',
      file: 'books/out-of-the-gobi.epub',
      cover: outOfTheGobi,
    },
  },
  {
    title: '思考，快与慢',
    originalTitle: 'THINKING, FAST AND SLOW',
    author: '丹尼尔·卡尼曼',
    category: '认知 · 决策',
    note: '你以为自己在理性思考，其实大多是直觉和偏见在替你决策。',
    ebook: {
      slug: 'thinking-fast-and-slow',
      file: 'books/thinking-fast-and-slow.epub',
      cover: thinkingFastAndSlow,
    },
  },
  {
    title: '超预测',
    originalTitle: 'SUPERFORECASTING',
    author: '菲利普·泰洛克、丹·加德纳',
    category: '思维 · 预测',
    note: '预测能力可以训练，关键是概率思维、持续更新、承认不确定。',
    ebook: {
      slug: 'superforecasting',
      file: 'books/superforecasting.epub',
      cover: superforecasting,
    },
  },
];
