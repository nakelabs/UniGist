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
          
          {/* Modern Sorting and Search Controls */}
          <div className="bg-gradient-to-r from-gray-800/60 to-gray-900/60 backdrop-blur-lg rounded-3xl p-6 border border-gray-700/50 mb-8 shadow-xl">
            {/* Top Row: Search Bar with Stats */}
            <div className="flex flex-col lg:flex-row gap-4 mb-6">
              {/* Enhanced Search Bar */}
              <div className="relative flex-1">
                <div className="absolute inset-0 bg-gradient-to-r from-retro-electric-blue/20 to-retro-cyber-yellow/20 rounded-2xl blur-sm"></div>
                <div className="relative bg-gray-900/80 backdrop-blur-sm rounded-2xl border border-retro-electric-blue/30 overflow-hidden">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-retro-electric-blue" />
                  <input
                    type="text"
                    placeholder="🔍 Search confessions, tags, or keywords..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-12 py-4 bg-transparent text-retro-neon-green font-cyber text-sm placeholder-retro-electric-blue/60 focus:outline-none focus:ring-2 focus:ring-retro-cyber-yellow/50 transition-all"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-retro-hot-pink hover:text-retro-cyber-yellow transition-colors p-1 rounded-full hover:bg-retro-hot-pink/20"
                      title="Clear search"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              
              {/* Refresh Button */}
              <button
                onClick={refetch}
                className="flex items-center justify-center px-6 py-4 bg-gradient-to-r from-retro-electric-blue/20 to-retro-cyber-yellow/20 border border-retro-electric-blue/40 rounded-2xl text-retro-electric-blue hover:border-retro-cyber-yellow hover:shadow-lg hover:shadow-retro-cyber-yellow/30 transition-all duration-300 font-cyber text-sm whitespace-nowrap group"
                title="Refresh confessions"
              >
                <RefreshCw className="w-5 h-5 mr-2 group-hover:rotate-180 transition-transform duration-500" />
                Refresh
              </button>
            </div>

            {/* Bottom Row: Sort Controls and Stats */}
            <div className="flex flex-col gap-4">
              {/* Enhanced Sort Options */}
              <div className="flex flex-col xs:flex-row xs:items-center gap-3">
                <span className="font-cyber text-sm text-retro-cyber-yellow flex items-center gap-2 whitespace-nowrap">
                  <span className="w-2 h-2 bg-retro-cyber-yellow rounded-full animate-pulse"></span>
                  Sort by:
                </span>
                <div className="flex flex-col xs:flex-row gap-2 w-full xs:w-auto">
                  <button
                    onClick={() => setSortBy('newest')}
                    className={`px-3 py-2 font-pixel text-xs rounded-xl border transition-all duration-300 flex-1 xs:flex-initial ${
                      sortBy === 'newest'
                        ? 'bg-gradient-to-r from-retro-electric-blue to-retro-electric-blue/80 text-white border-retro-electric-blue shadow-lg shadow-retro-electric-blue/30'
                        : 'bg-gray-800/50 text-retro-electric-blue border-retro-electric-blue/50 hover:border-retro-electric-blue hover:bg-retro-electric-blue/10'
                    }`}
                  >
                    <span className="hidden xs:inline">🕐 NEWEST</span>
                    <span className="xs:hidden">🕐 NEW</span>
                  </button>
                  <button
                    onClick={() => setSortBy('most-liked')}
                    className={`px-3 py-2 font-pixel text-xs rounded-xl border transition-all duration-300 flex-1 xs:flex-initial ${
                      sortBy === 'most-liked'
                        ? 'bg-gradient-to-r from-retro-neon-green to-retro-neon-green/80 text-black border-retro-neon-green shadow-lg shadow-retro-neon-green/30'
                        : 'bg-gray-800/50 text-retro-neon-green border-retro-neon-green/50 hover:border-retro-neon-green hover:bg-retro-neon-green/10'
                    }`}
                  >
                    <span className="hidden xs:inline">🔥 MOST LIKED</span>
                    <span className="xs:hidden">🔥 LIKED</span>
                  </button>
                  <button
                    onClick={() => setSortBy('controversial')}
                    className={`px-3 py-2 font-pixel text-xs rounded-xl border transition-all duration-300 flex-1 xs:flex-initial ${
                      sortBy === 'controversial'
                        ? 'bg-gradient-to-r from-retro-hot-pink to-retro-hot-pink/80 text-white border-retro-hot-pink shadow-lg shadow-retro-hot-pink/30'
                        : 'bg-gray-800/50 text-retro-hot-pink border-retro-hot-pink/50 hover:border-retro-hot-pink hover:bg-retro-hot-pink/10'
                    }`}
                  >
                    <span className="hidden xs:inline">💥 CONTROVERSIAL</span>
                    <span className="xs:hidden">💥 HOT</span>
                  </button>
                </div>
              </div>
              
              {/* Enhanced Stats Display */}
              <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-gray-700/30 to-gray-800/30 rounded-xl border border-gray-600/30 w-full sm:w-auto">
                <div className="w-2 h-2 bg-retro-electric-blue rounded-full animate-pulse"></div>
                <span className="font-cyber text-xs text-retro-electric-blue/80">
                  <span className="hidden xs:inline">
                    {getFilteredAndSortedConfessions().length} confession{getFilteredAndSortedConfessions().length === 1 ? '' : 's'}
                    {sortBy === 'newest' && ' • Latest first'}
                    {sortBy === 'most-liked' && ' • Most popular'}
                    {sortBy === 'controversial' && ' • Most debated'}
                  </span>
                  <span className="xs:hidden">
                    {getFilteredAndSortedConfessions().length} post{getFilteredAndSortedConfessions().length === 1 ? '' : 's'}
                  </span>
                </span>
              </div>
            </div>
          </div>
          
          {/* Enhanced Search Results Info */}
          {searchTerm && (
            <div className="bg-gradient-to-r from-retro-electric-blue/10 to-retro-cyber-yellow/10 backdrop-blur-sm rounded-2xl p-4 mb-6 border border-retro-electric-blue/30">
              <div className="text-center">
                {getFilteredAndSortedConfessions().length === 0 ? (
                  <div className="space-y-3">
                    <div className="text-retro-hot-pink font-cyber text-lg">
                      🔍 No confessions found for "{searchTerm}"
                    </div>
                    <div className="text-retro-electric-blue/70 font-cyber text-sm">
                      Try different keywords or check your spelling
                    </div>
                    <button
                      onClick={() => setSearchTerm('')}
                      className="px-4 py-2 bg-gradient-to-r from-retro-neon-green to-retro-cyber-yellow text-black font-pixel text-xs rounded-xl hover:shadow-lg hover:shadow-retro-neon-green/30 transition-all duration-300"
                    >
                      ✨ Clear Search & Show All
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-2 h-2 bg-retro-neon-green rounded-full animate-pulse"></div>
                    <span className="font-cyber text-sm text-retro-neon-green">
                      Found {getFilteredAndSortedConfessions().length} confession{getFilteredAndSortedConfessions().length === 1 ? '' : 's'} matching 
                      <span className="text-retro-cyber-yellow font-bold"> "{searchTerm}"</span>
                    </span>
                    <div className="w-2 h-2 bg-retro-neon-green rounded-full animate-pulse"></div>
                  </div>
                )}
              </div>
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
              <div key={post.id} className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-sm rounded-3xl p-8 border border-gray-700/50 hover:border-retro-cyber-yellow/50 transition-all duration-300 hover:shadow-2xl hover:shadow-retro-cyber-yellow/20"
              >
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
                    <div>
                      {post.image_context && (
                        <div className="mb-3 p-3 bg-retro-electric-blue/10 border border-retro-electric-blue/30 rounded-xl">
                          <p className="text-retro-cyber-yellow text-sm font-cyber mb-1">Image Context:</p>
                          <p className="text-white text-sm">{post.image_context}</p>
                        </div>
                      )}
                      <img
                        src={post.image_url}
                        alt="Confession image"
                        className="max-w-full h-auto rounded-2xl border-2 border-retro-cyber-yellow shadow-lg shadow-retro-cyber-yellow/20"
                      />
                    </div>
                  )}
                  
                  {post.audio_url && (
                    <div className="bg-gradient-to-r from-retro-electric-blue/10 to-retro-neon-green/10 p-4 rounded-2xl border border-retro-electric-blue/30">
                      <audio
                        controls
                        className="w-full rounded-xl"
                      >
                        <source src={post.audio_url} type="audio/webm" />
                        <source src={post.audio_url} type="audio/mp3" />
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  )}
                  
                  {post.video_url && (
                    <div className="bg-gradient-to-r from-retro-hot-pink/10 to-retro-cyber-yellow/10 p-6 rounded-3xl border border-retro-hot-pink/30 hover:border-retro-hot-pink/50 transition-all duration-300">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-2 h-2 bg-retro-hot-pink rounded-full animate-pulse"></div>
                        <span className="font-cyber text-sm text-retro-hot-pink">Video Message</span>
                      </div>
                      
                      {post.video_context && (
                        <div className="mb-4 p-3 bg-gray-800/50 rounded-2xl border border-retro-hot-pink/20">
                          <p className="text-retro-neon-green/90 font-cyber text-sm leading-relaxed">
                            {post.video_context}
                          </p>
                        </div>
                      )}
                      
                      <video
                        controls
                        className="w-full h-auto rounded-2xl border-2 border-retro-cyber-yellow/50 shadow-lg shadow-retro-cyber-yellow/20 hover:border-retro-cyber-yellow transition-all duration-300"
                      >
                        <source src={post.video_url} type="video/webm" />
                        <source src={post.video_url} type="video/mp4" />
                        Your browser does not support the video element.
                      </video>
                    </div>
                  )}
                  
                  <div className="flex flex-col gap-4 pt-4 border-t border-gray-700/30">
                    {/* Main Action Buttons - Responsive Layout */}
                    <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-2">
                      {/* Vote Buttons Row */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => handleVote(post.id, 'up')}
                          className={`group flex items-center gap-1.5 px-3 py-2 rounded-xl border transition-all duration-300 font-cyber text-xs flex-shrink-0 ${
                            userVotes.confessions[post.id]?.upvoted
                              ? 'bg-gradient-to-r from-retro-electric-blue to-retro-electric-blue/80 text-white border-retro-electric-blue shadow-lg shadow-retro-electric-blue/30'
                              : 'bg-gray-800/60 text-retro-electric-blue border-retro-electric-blue/50 hover:bg-gradient-to-r hover:from-retro-electric-blue/20 hover:to-retro-electric-blue/10 hover:border-retro-electric-blue hover:shadow-md hover:shadow-retro-electric-blue/20'
                          }`}
                          title={userVotes.confessions[post.id]?.upvoted ? "Remove upvote" : "Upvote this confession"}
                        >
                          <span className="text-sm transform group-hover:scale-110 transition-transform">👍</span>
                          <span className="font-pixel">{post.upvotes}</span>
                          {userVotes.confessions[post.id]?.upvoted && (
                            <div className="w-1 h-1 bg-white rounded-full animate-pulse"></div>
                          )}
                        </button>
                        
                        <button
                          onClick={() => handleVote(post.id, 'down')}
                          className={`group flex items-center gap-1.5 px-3 py-2 rounded-xl border transition-all duration-300 font-cyber text-xs flex-shrink-0 ${
                            userVotes.confessions[post.id]?.downvoted
                              ? 'bg-gradient-to-r from-retro-hot-pink to-retro-hot-pink/80 text-white border-retro-hot-pink shadow-lg shadow-retro-hot-pink/30'
                              : 'bg-gray-800/60 text-retro-hot-pink border-retro-hot-pink/50 hover:bg-gradient-to-r hover:from-retro-hot-pink/20 hover:to-retro-hot-pink/10 hover:border-retro-hot-pink hover:shadow-md hover:shadow-retro-hot-pink/20'
                          }`}
                          title={userVotes.confessions[post.id]?.downvoted ? "Remove downvote" : "Downvote this confession"}
                        >
                          <span className="text-sm transform group-hover:scale-110 transition-transform">👎</span>
                          <span className="font-pixel">{post.downvotes}</span>
                          {userVotes.confessions[post.id]?.downvoted && (
                            <div className="w-1 h-1 bg-white rounded-full animate-pulse"></div>
                          )}
                        </button>
                      </div>
                      
                      {/* Comment and Report Buttons Row */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => toggleComments(post.id)}
                          className="group flex items-center gap-1.5 px-3 py-2 rounded-xl border border-retro-neon-green/50 text-retro-neon-green bg-gray-800/60 hover:bg-gradient-to-r hover:from-retro-neon-green/20 hover:to-retro-neon-green/10 hover:border-retro-neon-green hover:shadow-md hover:shadow-retro-neon-green/20 transition-all duration-300 font-cyber text-xs flex-shrink-0"
                          title={post.showComments ? "Hide comments" : "Show comments"}
                        >
                          <span className="text-sm transform group-hover:scale-110 transition-transform">💬</span>
                          <span className="font-pixel hidden xs:inline">
                            {post.comments.length} {post.comments.length === 1 ? 'Reply' : 'Replies'}
                          </span>
                          <span className="font-pixel xs:hidden">
                            {post.comments.length}
                          </span>
                          {post.showComments && (
                            <div className="w-1 h-1 bg-retro-neon-green rounded-full animate-pulse"></div>
                          )}
                        </button>
                        
                        <button
                          onClick={() => handleReport(post.id)}
                          className="group flex items-center gap-1.5 px-3 py-2 rounded-xl border border-retro-hot-pink/40 text-retro-hot-pink/70 bg-gray-800/60 hover:bg-gradient-to-r hover:from-retro-hot-pink/20 hover:to-retro-hot-pink/10 hover:border-retro-hot-pink hover:text-retro-hot-pink hover:shadow-md hover:shadow-retro-hot-pink/20 transition-all duration-300 font-cyber text-xs flex-shrink-0"
                          title="Report inappropriate content"
                        >
                          <Flag className="w-3 h-3 transform group-hover:scale-110 transition-transform" />
                          <span className="font-pixel hidden xs:inline">Report</span>
                        </button>
                      </div>
                    </div>
                    
                    {/* Timestamp - Always on separate row on mobile */}
                    <div className="flex items-center gap-2 pt-2 border-t border-gray-700/20">
                      <div className="w-1 h-1 bg-retro-cyber-yellow rounded-full animate-pulse"></div>
                      <span className="text-retro-cyber-yellow/80 font-pixel text-xs">
                        {new Date(post.created_at).toLocaleString()} • Expires in {Math.max(0, 24 - Math.floor((Date.now() - new Date(post.created_at).getTime()) / (1000 * 60 * 60)))}h
                      </span>
                    </div>
                  </div>
                  
                  {/* Emoji Reactions */}
                  <div className="mt-3 relative overflow-visible">
                    <EmojiReactions 
                      targetId={post.id} 
                      targetType="confession" 
                    />
                  </div>
                  
                  {/* Comments Section */}
                  {post.showComments && (
                    <div className="mt-6 border-t border-retro-neon-green/30 pt-6 bg-gradient-to-r from-gray-900/20 to-gray-800/20 rounded-2xl p-4 -mx-4">
                      {/* Add Comment Form */}
                      <div className="mb-4">
                        <div className="flex flex-col sm:flex-row gap-2">
                          <textarea
                            id={`comment-${post.id}`}
                            placeholder="Add an anonymous reply..."
                            className="flex-1 bg-gray-900/50 border border-retro-electric-blue/30 rounded-2xl p-3 text-retro-neon-green font-cyber text-sm resize-none focus:border-retro-cyber-yellow focus:outline-none focus:ring-1 focus:ring-retro-cyber-yellow transition-all min-h-[80px] sm:min-h-[60px]"
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
                            className="group px-4 py-2 bg-gradient-to-r from-retro-neon-green to-retro-neon-green/80 text-black font-pixel text-xs hover:from-retro-cyber-yellow hover:to-retro-cyber-yellow/80 hover:scale-105 hover:shadow-lg hover:shadow-retro-neon-green/30 transition-all duration-300 rounded-2xl border border-retro-neon-green/50 flex-shrink-0 self-start sm:self-center"
                            title="Post your anonymous reply"
                          >
                            <span className="transform group-hover:scale-110 transition-transform">Reply</span>
                          </button>
                        </div>
                        <p className="text-xs text-retro-electric-blue/70 mt-2 font-cyber">
                          Press Enter to post • Anonymous replies only
                        </p>
                      </div>
                      
                      {/* Display Comments */}
                      {post.comments.length > 0 && (
                        <div className="space-y-3">
                          {post.comments.map((comment) => (
                            <div key={comment.id} className="bg-gray-900/30 border border-retro-electric-blue/20 rounded-2xl p-4"
                            >
                              <p className="font-cyber text-sm text-retro-neon-green mb-2">
                                {comment.content}
                              </p>
                              
                              {/* Comment Emoji Reactions */}
                              <EmojiReactions 
                                targetId={comment.id} 
                                targetType="comment" 
                                className="mb-2"
                              />
                              
                              <div className="flex flex-col sm:flex-row sm:justify-between gap-3 text-xs pt-3 border-t border-gray-700/20">
                                <div className="flex items-center gap-2 flex-wrap">
                                  {/* Comment Vote Buttons */}
                                  <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1 px-2 py-1 bg-retro-electric-blue/10 rounded-xl border border-retro-electric-blue/30 flex-shrink-0">
                                      <span className="text-sm">👍</span>
                                      <span className="text-retro-electric-blue font-pixel text-xs">{comment.upvotes}</span>
                                    </div>
                                    <div className="flex items-center gap-1 px-2 py-1 bg-retro-hot-pink/10 rounded-xl border border-retro-hot-pink/30 flex-shrink-0">
                                      <span className="text-sm">👎</span>
                                      <span className="text-retro-hot-pink font-pixel text-xs">{comment.downvotes}</span>
                                    </div>
                                  </div>
                                  
                                  {/* Comment Report Button */}
                                  <button
                                    onClick={() => handleReport(comment.id, true)}
                                    className="group flex items-center gap-1 px-2 py-1 rounded-xl border border-retro-hot-pink/30 text-retro-hot-pink/70 bg-gray-800/40 hover:bg-retro-hot-pink/10 hover:border-retro-hot-pink/50 hover:text-retro-hot-pink transition-all duration-300 flex-shrink-0"
                                    title="Report inappropriate comment"
                                  >
                                    <Flag className="w-3 h-3 transform group-hover:scale-110 transition-transform" />
                                    <span className="font-cyber text-xs hidden xs:inline">Report</span>
                                  </button>
                                </div>
                                
                                {/* Comment Timestamp */}
                                <div className="flex items-center gap-1 pt-2 sm:pt-0">
                                  <div className="w-1 h-1 bg-retro-cyber-yellow/50 rounded-full"></div>
                                  <span className="text-retro-cyber-yellow/70 font-pixel text-xs">
                                    {new Date(comment.created_at).toLocaleString()}
                                  </span>
                                </div>
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
