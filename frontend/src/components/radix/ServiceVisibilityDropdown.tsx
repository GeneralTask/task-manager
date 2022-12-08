import { useState } from 'react'
import { useSetting } from '../../hooks'
import { icons, logos } from '../../styles/images'
import GTIconButton from '../atoms/buttons/GTIconButton'
import { Label } from '../atoms/typography/Typography'
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

    const showGithub = showGitHubSetting.field_value === 'true'
    const showLinear = showLinearSetting.field_value === 'true'
    const showSlack = showSlackSetting.field_value === 'true'

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
                            renderer: () => <Label color="light">Show these services</Label>,
                        },
                        {
                            label: 'GitHub',
                            icon: logos.github,
                            onClick: () => showGitHubSetting.updateSetting(!showGithub),
                            selected: showGithub,
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
                unstyledTrigger
                trigger={
                    <GTIconButton
                        icon={icons.ellipsisVertical}
                        onClick={() => setIsOpen(!isOpen)}
                        disabled={disabled}
                        forceShowHoverEffect={isOpen}
                        tooltipText="Hide/Show Services"
                        asDiv
                    />
                }
            />
        </>
    )
}

export default ServiceVisibilityDropdown
