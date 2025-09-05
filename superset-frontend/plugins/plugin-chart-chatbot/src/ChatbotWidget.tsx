// // import React, { useState } from 'react';
// // import { styled, SupersetClient } from '@superset-ui/core';

// // const WidgetContainer = styled.div`
// //   padding: 16px;
// //   border: 1px solid #ccc;
// //   border-radius: 4px;
// //   height: 100%;
// //   display: flex;
// //   flex-direction: column;
// // `;

// // const MessageHistory = styled.div`
// //   flex-grow: 1;
// //   overflow-y: auto;
// //   margin-bottom: 16px;
// // `;

// // const Input = styled.input`
// //   width: 100%;
// //   padding: 8px;
// // `;

// // const ChatbotWidget = ({ width, height }: { width: number; height: number }) => {
// //   const [message, setMessage] = useState('');
// //   const [history, setHistory] = useState<{ user: string; text: string }[]>([]);

// //   const handleSend = async () => {
// //     if (!message.trim()) return;

// //     const newHistory = [...history, { user: 'You', text: message }];
// //     setHistory(newHistory);
// //     setMessage('');

// //     try {
// //       const response = await SupersetClient.post({
// //         endpoint: '/api/v1/chatbot',
// //         jsonPayload: { message },
// //       });

// //       const botMessage = response.json.response; // Adjust based on actual API response structure
// //       setHistory([...newHistory, { user: 'Bot', text: botMessage }]);
// //     } catch (error) {
// //       const errorMessage = `Error: ${error.message || 'Failed to fetch response.'}`;
// //       setHistory([...newHistory, { user: 'Bot', text: errorMessage }]);
// //     }
// //   };

// //   return (
// //     <WidgetContainer>
// //       <MessageHistory>
// //         {history.map((msg, index) => (
// //           <div key={index}>
// //             <strong>{msg.user}:</strong> {msg.text}
// //           </div>
// //         ))}
// //       </MessageHistory>
// //       <Input
// //         type="text"
// //         value={message}
// //         onChange={(e) => setMessage(e.target.value)}
// //         onKeyPress={(e) => e.key === 'Enter' && handleSend()}
// //         placeholder="Type your message..."
// //       />
// //     </WidgetContainer>
// //   );
// // };

// // export default ChatbotWidget;

// // superset-frontend/plugins/plugin-chart-chatbot/src/ChatbotWidget.tsx
// // superset-frontend/plugins/plugin-chart-chatbot/src/ChatbotWidget.tsx

// import React, { useState, useEffect, useRef } from 'react';
// import { styled } from '@superset-ui/core';

// const ChatbotContainer = styled.div`
//   display: flex;
//   flex-direction: column;
//   height: 100%;
//   min-height: 400px;
//   border: 1px solid #d9d9d9;
//   border-radius: 6px;
//   background: #fff;
//   font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB',
//     'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
// `;

// const ChatHeader = styled.div`
//   padding: 16px;
//   border-bottom: 1px solid #f0f0f0;
//   background: #fafafa;
//   border-radius: 6px 6px 0 0;
//   font-weight: 500;
// `;

// const ChatMessages = styled.div`
//   flex: 1;
//   padding: 16px;
//   overflow-y: auto;
//   display: flex;
//   flex-direction: column;
//   gap: 12px;
// `;

// const ChatInput = styled.div`
//   padding: 16px;
//   border-top: 1px solid #f0f0f0;
//   display: flex;
//   gap: 8px;
// `;

// const Input = styled.input`
//   flex: 1;
//   padding: 8px 12px;
//   border: 1px solid #d9d9d9;
//   border-radius: 4px;
//   outline: none;

//   &:focus {
//     border-color: #1890ff;
//     box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
//   }
// `;

// const Button = styled.button`
//   padding: 8px 16px;
//   background: #1890ff;
//   color: white;
//   border: none;
//   border-radius: 4px;
//   cursor: pointer;
//   font-weight: 500;

//   &:hover {
//     background: #40a9ff;
//   }

//   &:disabled {
//     background: #d9d9d9;
//     cursor: not-allowed;
//   }
// `;

// const Message = styled.div<{ isUser?: boolean }>`
//   max-width: 80%;
//   padding: 8px 12px;
//   border-radius: 12px;
//   ${props => props.isUser ? `
//     align-self: flex-end;
//     background: #1890ff;
//     color: white;
//   ` : `
//     align-self: flex-start;
//     background: #f6f6f6;
//     color: #000;
//   `}
// `;

// const ErrorMessage = styled.div`
//   padding: 16px;
//   background: #fff2f0;
//   border: 1px solid #ffccc7;
//   border-radius: 4px;
//   color: #a8071a;
//   text-align: center;
// `;

// const LoadingMessage = styled.div`
//   padding: 16px;
//   text-align: center;
//   color: #8c8c8c;
// `;

// interface ChatMessage {
//   id: string;
//   text: string;
//   isUser: boolean;
//   timestamp: Date;
// }

// interface ChatbotWidgetProps {
//   data?: any[];
//   config?: {
//     api_url?: string;
//     api_key_configured?: boolean;
//     widget_type?: string;
//   };
//   queriesData?: any[];
//   formData?: any;
//   height?: number;
//   width?: number;
// }

// export default function ChatbotWidget({
//   data = [],
//   config = {},
//   queriesData = [],
//   formData = {},
//   height = 400,
//   width
// }: ChatbotWidgetProps) {
//   const [messages, setMessages] = useState<ChatMessage[]>([]);
//   const [inputValue, setInputValue] = useState('');
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const messagesEndRef = useRef<HTMLDivElement>(null);

//   const scrollToBottom = () => {
//     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   };

//   useEffect(() => {
//     scrollToBottom();
//   }, [messages]);

//   useEffect(() => {
//     // Initialize with a welcome message
//     if (messages.length === 0) {
//       setMessages([{
//         id: 'welcome',
//         text: 'Hello! I\'m your AI assistant. How can I help you today?',
//         isUser: false,
//         timestamp: new Date()
//       }]);
//     }
//   }, []);

//   // Debug: Log the received props
//   useEffect(() => {
//     console.log('ChatbotWidget props:', {
//       data,
//       config,
//       queriesData,
//       formData
//     });
//   }, [data, config, queriesData, formData]);

//   const sendMessage = async () => {
//     if (!inputValue.trim() || isLoading) return;

//     const userMessage: ChatMessage = {
//       id: `user-${Date.now()}`,
//       text: inputValue.trim(),
//       isUser: true,
//       timestamp: new Date()
//     };

//     setMessages(prev => [...prev, userMessage]);
//     setInputValue('');
//     setIsLoading(true);
//     setError(null);

//     try {
//       // Check if API is configured
//       if (!config.api_url) {
//         throw new Error('Chatbot API URL is not configured');
//       }

//       // Here you would make your API call
//       // For now, we'll simulate a response
//       setTimeout(() => {
//         const botMessage: ChatMessage = {
//           id: `bot-${Date.now()}`,
//           text: `I received your message: "${userMessage.text}". This is a demo response. Please configure your API endpoint for real functionality.`,
//           isUser: false,
//           timestamp: new Date()
//         };

//         setMessages(prev => [...prev, botMessage]);
//         setIsLoading(false);
//       }, 1000);

//       // Uncomment and modify this for real API calls:
//       /*
//       const response = await fetch(config.api_url, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${config.api_key}` // if needed
//         },
//         body: JSON.stringify({
//           message: userMessage.text,
//           conversation_id: 'dashboard-chat' // or generate unique ID
//         })
//       });

//       if (!response.ok) {
//         throw new Error(`API error: ${response.statusText}`);
//       }

//       const result = await response.json();

//       const botMessage: ChatMessage = {
//         id: `bot-${Date.now()}`,
//         text: result.message || result.response || 'Sorry, I didn\'t understand that.',
//         isUser: false,
//         timestamp: new Date()
//       };

//       setMessages(prev => [...prev, botMessage]);
//       */
//     } catch (err) {
//       console.error('Chat error:', err);
//       setError(err instanceof Error ? err.message : 'An error occurred');

//       const errorMessage: ChatMessage = {
//         id: `error-${Date.now()}`,
//         text: 'Sorry, I\'m having trouble connecting right now. Please try again later.',
//         isUser: false,
//         timestamp: new Date()
//       };

//       setMessages(prev => [...prev, errorMessage]);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleKeyPress = (e: React.KeyboardEvent) => {
//     if (e.key === 'Enter' && !e.shiftKey) {
//       e.preventDefault();
//       sendMessage();
//     }
//   };

//   // Handle case where Superset shows "No results" error
//   if (queriesData && queriesData.length > 0) {
//     const queryData = queriesData[0];
//     if (queryData?.error || queryData?.status === 'failed') {
//       return (
//         <ChatbotContainer style={{ height }}>
//           <ErrorMessage>
//             <strong>Configuration Error:</strong><br />
//             {queryData.error || 'Failed to initialize chatbot widget'}
//             <br /><br />
//             <small>Check your ChatbotViz backend implementation and ensure it returns valid data.</small>
//           </ErrorMessage>
//         </ChatbotContainer>
//       );
//     }
//   }

//   return (
//     <ChatbotContainer style={{ height }}>
//       <ChatHeader>
//         {!config.api_key_configured && (
//           <small style={{ display: 'block', color: '#8c8c8c', fontWeight: 'normal', marginTop: '4px' }}>
//             Demo Mode - Configure API for full functionality
//           </small>
//         )}
//       </ChatHeader>

//       {error && (
//         <ErrorMessage>
//           {error}
//         </ErrorMessage>
//       )}

//       <ChatMessages>
//         {messages.map((message) => (
//           <Message key={message.id} isUser={message.isUser}>
//             {message.text}
//           </Message>
//         ))}

//         {isLoading && (
//           <LoadingMessage>
//             AI is typing...
//           </LoadingMessage>
//         )}

//         <div ref={messagesEndRef} />
//       </ChatMessages>

//       <ChatInput>
//         <Input
//           value={inputValue}
//           onChange={(e) => setInputValue(e.target.value)}
//           onKeyPress={handleKeyPress}
//           placeholder="Type your message..."
//           disabled={isLoading}
//         />
//         <Button onClick={sendMessage} disabled={isLoading || !inputValue.trim()}>
//           Send
//         </Button>
//       </ChatInput>
//     </ChatbotContainer>
//   );
// }


interface ChatbotWidgetProps {
  data?: any[];
  config?: { api_url?: string; api_key_configured?: boolean; widget_type?: string };
  width?: number;
  height?: number;
}

export default function ChatbotWidget({ data = [], config = {}, width = 400, height = 400 }: ChatbotWidgetProps) {
  return <div style={{ width, height }}>Hello Chatbot! Messages: {data.length}</div>;
}
