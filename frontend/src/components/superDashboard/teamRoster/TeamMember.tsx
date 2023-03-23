import { useState } from 'react'
import { useDeleteDashboardTeamMember } from '../../../services/api/super-dashboard.hooks'
import { Spacing } from '../../../styles'
import { icons } from '../../../styles/images'
import Flex from '../../atoms/Flex'
import { Icon } from '../../atoms/Icon'
import GTButton from '../../atoms/buttons/GTButton'
import { BodyMedium, LabelSmall } from '../../atoms/typography/Typography'
import { TDashboardTeamMember } from '../types'

interface TeamMemberProps {
    teamMember: TDashboardTeamMember
}
const TeamMember = ({ teamMember }: TeamMemberProps) => {
    const [showDeletionPrompt, setShowDeletionPrompt] = useState(false)
    const { mutate: deleteDashboardTeamMember } = useDeleteDashboardTeamMember()

    return (
        <Flex justifyContent="space-between" alignItems="center">
            <Flex alignItems="center" gap={Spacing._24}>
                <Icon icon={icons.user} />
                {showDeletionPrompt ? (
                    <BodyMedium>Are you sure you want to remove {teamMember.name}?`</BodyMedium>
                ) : (
                    <Flex column>
                        <BodyMedium>{teamMember.name}</BodyMedium>
                        {teamMember.email && <LabelSmall>{teamMember.email}</LabelSmall>}
                        {teamMember.github_id && <LabelSmall>{teamMember.github_id}</LabelSmall>}
                    </Flex>
                )}
            </Flex>
            {showDeletionPrompt ? (
                <Flex>
                    <GTButton
                        styleType="icon"
                        icon={icons.check}
                        iconColor="gray"
                        tooltipText="Remove team member"
                        onClick={() => deleteDashboardTeamMember({ id: teamMember.id }, teamMember.optimisticId)}
                    />
                    <GTButton
                        styleType="icon"
                        icon={icons.x}
                        iconColor="gray"
                        tooltipText="Cancel"
                        onClick={() => setShowDeletionPrompt(false)}
                    />
                </Flex>
            ) : (
                <GTButton
                    styleType="icon"
                    icon={icons.trash}
                    iconColor="red"
                    tooltipText="Remove team member"
                    onClick={() => setShowDeletionPrompt(true)}
                />
            )}
        </Flex>
    )
}

export default TeamMember
