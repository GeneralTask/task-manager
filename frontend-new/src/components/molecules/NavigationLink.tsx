import React, { CSSProperties, Ref, useCallback } from 'react'
import { useDrop } from 'react-dnd'
import { ImageSourcePropType, Platform, StyleSheet, View, ViewStyle } from 'react-native'
import { Link } from 'react-router-dom'
import styled from 'styled-components/native'
import { useReorderTaskMutation } from '../../services/generalTaskApi'
import { Colors, Flex } from '../../styles'
import { weight } from '../../styles/typography'
import { ItemTypes, TTaskSection } from '../../utils/types'
import { Icon } from '../atoms/Icon'

interface NavigationLinkProps {
    isCurrentPage: boolean
    link: string
    title: string
    icon?: NodeRequire | ImageSourcePropType
    taskSection?: TTaskSection
    droppable?: boolean
}
const NavigationLink = ({ isCurrentPage, link, title, icon, taskSection, droppable }: NavigationLinkProps) => {
    const [reorderTask] = useReorderTaskMutation()

    const onDrop = useCallback(
        (item: { id: string; taskIndex: number; sectionId: string }) => {
            if (taskSection && droppable) {
                reorderTask({
                    taskId: item.id,
                    orderingId: 1,
                    dropSectionId: taskSection.id,
                    dragSectionId: item.sectionId,
                })
            }
        },
        [taskSection?.id]
    )

    const [isOver, drop] = useDrop(
        () => ({
            accept: ItemTypes.TASK,
            collect: (monitor) => {
                return !!(taskSection && droppable && monitor.isOver())
            },
            drop: onDrop,
            canDrop: () => !!(taskSection && droppable),
        }),
        [taskSection, onDrop]
    )

    const dropRef = Platform.OS === 'web' ? (drop as Ref<View>) : undefined

    return (
        <Link style={linkStyle} to={link}>
            <View
                ref={dropRef}
                style={[
                    styles.linkContainer,
                    isCurrentPage ? styles.linkContainerSelected : null,
                    isOver ? styles.linkOnHover : null,
                ]}
            >
                <Icon size="small" source={icon} />
                <SectionTitle isSelected={isCurrentPage}>{title}</SectionTitle>
                <SectionTitleItemCount isSelected={isCurrentPage}>{taskSection?.tasks.length}</SectionTitleItemCount>
            </View>
        </Link>
    )
}

const styles = StyleSheet.create({
    linkOnHover: {
        borderColor: Colors.gray._300,
    },
    linkContainer: {
        ...Flex.row,
        alignItems: 'center',
        height: 28,
        marginVertical: 4,
        marginHorizontal: 6,
        paddingVertical: 4,
        paddingHorizontal: 8,

        borderRadius: 8,
        borderWidth: 2,
        borderStyle: 'solid',
        borderColor: 'transparent',
    },
    linkContainerSelected: {
        backgroundColor: Colors.gray._50,
    },
})
const linkStyle: CSSProperties & ViewStyle = {
    textDecorationLine: 'none',
    width: '100%',
}
const SectionTitle = styled.Text<{ isSelected: boolean }>`
    font-weight: ${(props) => (props.isSelected ? weight._600.fontWeight : weight._500.fontWeight)};
    color: ${(props) => (props.isSelected ? Colors.gray._600 : Colors.gray._500)};
    margin-left: 9px;
    flex: 1;
`
const SectionTitleItemCount = styled.Text<{ isSelected: boolean }>`
    font-weight: ${(props) => (props.isSelected ? weight._600.fontWeight : weight._500.fontWeight)};
    color: ${(props) => (props.isSelected ? Colors.gray._600 : Colors.gray._500)};
`

export default NavigationLink
