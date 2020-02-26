package com.b12powered.area

sealed class AreaCreationStatus {
    object AreaCreated : AreaCreationStatus()
    object ActionSelected : AreaCreationStatus()
    object ActionAdded : AreaCreationStatus()
    object ReactionSelected : AreaCreationStatus()
    object ReactionAdded : AreaCreationStatus()
}