const PageHeader = () => {
  return (
    <header className="sticky top-0 z-50 bg-[#111111]/95 backdrop-blur-xl border-b border-[#1e1e1e]">
      <div className="max-w-[680px] mx-auto px-4 h-14 flex items-center justify-between">
        {/* Wordmark */}
        <div className="flex items-center gap-2">
          <span
            className="text-xl font-bold tracking-tight"
            style={{
              background: 'linear-gradient(135deg, #ff2d55, #7c3aed)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            UniGist
          </span>
          <span className="text-[10px] font-semibold text-[#555] uppercase tracking-widest mt-0.5">
            anonymous
          </span>
        </div>

        {/* Ghost badge */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1e1e1e] border border-[#2a2a2a]">
          <span className="text-sm">👻</span>
          <span className="text-xs font-medium text-[#777]">24h feed</span>
        </div>
      </div>
    </header>
  );
};

export default PageHeader;
