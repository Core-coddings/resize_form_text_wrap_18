# Resizable Form & Tax Wrapping in List Labels

An Odoo 18 module that improves the user interface by allowing users to resize form components and display wrapped list column headers instead of truncated text.

## Features

- Resize the form sheet vertically.
- Resize the chatter panel width.
- Resize list row height.
- Wrap long list column headers.
- Preferences are stored per user in the browser.
- Works without affecting business data.

## Installation

1. Copy the module into your custom addons directory.
2. Update the Apps List.
3. Install **Resizable Form & Tax Wrapping in List Labels**.

## Usage

After installation:

- Drag the resize handle to adjust the chatter width.
- Drag the bottom edge of the form sheet to increase or decrease its height.
- Long list column headers automatically wrap onto multiple lines.
- Resize preferences are remembered for each user.

## Compatibility

- Odoo 18 Community

## Module Structure

```
resizable_form_tax_wrap/
├── models/
├── static/
│   ├── description/
│   └── src/
├── views/
├── __manifest__.py
└── README.md
```

## Author

**CoreCoddings**

## License

LGPL-3