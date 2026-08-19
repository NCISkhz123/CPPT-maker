import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider, useAuth } from "@/contexts/AuthContext"
import Login from "@/pages/Login"
import Settings from "@/pages/Settings"
import { Navigation } from "@/components/Navigation"
import { Toaster } from "@/components/ui/toaster"
import { Loader2, FileHeart } from "lucide-react"

import Dashboard from "@/pages/Dashboard"
import PatientDetail from "@/pages/PatientDetail"
import NewCPPT from "@/pages/NewCPPT"

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-3">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md shadow-primary/20 animate-pulse">
        <FileHeart className="h-6 w-6 stroke-[2.2]" />
      </div>
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <span>Memuat data aplikasi...</span>
      </div>
    </div>
  )
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()
  
  if (loading) return <LoadingSpinner />
  if (!session) return <Navigate to="/login" replace />
  
  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/20">
      <Navigation />
      <main className="flex-1 w-full bg-slate-50/60 dark:bg-slate-950/60 transition-colors">
        {children}
      </main>
    </div>
  )
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()
  
  if (loading) return <LoadingSpinner />
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
      <Route path="*" element={<Navigate to="/" replace />} />
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

