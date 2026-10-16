/**
 * SMS Gateway abstraction for ZiwaChain settlement and proof flows.
 *
 * The `SmsGateway` interface is the only surface that the real ZiwaClear SMS
 * pipeline needs to implement. Swap `SimulatedGateway` for your Twilio / Africa's
 * Talking / Safaricom USSD-gateway adapter, wire up the webhook to call
 * `onReceive`, and the flow.ts logic runs unchanged.
 */

export type InboundHandler = (from: string, text: string) => Promise<void>;

/**
 * Minimal SMS gateway interface.
 * Real implementations connect to Twilio, Africa's Talking, or an SMSC.
 */
export interface SmsGateway {
  /** Send an outbound SMS. */
  send(to: string, text: string): Promise<void>;

  /**
   * Register the handler that is called whenever an inbound SMS arrives.
   * Each `onReceive` call replaces the previous handler.
   */
  onReceive(handler: InboundHandler): void;

  /**
   * Simulate an inbound SMS from `from` with body `text`.
   * Real gateways receive this from a webhook; the simulated gateway calls the
   * handler directly so tests and the demo script can drive the conversation.
   */
  simulateInbound(from: string, text: string): Promise<void>;
}

/**
 * Masks all but the last 3 digits of a phone number.
 * Privacy rule: phone numbers must never appear in logs or on-chain.
 *
 * Example: "+254712345678" -> "+2547****678"
 */
export function maskPhone(phone: string): string {
  if (phone.length <= 7) return "****";
  const prefixLen = phone.startsWith("+") ? 5 : 2;
  const prefix = phone.slice(0, prefixLen);
  const suffix = phone.slice(-3);
  return `${prefix}****${suffix}`;
}

/**
 * In-memory simulated SMS gateway.
 * Prints every message as a readable chat exchange to stdout.
 * No real network calls, no third-party dependencies.
 *
 * Plug-in point for the real ZiwaClear pipeline:
 *   Replace this class with an adapter for Africa's Talking, Twilio,
 *   or the Safaricom USSD bridge. The adapter must implement SmsGateway.
 *   The `simulateInbound` method becomes a webhook endpoint that calls
 *   the registered handler when an SMS arrives from the operator.
 */
export class SimulatedGateway implements SmsGateway {
  private handler: InboundHandler | null = null;
  private shortCode: string;

  constructor(shortCode = "ZiwaClear") {
    this.shortCode = shortCode;
  }

  async send(to: string, text: string): Promise<void> {
    const masked = maskPhone(to);
    console.log(`\n  [${this.shortCode} -> ${masked}]`);
    text.split("\n").forEach((line) => console.log(`    ${line}`));
  }

  onReceive(handler: InboundHandler): void {
    this.handler = handler;
  }

  async simulateInbound(from: string, text: string): Promise<void> {
    const masked = maskPhone(from);
    console.log(`\n  [${masked} -> ${this.shortCode}]`);
    text.split("\n").forEach((line) => console.log(`    ${line}`));
    if (this.handler) {
      await this.handler(from, text);
    }
  }
}
