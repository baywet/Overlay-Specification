# Overlay Specification

## Abstract

The Overlay Specification defines a document format for information that augments an existing [[OpenAPI]] description yet remains separate from the OpenAPI description's source document(s).

## Version 1.0.0

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in [BCP 14](https://tools.ietf.org/html/bcp14) [RFC2119](https://tools.ietf.org/html/rfc2119) [RFC8174](https://tools.ietf.org/html/rfc8174) when, and only when, they appear in all capitals, as shown here.

This document is licensed under [The Apache License, Version 2.0](https://www.apache.org/licenses/LICENSE-2.0.html).

## Introduction

The Overlay Specification is a companion to the [[OpenAPI]] Specification.
An Overlay describes a set of changes to be applied or "overlaid" onto an existing OpenAPI description.

The main purpose of the Overlay Specification is to provide a way to repeatably apply transformations to one or many OpenAPI descriptions. Use cases include updating descriptions, adding metadata to be consumed by another tool, or removing certain elements from an API description before sharing it with partners. An Overlay may be specific to a single OpenAPI description or be designed to apply the same transform to any OpenAPI description.

## Definitions

### Overlay

An Overlay is a JSON or YAML structure containing an ordered list of [Action Objects](#action-object) that are to be applied to the target document. Each Action Object has a `target` property and a modifier type (`update` or `remove`). The `target` property is a [[RFC9535|JSONPath]] query expression that identifies the elements of the target document to be updated and the modifier determines the change.

## Specification

### Versions

The Overlay Specification is versioned using a `major`.`minor`.`patch` versioning scheme. The `major`.`minor` portion of the version string (for example 1.0) SHALL designate the Overlay feature set. `patch` versions address errors in, or provide clarifications to, this document, not the feature set. The patch version SHOULD NOT be considered by tooling, making no distinction between 1.0.0 and 1.0.1 for example.

**Note:** Version 1.0.0 of the Overlay Specification was released after spending some time in draft and being implemented by a few early-adopting tool providers. Check with your tool provider for the details of what is supported in each tool.

### Format

An Overlay document that conforms to the Overlay Specification is itself a JSON object, which may be represented either in [[RFC7159|JSON]] or [[YAML|YAML]] format.

All field names in the specification are **case sensitive**.
This includes all fields that are used as keys in a map, except where explicitly noted that keys are **case insensitive**.

In order to preserve the ability to round-trip between YAML and JSON formats, [[YAML|YAML version 1.2]] is RECOMMENDED along with some additional constraints:

- Tags MUST be limited to those allowed by the [JSON Schema ruleset](https://yaml.org/spec/1.2/spec.html#id2803231).
- Keys used in YAML maps MUST be limited to a scalar string, as defined by the [YAML Failsafe schema ruleset](https://yaml.org/spec/1.2/spec.html#id2802346).

### Relative References in URIs

Unless specified otherwise, all fields that are URI references MAY be relative references as defined by [RFC3986](https://tools.ietf.org/html/rfc3986#section-4.2).

### Schema

In the following description, if a field is not explicitly **REQUIRED** or described with a MUST or SHALL, it can be considered OPTIONAL.

#### Overlay Object

This is the root object of the [Overlay](#overlay).

##### Fixed Fields

| Field Name | Type | Description |
| ---- | :----: | ---- |
| <a name="overlay-version"></a>overlay | `string` | **REQUIRED**. This string MUST be the [version number](#versions) of the Overlay Specification that the Overlay document uses. The `overlay` field SHOULD be used by tooling to interpret the Overlay document. |
| <a name="overlay-info"></a>info | [Info Object](#info-object) | **REQUIRED**. Provides metadata about the Overlay. The metadata MAY be used by tooling as required. |
| <a name="overlay-extends"></a>extends | `string` | URI reference that identifies the target document (such as an [[OpenAPI]] document) this overlay applies to. |
| <a name="overlay-actions"></a>actions | [[Action Object](#action-object)] | **REQUIRED** An ordered list of actions to be applied to the target document. The array MUST contain at least one value. |

This object MAY be extended with [Specification Extensions](#specification-extensions).

The list of actions MUST be applied in sequential order to ensure a consistent outcome. Actions are applied to the result of the previous action. This enables objects to be deleted in one action and then re-created in a subsequent action, for example.

The `extends` property can be used to indicate that the Overlay was designed to update a specific [[OpenAPI]] document. Where no `extends` is provided it is the responsibility of tooling to apply the Overlay document to the appropriate OpenAPI document(s).

In the following example the `extends` property specifies that the overlay is designed to update the OpenAPI Tic Tac Toe example document, identified by an absolute URI.

```yaml
overlay: 1.0.0
info:
  title: Overlay for the Tic Tac Toe API document
  version: 1.0.0
extends: 'https://raw.githubusercontent.com/OAI/learn.openapis.org/refs/heads/main/examples/v3.1/tictactoe.yaml'
...
```

The `extends` property can also specify a relative URI reference.

```yaml
overlay: 1.0.0
info:
  title: Overlay for the Tic Tac Toe API document
  version: 1.0.0
extends: './tictactoe.yaml'
```

#### Info Object

The object provides metadata about the Overlay.
The metadata MAY be used by the clients if needed.

##### Fixed Fields

| Field Name | Type | Description |
| ---- | :----: | ---- |
| <a name="info-title"></a>title | `string` | **REQUIRED**. A human readable description of the purpose of the overlay. |
| <a name="info-version"></a>version | `string` | **REQUIRED**. A version identifer for indicating changes to the Overlay document. |

This object MAY be extended with [Specification Extensions](#specification-extensions).

<a name="action-object"></a>
#### Action Object

This object represents one or more changes to be applied to the target document at the location defined by the target JSONPath expression.

##### Fixed Fields

| Field Name | Type | Description |
| ---- | :----: | ---- |
| <a name="action-target"></a>target | `string` | **REQUIRED** A JSONPath expression selecting nodes in the target document. |
| <a name="action-description"></a>description | `string` | A description of the action. [[CommonMark]] syntax MAY be used for rich text representation. |
| <a name="action-update"></a>update | Any | If the `target` selects an object node, the value of this field MUST be an object with the properties and values to merge with the selected node. If the `target` selects an array, the value of this field MUST be an entry to append to the array. This field has no impact if the `remove` field of this action object is `true` or if the `copy` field contains a value. |
| <a name="action-copy"></a>copy | `string` | A JSONPath expression selecting locations to copy target nodes to in the target document. If the `target` selects an object node, the value of this field MUST be an object with the properties and values to merge with the selected node. If the `target` selects an array, the value of this field MUST be an entry to append to the array. This field has no impact if the `remove` field of this action object is `true` or if the `update` field contains a value. When both the target and copy expressions match multiple nodes, the cardinality of the matches MUST be equal. Each copy node is applied to the corresponding target node in positional order: the first copy node to the first target node, the second to the second, and so forth. |
| <a name="action-remove"></a>remove | `boolean` | A boolean value that indicates that the target object or array MUST be removed from the the map or array it is contained in. The default value is `false`. |

The result of the `target` JSONPath expression MUST be zero or more objects or arrays (not primitive types or `null` values).

To update a primitive property value such as a string, the `target` expression should select the _containing_ object in the target document and `update` should contain an object with the property and its new primitive value.

Primitive-valued items of an array cannot be replaced or removed individually, only the complete array can be replaced.

The properties of the `update` object MUST be compatible with the target object referenced by the JSONPath key. When the Overlay document is applied, the properties in the `update` object are recursively merged with the properties in the target object with the same names; new properties are added to the target object.

The properties of the resolved `copy` object MUST be compatible with the target object referenced by the JSONPath key. When the Overlay document is applied, the properties in the resolved `copy` object are recursively merged with the properties in the target object with the same names; new properties are added to the target object.

This object MAY be extended with [Specification Extensions](#specification-extensions).

### Specification Extensions

While the Overlay Specification tries to accommodate most use cases, additional data can be added to extend the specification at certain points.

The extension properties are implemented as patterned fields that are always prefixed by `"x-"`.

| Field Pattern | Type | Description |
| ---- | :--: | ---- |
| <a name="overlay-extensions"></a>^x- | Any | Allows extensions to the Overlay Specification. The field name MUST begin with `x-`, for example, `x-internal-id`. Field names beginning `x-oai-` and `x-oas-` are reserved for uses defined by the [OpenAPI Initiative](https://www.openapis.org/). The value MAY be `null`, a primitive, an array or an object. |

The extensions may or may not be supported by the available tooling, but those may be extended as well to add requested support (if tools are internal or open-sourced).

## Examples

| Use Case                                                                      | Description                                                                     |
|-------------------------------------------------------------------------------|---------------------------------------------------------------------------------|
| <a href="#example-update">Update</a> objects                                  | Section for how to **update** objects.                                          |
| * <a href="#example-structured-update">Structured</a> update                   | Example of how to update an object by **mirroring** target document **structure**. |
| * <a href="#example-targeted-updates">Targeted</a> updates                     | Example of how to perform a **targeted update**.                                |
| * <a href="#example-multiple-updates">Multiple target</a> updates              | Example of how to **update multiple** target objects.                           |
| * Update objects given a <a href="#example-labeled-updates">label</a>          | Example of how to apply **updates** to **labeled** targets using `x-oai-traits`. |
| <a href="#example-copy">Copy</a> objects                                      | Section for how to **copy** objects.                                            |
| * <a href="#example-simple-copy">Simple copy</a> of an object                 | Example of how to do a **simple copy** of an object.                            |
| * <a href="#example-verified-target-copy">Verified target copy</a> of an object | Example of how to **copy** an object to a **verified target**.                  |
| <a href="#example-move">Move</a> objects                                      | Section for how to **move** objects.                                            |
| * <a href="#example-move-simple">Simple move</a> of an object                 | Example of how to **move** an object.                                           |
| Modify <a href="#example-array">array</a> objects                        | Section for how to **modify array** objects.                                    |
| * <a href="#example-array-add-element">Add</a> an array element               | Example of how to **add** an **array element**.                                 |
| * <a href="#example-array-remove-element">Remove</a> an array element         | Example of how to **remove** an **array element**.                              |
| * <a href="#example-array-move-element">Move</a> an array element             | Example of how to **move** an **array element**.                                |
| * <a href="#example-array-replace-element">Replace</a> an array element       | Example of how to **replace** an **array element**.                             |

**Note:** All examples in this section are non-normative and are provided solely to illustrate the behavior defined in the preceding normative sections.


<a name="example-update"></a>
### Update Examples
The following examples show different ways to apply `update` actions to modify target documents.

<a name="example-structured-update"></a>
#### Structured Update 

When updating properties throughout the target document it may be more efficient to create a single `Action Object` that mirrors the structure of the target document. e.g.

```yaml
overlay: 1.0.0
info:
  title: Structured Overlay
  version: 1.0.0
actions:
  - target: '$' # Root of document
    update:
      info:
        x-overlay-applied: structured-overlay
      paths:
        '/':
          summary: 'The root resource'
          get:
            summary: 'Retrieve the root resource'
            x-rate-limit: 100
        '/pets':
          get:
            summary: 'Retrieve a list of pets'
            x-rate-limit: 100
      components:
      tags:
```

<a name="example-targeted-updates"></a>
#### Targeted Updates 

Alternatively, where only a small number of updates need to be applied to a large document, each [Action Object](#action-object) MAY be more targeted.

```yaml
overlay: 1.0.0
info:
  title: Targeted Overlay
  version: 1.0.0
actions:
  - target: '$.paths["/foo"].get'
    update:
      description: This is the new description
  - target: '$.paths["/bar"].get'
    update:
      description: This is the updated description
  - target: '$.paths["/bar"]'
    update:
      post:
        description: This is an updated description of a child object
        x-safe: false
```

<a name="example-multiple-updates"></a>
#### Multiple Target Updates

One significant advantage of using the JSONPath syntax is that it allows referencing multiple nodes in the target document. This would allow a single update object to be applied to multiple target objects using **wildcards** ( `*`) and other multi-value selectors.

```yaml
overlay: 1.0.0
info:
  title: Update many objects at once
  version: 1.0.0
actions:
  - target: '$.paths.*.get'
    update:
      x-safe: true
  - target: '$.paths.*.get.parameters[?@.name=="filter" && @.in=="query"]'
    update:
      schema:
        $ref: '#/components/schemas/filterSchema'
```

<a name="example-labeled-updates"></a>
#### Labeled *(Trait)* Updates

This example shows how to apply overlay updates to **labeled** targets using `x-oai-traits`. This technique allows authors to define **named update points** within a target document so overlays can apply reusable updates declaratively, rather than hard-coding document paths.

By annotating a target document (such as an [[OpenAPI]] document) using [Specification Extensions](#specification-extensions) such as `x-oai-traits`, the author of the target document can identify where overlay updates SHOULD be applied.

```yaml
openapi: 3.1.0
info:
  title: API with a paged collection
  version: 1.0.0
paths:
  /items:
    get:
      x-oai-traits: ['paged']
      responses:
        200:
          description: OK
```

In this example, the `x-oai-traits` extension labels the `GET /items` operation as **paged**.
Using this approach, authors MAY apply shared pagination updates to every operation in the target document that defines the label.

```yaml
overlay: 1.0.0
info:
  title: Apply labeled updates using traits
  version: 1.0.0
actions:
  - target: '$.paths.*.get[?(@.x-oai-traits && @.x-oai-traits[?(@ == "paged")])]'
    update:
      parameters:
        - name: top
          in: query
          # ...
        - name: skip
          in: query
          # ...
```

This approach inverts control: the **target document** declares where updates SHOULD apply, while the **overlay** defines reusable logic that can be shared across multiple API specifications.

<a name="example-copy"></a>
### Copy Examples

Copy actions behave similarly to `update` actions but source the node from the document being transformed. Copy `actions` MAY be used in sequence with `update` or `remove` actions to perform more advanced transformations like moving or renaming nodes.

<a name="example-simple-copy"></a>
#### Simple Copy

This example shows how to copy all operations from the `items` path item to the "some-items" path item.

#### Source description

```yaml
openapi: 3.1.0
info:
  title: API with a paged collection
  version: 1.0.0
paths:
  /items:
    get:
      responses:
        200:
          description: OK
  /some-items:
    delete:
      responses:
        200:
          description: OK
```

#### Overlay

```yaml
overlay: 1.1.0
info:
  title: Demonstrates variations of "copy" uses
  version: 1.0.0
actions:
  - target: '$.paths["/some-items"]'
    copy: '$.paths["/items"]'
    description: 'copies recursively all elements from the "items" path item to the new "some-items" path item without ensuring the node exists before the copy'
```

#### Result description

```yaml
openapi: 3.1.0
info:
  title: API with a paged collection
  version: 1.0.0
paths:
  /items:
    get:
      responses:
        200:
          description: OK
  /some-items:
    get:
      responses:
        200:
          description: OK
    delete:
      responses:
        200:
          description: OK
```

<a name="example-verified-target-copy"></a>
#### Verified Target Copy

This example shows how to copy all operations from the `items` path item to the `other-items` path item after first ensuring the target exists with an update action.

#### Source description

```yaml
openapi: 3.1.0
info:
  title: API with a paged collection
  version: 1.0.0
paths:
  /items:
    get:
      responses:
        200:
          description: OK
  /some-items:
    delete:
      responses:
        200:
          description: OK
```

#### Overlay

```yaml
overlay: 1.1.0
info:
  title: Demonstrates variations of "copy" uses
  version: 1.0.0
actions:
  - target: '$.paths'
    update: { "/other-items": {} }
  - target: '$.paths["/other-items"]'
    copy: '$.paths["/items"]'
    description: 'copies recursively all elements from the "items" path item to the new "other-items" path item while ensuring the node exists before the copy'
```

#### Result description

```yaml
openapi: 3.1.0
info:
  title: API with a paged collection
  version: 1.0.0
paths:
  /items:
    get:
      responses:
        200:
          description: OK
  /other-items:
    get:
      responses:
        200:
          description: OK
  /some-items:
    delete:
      responses:
        200:
          description: OK
```

<a name="example-move"></a>
### Move Examples

A **move** operation works like a _rename_, using a sequence of actions — `update`, `copy`, then `remove` — to shift a value to a new location in the target document.

<a name="example-move-simple"></a>
#### Simple Move

This example shows how to rename the `items` path item to `new-items` using a sequence of overlay actions:

1. Use an `update` action to ensure the target path item exists.
2. Use a `copy` action to copy the source path item to the target.
3. Use a `remove` action to delete the original source path item.

#### Source description

```yaml
openapi: 3.1.0
info:
  title: API with a paged collection
  version: 1.0.0
paths:
  /items:
    get:
      responses:
        200:
          description: OK
  /some-items:
    delete:
      responses:
        200:
          description: OK
```

#### Overlay

```yaml
overlay: 1.1.0
info:
  title: Demonstrates variations of "copy" uses
  version: 1.0.0
actions:
  - target: '$.paths'
    update: { "/new-items": {} }
  - target: '$.paths["/new-items"]'
    copy: '$.paths["/items"]'
  - target: '$.paths["/items"]'
    remove: true
    description: 'moves (renames) the "items" path item to "new-items"'
```

#### Result description

```yaml
openapi: 3.1.0
info:
  title: API with a paged collection
  version: 1.0.0
paths:
  /new-items:
    get:
      responses:
        200:
          description: OK
  /some-items:
    delete:
      responses:
        200:
          description: OK
```

<a name="example-array"></a>
### Array Examples

These examples demonstrate how to modify array-valued fields using Overlay actions — specifically how to **add**, **remove**, **move**, and **replace** elements within arrays in the target document.

<a name="example-array-add-element"></a>
#### Add Array Element

Array elements MAY be added using the `update` property.

```yaml
overlay: 1.0.0
info:
  title: Add an array element
  version: 1.0.0
actions:
  - target: '$.paths.*.get.parameters'
    update:
      name: newParam
      in: query
```

<a name="example-array-remove-element"></a>
#### Remove Array Element

Array elements MAY be deleted using the `remove` property. Use of array indexes to remove array items SHOULD be avoided where possible, as indexes will change when items are removed.

```yaml
overlay: 1.0.0
info:
  title: Remove an array element
  version: 1.0.0
actions:
  - target: '$.paths.*.get.parameters[?@.name == "dummy"]'
    remove:
```

<a name="example-array-move-element"></a>
#### Move Array Element

Array elements MAY be moved by combining `update`, `copy`, and `remove` actions.

A **move** operation works like a _rename_, using these actions in sequence — `update`, `copy`, then `remove` — to shift a value to a new location in the target document.

1. Use an `update` action to ensure the target array exists.
2. Use a `copy` action to copy the selected array element to the new target array.
3. Use a `remove` action to delete the original array element.

```yaml
overlay: 1.0.0
info:
  title: Move an array element
  version: 1.0.0
actions:
  # Ensure the target array exists
  - target: '$.paths["/new-items"].get.parameters'
    update: []

  # Copy matching parameter objects from one path item to another
  - target: '$.paths["/new-items"].get.parameters'
    copy: '$.paths["/items"].get.parameters[?@.name == "oldParam"]'

  # Remove the parameter object from the original array
  - target: '$.paths["/items"].get.parameters[?@.name == "oldParam"]'
    remove: true
```

<a name="example-array-replace-element"></a>
#### Replace Array Element

Array elements MAY be replaced by selecting one or more matching elements and applying an `update` action to modify their properties. This is only applicable to arrays of objects—primitive-valued arrays can only be replaced in their entirety.

```yaml
overlay: 1.0.0
info:
  title: Replace an array element
  version: 1.0.0
actions:
  - target: '$.paths.*.get.parameters[?@.name == "limit"]'
    update:
      description: The maximum number of items to return per page.
      schema:
        type: integer
        minimum: 1
        maximum: 100
```

#### Source description

```yaml
openapi: 3.1.0
info:
  title: API with a paged collection
  version: 1.0.0
paths:
  /items:
    get:
      responses:
        200:
          description: OK
  /some-items:
    delete:
      responses:
        200:
          description: OK
```

#### Overlay

```yaml
overlay: 1.1.0
info:
  title: Demonstrates variations of "copy" uses
  version: 1.0.0
actions:
  - target: '$.paths'
    update: { "/new-items": {} }
  - target: '$.paths["/new-items"]'
    copy: '$.paths["/items"]'
  - target: '$.paths["/items"]'
    remove: true
    description: 'moves (renames) the "items" path item to "new-items"'
```

#### Result description

```yaml
openapi: 3.1.0
info:
  title: API with a paged collection
  version: 1.0.0
paths:
  /new-items:
    get:
      responses:
        200:
          description: OK
  /some-items:
    delete:
      responses:
        200:
          description: OK
```


## Appendix A: File Naming Convention

Overlay files MAY choose to follow the convention of a `purpose.overlay.yaml` file naming pattern. Other file naming conventions are also supported.

**Note:** This section is informative. The use of the purpose.overlay.yaml pattern is optional and does not affect conformance.

## Appendix B: Revision History

| Version | Date | Notes |
| ---- | ---- | ---- |
| 1.0.0 | 2024-10-17 | First release of the Overlay Specification |
