export interface QRCodeData {
  tableId: string;
  outletId: string;
  outletName?: string;
  tableNumber?: string;
  // Add any other fields that might be in your QR code
}

export interface ScanResult {
  success: boolean;
  data?: QRCodeData;
  error?: string;
}
