import { useState } from 'react'
import { Modal, ModalProps } from '@mantine/core'
import styled from 'styled-components'
import { Border, Colors, Shadows, Spacing } from '../../styles'
import { icons } from '../../styles/images'
import { stopKeydownPropogation } from '../../utils/utils'
import Flex from '../atoms/Flex'
import { Icon, TIconType } from '../atoms/Icon'
import { Divider } from '../atoms/SectionDivider'
import GTIconButton from '../atoms/buttons/GTIconButton'
import { Eyebrow, Label, Subtitle } from '../atoms/typography/Typography'

const MODAL_HEIGHT = '642px'
const SIDEBAR_WIDTH = '185px'
export const MODAL_WIDTH = {
    sm: '502px',
    lg: '1004px',
}
export type TModalSize = keyof typeof MODAL_WIDTH

const ModalOuter = styled.div`
    display: flex;
    height: ${MODAL_HEIGHT};
`
const ModalContent = styled.div`
    display: flex;
    flex-direction: column;
    flex: 1 0;
    gap: ${Spacing._24};
    padding: ${Spacing._24} ${Spacing._16};
    overflow-y: auto;
`
const ModalSidebar = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${Spacing._4};
    padding: ${Spacing._32} ${Spacing._12} ${Spacing._12} ${Spacing._12};
    background-color: ${Colors.background.light};
    width: ${SIDEBAR_WIDTH};
`

const Link = styled.button<{ isSelected: boolean }>`
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: ${Spacing._8};
    width: 100%;
    border-radius: ${Border.radius.small};
    border: none;
    background-color: ${(props) => (props.isSelected ? Colors.background.dark : 'inherit')};
    color: ${Colors.text.black};
    gap: ${Spacing._12};
    cursor: pointer;
`

export const modalProps: Partial<ModalProps> = {
    withCloseButton: false,
    centered: true,
    overlayColor: Colors.background.white,
    overlayOpacity: 0.55,
    overlayBlur: 3,
    transition: 'pop',
    transitionDuration: 100,
    transitionTimingFunction: 'ease',
    padding: 0,
    onKeyDown: (e) => stopKeydownPropogation(e, [], true),
    styles: {
        modal: {
            borderRadius: Border.radius.small,
            boxShadow: Shadows.medium,
        },
    },
}

interface GTModalTab {
    title?: string
    icon?: TIconType
    body: React.ReactNode
}
export interface GTModalProps {
    open: boolean
    setOpen: (open: boolean) => void
    size: TModalSize
    title?: string
    tabs: GTModalTab | GTModalTab[]
}
const GTModal = ({ open, setOpen, size, title, tabs }: GTModalProps) => {
    if (!Array.isArray(tabs)) {
        return (
            <Modal opened={open} onClose={() => setOpen(false)} size={MODAL_WIDTH[size]} {...modalProps}>
                <ModalContent>
                    <Flex justifyContent="space-between" alignItems="center">
                        <Subtitle>{tabs.title}</Subtitle>
                        <GTIconButton icon={icons.x} onClick={() => setOpen(false)} />
                    </Flex>
                    <Divider color={Colors.border.light} />
                    {tabs.body}
                </ModalContent>
            </Modal>
        )
    }

    const [selectedTab, setSelectedTab] = useState(0)

    return (
        <Modal opened={open} onClose={() => setOpen(false)} size={MODAL_WIDTH[size]} {...modalProps}>
            <ModalOuter>
                <ModalSidebar>
                    <Eyebrow color="light">{title}</Eyebrow>
                    {tabs.map((tab, index) => (
                        <Link key={tab.title} isSelected={selectedTab === index} onClick={() => setSelectedTab(index)}>
                            <Icon icon={tab.icon || icons.arrow_right} color="black" />
                            <Label>{tab.title}</Label>
                        </Link>
                    ))}
                </ModalSidebar>
                <ModalContent>
                    <Flex justifyContent="space-between" alignItems="center">
                        <Subtitle>{tabs[selectedTab].title}</Subtitle>
                        <GTIconButton icon={icons.x} onClick={() => setOpen(false)} />
                    </Flex>
                    <Divider color={Colors.border.light} />
                    {tabs[selectedTab].body}
                </ModalContent>
            </ModalOuter>
        </Modal>
    )
}

export default GTModal
