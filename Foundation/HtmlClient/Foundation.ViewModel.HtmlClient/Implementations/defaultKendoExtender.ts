﻿/// <reference path="../../foundation.core.htmlclient/foundation.core.d.ts" />
module Foundation.ViewModel.Implementations {
    export class DefaultKendoExtender implements Core.Contracts.IAppEvents {
        @Core.Log()
        public async onAppStartup(): Promise<void> {

            function flattenGroups(data) {

                let idx, result = [], length, items, itemIndex;

                for (idx = 0, length = data.length; idx < length; idx++) {
                    const group = data[idx];
                    if (group.hasSubgroups) {
                        result = result.concat(flattenGroups(group.items));
                    } else {
                        items = group.items;
                        for (itemIndex = 0; itemIndex < items.length; itemIndex++) {
                            result.push(items[itemIndex] /* instead of items.at(itemIndex) */);
                        }
                    }
                }

                return result;

            }

            kendo.data.DataSource.prototype.flatView = function () {

                const groups = this.group() || [];

                if (groups.length) {
                    return flattenGroups(this._view);
                } else {
                    return this._view;
                }

            }

            const originalParseDate = kendo.parseDate;

            kendo.parseDate = function (value: string, format?: string, culture?: string): Date {
                if (value != null) {
                    const date = new Date(value);
                    if (date.toString() != "Invalid Date")
                        return date;
                }
                return originalParseDate.apply(this, arguments);
            };

            kendo.data.DataSource.prototype.dataView = function () {
                return (this as kendo.data.DataSource)
                    .flatView()
                    .map(vi => {
                        const viItem = (vi as any);
                        return viItem.innerInstance != null ? viItem.innerInstance() : viItem;
                    });
            };

            kendo.data.DataSource.prototype.onCurrentChanged = function (action) {

                const dataSource = this;

                dataSource.onCurrentChangedHandlers = dataSource.onCurrentChangedHandlers || [];

                if (action != null) {
                    dataSource.onCurrentChangedHandlers.push(action);
                } else {

                    for (let handler of dataSource.onCurrentChangedHandlers) {
                        handler();
                    }
                }

            };

            kendo.data.DataSource.prototype.asChildOf = function (parentDataSource, childKeys, parentKeys) {

                if (parentDataSource == null)
                    throw new Error("parentDataSource is null");

                if (childKeys == null || childKeys.length == 0) {
                    throw new Error("childs keys is null or empty");
                }

                if (parentKeys == null || parentKeys.length == 0) {
                    throw new Error("parent keys is null or empty");
                }

                if (childKeys.length != parentKeys.length) {
                    throw new Error("Child keys and parent keys must have the same length");
                }

                const childDataSource: kendo.data.DataSource = this;

                for (let key of childKeys) {
                    if (childDataSource.options.schema.model.fields[key] == null) {
                        throw new Error(`child data source schema has no property named ${key}`);
                    }
                }

                for (let key of parentKeys) {
                    if (parentDataSource.options.schema.model.fields[key] == null) {
                        throw new Error(`parent data source schema has no property named ${key}`);
                    }
                }

                parentDataSource.onCurrentChanged(async () => {

                    if (childDataSource.current != null)
                        childDataSource.current = null;

                    let parentKeyCurrentValues: any[] = null;
                    const currentParent = parentDataSource.current;

                    await new Promise<void>((resolve) => {
                        setTimeout(() => resolve(), 350);
                    });

                    if (currentParent != parentDataSource.current)
                        return;

                    if (currentParent == null || parentKeys.some(pk => currentParent[pk] == null)) {
                        childDataSource.fetch();
                        return;
                    }
                    else {
                        parentKeyCurrentValues = parentKeys.map(pk => { return currentParent[pk]; });;
                    }

                    const parentChildFilters: kendo.data.DataSourceFilters = {
                        logic: "and", filters: childKeys.map((ck, ckI) => {
                            return { field: ck, value: parentKeyCurrentValues[ckI], operator: "eq", isParentChildFilter: true, parentField: parentKeys[ckI] }
                        })
                    };

                    const currentChildFilters = childDataSource.filter();

                    if (currentChildFilters == null || ((currentChildFilters instanceof Array) && currentChildFilters.length == 0) || (currentChildFilters.filters != null && (currentChildFilters.filters instanceof Array) && currentChildFilters.filters.length == 0)) {
                        childDataSource.filter(parentChildFilters);
                    }
                    else {
                        const checkFilters = (filtersToBeChecked) => {
                            for (let flt of filtersToBeChecked as any) {
                                const childKeyI = childKeys.findIndex(ck => ck == flt.field);
                                if (childKeyI != -1) {
                                    flt.value = parentKeyCurrentValues[childKeyI];
                                    flt.isParentChildFilter = true;
                                }
                            }
                        };
                        const filters = currentChildFilters.filters as any;
                        checkFilters(filters);
                        if (filters != null) {
                            filters.filter(innerFilters => innerFilters.filters != null).forEach(innerFilters => checkFilters(innerFilters.filters));
                        }
                        childDataSource.filter(currentChildFilters);
                    }
                });

                const originalChildTransportRead = childDataSource["transport"].read;

                childDataSource["transport"].read = function (options) {

                    const currentParent = parentDataSource.current;

                    let parentChildFilterIsValid = options.data.filter != null && options.data.filter.filters != null;

                    const checkFilters = (filtersToBeChecked) => {
                        for (let flt of filtersToBeChecked as any) {
                            if (flt.isParentChildFilter == true && (currentParent != null && flt.value != currentParent[flt.parentField]))
                                parentChildFilterIsValid = false;
                        }
                    };

                    if (parentChildFilterIsValid == true) {
                        const filters = options.data.filter.filters;
                        checkFilters(filters);
                        if (filters != null) {
                            filters.filter(innerFilters => innerFilters.filters != null).forEach(innerFilters => checkFilters(innerFilters.filters));
                        }
                    }

                    if (currentParent == null || parentKeys.some(pk => currentParent[pk] == null) || parentChildFilterIsValid == false) {
                        options.success({ data: [], length: 0 });
                    }
                    else {
                        return originalChildTransportRead.apply(this, arguments);
                    }
                }

                const originalChildTransportCreate = childDataSource["transport"].create;

                childDataSource["transport"].create = function (options, models): void {

                    const currentParent = parentDataSource.current;

                    if (currentParent == null || parentKeys.some(pk => currentParent[pk] == null)) {
                        throw new Error("Parent data source's current item is null or new");
                    }

                    for (let model of models) {
                        for (let i = 0; i < childKeys.length; i++) {
                            model[childKeys[i]] = currentParent[parentKeys[i]];
                            (model.innerInstance != null ? model.innerInstance() : model)[childKeys[i]] = currentParent[parentKeys[i]];
                        }
                    }

                    return originalChildTransportCreate.apply(this, arguments);
                }
            }
        }
    }
}