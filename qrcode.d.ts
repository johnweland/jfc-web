declare module "qrcode" {
  export type QRCodeErrorCorrectionLevel = "L" | "M" | "Q" | "H";

  export type QRCodeRenderOptions = {
    color?: {
      dark?: string;
      light?: string;
    };
    errorCorrectionLevel?: QRCodeErrorCorrectionLevel;
    margin?: number;
    width?: number;
  };

  export function toDataURL(
    text: string,
    options?: QRCodeRenderOptions
  ): Promise<string>;

  const QRCode: {
    toDataURL: typeof toDataURL;
  };

  export default QRCode;
}
