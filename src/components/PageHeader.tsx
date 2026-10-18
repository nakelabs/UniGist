const PageHeader = () => {
  return (
    <header className="sticky top-0 z-50 bg-[#111111]/95 backdrop-blur-xl border-b border-[#1e1e1e]">
      <div className="max-w-[680px] mx-auto px-4 h-14 flex items-center justify-between">
        {/* Wordmark */}
        <div className="flex items-center gap-2.5">
          <span
            className="text-2xl tracking-tight leading-none"
            style={{ fontFamily: "'Pacifico', cursive" }}
          >
            <span style={{ color: '#ff2d55' }}>Y</span>
            <span style={{ color: '#7c3aed' }}>a</span>
            <span style={{ color: '#00c853' }}>r</span>
            <span style={{ color: '#ff9100' }}>n</span>
            <span style={{ color: '#00e5ff' }}>z</span>
          </span>
          <div className="flex flex-col">
            <span className="text-[9px] font-semibold text-[#666] uppercase tracking-widest leading-none">
              anonymous
            </span>
            <span className="text-[10px] text-[#888] font-medium tracking-tight mt-0.5 leading-tight">
              just post that your hot gist
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default PageHeader;
