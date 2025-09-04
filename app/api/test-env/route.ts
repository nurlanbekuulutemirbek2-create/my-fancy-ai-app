import { NextResponse } from 'next/server'

export async function GET() {
  const envCheck = {
    hasOpenAIKey: !!process.env.OPENAI_API_KEY,
    openAIKeyLength: process.env.OPENAI_API_KEY?.length || 0,
    hasNextPublicOpenAIKey: !!process.env.NEXT_PUBLIC_OPENAI_API_KEY,
    nodeEnv: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  }
  
  console.log('Environment check:', envCheck)
  
  return NextResponse.json({
    success: true,
    environment: envCheck
  })
}
