import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Loader2, LucideMapPin, Building, Users, Calendar, Map } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const success = await login(email, password);
      
      if (success) {
        toast.success('Login successful');
        navigate('/');
      } else {
        toast.error('Invalid email or password');
      }
    } catch (error) {
      toast.error('An error occurred during login');
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left Column - Login Form */}
      <div className="flex flex-col justify-center w-full lg:w-1/2 p-8 md:p-12 lg:p-16">
        <div className="mx-auto w-full max-w-md">
          <div className="flex justify-center mb-8">
            <div className="flex items-center gap-2">
              <div className="bg-emerald-500 rounded-full p-2">
                <LucideMapPin className="h-6 w-6 text-white" />
              </div>
              <span className="text-3xl font-bold">Triptics</span>
            </div>
          </div>
          
          <Card className="border-muted bg-card/50 backdrop-blur">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl">Welcome back</CardTitle>
              <CardDescription>
                Enter your credentials to access your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@triptics.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    disabled={isLoading}
                    className="bg-background/50"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      disabled={isLoading}
                      className="bg-background/50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Right Column - Decorative Content */}
      <div className="hidden lg:flex lg:w-1/2 bg-emerald-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-emerald-800 opacity-90"></div>
        <div className="relative z-10 flex flex-col items-center justify-center w-full h-full p-12 text-white">
          <h2 className="text-4xl font-bold mb-6">Tour Management System</h2>
          <p className="text-lg text-center mb-12 max-w-md">
            Streamline your travel business operations with our comprehensive tour management platform
          </p>
          
          <div className="grid grid-cols-2 gap-8 w-full max-w-lg">
            <div className="flex flex-col items-center text-center">
              <div className="bg-white/20 p-4 rounded-full mb-3">
                <Building className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-medium mb-1">Hotel Management</h3>
              <p className="text-sm text-white/80">Manage hotel bookings and inventory</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="bg-white/20 p-4 rounded-full mb-3">
                <Map className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-medium mb-1">Itinerary Builder</h3>
              <p className="text-sm text-white/80">Create custom travel itineraries</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="bg-white/20 p-4 rounded-full mb-3">
                <Calendar className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-medium mb-1">Booking Calendar</h3>
              <p className="text-sm text-white/80">Schedule and manage bookings</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="bg-white/20 p-4 rounded-full mb-3">
                <Users className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-medium mb-1">Customer Management</h3>
              <p className="text-sm text-white/80">Track customer information</p>
            </div>
          </div>
          
          <div className="absolute bottom-8 text-sm text-white/60">
            © {new Date().getFullYear()} Triptics. All rights reserved.
            {" • "}<a href="https://uniexdesigns.in/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Designed by UniEx Designs</a>
          </div>
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute top-0 left-0 w-40 h-40 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-60 h-60 bg-white/10 rounded-full translate-x-1/3 translate-y-1/3"></div>
      </div>
    </div>
  );
} 