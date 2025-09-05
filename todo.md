# Chatbot API Integration into Superset Dashboard

This document outlines the steps that were taken to integrate the external chatbot API from `http://mojan.rystadenergy.com:8004` as a custom widget in Apache Superset dashboards.

## COMPLETED TASKS

### 1. Backend: Created a Secure API Proxy

A new API endpoint was created within Superset to act as a secure proxy. This prevents exposing any credentials to the frontend.

- **File Created:** `superset/views/chatbot/chatbot_api.py`
- **API Registered:** The API was registered in `superset/views/__init__.py`.

### 2. Configuration: Set API Credentials

The external API URL and secret keys were stored securely in the Superset configuration.

- **File Modified:** `docker/pythonpath_dev/superset_config.py`
- **Configuration Added:** `CHATBOT_API_URL` and `CHATBOT_API_KEY` were added.

### 3. Frontend: Built the Chatbot Widget

A new React component was built to serve as the user-facing chat interface.

- **Plugin Created:** `superset-frontend/plugins/plugin-chart-chatbot/`
- **Widget Component:** `superset-frontend/plugins/plugin-chart-chatbot/src/ChatbotWidget.tsx` was created.
- **Dynamic Plugin Loader:** `superset-frontend/src/components/DynamicPlugins/ChatbotPlugin.ts` was created to load the plugin.

### 4. Frontend: Registered the Chatbot as a Visualization

The chatbot was registered as a new visualization type to make it available in the explore view.

- **Viz Type Gallery:** Modified `superset-frontend/src/explore/components/controls/VizTypeControl/VizTypeGallery.tsx` to include the new chart type.
- **Preset:** Modified `superset-frontend/src/visualizations/presets/MainPreset.js` to include the chatbot plugin.

### 5. Frontend: Registered the Chatbot as a Dashboard Component

The chatbot widget was registered to be available in the dashboard's drag-and-drop editor.

- **Component Factory:** Modified `superset-frontend/src/dashboard/util/newComponentFactory.js`.
- **Component Types:** Modified `superset-frontend/src/dashboard/util/componentTypes.ts`.
- **Grid Components:** Modified `superset-frontend/src/dashboard/components/gridComponents/index.js`.