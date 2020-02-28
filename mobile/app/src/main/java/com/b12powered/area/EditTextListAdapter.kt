package com.b12powered.area

import android.content.Context
import android.text.Editable
import android.text.TextWatcher
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.BaseAdapter
import android.widget.EditText

/**
 * A custom adapter, used to inflate list of EditText in ListView
 *
 * @param context The context from where the [EditTextListAdapter] is created
 * @param editModelArrayList The array list of [EditModel], encapsulating EditText's values, to add to ListView
 */
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

    /**
     * Override method getView
     *
     * This method inflate the custom EditText layout in the view, and set its properties :
     *  - hint : The hint to display in the text field
     *  - onChange callback : Used in order to automatically trigger value update, as it is impossible to get EditText value by id, since they all have the same generic id
     *
     * @param position The position of the current EditText in the ListView
     * @param convertView The view in which the current EditText is inflated
     * @param parent The parent view group of the [convertView]
     */
    override fun getView(position: Int, convertView: View?, parent: ViewGroup?): View {
        val holder = ViewHolder()
        val view: View

        val inflater: LayoutInflater = context.getSystemService(Context.LAYOUT_INFLATER_SERVICE) as LayoutInflater

        view = inflater.inflate(R.layout.edittext_item, null, true)
        holder.editText = view.findViewById(R.id.editText)
        view.tag = holder

        holder.editText.hint = editModelArrayList[position].getEditTextHint()

        holder.editText.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(p0: CharSequence?, p1: Int, p2: Int, p3: Int) {}

            override fun onTextChanged(p0: CharSequence?, p1: Int, p2: Int, p3: Int) {
                editModelArrayList[position].setEditTextValue(holder.editText.text.toString())
            }

            override fun afterTextChanged(p0: Editable?) {}
        })
        return view
    }

    /**
     * A custom class used to encapsulate [EditText] to make it accessible through view's tag object
     */
    private class ViewHolder {
        lateinit var editText: EditText
    }
}