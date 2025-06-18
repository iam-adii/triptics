import React from "react";
import { NavLink } from "react-router-dom";
import {
  Calendar,
  LayoutDashboard,
  Map,
  Package,
  Settings,
  User,
  Users,
  BarChart4,
  CreditCard,
  MessageCircle,
  Car,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "./ui/badge";
import { useAuth } from "@/contexts/AuthContext";

type NavigationItemProps = {
  to: string;
  icon: React.ReactNode;
  label: string;
  badge?: string;
  pageId: string;
};

const NavigationItem: React.FC<NavigationItemProps> = ({ to, icon, label, badge, pageId }) => {
  const { hasPermission } = useAuth();
  
  // Don't render the navigation item if the user doesn't have permission
  if (!hasPermission(pageId)) {
    return null;
  }
  
  return (
    <NavLink
      to={to}
      className={({ isActive }) => 
        cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors",
          isActive 
            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 font-medium" 
            : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
        )
      }
    >
      <span className="flex-shrink-0 w-5 h-5">{icon}</span>
      <span className="truncate font-medium">{label}</span>
      {badge && (
        <Badge variant="outline" className="ml-auto text-xs">
          {badge}
        </Badge>
      )}
    </NavLink>
  );
};

export function Sidebar() {
  const { isAuthenticated } = useAuth();
  
  // If not authenticated, don't render the sidebar
  if (!isAuthenticated) {
    return null;
  }
  
  // Define navigation items
  const navigationItems = [
    { 
      to: "/", 
      icon: <LayoutDashboard className="w-full h-full" />, 
      label: "Dashboard",
      pageId: "dashboard"
    },
    { 
      to: "/leads", 
      icon: <User className="w-full h-full" />, 
      label: "Leads",
      pageId: "leads"
    },
    { 
      to: "/customers", 
      icon: <Users className="w-full h-full" />, 
      label: "Customers",
      pageId: "customers"
    },
    { 
      to: "/itineraries", 
      icon: <Map className="w-full h-full" />, 
      label: "Itineraries",
      pageId: "itineraries"
    },
    { 
      to: "/bookings", 
      icon: <Package className="w-full h-full" />, 
      label: "Bookings",
      pageId: "bookings"
    },
    { 
      to: "/payments", 
      icon: <CreditCard className="w-full h-full" />, 
      label: "Payments",
      pageId: "payments"
    },
    { 
      to: "/transfers", 
      icon: <Car className="w-full h-full" />, 
      label: "Transfers",
      pageId: "transfers"
    },
    { 
      to: "/transfer-routes", 
      icon: <Map className="w-full h-full" />, 
      label: "Transfer Routes",
      pageId: "transfers"
    },
    { 
      to: "/hotels", 
      icon: <Building2 className="w-full h-full" />, 
      label: "Hotels",
      pageId: "hotels"
    },
    { 
      to: "/reports", 
      icon: <BarChart4 className="w-full h-full" />, 
      label: "Reports",
      pageId: "reports"
    },
    { 
      to: "/calendar", 
      icon: <Calendar className="w-full h-full" />, 
      label: "Calendar",
      pageId: "calendar"
    },
    { 
      to: "/settings", 
      icon: <Settings className="w-full h-full" />, 
      label: "Settings",
      pageId: "settings"
    },
  ];

  return (
    <aside className="hidden md:flex h-[calc(100vh-64px)] w-[240px] flex-col fixed top-16 bg-background border-r">
      <nav className="flex flex-col flex-1 py-2 px-3 gap-1 overflow-y-auto">
        {navigationItems.map((item) => (
          <NavigationItem
            key={item.label}
            to={item.to}
            icon={item.icon}
            label={item.label}
            pageId={item.pageId}
          />
        ))}
      </nav>
      
      <div className="p-3 mb-2">
        <div className="bg-secondary/40 rounded-md p-3">
          <p className="text-xs text-sidebar-foreground/80">Need help?</p>
          <p className="text-xs text-sidebar-foreground/60 mt-1">Contact support for assistance with your tour management.</p>
          <a 
            href="https://wa.link/phcix9" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 mt-3 bg-emerald-500 hover:bg-emerald-600 text-white text-xs py-2 px-3 rounded-md transition-colors w-full justify-center"
          >
            <MessageCircle className="w-4 h-4" />
            Connect to WhatsApp
          </a>
        </div>
      </div>
    </aside>
  );
}
