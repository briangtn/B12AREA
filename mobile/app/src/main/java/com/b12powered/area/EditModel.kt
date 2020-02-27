package com.b12powered.area

class EditModel {
    private lateinit var editTextValue: String
    private lateinit var editTextHint: String

    fun getEditTextValue(): String {
        if (::editTextValue.isInitialized)
            return editTextValue
        return ""
    }

    fun setEditTextValue(value: String) {
        editTextValue = value
    }

    fun getEditTextHint(): String {
        if (::editTextHint.isInitialized)
            return editTextHint
        return ""
    }

    fun setEditTextHint(value: String) {
        editTextHint = value
    }
}