import { useState } from 'react'
import { icons } from '../../styles/images'
import { Icon } from '../atoms/Icon'
import GTButton from '../atoms/buttons/GTButton'
import GTIconButton from '../atoms/buttons/GTIconButton'
import { CollapsedIconContainer } from '../navigation_sidebar/NavigationLink'
import Tip from '../radix/Tip'
import SettingsModal from './SettingsModal'

interface SettingsModalSettingsModalButtonProps {
    type: 'nav-button' | 'collapsed-nav-button' | 'icon-button'
    label?: string
    defaultTabIndex?: number
}
const SettingsModalButton = ({ type, label = 'Settings', defaultTabIndex }: SettingsModalSettingsModalButtonProps) => {
    const [modalIsOpen, setModalIsOpen] = useState(false)
    const getButton = () => {
        if (type === 'icon-button') {
            return <GTIconButton icon={icons.gear} tooltipText={label} onClick={() => setModalIsOpen(true)} />
        }
        if (type === 'nav-button') {
            return (
                <GTButton
                    value="Settings"
                    styleType="secondary"
                    fitContent={false}
                    onClick={() => setModalIsOpen(true)}
                />
            )
        }
        // collapsed-nav-button
        return (
            <Tip content={label} side="right">
                <CollapsedIconContainer onClick={() => setModalIsOpen(true)}>
                    <Icon icon={icons.gear} />
                </CollapsedIconContainer>
            </Tip>
        )
    }

    return (
        <>
            {getButton()}
            <SettingsModal isOpen={modalIsOpen} setIsOpen={setModalIsOpen} defaultTabIndex={defaultTabIndex} />
        </>
    )
}

export default SettingsModalButton
