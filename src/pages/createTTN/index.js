import { hasApiKey, getWarehouses } from '../../api/novaposhta.js';
import { renderCreateTTN as template } from './template.js';
import { openMapModal } from '../../components/MapModal.js';
import { showToast } from '../../components/toast.js';
import { state, autocompletes } from './state.js';
import {
    loadSenderData,
    initRecipientCityAutocomplete,
    initRecipientAddressAutocomplete,
    initCargoDescriptionAutocomplete,
    applyDefaults
} from './autocompletes.js';
import { calculatePrice, submitTTN } from './submit.js';

export function renderCreateTTN() {
    return template();
}

function updateAddressFields() {
    const st = state.serviceType;
    const isRecipientDoor = st === 'WarehouseDoors' || st === 'DoorsDoors';

    // Show/hide street fields for recipient
    const streetSection = document.getElementById('recipient-street-section');
    const addressLabel = document.getElementById('recipient-address-label');

    if (isRecipientDoor) {
        if (streetSection) streetSection.style.display = '';
        if (autocompletes.recipientWarehouse) autocompletes.recipientWarehouse.wrapper.style.display = 'none';
        if (addressLabel) addressLabel.textContent = 'Адреса (вулиця)';
        // Hide warehouse autocomplete container group
        const addrGroup = document.getElementById('recipient-address-group');
        if (addrGroup) addrGroup.style.display = 'none';
    } else {
        if (streetSection) streetSection.style.display = 'none';
        if (autocompletes.recipientWarehouse) autocompletes.recipientWarehouse.wrapper.style.display = '';
        if (addressLabel) addressLabel.innerHTML = 'Відділення / Поштомат <span class="required">*</span>';
        const addrGroup = document.getElementById('recipient-address-group');
        if (addrGroup) addrGroup.style.display = '';
    }
}

function updateSummary() {
    const serviceLabels = {
        'WarehouseWarehouse': 'Склад → Склад',
        'WarehouseDoors': 'Склад → Адреса',
        'DoorsWarehouse': 'Адреса → Склад',
        'DoorsDoors': 'Адреса → Адреса',
    };
    const payerLabels = {
        'Sender': 'Відправник',
        'Recipient': 'Отримувач',
        'ThirdPerson': 'Третя особа',
    };
    const cargoLabels = {
        'Parcel': 'Посилка',
        'Cargo': 'Вантаж',
        'Documents': 'Документи',
        'Pallet': 'Палета',
        'TiresWheels': 'Шини та диски',
    };

    const serviceType = document.getElementById('service-type')?.value || 'WarehouseWarehouse';
    const payerType = document.getElementById('payer-type')?.value || 'Sender';
    const cargoType = document.getElementById('cargo-type')?.value || 'Parcel';
    const weight = document.getElementById('cargo-weight')?.value || '1';
    const seats = document.getElementById('cargo-seats')?.value || '1';
    const cost = document.getElementById('cargo-cost')?.value || '300';
    const backwardValue = document.getElementById('backward-value')?.value || '';
    const backwardEnabled = document.getElementById('backward-enabled')?.checked || false;

    const setEl = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    };

    setEl('sum-service', serviceLabels[serviceType] || serviceType);
    setEl('sum-payer', payerLabels[payerType] || payerType);
    setEl('sum-cargo', cargoLabels[cargoType] || cargoType);
    setEl('sum-weight', `${weight} кг`);
    setEl('sum-seats', seats);
    setEl('sum-cost', `${cost} грн`);
    setEl('sum-cod', backwardEnabled && backwardValue ? `${backwardValue} грн` : '—');
}

function updateDimensionsContainer() {
    const container = document.getElementById('dimensions-container');
    if (!container) return;

    const seats = parseInt(document.getElementById('cargo-seats')?.value) || 1;

    // Save existing values to not lose them
    const existingValues = [];
    container.querySelectorAll('.dimension-row').forEach((row, idx) => {
        existingValues[idx] = {
            width: row.querySelector('.cargo-width').value,
            length: row.querySelector('.cargo-length').value,
            height: row.querySelector('.cargo-height').value,
            weight: row.querySelector('.cargo-weight-place').value
        };
    });

    let html = '';
    for (let i = 0; i < seats; i++) {
        const val = existingValues[i] || { width: '', length: '', height: '', weight: '' };
        html += `
            <div class="dimension-row" style="margin-bottom: var(--space-md); padding: var(--space-sm); border: 1px dashed var(--border-color); border-radius: var(--radius-sm);">
              <div style="font-weight: 600; font-size: var(--font-size-sm); margin-bottom: var(--space-sm); color: var(--text-secondary);">Місце ${i + 1}</div>
              <div class="form-grid cols-3" style="margin-bottom: var(--space-sm);">
                <div class="form-group">
                  <label class="form-label">Ширина, см</label>
                  <input type="number" class="form-input cargo-width" value="${val.width}" placeholder="0" min="0">
                </div>
                <div class="form-group">
                  <label class="form-label">Довжина, см</label>
                  <input type="number" class="form-input cargo-length" value="${val.length}" placeholder="0" min="0">
                </div>
                <div class="form-group">
                  <label class="form-label">Висота, см</label>
                  <input type="number" class="form-input cargo-height" value="${val.height}" placeholder="0" min="0">
                </div>
              </div>
              <div class="form-group" style="margin-bottom: 0;">
                  <label class="form-label">Фактична вага місця, кг (якщо відрізняється)</label>
                  <input type="number" class="form-input cargo-weight-place" value="${val.weight}" placeholder="За замовчуванням: Загальна вага / кількість місць" min="0" step="0.1">
              </div>
            </div>
        `;
    }
    container.innerHTML = html;
}

export function initCreateTTN(navigateTo) {
    if (!hasApiKey()) return;

    // Initialize sender data
    loadSenderData();

    // Initialize autocompletes
    initRecipientCityAutocomplete();
    initRecipientAddressAutocomplete();
    initCargoDescriptionAutocomplete();

    // Service type change
    const serviceTypeEl = document.getElementById('service-type');
    if (serviceTypeEl) {
        serviceTypeEl.addEventListener('change', () => {
            state.serviceType = serviceTypeEl.value;
            updateAddressFields();
            updateSummary();
        });
    }

    // Recipient type tabs
    document.querySelectorAll('#recipient-type-tabs .tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#recipient-type-tabs .tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.recipientType = btn.dataset.type;

            document.getElementById('recipient-private-form').style.display =
                state.recipientType === 'PrivatePerson' ? '' : 'none';
            document.getElementById('recipient-fop-form').style.display =
                state.recipientType === 'Organization' ? '' : 'none';
        });
    });

    // Backward delivery toggle
    const backwardEnabled = document.getElementById('backward-enabled');
    if (backwardEnabled) {
        backwardEnabled.addEventListener('change', () => {
            state.backwardDeliveryEnabled = backwardEnabled.checked;
            const section = document.getElementById('backward-section');
            section.style.display = backwardEnabled.checked ? '' : 'none';
            if (backwardEnabled.checked) section.classList.add('active');
            else section.classList.remove('active');
            updateSummary();
        });
    }

    // Backward type change
    const backwardType = document.getElementById('backward-type');
    if (backwardType) {
        backwardType.addEventListener('change', () => {
            const valGroup = document.getElementById('backward-value-group');
            valGroup.style.display = backwardType.value === 'Money' ? '' : 'none';
        });
    }

    // Summary and dimension updaters
    ['service-type', 'payer-type', 'payment-method', 'cargo-type',
        'cargo-weight', 'cargo-seats', 'cargo-cost', 'backward-value'
    ].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', () => {
                updateSummary();
                if (id === 'cargo-seats') updateDimensionsContainer();
                if (id === 'cargo-type') {
                    const twGroup = document.getElementById('tires-wheels-group');
                    if (twGroup) twGroup.style.display = el.value === 'TiresWheels' ? 'block' : 'none';
                }
            });
            el.addEventListener('input', () => {
                updateSummary();
                if (id === 'cargo-seats') updateDimensionsContainer();
            });
        }
    });

    // Initial render for dimensions
    updateDimensionsContainer();

    // Calculate price
    const calcBtn = document.getElementById('calc-price-btn');
    if (calcBtn) calcBtn.addEventListener('click', calculatePrice);

    // Submit
    const submitBtn = document.getElementById('submit-ttn-btn');
    if (submitBtn) submitBtn.addEventListener('click', () => submitTTN(navigateTo));

    // Map Button
    const mapBtn = document.getElementById('open-map-btn');
    if (mapBtn) {
        mapBtn.addEventListener('click', async () => {
            if (!state.recipientCityRef) {
                showToast('warning', 'Увага', 'Спочатку оберіть місто отримувача');
                return;
            }
            try {
                const mapBtnOgText = mapBtn.innerHTML;
                mapBtn.innerHTML = '⏳...';
                mapBtn.disabled = true;
                const warehouses = await getWarehouses(state.recipientCityRef, '');
                mapBtn.innerHTML = mapBtnOgText;
                mapBtn.disabled = false;

                openMapModal(warehouses, (selectedW) => {
                    if (autocompletes.recipientWarehouse) {
                        state.recipientAddressRef = selectedW.Ref;
                        autocompletes.recipientWarehouse.setValue(selectedW.Description, selectedW.Ref);
                    }
                });
            } catch (err) {
                mapBtn.innerHTML = '🗺️ Карта';
                mapBtn.disabled = false;
                showToast('error', 'Помилка', err.message);
            }
        });
    }

    // Default values delay to ensure ACs are ready
    setTimeout(applyDefaults, 100);
}
