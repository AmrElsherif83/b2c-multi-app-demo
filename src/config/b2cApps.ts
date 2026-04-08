// =============================================================================
// B2C App Registry
// =============================================================================
// Add or remove apps by editing the B2C_APPS array below.
// For each app, set the corresponding VITE_APPn_* environment variables.
// =============================================================================

export type Environment = 'dev' | 'stage' | 'prod';

export interface B2CEnvConfig {
  tenantDomain: string; // e.g. "ecab2cdev.onmicrosoft.com"
  clientId: string;     // Azure App Registration client ID
  policy: string;       // B2C policy name, e.g. "B2C_1A_SUSI"
  scopes: string[];     // OIDC scopes
}

export interface B2CAppConfig {
  id: string;           // unique slug — used in storage keys
  name: string;         // display name
  description: string;
  icon: string;         // emoji
  gradient: string;     // Tailwind gradient classes for card header
  environments: Partial<Record<Environment, B2CEnvConfig>>;
}

// Vite exposes all VITE_* vars at build time via import.meta.env
const e = import.meta.env as Record<string, string | undefined>;

function parseScopes(raw: string | undefined): string[] {
  return (raw ?? 'openid profile offline_access').split(/\s+/).filter(Boolean);
}

/**
 * Build a B2CEnvConfig from VITE_{prefix}_{ENV}_* variables.
 * Returns the config even if empty — callers check `isConfigured()`.
 */
function envConfig(prefix: string, env: string): B2CEnvConfig {
  return {
    tenantDomain: e[`${prefix}_${env}_TENANT_DOMAIN`] ?? '',
    clientId:     e[`${prefix}_${env}_CLIENT_ID`]     ?? '',
    policy:       e[`${prefix}_${env}_POLICY`]         ?? '',
    scopes:       parseScopes(e[`${prefix}_${env}_SCOPE`]),
  };
}

/** Returns true when all required fields are present. */
export function isConfigured(cfg: B2CEnvConfig | undefined): cfg is B2CEnvConfig {
  return !!(cfg?.tenantDomain && cfg?.clientId && cfg?.policy);
}

// =============================================================================
// App definitions — edit these to match your B2C app registrations
// =============================================================================
export const B2C_APPS: B2CAppConfig[] = [
  {
    id: 'app1',
    name:        e.VITE_APP1_NAME ?? 'Vendor Hub',
    description: e.VITE_APP1_DESC ?? 'Vendor supplier management portal',
    icon: '🏢',
    gradient: 'from-blue-600 to-blue-800',
    environments: {
      dev:   envConfig('VITE_APP1', 'DEV'),
      stage: envConfig('VITE_APP1', 'STAGE'),
      prod:  envConfig('VITE_APP1', 'PROD'),
    },
  },
  {
    id: 'app2',
    name:        e.VITE_APP2_NAME ?? 'Supplier Portal',
    description: e.VITE_APP2_DESC ?? 'External supplier onboarding and management',
    icon: '📦',
    gradient: 'from-emerald-600 to-emerald-800',
    environments: {
      dev:   envConfig('VITE_APP2', 'DEV'),
      stage: envConfig('VITE_APP2', 'STAGE'),
      prod:  envConfig('VITE_APP2', 'PROD'),
    },
  },
  {
    id: 'app3',
    name:        e.VITE_APP3_NAME ?? 'Admin Console',
    description: e.VITE_APP3_DESC ?? 'Internal administration and reporting',
    icon: '⚙️',
    gradient: 'from-violet-600 to-violet-800',
    environments: {
      dev:   envConfig('VITE_APP3', 'DEV'),
      stage: envConfig('VITE_APP3', 'STAGE'),
      prod:  envConfig('VITE_APP3', 'PROD'),
    },
  },
];

export const ENVIRONMENTS: { id: Environment; label: string; color: string }[] = [
  { id: 'dev',   label: 'DEV',   color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  { id: 'stage', label: 'STAGE', color: 'bg-blue-100   text-blue-800   border-blue-300'   },
  { id: 'prod',  label: 'PROD',  color: 'bg-green-100  text-green-800  border-green-300'  },
];

export function getApp(appId: string): B2CAppConfig | undefined {
  return B2C_APPS.find(a => a.id === appId);
}

export function getEnvConfig(appId: string, env: Environment): B2CEnvConfig | undefined {
  return getApp(appId)?.environments[env];
}
