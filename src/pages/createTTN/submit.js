import {
    createCounterparty,
    createContactPerson,
    createTTN,
    saveAddress,
    getDocumentPrice,
    getPrintUrl,
    getPrintMarkingUrl
} from '../../api/novaposhta.js';
import { showToast } from '../../components/toast.js';
import { html } from '../../utils/dom.js';
import { state, autocompletes } from './state.js';

/**
 * Normalize phone number to 380XXXXXXXXX format
 */
function normalizePhone(phone) {
    if (!phone) return '';
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '');
    // Handle different formats
    if (cleaned.startsWith('0') && cleaned.length === 10) {
        cleaned = '38' + cleaned; // 0XX -> 380XX
    } else if (cleaned.startsWith('80') && cleaned.length === 11) {
        cleaned = '3' + cleaned; // 80XX -> 380XX
    } else if (cleaned.startsWith('380') && cleaned.length === 12) {
        // Already correct
    } else if (cleaned.length === 9) {
        cleaned = '380' + cleaned; // just 9 digits
    }
    return cleaned;
}

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
    }

    btn.disabled = false;
}

export async function submitTTN(navigateTo) {
    const btn = document.getElementById('submit-ttn-btn');
    if (!btn) return;

    // Gather values from form
    const serviceType = document.getElementById('service-type')?.value;
    const payerType = document.getElementById('payer-type')?.value;
    const paymentMethod = document.getElementById('payment-method')?.value;
    const cargoType = document.getElementById('cargo-type')?.value;
    const weight = document.getElementById('cargo-weight')?.value;
    const seats = document.getElementById('cargo-seats')?.value;
    const cost = document.getElementById('cargo-cost')?.value;
    const dateTime = document.getElementById('send-date')?.value;
    const note = document.getElementById('note')?.value;

    // Recipient info
    let recipientPhone, recipientFirstName, recipientLastName, recipientMiddleName;
    let recipientRef = '', recipientContactRef = '';

    if (state.recipientType === 'PrivatePerson') {
        const fullName = document.getElementById('recipient-fullname')?.value?.trim() || '';
        const parts = fullName.split(/\s+/);
        recipientLastName = parts[0] || '';
        recipientFirstName = parts[1] || '';
        recipientMiddleName = parts.slice(2).join(' ') || '';
        recipientPhone = document.getElementById('recipient-phone')?.value?.trim();
    } else {
        recipientPhone = document.getElementById('recipient-phone')?.value?.trim();
    }

    // Validate
    if (!state.senderRef || !state.senderContactRef) {
        showToast('warning', 'Увага', 'Оберіть відправника та контактну особу');
        return;
    }

    if (!state.senderCityRef) {
        showToast('warning', 'Увага', 'Оберіть місто відправника');
        return;
    }

    if (!state.senderAddressRef) {
        showToast('warning', 'Увага', 'Оберіть відділення відправника');
        return;
    }

    if (!state.recipientCityRef) {
        showToast('warning', 'Увага', 'Оберіть місто отримувача');
        return;
    }

    const isWarehouseRecipient = serviceType === 'WarehouseWarehouse' || serviceType === 'DoorsWarehouse';
    if (isWarehouseRecipient && !state.recipientAddressRef) {
        showToast('warning', 'Увага', 'Оберіть відділення отримувача');
        return;
    }

    const isDoorRecipient = serviceType === 'WarehouseDoors' || serviceType === 'DoorsDoors';
    if (isDoorRecipient) {
        const streetRef = autocompletes.recipientStreet?.getValue();
        const building = document.getElementById('recipient-building')?.value?.trim();
        if (!streetRef) {
            showToast('warning', 'Увага', 'Оберіть вулицю отримувача');
            return;
        }
        if (!building) {
            showToast('warning', 'Увага', 'Введіть номер будинку отримувача');
            return;
        }
    }

    if (state.recipientType === 'PrivatePerson') {
        if (!recipientLastName || !recipientFirstName) {
            showToast('warning', 'Увага', 'Введіть прізвище та ім\'я отримувача');
            return;
        }
    }

    if (!recipientPhone) {
        showToast('warning', 'Увага', 'Введіть телефон отримувача');
        return;
    }

    // Description
    const cargoDescAC = autocompletes.cargoDesc;
    const descValue = cargoDescAC?.getValue() || cargoDescAC?.input?.value?.trim() || '';
    if (!descValue) {
        showToast('warning', 'Увага', 'Введіть опис вантажу');
        return;
    }

    btn.disabled = true;
    btn.innerHTML = html`<div class="spinner spinner-sm" style="display:inline-block;"></div> Створення...`;

    try {
        // Normalize phone
        recipientPhone = normalizePhone(recipientPhone);
        console.log('[TTN] Normalized recipient phone:', recipientPhone);

        // Step 1: Create recipient counterparty
        if (state.recipientType === 'PrivatePerson') {
            const cpResult = await createCounterparty({
                FirstName: recipientFirstName,
                LastName: recipientLastName,
                MiddleName: recipientMiddleName,
                Phone: recipientPhone,
                CounterpartyType: 'PrivatePerson',
                CounterpartyProperty: 'Recipient',
            });

            console.log('[TTN] Counterparty result:', JSON.stringify(cpResult, null, 2));

            if (cpResult) {
                recipientRef = cpResult.Ref;
                // ContactPerson can be in different formats
                recipientContactRef = cpResult.ContactPerson?.data?.[0]?.Ref
                    || cpResult.ContactPerson?.Ref
                    || cpResult.Ref
                    || '';
                console.log('[TTN] recipientRef:', recipientRef, 'contactRef:', recipientContactRef);
            }
        } else {
            // FOP / Organization
            const edrpou = document.getElementById('recipient-edrpou')?.value?.trim();
            const fopName = document.getElementById('recipient-fop-name')?.value?.trim();
            const fopContactLastName = document.getElementById('recipient-fop-contact-lastname')?.value?.trim();
            const fopContactFirstName = document.getElementById('recipient-fop-contact-firstname')?.value?.trim();

            if (!edrpou) {
                showToast('warning', 'Увага', 'Введіть код ЄДРПОУ');
                btn.disabled = false;
                btn.innerHTML = '✅ Створити ТТН';
                return;
            }

            const cpParams = {
                CounterpartyType: 'Organization',
                CounterpartyProperty: 'Recipient',
                EDRPOU: edrpou,
            };

            if (fopName) cpParams.Description = fopName;

            const cpResult = await createCounterparty(cpParams);

            console.log('[TTN] FOP Counterparty result:', JSON.stringify(cpResult, null, 2));

            if (cpResult) {
                recipientRef = cpResult.Ref;

                // Nova Poshta automatically creates a default contact person ("Організації Представник")
                // but we need to supply the phone and custom name. So we always create our own contact person.
                const contactResult = await createContactPerson({
                    CounterpartyRef: recipientRef,
                    FirstName: fopContactFirstName || 'Представник',
                    LastName: fopContactLastName || 'Організації',
                    Phone: recipientPhone
                });

                if (contactResult) {
                    // Use our newly created contact person with the correct phone and name
                    recipientContactRef = contactResult.Ref;
                    console.log('[TTN] Created custom ContactPerson:', recipientContactRef);
                } else {
                    // Fallback just in case
                    recipientContactRef = cpResult.ContactPerson?.data?.[0]?.Ref
                        || cpResult.ContactPerson?.Ref
                        || '';
                }
            }
        }

        if (!recipientRef) {
            throw new Error('Не вдалося створити контрагента-отримувача');
        }

        // Step 2: Build TTN params
        let senderPhone = document.getElementById('sender-phone')?.value?.trim() || state.senderPhone;
        senderPhone = normalizePhone(senderPhone);

        // Determine sender address
        let senderAddressRef = state.senderAddressRef;
        const senderAddressSelect = document.getElementById('sender-address-select');
        if (senderAddressSelect) {
            senderAddressRef = senderAddressSelect.value;
        }

        const isDoorRecipient = serviceType === 'WarehouseDoors' || serviceType === 'DoorsDoors';
        let finalRecipientAddress = state.recipientAddressRef;
        let recipientHouse = document.getElementById('recipient-building')?.value?.trim() || '';
        let recipientFlat = document.getElementById('recipient-flat')?.value?.trim() || '';

        if (isDoorRecipient) {
            const streetRef = autocompletes.recipientStreet?.getValue();
            if (streetRef) {
                // For address delivery, we must create/retrieve a specific Address Ref for this counterparty.
                // This is especially critical for Organizations (FOP).
                const addrResult = await saveAddress({
                    CounterpartyRef: recipientRef,
                    StreetRef: streetRef,
                    BuildingNumber: recipientHouse,
                    Flat: recipientFlat
                });

                if (addrResult) {
                    finalRecipientAddress = addrResult.Ref;
                } else {
                    finalRecipientAddress = streetRef;
                }
            }
        }

        const ttnParams = {
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

        if (isDoorRecipient) {
            ttnParams.RecipientHouse = recipientHouse;
            ttnParams.RecipientFlat = recipientFlat;
        }

        console.log('[TTN] Full params:', JSON.stringify(ttnParams, null, 2));

        // Dimensions or Tires/Wheels CargoDetails
        if (cargoType === 'TiresWheels') {
            const twRef = document.getElementById('tires-wheels-select')?.value;
            if (twRef && seats) {
                ttnParams.CargoDetails = [
                    {
                        CargoDescription: twRef,
                        Amount: seats
                    }
                ];
            }
        } else {
            const dimensionsContainer = document.getElementById('dimensions-container');
            if (dimensionsContainer) {
                const rows = dimensionsContainer.querySelectorAll('.dimension-row');
                const optionsSeat = [];
                let hasValidDimensions = false;
                let hasIndividualWeights = false;

                const defaultWeight = weight ? String((parseFloat(weight) / (parseFloat(seats) || 1)).toFixed(2)) : '1';

                rows.forEach(row => {
                    const w = row.querySelector('.cargo-width')?.value;
                    const l = row.querySelector('.cargo-length')?.value;
                    const h = row.querySelector('.cargo-height')?.value;
                    const pWeight = row.querySelector('.cargo-weight-place')?.value;

                    const seatObj = {
                        weight: pWeight || defaultWeight
                    };

                    if (pWeight) hasIndividualWeights = true;

                    if (w && l && h) {
                        hasValidDimensions = true;
                        seatObj.volumetricVolume = String(parseFloat(w) * parseFloat(l) * parseFloat(h) / 4000);
                        seatObj.volumetricWidth = w;
                        seatObj.volumetricLength = l;
                        seatObj.volumetricHeight = h;
                    }

                    optionsSeat.push(seatObj);
                });

                if (hasValidDimensions || hasIndividualWeights) {
                    ttnParams.OptionsSeat = optionsSeat;
                }
            }
        }

        // Backward delivery
        if (state.backwardDeliveryEnabled) {
            const backType = document.getElementById('backward-type')?.value || 'Money';
            const backValue = document.getElementById('backward-value')?.value || '';
            const backPayer = document.getElementById('backward-payer')?.value || 'Recipient';

            const backData = {
                PayerType: backPayer,
                CargoType: backType,
            };

            if (backType === 'Money' && backValue) {
                backData.RedeliveryString = backValue;
            }

            ttnParams.BackwardDeliveryData = [backData];
        }

        if (note) ttnParams.InfoRegClientBarcodes = note;

        // Step 3: Create TTN
        const result = await createTTN(ttnParams);

        if (result) {
            const docNumber = result.IntDocNumber || result.Ref;
            showToast('success', 'ТТН створена! 🎉', `Номер: ${docNumber}`);

            // Show print options
            const printUrl = getPrintUrl(docNumber);
            const markingUrl = getPrintMarkingUrl(docNumber);

            btn.innerHTML = '✅ ТТН Створена!';
            btn.style.background = 'var(--success)';

            // Create result modal
            showResultModal(docNumber, result.Ref, printUrl, markingUrl, result.CostOnSite, result.EstimatedDeliveryDate, navigateTo);
        }
    } catch (err) {
        showToast('error', 'Помилка створення ТТН', err.message);
        btn.disabled = false;
        btn.innerHTML = '✅ Створити ТТН';
    }
}

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
        if (navigateTo) navigateTo('documents');
    });
    overlay.querySelector('#result-create-another').addEventListener('click', () => {
        overlay.remove();
        if (navigateTo) navigateTo('create');
    });
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.remove();
    });
}
