"use client"

import { useEffect, useState } from 'react';
import WelcomeModal from './welcome-modal';

export default function WelcomeHandler() {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const hasVisited = localStorage.getItem('hasVisited');
    if (!hasVisited) {
      setShowModal(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem('hasVisited', 'true');
    setShowModal(false);
  };

  if (!showModal) {
    return null;
  }

  return <WelcomeModal isOpen={showModal} onClose={handleClose} />;
}
