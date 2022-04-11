import { setupWorker, rest } from 'msw'

export const worker = setupWorker()
window.msw = { worker, rest }
