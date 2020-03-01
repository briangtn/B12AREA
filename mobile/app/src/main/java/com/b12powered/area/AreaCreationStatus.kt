package com.b12powered.area

/**
 * Sealed class for handling the different fragment when the areas is created
 */
sealed class AreaCreationStatus {
    object AreaCreated : AreaCreationStatus()
    object ActionSelected : AreaCreationStatus()
    object ActionAdded : AreaCreationStatus()
    object ReactionSelected : AreaCreationStatus()
    object ReactionAdded : AreaCreationStatus()
    object AdditionalReactionSelected : AreaCreationStatus()
    object AdditionalReactionAdded : AreaCreationStatus()
}