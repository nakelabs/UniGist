import { useState } from 'react';

interface ConfessionFormProps {
  onSubmit: (confession: {
    content: string;
    imageFile?: File;
    audioFile?: File;
    tags?: string[];
  }) => Promise<void>;
}

import AudioRecorder from './AudioRecorder';

const SUGGESTED_TAGS = ['university', 'relationships', 'work', 'family', 'secrets', 'funny'];

const ConfessionForm = ({ onSubmit }: ConfessionFormProps) => {
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const [showTagSection, setShowTagSection] = useState(false);
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);

  const MAX_CHARS = 500;
  const remaining = MAX_CHARS - content.length;
  const isNearLimit = remaining <= 50;

  // ── Tag helpers ──────────────────────────────────────────────────────────
  const addTag = (tag: string) => {
    const t = tag.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    if (t && !tags.includes(t) && tags.length < 5) {
      setTags([...tags, t]);
      setCurrentTag('');
    }
  };

  const removeTag = (t: string) => setTags(tags.filter((x) => x !== t));

  // ── File upload ──────────────────────────────────────────────────────────
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;

    setImageFile(file);
    setImageUrl(URL.createObjectURL(file));
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('audio/')) return;

    setAudioFile(file);
    setAudioUrl(URL.createObjectURL(file));
  };

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !imageFile && !audioFile && !audioBlob) return;

    setIsSubmitting(true);
    try {
      const audioToSubmit = audioFile || (audioBlob ? new File([audioBlob], 'recording.webm', { type: audioBlob.type }) : undefined);
      
      await onSubmit({
        content,
        imageFile: imageFile || undefined,
        audioFile: audioToSubmit,
        tags,
      });
      setContent('');
      setTags([]);
      setCurrentTag('');
      setImageFile(null);
      setImageUrl(null);
      setAudioFile(null);
      setAudioBlob(null);
      setAudioUrl(null);
      setShowTagSection(false);
      setShowAudioRecorder(false);
    } catch (err) {
      console.error('Error submitting confession:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canPost = (content.trim().length > 0 || !!imageFile || !!audioFile || !!audioBlob) && !isSubmitting;

  return (
    <div className="mb-4 animate-fade-up">
      <form onSubmit={handleSubmit}>
        {/* Text area */}
        <div className="pt-2 pb-2">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share something anonymously..."
            className="field min-h-[100px] text-[15px] leading-relaxed"
            maxLength={MAX_CHARS}
          />

          {/* Character counter */}
          <div className="flex justify-end mt-1">
            <span className={`text-xs font-medium ${isNearLimit ? 'text-[#ff2d55]' : 'text-[#555]'}`}>
              {remaining}
            </span>
          </div>
        </div>

        {/* Image preview */}
        {imageUrl && (
          <div className="px-4 pb-3 relative">
            <img
              src={imageUrl}
              alt="Attached"
              className="w-full max-h-64 object-cover rounded-xl"
            />
            <button
              type="button"
              onClick={() => { setImageUrl(null); setImageFile(null); }}
              className="absolute top-2 right-6 p-1.5 bg-black/70 rounded-full text-white hover:bg-black text-xs leading-none font-bold"
            >
              ×
            </button>
          </div>
        )}

        {/* Tag section */}
        {showTagSection && (
          <div className="pb-3 animate-fade-in space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(currentTag); }}}
                placeholder="Add a tag..."
                className="field flex-1 py-2"
                maxLength={20}
              />
              <button
                type="button"
                onClick={() => addTag(currentTag)}
                className="btn-ghost px-3"
                disabled={!currentTag.trim() || tags.length >= 5}
              >
                Add
              </button>
            </div>

            {/* Suggested tags */}
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTED_TAGS.filter((t) => !tags.includes(t)).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => addTag(t)}
                  className="tag-pill cursor-pointer hover:border-white/20 hover:text-white transition-colors"
                  disabled={tags.length >= 5}
                >
                  #{t}
                </button>
              ))}
            </div>

            {/* Selected tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((t) => (
                  <span key={t} className="tag-pill border-[#ff2d55]/40 text-[#ff2d55] flex items-center gap-1">
                    #{t}
                    <button type="button" onClick={() => removeTag(t)} className="hover:text-white text-xs leading-none font-bold ml-0.5">
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Audio Recorder section */}
        {showAudioRecorder && (
          <div className="mb-3">
            <AudioRecorder
              audioUrl={audioUrl}
              setAudioUrl={setAudioUrl}
              setAudioBlob={setAudioBlob}
              handleFileUpload={handleAudioUpload}
            />
          </div>
        )}

        {/* File input (hidden) */}
        <input 
          type="file" 
          id="image-upload" 
          accept="image/*" 
          className="hidden" 
          onChange={handleFileUpload}
        />

        {/* Bottom toolbar */}
        <div className="py-2 flex items-center justify-between">
          {/* Media / tag toggles */}
          <div className="flex items-center gap-1">
            <label
              htmlFor="image-upload"
              className={`action-btn cursor-pointer text-xs font-semibold tracking-wide ${(imageUrl) ? 'text-[#ff2d55]' : ''}`}
              title="Attach image"
            >
              Photo
            </label>
            <button
              type="button"
              onClick={() => setShowAudioRecorder(!showAudioRecorder)}
              className={`action-btn text-xs font-semibold tracking-wide ${showAudioRecorder || audioUrl ? 'text-[#0ea5e9]' : ''}`}
              title="Add audio"
            >
              Audio
            </button>
            <button
              type="button"
              onClick={() => setShowTagSection(!showTagSection)}
              className={`action-btn text-xs font-semibold tracking-wide ${showTagSection || tags.length > 0 ? 'text-[#7c3aed]' : ''}`}
              title="Add tags"
            >
              Tags{tags.length > 0 && <span className="ml-1 text-[#7c3aed]">({tags.length})</span>}
            </button>
          </div>

          {/* Post button */}
          <button
            type="submit"
            disabled={!canPost}
            className="btn-brand"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Yarning
              </span>
            ) : (
              <span>Yarn it</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ConfessionForm;
