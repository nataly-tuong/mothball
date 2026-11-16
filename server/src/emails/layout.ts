type EmailOptions = {
  preheader: string;
  tagline: string;
  heading: string;
  body: string;
  code?: string;
  button?: { label: string; url: string };
  note?: string;
  joke?: string;
  footer: string;
};

function escapeAttr(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function emailLayout({
  preheader,
  tagline,
  heading,
  body,
  code,
  button,
  note,
  joke,
  footer,
}: EmailOptions) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light dark" />
  <meta name="supported-color-schemes" content="light dark" />
  <title>Mothball</title>
  <style>
    :root { color-scheme: light dark; supported-color-schemes: light dark; }
    @media (prefers-color-scheme: dark) {
      .mb-bg { background-color: #17111f !important; }
      .mb-card { background-color: #221a30 !important; border-color: #3a2d52 !important; box-shadow: none !important; }
      .mb-hero { background-color: #2b2140 !important; border-color: #3a2d52 !important; }
      .mb-joke { background-color: #2b2140 !important; border-color: #3a2d52 !important; }
      .mb-code { background-color: #17111f !important; border-color: #4a3a68 !important; color: #f3ecff !important; }
      .mb-title, .mb-text { color: #f1eafc !important; }
      .mb-muted { color: #c9bde0 !important; }
      .mb-btn { background-color: #a984e8 !important; }
      .mb-btn a { color: #17111f !important; }
      .mb-link { color: #c4a8f5 !important; }
    }
    [data-ogsc] .mb-title, [data-ogsc] .mb-text { color: #f1eafc !important; }
    [data-ogsc] .mb-muted { color: #c9bde0 !important; }
    [data-ogsb] .mb-bg { background-color: #17111f !important; }
    [data-ogsb] .mb-card { background-color: #221a30 !important; }
    [data-ogsb] .mb-hero, [data-ogsb] .mb-joke { background-color: #2b2140 !important; }
    [data-ogsb] .mb-code { background-color: #17111f !important; }
  </style>
</head>
<body class="mb-bg" style="margin:0;padding:0;background-color:#f0e9fa;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${preheader}</div>
  <table role="presentation" class="mb-bg" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#f0e9fa" style="background-color:#f0e9fa;font-family:'Hanken Grotesk',Arial,sans-serif;color:#29233a;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" class="mb-card" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#fffefc" style="width:100%;max-width:480px;border-collapse:separate;background-color:#fffefc;border:1px solid #e1d7ee;border-radius:24px;box-shadow:0 10px 30px rgba(57,36,95,0.10);">
          <tr>
            <td align="center" style="padding:28px 28px 4px;">
              <p class="mb-title" style="margin:0;font-family:'Gaegu','Comic Sans MS',cursive;font-size:32px;line-height:1;font-weight:700;color:#39245f;">Mothball</p>
              <p class="mb-muted" style="margin:8px 0 0;font-size:10px;font-weight:700;letter-spacing:2px;color:#39245f;">${tagline}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 20px 0;">
              <table role="presentation" class="mb-hero" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#ece4fa" style="border-collapse:separate;background-color:#ece4fa;border:1px solid #e1d7ee;border-radius:18px;">
                <tr>
                  <td align="center" style="padding:28px 24px 30px;">
                    <img src="https://res.cloudinary.com/ooazewai/image/upload/f_png,q_auto,w_192/Mothball" alt="A lilac moth perched on a mothball" width="96" style="display:block;width:96px;max-width:96px;height:auto;border:0;margin:0 auto 14px;" />
                    <h1 class="mb-title" style="margin:0 0 12px;font-family:'Fredoka',Arial,sans-serif;font-size:34px;line-height:1.2;font-weight:500;color:#39245f;">${heading}</h1>
                    <p class="mb-text" style="margin:0 0 ${button ? "24px" : code ? "20px" : "0"};font-size:16px;line-height:1.7;color:#29233a;">${body}</p>
                    ${
                      code
                        ? `<p class="mb-muted" style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#39245f;">Your code</p>
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 auto;border-collapse:separate;">
                      <tr>
                        <td align="center" class="mb-code" bgcolor="#fffefc" style="padding:16px 28px 16px 38px;background-color:#fffefc;border:1px solid #d9d0e5;border-radius:16px;font-family:'Courier New',Courier,monospace;font-size:36px;line-height:1;font-weight:700;letter-spacing:10px;color:#39245f;">${code}</td>
                      </tr>
                    </table>`
                        : ""
                    }
                    ${
                      button
                        ? `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:${code ? "20px" : "0"} auto 0;border-collapse:separate;">
                      <tr>
                        <td align="center" class="mb-btn" bgcolor="#39245f" style="border-radius:999px;background-color:#39245f;">
                          <a href="${escapeAttr(button.url)}" target="_blank" style="display:inline-block;padding:14px 32px;font-family:'Hanken Grotesk',Arial,sans-serif;font-size:16px;font-weight:600;line-height:1;color:#ffffff;text-decoration:none;border-radius:999px;">${button.label}</a>
                        </td>
                      </tr>
                    </table>
                    <p class="mb-muted" style="margin:16px 0 0;font-size:12px;line-height:1.6;color:#39245f;">Button not working? Copy this link:<br /><a class="mb-link" href="${escapeAttr(button.url)}" target="_blank" style="color:#7a55c7;word-break:break-all;">${escapeAttr(button.url)}</a></p>`
                        : ""
                    }
                    ${
                      note
                        ? `<p class="mb-muted" style="margin:${button || code ? "16px" : "12px"} 0 0;font-size:13px;line-height:1.6;color:#5b4a7a;">${note}</p>`
                        : ""
                    }
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ${
            joke
              ? `<tr>
            <td style="padding:22px 24px 0;">
              <table role="presentation" class="mb-joke" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#f0e9fa" style="border-collapse:separate;background-color:#f0e9fa;border:1px solid #e1d7ee;border-radius:14px;">
                <tr>
                  <td align="center" style="padding:16px 20px;">
                    <p class="mb-text" style="margin:0;font-size:14px;line-height:1.7;color:#39245f;">${joke}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`
              : ""
          }
          <tr>
            <td align="center" style="padding:24px 28px 30px;">
              <p class="mb-title" style="margin:0;font-family:'Gaegu','Comic Sans MS',cursive;font-size:28px;line-height:1.3;color:#39245f;">-Nataly</p>
              <p class="mb-muted" style="margin:6px 0 0;font-size:12px;color:#39245f;">Creator of Mothball</p>
            </td>
          </tr>
        </table>
        <p class="mb-muted" style="margin:20px 0 0;max-width:400px;font-size:11px;line-height:1.7;color:#5b4a7a;">${footer}</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
