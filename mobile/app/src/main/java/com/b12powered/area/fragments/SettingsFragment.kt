package com.b12powered.area.fragments

import android.app.AlertDialog
import android.app.Dialog
import android.content.Context
import android.content.SharedPreferences
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.DialogFragment
import com.b12powered.area.R
import com.b12powered.area.api.ApiClient
import kotlinx.android.synthetic.main.fragment_settings.*
import java.lang.IllegalStateException


/**
 * Fragment class for api settings, used in both login and register view before any api call
 *
 * This class parse the api url entered by the user and request the api to check its validity
 */
class SettingsFragment : DialogFragment() {


    private lateinit var root: View

    /**
     * Override method onCreateView
     *
     * Get the root view of the fragment for context purposes
     */
    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        root = inflater.inflate(R.layout.fragment_settings, container, false)
        return root
    }

    /**
     * Override method onCreateDialog
     *
     * Set a new dialog with input field and set listener to check and return api url to parent view
     */
    override fun onCreateDialog(savedInstanceState: Bundle?): Dialog {
        return activity?.let {
            val builder = AlertDialog.Builder(it)
            builder.setView(R.layout.fragment_settings)
                .setPositiveButton(R.string.confirm, null)
                .setNegativeButton(R.string.cancel, null)
                .setCancelable(false)

            val dialog: AlertDialog = builder.create()

            dialog.setOnShowListener {
                dialog.getButton(AlertDialog.BUTTON_POSITIVE).setOnClickListener {
                    val input = dialog.api_url_input
                    val url = input.text.toString()
                    val sharedPreferences: SharedPreferences =
                        activity!!.getSharedPreferences("com.b12powered.area", Context.MODE_PRIVATE)
                    val containsApiUrl: Boolean = sharedPreferences.contains("api_url")
                    var oldUrl = ""
                    val editor: SharedPreferences.Editor = sharedPreferences.edit()

                    if (containsApiUrl) {
                        oldUrl = sharedPreferences.getString("api_url", null)!!
                    }

                    editor.putString("api_url", url)
                    editor.apply()

                    ApiClient(activity!!)
                        .readinessProbe { isUp ->
                            if (!isUp) {
                                input.error = root.context.getString(R.string.change_url_fail)
                                if (containsApiUrl) {
                                    editor.putString("api_url", oldUrl)
                                } else {
                                    editor.remove("api_url")
                                }
                                editor.apply()
                            } else {
                                dialog.dismiss()
                            }
                        }
                }
            }
            return dialog
        } ?: throw IllegalStateException("Activity cannot be null")
    }
}