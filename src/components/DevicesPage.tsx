"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Smartphone, Laptop, Tablet, Wifi, WifiOff, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
}

export function DevicesPage({ onNavigate }: DevicesPageProps) {
  const [devices, setDevices] = useState<Device[]>([
    {
      id: '1',
      name: 'iPhone 14 Pro',
      type: 'phone',
      status: 'active',
      dataUsed: 5.2,
      lastConnected: 'Just now'
    },
    {
      id: '2',
      name: 'MacBook Pro',
      type: 'laptop',
      status: 'active',
      dataUsed: 8.7,
      lastConnected: '2 hours ago'
    },
    {
      id: '3',
      name: 'iPad Air',
      type: 'tablet',
      status: 'inactive',
      dataUsed: 2.1,
      lastConnected: '2 days ago'
    }
  ]);

  const [showAddDevice, setShowAddDevice] = useState(false);
  const [newDeviceName, setNewDeviceName] = useState('');

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
    if (newDeviceName) {
      const newDevice: Device = {
        id: Math.random().toString(36).substr(2, 9),
        name: newDeviceName,
        type: 'phone',
        status: 'active',
        dataUsed: 0,
        lastConnected: 'Just now'
      };
      setDevices([...devices, newDevice]);
      setNewDeviceName('');
      setShowAddDevice(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => onNavigate('dashboard')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">UDI Devices</h1>
            <p className="text-muted-foreground">Unified Device Interface - Manage your connected devices</p>
          </div>
        </div>
        <Dialog open={showAddDevice} onOpenChange={setShowAddDevice}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Device
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Device</DialogTitle>
              <DialogDescription>
                Register a new device to your P!VOT account
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="device-name">Device Name</Label>
                <Input
                  id="device-name"
                  placeholder="e.g., iPhone 15 Pro"
                  value={newDeviceName}
                  onChange={(e) => setNewDeviceName(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDevice(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddDevice}>Add Device</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {devices.map((device) => {
          const Icon = getDeviceIcon(device.type);
          return (
            <Card key={device.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className={`w-12 h-12 rounded-xl ${device.status === 'active' ? 'bg-green-100 dark:bg-green-900/20' : 'bg-gray-100 dark:bg-gray-800'} flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${device.status === 'active' ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`} />
                  </div>
                  <Badge variant={device.status === 'active' ? 'default' : 'secondary'} className={device.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : ''}>
                    {device.status === 'active' ? (
                      <><Wifi className="w-3 h-3 mr-1" /> Active</>
                    ) : (
                      <><WifiOff className="w-3 h-3 mr-1" /> Inactive</>
                    )}
                  </Badge>
                </div>
                <CardTitle className="mt-4">{device.name}</CardTitle>
                <CardDescription>Last connected: {device.lastConnected}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Data Used</span>
                    <span className="font-semibold">{device.dataUsed} GB</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${device.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`}
                      style={{ width: `${Math.min((device.dataUsed / 10) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Device Management Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Share your data balance seamlessly across all registered devices</li>
            <li>• Monitor real-time data consumption per device</li>
            <li>• Set device-specific data limits and alerts</li>
            <li>• Instantly transfer data between devices</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
