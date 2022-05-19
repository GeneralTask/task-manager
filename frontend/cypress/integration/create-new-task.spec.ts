describe('tests related to task creation from task section', () => {
    before('login the user', () => {
        cy.login()
        cy.visit('/')
        cy.acceptTermsOfService()
    })
    beforeEach(() => {
        Cypress.Cookies.preserveOnce('authToken')
    })
    it('clicking "enter" in the input field should not create a new task', () => {
        cy.intercept('POST', '/tasks/create/gt_task/', () => {
            throw new Error('Create new task request should not be sent')
        })
        cy.findByPlaceholderText('Add new task').type('{enter}')
        cy.findAllByTestId('list-item').should('have.length', 3)
    })
    it('clicking "enter" in the input field should create a new task with title "New task"', () => {
        // Add task title to input field
        cy.findByPlaceholderText('Add new task').type('New task')
        cy.intercept('POST', '/tasks/create/gt_task/').as('createTask')

        // Click enter
        cy.findByPlaceholderText('Add new task').type('{enter}')
        cy.wait('@createTask')

        // Check that task is created
        cy.findAllByTestId('list-item').should('have.length', 4)
        cy.findAllByTestId('list-item').first().should('contain', 'New task')
    })
})
