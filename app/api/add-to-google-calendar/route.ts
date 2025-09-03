import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'

// Google Calendar API configuration
const SCOPES = ['https://www.googleapis.com/auth/calendar.events']
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback'

// Initialize Google OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI
)

export async function POST(request: NextRequest) {
  try {
    const { task, accessToken } = await request.json()

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Google Calendar access token required' },
        { status: 400 }
      )
    }

    if (!task) {
      return NextResponse.json(
        { error: 'Task data required' },
        { status: 400 }
      )
    }

    // Set the access token
    oauth2Client.setCredentials({
      access_token: accessToken
    })

    // Create Google Calendar service
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

    // Parse the task data
    const { title, description, date, time, priority, category } = task

    // Convert date and time to ISO string
    let startDate: Date
    let endDate: Date

    if (date && time) {
      // Combine date and time
      const [year, month, day] = date.split('-').map(Number)
      const [hours, minutes] = time.split(':').map(Number)
      startDate = new Date(year, month - 1, day, hours, minutes)
      endDate = new Date(startDate.getTime() + 60 * 60 * 1000) // 1 hour duration
    } else if (date) {
      // Date only - all day event
      const [year, month, day] = date.split('-').map(Number)
      startDate = new Date(year, month - 1, day)
      endDate = new Date(year, month - 1, day + 1) // Next day for all-day events
    } else {
      // No date specified - use today
      startDate = new Date()
      endDate = new Date(startDate.getTime() + 60 * 60 * 1000)
    }

    // Create calendar event
    const event = {
      summary: title,
      description: `${description}\n\nPriority: ${priority}\nCategory: ${category}\n\nCreated via Voice Magic AI Assistant`,
      start: {
        date: !time ? startDate.toISOString().split('T')[0] : startDate.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        date: !time ? endDate.toISOString().split('T')[0] : endDate.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      colorId: getPriorityColor(priority),
      reminders: {
        useDefault: false,
        overrides: [
          {
            method: 'popup',
            minutes: 15
          },
          {
            method: 'email',
            minutes: 60
          }
        ]
      }
    }

    // Insert the event into the primary calendar
    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
    })

    return NextResponse.json({
      success: true,
      eventId: response.data.id,
      eventLink: response.data.htmlLink,
      message: 'Event successfully added to Google Calendar'
    })

  } catch (error) {
    console.error('Google Calendar API error:', error)
    return NextResponse.json(
      { error: 'Failed to add event to Google Calendar', details: error.message },
      { status: 500 }
    )
  }
}

// Helper function to get color based on priority
function getPriorityColor(priority: string): string {
  switch (priority?.toLowerCase()) {
    case 'high':
      return '11' // Red
    case 'medium':
      return '5'  // Yellow
    case 'low':
      return '2'  // Green
    default:
      return '1'  // Default blue
  }
}

// GET endpoint to get Google OAuth URL
export async function GET() {
  try {
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent'
    })

    return NextResponse.json({
      authUrl,
      message: 'Google OAuth URL generated successfully'
    })
  } catch (error) {
    console.error('Error generating OAuth URL:', error)
    return NextResponse.json(
      { error: 'Failed to generate OAuth URL' },
      { status: 500 }
    )
  }
}
