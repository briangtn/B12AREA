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
import com.b12powered.area.R
import com.b12powered.area.api.ApiClient
import kotlinx.android.synthetic.main.activity_login.*

class PasswordActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_password)

        val token: String = intent!!.data!!.getQueryParameter("token")!!

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
