import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <Toaster
      position="top-center"
      containerStyle={{ top: 80 }}
      toastOptions={{
        duration: 3000,
        style: {
          background: '#0b1020',
          color: '#ffffff',
          border: '1px solid rgba(255,255,255,0.12)',
        },
      }}
    />
  </StrictMode>,
)
