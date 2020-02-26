package com.b12powered.area

class EditModel {
    private lateinit var editTextValue: String

    fun getEditTextValue(): String {
        return editTextValue
    }

    fun setEditTextValue(value: String) {
        editTextValue = value
    }
}