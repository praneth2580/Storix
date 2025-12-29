import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { HashRouter } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'
import { Provider } from 'react-redux'
import { store } from './store'
import { startSyncEngine } from './utils/syncEngine.ts'

startSyncEngine();

createRoot(document.getElementById('root')!).render(
  <Provider store={store}>
    <StrictMode>
      <HashRouter>
        <App />
      </HashRouter>
    </StrictMode>
  </Provider>,
)

registerSW({
  immediate: true
})
