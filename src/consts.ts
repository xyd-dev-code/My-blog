export const SITE = {
  url: 'https://www.personalblog.website',
  baseUrl: '',
  title: 'XiaoyouDong · Tech Blog',
  description:
    '一个晴空主题的个人技术博客——记录学习、踩坑与项目复盘。',
  author: 'XiaoyouDong',
  avatar: 'https://avatars.githubusercontent.com/u/147724133?s=400&u=4f196cc46387a175540484f3c7f4b0d96c446895&v=4',
  lang: 'zh-CN',
  github: 'https://github.com/xyd-dev-code',
  repo: 'https://github.com/xyd-dev-code/My-blog',
};

export const NAV = [
  { href: '/', label: '首页' },
  { href: '/posts', label: '文章' },
  { href: '/projects', label: '项目' },
  { href: '/friends', label: '友链' },
  { href: '/guestbook', label: '留言' },
  { href: '/about', label: '关于' },
];

export const SOCIALS = [
  { href: SITE.github, label: 'GitHub', icon: 'github' },
];

export const POSTS_PER_PAGE = 4;

// 过滤非技术/通用标签（不展示在标签云、标签页等处）
export const STOP_TAGS = new Set([
  '笔记', '实习', '求职', '总结', '项目', 'project', '入门', '实验', '速查', '踩坑',
  '入职', '预习', '基础', 'tools', 'workflow', 'meta', 'intro', 'fullstack',
  'retrospective', '亚信科技', '电脑商城', 'windows',
  '生产bug', '用户鉴权', '购物车', '订单', '事务', '用户模块', '慢SQL', '分层架构',
  '项目结构', '多模块', 'Git Flow', '协作', '等价类', '黑盒测试',
]);

export function filterTags(tags: string[]): string[] {
  const filtered = tags.filter((t) => !STOP_TAGS.has(t));
  // 如果过滤后为空，至少保留第一个原始标签，避免文章无标签
  return filtered.length > 0 ? filtered : tags.slice(0, 1);
}
