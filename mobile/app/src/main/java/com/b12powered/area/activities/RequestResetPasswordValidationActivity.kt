package com.b12powered.area.activities

import android.content.Intent
import android.os.Bundle
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import com.b12powered.area.R

/**
 * The activity where the user is redirected after requesting a password reset
 *
 * This class has no logic since it's only implemented for its visual interface
 */
class RequestResetPasswordValidationActivity : AppCompatActivity() {

    /**
     * Override method onCreate
     *
     * Set a callback to back button to go back directly on login page
     */
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_request_reset_password_validation)

        onBackPressedDispatcher.addCallback(object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                val intent = Intent(this@RequestResetPasswordValidationActivity, LoginActivity::class.java)
                finish()
                startActivity(intent)
            }
        })
    }
}