import React from 'react'
import { CSSProperties } from 'react'
import { Pressable, View, Text, StyleSheet, ViewStyle } from 'react-native'
import styled from 'styled-components/native'
import { useAppDispatch } from '../../redux/hooks'
import { useGetTasksQuery } from '../../services/generalTaskApi'
import { Link, useParams } from '../../services/routing'
import { Colors, Flex } from '../../styles'
import { authSignOut } from '../../utils/auth'
import { Icon } from '../atoms/Icon'
import Loading from '../atoms/Loading'

const NavigationViewHeader = styled.View`
    height: 24px;
    width: 100%;
    margin-bottom: 16px;
`

const NavigationView = () => {
    const dispatch = useAppDispatch()
    const { data: taskSections, isLoading } = useGetTasksQuery()
    const { section: sectionIdParam } = useParams()

    return (
        <View style={styles.container}>
            <NavigationViewHeader >
                <Icon size="medium" />
            </NavigationViewHeader>
            {
                isLoading || !taskSections ? <Loading /> : taskSections?.map(section =>
                    <View key={section.id} style={[styles.linkContainer, (sectionIdParam === section.id) ?
                        styles.linkContainerSelected : null]}>
                        <Icon size="small" source={require('../../assets/inbox.png')} />
                        <Link style={linkStyle} to={`/tasks/${section.id}`}>
                            <Text >{section.name}</Text>
                        </Link>
                    </View>
                )
            }
            <Pressable onPress={() => authSignOut(dispatch)}><Text>Sign Out</Text></Pressable>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        ...Flex.column,
        minWidth: 232,
        backgroundColor: Colors.gray._100,
        paddingLeft: 8,
        paddingTop: 8,
        paddingRight: 8,
    },
    linkContainer: {
        ...Flex.row,
        alignItems: 'center',
        height: 28,
        marginTop: 8,
        paddingTop: 4,
        paddingRight: 8,
        paddingBottom: 4,
        paddingLeft: 8,
        borderRadius: 8,
    },
    linkContainerSelected: {
        backgroundColor: Colors.gray._50,
    }
})

const linkStyle: CSSProperties & ViewStyle = {
    textDecorationLine: 'none',
    width: '100%',
    height: '100%',
}

export default NavigationView
