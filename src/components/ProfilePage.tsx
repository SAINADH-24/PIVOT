"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSession, authClient } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { ArrowLeft, User, Mail, Phone, LogOut, Bell, Shield, Moon, Sun, AlertCircle, Lock } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ProfilePageProps {
  onNavigate: (page: string) => void;
}

export function ProfilePage({ onNavigate }: ProfilePageProps) {
  const { data: session, isPending, refetch } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  
  // Change Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordErrors, setPasswordErrors] = useState<{ current?: string; new?: string; confirm?: string }>({});
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // 2FA State
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorMethod, setTwoFactorMethod] = useState<'sms' | 'email'>('sms');

  const handleLogout = async () => {
    const { error } = await authClient.signOut();
    if (error?.code) {
      toast.error(error.code);
    } else {
      localStorage.removeItem("bearer_token");
      refetch();
      router.push("/");
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  const validatePasswordForm = (): boolean => {
    const errors: { current?: string; new?: string; confirm?: string } = {};
    
    if (!currentPassword) {
      errors.current = 'Current password is required';
    }
    
    if (!newPassword) {
      errors.new = 'New password is required';
    } else if (newPassword.length < 6) {
      errors.new = 'Password must be at least 6 characters';
    }
    
    if (!confirmPassword) {
      errors.confirm = 'Please confirm your new password';
    } else if (newPassword !== confirmPassword) {
      errors.confirm = 'Passwords do not match';
    }
    
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChangePassword = async () => {
    if (!validatePasswordForm()) {
      toast.error('Please fix all errors before submitting');
      return;
    }

    setIsChangingPassword(true);

    // Simulate API call delay (in production, this would be a real API call)
    await new Promise(resolve => setTimeout(resolve, 800));

    // Mock success (in production, verify with backend)
    toast.success('Password updated successfully!');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordErrors({});

    setIsChangingPassword(false);
  };

  const handleToggle2FA = (enabled: boolean) => {
    setTwoFactorEnabled(enabled);
    
    if (enabled) {
      toast.success(`Two-Factor Authentication enabled via ${twoFactorMethod.toUpperCase()}`);
    } else {
      toast.success('Two-Factor Authentication disabled');
    }
  };

  const handle2FAMethodChange = (method: 'sms' | 'email') => {
    setTwoFactorMethod(method);
    toast.success(`2FA method changed to ${method.toUpperCase()}`);
  };

  // Show loading state
  if (isPending) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => onNavigate('dashboard')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Profile Settings</h1>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
        <Card className="premium-card">
          <CardContent className="p-12 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const user = session?.user;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-4 animate-fade-in-up">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => onNavigate('dashboard')}
          className="hover-scale"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Profile Settings</h1>
          <p className="text-muted-foreground">Manage your account and preferences</p>
        </div>
      </div>

      {/* Profile Header */}
      <Card className="premium-card hover-lift animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <CardContent className="p-6">
          <div className="flex items-center gap-6">
            <Avatar className="w-20 h-20">
              <AvatarFallback className="text-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-1">{user?.name}</h2>
              <p className="text-muted-foreground">{user?.email}</p>
            </div>
            <Button variant="outline" className="hover-scale">Edit Profile</Button>
          </div>
        </CardContent>
      </Card>

      {/* Account Information */}
      <Card className="premium-card hover-lift animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Your personal details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <Input id="name" defaultValue={user?.name} className="h-12" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <Input id="email" type="email" defaultValue={user?.email} className="h-12" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <Input id="phone" type="tel" defaultValue={user?.phoneNumber} className="h-12" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="userId">User ID</Label>
              <Input id="userId" defaultValue={user?.id} disabled className="h-12" />
            </div>
          </div>
          <Button className="hover-scale">Save Changes</Button>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card className="premium-card hover-lift animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>Customize your experience</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Push Notifications</p>
                <p className="text-sm text-muted-foreground">Receive alerts about your account</p>
              </div>
            </div>
            <Switch checked={notifications} onCheckedChange={setNotifications} />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {darkMode ? (
                <Moon className="w-5 h-5 text-muted-foreground" />
              ) : (
                <Sun className="w-5 h-5 text-muted-foreground" />
              )}
              <div>
                <p className="font-medium">Dark Mode</p>
                <p className="text-sm text-muted-foreground">Toggle dark theme</p>
              </div>
            </div>
            <Switch checked={darkMode} onCheckedChange={toggleDarkMode} />
          </div>
        </CardContent>
      </Card>

      {/* Security - Change Password */}
      <Card className="premium-card hover-lift animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your account password</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="current-password" className="text-base font-semibold">Current Password *</Label>
            <Input
              id="current-password"
              type="password"
              placeholder="Enter current password"
              value={currentPassword}
              onChange={(e) => {
                setCurrentPassword(e.target.value);
                setPasswordErrors(prev => ({ ...prev, current: undefined }));
              }}
              className={cn(
                "h-12 text-base",
                passwordErrors.current && "border-destructive focus-visible:ring-destructive animate-shake"
              )}
            />
            {passwordErrors.current && (
              <div className="flex items-center gap-2 text-sm text-destructive animate-fade-in-up">
                <AlertCircle className="w-4 h-4" />
                <span>{passwordErrors.current}</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-password" className="text-base font-semibold">New Password *</Label>
            <Input
              id="new-password"
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setPasswordErrors(prev => ({ ...prev, new: undefined }));
              }}
              className={cn(
                "h-12 text-base",
                passwordErrors.new && "border-destructive focus-visible:ring-destructive animate-shake"
              )}
            />
            {passwordErrors.new && (
              <div className="flex items-center gap-2 text-sm text-destructive animate-fade-in-up">
                <AlertCircle className="w-4 h-4" />
                <span>{passwordErrors.new}</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password" className="text-base font-semibold">Confirm New Password *</Label>
            <Input
              id="confirm-password"
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setPasswordErrors(prev => ({ ...prev, confirm: undefined }));
              }}
              className={cn(
                "h-12 text-base",
                passwordErrors.confirm && "border-destructive focus-visible:ring-destructive animate-shake"
              )}
            />
            {passwordErrors.confirm && (
              <div className="flex items-center gap-2 text-sm text-destructive animate-fade-in-up">
                <AlertCircle className="w-4 h-4" />
                <span>{passwordErrors.confirm}</span>
              </div>
            )}
          </div>

          <Button 
            onClick={handleChangePassword}
            disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
            className="w-full hover-lift"
          >
            {isChangingPassword ? 'Updating...' : 'Change Password'}
          </Button>
        </CardContent>
      </Card>

      {/* Security - Two-Factor Authentication */}
      <Card className="premium-card hover-lift animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle>Two-Factor Authentication (2FA)</CardTitle>
              <CardDescription>Add an extra layer of security to your account</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-100 dark:border-blue-900">
            <div>
              <p className="font-semibold text-base mb-1">Enable Two-Factor Authentication</p>
              <p className="text-sm text-muted-foreground">
                {twoFactorEnabled ? 'Your account is protected with 2FA' : 'Protect your account with an extra security layer'}
              </p>
            </div>
            <Switch 
              checked={twoFactorEnabled} 
              onCheckedChange={handleToggle2FA}
              className="data-[state=checked]:bg-blue-600"
            />
          </div>

          {twoFactorEnabled && (
            <div className="space-y-4 animate-fade-in-up">
              <Separator />
              <div className="space-y-3">
                <Label className="text-base font-semibold">Choose 2FA Method</Label>
                <RadioGroup value={twoFactorMethod} onValueChange={(value: 'sms' | 'email') => handle2FAMethodChange(value)}>
                  <div className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer">
                    <RadioGroupItem value="sms" id="sms" />
                    <Label htmlFor="sms" className="flex-1 cursor-pointer">
                      <div className="font-medium">SMS / Text Message</div>
                      <p className="text-sm text-muted-foreground">Receive verification codes via SMS to {user?.phoneNumber}</p>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer">
                    <RadioGroupItem value="email" id="email" />
                    <Label htmlFor="email" className="flex-1 cursor-pointer">
                      <div className="font-medium">Email</div>
                      <p className="text-sm text-muted-foreground">Receive verification codes via email to {user?.email}</p>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

                <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900">
                  <p className="text-sm text-blue-900 dark:text-blue-300">
                    <strong>Note:</strong> When 2FA is enabled, you'll need to enter a verification code sent to your {twoFactorMethod === 'sms' ? 'phone' : 'email'} each time you log in or perform sensitive operations like data transfers.
                  </p>
                </div>

            </div>
          )}
        </CardContent>
      </Card>

      {/* Logout */}
      <Card className="premium-card animate-fade-in-up" style={{ animationDelay: '0.35s' }}>
        <CardContent className="p-6">
          <Button 
            variant="destructive" 
            className="w-full hover-lift" 
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}