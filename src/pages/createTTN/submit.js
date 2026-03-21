/**
 * Create TTN — Submit Logic
 *
 * Responsibilities split into focused helpers:
 *   buildRecipient()   → creates/resolves counterparty & contact person
 *   buildAddress()     → creates address for door delivery
 *   buildTTNParams()   → assembles the InternetDocument.save payload
 *   buildOptionsSeat() → assembles OptionsSeat from the dimensions table
 *   submitTTN()        → orchestrates the above + API call
 *   calculatePrice()   → standalone price calculator
 */

import {
    createCounterparty,
    createContactPerson,
    createTTN,
    saveAddress,
    getDocumentPrice,
    getPrintUrl,
    getPrintMarkingUrl,
} from '../../api/novaposhta.js';
import { showToast } from '../../components/toast.js';
import { html } from '../../utils/dom.js';
import { state, autocompletes } from './state.js';

// ─── Phone Normalization ──────────────────────────────────────────────────────

/**
 * Normalize phone to 380XXXXXXXXX format.
 * @param {string} phone
 * @returns {string}
 */
export function normalizePhone(phone) {
    if (!phone) return '';
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0') && cleaned.length === 10) {
        cleaned = '38' + cleaned;
    } else if (cleaned.startsWith('80') && cleaned.length === 11) {
        cleaned = '3' + cleaned;
    } else if (cleaned.length === 9) {
        cleaned = '380' + cleaned;
    }
    return cleaned;
}

// ─── Validation ───────────────────────────────────────────────────────────────

/**
 * Validate all required form fields before submission.
 * Returns null if valid, or an error message string.
 * @param {string} serviceType
 * @param {string} recipientPhone
 * @param {string} descValue
 * @returns {string|null}
 */
function validateForm(serviceType, recipientPhone, descValue) {
    if (!state.senderRef || !state.senderContactRef) {
        return 'Оберіть відправника та контактну особу';
    }
    if (!state.senderCityRef) return 'Оберіть місто відправника';
    if (!state.senderAddressRef) return 'Оберіть відділення відправника';
    if (!state.recipientCityRef) return 'Оберіть місто отримувача';

    const isWarehouseRecipient = serviceType === 'WarehouseWarehouse' || serviceType === 'DoorsWarehouse';
    if (isWarehouseRecipient && !state.recipientAddressRef) {
        return 'Оберіть відділення отримувача';
    }

    const isDoorRecipient = serviceType === 'WarehouseDoors' || serviceType === 'DoorsDoors';
    if (isDoorRecipient) {
        if (!autocompletes.recipientStreet?.getValue()) return 'Оберіть вулицю отримувача';
        if (!document.getElementById('recipient-building')?.value?.trim()) return 'Введіть номер будинку отримувача';
    }

    if (state.recipientType === 'PrivatePerson') {
        const parts = (document.getElementById('recipient-fullname')?.value?.trim() || '').split(/\s+/);
        if (!parts[0] || !parts[1]) return 'Введіть прізвище та ім\'я отримувача';
    }

    if (!recipientPhone) return 'Введіть телефон отримувача';
    if (!descValue) return 'Введіть опис вантажу';

    return null;
}

// ─── Recipient Builder ────────────────────────────────────────────────────────

/**
 * Create or resolve recipient counterparty and contact person.
 * @param {string} recipientPhone - normalized phone
 * @returns {Promise<{ recipientRef: string, recipientContactRef: string }>}
 */
async function buildRecipient(recipientPhone) {
    if (state.recipientType === 'PrivatePerson') {
        return buildPrivatePersonRecipient(recipientPhone);
    }
    return buildOrganizationRecipient(recipientPhone);
}

async function buildPrivatePersonRecipient(phone) {
    const fullName = document.getElementById('recipient-fullname')?.value?.trim() || '';
    const [lastName = '', firstName = '', ...rest] = fullName.split(/\s+/);
    const middleName = rest.join(' ');

    const cpResult = await createCounterparty({
        FirstName: firstName,
        LastName: lastName,
        MiddleName: middleName,
        Phone: phone,
        CounterpartyType: 'PrivatePerson',
        CounterpartyProperty: 'Recipient',
    });

    console.log('[TTN] Counterparty result:', JSON.stringify(cpResult, null, 2));

    if (!cpResult) throw new Error('Не вдалося створити контрагента-отримувача');

    const recipientRef = cpResult.Ref;
    const recipientContactRef =
        cpResult.ContactPerson?.data?.[0]?.Ref ||
        cpResult.ContactPerson?.Ref ||
        cpResult.Ref;

    console.log('[TTN] recipientRef:', recipientRef, 'contactRef:', recipientContactRef);
    return { recipientRef, recipientContactRef };
}

async function buildOrganizationRecipient(phone) {
    const edrpou = document.getElementById('recipient-edrpou')?.value?.trim();
    if (!edrpou) throw new Error('Введіть код ЄДРПОУ');

    const fopName = document.getElementById('recipient-fop-name')?.value?.trim();
    const fopContactLastName = document.getElementById('recipient-fop-contact-lastname')?.value?.trim();
    const fopContactFirstName = document.getElementById('recipient-fop-contact-firstname')?.value?.trim();

    const cpParams = {
        CounterpartyType: 'Organization',
        CounterpartyProperty: 'Recipient',
        EDRPOU: edrpou,
    };
    if (fopName) cpParams.Description = fopName;

    const cpResult = await createCounterparty(cpParams);
    console.log('[TTN] FOP Counterparty result:', JSON.stringify(cpResult, null, 2));

    if (!cpResult) throw new Error('Не вдалося створити контрагента-отримувача');

    const recipientRef = cpResult.Ref;

    // Nova Poshta auto-creates a default contact; override with correct phone+name
    const contactResult = await createContactPerson({
        CounterpartyRef: recipientRef,
        FirstName: fopContactFirstName || 'Представник',
        LastName: fopContactLastName || 'Організації',
        Phone: phone,
    });

    const recipientContactRef = contactResult?.Ref ||
        cpResult.ContactPerson?.data?.[0]?.Ref ||
        cpResult.ContactPerson?.Ref || '';

    console.log('[TTN] FOP contactRef:', recipientContactRef);
    return { recipientRef, recipientContactRef };
}

// ─── Address Builder ──────────────────────────────────────────────────────────

/**
 * For door delivery: create or resolve recipient address ref.
 * @param {string} recipientRef
 * @returns {Promise<string>} address Ref
 */
async function buildDoorAddress(recipientRef) {
    const streetRef = autocompletes.recipientStreet?.getValue();
    if (!streetRef) return state.recipientAddressRef;

    const building = document.getElementById('recipient-building')?.value?.trim() || '';
    const flat = document.getElementById('recipient-flat')?.value?.trim() || '';

    const addrResult = await saveAddress({
        CounterpartyRef: recipientRef,
        StreetRef: streetRef,
        BuildingNumber: building,
        Flat: flat,
    });

    return addrResult?.Ref || streetRef;
}

// ─── OptionsSeat Builder ──────────────────────────────────────────────────────

/**
 * Build OptionsSeat array from the dimensions table.
 * @param {boolean} isSpecialCargo
 * @param {string} totalWeight
 * @param {string} totalCost
 * @param {string} description
 * @returns {{ optionsSeat: object[], hasContent: boolean }}
 */
function buildOptionsSeat(isSpecialCargo, totalWeight, totalCost, description) {
    const container = document.getElementById('dimensions-container');
    if (!container) return { optionsSeat: [], hasContent: false };

    const rows = container.querySelectorAll('.dimension-row');
    const rowCount = rows.length || 1;
    const defaultWeight = totalWeight
        ? String((parseFloat(totalWeight) / rowCount).toFixed(2))
        : '1';
    const defaultCost = totalCost
        ? String((parseFloat(totalCost) / rowCount).toFixed(2))
        : '0';

    let hasValidDimensions = false;
    let hasIndividualWeights = false;

    const optionsSeat = Array.from(rows).map(row => {
        const w = row.querySelector('.cargo-width')?.value;
        const l = row.querySelector('.cargo-length')?.value;
        const h = row.querySelector('.cargo-height')?.value;
        const pWeight = row.querySelector('.cargo-weight-place')?.value;

        const seat = { weight: parseFloat(pWeight || defaultWeight) };
        if (pWeight) hasIndividualWeights = true;

        if (w && l && h) {
            hasValidDimensions = true;
            seat.volumetricWidth = parseFloat(w);
            seat.volumetricLength = parseFloat(l);
            seat.volumetricHeight = parseFloat(h);
            seat.volumetricVolume = String(
                (seat.volumetricWidth * seat.volumetricLength * seat.volumetricHeight / 4000).toFixed(4)
            );

            if (isSpecialCargo) {
                const exceeds = seat.volumetricLength > 120 || seat.volumetricWidth > 70 ||
                    seat.volumetricHeight > 70 || seat.weight > 30;
                if (exceeds) {
                    console.warn('[TTN] РО limits exceeded for a place (max L:120, W:70, H:70, 30kg).');
                }
            }
        }

        if (isSpecialCargo) {
            seat.specialCargo = '1';
            seat.cost = defaultCost;
            seat.description = description;
        }

        return seat;
    });

    const hasContent = hasValidDimensions || hasIndividualWeights || isSpecialCargo;
    return { optionsSeat, hasContent };
}

// ─── TTN Params Builder ───────────────────────────────────────────────────────

/**
 * Assemble the full payload for InternetDocument.save.
 * @param {object} p
 * @returns {object} ttnParams
 */
function buildTTNParams({
    serviceType, payerType, paymentMethod, cargoType,
    weight, seats, cost, dateTime,
    senderPhone, senderAddressRef,
    recipientRef, recipientContactRef, recipientPhone,
    finalRecipientAddress, descValue,
}) {
    const params = {
        PayerType: payerType,
        PaymentMethod: paymentMethod,
        DateTime: dateTime,
        CargoType: cargoType,
        Weight: weight,
        ServiceType: serviceType,
        SeatsAmount: seats,
        Description: descValue,
        Cost: cost,
        CitySender: state.senderCityRef || '',
        Sender: state.senderRef,
        SenderAddress: senderAddressRef,
        ContactSender: state.senderContactRef,
        SendersPhone: senderPhone,
        CityRecipient: state.recipientCityRef,
        Recipient: recipientRef,
        RecipientAddress: finalRecipientAddress,
        ContactRecipient: recipientContactRef,
        RecipientsPhone: recipientPhone,
    };

    return params;
}

// ─── Price Calculator ─────────────────────────────────────────────────────────

export async function calculatePrice() {
    const btn = document.getElementById('calc-price-btn');
    const priceEl = document.getElementById('price-estimate');
    if (!btn || !priceEl) return;

    if (!state.senderCityRef || !state.recipientCityRef) {
        showToast('warning', 'Увага', 'Оберіть місто відправника та отримувача');
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<div class="spinner spinner-sm" style="margin: 0 auto;"></div>';

    try {
        const result = await getDocumentPrice({
            CitySender: state.senderCityRef,
            CityRecipient: state.recipientCityRef,
            Weight: document.getElementById('cargo-weight')?.value || '1',
            ServiceType: document.getElementById('service-type')?.value || 'WarehouseWarehouse',
            Cost: document.getElementById('cargo-cost')?.value || '300',
            CargoType: document.getElementById('cargo-type')?.value || 'Parcel',
            SeatsAmount: document.getElementById('cargo-seats')?.value || '1',
        });

        if (result) {
            priceEl.innerHTML = html`
              <div style="background: var(--success-bg); border: 1px solid rgba(16,185,129,0.2); border-radius: var(--radius-sm); padding: var(--space-sm) var(--space-md);">
                <div style="font-weight: 600; color: var(--success);">💲 Вартість доставки: ${result.Cost} грн</div>
                ${result.CostRedelivery ? html`<div style="color: var(--text-secondary); margin-top: 2px;">Зворотна: ${result.CostRedelivery} грн</div>` : ''}
              </div>
            `;
        }
    } catch (err) {
        showToast('error', 'Помилка розрахунку', err.message);
        priceEl.innerHTML = html`<button class="btn btn-ghost btn-sm btn-block" id="calc-price-btn">💲 Розрахувати вартість доставки</button>`;
        document.getElementById('calc-price-btn')?.addEventListener('click', calculatePrice);
    } finally {
        if (btn) btn.disabled = false;
    }
}

// ─── Main Submit ──────────────────────────────────────────────────────────────

export async function submitTTN(navigateTo) {
    const btn = document.getElementById('submit-ttn-btn');
    if (!btn) return;

    // ── 1. Gather form values ──
    const serviceType   = document.getElementById('service-type')?.value;
    const payerType     = document.getElementById('payer-type')?.value;
    const paymentMethod = document.getElementById('payment-method')?.value;
    const cargoType     = document.getElementById('cargo-type')?.value;
    const weight        = document.getElementById('cargo-weight')?.value;
    const seats         = document.getElementById('cargo-seats')?.value;
    const cost          = document.getElementById('cargo-cost')?.value;
    const dateTime      = document.getElementById('send-date')?.value;
    const note          = document.getElementById('note')?.value;

    const recipientPhone = normalizePhone(
        document.getElementById('recipient-phone')?.value?.trim() || ''
    );
    // NOTE: getValue() returns the internal Ref (UUID), NOT the display text.
    // We always want the visible text label from the input for the Description field.
    const cargoDescAC = autocompletes.cargoDesc;
    const descValue = cargoDescAC?.input?.value?.trim() || '';

    // ── 2. Validate ──
    const validationError = validateForm(serviceType, recipientPhone, descValue);
    if (validationError) {
        showToast('warning', 'Увага', validationError);
        return;
    }

    btn.disabled = true;
    btn.innerHTML = html`<div class="spinner spinner-sm" style="display:inline-block;"></div> Створення...`;

    try {
        // ── 3. Resolve/Create Recipient ──
        const { recipientRef, recipientContactRef } = await buildRecipient(recipientPhone);

        if (!recipientRef) throw new Error('Не вдалося створити контрагента-отримувача');

        // ── 4. Sender address ──
        let senderPhone = document.getElementById('sender-phone')?.value?.trim() || state.senderPhone;
        senderPhone = normalizePhone(senderPhone);

        const senderAddressSelect = document.getElementById('sender-address-select');
        const senderAddressRef = senderAddressSelect?.value || state.senderAddressRef;

        // ── 5. Recipient address (door delivery needs special handling) ──
        const isDoorRecipient = serviceType === 'WarehouseDoors' || serviceType === 'DoorsDoors';
        let finalRecipientAddress = state.recipientAddressRef;

        if (isDoorRecipient) {
            finalRecipientAddress = await buildDoorAddress(recipientRef);
        }

        // ── 6. Build core TTN params ──
        const isSpecialCargo = document.getElementById('special-cargo-toggle-global')?.checked || false;

        const ttnParams = buildTTNParams({
            serviceType, payerType, paymentMethod, cargoType,
            weight, seats, cost, dateTime,
            senderPhone, senderAddressRef,
            recipientRef, recipientContactRef, recipientPhone,
            finalRecipientAddress, descValue,
        });

        if (isSpecialCargo) ttnParams.specialCargo = '1';

        if (isDoorRecipient) {
            ttnParams.RecipientHouse = document.getElementById('recipient-building')?.value?.trim() || '';
            ttnParams.RecipientFlat  = document.getElementById('recipient-flat')?.value?.trim() || '';
        }

        // ── 7. Seat / Dimension details ──
        if (cargoType === 'TiresWheels') {
            const twRef = document.getElementById('tires-wheels-select')?.value;
            if (twRef && seats) {
                ttnParams.CargoDetails = [{ CargoDescription: twRef, Amount: seats }];
            }
        } else {
            const { optionsSeat, hasContent } = buildOptionsSeat(isSpecialCargo, weight, cost, descValue);
            if (hasContent) ttnParams.OptionsSeat = optionsSeat;
        }

        // ── 8. Backward delivery ──
        if (state.backwardDeliveryEnabled) {
            const backType  = document.getElementById('backward-type')?.value || 'Money';
            const backValue = document.getElementById('backward-value')?.value || '';
            const backPayer = document.getElementById('backward-payer')?.value || 'Recipient';

            const backData = { PayerType: backPayer, CargoType: backType };
            if (backType === 'Money' && backValue) backData.RedeliveryString = backValue;

            ttnParams.BackwardDeliveryData = [backData];
        }

        if (note) ttnParams.InfoRegClientBarcodes = note;

        console.log('[TTN] Full params:', JSON.stringify(ttnParams, null, 2));

        // ── 9. Call API ──
        const result = await createTTN(ttnParams);

        if (result) {
            const docNumber = result.IntDocNumber || result.Ref;
            showToast('success', 'ТТН створена! 🎉', `Номер: ${docNumber}`);

            btn.innerHTML = '✅ ТТН Створена!';
            btn.style.background = 'var(--success)';

            showResultModal(
                docNumber, result.Ref,
                getPrintUrl(docNumber), getPrintMarkingUrl(docNumber),
                result.CostOnSite, result.EstimatedDeliveryDate,
                navigateTo,
            );
        }
    } catch (err) {
        showToast('error', 'Помилка створення ТТН', err.message);
        btn.disabled = false;
        btn.innerHTML = '✅ Створити ТТН';
    }
}

// ─── Result Modal ─────────────────────────────────────────────────────────────

export function showResultModal(docNumber, docRef, printUrl, markingUrl, cost, estimatedDate, navigateTo) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = html`
    <div class="modal">
      <div class="modal-header">
        <h2 class="modal-title">🎉 ТТН Створена!</h2>
        <button class="modal-close" id="close-result-modal">✕</button>
      </div>
      <div style="text-align: center; margin-bottom: var(--space-lg);">
        <div style="font-size: var(--font-size-3xl); font-weight: 800; color: var(--accent-light); font-family: 'Courier New', monospace; margin-bottom: var(--space-sm);">${docNumber}</div>
        ${cost ? html`<div style="color: var(--text-secondary);">Вартість доставки: <strong>${cost} грн</strong></div>` : ''}
        ${estimatedDate ? html`<div style="color: var(--text-secondary);">Орієнтовна дата: <strong>${estimatedDate}</strong></div>` : ''}
      </div>
      <div class="btn-group" style="flex-direction: column;">
        <a href="${printUrl}" target="_blank" class="btn btn-primary btn-block">🖨️ Друкувати ТТН (A4)</a>
        <a href="${markingUrl}" target="_blank" class="btn btn-secondary btn-block">🏷️ Друкувати маркування (100x100)</a>
        <button class="btn btn-ghost btn-block" id="copy-ttn-number">📋 Копіювати номер ТТН</button>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" id="result-go-documents">📄 Мої ТТН</button>
        <button class="btn btn-primary" id="result-create-another">📝 Створити ще</button>
      </div>
    </div>
  `;

    document.body.appendChild(overlay);

    overlay.querySelector('#close-result-modal').addEventListener('click', () => overlay.remove());
    overlay.querySelector('#copy-ttn-number').addEventListener('click', () => {
        navigator.clipboard.writeText(docNumber);
        showToast('success', 'Скопійовано', `Номер ТТН ${docNumber} скопійовано`);
    });
    overlay.querySelector('#result-go-documents').addEventListener('click', () => {
        overlay.remove();
        navigateTo?.('documents');
    });
    overlay.querySelector('#result-create-another').addEventListener('click', () => {
        overlay.remove();
        navigateTo?.('create');
    });
    overlay.addEventListener('click', e => {
        if (e.target === overlay) overlay.remove();
    });
}
