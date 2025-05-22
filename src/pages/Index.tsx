
import { useState, useEffect, useRef } from 'react';
import { Heart, ArrowUp, ArrowDown, Mic, Upload, Image, Video } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Post {
  id: number;
  content: string;
  timestamp: Date;
  upvotes: number;
  downvotes: number;
  isNew: boolean;
  audioUrl?: string;
  videoUrl?: string;
  imageUrl?: string;
}

const Index = () => {
  const [posts, setPosts] = useState<Post[]>([
    {
      id: 1,
      content: "I secretly love pineapple on pizza and I'm tired of pretending I don't! 🍕",
      timestamp: new Date(Date.now() - 1000 * 60 * 15),
      upvotes: 42,
      downvotes: 7,
      isNew: false
    },
    {
      id: 2,
      content: "My professor doesn't know I've been using ChatGPT for all my essays this semester... and I'm getting A's 😬",
      timestamp: new Date(Date.now() - 1000 * 60 * 45),
      upvotes: 128,
      downvotes: 23,
      isNew: false
    },
    {
      id: 3,
      content: "I pretend to be asleep when my roommate brings dates over because I like hearing the drama unfold 👀",
      timestamp: new Date(Date.now() - 1000 * 60 * 120),
      upvotes: 89,
      downvotes: 12,
      isNew: false
    }
  ]);
  const [newConfession, setNewConfession] = useState('');
  const [nextId, setNextId] = useState(4);
  
  // Audio recording states
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  
  // Video recording states
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const videoMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoChunksRef = useRef<BlobPart[]>([]);
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  // Image upload state
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  
  const { toast } = useToast();

  // Clean up media streams when component unmounts
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newConfession.trim() && !audioUrl && !videoUrl && !imageUrl) return;

    const newPost: Post = {
      id: nextId,
      content: newConfession,
      timestamp: new Date(),
      upvotes: 0,
      downvotes: 0,
      isNew: true,
      audioUrl: audioUrl || undefined,
      videoUrl: videoUrl || undefined,
      imageUrl: imageUrl || undefined
    };

    setPosts([newPost, ...posts]);
    setNewConfession('');
    setAudioUrl(null);
    setAudioBlob(null);
    setVideoUrl(null);
    setVideoBlob(null);
    setImageUrl(null);
    setNextId(nextId + 1);

    // Mark as no longer new after 10 seconds
    setTimeout(() => {
      setPosts(prev => prev.map(post => 
        post.id === newPost.id ? { ...post, isNew: false } : post
      ));
    }, 10000);

    toast({
      title: "Confession Posted! 🎉",
      description: "Your secret is now part of the digital void...",
    });
  };

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

  const handleVote = (id: number, type: 'up' | 'down') => {
    setPosts(prev => prev.map(post => 
      post.id === id 
        ? { 
            ...post, 
            upvotes: type === 'up' ? post.upvotes + 1 : post.upvotes,
            downvotes: type === 'down' ? post.downvotes + 1 : post.downvotes
          }
        : post
    ));
  };

  const handleReport = (id: number) => {
    toast({
      title: "Post Reported 🚨",
      description: "Thanks for keeping our digital chaos clean!",
    });
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <div className="min-h-screen bg-black text-retro-neon-green relative overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-10 left-10 w-4 h-4 bg-retro-hot-pink animate-bounce-retro opacity-60"></div>
        <div className="absolute top-20 right-20 w-3 h-3 bg-retro-cyber-yellow animate-blink opacity-80"></div>
        <div className="absolute bottom-20 left-20 w-5 h-5 bg-retro-electric-blue animate-pulse opacity-70"></div>
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 
            className="glitch-text font-pixel text-4xl md:text-6xl text-retro-neon-green mb-4 animate-glow"
            data-text="UniGist"
          >
            UniGist
          </h1>
          <p className="font-cyber text-lg md:text-xl text-retro-hot-pink animate-blink">
            Your secrets, your voice, your drama. 💫
          </p>
          <div className="mt-4 font-pixel text-xs text-retro-cyber-yellow">
            ★ ANONYMOUS ★ CHAOTIC ★ LEGENDARY ★
          </div>
        </header>

        {/* Confession Form */}
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
              <div className="p-3 border-2 border-retro-electric-blue bg-black/70">
                <h3 className="text-retro-cyber-yellow font-cyber text-sm mb-3">Audio Confession:</h3>
                <div className="flex flex-wrap gap-3 items-center">
                  <button
                    type="button"
                    onClick={isRecording ? handleStopRecording : handleStartRecording}
                    className={`retro-button flex items-center ${isRecording ? 'bg-retro-hot-pink animate-pulse' : ''}`}
                    disabled={isRecordingVideo}
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

              {/* Video controls */}
              <div className="p-3 border-2 border-retro-hot-pink bg-black/70">
                <h3 className="text-retro-cyber-yellow font-cyber text-sm mb-3">Video Confession:</h3>
                <div className="flex flex-wrap gap-3 items-center">
                  <button
                    type="button"
                    onClick={isRecordingVideo ? handleStopVideoRecording : handleStartVideoRecording}
                    className={`retro-button flex items-center ${isRecordingVideo ? 'bg-retro-hot-pink animate-pulse' : ''}`}
                    disabled={isRecording}
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

              {/* Image upload */}
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

        {/* Posts Feed */}
        <div className="max-w-4xl mx-auto space-y-6">
          <h2 className="font-pixel text-xl text-center text-retro-neon-green mb-8 animate-glow">
            🔥 THE CONFESSION FEED 🔥
          </h2>
          
          {posts.map((post) => (
            <div key={post.id} className="retro-card relative">
              {post.isNew && (
                <div className="absolute -top-2 -right-2 bg-retro-cyber-yellow text-black font-pixel text-xs px-2 py-1 animate-blink">
                  NEW!
                </div>
              )}
              
              <div className="flex justify-between items-start mb-3">
                <span className="font-cyber text-sm text-retro-electric-blue">
                  Anonymous Ghost #{post.id}
                </span>
                <div className="flex items-center space-x-2">
                  <span className="font-cyber text-xs text-retro-hot-pink">
                    {formatTimeAgo(post.timestamp)}
                  </span>
                  <button
                    onClick={() => handleReport(post.id)}
                    className="font-cyber text-xs text-retro-cyber-yellow hover:text-white transition-colors underline"
                  >
                    report
                  </button>
                </div>
              </div>

              {post.content && (
                <p className="font-cyber text-retro-neon-green mb-4 leading-relaxed">
                  {post.content}
                </p>
              )}
              
              {post.imageUrl && (
                <div className="mb-4 border-2 border-retro-hot-pink p-2">
                  <img src={post.imageUrl} alt="Confession" className="max-w-full h-auto" />
                </div>
              )}
              
              {post.videoUrl && (
                <div className="mb-4 border-2 border-retro-electric-blue p-2">
                  <video controls src={post.videoUrl} className="w-full">
                    Your browser does not support video playback
                  </video>
                </div>
              )}
              
              {post.audioUrl && (
                <div className="mb-4">
                  <audio controls src={post.audioUrl} className="w-full">
                    Your browser does not support audio playback
                  </audio>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => handleVote(post.id, 'up')}
                    className="flex items-center space-x-1 text-retro-neon-green hover:text-retro-cyber-yellow transition-colors group"
                  >
                    <ArrowUp className="w-4 h-4 group-hover:animate-bounce-retro" />
                    <span className="font-cyber text-sm">{post.upvotes}</span>
                  </button>
                  
                  <button
                    onClick={() => handleVote(post.id, 'down')}
                    className="flex items-center space-x-1 text-retro-hot-pink hover:text-retro-cyber-yellow transition-colors group"
                  >
                    <ArrowDown className="w-4 h-4 group-hover:animate-bounce-retro" />
                    <span className="font-cyber text-sm">{post.downvotes}</span>
                  </button>
                </div>

                <div className="flex items-center space-x-1 text-retro-electric-blue">
                  <Heart className="w-4 h-4" />
                  <span className="font-cyber text-sm">
                    {post.upvotes - post.downvotes} vibes
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <footer className="mt-16 text-center">
          <div className="retro-card max-w-lg mx-auto">
            <p className="font-pixel text-xs text-retro-cyber-yellow mb-2 animate-blink">
              ⚠️ DISCLAIMER ⚠️
            </p>
            <p className="font-cyber text-sm text-retro-hot-pink">
              We know nothing. We saw nothing. 
              <br />
              Your secrets are safe in the digital void. 🌌
            </p>
            <div className="mt-4 font-pixel text-xs text-retro-neon-green">
              Made with 💀 and early 2000s nostalgia
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Index;
