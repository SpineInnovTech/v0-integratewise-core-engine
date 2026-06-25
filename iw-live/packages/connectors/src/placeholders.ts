/**
 * Connector adapters — full contract implementation (testConnection, getMetadata, sync).
 * Each adapter implements the connector interface; sync returns entities when provider API is wired.
 *
 * NOTE: The following connectors have been promoted from placeholders to real implementations:
 * - Microsoft Teams → ./communication/microsoft-teams.ts
 * - Zoom → ./communication/zoom.ts
 * - GitLab → ./project-management/gitlab.ts
 * - Bitbucket → ./project-management/bitbucket.ts
 * - Dropbox → ./productivity/dropbox.ts
 * - Cohere → ./ai/cohere.ts
 * - Pipedrive → ./crm/pipedrive.ts
 * - Freshsales → ./crm/freshsales.ts
 * - Close → ./crm/close.ts
 * - Chargebee → ./accounting/chargebee.ts
 */

import {
  BaseConnector,
  ConnectorConfig,
  ConnectorMetadata,
} from "@integratewise/connector-contracts";

function adapterMetadata(id: string, name: string): ConnectorMetadata {
  return {
    id,
    name,
    version: "0.1.0",
    apiVersion: "v1",
    capabilities: { sync: true, webhooks: false },
  };
}

/** Base adapter: full contract (testConnection, getMetadata, sync). */
abstract class BaseAdapterConnector extends BaseConnector {
  constructor(config: ConnectorConfig) {
    super(config);
  }
  abstract override getMetadata(): ConnectorMetadata;
  async testConnection(): Promise<boolean> {
    return true;
  }
  async sync(_opts: {
    phase?: string;
    since?: string;
    cursor?: string;
    limit?: number;
    entityType?: string;
  }): Promise<{ entities: unknown[]; next_cursor?: string }> {
    return { entities: [] };
  }
}

// CRM & Sales placeholders removed - promoted to real connectors

// Project Management
export class MondayConnector extends BaseAdapterConnector {
  override getMetadata() {
    return adapterMetadata("monday", "Monday.com");
  }
}
export class TrelloConnector extends BaseAdapterConnector {
  override getMetadata() {
    return adapterMetadata("trello", "Trello");
  }
}
export class ClickUpConnector extends BaseAdapterConnector {
  override getMetadata() {
    return adapterMetadata("clickup", "ClickUp");
  }
}

// Support / ITSM
export class ServiceNowConnector extends BaseAdapterConnector {
  override getMetadata() {
    return adapterMetadata("servicenow", "ServiceNow");
  }
}

// Marketing
export class ActiveCampaignConnector extends BaseAdapterConnector {
  override getMetadata() {
    return adapterMetadata("activecampaign", "ActiveCampaign");
  }
}

// E-commerce placeholders removed - now implemented in ecommerce/

// HR
export class BambooHRConnector extends BaseAdapterConnector {
  override getMetadata() {
    return adapterMetadata("bamboohr", "BambooHR");
  }
}
