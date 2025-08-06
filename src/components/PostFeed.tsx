import { useState } from 'react';
import { Filter, Clock, TrendingUp, Search, X, Tag } from 'lucide-react';
import PostItem from './PostItem';
import ReportModal from './ReportModal';
import { ConfessionWithComments } from '@/hooks/useConfessions';

interface UserVotes {
  confessions: Record<string, { upvoted: boolean; downvoted: boolean }>;
  comments: Record<string, { upvoted: boolean; downvoted: boolean }>;
}

interface PostFeedProps {
  posts: ConfessionWithComments[];
  userVotes: UserVotes;
  onVote: (id: string, type: 'up' | 'down', isComment?: boolean) => Promise<boolean>;
  onReport: (id: string) => void;
  onToggleComments: (confessionId: string) => void;
  onAddComment: (confessionId: string, content: string, isAnonymous?: boolean) => Promise<void>;
  onCreateReport: (targetType: 'confession' | 'comment', targetId: string, reason: string, customReason?: string) => Promise<any>;
}

type SortOption = 'newest' | 'most-upvoted' | 'most-controversial';

const PostFeed = ({ 
  posts, 
  userVotes, 
  onVote, 
  onReport, 
  onToggleComments, 
  onAddComment, 
  onCreateReport 
}: PostFeedProps) => {
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportingPostId, setReportingPostId] = useState<string | null>(null);
  const [reportingCommentId, setReportingCommentId] = useState<string | null>(null);
  const [isReportingComment, setIsReportingComment] = useState(false);

  const handleReport = (id: string) => {
    // Check if this ID belongs to a post or comment
    const isPost = posts.some(post => post.id.toString() === id);
    
    if (isPost) {
      setReportingPostId(id);
      setReportingCommentId(null);
      setIsReportingComment(false);
    } else {
      // It's a comment ID, find which post it belongs to
      let foundPostId: string | null = null;
      for (const post of posts) {
        if (post.comments.some(comment => comment.id.toString() === id)) {
          foundPostId = post.id.toString();
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
    try {
      if (isReportingComment && reportingCommentId) {
        await onCreateReport('comment', reportingCommentId, reason, customReason);
      } else if (reportingPostId) {
        await onCreateReport('confession', reportingPostId, reason, customReason);
      }
      
      setReportModalOpen(false);
      setReportingPostId(null);
      setReportingCommentId(null);
      setIsReportingComment(false);
    } catch (error) {
      console.error('Error submitting report:', error);
    }
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
        return sortedPosts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
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
        (post.tags && post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
      );
    }

    // Filter by selected tag
    if (selectedTag) {
      filtered = filtered.filter(post => post.tags && post.tags.includes(selectedTag));
    }

    return filtered;
  };

  // Get all unique tags from all posts
  const getAllTags = () => {
    const allTags = posts.flatMap(post => post.tags || []);
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
            className="w-full pl-10 pr-4 py-2 bg-gray-900/50 border border-retro-electric-blue/30 rounded text-retro-neon-green font-cyber text-sm focus:outline-none focus:border-retro-cyber-yellow"
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
            <span className="font-cyber text-sm text-retro-neon-green">Tags:</span>
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
            <span className="font-cyber text-sm text-retro-neon-green">Sort by:</span>
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
          onVote={onVote}
          onReport={handleReport}
          formatTimeAgo={(dateStr) => formatTimeAgo(new Date(dateStr))}
          userVotes={userVotes.confessions[post.id.toString()] || { upvoted: false, downvoted: false }}
          commentVotes={userVotes.comments}
          onToggleComments={onToggleComments}
          onAddComment={onAddComment}
        />
      ))}
      
      {getFilteredPosts().length === 0 && posts.length > 0 && (
        <div className="text-center py-12">
          <div className="text-retro-electric-blue font-cyber text-lg mb-2">
            No confessions found 🔍
          </div>
          <div className="text-retro-neon-green font-cyber text-sm mb-4">
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
          <div className="text-retro-neon-green font-cyber text-sm">
            Be the first to share your secret!
          </div>
        </div>
      )}
      
      <ReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        onSubmit={handleReportSubmit}
        postId={isReportingComment ? (reportingCommentId || '') : (reportingPostId || '')}
        isComment={isReportingComment}
      />
    </div>
  );
};

export default PostFeed;
