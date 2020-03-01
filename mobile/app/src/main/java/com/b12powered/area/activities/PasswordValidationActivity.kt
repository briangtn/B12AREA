package com.b12powered.area.activities

import android.content.Intent
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import com.b12powered.area.R
import kotlinx.android.synthetic.main.activity_password_validation.*

/**
 * The activity where the user is redirected after changing their password
 *
 * This class has no logic since it's only implemented for its visual interface
 */
class PasswordValidationActivity : AppCompatActivity() {

    /**
     * Override method onCreate
     *
     * Set a listener redirecting to login view
     */
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_password_validation)

        go_to_login_button.setOnClickListener {
            val intent = Intent(this, LoginActivity::class.java)
            finish()
            startActivity(intent)
        }
    }
}