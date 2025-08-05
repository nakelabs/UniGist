import React, { useState } from 'react';
import { X, Flag, AlertTriangle } from 'lucide-react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string, customReason?: string) => void;
  postId: string;
  isComment?: boolean;
}

const reportReasons = [
  {
    value: 'spam',
    label: 'Spam or Repetitive Content',
    description: 'Unwanted promotional content or repetitive posts',
    icon: '🚫'
  },
  {
    value: 'harassment',
    label: 'Harassment or Bullying',
    description: 'Content that targets or bullies individuals',
    icon: '🎯'
  },
  {
    value: 'hate-speech',
    label: 'Hate Speech',
    description: 'Discriminatory language or content promoting hatred',
    icon: '⚠️'
  },
  {
    value: 'violence',
    label: 'Violence or Threats',
    description: 'Content promoting violence or containing threats',
    icon: '🔴'
  },
  {
    value: 'inappropriate',
    label: 'Inappropriate Content',
    description: 'Sexual content, graphic material, or inappropriate for the platform',
    icon: '🔞'
  },
  {
    value: 'personal-info',
    label: 'Personal Information',
    description: 'Contains personal information that should not be shared',
    icon: '📱'
  },
  {
    value: 'false-info',
    label: 'False Information',
    description: 'Deliberately misleading or false content',
    icon: '❌'
  },
  {
    value: 'copyright',
    label: 'Copyright Violation',
    description: 'Unauthorized use of copyrighted material',
    icon: '©️'
  },
  {
    value: 'other',
    label: 'Other Reason',
    description: 'Something else not covered by the above categories',
    icon: '💭'
  }
];

const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, onSubmit, postId, isComment = false }) => {
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [customReason, setCustomReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedReason) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(selectedReason, selectedReason === 'other' ? customReason : undefined);
      onClose();
      setSelectedReason('');
      setCustomReason('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose();
    setSelectedReason('');
    setCustomReason('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="retro-card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Flag className="w-5 h-5 text-retro-hot-pink" />
            <h2 className="font-pixel text-lg text-retro-cyber-yellow">
              Report {isComment ? 'Comment' : 'Confession'} #{postId.slice(-8)}
            </h2>
          </div>
          <button 
            onClick={handleClose}
            className="text-retro-hot-pink hover:text-retro-cyber-yellow transition-colors"
            title="Close report modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-retro-cyber-yellow" />
            <p className="font-cyber text-sm text-retro-pastel-blue">
              Help us keep UniGist safe by reporting content that violates our community guidelines.
            </p>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          <h3 className="font-pixel text-retro-neon-green text-sm mb-3">
            Why are you reporting this post?
          </h3>
          
          {reportReasons.map((reason) => (
            <label
              key={reason.value}
              className={`block p-3 border cursor-pointer transition-all ${
                selectedReason === reason.value
                  ? 'border-retro-cyber-yellow bg-retro-cyber-yellow/10'
                  : 'border-retro-electric-blue/30 hover:border-retro-electric-blue/60'
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="reportReason"
                  value={reason.value}
                  checked={selectedReason === reason.value}
                  onChange={(e) => setSelectedReason(e.target.value)}
                  className="mt-1 retro-radio"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm">{reason.icon}</span>
                    <span className="font-cyber text-sm text-retro-neon-green font-semibold">
                      {reason.label}
                    </span>
                  </div>
                  <p className="font-cyber text-xs text-retro-pastel-blue/80">
                    {reason.description}
                  </p>
                </div>
              </div>
            </label>
          ))}
        </div>

        {selectedReason === 'other' && (
          <div className="mb-6">
            <label className="block mb-2">
              <span className="font-cyber text-sm text-retro-neon-green">
                Please describe the issue:
              </span>
            </label>
            <textarea
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder={`Provide more details about why you're reporting this ${isComment ? 'comment' : 'post'}...`}
              className="w-full h-24 bg-gray-900/50 border border-retro-electric-blue/30 rounded p-3 text-retro-pastel-blue font-cyber text-sm resize-none focus:outline-none focus:border-retro-cyber-yellow"
              maxLength={500}
              required
            />
            <div className="text-xs text-retro-electric-blue/70 mt-1">
              {customReason.length}/500 characters
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 border border-retro-electric-blue text-retro-electric-blue font-pixel text-xs hover:bg-retro-electric-blue hover:text-black transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedReason || (selectedReason === 'other' && !customReason.trim()) || isSubmitting}
            className="px-4 py-2 bg-retro-hot-pink text-black font-pixel text-xs hover:bg-retro-cyber-yellow disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Report'}
          </button>
        </div>

        <div className="mt-4 p-3 border border-retro-electric-blue/20 bg-retro-electric-blue/5">
          <p className="font-cyber text-xs text-retro-pastel-blue/80">
            <strong>Note:</strong> Reports are reviewed by our moderation team. False reports may result in account restrictions.
            All reports are anonymous and the user won't know you reported them.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReportModal;
