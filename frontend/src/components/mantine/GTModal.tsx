import { useState } from 'react'
import styled from 'styled-components'
import { Border, Colors, Spacing } from '../../styles'
import { icons } from '../../styles/images'
import BaseModal, { BaseModalProps } from '../atoms/BaseModal'
import Flex from '../atoms/Flex'
import { Icon, TIconType } from '../atoms/Icon'
import { Divider } from '../atoms/SectionDivider'
import GTIconButton from '../atoms/buttons/GTIconButton'
import { Eyebrow, Label, Subtitle } from '../atoms/typography/Typography'

const SIDEBAR_WIDTH = '185px'
const MODAL_HEIGHT = '642px'

const ModalOuter = styled.div<{ fixedHeight: boolean }>`
    display: flex;
    height: ${({ fixedHeight }) => (fixedHeight ? MODAL_HEIGHT : '100%')};
`
const ModalContent = styled.div`
    display: flex;
    flex-direction: column;
    flex: 1 0;
    gap: ${Spacing._24};
    padding: ${Spacing._24} ${Spacing._12};
    margin: 0 ${Spacing._32};
    overflow-y: auto;
`
const ModalSidebar = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${Spacing._4};
    padding: ${Spacing._32} ${Spacing._12} ${Spacing._12};
    background-color: ${Colors.background.light};
    border-radius: ${Border.radius.small} 0 0 ${Border.radius.small};
    width: ${SIDEBAR_WIDTH};
`
const Link = styled.button<{ isSelected: boolean }>`
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: ${Spacing._12};
    width: 100%;
    border-radius: ${Border.radius.small};
    border: none;
    background-color: ${(props) => (props.isSelected ? Colors.background.dark : 'inherit')};
    color: ${Colors.text.black};
    gap: ${Spacing._12};
    cursor: pointer;
`
const MarginBottom8 = styled.div`
    margin-bottom: ${Spacing._8};
`

interface GTModalTab {
    title?: string
    icon?: TIconType
    body: React.ReactNode
}
interface GTModalProps extends BaseModalProps {
    title?: string
    tabs: GTModalTab | GTModalTab[]
}
const GTModal = ({ title, tabs, ...baseModalProps }: GTModalProps) => {
    const [selectedTab, setSelectedTab] = useState(0)
    const tab = Array.isArray(tabs) ? tabs[selectedTab] : tabs

    return (
        <BaseModal open={baseModalProps.open} setIsModalOpen={baseModalProps.setIsModalOpen} size={baseModalProps.size}>
            <ModalOuter fixedHeight={Array.isArray(tabs)}>
                {Array.isArray(tabs) && (
                    <ModalSidebar>
                        <MarginBottom8>
                            <Eyebrow color="light">{title}</Eyebrow>
                        </MarginBottom8>
                        {tabs.map((tab, index) => (
                            <Link
                                key={tab.title}
                                isSelected={selectedTab === index}
                                onClick={() => setSelectedTab(index)}
                            >
                                <Icon icon={tab.icon || icons.arrow_right} color="black" />
                                <Label>{tab.title}</Label>
                            </Link>
                        ))}
                    </ModalSidebar>
                )}
                <ModalContent>
                    <Flex justifyContent="space-between" alignItems="center">
                        <Subtitle>{tab.title}</Subtitle>
                        <GTIconButton icon={icons.x} onClick={() => baseModalProps.setIsModalOpen(false)} />
                    </Flex>
                    {Array.isArray(tabs) && <Divider color={Colors.border.light} />}
                    <div>{tab.body}</div>
                </ModalContent>
            </ModalOuter>
        </BaseModal>
    )
}

export default GTModal
