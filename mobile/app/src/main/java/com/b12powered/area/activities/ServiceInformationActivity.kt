package com.b12powered.area.activities

import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import com.b12powered.area.*
import com.b12powered.area.fragments.CreateAreaFragment
import com.b12powered.area.fragments.SelectAreaFragment
import com.b12powered.area.fragments.AddAreaFragment

class ServiceInformationActivity : AppCompatActivity() {

    private lateinit var serviceList: ArrayList<Service>
    private lateinit var service: Service

    /**
     * Override method onCreate
     */
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_service_information)

        val jsonServiceList = intent.getStringArrayListExtra("serviceList")
        val jsonService = intent.getStringExtra("service")
        if (jsonService == null) {
            val intent = Intent(this, HomeActivity::class.java)
            finish()
            startActivity(intent)
        }
        service = jsonService!!.toObject()
        serviceList = jsonServiceList!!.map { service -> service.toObject<Service>() } as ArrayList<Service>

        Log.d("serviceList", serviceList.toString())

        val etServiceName = findViewById<TextView>(R.id.service_name)

        etServiceName.text = service.displayName

        supportFragmentManager.beginTransaction()
            .add(R.id.create_area_layout, CreateAreaFragment.newInstance())
            .commit()

    }

    fun nextStep(area: Area, ar: ActionReaction?, step: AreaCreationStatus) {
        Log.d("nextStep", step.toString())
        supportFragmentManager.beginTransaction()
            .replace(R.id.create_area_layout, when(step) {
                is AreaCreationStatus.AreaCreated -> SelectAreaFragment.newInstance(service, area, step)
                is AreaCreationStatus.ActionSelected -> AddAreaFragment.newInstance(service, area, ar!!, step)
                is AreaCreationStatus.ActionAdded -> SelectAreaFragment.newInstance(service, area, step)
                is AreaCreationStatus.ReactionSelected -> AddAreaFragment.newInstance(service, area, ar!!, step)
                is AreaCreationStatus.ReactionAdded -> SelectAreaFragment.newInstance(service, area, step)
            })
            .commit()
    }

    fun getServices(): ArrayList<Service> {
        return serviceList
    }

    fun setService(newService: Service) {
        service = newService
    }
}
