package com.b12powered.area.api

import android.content.Context
import android.content.SharedPreferences
import android.util.Log
import com.android.volley.Request

sealed class ApiRoute(var mainContext: Context) {

    data class Login(var email: String, var password: String, var context: Context) : ApiRoute(context)
    data class Register(var email: String, var password: String, var redirectUrl: String, var context: Context) : ApiRoute(context)
    data class Validate(var token: String, var context: Context) : ApiRoute(context)
    data class Activate2fa(var context: Context) : ApiRoute(context)
    data class Confirm2fa(var token: String, var context: Context) : ApiRoute(context)
    data class Validate2fa(var token: String, var context: Context) : ApiRoute(context)
    data class ReadinessProbe(var context: Context) : ApiRoute(context)

    val timeout: Int
        get() {
            return 3000
        }

    private val baseUrl: String
        get() {
            val sharedPreferences = mainContext.getSharedPreferences("com.b12powered.area", Context.MODE_PRIVATE)
            return if (sharedPreferences.contains("api_url")) {
                    sharedPreferences.getString("api_url", null)!!
                } else {
                    System.getenv("API_HOST") ?: "https://dev.api.area.b12powered.com"
                }
        }

    val url: String
        get() {
            return "$baseUrl/${when (this@ApiRoute) {
                is Login -> "users/login"
                is Register -> "users/register"
                is Validate -> "users/validate"
                is Activate2fa -> "users/2fa/activate"
                is Confirm2fa -> "users/2fa/activate"
                is Validate2fa -> "users/2fa/validate"
                is ReadinessProbe -> "readinessProbe"
                else -> ""
            }}"
        }

    val httpMethod: Int
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

    val body: HashMap<String, String>
        get() {
            return when (this) {
                is Login -> {
                    hashMapOf(Pair("email", this.email), Pair("password", this.password))
                }
                is Register -> {
                    hashMapOf(Pair("email", this.email), Pair("password", this.password))
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

    val params: HashMap<String, String>
        get() {
            return when (this) {
                is Register -> {
                    hashMapOf(Pair("redirectURL", this.redirectUrl))
                }
                is Validate -> {
                    hashMapOf(Pair("token", this.token))
                }
                else -> hashMapOf()
            }
        }

    val headers: HashMap<String, String>
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
                else -> hashMapOf()
            }
        }
}