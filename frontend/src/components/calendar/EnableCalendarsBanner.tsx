import { useEffect, useMemo, useState } from 'react'
import { DateTime } from 'luxon'
import styled from 'styled-components'
import { GOOGLE_CALENDAR_SUPPORTED_TYPE_NAME } from '../../constants'
import { useAuthWindow, useSetting, useToast } from '../../hooks'
import { getEvents, useGetCalendars } from '../../services/api/events.hooks'
import { useGetSupportedTypes } from '../../services/api/settings.hooks'
import { Border, Colors, Spacing } from '../../styles'
import { Typography } from '../../styles'
import { icons, logos } from '../../styles/images'
import Flex from '../atoms/Flex'
import { Icon } from '../atoms/Icon'
import { Divider } from '../atoms/SectionDivider'
import GTIconButton from '../atoms/buttons/GTIconButton'
import { Label, Truncated } from '../atoms/typography/Typography'
import { getCalendarAuthButton } from './utils/utils'

const Container = styled.div`
    background-color: ${Colors.background.white};
    display: flex;
    flex-direction: column;
    gap: ${Spacing._16};
    padding: ${Spacing._16};
    border-radius: ${Border.radius.small};
`
const AccountName = styled(Truncated)`
    ${Typography.bodySmall};
`
const MarginLeftAuto = styled.div`
    margin-left: auto;
`

const EnableCalendarsBanner = () => {
    const { data: supportedTypes } = useGetSupportedTypes()
    const { openAuthWindow } = useAuthWindow()
    const {
        field_value: hasDismissedMulticalPrompt,
        updateSetting: setHasDismissedMulticalPrompt,
        isLoading,
    } = useSetting('has_dismissed_multical_prompt')
    const { show } = useToast()

    const [accountBeingAuthorized, setAccountBeingAuthorized] = useState<string | null>(null)
    // wait for calendars to be refetched before resetting the "Authorizing..." state
    const [shouldResetAuthorizingAccount, setShouldResetAuthorizingAccount] = useState(false)
    const { data: calendars, isFetching } = useGetCalendars()
    useEffect(() => {
        if (shouldResetAuthorizingAccount) {
            setShouldResetAuthorizingAccount(false)
            setAccountBeingAuthorized(null)
        }
    }, [isFetching])

    const calendarsWithBadTokens = useMemo(
        () =>
            calendars?.filter((calendar) => !calendar.has_primary_calendar_scopes && !calendar.has_multical_scopes) ??
            [],
        [calendars]
    )
    const calendarsNeedingMultical = useMemo(
        () =>
            calendars?.filter((calendar) => !calendar.has_multical_scopes && calendar.has_primary_calendar_scopes) ??
            [],
        [calendars]
    )

    if (
        isLoading ||
        hasDismissedMulticalPrompt === 'true' ||
        (calendarsWithBadTokens.length === 0 && calendarsNeedingMultical.length === 0)
    )
        return null

    const handleClick = (accountId: string) => {
        const authUrl = supportedTypes?.find(
            (supportedType) => supportedType.name === GOOGLE_CALENDAR_SUPPORTED_TYPE_NAME
        )?.authorization_url
        if (authUrl) {
            setAccountBeingAuthorized(accountId)
            openAuthWindow({
                url: authUrl,
                isGoogleSignIn: true,
                onWindowClose: async () => {
                    // backend needs to fetch events from an account in order to populate its calendars
                    await getEvents({
                        startISO: DateTime.now().minus({ second: 1 }).toISO(),
                        endISO: DateTime.now().plus({ second: 1 }).toISO(),
                    })
                    setShouldResetAuthorizingAccount(true)
                },
            })
        }
    }

    const handleDismiss = () => {
        setHasDismissedMulticalPrompt('true')
        show({
            message: 'You can always authorize your calendars from the settings page.',
        })
    }

    return (
        <Container>
            {calendarsWithBadTokens.length > 0 && (
                <>
                    <Flex justifyContent="space-between">
                        <Label color="light">
                            {calendarsWithBadTokens.length > 1
                                ? 'There was a problem authorizing your accounts. Re-link to display and create events for these accounts'
                                : 'There was a problem authorizing your account. Re-link to display and create events for this account'}
                        </Label>
                        <GTIconButton icon={icons.x} tooltipText="Dismiss" onClick={handleDismiss} />
                    </Flex>
                    {calendarsWithBadTokens.map((calendar) => (
                        <Flex
                            key={calendar.account_id}
                            alignItems="center"
                            gap={Spacing._12}
                            justifyContent="space-between"
                        >
                            <Icon icon={logos.gcal} />
                            <AccountName>{calendar.account_id}</AccountName>
                            <MarginLeftAuto>
                                {getCalendarAuthButton(
                                    calendar,
                                    () => handleClick(calendar.account_id),
                                    true,
                                    accountBeingAuthorized === calendar.account_id
                                )}
                            </MarginLeftAuto>
                        </Flex>
                    ))}
                </>
            )}
            {calendarsNeedingMultical.length > 0 && (
                <>
                    {calendarsNeedingMultical.length > 0 && calendarsWithBadTokens.length > 0 && (
                        <Divider color={Colors.border.light} />
                    )}
                    <Flex justifyContent="space-between">
                        <Label color="light">
                            Authorize our app to see all the calendars in your account
                            {calendarsNeedingMultical.length > 1 && 's'}.
                        </Label>
                        {/* only show dismiss button if these are the only calendars being displayed */}
                        {calendarsWithBadTokens.length === 0 && (
                            <GTIconButton icon={icons.x} tooltipText="Dismiss" onClick={handleDismiss} />
                        )}
                    </Flex>
                    {calendarsNeedingMultical.map((calendar) => (
                        <Flex
                            key={calendar.account_id}
                            alignItems="center"
                            gap={Spacing._12}
                            justifyContent="space-between"
                        >
                            <Icon icon={logos.gcal} />
                            <AccountName>{calendar.account_id}</AccountName>
                            <MarginLeftAuto>
                                {getCalendarAuthButton(
                                    calendar,
                                    () => handleClick(calendar.account_id),
                                    true,
                                    accountBeingAuthorized === calendar.account_id
                                )}
                            </MarginLeftAuto>
                        </Flex>
                    ))}
                </>
            )}
        </Container>
    )
}

export default EnableCalendarsBanner
