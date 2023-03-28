import styled from 'styled-components'
import { useGetLeaderboardTeammates } from '../../../services/api/leaderboard.hooks'
import { Spacing } from '../../../styles'
import { icons } from '../../../styles/images'
import Flex from '../../atoms/Flex'
import { Icon } from '../../atoms/Icon'
import GTButton from '../../atoms/buttons/GTButton'
import { BodyMedium, LabelSmall } from '../../atoms/typography/Typography'
import GTModal from '../../mantine/GTModal'

const TeammateList = styled.div`
    display: flex;
    flex-direction: column;
    max-height: 70vh;
    overflow-y: auto;
    margin-bottom: ${Spacing._24};
    gap: ${Spacing._16};
`

interface InviteTeammatesModalProps {
    isOpen: boolean
    onClose: () => void
}

const InviteTeammatesModal = ({ isOpen, onClose }: InviteTeammatesModalProps) => {
    const { data: teammates } = useGetLeaderboardTeammates()
    return (
        <GTModal
            open={isOpen}
            setIsModalOpen={onClose}
            tabs={{
                title: 'Invite your teammates',
                subtitle:
                    'Get your teammates on board to see how they rank on the leaderboard. An email with an invite link will be sent.',
                body: (
                    <>
                        <TeammateList>
                            {teammates?.map((teammate) => (
                                <Flex key={teammate.id} alignItems="center" justifyContent="space-between">
                                    <Flex alignItems="center" gap={Spacing._8}>
                                        <Icon icon={teammate.avatar_url} />
                                        <Flex column>
                                            <BodyMedium>{teammate.name}</BodyMedium>
                                            <LabelSmall>{teammate.github_id}</LabelSmall>
                                        </Flex>
                                    </Flex>
                                    {teammate.has_been_invited ? (
                                        <Icon icon={icons.check} />
                                    ) : (
                                        <GTButton styleType="primary" value="Invite" />
                                    )}
                                </Flex>
                            ))}
                        </TeammateList>
                        <Flex alignItems="center" gap={Spacing._16}>
                            <GTButton styleType="secondary" value="Skip" onClick={onClose} />
                        </Flex>
                    </>
                ),
            }}
        />
    )
}

export default InviteTeammatesModal
