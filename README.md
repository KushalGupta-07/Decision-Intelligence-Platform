# Decision-Intelligence-Platform

## Overview

Decision-Intelligence-Platform is a browser-based web application designed for civic and urban analytics. The platform simulates smart city operations with a focus on mobility, energy, safety, citizen satisfaction, and environmental metrics.

The interface includes:
- executive dashboard analytics
- predictive scenario simulation
- AI civic assistant chat
- automation and anomaly orchestration
- data explorer for document-driven insights

## Features

- Responsive executive dashboard with mobility, air quality, energy, safety, and citizen satisfaction KPIs.
- Interactive scenario simulator for testing policy changes and city planning decisions.
- AI-powered chat assistant for civic analytics and decision support.
- Automation hub for handling alerts, anomalies, and playbooks.
- Data explorer / RAG-style document center for exploring policy and planning documents.
- Theme support, live metrics, and dynamic scenario status updates.

## Built With

- Vite
- HTML, CSS, JavaScript
- Chart.js
- Font Awesome

## Installation

1. Install dependencies:

```bash
npm install
```

2. Run the development server:

```bash
npm run dev
```

3. Open the app in your browser at the local URL shown by Vite.

## Project Structure

- `index.html` — landing page and app shell
- `style.css` — global styling and layout
- `src/` — application logic and UI modules
  - `main.js` — app initialization, navigation, and event wiring
  - `charts.js` — chart setup and updates
  - `simulator.js` — decision modeling and metrics simulation
  - `ai.js` — chat assistant query handling
  - `automation.js` — anomaly and automation workflows
  - `data.js` — document data source
- `package.json` — project metadata and scripts

## Notes

This is a frontend-focused demo platform. The current implementation is built for local exploration and visualization, using static data and client-side simulation logic.
