# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Cloudflare Worker project for a push notification system using the Bark API. The project appears to be in early development with only documentation currently present.

## Core Functionality

Based on the readme.md, this system is designed to:

1. Manage push notification tasks (CRUD operations)
2. Schedule push notifications with timing
3. Trigger push notifications when scheduled time arrives

## Push API Integration

The project integrates with the Bark push notification service (api.day.app):

- **Single user push**: POST to `/push` with `device_key`
- **Multi-user push**: POST to `/push` with `device_keys` array

## Current State

The repository currently contains only documentation. No source code, configuration files, or build scripts are present yet. Future development will likely include:

- Cloudflare Worker implementation
- Task management system
- Scheduling mechanism
- Bark API integration logic

## Development Notes

- This appears to be a Chinese language project based on the readme content
- The project is designed to run as a Cloudflare Worker
- No package.json or other configuration files exist yet

## bark Push url and key

- url: https://bark.860724.xyz
- key: [Set via environment variable BARK_KEY]