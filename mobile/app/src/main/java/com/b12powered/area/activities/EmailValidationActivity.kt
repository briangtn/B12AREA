package com.b12powered.area.activities

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.util.Log
import androidx.appcompat.app.AppCompatActivity
import com.b12powered.area.R
import com.b12powered.area.api.ApiClient
import kotlinx.android.synthetic.main.activity_register.*

/**
 * The activity where the user is redirected when clicking on the link in the validation email
 *
 * This class has no logic since it's only implemented for its visual interface
 */
class EmailValidationActivity : AppCompatActivity() {

    /**
     * Override method onCreate
     *
     * Check token validity and set a listener redirecting to login view
     */
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_email_validation)

        val token: String = intent!!.data!!.getQueryParameter("token")!!

        ApiClient(this).validate(token) {}

        go_to_login_button.setOnClickListener {
            val intent = Intent(this, LoginActivity::class.java)
            finish()
            startActivity(intent)
        }
    }
}