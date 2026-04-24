# WebScanner Integration Guide

## Overview

The new `WebScannerModal` component replaces the existing `BarcodeScannerModal` with a hybrid approach using JavaScript libraries for faster, more reliable barcode scanning. This addresses user feedback about slow scanning performance.

## Key Improvements

### Performance
- **Target**: 1-2 second barcode detection (vs. previous 3-5+ seconds)
- **Success Rates**: 80% QR codes within 1 second, 70% barcodes within 1.5 seconds
- **Frame Throttling**: Optimized for mobile (10fps) and desktop (15fps)

### Hybrid Scanner Architecture
1. **jsQR** - Primary scanner for QR codes (fastest, lightweight)
2. **QuaggaJS** - Secondary scanner for 1D barcodes (EAN-13, Code 128, etc.)
3. **Native BarcodeDetector** - Fallback for API failures
4. **Graceful Degradation** - Automatic fallback between scanners

### Cross-Platform Compatibility
- iOS Safari support
- Android Chrome support  
- Desktop browser support
- Client-side processing only (privacy compliant)

## Integration Steps

### 1. Update Package Dependencies
```bash
npm install @heroicons/react jsqr quagga @types/node
```

### 2. Replace Scanner Component
Replace imports from:
```typescript
import BarcodeScannerModal from './components/scanner/BarcodeScannerModal';
```

To:
```typescript
import WebScannerModal from './components/scanner/WebScannerModal';
```

### 3. Update Component Usage
```typescript
// Old usage
<BarcodeScannerModal
  isOpen={isOpen}
  onClose={handleClose}
  onScan={handleScan}
  useFetchStudent={useFetchStudent}
/>

// New usage
<WebScannerModal
  isOpen={isOpen}
  onClose={handleClose}
  onScanSuccess={handleScanSuccess}
  onError={handleError}
  useFetchStudent={useFetchStudent}
/>
```

### 4. Update Handler Functions
```typescript
// Update scan handler to accept ScannedStudent interface
const handleScanSuccess = (student: ScannedStudent) => {
  // Auto-fill form with student data
  setFieldValue('studentId', student.id);
  setFieldValue('studentName', student.name);
  setFieldValue('studentEmail', student.email);
  setFieldValue('department', student.department);
  onClose();
};

const handleError = (error: string) => {
  toast.error(error);
};
```

## Component Interface

### Props
```typescript
interface WebScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (student: ScannedStudent) => void;
  onError: (error: string) => void;
  useFetchStudent?: (id: string) => { data?: any; isFetching: boolean };
}
```

### ScannedStudent Interface
```typescript
export interface ScannedStudent {
  id:         string;
  name:       string;
  department: string;
  email:      string;
  raw:        string;
}
```

## Supported Barcode Formats

### QR Codes (jsQR)
- Standard QR codes
- JSON payload format
- Pipe-delimited format
- Plain text with email/ID extraction

### 1D Barcodes (QuaggaJS)
- Code 128
- EAN-13
- EAN-8  
- Code 39
- UPC-A
- UPC-E
- Codabar

### Native Fallback
- All formats supported by browser's BarcodeDetector API

## Student ID Parsing

The scanner automatically parses multiple student ID formats:

### JSON Format
```json
{
  "id": "20241521",
  "name": "John Doe", 
  "department": "Computer Science",
  "email": "john.doe@nbsc.edu.ph"
}
```

### Pipe-Delimited Format
```
20241521|John Doe|Computer Science|john.doe@nbsc.edu.ph
```

### Auto-Email Generation
- Extracts numeric ID and generates: `{id}@nbsc.edu.ph`
- Falls back to scanned text if no ID found

## Error Handling

### Common Errors
- **Camera Permission Denied**: User-friendly prompt to enable camera
- **Scanning Timeout**: 2-second timeout with retry option
- **Library Loading Failures**: Automatic fallback to next scanner
- **Invalid Barcode**: Continues scanning for valid codes

### Error Recovery
- Automatic retry on temporary failures
- Manual entry option for persistent issues
- Camera switching between front/back

## Performance Optimization

### Frame Processing
- Mobile: 10fps (100ms intervals)
- Desktop: 15fps (67ms intervals)
- Early termination on successful scan

### Memory Management
- Cleanup on component unmount
- Stream termination on modal close
- Canvas cleanup between scans

### Timeout Strategy
- jsQR: 500ms timeout
- QuaggaJS: 800ms timeout
- Native: 1500ms timeout
- Overall: 2-second maximum

## Testing Checklist

### Cross-Platform Testing
- [ ] iPhone Safari (iOS 15+)
- [ ] Android Chrome (Chrome 90+)
- [ ] Desktop Chrome/Edge/Firefox
- [ ] Tablet browsers

### Functionality Testing
- [ ] QR code scanning
- [ ] 1D barcode scanning
- [ ] Camera switching
- [ ] Error scenarios
- [ ] Student data parsing
- [ ] Masterlist integration

### Performance Testing
- [ ] Scan time under 2 seconds
- [ ] Memory usage monitoring
- [ ] CPU usage during scanning
- [ ] Battery impact assessment

## Migration Notes

### Breaking Changes
- Component renamed from `BarcodeScannerModal` to `WebScannerModal`
- Props interface changed (`onScan` → `onScanSuccess`, `onError` added)
- Icon library changed to `@heroicons/react`

### Backward Compatibility
- Same student data parsing logic
- Same masterlist integration
- Same UI/UX patterns
- Same error handling approach

## Troubleshooting

### Common Issues

**Scanner not starting**
- Check camera permissions
- Verify HTTPS context required for camera access
- Ensure browser supports getUserMedia API

**Slow scanning**
- Verify good lighting conditions
- Check camera focus
- Ensure barcode is not damaged/blurry

**Library loading errors**
- Verify npm packages installed correctly
- Check browser console for JavaScript errors
- Ensure compatible browser versions

**Student data not parsing**
- Verify barcode format matches expected patterns
- Check masterlist API integration
- Review console logs for parsing errors

## Browser Support Matrix

| Browser | Version | QR Codes | 1D Barcodes | Native Fallback | Status |
|---------|---------|----------|------------|----------------|--------|
| Chrome | 90+ | ✅ jsQR | ✅ QuaggaJS | ✅ BarcodeDetector | Full Support |
| Safari | 15+ | ✅ jsQR | ✅ QuaggaJS | ✅ BarcodeDetector | Full Support |
| Firefox | 90+ | ✅ jsQR | ✅ QuaggaJS | ❌ No Native API | Partial Support |
| Edge | 90+ | ✅ jsQR | ✅ QuaggaJS | ✅ BarcodeDetector | Full Support |

## Security & Privacy

### Client-Side Processing
- All barcode processing happens in browser
- No images sent to external APIs
- No data transmitted to third parties

### Data Handling
- Student data parsed locally
- Masterlist lookup via existing API
- Same security model as current system

## Future Enhancements

### Potential Improvements
- Progressive Web App (PWA) scanner
- Advanced image preprocessing
- Machine learning barcode recognition
- Offline scanning capabilities

### Monitoring & Analytics
- Scan success rate tracking
- Performance metrics collection
- Error rate monitoring
- User experience analytics
