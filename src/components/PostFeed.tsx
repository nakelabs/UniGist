import { useState, useEffect } from 'react';
import { Heart, ArrowUp, ArrowDown, Filter, Clock, TrendingUp, Search, X, Tag } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import PostItem from './PostItem';
import ReportModal from './ReportModal';

export interface Comment {
  id: number;
  postId: number;
  content: string;
  timestamp: Date;
  upvotes: number;
  downvotes: number;
  isAnonymous: boolean;
  username?: string; // For non-anonymous comments
}

export interface Post {
  id: number;
  content: string;
  timestamp: Date;
  upvotes: number;
  downvotes: number;
  isNew: boolean;
  audioUrl?: string;
  videoUrl?: string;
  imageUrl?: string;
  comments: Comment[];
  showComments: boolean;
  tags: string[];
}

interface PostFeedProps {
  posts: Post[];
  setPosts: React.Dispatch<React.SetStateAction<Post[]>>;
}

type SortOption = 'newest' | 'most-upvoted' | 'most-controversial';

// Track user votes (both posts and comments)
interface UserVotes {
  posts: {
    [postId: number]: {
      upvoted: boolean;
      downvoted: boolean;
    }
  };
  comments: {
    [commentId: number]: {
      upvoted: boolean;
      downvoted: boolean;
    }
  };
}

const PostFeed = ({ posts, setPosts }: PostFeedProps) => {
  const { toast } = useToast();
  const [userVotes, setUserVotes] = useState<UserVotes>({
    posts: {},
    comments: {}
  });
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportingPostId, setReportingPostId] = useState<number | null>(null);
  const [reportingCommentId, setReportingCommentId] = useState<number | null>(null);
  const [isReportingComment, setIsReportingComment] = useState(false);
  
  // Load user votes from localStorage on component mount
  useEffect(() => {
    const savedVotes = localStorage.getItem('userVotes');
    if (savedVotes) {
      setUserVotes(JSON.parse(savedVotes));
    }
  }, []);

  // Save user votes to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('userVotes', JSON.stringify(userVotes));
  }, [userVotes]);

  const handleVote = (id: number, type: 'up' | 'down', isComment: boolean = false, postId?: number) => {
    // Check if user has already voted on this post/comment
    const votes = isComment ? userVotes.comments : userVotes.posts;
    const itemVotes = votes[id] || { upvoted: false, downvoted: false };
    
    // If already voted this type, show a toast and return
    if ((type === 'up' && itemVotes.upvoted) || (type === 'down' && itemVotes.downvoted)) {
      toast({
        title: "Already voted",
        description: `You can only vote once per ${isComment ? 'comment' : 'post'}`,
      });
      return;
    }
    
    // Update posts state
    const updatePosts = prev => prev.map(post => {
      if (!isComment && post.id === id) {
        // Voting on post
        let updatedUpvotes = post.upvotes;
        let updatedDownvotes = post.downvotes;
        
        if (type === 'up') {
          updatedUpvotes += 1;
          if (itemVotes.downvoted) {
            updatedDownvotes = Math.max(0, updatedDownvotes - 1);
          }
        } else {
          updatedDownvotes += 1;
          if (itemVotes.upvoted) {
            updatedUpvotes = Math.max(0, updatedUpvotes - 1);
          }
        }
        
        return { 
          ...post, 
          upvotes: updatedUpvotes,
          downvotes: updatedDownvotes
        };
      } else if (isComment && post.id === postId) {
        // Voting on comment
        return {
          ...post,
          comments: post.comments.map(comment => {
            if (comment.id === id) {
              let updatedUpvotes = comment.upvotes;
              let updatedDownvotes = comment.downvotes;
              
              if (type === 'up') {
                updatedUpvotes += 1;
                if (itemVotes.downvoted) {
                  updatedDownvotes = Math.max(0, updatedDownvotes - 1);
                }
              } else {
                updatedDownvotes += 1;
                if (itemVotes.upvoted) {
                  updatedUpvotes = Math.max(0, updatedUpvotes - 1);
                }
              }
              
              return {
                ...comment,
                upvotes: updatedUpvotes,
                downvotes: updatedDownvotes
              };
            }
            return comment;
          })
        };
      }
      return post;
    });
    
    setPosts(updatePosts);
    
    // Update user votes state
    setUserVotes(prev => ({
      ...prev,
      [isComment ? 'comments' : 'posts']: {
        ...prev[isComment ? 'comments' : 'posts'],
        [id]: {
          upvoted: type === 'up' ? true : false,
          downvoted: type === 'down' ? true : false,
        }
      }
    }));
  };

  const handleReport = (id: number) => {
    // Check if this ID belongs to a post or comment
    const isPost = posts.some(post => post.id === id);
    
    if (isPost) {
      setReportingPostId(id);
      setReportingCommentId(null);
      setIsReportingComment(false);
    } else {
      // It's a comment ID, find which post it belongs to
      let foundPostId = null;
      for (const post of posts) {
        if (post.comments.some(comment => comment.id === id)) {
          foundPostId = post.id;
          break;
        }
      }
      setReportingCommentId(id);
      setReportingPostId(foundPostId);
      setIsReportingComment(true);
    }
    
    setReportModalOpen(true);
  };

  const handleReportSubmit = async (reason: string, customReason?: string) => {
    if (isReportingComment && reportingCommentId) {
      // Reporting a comment
      let reportedComment = null;
      let parentPost = null;
      
      for (const post of posts) {
        const comment = post.comments.find(c => c.id === reportingCommentId);
        if (comment) {
          reportedComment = comment;
          parentPost = post;
          break;
        }
      }
      
      if (!reportedComment || !parentPost) return;

      const reportData = {
        id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'comment',
        targetId: reportingCommentId.toString(),
        reason,
        customReason,
        timestamp: Date.now(),
        content: reportedComment.content,
        status: 'pending'
      };

      const existingReports = JSON.parse(localStorage.getItem('reportedContent') || '[]');
      existingReports.push(reportData);
      localStorage.setItem('reportedContent', JSON.stringify(existingReports));
      
      toast({
        title: "Report Submitted 🚨",
        description: `Comment reported for: ${reason}. Our moderation team will review this shortly.`,
      });
    } else if (reportingPostId) {
      // Reporting a post
      const reportedPost = posts.find(post => post.id === reportingPostId);
      if (!reportedPost) return;

      const reportData = {
        id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'post',
        targetId: reportingPostId.toString(),
        reason,
        customReason,
        timestamp: Date.now(),
        content: reportedPost.content,
        status: 'pending'
      };

      const existingReports = JSON.parse(localStorage.getItem('reportedContent') || '[]');
      existingReports.push(reportData);
      localStorage.setItem('reportedContent', JSON.stringify(existingReports));
      
      toast({
        title: "Report Submitted 🚨",
        description: `Post #${reportingPostId} reported for: ${reason}. Our moderation team will review this shortly.`,
      });
    }

    setReportModalOpen(false);
    setReportingPostId(null);
  };

  const toggleComments = (postId: number) => {
    setPosts(prev => prev.map(post => 
      post.id === postId 
        ? { ...post, showComments: !post.showComments }
        : post
    ));
  };

  const addComment = (postId: number, content: string, isAnonymous: boolean = true) => {
    const newComment: Comment = {
      id: Date.now(), // Simple ID generation
      postId,
      content,
      timestamp: new Date(),
      upvotes: 0,
      downvotes: 0,
      isAnonymous,
      username: isAnonymous ? undefined : 'User' // Could be replaced with actual user system
    };

    setPosts(prev => prev.map(post => 
      post.id === postId 
        ? { 
            ...post, 
            comments: [...post.comments, newComment],
            showComments: true // Auto-show comments when adding one
          }
        : post
    ));

    toast({
      title: "Comment Added! 💬",
      description: "Your anonymous reply has been posted",
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

  // Sort posts based on the selected option
  const getSortedPosts = () => {
    const sortedPosts = [...posts];
    
    switch (sortBy) {
      case 'newest':
        return sortedPosts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      case 'most-upvoted':
        return sortedPosts.sort((a, b) => b.upvotes - a.upvotes);
      case 'most-controversial':
        return sortedPosts.sort((a, b) => {
          const aControversy = Math.min(a.upvotes, a.downvotes);
          const bControversy = Math.min(b.upvotes, b.downvotes);
          return bControversy - aControversy;
        });
      default:
        return sortedPosts;
    }
  };

  // Filter posts based on search term and selected tag
  const getFilteredPosts = () => {
    let filtered = getSortedPosts();

    // Filter by search term
    if (searchTerm.trim()) {
      filtered = filtered.filter(post =>
        post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by selected tag
    if (selectedTag) {
      filtered = filtered.filter(post => post.tags.includes(selectedTag));
    }

    return filtered;
  };

  // Get all unique tags from all posts
  const getAllTags = () => {
    const allTags = posts.flatMap(post => post.tags);
    return [...new Set(allTags)].sort();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 mb-8">
        <h2 className="font-pixel text-xl text-center text-retro-neon-green animate-glow">
          🔥 THE CONFESSION FEED 🔥
        </h2>
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-retro-electric-blue" />
          <input
            type="text"
            placeholder="Search confessions or tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-900/50 border border-retro-electric-blue/30 rounded text-retro-pastel-blue font-cyber text-sm focus:outline-none focus:border-retro-cyber-yellow"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-retro-hot-pink hover:text-retro-cyber-yellow"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Tag Filter */}
        {getAllTags().length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <Tag className="w-4 h-4 text-retro-cyber-yellow" />
            <span className="font-cyber text-sm text-retro-pastel-blue">Tags:</span>
            <button
              onClick={() => setSelectedTag('')}
              className={`px-2 py-1 font-pixel text-xs border transition-all ${
                selectedTag === ''
                  ? 'bg-retro-cyber-yellow text-black border-retro-cyber-yellow'
                  : 'bg-transparent text-retro-electric-blue border-retro-electric-blue hover:bg-retro-electric-blue hover:text-black'
              }`}
            >
              All
            </button>
            {getAllTags().map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? '' : tag)}
                className={`px-2 py-1 font-pixel text-xs border transition-all ${
                  selectedTag === tag
                    ? 'bg-retro-cyber-yellow text-black border-retro-cyber-yellow'
                    : 'bg-transparent text-retro-neon-green border-retro-neon-green hover:bg-retro-neon-green hover:text-black'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
        
        {/* Sorting Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-retro-cyber-yellow" />
            <span className="font-cyber text-sm text-retro-pastel-blue">Sort by:</span>
            <div className="flex gap-1">
              <button
                onClick={() => setSortBy('newest')}
                className={`px-3 py-1 font-pixel text-xs border transition-all ${
                  sortBy === 'newest'
                    ? 'bg-retro-cyber-yellow text-black border-retro-cyber-yellow'
                    : 'bg-transparent text-retro-neon-green border-retro-neon-green hover:bg-retro-neon-green hover:text-black'
                }`}
              >
                <Clock className="w-3 h-3 inline mr-1" />
                Newest
              </button>
              <button
                onClick={() => setSortBy('most-upvoted')}
                className={`px-3 py-1 font-pixel text-xs border transition-all ${
                  sortBy === 'most-upvoted'
                    ? 'bg-retro-cyber-yellow text-black border-retro-cyber-yellow'
                    : 'bg-transparent text-retro-neon-green border-retro-neon-green hover:bg-retro-neon-green hover:text-black'
                }`}
              >
                <TrendingUp className="w-3 h-3 inline mr-1" />
                Top
              </button>
              <button
                onClick={() => setSortBy('most-controversial')}
                className={`px-3 py-1 font-pixel text-xs border transition-all ${
                  sortBy === 'most-controversial'
                    ? 'bg-retro-cyber-yellow text-black border-retro-cyber-yellow'
                    : 'bg-transparent text-retro-hot-pink border-retro-hot-pink hover:bg-retro-hot-pink hover:text-black'
                }`}
              >
                🔥 Hot
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Status Indicator */}
      <div className="text-center mb-4">
        <span className="font-cyber text-sm text-retro-electric-blue">
          Showing {getFilteredPosts().length} of {posts.length} confessions
          {searchTerm && (
            <span className="text-retro-cyber-yellow"> • Searching for "{searchTerm}"</span>
          )}
          {selectedTag && (
            <span className="text-retro-neon-green"> • Tagged #{selectedTag}</span>
          )}
          <span className="text-retro-cyber-yellow font-pixel"> • Sorted by{' '}
            {sortBy === 'newest' && 'Newest First'}
            {sortBy === 'most-upvoted' && 'Most Upvoted'}
            {sortBy === 'most-controversial' && 'Most Controversial'}
          </span>
        </span>
      </div>
      
      {getFilteredPosts().map((post) => (
        <PostItem 
          key={post.id}
          post={post}
          onVote={handleVote}
          onReport={handleReport}
          formatTimeAgo={formatTimeAgo}
          userVotes={userVotes.posts[post.id] || { upvoted: false, downvoted: false }}
          commentVotes={userVotes.comments}
          onToggleComments={toggleComments}
          onAddComment={addComment}
        />
      ))}
      
      {getFilteredPosts().length === 0 && posts.length > 0 && (
        <div className="text-center py-12">
          <div className="text-retro-electric-blue font-cyber text-lg mb-2">
            No confessions found 🔍
          </div>
          <div className="text-retro-pastel-blue font-cyber text-sm mb-4">
            {searchTerm && `No results for "${searchTerm}"`}
            {selectedTag && `No posts tagged with "#${selectedTag}"`}
          </div>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedTag('');
            }}
            className="px-4 py-2 bg-retro-neon-green text-black font-pixel text-xs hover:bg-retro-cyber-yellow"
          >
            Clear Filters
          </button>
        </div>
      )}

      {posts.length === 0 && (
        <div className="text-center py-12">
          <div className="text-retro-electric-blue font-cyber text-lg mb-2">
            No confessions yet... 👻
          </div>
          <div className="text-retro-pastel-blue font-cyber text-sm">
            Be the first to share your secret!
          </div>
        </div>
      )}
      
      <ReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        onSubmit={handleReportSubmit}
        postId={isReportingComment ? (reportingCommentId || 0) : (reportingPostId || 0)}
        isComment={isReportingComment}
      />
    </div>
  );
};

export default PostFeed;
