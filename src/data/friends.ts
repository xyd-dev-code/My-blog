export interface Friend {
  name: string;
  url: string;
  avatar: string;
  desc: string;
}

// 想加更多直接往数组里追。头像建议用 .png / .webp,失败时组件会回退到首字母方块。
export const friends: Friend[] = [
  {
    name: 'JerryGao',
    url: 'https://jerrygao.cn/',
    avatar: 'https://jerrygao.cn/icons/icon-512.png',
    desc: '安全小白，初出茅庐。',
  },
  {
    name: 'XiaoyouDong',
    url: 'https://www.personalblog.website/',
    avatar: '',
    desc: '这里是 XiaoyouDong 的个人技术博客。 记录学习过程、踩过的坑、做过的项目。',
  },
];
