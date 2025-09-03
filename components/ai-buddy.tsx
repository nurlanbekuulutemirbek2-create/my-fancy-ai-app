'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Bot, Send, Loader2, MessageSquare, Trash2, Brain, Lightbulb, BookOpen, Code, Palette, Calculator, Plus } from 'lucide-react'
import { useUser } from '@clerk/nextjs'
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import openai from '@/lib/openai'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  model?: string
  tokens?: number
}

interface Conversation {
  id: string
  title: string
  messages: Message[]
  model: string
  createdAt: Date
  updatedAt: Date
  totalTokens: number
}

export default function AIBuddy() {
  const { user } = useUser()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null)
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedModel, setSelectedModel] = useState('gpt-3.5-turbo')
  const [systemPrompt, setSystemPrompt] = useState('You are a helpful AI assistant. Be concise, friendly, and helpful.')
  const [showSystemPrompt, setShowSystemPrompt] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const models = [
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', description: 'Fast and efficient' },
    { value: 'gpt-4', label: 'GPT-4', description: 'Most capable model' },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo', description: 'Latest and greatest' }
  ]

  const quickPrompts = [
    { icon: Brain, text: 'Help me brainstorm ideas for...', category: 'creativity' },
    { icon: Code, text: 'Explain this code concept...', category: 'programming' },
    { icon: Palette, text: 'Give me design tips for...', category: 'design' },
    { icon: Calculator, text: 'Solve this math problem...', category: 'math' },
    { icon: BookOpen, text: 'Summarize this topic...', category: 'learning' },
    { icon: Lightbulb, text: 'What are the pros and cons of...', category: 'analysis' }
  ]



  const loadConversations = useCallback(() => {
    if (!user) return

    const conversationsRef = collection(db, 'conversations')
    const q = query(
      conversationsRef,
      where('userId', '==', user.id),
      orderBy('updatedAt', 'desc')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const conversationsData: Conversation[] = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        conversationsData.push({
          id: doc.id,
          title: data.title,
          messages: data.messages || [],
          model: data.model || 'gpt-3.5-turbo',
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          totalTokens: data.totalTokens || 0
        })
      })
      setConversations(conversationsData)
    })

    return unsubscribe
  }, [user])

  useEffect(() => {
    if (user) {
      loadConversations()
    }
  }, [user, loadConversations])

  useEffect(() => {
    scrollToBottom()
  }, [currentConversation?.messages])

  const createNewConversation = () => {
    const newConversation: Conversation = {
      id: '',
      title: 'New Conversation',
      messages: [],
      model: selectedModel,
      createdAt: new Date(),
      updatedAt: new Date(),
      totalTokens: 0
    }
    setCurrentConversation(newConversation)
    setInputMessage('')
    inputRef.current?.focus()
  }

  const selectConversation = (conversation: Conversation) => {
    setCurrentConversation(conversation)
    setSelectedModel(conversation.model)
    setInputMessage('')
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() || !currentConversation || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    }

    // Add user message to conversation
    const updatedConversation = {
      ...currentConversation,
      messages: [...currentConversation.messages, userMessage],
      updatedAt: new Date()
    }

    setCurrentConversation(updatedConversation)
    setInputMessage('')
    setIsLoading(true)

    try {
      // Prepare messages for OpenAI API
      const messages = [
        { role: 'system', content: systemPrompt },
        ...updatedConversation.messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      ]

      const response = await openai.chat.completions.create({
        model: selectedModel,
        messages: messages as Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
        max_tokens: 1000,
        temperature: 0.7,
      })

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.choices[0]?.message?.content || 'No response generated',
        timestamp: new Date(),
        model: selectedModel,
        tokens: response.usage?.total_tokens || 0
      }

      // Add assistant message to conversation
      const finalConversation = {
        ...updatedConversation,
        messages: [...updatedConversation.messages, assistantMessage],
        updatedAt: new Date(),
        totalTokens: (updatedConversation.totalTokens || 0) + (response.usage?.total_tokens || 0)
      }

      setCurrentConversation(finalConversation)

      // Save to Firebase if conversation has an ID (existing conversation)
      if (finalConversation.id) {
        await saveConversation(finalConversation)
      } else {
        // Create new conversation in Firebase
        await createConversationInFirebase(finalConversation)
      }

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get response'
      console.error('Error sending message:', error)
      const errorMessageObj: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${errorMessage}`,
        timestamp: new Date()
      }
      
      const errorConversation = {
        ...updatedConversation,
        messages: [...updatedConversation.messages, errorMessageObj],
        updatedAt: new Date()
      }
      setCurrentConversation(errorConversation)
    } finally {
      setIsLoading(false)
    }
  }



  const createConversationInFirebase = async (conversation: Conversation) => {
    if (!user) return

    try {
      const conversationRef = collection(db, 'conversations')
      const docRef = await addDoc(conversationRef, {
        userId: user.id,
        userEmail: user.emailAddresses[0]?.emailAddress,
        title: conversation.title || 'New Conversation',
        messages: conversation.messages,
        model: conversation.model,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        totalTokens: conversation.totalTokens || 0
      })

      // Update the conversation with the Firebase ID
      setCurrentConversation({
        ...conversation,
        id: docRef.id
      })
    } catch (error) {
      console.error('Error creating conversation:', error)
    }
  }

  const saveConversation = async (conversation: Conversation) => {
    // This would update an existing conversation
    // For now, we'll just update the local state
    setConversations(prev => 
      prev.map(conv => 
        conv.id === conversation.id ? conversation : conv
      )
    )
  }

  const deleteConversation = async (conversationId: string) => {
    if (!confirm('Are you sure you want to delete this conversation?')) return

    try {
      // Delete from Firebase
      // await deleteDoc(doc(db, 'conversations', conversationId))
      
      // Remove from local state
      setConversations(prev => prev.filter(conv => conv.id !== conversationId))
      
      if (currentConversation?.id === conversationId) {
        setCurrentConversation(null)
      }
    } catch (error) {
      console.error('Error deleting conversation:', error)
    }
  }

  const handleQuickPrompt = (prompt: string) => {
    setInputMessage(prompt)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  const getTokenCount = (text: string) => {
    // Rough estimation: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <Bot className="w-8 h-8 text-yellow-600" />
          <h1 className="text-3xl font-bold text-gray-800">AI Buddy</h1>
        </div>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Your personal AI assistant for help, ideas, and creative inspiration. 
          Chat with AI and get intelligent responses to any question!
        </p>
      </div>

      {/* Quick Prompts */}
      <Card className="bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Lightbulb className="w-5 h-5 text-yellow-600" />
            <span>Quick Start Prompts</span>
          </CardTitle>
          <CardDescription>
            Click on any prompt to start a conversation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {quickPrompts.map((prompt, index) => (
              <Button
                key={index}
                variant="outline"
                className="h-auto p-3 text-left justify-start"
                onClick={() => handleQuickPrompt(prompt.text)}
              >
                <prompt.icon className="w-4 h-4 mr-2 text-yellow-600" />
                <span className="text-sm">{prompt.text}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Chat Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Conversations Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">Conversations</h2>
            <Button onClick={createNewConversation} size="sm" className="bg-yellow-600 hover:bg-yellow-700">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {conversations.map((conversation) => (
              <Card
                key={conversation.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  currentConversation?.id === conversation.id ? 'ring-2 ring-yellow-500' : ''
                }`}
                onClick={() => selectConversation(conversation)}
              >
                <CardContent className="p-3">
                  <h3 className="font-medium text-gray-900 text-sm truncate">
                    {conversation.title}
                  </h3>
                  <p className="text-xs text-gray-600 mt-1">
                    {conversation.messages.length} messages
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <Badge variant="outline" className="text-xs">
                      {conversation.model}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteConversation(conversation.id)
                      }}
                      className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {conversations.length === 0 && (
              <div className="text-center text-gray-500 py-4">
                <p className="text-sm">No conversations yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="lg:col-span-3">
          <Card className="bg-white/80 backdrop-blur-sm h-[600px] flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <MessageSquare className="w-5 h-5 text-yellow-600" />
                    <span>
                      {currentConversation ? currentConversation.title : 'New Conversation'}
                    </span>
                  </CardTitle>
                  <CardDescription>
                    {currentConversation ? `${currentConversation.messages.length} messages` : 'Start a new conversation'}
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {models.map((model) => (
                        <SelectItem key={model.value} value={model.value}>
                          <div className="flex flex-col">
                            <span className="font-medium">{model.label}</span>
                            <span className="text-xs text-gray-500">{model.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSystemPrompt(!showSystemPrompt)}
                  >
                    <Brain className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* System Prompt */}
              {showSystemPrompt && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <label className="text-sm font-medium text-gray-700">System Prompt</label>
                  <Input
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    placeholder="Set the AI's behavior..."
                    className="mt-1"
                  />
                </div>
              )}
            </CardHeader>

            <CardContent className="flex-1 flex flex-col p-0">
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {currentConversation?.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.role === 'user'
                          ? 'bg-yellow-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        {message.role === 'user' ? (
                          <span className="text-xs opacity-80">You</span>
                        ) : (
                          <span className="text-xs opacity-80 flex items-center">
                            <Bot className="w-3 h-3 mr-1" />
                            AI
                          </span>
                        )}
                        <span className="text-xs opacity-60">
                          {formatDate(message.timestamp)}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      {message.tokens && (
                        <div className="text-xs opacity-60 mt-2">
                          Tokens: {message.tokens}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-lg p-3">
                      <div className="flex items-center space-x-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm text-gray-600">AI is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="border-t p-4">
                <div className="flex space-x-2">
                  <Input
                    ref={inputRef}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        sendMessage()
                      }
                    }}
                    placeholder="Type your message..."
                    disabled={isLoading}
                    className="flex-1"
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!inputMessage.trim() || isLoading}
                    className="bg-yellow-600 hover:bg-yellow-700"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                
                {currentConversation && (
                  <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                    <span>
                      {currentConversation.messages.length} messages
                    </span>
                    <span>
                      ~{getTokenCount(currentConversation.messages.map(m => m.content).join(' '))} tokens
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
