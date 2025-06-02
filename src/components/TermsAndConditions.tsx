import React, { useState, useEffect } from 'react';

interface TermsAndConditionsProps {
  onAccept: () => void;
  onClose?: () => void; // Optional close handler for when already accepted
  alreadyAccepted?: boolean; // Whether the user has already accepted the terms
}

const TermsAndConditions: React.FC<TermsAndConditionsProps> = ({ 
  onAccept,
  onClose,
  alreadyAccepted = false
}) => {
  const [declined, setDeclined] = useState(false);
  const [glitchText, setGlitchText] = useState("ACCESS DENIED");

  // Create a glitch effect for the text when denied
  useEffect(() => {
    if (!declined) return;
    
    const glitchInterval = setInterval(() => {
      const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>/?`~";
      const randomChar = () => characters.charAt(Math.floor(Math.random() * characters.length));
      
      if (Math.random() > 0.7) {
        const position = Math.floor(Math.random() * "ACCESS DENIED".length);
        const newText = "ACCESS DENIED".split('').map((char, i) => 
          i === position ? randomChar() : char
        ).join('');
        setGlitchText(newText);
      } else {
        setGlitchText("ACCESS DENIED");
      }
    }, 100);
    
    return () => clearInterval(glitchInterval);
  }, [declined]);

  const handleAccept = () => {
    localStorage.setItem('termsAccepted', 'true');
    onAccept();
  };

  const handleDecline = () => {
    setDeclined(true);
  };

  if (declined) {
    return (
      <div className="fixed inset-0 bg-black text-green-400 font-mono overflow-hidden flex flex-col items-center justify-center">
        <div className="animate-pulse">
          <h1 className="text-6xl font-bold mb-4 animate-glitch tracking-widest text-red-500">
            {glitchText}
          </h1>
          
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-xl mb-8 animate-typewriter">SYSTEM ERROR: USER AUTHENTICATION FAILED</p>
            
            <div className="mb-8">
              <div className="text-sm mb-2">ERROR CODE: 0x80070005</div>
              <div className="h-3 w-full bg-gray-800 rounded-full">
                <div className="h-3 bg-red-500 rounded-full animate-loadingBar" style={{width: '100%'}}></div>
              </div>
            </div>
            
            <pre className="text-left bg-black p-4 border border-green-500 mb-8 overflow-x-auto">
              {Array(10).fill(0).map((_, i) => (
                <div key={i} className={`${i % 2 === 0 ? 'text-green-400' : 'text-green-600'}`}>
                  {`${Math.random().toString(36).substring(2, 15)} // ACCESS VIOLATION AT ADDRESS ${Math.floor(Math.random() * 0xFFFFFFFF).toString(16).toUpperCase()}`}
                </div>
              ))}
            </pre>
            
            <div className="text-lg animate-blink text-red-500 mb-6">
              YOU MUST ACCEPT THE TERMS TO CONTINUE
            </div>
            
            <button 
              onClick={() => setDeclined(false)}
              className="px-8 py-3 bg-green-500 text-black hover:bg-green-400 border-2 border-green-700 font-bold uppercase tracking-wider animate-pulse"
            >
              RETRY
            </button>
          </div>
        </div>
        
        <div className="fixed bottom-0 left-0 w-full py-2 bg-red-900 text-white text-center text-xs animate-blink">
          SYSTEM SECURITY BREACH ATTEMPT LOGGED • IP ADDRESS CAPTURED • {new Date().toISOString()}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 p-4">
      <div className="retro-card max-w-4xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-pixel text-retro-cyber-yellow">📜 Terms and Conditions</h2>
          {alreadyAccepted && onClose && (
            <button 
              onClick={onClose}
              className="text-retro-hot-pink hover:text-retro-cyber-yellow"
              aria-label="Close"
            >
              ✕
            </button>
          )}
        </div>
        <p className="text-sm text-retro-neon-green font-cyber mb-4">Effective Date: May 23, 2025</p>
        
        <div className="text-retro-pastel-blue font-cyber mb-6">
          <p className="mb-4">
            Welcome to UniGist. By accessing or using this website, you agree to comply with and be bound by the following Terms and Conditions. 
            If you do not agree to these terms, you must refrain from using the service.
          </p>
          
          <h3 className="font-pixel text-retro-hot-pink mt-4 mb-2">1. 🕶️ Anonymity and User Responsibility</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>While the platform permits anonymous submissions, all users remain fully responsible for the content they post.</li>
            <li>Users shall not use anonymity as a means to engage in unlawful, harmful, or malicious conduct.</li>
            <li>The platform reserves the right to remove or moderate any content that violates these terms or applicable laws, without prior notice.</li>
          </ul>
          
          <h3 className="font-pixel text-retro-hot-pink mt-4 mb-2">2. 🚫 Prohibited Content</h3>
          <p>Users are strictly prohibited from posting, uploading, or sharing any of the following:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Hate speech, discriminatory remarks, or harassment directed at individuals or groups;</li>
            <li>False statements or defamation of any individual, entity, or organization;</li>
            <li>Personal information including, but not limited to, names, phone numbers, email addresses, or home addresses without explicit consent;</li>
            <li>Threats, incitement to violence, or content promoting illegal activities;</li>
            <li>Pornographic, sexually explicit, or otherwise inappropriate material;</li>
            <li>Any media or content that infringes upon the intellectual property rights of third parties.</li>
          </ul>
          
          <h3 className="font-pixel text-retro-hot-pink mt-4 mb-2">3. 🔊 User-Generated Media</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>Users may submit text, images, audio, and video content in accordance with these terms.</li>
            <li>Users must ensure that all submitted content is original, or that they hold the necessary rights and permissions for its use and publication.</li>
          </ul>
          
          <h3 className="font-pixel text-retro-hot-pink mt-4 mb-2">4. 👮 Moderation and Enforcement</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>The platform administrators reserve the right to review, edit, delete, or otherwise moderate content at their discretion.</li>
            <li>Users who repeatedly violate these Terms and Conditions may be permanently banned, including by means of IP address restriction.</li>
            <li>The platform may cooperate with legal authorities if content violates local, national, or international laws.</li>
          </ul>
          
          <h3 className="font-pixel text-retro-hot-pink mt-4 mb-2">5. 📢 Reporting and Feedback</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>Users are encouraged to report content that violates these Terms using the platform's designated reporting mechanism (🚩).</li>
            <li>Feedback, questions, or suggestions may be submitted via email at support@unigist.com.</li>
          </ul>
          
          <h3 className="font-pixel text-retro-hot-pink mt-4 mb-2">6. 🛠️ Modifications to Terms</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>These Terms and Conditions may be amended at any time without prior notice.</li>
            <li>Continued use of the platform following any such changes shall constitute acceptance of the revised Terms.</li>
          </ul>
          
          <h3 className="font-pixel text-retro-hot-pink mt-4 mb-2">7. ⚖️ Legal Disclaimer</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>The platform, its administrators, and its affiliates disclaim all liability for user-generated content.</li>
            <li>The platform operates independently and does not endorse or verify any content posted by users.</li>
            <li>Access to and use of this site is at the user's own risk.</li>
          </ul>
          
          <p className="mt-6 text-retro-cyber-yellow">
            By using UniGist, you affirm that you have read, understood, and agreed to these Terms and Conditions.
          </p>
        </div>
        
        <div className="flex justify-center gap-6 mt-8">
          {alreadyAccepted && onClose ? (
            <button 
              onClick={onClose}
              className="px-6 py-2 bg-retro-neon-green text-black font-pixel hover:bg-green-400"
            >
              Close
            </button>
          ) : (
            <>
              <button 
                onClick={handleAccept}
                className="px-6 py-2 bg-retro-neon-green text-black font-pixel hover:bg-green-400"
              >
                Accept
              </button>
              <button 
                onClick={handleDecline}
                className="px-6 py-2 bg-retro-hot-pink text-black font-pixel hover:bg-red-400"
              >
                Decline
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;