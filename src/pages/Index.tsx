import { useConfessions } from '@/hooks/useConfessions';
import { useVotes } from '@/hooks/useVotes';
import { useReports } from '@/hooks/useReports';
import PageHeader from '@/components/PageHeader';
import ConfessionForm from '@/components/ConfessionForm';
import PostFeed from '@/components/PostFeed';
import PageFooter from '@/components/PageFooter';
import Layout from '@/components/Layout';

const Index = () => {
  const { confessions, loading, createConfession, addComment, toggleComments } = useConfessions();
  const { userVotes, vote } = useVotes();
  const { createReport } = useReports();

  const handleSubmitConfession = async (confession: {
    content: string;
    audioUrl?: string;
    videoUrl?: string;
    imageUrl?: string;
    tags?: string[];
  }) => {
    await createConfession(confession);
  };

  const handleVote = async (id: string, type: 'up' | 'down', isComment: boolean = false) => {
    const targetType = isComment ? 'comment' : 'confession';
    await vote(id, type, targetType);
  };

  const handleReport = async (id: string) => {
    // This will be handled by the ReportModal component
    // The modal will call createReport when submitted
  };

  const handleAddComment = async (confessionId: string, content: string, isAnonymous: boolean = true) => {
    await addComment(confessionId, content, isAnonymous);
  };

  return (
    <Layout>
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
          
          {loading ? (
            <div className="text-center py-12">
              <div className="text-retro-electric-blue font-cyber text-lg mb-2">
                Loading confessions... 👻
              </div>
            </div>
          ) : (
            <PostFeed 
              posts={confessions}
              userVotes={userVotes}
              onVote={handleVote}
              onReport={handleReport}
              onToggleComments={toggleComments}
              onAddComment={handleAddComment}
              onCreateReport={createReport}
            />
          )}
          
          <PageFooter />
        </div>
      </div>
    </Layout>
  );
};

export default Index;
