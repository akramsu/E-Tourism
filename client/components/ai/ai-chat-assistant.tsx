"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/contexts/auth-context"
import { aiChatApi } from "@/lib/api"
import {
  Bot,
  User,
  Send,
  Loader2,
  Lightbulb,
  MapPin,
  Star,
  Calendar,
  Compass,
  X,
  Minimize2,
  Maximize2,
  RefreshCw,
} from "lucide-react"

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  suggestions?: string[]
  dataInsights?: string[]
  actionItems?: string[]
  timestamp: Date
}

interface AIChatAssistantProps {
  isOpen: boolean
  onClose: () => void
  onAttractionSelect?: (attractionId: number) => void
}

export default function AIChatAssistant({ isOpen, onClose, onAttractionSelect }: AIChatAssistantProps) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Welcome message when opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: Message = {
        id: 'welcome',
        role: 'assistant',
        content: `Hello ${user?.username || 'there'}! 👋 I'm your AI Travel Assistant. I can help you discover amazing attractions, plan your trips, and answer questions about tourism in your area. What would you like to explore today?`,
        suggestions: [
          "What are the top-rated attractions?",
          "Recommend attractions for families",
          "Show me cultural sites nearby",
          "What's trending this month?",
          "Plan a weekend itinerary"
        ],
        timestamp: new Date()
      }
      setMessages([welcomeMessage])
    }
  }, [isOpen, user])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen, isMinimized])

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage("")
    setIsLoading(true)

    try {
      // Prepare chat history for context
      const chatHistory = messages.slice(-5).map(msg => ({
        role: msg.role,
        content: msg.content
      }))

      const response = await aiChatApi.sendMessage(inputMessage, chatHistory)

      if (response.success && response.data) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response.data.message,
          suggestions: response.data.suggestions,
          dataInsights: response.data.dataInsights,
          actionItems: response.data.actionItems,
          timestamp: new Date()
        }

        setMessages(prev => [...prev, assistantMessage])
      } else {
        throw new Error(response.message || 'Failed to get AI response')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment, or feel free to explore the attractions on your own!",
        suggestions: ["Try again", "Browse attractions", "View recommendations"],
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInputMessage(suggestion)
    handleSendMessage()
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleGetRecommendations = async () => {
    setIsLoading(true)
    try {
      const response = await aiChatApi.getRecommendations()
      if (response.success && response.data) {
        const recommendationMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: "Here are some personalized recommendations based on popular attractions and current trends:",
          actionItems: response.data.recommendations,
          dataInsights: response.data.insights,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, recommendationMessage])
      }
    } catch (error) {
      console.error('Error getting recommendations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <Card className={`fixed bottom-4 right-4 z-50 shadow-2xl border-2 border-blue-200 dark:border-blue-800 transition-all duration-300 ${
      isMinimized ? 'h-16 w-[300px] sm:w-[420px]' : 'h-[600px] max-h-[calc(100vh-2rem)] w-[340px] sm:w-[420px]'
    } max-w-[calc(100vw-2rem)]`}>
      <CardHeader className="pb-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">AI Travel Assistant</CardTitle>
              <p className="text-sm text-blue-100">Your tourism companion</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
              className="h-8 w-8 p-0 text-white hover:bg-white/20"
            >
              {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 text-white hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {!isMinimized && (
        <CardContent className="p-0 flex flex-col h-[calc(600px-80px)] max-h-[calc(100vh-6rem)]">
          {/* Messages Area */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <Avatar className="h-8 w-8 bg-gradient-to-r from-blue-600 to-purple-600">
                      <AvatarFallback className="text-white">
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}

                  <div
                    className={`max-w-[85%] rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white ml-auto'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                    
                    {/* Suggestions */}
                    {message.suggestions && message.suggestions.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                          Quick suggestions:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {message.suggestions.map((suggestion, idx) => (
                            <Button
                              key={idx}
                              variant="outline"
                              size="sm"
                              onClick={() => handleSuggestionClick(suggestion)}
                              className="text-xs h-7 px-2 break-words whitespace-normal text-left max-w-full"
                            >
                              {suggestion}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Data Insights */}
                    {message.dataInsights && message.dataInsights.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1">
                          <Lightbulb className="h-3 w-3" />
                          Insights:
                        </p>
                        {message.dataInsights.map((insight, idx) => (
                          <Badge key={idx} variant="secondary" className="mr-1 mb-1 text-xs break-words whitespace-normal max-w-full">
                            {insight}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Action Items */}
                    {message.actionItems && message.actionItems.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          Recommendations:
                        </p>
                        <ul className="text-xs space-y-1">
                          {message.actionItems.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-1">
                              <MapPin className="h-3 w-3 mt-0.5 text-blue-600 flex-shrink-0" />
                              <span className="break-words">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  {message.role === 'user' && (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.profilePicture} />
                      <AvatarFallback>
                        {user?.username?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <Avatar className="h-8 w-8 bg-gradient-to-r from-blue-600 to-purple-600">
                    <AvatarFallback className="text-white">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-3 max-w-[80%]">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-slate-600 dark:text-slate-400">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div ref={messagesEndRef} />
          </ScrollArea>

          {/* Quick Actions */}
          <div className="border-t p-3 bg-slate-50 dark:bg-slate-900">
            <div className="flex gap-2 mb-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleGetRecommendations}
                disabled={isLoading}
                className="flex-1 text-xs h-8"
              >
                <Star className="h-3 w-3 mr-1" />
                Get Recommendations
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSuggestionClick("What's popular today?")}
                disabled={isLoading}
                className="flex-1 text-xs h-8"
              >
                <Compass className="h-3 w-3 mr-1" />
                What's Popular
              </Button>
            </div>

            {/* Input Area */}
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                placeholder="Ask about attractions, travel tips..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                className="flex-1 text-sm"
              />
              <Button
                onClick={handleSendMessage}
                disabled={isLoading || !inputMessage.trim()}
                size="sm"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
