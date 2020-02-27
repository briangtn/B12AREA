package com.b12powered.area.activities

import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.b12powered.area.*
import com.b12powered.area.api.ApiClient
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

        val etServiceName = findViewById<TextView>(R.id.service_name)

        etServiceName.text = service.displayName

        supportFragmentManager.beginTransaction()
            .add(R.id.create_area_layout, CreateAreaFragment.newInstance())
            .commit()

    }

    fun goBack(area: Area, step: AreaCreationStatus) {
        supportFragmentManager.beginTransaction()
            .replace(R.id.create_area_layout, when(step) {
                is AreaCreationStatus.AreaCreated -> {
                    ApiClient(this)
                        .deleteArea(area.id) { success, message ->
                            if (!success) {
                                Toast.makeText(
                                    this,
                                    message,
                                    Toast.LENGTH_SHORT
                                ).show()
                            }
                        }
                    CreateAreaFragment.newInstance()
                }
                is AreaCreationStatus.ActionSelected -> SelectAreaFragment.newInstance(service, area, AreaCreationStatus.AreaCreated)
                is AreaCreationStatus.ActionAdded -> {
                    ApiClient(this)
                        .deleteAction(area.id) { success, message ->
                            if (!success) {
                                Toast.makeText(
                                    this,
                                    message,
                                    Toast.LENGTH_SHORT
                                ).show()
                            }
                        }
                    SelectAreaFragment.newInstance(service, area, AreaCreationStatus.AreaCreated)
                }
                is AreaCreationStatus.ReactionSelected -> SelectAreaFragment.newInstance(service, area, AreaCreationStatus.ActionAdded)
                is AreaCreationStatus.AdditionalReactionSelected -> SelectAreaFragment.newInstance(service, area, AreaCreationStatus.AdditionalReactionAdded)
                else -> CreateAreaFragment.newInstance()
            })
            .commit()
    }

    fun nextStep(area: Area, ar: ActionReaction?, step: AreaCreationStatus) {
        supportFragmentManager.beginTransaction()
            .replace(R.id.create_area_layout, when(step) {
                is
                AreaCreationStatus.AreaCreated,
                AreaCreationStatus.ActionAdded,
                AreaCreationStatus.ReactionAdded,
                AreaCreationStatus.AdditionalReactionAdded -> SelectAreaFragment.newInstance(service, area, step)

                is
                AreaCreationStatus.ActionSelected,
                AreaCreationStatus.ReactionSelected,
                AreaCreationStatus.AdditionalReactionSelected -> AddAreaFragment.newInstance(service, area, ar!!, step)
            })
            .commit()
    }

    fun finishArea() {
        val intent = Intent(this, HomeActivity::class.java)
        finish()
        startActivity(intent)
    }

    fun getServices(): ArrayList<Service> {
        return serviceList
    }

    fun setService(newService: Service) {
        service = newService
    }
}
