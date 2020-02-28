package com.b12powered.area.activities

import android.os.Bundle
import android.widget.EditText
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.b12powered.area.Area
import com.b12powered.area.Areas
import com.b12powered.area.R
import com.b12powered.area.api.ApiClient

class ServiceInformationActivity : AppCompatActivity() {

    private var _allAreasService : MutableList<Areas>? = mutableListOf()

    /**
     * Override method onCreate
     */
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_service_information)

        val serviceName = intent.getStringExtra("serviceName")

        val etServiceName = findViewById<TextView>(R.id.service_name)

        etServiceName.hint = serviceName

        getAreasService(serviceName)

    }

    private fun getAreasService(serviceName: String) {
        ApiClient(this)
            .getAreas { areas, message ->
                if (areas !== null) {
                    areas.forEach { item ->
                        if (item.actions != null) {
                            var actionName = item.actions.serviceAction.substringBefore(".")
                            if (actionName == serviceName)
                                    _allAreasService?.add(item)
                        }
                    }
                    printAreas()
                } else {
                    Toast.makeText(
                        this,
                        message,
                        Toast.LENGTH_SHORT
                    ).show()
                }
            }
    }

    private fun printAreas() {
        _allAreasService?.forEach { item ->

        }
    }
}
