import { Link } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { Button } from "./ui/button"

export function Navigation() {
  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <nav className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
      <div className="flex gap-4">
        <Link to="/" className="text-slate-900 dark:text-slate-100 hover:text-blue-600 font-medium">Dashboard</Link>
        <Link to="/settings" className="text-slate-900 dark:text-slate-100 hover:text-blue-600 font-medium">Settings</Link>
      </div>
      <Button variant="outline" onClick={handleLogout}>Logout</Button>
    </nav>
  )
}
