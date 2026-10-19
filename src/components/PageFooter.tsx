const PageFooter = () => {
  return (
    <footer className="mt-16 pb-12 text-center px-4 max-w-[620px] mx-auto space-y-3">
      <div className="w-12 h-px bg-white/10 mx-auto" />
      
      <p className="text-xs text-[#555]">
        Yarn it on <span style={{ fontFamily: "'Pacifico', cursive" }} className="text-[#888]">Yarnz</span>
      </p>

      <p className="text-[11px] text-[#555] max-w-[460px] mx-auto leading-relaxed">
        Yarnz is an anonymous community. All content is user-generated; platform administrators are not liable for user posts. Please report harmful content.
      </p>

      <p className="text-[10px] text-[#444]">
        © {new Date().getFullYear()} Yarnz · All confessions automatically vanish after 24 hours.
      </p>
    </footer>
  );
};

export default PageFooter;
