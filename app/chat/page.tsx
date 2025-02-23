'use client'

import { useState, useEffect, useRef } from 'react'
import { SendIcon } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import Image from 'next/image'
import { User } from 'firebase/auth'

interface Message {
  role: 'user' | 'assistant'
  content: string
  id: string        // 使用唯一ID替代时间戳
}

// 添加一个用户信息组件
function UserInfo({ user, logout, router }: { 
  user: User, 
  logout: () => Promise<void>,
  router: any 
}) {
  const displayName = user.displayName || user.email?.split('@')[0] || 'User'
  
  return (
    <div className="flex items-center gap-3">
      {user.photoURL ? (
        <img 
          src={user.photoURL} 
          alt="Profile" 
          className="w-8 h-8 rounded-full"
        />
      ) : (
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white">
          {displayName[0].toUpperCase()}
        </div>
      )}
      <span className="text-gray-300">{displayName}</span>
      <button
        onClick={() => {
          logout();
          router.push('/login');
        }}
        className="text-gray-400 hover:text-white ml-4"
      >
        退出登录
      </button>
    </div>
  )
}

export default function ChatPage() {
  const { user, loading, logout } = useAuth()
  const router = useRouter()
  
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

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

  // Load chat history
  useEffect(() => {
    const loadChatHistory = async () => {
      if (!user) return

      const chatRef = collection(db, 'chats')
      const q = query(
        chatRef,
        where('userId', '==', user.uid)
      )

      const querySnapshot = await getDocs(q)
      const history = querySnapshot.docs
        .map(doc => ({
          role: doc.data().role,
          content: doc.data().content,
          id: doc.id,
          timestamp: doc.data().timestamp
        }))
        // 在客户端进行排序
        .sort((a, b) => a.timestamp - b.timestamp)

      setMessages(history)
    }

    loadChatHistory()
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading || !user) return
    
    const userMessage = {
      role: 'user' as const,
      content: input,
      id: `user-${Date.now()}`
    }

    // Save user message to Firestore
    await addDoc(collection(db, 'chats'), {
      userId: user.uid,
      role: userMessage.role,
      content: userMessage.content,
      timestamp: Date.now()
    })

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
      const assistantMessage = {
        role: 'assistant' as const,
        content: data.content,
        id: `assistant-${Date.now()}`
      }

      // Save assistant message to Firestore
      await addDoc(collection(db, 'chats'), {
        userId: user.uid,
        role: assistantMessage.role,
        content: assistantMessage.content,
        timestamp: Date.now()
      })

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error:', error)
      const errorMessage = {
        role: 'assistant' as const,
        content: '抱歉，发生了一些错误。请稍后再试。',
        id: `error-${Date.now()}`
      }

      await addDoc(collection(db, 'chats'), {
        userId: user.uid,
        role: errorMessage.role,
        content: errorMessage.content,
        timestamp: Date.now()
      })

      setMessages(prev => [...prev, errorMessage])
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
      <header className="border-b border-gray-700 p-4 flex justify-between items-center">
        <h1 className="text-xl font-semibold text-white">AI 助手</h1>
        {user && <UserInfo user={user} logout={logout} router={router} />}
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