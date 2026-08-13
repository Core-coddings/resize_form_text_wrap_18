{
    'name': 'Resizable Form & Lists',
    'version': '19.0.1.0.0',
    'category': 'Extra Tools',
    'summary': 'Drag to resize chatter, form height, list rows and embedded lists. Long column headers wrap instead of truncating.',

    'author': 'Core Codings',
    'maintainer': 'Core Codings',
    'company': 'Core Codings',
    'support': 'corecoddings@gmail.com',

    'license': 'LGPL-3',

    'description': """
Resizable Form & Lists
======================

Free for Odoo 19.0 - Community and Enterprise.

Four small things Odoo doesn't let you adjust, each given a drag handle
that remembers what you chose.

1. Resizable chatter
---------------------
When Odoo places the chatter beside the form, a drag handle on its left
edge lets you widen or narrow it. The form sheet expands to use the
space you free up. Your preferred width is remembered the next time
you open a form.

2. Expand the form vertically
------------------------------
A drag handle at the bottom of the form lets you expand the form so
embedded lists can display more rows directly.

3. Resizable list rows and wrapping headers
--------------------------------------------
Long column headers such as "Taxes", "Amount Untaxed" and "Discount Amt."
wrap onto multiple lines instead of being truncated with an ellipsis.

A drag grip in the corner of the header row lets you adjust the row
height, and the preference is remembered for next time.

4. Resizable embedded list height
----------------------------------
A drag strip along the bottom edge of one2many/many2many lists lets you
adjust the height of embedded lists such as Order Lines and Invoice Lines.

Behaviour
---------
* Preferences are stored locally in each user's browser.
* Each user can have their own preferred sizes.
* No database records are created for these preferences.
* The module does not override Odoo's own chatter positioning behaviour.
* The interface initially behaves like standard Odoo until resized.

Compatibility
-------------
Odoo 19.0, Community and Enterprise editions.

Depends only on the standard `web` and `mail` modules.

No changes are made to any data model. This is a pure front-end
JavaScript/SCSS addon.

Licensed under LGPL-3 and free to use, modify and redistribute.

Changelog
---------
19.0.1.0.0
  - Ported to Odoo 19.0.
  - Added resizable chatter.
  - Added form height resizing.
  - Added resizable list rows and wrapping headers.
  - Added resizable embedded list height.
""",

    'depends': ['mail', 'web'],

    'assets': {
        'web.assets_backend': [
            'resizable_form_tax_wrap/static/src/js/chatter_resizer.js',
            'resizable_form_tax_wrap/static/src/js/form_height_resizer.js',
            'resizable_form_tax_wrap/static/src/js/list_row_resizer.js',
            'resizable_form_tax_wrap/static/src/js/x2many_box_resizer.js',
            'resizable_form_tax_wrap/static/src/scss/chatter_resizer.scss',
            'resizable_form_tax_wrap/static/src/scss/form_height_resizer.scss',
            'resizable_form_tax_wrap/static/src/scss/list_row_resizer.scss',
            'resizable_form_tax_wrap/static/src/scss/x2many_box_resizer.scss',
        ],
    },

    'images': [
        'static/description/odoo_apps_banner_hd.gif',
    ],

    'installable': True,
    'application': False,
    'auto_install': False,
}