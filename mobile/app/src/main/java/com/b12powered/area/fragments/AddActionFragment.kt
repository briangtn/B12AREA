package com.b12powered.area.fragments

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ArrayAdapter
import android.widget.ListView
import androidx.fragment.app.Fragment
import com.b12powered.area.Area
import com.b12powered.area.R
import com.b12powered.area.Service
import com.b12powered.area.activities.ServiceInformationActivity

class AddActionFragment(private val service: Service, private val area: Area) : Fragment() {
    companion object {
        fun newInstance(service: Service, area: Area): AddActionFragment {
            return AddActionFragment(service, area)
        }
    }

    private lateinit var listView: ListView

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        return inflater.inflate(R.layout.fragment_add_action, container, false)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        listView = view.findViewById(R.id.action_list)

        val actionList: List<String> = service.actions.map { action -> "\n" + action.displayName + "\n\n" + action.description + "\n" }
        val adapter = ArrayAdapter(activity!!, android.R.layout.simple_list_item_1, actionList)
        listView.adapter = adapter

        listView.setOnItemClickListener { _, _, position, _ ->
            (activity as ServiceInformationActivity).addAction(area, service.actions[position])
        }
    }
}