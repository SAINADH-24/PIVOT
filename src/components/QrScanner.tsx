"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  Camera, 
  Upload, 
  Flashlight, 
  FlashlightOff, 
  SwitchCamera, 
  X, 
  AlertCircle, 
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface QrScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScanSuccess: (decodedText: string, decodedResult: any) => void;
  title?: string;
  description?: string;
}

interface CameraDevice {
  id: string;
  label: string;
}

export function QrScanner({ 
  open, 
  onOpenChange, 
  onScanSuccess,
  title = "Scan Receiver QR",
  description = "Point your camera at the receiver's QR code or upload an image."
}: QrScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchReady, setTorchReady] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [scannedData, setScannedData] = useState<string>('');
  const [isClosing, setIsClosing] = useState(false);
  
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoTrackRef = useRef<MediaStreamTrack | null>(null);
  const torchToggleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const closeDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize cameras list
  useEffect(() => {
    if (open) {
      getCameras();
    }
  }, [open]);

  const getCameras = async () => {
    try {
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length > 0) {
        const cameraDevices: CameraDevice[] = devices.map(device => ({
          id: device.id,
          label: device.label || `Camera ${device.id}`
        }));
        setCameras(cameraDevices);
        
        // Try to find rear/environment camera
        const rearCameraIndex = cameraDevices.findIndex(cam => 
          cam.label.toLowerCase().includes('back') || 
          cam.label.toLowerCase().includes('rear') ||
          cam.label.toLowerCase().includes('environment')
        );
        
        if (rearCameraIndex !== -1) {
          setCurrentCameraIndex(rearCameraIndex);
        }
      }
    } catch (err) {
      console.error('Error getting cameras:', err);
      setError('Unable to access camera devices');
    }
  };

  // Start camera scanning
  const startScanning = async () => {
    try {
      setError(null);
      setPermissionDenied(false);
      setTorchReady(false);
      
      // Initialize Html5Qrcode if not already done
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode("qr-reader");
      }

      const scanner = html5QrCodeRef.current;
      
      // Check if already scanning
      if (scanner.getState() === Html5QrcodeScannerState.SCANNING) {
        return;
      }

      const cameraId = cameras[currentCameraIndex]?.id || { facingMode: "environment" };

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        videoConstraints: {
          facingMode: "environment"
        }
      };

      await scanner.start(
        cameraId,
        config,
        (decodedText, decodedResult) => {
          handleScanSuccess(decodedText, decodedResult);
        },
        (errorMessage) => {
          // Scanning errors are normal during frame processing
          // Only log critical errors
        }
      );

      setScanning(true);
      
      // Check for torch support after a short delay to ensure video track is ready
      setTimeout(() => {
        checkTorchSupport();
      }, 500);
      
    } catch (err: any) {
      console.error('Error starting camera:', err);
      
      if (err.name === 'NotAllowedError' || err.message?.includes('Permission')) {
        setPermissionDenied(true);
        setError('Camera permission denied. Please allow camera access and try again.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found on this device.');
      } else if (err.message?.includes('insecure')) {
        setError('Camera access requires HTTPS. Please use a secure connection.');
      } else {
        setError('Failed to start camera. Please try uploading an image instead.');
      }
      
      setScanning(false);
    }
  };

  // Check if torch is supported with retry logic
  const checkTorchSupport = async (retryCount = 0) => {
    try {
      const videoElement = document.querySelector('#qr-reader video') as HTMLVideoElement;
      
      if (!videoElement || !videoElement.srcObject) {
        // Retry up to 3 times with delays
        if (retryCount < 3) {
          setTimeout(() => checkTorchSupport(retryCount + 1), 300);
        }
        return;
      }

      const stream = videoElement.srcObject as MediaStream;
      const tracks = stream.getVideoTracks();
      
      if (tracks.length === 0) {
        if (retryCount < 3) {
          setTimeout(() => checkTorchSupport(retryCount + 1), 300);
        }
        return;
      }

      const track = tracks[0];
      videoTrackRef.current = track;
      
      // Check capabilities
      const capabilities = track.getCapabilities() as any;
      
      if (capabilities && capabilities.torch === true) {
        setTorchSupported(true);
        setTorchReady(true);
        console.log('✅ Torch capability detected and ready');
      } else {
        setTorchSupported(false);
        setTorchReady(true);
        console.log('⚠️ Torch not supported on this device');
      }
    } catch (err) {
      console.log('Torch capability check failed:', err);
      setTorchSupported(false);
      setTorchReady(true);
    }
  };

  // Toggle flashlight with debouncing and proper error handling
  const toggleTorch = useCallback(async () => {
    // Prevent rapid toggling
    if (torchToggleTimeoutRef.current) {
      return;
    }

    if (!videoTrackRef.current) {
      toast.error('Camera not ready. Please wait a moment.');
      return;
    }

    if (!torchSupported) {
      toast.error('Flashlight not supported on this device', {
        description: 'Please enable your device torch manually if needed.'
      });
      return;
    }

    const newTorchState = !torchEnabled;

    try {
      // Apply torch constraint
      await videoTrackRef.current.applyConstraints({
        advanced: [{ torch: newTorchState } as any]
      });
      
      setTorchEnabled(newTorchState);
      
      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }

      console.log(`🔦 Torch ${newTorchState ? 'enabled' : 'disabled'}`);
      
    } catch (err: any) {
      console.error('Error toggling torch:', err);
      
      // Provide specific error feedback
      if (err.name === 'NotSupportedError' || err.name === 'OverconstrainedError') {
        toast.error('Flashlight not available on this device');
        setTorchSupported(false);
      } else {
        toast.error('Failed to toggle flashlight', {
          description: 'Your device may not support camera flash control.'
        });
      }
    } finally {
      // Debounce: prevent rapid toggling for 300ms
      torchToggleTimeoutRef.current = setTimeout(() => {
        torchToggleTimeoutRef.current = null;
      }, 300);
    }
  }, [torchEnabled, torchSupported]);

  // Switch camera
  const switchCamera = async () => {
    if (cameras.length <= 1) {
      toast.error('No other cameras available');
      return;
    }

    try {
      // Turn off torch before switching
      if (torchEnabled && videoTrackRef.current) {
        try {
          await videoTrackRef.current.applyConstraints({
            advanced: [{ torch: false } as any]
          });
        } catch (err) {
          console.log('Failed to turn off torch before switch:', err);
        }
      }

      await stopScanning();
      const nextIndex = (currentCameraIndex + 1) % cameras.length;
      setCurrentCameraIndex(nextIndex);
      
      // Wait a bit before starting with new camera
      setTimeout(() => {
        startScanning();
      }, 500);
      
      toast.success(`Switched to ${cameras[nextIndex].label}`);
    } catch (err) {
      console.error('Error switching camera:', err);
      toast.error('Failed to switch camera');
    }
  };

  // Stop scanning and release camera with proper cleanup
  const stopScanning = async () => {
    try {
      // Turn off torch first if enabled
      if (torchEnabled && videoTrackRef.current) {
        try {
          await videoTrackRef.current.applyConstraints({
            advanced: [{ torch: false } as any]
          });
          console.log('🔦 Torch disabled before cleanup');
        } catch (err) {
          console.log('Failed to disable torch during cleanup:', err);
        }
      }

      // Stop the scanner
      if (html5QrCodeRef.current) {
        const state = html5QrCodeRef.current.getState();
        if (state === Html5QrcodeScannerState.SCANNING) {
          await html5QrCodeRef.current.stop();
          console.log('📷 Scanner stopped');
        }
      }
      
      // Release video track
      if (videoTrackRef.current) {
        videoTrackRef.current.stop();
        videoTrackRef.current = null;
        console.log('📷 Video track released');
      }
      
      setScanning(false);
      setTorchEnabled(false);
      setTorchSupported(false);
      setTorchReady(false);
    } catch (err) {
      console.error('Error stopping scanner:', err);
    }
  };

  // Handle successful scan
  const handleScanSuccess = (decodedText: string, decodedResult: any) => {
    setScannedData(decodedText);
    setScanSuccess(true);
    
    // Haptic feedback - triple vibration
    if ('vibrate' in navigator) {
      navigator.vibrate([100, 50, 100]);
    }
    
    // Stop scanning immediately
    stopScanning();
    
    // Show success animation briefly, then callback
    setTimeout(() => {
      onScanSuccess(decodedText, decodedResult);
      handleClose();
    }, 1500);
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size too large. Please use an image under 10MB');
      return;
    }

    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Scan the file
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode("qr-reader");
      }

      const result = await html5QrCodeRef.current.scanFile(file, false);
      handleScanSuccess(result, { file: file.name });
      
    } catch (err) {
      console.error('Error scanning file:', err);
      setUploadedImage(null);
      toast.error('No QR code detected. Try another image or use the camera.');
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle dialog close with debouncing to prevent double-close
  const handleClose = useCallback(() => {
    // Debounce: ignore rapid close clicks within 300ms
    if (isClosing) {
      return;
    }

    setIsClosing(true);

    // Clear any pending timeouts
    if (torchToggleTimeoutRef.current) {
      clearTimeout(torchToggleTimeoutRef.current);
      torchToggleTimeoutRef.current = null;
    }

    // Perform full cleanup
    stopScanning();
    setScanSuccess(false);
    setScannedData('');
    setUploadedImage(null);
    setError(null);
    setPermissionDenied(false);
    onOpenChange(false);

    // Reset closing flag after 300ms
    closeDebounceRef.current = setTimeout(() => {
      setIsClosing(false);
    }, 300);
  }, [isClosing, onOpenChange]);

  // Handle ESC key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        handleClose();
      }
    };

    if (open) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, handleClose]);

  // Auto-start scanning when dialog opens
  useEffect(() => {
    if (open && cameras.length > 0 && !scanning && !permissionDenied) {
      startScanning();
    }
    
    return () => {
      if (!open) {
        stopScanning();
      }
    };
  }, [open, cameras.length]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (closeDebounceRef.current) {
        clearTimeout(closeDebounceRef.current);
      }
      if (torchToggleTimeoutRef.current) {
        clearTimeout(torchToggleTimeoutRef.current);
      }
      stopScanning();
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.clear();
      }
    };
  }, []);

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent 
          className="max-w-lg w-full p-0 gap-0 overflow-hidden animate-scale-in"
          onPointerDownOutside={(e) => e.preventDefault()}
          showCloseButton={false}
        >
          {/* Header with single canonical close button */}
          <DialogHeader className="p-6 pb-4 space-y-2">
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <DialogTitle className="text-2xl font-bold">{title}</DialogTitle>
                <DialogDescription className="text-base">{description}</DialogDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleClose();
                  }
                }}
                className="shrink-0 hover-scale"
                aria-label="Close scan modal"
                disabled={isClosing}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </DialogHeader>

          {/* Scanner Area */}
          <div className="relative bg-black">
            {/* QR Reader Container */}
            <div className="relative aspect-square w-full overflow-hidden">
              <div id="qr-reader" className="w-full h-full"></div>
              
              {/* Scanning Overlay */}
              {scanning && !scanSuccess && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="relative w-64 h-64">
                    {/* Corner borders */}
                    <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-white rounded-tl-2xl"></div>
                    <div className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 border-white rounded-tr-2xl"></div>
                    <div className="absolute bottom-0 left-0 w-16 h-16 border-b-4 border-l-4 border-white rounded-bl-2xl"></div>
                    <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-white rounded-br-2xl"></div>
                    
                    {/* Scanning line */}
                    <div className="absolute inset-x-0 top-1/2 h-1 bg-gradient-to-r from-transparent via-violet-500 to-transparent animate-pulse"></div>
                    
                    {/* Center target */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-white rounded-full animate-ping"></div>
                    </div>
                  </div>
                </div>
              )}

              {/* Success Animation */}
              {scanSuccess && (
                <div className="absolute inset-0 bg-green-500/20 backdrop-blur-sm flex items-center justify-center animate-scale-in">
                  <div className="text-center space-y-4">
                    <div className="w-24 h-24 rounded-full bg-green-500 flex items-center justify-center mx-auto animate-check">
                      <CheckCircle2 className="w-12 h-12 text-white" />
                    </div>
                    <p className="text-white text-lg font-semibold">QR Code Scanned!</p>
                  </div>
                </div>
              )}

              {/* Permission Denied / Error State */}
              {(permissionDenied || error) && !scanning && (
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-orange-500/10 backdrop-blur-sm flex items-center justify-center p-8">
                  <div className="text-center space-y-4 max-w-sm">
                    <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mx-auto">
                      <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-white font-semibold text-lg">Camera Access Required</p>
                      <p className="text-white/80 text-sm">{error || 'Please allow camera access to scan QR codes'}</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button
                        onClick={startScanning}
                        variant="secondary"
                        className="w-full"
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        Retry Camera Access
                      </Button>
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        variant="outline"
                        className="w-full bg-white/10 hover:bg-white/20 text-white border-white/20"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Image Instead
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Uploaded Image Preview */}
              {uploadedImage && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                  <img 
                    src={uploadedImage} 
                    alt="Uploaded QR" 
                    className="max-w-full max-h-full object-contain rounded-lg"
                  />
                </div>
              )}

              {/* Loading State */}
              {!scanning && !error && !permissionDenied && !uploadedImage && (
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 backdrop-blur-sm flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <Loader2 className="w-12 h-12 text-white animate-spin mx-auto" />
                    <p className="text-white font-medium">Initializing camera...</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Controls Toolbar */}
          <div className="bg-gradient-to-r from-violet-600 to-fuchsia-600 p-4">
            <div className="flex items-center justify-between gap-2">
              {/* Upload Button */}
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="secondary"
                size="lg"
                className="flex-1 bg-white hover:bg-white/90 text-violet-600 font-semibold h-12"
                disabled={scanSuccess}
                aria-label="Upload QR code image from device"
              >
                <Upload className="w-5 h-5 mr-2" />
                Upload
              </Button>

              {/* Switch Camera */}
              {cameras.length > 1 && (
                <Button
                  onClick={switchCamera}
                  variant="secondary"
                  size="icon"
                  className="h-12 w-12 bg-white/20 hover:bg-white/30 text-white border-white/20"
                  disabled={!scanning || scanSuccess}
                  aria-label={`Switch camera (current: ${cameras[currentCameraIndex]?.label || 'unknown'})`}
                >
                  <SwitchCamera className="w-5 h-5" />
                </Button>
              )}

              {/* Flashlight Toggle */}
              <Button
                onClick={toggleTorch}
                variant="secondary"
                size="icon"
                className={cn(
                  "h-12 w-12 text-white border-white/20 transition-all",
                  torchEnabled 
                    ? "bg-yellow-500 hover:bg-yellow-600 shadow-lg shadow-yellow-500/50" 
                    : "bg-white/20 hover:bg-white/30"
                )}
                disabled={!scanning || !torchReady || !torchSupported || scanSuccess}
                aria-label={`Toggle flashlight ${torchEnabled ? 'off' : 'on'}`}
                aria-pressed={torchEnabled}
                title={
                  !torchSupported 
                    ? "Flashlight not supported on this device" 
                    : !torchReady 
                    ? "Flashlight initializing..." 
                    : torchEnabled 
                    ? "Turn flashlight off" 
                    : "Turn flashlight on"
                }
              >
                {torchEnabled ? (
                  <Flashlight className="w-5 h-5" />
                ) : (
                  <FlashlightOff className="w-5 h-5" />
                )}
              </Button>

              {/* Close Button */}
              <Button
                onClick={handleClose}
                variant="secondary"
                size="lg"
                className="flex-1 bg-white/20 hover:bg-white/30 text-white border-white/20 font-semibold h-12"
                disabled={isClosing}
                aria-label="Close scanner"
              >
                Close
              </Button>
            </div>
          </div>

          {/* Privacy Notice */}
          <div className="px-6 py-4 bg-muted/30 border-t">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <strong>Privacy:</strong> Camera access is used only to scan QR codes locally. 
                  No images or videos are uploaded or stored.
                </p>
                {!torchSupported && torchReady && scanning && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    💡 Flashlight not supported — please enable your device torch manually if needed.
                  </p>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
        aria-label="Upload QR code image"
      />
    </>
  );
}