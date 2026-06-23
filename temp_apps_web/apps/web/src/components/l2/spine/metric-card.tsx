// Shim for MetricCard component
import React from "react";

export interface MetricCardProps {
  title?: string;
  value?: string | number;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  [key: string]: any;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon,
  children,
  ...props
}) => {
  return (
    <div className="metric-card" {...props}>
      {icon && <div className="metric-card-icon">{icon}</div>}
      {title && <h3>{title}</h3>}
      {value !== undefined && <div className="metric-card-value">{value}</div>}
      {children}
    </div>
  );
};

export default MetricCard;
