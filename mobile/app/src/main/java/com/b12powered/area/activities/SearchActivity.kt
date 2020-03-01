package com.b12powered.area.activities

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import com.b12powered.area.Status
import com.b12powered.area.api.ApiClient
import com.b12powered.area.fragments.ServiceFragment
import com.b12powered.area.fragments.ToolbarFragment
import com.b12powered.area.toObject
import com.b12powered.area.R


/**
 * The activity where every available service to which the user can subscribe
 */
class SearchActivity : AppCompatActivity() {

    object GlobalVars {
        var isPassed: Number = 0
    }

    private var haveService : Boolean = false

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
                            haveService = false
                            if (about !== null) {
                                about.server.services.forEach { service ->
                                    if (!user.services.contains(service.name)) {
                                        haveService = true
                                        supportFragmentManager.beginTransaction()
                                            .add(R.id.list_layout, ServiceFragment.newInstance(service))
                                            .commit()
                                    }
                                }
                                if (!haveService && GlobalVars.isPassed == 0) {
                                    GlobalVars.isPassed = 1
                                    val intent = Intent(this, HomeActivity::class.java)
                                    finish()
                                    startActivity(intent)
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

        onBackPressedDispatcher.addCallback(object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                (supportFragmentManager.findFragmentById(R.id.toolbar_fragment) as ToolbarFragment).setCurrentActivity(ToolbarFragment.Activity.HOME)
                val intent = Intent(this@SearchActivity, HomeActivity::class.java)
                startActivity(intent)
                overridePendingTransition(R.anim.slide_in_left, R.anim.slide_out_right)
            }
        })
    }

}
