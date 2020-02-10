package com.b12powered.area.activities

import android.os.Bundle
import android.os.PersistableBundle
import androidx.appcompat.app.AppCompatActivity
import com.b12powered.area.R

/**
 * The activity where the user can have all activites
 *
 * This class show the home page of the user connected
 */
class HomeActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_home)
    }


}
