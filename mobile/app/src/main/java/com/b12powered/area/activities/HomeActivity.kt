package com.b12powered.area.activities

import android.content.Intent
import android.os.Bundle
import android.os.PersistableBundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.b12powered.area.R
import com.b12powered.area.User
import com.b12powered.area.api.ApiClient

/**
 * The activity where the user can have all activities
 *
 * This class show the home page of the user connected
 */
class HomeActivity : AppCompatActivity() {

    private var currentUser: User? = null

    /**
     * Override method onCreate
     *
     * Perform an api call on /me to get current user. If the call failed, redirect to Login Page
     */
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_home)

        ApiClient(this)
            .getUser { user, message ->
                if (user != null) {
                    currentUser = user
                } else {
                    Toast.makeText(
                        this,
                        message,
                        Toast.LENGTH_SHORT
                    ).show()
                    val intent = Intent(this, LoginActivity::class.java)
                    finish()
                    startActivity(intent)
                }
            }
    }


}
