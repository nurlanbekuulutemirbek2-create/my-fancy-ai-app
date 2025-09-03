"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Bot, Send, Sparkles, Clock, Lightbulb, HelpCircle } from "lucide-react"

interface Message {
  id: string
  content: string
  isUser: boolean
  timestamp: Date
  type?: "reminder" | "creative" | "question"
}

export function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content:
        "Hello! I'm your AI buddy. I can help with questions, set reminders, or spark creative ideas. What would you like to do today?",
      isUser: false,
      timestamp: new Date(Date.now() - 300000),
    },
  ])
  const [inputMessage, setInputMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)

  const quickActions = [
    { label: "Set Reminder", icon: Clock, type: "reminder" as const },
    { label: "Creative Ideas", icon: Lightbulb, type: "creative" as const },
    { label: "Ask Question", icon: HelpCircle, type: "question" as const },
  ]

  const sendMessage = async (content?: string, type?: "reminder" | "creative" | "question") => {
    const messageContent = content || inputMessage.trim()
    if (!messageContent) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: messageContent,
      isUser: true,
      timestamp: new Date(),
      type,
    }

    setMessages((prev) => [...prev, userMessage])
    setInputMessage("")
    setIsTyping(true)

    // Simulate AI response
    setTimeout(() => {
      let aiResponse = ""

      if (type === "reminder") {
        aiResponse = "I'll help you set up a reminder! When would you like to be reminded about this?"
      } else if (type === "creative") {
        aiResponse =
          "Here are some creative ideas: 1) Try combining two random objects in your AI art generator, 2) Record a voice note while walking outside, 3) Write a story about your favorite color!"
      } else if (type === "question") {
        aiResponse =
          "Great question! I'm here to help. Could you provide more details so I can give you the best answer?"
      } else {
        aiResponse =
          "That's interesting! I can help you explore that further. Would you like me to break it down into steps or provide some creative suggestions?"
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponse,
        isUser: false,
        timestamp: new Date(),
        type,
      }

      setMessages((prev) => [...prev, aiMessage])
      setIsTyping(false)
    }, 2000)
  }

  const handleQuickAction = (action: (typeof quickActions)[0]) => {
    const prompts = {
      reminder: "Help me set a reminder",
      creative: "Give me some creative ideas",
      question: "I have a question",
    }
    sendMessage(prompts[action.type], action.type)
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="flex items-center gap-2">
              AI Buddy
              <Sparkles className="h-4 w-4 text-purple-500 animate-pulse-soft" />
            </CardTitle>
            <CardDescription>Your smart companion for everything</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col space-y-4">
        {/* Quick Actions */}
        <div className="flex gap-2 flex-wrap">
          {quickActions.map((action) => (
            <Button
              key={action.label}
              variant="outline"
              size="sm"
              onClick={() => handleQuickAction(action)}
              className="rounded-lg hover:scale-105 transition-transform bg-transparent"
            >
              <action.icon className="h-3 w-3 mr-2" />
              {action.label}
            </Button>
          ))}
        </div>

        {/* Messages */}
        <div className="flex-1 space-y-3 overflow-y-auto max-h-64 pr-2">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.isUser ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.isUser ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs opacity-70">
                    {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  {message.type && (
                    <Badge variant="secondary" className="text-xs">
                      {message.type}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-muted text-muted-foreground p-3 rounded-lg">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <Input
            placeholder="Ask me anything..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && sendMessage()}
            className="rounded-lg"
          />
          <Button
            onClick={() => sendMessage()}
            disabled={!inputMessage.trim() || isTyping}
            className="rounded-lg hover:scale-105 transition-transform"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
