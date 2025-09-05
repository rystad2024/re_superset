import { ControlPanelConfig } from '@superset-ui/chart-controls';
import { t } from '@superset-ui/core';

const controlPanel: ControlPanelConfig = {
  controlPanelSections: [
    // Remove sections.legacyRegularTime since it doesn't exist
    {
      label: t('Chatbot Configuration'),
      expanded: true,
      controlSetRows: [
        [
          {
            name: 'chatbot_title',
            config: {
              type: 'TextControl',
              label: t('Chatbot Title'),
              description: t('The title displayed at the top of the chatbot widget'),
              default: 'AI Assistant',
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'welcome_message',
            config: {
              type: 'TextAreaControl',
              label: t('Welcome Message'),
              description: t('Initial message shown to users'),
              default: 'Hello! I\'m your AI assistant. How can I help you today?',
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'height',
            config: {
              type: 'SliderControl',
              label: t('Height'),
              description: t('Height of the chatbot widget'),
              min: 300,
              max: 800,
              default: 400,
              step: 50,
              renderTrigger: true,
            },
          },
        ],
      ],
    },
  ],
  // Remove data source requirements since we don't need them
  controlOverrides: {
    row_limit: {
      default: 1,
      hidden: true,
    },
    order_desc: {
      hidden: true,
    },
  },
};

export default controlPanel;