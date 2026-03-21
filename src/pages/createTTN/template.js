import { hasApiKey } from '../../api/novaposhta.js';
import { state } from './state.js';
import { html } from '../../utils/dom.js';

export function renderCreateTTN() {
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

  const today = new Date();
  const dd = String(today.getDate()).padStart(2, '0');
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const yyyy = today.getFullYear();
  state.dateTime = `${dd}.${mm}.${yyyy}`;

  return html`
    <div class="main-content page-enter" style="max-width: 1600px;">
      <style>
        .create-ttn-grid {
          display: grid;
          grid-template-columns: 1fr 400px;
          gap: var(--space-md);
          align-items: start;
        }
        
        @media (max-width: 1200px) {
          .create-ttn-grid {
            grid-template-columns: 1fr;
          }
        }
        
        .compact-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: var(--space-md);
          margin-bottom: var(--space-md);
        }
        
        .compact-card-header {
          font-size: var(--font-size-sm);
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: var(--space-md);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .compact-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: var(--space-sm);
        }
        
        .compact-form-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .compact-label {
          font-size: 11px;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
        }
        
        .compact-input, .compact-select {
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid var(--border-color);
          border-radius: 4px;
          padding: 6px 10px;
          color: var(--text-primary);
          font-size: var(--font-size-sm);
          outline: none;
          width: 100%;
        }
        
        .compact-input:focus, .compact-select:focus {
          border-color: var(--accent);
        }
        
        /* Places Table */
        .places-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }
        
        .places-table th {
          text-align: left;
          font-size: 11px;
          color: var(--text-muted);
          padding: 8px;
          font-weight: 600;
          text-transform: uppercase;
        }
        
        .places-table td {
          padding: 4px;
          vertical-align: middle;
        }
        
        .dimension-input-group {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 4px;
        }
        
        /* SpecialCargo Switch */
        .switch {
          position: relative;
          display: inline-block;
          width: 36px;
          height: 20px;
        }
        
        .switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        
        .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #334155;
          transition: .4s;
          border-radius: 20px;
        }
        
        .slider:before {
          position: absolute;
          content: "";
          height: 14px;
          width: 14px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: .4s;
          border-radius: 50%;
        }
        
        input:checked + .slider {
          background-color: var(--accent);
        }
        
        input:checked + .slider:before {
          transform: translateX(16px);
        }
        
        .btn-remove-place {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.2);
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          cursor: pointer;
          transition: 0.2s;
        }
        
        .btn-remove-place:hover {
          background: #ef4444;
          color: white;
        }
        
        .sidebar-group {
          margin-bottom: var(--space-md);
        }
        
        .summary-item {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          font-size: var(--font-size-sm);
        }
        
        .summary-label {
          color: var(--text-muted);
        }
        
        .summary-value {
          font-weight: 600;
          color: var(--text-primary);
        }
      </style>

      <div class="create-ttn-grid">
        <!-- Main Form Column -->
        <div class="ttn-main-col">
          
          <!-- Package Info -->
          <div class="compact-card">
            <div class="compact-card-header">Інформація про посилку</div>
            <div class="compact-grid" style="margin-bottom: var(--space-md);">
              <div class="compact-form-group" id="sender-section-container">
                <label class="compact-label">Відправник <span class="required">*</span></label>
                <div id="sender-section">
                  <div class="spinner spinner-sm"></div>
                </div>
              </div>
              <div class="compact-form-group">
                <label class="compact-label">Тип відправлення <span class="required">*</span></label>
                <select class="compact-select" id="cargo-type">
                  <option value="Parcel">Посилка</option>
                  <option value="Cargo">Вантаж</option>
                  <option value="TiresWheels">Шини та диски</option>
                  <option value="Documents">Документи</option>
                </select>
              </div>
              <div class="compact-form-group">
                <label class="compact-label">Платник доставки <span class="required">*</span></label>
                <select class="compact-select" id="payer-type">
                  <option value="Recipient" selected>Отримувач</option>
                  <option value="Sender">Відправник</option>
                  <option value="ThirdPerson">Третя особа</option>
                </select>
              </div>
              <div class="compact-form-group">
                <label class="compact-label">Відділення НП <span class="required">*</span></label>
                <div id="sender-address-container">
                  <div class="spinner spinner-sm"></div>
                </div>
              </div>
            </div>
            <div class="compact-form-group" id="cargo-desc-group">
              <label class="compact-label">Опис вантажу <span class="required">*</span></label>
              <!-- autocomplete injected here -->
            </div>
            
            <!-- Hidden details for tires/wheels -->
            <div id="tires-wheels-group" style="display:none; margin-top: var(--space-sm);">
                <label class="compact-label">Вид шини/диска <span class="required">*</span></label>
                <select class="compact-select" id="tires-wheels-select">
                  <option value="d7c456c5-aa8b-11e3-9fa0-0050568002cf">Шина легкова R 13-14</option>
                  <option value="d7c456c6-aa8b-11e3-9fa0-0050568002cf">Шина легкова R 15-17</option>
                  <option value="d7c456c7-aa8b-11e3-9fa0-0050568002cf">Шина легкова R 18-19</option>
                  <option value="d7c456c8-aa8b-11e3-9fa0-0050568002cf">Шина легкова R 20-21</option>
                  <option value="d7c456c9-aa8b-11e3-9fa0-0050568002cf">Шина легкова R 22-23</option>
                  <option value="d7c456cf-aa8b-11e3-9fa0-0050568002cf">Диск легковий R 13-14</option>
                  <option value="d7c456d0-aa8b-11e3-9fa0-0050568002cf">Диск легковий R 15-17</option>
                  <option value="d7c456d1-aa8b-11e3-9fa0-0050568002cf">Диск легковий R 18-19</option>
                  <option value="d7c456d2-aa8b-11e3-9fa0-0050568002cf">Диск легковий R 20-21</option>
                  <option value="d7c456d3-aa8b-11e3-9fa0-0050568002cf">Диск легковий R 22-23</option>
                </select>
            </div>
          </div>

          <!-- Places -->
          <div class="compact-card">
            <div class="compact-card-header">Місця</div>
            <table class="places-table">
              <thead>
                <tr>
                  <th style="width: 40%;">Розміри, см (Д/Ш/В)</th>
                  <th style="width: 25%;">Вага, кг</th>
                  <th style="width: 25%;">SpecialCargo</th>
                  <th style="width: 10%;"></th>
                </tr>
              </thead>
              <tbody id="dimensions-container">
                <!-- Rows injected here -->
              </tbody>
            </table>
            
            <div style="display: flex; gap: var(--space-sm); margin-top: var(--space-md);">
              <button class="btn btn-primary btn-sm" id="btn-add-place">+ Додати місце</button>
              <button class="btn btn-secondary btn-sm" id="btn-calc-price-alt">📊 Розрахувати вартість</button>
            </div>
          </div>
          
          <!-- Actions footer -->
          <div class="compact-card" style="display: flex; align-items: center; justify-content: space-between; gap: var(--space-md);">
            <div style="display: flex; gap: var(--space-sm);">
                <button class="btn btn-primary" id="save-draft-btn" disabled>✔️ Зберегти</button>
                <button class="btn btn-success" id="submit-ttn-btn" style="background: #f97316; border-color: #ea580c;">+ Створити НП</button>
                
                <label class="switch-container" style="display: flex; align-items: center; gap: 8px; margin-left: 10px;">
                    <label class="switch">
                        <input type="checkbox" id="special-cargo-toggle-global">
                        <span class="slider"></span>
                    </label>
                    <span style="font-size: 11px; color: var(--text-muted);">SpecialCargo (РО)</span>
                </label>
            </div>
            
            <button class="btn btn-danger" id="delete-ttn-btn" style="background: #0ea5e9; border-color: #0284c7; color: white;">🗑️ Видалити ТТН</button>
          </div>

        </div>

        <!-- Sidebar Column -->
        <div class="ttn-sidebar-col">
          
          <!-- Client/Recipient Card -->
          <div class="compact-card">
            <div class="compact-card-header">Отримувач</div>
            
            <div class="compact-form-group sidebar-group">
                <label class="compact-label">ФІО клієнта <span class="required">*</span></label>
                <input type="text" class="compact-input" id="recipient-full-name-search" placeholder="Пошук клієнта...">
            </div>
            
            <!-- We keep the existing hidden/visible fields for logic compatibility -->
            <div id="recipient-fields-container">
                <div class="compact-form-group sidebar-group">
                    <label class="compact-label">ФІО отримувача <span class="required">*</span></label>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">
                        <input type="text" class="compact-input" id="recipient-lastname" placeholder="Прізвище">
                        <input type="text" class="compact-input" id="recipient-firstname" placeholder="Ім'я">
                    </div>
                </div>
                
                <div class="compact-form-group sidebar-group">
                    <label class="compact-label">Телефон отримувача <span class="required">*</span></label>
                    <input type="tel" class="compact-input" id="recipient-phone" placeholder="+38 (___) ___-__-__">
                </div>
            </div>

            <div class="compact-form-group sidebar-group">
                <label class="compact-label">Спосіб доставки <span class="required">*</span></label>
                <select class="compact-select" id="service-type">
                  <option value="WarehouseWarehouse">НП до відділення</option>
                  <option value="WarehouseDoors">Кур'єром на адресу</option>
                  <option value="DoorsWarehouse">Адреса → Відділення</option>
                  <option value="DoorsDoors">Адреса → Адреса</option>
                </select>
            </div>

            <div class="compact-form-group sidebar-group">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <label class="compact-label">Адреса доставки <span class="required">*</span></label>
                    <button class="btn btn-ghost btn-sm" id="open-map-btn" style="padding: 0; font-size: 10px;">🗺️ Карта</button>
                </div>
                <div id="recipient-city-group" style="margin-bottom: 4px;">
                    <!-- city AC -->
                </div>
                <div id="recipient-address-group">
                    <!-- warehouse AC -->
                </div>
                <div id="recipient-street-section" style="display:none;">
                    <div id="recipient-street-group" style="margin-bottom: 4px;"></div>
                    <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 4px;">
                        <input type="text" class="compact-input" id="recipient-building" placeholder="Буд.">
                        <input type="text" class="compact-input" id="recipient-flat" placeholder="Кв.">
                    </div>
                </div>
            </div>
          </div>

          <!-- Amounts card -->
          <div class="compact-card">
            <div class="compact-card-header">Суми</div>
            
            <div class="summary-list">
                <div class="summary-item">
                    <span class="summary-label">Сума ЗЧ</span>
                    <span class="summary-value" id="sum-parts">520 USD</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Сума аванса</span>
                    <span class="summary-value" id="sum-advance">23088.00 грн</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Сума доставки</span>
                    <span class="summary-value" id="sum-delivery-cost">0.00 грн</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Сума комісії перепродавця</span>
                    <span class="summary-value">0.00 USD</span>
                </div>
                
                <div class="compact-form-group" style="margin-top: 10px;">
                    <label class="compact-label">Оголошена цінність, UAH <span class="required">*</span></label>
                    <input type="number" class="compact-input" id="cargo-cost" value="23088">
                </div>
                
                <div class="compact-form-group" style="margin-top: 10px;">
                    <label class="compact-label">Наложений платіж, UAH / факт. <span class="required">*</span></label>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <input type="number" class="compact-input" id="backward-value" value="0.00">
                        <span style="font-size: 12px; font-weight: 600;">UAH</span>
                    </div>
                    <!-- hidden state for backward delivery -->
                    <input type="checkbox" id="backward-enabled" style="display:none;">
                </div>
            </div>
            
            <div id="price-estimate" style="margin-top: 15px;">
                <button class="btn btn-ghost btn-sm btn-block" id="calc-price-btn">💲 Розрахувати вартість доставки</button>
            </div>
          </div>

        </div>
      </div>
      
      <!-- Hidden/unused fields that might be needed by index.js logic -->
      <div style="display:none;">
          <input type="text" id="send-date" value="${state.dateTime}">
          <select id="payment-method"><option value="Cash">Cash</option></select>
          <input type="number" id="cargo-weight" value="1">
          <input type="number" id="cargo-seats" value="1">
          <textarea id="note"></textarea>
          <div id="recipient-type-tabs"><button data-type="PrivatePerson" id="tab-private" class="active"></button></div>
          <input type="text" id="recipient-middlename">
          <select id="backward-type"><option value="Money">Money</option></select>
          <select id="backward-payer"><option value="Recipient">Recipient</option></select>
      </div>
    </div>
  `;
}

