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
    @SerializedName("services") val services: List<String>,
    @SerializedName("require2fa") val require2fa: Boolean,
    @SerializedName("twoFactorAuthenticationEnabled") val twoFactorAuthenticationEnabled: Boolean) : JSONConvertable
