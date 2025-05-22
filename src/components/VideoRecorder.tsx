import { useState, useRef, useEffect } from 'react';
import { Video, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VideoRecorderProps {
  videoUrl: string | null;
  setVideoUrl: (url: string | null) => void;
  setVideoBlob: (blob: Blob | null) => void;
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const VideoRecorder = ({ videoUrl, setVideoUrl, setVideoBlob, handleFileUpload }: VideoRecorderProps) => {
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const videoMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoChunksRef = useRef<BlobPart[]>([]);
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  // Clean up media streams when component unmounts
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleStartVideoRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      videoChunksRef.current = [];
      streamRef.current = stream;
      
      // Show video preview
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
        videoPreviewRef.current.play();
      }
      
      const mediaRecorder = new MediaRecorder(stream);
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          videoChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const videoBlob = new Blob(videoChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(videoBlob);
        setVideoBlob(videoBlob);
        setVideoUrl(url);

        // Stop preview and release camera
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = null;
        }
        stream.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      };

      videoMediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecordingVideo(true);
      
      toast({
        title: "Video Recording Started! 🎬",
        description: "Action! Your drama is being captured...",
      });
    } catch (err) {
      console.error("Error accessing camera:", err);
      toast({
        title: "Camera Error 📵",
        description: "Couldn't access your camera. Check permissions.",
      });
    }
  };

  const handleStopVideoRecording = () => {
    if (videoMediaRecorderRef.current) {
      videoMediaRecorderRef.current.stop();
      setIsRecordingVideo(false);
      
      toast({
        title: "Video Recording Completed! 🎥",
        description: "Preview your video confession before posting.",
      });
    }
  };

  return (
    <div className="p-3 border-2 border-retro-hot-pink bg-black/70">
      <h3 className="text-retro-cyber-yellow font-cyber text-sm mb-3">Video Confession:</h3>
      <div className="flex flex-wrap gap-3 items-center">
        <button
          type="button"
          onClick={isRecordingVideo ? handleStopVideoRecording : handleStartVideoRecording}
          className={`retro-button flex items-center ${isRecordingVideo ? 'bg-retro-hot-pink animate-pulse' : ''}`}
        >
          <Video className="w-4 h-4 mr-2" />
          {isRecordingVideo ? 'STOP RECORDING' : 'RECORD VIDEO'}
        </button>
        
        <label className="retro-button flex items-center cursor-pointer">
          <Upload className="w-4 h-4 mr-2" />
          UPLOAD VIDEO
          <input
            type="file"
            accept="video/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      </div>

      {isRecordingVideo && (
        <div className="mt-3 border-2 border-retro-neon-green p-2">
          <p className="text-retro-hot-pink font-cyber text-xs mb-1">📹 LIVE RECORDING:</p>
          <video 
            ref={videoPreviewRef} 
            className="w-full h-auto" 
            muted 
          />
        </div>
      )}
      
      {videoUrl && !isRecordingVideo && (
        <div className="mt-3">
          <p className="text-retro-cyber-yellow font-cyber text-xs mb-1">Video Preview:</p>
          <video controls src={videoUrl} className="w-full h-auto">
            Your browser does not support video playback
          </video>
        </div>
      )}
    </div>
  );
};

export default VideoRecorder;
