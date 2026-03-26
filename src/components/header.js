import { html } from '../utils/dom.js';

export function renderHeader(activePage) {
  const pages = [
    { id: 'dashboard', icon: '📊', label: 'Панель' },
    { id: 'create', icon: '📝', label: 'Створити ТТН' },
    { id: 'tracking', icon: '🔍', label: 'Трекінг' },
    { id: 'documents', icon: '📄', label: 'Мої ТТН' },
    { id: 'settings', icon: '⚙️', label: 'Налаштування' },
  ];

  return html`
    <header class="header">
      <div class="header-inner">
        <a class="logo" data-nav="dashboard">
          <div class="logo-icon">NP</div>
          <span>TTN Manager</span>
        </a>
        <div style="display: flex; align-items: center; gap: var(--space-md);">
          <nav class="nav">
            ${pages.map(p => html`
              <button class="nav-btn ${activePage === p.id ? 'active' : ''}" data-nav="${p.id}" id="nav-${p.id}">
                <span>${p.icon}</span>
                <span class="nav-text">${p.label}</span>
              </button>
            `)}
          </nav>
          <button class="theme-toggle" id="theme-toggle" title="Змінити тему" aria-label="Змінити тему">
            ${document.documentElement.getAttribute('data-theme') === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
      </div>
    </header>

  `;
}
