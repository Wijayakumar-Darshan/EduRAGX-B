import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { io } from 'socket.io-client'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

const SocketContext = createContext(null)

const normalizeToken = (value) => {
  if (typeof value !== 'string') return null
  const token = value.replace(/^Bearer\s+/i, '').trim()
  if (token.split('.').length !== 3) return null
  return token
}

export const SocketProvider = ({ children }) => {
  const userId = useAuthStore((s) => s.user?.id)
  const token = useAuthStore((s) => s.token)
  const logout = useAuthStore((s) => s.logout)

  const socketRef = useRef(null)
  const [socket, setSocket] = useState(null)

  useEffect(() => {
    // Not logged in → tear down
    if (!userId || !token) {
      if (socketRef.current) {
        socketRef.current.removeAllListeners()
        socketRef.current.disconnect()
        socketRef.current = null
        setSocket(null)
      }
      return
    }

    const normalizedToken = normalizeToken(token)
    if (!normalizedToken) {
      console.error('❌ Invalid stored JWT. Please sign in again.')
      logout()
      return
    }

    // Already connected with same auth → keep it
    if (socketRef.current?.connected) {
      return
    }

    // Clean any stale instance before creating a new one
    if (socketRef.current) {
      socketRef.current.removeAllListeners()
      socketRef.current.disconnect()
      socketRef.current = null
    }

    console.log('🔌 Connecting Socket.IO... User:', userId)

    const s = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      path: '/socket.io',
      auth: { token: normalizedToken },
      transports: ['websocket', 'polling'],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 8,
      reconnectionDelay: 1000,
      // Prevent rapid reconnect loops in Strict Mode
      forceNew: false,
    })

    socketRef.current = s
    setSocket(s)

    s.on('connect', () => {
      console.log('🟢 Socket connected:', s.id)
    })

    s.on('connect_error', (err) => {
      console.error('🔴 Socket connection error:', err.message)
      if (err.message?.includes('Unauthorized') || err.message?.includes('jwt')) {
        logout()
      }
    })

    s.on('disconnect', (reason) => {
      console.log('🔴 Socket disconnected:', reason)
      // Server kicked us → try again
      if (reason === 'io server disconnect') {
        s.connect()
      }
    })

    s.on('notification', (data) => {
      toast(data.message || data.title, {
        icon:
          data.type === 'CREDIT_CHANGE'
            ? '💰'
            : data.type === 'FEEDBACK'
              ? '📝'
              : '🔔',
      })
    })

    s.on('feedbackReceived', (data) => {
      toast.success(`Score received: ${data.score} on "${data.assessment}"`)
    })

    s.on('parentFeedback', (data) => {
      toast(`New message from ${data.from}`, { icon: '👨‍👩‍👧' })
    })

    s.on('feedbackReply', (data) => {
      toast(data.message, { icon: '💬' })
    })

    // Cleanup only when user logs out or token/user really changes
    return () => {
      // In Strict Mode this runs once before the real unmount.
      // Delay disconnect slightly so a quick remount can reuse the socket.
      const current = s
      setTimeout(() => {
        // If a new effect already replaced this socket, do nothing
        if (socketRef.current !== current) return

        console.log('🧹 Cleaning up Socket.IO connection')
        current.removeAllListeners()
        current.disconnect()
        if (socketRef.current === current) {
          socketRef.current = null
          setSocket(null)
        }
      }, 100)
    }
  }, [userId, token, logout])

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => useContext(SocketContext)