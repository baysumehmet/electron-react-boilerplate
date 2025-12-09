// src/renderer.d.ts
export interface IElectronAPI {
  // Bot Connection & Anti-AFK
  connectBot: (options: object) => void;
  disconnectBot: (username: string, isManual?: boolean) => void;
  startAntiAFK: (username: string, interval: number) => void;
  stopAntiAFK: (username: string) => void;

  // Chat
  sendChatMessage: (username: string, message: string) => void;

  // Inventory & Items
  getInventory: (username: string) => Promise<any>;
  moveItem: (options: { username: string, sourceSlot: number, destinationSlot: number }) => void;
  tossItemStack: (options: { username: string, sourceSlot: number }) => void;
  clearInventory: (username: string) => void;
  setActiveHotbar: (options: { username: string, slot: number }) => void;

  // World Interaction & Movement
  openNearestChest: (username: string) => void;
  openChestAt: (username: string, x: string | number, y: string | number, z: string | number) => Promise<void>;
  breakBlock: (username: string, x: string | number, y: string | number, z: string | number) => Promise<void>;
  moveTo: (username: string, x: string | number, y: string | number, z: string | number) => Promise<void>;
  closeWindow: (username: string) => void;
  followPlayer: (username: string, targetUsername: string, duration: number) => Promise<void>;

  // Chest Interactions
  depositItem: (options: { username: string, item: any }) => void;
  withdrawItem: (options: { username:string, item: any }) => void;
  depositAll: (username: string) => void;
  withdrawAll: (username: string) => void;
  depositToChest: (username: string, excludedItems: string) => Promise<void>;

  // Data Storage
  loadAccounts: () => Promise<any[]>;
  saveAccounts: (accounts: any[]) => void;
  loadServerInfo: () => Promise<any | null>;
  saveServerInfo: (serverInfo: any) => void;
  loadScripts: () => Promise<any>;
  saveScripts: (scripts: any) => void;

  // Misc
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
