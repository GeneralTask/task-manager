import ReactGA from 'react-ga4'

export type EVENT_CATEGORIES = 'Notes' // | 'Tasks' | 'Settings', etc

const useAnalyticsEventTracker = (category: EVENT_CATEGORIES) => {
    const GALog = (action: string, label?: string) => {
        ReactGA.event({ category, action, label })
    }
    return GALog
}

export default useAnalyticsEventTracker
