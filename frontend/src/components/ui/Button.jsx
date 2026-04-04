export default function Button({ children, variant = "primary", ...props }) {
  const base = "px-6 py-3 rounded-2xl font-semibold transition-all active:scale-95 flex items-center justify-center gap-2 shadow-md";

  const styles = {
    primary: "bg-primary hover:bg-accent text-soft shadow-soft hover:shadow-lg",
    secondary: "bg-soft border border-primary/50 hover:bg-primary/10 text-text shadow hover:shadow-md",
    accent: "bg-accent hover:bg-primary text-text shadow-soft hover:shadow-lg"
  };

  return (
    <button className={`${base} ${styles[variant]}`} {...props}>
      {children}
    </button>
  );
}