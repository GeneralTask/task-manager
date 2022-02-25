import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { FetchStatusEnum } from '../helpers/enums'
import { TMessage } from '../helpers/types'

export interface MessagesPageState {
    messages: {
        messages_array: TMessage[]
        fetch_status: FetchStatusEnum
        expanded_body: string | null
    }
}

const initialState: MessagesPageState = {
    messages: {
        messages_array: [],
        fetch_status: FetchStatusEnum.LOADING,
        expanded_body: null,
    },
}

export const messagesPageSlice = createSlice({
    name: 'messages_page',
    initialState,
    reducers: {
        setMessages: (state, action: PayloadAction<TMessage[]>) => {
            state.messages.messages_array = action.payload
        },
        setMessagesFetchStatus: (state, action: PayloadAction<FetchStatusEnum>) => {
            state.messages.fetch_status = action.payload
        },
        removeMessageByID(state, action: PayloadAction<string>) {
            for (let i = 0; i < state.messages.messages_array.length; i++) {
                if (state.messages.messages_array[i].id === action.payload) {
                    state.messages.messages_array.splice(i, 1)
                }
            }
        },
        expandBody(state, action: PayloadAction<string>) {
            state.messages.expanded_body = action.payload
        },
        collapseBody(state) {
            state.messages.expanded_body = null
        },
    },
})

export const { setMessages, setMessagesFetchStatus, removeMessageByID, expandBody, collapseBody } =
    messagesPageSlice.actions

export default messagesPageSlice.reducer
