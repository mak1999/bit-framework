﻿module Foundation.Test.Implementations.Tests {
    export class UIAutomationTests {
        public static async testGetBindingContextAndGetFormViewModel(): Promise<void> {

            const uiAutomation = new UIAutomation<ViewModels.RepeatFormViewModel>(angular.element("#repeatView"));

            const repeatFormViewModel = uiAutomation.formViewModel;

            if (repeatFormViewModel.testModels.length != 2) {
                throw new Error("problem in testGetBindingContextAndGetViewModel");
            }

            if (repeatFormViewModel.someProperty != "This is a view model") {
                throw new Error("problem in testGetBindingContextAndGetViewModel");
            }

            repeatFormViewModel.testModels.forEach((tm, i) => {

                const tmFromView = uiAutomation.getBindingContext<Model.DomainModels.TestModel>(uiAutomation.view.find("#testModel" + i), "tm");

                if (tmFromView.Id != tm.Id)
                    throw new Error("problem in testGetBindingContextAndGetFormViewModel");

            });
        }

        public static async testGettingSomeVariables(firstNum: number, secondNum: number, message: string, date: Date, obj: { firstNum: number, secondNum: number, message: string, date: Date }): Promise<void> {

            if (firstNum + secondNum != 10)
                throw new Error("problem in passing args");

            if (message != "Hi")
                throw new Error("problem in passing args");

            if (date.getFullYear() != 2016)
                throw new Error("problem in passing args");

            if (obj.date.getFullYear() != date.getFullYear())
                throw new Error("problem in passing args");

            if (obj.firstNum != firstNum)
                throw new Error("problem in passing args");

            if (obj.secondNum != secondNum)
                throw new Error("problem in passing args");

            if (obj.message != message)
                throw new Error("problem in passing args");
        }
    }
}