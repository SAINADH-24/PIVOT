"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Smartphone, Laptop, Tablet, Wifi, WifiOff, Plus, Trash2, Edit, Search, X, Lock, RefreshCw } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useCustomer } from 'autumn-js/react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth-client';

interface DevicesPageProps {
  onNavigate: (page: string) => void;
}

interface Device {
  id: string;
  name: string;
  type: 'phone' | 'laptop' | 'tablet';
  status: 'active' | 'inactive';
  dataUsed: number;
  lastConnected: string;
  phoneNumber: string;
  udiId: string;
}

// ========== VALIDATION HELPERS ==========

/**
 * Validates E.164 phone number format
 * E.164: +[country code][subscriber number] (max 15 digits)
 */
function validateE164PhoneNumber(phone: string): { valid: boolean; error?: string } {
  const trimmed = phone.trim();
  
  // Must start with +
  if (!trimmed.startsWith('+')) {
    return { valid: false, error: 'Phone must start with + (E.164 format)' };
  }
  
  // Remove + and check if remaining chars are digits
  const digits = trimmed.slice(1);
  if (!/^\d+$/.test(digits)) {
    return { valid: false, error: 'Phone must contain only digits after +' };
  }
  
  // E.164 allows 1-15 digits after country code
  if (digits.length < 10 || digits.length > 15) {
    return { valid: false, error: 'Phone must be 10-15 digits (E.164 format)' };
  }
  
  return { valid: true };
}

/**
 * Validates UDI identifier format
 * Allowed: alphanumeric, hyphens, underscores, @ symbol
 * Must start with @ or alphanumeric
 */
function validateUdiIdentifier(udi: string): { valid: boolean; error?: string } {
  const trimmed = udi.trim();
  
  if (trimmed.length === 0) {
    return { valid: false, error: 'UDI identifier is required' };
  }
  
  // Must be 3-50 characters
  if (trimmed.length < 3 || trimmed.length > 50) {
    return { valid: false, error: 'UDI must be 3-50 characters' };
  }
  
  // Allowed characters: alphanumeric, @, -, _
  if (!/^[@a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(trimmed)) {
    return { valid: false, error: 'UDI can only contain letters, numbers, @, -, _' };
  }
  
  return { valid: true };
}

export function DevicesPage({ onNavigate }: DevicesPageProps) {
  const { customer, check, isLoading: isCustomerLoading } = useCustomer();
  const { data: session } = useSession();
  const router = useRouter();
  
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ========== SEARCH STATE ==========
  const [searchQuery, setSearchQuery] = useState('');

  const [showAddDevice, setShowAddDevice] = useState(false);
  const [showEditDevice, setShowEditDevice] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [newDeviceName, setNewDeviceName] = useState('');
  const [newDeviceType, setNewDeviceType] = useState<'phone' | 'laptop' | 'tablet'>('phone');
  const [newDevicePhone, setNewDevicePhone] = useState('');
  const [newDeviceUdi, setNewDeviceUdi] = useState('');

  // Validation error states
  const [phoneError, setPhoneError] = useState('');
  const [udiError, setUdiError] = useState('');

  // Format lastConnected time
  const formatLastConnected = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  // Fetch devices from API
  const fetchDevices = useCallback(async (showRefreshToast = false) => {
    if (!session?.user?.id) return;
    
    try {
      if (showRefreshToast) {
        setIsRefreshing(true);
      }
      
      const response = await fetch(`/api/devices?userId=${session.user.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch devices');
      }
      
      const data = await response.json();
      
      const formattedDevices: Device[] = data.map((d: any) => ({
        id: d.id.toString(),
        name: d.name,
        type: d.type as 'phone' | 'laptop' | 'tablet',
        status: d.status as 'active' | 'inactive',
        dataUsed: d.dataUsed || 0,
        lastConnected: formatLastConnected(d.lastConnected),
        phoneNumber: d.phoneNumber,
        udiId: d.udiId,
      }));
      
      setDevices(formattedDevices);
      
      if (showRefreshToast) {
        toast.success('Devices refreshed');
      }
    } catch (error) {
      console.error('Error fetching devices:', error);
      toast.error('Failed to load devices');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [session?.user?.id]);

  // Initial fetch and real-time polling
  useEffect(() => {
    fetchDevices();
    
    // Poll for updates every 10 seconds for real-time feel
    const interval = setInterval(() => {
      fetchDevices();
    }, 10000);
    
    return () => clearInterval(interval);
  }, [fetchDevices]);


  // Get device limit from customer data
  const udiDevicesFeature = customer?.features?.['udi_devices'];
  const deviceLimit = udiDevicesFeature?.included_usage || 3;
  const isUnlimitedDevices = !udiDevicesFeature || udiDevicesFeature.unlimited;

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'phone':
        return Smartphone;
      case 'laptop':
        return Laptop;
      case 'tablet':
        return Tablet;
      default:
        return Smartphone;
    }
  };

  // ========== REAL-TIME SEARCH FILTER ==========
  const filteredDevices = devices.filter(device => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase().trim();
    const phoneMatch = device.phoneNumber.toLowerCase().includes(query);
    const udiMatch = device.udiId.toLowerCase().includes(query);
    
    return phoneMatch || udiMatch;
  });

  const handleAddDevice = async () => {
    if (!session?.user?.id) {
      toast.error('Please log in to add devices');
      return;
    }

    // Validate device name
    if (!newDeviceName.trim()) {
      toast.error('Please enter a device name');
      return;
    }

    // FEATURE GATE: Check device limit
    if (!isUnlimitedDevices && devices.length >= deviceLimit) {
      toast.error(`Device limit reached (${deviceLimit} devices). Upgrade your plan for more devices!`, {
        action: {
          label: 'Upgrade',
          onClick: () => router.push('/pricing')
        },
        duration: 5000
      });
      return;
    }

    // Validate phone number (E.164 format)
    const phoneValidation = validateE164PhoneNumber(newDevicePhone);
    if (!phoneValidation.valid) {
      setPhoneError(phoneValidation.error || 'Invalid phone number');
      toast.error(phoneValidation.error);
      return;
    }

    // Validate UDI identifier
    const udiValidation = validateUdiIdentifier(newDeviceUdi);
    if (!udiValidation.valid) {
      setUdiError(udiValidation.error || 'Invalid UDI identifier');
      toast.error(udiValidation.error);
      return;
    }

    try {
      const response = await fetch('/api/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: session.user.id,
          name: newDeviceName.trim(),
          type: newDeviceType,
          phoneNumber: newDevicePhone.replace(/\s/g, ''),
          udiId: newDeviceUdi.trim(),
          status: 'active',
          dataUsed: 0,
          lastConnected: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add device');
      }

      setNewDeviceName('');
      setNewDeviceType('phone');
      setNewDevicePhone('');
      setNewDeviceUdi('');
      setPhoneError('');
      setUdiError('');
      setShowAddDevice(false);
      toast.success(`${newDeviceName} added successfully!`);
      fetchDevices();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add device');
    }
  };

  const handleEditDevice = (device: Device) => {
    setEditingDevice(device);
    setNewDeviceName(device.name);
    setNewDeviceType(device.type);
    setNewDevicePhone(device.phoneNumber);
    setNewDeviceUdi(device.udiId);
    setPhoneError('');
    setUdiError('');
    setShowEditDevice(true);
  };

  const handleSaveEdit = async () => {
    if (!editingDevice) return;
    
    // Validate device name
    if (!newDeviceName.trim()) {
      toast.error('Please enter a device name');
      return;
    }

    // Validate phone number (E.164 format)
    const phoneValidation = validateE164PhoneNumber(newDevicePhone);
    if (!phoneValidation.valid) {
      setPhoneError(phoneValidation.error || 'Invalid phone number');
      toast.error(phoneValidation.error);
      return;
    }

    // Validate UDI identifier
    const udiValidation = validateUdiIdentifier(newDeviceUdi);
    if (!udiValidation.valid) {
      setUdiError(udiValidation.error || 'Invalid UDI identifier');
      toast.error(udiValidation.error);
      return;
    }

    try {
      const response = await fetch(`/api/devices?id=${editingDevice.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newDeviceName.trim(),
          type: newDeviceType,
          phoneNumber: newDevicePhone.replace(/\s/g, ''),
          udiId: newDeviceUdi.trim(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update device');
      }

      setShowEditDevice(false);
      setEditingDevice(null);
      setNewDeviceName('');
      setNewDeviceType('phone');
      setNewDevicePhone('');
      setNewDeviceUdi('');
      setPhoneError('');
      setUdiError('');
      toast.success('Device updated successfully!');
      fetchDevices();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update device');
    }
  };

  const handleRemoveDevice = async (id: string, name: string) => {
    try {
      const response = await fetch(`/api/devices?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove device');
      }

      toast.success(`${name} removed`);
      fetchDevices();
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove device');
    }
  };

  const totalDataUsed = devices.reduce((acc, device) => acc + device.dataUsed, 0);
  const activeDevices = devices.filter(d => d.status === 'active').length;

  // Show loading state
  if (isCustomerLoading || isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => onNavigate('dashboard')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">UDI Devices</h1>
            <p className="text-muted-foreground">Loading your devices...</p>
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
  
    const canAddDevice = isUnlimitedDevices || devices.length < deviceLimit;
  
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in-up">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => onNavigate('dashboard')}
              className="hover-scale"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">UDI Devices</h1>
              <p className="text-muted-foreground">Unified Device Interface - Manage your connected devices</p>
              {!isUnlimitedDevices && (
                <p className="text-sm text-muted-foreground mt-1">
                  <Badge variant="secondary" className="font-mono text-xs">
                    {devices.length}/{deviceLimit} devices
                  </Badge>
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => fetchDevices(true)}
              disabled={isRefreshing}
              className="hover-scale"
              title="Refresh devices"
            >
              <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
            </Button>
            <Dialog open={showAddDevice} onOpenChange={setShowAddDevice}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-md hover-lift"
                  disabled={!canAddDevice}
                >
                {canAddDevice ? (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Device
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    Limit Reached
                  </>
                )}
              </Button>
            </DialogTrigger>
          <DialogContent className="animate-scale-in">
            <DialogHeader>
              <DialogTitle className="text-2xl">Add New Device</DialogTitle>
              <DialogDescription className="text-base">
                Register a new device to your P!VOT account
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-5 py-4">
              <div className="space-y-2">
                <Label htmlFor="device-name" className="text-base font-semibold">Device Name *</Label>
                <Input
                  id="device-name"
                  placeholder="e.g., iPhone 15 Pro"
                  value={newDeviceName}
                  onChange={(e) => setNewDeviceName(e.target.value)}
                  className="h-12 text-base"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="device-type" className="text-base font-semibold">Device Type *</Label>
                <Select value={newDeviceType} onValueChange={(value: any) => setNewDeviceType(value)}>
                  <SelectTrigger id="device-type" className="h-12 text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="phone" className="text-base">Phone</SelectItem>
                    <SelectItem value="laptop" className="text-base">Laptop</SelectItem>
                    <SelectItem value="tablet" className="text-base">Tablet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="device-phone" className="text-base font-semibold">Linked Phone Number (E.164) *</Label>
                <Input
                  id="device-phone"
                  type="tel"
                  placeholder="+1 234 567 8900"
                  value={newDevicePhone}
                  onChange={(e) => {
                    setNewDevicePhone(e.target.value);
                    setPhoneError('');
                  }}
                  className={cn("h-12 text-base", phoneError && "border-destructive")}
                />
                {phoneError && (
                  <p className="text-xs text-destructive">{phoneError}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Format: +[country code][number] (e.g., +12345678900)
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="device-udi" className="text-base font-semibold">UDI Identifier / @UDI *</Label>
                <Input
                  id="device-udi"
                  placeholder="@username-device or UDI-12345"
                  value={newDeviceUdi}
                  onChange={(e) => {
                    setNewDeviceUdi(e.target.value);
                    setUdiError('');
                  }}
                  className={cn("h-12 text-base", udiError && "border-destructive")}
                />
                {udiError && (
                  <p className="text-xs text-destructive">{udiError}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Allowed: letters, numbers, @, -, _ (3-50 characters)
                </p>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => {
                setShowAddDevice(false);
                setPhoneError('');
                setUdiError('');
              }} className="hover-scale">
                Cancel
              </Button>
              <Button onClick={handleAddDevice} className="hover-scale">Add Device</Button>
            </DialogFooter>
            </DialogContent>
          </Dialog>
          </div>
        </div>

      {/* ========== SEARCH BAR ========== */}
      <Card className="animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by phone number or UDI..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 pl-10 pr-10 text-base"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10"
                onClick={() => setSearchQuery('')}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
          {searchQuery && (
            <p className="text-xs text-muted-foreground mt-2">
              {filteredDevices.length} device{filteredDevices.length !== 1 ? 's' : ''} found
            </p>
          )}
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <Card className="premium-card hover-lift bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium mb-1">Total Devices</p>
                <p className="text-3xl font-bold">{devices.length}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 shadow-lg flex items-center justify-center hover-scale">
                <Smartphone className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="premium-card hover-lift bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium mb-1">Active Devices</p>
                <p className="text-3xl font-bold">{activeDevices}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 shadow-lg flex items-center justify-center hover-scale">
                <Wifi className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="premium-card hover-lift bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium mb-1">Total Data Used</p>
                <p className="text-3xl font-bold">{totalDataUsed.toFixed(1)} GB</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 shadow-lg flex items-center justify-center hover-scale">
                <Tablet className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Devices Grid */}
      {filteredDevices.length === 0 ? (
        <Card className="premium-card animate-fade-in-up">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No device found</h3>
            <p className="text-muted-foreground">
              Try a different search term or clear the search filter
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          {filteredDevices.map((device, index) => {
            const Icon = getDeviceIcon(device.type);
            return (
              <Card 
                key={device.id} 
                className={cn(
                  "premium-card hover-lift stagger-item group",
                  device.status === 'active' 
                    ? "border-green-200 dark:border-green-900" 
                    : ""
                )}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className={cn(
                      "w-14 h-14 rounded-xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110",
                      device.status === 'active' 
                        ? 'bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30' 
                        : 'bg-gray-100 dark:bg-gray-800'
                    )}>
                      <Icon className={cn(
                        "w-7 h-7",
                        device.status === 'active' 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-gray-400'
                      )} />
                    </div>
                    <div className="flex gap-2">
                      <Badge 
                        variant={device.status === 'active' ? 'default' : 'secondary'} 
                        className={cn(
                          "animate-scale-in",
                          device.status === 'active' 
                            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
                            : ''
                        )}
                      >
                        {device.status === 'active' ? (
                          <><Wifi className="w-3 h-3 mr-1" /> Active</>
                        ) : (
                          <><WifiOff className="w-3 h-3 mr-1" /> Inactive</>
                        )}
                      </Badge>
                    </div>
                  </div>
                  <CardTitle className="mt-4 text-xl">{device.name}</CardTitle>
                  <CardDescription>Last connected: {device.lastConnected}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground font-medium">Phone Number</span>
                      <span className="font-semibold">{device.phoneNumber}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground font-medium">UDI</span>
                      <Badge variant="outline" className="font-mono text-xs">
                        {device.udiId}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm pt-2">
                      <span className="text-muted-foreground font-medium">Data Used</span>
                      <span className="font-bold">{device.dataUsed} GB</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                      <div 
                        className={cn(
                          "h-2.5 rounded-full transition-all duration-500",
                          device.status === 'active' 
                            ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                            : 'bg-gray-400'
                        )}
                        style={{ width: `${Math.min((device.dataUsed / 10) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 hover-scale"
                      onClick={() => handleEditDevice(device)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 hover:bg-destructive hover:text-destructive-foreground transition-colors"
                      onClick={() => handleRemoveDevice(device.id, device.name)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remove
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit Device Dialog */}
      <Dialog open={showEditDevice} onOpenChange={setShowEditDevice}>
        <DialogContent className="animate-scale-in">
          <DialogHeader>
            <DialogTitle className="text-2xl">Edit Device</DialogTitle>
            <DialogDescription className="text-base">
              Update device information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-device-name" className="text-base font-semibold">Device Name *</Label>
              <Input
                id="edit-device-name"
                placeholder="e.g., iPhone 15 Pro"
                value={newDeviceName}
                onChange={(e) => setNewDeviceName(e.target.value)}
                className="h-12 text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-device-type" className="text-base font-semibold">Device Type *</Label>
              <Select value={newDeviceType} onValueChange={(value: any) => setNewDeviceType(value)}>
                <SelectTrigger id="edit-device-type" className="h-12 text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="phone" className="text-base">Phone</SelectItem>
                  <SelectItem value="laptop" className="text-base">Laptop</SelectItem>
                  <SelectItem value="tablet" className="text-base">Tablet</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-device-phone" className="text-base font-semibold">Linked Phone Number (E.164) *</Label>
              <Input
                id="edit-device-phone"
                type="tel"
                placeholder="+1 234 567 8900"
                value={newDevicePhone}
                onChange={(e) => {
                  setNewDevicePhone(e.target.value);
                  setPhoneError('');
                }}
                className={cn("h-12 text-base", phoneError && "border-destructive")}
              />
              {phoneError && (
                <p className="text-xs text-destructive">{phoneError}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-device-udi" className="text-base font-semibold">UDI Identifier / @UDI *</Label>
              <Input
                id="edit-device-udi"
                placeholder="@username-device or UDI-12345"
                value={newDeviceUdi}
                onChange={(e) => {
                  setNewDeviceUdi(e.target.value);
                  setUdiError('');
                }}
                className={cn("h-12 text-base", udiError && "border-destructive")}
              />
              {udiError && (
                <p className="text-xs text-destructive">{udiError}</p>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => {
              setShowEditDevice(false);
              setEditingDevice(null);
              setPhoneError('');
              setUdiError('');
            }} className="hover-scale">
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} className="hover-scale">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

        {/* Tips Card */}
        <Card className="premium-card animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-white" />
              </div>
              Device Management Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm">
                <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-blue-600 dark:text-blue-400 font-bold text-xs">1</span>
                </div>
                <span className="text-muted-foreground">Share your data balance seamlessly across all registered devices</span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-blue-600 dark:text-blue-400 font-bold text-xs">2</span>
                </div>
                <span className="text-muted-foreground">Monitor real-time data consumption per device with UDI tracking</span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-blue-600 dark:text-blue-400 font-bold text-xs">3</span>
                </div>
                <span className="text-muted-foreground">Use UDI identifiers to send data directly to specific devices</span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-blue-600 dark:text-blue-400 font-bold text-xs">4</span>
                </div>
                <span className="text-muted-foreground">Each device gets a unique @UDI handle for easy identification</span>
              </li>
            </ul>
          </CardContent>
        </Card>
    </div>
  );
}