export interface Friend {
  name: string;
  url: string;
  avatar: string;
  desc: string;
  group?: 'self' | 'friend';
  // 审核状态:无值视同 approved(老条目无需迁移);pending 仅作审计元数据,
  // 当前不参与渲染过滤,见 .github/ISSUE_TEMPLATE/friend-apply.md
  status?: 'approved' | 'pending';
}

// 想加更多直接往数组里追。
// group: 'self'  → 突出显示在顶部(本站作者)
//        'friend' → 进主网格
export const friends: Friend[] = [
  {
    name: 'XiaoyouDong',
    url: 'https://www.personalblog.website/',
    avatar: 'https://avatars.githubusercontent.com/u/147724133?s=400&u=4f196cc46387a175540484f3c7f4b0d96c446895&v=4',
    desc: '这里是 XiaoyouDong 的个人技术博客。 记录学习过程、踩过的坑、做过的项目。',
    group: 'self',
  },
  {
    name: 'JerryGao',
    url: 'https://jerrygao.cn/',
    avatar: 'https://jerrygao.cn/icons/icon-512.png',
    desc: '安全小白，初出茅庐。',
    group: 'friend',
  },
];
