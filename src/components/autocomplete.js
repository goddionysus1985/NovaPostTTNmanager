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
    let activeIndex = -1; // keyboard navigation cursor

    // ─── Helpers ───────────────────────────────────────────────────────────────

    function getItems() {
        return dropdown.querySelectorAll('.autocomplete-item');
    }

    function highlightItem(index) {
        const items = getItems();
        items.forEach((el, i) => {
            el.classList.toggle('active', i === index);
        });
        // Scroll into view
        if (items[index]) {
            items[index].scrollIntoView({ block: 'nearest' });
        }
    }

    async function runSearch(query) {
        try {
            const results = await onSearch(query);
            dropdown.innerHTML = '';
            activeIndex = -1;

            if (results.length === 0) {
                dropdown.innerHTML = html`<div class="autocomplete-empty">Нічого не знайдено</div>`;
            } else {
                results.forEach((item, idx) => {
                    const el = document.createElement('div');
                    el.className = 'autocomplete-item';
                    el.setAttribute('data-idx', idx);
                    el.innerHTML = renderItem
                        ? renderItem(item)
                        : html`<div class="item-main">${item.label || item}</div>`;

                    // Mouse select
                    el.addEventListener('mousedown', (e) => {
                        // Use mousedown (before blur) so we can select before dropdown closes
                        e.preventDefault();
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
    }

    // ─── Autocomplete Object ───────────────────────────────────────────────────

    const ac = {
        wrapper,
        input,
        dropdown,
        selectedValue: null,

        close() {
            dropdown.classList.remove('show');
            activeIndex = -1;
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

    // ─── Input Events ──────────────────────────────────────────────────────────

    input.addEventListener('input', () => {
        selectedValue = null;
        ac.selectedValue = null;
        clearTimeout(debounceTimer);

        const query = input.value.trim();
        if (query.length < minChars) {
            ac.close();
            return;
        }

        debounceTimer = setTimeout(() => runSearch(query), debounceMs);
    });

    // Open on focus if minChars === 0 and list is empty (first time or after clear)
    input.addEventListener('focus', () => {
        if (minChars === 0 && dropdown.children.length === 0) {
            runSearch('');
        } else if (dropdown.children.length > 0) {
            dropdown.classList.add('show');
            activeDropdown = ac;
        }
    });

    // ─── Keyboard Navigation ───────────────────────────────────────────────────

    input.addEventListener('keydown', (e) => {
        const items = getItems();
        const count = items.length;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                if (!dropdown.classList.contains('show')) {
                    // Open if closed
                    if (minChars === 0) runSearch('');
                    break;
                }
                activeIndex = Math.min(activeIndex + 1, count - 1);
                highlightItem(activeIndex);
                break;

            case 'ArrowUp':
                e.preventDefault();
                activeIndex = Math.max(activeIndex - 1, -1);
                highlightItem(activeIndex);
                break;

            case 'Enter':
                e.preventDefault();
                if (activeIndex >= 0 && items[activeIndex]) {
                    items[activeIndex].dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
                }
                break;

            case 'Escape':
                ac.close();
                input.blur();
                break;

            case 'Tab':
                // auto-select top result on Tab if only one result and nothing selected
                if (count === 1 && activeIndex === -1) {
                    items[0].dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
                } else {
                    ac.close();
                }
                break;
        }
    });

    return ac;
}
