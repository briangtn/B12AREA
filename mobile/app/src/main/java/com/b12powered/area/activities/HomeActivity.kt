package com.b12powered.area.activities

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.auth0.android.jwt.JWT
import com.b12powered.area.R
import com.b12powered.area.User
import com.b12powered.area.api.ApiClient
import com.b12powered.area.toObject
import java.util.*

/**
 * The activity where the user can have all services
 *
 * This class show the home page of the user connected
 */
class HomeActivity : AppCompatActivity() {

    private lateinit var handler: Handler
    private lateinit var currentUser: User

    /**
     * Override method onCreate
     *
     * Perform an api call on /me to get current user. If the call failed, redirect to Login Page
     */
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_home)

        val data: Uri? = intent?.data

        if (data !== null) {
            val code: String? = data.getQueryParameter("code")
            if (code !== null) {
                ApiClient(this)
                    .dataCode(code) { user, message ->
                        if (user !== null) {
                            val sharedPreferences = getSharedPreferences(getString(R.string.storage_name), Context.MODE_PRIVATE)
                            val editor = sharedPreferences.edit()

                            editor.putString(getString(R.string.token_key), user.toObject<User>().token)
                            editor.apply()
                            checkTokenValidity()
                        } else {
                            Toast.makeText(
                                this,
                                message,
                                Toast.LENGTH_SHORT
                            ).show()
                        }
                    }
            }
        } else {
            checkTokenValidity()
        }

        handler = Handler(Looper.getMainLooper())

        handler.post(object : Runnable {
            override fun run() {
                val sharedPreferences = getSharedPreferences(getString(R.string.storage_name), Context.MODE_PRIVATE)

                if (!sharedPreferences.contains(getString(R.string.token_key))) {
                    return
                }

                val token = sharedPreferences.getString(getString(R.string.token_key), null)
                val jwt = JWT(token!!)
                val expirationDate = jwt.expiresAt

                if (expirationDate!!.time - Date().time < 60000) {
                    ApiClient(this@HomeActivity)
                        .refreshToken { newToken, _ ->
                            if (newToken !== null) {
                                val editor = sharedPreferences.edit()

                                editor.putString(getString(R.string.token_key), newToken)
                                editor.apply()
                            }
                        }
                }
                handler.postDelayed(this, 60000)
            }
        })
    }

    private fun checkTokenValidity() {

        ApiClient(this)
            .getUser { user, message ->
                if (user != null) {
                    currentUser = user
                } else {
                    Toast.makeText(
                        this,
                        message,
                        Toast.LENGTH_SHORT
                    ).show()

                    val sharedPreferences = getSharedPreferences(getString(R.string.storage_name), Context.MODE_PRIVATE)
                    val editor = sharedPreferences.edit()

                    editor.remove(getString(R.string.token_key))
                    editor.apply()

                    val intent = Intent(this, LoginActivity::class.java)
                    finish()
                    startActivity(intent)
                }
            }
    }

}
