import { ChevronRight } from "lucide-react";
import { Link } from "react-router";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
}

export function PageHeader({ title, description, breadcrumbs, actions }: PageHeaderProps) {
  return (
    <div className="border-b border-zinc-200 bg-white">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="px-8 pt-4">
          <nav className="flex items-center gap-2 text-sm">
            {breadcrumbs.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                {index > 0 && <ChevronRight className="w-4 h-4 text-zinc-400" />}
                {item.href ? (
                  <Link
                    to={item.href}
                    className="text-zinc-600 hover:text-zinc-900 transition-colors"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span className="text-zinc-900 font-medium">{item.label}</span>
                )}
              </div>
            ))}
          </nav>
        </div>
      )}
      <div className="px-8 py-4 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-zinc-900">{title}</h2>
          {description && <p className="text-sm text-zinc-500 mt-1">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </div>
    </div>
  );
}
