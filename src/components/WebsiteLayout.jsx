import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import ScrollToTop from './ScrollToTop'
import SeoHead from './SeoHead'

export default function WebsiteLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      <ScrollToTop />
      <SeoHead />
      <Navbar />

      <main className="flex-1">
        <Outlet />
      </main>

      <Footer />
    </div>
  )
}