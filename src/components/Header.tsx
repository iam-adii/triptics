import React from "react";
import { Menu, Moon, Settings, Sun, LogOut, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useNavigate, Link } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "./ui/button";
import { MobileSidebar } from "./MobileSidebar";
import { GlobalSearch } from "./GlobalSearch";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { NotificationBell } from "./NotificationBell";

export function Header() {
  const { theme, toggleTheme } = useTheme();
  const { currentUser, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'manager':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'finance':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'telly caller':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'marketing':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'backoffice':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // If not authenticated, don't show the full header
  if (!isAuthenticated) {
    return (
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background px-4">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="bg-emerald-500 rounded-full p-1.5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-emerald-50"
              >
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                <circle cx="12" cy="9" r="2.5" />
              </svg>
            </div>
            <span className="text-lg font-semibold">Triptics</span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 px-3 gap-1.5 border-muted-foreground/20"
                  onClick={toggleTheme}
                >
                  {theme === "dark" ? (
                    <>
                      <Moon className="h-4 w-4" />
                      <span className="text-xs hidden sm:inline-block">Dark</span>
                    </>
                  ) : (
                    <>
                      <Sun className="h-4 w-4" />
                      <span className="text-xs hidden sm:inline-block">Light</span>
                    </>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Switch to {theme === "dark" ? "light" : "dark"} mode</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background px-4">
      <div className="flex items-center gap-3 w-[220px]">
        <MobileSidebar />
        <Link to="/" className="flex items-center gap-2">
          <div className="bg-emerald-500 rounded-full p-1.5">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-emerald-50"
            >
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
              <circle cx="12" cy="9" r="2.5" />
            </svg>
          </div>
          <span className="text-lg font-semibold">Triptics</span>
        </Link>
      </div>

      <div className="flex-1 flex justify-start pl-3 pr-4 hidden md:flex">
        <GlobalSearch />
      </div>

      <div className="flex items-center gap-2 min-w-[160px] justify-end">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-3 gap-1.5 border-muted-foreground/20"
                onClick={toggleTheme}
              >
                {theme === "dark" ? (
                  <>
                    <Moon className="h-4 w-4" />
                    <span className="text-xs hidden sm:inline-block">Dark</span>
                  </>
                ) : (
                  <>
                    <Sun className="h-4 w-4" />
                    <span className="text-xs hidden sm:inline-block">Light</span>
                  </>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Switch to {theme === "dark" ? "light" : "dark"} mode</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <NotificationBell />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-9 w-9 rounded-full"
            >
              <Avatar className="h-9 w-9">
                <AvatarImage src="" alt={currentUser?.firstName} />
                <AvatarFallback className="bg-emerald-500 text-white">
                  {currentUser?.firstName?.[0]}{currentUser?.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-2">
                <p className="text-sm font-medium leading-none">{currentUser?.firstName} {currentUser?.lastName}</p>
                <p className="text-xs leading-none text-muted-foreground">{currentUser?.email}</p>
                <Badge className={`${getRoleBadgeColor(currentUser?.role || '')} w-fit mt-1`}>
                  {currentUser?.role.charAt(0).toUpperCase() + currentUser?.role.slice(1)}
                </Badge>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleNavigate("/settings")}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
