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

    // Create a more specific prompt for task extraction
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
    
    IMPORTANT: Return ONLY a valid JSON array. Do not include any other text, explanations, or markdown formatting.
    Example format:
    [
      {
        "title": "Practice guitar",
        "type": "task",
        "description": "Play guitar in the evening",
        "date": "today",
        "time": null,
        "priority": "medium",
        "category": "personal"
      }
    ]`

    const userPrompt = `Extract tasks and events from this voice recording: "${transcription}"

Return ONLY the JSON array, no additional text or formatting.`

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
        temperature: 0.1, // Lower temperature for more consistent JSON output
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
    
    console.log('Raw AI response:', content) // Debug log
    
    // Parse the JSON response with multiple fallback strategies
    let tasks
    try {
      // First, try to parse the content directly
      tasks = JSON.parse(content)
    } catch (firstError) {
      console.log('Direct parsing failed, trying regex extraction...')
      
      try {
        // Try to extract JSON array using regex
        const jsonMatch = content.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
          tasks = JSON.parse(jsonMatch[0])
        } else {
          // If no array found, try to find any JSON object
          const objectMatch = content.match(/\{[\s\S]*\}/)
          if (objectMatch) {
            const parsedObject = JSON.parse(objectMatch[0])
            tasks = [parsedObject] // Wrap single object in array
          } else {
            throw new Error('No valid JSON found in response')
          }
        }
      } catch (secondError) {
        console.log('Regex extraction failed, trying to clean and parse...')
        
        try {
          // Try to clean the response and parse
          let cleanedContent = content
            .replace(/```json/g, '')
            .replace(/```/g, '')
            .trim()
          
          // Remove any text before the first [
          const startIndex = cleanedContent.indexOf('[')
          if (startIndex > 0) {
            cleanedContent = cleanedContent.substring(startIndex)
          }
          
          // Remove any text after the last ]
          const endIndex = cleanedContent.lastIndexOf(']')
          if (endIndex > 0 && endIndex < cleanedContent.length - 1) {
            cleanedContent = cleanedContent.substring(0, endIndex + 1)
          }
          
          tasks = JSON.parse(cleanedContent)
        } catch (thirdError) {
          console.error('All parsing attempts failed:', {
            firstError: firstError instanceof Error ? firstError.message : 'Unknown error',
            secondError: secondError instanceof Error ? secondError.message : 'Unknown error',
            thirdError: thirdError instanceof Error ? thirdError.message : 'Unknown error',
            content: content
          })
          
          // Create a fallback task based on the transcription
          tasks = [{
            title: "Voice recording task",
            type: "task",
            description: transcription,
            date: "today",
            time: null,
            priority: "medium",
            category: "personal"
          }]
        }
      }
    }
    
    // Validate that tasks is an array
    if (!Array.isArray(tasks)) {
      console.log('Tasks is not an array, wrapping in array...')
      tasks = [tasks]
    }
    
    // Validate each task has required fields
    tasks = tasks.map(task => ({
      title: task.title || "Untitled task",
      type: task.type || "task",
      description: task.description || task.title || "No description",
      date: task.date || "today",
      time: task.time || null,
      priority: task.priority || "medium",
      category: task.category || "other"
    }))
    
    console.log('Final parsed tasks:', tasks) // Debug log
    
    return NextResponse.json({
      success: true,
      tasks: tasks
    })

  } catch (error) {
    console.error('Task extraction error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json(
      { error: 'Failed to extract tasks', details: errorMessage },
      { status: 500 }
    )
  }
}
