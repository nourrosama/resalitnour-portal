'use client'
import { useState, useEffect } from 'react'

export default function MessagesPage() {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    fetch('/api/messages')
      .then(r => r.json())
      .then(data => {
        setMessages(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">الرسائل</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Messages List */}
        <div className="md:col-span-1 card p-0 overflow-hidden">
          {loading ? (
            <div className="p-6 text-center text-gray-500">جاري التحميل...</div>
          ) : messages.length === 0 ? (
            <div className="p-6 text-center text-gray-400">لا توجد رسائل</div>
          ) : (
            <ul>
              {messages.map((msg, i) => (
                <li key={msg._id}>
                  <button
                    className={`w-full text-right p-4 border-b hover:bg-gray-50 transition-colors ${
                      selected?._id === msg._id ? 'bg-primary-50 border-r-4 border-r-primary-600' : ''
                    } ${!msg.isRead ? 'bg-blue-50' : ''}`}
                    onClick={() => setSelected(msg)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm truncate ${!msg.isRead ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                          {msg.subject || 'بدون موضوع'}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {msg.from?.name || 'الإدارة'}
                          {msg.caseId && ` • ${msg.caseId.code}`}
                        </p>
                      </div>
                      <span className="text-xs text-gray-400 shrink-0">
                        {new Date(msg.createdAt).toLocaleDateString('ar-EG')}
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Message Detail */}
        <div className="md:col-span-2 card">
          {selected ? (
            <div>
              <div className="border-b pb-4 mb-4">
                <h2 className="text-lg font-bold text-gray-900">{selected.subject || 'بدون موضوع'}</h2>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  <span>من: <strong>{selected.from?.name || 'الإدارة'}</strong></span>
                  {selected.caseId && (
                    <span>
                      الحالة: <strong className="font-mono text-primary-700">{selected.caseId.code}</strong>
                      {' - '}{selected.caseId.name}
                    </span>
                  )}
                  <span>{new Date(selected.createdAt).toLocaleString('ar-EG')}</span>
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{selected.body}</p>
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-400">
              اختر رسالة لعرضها
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
