
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import PageHeader from '@/components/PageHeader';
import ConfessionForm from '@/components/ConfessionForm';
import PostFeed, { Post } from '@/components/PostFeed';
import PageFooter from '@/components/PageFooter';

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
  const [nextId, setNextId] = useState(4);
  const { toast } = useToast();

  const handleSubmitConfession = (confession: {
    content: string;
    audioUrl?: string;
    videoUrl?: string;
    imageUrl?: string;
  }) => {
    const newPost: Post = {
      id: nextId,
      content: confession.content,
      timestamp: new Date(),
      upvotes: 0,
      downvotes: 0,
      isNew: true,
      audioUrl: confession.audioUrl,
      videoUrl: confession.videoUrl,
      imageUrl: confession.imageUrl
    };

    setPosts([newPost, ...posts]);
    setNextId(nextId + 1);

    // Mark as no longer new after 10 seconds
    setTimeout(() => {
      setPosts(prev => prev.map(post => 
        post.id === newPost.id ? { ...post, isNew: false } : post
      ));
    }, 10000);
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
        <PageHeader />

        {/* Confession Form */}
        <ConfessionForm onSubmit={handleSubmitConfession} />

        {/* Posts Feed */}
        <PostFeed posts={posts} setPosts={setPosts} />

        {/* Footer */}
        <PageFooter />
      </div>
    </div>
  );
};

export default Index;
