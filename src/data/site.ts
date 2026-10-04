export const profile = {
  name: '阿雷',
  title: '阿雷的小站',
  location: '深圳，中国',
  introduction:
    '平时写 Java 后端，也做 IntelliJ 插件和实用的小工具。喜欢把重复的事情变简单，也喜欢把平凡的日子写成故事。',
  signature: '做一件事，就把一件事做好，别半途而废了。',
  github: 'https://github.com/MRLEILOVE',
  library: 'https://mrleilove.github.io/article-library-site/',
  audiobook: 'https://music.163.com/#/djradio?id=1499531119',
};

export const platforms = [
  { name: 'GitHub', label: '代码与开源', mark: 'GH', className: 'github', url: profile.github },
  {
    name: 'CSDN',
    label: '技术与实践',
    mark: 'C',
    className: 'csdn',
    url: 'https://blog.csdn.net/qq_34845394',
  },
  {
    name: '博客园',
    label: '记录与积累',
    mark: '博',
    className: 'cnblogs',
    url: 'https://www.cnblogs.com/leigq',
  },
  {
    name: '掘金',
    label: '分享与交流',
    mark: '掘',
    className: 'juejin',
    url: 'https://juejin.cn/user/1239904846353710',
  },
];

export const projects = [
  {
    name: 'Database Column Comments',
    icon: 'database',
    tag: 'Kotlin · IntelliJ',
    description: '让字段注释出现在该出现的地方。在数据库表和 SQL 结果里，少一次来回查找。',
    url: 'https://github.com/MRLEILOVE/database-column-comments',
  },
  {
    name: 'AI Git Commit',
    icon: 'branch',
    tag: 'Kotlin · AI · Fork',
    description: '用 AI 辅助编写提交信息，让 Git 工作流更顺手。基于开源项目继续打磨。',
    url: 'https://github.com/MRLEILOVE/ai-git-commit',
  },
  {
    name: 'Yearning Toolkit',
    icon: 'code',
    tag: 'JavaScript · Userscript',
    description: '给日常使用的 Yearning 添一些小便利，把重复操作交给工具。',
    url: 'https://github.com/MRLEILOVE/yearning-tampermonkey-toolkit',
  },
];
