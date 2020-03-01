package com.b12powered.area.fragments

import android.content.Context
import android.os.Bundle
import android.view.KeyEvent
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.view.inputmethod.InputMethodManager
import android.widget.CheckBox
import android.widget.EditText
import android.widget.Toast
import androidx.fragment.app.Fragment
import com.b12powered.area.AreaCreationStatus
import com.b12powered.area.R
import com.b12powered.area.activities.AreaCreationActivity
import com.b12powered.area.api.ApiClient
import kotlinx.android.synthetic.main.fragment_create_area.*

/**
 * The fragment where the user can create a new area
 *
 * This class request the api for area creation, using the area's name entered by the user
 */
class CreateAreaFragment : Fragment() {

    companion object {

        /**
         * This method return a new instance of [CreateAreaFragment]
         *
         * @return A new instance of [CreateAreaFragment]
         */
        fun newInstance(): CreateAreaFragment {
            return CreateAreaFragment()
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
        return inflater.inflate(R.layout.fragment_create_area, container, false)
    }

    /**
     * Override method onViewCreated
     *
     * Set listeners to view's buttons and input fields
     */
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        val etCreateArea = view.findViewById<EditText>(R.id.area_name)

        etCreateArea.setOnKeyListener(View.OnKeyListener { _, keyCode, event ->
            if (keyCode == KeyEvent.KEYCODE_ENTER && event.action == KeyEvent.ACTION_UP) {
                submit()
                return@OnKeyListener true
            }
            return@OnKeyListener false
        })

        submit_button.setOnClickListener {
            submit()
        }

    }

    /**
     * Check if area's name is empty. Call [createArea] method if not, reset input field and set error if it is
     */
    private fun submit() {
        val inputMethodManager = context!!.getSystemService(Context.INPUT_METHOD_SERVICE) as InputMethodManager
        inputMethodManager.hideSoftInputFromWindow(activity!!.currentFocus!!.windowToken, 0)

        val etCreateArea = view!!.findViewById<EditText>(R.id.area_name)
        val cbAreaEnabled = view!!.findViewById<CheckBox>(R.id.checkBox)

        val areaName = etCreateArea.text

        etCreateArea.clearFocus()

        etCreateArea.error = null

        if (areaName.isEmpty()) {
            etCreateArea.error = getString(R.string.empty_area_name)
        } else {
            createArea(areaName.toString(), cbAreaEnabled.isChecked)
        }
    }

    /**
     * Make a createArea request to the api, using [name] and [enabled]. If the call is successful, go to the next step of the area creation process, if not display a toast with the error
     */
    private fun createArea(name: String, enabled: Boolean) {
        ApiClient(activity!!)
            .createArea(name, enabled) { area, message ->
                if (area !== null) {
                    (activity as AreaCreationActivity).nextStep(area, null, AreaCreationStatus.AreaCreated)
                } else {
                    Toast.makeText(
                        context,
                        message,
                        Toast.LENGTH_SHORT
                    ).show()
                }
            }
    }

}