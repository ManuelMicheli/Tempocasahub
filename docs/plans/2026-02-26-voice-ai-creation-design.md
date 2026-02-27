# Voice/Text AI Creation — Design

## Overview
Voice input (Web Speech API) + AI extraction (GPT-4o-mini) for creating properties and leads.
Agent speaks or types a description, AI extracts structured data, pre-fills the form.

## Components
- voice-input.tsx: Mic button + textarea + Web Speech API
- /api/ai/extract-property: OpenAI extraction for properties
- /api/ai/extract-lead: OpenAI extraction for leads
- src/lib/ai/extract-property.ts: Prompt + parsing for properties
- src/lib/ai/extract-lead.ts: Prompt + parsing for leads
- Modified property-form.tsx and lead-form.tsx: Accept AI pre-fill

## Dependencies
- openai SDK
- OPENAI_API_KEY in .env
- Web Speech API (browser native)
