export function changeApiUrl(payload: any) {
    return { type: "CHANGE_API_URL", payload };
}

export function setToken(payload: any) {
    return { type: "SET_TOKEN", payload };
}

export function setAdminToken(payload: any) {
    return { type: "SET_ADMIN_TOKEN", payload };
}
