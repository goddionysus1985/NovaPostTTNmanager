# -*- coding: utf-8 -*-
"""Generate complete i18n.js with all translation keys"""

UA = {
    'nav.dashboard': 'Панель',
    'nav.create': 'Створити ТТН',
    'nav.tracking': 'Трекінг',
    'nav.documents': 'Мої ТТН',
    'nav.settings': 'Налаштування',
    'theme.toggle': 'Змінити тему',

    'create.set_api_key': 'Встановіть API ключ',
    'create.go_to_settings': 'Перейдіть до',
    'create.package_info': 'Інформація про посилку',
    'create.cargo_type': 'Тип вантажу',
    'create.payer': 'Платник',
    'create.payment_method': 'Форма оплати',
    'create.cargo_description': 'Опис вантажу',
    'create.places': 'Місця',
    'create.dimensions': 'Розміри, см (Д/Ш/В)',
    'create.weight': 'Вага, кг',
    'create.add_place': 'Додати місце',
    'create.calculate_price': 'Розрахувати вартість',
    'create.create_ttn': 'Створити НП',
    'create.recipient': 'Отримувач',
    'create.private_person': 'Фізична особа',
    'create.organization': 'Юр. особа / ФОП',
    'create.recipient_fullname': 'ФІО отримувача',
    'create.recipient_fullname_placeholder': 'Н-р: Іванов Іван Іванович',
    'create.edrpou': 'Код ЄДРПОУ',
    'create.organization_name': 'Назва організації / ФОП',
    'create.contact_lastname': 'Прізвище конт. особи',
    "create.contact_firstname": "Ім'я конт. особи",
    'create.recipient_phone': 'Телефон отримувача',
    'create.delivery_method': 'Спосіб доставки',
    'create.delivery_address': 'Адреса доставки',
    'create.map': 'Карта',
    'create.amounts': 'Суми',
    'create.declared_value': 'Оголошена цінність, UAH',
    'create.backward_delivery': 'Зворотна доставка',
    'create.backward_value': 'Сума після оплати, UAH',
    'create.service': 'Послуга',
    'create.weight_sum': 'Вага',
    'create.backward_sum': 'Після оплата',
    'create.calc_delivery_cost': 'Розрахувати вартість доставки',
    'create.cargo_types.Parcel': 'Посилка',
    'create.cargo_types.Cargo': 'Вантаж',
    'create.cargo_types.TiresWheels': 'Шини та диски',
    'create.cargo_types.Documents': 'Документи',
    'create.payer_types.Recipient': 'Отримувач',
    'create.payer_types.Sender': 'Відправник',
    'create.payer_types.ThirdPerson': 'Третя особа',
    'create.payment_methods.Cash': 'Готівкова',
    'create.payment_methods.NonCash': 'Безготівкова',
    "create.delivery_methods.WarehouseWarehouse": 'НП до відділення',
    "create.delivery_methods.WarehouseDoors": "Кур'єром на адресу",
    'create.delivery_methods.DoorsWarehouse': 'Адреса - Відділення',
    'create.delivery_methods.DoorsDoors': 'Адреса - Адреса',

    'dash.title': 'Панель управління',
    'dash.subtitle': 'Огляд ваших відправлень та швидкі дії',
    'dash.loading': 'Завантаження...',
    'dash.create_btn': 'Створити нову ТТН',
    'dash.track_btn': 'Відстежити посилку',
    'dash.recent': 'Останні відправлення',
    'dash.all_ttn': 'Всі ТТН →',
    'dash.total_30': 'Всього ТТН (30 днів)',
    'dash.in_transit': 'В дорозі',
    'dash.delivered': 'Доставлено',
    'dash.other': 'Інші',
    'dash.no_shipments': 'Немає відправлень',
    'dash.create_first': 'Створіть першу ТТН',
    'dash.error': 'Помилка',
    'dash.col_ttn': '№ ТТН',
    'dash.col_date': 'Дата',
    'dash.col_recipient': 'Отримувач',
    'dash.col_cost': 'Вартість, грн',
    'dash.col_status': 'Статус',

    'track.title': 'Трекінг посилки',
    'track.subtitle': 'Відстежуйте статус вашої посилки за номером ТТН',
    'track.search_title': 'Пошук за номером ТТН',
    'track.placeholder': 'Введіть номер ТТН (напр. 20450000000000)',
    'track.btn': 'Відстежити',
    'track.hint': 'Введіть 14-значний номер ТТН',
    'track.history_title': 'Історія пошуку',
    'track.clear': 'Очистити',
    'track.history_empty': 'Історія пошуку порожня',
    'track.searching': 'Пошук...',
    'track.not_found': 'Нічого не знайдено',
    'track.check_number': 'Перевірте правильність номера ТТН',
    'track.error': 'Помилка',
    'track.status': 'Статус',
    'track.date_created': 'Дата створення',
    'track.sender': 'Відправник',
    'track.recipient': 'Отримувач',
    'track.weight': 'Вага',
    'track.delivery_cost': 'Вартість доставки',
    'track.declared_price': 'Оціночна вартість',
    'track.cod': 'Наложений платіж',
    'track.scheduled_date': 'Дата доставки (план)',
    'track.received_date': 'Дата отримання',
    'track.actual_date': 'Фактична доставка',
    'track.last_update': 'Останнє оновлення',
    'track.col_ttn': '№ ТТН',
    'track.col_status': 'Статус',
    'track.col_date': 'Дата пошуку',
    'track.warn_enter': 'Введіть номер ТТН',
    'track.warn_format': 'Невірний формат',
    'track.warn_format_msg': 'Номер ТТН повинен містити рівно 14 цифр (напр.: 20451234567890)',

    'docs.title': 'Мої ТТН',
    'docs.subtitle': 'Список створених товарно-транспортних накладних',
    'docs.date_from': 'Дата від',
    'docs.date_to': 'Дата до',
    'docs.filter': 'Фільтрувати',
    'docs.print_selected': 'Друк обраних',
    'docs.loading': 'Завантаження документів...',
    'docs.loading2': 'Завантаження...',
    'docs.no_docs': 'Немає документів',
    'docs.no_docs_msg': 'За обраний період ТТН не знайдено',
    'docs.error': 'Помилка завантаження',
    'docs.col_ttn': '№ ТТН',
    'docs.col_date': 'Дата',
    'docs.col_recipient': 'Отримувач',
    'docs.col_city': 'Місто',
    'docs.col_weight': 'Вага',
    'docs.col_cost': 'Вартість',
    'docs.col_status': 'Статус',
    'docs.col_actions': 'Дії',
    'docs.total': 'Всього',
    'docs.prev': '← Попередня',
    'docs.next': 'Наступна →',
    'docs.warn_print': 'Оберіть ТТН для друку',
    'docs.warn_too_many': 'Обрано забагато ТТН. Рекомендується не більше 30 за раз.',
    'docs.deleted': 'Видалено',
    'docs.delete_error': 'Помилка видалення',
    'docs.confirm_delete': 'Видалити ТТН',

    'common.api_key_msg': 'та введіть ваш API ключ Нової Пошти',
}

RU = {
    'nav.dashboard': 'Панель',
    'nav.create': 'Создать ТТН',
    'nav.tracking': 'Трекинг',
    'nav.documents': 'Мои ТТН',
    'nav.settings': 'Настройки',
    'theme.toggle': 'Изменить тему',

    'create.set_api_key': 'Установите API ключ',
    'create.go_to_settings': 'Перейдите в',
    'create.package_info': 'Информация о посылке',
    'create.cargo_type': 'Тип груза',
    'create.payer': 'Плательщик',
    'create.payment_method': 'Форма оплаты',
    'create.cargo_description': 'Описание груза',
    'create.places': 'Места',
    'create.dimensions': 'Размеры, см (Д/Ш/В)',
    'create.weight': 'Вес, кг',
    'create.add_place': 'Добавить место',
    'create.calculate_price': 'Рассчитать стоимость',
    'create.create_ttn': 'Создать НП',
    'create.recipient': 'Получатель',
    'create.private_person': 'Физическое лицо',
    'create.organization': 'Юр. лицо / ФОП',
    'create.recipient_fullname': 'ФИО получателя',
    'create.recipient_fullname_placeholder': 'Н-р: Иванов Иван Иванович',
    'create.edrpou': 'Код ЕГРПОУ',
    'create.organization_name': 'Название организации / ФОП',
    'create.contact_lastname': 'Фамилия конт. лица',
    'create.contact_firstname': 'Имя конт. лица',
    'create.recipient_phone': 'Телефон получателя',
    'create.delivery_method': 'Способ доставки',
    'create.delivery_address': 'Адрес доставки',
    'create.map': 'Карта',
    'create.amounts': 'Суммы',
    'create.declared_value': 'Объявленная ценность, UAH',
    'create.backward_delivery': 'Обратная доставка',
    'create.backward_value': 'Сумма наложенного платежа, UAH',
    'create.service': 'Услуга',
    'create.weight_sum': 'Вес',
    'create.backward_sum': 'Наложенный платеж',
    'create.calc_delivery_cost': 'Рассчитать стоимость доставки',
    'create.cargo_types.Parcel': 'Посылка',
    'create.cargo_types.Cargo': 'Груз',
    'create.cargo_types.TiresWheels': 'Шины и диски',
    'create.cargo_types.Documents': 'Документы',
    'create.payer_types.Recipient': 'Получатель',
    'create.payer_types.Sender': 'Отправитель',
    'create.payer_types.ThirdPerson': 'Третье лицо',
    'create.payment_methods.Cash': 'Наличная',
    'create.payment_methods.NonCash': 'Безналичная',
    'create.delivery_methods.WarehouseWarehouse': 'НП в отделение',
    'create.delivery_methods.WarehouseDoors': 'Курьером на адрес',
    'create.delivery_methods.DoorsWarehouse': 'Адрес - Отделение',
    'create.delivery_methods.DoorsDoors': 'Адрес - Адрес',

    'dash.title': 'Панель управления',
    'dash.subtitle': 'Обзор ваших отправлений и быстрые действия',
    'dash.loading': 'Загрузка...',
    'dash.create_btn': 'Создать новую ТТН',
    'dash.track_btn': 'Отследить посылку',
    'dash.recent': 'Последние отправления',
    'dash.all_ttn': 'Все ТТН →',
    'dash.total_30': 'Всего ТТН (30 дней)',
    'dash.in_transit': 'В пути',
    'dash.delivered': 'Доставлено',
    'dash.other': 'Другие',
    'dash.no_shipments': 'Нет отправлений',
    'dash.create_first': 'Создайте первую ТТН',
    'dash.error': 'Ошибка',
    'dash.col_ttn': '№ ТТН',
    'dash.col_date': 'Дата',
    'dash.col_recipient': 'Получатель',
    'dash.col_cost': 'Стоимость, грн',
    'dash.col_status': 'Статус',

    'track.title': 'Трекинг посылки',
    'track.subtitle': 'Отслеживайте статус вашей посылки по номеру ТТН',
    'track.search_title': 'Поиск по номеру ТТН',
    'track.placeholder': 'Введите номер ТТН (напр. 20450000000000)',
    'track.btn': 'Отследить',
    'track.hint': 'Введите 14-значный номер ТТН',
    'track.history_title': 'История поиска',
    'track.clear': 'Очистить',
    'track.history_empty': 'История поиска пуста',
    'track.searching': 'Поиск...',
    'track.not_found': 'Ничего не найдено',
    'track.check_number': 'Проверьте правильность номера ТТН',
    'track.error': 'Ошибка',
    'track.status': 'Статус',
    'track.date_created': 'Дата создания',
    'track.sender': 'Отправитель',
    'track.recipient': 'Получатель',
    'track.weight': 'Вес',
    'track.delivery_cost': 'Стоимость доставки',
    'track.declared_price': 'Оценочная стоимость',
    'track.cod': 'Наложенный платеж',
    'track.scheduled_date': 'Дата доставки (план)',
    'track.received_date': 'Дата получения',
    'track.actual_date': 'Фактическая доставка',
    'track.last_update': 'Последнее обновление',
    'track.col_ttn': '№ ТТН',
    'track.col_status': 'Статус',
    'track.col_date': 'Дата поиска',
    'track.warn_enter': 'Введите номер ТТН',
    'track.warn_format': 'Неверный формат',
    'track.warn_format_msg': 'Номер ТТН должен содержать ровно 14 цифр (напр.: 20451234567890)',

    'docs.title': 'Мои ТТН',
    'docs.subtitle': 'Список созданных товарно-транспортных накладных',
    'docs.date_from': 'Дата от',
    'docs.date_to': 'Дата до',
    'docs.filter': 'Фильтровать',
    'docs.print_selected': 'Печать выбранных',
    'docs.loading': 'Загрузка документов...',
    'docs.loading2': 'Загрузка...',
    'docs.no_docs': 'Нет документов',
    'docs.no_docs_msg': 'За выбранный период ТТН не найдено',
    'docs.error': 'Ошибка загрузки',
    'docs.col_ttn': '№ ТТН',
    'docs.col_date': 'Дата',
    'docs.col_recipient': 'Получатель',
    'docs.col_city': 'Город',
    'docs.col_weight': 'Вес',
    'docs.col_cost': 'Стоимость',
    'docs.col_status': 'Статус',
    'docs.col_actions': 'Действия',
    'docs.total': 'Всего',
    'docs.prev': '← Предыдущая',
    'docs.next': 'Следующая →',
    'docs.warn_print': 'Выберите ТТН для печати',
    'docs.warn_too_many': 'Выбрано слишком много ТТН. Рекомендуется не более 30 за раз.',
    'docs.deleted': 'Удалено',
    'docs.delete_error': 'Ошибка удаления',
    'docs.confirm_delete': 'Удалить ТТН',

    'common.api_key_msg': 'и введите ваш API ключ Новой Почты',
}


def dict_to_js(d):
    lines = []
    for k, v in d.items():
        # escape single quotes inside values
        v_escaped = v.replace("'", "\\'")
        lines.append(f"    '{k}': '{v_escaped}'")
    return ',\n'.join(lines)


JS = """const translations = {{
  ua: {{
{ua}
  }},
  ru: {{
{ru}
  }}
}};

let currentLanguage = localStorage.getItem('language') || 'ua';

export function getLanguage() {{
  return currentLanguage;
}}

export function setLanguage(lang) {{
  if (translations[lang]) {{
    currentLanguage = lang;
    localStorage.setItem('language', lang);
    return true;
  }}
  return false;
}}

export function t(key) {{
  const dict = translations[currentLanguage];
  if (dict && dict[key] !== undefined) {{
    return dict[key];
  }}
  return key;
}}
""".format(ua=dict_to_js(UA), ru=dict_to_js(RU))

out_path = 'src/utils/i18n.js'
with open(out_path, 'w', encoding='utf-8') as f:
    f.write(JS)

print(f'Written {len(JS.splitlines())} lines to {out_path}')
print(f'UA keys: {len(UA)}, RU keys: {len(RU)}')
