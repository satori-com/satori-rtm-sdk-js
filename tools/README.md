Console tools helper
===========================================

Console tools helps you to debug SDK and work in the interactive mode.

Usage and examples:
-------------------------------------

```
$ cd /path/to/sdk/js/
$ node -i
> .load tools/console.js
> .....

Examples:
> rtm.subscribe('test', RTM.SubscriptionMode.SIMPLE);
send> {"id":1,"action":"rtm/subscribe","body":{"channel":"test","fast_forward":true}}
{ handlers: {},
  options:
   { trackNext: false,
     fastForward: true,
     autoReconnect: true,
     bodyOpts: { fast_forward: true } },
  next: null,
  channel: 'test',
  wasSubscribedAtLeastOnce: false,
  isSubscribed: false }
 
  recv< {"action":"rtm/subscribe/ok","body":{"position":"1484760918:3","subscription_id":"test"},"id":1}

> rtm.publish('test', 42);
  send> {"action":"rtm/publish","body":{"channel":"test","message":42}}
  recv< {"action":"rtm/subscription/data","body":{"subscription_id":"test","position":"1484760918:4","messages":[42]}}
> 
```

Debug mode
========================================

To get all outcome and income requests set the `DEBUG: true,` in src/logger.js