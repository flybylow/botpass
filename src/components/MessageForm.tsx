import * as React from "react"
import { Button } from "./ui/button"
import { Textarea } from "./ui/textarea"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "../firebase/config"
import { useState } from "react"

interface MessageFormProps {
  botId: string;
  onMessageSent?: () => void;
}

export const MessageForm: React.FC<MessageFormProps> = ({ botId, onMessageSent }) => {
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [status, setStatus] = useState<{
    type: 'success' | 'error' | 'warning' | null;
    message: string | null;
  }>({ type: null, message: null })
  const [retryCount, setRetryCount] = useState(0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return

    try {
      setIsSubmitting(true)
      setStatus({ type: null, message: null })

      const messagesRef = collection(db, 'messages');
      await addDoc(messagesRef, {
        botId,
        message: message.trim(),
        createdAt: serverTimestamp()
      });

      setMessage("")
      onMessageSent?.()
      setStatus({
        type: 'success',
        message: 'Message sent successfully! ✨'
      })
      setRetryCount(0) // Reset retry count on success
    } catch (err: any) {
      console.error("Error sending message:", err)
      
      if (err?.message?.includes('ERR_BLOCKED_BY_CLIENT') || err?.name === 'FirebaseError') {
        if (retryCount < 3) {
          // Retry with exponential backoff
          const timeout = Math.pow(2, retryCount) * 1000
          setStatus({
            type: 'warning',
            message: 'Connection blocked. Retrying...'
          })
          setTimeout(() => {
            setRetryCount(prev => prev + 1)
            handleSubmit(e) // Retry the submission
          }, timeout)
        } else {
          setStatus({
            type: 'error',
            message: 'Connection blocked. Please check your ad blocker settings or try a different browser.'
          })
        }
      } else {
        setStatus({
          type: 'error',
          message: 'Failed to send message. Please try again.'
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative w-full max-w-2xl mx-auto p-6 rounded-lg border bg-white shadow-sm">
      {status.type && (
        <div 
          className={`mb-4 p-3 rounded-md text-sm ${
            status.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200'
              : status.type === 'warning'
              ? 'bg-yellow-50 text-yellow-800 border border-yellow-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {status.message}
          {status.type === 'error' && status.message?.includes('ad blocker') && (
            <div className="mt-2 text-xs">
              <p>To fix this:</p>
              <ul className="list-disc pl-4 mt-1">
                <li>Disable your ad blocker for this site</li>
                <li>Add this site to your ad blocker's whitelist</li>
                <li>Try using a different browser</li>
              </ul>
            </div>
          )}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Enter your message"
          required
          disabled={isSubmitting}
          className="flex-1"
          rows={4}
        />
        <Button 
          type="submit" 
          className="w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              {retryCount > 0 ? `Retrying (${retryCount}/3)...` : 'Sending...'}
            </span>
          ) : (
            'Send Message'
          )}
        </Button>
      </form>
    </div>
  )
} 