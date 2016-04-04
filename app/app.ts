import { ILivingDocumentationService } from './components/services';
import { adapter } from './components/adapter';

import './components/living_documentation_app/living-documentation-app';
import './components/dashboard/dashboard';
import './components/documentation_list/documentation-list';
import './components/feature/feature';
import './components/directives';
import './components/filters';

angular.module('livingDocumentation', [
    'ngRoute',
    'livingDocumentation.app',
    'livingDocumentation.controllers.dashboard',
    'livingDocumentation.feature'
]).config(['$routeProvider', ($routeProvider: angular.route.IRouteProvider) => {
    const resolve: { [key: string]: any; } = {
        livingDocumentationServiceReady: [
            'livingDocumentationService',
            (service: ILivingDocumentationService) => service.resolve
        ]
    };

    $routeProvider.when('/dashboard', {
        resolve: resolve,
        template: '<div dashboard></div>'
    });

    $routeProvider.when('/feature/:documentationCode/:featureCode', {
        resolve: resolve,
        template: ($routeParams: angular.route.IRouteParamsService) =>
            `<div feature
                feature-code="${$routeParams['featureCode']}"
                documentation-code="${$routeParams['documentationCode']}">
             </div>`
    });

    $routeProvider.otherwise({ redirectTo: '/dashboard' });
}]);

adapter.bootstrap(document.body, ['livingDocumentation']);
