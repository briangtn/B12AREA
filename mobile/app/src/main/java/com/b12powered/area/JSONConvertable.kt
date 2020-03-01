package com.b12powered.area

import com.google.gson.Gson
import com.google.gson.annotations.SerializedName
import com.google.gson.internal.LinkedTreeMap
import org.json.JSONObject

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

data class Status(
    @SerializedName("status") val status: String
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

data class ActionReaction(
    @SerializedName("name") val name: String,
    @SerializedName("displayName") val displayName: String,
    @SerializedName("description") val description: String,
    @SerializedName("configSchema") val configSchema: List<ConfigSchema>,
    @SerializedName("placeholders") val placeholders: List<PlaceHolder>
) : JSONConvertable

data class Service(
    @SerializedName("name") val name: String,
    @SerializedName("displayName") val displayName: String,
    @SerializedName("description") val description: String,
    @SerializedName("icon") val icon: String,
    @SerializedName("color") val color: String,
    @SerializedName("actions") val actions: List<ActionReaction>,
    @SerializedName("reactions") val reactions: List<ActionReaction>
) : JSONConvertable

data class Server(
    @SerializedName("current_time") val currentTime: Any,
    @SerializedName("services") val services: List<Service>
) : JSONConvertable

data class Area(
    @SerializedName("id") val id: String,
    @SerializedName("name") val name: String,
    @SerializedName("enabled") val enabled: Boolean,
    @SerializedName("ownerId") val ownerId: String,
    @SerializedName("data") val data: Any
) : JSONConvertable

data class ActionDetails(
    @SerializedName("id") val id : String,
    @SerializedName("serviceAction") val serviceAction : String,
    @SerializedName("areaId") val areaId : String,
    @SerializedName("options") val options : HashMap<String, Any>,
    @SerializedName("data") val data : Any
) : JSONConvertable

data class ReactionDetails(
    @SerializedName("id") val id : String,
    @SerializedName("serviceReaction") val serviceReaction : String,
    @SerializedName("areaId") val areaId : String,
    @SerializedName("options") val options : HashMap<String, Any>
) : JSONConvertable

data class Areas(
    @SerializedName("id") val id: String,
    @SerializedName("name") val name: String,
    @SerializedName("enabled") val enabled: Boolean,
    @SerializedName("ownerId") val ownerId: String,
    @SerializedName("data") val data: Any,
    @SerializedName("reactions") val reactions: List<ReactionDetails>,
    @SerializedName("action") val actions: ActionDetails
) : JSONConvertable

data class About(
    @SerializedName("client") val client: Client,
    @SerializedName("server") val server: Server
) : JSONConvertable
