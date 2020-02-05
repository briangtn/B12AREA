package com.b12powered.epicture.activities

import android.widget.*
import com.b12powered.area.R

import android.content.Intent
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.appcompat.widget.Toolbar
import com.b12powered.area.activities.HomePageActivity
import com.b12powered.area.activities.SearchPageActivity
import com.b12powered.area.activities.UserPageActivity

import kotlinx.android.synthetic.main.fragment_toolbar.*

class Toolbar : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.fragment_toolbar)

        configureToolbarInteractions()
    }

    private fun configureToolbarInteractions() {
        val toolbar: Toolbar = findViewById(R.id.toolbar)
        setSupportActionBar(toolbar)

        val btnHome = findViewById<ImageButton>(R.id.homebtnToolbar)
        val btnSearch = findViewById<ImageButton>(R.id.searchbtnToolbar)
        val btnUser = findViewById<ImageButton>(R.id.userbtnToolbar)

        btnHome.setOnClickListener {
            val intent = Intent(this, HomePageActivity::class.java)
            finish()
            startActivity(intent)
        }

        btnSearch.setOnClickListener {
            val intent = Intent(this, SearchPageActivity::class.java)
            finish()
            startActivity(intent)
        }

        btnUser.setOnClickListener {
            val intent = Intent(this, UserPageActivity::class.java)
            finish()
            startActivity(intent)
        }

    }
}