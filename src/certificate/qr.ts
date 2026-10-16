import QRCode from "qrcode";
import { HarvesterCertificate, toBase64Url } from "./build";

/**
 * Generates a PNG Data URL representing a QR code for a Harvester Certificate.
 *
 * Encodes: `${verifyBaseUrl}#c=${base64url(compactCertificate)}`
 *
 * Fallback: If the certificate payload exceeds standard QR code data capacity,
 * falls back to encoding a query URL with batchId, contractAddress, and chainId.
 *
 * @param certificate HarvesterCertificate object
 * @param verifyBaseUrl Base URL of the public static verification web page
 * @returns Promise resolving to a PNG Data URL (e.g. "data:image/png;base64,...")
 */
export async function certificateQr(
  certificate: HarvesterCertificate,
  verifyBaseUrl: string = "https://ziwachain.org/verify"
): Promise<string> {
  const compactJson = JSON.stringify(certificate);
  const base64UrlData = toBase64Url(compactJson);
  const primaryUrl = `${verifyBaseUrl}#c=${base64UrlData}`;

  try {
    // Attempt to generate QR with full certificate payload
    return await QRCode.toDataURL(primaryUrl, {
      errorCorrectionLevel: "L", // 'L' allows maximum data capacity (~2,953 bytes)
      margin: 2,
      scale: 6
    });
  } catch (err: any) {
    console.warn(
      "Notice: Certificate payload exceeds single QR code data capacity. Falling back to lightweight reference URL."
    );
    // Lightweight fallback URL containing only critical on-chain references
    const fallbackUrl = `${verifyBaseUrl}?batchId=${encodeURIComponent(
      certificate.batchId
    )}&contract=${encodeURIComponent(certificate.contractAddress)}&chainId=${encodeURIComponent(
      certificate.chainId
    )}`;

    return await QRCode.toDataURL(fallbackUrl, {
      errorCorrectionLevel: "M",
      margin: 2,
      scale: 6
    });
  }
}
