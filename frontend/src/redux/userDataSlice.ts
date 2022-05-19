import { PayloadAction, createSlice } from '@reduxjs/toolkit'

export interface UserDataState {
    auth_token: string | undefined
}

const initialState: UserDataState = {
    auth_token: undefined,
}

export const userDataSlice = createSlice({
    name: 'userData',
    initialState,
    reducers: {
        setAuthToken(state, action: PayloadAction<string | undefined>) {
            state.auth_token = action.payload
        },
    },
})

export const { setAuthToken } = userDataSlice.actions

export default userDataSlice.reducer
