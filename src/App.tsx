import { Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider, useAuth } from "@/contexts/AuthContext"
import Login from "@/pages/Login"
import Settings from "@/pages/Settings"
import { Navigation } from "@/components/Navigation"
import { Toaster } from "@/components/ui/toaster"

function Dashboard() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 p-4">
      <div className={cn("max-w-md w-full p-6 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 text-center space-y-4")}>
        <div className="inline-flex items-center justify-center p-3 bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-full">
          <Sparkles className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">CPPT Maker</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Apoteker Clinical Pharmacy Problem-Solver & SOAP / PCNE Documentation Assistant.
        </p>
        <div className="pt-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            System Initialized
          </span>
        </div>
        <div className="pt-4 text-sm font-semibold">
          Dashboard
        </div>
      </div>
    </main>
  )
}

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
