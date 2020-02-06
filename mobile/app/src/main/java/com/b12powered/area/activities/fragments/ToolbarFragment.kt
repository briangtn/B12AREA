package com.b12powered.epicture.fragments

import com.b12powered.area.R

import android.os.Bundle
import androidx.fragment.app.Fragment
import androidx.appcompat.app.AppCompatActivity
import android.view.ViewGroup
import android.view.View
import android.view.LayoutInflater
import android.widget.ImageButton
import android.content.Intent
import android.widget.Toolbar
import com.b12powered.area.activities.HomePageActivity
import com.b12powered.area.activities.SearchPageActivity
import com.b12powered.area.activities.UserPageActivity

class ToolbarFragment : Fragment() {

    private lateinit var rootLayout: View

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        rootLayout = inflater.inflate(R.layout.fragment_toolbar, container, false)
        if(activity is AppCompatActivity){
            val toolbar = view?.findViewById<androidx.appcompat.widget.Toolbar>(R.id.toolbar)
            (activity as AppCompatActivity).setSupportActionBar(toolbar)
        }
        val homebtn = view?.findViewById<ImageButton>(R.id.homebtnToolbar)
        val userbtn = view?.findViewById<ImageButton>(R.id.userbtnToolbar)
        val searchbtn = view?.findViewById<ImageButton>(R.id.searchbtnToolbar)

        homebtn?.setOnClickListener {
            val intent = Intent(this@ToolbarFragment.context, HomePageActivity::class.java)
            startActivity(intent)
        }

        userbtn?.setOnClickListener {
            val intent = Intent(this@ToolbarFragment.context, UserPageActivity::class.java)
            startActivity(intent)
        }

        searchbtn?.setOnClickListener {
            val intent = Intent(this@ToolbarFragment.context, SearchPageActivity::class.java)
            startActivity(intent)
        }
        return rootLayout
    }
}