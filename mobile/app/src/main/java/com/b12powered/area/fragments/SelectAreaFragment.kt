package com.b12powered.area.fragments

import android.app.AlertDialog
import android.content.DialogInterface
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ArrayAdapter
import android.widget.ListView
import android.widget.TextView
import androidx.activity.OnBackPressedCallback
import androidx.fragment.app.Fragment
import com.b12powered.area.*
import com.b12powered.area.activities.AreaCreationActivity

/**
 * The fragment where the user can select a new action/reaction
 *
 * This class set a clickable list of actions/reactions, depending on user's services
 *
 * @param service The current service
 * @param area The current area
 * @param step The current step of the area creation
 */
class SelectAreaFragment(private val service: Service, private val area: Area, private val step: AreaCreationStatus) : Fragment() {
    companion object {

        /**
         * This method return a new instance of [SelectAreaFragment]
         *
         * @param service The current service
         * @param area The current area
         * @param step The current step of the area creation
         *
         * @return A new instance of [SelectAreaFragment]
         */
        fun newInstance(service: Service, area: Area, step: AreaCreationStatus): SelectAreaFragment {
            return SelectAreaFragment(service, area, step)
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
        return inflater.inflate(R.layout.fragment_select_area, container, false)
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
                if (step is AreaCreationStatus.ReactionAdded || step is AreaCreationStatus.AdditionalReactionAdded) {
                    showWarning()
                } else {
                    (activity!! as AreaCreationActivity).goBack(area, step)
                }
            }
        })
    }

    /**
     * Override method onViewCreated
     *
     * Set the fragment's custom title and set a custom list of actions/reactions for each service
     */
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        val textView: TextView = view.findViewById(R.id.textView)
        textView.text = getString(when(step) {
            is AreaCreationStatus.AreaCreated -> R.string.add_action
            else -> R.string.add_reaction
        })

        listView = view.findViewById(R.id.list)

        val arList: ArrayList<Pair<String, ActionReaction>> = when(step) {
            is AreaCreationStatus.AreaCreated -> service.actions.map { action -> Pair(service.displayName, action) } as ArrayList<Pair<String, ActionReaction>>
            else -> {
                val list: ArrayList<Pair<String, ActionReaction>> = ArrayList()
                val services = (activity as AreaCreationActivity).getServices()
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

            if (step == AreaCreationStatus.ActionAdded) {
                val serviceList = (activity as AreaCreationActivity).getServices()
                (activity as AreaCreationActivity).setCurrentService(serviceList[serviceList.indexOfFirst { service ->
                    service.displayName == arList[position].first
                }])
            }

            (activity as AreaCreationActivity).nextStep(area, arList[position].second, when(step) {
                is AreaCreationStatus.AreaCreated -> AreaCreationStatus.ActionSelected
                is AreaCreationStatus.ActionAdded -> AreaCreationStatus.ReactionSelected
                else -> AreaCreationStatus.AdditionalReactionSelected
            })
        }
    }

    /**
     * Show a dialog warning the user that they will be redirected to home page and will exit the area creation process if they go back from this page
     */
    private fun showWarning() {
        val builder = AlertDialog.Builder(context)
        val dialogClickListener = DialogInterface.OnClickListener { dialog, which ->
            when(which) {
                DialogInterface.BUTTON_POSITIVE -> (activity as AreaCreationActivity).finishArea()
                DialogInterface.BUTTON_NEGATIVE -> dialog.dismiss()
            }
        }
        builder
            .setTitle(getString(R.string.confirm_exit))
            .setMessage(getString(R.string.exit_area_message))
            .setPositiveButton(getString(R.string.confirm), dialogClickListener)
            .setNegativeButton(getString(R.string.cancel), dialogClickListener)
            .create()
            .show()
    }

}