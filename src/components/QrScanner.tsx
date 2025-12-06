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

// Feature detection utilities
const checkCameraSupport = (): { supported: boolean; reason?: string } => {
  console.log('🔍 [QR Scanner] Checking camera support...');
  
  // Check if running in secure context (HTTPS or localhost)
  if (!window.isSecureContext) {
    console.error('❌ [QR Scanner] Not a secure context (HTTPS required)');
    return { 
      supported: false, 
      reason: 'Camera access requires HTTPS. This page must be served over a secure connection.' 
    };
  }
  
  // Check if MediaDevices API is available
  if (!navigator.mediaDevices) {
    console.error('❌ [QR Scanner] MediaDevices API not available');
    return { 
      supported: false, 
      reason: 'Your browser does not support camera access. Please use a modern browser like Chrome, Firefox, or Safari.' 
    };
  }
  
  // Check if getUserMedia is available
  if (!navigator.mediaDevices.getUserMedia) {
    console.error('❌ [QR Scanner] getUserMedia not available');
    return { 
      supported: false, 
      reason: 'Camera API not available in your browser. Please update your browser or try a different one.' 
    };
  }
  
  console.log('✅ [QR Scanner] Camera support verified');
  return { supported: true };
};

// Check permission state if API is available
const checkCameraPermission = async (): Promise<'granted' | 'denied' | 'prompt' | 'unsupported'> => {
  console.log('🔍 [QR Scanner] Checking camera permission state...');
  
  try {
    // Check if Permissions API is available
    if (!navigator.permissions || !navigator.permissions.query) {
      console.warn('⚠️ [QR Scanner] Permissions API not available');
      return 'unsupported';
    }
    
    const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
    console.log(`📋 [QR Scanner] Permission state: ${result.state}`);
    return result.state as 'granted' | 'denied' | 'prompt';
  } catch (err) {
    console.warn('⚠️ [QR Scanner] Could not query permission state:', err);
    return 'unsupported';
  }
};

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
  const [cameraSupported, setCameraSupported] = useState(true);
  const [supportError, setSupportError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [scannedData, setScannedData] = useState<string>('');
  const [isClosing, setIsClosing] = useState(false);
  const [initializingCamera, setInitializingCamera] = useState(false);
  
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoTrackRef = useRef<MediaStreamTrack | null>(null);
  const torchToggleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const closeDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);

  // Feature detection on mount
  useEffect(() => {
    console.log('🚀 [QR Scanner] Component mounted');
    const supportCheck = checkCameraSupport();
    
    if (!supportCheck.supported) {
      setCameraSupported(false);
      setSupportError(supportCheck.reason || 'Camera not supported');
      console.error('❌ [QR Scanner] Camera not supported:', supportCheck.reason);
    } else {
      setCameraSupported(true);
      console.log('✅ [QR Scanner] Camera is supported');
    }
  }, []);

  // Initialize cameras list with better error handling
  useEffect(() => {
    if (open && cameraSupported) {
      console.log('📸 [QR Scanner] Dialog opened, initializing cameras...');
      getCameras();
    }
  }, [open, cameraSupported]);

  const getCameras = async () => {
    console.log('📋 [QR Scanner] Fetching available cameras...');
    
    try {
      // Check permission state first
      const permissionState = await checkCameraPermission();
      console.log(`🔐 [QR Scanner] Permission state: ${permissionState}`);
      
      if (permissionState === 'denied') {
        console.error('❌ [QR Scanner] Camera permission previously denied');
        setPermissionDenied(true);
        setError('Camera access was previously denied. Please enable camera permissions in your browser settings.');
        return;
      }
      
      const devices = await Html5Qrcode.getCameras();
      console.log(`📷 [QR Scanner] Found ${devices?.length || 0} camera(s)`);
      
      if (devices && devices.length > 0) {
        const cameraDevices: CameraDevice[] = devices.map((device, index) => ({
          id: device.id,
          label: device.label || `Camera ${index + 1}`
        }));
        setCameras(cameraDevices);
        
        console.log('📋 [QR Scanner] Available cameras:', cameraDevices.map(c => c.label).join(', '));
        
        // Try to find rear/environment camera
        const rearCameraIndex = cameraDevices.findIndex(cam => 
          cam.label.toLowerCase().includes('back') || 
          cam.label.toLowerCase().includes('rear') ||
          cam.label.toLowerCase().includes('environment')
        );
        
        if (rearCameraIndex !== -1) {
          console.log(`🎯 [QR Scanner] Found rear camera: ${cameraDevices[rearCameraIndex].label}`);
          setCurrentCameraIndex(rearCameraIndex);
        } else {
          console.log(`📱 [QR Scanner] Using first available camera: ${cameraDevices[0].label}`);
        }
      } else {
        console.error('❌ [QR Scanner] No cameras found');
        setError('No camera devices found. Please ensure your device has a camera and try uploading an image instead.');
      }
    } catch (err: any) {
      console.error('❌ [QR Scanner] Error getting cameras:', err);
      console.error('Error details:', {
        name: err.name,
        message: err.message,
        stack: err.stack
      });
      
      if (err.name === 'NotAllowedError') {
        setPermissionDenied(true);
        setError('Camera permission denied. Please allow camera access in your browser.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found. Please use the upload option instead.');
      } else {
        setError(`Unable to access cameras: ${err.message || 'Unknown error'}`);
      }
    }
  };

  // Start camera scanning with comprehensive error handling
  const startScanning = async () => {
    console.log('🎬 [QR Scanner] Starting camera scan...');
    console.log(`Retry attempt: ${retryCountRef.current}`);
    
    try {
      setError(null);
      setPermissionDenied(false);
      setTorchReady(false);
      setInitializingCamera(true);
      
      // Verify camera support again
      const supportCheck = checkCameraSupport();
      if (!supportCheck.supported) {
        throw new Error(supportCheck.reason || 'Camera not supported');
      }
      
      // Initialize Html5Qrcode if not already done
      if (!html5QrCodeRef.current) {
        console.log('🔧 [QR Scanner] Initializing Html5Qrcode instance...');
        html5QrCodeRef.current = new Html5Qrcode("qr-reader");
      }

      const scanner = html5QrCodeRef.current;
      
      // Check if already scanning
      const currentState = scanner.getState();
      console.log(`📊 [QR Scanner] Current scanner state: ${currentState}`);
      
      if (currentState === Html5QrcodeScannerState.SCANNING) {
        console.warn('⚠️ [QR Scanner] Scanner already running');
        setInitializingCamera(false);
        return;
      }

      const cameraId = cameras[currentCameraIndex]?.id || { facingMode: "environment" };
      console.log('🎥 [QR Scanner] Using camera:', cameras[currentCameraIndex]?.label || 'environment facing');

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        videoConstraints: {
          facingMode: "environment"
        }
      };

      console.log('📸 [QR Scanner] Requesting camera access...');
      
      await scanner.start(
        cameraId,
        config,
        (decodedText, decodedResult) => {
          console.log('✅ [QR Scanner] QR code decoded:', decodedText);
          handleScanSuccess(decodedText, decodedResult);
        },
        (errorMessage) => {
          // Scanning errors are normal during frame processing
          // Only log periodically to avoid spam
        }
      );

      console.log('✅ [QR Scanner] Camera started successfully');
      setScanning(true);
      setInitializingCamera(false);
      retryCountRef.current = 0; // Reset retry counter on success
      
      // Check for torch support after a short delay to ensure video track is ready
      setTimeout(() => {
        checkTorchSupport();
      }, 500);
      
    } catch (err: any) {
      console.error('❌ [QR Scanner] Error starting camera:', err);
      console.error('Error details:', {
        name: err.name,
        message: err.message,
        code: err.code,
        constraint: err.constraint
      });
      
      setInitializingCamera(false);
      
      // Detailed error handling with specific messages
      if (err.name === 'NotAllowedError' || err.message?.includes('Permission')) {
        console.error('🚫 [QR Scanner] Permission denied by user');
        setPermissionDenied(true);
        setError('Camera access denied. Please click "Allow" when your browser asks for camera permission, or use the upload option.');
        
        toast.error('Camera Permission Required', {
          description: 'Please allow camera access to scan QR codes'
        });
      } else if (err.name === 'NotFoundError' || err.message?.includes('not found')) {
        console.error('📷 [QR Scanner] No camera found');
        setError('No camera found on this device. Please use the upload option to select an image.');
        
        toast.error('No Camera Found', {
          description: 'Please use the upload option instead'
        });
      } else if (err.name === 'NotReadableError' || err.message?.includes('Could not start video source')) {
        console.error('🔒 [QR Scanner] Camera in use or hardware error');
        setError('Camera is in use by another application or there\'s a hardware error. Please close other apps using the camera and try again.');
        
        toast.error('Camera Unavailable', {
          description: 'Camera may be in use by another app'
        });
      } else if (err.name === 'OverconstrainedError' || err.name === 'ConstraintNotSatisfiedError') {
        console.error('⚙️ [QR Scanner] Camera constraints not satisfied');
        setError('Your camera doesn\'t support the requested settings. Try switching cameras or use the upload option.');
      } else if (err.message?.includes('insecure') || err.message?.includes('https')) {
        console.error('🔒 [QR Scanner] Insecure context');
        setError('Camera access requires HTTPS. Please use a secure connection or upload an image instead.');
      } else if (err.message?.includes('NotSupportedError')) {
        console.error('🚫 [QR Scanner] Not supported');
        setError('Camera access is not supported in your browser. Please try a modern browser or use the upload option.');
      } else {
        console.error('❓ [QR Scanner] Unknown error');
        setError(`Failed to access camera: ${err.message || 'Unknown error'}. Please try uploading an image instead.`);
        
        toast.error('Camera Error', {
          description: 'Please try the upload option'
        });
      }
      
      setScanning(false);
      retryCountRef.current++;
      
      // Auto-suggest upload after 2 failed attempts
      if (retryCountRef.current >= 2) {
        console.log('💡 [QR Scanner] Multiple failures, suggesting upload option');
        toast.info('Having trouble with the camera?', {
          description: 'Try uploading an image instead',
          duration: 5000
        });
      }
    }
  };

  // Check if torch is supported with retry logic
  const checkTorchSupport = async (retryCount = 0) => {
    console.log(`🔦 [QR Scanner] Checking torch support (attempt ${retryCount + 1}/3)...`);
    
    try {
      const videoElement = document.querySelector('#qr-reader video') as HTMLVideoElement;
      
      if (!videoElement || !videoElement.srcObject) {
        console.warn('⚠️ [QR Scanner] Video element not ready');
        // Retry up to 3 times with delays
        if (retryCount < 3) {
          setTimeout(() => checkTorchSupport(retryCount + 1), 300);
        } else {
          console.error('❌ [QR Scanner] Video element never became ready');
        }
        return;
      }

      const stream = videoElement.srcObject as MediaStream;
      const tracks = stream.getVideoTracks();
      
      if (tracks.length === 0) {
        console.warn('⚠️ [QR Scanner] No video tracks found');
        if (retryCount < 3) {
          setTimeout(() => checkTorchSupport(retryCount + 1), 300);
        } else {
          console.error('❌ [QR Scanner] No video tracks available');
        }
        return;
      }

      const track = tracks[0];
      videoTrackRef.current = track;
      console.log('📹 [QR Scanner] Video track acquired:', {
        label: track.label,
        readyState: track.readyState,
        enabled: track.enabled
      });
      
      // Check capabilities
      const capabilities = track.getCapabilities() as any;
      console.log('🔧 [QR Scanner] Track capabilities:', capabilities);
      
      if (capabilities && capabilities.torch === true) {
        setTorchSupported(true);
        setTorchReady(true);
        console.log('✅ [QR Scanner] Torch capability detected and ready');
      } else {
        setTorchSupported(false);
        setTorchReady(true);
        console.log('⚠️ [QR Scanner] Torch not supported on this device');
        console.log('Available capabilities:', Object.keys(capabilities || {}));
      }
    } catch (err) {
      console.error('❌ [QR Scanner] Torch capability check failed:', err);
      setTorchSupported(false);
      setTorchReady(true);
    }
  };

  // Toggle flashlight with debouncing and proper error handling
  const toggleTorch = useCallback(async () => {
    console.log(`🔦 [QR Scanner] Toggle torch requested (current state: ${torchEnabled})`);
    
    // Prevent rapid toggling
    if (torchToggleTimeoutRef.current) {
      console.warn('⚠️ [QR Scanner] Torch toggle debounced (too rapid)');
      return;
    }

    if (!videoTrackRef.current) {
      console.error('❌ [QR Scanner] No video track available');
      toast.error('Camera not ready. Please wait a moment.');
      return;
    }

    if (!torchSupported) {
      console.error('❌ [QR Scanner] Torch not supported');
      toast.error('Flashlight not supported on this device', {
        description: 'Please enable your device torch manually if needed.'
      });
      return;
    }

    const newTorchState = !torchEnabled;
    console.log(`🔦 [QR Scanner] Attempting to set torch to: ${newTorchState}`);

    try {
      // Apply torch constraint
      await videoTrackRef.current.applyConstraints({
        advanced: [{ torch: newTorchState } as any]
      });
      
      setTorchEnabled(newTorchState);
      console.log(`✅ [QR Scanner] Torch ${newTorchState ? 'enabled' : 'disabled'} successfully`);
      
      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
      
    } catch (err: any) {
      console.error('❌ [QR Scanner] Error toggling torch:', err);
      console.error('Error details:', {
        name: err.name,
        message: err.message,
        constraint: err.constraint
      });
      
      // Provide specific error feedback
      if (err.name === 'NotSupportedError' || err.name === 'OverconstrainedError') {
        console.error('🚫 [QR Scanner] Torch constraint not supported');
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
    console.log('🔄 [QR Scanner] Switch camera requested');
    
    if (cameras.length <= 1) {
      console.warn('⚠️ [QR Scanner] No other cameras available');
      toast.error('No other cameras available');
      return;
    }

    try {
      // Turn off torch before switching
      if (torchEnabled && videoTrackRef.current) {
        console.log('🔦 [QR Scanner] Disabling torch before camera switch');
        try {
          await videoTrackRef.current.applyConstraints({
            advanced: [{ torch: false } as any]
          });
        } catch (err) {
          console.warn('⚠️ [QR Scanner] Failed to turn off torch before switch:', err);
        }
      }

      await stopScanning();
      const nextIndex = (currentCameraIndex + 1) % cameras.length;
      setCurrentCameraIndex(nextIndex);
      console.log(`📸 [QR Scanner] Switching to camera: ${cameras[nextIndex].label}`);
      
      // Wait a bit before starting with new camera
      setTimeout(() => {
        startScanning();
      }, 500);
      
      toast.success(`Switched to ${cameras[nextIndex].label}`);
    } catch (err) {
      console.error('❌ [QR Scanner] Error switching camera:', err);
      toast.error('Failed to switch camera');
    }
  };

  // Stop scanning and release camera with proper cleanup
  const stopScanning = async () => {
    console.log('🛑 [QR Scanner] Stopping scanner...');
    
    try {
      // Turn off torch first if enabled
      if (torchEnabled && videoTrackRef.current) {
        try {
          await videoTrackRef.current.applyConstraints({
            advanced: [{ torch: false } as any]
          });
          console.log('🔦 [QR Scanner] Torch disabled before cleanup');
        } catch (err) {
          console.warn('⚠️ [QR Scanner] Failed to disable torch during cleanup:', err);
        }
      }

      // Stop the scanner
      if (html5QrCodeRef.current) {
        const state = html5QrCodeRef.current.getState();
        console.log(`📊 [QR Scanner] Scanner state before stop: ${state}`);
        
        if (state === Html5QrcodeScannerState.SCANNING) {
          await html5QrCodeRef.current.stop();
          console.log('✅ [QR Scanner] Scanner stopped');
        }
      }
      
      // Release video track
      if (videoTrackRef.current) {
        videoTrackRef.current.stop();
        videoTrackRef.current = null;
        console.log('✅ [QR Scanner] Video track released');
      }
      
      setScanning(false);
      setTorchEnabled(false);
      setTorchSupported(false);
      setTorchReady(false);
      setInitializingCamera(false);
      
      console.log('✅ [QR Scanner] Cleanup complete');
    } catch (err) {
      console.error('❌ [QR Scanner] Error stopping scanner:', err);
    }
  };

  // Handle successful scan
  const handleScanSuccess = (decodedText: string, decodedResult: any) => {
    console.log('🎉 [QR Scanner] Scan successful!');
    console.log('Decoded text:', decodedText);
    console.log('Decoded result:', decodedResult);
    
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
    console.log('📤 [QR Scanner] File upload initiated');
    
    const file = event.target.files?.[0];
    if (!file) {
      console.warn('⚠️ [QR Scanner] No file selected');
      return;
    }

    console.log('📁 [QR Scanner] File selected:', {
      name: file.name,
      type: file.type,
      size: file.size
    });

    // Validate file type
    if (!file.type.startsWith('image/')) {
      console.error('❌ [QR Scanner] Invalid file type:', file.type);
      toast.error('Please select a valid image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      console.error('❌ [QR Scanner] File too large:', file.size);
      toast.error('Image size too large. Please use an image under 10MB');
      return;
    }

    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
        console.log('✅ [QR Scanner] Image preview loaded');
      };
      reader.readAsDataURL(file);

      console.log('🔍 [QR Scanner] Scanning uploaded file...');
      
      // Scan the file
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode("qr-reader");
      }

      const result = await html5QrCodeRef.current.scanFile(file, false);
      console.log('✅ [QR Scanner] File scan successful:', result);
      
      handleScanSuccess(result, { file: file.name });
      
    } catch (err: any) {
      console.error('❌ [QR Scanner] Error scanning file:', err);
      console.error('Error details:', {
        name: err.name,
        message: err.message
      });
      
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
    console.log('🚪 [QR Scanner] Close requested');
    
    // Debounce: ignore rapid close clicks within 300ms
    if (isClosing) {
      console.warn('⚠️ [QR Scanner] Close debounced (already closing)');
      return;
    }

    console.log('🧹 [QR Scanner] Performing cleanup...');
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
    retryCountRef.current = 0;
    onOpenChange(false);

    console.log('✅ [QR Scanner] Close complete');

    // Reset closing flag after 300ms
    closeDebounceRef.current = setTimeout(() => {
      setIsClosing(false);
    }, 300);
  }, [isClosing, onOpenChange]);

  // Handle ESC key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        console.log('⌨️ [QR Scanner] ESC key pressed');
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
    if (open && cameras.length > 0 && !scanning && !permissionDenied && cameraSupported) {
      console.log('🎬 [QR Scanner] Auto-starting camera...');
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
      console.log('🔄 [QR Scanner] Component unmounting, final cleanup');
      
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

              {/* Camera Not Supported */}
              {!cameraSupported && (
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-orange-500/10 backdrop-blur-sm flex items-center justify-center p-8">
                  <div className="text-center space-y-4 max-w-sm">
                    <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center mx-auto">
                      <AlertCircle className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-white font-semibold text-lg">Camera Not Supported</p>
                      <p className="text-white/80 text-sm">{supportError}</p>
                    </div>
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      variant="secondary"
                      className="w-full"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Image Instead
                    </Button>
                  </div>
                </div>
              )}

              {/* Permission Denied / Error State */}
              {cameraSupported && (permissionDenied || error) && !scanning && (
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-orange-500/10 backdrop-blur-sm flex items-center justify-center p-8">
                  <div className="text-center space-y-4 max-w-sm">
                    <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mx-auto">
                      <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-white font-semibold text-lg">Camera Access Required</p>
                      <p className="text-white/80 text-sm">{error || 'Unable to access camera devices'}</p>
                      {retryCountRef.current >= 1 && (
                        <p className="text-white/60 text-xs italic">
                          💡 Tip: Check browser settings if camera access keeps failing
                        </p>
                      )}
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
              {cameraSupported && initializingCamera && !error && !permissionDenied && !uploadedImage && (
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 backdrop-blur-sm flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <Loader2 className="w-12 h-12 text-white animate-spin mx-auto" />
                    <p className="text-white font-medium">Initializing camera...</p>
                    <p className="text-white/60 text-sm">Please allow camera access if prompted</p>
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
              {cameras.length > 1 && cameraSupported && (
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
              {cameraSupported && (
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
              )}

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

          {/* Privacy Notice & Status */}
          <div className="px-6 py-4 bg-muted/30 border-t">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <strong>Privacy:</strong> Camera access is used only to scan QR codes locally. 
                  No images or videos are uploaded or stored.
                </p>
                {!cameraSupported && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    ⚠️ Camera not supported: {supportError}
                  </p>
                )}
                {cameraSupported && !torchSupported && torchReady && scanning && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    💡 Flashlight not supported — please enable your device torch manually if needed.
                  </p>
                )}
                {scanning && (
                  <p className="text-xs text-green-600 dark:text-green-400">
                    ✅ Camera active — point at QR code to scan
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