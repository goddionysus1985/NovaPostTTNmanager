import { html } from '../utils/dom.js';
import { t, getLanguage } from '../utils/i18n.js';

export function renderHeader(activePage) {
  const currentLang = getLanguage();
  const pages = [
    { id: 'dashboard', icon: '📊', label: t('nav.dashboard') },
    { id: 'create', icon: '📝', label: t('nav.create') },
    { id: 'tracking', icon: '🔍', label: t('nav.tracking') },
    { id: 'documents', icon: '📄', label: t('nav.documents') },
    { id: 'settings', icon: '⚙️', label: t('nav.settings') },
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
          
          <div class="header-actions">
            <button class="lang-toggle" id="lang-toggle" title="Змінити мову" aria-label="Змінити мову">
              ${currentLang.toUpperCase()}
            </button>
            <button class="theme-toggle" id="theme-toggle" title="${t('theme.toggle')}" aria-label="${t('theme.toggle')}">
              ${document.documentElement.getAttribute('data-theme') === 'light' ? '🌙' : '☀️'}
            </button>
          </div>
        </div>
      </div>
    </header>
  `;
}

