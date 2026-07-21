export function Brand() {
  return (
    <a className="brand" href="#top" aria-label="Flywise home">
      <svg className="brand__mark" viewBox="0 0 36 30" aria-hidden="true">
        <path d="M2 4h31c-2 5-6 7-12 7H8L2 4Z" fill="currentColor" />
        <path d="M7 13h22c-2 4-6 6-11 6h-7l-4-6Z" fill="currentColor" opacity=".78" />
        <path d="M12 21h13c-2 4-5 6-8 6l-5-6Z" fill="currentColor" opacity=".56" />
      </svg>
      <span>Flywise</span>
    </a>
  );
}
