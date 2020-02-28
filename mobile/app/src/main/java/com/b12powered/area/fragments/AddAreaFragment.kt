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
import com.b12powered.area.activities.AreaCreationActivity
import com.b12powered.area.api.ApiClient
import kotlinx.android.synthetic.main.fragment_create_area.*

/**
 * The fragment where the user can custom and add a new action/reaction to their current area
 *
 * This class set a list of input fields, in order to complete required parameters for the action/reaction to add, then request the api for addition
 *
 * @param service The current service
 * @param area The current area
 * @param ar The selected action/reaction
 * @param step The current step of the area creation
 */
class AddAreaFragment(private val service: Service, private val area: Area, private val ar: ActionReaction, private val step: AreaCreationStatus) : Fragment() {
    companion object {

        /**
         * This method return a new instance of [AddAreaFragment]
         *
         * @param service The current service
         * @param area The current area
         * @param ar The selected action/reaction
         * @param step The current step of the area creation
         *
         * @return A new instance of [AddAreaFragment]
         */
        fun newInstance(service: Service, area: Area, ar: ActionReaction, step: AreaCreationStatus): AddAreaFragment {
            return AddAreaFragment(service, area, ar, step)
        }
    }

    private lateinit var listView: ListView

    /**
     * Override method onCreateView
     *
     * Set the appropriate layout to the current fragment
     */
    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        return inflater.inflate(R.layout.fragment_add_area, container, false)
    }

    /**
     * Override method onCreate
     *
     * Set a custom callback to the back button
     */
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        requireActivity().onBackPressedDispatcher.addCallback(object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                (activity!! as AreaCreationActivity).goBack(area, step)
            }
        })
    }

    /**
     * Override method onViewCreated
     *
     * Set the fragment's custom title and set a custom list of EditText for each action/reaction's parameter
     */
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

    /**
     * Init an ArrayList of [EditModel] from the action/reaction configSchema
     *
     * @return A list of initialized [EditModel]
     */
    private fun initList(): ArrayList<EditModel> {
        val list: ArrayList<EditModel> = ArrayList()

        ar.configSchema.forEach { option ->
            val editModel = EditModel()
            editModel.setEditTextHint(option.name)
            list.add(editModel)
        }
        return list
    }

    /**
     * Check if the required action/reaction's parameters are valid, submit [addAction]/[addReaction] if they are, show a toast if not
     *
     * @param editModelArrayList The list of [EditModel] to get the values from
     */
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

    /**
     * Make a addAction request to api, using [options]. If thee call is successful, go to the next step of the area creation process, if not display a toast with the error and go back to the selection step
     */
    private fun addAction(options: HashMap<String, Any>) {
        ApiClient(activity!!)
            .addAction(area.id, service.name + ".A." + ar.name, options) { success, response ->
                if (success) {
                    (activity as AreaCreationActivity).nextStep(area, null, AreaCreationStatus.ActionAdded)
                } else {
                    Toast.makeText(
                        context,
                        response,
                        Toast.LENGTH_SHORT
                    ).show()
                    (activity!! as AreaCreationActivity).goBack(area, step)
                }
            }
    }

    /**
     * Make a addReaction request to api, using [options]. If thee call is successful, call [showDialog], if not display a toast with the error and go back to the selection step
     */
    private fun addReaction(options: HashMap<String, Any>) {
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
                    (activity!! as AreaCreationActivity).goBack(area, step)
                }
            }
    }

    /**
     * Show a dialog asking the user if they want to add a new reaction to their area, or if they want to exit now
     */
    private fun showDialog() {
        val builder = AlertDialog.Builder(context)
        val dialogClickListener = DialogInterface.OnClickListener { _, which ->
            when(which) {
                DialogInterface.BUTTON_POSITIVE -> (activity as AreaCreationActivity).nextStep(area, null, when(step) {
                    is AreaCreationStatus.ReactionSelected -> AreaCreationStatus.ReactionAdded
                    else -> AreaCreationStatus.AdditionalReactionAdded
                })
                DialogInterface.BUTTON_NEGATIVE -> (activity as AreaCreationActivity).finishArea()
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