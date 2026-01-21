import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { Analytics } from '@vercel/analytics/react' // 1. Добавили импорт

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <Analytics /> {/* 2. Вставили счетчик */}
  </React.StrictMode>,
)
