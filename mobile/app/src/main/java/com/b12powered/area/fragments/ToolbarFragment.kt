package com.b12powered.area.fragments

import android.content.Context
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
import android.graphics.Color
import android.graphics.PorterDuff
import android.media.Image
import android.view.animation.Animation
import kotlinx.android.synthetic.main.fragment_toolbar.*

import com.b12powered.area.activities.HomeActivity
import com.b12powered.area.activities.SearchActivity
import com.b12powered.area.activities.SearchActivity.*
import com.b12powered.area.activities.UserActivity
import com.google.android.material.animation.AnimationUtils

class ToolbarFragment : Fragment() {

    private lateinit var rootLayout: View

    private enum class Activites {
        SEARCH,
        USER,
        HOME
    }

    companion object {
        private var currentActivity: Activites = Activites.HOME
    }

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        rootLayout = inflater.inflate(R.layout.fragment_toolbar, container, false)
        if (activity is AppCompatActivity){
            val toolbar = view?.findViewById<androidx.appcompat.widget.Toolbar>(R.id.toolbar)
            (activity as AppCompatActivity).setSupportActionBar(toolbar)
        }
        return rootLayout
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        searchbtnToolbar.findViewById<ImageButton>(R.id.searchbtnToolbar)
        userbtnToolbar.findViewById<ImageButton>(R.id.userbtnToolbar)
        homebtnToolbar.findViewById<ImageButton>(R.id.homebtnToolbar)

        handlingClickEffect(searchbtnToolbar, userbtnToolbar, homebtnToolbar)

        handlingClickListener(searchbtnToolbar, userbtnToolbar, homebtnToolbar)
    }

    private fun handlingClickEffect(searchBtnToolbar: ImageButton, userBtnToolbar: ImageButton, homeBtnToolbar: ImageButton) {
        if (currentActivity == Activites.HOME) {
            buttonEffect(searchbtnToolbar)
            buttonEffect(userbtnToolbar)
        } else if (currentActivity == Activites.SEARCH) {
            buttonEffect(userbtnToolbar)
            buttonEffect(homebtnToolbar)
        } else {
            buttonEffect(searchbtnToolbar)
            buttonEffect(homebtnToolbar)
        }
    }

    fun buttonEffect(button: View) {
        button.setOnTouchListener { v, event ->
            when (event.action) {
                MotionEvent.ACTION_DOWN -> {
                    v.background.setColorFilter(-0x1f0b8adf, PorterDuff.Mode.SRC_ATOP)
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
            if (currentActivity != Activites.SEARCH) {
                currentActivity = Activites.SEARCH
                val intent = Intent(this@ToolbarFragment.context, SearchActivity::class.java)
                startActivity(intent)
                activity?.overridePendingTransition(R.anim.slide_in_right, R.anim.slide_out_left)
            }
        }

        userBtnToolbar.setOnClickListener {
            if (currentActivity != Activites.USER) {
                currentActivity = Activites.USER
                val intent = Intent(this@ToolbarFragment.context, UserActivity::class.java)
                startActivity(intent)
                activity?.overridePendingTransition(R.anim.slide_in_left, R.anim.slide_out_right)
            }
        }

        homeBtnToolbar.setOnClickListener {
            if (currentActivity != Activites.HOME) {
                val intent = Intent(this@ToolbarFragment.context, HomeActivity::class.java)
                startActivity(intent)
                if (currentActivity == Activites.SEARCH) {
                    activity?.overridePendingTransition(R.anim.slide_in_left, R.anim.slide_out_right)
                } else {
                    activity?.overridePendingTransition(R.anim.slide_in_right, R.anim.slide_out_left)
                }
                currentActivity = Activites.HOME
            }
        }
    }
}