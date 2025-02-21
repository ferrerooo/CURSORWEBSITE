'use client'

import { useState, useEffect, useRef } from 'react'
import { SendIcon } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  id: string        // 使用唯一ID替代时间戳
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setMessages([{
      role: 'assistant',
      content: '你好！我是AI助手，很高兴为您服务。请问有什么我可以帮您的吗？',
      id: 'welcome'
    }])
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    
    const userMessage: Message = {
      role: 'user',
      content: input,
      id: `user-${Date.now()}`  // 仅用于生成唯一ID
    }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        }),
      })

      if (!response.ok) throw new Error('Failed to fetch response')
      
      const data = await response.json()
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.content,
        id: `assistant-${Date.now()}`  // 仅用于生成唯一ID
      }])
    } catch (error) {
      console.error('Error:', error)
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: '抱歉，发生了一些错误。请稍后再试。',
        id: `error-${Date.now()}`  // 仅用于生成唯一ID
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  return (
    <div className="flex h-screen flex-col bg-gray-900">
      {/* Chat Header */}
      <header className="border-b border-gray-700 p-4">
        <h1 className="text-xl font-semibold text-white">AI 助手</h1>
      </header>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 mt-20">
            <p>开始与AI助手对话吧！</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}  // 使用唯一ID作为key
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-4 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-100'
                }`}
              >
                {message.content}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-800 text-gray-100 rounded-lg p-4">
              正在思考...
            </div>
          </div>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="border-t border-gray-700 p-4">
        <div className="flex gap-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入您的问题..."
            disabled={isLoading}
            className="flex-1 rounded-lg bg-gray-800 px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <SendIcon className="h-5 w-5" />
          </button>
        </div>
      </form>
    </div>
  )
} 