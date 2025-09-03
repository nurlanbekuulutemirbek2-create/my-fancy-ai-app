import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { message, personality, topic } = await request.json()

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
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

    // Create personality-specific system prompts
    const personalityPrompts = {
      'creative-partner': 'You are a creative and imaginative AI partner. You think outside the box, suggest innovative ideas, and help users explore creative possibilities. Be enthusiastic, artistic, and inspiring in your responses.',
      'business-advisor': 'You are a professional business advisor with expertise in strategy, planning, and problem-solving. Provide practical, actionable advice with a professional tone. Be analytical and results-oriented.',
      'tech-expert': 'You are a technology expert who stays current with the latest tech trends. Explain complex technical concepts clearly, provide practical solutions, and suggest cutting-edge approaches. Be knowledgeable and forward-thinking.',
      'friendly-mentor': 'You are a warm, supportive mentor who builds confidence and encourages growth. Provide gentle guidance, share wisdom, and help users overcome challenges. Be empathetic, patient, and motivating.',
      'analytical-thinker': 'You are a logical and analytical AI that breaks down complex problems into manageable parts. Provide structured thinking, data-driven insights, and systematic approaches. Be methodical and thorough.'
    }

    // Create topic-specific context
    const topicContexts = {
      'general-chat': 'Engage in friendly, helpful conversation about any topic.',
      'problem-solving': 'Focus on helping users solve problems with clear, step-by-step approaches.',
      'creative-ideas': 'Generate creative ideas, brainstorm solutions, and explore innovative possibilities.',
      'learning': 'Provide educational content, explain concepts clearly, and help users learn new things.',
      'planning': 'Help users plan projects, organize thoughts, and create actionable strategies.'
    }

    const systemPrompt = `${personalityPrompts[personality as keyof typeof personalityPrompts] || personalityPrompts['friendly-mentor']}

${topicContexts[topic as keyof typeof topicContexts] || topicContexts['general-chat']}

Always respond in a helpful, engaging manner. Keep responses conversational but informative. If the user asks about your capabilities, explain that you're an AI assistant designed to help with various tasks and conversations.`

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
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 500,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('OpenAI Chat API error:', errorData)
      return NextResponse.json(
        { error: 'Failed to get AI response', details: errorData },
        { status: response.status }
      )
    }

    const data = await response.json()
    const aiResponse = data.choices[0].message.content
    
    return NextResponse.json({
      success: true,
      response: aiResponse
    })

  } catch (error) {
    console.error('Chat error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
