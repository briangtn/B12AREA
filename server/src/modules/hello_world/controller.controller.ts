import {get} from '@loopback/rest';

export default class Test {
    constructor() {
        console.log("salut");
    }

    salut(): string {
        return "Salut";
    }

    @get('/mon_module')
    module(): string {
        return "Lilian ça marche";
    }
}