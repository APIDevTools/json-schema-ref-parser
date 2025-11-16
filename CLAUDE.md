# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Building

```bash
yarn build          # Compile TypeScript to dist/
yarn typecheck      # Run TypeScript type checking without emitting files
```

### Testing

```bash
yarn test           # Run all tests with coverage (Vitest)
yarn test:node      # Run tests in Node.js environment
yarn test:browser   # Run tests in browser environment (jsdom)
yarn test:watch     # Run tests in watch mode
yarn test:update    # Update test snapshots
```

### Code Quality

```bash
yarn lint           # Run ESLint on lib/ directory
yarn prettier       # Format all code files
```

### Running Individual Tests

To run a single test file:

```bash
npx vitest test/specs/circular/circular.spec.ts
```

To run tests matching a pattern:

```bash
npx vitest --grep "circular"
```

## Architecture Overview

### Core Purpose

This library parses, resolves, and dereferences JSON Schema `$ref` pointers. It handles references to:

- External files (local filesystem)
- HTTP/HTTPS URLs
- Internal JSON pointers within schemas
- Mixed JSON and YAML formats
- Circular/recursive references

### Key Architecture Components

#### 1. $RefParser (lib/index.ts)

The main entry point and orchestrator class. Provides four primary operations:

- **parse()**: Reads a single schema file (JSON/YAML) without resolving references
- **resolve()**: Parses and resolves all `$ref` pointers, returns a `$Refs` object mapping references to values
- **bundle()**: Converts external `$ref` pointers to internal ones (single file output)
- **dereference()**: Replaces all `$ref` pointers with their actual values (fully expanded schema)

All methods support both callback and Promise-based APIs, with multiple overload signatures.

#### 2. $Refs (lib/refs.ts)

A map/registry of all resolved JSON references and their values. Tracks:

- All file paths/URLs encountered
- Circular reference detection
- Helper methods to query references by type (file, http, etc.)

#### 3. Pointer (lib/pointer.ts)

Represents a single JSON pointer (`#/definitions/person`) and implements JSON Pointer RFC 6901 spec:

- Parses JSON pointer syntax (`/`, `~0`, `~1` escaping)
- Resolves pointers to actual values within objects
- Handles edge cases (null values, missing properties)

#### 4. $Ref (lib/ref.ts)

Wraps a single reference with metadata:

- The reference path/URL
- The resolved value
- Path type (file, http, etc.)
- Error information (when continueOnError is enabled)

#### 5. Plugin System

Two types of plugins, both configurable via options:

**Parsers** (lib/parsers/):

- JSON parser (json.ts)
- YAML parser (yaml.ts) - uses js-yaml
- Text parser (text.ts)
- Binary parser (binary.ts)
- Execute in order based on `order` property and `canParse()` matching

**Resolvers** (lib/resolvers/):

- File resolver (file.ts) - reads from filesystem (Node.js only)
- HTTP resolver (http.ts) - fetches from URLs using native fetch
- Custom resolvers can be added via options
- Execute in order based on `order` property and `canRead()` matching

#### 6. Core Operations

**lib/parse.ts**: Entry point for parsing a single schema file
**lib/resolve-external.ts**: Crawls schema to find and resolve external `$ref` pointers
**lib/bundle.ts**: Replaces external refs with internal refs
**lib/dereference.ts**: Replaces all `$ref` pointers with actual values, handles circular references

#### 7. Options System (lib/options.ts)

Hierarchical configuration with defaults for:

- Which parsers/resolvers to enable
- Circular reference handling (boolean or "ignore")
- External reference resolution (relative vs root)
- Continue on error mode (collect all errors vs fail fast)
- Bundle/dereference callbacks and matchers
- Input mutation control (mutateInputSchema)

### Key Design Patterns

1. **Flexible Arguments**: normalizeArgs() (lib/normalize-args.ts) unifies various call signatures into consistent internal format

2. **Path Handling**: Automatic conversion between filesystem paths and file:// URLs. Cross-platform support via util/url.ts and util/convert-path-to-posix.ts

3. **Error Handling**:
   - Fail-fast by default
   - Optional continueOnError mode collects errors in JSONParserErrorGroup
   - Specific error types: JSONParserError, InvalidPointerError, MissingPointerError, ResolverError, ParserError

4. **Circular Reference Management**:
   - Detected during dereference
   - Can throw error, ignore, or handle via dereference.circular option
   - Reference equality maintained (same `$ref` → same object instance)

5. **Browser/Node Compatibility**:
   - Uses native fetch (requires Node 18+)
   - File resolver disabled in browser builds (package.json browser field)
   - Tests run in both environments

## Testing Strategy

Tests are organized in test/specs/ by scenario:

- Each scenario has test files (\*.spec.ts) and fixture data
- Tests validate parse, resolve, bundle, and dereference operations
- Extensive coverage of edge cases: circular refs, deep nesting, special characters in paths
- Browser-specific tests use test/fixtures/server.ts for HTTP mocking

Test utilities:

- test/utils/helper.js: Common test patterns
- test/utils/path.js: Path handling for cross-platform tests
- test/utils/serializeJson.ts: Custom snapshot serializer

## Important Constraints

1. **TypeScript Strict Mode**: Project uses strict TypeScript including exactOptionalPropertyTypes
2. **JSON Schema Support**: Compatible with JSON Schema v4, v6, and v7
3. **Minimum Node Version**: Requires Node >= 20 (for native fetch support)
4. **Circular JSON**: Dereferenced schemas may contain circular references (not JSON.stringify safe)
5. **Path Normalization**: Always converts filesystem paths to POSIX format internally
6. **URL Safety**: HTTP resolver has safeUrlResolver option to block internal URLs (default: unsafe allowed)
