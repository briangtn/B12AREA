package com.b12powered.area.activities

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import com.b12powered.area.R

/**
 * The activity where the user is redirected after requesting a password reset
 *
 * This class has no logic since it's only implemented for its visual interface
 */
class RequestResetPasswordValidationActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_request_reset_password_validation)
    }
}