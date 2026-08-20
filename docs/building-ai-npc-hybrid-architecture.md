# Building an AI NPC with a Hybrid Architecture

**Author:** Lu Yin (陆银)  
**Project:** Lengxufan (冷旭帆)  
**GitHub:** [lengxufan-project/lengxufan-api](https://github.com/lengxufan-project/lengxufan-api)  
**Live Demo:** See GitHub README for the latest URL (currently http://139.199.168.140/)

---

## The Problem

Most AI NPCs are built directly on LLMs. Every conversation is a "restart" — emotions don't persist, memories are lost, and characters treat everyone the same way.

Pure LLM approaches are like an actor with no script, no memory, and no body. They can perform brilliantly for one scene, but they can't sustain a character across an entire story.

---

## The Solution: Hybrid Architecture

My approach splits the problem into two layers:

| Layer | Responsibility | Implementation |
|-------|---------------|----------------|
| **Inside (里子)** | Emotions, physical states, memories, trust | Python rule engine — deterministic, persistent |
| **Outside (面子)** | Natural language generation | LLM API — expressive, but constrained by the inside layer |

The code manages the character's "body". The AI manages the character's "voice".

---

## Key Features

### 1. Persistent Emotion with Circadian Rhythm

```
emotion = 0-100 (hard-capped at 85)
baseline = 50 + 15 * sin(2π * hour / 24)
```

The character's emotional state follows a 24-hour rhythm. At 3 AM, he's naturally more subdued than at 3 PM. This isn't scripted — it's a sine wave.

### 2. Offline Autonomous Behavior

When you close the browser, the character doesn't freeze. Ten minutes later, he might be having a nightmare. An hour later, his shoulder might be hurting. When you return, you see what happened while you were gone.

### 3. Identity State Machine

Different people get different reactions:

| Trigger | Layer | Behavior |
|---------|-------|----------|
| Stranger | First | Turns wrist, scans exits, reply ≤ 3 characters |
| Mentions "mother" or "plastic knife" | Second | Rubs wristband, avoids eye contact |
| Called "哥哥" by the right person | Third | Ears turn red, touches left chest, allows longer sentences |

### 4. Semantic Memory with ChromaDB

Every conversation generates a one-sentence summary stored as a vector embedding. When the user says something semantically similar, the character can retrieve the relevant past memory — even if the words don't match.

### 5. Multi-Character Shared World

Two completely different characters run on the same engine:

| | Lengxufan (冷旭帆) | Huang Jingyun (黄景云) |
|---|---|---|
| Personality | Silent, defensive | Talkative, jokes in seven dialects |
| Core objects | Plastic knife, wristband | Candy wrappers, voice recorder |
| Emotional baseline | 50 (subdued) | 55 (outwardly cheerful) |

They share a common world state (time, weather, roommate activities) and an **event bus** that lets one character's actions affect the other's emotions. When Huang Jingyun peels a candy wrapper, Lengxufan's emotion rises slightly — because he knows what that means.

---

## A Real Bug, a Real Fix

I spent two days believing the character switch worked — until I noticed Huang Jingyun pressing his left shoulder. **Left shoulder pain is Lengxufan's physical state, not Huang Jingyun's.**

The character registry loaded both data packages, but the core engine was still hardcoded to read Lengxufan's data. My tests passed, the frontend dropdown worked, the API returned 200 — but the data wasn't actually being used.

The fix: a `character_context.py` module that tells the engine which character to read from. After the fix, Huang Jingyun finally had Huang Jingyun's body — scratching his head, blinking, speaking Cantonese.

This bug taught me that in multi-layer architecture, the most dangerous errors don't crash — they just make everything *look* normal.

---

## Results

| Metric | Value |
|--------|-------|
| Test pass rate | 93.75% (Lengxufan) / 100% (Huang Jingyun) |
| Files | 72+ files, ~5,500 lines |
| Architecture epochs | 4 |
| API failover redundancy | 5 providers |
| Active characters | 2 (shared world) |
| SDK | `pip install lengxufan-engine` |

---

## Try It Yourself

```bash
git clone https://github.com/lengxufan-project/lengxufan-api.git
cd lengxufan-api/sdk
pip install -e .

python -c "
from characters import CharacterRegistry
from services.engine_service import EngineService

engine = EngineService('lengxufan')
print(engine.get_reply('你好'))
"
```

---

## Why This Matters

Most people think AI NPCs require GPT-4 and a research team. This project proves otherwise: **a single developer, working after factory shifts, can build an AI character with persistent emotions, differentiated social cognition, and offline autonomous behavior.**

The SDK is open source. You can create your own AI character by writing 13 data files — no changes to the engine needed.

---

## Project Timeline

- **April 2026**: First pure rule engine prototype
- **May 2026**: Hybrid architecture confirmed
- **July 2026**: 30-file modular refactor, public deployment
- **August 2026**: Four-stage cognitive chain, multi-character shared world, SDK v0.1
- **Ongoing**: SDK productization, open-source community building

---

**This project is under active development. Every commit is documented.**
