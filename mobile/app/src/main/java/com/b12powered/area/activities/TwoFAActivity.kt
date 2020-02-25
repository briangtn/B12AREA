package com.b12powered.area.activities

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.view.KeyEvent
import android.view.View
import android.view.inputmethod.InputMethodManager
import android.widget.EditText
import androidx.appcompat.app.AppCompatActivity
import com.b12powered.area.R
import com.b12powered.area.api.ApiClient
import kotlinx.android.synthetic.main.activity_two_fa.*

/**
 * The activity where the user enter their 2FA code
 *
 * This class request the 2FA code and make an api call to validate it
 */
class TwoFAActivity : AppCompatActivity() {

    /**
     * Override method onCreate
     *
     * Set listeners to view's buttons and input fields
     */
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_two_fa)

        val etAuthenticationCode = findViewById<EditText>(R.id.authentication_code)

        etAuthenticationCode.setOnKeyListener(View.OnKeyListener { _, keyCode, event ->
            if (keyCode == KeyEvent.KEYCODE_ENTER && event.action == KeyEvent.ACTION_UP) {
                val inputMethodManager = getSystemService(Context.INPUT_METHOD_SERVICE) as InputMethodManager
                inputMethodManager.hideSoftInputFromWindow(currentFocus!!.windowToken, 0)
                submitCode()
                return@OnKeyListener true
            }
            return@OnKeyListener false
        })

        submit_button.setOnClickListener {
            submitCode()
        }
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
            .validate2fa(code) { user, _ ->
                if (user != null) {
                    val sharedPreferences = getSharedPreferences(getString(R.string.storage_name), Context.MODE_PRIVATE)
                    val editor = sharedPreferences.edit()

                    editor.putString(getString(R.string.token_key), user.token)
                    editor.apply()

                    val intent = Intent(this, HomeActivity::class.java)
                    finish()
                    startActivity(intent)
                } else {
                    val etAuthenticationCode = findViewById<EditText>(R.id.authentication_code)

                    etAuthenticationCode.error = getString(R.string.invalid_token)
                }
            }
    }
}