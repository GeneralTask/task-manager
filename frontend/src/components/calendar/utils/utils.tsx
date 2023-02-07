import { TCalendarAccount } from '../../../utils/types'
import GTButton from '../../atoms/buttons/GTButton'
import { DEFAULT_CALENDAR_COLOR, calendarColors } from './colors'

// backend sends empty string for title if it is the primary calendar, so fall back to account id
export const getCalendarName = (accountId: string, calendarTitle?: string): string => calendarTitle || accountId

export const getCalendarColor = (colorId: string): string =>
    calendarColors[colorId as keyof typeof calendarColors]?.background ?? DEFAULT_CALENDAR_COLOR

export const getCalendarAuthButton = (
    account: TCalendarAccount,
    onClick: () => void,
    shortenLabels?: boolean,
    isAuthorizing?: boolean
) => {
    const getValue = () => {
        if (!account.has_primary_calendar_scopes && !account.has_multical_scopes) {
            if (isAuthorizing) {
                return 'Re-linking...'
            } else if (shortenLabels) {
                return 'Re-link'
            } else {
                return 'Re-link account'
            }
        }
        if (account.has_primary_calendar_scopes && !account.has_multical_scopes) {
            if (isAuthorizing) {
                return 'Authorizing...'
            } else if (shortenLabels) {
                return 'Authorize'
            } else {
                return 'Authorize all calendars'
            }
        }
    }
    if (!account.has_primary_calendar_scopes && !account.has_multical_scopes) {
        return (
            <GTButton
                onClick={onClick}
                value={getValue()}
                styleType="secondary"
                size="small"
                textColor="red"
                disabled={isAuthorizing}
            />
        )
    }
    if (account.has_primary_calendar_scopes && !account.has_multical_scopes) {
        return <GTButton value={getValue()} size="small" onClick={onClick} disabled={isAuthorizing} />
    }
    return null
}
