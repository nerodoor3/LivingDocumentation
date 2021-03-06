#!/bin/bash

./node_modules/.bin/typings install
cd ./app/
../node_modules/.bin/typings install
cd ..

tsc -p .
tsc -p ./app
tsc -p ./test

bury_copy() { mkdir -p $2 && cp $1 $2; }

bury_copy ./node_modules/systemjs/dist/system.src.js ./app/node_components/systemjs/

bury_copy ./node_modules/typescript/lib/typescript.js ./app/node_components/typescript/

bury_copy ./node_modules/es6-shim/es6-shim.js ./app/node_components/es6-shim/

bury_copy ./node_modules/zone.js/dist/zone.js ./app/node_components/zone.js/

bury_copy ./node_modules/reflect-metadata/Reflect.js ./app/node_components/reflect-metadata/
bury_copy ./node_modules/reflect-metadata/Reflect.js.map ./app/node_components/reflect-metadata/

bury_copy ./node_modules/@angular/common/common.umd.js ./app/node_components/@angular/common/
bury_copy ./node_modules/@angular/compiler/compiler.umd.js ./app/node_components/@angular/compiler/
bury_copy ./node_modules/@angular/core/core.umd.js ./app/node_components/@angular/core/
bury_copy ./node_modules/@angular/http/http.umd.js ./app/node_components/@angular/http/
bury_copy ./node_modules/@angular/platform-browser/platform-browser.umd.js ./app/node_components/@angular/platform-browser/
bury_copy ./node_modules/@angular/platform-browser-dynamic/platform-browser-dynamic.umd.js ./app/node_components/@angular/platform-browser-dynamic/
bury_copy ./node_modules/@angular/router-deprecated/router-deprecated.umd.js ./app/node_components/@angular/router-deprecated/
bury_copy ./node_modules/@angular/core/src/facade/lang.js ./app/node_components/@angular/core/src/facade/lang/
bury_copy ./node_modules/@angular/core/src/facade/lang.js.map ./app/node_components/@angular/core/src/facade/lang/

bury_copy ./node_modules/rxjs/bundles/Rx.js ./app/node_components/rxjs/

bury_copy ./node_modules/bootstrap/dist/css/bootstrap.css ./app/node_components/bootstrap/css/
bury_copy ./node_modules/bootstrap/dist/css/bootstrap.css.map ./app/node_components/bootstrap/css/
bury_copy "./node_modules/bootstrap/dist/fonts/*" ./app/node_components/bootstrap/fonts/

bury_copy ./node_modules/ng2-bootstrap/bundles/ng2-bootstrap.js ./app/node_components/ng2-bootstrap/

bury_copy ./node_modules/moment/moment.js ./app/node_components/moment/

bury_copy ./node_modules/underscore/underscore.js ./app/node_components/underscore/
