const SIZE_STYLES = {
  sm: "w-8 h-8 rounded-lg text-xs",
  md: "w-9 h-9 rounded-lg text-xs",
  lg: "w-12 h-12 rounded-xl text-base",
  xl: "w-16 h-16 rounded-xl text-xl",
};

export default function AgentAvatar({
  initials,
  color = "#C9A227",
  size = "md",
  className = "",
}) {
  return (
    <div
      className={`
        ${SIZE_STYLES[size] || SIZE_STYLES.md}
        flex items-center justify-center
        flex-shrink-0
        font-bold
        text-white
        ${className}
      `}
      style={{ backgroundColor: color }}
      aria-label={`Avatar de ${initials}`}
    >
      {initials}
    </div>
  );
}