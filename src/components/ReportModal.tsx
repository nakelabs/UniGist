import React, { useState } from 'react';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { X, ShieldAlert, CheckCircle2, ChevronRight, AlertCircle } from 'lucide-react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string, customReason?: string) => void;
  postId: string;
  isComment?: boolean;
}

const REPORT_REASONS = [
  {
    value: 'harassment',
    title: 'Harassment or Bullying',
    description: 'Targeted attacks, insults, or intimidation of individuals',
  },
  {
    value: 'hate-speech',
    title: 'Hate Speech',
    description: 'Discriminatory language, slurs, or promoting hatred',
  },
  {
    value: 'inappropriate',
    title: 'Inappropriate or NSFW',
    description: 'Explicit sexual material or graphic non-consensual content',
  },
  {
    value: 'violence',
    title: 'Violence or Physical Harm',
    description: 'Threats of violence, encouragement of harm, or dangerous acts',
  },
  {
    value: 'personal-info',
    title: 'Doxxing or Personal Info',
    description: 'Sharing phone numbers, real names, or private info without consent',
  },
  {
    value: 'spam',
    title: 'Spam or Scam',
    description: 'Repetitive messages, commercial ads, or deceptive links',
  },
  {
    value: 'other',
    title: 'Other',
    description: 'Something else that violates community safety',
  },
];

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  postId,
  isComment = false,
}) => {
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [customReason, setCustomReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Lock background body scroll completely on iOS and desktop
  useBodyScrollLock(isOpen);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!selectedReason || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(selectedReason, selectedReason === 'other' ? customReason : undefined);
      setSubmitted(true);
      setTimeout(() => {
        handleClose();
      }, 1400);
    } catch {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose();
    setSelectedReason('');
    setCustomReason('');
    setIsSubmitting(false);
    setSubmitted(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4 overflow-hidden touch-none">
      <div 
        className="w-full sm:max-w-[480px] max-h-[92dvh] sm:max-h-[85vh] bg-[#0c0d0e] border border-[#2f3336] sm:rounded-2xl rounded-t-2xl flex flex-col overflow-hidden shadow-2xl animate-fade-in touch-auto"
      >
        {/* Header */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-[#2f3336] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#ff2d55]/10 flex items-center justify-center text-[#ff2d55]">
              <ShieldAlert size={17} />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-white leading-tight">
                Report {isComment ? 'Reply' : 'Post'}
              </h2>
              <span className="text-[11px] text-[#71767b]">100% anonymous report</span>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-[#71767b] hover:text-white transition-colors"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        {submitted ? (
          <div className="py-12 px-6 flex flex-col items-center text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#00ba7c]/15 text-[#00ba7c] flex items-center justify-center">
              <CheckCircle2 size={26} />
            </div>
            <h3 className="text-base font-bold text-white">Report Received</h3>
            <p className="text-xs text-[#71767b] max-w-xs leading-relaxed">
              Thank you for keeping Yarnz safe. Our moderation team has been notified.
            </p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 overscroll-contain">
              <p className="text-xs font-medium text-[#71767b] pb-1">
                Select the main issue with this {isComment ? 'reply' : 'confession'}:
              </p>

              {REPORT_REASONS.map((r) => {
                const isSelected = selectedReason === r.value;
                return (
                  <div
                    key={r.value}
                    onClick={() => setSelectedReason(r.value)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'border-[#ff2d55] bg-[#ff2d55]/10 text-white'
                        : 'border-[#2f3336] hover:border-white/20 bg-[#16181c]/50 text-[#e7e9ea]'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold leading-tight">{r.title}</p>
                      <p className="text-[12px] text-[#71767b] leading-tight mt-0.5">{r.description}</p>
                    </div>

                    <div className="shrink-0 flex items-center justify-center">
                      <div 
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected ? 'border-[#ff2d55] bg-[#ff2d55]' : 'border-[#444]'
                        }`}
                      >
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Extra details textarea if "Other" is chosen */}
              {selectedReason === 'other' && (
                <div className="pt-2 animate-fade-in">
                  <label className="block text-xs font-semibold text-[#aaa] mb-1.5">
                    Additional details:
                  </label>
                  <textarea
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Briefly describe what happened..."
                    maxLength={300}
                    className="w-full bg-[#16181c] border border-[#2f3336] rounded-xl p-3 text-[16px] sm:text-sm text-white placeholder-[#555] focus:outline-none focus:border-[#ff2d55] transition-colors resize-none h-20"
                  />
                  <span className="text-[11px] text-[#555] text-right block mt-1">
                    {customReason.length}/300
                  </span>
                </div>
              )}
            </div>

            {/* Sticky Actions Footer */}
            <div className="p-3.5 border-t border-[#2f3336] bg-[#0c0d0e] flex items-center justify-end gap-2 shrink-0 pb-[max(14px,env(safe-area-inset-bottom))]">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 rounded-full text-xs sm:text-sm font-semibold text-[#888] hover:text-white hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!selectedReason || (selectedReason === 'other' && !customReason.trim()) || isSubmitting}
                className="bg-[#ff2d55] hover:bg-[#e02449] disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm px-5 py-2 rounded-full transition-all active:scale-95 shrink-0 flex items-center gap-1.5 shadow-lg shadow-[#ff2d55]/20"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Submitting...</span>
                  </span>
                ) : (
                  <span>Submit Report</span>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ReportModal;
