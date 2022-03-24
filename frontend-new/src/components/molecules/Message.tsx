import React, { useEffect } from 'react'
import { Platform, StyleSheet, Text, View } from 'react-native'
import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components/native'
import { Border, Colors, Flex, Spacing } from '../../styles'
import { logos } from '../../styles/images'
import { TMessage } from '../../utils/types'
import MarkAsTaskButton from '../atoms/buttons/MarkAsTaskButton'
import { Icon } from '../atoms/Icon'

const PressableContainer = styled.Pressable<{ isSelected: boolean }>`
    display: flex;
    flex-direction: row;
    align-items: center;
    width: 100%;
    height: 100%;
    background-color: ${Colors.white};
    border-radius: ${Border.radius.xxSmall};
    padding: 0 ${Spacing.padding.small}px;
    border: 1px solid ${(props) => (props.isSelected ? Colors.gray._500 : Colors.gray._100)};
`

interface MessageProps {
    message: TMessage
    setSheetTaskId: (label: string) => void
}

const Message = ({ message, setSheetTaskId }: MessageProps) => {
    const navigate = useNavigate()
    const params = useParams()
    const [isSelected, setIsSelected] = React.useState(false)
    const onPress = () => {
        if (Platform.OS === 'ios') {
            setSheetTaskId(message.id)
        }
        if (params.message === message.id) {
            navigate(`/messages/`)
        } else {
            navigate(`/messages/${message.id}`)
        }
    }
    useEffect(() => {
        setIsSelected(params.message === message.id)
    }, [[params]])

    return (
        <PressableContainer onPress={onPress} isSelected={isSelected}>
            <MarkAsTaskButton isTask={false} messageId={message.id} />
            <View style={styles.iconContainer}>
                <Icon source={logos[message.source.logo_v2]} size="small" />
            </View>
            <Text style={styles.title} numberOfLines={1} ellipsizeMode={'tail'}>
                {message.title}
            </Text>
        </PressableContainer>
    )
}

const styles = StyleSheet.create({
    container: {
        ...Flex.row,
        alignItems: 'center',
        width: '100%',
        backgroundColor: Colors.white,
        borderRadius: 4,
        paddingHorizontal: 8,
        height: 34,
    },
    iconContainer: {
        marginLeft: 6,
    },
    title: {
        marginLeft: 9,
        flexShrink: 1,
        flexWrap: 'wrap',
    },
})

export default Message
