import { BrowserRouter, Routes as BrowserRoutes, Route as BrowserRoute, Link as BrowserLink, Outlet as BrowserOutlet, Navigate as BrowserNavigate, useParams as useParamsBrowser } from 'react-router-dom'
import { NativeRouter, Routes as NativeRoutes, Route as NativeRoute, Link as NativeLink, Outlet as NativeOutlet, Navigate as NativeNavigate, useParams as useParamsNative } from 'react-router-native'
import { Platform } from 'react-native'

const Router = Platform.OS === 'web' ? BrowserRouter : NativeRouter
const Routes = Platform.OS === 'web' ? BrowserRoutes : NativeRoutes
const Route = Platform.OS === 'web' ? BrowserRoute : NativeRoute
const Link = Platform.OS === 'web' ? BrowserLink : NativeLink
const Outlet = Platform.OS === 'web' ? BrowserOutlet : NativeOutlet
const Navigate = Platform.OS === 'web' ? BrowserNavigate : NativeNavigate
const useParams = Platform.OS === 'web' ? useParamsBrowser : useParamsNative

export {
    Router,
    Routes,
    Route,
    Link,
    Outlet,
    Navigate,
    useParams
}
