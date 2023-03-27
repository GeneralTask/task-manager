import { useMemo } from 'react'
import styled from 'styled-components'
import { GITHUB_SUPPORTED_TYPE_NAME } from '../../../constants'
import { useAuthWindow } from '../../../hooks'
import Log from '../../../services/api/log'
import {
    useDeleteLinkedAccount,
    useGetLinkedAccounts,
    useGetSupportedTypes,
} from '../../../services/api/settings.hooks'
import { Colors, Spacing } from '../../../styles'
import { icons } from '../../../styles/images'
import Flex from '../../atoms/Flex'
import { Icon } from '../../atoms/Icon'
import GTButton from '../../atoms/buttons/GTButton'
import { BodyMedium, LabelSmall, TitleLarge } from '../../atoms/typography/Typography'

const Banner = styled.div`
    padding: ${Spacing._36};
    background-color: ${Colors.background.sub};
    display: flex;
    justify-content: space-between;
    gap: ${Spacing._144};
`
const LinkedGithubAccounts = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${Spacing._16};
    padding: ${Spacing._36};
`

const OnboardingSplash = () => {
    const { data: linkedAccounts } = useGetLinkedAccounts()
    const { mutate: deleteAccount } = useDeleteLinkedAccount()
    const { data: supportedTypes } = useGetSupportedTypes()
    const { openAuthWindow } = useAuthWindow()

    const linkedGithubAccounts = useMemo(() => {
        return linkedAccounts?.filter((account) => account.name === GITHUB_SUPPORTED_TYPE_NAME) ?? []
    }, [linkedAccounts])

    const handleUnlink = (id: string) => {
        Log(`unlink_account_${id}`)
        deleteAccount({ id: id })
    }

    const handlePrimaryButtonClick = () => {
        if (linkedGithubAccounts.length === 0) {
            const url = supportedTypes?.find((type) => type.name === GITHUB_SUPPORTED_TYPE_NAME)?.authorization_url
            if (url) openAuthWindow({ url: url })
        }
    }

    return (
        <>
            <Banner>
                <Flex column gap={Spacing._24}>
                    <TitleLarge>
                        Introducing the leaderboard: your team&apos;s new secret weapon for tracking and comparing code
                        review times!
                    </TitleLarge>
                    <BodyMedium>
                        Link your repository to the leaderboard to see your teammates ranked by the shortest code review
                        time and get real-time updates on your progress. Keep your team motivated and on track with the
                        leaderboard - join the race to the top now!
                    </BodyMedium>
                    <Flex gap={Spacing._16}>
                        <GTButton
                            styleType="primary"
                            value={linkedGithubAccounts.length > 0 ? 'Get started' : 'Link GitHub account'}
                            onClick={handlePrimaryButtonClick}
                        />
                        <GTButton styleType="secondary" value="I'm not interested" />
                    </Flex>
                </Flex>
                {/* placeholder since we'll reuse components from the actual leaderboard here */}
                <img
                    src="https://img.freepik.com/free-vector/leaderboard-with-abstract-background_52683-51485.jpg"
                    width="400"
                />
            </Banner>
            {linkedGithubAccounts.length > 0 && (
                <LinkedGithubAccounts>
                    <LabelSmall>GitHub account</LabelSmall>
                    {linkedGithubAccounts.map((account) => (
                        <Flex key={account.id} justifyContent="space-between" alignItems="center">
                            <Flex gap={Spacing._8} alignItems="center">
                                <Icon icon={icons.github} />
                                <BodyMedium>{account.display_id}</BodyMedium>
                            </Flex>
                            <GTButton
                                styleType="secondary"
                                value="Disconnect account"
                                onClick={() => handleUnlink(account.id)}
                            />
                        </Flex>
                    ))}
                </LinkedGithubAccounts>
            )}
        </>
    )
}

export default OnboardingSplash
