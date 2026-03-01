import { Outlet, Link, useLocation } from "react-router";
import { 
  Activity, 
  FolderTree, 
  BookOpen, 
  Plug, 
  BarChart3, 
  Bot 
} from "lucide-react";

const navigation = [
  { name: "Agent Console", path: "/", icon: Activity },
  { name: "Classification", path: "/classification", icon: FolderTree },
  { name: "Knowledge", path: "/knowledge", icon: BookOpen },
  { name: "Adapters", path: "/adapters", icon: Plug },
  { name: "Evaluation", path: "/evaluation", icon: BarChart3 },
];

export default function Layout() {
  const location = useLocation();

  return (
    <div className="flex h-screen bg-zinc-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-zinc-200 flex flex-col">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-zinc-200">
          <Bot className="w-6 h-6 text-zinc-900 mr-3" />
          <div>
            <h1 className="font-semibold text-zinc-900">Agent Control Plane</h1>
            <p className="text-xs text-zinc-500">Enterprise Edition</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = 
              location.pathname === item.path || 
              (item.path !== "/" && location.pathname.startsWith(item.path));
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors
                  ${
                    isActive
                      ? "bg-zinc-100 text-zinc-900"
                      : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                  }
                `}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-200">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>Status</span>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></div>
              <span>Operational</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
