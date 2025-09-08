/**
 * Modern Admin Login Page
 * /admin/login
 */

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Eye, 
  EyeOff, 
  Lock, 
  User, 
  Camera, 
  CheckCircle, 
  AlertCircle, 
  Info,
  Shield,
  Sparkles,
  ArrowRight,
  LogIn
} from 'lucide-react';
import { ColorPaletteProvider } from '@/components/ui/color-palette-provider';

// Toast notification component
function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error' | 'info'; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const icons = {
    success: <CheckCircle className="h-5 w-5 text-green-500" />,
    error: <AlertCircle className="h-5 w-5 text-red-500" />,
    info: <Info className="h-5 w-5 text-blue-500" />
  };

  const colors = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  };

  return (
    <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl border shadow-xl backdrop-blur-sm max-w-sm ${colors[type]} transition-all duration-300`}>
      <div className="flex items-center space-x-3">
        {icons[type]}
        <div className="flex-1">
          <p className="text-sm font-medium">{message}</p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          ×
        </button>
      </div>
    </div>
  );
}

function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();

  // Clear error when user starts typing
  useEffect(() => {
    if (error && (username || password)) {
      setError('');
    }
  }, [username, password, error]);

  // Toast functions
  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
  };

  const clearToast = () => {
    setToast(null);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      setError('Username dan password harus diisi');
      showToast('Username dan password harus diisi', 'error');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('🔐 Attempting login for:', username);
      console.log('🌐 Current origin:', window.location.origin);
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': window.location.origin,
        },
        credentials: 'include',
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
        }),
      });
      
      console.log('📡 Login response status:', response.status);
      console.log('📡 Login response headers:', Object.fromEntries(response.headers.entries()));

      const data = await response.json();
      console.log('📡 Login response data:', data);

      if (response.ok && data.success) {
        setSuccess('Login berhasil! Mengalihkan ke dashboard...');
        showToast('Login berhasil!', 'success');
        
        // Get redirect URL from search params or default to admin
        const redirectUrl = searchParams?.get('redirect') || '/admin';
        
        // Immediate redirect - no delay
        console.log('Login successful, redirecting to:', redirectUrl);
        
        // Force immediate redirect using window.location.replace
        window.location.replace(redirectUrl);
      } else {
        let errorMessage = 'Login gagal. Silakan coba lagi.';
        
        if (response.status === 401) {
          errorMessage = 'Username atau password salah';
        } else if (data?.error) {
          errorMessage = data.error;
        }
        
        setError(errorMessage);
        showToast(errorMessage, 'error');
      }
    } catch (error) {
      console.error('❌ Login fetch error:', error);
      console.error('❌ Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      const errorMessage = 'Terjadi kesalahan jaringan. Silakan coba lagi.';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form validation
  const isFormValid = username.trim() && password.trim();

  return (
    <ColorPaletteProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 opacity-20" style={{backgroundImage: "url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%239C92AC\" fill-opacity=\"0.1\"%3E%3Ccircle cx=\"30\" cy=\"30\" r=\"2\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')"}}></div>
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-pink-600/10"></div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full blur-3xl opacity-20 animate-pulse delay-1000"></div>
        
        {/* Toast Notification */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={clearToast}
          />
        )}

        <div className="w-full max-w-md space-y-8 relative z-10">
          {/* Modern Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-4 shadow-2xl">
                  <Camera className="h-10 w-10 text-white" />
                </div>
                <div className="absolute -top-1 -right-1">
                  <Sparkles className="h-5 w-5 text-yellow-400 animate-pulse" />
                </div>
              </div>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              HafiPortrait
            </h1>
            <p className="text-gray-300 text-lg">Admin Dashboard</p>
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-400">
              <Shield className="h-4 w-4" />
              <span>Secure Login Portal</span>
            </div>
          </div>

          {/* Modern Login Form */}
          <Card className="shadow-2xl border-0 bg-white/10 backdrop-blur-xl border border-white/20">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-2xl font-semibold text-center text-white flex items-center justify-center space-x-2">
                <LogIn className="h-6 w-6" />
                <span>Admin Portal</span>
              </CardTitle>
              <p className="text-center text-gray-300 text-sm">
                Enter your credentials to continue
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Success Message */}
              {success && (
                <Alert className="border-green-400/50 bg-green-500/10 backdrop-blur-sm">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <AlertDescription className="text-green-300">
                    {success}
                  </AlertDescription>
                </Alert>
              )}

              {/* Error Message */}
              {error && (
                <Alert className="border-red-400/50 bg-red-500/10 backdrop-blur-sm">
                  <AlertCircle className="h-4 w-4 text-red-400" />
                  <AlertDescription className="text-red-300">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Username Field */}
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium text-gray-200">
                    Username
                  </Label>
                  <div className="relative group">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-400 transition-colors" />
                    <Input
                      id="username"
                      type="text"
                      placeholder="Enter your username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="pl-12 h-12 bg-white/10 border-white/20 text-white placeholder-gray-400 focus:border-blue-400 focus:ring-blue-400/50 backdrop-blur-sm rounded-xl"
                      required
                      autoComplete="username"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-200">
                    Password
                  </Label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-400 transition-colors" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-12 pr-12 h-12 bg-white/10 border-white/20 text-white placeholder-gray-400 focus:border-blue-400 focus:ring-blue-400/50 backdrop-blur-sm rounded-xl"
                      required
                      autoComplete="current-password"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 hover:text-blue-400 transition-colors"
                      disabled={isLoading}
                    >
                      {showPassword ? <EyeOff /> : <Eye />}
                    </button>
                  </div>
                </div>

                {/* Login Button */}
                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl disabled:opacity-50 disabled:transform-none"
                  disabled={isLoading || !isFormValid}
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Signing in...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span>Sign In</span>
                      <ArrowRight className="h-5 w-5" />
                    </div>
                  )}
                </Button>
              </form>

              {/* Security Notice */}
              <div className="pt-4 border-t border-white/10">
                <p className="text-xs text-gray-400 text-center">
                  🔒 Your session is secured with industry-standard encryption
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center text-sm text-gray-400">
            <p>© 2024 HafiPortrait. All rights reserved.</p>
            <p className="mt-1">Professional Photography Services</p>
          </div>
        </div>
      </div>
    </ColorPaletteProvider>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}