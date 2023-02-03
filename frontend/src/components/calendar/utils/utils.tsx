import { TCalendarAccount } from '../../../utils/types'
import GTButton from '../../atoms/buttons/GTButton'
import { DEFAULT_CALENDAR_COLOR, calendarColors } from './colors'

// backend sends empty string for title if it is the primary calendar, so fall back to account id
export const getCalendarName = (accountId: string, calendarTitle?: string): string => calendarTitle || accountId

export const getCalendarColor = (colorId: string): string =>
    calendarColors[colorId as keyof typeof calendarColors]?.background ?? DEFAULT_CALENDAR_COLOR

export const getCalendarAuthButton = (account: TCalendarAccount, onClick: () => void, shortenLabels?: boolean) => {
    if (!account.has_primary_calendar_scopes && !account.has_multical_scopes) {
        return (
            <GTButton
                onClick={onClick}
                value={shortenLabels ? 'Re-link' : 'Re-link account'}
                styleType="secondary"
                size="small"
                textColor="red"
            />
        )
    }
    if (account.has_primary_calendar_scopes && !account.has_multical_scopes) {
        return (
            <GTButton value={shortenLabels ? 'Authorize' : 'Authorize all calendars'} size="small" onClick={onClick} />
        )
    }
    return null
}
