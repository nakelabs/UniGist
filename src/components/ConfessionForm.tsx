import { useState } from 'react';
import { Image, X, Tag, Send } from 'lucide-react';
import ImageUploader from './ImageUploader';
import { uploadFile } from '@/lib/fileUpload';

interface ConfessionFormProps {
  onSubmit: (confession: {
    content: string;
    audioUrl?: string;
    videoUrl?: string;
    videoContext?: string;
    imageUrl?: string;
    imageContext?: string;
    tags?: string[];
  }) => Promise<void>;
}

const SUGGESTED_TAGS = ['university', 'relationships', 'work', 'family', 'secrets', 'funny'];

const ConfessionForm = ({ onSubmit }: ConfessionFormProps) => {
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageContext, setImageContext] = useState('');
  const [showImageSection, setShowImageSection] = useState(false);
  const [showTagSection, setShowTagSection] = useState(false);

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
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;

    setIsUploading(true);
    try {
      const url = await uploadFile(file, 'image_confession');
      setImageUrl(url);
    } catch {
      const url = URL.createObjectURL(file);
      setImageUrl(url);
    } finally {
      setIsUploading(false);
    }
  };

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !imageUrl) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        content,
        imageUrl: imageUrl || undefined,
        imageContext: imageContext || undefined,
        tags,
      });
      setContent('');
      setTags([]);
      setCurrentTag('');
      setImageUrl(null);
      setImageContext('');
      setShowImageSection(false);
      setShowTagSection(false);
    } catch (err) {
      console.error('Error submitting confession:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canPost = (content.trim().length > 0 || !!imageUrl) && !isSubmitting && !isUploading;

  return (
    <div className="post-card mb-2 animate-fade-up">
      <form onSubmit={handleSubmit}>
        {/* Text area */}
        <div className="px-4 pt-4 pb-2">
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

        {/* Image section */}
        {showImageSection && (
          <div className="px-4 pb-3 animate-fade-in">
            <ImageUploader
              imageUrl={imageUrl}
              setImageUrl={setImageUrl}
              handleFileUpload={handleFileUpload}
              imageContext={imageContext}
              setImageContext={setImageContext}
            />
          </div>
        )}

        {/* Image preview */}
        {imageUrl && !showImageSection && (
          <div className="px-4 pb-3 relative">
            <img
              src={imageUrl}
              alt="Attached"
              className="w-full max-h-64 object-cover rounded-xl"
            />
            <button
              type="button"
              onClick={() => setImageUrl(null)}
              className="absolute top-2 right-6 p-1.5 bg-black/70 rounded-full text-white hover:bg-black"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Tag section */}
        {showTagSection && (
          <div className="px-4 pb-3 animate-fade-in space-y-2">
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
                    <button type="button" onClick={() => removeTag(t)} className="hover:text-white">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Bottom toolbar */}
        <div className="divider" />
        <div className="px-4 py-2 flex items-center justify-between">
          {/* Media / tag toggles */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShowImageSection(!showImageSection)}
              className={`action-btn ${(showImageSection || imageUrl) ? 'text-[#ff2d55]' : ''}`}
              title="Attach image"
            >
              <Image className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setShowTagSection(!showTagSection)}
              className={`action-btn ${showTagSection || tags.length > 0 ? 'text-[#7c3aed]' : ''}`}
              title="Add tags"
            >
              <Tag className="w-4 h-4" />
              {tags.length > 0 && (
                <span className="text-xs font-medium text-[#7c3aed]">{tags.length}</span>
              )}
            </button>
          </div>

          {/* Post button */}
          <button
            type="submit"
            disabled={!canPost}
            className="btn-brand"
          >
            {isUploading ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Uploading
              </span>
            ) : isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Posting
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Send className="w-3.5 h-3.5" />
                Post
              </span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ConfessionForm;
