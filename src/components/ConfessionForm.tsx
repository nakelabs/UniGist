
import { useState, useRef } from 'react';
import { Mic, Upload, Image, Video, Tag, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import AudioRecorder from './AudioRecorder';
import VideoRecorder from './VideoRecorder';
import ImageUploader from './ImageUploader';

interface ConfessionFormProps {
  onSubmit: (confession: {
    content: string;
    audioUrl?: string;
    videoUrl?: string;
    imageUrl?: string;
    tags?: string[];
  }) => void;
}

const ConfessionForm = ({ onSubmit }: ConfessionFormProps) => {
  const [newConfession, setNewConfession] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  const { toast } = useToast();
  
  // Audio recording states
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  
  // Video recording states
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  
  // Image upload state
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const addTag = () => {
    const trimmedTag = currentTag.trim().toLowerCase();
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < 5) {
      setTags([...tags, trimmedTag]);
      setCurrentTag('');
    } else if (tags.length >= 5) {
      toast({
        title: "Tag Limit Reached! 🏷️",
        description: "You can only add up to 5 tags per confession.",
      });
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newConfession.trim() && !audioUrl && !videoUrl && !imageUrl) return;

    onSubmit({
      content: newConfession,
      audioUrl: audioUrl || undefined,
      videoUrl: videoUrl || undefined,
      imageUrl: imageUrl || undefined,
      tags: tags
    });

    setNewConfession('');
    setTags([]);
    setCurrentTag('');
    setAudioUrl(null);
    setAudioBlob(null);
    setVideoUrl(null);
    setVideoBlob(null);
    setImageUrl(null);

    toast({
      title: "Confession Posted! 🎉",
      description: "Your secret is now part of the digital void...",
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
      setAudioBlob(file);
      
      toast({
        title: "Audio Uploaded! 🎧",
        description: "Preview your audio confession before posting.",
      });
    } else if (file && file.type.startsWith('video/')) {
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      setVideoBlob(file);
      
      toast({
        title: "Video Uploaded! 🎬",
        description: "Preview your video confession before posting.",
      });
    } else if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setImageUrl(url);
      
      toast({
        title: "Image Uploaded! 🖼️",
        description: "Preview your image confession before posting.",
      });
    } else if (file) {
      toast({
        title: "Invalid File! ⚠️",
        description: "Please upload an audio, video, or image file.",
      });
    }
  };

  return (
    <div className="retro-card max-w-2xl mx-auto mb-12">
      <h2 className="font-pixel text-lg text-retro-cyber-yellow mb-4 animate-glow">
        🗣️ SPILL THE TEA
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          value={newConfession}
          onChange={(e) => setNewConfession(e.target.value)}
          placeholder="Type your anonymous confession here... no judgment, just vibes ✨"
          className="retro-input w-full h-32 resize-none"
          maxLength={500}
        />

        {/* Tags Input */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-retro-cyber-yellow" />
            <label className="font-cyber text-sm text-retro-pastel-blue">
              Add tags (optional, max 5):
            </label>
          </div>
          
          <div className="flex gap-2">
            <input
              type="text"
              value={currentTag}
              onChange={(e) => setCurrentTag(e.target.value)}
              onKeyPress={handleTagKeyPress}
              placeholder="Type a tag and press Enter..."
              className="flex-1 bg-gray-900/50 border border-retro-electric-blue/30 rounded p-2 text-retro-pastel-blue font-cyber text-sm focus:outline-none focus:border-retro-cyber-yellow"
              maxLength={20}
            />
            <button
              type="button"
              onClick={addTag}
              disabled={!currentTag.trim() || tags.length >= 5}
              className="px-3 py-2 bg-retro-cyber-yellow text-black font-pixel text-xs hover:bg-retro-neon-green disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add
            </button>
          </div>

          {/* Display current tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className="flex items-center gap-1 px-2 py-1 bg-retro-electric-blue/20 border border-retro-electric-blue/40 text-retro-electric-blue font-pixel text-xs"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="text-retro-hot-pink hover:text-retro-cyber-yellow ml-1"
                    title="Remove tag"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="text-xs text-retro-electric-blue/70">
            Suggested tags: #university #relationships #work #family #secrets #funny #embarrassing
          </div>
        </div>
        
        {/* Media Recording and Upload Section */}
        <div className="space-y-4">
          {/* Audio controls */}
          <AudioRecorder 
            audioUrl={audioUrl} 
            setAudioUrl={setAudioUrl}
            setAudioBlob={setAudioBlob}
            handleFileUpload={handleFileUpload}
          />

          {/* Video controls */}
          <VideoRecorder 
            videoUrl={videoUrl}
            setVideoUrl={setVideoUrl}
            setVideoBlob={setVideoBlob}
            handleFileUpload={handleFileUpload}
          />

          {/* Image upload */}
          <ImageUploader 
            imageUrl={imageUrl}
            setImageUrl={setImageUrl}
            handleFileUpload={handleFileUpload}
          />
        </div>
        
        <div className="flex justify-between items-center">
          <span className="font-cyber text-sm text-retro-electric-blue">
            {500 - newConfession.length} characters left
          </span>
          <button
            type="submit"
            className="retro-button"
            disabled={!newConfession.trim() && !audioUrl && !videoUrl && !imageUrl}
          >
            CONFESS NOW! 🚀
          </button>
        </div>
      </form>
    </div>
  );
};

export default ConfessionForm;
