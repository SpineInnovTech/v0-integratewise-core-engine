import { DomainMasterConnector } from "../domain-master-connector";
import { DomainId } from "../types";
import { getProvidersForDomain } from "../catalog-bridge";
import { JiraConnector } from "../../project-management/jira";
import { LinearConnector } from "../../project-management/linear";
import { GitHubConnector } from "../../project-management/github";

/**
 * Engineering Domain Master — catalog-driven (GitHub, GitLab, Bitbucket, Jira, Linear).
 */
export class EngineeringMasterConnector extends DomainMasterConnector {
  readonly domain: DomainId = "engineering";
  readonly domainName = "Engineering & DevOps";

  readonly supportedProviders = getProvidersForDomain("engineering");

  async getActiveIssues(limit = 50): Promise<any[]> {
    const primary = this.primaryProviderId;
    if (primary === "jira") {
      const jira = this.getProvider<JiraConnector>("jira");
      return jira.getIssues({ maxResults: limit });
    }
    if (primary === "linear") {
      const linear = this.getProvider<LinearConnector>("linear");
      const result = await linear.getIssues({ first: limit });
      return result.issues || [];
    }
    if (primary === "github") {
      const gh = this.getProvider<GitHubConnector>("github");
      return gh.listRepos({ per_page: limit });
    }
    throw new Error("No engineering provider configured");
  }
}
