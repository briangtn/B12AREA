package com.b12powered.area.activities

import android.content.Intent
import android.os.Bundle
import android.widget.EditText
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.b12powered.area.R
import com.b12powered.area.api.ApiClient
import kotlinx.android.synthetic.main.activity_login.*

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

        forgot_password_button.setOnClickListener {
            submitEmail()
        }
    }

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

    private fun resetPassword(email: String) {
        ApiClient(this)
            .requestResetPassword(email, "http://" + (System.getenv("HOST") ?: "dev.area.b12powered.com") + "/reset_password") { success, message ->
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