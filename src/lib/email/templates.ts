export function guardianInviteEmail({
  guardianName,
  studentName,
  studioName,
  inviteUrl,
}: {
  guardianName: string;
  studentName: string;
  studioName: string;
  inviteUrl: string;
}) {
  return {
    subject: `【${studioName}】保護者ポータルへの招待`,
    html: `
<!DOCTYPE html>
<html lang="ja">
<head><meta charset="UTF-8"></head>
<body style="font-family: 'Hiragino Sans', Arial, sans-serif; background: #f8fafc; margin: 0; padding: 40px 20px;">
  <div style="max-width: 520px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px; border: 1px solid #e2e8f0;">
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="display: inline-block; background: #4f46e5; border-radius: 12px; padding: 12px; margin-bottom: 16px;">
        <span style="color: white; font-size: 24px;">🎓</span>
      </div>
      <h1 style="color: #1e293b; font-size: 20px; margin: 0;">Lessonbase</h1>
    </div>

    <p style="color: #475569; font-size: 15px; line-height: 1.7; margin-bottom: 8px;">
      ${guardianName} 様
    </p>
    <p style="color: #475569; font-size: 15px; line-height: 1.7; margin-bottom: 24px;">
      <strong>${studioName}</strong>の保護者ポータルにご招待します。<br>
      ポータルでは <strong>${studentName}</strong> さんの出席記録の確認、月謝の支払い、教室からのお知らせを受け取ることができます。
    </p>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${inviteUrl}" style="display: inline-block; background: #4f46e5; color: white; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 15px;">
        ポータルに参加する
      </a>
    </div>

    <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 24px; line-height: 1.6;">
      このリンクは7日間有効です。<br>
      このメールに心当たりのない方は無視してください。
    </p>
  </div>
</body>
</html>
    `.trim(),
  };
}

export function paymentReminderEmail({
  guardianName,
  studentName,
  amount,
  month,
  dueDate,
  portalUrl,
}: {
  guardianName: string;
  studentName: string;
  amount: number;
  month: string;
  dueDate: string;
  portalUrl: string;
}) {
  return {
    subject: `【月謝お支払いのご案内】${month}分 ¥${amount.toLocaleString()}`,
    html: `
<!DOCTYPE html>
<html lang="ja">
<head><meta charset="UTF-8"></head>
<body style="font-family: 'Hiragino Sans', Arial, sans-serif; background: #f8fafc; margin: 0; padding: 40px 20px;">
  <div style="max-width: 520px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px; border: 1px solid #e2e8f0;">
    <p style="color: #475569; font-size: 15px; line-height: 1.7; margin-bottom: 8px;">${guardianName} 様</p>
    <p style="color: #475569; font-size: 15px; line-height: 1.7; margin-bottom: 24px;">
      ${month}分の月謝が未払いとなっています。<br>
      お支払い期日は <strong>${dueDate}</strong> です。
    </p>

    <div style="background: #f1f5f9; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="color: #64748b; font-size: 13px; padding: 4px 0;">生徒名</td><td style="color: #1e293b; font-weight: 600; text-align: right;">${studentName}</td></tr>
        <tr><td style="color: #64748b; font-size: 13px; padding: 4px 0;">対象月</td><td style="color: #1e293b; font-weight: 600; text-align: right;">${month}</td></tr>
        <tr><td style="color: #64748b; font-size: 13px; padding: 4px 0;">金額</td><td style="color: #1e293b; font-size: 20px; font-weight: 700; text-align: right;">¥${amount.toLocaleString()}</td></tr>
      </table>
    </div>

    <div style="text-align: center;">
      <a href="${portalUrl}" style="display: inline-block; background: #4f46e5; color: white; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 15px;">
        支払いページへ
      </a>
    </div>
  </div>
</body>
</html>
    `.trim(),
  };
}

export function messageNotificationEmail({
  guardianName,
  studioName,
  messageTitle,
  messagePreview,
  portalUrl,
}: {
  guardianName: string;
  studioName: string;
  messageTitle: string;
  messagePreview: string;
  portalUrl: string;
}) {
  return {
    subject: `【${studioName}】${messageTitle}`,
    html: `
<!DOCTYPE html>
<html lang="ja">
<head><meta charset="UTF-8"></head>
<body style="font-family: 'Hiragino Sans', Arial, sans-serif; background: #f8fafc; margin: 0; padding: 40px 20px;">
  <div style="max-width: 520px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px; border: 1px solid #e2e8f0;">
    <p style="color: #475569; font-size: 15px; margin-bottom: 16px;">${guardianName} 様</p>
    <p style="color: #475569; font-size: 15px; margin-bottom: 24px;">
      ${studioName}から新しいお知らせが届いています。
    </p>
    <div style="border-left: 4px solid #4f46e5; padding: 12px 16px; margin-bottom: 24px; background: #f8f9ff; border-radius: 0 8px 8px 0;">
      <p style="font-weight: 600; color: #1e293b; margin: 0 0 8px;">${messageTitle}</p>
      <p style="color: #64748b; font-size: 13px; margin: 0;">${messagePreview}</p>
    </div>
    <div style="text-align: center;">
      <a href="${portalUrl}" style="display: inline-block; background: #4f46e5; color: white; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 15px;">
        ポータルで確認する
      </a>
    </div>
  </div>
</body>
</html>
    `.trim(),
  };
}
