export interface GuestbookEntry {
  name: string;
  date: string; // YYYY-MM-DD
  body: string; // 多行文本,支持基础 Markdown
  url?: string; // 可选:留言人的个人主页
}
