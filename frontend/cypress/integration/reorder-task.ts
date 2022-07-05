/**
 * Test Cases:
 * (+) Move task to the task drop area below the task list
 * (+) Move task between other tasks
 * (+) Move task to another section
 * (+) Verify that a task cannot be moved to the done section
 * (+) Verify that a task cannot be dragged out of the done section
 */
describe('user can reorder tasks using react-dnd', () => {
    beforeEach('login the user', () => {
        cy.login()
        cy.visit('/')
        cy.acceptTermsOfService()

        // Intercept task modify requests
        cy.intercept('PATCH', '/tasks/modify/*').as('taskModifyMutation')
    })
    it('user can move task to drop area below task list', () => {
        // Start drag on first task
        cy.findAllByTestId('list-item').first().findByTestId('drag-domino').dragStart()
        cy.findAllByTestId('list-item').first().invoke('text').then(($text) => {
            // End drag on bottom of the task list
            cy.findByTestId('reorder-bottom-drop-area').dragEnd('center')
            cy.wait('@taskModifyMutation').then(({ response }) => { expect(response?.statusCode).to.eq(200) })
            cy.findAllByTestId('list-item').last().should('have.text', $text)
        })
    })
    it('user can move task below other tasks', () => {
        // Start drag on first task
        cy.findAllByTestId('list-item').first().findByTestId('drag-domino').dragStart()
        cy.findAllByTestId('list-item').first().invoke('text').then(($text) => {
            // End drag on bottom of second task
            cy.findAllByTestId('list-item').eq(1).dragEnd('bottom')
            cy.wait('@taskModifyMutation').then(({ response }) => { expect(response?.statusCode).to.eq(200) })
            cy.findAllByTestId('list-item').eq(1).should('have.text', $text)
        })
    })
    it('user can move task above other tasks', () => {
        // Start drag on first task
        cy.findAllByTestId('list-item').first().findByTestId('drag-domino').dragStart()
        cy.findAllByTestId('list-item').first().invoke('text').then(($text) => {
            // End drag on top of second task
            cy.findAllByTestId('list-item').eq(2).dragEnd('top')
            cy.wait('@taskModifyMutation').then(({ response }) => { expect(response?.statusCode).to.eq(200) })
            cy.findAllByTestId('list-item').eq(1).should('have.text', $text)
        })
    })
    it('user can move task to another section', () => {
        // Create a new task section
        cy.findAllByTestId('task-section-link').should('have.length', 1)
        cy.findByTestId('add-section-button').click()
        cy.findByTestId('add-section-input').should('be.visible').type('New Section').type('{enter}')
        cy.findAllByTestId('task-section-link').should('have.length', 2)

        // Start drag on first task
        cy.findAllByTestId('list-item').first().findByTestId('drag-domino').dragStart()
        cy.findAllByTestId('list-item').first().invoke('text').then(($text) => {
            // End drag on second task section
            cy.findAllByTestId('task-section-link').eq(1).dragEnd('center').click()
            cy.wait('@taskModifyMutation').then(({ response }) => { expect(response?.statusCode).to.eq(200) })
            cy.findByTestId('list-item').should('have.text', $text)
        })
    })
    it('user cannot move task to done section', () => {
        // Start drag on first task
        cy.findAllByTestId('list-item').first().findByTestId('drag-domino').dragStart()
        cy.findAllByTestId('list-item').first().invoke('text').then(($text) => {
            // End drag on done section
            cy.findByTestId('done-section-link').dragEnd('center')
            // Verify that the task was not moved
            cy.findAllByTestId('list-item').first().should('have.text', $text)
        })
    })
    it('user cannot drag task out of done section', () => {
        // Complete a task
        cy.findAllByTestId('list-item').first().within(() => {
            cy.get('button').find('img').should('have.attr', 'src', '/images/task_incomplete.png').click()
        })
        cy.wait('@taskModifyMutation').then(({ response }) => { expect(response?.statusCode).to.eq(200) })
        // Go to done section
        cy.reload()
        cy.findByTestId('done-section-link').click()
        // Verify that there are no drag handlers on any tasks
        cy.findAllByTestId('list-item').should('exist')
        cy.findAllByTestId('drag-domino').should('not.exist')
    })
})
