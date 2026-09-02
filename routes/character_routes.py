from flask import Blueprint, jsonify
from characters import CharacterRegistry
from services.engine_service import (
    get_engine_status, get_engine_full_state, get_engine_memories
)

char_bp = Blueprint('characters', __name__)


@char_bp.route('/characters', methods=['GET'])
def list_characters():
    CharacterRegistry.load_all()
    chars = CharacterRegistry.list_characters()
    return jsonify([{"id": c, "name": CharacterRegistry.get(c).name} for c in chars])


@char_bp.route('/characters/status', methods=['GET'])
def all_characters_status():
    CharacterRegistry.load_all()
    chars = CharacterRegistry.list_characters()
    result = []
    for cid in chars:
        try:
            config = CharacterRegistry.get(cid)
            status = get_engine_status(cid)
            if status:
                result.append({
                    "id": cid,
                    "name": config.name,
                    "emotion_label": status.get("emotion_label", "--"),
                    "relationship_stage": status.get("relationship_stage", "--")
                })
            else:
                result.append({
                    "id": cid,
                    "name": config.name,
                    "emotion_label": "--",
                    "relationship_stage": "--"
                })
        except Exception:
            result.append({
                "id": cid,
                "name": cid,
                "emotion_label": "--",
                "relationship_stage": "--"
            })
    return jsonify({"characters": result})


@char_bp.route('/characters/<char_id>', methods=['GET'])
def character_detail(char_id):
    CharacterRegistry.load_all()
    try:
        config = CharacterRegistry.get(char_id)
    except ValueError:
        return jsonify({"error": f"角色不存在: {char_id}"}), 404

    current_state = get_engine_full_state(char_id)

    return jsonify({
        "id": char_id,
        "name": config.name,
        "persona": config.persona,
        "autobiographical": config.autobiographical,
        "milestones": config.milestones,
        "current_state": current_state
    })


@char_bp.route('/characters/<char_id>/memories', methods=['GET'])
def character_memories(char_id):
    memories = get_engine_memories(char_id)
    return jsonify({"memories": memories})