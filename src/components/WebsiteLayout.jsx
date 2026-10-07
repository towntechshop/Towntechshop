import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import ScrollToTop from './ScrollToTop'
import SeoHead from './SeoHead'
import { AnnouncementBar, FloatingWhatsAppButton } from './SiteExtras'
import BackToTop from './BackToTop'
import CompareBar from './CompareBar'
import AnalyticsTracker from './AnalyticsTracker'

export default function WebsiteLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      <ScrollToTop />
      <SeoHead />
      <AnalyticsTracker />
      <AnnouncementBar />
      <Navbar />

      <main className="flex-1">
        <Outlet />
      </main>

      <Footer />
      <FloatingWhatsAppButton />
      <BackToTop />
      <CompareBar />
    </div>
  )
}