import { Component, Input, OnInit, Inject } from 'angular2/core';

import { adapter } from '../adapter';

import { ILivingDocumentation, IFeatures, IResult } from '../../domain-model';
import { ILivingDocumentationService } from '../services';

interface IStatistics {
    passed: number;
    pending: number;
    failed: number;
    manual: number;
    total: number;
}

@Component({
    selector: 'statistics',
    templateUrl: 'components/dashboard/statistics.html'
})
class Statistics {
    @Input() name: string;
    @Input() statistics: IStatistics;
}

@Component({
    directives: [Statistics],
    selector: 'documentation-dashboard',
    templateUrl: 'components/dashboard/documentation-dashboard.html'
})
class DocumentationDashboard implements OnInit {
    @Input() documentation: ILivingDocumentation;
    iterationFeatures = { failed: 0, manual: 0, passed: 0, pending: 0, total: 0 };
    iterationScenarios = { failed: 0, manual: 0, passed: 0, pending: 0, total: 0 };
    features = { failed: 0, manual: 0, passed: 0, pending: 0, total: 0 };
    scenarios = { failed: 0, manual: 0, passed: 0, pending: 0, total: 0 };

    private static isIteration(item: { Tags: string[]; }): boolean {
        return _.indexOf(item.Tags, '@iteration') !== -1;
    }

    private static processFeatures(
        features: IFeatures,
        includeItem: (item: { Tags: string[]; }) => boolean,
        featuresStatistics: IStatistics,
        scenariosStatistics: IStatistics): void {
        _.each(features, f => {
            let isFeatureIncluded = includeItem(f.Feature);
            let includedScenarios = _.filter(f.Feature.FeatureElements, s => isFeatureIncluded || includeItem(s));
            isFeatureIncluded = isFeatureIncluded || _.any(includedScenarios);
            if (isFeatureIncluded) {
                DocumentationDashboard.updateStatistics(f.Feature.Result, f.isManual, featuresStatistics);
            }

            _.each(
                includedScenarios,
                s => DocumentationDashboard.updateStatistics(s.Result, s.isManual, scenariosStatistics));
        });
    }

    private static updateStatistics(result: IResult, isManual: boolean, statistics: IStatistics): void {
        ++statistics.total;
        if (isManual) {
            ++statistics.manual;
            return;
        }

        if (!result.WasExecuted) {
            ++statistics.pending;
            return;
        }

        if (!result.WasSuccessful) {
            ++statistics.failed;
            return;
        }

        ++statistics.passed;
    }

    ngOnInit(): void {
        DocumentationDashboard.processFeatures(
            this.documentation.features,
            DocumentationDashboard.isIteration,
            this.iterationFeatures,
            this.iterationScenarios);
        DocumentationDashboard.processFeatures(
            this.documentation.features, _ => true, this.features, this.scenarios);
    }
}

@Component({
    directives: [DocumentationDashboard],
    selector: 'dashboard',
    templateUrl: 'components/dashboard/dashboard.html'
})
class Dashboard {
    static $inject: string[] = ['livingDocumentationService'];

    documentationList: ILivingDocumentation[];

    constructor(
        @Inject('livingDocumentationService') livingDocumentationService: ILivingDocumentationService
    ) {
        this.documentationList = livingDocumentationService.documentationList;
    }
}

angular.module('livingDocumentation.controllers.dashboard', [])
    .directive('dashboard', <ng.IDirectiveFactory>adapter.downgradeNg2Component(Dashboard))
    .directive('documentationDashboard', <ng.IDirectiveFactory>adapter.downgradeNg2Component(DocumentationDashboard))
    .directive('statistics', <ng.IDirectiveFactory>adapter.downgradeNg2Component(Statistics));
