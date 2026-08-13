# Building an AI NPC with a Hybrid Architecture

**Author:** Lu Yin | **Project:** Lengxufan (冷旭帆)

## The Problem

Most AI NPCs are built directly on LLMs. Every conversation is a "restart" — emotions don't persist, memories are lost, and characters treat everyone the same way.

## The Solution: Hybrid Architecture

My approach splits the problem into two layers:

| Layer | Responsibility | Implementation |
|-------|---------------|----------------|
| **Inside (里子)** | Emotions, physical states, memories, trust | Python rule engine — deterministic, persistent |
| **Outside (面子)** | Natural language generation | LLM API — expressive, but constrained by the inside layer |

The code manages the character's "body". The AI manages the character's "voice".

## Key Features

- **Emotion system** (0-100) with a 24-hour circadian rhythm
- **Offline autonomous behavior** — the character has nightmares and cleans his knife when you're gone
- **Identity state machine** — different people get different reactions (strangers get silence; a trusted person gets vulnerability)
- **Semantic episodic memory** using ChromaDB
- **Multi-character architecture** — two characters share a world state and an event bus

## Results

- 93.75% test pass rate for the silent character; 100% for the talkative one
- 60+ files, ~5500 lines, 4 architecture epochs
- SDK available: `pip install lengxufan-engine`
- Built by a single developer working after factory shifts

**GitHub:** https://github.com/lengxufan-project/lengxufan-api
