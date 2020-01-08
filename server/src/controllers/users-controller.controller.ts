import {get, param} from '@loopback/rest';
// Uncomment these imports to begin using these cool features!


export class UsersControllerController {
  constructor() {}

  @get('/test_module/{module_name}')
  test(@param.path.string("module_name") moduleName: string): Promise<string> {
    return new Promise((resolve, reject) => {
      import('../modules/' + moduleName + '/controller.controller').then(module => {
        resolve(new module.default().salut());
      }).catch(err => {
        reject(err);
      });
    });
  }
}
