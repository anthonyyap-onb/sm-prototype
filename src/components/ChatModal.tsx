'use client';

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';
import { useStore } from '@/context/StoreContext';
import type { Product, Store } from '@/types';
import { usePromos } from '@/context/PromoContext';
import {
  handleChatToolCall,
  type AddToCartArgs,
  type ChatToolOutput,
} from '@/lib/tools/chatTools';
import { getPromoToolCards } from '@/lib/tools/promoToolPresentation';
import { shouldContinueAfterClientTools } from '@/lib/tools/chatContinuation';
import {
  appendToolCall,
  clearChatSession,
  CHAT_HISTORY_VERSION,
  formatRecentHistory,
  getInitialChatMessages,
  mergePersistedMessages,
  readChatSession,
  selectChatSessionForRetrieval,
  type StoredChatSession,
  writeChatSession,
} from '@/lib/chat/chatHistory';
import {
  scrollChatToLatest,
  shouldShowCheckoutSuggestionChips,
  shouldShowMessageSuggestionChips,
} from '@/lib/chat/chatPresentation';


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
  onStoreChange?: (storeId: string) => void;
  storesData?: Store[];
  pageContext?: 'shopping' | 'checkout';
}

const SHOPPING_SUGGESTION_CHIPS = [
  'Ingredients for Sinigang',
  'Check chicken nugget stock',
  'What can I cook today?',
];

const CHECKOUT_SUGGESTION_CHIPS = [
  'Show eligible promos',
  'Explain my order total',
  'Help with delivery',
];

const BOT_AVATAR =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDOPltKPtKkftDwK_WwaDIvGFqOb4ARXd90n8B-zAJnEDn7afcFzjMP2_A_fwRYvzq10TphZ7K0Og_3azR3gAwIFeZon4V18UoaQVm7Sfy024XYG3TAceQT8eRwT9ry1lgZY55x-4GOcbvrOlN0X420733DceHqxiBsKRQ4vdvftKMUIQSqaIYWjK-VFoUXpvZ-pidODBiPckQDMGsZg6RMEt9fHXQDwl-9E5zoI4P1jzoCOWWTkQx6Bw';

export default function ChatModal({
  isOpen,
  onClose,
  selectedLocation,
  inventoryData,
  onStoreChange,
  storesData,
  pageContext = 'shopping',
}: ChatModalProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState('');
  const [checkoutSuggestionsDismissed, setCheckoutSuggestionsDismissed] = useState(false);
  const { addToCart, totalItems, clearCart, removeItem, setItemQuantity, items } = useCart();
  const { evaluations, appliedPromos, applyPromos, totals } = usePromos();
  const router = useRouter();
  const isCheckout = pageContext === 'checkout';
  const getWelcomeText = (location?: string) =>
    isCheckout
      ? 'Hello! I am your SM Markets Assistant. I can help review your order, explain totals, delivery, and eligible promotions!'
      : location
      ? `Hello! I am your SM Markets Assistant. You're currently shopping at **${location}**. Ask me about products, recipes, or item availability!`
      : 'Hello! I am your SM Markets Assistant. Ask me about products, recipes, or item availability at your chosen branch!';
  const welcomeText = getWelcomeText(selectedLocation);
  // const suggestionChips = isCheckout ? CHECKOUT_SUGGESTION_CHIPS : SHOPPING_SUGGESTION_CHIPS;
  const { setSelectedStoreId } = useStore();

  // --- STT State ---
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // --- TTS State ---
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Sentence-level pipelining: fetch TTS for each sentence concurrently, play in order
  const sentenceQueueRef = useRef<Promise<string>[]>([]);
  const isPlayingQueueRef = useRef(false);
  const processedUpToRef = useRef(0);         // chars of current msg already queued
  const currentTTSMsgIdRef = useRef('welcome-message'); // skip the welcome greeting
  const ttsGenRef = useRef(0);               // incremented on stop to cancel in-flight audio
  const lastInputWasVoiceRef = useRef(false); // TTS only fires when user sent via mic
  const voiceSubmitPriorAssistantIdRef = useRef<string | null>(null); // last assistant msg ID at voice-submit time

  // Keep a ref to inventoryData so the onToolCall closure always sees the latest value
  const inventoryRef = useRef<Product[]>(inventoryData);
  useEffect(() => {
    inventoryRef.current = inventoryData;
  }, [inventoryData]);

  const onStoreChangeRef = useRef<(storeId: string) => void>(setSelectedStoreId);
  useEffect(() => {
    onStoreChangeRef.current = setSelectedStoreId;
  }, [setSelectedStoreId]);

  const promosRef = useRef({ evaluations, applyPromos });
  useLayoutEffect(() => {
    promosRef.current = { evaluations, applyPromos };
  }, [evaluations, applyPromos]);

  // addToolOutput ref — populated after useChat initialises so onToolCall can call it
  const addToolOutputRef = useRef<((output: ChatToolOutput) => void) | null>(null);
  const historySessionRef = useRef<StoredChatSession | null>(null);
  const historyHydratedRef = useRef(false);

  // Tracks whether the most recent store change was triggered by the LLM tool.
  // If true, the useEffect below skips injecting a notification (LLM already knows).
  const llmTriggeredStoreChangeRef = useRef(false);

  const { messages, sendMessage, status, addToolOutput, setMessages } = useChat({
    messages: [],
    sendAutomaticallyWhen: shouldContinueAfterClientTools,
    onToolCall: ({ toolCall }) => {
      const updatedSession = appendToolCall(historySessionRef.current ?? readChatSession(), {
        id: toolCall.toolCallId,
        tool: toolCall.toolName,
        arguments: toolCall.input,
        createdAt: new Date().toISOString(),
        pageContext,
      });
      historySessionRef.current = updatedSession;
      writeChatSession(updatedSession);

      if (toolCall.toolName === 'getRecentChatHistory') {
        const message = formatRecentHistory(
          selectChatSessionForRetrieval(historySessionRef.current, readChatSession),
          (toolCall.input as { limit?: unknown }).limit
        );
        addToolOutputRef.current?.({
          tool: 'getRecentChatHistory',
          toolCallId: toolCall.toolCallId,
          output: { success: true, message },
        });
        return;
      }

      handleChatToolCall(toolCall, {
        inventory: inventoryRef.current,
        addToCart,
        addToolOutput: (output) => addToolOutputRef.current?.(output),
        markStoreChangeAsToolTriggered: () => {
          llmTriggeredStoreChangeRef.current = true;
        },
        changeStore: (storeId) => onStoreChangeRef.current?.(storeId),
        clearCart: () => clearCartRef.current(),
        fetchPromos: () => promosRef.current.evaluations,
        applyPromos: (ids) => promosRef.current.applyPromos(ids),
        navigateToCheckout: () => router.push('/checkout'),
        removeItem,
        setItemQuantity,
      });
    },
  });

  // Keep addToolOutputRef in sync so the onToolCall closure always has the latest function
  const clearCartRef = useRef<() => void>(clearCart);
  useEffect(() => {
    clearCartRef.current = clearCart;
  }, [clearCart]);

  useEffect(() => {
    const session = readChatSession();
    historySessionRef.current = session;
    setMessages(getInitialChatMessages(session, welcomeText));
    historyHydratedRef.current = true;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!historyHydratedRef.current) return;
    const updatedSession = mergePersistedMessages(historySessionRef.current ?? readChatSession(), messages);
    historySessionRef.current = updatedSession;
    writeChatSession(updatedSession);
  }, [messages]);

  // When the store is changed externally (via the dropdown), inject a synthetic
  // assistant message so the LLM's conversation history reflects the change.
  const mountedLocationRef = useRef<string | undefined>(selectedLocation);
  const isInitialMountRef = useRef(true);
  useEffect(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      mountedLocationRef.current = selectedLocation;
      return;
    }
    if (!selectedLocation || selectedLocation.includes('undefined')) return;
    // Skip if the location hasn't actually changed, or if there was no prior location
    // (the latter guards against StoreContext hydrating from empty → stored value on mount)
    if (selectedLocation === mountedLocationRef.current) return;
    if (!mountedLocationRef.current) {
      mountedLocationRef.current = selectedLocation;
      return;
    }

    if (llmTriggeredStoreChangeRef.current) {
      llmTriggeredStoreChangeRef.current = false;
      mountedLocationRef.current = selectedLocation;
      return;
    }

    mountedLocationRef.current = selectedLocation;
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

  // Keep addToolOutputRef in sync so the onToolCall closure always has the latest function
  addToolOutputRef.current = addToolOutput as typeof addToolOutputRef.current;

  const isLoading = status === 'submitted' || status === 'streaming';

  const scrollToBottom = () => {
    scrollChatToLatest(isOpen, messagesEndRef.current);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, isOpen]);

  // Drains the sentence queue, playing each URL in order.
  // Stable across renders (only touches refs + setIsSpeaking).
  const drainQueue = useCallback(async () => {
    if (isPlayingQueueRef.current) return;
    isPlayingQueueRef.current = true;
    const gen = ttsGenRef.current;
    setIsSpeaking(true);

    while (sentenceQueueRef.current.length > 0) {
      if (ttsGenRef.current !== gen) break;
      const urlPromise = sentenceQueueRef.current.shift()!;
      try {
        const url = await urlPromise;
        if (ttsGenRef.current !== gen) { URL.revokeObjectURL(url); break; }
        await new Promise<void>((resolve) => {
          const audio = new Audio(url);
          audioRef.current = audio;
          audio.onended = () => { URL.revokeObjectURL(url); resolve(); };
          audio.onerror = () => { URL.revokeObjectURL(url); resolve(); };
          audio.play().catch(() => resolve());
        });
      } catch { /* skip bad sentence */ }
    }

    if (ttsGenRef.current === gen) {
      isPlayingQueueRef.current = false;
      setIsSpeaking(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fires during Gemini streaming AND after it completes.
  // Extracts complete sentences as they appear and immediately fires TTS fetch for each,
  // so audio for sentence 1 is often ready before sentence 2 is even generated.
  useEffect(() => {
    if (!isOpen) return;

    if (!lastInputWasVoiceRef.current) return;

    const last = [...messages].reverse().find((m) => m.role === 'assistant');
    if (!last) return;

    // Wait until the assistant reply that was generated after the voice submission
    if (last.id === voiceSubmitPriorAssistantIdRef.current) return;

    // New assistant message — reset pipeline
    if (last.id !== currentTTSMsgIdRef.current) {
      currentTTSMsgIdRef.current = last.id;
      processedUpToRef.current = 0;
      ttsGenRef.current++;
      sentenceQueueRef.current = [];
      isPlayingQueueRef.current = false;
    }

    const text = last.parts
      ?.filter((p) => p.type === 'text')
      .map((p) => (p as { type: 'text'; text: string }).text)
      .join('') ?? '';
    const unprocessed = text.slice(processedUpToRef.current);
    if (!unprocessed) return;

    const speakChunk = (chunk: string) =>
      fetch('/api/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: chunk }),
      })
        .then((r) => { if (!r.ok) throw new Error(); return r.blob(); })
        .then((b) => URL.createObjectURL(b));

    // Queue each complete sentence found in the new text.
    // (?<=\d)\.(?=\d) lets decimal points (e.g. ₱159.50) pass through without breaking the sentence.
    const sentenceRegex = /(?:[^.!?！？。]|(?<=\d)\.(?=\d))+[.!?！？。]+\s*/g;
    let match: RegExpExecArray | null;
    let consumed = 0;
    while ((match = sentenceRegex.exec(unprocessed)) !== null) {
      const sentence = match[0].trim();
      if (sentence.length >= 5) sentenceQueueRef.current.push(speakChunk(sentence));
      consumed = match.index + match[0].length;
    }
    processedUpToRef.current += consumed;

    // When streaming is done, flush any remaining text as a final chunk
    if (!isLoading) {
      const remaining = text.slice(processedUpToRef.current).trim();
      if (remaining.length >= 5) {
        sentenceQueueRef.current.push(speakChunk(remaining));
        processedUpToRef.current = text.length;
      }
    }

    if (sentenceQueueRef.current.length > 0) drainQueue();
  }, [isOpen, isLoading, messages, drainQueue]);

  const stopSpeaking = () => {
    ttsGenRef.current++;
    audioRef.current?.pause();
    audioRef.current = null;
    sentenceQueueRef.current = [];
    isPlayingQueueRef.current = false;
    setIsSpeaking(false);
  };

  useEffect(() => {
    if (isOpen) {
      textareaRef.current?.focus();
    } else {
      stopSpeaking();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

    if (isCheckout) setCheckoutSuggestionsDismissed(true);
    lastInputWasVoiceRef.current = false;
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
          cartItemCount: totalItems,
        },
      }
    );
  };

  const startRecording = async () => {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach((track) => track.stop());
        handleAudioSubmit(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Could not access the microphone. Please check your permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      const recorder = mediaRecorderRef.current;
      mediaRecorderRef.current = null;
      recorder.stop();
      setIsRecording(false);
    }
  };

  const handleAudioSubmit = async (audioBlob: Blob) => {
    if (isLoading) return;

    lastInputWasVoiceRef.current = true;
    voiceSubmitPriorAssistantIdRef.current =
      [...messages].reverse().find((m) => m.role === 'assistant')?.id ?? null;
    setIsTranscribing(true);

    // Start FileReader for the chat body in parallel with the transcription fetch
    const base64Promise = new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(audioBlob);
    });

    // Send binary FormData — no base64 encoding needed, ~33% smaller payload
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');

    let transcript = '[Voice message]';
    try {
      const res = await fetch('/api/transcribe', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.transcript) transcript = data.transcript;
    } catch (err) {
      console.warn('Transcription failed, using fallback:', err);
    } finally {
      setIsTranscribing(false);
    }

    // FileReader ran in parallel — almost certainly done by now
    const base64Audio = await base64Promise;

    await sendMessage(
      { text: transcript },
      {
        body: {
          storeLocation: selectedLocation || '',
          inventoryData: inventoryData,
          storesData: storesData,
          audioBase64: base64Audio,
          audioMimeType: audioBlob.type,
          cartItemCount: totalItems,
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

  const handleNewChat = () => {
    clearChatSession();
    historySessionRef.current = null;
    mountedLocationRef.current = selectedLocation;
    setMessages(getInitialChatMessages({ version: CHAT_HISTORY_VERSION, messages: [], toolCalls: [] }, getWelcomeText(selectedLocation)));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = '40px';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 128)}px`;
    }
  };

  const suggestionChips =
    pageContext === 'checkout' ? CHECKOUT_SUGGESTION_CHIPS : SHOPPING_SUGGESTION_CHIPS;

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`fixed inset-x-0 bottom-16 lg:bottom-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        style={{ top: '4rem' }}
      />

      {/* Chat Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="SM Markets Assistant"
        className={`fixed top-16 left-0 w-full lg:max-w-md bg-white shadow-2xl z-40 flex flex-col border-r border-[var(--color-border-subtle)] transition-transform duration-300 ease-in-out h-[calc(100vh-8rem)] lg:h-[calc(100vh-4rem)] ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
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
          <div className="flex items-center gap-1">
            <button
              id="chat-new-btn"
              aria-label="New chat"
              onClick={handleNewChat}
              title="New chat"
              className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
            >
              <span className="material-symbols-outlined">edit_square</span>
            </button>
            <button
              id="chat-close-btn"
              aria-label="Close chat"
              onClick={onClose}
              className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
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

                  if (part.type === 'tool-checkout_cart') {
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
                              ? 'shopping_cart_checkout'
                              : isSuccess
                              ? 'check_circle'
                              : 'error'}
                          </span>
                          <span>
                            {isPending
                              ? 'Redirecting to checkout…'
                              : output?.message ?? 'Checkout updated'}
                          </span>
                        </div>
                      </div>
                    );
                  }

                  if (part.type === 'tool-fetch_promos') {
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
                    const output = toolPart.output as ChatToolOutput['output'] | undefined;
                    const promoToolCards = isSuccess ? getPromoToolCards(output?.data) : null;
                    const eligibleEvaluationCount = promoToolCards?.filter(
                      (card) => card.statusLabel === 'Eligible'
                    ).length;

                    return (
                      <div key={partIdx} className="self-start max-w-[85%] pl-10 space-y-2">
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
                            {isPending ? 'local_offer' : isSuccess ? 'check_circle' : 'error'}
                          </span>
                          <span>
                            {isPending
                              ? 'Checking live promotions…'
                              : isSuccess
                              ? `${output?.message ?? 'Promotions fetched.'}${
                                  eligibleEvaluationCount === undefined
                                    ? ''
                                    : ` ${eligibleEvaluationCount} eligible.`
                                }`
                              : output?.message ?? 'Could not fetch promotions.'}
                          </span>
                        </div>
                        {promoToolCards?.map((card) => (
                          <div
                            key={card.id}
                            className="rounded-xl border border-[var(--color-border-subtle)] bg-white p-3 text-xs text-[var(--color-on-surface)] shadow-sm"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-semibold text-sm">{card.title}</p>
                                <code className="font-mono text-[11px] text-[var(--color-primary)]">
                                  {card.code}
                                </code>
                              </div>
                              <span className="shrink-0 rounded-full bg-[var(--color-surface-container-high)] px-2 py-0.5 font-medium text-[10px]">
                                {card.applied ? 'Applied · ' : ''}
                                {card.statusLabel}
                              </span>
                            </div>
                            <p className="mt-2 text-[var(--color-on-surface-variant)]">{card.terms}</p>
                            <p className="mt-1">
                              <span className="font-medium">Reason:</span> {card.reason}
                            </p>
                            <p className="mt-1 font-medium">
                              Estimated savings: {card.estimatedSavingsLabel}
                            </p>
                          </div>
                        ))}
                        {promoToolCards?.length === 0 && (
                          <p className="rounded-xl border border-[var(--color-border-subtle)] bg-white px-3 py-2 text-xs text-[var(--color-on-surface-variant)]">
                            No current prototype offers were returned.
                          </p>
                        )}
                      </div>
                    );
                  }

                  if (part.type === 'tool-apply_promos') {
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
                    const output = toolPart.output as ChatToolOutput['output'] | undefined;
                    const data = output?.data;
                    const hasRejections =
                      typeof data === 'object' &&
                      data !== null &&
                      !Array.isArray(data) &&
                      'rejected' in data &&
                      Array.isArray(data.rejected) &&
                      data.rejected.length > 0;

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
                            {isPending ? 'local_offer' : isSuccess ? 'check_circle' : 'error'}
                          </span>
                          <span>
                            {isPending
                              ? 'Applying promotions…'
                              : isSuccess && hasRejections
                              ? `${output?.message ?? 'Promotions applied.'} Some promotions could not be applied.`
                              : output?.message ?? 'No promotions were applied.'}
                          </span>
                        </div>
                      </div>
                    );
                  }

                  return null;
                })}

                {/* Suggestion chips under the initial greeting */}
                {shouldShowMessageSuggestionChips(pageContext, index, m.role) && (
                  <div className="flex gap-2 max-w-[85%] self-start pl-10 flex-wrap mt-1">
                    {suggestionChips.map((chip) => (
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

          {shouldShowCheckoutSuggestionChips(pageContext, checkoutSuggestionsDismissed) && (
            <div className="flex gap-2 max-w-[85%] self-start pl-10 flex-wrap mt-1">
              {suggestionChips.map((chip) => (
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

        {/* Speaking indicator */}
        {isSpeaking && (
          <div className="bg-[var(--color-primary)]/10 border-t border-[var(--color-primary)]/20 px-4 py-2 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 text-sm text-[var(--color-primary)]">
              <span className="material-symbols-outlined text-base animate-pulse">volume_up</span>
              <span>Speaking…</span>
            </div>
            <button
              type="button"
              onClick={stopSpeaking}
              className="flex items-center gap-1 text-xs font-medium text-[var(--color-primary)] border border-[var(--color-primary)] px-2 py-1 rounded-full hover:bg-[var(--color-primary)] hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined text-sm">stop</span>
              Stop
            </button>
          </div>
        )}

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
              className={`p-2 bg-[var(--color-primary)] text-white rounded-full hover:bg-[var(--color-primary-container)] disabled:opacity-50 transition-colors shrink-0 mb-0.5 mr-0.5 flex items-center justify-center ${
                !input.trim() || isLoading ? 'cursor-default' : 'cursor-pointer'
              }`}
              aria-label="Send message"
            >
              <span className="material-symbols-outlined text-sm">send</span>
            </button>
            <button
              type="button"
              className={`p-2 rounded-full flex items-center justify-center mb-0.5 mr-0.5 transition-colors ${
                isRecording
                  ? 'bg-red-500 text-white animate-pulse cursor-pointer'
                  : isTranscribing
                  ? 'bg-yellow-500 text-white animate-pulse cursor-default'
                  : 'bg-gray-200 cursor-pointer'
              }`}
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onMouseLeave={stopRecording}
              onTouchStart={startRecording}
              onTouchEnd={stopRecording}
              disabled={isLoading || isTranscribing}
            >
              {isRecording ? 'Recording...' : isTranscribing ? 'Transcribing...' : (
                <span className="material-symbols-outlined text-sm">mic</span>
              )}
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
