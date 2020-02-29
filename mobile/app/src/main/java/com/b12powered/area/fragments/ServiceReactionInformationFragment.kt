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
import androidx.activity.OnBackPressedCallback
import androidx.fragment.app.Fragment
import com.b12powered.area.*
import com.b12powered.area.activities.ServiceInformationActivity
import com.b12powered.area.api.ApiClient

/**
 * The fragment where the user can see all reaction about a specific service type
 *
 * This class set a clickable list of reaction, depending on action type
 *
 * @param listActionDetails Current action details
 */
class ServiceReactionInformationFragment(private val listActionDetails: Pair<String, ActionDetails>) : Fragment() {

    private var _allAreasService : MutableList<Areas>? = mutableListOf()
    private lateinit var listView: ListView
    private var numberReaction = 0

    companion object {

        /**
         * This method return a new instance of [ServiceReactionInformationFragment]
         *
         * @param listActionDetails The current action details
         *
         * @return A new instance of [ServiceReactionInformationFragment]
         */
        fun newInstance(listActionDetails: Pair<String, ActionDetails>): ServiceReactionInformationFragment {
            return ServiceReactionInformationFragment(listActionDetails)
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
        return inflater.inflate(R.layout.fragment_service_reaction_information, container, false)
    }

    /**
     * Override method onCreate
     *
     * Override function handleOnBackPressed for refresh the current view
     */
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)


        requireActivity().onBackPressedDispatcher.addCallback(object : OnBackPressedCallback(true) {
        override fun handleOnBackPressed() {
            (activity!! as ServiceInformationActivity).refreshView()
        }
        })
    }

    /**
     * Override method onViewCreated
     *
     * Call getAreasReaction function for get and print all the reaction about the action
     */
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        var serviceName = listActionDetails.second.serviceAction.substringBefore(".")
        getAreasReaction(serviceName)
    }

    /**
     * Function getAreasService
     *
     * Make a getAreas request to the api, using [areas] for get all the action and reaction
     * @param [serviceName] get all action reaction about a specific service
     */
    private fun getAreasReaction(serviceName: String) {
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
                    printAreasReaction()
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
     * Function printAreasReaction
     *
     * Function for print all the current reaction linked with a specific action type
     */
    private fun printAreasReaction() {
        var listReactionDetails: ArrayList<Pair<String, ReactionDetails>> = ArrayList()
        listView = view!!.findViewById(R.id.list)
        var reactionOption = ""

        _allAreasService?.forEach { item ->
            if (item.actions.id == listActionDetails.second.id) {
                item.reactions.forEach { reaction ->
                    numberReaction++
                    if (reaction.options != null) {
                        for ((key, value) in reaction.options)
                            reactionOption = "$reactionOption$key : $value\n"
                        var reactionDetail = reaction.serviceReaction.substringAfterLast(".")
                        var reactionName = reaction.serviceReaction.substringBefore(".")
                        listReactionDetails.add(
                            Pair(
                                reactionName.plus("\t (") + reactionDetail.plus(")\n\n") + reactionOption,
                                reaction
                            )
                        )
                    } else {
                        var reactionDetail = reaction.serviceReaction.substringAfterLast(".")
                        var reactionName = reaction.serviceReaction.substringBefore(".")
                        listReactionDetails.add(
                            Pair(
                                reactionName.plus("\t (") + reactionDetail.plus(")"),
                                reaction
                            )
                        )
                    }
                }
            }
        }
        val adapter = ArrayAdapter(context!!, android.R.layout.simple_list_item_1, listReactionDetails.map { item -> item.first })
        listView.adapter = adapter
        listView.setOnItemClickListener { _, _, position, _ ->
            showDialog(listReactionDetails[position])
        }
    }

    /**
     * Function showDialog
     *
     * Function for showing a dialog to the user
     *
     * @param listReactionDetails current reaction selected
     */
    private fun showDialog(listReactionDetails: Pair<String, ReactionDetails>) {
        val builder = AlertDialog.Builder(context)
        var serviceReactionName = listReactionDetails.second.serviceReaction.substringBefore(".")
        val dialogClickListener = DialogInterface.OnClickListener { dialog, which ->
            when (which) {
                DialogInterface.BUTTON_POSITIVE -> deleteReaction(listReactionDetails)
                DialogInterface.BUTTON_NEGATIVE -> dialog.dismiss()
            }
        }
        builder
            .setTitle(serviceReactionName)
            .setMessage(getString(R.string.delete_reaction))
            .setPositiveButton(getString(R.string.yes), dialogClickListener)
            .setNegativeButton(getString(R.string.no), dialogClickListener)
            .create()
            .show()
    }

    /**
     * Function deleteReaction
     *
     * Function for deleted a specific reaction
     *
     * @param liste current reaction selected
     */
    private fun deleteReaction(liste: Pair<String, ReactionDetails>) {
        ApiClient(context!!)
            .deleteReaction(liste.second.areaId, liste.second.id) { success, message ->
                if (success) {
                    numberReaction--
                    if (numberReaction == 0) {
                        (activity as ServiceInformationActivity).refreshView()
                    } else {
                        (activity as ServiceInformationActivity).changeView(listActionDetails)
                    }
                } else {
                    Toast.makeText(
                        context!!,
                        message,
                        Toast.LENGTH_SHORT
                    ).show()
                }
            }
    }
}