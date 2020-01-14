const initialState = {
    language: 'fr'
};

function rootReducer(state = initialState, action: any) {
    if (action.type === "SWITCH_LANGUAGE") {
        console.log(action.payload);
        state.language = action.payload;
        console.log(state.language);
    }
    return state;
}

export default rootReducer;
