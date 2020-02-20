package com.b12powered.area.api

import android.content.Context
import android.content.SharedPreferences
import android.util.Log
import com.android.volley.Request

/**
 * A sealed class which represent every api call
 *
 * @param mainContext The context from where the call has been performed
 */
sealed class ApiRoute(private var mainContext: Context) {

    /**
     * Data class for [Login] route
     *
     * @param email The email of the user
     * @param password The password of the user
     * @param context The context of the call
     */
    data class Login(var email: String, var password: String, var context: Context) : ApiRoute(context)

    /**
     * Data class for [Register] route
     *
     * @param email The email of the user
     * @param password The password of the user
     * @param context The context of the call
     */
    data class Register(var email: String, var password: String, var redirectUrl: String, var context: Context) : ApiRoute(context)

    /**
     * Data class for [OAuth2] route
     *
     * @param service The required service ("google" or "twitter"
     * @param redirectUrl The url where the OAuth service should redirect the user
     * @param context The context of the call
     */
    data class OAuth2(var service: String, var redirectUrl: String, var context: Context) : ApiRoute(context)

    /**
     * Data class for [DataCode] route
     *
     * @param code The code brought by the OAuth service
     * @param context The context of the call
     */
    data class DataCode(var code: String, var context: Context) : ApiRoute(context)

    /**
     * Data class for [Validate] route
     *
     * @param token The validation token
     * @param context The context of the call
     */
    data class Validate(var token: String, var context: Context) : ApiRoute(context)

    /**
     * Data class for [Activate2fa] route
     *
     * @param context The context of the call
     */
    data class Activate2fa(var context: Context) : ApiRoute(context)

    /**
     * Data class for [Confirm2fa] route
     *
     * @param token The validation token
     * @param context The context of the call
     */
    data class Confirm2fa(var token: String, var context: Context) : ApiRoute(context)

    /**
     * Data class for [Validate2fa]
     *
     * @param token The validation token
     * @param context The context of the call
     */
    data class Validate2fa(var token: String, var context: Context) : ApiRoute(context)

    /**
     * Data class for [ReadinessProbe] route
     *
     * @param context The context of the call
     */
    data class ReadinessProbe(var context: Context) : ApiRoute(context)

    /**
     * Data class for [GetUser] route
     *
     * @param context The context of the call
     */
    data class GetUser(var context: Context) : ApiRoute(context)

    /**
     * Timeout of the api call
     */
    val timeout: Int

        /**
         * Return the timeout
         *
         * @return The timeout in milliseconds
         */
        get() {
            return 3000
        }

    /**
     * Base url of the api
     */
    private val baseUrl: String

        /**
         * Return the url of the api
         *
         * @return The url stored in local storage if it exists, else the API_HOST environment variable or a hardcoded url
         */
        get() {
            val sharedPreferences = mainContext.getSharedPreferences("com.b12powered.area", Context.MODE_PRIVATE)
            return if (sharedPreferences.contains("api_url")) {
                    sharedPreferences.getString("api_url", null)!!
                } else {
                    System.getenv("API_HOST") ?: "https://dev.api.area.b12powered.com"
                }
        }

    /**
     * Custom url for request
     */
    val url: String

        /**
         * Return an url, depending on the api call
         *
         * @return A string formatted concatenation of [baseUrl] and the request related route
         */
        get() {
            return "$baseUrl/${when (this@ApiRoute) {
                is Login -> "users/login"
                is Register -> "users/register"
                is OAuth2 -> "users/serviceLogin/${service}"
                is DataCode -> "data-code/${code}"
                is Validate -> "users/validate"
                is Activate2fa -> "users/2fa/activate"
                is Confirm2fa -> "users/2fa/activate"
                is Validate2fa -> "users/2fa/validate"
                is ReadinessProbe -> "readinessProbe"
                is GetUser -> "users/me"
                else -> ""
            }}"
        }

    /**
     * Request method
     */
    val httpMethod: Int

        /**
         * Return the request method, depending on the api call
         *
         * @return An int representing request method
         */
        get() {
            return when (this) {
                is Login -> Request.Method.POST
                is Register -> Request.Method.POST
                is Validate -> Request.Method.PATCH
                is Activate2fa -> Request.Method.POST
                is Confirm2fa -> Request.Method.PATCH
                is Validate2fa -> Request.Method.POST
                else -> Request.Method.GET
            }
        }

    /**
     * Request body
     */
    val body: HashMap<String, String>

        /**
         * Return request's parameters
         *
         * @return A hashmap of pairs of key/value
         */
        get() {
            return when (this) {
                is Login -> {
                    hashMapOf(Pair("email", email), Pair("password", password))
                }
                is Register -> {
                    hashMapOf(Pair("email", email), Pair("password", password))
                }
                is Confirm2fa -> {
                    hashMapOf(Pair("token", this.token))
                }
                is Validate2fa -> {
                    hashMapOf(Pair("token", this.token))
                }
                else -> hashMapOf()
            }
        }

    /**
     * Query parameters
     */
    val params: HashMap<String, String>

        /**
         * Return request's query parameters
         *
         * @return A hashmap of pairs of key/value
         */
        get() {
            return when (this) {
                is Register -> {
                    hashMapOf(Pair("redirectURL", redirectUrl))
                }
                is OAuth2 -> {
                    hashMapOf(Pair("redirectURL", redirectUrl))
                }
                is Validate -> {
                    hashMapOf(Pair("token", token))
                }
                else -> hashMapOf()
            }
        }

    /**
     * Request's header
     */
    val headers: HashMap<String, String>

        /**
         * Return request's header
         *
         * @return A hashmap of pairs of key/value
         */
        get() {
            val map: HashMap<String, String> = hashMapOf()
            val sharedPreferences = mainContext.getSharedPreferences("com.b12powered.area", Context.MODE_PRIVATE)
            val token = sharedPreferences.getString("jwt-token", null)
            map["Accept"] = "application/json"
            return when (this) {
                is Activate2fa -> {
                    hashMapOf(Pair("Authorization", "Bearer $token"))
                }
                is Confirm2fa -> {
                    hashMapOf(Pair("Authorization", "Bearer $token"))
                }
                is Validate2fa -> {
                    hashMapOf(Pair("Authorization", "Bearer $token"))
                }
                is GetUser -> {
                    hashMapOf(Pair("Authorization", "Bearer $token"))
                }
                else -> hashMapOf()
            }
        }
}