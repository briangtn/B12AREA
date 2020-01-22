package com.b12powered.area.api

import android.content.Context
import com.android.volley.Request

sealed class ApiRoute {

    data class Login(var email: String, var password: String, var context: Context) : ApiRoute()
    data class Register(var email: String, var password: String, var context: Context) : ApiRoute()

    val timeout: Int
        get() {
            return 3000
        }

    private val baseUrl: String
        get() {
            return System.getenv("API_HOST") ?: "https://dev.api.area.b12powered.com"
        }

    val url: String
        get() {
            return "$baseUrl/${when (this@ApiRoute) {
                is Login -> "users/login"
                is Register -> "users/register"
                else -> ""
            }}"
        }

    val httpMethod: Int
        get() {
            return when (this) {
                is Login -> Request.Method.POST
                is Register -> Request.Method.POST
                else -> Request.Method.GET
            }
        }

    val params: HashMap<String, String>
        get() {
            return when (this) {
                is Login -> {
                    hashMapOf(Pair("email", this.email), Pair("password", this.password))
                }
                is Register -> {
                    hashMapOf(Pair("email", this.email), Pair("password", this.email))
                }
                else -> hashMapOf()
            }
        }

    val headers: HashMap<String, String>
        get() {
            val map: HashMap<String, String> = hashMapOf()
            map["Accept"] = "application/json"
            return when (this) {
                else -> hashMapOf()
            }
        }
}