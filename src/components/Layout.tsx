import React, { useState, useEffect } from 'react';
import PageFooter from './PageFooter';
import TermsAndConditions from './TermsAndConditions';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [termsAccepted, setTermsAccepted] = useState(true); // Default to true to avoid flash

  useEffect(() => {
    // Check local storage to see if terms have been accepted
    const accepted = localStorage.getItem('termsAccepted') === 'true';
    setTermsAccepted(accepted);
  }, []);

  const handleAcceptTerms = () => {
    setTermsAccepted(true);
  };

  // If terms haven't been accepted, show the terms page
  if (!termsAccepted) {
    return <TermsAndConditions onAccept={handleAcceptTerms} />;
  }

  // Otherwise show the actual site content
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow">
        {children}
      </main>
      <PageFooter />
    </div>
  );
};

export default Layout;