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

    private lateinit var serviceName: String /*!< [serviceName] String -> current service name */
    private lateinit var displayName: String /*!< [displayName] String -> current displayed service name */
    private var currentActionSelected: Pair<String, ActionDetails>? = null /*!< [currentActionSelected] Pair<String, ActionDetails> -> contain action information */
    private var currentArea: Area? = null /*!< [currentArea] Area -> contain the current area selected */
    private var serviceList: ArrayList<Service> = ArrayList() /*!< [serviceList] ArrayList<Service> -> contain all the service in a arrayList */
    private var _service: Service? = null /*!< [_service] Service -> contain the current service selected */
    private var isAction: Boolean = true /*!< [isAction] Boolean -> true if the areas contain actions, false otherwise */

    /**
     * Override method onCreate
     */
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_service_information)

        serviceName = intent.getStringExtra("serviceName")!!
        displayName = intent.getStringExtra("displayName")!!

        val etServiceName = findViewById<TextView>(R.id.service_name)

        etServiceName.text = displayName

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
                                        val area = Area(item.id, item.name, item.enabled, item.ownerId, item.data)
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
            .add(R.id.create_action_list, ServiceActionInformationFragment.newInstance(serviceName, displayName))
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
                    ApiClient(this)
                        .getUser { user, msg ->
                            if (user !== null) {
                                about.server.services.forEach { service ->
                                    if (service.name == serviceName) {
                                        _service = service
                                    }
                                    if (user.services.contains(service.name)) {
                                        serviceList.add(service)
                                    }
                                }
                            } else {
                                Toast.makeText(
                                    this,
                                    msg,
                                    Toast.LENGTH_SHORT
                                ).show()
                            }
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
            .replace(R.id.create_action_list, ServiceReactionInformationFragment.newInstance(listActionDetails, displayName))
            .commit()
    }

    /**
     * Function for resfresh the current view
     */
    fun refreshView() {
        isAction = true
        intent = Intent(this, ServiceInformationActivity::class.java)
        intent.putExtra("serviceName", serviceName)
        intent.putExtra("displayName", displayName)
        finish()
        startActivity(intent)
    }
}