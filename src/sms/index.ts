/**
 * src/sms/index.ts
 * Public re-exports for the SMS module.
 */

export { SimulatedGateway, maskPhone } from "./gateway";
export type { SmsGateway, InboundHandler } from "./gateway";
export { SmsFlow } from "./flow";
export type { BatchContext } from "./flow";
