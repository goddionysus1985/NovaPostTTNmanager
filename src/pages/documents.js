/**
 * Documents Page — List of created TTNs
 * Improvements: full pagination, status-based filtering, improved UX
 */

import { getDocumentList, deleteTTN, getPrintUrl, getPrintUrlBatch, getPrintMarkingUrl, hasApiKey } from '../api/novaposhta.js';
import { showToast } from '../components/toast.js';
import { html } from '../utils/dom.js';
import { t } from '../utils/i18n.js';
import { getStatusClass } from '../utils/status.js';

/** @type {number} */
let currentPage = 1;
/** @type {object[]} */
let allDocuments = [];
/** @type {object} */
let currentInfo = {};

// ─── Render ───────────────────────────────────────────────────────────────────

export function renderDocuments() {
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
        <h1 class="page-title">${t('docs.title')}</h1>
        <p class="page-subtitle">${t('docs.subtitle')}</p>
      </div>

      <div class="card" style="margin-bottom: var(--space-lg);">
        <div class="form-grid" style="align-items: end;">
          <div class="form-group">
            <label class="form-label">${t('docs.date_from')}</label>
            <input type="text" class="form-input" id="docs-date-from" placeholder="ДД.ММ.РРРР">
          </div>
          <div class="form-group">
            <label class="form-label">${t('docs.date_to')}</label>
            <input type="text" class="form-input" id="docs-date-to" placeholder="ДД.ММ.РРРР">
          </div>
          <div class="form-group">
            <button class="btn btn-primary" id="docs-filter-btn">${t('docs.filter')}</button>
          </div>
          <div class="form-group">
            <button class="btn btn-secondary" id="docs-print-selected-btn" disabled>${t('docs.print_selected')}</button>
          </div>
        </div>
      </div>

      <div class="card" id="documents-card">
        <div id="documents-table">
          <div style="text-align: center; padding: var(--space-xl);">
            <div class="spinner spinner-lg" style="margin: 0 auto;"></div>
            <p style="margin-top: var(--space-sm); color: var(--text-muted);">${t('docs.loading')}</p>
          </div>
        </div>
      </div>

      <div id="pagination" style="display: flex; justify-content: center; align-items: center; gap: var(--space-sm); margin-top: var(--space-lg); flex-wrap: wrap;"></div>
    </div>
  `;
}

// ─── Init ─────────────────────────────────────────────────────────────────────

export async function initDocuments() {
  if (!hasApiKey()) return;

  // Set default dates (last 30 days)
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const fromEl = document.getElementById('docs-date-from');
  const toEl = document.getElementById('docs-date-to');
  if (fromEl) fromEl.value = formatDate(thirtyDaysAgo);
  if (toEl) toEl.value = formatDate(now);

  // Filter button
  document.getElementById('docs-filter-btn')?.addEventListener('click', () => {
    currentPage = 1;
    loadDocuments(1);
  });

  // Print selected
  document.getElementById('docs-print-selected-btn')?.addEventListener('click', printSelected);

  await loadDocuments(1);
}

// ─── Load & Render Table ──────────────────────────────────────────────────────

async function loadDocuments(page) {
  currentPage = page;
  const tableEl = document.getElementById('documents-table');
  if (!tableEl) return;

  const fromEl = document.getElementById('docs-date-from');
  const toEl = document.getElementById('docs-date-to');

  tableEl.innerHTML = html`
    <div style="text-align: center; padding: var(--space-xl);">
      <div class="spinner spinner-lg" style="margin: 0 auto;"></div>
      <p style="margin-top: var(--space-sm); color: var(--text-muted);">${t('docs.loading2')}</p>
    </div>
  `;
  renderPagination(null); // clear pagination while loading

  try {
    const result = await getDocumentList(
      fromEl?.value || '',
      toEl?.value || '',
      page,
    );
    allDocuments = result.documents || [];
    currentInfo = result.info || {};

    if (allDocuments.length === 0) {
      tableEl.innerHTML = html`
        <div class="empty-state">
          <div class="empty-icon">📭</div>
          <div class="empty-title">${t('docs.no_docs')}</div>
          <p>${t('docs.no_docs_msg')}</p>
        </div>
      `;
      renderPagination(null);
      return;
    }

    renderTable(tableEl);
    bindTableEvents(tableEl);
    renderPagination(currentInfo);

  } catch (err) {
    showToast('error', t('docs.error'), err.message);
    tableEl.innerHTML = html`
      <div class="empty-state">
        <div class="empty-icon">❌</div>
        <div class="empty-title">${t('docs.error')}</div>
        <p>${err.message}</p>
      </div>
    `;
    renderPagination(null);
  }
}

// ─── Table Rendering ──────────────────────────────────────────────────────────

function renderTable(tableEl) {
  tableEl.innerHTML = html`
    <div class="table-wrapper">
      <table class="table">
        <thead>
          <tr>
            <th><input type="checkbox" id="select-all-docs" title="Вибрати всі"></th>
            <th>${t('docs.col_ttn')}</th>
            <th>${t('docs.col_date')}</th>
            <th>${t('docs.col_recipient')}</th>
            <th>${t('docs.col_city')}</th>
            <th>${t('docs.col_weight')}</th>
            <th>${t('docs.col_cost')}</th>
            <th>${t('docs.col_status')}</th>
            <th>${t('docs.col_actions')}</th>
          </tr>
        </thead>
        <tbody>
          ${allDocuments.map(d => renderRow(d))}
        </tbody>
      </table>
    </div>
  `;
}

function renderRow(d) {
  const statusClass = getStatusClass(d.StateName);
  return html`
    <tr data-ref="${d.Ref}">
      <td><input type="checkbox" class="doc-checkbox" value="${d.Ref}" data-number="${d.IntDocNumber}"></td>
      <td class="ttn-number" style="font-family: 'Courier New', monospace; font-weight: 600;">${d.IntDocNumber || ''}</td>
      <td>${d.DateTime || ''}</td>
      <td>${d.RecipientContactPerson || d.RecipientsPhone || ''}</td>
      <td style="max-width:150px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${d.RecipientAddressDescription || d.CityRecipientDescription || ''}">${d.RecipientAddressDescription || d.CityRecipientDescription || ''}</td>
      <td>${d.Weight || ''} кг</td>
      <td>${d.CostOnSite || d.Cost || '—'}</td>
      <td><span class="status-badge ${statusClass}">${d.StateName || '—'}</span></td>
      <td>
        <div class="btn-group" style="flex-wrap: nowrap;">
          <a href="${getPrintUrl(d.IntDocNumber)}" target="_blank" class="btn btn-ghost btn-sm" title="Друкувати A4">🖨️</a>
          <a href="${getPrintMarkingUrl(d.IntDocNumber)}" target="_blank" class="btn btn-ghost btn-sm" title="Маркування">🏷️</a>
          <button class="btn btn-danger btn-sm delete-doc-btn" data-ref="${d.Ref}" data-number="${d.IntDocNumber}" title="Видалити">🗑️</button>
        </div>
      </td>
    </tr>
  `;
}

// ─── Table Events ─────────────────────────────────────────────────────────────

function bindTableEvents(tableEl) {
  // Select-all
  const selectAll = tableEl.querySelector('#select-all-docs');
  if (selectAll) {
    selectAll.addEventListener('change', () => {
      tableEl.querySelectorAll('.doc-checkbox').forEach(cb => {
        cb.checked = selectAll.checked;
      });
      updatePrintBtn();
    });
  }

  // Individual checkboxes
  tableEl.querySelectorAll('.doc-checkbox').forEach(cb => {
    cb.addEventListener('change', updatePrintBtn);
  });

  // Delete buttons
  tableEl.querySelectorAll('.delete-doc-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const { ref, number } = btn.dataset;
      if (!confirm(`${t('docs.confirm_delete')} ${number}?`)) return;

      btn.disabled = true;
      try {
        await deleteTTN(ref);
        showToast('success', t('docs.deleted'), `ТТН ${number} видалена`);
        await loadDocuments(currentPage);
      } catch (err) {
        showToast('error', t('docs.delete_error'), err.message);
        btn.disabled = false;
      }
    });
  });
}

// ─── Pagination ───────────────────────────────────────────────────────────────

/**
 * Render pagination controls.
 * Nova Poshta API returns info.totalCount and info.page; pages are 1-based.
 * @param {object|null} info - API info object: { totalCount, Page, limit, ... }
 */
function renderPagination(info) {
  const paginationEl = document.getElementById('pagination');
  if (!paginationEl) return;

  if (!info) {
    paginationEl.innerHTML = '';
    return;
  }

  // Nova Poshta API returns different field names across endpoints — handle both
  const total = parseInt(info.TotalCount ?? info.totalCount ?? 0);
  const limit = parseInt(info.Limit ?? info.limit ?? 100);
  const totalPages = limit > 0 ? Math.ceil(total / limit) : 1;

  if (totalPages <= 1) {
    paginationEl.innerHTML = total > 0
      ? html`<span style="color: var(--text-muted); font-size: var(--font-size-sm);">${t('docs.total')}: ${total}</span>`
      : '';
    return;
  }

  const pages = buildPageNumbers(currentPage, totalPages);

  paginationEl.innerHTML = html`
    <span style="color: var(--text-muted); font-size: var(--font-size-sm); margin-right: var(--space-sm);">
      ${t('docs.total')}: ${total}
    </span>
    <button
      class="btn btn-ghost btn-sm"
      id="page-prev"
      ${currentPage <= 1 ? 'disabled' : ''}
    >${t('docs.prev')}</button>

    ${pages.map(p =>
      p === '...'
        ? html`<span style="padding: 0 var(--space-xs); color: var(--text-muted);">…</span>`
        : html`<button
            class="btn btn-sm ${p === currentPage ? 'btn-primary' : 'btn-ghost'} page-num-btn"
            data-page="${p}"
          >${p}</button>`
    )}

    <button
      class="btn btn-ghost btn-sm"
      id="page-next"
      ${currentPage >= totalPages ? 'disabled' : ''}
    >${t('docs.next')}</button>
  `;

  // Bind buttons
  paginationEl.querySelector('#page-prev')?.addEventListener('click', () => loadDocuments(currentPage - 1));
  paginationEl.querySelector('#page-next')?.addEventListener('click', () => loadDocuments(currentPage + 1));
  paginationEl.querySelectorAll('.page-num-btn').forEach(btn => {
    btn.addEventListener('click', () => loadDocuments(parseInt(btn.dataset.page)));
  });
}

/**
 * Build a compact array of page numbers with ellipsis.
 * Example: [1, '...', 4, 5, 6, '...', 20]
 * @param {number} current
 * @param {number} total
 * @returns {(number|string)[]}
 */
function buildPageNumbers(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages = new Set([1, total, current]);
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
    pages.add(i);
  }

  const sorted = [...pages].sort((a, b) => a - b);
  const result = [];
  let prev = 0;

  for (const p of sorted) {
    if (p - prev > 1) result.push('...');
    result.push(p);
    prev = p;
  }
  return result;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function updatePrintBtn() {
  const btn = document.getElementById('docs-print-selected-btn');
  const checked = document.querySelectorAll('.doc-checkbox:checked');
  if (btn) btn.disabled = checked.length === 0;
}

function printSelected() {
  const checked = document.querySelectorAll('.doc-checkbox:checked');
  const numbers = Array.from(checked).map(cb => cb.dataset.number).filter(Boolean);

  if (numbers.length === 0) {
    showToast('warning', t('docs.warn_print'), '');
    return;
  }

  // Warn about URL-length limits (rough threshold: ~30 numbers)
  if (numbers.length > 30) {
    showToast('warning', t('docs.warn_too_many'), '');
  }

  const url = getPrintUrlBatch(numbers, 'pdf');
  window.open(url, '_blank');
}


function formatDate(d) {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}.${mm}.${d.getFullYear()}`;
}
