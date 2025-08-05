
import React from 'react';

const PageHeader = () => {
  return (
    <header className="text-center mb-12 relative">
      <h1 
        className="glitch-text font-pixel text-4xl md:text-6xl text-retro-neon-green mb-4 animate-glow"
        data-text="UniGist"
      >
        UniGist
      </h1>
      <p className="font-cyber text-lg md:text-xl text-retro-hot-pink animate-blink">
        Your secrets, your voice, your drama. 💫
      </p>
      <div className="mt-4 font-pixel text-xs text-retro-cyber-yellow">
        ★ ANONYMOUS ★ CHAOTIC ★ LEGENDARY ★
      </div>
    </header>
  );
};

export default PageHeader;
