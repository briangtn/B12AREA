# AREA
[![master status](http://git.b12powered.com/Eldriann/area/badges/master/pipeline.svg)](http://git.b12powered.com/Eldriann/area/commits/master)
[![develop status](http://git.b12powered.com/Eldriann/area/badges/develop/pipeline.svg)](http://git.b12powered.com/Eldriann/area/commits/develop)

This is the repository of the area project.

# How to use

## Install
You need to install ngrok and run it to create a proxy that expose your local server on the internet.
You need to copy the `.env.example` file to a `.env` file and modify the variables as you need.
The `API_URL` value should be the url given by ngrok.

## Run

**dev mode:**

```bash
cp .env.example .env
// update .env
npm run install
npm run dev
```

**prod mode:**

```bash
cp .env.example .env
// update .env
npm start
```

# Information

You can have more information on the development process by going into the [docs](./docs) folder.

The project is organised as follow:
![Organisation](./docs/area_services_organisation.png)

The API and Worker uses the [server](./server) folder to be build.

The WEB front uses the [web](./web) folder to be build.

The Mobile front uses the [mobile](./mobile) folder to be build.

## UML
You can generate uml diagram from *.puml files by using the plantuml command.
```shell script
plantuml ./path/to/file.puml
```

# Authors

* [Brian Guitteny](https://github.com/briangtn)
* [Julian Frabel](https://github.com/Eldriann)
* [Jules Bulteau](https://github.com/JBulteau)
* [Romain Fouyer](https://github.com/romanosaurus)
* [Charlie Jeanneau](https://github.com/JeSuisCharlie1)
* [Lilian Arago](https://github.com/NahisWayard)
