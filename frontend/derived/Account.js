"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = __importDefault(require("react"));
var styled_components_1 = __importDefault(require("styled-components"));
var AccountDiv = styled_components_1.default.div(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  font-size: 24px;\n  margin-bottom: 30px;\n"], ["\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  font-size: 24px;\n  margin-bottom: 30px;\n"])));
var AccountLogo = styled_components_1.default.img(templateObject_2 || (templateObject_2 = __makeTemplateObject(["\n  height: 35px;\n"], ["\n  height: 35px;\n"])));
var ConnectButton = styled_components_1.default.button(templateObject_3 || (templateObject_3 = __makeTemplateObject(["\n  font-size: 20px;\n  padding: 4px 8px 4px;\n  background-color: black;\n  border-radius: 4px;\n  color: white;\n  cursor: pointer;\n"], ["\n  font-size: 20px;\n  padding: 4px 8px 4px;\n  background-color: black;\n  border-radius: 4px;\n  color: white;\n  cursor: pointer;\n"])));
var Account = function (_a) {
    var name = _a.name, logo = _a.logo, link = _a.link;
    return (react_1.default.createElement(AccountDiv, null,
        react_1.default.createElement(AccountLogo, { src: logo, alt: name + " logo" }),
        react_1.default.createElement("div", null, name),
        react_1.default.createElement(ConnectButton, { onClick: function () {
                window.open(link, name, "height=640,width=960,toolbar=no,menubar=no,scrollbars=no,location=no,status=no");
            } }, "Connect")));
};
exports.default = Account;
var templateObject_1, templateObject_2, templateObject_3;
