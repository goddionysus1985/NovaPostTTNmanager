/**
 * Documents Page — List of created TTNs
 */

import { getDocumentList, deleteTTN, getPrintUrl, getPrintUrlBatch, getPrintMarkingUrl, hasApiKey } from '../api/novaposhta.js';
import { showToast } from '../components/toast.js';
import { html } from '../utils/dom.js';

let currentPage = 1;
let allDocuments = [];

export function renderDocuments() {
  if (!hasApiKey()) {
    return html`
      <div class="main-content page-enter">
        <div class="empty-state">
          <div class="empty-icon">🔑</div>
          <div class="empty-title">Встановіть API ключ</div>
          <p>Перейдіть до <a href="#" data-nav="settings">Налаштувань</a></p>
        </div>
      </div>
    `;
  }

  return html`
    <div class="main-content page-enter">
      <div class="page-header">
        <h1 class="page-title">Мої ТТН</h1>
        <p class="page-subtitle">Список створених товарно-транспортних накладних</p>
      </div>

      <div class="card" style="margin-bottom: var(--space-lg);">
        <div class="form-grid" style="align-items: end;">
          <div class="form-group">
            <label class="form-label">Дата від</label>
            <input type="text" class="form-input" id="docs-date-from" placeholder="ДД.ММ.РРРР">
          </div>
          <div class="form-group">
            <label class="form-label">Дата до</label>
            <input type="text" class="form-input" id="docs-date-to" placeholder="ДД.ММ.РРРР">
          </div>
          <div class="form-group">
            <button class="btn btn-primary" id="docs-filter-btn">🔍 Фільтрувати</button>
          </div>
          <div class="form-group">
            <button class="btn btn-secondary" id="docs-print-selected-btn" disabled>🖨️ Друк обраних</button>
          </div>
        </div>
      </div>

      <div class="card" id="documents-card">
        <div id="documents-table">
          <div style="text-align: center; padding: var(--space-xl);">
            <div class="spinner spinner-lg" style="margin: 0 auto;"></div>
            <p style="margin-top: var(--space-sm); color: var(--text-muted);">Завантаження документів...</p>
          </div>
        </div>
      </div>

      <div class="btn-group" style="justify-content: center; margin-top: var(--space-lg);" id="pagination"></div>
    </div>
  `;
}

export async function initDocuments() {
  if (!hasApiKey()) return;

  // Set default dates (last 30 days)
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const formatDate = (d) => {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd}.${mm}.${d.getFullYear()}`;
  };

  const fromEl = document.getElementById('docs-date-from');
  const toEl = document.getElementById('docs-date-to');
  if (fromEl) fromEl.value = formatDate(thirtyDaysAgo);
  if (toEl) toEl.value = formatDate(now);

  // Filter button
  const filterBtn = document.getElementById('docs-filter-btn');
  if (filterBtn) {
    filterBtn.addEventListener('click', () => loadDocuments(1));
  }

  // Print selected
  const printBtn = document.getElementById('docs-print-selected-btn');
  if (printBtn) {
    printBtn.addEventListener('click', printSelected);
  }

  await loadDocuments(1);
}

async function loadDocuments(page) {
  currentPage = page;
  const tableEl = document.getElementById('documents-table');
  if (!tableEl) return;

  const fromEl = document.getElementById('docs-date-from');
  const toEl = document.getElementById('docs-date-to');

  tableEl.innerHTML = html`
    <div style="text-align: center; padding: var(--space-xl);">
      <div class="spinner spinner-lg" style="margin: 0 auto;"></div>
    </div>
  `;

  try {
    const result = await getDocumentList(fromEl?.value || '', toEl?.value || '', page);
    allDocuments = result.documents || [];

    if (allDocuments.length === 0) {
      tableEl.innerHTML = html`
        <div class="empty-state">
          <div class="empty-icon">📭</div>
          <div class="empty-title">Немає документів</div>
          <p>За обраний період ТТН не знайдено</p>
        </div>
      `;
      return;
    }

    tableEl.innerHTML = html`
      <div class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th><input type="checkbox" id="select-all-docs"></th>
              <th>№ ТТН</th>
              <th>Дата</th>
              <th>Отримувач</th>
              <th>Місто</th>
              <th>Вага</th>
              <th>Вартість</th>
              <th>Статус</th>
              <th>Дії</th>
            </tr>
          </thead>
          <tbody>
            ${allDocuments.map(d => {
      const statusClass = getDocStatusClass(d.StateName);
      return html`
                <tr data-ref="${d.Ref}">
                  <td><input type="checkbox" class="doc-checkbox" value="${d.Ref}" data-number="${d.IntDocNumber}"></td>
                  <td class="ttn-number">${d.IntDocNumber || ''}</td>
                  <td>${d.DateTime || ''}</td>
                  <td>${d.RecipientContactPerson || d.RecipientsPhone || ''}</td>
                  <td style="max-width:150px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${d.RecipientAddressDescription || d.CityRecipientDescription || ''}</td>
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
    })}
          </tbody>
        </table>
      </div>
    `;

    // Select all checkbox
    const selectAll = document.getElementById('select-all-docs');
    if (selectAll) {
      selectAll.addEventListener('change', () => {
        document.querySelectorAll('.doc-checkbox').forEach(cb => {
          cb.checked = selectAll.checked;
        });
        updatePrintBtn();
      });
    }

    // Individual checkboxes
    document.querySelectorAll('.doc-checkbox').forEach(cb => {
      cb.addEventListener('change', updatePrintBtn);
    });

    // Delete buttons
    document.querySelectorAll('.delete-doc-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const ref = btn.dataset.ref;
        const number = btn.dataset.number;
        if (!confirm(`Видалити ТТН ${number}?`)) return;

        btn.disabled = true;
        try {
          await deleteTTN(ref);
          showToast('success', 'Видалено', `ТТН ${number} видалена`);
          loadDocuments(currentPage);
        } catch (err) {
          showToast('error', 'Помилка видалення', err.message);
          btn.disabled = false;
        }
      });
    });

  } catch (err) {
    showToast('error', 'Помилка', err.message);
    tableEl.innerHTML = html`
      <div class="empty-state">
        <div class="empty-icon">❌</div>
        <div class="empty-title">Помилка завантаження</div>
        <p>${err.message}</p>
      </div>
    `;
  }
}


function updatePrintBtn() {
  const btn = document.getElementById('docs-print-selected-btn');
  const checked = document.querySelectorAll('.doc-checkbox:checked');
  if (btn) btn.disabled = checked.length === 0;
}

function printSelected() {
  const checked = document.querySelectorAll('.doc-checkbox:checked');
  const numbers = Array.from(checked).map(cb => cb.dataset.number).filter(n => n);

  if (numbers.length === 0) {
    showToast('warning', 'Увага', 'Оберіть ТТН для друку');
    return;
  }

  const url = getPrintUrlBatch(numbers, 'pdf');
  window.open(url, '_blank');
}

function getDocStatusClass(stateName) {
  if (!stateName) return '';
  if (stateName.includes('Отримана') || stateName.includes('Виконано')) return 'delivered';
  if (stateName.includes('дорозі') || stateName.includes('Прямує')) return 'in-transit';
  if (stateName.includes('Прибув')) return 'in-transit';
  if (stateName.includes('Нова') || stateName.includes('Створена')) return 'new';
  if (stateName.includes('Проблем') || stateName.includes('Відмова')) return 'problem';
  return 'new';
}
