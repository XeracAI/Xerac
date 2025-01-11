'use client';

import { Message } from 'ai';
import { Button } from './ui/button';
import { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import { checkEnglishString } from "@/lib/utils";

export type MessageEditorProps = {
  message: Message;
  setMode: Dispatch<SetStateAction<'view' | 'edit'>>;
  editMessage: (messageId: string, newContent: string) => void;
};

export function MessageEditor({
  message,
  setMode,
  editMessage,
}: MessageEditorProps) {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [draftContent, setDraftContent] = useState<string>(message.content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      adjustHeight();
    }
  }, []);

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight + 2}px`;
    }
  };

  const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDraftContent(event.target.value);
    adjustHeight();
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <Textarea
        ref={textareaRef}
        className="bg-transparent outline-none overflow-hidden resize-none !text-base rounded-xl w-full"
        value={draftContent}
        onChange={handleInput}
        style={{ direction: checkEnglishString(draftContent) ? "ltr" : "rtl" }}
      />

      <div className="flex flex-row gap-2 justify-start">
        <Button
          variant="default"
          className="h-fit py-2 px-3"
          disabled={isSubmitting}
          onClick={async () => {
            setIsSubmitting(true);
            const messageId = message.serverId ?? message.id;

            if (!messageId) {
              toast.error('Something went wrong, please try again!');
              setIsSubmitting(false);
              return;
            }

            editMessage(messageId, draftContent);

            setMode('view');
          }}
        >
          {isSubmitting ? 'در حال ارسال...' : 'ارسال'}
        </Button>

        <Button
          variant="outline"
          className="h-fit py-2 px-3"
          onClick={() => {
            setMode('view');
          }}
        >
          لغو
        </Button>
      </div>
    </div>
  );
}
