declare module "epub-gen" {
  export interface EpubGenOptions {
    title: string;
    author?: string[];
    publisher?: string;
    cover?: string;
    content: Array<{ title: string; data: string }>;
    output: string;
    tocTitle?: string;
    lang?: string;
    css?: string;
    version?: number;
  }

  class EPub {
    constructor(options: EpubGenOptions, output: string);
    promise: Promise<void>;
  }

  export default EPub;
}