package com.b12powered.area.fragments

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ArrayAdapter
import android.widget.ListView
import android.widget.Toast
import androidx.fragment.app.Fragment
import com.b12powered.area.*
import com.b12powered.area.activities.ServiceInformationActivity
import com.b12powered.area.api.ApiClient

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
            else -> getReactions()
        }
        val list: List<String> = when(step) {
            is AreaCreationStatus.AreaCreated -> arList.map { action -> "\n${action.second.displayName}\n\n${action.second.description}\n" }
            else -> arList.map { reaction -> "\n${reaction.second.displayName} (${reaction.first})\n\n${reaction.second.description}\n"}
        }
        val adapter = ArrayAdapter(activity!!, android.R.layout.simple_list_item_1, list)
        listView.adapter = adapter

        listView.setOnItemClickListener { _, _, position, _ ->
            (activity as ServiceInformationActivity).nextStep(area, service.actions[position], when(step) {
                is AreaCreationStatus.AreaCreated -> AreaCreationStatus.ActionSelected
                else -> AreaCreationStatus.ReactionSelected
            })
        }
    }

    private fun getReactions(): ArrayList<Pair<String, ActionReaction>> {
        val reactions: ArrayList<Pair<String, ActionReaction>> = ArrayList()

        ApiClient(activity!!)
            .getUser { user, message ->
                if (user != null) {
                    ApiClient(activity!!)
                        .aboutJson { about, msg ->
                            if (about !== null) {
                                about.server.services.forEach { service ->
                                    if (user.services.contains(service.name)) {
                                        service.reactions.forEach { reaction ->
                                            reactions.add(Pair(service.displayName, reaction))
                                        }
                                    }
                                }
                            } else {
                                Toast.makeText(
                                    context,
                                    msg,
                                    Toast.LENGTH_SHORT
                                ).show()
                            }
                        }
                } else {
                    Toast.makeText(
                        context,
                        message,
                        Toast.LENGTH_SHORT
                    ).show()
                }
            }

        return reactions
    }
}