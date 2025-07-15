"use client"

import React, { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { authorityApi } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { 
  MessageSquare, 
  Send, 
  Bot, 
  User,
  Lightbulb,
  TrendingUp,
  Clock,
  RefreshCw,
  Loader2,
  AlertCircle,
  Sparkles,
  Database,
  BarChart3,
  Users,
  Building
} from "lucide-react"

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  suggestions?: string[]
  dataInsights?: string[]
  actionItems?: string[]
}

interface DatabaseStats {
  totalAttractions: number
  totalCategories: number
  totalVisits?: number
  totalRevenue?: number
  avgRating?: number
}

export function AIChat() {
  const { user } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [databaseStats, setDatabaseStats] = useState<DatabaseStats | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (user && user.role.roleName === 'AUTHORITY') {
      initializeChat()
      fetchDatabaseStats()
    }
  }, [user])

  const initializeChat = () => {
    const welcomeMessage: ChatMessage = {
      id: 'welcome',
      role: 'assistant',
      content: "👋 Hello! I'm TourEase AI, your intelligent tourism data assistant. I can help you analyze attractions, understand visitor patterns, generate insights, and answer questions about your tourism database. What would you like to explore today?",
      timestamp: new Date(),
      suggestions: [
        "What are my top-performing attractions?",
        "Show me recent visitor trends",
        "Generate revenue forecasts",
        "Analyze attraction categories",
        "Tell me about seasonal patterns"
      ],
      dataInsights: [
        "I have access to your complete tourism database",
        "I can provide real-time analytics and predictions",
        "Ask me anything about attractions, visitors, or revenue"
      ]
    }
    setMessages([welcomeMessage])
  }

  const fetchDatabaseStats = async () => {
    try {
      const response = await authorityApi.getCityMetrics({ period: 'month' })
      if (response.success && response.data) {
        setDatabaseStats({
          totalAttractions: response.data.totalAttractions || 0,
          totalCategories: response.data.totalCategories || 0,
          totalVisits: response.data.totalVisits || 0,
          totalRevenue: response.data.totalRevenue || 0,
          avgRating: response.data.avgRating || 0
        })
      }
    } catch (err) {
      console.error('Error fetching database stats:', err)
    }
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage("")
    setIsLoading(true)
    setError(null)

    try {
      // Prepare chat history for context
      const chatHistory = messages.slice(-4).map(msg => ({
        role: msg.role,
        content: msg.content
      }))

      const response = await authorityApi.chatWithAI({
        message: userMessage.content,
        chatHistory
      })

      if (response.success && response.data) {
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response.data.message,
          timestamp: new Date(),
          suggestions: response.data.suggestions,
          dataInsights: response.data.dataInsights,
          actionItems: response.data.actionItems
        }

        setMessages(prev => [...prev, assistantMessage])
        
        // Update database stats if provided
        if (response.data.context) {
          setDatabaseStats(prev => ({
            ...prev,
            ...response.data.context
          }))
        }
      } else {
        throw new Error(response.message || 'Failed to get AI response')
      }
    } catch (err) {
      console.error('Error sending message:', err)
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I apologize, but I'm having trouble processing your request right now. Please try again or ask a different question about your tourism data.",
        timestamp: new Date(),
        suggestions: [
          "Try rephrasing your question",
          "Ask about attraction statistics",
          "Request visitor insights"
        ]
      }
      setMessages(prev => [...prev, errorMessage])
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInputMessage(suggestion)
    inputRef.current?.focus()
  }

  const clearChat = () => {
    setMessages([])
    setError(null)
    initializeChat()
  }

  if (!user || user.role.roleName !== 'AUTHORITY') {
    return (
      <div className="flex items-center justify-center h-64">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Access denied. This feature is only available for tourism authorities.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-purple-600" />
            TourEase AI Assistant
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Your intelligent tourism data companion powered by Gemini AI
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={clearChat} variant="outline" className="gap-2 text-xs sm:text-sm">
            <RefreshCw className="h-4 w-4" />
            Clear Chat
          </Button>
        </div>
      </div>

      {/* Database Stats Overview */}
      {databaseStats && (
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium">{databaseStats.totalAttractions}</p>
                <p className="text-xs text-muted-foreground">Attractions</p>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium">{databaseStats.totalCategories}</p>
                <p className="text-xs text-muted-foreground">Categories</p>
              </div>
            </div>
          </Card>
          {databaseStats.totalVisits && (
            <Card className="p-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-600" />
                <div>
                  <p className="text-sm font-medium">{databaseStats.totalVisits.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Total Visits</p>
                </div>
              </div>
            </Card>
          )}
          {databaseStats.avgRating && (
            <Card className="p-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-yellow-600" />
                <div>
                  <p className="text-sm font-medium">{databaseStats.avgRating.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">Avg Rating</p>
                </div>
              </div>
            </Card>
          )}
          {databaseStats.totalRevenue && (
            <Card className="p-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                <div>
                  <p className="text-sm font-medium">
                    ${(databaseStats.totalRevenue / 1000000).toFixed(1)}M
                  </p>
                  <p className="text-xs text-muted-foreground">Revenue</p>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Chat Interface */}
      <Card className="h-[600px] flex flex-col">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Chat with AI
          </CardTitle>
          <CardDescription>
            Ask questions about your tourism data, get insights, and receive AI-powered recommendations
          </CardDescription>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col">
          {/* Messages Area */}
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
                  {message.role === 'assistant' && (
                    <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <Bot className="h-5 w-5 text-purple-600" />
                    </div>
                  )}
                  
                  <div className={`flex flex-col space-y-2 max-w-[80%] ${message.role === 'user' ? 'items-end' : ''}`}>
                    <div className={`p-3 rounded-lg ${
                      message.role === 'user' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-muted'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {message.timestamp.toLocaleTimeString()}
                    </div>

                    {/* AI Response Extras */}
                    {message.role === 'assistant' && (message.suggestions || message.dataInsights || message.actionItems) && (
                      <div className="space-y-2 w-full">
                        {message.suggestions && message.suggestions.length > 0 && (
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                              <Lightbulb className="h-3 w-3" />
                              Suggestions:
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {message.suggestions.map((suggestion, idx) => (
                                <Badge 
                                  key={idx} 
                                  variant="secondary" 
                                  className="cursor-pointer hover:bg-secondary/80 text-xs"
                                  onClick={() => handleSuggestionClick(suggestion)}
                                >
                                  {suggestion}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {message.dataInsights && message.dataInsights.length > 0 && (
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                              <BarChart3 className="h-3 w-3" />
                              Data Insights:
                            </p>
                            <ul className="text-xs space-y-1">
                              {message.dataInsights.map((insight, idx) => (
                                <li key={idx} className="flex items-start gap-1">
                                  <span className="text-blue-600">•</span>
                                  {insight}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {message.actionItems && message.actionItems.length > 0 && (
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                              <TrendingUp className="h-3 w-3" />
                              Action Items:
                            </p>
                            <ul className="text-xs space-y-1">
                              {message.actionItems.map((item, idx) => (
                                <li key={idx} className="flex items-start gap-1">
                                  <span className="text-green-600">→</span>
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {message.role === 'user' && (
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                  )}
                </div>
              ))}
              
              {isLoading && (
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <Bot className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="bg-muted p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <Separator className="my-4" />

          {/* Input Area */}
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              placeholder="Ask me anything about your tourism data..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              className="flex-1"
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={isLoading || !inputMessage.trim()}
              className="gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Send
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default AIChat
