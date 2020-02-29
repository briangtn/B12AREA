package com.b12powered.area.activities

import android.content.Intent
import android.os.Bundle
import android.widget.*
import androidx.appcompat.app.AppCompatActivity
import com.b12powered.area.*
import com.b12powered.area.api.ApiClient
import kotlin.collections.ArrayList
import com.b12powered.area.fragments.ServiceActionInformationFragment
import com.b12powered.area.fragments.ServiceReactionInformationFragment
import kotlinx.android.synthetic.main.activity_service_information.*

/**
 * This class is use for handling fragment print action information and reaction too
 *
 * This class use supportFragmentManager for handling switching fragment
 */
class ServiceInformationActivity : AppCompatActivity() {

    private var serviceName: String = ""
    private var currentActionSelected: Pair<String, ActionDetails>? = null
    private var currentArea: Area? = null
    private var serviceList: ArrayList<Service> = ArrayList()
    private var _service: Service? = null
    private var isAction: Boolean = true

    /**
     * Override method onCreate
     */
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_service_information)

        serviceName = intent.getStringExtra("serviceName")

        val etServiceName = findViewById<TextView>(R.id.service_name)

        etServiceName.hint = serviceName

        getServiceInformation()

        floatingActionButton.setOnClickListener {
            if (isAction) {
                val intent = Intent(this, AreaCreationActivity::class.java)
                intent.putExtra("serviceList", serviceList.map { service -> service.toJSON()} as ArrayList)
                intent.putExtra("service", _service?.toJSON())
                finish()
                startActivity(intent)
            } else {
                val intent = Intent(this, AreaCreationActivity::class.java)
                intent.putExtra("serviceList", serviceList.map { service -> service.toJSON()} as ArrayList)
                intent.putExtra("service", _service?.toJSON())
                ApiClient(this)
                    .getAreas { areas, message ->
                        if (areas !== null) {
                            areas.forEach { item ->
                                if (item.actions != null) {
                                    if (item.actions.id == currentActionSelected?.second?.id) {
                                        var area = Area(item.id, item.name, item.enabled, item.ownerId, item.data)
                                        currentArea = area
                                    }
                                }
                            }
                            intent.putExtra("area", currentArea?.toJSON())
                            finish()
                            startActivity(intent)
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

        supportFragmentManager.beginTransaction()
            .add(R.id.create_action_list, ServiceActionInformationFragment.newInstance(serviceName))
            .commit()
    }

    /**
     * Function for get service information
     *
     * Perform a aboutJson request
     */
    private fun getServiceInformation() {
        ApiClient(this)
            .aboutJson { about, message ->
                if (about !== null) {
                    about.server.services.forEach { service ->
                        if (service.name == serviceName) {
                            _service = service
                        }
                        serviceList.add(service)
                    }

                } else {
                    Toast.makeText(
                        this,
                        message,
                        Toast.LENGTH_SHORT
                    ).show()
                }
            }
    }

    /**
     * Function for changing fragment for print Reaction Details
     *
     * @param listActionDetails for send the current action selected to the next fragment
     */
    fun changeView(listActionDetails: Pair<String, ActionDetails>) {
        isAction = false
        currentActionSelected = listActionDetails
        supportFragmentManager.beginTransaction()
            .replace(R.id.create_action_list, ServiceReactionInformationFragment.newInstance(listActionDetails))
            .commit()
    }

    /**
     * Function for resfresh the current view
     */
    fun refreshView() {
        isAction = true
        intent = Intent(this, ServiceInformationActivity::class.java)
        intent.putExtra("serviceName", serviceName)
        finish()
        startActivity(intent)
    }
}