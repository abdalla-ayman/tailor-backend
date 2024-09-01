import express from 'express'
import cors from 'cors'
import winston from 'winston';
import expressWinston from 'express-winston';
import debug from 'debug'
import helmet from 'helmet';
import dotenv from 'dotenv';
const dotenvResult = dotenv.config();
if (dotenvResult.error) {
    throw dotenvResult.error;
}
import { CommonRoutesConfig } from './common/common.routes.config';
import { UserRoutes } from './users/users.routes.config';

const routes: Array<CommonRoutesConfig> = []
const app: express.Application = express()
const port = 3000 || process.env.PORT
const debugLog: debug.IDebugger = debug('app')

app.use(helmet())
app.use(cors())
app.use(express.json())


// here we are preparing the expressWinston logging middleware configuration,
// which will automatically log all HTTP requests handled by Express.js
const loggerOptions: expressWinston.LoggerOptions = {
    transports: [new winston.transports.Console()],
    format: winston.format.combine(
        winston.format.json(),
        winston.format.prettyPrint(),
        winston.format.colorize({ all: true })
    ),
};

if (!process.env.DEBUG) {
    loggerOptions.meta = false; // when not debugging, log requests as one-liners
}

// initialize the logger with the above configuration
app.use(expressWinston.logger(loggerOptions));


routes.push(new UserRoutes(app));


const runningMessage = `Server running at http://localhost:${port}`;
app.listen(port, () => {
    routes.forEach((route: CommonRoutesConfig) => {
        debugLog(`Routes configured for ${route.getName()}`);
    });
    console.log(runningMessage)

})


