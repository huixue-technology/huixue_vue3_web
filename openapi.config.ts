// @ts-nocheck
import fs from 'fs';
import path from 'path';
import { generateService } from '@umijs/openapi';

function loadEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const splitIndex = trimmed.indexOf('=');
    if (splitIndex <= 0) continue;

    const key = trimmed.slice(0, splitIndex).trim();
    let value = trimmed.slice(splitIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

const root = __dirname;
loadEnvFile(path.join(root, '.env'));
loadEnvFile(path.join(root, '.env.local'));
loadEnvFile(path.join(root, '.env.openapi.local'));

const openapiUser = process.env.OPENAPI_BASIC_USER;
const openapiPass = process.env.OPENAPI_BASIC_PASS;
const authorization =
  openapiUser && openapiPass
    ? `Basic ${Buffer.from(`${openapiUser}:${openapiPass}`).toString('base64')}`
    : undefined;

generateService({
  schemaPath: process.env.OPENAPI_SCHEMA_PATH || 'http://127.0.0.1:5000/swagger.json',
  // schemaPath: 'http://111.228.38.111:5000/swagger.json',
  authorization,
  serversPath: './src/servers',
  requestLibPath: "import request from '@/utils/request'",
});
