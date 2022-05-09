import '@testing-library/cypress/add-commands'
import './commands'
import { POSITION_OPTIONS } from './commands'

declare global {
    namespace Cypress {
        interface Chainable {
            /**
             * Custom command to log into the app
             * @example cy.login()
             */
            login(): Chainable<Element>
            /**
             * Custom command to accept the terms of service
             * @example cy.acceptTermsOfService()
             */
            acceptTermsOfService(): Chainable<Element>
            /**
             * Custom command to start dragging an element
             * @example cy.findByTestId('some-div').dragStart()
             */
            dragStart(): Chainable<Element>
            /**
             * Custom command to finish dragging an element
             * @example cy.findByTestId('some-other-div').dragEnd()
             */
            dragEnd(position: POSITION_OPTIONS): Chainable<Element>
        }
    }
}
