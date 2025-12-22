import { Menu } from "lucide-react"

export default function Header() {
  return (
    <header className="h-16 bg-white border-b border-border flex items-center justify-between px-4 md:px-6 sticky top-0 z-40">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <button className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <Menu size={20} className="text-foreground" />
        </button>
        <h2 className="text-lg font-semibold text-foreground truncate">Page Title</h2>
      </div>

      <div className="flex items-center gap-4 ml-4">
        <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-semibold text-sm flex-shrink-0">
          S
        </div>
      </div>
    </header>
  )
}
