import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react'

import { io } from 'socket.io-client'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

const SocketContext = createContext(null)

const normalizeToken = (value) => {
  if (typeof value !== 'string') {
    return null
  }

  const token = value
    .replace(/^Bearer\s+/i, '')
    .trim()

  // JWT must contain 3 sections
  if (token.split('.').length !== 3) {
    return null
  }

  return token
}

export const SocketProvider = ({ children }) => {
  const userId = useAuthStore(
    (state) => state.user?.id
  )

  const token = useAuthStore(
    (state) => state.token
  )

  const logout = useAuthStore(
    (state) => state.logout
  )

  const [socket, setSocket] = useState(null)

  useEffect(() => {
    if (!userId || !token) {
      setSocket(null)
      return undefined
    }

    const normalizedToken = normalizeToken(token)

    if (!normalizedToken) {
      console.error(
        '❌ Invalid stored JWT. Please sign in again.'
      )

      setSocket(null)
      logout()

      return undefined
    }

    console.log('🔌 Connecting Socket.IO...')
    console.log('👤 User ID:', userId)

    const newSocket = io('http://localhost:5000', {
      path: '/socket.io',

      auth: {
        token: normalizedToken,
      },

      transports: [
        'polling',
        'websocket',
      ],

      withCredentials: true,

      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    setSocket(newSocket)

    newSocket.on('connect', () => {
      console.log(
        '🔌 Socket connected:',
        newSocket.id
      )
    })

    newSocket.on('connect_error', (error) => {
      console.error(
        '❌ Socket connection error:',
        error.message
      )
    })

    newSocket.on('disconnect', (reason) => {
      console.log(
        '🔌 Socket disconnected:',
        reason
      )
    })

    newSocket.on('notification', (data) => {
      toast(
        data.message || data.title,
        {
          icon:
            data.type === 'CREDIT_CHANGE'
              ? '💰'
              : data.type === 'FEEDBACK'
                ? '📝'
                : '🔔',
        }
      )
    })

    newSocket.on('feedbackReceived', (data) => {
      toast.success(
        `Score received: ${data.score} on "${data.assessment}"`
      )
    })

    newSocket.on('parentFeedback', (data) => {
      toast(
        `New message from ${data.from}`,
        {
          icon: '👨‍👩‍👧',
        }
      )
    })

    newSocket.on('feedbackReply', (data) => {
      toast(
        data.message,
        {
          icon: '💬',
        }
      )
    })

    return () => {
      console.log('🔌 Cleaning up Socket.IO connection')

      newSocket.removeAllListeners()
      newSocket.disconnect()
      setSocket(null)
    }
  }, [userId, token, logout])

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () =>
  useContext(SocketContext)