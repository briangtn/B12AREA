import Cookies from "universal-cookie";

const cookies = new Cookies();

const defaultAPI: string = (process.env.NODE_ENV === "production") ? 'https://api.area.b12powered.com' : 'https://dev.api.area.b12powered.com';

const initialState = {
    language: (cookies.get('language')) ? cookies.get('language') : 'fr',
    api_url: (cookies.get('api_url')) ? cookies.get('api_url') : defaultAPI,
    token: (cookies.get('token')) ? cookies.get('token') : ''
};

function rootReducer(state = initialState, action: any) {
    if (action.type === "SWITCH_LANGUAGE") {
        return { ...state, language: action.payload };
    } else if (action.type === "CHANGE_API_URL") {
        return { ...state, api_url: action.payload };
    } else if (action.type === "SET_TOKEN") {
        return { ...state, token: action.payload };
    }
    return state;
}

export default rootReducer;
