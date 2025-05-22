
import { useState, useRef } from 'react';
import { Mic, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AudioRecorderProps {
  audioUrl: string | null;
  setAudioUrl: (url: string | null) => void;
  setAudioBlob: (blob: Blob | null) => void;
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const AudioRecorder = ({ audioUrl, setAudioUrl, setAudioBlob, handleFileUpload }: AudioRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const { toast } = useToast();

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const url = URL.createObjectURL(audioBlob);
        setAudioBlob(audioBlob);
        setAudioUrl(url);

        // Release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      
      toast({
        title: "Recording Started! 🎤",
        description: "Spill your audio tea...",
      });
    } catch (err) {
      console.error("Error accessing microphone:", err);
      toast({
        title: "Microphone Error 🔇",
        description: "Couldn't access your microphone. Check permissions.",
      });
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      toast({
        title: "Recording Completed! 🔊",
        description: "Preview your audio confession before posting.",
      });
    }
  };
  
  return (
    <div className="p-3 border-2 border-retro-electric-blue bg-black/70">
      <h3 className="text-retro-cyber-yellow font-cyber text-sm mb-3">Audio Confession:</h3>
      <div className="flex flex-wrap gap-3 items-center">
        <button
          type="button"
          onClick={isRecording ? handleStopRecording : handleStartRecording}
          className={`retro-button flex items-center ${isRecording ? 'bg-retro-hot-pink animate-pulse' : ''}`}
        >
          <Mic className="w-4 h-4 mr-2" />
          {isRecording ? 'STOP RECORDING' : 'RECORD AUDIO'}
        </button>
        
        <label className="retro-button flex items-center cursor-pointer">
          <Upload className="w-4 h-4 mr-2" />
          UPLOAD AUDIO
          <input
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      </div>
      
      {audioUrl && (
        <div className="mt-3">
          <p className="text-retro-cyber-yellow font-cyber text-xs mb-1">Audio Preview:</p>
          <audio controls src={audioUrl} className="w-full">
            Your browser does not support audio playback
          </audio>
        </div>
      )}
    </div>
  );
};

export default AudioRecorder;
