package com.b12powered.area.api

import android.content.Context
import android.net.Uri
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

/**
 * The class handling calls
 *
 * @param context The context from where the call has been made. Required by volley to perform api calls
 */
class ApiClient(private val context: Context) {

    /**
     * Build a volley request using [route] and add it to a request queue, then invoke [completion] with call response
     */
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
            /**
             * Override method getBody
             *
             * Get a hashmap of parameters and convert it to byte array to make it usable for volley
             */
            override fun getBody(): ByteArray {
                val jsonString = Gson().toJson(route.body)
                return jsonString.toByteArray()
            }

            /**
             * Override method getHeaders
             *
             * Get the corresponding custom header for current request
             */
            override fun getHeaders(): MutableMap<String, String> {
                return route.headers
            }

            /**
             * Override method getBodyContentType
             *
             * Set the content type to "application/json"
             */
            override fun getBodyContentType(): String {
                return "application/json"
            }
        }
        request.retryPolicy = DefaultRetryPolicy(route.timeout, DefaultRetryPolicy.DEFAULT_MAX_RETRIES, DefaultRetryPolicy.DEFAULT_BACKOFF_MULT)
        request.setShouldCache(false)
        getRequestQueue().add(request)
    }

    /**
     * Build an ApiResponse instance from [response] then use it to invoke [completion]
     */
    private fun handle(response: String, completion: (success: Boolean, apiResponse: ApiResponse) -> Unit) {
        val ar = ApiResponse(response)
        completion.invoke(ar.success, ar)
    }

    /**
     * Get custom error message from [volleyError]
     *
     * @return A custom error message of type String
     */
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

    /**
     * Get query parameters from [route] and concatenate them in order to append it to the request's url
     *
     * @return A formatted string containing every query parameter
     */
    private fun getQueryParams(route: ApiRoute): String {
        var query = "?"
        route.params.forEach { (key, value) -> query += "${key}=${value}&" }
        return query
    }

    /**
     * Get volley request queue from local cache and network
     *
     * @return The request queue used by the [performRequest] method
     */
    private fun getRequestQueue(): RequestQueue {
        val maxCacheSize = 20 * 1024 * 1024
        val cache = DiskBasedCache(context.cacheDir, maxCacheSize)
        val network = BasicNetwork(HurlStack())
        val requestQueue = RequestQueue(cache, network)
        requestQueue.start()
        System.setProperty("http.keepAlive", "false")
        return requestQueue
    }

    /**
     * Build a login request with [email] and [password] and perform it, then invoke [completion] with a User object
     */
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

    /**
     * Build a register request with [email] and [password] and perform it, then invoke [completion] with a User object
     */
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

    /**
     * Build a oauth request with [service] name and perform it, then invoke [completion] with a Uri object
     */
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

    /**
     * Build a dataCode request with [code] and perform it, then invoke [completion] with a User object
     */
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

    /**
     * Build an account validation request with [token] and perform it, then invoke [completion] with the response's message
     */
    fun validate(token: String, completion: (message: String) -> Unit) {
        val route = ApiRoute.Validate(token, context)
        this.performRequest(route) { _, response ->
            completion.invoke(response.message)
        }
    }

    /**
     * Build a two factor authentication activation request taking no parameter and perform it, then invoke [completion] with an url used by authenticator
     */
    fun activate2fa(completion: (url: String?, message: String) -> Unit) {
        val route = ApiRoute.Activate2fa(context)
        this.performRequest(route) { success, response ->
            if (success) {
                val url = JSONObject(response.json).getString("otpauthUrl")
                completion.invoke(url, "success")
            } else {
                completion.invoke(null, response.message)
            }
        }
    }

    /**
     * Build a two factor authentication confirmation request with [token] and perform it, then invoke [completion] with a User object
     */
    fun confirm2fa(token: String, completion: (user: User?, message: String) -> Unit) {
        val route = ApiRoute.Confirm2fa(token, context)
        this.performRequest(route) { success, response ->
            if (success) {
                val user: User = response.json.toObject()
                completion.invoke(user, "success")
            } else {
                completion.invoke(null, response.message)
            }
        }
    }

    /**
     * Build an two factor authentication validation request with [token] and perform it, then invoke [completion] with a User object
     */
    fun validate2fa(token: String, completion: (user: User?, message: String) -> Unit) {
        val route = ApiRoute.Validate2fa(token, context)
        this.performRequest(route) { success, response ->
            if (success) {
                val user: User = response.json.toObject()
                completion.invoke(user, "success")
            } else {
                completion.invoke(null, response.message)
            }
        }
    }

    /**
     * Build a readinessProbe request taking no parameter and perform it, then invoke [completion] with a boolean corresponding to the result of the call
     */
    fun readinessProbe(completion: (isUp: Boolean) -> Unit) {
        val route = ApiRoute.ReadinessProbe(context)
        this.performRequest(route) { success, _ ->
            completion.invoke(success)
        }
    }

    /**
     * Build a getUser request taking no parameter and perform it, then invoke [completion] with a User object
     */
    fun getUser(completion: (user: User?, message: String) -> Unit) {
        val route = ApiRoute.GetUser(context)
        this.performRequest(route) { success, response ->
            if (success) {
                val user: User = response.json.toObject()
                completion.invoke(user, "success")
            } else {
                completion.invoke(null, response.message)
            }
        }
    }
}