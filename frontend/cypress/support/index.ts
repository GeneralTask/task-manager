import { rest, SetupWorkerApi } from 'msw'
import './commands'
declare global {
    interface Window {
        msw: {
            worker: SetupWorkerApi,
            rest: typeof rest
        }
    }
}
