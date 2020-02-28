import Cookies from "universal-cookie";

const cookies = new Cookies();

let defaultAPI: string = '';

defaultAPI = (process.env.REACT_APP_API_URL !== undefined) ? process.env.REACT_APP_API_URL : 'http://localhost:8080';

const initialState = {
    language: (cookies.get('language')) ? cookies.get('language') : 'fr',
    api_url: (cookies.get('api_url')) ? cookies.get('api_url') : defaultAPI,
    token: (cookies.get('token')) ? cookies.get('token') : '',
    services: []
};

function rootReducer(state = initialState, action: any) {
    if (action.type === "SWITCH_LANGUAGE") {
        return { ...state, language: action.payload };
    } else if (action.type === "CHANGE_API_URL") {
        return { ...state, api_url: action.payload };
    } else if (action.type === "SET_TOKEN") {
        return { ...state, token: action.payload };
    } else if (action.type === "SET_SERVICES")
        return { ...state, services: action.payload };
    return state;
}

export default rootReducer;
