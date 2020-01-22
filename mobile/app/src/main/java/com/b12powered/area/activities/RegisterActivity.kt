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
import android.widget.Toast
import com.b12powered.area.R
import com.b12powered.area.api.ApiClient
import kotlinx.android.synthetic.main.activity_register.*

class RegisterActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_register)

        val etConfirmPassword = findViewById<EditText>(R.id.confirm_password)

        val btnRegister = findViewById<Button>(R.id.register_button)

        etConfirmPassword.setOnKeyListener(View.OnKeyListener { _, keyCode, event ->
            if (keyCode == KeyEvent.KEYCODE_ENTER && event.action == KeyEvent.ACTION_UP) {
                val inputMethodManager =
                    getSystemService(Context.INPUT_METHOD_SERVICE) as InputMethodManager
                inputMethodManager.hideSoftInputFromWindow(currentFocus!!.windowToken, 0)

                submitForm()
            }
            return@OnKeyListener true
        })

        btnRegister.setOnClickListener {
            submitForm()
        }

        go_to_login_button.setOnClickListener {
            val intent = Intent(this, LoginActivity::class.java)
            finish()
            startActivity(intent)
        }
    }

    private fun submitForm() {
        val etEmail = findViewById<EditText>(R.id.email)
        val etPassword = findViewById<EditText>(R.id.password)
        val etConfirmPassword = findViewById<EditText>(R.id.confirm_password)

        val email = etEmail.text
        val password = etPassword.text
        val confirmPassword = etConfirmPassword.text

        etEmail.clearFocus()
        etPassword.clearFocus()
        etConfirmPassword.clearFocus()

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
        } else if (password.toString() != confirmPassword.toString()) {
            etConfirmPassword.setText("")
            etConfirmPassword.error = getString(R.string.different_password)
        }
        if (email.isNotEmpty() && password.isNotEmpty() && confirmPassword.isNotEmpty() && password.toString() == confirmPassword.toString()) {
            register(email.toString(), password.toString())
        }
    }

    private fun register(email: String, password: String) {
        ApiClient(this)
            .register(email, password) { user, message ->
                if (user != null) {
                    Toast.makeText(
                        this,
                        "registered",
                        Toast.LENGTH_SHORT
                    ).show()
                } else {
                    Toast.makeText(
                        this,
                        message,
                        Toast.LENGTH_SHORT
                    ).show()
                }
            }
    }

}
