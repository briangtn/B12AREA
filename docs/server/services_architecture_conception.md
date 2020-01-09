# Services modules architectures

* /auth_services
    * /google
        * config.json
        * controller.ts

* /services
    * /twitter
        * controller.ts
        * config.json
        * /actions
            * /on_tweet
                * config.json
                * controller.ts
        * /reactions
            * /tweet
                * config.json
                * controller.ts
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

*controller.ts:*

This controller must have a login method and can be used as a [loopback 4 controllers](https://loopback.io/doc/en/lb4/Controllers.html)

### /services

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

*controller.ts:*

This controller must have a login method and can be used as a [loopback 4 controllers](https://loopback.io/doc/en/lb4/Controllers.html)

**/{service_name}/actions/{action_name}:**

*For this example we gonna use an actions triggered when a tweet is posted (on_tweet)*

*config.json*

```json
{
  "displayName": "On tweet",
  "description": "Triggered when a tweet is posted by X",
  "configSchema": {
    "username": "string"
  }
}
```

*controller.ts*

This controller can be used as a [loopback 4 controllers](https://loopback.io/doc/en/lb4/Controllers.html)

**/{service_name}/reactions/{reaction_name}:**

*For this example we gonna use a reaction who post a tweet (tweet)*

*config.json*

```json
{
  "displayName": "Tweet",
  "description": "Tweet something with a content",
  "configSchema": {
    "content": "string"
  }
}
```

*controller.ts*

This controller **IS NOT** a loopback 4 controller, this controller **MUST** have a trigger method called when a the reactions is triggered

