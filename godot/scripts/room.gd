# room.gd
# 房间场景主控：LineEdit + Button 发送消息到 Flask 后端，
# RichTextLabel 逐字显示回复，并按 state.emotion 切换角色表情。
# 未验证：当前环境未安装 Godot，脚本为 Godot 4.2+ 语法，需人工在编辑器中运行确认。
extends Control

@onready var api_client: ApiClient = $ApiClient
@onready var character: Character = $Character
@onready var input_edit: LineEdit = $InputBar/LineEdit
@onready var send_button: Button = $InputBar/SendButton
@onready var reply_label: RichTextLabel = $ReplyPanel/RichTextLabel

var _waiting := false

func _ready() -> void:
	send_button.pressed.connect(_on_send_pressed)
	input_edit.text_submitted.connect(func(_text: String) -> void: _on_send_pressed())
	api_client.reply_received.connect(_on_reply_received)
	api_client.request_failed.connect(_on_request_failed)
	reply_label.text = ""

func _on_send_pressed() -> void:
	if _waiting:
		return
	var message := input_edit.text.strip_edges()
	if message.is_empty():
		return
	input_edit.text = ""
	_waiting = true
	reply_label.text = "……"
	api_client.send_chat(message)

## 收到 /api/chat 的 JSON：{"reply": "...", "state": {"emotion": 65, "emotion_label": "稍好", ...}}
func _on_reply_received(data: Dictionary) -> void:
	_waiting = false
	var reply: String = data.get("reply", "……")
	_start_typewriter(reply)

	var state: Variant = data.get("state")
	if state is Dictionary:
		var d: Dictionary = state
		# 优先用中文情绪标签，其次用情绪数值
		if d.has("emotion_label"):
			character.update_emotion(d["emotion_label"])
		elif d.has("emotion"):
			character.update_emotion(d["emotion"])

func _on_request_failed(error_msg: String) -> void:
	_waiting = false
	_start_typewriter("（连接失败）%s\n请确认后端：python backend/run.py" % error_msg)

## 用 RichTextLabel.visible_ratio 做逐字显示
func _start_typewriter(text: String) -> void:
	reply_label.text = text
	reply_label.visible_ratio = 0.0
	var duration: float = max(1.0, float(text.length()) * 0.05)
	var tween := create_tween()
	tween.tween_property(reply_label, "visible_ratio", 1.0, duration)
