/**
 * @jest-environment jsdom
 */

import { fireEvent, screen } from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import { localStorageMock } from "../__mocks__/localStorage.js"
import mockedBills from "../__mocks__/store.js"
import userEvent from "@testing-library/user-event"
import '@testing-library/jest-dom'


describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    beforeEach(() => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      window.localStorage.setItem('email', JSON.stringify({
        type: 'a@a'
      }))
      const html = NewBillUI()
      document.body.innerHTML = html
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      const newBill = new NewBill({document, onNavigate, mockedBills, localStorageMock})
      newBill.store = mockedBills
    })

    test("Then uploading anything but jpg or png it should raise an alert", () => {
      const mockAlert = jest.fn()
      alert = mockAlert
      const inputFile = screen.getByTestId('file')
      const testFile = new File(["test"], "test.zip", {type: 'text/plain'})

      userEvent.upload(inputFile, testFile)

      expect(mockAlert).toHaveBeenCalledTimes(1)
    })

    test("Then uploading a jpg or png it should create a file in the store", () => {
      const inputFile = screen.getByTestId('file')
      const testFile = new File(["test"], "test.jpg", {type: 'image/jpg'})
      const mockCreate = jest.fn(mockedBills.bills().create)
      mockedBills.bills().create = mockCreate

      userEvent.upload(inputFile, testFile)

      expect(mockCreate).toHaveBeenCalledTimes(1)
    })
  })
})
