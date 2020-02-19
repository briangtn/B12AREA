package com.b12powered.area.activities

import android.os.Bundle
import com.b12powered.area.R
import com.b12powered.area.api.ApiClient
import android.widget.Toast
import android.content.Intent
import android.content.ClipboardManager
import android.os.PersistableBundle
import android.widget.Button
import android.widget.EditText
import androidx.appcompat.app.AppCompatActivity
import kotlinx.android.synthetic.main.activity_register.*

/**
 * The activity where th user can modified is password or activate 2fa
 *
 * This class can modified the password and activate 2fa, request the api for modified password and activate 2fa
 */
class UserActivity : AppCompatActivity() {

    /**
     * Override method onCreate
     *
     * Set listeners to view's buttons modified password and activate 2fa
     */
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_user)

        val btnChangePassword = findViewById<Button>(R.id.change_password_button)

        val btnActivate2fa = findViewById<Button>(R.id.activate_two_fa_button)

        btnActivate2fa.setOnClickListener {
            activate2fa()
        }

        btnChangePassword.setOnClickListener {
            submitChangePassword()
        }
    }

    /**
     * Activate the 2fa
     */
    private fun activate2fa() {
        ApiClient(this)
            .activate2fa { url, message ->
                if (url != null) {
                    val secret = url.substringAfter("secret=")
                    val intent = Intent(this, ConfirmTwoFAActivity::class.java)
                    intent.putExtra("secret", secret)
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
     * Check change password parameters validity
     */
    private fun submitChangePassword() {
        val etNewPassword = findViewById<EditText>(R.id.user_new_password)
        val etConfirmNewPassword = findViewById<EditText>(R.id.user_new_password_confirm)

        val newPassword = etNewPassword.text
        val newConfirmPassword = etConfirmNewPassword.text

        etNewPassword.clearFocus()
        etConfirmNewPassword.clearFocus()

        etNewPassword.error = null
        etConfirmNewPassword.error = null

        if (newPassword.isEmpty()) {
            etNewPassword.error = getString(R.string.no_password)
        } else if (newConfirmPassword.isEmpty()) {
            etConfirmNewPassword.error = getString(R.string.no_confirm_password)
        } else if (newPassword.toString() != newConfirmPassword.toString()) {
            etConfirmNewPassword.setText("")
            etConfirmNewPassword.error = getString(R.string.different_password)
        }
        if (newPassword.isNotEmpty() && newConfirmPassword.isNotEmpty() && newPassword.toString() == newConfirmPassword.toString()) {
//            changePassword(newPassword.toString())
        }
    }

    /*
    private fun changePassword(newPassword: String) {

    }*/


}
