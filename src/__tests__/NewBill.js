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
        type: 'Employee',
        email: 'a@a'
      }))
      const html = NewBillUI()
      document.body.innerHTML = html
    })

    test("Then uploading anything but jpg or png it should raise an alert", () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      const newBill = new NewBill({document, onNavigate, mockedBills, localStorageMock})
      newBill.store = mockedBills
      const mockAlert = jest.fn()
      alert = mockAlert
      const inputFile = screen.getByTestId('file')
      const testFile = new File(["test"], "test.zip", {type: 'text/plain'})

      userEvent.upload(inputFile, testFile)

      expect(mockAlert).toHaveBeenCalledTimes(1)
    })

    test("Then uploading a jpg or png it should create a file in the store", () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      const newBill = new NewBill({document, onNavigate, mockedBills, localStorageMock})
      newBill.store = mockedBills
      const inputFile = screen.getByTestId('file')
      const testFile = new File(["test"], "test.jpg", {type: 'image/jpg'})
      const mockCreate = jest.fn(mockedBills.bills().create)
      mockedBills.bills().create = mockCreate

      userEvent.upload(inputFile, testFile)

      expect(mockCreate).toHaveBeenCalledTimes(1)
    })

    test("Then we can submit a bill", async () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      const newBill = new NewBill({document, onNavigate, mockedBills, localStorageMock})
      newBill.store = mockedBills
      const inputFile = screen.getByTestId('file')
      const testFile = new File(["test"], "test.jpg", {type: 'image/jpg'})
      const mockOnNavigate = jest.fn()
      newBill.onNavigate = mockOnNavigate
      const mockUpdateBill = jest.fn(newBill.updateBill)
      newBill.updateBill = mockUpdateBill

      // we need to parse getItem once more because it JSON.stringify the result
      const mockLocalStorageGetItem = jest.fn(localStorageMock.getItem)
      localStorageMock.getItem = key => JSON.parse(mockLocalStorageGetItem(key))

      await userEvent.upload(inputFile, testFile)
      await userEvent.selectOptions(screen.getByTestId('expense-type'), ['Services en ligne'])
      await userEvent.type(screen.getByTestId('expense-name'), 'test')
      await userEvent.type(screen.getByTestId('amount'), '250')
      // datepicker dateformat is US style
      await userEvent.type(screen.getByTestId('datepicker'), '2023-12-12')
      await userEvent.type(screen.getByTestId('vat'), '25')
      await userEvent.type(screen.getByTestId('pct'), '10')
      await userEvent.type(screen.getByTestId('commentary'), 'a test commentary for the bill')
      await userEvent.click(document.querySelector('#btn-send-bill'))

      // call onNavigate 2 times because once in NewBill.handleSubmit 
      // and once in updateBill who is called in handleSubmit
      expect(mockOnNavigate).toHaveBeenCalledTimes(2)
      expect(mockUpdateBill).toHaveBeenCalledWith({
        "amount": 250, 
        "commentary": "a test commentary for the bill", 
        "date": "2023-12-12",
        "email": "a@a",
        "fileName": "test.jpg", 
        "fileUrl": "https://localhost:3456/images/test.jpg", 
        "name": "test", 
        "pct": 10, 
        "status": "pending", 
        "type": "Services en ligne", 
        "vat": "25"
      })
    })
  })
})
