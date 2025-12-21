"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { authClient } from '@/lib/auth-client';
import { Zap, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export function AuthPage() {
  const router = useRouter();
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginRememberMe, setLoginRememberMe] = useState(false);
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    const { data, error: authError } = await authClient.signIn.email({
      email: loginEmail,
      password: loginPassword,
      rememberMe: loginRememberMe,
      callbackURL: "/"
    });

    if (authError?.code) {
      setError('Invalid email or password. Please make sure you have already registered an account and try again.');
      setIsLoading(false);
      return;
    }
    
    toast.success('Successfully logged in!');
    setIsLoading(false);
    // Force refresh to update session
    window.location.href = "/";
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate password confirmation
    if (signupPassword !== signupConfirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    // Validate password length
    if (signupPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setIsLoading(true);
    
    const { data, error: authError } = await authClient.signUp.email({
      email: signupEmail,
      name: signupName,
      password: signupPassword,
    });

    if (authError?.code) {
      const errorMap: Record<string, string> = {
        USER_ALREADY_EXISTS: "Email already registered. Please login instead."
      };
      setError(errorMap[authError.code] || "Registration failed. Please try again.");
      setIsLoading(false);
      return;
    }
    
    toast.success("Account created! Please login to continue.");
    setIsLoading(false);
    
    // Switch to login tab and clear form
    setSignupName('');
    setSignupEmail('');
    setSignupPassword('');
    setSignupConfirmPassword('');
    setSignupPhone('');
    
    // Trigger tab switch - need to find tab trigger and click it
    const loginTab = document.querySelector('[value="login"]') as HTMLElement;
    if (loginTab) loginTab.click();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-50 dark:from-gray-900 dark:via-blue-950 dark:to-indigo-950 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 animate-fade-in-up">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white mb-6 shadow-2xl hover-scale animate-pulse-glow p-3">
            <img src="/logo.png" alt="P!VOT Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-3">
            P!VOT
          </h1>
          <p className="text-muted-foreground text-lg">Smart Mobile Data Management</p>
        </div>

        <Card className="premium-card hover-lift animate-fade-in-up shadow-xl" style={{ animationDelay: '0.1s' }}>
          <CardHeader>
            <CardTitle className="text-2xl">Welcome</CardTitle>
            <CardDescription className="text-base">Login or create an account to get started</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-12">
                <TabsTrigger value="login" className="text-base">Login</TabsTrigger>
                <TabsTrigger value="signup" className="text-base">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login" className="animate-fade-in-up">
                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-base font-semibold">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="Enter your email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                      autoComplete="off"
                      className="h-12 text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-base font-semibold">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="Enter your password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      autoComplete="off"
                      className="h-12 text-base"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      id="remember-me"
                      type="checkbox"
                      checked={loginRememberMe}
                      onChange={(e) => setLoginRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 focus:ring-blue-500 text-blue-600"
                    />
                    <Label htmlFor="remember-me" className="text-sm font-medium cursor-pointer">
                      Remember me
                    </Label>
                  </div>
                  {error && (
                    <div className={cn(
                      "flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive animate-shake"
                    )}>
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">{error}</span>
                    </div>
                  )}
                  <Button 
                    type="submit" 
                    className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover-lift" 
                    disabled={isLoading}
                  >
                    {isLoading ? 'Logging in...' : 'Login'}
                  </Button>
                  <p className="text-sm text-center text-muted-foreground">
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        const signupTab = document.querySelector('[value="signup"]') as HTMLElement;
                        if (signupTab) signupTab.click();
                      }}
                      className="text-blue-600 hover:text-blue-700 font-semibold"
                    >
                      Sign up
                    </button>
                  </p>
                </form>
              </TabsContent>
              
              <TabsContent value="signup" className="animate-fade-in-up">
                <form onSubmit={handleSignup} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name" className="text-base font-semibold">Full Name</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Enter your full name"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      required
                      autoComplete="off"
                      className="h-12 text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-base font-semibold">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="Enter your email"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      required
                      autoComplete="off"
                      className="h-12 text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-base font-semibold">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Create a password (min. 8 characters)"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      required
                      autoComplete="off"
                      className="h-12 text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm-password" className="text-base font-semibold">Confirm Password</Label>
                    <Input
                      id="signup-confirm-password"
                      type="password"
                      placeholder="Confirm your password"
                      value={signupConfirmPassword}
                      onChange={(e) => setSignupConfirmPassword(e.target.value)}
                      required
                      autoComplete="off"
                      className="h-12 text-base"
                    />
                  </div>
                  {error && (
                    <div className={cn(
                      "flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive animate-shake"
                    )}>
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">{error}</span>
                    </div>
                  )}
                  <Button 
                    type="submit" 
                    className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover-lift" 
                    disabled={isLoading}
                  >
                    {isLoading ? 'Creating account...' : 'Sign Up'}
                  </Button>
                  <p className="text-sm text-center text-muted-foreground">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        const loginTab = document.querySelector('[value="login"]') as HTMLElement;
                        if (loginTab) loginTab.click();
                      }}
                      className="text-blue-600 hover:text-blue-700 font-semibold"
                    >
                      Login
                    </button>
                  </p>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        
        <div className="mt-8 text-center animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
            <Zap className="w-4 h-4 text-blue-500" />
            Powered by AI • Seamless Data Transfer
          </p>
        </div>
      </div>
    </div>
  );
}