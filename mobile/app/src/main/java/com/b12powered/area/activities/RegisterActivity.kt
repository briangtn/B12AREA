package com.b12powered.area.activities

import android.app.AlertDialog
import android.content.Context
import android.content.DialogInterface
import android.content.Intent
import androidx.appcompat.app.AppCompatActivity
import android.os.Bundle
import android.view.KeyEvent
import android.view.View
import android.view.inputmethod.InputMethodManager
import android.widget.EditText
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import com.b12powered.area.R
import com.b12powered.area.api.ApiClient
import com.b12powered.area.fragments.SettingsFragment
import kotlinx.android.synthetic.main.activity_register.*


/**
 * The activity where the user can register to application
 *
 * This class check and parse registration parameters and request the api for register
 */
class RegisterActivity : AppCompatActivity() {

    /**
     * Override method onCreate
     *
     * Set listeners to view's buttons and input fields
     */
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_register)

        val sharedPreferences = getSharedPreferences(getString(R.string.storage_name), Context.MODE_PRIVATE)

        if (sharedPreferences.contains(getString(R.string.token_key))) {
            val intent = Intent(this, HomeActivity::class.java)
            finish()
            startActivity(intent)
        } else if (sharedPreferences.contains(getString(R.string.already_visited))) {
            val intent = Intent(this, LoginActivity::class.java)
            finish()
            startActivity(intent)
        }

        val editor = sharedPreferences.edit()
        editor.putBoolean(getString(R.string.already_visited), true)
        editor.apply()

        val etConfirmPassword = findViewById<EditText>(R.id.confirm_password)

        etConfirmPassword.setOnKeyListener(View.OnKeyListener { _, keyCode, event ->
            if (keyCode == KeyEvent.KEYCODE_ENTER && event.action == KeyEvent.ACTION_UP) {
                submitForm()
                return@OnKeyListener true
            }
            return@OnKeyListener false
        })

        settings_button.setOnClickListener {
            val fragment = SettingsFragment()
            fragment.show(supportFragmentManager, "settings")
        }

        register_button.setOnClickListener {
            submitForm()
        }

        go_to_login_button.setOnClickListener {
            val intent = Intent(this, LoginActivity::class.java)
            finish()
            startActivity(intent)
        }

        google_button.setOnClickListener {
            oauth("google")
        }

        twitter_button.setOnClickListener {
            oauth("twitter")
        }

        onBackPressedDispatcher.addCallback(object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                showDialog()
            }
        })
    }

    /**
     * Check register parameters validity. Call [register] method if parameters are valid, reset input fields if they are not
     */
    private fun submitForm() {
        val inputMethodManager = getSystemService(Context.INPUT_METHOD_SERVICE) as InputMethodManager
        inputMethodManager.hideSoftInputFromWindow(currentFocus!!.windowToken, 0)

        val etEmail = findViewById<EditText>(R.id.email)
        val etPassword = findViewById<EditText>(R.id.password)
        val etConfirmPassword = findViewById<EditText>(R.id.confirm_password)

        val email = etEmail.text
        val password = etPassword.text
        val confirmPassword = etConfirmPassword.text

        etEmail.clearFocus()
        etPassword.clearFocus()
        etConfirmPassword.clearFocus()

        etEmail.error = null
        etPassword.error = null
        etConfirmPassword.error = null

        if (email.isEmpty()) {
            etEmail.error = getString(R.string.no_email)
        }
        when {
            password.isEmpty() -> etPassword.error = getString(R.string.no_password)
            confirmPassword.isEmpty() -> etConfirmPassword.error = getString(R.string.no_confirm_password)
            password.toString() != confirmPassword.toString() -> {
                etConfirmPassword.setText("")
                etConfirmPassword.error = getString(R.string.different_password)
            }
        }
        if (email.isNotEmpty() && password.isNotEmpty() && confirmPassword.isNotEmpty() && password.toString() == confirmPassword.toString()) {
            register(email.toString(), password.toString())
        }
    }

    /**
     * Make a register request to api, using [email] and [password]. If the call is successful, redirect the user to the confirmation page, if not display a toast with the error
     */
    private fun register(email: String, password: String) {
        val sharedPreferences = getSharedPreferences(getString(R.string.storage_name), Context.MODE_PRIVATE)
        val apiUrl = if (sharedPreferences.contains(getString(R.string.api_url_key))) {
            sharedPreferences.getString(getString(R.string.api_url_key), null)!!
        } else {
            System.getenv("API_HOST") ?: "https://dev.api.area.b12powered.com"
        }

        ApiClient(this)
            .register(email, password, "https://" + (System.getenv("HOST") ?: "dev.area.b12powered.com") + "/email_validation?api_url=$apiUrl") { user, message ->
                if (user != null) {
                    val intent = Intent(this, RegistrationValidationActivity::class.java)
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

    /**
     * Show a dialog asking the user if they want to exit the application
     */
    private fun showDialog() {
        val builder = AlertDialog.Builder(this)
        val dialogClickListener = DialogInterface.OnClickListener { dialog, which ->
            when(which) {
                DialogInterface.BUTTON_POSITIVE -> finishAffinity()
                DialogInterface.BUTTON_NEGATIVE -> dialog.dismiss()
            }
        }
        builder
            .setTitle(getString(R.string.exit_app))
            .setPositiveButton(getString(R.string.yes), dialogClickListener)
            .setNegativeButton(getString(R.string.no), dialogClickListener)
            .create()
            .show()
    }
}
