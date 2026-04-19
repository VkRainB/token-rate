import { createApp } from 'vue';
import App from './App.vue';
import router from './modules/router';
import './assets/index.css';
import './assets/scrollbar.css';

const app = createApp(App);
router(app);
app.mount('#app');
