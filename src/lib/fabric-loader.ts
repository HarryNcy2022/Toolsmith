type FabricMod = typeof import('fabric');
let cached: FabricMod | null = null;

export async function loadFabric(): Promise<FabricMod> {
  if (cached) return cached;
  cached = await import('fabric');
  return cached;
}
