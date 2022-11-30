import { useState } from 'react'
import { useSetting } from '../../hooks'
import { icons } from '../../styles/images'
import Flex from '../atoms/Flex'
import GTIconButton from '../atoms/buttons/GTIconButton'
import { Label } from '../atoms/typography/Typography'
import GTDropdownMenu from './GTDropdownMenu'

interface ServiceVisibilityDropdownProps {
    disabled?: boolean
}
const ServiceVisibilityDropdown = ({ disabled }: ServiceVisibilityDropdownProps) => {
    const [isOpen, setIsOpen] = useState(false)
    const showGitHubSetting = useSetting('sidebar_github_preference')
    const showLinearSetting = useSetting('sidebar_linear_preference')
    const showSlackSetting = useSetting('sidebar_slack_preference')

    const showGithub = showGitHubSetting.field_value === 'true'
    const showLinear = showLinearSetting.field_value === 'true'
    const showSlack = showSlackSetting.field_value === 'true'

    return (
        <GTDropdownMenu
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            disabled={disabled}
            unstyledTrigger
            items={[
                [
                    {
                        label: 'Show these services',
                        disabled: true,
                        renderer: () => (
                            <Flex column>
                                <Label color="light">Show these services</Label>
                            </Flex>
                        ),
                    },
                ],
                [
                    {
                        label: 'GitHub PRs',
                        onClick: () => showGitHubSetting.updateSetting(!showGithub),
                        selected: showGithub,
                    },
                    {
                        label: 'Linear',
                        onClick: () => showLinearSetting.updateSetting(!showLinear),
                        selected: showLinear,
                    },
                    {
                        label: 'Slack',
                        onClick: () => showSlackSetting.updateSetting(!showSlack),
                        selected: showSlack,
                    },
                ],
            ]}
            keepOpenOnSelect
            trigger={
                <GTIconButton
                    icon={icons.ellipsisVertical}
                    onClick={() => setIsOpen(!isOpen)}
                    disabled={disabled}
                    forceShowHoverEffect={isOpen}
                    asDiv
                />
            }
        />
    )
}

export default ServiceVisibilityDropdown
