import { Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

function App() {
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
      </div>
    </main>
  )
}

export default App
