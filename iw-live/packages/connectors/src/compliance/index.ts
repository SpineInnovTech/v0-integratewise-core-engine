// Compliance Connectors Index
export { IndiaFilingsConnector, createIndiaFilingsConnector } from "./indiafilings";
export { GSTPortalConnector, createGSTPortalConnector } from "./gst-portal";

export type {
  IndiaFilingsConfig,
  FilingStatus,
  GSTReturn,
  CompanyCompliance,
} from "./indiafilings";

export type {
  GSTPortalConfig,
  GSTPortalReturn,
  GSTINDetails,
  LiabilityLedger,
  GSTR3BData,
} from "./gst-portal";
