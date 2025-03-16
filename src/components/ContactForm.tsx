import * as React from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { sendMessage } from "../services/firebase"

interface ContactFormProps {
  onSubmit?: (data: { message: string }) => void
  botId?: string
}

const ContactForm: React.FC<ContactFormProps> = ({ onSubmit, botId = "default" }) => {
  const [message, setMessage] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [status, setStatus] = React.useState<{
    type: 'success' | 'error' | null;
    message: string | null;
  }>({ type: null, message: null })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setStatus({ type: null, message: null })

    try {
      await sendMessage(message, botId)
      onSubmit?.({ message })
      setMessage("")
      setStatus({
        type: 'success',
        message: 'Message sent successfully! ✨'
      })
    } catch (err) {
      console.error("Error sending message:", err)
      setStatus({
        type: 'error',
        message: 'Failed to send message. Please try again.'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative w-full max-w-md mx-auto p-6 rounded-lg border bg-white shadow-sm">
      {status.type && (
        <div 
          className={`mb-4 p-3 rounded-md text-sm ${
            status.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {status.message}
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Enter your message"
          required
          disabled={isSubmitting}
          className="flex-1"
        />
        <Button 
          type="submit" 
          className="w-auto"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Sending...
            </span>
          ) : (
            'Send'
          )}
        </Button>
      </form>
    </div>
  )
}

export { ContactForm } 