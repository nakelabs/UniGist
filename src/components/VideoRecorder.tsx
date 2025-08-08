import { Upload, MessageSquare } from 'lucide-react';

interface VideoRecorderProps {
  videoUrl: string | null;
  setVideoUrl: (url: string | null) => void;
  setVideoBlob: (blob: Blob | null) => void;
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  videoContext: string;
  setVideoContext: (context: string) => void;
}

const VideoRecorder = ({ videoUrl, setVideoUrl, setVideoBlob, handleFileUpload, videoContext, setVideoContext }: VideoRecorderProps) => {
  return (
    <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-sm rounded-3xl p-6 border border-gray-700/50">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-3 h-3 bg-gradient-to-r from-retro-hot-pink to-retro-cyber-yellow rounded-full animate-pulse"></div>
        <h3 className="text-retro-cyber-yellow font-cyber text-sm uppercase tracking-wider">Video Upload</h3>
      </div>
      
      <div className="flex justify-center">
        <label className="group cursor-pointer">
          <div className="flex flex-col items-center gap-3 px-6 py-8 bg-gradient-to-r from-retro-hot-pink/10 to-retro-cyber-yellow/10 border-2 border-dashed border-retro-hot-pink/40 rounded-2xl hover:border-retro-hot-pink/60 hover:bg-gradient-to-r hover:from-retro-hot-pink/20 hover:to-retro-cyber-yellow/20 transition-all duration-300">
            <div className="w-12 h-12 bg-gradient-to-r from-retro-hot-pink/20 to-retro-cyber-yellow/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Upload className="w-6 h-6 text-retro-hot-pink" />
            </div>
            <div className="text-center">
              <div className="text-retro-hot-pink font-cyber text-sm font-bold">Upload Video File</div>
              <div className="text-retro-electric-blue/70 font-cyber text-xs mt-1">
                Click to select your video confession
              </div>
              <div className="text-gray-400 font-cyber text-xs mt-1">
                MP4, WebM, AVI • Max 50MB
              </div>
            </div>
          </div>
          <input
            type="file"
            accept="video/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      </div>
      
      {/* Video Context Text Input */}
      <div className="mt-6">
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare className="w-4 h-4 text-retro-electric-blue" />
          <label className="text-retro-electric-blue font-cyber text-sm">
            Add context to your video (optional):
          </label>
        </div>
        <textarea
          value={videoContext}
          onChange={(e) => setVideoContext(e.target.value)}
          placeholder="Describe what's happening in your video, provide background context, or explain why this moment matters..."
          className="w-full h-24 resize-none bg-gray-900/50 border border-retro-electric-blue/30 rounded-2xl p-4 text-retro-neon-green font-cyber text-sm focus:outline-none focus:border-retro-cyber-yellow focus:ring-1 focus:ring-retro-cyber-yellow transition-all"
          maxLength={300}
        />
        <div className="flex justify-between items-center mt-2">
          <span className="text-xs text-retro-electric-blue/60 font-cyber">
            Help viewers understand your video better
          </span>
          <span className="text-xs text-retro-cyber-yellow/70 font-cyber">
            {videoContext.length}/300
          </span>
        </div>
      </div>
      
      {videoUrl && (
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 bg-retro-cyber-yellow rounded-full animate-pulse"></div>
            <p className="text-retro-cyber-yellow font-cyber text-xs uppercase tracking-wide">Video Preview:</p>
          </div>
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-retro-cyber-yellow/20 to-retro-hot-pink/20 rounded-2xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <video 
              controls 
              src={videoUrl} 
              className="relative w-full h-auto rounded-2xl border-2 border-retro-cyber-yellow/50 shadow-lg shadow-retro-cyber-yellow/20"
            >
              Your browser does not support video playback
            </video>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoRecorder;
