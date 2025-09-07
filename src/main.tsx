import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'antd-mobile/es/global';
import '@/styles/index.css'
import App from './components/App/App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
