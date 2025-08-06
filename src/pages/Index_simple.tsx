import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import PageHeader from '@/components/PageHeader';
import ConfessionForm from '@/components/ConfessionForm';
import PageFooter from '@/components/PageFooter';
import { ConfessionWithComments } from '@/hooks/useConfessions';

const Index = () => {
  const [posts, setPosts] = useState<ConfessionWithComments[]>([]);
  const [nextId, setNextId] = useState(1);
  const { toast } = useToast();

  const handleSubmitConfession = async (confession: {
    content: string;
    audioUrl?: string;
    videoUrl?: string;
    imageUrl?: string;
    tags?: string[];
  }) => {
    const newPost: ConfessionWithComments = {
      id: nextId.toString(),
      content: confession.content,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      upvotes: 0,
      downvotes: 0,
      audio_url: confession.audioUrl || null,
      video_url: confession.videoUrl || null,
      image_url: confession.imageUrl || null,
      tags: confession.tags || [],
      comments: [],
      showComments: false,
      isNew: true
    };

    setPosts(prevPosts => [newPost, ...prevPosts]);
    setNextId(prev => prev + 1);

    toast({
      title: "Confession Posted! 🎭",
      description: "Your anonymous confession has been shared.",
    });
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
        <PageHeader />
        
        <div className="mb-12">
          <ConfessionForm onSubmit={handleSubmitConfession} />
        </div>
        
        {/* Simple Posts Display */}
        <div className="max-w-4xl mx-auto space-y-6">
          <h2 className="font-pixel text-xl text-center text-retro-neon-green animate-glow">
            🔥 THE CONFESSION FEED 🔥
          </h2>
          
          {posts.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-retro-electric-blue font-cyber text-lg mb-2">
                No confessions yet... 👻
              </div>
              <div className="text-retro-neon-green font-cyber text-sm">
                Be the first to share your secret!
              </div>
            </div>
          ) : (
            posts.map((post) => (
              <div key={post.id} className="retro-card p-6">
                <div className="space-y-4">
                  <p className="text-retro-neon-green font-cyber">{post.content}</p>
                  
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {post.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-retro-electric-blue/20 border border-retro-electric-blue/40 text-retro-electric-blue font-pixel text-xs"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {post.image_url && (
                    <img
                      src={post.image_url}
                      alt="Confession image"
                      className="max-w-full h-auto rounded border-2 border-retro-cyber-yellow"
                    />
                  )}
                  
                  {post.audio_url && (
                    <audio
                      controls
                      className="w-full"
                    >
                      <source src={post.audio_url} type="audio/webm" />
                      <source src={post.audio_url} type="audio/mp3" />
                      Your browser does not support the audio element.
                    </audio>
                  )}
                  
                  {post.video_url && (
                    <video
                      controls
                      className="max-w-full h-auto rounded border-2 border-retro-cyber-yellow"
                    >
                      <source src={post.video_url} type="video/webm" />
                      <source src={post.video_url} type="video/mp4" />
                      Your browser does not support the video element.
                    </video>
                  )}
                  
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-4">
                      <span className="text-retro-electric-blue">👍 {post.upvotes}</span>
                      <span className="text-retro-hot-pink">👎 {post.downvotes}</span>
                    </div>
                    <span className="text-retro-cyber-yellow font-pixel text-xs">
                      {new Date(post.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        
        <PageFooter />
      </div>
    </div>
  );
};

export default Index;
