import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface TableStatus {
  table: string;
  success: boolean;
  count: number;
  error?: string;
  duration: number;
}

const TABLES_TO_CHECK = [
  "bookings",
  "customers",
  "tours",
  "itineraries",
  "payments",
  "leads",
  "hotels",
  "transfers"
];

export default function DataDebug() {
  const [results, setResults] = useState<TableStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [authStatus, setAuthStatus] = useState<{
    isAuthenticated: boolean;
    user?: any;
    error?: string;
  }>({
    isAuthenticated: false
  });

  // Check auth status on load
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        setAuthStatus({
          isAuthenticated: false,
          error: error.message
        });
      } else {
        setAuthStatus({
          isAuthenticated: !!data.session,
          user: data.session?.user
        });
      }
    } catch (err: any) {
      setAuthStatus({
        isAuthenticated: false,
        error: err.message || "Failed to check authentication status"
      });
    }
  };

  const testTable = async (table: string): Promise<TableStatus> => {
    const start = performance.now();
    try {
      const { data, error, status } = await supabase
        .from(table)
        .select('id')
        .limit(10);
        
      const end = performance.now();
      
      if (error) {
        return {
          table,
          success: false,
          count: 0,
          error: `${error.message} (Status: ${status})`,
          duration: end - start
        };
      }
      
      return {
        table,
        success: true,
        count: Array.isArray(data) ? data.length : 0,
        duration: end - start
      };
    } catch (err: any) {
      const end = performance.now();
      return {
        table,
        success: false,
        count: 0,
        error: err.message || "Unknown error",
        duration: end - start
      };
    }
  };

  const runTests = async () => {
    setLoading(true);
    setResults([]);
    
    const statusResults: TableStatus[] = [];
    
    for (const table of TABLES_TO_CHECK) {
      const result = await testTable(table);
      statusResults.push(result);
      setResults([...statusResults]); // Update state after each test
    }
    
    setLoading(false);
  };

  const testSpecificJoins = async () => {
    setLoading(true);
    
    try {
      // Test a typical booking query with joins
      const start = performance.now();
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          id,
          start_date,
          end_date,
          status,
          customers (id, name),
          tours (id, name)
        `)
        .limit(3);
      const end = performance.now();
      
      setResults(prev => [
        ...prev,
        {
          table: "bookings with customers and tours join",
          success: !error,
          count: data?.length || 0,
          error: error?.message,
          duration: end - start
        }
      ]);
    } catch (err: any) {
      setResults(prev => [
        ...prev,
        {
          table: "bookings with customers and tours join",
          success: false,
          count: 0,
          error: err.message || "Unknown error",
          duration: 0
        }
      ]);
    }
    
    setLoading(false);
  };

  return (
    <div className="container py-10">
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Data Loading Diagnostics</h1>
          <p className="text-muted-foreground">
            This page tests data loading from Supabase for various tables to diagnose issues
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Authentication Status</CardTitle>
            <CardDescription>
              Checking if the user is authenticated with Supabase
            </CardDescription>
          </CardHeader>
          <CardContent>
            {authStatus.isAuthenticated ? (
              <Alert className="bg-green-50 border-green-200">
                <AlertTitle className="text-green-700">Authenticated</AlertTitle>
                <AlertDescription>
                  User ID: {authStatus.user?.id || 'Unknown'}
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="bg-yellow-50 border-yellow-200">
                <AlertTitle className="text-yellow-700">Not Authenticated</AlertTitle>
                <AlertDescription>
                  {authStatus.error || 'No active session found'}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Table Access Tests</CardTitle>
            <CardDescription>
              Test access to different tables in the database
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.map((result, index) => (
                <div key={index} className="rounded-lg border p-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium">
                      Table: <span className="font-bold">{result.table}</span>
                    </h3>
                    <Badge className={result.success ? "bg-green-500" : "bg-red-500"}>
                      {result.success ? "Success" : "Failed"}
                    </Badge>
                  </div>
                  <Separator className="my-2" />
                  <div className="text-sm">
                    <p>Records: {result.count}</p>
                    <p>Duration: {result.duration.toFixed(2)}ms</p>
                    {result.error && (
                      <p className="text-red-500 mt-2">Error: {result.error}</p>
                    )}
                  </div>
                </div>
              ))}
              
              {results.length === 0 && !loading && (
                <div className="text-center p-6 text-muted-foreground">
                  No tests run yet. Click "Run Tests" to begin.
                </div>
              )}
              
              {loading && (
                <div className="text-center p-6 text-muted-foreground">
                  Running tests...
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button onClick={runTests} disabled={loading}>
              Run Basic Tests
            </Button>
            <Button onClick={testSpecificJoins} disabled={loading} variant="outline">
              Test Complex Joins
            </Button>
            <Button onClick={checkAuthStatus} disabled={loading} variant="ghost">
              Check Auth Status
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>RLS Policies</CardTitle>
            <CardDescription>
              Common reasons for data loading issues in production
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <h3 className="font-medium">Possible causes for data loading issues:</h3>
              <ol className="list-decimal list-inside space-y-2 pl-4">
                <li>Row Level Security (RLS) policies are enabled but not properly configured</li>
                <li>Authentication is required for tables but the user is not authenticated</li>
                <li>CORS configuration in Supabase is not allowing your domain</li>
                <li>Join queries are failing because related tables have different access policies</li>
                <li>API rate limits being exceeded</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 