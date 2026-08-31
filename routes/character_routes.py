from flask import Blueprint, jsonify
from characters import CharacterRegistry

char_bp = Blueprint('characters', __name__)

@char_bp.route('/characters', methods=['GET'])
def list_characters():
    CharacterRegistry.load_all()
    chars = CharacterRegistry.list_characters()
    return jsonify([{"id": c, "name": CharacterRegistry.get(c).name} for c in chars])
