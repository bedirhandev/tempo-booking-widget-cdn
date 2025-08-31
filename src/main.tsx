import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/styles/index.css'
import TestWidget from './components/App/TestWidget'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TestWidget />
  </StrictMode>,
)
