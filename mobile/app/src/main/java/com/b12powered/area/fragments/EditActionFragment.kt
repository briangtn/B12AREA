package com.b12powered.area.fragments

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ListView
import androidx.fragment.app.Fragment
import com.b12powered.area.*

class EditActionFragment(private val service: Service, private val area: Area, private val action: Action) : Fragment() {
    companion object {
        fun newInstance(service: Service, area: Area, action: Action): EditActionFragment {
            return EditActionFragment(service, area, action)
        }
    }

    private lateinit var listView: ListView

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        return inflater.inflate(R.layout.fragment_edit_action, container, false)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        listView = view.findViewById(R.id.action_list)

        val editModelArrayList = initList()
        val adapter = EditTextListAdapter(activity!!, editModelArrayList)
        listView.adapter = adapter
    }

    private fun initList(): ArrayList<EditModel> {
        val list: ArrayList<EditModel> = ArrayList()

        action.configSchema.forEach { option ->
            val editModel = EditModel()
            editModel.setEditTextValue(option.name)
            list.add(editModel)
        }
        return list
    }
}