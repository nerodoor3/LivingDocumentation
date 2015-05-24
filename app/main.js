'use strict';
var utils;
(function (utils) {
    function wrapInjectionConstructor(constructor, transformer) {
        return constructor.$inject.concat(function () {
            var functionConstructor = constructor.bind.apply(constructor, [null].concat(Array.prototype.slice.call(arguments, 0)));
            var res = new functionConstructor();
            return !transformer ? res : transformer(res);
        });
    }
    utils.wrapInjectionConstructor = wrapInjectionConstructor;
    function wrapFilterInjectionConstructor(constructor) {
        return utils.wrapInjectionConstructor(constructor, function (f) {
            return f.filter.bind(f);
        });
    }
    utils.wrapFilterInjectionConstructor = wrapFilterInjectionConstructor;
})(utils || (utils = {}));
/// <reference path="../../typings/angularjs/angular.d.ts" />
/// <reference path="../../typings/angularjs/angular-resource.d.ts" />
/// <reference path="../../typings/underscore/underscore.d.ts" />
/// <reference path="utils.ts" />
'use strict';
var livingDocumentation;
(function (livingDocumentation) {
    var LivingDocumentationServer = (function () {
        function LivingDocumentationServer($resource, $q) {
            this.$q = $q;
            this.featuresSourceResourceClass = $resource('data/:resource', null, { get: { method: 'GET' } });
            this.featuresTestsSourceResourceClass = $resource('data/:resource', null, { get: { method: 'GET' } });
            this.livingDocResDefResourceClass =
                $resource('data/:definition', null, { get: { method: 'GET', isArray: true } });
        }
        LivingDocumentationServer.prototype.getResourceDefinitions = function () {
            return this.livingDocResDefResourceClass.get({ definition: 'configuration.json' }).$promise;
        };
        LivingDocumentationServer.prototype.get = function (resource) {
            var promiseFeatures = this.featuresSourceResourceClass.get({ resource: resource.featuresResource }).$promise;
            var promiseTests = !resource.testsResources
                ? this.$q.when(null)
                : this.featuresTestsSourceResourceClass.get({ resource: resource.testsResources }).$promise;
            return this.$q.all([promiseFeatures, promiseTests]).then(function (arr) { return LivingDocumentationServer.parseFeatures(resource, arr[0].Features, arr[0].Configuration.GeneratedOn, !arr[1] ? null : arr[1].FeaturesTests); });
        };
        LivingDocumentationServer.findSubfolderOrCreate = function (parent, childName) {
            var res = _.find(parent.children, function (c) { return c.name === childName; });
            if (!res) {
                res = {
                    name: childName,
                    children: [],
                    features: []
                };
                parent.children.push(res);
            }
            return res;
        };
        LivingDocumentationServer.getSubfolder = function (parent, folders) {
            if (!folders || folders.length === 0) {
                return parent;
            }
            var child = LivingDocumentationServer.findSubfolderOrCreate(parent, folders.shift());
            return LivingDocumentationServer.getSubfolder(child, folders);
        };
        LivingDocumentationServer.parseFeatures = function (resource, features, lastUpdatedOn, featuresTests) {
            var root = {
                name: resource.name,
                children: [],
                features: [],
                isRoot: true
            };
            var featuresTestsMap = featuresTests === null
                ? undefined : _.indexBy(featuresTests, function (f) { return f.RelativeFolder; });
            var resFeatures = {};
            _.each(features, function (f) {
                var folders = f.RelativeFolder.match(/[^\\/]+/g);
                f.code = folders.pop();
                if (featuresTestsMap) {
                    LivingDocumentationServer.addTests(f, featuresTestsMap[f.RelativeFolder], resource.testUri);
                }
                LivingDocumentationServer.getSubfolder(root, folders).features.push(f);
                resFeatures[f.code] = f;
            });
            return {
                definition: resource,
                root: root,
                features: resFeatures,
                lastUpdatedOn: new Date(lastUpdatedOn.valueOf())
            };
        };
        LivingDocumentationServer.addTests = function (feature, featureTests, testUri) {
            if (!featureTests) {
                return;
            }
            var scenarioTestsMap = _.groupBy(featureTests.ScenariosTests, function (s) { return s.ScenarioName; });
            _.each(feature.Feature.FeatureElements, function (scenario) {
                var scenarioTests = scenarioTestsMap[scenario.Name];
                if (!scenarioTests) {
                    return;
                }
                scenario.tests = _.map(scenarioTests, function (s) { return (testUri || '') + s.Test; });
            });
        };
        return LivingDocumentationServer;
    })();
    var TIMEOUT = 200;
    var LivingDocumentationService = (function () {
        function LivingDocumentationService($resource, $q, $timeout) {
            this.$q = $q;
            this.$timeout = $timeout;
            this.documentationList = [];
            this.livingDocumentationServer = new LivingDocumentationServer($resource, $q);
            this.loading = true;
            this.deferred = $q.defer();
            this.resolve = this.deferred.promise;
        }
        LivingDocumentationService.prototype.startInitialization = function () {
            var _this = this;
            if (this.onStartProcessing) {
                this.onStartProcessing();
            }
            this.deferred.promise.finally(function () { return _this.onStopProcessing(); });
            this.livingDocumentationServer.getResourceDefinitions()
                .then(function (resources) { return _this.$q.all(_.map(resources, function (r) { return _this.livingDocumentationServer.get(r); })); })
                .then(function (docs) {
                _this.documentationList = docs;
                _this.$timeout(function () {
                    _this.deferred.resolve(_this);
                    _this.initialize();
                }, TIMEOUT);
            }, function (err) { return _this.$timeout(function () {
                _this.deferred.reject(err);
                _this.onError(err);
            }, TIMEOUT); });
        };
        LivingDocumentationService.prototype.onError = function (err) {
            console.error(err);
            this.error = err;
            this.loading = false;
        };
        LivingDocumentationService.prototype.initialize = function () {
            this.loading = false;
            this.ready = true;
        };
        LivingDocumentationService.$inject = ['$resource', '$q', '$timeout'];
        return LivingDocumentationService;
    })();
    angular.module('livingDocumentation.services', ['ngResource'])
        .value('version', '0.1')
        .service('livingDocumentationService', LivingDocumentationService);
})(livingDocumentation || (livingDocumentation = {}));
/// <reference path="../typings/angularjs/angular.d.ts" />
/// <reference path="../typings/angularjs/angular-route.d.ts" />
/// <reference path="js/services.ts" />
'use strict';
angular.module('livingDocumentation', [
    'ngRoute',
    'ngSanitize',
    'ui.bootstrap',
    'livingDocumentation.filters',
    'livingDocumentation.services',
    'livingDocumentation.directives',
    'livingDocumentation.controllers',
    'livingDocumentation.controllers.root',
    'livingDocumentation.documentationList'
]).config(['$routeProvider', function ($routeProvider) {
        var resolve = {
            livingDocumentationServiceReady: [
                'livingDocumentationService',
                function (service) { return service.resolve; }
            ]
        };
        $routeProvider.when('/home', {
            templateUrl: 'partials/home.html',
            controller: 'Home',
            resolve: resolve
        });
        $routeProvider.when('/feature/:documentationCode/:featureCode', {
            templateUrl: 'partials/feature.html',
            controller: 'Feature',
            resolve: resolve
        });
        $routeProvider.otherwise({ redirectTo: '/home' });
    }]);
/// <reference path="../../typings/angular-ui-bootstrap/angular-ui-bootstrap.d.ts" />
/// <reference path="../js/services.ts" />
'use strict';
var livingDocumentation;
(function (livingDocumentation) {
    var RootCtrl = (function () {
        function RootCtrl(livingDocService, $modal) {
            this.livingDocService = livingDocService;
            var modalInstance;
            livingDocService.onStartProcessing = function () {
                if (modalInstance) {
                    return;
                }
                modalInstance = $modal.open({ templateUrl: 'processing.html', backdrop: 'static', keyboard: false });
            };
            livingDocService.onStopProcessing = function () {
                modalInstance.close();
                modalInstance = null;
            };
            livingDocService.startInitialization();
        }
        Object.defineProperty(RootCtrl.prototype, "loading", {
            get: function () { return this.livingDocService.loading; },
            set: function (value) { },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(RootCtrl.prototype, "error", {
            get: function () { return this.livingDocService.error; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(RootCtrl.prototype, "ready", {
            get: function () { return this.livingDocService.ready; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(RootCtrl.prototype, "lastUpdatedOn", {
            get: function () {
                return _.find(this.livingDocService.documentationList, function (doc) { return doc.lastUpdatedOn; }).lastUpdatedOn;
            },
            enumerable: true,
            configurable: true
        });
        RootCtrl.$inject = ['livingDocumentationService', '$modal'];
        return RootCtrl;
    })();
    angular.module('livingDocumentation.controllers.root', ['livingDocumentation.services'])
        .controller('RootCtrl', RootCtrl);
})(livingDocumentation || (livingDocumentation = {}));
/// <reference path="../../typings/angular-ui-bootstrap/angular-ui-bootstrap.d.ts" />
/// <reference path="../js/utils.ts" />
/// <reference path="../js/services.ts" />
'use strict';
var livingDocumentation;
(function (livingDocumentation) {
    var DocumentationListDirective = (function () {
        function DocumentationListDirective() {
            this.restrict = 'A';
            this.controller = 'DocumentationList';
            this.controllerAs = 'root';
            this.bindToController = true;
            this.templateUrl = 'components/documentation-list.tpl.html';
        }
        DocumentationListDirective.$inject = [];
        return DocumentationListDirective;
    })();
    var DocumentationList = (function () {
        function DocumentationList(livingDocService) {
            this.documentationList = livingDocService.documentationList;
        }
        DocumentationList.$inject = ['livingDocumentationService'];
        return DocumentationList;
    })();
    angular
        .module('livingDocumentation.documentationList', ['livingDocumentation.services'])
        .directive('documentationList', utils.wrapInjectionConstructor(DocumentationListDirective))
        .controller('DocumentationList', DocumentationList);
})(livingDocumentation || (livingDocumentation = {}));
/// <reference path="../../typings/angularjs/angular.d.ts" />
/// <reference path="../../typings/angularjs/angular-route.d.ts" />
/// <reference path="../../typings/angular-ui-bootstrap/angular-ui-bootstrap.d.ts" />
/// <reference path="../../typings/underscore/underscore.d.ts" />
/// <reference path="utils.ts" />
/// <reference path="services.ts" />
'use strict';
var livingDocumentation;
(function (livingDocumentation) {
    var Home = (function () {
        function Home($scope, livingDocumentationService) {
        }
        Home.$inject = ['$scope', 'livingDocumentationService'];
        return Home;
    })();
    var Feature = (function () {
        function Feature($scope, $routeParams, livingDocumentationService) {
            var doc = _.find(livingDocumentationService.documentationList, function (doc) { return doc.definition.code === $routeParams['documentationCode']; });
            $scope['feature'] = doc.features[$routeParams['featureCode']];
        }
        Feature.$inject = ['$scope', '$routeParams', 'livingDocumentationService'];
        return Feature;
    })();
    angular.module('livingDocumentation.controllers', ['livingDocumentation.services'])
        .controller('Home', Home)
        .controller('Feature', Feature);
})(livingDocumentation || (livingDocumentation = {}));
/// <reference path="../../typings/angularjs/angular.d.ts" />
/// <reference path="utils.ts" />
'use strict';
var livingDocumentation;
(function (livingDocumentation) {
    var AppVersion = (function () {
        function AppVersion(version) {
            var _this = this;
            this.version = version;
            this.link = function (scope, element, attributes) { return _this.linkCore(element); };
        }
        AppVersion.prototype.linkCore = function (element) {
            element.text(this.version);
        };
        AppVersion.$inject = ['version'];
        return AppVersion;
    })();
    var IsActive = (function () {
        function IsActive($location) {
            var _this = this;
            this.$location = $location;
            this.link = function (scope, element, attributes) { return _this.linkCore(scope, element, attributes); };
        }
        IsActive.prototype.linkCore = function (scope, element, attributes) {
            var _this = this;
            var handler = function () {
                var isActive;
                if (attributes['isActive']) {
                    isActive = _this.$location.path().indexOf(attributes['isActive']) === 0;
                }
                else {
                    var indexOf = _this.$location.path().indexOf(attributes['isActiveLast']);
                    isActive = indexOf >= 0 &&
                        (indexOf + attributes['isActiveLast'].length === _this.$location.path().length);
                }
                if (isActive) {
                    element.addClass('active');
                }
                else {
                    element.removeClass('active');
                }
            };
            handler();
            IsActive.subscribe(scope, handler);
        };
        IsActive.subscribe = function (scope, handler) {
            scope.$on('$routeChangeSuccess', handler);
            scope.$on('$includeContentLoaded', handler);
        };
        IsActive.$inject = ['$location'];
        return IsActive;
    })();
    angular
        .module('livingDocumentation.directives', [])
        .directive('appVersion', utils.wrapInjectionConstructor(AppVersion))
        .directive('isActive', utils.wrapInjectionConstructor(IsActive))
        .directive('isActiveLast', utils.wrapInjectionConstructor(IsActive));
})(livingDocumentation || (livingDocumentation = {}));
/// <reference path="../../typings/angularjs/angular.d.ts" />
/// <reference path="utils.ts" />
/// <reference path="services.ts" />
'use strict';
var livingDocumentation;
(function (livingDocumentation) {
    var NewLineFilter = (function () {
        function NewLineFilter() {
        }
        NewLineFilter.prototype.filter = function (str) {
            return !str ? str : str.replace(/\r\n/mg, '<br />');
        };
        NewLineFilter.$inject = [];
        return NewLineFilter;
    })();
    angular
        .module('livingDocumentation.filters', [])
        .filter('newline', utils.wrapFilterInjectionConstructor(NewLineFilter));
})(livingDocumentation || (livingDocumentation = {}));
//# sourceMappingURL=main.js.map