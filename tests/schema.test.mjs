import { readdirSync, readFileSync } from "node:fs";
import YAML from "yaml";
import {
  validate,
  setMetaSchemaOutputFormat,
} from "@hyperjump/json-schema/draft-2020-12";
import { BASIC } from "@hyperjump/json-schema/experimental";
import { describe, test, expect } from "vitest";

import contentTypeParser from "content-type";
import { addMediaTypePlugin } from "@hyperjump/browser";
import { buildSchemaDocument } from "@hyperjump/json-schema/experimental";

addMediaTypePlugin("application/schema+yaml", {
  parse: async (response) => {
    const contentType = contentTypeParser.parse(
      response.headers.get("content-type") ?? "",
    );
    const contextDialectId =
      contentType.parameters.schema ?? contentType.parameters.profile;

    const foo = YAML.parse(await response.text());
    return buildSchemaDocument(foo, response.url, contextDialectId);
  },
  fileMatcher: (path) => path.endsWith(".yaml"),
});

const parseYamlFromFile = (filePath, sourceVersion = "", targetVersion = "") => {
  const schemaYaml = readFileSync(filePath, "utf8");
  const result = YAML.parse(schemaYaml, { prettyErrors: true });
  if (sourceVersion && targetVersion && result.overlay === `${sourceVersion}.0`) {
    result.overlay = `${targetVersion}.0`;
  }
  return result;
};

const runTestSuite = (version, validateOverlay, suite = "pass", targetVersion = "", testsToIgnore = []) => {
  readdirSync(`./tests/v${version}/${suite}`, { withFileTypes: true })
    .filter((entry) => entry.isFile() && /\.yaml$/.test(entry.name))
    .filter((entry) => !testsToIgnore.includes(entry.name))
    .forEach((entry) => {
      test(entry.name, () => {
        const instance = parseYamlFromFile(`./tests/v${version}/${suite}/${entry.name}`, targetVersion === "" ? "" : version, targetVersion);
        const output = validateOverlay(instance, BASIC);
        expect(output.valid).to.equal(suite === "pass");
      });
    });
}

setMetaSchemaOutputFormat(BASIC);

const versions = ["1.0", "1.1"];
const compatibilityTestsToIgnore = {
  "1.1": [
    // the schema has been improved to disallow theses cases
    "actions-update-with-remove.yaml",
  ]
};

describe.each(versions)("v%s", async (version) => {
  let validateOverlay;
  try {
    validateOverlay = await validate(`./schemas/v${version}/schema.yaml`);
  } catch (error) {
    console.error(error.output);
    process.exit(1);
  }
  describe("Pass", () => {
    runTestSuite(version, validateOverlay);
  });

  describe("Fail", () => {
    runTestSuite(version, validateOverlay, "fail");
  });

  if (version !== "1.0") {
    const currentVersionIndex = versions.indexOf(version);
    for (let i = currentVersionIndex - 1; i >= 0; i--) {
      const sourceVersion = versions[i];
      describe(`Backward compatibility of v${sourceVersion} with v${version}`, () => {
        describe("Pass", () => {
          runTestSuite(sourceVersion, validateOverlay, "pass", version, compatibilityTestsToIgnore[version] || []);
        });

        describe("Fail", () => {
          runTestSuite(sourceVersion, validateOverlay, "fail", version, compatibilityTestsToIgnore[version] || []);
        });
      });
    }
  }
});
