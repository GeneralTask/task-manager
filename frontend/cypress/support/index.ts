import '@testing-library/cypress/add-commands'
import './commands'

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
        }
    }
}
