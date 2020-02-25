package com.b12powered.area

import com.google.gson.Gson
import com.google.gson.annotations.SerializedName

interface JSONConvertable {
    fun toJSON(): String = Gson().toJson(this)
}

inline fun <reified T: JSONConvertable> String.toObject(): T = Gson().fromJson(this, T::class.java)

data class User(
    @SerializedName("id") val id: String,
    @SerializedName("email") val email: String,
    @SerializedName("password") val password: String,
    @SerializedName("token") val token: String,
    @SerializedName("role") val role: List<String>,
    @SerializedName("servicesList") val services: List<String>,
    @SerializedName("require2fa") val require2fa: Boolean,
    @SerializedName("twoFactorAuthenticationEnabled") val twoFactorAuthenticationEnabled: Boolean
) : JSONConvertable

data class Client(
    @SerializedName("host") val host: String
) : JSONConvertable

data class ConfigSchema(
    @SerializedName("name") val name: String,
    @SerializedName("description") val description: String,
    @SerializedName("type") val type: String,
    @SerializedName("required") val required: Boolean
) : JSONConvertable

data class PlaceHolder(
    @SerializedName("name") val name: String,
    @SerializedName("description") val description: String
) : JSONConvertable

data class Action(
    @SerializedName("name") val name: String,
    @SerializedName("description") val description: String,
    @SerializedName("configSchema") val configSchema: List<ConfigSchema>,
    @SerializedName("placeholders") val placeholders: List<PlaceHolder>
) : JSONConvertable

data class Reaction(
    @SerializedName("name") val name: String,
    @SerializedName("description") val description: String,
    @SerializedName("configSchema") val configSchema: List<ConfigSchema>
) : JSONConvertable

data class Service(
    @SerializedName("name") val name: String,
    @SerializedName("description") val description: String,
    @SerializedName("icon") val icon: String,
    @SerializedName("color") val color: String,
    @SerializedName("actions") val actions: List<Action>,
    @SerializedName("reaction") val reactions: List<Reaction>
) : JSONConvertable

data class Server(
    @SerializedName("current_time") val currentTime: Any,
    @SerializedName("services") val services: List<Service>
) : JSONConvertable

data class About(
    @SerializedName("client") val client: Client,
    @SerializedName("server") val server: Server
) : JSONConvertable
