package com.b12powered.area.fragments

import android.content.Context
import android.content.pm.ServiceInfo
import android.os.Bundle
import android.view.KeyEvent
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.view.inputmethod.InputMethodManager
import android.widget.CheckBox
import android.widget.EditText
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.fragment.app.Fragment
import com.b12powered.area.AreaCreationStatus
import com.b12powered.area.R
import com.b12powered.area.activities.ServiceInformationActivity
import com.b12powered.area.api.ApiClient
import kotlinx.android.synthetic.main.fragment_create_area.*

class CreateAreaFragment : Fragment() {
    companion object {
        fun newInstance(): CreateAreaFragment {
            return CreateAreaFragment()
        }
    }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        return inflater.inflate(R.layout.fragment_create_area, container, false)
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        requireActivity().onBackPressedDispatcher.addCallback(object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                (activity!! as ServiceInformationActivity).finishArea()
            }
        })
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        val etCreateArea = view.findViewById<EditText>(R.id.area_name)

        etCreateArea.setOnKeyListener(View.OnKeyListener { currentFocus, keyCode, event ->
            if (keyCode == KeyEvent.KEYCODE_ENTER && event.action == KeyEvent.ACTION_UP) {
                val inputMethodManager =
                    context!!.getSystemService(Context.INPUT_METHOD_SERVICE) as InputMethodManager
                inputMethodManager.hideSoftInputFromWindow(currentFocus.windowToken, 0)

                submit()
                return@OnKeyListener true
            }
            return@OnKeyListener false
        })

        submit_button.setOnClickListener {
            submit()
        }

    }

    private fun submit() {
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

    private fun createArea(name: String, enabled: Boolean) {
        ApiClient(activity!!)
            .createArea(name, enabled) { area, message ->
                if (area !== null) {
                    (activity as ServiceInformationActivity).nextStep(area, null, AreaCreationStatus.AreaCreated)
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