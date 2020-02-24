package com.b12powered.area.activities

import android.content.Context
import android.content.Intent
import androidx.appcompat.app.AppCompatActivity
import android.os.Bundle
import android.view.KeyEvent
import android.view.View
import android.view.inputmethod.InputMethodManager
import android.widget.EditText
import android.widget.Toast
import com.b12powered.area.R
import com.b12powered.area.api.ApiClient
import com.b12powered.area.fragments.SettingsFragment
import kotlinx.android.synthetic.main.activity_login.*

/**
 * The activity where the user can login to application
 *
 * This class check and parse login parameters and request the api for login
 */
class LoginActivity : AppCompatActivity() {

    /**
     * Override method onCreate
     *
     * Set listeners to view's buttons and input fields
     */
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_login)

        val sharedPreferences = getSharedPreferences("com.b12powered.area", Context.MODE_PRIVATE)

        if (sharedPreferences.contains("jwt-token")) {
            val intent = Intent(this, HomeActivity::class.java)
            finish()
            startActivity(intent)
        }

        val etPassword = findViewById<EditText>(R.id.password)

        etPassword.setOnKeyListener(View.OnKeyListener { _, keyCode, event ->
            if (keyCode == KeyEvent.KEYCODE_ENTER && event.action == KeyEvent.ACTION_UP) {
                val inputMethodManager =
                    getSystemService(Context.INPUT_METHOD_SERVICE) as InputMethodManager
                inputMethodManager.hideSoftInputFromWindow(currentFocus!!.windowToken, 0)

                submitLogin()
                return@OnKeyListener true
            }
            return@OnKeyListener false
        })

        settings_button.setOnClickListener {
            val fragment = SettingsFragment()
            fragment.show(supportFragmentManager, "settings")
        }

        login_button.setOnClickListener {
            submitLogin()
        }

        go_to_register_button.setOnClickListener {
            val intent = Intent(this, RegisterActivity::class.java)
            finish()
            startActivity(intent)
        }

        forgot_password_button.setOnClickListener {
            val intent = Intent(this, ForgotPasswordActivity::class.java)
            finish()
            startActivity(intent)
        }

        google_button.setOnClickListener {
            oauth("google")
        }

        twitter_button.setOnClickListener {
            oauth("twitter")
        }

    }

    /**
     * Check login parameters validity. Call [login] method if parameters are valid, reset input fields if they are not
     */
    private fun submitLogin() {
        val etEmail = findViewById<EditText>(R.id.email)
        val etPassword = findViewById<EditText>(R.id.password)

        val email = etEmail.text
        val password = etPassword.text

        etEmail.clearFocus()
        etPassword.clearFocus()

        etEmail.error = null
        etPassword.error = null

        if (email.isEmpty()) {
            etEmail.error = getString(R.string.no_email)
        }
        if (password.isEmpty()) {
            etPassword.error = getString(R.string.no_password)
        }
        if (email.isNotEmpty() && password.isNotEmpty()) {
            login(email.toString(), password.toString())
        }
    }

    /**
     * Make a login request to api, using [email] and [password]. If the call is successful, redirect the user to the appropriate page, if not display a toast with the error
     */
    private fun login(email: String, password: String) {
        ApiClient(this)
            .login(email, password) { user, message ->
                if (user != null) {
                    val sharedPreferences = getSharedPreferences("com.b12powered.area", Context.MODE_PRIVATE)
                    val editor = sharedPreferences.edit()

                    editor.putString("jwt-token", user.token)
                    editor.apply()

                    if (user.require2fa) {
                        val intent = Intent(this, TwoFAActivity::class.java)
                        finish()
                        startActivity(intent)
                    } else {
                        val intent = Intent(this, HomeActivity::class.java)
                        finish()
                        startActivity(intent)
                    }
                } else {
                    Toast.makeText(
                        this,
                        message,
                        Toast.LENGTH_SHORT
                    ).show()
                }
            }
    }

    /**
     * Make a oauth request to api, using [service] name. If the call is successful, redirect the user to the service's oauth page, if not display a toast with the error
     */
    private fun oauth(service: String) {
        ApiClient(this)
            .oauth2(service, "area://home") { uri, message ->
                if (uri != null) {
                    val intent = Intent(Intent.ACTION_VIEW, uri)
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
