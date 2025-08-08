import { useState, useEffect, useRef } from 'react';
import { Plus, X } from 'lucide-react';
import { useReactions, ReactionCounts } from '@/hooks/useReactions';

interface EmojiReactionsProps {
  targetId: string;
  targetType: 'confession' | 'comment';
  className?: string;
}

const EmojiReactions = ({ targetId, targetType, className = '' }: EmojiReactionsProps) => {
  const { userReactions, availableEmojis, toggleReaction, getReactionCounts } = useReactions();
  const [reactionCounts, setReactionCounts] = useState<ReactionCounts>({});
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  
  const reactionsKey = targetType === 'confession' ? 'confessions' : 'comments';
  const userTargetReactions = userReactions[reactionsKey][targetId] || [];

  const loadReactionCounts = async () => {
    const counts = await getReactionCounts(targetId, targetType);
    setReactionCounts(counts);
  };

  useEffect(() => {
    loadReactionCounts();
  }, [targetId, targetType]);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

  const handleEmojiClick = async (emoji: string) => {
    const success = await toggleReaction(targetId, emoji, targetType);
    if (success) {
      loadReactionCounts();
      setShowEmojiPicker(false);
    }
  };

  // Get emojis that have reactions (to display)
  const reactedEmojis = Object.keys(reactionCounts).filter(emoji => reactionCounts[emoji] > 0);

  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      {/* Enhanced reaction display */}
      {reactedEmojis.map(emoji => (
        <button
          key={emoji}
          onClick={() => handleEmojiClick(emoji)}
          className={`group flex items-center gap-2 px-3 py-2 rounded-2xl text-xs font-cyber transition-all duration-300 ${
            userTargetReactions.includes(emoji)
              ? 'bg-gradient-to-r from-retro-electric-blue/30 to-retro-electric-blue/20 border border-retro-electric-blue text-retro-electric-blue shadow-lg shadow-retro-electric-blue/20 scale-105'
              : 'bg-gray-800/60 border border-gray-600/40 text-gray-300 hover:bg-gradient-to-r hover:from-gray-700/60 hover:to-gray-600/60 hover:border-gray-500/60 hover:scale-105 hover:shadow-md'
          }`}
          title={userTargetReactions.includes(emoji) ? `Remove ${emoji} reaction` : `Add ${emoji} reaction`}
        >
          <span className="text-base transform group-hover:scale-110 transition-transform duration-200">{emoji}</span>
          <span className={`text-xs font-pixel ${
            userTargetReactions.includes(emoji) ? 'text-retro-electric-blue' : 'text-gray-400'
          }`}>
            {reactionCounts[emoji]}
          </span>
          {userTargetReactions.includes(emoji) && (
            <div className="w-1 h-1 bg-retro-electric-blue rounded-full animate-pulse"></div>
          )}
        </button>
      ))}

      {/* Enhanced add reaction button */}
      <div className="relative inline-block" ref={pickerRef}>
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className={`group flex items-center justify-center w-9 h-9 rounded-2xl border transition-all duration-300 ${
            showEmojiPicker
              ? 'bg-gradient-to-r from-retro-cyber-yellow/30 to-retro-hot-pink/30 border-retro-cyber-yellow text-retro-cyber-yellow shadow-lg shadow-retro-cyber-yellow/30 scale-110'
              : 'bg-gray-800/60 border-gray-600/40 text-gray-400 hover:bg-gradient-to-r hover:from-retro-cyber-yellow/20 hover:to-retro-electric-blue/20 hover:border-retro-cyber-yellow/60 hover:text-retro-cyber-yellow hover:scale-110 hover:shadow-lg hover:shadow-retro-cyber-yellow/20'
          }`}
          title={showEmojiPicker ? "Close emoji picker" : "Add reaction"}
        >
          <div className="relative">
            {showEmojiPicker ? (
              <X className="w-4 h-4 transform group-hover:rotate-90 transition-transform duration-300" />
            ) : (
              <Plus className="w-4 h-4 transform group-hover:rotate-90 transition-transform duration-300" />
            )}
            {!showEmojiPicker && (
              <div className="absolute inset-0 bg-gradient-to-r from-retro-cyber-yellow/0 to-retro-electric-blue/0 group-hover:from-retro-cyber-yellow/40 group-hover:to-retro-electric-blue/40 rounded-full transition-all duration-300 -z-10"></div>
            )}
          </div>
        </button>

        {/* Enhanced Emoji picker dropdown */}
        {showEmojiPicker && (
          <div className="absolute bottom-full mb-2 right-0 z-[60] max-w-xs">
            {/* Main picker container */}
            <div className="relative bg-gradient-to-br from-gray-900/98 to-black/98 backdrop-blur-xl border border-retro-electric-blue/60 rounded-2xl p-4 shadow-2xl shadow-retro-electric-blue/30">
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-retro-electric-blue rounded-full animate-pulse"></div>
                  <span className="font-cyber text-xs text-retro-electric-blue uppercase tracking-wide">Choose Reaction</span>
                </div>
                <button
                  onClick={() => setShowEmojiPicker(false)}
                  className="w-6 h-6 flex items-center justify-center rounded-full bg-retro-hot-pink/20 text-retro-hot-pink hover:bg-retro-hot-pink/40 transition-all duration-200"
                  title="Close emoji picker"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>

              {/* Emoji grid */}
              <div className="grid grid-cols-6 gap-2">
                {availableEmojis.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => handleEmojiClick(emoji)}
                    className={`group w-8 h-8 flex items-center justify-center text-lg rounded-lg transition-all duration-200 ${
                      userTargetReactions.includes(emoji)
                        ? 'bg-retro-electric-blue/40 border border-retro-electric-blue text-white shadow-md shadow-retro-electric-blue/40'
                        : 'bg-gray-800/60 border border-gray-600/40 hover:bg-retro-electric-blue/20 hover:border-retro-electric-blue/60 hover:scale-110'
                    }`}
                    title={`React with ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              
              {/* Footer */}
              <div className="text-center pt-3 mt-3 border-t border-gray-700/50">
                <span className="text-xs text-gray-400 font-cyber">
                  Click to react
                </span>
              </div>
              
              {/* Arrow pointer */}
              <div className="absolute top-full right-4 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-retro-electric-blue/60"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmojiReactions;
