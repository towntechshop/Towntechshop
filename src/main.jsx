import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { SiteSettingsProvider } from './hooks/useSiteSettings'
import { applySiteBranding } from './lib/siteBranding'
import { readSiteSettingsCache } from './lib/siteSettingsCache'
import './index.css'

const cachedSiteSettings = readSiteSettingsCache()
if (cachedSiteSettings) {
  applySiteBranding(cachedSiteSettings)
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <SiteSettingsProvider>
        <App />
      </SiteSettingsProvider>
    </BrowserRouter>
  </React.StrictMode>
)