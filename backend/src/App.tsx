import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider } from './lib/auth'
import { ProtectedRoute } from './lib/auth'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Events from './pages/Events'
import Gallery from './pages/Gallery'
import Panel from './pages/Panel'
import Feedback from './pages/Feedback'
import Settings from './pages/Settings'
import HeroAdmin from './pages/HeroAdmin'
import AboutAdmin from './pages/AboutAdmin'
import SectionHeadingsAdmin from './pages/SectionHeadingsAdmin'
import AlbumsAdmin from './pages/AlbumsAdmin'
import IntroAdmin from './pages/IntroAdmin'
import GlobalControls from './pages/GlobalControls'
import TextTypography from './pages/TextTypography'
import AboutLayoutEditor from './pages/AboutLayoutEditor'
import PanelPopupDesign from './pages/PanelPopupDesign'
import FooterAdmin from './pages/FooterAdmin'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public route */}
          <Route path="/login" element={<Login />} />

          {/* Protected: ProtectedRoute renders <Outlet /> which renders Layout */}
          <Route path="/" element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="events" element={<Events />} />
              <Route path="gallery" element={<Gallery />} />
              <Route path="gallery/albums" element={<AlbumsAdmin />} />
              <Route path="panel" element={<Panel />} />
              <Route path="panel/popup-design" element={<PanelPopupDesign />} />
              <Route path="feedback" element={<Feedback />} />
              <Route path="intro" element={<IntroAdmin />} />
              <Route path="global-controls" element={<GlobalControls />} />
              <Route path="text-typography" element={<TextTypography />} />
              <Route path="about/layout" element={<AboutLayoutEditor />} />
              <Route path="footer" element={<FooterAdmin />} />
              <Route path="settings" element={<Settings />} />
              <Route path="settings/hero" element={<HeroAdmin />} />
              <Route path="settings/about" element={<AboutAdmin />} />
              <Route path="settings/sections" element={<SectionHeadingsAdmin />} />
            </Route>
          </Route>

          {/* Catch-all: redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        <Toaster richColors position="bottom-right" theme="dark" />
      </AuthProvider>
    </BrowserRouter>
  )
}
