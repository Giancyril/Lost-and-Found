declare module 'quagga' {
  interface QuaggaConfig {
    inputStream?: {
      name?:        string;
      type?:        string;
      target?:      HTMLElement | null;
      constraints?: {
        width?:      number;
        height?:     number;
        facingMode?: string;
      };
    };
    locator?: {
      patchSize?:  string;
      halfSample?: boolean;
    };
    numOfWorkers?: number;
    decoder?: {
      readers?: string[];
    };
  }

  interface QuaggaResult {
    codeResult?: {
      code:        string;
      confidence?: number;
    };
  }

  const Quagga: {
    init:        (config: QuaggaConfig, callback: (err: any) => void) => void;
    start:       () => void;
    stop:        () => void;
    onDetected:  (callback: (result: QuaggaResult) => void) => void;
    offDetected: (callback: (result: QuaggaResult) => void) => void;
  };

  export default Quagga;
}