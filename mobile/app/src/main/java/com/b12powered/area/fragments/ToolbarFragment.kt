package com.b12powered.area.fragments

import android.content.Context
import com.b12powered.area.R

import android.os.Bundle
import androidx.fragment.app.Fragment
import androidx.appcompat.app.AppCompatActivity
import android.view.ViewGroup
import android.view.View
import android.view.LayoutInflater
import android.widget.ImageButton
import android.content.Intent
import com.b12powered.area.activities.HomeActivity
import kotlinx.android.synthetic.main.fragment_toolbar.*

class ToolbarFragment : Fragment() {

    private lateinit var rootLayout: View

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

        searchbtnToolbar.setOnClickListener {
            println("search")
        }

        userbtnToolbar.setOnClickListener {
            println("user")
        }

        homebtnToolbar.setOnClickListener {
            println("home")
        }
    }
}