export type ServiceId =
  | "mtn"
  | "airteltigo"
  | "telecel"
  | "checkers"
  | "booking_codes"
  | "game_coins"
  | "pc_games";

export type ServiceAvailabilityStatus = "in_stock" | "out_of_stock";

export interface ServiceStatusRecord {
  serviceId: ServiceId;
  serviceName: string;
  description: string;
  status: ServiceAvailabilityStatus;
  updatedAt?: any;
  updatedBy?: string;
}

export const ALL_SERVICE_DEFINITIONS: Array<{
  id: ServiceId;
  name: string;
  description: string;
}> = [
  { id: "mtn", name: "MTN Data", description: "MTN data bundles and topups" },
  { id: "airteltigo", name: "AirtelTigo (AT)", description: "AirtelTigo / AT data bundles" },
  { id: "telecel", name: "Telecel", description: "Telecel data bundles and topups" },
  { id: "checkers", name: "Checkers", description: "Results checker pins (WAEC, BECE, NOVDEC)" },
  { id: "booking_codes", name: "Booking Codes", description: "VIP betting booking codes" },
  { id: "game_coins", name: "Game Coins", description: "FC Mobile points and mobile game currency" },
  { id: "pc_games", name: "PC Games", description: "PC games digital downloads and setups" },
];

export function createDefaultServiceStatusMap(): Record<ServiceId, ServiceStatusRecord> {
  const map = {} as Record<ServiceId, ServiceStatusRecord>;
  for (const svc of ALL_SERVICE_DEFINITIONS) {
    map[svc.id] = {
      serviceId: svc.id,
      serviceName: svc.name,
      description: svc.description,
      status: "in_stock",
    };
  }
  return map;
}

export function getServiceDefinition(serviceId: ServiceId) {
  return ALL_SERVICE_DEFINITIONS.find((s) => s.id === serviceId);
}

/**
 * Maps a product / bundle / network / category descriptor to one of the 7 managed ServiceIds.
 * Returns null for unmanaged items (e.g. Airtime, Premium Apps, Playstation Games, Agent Unlock).
 */
export function getServiceIdForProduct(input?: {
  network?: string;
  recipientNetwork?: string;
  category?: string;
  serviceType?: string;
  name?: string;
  dataAmount?: string;
  id?: string;
  bundleId?: string;
} | null): ServiceId | null {
  if (!input) return null;

  const net = String(input.recipientNetwork || input.network || "").trim().toLowerCase();
  const cat = String(input.category || "").trim().toLowerCase();
  const sType = String(input.serviceType || "").trim().toLowerCase();
  const name = String(input.name || input.dataAmount || "").trim().toLowerCase();
  const id = String(input.bundleId || input.id || "").trim().toLowerCase();

  // Exclude unmanaged categories/types explicitly
  if (
    sType === "airtime" ||
    net === "airtime" ||
    cat === "airtime" ||
    net === "system" ||
    net === "premium apps" ||
    cat.includes("premium app") ||
    net === "playstation" ||
    cat.includes("playstation")
  ) {
    return null;
  }

  // 1. Booking Codes
  if (
    sType === "booking_code" ||
    sType === "booking_codes" ||
    net.includes("booking") ||
    cat.includes("booking")
  ) {
    return "booking_codes";
  }

  // 2. Game Coins (FC Mobile Points/Silver, PUBG Mobile UC, eFootball)
  if (
    sType === "efootball" ||
    sType === "game_coins" ||
    net.includes("fc mobile") ||
    net.includes("pubg") ||
    net.includes("game coin") ||
    net.includes("efootball") ||
    cat.includes("fc mobile") ||
    cat.includes("pubg") ||
    cat.includes("game coin") ||
    cat.includes("efootball")
  ) {
    return "game_coins";
  }

  // 3. PC Games (FC 26, Steam/PC titles)
  if (
    sType === "pc_games" ||
    id === "fc_26_pc_game" ||
    net === "pc games" ||
    net.includes("pc game") ||
    cat === "pc games" ||
    cat === "fc 26" ||
    cat.includes("pc game") ||
    name.includes("fc 26")
  ) {
    return "pc_games";
  }

  // 4. Checkers (WAEC, WASSCE, BECE, NOVDEC)
  if (
    sType === "results_checker" ||
    sType === "checkers" ||
    net.includes("checker") ||
    cat.includes("checker") ||
    name.includes("checker") ||
    name.includes("wassce") ||
    name.includes("bece") ||
    name.includes("novdec") ||
    name.includes("waec")
  ) {
    return "checkers";
  }

  // 5. Telecel
  if (net === "telecel" || net === "vodafone" || /\b(telecel|vodafone)\b/.test(net)) {
    return "telecel";
  }

  // 6. AirtelTigo (AT)
  if (
    net === "airteltigo" ||
    net === "at" ||
    net === "at (airteltigo)" ||
    /\b(airteltigo|airtel|tigo|at)\b/.test(net)
  ) {
    return "airteltigo";
  }

  // 7. MTN Data
  if (net === "mtn" || net === "mtn data" || /\bmtn\b/.test(net)) {
    return "mtn";
  }

  return null;
}
