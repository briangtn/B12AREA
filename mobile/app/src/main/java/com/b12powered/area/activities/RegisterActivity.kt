package com.b12powered.area.activities

import android.content.Context
import androidx.appcompat.app.AppCompatActivity
import android.os.Bundle
import android.view.KeyEvent
import android.view.View
import android.view.inputmethod.InputMethodManager
import android.widget.Button
import android.widget.EditText
import com.b12powered.area.R
import kotlinx.android.synthetic.main.activity_register.*
import org.json.JSONException
import java.io.IOException

class RegisterActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_register)

        val etEmail = findViewById<EditText>(R.id.email)
        val etPassword = findViewById<EditText>(R.id.password)
        val etConfirmPassword = findViewById<EditText>(R.id.confirm_password)

        val btnRegister = findViewById<Button>(R.id.register_button)

        btnRegister.setOnClickListener {
            val email = etEmail.text
            val password = etPassword.text
            val confirmPassword = etConfirmPassword.text

            etEmail.error = null
            etPassword.error = null
            etConfirmPassword.error = null
            if (email.isEmpty()) {
                etEmail.error = getString(R.string.no_email)
            }
            if (password.isEmpty()) {
                etPassword.error = getString(R.string.no_password)
            } else if (confirmPassword.isEmpty()) {
                etConfirmPassword.error = getString(R.string.no_confirm_password)
            } else if (password != confirmPassword) {
                etConfirmPassword.setText("")
                etConfirmPassword.error = getString(R.string.different_password)
            }
        }

    }

    private fun register() {
    }

}
