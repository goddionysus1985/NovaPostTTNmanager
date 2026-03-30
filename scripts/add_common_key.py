# -*- coding: utf-8 -*-
"""Add missing common.api_key_msg key to i18n.js"""

with open('src/utils/i18n.js', encoding='utf-8') as f:
    content = f.read()

ua_add = "    'common.api_key_msg': 'та введіть ваш API ключ Нової Пошти',\n"
ru_add = "    'common.api_key_msg': 'и введите ваш API ключ Новой Почты',\n"

if 'common.api_key_msg' in content:
    print('Key already exists, skipping.')
else:
    split = '  },\n  ru:'
    idx = content.find(split)
    if idx == -1:
        print('ERROR: UA end not found')
    else:
        content = content[:idx] + ua_add + content[idx:]
        split2 = '  }\n};'
        idx2 = content.rfind(split2)
        if idx2 == -1:
            print('ERROR: RU end not found')
        else:
            content = content[:idx2] + ru_add + content[idx2:]
        with open('src/utils/i18n.js', 'w', encoding='utf-8') as f:
            f.write(content)
        print('Done: common.api_key_msg added to both UA and RU')
