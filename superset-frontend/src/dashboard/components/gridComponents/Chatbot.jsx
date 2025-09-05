import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { SupersetClient, styled } from '@superset-ui/core';
import Icons from 'src/components/Icons';
import WithPopoverMenu from 'src/dashboard/components/menu/WithPopoverMenu';
import HoverMenu from 'src/dashboard/components/menu/HoverMenu';
import DragHandle from 'src/dashboard/components/dnd/DragHandle';
import DeleteComponentButton from 'src/dashboard/components/DeleteComponentButton';
import ResizableContainer from 'src/dashboard/components/resizable/ResizableContainer';

const WidgetContainer = styled.div`
  padding: 16px;
  border: 1px solid #ccc;
  border-radius: 4px;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
`;

const MessageHistory = styled.div`
  flex-grow: 1;
  overflow-y: auto;
  margin-bottom: 16px;
`;

const Input = styled.input`
  width: 100%;
  padding: 8px;
`;

const Chatbot = ({ id, parentId, component, editMode, deleteComponent }) => {
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState([]);

  const handleSend = useCallback(async () => {
    if (!message.trim()) return;

    const newHistory = [...history, { user: 'You', text: message }];
    setHistory(newHistory);
    setMessage('');

    try {
      const response = await SupersetClient.post({
        endpoint: '/api/v1/chatbot/',
        jsonPayload: {
          session_id: 'superset-session', // or generate per user
          msg: message,
          document_source: 'analytics',
          skip_answer: false,
        },
      });

      console.log(response.json);
      const botMessage =
        response.json.chat_msg?.odin_msg?.content || 'No response';
      setHistory([...newHistory, { user: 'Bot', text: botMessage }]);
    } catch (error) {
      const errorMessage = `Error: ${error.message || 'Failed to fetch response.'}`;
      setHistory([...newHistory, { user: 'Bot', text: errorMessage }]);
    }
  }, [message, history]);

  return (
    <ResizableContainer
      id={id}
      adjustableWidth
      adjustableHeight
      widthMultiple={component.meta.width}
      heightMultiple={component.meta.height}
      editMode={editMode}
    >
      <WithPopoverMenu
        editMode={editMode}
        menuItems={[
          <DeleteComponentButton
            key="delete"
            onDelete={() => deleteComponent(id, parentId)}
          />,
        ]}
      >
        {editMode && (
          <HoverMenu position="top">
            <DragHandle position="top" />
            <DeleteComponentButton
              onDelete={() => deleteComponent(id, parentId)}
            />
            <Icons.Cog iconSize="xl" />
          </HoverMenu>
        )}
        <WidgetContainer>
          <MessageHistory>
            {history.map((msg, index) => (
              <div key={index}>
                <strong>{msg.user}:</strong> {msg.text}
              </div>
            ))}
          </MessageHistory>
          <Input
            type="text"
            value={message}
            onChange={e => setMessage(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleSend()}
            placeholder="Type your message..."
          />
        </WidgetContainer>
      </WithPopoverMenu>
    </ResizableContainer>
  );
};

Chatbot.propTypes = {
  id: PropTypes.string.isRequired,
  parentId: PropTypes.string.isRequired,
  component: PropTypes.object.isRequired,
  editMode: PropTypes.bool.isRequired,
  deleteComponent: PropTypes.func.isRequired,
};

export default Chatbot;
