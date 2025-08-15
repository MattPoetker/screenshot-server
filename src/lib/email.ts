import postmark from 'postmark'

const client = new postmark.ServerClient(
  process.env.POSTMARK_SERVER_TOKEN || ''
)

export interface EmailOptions {
  to: string | string[]
  subject: string
  htmlBody?: string
  textBody?: string
  from?: string
}

export async function sendEmail(options: EmailOptions) {
  try {
    console.log(`[${new Date().toISOString()}] Sending email to: ${Array.isArray(options.to) ? options.to.join(', ') : options.to}`)
    
    if (!process.env.POSTMARK_SERVER_TOKEN) {
      throw new Error('POSTMARK_SERVER_TOKEN not configured')
    }

    const from = options.from || process.env.EMAIL_FROM || 'NiceShot <noreply@nice-shot.io>'
    
    // Handle multiple recipients
    const recipients = Array.isArray(options.to) ? options.to : [options.to]
    
    const emailPromises = recipients.map(recipient => 
      client.sendEmail({
        From: from,
        To: recipient,
        Subject: options.subject,
        HtmlBody: options.htmlBody || '',
        TextBody: options.textBody || options.htmlBody?.replace(/<[^>]*>/g, '') || '',
        MessageStream: 'outbound'
      })
    )

    const results = await Promise.all(emailPromises)
    console.log(`[${new Date().toISOString()}] Email(s) sent successfully`)
    
    return { success: true, results }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Email sending failed:`, error)
    
    // Check for specific Postmark errors
    if (error instanceof Error) {
      if (error.message.includes('not approved to send email')) {
        throw new Error('Postmark account not approved. Please verify your domain and sender signatures in the Postmark dashboard.')
      }
      if (error.message.includes('Invalid sender signature')) {
        throw new Error('Invalid sender email. Please add and verify this email as a sender signature in Postmark.')
      }
    }
    
    throw error
  }
}

// Email templates
export const emailTemplates = {
  emailVerification: (verificationUrl: string, username: string) => ({
    subject: 'Verify your NiceShot API account',
    htmlBody: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4f46e5;">Welcome to NiceShot API!</h2>
        <p>Hi ${username},</p>
        <p>Thank you for signing up for NiceShot API. To complete your registration, please verify your email address by clicking the button below:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" 
             style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Verify Email Address
          </a>
        </div>
        
        <p>Or copy and paste this link into your browser:</p>
        <p style="color: #6b7280; word-break: break-all;">${verificationUrl}</p>
        
        <p>This verification link will expire in 24 hours.</p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 14px;">
          If you didn't create an account with NiceShot API, you can safely ignore this email.
        </p>
      </div>
    `,
    textBody: `
Welcome to NiceShot API!

Hi ${username},

Thank you for signing up for NiceShot API. To complete your registration, please verify your email address by visiting:

${verificationUrl}

This verification link will expire in 24 hours.

If you didn't create an account with NiceShot API, you can safely ignore this email.
    `
  }),

  passwordReset: (resetUrl: string, username: string) => ({
    subject: 'Reset your NiceShot API password',
    htmlBody: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4f46e5;">Password Reset Request</h2>
        <p>Hi ${username},</p>
        <p>We received a request to reset your password for your NiceShot API account.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Reset Password
          </a>
        </div>
        
        <p>Or copy and paste this link into your browser:</p>
        <p style="color: #6b7280; word-break: break-all;">${resetUrl}</p>
        
        <p>This reset link will expire in 1 hour.</p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 14px;">
          If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.
        </p>
      </div>
    `,
    textBody: `
Password Reset Request

Hi ${username},

We received a request to reset your password for your NiceShot API account.

To reset your password, visit:
${resetUrl}

This reset link will expire in 1 hour.

If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.
    `
  }),

  welcomeEmail: (username: string, dashboardUrl: string) => ({
    subject: 'Welcome to NiceShot API! 🎉',
    htmlBody: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4f46e5;">Welcome to NiceShot API! 🎉</h2>
        <p>Hi ${username},</p>
        <p>Your account has been successfully verified and you're all set to start using NiceShot API!</p>
        
        <h3>What's next?</h3>
        <ul>
          <li><strong>Create API Keys:</strong> Generate API keys to start capturing screenshots</li>
          <li><strong>Read the Documentation:</strong> Learn about all available features and options</li>
          <li><strong>Start Free:</strong> You get 500 free screenshots every month</li>
        </ul>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${dashboardUrl}" 
             style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Go to Dashboard
          </a>
        </div>
        
        <h3>Quick Start Example:</h3>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; font-family: monospace; font-size: 14px;">
          curl -X POST https://nice-shot.io/api/screenshot \\<br>
          &nbsp;&nbsp;-H "Authorization: Bearer YOUR_API_KEY" \\<br>
          &nbsp;&nbsp;-H "Content-Type: application/json" \\<br>
          &nbsp;&nbsp;-d '{"url": "https://example.com"}'
        </div>
        
        <p>Happy screenshotting! 📸</p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 14px;">
          Need help? Reply to this email or check out our documentation.
        </p>
      </div>
    `,
    textBody: `
Welcome to NiceShot API! 🎉

Hi ${username},

Your account has been successfully verified and you're all set to start using NiceShot API!

What's next?
- Create API Keys: Generate API keys to start capturing screenshots
- Read the Documentation: Learn about all available features and options
- Start Free: You get 500 free screenshots every month

Go to your dashboard: ${dashboardUrl}

Quick Start Example:
curl -X POST https://nice-shot.io/api/screenshot \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"url": "https://example.com"}'

Happy screenshotting! 📸

Need help? Reply to this email or check out our documentation.
    `
  })
}

// Test email function (for development/testing)
export async function sendTestEmail(to: string) {
  return sendEmail({
    to,
    subject: 'NiceShot API - Test Email',
    htmlBody: `
      <h2>🧪 Test Email Successful!</h2>
      <p>This is a test email from NiceShot API.</p>
      <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
      <p><strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}</p>
    `,
    textBody: `
NiceShot API - Test Email

This is a test email from NiceShot API.

Timestamp: ${new Date().toISOString()}
Environment: ${process.env.NODE_ENV || 'development'}
    `
  })
}