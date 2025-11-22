# Smart Contracts

## Overview

This directory contains blockchain smart contracts for dataset licensing.

## Structure

```
contracts/
└── move/           # Sui Move contracts for licensing
```

## Deployment

The Sui Move contract is deployed on testnet:
- Package: `0x7b79e60b89146533b040ee32ac8e6f6bbcda92169ce1bb70882e59de0062f0cb`
- Explorer: https://suiscan.xyz/testnet/object/0x7b79e60b89146533b040ee32ac8e6f6bbcda92169ce1bb70882e59de0062f0cb

## Important Notes

### Hackathon Structure

This is a prototype structure for the hackathon. In production, smart contracts should live in their own repository with:
- Independent versioning
- Separate CI/CD pipelines
- Security audit trails
- Minimal dependencies

### Post-Hackathon TODO

1. Move Sui contracts to separate repository
2. Set up independent deployment workflows
3. Add formal security audits
4. Reference contract addresses via environment variables only
