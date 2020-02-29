package com.b12powered.area.fragments

import android.app.AlertDialog
import android.content.DialogInterface
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

/**
 * The fragment where the user can select and see all actions in specific service type
 *
 * This class set a clickable list of actions, depending on service
 *
 * @param serviceName The current service clicked
 */
class ServiceActionInformationFragment(private val serviceName: String) : Fragment() {

    private var _allAreasService : MutableList<Areas>? = mutableListOf()
    private lateinit var listView: ListView

    companion object {

        /**
         * This method return a new instance of [ServiceActionInformationFragment]
         *
         * @param serviceName The current service clicked
         *
         * @return A new instance of [ServiceActionInformationFragment]
         */
        fun newInstance(serviceName: String): ServiceActionInformationFragment {
            return ServiceActionInformationFragment(serviceName)
        }
    }

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
        return inflater.inflate(R.layout.fragment_service_action_information, container, false)
    }

    /**
     * Override method onViewCreated
     */
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        getAreasService(serviceName)
    }

    /**
     * Function getAreasService
     *
     * Make a getAreas request to the api, using [areas] for get all the action and reaction
     * @param [serviceName] get all action reaction about a specific service
     */
    private fun getAreasService(serviceName: String) {
        ApiClient(context!!)
            .getAreas { areas, message ->
                if (areas !== null) {
                    areas.forEach { item ->
                        if (item.actions != null) {
                            var actionName = item.actions.serviceAction.substringBefore(".")
                            if (actionName == serviceName)
                                _allAreasService?.add(item)
                        }
                    }
                    printAreasAction()
                } else {
                    Toast.makeText(
                        context!!,
                        message,
                        Toast.LENGTH_SHORT
                    ).show()
                }
            }
    }

    /**
     * Function printAreasAction
     *
     * Function for print all the current action linked with the service type
     */
    private fun printAreasAction() {
        listView = view!!.findViewById(R.id.list)
        var listActionDetails: ArrayList<Pair<String, ActionDetails>> = ArrayList()

        _allAreasService?.forEach { item ->
            var serviceAction = item.actions.serviceAction.substringAfterLast(".")
            var actionOption = ""

            if (item.actions.options != null) {
                for ((key, value) in item.actions.options)
                    actionOption = "$actionOption$key : $value\n"
                listActionDetails.add(Pair(item.name.plus("  (") + serviceAction.plus(")\n\n") + actionOption, item.actions))
            } else {
                listActionDetails.add(Pair(item.name.plus("  (") + serviceAction.plus(")\n\n"), item.actions))
            }
        }
        val adapter = ArrayAdapter(context!!, android.R.layout.simple_list_item_1, listActionDetails.map { item -> item.first })
        listView.adapter = adapter

        listView.setOnItemClickListener { _, _, position, _ ->
            showDialog(haveReaction(listActionDetails[position]), listActionDetails[position])
        }
    }

    /**
     * Function for switch fragment and show all reactions about an action
     *
     * @param listActionDetails current action selected
     */
    private fun showReactionService(listActionDetails: Pair<String, ActionDetails>) {
        (activity as ServiceInformationActivity).changeView(listActionDetails)
    }

    /**
     * Function for delete an areas
     *
     * @param listActionDetails current action with areasId to delete
     */
    private fun deleteAreas(listActionDetails: Pair<String, ActionDetails>) {
        ApiClient(context!!)
            .deleteArea(listActionDetails.second.areaId) { success, message ->
                if (success) {
                    (activity!! as ServiceInformationActivity).refreshView()
                } else {
                    Toast.makeText(
                        context!!,
                        message,
                        Toast.LENGTH_SHORT
                    ).show()
                }
            }
    }

    /**
     * Function for showing a dialog when click on specific action
     *
     * @param haveReaction True if the action have Reaction false otherwise
     * @param listActionDetails The current actionDetails clicked
     */
    private fun showDialog(haveReaction: Boolean, listActionDetails: Pair<String, ActionDetails>) {
        val builder = AlertDialog.Builder(context)
        if (haveReaction) {
            val dialogClickListener = DialogInterface.OnClickListener { dialog, which ->
                when(which) {
                    DialogInterface.BUTTON_NEUTRAL -> dialog.dismiss()
                    DialogInterface.BUTTON_POSITIVE -> showReactionService(listActionDetails)
                    DialogInterface.BUTTON_NEGATIVE -> deleteAreas(listActionDetails)
                }
            }
            builder
                .setTitle(serviceName)
                .setMessage(getString(R.string.what_you_want))
                .setNeutralButton(getString(R.string.cancel), dialogClickListener)
                .setNegativeButton(getString(R.string.delete_areas), dialogClickListener)
                .setPositiveButton(getString(R.string.show_reactions), dialogClickListener)
                .create()
                .show()
        } else {
            val dialogClickListener = DialogInterface.OnClickListener { dialog, which ->
                when(which) {
                    DialogInterface.BUTTON_POSITIVE -> deleteAreas(listActionDetails)
                    DialogInterface.BUTTON_NEGATIVE -> dialog.dismiss()
                }
            }
            builder
                .setTitle(serviceName)
                .setMessage(getString(R.string.what_you_want).plus("\n") + getString(R.string.no_reaction))
                .setPositiveButton(getString(R.string.delete_areas), dialogClickListener)
                .setNegativeButton(getString(R.string.cancel), dialogClickListener)
                .create()
                .show()
        }
    }

    /**
     * Function for checking if a action have reaction
     *
     * @param [listActionDetails] the current action Clicked
     * @return true if action contains reaction false otherwise
     */
    private fun haveReaction(listActionDetails: Pair<String, ActionDetails>) : Boolean {
        _allAreasService?.forEach { item ->
            if (item.actions.serviceAction == listActionDetails.second.serviceAction) {
                if (item.reactions != null) {
                    item.reactions.forEach { second ->
                        if (listActionDetails.second.areaId == second.areaId)
                            return true
                    }
                }
            }
        }
        return false
    }
}