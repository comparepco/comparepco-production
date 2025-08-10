export async function globalAdminSearch(query: string, user: any, canAccess: (module: string) => boolean) {
  // TODO: implement real search across partners, drivers, bookings, etc.
  console.warn('globalAdminSearch stub called. Implement real search logic.');
  return [] as { type: string; results: any[] }[];
} 