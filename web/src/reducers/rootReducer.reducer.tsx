import Cookies from "universal-cookie";

const cookies = new Cookies();

const initialState = {
    language: (cookies.get('language')) ? cookies.get('language') : 'fr'
};

function rootReducer(state = initialState, action: any) {
    if (action.type === "SWITCH_LANGUAGE") {
        return { ...state, language: action.payload };
    }
    return state;
}

export default rootReducer;
