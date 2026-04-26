const nodemailer = require('nodemailer');

const isConfigured =
  process.env.SMTP_HOST &&
  process.env.SMTP_USER &&
  process.env.SMTP_PASS;

function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

const sendPasswordResetEmail = async ({ toEmail, toName, resetToken }) => {
  const appName = 'HMS – Hospital Management System';
  const expiryMinutes = 60;

  if (!isConfigured) {
    // Fallback: print to console so dev can still test the flow
    if (process.env.NODE_ENV !== 'production') {
      console.log('\n[emailService] SMTP not configured — password reset token:');
      console.log(`  To     : ${toEmail}`);
      console.log(`  Token  : ${resetToken}\n`);
    }
    return;
  }

  const transporter = createTransport();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  await transporter.sendMail({
    from: `"${appName}" <${from}>`,
    to: toEmail,
    subject: 'Password Reset Request',
    text: [
      `Hi ${toName},`,
      '',
      'You requested a password reset for your HMS account.',
      '',
      `Your reset token is: ${resetToken}`,
      '',
      `This token expires in ${expiryMinutes} minutes.`,
      '',
      'If you did not request this, you can safely ignore this email.',
      '',
      `— ${appName}`,
    ].join('\n'),
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2 style="color:#0097a7">Password Reset Request</h2>
        <p>Hi <strong>${toName}</strong>,</p>
        <p>You requested a password reset for your HMS account.</p>
        <p style="font-size:14px">Your reset token:</p>
        <div style="background:#f0f9fa;border:1px solid #b2ebf2;border-radius:8px;padding:12px 16px;
                    font-family:monospace;font-size:15px;letter-spacing:1px;word-break:break-all">
          ${resetToken}
        </div>
        <p style="color:#666;font-size:13px">This token expires in <strong>${expiryMinutes} minutes</strong>.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
        <p style="color:#999;font-size:12px">If you did not request this, you can safely ignore this email.</p>
      </div>
    `,
  });
};

module.exports = { sendPasswordResetEmail };
