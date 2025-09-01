export type Scan = {
  id?: string;                  
  _id?: string;                 
  userId?: string;
  qrCode: string;
  scannedAt: string;
  metadata?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateScanPayload = {
  userId?: string;
  qrCode: string;
  scannedAt?: string;           
  metadata?: Record<string, any>;
};
