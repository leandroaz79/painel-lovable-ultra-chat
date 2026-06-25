import { invokeEdge } from "@/lib/edge";

type LicensePayload = Record<string, unknown> & {
  duration_days?: number | null;
  lifetime?: boolean;
  license_type?: unknown;
};

function isLicenseTypeError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const normalized = message.toLowerCase();

  return (
    normalized.includes("tipo de licença") ||
    normalized.includes("license type") ||
    (normalized.includes("license") && normalized.includes("type"))
  );
}

function licenseTypeCandidates(days: number) {
  return [String(days)];
}


export async function createLicenseByDuration<T = unknown>(
  edgeFunction: string,
  basePayload: LicensePayload,
  durationDays: number | null,
  lifetime: boolean,
) {
  if (lifetime) {
    return invokeEdge<T>(edgeFunction, {
      ...basePayload,
      license_type: "lifetime",
      duration_days: null,
      lifetime: true,
    });
  }

  let lastTypeError: unknown;

  for (const license_type of licenseTypeCandidates(durationDays!)) {
    try {
      return await invokeEdge<T>(edgeFunction, {
        ...basePayload,
        license_type,
        duration_days: durationDays,
        lifetime: false,
      });
    } catch (error) {
      if (!isLicenseTypeError(error)) throw error;
      lastTypeError = error;
    }
  }

  throw lastTypeError ?? new Error("Tipo de licença inválido.");
}
