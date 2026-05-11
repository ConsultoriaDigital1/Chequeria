export function BrandLogo({ className }) {
  return (
    <div className={`brand-logo ${className || ""}`}>
      <div className="brand-logo__icon">
        <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true">
          <rect x="1.5" y="1.5" width="23" height="23" rx="6" stroke="currentColor" strokeWidth="1.6" />
          <path
            d="M7 13L11 17L19 9"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div>
        <p className="brand-logo__eyebrow">Consultoría Digital</p>
        <p className="brand-logo__name">chequerIA</p>
      </div>
    </div>
  );
}
