/**
 * Dashboard Page
 */

import { getDocumentList, trackDocument, hasApiKey } from '../api/novaposhta.js';
import { showToast } from '../components/toast.js';
import { html } from '../utils/dom.js';
import { t } from '../utils/i18n.js';
import { getStatusClass } from '../utils/status.js';

export async function renderDashboard() {
  if (!hasApiKey()) {
    return html`
      <div class="main-content page-enter">
        <div class="empty-state">
          <div class="empty-icon">🔑</div>
          <div class="empty-title">${t('create.set_api_key')}</div>
          <p>${t('create.go_to_settings')} <a href="#" data-nav="settings">${t('nav.settings')}</a></p>
        </div>
      </div>
    `;
  }

  return html`
    <div class="main-content page-enter">
      <div class="page-header">
        <h1 class="page-title">${t('dash.title')}</h1>
        <p class="page-subtitle">${t('dash.subtitle')}</p>
      </div>

      <div class="stats-grid" id="stats-grid">
        <div class="stat-card">
          <div class="stat-label">${t('dash.loading')}</div>
          <div class="stat-value accent"><div class="spinner"></div></div>
        </div>
      </div>

      <div class="btn-group" style="margin-bottom: var(--space-xl);">
        <button class="btn btn-primary btn-lg" data-nav="create" id="quick-create-btn">
          📝 ${t('dash.create_btn')}
        </button>
        <button class="btn btn-secondary btn-lg" data-nav="tracking" id="quick-track-btn">
          🔍 ${t('dash.track_btn')}
        </button>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="card-title"><span class="icon">📋</span> ${t('dash.recent')}</div>
          <button class="btn btn-ghost btn-sm" data-nav="documents">${t('dash.all_ttn')}</button>
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
          <div class="stat-label">${t('dash.total_30')}</div>
          <div class="stat-value accent">${totalDocs}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">${t('dash.in_transit')}</div>
          <div class="stat-value warning">${inTransit}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">${t('dash.delivered')}</div>
          <div class="stat-value success">${delivered}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">${t('dash.other')}</div>
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
            <div class="empty-title">${t('dash.no_shipments')}</div>
            <p>${t('dash.create_first')}</p>
          </div>
        `;
      } else {
        recentEl.innerHTML = html`
          <div class="table-wrapper">
            <table class="table">
              <thead>
                <tr>
                  <th>${t('dash.col_ttn')}</th>
                  <th>${t('dash.col_date')}</th>
                  <th>${t('dash.col_recipient')}</th>
                  <th>${t('dash.col_cost')}</th>
                  <th>${t('dash.col_status')}</th>
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
    showToast('error', t('dash.error'), err.message);
    const statsGrid = document.getElementById('stats-grid');
    if (statsGrid) {
      statsGrid.innerHTML = html`
        <div class="stat-card">
          <div class="stat-label">${t('dash.error')}</div>
          <div class="stat-value" style="font-size: var(--font-size-sm); color: var(--error);">${err.message}</div>
        </div>
      `;
    }
  }
}


