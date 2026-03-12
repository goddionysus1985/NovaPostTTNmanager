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
    <div class="main-content page-enter">
      <div class="page-header">
        <h1 class="page-title">Створити ТТН</h1>
        <p class="page-subtitle">Заповніть форму для створення нової товарно-транспортної накладної</p>
      </div>

      <div class="create-ttn-layout">
        <div class="ttn-form-main">
          
          <!-- SENDER SECTION -->
          <div class="card">
            <div class="card-header">
              <div class="card-title"><span class="icon">📤</span> Відправник</div>
              <span class="card-badge info">Крок 1</span>
            </div>
            <div id="sender-section">
              <div style="text-align:center; padding: var(--space-lg);">
                <div class="spinner" style="margin: 0 auto;"></div>
                <p style="margin-top: var(--space-sm); color: var(--text-muted); font-size: var(--font-size-sm);">Завантаження даних відправника...</p>
              </div>
            </div>
          </div>

          <!-- RECIPIENT SECTION -->
          <div class="card">
            <div class="card-header">
              <div class="card-title"><span class="icon">📥</span> Отримувач</div>
              <span class="card-badge info">Крок 2</span>
            </div>
            
            <div class="tabs" id="recipient-type-tabs">
              <button class="tab-btn active" data-type="PrivatePerson" id="tab-private">👤 Фізична особа</button>
              <button class="tab-btn" data-type="Organization" id="tab-fop">🏢 ФОП / Організація</button>
            </div>
            
            <div id="recipient-section">
              <div id="recipient-private-form">
                <div class="form-grid">
                  <div class="form-group">
                    <label class="form-label">Прізвище <span class="required">*</span></label>
                    <input type="text" class="form-input" id="recipient-lastname" placeholder="Іванов">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Ім'я <span class="required">*</span></label>
                    <input type="text" class="form-input" id="recipient-firstname" placeholder="Іван">
                  </div>
                  <div class="form-group">
                    <label class="form-label">По батькові</label>
                    <input type="text" class="form-input" id="recipient-middlename" placeholder="Іванович">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Телефон <span class="required">*</span></label>
                    <input type="tel" class="form-input" id="recipient-phone" placeholder="380XXXXXXXXX">
                  </div>
                </div>
              </div>
              
              <div id="recipient-fop-form" style="display:none;">
                <div class="form-grid">
                  <div class="form-group">
                    <label class="form-label">Код ЄДРПОУ <span class="required">*</span></label>
                    <input type="text" class="form-input" id="recipient-edrpou" placeholder="12345678">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Телефон <span class="required">*</span></label>
                    <input type="tel" class="form-input" id="recipient-fop-phone" placeholder="380XXXXXXXXX">
                  </div>
                  <div class="form-group full-width">
                    <label class="form-label">Назва ФОП / компанії</label>
                    <input type="text" class="form-input" id="recipient-fop-name" placeholder='ФОП Іванов І.І.'>
                    <span class="form-hint">Якщо порожньо — буде знайдено за ЄДРПОУ</span>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Контактна особа (Прізвище)</label>
                    <input type="text" class="form-input" id="recipient-fop-contact-lastname" placeholder="Іванов">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Контактна особа (Ім'я)</label>
                    <input type="text" class="form-input" id="recipient-fop-contact-firstname" placeholder="Іван">
                  </div>
                </div>
              </div>
              
              <div class="section-divider"><span>Адреса отримувача</span></div>
              
              <div class="form-grid">
                <div class="form-group" id="recipient-city-group">
                  <label class="form-label">Місто / Населений пункт <span class="required">*</span></label>
                  <!-- autocomplete injected -->
                </div>
                <div class="form-group" id="recipient-address-group">
                  <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 8px;">
                    <label class="form-label" id="recipient-address-label" style="margin-bottom: 0;">Відділення / Поштомат <span class="required">*</span></label>
                    <button id="open-map-btn" class="btn btn-ghost btn-sm" style="padding: 2px 8px; font-size: 12px; border: 1px solid var(--border-color); border-radius: 4px; background: #f8fafc; cursor: pointer;" type="button">🗺️ Карта</button>
                  </div>
                  <!-- autocomplete injected -->
                </div>
              </div>
              
              <div id="recipient-street-section" style="display:none;">
                <div class="form-grid" style="margin-top: var(--space-md);">
                  <div class="form-group" id="recipient-street-group">
                    <label class="form-label">Вулиця <span class="required">*</span></label>
                    <!-- autocomplete injected -->
                  </div>
                  <div class="form-group">
                    <label class="form-label">Будинок <span class="required">*</span></label>
                    <input type="text" class="form-input" id="recipient-building" placeholder="1А">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Квартира</label>
                    <input type="text" class="form-input" id="recipient-flat" placeholder="12">
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- DELIVERY SETTINGS -->
          <div class="card">
            <div class="card-header">
              <div class="card-title"><span class="icon">🚛</span> Параметри доставки</div>
              <span class="card-badge info">Крок 3</span>
            </div>
            
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label">Тип доставки <span class="required">*</span></label>
                <select class="form-select" id="service-type">
                  <option value="WarehouseWarehouse">Відділення → Відділення</option>
                  <option value="WarehouseDoors">Відділення → Адреса</option>
                  <option value="DoorsWarehouse">Адреса → Відділення</option>
                  <option value="DoorsDoors">Адреса → Адреса</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Платник доставки <span class="required">*</span></label>
                <select class="form-select" id="payer-type">
                  <option value="Sender">Відправник</option>
                  <option value="Recipient" selected>Отримувач</option>
                  <option value="ThirdPerson">Третя особа</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Форма оплати</label>
                <select class="form-select" id="payment-method">
                  <option value="Cash">Готівка</option>
                  <option value="NonCash">Безготівка</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Дата відправки</label>
                <input type="text" class="form-input" id="send-date" value="${state.dateTime}" placeholder="ДД.ММ.РРРР">
              </div>
            </div>
          </div>

          <!-- CARGO SECTION -->
          <div class="card">
            <div class="card-header">
              <div class="card-title"><span class="icon">📦</span> Вантаж</div>
              <span class="card-badge info">Крок 4</span>
            </div>
            
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label">Тип вантажу <span class="required">*</span></label>
                <select class="form-select" id="cargo-type">
                  <option value="Parcel">Посилка (до 30 кг)</option>
                  <option value="Cargo">Вантаж (від 30 кг)</option>
                  <option value="TiresWheels">Шини та диски</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Вага, кг <span class="required">*</span></label>
                <input type="number" class="form-input" id="cargo-weight" value="1" min="0.1" step="0.1">
              </div>
              <div class="form-group">
                <label class="form-label">Кількість місць <span class="required">*</span></label>
                <input type="number" class="form-input" id="cargo-seats" value="1" min="1">
              </div>
              <div class="form-group">
                <label class="form-label">Оціночна вартість, грн <span class="required">*</span></label>
                <input type="number" class="form-input" id="cargo-cost" value="300" min="1">
              </div>
              <div class="form-group full-width" id="cargo-desc-group">
                <label class="form-label">Опис вантажу <span class="required">*</span></label>
                <!-- autocomplete injected -->
              </div>
              <div class="form-group full-width" id="tires-wheels-group" style="display:none;">
                <label class="form-label">Вид шини/диска <span class="required">*</span></label>
                <select class="form-select" id="tires-wheels-select">
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
            
            <div class="section-divider"><span>Габарити по місцях (необов'язково)</span></div>
            
            <div id="dimensions-container">
              <!-- Dynamically populated via index.js -->
            </div>
          </div>

          <!-- BACKWARD DELIVERY (COD) -->
          <div class="card">
            <div class="card-header">
              <div class="card-title"><span class="icon">💰</span> Зворотна доставка</div>
            </div>
            
            <label class="form-check" style="margin-bottom: var(--space-md);">
              <input type="checkbox" id="backward-enabled">
              <span>Увімкнути зворотну доставку (наложений платіж / зворотня доставка документів)</span>
            </label>
            
            <div id="backward-section" class="backward-section" style="display:none;">
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Тип зворотної доставки</label>
                  <select class="form-select" id="backward-type">
                    <option value="Money">Грошовий переказ (наложений платіж)</option>
                    <option value="Documents">Документи</option>
                    <option value="OtherProperty">Інший товар</option>
                    <option value="CreditDocuments">Кредитні документи</option>
                  </select>
                </div>
                <div class="form-group" id="backward-value-group">
                  <label class="form-label">Сума наложеного платежу, грн</label>
                  <input type="number" class="form-input" id="backward-value" placeholder="0" min="0">
                </div>
              </div>
              <div class="form-group" id="backward-payer-group" style="margin-top: var(--space-md);">
                <label class="form-label">Платник зворотної доставки</label>
                <select class="form-select" id="backward-payer">
                  <option value="Recipient">Отримувач</option>
                  <option value="Sender">Відправник</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Additional Note -->
          <div class="card">
            <div class="card-header">
              <div class="card-title"><span class="icon">📝</span> Додатково</div>
            </div>
            <div class="form-group">
              <label class="form-label">Примітка</label>
              <textarea class="form-textarea" id="note" placeholder="Додаткова інформація..."></textarea>
            </div>
          </div>

        </div>

        <!-- SUMMARY SIDEBAR -->
        <div class="ttn-summary card" id="ttn-summary">
          <div class="card-header">
            <div class="card-title"><span class="icon">📋</span> Підсумок</div>
          </div>
          <div id="summary-content">
            <div class="summary-row"><span class="summary-label">Тип</span><span class="summary-value" id="sum-service">Склад → Склад</span></div>
            <div class="summary-row"><span class="summary-label">Платник</span><span class="summary-value" id="sum-payer">Відправник</span></div>
            <div class="summary-row"><span class="summary-label">Вантаж</span><span class="summary-value" id="sum-cargo">Посилка</span></div>
            <div class="summary-row"><span class="summary-label">Вага</span><span class="summary-value" id="sum-weight">1 кг</span></div>
            <div class="summary-row"><span class="summary-label">Місця</span><span class="summary-value" id="sum-seats">1</span></div>
            <div class="summary-row"><span class="summary-label">Вартість</span><span class="summary-value" id="sum-cost">300 грн</span></div>
            <div class="summary-row"><span class="summary-label">Наложений</span><span class="summary-value" id="sum-cod">—</span></div>
          </div>
          
          <div style="margin-top: var(--space-lg); padding-top: var(--space-md); border-top: 1px solid var(--border-color);">
            <div id="price-estimate" style="margin-bottom: var(--space-md); font-size: var(--font-size-sm); color: var(--text-muted);">
              <button class="btn btn-ghost btn-sm btn-block" id="calc-price-btn">💲 Розрахувати вартість доставки</button>
            </div>
            <button class="btn btn-primary btn-lg btn-block" id="submit-ttn-btn">
              ✅ Створити ТТН
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}
