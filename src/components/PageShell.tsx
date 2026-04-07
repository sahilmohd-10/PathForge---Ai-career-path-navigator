import React from 'react';

interface PageShellProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  maxWidth?: string;
  children: React.ReactNode;
}

const PageShell: React.FC<PageShellProps> = ({ title, subtitle, actions, maxWidth = 'max-w-7xl', children }) => {
  return (
    <div className={`p-8 ${maxWidth} mx-auto`}>
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl lg:text-4xl font-semibold text-gray-900 dark:text-neon-cyan transition-colors duration-300">{title}</h1>
          {subtitle && <p className="mt-2 text-gray-500 dark:text-neon-light max-w-2xl transition-colors duration-300">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-3 transition-all duration-300">{actions}</div>}
      </div>
      {children}
    </div>
  );
};

export default PageShell;

