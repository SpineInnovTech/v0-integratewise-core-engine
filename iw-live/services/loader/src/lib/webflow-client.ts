/**
 * Webflow API Client
 * Utilities for interacting with Webflow API
 */

export interface WebflowSite {
  id: string;
  displayName: string;
  shortName: string;
  lastPublished?: string;
  previewUrl?: string;
  timezone?: string;
  locales?: string[];
}

export interface WebflowCollection {
  id: string;
  displayName: string;
  singularName: string;
  slug: string;
  fields: WebflowField[];
}

export interface WebflowField {
  id: string;
  displayName: string;
  slug: string;
  type: string;
  isRequired?: boolean;
}

export interface WebflowCollectionItem {
  id: string;
  cmsLocaleId: string;
  lastPublished?: string;
  lastUpdated?: string;
  createdOn?: string;
  isArchived?: boolean;
  isDraft?: boolean;
  fieldData: Record<string, any>;
}

export interface WebflowFormSubmission {
  id: string;
  formId: string;
  siteId: string;
  submittedAt: string;
  data: Record<string, any>;
}

/**
 * Webflow API Client Class
 */
export class WebflowClient {
  private apiKey: string;
  private baseUrl = "https://api.webflow.com/v2";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Get all sites
   */
  async getSites(): Promise<WebflowSite[]> {
    const response = await fetch(`${this.baseUrl}/sites`, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Webflow API error: ${response.status} ${response.statusText}`);
    }

    const data: any = await response.json();
    return data.sites || [];
  }

  /**
   * Get a specific site
   */
  async getSite(siteId: string): Promise<WebflowSite> {
    const response = await fetch(`${this.baseUrl}/sites/${siteId}`, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Webflow API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get all collections for a site
   */
  async getCollections(siteId: string): Promise<WebflowCollection[]> {
    const response = await fetch(`${this.baseUrl}/sites/${siteId}/collections`, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Webflow API error: ${response.status} ${response.statusText}`);
    }

    const data: any = await response.json();
    return data.collections || [];
  }

  /**
   * Get a specific collection
   */
  async getCollection(siteId: string, collectionId: string): Promise<WebflowCollection> {
    const response = await fetch(`${this.baseUrl}/sites/${siteId}/collections/${collectionId}`, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Webflow API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get collection items
   */
  async getCollectionItems(
    siteId: string,
    collectionId: string,
    options?: {
      limit?: number;
      offset?: number;
    }
  ): Promise<{ items: WebflowCollectionItem[]; pagination?: any }> {
    const params = new URLSearchParams();
    if (options?.limit) params.append("limit", options.limit.toString());
    if (options?.offset) params.append("offset", options.offset.toString());

    const url = `${this.baseUrl}/sites/${siteId}/collections/${collectionId}/items${
      params.toString() ? `?${params.toString()}` : ""
    }`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Webflow API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get a specific collection item
   */
  async getCollectionItem(
    siteId: string,
    collectionId: string,
    itemId: string
  ): Promise<WebflowCollectionItem> {
    const response = await fetch(
      `${this.baseUrl}/sites/${siteId}/collections/${collectionId}/items/${itemId}`,
      {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Webflow API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Create a collection item
   */
  async createCollectionItem(
    siteId: string,
    collectionId: string,
    fieldData: Record<string, any>,
    isDraft: boolean = false
  ): Promise<WebflowCollectionItem> {
    const response = await fetch(
      `${this.baseUrl}/sites/${siteId}/collections/${collectionId}/items`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fieldData,
          isDraft,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Webflow API error: ${response.status} ${error}`);
    }

    return response.json();
  }

  /**
   * Update a collection item
   */
  async updateCollectionItem(
    siteId: string,
    collectionId: string,
    itemId: string,
    fieldData: Record<string, any>
  ): Promise<WebflowCollectionItem> {
    const response = await fetch(
      `${this.baseUrl}/sites/${siteId}/collections/${collectionId}/items/${itemId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fieldData,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Webflow API error: ${response.status} ${error}`);
    }

    return response.json();
  }

  /**
   * Delete a collection item
   */
  async deleteCollectionItem(siteId: string, collectionId: string, itemId: string): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/sites/${siteId}/collections/${collectionId}/items/${itemId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Webflow API error: ${response.status} ${response.statusText}`);
    }
  }

  /**
   * Publish collection items
   */
  async publishCollectionItems(
    siteId: string,
    collectionId: string,
    itemIds: string[]
  ): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/sites/${siteId}/collections/${collectionId}/items/publish`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          itemIds,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Webflow API error: ${response.status} ${response.statusText}`);
    }
  }

  /**
   * Get form submissions
   */
  async getFormSubmissions(
    siteId: string,
    formId?: string,
    options?: {
      limit?: number;
      offset?: number;
    }
  ): Promise<{ submissions: WebflowFormSubmission[]; pagination?: any }> {
    const params = new URLSearchParams();
    if (formId) params.append("formId", formId);
    if (options?.limit) params.append("limit", options.limit.toString());
    if (options?.offset) params.append("offset", options.offset.toString());

    const url = `${this.baseUrl}/sites/${siteId}/form_submissions${
      params.toString() ? `?${params.toString()}` : ""
    }`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Webflow API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }
}

/**
 * Create a Webflow client instance
 */
export function createWebflowClient(apiKey: string): WebflowClient {
  return new WebflowClient(apiKey);
}
