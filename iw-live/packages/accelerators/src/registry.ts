import { AcceleratorManifest } from "./types";

export class AcceleratorRegistry {
  private manifests: Map<string, AcceleratorManifest> = new Map();

  /**
   * Register a new Accelerator Manifest
   */
  register(manifest: AcceleratorManifest) {
    // Validation could happen here
    this.manifests.set(manifest.id, manifest);
  }

  /**
   * Get a manifest by ID
   */
  get(id: string): AcceleratorManifest | undefined {
    return this.manifests.get(id);
  }

  /**
   * List all registered accelerators
   */
  list(): AcceleratorManifest[] {
    return Array.from(this.manifests.values());
  }

  /**
   * Filter by Vertical
   */
  listByVertical(vertical: string): AcceleratorManifest[] {
    return this.list().filter((m) => m.vertical === vertical);
  }

  /**
   * Filter by Role
   */
  listByRole(role: string): AcceleratorManifest[] {
    return this.list().filter((m) => m.roles_supported?.includes(role));
  }
}

// Global Singleton
export const registry = new AcceleratorRegistry();
