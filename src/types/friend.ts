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
