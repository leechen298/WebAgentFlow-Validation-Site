#!/usr/bin/env node

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const allowedStatuses = new Set([
  'PASS',
  'FAIL',
  'BLOCKED',
  'UNVERIFIED',
  'PASS_WITH_CAVEATS',
]);
const allowedCommandIds = new Set([
  'summary-only',
  'private-black-box-smoke',
  'private-black-box-full',
]);

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');
const outputPath = resolve(here, 'artifacts/latest/provider-summary.redacted.json');
const rawGatePath = resolve(here, 'artifacts/raw/provider-gates.private.json');

function parseArgs(argv) {
  const args = {
    status: 'UNVERIFIED',
    commandId: 'summary-only',
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--') {
      continue;
    }
    if (arg === '--status') {
      args.status = argv[index + 1];
      index += 1;
      continue;
    }
    if (arg === '--command-id') {
      args.commandId = argv[index + 1];
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  if (!allowedStatuses.has(args.status)) {
    throw new Error(`Unsupported status: ${args.status}`);
  }
  if (!allowedCommandIds.has(args.commandId)) {
    throw new Error(`Unsupported command id: ${args.commandId}`);
  }

  return args;
}

function providerVersion() {
  try {
    const packageJson = JSON.parse(readFileSync(resolve(repoRoot, 'package.json'), 'utf8'));
    return String(packageJson.version ?? 'unknown');
  } catch {
    return 'unknown';
  }
}

function readRawGate(args) {
  if (args.status === 'UNVERIFIED') {
    return null;
  }

  let raw;
  try {
    raw = JSON.parse(readFileSync(rawGatePath, 'utf8'));
  } catch (error) {
    throw new Error(
      `Refusing to emit ${args.status} without private gate evidence at ` +
        `${rawGatePath}: ${error.message}`,
    );
  }

  if (raw.status !== args.status) {
    throw new Error(`Raw gate status ${raw.status} does not match requested ${args.status}`);
  }
  if (raw.command_id !== args.commandId) {
    throw new Error(`Raw gate command_id ${raw.command_id} does not match requested ${args.commandId}`);
  }
  if (!Array.isArray(raw.gates) || raw.gates.length === 0) {
    throw new Error('Raw gate evidence must include at least one gate.');
  }

  for (const gate of raw.gates) {
    if (!gate || typeof gate.name !== 'string' || !allowedStatuses.has(gate.status)) {
      throw new Error('Raw gate evidence contains an invalid gate.');
    }
  }

  return raw;
}

function buildSummary(args) {
  const rawGate = readRawGate(args);
  const gates = rawGate?.gates ?? [
    {
      name: 'private-gate-evidence',
      status: 'UNVERIFIED',
    },
  ];

  return {
    schema_version: 'waf.eval.result.v1',
    status: args.status,
    generated_at: new Date().toISOString(),
    provider: {
      kind: 'external_target',
      name: 'WebAgentFlow-Validation-Site',
      version: providerVersion(),
    },
    target: {
      target_ref: 'validation-site-private-target',
      redacted: true,
    },
    operator_actions: [
      {
        surface: 'external_provider',
        action: 'write_redacted_provider_summary',
        command: args.commandId,
        timestamp: new Date().toISOString(),
      },
    ],
    case_results: [
      {
        case_id: 'validation-provider-private-black-box',
        status: args.status,
        summary: 'Private provider-owned black-box validation result.',
        gates: gates.map((gate) => ({
          name: gate.name,
          status: gate.status,
        })),
      },
    ],
    artifacts: [
      {
        path: 'evals/artifacts/latest/provider-summary.redacted.json',
        kind: 'redacted_provider_summary',
        redacted: true,
      },
    ],
  };
}

const args = parseArgs(process.argv.slice(2));
const summary = buildSummary(args);

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
console.log(`Wrote ${outputPath}`);
