import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { vMotion } from './directives/motion'
import './assets/main.css'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.directive('motion', vMotion)
app.mount('#app')
