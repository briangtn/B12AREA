package com.b12powered.area.activities

import android.os.Bundle
import android.widget.EditText
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import com.b12powered.area.R

class ServiceInformationActivity : AppCompatActivity() {

    /**
     * Override method onCreate
     */
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_service_information)

        val serviceName = intent.getStringExtra("serviceName")

        val etServiceName = findViewById<TextView>(R.id.service_name)

        etServiceName.hint = serviceName

    }
}
