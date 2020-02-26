package com.b12powered.area

class EditModel {
    private lateinit var editTextValue: String

    fun getEditTextValue(): String {
        if (::editTextValue.isInitialized)
            return editTextValue
        return ""
    }

    fun setEditTextValue(value: String) {
        editTextValue = value
    }
}