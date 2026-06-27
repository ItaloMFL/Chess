// Importa o App com extensão .js
import { App } from './app.js';

const root = document.getElementById('app');
if (root) {
    root.appendChild(App());
}