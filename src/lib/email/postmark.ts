import { ServerClient } from 'postmark'
import crypto from 'crypto'

// Initialize Postmark client
const postmarkToken = process.env.POSTMARK_SERVER_TOKEN
const postmarkClient = postmarkToken ? new ServerClient(postmarkToken) : null

// Email configuration
const FROM_EMAIL = process.env.EMAIL_FROM || 'noreply@niceshot.api'
const APP_NAME = 'NiceShot API'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export interface EmailOptions {
  to: string
  subject: string
  htmlBody: string
  textBody?: string
  tag?: string
  messageStream?: string
}

export interface VerificationEmailData {
  email: string
  username: string
  verificationToken: string
}

export interface WelcomeEmailData {
  email: string
  username: string
}

export interface PasswordResetEmailData {
  email: string
  username: string
  resetToken: string
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  if (!postmarkClient) {
    console.warn('Postmark client not initialized. Email not sent:', options.subject)
    // In development, log the email details
    if (process.env.NODE_ENV === 'development') {
      console.log('Development mode - Email details:')
      console.log('To:', options.to)
      console.log('Subject:', options.subject)
      console.log('HTML:', options.htmlBody)
    }
    return false
  }

  try {
    const response = await postmarkClient.sendEmail({
      From: FROM_EMAIL,
      To: options.to,
      Subject: options.subject,
      HtmlBody: options.htmlBody,
      TextBody: options.textBody || stripHtml(options.htmlBody),
      Tag: options.tag,
      MessageStream: options.messageStream || 'outbound'
    })

    console.log('Email sent successfully:', response.MessageID)
    return true
  } catch (error) {
    console.error('Failed to send email:', error)
    return false
  }
}

export async function sendVerificationEmail(data: VerificationEmailData): Promise<boolean> {
  const verificationUrl = `${APP_URL}/verify-email?token=${data.verificationToken}`
  
  const htmlBody = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Verify Your Email</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${APP_NAME}</h1>
          </div>
          <div class="content">
            <h2>Welcome, ${data.username}!</h2>
            <p>Thanks for signing up for ${APP_NAME}. Please verify your email address to get started.</p>
            <p style="text-align: center;">
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #667eea;">${verificationUrl}</p>
            <p>This link will expire in 24 hours.</p>
            <div class="footer">
              <p>If you didn't create an account with ${APP_NAME}, please ignore this email.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `

  return sendEmail({
    to: data.email,
    subject: `Verify your email for ${APP_NAME}`,
    htmlBody,
    tag: 'verification'
  })
}

export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<boolean> {
  const dashboardUrl = `${APP_URL}/dashboard`
  const apiKeysUrl = `${APP_URL}/api-keys`
  
  const htmlBody = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome to ${APP_NAME}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
          .feature { padding: 15px; background: #f8f8f8; border-radius: 5px; margin: 10px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to ${APP_NAME}!</h1>
          </div>
          <div class="content">
            <h2>Hi ${data.username}!</h2>
            <p>Your email has been verified and your account is now active. Here's how to get started:</p>
            
            <div class="feature">
              <h3>🔑 Create Your First API Key</h3>
              <p>Generate an API key to start taking screenshots programmatically.</p>
            </div>
            
            <div class="feature">
              <h3>📸 Take Your First Screenshot</h3>
              <p>Use our simple API to capture any website as an image.</p>
            </div>
            
            <div class="feature">
              <h3>📊 Track Your Usage</h3>
              <p>Monitor your screenshot usage and performance in the dashboard.</p>
            </div>
            
            <p style="text-align: center;">
              <a href="${dashboardUrl}" class="button">Go to Dashboard</a>
              <a href="${apiKeysUrl}" class="button">Create API Key</a>
            </p>
            
            <div class="footer">
              <p>Need help? Check out our <a href="${APP_URL}/docs">documentation</a> or contact support.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `

  return sendEmail({
    to: data.email,
    subject: `Welcome to ${APP_NAME}!`,
    htmlBody,
    tag: 'welcome'
  })
}

export async function sendPasswordResetEmail(data: PasswordResetEmailData): Promise<boolean> {
  const resetUrl = `${APP_URL}/reset-password?token=${data.resetToken}`
  
  const htmlBody = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Reset Your Password</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 10px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${APP_NAME}</h1>
          </div>
          <div class="content">
            <h2>Password Reset Request</h2>
            <p>Hi ${data.username},</p>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <p style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>
            <div class="warning">
              <strong>⚠️ Important:</strong> This link will expire in 1 hour for security reasons.
            </div>
            <div class="footer">
              <p>If you didn't request a password reset, please ignore this email. Your password won't be changed.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `

  return sendEmail({
    to: data.email,
    subject: `Password Reset Request - ${APP_NAME}`,
    htmlBody,
    tag: 'password-reset'
  })
}

// Helper function to strip HTML tags for text version
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>?/gm, '').trim()
}

// Generate secure tokens
export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

export function generatePasswordResetToken(): string {
  return crypto.randomBytes(32).toString('hex')
}