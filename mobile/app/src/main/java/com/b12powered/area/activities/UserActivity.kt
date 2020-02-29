package com.b12powered.area.activities

import android.content.Context
import android.os.Bundle
import com.b12powered.area.R
import com.b12powered.area.api.ApiClient
import android.widget.Toast
import android.content.Intent
import android.widget.EditText
import android.widget.TextView
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import com.b12powered.area.User
import com.b12powered.area.fragments.ToolbarFragment
import kotlinx.android.synthetic.main.activity_user.*

/**
 * The activity where th user can modified is password or activate 2fa
 *
 * This class can modified the password and activate 2fa, request the api for modified password and activate 2fa
 */
class UserActivity : AppCompatActivity() {

    private var _faActivated: Boolean = false
    private lateinit var _user: User

    /**
     * Override method onCreate
     *
     * Set listeners to view's buttons modified password and activate 2fa
     *
     * Set listeners to editText for log out
     *
     * Print all role of the current user
     */
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_user)

        emailUser()

        log_out.setOnClickListener {
            logout()
        }

        change_password_button.setOnClickListener {
            submitChangePassword()
        }

        onBackPressedDispatcher.addCallback(object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                (supportFragmentManager.findFragmentById(R.id.toolbar_fragment) as ToolbarFragment).setCurrentActivity(ToolbarFragment.Activity.HOME)
                val intent = Intent(this@UserActivity, HomeActivity::class.java)
                startActivity(intent)
                overridePendingTransition(R.anim.slide_in_right, R.anim.slide_out_left)
            }
        })
    }

    private fun show2fa() {
        val disable2fa: String = getString(R.string.disable_two_fa)

        val activate2fa: String = getString(R.string.activate_two_fa)

        if (_faActivated)
            activate_two_fa_button.text = disable2fa
        else
            activate_two_fa_button.text = activate2fa
        activate_two_fa_button.setOnClickListener {
            if (_faActivated)
                disable2fa()
            else
                activate2fa()
        }

    }

    /**
     * Print the email of the user currently connected
     */
    private fun emailUser() {
        val etUserRole = findViewById<TextView>(R.id.role_account)

        ApiClient(this)
            .getUser { user, message ->
                if (user != null) {
                    val etEmail = findViewById<EditText>(R.id.email)
                    _user = user
                    etEmail.hint = _user.email
                    _faActivated = _user.twoFactorAuthenticationEnabled
                    println(_faActivated)
                    for (i in user.role) {
                        if (etUserRole.text == null) {
                            etUserRole.text = i
                        } else {
                            etUserRole.text = etUserRole.text.toString() + " " + i
                        }
                    }
                    show2fa()
                } else {
                    Toast.makeText(
                        this,
                        message,
                        Toast.LENGTH_SHORT
                    ).show()
                }
            }
    }

    /**
     * Activate the 2fa
     */
    private fun activate2fa() {
        ApiClient(this)
            .activate2fa { url, message ->
                if (url != null) {
                    val secret = url.substringAfter("secret=")
                    val intent = Intent(this, ConfirmTwoFAActivity::class.java)
                    intent.putExtra("secret", secret)
                    finish()
                    startActivity(intent)
                } else {
                    Toast.makeText(
                        this,
                        message,
                        Toast.LENGTH_SHORT
                    ).show()
                }
            }
    }

    /**
     * Disable the 2fa
     */
    private fun disable2fa() {
        val newUser = User(_user.id, _user.email, "", "", _user.role, _user.services, _user.require2fa, false)

        ApiClient(this)
            .patchUser(newUser) { user, message ->
                if (user != null) {
                    val activate2fa: String = getString(R.string.activate_two_fa)
                    activate_two_fa_button.text = activate2fa
                    _faActivated = false
                    _user = user

                } else {
                    Toast.makeText(
                        this,
                        message,
                        Toast.LENGTH_SHORT
                    ).show()
                }
            }
    }

    /**
     * Check change password parameters validity
     */
    private fun submitChangePassword() {
        val etNewPassword = findViewById<EditText>(R.id.user_new_password)
        val etConfirmNewPassword = findViewById<EditText>(R.id.user_new_password_confirm)

        val newPassword = etNewPassword.text
        val newConfirmPassword = etConfirmNewPassword.text

        etNewPassword.clearFocus()
        etConfirmNewPassword.clearFocus()

        etNewPassword.error = null
        etConfirmNewPassword.error = null

        when {
            newPassword.isEmpty() -> etNewPassword.error = getString(R.string.no_password)
            newConfirmPassword.isEmpty() -> etConfirmNewPassword.error = getString(R.string.no_confirm_password)
            newPassword.toString() != newConfirmPassword.toString() -> {
                etConfirmNewPassword.setText("")
                etConfirmNewPassword.error = getString(R.string.different_password)
            }
        }
        if (newPassword.isNotEmpty() && newConfirmPassword.isNotEmpty() && newPassword.toString() == newConfirmPassword.toString()) {
            changePassword(newPassword.toString())
        }
    }

    /**
     * Log out the current user
     */
    private fun logout() {
        val sharedPreferences = getSharedPreferences(getString(R.string.storage_name), Context.MODE_PRIVATE)
        val editor = sharedPreferences.edit()

        editor.remove(getString(R.string.token_key))
        editor.apply()

        (supportFragmentManager.findFragmentById(R.id.toolbar_fragment) as ToolbarFragment).setCurrentActivity(ToolbarFragment.Activity.HOME)
        val intent = Intent(this, LoginActivity::class.java)
        finish()
        startActivity(intent)
    }

    /**
     * Change the password of the current user with a patchUser request
     */
    private fun changePassword(password: String) {
        val newUser = User(_user.id, _user.email, password, "", _user.role, _user.services, _user.require2fa, _user.twoFactorAuthenticationEnabled)

        ApiClient(this)
            .patchUser(newUser) { user, message ->
                if (user != null) {
                    _user = user
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
