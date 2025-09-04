import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('Transcription request received')
    
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File
    const language = formData.get('language') as string | null

    console.log('Request data:', {
      hasAudioFile: !!audioFile,
      audioFileSize: audioFile?.size,
      audioFileType: audioFile?.type,
      language: language
    })

    if (!audioFile) {
      return NextResponse.json(
        { error: 'Audio file is required' },
        { status: 400 }
      )
    }

    // Get OpenAI API key from environment
    const apiKey = process.env.OPENAI_API_KEY

    console.log('API key check:', {
      hasApiKey: !!apiKey,
      apiKeyLength: apiKey?.length
    })

    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured. Please check your environment variables.' },
        { status: 500 }
      )
    }


    
    // Create a new FormData with the required model parameter
    const whisperFormData = new FormData()
    whisperFormData.append('file', audioFile)
    whisperFormData.append('model', 'whisper-1')
    
    // Add language if specified (Whisper will auto-detect if not provided)
    if (language && language !== 'en-US') {
      // Convert language codes to Whisper format (e.g., 'en-US' -> 'en', 'es-ES' -> 'es')
      const langCode = language.split('-')[0]
      whisperFormData.append('language', langCode)
    }

    console.log('Sending request to OpenAI Whisper API...')
    
    // Call OpenAI Whisper API
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: whisperFormData
    })
    
    console.log('OpenAI API response:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    })

    if (!response.ok) {
      let errorData: Record<string, unknown> = {}
      let errorMessage = 'Failed to transcribe audio'
      
      try {
        errorData = await response.json()
        console.error('OpenAI Whisper API error:', errorData)
        
        // Extract the actual error message from OpenAI response
        if (errorData.error && typeof errorData.error === 'object' && 'message' in errorData.error) {
          errorMessage = String(errorData.error.message)
        } else if (errorData.error) {
          errorMessage = String(errorData.error)
        }
      } catch (parseError) {
        console.error('Failed to parse OpenAI error response:', parseError)
        errorMessage = `HTTP ${response.status}: ${response.statusText}`
      }
      
      return NextResponse.json(
        { 
          error: errorMessage,
          details: errorData,
          status: response.status,
          statusText: response.statusText
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    return NextResponse.json({
      success: true,
      transcription: data.text
    })

  } catch (error) {
    console.error('Transcription error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json(
      { 
        error: errorMessage,
        details: { 
          type: 'internal_error',
          message: errorMessage,
          stack: error instanceof Error ? error.stack : undefined
        },
        status: 500,
        statusText: 'Internal Server Error'
      },
      { status: 500 }
    )
  }
}
