import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { prompt, style, size } = await request.json()

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
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

    // Map size to OpenAI format
    const sizeMap: { [key: string]: string } = {
      '512x512': '512x512',
      '1024x1024': '1024x1024',
      '1024x1792': '1024x1792',
      '1792x1024': '1792x1024'
    }

    // Map style to enhanced prompt
    const styleEnhancers: { [key: string]: string } = {
      'realistic': 'photorealistic, highly detailed, professional photography',
      'artistic': 'artistic, creative, stylized, painterly',
      'cartoon': 'cartoon style, animated, fun, colorful',
      'abstract': 'abstract art, non-representational, modern art',
      'vintage': 'vintage style, retro, classic, nostalgic',
      'fantasy': 'fantasy art, magical, mystical, ethereal'
    }

    // Enhance prompt with style
    const enhancedPrompt = `${prompt}, ${styleEnhancers[style] || styleEnhancers.realistic}`

    // Call OpenAI DALL-E API
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: enhancedPrompt,
        n: 1,
        size: sizeMap[size] || '1024x1024',
        quality: 'standard',
        response_format: 'url'
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('OpenAI API error:', errorData)
      return NextResponse.json(
        { error: 'Failed to generate image', details: errorData },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    return NextResponse.json({
      success: true,
      imageUrl: data.data[0].url,
      revisedPrompt: data.data[0].revised_prompt
    })

  } catch (error) {
    console.error('Image generation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
