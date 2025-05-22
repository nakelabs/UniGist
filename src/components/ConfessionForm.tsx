
import { useState, useRef } from 'react';
import { Mic, Upload, Image, Video } from 'lucide-react';
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
  }) => void;
}

const ConfessionForm = ({ onSubmit }: ConfessionFormProps) => {
  const [newConfession, setNewConfession] = useState('');
  const { toast } = useToast();
  
  // Audio recording states
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  
  // Video recording states
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  
  // Image upload state
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newConfession.trim() && !audioUrl && !videoUrl && !imageUrl) return;

    onSubmit({
      content: newConfession,
      audioUrl: audioUrl || undefined,
      videoUrl: videoUrl || undefined,
      imageUrl: imageUrl || undefined
    });

    setNewConfession('');
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
