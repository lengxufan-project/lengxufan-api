# api_client.gd
# HTTPRequest 节点：连接本地 Flask 后端 POST http://127.0.0.1:5000/api/chat
# 未验证：当前环境未安装 Godot，脚本为 Godot 4.2+ 语法，需人工在编辑器中运行确认。
extends HTTPRequest
class_name ApiClient

## 收到完整回复（已解析为 Dictionary：{"reply": String, "state": Dictionary}）
signal reply_received(reply: Dictionary)
## 请求失败（网络错误 / 非 200 / JSON 解析失败）
signal request_failed(error_msg: String)

const BASE_URL := "http://127.0.0.1:5000"

func _ready() -> void:
	request_completed.connect(_on_request_completed)

## 发送一条对话消息到后端
func send_chat(message: String, char_id: String = "lengxufan") -> void:
	var body := JSON.stringify({
		"message": message,
		"char_id": char_id,
	})
	var headers := PackedStringArray(["Content-Type: application/json"])
	# 正在请求时取消上一个，避免队列堆积
	if get_http_client_status() != HTTPClient.STATUS_DISCONNECTED:
		cancel_request()
	var err := request(BASE_URL + "/api/chat", headers, HTTPClient.METHOD_POST, body)
	if err != OK:
		request_failed.emit("请求发起失败，错误码: %d" % err)

func _on_request_completed(result: int, response_code: int, _headers: PackedStringArray, body: PackedByteArray) -> void:
	if result != HTTPRequest.RESULT_SUCCESS:
		request_failed.emit("网络错误（result=%d），请确认后端已启动：%s" % [result, BASE_URL])
		return
	if response_code != 200:
		request_failed.emit("HTTP 状态码: %d" % response_code)
		return

	var parsed = JSON.new()
	var parse_err := parsed.parse(body.get_string_from_utf8())
	if parse_err != OK:
		request_failed.emit("回复 JSON 解析失败")
		return
	if not (parsed.data is Dictionary):
		request_failed.emit("回复格式不是 JSON 对象")
		return

	reply_received.emit(parsed.data)
