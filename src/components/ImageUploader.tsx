
import { Image } from 'lucide-react';

interface ImageUploaderProps {
  imageUrl: string | null;
  setImageUrl: (url: string | null) => void;
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const ImageUploader = ({ imageUrl, handleFileUpload }: ImageUploaderProps) => {
  return (
    <div className="p-3 border-2 border-retro-cyber-yellow bg-black/70">
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
