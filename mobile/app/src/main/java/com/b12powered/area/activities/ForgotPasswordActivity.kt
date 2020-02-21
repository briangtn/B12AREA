package com.b12powered.area.activities

import android.content.Intent
import android.os.Bundle
import android.widget.EditText
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.b12powered.area.R
import com.b12powered.area.api.ApiClient
import kotlinx.android.synthetic.main.activity_forgot_password.*

/**
 * The activity where the user enter their email to reset their password
 *
 * This class ask for user's email and request the api for reset password
 */
class ForgotPasswordActivity : AppCompatActivity() {

    /**
     * Override method onCreate
     *
     * Set listeners to view's buttons and input fields
     */
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_forgot_password)

        validation_email_button.setOnClickListener {
            submitEmail()
        }
    }

    /**
     * Check email validity. Call [resetPassword] method if it is valid, reset input field if it is not
     */
    private fun submitEmail() {
        val etEmail = findViewById<EditText>(R.id.email)

        val email = etEmail.text

        etEmail.clearFocus()

        etEmail.error = null

        if (email.isEmpty()) {
            etEmail.error = getString(R.string.no_email)
        } else {
            resetPassword(email.toString())
        }
    }

    /**
     * Make a reset password request to api, using [email]. If the call is successful, redirect the user to the confirmation page, if not display a toast with the error
     */
    private fun resetPassword(email: String) {
        ApiClient(this)
            .requestResetPassword(email, "https://" + (System.getenv("HOST") ?: "dev.area.b12powered.com") + "/reset_password") { success, message ->
                if (success) {
                    val intent = Intent(this, RequestResetPasswordValidationActivity::class.java)
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