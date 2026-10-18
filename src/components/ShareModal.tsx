import React, { useState } from 'react';
import { ConfessionWithComments } from '@/hooks/useConfessions';
import { Share2, Copy, Check, X, Smartphone, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: ConfessionWithComments | null;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, post }) => {
  const { toast } = useToast();
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  if (!isOpen || !post) return null;

  const postId = post.id.toString();
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const shareUrl = `${origin}/?post=${postId}#post-${postId}`;

  const rawText = post.text_content || (post as unknown as { content?: string }).content || '';
  const cleanSnippet = rawText
    ? rawText.length > 90
      ? rawText.slice(0, 87) + '...'
      : rawText
    : 'Check out this secret confession on Yarnz!';

  const fullShareText = `🔥 Yarnz Secret Confession #${postId.slice(-6)}:\n"${cleanSnippet}"\n\nDrop your thoughts anonymously:`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      toast({
        title: 'Link copied! 📋',
        description: 'Post link copied to clipboard. Ready to paste anywhere!',
      });
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      toast({
        title: 'Failed to copy',
        description: 'Please copy the link manually.',
        variant: 'destructive',
      });
    }
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(`${fullShareText}\n${shareUrl}`);
      setCopiedText(true);
      toast({
        title: 'Confession & Link copied! 💬',
        description: 'Ready to paste into your groups or chats.',
      });
      setTimeout(() => setCopiedText(false), 2000);
    } catch {
      toast({
        title: 'Failed to copy',
        description: 'Please copy manually.',
        variant: 'destructive',
      });
    }
  };

  const hasNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const handleNativeShare = async () => {
    if (hasNativeShare) {
      try {
        await navigator.share({
          title: `Yarnz Confession #${postId.slice(-6)}`,
          text: fullShareText,
          url: shareUrl,
        });
      } catch (err: unknown) {
        if ((err as Error)?.name !== 'AbortError') {
          console.error('Error sharing:', err);
        }
      }
    } else {
      handleCopyLink();
    }
  };

  // Direct Social Share URLs
  const encodedText = encodeURIComponent(`${fullShareText}\n${shareUrl}`);
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(`Yarnz Confession #${postId.slice(-6)}: "${cleanSnippet}"`);

  const shareChannels = [
    {
      name: 'WhatsApp',
      href: `https://api.whatsapp.com/send?text=${encodedText}`,
      bg: 'bg-[#25D366]/15 hover:bg-[#25D366]/25 border-[#25D366]/30 text-[#25D366]',
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.972.531 1.954.819 2.796.819h.005c3.18 0 5.767-2.586 5.768-5.766 0-3.18-2.587-5.766-5.773-5.766zm3.375 8.167c-.145.407-.745.748-1.033.792-.289.043-.659.083-2.127-.525-1.781-.737-2.916-2.538-3.005-2.656-.089-.118-.724-.962-.724-1.834 0-.872.457-1.301.62-1.479.163-.178.356-.222.474-.222.119 0 .237.001.341.006.11.005.257-.042.401.305.148.356.504 1.229.548 1.318.044.089.074.193.015.311-.059.119-.089.193-.178.296-.089.104-.187.232-.267.311-.089.089-.182.186-.078.364.104.178.461.761.989 1.232.68.607 1.254.796 1.432.885.178.089.282.074.386-.044.104-.119.445-.519.564-.697.119-.178.237-.148.4-.089.163.059 1.038.489 1.216.578.178.089.297.133.341.208.044.074.044.43-.101.837zm-3.375-9.839c-4.041 0-7.327 3.285-7.329 7.328 0 1.355.37 2.624 1.011 3.714L4.5 20.5l5.011-1.314c1.048.572 2.247.886 3.52.886h.006c4.041 0 7.328-3.286 7.328-7.329 0-4.043-3.287-7.343-7.334-7.343z"/>
        </svg>
      ),
    },
    {
      name: 'Telegram',
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodeURIComponent(fullShareText)}`,
      bg: 'bg-[#229ED9]/15 hover:bg-[#229ED9]/25 border-[#229ED9]/30 text-[#229ED9]',
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .37z"/>
        </svg>
      ),
    },
    {
      name: 'X (Twitter)',
      href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
      bg: 'bg-white/10 hover:bg-white/20 border-white/20 text-white',
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      ),
    },
    {
      name: 'Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      bg: 'bg-[#1877F2]/15 hover:bg-[#1877F2]/25 border-[#1877F2]/30 text-[#1877F2]',
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      ),
    },
    {
      name: 'Reddit',
      href: `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`,
      bg: 'bg-[#FF4500]/15 hover:bg-[#FF4500]/25 border-[#FF4500]/30 text-[#FF4500]',
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
        </svg>
      ),
    },
  ];

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-opacity animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-[#141416] border border-white/10 rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl p-5 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#ff2d55]/15 text-[#ff2d55] flex items-center justify-center border border-[#ff2d55]/20">
              <Share2 size={16} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white leading-tight">Share Confession</h3>
              <p className="text-[11px] text-[#777]">anon #{postId.slice(-6)}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#666] hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Compact preview quote */}
        <div className="bg-[#1a1a1e] border border-white/5 rounded-xl px-3 py-2 text-xs">
          <p className="line-clamp-2 text-[#ccc] italic text-[12px] leading-relaxed">
            "{cleanSnippet}"
          </p>
        </div>

        {/* Social Grid (Compact Circular / Rounded App Badges) */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold tracking-wider text-[#666] uppercase">
              Send to Groups & Apps
            </span>
            {hasNativeShare && (
              <button
                onClick={handleNativeShare}
                className="text-[11px] font-medium text-[#ff2d55] hover:underline flex items-center gap-1"
              >
                <Smartphone size={12} /> More apps
              </button>
            )}
          </div>

          <div className="grid grid-cols-5 gap-2 pt-1 text-center">
            {shareChannels.map((channel) => (
              <a
                key={channel.name}
                href={channel.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col items-center gap-1.5 focus:outline-none"
                title={`Share to ${channel.name}`}
              >
                <div 
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center border transition-all duration-200 group-hover:scale-105 group-active:scale-95 shadow-md ${channel.bg}`}
                >
                  {channel.icon}
                </div>
                <span className="text-[10px] font-medium text-[#888] group-hover:text-white transition-colors truncate w-full">
                  {channel.name}
                </span>
              </a>
            ))}
          </div>
        </div>

        {/* Copy Link Section */}
        <div className="pt-2 border-t border-white/5 space-y-2">
          <div className="flex items-center gap-1.5 bg-[#0e0e10] border border-white/10 rounded-xl p-1 pl-3">
            <span className="text-xs text-[#666] font-mono truncate flex-1 select-all">
              {shareUrl}
            </span>
            <button
              onClick={handleCopyLink}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                copiedLink
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white/10 hover:bg-white/20 text-white active:scale-95'
              }`}
            >
              {copiedLink ? <Check size={13} /> : <Copy size={13} />}
              <span>{copiedLink ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <button
            onClick={handleCopyText}
            className={`w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl border border-white/5 text-[11px] font-medium transition-all ${
              copiedText
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-white/[0.03] hover:bg-white/[0.07] text-[#888] hover:text-white'
            }`}
          >
            {copiedText ? <Check size={13} /> : <MessageSquare size={13} />}
            <span>{copiedText ? 'Confession & Link Copied!' : 'Copy full confession text with link'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
