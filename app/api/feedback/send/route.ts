import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { z } from 'zod'

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY)

// Admin email for feedback
const ADMIN_EMAIL = 'mtsmmiv@gmail.com'

// Validation schema
const FeedbackSchema = z.object({
  category: z.enum(['Bug/Problem', 'Feature-Request', 'Allgemeines Feedback']),
  email: z.string().email('Ungültige Email-Adresse'),
  message: z.string().min(10, 'Nachricht muss mindestens 10 Zeichen lang sein'),
})

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json()
    const validationResult = FeedbackSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Ungültige Daten', details: validationResult.error.flatten() },
        { status: 400 }
      )
    }

    const { category, email, message } = validationResult.data

    // Get category emoji
    const categoryEmoji = category === 'Bug/Problem' ? '🐛' : category === 'Feature-Request' ? '✨' : '💭'

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: 'Literary Forge Feedback <onboarding@resend.dev>', // Use your verified domain later
      to: [ADMIN_EMAIL],
      replyTo: email,
      subject: `${categoryEmoji} ${category} - Literary Forge Feedback`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                background-color: #0a0a0a;
                color: #ffffff;
                margin: 0;
                padding: 20px;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #171717;
                border: 1px solid #262626;
                border-radius: 8px;
                padding: 30px;
              }
              .header {
                font-size: 24px;
                font-weight: bold;
                margin-bottom: 20px;
                color: #ffffff;
              }
              .category-badge {
                display: inline-block;
                background-color: #262626;
                color: #ffffff;
                padding: 6px 12px;
                border-radius: 6px;
                font-size: 14px;
                font-weight: 600;
                margin-bottom: 20px;
              }
              .info-row {
                margin-bottom: 15px;
              }
              .label {
                color: #9ca3af;
                font-size: 12px;
                font-weight: 600;
                text-transform: uppercase;
                margin-bottom: 5px;
              }
              .value {
                color: #ffffff;
                font-size: 14px;
              }
              .message-box {
                background-color: #0a0a0a;
                border: 1px solid #262626;
                border-radius: 6px;
                padding: 15px;
                margin-top: 20px;
                white-space: pre-wrap;
                line-height: 1.6;
                color: #e5e7eb;
              }
              .footer {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #262626;
                color: #9ca3af;
                font-size: 12px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">${categoryEmoji} Neues Feedback - Literary Forge</div>

              <div class="category-badge">${category}</div>

              <div class="info-row">
                <div class="label">Von:</div>
                <div class="value">${email}</div>
              </div>

              <div class="info-row">
                <div class="label">Kategorie:</div>
                <div class="value">${category}</div>
              </div>

              <div class="info-row">
                <div class="label">Nachricht:</div>
                <div class="message-box">${message.replace(/\n/g, '<br>')}</div>
              </div>

              <div class="footer">
                <p>Diese Nachricht wurde über das Feedback-Formular auf Literary Forge gesendet.</p>
                <p>Du kannst direkt auf diese Email antworten, um mit dem Nutzer zu kommunizieren.</p>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `
Neues Feedback - Literary Forge

Kategorie: ${category}
Von: ${email}

Nachricht:
${message}

---
Diese Nachricht wurde über das Feedback-Formular auf Literary Forge gesendet.
Du kannst direkt auf diese Email antworten, um mit dem Nutzer zu kommunizieren.
      `.trim(),
    })

    if (error) {
      console.error('Resend email error:', error)
      return NextResponse.json(
        { error: 'Email konnte nicht gesendet werden. Bitte versuche es später erneut.' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: true, messageId: data?.id },
      { status: 200 }
    )
  } catch (error) {
    console.error('Feedback API error:', error)
    return NextResponse.json(
      { error: 'Ein unerwarteter Fehler ist aufgetreten.' },
      { status: 500 }
    )
  }
}
