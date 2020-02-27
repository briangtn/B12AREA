package com.b12powered.area.fragments

import android.os.Bundle
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ArrayAdapter
import android.widget.ListView
import android.widget.Toast
import androidx.fragment.app.Fragment
import com.b12powered.area.*
import com.b12powered.area.activities.ServiceInformationActivity

class SelectAreaFragment(private val service: Service, private val area: Area, private val step: AreaCreationStatus) : Fragment() {
    companion object {
        fun newInstance(service: Service, area: Area, step: AreaCreationStatus): SelectAreaFragment {
            return SelectAreaFragment(service, area, step)
        }
    }

    private lateinit var listView: ListView

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        return inflater.inflate(R.layout.fragment_select_area, container, false)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        listView = view.findViewById(R.id.list)

        val arList: ArrayList<Pair<String, ActionReaction>> = when(step) {
            is AreaCreationStatus.AreaCreated -> service.actions.map { action -> Pair(service.displayName, action) } as ArrayList<Pair<String, ActionReaction>>
            else -> {
                val list: ArrayList<Pair<String, ActionReaction>> = ArrayList()
                val services = (activity as ServiceInformationActivity).getServices()
                services.forEach { service ->
                    service.reactions.forEach { reaction ->
                        list.add(Pair(service.displayName, reaction))
                    }
                }
                list
            }
        }
        val list: List<String> = when(step) {
            is AreaCreationStatus.AreaCreated -> arList.map { action -> "\n${action.second.displayName}\n\n${action.second.description}\n" }
            else -> arList.map { reaction -> "\n${reaction.second.displayName} (${reaction.first})\n\n${reaction.second.description}\n"}
        }
        val adapter = ArrayAdapter(activity!!, android.R.layout.simple_list_item_1, list)
        listView.adapter = adapter

        listView.setOnItemClickListener { _, _, position, _ ->

            if (step == AreaCreationStatus.ReactionSelected) {
                val serviceList = (activity as ServiceInformationActivity).getServices()
                (activity as ServiceInformationActivity).setService(serviceList[serviceList.indexOfFirst { service ->
                    service.displayName == arList[position].first
                }])
            }

            (activity as ServiceInformationActivity).nextStep(area, arList[position].second, when(step) {
                is AreaCreationStatus.AreaCreated -> AreaCreationStatus.ActionSelected
                else -> AreaCreationStatus.ReactionSelected
            })
        }
    }

}