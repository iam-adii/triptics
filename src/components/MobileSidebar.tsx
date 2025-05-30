import React, { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { Menu, X, Car, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "./ui/badge";

type NavigationItemProps = {
  to: string;
  icon: React.ReactNode;
  label: string;
  onClose: () => void;
  badge?: string;
};

const NavigationItem: React.FC<NavigationItemProps> = ({ 
  to, 
  icon, 
  label, 
  onClose,
  badge 
}) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => 
        cn(
          "flex items-center gap-3 px-3 py-3.5 rounded-md text-sm transition-colors",
          isActive 
            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 font-medium" 
            : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
        )
      }
      onClick={onClose}
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

export function MobileSidebar() {
  const [open, setOpen] = useState(false);
  const handleClose = () => setOpen(false);

  // Define navigation items
  const navigationItems = [
    { 
      to: "/", 
      icon: <LayoutDashboard className="w-full h-full" />, 
      label: "Dashboard"
    },
    { 
      to: "/leads", 
      icon: <User className="w-full h-full" />, 
      label: "Leads"
    },
    { 
      to: "/customers", 
      icon: <Users className="w-full h-full" />, 
      label: "Customers"
    },
    { 
      to: "/itineraries", 
      icon: <Map className="w-full h-full" />, 
      label: "Itineraries"
    },
    { 
      to: "/bookings", 
      icon: <Package className="w-full h-full" />, 
      label: "Bookings"
    },
    { 
      to: "/payments", 
      icon: <CreditCard className="w-full h-full" />, 
      label: "Payments"
    },
    { 
      to: "/transfers", 
      icon: <Car className="w-full h-full" />, 
      label: "Transfers"
    },
    { 
      to: "/hotels", 
      icon: <Building2 className="w-full h-full" />, 
      label: "Hotels"
    },
    { 
      to: "/reports", 
      icon: <BarChart4 className="w-full h-full" />, 
      label: "Reports"
    },
    { 
      to: "/calendar", 
      icon: <Calendar className="w-full h-full" />, 
      label: "Calendar"
    },
    { 
      to: "/settings", 
      icon: <Settings className="w-full h-full" />, 
      label: "Settings"
    },
  ];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden h-10 w-10">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent 
        side="left" 
        className="p-0 w-[85vw] max-w-[320px] sm:max-w-[320px] overflow-y-auto"
        hideCloseButton
      >
        <div className="border-b h-16 px-4 flex flex-row items-center justify-between">
          <Link to="/" className="flex items-center gap-2" onClick={handleClose}>
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
            <span className="text-lg font-medium">Triptics</span>
          </Link>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8" 
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <nav className="flex flex-col py-4 px-3 gap-1.5">
          {navigationItems.map((item) => (
            <NavigationItem
              key={item.label}
              to={item.to}
              icon={item.icon}
              label={item.label}
              onClose={handleClose}
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
              className="flex items-center gap-2 mt-3 bg-emerald-500 hover:bg-emerald-600 text-white text-xs py-2.5 px-3 rounded-md transition-colors w-full justify-center"
            >
              <MessageCircle className="w-4 h-4" />
              Connect to WhatsApp
            </a>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
} 