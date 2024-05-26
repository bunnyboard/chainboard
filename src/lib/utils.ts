export async function sleep(seconds: number) {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}

// standard timestamp UTC
export function getTimestamp(): number {
  return Math.floor(new Date().getTime() / 1000);
}

export function getTodayUTCTimestamp() {
  const today = new Date().toISOString().split('T')[0];
  return Math.floor(new Date(today).getTime() / 1000);
}

export function getDateString(timestamp: number): string {
  return new Date(timestamp * 1000).toISOString().split('T')[0];
}

export function normalizeAddress(address: string | undefined): string {
  return address ? address.toLowerCase() : '';
}

export function compareAddress(address1: string, address2: string): boolean {
  return normalizeAddress(address1) === normalizeAddress(address2);
}
