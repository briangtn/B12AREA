package com.b12powered.area.activities

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.util.Log
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import com.b12powered.area.BuildConfig
import com.b12powered.area.R
import com.b12powered.area.api.ApiClient
import kotlinx.android.synthetic.main.activity_register.*

/**
 * The activity where the user is redirected when clicking on the link in the validation email
 *
 * This class has no logic since it's only implemented for its visual interface
 */
class EmailValidationActivity : AppCompatActivity() {

    /**
     * Override method onCreate
     *
     * Check token validity and set a listener redirecting to login view
     */
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_email_validation)

        val apiUrl: String = intent!!.data!!.getQueryParameter("api_url")!!
        val token: String = intent!!.data!!.getQueryParameter("token")!!

        if (apiUrl !== getCurrentApiUrl()) {
            val sharedPreferences = getSharedPreferences(getString(R.string.storage_name), Context.MODE_PRIVATE)
            val editor = sharedPreferences.edit()

            editor.putString(getString(R.string.api_url_key), apiUrl)
            editor.apply()
        }

        ApiClient(this).validate(token) {}

        go_to_login_button.setOnClickListener {
            goToLoginPage()
        }

        onBackPressedDispatcher.addCallback(object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                goToLoginPage()
            }
        })
    }

    /**
     * Get the api url currently stored in local storage or its default value
     *
     * @return The api url
     */
    private fun getCurrentApiUrl() : String {
        val sharedPreferences = getSharedPreferences(getString(R.string.storage_name), Context.MODE_PRIVATE)
        return if (sharedPreferences.contains(getString(R.string.api_url_key))) {
            sharedPreferences.getString(getString(R.string.api_url_key), null)!!
        } else {
            BuildConfig.API_HOST
        }

    }

    /**
     * Go back to login page
     */
    private fun goToLoginPage() {
        val intent = Intent(this, LoginActivity::class.java)
        finish()
        startActivity(intent)
    }
}