const initialState = {
    language: 'fr'
};

function rootReducer(state = initialState, action: any) {
    if (action.type === "SWITCH_LANGUAGE") {
        return { ...state, language: action.payload };
    }
    return state;
}

export default rootReducer;
