/**
 * Dashboard Page
 */

import { getDocumentList, trackDocument, hasApiKey } from '../api/novaposhta.js';
import { showToast } from '../components/toast.js';
import { html } from '../utils/dom.js';
import { getStatusClass } from '../utils/status.js';

export async function renderDashboard() {
  if (!hasApiKey()) {
    return html`
      <div class="main-content page-enter">
        <div class="empty-state">
          <div class="empty-icon">🔑</div>
          <div class="empty-title">Встановіть API ключ</div>
          <p>Перейдіть до <a href="#" data-nav="settings">Налаштувань</a> та введіть ваш API ключ Нової Пошти</p>
        </div>
      </div>
    `;
  }

  return html`
    <div class="main-content page-enter">
      <div class="page-header">
        <h1 class="page-title">Панель управління</h1>
        <p class="page-subtitle">Огляд ваших відправлень та швидкі дії</p>
      </div>

      <div class="stats-grid" id="stats-grid">
        <div class="stat-card">
          <div class="stat-label">Завантаження...</div>
          <div class="stat-value accent"><div class="spinner"></div></div>
        </div>
      </div>

      <div class="btn-group" style="margin-bottom: var(--space-xl);">
        <button class="btn btn-primary btn-lg" data-nav="create" id="quick-create-btn">
          📝 Створити нову ТТН
        </button>
        <button class="btn btn-secondary btn-lg" data-nav="tracking" id="quick-track-btn">
          🔍 Відстежити посилку
        </button>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="card-title"><span class="icon">📋</span> Останні відправлення</div>
          <button class="btn btn-ghost btn-sm" data-nav="documents">Всі ТТН →</button>
        </div>
        <div id="recent-documents">
          <div style="text-align:center; padding: var(--space-lg);">
            <div class="spinner spinner-lg" style="margin: 0 auto;"></div>
          </div>
        </div>
      </div>
    </div>
  `;
}

export async function initDashboard() {
  if (!hasApiKey()) return;

  try {
    // Get today's date and 30 days ago
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const formatDate = (d) => {
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      return `${dd}.${mm}.${yyyy}`;
    };

    const result = await getDocumentList(formatDate(thirtyDaysAgo), formatDate(now), 1);
    const docs = result.documents || [];

    // Stats
    const totalDocs = docs.length;
    const inTransit = docs.filter(d =>
      ['Відправлення в дорозі', 'Прибув у відділення', 'Прямує у відділення'].some(s =>
        d.StateName?.includes(s) || d.StatusCode === '5' || d.StatusCode === '7'
      )
    ).length;
    const delivered = docs.filter(d =>
      d.StateName?.includes('Отримана') || d.StatusCode === '9'
    ).length;

    const statsGrid = document.getElementById('stats-grid');
    if (statsGrid) {
      statsGrid.innerHTML = html`
        <div class="stat-card">
          <div class="stat-label">Всього ТТН (30 днів)</div>
          <div class="stat-value accent">${totalDocs}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">В дорозі</div>
          <div class="stat-value warning">${inTransit}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Доставлено</div>
          <div class="stat-value success">${delivered}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Інші</div>
          <div class="stat-value info">${totalDocs - inTransit - delivered}</div>
        </div>
      `;
    }

    // Recent documents table
    const recentEl = document.getElementById('recent-documents');
    if (recentEl) {
      const recentDocs = docs.slice(0, 10);
      if (recentDocs.length === 0) {
        recentEl.innerHTML = html`
          <div class="empty-state">
            <div class="empty-icon">📦</div>
            <div class="empty-title">Немає відправлень</div>
            <p>Створіть першу ТТН</p>
          </div>
        `;
      } else {
        recentEl.innerHTML = html`
          <div class="table-wrapper">
            <table class="table">
              <thead>
                <tr>
                  <th>№ ТТН</th>
                  <th>Дата</th>
                  <th>Отримувач</th>
                  <th>Вартість, грн</th>
                  <th>Статус</th>
                </tr>
              </thead>
              <tbody>
                ${recentDocs.map(d => {
          const statusClass = getStatusClass(d.StateName);
          return html`
                    <tr>
                      <td class="ttn-number">${d.IntDocNumber || d.Ref}</td>
                      <td>${d.DateTime || ''}</td>
                      <td>${d.RecipientContactPerson || d.RecipientsPhone || ''}</td>
                      <td>${d.CostOnSite || d.Cost || '—'}</td>
                      <td><span class="status-badge ${statusClass}">${d.StateName || '—'}</span></td>
                    </tr>
                  `;
        })}
              </tbody>
            </table>
          </div>
        `;
      }
    }
  } catch (err) {
    showToast('error', 'Помилка завантаження', err.message);
    const statsGrid = document.getElementById('stats-grid');
    if (statsGrid) {
      statsGrid.innerHTML = html`
        <div class="stat-card">
          <div class="stat-label">Помилка</div>
          <div class="stat-value" style="font-size: var(--font-size-sm); color: var(--error);">${err.message}</div>
        </div>
      `;
    }
  }
}


