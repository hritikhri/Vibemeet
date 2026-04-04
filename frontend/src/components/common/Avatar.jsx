export default function Avatar({ src, size = "md" }) {
  const sizes = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16"
  };

  return (
    <img 
      src={src} 
      alt="avatar" 
      className={`${sizes[size]} rounded-2xl object-cover border-2 border-white shadow-sm`}
    />
  );
}