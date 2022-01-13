import { PayloadAction, createSlice } from '@reduxjs/toolkit'
import { TLinkedAccount, TSetting } from '../helpers/types'

export interface UserDataState {
    linked_accounts: TLinkedAccount[],
    settings: TSetting[],
    authToken: string | undefined,
}

const initialState: UserDataState = {
    linked_accounts: [],
    settings: [],
    authToken: undefined,
}

export const userDataSlice = createSlice({
    name: 'userData',
    initialState,
    reducers: {
        setSettings(state, action: PayloadAction<TSetting[]>) {
            state.settings = action.payload
        },
        setLinkedAccounts(state, action: PayloadAction<TLinkedAccount[]>) {
            state.linked_accounts = action.payload
        },
        setAuthToken(state, action: PayloadAction<string | undefined>) {
            state.authToken = action.payload
        }
    },
})

export const { setSettings, setLinkedAccounts, setAuthToken } = userDataSlice.actions

export default userDataSlice.reducer
