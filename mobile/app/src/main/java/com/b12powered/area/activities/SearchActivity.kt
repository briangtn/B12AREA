package com.b12powered.area.activities

import android.net.Uri
import android.os.Bundle
import android.widget.Toast
import com.b12powered.area.R
import androidx.appcompat.app.AppCompatActivity
import com.b12powered.area.Status
import com.b12powered.area.api.ApiClient
import com.b12powered.area.fragments.ServiceFragment
import com.b12powered.area.toObject

/**
 * The activity where every available service to which the user canc subscribe
 */
class SearchActivity : AppCompatActivity() {

    /**
     * Override method onCreate
     *
     * Set a custom fragment for every service currently not subscribed by the user
     */
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_search)

        val data: Uri? = intent?.data

        if (data !== null) {
            val code: String? = data.getQueryParameter("code")

            if (code !== null) {
                ApiClient(this)
                    .dataCode(code) { status, message ->
                        if (status !== null){
                            Toast.makeText(
                                this,
                                status.toObject<Status>().status,
                                Toast.LENGTH_SHORT
                            ).show()
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

        ApiClient(this)
            .getUser { user, message ->
                if (user !== null) {
                    ApiClient(this)
                        .aboutJson { about, msg ->
                            if (about !== null) {
                                about.server.services.forEach { service ->
                                    if (!user.services.contains(service.name)) {
                                        supportFragmentManager.beginTransaction()
                                            .add(R.id.search, ServiceFragment.newInstance(service))
                                            .commit()
                                    }
                                }
                            } else {
                                Toast.makeText(
                                    this,
                                    msg,
                                    Toast.LENGTH_SHORT
                                ).show()
                            }
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
