import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { BotProvider } from '@/contexts/BotContext'
import { WebhookProvider } from '@/contexts/WebhookContext'
import ProtectedRoute from '@/components/common/ProtectedRoute'

// Layout components
import Layout from '@/components/common/Layout'

// Page components
import Home from '@/pages/Home'
import SignUp from '@/pages/SignUp'
import SignIn from '@/pages/SignIn'
import Dashboard from '@/pages/Dashboard'
import BotRegistration from '@/pages/BotRegistration'
import VerifyEmail from '@/pages/VerifyEmail'
import ResetPassword from '@/pages/ResetPassword'
import { WebhookManager } from '@/components/WebhookManager'
import Messages from '@/pages/Messages'

const App = () => {
  return (
    <AuthProvider>
      <BotProvider>
        <WebhookProvider>
          <Routes>
            <Route path="/" element={<Layout />}>
              {/* Public routes */}
              <Route index element={<Home />} />
              <Route path="signin" element={<SignIn />} />
              <Route path="signup" element={<SignUp />} />
              <Route path="reset-password" element={<ResetPassword />} />
              <Route path="verify-email/:verificationId?" element={<VerifyEmail />} />

              {/* Protected routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="bot/register" element={<BotRegistration />} />
                <Route path="bot/edit/:id" element={<BotRegistration />} />
                <Route path="bot/:id/webhooks" element={<WebhookManager />} />
                <Route path="bot/:id/messages" element={<Messages />} />
              </Route>
            </Route>
          </Routes>
        </WebhookProvider>
      </BotProvider>
    </AuthProvider>
  )
}

export default App 