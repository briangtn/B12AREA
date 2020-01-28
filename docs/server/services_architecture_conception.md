# Services modules architectures

* /auth_services
    * /google
        * config.json
        * google.lb-controller.ts

* /services
    * /twitter
        * twitter.lb-controller.ts
        * config.json
        * /actions
            * /on_tweet
                * config.json
                * on_tweet.lb-controller.ts
        * /reactions
            * /tweet
                * config.json
                * tweet.ts
---
                
### /auth_services

**/{service_name}:**

*For this example we gonna use google*

This is a service who expose an authentication method
*config.json:* 

```json
{
  "displayName": "Google",
  "description": "Login with google"
}
```

*service_name.lb-controller.ts:*

This controller must have a login method and can be used as a [loopback 4 controllers](https://loopback.io/doc/en/lb4/Controllers.html)

### /services

(the json file are not mandatory and are only here to describe the object returned by getConfig())

**/{service_name}:**

*For this example we gonna use twitter*

This is a service who expose an authentification method and some actions and reactions

*config.json:*
```json
{
  "displayName": "Twitter",
  "description": "Twitter is trump's favorite social network"
}
```

*service_name.lb-controller.ts:*

This controller can be used as a [loopback 4 controllers](https://loopback.io/doc/en/lb4/Controllers.html).
It should implement the [ServiceControllerInterface](../../server/src/services-interfaces.ts) interface.
It should export a `ServiceController` class.

**/{service_name}/actions/{action_name}:**

*For this example we gonna use an actions triggered when a tweet is posted (on_tweet)*

*config.json*

```json
{
  "displayName": "On tweet",
  "description": "Triggered when a tweet is posted by X",
  "configSchema": {
    "username": "string",
// You can also use objects
//  "name": {
//    "type": "string",
//    "required": true,
//    "default": "Champignon"
//  }
  },
  "placeholders": [
    {
      "name": "tweet",
      "description": "this action is triggered when a tweet from @username is published"
    }
  ]
}
```

*action_name.lb-controller.ts*

This controller can be used as a [loopback 4 controllers](https://loopback.io/doc/en/lb4/Controllers.html).
It should implement the [ActionControllerInterface](../../server/src/services-interfaces.ts) interface.
It should export a `ActionController` class.

**/{service_name}/reactions/{reaction_name}:**

*For this example we gonna use a reaction who post a tweet (tweet)*

*config.json*

```json
{
  "displayName": "Tweet",
  "description": "Tweet something with a content",
  "configSchema": {
    "content": "string",
// You can also use objects
//  "name": {
//    "type": "string",
//    "required": true,
//    "default": "Champignon"
//  }
  }
}
```

*reaction_name.ts*

This controller **IS NOT** a loopback 4 controller.
It should implement the [ReactionControllerInterface](../../server/src/services-interfaces.ts) interface.
It should export a `ReactionController` class.