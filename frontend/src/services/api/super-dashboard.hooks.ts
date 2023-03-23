import { QueryFunctionContext, useQuery } from 'react-query'
import produce, { castImmutable } from 'immer'
import { TDashboard, TDashboardTeamMember } from '../../components/superDashboard/types'
import useQueryContext from '../../context/QueryContext'
import apiClient from '../../utils/api'
import { useGTMutation, useGTQueryClient } from '../queryUtils'

interface TAddTeamMemberResponse {
    team_member_id: string
}

export const useGetDashboardData = () => {
    return useQuery<TDashboard>('dashboard', getDashboardData)
}

const getDashboardData = async ({ signal }: QueryFunctionContext) => {
    try {
        const res = await apiClient.get(`/dashboard/data/`, { signal })
        return castImmutable(res.data)
    } catch {
        throw 'getDashboardData failed'
    }
}

export const useFetchExternalDashboardData = () => {
    const queryClient = useGTQueryClient()
    return useQuery<TDashboard>('fetch-dashboard', getExternalDashboardData, {
        onSettled: () => {
            queryClient.invalidateQueries('dashboard')
        },
    })
}

const getExternalDashboardData = async ({ signal }: QueryFunctionContext) => {
    try {
        const res = await apiClient.get(`/dashboard/data/fetch/`, { signal })
        return castImmutable(res.data)
    } catch {
        throw 'getExternalDashboardData failed'
    }
}

export const useGetDashboardTeamMembers = () => {
    return useQuery<TDashboardTeamMember[]>('dashboard-team-members', getDashboardTeamMembers)
}

const getDashboardTeamMembers = async ({ signal }: QueryFunctionContext) => {
    try {
        const res = await apiClient.get(`/dashboard/team_members/`, { signal })
        if (!res.data)
            res.data = [
                { id: Math.random().toString(), name: 'Scott', email: 'scott@generaltask.com', github_id: 'scottmai' },
                { id: Math.random().toString(), name: 'Scott', email: 'scott@generaltask.com', github_id: 'scottmai' },
            ]
        return castImmutable(res.data)
    } catch {
        throw 'getDashboardTeamMembers failed'
    }
}

export const useAddDashboardTeamMember = () => {
    const queryClient = useGTQueryClient()
    const { setOptimisticId } = useQueryContext()

    return useGTMutation(addDashboardTeamMember, {
        tag: 'dashboard-team-members',
        invalidateTagsOnSettled: ['dashboard-team-members', 'fetch-dashboard'],
        errorMessage: 'add team member',
        onMutate: async (teamMember: TDashboardTeamMember) => {
            await queryClient.cancelQueries('dashboard-team-members')
            const teamMembers = queryClient.getImmutableQueryData<TDashboardTeamMember[]>('dashboard-team-members')
            if (!teamMembers) {
                queryClient.setQueryData('dashboard-team-members', [teamMember])
            } else {
                queryClient.setQueryData('dashboard-team-members', [...teamMembers, teamMember])
            }
        },
        onSuccess: (response: TAddTeamMemberResponse, createData: TDashboardTeamMember) => {
            if (!createData.optimisticId) return
            setOptimisticId(createData.optimisticId, response.team_member_id)

            const teamMembers = queryClient.getImmutableQueryData<TDashboardTeamMember[]>('dashboard-team-members')
            const updatedTeamMembers = produce(teamMembers, (draft) => {
                const member = draft?.find((member) => member.id === member.optimisticId)
                if (!member) return
                member.id = response.team_member_id
                member.optimisticId = undefined
            })
            queryClient.setQueryData('dashboard-team-members', updatedTeamMembers)
        },
    })
}

const addDashboardTeamMember = async (teamMember: TDashboardTeamMember) => {
    try {
        const res = await apiClient.post(`/dashboard/team_members/`, teamMember)
        return castImmutable(res.data)
    } catch {
        throw 'addDashboardTeamMember failed'
    }
}
