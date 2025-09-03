'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Bot, Send, User, ArrowLeft, Sparkles, Lightbulb, MessageCircle, Copy, Download, RefreshCw, Settings, Zap } from 'lucide-react'
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

export default function AIBuddyPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null)
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [selectedPersonality, setSelectedPersonality] = useState('friendly-mentor')
  const [selectedTopic, setSelectedTopic] = useState('general-chat')
  const messagesEndRef = useRef<HTMLDivElement>(null)

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
      const parsedConversations = JSON.parse(savedConversations).map((conv: any) => ({
        ...conv,
        createdAt: new Date(conv.createdAt),
        updatedAt: new Date(conv.updatedAt),
        messages: conv.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
      }))
      setConversations(parsedConversations)
    }
  }, [])

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
      const aiResponse = data.response
      
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
                    Start a new conversation to chat with your AI assistant. I'm here to help with ideas, 
                    answer questions, and provide creative solutions!
                  </p>
                  <Button onClick={createNewConversation} className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Start Chatting
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
