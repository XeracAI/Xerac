'use client';

import { memo } from 'react';

import { useRouter } from 'next/navigation';

import { useTheme } from 'next-themes';
import { useWindowSize } from 'usehooks-ts';

import { ModelSelector } from '@/components/model-selector';
import { SidebarToggle } from '@/components/sidebar-toggle';
import { Button } from '@/components/ui/button';
import { BetterTooltip } from '@/components/ui/tooltip';

import type { Chat } from '@/lib/db/schema';
import type { Model } from '@/lib/ai/types';

import { useSidebar } from './ui/sidebar';
import { PlusIcon } from './icons';
import { type VisibilityType, VisibilitySelector } from './visibility-selector';

function PureChatHeader({
  chatId,
  chat,
  selectedModel,
  selectedVisibilityType,
  isReadonly,
}: {
  chatId: string;
  chat: Chat | undefined;
  selectedModel?: Model | null;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
}) {
  const router = useRouter();
  const { open } = useSidebar();
  const { setTheme, theme } = useTheme();

  const { width: windowWidth } = useWindowSize();

  return (
    <header className="flex sticky top-0 bg-background py-1.5 items-center px-2 md:px-2 gap-2">
      <SidebarToggle />

      {(!open || windowWidth < 768) && (
        <BetterTooltip content="چت جدید">
          <Button
            variant="outline"
            className="order-2 md:order-1 md:px-2 px-2 md:h-fit ml-auto md:ml-0"
            onClick={() => {
              router.push('/chat');
              router.refresh();
            }}
          >
            <PlusIcon />
            <span className="md:sr-only">چت جدید</span>
          </Button>
        </BetterTooltip>
      )}

      {!isReadonly && (
        <ModelSelector
          selectedModel={selectedModel}
          className="order-1 md:order-2"
        />
      )}

      {!isReadonly && (
        <VisibilitySelector
          chatId={chatId}
          selectedVisibilityType={selectedVisibilityType}
          className="order-1 md:order-3"
        />
      )}

      <div className="order-4 mx-auto">{chat?.title || "چت جدید"}</div>

      <button className="hidden md:flex py-1.5 px-2 h-fit md:h-[34px] order-5 md:mr-auto theme" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" className="size-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18"/>
        </svg>
      </button>
    </header>
  );
}

export const ChatHeader = memo(PureChatHeader, (prevProps, nextProps) => {
  if (prevProps.selectedModel !== nextProps.selectedModel) return false;
  return !(prevProps.chat?.title !== nextProps.chat?.title);
});
