import { DomainMasterConnector } from "../domain-master-connector";
import { DomainId } from "../types";
import { getProvidersForDomain } from "../catalog-bridge";
import { SlackConnector } from "../../communication/slack";
import { DiscordConnector } from "../../communication/discord";

/**
 * Communication Domain Master — catalog-driven (Slack, Microsoft Teams, Zoom, Twilio, Discord, WhatsApp Business).
 */
export class CommunicationMasterConnector extends DomainMasterConnector {
  readonly domain: DomainId = "communication";
  readonly domainName = "Communication";

  readonly supportedProviders = getProvidersForDomain("communication");

  async getRecentMessages(limit = 50): Promise<any[]> {
    const primary = this.primaryProviderId;
    if (primary === "slack") {
      const slack = this.getProvider<SlackConnector>("slack");
      const channels = (await slack.getChannels()) || [];
      return Array.isArray(channels) ? channels.slice(0, limit) : [];
    }
    if (primary === "discord") {
      const discord = this.getProvider<DiscordConnector>("discord");
      if ("getChannels" in discord && typeof (discord as any).getChannels === "function") {
        const channels = await (discord as any).getChannels();
        return Array.isArray(channels) ? channels.slice(0, limit) : [];
      }
    }
    throw new Error("No communication provider configured or getRecentMessages not supported");
  }
}
