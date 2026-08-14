'use client';

interface ChatFABProps {
  onClick: () => void;
  isOpen: boolean;
}

export default function ChatFAB({ onClick, isOpen }: ChatFABProps) {
  return (
    <button
      id="chat-fab"
      onClick={onClick}
      aria-label={isOpen ? 'Close chat assistant' : 'Open chat assistant'}
      aria-expanded={isOpen}
      className={`fixed bottom-20 left-4 lg:bottom-8 lg:left-8 w-14 h-14 bg-[var(--color-primary)] text-white rounded-full shadow-lg flex items-center justify-center hover:bg-[var(--color-primary-container)] transition-transform hover:scale-105 z-50 ${isOpen ? 'hidden' : ''}`}
    >
      <span className="material-symbols-outlined fill text-3xl">
        {isOpen ? 'close' : 'chat_bubble'}
      </span>
    </button>
  );
}
