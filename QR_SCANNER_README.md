# QR Scanner Implementation Guide

## Overview

The P!VOT app now includes a production-quality QR code scanner with **real-time camera access**, **image upload fallback**, and **flashlight control** for the Send Data feature. The implementation is mobile-first, accessible, and handles all edge cases gracefully.

## Implementation Details

### Library Used
- **html5-qrcode (v2.3.8)**: A lightweight, cross-browser JavaScript QR code scanning library that works with both camera streams and static images.
- Zero external dependencies beyond the library itself
- Pure client-side implementation with no server uploads

### Key Features Implemented

#### 1. **Real-Time Camera Scanner**
- Automatically requests camera permission using `navigator.mediaDevices.getUserMedia()`
- Defaults to **environment (rear) camera** on mobile devices
- Live video preview with **scanning overlay** (animated corner borders and scanning line)
- Automatically scans frames at 10 FPS for QR/barcode detection
- **Stops immediately** upon successful scan with success animation
- **Proper cleanup**: Releases camera resources on modal close

#### 2. **Image Upload Fallback**
- Prominent "Upload" button always visible in the toolbar
- Accepts images from camera roll or file system
- File validation:
  - Only accepts image files (`image/*`)
  - Maximum file size: 10MB
  - Clear error messages for invalid files
- Displays thumbnail preview of uploaded image
- Same QR parsing logic as camera scan

#### 3. **Flashlight/Torch Control**
- Automatic torch capability detection using `MediaStreamTrack.getCapabilities()`
- Toggle button with visual state (yellow when on, gray when off)
- Uses `applyConstraints({ advanced: [{ torch: true }] })` API
- Graceful degradation with helpful message when not supported:
  > "Flashlight not supported — please enable your device torch manually if needed."
- Haptic feedback on toggle (50ms vibration)

#### 4. **Camera Switching**
- Detects all available cameras on device
- Prioritizes rear/environment camera by default
- Switch button available when multiple cameras detected
- Smooth transition between cameras with proper cleanup

#### 5. **Permission & Error Handling**
- **Permission Denied**: Shows retry button and upload fallback option
- **No Camera Found**: Clear error message with upload option
- **Insecure Context**: Warns about HTTPS requirement
- **Generic Errors**: Friendly fallback guidance
- All errors displayed with icon and actionable buttons

#### 6. **QR Code Data Parsing**
Supports multiple QR code formats:

1. **JSON Format**:
   ```json
   {"phone":"+911234567890","udi":"@sainadh-phone","network":"Jio"}
   ```

2. **Key-Value Format**:
   ```
   phone:+911234567890,udi:@john-mobile,network:Jio
   ```

3. **URL Format**:
   ```
   pivotapp://send?phone=+911234567890&udi=@user&network=Jio
   ```

4. **Plain Phone Number**:
   ```
   +911234567890
   ```

5. **UDI Handle**:
   ```
   @user-phone
   ```

#### 7. **Security & Privacy**
- ✅ **No uploads**: All processing happens client-side in the browser
- ✅ **No storage**: Images are processed and immediately discarded
- ✅ **Proper cleanup**: Camera streams are properly stopped and released
- ✅ **Privacy notice**: Clear footer message in the modal
- ✅ **Permission-based**: Requires explicit user consent for camera access

#### 8. **UX & Accessibility**
- **Full-screen on mobile**, centered modal on desktop
- **ESC key** to close on desktop
- Large, tappable buttons (48px height) for mobile
- **ARIA labels** and semantic HTML
- **Haptic feedback**: Vibration on successful scan (pattern: 100ms, 50ms, 100ms)
- **Visual feedback**:
  - Scanning animation with corner borders and sweeping line
  - Green success animation with checkmark
  - Loading spinner during initialization
  - Error states with icons
- **Toast notifications** for all actions

#### 9. **Responsive Design**
- Aspect-square scanning area (1:1 ratio)
- Gradient toolbar with controls
- Mobile-optimized button layout
- Works on all screen sizes
- Proper modal stacking and backdrop

## File Structure

```
src/
├── components/
│   ├── QrScanner.tsx          # Main QR scanner component
│   └── SendDataPage.tsx       # Updated with QR integration
└── package.json               # html5-qrcode dependency
```

## Usage Example

```tsx
import { QrScanner } from '@/components/QrScanner';

function MyComponent() {
  const [showScanner, setShowScanner] = useState(false);

  const handleScanSuccess = (decodedText: string, decodedResult: any) => {
    console.log('QR Data:', decodedText);
    // Parse and use the data
  };

  return (
    <>
      <Button onClick={() => setShowScanner(true)}>
        Scan QR Code
      </Button>
      
      <QrScanner
        open={showScanner}
        onOpenChange={setShowScanner}
        onScanSuccess={handleScanSuccess}
        title="Scan QR Code"
        description="Point your camera at a QR code"
      />
    </>
  );
}
```

## Integration with Send Data

The Send Data page now includes:
1. **QR Code button** next to the phone number input
2. Clicking it opens the comprehensive scanner modal
3. Upon successful scan, automatically fills:
   - **Phone Number** (validates format before filling)
   - **UDI Identifier** (displays as badge if present)
   - **Network Provider** (only if it matches available networks)
4. Clear success toast showing what was filled
5. Validation errors are cleared after successful scan

## Browser Compatibility

### Fully Supported (All Features)
- ✅ Chrome/Edge 90+ (Android/Desktop)
- ✅ Safari 14.5+ (iOS/macOS)
- ✅ Firefox 90+ (Android/Desktop)

### Partial Support (No Torch)
- ⚠️ Safari on iOS: Camera works, torch control via web API is limited
- ⚠️ Some Android devices: Torch capability detection may vary

### Fallback Available
- 📱 All browsers support image upload fallback
- 📱 Works in PWAs and webviews with camera permission

## Known Limitations

1. **iOS Torch Control**: Safari on iOS has limited support for programmatic torch control via web APIs. The app gracefully degrades and shows a helpful message.

2. **Camera Permission**: Must be HTTPS or localhost for `getUserMedia()` to work. Development on `localhost:3000` is secure.

3. **Iframe Context**: The app runs in an iframe, which may restrict some camera features on certain browsers. Upload fallback always works.

4. **PWA Installation**: For best camera performance, consider installing the app as a PWA when available.

5. **Frame Rate**: Set to 10 FPS for balance between performance and scan speed. Can be adjusted in `QrScanner.tsx` config.

## Testing the Scanner

### Test QR Codes
You can test with these example QR code data strings:

1. **Full Data**:
   ```
   phone:+911234567890,udi:@test-user,network:Jio
   ```

2. **Phone Only**:
   ```
   +911234567890
   ```

3. **JSON Format**:
   ```json
   {"phone":"+911234567890","network":"Airtel"}
   ```

### Testing Flow
1. Navigate to **Send Data** page
2. Click the **QR Code button** (next to phone input)
3. **Allow camera permission** when prompted
4. Test camera scanning with a QR code from your phone/another device
5. Test **flashlight toggle** (if supported)
6. Test **camera switch** (if multiple cameras)
7. Test **upload fallback** by clicking Upload and selecting a QR image
8. Verify data auto-fills correctly in the form

## Performance Considerations

- **Lazy Loading**: Camera is only initialized when modal opens
- **Proper Cleanup**: All resources released on close (no memory leaks)
- **Optimized Frame Rate**: 10 FPS balances performance and accuracy
- **Image Validation**: File size and type checks prevent issues
- **Debounced Scanning**: Prevents duplicate scans

## Future Enhancements

Potential improvements for future versions:
- QR code generation for sharing your own details
- Multi-QR scanning (batch operations)
- QR history/favorites
- Custom QR styling and branding
- Offline QR storage
- Deep linking support

---

**Version**: 1.0.0  
**Last Updated**: December 2024  
**Library**: html5-qrcode v2.3.8  
**Compatibility**: Modern browsers (Chrome 90+, Safari 14.5+, Firefox 90+)
