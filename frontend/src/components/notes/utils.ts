import { REACT_APP_NOTES_BASE_URL } from '../../constants'

export const getNoteURL = (id: string) => `${REACT_APP_NOTES_BASE_URL}/note/${id}`
