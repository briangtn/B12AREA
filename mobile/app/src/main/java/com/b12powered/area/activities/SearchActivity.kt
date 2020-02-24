package com.b12powered.area.activities

import android.os.Bundle
import android.widget.Toast
import com.b12powered.area.R
import androidx.appcompat.app.AppCompatActivity
import com.b12powered.area.api.ApiClient
import com.b12powered.area.fragments.ServiceFragment


class SearchActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_search)

        ApiClient(this)
            .aboutJson { about, message ->
                if (about !== null) {
                    about.server.services.forEach { service ->
                        supportFragmentManager.beginTransaction()
                            .add(R.id.search, ServiceFragment.newInstance(service))
                            .commit()
                    }
                } else {
                    Toast.makeText(
                        this,
                        message,
                        Toast.LENGTH_SHORT
                    ).show()
                }
            }
    }

}
