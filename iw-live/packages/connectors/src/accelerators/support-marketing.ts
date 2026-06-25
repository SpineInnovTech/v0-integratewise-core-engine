import { BaseAccelerator } from "@integratewise/connector-contracts";

export class SupportMarketingAccelerator extends BaseAccelerator {
  async analyzeAttribution(_leads: any[]): Promise<any> {
    return {
      channelPerformance: {
        organic: 0.4,
        paid: 0.3,
        referral: 0.3,
      },
    };
  }
}
