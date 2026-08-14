
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider, useAuth } from "@/contexts/AuthContext"
import Login from "@/pages/Login"
import Settings from "@/pages/Settings"
import { Navigation } from "@/components/Navigation"
import { Toaster } from "@/components/ui/toaster"

import Dashboard from "@/pages/Dashboard"
import PatientDetail from "@/pages/PatientDetail"
import NewCPPT from "@/pages/NewCPPT"

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()
  
  if (loading) return <div className="p-8 text-center">Loading...</div>
  if (!session) return <Navigate to="/login" replace />
  
  return (
    <>
      <Navigation />
      {children}
    </>
  )
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()
  
  if (loading) return <div className="p-8 text-center">Loading...</div>
  if (session) return <Navigate to="/" replace />
  
  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/patients/:id" element={<ProtectedRoute><PatientDetail /></ProtectedRoute>} />
      <Route path="/patients/:id/new-cppt" element={<ProtectedRoute><NewCPPT /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster />
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
