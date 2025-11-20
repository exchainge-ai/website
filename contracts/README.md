# Smart Contracts

## Overview

This directory contains blockchain smart contracts for dataset licensing.

## Structure

```
contracts/
└── move/           # Sui Move contracts for licensing
```

## Important Notes

### Hackathon Structure

This is a prototype structure for the Hackathon. In production, smart contracts should live in their own repository with:
- Independent versioning
- Separate CI/CD pipelines
- Security audit trails
- Minimal dependencies

### Existing Solana Contract

The Solana program is already deployed:
- Repository: https://github.com/exchainge-ai/exchainge-program
- Mainnet: 3tK3ejf1JWJPei5Nh19Wj3GZtvZ6KoCBfYTnPbhVAHk1

### Post-Hackathon TODO

1. Move Sui contracts to separate repository: exchainge-ai/exchainge-move
2. Set up independent deployment workflows
3. Add formal security audits
4. Reference contract addresses via environment variables only
