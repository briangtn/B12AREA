# Google Auth setup tutorial

## Create a Google application

**For this step you must have a google account**

* Go to [Google developers console](https://console.developers.google.com/) then create a project.

* Once your project is created you have to Configure the "OAuth consent screen".
    * Fill 'Authorised domains' with `YOURDOMAIN.COM`

* Then you must create "OAuth 2.0 Client ID" to proceed go the the "Credentials" tab and create credentials.
    
    * Select Web application
    * Name your application
    * Provide `https://YOURAPIDOMAIN.COM/auth-services/google/auth` in 'Authorised redirect URIs'
    * Provide `https://YOURAPPDOMAIN.COM/` and `https://YOURAPIDOMAIN.COM/` in 'Authorised JavaScript origins'
    
* Then you must set the environment variables
    * `GOOGLE_CLIENT_ID`
    * `GOOGLE_CLIENT_SECRET`
    
You are ready to use the authentication with google !