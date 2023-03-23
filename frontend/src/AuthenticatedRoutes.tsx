import { lazy } from 'react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { Toaster, resolveValue } from 'react-hot-toast'
import { Outlet, Route, Routes } from 'react-router-dom'
import { enableMapSet } from 'immer'
import StyledToastContainer from './components/atoms/toast/StyledToastContainer'
import { CalendarContextProvider } from './components/calendar/CalendarContext'
import Toast from './components/molecules/Toast'
import FocusModeScreen from './components/screens/FocusModeScreen'
import MainScreen from './components/screens/MainScreen'
import { FOCUS_MODE_ROUTE } from './constants'
import AppContextProvider from './context/AppContextProvider'

const TermsOfServiceSummaryScreen = lazy(() => import('./components/screens/TermsOfServiceSummaryScreen'))
enableMapSet() // this allows immer to produce immutable maps and sets

const AuthenticatedRoutes = () => {
    return (
        <>
            {/* {isDevelopmentMode && <ReactQueryDevtools initialIsOpen={false} position="top-left" />} */}
            <DndProvider backend={HTML5Backend}>
                <AppContextProvider>
                    <Routes>
                        <Route path="tos-summary" element={<Outlet />}>
                            <Route index element={<TermsOfServiceSummaryScreen />} />
                        </Route>
                        <Route path="overview" element={<Outlet />}>
                            <Route index element={<MainScreen />} />
                            <Route path=":overviewViewId" element={<MainScreen />}>
                                <Route path=":overviewItemId" element={<MainScreen />}>
                                    <Route path=":subtaskId" element={<MainScreen />} />
                                </Route>
                            </Route>
                        </Route>
                        <Route path="recurring-tasks" element={<Outlet />}>
                            <Route index element={<MainScreen />} />
                            <Route path=":recurringTaskId" element={<MainScreen />} />
                        </Route>
                        <Route path="tasks" element={<Outlet />}>
                            <Route index element={<MainScreen />} />
                            <Route path=":section" element={<MainScreen />}>
                                <Route path=":task" element={<MainScreen />}>
                                    <Route path=":subtaskId" element={<MainScreen />} />
                                </Route>
                            </Route>
                        </Route>
                        <Route path="pull-requests" element={<Outlet />}>
                            <Route index element={<MainScreen />} />
                            <Route path=":pullRequest" element={<MainScreen />} />
                        </Route>
                        <Route path="linear" element={<Outlet />}>
                            <Route index element={<MainScreen />} />
                            <Route path=":linearIssueId" element={<MainScreen />} />
                        </Route>
                        <Route path="slack" element={<Outlet />}>
                            <Route index element={<MainScreen />} />
                            <Route path=":slackTaskId" element={<MainScreen />} />
                        </Route>
                        <Route path="jira" element={<Outlet />}>
                            <Route index element={<MainScreen />} />
                            <Route path=":jiraTaskId" element={<MainScreen />} />
                        </Route>
                        <Route path={FOCUS_MODE_ROUTE} element={<Outlet />}>
                            <Route
                                index
                                element={
                                    <CalendarContextProvider isPopoverDisabled={true}>
                                        <FocusModeScreen />
                                    </CalendarContextProvider>
                                }
                            />
                        </Route>
                        <Route path="notes" element={<Outlet />}>
                            <Route index element={<MainScreen />} />
                            <Route path=":noteId" element={<MainScreen />} />
                        </Route>
                        <Route path="super-dashboard" element={<Outlet />}>
                            <Route index element={<MainScreen />} />
                        </Route>
                    </Routes>
                </AppContextProvider>
                <StyledToastContainer />
                <Toaster position="bottom-right" reverseOrder>
                    {(t) => <Toast toast={t}>{resolveValue(t.message, t)}</Toast>}
                </Toaster>
            </DndProvider>
        </>
    )
}

export default AuthenticatedRoutes
