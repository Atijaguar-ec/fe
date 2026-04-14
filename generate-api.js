var fs = require('fs');
var converter = require('api-spec-converter');
var child_process = require('child_process');
var fetch = require("node-fetch");

var swagger_docs_host = 'http://localhost:8082/v3/api-docs'

function afterBuild(code) {
    if (code === 0) {
        fs.unlinkSync('apps/inatrace-fe/src/api/index.ts');
        fs.unlinkSync('apps/inatrace-fe/src/api/api/api.ts');
        fs.unlinkSync('apps/inatrace-fe/src/api/model/models.ts');
        console.log("Conversion successful.");
    } else {
        console.error("Conversion finished with status ", code);
    }
}

console.log("Generating form: " + swagger_docs_host);

if (!fs.existsSync('apps/inatrace-fe/src/api')) {
    fs.mkdirSync('apps/inatrace-fe/src/api', { recursive: true });
}

fetch(swagger_docs_host).then(function(res) {
    res.json().then(function() {

        // generate TS API
        var proc = child_process.fork("node_modules/openapi-typescript-angular-generator/bin/ng-ts-codegen.js", [
            '-i', swagger_docs_host,
            '-o', 'apps/inatrace-fe/src/api'
        ]);
        proc.on('exit', afterBuild);
    })
})
