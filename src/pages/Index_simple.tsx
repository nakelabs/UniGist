import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import PageHeader from '@/components/PageHeader';
import ConfessionForm from '@/components/ConfessionForm';
import PostFeed, { Post } from '@/components/PostFeed';
import PageFooter from '@/components/PageFooter';

const Index = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [nextId, setNextId] = useState(1);
  const { toast } = useToast();

  const handleSubmitConfession = (confession: {
    content: string;
    audioUrl?: string;
    videoUrl?: string;
    imageUrl?: string;
    tags?: string[];
  }) => {
    const newPost: Post = {
      id: nextId,
      content: confession.content,
      timestamp: new Date(),
      upvotes: 0,
      downvotes: 0,
      audioUrl: confession.audioUrl,
      videoUrl: confession.videoUrl,
      imageUrl: confession.imageUrl,
      tags: confession.tags || [],
      reports: [],
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
        
        <PostFeed 
          posts={posts} 
        />
        
        <PageFooter />
      </div>
    </div>
  );
};

export default Index;
