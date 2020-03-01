package com.b12powered.area.activities

import android.content.Intent
import android.os.Bundle
import android.widget.TextView
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import com.b12powered.area.*
import com.b12powered.area.api.ApiClient
import com.b12powered.area.fragments.CreateAreaFragment
import com.b12powered.area.fragments.SelectAreaFragment
import com.b12powered.area.fragments.AddAreaFragment

/**
 * The activity where the user can create new area
 *
 * This class handle area creation flow, by setting several custom fragments depending on the step of the creation process
 */
class AreaCreationActivity : AppCompatActivity() {

    private lateinit var serviceList: ArrayList<Service>
    private lateinit var service: Service
    private lateinit var currentArea: Area

    /**
     * Override method onCreate
     *
     * Get current service and services list from source intent, then set the first area creation fragment
     */
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_area_creation)

        val jsonServiceList = intent.getStringArrayListExtra("serviceList")
        val jsonService = intent.getStringExtra("service")
        val jsonArea = intent.getStringExtra("area")

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

        onBackPressedDispatcher.addCallback(object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                val intent = Intent(this@AreaCreationActivity, ServiceInformationActivity::class.java)
                finish()
                startActivity(intent)
            }
        })
        if (jsonArea !== null) {
            currentArea = jsonArea.toObject()
            nextStep(currentArea, null, AreaCreationStatus.ReactionAdded)
        }
    }

    /**
     * Handle back button, depending on the current [step] of the area creation
     *
     * @param area The current area
     * @param step The current step of the area creation
     */
    fun goBack(area: Area, step: AreaCreationStatus) {
        supportFragmentManager.beginTransaction()
            .replace(R.id.create_area_layout, when(step) {
                is AreaCreationStatus.AreaCreated -> {
                    ApiClient(this)
                        .deleteArea(area.id) { _, _ -> }
                    CreateAreaFragment.newInstance()
                }
                is AreaCreationStatus.ActionSelected -> SelectAreaFragment.newInstance(service, area, AreaCreationStatus.AreaCreated)
                is AreaCreationStatus.ActionAdded -> {
                    ApiClient(this)
                        .deleteAction(area.id) { _, _ -> }
                    SelectAreaFragment.newInstance(service, area, AreaCreationStatus.AreaCreated)
                }
                is AreaCreationStatus.ReactionSelected -> SelectAreaFragment.newInstance(service, area, AreaCreationStatus.ActionAdded)
                is AreaCreationStatus.AdditionalReactionSelected -> SelectAreaFragment.newInstance(service, area, AreaCreationStatus.AdditionalReactionAdded)
                else -> CreateAreaFragment.newInstance()
            })
            .commit()
    }

    /**
     * Replace current fragment with the one needed to pursue the area creation, depending on the current [step] of the process
     *
     * @param area The current area
     * @param ar The current action/reaction being edited, or null if none has been created
     * @param step The current step of the area creation
     */
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

    /**
     * End up the area creation and bring the user back to the HomePage
     */
    fun finishArea() {
        val intent = Intent(this, HomeActivity::class.java)
        finish()
        startActivity(intent)
    }

    /**
     * [serviceList] getter, used by children fragments
     *
     * @return [serviceList]
     */
    fun getServices(): ArrayList<Service> {
        return serviceList
    }

    /**
     * Set current service, used by children fragments
     */
    fun setService(newService: Service) {
        service = newService
    }
}
