import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import PublicApp from './PublicApp.jsx'
import AdminApp from './AdminApp.jsx'

const isPublicBuild = import.meta.env.VITE_PUBLIC_ONLY === 'true'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isPublicBuild ? <PublicApp /> : <AdminApp />}
  </StrictMode>,
)
