package com.b12powered.area.fragments

import android.app.AlertDialog
import android.content.DialogInterface
import android.os.Bundle
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ListView
import android.widget.TextView
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.fragment.app.Fragment
import com.b12powered.area.*
import com.b12powered.area.activities.ServiceInformationActivity
import com.b12powered.area.api.ApiClient
import kotlinx.android.synthetic.main.fragment_create_area.*

class AddAreaFragment(private val service: Service, private val area: Area, private val ar: ActionReaction, private val step: AreaCreationStatus) : Fragment() {
    companion object {
        fun newInstance(service: Service, area: Area, ar: ActionReaction, step: AreaCreationStatus): AddAreaFragment {
            return AddAreaFragment(service, area, ar, step)
        }
    }

    private lateinit var listView: ListView

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        return inflater.inflate(R.layout.fragment_add_area, container, false)
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        requireActivity().onBackPressedDispatcher.addCallback(object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                (activity!! as ServiceInformationActivity).goBack(area, step)
            }
        })
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        val textView: TextView = view.findViewById(R.id.textView)
        textView.text = getString(when(step) {
            is AreaCreationStatus.ActionSelected -> R.string.edit_action
            else -> R.string.edit_reaction
        })

        listView = view.findViewById(R.id.list)

        val editModelArrayList = initList()
        val adapter = EditTextListAdapter(activity!!, editModelArrayList)
        listView.adapter = adapter

        submit_button.setOnClickListener {
            submit(editModelArrayList)
        }
    }

    private fun initList(): ArrayList<EditModel> {
        val list: ArrayList<EditModel> = ArrayList()

        ar.configSchema.forEach { option ->
            val editModel = EditModel()
            editModel.setEditTextHint(option.name)
            list.add(editModel)
        }
        return list
    }

    private fun submit(editModelArrayList: ArrayList<EditModel>) {
        val options: HashMap<String, Any> = HashMap()

        editModelArrayList.forEachIndexed { index, input ->
            val value = input.getEditTextValue()
            if (value.isEmpty() && ar.configSchema[index].required) {
                Toast.makeText(
                    context,
                    getString(R.string.missing_parameter),
                    Toast.LENGTH_SHORT
                ).show()
                return
            } else if (value.isNotEmpty()) {
                options[ar.configSchema[editModelArrayList.indexOf(input)].name] = input.getEditTextValue()
            }
        }

        when(step) {
            is AreaCreationStatus.ActionSelected -> addAction(options)
            else -> addReaction(options)
        }
    }

    private fun addAction(options: HashMap<String, Any>) {
        ApiClient(activity!!)
            .addAction(area.id, service.name + ".A." + ar.name, options) { success, response ->
                if (success) {
                    (activity as ServiceInformationActivity).nextStep(area, null, AreaCreationStatus.ActionAdded)
                } else {
                    Toast.makeText(
                        context,
                        response,
                        Toast.LENGTH_SHORT
                    ).show()
                    (activity!! as ServiceInformationActivity).goBack(area, step)
                }
            }
    }

    private fun addReaction(options: HashMap<String, Any>) {
        Log.d("addReaction", "adding reaction")
        ApiClient(activity!!)
            .addReaction(area.id, service.name + ".R." + ar.name, options) { success, response ->
                if (success) {
                    showDialog()
                } else {
                    Toast.makeText(
                        context,
                        response,
                        Toast.LENGTH_SHORT
                    ).show()
                    (activity!! as ServiceInformationActivity).goBack(area, step)
                }
            }
    }

    private fun showDialog() {
        val builder = AlertDialog.Builder(context)
        val dialogClickListener = DialogInterface.OnClickListener { _, which ->
            when(which) {
                DialogInterface.BUTTON_POSITIVE -> (activity as ServiceInformationActivity).nextStep(area, null, when(step) {
                    is AreaCreationStatus.ReactionSelected -> AreaCreationStatus.ReactionAdded
                    else -> AreaCreationStatus.AdditionalReactionAdded
                })
                DialogInterface.BUTTON_NEGATIVE -> (activity as ServiceInformationActivity).finishArea()
            }
        }
        builder
            .setTitle(getString(R.string.area_added))
            .setMessage(getString(R.string.new_reaction_message))
            .setPositiveButton(getString(R.string.yes), dialogClickListener)
            .setNegativeButton(getString(R.string.no), dialogClickListener)
            .create()
            .show()
    }
}