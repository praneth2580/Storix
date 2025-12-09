declare module "dom-to-image-more" {
  const domToImage: {
    toPng: (node: HTMLElement, options?: any) => Promise<string>;
    toJpeg: (node: HTMLElement, options?: any) => Promise<string>;
    toSvg: (node: HTMLElement, options?: any) => Promise<string>;
    toBlob: (node: HTMLElement, options?: any) => Promise<Blob>;
    toPixelData: (node: HTMLElement, options?: any) => Promise<Uint8Array>;
  };

  export default domToImage;
}