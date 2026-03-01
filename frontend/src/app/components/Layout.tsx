import { Outlet, Link, useLocation } from "react-router";
import { useState } from "react";
import {
  Activity,
  FolderTree,
  BookOpen,
  Plug,
  BarChart3,
  Bot,
  ChevronDown,
  ChevronRight,
  Settings as SettingsIcon,
  UserCircle,
  Menu,
  Settings,
  Cable,
} from "lucide-react";
import { TenantSelector } from "./TenantSelector";
import { TenantProvider } from "../context/TenantContext";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

const navigation = [
  { name: "Agent Console", path: "/", icon: Activity },
  { name: "Knowledge", path: "/knowledge", icon: BookOpen },
  { name: "Evaluation", path: "/evaluation", icon: BarChart3 },
  {
    name: "Admin",
    icon: SettingsIcon,
    children: [
      { name: "Tenant Setup", path: "/tenant-setup", icon: Settings },
      { name: "Classification", path: "/classification", icon: FolderTree },
      { name: "Adapters", path: "/adapters", icon: Plug },
      { name: "Connectors", path: "/connectors/servicenow", icon: Cable },
    ]
  },
];

export default function Layout() {
  const location = useLocation();
  const [adminExpanded, setAdminExpanded] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <TenantProvider>
    <div className="flex h-screen bg-zinc-50 flex-col">
      {/* Top App Bar */}
      <header className="h-14 bg-white border-b border-zinc-200 flex items-center justify-between px-6 flex-shrink-0">
        {/* Left: Product Name + Mobile Menu */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <Bot className="w-5 h-5 text-zinc-900" />
            <h1 className="font-semibold text-zinc-900">Agent Control Plane</h1>
          </div>
        </div>

        {/* Center: Environment Badge */}
        <div className="absolute left-1/2 -translate-x-1/2 hidden md:block">
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            Dev Environment
          </Badge>
        </div>

        {/* Right: Tenant Selector + User + Settings */}
        <div className="flex items-center gap-3">
          <TenantSelector />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 p-1 rounded-lg hover:bg-zinc-100 transition-colors">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-blue-100 text-blue-700 text-sm">
                    JD
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium text-zinc-900">John Doe</p>
                <p className="text-xs text-zinc-500">john.doe@example.com</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <UserCircle className="w-4 h-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <SettingsIcon className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <button className="p-2 rounded-lg hover:bg-zinc-100 transition-colors">
            <SettingsIcon className="w-5 h-5 text-zinc-600" />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <aside
          className={`
            w-64 bg-white border-r border-zinc-200 flex flex-col flex-shrink-0
            ${sidebarOpen ? 'block' : 'hidden'} lg:block
          `}
        >
          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {navigation.map((item) => {
              if (item.children) {
                return (
                  <div key={item.name}>
                    <button
                      onClick={() => setAdminExpanded(!adminExpanded)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
                    >
                      <div className="flex items-center">
                        <item.icon className="w-5 h-5 mr-3" />
                        {item.name}
                      </div>
                      {adminExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                    {adminExpanded && (
                      <div className="ml-4 mt-1 space-y-1">
                        {item.children.map((child) => {
                          const Icon = child.icon;
                          const active = isActive(child.path);
                          return (
                            <Link
                              key={child.path}
                              to={child.path}
                              className={`
                                flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors
                                ${
                                  active
                                    ? "bg-zinc-100 text-zinc-900"
                                    : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                                }
                              `}
                            >
                              <Icon className="w-5 h-5 mr-3" />
                              {child.name}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              const Icon = item.icon;
              const active = isActive(item.path!);

              return (
                <Link
                  key={item.path}
                  to={item.path!}
                  className={`
                    flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors
                    ${
                      active
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
              <span>System Status</span>
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
    </div>
    </TenantProvider>
  );
}
