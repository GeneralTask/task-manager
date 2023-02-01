import { useMemo } from 'react'
import styled from 'styled-components'
import { GOOGLE_CALENDAR_SUPPORTED_TYPE_NAME } from '../../constants'
import { useAuthWindow, useSetting } from '../../hooks'
import { useGetCalendars } from '../../services/api/events.hooks'
import { useGetSupportedTypes } from '../../services/api/settings.hooks'
import { Border, Colors, Spacing } from '../../styles'
import { icons, logos } from '../../styles/images'
import Flex from '../atoms/Flex'
import { Icon } from '../atoms/Icon'
import GTButton from '../atoms/buttons/GTButton'
import GTIconButton from '../atoms/buttons/GTIconButton'
import { BodySmall, Truncated } from '../atoms/typography/Typography'

const Container = styled.div`
    background-color: ${Colors.background.white};
    display: flex;
    flex-direction: column;
    gap: ${Spacing._16};
    padding: ${Spacing._16};
    border-radius: ${Border.radius.small};
`
const MarginLeftAuto = styled.div`
    margin-left: auto;
`

const EnableCalendarsBanner = () => {
    const { data: calendars } = useGetCalendars()
    const { data: supportedTypes } = useGetSupportedTypes()
    const { openAuthWindow } = useAuthWindow()
    const { field_value: hasDismissedMulticalPrompt, updateSetting: setHasDismissedMulticalPrompt } = useSetting(
        'has_dismissed_multical_prompt'
    )
    console.log({ hasDismissedMulticalPrompt })

    const calendarsNeedingReauth = useMemo(
        () => calendars?.filter((calendar) => calendar.has_multical_scopes) ?? [],
        [calendars]
    )

    if (hasDismissedMulticalPrompt === 'true' || calendarsNeedingReauth.length === 0) return null

    const handleClick = () => {
        const authUrl = supportedTypes?.find(
            (supportedType) => supportedType.name === GOOGLE_CALENDAR_SUPPORTED_TYPE_NAME
        )?.authorization_url
        if (authUrl) {
            openAuthWindow({ url: authUrl, isGoogleSignIn: true })
        }
    }

    return (
        <Container>
            <Flex justifyContent="space-between" alignItems="center">
                <BodySmall>Enable all Google calendars.</BodySmall>
                <GTIconButton
                    icon={icons.x}
                    tooltipText="Dismiss"
                    onClick={() => setHasDismissedMulticalPrompt('true')}
                />
            </Flex>
            {calendarsNeedingReauth.map((calendar) => (
                <Flex key={calendar.account_id} alignItems="center" gap={Spacing._12} justifyContent="space-between">
                    <Icon icon={logos.gcal} />
                    <BodySmall>
                        <Truncated>{calendar.account_id}</Truncated>
                    </BodySmall>
                    <MarginLeftAuto>
                        <GTButton value="Authorize" size="small" onClick={handleClick} />
                    </MarginLeftAuto>
                </Flex>
            ))}
        </Container>
    )
}

export default EnableCalendarsBanner
