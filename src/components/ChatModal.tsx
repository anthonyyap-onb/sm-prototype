'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { useCart } from '@/context/CartContext';
import type { Product, Store } from '@/types';

function InlineMarkdown({ text }: { text: string }) {
  const tokenRegex = /(\*\*.*?\*\*|`.*?`|\*.*?\*)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let i = 0;

  while ((match = tokenRegex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    const token = match[0];
    if (token.startsWith('**')) {
      parts.push(<strong key={i++}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith('`')) {
      parts.push(
        <code key={i++} className="bg-gray-100 px-0.5 rounded text-xs font-mono">
          {token.slice(1, -1)}
        </code>
      );
    } else {
      parts.push(<em key={i++}>{token.slice(1, -1)}</em>);
    }
    lastIndex = match.index + token.length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return <>{parts}</>;
}

function MarkdownContent({ text }: { text: string }) {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  const listItems: string[] = [];
  let listType: 'ol' | 'ul' | null = null;
  let elemKey = 0;

  const flushList = () => {
    if (!listType || listItems.length === 0) return;
    const Tag = listType === 'ol' ? 'ol' : 'ul';
    elements.push(
      <Tag
        key={elemKey++}
        className={`${listType === 'ol' ? 'list-decimal' : 'list-disc'} list-inside space-y-0.5 my-1`}
      >
        {listItems.map((item, idx) => (
          <li key={idx}>
            <InlineMarkdown text={item} />
          </li>
        ))}
      </Tag>
    );
    listItems.length = 0;
    listType = null;
  };

  lines.forEach((line, i) => {
    const numberedMatch = line.match(/^\d+\.\s+(.*)/);
    const bulletMatch = line.match(/^[-*]\s+(.*)/);

    if (numberedMatch) {
      if (listType === 'ul') flushList();
      listType = 'ol';
      listItems.push(numberedMatch[1]);
    } else if (bulletMatch) {
      if (listType === 'ol') flushList();
      listType = 'ul';
      listItems.push(bulletMatch[1]);
    } else {
      flushList();
      if (line.trim() === '') {
        if (elements.length > 0 && i < lines.length - 1) {
          elements.push(<div key={elemKey++} className="h-1" />);
        }
      } else {
        elements.push(
          <p key={elemKey++}>
            <InlineMarkdown text={line} />
          </p>
        );
      }
    }
  });
  flushList();

  return <div className="space-y-0.5">{elements}</div>;
}

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLocation?: string;
  inventoryData: Product[];
  onStoreChange: (storeId: string) => void;
  storesData: Store[];
}

const SUGGESTION_CHIPS = [
  'Ingredients for Sinigang',
  'Check chicken nugget stock',
  'What can I cook today?',
];

const BOT_AVATAR =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDOPltKPtKkftDwK_WwaDIvGFqOb4ARXd90n8B-zAJnEDn7afcFzjMP2_A_fwRYvzq10TphZ7K0Og_3azR3gAwIFeZon4V18UoaQVm7Sfy024XYG3TAceQT8eRwT9ry1lgZY55x-4GOcbvrOlN0X420733DceHqxiBsKRQ4vdvftKMUIQSqaIYWjK-VFoUXpvZ-pidODBiPckQDMGsZg6RMEt9fHXQDwl-9E5zoI4P1jzoCOWWTkQx6Bw';

interface AddToCartArgs {
  productId?: string;
  productName: string;
  price?: number;
  imageUrl?: string;
  weight?: string;
  ingredientNumber?: number;
  quantity?: number;
  isAlternative?: boolean;
  originalIngredientName?: string;
}

export default function ChatModal({
  isOpen,
  onClose,
  selectedLocation,
  inventoryData,
  onStoreChange,
  storesData,
}: ChatModalProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState('');
  const { addToCart } = useCart();

  // Keep a ref to inventoryData so the onToolCall closure always sees the latest value
  const inventoryRef = useRef<Product[]>(inventoryData);
  useEffect(() => {
    inventoryRef.current = inventoryData;
  }, [inventoryData]);

  const onStoreChangeRef = useRef<(storeId: string) => void>(onStoreChange);
  useEffect(() => {
    onStoreChangeRef.current = onStoreChange;
  }, [onStoreChange]);

  // When the store is changed externally (via the dropdown), inject a synthetic
  // assistant message so the LLM's conversation history reflects the change.
  const isInitialMountRef = useRef(true);
  useEffect(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return;
    }
    if (!selectedLocation || selectedLocation.includes('undefined')) return;

    if (llmTriggeredStoreChangeRef.current) {
      llmTriggeredStoreChangeRef.current = false;
      return;
    }

    setMessages((prev) => [
      ...prev,
      {
        id: `store-change-${Date.now()}`,
        role: 'assistant' as const,
        parts: [
          {
            type: 'text' as const,
            text: `📍 Store updated to **${selectedLocation}**. I can now help you find products at this branch!`,
          },
        ],
      },
    ]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLocation]);

  // addToolOutput ref — populated after useChat initialises so onToolCall can call it
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const addToolOutputRef = useRef<((...args: any[]) => void) | null>(null);

  // Tracks whether the most recent store change was triggered by the LLM tool.
  // If true, the useEffect below skips injecting a notification (LLM already knows).
  const llmTriggeredStoreChangeRef = useRef(false);

  const { messages, sendMessage, status, addToolOutput, setMessages } = useChat({
    messages: [
      {
        id: 'welcome-message',
        role: 'assistant',
        parts: [
          {
            type: 'text',
            text: 'Hello! I am your SM Markets Assistant. Ask me about products, recipes, or item availability at your chosen branch!',
          },
        ],
      },
    ],
    onToolCall: ({ toolCall }) => {
      if (toolCall.toolName === 'setStoreLocation') {
        const args = toolCall.input as { storeId: string; storeName: string };
        llmTriggeredStoreChangeRef.current = true;
        onStoreChangeRef.current(args.storeId);
        addToolOutputRef.current?.({
          tool: 'setStoreLocation',
          toolCallId: toolCall.toolCallId,
          output: { success: true, message: `Store set to ${args.storeName}.` },
        });
        return;
      }

      if (toolCall.toolName !== 'addToCart') return;

      const args = toolCall.input as AddToCartArgs;
      const qty = args.quantity ?? 1;
      let output: { success: boolean; message: string };

      if (args.productId) {
        const matched = inventoryRef.current.find((p) => p.id === args.productId);
        if (matched) {
          for (let i = 0; i < qty; i++) addToCart(matched);
          output = { success: true, message: `Added ${matched.name} × ${qty} to cart.` };
        } else {
          // productId provided but not found in current inventory — fall through
          output = {
            success: false,
            message: `Product ID ${args.productId} not found in current store inventory.`,
          };
        }
      } else if (args.price !== undefined) {
        // No product ID but we have enough info to create a synthetic product
        const syntheticProduct: Product = {
          id: `llm-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          name: args.productName,
          imageUrl: args.imageUrl ?? '',
          weight: args.weight ?? '',
          price: args.price,
        };
        for (let i = 0; i < qty; i++) addToCart(syntheticProduct);
        output = { success: true, message: `Added ${args.productName} × ${qty} to cart.` };
      } else {
        output = {
          success: false,
          message: `Could not add ${args.productName} to cart — no inventory match found. Please select it manually from the store page.`,
        };
      }

      addToolOutputRef.current?.({
        tool: 'addToCart',
        toolCallId: toolCall.toolCallId,
        output,
      });
    },
  });

  // Keep addToolOutputRef in sync so the onToolCall closure always has the latest function
  addToolOutputRef.current = addToolOutput as typeof addToolOutputRef.current;

  const isLoading = status === 'submitted' || status === 'streaming';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen) textareaRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend ?? input.trim();
    if (!text || isLoading) return;

    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = '40px';
    }

    await sendMessage(
      { text },
      {
        body: {
          storeLocation: selectedLocation,
          inventoryData: inventoryData,
          storesData: storesData,
        },
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = '40px';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 128)}px`;
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Chat Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="SM Markets Assistant"
        className={`fixed top-0 right-0 w-full max-w-md h-full bg-white shadow-2xl z-50 flex flex-col border-l border-[var(--color-border-subtle)] transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="bg-[var(--color-primary)] text-white p-4 flex justify-between items-center shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-primary relative shrink-0">
              <img
                src={BOT_AVATAR}
                alt="SM Markets Assistant Mascot"
                className="w-full h-full rounded-full object-cover"
              />
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
            </div>
            <div>
              <h2 className="text-lg font-bold leading-tight">SM Markets Assistant</h2>
              <span className="text-xs text-[var(--color-primary-fixed-dim)]">
                Online • Powered by Gemini
              </span>
            </div>
          </div>
          <button
            id="chat-close-btn"
            aria-label="Close chat"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto p-4 bg-[var(--color-surface)] flex flex-col gap-4">
          <div className="text-center">
            <span className="text-[10px] text-[var(--color-on-surface-variant)] font-bold uppercase tracking-wider bg-[var(--color-surface-container-high)] px-2 py-1 rounded-full">
              Today
            </span>
          </div>

          {messages.map((m, index) => {
            const isAssistant = m.role === 'assistant';

            return (
              <div key={m.id ?? index} className="flex flex-col gap-2">
                {m.parts?.map((part, partIdx) => {
                  // Text parts
                  if (part.type === 'text') {
                    return (
                      <div
                        key={partIdx}
                        className={`flex gap-2 max-w-[85%] ${
                          isAssistant ? 'self-start' : 'self-end flex-row-reverse'
                        }`}
                      >
                        {isAssistant && (
                          <div className="w-8 h-8 rounded-full bg-[var(--color-primary-fixed)] flex items-center justify-center shrink-0">
                            <img
                              src={BOT_AVATAR}
                              alt="SM Markets Assistant Mascot"
                              className="w-full h-full rounded-full object-cover"
                            />
                          </div>
                        )}
                        <div
                          className={`p-3 rounded-2xl shadow-sm text-sm ${
                            isAssistant
                              ? 'bg-white rounded-tl-none border border-[var(--color-border-subtle)] text-[var(--color-on-surface)]'
                              : 'bg-[var(--color-primary)] text-white rounded-tr-none'
                          }`}
                        >
                          {isAssistant ? (
                            <MarkdownContent text={part.text} />
                          ) : (
                            <p className="whitespace-pre-wrap">{part.text}</p>
                          )}
                        </div>
                      </div>
                    );
                  }

                  // Tool invocation parts — type is 'tool-addToCart' in AI SDK v7
                  if (part.type === 'tool-setStoreLocation') {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const toolPart = part as any;
                    const isPending =
                      toolPart.state === 'input-streaming' ||
                      toolPart.state === 'input-available';
                    const isSuccess =
                      toolPart.state === 'output-available' &&
                      toolPart.output?.success === true;

                    return (
                      <div key={partIdx} className="self-start max-w-[85%] pl-10">
                        <div
                          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border ${
                            isPending
                              ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
                              : isSuccess
                              ? 'bg-blue-50 border-blue-200 text-blue-800'
                              : 'bg-gray-50 border-gray-200 text-gray-600'
                          }`}
                        >
                          <span className="material-symbols-outlined text-sm">location_on</span>
                          <span>
                            {isPending
                              ? 'Setting store location…'
                              : toolPart.output?.message ?? 'Store location updated'}
                          </span>
                        </div>
                      </div>
                    );
                  }

                  if (part.type === 'tool-addToCart') {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const toolPart = part as any;
                    const isPending =
                      toolPart.state === 'input-streaming' ||
                      toolPart.state === 'input-available';
                    const isSuccess =
                      toolPart.state === 'output-available' &&
                      toolPart.output?.success === true;
                    const isError =
                      toolPart.state === 'output-available' &&
                      toolPart.output?.success === false;

                    const args = toolPart.input as AddToCartArgs | undefined;
                    const output = toolPart.output as
                      | { success: boolean; message: string }
                      | undefined;

                    return (
                      <div key={partIdx} className="self-start max-w-[85%] pl-10">
                        <div
                          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border ${
                            isPending
                              ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
                              : isSuccess
                              ? 'bg-green-50 border-green-200 text-green-800'
                              : isError
                              ? 'bg-red-50 border-red-200 text-red-800'
                              : 'bg-gray-50 border-gray-200 text-gray-600'
                          }`}
                        >
                          <span className="material-symbols-outlined text-sm">
                            {isPending
                              ? 'shopping_cart'
                              : isSuccess
                              ? 'check_circle'
                              : 'error'}
                          </span>
                          <span>
                            {isPending
                              ? `Adding ${args?.productName ?? 'item'}${
                                  args?.quantity && args.quantity > 1
                                    ? ` × ${args.quantity}`
                                    : ''
                                } to cart…`
                              : output?.message ?? 'Cart updated'}
                          </span>
                        </div>
                      </div>
                    );
                  }

                  return null;
                })}

                {/* Suggestion chips under the initial greeting */}
                {index === 0 && isAssistant && (
                  <div className="flex gap-2 max-w-[85%] self-start pl-10 flex-wrap mt-1">
                    {SUGGESTION_CHIPS.map((chip) => (
                      <button
                        key={chip}
                        onClick={() => handleSend(chip)}
                        className="text-xs bg-white border border-[var(--color-primary)] text-[var(--color-primary)] px-3 py-1.5 rounded-full hover:bg-[var(--color-primary)] hover:text-white transition-colors font-medium"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isLoading && (
            <div className="flex gap-2 max-w-[85%] self-start">
              <div className="w-8 h-8 rounded-full bg-[var(--color-primary-fixed)] flex items-center justify-center shrink-0">
                <img
                  src={BOT_AVATAR}
                  alt="SM Markets Assistant Mascot"
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
              <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm border border-[var(--color-border-subtle)] flex items-center gap-1 h-10 w-16">
                {[0, 0.15, 0.3].map((delay, i) => (
                  <div
                    key={i}
                    className="w-2 h-2 bg-[var(--color-primary)]/40 rounded-full animate-bounce"
                    style={{ animationDelay: `${delay}s` }}
                  />
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Box */}
        <div className="bg-white p-3 border-t border-[var(--color-border-subtle)] shrink-0">
          <div className="flex items-end gap-2 bg-[var(--color-surface-container-low)] rounded-xl border border-[var(--color-outline-variant)] focus-within:border-[var(--color-primary)] focus-within:ring-1 focus-within:ring-[var(--color-primary)] p-1 transition-all">
            <button
              type="button"
              className="p-2 text-[var(--color-outline)] hover:text-[var(--color-primary)] transition-colors shrink-0 rounded-full hover:bg-[var(--color-surface-variant)]"
              aria-label="Attach file"
            >
              <span className="material-symbols-outlined">attach_file</span>
            </button>
            <textarea
              ref={textareaRef}
              id="chat-input"
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              className="w-full bg-transparent border-none focus:outline-none focus:ring-0 resize-none text-sm py-2 px-1 max-h-32 text-[var(--color-on-surface)]"
              placeholder="Type your message..."
              rows={1}
              style={{ minHeight: '40px' }}
            />
            <button
              id="chat-send-btn"
              type="button"
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className="p-2 bg-[var(--color-primary)] text-white rounded-full hover:bg-[var(--color-primary-container)] disabled:opacity-50 transition-colors shrink-0 mb-0.5 mr-0.5 flex items-center justify-center"
              aria-label="Send message"
            >
              <span className="material-symbols-outlined text-sm">send</span>
            </button>
          </div>
          <div className="text-center mt-2">
            <span className="text-[10px] text-[var(--color-outline)]">
              Powered by Gemini
            </span>
          </div>
        </div>
      </div>
    </>
  );
}