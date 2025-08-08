
import { Image } from 'lucide-react';

interface ImageUploaderProps {
  imageUrl: string | null;
  setImageUrl: (url: string | null) => void;
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  imageContext: string;
  setImageContext: (context: string) => void;
}

const ImageUploader = ({ imageUrl, handleFileUpload, imageContext, setImageContext }: ImageUploaderProps) => {
  return (
    <div className="p-4 border-2 border-retro-cyber-yellow bg-black/70 rounded-2xl">
      <h3 className="text-retro-cyber-yellow font-cyber text-sm mb-3">Image Confession:</h3>
      <div className="flex flex-wrap gap-3 items-center">
        <label className="retro-button flex items-center cursor-pointer">
          <Image className="w-4 h-4 mr-2" />
          UPLOAD IMAGE
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      </div>

      <div className="mt-3">
        <label className="block text-retro-cyber-yellow font-cyber text-xs mb-1">
          Image Context (optional):
        </label>
        <textarea
          value={imageContext}
          onChange={(e) => setImageContext(e.target.value)}
          placeholder="Add context or description for your image..."
          className="w-full p-2 bg-black/50 border border-retro-neon-green rounded-lg text-white placeholder-gray-400 resize-none"
          rows={2}
          maxLength={200}
        />
        <div className="text-right text-xs text-gray-400 mt-1">
          {imageContext.length}/200
        </div>
      </div>
      
      {imageUrl && (
        <div className="mt-3">
          <p className="text-retro-cyber-yellow font-cyber text-xs mb-1">Image Preview:</p>
          <img src={imageUrl} alt="Confession" className="max-w-full h-auto border-2 border-retro-neon-green" />
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
