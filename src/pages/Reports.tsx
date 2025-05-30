import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, Download } from "lucide-react";
import { getReportData, exportToExcel } from "@/services/reportService";

export default function Reports() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("last6months");
  const [reportData, setReportData] = useState({
    salesData: [],
    leadSourceData: [],
    tourTypeData: [],
    bookingStatusData: {
      confirmed: 0,
      pending: 0,
      cancelled: 0,
      completed: 0,
      total: 0
    },
    popularDestinations: [],
    bookingTrends: []
  });

  useEffect(() => {
    async function loadReportData() {
      setLoading(true);
      try {
        const data = await getReportData(period);
        setReportData(data);
      } catch (error) {
        console.error("Failed to load report data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadReportData();
  }, [period]);

  const handleExport = () => {
    exportToExcel(reportData, period);
  };

  // Calculate total revenue from sales data
  const totalRevenue = reportData.salesData.reduce(
    (sum, item) => sum + item.revenue,
    0
  );

  // Calculate average booking value
  const avgBookingValue = reportData.salesData.reduce(
    (sum, item) => sum + item.revenue,
    0
  ) / reportData.salesData.reduce((sum, item) => sum + item.count, 0) || 0;

  return (
    <div className="space-y-4 px-2 sm:px-4 pb-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Reports</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Analytics and insights to help you understand your business.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Time Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last30days">Last 30 Days</SelectItem>
              <SelectItem value="last3months">Last 3 Months</SelectItem>
              <SelectItem value="last6months">Last 6 Months</SelectItem>
              <SelectItem value="lastYear">Last Year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            onClick={handleExport}
            disabled={loading}
            className="flex items-center gap-2 w-full sm:w-auto"
          >
            <Download className="h-4 w-4" />
            Export Excel
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Tabs defaultValue="sales" className="w-full">
          <TabsList className="w-full max-w-full mb-4 overflow-x-auto flex-nowrap pb-1 h-auto">
            <TabsTrigger value="sales" className="flex-1 min-w-[120px] py-3 text-sm">Sales & Revenue</TabsTrigger>
            <TabsTrigger value="leads" className="flex-1 min-w-[120px] py-3 text-sm">Leads & Conversions</TabsTrigger>
            <TabsTrigger value="bookings" className="flex-1 min-w-[120px] py-3 text-sm">Bookings</TabsTrigger>
            <TabsTrigger value="tours" className="flex-1 min-w-[120px] py-3 text-sm">Tours</TabsTrigger>
          </TabsList>

          <TabsContent value="sales" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <Card className="bg-secondary/50 border-border/30">
                <CardHeader className="pb-2 px-4 pt-4">
                  <CardTitle className="text-xs sm:text-sm text-muted-foreground">
                    Total Revenue
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="text-xl sm:text-3xl font-bold">₹{totalRevenue.toLocaleString()}</div>
                  <p className="text-xs sm:text-sm text-green-500 mt-1">
                    +{Math.round((reportData.salesData.length > 1 ? 
                      ((reportData.salesData[reportData.salesData.length - 1]?.revenue || 0) / 
                      (reportData.salesData[reportData.salesData.length - 2]?.revenue || 1) * 100 - 100) : 0
                    ))}% from previous period
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-secondary/50 border-border/30">
                <CardHeader className="pb-2 px-4 pt-4">
                  <CardTitle className="text-xs sm:text-sm text-muted-foreground">
                    Avg. Booking Value
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="text-xl sm:text-3xl font-bold">₹{Math.round(avgBookingValue).toLocaleString()}</div>
                  <p className="text-xs sm:text-sm text-green-500 mt-1">+5% from previous period</p>
                </CardContent>
              </Card>

              <Card className="bg-secondary/50 border-border/30">
                <CardHeader className="pb-2 px-4 pt-4">
                  <CardTitle className="text-xs sm:text-sm text-muted-foreground">
                    Confirmed Bookings
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="text-xl sm:text-3xl font-bold">{reportData.bookingStatusData.confirmed}</div>
                  <p className="text-xs sm:text-sm text-green-500 mt-1">
                    +{Math.round(reportData.bookingStatusData.confirmed / (reportData.bookingStatusData.total || 1) * 100)}% of total
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-secondary/50 border-border/30">
                <CardHeader className="pb-2 px-4 pt-4">
                  <CardTitle className="text-xs sm:text-sm text-muted-foreground">
                    Cancellation Rate
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="text-xl sm:text-3xl font-bold">
                    {((reportData.bookingStatusData.cancelled / (reportData.bookingStatusData.total || 1)) * 100).toFixed(1)}%
                  </div>
                  <p className="text-xs sm:text-sm text-green-500 mt-1">
                    {reportData.bookingStatusData.cancelled} cancellations total
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-secondary/50 border-border/30">
              <CardHeader className="px-4 pt-4 pb-2">
                <CardTitle className="text-base sm:text-lg">Revenue Over Time</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Monthly revenue for the selected period
                </CardDescription>
              </CardHeader>
              <CardContent className="px-2 sm:px-4 pb-4">
                <div className="h-[250px] sm:h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={reportData.salesData}
                      margin={{
                        top: 20,
                        right: 10,
                        left: 0,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis 
                        dataKey="name" 
                        stroke="#888888" 
                        tick={{ fontSize: 12 }}
                        tickMargin={8}
                      />
                      <YAxis
                        stroke="#888888"
                        tickFormatter={(value) => `₹${value}`}
                        tick={{ fontSize: 12 }}
                        width={50}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1e2234",
                          borderColor: "#2d3748",
                          fontSize: "12px",
                          padding: "8px",
                        }}
                        formatter={(value) => [`₹${value}`, "Revenue"]}
                        wrapperStyle={{ zIndex: 1000 }}
                      />
                      <Bar
                        dataKey="revenue"
                        fill="#3b82f6"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={50}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="leads" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="bg-secondary/50 border-border/30">
                <CardHeader className="px-4 pt-4 pb-2">
                  <CardTitle className="text-base sm:text-lg">Lead Sources</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Breakdown of leads by source
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-2 sm:px-4 pb-4">
                  <div className="h-[250px] sm:h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={reportData.leadSourceData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) =>
                            `${name}: ${(percent * 100).toFixed(0)}%`
                          }
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {reportData.leadSourceData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={["#3b82f6", "#1d4ed8", "#4ade80", "#0ea5e9", "#f59e0b", "#ef4444"][index % 6]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#1e2234",
                            borderColor: "#2d3748",
                            fontSize: "12px",
                            padding: "8px",
                          }}
                          wrapperStyle={{ zIndex: 1000 }}
                        />
                        <Legend 
                          layout="horizontal" 
                          verticalAlign="bottom" 
                          align="center"
                          wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-secondary/50 border-border/30">
                <CardHeader className="px-4 pt-4 pb-2">
                  <CardTitle className="text-base sm:text-lg">Conversion Rate</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Leads to booking conversion rate over time
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-2 sm:px-4 pb-4">
                  <div className="h-[250px] sm:h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={reportData.bookingTrends}
                        margin={{
                          top: 20,
                          right: 10,
                          left: 0,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                        <XAxis 
                          dataKey="name" 
                          stroke="#888888" 
                          tick={{ fontSize: 12 }}
                          tickMargin={8}
                        />
                        <YAxis
                          stroke="#888888"
                          tick={{ fontSize: 12 }}
                          width={30}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#1e2234",
                            borderColor: "#2d3748",
                            fontSize: "12px",
                            padding: "8px",
                          }}
                          wrapperStyle={{ zIndex: 1000 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="bookings"
                          name="Bookings"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          dot={{ r: 3 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="tours" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="bg-secondary/50 border-border/30">
                <CardHeader className="px-4 pt-4 pb-2">
                  <CardTitle className="text-base sm:text-lg">Tour Types</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Breakdown of bookings by tour type
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-2 sm:px-4 pb-4">
                  <div className="h-[250px] sm:h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={reportData.tourTypeData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) =>
                            `${name}: ${(percent * 100).toFixed(0)}%`
                          }
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {reportData.tourTypeData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={["#3b82f6", "#1d4ed8", "#4ade80", "#0ea5e9", "#f59e0b", "#ef4444"][index % 6]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#1e2234",
                            borderColor: "#2d3748",
                            fontSize: "12px",
                            padding: "8px",
                          }}
                          wrapperStyle={{ zIndex: 1000 }}
                        />
                        <Legend 
                          layout="horizontal" 
                          verticalAlign="bottom" 
                          align="center"
                          wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-secondary/50 border-border/30">
                <CardHeader className="px-4 pt-4 pb-2">
                  <CardTitle className="text-base sm:text-lg">Popular Destinations</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Most booked destinations by revenue
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-2 sm:px-4 pb-4">
                  <div className="h-[250px] sm:h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        layout="vertical"
                        data={reportData.popularDestinations}
                        margin={{
                          top: 20,
                          right: 10,
                          left: 60,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                        <XAxis
                          type="number"
                          stroke="#888888"
                          tickFormatter={(value) => `₹${value}`}
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis
                          dataKey="name"
                          type="category"
                          stroke="#888888"
                          width={60}
                          tick={{ fontSize: 12 }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#1e2234",
                            borderColor: "#2d3748",
                            fontSize: "12px",
                            padding: "8px",
                          }}
                          formatter={(value) => [`₹${value}`, "Revenue"]}
                          wrapperStyle={{ zIndex: 1000 }}
                        />
                        <Bar
                          dataKey="value"
                          fill="#3b82f6"
                          radius={[0, 4, 4, 0]}
                          maxBarSize={25}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="bookings" className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <Card className="bg-secondary/50 border-border/30">
                <CardHeader className="pb-2 px-4 pt-4">
                  <CardTitle className="text-xs sm:text-sm text-muted-foreground">
                    Total Bookings
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="text-xl sm:text-3xl font-bold">{reportData.bookingStatusData.total}</div>
                  <p className="text-xs sm:text-sm text-green-500 mt-1">For selected period</p>
                </CardContent>
              </Card>

              <Card className="bg-secondary/50 border-border/30">
                <CardHeader className="pb-2 px-4 pt-4">
                  <CardTitle className="text-xs sm:text-sm text-muted-foreground">
                    Confirmed
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="text-xl sm:text-3xl font-bold">{reportData.bookingStatusData.confirmed}</div>
                  <p className="text-xs sm:text-sm text-green-500 mt-1">
                    {((reportData.bookingStatusData.confirmed / (reportData.bookingStatusData.total || 1)) * 100).toFixed(0)}% of total
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-secondary/50 border-border/30">
                <CardHeader className="pb-2 px-4 pt-4">
                  <CardTitle className="text-xs sm:text-sm text-muted-foreground">
                    Pending
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="text-xl sm:text-3xl font-bold">{reportData.bookingStatusData.pending}</div>
                  <p className="text-xs sm:text-sm text-yellow-500 mt-1">
                    {((reportData.bookingStatusData.pending / (reportData.bookingStatusData.total || 1)) * 100).toFixed(0)}% of total
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-secondary/50 border-border/30">
                <CardHeader className="pb-2 px-4 pt-4">
                  <CardTitle className="text-xs sm:text-sm text-muted-foreground">
                    Cancelled
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="text-xl sm:text-3xl font-bold">{reportData.bookingStatusData.cancelled}</div>
                  <p className="text-xs sm:text-sm text-red-500 mt-1">
                    {((reportData.bookingStatusData.cancelled / (reportData.bookingStatusData.total || 1)) * 100).toFixed(0)}% of total
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-secondary/50 border-border/30">
              <CardHeader className="px-4 pt-4 pb-2">
                <CardTitle className="text-base sm:text-lg">Booking Trends</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Monthly booking trends for the selected period
                </CardDescription>
              </CardHeader>
              <CardContent className="px-2 sm:px-4 pb-4">
                <div className="h-[250px] sm:h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={reportData.bookingTrends}
                      margin={{
                        top: 20,
                        right: 10,
                        left: 0,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis 
                        dataKey="name" 
                        stroke="#888888" 
                        tick={{ fontSize: 12 }}
                        tickMargin={8}
                      />
                      <YAxis 
                        stroke="#888888" 
                        tick={{ fontSize: 12 }}
                        width={30}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1e2234",
                          borderColor: "#2d3748",
                          fontSize: "12px",
                          padding: "8px",
                        }}
                        wrapperStyle={{ zIndex: 1000 }}
                      />
                      <Legend 
                        wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }}
                      />
                      <Line
                        type="monotone"
                        dataKey="bookings"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        activeDot={{ r: 6 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="cancellations"
                        stroke="#ef4444"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
