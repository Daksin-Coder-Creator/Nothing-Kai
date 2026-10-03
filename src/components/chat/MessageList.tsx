import React from 'react';
import { AnimatePresence } from 'motion/react';
import { ChatMessage } from '../../types';
import { MessageItem } from '../MessageItem';
import { ThemeId } from '../../core/themeConfig';
import { Rotating3DAtom } from '../Rotating3DAtom';

interface MessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  onRegenerateMessage?: (messageId: string) => void;
  onEditMessage?: (messageId: string, newContent: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  onFeedback?: (messageId: string, feedback: 'like' | 'dislike', reason?: string, comment?: string) => void;
  userTierId?: string;
  onOpenUpgradeModal?: () => void;
  activeTheme?: ThemeId;
  isReducedMotion?: boolean;
  onDockVideo?: (video: any) => void;
  onEditImage?: (image: { name: string; type: string; base64: string }, prompt?: string) => void;
  onAnimateToVideo?: (image: { name: string; type: string; base64: string }, prompt?: string) => void;
}

const MessageListBase: React.FC<MessageListProps> = ({
  messages,
  isLoading,
  messagesEndRef,
  onRegenerateMessage,
  onEditMessage,
  onDeleteMessage,
  onFeedback,
  userTierId,
  onOpenUpgradeModal,
  activeTheme,
  isReducedMotion = false,
  onDockVideo,
  onEditImage,
  onAnimateToVideo
}) => {
  return (
    <div className="pt-6 pb-4 px-2 w-full">
      <div className="w-full space-y-6">
        <AnimatePresence initial={false}>
          {(messages || []).map((msg, idx) => (
            <MessageItem
              key={msg.id || idx}
              message={msg}
              onRegenerate={onRegenerateMessage ? () => onRegenerateMessage(msg.id) : undefined}
              onEdit={onEditMessage ? (newContent) => onEditMessage(msg.id, newContent) : undefined}
              onDelete={onDeleteMessage ? () => onDeleteMessage(msg.id) : undefined}
              onFeedback={onFeedback}
              userTierId={userTierId}
              onOpenUpgradeModal={onOpenUpgradeModal}
              activeTheme={activeTheme}
              isReducedMotion={isReducedMotion}
              onDockVideo={onDockVideo}
              onEditImage={onEditImage}
              onAnimateToVideo={onAnimateToVideo}
            />
          ))}
        </AnimatePresence>
        {isLoading && (
          <div className="flex items-start gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500 justify-start w-full">
            <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center animate-atom-float shrink-0">
              <Rotating3DAtom size={16} monochrome={false} themeId={activeTheme} />
            </div>
            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl max-w-md animate-bubble-glow mr-auto">
              <div className="h-4 bg-white/10 rounded-full w-3/4 animate-pulse mb-2" />
              <div className="h-4 bg-white/10 rounded-full w-1/2 animate-pulse" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} className="h-4" />
      </div>
    </div>
  );
};

export const MessageList = React.memo(MessageListBase);
