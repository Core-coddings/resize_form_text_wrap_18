{
    'name': 'Resizable Form & Tax Wrapping in List Labels',
    'version': '18.0.2.1.0',
    'category': 'Extra Tools',
    'summary': 'Free. Drag to resize chatter, form height, list rows and embedded lists. Long column headers wrap instead of truncating.',

    'author': 'Core Codings',
    'maintainer': 'Core Codings',
    'company': 'Core Codings',
    'website': '',
    'support': 'corecoddings@gmail.com',

    # Free module. LGPL-3 is the correct license for a free Odoo Apps
    # listing: Odoo's proprietary license states the software may only
    # be used if a license was purchased, which contradicts a free
    # listing. Deliberately no 'price' or 'currency' keys - their
    # absence is what makes the listing free.
    'license': 'LGPL-3',

    'description': """
Resizable Form & Tax Wrapping in List Labels
=============================================

Free for Odoo 18.0 - Community and Enterprise.

Four small things Odoo doesn't let you adjust, each given a drag handle
that remembers what you chose.

1. Resizable chatter
---------------------
When Odoo places the chatter beside the form (its own decision, based on
window size and zoom - left untouched by this module), a drag handle on
its left edge lets you widen or narrow it. The form sheet expands to use
the space you free up. Your preferred width is remembered the next time
you open a form. If the window is too narrow and Odoo drops the chatter
below the form instead, the chatter reverts to full-width standard Odoo
behaviour with no styling from this module applied at all.

2. Expand the form vertically
------------------------------
Odoo's app shell normally clips form content to exactly the browser
window's height, with a small internal scrollbar for anything past the
fold. A drag handle at the bottom of the form lets you expand it so
embedded lists (e.g. order lines) show all their rows directly - the
browser's own scrollbar takes over instead, the same trade-off Odoo
itself already makes on mobile-width screens. Leaving the form restores
the shell to stock behaviour so other views are unaffected.

3. Resizable list rows and wrapping headers
--------------------------------------------
Long column headers ("Taxes", "Amount Untaxed", "Discount Amt.") no
longer get cut off with an ellipsis - they wrap onto multiple lines
instead. A small drag grip in the corner of the header row lets you
compact rows tighter than Odoo's default or make them roomier, which is
remembered for next time.

4. Resizable embedded list height
----------------------------------
A drag strip along the bottom edge of one2many/many2many lists (Order
Lines, Invoice Lines, etc.) sets how tall the list box is, remembered
per model and per field so each list keeps its own size.

Behaviour
---------
* All preferences are stored locally in each person's browser, so
  colleagues sharing a database each keep their own sizes.
* Stock padding and widths are measured at runtime, so a fresh install
  looks pixel-identical to standard Odoo until someone drags a handle.
* Odoo's own side-vs-bottom chatter decision is respected, never
  overridden.

Compatibility
-------------
Odoo 18.0, both Community and Enterprise editions. Depends only on the
standard `web` and `mail` modules - no Enterprise-only dependency, and
nothing that assumes an Enterprise theme.

No changes are made to any data model. This is a pure front-end
(JS/SCSS) addon, so it is safe to install and uninstall at any time,
and it leaves no records behind when removed.

Licensed under LGPL-3 and free to use, modify and redistribute.

Changelog
---------
18.0.2.1.0
  - Ported to Odoo 18.0. No API changes were required - the patch(),
    ref and renderer APIs used here are identical in 18.0 and 18.0.
    The chatter container selector was widened to cover the class names
    used across 18.x/19.x builds.
  - Fixed: narrowing the chatter left a blank gap instead of letting the
    form sheet expand into the reclaimed space, because Odoo caps the
    sheet with its own max-width. The cap is now lifted while (and only
    while) the chatter is at a manually chosen width.
  - Fixed: when the window or zoom narrowed enough for Odoo to move the
    chatter below the form, inline styles written during side mode
    stayed on the element and pinned the bottom chatter to a fixed width
    instead of spanning the full sheet. All inline styling is now
    reverted the moment side mode ends.
  - Fixed: the form-height expansion left `overflow: visible` on
    `.o_content` after navigating away from the form, breaking scrolling
    in the next view. The shell is now restored on unmount.
  - Fixed: drag handles could be duplicated when a renderer re-mounted
    onto a reused DOM node.
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

    # First entry is the listing thumbnail shown in App Store search
    # results - it must be the banner, not the icon.
    'images': ['static/description/banner.png'],

    'installable': True,
    'application': False,
    'auto_install': False,
}
