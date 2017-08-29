type OnAck = (pdu: PDU) => void;
type OnEvent = (...args: any[]) => void;
type OnCompleted = (subscription: RTM.Subscription) => void;
type AuthProvider = (rtm: RTM, onsuccess: () => void, onerror: (err: any) => void) => void;

interface Observer {
  on(event: string, handler: OnEvent): void;
  off(event: string, handler: OnEvent): void;
  fire(event: string): void;
}

interface PDU {
  id: number;
  body: any;
  position: string;
}

interface AuthProviderOptions {
  timeout?: number;
}

interface RTMOptions {
  minReconnectInterval?: number;
  maxReconnectInterval?: number;
  authProvider?: AuthProvider;
  heartbeatEnabled?: boolean;
  heartbeatInterval?: number;
  highWaterMark?: number;
  lowWaterMark?: number;
  checkWritabilityInterval?: number;
  proxyAgent?: any;
}

interface ReadOptions {
  bodyOpts?: any;
  onAck?: OnAck;
}

export = RTM;

declare class RTM implements Observer {
  constructor(endpoint: string, appkey: string, options?: RTMOptions);
  start(): void;
  stop(): void;
  restart(): void;
  isStopped(): boolean;
  isConnected(): boolean;
  getSubscription(subId: string): RTM.Subscription;
  subscribe(subId: string, mode: RTM.SubscriptionMode, bodyOpts?: any): RTM.Subscription;
  resubscribe(subId: string, mode: RTM.SubscriptionMode, bodyOpts?: any, onCompleted?: OnCompleted): void;
  unsubscribe(subId: string, onAck?: OnAck): void;
  publish(channel: string, message: any, onAck?: OnAck): void;
  read(channel: string, onAck?: OnAck): void;
  read(channel: string, options?: ReadOptions): void;
  write(channel: string, value: any, onAck?: OnAck): void;
  delete(channel: string, onAck?: OnAck): void;
  search(channel: string, onAck?: OnAck): void;

  on(event: string, handler: OnEvent): void;
  off(event: string, handler: OnEvent): void;
  fire(event: string): void;
}

declare namespace RTM {
  interface Subscription extends Observer {
    subscriptionId: string;
  }

  function roleSecretAuthProvider(role: string, roleSecret: string, opts?: AuthProviderOptions): AuthProvider;

  export interface SubscriptionMode {
    trackPosition: boolean;
    fastForward: boolean;
  }

  export module SubscriptionMode {
    var SIMPLE: SubscriptionMode;
    var RELIABLE: SubscriptionMode;
    var ADVANCED: SubscriptionMode;
  }
}