import axios from "axios";
import { CreateScanPayload, Scan } from "../types/scans";

// Emulador Android: 10.0.2.2; iOS sim: localhost; dispositivo real: IP de tu PC
export const API_BASE = "http://10.0.2.2:3000";

export async function createScan(payload: CreateScanPayload): Promise<Scan> {
  // nos aseguramos de mandar scannedAt en ISO si no viene
  const body: CreateScanPayload = {
    ...payload,
    scannedAt: payload.scannedAt ?? new Date().toISOString(),
  };
  const { data } = await axios.post<Scan>(`${API_BASE}/scans`, body);
  return data;
}

export async function listScans(page = 1, limit = 25): Promise<Scan[]> {
  const { data } = await axios.get<Scan[]>(`${API_BASE}/scans`, {
    params: { page, limit },
  });
  return data;
}
