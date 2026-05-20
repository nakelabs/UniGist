const PageHeader = () => {
  return (
    <header className="sticky top-0 z-50 bg-[#111111]/95 backdrop-blur-xl border-b border-[#1e1e1e]">
      <div className="max-w-[680px] mx-auto px-4 h-14 flex items-center justify-between">
        {/* Wordmark */}
        <div className="flex items-center gap-2">
          <span
            className="text-2xl tracking-tight"
            style={{ fontFamily: "'Pacifico', cursive" }}
          >
            <span style={{ color: '#ff2d55' }}>Y</span>
            <span style={{ color: '#7c3aed' }}>a</span>
            <span style={{ color: '#00c853' }}>r</span>
            <span style={{ color: '#ff9100' }}>n</span>
            <span style={{ color: '#00e5ff' }}>z</span>
          </span>
          <span className="text-[10px] font-semibold text-[#555] uppercase tracking-widest mt-0.5">
            anonymous
          </span>
        </div>
      </div>
    </header>
  );
};

export default PageHeader;
