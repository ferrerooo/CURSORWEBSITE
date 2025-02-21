import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-b from-gray-900 to-black text-white">
      <div className="max-w-3xl text-center space-y-8">
        <h1 className="text-6xl font-bold tracking-tight">
          AI对话的未来
          <span className="text-blue-500">就在这里</span>
        </h1>
        
        <p className="text-xl text-gray-300">
          体验下一代AI对话助手，让沟通更智能、更高效
        </p>

        <div className="flex gap-4 justify-center">
          <Link 
            href="/chat"
            className="px-8 py-4 bg-blue-500 rounded-full font-medium hover:bg-blue-600 transition-colors"
          >
            开始对话
          </Link>
          
          <Link
            href="/about" 
            className="px-8 py-4 bg-gray-800 rounded-full font-medium hover:bg-gray-700 transition-colors"
          >
            了解更多
          </Link>
        </div>
      </div>

      <div className="mt-16 text-center text-gray-400">
        <p>采用最新AI技术 | 安全可靠 | 24/7在线服务</p>
      </div>
    </main>
  )
}
