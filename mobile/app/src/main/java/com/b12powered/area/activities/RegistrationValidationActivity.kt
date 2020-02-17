package com.b12powered.area.activities

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import com.b12powered.area.R

/**
 * The activity where the user is redirected after registration
 *
 * This class has no logic since it's only implemented for its visual interface
 */
class RegistrationValidationActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_registration_validation)
    }
}