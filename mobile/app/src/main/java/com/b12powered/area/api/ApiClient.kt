package com.b12powered.area.api

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.util.Log
import androidx.core.net.toUri
import com.android.volley.*
import com.android.volley.toolbox.BasicNetwork
import com.android.volley.toolbox.DiskBasedCache
import com.android.volley.toolbox.HurlStack
import com.android.volley.toolbox.StringRequest
import com.b12powered.area.User
import com.b12powered.area.toObject
import com.google.gson.Gson
import org.json.JSONObject

class ApiClient(private val context: Context) {

    private fun performRequest(route: ApiRoute, completion: (success: Boolean, apiResponse: ApiResponse) -> Unit) {
        val request: StringRequest = object : StringRequest(route.httpMethod, route.url + getQueryParams(route), { response ->
            this.handle(response, completion)
        }, {
            it.printStackTrace()
            if (it.networkResponse != null && it.networkResponse.data != null) {
                this.handle(String(it.networkResponse.data), completion)
            } else {
                this.handle(getStringError(it), completion)
            }
        }) {
            override fun getBody(): ByteArray {
                val jsonString = Gson().toJson(route.body)
                return jsonString.toByteArray()
            }

            override fun getHeaders(): MutableMap<String, String> {
                return route.headers
            }

            override fun getBodyContentType(): String {
                return "application/json"
            }
        }
        request.retryPolicy = DefaultRetryPolicy(route.timeout, DefaultRetryPolicy.DEFAULT_MAX_RETRIES, DefaultRetryPolicy.DEFAULT_BACKOFF_MULT)
        request.setShouldCache(false)
        getRequestQueue().add(request)
    }

    private fun handle(response: String, completion: (success: Boolean, apiResponse: ApiResponse) -> Unit) {
        val ar = ApiResponse(response)
        completion.invoke(ar.success, ar)
    }

    private fun getStringError(volleyError: VolleyError): String {
        return when (volleyError) {
            is TimeoutError -> "The connection timed out."
            is NoConnectionError -> "The connection couldn't be established."
            is AuthFailureError -> "There was an authentication failure in your request."
            is ServerError -> "Error while processing the server response."
            is NetworkError -> "Network error, please verify your connection."
            is ParseError -> "Error while parsing the server response."
            else -> "Internet error."
        }
    }

    private fun getQueryParams(route: ApiRoute): String {
        var query = "?"
        route.params.forEach { (key, value) -> query += "${key}=${value}&" }
        return query
    }

    private fun getRequestQueue(): RequestQueue {
        val maxCacheSize = 20 * 1024 * 1024
        val cache = DiskBasedCache(context.cacheDir, maxCacheSize)
        val network = BasicNetwork(HurlStack())
        val requestQueue = RequestQueue(cache, network)
        requestQueue.start()
        System.setProperty("http.keepAlive", "false")
        return requestQueue
    }

    fun login(email: String, password: String, completion: (user: User?, message: String) -> Unit) {
        val route = ApiRoute.Login(email, password, context)
        this.performRequest(route) { success, response ->
            if (success) {
                val user: User = response.json.toObject()
                completion.invoke(user, "success")
            } else {
                completion.invoke(null, response.message)
            }
        }
    }

    fun register(email: String, password: String, redirectUrl: String, completion: (user: User?, message: String) -> Unit) {
        val route = ApiRoute.Register(email, password, redirectUrl, context)
        this.performRequest(route) { success, response ->
            if (success) {
                val user: User = response.json.toObject()
                completion.invoke(user, "success")
            } else {
                completion.invoke(null, response.message)
            }
        }
    }

    fun oauth2(service: String, redirectUrl: String, completion: (uri: Uri?, message: String) -> Unit) {
        val route = ApiRoute.OAuth2(service, redirectUrl, context)
        this.performRequest(route) { success, response ->
            if (success) {
                completion.invoke(JSONObject(response.json).getString("url").toUri(), "success")
            } else {
                completion.invoke(null, response.message)
            }
        }
    }

    fun dataCode(code: String, completion: (user: User?, message: String) -> Unit) {
        val route = ApiRoute.DataCode(code, context)
        this.performRequest(route) { success, response ->
            if (success) {
                val user: User = response.json.toObject()
                completion.invoke(user, "success")
            } else {
                completion.invoke(null, response.message)
            }
        }
    }

    fun validate(token: String, completion: (message: String) -> Unit) {
        val route = ApiRoute.Validate(token, context)
        this.performRequest(route) { _, response ->
            completion.invoke(response.message)
        }
    }

    fun readinessProbe(completion: (isUp: Boolean) -> Unit) {
        val route = ApiRoute.ReadinessProbe(context)
        this.performRequest(route) { success, _ ->
            completion.invoke(success)
        }
    }
}