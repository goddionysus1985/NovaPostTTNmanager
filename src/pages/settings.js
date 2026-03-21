/**
 * Settings Page
 */

import { setApiKey, hasApiKey, clearApiCache } from '../api/novaposhta.js';
import { showToast } from '../components/toast.js';
import { html } from '../utils/dom.js';

export function renderSettings() {
  const currentKey = localStorage.getItem('np_api_key') || '';
  const maskedKey = currentKey ? currentKey.substring(0, 8) + '••••••••••••••••••••' : '';

  return html`
    <div class="main-content page-enter">
      <div class="page-header">
        <h1 class="page-title">Налаштування</h1>
        <p class="page-subtitle">Конфігурація API ключа та параметрів додатку</p>
      </div>

      <div class="settings-section">
        <div class="card" style="margin-bottom: var(--space-lg);">
          <div class="card-header">
            <div class="card-title"><span class="icon">🔑</span> API Ключ Нової Пошти</div>
            ${hasApiKey() ? html`<span class="card-badge success">Встановлено</span>` : html`<span class="card-badge error">Не встановлено</span>`}
          </div>
          
          <div class="form-group" style="margin-bottom: var(--space-md);">
            <label class="form-label">Ваш API ключ</label>
            ${currentKey ? html`
              <div class="api-key-display">
                <span class="key-text" id="api-key-display">${maskedKey}</span>
                <button class="btn btn-ghost btn-sm" id="toggle-key-btn">👁️</button>
              </div>
            ` : ''}
          </div>

          <div class="form-group" style="margin-bottom: var(--space-md);">
            <label class="form-label">${currentKey ? 'Змінити API ключ' : 'Введіть API ключ'}</label>
            <input type="text" class="form-input" id="api-key-input" placeholder="Вставте API ключ з кабінету НП..." value="">
            <span class="form-hint">Отримати можна в <a href="https://new.novaposhta.ua/" target="_blank">особистому кабінеті</a> → Налаштування → Безпека → API ключ</span>
          </div>

          <div class="btn-group">
            <button class="btn btn-primary" id="save-key-btn">💾 Зберегти ключ</button>
            ${currentKey ? html`<button class="btn btn-danger" id="remove-key-btn">🗑️ Видалити ключ</button>` : ''}
          </div>
        </div>

        <div class="card" style="margin-bottom: var(--space-lg);">
          <div class="card-header">
            <div class="card-title"><span class="icon">💾</span> Дані додатку</div>
          </div>
          <p style="color: var(--text-secondary); font-size: var(--font-size-sm); margin-bottom: var(--space-md);">
            Усі дані зберігаються локально в вашому браузері (LocalStorage). API ключ ніколи не надсилається на сторонні сервери — тільки напряму на API Нової Пошти.
          </p>
          <div class="btn-group">
            <button class="btn btn-secondary" id="export-settings-btn">📤 Експорт налаштувань</button>
            <button class="btn btn-secondary" id="import-settings-btn">📥 Імпорт налаштувань</button>
            <button class="btn btn-secondary" id="clear-cache-btn">🗂️ Очистити кеш API</button>
            <button class="btn btn-danger" id="clear-data-btn">🗑️ Очистити дані</button>
          </div>
          <input type="file" id="import-file-input" accept=".json" style="display:none;">
        </div>

        <div class="card">
          <div class="card-header">
            <div class="card-title"><span class="icon">ℹ️</span> Про додаток</div>
          </div>
          <div style="color: var(--text-secondary); font-size: var(--font-size-sm);">
            <p><strong>Nova Post TTN Manager</strong> — веб-інтерфейс для створення та управління ТТН через API Нової Пошти.</p>
            <br>
            <p>Функції:</p>
            <ul style="margin-left: var(--space-lg); margin-top: var(--space-xs);">
              <li>Створення ТТН (фізичні особи та ФОП)</li>
              <li>Трекінг посилок за номером ТТН</li>
              <li>Список та управління документами</li>
              <li>Друк ТТН (A4) та маркування (100×100)</li>
              <li>Розрахунок вартості доставки</li>
              <li>Наложений платіж та зворотна доставка</li>
              <li>Підтримка всіх типів доставки</li>
            </ul>
            <br>
            <p style="color: var(--text-muted);">API: Nova Poshta v2.0 • Всі дані зберігаються локально</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function initSettings(navigateTo) {
  // Save key
  const saveBtn = document.getElementById('save-key-btn');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      const input = document.getElementById('api-key-input');
      const key = input?.value?.trim();
      if (!key) {
        showToast('warning', 'Увага', 'Введіть API ключ');
        return;
      }
      setApiKey(key);
      clearApiCache(); // flush stale API responses after key change
      showToast('success', 'Збережено', 'API ключ успішно збережено');
      if (navigateTo) navigateTo('settings');
    });
  }

  // Remove key
  const removeBtn = document.getElementById('remove-key-btn');
  if (removeBtn) {
    removeBtn.addEventListener('click', () => {
      if (confirm('Видалити API ключ?')) {
        localStorage.removeItem('np_api_key');
        showToast('info', 'Видалено', 'API ключ видалено');
        if (navigateTo) navigateTo('settings');
      }
    });
  }

  // Toggle key visibility
  const toggleBtn = document.getElementById('toggle-key-btn');
  if (toggleBtn) {
    let visible = false;
    toggleBtn.addEventListener('click', () => {
      const display = document.getElementById('api-key-display');
      const key = localStorage.getItem('np_api_key') || '';
      visible = !visible;
      display.textContent = visible ? key : key.substring(0, 8) + '••••••••••••••••••••';
      toggleBtn.textContent = visible ? '🙈' : '👁️';
    });
  }

  // Export settings
  const exportBtn = document.getElementById('export-settings-btn');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const data = {
        np_api_key: localStorage.getItem('np_api_key') || '',
        np_tracking_history: localStorage.getItem('np_tracking_history') || '[]',
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'np-ttn-manager-settings.json';
      a.click();
      URL.revokeObjectURL(url);
      showToast('success', 'Експортовано', 'Налаштування збережено в файл');
    });
  }

  // Import settings
  const importBtn = document.getElementById('import-settings-btn');
  const importFile = document.getElementById('import-file-input');
  if (importBtn && importFile) {
    importBtn.addEventListener('click', () => importFile.click());
    importFile.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target.result);
          if (data.np_api_key) localStorage.setItem('np_api_key', data.np_api_key);
          if (data.np_tracking_history) localStorage.setItem('np_tracking_history', data.np_tracking_history);
          showToast('success', 'Імпортовано', 'Налаштування відновлено');
          if (navigateTo) navigateTo('settings');
        } catch (err) {
          showToast('error', 'Помилка', 'Невірний формат файлу');
        }
      };
      reader.readAsText(file);
    });
  }

  // Clear API cache
  const clearCacheBtn = document.getElementById('clear-cache-btn');
  if (clearCacheBtn) {
    clearCacheBtn.addEventListener('click', () => {
      clearApiCache();
      showToast('success', 'Готово', 'Кеш API очищено. Дані будуть завантажені заново.');
    });
  }

  // Clear data
  const clearBtn = document.getElementById('clear-data-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (confirm('Видалити всі дані додатку? API ключ, кеш та історію пошуку?')) {
        localStorage.removeItem('np_api_key');
        localStorage.removeItem('np_tracking_history');
        clearApiCache();
        showToast('info', 'Очищено', 'Всі дані видалено');
        if (navigateTo) navigateTo('settings');
      }
    });
  }
}
