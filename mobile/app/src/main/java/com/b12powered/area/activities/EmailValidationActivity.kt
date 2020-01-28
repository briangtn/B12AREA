package com.b12powered.area.activities

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.util.Log
import androidx.appcompat.app.AppCompatActivity
import com.b12powered.area.R
import com.b12powered.area.api.ApiClient
import kotlinx.android.synthetic.main.activity_register.*

class EmailValidationActivity : AppCompatActivity() {

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