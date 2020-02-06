package com.b12powered.area.activities

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import com.b12powered.area.R
import com.b12powered.epicture.fragments.ToolbarFragment

class HomePageActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_home_page)

        val fragment = ToolbarFragment()

    }

}