package com.b12powered.area.fragments

import com.b12powered.area.R

import android.view.MotionEvent
import android.os.Bundle
import androidx.fragment.app.Fragment
import androidx.appcompat.app.AppCompatActivity
import android.view.ViewGroup
import android.view.View
import android.view.LayoutInflater
import android.widget.ImageButton
import android.content.Intent
import android.graphics.PorterDuff
import androidx.core.content.ContextCompat
import kotlinx.android.synthetic.main.fragment_toolbar.*
import com.b12powered.area.activities.HomeActivity
import com.b12powered.area.activities.SearchActivity
import com.b12powered.area.activities.UserActivity

class ToolbarFragment : Fragment() {

    private lateinit var rootLayout: View

    enum class Activity {
        SEARCH,
        USER,
        HOME
    }

    companion object {
        private var currentActivity: Activity = Activity.HOME
    }

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        rootLayout = inflater.inflate(R.layout.fragment_toolbar, container, false)
        if (activity is AppCompatActivity) {
            val toolbar = view?.findViewById<androidx.appcompat.widget.Toolbar>(R.id.toolbar)
            (activity as AppCompatActivity).setSupportActionBar(toolbar)
        }
        return rootLayout
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        search_button_toolbar.findViewById<ImageButton>(R.id.search_button_toolbar)
        user_button_toolbar.findViewById<ImageButton>(R.id.user_button_toolbar)
        home_button_toolbar.findViewById<ImageButton>(R.id.home_button_toolbar)

        handlingClickEffect(search_button_toolbar, user_button_toolbar, home_button_toolbar)

        handlingClickListener(search_button_toolbar, user_button_toolbar, home_button_toolbar)
    }

    private fun handlingClickEffect(searchBtnToolbar: ImageButton, userBtnToolbar: ImageButton, homeBtnToolbar: ImageButton) {
        when(currentActivity) {
            Activity.HOME -> {
                homeBtnToolbar.setColorFilter(ContextCompat.getColor(context!!, R.color.colorSecondary), PorterDuff.Mode.SRC_IN)
                buttonEffect(searchBtnToolbar)
                buttonEffect(userBtnToolbar)
            }
            Activity.SEARCH -> {
                searchBtnToolbar.setColorFilter(ContextCompat.getColor(context!!, R.color.colorSecondary), PorterDuff.Mode.SRC_IN)
                buttonEffect(userBtnToolbar)
                buttonEffect(homeBtnToolbar)
            }
            else -> {
                userBtnToolbar.setColorFilter(ContextCompat.getColor(context!!, R.color.colorSecondary), PorterDuff.Mode.SRC_IN)
                buttonEffect(searchBtnToolbar)
                buttonEffect(homeBtnToolbar)
            }
        }
    }

    private fun buttonEffect(button: View) {
        button.setOnTouchListener { v, event ->
            when (event.action) {
                MotionEvent.ACTION_DOWN -> {
                    v.invalidate()
                }
                MotionEvent.ACTION_UP -> {
                    v.background.clearColorFilter()
                    v.invalidate()
                }
            }
            false
        }
    }

    private fun handlingClickListener(searchBtnToolbar: ImageButton, userBtnToolbar: ImageButton, homeBtnToolbar: ImageButton) {

        searchBtnToolbar.setOnClickListener {
            if (currentActivity != Activity.SEARCH) {
                currentActivity = Activity.SEARCH
                val intent = Intent(this@ToolbarFragment.context, SearchActivity::class.java)
                startActivity(intent)
                activity?.overridePendingTransition(R.anim.slide_in_right, R.anim.slide_out_left)
            }
        }

        userBtnToolbar.setOnClickListener {
            if (currentActivity != Activity.USER) {
                currentActivity = Activity.USER
                val intent = Intent(this@ToolbarFragment.context, UserActivity::class.java)
                startActivity(intent)
                activity?.overridePendingTransition(R.anim.slide_in_left, R.anim.slide_out_right)
            }
        }

        homeBtnToolbar.setOnClickListener {
            if (currentActivity != Activity.HOME) {
                val intent = Intent(this@ToolbarFragment.context, HomeActivity::class.java)
                startActivity(intent)
                if (currentActivity == Activity.SEARCH) {
                    activity?.overridePendingTransition(R.anim.slide_in_left, R.anim.slide_out_right)
                } else {
                    activity?.overridePendingTransition(R.anim.slide_in_right, R.anim.slide_out_left)
                }
                currentActivity = Activity.HOME
            }
        }
    }

    fun setCurrentActivity(activity: Activity) {
        currentActivity = activity
    }
}