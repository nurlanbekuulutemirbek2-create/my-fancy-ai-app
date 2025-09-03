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

    // Convert date and time to proper format with validation
    let startDate: Date
    let endDate: Date

    try {
      if (date && time) {
        // Combine date and time
        const [year, month, day] = date.split('-').map(Number)
        const [hours, minutes] = time.split(':').map(Number)
        
        // Validate date components
        if (isNaN(year) || isNaN(month) || isNaN(day) || isNaN(hours) || isNaN(minutes)) {
          throw new Error('Invalid date or time format')
        }
        
        startDate = new Date(year, month - 1, day, hours, minutes)
        endDate = new Date(startDate.getTime() + 60 * 60 * 1000) // 1 hour duration
      } else if (date) {
        // Date only - all day event
        const [year, month, day] = date.split('-').map(Number)
        
        // Validate date components
        if (isNaN(year) || isNaN(month) || isNaN(day)) {
          throw new Error('Invalid date format')
        }
        
        startDate = new Date(year, month - 1, day)
        endDate = new Date(year, month - 1, day + 1) // Next day for all-day events
      } else {
        // No date specified - use today
        startDate = new Date()
        endDate = new Date(startDate.getTime() + 60 * 60 * 1000)
      }

      // Validate that dates are valid
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new Error('Invalid date created')
      }
    } catch {
      // Fallback to current date if date parsing fails
      startDate = new Date()
      endDate = new Date(startDate.getTime() + 60 * 60 * 1000)
    }

    // Format dates for Google Calendar with validation
    const formatDate = (date: Date) => {
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date for formatting')
      }
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    }

    // Create Google Calendar link
    const googleCalendarLink = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title || 'New Event')}&details=${encodeURIComponent(`${description || 'No description'}\n\nPriority: ${priority || 'Medium'}\nCategory: ${category || 'General'}\n\nCreated via Voice Magic AI Assistant`)}&dates=${formatDate(startDate)}/${formatDate(endDate)}`

    // Create Outlook Calendar link
    const outlookCalendarLink = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(title || 'New Event')}&body=${encodeURIComponent(`${description || 'No description'}\n\nPriority: ${priority || 'Medium'}\nCategory: ${category || 'General'}\n\nCreated via Voice Magic AI Assistant`)}&startdt=${startDate.toISOString()}&enddt=${endDate.toISOString()}`

    // Create Apple Calendar link
    const appleCalendarLink = `data:text/calendar;charset=utf8,BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:${formatDate(startDate)}
DTEND:${formatDate(endDate)}
SUMMARY:${title || 'New Event'}
DESCRIPTION:${description || 'No description'}\\n\\nPriority: ${priority || 'Medium'}\\nCategory: ${category || 'General'}\\n\\nCreated via Voice Magic AI Assistant
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json(
      { error: 'Failed to generate calendar links', details: errorMessage },
      { status: 500 }
    )
  }
}
