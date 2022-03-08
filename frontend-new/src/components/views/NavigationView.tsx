import React, { CSSProperties } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View, ViewStyle } from 'react-native'
import styled from 'styled-components/native'
import { useAppDispatch } from '../../redux/hooks'
import { useGetMessagesQuery, useGetTasksQuery } from '../../services/generalTaskApi'
import { Link, useLocation, useParams } from '../../services/routing'
import { Colors, Flex } from '../../styles'
import { weight } from '../../styles/typography'
import { authSignOut } from '../../utils/auth'
import { Icon } from '../atoms/Icon'
import Loading from '../atoms/Loading'

const NavigationViewHeader = styled.View`
    height: 24px;
    width: 100%;
    margin-bottom: 16px;
`
const SectionTitle = styled.Text<{ isSelected: boolean }>`
    font-weight: ${props => props.isSelected ? weight._600.fontWeight : weight._500.fontWeight};
    color: ${props => props.isSelected ? Colors.gray._600 : Colors.gray._500};
    margin-left: 9px;
`

const NavigationView = () => {
    const dispatch = useAppDispatch()
    const { data: taskSections, isLoading: isLoadingTasks } = useGetTasksQuery()
    const { data: messages, isLoading: isLoadingMessages } = useGetMessagesQuery()
    const { section: sectionIdParam } = useParams()
    const { pathname } = useLocation()


    const loading = isLoadingTasks || !taskSections || isLoadingMessages || !messages
    return (
        <View style={styles.container}>
            <NavigationViewHeader >
                <Icon size="medium" />
            </NavigationViewHeader>
            <ScrollView style={styles.linksFlexContainer}>
                {
                    loading ? <Loading /> :
                        <>
                            {taskSections?.map(section =>
                                <Link key={section.id} style={linkStyle} to={`/tasks/${section.id}`}>
                                    <View style={[styles.linkContainer, (sectionIdParam === section.id) ?
                                        styles.linkContainerSelected : null]}>
                                        <Icon size="small" source={require('../../assets/inbox.png')} />
                                        <SectionTitle isSelected={sectionIdParam === section.id}>{section.name}</SectionTitle>
                                    </View>
                                </Link>
                            )}
                            <Link style={linkStyle} to="/messages">
                                <View style={[styles.linkContainer, (pathname === '/messages') ?
                                    styles.linkContainerSelected : null]}>
                                    <Icon size="small" source={require('../../assets/inbox.png')} />
                                    <SectionTitle isSelected={pathname === '/messages'}>Messages</SectionTitle>
                                </View>
                            </Link>
                        </>
                }
            </ScrollView>
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
    },
    linksFlexContainer: {
        flex: 1,
    },
})

const linkStyle: CSSProperties & ViewStyle = {
    textDecorationLine: 'none',
    width: '100%',
}

export default NavigationView
