import { html } from '../utils/dom.js';

let toastId = 0;

export function showToast(type, title, message = '', duration = 4000) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const id = `toast-${++toastId}`;
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️',
    };

    const toast = document.createElement('div');
    toast.id = id;
    toast.className = `toast ${type}`;
    toast.innerHTML = html`
    <span class="toast-icon">${icons[type] || 'ℹ️'}</span>
    <div class="toast-body">
      <div class="toast-title">${title}</div>
      ${message ? html`<div class="toast-msg">${message}</div>` : ''}
    </div>
    <button class="toast-close" onclick="this.closest('.toast').remove()">✕</button>
  `;

    container.appendChild(toast);

    if (duration > 0) {
        setTimeout(() => {
            const el = document.getElementById(id);
            if (el) {
                el.classList.add('removing');
                setTimeout(() => el.remove(), 300);
            }
        }, duration);
    }
}
