
interface ImageUploaderProps {
  imageUrl: string | null;
  setImageUrl: (url: string | null) => void;
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  imageContext: string;
  setImageContext: (context: string) => void;
}

const ImageUploader = ({ imageUrl, handleFileUpload, imageContext, setImageContext }: ImageUploaderProps) => {
  return (
    <div className="rounded-xl border border-[#2a2a2a] bg-[#141414] p-4 space-y-3">
      {/* Upload trigger */}
      <div className="flex items-center gap-3">
        <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#2a2a2a] hover:border-[#444] text-sm font-medium text-[#888] hover:text-white transition-all duration-200 bg-transparent">
          <span className="text-base leading-none">+</span>
          Choose image
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
        {imageUrl && (
          <span className="text-xs text-[#00c853] font-medium">Image attached</span>
        )}
      </div>

      {/* Context input */}
      <div>
        <label className="block text-xs text-[#555] mb-1.5 uppercase tracking-wider font-semibold">
          Caption (optional)
        </label>
        <textarea
          value={imageContext}
          onChange={(e) => setImageContext(e.target.value)}
          placeholder="Add context or description..."
          className="field py-2 text-sm"
          rows={2}
          maxLength={200}
        />
        <div className="text-right text-xs text-[#444] mt-1">
          {imageContext.length}/200
        </div>
      </div>

      {/* Preview */}
      {imageUrl && (
        <div className="relative rounded-xl overflow-hidden">
          <img src={imageUrl} alt="Preview" className="w-full max-h-56 object-cover" />
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
