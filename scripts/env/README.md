# Environment Variables

The environment variables used in this repository are used to provide various build-time configuration options. While `.env` files are a common standard for environment variables, they have limited flexibility as they are only able to provide options as strings. For this reason, and because it is common to the JavaScript world, we have opted to provided environment configuration in JSON format.

## Contents of this folder

This folder contains the source code for the `env.js` script which is used to parse and validate input environment variables, and generate output in a way that is appropriate for usage in an application build.

The `env.js` script must be built before being used in a development or production build. The script when built is located at `.artifacts/env.js`. For more information about building this and other prerequisite scripts, see the [build documentation](/scripts/README.md).

## Script Process

### Reading command line flags

When this script is run it can be given one of two flags: `--dev` or `--env`. These flags are used to determine which set of environment variables should be run through the rest of the script.

- If `--dev` is provided, the variables inside the `/build-params.dev.json` will be used. Note that this flag always takes precedence. If an `--env` flag is provided additionally, it will be ignored in favour of `--dev`.

- If `--env` is provided without any environment parameter, or no `--env` flag is provided, then the default set of parameters will be used without any change (See [default parameters](#default-parameters)).

In all other cases, the `--env` flag is set as `--env=${ENVIRONMENT_NAME}`. The variables will be extracted from the `/build-params.json` file, by the key that matches the `ENVIRONMENT_NAME` value. For example, if the `build-params.json` file looks like:

```json
{
  "public": {},
  "custom_example": {
    "prevent_navigation": false
  }
}
```

Then the flag `--env=custom_example` will extract the parameters:

```json
{
  "prevent_navigation": false
}
```

Likewise, the flag `--env=public` will extract the parameters:

```json
{}
```

### Input Validation

Once the correct set of environment variables are loaded, they are validated against against the `BuildEnvironmentInput` type (see [definition file](#definition-file)).

The validator function can be found in the `/scripts/env/validation.ts` file. As well as validating that the parameters are correct, they are also automatically converted to the correct typescript type. The [`dealwith`](https://www.npmjs.com/package/dealwith/v/1.0.0) library is used to provide this validation.

If the validation is successful, then the data is available to the next step as an object of type `BuildEnvironmentInput`.

### Merge with default environment variables.

The default variables (see [default variables](#default-variables)), are then deeply merged with the variables provided from the earlier parameter source (see [reading command line flags](#reading-command-line-flags)).

This is a deep merge with the values from the input variables taking precedence over those from the default variables. The rules of this merge are as follows

- Any undefined value from the input variables is disregarded in favour of the default variable. As all fields are required in the `BuildEnvironment` type, there should be no undefined variables.
- If the variable type is an object, then each key of the object in the input variables is checked against each key of the object in the default variables, following these same rules. This ensures that empty objects do not overwrite all default parameters.
- If the variable type is an array, the input variable is used in favour of the default variable. (_possible improvement here could be to allow array merging, or allow specifying rules for arrays_)
- If the variable type is anything else, the input vairable is used in favour of the default variable.

An example of a deep merge

Default variables

```json
{
  "a": "default",
  "b": 2,
  "c": true,
  "d": "default",
  "e": {
    "a": "default",
    "b": "default",
    "c": {
      "x": "default",
      "y": "default"
    }
  },
  "f": {
    "x": "default",
    "y": "default"
  },
  "g": ["default", "default"],
  "h": ["default", "default"]
}
```

Input Variables

```json
{
  "a": "input",
  "c": false,
  "e": {
    "b": "input",
    "c": {
      "y": "input"
    }
  },
  "g": ["input"]
}
```

Result

```json
{
  "a": "input",
  "b": 2,
  "c": false,
  "d": "default",
  "e": {
    "a": "default",
    "b": "input",
    "c": {
      "x": "default",
      "y": "input"
    }
  },
  "f": {
    "x": "default",
    "y": "default"
  },
  "g": ["input"],
  "h": ["default", "default"]
}
```

### Flattening to a definition file

With a complete set of environment variables, the data is then written into a format which is useable from within our application build (see [application build documentation](/scripts/README.md) for information about the injection of these variables into the application build).

The output format is a flat JSON object with with each key and nested key containing a "dotified" version of itself. All keys are prepended with the `BUILD_ENV` key, which is used as an ambient declaration for TypeScript in the main source of the application (see the file [`/sqrx-app/ambient.d.ts`](/sqrx-app/ambient.d.ts)).

Taking the example result from the previous section:

```json
{
  "a": "input",
  "b": 2,
  "c": false,
  "d": "default",
  "e": {
    "a": "default",
    "b": "input",
    "c": {
      "x": "default",
      "y": "input"
    }
  },
  "f": {
    "x": "default",
    "y": "default"
  },
  "g": ["input"],
  "h": ["default", "default"]
}
```

We would end up with the following keys

```
BUILD_ENV.a,
BUILD_ENV.b,
BUILD_ENV.c,
BUILD_ENV.d,
BUILD_ENV.e.a,
BUILD_ENV.e.b,
BUILD_ENV.e.c.x,
BUILD_ENV.e.c.y,
BUILD_ENV.f.x,
BUILD_ENV.f.y,
BUILD_ENV.g,
BUILD_ENV.h
```

The value of each of these keys will be injected directly into the JavaScript as the application build is happening (see [application build documentation](/scripts/extension-build/README.md)). For this reason, the values must appear exactly as they should in the script. This means that all strings should be double quoted, and all other values should be quoted.

Our output from above should be as follows:

```json
{
  "BUILD_ENV.a": "\"input\"",
  "BUILD_ENV.b": "2",
  "BUILD_ENV.c": "false",
  "BUILD_ENV.d": "\"default\"",
  "BUILD_ENV.e.a": "\"default\"",
  "BUILD_ENV.e.b": "\"input\"",
  "BUILD_ENV.e.c.x": "\"default\"",
  "BUILD_ENV.e.c.y": "\"input\"",
  "BUILD_ENV.f.x": "\"default\"",
  "BUILD_ENV.f.y": "\"default\"",
  "BUILD_ENV.g": "[\"input\"]",
  "BUILD_ENV.h": "[\"default\", \"default\"]"
}
```

_You can skip the reaminder of this section if you don't care why we have the extra quoting, but it seems to be useful information as it's generally not explained and assumed that you know why it's done in bundler documentation_

Here's an example of why this is needed. Imagine that we instead had an environment definition file like this:

```json
{
  "BUILD_ENV.a": "unquoted"
}
```

And we had some script that uses this variable

```typescript
function checkBAgainstA(b: string) {
  return b === BUILD_ENV.a;
}
```

When the bundler applies this injection literally, the output of the code will be

```javascript
function checkBAgainstA(b) {
  return b === unqouted;
}
```

As unquoted is possibly undefined, or defined as something we're not expecting this would be a bug waiting to happen. You could argue that the quoting should be done automatically by the bundler, but this leads to another problem which is injecting identifiers.

```json
{
  "BUILD_ENV.hostname": "window._someglobalvariable._somehostname"
}
```

Using this variable:

```typescript
function getHostname() {
  return BUILD_ENV.hostname;
}
```

You can see that automatic quoting of the string rather than literal injection would now lead to:

```javascript
function getHostname() {
  return 'window._someglobalvariable._somehostname';
}
```

So in order to support full identifier injection, we have to quote everything that isn't an identifier.

## Definition File

For this all to work seamlessly in both the source code and validation stages, the environment variable format has to be defined beforehand. The definition for the environment variables is available at [`/scripts/env/definition.ts`](/scripts/env/definition.ts).

To avoid having to import this file throughout the codebase when we want to use a build parameter, it is instead defined as an ambient global variable named `BUILD_ENV`. The declaration of this variable can be found in [`/sqrx-app/ambient.d.ts`](/sqrx-app/ambient.d.ts). Keep in mind that at runtime, there is no variable named `BUILD_ENV` which is why it's declared in the ambient context. All references to this variable will be replaced inline with the respective environment variable values, as explained in [flattening to a definition file](#flattening-to-a-definition-file) and the [build documentation](/scripts/README.md).

The definition file provides two types:

- `BuildEnvironment`: The full build environment configuration, all fields are required. This is always the type that the source of the extension accesses, and it should always be the type that is returned after [merging environment variables](#merge-with-default-environment-variables). It is also the type that must be used for the [default enviroment variables](#default-variables).

- `BuildEnvironmentInput`: A deeply partial type of `BuildEnvironment`, meaning that all fields and all subfields recursively, are optional. This type applies explicitly to the environment variables defined as inputs to this script (see [reading command line flags](#reading-command-line-flags)).

**Although it will be allowed by TypeScript, you should not add to this file any variables of a type that is not supported in a standard JSON file**

## Default Variables

To ensure that we always have a full set of variables during compilation, a default configuration is specified in the [`/scripts/env/default.ts`](/scripts/env/default.ts) file. This file should always contain a full set of default environment variables and match the `BuildEnvironment` type.

## Adding, Removing and Updating Variables Checklist

- Update the [definition file](#definition-file) first.
- Update the [validation file](#input-validation) to match the `BuildEnvironmentInput` type.
- Update the [default variables](#default-variables) to provide a default for the variable being changed
- Running the typechecker with `npm run typecheck` should now reveal all errors for the old remove/updated variable. If you added a new variable, this should now be available automatically from the `BUILD_ENV` ambient variable.
