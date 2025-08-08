
import { useState, useRef } from 'react';
import { Mic, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { uploadFile } from '@/lib/fileUpload';

interface AudioRecorderProps {
  audioUrl: string | null;
  setAudioUrl: (url: string | null) => void;
  setAudioBlob: (blob: Blob | null) => void;
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isUploading?: boolean;
}

const AudioRecorder = ({ audioUrl, setAudioUrl, setAudioBlob, handleFileUpload, isUploading = false }: AudioRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isUploadingRecording, setIsUploadingRecording] = useState(false);
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

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        
        // Upload the recorded audio to Supabase Storage
        setIsUploadingRecording(true);
        try {
          console.log("Uploading recorded audio...");
          const permanentUrl = await uploadFile(audioBlob, 'recorded_audio');
          setAudioUrl(permanentUrl);
          
          toast({
            title: "Recording Saved! 🎤✅",
            description: "Your audio confession has been uploaded successfully.",
          });
        } catch (error) {
          console.error('Error uploading recorded audio:', error);
          // Fallback to local URL if upload fails
          const localUrl = URL.createObjectURL(audioBlob);
          setAudioUrl(localUrl);
          
          toast({
            title: "Recording Saved Locally 🎤⚠️",
            description: "Audio saved but upload failed. May not persist after refresh.",
            variant: "destructive"
          });
        } finally {
          setIsUploadingRecording(false);
        }

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
        title: "Processing Recording... �",
        description: "Uploading your audio confession...",
      });
    }
  };
  
  return (
    <div className="p-4 border-2 border-retro-electric-blue bg-black/70 rounded-2xl">
      <h3 className="text-retro-cyber-yellow font-cyber text-sm mb-3">Audio Confession:</h3>
      <div className="flex flex-wrap gap-3 items-center">
        <button
          type="button"
          onClick={isRecording ? handleStopRecording : handleStartRecording}
          className={`retro-button flex items-center ${isRecording ? 'bg-retro-hot-pink animate-pulse' : ''}`}
          disabled={isUploadingRecording}
        >
          <Mic className="w-4 h-4 mr-2" />
          {isRecording ? 'STOP RECORDING' : isUploadingRecording ? 'UPLOADING...' : 'RECORD AUDIO'}
        </button>
        
        <label className={`retro-button flex items-center cursor-pointer ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
          <Upload className="w-4 h-4 mr-2" />
          {isUploading ? 'UPLOADING...' : 'UPLOAD AUDIO'}
          <input
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            className="hidden"
            disabled={isUploading}
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
