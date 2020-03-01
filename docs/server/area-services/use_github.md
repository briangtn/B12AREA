# Github setup tutorial

## Create a github application

Go to [Github apps page](https://github.com/settings/developers) then create an app by clicking the following button:

![Github create button](../res/Github_add_oauth_app_button.png)

You will go to this page:

![Github create app page](../res/Github_add_oauth_app_page.png)

You need to fill the following fields:
* Application name: anything you want, it will be showed to your users
* Homepage URL: the url of your front end web application
* Authorization callback URL: `https://YOURAPIDOMAIN.COM/services/github/oauth`

## Get .env values

After creating the application you will need the followings data from the application page:

![Github app page with keys](../res/Github_app_page_keys.png)

Use the `Client ID` field in the page for the variable `GITHUB_CLIENT_ID` in the .env file.
Use the `Client Secret` field in the page for the variable `GITHUB_CLIENT_SECRET` in the .env file.