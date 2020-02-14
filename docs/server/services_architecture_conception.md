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
static async start(ctx: Context): Promise<void> {
    // this function will be called on service start on time per API launch
    // it can be used to update existing webhooks of database to current api url for example
    // WARNING: this will NOT be called on a worker
}

static async login(params: LoginObject): Promise<string> {
    // Will automatically be called by /services/login/{service_name}
    // should return the url to redirect to
    // at the end of redirections should redirect to params.redirectUrl with a query param 'code' that can be exchanged
}

static async getConfig(): Promise<ServiceConfig> {
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
      "description": "this will contain the tweet"
    }
  ]
}
```
Warning if any of your placeholders have the following name:
```typescript
[ "actionId", "actionType", "reactionId", "reactionType", "areaId", "areaName", "ownerId", "ownerEmail" ]
```
it will be discarded by the application as those as reserved and will be added by the area core functions.

*controller.ts*

This controller can be used as a [loopback 4 controllers](https://loopback.io/doc/en/lb4/Controllers.html).
It should implement the following static methods:
```typescript
static async createAction(userId: string, actionConfig: Object, ctx: Context): Promise<OperationStatus> {
    // Ask for the creation of an action
    // the result of the creation should be reuturned in OperationStatus
    // userId is the user performing the request
    // actionConfig is the config given by the front end
    // ctx is the loopback context
    // if OperationStatus.success, OperationStatus.option will be stored in db
}

static async updateAction(actionId: string, oldActionConfig: Object, newActionConfig: Object, ctx: Context): Promise<OperationStatus> {
    // Ask for the update of an action
    // the result of the update should be reuturned in OperationStatus
    // actionId is the id of the action that is beeing updated
    // oldActionConfig is the config that was in database
    // newActionConfig is the new config submitted by the user
    // ctx is the loopback context
    // if OperationStatus.success, OperationStatus.option will be stored in db
}

static async deleteAction(actionId: string, actionConfig: Object, ctx: Context): Promise<OperationStatus> {
    // Ask for the deletion of an action
    // the result of the deletion should be reuturned in OperationStatus
    // actionId is the id of the action that is beeing deleted
    // actionConfig is the config that was in database
    // ctx is the loopback context
}

static async getConfig(): Promise<ActionConfig> {
    // Should return the action configuration
}
```
It should export default a `ActionController` class.
The function that 'trigger' the action (whether with a webhook or with pooling) should call the `ActionFunction` function from [services-interfaces](../../server/src/services-interfaces.ts) to enqueue the job.

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
      "required": true,
      "default": 123456 //not required
    }
  ]
}
```

*controller.ts*

This controller **IS NOT** a loopback 4 controller as such routes created inside this controller will **NOT** be loaded by loopback.
It should implement the following static methods:
```typescript
static async trigger(params: WorkableObject): Promise<void> {
    // Trigger this reaction
    // WARNING: this method unlike the following methods will be called **ONLY** on the worker
    //        : this leads to loopback not beeing initialized, you can't join the database or retrieve the loopback context
    //        : if you need to access database data it should be done in prepareData
    // This function should only process data and make API calls
    // to apply the placeholders values to an element use the 'applyPlaceholders' function from 'services-interfaces' with the element as first param and placeholders as second.
    // it will return the element with the placeholders applied.
}

static async prepareData(reactionId: string, ctx: Context): Promise<object> {
    // Fetch the data required to process a reaction of this type
    // for example user oauth token...
    // reactionId is the id of the reaction to prepare
    // ctx is the loopback context
    // the return of this function will be set in WorkableObject.reactionPreparedData and can be accessed in trigger

    // this function should be as computationaly light as possible
}


static async createReaction(userId: string, reactionConfig: Object, ctx: Context): Promise<CreationStatus> {
    // Ask for the creation of a reaction
    // the result of the creation should be reuturned in OperationStatus
    // userId is the user performing the request
    // reactionConfig is the config given by the front end
    // ctx is the loopback context
    // if OperationStatus.success, OperationStatus.option will be stored in db
}

static async updateReaction(reactionId: string, oldReactionConfig: Object, newReactionConfig: Object, ctx: Context): Promise<OperationStatus> {
    // Ask for the update of a reaction
    // the result of the update should be reuturned in OperationStatus
    // actionId is the id of the action that is beeing updated
    // oldReactionConfig is the config that was in database
    // newReactionConfig is the new config submitted by the user
    // ctx is the loopback context
    // if OperationStatus.success, OperationStatus.option will be stored in db
}

static async deleteReaction(reactionId: string, reactionConfig: Object, ctx: Context): Promise<OperationStatus> {
    // Ask for the deletion of a reaction
    // the result of the deletion should be reuturned in OperationStatus
    // actionId is the id of the action that is beeing deleted
    // reactionConfig is the config that was in database
    // ctx is the loopback context
}

static async getConfig(): Promise<ReactionConfig> {
    // Should return the reaction configuration
}
```
It should export default a `ReactionController` class.