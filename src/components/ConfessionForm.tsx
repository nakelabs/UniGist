import { useState } from 'react';
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
    imageSelfDestruct?: boolean;
    tags?: string[];
    buildingFlair?: string;
    poll?: { question: string; options: string[] };
  }) => Promise<void>;
}

const SUGGESTED_TAGS = ['university', 'relationships', 'work', 'family', 'secrets', 'funny'];
const BUILDING_FLAIRS = ['📍 Main Library', '📍 Freshman Dorms', '📍 Science Block', '📍 Cafeteria', '📍 Student Union', '📍 Gym'];

const ConfessionForm = ({ onSubmit }: ConfessionFormProps) => {
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageContext, setImageContext] = useState('');
  const [imageSelfDestruct, setImageSelfDestruct] = useState(false);
  
  const [buildingFlair, setBuildingFlair] = useState('');
  const [showFlairSection, setShowFlairSection] = useState(false);
  
  const [showPollSection, setShowPollSection] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);

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
        imageSelfDestruct: imageUrl ? imageSelfDestruct : undefined,
        tags,
        buildingFlair: buildingFlair || undefined,
        poll: showPollSection && pollQuestion.trim() && pollOptions.filter(o => o.trim()).length >= 2 
          ? { question: pollQuestion.trim(), options: pollOptions.filter(o => o.trim()) } 
          : undefined,
      });
      setContent('');
      setTags([]);
      setCurrentTag('');
      setImageUrl(null);
      setImageContext('');
      setImageSelfDestruct(false);
      setBuildingFlair('');
      setPollQuestion('');
      setPollOptions(['', '']);
      setShowImageSection(false);
      setShowTagSection(false);
      setShowFlairSection(false);
      setShowPollSection(false);
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
            <div className="mt-3 flex items-center gap-2 px-1">
              <input 
                type="checkbox" 
                id="self-destruct" 
                checked={imageSelfDestruct}
                onChange={(e) => setImageSelfDestruct(e.target.checked)}
                className="w-4 h-4 rounded border-gray-600 text-[#ff2d55] focus:ring-[#ff2d55] bg-gray-800"
              />
              <label htmlFor="self-destruct" className="text-sm text-[#ccc] flex items-center gap-1 cursor-pointer">
                <span className="text-[#ff2d55] font-bold text-xs tracking-wide">5s</span>
                Self-destruct image (blurs after 5 seconds of viewing)
              </label>
            </div>
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
              className="absolute top-2 right-6 p-1.5 bg-black/70 rounded-full text-white hover:bg-black text-xs leading-none font-bold"
            >
              ×
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
                    <button type="button" onClick={() => removeTag(t)} className="hover:text-white text-xs leading-none font-bold ml-0.5">
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Flair section */}
        {showFlairSection && (
          <div className="px-4 pb-3 animate-fade-in">
            <p className="text-xs text-[#888] mb-2 uppercase tracking-wider font-semibold">Campus Location</p>
            <div className="flex flex-wrap gap-1.5">
              {BUILDING_FLAIRS.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setBuildingFlair(buildingFlair === f ? '' : f)}
                  className={`tag-pill cursor-pointer transition-colors ${buildingFlair === f ? 'bg-white/20 text-white border-white/30' : 'hover:border-white/20 hover:text-white'}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Poll section */}
        {showPollSection && (
          <div className="px-4 pb-3 animate-fade-in space-y-3">
            <p className="text-xs text-[#888] uppercase tracking-wider font-semibold">Anonymous Poll</p>
            <input
              type="text"
              value={pollQuestion}
              onChange={(e) => setPollQuestion(e.target.value)}
              placeholder="Ask a question..."
              className="field py-2 font-medium"
              maxLength={100}
            />
            <div className="space-y-2">
              {pollOptions.map((opt, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => {
                      const newOpts = [...pollOptions];
                      newOpts[i] = e.target.value;
                      setPollOptions(newOpts);
                    }}
                    placeholder={`Option ${i + 1}`}
                    className="field py-1.5 text-sm"
                    maxLength={50}
                  />
                  {pollOptions.length > 2 && (
                    <button
                      type="button"
                      onClick={() => setPollOptions(pollOptions.filter((_, idx) => idx !== i))}
                      className="p-2 text-[#555] hover:text-[#ff2d55] text-lg leading-none font-medium"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
            {pollOptions.length < 4 && (
              <button
                type="button"
                onClick={() => setPollOptions([...pollOptions, ''])}
                className="text-xs text-[#7c3aed] font-medium hover:underline"
              >
                + Add Option
              </button>
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
              className={`action-btn text-xs font-semibold tracking-wide ${(showImageSection || imageUrl) ? 'text-[#ff2d55]' : ''}`}
              title="Attach image"
            >
              Photo
            </button>
            <button
              type="button"
              onClick={() => setShowTagSection(!showTagSection)}
              className={`action-btn text-xs font-semibold tracking-wide ${showTagSection || tags.length > 0 ? 'text-[#7c3aed]' : ''}`}
              title="Add tags"
            >
              Tags{tags.length > 0 && <span className="ml-1 text-[#7c3aed]">({tags.length})</span>}
            </button>
            <button
              type="button"
              onClick={() => setShowFlairSection(!showFlairSection)}
              className={`action-btn text-xs font-semibold tracking-wide ${showFlairSection || buildingFlair ? 'text-[#00c853]' : ''}`}
              title="Add location flair"
            >
              Location
            </button>
            <button
              type="button"
              onClick={() => setShowPollSection(!showPollSection)}
              className={`action-btn text-xs font-semibold tracking-wide ${showPollSection || pollQuestion ? 'text-[#ff9100]' : ''}`}
              title="Create a poll"
            >
              Poll
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
              <span>Post</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ConfessionForm;
