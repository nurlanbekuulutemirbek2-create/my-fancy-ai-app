import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { transcription } = await request.json()

    if (!transcription) {
      return NextResponse.json(
        { error: 'Transcription is required' },
        { status: 400 }
      )
    }

    // Get OpenAI API key from environment
    const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    // Create a prompt for task extraction
    const systemPrompt = `You are an AI assistant that extracts tasks and events from voice recordings. 
    Analyze the transcription and identify specific tasks, appointments, meetings, and events.
    
    For each item, provide:
    - title: A clear, concise title
    - type: "task" or "event"
    - description: Brief description
    - date: If mentioned, use YYYY-MM-DD format, otherwise "today" or "tomorrow"
    - time: If mentioned, use HH:MM format (24-hour), otherwise null
    - priority: "low", "medium", or "high" based on urgency
    - category: "work", "personal", "health", "shopping", "travel", or "other"
    
    Return a JSON array of objects. Only include items that are clearly actionable or time-specific.`

    const userPrompt = `Please extract tasks and events from this voice recording:
    
    "${transcription}"
    
    Return only the JSON array, no additional text.`

    // Call OpenAI GPT API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 1000
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('OpenAI GPT API error:', errorData)
      return NextResponse.json(
        { error: 'Failed to extract tasks', details: errorData },
        { status: response.status }
      )
    }

    const data = await response.json()
    const content = data.choices[0].message.content
    
    // Parse the JSON response
    let tasks
    try {
      // Extract JSON from the response (remove any markdown formatting)
      const jsonMatch = content.match(/\[.*\]/s)
      if (jsonMatch) {
        tasks = JSON.parse(jsonMatch[0])
      } else {
        tasks = JSON.parse(content)
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError)
      return NextResponse.json(
        { error: 'Failed to parse AI response' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      tasks: tasks
    })

  } catch (error) {
    console.error('Task extraction error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
