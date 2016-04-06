import { Component, Input, OnInit } from 'angular2/core';

import { adapter } from '../adapter';

import { ILivingDocumentation, IFeature, IScenario, ITable, IResult } from '../../domain-model';
import { ILivingDocumentationService } from '../services';
import { wrapInjectionConstructor, format } from '../utils';
import { HighlightPipe, HighlightTagPipe, NewLinePipe, ScenarioOutlinePlaceholderPipe, WidenPipe } from '../filters';

class FeatureDirective implements ng.IDirective {
    restrict = 'A';
    scope = {
        documentationCode: '@',
        featureCode: '@'
    };
    controller = 'Feature';
    controllerAs = 'ctrl';
    bindToController = true;
    templateUrl = 'components/feature/feature.tpl.html';
}

class Feature {
    static $inject: string[] = ['livingDocumentationService'];

    featureCode: string;
    documentationCode: string;
    documentation: ILivingDocumentation;
    feature: IFeature;
    featureEditUri: string;

    constructor(livingDocumentationService: ILivingDocumentationService) {
        this.documentation = _.find(
            livingDocumentationService.filteredDocumentationList,
            doc => doc.definition.code === this.documentationCode);

        this.feature = this.documentation.features[this.featureCode];
        if (this.documentation.definition.featureEditUri) {
            this.featureEditUri = format(
                this.documentation.definition.featureEditUri, this.feature.RelativeFolder.replace(/\\/g, '/'));
        }
    }

    get isExpanded(): boolean { return this.feature.isExpanded; }
    set isExpanded(value: boolean) {
        this.feature.isExpanded = value;
        _.each(this.feature.Feature.FeatureElements, s => s.isExpanded = value);
        if (this.feature.Feature.Background) {
            this.feature.Feature.Background.isExpanded = value;
        }
    }
}

@Component({
    pipes: [HighlightPipe, WidenPipe, ScenarioOutlinePlaceholderPipe],
    selector: 'feature-table',
    templateUrl: 'components/feature/table.tpl.html'
})
class Table {
    @Input() table: ITable;
    @Input() tests: string[];
}

@Component({
    pipes: [HighlightTagPipe],
    selector: 'tags',
    templateUrl: 'components/feature/tags.tpl.html'
})
class Tags implements OnInit {
    @Input() documentation: ILivingDocumentation;
    @Input() tags: string[];

    tagsWithIssueUrl: { issueUrl: string; tag: string; }[];

    ngOnInit(): void {
        this.tagsWithIssueUrl = this.tags.map(t => {
            return { issueUrl: this.getIssueTrackingUri(t), tag: t };
        });
    }

    private getIssueTrackingUri(tag: string): string {
        const match = new RegExp(this.documentation.definition.issueTrackingRegExp, 'i').exec(tag);
        return match === null ? null : format(this.documentation.definition.issueTrackingUri, ...match);
    }
}

@Component({
    selector: 'status',
    templateUrl: 'components/feature/status.tpl.html'
})
class Status {
    @Input() isManual: boolean;
    @Input() status: IResult;
}

@Component({
    directives: [Status, Tags, Table],
    pipes: [HighlightPipe, NewLinePipe, ScenarioOutlinePlaceholderPipe],
    selector: 'scenario',
    templateUrl: 'components/feature/scenario.tpl.html'
})
class Scenario {
    @Input() documentation: ILivingDocumentation;
    @Input() scenario: IScenario;
}

angular.module('livingDocumentation.feature', [
    'ngSanitize', 'livingDocumentation.services', 'livingDocumentation.filters'
])
    .directive('feature', wrapInjectionConstructor(FeatureDirective))
    .controller('Feature', Feature)
    .directive('scenario', <ng.IDirectiveFactory>adapter.downgradeNg2Component(Scenario))
    .directive('featureTable', <ng.IDirectiveFactory>adapter.downgradeNg2Component(Table))
    .directive('tags', <ng.IDirectiveFactory>adapter.downgradeNg2Component(Tags))
    .directive('status', <ng.IDirectiveFactory>adapter.downgradeNg2Component(Status));
