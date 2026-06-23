// Shim for PageHeader component
import React from "react";

export interface PageHeaderProps {
  title?: string;
  description?: string;
  children?: React.ReactNode;
  [key: string]: any;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  children,
  ...props
}) => {
  return (
    <div className="page-header" {...props}>
      {title && <h1>{title}</h1>}
      {description && <p>{description}</p>}
      {children}
    </div>
  );
};

export default PageHeader;
