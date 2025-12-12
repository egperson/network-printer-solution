import React from "react";

export default function CustomCard({
  children,
  title,
  subtitle,
  icon,
  actions,
  variant = "default",
  glassVariant = "default",
  hover = false,
  className = "",
}) {
  const glassVariants = {
    default: "glass-card",
    dark: "glass-card dark",
    light: "glass-card light",
    intense: "glass-card intense",
  };

  const colorVariants = {
    default: "",
    primary: "card-primary",
    success: "card-success",
    warning: "card-warning",
    danger: "card-danger",
  };

  const glassClass = glassVariants[glassVariant] || glassVariants.default;
  const colorClass = colorVariants[variant] || colorVariants.default;

  const hoverClass = hover
    ? "" // Hover is handled by CSS now for glass cards
    : "";

  return (
    <div className={`${glassClass} ${colorClass} ${className}`}>
      {(title || icon || actions) && (
        <div className="card-header flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            {icon && <span className="mi text-2xl">{icon}</span>}
            <div>
              {title && <h3 className="font-semibold text-lg">{title}</h3>}
              {subtitle && <p className="text-sm text-white/60">{subtitle}</p>}
            </div>
          </div>
          {actions && <div className="flex gap-2">{actions}</div>}
        </div>
      )}
      <div className="card-body p-4">{children}</div>
    </div>
  );
}
