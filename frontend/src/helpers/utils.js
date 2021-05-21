import Cookies from 'js-cookie';
import {REACT_APP_FRONTEND_BASE_URL} from '../constants'

export const getAuthToken = () => Cookies.get("authToken");
export const getHeaders = () => ({
    Authorization: "Bearer " + getAuthToken(),
    "Access-Control-Allow-Origin": REACT_APP_FRONTEND_BASE_URL,
    "Access-Control-Allow-Headers": "access-control-allow-origin, access-control-allow-headers",
});