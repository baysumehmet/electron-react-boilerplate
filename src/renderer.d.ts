// src/renderer.d.ts
export interface IElectronAPI {
  connectBot: (options: object) => void;
  startAntiAFK: (username: string, interval: number) => void;
  stopAntiAFK: (username: string) => void;
  sendChatMessage: (username: string, message: string) => void;
  disconnectBot: (username: string) => void;
  loadAccounts: () => Promise<any[]>;
  saveAccounts: (accounts: any[]) => void;
  loadServerInfo: () => Promise<any | null>;
  saveServerInfo: (serverInfo: any) => void;
  getSupportedVersions: () => Promise<string[]>;
  /**
   * Registers a listener for bot events and returns a function to unsubscribe.
   */
  onBotEvent: (callback: (data: any) => void) => () => void;
}

declare global {
  interface Window {
    api: IElectronAPI;
  }
}
