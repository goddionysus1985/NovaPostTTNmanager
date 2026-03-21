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
        'WarehouseWarehouse': 'Відділення → Відділення',
        'WarehouseDoors': 'Відділення → Адреса',
        'DoorsWarehouse': 'Адреса → Відділення',
        'DoorsDoors': 'Адреса → Адреса',
    };
    const payerLabels = {
        'Sender': 'Відправник',
        'Recipient': 'Отримувач',
        'ThirdPerson': 'Третя особа',
    };
    const paymentLabels = {
        'Cash': 'Готівка',
        'NonCash': 'Безготівкова',
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
    const paymentMethod = document.getElementById('payment-method')?.value || 'Cash';
    const cargoType = document.getElementById('cargo-type')?.value || 'Parcel';
    const weight = state.places.reduce((sum, p) => sum + (parseFloat(p.weight) || 0), 0) || '1';
    const seats = state.places.length || '1';
    const cost = document.getElementById('cargo-cost')?.value || '0';
    const backwardValue = document.getElementById('backward-value')?.value || '';
    const backwardEnabled = document.getElementById('backward-enabled')?.checked || false;

    // Update hidden fields for submit.js compatibility
    const hw = document.getElementById('cargo-weight');
    if (hw) hw.value = weight;
    const hs = document.getElementById('cargo-seats');
    if (hs) hs.value = seats;

    // Sync Cost and BackwardValue (Cost must be >= BackwardValue)
    const costInput = document.getElementById('cargo-cost');
    const numCost = parseFloat(cost) || 0;
    const numBack = parseFloat(backwardValue) || 0;
    
    if (backwardEnabled && numBack > numCost && costInput) {
        costInput.value = numBack;
    }

    const setEl = (id, text, isError = false) => {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = text;
            el.style.color = isError ? 'var(--danger-color)' : '';
        }
    };

    setEl('sum-service', serviceLabels[serviceType] || serviceType);
    setEl('sum-payer', payerLabels[payerType] || payerType);
    setEl('sum-payment', paymentLabels[paymentMethod] || paymentMethod);
    setEl('sum-cargo', cargoLabels[cargoType] || cargoType);
    setEl('sum-weight', `${weight} кг`);
    setEl('sum-seats', seats);
    
    // Warnings for common errors
    if (cargoType === 'Documents' && backwardEnabled) {
        setEl('sum-cargo', `${cargoLabels[cargoType]} (Післяплата недоступна для документів!)`, true);
    }
    if (paymentMethod === 'NonCash' && backwardEnabled) {
        setEl('sum-payment', `${paymentLabels[paymentMethod]} (Післяплата потребує договору!)`, true);
    }

    setEl('sum-cost', `${costInput?.value || cost} грн`);
    
    const backwardRow = document.getElementById('sum-backward-row');
    if (backwardRow) {
        backwardRow.style.display = backwardEnabled ? 'flex' : 'none';
        setEl('sum-backward', `${numBack} грн`);
    }
}

function updateDimensionsContainer() {
    const container = document.getElementById('dimensions-container');
    if (!container) return;

    let html = '';
    state.places.forEach((place, index) => {
        html += `
            <tr class="dimension-row" data-index="${index}">
              <td>
                <div class="dimension-input-group">
                  <input type="number" class="compact-input cargo-length" value="${place.length}" placeholder="Д" title="Довжина">
                  <input type="number" class="compact-input cargo-width" value="${place.width}" placeholder="Ш" title="Ширина">
                  <input type="number" class="compact-input cargo-height" value="${place.height}" placeholder="В" title="Висота">
                </div>
              </td>
              <td>
                   <input type="number" class="compact-input cargo-weight-place" value="${place.weight}" placeholder="Вес, кг">
              </td>
              <td>
                  ${index > 0 ? `<button class="btn-remove-place" data-index="${index}">✕</button>` : ''}
              </td>
            </tr>
        `;
    });
    container.innerHTML = html;

    // Attach listeners
    container.querySelectorAll('.dimension-row').forEach(row => {
        const idx = row.dataset.index;
        const inputs = row.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('change', () => {
                state.places[idx].length = row.querySelector('.cargo-length').value;
                state.places[idx].width = row.querySelector('.cargo-width').value;
                state.places[idx].height = row.querySelector('.cargo-height').value;
                state.places[idx].weight = row.querySelector('.cargo-weight-place').value;
                
                checkSpecialCargo();
                updateSummary();
            });
            input.addEventListener('input', () => {
                state.places[idx].weight = row.querySelector('.cargo-weight-place').value;
                updateSummary();
            });
        });

        const removeBtn = row.querySelector('.btn-remove-place');
        if (removeBtn) {
            removeBtn.addEventListener('click', () => {
                state.places.splice(idx, 1);
                updateDimensionsContainer();
                updateSummary();
            });
        }
    });

    checkSpecialCargo();
}

/**
 * If any place is SpecialCargo, ship type must be "Cargo"
 */
function checkSpecialCargo() {
    const globalSCToggle = document.getElementById('special-cargo-toggle-global');
    const isAnySpecial = globalSCToggle?.checked || false;
    const cargoTypeEl = document.getElementById('cargo-type');
    if (cargoTypeEl) {
        if (isAnySpecial) {
            if (cargoTypeEl.value !== 'Cargo') {
                cargoTypeEl.value = 'Cargo';
                updateSummary();
            }
        } else {
            // Revert to Parcel if special cargo was disabled
            if (cargoTypeEl.value === 'Cargo') {
                cargoTypeEl.value = 'Parcel';
                updateSummary();
            }
        }
    }
}

function addPlace() {
    state.places.push({ width: '', length: '', height: '', weight: '', specialCargo: false });
    updateDimensionsContainer();
    updateSummary();
}


export function initCreateTTN(navigateTo) {
    if (!hasApiKey()) return;

    // ── RESET transient state on each page visit ──
    // Prevents places count from accumulating between navigations
    state.places = [{ width: '', length: '', height: '', weight: '', specialCargo: false }];

    // Initialize sender data — applyDefaults runs AFTER sender loads
    loadSenderData().then(() => {
        applyDefaults();
    }).catch(() => {
        applyDefaults(); // still try defaults even if sender load fails
    });

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

    // Global SpecialCargo toggle
    const globalSCToggle = document.getElementById('special-cargo-toggle-global');
    if (globalSCToggle) {
        globalSCToggle.addEventListener('change', () => {
            checkSpecialCargo();
            updateSummary();
        });
    }

    // Add place button
    const addPlaceBtn = document.getElementById('btn-add-place');
    if (addPlaceBtn) addPlaceBtn.addEventListener('click', addPlace);

    // Backward delivery toggle
    const backwardEnabledEl = document.getElementById('backward-enabled');
    const backwardValueEl = document.getElementById('backward-value');
    const backwardValueContainer = document.getElementById('backward-value-container');

    if (backwardEnabledEl) {
        backwardEnabledEl.addEventListener('change', () => {
            const isEnabled = backwardEnabledEl.checked;
            state.backwardDeliveryEnabled = isEnabled;
            if (backwardValueContainer) {
                backwardValueContainer.style.display = isEnabled ? 'block' : 'none';
            }
            
            // If just enabled, set default value from cargo-cost if it's 0
            if (isEnabled && backwardValueEl && (parseFloat(backwardValueEl.value) || 0) === 0) {
                backwardValueEl.value = document.getElementById('cargo-cost')?.value || '200';
            }
            
            updateSummary();
        });
    }

    if (backwardValueEl) {
        backwardValueEl.addEventListener('input', () => {
            updateSummary();
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
                if (id === 'cargo-type') {
                    const twGroup = document.getElementById('tires-wheels-group');
                    if (twGroup) twGroup.style.display = el.value === 'TiresWheels' ? 'block' : 'none';
                }
            });
            el.addEventListener('input', () => {
                updateSummary();
            });
        }
    });

    // Initial render for dimensions
    updateDimensionsContainer();

    // Calculate price
    ['calc-price-btn', 'btn-calc-price-alt'].forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.addEventListener('click', calculatePrice);
    });

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
}

