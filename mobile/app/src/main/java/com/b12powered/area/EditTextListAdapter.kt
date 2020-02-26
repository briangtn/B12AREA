package com.b12powered.area

import android.content.Context
import android.text.Editable
import android.text.TextWatcher
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.BaseAdapter
import android.widget.EditText

class EditTextListAdapter(private val context: Context, private val editModelArrayList: ArrayList<EditModel>) : BaseAdapter() {

    override fun getCount(): Int {
        return editModelArrayList.size
    }

    override fun getItem(p0: Int): Any {
        return editModelArrayList[p0]
    }

    override fun getItemId(p0: Int): Long {
        return 0
    }

    override fun getView(position: Int, convertView: View?, parent: ViewGroup?): View {
        val holder: ViewHolder
        val view: View

        if (convertView == null) {
            holder = ViewHolder()

            val inflater: LayoutInflater = context.getSystemService(Context.LAYOUT_INFLATER_SERVICE) as LayoutInflater

            view = inflater.inflate(R.layout.edittext_item, null, true)
            holder.editText = view.findViewById(R.id.editText)
            view.tag = holder
        } else {
            view = convertView
            holder = convertView.tag as ViewHolder
        }

        holder.editText.hint = editModelArrayList[position].getEditTextValue()

        holder.editText.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(p0: CharSequence?, p1: Int, p2: Int, p3: Int) {}

            override fun onTextChanged(p0: CharSequence?, p1: Int, p2: Int, p3: Int) {
                editModelArrayList[position].setEditTextValue(holder.editText.text.toString())
            }

            override fun afterTextChanged(p0: Editable?) {}
        })
        return view
    }

    private class ViewHolder {
        lateinit var editText: EditText
    }
}