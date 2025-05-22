
import { useState, useEffect } from 'react';
import { Heart, ArrowUp, ArrowDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Post {
  id: number;
  content: string;
  timestamp: Date;
  upvotes: number;
  downvotes: number;
  isNew: boolean;
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
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newConfession.trim()) return;

    const newPost: Post = {
      id: nextId,
      content: newConfession,
      timestamp: new Date(),
      upvotes: 0,
      downvotes: 0,
      isNew: true
    };

    setPosts([newPost, ...posts]);
    setNewConfession('');
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
            <div className="flex justify-between items-center">
              <span className="font-cyber text-sm text-retro-electric-blue">
                {500 - newConfession.length} characters left
              </span>
              <button
                type="submit"
                className="retro-button"
                disabled={!newConfession.trim()}
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

              <p className="font-cyber text-retro-neon-green mb-4 leading-relaxed">
                {post.content}
              </p>

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
