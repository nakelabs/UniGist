
import React from 'react';

const PageFooter = () => {
  return (
    <footer className="mt-16 text-center px-4">
      {/* Enhanced Disclaimer Container */}
      <div className="max-w-2xl mx-auto relative">
        {/* Glow backdrop */}
        <div className="absolute inset-0 bg-gradient-to-br from-retro-hot-pink/20 to-retro-cyber-yellow/20 rounded-3xl blur-sm"></div>
        
        {/* Main disclaimer card */}
        <div className="relative bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-xl border border-retro-hot-pink/50 rounded-3xl p-4 sm:p-8 shadow-2xl shadow-retro-hot-pink/20">
          {/* Warning header */}
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-4 sm:mb-6 flex-wrap">
            <div className="w-3 h-3 bg-retro-hot-pink rounded-full animate-pulse"></div>
            <h3 className="font-pixel text-sm sm:text-lg text-retro-cyber-yellow animate-pulse text-center">
              ⚠️ DIGITAL DISCLAIMER ⚠️
            </h3>
            <div className="w-3 h-3 bg-retro-hot-pink rounded-full animate-pulse"></div>
          </div>
          
          {/* Main disclaimer text */}
          <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
            <p className="font-cyber text-sm sm:text-base text-retro-hot-pink leading-relaxed px-2 sm:px-0">
              <span className="block sm:inline">We know nothing. We saw nothing.</span>
              <br className="hidden sm:block" />
              <span className="text-retro-neon-green block sm:inline mt-1 sm:mt-0">Your secrets are safe in the digital void.</span> 🌌
            </p>
            
            <div className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm text-retro-electric-blue/80 font-cyber flex-wrap">
              <span>🔒</span>
              <span>Anonymous</span>
              <span>•</span>
              <span>🌐</span>
              <span>Decentralized</span>
              <span>•</span>
              <span>👻</span>
              <span>Ephemeral</span>
            </div>
          </div>
          
          {/* Bottom signature */}
          <div className="pt-4 sm:pt-6 border-t border-gray-700/50">
            <div className="flex items-center justify-center gap-1 sm:gap-2 font-pixel text-xs sm:text-sm text-retro-neon-green flex-wrap">
              <span>Made with</span>
              <span className="text-retro-hot-pink animate-pulse">💀</span>
              <span className="text-center">and early 2000s nostalgia</span>
            </div>
            <div className="mt-2 text-xs text-gray-400 font-cyber px-2 sm:px-0">
              © 2025 nakelabs • No logs, no traces, no worries
            </div>
          </div>
          
          {/* Decorative corners */}
          <div className="absolute top-4 left-4 w-6 h-6 border-l-2 border-t-2 border-retro-cyber-yellow rounded-tl-lg"></div>
          <div className="absolute top-4 right-4 w-6 h-6 border-r-2 border-t-2 border-retro-cyber-yellow rounded-tr-lg"></div>
          <div className="absolute bottom-4 left-4 w-6 h-6 border-l-2 border-b-2 border-retro-cyber-yellow rounded-bl-lg"></div>
          <div className="absolute bottom-4 right-4 w-6 h-6 border-r-2 border-b-2 border-retro-cyber-yellow rounded-br-lg"></div>
        </div>
      </div>
    </footer>
  );
};

export default PageFooter;
