import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Search, X, Flag, RefreshCw } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import ConfessionForm from '@/components/ConfessionForm';
import PostFeed from '@/components/PostFeed';
import PageFooter from '@/components/PageFooter';
import TermsAndConditions from '@/components/TermsAndConditions';
import EmojiReactions from '@/components/EmojiReactions';
import ReportModal from '@/components/ReportModal';
import { useConfessions } from '@/hooks/useConfessions';
import { useVotes } from '@/hooks/useVotes';
import { useReports } from '@/hooks/useReports';
import { useReactions } from '@/hooks/useReactions';

const Index = () => {
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'most-liked' | 'controversial'>('newest');
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportingPostId, setReportingPostId] = useState<string | null>(null);
  const [reportingCommentId, setReportingCommentId] = useState<string | null>(null);
  const [isReportingComment, setIsReportingComment] = useState(false);
  const { toast } = useToast();
  const { confessions, loading, createConfession, addComment, toggleComments, updateVoteCount, refetch } = useConfessions();
  const { userVotes, vote } = useVotes();
  const { createReport } = useReports();
  const reactions = useReactions();

  useEffect(() => {
    // Check if user has already accepted terms
    const termsAccepted = localStorage.getItem('termsAccepted');
    const onboardingComplete = localStorage.getItem('onboardingComplete');
    
    if (termsAccepted === 'true') {
      setHasAcceptedTerms(true);
    } else {
      // For now, auto-accept terms to bypass the modal issue
      setHasAcceptedTerms(true);
      localStorage.setItem('termsAccepted', 'true');
    }
    
    if (onboardingComplete === 'true') {
      setIsOnboardingComplete(true);
    }
  }, []);

  const handleAcceptTerms = () => {
    setHasAcceptedTerms(true);
    localStorage.setItem('termsAccepted', 'true');
    
    toast({
      title: "Welcome to the Digital Confessional! 🎭",
      description: "Your journey into anonymous expression begins...",
    });
  };

  const handleSubmitConfession = async (confession: {
    content: string;
    audioUrl?: string;
    videoUrl?: string;
    imageUrl?: string;
    tags?: string[];
  }) => {
    try {
      await createConfession(confession);
    } catch (error) {
      console.error('Error submitting confession:', error);
    }
  };

  const handleReport = (id: string, isComment: boolean = false) => {
    if (isComment) {
      setReportingCommentId(id);
      setReportingPostId(null);
      setIsReportingComment(true);
    } else {
      setReportingPostId(id);
      setReportingCommentId(null);
      setIsReportingComment(false);
    }
    setReportModalOpen(true);
  };

  const handleReportSubmit = async (reason: string, customReason?: string) => {
    try {
      if (isReportingComment && reportingCommentId) {
        await createReport('comment', reportingCommentId, reason, customReason);
      } else if (reportingPostId) {
        await createReport('confession', reportingPostId, reason, customReason);
      }
      
      setReportModalOpen(false);
      setReportingPostId(null);
      setReportingCommentId(null);
      setIsReportingComment(false);
    } catch (error) {
      console.error('Error submitting report:', error);
    }
  };

  const handleVote = async (id: string, type: 'up' | 'down', isComment?: boolean): Promise<boolean> => {
    const targetType = isComment ? 'comment' : 'confession';
    
    if (!isComment) {
      // Get current vote state before making the vote
      const currentVote = userVotes.confessions[id];
      const wasUpvoted = currentVote?.upvoted || false;
      const wasDownvoted = currentVote?.downvoted || false;
      
      const success = await vote(id, type, targetType);
      
      if (success) {
        // Update local vote counts
        if (type === 'up') {
          updateVoteCount(id, 'up', wasUpvoted, wasDownvoted);
        } else {
          updateVoteCount(id, 'down', wasDownvoted, wasUpvoted);
        }
      }
      
      return success;
    } else {
      return await vote(id, type, targetType);
    }
  };

  // Filter and sort confessions based on search term and sort option
  const getFilteredAndSortedConfessions = () => {
    let filtered = confessions;
    
    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = confessions.filter(confession => 
        confession.content.toLowerCase().includes(searchLower) ||
        (confession.tags && confession.tags.some(tag => 
          tag.toLowerCase().includes(searchLower)
        ))
      );
    }
    
    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'most-liked':
          const aScore = (a.upvotes || 0) - (a.downvotes || 0);
          const bScore = (b.upvotes || 0) - (b.downvotes || 0);
          return bScore - aScore;
        case 'controversial':
          const aControversy = Math.min(a.upvotes || 0, a.downvotes || 0);
          const bControversy = Math.min(b.upvotes || 0, b.downvotes || 0);
          return bControversy - aControversy;
        default:
          return 0;
      }
    });
    
    return sorted;
  };

  // Show terms and conditions first
  if (!hasAcceptedTerms) {
    return (
      <TermsAndConditions 
        onAccept={handleAcceptTerms}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-retro-neon-green flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-retro-cyber-yellow border-t-transparent rounded-full mx-auto mb-4"></div>
          <div className="font-cyber text-retro-electric-blue">Loading confessions...</div>
        </div>
      </div>
    );
  }

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
        
        {/* Simple Posts Display - inline like Index_simple.tsx */}
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center">
            <h2 className="font-pixel text-xl text-center text-retro-neon-green animate-glow mb-2">
              🔥 THE CONFESSION FEED 🔥
            </h2>
            <p className="font-cyber text-xs text-retro-cyber-yellow mb-4">
              ⏰ Daily Reset: Confessions older than 24 hours are automatically cleared
            </p>
          </div>
          
          {/* Sorting and Search Controls */}
          <div className="space-y-4 mb-6">
            {/* Sorting Options */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-cyber text-sm text-retro-cyber-yellow">Sort by:</span>
              <button
                onClick={() => setSortBy('newest')}
                className={`px-3 py-1 font-pixel text-xs border transition-all ${
                  sortBy === 'newest'
                    ? 'bg-retro-electric-blue text-black border-retro-electric-blue'
                    : 'bg-transparent text-retro-electric-blue border-retro-electric-blue/50 hover:border-retro-electric-blue'
                }`}
              >
                🕐 NEWEST
              </button>
              <button
                onClick={() => setSortBy('most-liked')}
                className={`px-3 py-1 font-pixel text-xs border transition-all ${
                  sortBy === 'most-liked'
                    ? 'bg-retro-neon-green text-black border-retro-neon-green'
                    : 'bg-transparent text-retro-neon-green border-retro-neon-green/50 hover:border-retro-neon-green'
                }`}
              >
                🔥 MOST LIKED
              </button>
              <button
                onClick={() => setSortBy('controversial')}
                className={`px-3 py-1 font-pixel text-xs border transition-all ${
                  sortBy === 'controversial'
                    ? 'bg-retro-hot-pink text-black border-retro-hot-pink'
                    : 'bg-transparent text-retro-hot-pink border-retro-hot-pink/50 hover:border-retro-hot-pink'
                }`}
              >
                💥 CONTROVERSIAL
              </button>
            </div>
            
            {/* Sorting Status */}
            <div className="text-center">
              <span className="font-cyber text-xs text-retro-electric-blue/70">
                Showing {getFilteredAndSortedConfessions().length} confession{getFilteredAndSortedConfessions().length === 1 ? '' : 's'}
                {sortBy === 'newest' && ' • Sorted by newest first'}
                {sortBy === 'most-liked' && ' • Sorted by most liked'}
                {sortBy === 'controversial' && ' • Sorted by most controversial'}
              </span>
            </div>
          </div>
          
          {/* Search Bar and Refresh Button */}
          <div className="flex flex-col sm:flex-row gap-2 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-retro-electric-blue" />
              <input
                type="text"
                placeholder="Search confessions by keywords or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-3 bg-gray-900/50 border border-retro-electric-blue/30 rounded text-retro-neon-green font-cyber text-sm focus:outline-none focus:border-retro-cyber-yellow focus:ring-1 focus:ring-retro-cyber-yellow"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-retro-hot-pink hover:text-retro-cyber-yellow transition-colors"
                  title="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              onClick={refetch}
              className="flex items-center justify-center px-4 py-3 bg-retro-electric-blue/20 border border-retro-electric-blue/30 rounded text-retro-electric-blue hover:bg-retro-electric-blue/30 hover:border-retro-cyber-yellow hover:text-retro-cyber-yellow transition-all duration-200 font-cyber text-sm"
              title="Refresh confessions"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
          </div>
          
          {/* Search Results Info */}
          {searchTerm && (
            <div className="text-center mb-4">
              <span className="font-cyber text-sm text-retro-electric-blue">
                {getFilteredAndSortedConfessions().length === 0 
                  ? `No confessions found for "${searchTerm}" 🔍`
                  : `Found ${getFilteredAndSortedConfessions().length} confession${getFilteredAndSortedConfessions().length === 1 ? '' : 's'} matching "${searchTerm}"`
                }
              </span>
              {getFilteredAndSortedConfessions().length === 0 && (
                <div className="mt-2">
                  <button
                    onClick={() => setSearchTerm('')}
                    className="px-3 py-1 text-xs bg-retro-neon-green text-black font-pixel hover:bg-retro-cyber-yellow transition-all"
                  >
                    Clear Search
                  </button>
                </div>
              )}
            </div>
          )}
          
          {getFilteredAndSortedConfessions().length === 0 && !searchTerm ? (
            <div className="text-center py-12">
              <div className="text-retro-electric-blue font-cyber text-lg mb-2">
                No confessions yet... 👻
              </div>
              <div className="text-retro-neon-green font-cyber text-sm">
                Be the first to share your secret!
              </div>
            </div>
          ) : (
            getFilteredAndSortedConfessions().map((post) => (
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
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleVote(post.id, 'up')}
                          className={`flex items-center gap-1 px-2 py-1 border transition-all ${
                            userVotes.confessions[post.id]?.upvoted
                              ? 'bg-retro-electric-blue text-black border-retro-electric-blue'
                              : 'bg-transparent text-retro-electric-blue border-retro-electric-blue hover:bg-retro-electric-blue hover:text-black'
                          }`}
                        >
                          👍 {post.upvotes}
                        </button>
                        <button
                          onClick={() => handleVote(post.id, 'down')}
                          className={`flex items-center gap-1 px-2 py-1 border transition-all ${
                            userVotes.confessions[post.id]?.downvoted
                              ? 'bg-retro-hot-pink text-black border-retro-hot-pink'
                              : 'bg-transparent text-retro-hot-pink border-retro-hot-pink hover:bg-retro-hot-pink hover:text-black'
                          }`}
                        >
                          👎 {post.downvotes}
                        </button>
                      </div>
                      <button
                        onClick={() => toggleComments(post.id)}
                        className="flex items-center gap-1 px-2 py-1 border border-retro-neon-green text-retro-neon-green hover:bg-retro-neon-green hover:text-black transition-all"
                      >
                        💬 {post.comments.length} {post.comments.length === 1 ? 'Reply' : 'Replies'}
                      </button>
                      <button
                        onClick={() => handleReport(post.id)}
                        className="flex items-center gap-1 px-2 py-1 border border-retro-hot-pink/50 text-retro-hot-pink hover:bg-retro-hot-pink hover:text-black transition-all"
                        title="Report inappropriate content"
                      >
                        <Flag className="w-3 h-3" />
                        Report
                      </button>
                    </div>
                    <span className="text-retro-cyber-yellow font-pixel text-xs">
                      {new Date(post.created_at).toLocaleString()} • Expires in {Math.max(0, 24 - Math.floor((Date.now() - new Date(post.created_at).getTime()) / (1000 * 60 * 60)))}h
                    </span>
                  </div>
                  
                  {/* Emoji Reactions */}
                  <EmojiReactions 
                    targetId={post.id} 
                    targetType="confession" 
                    className="mt-3"
                  />
                  
                  {/* Comments Section */}
                  {post.showComments && (
                    <div className="mt-4 border-t border-retro-neon-green/30 pt-4">
                      {/* Add Comment Form */}
                      <div className="mb-4">
                        <div className="flex gap-2">
                          <textarea
                            id={`comment-${post.id}`}
                            placeholder="Add an anonymous reply..."
                            className="flex-1 bg-gray-900/50 border border-retro-electric-blue/30 rounded p-2 text-retro-neon-green font-cyber text-sm resize-none"
                            rows={2}
                            onKeyDown={async (e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                const textarea = e.target as HTMLTextAreaElement;
                                const content = textarea.value.trim();
                                if (content) {
                                  try {
                                    await addComment(post.id, content);
                                    textarea.value = '';
                                  } catch (error) {
                                    console.error('Error adding comment:', error);
                                  }
                                }
                              }
                            }}
                          />
                          <button
                            onClick={async () => {
                              const textarea = document.getElementById(`comment-${post.id}`) as HTMLTextAreaElement;
                              const content = textarea.value.trim();
                              if (content) {
                                try {
                                  await addComment(post.id, content);
                                  textarea.value = '';
                                } catch (error) {
                                  console.error('Error adding comment:', error);
                                }
                              }
                            }}
                            className="px-3 py-2 bg-retro-neon-green text-black font-pixel text-xs hover:bg-retro-cyber-yellow transition-all"
                          >
                            Reply
                          </button>
                        </div>
                        <p className="text-xs text-retro-electric-blue/70 mt-1 font-cyber">
                          Press Enter to post • Anonymous replies only
                        </p>
                      </div>
                      
                      {/* Display Comments */}
                      {post.comments.length > 0 && (
                        <div className="space-y-3">
                          {post.comments.map((comment) => (
                            <div key={comment.id} className="bg-gray-900/30 border border-retro-electric-blue/20 rounded p-3">
                              <p className="font-cyber text-sm text-retro-neon-green mb-2">
                                {comment.content}
                              </p>
                              
                              {/* Comment Emoji Reactions */}
                              <EmojiReactions 
                                targetId={comment.id} 
                                targetType="comment" 
                                className="mb-2"
                              />
                              
                              <div className="flex justify-between items-center text-xs">
                                <div className="flex items-center gap-2">
                                  <span className="text-retro-electric-blue">👍 {comment.upvotes}</span>
                                  <span className="text-retro-hot-pink">👎 {comment.downvotes}</span>
                                  <button
                                    onClick={() => handleReport(comment.id, true)}
                                    className="flex items-center gap-1 px-1 py-0.5 text-retro-hot-pink/70 hover:text-retro-hot-pink transition-all"
                                    title="Report comment"
                                  >
                                    <Flag className="w-2.5 h-2.5" />
                                    <span className="font-cyber text-xs">report</span>
                                  </button>
                                </div>
                                <span className="text-retro-cyber-yellow/70 font-pixel">
                                  {new Date(comment.created_at).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {post.comments.length === 0 && (
                        <div className="text-center py-4">
                          <div className="text-retro-electric-blue/70 font-cyber text-sm">
                            No replies yet... be the first to respond! 💭
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        
        <PageFooter />
      </div>
      
      {/* Report Modal */}
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

export default Index;
