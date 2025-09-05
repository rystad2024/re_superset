import { t } from '@superset-ui/core';

import { CHATBOT_WIDGET_TYPE } from '../../../util/componentTypes';
import { NEW_CHATBOT_ID } from '../../../util/constants';
import DraggableNewComponent from './DraggableNewComponent';

export default function DraggableNewChatBot() {
  return (
    <DraggableNewComponent
      id={NEW_CHATBOT_ID}
      type={CHATBOT_WIDGET_TYPE}
      label={t('Chatbot')}
      className="fa fa-robot"
    />
  );
}
