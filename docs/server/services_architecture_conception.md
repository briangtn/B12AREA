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

*controller.ts:*

Controller class must be exported as default class
This controller must have a login static method and can be used as a [loopback 4 controllers](https://loopback.io/doc/en/lb4/Controllers.html)

### /services

(the json file are not mandatory and are only here to describe the object returned by getConfig())

**/{service_name}:**

*For this example we gonna use twitter*

This is a service who expose an authentication method and some actions and reactions

*config.json:*
```json
{
  "displayName": "Twitter",
  "description": "Twitter is trump's favorite social network",
  "icon": "https://twitter.com/favicon.ico",
  "color": "#1da1f2"
}
```

*controller.ts:*

Controller class must be exported as default class
This controller can be used as a [loopback 4 controllers](https://loopback.io/doc/en/lb4/Controllers.html).
It should implement the following static methods:
```typescript
static async start(): Promise<void> {
    // this function will be called on service start on time per launch
    // it can be used to update existing webhooks of database to current api url for example
}

static async login(params: LoginObject): Promise<string> {
    // should return the url to redirect to
    // at the end of redirections should redirect to params.redirectUrl with a query param 'code' that can be exchanged
}

static async getConfig(): Promise<ActionConfig> {
    // should return the config of this service
}
```
It should export default a `ServiceController` class.

**/{service_name}/actions/{action_name}:**

*For this example we gonna use an actions triggered when a tweet is posted (on_tweet)*

*config.json*

```json
{
  "displayName": "On tweet",
  "description": "Triggered when a tweet is posted by X",
  "configSchema": [
      {
        "name": "food",
        "description": "A string that correspond to the type of food",
        "type": "string",
        "required": true,
        "default": "Champignon" //not required
      }
  ],
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
It should implement the following static functions:
```typescript
static async createAction(actionConfig: Object): Promise<OperationStatus> {
    // Ask for the creation of an action
    // the result of the creation should be reuturned in OperationStatus
    // actionConfig is the config given by the front end
    // if OperationStatus.success, OperationStatus.option will be stored in db
}

static async updateAction(actionConfig: Object): Promise<OperationStatus> {
    // Ask for the update of an action
    // the result of the update should be reuturned in OperationStatus
    // actionConfig is the config that was in database
    // if OperationStatus.success, OperationStatus.option will be stored in db
}

static async deleteAction(actionConfig: Object): Promise<OperationStatus> {
    // Ask for the deletion of an action
    // the result of the deletion should be reuturned in OperationStatus
    // actionConfig is the config that was in database
}

static async getConfig(): Promise<ActionConfig> {
    // Should return the action configuration
}
```
It should export default a `ActionController` class.

**/{service_name}/reactions/{reaction_name}:**

*For this example we gonna use a reaction who post a tweet (tweet)*

*config.json*

```json
{
  "displayName": "Tweet",
  "description": "Tweet something with a content",
  "configSchema": [
    {
      "name": "tweet",
      "description": "A tweet id",
      "type": "number",
      "required": true
    }
  ]
}
```

*reaction_name.ts*

This controller **IS NOT** a loopback 4 controller.
It should implement the following static functions:
```typescript
static async trigger(params: TriggerObject): Promise<void> {
    // Trigger this reaction
}

static async createReaction(reactionConfig: Object): Promise<CreationStatus> {
    // Ask for the creation of a reaction
    // the result of the creation should be reuturned in OperationStatus
    // reactionConfig is the config given by the front end
    // if OperationStatus.success, OperationStatus.option will be stored in db
}

static async updateReaction(reactionConfig: Object): Promise<OperationStatus> {
    // Ask for the update of a reaction
    // the result of the update should be reuturned in OperationStatus
    // reactionConfig is the config that was in database
    // if OperationStatus.success, OperationStatus.option will be stored in db
}

static async deleteReaction(reactionConfig: Object): Promise<OperationStatus> {
    // Ask for the deletion of a reaction
    // the result of the deletion should be reuturned in OperationStatus
    // reactionConfig is the config that was in database
}

static async getConfig(): Promise<ReactionConfig> {
    // Should return the reaction configuration
}
```
It should export default a `ReactionController` class.