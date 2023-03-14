import { useEffect, useState } from 'react'
import styled from 'styled-components'
import { Border, Colors, Spacing } from '../../styles'
import { icons } from '../../styles/images'
import BaseModal, { BaseModalProps } from '../atoms/BaseModal'
import Flex from '../atoms/Flex'
import { Icon, TIconType } from '../atoms/Icon'
import { Divider } from '../atoms/SectionDivider'
import GTIconButton from '../atoms/buttons/GTIconButton'
import { DeprecatedEyebrow, DeprecatedLabel, DeprecatedSubtitle } from '../atoms/typography/Typography'

const SIDEBAR_WIDTH = '185px'
const MODAL_HEIGHT = '642px'

const ModalOuter = styled.div<{ fixedHeight: boolean }>`
    display: flex;
    height: ${({ fixedHeight }) => (fixedHeight ? MODAL_HEIGHT : '100%')};
`
const ModalContent = styled.div<{ smallGap: boolean }>`
    display: flex;
    flex-direction: column;
    flex: 1 0;
    gap: ${({ smallGap }) => (smallGap ? Spacing._16 : Spacing._24)};
    padding: ${Spacing._24} ${Spacing._32};
    overflow-y: auto;
`
const ModalSidebar = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${Spacing._4};
    padding: ${Spacing._32} ${Spacing._12} ${Spacing._12};
    background-color: ${Colors.background.base};
    border-radius: ${Border.radius.medium} 0 0 ${Border.radius.medium};
    flex-basis: ${SIDEBAR_WIDTH};
    box-sizing: border-box;
`
const Link = styled.button<{ isSelected: boolean }>`
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: ${Spacing._12};
    width: 100%;
    border-radius: ${Border.radius.medium};
    border: none;
    background-color: ${(props) => (props.isSelected ? Colors.background.hover : 'inherit')};
    color: ${Colors.text.black};
    gap: ${Spacing._12};
    cursor: pointer;
`
const MarginBottom8 = styled.div`
    margin-bottom: ${Spacing._8};
`

interface GTModalTab {
    title?: string
    subtitle?: string
    icon?: TIconType
    body: React.ReactNode
}
interface GTModalProps extends BaseModalProps {
    title?: string
    tabs: GTModalTab | GTModalTab[]
    defaultTabIndex?: number
}
const GTModal = ({ title, tabs, defaultTabIndex = 0, ...baseModalProps }: GTModalProps) => {
    const [selectedTab, setSelectedTab] = useState(defaultTabIndex)
    // if defaultTabIndex is updated, switch to that tab
    useEffect(() => {
        if (defaultTabIndex != null) {
            setSelectedTab(defaultTabIndex ?? 0)
        }
    }, [defaultTabIndex])

    const tab = Array.isArray(tabs) ? tabs[selectedTab] : tabs

    return (
        <BaseModal
            open={baseModalProps.open}
            onClose={baseModalProps.onClose}
            setIsModalOpen={baseModalProps.setIsModalOpen}
            size={baseModalProps.size}
        >
            <ModalOuter fixedHeight={Array.isArray(tabs)}>
                {Array.isArray(tabs) && (
                    <ModalSidebar>
                        <MarginBottom8>
                            <DeprecatedEyebrow color="light">{title}</DeprecatedEyebrow>
                        </MarginBottom8>
                        {tabs.map((tab, index) => (
                            <Link
                                key={tab.title}
                                isSelected={selectedTab === index}
                                onClick={() => setSelectedTab(index)}
                            >
                                <Icon icon={tab.icon || icons.arrow_right} color="black" />
                                <DeprecatedLabel>{tab.title}</DeprecatedLabel>
                            </Link>
                        ))}
                    </ModalSidebar>
                )}
                <ModalContent smallGap={!Array.isArray(tabs)}>
                    <Flex justifyContent="space-between" alignItems="center">
                        <DeprecatedSubtitle>{tab.title}</DeprecatedSubtitle>
                        <GTIconButton
                            tooltipText="Close"
                            icon={icons.x}
                            onClick={() => {
                                baseModalProps.setIsModalOpen(false)
                                baseModalProps.onClose?.()
                            }}
                        />
                    </Flex>
                    {tab.subtitle && <DeprecatedLabel color="light">{tab.subtitle}</DeprecatedLabel>}
                    {Array.isArray(tabs) && <Divider color={Colors.background.border} />}
                    <div>{tab.body}</div>
                </ModalContent>
            </ModalOuter>
        </BaseModal>
    )
}

export default GTModal
