package com.b12powered.area.activities

import android.content.Intent
import android.drm.DrmStore
import android.os.Bundle
import android.widget.*
import androidx.appcompat.app.AppCompatActivity
import com.b12powered.area.*
import com.b12powered.area.api.ApiClient
import androidx.fragment.app.Fragment
import com.b12powered.area.fragments.ServiceActionInformationFragment
import com.b12powered.area.fragments.ServiceReactionInformationFragment
import com.b12powered.area.fragments.ServiceUserFragment

/**
 * This class is use for handling fragment print action information and reaction too
 *
 * This class use supportFragmentManager for handling switching fragment
 */
class ServiceInformationActivity : AppCompatActivity() {

    private var serviceName: String = ""

    /**
     * Override method onCreate
     */
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_service_information)

        serviceName = intent.getStringExtra("serviceName")

        val etServiceName = findViewById<TextView>(R.id.service_name)

        etServiceName.hint = serviceName

        supportFragmentManager.beginTransaction()
            .add(R.id.create_action_list, ServiceActionInformationFragment.newInstance(serviceName))
            .commit()
    }

    /**
     * Function for changing fragment for print Reaction Details
     *
     * @param listActionDetails for send the current action selected to the next fragment
     */
    fun changeView(listActionDetails: Pair<String, ActionDetails>) {
        supportFragmentManager.beginTransaction()
            .replace(R.id.create_action_list, ServiceReactionInformationFragment.newInstance(listActionDetails))
            .commit()
    }

    /**
     * Function for resfresh the current view
     */
    fun refreshView() {
        intent = Intent(this, ServiceInformationActivity::class.java)
        intent.putExtra("serviceName", serviceName)
        finish()
        startActivity(intent)
    }
}