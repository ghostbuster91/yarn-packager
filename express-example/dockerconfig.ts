//import {UserDockerConfig} from 'js-docker-core'

const userConfig = {
imageConfig: {
    baseImage: "node:15-alpine",
    entrypoint: ["node", "index.js"],
    aliases: [{name: "node-test-img", tag: "13"}, {name: "node-test-img", tag: "not-latest"}],
    template: 'NPM_JS',
    dockerUpdateLatest: 'true',
    exposedPorts: [3000],
    mappings: [
        {from: "other-resource.txt", to: "/opt/test/other-resource.txt"}
    ],
    envVars: [{key: "DEBUG_ENABLED", value: "TRUE"}]
}
}	

module.exports = userConfig

