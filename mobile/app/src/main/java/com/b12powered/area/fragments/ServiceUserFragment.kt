package com.b12powered.area.fragments

import android.graphics.Bitmap
import android.graphics.Color
import android.graphics.drawable.Drawable
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.appcompat.content.res.AppCompatResources
import androidx.core.graphics.drawable.DrawableCompat
import androidx.fragment.app.Fragment
import com.b12powered.area.R
import com.b12powered.area.Service
import com.bumptech.glide.Glide
import com.bumptech.glide.request.target.CustomTarget
import com.bumptech.glide.request.transition.Transition
import kotlinx.android.synthetic.main.fragment_service_user.*


class ServiceFragment(private val service: Service) : Fragment() {
    companion object {
        fun newInstance(service: Service): ServiceFragment {
            return ServiceFragment(service)
        }
    }

    private var isFlipped = false

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        super.onCreateView(inflater, container, savedInstanceState)

        return inflater.inflate(R.layout.fragment_service, container, false)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        Glide.with(this)
            .load(service.icon)
            .fitCenter()
            .into(icon)

        val add = AppCompatResources.getDrawable(context!!, R.drawable.ic_add)
        val addWrap = DrawableCompat.wrap(add!!)

        Glide.with(this)
            .asBitmap()
            .load(service.icon)
            .into(object : CustomTarget<Bitmap>() {
                override fun onResourceReady(resource: Bitmap, transition: Transition<in Bitmap>?) {
                    val color = Palette.from(resource).generate().vibrantSwatch
                    if (color !== null) {
                        DrawableCompat.setTint(addWrap, color.rgb)
                        Glide.with(view)
                            .load(addWrap)
                            .into(plus)
                    }
                }

                override fun onLoadCleared(placeholder: Drawable?) {}
            })

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