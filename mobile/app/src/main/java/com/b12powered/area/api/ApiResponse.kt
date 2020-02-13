package com.b12powered.area.api

import org.json.JSONObject
import java.lang.Exception

/**
 * The class handling api responses and parse it to json object or return an error message if the response returned an error
 *
 * @param response The api response, string formatted
 */
class ApiResponse(response: String) {

    var success: Boolean = false
    var message: String = ""
    var json: String = ""

    init {
        try {
            val jsonResponse = JSONObject(response)

            if (jsonResponse.has("error")) {
                message = jsonResponse.getJSONObject("error").getString("message")
                success = false
            } else {
                json = jsonResponse.toString()
                success = true
            }
        } catch (e: Exception) {
            if (response == "true") {
                success = true
            } else {
                e.printStackTrace()
            }
        }
    }
}