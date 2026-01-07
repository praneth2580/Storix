import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from './App'
import { registerSW } from 'virtual:pwa-register'
import { Provider } from 'react-redux'
import { store } from './store'
import { updateGsWorkerIframe } from './models/accounts/gsMutator'

// Initialize gs-worker iframe with accounts database script ID
updateGsWorkerIframe();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>,
)

registerSW({
  immediate: true
})
