import "@google-cloud/documentai";

// Module augmentation to extend the IDocument interface with a "forms" property

declare module "@google-cloud/documentai" {
  export interface IDocument {
    forms?: any;
  }
}
