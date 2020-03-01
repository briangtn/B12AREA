package com.b12powered.area.fragments

import android.animation.Animator
import android.animation.ObjectAnimator
import android.app.AlertDialog
import android.content.DialogInterface
import android.content.Intent
import android.graphics.Color
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.view.animation.AccelerateDecelerateInterpolator
import android.view.animation.DecelerateInterpolator
import android.widget.Toast
import androidx.fragment.app.Fragment
import com.b12powered.area.R
import com.b12powered.area.Service
import com.b12powered.area.api.ApiClient
import com.bumptech.glide.Glide
import kotlinx.android.synthetic.main.fragment_service.*

/**
 * A fragment displaying clickable service in order to subscribe to it
 *
 * @param service The service to show
 */
class ServiceFragment(private val service: Service) : Fragment() {

    companion object {

        /**
         * This method return a new instance of [ServiceFragment]
         *
         * @param service The service to show
         *
         * @return A new instance of [ServiceFragment]
         */
        fun newInstance(service: Service): ServiceFragment {
            return ServiceFragment(service)
        }
    }

    private var isFlipped = false /*!< [_isFlipped] Boolean -> true if the card is flipped, false otherwise */

    /**
     * Override method onCreateView
     *
     * Set the appropriate layout to the current fragment
     */
    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        super.onCreateView(inflater, container, savedInstanceState)

        return inflater.inflate(R.layout.fragment_service, container, false)
    }

    /**
     * Override method onViewCreated
     *
     * Load service image from url
     */
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        Glide.with(this)
            .load(service.icon)
            .fitCenter()
            .into(icon)

        Glide.with(view)
            .load(R.drawable.ic_add)
            .into(plus)

        plus.imageAlpha = 0

        view.setBackgroundColor(Color.parseColor(service.color))
        view.setOnClickListener {
            when (isFlipped) {
                true -> showDialog()
                false -> flipCard()
            }
        }
        super.onViewCreated(view, savedInstanceState)
    }

    /**
     * Show a dialog asking the user if they want to subscribe to the service
     */
    private fun showDialog() {
        val builder = AlertDialog.Builder(context)
        val dialogClickListener = DialogInterface.OnClickListener { _, which ->
            when(which) {
                DialogInterface.BUTTON_POSITIVE -> subscribeService()
                DialogInterface.BUTTON_NEGATIVE -> flipCard()
            }
        }
        builder
            .setTitle(getString(R.string.subscribe_service))
            .setMessage(getString(R.string.subscribe_service_message) + service.displayName + " ?")
            .setPositiveButton(getString(R.string.confirm), dialogClickListener)
            .setNegativeButton(getString(R.string.cancel), dialogClickListener)
            .create()
            .show()
    }

    /**
     * Make a subscribeService request to api. If the call is successful, redirect the user to the service's oauth page, if not display a toast with the error
     */
    private fun subscribeService() {
        ApiClient(context!!)
            .loginService(service.name, "area://search") { uri, message ->
                if (uri != null) {
                    val intent = Intent(Intent.ACTION_VIEW, uri)
                    startActivity(intent)
                } else {
                    Toast.makeText(
                        context!!,
                        message,
                        Toast.LENGTH_SHORT
                    ).show()
                }
            }
    }

    /**
     * Set a flip animation to service card
     */
    private fun flipCard() {
        val objectAnimator1 = ObjectAnimator.ofFloat(view, "scaleX", 1f, 0f)
        val objectAnimator2 = ObjectAnimator.ofFloat(view, "scaleX", 0f, 1f)

        objectAnimator1.interpolator = DecelerateInterpolator()
        objectAnimator2.interpolator = AccelerateDecelerateInterpolator()

        objectAnimator1.addListener(object: Animator.AnimatorListener {

            override fun onAnimationStart(animator: Animator?) {}

            override fun onAnimationEnd(animator: Animator?) {
                when (isFlipped) {
                    false -> {
                        icon.imageAlpha = 0
                        plus.imageAlpha = 255
                    }
                    true -> {
                        icon.imageAlpha = 255
                        plus.imageAlpha = 0
                    }
                }
                isFlipped = !isFlipped
                objectAnimator2.start()
            }

            override fun onAnimationCancel(animator: Animator?) {}

            override fun onAnimationRepeat(animator: Animator?) {}
        })
        objectAnimator1.start()
    }
}