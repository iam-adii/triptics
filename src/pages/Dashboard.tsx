import React, { Suspense, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  LineChart,
  Line,
  YAxis,
  Legend,
  TooltipProps
} from "recharts";
import { ArrowUpRight, ArrowDownRight, CalendarIcon, ChevronRight, UserPlus, Package, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { badgeVariants } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { getDashboardData } from "@/services/dashboardService";
import { useQuery } from "@tanstack/react-query";

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
        <p className="font-medium">{label}</p>
        {payload.map((entry, index) => (
          <p key={`item-${index}`} style={{ color: entry.color }}>
            {entry.name}: {entry.name === "revenue" ? `₹${entry.value.toLocaleString()}` : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Component for key metrics section
const KeyMetrics = ({ dashboardData }: { dashboardData: any }) => {
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <Card className="bg-secondary/30 border-border/30 overflow-hidden">
        <CardHeader className="pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs text-muted-foreground">
              Total Leads
            </CardTitle>
            <div className="rounded-full bg-blue-500/10 p-1">
              <UserPlus size={12} className="text-blue-500" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
          <div className="flex items-baseline justify-between">
            <div className="text-xl sm:text-2xl font-bold">{dashboardData.totalLeads}</div>
            <div className={`flex items-center gap-1 text-xs ${dashboardData.leadsGrowth.growth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {dashboardData.leadsGrowth.growth >= 0 ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : (
                <ArrowDownRight className="h-3 w-3" />
              )}
              <span>{Math.abs(dashboardData.leadsGrowth.growth)}%</span>
            </div>
          </div>
          <div className="mt-3 h-[30px] sm:h-[40px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dashboardData.monthlyData}>
                <Line
                  type="monotone"
                  dataKey="leads"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-secondary/30 border-border/30 overflow-hidden">
        <CardHeader className="pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs text-muted-foreground">
              Conversions
            </CardTitle>
            <div className="rounded-full bg-green-500/10 p-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-green-500"
              >
                <path d="M3 3v18h18" />
                <path d="m19 9-5 5-4-4-3 3" />
              </svg>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
          <div className="flex items-baseline justify-between">
            <div className="text-xl sm:text-2xl font-bold">{dashboardData.conversionRate}%</div>
            <div className={`flex items-center gap-1 text-xs ${dashboardData.conversionGrowth.growth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {dashboardData.conversionGrowth.growth >= 0 ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : (
                <ArrowDownRight className="h-3 w-3" />
              )}
              <span>{Math.abs(dashboardData.conversionGrowth.growth)}%</span>
            </div>
          </div>
          <div className="mt-3 h-[30px] sm:h-[40px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dashboardData.monthlyData}>
                <Line
                  type="monotone"
                  dataKey="conversions"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-secondary/30 border-border/30 overflow-hidden">
        <CardHeader className="pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs text-muted-foreground">
              Bookings
            </CardTitle>
            <div className="rounded-full bg-purple-500/10 p-1">
              <Package size={12} className="text-purple-500" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
          <div className="flex items-baseline justify-between">
            <div className="text-xl sm:text-2xl font-bold">{dashboardData.totalBookings}</div>
            <div className={`flex items-center gap-1 text-xs ${dashboardData.bookingsGrowth.growth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {dashboardData.bookingsGrowth.growth >= 0 ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : (
                <ArrowDownRight className="h-3 w-3" />
              )}
              <span>{Math.abs(dashboardData.bookingsGrowth.growth)}%</span>
            </div>
          </div>
          <div className="mt-3 h-[30px] sm:h-[40px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dashboardData.monthlyData}>
                <Line
                  type="monotone"
                  dataKey="conversions"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-secondary/30 border-border/30 overflow-hidden">
        <CardHeader className="pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs text-muted-foreground">
              Revenue
            </CardTitle>
            <div className="rounded-full bg-yellow-500/10 p-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-yellow-500"
              >
                <circle cx="12" cy="8" r="7" />
                <path d="M8.21 13.89 7 23l5-3 5 3-1.21-9.12" />
              </svg>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
          <div className="flex items-baseline justify-between">
            <div className="text-xl sm:text-2xl font-bold">{formatCurrency(dashboardData.totalRevenue)}</div>
            <div className={`flex items-center gap-1 text-xs ${dashboardData.revenueGrowth.growth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {dashboardData.revenueGrowth.growth >= 0 ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : (
                <ArrowDownRight className="h-3 w-3" />
              )}
              <span>{Math.abs(dashboardData.revenueGrowth.growth)}%</span>
            </div>
          </div>
          <div className="mt-3 h-[30px] sm:h-[40px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dashboardData.monthlyData}>
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#eab308"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Component for monthly performance chart
const MonthlyPerformance = ({ dashboardData }: { dashboardData: any }) => {
  return (
    <Card className="lg:col-span-2 bg-card">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <CardTitle className="text-base sm:text-lg">Monthly Performance</CardTitle>
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-blue-500"></div>
              <span className="text-xs">Leads</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-purple-500"></div>
              <span className="text-xs">Conversions</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
              <span className="text-xs">Revenue (₹10k)</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-[250px] sm:h-[300px] w-full px-2 pb-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={dashboardData.monthlyData}
              margin={{
                top: 10,
                right: 10,
                left: 0,
                bottom: 0,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
              <XAxis 
                dataKey="month" 
                axisLine={false}
                tickLine={false}
                fontSize={12}
                tickMargin={8}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                fontSize={12}
                tickMargin={8}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="leads" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
              <Bar dataKey="conversions" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={40} />
              <Bar dataKey="revenueInTenK" fill="#eab308" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

// Component for latest leads
const LatestLeads = ({ dashboardData, navigate }: { dashboardData: any, navigate: any }) => {
  return (
    <Card className="bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base sm:text-lg">Latest Leads</CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 px-2 text-xs"
            onClick={() => navigate('/leads')}
          >
            View all
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {dashboardData.recentLeads.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-muted-foreground text-sm">No leads found</p>
            </div>
          ) : (
            dashboardData.recentLeads.map((lead: any) => (
              <div key={lead.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors">
                <Avatar className="h-9 w-9 border">
                  <AvatarFallback className="text-xs bg-blue-500/10 text-blue-500">
                    {getInitials(lead.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <p className="font-medium truncate text-sm">{lead.name}</p>
                    <div className="flex items-center">
                      <span 
                        className={cn(
                          badgeVariants({ variant: "outline" }),
                          "text-[10px] h-5 px-1.5 border-0",
                          getStatusColor(lead.status)
                        )}
                      >
                        {lead.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="truncate">{lead.email}</span>
                    <span className="h-1 w-1 rounded-full bg-muted-foreground"></span>
                    <span>{lead.date}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Component for top tours
const TopTours = ({ dashboardData, navigate, formatCurrency }: { dashboardData: any, navigate: any, formatCurrency: Function }) => {
  return (
    <Card className="bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base sm:text-lg">Top Tours</CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 px-2 text-xs"
            onClick={() => navigate('/itineraries')}
          >
            View all
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {!dashboardData.topTours || dashboardData.topTours.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-muted-foreground text-sm">No tour data available</p>
            </div>
          ) : (
            dashboardData.topTours.map((tour: any, index: number) => (
              <div key={tour.id} className="flex items-center gap-3">
                <div className="flex items-center justify-center h-8 w-8 rounded-md bg-muted text-sm font-medium">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <p className="font-medium text-sm truncate">{tour.name}</p>
                    <p className="text-xs font-medium">{formatCurrency(tour.revenue)}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{tour.bookings} bookings</span>
                    <span className="h-1 w-1 rounded-full bg-muted-foreground"></span>
                    <span>{tour.duration}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Component for latest bookings
const LatestBookings = ({ dashboardData, navigate }: { dashboardData: any, navigate: any }) => {
  return (
    <Card className="bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base sm:text-lg">Latest Bookings</CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 px-2 text-xs"
            onClick={() => navigate('/bookings')}
          >
            View all
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {!dashboardData.upcomingBookings || dashboardData.upcomingBookings.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-muted-foreground text-sm">No bookings found</p>
            </div>
          ) : (
            dashboardData.upcomingBookings.map((booking: any) => (
              <div key={booking.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors">
                <div className="flex-shrink-0 w-9 h-9 rounded-md bg-purple-500/10 flex items-center justify-center">
                  <Package className="h-4 w-4 text-purple-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <p className="font-medium text-sm truncate">{booking.tourName}</p>
                    <div className="flex items-center">
                      <span 
                        className={cn(
                          badgeVariants({ variant: "outline" }),
                          "text-[10px] h-5 px-1.5 border-0",
                          getStatusColor(booking.status)
                        )}
                      >
                        {booking.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="truncate">{booking.customerName}</span>
                    <span className="h-1 w-1 rounded-full bg-muted-foreground"></span>
                    <span>{booking.date}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Loading component with skeleton UI
const LoadingSection = () => (
  <div className="animate-pulse space-y-4">
    <div className="h-8 bg-muted rounded-md w-1/3"></div>
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-secondary/30 border-border/30 rounded-lg p-4">
          <div className="h-4 bg-muted/50 rounded-md w-1/2 mb-3"></div>
          <div className="h-8 bg-muted/50 rounded-md w-1/3"></div>
          <div className="h-12 bg-muted/50 rounded-md w-full mt-3"></div>
        </div>
      ))}
    </div>
  </div>
);

export default function Dashboard() {
  const navigate = useNavigate();
  
  // Use React Query to fetch and cache dashboard data
  const { data, isLoading, error, isError } = useQuery({
    queryKey: ['dashboardData'],
    queryFn: getDashboardData,
    staleTime: 5 * 60 * 1000, // 5 minutes before refetching
    refetchOnWindowFocus: false,
  });
  
  // Static user name
  const userName = 'User';
  
  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="space-y-5 pb-6">
        <div>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
            <div>
              <p className="text-muted-foreground text-sm">Welcome back, {userName}</p>
              <h1 className="text-2xl sm:text-3xl font-bold mt-1">Dashboard</h1>
            </div>
            <div className="flex items-center gap-2 mt-1 sm:mt-0 bg-muted/40 px-3 py-1.5 rounded-md sm:bg-transparent sm:px-0 sm:py-0">
              <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{currentDate}</span>
            </div>
          </div>
        </div>
        <LoadingSection />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center px-4">
          <h2 className="text-xl font-semibold mb-2">Error</h2>
          <p className="text-muted-foreground">{(error as Error)?.message || "Failed to load dashboard data. Please try again later."}</p>
          <Button 
            className="mt-4 bg-emerald-500 hover:bg-emerald-600 h-10 px-6"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }
  
  const dashboardData = data || {
    totalLeads: 0,
    leadsGrowth: { growth: 0, current: 0, previous: 0 },
    totalBookings: 0,
    bookingsGrowth: { growth: 0, current: 0, previous: 0 },
    totalRevenue: 0,
    revenueGrowth: { growth: 0, current: 0, previous: 0 },
    conversionRate: 0,
    conversionGrowth: { growth: 0, current: 0, previous: 0 },
    monthlyData: [],
    recentLeads: [],
    topTours: [],
    upcomingBookings: []
  };
  
  return (
    <div className="space-y-5 pb-6">
      <div>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
          <div>
            <p className="text-muted-foreground text-sm">Welcome back, {userName}</p>
            <h1 className="text-2xl sm:text-3xl font-bold mt-1">Dashboard</h1>
          </div>
          <div className="flex items-center gap-2 mt-1 sm:mt-0 bg-muted/40 px-3 py-1.5 rounded-md sm:bg-transparent sm:px-0 sm:py-0">
            <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{currentDate}</span>
          </div>
        </div>
      </div>

      {/* Key Metrics Section */}
      <Suspense fallback={<LoadingSection />}>
        <KeyMetrics dashboardData={dashboardData} />
      </Suspense>

      {/* Charts and Data Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Suspense fallback={<div className="lg:col-span-2 h-[300px] bg-card rounded-lg animate-pulse"></div>}>
          <MonthlyPerformance dashboardData={dashboardData} />
        </Suspense>

        <Suspense fallback={<div className="h-[300px] bg-card rounded-lg animate-pulse"></div>}>
          <LatestLeads dashboardData={dashboardData} navigate={navigate} />
        </Suspense>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Suspense fallback={<div className="h-[250px] bg-card rounded-lg animate-pulse"></div>}>
          <TopTours dashboardData={dashboardData} navigate={navigate} formatCurrency={formatCurrency} />
        </Suspense>

        <Suspense fallback={<div className="h-[250px] bg-card rounded-lg animate-pulse"></div>}>
          <LatestBookings dashboardData={dashboardData} navigate={navigate} />
        </Suspense>
      </div>
    </div>
  );
}

function getInitials(name: string): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
}

function getStatusColor(status: string): string {
  switch (status?.toLowerCase()) {
    case "new":
      return "bg-blue-500/10 text-blue-500";
    case "contacted":
      return "bg-amber-500/10 text-amber-500";
    case "qualified":
      return "bg-green-500/10 text-green-500";
    case "confirmed":
      return "bg-green-500/10 text-green-500";
    case "pending":
      return "bg-amber-500/10 text-amber-500";
    case "cancelled":
      return "bg-red-500/10 text-red-500";
    case "completed":
      return "bg-blue-500/10 text-blue-500";
    default:
      return "bg-gray-500/10 text-gray-500";
  }
}
