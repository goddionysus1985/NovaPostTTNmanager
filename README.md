# 📦 Nova Post TTN Manager

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=flat&logo=javascript&logoColor=%23F7DF1E)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

A modern, fast, and secure Single Page Application (SPA) for managing Nova Poshta shipments. Effortlessly create waybills (TTN), track parcels, and manage your shipping documents in one place.

---

## ✨ Features

- **🚀 TTN Creation**: Quickly generate Nova Poshta waybills with support for multiple seats, cargo types, and delivery options.
- **📍 Interactive Maps**: Integrated Leaflet maps for easy warehouse selection.
- **🔍 Real-time Tracking**: Monitor the status of your shipments directly from the dashboard.
- **📂 Document History**: A centralized view of all your generated documents for easy management.
- **🛡️ Security First**: Built-in XSS protection using custom template literals and strict HTML escaping.
- **📱 Responsive UI**: Beautifully designed interface that works across devices.
- **⚡ Fast Performance**: Powered by Vite for near-instant load times and a smooth SPA experience.

## 🛠️ Tech Stack

*   **Core**: Vanilla JavaScript (ES Modules)
*   **Build Tool**: [Vite](https://vitejs.dev/)
*   **Maps**: [Leaflet.js](https://leafletjs.com/)
*   **API**: [Nova Poshta API v2.0](https://developers.novaposhta.ua/)

## 🚀 Getting Started

### Prerequisites

*   [Node.js](https://nodejs.org/) (Latest LTS recommended)
*   Nova Poshta API Key (Register at [Nova Poshta Developers](https://developers.novaposhta.ua/))

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/goddionysus1985/NovaPostTTNmanager.git
    cd NovaPostTTNmanager
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Start development server:**
    ```bash
    npm run dev
    ```

4.  **Build for production:**
    ```bash
    npm run build
    ```

## ⚙️ Configuration

1. Launch the application.
2. Navigate to the **Settings** section.
3. Enter your **Nova Poshta API Key**.
4. Save settings and you're ready to go!

## 🧪 Testing

The project includes security tests to ensure payload integrity:
```bash
node test_security.js
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
*Created by [goddionysus1985](https://github.com/goddionysus1985)*
