import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { task } = await request.json()

    if (!task) {
      return NextResponse.json(
        { error: 'Task data required' },
        { status: 400 }
      )
    }

    const { title, description, date, time, priority, category } = task

    // Convert date and time to proper format
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

    // Format dates for Google Calendar
    const formatDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    }

    // Create Google Calendar link
    const googleCalendarLink = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&details=${encodeURIComponent(`${description}\n\nPriority: ${priority}\nCategory: ${category}\n\nCreated via Voice Magic AI Assistant`)}&dates=${formatDate(startDate)}/${formatDate(endDate)}`

    // Create Outlook Calendar link
    const outlookCalendarLink = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${description}\n\nPriority: ${priority}\nCategory: ${category}\n\nCreated via Voice Magic AI Assistant`)}&startdt=${startDate.toISOString()}&enddt=${endDate.toISOString()}`

    // Create Apple Calendar link
    const appleCalendarLink = `data:text/calendar;charset=utf8,BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
URL:${encodeURIComponent(window.location.href)}
DTSTART:${formatDate(startDate)}
DTEND:${formatDate(endDate)}
SUMMARY:${title}
DESCRIPTION:${description}\\n\\nPriority: ${priority}\\nCategory: ${category}\\n\\nCreated via Voice Magic AI Assistant
END:VEVENT
END:VCALENDAR`

    return NextResponse.json({
      success: true,
      calendarLinks: {
        google: googleCalendarLink,
        outlook: outlookCalendarLink,
        apple: appleCalendarLink
      },
      message: 'Calendar links generated successfully'
    })

  } catch (error) {
    console.error('Calendar link generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate calendar links', details: error.message },
      { status: 500 }
    )
  }
}
