import React from 'react'
import { Pressable, View } from 'react-native'
import { useAppDispatch } from '../../redux/hooks'
import { useGetTasksQuery } from '../../services/generalTaskApi'
import { Link } from '../../services/routing'
import { authSignOut } from '../../utils/auth'
import Loading from '../atoms/Loading'

const NavigationView = () => {
    const dispatch = useAppDispatch()
    const { data: taskSections, isLoading } = useGetTasksQuery()
    const links = taskSections?.map(section =>
        <Link key={section.id} to={`/tasks/${section.id}`}>{section.name}</Link>
    )

    return isLoading || !taskSections ?
        <Loading /> :
        <View>
            {links}
            <Pressable onPress={() => authSignOut(dispatch)}><View>Sign Out</View></Pressable>
        </View>

}

export default NavigationView
