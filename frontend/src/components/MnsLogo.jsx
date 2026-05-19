export function MnsLogo() {
  return (
    <div className="brand-lockup" aria-label="MNS logo">
      <svg className="brand-logo" viewBox="0 0 64 64" role="img" aria-hidden="true">
        <defs>
          <linearGradient id="mns-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f1b267" />
            <stop offset="100%" stopColor="#cb5b2f" />
          </linearGradient>
        </defs>
        <rect x="6" y="6" width="52" height="52" rx="16" fill="#0f5c6e" />
        <path
          d="M18 42V22h6l8 11 8-11h6v20h-6V31l-8 10-8-10v11h-6Z"
          fill="url(#mns-gradient)"
        />
      </svg>
      <div>
        <p className="brand-kicker">MNS</p>
        <h1 className="brand-title">Inventory Control</h1>
      </div>
    </div>
  );
}
