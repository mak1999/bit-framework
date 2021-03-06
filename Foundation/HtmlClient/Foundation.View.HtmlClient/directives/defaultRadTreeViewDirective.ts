﻿/// <reference path="../../foundation.viewmodel.htmlclient/foundation.viewmodel.d.ts" />

module Foundation.View.Directives {

    @Core.DirectiveDependency({ name: "radTreeView" })
    export class DefaultRadTreeViewDirective implements ViewModel.Contracts.IDirective {

        public static defaultRadTreeViewDirectiveCustomizers: Array<($scope: ng.IScope, attribues: ng.IAttributes, element: JQuery, treeViewOptions: kendo.ui.TreeViewOptions) => void> = [];

        public getDirectiveFactory(): ng.IDirectiveFactory {
            return () => ({
                scope: false,
                replace: true,
                terminal: true,
                required: "ngModel",
                template: (element: JQuery, attrs: ng.IAttributes) => {

                    const guidUtils = Core.DependencyManager.getCurrent().resolveObject<ViewModel.Implementations.GuidUtils>("GuidUtils");

                    const itemTemplate = element
                        .children("item-template");

                    if (itemTemplate.length != 0) {

                        const itemTemplateId = guidUtils.newGuid();

                        itemTemplate
                            .attr("id", itemTemplateId)
                            .attr('ng-cloak', '');

                        angular.element(document.body).append(itemTemplate);

                        attrs["itemTemplateId"] = itemTemplateId;
                    }

                    const replaceAll = (text: string, search: string, replacement: string) => {
                        return text.replace(new RegExp(search, "g"), replacement);
                    };

                    const isolatedOptionsKey = "options" + replaceAll(guidUtils.newGuid(), "-", "");

                    attrs["isolatedOptionsKey"] = isolatedOptionsKey;

                    const template = `<div kendo-tree-view=${attrs["name"]} k-options="::${isolatedOptionsKey}" k-ng-delay="::${isolatedOptionsKey}" />`;

                    return template;
                },
                link($scope: ng.IScope, element: JQuery, attributes: any) {

                    const dependencyManager = Core.DependencyManager.getCurrent();

                    const $timeout = dependencyManager.resolveObject<ng.ITimeoutService>("$timeout");
                    const $parse = dependencyManager.resolveObject<ng.IParseService>("$parse");

                    $timeout(() => {

                        const watches = attributes.radText != null ? [attributes.radDatasource, (() => {
                            const modelParts = attributes.radText.split(".");
                            modelParts.pop();
                            const modelParentProp = modelParts.join(".");
                            return modelParentProp;
                        })()] : [attributes.radDatasource];

                        const watchForDataSourceUnRegisterHandler = $scope.$watchGroup(watches, (values: Array<any>) => {

                            if (values == null || values.length == 0 || values.some(v => v == null))
                                return;

                            const dataSource: kendo.data.DataSource = values[0];

                            watchForDataSourceUnRegisterHandler();

                            const kendoWidgetCreatedDisposal = $scope.$on("kendoWidgetCreated", (event, tree: kendo.ui.TreeView) => {

                                if (tree.element[0] != element[0]) {
                                    return;
                                }

                                kendoWidgetCreatedDisposal();

                                $scope.$on("$destroy", () => {

                                    if (tree.wrapper != null) {

                                        tree.wrapper.each(function (id, kElement) {
                                            let dataObj = angular.element(kElement).data();
                                            for (let mData in dataObj) {
                                                if (angular.isObject(dataObj[mData])) {
                                                    if (typeof dataObj[mData]["destroy"] == "function") {
                                                        dataObj[mData].destroy();
                                                    }
                                                }
                                            }
                                        });

                                        tree.wrapper.remove();
                                    }

                                    tree.destroy();

                                });

                                if (typeof ngMaterial != "undefined") {

                                    const mdInputContainerParent = tree.wrapper.parents("md-input-container");

                                    if (mdInputContainerParent.length != 0) {

                                        tree.wrapper
                                            .focusin(() => {

                                                if (angular.element(element).is(":disabled"))
                                                    return;

                                                mdInputContainerParent.addClass("md-input-focused");
                                            })
                                            .focusout(() => {
                                                mdInputContainerParent.removeClass("md-input-focused");
                                            });

                                        mdInputContainerParent.addClass("md-input-has-value");

                                        const $destroyDisposal = $scope.$on("$destroy", () => {
                                            tree.wrapper.unbind("focusin");
                                            tree.wrapper.unbind("focusout");
                                            $destroyDisposal();
                                        });
                                    }
                                }

                            });

                            const treeViewOptions: kendo.ui.TreeViewOptions = {
                                dataSource: dataSource,
                                autoBind: true,
                                dataTextField: attributes.radTextFieldName,
                                autoScroll: true,
                                animation: true,
                                checkboxes: false,
                                dragAndDrop: false,
                                loadOnDemand: true
                            };

                            if (attributes["itemTemplateId"] != null) {

                                const itemTemplateElement = angular.element("#" + attributes["itemTemplateId"]);

                                const itemTemplateElementHtml = itemTemplateElement.html();

                                const itemTemplate: any = kendo.template(itemTemplateElementHtml);

                                treeViewOptions.template = itemTemplate;
                            }

                            DefaultRadTreeViewDirective.defaultRadTreeViewDirectiveCustomizers.forEach(treeViewCustomizer => {
                                treeViewCustomizer($scope, attributes, element, treeViewOptions);
                            });

                            if (attributes.onInit != null) {
                                let onInitFN = $parse(attributes.onInit);
                                if (typeof onInitFN == 'function') {
                                    onInitFN($scope, { treeViewOptions: treeViewOptions });
                                }
                            }

                            $scope[attributes["isolatedOptionsKey"]] = treeViewOptions;

                        });
                    });
                }
            });
        }
    }
}