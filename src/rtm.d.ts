declare module 'satori-sdk-js' {
  export = RTM;

  type OnAck = (msg: any) => void;
  type OnEvent = (msg: any) => void;
  type OnCompleted = (msg: any) => void;

  interface Observer {
    on(event: string, handler: OnEvent): void;
    off(event: string, handler: OnEvent): void;
    fire(event: string): void;
  }

  class RTM implements Observer {
    constructor(endpoint: string, appkey: string, options?: any);
    start(): void;
    stop(): void;
    restart(): void;
    isStopped(): boolean;
    isConnected(): boolean;
    getSubscription(subId: string): RTM.Subscription;
    subscribe(subId: string, mode: RTM.SubscriptionMode, options?: any): RTM.Subscription;
    resubscribe(subId: string, options?: any, onCompleted?: OnCompleted): void;
    unsubscribe(subId: string, onAck?: OnAck): void;
    publish(channel: string, message: any, onAck?: OnAck): void;
    read(channel: string, onAck?: OnAck): void;
    read(channel: string, options?: any): void;
    write(channel: string, value: any, onAck?: OnAck): void;
    delete(channel: string, onAck?: OnAck): void;
    search(channel: string, onAck?: OnAck): void;

    on(event: string, handler: OnEvent): void;
    off(event: string, handler: OnEvent): void;
    fire(event: string): void;
  }

  module RTM {
    interface Subscription extends Observer { }

    function roleSecretAuthProvider(role: string, roleSecret: string, opts: any, timeout?: number): any;

    interface SubscriptionMode {
      trackPosition: boolean;
      fastForward: boolean;
    }

    module SubscriptionMode {
      var SIMPLE: SubscriptionMode;
      var RELIABLE: SubscriptionMode;
      var ADVANCED: SubscriptionMode;
    }
  }
}

