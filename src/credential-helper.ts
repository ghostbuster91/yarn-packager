import { spawn } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { Logger } from "./logger";

export interface Credentials {
    Username: string;
    Secret: string;
    ServerURL: string;
}

interface DockerConfig {
    auths: any;
    credsStore?: string;
}
interface ServerAuthDetails {
    auth: string;
}

const decode = (str: string): string =>
    Buffer.from(str, "base64").toString("binary");

export async function getCredentials(logger: Logger): Promise<Credentials> {
    const homedir = os.homedir();
    const configJsonString = await fs.promises.readFile(
        path.join(homedir, ".docker", "config.json"),
        "utf-8"
    );
    const dockerConfig = JSON.parse(
        configJsonString.toString()
    ) as DockerConfig;
    logger.trace(`DockerConfig: ${configJsonString}`);
    if (dockerConfig.credsStore) {
        const authServer: string = Object.keys(dockerConfig.auths)[0];
        const programmName = credsStoreToProgrammName(dockerConfig.credsStore);
        logger.debug(`Selected ${programmName} credential helper`);
        const credentials = await executeCredentialHelper(
            programmName,
            authServer
        );
        logger.debug(
            `Found credentials for: ${credentials.ServerURL} with user: ${credentials.Username}`
        );
        return credentials;
    } else {
        logger.debug(`credStore not configured. Fallback to plainText method.`);
        const [authServer, serverAuthDetails] = Object.entries(
            dockerConfig.auths
        )[0];
        const [user, password] = decode(
            (serverAuthDetails as ServerAuthDetails).auth
        ).split(":");
        return { Username: user, Secret: password, ServerURL: authServer };
    }
}

function credsStoreToProgrammName(credsStore: string): string {
    if (credsStore == "desktop") {
        return "docker-credential-desktop";
    } else if (credsStore == "osxkeychain") {
        return "docker-credential-osxkeychain";
    } else if (credsStore == "secretservice") {
        return "docker-credential-secretservice";
    } else if (credsStore == "wincred") {
        return "docker-credential-wincred";
    } else if (credsStore == "pass") {
        return "docker-credential-pass";
    } else {
        throw new Error(`Unsupported type of credsStore ${credsStore}`);
    }
}
//"https://index.docker.io/v1/"
async function executeCredentialHelper(
    programName: string,
    serverAddress: string
): Promise<Credentials> {
    return new Promise((resolve, reject) => {
        try {
            const cp = spawn(programName, ["get"]);
            cp.stdin.write(serverAddress);
            cp.stdin.end();
            cp.stdout.on("data", (data) => {
                resolve(JSON.parse(data) as Credentials);
                cp.kill();
            });
        } catch (ex) {
            reject(ex);
        }
    });
}
