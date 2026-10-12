import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import '@fontsource-variable/inter'
import '@fontsource/bebas-neue/400.css'
import '@fontsource/pt-serif/400.css'
import '@fontsource/pt-serif/700.css'

import './styles/index.css'

import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <App />
    </StrictMode>
)
