'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Bot, Send, User, ArrowLeft, Lightbulb, MessageCircle, Copy, Download, Mic, MicOff, Square, Calendar, Clock, CheckCircle, Plus, Loader2, AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
  type: 'text' | 'suggestion' | 'action'
}

interface Conversation {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
}

interface ExtractedTask {
  title: string
  type: 'task' | 'event'
  description: string
  date: string
  time: string | null
  priority: 'low' | 'medium' | 'high'
  category: string
}

interface VoiceNote {
  id: string
  transcription: string
  tasks: ExtractedTask[]
  timestamp: Date
  duration: number
  language: string
}

export default function AIBuddyPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null)
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [selectedPersonality, setSelectedPersonality] = useState('friendly-mentor')
  const [selectedTopic, setSelectedTopic] = useState('general-chat')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Voice recording states
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [isExtractingTasks, setIsExtractingTasks] = useState(false)
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [transcription, setTranscription] = useState('')
  const [extractedTasks, setExtractedTasks] = useState<ExtractedTask[]>([])
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set())
  const [voiceNotes, setVoiceNotes] = useState<VoiceNote[]>([])
  const [error, setError] = useState('')
  const [language, setLanguage] = useState('en-US')
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const personalities = [
    { 
      value: 'friendly-mentor', 
      label: 'Friendly Mentor', 
      description: 'Warm, supportive, and encouraging',
      color: 'bg-blue-100 text-blue-800'
    },
    { 
      value: 'creative-partner', 
      label: 'Creative Partner', 
      description: 'Imaginative and artistic',
      color: 'bg-purple-100 text-purple-800'
    },
    { 
      value: 'business-advisor', 
      label: 'Business Advisor', 
      description: 'Professional and strategic',
      color: 'bg-gray-100 text-gray-800'
    },
    { 
      value: 'tech-expert', 
      label: 'Tech Expert', 
      description: 'Knowledgeable and innovative',
      color: 'bg-green-100 text-green-800'
    },
    { 
      value: 'analytical-thinker', 
      label: 'Analytical Thinker', 
      description: 'Logical and systematic',
      color: 'bg-orange-100 text-orange-800'
    }
  ]

  const topics = [
    { value: 'general-chat', label: 'General Chat' },
    { value: 'problem-solving', label: 'Problem Solving' },
    { value: 'creative-ideas', label: 'Creative Ideas' },
    { value: 'learning', label: 'Learning & Education' },
    { value: 'planning', label: 'Planning & Strategy' }
  ]

  const languages = [
    { value: 'en-US', label: 'English (US)', flag: '🇺🇸' },
    { value: 'en-GB', label: 'English (UK)', flag: '🇬🇧' },
    { value: 'es-ES', label: 'Spanish', flag: '🇪🇸' },
    { value: 'fr-FR', label: 'French', flag: '🇫🇷' },
    { value: 'de-DE', label: 'German', flag: '🇩🇪' },
    { value: 'it-IT', label: 'Italian', flag: '🇮🇹' },
    { value: 'pt-BR', label: 'Portuguese', flag: '🇧🇷' },
    { value: 'ja-JP', label: 'Japanese', flag: '🇯🇵' },
    { value: 'ko-KR', label: 'Korean', flag: '🇰🇷' },
    { value: 'zh-CN', label: 'Chinese', flag: '🇨🇳' }
  ]

  const priorityColors = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800'
  }

  const categoryColors = {
    work: 'bg-blue-100 text-blue-800',
    personal: 'bg-purple-100 text-purple-800',
    health: 'bg-green-100 text-green-800',
    shopping: 'bg-orange-100 text-orange-800',
    travel: 'bg-indigo-100 text-indigo-800',
    other: 'bg-gray-100 text-gray-800'
  }

  const quickPrompts = [
    "Help me brainstorm ideas for a project",
    "Explain a complex concept in simple terms",
    "Give me creative writing prompts",
    "Help me plan my day efficiently",
    "Suggest ways to improve productivity",
    "Help me solve a problem I'm facing"
  ]

  // Load conversations from localStorage on component mount
  useEffect(() => {
    const savedConversations = localStorage.getItem('ai-buddy-conversations')
    if (savedConversations) {
      const parsedConversations = JSON.parse(savedConversations).map((conv: unknown) => {
        const conversation = conv as { 
          id: string; 
          title: string; 
          messages: Array<{ id: string; content: string; role: string; timestamp: string; type: string }>;
          createdAt: string; 
          updatedAt: string 
        }
        return {
          ...conversation,
          createdAt: new Date(conversation.createdAt),
          updatedAt: new Date(conversation.updatedAt),
          messages: conversation.messages.map((msg) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        }
      })
      setConversations(parsedConversations)
    }

    // Load saved voice notes from localStorage
    const savedVoiceNotes = localStorage.getItem('ai-buddy-voice-notes')
    if (savedVoiceNotes) {
      try {
        const parsedVoiceNotes = JSON.parse(savedVoiceNotes).map((note: unknown) => {
          const voiceNote = note as {
            id: string;
            transcription: string;
            tasks: Array<{
              title: string;
              type: string;
              description: string;
              date: string;
              time: string | null;
              priority: string;
              category: string;
            }>;
            timestamp: string;
            duration: number;
            language: string;
          }
          return {
            ...voiceNote,
            timestamp: new Date(voiceNote.timestamp)
          }
        })
        setVoiceNotes(parsedVoiceNotes)
      } catch (error) {
        console.error('Error parsing saved voice notes:', error)
        setVoiceNotes([])
      }
    }
  }, [])

  // Save voice notes to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('ai-buddy-voice-notes', JSON.stringify(voiceNotes))
  }, [voiceNotes])

  // Save conversations to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('ai-buddy-conversations', JSON.stringify(conversations))
  }, [conversations])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [currentConversation?.messages])

  const createNewConversation = () => {
    const newConversation: Conversation = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }
    setConversations(prev => [newConversation, ...prev])
    setCurrentConversation(newConversation)
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() || !currentConversation) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      role: 'user',
      timestamp: new Date(),
      type: 'text'
    }

    // Add user message to conversation
    const updatedConversation = {
      ...currentConversation,
      messages: [...currentConversation.messages, userMessage],
      updatedAt: new Date()
    }

    setCurrentConversation(updatedConversation)
    setConversations(prev => prev.map(conv => 
      conv.id === currentConversation.id ? updatedConversation : conv
    ))

    setInputMessage('')
    setIsTyping(true)

    try {
      // Call OpenAI API for real AI response
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage,
          personality: selectedPersonality,
          topic: selectedTopic
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get AI response')
      }

      const data = await response.json()
      const aiResponse = data.response || 'Sorry, I encountered an error. Please try again.'
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponse,
        role: 'assistant',
        timestamp: new Date(),
        type: 'text'
      }

      const finalConversation = {
        ...updatedConversation,
        messages: [...updatedConversation.messages, aiMessage],
        updatedAt: new Date()
      }

      setCurrentConversation(finalConversation)
      setConversations(prev => prev.map(conv => 
        conv.id === currentConversation.id ? finalConversation : conv
      ))
    } catch (error) {
      console.error('Error getting AI response:', error)
      
      // Fallback to mock response if API fails
      const fallbackResponse = generateAIResponse(inputMessage, selectedPersonality, selectedTopic)
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: fallbackResponse,
        role: 'assistant',
        timestamp: new Date(),
        type: 'text'
      }

      const finalConversation = {
        ...updatedConversation,
        messages: [...updatedConversation.messages, aiMessage],
        updatedAt: new Date()
      }

      setCurrentConversation(finalConversation)
      setConversations(prev => prev.map(conv => 
        conv.id === currentConversation.id ? finalConversation : conv
      ))
    } finally {
      setIsTyping(false)
    }
  }

  const generateAIResponse = (userMessage: string, personality: string, topic: string): string => {
    const responses = {
      'friendly-mentor': [
        `I'd be happy to help you with that! Based on your message about "${userMessage}", here are some thoughtful suggestions and insights that might be useful.`,
        `That's a great question! Let me break this down for you in a way that's easy to understand and actionable.`,
        `I appreciate you asking about this. Here's what I think could help you move forward with "${userMessage}".`
      ],
      'creative-partner': [
        `Oh, this is such an interesting challenge! Let me put on my creative thinking cap and explore some imaginative possibilities for "${userMessage}".`,
        `I love the creative energy in your question! Here are some out-of-the-box ideas that might spark your imagination.`,
        `This is perfect for some creative brainstorming! Let me suggest some artistic and innovative approaches to "${userMessage}".`
      ],
      'business-advisor': [
        `Thank you for your inquiry. I'll provide you with a comprehensive analysis and professional recommendations regarding "${userMessage}".`,
        `I understand your question about "${userMessage}". Let me offer you some structured insights and actionable next steps.`,
        `Based on your query, I'll provide you with a professional assessment and strategic recommendations.`
      ],
      'tech-expert': [
        `Great question about technology! Let me break down "${userMessage}" and provide you with some cutting-edge insights and practical solutions.`,
        `I love exploring tech challenges! Here are some innovative approaches and best practices for "${userMessage}".`,
        `This is an interesting technical question! Let me suggest some modern solutions and approaches for "${userMessage}".`
      ],
      'analytical-thinker': [
        `Let me analyze this systematically. For "${userMessage}", I'll break it down into logical components and provide structured thinking.`,
        `Excellent question that requires careful analysis. Let me approach "${userMessage}" with a methodical, step-by-step analysis.`,
        `This calls for analytical thinking! Let me examine "${userMessage}" from multiple angles and provide you with structured insights.`
      ]
    }

    const topicContexts = {
      'general-chat': "In general conversation, ",
      'problem-solving': "For problem-solving, ",
      'creative-ideas': "From a creative perspective, ",
      'learning': "When it comes to learning, ",
      'planning': "For planning and strategy, "
    }

    const baseResponse = responses[personality as keyof typeof responses][Math.floor(Math.random() * responses[personality as keyof typeof responses].length)]
    const topicContext = topicContexts[topic as keyof typeof topicContexts] || ""
    
    return `${baseResponse} ${topicContext}I'd recommend starting with some research, then breaking down your approach into manageable steps. Would you like me to elaborate on any specific aspect of this?`
  }

  const copyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content)
      alert('Message copied to clipboard!')
    } catch (error) {
      console.error('Failed to copy message:', error)
    }
  }

  const downloadConversation = (conversation: Conversation) => {
    const content = conversation.messages.map(msg => 
      `${msg.role === 'user' ? 'You' : 'AI Buddy'}: ${msg.content}`
    ).join('\n\n')
    
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `ai-buddy-chat-${conversation.title.replace(/\s+/g, '-')}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const deleteConversation = (conversationId: string) => {
    if (confirm('Are you sure you want to delete this conversation?')) {
      setConversations(prev => prev.filter(conv => conv.id !== conversationId))
      if (currentConversation?.id === conversationId) {
        setCurrentConversation(null)
      }
    }
  }

  const handleQuickPrompt = (prompt: string) => {
    setInputMessage(prompt)
  }

  // Voice recording functions
  const startRecording = async () => {
    try {
      setError('')
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })
      
      audioChunksRef.current = []
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }
      
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        setRecordingBlob(audioBlob)
        setAudioUrl(URL.createObjectURL(audioBlob))
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())
      }
      
      mediaRecorderRef.current.start()
      setIsRecording(true)
      
    } catch (error) {
      console.error('Error starting recording:', error)
      setError('Failed to start recording. Please check microphone permissions.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const transcribeAudio = async () => {
    if (!recordingBlob) return

    setIsTranscribing(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('audio', recordingBlob)
      formData.append('language', language)

      const response = await fetch('/api/transcribe-voice', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to transcribe audio')
      }

      const data = await response.json()
      setTranscription(data.transcription)

      // Automatically extract tasks after transcription
      await extractTasks(data.transcription)

    } catch (error) {
      console.error('Transcription error:', error)
      setError(error instanceof Error ? error.message : 'Failed to transcribe audio')
    } finally {
      setIsTranscribing(false)
    }
  }

  const extractTasks = async (text: string) => {
    setIsExtractingTasks(true)
    setError('')

    try {
      const response = await fetch('/api/extract-tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transcription: text })
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('API Error Response:', errorData)
        throw new Error(errorData.error || 'Failed to extract tasks')
      }

      const data = await response.json()
      console.log('API Success Response:', data)
      
      if (!data.tasks || !Array.isArray(data.tasks)) {
        throw new Error('Invalid response format from API')
      }
      
      setExtractedTasks(data.tasks)
      setSelectedTasks(new Set(data.tasks.map((_: unknown, index: number) => index.toString())))

    } catch (error) {
      console.error('Task extraction error:', error)
      setError(error instanceof Error ? error.message : 'Failed to extract tasks')
    } finally {
      setIsExtractingTasks(false)
    }
  }

  const saveVoiceNote = () => {
    if (!transcription || extractedTasks.length === 0) return

    const newVoiceNote: VoiceNote = {
      id: Date.now().toString(),
      transcription,
      tasks: extractedTasks,
      timestamp: new Date(),
      duration: recordingBlob ? Math.round(recordingBlob.size / 1000) : 0,
      language
    }

    setVoiceNotes(prev => [newVoiceNote, ...prev])
    
    // Reset states
    setTranscription('')
    setExtractedTasks([])
    setSelectedTasks(new Set())
    setRecordingBlob(null)
    setAudioUrl(null)

    alert('Voice note saved successfully!')
  }

  const toggleTaskSelection = (index: string) => {
    const newSelected = new Set(selectedTasks)
    if (newSelected.has(index)) {
      newSelected.delete(index)
    } else {
      newSelected.add(index)
    }
    setSelectedTasks(newSelected)
  }

  const formatDate = (dateStr: string) => {
    if (dateStr === 'today') return 'Today'
    if (dateStr === 'tomorrow') return 'Tomorrow'
    
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString()
    } catch {
      return dateStr
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-amber-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link href="/" className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Dashboard</span>
              </Link>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                  AI Buddy
                </h1>
                <p className="text-sm text-gray-600">Your personal AI assistant</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* New Chat Button */}
            <Button
              onClick={createNewConversation}
              size="lg"
              className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              New Chat
            </Button>

            {/* Personality Selection */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-gray-900">AI Personality</CardTitle>
                <CardDescription className="text-gray-600">
                  Choose how your AI buddy should behave
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={selectedPersonality} onValueChange={setSelectedPersonality}>
                  <SelectTrigger className="text-gray-900 bg-white border-gray-300 focus:border-orange-500 focus:ring-orange-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200">
                    {personalities.map((personality) => (
                      <SelectItem key={personality.value} value={personality.value} className="text-gray-900 hover:bg-gray-100">
                        <div>
                          <div className="font-medium">{personality.label}</div>
                          <div className="text-xs text-gray-500">{personality.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Topic Selection */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-gray-900">Chat Topic</CardTitle>
                <CardDescription className="text-gray-600">
                  Focus our conversation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                  <SelectTrigger className="text-gray-900 bg-white border-gray-300 focus:border-orange-500 focus:ring-orange-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200">
                    {topics.map((topic) => (
                      <SelectItem key={topic.value} value={topic.value} className="text-gray-900 hover:bg-gray-100">
                        {topic.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Quick Prompts */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-gray-900">Quick Prompts</CardTitle>
                <CardDescription className="text-gray-600">
                  Get started with these suggestions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {quickPrompts.map((prompt, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickPrompt(prompt)}
                      className="w-full justify-start text-left h-auto p-2 text-xs bg-white hover:bg-gray-50 text-gray-900"
                      style={{ color: '#111827' }}
                    >
                      <Lightbulb className="w-3 h-3 mr-2 text-orange-500" />
                      {prompt}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Voice Recording Section */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-gray-900">
                  <Mic className="w-5 h-5 text-orange-600" />
                  <span>Voice Notes</span>
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Record and extract tasks from voice
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Language Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Language</label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="text-gray-900 bg-white border-gray-300 focus:border-orange-500 focus:ring-orange-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200">
                      {languages.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value} className="text-gray-900 hover:bg-gray-100">
                          <div className="flex items-center space-x-2">
                            <span>{lang.flag}</span>
                            <span>{lang.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Recording Controls */}
                <div className="space-y-3">
                  {!isRecording ? (
                    <Button
                      onClick={startRecording}
                      className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
                    >
                      <Mic className="w-4 h-4 mr-2" />
                      Start Recording
                    </Button>
                  ) : (
                    <Button
                      onClick={stopRecording}
                      className="w-full bg-red-600 hover:bg-red-700 text-white"
                    >
                      <Square className="w-4 h-4 mr-2" />
                      Stop Recording
                    </Button>
                  )}

                  {/* Audio Player */}
                  {audioUrl && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Your Recording</label>
                      <audio controls className="w-full" src={audioUrl} />
                    </div>
                  )}

                  {/* Transcribe Button */}
                  {recordingBlob && (
                    <Button
                      onClick={transcribeAudio}
                      disabled={isTranscribing}
                      className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white"
                    >
                      {isTranscribing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Transcribing...
                        </>
                      ) : (
                        <>
                          <Mic className="w-4 h-4 mr-2" />
                          Transcribe & Extract Tasks
                        </>
                      )}
                    </Button>
                  )}

                  {/* Error Display */}
                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="w-4 h-4 text-red-600" />
                        <p className="text-sm text-red-600">{error}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Conversations List */}
            {conversations.length > 0 && (
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-gray-900">Recent Chats</CardTitle>
                  <CardDescription className="text-gray-600">
                    Your conversation history
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {conversations.map((conversation) => (
                      <div
                        key={conversation.id}
                        onClick={() => setCurrentConversation(conversation)}
                        className={`p-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-gray-50 ${
                          currentConversation?.id === conversation.id ? 'bg-orange-100 border border-orange-300' : 'bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-1">
                          <h4 className="font-medium text-gray-900 truncate flex-1">
                            {conversation.title}
                          </h4>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteConversation(conversation.id)
                            }}
                            className="text-red-500 hover:text-red-700"
                          >
                            ×
                          </button>
                        </div>
                        <p className="text-xs text-gray-500">
                          {conversation.messages.length} messages • {conversation.updatedAt.toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-3">
            {currentConversation ? (
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl h-[600px] flex flex-col">
                <CardHeader className="border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-gray-900">{currentConversation.title}</CardTitle>
                      <CardDescription className="text-gray-600">
                        {currentConversation.messages.length} messages
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadConversation(currentConversation)}
                        title="Download chat"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentConversation(null)}
                        title="Close chat"
                      >
                        ×
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="flex-1 flex flex-col p-0">
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {currentConversation.messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] p-3 rounded-lg ${
                            message.role === 'user'
                              ? 'bg-orange-500 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <div className="flex items-start space-x-2">
                            {message.role === 'assistant' && (
                              <Bot className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                            )}
                            <div className="flex-1">
                              <p className="whitespace-pre-wrap">{message.content}</p>
                            </div>
                            {message.role === 'user' && (
                              <User className="w-4 h-4 text-orange-100 mt-0.5 flex-shrink-0" />
                            )}
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs opacity-70">
                              {message.timestamp.toLocaleTimeString()}
                            </span>
                            {message.role === 'assistant' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyMessage(message.content)}
                                className="h-6 px-2 text-xs opacity-70 hover:opacity-100"
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="bg-gray-100 text-gray-900 p-3 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <Bot className="w-4 h-4 text-orange-500" />
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input Area */}
                  <div className="border-t p-4">
                    <div className="flex space-x-2">
                      <Textarea
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 resize-none text-gray-900 bg-white border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                        rows={2}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            sendMessage()
                          }
                        }}
                      />
                      <Button
                        onClick={sendMessage}
                        disabled={!inputMessage.trim() || isTyping}
                        className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white disabled:opacity-50"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Bot className="w-16 h-16 text-gray-400 mb-4" />
                  <h3 className="text-xl font-medium text-gray-600 mb-2">Welcome to AI Buddy!</h3>
                  <p className="text-gray-500 text-center mb-6">
                    Start a new conversation to chat with your AI assistant. I&apos;m here to help with ideas, 
                    answer questions, and provide creative solutions!
                  </p>
                  <Button onClick={createNewConversation} className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Start Chatting
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Voice Notes Display */}
            {(transcription || extractedTasks.length > 0 || voiceNotes.length > 0) && (
              <div className="mt-8">
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-gray-900">
                      <Mic className="w-5 h-5 text-orange-600" />
                      <span>Voice Notes & Tasks</span>
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      Your recorded voice notes and extracted tasks
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Current Recording Results */}
                    {(transcription || extractedTasks.length > 0) && (
                      <div className="space-y-4">
                        <h4 className="font-medium text-gray-900">Current Recording</h4>
                        
                        {/* Transcription */}
                        {transcription && (
                          <div className="p-4 bg-blue-50 rounded-lg">
                            <h5 className="font-medium text-blue-900 mb-2">Transcription</h5>
                            <p className="text-blue-800">{transcription}</p>
                          </div>
                        )}

                        {/* Extracted Tasks */}
                        {extractedTasks.length > 0 && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h5 className="font-medium text-gray-900">Extracted Tasks</h5>
                              <Button
                                onClick={saveVoiceNote}
                                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                Save Voice Note
                              </Button>
                            </div>
                            
                            <div className="grid gap-3">
                              {extractedTasks.map((task, index) => (
                                <div
                                  key={index}
                                  className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                                    selectedTasks.has(index.toString())
                                      ? 'border-orange-500 bg-orange-50'
                                      : 'border-gray-200 bg-white hover:border-gray-300'
                                  }`}
                                  onClick={() => toggleTaskSelection(index.toString())}
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center space-x-2 mb-2">
                                        <h6 className="font-medium text-gray-900">{task.title}</h6>
                                        <span className={`px-2 py-1 text-xs rounded-full ${priorityColors[task.priority as keyof typeof priorityColors] || priorityColors.medium}`}>
                                          {task.priority}
                                        </span>
                                        <span className={`px-2 py-1 text-xs rounded-full ${categoryColors[task.category as keyof typeof categoryColors] || categoryColors.other}`}>
                                          {task.category}
                                        </span>
                                      </div>
                                      <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                                        <div className="flex items-center space-x-1">
                                          <Calendar className="w-3 h-3" />
                                          <span>{formatDate(task.date)}</span>
                                        </div>
                                        {task.time && (
                                          <div className="flex items-center space-x-1">
                                            <Clock className="w-3 h-3" />
                                            <span>{task.time}</span>
                                          </div>
                                        )}
                                        <div className="flex items-center space-x-1">
                                          <CheckCircle className="w-3 h-3" />
                                          <span>{task.type}</span>
                                        </div>
                                      </div>
                                    </div>
                                    <div className={`ml-4 p-2 rounded-full ${
                                      selectedTasks.has(index.toString())
                                        ? 'bg-orange-500 text-white'
                                        : 'bg-gray-200 text-gray-600'
                                    }`}>
                                      {selectedTasks.has(index.toString()) ? (
                                        <CheckCircle className="w-4 h-4" />
                                      ) : (
                                        <Plus className="w-4 h-4" />
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Saved Voice Notes */}
                    {voiceNotes.length > 0 && (
                      <div className="space-y-4">
                        <h4 className="font-medium text-gray-900">Saved Voice Notes</h4>
                        <div className="space-y-3">
                          {voiceNotes.map((note) => (
                            <div key={note.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-2">
                                  <Mic className="w-4 h-4 text-gray-500" />
                                  <span className="text-sm text-gray-500">
                                    {note.timestamp.toLocaleDateString()} • {note.duration}s
                                  </span>
                                </div>
                                <span className="text-xs text-gray-500">{note.language}</span>
                              </div>
                              
                              <div className="mb-3">
                                <h6 className="font-medium text-gray-900 mb-1">Transcription</h6>
                                <p className="text-sm text-gray-600">{note.transcription}</p>
                              </div>
                              
                              <div>
                                <h6 className="font-medium text-gray-900 mb-2">Tasks ({note.tasks.length})</h6>
                                <div className="grid gap-2">
                                  {note.tasks.map((task, index) => (
                                    <div key={index} className="p-3 bg-white rounded border border-gray-200">
                                      <div className="flex items-center space-x-2 mb-1">
                                        <span className="font-medium text-sm text-gray-900">{task.title}</span>
                                        <span className={`px-2 py-1 text-xs rounded-full ${priorityColors[task.priority as keyof typeof priorityColors] || priorityColors.medium}`}>
                                          {task.priority}
                                        </span>
                                        <span className={`px-2 py-1 text-xs rounded-full ${categoryColors[task.category as keyof typeof categoryColors] || categoryColors.other}`}>
                                          {task.category}
                                        </span>
                                      </div>
                                      <p className="text-xs text-gray-600">{task.description}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
