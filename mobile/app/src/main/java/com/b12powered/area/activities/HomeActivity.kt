package com.b12powered.area.activities

import android.app.AlertDialog
import android.content.Context
import android.content.DialogInterface
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import com.auth0.android.jwt.JWT
import com.b12powered.area.*
import com.b12powered.area.api.ApiClient
import com.b12powered.area.fragments.ServiceUserFragment
import java.util.*
import kotlin.collections.ArrayList

/**
 * The activity where the user can have all services
 *
 * This class show the home page of the user connected
 */
class HomeActivity : AppCompatActivity() {

    private lateinit var handler: Handler /*!< [handler] Handler -> used for refresh the current token of the user */
    private lateinit var currentUser: User /*!< [currentUser] User -> contain the information about the current user connected */
    private var serviceList: ArrayList<Service> = ArrayList() /*!< [serviceList] ArrayList<Service> -> contain all the service information */

    /**
     * Override method onCreate
     *
     * Perform an api call on /me to get current user. If the call failed, redirect to Login Page
     */
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_home)

        val data: Uri? = intent?.data

        if (data !== null) {
            val code: String? = data.getQueryParameter("code")
            if (code !== null) {
                ApiClient(this)
                    .dataCode(code) { user, message ->
                        if (user !== null) {
                            val sharedPreferences = getSharedPreferences(getString(R.string.storage_name), Context.MODE_PRIVATE)
                            val editor = sharedPreferences.edit()

                            editor.putString(getString(R.string.token_key), user.toObject<User>().token)
                            editor.apply()
                            checkTokenValidity()
                        } else {
                            Toast.makeText(
                                this,
                                message,
                                Toast.LENGTH_SHORT
                            ).show()
                        }
                    }
            }
        } else {
            checkTokenValidity()
        }
        findSubscribeService()

        handler = Handler(Looper.getMainLooper())

        handler.post(object : Runnable {
            override fun run() {
                val sharedPreferences = getSharedPreferences(getString(R.string.storage_name), Context.MODE_PRIVATE)

                if (!sharedPreferences.contains(getString(R.string.token_key))) {
                    return
                }

                val token = sharedPreferences.getString(getString(R.string.token_key), null)
                val jwt = JWT(token!!)
                val expirationDate = jwt.expiresAt

                if (expirationDate!!.time - Date().time < 60000) {
                    ApiClient(this@HomeActivity)
                        .refreshToken { newToken, _ ->
                            if (newToken !== null) {
                                val editor = sharedPreferences.edit()

                                editor.putString(getString(R.string.token_key), newToken)
                                editor.apply()
                            }
                        }
                }
                handler.postDelayed(this, 60000)
            }
        })

        onBackPressedDispatcher.addCallback(object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                showDialog()
            }
        })
    }
    
    /**
     * Find all subscribe service for the user
     *
     * Perform an API call on /me to get the current user and get all services he subscribe
     */
    private fun findSubscribeService() {
        ApiClient(this)
            .getUser { user, message ->
                if (user != null) {
                    ApiClient(this)
                        .aboutJson { about, msg ->
                            if (about !== null) {
                                about.server.services.forEach { service ->
                                    if (user.services.contains(service.name)) {
                                        supportFragmentManager.beginTransaction()
                                            .add(
                                                R.id.list_layout,
                                                ServiceUserFragment.newInstance(service)
                                            )
                                            .commit()
                                        serviceList.add(service)
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
                    val intent = Intent(this, LoginActivity::class.java)
                    finish()
                    startActivity(intent)
                }
            }
    }

    /**
     * Check the token validity
     */
    private fun checkTokenValidity() {
        ApiClient(this)
            .getUser { user, message ->
                if (user != null) {
                    currentUser = user
                } else {
                    Toast.makeText(
                        this,
                        message,
                        Toast.LENGTH_SHORT
                    ).show()

                    val sharedPreferences = getSharedPreferences(getString(R.string.storage_name), Context.MODE_PRIVATE)
                    val editor = sharedPreferences.edit()

                    editor.remove(getString(R.string.token_key))
                    editor.apply()

                    val intent = Intent(this, LoginActivity::class.java)
                    finish()
                    startActivity(intent)
                }
            }
    }

    /**
     * Show a dialog asking the user if they want to exit the application
     */
    private fun showDialog() {
        val builder = AlertDialog.Builder(this)
        val dialogClickListener = DialogInterface.OnClickListener { dialog, which ->
            when(which) {
                DialogInterface.BUTTON_POSITIVE -> finishAffinity()
                DialogInterface.BUTTON_NEGATIVE -> dialog.dismiss()
            }
        }
        builder
            .setTitle(getString(R.string.exit_app))
            .setPositiveButton(getString(R.string.yes), dialogClickListener)
            .setNegativeButton(getString(R.string.no), dialogClickListener)
            .create()
            .show()
    }
}
