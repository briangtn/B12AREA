package com.b12powered.area.activities

import android.content.Context
import android.content.Intent
import androidx.appcompat.app.AppCompatActivity
import android.os.Bundle
import android.view.KeyEvent
import android.view.View
import android.view.inputmethod.InputMethodManager
import android.widget.Button
import android.widget.EditText
import com.b12powered.area.R
import kotlinx.android.synthetic.main.activity_login.*

class PasswordActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_password)

        val btnValidationPassword = findViewById<Button>(R.id.validation_password_button)

        val etPassword = findViewById<EditText>(R.id.confirm_new_password)

        etPassword.setOnKeyListener(View.OnKeyListener { _, keyCode, event ->
            if (keyCode == KeyEvent.KEYCODE_ENTER && event.action == KeyEvent.ACTION_UP) {
                val inputMethodManager =
                    getSystemService(Context.INPUT_METHOD_SERVICE) as InputMethodManager
                inputMethodManager.hideSoftInputFromWindow(currentFocus!!.windowToken, 0)

                submitValidationPassword()
            }
            return@OnKeyListener true
        })

        btnValidationPassword.setOnClickListener {
            submitValidationPassword()
        }

    }

    private fun submitValidationPassword() {
        val etPassword = findViewById<EditText>(R.id.new_password)
        val etConfirmPassword = findViewById<EditText>(R.id.confirm_new_password)

        val password = etPassword.text
        val confirmPassword = etConfirmPassword.text

        etPassword.clearFocus()
        etConfirmPassword.clearFocus()

        etPassword.error = null
        etConfirmPassword.error = null

        if (password.isEmpty()) {
            etPassword.error = getString(R.string.no_password)
        }
        if (confirmPassword.isEmpty()) {
            etConfirmPassword.error = getString(R.string.no_password)
        }
        if (password != confirmPassword) {
            etConfirmPassword.setText("")
            etConfirmPassword.error = getString(R.string.different_password)
        }
        if (password.isNotEmpty() && confirmPassword.isNotEmpty()) {
            changePassword()
        }
    }

    private fun changePassword() {

    }

}
