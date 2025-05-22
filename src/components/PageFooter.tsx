
import React from 'react';

const PageFooter = () => {
  return (
    <footer className="mt-16 text-center">
      <div className="retro-card max-w-lg mx-auto">
        <p className="font-pixel text-xs text-retro-cyber-yellow mb-2 animate-blink">
          ⚠️ DISCLAIMER ⚠️
        </p>
        <p className="font-cyber text-sm text-retro-hot-pink">
          We know nothing. We saw nothing. 
          <br />
          Your secrets are safe in the digital void. 🌌
        </p>
        <div className="mt-4 font-pixel text-xs text-retro-neon-green">
          Made with 💀 and early 2000s nostalgia
        </div>
      </div>
    </footer>
  );
};

export default PageFooter;
