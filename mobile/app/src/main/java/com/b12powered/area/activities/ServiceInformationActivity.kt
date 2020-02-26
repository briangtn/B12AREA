package com.b12powered.area.activities

import android.content.Intent
import android.os.Bundle
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import com.b12powered.area.Area
import com.b12powered.area.R
import com.b12powered.area.Service
import com.b12powered.area.fragments.CreateAreaFragment
import com.b12powered.area.fragments.EditActionFragment
import com.b12powered.area.toObject

class ServiceInformationActivity : AppCompatActivity() {

    private lateinit var service: Service

    /**
     * Override method onCreate
     */
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_service_information)

        val jsonService = intent.getStringExtra("service")
        if (jsonService == null) {
            val intent = Intent(this, HomeActivity::class.java)
            finish()
            startActivity(intent)
        }
        service = jsonService!!.toObject()

        val etServiceName = findViewById<TextView>(R.id.service_name)

        etServiceName.text = service.displayName

        supportFragmentManager.beginTransaction()
            .add(R.id.create_area_layout, CreateAreaFragment.newInstance())
            .commit()

    }

    fun createArea(area: Area) {
        supportFragmentManager.beginTransaction()
            .replace(R.id.create_area_layout, EditActionFragment.newInstance(service, area))
            .commit()
    }
}
