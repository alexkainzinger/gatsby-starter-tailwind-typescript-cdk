import { App } from "aws-cdk-lib"
import * as Cdk from "../lib/cdk-stack"

test("Empty Stack", () => {
  const app = new App()
  // WHEN
  const stack = new Cdk.CdkStack(app, "MyTestStack")
  // THEN
  const actual = app.synth().getStackArtifact(stack.artifactId).template
  expect(actual.Resources ?? {}).toEqual({})
})
