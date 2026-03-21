/**
 * Tracking Page
 */

import { trackDocument, hasApiKey } from '../api/novaposhta.js';
import { showToast } from '../components/toast.js';
import { html } from '../utils/dom.js';
import { getStatusClassByCode } from '../utils/status.js';

export function renderTracking() {
  return html`
    <div class="main-content page-enter">
      <div class="page-header">
        <h1 class="page-title">Трекінг посилки</h1>
        <p class="page-subtitle">Відстежуйте статус вашої посилки за номером ТТН</p>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="card-title"><span class="icon">🔍</span> Пошук за номером ТТН</div>
        </div>
        <div class="tracking-input-group">
          <input type="text" class="form-input" id="tracking-input" placeholder="Введіть номер ТТН (напр. 20450000000000)" autocomplete="off">
          <button class="btn btn-primary btn-lg" id="track-btn">🔍 Відстежити</button>
        </div>
        <div class="form-hint" style="margin-top: var(--space-sm);">Введіть 14-значний номер товарно-транспортної накладної</div>
      </div>

      <div id="tracking-result"></div>

      <!-- Recent tracked -->
      <div class="card" style="margin-top: var(--space-xl);">
        <div class="card-header">
          <div class="card-title"><span class="icon">🕐</span> Історія пошуку</div>
          <button class="btn btn-ghost btn-sm" id="clear-history-btn">Очистити</button>
        </div>
        <div id="tracking-history">
          <div class="empty-state">
            <p style="color: var(--text-muted);">Історія пошуку порожня</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function initTracking() {
  const input = document.getElementById('tracking-input');
  const btn = document.getElementById('track-btn');

  if (btn) {
    btn.addEventListener('click', () => doTrack(input?.value?.trim()));
  }

  if (input) {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') doTrack(input.value.trim());
    });
  }

  // Clear history
  const clearBtn = document.getElementById('clear-history-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      localStorage.removeItem('np_tracking_history');
      renderTrackingHistory();
    });
  }

  renderTrackingHistory();
}

async function doTrack(ttn) {
  // Validate TTN format: must be 14 digits
  if (!ttn) {
    showToast('warning', 'Увага', 'Введіть номер ТТН');
    return;
  }

  const cleanTTN = ttn.replace(/\s/g, '');
  if (!/^\d{14}$/.test(cleanTTN)) {
    showToast('warning', 'Невірний формат', 'Номер ТТН повинен містити рівно 14 цифр (напр.: 20451234567890)');
    return;
  }

  const input = document.getElementById('tracking-input');
  if (input) input.value = cleanTTN; // normalize display
  const resultEl = document.getElementById('tracking-result');
  const btn = document.getElementById('track-btn');

  btn.disabled = true;
  btn.innerHTML = html`<div class="spinner spinner-sm" style="display:inline-block;"></div>`;

  resultEl.innerHTML = html`
    <div class="card" style="margin-top: var(--space-xl);">
      <div style="text-align: center; padding: var(--space-lg);">
        <div class="spinner spinner-lg" style="margin: 0 auto;"></div>
        <p style="margin-top: var(--space-sm); color: var(--text-muted);">Пошук...</p>
      </div>
    </div>
  `;

  try {
    const data = await trackDocument(ttn);

    if (!data) {
      resultEl.innerHTML = html`
        <div class="card" style="margin-top: var(--space-xl);">
          <div class="empty-state">
            <div class="empty-icon">🔍</div>
            <div class="empty-title">Нічого не знайдено</div>
            <p>Перевірте правильність номера ТТН</p>
          </div>
        </div>
      `;
    } else {
  const statusClass = getStatusClassByCode(data.StatusCode);

      resultEl.innerHTML = html`
        <div class="card" style="margin-top: var(--space-xl);">
          <div class="card-header">
            <div class="card-title">
              <span class="icon">📦</span>
              <span class="ttn-number">${data.Number || ttn}</span>
            </div>
            <span class="status-badge ${statusClass}">${data.Status || '—'}</span>
          </div>

          <div class="form-grid">
            <div class="form-group">
              <div class="form-label">Статус</div>
              <div style="font-weight: 500; color: var(--text-primary);">${data.Status || '—'}</div>
            </div>
            <div class="form-group">
              <div class="form-label">Дата створення</div>
              <div style="color: var(--text-primary);">${data.DateCreated || '—'}</div>
            </div>
            <div class="form-group">
              <div class="form-label">Відправник</div>
              <div style="color: var(--text-primary);">${data.CitySender || ''} ${data.WarehouseSender || ''}</div>
            </div>
            <div class="form-group">
              <div class="form-label">Отримувач</div>
              <div style="color: var(--text-primary);">${data.CityRecipient || ''} ${data.WarehouseRecipient || ''}</div>
            </div>
            <div class="form-group">
              <div class="form-label">Вага</div>
              <div style="color: var(--text-primary);">${data.DocumentWeight || '—'} кг</div>
            </div>
            <div class="form-group">
              <div class="form-label">Вартість доставки</div>
              <div style="color: var(--text-primary);">${data.DocumentCost || '—'} грн</div>
            </div>
            ${data.AnnouncedPrice ? html`
              <div class="form-group">
                <div class="form-label">Оціночна вартість</div>
                <div style="color: var(--text-primary);">${data.AnnouncedPrice} грн</div>
              </div>
            ` : ''}
            ${data.RedeliverySum ? html`
              <div class="form-group">
                <div class="form-label">Наложений платіж</div>
                <div style="color: var(--accent-light); font-weight: 600;">${data.RedeliverySum} грн</div>
              </div>
            ` : ''}
            ${data.ScheduledDeliveryDate ? html`
              <div class="form-group">
                <div class="form-label">Дата доставки (план)</div>
                <div style="color: var(--text-primary);">${data.ScheduledDeliveryDate}</div>
              </div>
            ` : ''}
            ${data.RecipientDateTime ? html`
              <div class="form-group">
                <div class="form-label">Дата отримання</div>
                <div style="color: var(--success); font-weight: 500;">${data.RecipientDateTime}</div>
              </div>
            ` : ''}
            ${data.ActualDeliveryDate ? html`
              <div class="form-group">
                <div class="form-label">Фактична доставка</div>
                <div style="color: var(--text-primary);">${data.ActualDeliveryDate}</div>
              </div>
            ` : ''}
          </div>

          ${data.TrackingUpdateDate ? html`
            <div style="margin-top: var(--space-md); padding-top: var(--space-sm); border-top: 1px solid var(--border-color); color: var(--text-muted); font-size: var(--font-size-xs);">
              Останнє оновлення: ${data.TrackingUpdateDate}
            </div>
          ` : ''}
        </div>
      `;

      // Save to history
      saveToHistory(ttn, data.Status);
    }
  } catch (err) {
    showToast('error', 'Помилка', err.message);
    resultEl.innerHTML = html`
      <div class="card" style="margin-top: var(--space-xl);">
        <div class="empty-state">
          <div class="empty-icon">❌</div>
          <div class="empty-title">Помилка</div>
          <p>${err.message}</p>
        </div>
      </div>
    `;
  }

  btn.disabled = false;
  btn.innerHTML = '🔍 Відстежити';
}

function saveToHistory(ttn, status) {
  let history = [];
  try {
    history = JSON.parse(localStorage.getItem('np_tracking_history') || '[]');
  } catch { }

  // Remove if exists
  history = history.filter(h => h.ttn !== ttn);

  // Add to beginning
  history.unshift({
    ttn,
    status: status || '—',
    date: new Date().toLocaleString('uk-UA'),
  });

  // Keep last 20
  history = history.slice(0, 20);

  localStorage.setItem('np_tracking_history', JSON.stringify(history));
  renderTrackingHistory();
}

function renderTrackingHistory() {
  const container = document.getElementById('tracking-history');
  if (!container) return;

  let history = [];
  try {
    history = JSON.parse(localStorage.getItem('np_tracking_history') || '[]');
  } catch { }

  if (history.length === 0) {
    container.innerHTML = html`
      <div class="empty-state">
        <p style="color: var(--text-muted);">Історія пошуку порожня</p>
      </div>
    `;
    return;
  }

  container.innerHTML = html`
    <div class="table-wrapper">
      <table class="table">
        <thead>
          <tr>
            <th>№ ТТН</th>
            <th>Статус</th>
            <th>Дата пошуку</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${history.map(h => html`
            <tr>
              <td class="ttn-number" style="cursor:pointer;" data-track="${h.ttn}">${h.ttn}</td>
              <td>${h.status}</td>
              <td>${h.date}</td>
              <td>
                <button class="btn btn-ghost btn-sm" data-track="${h.ttn}">🔍</button>
              </td>
            </tr>
          `)}
        </tbody>
      </table>
    </div>
  `;

  // Click handlers
  container.querySelectorAll('[data-track]').forEach(el => {
    el.addEventListener('click', () => {
      const ttn = el.dataset.track;
      const input = document.getElementById('tracking-input');
      if (input) input.value = ttn;
      doTrack(ttn);
    });
  });
}
