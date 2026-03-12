import {
    searchSettlements,
    getWarehouses,
    getStreet,
    getCargoDescriptionList,
    getSenderCounterparties,
    getCounterpartyContactPersons
} from '../../api/novaposhta.js';
import { createAutocomplete } from '../../components/autocomplete.js';
import { showToast } from '../../components/toast.js';
import { html } from '../../utils/dom.js';
import { state, autocompletes } from './state.js';

export async function applyDefaults() {
    try {
        // Default Cargo Description: Автозапчастини
        if (!state.description) {
            const descriptions = await getCargoDescriptionList('Автозапчастини');
            const desc = descriptions.find(d => d.Description.toLowerCase().includes('автозапчастини')) || descriptions[0];
            if (desc) {
                state.description = desc.Ref;
                if (autocompletes.cargoDesc) autocompletes.cargoDesc.setValue(desc.Description, desc.Ref);
            }
        }

        // Default Sender City: Овідіополь
        if (!state.senderCityRef) {
            const cities = await searchSettlements('Овідіополь');
            const city = cities.find(c => c.Present.includes('Овідіополь')) || cities[0];
            if (city) {
                state.senderCityRef = city.DeliveryCity || city.Ref;
                state.senderCityName = city.Present;
                if (autocompletes.senderCity) autocompletes.senderCity.setValue(city.Present, state.senderCityRef);

                // Default Sender Warehouse: Відділення 1
                const warehouses = await getWarehouses(state.senderCityRef, '');
                const wh = warehouses.find(w => w.Description.includes('№1') || w.Description.includes('№ 1') || w.Description === 'Відділення №1');
                if (wh) {
                    state.senderAddressRef = wh.Ref;
                    if (autocompletes.senderWarehouse) autocompletes.senderWarehouse.setValue(wh.Description, wh.Ref);
                }
            }
        }
    } catch (err) {
        console.error('Failed to set defaults:', err);
    }
}

export async function loadSenderData() {
    const senderSection = document.getElementById('sender-section');
    if (!senderSection) return;

    try {
        const senders = await getSenderCounterparties();
        if (!senders.length) {
            senderSection.innerHTML = html`
        <div class="empty-state">
          <div class="empty-icon">❌</div>
          <div class="empty-title">Не знайдено відправників</div>
          <p>Створіть контрагента-відправника в кабінеті Нової Пошти</p>
        </div>
      `;
            return;
        }

        // Select first sender
        const sender = senders[0];
        state.senderRef = sender.Ref;

        // Get contact persons
        const contacts = await getCounterpartyContactPersons(sender.Ref);
        const contact = contacts[0];
        if (contact) {
            state.senderContactRef = contact.Ref;
            state.senderPhone = contact.Phones || '';
        }

        senderSection.innerHTML = html`
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">Відправник</label>
          <select class="form-select" id="sender-select">
            ${senders.map(s => html`<option value="${s.Ref}" ${s.Ref === sender.Ref ? 'selected' : ''}>${s.Description}</option>`)}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Контактна особа</label>
          <select class="form-select" id="sender-contact-select">
            ${contacts.map(c => html`<option value="${c.Ref}" ${c.Ref === contact?.Ref ? 'selected' : ''}>${c.Description} (${c.Phones || ''})</option>`)}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Телефон відправника</label>
          <input type="tel" class="form-input" id="sender-phone" value="${state.senderPhone}" placeholder="380XXXXXXXXX">
        </div>
        <div class="form-group" id="sender-city-group">
          <label class="form-label">Місто відправника <span class="required">*</span></label>
          <!-- autocomplete injected -->
        </div>
        <div class="form-group" id="sender-warehouse-group">
          <label class="form-label">Відділення відправника <span class="required">*</span></label>
          <!-- autocomplete injected -->
        </div>
      </div>
    `;

        // Init sender city autocomplete
        initSenderCityAutocomplete();
        // Init sender warehouse autocomplete
        initSenderWarehouseAutocomplete();

        // Sender select change
        const senderSelect = document.getElementById('sender-select');
        if (senderSelect) {
            senderSelect.addEventListener('change', async () => {
                state.senderRef = senderSelect.value;
                try {
                    const newContacts = await getCounterpartyContactPersons(state.senderRef);
                    const contactSelect = document.getElementById('sender-contact-select');
                    if (contactSelect) {
                        contactSelect.innerHTML = newContacts.map(c =>
                            html`<option value="${c.Ref}">${c.Description} (${c.Phones || ''})</option>`
                        ).join('');
                        if (newContacts[0]) {
                            state.senderContactRef = newContacts[0].Ref;
                            state.senderPhone = newContacts[0].Phones || '';
                            document.getElementById('sender-phone').value = state.senderPhone;
                        }
                    }
                } catch (err) {
                    showToast('error', 'Помилка', err.message);
                }
            });
        }

        // Contact select change
        const contactSelect = document.getElementById('sender-contact-select');
        if (contactSelect) {
            contactSelect.addEventListener('change', () => {
                state.senderContactRef = contactSelect.value;
                const selectedOpt = contactSelect.options[contactSelect.selectedIndex];
                const phonesMatch = selectedOpt.textContent.match(/\(([^)]*)\)/);
                if (phonesMatch) {
                    state.senderPhone = phonesMatch[1];
                    document.getElementById('sender-phone').value = state.senderPhone;
                }
            });
        }

    } catch (err) {
        senderSection.innerHTML = html`
      <div class="empty-state">
        <div class="empty-icon">❌</div>
        <div class="empty-title">Помилка завантаження</div>
        <p>${err.message}</p>
      </div>
    `;
        showToast('error', 'Помилка відправника', err.message);
    }
}

export function initSenderCityAutocomplete() {
    const group = document.getElementById('sender-city-group');
    if (!group || group.querySelector('.autocomplete-wrapper')) return;

    autocompletes.senderCity = createAutocomplete({
        inputId: 'sender-city-input',
        placeholder: 'Почніть вводити місто...',
        onSearch: async (query) => {
            const results = await searchSettlements(query);
            return results;
        },
        renderItem: (item) => `
      <div class="item-main">${item.Present}</div>
    `,
        onSelect: (item, ac) => {
            state.senderCityRef = item.DeliveryCity || item.Ref;
            state.senderCityName = item.Present;
            ac.setValue(item.Present, item.DeliveryCity || item.Ref);
            // Reset sender warehouse when city changes
            state.senderAddressRef = '';
            if (autocompletes.senderWarehouse) autocompletes.senderWarehouse.clear();
        },
    });

    group.appendChild(autocompletes.senderCity.wrapper);
}

export function initSenderWarehouseAutocomplete() {
    const group = document.getElementById('sender-warehouse-group');
    if (!group || group.querySelector('.autocomplete-wrapper')) return;

    autocompletes.senderWarehouse = createAutocomplete({
        inputId: 'sender-warehouse-input',
        placeholder: 'Пошук відділення відправника...',
        minChars: 0,
        onSearch: async (query) => {
            if (!state.senderCityRef) {
                throw new Error('Спочатку оберіть місто відправника');
            }
            return await getWarehouses(state.senderCityRef, query);
        },
        renderItem: (item) => `
      <div class="item-main">${item.Description}</div>
      <div class="item-sub">${item.ShortAddress || ''}</div>
    `,
        onSelect: (item, ac) => {
            state.senderAddressRef = item.Ref;
            ac.setValue(item.Description, item.Ref);
        },
    });

    group.appendChild(autocompletes.senderWarehouse.wrapper);
}

export function initRecipientCityAutocomplete() {
    const group = document.getElementById('recipient-city-group');
    if (!group) return;

    autocompletes.recipientCity = createAutocomplete({
        inputId: 'recipient-city-input',
        placeholder: 'Почніть вводити місто...',
        onSearch: async (query) => {
            const results = await searchSettlements(query);
            return results;
        },
        renderItem: (item) => `
      <div class="item-main">${item.Present}</div>
    `,
        onSelect: (item, ac) => {
            state.recipientCityRef = item.DeliveryCity || item.Ref;
            state.recipientCityName = item.Present;
            ac.setValue(item.Present, item.DeliveryCity || item.Ref);
            // Reset and reload address
            if (autocompletes.recipientWarehouse) autocompletes.recipientWarehouse.clear();
            if (autocompletes.recipientStreet) autocompletes.recipientStreet.clear();
            state.recipientAddressRef = '';
        },
    });

    group.appendChild(autocompletes.recipientCity.wrapper);
}

export function initRecipientAddressAutocomplete() {
    const group = document.getElementById('recipient-address-group');
    if (!group) return;

    autocompletes.recipientWarehouse = createAutocomplete({
        inputId: 'recipient-warehouse-input',
        placeholder: 'Пошук відділення або поштомату...',
        minChars: 0,
        onSearch: async (query) => {
            if (!state.recipientCityRef) {
                throw new Error('Спочатку оберіть місто');
            }
            return await getWarehouses(state.recipientCityRef, query);
        },
        renderItem: (item) => `
      <div class="item-main">${item.Description}</div>
      <div class="item-sub">${item.ShortAddress || ''}</div>
    `,
        onSelect: (item, ac) => {
            state.recipientAddressRef = item.Ref;
            ac.setValue(item.Description, item.Ref);
        },
    });

    group.appendChild(autocompletes.recipientWarehouse.wrapper);

    // Also set up street autocomplete for door delivery
    const streetGroup = document.getElementById('recipient-street-group');
    if (streetGroup) {
        autocompletes.recipientStreet = createAutocomplete({
            inputId: 'recipient-street-input',
            placeholder: 'Пошук вулиці...',
            onSearch: async (query) => {
                if (!state.recipientCityRef) {
                    throw new Error('Спочатку оберіть місто');
                }
                return await getStreet(state.recipientCityRef, query);
            },
            renderItem: (item) => html`
        <div class="item-main">${item.Description}</div>
        <div class="item-sub">${item.StreetsType || ''} ${item.StreetsTypeDescription || ''}</div>
      `,
            onSelect: (item, ac) => {
                state.recipientAddressRef = item.Ref;
                ac.setValue(item.Description, item.Ref);
            },
        });
        streetGroup.appendChild(autocompletes.recipientStreet.wrapper);
    }
}

export function initCargoDescriptionAutocomplete() {
    const group = document.getElementById('cargo-desc-group');
    if (!group) return;

    autocompletes.cargoDesc = createAutocomplete({
        inputId: 'cargo-desc-input',
        placeholder: 'Введіть опис вантажу (наприклад: одяг, електроніка)...',
        minChars: 2,
        onSearch: async (query) => {
            return await getCargoDescriptionList(query);
        },
        renderItem: (item) => html`
      <div class="item-main">${item.Description}</div>
    `,
        onSelect: (item, ac) => {
            state.description = item.Ref;
            ac.setValue(item.Description, item.Ref);
        },
    });

    group.appendChild(autocompletes.cargoDesc.wrapper);
}
