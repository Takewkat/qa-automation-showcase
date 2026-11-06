import { readFileSync } from "node:fs";

import Ajv2020, { type ValidateFunction } from "ajv/dist/2020";
import addFormats from "ajv-formats";
import { parse } from "yaml";

type Response = {
  $ref?: string;
  headers?: Record<string, { schema: object }>;
  content?: { "application/json": { schema: object } };
};
type Spec = { paths: Record<string, Record<string, { responses: Record<string, Response> }>> };
type Documented = { body: ValidateFunction | null; headers: Record<string, ValidateFunction> };

const SPEC_ID = "spec";

/** A JSON pointer segment, escaped as RFC 6901 says. */
const segment = (key: string): string => key.replace(/~/g, "~0").replace(/\//g, "~1");

/** OpenAPI `nullable: true` becomes the JSON Schema null type ajv understands. */
const nullable = (document: unknown): unknown =>
  JSON.parse(JSON.stringify(document), (_, value) =>
    value?.nullable && typeof value.type === "string"
      ? { ...value, type: [value.type, "null"] }
      : value,
  );

/** One OpenAPI document: validates a response against what it documents at (method, path, status). */
export class Contract {
  private readonly ajv = addFormats(new Ajv2020({ strict: false, allErrors: true }));
  private readonly spec: Spec;
  private readonly compiled = new Map<string, Documented>();

  constructor(specFile: string) {
    this.spec = nullable(parse(readFileSync(specFile, "utf8"))) as Spec;
    this.ajv.addFormat("decimal", true).addSchema(this.spec, SPEC_ID);
  }

  /** Validates body schema and documented headers; throws naming the gap. */
  validate(
    method: string,
    path: string,
    status: number,
    body: unknown,
    headers: Record<string, string>,
  ): void {
    const { body: check, headers: expected } = this.documented(method, path, status);
    const faults = Object.entries(expected).map(([name, of]) =>
      this.headerFault(name, of, headers),
    );
    if (check && !check(body)) faults.push(this.ajv.errorsText(check.errors));
    if (!check && body !== undefined) faults.push("no body documented");
    const gaps = faults.filter(Boolean);
    if (gaps.length)
      throw new Error(`${method} ${path} ${status}: ${gaps.join("; ")}\n${JSON.stringify(body)}`);
  }

  /** What the spec documents at (method, path, status), compiled once. */
  private documented(method: string, path: string, status: number): Documented {
    const key = `${method} ${path} ${status}`;
    if (!this.compiled.has(key))
      this.compiled.set(key, this.compileResponse(method.toLowerCase(), path, status));
    return this.compiled.get(key) as Documented;
  }

  /** The validators of a response: the body's and one per documented header. */
  private compileResponse(verb: string, path: string, status: number): Documented {
    const [pointer, response] = this.responseAt(verb, path, status);
    const headers = Object.keys(response.headers ?? {}).map((name) => [
      name.toLowerCase(),
      this.compile(`${pointer}/headers/${segment(name)}/schema`),
    ]);
    return {
      body: response.content ? this.compile(`${pointer}/content/application~1json/schema`) : null,
      headers: Object.fromEntries(headers),
    };
  }

  /** The response the spec declares at (verb, path, status) and its pointer; a $ref response is followed. */
  private responseAt(verb: string, path: string, status: number): [string, Response] {
    const declared = this.spec.paths[path]?.[verb]?.responses[status];
    if (!declared) throw new Error(`no schema for ${status} on ${verb.toUpperCase()} ${path}`);
    if (declared.$ref) return [declared.$ref.slice(1), this.at(declared.$ref.slice(1)) as Response];
    return [`/paths/${segment(path)}/${verb}/responses/${status}`, declared];
  }

  /** The validator of the schema at a pointer of the spec; its nested $ref resolve against the document. */
  private compile(pointer: string): ValidateFunction {
    return this.ajv.compile({ $ref: `${SPEC_ID}#${pointer}` });
  }

  /** The node of the document a pointer names. */
  private at(pointer: string): unknown {
    return pointer
      .split("/")
      .slice(1)
      .map((part) => part.replace(/~1/g, "/").replace(/~0/g, "~"))
      .reduce<unknown>((node, part) => (node as Record<string, unknown>)?.[part], this.spec);
  }

  /** The ajv errors of one documented header, or its absence. */
  private headerFault(name: string, check: ValidateFunction, headers: Record<string, string>) {
    if (!(name in headers)) return `missing header ${name}`;
    return check(headers[name]) ? "" : `header ${name}: ${this.ajv.errorsText(check.errors)}`;
  }
}
