package com.b12powered.area.api

object AreaAPI {
    private var access_token = ""
    val endpoints = HashMap<String, String>()
    val host = System.getenv("API_HOST") ?: "api.area.b12powered.com"

    init {
        endpoints["Register"] = "/users/register"
    }
}