# -*- coding: utf-8 -*-
"""Apply i18n translations to dashboard.js, tracking.js, documents.js"""

import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'src', 'pages')

I18N_IMPORT_DOM = "import { html } from '../utils/dom.js';"
I18N_IMPORT_LINE = "import { t } from '../utils/i18n.js';"


def add_import(text):
    if "import { t }" not in text:
        text = text.replace(I18N_IMPORT_DOM, I18N_IMPORT_DOM + "\n" + I18N_IMPORT_LINE)
    return text


def replace_all(text, pairs):
    for old, new in pairs:
        text = text.replace(old, new)
    return text


# ──────────────────────────────────────────────────────────────────────────────
# dashboard.js
# ──────────────────────────────────────────────────────────────────────────────
path_dash = os.path.join(SRC, 'dashboard.js')
with open(path_dash, encoding='utf-8') as f:
    dash = f.read()

dash = add_import(dash)
dash = replace_all(dash, [
    # no-api-key block
    ('Встановіть API ключ</div>', "${t('create.set_api_key')}</div>"),
    (
        'Перейдіть до <a href="#" data-nav="settings">Налаштувань</a> та введіть ваш API ключ Нової Пошти',
        "${t('create.go_to_settings')} <a href=\"#\" data-nav=\"settings\">${t('nav.settings')}</a>"
    ),
    # page title/subtitle
    ('Панель управління</h1>', "${t('dash.title')}</h1>"),
    ('Огляд ваших відправлень та швидкі дії</p>', "${t('dash.subtitle')}</p>"),
    # stat labels
    ('Завантаження...</div>', "${t('dash.loading')}</div>"),
    ('Всього ТТН (30 днів)</div>', "${t('dash.total_30')}</div>"),
    ('В дорозі</div>', "${t('dash.in_transit')}</div>"),
    ('Доставлено</div>', "${t('dash.delivered')}</div>"),
    ('Інші</div>', "${t('dash.other')}</div>"),
    # buttons
    ('📝 Створити нову ТТН', "📝 ${t('dash.create_btn')}"),
    ('🔍 Відстежити посилку', "🔍 ${t('dash.track_btn')}"),
    # card titles
    ('📋</span> Останні відправлення</div>', "📋</span> ${t('dash.recent')}</div>"),
    ('>Всі ТТН →</button>', ">${t('dash.all_ttn')}</button>"),
    # empty state
    ('Немає відправлень</div>', "${t('dash.no_shipments')}</div>"),
    ('Створіть першу ТТН</p>', "${t('dash.create_first')}</p>"),
    # error
    # table headers
    ('<th>№ ТТН</th>', "<th>${t('dash.col_ttn')}</th>"),
    ('<th>Дата</th>', "<th>${t('dash.col_date')}</th>"),
    ('<th>Отримувач</th>', "<th>${t('dash.col_recipient')}</th>"),
    ('<th>Вартість, грн</th>', "<th>${t('dash.col_cost')}</th>"),
    ('<th>Статус</th>', "<th>${t('dash.col_status')}</th>"),
    # toast / error
    ("showToast('error', 'Помилка завантаження'", "showToast('error', t('dash.error')"),
    # error card
    ('Помилка</div>', "${t('dash.error')}</div>"),
])

with open(path_dash, 'w', encoding='utf-8') as f:
    f.write(dash)
print('dashboard.js ✓')


# ──────────────────────────────────────────────────────────────────────────────
# tracking.js
# ──────────────────────────────────────────────────────────────────────────────
path_track = os.path.join(SRC, 'tracking.js')
with open(path_track, encoding='utf-8') as f:
    track = f.read()

track = add_import(track)
track = replace_all(track, [
    # page header
    ('Трекінг посилки</h1>', "${t('track.title')}</h1>"),
    ('Відстежуйте статус вашої посилки за номером ТТН</p>', "${t('track.subtitle')}</p>"),
    # search card
    ('🔍</span> Пошук за номером ТТН</div>', "🔍</span> ${t('track.search_title')}</div>"),
    ('placeholder="Введіть номер ТТН (напр. 20450000000000)"', "placeholder=\"${t('track.placeholder')}\""),
    ('>🔍 Відстежити</button>', ">${t('track.btn')}</button>"),
    ('Введіть 14-значний номер товарно-транспортної накладної</div>', "${t('track.hint')}</div>"),
    # history card
    ('🕐</span> Історія пошуку</div>', "🕐</span> ${t('track.history_title')}</div>"),
    ('>Очистити</button>', ">${t('track.clear')}</button>"),
    ('Історія пошуку порожня</p>', "${t('track.history_empty')}</p>"),
    # searching state
    ('<p style="margin-top: var(--space-sm); color: var(--text-muted);">Пошук...</p>', "<p style=\"margin-top: var(--space-sm); color: var(--text-muted);\">${t('track.searching')}</p>"),
    # not found
    ('Нічого не знайдено</div>', "${t('track.not_found')}</div>"),
    ('Перевірте правильність номера ТТН</p>', "${t('track.check_number')}</p>"),
    # result fields
    ('<div class="form-label">Статус</div>', "<div class=\"form-label\">${t('track.status')}</div>"),
    ('<div class="form-label">Дата створення</div>', "<div class=\"form-label\">${t('track.date_created')}</div>"),
    ('<div class="form-label">Відправник</div>', "<div class=\"form-label\">${t('track.sender')}</div>"),
    ('<div class="form-label">Отримувач</div>', "<div class=\"form-label\">${t('track.recipient')}</div>"),
    ('<div class="form-label">Вага</div>', "<div class=\"form-label\">${t('track.weight')}</div>"),
    ('<div class="form-label">Вартість доставки</div>', "<div class=\"form-label\">${t('track.delivery_cost')}</div>"),
    ('<div class="form-label">Оціночна вартість</div>', "<div class=\"form-label\">${t('track.declared_price')}</div>"),
    ('<div class="form-label">Наложений платіж</div>', "<div class=\"form-label\">${t('track.cod')}</div>"),
    ('<div class="form-label">Дата доставки (план)</div>', "<div class=\"form-label\">${t('track.scheduled_date')}</div>"),
    ('<div class="form-label">Дата отримання</div>', "<div class=\"form-label\">${t('track.received_date')}</div>"),
    ('<div class="form-label">Фактична доставка</div>', "<div class=\"form-label\">${t('track.actual_date')}</div>"),
    ('Останнє оновлення:', "${t('track.last_update')}:"),
    # error state
    ('Помилка</div>\n          <p>${err.message}</p>', "${t('track.error')}</div>\n          <p>${err.message}</p>"),
    # history table headers
    ('<th>№ ТТН</th>', "<th>${t('track.col_ttn')}</th>"),
    ('<th>Статус</th>', "<th>${t('track.col_status')}</th>"),
    ('<th>Дата пошуку</th>', "<th>${t('track.col_date')}</th>"),
    # button restore
    ("btn.innerHTML = '🔍 Відстежити'", "btn.innerHTML = '🔍 ' + t('track.btn')"),
    # validation toasts
    ("showToast('warning', 'Увага', 'Введіть номер ТТН')", "showToast('warning', t('track.warn_enter'), '')"),
    ("showToast('warning', 'Невірний формат', 'Номер ТТН повинен містити рівно 14 цифр (напр.: 20451234567890)')",
     "showToast('warning', t('track.warn_format'), t('track.warn_format_msg'))"),
    ("showToast('error', 'Помилка'", "showToast('error', t('track.error')"),
])

with open(path_track, 'w', encoding='utf-8') as f:
    f.write(track)
print('tracking.js ✓')


# ──────────────────────────────────────────────────────────────────────────────
# documents.js
# ──────────────────────────────────────────────────────────────────────────────
path_docs = os.path.join(SRC, 'documents.js')
with open(path_docs, encoding='utf-8') as f:
    docs = f.read()

docs = add_import(docs)
docs = replace_all(docs, [
    # no-api-key
    ('Встановіть API ключ</div>', "${t('create.set_api_key')}</div>"),
    ('Перейдіть до <a href="#" data-nav="settings">Налаштувань</a>', "${t('create.go_to_settings')} <a href=\"#\" data-nav=\"settings\">${t('nav.settings')}</a>"),
    # page title/subtitle
    ('Мої ТТН</h1>', "${t('docs.title')}</h1>"),
    ('Список створених товарно-транспортних накладних</p>', "${t('docs.subtitle')}</p>"),
    # filter card labels
    ('<label class="form-label">Дата від</label>', "<label class=\"form-label\">${t('docs.date_from')}</label>"),
    ('<label class="form-label">Дата до</label>', "<label class=\"form-label\">${t('docs.date_to')}</label>"),
    ('>🔍 Фільтрувати</button>', ">${t('docs.filter')}</button>"),
    ('>🖨️ Друк обраних</button>', ">${t('docs.print_selected')}</button>"),
    # loading
    ('Завантаження документів...</p>', "${t('docs.loading')}</p>"),
    ('Завантаження...</p>', "${t('docs.loading2')}</p>"),
    # empty state
    ('Немає документів</div>', "${t('docs.no_docs')}</div>"),
    ('За обраний період ТТН не знайдено</p>', "${t('docs.no_docs_msg')}</p>"),
    # error
    ('Помилка завантаження</div>', "${t('docs.error')}</div>"),
    # table headers
    ('<th>№ ТТН</th>', "<th>${t('docs.col_ttn')}</th>"),
    ('<th>Дата</th>', "<th>${t('docs.col_date')}</th>"),
    ('<th>Отримувач</th>', "<th>${t('docs.col_recipient')}</th>"),
    ('<th>Місто</th>', "<th>${t('docs.col_city')}</th>"),
    ('<th>Вага</th>', "<th>${t('docs.col_weight')}</th>"),
    ('<th>Вартість</th>', "<th>${t('docs.col_cost')}</th>"),
    ('<th>Статус</th>', "<th>${t('docs.col_status')}</th>"),
    ('<th>Дії</th>', "<th>${t('docs.col_actions')}</th>"),
    # pagination
    ('Всього: ${total} документів', "${t('docs.total')}: ${total}"),
    ('Всього: ${total}', "${t('docs.total')}: ${total}"),
    ('>← Попередня</button>', ">${t('docs.prev')}</button>"),
    ('>Наступна →</button>', ">${t('docs.next')}</button>"),
    # toasts
    ("showToast('warning', 'Увага', 'Оберіть ТТН для друку')", "showToast('warning', t('docs.warn_print'), '')"),
    ("showToast('warning', 'Увага', 'Обрано забагато ТТН. Рекомендується не більше 30 за раз.')", "showToast('warning', t('docs.warn_too_many'), '')"),
    ("showToast('success', 'Видалено'", "showToast('success', t('docs.deleted')"),
    ("showToast('error', 'Помилка видалення'", "showToast('error', t('docs.delete_error')"),
    ("showToast('error', 'Помилка'", "showToast('error', t('docs.error')"),
    # confirm dialog
    ("if (!confirm(`Видалити ТТН ${number}?`)) return;", "if (!confirm(`${t('docs.confirm_delete')} ${number}?`)) return;"),
])

with open(path_docs, 'w', encoding='utf-8') as f:
    f.write(docs)
print('documents.js ✓')
