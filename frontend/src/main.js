// frontend/src/main.js
import { createApp } from 'vue'
import App from './App.vue'
import { vuetify } from './plugins/vuetify' // Importa nossa config

const app = createApp(App)
app.use(vuetify) // Usa o Vuetify
app.mount('#app')