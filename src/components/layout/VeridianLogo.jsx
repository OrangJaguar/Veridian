export default function VeridianLogo({ size = 32, className = '' }) {
  return (
    <img
      src="/veridian-logo.png"
      alt="Veridian"
      width={size}
      height={size}
      className={`veridian-logo ${className}`.trim()}
      draggable={false}
    />
  );
}
