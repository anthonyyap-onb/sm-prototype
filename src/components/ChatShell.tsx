'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import ChatFAB from '@/components/ChatFAB';
import ChatModal from '@/components/ChatModal';
import { useLiveVoice } from '@/context/LiveVoiceContext';

export default function ChatShell() {
  const { chatContextData, isChatOpen, setIsChatOpen } = useLiveVoice();
  const pathname = usePathname();

  // Close the modal on navigation, but keep the live session running
  useEffect(() => {
    setIsChatOpen(false);
  }, [pathname, setIsChatOpen]);

  return (
    <>
      <ChatFAB
        onClick={() => setIsChatOpen(!isChatOpen)}
        isOpen={isChatOpen}
      />
      <ChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        selectedLocation={chatContextData.selectedLocation}
        inventoryData={chatContextData.inventoryData}
        onStoreChange={chatContextData.onStoreChange}
        storesData={chatContextData.storesData}
        pageContext={chatContextData.pageContext}
      />
    </>
  );
}
