import type { ReactNode } from "react";

interface CategoryCardProps {
  label: string;
  sublabel: string;
  gradient: string;
  icon: ReactNode;
  iconBg: string;
}

export function CategoryCard({ label, sublabel, gradient, icon, iconBg }: CategoryCardProps) {
  return (
    <div className="category-card">
      <div className="category-card__image" style={{ background: gradient }} />
      <div className="category-card__footer">
        <span className="category-card__icon" style={{ backgroundColor: iconBg }}>
          {icon}
        </span>
        <div>
          <p className="category-card__label">{label}</p>
          <p className="category-card__sublabel">{sublabel}</p>
        </div>
      </div>
    </div>
  );
}
