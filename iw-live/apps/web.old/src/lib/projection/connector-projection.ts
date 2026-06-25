/**
 * Connector Projection — pure role/industry-driven selector.
 *
 * Given the full Nango connector catalog (read elsewhere through the CF Gateway) plus a
 * resolved role + industry, scores every connector, ranks by relevance, and selects
 * EXACTLY 5 (fewer only if the catalog is smaller), randomizing among equally-relevant
 * ties so the surfaced set varies between sessions.
 *
 * Pure module — no network, no React. Deterministic given an injected RNG.
 * Spec: role-industry-projection (R2, R3, R5).
 */

export interface ConnectorCatalogEntry {
  id: string;
  provider: string;
  label: string;
  category: string;
  /** Roles this connector serves (canonical domain keys). Optional — falls back to manifest. */
  roleRelevance?: string[];
  /** Industry verticals served, or ["*"] for tool-agnostic. Optional — falls back to manifest. */
  industryRelevance?: string[];
  connected?: boolean;
  logoUrl?: string;
}

export interface ProjectedConnector extends ConnectorCatalogEntry {
  relevanceScore: number;
}

export interface ProjectionInput {
  catalog: ConnectorCatalogEntry[];
  role: string;
  industry: string;
  /** Number of slots to fill (default 5). */
  count?: number;
  /** Injectable RNG in [0,1) for deterministic tests (default Math.random). */
  rng?: () => number;
}

/**
 * Fallback relevance manifest keyed by provider, used when a catalog entry does not
 * carry its own roleRelevance/industryRelevance. "*" = tool-agnostic (any industry).
 */
export const CONNECTOR_RELEVANCE: Record<string, { roles: string[]; industries: string[] }> = {
  salesforce: { roles: ["SALES", "CUSTOMER_SUCCESS", "REVOPS"], industries: ["*"] },
  hubspot: { roles: ["SALES", "MARKETING", "CUSTOMER_SUCCESS", "REVOPS"], industries: ["*"] },
  pipedrive: { roles: ["SALES", "REVOPS"], industries: ["*"] },
  zendesk: { roles: ["SERVICE", "CUSTOMER_SUCCESS"], industries: ["*"] },
  intercom: { roles: ["SERVICE", "CUSTOMER_SUCCESS", "MARKETING"], industries: ["*"] },
  jira: { roles: ["PRODUCT_ENGINEERING", "IT_ADMIN"], industries: ["SAAS_TECH"] },
  github: { roles: ["PRODUCT_ENGINEERING"], industries: ["SAAS_TECH"] },
  linear: { roles: ["PRODUCT_ENGINEERING"], industries: ["SAAS_TECH"] },
  asana: { roles: ["PRODUCT_ENGINEERING", "MARKETING", "BIZOPS"], industries: ["*"] },
  slack: {
    roles: ["CUSTOMER_SUCCESS", "SALES", "PRODUCT_ENGINEERING", "BIZOPS"],
    industries: ["*"],
  },
  microsoft: { roles: ["BIZOPS", "IT_ADMIN", "SALES"], industries: ["*"] },
  gmail: { roles: ["SALES", "CUSTOMER_SUCCESS", "BIZOPS"], industries: ["*"] },
  googledrive: { roles: ["BIZOPS", "MARKETING", "PRODUCT_ENGINEERING"], industries: ["*"] },
  notion: { roles: ["PRODUCT_ENGINEERING", "BIZOPS", "MARKETING"], industries: ["*"] },
  stripe: { roles: ["FINANCE", "REVOPS"], industries: ["SAAS_TECH", "FINTECH", "ECOMMERCE"] },
  quickbooks: { roles: ["FINANCE"], industries: ["*"] },
  netsuite: { roles: ["FINANCE", "PROCUREMENT"], industries: ["*"] },
  shopify: { roles: ["SALES", "MARKETING", "FINANCE"], industries: ["ECOMMERCE"] },
  zapier: { roles: ["BIZOPS", "IT_ADMIN"], industries: ["*"] },
  airtable: { roles: ["BIZOPS", "MARKETING", "PRODUCT_ENGINEERING"], industries: ["*"] },
  twilio: { roles: ["PRODUCT_ENGINEERING", "MARKETING", "SERVICE"], industries: ["*"] },
  dropbox: { roles: ["BIZOPS", "MARKETING"], industries: ["*"] },
};

const up = (s: string) =>
  s
    .trim()
    .toUpperCase()
    .replace(/[\s/-]+/g, "_");

function relevanceFor(entry: ConnectorCatalogEntry): { roles: string[]; industries: string[] } {
  const fallback = CONNECTOR_RELEVANCE[entry.provider?.toLowerCase()] || {
    roles: [],
    industries: [],
  };
  return {
    roles: (entry.roleRelevance ?? fallback.roles).map(up),
    industries: (entry.industryRelevance ?? fallback.industries).map(up),
  };
}

/**
 * Relevance score: role match (+2) dominates industry match (+1).
 * "*" industry relevance always matches.
 */
export function scoreConnector(
  entry: ConnectorCatalogEntry,
  role: string,
  industry: string
): number {
  const { roles, industries } = relevanceFor(entry);
  let score = 0;
  if (role && roles.includes(up(role))) score += 2;
  if (industry && (industries.includes(up(industry)) || industries.includes("*"))) score += 1;
  return score;
}

/** Fisher–Yates shuffle using an injected RNG (deterministic when rng is seeded). */
function shuffle<T>(items: T[], rng: () => number): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Select the projected connectors:
 *  - score + rank descending
 *  - fill `count` slots tier-by-tier; randomize within a tie tier
 *  - return all when catalog < count
 *  - exclude zero-score (non-matching) connectors when >= count matches exist
 *  - never duplicate by provider
 */
export function selectConnectors(input: ProjectionInput): ProjectedConnector[] {
  const { catalog, role, industry, count = 5, rng = Math.random } = input;

  // De-dupe catalog by provider first (defensive — R3.5).
  const seenProviders = new Set<string>();
  const unique = catalog.filter((c) => {
    const key = (c.provider || c.id || "").toLowerCase();
    if (!key || seenProviders.has(key)) return false;
    seenProviders.add(key);
    return true;
  });

  const scored: ProjectedConnector[] = unique.map((c) => ({
    ...c,
    relevanceScore: scoreConnector(c, role, industry),
  }));

  const matchCount = scored.filter((c) => c.relevanceScore > 0).length;
  const excludeNonMatches = matchCount >= count;

  // Group into tiers by score, highest first.
  const tiers = new Map<number, ProjectedConnector[]>();
  for (const c of scored) {
    if (!tiers.has(c.relevanceScore)) tiers.set(c.relevanceScore, []);
    tiers.get(c.relevanceScore)!.push(c);
  }
  const scoresDesc = [...tiers.keys()].sort((a, b) => b - a);

  const result: ProjectedConnector[] = [];
  for (const score of scoresDesc) {
    if (result.length >= count) break;
    if (excludeNonMatches && score === 0) break; // R3.6
    const tier = shuffle(tiers.get(score)!, rng); // R3.4 randomized tie-break
    for (const c of tier) {
      if (result.length >= count) break;
      result.push(c);
    }
  }

  return result.slice(0, count);
}
