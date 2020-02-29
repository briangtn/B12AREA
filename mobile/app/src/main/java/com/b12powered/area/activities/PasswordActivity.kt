package com.b12powered.area.activities

import android.content.Context
import android.content.Intent
import androidx.appcompat.app.AppCompatActivity
import android.os.Bundle
import android.view.KeyEvent
import android.view.View
import android.view.inputmethod.InputMethodManager
import android.widget.Button
import android.widget.EditText
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import com.b12powered.area.R
import com.b12powered.area.api.ApiClient

/**
 * The activity where the user is redirected when clicking on the link in the reset password email
 *
 * Ths class check and parse new user's password and request the api for a password change
 */
class PasswordActivity : AppCompatActivity() {

    /**
     * Override method onCreate
     *
     * Set listeners to view's buttons and input fields
     */
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_password)

        val apiUrl: String = intent!!.data!!.getQueryParameter("api_url")!!
        val token: String = intent!!.data!!.getQueryParameter("token")!!

        if (apiUrl !== getCurrentApiUrl()) {
            val sharedPreferences = getSharedPreferences(getString(R.string.storage_name), Context.MODE_PRIVATE)
            val editor = sharedPreferences.edit()

            editor.putString(getString(R.string.api_url_key), apiUrl)
            editor.apply()
        }

        val btnValidationPassword = findViewById<Button>(R.id.validation_password_button)

        val etPassword = findViewById<EditText>(R.id.confirm_new_password)

        etPassword.setOnKeyListener(View.OnKeyListener { _, keyCode, event ->
            if (keyCode == KeyEvent.KEYCODE_ENTER && event.action == KeyEvent.ACTION_UP) {
                val inputMethodManager =
                    getSystemService(Context.INPUT_METHOD_SERVICE) as InputMethodManager
                inputMethodManager.hideSoftInputFromWindow(currentFocus!!.windowToken, 0)

                submitValidationPassword(token)
                return@OnKeyListener true
            }
            return@OnKeyListener false
        })

        btnValidationPassword.setOnClickListener {
            submitValidationPassword(token)
        }

        onBackPressedDispatcher.addCallback(object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                val intent = Intent(this@PasswordActivity, LoginActivity::class.java)
                finish()
                startActivity(intent)
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
            System.getenv("API_HOST") ?: "https://dev.api.area.b12powered.com"
        }

    }

    /**
     * Check password parameters validity. Call [changePassword] method if parameters are valid, reset input fields if they are not
     */
    private fun submitValidationPassword(token: String) {
        val etPassword = findViewById<EditText>(R.id.new_password)
        val etConfirmPassword = findViewById<EditText>(R.id.confirm_new_password)

        val password = etPassword.text
        val confirmPassword = etConfirmPassword.text

        etPassword.clearFocus()
        etConfirmPassword.clearFocus()

        etPassword.error = null
        etConfirmPassword.error = null

        when {
            password.isEmpty() -> etPassword.error = getString(R.string.no_password)
            confirmPassword.isEmpty() -> etConfirmPassword.error = getString(R.string.no_password)
            password.toString() != confirmPassword.toString() -> {
                etConfirmPassword.setText("")
                etConfirmPassword.error = getString(R.string.different_password)
            }
        }
        if (password.isNotEmpty() && confirmPassword.isNotEmpty() && password.toString() == confirmPassword.toString()) {
            changePassword(token, password.toString())
        }
    }

    /**
     * Make a reset password request to api, using [token] and [password]. If the call is successful, redirect the user to the confirmation page, if not display a toast with the error
     */
    private fun changePassword(token: String, password: String) {
        ApiClient(this)
            .resetPassword(token, password) { user, message ->
                if (user != null) {
                    val intent = Intent(this, PasswordValidationActivity::class.java)
                    finish()
                    startActivity(intent)
                } else {
                    Toast.makeText(
                        this,
                        message,
                        Toast.LENGTH_SHORT
                    ).show()
                }
            }
    }

}
