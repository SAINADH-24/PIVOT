"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Smartphone, Laptop, Tablet, Wifi, WifiOff, Plus, Trash2, Edit } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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

export function DevicesPage({ onNavigate }: DevicesPageProps) {
  const [devices, setDevices] = useState<Device[]>([
    {
      id: '1',
      name: 'iPhone 14 Pro',
      type: 'phone',
      status: 'active',
      dataUsed: 5.2,
      lastConnected: 'Just now',
      phoneNumber: '+1 234 567 8900',
      udiId: '@sainadh-iphone'
    },
    {
      id: '2',
      name: 'MacBook Pro',
      type: 'laptop',
      status: 'active',
      dataUsed: 8.7,
      lastConnected: '2 hours ago',
      phoneNumber: '+1 234 567 8901',
      udiId: '@sainadh-macbook'
    },
    {
      id: '3',
      name: 'iPad Air',
      type: 'tablet',
      status: 'inactive',
      dataUsed: 2.1,
      lastConnected: '2 days ago',
      phoneNumber: '+1 234 567 8902',
      udiId: '@sainadh-ipad'
    }
  ]);

  const [showAddDevice, setShowAddDevice] = useState(false);
  const [showEditDevice, setShowEditDevice] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [newDeviceName, setNewDeviceName] = useState('');
  const [newDeviceType, setNewDeviceType] = useState<'phone' | 'laptop' | 'tablet'>('phone');
  const [newDevicePhone, setNewDevicePhone] = useState('');
  const [newDeviceUdi, setNewDeviceUdi] = useState('');

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

  const handleAddDevice = () => {
    if (!newDeviceName.trim()) {
      toast.error('Please enter a device name');
      return;
    }
    if (!newDevicePhone.trim()) {
      toast.error('Please enter a phone number');
      return;
    }
    if (!newDeviceUdi.trim()) {
      toast.error('Please enter a UDI identifier');
      return;
    }

    const newDevice: Device = {
      id: Math.random().toString(36).substr(2, 9),
      name: newDeviceName,
      type: newDeviceType,
      status: 'active',
      dataUsed: 0,
      lastConnected: 'Just now',
      phoneNumber: newDevicePhone,
      udiId: newDeviceUdi
    };
    setDevices([...devices, newDevice]);
    setNewDeviceName('');
    setNewDeviceType('phone');
    setNewDevicePhone('');
    setNewDeviceUdi('');
    setShowAddDevice(false);
    toast.success(`${newDeviceName} added successfully!`);
  };

  const handleEditDevice = (device: Device) => {
    setEditingDevice(device);
    setNewDeviceName(device.name);
    setNewDeviceType(device.type);
    setNewDevicePhone(device.phoneNumber);
    setNewDeviceUdi(device.udiId);
    setShowEditDevice(true);
  };

  const handleSaveEdit = () => {
    if (!editingDevice) return;
    
    if (!newDeviceName.trim()) {
      toast.error('Please enter a device name');
      return;
    }
    if (!newDevicePhone.trim()) {
      toast.error('Please enter a phone number');
      return;
    }
    if (!newDeviceUdi.trim()) {
      toast.error('Please enter a UDI identifier');
      return;
    }

    setDevices(devices.map(d => 
      d.id === editingDevice.id 
        ? { ...d, name: newDeviceName, type: newDeviceType, phoneNumber: newDevicePhone, udiId: newDeviceUdi }
        : d
    ));
    
    setShowEditDevice(false);
    setEditingDevice(null);
    setNewDeviceName('');
    setNewDeviceType('phone');
    setNewDevicePhone('');
    setNewDeviceUdi('');
    toast.success('Device updated successfully!');
  };

  const handleRemoveDevice = (id: string, name: string) => {
    setDevices(devices.filter(d => d.id !== id));
    toast.success(`${name} removed`);
  };

  const totalDataUsed = devices.reduce((acc, device) => acc + device.dataUsed, 0);
  const activeDevices = devices.filter(d => d.status === 'active').length;

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
          </div>
        </div>
        <Dialog open={showAddDevice} onOpenChange={setShowAddDevice}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-violet-500 to-fuchsia-600 hover:from-violet-600 hover:to-fuchsia-700 text-white shadow-md hover-lift">
              <Plus className="w-4 h-4 mr-2" />
              Add Device
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
                <Label htmlFor="device-phone" className="text-base font-semibold">Linked Phone Number *</Label>
                <Input
                  id="device-phone"
                  type="tel"
                  placeholder="+1 234 567 8900"
                  value={newDevicePhone}
                  onChange={(e) => setNewDevicePhone(e.target.value)}
                  className="h-12 text-base"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="device-udi" className="text-base font-semibold">UDI Identifier *</Label>
                <Input
                  id="device-udi"
                  placeholder="@username-device or UDI-12345"
                  value={newDeviceUdi}
                  onChange={(e) => setNewDeviceUdi(e.target.value)}
                  className="h-12 text-base"
                />
                <p className="text-xs text-muted-foreground">
                  Use format: @username-device or UDI-XXXXX
                </p>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setShowAddDevice(false)} className="hover-scale">
                Cancel
              </Button>
              <Button onClick={handleAddDevice} className="hover-scale">Add Device</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <Card className="premium-card hover-lift bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium mb-1">Total Devices</p>
                <p className="text-3xl font-bold">{devices.length}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg flex items-center justify-center hover-scale">
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
        <Card className="premium-card hover-lift bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium mb-1">Total Data Used</p>
                <p className="text-3xl font-bold">{totalDataUsed.toFixed(1)} GB</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 shadow-lg flex items-center justify-center hover-scale">
                <Tablet className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Devices Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        {devices.map((device, index) => {
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
              <Label htmlFor="edit-device-phone" className="text-base font-semibold">Linked Phone Number *</Label>
              <Input
                id="edit-device-phone"
                type="tel"
                placeholder="+1 234 567 8900"
                value={newDevicePhone}
                onChange={(e) => setNewDevicePhone(e.target.value)}
                className="h-12 text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-device-udi" className="text-base font-semibold">UDI Identifier *</Label>
              <Input
                id="edit-device-udi"
                placeholder="@username-device or UDI-12345"
                value={newDeviceUdi}
                onChange={(e) => setNewDeviceUdi(e.target.value)}
                className="h-12 text-base"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => {
              setShowEditDevice(false);
              setEditingDevice(null);
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
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            Device Management Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            <li className="flex items-start gap-3 text-sm">
              <div className="w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-900/20 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-violet-600 dark:text-violet-400 font-bold text-xs">1</span>
              </div>
              <span className="text-muted-foreground">Share your data balance seamlessly across all registered devices</span>
            </li>
            <li className="flex items-start gap-3 text-sm">
              <div className="w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-900/20 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-violet-600 dark:text-violet-400 font-bold text-xs">2</span>
              </div>
              <span className="text-muted-foreground">Monitor real-time data consumption per device with UDI tracking</span>
            </li>
            <li className="flex items-start gap-3 text-sm">
              <div className="w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-900/20 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-violet-600 dark:text-violet-400 font-bold text-xs">3</span>
              </div>
              <span className="text-muted-foreground">Use UDI identifiers to send data directly to specific devices</span>
            </li>
            <li className="flex items-start gap-3 text-sm">
              <div className="w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-900/20 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-violet-600 dark:text-violet-400 font-bold text-xs">4</span>
              </div>
              <span className="text-muted-foreground">Each device gets a unique @UDI handle for easy identification</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}