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
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {/* Display existing reactions */}
      {reactedEmojis.map(emoji => (
        <button
          key={emoji}
          onClick={() => handleEmojiClick(emoji)}
          className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-cyber transition-all ${
            userTargetReactions.includes(emoji)
              ? 'bg-retro-electric-blue/30 border border-retro-electric-blue text-retro-electric-blue'
              : 'bg-gray-800/50 border border-gray-600/30 text-gray-300 hover:bg-gray-700/50 hover:border-gray-500/50'
          }`}
          title={userTargetReactions.includes(emoji) ? 'Remove reaction' : 'Add reaction'}
        >
          <span className="text-sm">{emoji}</span>
          <span className="text-xs">{reactionCounts[emoji]}</span>
        </button>
      ))}

      {/* Add reaction button */}
      <div className="relative" ref={pickerRef}>
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="flex items-center justify-center w-7 h-7 rounded-full bg-gray-800/50 border border-gray-600/30 text-gray-400 hover:bg-retro-cyber-yellow/20 hover:border-retro-cyber-yellow/50 hover:text-retro-cyber-yellow transition-all"
          title="Add reaction"
        >
          {showEmojiPicker ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
        </button>

        {/* Emoji picker dropdown */}
        {showEmojiPicker && (
          <div className="absolute top-8 left-0 z-10 bg-black border border-retro-electric-blue/50 rounded-lg p-3 shadow-lg">
            <div className="grid grid-cols-4 gap-2 max-w-48">
              {availableEmojis.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => handleEmojiClick(emoji)}
                  className={`w-8 h-8 flex items-center justify-center text-lg rounded hover:bg-retro-electric-blue/20 transition-all ${
                    userTargetReactions.includes(emoji)
                      ? 'bg-retro-electric-blue/30 border border-retro-electric-blue'
                      : 'hover:scale-110'
                  }`}
                  title={`React with ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
            <div className="text-xs text-gray-400 mt-2 text-center font-cyber">
              Click to react
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmojiReactions;
