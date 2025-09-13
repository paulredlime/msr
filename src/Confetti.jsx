import React from 'react';

export default function Confetti() {
  return (
    <div className="confetti-container">
      {Array.from({ length: 150 }, (_, i) => (
        <div key={i} className="confetti-piece" />
      ))}
      
      <style jsx>{`
        .confetti-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 9999;
          overflow: hidden;
        }

        .confetti-piece {
          position: absolute;
          width: 10px;
          height: 20px;
          background-color: #f00;
          top: -20px;
          opacity: 0;
          animation: fall 5s linear infinite;
        }

        @keyframes fall {
          0% {
            transform: translateY(-20px) rotateZ(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotateZ(720deg);
            opacity: 0;
          }
        }

        .confetti-piece:nth-child(10n + 1) { background-color: #ffd700; }
        .confetti-piece:nth-child(10n + 2) { background-color: #ff4500; }
        .confetti-piece:nth-child(10n + 3) { background-color: #00ced1; }
        .confetti-piece:nth-child(10n + 4) { background-color: #ff69b4; }
        .confetti-piece:nth-child(10n + 5) { background-color: #32cd32; }
        .confetti-piece:nth-child(10n + 6) { background-color: #1e90ff; }
        .confetti-piece:nth-child(10n + 7) { background-color: #9370db; }
        .confetti-piece:nth-child(10n + 8) { background-color: #ffa500; }
        .confetti-piece:nth-child(10n + 9) { background-color: #adff2f; }
        .confetti-piece:nth-child(10n + 0) { background-color: #ff1493; }

        .confetti-piece:nth-child(1) { left: 10%; animation-delay: 0.2s; animation-duration: 4.2s; }
        .confetti-piece:nth-child(2) { left: 20%; animation-delay: 0.7s; animation-duration: 5.7s; }
        .confetti-piece:nth-child(3) { left: 30%; animation-delay: 0.1s; animation-duration: 3.1s; }
        .confetti-piece:nth-child(4) { left: 40%; animation-delay: 0.4s; animation-duration: 4.4s; }
        .confetti-piece:nth-child(5) { left: 50%; animation-delay: 0.9s; animation-duration: 5.9s; }
        .confetti-piece:nth-child(6) { left: 60%; animation-delay: 0.3s; animation-duration: 3.3s; }
        .confetti-piece:nth-child(7) { left: 70%; animation-delay: 0.8s; animation-duration: 4.8s; }
        .confetti-piece:nth-child(8) { left: 80%; animation-delay: 0.5s; animation-duration: 5.5s; }
        .confetti-piece:nth-child(9) { left: 90%; animation-delay: 0.6s; animation-duration: 3.6s; }
        .confetti-piece:nth-child(10) { left: 5%; animation-delay: 1s; animation-duration: 5s; }
        .confetti-piece:nth-child(11) { left: 15%; animation-delay: 1.2s; animation-duration: 4.2s; }
        .confetti-piece:nth-child(12) { left: 25%; animation-delay: 1.7s; animation-duration: 5.7s; }
        .confetti-piece:nth-child(13) { left: 35%; animation-delay: 1.1s; animation-duration: 3.1s; }
        .confetti-piece:nth-child(14) { left: 45%; animation-delay: 1.4s; animation-duration: 4.4s; }
        .confetti-piece:nth-child(15) { left: 55%; animation-delay: 1.9s; animation-duration: 5.9s; }
        .confetti-piece:nth-child(16) { left: 65%; animation-delay: 1.3s; animation-duration: 3.3s; }
        .confetti-piece:nth-child(17) { left: 75%; animation-delay: 1.8s; animation-duration: 4.8s; }
        .confetti-piece:nth-child(18) { left: 85%; animation-delay: 1.5s; animation-duration: 5.5s; }
        .confetti-piece:nth-child(19) { left: 95%; animation-delay: 1.6s; animation-duration: 3.6s; }
        .confetti-piece:nth-child(20) { left: 2%; animation-delay: 2s; animation-duration: 5s; }
      `}</style>
    </div>
  );
}