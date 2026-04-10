import nodemailer from "nodemailer";

export const sendOTPEmail = async (email, otp) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"My App" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Your Verification Code",
    html: `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
          <title>OTP Verification</title>
        </head>
        <body style="margin:0; padding:0; background-color:#f4f6f9; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">

          <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 0;">
            <tr>
              <td align="center">

                <!-- Card -->
                <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:16px; overflow:hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">

                  <!-- Header -->
                  <tr>
                    <td align="center" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 40px 30px;">
                      <div style="background:rgba(255,255,255,0.15); width:64px; height:64px; border-radius:50%; display:inline-block; line-height:64px; font-size:30px; margin-bottom:16px;">
                        🔐
                      </div>
                      <h1 style="margin:0; color:#ffffff; font-size:24px; font-weight:700; letter-spacing:-0.5px;">
                        Verification Code
                      </h1>
                      <p style="margin:8px 0 0; color:rgba(255,255,255,0.85); font-size:14px;">
                        Use the code below to verify your identity
                      </p>
                    </td>
                  </tr>

                  <!-- Body -->
                  <tr>
                    <td style="padding: 40px;">

                      <p style="margin:0 0 24px; color:#4a5568; font-size:15px; line-height:1.6;">
                        Hi there 👋,<br/>
                        We received a request that requires verification. Use the one-time code below — it's valid for <strong>5 minutes</strong>.
                      </p>

                      <!-- OTP Box -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                        <tr>
                          <td align="center" style="background:#f0f0ff; border: 2px dashed #667eea; border-radius:12px; padding: 28px 20px;">
                            <p style="margin:0 0 6px; color:#667eea; font-size:12px; font-weight:600; letter-spacing:2px; text-transform:uppercase;">
                              Your OTP Code
                            </p>
                            <p style="margin:0; color:#2d3748; font-size:42px; font-weight:800; letter-spacing:12px; font-family: 'Courier New', monospace;">
                              ${otp}
                            </p>
                          </td>
                        </tr>
                      </table>

                      <!-- Warning -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                        <tr>
                          <td style="background:#fff8ed; border-left:4px solid #f6ad55; border-radius:0 8px 8px 0; padding:14px 16px;">
                            <p style="margin:0; color:#744210; font-size:13px; line-height:1.5;">
                              ⚠️ <strong>Never share this code</strong> with anyone. Our team will never ask for your OTP.
                              If you didn't request this, please ignore this email.
                            </p>
                          </td>
                        </tr>
                      </table>

                      <!-- Timer -->
                      <p style="margin:0; color:#718096; font-size:13px; text-align:center;">
                        ⏱ This code expires in <strong style="color:#e53e3e;">5 minutes</strong>
                      </p>

                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td align="center" style="background:#f7fafc; padding:24px 40px; border-top:1px solid #e2e8f0;">
                      <p style="margin:0 0 4px; color:#a0aec0; font-size:12px;">
                        This is an automated message — please do not reply.
                      </p>
                      <p style="margin:0; color:#a0aec0; font-size:12px;">
                        © ${new Date().getFullYear()} My App. All rights reserved.
                      </p>
                    </td>
                  </tr>

                </table>
                <!-- End Card -->

              </td>
            </tr>
          </table>

        </body>
      </html>
    `,
  });
};
export const sendResetPasswordEmail = async (email, resetLink) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"My App" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Reset Your Password",
    html: `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8"/>
          <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
          <title>Reset Password</title>
        </head>
        <body style="margin:0; padding:0; background-color:#f4f6f9; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">

          <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
            <tr>
              <td align="center">

                <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.08);">

                  <!-- Header -->
                  <tr>
                    <td align="center" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding:40px 40px 30px;">
                      <div style="background:rgba(255,255,255,0.15); width:64px; height:64px; border-radius:50%; display:inline-block; line-height:64px; font-size:30px; margin-bottom:16px;">
                        🔑
                      </div>
                      <h1 style="margin:0; color:#ffffff; font-size:24px; font-weight:700; letter-spacing:-0.5px;">
                        Reset Your Password
                      </h1>
                      <p style="margin:8px 0 0; color:rgba(255,255,255,0.85); font-size:14px;">
                        We received a request to reset your password
                      </p>
                    </td>
                  </tr>

                  <!-- Body -->
                  <tr>
                    <td style="padding:40px;">

                      <p style="margin:0 0 24px; color:#4a5568; font-size:15px; line-height:1.6;">
                        Hi there 👋,<br/>
                        Click the button below to reset your password. This link is valid for <strong>15 minutes</strong> and can only be used <strong>once</strong>.
                      </p>

                      <!-- Button -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                        <tr>
                          <td align="center">
                            <a href="${resetLink}" target="_blank"
                              style="display:inline-block; background:linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color:#ffffff; text-decoration:none; font-size:16px; font-weight:700; padding:16px 40px; border-radius:50px; letter-spacing:0.5px;">
                              Reset My Password →
                            </a>
                          </td>
                        </tr>
                      </table>

                      <!-- Fallback link -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                        <tr>
                          <td style="background:#f7fafc; border-radius:8px; padding:14px 16px;">
                            <p style="margin:0 0 6px; color:#718096; font-size:12px;">
                              If the button doesn't work, copy and paste this link:
                            </p>
                            <p style="margin:0; color:#667eea; font-size:12px; word-break:break-all;">
                              ${resetLink}
                            </p>
                          </td>
                        </tr>
                      </table>

                      <!-- Warning -->
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="background:#fff8ed; border-left:4px solid #f6ad55; border-radius:0 8px 8px 0; padding:14px 16px;">
                            <p style="margin:0; color:#744210; font-size:13px; line-height:1.5;">
                              ⚠️ If you didn't request a password reset, you can safely ignore this email. Your password will not change.
                            </p>
                          </td>
                        </tr>
                      </table>

                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td align="center" style="background:#f7fafc; padding:24px 40px; border-top:1px solid #e2e8f0;">
                      <p style="margin:0 0 4px; color:#a0aec0; font-size:12px;">
                        This is an automated message — please do not reply.
                      </p>
                      <p style="margin:0; color:#a0aec0; font-size:12px;">
                        © ${new Date().getFullYear()} My App. All rights reserved.
                      </p>
                    </td>
                  </tr>

                </table>

              </td>
            </tr>
          </table>

        </body>
      </html>
    `,
  });
};