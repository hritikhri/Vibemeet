export default function Badge({ children, color = "primary" }) {
  const colors = {
    primary: "bg-primary/10 text-primary",
    accent: "bg-accent/10 text-accent",
    secondary: "bg-secondary/10 text-secondary"
  };

  return (
    <span className={`px-4 py-1 text-xs font-medium rounded-2xl ${colors[color]}`}>
      {children}
    </span>
  );
}