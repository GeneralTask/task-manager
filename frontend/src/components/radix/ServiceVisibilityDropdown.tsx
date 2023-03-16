import { useState } from 'react'
import { useSetting } from '../../hooks'
import { icons, logos } from '../../styles/images'
import GTButton from '../atoms/buttons/GTButton'
import { DeprecatedLabel } from '../atoms/typography/Typography'
import SettingsModal from '../molecules/SettingsModal'
import GTDropdownMenu from './GTDropdownMenu'

interface ServiceVisibilityDropdownProps {
    disabled?: boolean
}
const ServiceVisibilityDropdown = ({ disabled }: ServiceVisibilityDropdownProps) => {
    const [isOpen, setIsOpen] = useState(false)
    const [settingsIsOpen, setSettingsIsOpen] = useState(false)
    const showGitHubSetting = useSetting('sidebar_github_preference')
    const showLinearSetting = useSetting('sidebar_linear_preference')
    const showSlackSetting = useSetting('sidebar_slack_preference')
    const showJiraSetting = useSetting('sidebar_jira_preference')

    const showGitHub = showGitHubSetting.field_value === 'true'
    const showLinear = showLinearSetting.field_value === 'true'
    const showSlack = showSlackSetting.field_value === 'true'
    const showJira = showJiraSetting.field_value === 'true'

    const handleManageServicesClick = () => {
        setIsOpen(false)
        setSettingsIsOpen(true)
    }

    return (
        <>
            <SettingsModal isOpen={settingsIsOpen} setIsOpen={setSettingsIsOpen} />
            <GTDropdownMenu
                isOpen={isOpen}
                setIsOpen={setIsOpen}
                disabled={disabled}
                items={[
                    [
                        {
                            label: 'Show these services',
                            disabled: true,
                            hideCheckmark: true,
                            renderer: () => <DeprecatedLabel color="light">Show these services</DeprecatedLabel>,
                        },
                        {
                            label: 'GitHub',
                            icon: logos.github,
                            onClick: () => showGitHubSetting.updateSetting(!showGitHub),
                            selected: showGitHub,
                        },
                        {
                            label: 'Linear',
                            icon: logos.linear,
                            onClick: () => showLinearSetting.updateSetting(!showLinear),
                            selected: showLinear,
                        },
                        {
                            label: 'Slack',
                            icon: logos.slack,
                            onClick: () => showSlackSetting.updateSetting(!showSlack),
                            selected: showSlack,
                        },
                        {
                            label: 'Jira',
                            icon: logos.jira,
                            onClick: () => showJiraSetting.updateSetting(!showJira),
                            selected: showJira,
                        },
                    ],
                    [
                        {
                            label: 'Manage services...',
                            icon: icons.gear,
                            hideCheckmark: true,
                            onClick: handleManageServicesClick,
                        },
                    ],
                ]}
                keepOpenOnSelect
                trigger={
                    <GTButton
                        styleType="icon"
                        icon={icons.ellipsisVertical}
                        disabled={disabled}
                        tooltipText="Hide/show services"
                    />
                }
            />
        </>
    )
}

export default ServiceVisibilityDropdown
