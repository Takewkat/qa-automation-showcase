import { join } from "node:path";

import SwaggerParser from "@apidevtools/swagger-parser";
import Ajv2020, { type ValidateFunction } from "ajv/dist/2020";
import addFormats from "ajv-formats";

type Header = { schema: object };
type Response = {
  headers?: Record<string, Header>;
  content?: { "application/json": { schema: object } };
};
type Spec = { paths: Record<string, Record<string, { responses: Record<string, Response> }>> };
type Documented = { body: ValidateFunction | null; headers: Record<string, ValidateFunction> };

const SPEC_FILE = join(__dirname, "..", "..", "spec", "job-offer-swagger.yml");
const ajv = addFormats(new Ajv2020({ strict: false, allErrors: true })).addFormat("decimal", true);
const compiled = new Map<string, Documented>();
let document: Promise<Spec> | undefined;

/** The dereferenced spec, loaded once per worker. */
const spec = () => (document ??= SwaggerParser.dereference(SPEC_FILE) as unknown as Promise<Spec>);

/** OpenAPI `nullable: true` becomes the JSON Schema null type ajv understands. */
const nullable = (schema: object): object =>
  JSON.parse(JSON.stringify(schema), (_, value) =>
    value?.nullable && typeof value.type === "string"
      ? { ...value, type: [value.type, "null"] }
      : value,
  );

const compile = (schema: object) => ajv.compile(nullable(schema));

/** What the spec documents at (method, path, status): the body validator and one per header. */
async function documented(method: string, path: string, status: number): Promise<Documented> {
  const key = `${method} ${path} ${status}`;
  if (!compiled.has(key)) {
    const response = (await spec()).paths[path]?.[method.toLowerCase()]?.responses[status];
    if (!response) throw new Error(`no schema for ${status} on ${method} ${path}`);
    const schema = response.content?.["application/json"].schema;
    const headers = Object.entries(response.headers ?? {}).map(([name, header]) => [
      name.toLowerCase(),
      compile(header.schema),
    ]);
    compiled.set(key, {
      body: schema ? compile(schema) : null,
      headers: Object.fromEntries(headers),
    });
  }
  return compiled.get(key) as Documented;
}

/** The ajv errors of one documented header, or its absence. */
const headerFault = ([name, check]: [string, ValidateFunction], headers: Record<string, string>) =>
  name in headers
    ? check(headers[name])
      ? ""
      : `header ${name}: ${ajv.errorsText(check.errors)}`
    : `missing header ${name}`;

/** Validates a response against the spec: body schema and documented headers; throws naming the gap. */
export async function validate(
  method: string,
  path: string,
  status: number,
  body: unknown,
  headers: Record<string, string>,
) {
  const { body: check, headers: expected } = await documented(method, path, status);
  const faults = Object.entries(expected).map((header) => headerFault(header, headers));
  if (check && !check(body)) faults.push(ajv.errorsText(check.errors));
  if (!check && body !== undefined) faults.push("no body documented");
  const gaps = faults.filter(Boolean);
  if (gaps.length)
    throw new Error(`${method} ${path} ${status}: ${gaps.join("; ")}\n${JSON.stringify(body)}`);
}
