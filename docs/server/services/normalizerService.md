# Normalizer service

## What is this service for ?

This service is used to normalize an object with some parsing options

## How to use.

To use this service you first need to inject his dependency (for example in a Controller)

```typescript
import {RestBindings, get, api} from '@loopback/rest';
import {NormalizerServiceService} from '../services';
import {inject} from '@loopback/context';

@api({basePath: '/test', paths: {}})
export class TestController {
    constructor(@inject('services.normalizer')
                protected normalizerService: NormalizerServiceService) {}

    @get('/')
    mainPage() {
    }
}

```

Then you can use it:

`normalize(toParse: object, parsingOptions: object): object | void;`

`setAction(name: string, action: (value: any) => any)`

The parsing options is an object formated like the `toParse` object.

Each key of the object can have as value:
    * A string (To use an action)
    * A function with a prototype compliant with this `(value: any) => any`
    * Anything if you don't want the key be modified

*Default actions*
    * `toUpper`
    * `toLower`

If you want to create your own action you can use `setAction` method.

```typescript
// ...

@get('/')
mainPage() {
    this.normalizerService.setAction("plusOne", (value: number): number => {
        return value + 1;
    });
    let res = this.normalizerService.normalize(
        {name: "brian", address: {number: 12, road: "pont aven"}}, 
        {name: "toUpper", address: {number: 'plusOne', road: (val: string) => {
            return "salut";
        }}});
}


// ...

```

If you want to create a new default action you can add it to `/server/src/services/normalizer-service.service.ts` constructor.