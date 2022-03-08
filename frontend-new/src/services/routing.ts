import { Platform } from 'react-native'
import { BrowserRouter, Link as BrowserLink, Navigate as BrowserNavigate, Outlet as BrowserOutlet, Route as BrowserRoute, Routes as BrowserRoutes, useLocation as useLocationBrowser, useNavigate as useNavigateBrowser, useParams as useParamsBrowser } from 'react-router-dom'
import { Link as NativeLink, NativeRouter, Navigate as NativeNavigate, Outlet as NativeOutlet, Route as NativeRoute, Routes as NativeRoutes, useLocation as useLocationNative, useNavigate as useNavigateNative, useParams as useParamsNative } from 'react-router-native'

const Router = Platform.OS === 'web' ? BrowserRouter : NativeRouter
const Routes = Platform.OS === 'web' ? BrowserRoutes : NativeRoutes
const Route = Platform.OS === 'web' ? BrowserRoute : NativeRoute
const Link = Platform.OS === 'web' ? BrowserLink : NativeLink
const Outlet = Platform.OS === 'web' ? BrowserOutlet : NativeOutlet
const Navigate = Platform.OS === 'web' ? BrowserNavigate : NativeNavigate
const useNavigate = Platform.OS === 'web' ? useNavigateBrowser : useNavigateNative
const useParams = Platform.OS === 'web' ? useParamsBrowser : useParamsNative
const useLocation = Platform.OS === 'web' ? useLocationBrowser : useLocationNative

export {
    Router,
    Routes,
    Route,
    Link,
    Outlet,
    Navigate,
    useNavigate,
    useParams,
    useLocation,
}
