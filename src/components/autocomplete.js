import { html } from '../utils/dom.js';

let activeDropdown = null;

// Close any open dropdown when clicking outside
document.addEventListener('click', (e) => {
    if (activeDropdown && !activeDropdown.wrapper.contains(e.target)) {
        activeDropdown.close();
    }
});

export function createAutocomplete({
    inputId,
    placeholder = '',
    onSearch,
    onSelect,
    renderItem,
    minChars = 2,
    debounceMs = 300,
}) {
    const wrapper = document.createElement('div');
    wrapper.className = 'autocomplete-wrapper';

    const input = document.createElement('input');
    input.type = 'text';
    input.id = inputId;
    input.className = 'form-input';
    input.placeholder = placeholder;
    input.autocomplete = 'off';

    const dropdown = document.createElement('div');
    dropdown.className = 'autocomplete-dropdown';

    wrapper.appendChild(input);
    wrapper.appendChild(dropdown);

    let debounceTimer = null;
    let selectedValue = null;

    const ac = {
        wrapper,
        input,
        dropdown,
        selectedValue: null,
        close() {
            dropdown.classList.remove('show');
            if (activeDropdown === ac) activeDropdown = null;
        },
        clear() {
            input.value = '';
            selectedValue = null;
            ac.selectedValue = null;
            dropdown.innerHTML = '';
            ac.close();
        },
        setValue(text, value) {
            input.value = text;
            selectedValue = value;
            ac.selectedValue = value;
            ac.close();
        },
        getValue() {
            return ac.selectedValue;
        },
        setDisabled(disabled) {
            input.disabled = disabled;
        },
    };

    input.addEventListener('input', () => {
        selectedValue = null;
        ac.selectedValue = null;
        clearTimeout(debounceTimer);

        const query = input.value.trim();
        if (query.length < minChars) {
            ac.close();
            return;
        }

        debounceTimer = setTimeout(async () => {
            try {
                const results = await onSearch(query);
                dropdown.innerHTML = '';

                if (results.length === 0) {
                    dropdown.innerHTML = html`<div class="autocomplete-empty">Нічого не знайдено</div>`;
                } else {
                    results.forEach((item) => {
                        const el = document.createElement('div');
                        el.className = 'autocomplete-item';
                        el.innerHTML = renderItem ? renderItem(item) : html`<div class="item-main">${item.label || item}</div>`;
                        el.addEventListener('click', () => {
                            if (onSelect) onSelect(item, ac);
                        });
                        dropdown.appendChild(el);
                    });
                }

                dropdown.classList.add('show');
                activeDropdown = ac;
            } catch (err) {
                dropdown.innerHTML = html`<div class="autocomplete-empty">Помилка: ${err.message}</div>`;
                dropdown.classList.add('show');
                activeDropdown = ac;
            }
        }, debounceMs);
    });

    input.addEventListener('focus', () => {
        if (dropdown.children.length > 0) {
            dropdown.classList.add('show');
            activeDropdown = ac;
        }
    });

    return ac;
}
