describe('user can edit a task body', () => {
    before('login the user', () => {
        cy.login()
        cy.visit('/')
        cy.acceptTermsOfService()
    })
    beforeEach(() => {
        Cypress.Cookies.preserveOnce('authToken')
    })
    it('edit a task body without deselecting', () => {
        // Intercept task modify request
        cy.intercept('PATCH', '/tasks/modify/*').as('modifyTaskBodyMutation')

        // select one task
        cy.findAllByTestId('list-item').first().click()

        // make sure detail view has opened
        cy.findByTestId('details-view-container').should('be.visible')

        // edit the task body
        cy.findByTestId('task-body-input').clear().type('new task body')

        // wait for task body modify request to finish
        cy.wait('@modifyTaskBodyMutation')

        // reload page and verify that the task body has been updated
        cy.reload()
        cy.findByTestId('task-body-input').should('have.value', 'new task body')
    })
    it('edit a task body and deselect the task body', () => {
        // Intercept task modify request
        cy.intercept('PATCH', '/tasks/modify/*').as('modifyTaskBodyMutation')

        // select one task
        cy.findAllByTestId('list-item').first().click()

        // make sure detail view has opened
        cy.findByTestId('details-view-container').should('be.visible')

        // edit the task body
        cy.findByTestId('task-body-input').clear().type('new task body 2').blur()

        // wait for task body modify request to finish
        cy.wait('@modifyTaskBodyMutation')

        // reload page and verify that the task body has been updated
        cy.reload()
        cy.findByTestId('task-body-input').should('have.value', 'new task body 2')
    })
    it('edit a task body and select another task', () => {
        // Intercept task modify request
        cy.intercept('PATCH', '/tasks/modify/*').as('modifyTaskBodyMutation')

        // select one task
        cy.findAllByTestId('list-item').first().click()

        // make sure detail view has opened
        cy.findByTestId('details-view-container').should('be.visible')

        // edit the task body
        cy.findByTestId('task-body-input').clear().type('new task body 3')

        // select another task
        cy.findAllByTestId('list-item').eq(1).click()

        // wait for task body modify request to finish
        cy.wait('@modifyTaskBodyMutation')

        // reload page and verify that the task body has been updated
        cy.reload()
        cy.findAllByTestId('list-item').first().click()
        cy.findByTestId('task-body-input').should('have.value', 'new task body 3')
    })
})
