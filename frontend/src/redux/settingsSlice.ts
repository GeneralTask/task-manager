import { PayloadAction, createSlice } from '@reduxjs/toolkit'
import { TLinkedAccount, TSetting } from '../helpers/types'

export interface SettingsState {
    linked_accounts: TLinkedAccount[]
    settings: TSetting[]
}

const initialState: SettingsState = {
    linked_accounts: [],
    settings: [],
}

export const settingsSlice = createSlice({
    name: 'settings',
    initialState,
    reducers: {
        setSettings(state, action: PayloadAction<TSetting[]>) {
            state.settings = action.payload
        },
        setLinkedAccounts(state, action: PayloadAction<TLinkedAccount[]>) {
            state.linked_accounts = action.payload
        },
    },
})

export const { setSettings, setLinkedAccounts } = settingsSlice.actions

export default settingsSlice.reducer
