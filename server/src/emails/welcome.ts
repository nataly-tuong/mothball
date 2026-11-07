export const welcomeEmailHtml = (
  code: string,
) => `<body style="margin:0;padding:0;background-color:#f0e9fa;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">Your Mothball verification code is ${code}.</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f0e9fa;background-image:linear-gradient(180deg,#dcdcf8 0%,#efe3f6 55%,#f8eaf4 100%);font-family:'Hanken Grotesk',Arial,sans-serif;color:#29233a;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:480px;border-collapse:separate;background-color:#fffefc;border:1px solid #e1d7ee;border-radius:24px;box-shadow:0 10px 30px rgba(57,36,95,0.10);">
          <tr>
            <td align="center" style="padding:28px 28px 4px;">
              <p style="margin:0;font-family:'Gaegu','Comic Sans MS',cursive;font-size:32px;line-height:1;font-weight:700;color:#39245f;">Mothball</p>
              <p style="margin:8px 0 0;font-size:10px;font-weight:700;letter-spacing:2px;color:#39245f;">ONE LITTLE THING BEFORE YOU BEGIN</p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 20px 0;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:separate;background-color:#e9e4fa;background-image:linear-gradient(180deg,#dcdcf8 0%,#f1e4f6 60%,#f9ecf5 100%);border:1px solid #e1d7ee;border-radius:18px;">
                <tr>
                  <td align="center" style="padding:28px 24px 30px;">
                    <img src="https://res.cloudinary.com/ooazewai/image/upload/f_png,q_auto,w_192/Mothball" alt="A lilac moth perched on a mothball" width="96" style="display:block;width:96px;max-width:96px;height:auto;border:0;margin:0 auto 14px;" />
                    <h1 style="margin:0 0 12px;font-family:'Fredoka',Arial,sans-serif;font-size:34px;line-height:1.2;font-weight:500;color:#39245f;">One more little thing!</h1>
                    <p style="margin:0 0 20px;font-size:16px;line-height:1.7;color:#29233a;">Welcome to Mothball! Enter this code to confirm your email address.</p>

                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 auto;border-collapse:separate;background-color:#fffefc;border:1px solid #d9d0e5;border-radius:16px;">
                      <tr>
                        <td align="center" style="padding:16px 28px 16px 38px;font-family:'Courier New',Courier,monospace;font-size:36px;line-height:1;font-weight:700;letter-spacing:10px;color:#39245f;">${code}</td>
                      </tr>
                    </table>

                    <p style="margin:20px 0 0;font-size:12px;line-height:1.6;color:#625777;">This code expires in 15 minutes.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:22px 24px 0;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:separate;background-color:#f0e9fa;border:1px solid #e1d7ee;border-radius:14px;">
                <tr>
                  <td align="center" style="padding:16px 20px;">
                    <p style="margin:0;font-size:14px;line-height:1.7;color:#39245f;">What’s a moth’s favorite type of glasses? Lamp shades.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:24px 28px 30px;">
              <p style="margin:0;font-family:'Gaegu','Comic Sans MS',cursive;font-size:28px;line-height:1.3;color:#39245f;">-Nataly</p>
              <p style="margin:6px 0 0;font-size:12px;color:#39245f;">Creator of Mothball</p>
            </td>
          </tr>
        </table>
        <p style="margin:20px 0 0;max-width:400px;font-size:11px;line-height:1.7;color:#39245f;">You’re receiving this because you signed up for Mothball. If you didn’t, you can safely ignore this email.</p>
      </td>
    </tr>
  </table>
</body>`;
