# character.gd
# 角色立绘节点：根据后端 state 中的 emotion / emotion_label
# 切换眼睛、嘴巴图层（图层均为场景内的 ColorRect 占位）。
# 未验证：当前环境未安装 Godot，脚本为 Godot 4.2+ 语法，需人工在编辑器中运行确认。
extends Control
class_name Character

# 四种情绪对应的眼睛图层名 / 嘴巴图层名
const EYE_LAYERS := {
	"happy": "EyesHappy",
	"neutral": "EyesNormal",
	"sad": "EyesSad",
	"angry": "EyesAngry",
}
const MOUTH_LAYERS := {
	"happy": "MouthSmile",
	"neutral": "MouthNormal",
	"sad": "MouthFrown",
	"angry": "MouthFrown",
}

# 后端中文情绪标签 -> 四种情绪
const LABEL_MAP := {
	"高涨": "happy",
	"稍好": "happy",
	"平静": "neutral",
	"低落": "sad",
}

var current_emotion := "neutral"

## 根据情绪切换图层。
# 参数可以是：
#   - 中文标签（高涨/稍好/平静/低落）
#   - 数值（0-100，对应 state.emotion）
#   - 英文关键字（happy/neutral/sad/angry）
func update_emotion(emotion: Variant) -> void:
	var key := _normalize_emotion(emotion)
	current_emotion = key
	_switch_layer_group(EYE_LAYERS, EYE_LAYERS[key])
	_switch_layer_group(MOUTH_LAYERS, MOUTH_LAYERS[key])

func _normalize_emotion(emotion: Variant) -> String:
	if emotion is String:
		var s: String = emotion
		if LABEL_MAP.has(s):
			return LABEL_MAP[s]
		var low := s.to_lower()
		if EYE_LAYERS.has(low):
			return low
		return "neutral"
	if typeof(emotion) == TYPE_FLOAT or typeof(emotion) == TYPE_INT:
		var v: float = float(emotion)
		if v >= 70.0:
			return "happy"
		elif v >= 50.0:
			return "neutral"
		elif v >= 30.0:
			return "sad"
		return "angry"
	return "neutral"

func _switch_layer_group(layer_map: Dictionary, visible_name: String) -> void:
	for layer_name in layer_map.values():
		var node := get_node_or_null(layer_name)
		if node is CanvasItem:
			(node as CanvasItem).visible = (layer_name == visible_name)
