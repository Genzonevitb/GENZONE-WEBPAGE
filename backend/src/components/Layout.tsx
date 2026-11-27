import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import {
  LayoutDashboard,
  Calendar,
  Images,
  FolderOpen,
  Users,
  MessageSquare,
  Settings,
  LogOut,
  Zap,
  Info,
  Layers,
  Sparkles,
  Sliders,
  Type,
  LayoutTemplate,
  PanelBottom,
  CreditCard,
} from 'lucide-react'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/events', label: 'Events', icon: Calendar, end: false },
  { to: '/gallery', label: 'Gallery', icon: Images, end: false },
  { to: '/gallery/albums', label: 'Albums', icon: FolderOpen, end: false },
  { to: '/panel', label: 'Panel', icon: Users, end: false },
  { to: '/panel/popup-design', label: 'Panel Popup', icon: Layers, end: false },
  { to: '/panel/3d-cards', label: '3D ID Cards', icon: CreditCard, end: false },
  { to: '/feedback', label: 'Feedback', icon: MessageSquare, end: false },
  { to: '/about/layout', label: 'About Layout', icon: LayoutTemplate, end: false },
  { to: '/footer', label: 'Footer', icon: PanelBottom, end: false },
  { to: '/text-typography', label: 'Text & Typography', icon: Type, end: false },
  { to: '/intro', label: 'Intro Splash', icon: Sparkles, end: false },
  { to: '/global-controls', label: 'Global Controls', icon: Sliders, end: false },
  { to: '/settings', label: 'Settings', icon: Settings, end: false },
  { to: '/settings/hero', label: 'Hero', icon: Zap, end: false },
  { to: '/settings/about', label: 'About', icon: Info, end: false },
  { to: '/settings/sections', label: 'Sections', icon: Layers, end: false },
]

export default function Layout() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const user = session?.user

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar (desktop) */}
      <aside className="hidden md:flex flex-col w-60 bg-sidebar border-r border-border shrink-0 h-screen sticky top-0">
        {/* Logo */}
        <div className="px-5 py-6 border-b border-border">
          <span className="font-display text-xl font-black tracking-widest text-white">
            GEN<span className="text-cyan">ZONE</span>
          </span>
          <p className="font-mono text-[10px] text-muted-foreground mt-0.5 tracking-widest uppercase">
            Admin Panel
          </p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-xl font-mono text-xs tracking-wide transition-all ${
                  isActive
                    ? 'text-cyan bg-cyan/10 border-l-2 border-cyan pl-[10px]'
                    : 'text-muted-foreground hover:text-white hover:bg-border/40 border-l-2 border-transparent pl-[10px]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon size={15} className={isActive ? 'text-cyan' : ''} />
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User + logout */}
        <div className="px-3 pb-5 border-t border-border pt-4 space-y-2">
          <p className="font-mono text-[10px] text-muted-foreground px-3 truncate">
            {user?.email ?? ''}
          </p>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl font-mono text-xs text-muted-foreground hover:text-pink hover:bg-pink/10 transition-all"
          >
            <LogOut size={15} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        <main className="flex-1 pb-24 md:pb-6">
          <Outlet />
        </main>

        {/* Bottom nav (mobile) */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 bg-sidebar border-t border-border flex items-center overflow-x-auto px-2 py-2 z-40">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-lg shrink-0 transition-all ${
                  isActive ? 'text-cyan' : 'text-muted-foreground hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon size={16} className={isActive ? 'text-cyan' : ''} />
                  <span className={`font-mono text-[9px] uppercase tracking-widest ${isActive ? 'text-cyan' : ''}`}>
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
          <button
            onClick={handleLogout}
            className="flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-lg text-muted-foreground hover:text-pink transition-all shrink-0"
          >
            <LogOut size={16} />
            <span className="font-mono text-[9px] uppercase tracking-widest">Out</span>
          </button>
        </nav>
      </div>
    </div>
  )
}
