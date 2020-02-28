package com.b12powered.area.activities

import android.content.Intent
import android.os.Bundle
import android.widget.*
import androidx.appcompat.app.AppCompatActivity
import com.b12powered.area.*
import com.b12powered.area.api.ApiClient
import com.b12powered.area.fragments.ServiceUserFragment

class ServiceInformationActivity : AppCompatActivity() {

    private var _allAreasService : MutableList<Areas>? = mutableListOf()
    private lateinit var listView: ListView


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
        listView = findViewById(R.id.list)
        var list: ArrayList<String> = ArrayList()

        _allAreasService?.forEach { item ->
            var serviceAction = item.actions.serviceAction.substringAfterLast(".")
            var actionOption = ""
            var reactionOption = ""

            if (item.actions.options != null) {
                for ((key, value) in item.actions.options)
                    actionOption = "$actionOption$key : $value\n"
                list.add(serviceAction.plus(" \n\n") + actionOption)
            } else {
                list.add(serviceAction.plus("\n"))
            }

            if (item.reactions != null) {
                item.reactions.forEach { second ->
                    if (second.options != null) {
                        for ((key, value) in second.options)
                            reactionOption = "$reactionOption$key : $value\n"
                        var reactionDetail = second.serviceReaction.substringAfterLast(".")
                        var reactionName = second.serviceReaction.substringBefore(".")
                        list.add(reactionName.plus("\t (") + reactionDetail.plus(")\n\n") + reactionOption)
                    } else {
                        var reactionDetail = second.serviceReaction.substringAfterLast(".")
                        var reactionName = second.serviceReaction.substringBefore(".")
                        list.add(reactionName.plus("\t (") + reactionDetail.plus(")"))
                    }
                }
            }
        }
        val adapter = ArrayAdapter(this, android.R.layout.simple_list_item_1, list)
        listView.adapter = adapter
    }
}
