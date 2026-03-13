import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './store/authStore'
import AppLayout from './components/layout/AppLayout'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import DashboardPage from './pages/DashboardPage'
import ProcessingPage from './pages/ProcessingPage'
import ResultPage from './pages/ResultPage'
import MyVideosPage from './pages/MyVideosPage'
import CreditsPage from './pages/CreditsPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route element={<AppLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/processing/:jobId" element={<ProcessingPage />} />
            <Route path="/result/:jobId" element={<ResultPage />} />
            <Route path="/my-videos" element={<MyVideosPage />} />
            <Route path="/credits" element={<CreditsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
