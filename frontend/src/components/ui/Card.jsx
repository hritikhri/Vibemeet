export default function Card({ children, className = "" }) {
  return (
    <div className={`bg-white rounded-3xl shadow-soft border border-primary/5 overflow-hidden ${className}`}>
      {children}
    </div>
  );
}