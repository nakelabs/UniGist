const PageFooter = () => {
  return (
    <footer className="mt-16 pb-12 text-center px-4 max-w-[620px] mx-auto space-y-3">
      <div className="w-12 h-px bg-white/10 mx-auto" />
      
      <p className="text-xs text-[#555]">
        Yarn it on <span style={{ fontFamily: "'Pacifico', cursive" }} className="text-[#888]">Yarnz</span>
      </p>

      {/* Legal & Safety Disclaimer */}
      <div className="bg-[#141416] border border-white/5 rounded-xl p-3.5 text-left">
        <p className="text-[11px] font-semibold text-[#777] uppercase tracking-wider mb-1 flex items-center gap-1.5">
          <span>⚠️</span> Disclaimer & Limitation of Liability
        </p>
        <p className="text-[11px] text-[#555] leading-relaxed">
          Yarnz is an anonymous, community-driven discussion board. All confessions, comments, and media are user-generated. The platform, its creators, and administrators are not liable for any damages, losses, defamation, or misuse resulting from content shared on this platform. Users are solely responsible for the content they publish. Please report any harmful or inappropriate content immediately.
        </p>
      </div>

      <p className="text-[10px] text-[#444]">
        © {new Date().getFullYear()} Yarnz · All confessions automatically vanish after 24 hours.
      </p>
    </footer>
  );
};

export default PageFooter;
