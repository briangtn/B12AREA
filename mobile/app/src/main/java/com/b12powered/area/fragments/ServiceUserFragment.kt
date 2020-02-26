package com.b12powered.area.fragments

import android.graphics.Color
import android.content.Intent
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import com.b12powered.area.R
import com.b12powered.area.Service
import com.b12powered.area.activities.ServiceInformationActivity
import com.bumptech.glide.Glide
import kotlinx.android.synthetic.main.fragment_service_user.*

class ServiceUserFragment(private val service: Service) : Fragment() {
    companion object {
        fun newInstance(service: Service): ServiceUserFragment {
            return ServiceUserFragment(service)
        }
    }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        super.onCreateView(inflater, container, savedInstanceState)

        return inflater.inflate(R.layout.fragment_service_user, container, false)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        Glide.with(this)
            .load(service.icon)
            .fitCenter()
            .into(icon)

        view.setBackgroundColor(Color.parseColor(service.color))
        super.onViewCreated(view, savedInstanceState)
        view.setOnClickListener {
            val intent = Intent(context, ServiceInformationActivity::class.java)
            intent.putExtra("service", service.toJSON())
            startActivity(intent)
        }
    }
}