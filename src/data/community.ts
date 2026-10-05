export interface FriendLink {
  name: string;
  url: string;
  description: string;
}

// 收到并确认友链后添加到这里；不使用虚构站点填充列表。
export const friendLinks: FriendLink[] = [];

export const linkExchange = {
  name: '阿雷的小站',
  url: 'https://mrleilove.github.io/alei-home/',
  description: '写代码，也写生活。一个随四季变化的互联网小院。',
};

// 固定 discussion 编号，页面标题、路径和域名变化都不会拆分已有留言。
export const guestbook = {
  repo: 'MRLEILOVE/alei-home',
  repoId: 'R_kgDOU7guCw',
  category: 'Announcements',
  categoryId: 'DIC_kwDOU7guC84DHEED',
  discussionNumber: '1',
  discussionUrl: 'https://github.com/MRLEILOVE/alei-home/discussions/1',
};
