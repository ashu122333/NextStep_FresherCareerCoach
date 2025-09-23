"use client";
import React, { useState, useRef, useEffect } from 'react';
import { getChatbotResponse } from '@/actions/chatbot';
import ReactMarkdown from 'react-markdown';

// Custom components based on shadcn/ui principles and a dark theme
const Card = ({ children }) => (
  <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-lg p-6">
    {children}
  </div>
);

const Button = ({ children, onClick, disabled }) => (
  <button
    className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2
      ${disabled ? 'bg-gray-700 text-gray-500' : 'bg-indigo-600 text-white hover:bg-indigo-700'}
    `}
    onClick={onClick}
    disabled={disabled}
  >
    {children}
  </button>
);

const Input = ({ value, onChange, placeholder, onKeyDown }) => (
  <textarea
    className="flex min-h-[40px] w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
    rows="1"
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    onKeyDown={onKeyDown}
  />
);

const ChatPlaceholder = ({ children }) => (
  <div className="flex flex-col items-center justify-center p-4">
    {children}
  </div>
);

const MemoizedReactMarkdown = React.memo(ReactMarkdown, (prevProps, nextProps) => prevProps.children === nextProps.children);

const components = {
  h1: ({ node, ...props }) => <h1 className="text-2xl font-bold mb-2 text-gray-100" {...props} />,
  h2: ({ node, ...props }) => <h2 className="text-xl font-semibold mb-2 text-gray-100" {...props} />,
  h3: ({ node, ...props }) => <h3 className="text-lg font-semibold mb-1 text-gray-100" {...props} />,
  p: ({ node, ...props }) => <p className="text-gray-300 mb-2" {...props} />,
  ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-2 pl-4 text-gray-300" {...props} />,
  ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-2 pl-4 text-gray-300" {...props} />,
  li: ({ node, ...props }) => <li className="mb-1" {...props} />,
  strong: ({ node, ...props }) => <strong className="font-bold text-white" {...props} />,
  a: ({ node, ...props }) => <a className="text-indigo-400 hover:underline" {...props} />,
};

const ChatMessage = ({ message, isUser }) => (
  <div className={`p-4 my-2 rounded-xl shadow-md max-w-[80%] ${isUser ? 'bg-indigo-600 text-white self-end' : 'bg-gray-800 text-gray-200 self-start'}`}>
    <MemoizedReactMarkdown components={components}>
      {message}
    </MemoizedReactMarkdown>
  </div>
);

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (input.trim() === '') return;

    const userMessage = input.trim();
    setMessages(prevMessages => [...prevMessages, { text: userMessage, isUser: true }]);
    setInput('');
    setIsLoading(true);

    try {
      const { getChatbotResponse } = await import('@/actions/chatbot');
      const aiResponse = await getChatbotResponse(userMessage);
      setMessages(prevMessages => [...prevMessages, { text: aiResponse, isUser: false }]);
    } catch (error) {
      console.error('Failed to get AI response:', error);
      setMessages(prevMessages => [...prevMessages, { text: "I'm sorry, I'm having trouble processing that right now. Please try again later.", isUser: false }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="bg-gray-950 flex flex-col h-screen antialiased text-gray-200">
      {/* Pathfinder Header */}
      <div className="flex-none p-4 bg-gray-900 border-b border-gray-800 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-indigo-500">Pathfinder AI</h1>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-400">{isLoading ? "Pathfinder is typing..." : "Online"}</span>
        </div>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <ChatPlaceholder>
            <p className="text-lg text-gray-500 text-center">Hello there! I'm Pathfinder, your personal AI Career Coach. How can I help you today?</p>
          </ChatPlaceholder>
        ) : (
          messages.map((message, index) => (
            <ChatMessage key={index} message={message.text} isUser={message.isUser} />
          ))
        )}
        {isLoading && (
          <div className="flex items-center justify-center p-4">
            <div className="w-4 h-4 bg-gray-400 rounded-full animate-bounce mx-1"></div>
            <div className="w-4 h-4 bg-gray-400 rounded-full animate-bounce mx-1 delay-150"></div>
            <div className="w-4 h-4 bg-gray-400 rounded-full animate-bounce mx-1 delay-300"></div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="flex-none p-4 bg-gray-900 border-t border-gray-800">
        <div className="flex items-center space-x-4">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Pathfinder anything..."
          />
          <Button onClick={handleSendMessage} disabled={input.trim() === '' || isLoading}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </Button>
        </div>
      </div>
    </div>
  );
}
