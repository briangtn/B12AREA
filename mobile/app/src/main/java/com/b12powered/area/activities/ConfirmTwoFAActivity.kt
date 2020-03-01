package com.b12powered.area.activities

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import com.b12powered.area.R
import android.os.Bundle
import android.widget.EditText
import android.widget.TextView
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import com.b12powered.area.api.ApiClient
import kotlinx.android.synthetic.main.activity_confirm_two_fa.*
import kotlinx.android.synthetic.main.activity_two_fa.submit_button

/**
 * The activity where the user enter their 2FA code
 *
 * This class request the 2FA code and make an api call to validate it
 */
class ConfirmTwoFAActivity : AppCompatActivity() {

    /**
     * Override method onCreate
     *
     * Set listeners to view's buttons and input fields
     */
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_confirm_two_fa)

        val etSecret = findViewById<TextView>(R.id.secret)

        val secret = intent.getStringExtra("secret")

        etSecret.text = secret

        copy_button.setOnClickListener {

            val clipboard = getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
            val myClip: ClipData = ClipData.newPlainText("note_copy", secret)
            clipboard.setPrimaryClip(myClip)
            Toast.makeText(
                applicationContext, "Text Copied",
                Toast.LENGTH_SHORT
            ).show()
        }

        submit_button.setOnClickListener {
            submitCode()
        }

        onBackPressedDispatcher.addCallback(object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                val intent = Intent(this@ConfirmTwoFAActivity, UserActivity::class.java)
                finish()
                startActivity(intent)
            }
        })
    }

    /**
     * Check code validity. Call [validate2fa] method if code is valid, reset input field if not
     */
    private fun submitCode() {
        val etAuthenticationCode = findViewById<EditText>(R.id.authentication_code)

        etAuthenticationCode.clearFocus()

        etAuthenticationCode.error = null

        if (etAuthenticationCode.length() != 6) {
            etAuthenticationCode.error = getString(R.string.invalid_2fa_code)
        } else {
            validate2fa(etAuthenticationCode.text.toString())
        }
    }

    /**
     * Make a 2FA request to api, using provided [code]. If the call is successful, redirect the user to the home page, if not display a toast with the error
     */
    private fun validate2fa(code: String) {
        ApiClient(this)
            .confirm2fa(code) { user, _ ->
                if (user != null) {
                    val intent = Intent(this, UserActivity::class.java)
                    finish()
                    startActivity(intent)
                } else {
                    val etAuthenticationCode = findViewById<EditText>(R.id.authentication_code)

                    etAuthenticationCode.error = getString(R.string.invalid_token)
                }
            }
    }
}